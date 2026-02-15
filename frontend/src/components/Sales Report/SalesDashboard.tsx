import { useState, useEffect } from 'react';
import TopNavbar from '../TopNavbar';
import api from '../../services/api';
import type { 
  SalesAnalyticsResponse, 
  HoveredValuePoint 
} from '../../types/analytics';

const WEEKLY_HEIGHT = 200;
const TODAY_HEIGHT = 180;

const SalesDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<SalesAnalyticsResponse | null>(null);
  const [hoveredValue, setHoveredValue] = useState<HoveredValuePoint | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await api.get('/sales-analytics');
        setAnalytics(response.data);
      } catch (error) {
        console.error("Failed to load analytics:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading || !analytics) {
    return (
      <div className="flex-1 bg-[#f8f6ff] h-full flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3b2063]"></div>
        <p className="mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Loading Analytics...</p>
      </div>
    );
  }

  const { weekly, today_hourly: todayData, stats } = analytics;

  // Calculate max values for scaling
  const WEEKLY_MAX = weekly.length > 0 
    ? Math.max(...weekly.map(d => d.value), 10000) 
    : 10000;

  const TODAY_MAX = todayData.length > 0 
    ? Math.max(...todayData.map(d => d.value), 20000) 
    : 20000;

  // Helper functions
  const getLineY = (value: number) => WEEKLY_HEIGHT - (value / WEEKLY_MAX) * WEEKLY_HEIGHT;
  
  const linePoints = weekly.map((data, index) => {
    const totalPoints = weekly.length - 1;
    return {
      x: totalPoints > 0 ? (index / totalPoints) * 100 : 50,
      y: getLineY(data.value),
      value: data.value,
      date: `${data.day} - ${data.date}`
    };
  });

  const getBarHeight = (value: number) => (value / TODAY_MAX) * TODAY_HEIGHT;

  // Format date range for header
  const dateRangeText = weekly.length > 0 
    ? `${weekly[0].date}, 2026 — ${weekly[weekly.length - 1].date}, 2026`
    : 'No data available';

  return (
    <div className="flex-1 bg-[#f8f6ff] h-full flex flex-col overflow-hidden">
      
      <TopNavbar />

      <div className="flex-1 overflow-y-auto p-8 flex flex-col">
        
        {/* === TOP SECTION: WEEKLY SALES LINE GRAPH === */}
        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-purple-900/5 border border-zinc-100 p-8 flex flex-col mb-6">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-[#3b2063] font-black text-xl uppercase tracking-widest">Weekly Sales</h2>
              <p className="text-zinc-400 font-bold text-xs mt-1">{dateRangeText}</p>
            </div>
            <div className="text-right">
              <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">Total Revenue</p>
              <p className="text-2xl font-black text-emerald-500">₱ {stats.total_revenue.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
          </div>

          <div className="relative w-full h-64 pl-12 pb-8">
            {/* Y-Axis Labels */}
            <div className="absolute left-0 top-0 bottom-8 w-10 flex flex-col justify-between text-right text-[9px] font-bold text-zinc-300">
              <span>{Math.round(WEEKLY_MAX/1000)}k</span>
              <span>{Math.round((WEEKLY_MAX*0.75)/1000)}k</span>
              <span>{Math.round((WEEKLY_MAX*0.5)/1000)}k</span>
              <span>{Math.round((WEEKLY_MAX*0.25)/1000)}k</span>
              <span>0</span>
            </div>
            
            {/* Grid Lines */}
            <div className="absolute left-12 right-0 top-0 bottom-8 flex flex-col justify-between pointer-events-none">
              {[...Array(5)].map((_, i) => <div key={i} className="w-full h-px bg-zinc-50"></div>)}
            </div>
            
            {/* SVG Line Chart */}
            <div className="absolute inset-0 left-12 bottom-8 right-0 top-0">
              <svg className="w-full h-full overflow-visible" viewBox={`0 0 100 ${WEEKLY_HEIGHT}`} preserveAspectRatio="none">
                <defs>
                  <linearGradient id="gradientStroke" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#3b2063" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                </defs>
                {linePoints.length > 1 && (
                  <polyline 
                    fill="none" 
                    stroke="url(#gradientStroke)" 
                    strokeWidth="3" 
                    points={linePoints.map(p => `${p.x},${p.y}`).join(' ')} 
                    vectorEffect="non-scaling-stroke" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                )}
              </svg>
              
              {/* Data points */}
              {linePoints.map((p, i) => (
                <div 
                  key={i} 
                  className="absolute w-3 h-3 bg-white border-[3px] border-[#3b2063] rounded-full hover:scale-150 transition-transform cursor-pointer z-10"
                  style={{ left: `${p.x}%`, top: `${(p.y / WEEKLY_HEIGHT) * 100}%`, transform: 'translate(-50%, -50%)' }}
                  onMouseEnter={() => setHoveredValue(p)} 
                  onMouseLeave={() => setHoveredValue(null)}
                />
              ))}
              
              {/* Hover tooltip */}
              {hoveredValue && (
                <div 
                  className="absolute bg-[#3b2063] text-white px-3 py-2 rounded-xl shadow-xl z-20 flex flex-col items-center pointer-events-none transform -translate-x-1/2 -translate-y-full -mt-4 transition-all"
                  style={{ left: `${hoveredValue.x}%`, top: `${(hoveredValue.y / WEEKLY_HEIGHT) * 100}%` }}
                >
                  <span className="text-[10px] font-bold opacity-70 whitespace-nowrap">{hoveredValue.date}</span>
                  <span className="text-sm font-black whitespace-nowrap">₱ {hoveredValue.value.toLocaleString()}</span>
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-[#3b2063] rotate-45"></div>
                </div>
              )}
            </div>
            
            {/* X-Axis Labels */}
            <div className="absolute left-12 right-0 bottom-0 flex justify-between text-[10px] font-bold text-zinc-400 pt-2">
              {weekly.map((d, i) => (
                <div key={i} className="text-center w-8 -ml-4 flex flex-col">
                  <span className="text-[#3b2063]">{d.day}</span>
                  <span className="text-[8px] text-zinc-300 font-normal">{d.date.split(' ')[1]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* === BOTTOM SECTION: STATS & BAR GRAPH === */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full min-h-75">
          
          {/* LEFT: Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Beginning Sales", value: "₱ 0.00" },
              { label: "Today Sales", value: `₱ ${stats.today_sales.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, highlight: true },
              { label: "Ending Sales", value: `₱ ${stats.today_sales.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
              { label: "Cancelled Sales", value: `₱ ${stats.cancelled_sales.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: "text-red-500" },
              { label: "Beginning OR", value: stats.beginning_or },
              { label: "Ending OR", value: stats.ending_or }
            ].map((item, i) => (
              <div key={i} className="bg-white p-5 rounded-3xl border border-zinc-100 shadow-sm flex flex-col justify-center">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">{item.label}</p>
                <p className={`text-lg font-black ${item.color ? item.color : (item.highlight ? 'text-emerald-500' : 'text-[#3b2063]')}`}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          {/* RIGHT: Bar Graph */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[#3b2063] font-black text-sm uppercase tracking-widest">Today's Sales Report</h3>
              <span className="bg-emerald-100 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-bold">Live</span>
            </div>

            <div className="relative w-full flex-1 pl-10 pb-6">
              {/* Y-Axis Labels */}
              <div className="absolute left-0 top-0 bottom-6 w-8 flex flex-col justify-between text-right text-[9px] font-bold text-zinc-300">
                <span>{Math.round(TODAY_MAX/1000)}k</span>
                <span>{Math.round((TODAY_MAX*0.75)/1000)}k</span>
                <span>{Math.round((TODAY_MAX*0.5)/1000)}k</span>
                <span>{Math.round((TODAY_MAX*0.25)/1000)}k</span>
                <span>0</span>
              </div>

              {/* Grid Lines */}
              <div className="absolute left-10 right-0 top-0 bottom-6 flex flex-col justify-between pointer-events-none">
                {[...Array(5)].map((_, i) => <div key={i} className="w-full h-px bg-zinc-50"></div>)}
              </div>

              {/* Bars Area */}
              <div className="absolute inset-0 left-10 bottom-6 right-0 top-0 flex items-end justify-between px-2">
                {todayData.length > 0 ? todayData.map((d, i) => {
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
                }) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <p className="text-zinc-300 text-xs font-bold uppercase tracking-widest">No Sales Today</p>
                  </div>
                )}
              </div>

              {/* X-Axis Labels */}
              {todayData.length > 0 && (
                <div className="absolute left-10 right-0 bottom-0 flex justify-between px-2 pt-2">
                  {todayData.map((d, i) => (
                    <div key={i} className="w-full text-center text-[9px] font-bold text-zinc-400 mx-1">
                      {d.time}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default SalesDashboard;