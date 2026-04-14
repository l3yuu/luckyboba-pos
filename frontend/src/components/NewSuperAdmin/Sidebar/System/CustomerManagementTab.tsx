// components/NewSuperAdmin/Sidebar/System/CustomerManagementTab.tsx
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search, Users, ShoppingBag, CreditCard, TrendingUp,
  RefreshCw, ChevronLeft, ChevronRight, AlertCircle,
  UserCheck, X, Calendar, Package, Eye,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
type ColorKey   = "violet" | "emerald" | "red" | "amber";
type VariantKey = "primary" | "secondary" | "danger" | "ghost";
type SizeKey    = "sm" | "md" | "lg";

interface Customer {
  id:          number;
  name:        string;
  email:       string;
  status:      string;
  order_count: number;
  total_spent: number;
  has_card:    boolean;
  card_title:  string | null;
  created_at:  string;
}

interface CustomerDetail {
  id:            number;
  name:          string;
  email:         string;
  status:        string;
  created_at:    string;
  total_orders:  number;
  total_spent:   number;
  card: {
    title:         string;
    price:         number;
    purchase_date: string;
    expiry_date:   string;
    status:        string;
  } | null;
  recent_orders: {
    id:             number;
    invoice_number: string;
    total_amount:   number;
    status:         string;
    order_type:     string;
    created_at:     string;
  }[];
}

interface Stats {
  total:           number;
  active:          number;
  new_this_month:  number;
  with_cards:      number;
  total_revenue:   number;
  avg_order_value: number;
}

interface Meta {
  current_page: number;
  last_page:    number;
  per_page:     number;
  total:        number;
}

interface StatCardProps {
  icon: React.ReactNode; label: string; value: string | number;
  sub?: string; color?: ColorKey;
}
interface BtnProps {
  children: React.ReactNode; variant?: VariantKey; size?: SizeKey;
  onClick?: () => void; className?: string; disabled?: boolean;
}

// ── API ───────────────────────────────────────────────────────────────────────
const getToken = () =>
  localStorage.getItem("auth_token") || localStorage.getItem("lucky_boba_token") || "";
const authHeaders = () => ({
  "Content-Type": "application/json",
  "Accept":       "application/json",
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

// ── Shared UI ─────────────────────────────────────────────────────────────────
const StatCard: React.FC<StatCardProps> = ({ icon, label, value, sub, color = "violet" }) => {
  const colors: Record<ColorKey, { bg: string; border: string; icon: string }> = {
    violet:  { bg: "bg-[#f5f0ff]",  border: "border-[#e9d5ff]",  icon: "text-[#3b2063]"  },
    emerald: { bg: "bg-emerald-50", border: "border-emerald-200", icon: "text-emerald-600" },
    red:     { bg: "bg-red-50",     border: "border-red-200",     icon: "text-red-500"     },
    amber:   { bg: "bg-amber-50",   border: "border-amber-200",   icon: "text-amber-600"   },
  };
  const c = colors[color];
  return (
    <div className="bg-white border border-zinc-200 rounded-[0.625rem] px-5 py-4 card shadow-sm overflow-hidden">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 ${c.bg} border ${c.border} flex items-center justify-center rounded-[0.4rem] shrink-0`}>
          <span className={c.icon}>{icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 truncate">{label}</p>
          <p className="text-xl font-bold text-[#1a0f2e] tabular-nums truncate">{value}</p>
          {sub && <p className="text-[10px] text-zinc-400 font-medium truncate mt-0.5">{sub}</p>}
        </div>
      </div>
    </div>
  );
};

const Btn: React.FC<BtnProps> = ({
  children, variant = "primary", size = "sm",
  onClick, className = "", disabled = false,
}) => {
  const sizes:    Record<SizeKey,    string> = { sm: "px-3 py-2 text-xs", md: "px-4 py-2.5 text-sm", lg: "px-6 py-3 text-sm" };
  const variants: Record<VariantKey, string> = {
    primary:   "bg-[#3b2063] hover:bg-[#2a1647] text-white",
    secondary: "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50",
    danger:    "bg-red-600 hover:bg-red-700 text-white",
    ghost:     "bg-transparent text-zinc-500 hover:bg-zinc-100",
  };
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className={`inline-flex items-center gap-1.5 font-bold rounded-lg transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 ${sizes[size]} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`bg-zinc-100 animate-pulse rounded ${className}`} />
);

const initials = (name?: string) =>
  (name ?? "?").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

const fmt = (v: number) =>
  `₱${Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
};

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit", hour12: true });

const ORDER_STATUS_STYLE: Record<string, string> = {
  completed:  "text-emerald-600 bg-emerald-50 border-emerald-200",
  pending:    "text-amber-600 bg-amber-50 border-amber-200",
  cancelled:  "text-red-500 bg-red-50 border-red-200",
  preparing:  "text-blue-600 bg-blue-50 border-blue-200",
  ready:      "text-violet-600 bg-violet-50 border-violet-200",
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
  const [detail, setDetail]     = useState<CustomerDetail | null>(null);
  const [loading, setLoading]   = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res  = await fetch(`/api/customers/${customerId}`, { headers: authHeaders() });
        const data = await res.json();
        if (data.success) setDetail(data.data);
      } catch {
        /* fail silently */
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [customerId]);

  const handleToggle = async () => {
    if (!detail) return;
    setToggling(true);
    try {
      const res  = await fetch(`/api/customers/${detail.id}/toggle-status`, {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl border border-zinc-200 w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#f5f0ff] border border-[#e9d5ff] flex items-center justify-center shrink-0">
              <Users size={18} className="text-[#3b2063]" />
            </div>
            <div>
              <h3 className="text-sm font-black text-[#1a0f2e]">Customer Profile</h3>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">ID #{customerId}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center transition-colors">
            <X size={14} className="text-zinc-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5"
          style={{ scrollbarWidth: "thin", scrollbarColor: "#d4d0e8 transparent" }}>

          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : detail ? (
            <>
              {/* Profile card */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#7c3aed] to-[#3b2063] flex items-center justify-center shrink-0 shadow-lg shadow-violet-200/50">
                  <span className="text-lg font-black text-white">{initials(detail.name)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-base font-black text-[#1a0f2e] truncate">{detail.name}</h4>
                  <p className="text-xs text-zinc-400 font-medium truncate">{detail.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                      detail.status === "ACTIVE"
                        ? "text-emerald-600 bg-emerald-50 border-emerald-200"
                        : "text-zinc-500 bg-zinc-100 border-zinc-200"
                    }`}>
                      {detail.status}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-medium">
                      Joined {formatDate(detail.created_at)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-100">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">Total Orders</p>
                  <p className="text-lg font-black text-[#1a0f2e] tabular-nums">{detail.total_orders}</p>
                </div>
                <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-100">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">Total Spent</p>
                  <p className="text-lg font-black text-[#1a0f2e] tabular-nums">{fmt(detail.total_spent)}</p>
                </div>
              </div>

              {/* Card info */}
              {detail.card && (
                <div className="bg-gradient-to-r from-[#f5f0ff] to-[#ede8ff] rounded-xl p-4 border border-[#e9d5ff]">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard size={14} className="text-[#7c3aed]" />
                    <span className="text-xs font-black text-[#3b2063] uppercase tracking-wider">{detail.card.title}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-zinc-600">
                    <div>
                      <span className="font-bold text-zinc-400">Purchased:</span>{" "}
                      <span className="font-medium">{formatDate(detail.card.purchase_date)}</span>
                    </div>
                    <div>
                      <span className="font-bold text-zinc-400">Expires:</span>{" "}
                      <span className="font-medium">{formatDate(detail.card.expiry_date)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent orders */}
              <div>
                <h5 className="text-xs font-black text-[#1a0f2e] uppercase tracking-wider mb-3">
                  Recent Orders ({detail.recent_orders.length})
                </h5>
                {detail.recent_orders.length === 0 ? (
                  <p className="text-xs text-zinc-400 italic text-center py-6">No orders yet</p>
                ) : (
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1"
                    style={{ scrollbarWidth: "thin", scrollbarColor: "#d4d0e8 transparent" }}>
                    {detail.recent_orders.map(order => (
                      <div key={order.id}
                        className="flex items-center justify-between p-3 bg-zinc-50 hover:bg-white hover:border-[#ede8ff] hover:shadow-md border border-transparent rounded-xl transition-all">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-[#1a0f2e]">{order.invoice_number}</span>
                            <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase border ${orderStyle(order.status)}`}>
                              {order.status}
                            </span>
                          </div>
                          <p className="text-[10px] text-zinc-400 font-medium mt-0.5">
                            {formatDate(order.created_at)} at {formatTime(order.created_at)}
                            {order.order_type && ` · ${order.order_type}`}
                          </p>
                        </div>
                        <span className="text-xs font-black text-[#1a0f2e] shrink-0">{fmt(order.total_amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <p className="text-center text-zinc-400 text-xs py-8">Failed to load customer data.</p>
          )}
        </div>

        {/* Footer */}
        {detail && (
          <div className="shrink-0 px-6 py-4 border-t border-zinc-100 flex items-center justify-between">
            <Btn variant="secondary" onClick={onClose}>Close</Btn>
            <Btn
              variant={detail.status === "ACTIVE" ? "danger" : "primary"}
              onClick={handleToggle}
              disabled={toggling}
            >
              {toggling ? (
                <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : detail.status === "ACTIVE" ? "Deactivate" : "Activate"}
            </Btn>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const CustomerManagementTab: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats]         = useState<Stats | null>(null);
  const [meta, setMeta]           = useState<Meta | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");

  const [search, setSearch]         = useState("");
  const [statusFilter, setStatus]   = useState("all");
  const [cardFilter, setCard]       = useState("all");
  const [sort, setSort]             = useState("newest");
  const [page, setPage]             = useState(1);

  const [selectedId, setSelectedId] = useState<number | null>(null);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchCustomers = useCallback(async (p = 1, s = "", st = "all", c = "all", so = "newest") => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        per_page: "20", page: String(p), sort: so,
      });
      if (s)            params.set("search", s);
      if (st !== "all") params.set("status", st);
      if (c !== "all")  params.set("card",   c);

      const res  = await fetch(`/api/customers?${params}`, { headers: authHeaders() });
      const data = await res.json();
      if (!data.success) throw new Error("Failed");
      setCustomers(data.data);
      setMeta(data.meta);
    } catch {
      setError("Failed to load customers.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res  = await fetch("/api/customers/stats", { headers: authHeaders() });
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
    setStatus(val);
    setPage(1);
    fetchCustomers(1, search, val, cardFilter, sort);
  };

  const handleCard = (val: string) => {
    setCard(val);
    setPage(1);
    fetchCustomers(1, search, statusFilter, val, sort);
  };

  const handleSort = (val: string) => {
    setSort(val);
    setPage(1);
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
    <>
      {/* Detail Modal */}
      {selectedId !== null && (
        <CustomerDetailModal
          customerId={selectedId}
          onClose={() => setSelectedId(null)}
          onStatusToggled={refresh}
        />
      )}

      <div className="p-6 md:p-8 fade-in">

        {/* Header */}
        <div className="flex items-center justify-end mb-5 flex-wrap gap-3">
          <Btn variant="secondary" onClick={refresh} disabled={loading}>
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Refresh
          </Btn>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle size={14} className="text-red-500 shrink-0" />
            <p className="text-xs text-red-600 font-medium">{error}</p>
            <Btn variant="secondary" size="sm" onClick={refresh} className="ml-auto">Retry</Btn>
          </div>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          {!stats ? (
            [...Array(4)].map((_, i) => (
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
              <StatCard icon={<Users size={18} strokeWidth={2.5} />} label="Total Customers"
                value={stats.total.toLocaleString()} sub={`${stats.active} active`} color="violet" />
              <StatCard icon={<UserCheck size={18} strokeWidth={2.5} />} label="New This Month"
                value={stats.new_this_month} sub="Registered recently" color="emerald" />
              <StatCard icon={<CreditCard size={18} strokeWidth={2.5} />} label="Card Holders"
                value={stats.with_cards} sub="Active cards" color="amber" />
              <StatCard icon={<TrendingUp size={18} strokeWidth={2.5} />} label="Customer Revenue"
                value={fmt(stats.total_revenue)} sub={`Avg ${fmt(stats.avg_order_value)} per order`} color="violet" />
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
                value={search}
                onChange={e => handleSearch(e.target.value)}
                className="flex-1 bg-transparent text-sm text-zinc-700 outline-none placeholder:text-zinc-400"
                placeholder="Search by name or email..."
              />
            </div>
            <select value={statusFilter} onChange={e => handleStatus(e.target.value)}
              className="bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-600 outline-none">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <select value={cardFilter} onChange={e => handleCard(e.target.value)}
              className="bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-600 outline-none">
              <option value="all">All Cards</option>
              <option value="with_card">With Card</option>
              <option value="no_card">No Card</option>
            </select>
            <select value={sort} onChange={e => handleSort(e.target.value)}
              className="bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-600 outline-none">
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="most_orders">Most Orders</option>
              <option value="top_spender">Top Spenders</option>
            </select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100">
                  {["Customer", "Status", "Card", "Orders", "Total Spent", "Joined", ""].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-zinc-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Skeleton */}
                {loading && [...Array(8)].map((_, i) => (
                  <tr key={i} className="border-b border-zinc-50">
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-3 bg-zinc-100 rounded animate-pulse" style={{ width: `${50 + Math.random() * 40}%` }} />
                      </td>
                    ))}
                  </tr>
                ))}

                {/* Empty */}
                {!loading && customers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-zinc-400 text-xs font-medium">
                      {search || statusFilter !== "all" || cardFilter !== "all"
                        ? "No customers match your filters."
                        : "No customers registered yet. App users will appear here."}
                    </td>
                  </tr>
                )}

                {/* Rows */}
                {!loading && customers.map(c => (
                  <tr key={c.id} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors cursor-pointer"
                    onClick={() => setSelectedId(c.id)}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#ede8ff] to-[#f5f0ff] border border-[#e9d5ff] flex items-center justify-center text-[10px] font-black text-[#3b2063] shrink-0">
                          {initials(c.name)}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-[#1a0f2e] text-xs block truncate">{c.name}</span>
                          <span className="text-[10px] text-zinc-400 font-medium block truncate">{c.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                        c.status === "ACTIVE"
                          ? "text-emerald-600 bg-emerald-50 border-emerald-200"
                          : "text-zinc-500 bg-zinc-100 border-zinc-200"
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {c.has_card ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-4 bg-[#f5f3ff] rounded flex items-center justify-center border border-[#ede9fe]">
                            <CreditCard size={10} className="text-[#7c3aed]" />
                          </div>
                          <span className="text-[10px] font-bold text-zinc-600 truncate max-w-24">{c.card_title}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-zinc-300 font-medium">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <ShoppingBag size={11} className="text-zinc-300" />
                        <span className="text-xs font-bold text-zinc-600 tabular-nums">{c.order_count}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs font-bold text-[#1a0f2e] tabular-nums">
                      {fmt(c.total_spent)}
                    </td>
                    <td className="px-5 py-3.5 text-[10px] text-zinc-400 font-medium whitespace-nowrap">
                      {formatDate(c.created_at)}
                    </td>
                    <td className="px-5 py-3.5">
                      <button className="w-7 h-7 rounded-lg bg-zinc-50 hover:bg-[#f5f0ff] border border-zinc-200 hover:border-[#e9d5ff] flex items-center justify-center transition-all"
                        onClick={(e) => { e.stopPropagation(); setSelectedId(c.id); }}>
                        <Eye size={12} className="text-zinc-400" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {meta && meta.last_page > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-100">
              <p className="text-xs text-zinc-400">
                Showing {((meta.current_page - 1) * meta.per_page) + 1}–{Math.min(meta.current_page * meta.per_page, meta.total)} of {meta.total.toLocaleString()} customers
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => handlePage(page - 1)} disabled={page === 1}
                  className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:bg-zinc-100 rounded-[0.4rem] disabled:opacity-30 transition-colors">
                  <ChevronLeft size={13} />
                </button>
                {Array.from({ length: Math.min(5, meta.last_page) }, (_, i) => {
                  const p = meta.last_page <= 5 ? i + 1
                    : page <= 3 ? i + 1
                    : page >= meta.last_page - 2 ? meta.last_page - 4 + i
                    : page - 2 + i;
                  return (
                    <button key={p} onClick={() => handlePage(p)}
                      className={`w-7 h-7 text-xs font-bold rounded-[0.4rem] transition-colors ${p === page ? "bg-[#3b2063] text-white" : "text-zinc-400 hover:bg-zinc-100"}`}>
                      {p}
                    </button>
                  );
                })}
                <button onClick={() => handlePage(page + 1)} disabled={page === meta.last_page}
                  className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:bg-zinc-100 rounded-[0.4rem] disabled:opacity-30 transition-colors">
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          )}

          {meta && (
            <div className="px-5 py-2 border-t border-zinc-50">
              <p className="text-[10px] text-zinc-300 font-medium">
                {meta.total.toLocaleString()} total customers · Page {meta.current_page} of {meta.last_page}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CustomerManagementTab;
