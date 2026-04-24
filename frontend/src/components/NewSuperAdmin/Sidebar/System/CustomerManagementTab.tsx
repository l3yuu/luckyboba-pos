import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Search, Users, CreditCard, TrendingUp,
  ChevronLeft, ChevronRight, AlertCircle,
  Eye, XCircle, ShoppingCart, RefreshCw, 
  Gift, Tag, Activity, Layers, Info
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
type ColorKey = "violet" | "emerald" | "red" | "amber" | "blue";
type VariantKey = "primary" | "secondary" | "danger" | "ghost";

interface Customer {
  id: number;
  name: string;
  email: string;
  status: string;
  order_count: number;
  total_spent: number;
  has_card: boolean;
  card_title: string | null;
  created_at: string;
}

interface CustomerDetail {
  id: number;
  name: string;
  email: string;
  status: string;
  created_at: string;
  total_orders: number;
  total_spent: number;
  card: {
    title: string;
    price: number;
    purchase_date: string;
    expiry_date: string;
    status: string;
  } | null;
  recent_orders: {
    id: number;
    invoice_number: string;
    total_amount: number;
    status: string;
    order_type: string;
    created_at: string;
  }[];
}

interface Stats {
  total: number;
  active: number;
  new_this_month: number;
  with_cards: number;
  total_revenue: number;
  avg_order_value: number;
}

interface Meta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

// ── API ───────────────────────────────────────────────────────────────────────
const getToken = () =>
  localStorage.getItem("auth_token") || localStorage.getItem("lucky_boba_token") || "";
const authHeaders = () => ({
  "Content-Type": "application/json",
  "Accept": "application/json",
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

// ── Shared UI Components ──────────────────────────────────────────────────────
const StatCard: React.FC<{
  icon: React.ReactNode; label: string; value: string | number;
  sub?: string; color?: ColorKey;
}> = ({ icon, label, value, sub, color = "violet" }) => {
  const colors = {
    violet: { bg: "bg-violet-50", border: "border-violet-200", icon: "text-violet-600" },
    emerald: { bg: "bg-emerald-50", border: "border-emerald-200", icon: "text-emerald-600" },
    amber: { bg: "bg-amber-50", border: "border-amber-200", icon: "text-amber-600" },
    blue: { bg: "bg-blue-50", border: "border-blue-200", icon: "text-blue-600" },
    red: { bg: "bg-red-50", border: "border-red-200", icon: "text-red-600" },
  };
  const c = colors[color];
  return (
    <div className="bg-white border border-zinc-200 rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm">
      <div className={`w-9 h-9 ${c.bg} border ${c.border} flex items-center justify-center rounded-lg shadow-sm shrink-0`}>
        <span className={c.icon}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 truncate">{label}</p>
        <p className="text-base font-black text-[#1a0f2e] tabular-nums truncate leading-tight">{value}</p>
        {sub && <p className="text-[9px] text-zinc-400 font-bold truncate mt-0.5">{sub}</p>}
      </div>
    </div>
  );
};

const Btn: React.FC<{
  children: React.ReactNode; variant?: VariantKey;
  size?: "sm" | "md"; onClick?: () => void; className?: string; disabled?: boolean;
  type?: "button" | "submit";
}> = ({ children, variant = "primary", size = "sm", onClick, className = "", disabled = false, type = "button" }) => {
  const sizes = { sm: "px-3 py-1.5 text-[10px]", md: "px-4 py-2.5 text-xs" };
  const variants = {
    primary: "bg-[#6a12b8] hover:bg-[#2a1647] text-white shadow-sm",
    secondary: "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300",
    danger: "bg-red-50 text-red-600 border border-red-100 hover:bg-red-600 hover:text-white",
    ghost: "bg-transparent text-zinc-500 hover:bg-zinc-100",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`inline-flex items-center gap-1.5 font-black uppercase tracking-widest rounded-lg transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 ${sizes[size]} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

const ModalShell: React.FC<{
  onClose: () => void; icon: React.ReactNode; title: string; sub: string;
  children: React.ReactNode; footer: React.ReactNode; maxWidth?: string;
}> = ({ onClose, icon, title, sub, children, footer, maxWidth = "max-w-2xl" }) =>
  createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-zinc-900/40 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      <div className={`relative bg-white w-full ${maxWidth} border border-zinc-200 rounded-[1.25rem] shadow-2xl overflow-hidden flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-50 border border-violet-200 rounded-xl flex items-center justify-center shrink-0">{icon}</div>
            <div>
              <p className="text-sm font-black text-[#1a0f2e] uppercase tracking-tight">{title}</p>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{sub}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-100 rounded-full transition-colors text-zinc-400">
            <XCircle size={18} />
          </button>
        </div>
        <div className="px-8 py-8 flex flex-col gap-6 max-h-[80vh] overflow-y-auto sa-scroll bg-white">{children}</div>
        <div className="flex items-center justify-end gap-3 px-8 py-4 border-t border-zinc-100 bg-zinc-50/50 shadow-inner">{footer}</div>
      </div>
    </div>,
    document.body
  );

const Badge: React.FC<{ active: boolean; label?: string; success?: boolean }> = ({ active, label, success = true }) => (
  <div className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.2em] rounded border inline-flex items-center gap-1.5 ${
    active ? (success ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-blue-50 text-blue-600 border-blue-100") : "bg-zinc-50 text-zinc-400 border-zinc-100"
  }`}>
    {active && <span className={`w-1 h-1 rounded-full ${success ? "bg-emerald-500" : "bg-blue-500"} animate-pulse`} />}
    {label || (active ? "Active" : "Inactive")}
  </div>
);

const inputCls = () =>
  `w-full text-xs font-bold text-zinc-700 bg-zinc-50/50 border border-zinc-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white transition-all`;

// ── Shared Utils ──────────────────────────────────────────────────────────────
const initials = (name?: string) =>
  (name ?? "?").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

const fmt = (v: number) =>
  `₱${Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
};

const ORDER_STATUS_STYLE: Record<string, string> = {
  completed: "text-emerald-600 bg-emerald-50 border-emerald-200",
  pending: "text-amber-600 bg-amber-50 border-amber-200",
  cancelled: "text-red-500 bg-red-50 border-red-200",
  preparing: "text-blue-600 bg-blue-50 border-blue-200",
  ready: "text-violet-600 bg-violet-50 border-violet-200",
};
const orderStyle = (s: string) =>
  ORDER_STATUS_STYLE[s?.toLowerCase()] ?? "text-zinc-600 bg-zinc-50 border-zinc-200";

// ── Customer Detail Modal ─────────────────────────────────────────────────────
interface DetailModalProps {
  customerId: number;
  onClose: () => void;
  onStatusToggled: () => void;
}

const CustomerDetailModal: React.FC<DetailModalProps> = ({ customerId, onClose, onStatusToggled }) => {
  const [detail, setDetail] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/customers/${customerId}`, { headers: authHeaders() });
        const data = await res.json();
        if (data.success) setDetail(data.data);
      } catch { /* fail */ } finally { setLoading(false); }
    };
    fetchDetail();
  }, [customerId]);

  const handleToggle = async () => {
    if (!detail) return;
    setToggling(true);
    try {
      const res = await fetch(`/api/customers/${detail.id}/toggle-status`, {
        method: "PATCH", headers: authHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setDetail({ ...detail, status: data.data.status });
        onStatusToggled();
      }
    } catch { /* fail */ }
    finally { setToggling(false); }
  };

  return (
    <ModalShell
      onClose={onClose}
      icon={<Users size={22} className="text-violet-600" />}
      title={detail?.name || "Customer Profile"}
      sub={detail ? `ID #${detail.id} · Joined ${formatDate(detail.created_at)}` : "Loading user details..."}
      footer={
        <>
          <Btn variant="ghost" onClick={onClose} disabled={toggling}>Close</Btn>
          <Btn 
            variant={detail?.status === "ACTIVE" ? "danger" : "primary"} 
            onClick={handleToggle} 
            disabled={toggling || !detail}
            className="min-w-[140px] justify-center"
          >
            {toggling ? <RefreshCw size={14} className="animate-spin" /> : detail?.status === "ACTIVE" ? "Deactivate User" : "Activate User"}
          </Btn>
        </>
      }
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <RefreshCw size={32} className="text-zinc-200 animate-spin" />
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Fetching Profile...</p>
        </div>
      ) : detail ? (
        <>
          {/* Header Info */}
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#7c3aed] to-[#6a12b8] flex items-center justify-center shrink-0 shadow-xl shadow-violet-200/50">
              <span className="text-2xl font-black text-white">{initials(detail.name)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xl font-black text-[#1a0f2e]">{detail.name}</h4>
              <p className="text-sm text-zinc-400 font-bold">{detail.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge active={detail.status === "ACTIVE"} label={detail.status} />
                <div className="w-1 h-1 rounded-full bg-zinc-300" />
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{detail.total_orders} Total Orders</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-4 flex flex-col gap-1">
              <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Lifetime Value</span>
              <span className="text-xl font-black text-[#1a0f2e] tabular-nums">{fmt(detail.total_spent)}</span>
            </div>
            <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-4 flex flex-col gap-1">
              <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Loyalty Status</span>
              {detail.card ? (
                <div className="flex items-center gap-2">
                  <CreditCard size={14} className="text-violet-600" />
                  <span className="text-sm font-black text-violet-600 uppercase truncate">{detail.card.title}</span>
                </div>
              ) : (
                <span className="text-sm font-black text-zinc-300 uppercase">No Active Card</span>
              )}
            </div>
          </div>

          {/* Recent Orders Table inside Modal */}
          <div>
            <h5 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <ShoppingCart size={12} /> Recent Order History
            </h5>
            <div className="max-h-64 overflow-y-auto sa-scroll bg-zinc-50 border border-zinc-100 rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-white border-b border-zinc-100 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-2 text-[8px] font-black text-zinc-400 uppercase tracking-widest">Invoice</th>
                    <th className="px-4 py-2 text-[8px] font-black text-zinc-400 uppercase tracking-widest">Amount</th>
                    <th className="px-4 py-2 text-[8px] font-black text-zinc-400 uppercase tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {detail.recent_orders.map(order => (
                    <tr key={order.id} className="hover:bg-white transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-[10px] font-black text-[#1a0f2e]">{order.invoice_number}</p>
                        <p className="text-[8px] font-bold text-zinc-400">{formatDate(order.created_at)}</p>
                      </td>
                      <td className="px-4 py-3 text-[10px] font-black text-zinc-700">{fmt(order.total_amount)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${orderStyle(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {detail.recent_orders.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-10 text-center text-[10px] font-black text-zinc-300 uppercase tracking-widest italic">No orders recorded</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {detail.card && (
            <div className="p-4 bg-violet-50 border border-violet-100 rounded-2xl flex items-start gap-3">
              <Info className="text-violet-400 shrink-0 mt-0.5" size={14} />
              <div className="min-w-0">
                <p className="text-[10px] font-black text-violet-900 uppercase tracking-widest leading-none mb-1">Card Validity</p>
                <p className="text-[10px] text-violet-700 font-medium">Card is active until <b>{formatDate(detail.card.expiry_date)}</b>. Loyalty benefits are automatically applied to checkout.</p>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <AlertCircle size={32} className="text-red-300 mx-auto mb-3" />
          <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">Critical Error Loading User</p>
        </div>
      )}
    </ModalShell>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const CustomerManagementTab: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatus] = useState("all");
  const [cardFilter, setCard] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  const [selectedId, setSelectedId] = useState<number | null>(null);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchCustomers = useCallback(async (p = 1, s = "", st = "all", c = "all", so = "newest") => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        per_page: "20", page: String(p), sort: so,
      });
      if (s) params.set("search", s);
      if (st !== "all") params.set("status", st);
      if (c !== "all") params.set("card", c);

      const res = await fetch(`/api/customers?${params}`, { headers: authHeaders() });
      const data = await res.json();
      if (!data.success) throw new Error("Failed");
      setCustomers(data.data);
      setMeta(data.meta);
    } catch {
      setError("Failed to synchronize customer database.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/customers/stats", { headers: authHeaders() });
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch { /* silently fail */ }
  }, []);

  useEffect(() => {
    fetchCustomers(1);
    fetchStats();
  }, [fetchCustomers, fetchStats]);

  const handleSearch = (val: string) => {
    setSearch(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setPage(1);
      fetchCustomers(1, val, statusFilter, cardFilter, sort);
    }, 400);
  };

  const handleStatus = (val: string) => {
    setStatus(val); setPage(1);
    fetchCustomers(1, search, val, cardFilter, sort);
  };

  const handleCard = (val: string) => {
    setCard(val); setPage(1);
    fetchCustomers(1, search, statusFilter, val, sort);
  };

  const handleSort = (val: string) => {
    setSort(val); setPage(1);
    fetchCustomers(1, search, statusFilter, cardFilter, val);
  };

  const handlePage = (p: number) => {
    setPage(p);
    fetchCustomers(p, search, statusFilter, cardFilter, sort);
  };

  const refresh = () => {
    fetchCustomers(page, search, statusFilter, cardFilter, sort);
    fetchStats();
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto flex flex-col h-full fade-in sa-scroll">
      
      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl animate-in fade-in slide-in-from-top-4 duration-300">
          <AlertCircle size={18} className="text-red-500 shrink-0" />
          <p className="text-xs font-black text-red-600 uppercase tracking-widest flex-1">{error}</p>
          <Btn variant="secondary" size="sm" onClick={() => setError("")} className="!py-1">Dismiss</Btn>
        </div>
      )}

      {selectedId !== null && (
        <CustomerDetailModal
          customerId={selectedId}
          onClose={() => setSelectedId(null)}
          onStatusToggled={refresh}
        />
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 shrink-0">
        <div>
          <h1 className="text-xl font-black text-[#1a0f2e] uppercase tracking-tight flex items-center gap-3">
            <Users size={22} className="text-violet-600" />
            Customer Management
          </h1>
          <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest mt-1">Audit user behavior, loyalty status & lifetime consumption</p>
        </div>
        <div className="flex items-center gap-2">
          <Btn variant="secondary" onClick={refresh} disabled={loading} size="sm">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Sync Data
          </Btn>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 shrink-0">
        <StatCard icon={<Users size={18} />} label="Total Players" value={stats?.total || 0} color="violet" />
        <StatCard icon={<Activity size={18} />} label="Active Status" value={stats?.active || 0} color="emerald" sub="Participating in ecosystem" />
        <StatCard icon={<Gift size={18} />} label="Card Holders" value={stats?.with_cards || 0} color="amber" sub="Loyalty card owners" />
        <StatCard icon={<TrendingUp size={18} />} label="System Revenue" value={fmt(stats?.total_revenue || 0)} color="blue" sub={`Avg ${fmt(stats?.avg_order_value || 0)}/order`} />
      </div>

      {/* Main Container */}
      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden flex flex-col flex-1 mb-4 min-h-0">
        
        {/* Unified Table Header with Search & Filters */}
        <div className="px-4 py-2.5 border-b border-zinc-100 flex flex-wrap items-center justify-between gap-y-3 gap-x-6 bg-zinc-50/10 shrink-0">
          <div className="flex items-center gap-3">
            <h3 className="text-[11px] font-black text-[#1a0f2e] uppercase tracking-tight flex items-center gap-2 shrink-0">
              <Layers size={14} className="text-violet-600" />
              User Database
            </h3>
            <div className="h-4 w-px bg-zinc-200" />
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
               <select value={statusFilter} onChange={e => handleStatus(e.target.value)}
                className="bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1 text-[9px] font-black uppercase text-zinc-500 outline-none hover:border-violet-300 transition-colors cursor-pointer">
                <option value="all">Status: All</option>
                <option value="active">Active Only</option>
                <option value="inactive">Suspended</option>
              </select>
              <select value={cardFilter} onChange={e => handleCard(e.target.value)}
                className="bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1 text-[9px] font-black uppercase text-zinc-500 outline-none hover:border-violet-300 transition-colors cursor-pointer">
                <option value="all">Cards: All</option>
                <option value="with_card">Subscribers</option>
                <option value="no_card">Free Tier</option>
              </select>
              <select value={sort} onChange={e => handleSort(e.target.value)}
                className="bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1 text-[9px] font-black uppercase text-zinc-500 outline-none hover:border-violet-300 transition-colors cursor-pointer">
                <option value="newest">Sort: Recent</option>
                <option value="top_spender">Sort: Top LTV</option>
                <option value="most_orders">Sort: Loyalty</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-1 justify-end">
            <div className="relative group w-full max-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={13} />
              <input
                type="text" value={search} onChange={e => handleSearch(e.target.value)}
                placeholder="Find customer..."
                className={`${inputCls()} pl-9 h-8 text-[11px] rounded-lg`}
              />
            </div>
          </div>
        </div>

        {/* Dense Table */}
        <div className="overflow-x-auto flex-1 sa-scroll">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-zinc-50/50 border-b border-zinc-100 sticky top-0 z-10 backdrop-blur-md">
                <th className="px-4 py-2 text-[8px] font-black uppercase tracking-widest text-zinc-400">Profile</th>
                <th className="px-4 py-2 text-[8px] font-black uppercase tracking-widest text-zinc-400 text-center">Status</th>
                <th className="px-4 py-2 text-[8px] font-black uppercase tracking-widest text-zinc-400">Tier</th>
                <th className="px-4 py-2 text-[8px] font-black uppercase tracking-widest text-zinc-400 text-center">Orders</th>
                <th className="px-4 py-2 text-[8px] font-black uppercase tracking-widest text-zinc-400 text-right">LTV</th>
                <th className="px-4 py-2 text-[8px] font-black uppercase tracking-widest text-zinc-400 text-right">Joined</th>
                <th className="px-4 py-2 text-[8px] font-black uppercase tracking-widest text-zinc-400 text-right w-12">Tools</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} className="animate-pulse border-b border-zinc-50">
                    <td colSpan={7} className="px-4 py-2"><div className="h-8 bg-zinc-50 rounded-lg w-full" /></td>
                  </tr>
                ))
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-8 py-32 text-center text-zinc-300 font-black uppercase tracking-widest text-[10px]">No matches found in database</td>
                </tr>
              ) : customers.map(c => (
                <tr key={c.id} className="hover:bg-violet-50/20 transition-colors group cursor-pointer" onClick={() => setSelectedId(c.id)}>
                  <td className="px-4 py-1.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white border border-zinc-200 flex items-center justify-center text-[10px] font-black text-[#6a12b8] group-hover:border-violet-300 transition-colors">
                        {initials(c.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-[#1a0f2e] text-[11px] truncate group-hover:text-violet-600 transition-colors">{c.name}</p>
                        <p className="text-[9px] text-zinc-400 font-bold truncate tracking-tight">{c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-1.5 text-center">
                    <Badge active={c.status === "ACTIVE"} label={c.status} />
                  </td>
                  <td className="px-4 py-1.5">
                    {c.has_card ? (
                      <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded border border-violet-100 bg-violet-50 w-fit">
                        <Tag size={10} className="text-violet-500" />
                        <span className="text-[9px] font-black text-violet-600 uppercase tracking-tight truncate max-w-[100px]">{c.card_title}</span>
                      </div>
                    ) : (
                      <span className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">Base</span>
                    )}
                  </td>
                  <td className="px-4 py-1.5 text-center">
                    <span className="text-[11px] font-black text-zinc-700 tabular-nums">{c.order_count}</span>
                  </td>
                  <td className="px-4 py-1.5 text-right font-black text-[#1a0f2e] text-[11px] tabular-nums">
                    {fmt(c.total_spent)}
                  </td>
                  <td className="px-4 py-1.5 text-right text-[10px] text-zinc-400 font-bold uppercase whitespace-nowrap">
                    {formatDate(c.created_at)}
                  </td>
                  <td className="px-4 py-1.5 text-right">
                    <button className="w-7 h-7 bg-white border border-zinc-200 text-zinc-400 hover:text-violet-600 hover:border-violet-200 rounded-md flex items-center justify-center transition-all shadow-sm opacity-0 group-hover:opacity-100 mx-auto">
                      <Eye size={11} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Console */}
        {meta && meta.last_page > 1 && (
          <div className="px-4 py-2 border-t border-zinc-100 flex items-center justify-between bg-zinc-50/30 shrink-0">
            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Page {meta.current_page} / {meta.last_page} · {meta.total} Records</span>
            <div className="flex items-center gap-1">
              <button onClick={() => handlePage(page - 1)} disabled={page === 1}
                className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:bg-white hover:border-zinc-200 border border-transparent rounded-lg disabled:opacity-30 transition-all">
                <ChevronLeft size={13} />
              </button>
              {Array.from({ length: Math.min(5, meta.last_page) }, (_, i) => {
                const p = meta.last_page <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= meta.last_page - 2 ? meta.last_page - 4 + i : page - 2 + i;
                return (
                  <button key={p} onClick={() => handlePage(p)}
                    className={`w-7 h-7 text-[10px] font-black rounded-lg transition-all border ${p === page ? "bg-[#6a12b8] text-white border-[#6a12b8]" : "text-zinc-500 bg-white border-zinc-200 hover:border-violet-300 hover:text-violet-600"}`}>
                    {p}
                  </button>
                );
              })}
              <button onClick={() => handlePage(page + 1)} disabled={page === meta.last_page}
                className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:bg-white hover:border-zinc-200 border border-transparent rounded-lg disabled:opacity-30 transition-all">
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tip Section */}
      <div className="flex items-center gap-2 px-4 py-2 bg-zinc-100 border border-zinc-200 rounded-lg shrink-0">
        <Info size={12} className="text-zinc-400" />
        <p className="text-[9px] text-zinc-500 font-medium">
          <span className="font-black text-zinc-700 uppercase tracking-tighter">Metric Detail:</span> Lifetime Value (LTV) is calculated based on completed orders only. Drag horizontal scrollbar to view all data points.
        </p>
      </div>

    </div>
  );
};

export default CustomerManagementTab;
