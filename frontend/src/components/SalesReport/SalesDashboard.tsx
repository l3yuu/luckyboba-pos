import { useState, useEffect } from 'react';
import TopNavbar from '../TopNavbar';

// ============================================================
// TYPE DEFINITIONS
// ============================================================

interface WeeklySalesDataPoint {
  day: string;
  date: string;
  value: number;
  full_date: string;
}

interface TodaySalesDataPoint {
  time: string;
  value: number;
}

interface Statistics {
  beginning_sales: number;
  today_sales: number;
  ending_sales: number;
  cancelled_sales: number;
  beginning_or: string;
  ending_or: string;
}

interface WeeklySalesResponse {
  data: WeeklySalesDataPoint[];
  total_revenue: number;
  start_date: string;
  end_date: string;
  current_week_start: string;
}

interface TodaySalesResponse {
  data: TodaySalesDataPoint[];
  date: string;
}

interface DashboardDataResponse {
  success: boolean;
  data: {
    weekly_sales: WeeklySalesResponse;
    today_sales: TodaySalesResponse;
    statistics: Statistics;
  };
  message?: string;
}

interface LinePoint {
  x: number;
  y: number;
  value: number;
  date: string;
}

interface DateRange {
  start: string;
  end: string;
}

// ============================================================
// CONSTANTS
// ============================================================

const WEEKLY_MAX = 10000;
const WEEKLY_HEIGHT = 200;
const TODAY_MAX = 20000;
const TODAY_HEIGHT = 180;

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const DEBUG_MODE = false;

// ============================================================
// HELPER FUNCTION - LUCKY BOBA SPECIFIC TOKEN RETRIEVAL
// ============================================================

const getAuthToken = (): { token: string | null; source: string; isMock: boolean } => {
  const luckyBobaToken = localStorage.getItem('lucky_boba_token');
  if (luckyBobaToken && !luckyBobaToken.startsWith('mock-')) {
    return { 
      token: luckyBobaToken, 
      source: 'localStorage.lucky_boba_token',
      isMock: false
    };
  }

  if (luckyBobaToken && luckyBobaToken.startsWith('mock-')) {
    console.warn('⚠️ Mock token detected in lucky_boba_token');
  }

  const authToken = localStorage.getItem('auth_token');
  if (authToken && !authToken.startsWith('mock-')) {
    return { 
      token: authToken, 
      source: 'localStorage.auth_token',
      isMock: false
    };
  }

  if (authToken && authToken.startsWith('mock-')) {
    console.warn('⚠️ Mock token detected in auth_token');
  }

  const token = localStorage.getItem('token');
  if (token && !token.startsWith('mock-')) {
    return { 
      token, 
      source: 'localStorage.token',
      isMock: false
    };
  }

  const userDataLocal = localStorage.getItem('user');
  if (userDataLocal) {
    try {
      const parsed = JSON.parse(userDataLocal);
      if (parsed.token && !parsed.token.startsWith('mock-')) {
        return { 
          token: parsed.token, 
          source: 'localStorage.user.token',
          isMock: false
        };
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      // Not valid JSON
    }
  }

  const mockToken = luckyBobaToken || authToken;
  if (mockToken) {
    return {
      token: null,
      source: 'mock token detected',
      isMock: true
    };
  }

  return { token: null, source: 'none', isMock: false };
};

const isValidSanctumToken = (token: string): boolean => {
  return /^\d+\|/.test(token);
};

// ============================================================
// MAIN COMPONENT
// ============================================================

const SalesDashboard: React.FC = () => {
  const [weeklySalesData, setWeeklySalesData] = useState<WeeklySalesDataPoint[]>([]);
  const [todaySalesData, setTodaySalesData] = useState<TodaySalesDataPoint[]>([]);
  const [statistics, setStatistics] = useState<Statistics>({
    beginning_sales: 0,
    today_sales: 0,
    ending_sales: 0,
    cancelled_sales: 0,
    beginning_or: '00000',
    ending_or: '00000'
  });
  const [weeklyTotal, setWeeklyTotal] = useState<number>(0);
  const [dateRange, setDateRange] = useState<DateRange>({ start: '', end: '' });

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [hoveredValue, setHoveredValue] = useState<LinePoint | null>(null);

  useEffect(() => {
    fetchDashboardData();
    
    const refreshInterval = setInterval(() => {
      fetchDashboardData();
    }, 30000);
    
    const weekCheckInterval = setInterval(() => {
      checkForNewWeek();
    }, 600000);
    
    return () => {
      clearInterval(refreshInterval);
      clearInterval(weekCheckInterval);
    };
  }, []);

  const checkForNewWeek = async () => {
    try {
      const { token } = getAuthToken();
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/dashboard/weekly-sales`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data.current_week_start) {
          const serverWeekStart = result.data.current_week_start;
          const lastKnownWeek = localStorage.getItem('lastWeeklyRefresh');

          if (lastKnownWeek && lastKnownWeek !== serverWeekStart) {
            console.log('📅 New week detected from server!');
            console.log('  Previous week:', lastKnownWeek);
            console.log('  Current week:', serverWeekStart);
            console.log('🔄 Refreshing dashboard...');
            
            localStorage.setItem('lastWeeklyRefresh', serverWeekStart);
            fetchDashboardData();
          }
        }
      }
    } catch (err) {
      if (DEBUG_MODE) {
        console.log('Week check failed:', err);
      }
    }
  };

  const fetchDashboardData = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const { token, source, isMock } = getAuthToken();

      if (DEBUG_MODE) {
        console.log('🔍 Lucky Boba Token Debug:');
        console.log('  Source:', source);
        console.log('  Token exists:', !!token);
        console.log('  Is mock token:', isMock);
        if (token) {
          console.log('  Token preview:', token.substring(0, 20) + '...');
          console.log('  Valid Sanctum format:', isValidSanctumToken(token));
        }
      }

      if (isMock) {
        throw new Error(
          `🚫 MOCK TOKEN DETECTED!\n\n` +
          `You're using a fake/mock token for testing, but the dashboard needs a real Laravel Sanctum token.\n\n` +
          `To fix this:\n` +
          `1. Clear mock tokens: localStorage.clear()\n` +
          `2. Log in through your app to get a real token\n` +
          `3. Make sure your login calls POST /api/login\n\n` +
          `Real tokens look like: 1|aBcDeFgHiJkLmN...\n` +
          `Mock tokens look like: mock-boba-...`
        );
      }

      if (!token) {
        const allKeys = Object.keys(localStorage);
        throw new Error(
          `❌ No valid authentication token found.\n\n` +
          `Checked: lucky_boba_token, auth_token, token\n` +
          `Available keys: ${allKeys.join(', ')}\n\n` +
          `Please log in to get a real Sanctum token.`
        );
      }

      if (!isValidSanctumToken(token)) {
        throw new Error(
          `⚠️ Invalid token format!\n\n` +
          `Token source: ${source}\n` +
          `Token starts with: ${token.substring(0, 15)}...\n\n` +
          `Expected format: number|random_string (e.g., 1|aBcDeFg...)\n` +
          `Your token format looks incorrect.\n\n` +
          `Please log in again to get a valid Sanctum token.`
        );
      }

      const url = `${API_BASE_URL}/dashboard/data`;
      
      if (DEBUG_MODE) {
        console.log('📡 Fetching from:', url);
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      });

      if (DEBUG_MODE) {
        console.log('📥 Response status:', response.status);
      }

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(
            `🔐 Authentication Failed (401)\n\n` +
            `Token source: ${source}\n` +
            `Token format valid: ${isValidSanctumToken(token) ? 'Yes' : 'No'}\n\n` +
            `Possible causes:\n` +
            `• Token has expired\n` +
            `• Token was revoked\n` +
            `• Token is invalid\n\n` +
            `Solution: Log out and log in again to get a fresh token.`
          );
        }
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText || 'Failed to fetch dashboard data'}`);
      }

      const result: DashboardDataResponse = await response.json();

      if (DEBUG_MODE) {
        console.log('✅ Data received successfully');
      }

      if (result.success) {
        const { weekly_sales, today_sales, statistics: stats } = result.data;
        
        setWeeklySalesData(weekly_sales.data);
        setWeeklyTotal(weekly_sales.total_revenue);
        setDateRange({
          start: weekly_sales.start_date,
          end: weekly_sales.end_date
        });
        setTodaySalesData(today_sales.data);
        setStatistics(stats);

        // Store current week start for auto-refresh detection
        if (weekly_sales.current_week_start) {
          const lastKnownWeek = localStorage.getItem('lastWeeklyRefresh');
          if (!lastKnownWeek) {
            localStorage.setItem('lastWeeklyRefresh', weekly_sales.current_week_start);
          } else if (lastKnownWeek !== weekly_sales.current_week_start) {
            console.log('🎉 New week started!');
            localStorage.setItem('lastWeeklyRefresh', weekly_sales.current_week_start);
          }
        }
      } else {
        throw new Error(result.message || 'Failed to load data');
      }
    } catch (err) {
      console.error('❌ Error fetching dashboard data:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getLineY = (value: number): number => {
    return WEEKLY_HEIGHT - (value / WEEKLY_MAX) * WEEKLY_HEIGHT;
  };

  const linePoints: LinePoint[] = weeklySalesData.map((data, index) => ({
    x: (index / (weeklySalesData.length - 1)) * 100,
    y: getLineY(data.value),
    value: data.value,
    date: `${data.day} - ${data.date}`
  }));

  const getBarHeight = (value: number): number => {
    return (value / TODAY_MAX) * TODAY_HEIGHT;
  };

  if (loading && weeklySalesData.length === 0) {
    return (
      <div className="flex-1 bg-[#f8f6ff] h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#3b2063] mx-auto"></div>
          <p className="mt-4 text-[#3b2063] font-bold">Loading dashboard...</p>
        </div>
      </div>
    );
  }
<<<<<<< HEAD
=======

>>>>>>> a89bca9846cf1b82f051ea4c9f922079c2d1c3f6
  if (error) {
    const { isMock } = getAuthToken();
    
    return (
      <div className="flex-1 bg-[#f8f6ff] h-full flex items-center justify-center p-4">
        <div className="text-center bg-white p-8 rounded-3xl shadow-xl max-w-2xl">
          <div className="text-red-500 text-5xl mb-4">
            {isMock ? '🚫' : '⚠️'}
          </div>
          <h3 className="text-xl font-bold text-[#3b2063] mb-2">
            {isMock ? 'Mock Token Detected' : 'Error Loading Dashboard'}
          </h3>
          <pre className="text-left text-sm text-zinc-600 mb-4 whitespace-pre-wrap bg-zinc-50 p-4 rounded-lg overflow-auto max-h-60">
            {error}
          </pre>

          <div className="flex gap-3 justify-center flex-wrap">
            <button
              onClick={fetchDashboardData}
              className="bg-[#3b2063] text-white px-6 py-2 rounded-full font-bold hover:bg-[#5b3299] transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => {
                if (confirm('This will clear all tokens and redirect to login. Continue?')) {
                  localStorage.removeItem('lucky_boba_token');
                  localStorage.removeItem('auth_token');
                  localStorage.removeItem('token');
                  localStorage.removeItem('lucky_boba_authenticated');
                  window.location.href = '/login';
                }
              }}
              className="bg-zinc-500 text-white px-6 py-2 rounded-full font-bold hover:bg-zinc-600 transition-colors"
            >
              Clear & Re-login
            </button>
            {isMock && (
              <button
                onClick={() => {
                  console.log('Current tokens:', {
                    lucky_boba_token: localStorage.getItem('lucky_boba_token'),
                    auth_token: localStorage.getItem('auth_token'),
                    token: localStorage.getItem('token')
                  });
                  alert('Check the browser console for token details');
                }}
                className="bg-blue-500 text-white px-6 py-2 rounded-full font-bold hover:bg-blue-600 transition-colors"
              >
                Show Tokens in Console
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#f8f6ff] h-full flex flex-col overflow-hidden">
      <TopNavbar />

      <div className="flex-1 overflow-y-auto p-8 flex flex-col">

        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-purple-900/5 border border-zinc-100 p-8 flex flex-col mb-6">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-[#3b2063] font-black text-xl uppercase tracking-widest">Weekly Sales</h2>
              <p className="text-zinc-400 font-bold text-xs mt-1">
                {dateRange.start} — {dateRange.end}
              </p>
            </div>
            <div className="text-right">
              <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">Total Revenue</p>
              <p className="text-2xl font-black text-emerald-500">
                ₱ {weeklyTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
<<<<<<< HEAD
=======

>>>>>>> a89bca9846cf1b82f051ea4c9f922079c2d1c3f6
          {weeklySalesData.length > 0 ? (
            <div className="relative w-full h-64 pl-12 pb-8">
              <div className="absolute left-0 top-0 bottom-8 w-10 flex flex-col justify-between text-right text-[9px] font-bold text-zinc-300">
                <span>10k</span><span>7.5k</span><span>5k</span><span>2.5k</span><span>0</span>
              </div>
              <div className="absolute left-12 right-0 top-0 bottom-8 flex flex-col justify-between pointer-events-none">
                {[...Array(5)].map((_, i) => <div key={i} className="w-full h-px bg-zinc-50"></div>)}
              </div>
              <div className="absolute inset-0 left-12 bottom-8 right-0 top-0">
                <svg className="w-full h-full overflow-visible" viewBox={`0 0 100 ${WEEKLY_HEIGHT}`} preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="gradientStroke" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#3b2063" />
                      <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                  </defs>
                  <polyline
                    fill="none" stroke="url(#gradientStroke)" strokeWidth="3"
                    points={linePoints.map(p => `${p.x},${p.y}`).join(' ')}
                    vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round"
                  />
                </svg>
                {linePoints.map((p, i) => (
                  <div key={i}
                    className="absolute w-3 h-3 bg-white border-[3px] border-[#3b2063] rounded-full hover:scale-150 transition-transform cursor-pointer z-10"
                    style={{ left: `${p.x}%`, top: `${(p.y / WEEKLY_HEIGHT) * 100}%`, transform: 'translate(-50%, -50%)' }}
                    onMouseEnter={() => setHoveredValue(p)} onMouseLeave={() => setHoveredValue(null)}
                  />
                ))}
                {hoveredValue && (
                  <div className="absolute bg-[#3b2063] text-white px-3 py-2 rounded-xl shadow-xl z-20 flex flex-col items-center pointer-events-none transform -translate-x-1/2 -translate-y-full -mt-4 transition-all"
                    style={{ left: `${hoveredValue.x}%`, top: `${(hoveredValue.y / WEEKLY_HEIGHT) * 100}%` }}>
                    <span className="text-[10px] font-bold opacity-70 whitespace-nowrap">{hoveredValue.date}</span>
                    <span className="text-sm font-black whitespace-nowrap">₱ {hoveredValue.value.toLocaleString()}</span>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-[#3b2063] rotate-45"></div>
                  </div>
                )}
              </div>
              <div className="absolute left-12 right-0 bottom-0 flex justify-between text-[10px] font-bold text-zinc-400 pt-2">
                {weeklySalesData.map((d, i) => (
                  <div key={i} className="text-center w-8 -ml-4 flex flex-col">
                    <span className="text-[#3b2063]">{d.day}</span>
                    <span className="text-[8px] text-zinc-300 font-normal">{d.date.split(' ')[1]}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-zinc-400">
              No sales data available for this week
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full min-h-[300px]">
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Beginning Sales", value: `₱ ${statistics.beginning_sales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
              { label: "Today Sales", value: `₱ ${statistics.today_sales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, highlight: true },
              { label: "Ending Sales", value: `₱ ${statistics.ending_sales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
              { label: "Cancelled Sales", value: `₱ ${statistics.cancelled_sales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: "text-red-500" },
              { label: "Beginning OR", value: statistics.beginning_or },
              { label: "Ending OR", value: statistics.ending_or }
            ].map((item, i) => (
              <div key={i} className="bg-white p-5 rounded-3xl border border-zinc-100 shadow-sm flex flex-col justify-center">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">{item.label}</p>
                <p className={`text-lg font-black ${item.color ? item.color : (item.highlight ? 'text-emerald-500' : 'text-[#3b2063]')}`}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>
<<<<<<< HEAD
=======

>>>>>>> a89bca9846cf1b82f051ea4c9f922079c2d1c3f6
          <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[#3b2063] font-black text-sm uppercase tracking-widest">Today's Sales Report</h3>
              <span className="bg-emerald-100 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-bold">Live</span>
            </div>

            {todaySalesData.length > 0 ? (
              <div className="relative w-full flex-1 pl-10 pb-6">
                <div className="absolute left-0 top-0 bottom-6 w-8 flex flex-col justify-between text-right text-[9px] font-bold text-zinc-300">
                  <span>20k</span><span>15k</span><span>10k</span><span>5k</span><span>0</span>
                </div>
                <div className="absolute left-10 right-0 top-0 bottom-6 flex flex-col justify-between pointer-events-none">
                  {[...Array(5)].map((_, i) => <div key={i} className="w-full h-px bg-zinc-50"></div>)}
                </div>
                <div className="absolute inset-0 left-10 bottom-6 right-0 top-0 flex items-end justify-between px-2">
                  {todaySalesData.map((d, i) => {
                    const barHeight = getBarHeight(d.value);
                    const percentageHeight = (barHeight / TODAY_HEIGHT) * 100;
                    return (
                      <div key={i} className="relative w-full mx-1 h-full flex items-end group">
                        <div
                          className="w-full bg-[#3b2063] rounded-t-lg transition-all duration-500 hover:bg-[#5b3299] relative"
                          style={{ height: `${percentageHeight}%` }}
                        >
                          <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] font-bold px-2 py-1 rounded-lg transition-opacity pointer-events-none whitespace-nowrap z-20">
                            ₱ {d.value.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="absolute left-10 right-0 bottom-0 flex justify-between px-2 pt-2">
                  {todaySalesData.map((d, i) => (
                    <div key={i} className="w-full text-center text-[9px] font-bold text-zinc-400 mx-1">
                      {d.time}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center flex-1 text-zinc-400">
                No sales data available for today
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


export default SalesDashboard;
