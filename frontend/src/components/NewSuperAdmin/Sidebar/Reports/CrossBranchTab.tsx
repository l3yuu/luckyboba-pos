// components/NewSuperAdmin/Tabs/Reports/CrossBranchTab.tsx
import { useState, useEffect, useCallback } from "react";
import {
  TrendingUp, TrendingDown, PhilippinePeso, FileText,
  Download, ArrowUpRight, ArrowDownRight, AlertCircle,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";

type ColorKey = "violet" | "emerald" | "red" | "amber";
type VariantKey = "primary" | "secondary" | "danger" | "ghost";
type SizeKey = "sm" | "md" | "lg";

interface StatCardProps {
  icon: React.ReactNode; label: string; value: string | number;
  sub?: string; trend?: number; color?: ColorKey;
}
interface BtnProps {
  children: React.ReactNode; variant?: VariantKey; size?: SizeKey;
  onClick?: () => void; className?: string; disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

const getToken = () =>
  localStorage.getItem("auth_token") || localStorage.getItem("lucky_boba_token") || "";
const authHeaders = () => ({
  "Content-Type": "application/json",
  "Accept": "application/json",
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

interface SummaryTotals {
  grand_total: number;
  total_orders: number;
  avg_order_value: number;
  total_customers: number;
}
interface BreakdownRow {
  date: string;
  revenue: number;
  orders: number;
}
interface BranchMetric {
  branch_id: number;
  branch_name: string;
  total_revenue: number;
  total_orders: number;
  avg_order_value: number;
  revenue_rank: number;
}
interface TopProduct {
  product_name: string;
  total_quantity: number;
  total_revenue: number;
}
interface BranchOption {
  id: number;
  name: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, sub, trend, color = "violet" }) => {
  const colors: Record<ColorKey, { bg: string; border: string; icon: string }> = {
    violet: { bg: "bg-violet-50", border: "border-violet-200", icon: "text-violet-600" },
    emerald: { bg: "bg-emerald-50", border: "border-emerald-200", icon: "text-emerald-600" },
    red: { bg: "bg-red-50", border: "border-red-200", icon: "text-red-500" },
    amber: { bg: "bg-amber-50", border: "border-amber-200", icon: "text-amber-600" },
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

const Btn: React.FC<BtnProps> = ({
  children, variant = "primary", size = "sm",
  onClick, className = "", disabled = false, type = "button",
}) => {
  const sizes: Record<SizeKey, string> = { sm: "px-3 py-2 text-xs", md: "px-4 py-2.5 text-sm", lg: "px-6 py-3 text-sm" };
  const variants: Record<VariantKey, string> = {
    primary: "bg-[#3b2063] hover:bg-[#2a1647] text-white",
    secondary: "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50",
    danger: "bg-red-600 hover:bg-red-700 text-white",
    ghost: "bg-transparent text-zinc-500 hover:bg-zinc-100",
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

const CrossBranchTab: React.FC = () => {
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("monthly");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totals, setTotals] = useState<SummaryTotals | null>(null);
  const [breakdown, setBreakdown] = useState<BreakdownRow[]>([]);
  const [branchPerf, setBranchPerf] = useState<BranchMetric[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [exportBranchId, setExportBranchId] = useState<string>(localStorage.getItem('superadmin_selected_branch') || "");

  const fmt = (v: number) => `₱${Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  const fmtK = (v: number) => `₱${((v ?? 0) / 1000).toFixed(0)}k`;
  const handleBranchChange = (id: string) => {
    setExportBranchId(id);
    localStorage.setItem('superadmin_selected_branch', id);
  };

  // Fetch branches for export selector
  useEffect(() => {
    fetch("/api/branches", { headers: authHeaders() })
      .then(r => r.json())
      .then(d => { if (d.success) setBranches(d.data); })
      .catch(() => { });
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [summaryRes, comparisonRes] = await Promise.all([
        fetch(`/api/reports/admin-sales-summary?period=${period}`, { headers: authHeaders() }),
        fetch(`/api/reports/branch-comparison?period=${period}`, { headers: authHeaders() }),
      ]);
      const [summary, comparison] = await Promise.all([summaryRes.json(), comparisonRes.json()]);
      if (summary.totals) setTotals(summary.totals);
      if (summary.breakdown) setBreakdown(summary.breakdown);
      if (summary.top_products) setTopProducts(summary.top_products.slice(0, 5));
      if (comparison.comparison) setBranchPerf(comparison.comparison);
    } catch {
      setError("Failed to load report data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleExport = async () => {
    const params = new URLSearchParams();
    params.set("period", period);
    if (exportBranchId) params.set("branch_id", exportBranchId);

    try {
      const res = await fetch(`/api/reports/export-sales?${params}`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      const cd = res.headers.get("Content-Disposition");
      const match = cd?.match(/filename="?([^"]+)"?/);
      a.download = match?.[1] ?? `LuckyBoba_CrossBranch_Report.csv`;

      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Export failed. Please try again.");
    }
  };

  const chartData = breakdown.map(r => ({ month: r.date, revenue: Number(r.revenue) }));
  const totalRevenue = branchPerf.reduce((s, b) => s + Number(b.total_revenue), 0);
  const cogsPct = 0.34;
  const opexPct = 0.15;
  const grandTotal = totals?.grand_total ?? 0;
  const cogs = grandTotal * cogsPct;
  const opex = grandTotal * opexPct;
  const netProfit = grandTotal - cogs - opex;

  return (
    <div className="p-6 md:p-8 fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-start gap-3 mb-5">
        <div className="flex rounded-lg overflow-hidden border border-zinc-200">
          {(["daily", "weekly", "monthly"] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)} disabled={loading}
              className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors disabled:opacity-50 ${period === p ? "bg-[#3b2063] text-white" : "bg-white text-zinc-500 hover:bg-zinc-50"}`}>
              {p}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <select value={exportBranchId} onChange={e => handleBranchChange(e.target.value)}
            className="appearance-none text-[10px] font-bold uppercase tracking-wider text-zinc-600 bg-white border border-zinc-200 rounded-lg pl-2.5 pr-6 py-2 outline-none focus:ring-2 focus:ring-violet-400 cursor-pointer">
            <option value="">All Branches</option>
            {branches.map(b => <option key={b.id} value={String(b.id)}>{b.name}</option>)}
          </select>
          <Btn variant="secondary" onClick={handleExport} disabled={loading}>
            <Download size={13} /> Export CSV
          </Btn>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle size={14} className="text-red-500 shrink-0" />
          <p className="text-xs text-red-600 font-medium">{error}</p>
          <Btn variant="secondary" size="sm" onClick={fetchAll} className="ml-auto">Try again</Btn>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<TrendingUp size={16} />} label="Gross Revenue" value={loading ? "—" : fmt(grandTotal)} color="violet" />
        <StatCard icon={<FileText size={16} />} label="Total Orders" value={loading ? "—" : (totals?.total_orders ?? 0).toLocaleString()} color="emerald" />
        <StatCard icon={<TrendingDown size={16} />} label="Avg Order Value" value={loading ? "—" : fmt(totals?.avg_order_value ?? 0)} color="red" />
        <StatCard icon={<PhilippinePeso size={16} />} label="Net Profit (est)" value={loading ? "—" : fmt(netProfit)} color="amber" />
      </div>

      {/* Chart + P&L */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-8 bg-white border border-zinc-200 rounded-[0.625rem] p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1">Revenue Trend</p>
          <p className="text-base font-bold text-[#1a0f2e] mb-4 capitalize">{period} Comparison</p>
          {loading ? <SkeletonBar h="h-[240px]" /> : chartData.length === 0 ? (
            <div className="h-60 flex items-center justify-center text-zinc-400 text-xs font-medium">No data for this period.</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="rg2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b2063" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#3b2063" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0eef8" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fontWeight: 600, fill: "#a1a1aa" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fontWeight: 600, fill: "#a1a1aa" }} axisLine={false} tickLine={false} tickFormatter={fmtK} />
                <Tooltip formatter={(v) => [`₱${Number(v ?? 0).toLocaleString()}`, ""] as [string, string]}
                  contentStyle={{ borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 12 }} />
                <Area type="monotone" dataKey="revenue" stroke="#3b2063" strokeWidth={2.5} fill="url(#rg2)" name="Revenue" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* P&L Summary */}
        <div className="col-span-12 lg:col-span-4 bg-white border border-zinc-200 rounded-[0.625rem] p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1">P&L Summary</p>
          <p className="text-base font-bold text-[#1a0f2e] mb-4 capitalize">This {period}</p>
          {loading ? (
            <div className="flex flex-col gap-4">{[...Array(4)].map((_, i) => <SkeletonBar key={i} h="h-8" />)}</div>
          ) : (
            [
              { label: "Gross Revenue", value: fmt(grandTotal), pct: 100, color: "#3b2063" },
              { label: "Cost of Goods (est)", value: `−${fmt(cogs)}`, pct: Math.round(cogsPct * 100), color: "#ef4444" },
              { label: "Operating Exp (est)", value: `−${fmt(opex)}`, pct: Math.round(opexPct * 100), color: "#f59e0b" },
              { label: "Net Profit (est)", value: fmt(netProfit), pct: Math.round((netProfit / (grandTotal || 1)) * 100), color: "#10b981" },
            ].map((r, i) => (
              <div key={i} className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-zinc-600">{r.label}</span>
                  <span className="text-xs font-bold text-[#1a0f2e]">{r.value}</span>
                </div>
                <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, r.pct))}%`, background: r.color }} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Branch Breakdown Table */}
      <div className="mt-4 bg-white border border-zinc-200 rounded-[0.625rem] overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          <p className="text-sm font-bold text-[#1a0f2e]">Branch Breakdown</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{period}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100">
                {["Rank", "Branch", "Orders", "Revenue", "Avg Order Value", "Share"].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-zinc-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && [...Array(4)].map((_, i) => (
                <tr key={i} className="border-b border-zinc-50">
                  {[...Array(6)].map((_, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-3 bg-zinc-100 rounded animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} />
                    </td>
                  ))}
                </tr>
              ))}
              {!loading && branchPerf.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-zinc-400 text-xs font-medium">No branch data for this period.</td></tr>
              )}
              {!loading && branchPerf.map((b, i) => {
                const share = totalRevenue > 0 ? Math.round((Number(b.total_revenue) / totalRevenue) * 100) : 0;
                const shortName = b.branch_name.replace("Lucky Boba – ", "").replace("Lucky Boba - ", "");
                return (
                  <tr key={b.branch_id} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black
                        ${i === 0 ? "bg-amber-50 text-amber-600 border border-amber-200" :
                          i === 1 ? "bg-zinc-100 text-zinc-500 border border-zinc-200" :
                            i === 2 ? "bg-orange-50 text-orange-500 border border-orange-200" :
                              "bg-zinc-50 text-zinc-400 border border-zinc-100"}`}>
                        {b.revenue_rank}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-[#1a0f2e]">{shortName}</td>
                    <td className="px-5 py-3.5 text-zinc-600">{Number(b.total_orders).toLocaleString()}</td>
                    <td className="px-5 py-3.5 font-bold text-[#3b2063]">{fmt(Number(b.total_revenue))}</td>
                    <td className="px-5 py-3.5 text-zinc-600">{fmt(Number(b.avg_order_value))}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden max-w-16">
                          <div className="h-full rounded-full bg-[#3b2063]" style={{ width: `${share}%` }} />
                        </div>
                        <span className="text-xs font-bold text-zinc-600">{share}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Products */}
      {!loading && topProducts.length > 0 && (
        <div className="mt-4 bg-white border border-zinc-200 rounded-[0.625rem] p-6">
          <p className="text-sm font-bold text-[#1a0f2e] mb-4">
            Top Products <span className="text-zinc-400 font-medium capitalize">· {period}</span>
          </p>
          <div className="flex flex-col gap-3">
            {topProducts.map((p, i) => {
              const pct = topProducts[0].total_quantity > 0
                ? Math.round((p.total_quantity / topProducts[0].total_quantity) * 100) : 0;
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
        </div>
      )}
    </div>
  );
};

export default CrossBranchTab;