import { useState, useEffect, useCallback } from 'react';
import {
  ArrowUpRight, ArrowDownRight, RefreshCw,
  TrendingUp, Store, DollarSign, MapPin,
  BarChart2, Search, Activity,
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from 'recharts';

// ── Types — matches your actual branches table ────────────────────────────────
interface Branch {
  id:                     number;
  name:                   string;
  location:               string;
  status:                 'active' | 'inactive';
  total_sales:            number;   // all-time cumulative (branches.total_sales)
  today_sales:            number;   // today's running total (branches.today_sales)
  // Computed via LEFT JOIN on sales
  days_active?:           number;
  total_transactions?:    number;
  avg_transaction_value?: number;
  avg_daily_sales?:       number;
}

interface BranchesApiResponse {
  success: boolean;
  data:    Branch[];
}

// ── API helpers — same pattern as OverviewTab ─────────────────────────────────
const getToken    = () => localStorage.getItem('auth_token') || localStorage.getItem('lucky_boba_token') || '';
const authHeaders = (): HeadersInit => ({
  'Content-Type': 'application/json',
  'Accept':       'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

// ── Formatters ────────────────────────────────────────────────────────────────
const fmt  = (v?: number) => `₱${Number(v ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
const fmtK = (v?: number) => {
  const n = Number(v ?? 0);
  if (n >= 1_000_000) return `₱${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `₱${(n / 1_000).toFixed(1)}K`;
  return `₱${n.toFixed(0)}`;
};

// ── Design tokens — identical to OverviewTab ──────────────────────────────────
type ColorKey   = 'violet' | 'emerald' | 'red' | 'amber';
type VariantKey = 'primary' | 'secondary';

// ── Shared UI — exact copies from OverviewTab ─────────────────────────────────
interface StatCardProps {
  icon: React.ReactNode; label: string; value: string | number;
  sub?: string; trend?: number; color?: ColorKey;
}
const StatCard: React.FC<StatCardProps> = ({ icon, label, value, sub, trend, color = 'violet' }) => {
  const colors: Record<ColorKey, { bg: string; border: string; icon: string }> = {
    violet:  { bg: 'bg-violet-50',  border: 'border-violet-200',  icon: 'text-violet-600'  },
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'text-emerald-600' },
    red:     { bg: 'bg-red-50',     border: 'border-red-200',     icon: 'text-red-500'     },
    amber:   { bg: 'bg-amber-50',   border: 'border-amber-200',   icon: 'text-amber-600'   },
  };
  const c = colors[color];
  return (
    <div className="bg-white border border-zinc-200 rounded-[0.625rem] px-6 py-5 flex items-center justify-between card">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 ${c.bg} border ${c.border} flex items-center justify-center rounded-[0.4rem]`}>
          <span className={c.icon}>{icon}</span>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{label}</p>
          <p className="text-xl font-bold text-[#1a0f2e] tabular-nums">{value}</p>
          {sub && <p className="text-[10px] text-zinc-400 mt-0.5">{sub}</p>}
        </div>
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 text-xs font-bold ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
          {trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {Math.abs(trend)}%
        </div>
      )}
    </div>
  );
};

const SectionHeader: React.FC<{ title: string; desc?: string; action?: React.ReactNode }> = ({ title, desc, action }) => (
  <div className="flex items-center justify-between mb-5">
    <div>
      <h2 className="text-base font-bold text-[#1a0f2e]">{title}</h2>
      {desc && <p className="text-xs text-zinc-400 mt-0.5">{desc}</p>}
    </div>
    {action}
  </div>
);

const Btn: React.FC<{
  children: React.ReactNode; variant?: VariantKey;
  onClick?: () => void; disabled?: boolean; className?: string;
}> = ({ children, variant = 'primary', onClick, disabled, className = '' }) => {
  const variants: Record<VariantKey, string> = {
    primary:   'bg-[#3b2063] hover:bg-[#2a1647] text-white',
    secondary: 'bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50',
  };
  return (
    <button onClick={onClick} disabled={disabled}
      className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

const SkeletonBar: React.FC<{ w?: string; h?: string }> = ({ w = 'w-full', h = 'h-4' }) => (
  <div className={`${w} ${h} bg-zinc-100 rounded animate-pulse`} />
);

// ── Branch Card ───────────────────────────────────────────────────────────────
const BranchCard: React.FC<{ branch: Branch; rank: number; maxToday: number }> = ({
  branch, rank, maxToday,
}) => {
  const isActive   = branch.status === 'active';
  const avgDaily   = branch.avg_daily_sales    ?? 0;
  const avgTx      = branch.avg_transaction_value ?? 0;
  const totalTx    = branch.total_transactions ?? 0;
  const daysActive = branch.days_active        ?? 0;

  // Today vs avg daily — how is today performing vs the norm?
  const vsAvg = avgDaily > 0
    ? ((branch.today_sales - avgDaily) / avgDaily) * 100
    : null;

  // Bar widths — relative to maxToday across all branches
  const todayWidth = maxToday > 0 ? (branch.today_sales / maxToday) * 100 : 0;
  const avgWidth   = maxToday > 0 ? (avgDaily / maxToday) * 100 : 0;

  return (
    <div className="bg-white border border-zinc-200 rounded-[0.625rem] p-6 flex flex-col gap-4 card hover:border-violet-200 transition-colors fade-in">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-8 h-8 rounded-[0.4rem] flex items-center justify-center shrink-0 text-sm font-black
            ${rank === 1 ? 'bg-[#3b2063] text-white'
            : rank === 2 ? 'bg-violet-100 text-violet-700'
            : rank === 3 ? 'bg-violet-50 text-violet-500'
            :               'bg-zinc-100 text-zinc-500'}`}>
            {rank}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#1a0f2e] truncate leading-tight">{branch.name}</p>
            <p className="text-[10px] text-zinc-400 flex items-center gap-1 mt-0.5">
              <MapPin size={9} />{branch.location || '—'}
            </p>
          </div>
        </div>
        <span className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border shrink-0
          ${isActive ? 'badge-active' : 'badge-inactive'}`}>
          {branch.status}
        </span>
      </div>

      {/* ── Revenue figures ── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-violet-50 border border-violet-100 rounded-lg px-4 py-3">
          <p className="text-[9px] font-bold uppercase tracking-widest text-violet-400 mb-0.5">Today's Sales</p>
          <p className="text-lg font-black text-[#3b2063] tabular-nums leading-none">{fmtK(branch.today_sales)}</p>
          <p className="text-[9px] text-violet-400 mt-0.5">{fmt(branch.today_sales)}</p>
        </div>
        <div className="bg-zinc-50 border border-zinc-100 rounded-lg px-4 py-3">
          <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">All-Time Sales</p>
          <p className="text-lg font-bold text-[#1a0f2e] tabular-nums leading-none">{fmtK(branch.total_sales)}</p>
          <p className="text-[9px] text-zinc-400 mt-0.5">{fmt(branch.total_sales)}</p>
        </div>
      </div>

      {/* ── Today vs avg daily pill ── */}
      {vsAvg !== null && (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
          vsAvg >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'
        }`}>
          {vsAvg >= 0 ? <TrendingUp size={11} className="text-emerald-600 shrink-0" /> : <ArrowDownRight size={11} className="text-red-500 shrink-0" />}
          <span className="text-[10px] text-zinc-500 font-medium">vs daily avg</span>
          <span className="text-[10px] font-bold text-zinc-400 tabular-nums ml-auto">{fmtK(avgDaily)}</span>
          <span className={`text-[10px] font-bold flex items-center gap-0.5 ${vsAvg >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {vsAvg >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
            {vsAvg >= 0 ? '+' : ''}{vsAvg.toFixed(1)}%
          </span>
        </div>
      )}

      {/* ── 4 metrics grid ── */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Avg Daily Sales',  value: fmtK(avgDaily), color: 'text-emerald-600'  },
          { label: 'Avg Tx Value',     value: fmtK(avgTx),    color: 'text-violet-600'   },
          { label: 'Total Tx',         value: totalTx.toLocaleString(), color: 'text-[#1a0f2e]' },
          { label: 'Days Active',      value: daysActive.toLocaleString(), color: 'text-[#1a0f2e]' },
        ].map((m, i) => (
          <div key={i} className="bg-zinc-50 border border-zinc-100 rounded-lg px-3 py-2.5">
            <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">{m.label}</p>
            <p className={`text-sm font-bold tabular-nums ${m.color}`}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* ── Today vs avg daily bar ── */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">Today vs avg daily</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[9px] text-zinc-400 w-10 shrink-0">Today</span>
          <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
            <div className="h-full bg-[#3b2063] rounded-full transition-all duration-500"
              style={{ width: `${Math.min(todayWidth, 100)}%` }} />
          </div>
          <span className="text-[9px] font-bold text-[#1a0f2e] w-14 text-right tabular-nums shrink-0">{fmtK(branch.today_sales)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-zinc-400 w-10 shrink-0">Avg</span>
          <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
            <div className="h-full bg-zinc-300 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(avgWidth, 100)}%` }} />
          </div>
          <span className="text-[9px] font-bold text-zinc-400 w-14 text-right tabular-nums shrink-0">{fmtK(avgDaily)}</span>
        </div>
      </div>
    </div>
  );
};

// ── Main Tab ──────────────────────────────────────────────────────────────────
const BranchesReport: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [sortBy,   setSortBy]   = useState<'today_sales' | 'total_sales' | 'avg_daily_sales'>('today_sales');
  const [search,   setSearch]   = useState('');
  const [status,   setStatus]   = useState<'all' | 'active' | 'inactive'>('all');

  const fetchBranches = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/branches', { headers: authHeaders() });
      const data = await res.json() as BranchesApiResponse;
      if (data.success && data.data) setBranches(data.data);
    } catch (e) {
      console.error('BranchesReport fetch error', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBranches(); }, [fetchBranches]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const filtered = branches
    .filter(b => status === 'all' ? true : b.status === status)
    .filter(b => {
      const q = search.toLowerCase();
      return q === '' ? true :
        b.name.toLowerCase().includes(q) ||
        (b.location ?? '').toLowerCase().includes(q);
    });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'today_sales')     return (b.today_sales    ?? 0) - (a.today_sales    ?? 0);
    if (sortBy === 'total_sales')     return (b.total_sales    ?? 0) - (a.total_sales    ?? 0);
    return (b.avg_daily_sales ?? 0) - (a.avg_daily_sales ?? 0);
  });

  const maxToday    = Math.max(...sorted.map(b => b.today_sales ?? 0), 1);
  const totalToday  = filtered.reduce((s, b) => s + (b.today_sales  ?? 0), 0);
  const totalAll    = filtered.reduce((s, b) => s + (b.total_sales  ?? 0), 0);
  const totalTx     = filtered.reduce((s, b) => s + (b.total_transactions ?? 0), 0);
  const activeCount = filtered.filter(b => b.status === 'active').length;

  // ── Chart data ────────────────────────────────────────────────────────────
  const barData = sorted.slice(0, 8).map(b => ({
    name:    b.name.replace('Lucky Boba – ', '').replace('Lucky Boba - ', ''),
    today:   b.today_sales    ?? 0,
    avg:     b.avg_daily_sales ?? 0,
    total:   b.total_sales    ?? 0,
  }));

  const PURPLES = ['#3b2063', '#6d3fa8', '#9b6bd4', '#c4a8e8', '#ddd0f8'];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 md:p-8 flex flex-col gap-6 fade-in">

      {/* ── Header — same as OverviewTab ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-[#1a0f2e]">Branch Performance</h2>
          <p className="text-xs text-zinc-400 mt-0.5">Today's sales, all-time totals and metrics across all branches</p>
        </div>
        <div className="flex items-center gap-2">
          {(['all', 'active', 'inactive'] as const).map(s => (
            <button key={s} onClick={() => setStatus(s)} disabled={loading}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all capitalize disabled:opacity-50 cursor-pointer ${
                status === s ? 'bg-[#3b2063] text-white' : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50'
              }`}>
              {s === 'all' ? 'All' : s}
            </button>
          ))}
          <Btn variant="secondary" onClick={fetchBranches} disabled={loading}>
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </Btn>
        </div>
      </div>

      {/* ── Stat Cards — exact StatCard from OverviewTab ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={<DollarSign size={18} strokeWidth={2} />}
          label="Today's Revenue"
          value={loading ? '—' : fmtK(totalToday)}
          sub={loading ? '' : fmt(totalToday)}
          color="violet"
        />
        <StatCard
          icon={<TrendingUp size={18} strokeWidth={2} />}
          label="All-Time Revenue"
          value={loading ? '—' : fmtK(totalAll)}
          sub={loading ? '' : fmt(totalAll)}
          color="emerald"
        />
        <StatCard
          icon={<Store size={18} strokeWidth={2} />}
          label="Active Branches"
          value={loading ? '—' : `${activeCount} / ${filtered.length}`}
          color="amber"
        />
        <StatCard
          icon={<BarChart2 size={18} strokeWidth={2} />}
          label="Total Transactions"
          value={loading ? '—' : totalTx.toLocaleString()}
          color="red"
        />
      </div>

      {/* ── Charts row — same 12-col grid as OverviewTab ── */}
      <div className="grid grid-cols-12 gap-4">

        {/* Bar chart — today vs avg daily */}
        <div className="col-span-12 lg:col-span-8 bg-white border border-zinc-200 rounded-[0.625rem] p-6">
          <SectionHeader
            title="Sales Comparison"
            desc="Today's sales vs daily average — top 8 branches"
            action={
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm bg-[#3b2063]" />
                  <span className="text-[10px] font-bold text-zinc-500">Today</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm bg-zinc-200" />
                  <span className="text-[10px] font-bold text-zinc-500">Avg Daily</span>
                </div>
              </div>
            }
          />
          {loading ? <SkeletonBar h="h-[200px]" /> : barData.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-zinc-400 text-xs">No data.</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} barSize={14} barGap={2} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0eef8" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 600, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fontWeight: 600, fill: '#a1a1aa' }} axisLine={false} tickLine={false}
                  tickFormatter={v => v >= 1000 ? `₱${(v / 1000).toFixed(0)}k` : `₱${v}`} />
                <Tooltip
                  formatter={(v, n) => [fmt(Number(v)), n === 'today' ? 'Today' : 'Avg Daily'] as [string, string]}
                  contentStyle={{ borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 12 }}
                />
                <Bar dataKey="today" radius={[3, 3, 0, 0]}>
                  {barData.map((_, i) => <Cell key={i} fill="#3b2063" />)}
                </Bar>
                <Bar dataKey="avg" radius={[3, 3, 0, 0]}>
                  {barData.map((_, i) => <Cell key={i} fill="#e4e4e7" />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top 5 — same as OverviewTab Top Products ── */}
        <div className="col-span-12 lg:col-span-4 bg-white border border-zinc-200 rounded-[0.625rem] p-6">
          <SectionHeader title="Top Branches" desc="By today's sales" />
          {loading ? (
            <div className="flex flex-col gap-3">
              {[...Array(5)].map((_, i) => <SkeletonBar key={i} h="h-8" />)}
            </div>
          ) : sorted.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-zinc-400 text-xs">No data.</div>
          ) : (
            <div className="flex flex-col gap-2">
              {sorted.slice(0, 5).map((b, i) => {
                const pct = sorted[0].today_sales > 0
                  ? Math.round((b.today_sales / sorted[0].today_sales) * 100)
                  : 0;
                return (
                  <div key={b.id} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-md bg-violet-50 border border-violet-200 flex items-center justify-center shrink-0">
                      <span className="text-[9px] font-black text-violet-600">{i + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-semibold text-zinc-700 truncate">{b.name}</span>
                        <span className="text-[10px] font-bold text-zinc-500 ml-2 shrink-0">{fmtK(b.today_sales)}</span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: PURPLES[i] ?? '#ede9fe' }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Search + Sort ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search branch or location…"
            className="pl-8 pr-3 py-2 text-xs font-medium border border-zinc-200 rounded-lg bg-white text-zinc-700 placeholder:text-zinc-400 focus:outline-none focus:border-violet-300 focus:ring-1 focus:ring-violet-100 w-64"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Sort by</span>
          {([
            { key: 'today_sales',     label: 'Today'     },
            { key: 'total_sales',     label: 'All-Time'  },
            { key: 'avg_daily_sales', label: 'Avg Daily' },
          ] as const).map(s => (
            <button key={s.key} onClick={() => setSortBy(s.key)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                sortBy === s.key ? 'bg-[#3b2063] text-white' : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50'
              }`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Branch cards grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <SkeletonBar key={i} h="h-80" />)}
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-400">
          <Store size={32} strokeWidth={1.5} />
          <p className="text-sm font-medium">No branches found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {sorted.map((b, i) => (
            <BranchCard key={b.id} branch={b} rank={i + 1} maxToday={maxToday} />
          ))}
        </div>
      )}

      {/* ── Full table — same style as OverviewTab Branch Performance ── */}
      {!loading && sorted.length > 0 && (
        <div className="bg-white border border-zinc-200 rounded-[0.625rem] overflow-hidden">
          <div className="px-6 py-5 border-b border-zinc-100">
            <SectionHeader
              title="All Branches"
              desc="Complete performance breakdown"
              action={
                <div className="flex items-center gap-2">
                  <Activity size={14} className="text-zinc-400" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{sorted.length} branches</span>
                </div>
              }
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50">
                  {['#', 'Branch', 'Location', 'Status', "Today's Sales", 'All-Time Sales', 'Avg Daily', 'Avg Tx Value', 'Total Tx', 'Days Active'].map(h => (
                    <th key={h} className={`px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400 whitespace-nowrap
                      ${['#', 'Branch', 'Location', 'Status'].includes(h) ? 'text-left' : 'text-right'}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((b, i) => (
                  <tr key={b.id} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className={`w-6 h-6 rounded-[0.4rem] flex items-center justify-center text-[10px] font-black
                        ${i === 0 ? 'bg-[#3b2063] text-white' : i === 1 ? 'bg-violet-100 text-violet-700' : 'bg-zinc-100 text-zinc-500'}`}>
                        {i + 1}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-xs font-bold text-[#1a0f2e] whitespace-nowrap">{b.name}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-xs text-zinc-500 flex items-center gap-1 whitespace-nowrap">
                        <MapPin size={10} className="shrink-0" />{b.location || '—'}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border
                        ${b.status === 'active' ? 'badge-active' : 'badge-inactive'}`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <p className="text-xs font-bold text-[#3b2063] tabular-nums">{fmt(b.today_sales)}</p>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <p className="text-xs font-bold text-[#1a0f2e] tabular-nums">{fmt(b.total_sales)}</p>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <p className="text-xs font-medium text-emerald-600 tabular-nums">{fmt(b.avg_daily_sales)}</p>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <p className="text-xs font-medium text-zinc-600 tabular-nums">{fmt(b.avg_transaction_value)}</p>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <p className="text-xs font-medium text-zinc-600 tabular-nums">{(b.total_transactions ?? 0).toLocaleString()}</p>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <p className="text-xs font-medium text-zinc-600 tabular-nums">{(b.days_active ?? 0).toLocaleString()}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-zinc-50 border-t-2 border-zinc-200">
                  <td colSpan={4} className="px-5 py-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                      Total — {sorted.length} {sorted.length === 1 ? 'branch' : 'branches'}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <p className="text-sm font-black text-[#3b2063] tabular-nums">{fmt(totalToday)}</p>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <p className="text-sm font-black text-[#1a0f2e] tabular-nums">{fmt(totalAll)}</p>
                  </td>
                  <td className="px-5 py-4" />
                  <td className="px-5 py-4" />
                  <td className="px-5 py-4 text-right">
                    <p className="text-xs font-black text-zinc-600 tabular-nums">{totalTx.toLocaleString()}</p>
                  </td>
                  <td className="px-5 py-4" />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchesReport;