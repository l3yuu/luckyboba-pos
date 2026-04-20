// components/BranchManager/SalesReport/BM_SalesDashboard.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  Download, RefreshCw, 
  TrendingUp, DollarSign, Users,
  ArrowUpRight, LayoutDashboard,
  Calendar, CreditCard, Search,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { StatCard, Button as Btn, Badge, AlertBox } from "../SharedUI";

// ── Types ─────────────────────────────────────────────────────────────────────
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

// ── Helpers ──────────────────────────────────────────────────────────────────
const getBMBranchId = (): number | null => {
  try {
    const stored = localStorage.getItem("lucky_boba_user_branch_id");
    if (stored && stored !== "" && stored !== "null") {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    const authUser = JSON.parse(localStorage.getItem("auth_user") ?? "{}");
    if (authUser.branch_id) return Number(authUser.branch_id);
    return null;
  } catch { return null; }
};

const getBMBranchName = (): string => localStorage.getItem("lucky_boba_user_branch") ?? "";

const PAYMENT_COLORS: Record<string, string> = {
  cash:   "#3b2063",
  gcash:  "#0ea5e9",
  card:   "#10b981",
  maya:   "#f59e0b",
  other:  "#a1a1aa",
};

// ── Main Component ────────────────────────────────────────────────────────────
const BM_SalesDashboard: React.FC = () => {
  const [bmBranchId] = useState<number | null>(() => getBMBranchId());
  const [bmBranchName, setBmBranchName] = useState<string>(() => getBMBranchName());

  const today = new Date().toISOString().split("T")[0];
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString().split("T")[0];

  const [mode,       setMode]       = useState<"period" | "range">("period");
  const [period,     setPeriod]     = useState<"daily" | "weekly" | "monthly">("monthly");
  const [dateFrom,   setDateFrom]   = useState(firstOfMonth);
  const [dateTo,     setDateTo]     = useState(today);
  const [search,     setSearch]     = useState("");

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
    if (bmBranchName && bmBranchId) return;
    fetch("/api/user", { headers: authHeaders() })
      .then(r => r.json())
      .then(d => {
        if (d.branch_name) setBmBranchName(d.branch_name);
        if (d.branch_id && !bmBranchId) {
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

      summaryParams.set("branch_id", String(bmBranchId));
      compParams.set("branch_id",    String(bmBranchId));

      if (mode === "period") {
        summaryParams.set("period", period);
        compParams.set("period",    period);
      } else {
        summaryParams.set("period",    "daily");
        summaryParams.set("date_from", dateFrom);
        summaryParams.set("date_to",   dateTo);
        compParams.set("period",       "daily");
        compParams.set("date_from",    dateFrom);
        compParams.set("date_to",      dateTo);
      }

      const [summaryRes, compRes] = await Promise.all([
        fetch(`/api/reports/admin-sales-summary?${summaryParams}`, { headers: authHeaders() }),
        fetch(`/api/reports/branch-comparison?${compParams}`,      { headers: authHeaders() }),
      ]);

      if (!summaryRes.ok || !compRes.ok) throw new Error("API Exception");

      const [summary, comp] = await Promise.all([summaryRes.json(), compRes.json()]);

      setTotals(summary.totals ?? null);
      setBreakdown(summary.breakdown ?? []);
      setTopProducts((summary.top_products ?? []).slice(0, 10));

      const allPayments: PaymentBreakdown[] = [];
      (comp.comparison ?? []).forEach((b: BranchMetric & { payment_methods?: PaymentBreakdown[] }) => {
        (b.payment_methods ?? []).forEach((pm: PaymentBreakdown) => {
          allPayments.push(pm);
        });
      });
      setPayments(allPayments);
    } catch {
      setError("Synchronisation failure. Terminal could not reach reporting server.");
    } finally {
      setLoading(false);
    }
  }, [mode, period, dateFrom, dateTo, bmBranchId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleExport = async () => {
    const params = new URLSearchParams();
    if (mode === "period") {
      params.set("period", period);
    } else {
      params.set("date_from", dateFrom);
      params.set("date_to",   dateTo);
    }
    if (bmBranchId) params.set("branch_id", String(bmBranchId));

    try {
      const res = await fetch(`/api/reports/export-sales?${params}`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      const cd = res.headers.get("Content-Disposition");
      const match = cd?.match(/filename="?([^"]+)"?/);
      a.download = match?.[1] ?? `LuckyBoba_SalesReport.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Export protocol failed. Retry requested.");
    }
  };

  const chartData      = breakdown.map(r => ({ date: r.date, revenue: Number(r.revenue), orders: Number(r.orders) }));
  const grandTotal     = totals?.grand_total ?? 0;
  const totalOrders    = totals?.total_orders ?? 0;
  const avgOrderValue  = totals?.avg_order_value ?? 0;

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

  const filteredProducts = topProducts.filter(p =>
    p.product_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 md:p-8 space-y-6 fade-in pb-20">
      <style>{`
        .fade-in { animation: fadeIn 0.3s ease-out forwards; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1a0f2e]">Sales Analytics</h1>
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mt-1">Real-time revenue monitoring & performance metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-zinc-50 border border-zinc-200 rounded-xl p-1 shadow-inner">
            {(["period", "range"] as const).map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${mode === m ? "bg-white text-[#3b2063] shadow-sm" : "text-zinc-400 hover:text-zinc-600"}`}>
                {m}
              </button>
            ))}
          </div>
          <Btn variant="secondary" onClick={handleExport} className="px-5 py-2.5 rounded-xl shadow-sm">
            <Download size={14} /> <span className="ml-1">Export CSV</span>
          </Btn>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-white border border-zinc-200 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-100 px-3 py-1.5 rounded-xl">
          <Calendar size={14} className="text-zinc-400" />
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mr-2 border-r border-zinc-200 pr-2">Configuration</p>
          
          {mode === "period" ? (
            <div className="flex items-center gap-1.5">
              {(["daily", "weekly", "monthly"] as const).map(p => (
                <button key={p} onClick={() => setPeriod(p)} disabled={loading}
                  className={`px-3 py-1 rounded text-[9px] font-black uppercase tracking-widest transition-all ${period === p ? "bg-[#3b2063] text-white shadow-md shadow-purple-200" : "text-zinc-400 hover:text-zinc-600"}`}>
                  {p}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-[#3b2063] outline-none w-28" />
              <div className="w-1.5 h-[1px] bg-zinc-300" />
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-[#3b2063] outline-none w-28" />
            </div>
          )}
        </div>

        <Btn onClick={fetchAll} disabled={loading} className="px-6 py-2 rounded-xl shadow-lg shadow-purple-100 ml-auto group">
          {loading ? <RefreshCw size={14} className="animate-spin" /> : <><RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" /> <span className="ml-1">Sync Report</span></>}
        </Btn>
      </div>

      {/* ── Error ── */}
      {error && <AlertBox type="error" message={error} />}

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={<DollarSign size={18} />} label="Gross Revenue" value={loading ? "—" : fmt(grandTotal)} sub={`Total from ${bmBranchName || 'Branch'}`} color="violet" />
        <StatCard icon={<TrendingUp size={18} />} label="Total Orders" value={loading ? "—" : totalOrders.toLocaleString()} sub="Verified Transactions" color="emerald" />
        <StatCard icon={<ArrowUpRight size={18} />} label="Avg Ticket" value={loading ? "—" : fmt(avgOrderValue)} sub="Per Transaction" color="amber" />
        <StatCard icon={<Users size={18} />} label="Customers" value={loading ? "—" : (totals?.total_customers ?? 0).toLocaleString()} sub="Unique Footfall" color="red" />
      </div>

      {/* ── Content Tabs ── */}
      <div className="bg-white border border-zinc-200 rounded-[1.25rem] overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-50 bg-zinc-50/20">
          <div className="flex gap-6">
            {( [
              { id: "overview", label: "Volume & Timing", icon: <TrendingUp size={14} /> },
              { id: "products", label: "Top Sellers", icon: <LayoutDashboard size={14} /> },
              { id: "payments", label: "Settlement Matrix", icon: <CreditCard size={14} /> },
            ] as const).map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-1 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${
                  activeTab === tab.id ? "border-[#3b2063] text-[#3b2063] scale-105" : "border-transparent text-zinc-400 hover:text-zinc-600"
                }`}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded border border-emerald-100 text-[9px] font-black uppercase tracking-widest leading-none">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Metrics
          </div>
        </div>

        <div className="p-6">
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 lg:col-span-8 space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <div>
                      <h4 className="text-xs font-black text-[#1a0f2e] uppercase tracking-wide">Revenue Flow</h4>
                      <p className="text-[10px] font-bold text-zinc-400 tracking-tight">Cumulative gains across specific time markers</p>
                    </div>
                  </div>
                  <div className="h-[300px] w-full">
                    {loading ? (
                      <div className="w-full h-full bg-zinc-50 rounded-2xl animate-pulse" />
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="bmRevGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%"  stopColor="#3b2063" stopOpacity={0.15} />
                              <stop offset="95%" stopColor="#3b2063" stopOpacity={0.01} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="4 4" stroke="#f1f1f4" vertical={false} />
                          <XAxis dataKey="date" tick={{ fontSize: 10, fontWeight: 800, fill: "#a1a1aa" }} axisLine={false} tickLine={false} dy={10} />
                          <YAxis tick={{ fontSize: 10, fontWeight: 800, fill: "#a1a1aa" }} axisLine={false} tickLine={false} tickFormatter={fmtK} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '11px', fontWeight: 'bold' }}
                            formatter={(v) => [fmt(Number(v)), "Revenue"]}
                          />
                          <Area type="monotone" dataKey="revenue" stroke="#3b2063" strokeWidth={3} fill="url(#bmRevGrad)" animationDuration={1500} />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                <div className="col-span-12 lg:col-span-4 bg-zinc-50/50 rounded-2xl p-5 border border-zinc-100 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-black text-[#1a0f2e] uppercase tracking-wide">Order Density</h4>
                    <p className="text-[10px] font-bold text-zinc-400 tracking-tight">Frequency of client checkouts</p>
                  </div>
                  <div className="h-[200px] w-full mt-4">
                    {loading ? (
                      <div className="w-full h-full bg-white rounded-xl animate-pulse" />
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} barSize={12}>
                          <XAxis dataKey="date" hide />
                          <Tooltip 
                            cursor={{ fill: '#ede8ff' }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '11px', fontWeight: 'bold' }}
                          />
                          <Bar dataKey="orders" fill="#3b2063" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                  <div className="mt-4 pt-4 border-t border-zinc-100 flex justify-between">
                    <div>
                      <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Global Peak</p>
                      <p className="text-sm font-black text-[#1a0f2e]">{Math.max(...chartData.map(d => d.orders), 0)} Units</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Branch Avg</p>
                      <p className="text-sm font-black text-[#1a0f2e]">{(totalOrders / (chartData.length || 1)).toFixed(1)}/day</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border border-zinc-100 rounded-2xl overflow-hidden shadow-sm overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-zinc-50/50 text-left">
                      <th className="px-6 py-3 text-[9px] font-black text-zinc-400 uppercase tracking-widest">Reporting Date</th>
                      <th className="px-6 py-3 text-[9px] font-black text-zinc-400 uppercase tracking-widest text-center">Transactions</th>
                      <th className="px-6 py-3 text-[9px] font-black text-zinc-400 uppercase tracking-widest text-center">Gross Revenue</th>
                      <th className="px-6 py-3 text-[9px] font-black text-zinc-400 uppercase tracking-widest text-right">Avg Ticket Size</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {loading ? (
                       [...Array(5)].map((_, i) => <tr key={i} className="animate-pulse"><td colSpan={4} className="px-6 py-4"><div className="h-4 bg-zinc-50 rounded" /></td></tr>)
                    ) : breakdown.length === 0 ? (
                      <tr><td colSpan={4} className="px-6 py-12 text-center text-[10px] font-black text-zinc-300 uppercase tracking-widest">No spectral data detected</td></tr>
                    ) : (
                      breakdown.map((row, i) => (
                        <tr key={i} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="px-6 py-3.5 text-xs font-bold text-[#1a0f2e]">{row.date}</td>
                          <td className="px-6 py-3.5 text-center text-xs font-bold text-zinc-500">{Number(row.orders).toLocaleString()}</td>
                          <td className="px-6 py-3.5 text-center text-xs font-black text-[#3b2063]">{fmt(Number(row.revenue))}</td>
                          <td className="px-6 py-3.5 text-right text-xs font-bold text-emerald-600">
                             {row.orders > 0 ? fmt(Number(row.revenue) / Number(row.orders)) : "—"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "products" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div className="relative group max-w-sm flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-[#3b2063] transition-colors" size={14} />
                  <input
                    type="text"
                    placeholder="Search menu catalogue..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-100 rounded-xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-violet-400/5 focus:border-violet-400 focus:bg-white transition-all shadow-inner"
                  />
                </div>
                <Badge status={`${filteredProducts.length} Items`} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                   [...Array(6)].map((_, i) => <div key={i} className="h-24 bg-zinc-50 rounded-2xl animate-pulse" />)
                ) : filteredProducts.map((p, i) => {
                  const maxQty = topProducts[0]?.total_quantity ?? 1;
                  const pct    = Math.round((p.total_quantity / maxQty) * 100);
                  return (
                    <div key={i} className="group p-4 bg-white border border-zinc-100 rounded-2xl hover:border-violet-200 hover:shadow-xl hover:shadow-purple-400/5 transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-8 h-8 bg-violet-50 text-violet-600 border border-violet-100 rounded-lg flex items-center justify-center text-[10px] font-black">
                           #{i + 1}
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] font-black text-[#3b2063]">{fmt(Number(p.total_revenue))}</p>
                          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">Revenue Share</p>
                        </div>
                      </div>
                      <h5 className="text-xs font-black text-[#1a0f2e] mb-1.5 truncate group-hover:text-[#3b2063] transition-colors">{p.product_name}</h5>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{p.total_quantity} sold</span>
                        <span className="text-[9px] font-black text-violet-600 uppercase tracking-widest">{pct}% score</span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-50 rounded-full overflow-hidden shadow-inner">
                        <div className="h-full bg-gradient-to-r from-violet-500 to-[#3b2063] rounded-full transition-all duration-1000" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "payments" && (
            <div className="grid grid-cols-12 gap-8">
              <div className="col-span-12 lg:col-span-7">
                <div className="mb-6">
                  <h4 className="text-xs font-black text-[#1a0f2e] uppercase tracking-wide">Liquidity Channels</h4>
                  <p className="text-[10px] font-bold text-zinc-400 tracking-tight">Preferred payment modes as per gross revenue</p>
                </div>
                <div className="h-[280px]">
                  {loading ? (
                    <div className="w-full h-full bg-zinc-50 rounded-2xl animate-pulse" />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={paymentChartData} barSize={40} margin={{ bottom: 20 }}>
                        <CartesianGrid strokeDasharray="4 4" stroke="#f1f1f4" vertical={false} />
                        <XAxis dataKey="method" tick={{ fontSize: 10, fontWeight: 800, fill: "#a1a1aa" }} axisLine={false} tickLine={false} dy={10} />
                        <YAxis tick={{ fontSize: 10, fontWeight: 800, fill: "#a1a1aa" }} axisLine={false} tickLine={false} tickFormatter={fmtK} />
                        <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '11px', fontWeight: 'bold' }} />
                        <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                           {paymentChartData.map((entry, index) => (
                              <Bar key={`cell-${index}`} dataKey="revenue" fill={entry.color} />
                           ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
              <div className="col-span-12 lg:col-span-5 flex flex-col gap-3">
                 <h4 className="text-xs font-black text-[#1a0f2e] uppercase tracking-wide mb-2">Matrix breakdown</h4>
                 {loading ? (
                   [...Array(4)].map((_, i) => <div key={i} className="h-16 bg-zinc-50 rounded-2xl animate-pulse" />)
                 ) : paymentChartData.map((pm, i) => {
                    const totalPay = paymentChartData.reduce((s, x) => s + x.revenue, 0);
                    const share    = totalPay > 0 ? Math.round((pm.revenue / totalPay) * 100) : 0;
                    return (
                      <div key={i} className="group p-4 bg-zinc-50/50 border border-zinc-100 rounded-2xl flex items-center justify-between hover:bg-white hover:border-violet-100 hover:shadow-lg transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-black/5" style={{ background: pm.color }}>
                            <CreditCard size={18} className="text-white" />
                          </div>
                          <div>
                            <p className="text-xs font-black text-[#1a0f2e] uppercase tracking-tight">{pm.method}</p>
                            <p className="text-[10px] font-bold text-zinc-400 tracking-widest">{share}% MARKET SHARE</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-[#3b2063]">{fmt(pm.revenue)}</p>
                          <div className="w-16 h-1 bg-zinc-200/50 rounded-full overflow-hidden mt-1.5 ml-auto">
                            <div className="h-full rounded-full" style={{ width: `${share}%`, background: pm.color }} />
                          </div>
                        </div>
                      </div>
                    );
                 })}
                 {!loading && paymentChartData.length > 0 && (
                   <div className="bg-zinc-50 border border-zinc-200 rounded-[0.625rem] px-4 py-3.5 flex items-center justify-between mt-auto">
                     <p className="text-xs font-black text-[#1a0f2e] uppercase tracking-widest">Total Yield</p>
                     <p className="text-sm font-black text-[#3b2063]">
                       {fmt(paymentChartData.reduce((s, x) => s + x.revenue, 0))}
                     </p>
                   </div>
                 )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BM_SalesDashboard;