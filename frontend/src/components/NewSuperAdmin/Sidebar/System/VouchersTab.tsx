// components/NewSuperAdmin/Sidebar/System/VouchersTab.tsx
import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Plus, Trash2, CheckCircle, XCircle, Tag, RefreshCw,
  X, Edit2, Shuffle, Calendar, AlertTriangle, Search,
  ToggleRight, ToggleLeft
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────
type ColorKey = "violet" | "emerald" | "red" | "amber";
type VariantKey = "primary" | "secondary" | "danger" | "ghost";
type SizeKey = "sm" | "md" | "lg";

interface Voucher {
  id: number;
  code: string;
  description: string | null;
  value: string;
  type: string;
  status: "Active" | "Redeemed" | "Inactive";
  min_spend: string | null;
  max_discount: string | null;
  expiry_date: string | null;
  usage_limit: number | null;
  times_used: number;
  is_active: boolean;
  created_at: string;
}

interface FormData {
  code: string;
  description: string;
  value: string;
  type: "Percentage" | "Fixed Amount" | "Gift Certificate";
  min_spend: string;
  max_discount: string;
  expiry_date: string;
  usage_limit: string;
  is_active: boolean;
}

type FormErrors = Partial<Record<keyof FormData, string>> & { general?: string };

// ── Auth helpers ───────────────────────────────────────────────────────────────
const getToken = () =>
  localStorage.getItem("auth_token") || localStorage.getItem("lucky_boba_token") || "";
const authHeaders = () => ({
  "Content-Type": "application/json",
  Accept: "application/json",
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

// ── Utilities ──────────────────────────────────────────────────────────────────
const VOUCHER_TYPES = ["Percentage", "Fixed Amount", "Gift Certificate"];

const generateCode = () =>
  Math.random().toString(36).slice(2, 6).toUpperCase() +
  Math.random().toString(36).slice(2, 6).toUpperCase();

const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : null;

const todayStr = () => new Date().toISOString().split("T")[0];

const formatAmount = (type: string, amount: string): string => {
  const num = Number(amount);
  if (type === "Percentage") return `${num}%`;
  if (type === "Fixed Amount" || type === "Gift Certificate") return `₱${num.toLocaleString()}`;
  return `${amount}`;
};

// ── Shared UI ──────────────────────────────────────────────────────────────────
const Btn: React.FC<{
  children: React.ReactNode; variant?: VariantKey; size?: SizeKey;
  onClick?: () => void; className?: string; disabled?: boolean;
  type?: "button" | "submit" | "reset";
}> = ({ children, variant = "primary", size = "sm", onClick, className = "", disabled = false, type = "button" }) => {
  const sizes: Record<SizeKey, string> = { sm: "px-3 py-2 text-xs", md: "px-4 py-2.5 text-sm", lg: "px-6 py-3 text-sm" };
  const variants: Record<VariantKey, string> = {
    primary: "bg-[#3b2063] hover:bg-[#2a1647] text-white",
    secondary: "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50",
    danger: "bg-red-600 hover:bg-red-700 text-white",
    ghost: "bg-transparent text-zinc-500 hover:bg-zinc-100",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`inline-flex items-center justify-center gap-1.5 font-bold rounded-lg transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 ${sizes[size]} ${variants[variant]} ${className}`}>
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

const BACKDROP_STYLE: React.CSSProperties = {
  backdropFilter: "blur(6px)",
  WebkitBackdropFilter: "blur(6px)",
  backgroundColor: "rgba(0,0,0,0.45)",
};

// ── Delete Confirm Modal ───────────────────────────────────────────────────────
const DeleteModal: React.FC<{
  voucher: Voucher;
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
}> = ({ voucher, onConfirm, onCancel, deleting }) =>
    createPortal(
      <div
        className="fixed inset-0 z-9999 flex items-center justify-center p-6"
        style={BACKDROP_STYLE}
      >
        <div className="absolute inset-0" onClick={onCancel} />
        <div className="relative bg-white w-full max-w-sm border border-zinc-200 rounded-[1.25rem] shadow-2xl">
          <div className="flex flex-col items-center text-center px-6 pt-8 pb-5">
            <div className="w-14 h-14 bg-red-50 border border-red-200 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle size={26} className="text-red-500" />
            </div>
            <p className="text-base font-bold text-[#1a0f2e]">Delete Voucher?</p>
            <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
              You're about to permanently delete this voucher.
              This action cannot be undone.
            </p>
          </div>
          <div className="mx-6 mb-5 p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-center">
            <code className="text-lg font-bold bg-white text-violet-600 px-3 py-1 rounded border border-violet-200 mt-1.5 inline-block tracking-widest">
              {voucher.code}
            </code>
            <p className="text-[10px] text-red-500 font-semibold mt-2">⚠ This cannot be undone.</p>
          </div>
          <div className="flex items-center gap-2 px-6 pb-6">
            <Btn variant="secondary" className="flex-1 justify-center" onClick={onCancel} disabled={deleting}>
              Cancel
            </Btn>
            <Btn variant="danger" className="flex-1 justify-center" onClick={onConfirm} disabled={deleting}>
              {deleting ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" /> Deleting…</> : <><Trash2 size={13} /> Delete</>}
            </Btn>
          </div>
        </div>
      </div>,
      document.body
    );

// ── Create / Edit Modal ────────────────────────────────────────────────────────
const EMPTY_FORM: FormData = {
  code: "", description: "", value: "", type: "Percentage",
  min_spend: "", max_discount: "", expiry_date: "", usage_limit: "", is_active: true
};

const voucherToForm = (v: Voucher): FormData => ({
  code: v.code,
  description: v.description ?? "",
  value: String(v.value),
  type: v.type as FormData["type"],
  min_spend: v.min_spend ? String(v.min_spend) : "",
  max_discount: v.max_discount ? String(v.max_discount) : "",
  expiry_date: v.expiry_date ? v.expiry_date.split("T")[0] : "",
  usage_limit: v.usage_limit ? String(v.usage_limit) : "",
  is_active: v.is_active,
});

const VoucherModal: React.FC<{
  onClose: () => void;
  onSaved: (v: Voucher, isEdit: boolean) => void;
  editing?: Voucher | null;
}> = ({ onClose, onSaved, editing = null }) => {
  const isEdit = editing !== null;
  const [form, setForm] = useState<FormData>(() => isEdit ? voucherToForm(editing!) : EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const set = <K extends keyof FormData>(k: K, v: FormData[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.code.trim()) e.code = "Code is required.";
    if (!form.value || isNaN(Number(form.value)) || Number(form.value) <= 0) e.value = "Enter a valid value.";
    if (form.code && !/^[a-zA-Z0-9_-]+$/.test(form.code)) e.code = "Code can only contain letters, numbers, - and _.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const url = isEdit ? `/api/vouchers/${editing!.id}` : "/api/vouchers";
      const method = isEdit ? "PUT" : "POST";

      const payload = {
        code: form.code.trim().toUpperCase(),
        description: form.description.trim() || null,
        value: form.value,
        type: form.type,
        min_spend: form.min_spend ? Number(form.min_spend) : 0,
        max_discount: form.max_discount ? Number(form.max_discount) : null,
        expiry_date: form.expiry_date || null,
        usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
        is_active: form.is_active,
      };

      const res = await fetch(url, {
        method, headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.errors) {
          const mapped: FormErrors = {};
          Object.entries(data.errors).forEach(([k, v]) => {
            mapped[k as keyof FormData] = Array.isArray(v) ? v[0] as string : String(v);
          });
          setErrors(mapped);
        } else {
          setErrors({ general: data.message ?? "Request failed." });
        }
        return;
      }

      onSaved(data, isEdit);
      onClose();
    } catch (err: unknown) {
      setErrors({ general: err instanceof Error ? err.message : "Something went wrong." });
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-6" style={BACKDROP_STYLE}>
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md border border-zinc-200 rounded-[1.25rem] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-violet-50 border border-violet-200 rounded-lg flex items-center justify-center">
              {isEdit ? <Edit2 size={15} className="text-violet-600" /> : <Plus size={15} className="text-violet-600" />}
            </div>
            <div>
              <p className="text-sm font-bold text-[#1a0f2e]">
                {isEdit ? "Edit Voucher" : "Create Voucher"}
              </p>
              <p className="text-[10px] text-zinc-400">
                {isEdit ? `Editing "${editing!.code}"` : "Add a new voucher to the system"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-100 rounded-lg transition-colors text-zinc-400 hover:text-zinc-600">
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4 overflow-y-auto flex-1">
          {errors.general && <div className="p-3 bg-red-50 text-red-600 rounded text-xs font-semibold">{errors.general}</div>}
          
          <Field label="Voucher Code" error={errors.code}>
            <div className="flex gap-2">
              <input value={form.code} onChange={e => set("code", e.target.value.toUpperCase())}
                placeholder="e.g. SUMMER10" maxLength={50} className={`${inputCls} flex-1 font-mono tracking-widest`} />
              <button type="button" onClick={() => set("code", generateCode())}
                className="px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-400 hover:text-violet-600 transition-all">
                <Shuffle size={14} />
              </button>
            </div>
          </Field>

          <Field label="Description (Optional)" error={errors.description}>
            <input value={form.description} onChange={e => set("description", e.target.value)}
              placeholder="e.g. Summer Special Voucher" className={inputCls} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Type" error={errors.type}>
              <select value={form.type} onChange={e => set("type", e.target.value as FormData["type"])} className={inputCls}>
                {VOUCHER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Value" error={errors.value}>
              <input type="number" min="0" step="0.01" value={form.value}
                onChange={e => set("value", e.target.value)} placeholder="0" className={inputCls} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Min Spend (₱)" error={errors.min_spend}>
              <input type="number" min="0" step="0.01" value={form.min_spend}
                onChange={e => set("min_spend", e.target.value)} placeholder="0.00" className={inputCls} />
            </Field>
            <Field label="Max Discount (₱)" error={errors.max_discount}>
              <input type="number" min="0" step="0.01" value={form.max_discount}
                onChange={e => set("max_discount", e.target.value)} placeholder="Optional" className={inputCls} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Usage Limit" error={errors.usage_limit}>
              <input type="number" min="1" value={form.usage_limit}
                onChange={e => set("usage_limit", e.target.value)} placeholder="Optional" className={inputCls} />
            </Field>
            <Field label={<span className="flex items-center gap-1"><Calendar size={9} />Expiry Date</span>} error={errors.expiry_date}>
              <input type="date" value={form.expiry_date}
                onChange={e => set("expiry_date", e.target.value)} min={todayStr()} className={inputCls} />
            </Field>
          </div>

          <Field label="Status">
            <div className="flex gap-3">
              <button type="button" onClick={() => set("is_active", true)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${form.is_active ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-zinc-50 border-zinc-200 text-zinc-400"}`}>
                Active
              </button>
              <button type="button" onClick={() => set("is_active", false)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${!form.is_active ? "bg-red-50 border-red-300 text-red-600" : "bg-zinc-50 border-zinc-200 text-zinc-400"}`}>
                Inactive
              </button>
            </div>
          </Field>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-zinc-100 shrink-0">
          <Btn variant="secondary" onClick={onClose} disabled={saving}>Cancel</Btn>
          <Btn onClick={handleSubmit} disabled={saving}>
            {saving ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" /> Saving…</> : isEdit ? <><Edit2 size={12} /> Save Changes</> : <><Plus size={13} /> Create Voucher</>}
          </Btn>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ── Voucher Card ───────────────────────────────────────────────────────────────
const VoucherCard: React.FC<{
  voucher: Voucher;
  onEdit: (v: Voucher) => void;
  onToggle: (v: Voucher) => void;
  onDelete: (v: Voucher) => void;
  toggling: boolean;
  deleting: boolean;
}> = ({ voucher, onEdit, onToggle, onDelete, toggling, deleting }) => {
  const expired = !!voucher.expiry_date && new Date(voucher.expiry_date) < new Date();
  
  return (
    <div className={`bg-white rounded-xl overflow-hidden border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${voucher.is_active ? "border-emerald-200" : "border-zinc-200"} ${deleting && "opacity-50"}`}>
      <div className={`h-1 w-full ${expired ? "bg-red-400" : voucher.is_active ? "bg-emerald-400" : "bg-zinc-300"}`} />
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className={`w-9 h-9 shrink-0 rounded-lg flex items-center justify-center border ${voucher.is_active && !expired ? "bg-emerald-50 border-emerald-200" : "bg-zinc-100 border-zinc-200"}`}>
              <Tag size={14} className={voucher.is_active && !expired ? "text-emerald-600" : "text-zinc-400"} />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-[#1a0f2e] text-sm leading-tight truncate mb-0.5" title={voucher.description || "Voucher"}>{voucher.description || "Lucky Boba Voucher"}</p>
              <code className="text-[10px] font-bold bg-violet-50 text-violet-600 px-2 py-0.5 rounded-full border border-violet-200 tracking-widest">{voucher.code}</code>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
            <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${voucher.is_active ? "text-emerald-700 bg-emerald-50 border-emerald-200" : "text-zinc-500 bg-zinc-100 border-zinc-200"}`}>{voucher.is_active ? "ACTIVE" : "INACTIVE"}</span>
            {expired && <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold border text-red-600 bg-red-50 border-red-200">EXPIRED</span>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3 p-3 bg-zinc-50 rounded-lg border border-zinc-100">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-0.5">Value</p>
            <p className="text-xs font-bold text-zinc-700">{formatAmount(voucher.type, voucher.value)}</p>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-0.5">Min Spend</p>
            <p className="text-xs font-bold text-zinc-700">{voucher.min_spend && voucher.min_spend > '0' ? `₱${voucher.min_spend}` : 'None'}</p>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-0.5">Used</p>
            <p className="text-xs font-bold text-zinc-700">{voucher.times_used} {voucher.usage_limit ? `/ ${voucher.usage_limit}` : ""}</p>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-0.5">Max Discount</p>
            <p className="text-xs font-bold text-zinc-700">{voucher.max_discount ? `₱${voucher.max_discount}` : 'Unlimited'}</p>
          </div>
        </div>

        {voucher.expiry_date && (
          <div className={`flex items-center gap-1.5 text-[10px] font-medium mb-3 px-2.5 py-1.5 rounded-lg border ${expired ? "text-red-500 bg-red-50 border-red-100" : "text-zinc-500 bg-zinc-50 border-zinc-100"}`}>
            <Calendar size={9} className="shrink-0" />
            <span>Valid until {formatDate(voucher.expiry_date)}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
          <button onClick={() => onToggle(voucher)} disabled={toggling || deleting}
            className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-lg border transition-all disabled:opacity-50 ${voucher.is_active ? "text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100" : "text-zinc-500 bg-zinc-50 border-zinc-200 hover:bg-zinc-100"}`}>
            {toggling ? <RefreshCw size={11} className="animate-spin" /> : voucher.is_active ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
            {voucher.is_active ? "Deactivate" : "Activate"}
          </button>
          <div className="flex items-center gap-1">
            <button onClick={() => onEdit(voucher)} disabled={toggling || deleting} className="p-1.5 hover:bg-violet-50 rounded-[0.4rem] text-zinc-400 hover:text-violet-600 transition-colors disabled:opacity-40"><Edit2 size={13} /></button>
            <button onClick={() => onDelete(voucher)} disabled={toggling || deleting} className="p-1.5 hover:bg-red-50 rounded-[0.4rem] text-zinc-400 hover:text-red-500 transition-colors disabled:opacity-40">{deleting ? <RefreshCw size={13} className="animate-spin text-red-400" /> : <Trash2 size={13} />}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
const VouchersTab: React.FC = () => {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [modalTarget, setModalTarget] = useState<Voucher | null | "create">(null);
  const [deleteTarget, setDeleteTarget] = useState<Voucher | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const fetchVouchers = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/vouchers", { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to load vouchers.");
      const data = await res.json();
      setVouchers(Array.isArray(data) ? data : (data.data || []));
    } catch {
      setError("Failed to fetch vouchers.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchVouchers(); }, [fetchVouchers]);

  const handleToggle = async (v: Voucher) => {
    setTogglingId(v.id);
    try {
      const res = await fetch(`/api/vouchers/${v.id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ ...v, is_active: !v.is_active })
      });
      if (res.ok) {
        const updated = await res.json();
        setVouchers(prev => prev.map(x => x.id === v.id ? updated : x));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    try {
      await fetch(`/api/vouchers/${deleteTarget.id}`, { method: "DELETE", headers: authHeaders() });
      setVouchers(prev => prev.filter(v => v.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = vouchers.filter(v => 
    search === "" || 
    v.code.toLowerCase().includes(search.toLowerCase()) || 
    (v.description && v.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 md:p-8 fade-in">
      {modalTarget && <VoucherModal onClose={() => setModalTarget(null)} onSaved={(v, isEdit) => setVouchers(prev => isEdit ? prev.map(x => x.id === v.id ? v : x) : [v, ...prev])} editing={modalTarget !== "create" ? modalTarget : null} />}
      {deleteTarget && <DeleteModal voucher={deleteTarget} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} deleting={deletingId === deleteTarget.id} />}

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<Tag size={16} />} label="Total Vouchers" value={vouchers.length} color="violet" />
        <StatCard icon={<CheckCircle size={16} />} label="Active" value={vouchers.filter(v => v.is_active).length} color="emerald" />
        <StatCard icon={<XCircle size={16} />} label="Inactive/Expired" value={vouchers.length - vouchers.filter(v => v.is_active).length} color="red" />
        <StatCard icon={<RefreshCw size={16} />} label="Times Used" value={vouchers.reduce((sum, v) => sum + v.times_used, 0).toLocaleString()} color="amber" />
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex-1 max-w-sm flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2">
          <Search size={13} className="text-zinc-400 shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-zinc-700 outline-none placeholder:text-zinc-400"
            placeholder="Search by code or description..."
          />
        </div>
        <Btn onClick={() => setModalTarget("create")}><Plus size={13} /> Create Voucher</Btn>
      </div>

      {loading ? (
        <p className="text-zinc-500 text-sm">Loading vouchers...</p>
      ) : error ? (
        <p className="text-red-500 text-sm">{error}</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 px-6 border-2 border-dashed border-zinc-200 rounded-xl bg-zinc-50/50">
          <p className="text-sm font-bold text-zinc-600">No vouchers found</p>
          <p className="text-xs text-zinc-400">Try adjusting your search criteria or create a new voucher.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(v => (
            <VoucherCard key={v.id} voucher={v} onEdit={setModalTarget} onToggle={handleToggle} onDelete={setDeleteTarget} toggling={togglingId === v.id} deleting={deletingId === v.id} />
          ))}
        </div>
      )}
    </div>
  );
};

export default VouchersTab;
