// components/NewSuperAdmin/Tabs/PromotionsTab.tsx
import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Plus, Trash2, CheckCircle, XCircle, Tag, RefreshCw,
  AlertCircle, ToggleLeft, ToggleRight, X, MapPin, Edit2,
  Shuffle, Calendar, AlertTriangle, Search,
} from "lucide-react";
import { useToast } from "../../../../hooks/useToast";
import { triggerSync } from "../../../../utils/sync";

// ── Types ──────────────────────────────────────────────────────────────────────
type ColorKey = "violet" | "emerald" | "red" | "amber";
type VariantKey = "primary" | "secondary" | "danger" | "ghost";
type SizeKey = "sm" | "md" | "lg";

interface Branch { id: number; name: string; }

interface Discount {
  id: number;
  name: string;
  code: string | null;
  amount: number;
  type: string;
  status: "ON" | "OFF";
  used_count: number;
  starts_at: string | null;
  ends_at: string | null;
  branches: Branch[];
  created_at: string;
}

interface FormData {
  name: string;
  code: string;
  amount: string;
  type: string;
  status: "ON" | "OFF";
  starts_at: string;
  ends_at: string;
  branch_ids: number[];
}

type FormErrors = Partial<Record<keyof FormData, string>>;

// ── Auth helpers ───────────────────────────────────────────────────────────────
const getToken = () =>
  localStorage.getItem("auth_token") || localStorage.getItem("lucky_boba_token") || "";
const authHeaders = () => ({
  "Content-Type": "application/json",
  Accept: "application/json",
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

// ── Utilities ──────────────────────────────────────────────────────────────────
const DISCOUNT_TYPES = ["Global-Percent", "Item-Percent"];

const generateCode = () =>
  Math.random().toString(36).slice(2, 6).toUpperCase() +
  Math.random().toString(36).slice(2, 6).toUpperCase();

const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : null;

const todayStr = () => new Date().toISOString().split("T")[0];

const formatAmount = (type: string, amount: number): string => {
  const t = (type ?? "").toLowerCase();
  if (t.includes("percent") || t === "percentage") return `${amount}%`;
  if (t === "fixed") return `₱${Number(amount).toLocaleString()}`;
  if (t === "bogo") return `Buy ${amount} Get 1`;
  return `${amount}×`;
};

const amountLabel = (type: string): string => {
  const t = (type ?? "").toLowerCase();
  if (t.includes("percent") || t === "percentage") return "(%)";
  if (t === "fixed") return "(₱)";
  return "(units)";
};

// ── Shared UI ──────────────────────────────────────────────────────────────────
const Btn: React.FC<{
  children: React.ReactNode; variant?: VariantKey; size?: SizeKey;
  onClick?: () => void; className?: string; disabled?: boolean;
  type?: "button" | "submit" | "reset";
}> = ({ children, variant = "primary", size = "sm", onClick, className = "", disabled = false, type = "button" }) => {
  const sizes: Record<SizeKey, string> = { sm: "px-3 py-2 text-xs", md: "px-4 py-2.5 text-sm", lg: "px-6 py-3 text-sm" };
  const variants: Record<VariantKey, string> = {
    primary: "bg-[#a020f0] hover:bg-[#2a1647] text-white",
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

const StatCard: React.FC<{
  icon: React.ReactNode; label: string; value: string | number; color?: ColorKey;
}> = ({ icon, label, value, color = "violet" }) => {
  const colors: Record<ColorKey, { bg: string; border: string; icon: string }> = {
    violet: { bg: "bg-violet-50", border: "border-violet-200", icon: "text-violet-600" },
    emerald: { bg: "bg-emerald-50", border: "border-emerald-200", icon: "text-emerald-600" },
    red: { bg: "bg-red-50", border: "border-red-200", icon: "text-red-500" },
    amber: { bg: "bg-amber-50", border: "border-amber-200", icon: "text-amber-600" },
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

const Field: React.FC<{ label: React.ReactNode; error?: string; children: React.ReactNode }> = ({ label, error, children }) => (
  <div>
    <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">{label}</label>
    {children}
    {error && <p className="text-[10px] text-red-500 mt-1 font-medium">{error}</p>}
  </div>
);

const inputCls = "w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2.5 text-sm text-zinc-700 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all placeholder:text-zinc-400";

// ── Branch picker ──────────────────────────────────────────────────────────────
const BranchPicker: React.FC<{
  branches: Branch[]; selected: number[]; onChange: (ids: number[]) => void;
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
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${active ? "bg-violet-100 border-violet-300 text-violet-700"
                : "bg-zinc-50 border-zinc-200 text-zinc-400 hover:border-zinc-300"
              }`}>
            <MapPin size={9} />{b.name}
          </button>
        );
      })}
    </div>
  );
};

// ── Shared portal backdrop (same pattern as BranchesTab) ───────────────────────
const BACKDROP_STYLE: React.CSSProperties = {
  backdropFilter: "blur(6px)",
  WebkitBackdropFilter: "blur(6px)",
  backgroundColor: "rgba(0,0,0,0.45)",
};

// ── Delete Confirm Modal ───────────────────────────────────────────────────────
const DeleteModal: React.FC<{
  discount: Discount;
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
}> = ({ discount, onConfirm, onCancel, deleting }) =>
    createPortal(
      <div
        className="fixed inset-0 z-9999 flex items-center justify-center p-6"
        style={BACKDROP_STYLE}
      >
        {/* backdrop click */}
        <div className="absolute inset-0" onClick={onCancel} />

        <div className="relative bg-white w-full max-w-sm border border-zinc-200 rounded-[1.25rem] shadow-2xl">
          {/* Icon + copy */}
          <div className="flex flex-col items-center text-center px-6 pt-8 pb-5">
            <div className="w-14 h-14 bg-red-50 border border-red-200 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle size={26} className="text-red-500" />
            </div>
            <p className="text-base font-bold text-[#1a0f2e]">Delete Discount?</p>
            <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
              You're about to permanently delete{" "}
              <span className="font-bold text-zinc-700">"{discount.name}"</span>.
              This action cannot be undone.
            </p>
          </div>

          {/* Discount info pill */}
          <div className="mx-6 mb-5 p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-center">
            <p className="text-sm font-bold text-[#1a0f2e]">{discount.name}</p>
            {discount.code && (
              <code className="text-[10px] font-bold bg-white text-violet-600 px-2 py-0.5 rounded-full border border-violet-200 mt-1.5 inline-block tracking-widest">
                {discount.code}
              </code>
            )}
            <p className="text-[10px] text-red-500 font-semibold mt-2">⚠ This cannot be undone.</p>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2 px-6 pb-6">
            <Btn variant="secondary" className="flex-1 justify-center" onClick={onCancel} disabled={deleting}>
              Cancel
            </Btn>
            <Btn variant="danger" className="flex-1 justify-center" onClick={onConfirm} disabled={deleting}>
              {deleting
                ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" /> Deleting…</>
                : <><Trash2 size={13} /> Delete</>
              }
            </Btn>
          </div>
        </div>
      </div>,
      document.body
    );

// ── Create / Edit Modal ────────────────────────────────────────────────────────
const EMPTY_FORM: FormData = {
  name: "", code: "", amount: "", type: "Percentage",
  status: "ON", starts_at: "", ends_at: "", branch_ids: [],
};

const discountToForm = (d: Discount): FormData => ({
  name: d.name,
  code: d.code ?? "",
  amount: String(d.amount),
  type: d.type,
  status: d.status,
  starts_at: d.starts_at ?? "",
  ends_at: d.ends_at ?? "",
  branch_ids: d.branches.map(b => b.id),
});

const DiscountModal: React.FC<{
  onClose: () => void;
  onSaved: (d: Discount, isEdit: boolean) => void;
  branches: Branch[];
  editing?: Discount | null;
}> = ({ onClose, onSaved, branches, editing = null }) => {
  const { showToast } = useToast();
  const isEdit = editing !== null;
  const [form, setForm] = useState<FormData>(() => isEdit ? discountToForm(editing!) : EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // Re-seed form when switching between discounts
  useEffect(() => {
    setForm(isEdit ? discountToForm(editing!) : EMPTY_FORM);
    setErrors({});
  }, [editing]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = <K extends keyof FormData>(k: K, v: FormData[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.name.trim()) e.name = "Name is required.";
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) < 0) e.amount = "Enter a valid amount.";
    if (form.code && !/^[a-zA-Z0-9_-]+$/.test(form.code)) e.code = "Code can only contain letters, numbers, - and _.";
    if (form.ends_at && form.starts_at && form.ends_at < form.starts_at) e.ends_at = "End date must be after start date.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const url = isEdit ? `/api/discounts/${editing!.id}` : "/api/discounts";
      const method = isEdit ? "PUT" : "POST";

      const payload = {
        ...form,
        code: form.code.trim().toUpperCase() || null,
        amount: Number(form.amount),
        starts_at: form.starts_at || null,
        ends_at: form.ends_at || null,
      };

      console.log("📤 Submitting payload:", JSON.stringify(payload, null, 2));

      const res = await fetch(url, {
        method, headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        console.error("❌ Server responded:", res.status, JSON.stringify(data, null, 2));
        // Show Laravel validation errors field by field
        if (data.errors) {
          const mapped: FormErrors = {};
          Object.entries(data.errors).forEach(([k, v]) => {
            mapped[k as keyof FormData] = Array.isArray(v) ? v[0] as string : String(v);
          });
          setErrors(mapped);
        } else {
          setErrors({ name: data.message ?? "Request failed." });
        }
        return;
      }

      onSaved(data, isEdit);
      try {
        triggerSync();
        showToast(isEdit ? "Discount updated successfully" : "Discount added successfully", "success");
      } catch (e) { console.error("Broadcast failed:", e); }
      onClose();
    } catch (err: unknown) {
      console.error("❌ Network error:", err);
      setErrors({ name: err instanceof Error ? err.message : "Something went wrong." });
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-9999 flex items-center justify-center p-6"
      style={BACKDROP_STYLE}
    >
      {/* backdrop click */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative bg-white w-full max-w-md border border-zinc-200 rounded-[1.25rem] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-violet-50 border border-violet-200 rounded-lg flex items-center justify-center">
              {isEdit ? <Edit2 size={15} className="text-violet-600" /> : <Plus size={15} className="text-violet-600" />}
            </div>
            <div>
              <p className="text-sm font-bold text-[#1a0f2e]">
                {isEdit ? "Edit Discount" : "Create Discount"}
              </p>
              <p className="text-[10px] text-zinc-400">
                {isEdit ? `Editing "${editing!.name}"` : "Add a new discount to the system"}
              </p>
            </div>
          </div>
          <button onClick={onClose}
            className="p-1.5 hover:bg-zinc-100 rounded-lg transition-colors text-zinc-400 hover:text-zinc-600">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-4 overflow-y-auto flex-1">
          {/* Name */}
          <Field label="Discount Name" error={errors.name}>
            <input value={form.name} onChange={e => set("name", e.target.value)}
              placeholder="e.g. Birthday Discount" className={inputCls} />
          </Field>

          {/* Promo Code */}
          <Field label="Promo Code" error={errors.code}>
            <div className="flex gap-2">
              <input
                value={form.code}
                onChange={e => set("code", e.target.value.toUpperCase())}
                placeholder="e.g. BDAY10  (optional)"
                maxLength={50}
                className={`${inputCls} flex-1 font-mono tracking-widest`}
              />
              <button type="button"
                onClick={() => set("code", generateCode())}
                title="Auto-generate code"
                className="px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-400 hover:text-violet-600 hover:border-violet-300 hover:bg-violet-50 transition-all">
                <Shuffle size={14} />
              </button>
            </div>
            <p className="text-[10px] text-zinc-400 mt-1">Leave blank if no code is required.</p>
          </Field>

          {/* Type + Amount */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type" error={errors.type}>
              <select value={form.type} onChange={e => set("type", e.target.value)} className={inputCls}>
                {DISCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label={`Amount ${amountLabel(form.type)}`} error={errors.amount}>
              <input type="number" min="0" step="0.01" value={form.amount}
                onChange={e => set("amount", e.target.value)}
                placeholder="0" className={inputCls} />
            </Field>
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-3">
            <Field label={<span className="flex items-center gap-1"><Calendar size={9} />Start Date</span>} error={errors.starts_at}>
              <input type="date" value={form.starts_at}
                onChange={e => set("starts_at", e.target.value)}
                min={todayStr()} className={inputCls} />
            </Field>
            <Field label={<span className="flex items-center gap-1"><Calendar size={9} />End Date</span>} error={errors.ends_at}>
              <input type="date" value={form.ends_at}
                onChange={e => set("ends_at", e.target.value)}
                min={form.starts_at || todayStr()} className={inputCls} />
            </Field>
          </div>
          <p className="text-[10px] text-zinc-400 -mt-2">Leave both blank for a discount with no expiry.</p>

          {/* Branches */}
          <Field label={<>Branches <span className="normal-case font-normal text-zinc-400">(empty = all branches)</span></>}>
            <BranchPicker branches={branches} selected={form.branch_ids}
              onChange={ids => set("branch_ids", ids)} />
          </Field>

          {/* Status */}
          <Field label="Status">
            <div className="flex gap-3">
              {(["ON", "OFF"] as const).map(s => (
                <button key={s} type="button" onClick={() => set("status", s)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${form.status === s
                      ? s === "ON" ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                        : "bg-red-50 border-red-300 text-red-600"
                      : "bg-zinc-50 border-zinc-200 text-zinc-400"
                    }`}>
                  {s}
                </button>
              ))}
            </div>
          </Field>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-zinc-100 shrink-0">
          <Btn variant="secondary" onClick={onClose} disabled={saving}>Cancel</Btn>
          <Btn onClick={handleSubmit} disabled={saving}>
            {saving
              ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" /> Saving…</>
              : isEdit
                ? <><Edit2 size={12} /> Save Changes</>
                : <><Plus size={13} /> Create Discount</>
            }
          </Btn>
        </div>
      </div>
    </div>,
    document.body   // ← same as BranchesTab — renders directly into <body>
  );
};

// ── Discount Card ──────────────────────────────────────────────────────────────
const DiscountCard: React.FC<{
  discount: Discount;
  onEdit: (d: Discount) => void;
  onToggle: (d: Discount) => void;
  onDelete: (d: Discount) => void;
  toggling: boolean;
  deleting: boolean;
}> = ({ discount, onEdit, onToggle, onDelete, toggling, deleting }) => {
  const isOn = discount.status === "ON";
  const branchLabel = discount.branches.length === 0
    ? "All branches"
    : discount.branches.map(b => b.name).join(", ");

  const now = todayStr();
  const expired = !!discount.ends_at && discount.ends_at < now;
  const notYet = !!discount.starts_at && discount.starts_at > now;

  return (
    <div className={`bg-white rounded-xl overflow-hidden border transition-all duration-200 ${deleting ? "opacity-50 scale-[0.98]" : "hover:shadow-md hover:-translate-y-0.5"
      } ${expired ? "border-red-200" : isOn ? "border-emerald-200" : "border-zinc-200"}`}>

      {/* Top accent bar */}
      <div className={`h-1 w-full ${expired ? "bg-red-400" : isOn ? "bg-emerald-400" : "bg-zinc-300"}`} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className={`w-9 h-9 shrink-0 rounded-lg flex items-center justify-center border ${isOn && !expired ? "bg-emerald-50 border-emerald-200"
                : expired ? "bg-red-50 border-red-200"
                  : "bg-zinc-100 border-zinc-200"
              }`}>
              <Tag size={14} className={
                isOn && !expired ? "text-emerald-600"
                  : expired ? "text-red-400"
                    : "text-zinc-400"
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
            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${isOn ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                : "text-zinc-500 bg-zinc-100 border-zinc-200"
              }`}>{discount.status}</span>
            {expired && <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold border text-red-600   bg-red-50   border-red-200">EXPIRED</span>}
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
          <div className={`flex items-center gap-1.5 text-[10px] font-medium mb-3 px-2.5 py-1.5 rounded-lg border ${expired ? "text-red-500 bg-red-50 border-red-100"
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

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
          <button onClick={() => onToggle(discount)} disabled={toggling || deleting}
            className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-lg border transition-all disabled:opacity-50 ${isOn ? "text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100"
                : "text-zinc-500 bg-zinc-50 border-zinc-200 hover:bg-zinc-100"
              }`}>
            {toggling ? <RefreshCw size={11} className="animate-spin" /> : isOn ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
            {isOn ? "Turn OFF" : "Turn ON"}
          </button>

          <div className="flex items-center gap-1">
            <button onClick={() => onEdit(discount)} disabled={toggling || deleting}
              title="Edit"
              className="p-1.5 hover:bg-violet-50 rounded-[0.4rem] text-zinc-400 hover:text-violet-600 transition-colors disabled:opacity-40">
              <Edit2 size={13} />
            </button>
            <button onClick={() => onDelete(discount)} disabled={toggling || deleting}
              title="Delete"
              className="p-1.5 hover:bg-red-50 rounded-[0.4rem] text-zinc-400 hover:text-red-500 transition-colors disabled:opacity-40">
              {deleting ? <RefreshCw size={13} className="animate-spin text-red-400" /> : <Trash2 size={13} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
const PromotionsTab: React.FC = () => {
  const { showToast } = useToast();
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalTarget, setModalTarget] = useState<Discount | null | "create">(null);
  const [deleteTarget, setDeleteTarget] = useState<Discount | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchAll = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [dRes, bRes] = await Promise.all([
        fetch("/api/discounts", { headers: authHeaders() }),
        fetch("/api/branches", { headers: authHeaders() }),
      ]);
      const [dData, bData] = await Promise.all([dRes.json(), bRes.json()]);
      if (!dRes.ok) throw new Error("Failed to load discounts.");
      const toArray = (v: unknown): unknown[] =>
        Array.isArray(v) ? v : ((v as Record<string, unknown>)?.data ?? []) as unknown[];
      setDiscounts(toArray(dData) as Discount[]);
      setBranches(bRes.ok ? toArray(bData) as Branch[] : []);
    } catch { setError("Failed to load data."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSaved = (saved: Discount, isEdit: boolean) =>
    setDiscounts(prev =>
      isEdit ? prev.map(d => d.id === saved.id ? saved : d) : [saved, ...prev]
    );

  const handleToggle = async (discount: Discount) => {
    setTogglingId(discount.id);
    try {
      const res = await fetch(`/api/discounts/${discount.id}/toggle`, { method: "PUT", headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error();
      setDiscounts(prev => prev.map(d => d.id === discount.id ? data : d));
      try {
        triggerSync();
        showToast(`Discount ${data.status === 'ON' ? 'enabled' : 'disabled'} successfully`, "success");
      } catch { /* ignore */ }
    } catch { setError("Failed to update status."); }
    finally { setTogglingId(null); }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    try {
      const res = await fetch(`/api/discounts/${deleteTarget.id}`, { method: "DELETE", headers: authHeaders() });
      if (!res.ok) throw new Error();
      setDiscounts(prev => prev.filter(d => d.id !== deleteTarget.id));
      try {
        triggerSync();
        showToast("Discount deleted successfully", "success");
      } catch { /* ignore */ }
      setDeleteTarget(null);
    } catch { setError("Failed to delete discount."); }
    finally { setDeletingId(null); }
  };

  const activeCount = discounts.filter(d => d.status === "ON").length;
  const totalUsed = discounts.reduce((s, d) => s + d.used_count, 0);
  const showModal = modalTarget !== null;
  const editingObj = modalTarget !== null && modalTarget !== "create" ? modalTarget : null;

  const filteredDiscounts = discounts.filter(d => {
    if (statusFilter !== "all" && d.status !== statusFilter) return false;
    if (search && !d.name.toLowerCase().includes(search.toLowerCase()) && !(d.code && d.code.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });

  return (
    <div className="p-6 md:p-8 fade-in">

      {/* Modals rendered via createPortal into document.body — never clipped */}
      {showModal && (
        <DiscountModal
          branches={branches}
          editing={editingObj}
          onClose={() => setModalTarget(null)}
          onSaved={handleSaved}
        />
      )}
      {deleteTarget && (
        <DeleteModal
          discount={deleteTarget}
          deleting={deletingId === deleteTarget.id}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}



      {error && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle size={14} className="text-red-500 shrink-0" />
          <p className="text-xs text-red-600 font-medium">{error}</p>
          <Btn variant="secondary" size="sm" onClick={fetchAll} className="ml-auto">Retry</Btn>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<Tag size={16} />} label="Total Discounts" value={loading ? "—" : discounts.length} color="violet" />
        <StatCard icon={<CheckCircle size={16} />} label="Active" value={loading ? "—" : activeCount} color="emerald" />
        <StatCard icon={<XCircle size={16} />} label="Inactive" value={loading ? "—" : discounts.length - activeCount} color="red" />
        <StatCard icon={<RefreshCw size={16} />} label="Total Uses" value={loading ? "—" : totalUsed.toLocaleString()} color="amber" />
      </div>

      {/* Filter Bar */}
      {!loading && !error && (
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="flex-1 min-w-48 flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2">
            <Search size={13} className="text-zinc-400 shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm text-zinc-700 outline-none placeholder:text-zinc-400"
              placeholder="Search by name or code..."
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-600 outline-none"
          >
            <option value="all">All Status</option>
            <option value="ON">Active</option>
            <option value="OFF">Inactive</option>
          </select>
          <Btn onClick={() => setModalTarget("create")} className="shrink-0 ml-auto md:ml-0">
            <Plus size={13} /> Create Discount
          </Btn>
        </div>
      )}

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
                  <div className="flex gap-1">
                    <div className="h-7 w-7 bg-zinc-100 rounded-lg" />
                    <div className="h-7 w-7 bg-zinc-100 rounded-lg" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredDiscounts.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-zinc-200 rounded-xl bg-zinc-50/50">
          <div className="w-14 h-14 bg-violet-50 border border-violet-200 rounded-full flex items-center justify-center mb-3">
            <Tag size={22} className="text-violet-400" />
          </div>
          <p className="text-sm font-bold text-zinc-600">{discounts.length === 0 ? "No discounts yet" : "No discounts found"}</p>
          <p className="text-xs text-zinc-400 mt-1 mb-5">{discounts.length === 0 ? "Create your first discount to get started." : "Adjust your search or filters."}</p>
          {discounts.length === 0 && <Btn onClick={() => setModalTarget("create")}><Plus size={13} /> Create Discount</Btn>}
        </div>
      )}

      {/* Cards */}
      {!loading && filteredDiscounts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredDiscounts.map(d => (
            <DiscountCard key={d.id} discount={d}
              onEdit={disc => setModalTarget(disc)}
              onToggle={handleToggle}
              onDelete={disc => setDeleteTarget(disc)}
              toggling={togglingId === d.id}
              deleting={deletingId === d.id}
            />
          ))}
          <button onClick={() => setModalTarget("create")}
            className="bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-xl p-5 flex flex-col items-center justify-center gap-2 hover:border-violet-300 hover:bg-violet-50 transition-all group min-h-52">
            <div className="w-11 h-11 rounded-full bg-zinc-200 group-hover:bg-violet-200 flex items-center justify-center transition-colors">
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
