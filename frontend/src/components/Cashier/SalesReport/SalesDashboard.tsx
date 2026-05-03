"use client"

import { useState, useEffect, useRef } from 'react';
import TopNavbar from '../../Cashier/TopNavbar';
import api from '../../../services/api';
import { 
  TrendingUp,  
  BarChart3, 
  AlertCircle, 
  Banknote, 
  History, 
  FileText,
  Activity,
  Lock
} from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

const WEEKLY_HEIGHT = 160;
const TODAY_HEIGHT = 160;
const CACHE_KEY = 'lucky_boba_sales_analytics';
const FIXED_TODAY_MAX = 5000;

// ============================================================
// TYPES
// ============================================================

interface WeeklyDataPoint {
  day: string;
  date: string;
  value: number;
  full_date: string;
}

interface TodayDataPoint {
  time: string;
  value: number;
}

interface SalesStats {
  beginning_sales: number;
  today_sales: number;
  ending_sales: number;
  cancelled_sales: number;
  beginning_or: number | string;
  ending_or: number | string;
  total_revenue?: number;
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

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  isSuccess?: boolean;
  isBrand?: boolean;
  isDanger?: boolean;
}

// ============================================================
// STAT CARD
// ============================================================

const StatCard = ({ label, value, icon, isSuccess, isBrand, isDanger }: StatCardProps) => (
  <div className={`px-5 py-4 border flex flex-col justify-between shadow-sm transition-all rounded-[0.625rem] ${
    isBrand ? 'bg-[#6a12b8] border-[#6a12b8]' : 'bg-white border-zinc-200 hover:border-[#e9d5ff]'
  }`}>
    <div className="flex items-center justify-between mb-3">
      <p className={`text-[10px] font-bold uppercase tracking-widest ${isBrand ? 'text-[#e9d5ff]' : 'text-zinc-500'}`}>
        {label}
      </p>
      <div className={`w-7 h-7 flex items-center justify-center rounded-sm ${
        isBrand ? 'bg-white/10 text-[#e9d5ff]' : 'bg-[#f5f0ff] border border-[#e9d5ff] text-[#6a12b8]'
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

// ============================================================
// AdminPinOverlay — reused from POS modal, gates the Dashboard
// ============================================================

const AdminPinOverlay = ({
  onCancel,
  onSuccess,
}: {
  onCancel: () => void;
  onSuccess: () => void;
}) => {
  const [pin, setPin]         = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api';

  const getHeaders = (): Record<string, string> => {
    const token =
      localStorage.getItem('auth_token') ??
      localStorage.getItem('lucky_boba_token') ??
      localStorage.getItem('token') ??
      '';
    return {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  const handleSubmit = async () => {
    if (!pin.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res  = await fetch(`${API_BASE}/auth/verify-manager-pin`, {
        method:  'POST',
        headers: getHeaders(),
        body:    JSON.stringify({ pin }),
      });
      const json = await res.json();
      if (json.success) {
        onSuccess();
      } else {
        setError(json.message ?? 'Incorrect PIN. Try again.');
        setPin('');
      }
    } catch {
      setError('Connection error. Try again.');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[0.625rem] shadow-2xl w-72 overflow-hidden text-center">
        <div className="bg-[#6a12b8] px-6 py-5 text-white">
          <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/50 mb-1">Authorization Required</p>
          <h3 className="text-base font-black uppercase tracking-widest">Admin PIN</h3>
          <p className="text-white/50 text-[10px] mt-1">Enter admin PIN to view analytics</p>
        </div>
        <div className="p-5 space-y-4">
          <input
            type="password"
            value={pin}
            onChange={e => setPin(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="••••"
            autoFocus
            className="w-full bg-[#f5f0ff] border-2 border-[#e9d5ff] rounded-[0.625rem] py-3 px-4 text-center text-2xl font-black tracking-[0.5em] outline-none focus:border-[#6a12b8] transition-colors"
          />
          {error && (
            <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">{error}</p>
          )}
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="flex-1 py-3 rounded-[0.625rem] border-2 border-zinc-200 text-zinc-500 font-black text-xs uppercase tracking-widest hover:bg-zinc-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !pin.trim()}
              className="flex-1 py-3 rounded-[0.625rem] bg-[#6a12b8] hover:bg-[#6a12b8] text-white font-black text-xs uppercase tracking-widest transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? '...' : 'Confirm'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// COMPONENT
// ============================================================

const SalesDashboard = () => {
  const [payload, setPayload] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const [showPinOverlay, setShowPinOverlay] = useState(false);
  const [hoveredValue, setHoveredValue] = useState<HoveredValuePoint | null>(null);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [animatedBars, setAnimatedBars] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
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

  const handlePinSuccess = async () => {
    setShowPinOverlay(false);
    showToast('Access granted. Syncing analytics...', 'success');
    await fetchAnalytics();
  };

  const handlePinCancel = () => {
    setShowPinOverlay(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedBars(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!payload && !loading) {
    return (
      <div className="flex-1 bg-[#f4f2fb] h-full flex flex-col">
        <TopNavbar />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center font-sans">
          <div className="bg-white p-10 rounded-[0.625rem] shadow-sm border border-zinc-200 max-w-sm w-full">
            <div className="w-16 h-16 bg-[#f5f0ff] rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock size={32} className="text-[#6a12b8]" />
            </div>
            <h2 className="text-xl font-black text-[#1a0f2e] uppercase tracking-widest mb-2">Sales Analytics</h2>
            <p className="text-xs text-zinc-400 mb-8 leading-relaxed">Authorization required to view detailed sales performance, revenue audits, and shift analytics.</p>
            <button 
              onClick={() => setShowPinOverlay(true)}
              className="w-full py-4 bg-[#6a12b8] text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-[0.625rem] hover:shadow-lg transition-all active:scale-[0.98]"
            >
              Authorize & View
            </button>
          </div>
        </div>
        {showPinOverlay && (
          <AdminPinOverlay
            onCancel={handlePinCancel}
            onSuccess={handlePinSuccess}
          />
        )}
      </div>
    );
  }

  if (loading && !payload) {
    return (
      <div className="flex-1 bg-[#f4f2fb] h-full flex flex-col">
        <TopNavbar />
        <div className="flex-1 flex flex-col items-center justify-center font-sans">
          <div className="w-10 h-10 border-2 border-[#6a12b8] border-t-transparent animate-spin rounded-none" />
          <p className="mt-4 text-[9px] font-black uppercase tracking-[0.4em] text-zinc-400">Syncing Terminal Analytics...</p>
        </div>
      </div>
    );
  }

  if (!payload) return null;

  // ============================================================
  // DERIVED DATA
  // ============================================================

  const weekly       = payload.weekly_sales?.data         ?? [];
  const todayData    = payload.today_sales?.data           ?? [];
  const stats        = payload.statistics                  ?? {} as SalesStats;
  const totalRevenue = payload.weekly_sales?.total_revenue ?? 0;

  // ── WEEKLY GRAPH LOGIC ──
  const WEEKLY_MAX = weekly.length > 0 ? Math.max(...weekly.map(d => d.value), 10000) : 10000;
  const getLineY = (value: number) => WEEKLY_HEIGHT - (value / WEEKLY_MAX) * WEEKLY_HEIGHT;

  const linePoints: HoveredValuePoint[] = weekly.map((data, index) => {
    const totalPoints = weekly.length - 1;
    const dateObj = new Date(data.date + 'T00:00:00');
    const displayDate = isNaN(dateObj.getTime()) 
      ? data.date 
      : dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
    return {
      x: totalPoints > 0 ? (index / totalPoints) * 100 : 50,
      y: getLineY(data.value),
      value: data.value,
      date: `${data.day} — ${displayDate}`,
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
    ? (() => {
        const first = new Date(weekly[0].date + 'T00:00:00');
        const last = new Date(weekly[weekly.length - 1].date + 'T00:00:00');
        const fmt = (d: Date) => isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return `${fmt(first)} — ${fmt(last)}, ${new Date().getFullYear()}`;
      })()
    : 'No data available';

  // ── TODAY GRAPH LOGIC ──
  const getBarHeight = (value: number) => Math.min((value / FIXED_TODAY_MAX) * 100, 100);
  const yLabels = [5000, 4000, 3000, 2000, 1000, 0];

  const DISPLAY_HOURS = [9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,0];
  const HOUR_LABELS: Record<number, string> = {
    9: '9AM', 10: '10AM', 11: '11AM', 12: '12PM', 13: '1PM', 14: '2PM',
    15: '3PM', 16: '4PM', 17: '5PM', 18: '6PM', 19: '7PM', 20: '8PM',
    21: '9PM', 22: '10PM', 23: '11PM', 0: '12MN',
  };

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

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="flex-1 bg-[#f4f2fb] h-full flex flex-col overflow-hidden">
      <TopNavbar />

      <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col gap-4">

        {/* ── WEEKLY REVENUE CHART ── */}
        <div className="bg-white border border-zinc-200 rounded-[0.625rem] p-6 md:p-8 shadow-sm">
          <div className="flex items-start justify-between mb-8 border-b border-zinc-100 pb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#6a12b8] text-white rounded-sm"><BarChart3 size={20} /></div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400">Revenue Performance</p>
                <h2 className="text-[#6a12b8] font-black text-lg uppercase tracking-widest leading-none mt-1">Weekly Sales Audit</h2>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-1">Total Revenue</p>
              <p className="text-2xl font-black text-emerald-500 leading-none tabular-nums tracking-tighter">
                {fmt(totalRevenue)}
              </p>
              <p className="text-[8px] font-black text-zinc-300 uppercase tracking-widest mt-2">{dateRangeText}</p>
            </div>
          </div>

          <div className="flex gap-6">
            {/* Y-axis */}
            <div className="flex flex-col justify-between text-right shrink-0 w-10 pb-8" style={{ height: WEEKLY_HEIGHT + 24 }}>
              {[WEEKLY_MAX, WEEKLY_MAX * 0.75, WEEKLY_MAX * 0.5, WEEKLY_MAX * 0.25, 0].map((v, i) => (
                <span key={i} className="text-[10px] font-black text-zinc-300 tabular-nums">
                  {v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
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
                      <stop offset="0%" stopColor="#6a12b8" />
                      <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                    <linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6a12b8" stopOpacity="0.10" />
                      <stop offset="100%" stopColor="#6a12b8" stopOpacity="0" />
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
                    <div className="w-4 h-4 rounded-full bg-white border-2 border-[#6a12b8] group-hover:scale-150 transition-transform duration-150 shadow-sm" />
                    {hoveredValue === p && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 pointer-events-none z-20">
                        <div className="bg-[#1a0f2e] text-white px-3 py-2 rounded-[0.375rem] border border-[#e9d5ff]/10 shadow-2xl text-center whitespace-nowrap">
                          <p className="text-[8px] font-black uppercase tracking-widest text-[#e9d5ff]/60 mb-1">{p.date}</p>
                          <p className="text-sm font-black tabular-nums">₱ {p.value.toLocaleString()}</p>
                        </div>
                        <div className="w-2 h-2 bg-[#1a0f2e] rotate-45 mx-auto -mt-1" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-between pt-3 mt-1 border-t border-zinc-100">
                {weekly.map((d, i) => {
                  const dateObj = new Date(d.date + 'T00:00:00');
                  const dayNum = isNaN(dateObj.getTime()) ? '' : dateObj.getDate();
                  return (
                    <div key={i} className="text-center" style={{ width: `${100 / weekly.length}%` }}>
                      <p className="text-[9px] font-black uppercase text-[#6a12b8] tracking-widest">{d.day}</p>
                      <p className="text-[8px] font-black text-zinc-300 uppercase">{dayNum}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── BOTTOM GRID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1">

          <div className="grid grid-cols-2 gap-3 content-start">
            <StatCard label="Beginning Sales" value={fmt(stats.beginning_sales ?? 0)} icon={<Banknote size={14} />} />
            <StatCard label="Today Gross"     value={fmt(stats.today_sales ?? 0)}     icon={<TrendingUp size={14} />} isSuccess />
            <StatCard label="Ending Sales"    value={fmt(stats.ending_sales ?? 0)}    icon={<Activity size={14} />} isBrand />
            <StatCard label="Voided Journal"  value={fmt(stats.cancelled_sales ?? 0)} icon={<AlertCircle size={14} />} isDanger />
            <StatCard label="Beginning OR"    value={String(stats.beginning_or ?? '—')} icon={<FileText size={14} />} />
            <StatCard label="Ending OR"       value={String(stats.ending_or ?? '—')}   icon={<History size={14} />} isBrand />
          </div>

          {/* ── HOURLY CHART ── */}
          <div className="bg-white border border-zinc-200 rounded-[0.625rem] p-6 md:p-8 shadow-sm flex flex-col">
            <div className="flex items-start justify-between mb-8 border-b border-zinc-100 pb-4">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-400">Shift Analytics</p>
                <h3 className="text-[#6a12b8] font-black text-sm uppercase tracking-widest mt-1">Hourly Sales Distribution</h3>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-[0.375rem]">
                <span className="w-1.5 h-1.5 bg-emerald-400 animate-pulse rounded-full" />
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600">Live</span>
              </div>
            </div>

            <div className="flex gap-3 flex-1" ref={barRef}>
              <div className="flex flex-col justify-between text-right shrink-0 w-8 pb-5" style={{ height: TODAY_HEIGHT + 20 }}>
                {yLabels.map(v => (
                  <span key={v} className="text-[10px] font-black text-zinc-300 tabular-nums leading-none">
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
                    <div className="absolute inset-0 flex items-end gap-1 px-1">
                      {filteredTodayData.map((d, i) => {
                        const pct       = animatedBars ? getBarHeight(d.value) : 0;
                        const isHovered = hoveredBar === i;
                        const hasValue  = d.value > 0;
                        return (
                          <div key={i} className="relative flex-1 h-full flex items-end group cursor-pointer"
                            onMouseEnter={() => setHoveredBar(i)}
                            onMouseLeave={() => setHoveredBar(null)}
                          >
                            <div className="w-full rounded-t-sm transition-all duration-700 ease-out"
                              style={{
                                height: `${pct}%`,
                                background: isHovered
                                  ? 'linear-gradient(to top, #6a12b8, #a855f7)'
                                  : hasValue ? '#6a12b8' : '#f5f0ff',
                                transitionDelay: `${i * 20}ms`,
                              }} />
                            {isHovered && hasValue && (
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none z-20">
                                <div className="bg-[#1a0f2e] text-white px-2.5 py-1.5 rounded-[0.375rem] shadow-xl text-center whitespace-nowrap">
                                  <p className="text-[9px] font-black uppercase tracking-widest text-[#e9d5ff]/70">{d.label}</p>
                                  <p className="text-xs font-black">₱ {d.value.toLocaleString()}</p>
                                </div>
                                <div className="w-1.5 h-1.5 bg-[#1a0f2e] rotate-45 mx-auto -mt-0.5" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-200">No shift activity recorded</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-0.5 px-0.5 mt-2 border-t border-zinc-100 pt-2">
                  {filteredTodayData.map((d, i) => (
                    <div key={i} className="flex-1 text-center">
                      {LABEL_HOURS.has(d.hour) && (
                        <p className="text-[8px] font-black text-zinc-300 uppercase leading-none tracking-tighter">{d.label}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
      {showPinOverlay && (
        <AdminPinOverlay
          onCancel={handlePinCancel}
          onSuccess={handlePinSuccess}
        />
      )}
    </div>
  );
};

export default SalesDashboard;
