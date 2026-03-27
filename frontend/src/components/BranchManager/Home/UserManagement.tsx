"use client"

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Plus, Eye, Edit2, Trash2, Lock, UserCheck, XCircle,
  Users, X, AlertCircle, RefreshCw, Mail, MapPin, ShieldCheck,
  Trash, CheckCircle, Laptop, MonitorCheck, MonitorOff, Monitor,
} from 'lucide-react';
import { createPortal } from 'react-dom';
import api from '../../../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

type VariantKey = 'primary' | 'secondary' | 'danger' | 'ghost';
type SizeKey    = 'sm' | 'md' | 'lg';

interface User {
  id:             number;
  name:           string;
  email:          string;
  role:           string;
  branch:         string;
  branch_id:      number | null;
  status:         string;
  lastLogin?:     string;
  login_count:    number;
  created_at:     string;
  has_pin:        boolean;
  device_id?:     number | null;
  device_number?: string | null;
}

interface FormState {
  name:            string;
  email:           string;
  password:        string;
  passwordConfirm: string;
  status:          string;
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

interface Branch {
  id:   number;
  name: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapUser = (u: any): User => ({
  id:             u.id,
  name:           u.name,
  email:          u.email,
  role:           u.role,
  branch:         u.branch ?? u.branch_name ?? '—',
  branch_id:      u.branch_id ?? null,
  status:         u.status,
  lastLogin:      u.last_login_at
    ? new Date(u.last_login_at).toLocaleString('en-PH', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : undefined,
  login_count:    u.login_count ?? 0,
  created_at:     u.created_at,
  has_pin:        u.has_pin ?? false,
  device_id:      u.device_id ?? null,
  device_number:  u.device_number ?? u.pos_number ?? null,
});

const blankForm = (): FormState => ({
  name: '', email: '', password: '', passwordConfirm: '', status: 'ACTIVE',
});

// ─── Shared UI ────────────────────────────────────────────────────────────────

const Avatar: React.FC<{ name: string; size?: string }> = ({ name, size = 'w-7 h-7 text-[10px]' }) => (
  <div className={`${size} rounded-full bg-[#ede8ff] flex items-center justify-center font-bold text-[#3b2063] shrink-0`}>
    {name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
  </div>
);

const Badge: React.FC<{ status: string }> = ({ status }) => {
  const isActive = status === 'ACTIVE' || status === 'active';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider
      ${isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-zinc-100 text-zinc-500 border border-zinc-200'}`}>
      {status}
    </span>
  );
};

// Inline device pill shown in the table row
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

// ─── Field helpers ────────────────────────────────────────────────────────────

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
  `w-full text-sm font-medium text-zinc-700 bg-zinc-50 border rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white transition-all ${err ? 'border-red-300 bg-red-50' : 'border-zinc-200'}`;

// ─── View Modal ───────────────────────────────────────────────────────────────

const ViewUserModal: React.FC<{ onClose: () => void; user: User }> = ({ onClose, user }) => {
  const rows: [string, React.ReactNode][] = [
    ['User ID',    `#${user.id}`],
    ['Name',       <div className="flex items-center gap-2"><Avatar name={user.name} />{user.name}</div>],
    ['Email',      <span className="flex items-center gap-1"><Mail size={11} />{user.email}</span>],
    ['Branch',     <span className="flex items-center gap-1"><MapPin size={11} />{user.branch}</span>],
    ['Status',     <Badge status={user.status} />],
    ['Last Login', user.lastLogin ?? '—'],
    ['Device',     user.device_number
      ? <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1"><MonitorCheck size={9} />{user.device_number}</span>
      : <span className="text-[10px] font-bold bg-zinc-100 text-zinc-400 border border-zinc-200 px-2 py-0.5 rounded-full flex items-center gap-1"><MonitorOff size={9} />No device</span>],
  ];
  return (
    <ModalShell onClose={onClose} icon={<Eye size={15} className="text-violet-600" />}
      title={user.name} sub="Cashier details"
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

// ─── Cashier Form Modal (Add / Edit) ─────────────────────────────────────────

const CashierFormModal: React.FC<{
  onClose:      () => void;
  onSaved:      (u: User) => void;
  editingUser?: User | null;
  branchId:     number | null;
}> = ({ onClose, onSaved, editingUser, branchId }) => {
  const [form,     setForm]     = useState<FormState>(
    editingUser
      ? { name: editingUser.name, email: editingUser.email, password: '', passwordConfirm: '', status: editingUser.status }
      : blankForm()
  );
  const [errors,   setErrors]   = useState<Record<string, string>>({});
  const [saving,   setSaving]   = useState(false);
  const [apiError, setApiError] = useState('');

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim())  e.name  = 'Name is required.';
    if (!form.email.trim()) e.email = 'Email is required.';
    if (!editingUser && !form.password) e.password = 'Password is required.';
    if (form.password && form.password.length < 6) e.password = 'Password must be at least 6 characters.';
    if (form.password && form.password !== form.passwordConfirm) e.passwordConfirm = 'Passwords do not match.';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true); setApiError('');
    try {
      if (editingUser) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const payload: Record<string, any> = {
          name: form.name, email: form.email,
          role: 'cashier', status: form.status,
          branch_id: branchId,
        };
        if (form.password) {
          payload.password              = form.password;
          payload.password_confirmation = form.passwordConfirm;
        }
        const res = await api.put(`/users/${editingUser.id}`, payload);
        onSaved(mapUser(res.data?.data ?? res.data));
      } else {
        const res = await api.post('/users', {
          name:                  form.name,
          email:                 form.email,
          password:              form.password,
          password_confirmation: form.passwordConfirm,
          role:                  'cashier',
          status:                form.status,
          branch_id:             branchId,
        });
        onSaved(mapUser(res.data?.data ?? res.data));
      }
      onClose();
    } catch (err: unknown) {
      type LaravelError = { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const errData = (err as LaravelError)?.response?.data;
      if (errData?.errors) {
        const mapped: Record<string, string> = {};
        Object.entries(errData.errors).forEach(([k, v]) => { mapped[k] = Array.isArray(v) ? v[0] : String(v); });
        setErrors(mapped);
      } else { setApiError(errData?.message ?? 'Something went wrong.'); }
    } finally { setSaving(false); }
  };

  const f = (key: keyof FormState) => ({
    value: form[key],
    onChange: (ev: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm(p => ({ ...p, [key]: ev.target.value }));
      setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
    },
  });

  return (
    <ModalShell
      onClose={onClose}
      icon={editingUser ? <Edit2 size={15} className="text-violet-600" /> : <Users size={15} className="text-violet-600" />}
      title={editingUser ? 'Edit Cashier' : 'Add Cashier'}
      sub={editingUser ? `Updating ${editingUser.name}` : 'Create a new cashier account'}
      footer={
        <>
          <Btn variant="secondary" onClick={onClose} disabled={saving}>Cancel</Btn>
          <Btn onClick={handleSubmit} disabled={saving}>
            {saving
              ? <span className="flex items-center gap-1.5"><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</span>
              : editingUser ? 'Save Changes' : <><Plus size={13} /> Add Cashier</>}
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
        <input {...f('name')} placeholder="e.g. Juan Dela Cruz" className={inputCls(errors.name)} />
      </Field>
      <Field label="Email" required error={errors.email}>
        <input {...f('email')} type="email" placeholder="e.g. juan@luckyboba.com" className={inputCls(errors.email)} />
      </Field>
      <Field label={editingUser ? 'New Password' : 'Password'} required={!editingUser} error={errors.password}>
        <input {...f('password')} type="password" placeholder={editingUser ? 'Leave blank to keep current' : 'Min. 6 characters'} className={inputCls(errors.password)} />
      </Field>
      <Field label="Confirm Password" error={errors.passwordConfirm}>
        <input {...f('passwordConfirm')} type="password" placeholder="Re-enter password" className={inputCls(errors.passwordConfirm)} />
      </Field>
      <Field label="Status" required>
        <select {...f('status')} className={inputCls()}>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </Field>
      {/* Hint for new cashiers: device assigned after saving */}
      {!editingUser && (
        <div className="flex items-center gap-2 p-3 bg-violet-50 border border-violet-200 rounded-lg">
          <Laptop size={13} className="text-violet-500 shrink-0" />
          <p className="text-[10px] text-violet-700 font-medium">You can assign a POS device to this cashier after saving.</p>
        </div>
      )}
    </ModalShell>
  );
};

// ─── Toggle Status Modal ──────────────────────────────────────────────────────

const ToggleStatusModal: React.FC<{
  onClose:   () => void;
  onToggled: (u: User) => void;
  user:      User;
}> = ({ onClose, onToggled, user }) => {
  const [saving,   setSaving]   = useState(false);
  const [apiError, setApiError] = useState('');
  const isActive = user.status === 'ACTIVE';

  const handleToggle = async () => {
    setSaving(true); setApiError('');
    try {
      const res = await api.patch(`/users/${user.id}/toggle-status`);
      onToggled(mapUser(res.data?.data ?? res.data));
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setApiError(msg ?? 'Failed to update status.');
    } finally { setSaving(false); }
  };

  return createPortal(
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-6"
      style={{ backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', backgroundColor: 'rgba(0,0,0,0.45)' }}>
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white w-full max-w-sm border border-zinc-200 rounded-[1.25rem] shadow-2xl">
        <div className="flex flex-col items-center text-center px-6 pt-8 pb-5">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 border ${isActive ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
            {isActive ? <XCircle size={24} className="text-amber-500" /> : <UserCheck size={24} className="text-emerald-500" />}
          </div>
          <p className="text-base font-bold text-[#1a0f2e]">{isActive ? 'Deactivate Cashier?' : 'Activate Cashier?'}</p>
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
            <Badge status={isActive ? 'INACTIVE' : 'ACTIVE'} />
          </div>
        </div>
        <div className="flex items-center gap-2 px-6 pb-6">
          <Btn variant="secondary" className="flex-1 justify-center" onClick={onClose} disabled={saving}>Cancel</Btn>
          <button onClick={handleToggle} disabled={saving}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer disabled:opacity-50 text-white ${isActive ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
            {saving
              ? <span className="flex items-center gap-1.5"><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Updating...</span>
              : isActive ? <><XCircle size={13} /> Deactivate</> : <><UserCheck size={13} /> Activate</>}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ─── Delete Modal ─────────────────────────────────────────────────────────────

const DeleteUserModal: React.FC<{
  onClose:   () => void;
  onDeleted: (id: number) => void;
  user:      User;
}> = ({ onClose, onDeleted, user }) => {
  const [saving,   setSaving]   = useState(false);
  const [apiError, setApiError] = useState('');

  const handleDelete = async () => {
    setSaving(true); setApiError('');
    try {
      await api.delete(`/users/${user.id}`);
      onDeleted(user.id);
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setApiError(msg ?? 'Failed to delete cashier.');
    } finally { setSaving(false); }
  };

  return createPortal(
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-6"
      style={{ backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', backgroundColor: 'rgba(0,0,0,0.45)' }}>
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white w-full max-w-sm border border-zinc-200 rounded-[1.25rem] shadow-2xl">
        <div className="flex flex-col items-center text-center px-6 pt-8 pb-5">
          <div className="w-14 h-14 bg-red-50 border border-red-200 rounded-full flex items-center justify-center mb-4">
            <Trash size={22} className="text-red-500" />
          </div>
          <p className="text-base font-bold text-[#1a0f2e]">Delete Cashier?</p>
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
              <ShieldCheck size={9} />Cashier
            </p>
          </div>
          <Badge status={user.status} />
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

// ─── Assign Device Modal ──────────────────────────────────────────────────────

const AssignDeviceModal: React.FC<{
  onClose:     () => void;
  onAssigned?: (userId: number, deviceId: number | null, deviceNumber: string | null) => void;
  user:        User;
}> = ({ onClose, onAssigned, user }) => {
  const [devices,    setDevices]    = useState<PosDevice[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [apiError,   setApiError]   = useState('');
  const [success,    setSuccess]    = useState(false);

  const currentDevice = devices.find(d => d.user_id === user.id);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res  = await api.get('/pos-devices');
        const list: PosDevice[] = res.data?.devices ?? res.data ?? [];
        setDevices(list.filter(d => d.status === 'ACTIVE'));
        const assigned = list.find(d => d.user_id === user.id);
        if (assigned) setSelectedId(String(assigned.id));
      } catch { setApiError('Failed to load devices.'); }
      finally { setLoading(false); }
    })();
  }, [user.id]);

  const handleAssign = async () => {
    if (!selectedId) return;
    setSaving(true); setApiError('');
    try {
      await api.patch(`/pos-devices/${selectedId}/assign`, { user_id: user.id });
      const assignedDevice = devices.find(d => String(d.id) === selectedId);
      onAssigned?.(user.id, assignedDevice?.id ?? null, assignedDevice?.pos_number ?? null);
      setSuccess(true); setTimeout(onClose, 1500);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setApiError(msg ?? 'Failed to assign device.');
    } finally { setSaving(false); }
  };

  const handleUnassign = async () => {
    if (!currentDevice) return;
    setSaving(true); setApiError('');
    try {
      await api.patch(`/pos-devices/${currentDevice.id}/unassign`);
      onAssigned?.(user.id, null, null);
      setSuccess(true); setTimeout(onClose, 1500);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setApiError(msg ?? 'Failed to unassign device.');
    } finally { setSaving(false); }
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

          {/* Cashier info row */}
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

          {/* Status banner */}
          {currentDevice ? (
            <div className="flex items-center gap-2 p-3 bg-violet-50 border border-violet-200 rounded-lg">
              <MonitorCheck size={13} className="text-violet-500 shrink-0" />
              <p className="text-xs text-violet-700 font-medium">
                Currently on <span className="font-bold">{currentDevice.pos_number}</span>
                {currentDevice.branch?.name ? ` — ${currentDevice.branch.name}` : ''}. Switch device or unassign.
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <MonitorOff size={13} className="text-amber-500 shrink-0" />
              <p className="text-xs text-amber-700 font-medium">No device assigned. Select one below to link it to this cashier.</p>
            </div>
          )}

          <Field label="Select POS Device" required>
            {loading ? (
              <div className="h-10 bg-zinc-100 rounded-lg animate-pulse" />
            ) : devices.length === 0 ? (
              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertCircle size={13} className="text-amber-500 shrink-0" />
                <p className="text-xs text-amber-700 font-medium">No active devices. Ask the superadmin to register a device first.</p>
              </div>
            ) : (
              <select value={selectedId} onChange={e => setSelectedId(e.target.value)} className={inputCls()}>
                <option value="">— Select a device —</option>
                {devices.map(d => (
                  <option key={d.id} value={String(d.id)}>
                    {d.pos_number}
                    {d.branch?.name ? ` — ${d.branch.name}` : ''}
                    {d.user_id && d.user_id !== user.id
                      ? ` ⚠ assigned to ${d.user?.name ?? 'another cashier'}`
                      : d.user_id === user.id ? ' ✓ current' : ''}
                  </option>
                ))}
              </select>
            )}
          </Field>

          <p className="text-[10px] text-zinc-400 font-medium">
            Only <span className="font-bold">ACTIVE</span> devices are shown. Reassigning moves the device from the other cashier.
          </p>
        </>
      )}
    </ModalShell>
  );
};

// ─── Register Device Modal ────────────────────────────────────────────────────

const RegisterDeviceModal: React.FC<{
  onClose:      () => void;
  onRegistered: (device: PosDevice) => void;
  branches:     Branch[];
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
      type LaravelError = { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const errData = (err as LaravelError)?.response?.data;
      if (errData?.errors) {
        const mapped: Record<string, string> = {};
        Object.entries(errData.errors).forEach(([k, v]) => { mapped[k] = Array.isArray(v) ? v[0] : String(v); });
        setErrors(mapped);
      } else { setApiError(errData?.message ?? 'Failed to register device.'); }
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
          <Field label="Device ID" required error={errors.device_name}>
            <input {...f('device_name')} placeholder="e.g. DEV-3700E18D-..." className={inputCls(errors.device_name)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="POS Number" required error={errors.pos_number}>
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

// ─── Main Component ───────────────────────────────────────────────────────────

const UserManagement: React.FC = () => {
  const [users,      setUsers]      = useState<User[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [search,     setSearch]     = useState('');
  const [branchId,   setBranchId]   = useState<number | null>(null);
  const [branches,     setBranches]     = useState<Branch[]>([]);
  const [registerOpen, setRegisterOpen] = useState(false);

  const [addOpen,      setAddOpen]      = useState(false);
  const [viewTarget,   setViewTarget]   = useState<User | null>(null);
  const [editTarget,   setEditTarget]   = useState<User | null>(null);
  const [toggleTarget, setToggleTarget] = useState<User | null>(null);
  const [delTarget,    setDelTarget]    = useState<User | null>(null);
  const [deviceTarget, setDeviceTarget] = useState<User | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true); setFetchError('');
    try {
      const meRes = await api.get('/user');
      const me    = meRes.data?.data ?? meRes.data;
      setBranchId(me?.branch_id ?? null);

      const [usersRes, branchesRes] = await Promise.all([
        api.get('/users'),
        api.get('/branches'),
      ]);

      const payload = usersRes.data;
      const raw: unknown[] = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data) ? payload.data : [];

      const list = raw
        .filter((u): u is Record<string, unknown> => !!u && typeof u === 'object' && 'id' in (u as object))
        .map(mapUser)
        .filter(u => u.role === 'cashier' || u.role === 'team_leader');

      setUsers(list);

      // ── Load branches for device registration ─────────────────────────────
      const branchData = branchesRes.data;
      setBranches(Array.isArray(branchData?.data) ? branchData.data : []);

    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setFetchError(msg ?? 'Failed to load cashiers.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Update device info in local state after assign/unassign — no full refetch needed
  const handleDeviceAssigned = (userId: number, deviceId: number | null, deviceNumber: string | null) => {
    setUsers(prev => prev.map(u =>
      u.id === userId ? { ...u, device_id: deviceId, device_number: deviceNumber } : u
    ));
  };

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount   = users.filter(u => u.status === 'ACTIVE').length;
  const inactiveCount = users.filter(u => u.status !== 'ACTIVE').length;

  return (
    <div className="p-6 md:p-8" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-bold text-[#1a0f2e]">Cashier Management</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            {loading ? 'Loading...' : `${users.length} cashiers · ${activeCount} active`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Btn variant="secondary" onClick={fetchUsers} disabled={loading}>
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </Btn>
          <Btn onClick={() => setAddOpen(true)} disabled={loading}>
            <Plus size={13} /> Add Cashier
          </Btn>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-zinc-200 rounded-[0.625rem] px-6 py-5 flex items-center gap-3">
          <div className="w-10 h-10 bg-violet-50 border border-violet-200 flex items-center justify-center rounded-[0.4rem]">
            <Users size={16} className="text-violet-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Total Staffs</p>
            <p className="text-xl font-bold text-[#1a0f2e] tabular-nums">{loading ? '—' : users.length}</p>
          </div>
        </div>
        <div className="bg-white border border-zinc-200 rounded-[0.625rem] px-6 py-5 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 border border-emerald-200 flex items-center justify-center rounded-[0.4rem]">
            <UserCheck size={16} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Active</p>
            <p className="text-xl font-bold text-[#1a0f2e] tabular-nums">{loading ? '—' : activeCount}</p>
          </div>
        </div>
        <div className="bg-white border border-zinc-200 rounded-[0.625rem] px-6 py-5 flex items-center gap-3">
          <div className="w-10 h-10 bg-red-50 border border-red-200 flex items-center justify-center rounded-[0.4rem]">
            <XCircle size={16} className="text-red-500" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Inactive</p>
            <p className="text-xl font-bold text-[#1a0f2e] tabular-nums">{loading ? '—' : inactiveCount}</p>
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white border border-zinc-200 rounded-[0.625rem] overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-100">
          <div className="flex-1 flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2">
            <Search size={13} className="text-zinc-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm text-zinc-700 outline-none placeholder:text-zinc-400"
              placeholder="Search cashiers..." />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100">
                {['Name', 'Email', 'Device', 'Last Login', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-zinc-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && [...Array(4)].map((_, i) => (
                <tr key={i} className="border-b border-zinc-50">
                  {[...Array(6)].map((_, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-3 bg-zinc-100 rounded animate-pulse" style={{ width: `${60 + (j * 7) % 40}%` }} />
                    </td>
                  ))}
                </tr>
              ))}

              {!loading && fetchError && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center">
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
                  <td colSpan={6} className="px-5 py-10 text-center text-zinc-400 text-xs font-medium">
                    {search ? 'No cashiers match your search.' : 'No cashiers found in your branch.'}
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
                  <td className="px-5 py-3.5 text-zinc-500">{u.email}</td>
                  {/* Device status pill — always visible for cashiers */}
                  <td className="px-5 py-3.5">
                    <DevicePill deviceNumber={u.device_number} />
                  </td>
                  <td className="px-5 py-3.5 text-zinc-400 text-xs">{u.lastLogin ?? '—'}</td>
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
                        className={`p-1.5 rounded-[0.4rem] transition-colors ${u.status === 'ACTIVE' ? 'hover:bg-amber-50 text-zinc-400 hover:text-amber-500' : 'hover:bg-emerald-50 text-zinc-400 hover:text-emerald-600'}`}
                        title={u.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}>
                        {u.status === 'ACTIVE' ? <Lock size={13} /> : <UserCheck size={13} />}
                      </button>
                      <button onClick={() => setDelTarget(u)}
                        className="p-1.5 hover:bg-red-50 rounded-[0.4rem] text-zinc-400 hover:text-red-500 transition-colors" title="Delete">
                        <Trash2 size={13} />
                      </button>
                      {/* Assign Device — always shown, colour indicates assignment state */}
                      <button
                        onClick={() => setDeviceTarget(u)}
                        className={`p-1.5 rounded-[0.4rem] transition-colors ${
                          u.device_number
                            ? 'hover:bg-violet-50 text-violet-500 hover:text-violet-700'
                            : 'hover:bg-amber-50 text-amber-400 hover:text-amber-600'
                        }`}
                        title={u.device_number ? `Device: ${u.device_number} — click to change` : 'No device — click to assign'}>
                        <Laptop size={13} />
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
      {addOpen && (
        <CashierFormModal onClose={() => setAddOpen(false)} onSaved={u => setUsers(p => [u, ...p])} branchId={branchId} />
      )}
      {viewTarget && (
        <ViewUserModal onClose={() => setViewTarget(null)} user={viewTarget} />
      )}
      {editTarget && (
        <CashierFormModal
          onClose={() => setEditTarget(null)}
          onSaved={u => { setUsers(p => p.map(x => x.id === u.id ? u : x)); setEditTarget(null); }}
          editingUser={editTarget}
          branchId={branchId}
        />
      )}
      {toggleTarget && (
        <ToggleStatusModal
          onClose={() => setToggleTarget(null)}
          onToggled={u => { setUsers(p => p.map(x => x.id === u.id ? u : x)); setToggleTarget(null); }}
          user={toggleTarget}
        />
      )}
      {delTarget && (
        <DeleteUserModal
          onClose={() => setDelTarget(null)}
          onDeleted={id => { setUsers(p => p.filter(x => x.id !== id)); setDelTarget(null); }}
          user={delTarget}
        />
      )}
      {deviceTarget && (
        <AssignDeviceModal
          onClose={() => setDeviceTarget(null)}
          onAssigned={handleDeviceAssigned}
          user={deviceTarget}
        />
      )}
      {registerOpen && (
        <RegisterDeviceModal
          onClose={() => setRegisterOpen(false)}
          onRegistered={() => {}}
          branches={branches}
        />
      )}
    </div>
  );
};

export default UserManagement;