import { useState, useEffect, useReducer } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  SalesReportIcon, InventoryIcon, UserActivityIcon,
  BranchComparisonIcon, FinancialIcon, AuditLogIcon,
} from '../icons';
import {
  reportService,
  type Period,
  type SalesSummaryResponse,
  type BranchComparisonResponse,
} from '../../../services/reportService';
import {
  X, RefreshCw, TrendingUp, ShoppingBag, Users,
  ArrowUpRight, Clock, Trophy, CreditCard
} from 'lucide-react';

// ── Formatters ────────────────────────────────────────────────────
const fmt  = (v: string | number) =>
  `₱${Number(v ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtC = (v: string | number) =>
  Number(v) >= 1_000_000 ? `₱${(Number(v) / 1_000_000).toFixed(2)}M`
  : Number(v) >= 1_000   ? `₱${(Number(v) / 1_000).toFixed(1)}K`
  : fmt(v);

const BR_COLORS = ['#7c3aed', '#06b6d4', '#f59e0b', '#10b981', '#ef4444'];
const PAY_COLORS: Record<string, string> = {
  GCash: '#06b6d4', Cash: '#f59e0b', Card: '#7c3aed', Maya: '#10b981',
};

// ── Report cards config ───────────────────────────────────────────
const REPORT_CARDS = [
  { key: 'sales',     title: 'Sales Summary',     desc: 'Complete sales report across all branches', Icon: SalesReportIcon,     live: true,  badge: 'Live'     },
  { key: 'inventory', title: 'Inventory Report',  desc: 'Stock levels and inventory movement',       Icon: InventoryIcon,       live: false, badge: 'Soon'     },
  { key: 'users',     title: 'User Activity',     desc: 'Login history and user actions',            Icon: UserActivityIcon,    live: false, badge: 'Soon'     },
  { key: 'branch',    title: 'Branch Comparison', desc: 'Performance comparison between branches',   Icon: BranchComparisonIcon,live: true,  badge: 'Live'     },
  { key: 'financial', title: 'Financial Report',  desc: 'Revenue, expenses, and profit margins',     Icon: FinancialIcon,       live: false, badge: 'Soon'     },
  { key: 'audit',     title: 'Audit Log',         desc: 'System changes and administrative actions', Icon: AuditLogIcon,        live: false, badge: 'Soon'     },
];

// ── Shared components ─────────────────────────────────────────────

const PeriodFilter = ({ value, onChange }: { value: Period; onChange: (p: Period) => void }) => (
  <div className="flex bg-gray-50 border border-gray-100 rounded-lg p-1">
    {(['daily', 'weekly', 'monthly'] as Period[]).map(p => (
      <button key={p} onClick={() => onChange(p)}
        className={`px-4 py-1.5 rounded-md text-xs font-bold capitalize transition-all ${
          value === p ? 'bg-white text-gray-900 shadow-sm border border-gray-200' : 'text-gray-400 hover:text-gray-600'
        }`}>
        {p}
      </button>
    ))}
  </div>
);

const StatCard = ({ label, value, sub, color = '#7c3aed', icon }: {
  label: string; value: string; sub?: string; color?: string; icon?: React.ReactNode;
}) => (
  <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex flex-col gap-2">
    <div className="flex items-center justify-between">
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
      {icon && <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: color + '18', color }}>{icon}</div>}
    </div>
    <p className="text-xl font-black leading-none" style={{ color }}>{value}</p>
    {sub && <p className="text-[10px] text-gray-400">{sub}</p>}
  </div>
);

interface ChartPayloadItem { name?: string; value?: number; color?: string; }
const ChartTip = ({ active, payload, label }: { active?: boolean; payload?: ChartPayloadItem[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 px-3 py-2.5 rounded-xl shadow-lg">
      <p className="text-[10px] font-semibold text-gray-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-bold" style={{ color: p.color || '#7c3aed' }}>
          {p.name}: {p.name?.toLowerCase().includes('rev') || p.name?.toLowerCase().includes('avg') ? fmtC(p.value ?? 0) : Number(p.value ?? 0).toLocaleString()}
        </p>
      ))}
    </div>
  );
};

const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center py-16 gap-3">
    <div className="w-8 h-8 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
    <p className="text-xs text-gray-400 font-medium">Loading report…</p>
  </div>
);

const ErrorBanner = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
    <div>
      <p className="text-sm font-bold text-red-600">Failed to load report</p>
      <p className="text-xs text-gray-400 mt-0.5">{message}</p>
    </div>
    <button onClick={onRetry} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-all">
      <RefreshCw size={11} /> Retry
    </button>
  </div>
);

// ── Modal Shell ───────────────────────────────────────────────────
const ModalShell = ({ title, subtitle, onClose, children }: {
  title: string; subtitle: string; onClose: () => void; children: React.ReactNode;
}) => (
  <div
    className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm p-4 md:p-8 overflow-y-auto"
    onClick={e => { if (e.target === e.currentTarget) onClose(); }}
  >
    <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex-shrink-0 my-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
        <div>
          <h2 className="text-base font-black text-gray-900">{title}</h2>
          <p className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wider">{subtitle}</p>
        </div>
        <button onClick={onClose}
          className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all">
          <X size={16} />
        </button>
      </div>
      {/* Body */}
      <div className="p-6 flex flex-col gap-5">{children}</div>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════
//  MODAL: Sales Summary
// ═══════════════════════════════════════════════════════════════
interface SalesState { data: SalesSummaryResponse | null; loading: boolean; error: string | null; }
type SalesAction = { type: 'FETCH_START' } | { type: 'FETCH_SUCCESS'; payload: SalesSummaryResponse } | { type: 'FETCH_ERROR'; payload: string };
function salesReducer(s: SalesState, a: SalesAction): SalesState {
  switch (a.type) {
    case 'FETCH_START':   return { data: null,      loading: true,  error: null };
    case 'FETCH_SUCCESS': return { data: a.payload, loading: false, error: null };
    case 'FETCH_ERROR':   return { data: null,      loading: false, error: a.payload };
    default: return s;
  }
}

function SalesSummaryModal({ onClose }: { onClose: () => void }) {
  const [period, setPeriod] = useState<Period>('monthly');
  const [state, dispatch]   = useReducer(salesReducer, { data: null, loading: true, error: null });
  const { data, loading, error } = state;

  useEffect(() => {
    let cancelled = false;
    dispatch({ type: 'FETCH_START' });
    reportService.getSalesSummary({ period })
      .then(d  => { if (!cancelled) dispatch({ type: 'FETCH_SUCCESS', payload: d }); })
      .catch(e => { if (!cancelled) dispatch({ type: 'FETCH_ERROR',   payload: e.message ?? 'Unknown error' }); });
    return () => { cancelled = true; };
  }, [period]);

  const maxBr = data ? Math.max(...data.revenue_per_branch.map(b => Number(b.total_revenue))) : 1;

  return (
    <ModalShell title="Sales Summary" subtitle="Complete sales report across all branches" onClose={onClose}>
      <PeriodFilter value={period} onChange={setPeriod} />

      {loading && <LoadingSpinner />}
      {error   && <ErrorBanner message={error} onRetry={() => setPeriod(period)} />}

      {data && !loading && (
        <>
          {/* KPI strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Gross Revenue"   value={fmtC(data.totals.grand_total)}                        sub={`${Number(data.totals.total_orders).toLocaleString()} orders`}  color="#7c3aed" icon={<TrendingUp size={12}/>} />
            <StatCard label="Total Orders"    value={Number(data.totals.total_orders).toLocaleString()}    sub="completed"        color="#2563eb" icon={<ShoppingBag size={12}/>} />
            <StatCard label="Avg Order Value" value={fmt(data.totals.avg_order_value)}                     sub="per transaction"  color="#d97706" icon={<ArrowUpRight size={12}/>} />
            <StatCard label="Total Guests"    value={Number(data.totals.total_customers).toLocaleString()} sub="pax served"       color="#059669" icon={<Users size={12}/>} />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Area chart — 2/3 */}
            <div className="md:col-span-2 bg-gray-50 border border-gray-100 rounded-xl p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-3">Daily Revenue Trend</p>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={data.breakdown} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#a1a1aa' }} tickFormatter={d => d.slice(5)} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#a1a1aa' }} tickFormatter={fmtC} axisLine={false} tickLine={false} width={50} />
                  <Tooltip content={<ChartTip />} cursor={{ stroke: '#d4d4d8', strokeWidth: 1, strokeDasharray: '3 3' }} />
                  <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#7c3aed" strokeWidth={2} fill="url(#salesGrad)" activeDot={{ r: 4, fill: '#7c3aed', stroke: '#fff', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Revenue by branch — 1/3 */}
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-3">By Branch</p>
              <div className="flex flex-col gap-3 max-h-[200px] overflow-y-auto pr-1">
                {data.revenue_per_branch.map((b, i) => (
                  <div key={b.branch_id}>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-bold text-gray-700 truncate">{b.branch_name}</span>
                      <span className="text-xs font-black ml-2 flex-shrink-0" style={{ color: BR_COLORS[i] ?? '#7c3aed' }}>{fmtC(b.total_revenue)}</span>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(Number(b.total_revenue) / maxBr) * 100}%`, background: BR_COLORS[i] ?? '#7c3aed' }} />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5">{b.order_count} orders · avg {fmt(b.average_order_value)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Trophy size={12} className="text-amber-500" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Top Products</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {data.top_products.slice(0, 5).map((p, i) => (
                <div key={i} className={`bg-white border rounded-xl p-3 ${i === 0 ? 'border-violet-200' : 'border-gray-100'}`}>
                  <p className="text-base mb-1">{['🥇','🥈','🥉','4️⃣','5️⃣'][i]}</p>
                  <p className="text-xs font-bold text-gray-800 leading-tight mb-2">{p.product_name}</p>
                  <p className="text-lg font-black leading-none" style={{ color: BR_COLORS[i] ?? '#7c3aed' }}>{p.total_quantity.toLocaleString()}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">units · {fmtC(p.total_revenue)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Daily breakdown table */}
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-3">Daily Breakdown</p>
            <div className="max-h-52 overflow-y-auto">
              {/* Table header */}
              <div className="grid grid-cols-4 px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider sticky top-0 bg-gray-50">
                {['Date','Revenue','Orders','Avg Order'].map(h => <div key={h}>{h}</div>)}
              </div>
              {data.breakdown.map((row, i) => (
                <div key={i} className={`grid grid-cols-4 px-3 py-2.5 text-xs rounded-lg transition-colors hover:bg-white ${i % 2 === 0 ? '' : ''}`}>
                  <span className="text-gray-500 font-mono">{row.date}</span>
                  <span className="font-black text-violet-700">{fmtC(row.revenue)}</span>
                  <span className="text-gray-700">{Number(row.orders).toLocaleString()}</span>
                  <span className="text-gray-700 font-mono">{fmt(row.avg_order_value)}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </ModalShell>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MODAL: Branch Comparison
// ═══════════════════════════════════════════════════════════════
interface BranchState { data: BranchComparisonResponse | null; loading: boolean; error: string | null; }
type BranchAction = { type: 'FETCH_START' } | { type: 'FETCH_SUCCESS'; payload: BranchComparisonResponse } | { type: 'FETCH_ERROR'; payload: string };
function branchReducer(s: BranchState, a: BranchAction): BranchState {
  switch (a.type) {
    case 'FETCH_START':   return { data: null,      loading: true,  error: null };
    case 'FETCH_SUCCESS': return { data: a.payload, loading: false, error: null };
    case 'FETCH_ERROR':   return { data: null,      loading: false, error: a.payload };
    default: return s;
  }
}

function BranchComparisonModal({ onClose }: { onClose: () => void }) {
  const [period, setPeriod] = useState<Period>('monthly');
  const [state, dispatch]   = useReducer(branchReducer, { data: null, loading: true, error: null });
  const { data, loading, error } = state;

  useEffect(() => {
    let cancelled = false;
    dispatch({ type: 'FETCH_START' });
    reportService.getBranchComparison({ period })
      .then(d  => { if (!cancelled) dispatch({ type: 'FETCH_SUCCESS', payload: d }); })
      .catch(e => { if (!cancelled) dispatch({ type: 'FETCH_ERROR',   payload: e.message ?? 'Unknown error' }); });
    return () => { cancelled = true; };
  }, [period]);

  const maxRev = data ? Math.max(...data.comparison.map(b => Number(b.total_revenue))) : 1;

  return (
    <ModalShell title="Branch Comparison" subtitle="Performance comparison between branches" onClose={onClose}>
      <PeriodFilter value={period} onChange={setPeriod} />

      {loading && <LoadingSpinner />}
      {error   && <ErrorBanner message={error} onRetry={() => setPeriod(period)} />}

      {data && !loading && (
        <>
          {/* Bar chart */}
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-3">Revenue Overview</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data.comparison} barCategoryGap="40%" margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                <XAxis dataKey="branch_name" tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#a1a1aa' }} tickFormatter={fmtC} axisLine={false} tickLine={false} width={50} />
                <Tooltip content={<ChartTip />} cursor={{ fill: '#f5f4f8' }} />
                <Bar dataKey="total_revenue" name="Revenue" radius={[6, 6, 0, 0]}>
                  {data.comparison.map((_, i) => <Cell key={i} fill={BR_COLORS[i] ?? '#7c3aed'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Branch cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.comparison.map((branch, i) => {
              const totalPay  = branch.payment_methods.reduce((a, m) => a + m.count, 0);
              const rankEmoji = ['🥇','🥈','🥉'][i] ?? `#${i + 1}`;
              const ac        = BR_COLORS[i] ?? '#7c3aed';

              return (
                <div key={branch.branch_id}
                  className={`bg-white border rounded-2xl p-4 flex flex-col gap-3 ${i === 0 ? 'border-violet-200' : 'border-gray-100'}`}>

                  {/* Branch header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0"
                        style={{ background: ac + '18', color: ac }}>
                        {branch.branch_name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 leading-tight">{branch.branch_name}</p>
                        <p className="text-[10px] text-gray-400">{branch.location}</p>
                      </div>
                    </div>
                    <span className="text-lg">{rankEmoji}</span>
                  </div>

                  {/* Revenue + bar */}
                  <div>
                    <p className="text-xl font-black leading-none mb-2" style={{ color: ac }}>{fmtC(branch.total_revenue)}</p>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${(Number(branch.total_revenue) / maxRev) * 100}%`, background: ac }} />
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      ['Orders',   Number(branch.total_orders).toLocaleString()],
                      ['Avg Value', fmt(branch.avg_order_value)],
                      ['Guests',   Number(branch.total_customers).toLocaleString()],
                      ['Avg Pax',  Number(branch.avg_pax_per_order).toFixed(1)],
                    ] as [string, string][]).map(([l, v]) => (
                      <div key={l} className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">{l}</p>
                        <p className="text-sm font-black text-gray-900 font-mono">{v}</p>
                      </div>
                    ))}
                  </div>

                  {/* Top product */}
                  {branch.top_product && (
                    <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 flex items-center gap-2.5">
                      <Trophy size={13} className="text-amber-500 flex-shrink-0" />
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-wider text-amber-600">Top Product</p>
                        <p className="text-xs font-bold text-gray-800">{branch.top_product.product_name}</p>
                        <p className="text-[10px] text-gray-400">{branch.top_product.total_qty} sold</p>
                      </div>
                    </div>
                  )}

                  {/* Payment mix */}
                  {branch.payment_methods.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <CreditCard size={10} className="text-gray-400" />
                        <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Payment Mix</p>
                      </div>
                      <div className="flex h-2 rounded-full overflow-hidden gap-0.5 mb-2">
                        {branch.payment_methods.map((pm, j) => (
                          <div key={j} className="rounded-full" style={{ flex: pm.count, background: PAY_COLORS[pm.payment_method] ?? '#7c3aed' }}
                            title={`${pm.payment_method}: ${Math.round((pm.count / totalPay) * 100)}%`} />
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {branch.payment_methods.map((pm, j) => (
                          <div key={j} className="flex items-center gap-1 text-[10px] text-gray-400">
                            <div className="w-2 h-2 rounded-full" style={{ background: PAY_COLORS[pm.payment_method] ?? '#7c3aed' }} />
                            {pm.payment_method} <span className="font-bold">{Math.round((pm.count / totalPay) * 100)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </ModalShell>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MAIN EXPORT
// ═══════════════════════════════════════════════════════════════
export const ReportsTab = () => {
  const [modal, setModal] = useState<'sales' | 'branch' | null>(null);

  const liveCount = REPORT_CARDS.filter(r => r.live).length;
  const soonCount = REPORT_CARDS.filter(r => !r.live).length;

  return (
    <>
      <style>{`@keyframes lbModalIn { from { opacity:0; transform:translateY(-12px) scale(0.98); } to { opacity:1; transform:none; } }`}</style>

      <section className="px-5 md:px-8 pb-8 pt-5 space-y-5">

        {/* ── Summary strip ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Reports',    value: REPORT_CARDS.length, color: '#7c3aed', bg: '#ede9fe' },
            { label: 'Live Reports',     value: liveCount,           color: '#16a34a', bg: '#dcfce7' },
            { label: 'Coming Soon',      value: soonCount,           color: '#d97706', bg: '#fef9c3' },
            { label: 'Data Sources',     value: 3,                   color: '#0891b2', bg: '#cffafe' },
          ].map((s, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: s.bg, color: s.color }}>
                <Clock size={14} />
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">{s.label}</p>
                <p className="text-lg font-black text-gray-900 leading-tight">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Report cards grid ── */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {REPORT_CARDS.map(({ key, title, desc, Icon, live, badge }) => (
            <div key={key}
              className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col gap-4 hover:shadow-md hover:border-gray-200 transition-all group">

              {/* Card header */}
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: live ? '#ede9fe' : '#f4f4f5', color: live ? '#7c3aed' : '#a1a1aa' }}>
                  <Icon />
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                  live
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                    : 'bg-gray-100 text-gray-400 border-gray-200'
                }`}>
                  {badge}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1">
                <h3 className="text-sm font-black text-gray-900 mb-1 group-hover:text-violet-700 transition-colors">{title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-50" />

              {/* Action */}
              <button
                onClick={() => {
                  if      (key === 'sales')  setModal('sales');
                  else if (key === 'branch') setModal('branch');
                  else alert(`"${title}" report is coming soon.`);
                }}
                className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                  live
                    ? 'bg-violet-600 text-white hover:bg-violet-700 shadow-sm'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
                disabled={!live}
              >
                {live ? 'Generate Report' : 'Coming Soon'}
              </button>
            </div>
          ))}
        </div>
      </section>

      {modal === 'sales'  && <SalesSummaryModal    onClose={() => setModal(null)} />}
      {modal === 'branch' && <BranchComparisonModal onClose={() => setModal(null)} />}
    </>
  );
};

export default ReportsTab;
