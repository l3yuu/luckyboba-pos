"use client"

import { useState, useEffect, useRef } from 'react';
import TopNavbar from '../TopNavbar';
import api from '../../services/api';

const WEEKLY_HEIGHT = 160;
const TODAY_HEIGHT = 160;
const CACHE_KEY = 'lucky_boba_sales_analytics';
const FIXED_TODAY_MAX = 5000;

// ============================================================
// TYPES  (mirrors SalesDashboardController::dashboardData())
// ============================================================

interface WeeklyDataPoint {
  day: string;        // "Mon"
  date: string;       // "Feb 17"
  value: number;
  full_date: string;  // "2026-02-17"
}

interface TodayDataPoint {
  time: string;   // "9 AM" — Carbon format('g A')
  value: number;
}

interface SalesStats {
  beginning_sales: number;
  today_sales: number;
  ending_sales: number;
  cancelled_sales: number;
  beginning_or: number | string;
  ending_or: number | string;
}

interface WeeklySalesBlock {
  data: WeeklyDataPoint[];
  total_revenue: number;
  start_date: string;
  end_date: string;
  current_week_start: string;
}

interface TodaySalesBlock {
  data: TodayDataPoint[];
  date: string;
}

interface DashboardPayload {
  weekly_sales: WeeklySalesBlock;
  today_sales: TodaySalesBlock;
  statistics: SalesStats;
}

interface ApiResponse {
  success: boolean;
  data: DashboardPayload;
}

interface HoveredValuePoint {
  x: number;
  y: number;
  value: number;
  date: string;
}

// ============================================================
// COMPONENT
// ============================================================

const SalesDashboard = () => {
  const [payload, setPayload] = useState<DashboardPayload | null>(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(!payload);
  const [hoveredValue, setHoveredValue] = useState<HoveredValuePoint | null>(null);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [animatedBars, setAnimatedBars] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  // ============================================================
  // FETCH  — /reports/dashboard-data → dashboardData()
  // ============================================================

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await api.get<ApiResponse>('/reports/dashboard-data');
        if (response.data.success) {
          setPayload(response.data.data);
          localStorage.setItem(CACHE_KEY, JSON.stringify(response.data.data));
        }
      } catch (error) {
        console.error('Failed to load analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  // Animate bars in on mount
  useEffect(() => {
    const timer = setTimeout(() => setAnimatedBars(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (loading && !payload) {
    return (
      <div className="flex-1 bg-[#f8f6ff] h-full flex flex-col items-center justify-center font-sans">
        <div className="w-10 h-10 rounded-full border-2 border-[#3b2063] border-t-transparent animate-spin" />
        <p className="mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Loading Analytics...</p>
      </div>
    );
  }

  if (!payload) return null;

  // ============================================================
  // DERIVED DATA
  // ============================================================

  const weekly        = payload.weekly_sales?.data          ?? [];
  const todayData     = payload.today_sales?.data            ?? [];
  const stats         = payload.statistics                   ?? {} as SalesStats;
  const totalRevenue  = payload.weekly_sales?.total_revenue  ?? 0;

  // ── WEEKLY GRAPH ──
  const WEEKLY_MAX = weekly.length > 0
    ? Math.max(...weekly.map(d => d.value), 10000)
    : 10000;

  const getLineY = (value: number) => WEEKLY_HEIGHT - (value / WEEKLY_MAX) * WEEKLY_HEIGHT;

  const linePoints: HoveredValuePoint[] = weekly.map((data, index) => {
    const totalPoints = weekly.length - 1;
    return {
      x: totalPoints > 0 ? (index / totalPoints) * 100 : 50,
      y: getLineY(data.value),
      value: data.value,
      date: `${data.day} — ${data.date}`,
    };
  });

  const buildSmoothPath = (points: { x: number; y: number }[]) => {
    if (points.length < 2) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpX  = (prev.x + curr.x) / 2;
      d += ` C ${cpX} ${prev.y}, ${cpX} ${curr.y}, ${curr.x} ${curr.y}`;
    }
    return d;
  };

  const buildFillPath = (points: { x: number; y: number }[]) => {
    if (points.length < 2) return '';
    const linePath = buildSmoothPath(points);
    const last  = points[points.length - 1];
    const first = points[0];
    return `${linePath} L ${last.x} ${WEEKLY_HEIGHT} L ${first.x} ${WEEKLY_HEIGHT} Z`;
  };

  const dateRangeText = weekly.length > 0
    ? `${weekly[0].date} — ${weekly[weekly.length - 1].date}, 2026`
    : 'No data available';

  // ── TODAY GRAPH ──
  const getBarHeight = (value: number) => Math.min((value / FIXED_TODAY_MAX) * 100, 100);

  const yLabels = [5000, 4000, 3000, 2000, 1000, 0];

  const DISPLAY_HOURS = [9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,0];
  const HOUR_LABELS: Record<number, string> = {
    9: '9AM', 10: '10AM', 11: '11AM', 12: '12PM',
    13: '1PM', 14: '2PM', 15: '3PM', 16: '4PM',
    17: '5PM', 18: '6PM', 19: '7PM', 20: '8PM',
    21: '9PM', 22: '10PM', 23: '11PM', 0: '12MN',
  };

  // Parse "9 AM" / "1 PM" → 24-hour integer (Carbon format 'g A')
  const parseHour = (timeStr: string): number => {
    const match = timeStr.toUpperCase().trim().match(/^(\d+)\s*(AM|PM)$/);
    if (!match) return -1;
    let h = parseInt(match[1], 10);
    const period = match[2];
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return h;
  };

  const filteredTodayData = DISPLAY_HOURS.map(hour => {
    const match = todayData.find(d => parseHour(d.time) === hour);
    return { hour, label: HOUR_LABELS[hour], value: match?.value ?? 0 };
  });

  const LABEL_HOURS = new Set([9, 12, 15, 18, 21, 0]);

  const fmt = (v: number) =>
    `₱ ${Number(v).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="flex-1 bg-[#f8f6ff] h-full flex flex-col overflow-hidden">
      <TopNavbar />

      <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col gap-5">

        {/* ══════════════════════════════════════
            WEEKLY SALES LINE GRAPH
        ══════════════════════════════════════ */}
        <div className="bg-white border border-zinc-100 rounded-3xl p-6 md:p-8 shadow-sm">

          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-1">Sales Report</p>
              <h2 className="text-[#3b2063] font-black text-xl md:text-2xl uppercase tracking-tight leading-none">Weekly Sales</h2>
              <p className="text-zinc-300 text-[10px] font-black uppercase tracking-widest mt-1.5">{dateRangeText}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-1">Total Revenue</p>
              <p className="text-2xl font-black text-emerald-500 leading-none">{fmt(totalRevenue)}</p>
            </div>
          </div>

          <div className="flex gap-4">
            {/* Y-axis */}
            <div className="flex flex-col justify-between text-right shrink-0 w-8 pb-6" style={{ height: WEEKLY_HEIGHT + 24 }}>
              {[WEEKLY_MAX, WEEKLY_MAX * 0.75, WEEKLY_MAX * 0.5, WEEKLY_MAX * 0.25, 0].map((v, i) => (
                <span key={i} className="text-[12px] font-black text-zinc-600 leading-none">
                  {v >= 1000 ? `${Math.round(v / 1000)}k` : v}
                </span>
              ))}
            </div>

            <div className="flex-1 flex flex-col">
              <div className="relative" style={{ height: WEEKLY_HEIGHT }}>
                {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
                  <div key={i} className="absolute left-0 right-0 h-px"
                    style={{ top: `${pct * 100}%`, background: pct === 0 ? '#e4e4e7' : '#f4f4f5' }} />
                ))}

                <svg className="absolute inset-0 w-full h-full overflow-visible"
                  viewBox={`0 0 100 ${WEEKLY_HEIGHT}`} preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#3b2063" />
                      <stop offset="100%" stopColor="#7c3aed" />
                    </linearGradient>
                    <linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b2063" stopOpacity="0.1" />
                      <stop offset="100%" stopColor="#3b2063" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {linePoints.length > 1 && (
                    <path d={buildFillPath(linePoints)} fill="url(#fillGrad)" vectorEffect="non-scaling-stroke" />
                  )}
                  {linePoints.length > 1 && (
                    <path d={buildSmoothPath(linePoints)} fill="none" stroke="url(#lineGrad)"
                      strokeWidth="2.5" vectorEffect="non-scaling-stroke"
                      strokeLinecap="round" strokeLinejoin="round" />
                  )}
                </svg>

                {linePoints.map((p, i) => (
                  <div key={i} className="absolute z-10 group"
                    style={{ left: `${p.x}%`, top: `${(p.y / WEEKLY_HEIGHT) * 100}%`, transform: 'translate(-50%, -50%)' }}
                    onMouseEnter={() => setHoveredValue(p)}
                    onMouseLeave={() => setHoveredValue(null)}
                  >
                    <div className="w-4 h-4 rounded-full bg-white border-2 border-[#3b2063] group-hover:scale-150 transition-transform duration-150 shadow-sm" />
                    {hoveredValue === p && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 pointer-events-none z-20">
                        <div className="bg-[#1e1720] text-white px-3 py-2 rounded-2xl shadow-xl text-center whitespace-nowrap">
                          <p className="text-[9px] font-black uppercase tracking-widest text-purple-300/70 mb-0.5">{p.date}</p>
                          <p className="text-sm font-black">₱ {p.value.toLocaleString()}</p>
                        </div>
                        <div className="w-2 h-2 bg-[#1e1720] rotate-45 mx-auto -mt-1" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-between pt-3 mt-1 border-t border-zinc-50">
                {weekly.map((d, i) => (
                  <div key={i} className="text-center" style={{ width: `${100 / weekly.length}%` }}>
                    <p className="text-[10px] font-black uppercase text-[#3b2063]">{d.day}</p>
                    <p className="text-[9px] font-bold text-zinc-300">{d.date.split(' ')[1]}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════
            BOTTOM: STAT CARDS + BAR GRAPH
        ══════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          <div className="grid grid-cols-2 gap-3 md:gap-4 content-start">
            {[
              { label: 'Beginning Sales', value: fmt(stats.beginning_sales  ?? 0),   color: 'text-zinc-700' },
              { label: 'Today Sales',     value: fmt(stats.today_sales      ?? 0),   color: 'text-emerald-500' },
              { label: 'Ending Sales',    value: fmt(stats.ending_sales     ?? 0),   color: 'text-[#3b2063]' },
              { label: 'Cancelled Sales', value: fmt(stats.cancelled_sales  ?? 0),   color: 'text-red-500' },
              { label: 'Beginning OR',    value: String(stats.beginning_or  ?? '—'), color: 'text-zinc-700' },
              { label: 'Ending OR',       value: String(stats.ending_or     ?? '—'), color: 'text-[#3b2063]' },
            ].map((item, i) => (
              <div key={i} className="bg-white border border-zinc-100 rounded-3xl p-5 flex flex-col justify-between shadow-sm gap-3">
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-400 leading-tight">{item.label}</p>
                <p className={`text-lg font-black leading-none ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-white border border-zinc-100 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-1">Today</p>
                <h3 className="text-[#3b2063] font-black text-base uppercase tracking-tight leading-none">Hourly Sales</h3>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Live</span>
              </div>
            </div>

            <div className="flex gap-3 flex-1" ref={barRef}>
              <div className="flex flex-col justify-between text-right shrink-0 w-8 pb-5" style={{ height: TODAY_HEIGHT + 20 }}>
                {yLabels.map(v => (
                  <span key={v} className="text-[12px] font-black text-zinc-600 leading-none">
                    {v === 0 ? '0' : `${v / 1000}k`}
                  </span>
                ))}
              </div>

              <div className="flex-1 flex flex-col">
                <div className="relative flex-1" style={{ height: TODAY_HEIGHT }}>
                  {yLabels.map((_, i) => (
                    <div key={i} className="absolute left-0 right-0 h-px"
                      style={{
                        top: `${(i / (yLabels.length - 1)) * 100}%`,
                        background: i === yLabels.length - 1 ? '#e4e4e7' : '#f4f4f5',
                      }} />
                  ))}

                  {filteredTodayData.some(d => d.value > 0) ? (
                    <div className="absolute inset-0 flex items-end gap-0.5 px-0.5">
                      {filteredTodayData.map((d, i) => {
                        const pct       = animatedBars ? getBarHeight(d.value) : 0;
                        const isHovered = hoveredBar === i;
                        const hasValue  = d.value > 0;
                        return (
                          <div key={i} className="relative flex-1 h-full flex items-end group cursor-pointer"
                            onMouseEnter={() => setHoveredBar(i)}
                            onMouseLeave={() => setHoveredBar(null)}
                          >
                            <div className="w-full rounded-t-md transition-all duration-700 ease-out"
                              style={{
                                height: `${pct}%`,
                                background: isHovered
                                  ? 'linear-gradient(to top, #3b2063, #7c3aed)'
                                  : hasValue ? '#3b2063' : '#f4f4f5',
                                transitionDelay: `${i * 20}ms`,
                              }} />
                            {isHovered && hasValue && (
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none z-20">
                                <div className="bg-[#1e1720] text-white px-2.5 py-1.5 rounded-xl shadow-xl text-center whitespace-nowrap">
                                  <p className="text-[9px] font-black uppercase tracking-widest text-purple-300/70">{d.label}</p>
                                  <p className="text-xs font-black">₱ {d.value.toLocaleString()}</p>
                                </div>
                                <div className="w-1.5 h-1.5 bg-[#1e1720] rotate-45 mx-auto -mt-0.5" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-300 italic">No Sales Today</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-0.5 px-0.5 mt-2 border-t border-zinc-50 pt-2">
                  {filteredTodayData.map((d, i) => (
                    <div key={i} className="flex-1 text-center">
                      {LABEL_HOURS.has(d.hour) && (
                        <p className="text-[8px] font-black text-zinc-400 uppercase leading-none">{d.label}</p>
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

export default SalesDashboard;
