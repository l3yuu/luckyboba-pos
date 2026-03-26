// frontend/src/pages/PosDeviceManager.tsx
// Superadmin page — register and manage POS devices.

import { useState, useEffect, useCallback } from 'react';
import {
  Monitor, Plus, RefreshCw, Search, Trash2, Power, PowerOff,
  AlertCircle, CheckCircle, X, MapPin, Clock, Hash,
  MonitorCheck, MonitorOff, Laptop,
} from 'lucide-react';
import { createPortal } from 'react-dom';
import api from '../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

type VariantKey = 'primary' | 'secondary' | 'danger' | 'ghost';
type SizeKey    = 'sm' | 'md' | 'lg';

interface Branch {
  id:   number;
  name: string;
}

interface PosDevice {
  id:          number;
  device_name: string;
  pos_number:  string;
  branch_id:   number;
  status:      'ACTIVE' | 'INACTIVE';
  last_seen:   string | null;
  branch:      Branch;
  user_id:     number | null;
  user?:       { id: number; name: string } | null;
}

type ToastType = 'success' | 'error' | 'warning';

// ─── Shared UI ────────────────────────────────────────────────────────────────

interface BtnProps {
  children: React.ReactNode; variant?: VariantKey; size?: SizeKey;
  onClick?: () => void; className?: string; disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

const Btn: React.FC<BtnProps> = ({
  children, variant = 'primary', size = 'sm',
  onClick, className = '', disabled = false, type = 'button',
}) => {
  const sizes:    Record<SizeKey,    string> = { sm: 'px-3 py-2 text-xs', md: 'px-4 py-2.5 text-sm', lg: 'px-6 py-3 text-sm' };
  const variants: Record<VariantKey, string> = {
    primary:   'bg-[#3b2063] hover:bg-[#2a1647] text-white',
    secondary: 'bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50',
    danger:    'bg-red-600 hover:bg-red-700 text-white',
    ghost:     'bg-transparent text-zinc-500 hover:bg-zinc-100',
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`inline-flex items-center gap-1.5 font-bold rounded-lg transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 ${sizes[size]} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

const Field: React.FC<{ label: string; required?: boolean; error?: string; hint?: string; children: React.ReactNode }> = ({ label, required, error, hint, children }) => (
  <div>
    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5 block">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    {children}
    {hint  && !error && <p className="text-[10px] text-zinc-400 mt-1">{hint}</p>}
    {error && <p className="text-[10px] text-red-500 mt-1 font-medium">{error}</p>}
  </div>
);

const inputCls = (err?: string) =>
  `w-full text-sm font-medium text-zinc-700 bg-zinc-50 border rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white transition-all ${err ? 'border-red-300 bg-red-50' : 'border-zinc-200'}`;

// ─── Toast ────────────────────────────────────────────────────────────────────

const Toast: React.FC<{ message: string; type: ToastType; onDone: () => void }> = ({ message, type, onDone }) => {
  useEffect(() => { const t = setTimeout(onDone, 3500); return () => clearTimeout(t); }, [onDone]);
  const bar = type === 'success' ? 'bg-emerald-500' : type === 'error' ? 'bg-red-500' : 'bg-amber-500';
  const icon = type === 'success'
    ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
    : type === 'error'
    ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
    : <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>;

  return createPortal(
    <div className="fixed bottom-6 right-6 z-99999" style={{ animation: 'slideUpFade .25s ease forwards' }}>
      <style>{`@keyframes slideUpFade{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div className="relative flex items-center gap-3 bg-[#1a0f2e] text-white pl-4 pr-3 py-3 rounded-xl shadow-2xl border border-white/10 min-w-55 max-w-xs overflow-hidden">
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${bar} rounded-l-xl`} />
        <div className={`w-5 h-5 ${bar} rounded-full flex items-center justify-center shrink-0 text-white`}>{icon}</div>
        <p className="text-xs font-semibold flex-1 leading-snug">{message}</p>
        <button onClick={onDone} className="ml-1 text-white/40 hover:text-white transition-colors"><X size={13} /></button>
      </div>
    </div>,
    document.body
  );
};

// ─── Modal Shell ──────────────────────────────────────────────────────────────

const ModalShell: React.FC<{
  onClose: () => void; icon: React.ReactNode; title: string; sub: string;
  children: React.ReactNode; footer: React.ReactNode; maxWidth?: string;
}> = ({ onClose, icon, title, sub, children, footer, maxWidth = 'max-w-md' }) =>
  createPortal(
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-6"
      style={{ backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', backgroundColor: 'rgba(0,0,0,0.45)' }}>
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

// ─── Register Device Modal ────────────────────────────────────────────────────

const RegisterDeviceModal: React.FC<{
  onClose:     () => void;
  onRegistered: (device: PosDevice) => void;
  branches:    Branch[];
}> = ({ onClose, onRegistered, branches }) => {
  const [form, setForm] = useState({ device_name: '', pos_number: '', branch_id: '' });
  const [errors,   setErrors]   = useState<Record<string, string>>({});
  const [saving,   setSaving]   = useState(false);
  const [apiError, setApiError] = useState('');
  const [success,  setSuccess]  = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.device_name.trim()) e.device_name = 'Device ID is required.';
    if (!form.pos_number.trim())  e.pos_number  = 'POS number is required.';
    if (!form.branch_id)          e.branch_id   = 'Branch is required.';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true); setApiError('');
    try {
      const res = await api.post('/pos-devices', {
        device_name: form.device_name.trim(),
        pos_number:  form.pos_number.trim(),
        branch_id:   Number(form.branch_id),
      });
      onRegistered(res.data.device);
      setSuccess(true);
      setTimeout(onClose, 1500);
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data;
      if (data?.errors) {
        const mapped: Record<string, string> = {};
        Object.entries(data.errors).forEach(([k, v]) => { mapped[k] = Array.isArray(v) ? v[0] : String(v); });
        setErrors(mapped);
      } else { setApiError(data?.message ?? 'Failed to register device.'); }
    } finally { setSaving(false); }
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
        </div>
      ) : (
        <>
          {apiError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle size={14} className="text-red-500 shrink-0" />
              <p className="text-xs text-red-600 font-medium">{apiError}</p>
            </div>
          )}

          {/* How-to hint */}
          <div className="flex items-start gap-3 p-3 bg-violet-50 border border-violet-200 rounded-lg">
            <Laptop size={14} className="text-violet-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-violet-700 mb-0.5">How to get the Device ID</p>
              <p className="text-xs text-violet-600 leading-relaxed">
                On the POS terminal, open the app and it will show a <span className="font-bold">"Device Not Registered"</span> screen with the Device ID. The cashier can copy it and send it to you.
              </p>
            </div>
          </div>

          <Field label="Device ID" required error={errors.device_name}
            hint="Paste the ID shown on the terminal's 'Device Not Registered' screen.">
            <input {...f('device_name')} placeholder="e.g. 3700E18D-2001-4E36-9270-ABCD1234..." className={inputCls(errors.device_name)} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="POS Number" required error={errors.pos_number} hint="Friendly label shown in reports.">
              <input {...f('pos_number')} placeholder="e.g. POS-001" className={inputCls(errors.pos_number)} />
            </Field>
            <Field label="Branch" required error={errors.branch_id}>
              {branches.length === 0 ? (
                <div className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertCircle size={12} className="text-amber-500 shrink-0" />
                  <p className="text-xs text-amber-700">No branches found.</p>
                </div>
              ) : (
                <select {...f('branch_id')} className={inputCls(errors.branch_id)}>
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

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

const DeleteDeviceModal: React.FC<{
  onClose:   () => void;
  onDeleted: (id: number) => void;
  device:    PosDevice;
}> = ({ onClose, onDeleted, device }) => {
  const [saving,   setSaving]   = useState(false);
  const [apiError, setApiError] = useState('');

  const handleDelete = async () => {
    setSaving(true); setApiError('');
    try {
      await api.delete(`/pos-devices/${device.id}`);
      onDeleted(device.id);
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setApiError(msg ?? 'Failed to delete device.');
    } finally { setSaving(false); }
  };

  return createPortal(
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-6"
      style={{ backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', backgroundColor: 'rgba(0,0,0,0.45)' }}>
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white w-full max-w-sm border border-zinc-200 rounded-[1.25rem] shadow-2xl">
        <div className="flex flex-col items-center text-center px-6 pt-8 pb-5">
          <div className="w-14 h-14 bg-red-50 border border-red-200 rounded-full flex items-center justify-center mb-4">
            <Trash2 size={22} className="text-red-500" />
          </div>
          <p className="text-base font-bold text-[#1a0f2e]">Delete Device?</p>
          <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
            <span className="font-bold text-zinc-700">{device.pos_number}</span> will be permanently removed.
            Any cashier assigned to it will lose their device link.
          </p>
          {apiError && (
            <div className="flex items-center gap-2 mt-4 p-3 w-full bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle size={14} className="text-red-500 shrink-0" />
              <p className="text-xs text-red-600 font-medium text-left">{apiError}</p>
            </div>
          )}
        </div>
        <div className="mx-6 mb-5 p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-1.5">
          <div className="flex items-center gap-2 text-xs">
            <Hash size={11} className="text-zinc-400" />
            <span className="font-bold text-[#1a0f2e]">{device.pos_number}</span>
            <span className="text-zinc-400">·</span>
            <span className="font-mono text-[10px] text-zinc-400 truncate max-w-40">{device.device_name}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <MapPin size={11} className="text-zinc-400" />
            {device.branch?.name ?? '—'}
          </div>
          {device.user && (
            <div className="flex items-center gap-2 text-xs text-amber-600 font-medium">
              <AlertCircle size={11} />
              Assigned to {device.user.name} — will be unlinked
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 px-6 pb-6">
          <Btn variant="secondary" className="flex-1 justify-center" onClick={onClose} disabled={saving}>Cancel</Btn>
          <Btn variant="danger" className="flex-1 justify-center" onClick={handleDelete} disabled={saving}>
            {saving
              ? <span className="flex items-center gap-1.5"><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Deleting...</span>
              : <><Trash2 size={13} /> Delete</>}
          </Btn>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatLastSeen(lastSeen: string | null): string {
  if (!lastSeen) return 'Never';
  return new Date(lastSeen).toLocaleString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PosDeviceManager() {
  const [devices,       setDevices]       = useState<PosDevice[]>([]);
  const [branches,      setBranches]      = useState<Branch[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [fetchError,    setFetchError]    = useState('');
  const [search,        setSearch]        = useState('');
  const [statusFilter,  setStatusFilter]  = useState('');
  const [togglingId,    setTogglingId]    = useState<number | null>(null);

  const [registerOpen,  setRegisterOpen]  = useState(false);
  const [deleteTarget,  setDeleteTarget]  = useState<PosDevice | null>(null);
  const [toast,         setToast]         = useState<{ message: string; type: ToastType } | null>(null);

  const showToast = (message: string, type: ToastType = 'success') => setToast({ message, type });

  const fetchAll = useCallback(async () => {
    setLoading(true); setFetchError('');
    try {
      const [devRes, brRes] = await Promise.all([
        api.get('/pos-devices'),
        api.get('/branches'),
      ]);
      setDevices(devRes.data?.devices ?? devRes.data ?? []);
      setBranches(brRes.data?.data ?? brRes.data ?? []);
    } catch {
      setFetchError('Failed to load devices.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleToggle = async (device: PosDevice) => {
    setTogglingId(device.id);
    try {
      const res = await api.patch(`/pos-devices/${device.id}/toggle`);
      setDevices(prev => prev.map(d => d.id === device.id ? { ...d, status: res.data.device?.status ?? (d.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE') } : d));
      showToast(`${device.pos_number} ${res.data.device?.status === 'ACTIVE' ? 'activated' : 'deactivated'}.`, res.data.device?.status === 'ACTIVE' ? 'success' : 'warning');
    } catch {
      showToast('Failed to toggle device status.', 'error');
    } finally { setTogglingId(null); }
  };

  const filtered = devices.filter(d => {
    const matchSearch = d.pos_number.toLowerCase().includes(search.toLowerCase()) ||
                        d.device_name.toLowerCase().includes(search.toLowerCase()) ||
                        d.branch?.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? d.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  const activeCount   = devices.filter(d => d.status === 'ACTIVE').length;
  const assignedCount = devices.filter(d => d.user_id !== null).length;

  return (
    <div className="p-6 md:p-8" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-bold text-[#1a0f2e]">POS Device Manager</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            {loading ? 'Loading...' : `${devices.length} devices · ${activeCount} active · ${assignedCount} assigned`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Btn variant="secondary" onClick={fetchAll} disabled={loading}>
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </Btn>
          <Btn onClick={() => setRegisterOpen(true)} disabled={loading}>
            <Plus size={13} /> Register Device
          </Btn>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Devices',    value: loading ? '—' : devices.length,   icon: <Monitor size={16} />,     bg: 'bg-violet-50',  border: 'border-violet-200',  text: 'text-violet-600'  },
          { label: 'Active',           value: loading ? '—' : activeCount,       icon: <MonitorCheck size={16} />, bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-600' },
          { label: 'Assigned to Cashier', value: loading ? '—' : assignedCount, icon: <Laptop size={16} />,      bg: 'bg-blue-50',    border: 'border-blue-200',    text: 'text-blue-600'    },
        ].map(({ label, value, icon, bg, border, text }) => (
          <div key={label} className="bg-white border border-zinc-200 rounded-[0.625rem] px-6 py-5 flex items-center gap-3">
            <div className={`w-10 h-10 ${bg} border ${border} flex items-center justify-center rounded-[0.4rem]`}>
              <span className={text}>{icon}</span>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{label}</p>
              <p className="text-xl font-bold text-[#1a0f2e] tabular-nums">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Table ── */}
      <div className="bg-white border border-zinc-200 rounded-[0.625rem] overflow-hidden">

        {/* Search / filter bar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-100">
          <div className="flex-1 flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2">
            <Search size={13} className="text-zinc-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm text-zinc-700 outline-none placeholder:text-zinc-400"
              placeholder="Search by POS #, Device ID, or branch..." />
            {search && (
              <button onClick={() => setSearch('')} className="text-zinc-400 hover:text-zinc-600">
                <X size={12} />
              </button>
            )}
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-600 outline-none">
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100">
                {['POS #', 'Branch', 'Device ID', 'Assigned Cashier', 'Last Seen', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-zinc-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>

              {/* Loading skeleton */}
              {loading && [...Array(4)].map((_, i) => (
                <tr key={i} className="border-b border-zinc-50">
                  {[...Array(7)].map((_, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-3 bg-zinc-100 rounded animate-pulse" style={{ width: `${55 + (j * 11) % 40}%` }} />
                    </td>
                  ))}
                </tr>
              ))}

              {/* Error */}
              {!loading && fetchError && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle size={20} className="text-red-400" />
                      <p className="text-sm font-semibold text-red-500">{fetchError}</p>
                      <Btn variant="secondary" size="sm" onClick={fetchAll}>Try again</Btn>
                    </div>
                  </td>
                </tr>
              )}

              {/* Empty */}
              {!loading && !fetchError && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center">
                        <Monitor size={20} className="text-zinc-400" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-zinc-500">
                          {search || statusFilter ? 'No devices match your filters.' : 'No devices registered yet.'}
                        </p>
                        {!search && !statusFilter && (
                          <p className="text-xs text-zinc-400 mt-1">Click "Register Device" to add the first terminal.</p>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              )}

              {/* Rows */}
              {!loading && !fetchError && filtered.map(device => (
                <tr key={device.id} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">

                  {/* POS # */}
                  <td className="px-5 py-3.5">
                    <span className="font-bold text-[#3b2063] text-sm">{device.pos_number}</span>
                  </td>

                  {/* Branch */}
                  <td className="px-5 py-3.5">
                    <span className="flex items-center gap-1.5 text-zinc-600 text-xs font-medium">
                      <MapPin size={11} className="text-zinc-400" />
                      {device.branch?.name ?? '—'}
                    </span>
                  </td>

                  {/* Device ID */}
                  <td className="px-5 py-3.5">
                    <span className="font-mono text-[10px] text-zinc-400 bg-zinc-100 px-2 py-1 rounded max-w-40 truncate block" title={device.device_name}>
                      {device.device_name}
                    </span>
                  </td>

                  {/* Assigned Cashier */}
                  <td className="px-5 py-3.5">
                    {device.user
                      ? <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <MonitorCheck size={9} />{device.user.name}
                        </span>
                      : <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-zinc-100 text-zinc-400 border border-zinc-200 px-2 py-0.5 rounded-full">
                          <MonitorOff size={9} />Unassigned
                        </span>}
                  </td>

                  {/* Last Seen */}
                  <td className="px-5 py-3.5">
                    <span className="flex items-center gap-1.5 text-zinc-400 text-xs">
                      <Clock size={11} />
                      {formatLastSeen(device.last_seen)}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider
                      ${device.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-zinc-100 text-zinc-500 border border-zinc-200'}`}>
                      {device.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1">
                      {/* Toggle active/inactive */}
                      <button
                        onClick={() => handleToggle(device)}
                        disabled={togglingId === device.id}
                        className={`p-1.5 rounded-[0.4rem] transition-colors disabled:opacity-40 ${
                          device.status === 'ACTIVE'
                            ? 'hover:bg-amber-50 text-zinc-400 hover:text-amber-500'
                            : 'hover:bg-emerald-50 text-zinc-400 hover:text-emerald-600'
                        }`}
                        title={device.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}>
                        {togglingId === device.id
                          ? <div className="w-3 h-3 border-2 border-zinc-300 border-t-violet-500 rounded-full animate-spin" />
                          : device.status === 'ACTIVE' ? <PowerOff size={13} /> : <Power size={13} />}
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => setDeleteTarget(device)}
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

      {/* ── Modals ── */}
      {registerOpen && (
        <RegisterDeviceModal
          onClose={() => setRegisterOpen(false)}
          onRegistered={device => {
            setDevices(prev => [device, ...prev]);
            showToast(`${device.pos_number} registered successfully.`);
          }}
          branches={branches}
        />
      )}
      {deleteTarget && (
        <DeleteDeviceModal
          onClose={() => setDeleteTarget(null)}
          onDeleted={id => {
            setDevices(prev => prev.filter(d => d.id !== id));
            showToast(`Device deleted.`, 'error');
            setDeleteTarget(null);
          }}
          device={deleteTarget}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}