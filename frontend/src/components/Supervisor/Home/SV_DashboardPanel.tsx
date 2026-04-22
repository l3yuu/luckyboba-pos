import { useState, useEffect, useCallback, type ElementType } from 'react';
import api from '../../../services/api';
import {
  Users, ShoppingBag, AlertTriangle, TrendingUp,
  RefreshCw, CheckCircle2, Clock, Package, Search,
  ArrowUpRight, ArrowDownRight, FileText, Activity, BarChart2
} from 'lucide-react';
import {
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
// ── Types ────────────────────────────────────────────────────────────────────
interface DashStats {
  total_orders_today: number;
  total_sales_today: number;
  voided_sales_today: number;
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

interface SV_DashboardProps {
  branchId?: number | null;
}

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap');
  
  .sv-dashboard { 
    font-family: 'Plus Jakarta Sans', sans-serif; 
    background: #fdfcff; 
    min-height: 100vh; 
    color: #1a1a1a; 
  }
  
  /* Glassmorphism Effect */
  .sv-glass {
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.07);
  }

  .sv-tile { 
    border-radius: 1.25rem; 
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
  }
  .sv-tile:hover { 
    transform: translateY(-4px);
    box-shadow: 0 20px 40px -8px rgba(0,0,0,0.1);
  }

  .sv-label { 
    font-size: 0.65rem; 
    font-weight: 800; 
    color: #64748b; 
    text-transform: uppercase; 
    letter-spacing: 0.15em; 
  }
  .sv-value { 
    font-size: 1.85rem; 
    font-weight: 800; 
    color: #0f172a; 
    letter-spacing: -0.04em; 
    line-height: 1.1; 
  }

  @keyframes sv-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
  .sv-pulse { animation: sv-pulse 1.5s ease-in-out infinite; }
  .sv-skeleton { background: #f1f5f9; border-radius: 1rem; }
  
  @keyframes sv-spin { to { transform: rotate(360deg); } }
  .sv-spin { animation: sv-spin 1s linear infinite; }

  .sv-monitoring-card { 
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(10px);
    border-radius: 1.5rem; 
    border: 1px solid rgba(255, 255, 255, 0.5);
    overflow: hidden; 
  }
  .sv-monitoring-head { 
    padding: 1.25rem 1.75rem; 
    border-bottom: 1px solid rgba(0,0,0,0.04);
  }
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
  <div className="sv-tile sv-glass p-6 flex flex-col justify-between min-h-[150px]">
    <div className="flex items-start justify-between">
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-[#a020f0]/10"
        style={{ background: `linear-gradient(135deg, ${color}20 0%, ${color}10 100%)`, color }}
      >
        <Icon size={24} strokeWidth={2.5} />
      </div>
      {trend !== undefined && (
        <div className={`px-2.5 py-1 rounded-full text-[10px] font-black flex items-center gap-1 ${trend > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'
          }`}>
          {trend > 0 ? <ArrowUpRight size={12} strokeWidth={3} /> : <ArrowDownRight size={12} strokeWidth={3} />}
          {Math.abs(trend)}%
        </div>
      )}
    </div>
    <div className="mt-6">
      <p className="sv-label mb-1.5">{label}</p>
      <div className="flex items-baseline gap-2">
        <p className="sv-value">{value}</p>
        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      </div>
    </div>
  </div>
);

const SV_DashboardPanel = ({ branchId }: SV_DashboardProps) => {
  const [stats, setStats] = useState<DashStats | null>(null);
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
  const [pendingVoids, setPendingVoids] = useState<PendingVoid[]>([]);
  const [hourly, setHourly] = useState<HourlyStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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
        const d = statsRes.value.data as { stats?: DashStats } | DashStats;
        const statsData = (d as { stats: DashStats })?.stats ?? d;
        setStats(statsData as DashStats);
      }
      if (hourlyRes.status === 'fulfilled') {
        const raw = hourlyRes.value.data as HourlyStat[] | { hourly_data: HourlyStat[] };
        const arr = Array.isArray(raw) ? raw : (raw?.hourly_data ?? []);
        setHourly(arr.map((r: HourlyStat) => ({
          hour: Number(r.hour ?? 0),
          total: Number(r.total ?? 0),
          count: Number(r.count ?? 0)
        })));
      }
      if (stockRes.status === 'fulfilled') {
        const raw = stockRes.value.data as LowStockItem[] | { data: LowStockItem[] };
        const arr = Array.isArray(raw) ? raw : (raw?.data ?? []);
        setLowStock(arr.map((r: LowStockItem) => ({
          id: Number(r.id),
          name: String(r.name || ''),
          quantity: Number(r.quantity ?? 0),
          minimum: Number(r.minimum ?? 0)
        })));
      }
      if (voidsRes.status === 'fulfilled') {
        const raw = voidsRes.value.data as PendingVoid[] | { logs: PendingVoid[] };
        const arr = Array.isArray(raw) ? raw : (raw?.logs ?? []);
        setPendingVoids(arr.slice(0, 5).map((r: PendingVoid) => ({
          id: Number(r.id || 0),
          invoice: String(r.invoice || ''),
          amount: Number(r.amount || 0),
          reason: String(r.reason || ''),
          created_at: String(r.created_at || ''),
          cashier_name: String(r.cashier_name || r.cashier || '')
        })));
      }
    } catch (e) {
      console.error('SV load error', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [today, branchId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="px-5 md:px-8 py-8 md:py-12 sv-dashboard animate-in fade-in duration-1000">
      <style>{STYLES}</style>
      <div className="flex justify-between items-center mb-12">
        <div className="h-12 w-64 sv-skeleton sv-pulse" />
        <div className="h-10 w-32 sv-skeleton sv-pulse" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-36 sv-skeleton sv-pulse" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 h-[500px] sv-skeleton sv-pulse" />
        <div className="h-[500px] sv-skeleton sv-pulse" />
      </div>
    </div>
  );

  const totalOrders = stats?.total_orders_today ?? 0;
  const totalSales = stats?.total_sales_today ?? 0;
  const voidedSales = stats?.voided_sales_today ?? 0;

  const activeStaffTodayCount = Array.from(new Set([
    ...pendingVoids.map(v => v.cashier_name || v.cashier),
    'Supervisor'
  ])).filter(Boolean).length;

  return (
    <div className="px-5 md:px-8 py-8 md:py-12 sv-dashboard animate-in fade-in duration-700">
      <style>{STYLES}</style>

      {/* ── SUPERVISOR COMMAND HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="px-2 py-0.5 rounded bg-[#a020f0] text-white text-[10px] font-black uppercase tracking-widest">
              Supervisor View
            </div>
            <div className="h-1 w-1 rounded-full bg-slate-300" />
            <p className="sv-label !text-[#a020f0] tracking-widest font-black">Shift Performance Dashboard</p>
          </div>
          <h1 className="text-[2.6rem] font-black text-slate-900 tracking-tight leading-none">
            Operational Overview
          </h1>
          <p className="text-[0.8rem] font-bold text-slate-400 mt-4 flex items-center gap-2">
            <Clock size={16} className="text-[#a020f0]" />
            Terminal Live Sync: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => load(true)}
            className="group flex items-center gap-3 px-6 py-3.5 bg-white border border-slate-200 text-slate-600 hover:text-[#a020f0] hover:border-[#a020f0]/30 rounded-2xl transition-all shadow-xl shadow-[#a020f0]/5 font-black text-xs uppercase tracking-widest"
          >
            <RefreshCw size={14} className={refreshing ? 'sv-spin' : 'group-hover:rotate-180 transition-transform duration-500'} />
            {refreshing ? 'Processing...' : 'Refresh Hub'}
          </button>
        </div>
      </div>

      {/* ── PREMIUM KPI ARCHITECTURE ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        <StatTile label="Today's Revenue" value={fmtS(totalSales)} icon={TrendingUp} color="#a020f0" trend={+12} />
        <StatTile label="Orders Processed" value={totalOrders.toLocaleString()} icon={ShoppingBag} color="#a020f0" trend={-2} />
        <StatTile label="Void Risks Value" value={fmtS(voidedSales)} icon={AlertTriangle} color="#a020f0" />
        <StatTile label="On-Shift Personnel" value={activeStaffTodayCount} icon={Users} color="#a020f0" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

        {/* ── VISUAL ANALYTICS ENGINE ── */}
        <div className="lg:col-span-2 sv-monitoring-card bg-white p-8 relative overflow-hidden shadow-2xl shadow-[#a020f0]/5">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#a020f0]" />

          <div className="flex items-center justify-between mb-12">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Activity size={14} className="text-[#a020f0]" />
                <h3 className="font-black text-slate-800 tracking-tight uppercase text-xs">Real-Time Revenue Distribution</h3>
              </div>
              <p className="sv-label text-[10px]">Fiscal momentum and trading density audit</p>
            </div>
            <div className="flex items-center gap-4 px-4 py-2 bg-[#a020f0]/10 border border-[#a020f0]/20 rounded-xl">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#a020f0] animate-pulse" />
                <span className="text-[10px] font-black text-[#a020f0] uppercase tracking-widest">Active Forecast</span>
              </div>
            </div>
          </div>

          <div className="h-[400px] -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourly} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a020f0" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#a020f0" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#f1f5f9" strokeDasharray="4 4" />
                <XAxis
                  dataKey="hour"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }}
                  dy={15}
                  tickFormatter={(h) => `${h}:00`}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }}
                  tickFormatter={(v) => `₱${v >= 1000 ? (v / 1000).toFixed(1) + 'K' : v}`}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', background: '#1e293b', padding: '16px 20px' }}
                  itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 700, padding: 0 }}
                  labelStyle={{ fontSize: '10px', color: '#c7d2fe', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 900, letterSpacing: '0.1em' }}
                  cursor={{ stroke: '#a020f0', strokeWidth: 1.5, strokeDasharray: '5 5' }}
                  formatter={(v) => [`₱${Number(v).toLocaleString()}`, 'HOURLY SALES']}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#a020f0"
                  strokeWidth={4}
                  fillOpacity={1}
                  fill="url(#colorSales)"
                  dot={{ r: 5, strokeWidth: 2.5, fill: '#fff', stroke: '#a020f0' }}
                  activeDot={{ r: 8, strokeWidth: 3, fill: '#a020f0', stroke: '#fff' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── INTELLIGENT MONITORING STACK ── */}
        <div className="space-y-10">

          <div className="sv-monitoring-card bg-rose-50/20 border-rose-100/50">
            <div className="sv-monitoring-head border-rose-100/30">
              <h3 className="font-black text-rose-600 tracking-tight uppercase text-[10px] flex items-center gap-2">
                <AlertTriangle size={16} strokeWidth={2.5} /> Stock Depletion Audit
              </h3>
            </div>
            <div className="p-6 space-y-3.5">
              {lowStock.length > 0 ? lowStock.map(item => (
                <div key={item.id} className="group flex items-center justify-between p-4 rounded-2xl bg-white border border-rose-100/50 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 rounded-full bg-rose-500" />
                    <span className="text-[0.75rem] font-bold text-slate-800">{item.name}</span>
                  </div>
                  <span className="text-[0.65rem] font-black text-rose-600 px-3 py-1.5 bg-rose-50 rounded-xl border border-rose-100">{item.quantity} UNIT</span>
                </div>
              )) : (
                <div className="py-12 text-center bg-white rounded-2xl border border-dashed border-slate-200 shadow-inner">
                  <CheckCircle2 size={32} className="mx-auto mb-3 text-emerald-400" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inventory Fully Sustained</p>
                </div>
              )}
            </div>
          </div>

          <div className="sv-monitoring-card">
            <div className="sv-monitoring-head">
              <h3 className="font-black text-slate-800 tracking-tight uppercase text-[10px] flex items-center gap-2">
                <Clock size={16} className="text-[#a020f0]" strokeWidth={2.5} /> Void Event Log
              </h3>
            </div>
            <div className="p-6 space-y-5">
              {pendingVoids.length > 0 ? pendingVoids.map(v => (
                <div key={v.id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-[#a020f0]/10 group-hover:text-[#a020f0] transition-colors">
                      <FileText size={18} />
                    </div>
                    <div>
                      <p className="text-[0.85rem] font-black text-slate-900 leading-tight tracking-tight">{v.invoice}</p>
                      <p className="text-[0.65rem] font-bold text-slate-400 uppercase mt-0.5 italic">{v.cashier_name || v.cashier || 'System'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[0.85rem] font-black text-rose-500 tabular-nums">-{fmtS(v.amount)}</p>
                    <p className="text-[0.55rem] font-bold text-slate-300 uppercase mt-0.5">{new Date(v.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              )) : (
                <div className="py-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                  <Clock size={32} className="mx-auto mb-3 text-slate-200" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Zero Recent Voids</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ── COMMAND CENTER ACTIONS ── */}
      <div className="mt-16 pt-10 border-t border-slate-100 flex flex-wrap gap-4 items-center justify-center">
        {[
          { icon: Users, label: "Staff Hub" },
          { icon: Package, label: "Live Ledger" },
          { icon: Search, label: "Deep Search" },
          { icon: FileText, label: "Audit Suite" },
          { icon: BarChart2, label: "Sync Nodes" },
        ].map((act, i) => (
          <button key={i} className="group px-6 py-4 bg-white border border-slate-200 rounded-2xl flex items-center gap-4 hover:border-[#a020f0]/30 hover:shadow-xl hover:shadow-[#a020f0]/5 transition-all active:scale-[0.98]">
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-[#a020f0] group-hover:text-white transition-all duration-300">
              <act.icon size={20} strokeWidth={2.5} />
            </div>
            <span className="text-[0.7rem] font-black text-slate-600 uppercase tracking-widest group-hover:text-[#a020f0] transition-colors">{act.label}</span>
          </button>
        ))}
      </div>

      <div className="mt-20 flex items-center justify-center gap-3 opacity-20 group cursor-default">
        <span className="w-12 h-px bg-slate-400 group-hover:w-20 transition-all duration-500" />
        <p className="text-[0.65rem] font-black tracking-[0.4em] uppercase">Executive Audit Engine V3.0</p>
        <span className="w-12 h-px bg-slate-400 group-hover:w-20 transition-all duration-500" />
      </div>
    </div>
  );
};

export default SV_DashboardPanel;
