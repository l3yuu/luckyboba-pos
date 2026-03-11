"use client"

import { useState, useEffect, useRef } from 'react';
import api from '../../../services/api';
import {
  TrendingUp, BarChart3, AlertCircle, Banknote,
  History, FileText, Activity, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';

// ─── Design tokens — mirrors BranchManagerDashboard ──────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');
  .sd-root, .sd-root * { font-family: 'DM Sans', sans-serif !important; box-sizing: border-box; }
  .sd-label { font-size: 0.62rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #3f3f46; }
  .sd-sub   { font-size: 0.65rem; font-weight: 400; color: #71717a; }
  .sd-value { font-size: 1.9rem; font-weight: 800; letter-spacing: -0.035em; line-height: 1; }
  .sd-live  { display: inline-flex; align-items: center; gap: 5px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 100px; padding: 4px 10px; }
  .sd-live-dot  { width: 5px; height: 5px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 5px rgba(34,197,94,0.6); animation: sd-pulse 2s infinite; }
  .sd-live-text { font-size: 0.55rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #16a34a; }
  @keyframes sd-pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
`;

const WEEKLY_HEIGHT   = 180;
const TODAY_HEIGHT    = 180;
const CACHE_KEY       = 'lucky_boba_bm_sales_analytics';
const FIXED_TODAY_MAX = 5000;

// ─── Types ────────────────────────────────────────────────────────────────────
interface WeeklyDataPoint  { day: string; date: string; value: number; full_date: string; }
interface TodayDataPoint   { time: string; value: number; }
interface SalesStats {
  beginning_sales: number; today_sales: number; ending_sales: number;
  cancelled_sales: number; beginning_or: number | string; ending_or: number | string;
  total_revenue?: number;
}
interface WeeklySalesBlock { data: WeeklyDataPoint[]; total_revenue: number; start_date: string; end_date: string; current_week_start: string; }
interface TodaySalesBlock  { data: TodayDataPoint[]; date: string; }
interface DashboardPayload { weekly_sales: WeeklySalesBlock; today_sales: TodaySalesBlock; statistics: SalesStats; }
interface ApiResponse      { success: boolean; data: DashboardPayload; }
interface HoveredPoint     { x: number; y: number; value: number; date: string; }

// ─── Stat Card — mirrors BranchManagerDashboard statCards ────────────────────
interface StatCardProps {
  label: string; sub: string; value: string; compact: string;
  icon: React.ReactNode; iconBg: string; iconColor: string;
  valueColor?: string; accent?: string; trend?: string; trendUp?: boolean;
}

const StatCard = ({ label, sub, value, compact, icon, iconBg, iconColor, valueColor = '#1a0f2e', trend, trendUp }: StatCardProps) => (
  <div className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col gap-3 hover:shadow-md hover:border-[#ddd6f7] transition-all">
    <div className="flex items-start justify-between">
      <div>
        <p className="sd-label">{label}</p>
        <p className="sd-sub" style={{ marginTop: 2 }}>{sub}</p>
      </div>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: iconBg, color: iconColor }}>
        {icon}
      </div>
    </div>
    <div>
      <p className="sd-value" style={{ color: valueColor }}>{compact}</p>
      <p className="sd-sub" style={{ marginTop: 4 }}>{value}</p>
    </div>
    {trend !== undefined && (
      <div className="flex items-center justify-between pt-1 border-t border-gray-50">
        <span className="sd-sub">vs yesterday</span>
        <span style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 3, color: trendUp ? '#16a34a' : '#be2525' }}>
          {trendUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
          {trend}
        </span>
      </div>
    )}
  </div>
);

// ─── Component ────────────────────────────────────────────────────────────────
const SalesDashboard = () => {
  const [payload, setPayload] = useState<DashboardPayload | null>(() => {
    try { const c = localStorage.getItem(CACHE_KEY); return c ? JSON.parse(c) : null; }
    catch { return null; }
  });
  const [loading,       setLoading]       = useState(!payload);
  const [hoveredValue,  setHoveredValue]  = useState<HoveredPoint | null>(null);
  const [hoveredBar,    setHoveredBar]    = useState<number | null>(null);
  const [animatedBars,  setAnimatedBars]  = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await api.get<ApiResponse>('/reports/dashboard-data');
        if (r.data.success) {
          setPayload(r.data.data);
          localStorage.setItem(CACHE_KEY, JSON.stringify(r.data.data));
        }
      } catch (e) { console.error('Failed to load analytics:', e); }
      finally { setLoading(false); }
    })();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setAnimatedBars(true), 100);
    return () => clearTimeout(t);
  }, []);

  if (loading && !payload) return (
    <div className="h-full flex flex-col items-center justify-center gap-3">
      <div className="w-9 h-9 border-2 border-[#3b2063] border-t-transparent animate-spin rounded-full" />
      <p className="sd-label" style={{ color: '#a1a1aa' }}>Loading analytics…</p>
    </div>
  );

  if (!payload) return null;

  // ── Derived data ─────────────────────────────────────────────────────────
  const weekly       = payload.weekly_sales?.data         ?? [];
  const todayData    = payload.today_sales?.data           ?? [];
  const stats        = payload.statistics                  ?? {} as SalesStats;
  const totalRevenue = payload.weekly_sales?.total_revenue ?? 0;

  const WEEKLY_MAX = weekly.length > 0 ? Math.max(...weekly.map(d => d.value), 10000) : 10000;
  const getLineY   = (v: number) => WEEKLY_HEIGHT - (v / WEEKLY_MAX) * WEEKLY_HEIGHT;

  const linePoints: HoveredPoint[] = weekly.map((d, i) => ({
    x: weekly.length > 1 ? (i / (weekly.length - 1)) * 100 : 50,
    y: getLineY(d.value),
    value: d.value,
    date: `${d.day} — ${d.date}`,
  }));

  const buildSmoothPath = (pts: { x: number; y: number }[]) => {
    if (pts.length < 2) return '';
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const cpX = (pts[i-1].x + pts[i].x) / 2;
      d += ` C ${cpX} ${pts[i-1].y}, ${cpX} ${pts[i].y}, ${pts[i].x} ${pts[i].y}`;
    }
    return d;
  };

  const buildFillPath = (pts: { x: number; y: number }[]) => {
    if (pts.length < 2) return '';
    return `${buildSmoothPath(pts)} L ${pts[pts.length-1].x} ${WEEKLY_HEIGHT} L ${pts[0].x} ${WEEKLY_HEIGHT} Z`;
  };

  const dateRangeText = weekly.length > 0
    ? `${weekly[0].date} — ${weekly[weekly.length-1].date}, 2026`
    : 'No data available';

  const getBarHeight  = (v: number) => Math.min((v / FIXED_TODAY_MAX) * 100, 100);
  const yLabels       = [5000, 4000, 3000, 2000, 1000, 0];
  const DISPLAY_HOURS = [9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,0];
  const HOUR_LABELS: Record<number,string> = {
    9:'9AM',10:'10AM',11:'11AM',12:'12PM',13:'1PM',14:'2PM',
    15:'3PM',16:'4PM',17:'5PM',18:'6PM',19:'7PM',20:'8PM',
    21:'9PM',22:'10PM',23:'11PM',0:'12MN',
  };
  const parseHour = (t: string): number => {
    const m = t.toUpperCase().trim().match(/^(\d+)\s*(AM|PM)$/);
    if (!m) return -1;
    let h = parseInt(m[1]);
    if (m[2] === 'PM' && h !== 12) h += 12;
    if (m[2] === 'AM' && h === 12) h = 0;
    return h;
  };
  const filteredTodayData = DISPLAY_HOURS.map(hour => {
    const match = todayData.find(d => parseHour(d.time) === hour);
    return { hour, label: HOUR_LABELS[hour], value: match?.value ?? 0 };
  });
  const LABEL_HOURS = new Set([9, 12, 15, 18, 21, 0]);

  const fmt      = (v: number) => `₱${Number(v).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
  const fmtS     = (v: number) => {
    if (v >= 1_000_000) return `₱${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000)     return `₱${(v / 1_000).toFixed(1)}K`;
    return `₱${v.toFixed(0)}`;
  };

  // Stat cards — same structure as BranchManagerDashboard
  const statCards: StatCardProps[] = [
    {
      label: 'Beginning Sales', sub: 'Opening balance',
      value: fmt(stats.beginning_sales ?? 0), compact: fmtS(stats.beginning_sales ?? 0),
      icon: <Banknote size={14} strokeWidth={2.5} />,
      iconBg: '#dcfce7', iconColor: '#16a34a',
    },
    {
      label: 'Today Gross', sub: 'Total revenue today',
      value: fmt(stats.today_sales ?? 0), compact: fmtS(stats.today_sales ?? 0),
      icon: <TrendingUp size={14} strokeWidth={2.5} />,
      iconBg: '#ede9fe', iconColor: '#7c3aed', valueColor: '#3b2063',
    },
    {
      label: 'Ending Sales', sub: 'Closing balance',
      value: fmt(stats.ending_sales ?? 0), compact: fmtS(stats.ending_sales ?? 0),
      icon: <Activity size={14} strokeWidth={2.5} />,
      iconBg: '#e0f2fe', iconColor: '#0284c7', valueColor: '#0c4a6e',
    },
    {
      label: 'Voided Journal', sub: 'Cancelled transactions',
      value: fmt(stats.cancelled_sales ?? 0), compact: fmtS(stats.cancelled_sales ?? 0),
      icon: <AlertCircle size={14} strokeWidth={2.5} />,
      iconBg: '#fee2e2', iconColor: '#dc2626',
    },
    {
      label: 'Beginning OR', sub: 'Opening receipt no.',
      value: String(stats.beginning_or ?? '—'), compact: String(stats.beginning_or ?? '—'),
      icon: <FileText size={14} strokeWidth={2.5} />,
      iconBg: '#fef9c3', iconColor: '#ca8a04',
    },
    {
      label: 'Ending OR', sub: 'Closing receipt no.',
      value: String(stats.ending_or ?? '—'), compact: String(stats.ending_or ?? '—'),
      icon: <History size={14} strokeWidth={2.5} />,
      iconBg: '#f4f4f5', iconColor: '#71717a',
    },
  ];

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <>
      <style>{STYLES}</style>
      <section className="sd-root px-5 md:px-8 pb-8 pt-5 space-y-5">

        {/* ── WEEKLY REVENUE CHART — mirrors Revenue Overview card ── */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md hover:border-[#ddd6f7] transition-all">

          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: '#ede9fe', color: '#7c3aed' }}>
                <BarChart3 size={16} strokeWidth={2.5} />
              </div>
              <div>
                <h2 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1a0f2e', letterSpacing: '-0.025em', margin: 0 }}>
                  Weekly Sales Audit
                </h2>
                <div className="flex items-center gap-4 mt-1">
                  {[
                    ['Total',    `₱${totalRevenue.toLocaleString()}`],
                    ['Peak Day', weekly.reduce((a, b) => b.value > a.value ? b : a, weekly[0] ?? { day: '—', value: 0 })?.day ?? '—'],
                    ['Period',   dateRangeText],
                  ].map(([lbl, val], j) => (
                    <div key={j}>
                      <span className="sd-label" style={{ color: '#a1a1aa' }}>{lbl}</span>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: j === 1 ? '#7c3aed' : '#1a0f2e', marginLeft: 6, letterSpacing: '-0.01em' }}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="sd-live shrink-0">
              <div className="sd-live-dot" />
              <span className="sd-live-text">Live</span>
            </div>
          </div>

          {/* Chart body */}
          <div className="flex gap-4">
            {/* Y axis */}
            <div className="flex flex-col justify-between text-right shrink-0 w-10 pb-7"
              style={{ height: WEEKLY_HEIGHT + 28 }}>
              {[WEEKLY_MAX, WEEKLY_MAX*0.75, WEEKLY_MAX*0.5, WEEKLY_MAX*0.25, 0].map((v, i) => (
                <span key={i} className="sd-label" style={{ color: '#d4d4d8', fontSize: '0.58rem' }}>
                  {v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
                </span>
              ))}
            </div>

            <div className="flex-1 flex flex-col">
              <div className="relative" style={{ height: WEEKLY_HEIGHT }}>
                {/* Grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
                  <div key={i} className="absolute left-0 right-0 h-px"
                    style={{ top: `${pct * 100}%`, background: pct === 0 ? '#e4e4e7' : '#f4f4f5' }} />
                ))}

                <svg className="absolute inset-0 w-full h-full overflow-visible"
                  viewBox={`0 0 100 ${WEEKLY_HEIGHT}`} preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="sdLineGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%"   stopColor="#3b2063" />
                      <stop offset="100%" stopColor="#7c3aed" />
                    </linearGradient>
                    <linearGradient id="sdFillGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#7c3aed" stopOpacity="0.22" />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {linePoints.length > 1 && (
                    <path d={buildFillPath(linePoints)} fill="url(#sdFillGrad)" vectorEffect="non-scaling-stroke" />
                  )}
                  {linePoints.length > 1 && (
                    <path d={buildSmoothPath(linePoints)} fill="none"
                      stroke="url(#sdLineGrad)" strokeWidth="2.5"
                      vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
                  )}
                </svg>

                {/* Hover dots */}
                {linePoints.map((p, i) => (
                  <div key={i} className="absolute z-10"
                    style={{ left: `${p.x}%`, top: `${(p.y / WEEKLY_HEIGHT) * 100}%`, transform: 'translate(-50%,-50%)' }}
                    onMouseEnter={() => setHoveredValue(p)}
                    onMouseLeave={() => setHoveredValue(null)}
                  >
                    <div style={{
                      width: 10, height: 10, borderRadius: '50%',
                      background: '#fff', border: '2.5px solid #3b2063',
                      boxShadow: hoveredValue === p ? '0 0 0 4px rgba(59,32,99,0.12)' : 'none',
                      transition: 'box-shadow 0.12s, transform 0.12s',
                      transform: hoveredValue === p ? 'scale(1.5)' : 'scale(1)',
                    }} />
                    {hoveredValue === p && (
                      <div style={{
                        position: 'absolute', bottom: 'calc(100% + 10px)', left: '50%',
                        transform: 'translateX(-50%)', zIndex: 30,
                        background: '#1a0f2e', color: '#fff', borderRadius: '0.625rem',
                        padding: '6px 12px', whiteSpace: 'nowrap', pointerEvents: 'none',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.18)', textAlign: 'center',
                      }}>
                        <p style={{ fontSize: '0.5rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.5, margin: 0, marginBottom: 2 }}>
                          {p.date}
                        </p>
                        <p style={{ fontSize: '0.85rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                          ₱ {p.value.toLocaleString()}
                        </p>
                        <div style={{
                          position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
                          width: 0, height: 0,
                          borderLeft: '5px solid transparent', borderRight: '5px solid transparent',
                          borderTop: '5px solid #1a0f2e',
                        }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* X axis labels */}
              <div className="flex justify-between pt-3 mt-1 border-t border-gray-50">
                {weekly.map((d, i) => (
                  <div key={i} className="text-center" style={{ width: `${100 / weekly.length}%` }}>
                    <p className="sd-label" style={{ color: '#7c3aed', fontSize: '0.58rem' }}>{d.day}</p>
                    <p className="sd-sub" style={{ color: '#d4d4d8', fontSize: '0.56rem' }}>{d.date.split(' ')[1]}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── STAT CARDS + HOURLY CHART ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Stat cards grid — same as dashboard statCards */}
          <div className="grid grid-cols-2 gap-4">
            {statCards.map((s, i) => <StatCard key={i} {...s} />)}
          </div>

          {/* Hourly Chart — mirrors Top Sellers card style */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col hover:shadow-md hover:border-[#ddd6f7] transition-all">

            {/* Card header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: '#ede9fe', color: '#7c3aed' }}>
                  <Activity size={16} strokeWidth={2.5} />
                </div>
                <div>
                  <h2 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1a0f2e', letterSpacing: '-0.025em', margin: 0 }}>
                    Hourly Distribution
                  </h2>
                  <p className="sd-label" style={{ color: '#a1a1aa', marginTop: 2 }}>Today's shift analytics</p>
                </div>
              </div>
              <div className="sd-live">
                <div className="sd-live-dot" />
                <span className="sd-live-text">Live</span>
              </div>
            </div>

            {/* Chart */}
            <div className="flex gap-3 flex-1" ref={barRef}>
              {/* Y axis */}
              <div className="flex flex-col justify-between text-right shrink-0 w-8 pb-6"
                style={{ height: TODAY_HEIGHT + 24 }}>
                {yLabels.map(v => (
                  <span key={v} className="sd-label" style={{ color: '#d4d4d8', fontSize: '0.56rem' }}>
                    {v === 0 ? '0' : `${v/1000}k`}
                  </span>
                ))}
              </div>

              <div className="flex-1 flex flex-col">
                <div className="relative" style={{ height: TODAY_HEIGHT }}>
                  {/* Grid lines */}
                  {yLabels.map((_, i) => (
                    <div key={i} className="absolute left-0 right-0 h-px"
                      style={{ top: `${(i / (yLabels.length - 1)) * 100}%`, background: i === yLabels.length - 1 ? '#e4e4e7' : '#f4f4f5' }} />
                  ))}

                  {filteredTodayData.some(d => d.value > 0) ? (
                    <div className="absolute inset-0 flex items-end gap-0.5 px-0.5">
                      {filteredTodayData.map((d, i) => {
                        const pct       = animatedBars ? getBarHeight(d.value) : 0;
                        const isHovered = hoveredBar === i;
                        const hasValue  = d.value > 0;
                        return (
                          <div key={i} className="relative flex-1 h-full flex items-end cursor-pointer"
                            onMouseEnter={() => setHoveredBar(i)}
                            onMouseLeave={() => setHoveredBar(null)}
                          >
                            <div className="w-full rounded-t-sm transition-all duration-700 ease-out"
                              style={{
                                height: `${pct}%`,
                                background: isHovered
                                  ? 'linear-gradient(to top, #1a0f2e, #7c3aed)'
                                  : hasValue ? '#3b2063' : '#f4f4f5',
                                opacity: hasValue ? (isHovered ? 1 : 0.55 + (i / filteredTodayData.length) * 0.35) : 1,
                                transitionDelay: `${i * 18}ms`,
                                transform: isHovered ? 'scaleX(1.15)' : 'scaleX(1)',
                              }}
                            />
                            {isHovered && hasValue && (
                              <div style={{
                                position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%',
                                transform: 'translateX(-50%)', zIndex: 20,
                                background: '#1a0f2e', color: '#fff', borderRadius: '0.5rem',
                                padding: '5px 10px', whiteSpace: 'nowrap', pointerEvents: 'none',
                                boxShadow: '0 4px 16px rgba(0,0,0,0.18)', textAlign: 'center',
                              }}>
                                <p style={{ fontSize: '0.5rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.5, margin: 0, marginBottom: 2 }}>
                                  {d.label}
                                </p>
                                <p style={{ fontSize: '0.8rem', fontWeight: 800, margin: 0 }}>
                                  ₱ {d.value.toLocaleString()}
                                </p>
                                <div style={{
                                  position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
                                  width: 0, height: 0,
                                  borderLeft: '4px solid transparent', borderRight: '4px solid transparent',
                                  borderTop: '4px solid #1a0f2e',
                                }} />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: '#f4f4f5' }}>
                        <Activity size={16} color="#d4d4d8" />
                      </div>
                      <p className="sd-label" style={{ color: '#d4d4d8' }}>No shift activity recorded</p>
                    </div>
                  )}
                </div>

                {/* X axis labels */}
                <div className="flex gap-0 px-0.5 mt-2 pt-2 border-t border-gray-50">
                  {filteredTodayData.map((d, i) => (
                    <div key={i} className="flex-1 text-center">
                      {LABEL_HOURS.has(d.hour) && (
                        <p className="sd-label" style={{ color: '#d4d4d8', fontSize: '0.54rem' }}>{d.label}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer total — mirrors dashboard's bottom bar */}
            <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
              <p className="sd-label" style={{ color: '#a1a1aa' }}>Today's total</p>
              <p style={{ fontSize: '0.92rem', fontWeight: 800, color: '#3b2063', letterSpacing: '-0.02em' }}>
                {fmt(stats.today_sales ?? 0)}
              </p>
            </div>
          </div>
        </div>

      </section>
    </>
  );
};

export default SalesDashboard;