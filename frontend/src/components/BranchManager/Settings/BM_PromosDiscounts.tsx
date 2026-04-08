// BM_PromosDiscounts.tsx — Read-only Promos & Discounts for Branch Manager
// Matches SuperAdmin PromotionsTab UI but removes Create / Edit / Delete.
// Branch Manager can only toggle discounts ON / OFF.
import { useState, useEffect, useCallback } from "react";
import {
  Tag, CheckCircle, XCircle, RefreshCw, AlertCircle,
  ToggleLeft, ToggleRight, MapPin, Calendar,
} from "lucide-react";

// ── Auth ─────────────────────────────────────────────────────────────────────
const getToken = () =>
  localStorage.getItem("auth_token") || localStorage.getItem("lucky_boba_token") || "";
const authHeaders = () => ({
  "Content-Type": "application/json",
  Accept:         "application/json",
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

// ── Types ─────────────────────────────────────────────────────────────────────
interface Branch  { id: number; name: string; }
interface Discount {
  id:         number;
  name:       string;
  code:       string | null;
  amount:     number;
  type:       string;
  status:     "ON" | "OFF";
  used_count: number;
  starts_at:  string | null;
  ends_at:    string | null;
  branches:   Branch[];
  created_at: string;
}

// ── Utilities ─────────────────────────────────────────────────────────────────
const todayStr = () => new Date().toISOString().split("T")[0];

const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : null;

const formatAmount = (type: string, amount: number): string => {
  const t = (type ?? "").toLowerCase();
  if (t.includes("percent") || t === "percentage") return `${amount}%`;
  if (t === "fixed") return `₱${Number(amount).toLocaleString()}`;
  return `${amount}`;
};

// ── Stat Card ─────────────────────────────────────────────────────────────────
type ColorKey = "violet" | "emerald" | "red" | "amber";
const StatCard: React.FC<{
  icon: React.ReactNode; label: string; value: string | number; color?: ColorKey;
}> = ({ icon, label, value, color = "violet" }) => {
  const colors: Record<ColorKey, { bg: string; border: string; icon: string }> = {
    violet:  { bg: "bg-violet-50",  border: "border-violet-200",  icon: "text-violet-600"  },
    emerald: { bg: "bg-emerald-50", border: "border-emerald-200", icon: "text-emerald-600" },
    red:     { bg: "bg-red-50",     border: "border-red-200",     icon: "text-red-500"     },
    amber:   { bg: "bg-amber-50",   border: "border-amber-200",   icon: "text-amber-600"   },
  };
  const c = colors[color];
  return (
    <div className="bg-white border border-zinc-200 rounded-[0.625rem] px-6 py-5 flex items-center gap-3">
      <div className={`w-10 h-10 ${c.bg} border ${c.border} flex items-center justify-center rounded-[0.4rem] shrink-0`}>
        <span className={c.icon}>{icon}</span>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{label}</p>
        <p className="text-xl font-bold text-[#1a0f2e] tabular-nums">{value}</p>
      </div>
    </div>
  );
};

// ── Discount Card ─────────────────────────────────────────────────────────────
const DiscountCard: React.FC<{
  discount: Discount;
  onToggle: (d: Discount) => void;
  toggling: boolean;
}> = ({ discount, onToggle, toggling }) => {
  const isOn = discount.status === "ON";
  const branchLabel = discount.branches.length === 0
    ? "All branches"
    : discount.branches.map(b => b.name).join(", ");

  const now     = todayStr();
  const expired = !!discount.ends_at   && discount.ends_at   < now;
  const notYet  = !!discount.starts_at && discount.starts_at > now;

  return (
    <div className={`bg-white rounded-xl overflow-hidden border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
      expired ? "border-red-200" : isOn ? "border-emerald-200" : "border-zinc-200"
    }`}>

      {/* Top accent bar */}
      <div className={`h-1 w-full ${expired ? "bg-red-400" : isOn ? "bg-emerald-400" : "bg-zinc-300"}`} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className={`w-9 h-9 shrink-0 rounded-lg flex items-center justify-center border ${
              isOn && !expired ? "bg-emerald-50 border-emerald-200"
              : expired        ? "bg-red-50 border-red-200"
              :                  "bg-zinc-100 border-zinc-200"
            }`}>
              <Tag size={14} className={
                isOn && !expired ? "text-emerald-600"
                : expired        ? "text-red-400"
                :                  "text-zinc-400"
              } />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-[#1a0f2e] text-sm leading-tight truncate mb-0.5">{discount.name}</p>
              {discount.code
                ? <code className="text-[9px] font-bold bg-violet-50 text-violet-600 px-2 py-0.5 rounded-full border border-violet-200 tracking-widest">{discount.code}</code>
                : <span className="text-[9px] text-zinc-300 font-medium italic">No promo code</span>
              }
            </div>
          </div>

          {/* Status badges */}
          <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
              isOn ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                   : "text-zinc-500 bg-zinc-100 border-zinc-200"
            }`}>{discount.status}</span>
            {expired  && <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold border text-red-600   bg-red-50   border-red-200">EXPIRED</span>}
            {notYet && !expired && <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold border text-amber-600 bg-amber-50 border-amber-200">UPCOMING</span>}
          </div>
        </div>

        {/* Stats box */}
        <div className="grid grid-cols-2 gap-3 mb-3 p-3 bg-zinc-50 rounded-lg border border-zinc-100">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-0.5">Type</p>
            <p className="text-xs font-bold text-zinc-700">{discount.type}</p>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-0.5">Amount</p>
            <p className="text-xs font-bold text-zinc-700">{formatAmount(discount.type, discount.amount)}</p>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-0.5">Used</p>
            <p className="text-xs font-bold text-zinc-700">{discount.used_count.toLocaleString()}×</p>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-0.5">Branches</p>
            <p className="text-xs font-bold text-zinc-700 truncate" title={branchLabel}>{branchLabel}</p>
          </div>
        </div>

        {/* Date range */}
        {(discount.starts_at || discount.ends_at) && (
          <div className={`flex items-center gap-1.5 text-[10px] font-medium mb-3 px-2.5 py-1.5 rounded-lg border ${
            expired ? "text-red-500 bg-red-50 border-red-100"
                    : "text-zinc-500 bg-zinc-50 border-zinc-100"
          }`}>
            <Calendar size={9} className="shrink-0" />
            <span>{formatDate(discount.starts_at) ?? "Now"}</span>
            <span className="text-zinc-300 mx-0.5">→</span>
            <span>{formatDate(discount.ends_at) ?? "No expiry"}</span>
          </div>
        )}

        {/* Branch pills */}
        {discount.branches.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {discount.branches.map(b => (
              <span key={b.id} className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-violet-50 border border-violet-200 text-[9px] font-bold text-violet-600">
                <MapPin size={7} />{b.name}
              </span>
            ))}
          </div>
        )}

        {/* Toggle only — no Edit / Delete */}
        <div className="flex items-center pt-3 border-t border-zinc-100">
          <button
            onClick={() => onToggle(discount)}
            disabled={toggling}
            className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-lg border transition-all disabled:opacity-50 ${
              isOn ? "text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100"
                   : "text-zinc-500 bg-zinc-50 border-zinc-200 hover:bg-zinc-100"
            }`}
          >
            {toggling
              ? <RefreshCw size={11} className="animate-spin" />
              : isOn
                ? <ToggleRight size={13} />
                : <ToggleLeft  size={13} />}
            {isOn ? "Turn OFF" : "Turn ON"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
const BM_PromosDiscounts: React.FC = () => {
  const [discounts,  setDiscounts]  = useState<Discount[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res  = await fetch("/api/discounts", { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error("Failed to load discounts.");
      const toArray = (v: unknown): unknown[] =>
        Array.isArray(v) ? v : ((v as Record<string, unknown>)?.data ?? []) as unknown[];
      setDiscounts(toArray(data) as Discount[]);
    } catch { setError("Failed to load discounts."); }
    finally  { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleToggle = async (discount: Discount) => {
    setTogglingId(discount.id);
    try {
      const res  = await fetch(`/api/discounts/${discount.id}/toggle`, { method: "PUT", headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error();
      setDiscounts(prev => prev.map(d => d.id === discount.id ? data : d));
    } catch { setError("Failed to update status."); }
    finally  { setTogglingId(null); }
  };

  const activeCount = discounts.filter(d => d.status === "ON").length;
  const totalUsed   = discounts.reduce((s, d) => s + d.used_count, 0);

  return (
    <div className="p-6 md:p-8 fade-in">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-bold text-[#1a0f2e]">Promotions & Discounts</h2>
          <p className="text-xs text-zinc-400 mt-0.5">View and toggle active discounts for this branch</p>
        </div>
        <button
          onClick={fetchAll}
          disabled={loading}
          className="inline-flex items-center gap-1.5 font-bold rounded-lg transition-all px-3 py-2 text-xs bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 active:scale-[0.98]"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle size={14} className="text-red-500 shrink-0" />
          <p className="text-xs text-red-600 font-medium">{error}</p>
          <button
            onClick={fetchAll}
            className="ml-auto inline-flex items-center gap-1.5 font-bold rounded-lg px-3 py-2 text-xs bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
          >
            Retry
          </button>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<Tag         size={16} />} label="Total Discounts" value={loading ? "—" : discounts.length}                color="violet"  />
        <StatCard icon={<CheckCircle size={16} />} label="Active"          value={loading ? "—" : activeCount}                    color="emerald" />
        <StatCard icon={<XCircle     size={16} />} label="Inactive"        value={loading ? "—" : discounts.length - activeCount} color="red"     />
        <StatCard icon={<RefreshCw   size={16} />} label="Total Uses"      value={loading ? "—" : totalUsed.toLocaleString()}     color="amber"   />
      </div>

      {/* Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white border border-zinc-200 rounded-xl overflow-hidden animate-pulse">
              <div className="h-1 bg-zinc-100" />
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-zinc-100 rounded-lg shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3 bg-zinc-100 rounded w-28" />
                    <div className="h-2.5 bg-zinc-100 rounded w-16" />
                  </div>
                </div>
                <div className="h-16 bg-zinc-50 rounded-lg border border-zinc-100" />
                <div className="flex justify-between pt-2 border-t border-zinc-100">
                  <div className="h-6 bg-zinc-100 rounded-lg w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && discounts.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 bg-violet-50 border border-violet-200 rounded-full flex items-center justify-center mb-3">
            <Tag size={22} className="text-violet-400" />
          </div>
          <p className="text-sm font-bold text-zinc-600">No discounts available</p>
          <p className="text-xs text-zinc-400 mt-1">Discounts are managed by the Super Admin.</p>
        </div>
      )}

      {/* Cards */}
      {!loading && discounts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {discounts.map(d => (
            <DiscountCard
              key={d.id}
              discount={d}
              onToggle={handleToggle}
              toggling={togglingId === d.id}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default BM_PromosDiscounts;
