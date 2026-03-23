// components/NewSuperAdmin/Tabs/UsersTab.tsx
import { useState, useEffect } from "react";
import {
  Search, Plus, Eye, Edit2, Trash2, Lock, UserCheck, XCircle,
  Users, ArrowUpRight, ArrowDownRight, X, AlertCircle,
  RefreshCw, Mail, MapPin, ShieldCheck, Trash,
} from "lucide-react";
import { createPortal } from "react-dom";

type ColorKey   = "violet" | "emerald" | "red" | "amber";
type VariantKey = "primary" | "secondary" | "danger" | "ghost";
type SizeKey    = "sm" | "md" | "lg";

interface User {
  id:        number;
  name:      string;
  email:     string;
  role:      string;
  branch:    string;
  branch_id: number | null;
  status:    string;
  lastLogin?: string;
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
interface AddUserModalProps    { onClose: () => void; onSaved:   (u: User) => void; branches: string[]; }
interface EditUserModalProps   { onClose: () => void; onUpdated: (u: User) => void; user: User; branches: string[]; }
interface ViewUserModalProps   { onClose: () => void; user: User; }
interface DeleteUserProps      { onClose: () => void; onDeleted: (id: number) => void; user: User; }
interface ToggleUserProps      { onClose: () => void; onToggled: (u: User) => void; user: User; }

interface RawUser {
  id:          number;
  name:        string;
  email:       string;
  role:        string;
  branch?:     string;
  branch_id?:  number | null;
  status:      string;
}

interface RawBranch {
  id:   number;
  name: string;
}

// ── API helpers ───────────────────────────────────────────────────────────────
const getToken = () =>
  localStorage.getItem("auth_token") || localStorage.getItem("lucky_boba_token") || "";
const authHeaders = (): Record<string, string> => ({
  "Content-Type": "application/json",
  "Accept":       "application/json",
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapUser = (u: any): User => ({
  id:        u.id,
  name:      u.name,
  email:     u.email,
  role:      u.role,
  branch:    u.branch    ?? "—",
  branch_id: u.branch_id ?? null,
  status:    u.status,
  lastLogin: u.last_login_at ?? undefined,
});

const ROLE_LABELS: Record<string, string> = {
  superadmin:     "Super Admin",
  system_admin:   "System Admin",
  branch_manager: "Branch Manager",
  cashier:        "Cashier",
  customer:       "Customer",
  team_leader:    "Team Leader",
};
const ALL_ROLES = ['superadmin', 'system_admin', 'branch_manager', 'team_leader', 'cashier', 'customer'];

// ── Shared UI ─────────────────────────────────────────────────────────────────
const Avatar: React.FC<{ name: string; size?: string }> = ({ name, size = "w-7 h-7 text-[10px]" }) => (
  <div className={`${size} rounded-full bg-[#ede8ff] flex items-center justify-center font-bold text-[#3b2063] shrink-0`}>
    {name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
  </div>
);

const RolePill: React.FC<{ role: string }> = ({ role }) => (
  <span className="text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-200 px-2.5 py-0.5 rounded-full">
    {ROLE_LABELS[role] ?? role}
  </span>
);

const Badge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, string> = {
    ACTIVE: "badge-active", active: "badge-active",
    INACTIVE: "badge-inactive", inactive: "badge-inactive",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${map[status] ?? "badge-inactive"}`}>
      {status}
    </span>
  );
};

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

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, desc, action }) => (
  <div className="flex items-center justify-between mb-5">
    <div>
      <h2 className="text-base font-bold text-[#1a0f2e]">{title}</h2>
      {desc && <p className="text-xs text-zinc-400 mt-0.5">{desc}</p>}
    </div>
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

// ── Modal Shell ───────────────────────────────────────────────────────────────
const ModalShell: React.FC<{
  onClose: () => void; icon: React.ReactNode; title: string; sub: string;
  children: React.ReactNode; footer: React.ReactNode; maxWidth?: string;
}> = ({ onClose, icon, title, sub, children, footer, maxWidth = "max-w-md" }) =>
  createPortal(
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-6"
      style={{ backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", backgroundColor: "rgba(0,0,0,0.45)" }}>
      <div className="absolute inset-0" onClick={onClose} />
      <div className={`relative bg-white w-full ${maxWidth} border border-zinc-200 rounded-[1.25rem] shadow-2xl`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-violet-50 border border-violet-200 rounded-lg flex items-center justify-center">{icon}</div>
            <div>
              <p className="text-sm font-bold text-[#1a0f2e]">{title}</p>
              <p className="text-[10px] text-zinc-400">{sub}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-100 rounded-lg transition-colors text-zinc-400 hover:text-zinc-600">
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5 flex flex-col gap-4 max-h-[65vh] overflow-y-auto">{children}</div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-zinc-100">{footer}</div>
      </div>
    </div>,
    document.body
  );

// ── Field helpers ─────────────────────────────────────────────────────────────
const Field: React.FC<{ label: string; required?: boolean; error?: string; children: React.ReactNode }> = ({ label, required, error, children }) => (
  <div>
    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5 block">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    {children}
    {error && <p className="text-[10px] text-red-500 mt-1 font-medium">{error}</p>}
  </div>
);

const inputCls = (err?: string) =>
  `w-full text-sm font-medium text-zinc-700 bg-zinc-50 border rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white transition-all ${err ? "border-red-300 bg-red-50" : "border-zinc-200"}`;

// ── View Modal ────────────────────────────────────────────────────────────────
const ViewUserModal: React.FC<ViewUserModalProps> = ({ onClose, user }) => {
  const rows: [string, React.ReactNode][] = [
    ["User ID",   `#${user.id}`],
    ["Name",      <div className="flex items-center gap-2"><Avatar name={user.name} />{user.name}</div>],
    ["Email",     <span className="flex items-center gap-1"><Mail size={11} />{user.email}</span>],
    ["Role",      <RolePill role={user.role} />],
    ["Branch",    <span className="flex items-center gap-1"><MapPin size={11} />{user.branch}</span>],
    ["Status",    <Badge status={user.status} />],
    ["Last Login", user.lastLogin ?? "—"],
  ];
  return (
    <ModalShell onClose={onClose} icon={<Eye size={15} className="text-violet-600" />}
      title={user.name} sub="User details"
      footer={<Btn variant="secondary" onClick={onClose}>Close</Btn>}>
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

// ── Add User Modal ────────────────────────────────────────────────────────────
const AddUserModal: React.FC<AddUserModalProps> = ({ onClose, onSaved, branches }) => {
  const [form, setForm] = useState({
    name: "", email: "", password: "", role: "cashier",
    branch: "", status: "ACTIVE",
    manager_pin: "", manager_pin_confirmation: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading,  setLoading]  = useState(false);
  const [apiError, setApiError] = useState("");
  const PIN_ROLES = ['branch_manager', 'team_leader'];
  const showPin = PIN_ROLES.includes(form.role);

const validate = () => {
  const e: Record<string, string> = {};
  if (!form.name.trim())     e.name     = "Name is required.";
  if (!form.email.trim())    e.email    = "Email is required.";
  if (!form.password.trim()) e.password = "Password is required.";
  if (form.password && form.password.length < 6) e.password = "Password must be at least 6 characters.";
  if (showPin) {
    if (!form.manager_pin.trim())
      e.manager_pin = "PIN is required for this role.";
    else if (form.manager_pin.length < 4)
      e.manager_pin = "PIN must be at least 4 digits.";
    else if (form.manager_pin !== form.manager_pin_confirmation)
      e.manager_pin_confirmation = "PINs do not match.";
  }
  return e;
};

const handleSubmit = async () => {
  const e = validate();
  if (Object.keys(e).length) { setErrors(e); return; }
  setLoading(true); setApiError("");
  try {
    const payload: Record<string, string | null> = {
      ...form,
      branch: form.branch || null,
    };
    if (!showPin) {
      delete payload.manager_pin;
      delete payload.manager_pin_confirmation;
    }
    const res  = await fetch("/api/users", {
      method: "POST", headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      if (data.errors) {
        const mapped: Record<string, string> = {};
        Object.entries(data.errors).forEach(([k, v]) => { mapped[k] = Array.isArray(v) ? v[0] : String(v); });
        setErrors(mapped);
      } else { setApiError(data.message ?? "Something went wrong."); }
      return;
    }
    onSaved(mapUser(data.data));
    onClose();
  } catch { setApiError("Network error. Please try again."); }
  finally { setLoading(false); }
};

  const f = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm(p => ({ ...p, [key]: e.target.value }));
      setErrors(ev => { const n = { ...ev }; delete n[key]; return n; });
    },
  });

  return (
    <ModalShell onClose={onClose} icon={<Users size={15} className="text-violet-600" />}
      title="Add User" sub="Create a new system user"
      footer={
        <>
          <Btn variant="secondary" onClick={onClose} disabled={loading}>Cancel</Btn>
          <Btn onClick={handleSubmit} disabled={loading}>
            {loading ? <span className="flex items-center gap-1.5"><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</span>
              : <><Plus size={13} /> Add User</>}
          </Btn>
        </>
      }>
      {apiError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle size={14} className="text-red-500 shrink-0" />
          <p className="text-xs text-red-600 font-medium">{apiError}</p>
        </div>
      )}
      <Field label="Full Name" required error={errors.name}>
        <input {...f("name")} placeholder="e.g. Juan Dela Cruz" className={inputCls(errors.name)} />
      </Field>
      <Field label="Email" required error={errors.email}>
        <input {...f("email")} type="email" placeholder="e.g. juan@luckyboba.com" className={inputCls(errors.email)} />
      </Field>
      <Field label="Password" required error={errors.password}>
        <input {...f("password")} type="password" placeholder="Min. 6 characters" className={inputCls(errors.password)} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Role" required>
          <select {...f("role")} className={inputCls()}>
            {ALL_ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
        </Field>
        <Field label="Status" required>
          <select {...f("status")} className={inputCls()}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </Field>
      </div>
      <Field label="Branch">
        <select {...f("branch")} className={inputCls()}>
          <option value="">— No Branch —</option>
          {branches.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </Field>

      {showPin && (
  <div className="rounded-lg border border-violet-200 bg-violet-50 p-3 space-y-3">
    <div className="flex items-center gap-2">
      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        className="text-violet-600 shrink-0">
        <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
      <p className="text-[10px] font-black uppercase tracking-widest text-violet-700">
        Branch Manager PIN
      </p>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <Field label="PIN" required error={errors.manager_pin}>
        <input
          {...f("manager_pin")}
          type="password"
          placeholder="Min. 4 digits"
          maxLength={8}
          className={inputCls(errors.manager_pin)}
        />
      </Field>
      <Field label="Confirm PIN" required error={errors.manager_pin_confirmation}>
        <input
          {...f("manager_pin_confirmation")}
          type="password"
          placeholder="Re-enter PIN"
          maxLength={8}
          className={inputCls(errors.manager_pin_confirmation)}
        />
      </Field>
    </div>
    <p className="text-[10px] text-violet-500 font-medium">
      This PIN is used to authorize sensitive actions at the POS.
    </p>
  </div>
)}
    </ModalShell>
  );
};

// ── Edit User Modal ───────────────────────────────────────────────────────────
const EditUserModal: React.FC<EditUserModalProps> = ({ onClose, onUpdated, user, branches }) => {
  const [form,     setForm]     = useState({ name: user.name, email: user.email, password: "", role: user.role, branch: user.branch === "—" ? "" : user.branch, status: user.status });
  const [errors,   setErrors]   = useState<Record<string, string>>({});
  const [loading,  setLoading]  = useState(false);
  const [apiError, setApiError] = useState("");

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim())  e.name  = "Name is required.";
    if (!form.email.trim()) e.email = "Email is required.";
    if (form.password && form.password.length < 6) e.password = "Password must be at least 6 characters.";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true); setApiError("");
    try {
      const payload: Record<string, unknown> = {
        name: form.name, email: form.email, role: form.role,
        status: form.status, branch: form.branch || null,
      };
      if (form.password) payload.password = form.password;

      const res  = await fetch(`/api/users/${user.id}`, {
        method: "PUT", headers: authHeaders(), body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data.errors) {
          const mapped: Record<string, string> = {};
          Object.entries(data.errors).forEach(([k, v]) => { mapped[k] = Array.isArray(v) ? v[0] : String(v); });
          setErrors(mapped);
        } else { setApiError(data.message ?? "Something went wrong."); }
        return;
      }
      onUpdated(mapUser(data.data));
      onClose();
    } catch { setApiError("Network error. Please try again."); }
    finally { setLoading(false); }
  };

  const f = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm(p => ({ ...p, [key]: e.target.value }));
      setErrors(ev => { const n = { ...ev }; delete n[key]; return n; });
    },
  });

  return (
    <ModalShell onClose={onClose} icon={<Edit2 size={15} className="text-violet-600" />}
      title="Edit User" sub={`Updating ${user.name}`}
      footer={
        <>
          <Btn variant="secondary" onClick={onClose} disabled={loading}>Cancel</Btn>
          <Btn onClick={handleSubmit} disabled={loading}>
            {loading ? <span className="flex items-center gap-1.5"><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</span> : "Save Changes"}
          </Btn>
        </>
      }>
      {apiError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle size={14} className="text-red-500 shrink-0" />
          <p className="text-xs text-red-600 font-medium">{apiError}</p>
        </div>
      )}
      <Field label="Full Name" required error={errors.name}>
        <input {...f("name")} className={inputCls(errors.name)} />
      </Field>
      <Field label="Email" required error={errors.email}>
        <input {...f("email")} type="email" className={inputCls(errors.email)} />
      </Field>
      <Field label="New Password" error={errors.password}>
        <input {...f("password")} type="password" placeholder="Leave blank to keep current" className={inputCls(errors.password)} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Role" required>
          <select {...f("role")} className={inputCls()}>
            {ALL_ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
        </Field>
        <Field label="Status" required>
          <select {...f("status")} className={inputCls()}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </Field>
      </div>
      <Field label="Branch">
        <select {...f("branch")} className={inputCls()}>
          <option value="">— No Branch —</option>
          {branches.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </Field>
    </ModalShell>
  );
};

// ── Toggle Status Modal ───────────────────────────────────────────────────────
const ToggleStatusModal: React.FC<ToggleUserProps> = ({ onClose, onToggled, user }) => {
  const [loading,  setLoading]  = useState(false);
  const [apiError, setApiError] = useState("");
  const isActive = user.status === "ACTIVE";

  const handleToggle = async () => {
    setLoading(true); setApiError("");
    try {
      const res  = await fetch(`/api/users/${user.id}/toggle-status`, {
        method: "PATCH", headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok || !data.success) { setApiError(data.message ?? "Failed to update status."); return; }
      onToggled(mapUser(data.data));
      onClose();
    } catch { setApiError("Network error. Please try again."); }
    finally { setLoading(false); }
  };

  return createPortal(
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-6"
      style={{ backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", backgroundColor: "rgba(0,0,0,0.45)" }}>
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white w-full max-w-sm border border-zinc-200 rounded-[1.25rem] shadow-2xl">
        <div className="flex flex-col items-center text-center px-6 pt-8 pb-5">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 border ${isActive ? "bg-amber-50 border-amber-200" : "bg-emerald-50 border-emerald-200"}`}>
            {isActive ? <XCircle size={24} className="text-amber-500" /> : <UserCheck size={24} className="text-emerald-500" />}
          </div>
          <p className="text-base font-bold text-[#1a0f2e]">{isActive ? "Deactivate User?" : "Activate User?"}</p>
          <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
            {isActive
              ? <>This will prevent <span className="font-bold text-zinc-700">{user.name}</span> from logging in.</>
              : <>This will restore <span className="font-bold text-zinc-700">{user.name}</span>'s access to the system.</>}
          </p>
          {apiError && (
            <div className="flex items-center gap-2 mt-4 p-3 w-full bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle size={14} className="text-red-500 shrink-0" />
              <p className="text-xs text-red-600 font-medium text-left">{apiError}</p>
            </div>
          )}
        </div>
        {/* User pill */}
        <div className="mx-6 mb-5 flex items-center gap-3 p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
          <Avatar name={user.name} size="w-8 h-8 text-xs" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-[#1a0f2e] truncate">{user.name}</p>
            <p className="text-[10px] text-zinc-400 truncate">{user.email}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge status={user.status} />
            <span className="text-zinc-300">→</span>
            <Badge status={isActive ? "INACTIVE" : "ACTIVE"} />
          </div>
        </div>
        <div className="flex items-center gap-2 px-6 pb-6">
          <Btn variant="secondary" className="flex-1 justify-center" onClick={onClose} disabled={loading}>Cancel</Btn>
          <button onClick={handleToggle} disabled={loading}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer disabled:opacity-50 text-white ${isActive ? "bg-amber-500 hover:bg-amber-600" : "bg-emerald-600 hover:bg-emerald-700"}`}>
            {loading ? <span className="flex items-center gap-1.5"><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Updating...</span>
              : isActive ? <><XCircle size={13} /> Deactivate</> : <><UserCheck size={13} /> Activate</>}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ── Delete Confirm Modal ──────────────────────────────────────────────────────
const DeleteUserModal: React.FC<DeleteUserProps> = ({ onClose, onDeleted, user }) => {
  const [loading,  setLoading]  = useState(false);
  const [apiError, setApiError] = useState("");

  const handleDelete = async () => {
    setLoading(true); setApiError("");
    try {
      const res  = await fetch(`/api/users/${user.id}`, {
        method: "DELETE", headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok || !data.success) { setApiError(data.message ?? "Failed to delete user."); return; }
      onDeleted(user.id);
      onClose();
    } catch { setApiError("Network error. Please try again."); }
    finally { setLoading(false); }
  };

  return createPortal(
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-6"
      style={{ backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", backgroundColor: "rgba(0,0,0,0.45)" }}>
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white w-full max-w-sm border border-zinc-200 rounded-[1.25rem] shadow-2xl">
        <div className="flex flex-col items-center text-center px-6 pt-8 pb-5">
          <div className="w-14 h-14 bg-red-50 border border-red-200 rounded-full flex items-center justify-center mb-4">
            <Trash size={22} className="text-red-500" />
          </div>
          <p className="text-base font-bold text-[#1a0f2e]">Delete User?</p>
          <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
            You're about to permanently delete <span className="font-bold text-zinc-700">{user.name}</span>. This cannot be undone.
          </p>
          {apiError && (
            <div className="flex items-center gap-2 mt-4 p-3 w-full bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle size={14} className="text-red-500 shrink-0" />
              <p className="text-xs text-red-600 font-medium text-left">{apiError}</p>
            </div>
          )}
        </div>
        <div className="mx-6 mb-5 flex items-center gap-3 p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
          <Avatar name={user.name} size="w-8 h-8 text-xs" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-[#1a0f2e] truncate">{user.name}</p>
            <p className="text-[10px] text-zinc-400 truncate flex items-center gap-1">
              <ShieldCheck size={9} />{ROLE_LABELS[user.role] ?? user.role}
            </p>
          </div>
          <Badge status={user.status} />
        </div>
        <div className="flex items-center gap-2 px-6 pb-6">
          <Btn variant="secondary" className="flex-1 justify-center" onClick={onClose} disabled={loading}>Cancel</Btn>
          <Btn variant="danger" className="flex-1 justify-center" onClick={handleDelete} disabled={loading}>
            {loading ? <span className="flex items-center gap-1.5"><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Deleting...</span>
              : <><Trash2 size={13} /> Delete</>}
          </Btn>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ── Main Tab ──────────────────────────────────────────────────────────────────
const UsersTab: React.FC = () => {
  const [users,       setUsers]       = useState<User[]>([]);
  const [branches,    setBranches]    = useState<string[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [fetchError,  setFetchError]  = useState("");
  const [search,      setSearch]      = useState("");
  const [roleFilter,  setRoleFilter]  = useState("");

  const [addOpen,      setAddOpen]      = useState(false);
  const [viewTarget,   setViewTarget]   = useState<User | null>(null);
  const [editTarget,   setEditTarget]   = useState<User | null>(null);
  const [toggleTarget, setToggleTarget] = useState<User | null>(null);
  const [delTarget,    setDelTarget]    = useState<User | null>(null);

  const fetchUsers = async () => {
    setLoading(true); setFetchError("");
    try {
      const [usersRes, branchesRes, auditRes] = await Promise.all([
        fetch("/api/users",                    { headers: authHeaders() }),
        fetch("/api/branches",                 { headers: authHeaders() }),
        fetch("/api/audit-logs?per_page=1",    { headers: authHeaders() }),
      ]);
      const usersData    = await usersRes.json();
      const branchesData = await branchesRes.json();
      const auditData    = await auditRes.json();

      if (!usersRes.ok || !usersData.success) {
        setFetchError(usersData.message ?? "Failed to load users.");
        return;
      }

      const lastLoginMap: Record<number, string> = auditData.last_logins ?? {};

      setUsers((usersData.data as RawUser[]).map(u => ({
        ...mapUser(u),
        lastLogin: lastLoginMap[u.id]
          ? new Date(lastLoginMap[u.id]).toLocaleString('en-PH', {
              month: 'short', day: 'numeric', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })
          : undefined,
      })));

      if (branchesData.success) {
        setBranches((branchesData.data as RawBranch[]).map(b => b.name));
      }
    } catch {
      setFetchError("Network error. Could not reach the server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
                        u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole   = roleFilter ? u.role === roleFilter : true;
    return matchSearch && matchRole;
  });

  return (
    <div className="p-6 md:p-8 fade-in">
      <SectionHeader
        title="User Management"
        desc={loading ? "Loading..." : `${users.length} users · ${users.filter(u => u.status === "ACTIVE").length} active`}
        action={
          <div className="flex items-center gap-2">
            <Btn variant="secondary" onClick={fetchUsers} disabled={loading}>
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
            </Btn>
            <Btn onClick={() => setAddOpen(true)} disabled={loading}>
              <Plus size={13} /> Add User
            </Btn>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard icon={<Users     size={16} />} label="Total Users" value={loading ? "—" : users.length}                                      color="violet"  />
        <StatCard icon={<UserCheck size={16} />} label="Active"      value={loading ? "—" : users.filter(u => u.status === "ACTIVE").length}   color="emerald" />
        <StatCard icon={<XCircle   size={16} />} label="Inactive"    value={loading ? "—" : users.filter(u => u.status !== "ACTIVE").length}   color="red"     />
      </div>

      <div className="bg-white border border-zinc-200 rounded-[0.625rem] overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-100">
          <div className="flex-1 flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2">
            <Search size={13} className="text-zinc-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm text-zinc-700 outline-none placeholder:text-zinc-400"
              placeholder="Search users..." />
          </div>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
            className="bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-600 outline-none">
            <option value="">All Roles</option>
            {ALL_ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100">
                {["Name", "Role", "Branch", "Email", "Last Login", "Status", "Actions"].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-zinc-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-zinc-50">
                  {[...Array(7)].map((_, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-3 bg-zinc-100 rounded animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} />
                    </td>
                  ))}
                </tr>
              ))}

              {!loading && fetchError && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle size={20} className="text-red-400" />
                      <p className="text-sm font-semibold text-red-500">{fetchError}</p>
                      <Btn variant="secondary" size="sm" onClick={fetchUsers}>Try again</Btn>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && !fetchError && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-zinc-400 text-xs font-medium">
                    {search || roleFilter ? "No users match your filters." : "No users found."}
                  </td>
                </tr>
              )}

              {!loading && !fetchError && filtered.map(u => (
                <tr key={u.id} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={u.name} />
                      <span className="font-semibold text-[#1a0f2e]">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5"><RolePill role={u.role} /></td>
                  <td className="px-5 py-3.5 text-zinc-500">{u.branch}</td>
                  <td className="px-5 py-3.5 text-zinc-500">{u.email}</td>
                  <td className="px-5 py-3.5 text-zinc-400 text-xs">{u.lastLogin ?? "—"}</td>
                  <td className="px-5 py-3.5"><Badge status={u.status} /></td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setViewTarget(u)}
                        className="p-1.5 hover:bg-violet-50 rounded-[0.4rem] text-zinc-400 hover:text-violet-600 transition-colors" title="View">
                        <Eye size={13} />
                      </button>
                      <button onClick={() => setEditTarget(u)}
                        className="p-1.5 hover:bg-violet-50 rounded-[0.4rem] text-zinc-400 hover:text-violet-600 transition-colors" title="Edit">
                        <Edit2 size={13} />
                      </button>
                      <button onClick={() => setToggleTarget(u)}
                        className={`p-1.5 rounded-[0.4rem] transition-colors ${u.status === "ACTIVE" ? "hover:bg-amber-50 text-zinc-400 hover:text-amber-500" : "hover:bg-emerald-50 text-zinc-400 hover:text-emerald-600"}`}
                        title={u.status === "ACTIVE" ? "Deactivate" : "Activate"}>
                        {u.status === "ACTIVE" ? <Lock size={13} /> : <UserCheck size={13} />}
                      </button>
                      <button onClick={() => setDelTarget(u)}
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
      </div>

      {/* Modals */}
      {addOpen      && <AddUserModal    onClose={() => setAddOpen(false)}      onSaved={u => setUsers(p => [u, ...p])}                                          branches={branches} />}
      {viewTarget   && <ViewUserModal   onClose={() => setViewTarget(null)}    user={viewTarget} />}
      {editTarget   && <EditUserModal   onClose={() => setEditTarget(null)}    onUpdated={u => { setUsers(p => p.map(x => x.id === u.id ? u : x)); setEditTarget(null); }}   user={editTarget}   branches={branches} />}
      {toggleTarget && <ToggleStatusModal onClose={() => setToggleTarget(null)} onToggled={u => { setUsers(p => p.map(x => x.id === u.id ? u : x)); setToggleTarget(null); }} user={toggleTarget} />}
      {delTarget    && <DeleteUserModal  onClose={() => setDelTarget(null)}    onDeleted={id => { setUsers(p => p.filter(x => x.id !== id)); setDelTarget(null); }}           user={delTarget}    />}
    </div>
  );
};

export default UsersTab;