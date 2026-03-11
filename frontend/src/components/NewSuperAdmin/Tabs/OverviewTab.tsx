import { useState, useEffect, useCallback } from "react";
import {
  DollarSign, Store, UserCheck, AlertTriangle,
  Download, XCircle, ArrowUpRight, ArrowDownRight,
  FileText, Package, RefreshCw,
} from "lucide-react";
import {
  AreaChart, Area, BarChart as ReBarChart, Bar,
  PieChart as RePieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

type ColorKey   = "violet" | "emerald" | "red" | "amber";
type VariantKey = "primary" | "secondary" | "danger" | "ghost";
type SizeKey    = "sm" | "md" | "lg";

interface StatCardProps {
  icon: React.ReactNode; label: string; value: string | number;
  sub?: string; trend?: number; color?: ColorKey;
}
interface SectionHeaderProps { title: string; desc?: string; action?: React.ReactNode; }
interface BtnProps {
  children: React.ReactNode; variant?: VariantKey; size?: SizeKey;
  onClick?: () => void; className?: string; disabled?: boolean;
  type?: "button" | "submit" | "reset";
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
const StatCard: React.FC<StatCardProps> = ({ icon, label, value, sub, trend, color = "violet" }) => {
  const colors: Record<ColorKey, { bg: string; border: string; icon: string }> = {
    violet:  { bg: "bg-violet-50",  border: "border-violet-200",  icon: "text-violet-600"  },
    emerald: { bg: "bg-emerald-50", border: "border-emerald-200", icon: "text-emerald-600" },
    red:     { bg: "bg-red-50",     border: "border-red-200",     icon: "text-red-500"     },
    amber:   { bg: "bg-amber-50",   border: "border-amber-200",   icon: "text-amber-600"   },
  };
  const c = colors[color];
  return (
    <div className="bg-white border border-zinc-200 rounded-[0.625rem] px-6 py-5 flex items-center justify-between card">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 ${c.bg} border ${c.border} flex items-center justify-center rounded-[0.4rem]`}>
          <span className={c.icon}>{icon}</span>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{label}</p>
          <p className="text-xl font-bold text-[#1a0f2e] tabular-nums">{value}</p>
        </div>
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 text-xs font-bold ${trend >= 0 ? "text-emerald-600" : "text-red-500"}`}>
          {trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {Math.abs(trend)}%
        </div>
      )}
      {sub && <p className="text-xs text-zinc-400 font-medium">{sub}</p>}
    </div>
  );
};

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, desc, action }) => (
  <div className="flex items-center justify-between mb-5">
    <div>
      <h2 className="text-base font-bold text-[#1a0f2e]">{title}</h2>
      {desc && <p className="text-xs text-zinc-400 mt-0.5">{desc}</p>}
    </div>
    {action}
  </div>
);

const Btn: React.FC<BtnProps> = ({
  children, variant = "primary", size = "sm",
  onClick, className = "", disabled = false, type = "button",
}) => {
  const sizes:    Record<SizeKey,    string> = { sm: "px-3 py-2 text-xs", md: "px-4 py-2.5 text-sm", lg: "px-6 py-3 text-sm" };
  const variants: Record<VariantKey, string> = {
    primary:   "bg-[#3b2063] hover:bg-[#2a1647] text-white",
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

// Skeleton bar
const SkeletonBar: React.FC<{ w?: string; h?: string }> = ({ w = "w-full", h = "h-4" }) => (
  <div className={`${w} ${h} bg-zinc-100 rounded animate-pulse`} />
);

// ── Types ─────────────────────────────────────────────────────────────────────
interface SummaryTotals {
  grand_total:      number;
  total_orders:     number;
  avg_order_value:  number;
  total_customers:  number;
}
interface BranchMetric {
  branch_id:    number;
  branch_name:  string;
  location:     string;
  total_revenue: number;
  total_orders:  number;
  revenue_rank:  number;
}
interface BreakdownRow {
  date:            string;
  revenue:         number;
  orders:          number;
  avg_order_value: number;
}
interface TopProduct {
  product_name:  string;
  total_quantity: number;
  total_revenue:  number;
}
interface UserStats {
  active:   number;
  total:    number;
}
interface BranchStats {
  active:   number;
  total:    number;
}

// ── Main Tab ──────────────────────────────────────────────────────────────────
const OverviewTab: React.FC = () => {
  const [period,       setPeriod]       = useState<"daily" | "weekly" | "monthly">("monthly");
  const [loading,      setLoading]      = useState(true);
  const [totals,       setTotals]       = useState<SummaryTotals | null>(null);
  const [breakdown,    setBreakdown]    = useState<BreakdownRow[]>([]);
  const [branchPerf,   setBranchPerf]   = useState<BranchMetric[]>([]);
  const [topProducts,  setTopProducts]  = useState<TopProduct[]>([]);
  const [userStats,    setUserStats]    = useState<UserStats>({ active: 0, total: 0 });
  const [branchStats,  setBranchStats]  = useState<BranchStats>({ active: 0, total: 0 });

  const fmt   = (v: number) => `₱${Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  const fmtK  = (v: number) => `₱${((v ?? 0) / 1000).toFixed(0)}k`;

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryRes, comparisonRes, usersRes, branchesRes] = await Promise.all([
        fetch(`/api/reports/sales-summary?period=${period}`,     { headers: authHeaders() }),
        fetch(`/api/reports/branch-comparison?period=${period}`, { headers: authHeaders() }),
        fetch(`/api/users/stats`,                                { headers: authHeaders() }),
        fetch(`/api/branches`,                                   { headers: authHeaders() }),
      ]);

      const [summary, comparison, users, branches] = await Promise.all([
        summaryRes.json(),
        comparisonRes.json(),
        usersRes.json(),
        branchesRes.json(),
      ]);

      if (summary.totals)        setTotals(summary.totals);
      if (summary.breakdown)     setBreakdown(summary.breakdown);
      if (summary.top_products)  setTopProducts(summary.top_products.slice(0, 5));
      if (comparison.comparison) setBranchPerf(comparison.comparison);

      if (users.success && users.data) {
        setUserStats({ active: users.data.active, total: users.data.total });
      }
      if (branches.success && branches.data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const list = branches.data as any[];
        setBranchStats({
          total:  list.length,
          active: list.filter((b: { status: string }) => b.status === "active").length,
        });
      }
    } catch (e) {
      console.error("OverviewTab fetch error", e);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Chart data derived from API ───────────────────────────────────────────
  const revenueChartData = breakdown.map(r => ({
    month:    r.date,
    revenue:  r.revenue,
    expenses: 0,
  }));

  const PIE_COLORS = ["#3b2063", "#6d3fa8", "#9b6bd4", "#c4a8e8", "#ddd0f8"];
  const totalRev   = branchPerf.reduce((s, b) => s + Number(b.total_revenue), 0);
  const pieData    = branchPerf.slice(0, 5).map((b, i) => ({
    name:  b.branch_name,
    value: totalRev > 0 ? Math.round((Number(b.total_revenue) / totalRev) * 100) : 0,
    color: PIE_COLORS[i] ?? "#c4a8e8",
  }));

  const barData = branchPerf.slice(0, 5).map(b => ({
    name:  b.branch_name.replace("Lucky Boba – ", "").replace("Lucky Boba - ", ""),
    sales: Number(b.total_revenue),
  }));

  return (
    <div className="p-6 md:p-8 flex flex-col gap-6 fade-in">

      {/* Period selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-[#1a0f2e]">Overview</h2>
          <p className="text-xs text-zinc-400 mt-0.5">Real-time summary across all branches</p>
        </div>
        <div className="flex items-center gap-2">
          {(["daily", "weekly", "monthly"] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)} disabled={loading}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all capitalize disabled:opacity-50 ${period === p ? "bg-[#3b2063] text-white" : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"}`}>
              {p}
            </button>
          ))}
          <Btn variant="secondary" onClick={fetchAll} disabled={loading}>
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          </Btn>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={<DollarSign size={18} strokeWidth={2} />}
          label="Total Revenue"
          value={loading ? "—" : fmt(totals?.grand_total ?? 0)}
          color="violet"
        />
        <StatCard
          icon={<Store size={18} strokeWidth={2} />}
          label="Active Branches"
          value={loading ? "—" : `${branchStats.active} / ${branchStats.total}`}
          color="emerald"
        />
        <StatCard
          icon={<UserCheck size={18} strokeWidth={2} />}
          label="Active Users"
          value={loading ? "—" : userStats.active}
          color="amber"
        />
        <StatCard
          icon={<AlertTriangle size={18} strokeWidth={2} />}
          label="Total Orders"
          value={loading ? "—" : (totals?.total_orders ?? 0).toLocaleString()}
          color="red"
        />
      </div>

      {/* Revenue chart + Pie */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-8 bg-white border border-zinc-200 rounded-[0.625rem] p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Revenue Trend</p>
              <p className="text-xl font-bold text-[#1a0f2e] mt-0.5 capitalize">{period} Overview</p>
            </div>
            <Btn variant="secondary" onClick={() => {}}><Download size={13} /> Export</Btn>
          </div>
          {loading ? (
            <div className="flex flex-col gap-3 mt-2">
              <SkeletonBar h="h-[220px]" />
            </div>
          ) : revenueChartData.length === 0 ? (
            <div className="h-55 flex items-center justify-center text-zinc-400 text-xs font-medium">
              No data for this period.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenueChartData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b2063" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3b2063" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0eef8" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fontWeight: 600, fill: "#a1a1aa" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fontWeight: 600, fill: "#a1a1aa" }} axisLine={false} tickLine={false} tickFormatter={fmtK} />
                {/* ✅ Fix: cast value to number */}
                <Tooltip
                  formatter={(v) => [`₱${Number(v ?? 0).toLocaleString()}`, ""] as [string, string]}
                  contentStyle={{ borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 12 }}
                />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#3b2063" strokeWidth={2.5} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="col-span-12 lg:col-span-4 bg-white border border-zinc-200 rounded-[0.625rem] p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1">Revenue Share</p>
          <p className="text-xl font-bold text-[#1a0f2e] mb-4">By Branch</p>
          {loading ? (
            <div className="flex flex-col gap-3"><SkeletonBar h="h-[160px]" /></div>
          ) : pieData.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-zinc-400 text-xs">No data.</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <RePieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                    {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  {/* ✅ Fix: cast value to number */}
                  <Tooltip formatter={(v) => [`${Number(v ?? 0)}%`, ""] as [string, string]} />
                </RePieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2 mt-2">
                {pieData.map((d, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                      <span className="text-xs font-medium text-zinc-600">{d.name}</span>
                    </div>
                    <span className="text-xs font-bold text-[#1a0f2e]">{d.value}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Branch bar + Top products */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-7 bg-white border border-zinc-200 rounded-[0.625rem] p-6">
          <SectionHeader title="Branch Performance" desc={`${period} revenue comparison`} />
          {loading ? (
            <SkeletonBar h="h-[180px]" />
          ) : barData.length === 0 ? (
            <div className="h-45 flex items-center justify-center text-zinc-400 text-xs">No data.</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <ReBarChart data={barData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0eef8" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 600, fill: "#a1a1aa" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fontWeight: 600, fill: "#a1a1aa" }} axisLine={false} tickLine={false} tickFormatter={fmtK} />
                {/* ✅ Fix: cast value to number */}
                <Tooltip
                  formatter={(v) => [`₱${Number(v ?? 0).toLocaleString()}`, "Revenue"] as [string, string]}
                  contentStyle={{ borderRadius: 10, fontSize: 12 }}
                />
                <Bar dataKey="sales" fill="#3b2063" radius={[4, 4, 0, 0]} />
              </ReBarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="col-span-12 lg:col-span-5 bg-white border border-zinc-200 rounded-[0.625rem] p-6">
          <SectionHeader title="Top Products" desc={`Best sellers this ${period}`} />
          {loading ? (
            <div className="flex flex-col gap-3">
              {[...Array(4)].map((_, i) => <SkeletonBar key={i} h="h-8" />)}
            </div>
          ) : topProducts.length === 0 ? (
            <div className="flex flex-col gap-3">
              {[
                { icon: <Package  size={14} />, msg: "IT Park: Taro stock below reorder level", type: "warn",   time: "10m ago"   },
                { icon: <XCircle  size={14} />, msg: "3 failed login attempts – Mark Santos",   type: "danger",  time: "32m ago"   },
                { icon: <FileText size={14} />, msg: "Z-Reading not submitted – Robinsons",     type: "warn",    time: "Yesterday" },
              ].map((a, i) => (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${a.type === "danger" ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"}`}>
                  <span className={`mt-0.5 ${a.type === "danger" ? "text-red-500" : "text-amber-600"}`}>{a.icon}</span>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-zinc-700">{a.msg}</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {topProducts.map((p, i) => {
                const pct = topProducts[0].total_quantity > 0
                  ? Math.round((p.total_quantity / topProducts[0].total_quantity) * 100)
                  : 0;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-md bg-violet-50 border border-violet-200 flex items-center justify-center shrink-0">
                      <span className="text-[9px] font-black text-violet-600">{i + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-semibold text-zinc-700 truncate">{p.product_name}</span>
                        <span className="text-[10px] font-bold text-zinc-500 ml-2 shrink-0">{p.total_quantity}x</span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#3b2063] rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 shrink-0">{fmt(p.total_revenue)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Avg Order Value",  value: loading ? "—" : fmt(totals?.avg_order_value  ?? 0) },
          { label: "Total Customers",  value: loading ? "—" : (totals?.total_customers ?? 0).toLocaleString() },
          { label: "Total Orders",     value: loading ? "—" : (totals?.total_orders    ?? 0).toLocaleString() },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white border border-zinc-200 rounded-[0.625rem] px-6 py-4 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{label}</p>
            <p className="text-lg font-bold text-[#1a0f2e] tabular-nums">{value}</p>
          </div>
        ))}
      </div>

    </div>
  );
};

export default OverviewTab;