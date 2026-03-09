"use client"

import { useState, useEffect, useRef } from 'react';
import TopNavbar from '../TopNavbar';
import api from '../../services/api';
import type { SalesAnalyticsResponse, HoveredValuePoint } from '../../types/analytics';
import { TrendingUp, BarChart3, AlertCircle, Banknote, History, FileText, Activity } from 'lucide-react';

const WEEKLY_HEIGHT = 160;
const TODAY_HEIGHT = 160;
const CACHE_KEY = 'lucky_boba_sales_analytics';
const FIXED_TODAY_MAX = 5000;

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  isSuccess?: boolean;
  isBrand?: boolean;
  isDanger?: boolean;
}

const SalesDashboard = () => {
  const [analytics, setAnalytics] = useState<SalesAnalyticsResponse | null>(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  });
  const [loading, setLoading] = useState(!analytics);
  const [hoveredValue, setHoveredValue] = useState<HoveredValuePoint | null>(null);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [animatedBars, setAnimatedBars] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const response = await api.get('/sales-analytics');
        setAnalytics(response.data);
        localStorage.setItem(CACHE_KEY, JSON.stringify(response.data));
      } catch (error) { console.error("Failed to load analytics:", error); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setAnimatedBars(true), 100);
    return () => clearTimeout(t);
  }, []);

  if (loading && !analytics) {
    return (
      <div className="flex-1 bg-[#f4f2fb] h-full flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-2 border-[#3b2063] border-t-transparent animate-spin" />
        <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Syncing Terminal Analytics...</p>
      </div>
    );
  }

  if (!analytics) return null;

  const { weekly, today_hourly: todayData, stats } = analytics;

  // ── Weekly chart logic ──
  const WEEKLY_MAX = weekly.length > 0 ? Math.max(...weekly.map(d => d.value), 10000) : 10000;
  const getLineY = (value: number) => WEEKLY_HEIGHT - (value / WEEKLY_MAX) * WEEKLY_HEIGHT;
  const linePoints = weekly.map((data, index) => ({
    x: weekly.length > 1 ? (index / (weekly.length - 1)) * 100 : 50,
    y: getLineY(data.value),
    value: data.value,
    date: `${data.day} — ${data.date}`,
  }));

  const buildSmoothPath = (points: { x: number; y: number }[]) => {
    if (points.length < 2) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1], curr = points[i];
      const cpX = (prev.x + curr.x) / 2;
      d += ` C ${cpX} ${prev.y}, ${cpX} ${curr.y}, ${curr.x} ${curr.y}`;
    }
    return d;
  };

  const buildFillPath = (points: { x: number; y: number }[]) => {
    if (points.length < 2) return '';
    return `${buildSmoothPath(points)} L ${points[points.length - 1].x} ${WEEKLY_HEIGHT} L ${points[0].x} ${WEEKLY_HEIGHT} Z`;
  };

  const dateRangeText = weekly.length > 0
    ? `${weekly[0].date} — ${weekly[weekly.length - 1].date}, 2026`
    : 'No data available';

  // ── Today chart logic ──
  const getBarHeight = (value: number) => Math.min((value / FIXED_TODAY_MAX) * 100, 100);
  const yLabels = [5000, 4000, 3000, 2000, 1000, 0];
  const DISPLAY_HOURS = [9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,0];
  const HOUR_LABELS: Record<number, string> = {
    9:'9AM', 10:'10AM', 11:'11AM', 12:'12PM', 13:'1PM', 14:'2PM',
    15:'3PM', 16:'4PM', 17:'5PM', 18:'6PM', 19:'7PM', 20:'8PM',
    21:'9PM', 22:'10PM', 23:'11PM', 0:'12MN'
  };

  const parseHour = (timeStr: string): number => {
    const upper = timeStr.toUpperCase().trim();
    if (upper.includes('AM') || upper.includes('PM')) {
      const [timePart, period] = upper.split(/\s+/);
      let h = Number(timePart.split(':')[0]);
      if (period === 'PM' && h !== 12) h += 12;
      if (period === 'AM' && h === 12) h = 0;
      return h;
    }
    return Number(upper.split(':')[0]);
  };

  const filteredTodayData = DISPLAY_HOURS.map(hour => ({
    hour,
    label: HOUR_LABELS[hour],
    value: todayData.find(d => parseHour(d.time) === hour)?.value ?? 0,
  }));

  const LABEL_HOURS = new Set([9, 12, 15, 18, 21, 0]);
  const fmt = (v: number) => `₱${Number(v).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

  return (
    <div className="flex-1 bg-[#f4f2fb] h-full flex flex-col overflow-hidden">
      <TopNavbar />

      <div className="flex-1 overflow-y-auto p-5 md:p-7 flex flex-col gap-5">

        {/* ── Weekly Revenue Chart ── */}
        <div className="bg-white border border-zinc-200 p-6 md:p-7 shadow-sm">
          <div className="flex items-start justify-between mb-7 pb-6 border-b border-zinc-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#3b2063] flex items-center justify-center">
                <BarChart3 size={18} className="text-white" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Revenue Performance</p>
                <h2 className="text-sm font-bold text-[#1a0f2e] uppercase tracking-widest mt-0.5">Weekly Sales Audit</h2>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Archive Total</p>
              <p className="text-2xl font-bold text-emerald-600 tabular-nums">{fmt(stats.total_revenue)}</p>
              <p className="text-[10px] font-medium text-zinc-400 mt-1">{dateRangeText}</p>
            </div>
          </div>

          <div className="flex gap-6">
            {/* Y-axis */}
            <div className="flex flex-col justify-between text-right shrink-0 w-10 pb-8" style={{ height: WEEKLY_HEIGHT + 24 }}>
              {[WEEKLY_MAX, WEEKLY_MAX * 0.75, WEEKLY_MAX * 0.5, WEEKLY_MAX * 0.25, 0].map((v, i) => (
                <span key={i} className="text-[10px] font-bold text-zinc-400 tabular-nums">
                  {v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                </span>
              ))}
            </div>

            <div className="flex-1 flex flex-col">
              <div className="relative" style={{ height: WEEKLY_HEIGHT }}>
                {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
                  <div key={i} className="absolute left-0 right-0 h-px bg-zinc-100" style={{ top: `${pct * 100}%` }} />
                ))}

                <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox={`0 0 100 ${WEEKLY_HEIGHT}`} preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#3b2063" />
                      <stop offset="100%" stopColor="#7c3aed" />
                    </linearGradient>
                    <linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b2063" stopOpacity="0.08" />
                      <stop offset="100%" stopColor="#3b2063" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {linePoints.length > 1 && <path d={buildFillPath(linePoints)} fill="url(#fillGrad)" vectorEffect="non-scaling-stroke" />}
                  {linePoints.length > 1 && <path d={buildSmoothPath(linePoints)} fill="none" stroke="url(#lineGrad)" strokeWidth="3" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />}
                </svg>

                {linePoints.map((p, i) => (
                  <div key={i} className="absolute z-10 group cursor-pointer"
                    style={{ left: `${p.x}%`, top: `${(p.y / WEEKLY_HEIGHT) * 100}%`, transform: 'translate(-50%, -50%)' }}
                    onMouseEnter={() => setHoveredValue(p)} onMouseLeave={() => setHoveredValue(null)}>
                    <div className="w-3.5 h-3.5 bg-white border-2 border-[#3b2063] group-hover:scale-125 transition-transform duration-150 shadow-sm rounded-[0.625rem] full" />
                    {hoveredValue === p && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 pointer-events-none z-20">
                        <div className="bg-[#1e1720] text-white px-3 py-2 border border-white/10 shadow-2xl text-center whitespace-nowrap">
                          <p className="text-[10px] font-bold text-violet-300 uppercase tracking-widest mb-1">{p.date}</p>
                          <p className="text-sm font-bold tabular-nums">₱{p.value.toLocaleString()}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* X-axis labels */}
              <div className="flex justify-between pt-4 mt-2 border-t border-zinc-100">
                {weekly.map((d, i) => (
                  <div key={i} className="text-center" style={{ width: `${100 / weekly.length}%` }}>
                    <p className="text-[10px] font-bold uppercase text-[#3b2063] tracking-widest">{d.day}</p>
                    <p className="text-[10px] font-medium text-zinc-400">{d.date.split(' ')[1]}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 flex-1">

          {/* Stat Cards */}
          <div className="grid grid-cols-2 gap-3 content-start">
            <StatCard label="Beginning Sales" value="₱0.00" icon={<Banknote size={15} />} />
            <StatCard label="Today Gross" value={fmt(stats.today_sales)} icon={<TrendingUp size={15} />} isSuccess />
            <StatCard label="Live Ending" value={fmt(stats.today_sales)} icon={<Activity size={15} />} isBrand />
            <StatCard label="Voided Journal" value={fmt(stats.cancelled_sales)} icon={<AlertCircle size={15} />} isDanger />
            <StatCard label="Beginning OR" value={String(stats.beginning_or)} icon={<FileText size={15} />} />
            <StatCard label="Ending OR" value={String(stats.ending_or)} icon={<History size={15} />} isBrand />
          </div>

          {/* Hourly Chart */}
          <div className="bg-white border border-zinc-200 p-6 md:p-7 shadow-sm flex flex-col">
            <div className="flex items-start justify-between mb-6 pb-5 border-b border-zinc-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-violet-50 border border-violet-200 flex items-center justify-center">
                  <Activity size={17} className="text-violet-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Shift Analytics</p>
                  <h3 className="text-sm font-bold text-[#1a0f2e] uppercase tracking-widest mt-0.5">Hourly Sales</h3>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-[0.625rem] full animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Live</span>
              </div>
            </div>

            <div className="flex gap-4 flex-1" ref={barRef}>
              {/* Y-axis */}
              <div className="flex flex-col justify-between text-right shrink-0 w-8 pb-8" style={{ height: TODAY_HEIGHT + 20 }}>
                {yLabels.map(v => (
                  <span key={v} className="text-[10px] font-bold text-zinc-400 tabular-nums">
                    {v === 0 ? '0' : `${v / 1000}k`}
                  </span>
                ))}
              </div>

              <div className="flex-1 flex flex-col">
                <div className="relative flex-1" style={{ height: TODAY_HEIGHT }}>
                  {yLabels.map((_, i) => (
                    <div key={i} className="absolute left-0 right-0 h-px bg-zinc-100" style={{ top: `${(i / (yLabels.length - 1)) * 100}%` }} />
                  ))}

                  {filteredTodayData.some(d => d.value > 0) ? (
                    <div className="absolute inset-0 flex items-end gap-0.5 px-0.5">
                      {filteredTodayData.map((d, i) => {
                        const pct = animatedBars ? getBarHeight(d.value) : 0;
                        const isHovered = hoveredBar === i;
                        return (
                          <div key={i} className="relative flex-1 h-full flex items-end group cursor-pointer"
                            onMouseEnter={() => setHoveredBar(i)} onMouseLeave={() => setHoveredBar(null)}>
                            <div className="w-full transition-all duration-700 ease-out"
                              style={{
                                height: `${pct}%`,
                                background: d.value > 0 ? (isHovered ? '#7c3aed' : '#3b2063') : '#f4f2fb',
                                transitionDelay: `${i * 20}ms`
                              }}
                            />
                            {isHovered && d.value > 0 && (
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 pointer-events-none z-10 whitespace-nowrap">
                                <div className="bg-[#1e1720] text-white text-[10px] font-bold px-2 py-1">
                                  {d.label}: ₱{d.value.toLocaleString()}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-300">No shift activity recorded</p>
                    </div>
                  )}
                </div>

                {/* X-axis */}
                <div className="flex gap-0.5 px-0.5 mt-3 border-t border-zinc-100 pt-3">
                  {filteredTodayData.map((d, i) => (
                    <div key={i} className="flex-1 text-center">
                      {LABEL_HOURS.has(d.hour) && (
                        <p className="text-[9px] font-bold text-zinc-400 leading-none">{d.label}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon, isSuccess, isBrand, isDanger }: StatCardProps) => (
  <div className={`px-5 py-4 border flex flex-col justify-between shadow-sm transition-all ${
    isBrand ? 'bg-[#3b2063] border-[#2a174a]' : 'bg-white border-zinc-200 hover:border-violet-200'
  }`}>
    <div className="flex items-center justify-between mb-3">
      <p className={`text-[10px] font-bold uppercase tracking-widest ${isBrand ? 'text-violet-300' : 'text-zinc-500'}`}>
        {label}
      </p>
      <div className={`w-7 h-7 flex items-center justify-center ${
        isBrand ? 'bg-white/10 text-violet-200' : 'bg-zinc-50 border border-zinc-200 text-zinc-400'
      }`}>
        {icon}
      </div>
    </div>
    <p className={`text-base font-bold tabular-nums ${
      isBrand ? 'text-white' : isSuccess ? 'text-emerald-600' : isDanger ? 'text-red-600' : 'text-[#1a0f2e]'
    }`}>
      {value}
    </p>
  </div>
);

export default SalesDashboard;