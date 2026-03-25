// components/NewSuperAdmin/Tabs/UsersTab.tsx
import { useState, useEffect } from "react";
import {
  Search, Plus, Eye, Edit2, Trash2, Lock, UserCheck, XCircle,
  Users, ArrowUpRight, ArrowDownRight, X, AlertCircle,
  RefreshCw, Mail, MapPin, ShieldCheck, Trash, CheckCircle, Laptop,
  MonitorCheck, MonitorOff, Monitor,
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
  has_pin:   boolean;
  device_id?:     number | null;
  device_number?: string | null;
}

interface Branch {
  id:   number;
  name: string;
}

interface PosDevice {
  id:          number;
  device_name: string;
  pos_number:  string;
  branch_id:   number;
  status:      string;
  user_id:     number | null;
  user?:       { id: number; name: string } | null;
  branch?:     { id: number; name: string } | null;
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

interface RawUser {
  id:         number;
  name:       string;
  email:      string;
  role:       string;
  branch?:    string;
  branch_id?: number | null;
  status:     string;
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
  id:            u.id,
  name:          u.name,
  email:         u.email,
  role:          u.role,
  branch:        u.branch    ?? "—",
  branch_id:     u.branch_id ?? null,
  status:        u.status,
  lastLogin:     u.last_login_at ?? undefined,
  has_pin:       u.has_pin ?? false,
  device_id:     u.device_id ?? null,
  device_number: u.device_number ?? u.pos_number ?? null,
});

const ROLE_LABELS: Record<string, string> = {
  superadmin:     "Super Admin",
  system_admin:   "System Admin",
  branch_manager: "Branch Manager",
  cashier:        "Cashier",
  customer:       "Customer",
  team_leader:    "Team Leader",
};
const ALL_ROLES = ["superadmin", "system_admin", "branch_manager", "team_leader", "cashier", "customer"];

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
  const isActive = status === "ACTIVE" || status === "active";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider
      ${isActive ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-zinc-100 text-zinc-500 border border-zinc-200"}`}>
      {status}
    </span>
  );
};

// ── Toast ─────────────────────────────────────────────────────────────────────
type ToastType = "success" | "error" | "warning";
interface ToastProps { message: string; type?: ToastType; onDone: () => void; }

const Toast: React.FC<ToastProps> = ({ message, type = "success", onDone }) => {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  const styles: Record<ToastType, { bar: string; iconBg: string; icon: string }> = {
    success: { bar: "bg-emerald-500", iconBg: "bg-emerald-500", icon: "text-white" },
    error:   { bar: "bg-red-500",     iconBg: "bg-red-500",     icon: "text-white" },
    warning: { bar: "bg-amber-500",   iconBg: "bg-amber-500",   icon: "text-white" },
  };
  const s = styles[type];

  const icons: Record<ToastType, React.ReactNode> = {
    success: <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>,
    error:   <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
    warning: <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>,
  };

  return createPortal(
    <div className="fixed bottom-6 right-6 z-99999" style={{ animation: "slideUpFade 0.25s ease forwards" }}>
      <style>{`@keyframes slideUpFade { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }`}</style>
      <div className="relative flex items-center gap-3 bg-[#1a0f2e] text-white pl-4 pr-3 py-3 rounded-xl shadow-2xl border border-white/10 min-w-55 max-w-xs overflow-hidden">
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${s.bar} rounded-l-xl`} />
        <div className={`w-5 h-5 ${s.iconBg} rounded-full flex items-center justify-center shrink-0 ${s.icon}`}>{icons[type]}</div>
        <p className="text-xs font-semibold flex-1 leading-snug">{message}</p>
        <button onClick={onDone} className="ml-1 text-white/40 hover:text-white transition-colors shrink-0"><X size={13} /></button>
      </div>
    </div>,
    document.body
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
    <div className="bg-white border border-zinc-200 rounded-[0.625rem] px-6 py-5 flex items-center justify-between">
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
// FIX: added optional `hint` prop for helper text shown below the label
const Field: React.FC<{
  label: string; required?: boolean; error?: string; hint?: string; children: React.ReactNode;
}> = ({ label, required, error, hint, children }) => (
  <div>
    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5 block">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    {hint && <p className="text-[10px] text-zinc-400 font-medium mb-1.5 -mt-1">{hint}</p>}
    {children}
    {error && <p className="text-[10px] text-red-500 mt-1 font-medium">{error}</p>}
  </div>
);

const inputCls = (err?: string) =>
  `w-full text-sm font-medium text-zinc-700 bg-zinc-50 border rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white transition-all ${err ? "border-red-300 bg-red-50" : "border-zinc-200"}`;

// ── View Modal ────────────────────────────────────────────────────────────────
const ViewUserModal: React.FC<{ onClose: () => void; user: User }> = ({ onClose, user }) => {
  const rows: [string, React.ReactNode][] = [
    ["User ID",    `#${user.id}`],
    ["Name",       <div className="flex items-center gap-2"><Avatar name={user.name} />{user.name}</div>],
    ["Username",   <span className="flex items-center gap-1"><Mail size={11} />{user.email}</span>],
    ["Role",       <RolePill role={user.role} />],
    ["Branch",     <span className="flex items-center gap-1"><MapPin size={11} />{user.branch}</span>],
    ["Status",     <Badge status={user.status} />],
    ["Last Login", user.lastLogin ?? "—"],
    ...(user.role === "cashier" ? [
      ["Device" as string, user.device_number
        ? <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1"><MonitorCheck size={9} />{user.device_number}</span>
        : <span className="text-[10px] font-bold bg-zinc-100 text-zinc-400 border border-zinc-200 px-2 py-0.5 rounded-full flex items-center gap-1"><MonitorOff size={9} />No device</span>] as [string, React.ReactNode]
    ] : []),
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
const AddUserModal: React.FC<{
  onClose:  () => void;
  onSaved:  (u: User) => void;
  branches: Branch[];
}> = ({ onClose, onSaved, branches }) => {
  const [form, setForm] = useState({
    name: "", username: "", password: "", role: "cashier",
    branch_id: "", status: "ACTIVE",
    manager_pin: "", manager_pin_confirmation: "",
  });
  const [errors,   setErrors]   = useState<Record<string, string>>({});
  const [loading,  setLoading]  = useState(false);
  const [apiError, setApiError] = useState("");

  const PIN_ROLES  = ["branch_manager", "team_leader"];
  const showPin    = PIN_ROLES.includes(form.role);
  const showBranch = ["cashier", "branch_manager", "team_leader"].includes(form.role);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim())     e.name     = "Name is required.";
    if (!form.username.trim()) e.username = "Username is required.";
    if (!form.password.trim()) e.password = "Password is required.";
    if (form.password && form.password.length < 6) e.password = "Password must be at least 6 characters.";
    if (showBranch && !form.branch_id) e.branch_id = "Branch is required for this role.";
    if (showPin) {
      if (!form.manager_pin.trim())         e.manager_pin = "PIN is required for this role.";
      else if (form.manager_pin.length < 4) e.manager_pin = "PIN must be at least 4 digits.";
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: Record<string, any> = {
        name:      form.name,
        email:     form.username,  // backend still uses email field
        password:  form.password,
        role:      form.role,
        status:    form.status,
        branch_id: form.branch_id || null,
      };
      if (showPin) {
        payload.manager_pin              = form.manager_pin;
        payload.manager_pin_confirmation = form.manager_pin_confirmation;
      }
      const res  = await fetch("/api/users", {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data.errors) {
          const mapped: Record<string, string> = {};
          Object.entries(data.errors).forEach(([k, v]) => {
            // remap backend "email" key to "username" for display
            const displayKey = k === "email" ? "username" : k;
            mapped[displayKey] = Array.isArray(v) ? v[0] : String(v);
          });
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
            {loading
              ? <span className="flex items-center gap-1.5"><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</span>
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
      <Field label="Username" required error={errors.username}>
        <input {...f("username")} placeholder="e.g. juan@luckyboba.com" className={inputCls(errors.username)} />
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

      {showBranch && (
        <Field label="Branch" required error={errors.branch_id}>
          {branches.length === 0 ? (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle size={13} className="text-amber-500 shrink-0" />
              <p className="text-xs text-amber-700 font-medium">No branches found. Add a branch first.</p>
            </div>
          ) : (
            <select {...f("branch_id")} className={inputCls(errors.branch_id)}>
              <option value="">— Select a branch —</option>
              {branches.map(b => <option key={b.id} value={String(b.id)}>{b.name}</option>)}
            </select>
          )}
        </Field>
      )}

      {form.role === "cashier" && (
        <div className="flex items-center gap-2 p-3 bg-violet-50 border border-violet-200 rounded-lg">
          <Laptop size={13} className="text-violet-500 shrink-0" />
          <p className="text-[10px] text-violet-700 font-medium">You can assign a POS device to this cashier after saving.</p>
        </div>
      )}

      {showPin && (
        <div className="rounded-lg border border-violet-200 bg-violet-50 p-3 space-y-3">
          <div className="flex items-center gap-2">
            <Lock size={13} className="text-violet-600 shrink-0" />
            <p className="text-[10px] font-black uppercase tracking-widest text-violet-700">Manager PIN</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="PIN" required error={errors.manager_pin}>
              <input {...f("manager_pin")} type="password" placeholder="Min. 4 digits" maxLength={8} className={inputCls(errors.manager_pin)} />
            </Field>
            <Field label="Confirm PIN" required error={errors.manager_pin_confirmation}>
              <input {...f("manager_pin_confirmation")} type="password" placeholder="Re-enter PIN" maxLength={8} className={inputCls(errors.manager_pin_confirmation)} />
            </Field>
          </div>
          <p className="text-[10px] text-violet-500 font-medium">Used to authorize sensitive actions at the POS.</p>
        </div>
      )}
    </ModalShell>
  );
};

// ── Edit User Modal ───────────────────────────────────────────────────────────
const EditUserModal: React.FC<{
  onClose:    () => void;
  onUpdated:  (u: User) => void;
  user:       User;
  branches:   Branch[];
}> = ({ onClose, onUpdated, user, branches }) => {
  const [form, setForm] = useState({
    name:      user.name,
    username:  user.email,  // display as username, send as email
    password:  "",
    role:      user.role,
    branch_id: String(user.branch_id ?? ""),
    status:    user.status,
    manager_pin: "", manager_pin_confirmation: "",
  });
  const [errors,   setErrors]   = useState<Record<string, string>>({});
  const [loading,  setLoading]  = useState(false);
  const [apiError, setApiError] = useState("");

  const PIN_ROLES  = ["branch_manager", "team_leader"];
  const showPin    = PIN_ROLES.includes(form.role) && !user.has_pin;
  const showBranch = ["cashier", "branch_manager", "team_leader"].includes(form.role);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim())     e.name     = "Name is required.";
    if (!form.username.trim()) e.username = "Username is required.";
    if (form.password && form.password.length < 6) e.password = "Password must be at least 6 characters.";
    if (showBranch && !form.branch_id) e.branch_id = "Branch is required for this role.";
    if (showPin) {
      if (!form.manager_pin.trim())         e.manager_pin = "PIN is required for this role.";
      else if (form.manager_pin.length < 4) e.manager_pin = "PIN must be at least 4 digits.";
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: Record<string, any> = {
        name:      form.name,
        email:     form.username,  // backend still uses email field
        role:      form.role,
        status:    form.status,
        branch_id: form.branch_id || null,
      };
      if (form.password) payload.password = form.password;
      if (showPin) {
        payload.manager_pin              = form.manager_pin;
        payload.manager_pin_confirmation = form.manager_pin_confirmation;
      }
      const res  = await fetch(`/api/users/${user.id}`, {
        method: "PUT", headers: authHeaders(), body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data.errors) {
          const mapped: Record<string, string> = {};
          Object.entries(data.errors).forEach(([k, v]) => {
            const displayKey = k === "email" ? "username" : k;
            mapped[displayKey] = Array.isArray(v) ? v[0] : String(v);
          });
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
            {loading
              ? <span className="flex items-center gap-1.5"><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</span>
              : "Save Changes"}
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
      <Field label="Username" required error={errors.username}>
        <input {...f("username")} className={inputCls(errors.username)} />
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

      {showBranch && (
        <Field label="Branch" required error={errors.branch_id}>
          {branches.length === 0 ? (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle size={13} className="text-amber-500 shrink-0" />
              <p className="text-xs text-amber-700 font-medium">No branches found.</p>
            </div>
          ) : (
            <select {...f("branch_id")} className={inputCls(errors.branch_id)}>
              <option value="">— Select a branch —</option>
              {branches.map(b => <option key={b.id} value={String(b.id)}>{b.name}</option>)}
            </select>
          )}
        </Field>
      )}

      {showPin && (
        <div className="rounded-lg border border-violet-200 bg-violet-50 p-3 space-y-3">
          <div className="flex items-center gap-2">
            <Lock size={13} className="text-violet-600 shrink-0" />
            <p className="text-[10px] font-black uppercase tracking-widest text-violet-700">Manager PIN</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="PIN" required error={errors.manager_pin}>
              <input {...f("manager_pin")} type="password" placeholder="Min. 4 digits" maxLength={8} className={inputCls(errors.manager_pin)} />
            </Field>
            <Field label="Confirm PIN" required error={errors.manager_pin_confirmation}>
              <input {...f("manager_pin_confirmation")} type="password" placeholder="Re-enter PIN" maxLength={8} className={inputCls(errors.manager_pin_confirmation)} />
            </Field>
          </div>
          <p className="text-[10px] text-violet-500 font-medium">Used to authorize sensitive actions at the POS.</p>
        </div>
      )}
    </ModalShell>
  );
};

// ── Toggle Status Modal ───────────────────────────────────────────────────────
const ToggleStatusModal: React.FC<{
  onClose:   () => void;
  onToggled: (u: User) => void;
  user:      User;
}> = ({ onClose, onToggled, user }) => {
  const [loading,  setLoading]  = useState(false);
  const [apiError, setApiError] = useState("");
  const isActive = user.status === "ACTIVE";

  const handleToggle = async () => {
    setLoading(true); setApiError("");
    try {
      const res  = await fetch(`/api/users/${user.id}/toggle-status`, { method: "PATCH", headers: authHeaders() });
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
            {loading
              ? <span className="flex items-center gap-1.5"><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Updating...</span>
              : isActive ? <><XCircle size={13} /> Deactivate</> : <><UserCheck size={13} /> Activate</>}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ── Delete Modal ──────────────────────────────────────────────────────────────
const DeleteUserModal: React.FC<{
  onClose:   () => void;
  onDeleted: (id: number) => void;
  user:      User;
}> = ({ onClose, onDeleted, user }) => {
  const [loading,  setLoading]  = useState(false);
  const [apiError, setApiError] = useState("");

  const handleDelete = async () => {
    setLoading(true); setApiError("");
    try {
      const res  = await fetch(`/api/users/${user.id}`, { method: "DELETE", headers: authHeaders() });
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

// ── Reset PIN Modal ───────────────────────────────────────────────────────────
const ResetPinModal: React.FC<{ onClose: () => void; user: User }> = ({ onClose, user }) => {
  const [pin,        setPin]        = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [saving,     setSaving]     = useState(false);
  const [apiError,   setApiError]   = useState("");
  const [success,    setSuccess]    = useState(false);
  const [errors,     setErrors]     = useState<{ pin?: string; pinConfirm?: string }>({});

  const validate = () => {
    const e: { pin?: string; pinConfirm?: string } = {};
    if (!pin.trim())                  e.pin        = "PIN is required.";
    else if (!/^\d{4,8}$/.test(pin)) e.pin        = "PIN must be 4–8 digits.";
    if (pin !== pinConfirm)           e.pinConfirm = "PINs do not match.";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true); setApiError("");
    try {
      const res  = await fetch(`/api/users/${user.id}/pin`, {
        method: "PATCH", headers: authHeaders(),
        body: JSON.stringify({ pin, pin_confirmation: pinConfirm }),
      });
      const data = await res.json();
      if (!res.ok) { setApiError(data.message ?? "Failed to update PIN."); return; }
      setSuccess(true);
      setTimeout(onClose, 1500);
    } catch { setApiError("Network error. Please try again."); }
    finally { setSaving(false); }
  };

  return (
    <ModalShell onClose={onClose} icon={<Lock size={15} className="text-violet-600" />}
      title="Change Manager PIN" sub={`Update PIN for ${user.name}`}
      footer={
        success ? null : (
          <>
            <Btn variant="secondary" onClick={onClose} disabled={saving}>Cancel</Btn>
            <Btn onClick={handleSubmit} disabled={saving}>
              {saving
                ? <span className="flex items-center gap-1.5"><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</span>
                : <><ShieldCheck size={13} /> Update PIN</>}
            </Btn>
          </>
        )
      }>
      {success ? (
        <div className="flex flex-col items-center py-4 gap-3">
          <div className="w-12 h-12 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center">
            <CheckCircle size={24} className="text-emerald-500" />
          </div>
          <p className="text-sm font-bold text-[#1a0f2e]">PIN updated successfully</p>
        </div>
      ) : (
        <>
          {apiError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle size={14} className="text-red-500 shrink-0" />
              <p className="text-xs text-red-600 font-medium">{apiError}</p>
            </div>
          )}
          <div className="flex items-center gap-3 p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
            <Avatar name={user.name} size="w-8 h-8 text-xs" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#1a0f2e] truncate">{user.name}</p>
              <p className="text-[10px] text-zinc-400">{ROLE_LABELS[user.role] ?? user.role}</p>
            </div>
          </div>
          <Field label="New PIN" required error={errors.pin}>
            <input type="password" value={pin}
              onChange={e => { setPin(e.target.value); setErrors(p => ({ ...p, pin: undefined })); }}
              placeholder="Enter 4–8 digit PIN" className={inputCls(errors.pin)} maxLength={8} />
          </Field>
          <Field label="Confirm PIN" required error={errors.pinConfirm}>
            <input type="password" value={pinConfirm}
              onChange={e => { setPinConfirm(e.target.value); setErrors(p => ({ ...p, pinConfirm: undefined })); }}
              placeholder="Re-enter PIN" className={inputCls(errors.pinConfirm)} maxLength={8} />
          </Field>
        </>
      )}
    </ModalShell>
  );
};

// ── Assign Device Modal ───────────────────────────────────────────────────────
const AssignDeviceModal: React.FC<{
  onClose:     () => void;
  onAssigned?: (userId: number, deviceId: number | null, deviceNumber: string | null) => void;
  user:        User;
}> = ({ onClose, onAssigned, user }) => {
  const [devices,    setDevices]    = useState<PosDevice[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [apiError,   setApiError]   = useState("");
  const [success,    setSuccess]    = useState(false);

  const currentDevice = devices.find(d => d.user_id === user.id);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const branchId = user.branch_id;
        const url = branchId
          ? `/api/pos-devices?branch_id=${branchId}`
          : '/api/pos-devices';
        const res  = await fetch(url, { headers: authHeaders() });
        const data = await res.json();
        const list: PosDevice[] = data?.devices ?? data?.data ?? data ?? [];
        setDevices(list.filter(d => d.status === "ACTIVE"));
        const assigned = list.find(d => d.user_id === user.id);
        if (assigned) setSelectedId(String(assigned.id));
      } catch { setApiError("Failed to load devices."); }
      finally { setLoading(false); }
    })();
  }, [user.id]);

  const handleAssign = async () => {
    if (!selectedId) return;
    setSaving(true); setApiError("");
    try {
      const res  = await fetch(`/api/pos-devices/${selectedId}/assign`, {
        method: "PATCH", headers: authHeaders(),
        body: JSON.stringify({ user_id: user.id }),
      });
      const data = await res.json();
      if (!res.ok) { setApiError(data.message ?? "Failed to assign device."); return; }
      const assignedDevice = devices.find(d => String(d.id) === selectedId);
      onAssigned?.(user.id, assignedDevice?.id ?? null, assignedDevice?.pos_number ?? null);
      setSuccess(true); setTimeout(onClose, 1500);
    } catch { setApiError("Network error."); }
    finally { setSaving(false); }
  };

  const handleUnassign = async () => {
    if (!currentDevice) return;
    setSaving(true); setApiError("");
    try {
      // FIX: unassign uses DELETE method to match the route definition
      const res  = await fetch(`/api/pos-devices/${currentDevice.id}/unassign`, {
        method: "DELETE", headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) { setApiError(data.message ?? "Failed to unassign device."); return; }
      onAssigned?.(user.id, null, null);
      setSuccess(true); setTimeout(onClose, 1500);
    } catch { setApiError("Network error."); }
    finally { setSaving(false); }
  };

  return (
    <ModalShell onClose={onClose} icon={<Laptop size={15} className="text-violet-600" />}
      title="Assign POS Device" sub={`Link a device to ${user.name}`}
      footer={
        success ? null : (
          <>
            <Btn variant="secondary" onClick={onClose} disabled={saving}>Cancel</Btn>
            {currentDevice && (
              <Btn variant="danger" onClick={handleUnassign} disabled={saving || loading}>
                {saving ? <span className="flex items-center gap-1.5"><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Removing...</span> : <><MonitorOff size={13} /> Unassign</>}
              </Btn>
            )}
            <Btn onClick={handleAssign} disabled={saving || loading || !selectedId}>
              {saving ? <span className="flex items-center gap-1.5"><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Assigning...</span> : <><MonitorCheck size={13} /> Assign Device</>}
            </Btn>
          </>
        )
      }>
      {success ? (
        <div className="flex flex-col items-center py-4 gap-3">
          <div className="w-12 h-12 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center">
            <CheckCircle size={24} className="text-emerald-500" />
          </div>
          <p className="text-sm font-bold text-[#1a0f2e]">Device updated successfully</p>
        </div>
      ) : (
        <>
          {apiError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle size={14} className="text-red-500 shrink-0" />
              <p className="text-xs text-red-600 font-medium">{apiError}</p>
            </div>
          )}

          <div className="flex items-center gap-3 p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
            <Avatar name={user.name} size="w-8 h-8 text-xs" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-[#1a0f2e] truncate">{user.name}</p>
              <p className="text-[10px] text-zinc-400">{user.email}</p>
            </div>
            {currentDevice
              ? <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <MonitorCheck size={9} />{currentDevice.pos_number}
                </span>
              : <span className="text-[10px] font-bold bg-zinc-100 text-zinc-400 border border-zinc-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <MonitorOff size={9} />No device
                </span>}
          </div>

          {currentDevice ? (
            <div className="flex items-center gap-2 p-3 bg-violet-50 border border-violet-200 rounded-lg">
              <MonitorCheck size={13} className="text-violet-500 shrink-0" />
              <p className="text-xs text-violet-700 font-medium">
                Currently on <span className="font-bold">{currentDevice.pos_number}</span>
                {currentDevice.branch?.name ? ` — ${currentDevice.branch.name}` : ""}. You can switch to a different device or unassign.
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <MonitorOff size={13} className="text-amber-500 shrink-0" />
              <p className="text-xs text-amber-700 font-medium">
                No device assigned yet. Select a POS device below to link it to this cashier.
              </p>
            </div>
          )}

          <Field label="Select POS Device" required>
            {loading ? (
              <div className="h-10 bg-zinc-100 rounded-lg animate-pulse" />
            ) : devices.length === 0 ? (
              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertCircle size={13} className="text-amber-500 shrink-0" />
                <p className="text-xs text-amber-700 font-medium">No active POS devices found. Register a device first.</p>
              </div>
            ) : (
              <select value={selectedId} onChange={e => setSelectedId(e.target.value)} className={inputCls()}>
                <option value="">— Select a device —</option>
                {devices.map(d => (
                  <option key={d.id} value={String(d.id)}>
                    {d.pos_number}
                    {d.branch?.name ? ` — ${d.branch.name}` : ""}
                    {d.user_id && d.user_id !== user.id
                      ? ` ⚠ assigned to ${d.user?.name ?? "another cashier"}`
                      : d.user_id === user.id ? " ✓ current" : ""}
                  </option>
                ))}
              </select>
            )}
          </Field>

          <p className="text-[10px] text-zinc-400 font-medium">
            Only <span className="font-bold">ACTIVE</span> devices are shown. Reassigning a device from another cashier will remove it from them.
          </p>
        </>
      )}
    </ModalShell>
  );
};

// ── Register Device Modal (superadmin only) ───────────────────────────────────
const RegisterDeviceModal: React.FC<{
  onClose:      () => void;
  onRegistered: (device: PosDevice) => void;
  branches:     Branch[];
}> = ({ onClose, onRegistered, branches }) => {
  const [form, setForm] = useState({ device_name: "", pos_number: "", branch_id: "" });
  const [errors,   setErrors]   = useState<Record<string, string>>({});
  const [saving,   setSaving]   = useState(false);
  const [apiError, setApiError] = useState("");
  const [success,  setSuccess]  = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.device_name.trim()) e.device_name = "Device ID is required.";
    if (!form.pos_number.trim())  e.pos_number  = "POS number is required.";
    if (!form.branch_id)          e.branch_id   = "Branch is required.";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true); setApiError("");
    try {
      const res  = await fetch("/api/pos-devices", {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({
          device_name: form.device_name.trim(),
          pos_number:  form.pos_number.trim(),
          branch_id:   Number(form.branch_id),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.errors) {
          const mapped: Record<string, string> = {};
          Object.entries(data.errors).forEach(([k, v]) => { mapped[k] = Array.isArray(v) ? v[0] : String(v); });
          setErrors(mapped);
        } else { setApiError(data.message ?? "Failed to register device."); }
        return;
      }
      onRegistered(data.device);
      setSuccess(true);
      setTimeout(onClose, 1500);
    } catch { setApiError("Network error. Please try again."); }
    finally { setSaving(false); }
  };

  const f = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (ev: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm(p => ({ ...p, [key]: ev.target.value }));
      setErrors(p => { const n = { ...p }; delete n[key]; return n; });
    },
  });

  return (
    <ModalShell onClose={onClose} icon={<Monitor size={15} className="text-violet-600" />}
      title="Register POS Device" sub="Add a new terminal to the system"
      footer={
        success ? null : (
          <>
            <Btn variant="secondary" onClick={onClose} disabled={saving}>Cancel</Btn>
            <Btn onClick={handleSubmit} disabled={saving}>
              {saving
                ? <span className="flex items-center gap-1.5"><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Registering...</span>
                : <><Plus size={13} /> Register Device</>}
            </Btn>
          </>
        )
      }>
      {success ? (
        <div className="flex flex-col items-center py-4 gap-3">
          <div className="w-12 h-12 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center">
            <CheckCircle size={24} className="text-emerald-500" />
          </div>
          <p className="text-sm font-bold text-[#1a0f2e]">Device registered successfully</p>
          <p className="text-xs text-zinc-400">You can now assign it to a cashier.</p>
        </div>
      ) : (
        <>
          {apiError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle size={14} className="text-red-500 shrink-0" />
              <p className="text-xs text-red-600 font-medium">{apiError}</p>
            </div>
          )}
          <div className="flex items-start gap-3 p-3 bg-violet-50 border border-violet-200 rounded-lg">
            <Laptop size={14} className="text-violet-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-violet-700 mb-0.5">How to get the Device ID</p>
              <p className="text-xs text-violet-600 leading-relaxed">
                On the POS terminal, open the app. If unregistered it shows a <span className="font-bold">"Device Not Registered"</span> screen with the Device ID. The cashier copies it and sends it to you.
              </p>
            </div>
          </div>
          {/* hint prop now works — added to Field component above */}
          <Field label="Device ID" required error={errors.device_name}
            hint="Paste the ID shown on the terminal's unregistered screen.">
            <input {...f("device_name")} placeholder="e.g. DEV-3700E18D-2001-4E36-9270-ABCD1234..." className={inputCls(errors.device_name)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="POS Number" required error={errors.pos_number}
              hint="Friendly label used in reports.">
              <input {...f("pos_number")} placeholder="e.g. POS-001" className={inputCls(errors.pos_number)} />
            </Field>
            <Field label="Branch" required error={errors.branch_id}>
              {branches.length === 0 ? (
                <div className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertCircle size={12} className="text-amber-500 shrink-0" />
                  <p className="text-xs text-amber-700">No branches found.</p>
                </div>
              ) : (
                <select {...f("branch_id")} className={inputCls(errors.branch_id)}>
                  <option value="">— Select branch —</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              )}
            </Field>
          </div>
        </>
      )}
    </ModalShell>
  );
};

// ── Device pill ───────────────────────────────────────────────────────────────
const DevicePill: React.FC<{ deviceNumber?: string | null }> = ({ deviceNumber }) =>
  deviceNumber ? (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
      <MonitorCheck size={9} />{deviceNumber}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-zinc-100 text-zinc-400 border border-zinc-200 px-2 py-0.5 rounded-full">
      <MonitorOff size={9} />None
    </span>
  );

// ── Main Tab ──────────────────────────────────────────────────────────────────
const UsersTab: React.FC = () => {
  const [users,       setUsers]       = useState<User[]>([]);
  const [branches,    setBranches]    = useState<Branch[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [fetchError,  setFetchError]  = useState("");
  const [search,      setSearch]      = useState("");
  const [roleFilter,  setRoleFilter]  = useState("");

  const [addOpen,      setAddOpen]      = useState(false);
  const [viewTarget,   setViewTarget]   = useState<User | null>(null);
  const [editTarget,   setEditTarget]   = useState<User | null>(null);
  const [toggleTarget, setToggleTarget] = useState<User | null>(null);
  const [delTarget,    setDelTarget]    = useState<User | null>(null);
  const [pinTarget,    setPinTarget]    = useState<User | null>(null);
  const [deviceTarget, setDeviceTarget] = useState<User | null>(null);
  const [registerOpen, setRegisterOpen] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const showToast = (message: string, type: ToastType = "success") => setToast({ message, type });

  const fetchUsers = async () => {
    setLoading(true); setFetchError("");
    try {
      const [usersRes, branchesRes] = await Promise.all([
        fetch("/api/users",    { headers: authHeaders() }),
        fetch("/api/branches", { headers: authHeaders() }),
      ]);
      const usersData    = await usersRes.json();
      const branchesData = await branchesRes.json();

      if (!usersRes.ok || !usersData.success) {
        setFetchError(usersData.message ?? "Failed to load users.");
        return;
      }

      setUsers((usersData.data as RawUser[]).map(mapUser));

      if (branchesData.success) {
        setBranches(branchesData.data as Branch[]);
      }
    } catch {
      setFetchError("Network error. Could not reach the server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleDeviceAssigned = (userId: number, deviceId: number | null, deviceNumber: string | null) => {
    setUsers(prev => prev.map(u =>
      u.id === userId ? { ...u, device_id: deviceId, device_number: deviceNumber } : u
    ));
  };

  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
                        u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole   = roleFilter ? u.role === roleFilter : true;
    return matchSearch && matchRole;
  });

  const showDeviceCol = !roleFilter || roleFilter === "cashier";

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
            <Btn variant="secondary" onClick={() => setRegisterOpen(true)} disabled={loading}>
              <Monitor size={13} /> Register Device
            </Btn>
            <Btn onClick={() => setAddOpen(true)} disabled={loading}>
              <Plus size={13} /> Add User
            </Btn>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard icon={<Users     size={16} />} label="Total Users" value={loading ? "—" : users.length}                                    color="violet"  />
        <StatCard icon={<UserCheck size={16} />} label="Active"      value={loading ? "—" : users.filter(u => u.status === "ACTIVE").length} color="emerald" />
        <StatCard icon={<XCircle   size={16} />} label="Inactive"    value={loading ? "—" : users.filter(u => u.status !== "ACTIVE").length} color="red"     />
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
                {[
                  "Name", "Role", "Branch", "Username", "Last Login",
                  ...(showDeviceCol ? ["Device"] : []),
                  "Status", "Actions"
                ].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-zinc-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-zinc-50">
                  {[...Array(showDeviceCol ? 8 : 7)].map((_, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-3 bg-zinc-100 rounded animate-pulse" style={{ width: `${60 + (j * 7) % 40}%` }} />
                    </td>
                  ))}
                </tr>
              ))}
              {!loading && fetchError && (
                <tr>
                  <td colSpan={showDeviceCol ? 8 : 7} className="px-5 py-10 text-center">
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
                  <td colSpan={showDeviceCol ? 8 : 7} className="px-5 py-10 text-center text-zinc-400 text-xs font-medium">
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
                  {showDeviceCol && (
                    <td className="px-5 py-3.5">
                      {u.role === "cashier"
                        ? <DevicePill deviceNumber={u.device_number} />
                        : <span className="text-zinc-300 text-xs">—</span>}
                    </td>
                  )}
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
                      {["branch_manager", "team_leader"].includes(u.role) && (
                        <button onClick={() => setPinTarget(u)}
                          className="p-1.5 hover:bg-violet-50 rounded-[0.4rem] text-zinc-400 hover:text-violet-600 transition-colors" title="Change PIN">
                          <ShieldCheck size={13} />
                        </button>
                      )}
                      {u.role === "cashier" && (
                        <button
                          onClick={() => setDeviceTarget(u)}
                          className={`p-1.5 rounded-[0.4rem] transition-colors ${
                            u.device_number
                              ? "hover:bg-violet-50 text-violet-500 hover:text-violet-700"
                              : "hover:bg-amber-50 text-amber-400 hover:text-amber-600"
                          }`}
                          title={u.device_number ? `Device: ${u.device_number} — click to change` : "No device assigned — click to assign"}>
                          <Laptop size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {addOpen      && <AddUserModal      onClose={() => setAddOpen(false)}      onSaved={u  => { setUsers(p => [u, ...p]); showToast(`${u.name} has been created.`); }} branches={branches} />}
      {viewTarget   && <ViewUserModal     onClose={() => setViewTarget(null)}    user={viewTarget} />}
      {editTarget   && <EditUserModal     onClose={() => setEditTarget(null)}    onUpdated={u => { setUsers(p => p.map(x => x.id === u.id ? u : x)); setEditTarget(null); showToast(`${u.name} has been updated.`); }} user={editTarget} branches={branches} />}
      {toggleTarget && <ToggleStatusModal onClose={() => setToggleTarget(null)}  onToggled={u => { setUsers(p => p.map(x => x.id === u.id ? u : x)); setToggleTarget(null); showToast(`${u.name} ${u.status === "ACTIVE" ? "activated" : "deactivated"}.`, u.status === "ACTIVE" ? "success" : "warning"); }} user={toggleTarget} />}
      {delTarget    && <DeleteUserModal   onClose={() => setDelTarget(null)}     onDeleted={id => { setUsers(p => p.filter(x => x.id !== id)); setDelTarget(null); showToast("User deleted successfully.", "error"); }} user={delTarget} />}
      {pinTarget    && <ResetPinModal     onClose={() => setPinTarget(null)}     user={pinTarget} />}
      {deviceTarget && <AssignDeviceModal onClose={() => setDeviceTarget(null)}  onAssigned={handleDeviceAssigned} user={deviceTarget} />}

      {registerOpen && (
        <RegisterDeviceModal
          onClose={() => setRegisterOpen(false)}
          onRegistered={() => { setRegisterOpen(false); showToast("Device registered. You can now assign it to a cashier."); }}
          branches={branches}
        />
      )}
      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
};

export default UsersTab;