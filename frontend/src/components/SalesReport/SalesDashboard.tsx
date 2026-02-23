import { useState, useEffect } from 'react';
import TopNavbar from '../TopNavbar';
import api from '../../services/api';

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

interface SalesAnalyticsResponse {
  weekly: WeeklySalesDataPoint[];
  today_hourly: TodaySalesDataPoint[];
  stats: Statistics;
}

interface HoveredValuePoint {
  x: number;
  y: number;
  value: number;
  date: string;
}

// ============================================================
// CONSTANTS
// ============================================================

const CACHE_KEY = 'lucky_boba_sales_analytics';
const WEEKLY_HEIGHT = 200;
const FIXED_TODAY_MAX = 5000;
const TODAY_HEIGHT = 180;
const yAxisLabels = [5000, 4000, 3000, 2000, 1000, 0];

// ============================================================
// COMPONENT
// ============================================================

const SalesDashboard = () => {
  const [analytics, setAnalytics] = useState<SalesAnalyticsResponse | null>(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  });

  const [loading, setLoading] = useState(!analytics);
  const [error, setError] = useState<string | null>(null);
  const [hoveredValue, setHoveredValue] = useState<HoveredValuePoint | null>(null);

  // ============================================================
  // FETCH
  // ============================================================

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/sales-analytics');
      const newData: SalesAnalyticsResponse = response.data;
      setAnalytics(newData);
      localStorage.setItem(CACHE_KEY, JSON.stringify(newData));
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // ============================================================
  // LOADING STATE
  // ============================================================

  if (loading && !analytics) {
    return (
      <div className="flex-1 bg-[#f8f6ff] h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#3b2063] mx-auto" />
          <p className="mt-4 text-[#3b2063] font-bold">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // ERROR STATE
  // ============================================================

  if (error && !analytics) {
    return (
      <div className="flex-1 bg-[#f8f6ff] h-full flex items-center justify-center p-4">
        <div className="text-center bg-white p-8 rounded-3xl shadow-xl max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h3 className="text-xl font-bold text-[#3b2063] mb-2">Error Loading Dashboard</h3>
          <p className="text-sm text-zinc-500 mb-6 bg-zinc-50 p-4 rounded-xl">{error}</p>
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
                  localStorage.removeItem('lucky_boba_authenticated');
                  window.location.href = '/login';
                }
              }}
              className="bg-zinc-500 text-white px-6 py-2 rounded-full font-bold hover:bg-zinc-600 transition-colors"
            >
              Clear & Re-login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  // ============================================================
  // DERIVED DATA
  // ============================================================

  const { weekly: weeklySalesData, today_hourly: todayData, stats: statistics } = analytics;

const weeklyTotal = weeklySalesData.reduce((acc, d) => acc + Number(d.value), 0);

  const dateRange = {
    start: weeklySalesData.length > 0 ? `${weeklySalesData[0].date}, 2026` : '—',
    end: weeklySalesData.length > 0 ? `${weeklySalesData[weeklySalesData.length - 1].date}, 2026` : '—',
  };

  // Weekly line graph
  const dynamicWeeklyMax = weeklySalesData.length > 0
    ? Math.max(...weeklySalesData.map((d) => d.value), 10000)
    : 10000;

  const getLineY = (value: number) =>
    WEEKLY_HEIGHT - (value / dynamicWeeklyMax) * WEEKLY_HEIGHT;

  const linePoints: HoveredValuePoint[] = weeklySalesData.map((d, index) => {
    const totalPoints = weeklySalesData.length - 1;
    return {
      x: totalPoints > 0 ? (index / totalPoints) * 100 : 50,
      y: getLineY(d.value),
      value: d.value,
      date: `${d.day} - ${d.date}`,
    };
  });

  // Today's bar graph
  const getBarHeight = (value: number) =>
    Math.min((value / FIXED_TODAY_MAX) * TODAY_HEIGHT, TODAY_HEIGHT);

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="flex-1 bg-[#f8f6ff] h-full flex flex-col overflow-hidden">
      <TopNavbar />

      <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6">

        {/* ── WEEKLY SALES GRAPH ── */}
        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-purple-900/5 border border-zinc-100 p-8 flex flex-col">
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

          {weeklySalesData.length > 0 ? (
            <div className="relative w-full h-64 pl-12 pb-8">
              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 bottom-8 w-10 flex flex-col justify-between text-right text-[9px] font-bold text-zinc-300">
                <span>10k</span><span>7.5k</span><span>5k</span><span>2.5k</span><span>0</span>
              </div>
              {/* Grid lines */}
              <div className="absolute left-12 right-0 top-0 bottom-8 flex flex-col justify-between pointer-events-none">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-full h-px bg-zinc-50" />
                ))}
              </div>
              {/* SVG line + dots */}
              <div className="absolute inset-0 left-12 bottom-8 right-0 top-0">
                <svg
                  className="w-full h-full overflow-visible"
                  viewBox={`0 0 100 ${WEEKLY_HEIGHT}`}
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="gradientStroke" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#3b2063" />
                      <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                  </defs>
                  <polyline
                    fill="none"
                    stroke="url(#gradientStroke)"
                    strokeWidth="3"
                    points={linePoints.map((p) => `${p.x},${p.y}`).join(' ')}
                    vectorEffect="non-scaling-stroke"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {linePoints.map((p, i) => (
                  <div
                    key={i}
                    className="absolute w-3 h-3 bg-white border-[3px] border-[#3b2063] rounded-full hover:scale-150 transition-transform cursor-pointer z-10"
                    style={{
                      left: `${p.x}%`,
                      top: `${(p.y / WEEKLY_HEIGHT) * 100}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    onMouseEnter={() => setHoveredValue(p)}
                    onMouseLeave={() => setHoveredValue(null)}
                  />
                ))}
                {hoveredValue && (
                  <div
                    className="absolute bg-[#3b2063] text-white px-3 py-2 rounded-xl shadow-xl z-20 flex flex-col items-center pointer-events-none transform -translate-x-1/2 -translate-y-full -mt-4"
                    style={{
                      left: `${hoveredValue.x}%`,
                      top: `${(hoveredValue.y / WEEKLY_HEIGHT) * 100}%`,
                    }}
                  >
                    <span className="text-[10px] font-bold opacity-70 whitespace-nowrap">{hoveredValue.date}</span>
                    <span className="text-sm font-black whitespace-nowrap">₱ {hoveredValue.value.toLocaleString()}</span>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-[#3b2063] rotate-45" />
                  </div>
                )}
              </div>
              {/* X-axis labels */}
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
            <div className="flex items-center justify-center h-64 text-zinc-400 font-bold text-sm">
              No sales data available for this week
            </div>
          )}
        </div>

        {/* ── STATS + TODAY'S BAR GRAPH ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[300px]">

          {/* Stats cards */}
<div className="grid grid-cols-2 gap-4 content-start">
  {([
    { label: 'Beginning Sales', value: `₱ ${(statistics.beginning_sales ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
    { label: 'Today Sales',     value: `₱ ${(statistics.today_sales ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,     highlight: true },
    { label: 'Ending Sales',    value: `₱ ${(statistics.ending_sales ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
    { label: 'Cancelled Sales', value: `₱ ${(statistics.cancelled_sales ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, color: 'text-red-500' },
    { label: 'Beginning OR',    value: statistics.beginning_or ?? '—' },
    { label: 'Ending OR',       value: statistics.ending_or ?? '—' },
  ] as { label: string; value: string; highlight?: boolean; color?: string }[]).map((item, i) => (
    <div key={i} className="bg-white p-5 rounded-3xl border border-zinc-100 shadow-sm flex flex-col justify-center">
      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">{item.label}</p>
      <p className={`text-lg font-black ${item.color ?? (item.highlight ? 'text-emerald-500' : 'text-[#3b2063]')}`}>
        {item.value}
      </p>
    </div>
  ))}
</div>

          {/* Today's bar chart */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[#3b2063] font-black text-sm uppercase tracking-widest">Today's Sales Report</h3>
              <span className="bg-emerald-100 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-bold">Live</span>
            </div>

            {todayData.length > 0 ? (
              <div className="relative w-full flex-1 pl-12 pb-6">
                {/* Y-axis labels */}
                <div className="absolute left-0 top-0 bottom-6 w-10 flex flex-col justify-between text-right text-[9px] font-bold text-zinc-400">
                  {yAxisLabels.map((val) => (
                    <span key={val}>{val === 0 ? '0' : val}</span>
                  ))}
                </div>
                {/* Grid lines */}
                <div className="absolute left-12 right-0 top-0 bottom-6 flex flex-col justify-between pointer-events-none">
                  {yAxisLabels.map((val) => (
                    <div key={`grid-${val}`} className="w-full h-px bg-zinc-100" />
                  ))}
                </div>
                {/* Bars */}
                <div className="absolute inset-0 left-12 bottom-6 right-0 top-0 flex items-end justify-between px-2">
                  {todayData.map((d, i) => {
                    const percentageHeight = (getBarHeight(d.value) / TODAY_HEIGHT) * 100;
                    return (
                      <div key={i} className="relative w-full mx-1 h-full flex items-end group">
                        <div
                          className="w-full bg-[#3b2063] rounded-t-sm transition-all duration-500 hover:bg-[#5b3299] relative"
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
                {/* X-axis labels */}
                <div className="absolute left-12 right-0 bottom-0 flex justify-between px-2 pt-2">
                  {todayData.map((d, i) => (
                    <div key={i} className="w-full text-center text-[8px] font-bold text-zinc-400 mx-1">
                      {d.time}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center flex-1 text-zinc-400 font-bold text-sm">
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
