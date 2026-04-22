import { useState, useEffect, useCallback, useRef } from "react";
import {
  ShoppingBag, Clock, ChefHat, CheckCircle2,
  Search, TrendingUp, AlertCircle, Eye, X, Filter,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface OrderItem {
  id: number;
  name: string;
  qty: number;
  price: number;
  cup_size: string | null;
  add_ons: string[];
}

interface Order {
  id: number;
  invoice_number: string;
  customer_name: string;
  customer_code: string;
  qr_code: string;
  branch_name: string | null;
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

type StatusFilter = "all" | "pending" | "preparing" | "completed";

// ── API helpers ───────────────────────────────────────────────────────────────
const getToken = () =>
  localStorage.getItem("auth_token") || localStorage.getItem("lucky_boba_token") || "";
const authHeaders = () => ({
  "Content-Type": "application/json",
  Accept: "application/json",
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

// ── UI helpers ────────────────────────────────────────────────────────────────
const fmt = (v: number) =>
  `₱${Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;



const waitMinutes = (iso: string) => Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));

const STATUS_CFG: Record<string, { bg: string; border: string; text: string; badge: string; icon: React.ReactNode }> = {
  pending: {
    bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-600",
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    icon: <Clock size={14} />,
  },
  preparing: {
    bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-600",
    badge: "bg-blue-100 text-blue-700 border-blue-200",
    icon: <ChefHat size={14} />,
  },
  completed: {
    bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-600",
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: <CheckCircle2 size={14} />,
  },
};
const getStatusCfg = (s: string) =>
  STATUS_CFG[s?.toLowerCase()] ?? STATUS_CFG.pending;

// ── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: string | number;
  sub?: string; color: { bg: string; border: string; iconColor: string };
}) => (
  <div className="bg-white border border-zinc-200 rounded-[0.625rem] px-5 py-4 card shadow-sm overflow-hidden">
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 ${color.bg} border ${color.border} flex items-center justify-center rounded-[0.4rem] shrink-0`}>
        <span className={color.iconColor}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 truncate">{label}</p>
        <p className="text-xl font-bold text-[#1a0f2e] tabular-nums truncate">{value}</p>
        {sub && <p className="text-[10px] text-zinc-400 font-medium truncate mt-0.5">{sub}</p>}
      </div>
    </div>
  </div>
);

const Skeleton = ({ className = "" }: { className?: string }) => (
  <div className={`bg-zinc-100 animate-pulse rounded ${className}`} />
);

// ── Order Detail Modal ────────────────────────────────────────────────────────
const OrderDetailModal = ({ order, onClose, onUpdateStatus }: {
  order: Order; onClose: () => void; onUpdateStatus: (id: number, status: string) => void;
}) => {
  const cfg = getStatusCfg(order.status);
  const wait = waitMinutes(order.created_at);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl border border-zinc-200 w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${cfg.bg} border ${cfg.border} flex items-center justify-center shrink-0`}>
              {cfg.icon}
            </div>
            <div>
              <h3 className="text-sm font-black text-[#1a0f2e]">{order.invoice_number}</h3>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{order.customer_name}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center transition-colors cursor-pointer">
            <X size={14} className="text-zinc-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4"
          style={{ scrollbarWidth: "thin", scrollbarColor: "#d4d0e8 transparent" }}>

          {/* Info row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-100">
              <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">Status</p>
              <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${cfg.badge}`}>
                {cfg.icon} {order.status}
              </span>
            </div>
            <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-100">
              <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">Total</p>
              <p className="text-sm font-black text-[#1a0f2e] tabular-nums mt-1">{fmt(order.total_amount)}</p>
            </div>
            <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-100">
              <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">Wait Time</p>
              <p className={`text-sm font-black tabular-nums mt-1 ${wait >= 10 ? "text-red-500" : wait >= 5 ? "text-amber-500" : "text-[#1a0f2e]"}`}>
                {wait}m
              </p>
            </div>
          </div>

          {/* Branch & QR */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400 font-medium">Branch: <span className="text-zinc-600 font-bold">{order.branch_name ?? "—"}</span></span>
            <span className="text-zinc-400 font-medium">QR: <span className="font-mono text-[#a020f0] font-bold">{order.qr_code}</span></span>
          </div>

          {/* Items */}
          <div>
            <h5 className="text-xs font-black text-[#1a0f2e] uppercase tracking-wider mb-3">
              Items ({order.items.length})
            </h5>
            <div className="space-y-2">
              {order.items.map(item => (
                <div key={item.id}
                  className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-transparent hover:border-[#ede8ff] hover:shadow-sm transition-all">
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-[#1a0f2e] block">{item.name}</span>
                    <span className="text-[10px] text-zinc-400 font-medium">
                      x{item.qty}
                      {item.cup_size && ` · ${item.cup_size}`}
                      {item.add_ons.length > 0 && ` · ${item.add_ons.join(", ")}`}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-[#1a0f2e] shrink-0 tabular-nums">{fmt(item.price)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="shrink-0 px-6 py-4 border-t border-zinc-100 flex items-center gap-2">
          {order.status === "pending" && (
            <button onClick={() => onUpdateStatus(order.id, "preparing")}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all active:scale-[0.98] cursor-pointer">
              <ChefHat size={14} /> Start Preparing
            </button>
          )}
          {order.status === "preparing" && (
            <button onClick={() => onUpdateStatus(order.id, "completed")}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all active:scale-[0.98] cursor-pointer">
              <CheckCircle2 size={14} /> Mark Completed
            </button>
          )}
          <button onClick={onClose}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-lg bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 transition-all active:scale-[0.98] cursor-pointer">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const OnlineOrdersTab: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newOrderIds, setNewOrderIds] = useState<Set<number>>(new Set());
  const [updating, setUpdating] = useState<number | null>(null);
  const lastOrderIds = useRef<Set<number>>(new Set());
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const playPing = useCallback(() => {
    try {
      const win = window as unknown as Window & { _audioCtx?: AudioContext; webkitAudioContext?: typeof AudioContext };
      const g = win._audioCtx || new (window.AudioContext || win.webkitAudioContext)();
      win._audioCtx = g;
      const o = g.createOscillator();
      const n = g.createGain();
      o.connect(n);
      n.connect(g.destination);
      o.type = "sine";
      o.frequency.setValueAtTime(880, g.currentTime);
      n.gain.setValueAtTime(0.1, g.currentTime);
      n.gain.exponentialRampToValueAtTime(0.0001, g.currentTime + 0.5);
      o.start();
      o.stop(g.currentTime + 0.5);
    } catch { 
      // fallback to silent audio if context fails
      new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA").play().catch(() => {});
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/online-orders", { headers: authHeaders() });
      const data = await res.json();
      const list: Order[] = Array.isArray(data) ? data : [];
      
      const brandNew = list.filter(o => o.status === "pending" && !lastOrderIds.current.has(o.id));

      if (brandNew.length > 0 && lastOrderIds.current.size > 0) {
        playPing();
        setNewOrderIds(prev => {
          const next = new Set(prev);
          brandNew.forEach(o => next.add(o.id));
          return next;
        });
        setTimeout(() => {
          setNewOrderIds(prev => {
            const next = new Set(prev);
            brandNew.forEach(o => next.delete(o.id));
            return next;
          });
        }, 10000);
      }

      lastOrderIds.current = new Set(list.map(o => o.id));
      setOrders(list);
      setError("");
    } catch { setError("Failed to load orders."); }
    finally { setLoading(false); }
  }, [playPing]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/online-orders/stats", { headers: authHeaders() });
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch { /* silently fail */ }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchOrders();
    fetchStats();

    const startPolling = () => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(() => {
        fetchOrders();
        fetchStats();
      }, 3000); // High-frequency 3s polling
    };

    const stopPolling = () => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        fetchOrders();
        fetchStats();
        startPolling();
      }
    };

    startPolling();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchOrders, fetchStats]);

  const updateStatus = async (id: number, newStatus: string) => {
    setUpdating(id);
    try {
      // We need the branch_name for the API
      const order = orders.find(o => o.id === id);
      const res = await fetch(`/api/online-orders/${id}/status`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({
          status: newStatus,
          branch_name: order?.branch_name ?? "",
        }),
      });
      const data = await res.json();
      if (data.id) {
        setOrders(prev =>
          prev.map(o => o.id === id ? { ...o, status: newStatus } : o)
        );
        if (selectedOrder?.id === id) {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
        }
        fetchStats();
      }
    } catch { /* fail silently */ }
    finally { setUpdating(null); }
  };

  // Filtered + searched
  const filtered = orders.filter(o => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!o.invoice_number.toLowerCase().includes(s) && !o.customer_name.toLowerCase().includes(s)) return false;
    }
    return true;
  });

  const handleSearch = (val: string) => {
    setSearch(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { }, 300);
  };

  const refresh = () => { setLoading(true); fetchOrders(); fetchStats(); };

  return (
    <>
      {/* Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdateStatus={(id, status) => { updateStatus(id, status); }}
        />
      )}

      <div className="p-6 md:p-8 fade-in">

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle size={14} className="text-red-500 shrink-0" />
            <p className="text-xs text-red-600 font-medium">{error}</p>
            <button onClick={refresh}
              className="ml-auto inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 transition-all cursor-pointer">
              Retry
            </button>
          </div>
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
          {!stats ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="bg-white border border-zinc-200 rounded-[0.625rem] px-5 py-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-[0.4rem]" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="w-16 h-2" />
                    <Skeleton className="w-24 h-5" />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <>
              <StatCard icon={<Clock size={18} strokeWidth={2.5} />} label="Pending"
                value={stats.pending}
                sub={stats.pending > 0 ? "Needs attention" : "All clear"}
                color={{ bg: "bg-amber-50", border: "border-amber-200", iconColor: "text-amber-600" }} />
              <StatCard icon={<ChefHat size={18} strokeWidth={2.5} />} label="Preparing"
                value={stats.preparing}
                color={{ bg: "bg-blue-50", border: "border-blue-200", iconColor: "text-blue-600" }} />
              <StatCard icon={<CheckCircle2 size={18} strokeWidth={2.5} />} label="Completed Today"
                value={stats.completed_today}
                color={{ bg: "bg-emerald-50", border: "border-emerald-200", iconColor: "text-emerald-600" }} />
              <StatCard icon={<TrendingUp size={18} strokeWidth={2.5} />} label="Today's Revenue"
                value={fmt(stats.total_today)}
                color={{ bg: "bg-[#f5f0ff]", border: "border-[#e9d5ff]", iconColor: "text-[#a020f0]" }} />
              <StatCard icon={<Clock size={18} strokeWidth={2.5} />} label="Avg Wait Time"
                value={`${stats.avg_wait_min}m`}
                sub={stats.avg_wait_min > 10 ? "Above target" : "On track"}
                color={{ bg: stats.avg_wait_min > 10 ? "bg-red-50" : "bg-emerald-50", border: stats.avg_wait_min > 10 ? "border-red-200" : "border-emerald-200", iconColor: stats.avg_wait_min > 10 ? "text-red-500" : "text-emerald-600" }} />
            </>
          )}
        </div>

        {/* Table card */}
        <div className="bg-white border border-zinc-200 rounded-[0.625rem] overflow-hidden shadow-sm">

          {/* Filters */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-100 flex-wrap">
            <div className="flex-1 min-w-48 flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2">
              <Search size={13} className="text-zinc-400 shrink-0" />
              <input
                value={search} onChange={e => handleSearch(e.target.value)}
                className="flex-1 bg-transparent text-sm text-zinc-700 outline-none placeholder:text-zinc-400"
                placeholder="Search by invoice or customer..."
              />
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              <Filter size={11} />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as StatusFilter)}
              className="bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-600 outline-none">
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="preparing">Preparing</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100">
                  {["Order", "Customer", "Branch", "Items", "Total", "Status", "Wait", ""].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-zinc-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Skeleton */}
                {loading && [...Array(6)].map((_, i) => (
                  <tr key={i} className="border-b border-zinc-50">
                    {[...Array(8)].map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-3 bg-zinc-100 rounded animate-pulse" style={{ width: `${50 + Math.random() * 40}%` }} />
                      </td>
                    ))}
                  </tr>
                ))}

                {/* Empty */}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-16 text-center">
                      <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[#f5f0ff] border border-[#e9d5ff] flex items-center justify-center">
                        <ShoppingBag size={22} className="text-[#a020f0]" />
                      </div>
                      <p className="text-sm font-bold text-[#1a0f2e] mb-1">No Orders</p>
                      <p className="text-xs text-zinc-400 font-medium">
                        {search || statusFilter !== "all"
                          ? "No orders match your filters."
                          : "No online orders yet. Orders from the app will appear here."}
                      </p>
                    </td>
                  </tr>
                )}

                {/* Rows */}
                {!loading && filtered.map(o => {
                  const cfg = getStatusCfg(o.status);
                  const wait = waitMinutes(o.created_at);
                  const isUpdating = updating === o.id;
                  const isNew = newOrderIds.has(o.id);

                  return (
                    <tr key={o.id}
                      className={`border-b border-zinc-50 hover:bg-zinc-50 transition-all cursor-pointer relative ${isNew ? "bg-emerald-50/40" : ""}`}
                      onClick={() => setSelectedOrder(o)}>
                      {isNew && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-emerald-500 rounded-r-full animate-pulse" />
                      )}
                      <td className="px-5 py-3.5">
                        <div className="min-w-0">
                          <span className="font-bold text-[#1a0f2e] text-xs block">{o.invoice_number}</span>
                          <span className="text-[10px] text-zinc-400 font-medium font-mono">{o.qr_code}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-bold text-zinc-700">{o.customer_name}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs text-zinc-500 font-medium">{o.branch_name ?? "—"}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-bold text-zinc-600 tabular-nums">{o.items.length}</span>
                      </td>
                      <td className="px-5 py-3.5 text-xs font-bold text-[#1a0f2e] tabular-nums">
                        {fmt(o.total_amount)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${cfg.badge}`}>
                          {cfg.icon} {o.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-bold tabular-nums ${wait >= 10 ? "text-red-500"
                          : wait >= 5 ? "text-amber-500"
                            : "text-zinc-500"
                          }`}>
                          {o.status === "completed" ? "—" : `${wait}m`}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                          {o.status === "pending" && (
                            <button onClick={() => updateStatus(o.id, "preparing")} disabled={isUpdating}
                              className="px-2.5 py-1.5 text-[10px] font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50">
                              {isUpdating ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Prepare"}
                            </button>
                          )}
                          {o.status === "preparing" && (
                            <button onClick={() => updateStatus(o.id, "completed")} disabled={isUpdating}
                              className="px-2.5 py-1.5 text-[10px] font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50">
                              {isUpdating ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Done"}
                            </button>
                          )}
                          <button onClick={() => setSelectedOrder(o)}
                            className="w-7 h-7 rounded-lg bg-zinc-50 hover:bg-[#f5f0ff] border border-zinc-200 hover:border-[#e9d5ff] flex items-center justify-center transition-all cursor-pointer">
                            <Eye size={12} className="text-zinc-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-5 py-2.5 border-t border-zinc-50 flex items-center justify-between">
            <p className="text-[10px] text-zinc-300 font-medium">
              {filtered.length} orders shown · Live Updates active (3s)
            </p>
            <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[9px] font-bold text-emerald-600/60 uppercase tracking-widest">Live</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OnlineOrdersTab;
