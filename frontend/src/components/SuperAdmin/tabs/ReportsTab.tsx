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

// ── Design tokens ─────────────────────────────────────────────────
const T = {
  bg:          '#f0eff8',
  border:      '#e8e4f3',
  purple:      '#3d2c8d',
  purpleLight: '#6c5db5',
  purplePale:  '#eceaf8',
  purpleMid:   '#b8aee8',
  text:        '#1e1b4b',
  sub:         '#6b7280',
  gold:        '#d97706',
};

const BR_COLORS = ['#7c3aed', '#06b6d4', '#f59e0b', '#10b981', '#ef4444'];
const PAY_COLORS: Record<string, string> = {
  GCash: '#06b6d4', Cash: '#f59e0b', Card: '#7c3aed', Maya: '#10b981',
};

// ── Formatters ────────────────────────────────────────────────────
const fmt  = (v: string | number) =>
  `₱${Number(v ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtC = (v: string | number) =>
  Number(v) >= 1_000_000 ? `₱${(Number(v) / 1_000_000).toFixed(2)}M`
  : Number(v) >= 1_000   ? `₱${(Number(v) / 1_000).toFixed(1)}K`
  : fmt(v);

// ── Report cards config ───────────────────────────────────────────
const REPORT_CARDS = [
  { key: 'sales',     title: 'Sales Summary',    desc: 'Complete sales report across all branches',  Icon: SalesReportIcon,     live: true  },
  { key: 'inventory', title: 'Inventory Report', desc: 'Stock levels and inventory movement',        Icon: InventoryIcon,       live: false },
  { key: 'users',     title: 'User Activity',    desc: 'Login history and user actions',             Icon: UserActivityIcon,    live: false },
  { key: 'branch',    title: 'Branch Comparison',desc: 'Performance comparison between branches',    Icon: BranchComparisonIcon,live: true  },
  { key: 'financial', title: 'Financial Report', desc: 'Revenue, expenses, and profit margins',      Icon: FinancialIcon,       live: false },
  { key: 'audit',     title: 'Audit Log',        desc: 'System changes and administrative actions',  Icon: AuditLogIcon,        live: false },
];

// ── Shared small components ───────────────────────────────────────
function PeriodPill({ value, active, onClick }: { value: Period; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: '6px 18px', borderRadius: 20, border: 'none', cursor: 'pointer',
      fontWeight: 700, fontSize: 13,
      background: active ? T.purple : 'transparent',
      color: active ? '#fff' : T.sub,
      transition: 'all .2s',
    }}>
      {value.charAt(0).toUpperCase() + value.slice(1)}
    </button>
  );
}

function StatCard({ label, value, sub, color = T.purple }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{ background: T.purplePale, borderRadius: 12, padding: '16px 18px' }}>
      <div style={{ fontSize: 11, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.09em', fontWeight: 700, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color, fontFamily: 'monospace', lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

interface ChartPayloadItem { name?: string; value?: number; color?: string; }
interface ChartTipProps    { active?: boolean; payload?: ChartPayloadItem[]; label?: string; }

function ChartTip({ active, payload, label }: ChartTipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 14px', boxShadow: '0 4px 12px #3d2c8d18' }}>
      <div style={{ fontSize: 11, color: T.sub, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ fontSize: 13, fontWeight: 700, color: p.color || T.purple }}>
          {p.name}: {p.name?.toLowerCase().includes('rev') || p.name?.toLowerCase().includes('avg') ? fmtC(p.value ?? 0) : Number(p.value ?? 0).toLocaleString()}
        </div>
      ))}
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: 14 }}>
      <div style={{ width: 40, height: 40, border: `3px solid ${T.purplePale}`, borderTop: `3px solid ${T.purple}`, borderRadius: '50%', animation: 'lbSpin 0.8s linear infinite' }} />
      <span style={{ fontSize: 13, color: T.sub, fontWeight: 600 }}>Loading report…</span>
    </div>
  );
}

function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div style={{ background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: 12, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <div style={{ fontWeight: 700, color: '#dc2626', fontSize: 14 }}>Failed to load report</div>
        <div style={{ fontSize: 12, color: T.sub, marginTop: 2 }}>{message}</div>
      </div>
      <button onClick={onRetry} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#dc2626', color: '#fff', fontWeight: 700, fontSize: 13 }}>
        Retry
      </button>
    </div>
  );
}

// ── Modal shell ───────────────────────────────────────────────────
function ModalShell({ title, subtitle, icon, onClose, children }: {
  title: string; subtitle: string; icon: string; onClose: () => void; children: React.ReactNode;
}) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(30,27,75,0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '32px 24px', overflowY: 'auto' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 980, boxShadow: '0 24px 64px rgba(61,44,141,0.22)', animation: 'lbModalIn .25s cubic-bezier(.34,1.56,.64,1)', overflow: 'hidden', flexShrink: 0 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '22px 28px', borderBottom: `1.5px solid ${T.border}`, background: `linear-gradient(135deg, ${T.purplePale} 0%, #fff 60%)` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: T.purple, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, boxShadow: `0 4px 12px ${T.purple}44` }}>{icon}</div>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: T.text }}>{title}</h2>
              <p  style={{ margin: 0, fontSize: 12, color: T.sub }}>{subtitle}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, border: `1.5px solid ${T.border}`, background: '#fff', cursor: 'pointer', fontSize: 20, color: T.sub, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>×</button>
        </div>
        {/* Body */}
        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 0 }}>{children}</div>
      </div>
    </div>
  );
}

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
    reportService
      .getSalesSummary({ period })
      .then(d  => { if (!cancelled) dispatch({ type: 'FETCH_SUCCESS', payload: d }); })
      .catch(e => { if (!cancelled) dispatch({ type: 'FETCH_ERROR',   payload: e.message ?? 'Unknown error' }); });
    return () => { cancelled = true; };
  }, [period]);

  const maxBr = data ? Math.max(...data.revenue_per_branch.map(b => Number(b.total_revenue))) : 1;

  return (
    <ModalShell title="Sales Summary" subtitle="Complete sales report across all branches" icon="📊" onClose={onClose}>
      <div style={{ display: 'flex', gap: 4, background: T.purplePale, borderRadius: 24, padding: 4, alignSelf: 'flex-start', marginBottom: 20 }}>
        {(['daily', 'weekly', 'monthly'] as Period[]).map(p => (
          <PeriodPill key={p} value={p} active={period === p} onClick={() => setPeriod(p)} />
        ))}
      </div>

      {loading && <LoadingSpinner />}
      {error   && <ErrorBanner message={error} onRetry={() => setPeriod(period)} />}

      {data && !loading && (
        <>
          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20 }}>
            <StatCard label="Gross Revenue"   value={fmtC(data.totals.grand_total)}                        sub={`${Number(data.totals.total_orders).toLocaleString()} orders`} color={T.purple} />
            <StatCard label="Total Orders"    value={Number(data.totals.total_orders).toLocaleString()}    sub="completed"       color="#7c3aed" />
            <StatCard label="Avg Order Value" value={fmt(data.totals.avg_order_value)}                     sub="per transaction" color={T.gold}  />
            <StatCard label="Total Guests"    value={Number(data.totals.total_customers).toLocaleString()} sub="pax served"      color="#059669" />
          </div>

          {/* Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 12, marginBottom: 20 }}>
            <div style={{ background: T.purplePale, borderRadius: 12, padding: '16px 16px 8px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 10 }}>Daily Revenue Trend</div>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={data.breakdown} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="lbSsg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor={T.purple} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={T.purple} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: T.sub }} tickFormatter={d => d.slice(5)} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: T.sub }} tickFormatter={fmtC} axisLine={false} tickLine={false} width={54} />
                  <Tooltip content={<ChartTip />} />
                  <Area type="monotone" dataKey="revenue" name="Revenue" stroke={T.purple} strokeWidth={2.5} fill="url(#lbSsg)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: T.purplePale, borderRadius: 12, padding: '16px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 12 }}>Revenue by Branch</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 220, overflowY: 'auto', paddingRight: 4 }}>
                {data.revenue_per_branch.map((b, i) => (
                  <div key={b.branch_id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{b.branch_name}</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: BR_COLORS[i] ?? T.purple, fontFamily: 'monospace' }}>{fmtC(b.total_revenue)}</span>
                    </div>
                    <div style={{ height: 6, background: '#ddd9f0', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(Number(b.total_revenue) / maxBr) * 100}%`, background: BR_COLORS[i] ?? T.purple, borderRadius: 4 }} />
                    </div>
                    <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{b.order_count} orders · avg {fmt(b.average_order_value)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Products */}
          <div style={{ background: T.purplePale, borderRadius: 12, padding: '16px', marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 12 }}>Top Products</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8 }}>
              {data.top_products.slice(0, 5).map((p, i) => (
                <div key={i} style={{ background: '#fff', borderRadius: 10, padding: '12px 14px', border: `1px solid ${i === 0 ? T.purpleMid : T.border}` }}>
                  <div style={{ fontSize: 16, marginBottom: 4 }}>{['🥇','🥈','🥉','4th','5th'][i]}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.text, lineHeight: 1.3, marginBottom: 6 }}>{p.product_name}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: BR_COLORS[i] ?? T.purple, fontFamily: 'monospace' }}>{p.total_quantity.toLocaleString()}</div>
                  <div style={{ fontSize: 10, color: T.sub }}>units · {fmtC(p.total_revenue)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Breakdown table */}
          <div style={{ background: T.purplePale, borderRadius: 12, padding: '16px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 10 }}>Daily Breakdown</div>
<div style={{ maxHeight: 240, overflowY: 'auto', borderRadius: 8 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Date','Revenue','Orders','Avg Order Value'].map(h => (
                    <th key={h} style={{ textAlign: 'left', fontSize: 10, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.07em', padding: '0 10px 8px', fontWeight: 700 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.breakdown.map((row, i) => (
                  <tr key={i} style={{ borderTop: `1px solid ${T.border}` }}>
                    <td style={{ padding: '10px', fontSize: 13, color: T.sub,   fontFamily: 'monospace' }}>{row.date}</td>
                    <td style={{ padding: '10px', fontSize: 14, fontWeight: 800, color: T.purple, fontFamily: 'monospace' }}>{fmtC(row.revenue)}</td>
                    <td style={{ padding: '10px', fontSize: 13, color: T.text }}>{Number(row.orders).toLocaleString()}</td>
                    <td style={{ padding: '10px', fontSize: 13, color: T.text,  fontFamily: 'monospace' }}>{fmt(row.avg_order_value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
    reportService
      .getBranchComparison({ period })
      .then(d  => { if (!cancelled) dispatch({ type: 'FETCH_SUCCESS', payload: d }); })
      .catch(e => { if (!cancelled) dispatch({ type: 'FETCH_ERROR',   payload: e.message ?? 'Unknown error' }); });
    return () => { cancelled = true; };
  }, [period]);

  const maxRev = data ? Math.max(...data.comparison.map(b => Number(b.total_revenue))) : 1;

  return (
    <ModalShell title="Branch Comparison" subtitle="Performance comparison between branches" icon="🔀" onClose={onClose}>
      <div style={{ display: 'flex', gap: 4, background: T.purplePale, borderRadius: 24, padding: 4, alignSelf: 'flex-start', marginBottom: 20 }}>
        {(['daily', 'weekly', 'monthly'] as Period[]).map(p => (
          <PeriodPill key={p} value={p} active={period === p} onClick={() => setPeriod(p)} />
        ))}
      </div>

      {loading && <LoadingSpinner />}
      {error   && <ErrorBanner message={error} onRetry={() => setPeriod(period)} />}

      {data && !loading && (
        <>
          {/* Bar chart */}
          <div style={{ background: T.purplePale, borderRadius: 12, padding: '16px 16px 8px', marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 10 }}>Revenue Overview</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data.comparison} barCategoryGap="40%" margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                <XAxis dataKey="branch_name" tick={{ fontSize: 12, fill: T.sub }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: T.sub }} tickFormatter={fmtC} axisLine={false} tickLine={false} width={54} />
                <Tooltip content={<ChartTip />} />
                <Bar dataKey="total_revenue" name="Revenue" radius={[6,6,0,0]}>
                  {data.comparison.map((_, i) => <Cell key={i} fill={BR_COLORS[i] ?? T.purple} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Branch cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            {data.comparison.map((branch, i) => {
              const totalPay  = branch.payment_methods.reduce((a, m) => a + m.count, 0);
              const rankEmoji = ['🥇','🥈','🥉'][i] ?? `#${i + 1}`;
              const ac        = BR_COLORS[i] ?? T.purple;
              return (
                <div key={branch.branch_id} style={{ background: T.purplePale, borderRadius: 12, padding: '16px', border: `1.5px solid ${i === 0 ? T.purpleMid : T.border}`, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 15, color: T.text }}>{branch.branch_name}</div>
                      <div style={{ fontSize: 11, color: T.sub }}>{branch.location}</div>
                    </div>
                    <span style={{ fontSize: 20 }}>{rankEmoji}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: ac, fontFamily: 'monospace', marginBottom: 4 }}>{fmtC(branch.total_revenue)}</div>
                    <div style={{ height: 5, background: '#ddd9f0', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(Number(branch.total_revenue) / maxRev) * 100}%`, background: ac, borderRadius: 4 }} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {([['Orders', Number(branch.total_orders).toLocaleString()], ['Avg Value', fmt(branch.avg_order_value)], ['Guests', Number(branch.total_customers).toLocaleString()], ['Avg Pax', Number(branch.avg_pax_per_order).toFixed(1)]] as [string,string][]).map(([l, v]) => (
                      <div key={l} style={{ background: '#fff', borderRadius: 8, padding: '8px 10px' }}>
                        <div style={{ fontSize: 10, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 1 }}>{l}</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: T.text, fontFamily: 'monospace' }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  {branch.top_product && (
                    <div style={{ background: '#fff', borderRadius: 8, padding: '8px 10px', display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: 16 }}>🏆</span>
                      <div>
                        <div style={{ fontSize: 10, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Top Product</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{branch.top_product.product_name}</div>
                        <div style={{ fontSize: 10, color: T.sub }}>{branch.top_product.total_qty} sold</div>
                      </div>
                    </div>
                  )}
                  {branch.payment_methods.length > 0 && (
                    <div>
                      <div style={{ fontSize: 10, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>Payment Mix</div>
                      <div style={{ display: 'flex', gap: 3, height: 5, borderRadius: 4, overflow: 'hidden' }}>
                        {branch.payment_methods.map((pm, j) => (
                          <div key={j} style={{ flex: pm.count, background: PAY_COLORS[pm.payment_method] ?? T.purple }} title={`${pm.payment_method}: ${Math.round((pm.count / totalPay) * 100)}%`} />
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 5, flexWrap: 'wrap' }}>
                        {branch.payment_methods.map((pm, j) => (
                          <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: T.sub }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: PAY_COLORS[pm.payment_method] ?? T.purple }} />
                            {pm.payment_method} {Math.round((pm.count / totalPay) * 100)}%
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

  return (
    <>
      <style>{`
        @keyframes lbModalIn { from { opacity:0; transform:translateY(-16px) scale(0.97); } to { opacity:1; transform:none; } }
        @keyframes lbSpin    { to { transform: rotate(360deg); } }
      `}</style>

      <section className="flex-1 px-6 md:px-10 pb-10 overflow-auto">
        <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {REPORT_CARDS.map(({ key, title, desc, Icon, live }) => (
            <div key={key} className="rounded-[1.5rem] border border-zinc-100 bg-white shadow-sm p-6 hover:shadow-md transition-all group">
              <div className="text-3xl mb-4"><Icon /></div>
              <h3 className="font-black text-[#3b2063] text-lg group-hover:text-[#2a174a]">{title}</h3>
              <p className="text-sm text-zinc-400 mt-2">{desc}</p>
              <button
                onClick={() => {
                  if      (key === 'sales')  setModal('sales');
                  else if (key === 'branch') setModal('branch');
                  else alert(`"${title}" report is coming soon.`);
                }}
                className={`mt-4 px-4 py-2 rounded-xl font-bold text-[11px] uppercase transition-all w-full ${
                  live
                    ? 'bg-[#3b2063] text-white hover:bg-[#2a174a] cursor-pointer'
                    : 'bg-[#f0ebff] text-[#3b2063] hover:bg-[#e5deff] cursor-pointer'
                }`}
              >
                Generate
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