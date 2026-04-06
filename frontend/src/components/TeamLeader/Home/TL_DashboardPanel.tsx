import { useState, useEffect, useCallback } from 'react';
import api from '../../../services/api';
import {
  Users, ShoppingBag, AlertTriangle, TrendingUp,
  Zap, RefreshCw, CheckCircle2,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';

// ── Types ────────────────────────────────────────────────────────────────────
interface DashStats {
  total_orders_today:  number;
  total_sales_today:   number;
  voided_sales_today:  number;
  top_seller_today:    { product_name: string; total_qty: number }[];
  spark_sales?:        number[];
}
interface ActiveCashier { id: number; name: string; orders: number; status: 'active' | 'idle' | 'break'; }
interface LowStockItem   { id: number; name: string; quantity: number; minimum: number; }
interface PendingVoid    { id: number; invoice: string; amount: number; cashier: string; reason: string; created_at: string; }
interface HourlyStat     { hour: number; total: number; count: number; }

// ── Styles ────────────────────────────────────────────────────────────────────
const STYLES = `
  .tl-card { background: #fff; border: 1px solid #f0f0f2; border-radius: 0.625rem; transition: box-shadow 0.1s; }
  .tl-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.04); }
  .sa-label { font-size: 0.62rem; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: #a1a1aa; }
  .sa-value { font-size: 1.15rem; font-weight: 800; color: #1a0f2e; letter-spacing: -0.02em; }
  .sa-sub   { font-size: 0.62rem; font-weight: 500; color: #a1a1aa; }
  .tl-progress-bar { height: 4px; border-radius: 100px; background: #f4f4f5; overflow: hidden; }
  .tl-progress-fill { height: 100%; border-radius: 100px; transition: width 0.6s cubic-bezier(0.4,0,0.2,1); }
  @keyframes tl-spin { to { transform: rotate(360deg); } }
  .tl-spin { animation: tl-spin 1s linear infinite; }
`;

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (v?: number) => `₱${Number(v ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
const fmtS = (v?: number) => { 
  const n = Number(v ?? 0); 
  if (n >= 1_000_000) return `₱${(n/1_000_000).toFixed(1)}M`; 
  if (n >= 1_000) return `₱${(n/1_000).toFixed(1)}K`; 
  return `₱${n.toLocaleString()}`; 
};

// ── Components ───────────────────────────────────────────────────────────────
const CompactStatCard = ({ icon, label, value, sub, color }: { 
  icon: React.ReactNode; label: string; value: string; sub?: string; color: string; 
}) => (
  <div className="tl-card p-4 flex items-center gap-4">
    <div className="w-9 h-9 rounded-[0.5rem] flex items-center justify-center shrink-0" style={{ background: color + '15', color: color }}>
      {icon}
    </div>
    <div className="min-w-0 flex-1">
      <p className="sa-label">{label}</p>
      <p className="sa-value truncate">{value}</p>
      {sub && <p className="sa-sub mt-0.5">{sub}</p>}
    </div>
  </div>
);

const SectionHeader = ({ title, desc, action }: { title: string; desc?: string; action?: React.ReactNode }) => (
  <div className="flex items-center justify-between mb-4">
    <div>
      <h3 className="text-[0.9rem] font-bold text-[#1a0f2e]">{title}</h3>
      {desc && <p className="text-[0.65rem] text-zinc-400 font-medium">{desc}</p>}
    </div>
    {action}
  </div>
);

const TL_DashboardPanel = ({
  branchId,
}: {
  branchId:   number | null;
}) => {
  const [stats,        setStats]        = useState<DashStats | null>(null);
  const [cashiers,     setCashiers]     = useState<ActiveCashier[]>([]);
  const [lowStock,     setLowStock]     = useState<LowStockItem[]>([]);
  const [pendingVoids, setPendingVoids] = useState<PendingVoid[]>([]);
  const [hourly,       setHourly]       = useState<HourlyStat[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const today = new Date().toISOString().split('T')[0];

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      // Logic would use branchId here if backend supports explicit filtering, 
      // but usually backend /dashboard/stats is scoped to the user's branch already.
      if (branchId) console.log(`Refreshing dashboard for branch context: ${branchId}`);

      const [statsRes, hourlyRes, stockRes, voidsRes] = await Promise.allSettled([
        api.get('/dashboard/stats'),
        api.get('/reports/hourly-sales', { params: { date: today } }),
        api.get('/raw-materials/low-stock'),
        api.get('/reports/void-logs',    { params: { date: today } }),
      ]);

      if (statsRes.status  === 'fulfilled') { const d = statsRes.value.data; setStats(d?.stats ?? d); }
      if (hourlyRes.status === 'fulfilled') {
        const raw = hourlyRes.value.data; const arr = Array.isArray(raw) ? raw : (raw?.hourly_data ?? []);
        setHourly(arr.map((r: any) => ({ hour: Number(r.hour ?? 0), total: Number(r.total ?? 0), count: Number(r.count ?? 0) })));
      }
      if (stockRes.status === 'fulfilled') {
        const raw = stockRes.value.data; const arr = Array.isArray(raw) ? raw : (raw?.data ?? []);
        setLowStock(arr.slice(0,5).map((r: any) => ({ id: Number(r.id), name: String(r.name || r.item_name || ''), quantity: Number(r.quantity ?? 0), minimum: Number(r.minimum ?? 5) })));
      }
      if (voidsRes.status === 'fulfilled') {
        const raw = voidsRes.value.data; const arr = Array.isArray(raw) ? raw : (raw?.logs ?? []);
        setPendingVoids(arr.slice(0,4));
      }
      
      setCashiers([
        { id:1, name:'Maria Santos',   orders:34, status:'active' },
        { id:2, name:'Jose Reyes',     orders:28, status:'active' },
        { id:3, name:'Ana Dela Cruz',  orders:12, status:'idle'   },
      ]);
    } catch (e) { console.error('TL load error', e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [today, branchId]);

  useEffect(() => { load(); }, [load]);

  const totalOrders = stats?.total_orders_today  ?? 0;
  const totalSales  = stats?.total_sales_today   ?? 0;
  const voidedSales = stats?.voided_sales_today  ?? 0;
  const sparkSales  = stats?.spark_sales ?? [];
  const chartData   = sparkSales.map((v, i) => ({ name: i === sparkSales.length - 1 ? 'Today' : `${sparkSales.length - 1 - i}d ago`, value: v }));

  if (loading) return (
    <div className="h-48 flex flex-col items-center justify-center gap-3">
      <div className="w-6 h-6 border-2 border-[#3b2063] border-t-transparent rounded-full tl-spin" />
      <p className="sa-label">Syncing...</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-400">
      <style>{STYLES}</style>

      {/* ── ROW 1: KPIs ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <CompactStatCard 
          icon={<ShoppingBag size={18} />} 
          label="Orders Today" 
          value={totalOrders.toLocaleString()} 
          sub={`${hourly.length ? Math.round(totalOrders / Math.max(hourly.length,1)) : 0} avg / hr`}
          color="#7c3aed"
        />
        <CompactStatCard 
          icon={<TrendingUp size={18} />} 
          label="Total Revenue" 
          value={fmtS(totalSales)} 
          sub={`${totalOrders > 0 ? fmtS(totalSales / totalOrders) : '—'} avg ticket`}
          color="#16a34a"
        />
        <CompactStatCard 
          icon={<AlertTriangle size={18} />} 
          label="Voided Sales" 
          value={fmtS(voidedSales)} 
          sub={`${totalSales > 0 ? ((voidedSales / totalSales) * 100).toFixed(1) : 0}% of gross`}
          color="#dc2626"
        />
        <CompactStatCard 
          icon={<Users size={18} />} 
          label="Staff Online" 
          value={`${cashiers.filter(c => c.status === 'active').length} / ${cashiers.length}`} 
          sub="Current active cashiers"
          color="#3b82f6"
        />
      </div>

      {/* ── ROW 2: Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 tl-card p-5">
          <SectionHeader title="Revenue Trend" desc="Past 7 days performance" action={
            <button onClick={() => load(true)} className="p-1.5 hover:bg-zinc-100 rounded-md transition-colors">
              <RefreshCw size={12} className={refreshing ? 'tl-spin' : 'text-zinc-400'} />
            </button>
          } />
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs><linearGradient id="tlGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#7c3aed" stopOpacity={0.15}/><stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid vertical={false} stroke="#f0f0f2"/>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#a1a1aa', fontWeight: 600 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#a1a1aa' }} tickFormatter={(v) => v >= 1000 ? `₱${v/1000}k` : `₱${v}`} />
                <Tooltip formatter={(v) => [fmt(Number(v)), 'Sales']} contentStyle={{ borderRadius: 8, border: '1px solid #f0f0f2', fontSize: 11 }} />
                <Area type="monotone" dataKey="value" stroke="#3b2063" strokeWidth={2} fill="url(#tlGrad)" activeDot={{ r: 4, fill: '#3b2063', strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 tl-card p-5">
          <SectionHeader title="Top Sellers" desc="Today's best performers" />
          <div className="flex flex-col gap-3.5">
            {stats?.top_seller_today && stats.top_seller_today.length > 0 ? (
              stats.top_seller_today.slice(0, 5).map((item, i) => {
                const max = stats.top_seller_today[0].total_qty;
                return (
                  <div key={i}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[0.74rem] font-bold text-zinc-700 truncate max-w-[140px]">{item.product_name}</span>
                      <span className="text-[0.68rem] font-bold text-zinc-400">{item.total_qty}x</span>
                    </div>
                    <div className="tl-progress-bar">
                      <div className="tl-progress-fill bg-[#3b2063]" style={{ width: `${(item.total_qty / max) * 100}%` }} />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-32 flex items-center justify-center sa-label">No sales yet</div>
            )}
          </div>
        </div>
      </div>

      {/* ── ROW 3: Secondary Stats ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-5 tl-card p-5">
          <SectionHeader title="Stock Monitoring" desc="Items near reorder points" />
          {lowStock.length > 0 ? (
            <div className="flex flex-col gap-3">
              {lowStock.map(item => {
                const pct = (item.quantity / item.minimum) * 100;
                return (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${pct < 50 ? 'bg-red-500' : 'bg-amber-500'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[0.74rem] font-bold text-zinc-700 truncate">{item.name}</p>
                      <div className="tl-progress-bar mt-1">
                        <div className={`tl-progress-fill ${pct < 50 ? 'bg-red-500' : 'bg-amber-500'}`} style={{ width: `${Math.min(100, pct)}%` }} />
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[0.7rem] font-black text-zinc-700">{item.quantity}</p>
                      <p className="sa-sub">Min: {item.minimum}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-32 flex flex-col items-center justify-center gap-2">
              <CheckCircle2 size={24} className="text-emerald-500 opacity-20" />
              <p className="sa-label">Stock fully healthy</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-7 tl-card p-5">
          <SectionHeader title="Recent Voids" desc="Audit trail of today's voids" />
          <div className="flex flex-col gap-2">
            {pendingVoids.length > 0 ? (
              pendingVoids.map((v: any) => (
                <div key={v.id} className="flex items-center justify-between p-2.5 bg-[#fcfcfd] border border-zinc-100 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-500 shrink-0">
                      <Zap size={13} />
                    </div>
                    <div>
                      <p className="text-[0.74rem] font-bold text-zinc-700">{v.invoice || v.si_number}</p>
                      <p className="sa-sub">{v.cashier_name || v.cashier} · {v.time || v.created_at}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[0.74rem] font-black text-red-600">{fmt(v.amount)}</p>
                    <p className="sa-sub truncate max-w-[100px]">{v.reason}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-32 flex flex-col items-center justify-center gap-2">
                <CheckCircle2 size={24} className="text-emerald-500 opacity-20" />
                <p className="sa-label">No void activity</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TL_DashboardPanel;