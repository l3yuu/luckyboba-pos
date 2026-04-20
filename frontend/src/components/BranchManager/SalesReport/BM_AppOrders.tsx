// components/BranchManager/SalesReport/BM_AppOrders.tsx
"use client"

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ShoppingBag, Clock, ChevronDown, 
  ChefHat, CheckCircle2, Search,
  Activity, RefreshCw, Smartphone,
  User, CreditCard, Receipt, X, Filter
} from 'lucide-react';
import { StatCard, Button as Btn, Badge, AlertBox } from "../SharedUI";

const getToken = () =>
  localStorage.getItem('auth_token') ||
  localStorage.getItem('lucky_boba_token') || '';

const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  ...(getToken() ? { 'Authorization': `Bearer ${getToken()}` } : {}),
});

// ─── Types ────────────────────────────────────────────────────────────────────
interface OrderItem {
  id: number;
  name: string;
  qty: number;
  price: number;
  cup_size: string | null;
  add_ons: string[];
}

interface AppOrder {
  id: number;
  invoice_number: string;
  customer_name: string;
  total_amount: number;
  status: string;
  created_at: string;
  items: OrderItem[];
}

interface Stats {
  pending: number;
  preparing: number;
  completed_today: number;
  total_today: number;
  avg_wait_min: number;
}

type StatusFilter = 'all' | 'pending' | 'preparing' | 'completed' | 'cancelled';

const fmt = (v: number) =>
  `₱${Number(v).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

const timeStr = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });

const getBadgeStatus = (s: string) => {
  const st = s.toLowerCase();
  if (st === 'pending') return 'PENDING';
  if (st === 'preparing') return 'PREPARING';
  if (st === 'completed') return 'ACTIVE'; // Using 'ACTIVE' for emerald look in SharedUI Badge
  if (st === 'cancelled') return 'CANCELLED';
  return s.toUpperCase();
};

// ─── Order Row Component ──────────────────────────────────────────────────────
const OrderRow = ({ order, onStatusChange }: {
  order: AppOrder;
  onStatusChange: (id: number, status: string) => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);

  const nextStatus: Record<string, string> = {
    pending: 'preparing',
    preparing: 'completed',
  };

  const handleAdvance = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = nextStatus[order.status.toLowerCase()];
    if (!next) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/branch/app-orders/${order.id}/status`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ status: next }),
      });
      if (res.ok) onStatusChange(order.id, next);
    } catch (e) {
      console.error('Status update failed', e);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className={`bg-white border border-zinc-200 rounded-[1.25rem] overflow-hidden transition-all duration-300 ${expanded ? 'shadow-xl shadow-purple-900/5 ring-1 ring-purple-500/20' : 'shadow-sm hover:border-[#3b2063]/30'}`}>
      <div className="flex items-center gap-4 px-6 py-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${expanded ? 'bg-[#3b2063] text-white shadow-lg shadow-purple-200' : 'bg-zinc-50 text-zinc-400'}`}>
           <Smartphone size={18} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-xs font-black text-[#1a0f2e] tracking-wide uppercase">
              {order.invoice_number}
            </span>
            <Badge status={getBadgeStatus(order.status)} />
          </div>
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-tight">
               <User size={10} /> {order.customer_name}
            </div>
            <div className="w-[1.5px] h-2.5 bg-zinc-200" />
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-tight">
               <Clock size={10} /> {timeStr(order.created_at)}
            </div>
            <div className="w-[1.5px] h-2.5 bg-zinc-200" />
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">
               {order.items.length} Units
            </div>
          </div>
        </div>

        <div className="text-right px-4 hidden sm:block">
          <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">Yield</p>
          <p className="text-sm font-black text-[#3b2063] tabular-nums tracking-tighter leading-none">
            {fmt(order.total_amount)}
          </p>
        </div>

        {nextStatus[order.status.toLowerCase()] && (
          <Btn
            variant={updating ? "secondary" : "primary"}
            disabled={updating}
            onClick={handleAdvance}
            className="shrink-0 px-4 py-2 rounded-xl text-[10px] uppercase font-black tracking-widest"
          >
            {updating
              ? <RefreshCw size={12} className="animate-spin" />
              : order.status.toLowerCase() === 'pending' ? 'Prep Order' : 'Seal Order'
            }
          </Btn>
        )}

        <button
          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${expanded ? 'bg-zinc-100 text-[#3b2063] rotate-180' : 'bg-zinc-50 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600'}`}
        >
          <ChevronDown size={16} />
        </button>
      </div>

      {expanded && (
        <div className="border-t border-zinc-100 bg-zinc-50/20 px-6 py-5 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between mb-4">
             <h5 className="text-[10px] font-black text-[#1a0f2e] uppercase tracking-widest">Manifest Breakdown</h5>
             <div className="flex items-center gap-1.5 px-2 py-0.5 bg-zinc-100 text-zinc-500 rounded text-[8px] font-black uppercase tracking-widest leading-none">
                <Receipt size={10} /> Detailed Invoice
             </div>
          </div>

          <div className="space-y-2.5">
            {order.items.map(item => (
              <div key={item.id} className="flex items-center justify-between bg-white border border-zinc-100 p-3 rounded-xl shadow-sm">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-lg bg-zinc-50 border border-zinc-100 flex items-center justify-center text-[11px] font-black text-[#3b2063]">
                      {item.qty}×
                   </div>
                   <div>
                      <p className="text-[11px] font-black text-[#1a0f2e] uppercase tracking-tight">{item.name}</p>
                      <div className="flex gap-2 mt-0.5">
                        {item.cup_size && <span className="text-[9px] font-bold text-zinc-400 uppercase bg-zinc-50 px-1.5 py-0.25 rounded border border-zinc-100">Size: {item.cup_size}</span>}
                        {item.add_ons && item.add_ons.length > 0 && <span className="text-[9px] font-bold text-zinc-400 uppercase bg-zinc-50 px-1.5 py-0.25 rounded border border-zinc-100">Ext: {item.add_ons.join(', ')}</span>}
                      </div>
                   </div>
                </div>
                <div className="text-right">
                   <p className="text-[11px] font-black text-[#3b2063] tabular-nums">{fmt(item.price)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-dashed border-zinc-200 flex justify-between items-center">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Gross Settlement</p>
            <p className="text-xl font-black text-[#3b2063] tabular-nums tracking-tighter leading-none">
              {fmt(order.total_amount)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const BM_AppOrders: React.FC = () => {
  const [orders, setOrders] = useState<AppOrder[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchOrders = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    
    try {
      const res = await fetch("/api/online-orders", { headers: authHeaders() });
      if (!res.ok) throw new Error("API Connection Interrupted");
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
      setError("");
    } catch {
      setError("Failed to re-establish secure link with digital manifest stream.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/online-orders/stats", { headers: authHeaders() });
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch { /* fail silently */ }
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchStats();
    pollRef.current = setInterval(() => {
      fetchOrders();
      fetchStats();
    }, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchOrders, fetchStats]);

  const handleStatusChange = (id: number, newStatus: string) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
    fetchStats();
  };

  const filtered = orders.filter(o => {
    if (statusFilter !== 'all' && o.status.toLowerCase() !== statusFilter) return false;
    if (search && !o.invoice_number.toLowerCase().includes(search.toLowerCase()) && !o.customer_name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const STATUS_TABS: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'All Manifests' },
    { key: 'pending', label: 'Pending' },
    { key: 'preparing', label: 'Preparing' },
    { key: 'completed', label: 'Completed' },
  ];

  return (
    <div className="p-6 md:p-8 space-y-6 fade-in pb-20">
      <style>{`.fade-in { animation: fadeIn 0.3s ease-out forwards; } @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }`}</style>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1a0f2e]">Digital Channel</h1>
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mt-1">App-specific order fulfillment & tracking</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 text-[9px] font-black uppercase tracking-widest leading-none">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Stream
          </div>
          <Btn variant="secondary" onClick={() => fetchOrders(true)} disabled={refreshing} className="px-5 py-2.5 rounded-xl shadow-sm">
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} /> <span className="ml-1">Sync Hub</span>
          </Btn>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 p-4 bg-white border border-zinc-200 rounded-2xl shadow-sm">
        <div className="flex bg-zinc-50 border border-zinc-200 rounded-xl p-1 shadow-inner">
          {STATUS_TABS.map(tab => (
            <button key={tab.key} onClick={() => setStatusFilter(tab.key)}
              className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${statusFilter === tab.key ? "bg-white text-[#3b2063] shadow-sm" : "text-zinc-400 hover:text-zinc-600"}`}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative group max-w-sm flex-1 ml-auto">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-[#3b2063] transition-colors" size={14} />
          <input
            type="text"
            placeholder="Search manifests..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-100 rounded-xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-violet-400/5 focus:border-violet-400 focus:bg-white transition-all shadow-inner"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="App Settlement" value={loading ? "—" : fmt(stats?.total_today ?? 0)} sub="Total daily yield" icon={<CreditCard size={18} />} color="violet" />
        <StatCard label="Traffic Volume" value={loading ? "—" : (stats?.total_today ?? 0).toLocaleString()} sub="Digital manifests" icon={<Activity size={18} />} color="sky" />
        <StatCard label="In Processing" value={loading ? "—" : (stats?.pending ?? 0).toLocaleString()} sub="Awaiting sealing" icon={<Clock size={18} />} color="amber" />
        <StatCard label="Vault Handover" value={loading ? "—" : (stats?.completed_today ?? 0).toLocaleString()} sub="Closed tickets" icon={<CheckCircle2 size={18} />} color="emerald" />
      </div>

      {loading ? (
        <div className="space-y-3">
           {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-zinc-50 border border-zinc-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : error ? (
        <AlertBox type="error" message={error} />
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-[1.25rem] p-20 flex flex-col items-center text-center gap-4 shadow-sm">
           <div className="w-20 h-20 rounded-[2rem] bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-200">
              <ShoppingBag size={40} />
           </div>
           <div>
             <h3 className="text-base font-black text-[#1a0f2e] uppercase tracking-wide">Silent Channel</h3>
             <p className="text-[11px] text-zinc-400 font-bold max-w-xs">No active manifests detected for the current filter criteria.</p>
           </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(order => (
            <OrderRow
              key={order.id}
              order={order}
              onStatusChange={handleStatusChange}
            />
          ))}
          <div className="flex items-center justify-center gap-4 pt-6 opacity-30 select-none">
             <div className="h-[1px] bg-zinc-300 flex-1" />
             <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">End of Manifest Stream</div>
             <div className="h-[1px] bg-zinc-300 flex-1" />
          </div>
        </div>
      )}
    </div>
  );
};

export default BM_AppOrders;