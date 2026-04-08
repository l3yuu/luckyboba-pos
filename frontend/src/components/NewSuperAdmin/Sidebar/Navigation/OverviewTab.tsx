import { useState, useEffect, useCallback } from "react";
import {
  ArrowUpRight, ArrowDownRight,
  RefreshCw, TrendingUp,
  ShoppingBag, DollarSign,
  Users as UsersIcon, GitBranch, Activity
} from "lucide-react";
import axios from 'axios';
import {
  AreaChart, Area, BarChart as ReBarChart, Bar,
  PieChart as RePieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
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

interface OwnershipSummary {
  company: { branch_count: number; total_orders: number; total_revenue: number; voided_revenue: number };
  franchise: { branch_count: number; total_orders: number; total_revenue: number; voided_revenue: number };
}

// ── Pulse Types ──────────────────────────────────────────────────────────────
interface PulseSale {
  id: number;
  invoice_number: string;
  total_amount: number;
  branch_name: string;
  cashier_name: string;
  created_at: string;
  timestamp: string;
}
interface PulseActiveUser {
  id: number;
  name: string;
  role: string;
  branch_name: string;
  last_seen: string;
}
interface PulseBranchStatus {
  id: number;
  name: string;
  location: string;
  status: 'online' | 'offline';
}
interface PulseData {
  recent_sales: PulseSale[];
  active_users: PulseActiveUser[];
  branch_status: PulseBranchStatus[];
  stats: {
    online_branches: number;
    total_branches: number;
    active_staff: number;
    today_total: number;
  };
}

// ── API ───────────────────────────────────────────────────────────────────────
const getToken = () =>
  localStorage.getItem("auth_token") || localStorage.getItem("lucky_boba_token") || "";
const authHeaders = () => ({
  "Content-Type": "application/json",
  "Accept": "application/json",
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

// ── Shared UI ─────────────────────────────────────────────────────────────────
const StatCard: React.FC<StatCardProps> = ({ icon, label, value, sub, trend, color = "violet" }) => {
  const colors: Record<ColorKey, { bg: string; border: string; icon: string }> = {
    violet: { bg: "bg-[#f5f0ff]", border: "border-[#e9d5ff]", icon: "text-[#3b2063]" },
    emerald: { bg: "bg-emerald-50", border: "border-emerald-200", icon: "text-emerald-600" },
    red: { bg: "bg-red-50", border: "border-red-200", icon: "text-red-500" },
    amber: { bg: "bg-amber-50", border: "border-amber-200", icon: "text-amber-600" },
  };
  const c = colors[color];
  return (
    <div className="bg-white border border-zinc-200 rounded-[1.25rem] px-6 py-5 flex items-center justify-between card shadow-sm">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={`w-10 h-10 ${c.bg} border ${c.border} flex items-center justify-center rounded-[0.4rem] shrink-0`}>
          <span className={c.icon}>{icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{label}</p>
          <p className="text-lg font-bold text-[#1a0f2e] tabular-nums whitespace-nowrap">{value}</p>
        </div>
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 text-xs font-bold shrink-0 ml-2 ${trend >= 0 ? "text-emerald-600" : "text-red-500"}`}>
          {trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {Math.abs(trend)}%
        </div>
      )}
      {sub && <p className="text-[11px] text-zinc-400 font-medium shrink-0 ml-2 truncate max-w-[100px]">{sub}</p>}
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

const SkeletonBar: React.FC<{ w?: string; h?: string }> = ({ w = "w-full", h = "h-4" }) => (
  <div className={`${w} ${h} bg-zinc-100 rounded animate-pulse`} />
);

// ── Types ─────────────────────────────────────────────────────────────────────
interface SummaryTotals {
  grand_total: number;
  total_orders: number;
  avg_order_value: number;
  total_customers: number;
}
interface BranchMetric {
  branch_id: number;
  branch_name: string;
  location: string;
  total_revenue: number;
  total_orders: number;
  revenue_rank: number;
}
interface BreakdownRow {
  date: string;
  revenue: number;
  orders: number;
  avg_order_value: number;
}
interface TopProduct {
  product_name: string;
  total_quantity: number;
  total_revenue: number;
}
interface UserStats {
  active: number;
  total: number;
}
interface BranchStats {
  active: number;
  total: number;
}

// ── Main Tab ──────────────────────────────────────────────────────────────────
const OverviewTab: React.FC = () => {
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("monthly");
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState<SummaryTotals | null>(null);
  const [breakdown, setBreakdown] = useState<BreakdownRow[]>([]);
  const [branchPerf, setBranchPerf] = useState<BranchMetric[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({ active: 0, total: 0 });
  const [branchStats, setBranchStats] = useState<BranchStats>({ active: 0, total: 0 });
  const [ownership, setOwnership] = useState<OwnershipSummary | null>(null);

  // ── Pulse State ──
  const [pulse, setPulse] = useState<PulseData | null>(null);
  const [lastPulseSync, setLastPulseSync] = useState<Date>(new Date());

  const fmt = (v: number) => `₱${Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  const fmtK = (v: number) => `₱${((v ?? 0) / 1000).toFixed(0)}k`;

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryRes, comparisonRes, usersRes, branchesRes, ownershipRes] = await Promise.all([
        fetch(`/api/reports/admin-sales-summary?period=${period}`, { headers: authHeaders() }),
        fetch(`/api/reports/branch-comparison?period=${period}`, { headers: authHeaders() }),
        fetch(`/api/users/stats`, { headers: authHeaders() }),
        fetch(`/api/branches`, { headers: authHeaders() }),
        fetch(`/api/branches/ownership-summary?period=${period}`, { headers: authHeaders() }),
      ]);

      const [summary, comparison, users, branches, ownershipData] = await Promise.all([
        summaryRes.json(), comparisonRes.json(), usersRes.json(),
        branchesRes.json(), ownershipRes.json(),
      ]);

      if (summary.totals) setTotals(summary.totals);
      if (summary.breakdown) setBreakdown(summary.breakdown);
      if (summary.top_products) setTopProducts(summary.top_products.slice(0, 5));
      if (comparison.comparison) setBranchPerf(comparison.comparison);

      if (users.success && users.data) {
        setUserStats({ active: users.data.active, total: users.data.total });
      }
      if (branches.success && branches.data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const list = branches.data as any[];
        setBranchStats({
          total: list.length,
          active: list.filter((b: { status: string }) => b.status === "active").length,
        });
      }
      if (ownershipData.success) setOwnership(ownershipData);
    } catch (e) {
      console.error("OverviewTab fetch error", e);
    } finally {
      setLoading(false);
    }
  }, [period]);

  const fetchPulse = useCallback(async () => {
    try {
      const token = getToken();
      const response = await axios.get('/api/pulse', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPulse(response.data.data);
      setLastPulseSync(new Date());
    } catch (error) {
      console.error('Failed to fetch pulse data', error);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    fetchPulse();
    const pulseInterval = setInterval(fetchPulse, 5000);
    return () => clearInterval(pulseInterval);
  }, [fetchAll, fetchPulse]);

  // ── Chart data derived from API ───────────────────────────────────────────
  const formatDateLabel = (dateStr: string) => {
    try {
      const d = new Date(dateStr + "T00:00:00");
      if (period === "daily") return d.toLocaleTimeString("en-US", { hour: "numeric", hour12: true });
      if (period === "monthly") return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      return d.toLocaleDateString("en-US", { weekday: "short", day: "numeric" });
    } catch { return dateStr; }
  };

  const revenueChartData = breakdown.map(r => ({
    date: formatDateLabel(r.date),
    revenue: r.revenue,
  }));

  const PIE_COLORS = ["#3b2063", "#6d3fa8", "#9b6bd4", "#c4a8e8", "#ddd0f8"];
  const totalRev = branchPerf.reduce((s, b) => s + Number(b.total_revenue), 0);
  const pieData = branchPerf.slice(0, 5).map((b, i) => ({
    name: b.branch_name,
    value: totalRev > 0 ? Math.round((Number(b.total_revenue) / totalRev) * 100) : 0,
    color: PIE_COLORS[i] ?? "#c4a8e8",
  }));

  const barData = branchPerf.slice(0, 5).map(b => ({
    name: b.branch_name.replace("Lucky Boba – ", "").replace("Lucky Boba - ", "").slice(0, 15),
    sales: Number(b.total_revenue),
  }));

  const liveSalesToday = pulse?.stats.today_total ?? 0;

  return (
    <div className="p-6 md:p-8 flex flex-col gap-6 fade-in pb-20">
      <style>{`
        @keyframes pulse-ring { 0% { transform: scale(0.33); } 80%, 100% { opacity: 0; } }
        .pulse-indicator { position: relative; display: flex; align-items: center; justify-content: center; }
        .pulse-indicator::before {
          content: ''; position: absolute; width: 300%; height: 300%; border-radius: 50%;
          background-color: currentColor; animation: pulse-ring 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
        }
        .sa-ticker-item { animation: slideIn 0.4s ease-out forwards; }
        @keyframes slideIn { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #e4e4e7; border-radius: 10px; }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[#1a0f2e]">Overview</h2>
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-rose-50 text-rose-600 rounded-full border border-rose-100">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 pulse-indicator" />
              <span className="text-[0.6rem] font-bold uppercase tracking-wider">Live</span>
            </div>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">Real-time control center for business operations</p>
        </div>
        <div className="flex items-center gap-2 text-right">
          <div className="mr-2 hidden sm:block">
            <p className="text-[0.55rem] font-bold uppercase tracking-widest text-zinc-400">Live Pulse Sync</p>
            <p className="text-[0.7rem] font-black text-[#3b2063] tabular-nums">
              {lastPulseSync.toLocaleTimeString([], { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          </div>
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

      {/* Row 1: Main Stats (Classic UI Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Revenue Performance Card */}
        <StatCard
          icon={<DollarSign size={18} strokeWidth={2.5} />}
          label="Revenue Performance"
          value={loading ? "—" : fmt(totals?.grand_total ?? 0)}
          sub={`${period.toUpperCase()} TOTAL`}
          color="violet"
        />

        {/* Live Sales Today Card */}
        <div className="bg-white border border-zinc-200 rounded-[1.25rem] px-6 py-5 card relative overflow-hidden group shadow-sm">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
          </div>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 bg-rose-50 border border-rose-200 flex items-center justify-center rounded-[0.4rem] shrink-0">
              <span className="text-rose-600"><TrendingUp size={18} strokeWidth={2.5} /></span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Live Sales Today</p>
              <p className="text-lg font-black text-rose-600 tabular-nums">₱{liveSalesToday.toLocaleString()}</p>
            </div>
          </div>
          <div className="mt-1 flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-rose-500" />
            <p className="text-[0.6rem] font-black text-rose-500">REAL-TIME</p>
          </div>
        </div>

        <StatCard
          icon={<GitBranch size={18} strokeWidth={2.5} />}
          label="Active Branches"
          value={pulse?.stats.online_branches ?? branchStats.active}
          sub={`${branchStats.total} total`}
          color="emerald"
        />
        <StatCard
          icon={<UsersIcon size={18} strokeWidth={2.5} />}
          label="Active Staff"
          value={pulse?.stats.active_staff ?? userStats.active}
          sub="Staff Online"
          color="amber"
        />
        <StatCard
          icon={<ShoppingBag size={18} strokeWidth={2.5} />}
          label="Total Orders"
          value={loading ? "—" : (totals?.total_orders ?? 0).toLocaleString()}
          sub={`Count this ${period}`}
          color="violet"
        />
      </div>

      {/* Row 2: Ownership Breakdown (Now 2nd from top) */}
      {!loading && ownership && (
        <div className="bg-white border border-zinc-200 rounded-[1.25rem] p-6 shadow-sm">
          <h3 className="text-sm font-bold text-[#1a0f2e] mb-4">Ownership Breakdown</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-violet-50/50 border border-violet-100 rounded-2xl">
              <p className="text-[10px] font-black text-violet-400 uppercase tracking-widest mb-1">Company Owned</p>
              <p className="text-xl font-black text-violet-700">{fmt(ownership.company.total_revenue)}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[10px] px-2 py-0.5 bg-violet-100 text-violet-600 rounded-full font-bold">{ownership.company.branch_count} Branches</span>
              </div>
            </div>
            <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl">
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Franchisee</p>
              <p className="text-xl font-black text-emerald-700">{fmt(ownership.franchise.total_revenue)}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded-full font-bold">{ownership.franchise.branch_count} Branches</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Row 3: Live Pulse Monitoring */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Sales Ticker Card */}
        <div className="xl:col-span-8 bg-white border border-zinc-200 rounded-[1.25rem] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShoppingBag size={16} className="text-[#3b2063]" />
              <h3 className="text-sm font-bold text-[#1a0f2e]">Live Sales Ticker</h3>
            </div>
            <span className="text-[10px] font-bold text-[#3b2063] uppercase bg-[#ede8ff] px-2 py-0.5 rounded-md">
              {pulse?.recent_sales.length ?? 0} Transactions
            </span>
          </div>
          <div className="max-h-[200px] overflow-y-auto pr-2 custom-scroll space-y-2">
            {!pulse || pulse.recent_sales.length === 0 ? (
              <div className="py-10 text-center text-zinc-400 text-xs font-medium italic">Waiting for transactions...</div>
            ) : (
              pulse.recent_sales.map((sale) => (
                <div key={sale.id} className="sa-ticker-item bg-zinc-50/50 hover:bg-white hover:border-[#ede8ff] hover:shadow-md border border-transparent p-3 rounded-xl transition-all flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white border border-zinc-100 flex items-center justify-center shrink-0">
                      <p className="text-[0.6rem] font-black text-rose-500">LB</p>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[0.75rem] font-black text-[#1a0f2e]">{sale.invoice_number}</span>
                        <span className="text-[0.6rem] font-bold text-zinc-400 truncate">{sale.branch_name}</span>
                      </div>
                      <p className="text-[0.65rem] font-medium text-zinc-500 truncate">Cashier: {sale.cashier_name}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-[#1a0f2e]">₱{Number(sale.total_amount).toLocaleString()}</p>
                    <p className="text-[0.6rem] font-bold text-zinc-400 capitalize">{sale.created_at}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Branch Online Card (formerly Network Health) */}
        <div className="xl:col-span-4 bg-white border border-zinc-200 rounded-[1.25rem] p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={16} className="text-[#3b2063]" />
            <h3 className="text-sm font-bold text-[#1a0f2e]">Branch Online</h3>
          </div>
          <div className="max-h-[200px] overflow-y-auto pr-2 custom-scroll space-y-1.5">
            {!pulse ? (
              <div className="py-10 text-center text-zinc-400 text-xs font-medium italic">Checking connectivity...</div>
            ) : pulse.branch_status.map((branch) => (
              <div key={branch.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-50 transition-colors">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-2 h-2 rounded-full ${branch.status === 'online' ? 'bg-emerald-500 pulse-indicator' : 'bg-zinc-300'} shrink-0`} />
                  <span className="text-xs font-bold text-[#1a0f2e] truncate">{branch.name}</span>
                </div>
                <span className={`text-[0.55rem] font-black uppercase px-1.5 py-0.5 rounded shrink-0 ${branch.status === 'online' ? 'bg-emerald-50 text-emerald-600' : 'bg-zinc-100 text-zinc-400'}`}>
                  {branch.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Financial Analytics (Classic Display) */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 bg-white border border-zinc-200 rounded-[1.25rem] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Revenue Trend</p>
              <h3 className="text-base font-bold text-[#1a0f2e] mt-0.5 capitalize">{period} Overview</h3>
            </div>
          </div>
          {loading ? <SkeletonBar h="h-[220px]" /> : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenueChartData}>
                <defs>
                  <linearGradient id="unifGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b2063" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3b2063" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e1e9" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 9, fontWeight: 700, fill: "#a1a1aa" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fontWeight: 700, fill: "#a1a1aa" }} axisLine={false} tickLine={false} tickFormatter={fmtK} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 10px 30px rgba(0,0,0,0.1)", fontSize: 11 }}
                  formatter={(v) => [fmt(Number(v)), "Revenue"]}
                />
                <Area type="monotone" dataKey="revenue" stroke="#3b2063" strokeWidth={3} fill="url(#unifGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="col-span-12 lg:col-span-4 bg-white border border-zinc-200 rounded-[1.25rem] p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Revenue Share</p>
          <h3 className="text-base font-bold text-[#1a0f2e] mb-4">By Branch</h3>
          {loading ? <SkeletonBar h="h-[180px]" /> : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <RePieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={4} dataKey="value">
                    {pieData.map((e, idx) => <Cell key={idx} fill={e.color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v}%`, "Share"]} />
                </RePieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-1.5 max-h-[80px] overflow-y-auto custom-scroll pr-1">
                {pieData.map((d, idx) => (
                  <div key={idx} className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                      <span className="font-bold text-zinc-500 truncate">{d.name}</span>
                    </div>
                    <span className="font-black text-[#3b2063] whitespace-nowrap">{d.value}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Row 4: Regional Analysis & Products */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-7 bg-white border border-zinc-200 rounded-[1.25rem] p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-base font-bold text-[#1a0f2e]">Branch Performance</h3>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{period} Revenue Summary</p>
          </div>
          <div className="h-[200px]">
            {loading ? <SkeletonBar h="w-full h-full" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <ReBarChart data={barData} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0eef8" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 700, fill: "#a1a1aa" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fontWeight: 700, fill: "#a1a1aa" }} axisLine={false} tickLine={false} tickFormatter={fmtK} />
                  <Bar dataKey="sales" fill="#3b2063" radius={[4, 4, 0, 0]} />
                  <Tooltip cursor={{ fill: '#f4f2ff' }} />
                </ReBarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-5 bg-white border border-zinc-200 rounded-[1.25rem] p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-base font-bold text-[#1a0f2e]">Best Sellers</h3>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Top products this {period}</p>
          </div>
          <div className="space-y-3">
            {loading ? <div className="space-y-3">{[...Array(5)].map((_, i) => <SkeletonBar key={i} h="h-8" />)}</div> : topProducts.length === 0 ? <p className="text-center py-10 text-xs text-zinc-400 italic">No sales info</p> : (
              topProducts.map((p, i) => {
                const pct = Math.round((p.total_quantity / (topProducts[0]?.total_quantity || 1)) * 100);
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-lg bg-[#f5f0ff] border border-[#e9d5ff] flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-black text-[#3b2063]">{i + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-black text-zinc-600 truncate">{p.product_name}</span>
                        <span className="text-[10px] font-bold text-zinc-400 shrink-0">{p.total_quantity} sold</span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <span className="text-[10px] font-black text-[#3b2063] shrink-0 w-20 text-right">₱{Number(p.total_revenue).toLocaleString()}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default OverviewTab;