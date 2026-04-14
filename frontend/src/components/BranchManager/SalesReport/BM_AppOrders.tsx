"use client"

import { useState, useEffect, useCallback } from 'react';
import {
  ShoppingBag, ChevronDown, ChevronUp,
  Clock, Package, Receipt, Search,
  Activity, RefreshCw,
} from 'lucide-react';

const API_BASE = 'http://localhost:8000/api';
const getToken = () =>
  localStorage.getItem('auth_token') ||
  localStorage.getItem('lucky_boba_token') || '';

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
    @keyframes ao-pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
    .ao-live-dot { width:6px; height:6px; border-radius:50%; background:#22c55e; box-shadow:0 0 5px rgba(34,197,94,0.6); animation:ao-pulse 2s infinite; }
    @keyframes ao-spin { to { transform: rotate(360deg); } }
    .ao-spin { animation: ao-spin 0.7s linear infinite; }
  `}</style>
);

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

type StatusFilter = 'all' | 'pending' | 'preparing' | 'completed' | 'cancelled';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (v: number) =>
  `₱${Number(v).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

const timeStr = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string; border: string }> = {
  pending: { label: 'Pending', bg: '#fef9c3', color: '#92400e', border: '#fde68a' },
  preparing: { label: 'Preparing', bg: '#ede9fe', color: '#3b2063', border: '#ddd6f7' },
  completed: { label: 'Completed', bg: '#dcfce7', color: '#166534', border: '#bbf7d0' },
  cancelled: { label: 'Cancelled', bg: '#fee2e2', color: '#991b1b', border: '#fecaca' },
};

const statusCfg = (s: string) =>
  STATUS_CONFIG[s.toLowerCase()] ?? { label: s, bg: '#f4f4f5', color: '#52525b', border: '#e4e4e7' };

// ─── Shared UI Components ─────────────────────────────────────────────────────
type ColorKey = "violet" | "emerald" | "red" | "amber" | "sky";
type VariantKey = "primary" | "secondary";
type SizeKey = "sm" | "md";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color?: ColorKey;
}

const COLORS: Record<ColorKey, { bg: string; border: string; icon: string }> = {
  violet: { bg: "bg-violet-50", border: "border-violet-200", icon: "text-violet-600" },
  emerald: { bg: "bg-emerald-50", border: "border-emerald-200", icon: "text-emerald-600" },
  red: { bg: "bg-red-50", border: "border-red-200", icon: "text-red-500" },
  amber: { bg: "bg-amber-50", border: "border-amber-200", icon: "text-amber-600" },
  sky: { bg: "bg-sky-50", border: "border-sky-200", icon: "text-sky-600" },
};

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, sub, color = "violet" }) => {
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
    </div>
  );
};

interface BtnProps {
  children: React.ReactNode; variant?: VariantKey; size?: SizeKey;
  onClick?: () => void; className?: string; disabled?: boolean;
}
const Btn: React.FC<BtnProps> = ({ children, variant = "primary", size = "sm", onClick, className = "", disabled = false }) => {
  const sizes: Record<SizeKey, string> = { sm: "px-3 py-2 text-xs", md: "px-4 py-2.5 text-sm" };
  const variants: Record<VariantKey, string> = {
    primary: "bg-[#3b2063] hover:bg-[#2a1647] text-white",
    secondary: "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50",
  };
  return (
    <button onClick={onClick} disabled={disabled}
      className={`inline-flex items-center gap-1.5 font-bold rounded-lg transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 ${sizes[size]} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

// ─── Order Row ────────────────────────────────────────────────────────────────
const OrderRow = ({ order, onStatusChange }: {
  order: AppOrder;
  onStatusChange: (id: number, status: string) => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);
  const cfg = statusCfg(order.status);

  const nextStatus: Record<string, string> = {
    pending: 'preparing',
    preparing: 'completed',
  };

  const handleAdvance = async () => {
    const next = nextStatus[order.status.toLowerCase()];
    if (!next) return;
    setUpdating(true);
    try {
      const res = await fetch(`${API_BASE}/branch/app-orders/${order.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${getToken()}`,
        },
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
    <div className="bg-white border border-zinc-200 rounded-[0.625rem] overflow-hidden card">
      {/* Row header */}
      <div className="flex items-center gap-3 px-6 py-5">

        {/* Invoice + time */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-[#1a0f2e] tracking-tight">
              {order.invoice_number}
            </span>
            <span
              style={{
                fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.14em',
                textTransform: 'uppercase', background: cfg.bg, color: cfg.color,
                border: `1px solid ${cfg.border}`, borderRadius: '100px', padding: '2px 8px',
              }}
            >
              {cfg.label}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-xs text-zinc-500 font-medium flex items-center gap-1">
              <Clock size={12} />
              {timeStr(order.created_at)}
            </span>
            <span className="text-zinc-300">·</span>
            <span className="text-xs text-zinc-500 font-medium">{order.customer_name}</span>
            <span className="text-zinc-300">·</span>
            <span className="text-xs text-zinc-500 font-medium">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Total */}
        <div className="text-right shrink-0 px-4">
          <p className="text-base font-bold text-[#3b2063] tracking-tight">
            {fmt(order.total_amount)}
          </p>
        </div>

        {/* Advance button */}
        {nextStatus[order.status.toLowerCase()] && (
          <Btn
            variant={updating ? "secondary" : "primary"}
            disabled={updating}
            onClick={handleAdvance}
            className="shrink-0"
          >
            {updating
              ? <><div className="ao-spin w-3 h-3 border-2 border-zinc-300 border-t-zinc-500 rounded-full" /> Wait</>
              : order.status.toLowerCase() === 'pending' ? '→ Preparing' : '→ Complete'
            }
          </Btn>
        )}

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-8 h-8 flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 text-zinc-500 rounded-md transition-colors shrink-0 ml-2"
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Expanded items */}
      {expanded && (
        <div className="border-t border-zinc-100 bg-zinc-50/50 px-6 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">Order Items</p>
          <div className="flex flex-col gap-3">
            {order.items.map(item => (
              <div key={item.id} className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#3b2063] mt-2 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-[#1a0f2e]">
                      {item.qty}× {item.name}
                    </p>
                    {item.cup_size && (
                      <p className="text-xs text-zinc-500 mt-0.5">Size: {item.cup_size}</p>
                    )}
                    {item.add_ons && item.add_ons.length > 0 && (
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Add-ons: {item.add_ons.join(', ')}
                      </p>
                    )}
                  </div>
                </div>
                <span className="text-sm font-semibold text-zinc-500 shrink-0">
                  {fmt(item.price)}
                </span>
              </div>
            ))}
          </div>

          {/* Receipt footer */}
          <div className="mt-4 pt-4 border-t border-zinc-200 flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Total</span>
            <span className="text-base font-bold text-[#3b2063]">
              {fmt(order.total_amount)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const BM_AppOrders = () => {
  const [orders, setOrders] = useState<AppOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');

  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/branch/app-orders`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${getToken()}`,
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setOrders(data.data ?? data);
    } catch (e) {
      setError('Could not load orders. Check your connection.');
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const id = setInterval(() => fetchOrders(true), 30_000);
    return () => clearInterval(id);
  }, [fetchOrders]);

  const handleStatusChange = (id: number, newStatus: string) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
  };

  // Filtered orders
  const filtered = orders.filter(o => {
    const matchStatus = statusFilter === 'all' || o.status.toLowerCase() === statusFilter;
    const q = search.toLowerCase();
    const matchSearch = !q
      || o.invoice_number.toLowerCase().includes(q)
      || o.customer_name.toLowerCase().includes(q)
      || o.items.some(i => i.name.toLowerCase().includes(q));
    return matchStatus && matchSearch;
  });

  // Stats
  const todayTotal = orders.reduce((s, o) => s + (o.status !== 'cancelled' ? o.total_amount : 0), 0);
  const pendingCount = orders.filter(o => o.status.toLowerCase() === 'pending').length;
  const doneCount = orders.filter(o => o.status.toLowerCase() === 'completed').length;
  const totalCount = orders.length;

  const STATUS_TABS: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'preparing', label: 'Preparing' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <>
      <GlobalStyles />
      <div className="p-6 md:p-8 flex flex-col gap-6 fade-in">

      <div className="flex flex-col md:flex-row md:items-center gap-6 mb-8">
        <div className="flex-1 flex flex-col md:flex-row items-center gap-3">
          <div className="relative group flex-1 w-full md:w-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-[#3b2063]" size={15} />
            <input
              type="text"
              placeholder="Search orders or items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#ede8ff] focus:border-[#3b2063] transition-all shadow-sm"
            />
          </div>

          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as StatusFilter)}
            className="bg-white border border-zinc-200 rounded-xl px-4 py-3 text-xs font-bold text-zinc-600 outline-none shadow-sm cursor-pointer hover:bg-zinc-50 transition-all shrink-0 w-full md:w-auto">
            {STATUS_TABS.map(tab => (
              <option key={tab.key} value={tab.key}>
                {tab.label} ({tab.key === "all" ? orders.length : orders.filter(o => o.status.toLowerCase() === tab.key).length})
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2 shrink-0 ml-auto w-full md:w-auto">
            <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5">
              <div className="ao-live-dot" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">Live</span>
            </div>
            <Btn variant="secondary" onClick={() => fetchOrders(true)} disabled={refreshing} className="w-full md:w-auto px-5 py-3 rounded-xl shadow-sm">
              <RefreshCw size={14} className={refreshing ? "ao-spin" : ""} /> Refresh
            </Btn>
          </div>
        </div>
      </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Today's Revenue" sub="Completed + active orders"
            value={fmt(todayTotal)}
            icon={<Receipt size={18} strokeWidth={2} />}
            color="violet"
          />
          <StatCard
            label="Total Orders" sub="All statuses today"
            value={String(totalCount)}
            icon={<ShoppingBag size={18} strokeWidth={2} />}
            color="sky"
          />
          <StatCard
            label="Pending" sub="Awaiting preparation"
            value={String(pendingCount)}
            icon={<Clock size={18} strokeWidth={2} />}
            color="amber"
          />
          <StatCard
            label="Completed" sub="Fulfilled today"
            value={String(doneCount)}
            icon={<Package size={18} strokeWidth={2} />}
            color="emerald"
          />
        </div>



        {/* ── Orders List ── */}
        {loading ? (
          <div className="bg-white border border-zinc-200 rounded-[0.625rem] p-12 flex flex-col items-center justify-center gap-3 w-full">
            <Activity size={28} className="text-zinc-300 ao-spin" />
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Loading orders…</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-[0.625rem] p-10 flex flex-col items-center justify-center gap-3">
            <ShoppingBag size={24} className="text-red-500" />
            <p className="text-sm font-semibold text-red-600">{error}</p>
            <Btn onClick={() => fetchOrders()}>Try Again</Btn>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-[0.625rem] p-16 flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center mb-1">
              <ShoppingBag size={24} className="text-zinc-300" />
            </div>
            <p className="text-base font-bold text-[#1a0f2e]">No orders found</p>
            <p className="text-sm text-zinc-400 text-center max-w-sm">
              {search || statusFilter !== 'all' ? 'Try adjusting your filters or search term to find what you are looking for.' : 'No app orders for your branch today. They will appear here when they arrive.'}
            </p>
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
          </div>
        )}
      </div>
    </>
  );
};

export default BM_AppOrders;