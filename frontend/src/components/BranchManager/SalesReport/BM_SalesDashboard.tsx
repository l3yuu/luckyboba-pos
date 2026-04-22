// components/BranchManager/SalesReport/BM_SalesDashboard.tsx
// Same UI as SuperAdmin SalesReportTab, but locked to the BM's own branch.
import { useState, useEffect, useCallback } from "react";
import {
  Download, RefreshCw, AlertCircle, Search,
  TrendingUp, FileText, DollarSign, Users,
  X, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";

// ── Types ─────────────────────────────────────────────────────────────────────
type ColorKey   = "violet" | "emerald" | "red" | "amber";
type VariantKey = "primary" | "secondary" | "danger" | "ghost";
type SizeKey    = "sm" | "md" | "lg";

interface SummaryTotals {
  grand_total:     number;
  total_orders:    number;
  avg_order_value: number;
  total_customers: number;
}
interface BreakdownRow {
  date:    string;
  revenue: number;
  orders:  number;
}
interface BranchMetric {
  branch_id:       number;
  branch_name:     string;
  total_revenue:   number;
  total_orders:    number;
  avg_order_value: number;
  revenue_rank:    number;
  payment_methods?: PaymentBreakdown[];
}
interface TopProduct {
  product_name:   string;
  total_quantity: number;
  total_revenue:  number;
}
interface PaymentBreakdown {
  branch_id:      number;
  payment_method: string;
  count:          number;
  revenue:        number;
}

// ── API ───────────────────────────────────────────────────────────────────────
const getToken = () =>
  localStorage.getItem("auth_token") || localStorage.getItem("lucky_boba_token") || "";
const authHeaders = () => ({
  "Content-Type": "application/json",
  "Accept":       "application/json",
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

// ── Get current BM's branch_id from localStorage ─────────────────────────────
const getBMBranchId = (): number | null => {
  try {
    // Primary: dedicated key set during login
    const stored = localStorage.getItem("lucky_boba_user_branch_id");
    if (stored && stored !== "" && stored !== "null") {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    // Fallback: auth_user JSON blob (used by some components like BM_DeviceManagement)
    const authUser = JSON.parse(localStorage.getItem("auth_user") ?? "{}");
    if (authUser.branch_id) return Number(authUser.branch_id);
    return null;
  } catch {
    return null;
  }
};

const getBMBranchName = (): string => {
  return localStorage.getItem("lucky_boba_user_branch") ?? "";
};

// ── Shared UI ─────────────────────────────────────────────────────────────────
interface StatCardProps {
  icon: React.ReactNode; label: string; value: string | number;
  sub?: string; trend?: number; color?: ColorKey;
}
interface BtnProps {
  children: React.ReactNode; variant?: VariantKey; size?: SizeKey;
  onClick?: () => void; className?: string; disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, sub, trend, color = "violet" }) => {
  const colors: Record<ColorKey, { bg: string; border: string; icon: string }> = {
    violet:  { bg: "bg-violet-50",  border: "border-violet-200",  icon: "text-violet-600"  },
    emerald: { bg: "bg-emerald-50", border: "border-emerald-200", icon: "text-emerald-600" },
    red:     { bg: "bg-red-50",     border: "border-red-200",     icon: "text-red-500"     },
    amber:   { bg: "bg-amber-50",   border: "border-amber-200",   icon: "text-amber-600"   },
  };
  const c = colors[color];
  return (
    <div className="bg-white border border-zinc-200 rounded-[0.625rem] px-6 py-5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 ${c.bg} border ${c.border} flex items-center justify-center rounded-[0.4rem]`}>
          <span className={c.icon}>{icon}</span>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{label}</p>
          <p className="text-xl font-bold text-[#1a0f2e] tabular-nums">{value}</p>
          {sub && <p className="text-[10px] text-zinc-400 mt-0.5">{sub}</p>}
        </div>
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 text-xs font-bold ${trend >= 0 ? "text-emerald-600" : "text-red-500"}`}>
          {trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {Math.abs(trend)}%
        </div>
      )}
    </div>
  );
};

const Btn: React.FC<BtnProps> = ({
  children, variant = "primary", size = "sm",
  onClick, className = "", disabled = false, type = "button",
}) => {
  const sizes:    Record<SizeKey,    string> = { sm: "px-3 py-2 text-xs", md: "px-4 py-2.5 text-sm", lg: "px-6 py-3 text-sm" };
  const variants: Record<VariantKey, string> = {
    primary:   "bg-[#a020f0] hover:bg-[#2a1647] text-white",
    secondary: "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50",
    danger:    "bg-red-600 hover:bg-red-700 text-white",
    ghost:     "bg-transparent text-zinc-500 hover:bg-zinc-100",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`inline-flex items-center gap-1.5 font-bold rounded-lg transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 ${sizes[size]} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

const SkeletonBar: React.FC<{ h?: string }> = ({ h = "h-4" }) => (
  <div className={`w-full ${h} bg-zinc-100 rounded animate-pulse`} />
);

const PAYMENT_COLORS: Record<string, string> = {
  cash:   "#a020f0",
  gcash:  "#0ea5e9",
  card:   "#10b981",
  maya:   "#f59e0b",
  other:  "#a1a1aa",
};

// ── Main Component ────────────────────────────────────────────────────────────
const BM_SalesDashboard: React.FC = () => {
  // BM's own branch — locked, no selector
  const [bmBranchId] = useState<number | null>(() => getBMBranchId());
  const [bmBranchName, setBmBranchName] = useState<string>(() => getBMBranchName());

  // Period / Date filter
  const today = new Date().toISOString().split("T")[0];
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString().split("T")[0];

  const [mode,       setMode]       = useState<"period" | "range">("period");
  const [period,     setPeriod]     = useState<"daily" | "weekly" | "monthly">("monthly");
  const [dateFrom,   setDateFrom]   = useState(firstOfMonth);
  const [dateTo,     setDateTo]     = useState(today);
  const [search,     setSearch]     = useState("");

  // Data
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [totals,      setTotals]      = useState<SummaryTotals | null>(null);
  const [breakdown,   setBreakdown]   = useState<BreakdownRow[]>([]);

  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [payments,    setPayments]    = useState<PaymentBreakdown[]>([]);
  const [activeTab,   setActiveTab]   = useState<"overview" | "products" | "payments">("overview");

  const fmt  = (v: number) => `₱${Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  const fmtK = (v: number) => `₱${((v ?? 0) / 1000).toFixed(0)}k`;

  // Fetch branch name from /api/user if not in localStorage
  useEffect(() => {
    if (bmBranchName) return;
    fetch("/api/user", { headers: authHeaders() })
      .then(r => r.json())
      .then(d => {
        if (d.branch_name) setBmBranchName(d.branch_name);
        if (d.branch_id && !bmBranchId) {
          // Store for next time
          localStorage.setItem("lucky_boba_user_branch_id", String(d.branch_id));
        }
      })
      .catch(() => {});
  }, [bmBranchName, bmBranchId]);

  const fetchAll = useCallback(async () => {
    if (!bmBranchId) {
      setError("Unable to determine your branch. Please log in again.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const summaryParams = new URLSearchParams();
      const compParams    = new URLSearchParams();

      // The admin-sales-summary endpoint accepts: period (required), branch_id, date (optional anchor)
      // The branch-comparison endpoint accepts: period (required), date (optional anchor)
      summaryParams.set("period", mode === "period" ? period : "daily");
      compParams.set("period",    mode === "period" ? period : "daily");

      if (mode === "range") {
        // Use date_from as the anchor date — the backend will compute the range from period + date
        summaryParams.set("date", dateFrom);
        compParams.set("date",    dateFrom);
      }

      // Always lock to BM's own branch
      summaryParams.set("branch_id", String(bmBranchId));
      compParams.set("branch_id",    String(bmBranchId));

      const [summaryRes, compRes] = await Promise.all([
        fetch(`/api/reports/admin-sales-summary?${summaryParams}`, { headers: authHeaders() }),
        fetch(`/api/reports/branch-comparison?${compParams}`,      { headers: authHeaders() }),
      ]);

      if (!summaryRes.ok || !compRes.ok) {
        throw new Error("API returned error");
      }

      const [summary, comp] = await Promise.all([summaryRes.json(), compRes.json()]);

      setTotals(summary.totals ?? null);
      setBreakdown(summary.breakdown ?? []);
      setTopProducts((summary.top_products ?? []).slice(0, 10));

      // Extract payment breakdown from comparison data
      const allPayments: PaymentBreakdown[] = [];
      (comp.comparison ?? []).forEach((b: BranchMetric) => {
        (b.payment_methods ?? []).forEach((pm: PaymentBreakdown) => {
          allPayments.push(pm);
        });
      });
      setPayments(allPayments);

    } catch {
      setError("Failed to load report data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [mode, period, dateFrom, bmBranchId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Derived
  const chartData      = breakdown.map(r => ({ date: r.date, revenue: Number(r.revenue), orders: Number(r.orders) }));
  const grandTotal     = totals?.grand_total ?? 0;
  const totalOrders    = totals?.total_orders ?? 0;
  const avgOrderValue  = totals?.avg_order_value ?? 0;

  // Payment totals
  const paymentTotals: Record<string, number> = {};
  payments.forEach(p => {
    const method = p.payment_method?.toLowerCase() ?? "other";
    paymentTotals[method] = (paymentTotals[method] ?? 0) + Number(p.revenue);
  });
  const paymentChartData = Object.entries(paymentTotals).map(([method, revenue]) => ({
    method: method.charAt(0).toUpperCase() + method.slice(1),
    revenue,
    color: PAYMENT_COLORS[method] ?? PAYMENT_COLORS.other,
  }));

  // Filtered products
  const filteredProducts = topProducts.filter(p =>
    p.product_name.toLowerCase().includes(search.toLowerCase())
  );

  const handleExport = () => {
    const params = new URLSearchParams();
    if (mode === "period") { params.set("period", period); }
    else { params.set("date_from", dateFrom); params.set("date_to", dateTo); }
    if (bmBranchId) params.set("branch_id", String(bmBranchId));
    window.open(`/api/reports/export-sales?${params}`, "_blank");
  };

  return (
    <div className="p-6 md:p-8 fade-in flex flex-col gap-5">

      {/* ── Header Filters ── */}
      <div className="flex flex-col md:flex-row md:items-center gap-6 mb-2">
        <div className="flex-1 flex flex-col md:flex-row items-center gap-3">
          {/* Mode toggle */}
          <div className="flex rounded-xl overflow-hidden border border-zinc-200 shadow-sm shrink-0">
            {(["period", "range"] as const).map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={`px-4 py-3 text-[10px] font-bold uppercase tracking-wider transition-colors ${mode === m ? "bg-[#a020f0] text-white" : "bg-white text-zinc-500 hover:bg-zinc-50"}`}>
                {m === "period" ? "Period" : "Range"}
              </button>
            ))}
          </div>

          {/* Period selector */}
          {mode === "period" && (
            <div className="flex rounded-xl overflow-hidden border border-zinc-200 shadow-sm shrink-0">
              {(["daily", "weekly", "monthly"] as const).map(p => (
                <button key={p} onClick={() => setPeriod(p)} disabled={loading}
                  className={`px-4 py-3 text-[10px] font-bold uppercase tracking-wider transition-colors disabled:opacity-50 ${period === p ? "bg-[#a020f0] text-white" : "bg-white text-zinc-500 hover:bg-zinc-50"}`}>
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Date range */}
          {mode === "range" && (
            <div className="flex items-center gap-2 shrink-0">
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                className="bg-white border border-zinc-200 rounded-xl px-4 py-3 text-xs font-bold text-zinc-600 outline-none shadow-sm cursor-pointer hover:bg-zinc-50 transition-all" />
              <span className="text-zinc-400 font-bold">-</span>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                className="bg-white border border-zinc-200 rounded-xl px-4 py-3 text-xs font-bold text-zinc-600 outline-none shadow-sm cursor-pointer hover:bg-zinc-50 transition-all" />
            </div>
          )}

          <Btn onClick={fetchAll} disabled={loading} className="px-5 py-3 rounded-xl shadow-sm">
            {loading ? <><RefreshCw size={12} className="animate-spin" /> Loading...</> : "Apply Filters"}
          </Btn>

          {mode === "range" && (
            <button onClick={() => { setMode("period"); setPeriod("monthly"); }}
              className="text-xs font-bold text-zinc-400 hover:text-red-500 flex items-center gap-1 transition-colors">
              <X size={11} /> Clear
            </button>
          )}

          <div className="flex items-center gap-2 shrink-0 ml-auto w-full md:w-auto">
            <Btn variant="secondary" onClick={handleExport} className="w-full md:w-auto px-5 py-3 rounded-xl shadow-sm">
              <Download size={14} /> Export
            </Btn>
          </div>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle size={14} className="text-red-500 shrink-0" />
          <p className="text-xs text-red-600 font-medium">{error}</p>
          <Btn variant="secondary" size="sm" onClick={fetchAll} className="ml-auto">Retry</Btn>
        </div>
      )}

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={<span className="font-black text-base">₱</span>} label="Gross Revenue"
          value={loading ? "—" : fmt(grandTotal)} color="violet" />
        <StatCard icon={<FileText size={16} />} label="Total Orders"
          value={loading ? "—" : totalOrders.toLocaleString()} color="emerald" />
        <StatCard icon={<TrendingUp size={16} />} label="Avg Order Value"
          value={loading ? "—" : fmt(avgOrderValue)} color="amber" />
        <StatCard icon={<Users size={16} />} label="Total Customers"
          value={loading ? "—" : (totals?.total_customers ?? 0).toLocaleString()} color="red" />
      </div>

      {/* ── Sub-tabs (no "branches" tab since BM sees only their branch) ── */}
      <div className="flex gap-2 border-b border-zinc-100 pb-0">
        {([
          { id: "overview",  label: "Revenue Trend"     },
          { id: "products",  label: "Top Products"      },
          { id: "payments",  label: "Payment Methods"   },
        ] as const).map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors -mb-px ${
              activeTab === tab.id
                ? "border-[#a020f0] text-[#a020f0]"
                : "border-transparent text-zinc-400 hover:text-zinc-600"
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB: Revenue Trend ── */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-12 gap-4">
          {/* Area chart */}
          <div className="col-span-12 lg:col-span-8 bg-white border border-zinc-200 rounded-[0.625rem] p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Revenue Over Time</p>
                <p className="text-sm font-bold text-[#1a0f2e] mt-0.5 capitalize">
                  {mode === "period" ? `${period} view` : `${dateFrom} → ${dateTo}`}
                </p>
              </div>
              <DollarSign size={16} className="text-zinc-300" />
            </div>
            {loading ? <SkeletonBar h="h-[240px]" /> : chartData.length === 0 ? (
              <div className="h-60 flex items-center justify-center text-zinc-400 text-xs font-medium">No data for this period.</div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="bmRevGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#a020f0" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#a020f0" stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0eef8" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fontWeight: 600, fill: "#a1a1aa" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fontWeight: 600, fill: "#a1a1aa" }} axisLine={false} tickLine={false} tickFormatter={fmtK} />
                  <Tooltip formatter={(v) => [`₱${Number(v ?? 0).toLocaleString()}`, "Revenue"] as [string, string]}
                    contentStyle={{ borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 12 }} />
                  <Area type="monotone" dataKey="revenue" stroke="#a020f0" strokeWidth={2.5} fill="url(#bmRevGrad)" name="Revenue" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Orders bar chart */}
          <div className="col-span-12 lg:col-span-4 bg-white border border-zinc-200 rounded-[0.625rem] p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1">Orders Volume</p>
            <p className="text-sm font-bold text-[#1a0f2e] mb-4">Transaction Count</p>
            {loading ? <SkeletonBar h="h-[240px]" /> : chartData.length === 0 ? (
              <div className="h-60 flex items-center justify-center text-zinc-400 text-xs">No data.</div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartData} barSize={12}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0eef8" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fontWeight: 600, fill: "#a1a1aa" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fontWeight: 600, fill: "#a1a1aa" }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v) => [v, "Orders"] as [number, string]}
                    contentStyle={{ borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 12 }} />
                  <Bar dataKey="orders" fill="#ede8ff" radius={[4, 4, 0, 0]} name="Orders" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Summary table */}
          <div className="col-span-12 bg-white border border-zinc-200 rounded-[0.625rem] overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100">
              <p className="text-sm font-bold text-[#1a0f2e]">Daily Breakdown</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-100">
                    {["Date", "Orders", "Revenue", "Avg Order Value"].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-zinc-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading && [...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b border-zinc-50">
                      {[...Array(4)].map((_, j) => (
                        <td key={j} className="px-5 py-3.5"><div className="h-3 bg-zinc-100 rounded animate-pulse w-24" /></td>
                      ))}
                    </tr>
                  ))}
                  {!loading && breakdown.length === 0 && (
                    <tr><td colSpan={4} className="px-5 py-10 text-center text-zinc-400 text-xs">No data for this period.</td></tr>
                  )}
                  {!loading && breakdown.map((row, i) => (
                    <tr key={i} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-zinc-700">{row.date}</td>
                      <td className="px-5 py-3.5 text-zinc-600">{Number(row.orders).toLocaleString()}</td>
                      <td className="px-5 py-3.5 font-bold text-[#a020f0]">{fmt(Number(row.revenue))}</td>
                      <td className="px-5 py-3.5 text-zinc-600">
                        {row.orders > 0 ? fmt(Number(row.revenue) / Number(row.orders)) : "—"}
                      </td>
                    </tr>
                  ))}
                  {!loading && breakdown.length > 0 && (
                    <tr className="bg-zinc-50 border-t border-zinc-200">
                      <td className="px-5 py-3.5 font-black text-[#1a0f2e] text-xs uppercase tracking-widest">Total</td>
                      <td className="px-5 py-3.5 font-black text-[#1a0f2e]">{totalOrders.toLocaleString()}</td>
                      <td className="px-5 py-3.5 font-black text-[#a020f0]">{fmt(grandTotal)}</td>
                      <td className="px-5 py-3.5 font-bold text-zinc-600">{fmt(avgOrderValue)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: Top Products ── */}
      {activeTab === "products" && (
        <div className="bg-white border border-zinc-200 rounded-[0.625rem] overflow-hidden">
          <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-zinc-100">
            <div className="relative group flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-[#a020f0]" size={15} />
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#ede8ff] focus:border-[#a020f0] transition-all shadow-sm"
              />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 shrink-0">
              {filteredProducts.length} items
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100">
                  {["#", "Product", "Qty Sold", "Revenue", "Contribution"].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-zinc-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && [...Array(8)].map((_, i) => (
                  <tr key={i} className="border-b border-zinc-50">
                    {[...Array(5)].map((_, j) => (
                      <td key={j} className="px-5 py-4"><div className="h-3 bg-zinc-100 rounded animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} /></td>
                    ))}
                  </tr>
                ))}
                {!loading && filteredProducts.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-10 text-center text-zinc-400 text-xs">
                    {search ? "No products match your search." : "No product data for this period."}
                  </td></tr>
                )}
                {!loading && filteredProducts.map((p, i) => {
                  const maxQty = topProducts[0]?.total_quantity ?? 1;
                  const pct    = Math.round((p.total_quantity / maxQty) * 100);
                  const totalRev = topProducts.reduce((s, x) => s + Number(x.total_revenue), 0);
                  const revShare = totalRev > 0 ? Math.round((Number(p.total_revenue) / totalRev) * 100) : 0;
                  return (
                    <tr key={i} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="w-5 h-5 rounded-md bg-violet-50 border border-violet-200 flex items-center justify-center shrink-0">
                          <span className="text-[9px] font-black text-violet-600">{i + 1}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-[#1a0f2e]">{p.product_name}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-[#a020f0]" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-zinc-600 font-medium">{p.total_quantity.toLocaleString()}x</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-bold text-emerald-600">{fmt(Number(p.total_revenue))}</td>
                      <td className="px-5 py-3.5 text-xs font-bold text-zinc-500">{revShare}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB: Payment Methods ── */}
      {activeTab === "payments" && (
        <div className="grid grid-cols-12 gap-4">
          {/* Bar chart */}
          <div className="col-span-12 lg:col-span-7 bg-white border border-zinc-200 rounded-[0.625rem] p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1">Payment Distribution</p>
            <p className="text-sm font-bold text-[#1a0f2e] mb-4">Revenue by Payment Method</p>
            {loading ? <SkeletonBar h="h-[200px]" /> : paymentChartData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-zinc-400 text-xs">No payment data for this period.</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={paymentChartData} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0eef8" vertical={false} />
                  <XAxis dataKey="method" tick={{ fontSize: 11, fontWeight: 600, fill: "#a1a1aa" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fontWeight: 600, fill: "#a1a1aa" }} axisLine={false} tickLine={false} tickFormatter={fmtK} />
                  <Tooltip formatter={(v) => [`₱${Number(v ?? 0).toLocaleString()}`, "Revenue"] as [string, string]}
                    contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                  {paymentChartData.map((entry, i) => (
                    <Bar key={i} dataKey="revenue" fill={entry.color} radius={[4, 4, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Payment summary cards */}
          <div className="col-span-12 lg:col-span-5 flex flex-col gap-3">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Summary</p>
            {loading ? (
              [...Array(4)].map((_, i) => <SkeletonBar key={i} h="h-16" />)
            ) : paymentChartData.length === 0 ? (
              <div className="text-zinc-400 text-xs text-center py-8">No data.</div>
            ) : (
              paymentChartData.map((pm, i) => {
                const totalPay = paymentChartData.reduce((s, x) => s + x.revenue, 0);
                const share    = totalPay > 0 ? Math.round((pm.revenue / totalPay) * 100) : 0;
                return (
                  <div key={i} className="bg-white border border-zinc-200 rounded-[0.625rem] px-4 py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ background: pm.color }} />
                      <div>
                        <p className="text-xs font-bold text-[#1a0f2e]">{pm.method}</p>
                        <p className="text-[10px] text-zinc-400">{share}% of total</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-[#1a0f2e] tabular-nums">{fmt(pm.revenue)}</p>
                      <div className="w-20 h-1.5 bg-zinc-100 rounded-full overflow-hidden mt-1 ml-auto">
                        <div className="h-full rounded-full" style={{ width: `${share}%`, background: pm.color }} />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            {!loading && paymentChartData.length > 0 && (
              <div className="bg-zinc-50 border border-zinc-200 rounded-[0.625rem] px-4 py-3.5 flex items-center justify-between">
                <p className="text-xs font-black text-[#1a0f2e] uppercase tracking-widest">Total</p>
                <p className="text-sm font-black text-[#a020f0]">
                  {fmt(paymentChartData.reduce((s, x) => s + x.revenue, 0))}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BM_SalesDashboard;
