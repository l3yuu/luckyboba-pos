// components/NewSuperAdmin/Tabs/DeviceManagementTab.tsx
import { useState, useEffect } from "react";
import {
  Monitor, Plus, Trash2, AlertCircle,
  X, CheckCircle, ToggleLeft, ToggleRight,
  MonitorCheck, MonitorOff, Search, Laptop,
  Link,
} from "lucide-react";
import { createPortal } from "react-dom";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Branch {
  id: number;
  name: string;
}

interface PosDevice {
  id: number;
  device_name: string;
  pos_number: string;
  branch_id: number;
  status: "ACTIVE" | "INACTIVE";
  last_seen?: string | null;
  user_id: number | null;
  user?: { id: number; name: string } | null;
  assigned_users?: { id: number; name: string }[];  // ← ADD
  branch?: { id: number; name: string } | null;
}

interface Cashier {
  id: number;
  name: string;
  email: string;
}

// ── API helpers ───────────────────────────────────────────────────────────────
const getToken = () =>
  localStorage.getItem("auth_token") || localStorage.getItem("lucky_boba_token") || "";
const authHeaders = (): Record<string, string> => ({
  "Content-Type": "application/json",
  "Accept": "application/json",
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

// ── Shared UI ─────────────────────────────────────────────────────────────────
type ToastType = "success" | "error" | "warning";

const Toast: React.FC<{ message: string; type: ToastType; onDone: () => void }> = ({ message, type, onDone }) => {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
  const bar = type === "success" ? "bg-emerald-500" : type === "error" ? "bg-red-500" : "bg-amber-500";
  return createPortal(
    <div className="fixed bottom-6 right-6 z-99999" style={{ animation: "slideUpFade 0.25s ease forwards" }}>
      <style>{`@keyframes slideUpFade { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }`}</style>
      <div className="relative flex items-center gap-3 bg-[#1a0f2e] text-white pl-4 pr-3 py-3 rounded-xl shadow-2xl border border-white/10 min-w-55 max-w-xs overflow-hidden">
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${bar} rounded-l-xl`} />
        <p className="text-xs font-semibold flex-1 leading-snug">{message}</p>
        <button onClick={onDone} className="ml-1 text-white/40 hover:text-white"><X size={13} /></button>
      </div>
    </div>,
    document.body
  );
};

const Btn: React.FC<{
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md";
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}> = ({ children, variant = "primary", size = "sm", onClick, disabled, className = "" }) => {
  const v = {
    primary: "bg-[#6a12b8] hover:bg-[#2a1647] text-white",
    secondary: "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50",
    danger: "bg-red-600 hover:bg-red-700 text-white",
    ghost: "bg-transparent text-zinc-500 hover:bg-zinc-100",
  }[variant];
  const s = size === "sm" ? "px-3 py-2 text-xs" : "px-4 py-2.5 text-sm";
  return (
    <button onClick={onClick} disabled={disabled}
      className={`inline-flex items-center gap-1.5 font-bold rounded-lg transition-all disabled:opacity-50 cursor-pointer ${v} ${s} ${className}`}>
      {children}
    </button>
  );
};

const ModalShell: React.FC<{
  onClose: () => void; icon: React.ReactNode; title: string; sub: string;
  children: React.ReactNode; footer: React.ReactNode; maxWidth?: string;
}> = ({ onClose, icon, title, sub, children, footer, maxWidth = "max-w-md" }) =>
    createPortal(
      <div className="fixed inset-0 z-9999 flex items-center justify-center p-6"
        style={{ backdropFilter: "blur(6px)", backgroundColor: "rgba(0,0,0,0.45)" }}>
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
            <button onClick={onClose} className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-zinc-600"><X size={16} /></button>
          </div>
          <div className="px-6 py-5 flex flex-col gap-4 max-h-[65vh] overflow-y-auto">{children}</div>
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-zinc-100">{footer}</div>
        </div>
      </div>,
      document.body
    );

const Field: React.FC<{ label: string; required?: boolean; error?: string; hint?: string; children: React.ReactNode }> = ({ label, required, error, hint, children }) => (
  <div>
    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5 block">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    {hint && <p className="text-[10px] text-zinc-400 mb-1.5 -mt-1">{hint}</p>}
    {children}
    {error && <p className="text-[10px] text-red-500 mt-1 font-medium">{error}</p>}
  </div>
);

const inputCls = (err?: string) =>
  `w-full text-sm font-medium text-zinc-700 bg-zinc-50 border rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white transition-all ${err ? "border-red-300 bg-red-50" : "border-zinc-200"}`;

// ── Register Device Modal ─────────────────────────────────────────────────────
const RegisterDeviceModal: React.FC<{
  onClose: () => void;
  onRegistered: (device: PosDevice) => void;
  branches: Branch[];
}> = ({ onClose, onRegistered, branches }) => {
  const [form, setForm] = useState({ device_name: "", pos_number: "", branch_id: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState("");
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.device_name.trim()) e.device_name = "Device ID is required.";
    if (!form.pos_number.trim()) e.pos_number = "POS number is required.";
    if (!form.branch_id) e.branch_id = "Branch is required.";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true); setApiError("");
    try {
      const res = await fetch("/api/pos-devices", {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ device_name: form.device_name.trim(), pos_number: form.pos_number.trim(), branch_id: Number(form.branch_id) }),
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
      footer={success ? null : (
        <>
          <Btn variant="secondary" onClick={onClose} disabled={saving}>Cancel</Btn>
          <Btn onClick={handleSubmit} disabled={saving}>
            {saving ? <span className="flex items-center gap-1.5"><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Registering...</span> : <><Plus size={13} /> Register Device</>}
          </Btn>
        </>
      )}>
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
                On the POS terminal, open the app. If unregistered it shows a <span className="font-bold">"Device Not Registered"</span> screen with the Device ID.
              </p>
            </div>
          </div>
          <Field label="Device ID" required error={errors.device_name} hint="Paste the ID shown on the terminal's unregistered screen.">
            <input {...f("device_name")} placeholder="e.g. DEV-3700E18D-2001-4E36-9270-ABCD1234..." className={inputCls(errors.device_name)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="POS Number" required error={errors.pos_number}>
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

// ── Assign Cashier Modal ──────────────────────────────────────────────────────
const AssignCashierModal: React.FC<{
  onClose: () => void;
  onAssigned: (deviceId: number, userId: number | null, user: { id: number; name: string } | null) => void;
  device: PosDevice;
}> = ({ onClose, onAssigned, device }) => {
  const [cashiers, setCashiers] = useState<Cashier[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [assigned, setAssigned] = useState<Cashier[]>([]);  // multiple assigned cashiers
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState("");
  const [success, setSuccess] = useState(false);



  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
          `/api/users?role=cashier&branch_id=${device.branch_id}&status=ACTIVE`,
          { headers: authHeaders() }
        );
        const data = await res.json();
        const list = (data.data ?? data.users ?? data ?? []) as {
          id: number; name: string; email: string;
          status: string; role: string; branch_id: number | null;
        }[];
        const filtered = list.filter(u =>
          u.status === "ACTIVE" &&
          u.role === "cashier" &&
          u.branch_id === device.branch_id
        );
        setCashiers(filtered);

        // Use assigned_users from the device object directly (populated by backend)
        const alreadyAssigned = (device.assigned_users ?? (device.user ? [device.user] : []))
          .map(u => filtered.find(c => c.id === u.id))
          .filter(Boolean) as Cashier[];
        setAssigned(alreadyAssigned);
      } catch { setApiError("Failed to load cashiers."); }
      finally { setLoading(false); }
    })();
  }, [device.assigned_users, device.branch_id, device.id, device.user]);

  const isAlreadyAssigned = (id: number) => assigned.some(a => a.id === id);

  const handleAssign = async () => {
    if (!selectedId) return;
    setSaving(true); setApiError("");
    try {
      const res = await fetch(`/api/pos-devices/${device.id}/assign`, {
        method: "PATCH", headers: authHeaders(),
        body: JSON.stringify({ user_id: Number(selectedId) }),
      });
      const data = await res.json();
      if (!res.ok) { setApiError(data.message ?? "Failed to assign cashier."); return; }
      const cashier = cashiers.find(c => String(c.id) === selectedId);
      if (cashier) setAssigned(p => [...p.filter(a => a.id !== cashier.id), cashier]);
      onAssigned(device.id, cashier?.id ?? null, cashier ? { id: cashier.id, name: cashier.name } : null);
      setSelectedId("");
      setSuccess(true); setTimeout(() => setSuccess(false), 2000);
    } catch { setApiError("Network error."); }
    finally { setSaving(false); }
  };

  const handleUnassign = async (cashierId: number) => {
    setSaving(true); setApiError("");
    try {
      const res = await fetch(`/api/pos-devices/${device.id}/unassign`, {
        method: "DELETE", headers: authHeaders(),
        body: JSON.stringify({ user_id: cashierId }),
      });
      const data = await res.json();
      if (!res.ok) { setApiError(data.message ?? "Failed to unassign."); return; }
      setAssigned(p => p.filter(a => a.id !== cashierId));
      onAssigned(device.id, null, { id: cashierId, name: "" }); // ← pass id so parent can filter
    } catch { setApiError("Network error."); }
    finally { setSaving(false); }
  };
  return (
    <ModalShell onClose={onClose} icon={<Link size={15} className="text-violet-600" />}
      title="Assign Cashiers" sub={`Manage cashiers for ${device.pos_number}`}
      footer={
        <>
          <Btn variant="secondary" onClick={onClose} disabled={saving}>Close</Btn>
          <Btn onClick={handleAssign} disabled={saving || loading || !selectedId}>
            {saving
              ? <span className="flex items-center gap-1.5"><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Assigning...</span>
              : <><Link size={13} /> Assign</>}
          </Btn>
        </>
      }>
      {/* Device info */}
      <div className="flex items-center gap-3 p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
        <div className="w-9 h-9 bg-violet-50 border border-violet-200 rounded-lg flex items-center justify-center shrink-0">
          <Monitor size={16} className="text-violet-600" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-[#1a0f2e]">{device.pos_number}</p>
          <p className="text-[10px] text-zinc-400">{device.branch?.name ?? "—"}</p>
        </div>
        <span className="text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-200 px-2 py-0.5 rounded-full">
          {assigned.length} assigned
        </span>
      </div>

      {apiError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle size={14} className="text-red-500 shrink-0" />
          <p className="text-xs text-red-600 font-medium">{apiError}</p>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
          <CheckCircle size={14} className="text-emerald-500 shrink-0" />
          <p className="text-xs text-emerald-700 font-medium">Cashier assigned successfully.</p>
        </div>
      )}

      {/* Currently assigned list */}
      {assigned.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2">Currently Assigned</p>
          <div className="flex flex-col gap-1.5">
            {assigned.map(c => (
              <div key={c.id} className="flex items-center gap-2.5 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                <MonitorCheck size={12} className="text-emerald-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-emerald-800 truncate">{c.name}</p>
                  <p className="text-[10px] text-emerald-600 truncate">{c.email}</p>
                </div>
                <button
                  onClick={() => handleUnassign(c.id)}
                  disabled={saving}
                  className="p-1 hover:bg-red-100 rounded text-emerald-400 hover:text-red-500 transition-colors disabled:opacity-40"
                  title="Unassign">
                  <X size={11} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add new cashier */}
      <Field label="Add Cashier" required>
        {loading ? (
          <div className="h-10 bg-zinc-100 rounded-lg animate-pulse" />
        ) : cashiers.length === 0 ? (
          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle size={13} className="text-amber-500 shrink-0" />
            <p className="text-xs text-amber-700 font-medium">No active cashiers found for this branch.</p>
          </div>
        ) : (
          <select value={selectedId} onChange={e => setSelectedId(e.target.value)} className={inputCls()}>
            <option value="">— Select a cashier to add —</option>
            {cashiers.map(c => (
              <option key={c.id} value={String(c.id)}>
                {c.name} — {c.email}
                {isAlreadyAssigned(c.id) ? " ✓ assigned" : ""}
              </option>
            ))}
          </select>
        )}
      </Field>
    </ModalShell>
  );
};

// ── Delete Device Modal ───────────────────────────────────────────────────────
const DeleteDeviceModal: React.FC<{
  onClose: () => void;
  onDeleted: (id: number) => void;
  device: PosDevice;
}> = ({ onClose, onDeleted, device }) => {
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/pos-devices/${device.id}`, { method: "DELETE", headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) { setApiError(data.message ?? "Failed to delete."); return; }
      onDeleted(device.id);
      onClose();
    } catch { setApiError("Network error."); }
    finally { setLoading(false); }
  };

  return createPortal(
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-6"
      style={{ backdropFilter: "blur(6px)", backgroundColor: "rgba(0,0,0,0.45)" }}>
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white w-full max-w-sm border border-zinc-200 rounded-[1.25rem] shadow-2xl">
        <div className="flex flex-col items-center text-center px-6 pt-8 pb-5">
          <div className="w-14 h-14 bg-red-50 border border-red-200 rounded-full flex items-center justify-center mb-4">
            <Trash2 size={22} className="text-red-500" />
          </div>
          <p className="text-base font-bold text-[#1a0f2e]">Delete Device?</p>
          <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
            Permanently remove <span className="font-bold text-zinc-700">{device.pos_number}</span>. This cannot be undone.
          </p>
          {apiError && (
            <div className="flex items-center gap-2 mt-4 p-3 w-full bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle size={14} className="text-red-500 shrink-0" />
              <p className="text-xs text-red-600 font-medium text-left">{apiError}</p>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 px-6 pb-6">
          <Btn variant="secondary" className="flex-1 justify-center" onClick={onClose} disabled={loading}>Cancel</Btn>
          <Btn variant="danger" className="flex-1 justify-center" onClick={handleDelete} disabled={loading}>
            {loading ? <span className="flex items-center gap-1.5"><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Deleting...</span> : <><Trash2 size={13} /> Delete</>}
          </Btn>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ── Main Tab ──────────────────────────────────────────────────────────────────
const DeviceManagementTab: React.FC = () => {
  const [devices, setDevices] = useState<PosDevice[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");

  const [registerOpen, setRegisterOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState<PosDevice | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PosDevice | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const showToast = (message: string, type: ToastType = "success") => setToast({ message, type });

  const fetchData = async () => {
    setLoading(true); setFetchError("");
    try {
      const [devRes, brRes] = await Promise.all([
        fetch("/api/pos-devices", { headers: authHeaders() }),
        fetch("/api/branches", { headers: authHeaders() }),
      ]);
      const devData = await devRes.json();
      const brData = await brRes.json();
      setDevices(devData.data ?? devData.devices ?? devData ?? []);
      if (brData.success) setBranches(brData.data ?? []);
    } catch { setFetchError("Network error. Could not reach the server."); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleToggle = async (device: PosDevice) => {
    setTogglingId(device.id);
    try {
      const res = await fetch(`/api/pos-devices/${device.id}/toggle`, { method: "PATCH", headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) { showToast(data.message ?? "Failed to toggle status.", "error"); return; }
      setDevices(prev => prev.map(d => d.id === device.id ? { ...d, status: data.device?.status ?? (d.status === "ACTIVE" ? "INACTIVE" : "ACTIVE") } : d));
      showToast(`${device.pos_number} ${data.device?.status === "ACTIVE" ? "activated" : "deactivated"}.`, data.device?.status === "ACTIVE" ? "success" : "warning");
    } catch { showToast("Network error.", "error"); }
    finally { setTogglingId(null); }
  };

  const filtered = devices.filter(d => {
    const q = search.toLowerCase();
    const matchSearch = d.pos_number.toLowerCase().includes(q) || d.device_name.toLowerCase().includes(q) || (d.branch?.name ?? "").toLowerCase().includes(q) || (d.user?.name ?? "").toLowerCase().includes(q);
    const matchStatus = statusFilter ? d.status === statusFilter : true;
    const matchBranch = branchFilter ? String(d.branch_id) === branchFilter : true;
    return matchSearch && matchStatus && matchBranch;
  });

  const total = devices.length;
  const active = devices.filter(d => d.status === "ACTIVE").length;
  const assigned = devices.filter(d => (d.assigned_users?.length ?? (d.user_id ? 1 : 0)) > 0).length;

  return (
    <div className="p-6 md:p-8 fade-in">


      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Devices", value: loading ? "—" : total, icon: <Monitor size={16} />, bg: "bg-violet-50", border: "border-violet-200", text: "text-violet-600" },
          { label: "Active", value: loading ? "—" : active, icon: <MonitorCheck size={16} />, bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-600" },
          { label: "Assigned", value: loading ? "—" : assigned, icon: <Link size={16} />, bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-600" },
        ].map(c => (
          <div key={c.label} className="bg-white border border-zinc-200 rounded-[0.625rem] px-6 py-5 flex items-center gap-3">
            <div className={`w-10 h-10 ${c.bg} border ${c.border} flex items-center justify-center rounded-[0.4rem]`}>
              <span className={c.text}>{c.icon}</span>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{c.label}</p>
              <p className="text-xl font-bold text-[#1a0f2e] tabular-nums">{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-zinc-200 rounded-[0.625rem] overflow-hidden">
        {/* Filters */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-100">
          <div className="flex-1 flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2">
            <Search size={13} className="text-zinc-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm text-zinc-700 outline-none placeholder:text-zinc-400"
              placeholder="Search by POS number, device ID, branch, or cashier..." />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-600 outline-none">
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <select value={branchFilter} onChange={e => setBranchFilter(e.target.value)}
            className="bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-600 outline-none">
            <option value="">All Branches</option>
            {branches.map(b => (
              <option key={b.id} value={String(b.id)}>{b.name}</option>
            ))}
          </select>
          <Btn onClick={() => setRegisterOpen(true)}>
            <Plus size={13} /> Register Device
          </Btn>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100">
                {["POS Number", "Device ID", "Branch", "Assigned Cashier", "Last Seen", "Status", "Actions"].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-zinc-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && [...Array(4)].map((_, i) => (
                <tr key={i} className="border-b border-zinc-50">
                  {[...Array(7)].map((_, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-3 bg-zinc-100 rounded animate-pulse" style={{ width: `${50 + (j * 11) % 40}%` }} />
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
                      <Btn variant="secondary" onClick={fetchData}>Try again</Btn>
                    </div>
                  </td>
                </tr>
              )}
              {!loading && !fetchError && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-zinc-400 text-xs font-medium">
                    {search || statusFilter || branchFilter ? "No devices match your filters." : "No devices registered yet."}
                  </td>
                </tr>
              )}
              {!loading && !fetchError && filtered.map(d => (
                <tr key={d.id} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                  {/* POS Number */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-violet-50 border border-violet-200 rounded-lg flex items-center justify-center shrink-0">
                        <Monitor size={13} className="text-violet-600" />
                      </div>
                      <span className="font-bold text-[#1a0f2e] text-sm">{d.pos_number}</span>
                    </div>
                  </td>
                  {/* Device ID */}
                  <td className="px-5 py-3.5">
                    <span className="font-mono text-[10px] text-zinc-400 bg-zinc-50 border border-zinc-200 px-2 py-1 rounded-md">
                      {d.device_name.length > 28 ? `${d.device_name.slice(0, 28)}…` : d.device_name}
                    </span>
                  </td>
                  {/* Branch */}
                  <td className="px-5 py-3.5 text-zinc-600 text-xs font-medium">{d.branch?.name ?? "—"}</td>
                  {/* Cashier */}
                  <td className="px-5 py-3.5">
                    {(d.assigned_users ?? (d.user ? [d.user] : [])).length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {(d.assigned_users ?? (d.user ? [d.user] : [])).map(u => (
                          <span key={u.id} className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full whitespace-nowrap">
                            <MonitorCheck size={10} />{u.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold bg-zinc-100 text-zinc-400 border border-zinc-200 px-2 py-0.5 rounded-full">
                        <MonitorOff size={10} />Unassigned
                      </span>
                    )}
                  </td>
                  {/* Last Seen */}
                  <td className="px-5 py-3.5 text-zinc-400 text-xs">{d.last_seen ? new Date(d.last_seen).toLocaleString() : "—"}</td>
                  {/* Status */}
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${d.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-zinc-100 text-zinc-500 border border-zinc-200"}`}>
                      {d.status}
                    </span>
                  </td>
                  {/* Actions */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1">
                      {/* Assign cashier */}
                      <button onClick={() => setAssignTarget(d)}
                        className={`p-1.5 rounded-[0.4rem] transition-colors ${d.user_id ? "hover:bg-violet-50 text-violet-400 hover:text-violet-700" : "hover:bg-amber-50 text-amber-400 hover:text-amber-600"}`}
                        title={d.user_id ? "Change assigned cashier" : "Assign cashier"}>
                        <Link size={13} />
                      </button>
                      {/* Toggle status */}
                      <button onClick={() => handleToggle(d)} disabled={togglingId === d.id}
                        className="p-1.5 hover:bg-zinc-100 rounded-[0.4rem] text-zinc-400 hover:text-zinc-700 transition-colors disabled:opacity-40"
                        title={d.status === "ACTIVE" ? "Deactivate" : "Activate"}>
                        {togglingId === d.id
                          ? <div className="w-3.5 h-3.5 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" />
                          : d.status === "ACTIVE" ? <ToggleRight size={15} className="text-emerald-500" /> : <ToggleLeft size={15} className="text-zinc-400" />}
                      </button>
                      {/* Delete */}
                      <button onClick={() => setDeleteTarget(d)}
                        className="p-1.5 hover:bg-red-50 rounded-[0.4rem] text-zinc-400 hover:text-red-500 transition-colors"
                        title="Delete device">
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
      {registerOpen && (
        <RegisterDeviceModal
          onClose={() => setRegisterOpen(false)}
          onRegistered={device => { setDevices(p => [device, ...p]); showToast("Device registered. You can now assign a cashier."); }}
          branches={branches}
        />
      )}
      {assignTarget && (
        <AssignCashierModal
          onClose={() => setAssignTarget(null)}
          onAssigned={(deviceId, userId, user) => {
            setDevices(p => p.map(d => {
              if (d.id !== deviceId) return d;
              const currentAssigned = d.assigned_users ?? (d.user ? [d.user] : []);
              const newAssigned = userId && user
                ? [...currentAssigned.filter(u => u.id !== userId), user]
                : currentAssigned.filter(u => u.id !== (user?.id ?? -1));
              return {
                ...d,
                assigned_users: newAssigned,
                user_id: newAssigned[0]?.id ?? null,
                user: newAssigned[0] ?? null,
              };
            }));
            // Don't close modal — let user keep assigning multiple
          }}
          device={assignTarget}
        />
      )}
      {deleteTarget && (
        <DeleteDeviceModal
          onClose={() => setDeleteTarget(null)}
          onDeleted={id => { setDevices(p => p.filter(d => d.id !== id)); setDeleteTarget(null); showToast("Device deleted.", "error"); }}
          device={deleteTarget}
        />
      )}
      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
};

export default DeviceManagementTab;
