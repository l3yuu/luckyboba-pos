// components/NewSuperAdmin/Tabs/PromotionsTab.tsx
import { useState, useEffect, useCallback } from "react";
import {
  Plus, Trash2, CheckCircle, XCircle,
  Tag, RefreshCw, AlertCircle, ToggleLeft, ToggleRight, X, MapPin,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────
type ColorKey   = "violet" | "emerald" | "red" | "amber";
type VariantKey = "primary" | "secondary" | "danger" | "ghost";
type SizeKey    = "sm" | "md" | "lg";

interface Branch {
  id:   number;
  name: string;
}

interface Discount {
  id:         number;
  name:       string;
  amount:     number;
  type:       string;
  status:     "ON" | "OFF";
  used_count: number;
  branches:   Branch[];
  created_at: string;
}

interface FormData {
  name:       string;
  amount:     string;
  type:       string;
  status:     "ON" | "OFF";
  branch_ids: number[];
}

// ── Auth helpers ───────────────────────────────────────────────────────────────
const getToken = () =>
  localStorage.getItem("auth_token") || localStorage.getItem("lucky_boba_token") || "";
const authHeaders = () => ({
  "Content-Type": "application/json",
  "Accept":       "application/json",
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

// ── Shared UI ──────────────────────────────────────────────────────────────────
const Btn: React.FC<{
  children: React.ReactNode; variant?: VariantKey; size?: SizeKey;
  onClick?: () => void; className?: string; disabled?: boolean;
  type?: "button" | "submit" | "reset";
}> = ({ children, variant = "primary", size = "sm", onClick, className = "", disabled = false, type = "button" }) => {
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
    <div className="bg-white border border-zinc-200 rounded-[0.625rem] px-6 py-5 flex items-center gap-3 card">
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

// ── Branch multi-select ────────────────────────────────────────────────────────
const BranchPicker: React.FC<{
  branches:   Branch[];
  selected:   number[];
  onChange:   (ids: number[]) => void;
}> = ({ branches, selected, onChange }) => {
  const toggle = (id: number) =>
    onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]);

  if (branches.length === 0)
    return <p className="text-xs text-zinc-400 italic">No branches available.</p>;

  return (
    <div className="flex flex-wrap gap-2">
      {branches.map(b => {
        const active = selected.includes(b.id);
        return (
          <button key={b.id} type="button" onClick={() => toggle(b.id)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
              active
                ? "bg-violet-100 border-violet-300 text-violet-700"
                : "bg-zinc-50 border-zinc-200 text-zinc-400 hover:border-zinc-300"
            }`}>
            <MapPin size={9} />
            {b.name}
          </button>
        );
      })}
    </div>
  );
};

// ── Modal ──────────────────────────────────────────────────────────────────────
const DISCOUNT_TYPES = ["Percentage", "Fixed", "BOGO"];

const DiscountModal: React.FC<{
  onClose:  () => void;
  onSaved:  (d: Discount) => void;
  branches: Branch[];
}> = ({ onClose, onSaved, branches }) => {
  const [form,   setForm]   = useState<FormData>({ name: "", amount: "", type: "Percentage", status: "ON", branch_ids: [] });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const set = <K extends keyof FormData>(k: K, v: FormData[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const validate = (): boolean => {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (!form.name.trim())                                       e.name   = "Name is required.";
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0)
                                                                 e.amount = "Enter a valid amount.";
    if (!form.type)                                              e.type   = "Select a type.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const res  = await fetch("/api/discounts", {
        method:  "POST",
        headers: authHeaders(),
        body:    JSON.stringify({ ...form, amount: Number(form.amount) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Failed to create discount.");
      onSaved(data);
      onClose();
    } catch (err: unknown) {
      setErrors({ name: err instanceof Error ? err.message : "Something went wrong." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-in fade-in slide-in-from-bottom-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-bold text-[#1a0f2e]">Create Discount</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Add a new discount to the system</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-100 rounded-lg transition-colors text-zinc-400">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">Discount Name</label>
            <input value={form.name} onChange={e => set("name", e.target.value)}
              placeholder="e.g. Birthday Discount"
              className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2.5 text-sm text-zinc-700 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all placeholder:text-zinc-400" />
            {errors.name && <p className="text-[10px] text-red-500 mt-1 font-medium">{errors.name}</p>}
          </div>

          {/* Type + Amount */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">Type</label>
              <select value={form.type} onChange={e => set("type", e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2.5 text-sm text-zinc-600 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all">
                {DISCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">
                Amount {form.type === "Percentage" ? "(%)" : form.type === "Fixed" ? "(₱)" : "(units)"}
              </label>
              <input type="number" min="0" step="0.01" value={form.amount}
                onChange={e => set("amount", e.target.value)} placeholder="0"
                className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2.5 text-sm text-zinc-700 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all placeholder:text-zinc-400" />
              {errors.amount && <p className="text-[10px] text-red-500 mt-1 font-medium">{errors.amount}</p>}
            </div>
          </div>

          {/* Branches */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">
              Branches <span className="normal-case font-normal text-zinc-400">(leave empty = all branches)</span>
            </label>
            <BranchPicker branches={branches} selected={form.branch_ids}
              onChange={ids => set("branch_ids", ids)} />
          </div>

          {/* Status */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">Initial Status</label>
            <div className="flex items-center gap-3">
              {(["ON", "OFF"] as const).map(s => (
                <button key={s} type="button" onClick={() => set("status", s)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                    form.status === s
                      ? s === "ON" ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                                   : "bg-red-50 border-red-300 text-red-600"
                      : "bg-zinc-50 border-zinc-200 text-zinc-400"
                  }`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-zinc-100">
          <Btn variant="secondary" onClick={onClose} disabled={saving}>Cancel</Btn>
          <Btn onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving…" : <><Plus size={13} /> Create Discount</>}
          </Btn>
        </div>
      </div>
    </div>
  );
};

// ── Discount Card ──────────────────────────────────────────────────────────────
const DiscountCard: React.FC<{
  discount: Discount;
  onToggle: (d: Discount) => void;
  onDelete: (d: Discount) => void;
  toggling: boolean;
  deleting: boolean;
}> = ({ discount, onToggle, onDelete, toggling, deleting }) => {
  const isOn = discount.status === "ON";

  const formatAmount = () => {
    if (discount.type === "Percentage") return `${discount.amount}%`;
    if (discount.type === "Fixed")      return `₱${Number(discount.amount).toLocaleString()}`;
    return `${discount.amount}×`;
  };

  const branchLabel = discount.branches.length === 0
    ? "All branches"
    : discount.branches.map(b => b.name).join(", ");

  return (
    <div className={`bg-white border rounded-[0.625rem] p-5 card transition-opacity ${deleting ? "opacity-50" : ""}`}
      style={{ borderColor: isOn ? "#d1fae5" : "#e4e4e7" }}>

      {/* Top row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-[0.4rem] flex items-center justify-center border ${
            isOn ? "bg-emerald-50 border-emerald-200" : "bg-zinc-100 border-zinc-200"}`}>
            <Tag size={13} className={isOn ? "text-emerald-600" : "text-zinc-400"} />
          </div>
          <p className="font-bold text-[#1a0f2e] text-sm">{discount.name}</p>
        </div>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
          isOn ? "text-emerald-700 bg-emerald-50 border-emerald-200"
               : "text-zinc-500 bg-zinc-100 border-zinc-200"
        }`}>
          {discount.status}
        </span>
      </div>

      {/* Fields grid */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Type</p>
          <p className="text-xs font-semibold text-zinc-700 mt-0.5">{discount.type}</p>
        </div>
        <div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Amount</p>
          <p className="text-xs font-semibold text-zinc-700 mt-0.5">{formatAmount()}</p>
        </div>
        <div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Used</p>
          <p className="text-xs font-semibold text-zinc-700 mt-0.5">{discount.used_count.toLocaleString()}×</p>
        </div>
        <div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Branches</p>
          <p className="text-xs font-semibold text-zinc-700 mt-0.5 truncate" title={branchLabel}>{branchLabel}</p>
        </div>
      </div>

      {/* Branch pills (if specific branches) */}
      {discount.branches.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {discount.branches.map(b => (
            <span key={b.id} className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-violet-50 border border-violet-200 text-[9px] font-bold text-violet-600">
              <MapPin size={7} />{b.name}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
        <button onClick={() => onToggle(discount)} disabled={toggling || deleting}
          className={`flex items-center gap-1.5 text-[10px] font-bold transition-colors disabled:opacity-50 ${
            isOn ? "text-emerald-600 hover:text-emerald-700" : "text-zinc-400 hover:text-zinc-600"
          }`}>
          {toggling
            ? <RefreshCw size={12} className="animate-spin" />
            : isOn ? <ToggleRight size={14} /> : <ToggleLeft size={14} />
          }
          {isOn ? "Turn OFF" : "Turn ON"}
        </button>

        <button onClick={() => onDelete(discount)} disabled={toggling || deleting}
          className="p-1.5 hover:bg-red-50 rounded-[0.4rem] text-zinc-400 hover:text-red-500 transition-colors disabled:opacity-40">
          {deleting ? <RefreshCw size={12} className="animate-spin text-red-400" /> : <Trash2 size={12} />}
        </button>
      </div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
const PromotionsTab: React.FC = () => {
  const [discounts,  setDiscounts]  = useState<Discount[]>([]);
  const [branches,   setBranches]   = useState<Branch[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [showModal,  setShowModal]  = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [dRes, bRes] = await Promise.all([
        fetch("/api/discounts", { headers: authHeaders() }),
        fetch("/api/branches",  { headers: authHeaders() }),
      ]);
      const [dData, bData] = await Promise.all([dRes.json(), bRes.json()]);
      if (!dRes.ok) throw new Error("Failed to load discounts.");
      setDiscounts(dData);
      setBranches(bRes.ok ? bData : []);
    } catch {
      setError("Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Toggle ─────────────────────────────────────────────────────────────────
  const handleToggle = async (discount: Discount) => {
    setTogglingId(discount.id);
    try {
      const res  = await fetch(`/api/discounts/${discount.id}/toggle`, {
        method: "PUT", headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error("Failed to toggle.");
      setDiscounts(prev => prev.map(d => d.id === discount.id ? data : d));
    } catch {
      setError("Failed to update status.");
    } finally {
      setTogglingId(null);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (discount: Discount) => {
    if (!window.confirm(`Delete "${discount.name}"? This cannot be undone.`)) return;
    setDeletingId(discount.id);
    try {
      const res = await fetch(`/api/discounts/${discount.id}`, {
        method: "DELETE", headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Failed to delete.");
      setDiscounts(prev => prev.filter(d => d.id !== discount.id));
    } catch {
      setError("Failed to delete discount.");
    } finally {
      setDeletingId(null);
    }
  };

  const activeCount   = discounts.filter(d => d.status === "ON").length;
  const inactiveCount = discounts.filter(d => d.status === "OFF").length;
  const totalUsed     = discounts.reduce((s, d) => s + d.used_count, 0);

  return (
    <div className="p-6 md:p-8 fade-in">
      {showModal && (
        <DiscountModal
          branches={branches}
          onClose={() => setShowModal(false)}
          onSaved={d => setDiscounts(prev => [d, ...prev])}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-bold text-[#1a0f2e]">Promotions & Discounts</h2>
          <p className="text-xs text-zinc-400 mt-0.5">Manage system-wide discounts across all branches</p>
        </div>
        <div className="flex items-center gap-2">
          <Btn variant="secondary" onClick={fetchAll} disabled={loading}>
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          </Btn>
          <Btn onClick={() => setShowModal(true)}><Plus size={13} /> Create Discount</Btn>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle size={14} className="text-red-500 shrink-0" />
          <p className="text-xs text-red-600 font-medium">{error}</p>
          <Btn variant="secondary" size="sm" onClick={fetchAll} className="ml-auto">Retry</Btn>
        </div>
      )}

      {/* Stat cards — now 4 including total uses */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<Tag         size={16} />} label="Total Discounts" value={loading ? "—" : discounts.length}            color="violet"  />
        <StatCard icon={<CheckCircle size={16} />} label="Active"          value={loading ? "—" : activeCount}                 color="emerald" />
        <StatCard icon={<XCircle     size={16} />} label="Inactive"        value={loading ? "—" : inactiveCount}               color="red"     />
        <StatCard icon={<RefreshCw   size={16} />} label="Total Uses"      value={loading ? "—" : totalUsed.toLocaleString()}  color="amber"   />
      </div>

      {/* Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white border border-zinc-200 rounded-[0.625rem] p-5 animate-pulse space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-zinc-100 rounded-[0.4rem]" />
                <div className="h-3 bg-zinc-100 rounded w-32" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[...Array(4)].map((_, j) => <div key={j} className="h-3 bg-zinc-100 rounded" />)}
              </div>
              <div className="h-3 bg-zinc-100 rounded w-24" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && discounts.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-12 h-12 bg-violet-50 border border-violet-200 rounded-full flex items-center justify-center mb-3">
            <Tag size={20} className="text-violet-400" />
          </div>
          <p className="text-sm font-bold text-zinc-500">No discounts yet</p>
          <p className="text-xs text-zinc-400 mt-1 mb-4">Create your first discount to get started.</p>
          <Btn onClick={() => setShowModal(true)}><Plus size={13} /> Create Discount</Btn>
        </div>
      )}

      {/* Cards */}
      {!loading && discounts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {discounts.map(d => (
            <DiscountCard key={d.id} discount={d}
              onToggle={handleToggle} onDelete={handleDelete}
              toggling={togglingId === d.id} deleting={deletingId === d.id}
            />
          ))}
          <button onClick={() => setShowModal(true)}
            className="bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-[0.625rem] p-5 flex flex-col items-center justify-center gap-2 hover:border-violet-300 hover:bg-violet-50 transition-all group min-h-48">
            <div className="w-10 h-10 rounded-full bg-zinc-200 group-hover:bg-violet-200 flex items-center justify-center transition-colors">
              <Plus size={18} className="text-zinc-400 group-hover:text-violet-600 transition-colors" />
            </div>
            <p className="text-xs font-bold text-zinc-400 group-hover:text-violet-600 transition-colors">Create New Discount</p>
          </button>
        </div>
      )}
    </div>
  );
};

export default PromotionsTab;