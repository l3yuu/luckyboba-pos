import { useState, useEffect, useCallback, type ElementType } from 'react';
import api from '../../../services/api';
import {
  Users, ShoppingBag, AlertTriangle, PhilippinePeso,
  CheckCircle2, Clock, Package, Search,
  ArrowUpRight, ArrowDownRight, FileText
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import { SkeletonBox } from '../SharedSkeletons';

// ── Types ────────────────────────────────────────────────────────────────────
interface DashStats {
  total_orders_today: number;
  total_sales_today: number;
  voided_sales_today: number;
  cash_in_today: number;
  cash_out_today: number;
  top_seller_today: { product_name: string; total_qty: number }[];
}
interface LowStockItem { id: number; name: string; quantity: number; minimum: number; }
interface PendingVoid { id: number; invoice: string; amount: number; cashier_name?: string; cashier?: string; reason: string; created_at: string; }
interface HourlyStat { hour: number; total: number; count: number; }

interface StatTileProps {
  label: string;
  value: string | number;
  icon: ElementType;
  color: string;
  trend?: number;
}

interface TL_DashboardProps {
  branchId?: number | null;
}

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');
  
  .tl-dashboard { font-family: 'DM Sans', sans-serif; background: #f8fafc; min-height: 100vh; color: #1e293b; }
  
  .tl-report-header {
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 2rem;
    margin-bottom: 2.5rem;
  }
  
  .tl-tile { 
    background: #ffffff; border: 1px solid #e2e8f0; border-radius: 0.75rem; 
  }
  .tl-tile:hover { 
    border-color: #cbd5e1; 
    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.04);
  }

  .tl-label { font-size: 0.62rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.12em; }
  .tl-value { font-size: 1.65rem; font-weight: 800; color: #0f172a; letter-spacing: -0.04em; line-height: 1.2; }


  
  @keyframes tl-spin { to { transform: rotate(360deg); } }
  .tl-spin { animation: tl-spin 1s linear infinite; }

  .tl-monitoring-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 1rem; overflow: hidden; }
  .tl-monitoring-head { background: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 1rem 1.5rem; }
`;

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmtS = (v?: number) => {
  const n = Number(v ?? 0);
  if (n >= 1_000_000) return `₱${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₱${(n / 1_000).toFixed(1)}K`;
  return `₱${n.toLocaleString()}`;
};

// ── Components ───────────────────────────────────────────────────────────────
const StatTile = ({ label, value, icon: Icon, color, trend }: StatTileProps) => (
  <div className="tl-tile p-6 flex flex-col justify-between min-h-[140px]">
    <div className="flex items-start justify-between">
      <div className="p-2.5 rounded-lg" style={{ background: `${color}08`, color }}>
        <Icon size={20} strokeWidth={2.5} />
      </div>
      {trend && (
        <span className={`text-[10px] font-black flex items-center gap-1 ${trend > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
          {trend > 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {Math.abs(trend)}%
        </span>
      )}
    </div>
    <div className="mt-4">
      <p className="tl-label mb-1">{label}</p>
      <p className="tl-value">{value}</p>
    </div>
  </div>
);

const TL_DashboardPanel = ({ branchId }: TL_DashboardProps) => {
  const [stats, setStats] = useState<DashStats | null>(null);
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
  const [pendingVoids, setPendingVoids] = useState<PendingVoid[]>([]);
  const [hourly, setHourly] = useState<HourlyStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setRefreshing] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const params = { date: today, branch_id: branchId };
      const [statsRes, hourlyRes, stockRes, voidsRes] = await Promise.allSettled([
        api.get('/dashboard/stats', { params: { branch_id: branchId } }),
        api.get('/reports/hourly-sales', { params }),
        api.get('/raw-materials/low-stock', { params: { branch_id: branchId } }),
        api.get('/reports/void-logs', { params }),
      ]);

      if (statsRes.status === 'fulfilled') {
        const d = statsRes.value.data;
        setStats(d?.stats ?? d);
      }
      if (hourlyRes.status === 'fulfilled') {
        const raw = hourlyRes.value.data;
        const arr = Array.isArray(raw) ? raw : (raw?.hourly_data ?? []);
        setHourly(arr.map((r: { hour?: number; total?: number; count?: number }) => ({
          hour: Number(r.hour ?? 0),
          total: Number(r.total ?? 0),
          count: Number(r.count ?? 0)
        })));
      }
      if (stockRes.status === 'fulfilled') {
        const raw = stockRes.value.data;
        const arr = Array.isArray(raw) ? raw : (raw?.data ?? []);
        setLowStock(arr.slice(0, 5).map((r: { id?: number; name?: string; item_name?: string; quantity?: number; minimum?: number }) => ({
          id: Number(r.id),
          name: String(r.name || r.item_name || ''),
          quantity: Number(r.quantity ?? 0),
          minimum: Number(r.minimum ?? 5)
        })));
      }
      if (voidsRes.status === 'fulfilled') {
        const raw = voidsRes.value.data;
        const arr = Array.isArray(raw) ? raw : (raw?.logs ?? []);
        setPendingVoids(arr.slice(0, 5).map((r: { id?: number; invoice?: string; amount?: number; cashier_name?: string; cashier?: string; reason?: string; created_at?: string }) => ({
          id: Number(r.id || 0),
          invoice: String(r.invoice || ''),
          amount: Number(r.amount || 0),
          reason: String(r.reason || ''),
          created_at: String(r.created_at || ''),
          cashier_name: String(r.cashier_name || r.cashier || '')
        })));
      }
    } catch (e) {
      console.error('TL load error', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [today, branchId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const onSaleRecorded = () => load(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'lucky_boba_live_sales_tick') load(true);
    };

    window.addEventListener('luckyboba:sale-recorded', onSaleRecorded as EventListener);
    window.addEventListener('storage', onStorage);
    const id = setInterval(() => load(true), 10000);

    return () => {
      window.removeEventListener('luckyboba:sale-recorded', onSaleRecorded as EventListener);
      window.removeEventListener('storage', onStorage);
      clearInterval(id);
    };
  }, [load]);

  if (loading) return (
    <div className="p-8 md:p-12 tl-dashboard">
      <style>{STYLES}</style>
      
      {/* KPI Tiles Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {[1, 2, 3, 4].map(i => (
          <SkeletonBox key={i} className="h-[140px] bg-white/50" />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart Skeleton */}
        <SkeletonBox className="lg:col-span-2 h-[480px] bg-white/50" />
        
        {/* Sidebar Skeletons */}
        <div className="space-y-8">
          <SkeletonBox className="h-[225px] bg-white/50" />
          <SkeletonBox className="h-[225px] bg-white/50" />
        </div>
      </div>

      {/* Quick Actions Skeleton */}
      <div className="mt-12 pt-8 border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <SkeletonBox key={i} className="h-16 bg-white/50" />
        ))}
      </div>
    </div>
  );

  const totalOrders = stats?.total_orders_today ?? 0;
  const totalSales = stats?.total_sales_today ?? 0;
  const voidedSales = stats?.voided_sales_today ?? 0;
  const cashIn = stats?.cash_in_today ?? 0;
  const cashOut = stats?.cash_out_today ?? 0;
  const overallCash = cashIn - cashOut;

  // Derive active staff from transactions/voids
  const activeStaffTodayCount = Array.from(new Set([
    ...pendingVoids.map(v => v.cashier_name || v.cashier),
    'Lead Admin'
  ])).filter(Boolean).length;

  return (
    <div className="p-4 md:p-6 lg:p-10 tl-dashboard w-full overflow-x-hidden">
      <style>{STYLES}</style>


      {/* ── EXECUTIVE KPI TILES ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-5 mb-10">
        <StatTile label="Today's Revenue" value={fmtS(totalSales)} icon={PhilippinePeso} color="#6a12b8" />
        <StatTile label="Cash In" value={fmtS(cashIn)} icon={ArrowUpRight} color="#059669" />
        <StatTile label="Cash Out" value={fmtS(cashOut)} icon={ArrowDownRight} color="#be2525" />
        <StatTile label="Net Cash" value={fmtS(overallCash)} icon={PhilippinePeso} color="#0891b2" />
        <StatTile label="Transactions" value={totalOrders.toLocaleString()} icon={ShoppingBag} color="#0f172a" />
        <StatTile label="Void Risks" value={fmtS(voidedSales)} icon={AlertTriangle} color="#e11d48" />
        <StatTile label="Staff On-Duty" value={activeStaffTodayCount} icon={Users} color="#6366f1" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── LIVE REVENUE TREND ── */}
        <div className="lg:col-span-2 tl-tile bg-white p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#6a12b8]" />

          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="font-black text-slate-800 tracking-tight uppercase text-xs">Hourly Revenue Distribution</h3>
              <p className="tl-label mt-1 text-[10px]">Fiscal momentum across trading hours</p>
            </div>
            <div className="flex items-center gap-4 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-[#6a12b8]" />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Gross Sales</span>
            </div>
          </div>

          <div className="h-[360px] -ml-6">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hourly} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#f1f5f9" strokeDasharray="3 3" />
                <XAxis
                  dataKey="hour"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 9, fontWeight: 800, fill: '#cbd5e1' }}
                  dy={15}
                  tickFormatter={(h) => `${h}:00`}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 9, fontWeight: 800, fill: '#cbd5e1' }}
                  tickFormatter={(v) => `₱${v >= 1000 ? (v / 1000).toFixed(1) + 'K' : v}`}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '14px', border: 'none', boxShadow: '0 20px 40px -8px rgba(0,0,0,0.2)', background: '#0f172a', padding: '12px 16px' }}
                  itemStyle={{ color: '#fff', fontSize: '11px', fontWeight: 700, padding: 0 }}
                  labelStyle={{ fontSize: '9px', color: '#6366f1', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 900, letterSpacing: '0.08em' }}
                  cursor={{ stroke: '#6a12b820', strokeWidth: 1 }}
                  formatter={(v) => [`₱${Number(v).toLocaleString()}`, 'HOURLY SALES']}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#6a12b8"
                  strokeWidth={3.5}
                  dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#6a12b8' }}
                  activeDot={{ r: 7, strokeWidth: 3, fill: '#fff', stroke: '#6a12b8' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── OPERATIONAL MONITORING ── */}
        <div className="space-y-8">

          <div className="tl-monitoring-card">
            <div className="tl-monitoring-head">
              <h3 className="font-black text-rose-600 tracking-tight uppercase text-[10px] flex items-center gap-2">
                <AlertTriangle size={14} /> Low Stock Critical
              </h3>
            </div>
            <div className="p-5 space-y-3">
              {lowStock.length > 0 ? lowStock.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-rose-50/50 border border-rose-100/50">
                  <span className="text-[0.7rem] font-bold text-slate-700">{item.name}</span>
                  <span className="text-[0.6rem] font-black text-rose-600 px-2.5 py-1 bg-white rounded-lg shadow-sm border border-rose-100">{item.quantity} UI</span>
                </div>
              )) : (
                <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <CheckCircle2 size={24} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Inventory Healthy</p>
                </div>
              )}
            </div>
          </div>

          <div className="tl-monitoring-card">
            <div className="tl-monitoring-head">
              <h3 className="font-black text-slate-800 tracking-tight uppercase text-[10px] flex items-center gap-2">
                <Clock size={14} className="text-[#6a12b8]" /> Recent Voids
              </h3>
            </div>
            <div className="p-5 space-y-4">
              {pendingVoids.length > 0 ? pendingVoids.map(v => (
                <div key={v.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400"><FileText size={14} /></div>
                    <div>
                      <p className="text-[0.75rem] font-black text-slate-900 leading-tight">{v.invoice}</p>
                      <p className="text-[0.6rem] font-bold text-slate-400 uppercase">{v.cashier_name || v.cashier || 'System'}</p>
                    </div>
                  </div>
                  <span className="text-[0.75rem] font-black text-rose-500 tabular-nums">-{fmtS(v.amount)}</span>
                </div>
              )) : (
                <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <Clock size={24} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No Recent Voids</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ── QUICK ACTIONS LEDGER ── */}
      <div className="mt-12 pt-8 border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Users, label: "Personnel Hub" },
          { icon: Package, label: "Stock Ledger" },
          { icon: Search, label: "Global Search" },
          { icon: FileText, label: "Generate EOD" },
        ].map((act, i) => (
          <button key={i} className="group p-4 bg-white border border-slate-200 rounded-xl flex items-center gap-4 hover:border-[#6a12b850] hover:shadow-md transition-all active:scale-[0.98]">
            <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-[#6a12b810] group-hover:text-[#6a12b8] transition-colors">
              <act.icon size={20} />
            </div>
            <span className="text-[0.7rem] font-black text-slate-600 uppercase tracking-widest">{act.label}</span>
          </button>
        ))}
      </div>

      <div className="mt-16 flex items-center justify-center gap-1.5 opacity-30 cursor-default">
        <span className="w-8 h-px bg-slate-400" />
        <p className="text-[0.6rem] font-bold tracking-[0.3em] uppercase">Operational Audit V2</p>
        <span className="w-8 h-px bg-slate-400" />
      </div>
    </div>
  );
};

export default TL_DashboardPanel;
