// components/NewSuperAdmin/Tabs/BranchesTab.tsx
import { useState, useEffect } from "react";
import {
  Search, Plus, Eye, Edit2, Trash2, Store,
  CheckCircle, XCircle, PhilippinePeso, ArrowUpRight, ArrowDownRight,
  X, AlertCircle, RefreshCw, MapPin, Trash,
} from "lucide-react";
import { createPortal } from "react-dom";

type ColorKey   = "violet" | "emerald" | "red" | "amber";
type VariantKey = "primary" | "secondary" | "danger" | "ghost";
type SizeKey    = "sm" | "md" | "lg";

interface Branch {
  id:             number;
  name:           string;
  location:       string;
  status:         string;
  today:          number;
  total:          number;
  staff:          number;
  manager:        string;
  ownership_type: 'company' | 'franchise';
  vat_type:       'vat' | 'non_vat';
  // Receipt / BIR fields
  brand:          string;
  company_name:   string;
  store_address:  string;
  vat_reg_tin:    string;
  min_number:     string;
  serial_number: string;
  owner_name:     string;
}
interface StatCardProps {
  icon: React.ReactNode; label: string; value: string | number;
  sub?: string; trend?: number; color?: ColorKey;
}
interface SectionHeaderProps { title: string; desc?: string; action?: React.ReactNode; }
interface BtnProps {
  children: React.ReactNode; variant?: VariantKey; size?: SizeKey;
  onClick?: () => void; className?: string; disabled?: boolean;
  type?: "button" | "submit" | "reset";
}
interface AddBranchModalProps  { onClose: () => void; onSaved:   (b: Branch) => void; }
interface EditBranchModalProps { onClose: () => void; onUpdated: (b: Branch) => void; branch: Branch; }
interface ViewBranchModalProps { onClose: () => void; branch: Branch; }
interface DeleteConfirmProps   { onClose: () => void; onDeleted: (id: number) => void; branch: Branch; }

interface RawBranch {
  id:              number;
  name:            string;
  location:        string;
  status:          string;
  ownership_type?: string;
  vat_type?:       'vat' | 'non_vat';
  brand?:          string;
  company_name?:   string;
  store_address?:  string;
  vat_reg_tin?:    string;
  min_number?:     string;
  serial_number?: string;
  owner_name?:     string; 
  today_sales?:    number | string;
  total_sales?:    number | string;
  staff_count?:    number;
  manager_name?:   string;
  manager?:        { id: number; name: string };
  users?:          { id: number; name: string; role: string }[];
}

// ── API helpers ───────────────────────────────────────────────────────────────
const getToken = () =>
  localStorage.getItem("auth_token") || localStorage.getItem("lucky_boba_token") || "";
const authHeaders = (): Record<string, string> => ({
  "Content-Type": "application/json",
  "Accept":       "application/json",
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});
const mapBranch = (b: RawBranch): Branch => ({
  id:             b.id,
  name:           b.name,
  location:       b.location,
  status:         b.status,
  today:          parseFloat(String(b.today_sales  ?? 0)),
  total:          parseFloat(String(b.total_sales  ?? 0)),
  staff:          b.staff_count ?? b.users?.length ?? 0,
  manager:        b.manager_name ?? b.manager?.name
                  ?? b.users?.find(u => u.role === "branch_manager")?.name
                  ?? "—",
  ownership_type: b.ownership_type === 'franchise' ? 'franchise' : 'company',
  vat_type:       b.vat_type === 'non_vat' ? 'non_vat' : 'vat',
  brand:          b.brand          ?? 'Lucky Boba Milk Tea',
  company_name:   b.company_name   ?? '',
  store_address:  b.store_address  ?? '',
  vat_reg_tin:    b.vat_reg_tin    ?? '',
  min_number:     b.min_number     ?? '',
  serial_number: b.serial_number ?? '',
  owner_name:     b.owner_name     ?? '',
});

// ── Shared UI ─────────────────────────────────────────────────────────────────
const Badge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, string> = {
    active:   "badge-active",   ACTIVE:   "badge-active",
    inactive: "badge-inactive", INACTIVE: "badge-inactive",
    pending:  "badge-pending",  void:     "badge-danger",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${map[status] ?? "badge-inactive"}`}>
      {status}
    </span>
  );
};

const OwnershipBadge: React.FC<{ type: 'company' | 'franchise' }> = ({ type }) => (
  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
    type === 'franchise'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : 'bg-violet-50 text-violet-700 border-violet-200'
  }`}>
    {type === 'franchise' ? 'Franchise' : 'Company'}
  </span>
);

const VatBadge: React.FC<{ type: 'vat' | 'non_vat' }> = ({ type }) => (
  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
    type === 'non_vat'
      ? 'bg-zinc-50 text-zinc-600 border-zinc-300'
      : 'bg-blue-50 text-blue-700 border-blue-200'
  }`}>
    {type === 'non_vat' ? 'Non-VAT' : 'VAT'}
  </span>
);

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, sub, trend, color = "violet" }) => {
  const colors: Record<ColorKey, { bg: string; border: string; icon: string }> = {
    violet:  { bg: "bg-violet-50",  border: "border-violet-200",  icon: "text-violet-600"  },
    emerald: { bg: "bg-emerald-50", border: "border-emerald-200", icon: "text-emerald-600" },
    red:     { bg: "bg-red-50",     border: "border-red-200",     icon: "text-red-500"     },
    amber:   { bg: "bg-amber-50",   border: "border-amber-200",   icon: "text-amber-600"   },
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

const SectionHeader: React.FC<SectionHeaderProps> = ({ action }) => (
  <div className="flex flex-wrap items-center justify-end gap-3 mb-6">
    {action}
  </div>
);

const Btn: React.FC<BtnProps> = ({
  children, variant = "primary", size = "sm",
  onClick, className = "", disabled = false, type = "button",
}) => {
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

// ── Field label helper ────────────────────────────────────────────────────────
const FieldLabel: React.FC<{ label: string; required?: boolean }> = ({ label, required }) => (
  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5 block">
    {label} {required && <span className="text-red-400">*</span>}
  </label>
);

// ── Input helper ──────────────────────────────────────────────────────────────
const inputCls = (hasError?: boolean) =>
  `w-full text-sm font-medium text-zinc-700 bg-zinc-50 border rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white transition-all ${hasError ? "border-red-300 bg-red-50" : "border-zinc-200"}`;

// ── Section divider ───────────────────────────────────────────────────────────
const FormSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="flex flex-col gap-3">
    <p className="text-[10px] font-bold uppercase tracking-widest text-violet-500 border-b border-violet-100 pb-1">{title}</p>
    {children}
  </div>
);

// ── Modal shell ───────────────────────────────────────────────────────────────
const ModalShell: React.FC<{
  onClose: () => void;
  icon:    React.ReactNode;
  title:   string;
  sub:     string;
  children: React.ReactNode;
  footer:  React.ReactNode;
  maxWidth?: string;
}> = ({ onClose, icon, title, sub, children, footer, maxWidth = "max-w-md" }) =>
  createPortal(
    <div
      className="fixed inset-0 z-9999 flex items-center justify-center p-6"
      style={{ backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", backgroundColor: "rgba(0,0,0,0.45)" }}
    >
      <div className="absolute inset-0" onClick={onClose} />
      <div className={`relative bg-white w-full ${maxWidth} border border-zinc-200 rounded-[1.25rem] shadow-2xl flex flex-col max-h-[90vh]`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-violet-50 border border-violet-200 rounded-lg flex items-center justify-center">
              {icon}
            </div>
            <div>
              <p className="text-sm font-bold text-[#1a0f2e]">{title}</p>
              <p className="text-[10px] text-zinc-400">{sub}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-100 rounded-lg transition-colors text-zinc-400 hover:text-zinc-600">
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5 flex flex-col gap-4 overflow-y-auto">{children}</div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-zinc-100 shrink-0">{footer}</div>
      </div>
    </div>,
    document.body
  );

// ── View Modal ────────────────────────────────────────────────────────────────
const ViewBranchModal: React.FC<ViewBranchModalProps> = ({ onClose, branch }) => {
  const fmt = (v: number) => `₱${Number(v).toLocaleString()}`;
  const rows: [string, React.ReactNode][] = [
    ["Branch ID",     `#${branch.id}`],
    ["Name",          branch.name],
    ["Location",      <span className="flex items-center gap-1"><MapPin size={11} />{branch.location}</span>],
    ["Manager",       branch.manager],
    ["Type",          <OwnershipBadge type={branch.ownership_type} />],
    ["VAT Setting", <VatBadge type={branch.vat_type} />],
    ["Status",        <Badge status={branch.status} />],
    ["Staff Count",   branch.staff || "—"],
    ["Today's Sales", <span className="font-bold text-emerald-600">{branch.status === "active" ? fmt(branch.today) : "—"}</span>],
    ["Total Sales",   <span className="font-bold text-[#3b2063]">{fmt(branch.total)}</span>],
    // Receipt / BIR fields
    ["Brand",         branch.brand        || "—"],
    ["Company Name",  branch.company_name || "—"],
    ["Store Address", branch.store_address || "—"],
    ["VAT Reg TIN",   branch.vat_reg_tin  || "—"],
    ["MIN",           branch.min_number   || "—"],
    ["Serial No.", branch.serial_number || "—"],
    ["Owner Name",    branch.owner_name    || "—"],
  ];
  return (
    <ModalShell
      onClose={onClose}
      icon={<Eye size={15} className="text-violet-600" />}
      title={branch.name}
      sub="Branch details"
      maxWidth="max-w-lg"
      footer={<Btn variant="secondary" onClick={onClose}>Close</Btn>}
    >
      <div className="flex flex-col divide-y divide-zinc-100 -my-1">
        {rows.map(([label, val]) => (
          <div key={label as string} className="flex items-center justify-between py-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{label}</span>
            <span className="text-xs font-semibold text-zinc-700">{val}</span>
          </div>
        ))}
      </div>
    </ModalShell>
  );
};

// ── Edit Modal ────────────────────────────────────────────────────────────────
const EditBranchModal: React.FC<EditBranchModalProps> = ({ onClose, onUpdated, branch }) => {
  const [form, setForm] = useState({
    name:           branch.name,
    location:       branch.location,
    status:         branch.status,
    ownership_type: branch.ownership_type,
    vat_type:       branch.vat_type,
    brand:          branch.brand         ?? 'Lucky Boba Milk Tea',
    company_name:   branch.company_name  ?? '',
    store_address:  branch.store_address ?? '',
    vat_reg_tin:    branch.vat_reg_tin   ?? '',
    min_number:     branch.min_number    ?? '',
    serial_number: branch.serial_number ?? '',
    owner_name:     branch.owner_name    ?? '',
  });
  const [errors,   setErrors]   = useState<Record<string, string>>({});
  const [loading,  setLoading]  = useState(false);
  const [apiError, setApiError] = useState("");

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim())     e.name     = "Branch name is required.";
    if (!form.location.trim()) e.location = "Location is required.";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    setApiError("");
    try {
      const res  = await fetch(`/api/branches/${branch.id}`, {
        method: "PUT", headers: authHeaders(), body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data.errors) {
          const mapped: Record<string, string> = {};
          Object.entries(data.errors).forEach(([k, v]) => {
            mapped[k] = Array.isArray(v) ? v[0] : String(v);
          });
          setErrors(mapped);
        } else {
          setApiError(data.message ?? "Something went wrong.");
        }
        return;
      }
      onUpdated(mapBranch(data.data));
      onClose();
    } catch {
      setApiError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const field = (key: keyof typeof form) => ({
    value:    form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm(f => ({ ...f, [key]: e.target.value }));
      setErrors(ev => { const n = { ...ev }; delete n[key]; return n; });
    },
  });

  return (
    <ModalShell
      onClose={onClose}
      icon={<Edit2 size={15} className="text-violet-600" />}
      title="Edit Branch"
      sub={`Updating ${branch.name}`}
      maxWidth="max-w-lg"
      footer={
        <>
          <Btn variant="secondary" onClick={onClose} disabled={loading}>Cancel</Btn>
          <Btn onClick={handleSubmit} disabled={loading}>
            {loading
              ? <span className="flex items-center gap-1.5"><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</span>
              : "Save Changes"}
          </Btn>
        </>
      }
    >
      {apiError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle size={14} className="text-red-500 shrink-0" />
          <p className="text-xs text-red-600 font-medium">{apiError}</p>
        </div>
      )}

      {/* ── Branch Info ── */}
      <FormSection title="Branch Info">
        <div>
          <FieldLabel label="Branch Name" required />
          <input {...field("name")} className={inputCls(!!errors.name)} />
          {errors.name && <p className="text-[10px] text-red-500 mt-1 font-medium">{errors.name}</p>}
        </div>
        <div>
          <FieldLabel label="Location" required />
          <input {...field("location")} className={inputCls(!!errors.location)} />
          {errors.location && <p className="text-[10px] text-red-500 mt-1 font-medium">{errors.location}</p>}
        </div>
        <div>
          <FieldLabel label="Status" />
          <select {...field("status")} className={inputCls()}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div>
          <FieldLabel label="Branch Type" />
          <select {...field("ownership_type")} className={inputCls()}>
            <option value="company">Company-Owned</option>
            <option value="franchise">Franchise</option>
          </select>
        </div>
        <div>
          <FieldLabel label="VAT Setting" />
          <select {...field("vat_type")} className={inputCls()}>
            <option value="vat">VAT (12%)</option>
            <option value="non_vat">Non-VAT</option>
          </select>
          <p className="text-[10px] text-zinc-400 mt-1">Controls whether this branch applies VAT to transactions.</p>
        </div>
      </FormSection>

      {/* ── Receipt / BIR Info ── */}
      <FormSection title="Receipt / BIR Info">
        <div>
          <FieldLabel label="Owner Name" />
          <input {...field("owner_name")} placeholder="e.g. Juan Dela Cruz" className={inputCls()} />
        </div>
        <div>
          <FieldLabel label="Brand" />
          <input {...field("brand")} placeholder="e.g. Lucky Boba Milk Tea" className={inputCls()} />
        </div>
        <div>
          <FieldLabel label="Company Name" />
          <input {...field("company_name")} placeholder="Registered company name" className={inputCls()} />
        </div>
        <div>
          <FieldLabel label="Store Address" />
          <input {...field("store_address")} placeholder="Full store address" className={inputCls()} />
        </div>
        <div>
          <FieldLabel label="VAT Reg TIN" />
          <input {...field("vat_reg_tin")} placeholder="e.g. 000-000-000-000" className={inputCls()} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel label="MIN" />
            <input {...field("min_number")} placeholder="Machine Identification No." className={inputCls()} />
          </div>
          <div>
            <FieldLabel label="Serial Number" />
            <input {...field("serial_number")} placeholder="POS Serial No." className={inputCls()} />
          </div>
        </div>
      </FormSection>
    </ModalShell>
  );
};

// ── Delete Confirm Modal ──────────────────────────────────────────────────────
const DeleteConfirmModal: React.FC<DeleteConfirmProps> = ({ onClose, onDeleted, branch }) => {
  const [loading,  setLoading]  = useState(false);
  const [apiError, setApiError] = useState("");

  const handleDelete = async () => {
    setLoading(true);
    setApiError("");
    try {
      const res  = await fetch(`/api/branches/${branch.id}`, {
        method: "DELETE", headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setApiError(data.message ?? "Failed to delete branch.");
        return;
      }
      onDeleted(branch.id);
      onClose();
    } catch {
      setApiError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-9999 flex items-center justify-center p-6"
      style={{ backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", backgroundColor: "rgba(0,0,0,0.45)" }}
    >
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white w-full max-w-sm border border-zinc-200 rounded-[1.25rem] shadow-2xl">
        <div className="flex flex-col items-center text-center px-6 pt-8 pb-5">
          <div className="w-14 h-14 bg-red-50 border border-red-200 rounded-full flex items-center justify-center mb-4">
            <Trash size={22} className="text-red-500" />
          </div>
          <p className="text-base font-bold text-[#1a0f2e]">Delete Branch?</p>
          <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
            You're about to permanently delete <span className="font-bold text-zinc-700">{branch.name}</span>.
            This action cannot be undone.
          </p>
          {apiError && (
            <div className="flex items-center gap-2 mt-4 p-3 w-full bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle size={14} className="text-red-500 shrink-0" />
              <p className="text-xs text-red-600 font-medium text-left">{apiError}</p>
            </div>
          )}
        </div>
        <div className="mx-6 mb-5 flex items-center gap-3 p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
          <div className="w-8 h-8 bg-violet-50 border border-violet-200 rounded-lg flex items-center justify-center shrink-0">
            <Store size={14} className="text-violet-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-[#1a0f2e] truncate">{branch.name}</p>
            <p className="text-[10px] text-zinc-400 flex items-center gap-1 truncate">
              <MapPin size={9} />{branch.location}
            </p>
          </div>
          <div className="ml-auto shrink-0">
            <Badge status={branch.status} />
          </div>
        </div>
        <div className="flex items-center gap-2 px-6 pb-6">
          <Btn variant="secondary" className="flex-1 justify-center" onClick={onClose} disabled={loading}>Cancel</Btn>
          <Btn variant="danger" className="flex-1 justify-center" onClick={handleDelete} disabled={loading}>
            {loading
              ? <span className="flex items-center gap-1.5"><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Deleting...</span>
              : <><Trash2 size={13} /> Delete</>}
          </Btn>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ── Add Branch Modal ──────────────────────────────────────────────────────────
const AddBranchModal: React.FC<AddBranchModalProps> = ({ onClose, onSaved }) => {
  const [form, setForm] = useState({
    name:           "",
    location:       "",
    status:         "active",
    ownership_type: "company",
    vat_type:       "vat",
    brand:          "Lucky Boba Milk Tea",
    company_name:   "",
    store_address:  "",
    vat_reg_tin:    "",
    min_number:     "",
    serial_number: "",
    owner_name:     "",
  });
  const [errors,   setErrors]   = useState<Record<string, string>>({});
  const [loading,  setLoading]  = useState(false);
  const [apiError, setApiError] = useState("");

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim())     e.name     = "Branch name is required.";
    if (!form.location.trim()) e.location = "Location is required.";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    setApiError("");
    try {
      const res  = await fetch("/api/branches", {
        method: "POST", headers: authHeaders(), body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data.errors) {
          const mapped: Record<string, string> = {};
          Object.entries(data.errors).forEach(([k, v]) => {
            mapped[k] = Array.isArray(v) ? v[0] : String(v);
          });
          setErrors(mapped);
        } else {
          setApiError(data.message ?? "Something went wrong.");
        }
        return;
      }
      onSaved(mapBranch(data.data));
      onClose();
    } catch {
      setApiError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const field = (key: keyof typeof form) => ({
    value:    form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm(f => ({ ...f, [key]: e.target.value }));
      setErrors(ev => { const n = { ...ev }; delete n[key]; return n; });
    },
  });

  return (
    <ModalShell
      onClose={onClose}
      icon={<Store size={15} className="text-violet-600" />}
      title="Add Branch"
      sub="Register a new branch location"
      maxWidth="max-w-lg"
      footer={
        <>
          <Btn variant="secondary" onClick={onClose} disabled={loading}>Cancel</Btn>
          <Btn onClick={handleSubmit} disabled={loading}>
            {loading
              ? <span className="flex items-center gap-1.5"><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</span>
              : <><Plus size={13} /> Add Branch</>}
          </Btn>
        </>
      }
    >
      {apiError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle size={14} className="text-red-500 shrink-0" />
          <p className="text-xs text-red-600 font-medium">{apiError}</p>
        </div>
      )}

      {/* ── Branch Info ── */}
      <FormSection title="Branch Info">
        <div>
          <FieldLabel label="Branch Name" required />
          <input {...field("name")} placeholder="e.g. SM City North" className={inputCls(!!errors.name)} />
          {errors.name && <p className="text-[10px] text-red-500 mt-1 font-medium">{errors.name}</p>}
        </div>
        <div>
          <FieldLabel label="Location" required />
          <input {...field("location")} placeholder="e.g. SM City Cebu, North Wing" className={inputCls(!!errors.location)} />
          {errors.location && <p className="text-[10px] text-red-500 mt-1 font-medium">{errors.location}</p>}
        </div>
        <div>
          <FieldLabel label="Status" />
          <select {...field("status")} className={inputCls()}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div>
          <FieldLabel label="Branch Type" />
          <select {...field("ownership_type")} className={inputCls()}>
            <option value="company">Company-Owned</option>
            <option value="franchise">Franchise</option>
          </select>
        </div>
        <div>
          <FieldLabel label="VAT Setting" />
          <select {...field("vat_type")} className={inputCls()}>
            <option value="vat">VAT (12%)</option>
            <option value="non_vat">Non-VAT</option>
          </select>
          <p className="text-[10px] text-zinc-400 mt-1">Controls whether this branch applies VAT to transactions.</p>
        </div>
      </FormSection>

      {/* ── Receipt / BIR Info ── */}
      <FormSection title="Receipt / BIR Info">
        <div>
          <FieldLabel label="Owner Name" />
          <input {...field("owner_name")} placeholder="e.g. Juan Dela Cruz" className={inputCls()} />
        </div>
        <div>
          <FieldLabel label="Brand" />
          <input {...field("brand")} placeholder="e.g. Lucky Boba Milk Tea" className={inputCls()} />
        </div>
        <div>
          <FieldLabel label="Company Name" />
          <input {...field("company_name")} placeholder="Registered company name" className={inputCls()} />
        </div>
        <div>
          <FieldLabel label="Store Address" />
          <input {...field("store_address")} placeholder="Full store address for receipt" className={inputCls()} />
        </div>
        <div>
          <FieldLabel label="VAT Reg TIN" />
          <input {...field("vat_reg_tin")} placeholder="e.g. 000-000-000-000" className={inputCls()} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel label="MIN" />
            <input {...field("min_number")} placeholder="Machine Identification No." className={inputCls()} />
          </div>
          <div>
            <FieldLabel label="Serial Number" />
            <input {...field("serial_number")} placeholder="POS Serial No." className={inputCls()} />
          </div>
        </div>
      </FormSection>
    </ModalShell>
  );
};

// ── Toggle Status Modal ───────────────────────────────────────────────────────
interface ToggleStatusProps { onClose: () => void; onToggled: (b: Branch) => void; branch: Branch; }

const ToggleStatusModal: React.FC<ToggleStatusProps> = ({ onClose, onToggled, branch }) => {
  const [loading,  setLoading]  = useState(false);
  const [apiError, setApiError] = useState("");

  const isActive   = branch.status === "active";
  const nextStatus = isActive ? "inactive" : "active";

  const handleToggle = async () => {
    setLoading(true);
    setApiError("");
    try {
      const res  = await fetch(`/api/branches/${branch.id}`, {
        method: "PUT", headers: authHeaders(),
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setApiError(data.message ?? "Failed to update status.");
        return;
      }
      onToggled(mapBranch(data.data));
      onClose();
    } catch {
      setApiError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-9999 flex items-center justify-center p-6"
      style={{ backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", backgroundColor: "rgba(0,0,0,0.45)" }}
    >
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white w-full max-w-sm border border-zinc-200 rounded-[1.25rem] shadow-2xl">
        <div className="flex flex-col items-center text-center px-6 pt-8 pb-5">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 border ${isActive ? "bg-amber-50 border-amber-200" : "bg-emerald-50 border-emerald-200"}`}>
            {isActive ? <XCircle size={24} className="text-amber-500" /> : <CheckCircle size={24} className="text-emerald-500" />}
          </div>
          <p className="text-base font-bold text-[#1a0f2e]">
            {isActive ? "Deactivate Branch?" : "Activate Branch?"}
          </p>
          <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
            {isActive
              ? <>Marking <span className="font-bold text-zinc-700">{branch.name}</span> as inactive will hide it from operations.</>
              : <>Marking <span className="font-bold text-zinc-700">{branch.name}</span> as active will restore it to operations.</>}
          </p>
          {apiError && (
            <div className="flex items-center gap-2 mt-4 p-3 w-full bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle size={14} className="text-red-500 shrink-0" />
              <p className="text-xs text-red-600 font-medium text-left">{apiError}</p>
            </div>
          )}
        </div>
        <div className="mx-6 mb-5 flex items-center gap-3 p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
          <div className="w-8 h-8 bg-violet-50 border border-violet-200 rounded-lg flex items-center justify-center shrink-0">
            <Store size={14} className="text-violet-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-[#1a0f2e] truncate">{branch.name}</p>
            <p className="text-[10px] text-zinc-400 flex items-center gap-1 truncate">
              <MapPin size={9} />{branch.location}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge status={branch.status} />
            <span className="text-zinc-300">→</span>
            <Badge status={nextStatus} />
          </div>
        </div>
        <div className="flex items-center gap-2 px-6 pb-6">
          <Btn variant="secondary" className="flex-1 justify-center" onClick={onClose} disabled={loading}>Cancel</Btn>
          <button
            onClick={handleToggle}
            disabled={loading}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 text-white ${isActive ? "bg-amber-500 hover:bg-amber-600" : "bg-emerald-600 hover:bg-emerald-700"}`}
          >
            {loading ? (
              <span className="flex items-center gap-1.5">
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Updating...
              </span>
            ) : isActive ? (
              <><XCircle size={13} /> Deactivate</>
            ) : (
              <><CheckCircle size={13} /> Activate</>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ── Main Tab ──────────────────────────────────────────────────────────────────
const BranchesTab: React.FC = () => {
  const [branches,        setBranches]        = useState<Branch[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [fetchError,      setFetchError]      = useState("");
  const [search,          setSearch]          = useState("");
  const [filterStatus,    setFilterStatus]    = useState<string>("all");
  const [filterOwnership, setFilterOwnership] = useState<string>("all");
  const [toggleTarget,    setToggleTarget]    = useState<Branch | null>(null);

  // modal state
  const [addOpen,    setAddOpen]    = useState(false);
  const [viewTarget, setViewTarget] = useState<Branch | null>(null);
  const [editTarget, setEditTarget] = useState<Branch | null>(null);
  const [delTarget,  setDelTarget]  = useState<Branch | null>(null);

  const fetchBranches = async () => {
    setLoading(true);
    setFetchError("");
    try {
      const res = await fetch("/api/branches", { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok || !data.success) { setFetchError(data.message ?? "Failed to load branches."); return; }
      setBranches((data.data as RawBranch[]).map(mapBranch));
    } catch {
      setFetchError("Network error. Could not reach the server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBranches(); }, []);

  const fmt = (v: number) => `₱${Number(v).toLocaleString()}`;

  const filtered = branches.filter(b => {
    const matchSearch    = b.name.toLowerCase().includes(search.toLowerCase()) ||
                           b.location.toLowerCase().includes(search.toLowerCase()) ||
                           b.manager.toLowerCase().includes(search.toLowerCase());
    const matchStatus    = filterStatus    === "all" || b.status         === filterStatus;
    const matchOwnership = filterOwnership === "all" || b.ownership_type === filterOwnership;
    return matchSearch && matchStatus && matchOwnership;
  });

  return (
    <div className="p-6 md:p-8 fade-in">
      <SectionHeader
        action={
          <div className="flex items-center gap-2">
            <Btn variant="secondary" onClick={fetchBranches} disabled={loading}>
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
            </Btn>
            <Btn onClick={() => setAddOpen(true)} disabled={loading}>
              <Plus size={13} /> Add Branch
            </Btn>
          </div>
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<Store       size={16} />} label="Total Branches" value={loading ? "—" : branches.length}                                     color="violet"  />
        <StatCard icon={<CheckCircle size={16} />} label="Active"         value={loading ? "—" : branches.filter(b => b.status === "active").length}  color="emerald" />
        <StatCard icon={<XCircle     size={16} />} label="Inactive"       value={loading ? "—" : branches.filter(b => b.status !== "active").length}  color="red"     />
        <StatCard icon={<PhilippinePeso  size={16} />} label="Today Revenue"  value={loading ? "—" : fmt(branches.reduce((s, b) => s + b.today, 0))}     color="amber"   />
      </div>

      {/* Table */}
      <div className="bg-white border border-zinc-200 rounded-[0.625rem] overflow-hidden">

        {/* Filter bar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-100 flex-wrap">
          <div className="flex-1 flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 min-w-48">
            <Search size={13} className="text-zinc-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm text-zinc-700 outline-none placeholder:text-zinc-400"
              placeholder="Search branches..."
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-zinc-300 hover:text-zinc-500 transition-colors">
                <X size={12} />
              </button>
            )}
          </div>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="text-xs font-bold text-zinc-600 bg-white border border-zinc-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-violet-400 cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select
            value={filterOwnership}
            onChange={e => setFilterOwnership(e.target.value)}
            className="text-xs font-bold text-zinc-600 bg-white border border-zinc-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-violet-400 cursor-pointer"
          >
            <option value="all">All Types</option>
            <option value="company">Company-Owned</option>
            <option value="franchise">Franchise</option>
          </select>
          {(filterStatus !== "all" || filterOwnership !== "all" || search) && (
            <button
              onClick={() => { setSearch(""); setFilterStatus("all"); setFilterOwnership("all"); }}
              className="text-xs font-bold text-zinc-400 hover:text-red-500 transition-colors flex items-center gap-1"
            >
              <X size={11} /> Clear
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100">
                {["Branch", "Location", "Manager", "Type", "VAT", "Today Sales", "Total Sales", "Staff", "Status", "Actions"].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-zinc-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && [...Array(4)].map((_, i) => (
                <tr key={i} className="border-b border-zinc-50">
                  {[...Array(10)].map((_, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-3 bg-zinc-100 rounded animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} />
                    </td>
                  ))}
                </tr>
              ))}

              {!loading && fetchError && (
                <tr>
                  <td colSpan={10} className="px-5 py-10 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle size={20} className="text-red-400" />
                      <p className="text-sm font-semibold text-red-500">{fetchError}</p>
                      <Btn variant="secondary" size="sm" onClick={fetchBranches}>Try again</Btn>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && !fetchError && filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-5 py-10 text-center text-zinc-400 text-xs font-medium">
                    {search || filterStatus !== "all" || filterOwnership !== "all"
                      ? "No branches match your filters."
                      : "No branches found."}
                  </td>
                </tr>
              )}

              {!loading && !fetchError && filtered.map(b => (
                <tr key={b.id} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                  <td className="px-5 py-3.5 font-semibold text-[#1a0f2e]">{b.name}</td>
                  <td className="px-5 py-3.5 text-zinc-500">{b.location}</td>
                  <td className="px-5 py-3.5 text-zinc-600">{b.manager}</td>
                  <td className="px-5 py-3.5"><OwnershipBadge type={b.ownership_type} /></td>
                  <td className="px-5 py-3.5">
                  <VatBadge type={b.vat_type} />
                  </td>
                  <td className="px-5 py-3.5 font-bold text-emerald-600">{b.status === "active" ? fmt(b.today) : "—"}</td>
                  <td className="px-5 py-3.5 font-bold text-[#3b2063]">{fmt(b.total)}</td>
                  <td className="px-5 py-3.5 text-zinc-600">{b.staff || "—"}</td>
                  <td className="px-5 py-3.5"><Badge status={b.status} /></td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setViewTarget(b)}
                        className="p-1.5 hover:bg-violet-50 rounded-[0.4rem] text-zinc-400 hover:text-violet-600 transition-colors" title="View">
                        <Eye size={13} />
                      </button>
                      <button onClick={() => setEditTarget(b)}
                        className="p-1.5 hover:bg-violet-50 rounded-[0.4rem] text-zinc-400 hover:text-violet-600 transition-colors" title="Edit">
                        <Edit2 size={13} />
                      </button>
                      <button onClick={() => setToggleTarget(b)}
                        className={`p-1.5 rounded-[0.4rem] transition-colors ${b.status === "active" ? "hover:bg-amber-50 text-zinc-400 hover:text-amber-500" : "hover:bg-emerald-50 text-zinc-400 hover:text-emerald-600"}`}
                        title={b.status === "active" ? "Deactivate" : "Activate"}>
                        {b.status === "active" ? <XCircle size={13} /> : <CheckCircle size={13} />}
                      </button>
                      <button onClick={() => setDelTarget(b)}
                        className="p-1.5 hover:bg-red-50 rounded-[0.4rem] text-zinc-400 hover:text-red-500 transition-colors" title="Delete">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && !fetchError && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-zinc-50 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
            Showing {filtered.length} of {branches.length} branches
          </div>
        )}
      </div>

      {/* Modals */}
      {addOpen    && <AddBranchModal onClose={() => setAddOpen(false)} onSaved={b => setBranches(prev => [b, ...prev])} />}
      {viewTarget && <ViewBranchModal branch={viewTarget} onClose={() => setViewTarget(null)} />}
      {editTarget && (
        <EditBranchModal
          branch={editTarget}
          onClose={() => setEditTarget(null)}
          onUpdated={updated => { setBranches(prev => prev.map(b => b.id === updated.id ? updated : b)); setEditTarget(null); }}
        />
      )}
      {delTarget && (
        <DeleteConfirmModal
          branch={delTarget}
          onClose={() => setDelTarget(null)}
          onDeleted={id => { setBranches(prev => prev.filter(b => b.id !== id)); setDelTarget(null); }}
        />
      )}
      {toggleTarget && (
        <ToggleStatusModal
          branch={toggleTarget}
          onClose={() => setToggleTarget(null)}
          onToggled={updated => { setBranches(prev => prev.map(b => b.id === updated.id ? updated : b)); setToggleTarget(null); }}
        />
      )}
    </div>
  );
};

export default BranchesTab;