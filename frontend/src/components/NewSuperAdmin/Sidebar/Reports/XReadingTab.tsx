// components/NewSuperAdmin/Tabs/Reports/XReadingTab.tsx
import { useState, useEffect, useCallback } from "react";
import {
  RefreshCw, AlertCircle, Printer, ChevronDown,
  DollarSign, ShoppingBag, TrendingUp, Users,
  CreditCard, Banknote, Smartphone,
} from "lucide-react";

type ColorKey   = "violet" | "emerald" | "red" | "amber";
type VariantKey = "primary" | "secondary" | "danger" | "ghost";
type SizeKey    = "sm" | "md" | "lg";

const getToken = () =>
  localStorage.getItem("auth_token") || localStorage.getItem("lucky_boba_token") || "";
const authHeaders = () => ({
  "Content-Type": "application/json",
  "Accept":       "application/json",
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

// ── Types ─────────────────────────────────────────────────────────────────────
interface XReading {
  branch_id:      number;
  branch_name:    string;
  date:           string;
  gross_sales:    number;
  discount:       number;
  net_sales:      number;
  cash:           number;
  gcash:          number;
  card:           number;
  returns:        number;
  total_orders:   number;
  cashier_breakdown?: CashierRow[];
}
interface CashierRow {
  cashier_id:   number;
  cashier_name: string;
  orders:       number;
  gross:        number;
  discount:     number;
  net:          number;
}
interface BranchOption { id: number; name: string; }

// ── Shared UI ─────────────────────────────────────────────────────────────────
interface StatCardProps {
  icon: React.ReactNode; label: string; value: string | number;
  sub?: string; color?: ColorKey;
}
interface BtnProps {
  children: React.ReactNode; variant?: VariantKey; size?: SizeKey;
  onClick?: () => void; className?: string; disabled?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, sub, color = "violet" }) => {
  const colors: Record<ColorKey, { bg: string; border: string; icon: string }> = {
    violet:  { bg: "bg-violet-50",  border: "border-violet-200",  icon: "text-violet-600"  },
    emerald: { bg: "bg-emerald-50", border: "border-emerald-200", icon: "text-emerald-600" },
    red:     { bg: "bg-red-50",     border: "border-red-200",     icon: "text-red-500"     },
    amber:   { bg: "bg-amber-50",   border: "border-amber-200",   icon: "text-amber-600"   },
  };
  const c = colors[color];
  return (
    <div className="bg-white border border-zinc-200 rounded-[0.625rem] px-5 py-4 flex items-center gap-3">
      <div className={`w-10 h-10 ${c.bg} border ${c.border} flex items-center justify-center rounded-[0.4rem] shrink-0`}>
        <span className={c.icon}>{icon}</span>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{label}</p>
        <p className="text-lg font-bold text-[#1a0f2e] tabular-nums">{value}</p>
        {sub && <p className="text-[10px] text-zinc-400 mt-0.5">{sub}</p>}
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
    <button onClick={onClick} disabled={disabled}
      className={`inline-flex items-center gap-1.5 font-bold rounded-lg transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 ${sizes[size]} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

const SkeletonBar: React.FC<{ h?: string }> = ({ h = "h-4" }) => (
  <div className={`w-full ${h} bg-zinc-100 rounded animate-pulse`} />
);

// ── Main Component ─────────────────────────────────────────────────────────────
const XReadingTab: React.FC = () => {
  const today = new Date().toISOString().split("T")[0];

  const [branchId,  setBranchId]  = useState("");
  const [date,      setDate]      = useState(today);
  const [shift,     setShift]     = useState("all");
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [data,      setData]      = useState<XReading | null>(null);
  const [branches,  setBranches]  = useState<BranchOption[]>([]);

  const fmt = (v: number) => `₱${Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  // Fetch branches once
  useEffect(() => {
    fetch("/api/branches", { headers: authHeaders() })
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data.length > 0) {
          setBranches(d.data);
          setBranchId(String(d.data[0].id));
        }
      })
      .catch(() => {});
  }, []);

  const fetchReading = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ branch_id: branchId, date });
      if (shift !== "all") params.set("shift", shift);

      const res  = await fetch(`/api/reports/x-reading?${params}`, { headers: authHeaders() });
      const json = await res.json();

      if (json.success && json.data) {
        setData(json.data);
      } else {
        // Fallback: build from branch analytics
        const branchRes  = await fetch(`/api/branches/${branchId}/analytics`, { headers: authHeaders() });
        const branchData = await branchRes.json();
        if (branchData.success) {
          const d = branchData.data;
          const selectedBranch = branches.find(b => String(b.id) === branchId);
          setData({
            branch_id:    Number(branchId),
            branch_name:  selectedBranch?.name ?? `Branch #${branchId}`,
            date,
            gross_sales:  d.today_total ?? 0,
            discount:     0,
            net_sales:    d.today_total ?? 0,
            cash:         0,
            gcash:        0,
            card:         0,
            returns:      0,
            total_orders: d.total_transactions ?? 0,
            cashier_breakdown: [],
          });
        } else {
          setError("No X Reading data available for this branch and date.");
          setData(null);
        }
      }
    } catch {
      setError("Failed to load X Reading data.");
    } finally {
      setLoading(false);
    }
  }, [branchId, date, shift, branches]);

  useEffect(() => {
    if (branchId) fetchReading();
  }, [fetchReading, branchId]);

  const handlePrint = () => {
    const params = new URLSearchParams({ branch_id: branchId, date });
    window.open(`/api/reports/x-reading/print?${params}`, "_blank");
  };

  const selectedBranchName = branches.find(b => String(b.id) === branchId)?.name ?? "—";

  return (
    <div className="p-6 md:p-8 fade-in flex flex-col gap-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-bold text-[#1a0f2e]">X Reading</h2>
          <p className="text-xs text-zinc-400 mt-0.5">Mid-shift running totals — does not close the shift</p>
        </div>
        <div className="flex items-center gap-2">
          <Btn variant="secondary" onClick={() => fetchReading()} disabled={loading || !branchId}>
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Refresh
          </Btn>
          <Btn onClick={handlePrint} disabled={!data}>
            <Printer size={13} /> Print Report
          </Btn>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="bg-white border border-zinc-200 rounded-[0.625rem] px-5 py-4 flex flex-wrap gap-3 items-end">
        {/* Branch */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1.5">Branch <span className="text-red-400">*</span></p>
          <div className="relative">
            <select value={branchId} onChange={e => setBranchId(e.target.value)}
              className="appearance-none text-sm font-medium text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-lg pl-3 pr-8 py-2 outline-none focus:ring-2 focus:ring-violet-400 cursor-pointer min-w-48">
              <option value="">Select Branch</option>
              {branches.map(b => <option key={b.id} value={String(b.id)}>{b.name}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          </div>
        </div>
        {/* Date */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1.5">Date</p>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="text-sm font-medium text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-violet-400" />
        </div>
        {/* Shift */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1.5">Shift</p>
          <div className="relative">
            <select value={shift} onChange={e => setShift(e.target.value)}
              className="appearance-none text-sm font-medium text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-lg pl-3 pr-8 py-2 outline-none focus:ring-2 focus:ring-violet-400 cursor-pointer">
              <option value="all">All Shifts</option>
              <option value="am">AM Shift</option>
              <option value="pm">PM Shift</option>
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          </div>
        </div>
        <Btn onClick={() => fetchReading()} disabled={loading || !branchId}>
          {loading ? <><RefreshCw size={12} className="animate-spin" /> Loading...</> : "Load Reading"}
        </Btn>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle size={14} className="text-red-500 shrink-0" />
          <p className="text-xs text-red-600 font-medium">{error}</p>
        </div>
      )}

      {/* ── Report Header Badge ── */}
      {!loading && data && (
        <div className="bg-violet-50 border border-violet-200 rounded-[0.625rem] px-5 py-3.5 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#3b2063] rounded-lg flex items-center justify-center">
              <TrendingUp size={14} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-black text-[#3b2063] uppercase tracking-widest">X Reading Report</p>
              <p className="text-[10px] text-violet-500 font-medium">{selectedBranchName} · {date} · {shift === "all" ? "All Shifts" : shift.toUpperCase() + " Shift"}</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-widest rounded-full border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Shift Open
          </span>
        </div>
      )}

      {/* ── Loading skeleton ── */}
      {loading && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <SkeletonBar key={i} h="h-20" />)}
          </div>
          <SkeletonBar h="h-48" />
        </div>
      )}

      {/* ── Main Report ── */}
      {!loading && data && (
        <>
          {/* Sales Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard icon={<DollarSign  size={16} />} label="Gross Sales"   value={fmt(data.gross_sales)}  color="violet"  />
            <StatCard icon={<TrendingUp  size={16} />} label="Net Sales"     value={fmt(data.net_sales)}    color="emerald" />
            <StatCard icon={<ShoppingBag size={16} />} label="Total Orders"  value={data.total_orders}      color="amber"   />
            <StatCard icon={<Users       size={16} />} label="Discount"      value={fmt(data.discount)}     color="red"     />
          </div>

          {/* Payment Breakdown */}
          <div className="bg-white border border-zinc-200 rounded-[0.625rem] overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100">
              <p className="text-sm font-bold text-[#1a0f2e]">Sales Breakdown</p>
              <p className="text-[10px] text-zinc-400 mt-0.5">Revenue by payment method and deductions</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-zinc-100">
              {/* Payment methods */}
              <div className="px-5 py-4 flex flex-col gap-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Payment Methods</p>
                {[
                  { label: "Cash",  value: data.cash,  icon: <Banknote    size={14} />, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
                  { label: "GCash", value: data.gcash, icon: <Smartphone  size={14} />, color: "text-blue-600",    bg: "bg-blue-50",    border: "border-blue-200"    },
                  { label: "Card",  value: data.card,  icon: <CreditCard  size={14} />, color: "text-violet-600",  bg: "bg-violet-50",  border: "border-violet-200"  },
                ].map(pm => (
                  <div key={pm.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 ${pm.bg} border ${pm.border} rounded-lg flex items-center justify-center`}>
                        <span className={pm.color}>{pm.icon}</span>
                      </div>
                      <span className="text-xs font-semibold text-zinc-600">{pm.label}</span>
                    </div>
                    <span className={`text-sm font-black tabular-nums ${pm.color}`}>{fmt(pm.value)}</span>
                  </div>
                ))}
              </div>
              {/* Deductions */}
              <div className="px-5 py-4 flex flex-col gap-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Deductions</p>
                {[
                  { label: "Gross Sales", value: data.gross_sales, isPos: true  },
                  { label: "Discounts",   value: data.discount,    isPos: false },
                  { label: "Returns",     value: data.returns,     isPos: false },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-600">{row.label}</span>
                    <span className={`text-sm font-black tabular-nums ${row.isPos ? "text-[#3b2063]" : "text-red-500"}`}>
                      {row.isPos ? "" : "−"}{fmt(row.value)}
                    </span>
                  </div>
                ))}
                <div className="border-t border-zinc-100 pt-3 flex items-center justify-between">
                  <span className="text-xs font-black text-[#1a0f2e] uppercase tracking-wider">Net Sales</span>
                  <span className="text-base font-black text-emerald-600 tabular-nums">{fmt(data.net_sales)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Cashier Breakdown */}
          {data.cashier_breakdown && data.cashier_breakdown.length > 0 && (
            <div className="bg-white border border-zinc-200 rounded-[0.625rem] overflow-hidden">
              <div className="px-5 py-4 border-b border-zinc-100">
                <p className="text-sm font-bold text-[#1a0f2e]">Per-Cashier Breakdown</p>
                <p className="text-[10px] text-zinc-400 mt-0.5">Individual performance for this shift</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100">
                      {["Cashier", "Orders", "Gross Sales", "Discounts", "Net Sales"].map(h => (
                        <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-zinc-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.cashier_breakdown.map((row, i) => (
                      <tr key={i} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#ede8ff] flex items-center justify-center text-[9px] font-bold text-[#3b2063] shrink-0">
                              {row.cashier_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                            </div>
                            <span className="font-semibold text-[#1a0f2e] text-xs">{row.cashier_name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-zinc-600 text-xs">{row.orders}</td>
                        <td className="px-5 py-3.5 font-bold text-[#3b2063] text-xs">{fmt(row.gross)}</td>
                        <td className="px-5 py-3.5 text-red-500 text-xs">−{fmt(row.discount)}</td>
                        <td className="px-5 py-3.5 font-bold text-emerald-600 text-xs">{fmt(row.net)}</td>
                      </tr>
                    ))}
                    {/* Totals */}
                    <tr className="bg-zinc-50 border-t border-zinc-200">
                      <td className="px-5 py-3.5 font-black text-[#1a0f2e] text-xs uppercase tracking-widest">Total</td>
                      <td className="px-5 py-3.5 font-black text-[#1a0f2e] text-xs">
                        {data.cashier_breakdown.reduce((s, r) => s + r.orders, 0)}
                      </td>
                      <td className="px-5 py-3.5 font-black text-[#3b2063] text-xs">{fmt(data.gross_sales)}</td>
                      <td className="px-5 py-3.5 font-black text-red-500 text-xs">−{fmt(data.discount)}</td>
                      <td className="px-5 py-3.5 font-black text-emerald-600 text-xs">{fmt(data.net_sales)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Empty state ── */}
      {!loading && !data && !error && (
        <div className="flex flex-col items-center justify-center h-48 gap-2 text-zinc-400">
          <TrendingUp size={28} className="text-zinc-200" />
          <p className="text-sm font-semibold">Select a branch to load the X Reading</p>
          <p className="text-xs">Choose a branch and date from the filters above</p>
        </div>
      )}
    </div>
  );
};

export default XReadingTab;