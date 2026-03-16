// components/NewSuperAdmin/Tabs/Reports/AnalyticsTab.tsx
import { useState, useEffect, useCallback } from "react";
import {
  RefreshCw, AlertCircle, TrendingUp, ShoppingBag,
  Clock, Store, ChevronDown, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, Cell,
} from "recharts";

type ColorKey   = "violet" | "emerald" | "red" | "amber";
type VariantKey = "primary" | "secondary" | "danger" | "ghost";
type SizeKey    = "sm" | "md" | "lg";

// ── API ───────────────────────────────────────────────────────────────────────
const getToken = () =>
  localStorage.getItem("auth_token") || localStorage.getItem("lucky_boba_token") || "";
const authHeaders = () => ({
  "Content-Type": "application/json",
  "Accept":       "application/json",
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

// ── Types ─────────────────────────────────────────────────────────────────────
interface RevenuePoint  { date: string; revenue: number; orders: number; }
interface TopProduct    { product_name: string; total_quantity: number; total_revenue: number; }
interface PeakHour      { hour: number; label: string; total: number; count: number; }
interface BranchMetric  {
  branch_id: number; branch_name: string;
  total_revenue: number; total_orders: number; avg_order_value: number;
}
interface BranchOption  { id: number; name: string; }

// ── Shared UI ─────────────────────────────────────────────────────────────────
interface StatCardProps {
  icon: React.ReactNode; label: string; value: string | number;
  sub?: string; trend?: number; color?: ColorKey;
}
interface BtnProps {
  children: React.ReactNode; variant?: VariantKey; size?: SizeKey;
  onClick?: () => void; className?: string; disabled?: boolean;
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
    <button onClick={onClick} disabled={disabled}
      className={`inline-flex items-center gap-1.5 font-bold rounded-lg transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 ${sizes[size]} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

const SkeletonBar: React.FC<{ h?: string }> = ({ h = "h-4" }) => (
  <div className={`w-full ${h} bg-zinc-100 rounded animate-pulse`} />
);

const BRANCH_COLORS = ["#3b2063", "#6d3fa8", "#9b6bd4", "#c4a8e8", "#ddd0f8"];
const HOUR_COLORS   = (hour: number) => {
  if (hour >= 11 && hour <= 14) return "#3b2063"; // lunch peak
  if (hour >= 17 && hour <= 20) return "#6d3fa8"; // dinner peak
  return "#ede8ff";
};

// ── Main Component ─────────────────────────────────────────────────────────────
const AnalyticsTab: React.FC = () => {
  const [period,      setPeriod]      = useState<"daily" | "weekly" | "monthly">("weekly");
  const [branchId,    setBranchId]    = useState<string>("");
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [branches,    setBranches]    = useState<BranchOption[]>([]);
  const [revenue,     setRevenue]     = useState<RevenuePoint[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [peakHours,   setPeakHours]   = useState<PeakHour[]>([]);
  const [branchPerf,  setBranchPerf]  = useState<BranchMetric[]>([]);

  const fmt  = (v: number) => `₱${Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  const fmtK = (v: number) => `₱${((v ?? 0) / 1000).toFixed(0)}k`;

  // Fetch branches once
  useEffect(() => {
    fetch("/api/branches", { headers: authHeaders() })
      .then(r => r.json())
      .then(d => { if (d.success) setBranches(d.data); })
      .catch(() => {});
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ period });
      if (branchId) params.set("branch_id", branchId);

      // Use existing endpoints — analytics endpoints fall back to admin-sales-summary
      const [summaryRes, compRes] = await Promise.all([
        fetch(`/api/reports/admin-sales-summary?${params}`, { headers: authHeaders() }),
        fetch(`/api/reports/branch-comparison?${params}`,   { headers: authHeaders() }),
      ]);

      const [summary, comp] = await Promise.all([summaryRes.json(), compRes.json()]);

      // Revenue trend from breakdown
      if (summary.breakdown) {
        setRevenue((summary.breakdown as { date: string; revenue: number; orders: number }[])
          .map(r => ({ date: r.date, revenue: Number(r.revenue), orders: Number(r.orders) })));
      }

      // Top products
      if (summary.top_products) {
        setTopProducts((summary.top_products as TopProduct[]).slice(0, 10));
      }

      // Branch performance
      if (comp.comparison) {
        setBranchPerf(comp.comparison as BranchMetric[]);
      }

      // Peak hours — try analytics endpoint, fallback to branch analytics
      const branchTarget = branchId || (comp.comparison?.[0]?.branch_id);
      if (branchTarget) {
        try {
          const hrRes  = await fetch(`/api/branches/${branchTarget}/analytics`, { headers: authHeaders() });
          const hrData = await hrRes.json();
          if (hrData.success && hrData.data?.today_hourly) {
            setPeakHours(hrData.data.today_hourly as PeakHour[]);
          }
        } catch { /* peak hours optional */ }
      }

    } catch {
      setError("Failed to load analytics data.");
    } finally {
      setLoading(false);
    }
  }, [period, branchId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const totalRevenue = revenue.reduce((s, r) => s + r.revenue, 0);
  const totalOrders  = revenue.reduce((s, r) => s + r.orders, 0);
  const peakHour     = peakHours.reduce((max, h) => h.total > (max?.total ?? 0) ? h : max, peakHours[0]);

  return (
    <div className="p-6 md:p-8 fade-in flex flex-col gap-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-bold text-[#1a0f2e]">Analytics & Sales</h2>
          <p className="text-xs text-zinc-400 mt-0.5">Visual revenue trends, top products, peak hours & branch comparison</p>
        </div>
        <Btn variant="secondary" onClick={fetchAll} disabled={loading}>
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Refresh
        </Btn>
      </div>

      {/* ── Filters ── */}
      <div className="bg-white border border-zinc-200 rounded-[0.625rem] px-5 py-4 flex flex-wrap gap-3 items-end">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1.5">Period</p>
          <div className="flex rounded-lg overflow-hidden border border-zinc-200">
            {(["daily", "weekly", "monthly"] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)} disabled={loading}
                className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors disabled:opacity-50 ${period === p ? "bg-[#3b2063] text-white" : "bg-white text-zinc-500 hover:bg-zinc-50"}`}>
                {p}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1.5">Branch</p>
          <div className="relative">
            <select value={branchId} onChange={e => setBranchId(e.target.value)}
              className="appearance-none text-sm font-medium text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-lg pl-3 pr-8 py-2 outline-none focus:ring-2 focus:ring-violet-400 cursor-pointer">
              <option value="">All Branches</option>
              {branches.map(b => <option key={b.id} value={String(b.id)}>{b.name}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
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
        <StatCard icon={<span className="font-black text-base">₱</span>}
          label="Total Revenue" value={loading ? "—" : fmt(totalRevenue)} color="violet" />
        <StatCard icon={<ShoppingBag size={16} />}
          label="Total Orders" value={loading ? "—" : totalOrders.toLocaleString()} color="emerald" />
        <StatCard icon={<Clock size={16} />}
          label="Peak Hour" value={loading ? "—" : (peakHour?.label ?? "—")}
          sub={peakHour ? `₱${Number(peakHour.total).toLocaleString()}` : undefined} color="amber" />
        <StatCard icon={<Store size={16} />}
          label="Top Branch"
          value={loading ? "—" : (branchPerf[0]?.branch_name?.replace("Lucky Boba – ", "").replace("Lucky Boba - ", "") ?? "—")}
          sub={branchPerf[0] ? fmt(Number(branchPerf[0].total_revenue)) : undefined} color="red" />
      </div>

      {/* ── Revenue Trend ── */}
      <div className="bg-white border border-zinc-200 rounded-[0.625rem] p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Revenue Trend</p>
            <p className="text-sm font-bold text-[#1a0f2e] mt-0.5 capitalize">{period} Overview</p>
          </div>
          <TrendingUp size={16} className="text-zinc-300" />
        </div>
        {loading ? <SkeletonBar h="h-[260px]" /> : revenue.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-zinc-400 text-xs">No data for this period.</div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={revenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0eef8" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fontWeight: 600, fill: "#a1a1aa" }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="rev" tick={{ fontSize: 11, fontWeight: 600, fill: "#a1a1aa" }} axisLine={false} tickLine={false} tickFormatter={fmtK} />
              <YAxis yAxisId="ord" orientation="right" tick={{ fontSize: 11, fontWeight: 600, fill: "#a1a1aa" }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(v, name) => name === "Revenue"
                  ? [`₱${Number(v).toLocaleString()}`, name]
                  : [v, name] as [number, string]}
                contentStyle={{ borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11, fontWeight: 600 }} />
              <Line yAxisId="rev" type="monotone" dataKey="revenue" name="Revenue" stroke="#3b2063" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
              <Line yAxisId="ord" type="monotone" dataKey="orders"  name="Orders"  stroke="#c4a8e8" strokeWidth={2}   dot={false} activeDot={{ r: 4 }} strokeDasharray="4 4" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Top Products + Peak Hours ── */}
      <div className="grid grid-cols-12 gap-4">

        {/* Top Products Bar Chart */}
        <div className="col-span-12 lg:col-span-7 bg-white border border-zinc-200 rounded-[0.625rem] p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Top Products</p>
              <p className="text-sm font-bold text-[#1a0f2e] mt-0.5">Best sellers by quantity</p>
            </div>
            <ShoppingBag size={15} className="text-zinc-300" />
          </div>
          {loading ? <SkeletonBar h="h-[280px]" /> : topProducts.length === 0 ? (
            <div className="h-72 flex items-center justify-center text-zinc-400 text-xs">No product data.</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topProducts} layout="vertical" barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0eef8" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fontWeight: 600, fill: "#a1a1aa" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="product_name" width={120}
                  tick={{ fontSize: 10, fontWeight: 600, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v, name) => name === "Revenue"
                  ? [`₱${Number(v).toLocaleString()}`, name]
                  : [v, name] as [number, string]}
                  contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11, fontWeight: 600 }} />
                <Bar dataKey="total_quantity" name="Qty Sold" fill="#3b2063" radius={[0, 4, 4, 0]}>
                  {topProducts.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? "#3b2063" : i === 1 ? "#6d3fa8" : i === 2 ? "#9b6bd4" : "#ede8ff"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Peak Hours */}
        <div className="col-span-12 lg:col-span-5 bg-white border border-zinc-200 rounded-[0.625rem] p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Peak Hours</p>
              <p className="text-sm font-bold text-[#1a0f2e] mt-0.5">Orders by hour (today)</p>
            </div>
            <Clock size={15} className="text-zinc-300" />
          </div>
          {loading ? <SkeletonBar h="h-[280px]" /> : peakHours.length === 0 ? (
            <div className="h-72 flex items-center justify-center text-zinc-400 text-xs text-center px-4">
              Peak hours data requires a branch selection.<br />Select a branch to view hourly breakdown.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={peakHours} barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0eef8" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 9, fontWeight: 600, fill: "#a1a1aa" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fontWeight: 600, fill: "#a1a1aa" }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => [v, "Orders"] as [number, string]}
                  contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                <Bar dataKey="count" name="Orders" radius={[4, 4, 0, 0]}>
                  {peakHours.map((h, i) => (
                    <Cell key={i} fill={HOUR_COLORS(h.hour)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
          {/* Legend */}
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-[#3b2063]" />
              <span className="text-[10px] font-medium text-zinc-500">Lunch peak</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-[#6d3fa8]" />
              <span className="text-[10px] font-medium text-zinc-500">Dinner peak</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-[#ede8ff]" />
              <span className="text-[10px] font-medium text-zinc-500">Other hours</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Branch Comparison ── */}
      <div className="bg-white border border-zinc-200 rounded-[0.625rem] p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Branch Comparison</p>
            <p className="text-sm font-bold text-[#1a0f2e] mt-0.5 capitalize">{period} performance</p>
          </div>
          <Store size={15} className="text-zinc-300" />
        </div>
        {loading ? <SkeletonBar h="h-[200px]" /> : branchPerf.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-zinc-400 text-xs">No branch data.</div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={branchPerf.map(b => ({
                name:    b.branch_name.replace("Lucky Boba – ", "").replace("Lucky Boba - ", ""),
                revenue: Number(b.total_revenue),
                orders:  Number(b.total_orders),
              }))} barSize={24}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0eef8" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 600, fill: "#a1a1aa" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fontWeight: 600, fill: "#a1a1aa" }} axisLine={false} tickLine={false} tickFormatter={fmtK} />
                <Tooltip formatter={(v, name) => name === "Revenue"
                  ? [`₱${Number(v).toLocaleString()}`, name]
                  : [v, name] as [number, string]}
                  contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11, fontWeight: 600 }} />
                <Bar dataKey="revenue" name="Revenue" radius={[4, 4, 0, 0]}>
                  {branchPerf.map((_, i) => (
                    <Cell key={i} fill={BRANCH_COLORS[i] ?? "#ddd0f8"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Branch cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
              {branchPerf.map((b, i) => {
                const totalRev = branchPerf.reduce((s, x) => s + Number(x.total_revenue), 0);
                const share    = totalRev > 0 ? Math.round((Number(b.total_revenue) / totalRev) * 100) : 0;
                const shortName = b.branch_name.replace("Lucky Boba – ", "").replace("Lucky Boba - ", "");
                const isTop    = i === 0;
                const isLow    = i === branchPerf.length - 1 && branchPerf.length > 1;
                return (
                  <div key={b.branch_id} className={`rounded-[0.625rem] border px-4 py-3.5 ${
                    isTop ? "bg-emerald-50 border-emerald-200" :
                    isLow ? "bg-amber-50 border-amber-200" :
                    "bg-zinc-50 border-zinc-200"
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-[#1a0f2e] truncate">{shortName}</p>
                      {isTop && <span className="text-[9px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-full">Top</span>}
                      {isLow && <span className="text-[9px] font-black uppercase tracking-wider text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full">Low</span>}
                    </div>
                    <p className="text-base font-black text-[#3b2063] tabular-nums">{fmt(Number(b.total_revenue))}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-zinc-400">{Number(b.total_orders).toLocaleString()} orders</span>
                      <span className="text-[10px] font-bold text-zinc-500">{share}%</span>
                    </div>
                    <div className="w-full h-1 bg-white rounded-full overflow-hidden mt-1.5">
                      <div className="h-full rounded-full" style={{
                        width: `${share}%`,
                        background: BRANCH_COLORS[i] ?? "#ddd0f8",
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AnalyticsTab;