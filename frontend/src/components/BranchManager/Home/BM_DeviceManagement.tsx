import React, { useState, useEffect } from "react";
import {
  Monitor, Plus, Trash2, AlertCircle,
  X, CheckCircle, ToggleLeft, ToggleRight,
  MonitorCheck, MonitorOff, Search, Laptop,
  Link,
} from "lucide-react";
import { StatCard, Button as Btn, ModalShell, Badge, ConfirmModal } from "../SharedUI";
import { createPortal } from "react-dom";

type ToastType = 'success' | 'error' | 'warning';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Branch {
  id:   number;
  name: string;
}

interface PosDevice {
  id:              number;
  device_name:     string;
  pos_number:      string;
  branch_id:       number;
  status:          "ACTIVE" | "INACTIVE";
  last_seen?:      string | null;
  user_id:         number | null;
  user?:           { id: number; name: string } | null;
  assigned_users?: { id: number; name: string }[];  // ← ADD
  branch?:         { id: number; name: string } | null;
}

interface Cashier {
  id:   number;
  name: string;
  email: string;
}

// ── API helpers ───────────────────────────────────────────────────────────────
const getToken = () =>
  localStorage.getItem("auth_token") || localStorage.getItem("lucky_boba_token") || "";
const authHeaders = (): Record<string, string> => ({
  "Content-Type": "application/json",
  "Accept":       "application/json",
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

// ── Modals are now using specialized SharedUI components or the standardized ModalShell ──

const Field: React.FC<{ label: string; required?: boolean; error?: string; hint?: string; children: React.ReactNode }> = ({ label, required, error, hint, children }) => (
  <div>
    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1.5 block">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    {hint && <p className="text-[9px] text-zinc-400 mb-1.5 -mt-1 font-bold">{hint}</p>}
    {children}
    {error && <p className="text-[10px] text-red-500 mt-1 font-bold">{error}</p>}
  </div>
);

const inputCls = (err?: string) =>
  `w-full text-xs font-bold text-zinc-700 bg-white border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-violet-400/20 focus:border-violet-400 transition-all shadow-sm ${err ? "border-red-300 bg-red-50" : "border-zinc-200"}`;

// ── Register Device Modal ─────────────────────────────────────────────────────
const RegisterDeviceModal: React.FC<{
  onClose: () => void;
  onRegistered: (device: PosDevice) => void;
  defaultBranchId?: number | null;
}> = ({ onClose, onRegistered, defaultBranchId }) => {
  const [form, setForm] = useState({
    device_name: "",
    pos_number:  "",
    branch_id:   defaultBranchId ? String(defaultBranchId) : "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState("");
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.device_name.trim()) e.device_name = "Device ID is required.";
    if (!form.pos_number.trim())  e.pos_number  = "POS number is required.";
    if (!form.branch_id && !defaultBranchId)    e.branch_id   = "Branch is required.";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true); setApiError("");
    try {
      const res  = await fetch("/api/pos-devices", {
        method: "POST", headers: authHeaders(),
body: JSON.stringify({ device_name: form.device_name.trim(), pos_number: form.pos_number.trim(), branch_id: Number(form.branch_id) || defaultBranchId }),
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
    <ModalShell onClose={onClose} icon={<Laptop size={18} className="text-[#3b2063]" />}
      title="Hardware Registration" sub="Provision a new POS terminal into the system"
      footer={success ? null : (
        <div className="flex items-center justify-end gap-2 w-full">
          <Btn variant="secondary" onClick={onClose} disabled={saving}>Cancel</Btn>
          <Btn onClick={handleSubmit} disabled={saving} className="min-w-[140px] justify-center">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Plus size={14} /> Register Terminal</>}
          </Btn>
        </div>
      )}>
      {success ? (
        <div className="flex flex-col items-center py-6 gap-3">
          <div className="w-14 h-14 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center shadow-inner">
            <CheckCircle size={28} className="text-emerald-500" />
          </div>
          <div className="text-center">
            <p className="text-sm font-black text-[#1a0f2e]">Registration Successful</p>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Terminal is now ready for cashier mapping</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {apiError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg shadow-sm">
              <AlertCircle size={14} className="text-red-500 shrink-0" />
              <p className="text-[11px] text-red-600 font-bold">{apiError}</p>
            </div>
          )}
          <div className="flex items-start gap-3 p-3.5 bg-violet-50/50 border border-violet-100 rounded-xl shadow-inner">
            <Laptop size={16} className="text-violet-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-violet-700 mb-1">Retrieving Device ID</p>
              <p className="text-[11px] text-violet-600 leading-relaxed font-bold">
                Launch the application on the target POS. Copy the unique identifier displayed on the <span className="font-black">"Unregistered Device"</span> splash screen.
              </p>
            </div>
          </div>
          <Field label="System Device ID" required error={errors.device_name} hint="Paste the UUID sequence from the terminal screen.">
            <input {...f("device_name")} placeholder="DEV-3700E18D-..." className={inputCls(errors.device_name)} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="POS Designation" required error={errors.pos_number}>
              <input {...f("pos_number")} placeholder="e.g. POS-001" className={inputCls(errors.pos_number)} />
            </Field>
          </div>
          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-tighter leading-tight italic">
            * This terminal will be locked to the current branch.
          </p>
        </div>
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
  const [cashiers,    setCashiers]    = useState<Cashier[]>([]);
  const [selectedId,  setSelectedId]  = useState<string>("");
  const [assigned,    setAssigned]    = useState<Cashier[]>([]);  // multiple assigned cashiers
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [apiError,    setApiError]    = useState("");
  const [success,     setSuccess]     = useState(false);

  const { branch_id, id, assigned_users, user } = device;

useEffect(() => {
  (async () => {
    try {
      const res  = await fetch(
        `/api/users?role=cashier&branch_id=${device.branch_id}&status=ACTIVE`,
        { headers: authHeaders() }
      );
      const data = await res.json();
      const list = (data.data ?? data.users ?? data ?? []) as {
        id: number; name: string; email: string;
        status: string; role: string; branch_id: number | null;
      }[];
      const filtered = list.filter(u =>
        u.status    === "ACTIVE" &&
        u.role      === "cashier" &&
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
}, [branch_id, id, assigned_users, user, device.branch_id, device.assigned_users, device.user]);

  const isAlreadyAssigned = (id: number) => assigned.some(a => a.id === id);

  const handleAssign = async () => {
    if (!selectedId) return;
    setSaving(true); setApiError("");
    try {
      const res  = await fetch(`/api/pos-devices/${device.id}/assign`, {
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
      const res  = await fetch(`/api/pos-devices/${device.id}/unassign`, {
        method: "DELETE", headers: authHeaders(),
        body: JSON.stringify({ user_id: cashierId }),
      });
      const data = await res.json();
      if (!res.ok) { setApiError(data.message ?? "Failed to unassign."); return; }
      setAssigned(p => p.filter(a => a.id !== cashierId));
      onAssigned(device.id, null, null);
    } catch { setApiError("Network error."); }
    finally { setSaving(false); }
  };

  return (
    <ModalShell onClose={onClose} icon={<Link size={18} className="text-[#3b2063]" />}
      title="Hardware Mapping" sub={`Link cashiers to terminal ${device.pos_number}`}
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Btn variant="secondary" onClick={onClose} disabled={saving}>Close</Btn>
          <Btn onClick={handleAssign} disabled={saving || loading || !selectedId} className="min-w-[100px] justify-center">
            {saving
              ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <><Link size={14} /> Map User</>}
          </Btn>
        </div>
      }>

      <div className="space-y-4">
        {/* Device info */}
        <div className="flex items-center gap-3 p-3.5 bg-zinc-50 border border-zinc-100 rounded-xl shadow-inner">
          <div className="w-10 h-10 bg-violet-50 border border-violet-100 rounded-lg flex items-center justify-center shrink-0">
            <Monitor size={18} className="text-violet-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-[#1a0f2e]">{device.pos_number}</p>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{device.branch?.name ?? "—"}</p>
          </div>
          <span className="text-[9px] font-black bg-violet-50 text-violet-700 border border-violet-100 px-2 py-0.5 rounded-full uppercase tracking-widest">
            {assigned.length} Linked
          </span>
        </div>

        {apiError && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg shadow-sm">
            <AlertCircle size={14} className="text-red-500 shrink-0" />
            <p className="text-[11px] text-red-600 font-bold">{apiError}</p>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-lg shadow-sm">
            <CheckCircle size={14} className="text-emerald-500 shrink-0" />
            <p className="text-[11px] text-emerald-700 font-bold italic">User mapped successfully.</p>
          </div>
        )}

        {/* Currently assigned list */}
        {assigned.length > 0 && (
          <div className="space-y-2">
            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Linked Cashiers</p>
            <div className="flex flex-col gap-1.5">
              {assigned.map(c => (
                <div key={c.id} className="flex items-center gap-3 px-3 py-2 bg-emerald-50/50 border border-emerald-100 rounded-xl group transition-all">
                  <MonitorCheck size={14} className="text-emerald-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-emerald-800 truncate uppercase tracking-tight">{c.name}</p>
                    <p className="text-[10px] text-emerald-600/70 truncate font-bold">{c.email}</p>
                  </div>
                  <button
                    onClick={() => handleUnassign(c.id)}
                    disabled={saving}
                    className="p-1.5 bg-white border border-emerald-100 hover:bg-red-50 hover:border-red-100 rounded-lg text-emerald-400 hover:text-red-500 transition-all shadow-sm disabled:opacity-40"
                    title="Unlink User">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add new cashier */}
        <Field label="Map New Cashier" required>
          {loading ? (
            <div className="h-10 bg-zinc-100 rounded-lg animate-pulse" />
          ) : cashiers.length === 0 ? (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-100 rounded-lg shadow-sm">
              <AlertCircle size={13} className="text-amber-500 shrink-0" />
              <p className="text-[11px] text-amber-700 font-bold leading-tight">No active cashiers found for this branch setup.</p>
            </div>
          ) : (
            <select value={selectedId} onChange={e => setSelectedId(e.target.value)} className={inputCls()}>
              <option value="">— Select Staff Member —</option>
              {cashiers.map(c => (
                <option key={c.id} value={String(c.id)}>
                  {c.name} {isAlreadyAssigned(c.id) ? " (Linked)" : ""}
                </option>
              ))}
            </select>
          )}
        </Field>
      </div>
    </ModalShell>
  );
};

// ── Delete Device Modal ───────────────────────────────────────────────────────
const DeleteDeviceModal: React.FC<{
  onClose:   () => void;
  onDeleted: (id: number) => void;
  device:    PosDevice;
}> = ({ onClose, onDeleted, device }) => (
  <ConfirmModal
    onClose={onClose}
    onConfirm={async () => {
      await fetch(`/api/pos-devices/${device.id}`, { method: "DELETE", headers: authHeaders() });
      onDeleted(device.id);
    }}
    title="Deprovision Terminal?"
    desc={`Permanently remove ${device.pos_number} from the system network? This action is irreversible.`}
    type="danger"
  />
);

// ── Main Tab ──────────────────────────────────────────────────────────────────
const BM_DeviceManagementTab: React.FC<{ branchId?: number | null }> = ({ branchId: branchIdProp }) => {
  // Read from localStorage as fallback — BM always has a branch_id
  const authUser = (() => { try { return JSON.parse(localStorage.getItem("auth_user") ?? "{}"); } catch { return {}; } })();
  const branchId = branchIdProp ?? authUser?.branch_id ?? null;
  const [devices,     setDevices]     = useState<PosDevice[]>([]);
  const [,    setBranches]    = useState<Branch[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [fetchError,  setFetchError]  = useState("");
  const [search,      setSearch]      = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [registerOpen,  setRegisterOpen]  = useState(false);
  const [assignTarget,  setAssignTarget]  = useState<PosDevice | null>(null);
  const [deleteTarget,  setDeleteTarget]  = useState<PosDevice | null>(null);
  const [togglingId,    setTogglingId]    = useState<number | null>(null);

  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const showToast = (message: string, type: ToastType = "success") => setToast({ message, type });

const fetchData = async () => {
  setLoading(true); setFetchError("");
  try {
    const [devRes, brRes] = await Promise.all([
      fetch("/api/pos-devices", { headers: authHeaders() }),
      fetch("/api/branches",    { headers: authHeaders() }),
    ]);

    if (!devRes.ok) {
      const err = await devRes.json().catch(() => ({}));
      setFetchError(err.message ?? `Error ${devRes.status}: Could not load devices.`);
      setDevices([]); // ← keep it an array
      return;         // ← bail before trying to parse the error body as data
    }

    const devData = await devRes.json();
    const brData  = await brRes.json();

    const raw = devData.data ?? devData.devices ?? devData;
    setDevices(Array.isArray(raw) ? raw : []);

    if (brData.success) setBranches(brData.data ?? []);
  } catch {
    setFetchError("Network error. Could not reach the server.");
    setDevices([]); // ← also guard the catch path
  } finally {
    setLoading(false);
  }
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
    return matchSearch && matchStatus;
  });

  const total    = devices.length;
  const active   = devices.filter(d => d.status === "ACTIVE").length;
  const assigned = devices.filter(d => (d.assigned_users?.length ?? (d.user_id ? 1 : 0)) > 0).length;

  return (
    <div className="p-6 md:p-8 space-y-6 fade-in pb-20">
      <style>{`
        .fade-in { animation: fadeIn 0.3s ease-out forwards; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1a0f2e]">Device Management</h1>
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mt-1">Provision & monitor POS hardware terminals</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group min-w-[280px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-[#3b2063] transition-colors" size={14} />
            <input
              type="text"
              placeholder="Search by POS #, Device ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-violet-400/10 focus:border-violet-400 transition-all shadow-sm"
            />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-[#3b2063] outline-none shadow-sm cursor-pointer hover:bg-zinc-50 transition-all shrink-0">
            <option value="">All Status</option>
            <option value="ACTIVE">Online</option>
            <option value="INACTIVE">Offline</option>
          </select>
          <Btn onClick={() => setRegisterOpen(true)} className="px-5 py-2.5 rounded-xl shadow-lg shadow-purple-100 shrink-0">
            <Plus size={14} /> <span className="ml-1">Register</span>
          </Btn>
        </div>
      </div>

      {/* ── Stat Rows ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard
          icon={<Monitor size={18} />}
          label="Total Terminals"
          value={loading ? "—" : total}
          sub="Provisioned Units"
          color="violet"
        />
        <StatCard
          icon={<MonitorCheck size={18} />}
          label="Online"
          value={loading ? "—" : active}
          sub="Operational"
          color="emerald"
        />
        <StatCard
          icon={<Link size={18} />}
          label="Mapped"
          value={loading ? "—" : assigned}
          sub="Staff Integrated"
          color="amber"
        />
      </div>

      {/* ── Table ── */}
      <div className="bg-white border border-zinc-200 rounded-[1rem] overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-zinc-50 flex items-center justify-between bg-zinc-50/30">
          <h3 className="text-[11px] font-black text-[#1a0f2e] uppercase tracking-wide">Terminal Inventory</h3>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded border border-emerald-100 text-[9px] font-black uppercase tracking-widest leading-none">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Hardware
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-zinc-50/20 text-left border-b border-zinc-50">
                <th className="px-6 py-3 text-[9px] font-black text-zinc-400 uppercase tracking-widest">POS Unit</th>
                <th className="px-6 py-3 text-[9px] font-black text-zinc-400 uppercase tracking-widest">System Identifier</th>
                <th className="px-6 py-3 text-[9px] font-black text-zinc-400 uppercase tracking-widest text-center">Mapped Staff</th>
                <th className="px-6 py-3 text-[9px] font-black text-zinc-400 uppercase tracking-widest text-center">Last Sync</th>
                <th className="px-6 py-3 text-[9px] font-black text-zinc-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-3 text-[9px] font-black text-zinc-400 uppercase tracking-widest text-right">Integrity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i} className="animate-pulse border-b border-zinc-50">
                    <td colSpan={6} className="px-6 py-4"><div className="h-4 bg-zinc-50 rounded" /></td>
                  </tr>
                ))
              ) : fetchError ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <AlertCircle size={32} className="text-red-400" />
                      <p className="text-[11px] font-black uppercase tracking-widest text-red-500">{fetchError}</p>
                      <Btn variant="secondary" onClick={fetchData}>Try Re-syncing</Btn>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-zinc-400 text-xs font-black uppercase tracking-widest opacity-40">
                    {search || statusFilter ? "No matching hardware records" : "No provisioned terminals"}
                  </td>
                </tr>
              ) : (
                filtered.map(d => (
                  <tr key={d.id} className="hover:bg-zinc-50/50 transition-colors group">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-violet-50 border border-violet-100 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-[#3b2063] group-hover:border-[#3b2063] transition-colors">
                          <Monitor size={14} className="text-violet-600 group-hover:text-white transition-colors" />
                        </div>
                        <span className="font-bold text-[#1a0f2e] text-xs">{d.pos_number}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="font-mono text-[9px] font-black text-zinc-400 bg-zinc-50 border border-zinc-100 px-2 py-0.5 rounded uppercase tracking-tighter">
                        {d.device_name.length > 20 ? `${d.device_name.slice(0, 20)}...` : d.device_name}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      {(d.assigned_users ?? (d.user ? [d.user] : [])).length > 0 ? (
                        <div className="flex flex-wrap justify-center gap-1">
                          {(d.assigned_users ?? (d.user ? [d.user] : [])).map(u => (
                            <span key={u.id} className="inline-flex items-center gap-1 text-[9px] font-black bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-widest shadow-sm">
                              <MonitorCheck size={9} />{u.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[9px] font-black bg-zinc-50 text-zinc-400 border border-zinc-100 px-2 py-0.5 rounded-full uppercase tracking-widest">
                          <MonitorOff size={9} />Unmapped
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-center text-zinc-400 text-[10px] font-bold tabular-nums">
                      {d.last_seen ? new Date(d.last_seen).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "—"}
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <Badge variant={d.status === "ACTIVE" ? "success" : "neutral"} className="text-[9px] font-black">
                        {d.status === "ACTIVE" ? "Online" : "Offline"}
                      </Badge>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setAssignTarget(d)} className="p-1.5 hover:bg-violet-50 text-zinc-400 hover:text-violet-600 rounded-lg" title="Mapping">
                          <Link size={14} />
                        </button>
                        <button onClick={() => handleToggle(d)} disabled={togglingId === d.id} className="p-1.5 hover:bg-zinc-50 text-zinc-400 hover:text-zinc-700 rounded-lg transition-all" title={d.status === "ACTIVE" ? "Killswitch" : "Activate"}>
                          {togglingId === d.id
                            ? <div className="w-3.5 h-3.5 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" />
                            : d.status === "ACTIVE" ? <ToggleRight size={16} className="text-emerald-500" /> : <ToggleLeft size={16} className="text-zinc-300" />}
                        </button>
                        <button onClick={() => setDeleteTarget(d)} className="p-1.5 hover:bg-red-50 text-zinc-400 hover:text-red-500 rounded-lg" title="Deprovision">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {registerOpen && (
        <RegisterDeviceModal
          onClose={() => setRegisterOpen(false)}
          onRegistered={device => { setDevices(p => [device, ...p]); showToast("Terminal Provisioned Successfully."); }}
          defaultBranchId={branchId}
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
                : currentAssigned.filter(u => u.id !== userId);
              return {
                ...d,
                assigned_users: newAssigned,
                user_id: newAssigned[0]?.id ?? null,
                user:    newAssigned[0] ?? null,
              };
            }));
          }}
          device={assignTarget}
        />
      )}
      {deleteTarget && (
        <DeleteDeviceModal
          onClose={() => setDeleteTarget(null)}
          onDeleted={id => { setDevices(p => p.filter(d => d.id !== id)); setDeleteTarget(null); showToast("Terminal Deprovisioned.", "warning"); }}
          device={deleteTarget}
        />
      )}
      {toast && (
        <div className="fixed bottom-6 right-6 z-9999 animate-in slide-in-from-bottom-2 fade-in duration-300">
          <div className={`flex items-center gap-3 px-4 py-3 bg-white rounded-xl shadow-2xl border ${toast.type === 'error' ? 'border-red-100' : 'border-emerald-100'}`}>
            {toast.type === 'error' ? <AlertCircle size={14} className="text-red-500" /> : <CheckCircle size={14} className="text-emerald-500" />}
            <p className="text-xs font-black text-[#1a0f2e] uppercase tracking-widest">{toast.message}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BM_DeviceManagementTab;