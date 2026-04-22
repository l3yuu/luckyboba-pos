"use client"

import { useState, useEffect, useCallback } from 'react';
import api from '../../../services/api';
import {
  TrendingUp, TrendingDown, DollarSign, AlertCircle,
  ShoppingBag, Activity, ArrowUpRight, ArrowDownRight,
  Wallet, Download,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from 'recharts';


// ─── Global Styles ────────────────────────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');
    *, *::before, *::after, body, input, button, select, textarea {
      font-family: 'DM Sans', sans-serif !important;
      box-sizing: border-box;
    }
    .card { transition: box-shadow 0.15s ease, transform 0.15s ease; }
    .card:hover { box-shadow: 0 4px 24px rgba(59,32,99,0.08); }
    @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
    .fade-in { animation: fadeIn 0.25s ease forwards; }
    @keyframes bmd-pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
    .bmd-live-dot { width:6px; height:6px; border-radius:50%; background:#22c55e; box-shadow:0 0 5px rgba(34,197,94,0.6); animation:bmd-pulse 2s infinite; }
  `}</style>
);

// ─── Types ────────────────────────────────────────────────────────────────────
interface TopSellerItem { product_name: string; total_qty: number; }

interface PeriodStats {
  total_sales: number;
  total_orders: number;
  voided_sales: number;
  cash_in: number;
  cash_out: number;
}

interface PeriodData {
  data: { date: string; day: string; value: number }[];
  stats: PeriodStats;
  top_sellers: TopSellerItem[];
}

interface DashboardApiResponse {
  success: boolean;
  data: {
    daily_sales: { data: { date: string; day: string; value: number }[]; stats: PeriodStats; top_sellers: TopSellerItem[] };
    weekly_sales: { data: { date: string; day: string; value: number }[]; stats: PeriodStats; top_sellers: TopSellerItem[] };
    monthly_sales: { data: { date: string; day: string; value: number }[]; stats: PeriodStats; top_sellers: TopSellerItem[] };
    statistics: { top_seller_today?: TopSellerItem[] };
  };
}

interface SalesAnalyticsResponse {
  daily: PeriodData;
  weekly: PeriodData;
  monthly: PeriodData;
  top_seller_today: TopSellerItem[];
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface BM_DashboardProps {
  branchId: number | null;
}

// ─── Cache helpers ────────────────────────────────────────────────────────────
const CACHE_VERSION = 'v6';
const cacheKey = (branchId: number | null) =>
  `lucky_boba_analytics_${CACHE_VERSION}_branch_${branchId ?? 'all'}`;

// ─── Shared UI Components ─────────────────────────────────────────────────────
type ColorKey = "violet" | "emerald" | "red" | "amber" | "sky";
type VariantKey = "primary" | "secondary";
type SizeKey = "sm" | "md";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  trend?: { label: string; up: boolean | null };
  color?: ColorKey;
}

const COLORS: Record<ColorKey, { bg: string; border: string; icon: string }> = {
  violet: { bg: "bg-violet-50", border: "border-violet-200", icon: "text-violet-600" },
  emerald: { bg: "bg-emerald-50", border: "border-emerald-200", icon: "text-emerald-600" },
  red: { bg: "bg-red-50", border: "border-red-200", icon: "text-red-500" },
  amber: { bg: "bg-amber-50", border: "border-amber-200", icon: "text-amber-600" },
  sky: { bg: "bg-sky-50", border: "border-sky-200", icon: "text-sky-600" },
};

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, sub, trend, color = "violet" }) => {
  const c = COLORS[color];
  return (
    <div className="bg-white border border-zinc-200 rounded-[0.625rem] px-6 py-5 flex items-center justify-between card">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={`w-10 h-10 ${c.bg} border ${c.border} flex items-center justify-center rounded-[0.4rem] shrink-0`}>
          <span className={c.icon}>{icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{label}</p>
          <p className="text-lg font-bold text-[#1a0f2e] tabular-nums whitespace-nowrap">{value}</p>
          {sub && <p className="text-[11px] text-zinc-400 font-medium mt-0.5">{sub}</p>}
        </div>
      </div>
      {trend && trend.up !== null && (
        <div className={`flex items-center gap-1 text-xs font-bold shrink-0 ml-2 ${trend.up ? "text-emerald-600" : "text-red-500"}`}>
          {trend.up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {trend.label}
        </div>
      )}
      {trend && trend.up === null && (
        <span className="text-xs font-bold text-zinc-400 shrink-0 ml-2">—</span>
      )}
    </div>
  );
};

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

interface BtnProps {
  children: React.ReactNode; variant?: VariantKey; size?: SizeKey;
  onClick?: () => void; className?: string; disabled?: boolean;
}
const Btn: React.FC<BtnProps> = ({ children, variant = "primary", size = "sm", onClick, className = "", disabled = false }) => {
  const sizes: Record<SizeKey, string> = { sm: "px-3 py-2 text-xs", md: "px-4 py-2.5 text-sm" };
  const variants: Record<VariantKey, string> = {
    primary: "bg-[#a020f0] hover:bg-[#2a1647] text-white",
    secondary: "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50",
  };
  return (
    <button onClick={onClick} disabled={disabled}
      className={`inline-flex items-center gap-1.5 font-bold rounded-lg transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 ${sizes[size]} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

const SkeletonBar: React.FC<{ w?: string; h?: string }> = ({ w = "w-full", h = "h-4" }) => (
  <div className={`${w} ${h} bg-zinc-100 rounded animate-pulse`} />
);

// ─── MiniSparkline ────────────────────────────────────────────────────────────
const ALL_SPARK_LABELS = ['6d ago', '5d ago', '4d ago', '3d ago', '2d ago', 'Yesterday', 'Today'];
const getSparkLabels = (len: number) => ALL_SPARK_LABELS.slice(ALL_SPARK_LABELS.length - len);

const MiniSparkline = ({ values, color }: { values: number[]; color: string }) => {
  const max = Math.max(...values, 1);
  const labels = getSparkLabels(values.length);
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '28px', position: 'relative', marginTop: 8 }}>
      {values.map((v, i) => {
        const isActive = hovered === i;
        const barH = v === 0 ? 0 : Math.max((v / max) * 100, 8);
        const fmtV = v >= 1000 ? `₱${(v / 1000).toFixed(1)}k` : `₱${v.toFixed(0)}`;
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', position: 'relative', cursor: 'pointer' }}
            onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
            {isActive && (
              <div style={{ position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)', zIndex: 30, background: '#1a0f2e', color: '#fff', borderRadius: '0.4rem', padding: '4px 8px', whiteSpace: 'nowrap', pointerEvents: 'none', fontSize: '10px', fontWeight: 700 }}>
                {labels[i] ?? `Day ${i + 1}`}: {fmtV}
              </div>
            )}
            {v === 0
              ? <div style={{ width: '100%', height: '2px', background: color, borderRadius: '1px', opacity: 0.15 }} />
              : <div style={{ width: '100%', height: `${barH}%`, background: color, borderRadius: '2px', opacity: isActive ? 1 : 0.25 + (i / values.length) * 0.5, transition: 'opacity 0.1s' }} />
            }
          </div>
        );
      })}
    </div>
  );
};

// ─── Chart Tooltip ────────────────────────────────────────────────────────────
interface ChartTipProps {
  active?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: readonly any[];
  avgRevenue: number;
}
const ChartTip = ({ active, payload, avgRevenue }: ChartTipProps) => {
  if (!active || !payload?.length) return null;
  const val = Number(payload[0].value ?? 0);
  const diff = val - avgRevenue;
  const pct = avgRevenue ? ((diff / avgRevenue) * 100).toFixed(1) : '0';
  return (
    <div style={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '0.625rem', padding: '10px 14px', boxShadow: '0 4px 20px rgba(0,0,0,0.07)', fontSize: 12 }}>
      <p style={{ fontSize: 10, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{(payload[0].payload as { name: string }).name}</p>
      <p style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1a0f2e' }}>₱{val.toLocaleString()}</p>
      <p style={{ fontSize: 10, fontWeight: 700, marginTop: 4, color: diff >= 0 ? '#059669' : '#dc2626' }}>
        {diff >= 0 ? '▲' : '▼'} {Math.abs(Number(pct))}% vs avg
      </p>
    </div>
  );
};

// ─── BM_Dashboard ─────────────────────────────────────────────────────────────
const BM_Dashboard = ({ branchId }: BM_DashboardProps) => {
  const CACHE_KEY = cacheKey(branchId);

  const [analytics, setAnalytics] = useState<SalesAnalyticsResponse | null>(() => {
    try { const c = localStorage.getItem(CACHE_KEY); return c ? JSON.parse(c) : null; } catch { return null; }
  });
  const [loading, setLoading] = useState(!analytics);
  const [timeFilter, setTimeFilter] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<DashboardApiResponse>('/reports/dashboard-data');
      const apiData = res.data.data;

      const mappedData: SalesAnalyticsResponse = {
        daily: { data: apiData.daily_sales.data, stats: apiData.daily_sales.stats, top_sellers: apiData.daily_sales.top_sellers },
        weekly: { data: apiData.weekly_sales.data, stats: apiData.weekly_sales.stats, top_sellers: apiData.weekly_sales.top_sellers },
        monthly: { data: apiData.monthly_sales.data, stats: apiData.monthly_sales.stats, top_sellers: apiData.monthly_sales.top_sellers },
        top_seller_today: apiData.statistics.top_seller_today || [],
      };

      setAnalytics(mappedData);
      localStorage.setItem(CACHE_KEY, JSON.stringify(mappedData));
    } catch (e) {
      console.error('analytics fetch', e);
    } finally {
      setLoading(false);
    }
  }, [CACHE_KEY]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const onSaleRecorded = () => fetchData();
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'lucky_boba_live_sales_tick') fetchData();
    };

    window.addEventListener('luckyboba:sale-recorded', onSaleRecorded as EventListener);
    window.addEventListener('storage', onStorage);
    const id = setInterval(fetchData, 10000);

    return () => {
      window.removeEventListener('luckyboba:sale-recorded', onSaleRecorded as EventListener);
      window.removeEventListener('storage', onStorage);
      clearInterval(id);
    };
  }, [fetchData]);

  // ── Formatters ─────────────────────────────────────────────────────────────
  const fmt = (v?: number | string) => `₱${Number(v ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
  const fmtK = (v: number) => {
    if (v >= 1_000_000) return `₱${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `₱${(v / 1_000).toFixed(0)}k`;
    return `₱${v}`;
  };

  const computeTrend = (today: number, yesterday: number): { label: string; up: boolean | null } => {
    if (yesterday === 0 && today === 0) return { label: '—', up: null };
    if (yesterday === 0) return { label: 'New', up: true };
    const pct = ((today - yesterday) / yesterday) * 100;
    const sign = pct >= 0 ? '+' : '';
    return { label: `${sign}${pct.toFixed(1)}%`, up: pct >= 0 };
  };

  // ── Active period data (changes with filter) ───────────────────────────────
  const activePeriod = analytics?.[timeFilter];
  const sd = activePeriod?.stats;
  const sellersToday = activePeriod?.top_sellers || [];

  const overallCash = Number(sd?.cash_in ?? 0) + Number(sd?.total_sales ?? 0) - Number(sd?.cash_out ?? 0);

  const trendCashIn = computeTrend(Number(sd?.cash_in ?? 0), 0);
  const trendCashOut = computeTrend(Number(sd?.cash_out ?? 0), 0);
  const trendSales = computeTrend(Number(sd?.total_sales ?? 0), 0);
  const trendVoided = computeTrend(Number(sd?.voided_sales ?? 0), 0);
  const trendOverall = computeTrend(overallCash, 0);

  // ── Chart data ─────────────────────────────────────────────────────────────
  type ChartPoint = { date: string; day: string; value: number };

  const chartData = (() => {
    const raw: ChartPoint[] = activePeriod?.data || [];
    return raw.map((d: ChartPoint) => {
      // ── Fix: append T00:00:00 to force local time parsing, not UTC ──
      const o = new Date(d.date + 'T00:00:00');
      const label = isNaN(o.getTime())
        ? d.date
        : timeFilter === 'monthly'
          ? o.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : o.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      return { name: label, value: d.value };
    });
  })();

  const totalRevenue = chartData.reduce((a: number, b: { name: string; value: number }) => a + b.value, 0);
  const avgRevenue = chartData.length ? totalRevenue / chartData.length : 0;
  const maxDay = chartData.reduce(
    (a: { name: string; value: number }, b: { name: string; value: number }) => b.value > a.value ? b : a,
    chartData[0] || { name: '—', value: 0 }
  );
  const maxVal = Math.max(...chartData.map(d => d.value), 1);
  const stepSize = timeFilter === 'monthly' ? (maxVal > 50_000 ? 10_000 : 5_000)
    : timeFilter === 'weekly' ? (maxVal > 10_000 ? 5_000 : 2_000)
      : 2_000;
  const niceMax = Math.ceil(maxVal / stepSize) * stepSize;
  const yTicks = Array.from({ length: Math.min(Math.ceil(niceMax / stepSize) + 1, 7) }, (_: unknown, i: number) => i * stepSize);

  // ── Top sellers (all-time not in API yet, hide section if empty) ───────────
  const sellersAllTime: TopSellerItem[] = [];
  const allTimeMax = 1;

  const PURPLES = ['#a020f0', '#6d28d9', '#7c3aed', '#a78bfa', '#c4b5fd', '#ede9fe'];

  // ── Quick stats ────────────────────────────────────────────────────────────
  const avgOrderVal = fmt(
    Number(sd?.total_sales ?? 0) / Math.max(Number(sd?.total_orders ?? 1), 1)
  );
  const netCashFlow = fmt(Number(sd?.cash_in ?? 0) - Number(sd?.cash_out ?? 0));
  const voidRate = `${((Number(sd?.voided_sales ?? 0) / Math.max(Number(sd?.total_sales ?? 1), 1)) * 100).toFixed(1)}%`;
  const itemsSold = sellersToday.reduce((a: number, b: TopSellerItem) => a + Number(b.total_qty), 0);

  // ── Sparkline values (use period totals as single-point sparks) ────────────
  const sparkCashIn = [Number(sd?.cash_in ?? 0)];
  const sparkCashOut = [Number(sd?.cash_out ?? 0)];
  const sparkSales = [Number(sd?.total_sales ?? 0)];
  const sparkVoided = [Number(sd?.voided_sales ?? 0)];
  const sparkOverall = [overallCash];

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loading && !analytics) {
    return (
      <>
        <GlobalStyles />
        <div className="p-6 md:p-8 flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white border border-zinc-200 rounded-[0.625rem] px-6 py-5">
                <SkeletonBar h="h-10" />
                <div className="mt-3"><SkeletonBar h="h-6" w="w-2/3" /></div>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <GlobalStyles />
      <div className="p-6 md:p-8 flex flex-col gap-6 fade-in">

      <div className="flex flex-col md:flex-row md:items-center gap-6 mb-8">
        <div className="flex-1 flex flex-col md:flex-row items-center gap-3">
          <div className="flex rounded-xl overflow-hidden border border-zinc-200 shadow-sm shrink-0">
            {([
              { key: 'daily', label: 'Daily' },
              { key: 'weekly', label: 'Weekly' },
              { key: 'monthly', label: 'Monthly' },
            ] as const).map(({ key, label }) => (
              <button key={key} onClick={() => setTimeFilter(key)}
                className={`px-4 py-3 text-[10px] font-bold uppercase tracking-wider transition-colors ${timeFilter === key ? 'bg-[#a020f0] text-white' : 'bg-white text-zinc-500 hover:bg-zinc-50'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            icon={<TrendingUp size={18} strokeWidth={2} />}
            label="Cash In"
            value={loading ? '—' : fmt(sd?.cash_in)}
            sub="Opening float for period"
            trend={trendCashIn}
            color="emerald"
          />
          <StatCard
            icon={<TrendingDown size={18} strokeWidth={2} />}
            label="Cash Out"
            value={loading ? '—' : fmt(sd?.cash_out)}
            sub="Total disbursed for period"
            trend={trendCashOut}
            color="red"
          />
          <StatCard
            icon={<DollarSign size={18} strokeWidth={2} />}
            label="Total Sales"
            value={loading ? '—' : fmt(sd?.total_sales)}
            sub="Gross revenue for period"
            trend={trendSales}
            color="violet"
          />
          <StatCard
            icon={<AlertCircle size={18} strokeWidth={2} />}
            label="Voided Sales"
            value={loading ? '—' : fmt(sd?.voided_sales)}
            sub="Cancelled transactions"
            trend={trendVoided}
            color="amber"
          />
          <StatCard
            icon={<ShoppingBag size={18} strokeWidth={2} />}
            label="Total Orders"
            value={loading ? '—' : Number(sd?.total_orders ?? 0).toLocaleString()}
            sub={`Avg ${avgOrderVal} per order`}
            color="sky"
          />
          <StatCard
            icon={<Wallet size={18} strokeWidth={2} />}
            label="Overall Cash"
            value={loading ? '—' : fmt(overallCash)}
            sub="Cash In + Sales − Drop"
            trend={trendOverall}
            color="violet"
          />
        </div>

        {/* ── Quick Metrics Row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Net Cash Flow', value: netCashFlow, icon: <ArrowUpRight size={13} />, color: '#10b981' },
            { label: 'Void Rate', value: voidRate, icon: <AlertCircle size={13} />, color: '#f59e0b' },
            { label: 'Avg Order Value', value: avgOrderVal, icon: <Activity size={13} />, color: '#8b5cf6' },
            { label: 'Items Sold', value: itemsSold, icon: <ShoppingBag size={13} />, color: '#3b82f6' },
          ].map((o, i) => (
            <div key={i} className="bg-white border border-zinc-200 rounded-[0.625rem] px-4 py-3 flex items-center gap-3 card">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: o.color + '18', color: o.color }}>{o.icon}</div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 truncate">{o.label}</p>
                <p className="text-sm font-bold text-[#1a0f2e] tabular-nums truncate">{o.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Revenue Chart + Top Sellers Today ── */}
        <div className="grid grid-cols-12 gap-4">
          {/* Revenue Chart */}
          <div className="col-span-12 lg:col-span-8 bg-white border border-zinc-200 rounded-[0.625rem] p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Revenue Trend</p>
                <p className="text-xl font-bold text-[#1a0f2e] mt-0.5">Revenue Overview</p>
                <div className="flex items-center gap-4 mt-1.5">
                  {([
                    ['Total', `₱${totalRevenue.toLocaleString()}`],
                    ['Avg/Day', `₱${avgRevenue.toFixed(0)}`],
                    ['Peak', maxDay?.name],
                  ] as const).map(([lbl, val], j) => (
                    <div key={j}>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{lbl} </span>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: j === 2 ? '#7c3aed' : '#1a0f2e', letterSpacing: '-0.01em' }}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Btn variant="secondary"><Download size={13} /> Export</Btn>
            </div>

            {loading ? (
              <SkeletonBar h="h-[220px]" />
            ) : chartData.length === 0 ? (
              <div className="h-55 flex flex-col items-center justify-center gap-2 text-zinc-400">
                <Activity size={28} className="opacity-30" />
                <p className="text-xs font-medium">No data for this period</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="bmGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a020f0" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#a020f0" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0eef8" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} dy={8} minTickGap={20}
                    tick={{ fontSize: 11, fill: '#a1a1aa', fontWeight: 600 }} />
                  <YAxis axisLine={false} tickLine={false} ticks={yTicks} domain={[0, niceMax]}
                    tick={{ fontSize: 11, fill: '#a1a1aa', fontWeight: 600 }} tickFormatter={fmtK} />
                  <Tooltip content={(props) => <ChartTip {...props} avgRevenue={avgRevenue} />}
                    cursor={{ stroke: '#ddd6f7', strokeWidth: 1, strokeDasharray: '3 3' }} />
                  <Area type="monotone" dataKey="value" name="Revenue" stroke="#a020f0" strokeWidth={2.5}
                    fillOpacity={1} fill="url(#bmGrad)"
                    activeDot={{ r: 4, fill: '#a020f0', stroke: '#fff', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Top Sellers Today */}
          <div className="col-span-12 lg:col-span-4 bg-white border border-zinc-200 rounded-[0.625rem] p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Top Sellers</p>
                <p className="text-xl font-bold text-[#1a0f2e] mt-0.5">
                  {timeFilter === 'daily' ? 'Today' : timeFilter === 'weekly' ? 'This Week' : 'This Month'}
                </p>
              </div>
              <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1">
                <div className="bmd-live-dot" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">Live</span>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col gap-3">{[...Array(5)].map((_: unknown, i: number) => <SkeletonBar key={i} h="h-8" />)}</div>
            ) : sellersToday.length === 0 ? (
              <div className="flex-1 flex items-center justify-center py-10">
                <p className="text-xs font-medium text-zinc-400">No sales yet today</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {sellersToday.slice(0, 6).map((item: TopSellerItem, i: number) => {
                  const todayMax = Math.max(...sellersToday.map((x: TopSellerItem) => x.total_qty), 1);
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                            style={{ background: i === 0 ? '#a020f0' : '#f4f4f5', color: i === 0 ? '#fff' : '#71717a' }}>
                            <span style={{ fontSize: 9, fontWeight: 800 }}>{i + 1}</span>
                          </div>
                          <span className="text-xs font-semibold text-zinc-700 truncate max-w-32.5">{item.product_name}</span>
                        </div>
                        <span className="text-xs font-bold text-zinc-500 shrink-0 ml-2">{item.total_qty}</span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${(item.total_qty / todayMax) * 100}%`, background: PURPLES[i] || '#ede9fe' }} />
                      </div>
                    </div>
                  );
                })}
                <div className="pt-3 border-t border-zinc-100 mt-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                    Total sold: <span className="text-[#1a0f2e]">{sellersToday.slice(0, 6).reduce((a: number, b: TopSellerItem) => a + Number(b.total_qty), 0)} items</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── All-Time Best Sellers + Rank Breakdown ── */}
        {sellersAllTime.length > 0 && (
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 lg:col-span-7 bg-white border border-zinc-200 rounded-[0.625rem] p-6">
              <SectionHeader title="All-Time Best Sellers" desc="Cumulative sales volume by product" />
              <ResponsiveContainer width="100%" height={180}>
                <BarChart
                  data={sellersAllTime.slice(0, 6).map((x: TopSellerItem) => ({ name: x.product_name.split(' ')[0], qty: x.total_qty }))}
                  margin={{ top: 0, right: 0, left: -25, bottom: 0 }}
                  barSize={28}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0eef8" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#a1a1aa', fontWeight: 600 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#a1a1aa', fontWeight: 600 }} />
                  <Tooltip
                    formatter={(v) => [`${v} sold`, 'Qty'] as [string, string]}
                    contentStyle={{ borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 12 }}
                  />
                  <Bar dataKey="qty" radius={[4, 4, 0, 0]}>
                    {sellersAllTime.slice(0, 6).map((_: TopSellerItem, i: number) => (
                      <Cell key={i} fill={i === 0 ? '#a020f0' : `hsl(${265 - i * 15},${70 - i * 8}%,${60 + i * 5}%)`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="col-span-12 lg:col-span-5 bg-white border border-zinc-200 rounded-[0.625rem] p-6">
              <SectionHeader title="Rank Breakdown" desc="Share of total sales volume" />
              <div className="flex flex-col gap-3">
                {sellersAllTime.slice(0, 6).map((item: TopSellerItem, i: number) => {
                  const pct = Math.round((item.total_qty / allTimeMax) * 100);
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                        style={{ background: i === 0 ? '#a020f0' : i === 1 ? '#ede8ff' : '#f4f4f5', color: i === 0 ? '#fff' : i === 1 ? '#a020f0' : '#71717a' }}>
                        <span style={{ fontSize: 9, fontWeight: 800 }}>{i + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-zinc-700 truncate">{item.product_name}</span>
                          <span className="text-[10px] font-bold text-zinc-500 ml-2 shrink-0">{item.total_qty.toLocaleString()}</span>
                        </div>
                        <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: i === 0 ? '#a020f0' : '#d4d4d8' }} />
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-zinc-400 shrink-0 w-8 text-right">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Sparkline Trends ── */}
        <div className="bg-white border border-zinc-200 rounded-[0.625rem] p-6">
          <SectionHeader title="Period Trends" desc="Metric breakdown for selected period" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
            {[
              { label: 'Cash In', spark: sparkCashIn, color: '#16a34a' },
              { label: 'Cash Out', spark: sparkCashOut, color: '#dc2626' },
              { label: 'Total Sales', spark: sparkSales, color: '#7c3aed' },
              { label: 'Voided', spark: sparkVoided, color: '#ca8a04' },
              { label: 'Overall', spark: sparkOverall, color: '#0284c7' },
            ].map((s, i) => (
              <div key={i}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{s.label}</p>
                <MiniSparkline values={s.spark} color={s.color} />
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  );
};

export default BM_Dashboard;
