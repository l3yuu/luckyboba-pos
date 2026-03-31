// components/NewSuperAdmin/Tabs/Reports/ZReadingTab.tsx
import { useState, useEffect, useCallback } from "react";
import {
  RefreshCw, AlertCircle, Printer, ChevronDown,
  DollarSign, ShoppingBag, TrendingUp, Lock,
  CreditCard, Banknote, Smartphone, CheckCircle,
  X, History,
} from "lucide-react";
import { createPortal } from "react-dom";

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
interface ZReading {
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
  is_closed:      boolean;
  closed_at?:     string;
  cashier_breakdown?: CashierRow[];
}
interface ZHistory {
  id:         number;
  date:       string;
  branch_name: string;
  gross:      number;
  net:        number;
  total_orders: number;
  closed_at:  string;
  cashier_name?: string;
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
interface BtnProps {
  children: React.ReactNode; variant?: VariantKey; size?: SizeKey;
  onClick?: () => void; className?: string; disabled?: boolean;
}

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

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number; sub?: string; color?: ColorKey }> = ({
  icon, label, value, sub, color = "violet"
}) => {
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

const SkeletonBar: React.FC<{ h?: string }> = ({ h = "h-4" }) => (
  <div className={`w-full ${h} bg-zinc-100 rounded animate-pulse`} />
);

// ── Close Shift Confirm Modal ─────────────────────────────────────────────────
const CloseShiftModal: React.FC<{
  branchName: string;
  date: string;
  netSales: number;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}> = ({ branchName, date, netSales, onConfirm, onCancel, loading }) => {
  const fmt = (v: number) => `₱${Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  return createPortal(
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-6"
      style={{ backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", backgroundColor: "rgba(0,0,0,0.45)" }}>
      <div className="absolute inset-0" onClick={onCancel} />
      <div className="relative bg-white w-full max-w-sm border border-zinc-200 rounded-[1.25rem] shadow-2xl">
        <div className="flex flex-col items-center text-center px-6 pt-8 pb-5">
          <div className="w-14 h-14 bg-red-50 border border-red-200 rounded-full flex items-center justify-center mb-4">
            <Lock size={22} className="text-red-500" />
          </div>
          <p className="text-base font-bold text-[#1a0f2e]">Close Shift?</p>
          <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
            This will permanently close the shift for <span className="font-bold text-zinc-700">{branchName}</span> on <span className="font-bold text-zinc-700">{date}</span>. This action <span className="font-bold text-red-500">cannot be undone</span>.
          </p>
        </div>
        {/* Summary pill */}
        <div className="mx-6 mb-5 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3.5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Branch</span>
            <span className="text-xs font-bold text-zinc-700">{branchName}</span>
          </div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Date</span>
            <span className="text-xs font-bold text-zinc-700">{date}</span>
          </div>
          <div className="flex items-center justify-between border-t border-zinc-200 pt-1.5 mt-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Net Sales</span>
            <span className="text-sm font-black text-emerald-600">{fmt(netSales)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 px-6 pb-6">
          <Btn variant="secondary" className="flex-1 justify-center" onClick={onCancel} disabled={loading}>Cancel</Btn>
          <Btn variant="danger" className="flex-1 justify-center" onClick={onConfirm} disabled={loading}>
            {loading
              ? <span className="flex items-center gap-1.5"><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Closing...</span>
              : <><Lock size={13} /> Close Shift</>}
          </Btn>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
const ZReadingTab: React.FC = () => {
  const today = new Date().toISOString().split("T")[0];

  const [branchId,     setBranchId]     = useState("");
  const [date,         setDate]         = useState(today);
  const [loading,      setLoading]      = useState(false);
  const [closing,      setClosing]      = useState(false);
  const [error,        setError]        = useState("");
  const [toast,        setToast]        = useState("");
  const [data,         setData]         = useState<ZReading | null>(null);
  const [history,      setHistory]      = useState<ZHistory[]>([]);
  const [histLoading,  setHistLoading]  = useState(false);
  const [branches,     setBranches]     = useState<BranchOption[]>([]);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [activeView,   setActiveView]   = useState<"report" | "history">("report");

  const fmt = (v: number) => `₱${Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

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
      const res    = await fetch(`/api/reports/z-reading?${params}`, { headers: authHeaders() });
      const json   = await res.json();

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
            is_closed:    false,
            cashier_breakdown: [],
          });
        } else {
          setError("No Z Reading data available for this branch and date.");
          setData(null);
        }
      }
    } catch {
      setError("Failed to load Z Reading data.");
    } finally {
      setLoading(false);
    }
  }, [branchId, date, branches]);

    const fetchHistory = useCallback(async () => {
    if (!branchId) return;
    setHistLoading(true);
    try {
        const res  = await fetch(`/api/reports/z-reading/history?branch_id=${branchId}`, { headers: authHeaders() });
        if (!res.ok) { setHistory([]); return; } // ← add this line
        const json = await res.json();
        if (json.success && json.data) setHistory(json.data);
        else setHistory([]);
    } catch {
        setHistory([]);
    } finally {
        setHistLoading(false);
    }
    }, [branchId]);

  useEffect(() => {
    if (branchId) {
      fetchReading();
      fetchHistory();
    }
  }, [fetchReading, fetchHistory, branchId]);

  const handleCloseShift = async () => {
    if (!branchId || !data) return;
    setClosing(true);
    try {
      const res  = await fetch("/api/readings/z/close", {
        method:  "POST",
        headers: authHeaders(),
        body:    JSON.stringify({ branch_id: branchId, date }),
      });
      const json = await res.json();
      if (json.success) {
        setData(prev => prev ? { ...prev, is_closed: true, closed_at: new Date().toISOString() } : prev);
        showToast("Shift closed successfully.");
        fetchHistory();
      } else {
        setError(json.message ?? "Failed to close shift.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setClosing(false);
      setShowConfirm(false);
    }
  };

const handlePrint = async () => {
  try {
    const res = await fetch('/api/readings/z/print-token', {
      method:  'POST',
      headers: authHeaders(),
      body:    JSON.stringify({ branch_id: branchId, date }),
    });
    const json = await res.json();
    if (!json.token) { setError('Failed to generate print token.'); return; }

    const params = new URLSearchParams({ branch_id: branchId, date, token: json.token });
    
    // Use anchor click instead of window.open — never blocked by popup blocker
    const a = document.createElement('a');
    a.href = `/api/readings/z/print?${params}`;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

  } catch {
    setError('Failed to open print view.');
  }
};

  const selectedBranchName = branches.find(b => String(b.id) === branchId)?.name ?? "—";

  return (
    <div className="p-6 md:p-8 fade-in flex flex-col gap-5">

      {/* ── Toast ── */}
      {toast && (
        <div className="fixed top-5 right-5 z-9999 bg-emerald-600 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 fade-in">
          <CheckCircle size={14} />
          {toast}
        </div>
      )}

      {/* ── Close Confirm Modal ── */}
      {showConfirm && data && (
        <CloseShiftModal
          branchName={selectedBranchName}
          date={date}
          netSales={data.net_sales}
          onConfirm={handleCloseShift}
          onCancel={() => setShowConfirm(false)}
          loading={closing}
        />
      )}

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-bold text-[#1a0f2e]">Z Reading</h2>
          <p className="text-xs text-zinc-400 mt-0.5">End-of-day closing report — finalizes and locks shift totals</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Btn variant="secondary" onClick={() => fetchReading()} disabled={loading || !branchId}>
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Refresh
          </Btn>
          <Btn variant="secondary" onClick={handlePrint} disabled={!data}>
            <Printer size={13} /> Print
          </Btn>
          {data && !data.is_closed && (
            <Btn variant="danger" onClick={() => setShowConfirm(true)} disabled={loading}>
              <Lock size={13} /> Close Shift
            </Btn>
          )}
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="bg-white border border-zinc-200 rounded-[0.625rem] px-5 py-4 flex flex-wrap gap-3 items-end">
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
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1.5">Date</p>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="text-sm font-medium text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-violet-400" />
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
          <button onClick={() => setError("")} className="ml-auto text-red-300 hover:text-red-500"><X size={14} /></button>
        </div>
      )}

      {/* ── Sub-tabs ── */}
      <div className="flex gap-2 border-b border-zinc-100">
        {([
          { id: "report",  label: "Z Reading Report", icon: <TrendingUp size={12} /> },
          { id: "history", label: "History",           icon: <History    size={12} /> },
        ] as const).map(tab => (
          <button key={tab.id} onClick={() => setActiveView(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors -mb-px ${
              activeView === tab.id
                ? "border-[#3b2063] text-[#3b2063]"
                : "border-transparent text-zinc-400 hover:text-zinc-600"
            }`}>
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {/* ── REPORT VIEW ── */}
      {activeView === "report" && (
        <>
          {/* Loading */}
          {loading && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => <SkeletonBar key={i} h="h-20" />)}
              </div>
              <SkeletonBar h="h-48" />
            </div>
          )}

          {/* Report header badge */}
          {!loading && data && (
            <div className={`border rounded-[0.625rem] px-5 py-3.5 flex items-center justify-between flex-wrap gap-2 ${
              data.is_closed ? "bg-zinc-50 border-zinc-200" : "bg-violet-50 border-violet-200"
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${data.is_closed ? "bg-zinc-700" : "bg-[#3b2063]"}`}>
                  {data.is_closed ? <Lock size={14} className="text-white" /> : <TrendingUp size={14} className="text-white" />}
                </div>
                <div>
                  <p className={`text-xs font-black uppercase tracking-widest ${data.is_closed ? "text-zinc-600" : "text-[#3b2063]"}`}>
                    Z Reading Report
                  </p>
                  <p className={`text-[10px] font-medium ${data.is_closed ? "text-zinc-400" : "text-violet-500"}`}>
                    {selectedBranchName} · {date}
                    {data.closed_at && ` · Closed ${new Date(data.closed_at).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}`}
                  </p>
                </div>
              </div>
              {data.is_closed ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-200 text-zinc-600 text-[10px] font-bold uppercase tracking-widest rounded-full border border-zinc-300">
                  <Lock size={10} /> Shift Closed
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-widest rounded-full border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Shift Open
                </span>
              )}
            </div>
          )}

          {/* Stat Cards */}
          {!loading && data && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCard icon={<DollarSign  size={16} />} label="Gross Sales"  value={fmt(data.gross_sales)}  color="violet"  />
                <StatCard icon={<TrendingUp  size={16} />} label="Net Sales"    value={fmt(data.net_sales)}    color="emerald" />
                <StatCard icon={<ShoppingBag size={16} />} label="Total Orders" value={data.total_orders}      color="amber"   />
                <StatCard icon={<Lock        size={16} />} label="Discounts"    value={fmt(data.discount)}     color="red"     />
              </div>

              {/* Payment + Deductions */}
              <div className="bg-white border border-zinc-200 rounded-[0.625rem] overflow-hidden">
                <div className="px-5 py-4 border-b border-zinc-100">
                  <p className="text-sm font-bold text-[#1a0f2e]">End-of-Day Breakdown</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-zinc-100">
                  <div className="px-5 py-4 flex flex-col gap-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Payment Methods</p>
                    {[
                      { label: "Cash",  value: data.cash,  icon: <Banknote   size={14} />, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
                      { label: "GCash", value: data.gcash, icon: <Smartphone size={14} />, color: "text-blue-600",    bg: "bg-blue-50",    border: "border-blue-200"    },
                      { label: "Card",  value: data.card,  icon: <CreditCard size={14} />, color: "text-violet-600",  bg: "bg-violet-50",  border: "border-violet-200"  },
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
                  <div className="px-5 py-4 flex flex-col gap-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Summary</p>
                    {[
                      { label: "Gross Sales", value: data.gross_sales, isPos: true,  isBold: false },
                      { label: "Discounts",   value: data.discount,    isPos: false, isBold: false },
                      { label: "Returns",     value: data.returns,     isPos: false, isBold: false },
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

              {/* Cashier breakdown */}
              {data.cashier_breakdown && data.cashier_breakdown.length > 0 && (
                <div className="bg-white border border-zinc-200 rounded-[0.625rem] overflow-hidden">
                  <div className="px-5 py-4 border-b border-zinc-100">
                    <p className="text-sm font-bold text-[#1a0f2e]">Per-Cashier Breakdown</p>
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

              {/* Close Shift CTA — only if open */}
              {!data.is_closed && (
                <div className="bg-red-50 border border-red-200 rounded-[0.625rem] px-5 py-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold text-red-700">Ready to close the shift?</p>
                    <p className="text-[10px] text-red-400 mt-0.5">This will lock all sales data for {selectedBranchName} on {date}. This cannot be undone.</p>
                  </div>
                  <Btn variant="danger" onClick={() => setShowConfirm(true)}>
                    <Lock size={13} /> Close Shift
                  </Btn>
                </div>
              )}
            </>
          )}

          {/* Empty state */}
          {!loading && !data && !error && (
            <div className="flex flex-col items-center justify-center h-48 gap-2 text-zinc-400">
              <Lock size={28} className="text-zinc-200" />
              <p className="text-sm font-semibold">Select a branch to load the Z Reading</p>
              <p className="text-xs">Choose a branch and date from the filters above</p>
            </div>
          )}
        </>
      )}

      {/* ── HISTORY VIEW ── */}
      {activeView === "history" && (
        <div className="bg-white border border-zinc-200 rounded-[0.625rem] overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
            <p className="text-sm font-bold text-[#1a0f2e]">Z Reading History</p>
            <Btn variant="secondary" size="sm" onClick={() => fetchHistory()} disabled={histLoading}>
              <RefreshCw size={11} className={histLoading ? "animate-spin" : ""} />
            </Btn>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100">
                  {["Date", "Branch", "Total Orders", "Gross Sales", "Net Sales", "Closed At", "Status"].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-zinc-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {histLoading && [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-zinc-50">
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-3 bg-zinc-100 rounded animate-pulse" style={{ width: `${50 + Math.random() * 40}%` }} />
                      </td>
                    ))}
                  </tr>
                ))}
                {!histLoading && history.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-zinc-400 text-xs font-medium">
                      No Z Reading history found for this branch.
                    </td>
                  </tr>
                )}
                {!histLoading && history.map((h, i) => (
                  <tr key={i} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-zinc-700 text-xs">{h.date}</td>
                    <td className="px-5 py-3.5 text-zinc-600 text-xs">{h.branch_name}</td>
                    <td className="px-5 py-3.5 text-zinc-600 text-xs">{Number(h.total_orders).toLocaleString()}</td>
                    <td className="px-5 py-3.5 font-bold text-[#3b2063] text-xs">{fmt(Number(h.gross))}</td>
                    <td className="px-5 py-3.5 font-bold text-emerald-600 text-xs">{fmt(Number(h.net))}</td>
                    <td className="px-5 py-3.5 text-zinc-400 text-xs">
                      {h.closed_at ? new Date(h.closed_at).toLocaleString("en-PH", {
                        month: "short", day: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      }) : "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        h.closed_at ? "bg-zinc-100 text-zinc-500 border border-zinc-200" : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                      }`}>
                        {h.closed_at ? <><Lock size={8} /> Closed</> : <><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Open</>}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ZReadingTab;