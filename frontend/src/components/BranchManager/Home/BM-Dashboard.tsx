import { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, AlertCircle,
  ShoppingBag, Activity, ArrowUpRight, ArrowDownRight,
  Wallet, RefreshCw, Package,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart as ReBarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import api from '../../../services/api';

// ── Types ─────────────────────────────────────────────────────────────────────
interface TopSellerItem { product_name: string; total_qty: number; }
interface DashboardStatsData {
  cash_in_today:        number;
  cash_out_today:       number;
  total_sales_today:    number;
  total_orders_today:   number;
  voided_sales_today:   number;
  top_seller_today:     TopSellerItem[];
  top_seller_all_time:  TopSellerItem[];
  spark_cash_in?:       number[];
  spark_cash_out?:      number[];
  spark_sales?:         number[];
  spark_voided?:        number[];
  spark_overall?:       number[];
  cash_in_yesterday?:      number;
  cash_out_yesterday?:     number;
  sales_yesterday?:        number;
  voided_yesterday?:       number;
  overall_cash_yesterday?: number;
  overall_cash_today?:     number;
}
interface SalesAnalyticsResponse {
  weekly:    { date: string; day: string; value: number }[];
  monthly:   { date: string; day: string; value: number }[];
  quarterly: { date: string; day: string; value: number }[];
  stats:     DashboardStatsData;
}
interface ChartTipProps {
  active?:    boolean;
  payload?:   { value: number; payload: { name: string } }[];
  avgRevenue: number;
}

// ── Design tokens — identical to SuperAdmin ───────────────────────────────────
type ColorKey   = 'violet' | 'emerald' | 'red' | 'amber' | 'sky';
type VariantKey = 'primary' | 'secondary' | 'danger' | 'ghost';
type SizeKey    = 'sm' | 'md' | 'lg';

const COLOR_MAP: Record<ColorKey, { bg: string; border: string; icon: string }> = {
  violet:  { bg: 'bg-violet-50',  border: 'border-violet-200',  icon: 'text-violet-600'  },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'text-emerald-600' },
  red:     { bg: 'bg-red-50',     border: 'border-red-200',     icon: 'text-red-500'     },
  amber:   { bg: 'bg-amber-50',   border: 'border-amber-200',   icon: 'text-amber-600'   },
  sky:     { bg: 'bg-sky-50',     border: 'border-sky-200',     icon: 'text-sky-600'     },
};

// ── StatCard — exact copy from OverviewTab ────────────────────────────────────
interface StatCardProps {
  icon: React.ReactNode; label: string; value: string | number;
  sub?: string; trend?: number; color?: ColorKey;
}
const StatCard: React.FC<StatCardProps> = ({ icon, label, value, sub, trend, color = 'violet' }) => {
  const c = COLOR_MAP[color];
  return (
    <div className="bg-white border border-zinc-200 rounded-[0.625rem] px-6 py-5 flex items-center justify-between card">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 ${c.bg} border ${c.border} flex items-center justify-center rounded-[0.4rem]`}>
          <span className={c.icon}>{icon}</span>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{label}</p>
          <p className="text-xl font-bold text-[#1a0f2e] tabular-nums">{value}</p>
        </div>
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 text-xs font-bold ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
          {trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {Math.abs(trend)}%
        </div>
      )}
      {sub && <p className="text-xs text-zinc-400 font-medium">{sub}</p>}
    </div>
  );
};

// ── SectionHeader — exact copy from OverviewTab ───────────────────────────────
interface SectionHeaderProps { title: string; desc?: string; action?: React.ReactNode; }
const SectionHeader: React.FC<SectionHeaderProps> = ({ title, desc, action }) => (
  <div className="flex items-center justify-between mb-5">
    <div>
      <h2 className="text-base font-bold text-[#1a0f2e]">{title}</h2>
      {desc && <p className="text-xs text-zinc-400 mt-0.5">{desc}</p>}
    </div>
    {action}
  </div>
);

// ── Btn — exact copy from OverviewTab ─────────────────────────────────────────
interface BtnProps {
  children: React.ReactNode; variant?: VariantKey; size?: SizeKey;
  onClick?: () => void; className?: string; disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}
const Btn: React.FC<BtnProps> = ({
  children, variant = 'primary', size = 'sm',
  onClick, className = '', disabled = false, type = 'button',
}) => {
  const sizes:    Record<SizeKey,    string> = { sm: 'px-3 py-2 text-xs', md: 'px-4 py-2.5 text-sm', lg: 'px-6 py-3 text-sm' };
  const variants: Record<VariantKey, string> = {
    primary:   'bg-[#3b2063] hover:bg-[#2a1647] text-white',
    secondary: 'bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50',
    danger:    'bg-red-600 hover:bg-red-700 text-white',
    ghost:     'bg-transparent text-zinc-500 hover:bg-zinc-100',
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`inline-flex items-center gap-1.5 font-bold rounded-lg transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 ${sizes[size]} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

// ── SkeletonBar — exact copy from OverviewTab ─────────────────────────────────
const SkeletonBar: React.FC<{ w?: string; h?: string }> = ({ w = 'w-full', h = 'h-4' }) => (
  <div className={`${w} ${h} bg-zinc-100 rounded animate-pulse`} />
);

// ── Sparkline mini bar ────────────────────────────────────────────────────────
const ALL_SPARK_LABELS = ['6d ago', '5d ago', '4d ago', '3d ago', '2d ago', 'Yesterday', 'Today'];
const getSparkLabels   = (len: number) => ALL_SPARK_LABELS.slice(ALL_SPARK_LABELS.length - len);

const MiniBar: React.FC<{ values: number[]; color: string; formatter: (v: number) => string }> = ({
  values, color, formatter,
}) => {
  const max    = Math.max(...values, 1);
  const labels = getSparkLabels(values.length);
  const [hovered, setHovered] = useState<number | null>(null);
  const [pinned,  setPinned]  = useState<number | null>(null);
  const activeTip = hovered ?? pinned;

  return (
    <div className="flex items-end gap-[2px] h-8 relative">
      {values.map((v, i) => {
        const isActive = activeTip === i;
        const isPinned = pinned === i;
        const barH     = v === 0 ? 0 : Math.max((v / max) * 100, 8);
        return (
          <div key={i}
            className="flex-1 flex flex-col items-center justify-end h-full relative cursor-pointer"
            onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}
            onClick={() => setPinned(isPinned ? null : i)}
          >
            {isActive && (
              <div className="absolute bottom-[calc(100%+7px)] left-1/2 -translate-x-1/2 z-30 bg-[#1a0f2e] text-white rounded-[0.45rem] px-2.5 py-1.5 whitespace-nowrap pointer-events-none shadow-lg min-w-[70px] text-center">
                <p className="text-[8px] font-bold tracking-widest uppercase opacity-55 mb-0.5">{labels[i] ?? `Day ${i + 1}`}</p>
                <p className="text-[11px] font-black tracking-tight">{formatter(v)}</p>
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-l-transparent border-r-transparent border-t-[#1a0f2e]" />
              </div>
            )}
            {v === 0 ? (
              <div className="w-full h-[2px] rounded-sm" style={{ background: color, opacity: 0.12 }} />
            ) : (
              <div className="w-full rounded-sm transition-all duration-75" style={{
                height: `${barH}%`, background: isPinned ? '#1a0f2e' : color,
                opacity: isActive ? 1 : 0.3 + (i / values.length) * 0.5,
                transform: isActive ? 'scaleX(1.2)' : 'scaleX(1)',
                outline: isPinned ? `2px solid ${color}` : 'none', outlineOffset: '1px',
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
};

// ── Chart tooltip ─────────────────────────────────────────────────────────────
const ChartTip: React.FC<ChartTipProps> = ({ active, payload, avgRevenue }) => {
  if (!active || !payload?.length) return null;
  const val  = payload[0].value;
  const diff = val - avgRevenue;
  const pct  = avgRevenue ? ((diff / avgRevenue) * 100).toFixed(1) : '0';
  return (
    <div className="bg-white border border-zinc-200 rounded-[0.625rem] px-3.5 py-2.5 shadow-lg">
      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">{payload[0].payload.name}</p>
      <p className="text-base font-black text-[#1a0f2e] tracking-tight">₱{val.toLocaleString()}</p>
      <p className={`text-[10px] font-bold mt-1 ${diff >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
        {diff >= 0 ? '▲' : '▼'} {Math.abs(Number(pct))}% vs avg
      </p>
    </div>
  );
};

// ── Cache ─────────────────────────────────────────────────────────────────────
const CACHE_VERSION = 'v4';
const cacheKey = (id: number | null) => `lucky_boba_analytics_${CACHE_VERSION}_branch_${id ?? 'all'}`;

// ── BMDashboard ───────────────────────────────────────────────────────────────
interface BMDashboardProps { branchId: number | null; }

const BMDashboard: React.FC<BMDashboardProps> = ({ branchId }) => {
  const CACHE_KEY = cacheKey(branchId);

  const [analytics,  setAnalytics]  = useState<SalesAnalyticsResponse | null>(() => {
    try { const c = localStorage.getItem(CACHE_KEY); return c ? JSON.parse(c) : null; } catch { return null; }
  });
  const [loading,    setLoading]    = useState(!analytics);
  const [timeFilter, setTimeFilter] = useState<'7days' | '30days' | '3months'>('7days');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<SalesAnalyticsResponse>('/sales-analytics');
      setAnalytics(res.data);
      localStorage.setItem(CACHE_KEY, JSON.stringify(res.data));
    } catch (e) {
      console.error('analytics fetch', e);
    } finally {
      setLoading(false);
    }
  }, [CACHE_KEY]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Formatters ───────────────────────────────────────────────────────────
  const fmt    = (v?: number | string) => `₱${Number(v ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
  const fmtK   = (v?: number | string) => {
    const n = Number(v ?? 0);
    if (n >= 1_000_000) return `₱${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `₱${(n / 1_000).toFixed(1)}K`;
    return `₱${n.toFixed(0)}`;
  };
  const fmtTip = (v: number) => {
    if (v >= 1_000_000) return `₱${(v / 1_000_000).toFixed(2)}M`;
    if (v >= 1_000)     return `₱${(v / 1_000).toFixed(1)}K`;
    return `₱${v.toFixed(2)}`;
  };
  const yFmt = (v: number) => {
    if (v === 0)        return '₱0';
    if (v >= 1_000_000) return `₱${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000)     return `₱${(v / 1_000).toFixed(0)}k`;
    return `₱${v}`;
  };

  const sd = analytics?.stats;

  const toSpark = (s: number[] | undefined, today: number): number[] => {
    if (!s || s.length === 0) return [today];
    const a = [...s]; a[a.length - 1] = today; return a;
  };

  const sparklines = {
    cashIn:  toSpark(sd?.spark_cash_in,  Number(sd?.cash_in_today      ?? 0)),
    cashOut: toSpark(sd?.spark_cash_out, Number(sd?.cash_out_today     ?? 0)),
    sales:   toSpark(sd?.spark_sales,    Number(sd?.total_sales_today  ?? 0)),
    voided:  toSpark(sd?.spark_voided,   Number(sd?.voided_sales_today ?? 0)),
    overall: toSpark(sd?.spark_overall,  Number(sd?.overall_cash_today ?? 0)),
  };

  const computeTrend = (today: number, yesterday: number) => {
    if (yesterday === 0 && today === 0) return { label: '—', up: null };
    if (yesterday === 0)               return { label: 'New', up: true };
    const pct = ((today - yesterday) / yesterday) * 100;
    return { label: `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`, up: pct >= 0 };
  };

  const trendCI = computeTrend(Number(sd?.cash_in_today     ?? 0), Number(sd?.cash_in_yesterday      ?? 0));
  const trendCO = computeTrend(Number(sd?.cash_out_today     ?? 0), Number(sd?.cash_out_yesterday     ?? 0));
  const trendS  = computeTrend(Number(sd?.total_sales_today  ?? 0), Number(sd?.sales_yesterday        ?? 0));
  const trendV  = computeTrend(Number(sd?.voided_sales_today ?? 0), Number(sd?.voided_yesterday       ?? 0));
  const trendO  = computeTrend(Number(sd?.overall_cash_today ?? 0), Number(sd?.overall_cash_yesterday ?? 0));
  const overallCash = Number(sd?.cash_in_today ?? 0) + Number(sd?.total_sales_today ?? 0) - Number(sd?.cash_out_today ?? 0);

  // ── Chart ────────────────────────────────────────────────────────────────
  const chartData = (() => {
    const raw = timeFilter === '30days'  ? (analytics?.monthly   ?? [])
              : timeFilter === '3months' ? (analytics?.quarterly ?? [])
              :                            (analytics?.weekly    ?? []);
    return raw.map(d => {
      const o = new Date(d.date);
      const label = timeFilter === '3months'
        ? (isNaN(o.getTime()) ? d.day  : `Wk ${o.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`)
        : (isNaN(o.getTime()) ? d.date : o.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      return { name: label, value: d.value };
    });
  })();

  const totalRevenue = chartData.reduce((a, b) => a + b.value, 0);
  const avgRevenue   = chartData.length ? totalRevenue / chartData.length : 0;
  const maxDay       = chartData.reduce((a, b) => b.value > a.value ? b : a, chartData[0] ?? { name: '—', value: 0 });
  const maxVal       = Math.max(...chartData.map(d => d.value), 1);
  const stepSize     = timeFilter === '3months' ? 10_000 : 2_000;
  const niceMax      = Math.ceil(maxVal / stepSize) * stepSize;
  const yTicks       = Array.from({ length: Math.min(Math.ceil(niceMax / stepSize) + 1, 7) }, (_, i) => i * stepSize);

  const sellersToday   = sd?.top_seller_today    ?? [];
  const sellersAllTime = sd?.top_seller_all_time ?? [];
  const allTimeMax     = Math.max(...sellersAllTime.map(x => x.total_qty), 1);
  const todayMax       = Math.max(...sellersToday.map(x => x.total_qty), 1);
  const purples        = ['#3b2063', '#6d3fa8', '#9b6bd4', '#c4a8e8', '#ddd0f8'];

  // ── Stat card data ───────────────────────────────────────────────────────
  type SparkCard = {
    label: string; sub: string; compact: string; full: string;
    icon: React.ReactNode; color: ColorKey;
    trend: string; trendUp: boolean | null;
    sparkColor: string; spark: number[];
  };

  const sparkCards: SparkCard[] = [
    { label: 'Cash In',      sub: 'Opening float today',    compact: fmtK(sd?.cash_in_today),      full: fmt(sd?.cash_in_today),      icon: <TrendingUp  size={18} strokeWidth={2} />, color: 'emerald', trend: trendCI.label, trendUp: trendCI.up, sparkColor: '#16a34a', spark: sparklines.cashIn  },
    { label: 'Cash Out',     sub: 'Total disbursed today',  compact: fmtK(sd?.cash_out_today),     full: fmt(sd?.cash_out_today),     icon: <TrendingDown size={18} strokeWidth={2}/>, color: 'red',     trend: trendCO.label, trendUp: trendCO.up, sparkColor: '#dc2626', spark: sparklines.cashOut },
    { label: 'Total Sales',  sub: 'Gross revenue today',    compact: fmtK(sd?.total_sales_today),  full: fmt(sd?.total_sales_today),  icon: <DollarSign  size={18} strokeWidth={2} />, color: 'violet',  trend: trendS.label,  trendUp: trendS.up,  sparkColor: '#7c3aed', spark: sparklines.sales   },
    { label: 'Voided Sales', sub: 'Cancelled transactions', compact: fmtK(sd?.voided_sales_today), full: fmt(sd?.voided_sales_today), icon: <AlertCircle size={18} strokeWidth={2} />, color: 'amber',   trend: trendV.label,  trendUp: trendV.up,  sparkColor: '#ca8a04', spark: sparklines.voided  },
    { label: 'Overall Cash', sub: 'Cash In + Sales − Drop', compact: fmtK(overallCash),            full: fmt(overallCash),            icon: <Wallet      size={18} strokeWidth={2} />, color: 'sky',     trend: trendO.label,  trendUp: trendO.up,  sparkColor: '#0284c7', spark: sparklines.overall },
  ];

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="p-6 md:p-8 flex flex-col gap-6 fade-in">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-[#1a0f2e]">Branch Dashboard</h2>
          <p className="text-xs text-zinc-400 mt-0.5">Today's live performance overview</p>
        </div>
        <Btn variant="secondary" onClick={fetchData} disabled={loading}>
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          Refresh
        </Btn>
      </div>

      {/* ── Spark Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {sparkCards.map((s, i) => {
          const c = COLOR_MAP[s.color];
          return (
            <div key={i} className="bg-white border border-zinc-200 rounded-[0.625rem] px-6 py-5 flex flex-col gap-3 card">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${c.bg} border ${c.border} flex items-center justify-center rounded-[0.4rem] shrink-0`}>
                    <span className={c.icon}>{s.icon}</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{s.label}</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">{s.sub}</p>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xl font-bold text-[#1a0f2e] tabular-nums">{loading ? '—' : s.compact}</p>
                <p className="text-[10px] text-zinc-400 mt-0.5">{loading ? '' : s.full}</p>
              </div>
              <MiniBar values={s.spark} color={s.sparkColor} formatter={fmtTip} />
              <div className="flex items-center justify-between pt-1 border-t border-zinc-100">
                <span className="text-[10px] text-zinc-400">vs yesterday</span>
                {s.trend === '—' ? (
                  <span className="text-[10px] font-bold text-zinc-400">—</span>
                ) : (
                  <span className={`text-[10px] font-bold flex items-center gap-0.5 ${s.trendUp ? 'text-emerald-600' : 'text-red-500'}`}>
                    {s.trendUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                    {s.trend}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Quick Stats — uses SuperAdmin StatCard ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={<ShoppingBag  size={18} strokeWidth={2} />} label="Total Orders"    value={loading ? '—' : Number(sd?.total_orders_today ?? 0).toLocaleString()} color="violet" />
        <StatCard icon={<Activity     size={18} strokeWidth={2} />} label="Avg Order Value" value={loading ? '—' : fmt(Number(sd?.total_sales_today ?? 0) / Math.max(Number(sd?.total_orders_today ?? 1), 1))} color="violet" />
        <StatCard icon={<ArrowUpRight size={18} strokeWidth={2} />} label="Net Cash Flow"   value={loading ? '—' : fmt(Number(sd?.cash_in_today ?? 0) - Number(sd?.cash_out_today ?? 0))} color="emerald" />
        <StatCard icon={<AlertCircle  size={18} strokeWidth={2} />} label="Void Rate"       value={loading ? '—' : `${((Number(sd?.voided_sales_today ?? 0) / Math.max(Number(sd?.total_sales_today ?? 1), 1)) * 100).toFixed(1)}%`} color="amber" />
      </div>

      {/* ── Revenue Chart + Top Sellers ── */}
      <div className="grid grid-cols-12 gap-4">

        <div className="col-span-12 lg:col-span-8 bg-white border border-zinc-200 rounded-[0.625rem] p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Revenue Trend</p>
              <p className="text-xl font-bold text-[#1a0f2e] mt-0.5 capitalize">
                {timeFilter === '7days' ? 'Weekly' : timeFilter === '30days' ? 'Monthly' : 'Quarterly'} Overview
              </p>
              <div className="flex items-center gap-4 mt-1">
                {[['Total', `₱${totalRevenue.toLocaleString()}`], ['Avg/day', `₱${avgRevenue.toFixed(0)}`], ['Peak', maxDay?.name]].map(([lbl, val], j) => (
                  <div key={j} className="flex items-center gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{lbl}</span>
                    <span className={`text-xs font-bold ${j === 2 ? 'text-violet-600' : 'text-[#1a0f2e]'}`}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {(['7days', '30days', '3months'] as const).map(p => (
                <button key={p} onClick={() => setTimeFilter(p)} disabled={loading}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all capitalize disabled:opacity-50 cursor-pointer ${
                    timeFilter === p ? 'bg-[#3b2063] text-white' : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                  }`}>
                  {p === '7days' ? '7D' : p === '30days' ? '30D' : '3M'}
                </button>
              ))}
              <Btn variant="secondary" onClick={fetchData} disabled={loading}>
                <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              </Btn>
            </div>
          </div>

          {loading ? <SkeletonBar h="h-[220px]" /> : chartData.length === 0 ? (
            <div className="h-[220px] flex flex-col items-center justify-center gap-2 text-zinc-400">
              <Activity size={24} strokeWidth={1.5} />
              <p className="text-xs font-medium">No data for this period</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="bmRevGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b2063" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3b2063" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0eef8" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 600, fill: '#a1a1aa' }} axisLine={false} tickLine={false} minTickGap={20} />
                <YAxis tick={{ fontSize: 11, fontWeight: 600, fill: '#a1a1aa' }} axisLine={false} tickLine={false} ticks={yTicks} domain={[0, niceMax]} tickFormatter={yFmt} />
                <Tooltip content={<ChartTip avgRevenue={avgRevenue} />} contentStyle={{ borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 12 }} />
                <Area type="monotone" dataKey="value" name="Revenue" stroke="#3b2063" strokeWidth={2.5} fillOpacity={1} fill="url(#bmRevGrad)"
                  activeDot={{ r: 4, fill: '#3b2063', stroke: '#fff', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="col-span-12 lg:col-span-4 bg-white border border-zinc-200 rounded-[0.625rem] p-6 flex flex-col">
          <SectionHeader
            title="Top Sellers"
            desc="Today's performance"
            action={
              <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 pulse" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-700">Live</span>
              </div>
            }
          />
          <div className="flex-1 flex flex-col gap-2">
            {loading ? [...Array(5)].map((_, i) => <SkeletonBar key={i} h="h-8" />) :
             sellersToday.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-2 text-zinc-400">
                <Package size={24} strokeWidth={1.5} />
                <p className="text-xs font-medium">No sales yet today</p>
              </div>
            ) : sellersToday.slice(0, 6).map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-md bg-violet-50 border border-violet-200 flex items-center justify-center shrink-0">
                  <span className="text-[9px] font-black text-violet-600">{i + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-semibold text-zinc-700 truncate">{item.product_name}</span>
                    <span className="text-[10px] font-bold text-zinc-500 ml-2 shrink-0">{item.total_qty}x</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#3b2063] rounded-full" style={{ width: `${(item.total_qty / todayMax) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          {sellersToday.length > 0 && (
            <div className="mt-4 pt-3 border-t border-zinc-100">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                Total sold: <span className="text-[#1a0f2e]">{sellersToday.slice(0, 6).reduce((a, b) => a + Number(b.total_qty), 0)} items</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── All-Time Best Sellers + Rank Breakdown ── */}
      <div className="grid grid-cols-12 gap-4">

        <div className="col-span-12 lg:col-span-7 bg-white border border-zinc-200 rounded-[0.625rem] p-6">
          <SectionHeader
            title="All-Time Best Sellers"
            desc="Cumulative rankings"
            action={<span className="text-[10px] font-bold uppercase tracking-widest border border-zinc-200 bg-zinc-50 text-zinc-500 rounded-full px-2.5 py-1">Overall</span>}
          />
          {loading ? <SkeletonBar h="h-[180px]" /> : (
            <ResponsiveContainer width="100%" height={180}>
              <ReBarChart
                data={sellersAllTime.slice(0, 5).map(x => ({ name: x.product_name.replace('Lucky Boba ', '').split(' ')[0], qty: x.total_qty }))}
                barSize={28} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0eef8" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 600, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fontWeight: 600, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => [`${v} sold`, 'Qty'] as [string, string]} contentStyle={{ borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 12 }} />
                <Bar dataKey="qty" radius={[4, 4, 0, 0]}>
                  {sellersAllTime.slice(0, 5).map((_, i) => <Cell key={i} fill={purples[i] ?? '#ede9fe'} />)}
                </Bar>
              </ReBarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="col-span-12 lg:col-span-5 bg-white border border-zinc-200 rounded-[0.625rem] p-6">
          <SectionHeader title="Rank Breakdown" desc="Share of total volume" />
          {loading ? (
            <div className="flex flex-col gap-3">{[...Array(5)].map((_, i) => <SkeletonBar key={i} h="h-8" />)}</div>
          ) : sellersAllTime.length === 0 ? (
            <p className="text-xs font-medium text-zinc-400 text-center py-8">No records found</p>
          ) : (
            <div className="flex flex-col gap-2">
              {sellersAllTime.slice(0, 5).map((item, i) => {
                const pct = Math.round((item.total_qty / allTimeMax) * 100);
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-md bg-violet-50 border border-violet-200 flex items-center justify-center shrink-0">
                      <span className="text-[9px] font-black text-violet-600">{i + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-semibold text-zinc-700 truncate">{item.product_name}</span>
                        <span className="text-[10px] font-bold text-zinc-500 ml-2 shrink-0">{item.total_qty.toLocaleString()}</span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#3b2063] rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 shrink-0">{pct}%</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default BMDashboard;