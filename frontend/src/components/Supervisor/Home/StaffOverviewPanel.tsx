import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Eye, Edit2, Trash2, Lock, UserCheck, XCircle,
  Users, X, AlertCircle, RefreshCw, Mail, MapPin, ShieldCheck,
  Trash, CheckCircle, Laptop, MonitorCheck, MonitorOff, Plus,
  Shield, Fingerprint, Activity
} from 'lucide-react';
import { createPortal } from 'react-dom';
import api from '../../../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

type VariantKey = 'primary' | 'secondary' | 'danger' | 'ghost';
type SizeKey = 'sm' | 'md' | 'lg';

interface Staff {
  id: number;
  name: string;
  email: string;
  role: string;
  branch: string;
  branch_id: number | null;
  status: string;
  lastLogin?: string;
  login_count: number;
  created_at: string;
  has_pin: boolean;
  device_id?: number | null;
  device_number?: string | null;
}

interface FormState {
  name: string;
  email: string;
  password: string;
  passwordConfirm: string;
  status: string;
  role: string;
  manager_pin: string;
}

interface PosDevice {
  id: number;
  device_name: string;
  pos_number: string;
  branch_id: number;
  status: string;
  user_id: number | null;
  user?: { id: number; name: string } | null;
  branch?: { id: number; name: string } | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapStaff = (u: any): Staff => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  branch: u.branch ?? u.branch_name ?? '—',
  branch_id: u.branch_id ?? null,
  status: u.status,
  lastLogin: u.last_login_at
    ? new Date(u.last_login_at).toLocaleString('en-PH', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
    : undefined,
  login_count: u.login_count ?? 0,
  created_at: u.created_at,
  has_pin: u.has_pin ?? false,
  device_id: u.device_id ?? null,
  device_number: u.device_number ?? u.pos_number ?? null,
});

const blankForm = (): FormState => ({
  name: '', email: '', password: '', passwordConfirm: '', status: 'ACTIVE', role: 'cashier', manager_pin: '',
});

// ─── Shared UI ────────────────────────────────────────────────────────────────

const Avatar: React.FC<{ name: string; size?: string }> = ({ name, size = 'w-9 h-9 text-[11px]' }) => (
  <div className={`${size} rounded-xl bg-[#6a12b8]/10 flex items-center justify-center font-black text-[#6a12b8] shrink-0 border border-[#6a12b8]/20 shadow-sm`}>
    {name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
  </div>
);

const Badge: React.FC<{ status: string }> = ({ status }) => {
  const isActive = status === 'ACTIVE' || status === 'active';
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest
      ${isActive
        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
        : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
      {status}
    </span>
  );
};

const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
  const isTL = role === 'team_leader';
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest
      ${isTL
        ? 'bg-[#6a12b8] text-white shadow-lg shadow-[#6a12b8]/20'
        : 'bg-white text-[#6a12b8] border border-[#6a12b8]/20 shadow-sm'}`}>
      {isTL ? <Shield size={10} /> : <Users size={10} />}
      {role.replace('_', ' ')}
    </span>
  );
};

const DevicePill: React.FC<{ deviceNumber?: string | null }> = ({ deviceNumber }) =>
  deviceNumber ? (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-black bg-slate-900 text-white px-2.5 py-1 rounded-lg shadow-sm">
      <MonitorCheck size={11} className="text-emerald-400" />{deviceNumber}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold bg-slate-50 text-slate-400 border border-slate-200 px-2.5 py-1 rounded-lg">
      <MonitorOff size={11} />None
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
  const sizes: Record<SizeKey, string> = { sm: 'px-4 py-2.5 text-[11px]', md: 'px-5 py-3 text-sm', lg: 'px-6 py-4 text-sm' };
  const variants: Record<VariantKey, string> = {
    primary: 'bg-[#6a12b8] hover:bg-[#6a12b8] text-white shadow-lg shadow-[#6a12b8]/20',
    secondary: 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm',
    danger: 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20',
    ghost: 'bg-transparent text-slate-500 hover:bg-slate-100',
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 font-black uppercase tracking-widest rounded-xl transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 ${sizes[size]} ${variants[variant]} ${className}`}>
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
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6"
        style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', backgroundColor: 'rgba(15, 23, 42, 0.6)' }}>
        <div className="absolute inset-0" onClick={onClose} />
        <div className={`relative bg-white w-full ${maxWidth} border border-slate-200 rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200`}>
          <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 bg-white shadow-md border border-slate-100 rounded-2xl flex items-center justify-center text-[#6a12b8]">{icon}</div>
              <div>
                <p className="text-base font-black text-slate-900 tracking-tight leading-tight">{title}</p>
                <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">{sub}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-9 h-9 flex items-center justify-center hover:bg-white hover:shadow-md rounded-xl transition-all text-slate-400 hover:text-slate-900 border border-transparent hover:border-slate-100">
              <X size={18} strokeWidth={2.5} />
            </button>
          </div>
          <div className="px-8 py-6 flex flex-col gap-5 max-h-[65vh] overflow-y-auto">{children}</div>
          <div className="flex items-center justify-end gap-3 px-8 py-5 border-t border-slate-100 bg-slate-50/30">{footer}</div>
        </div>
      </div>,
      document.body
    );

// ─── Field helpers ────────────────────────────────────────────────────────────

const Field: React.FC<{ label: string; required?: boolean; error?: string; children: React.ReactNode }> = ({ label, required, error, children }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 px-1">
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    {children}
    {error && <p className="text-[10px] text-rose-500 px-1 font-bold flex items-center gap-1 mt-1.5 underline decoration-rose-500/30 underline-offset-2 tracking-wide uppercase"><AlertCircle size={10} />{error}</p>}
  </div>
);

const inputCls = (err?: string) =>
  `w-full text-[13px] font-bold text-slate-900 bg-slate-50 border-2 rounded-2xl px-4 py-3.5 outline-none focus:ring-4 focus:ring-[#6a12b8]/10 focus:bg-white focus:border-[#6a12b8] transition-all ${err ? 'border-rose-200 bg-rose-50/30' : 'border-slate-100'}`;

// ─── View Modal ───────────────────────────────────────────────────────────────

const ViewStaffModal: React.FC<{ onClose: () => void; user: Staff }> = ({ onClose, user }) => {
  const rows: [string, React.ReactNode][] = [
    ['Staff Entity ID', <span className="font-mono text-[#6a12b8]">#{user.id}</span>],
    ['Full Legal Name', <div className="flex items-center gap-3"><Avatar name={user.name} />{user.name}</div>],
    ['Primary Email', <span className="flex items-center gap-1.5"><Mail size={12} className="text-slate-400" />{user.email}</span>],
    ['Assign Branch', <span className="flex items-center gap-1.5"><MapPin size={12} className="text-slate-400" />{user.branch}</span>],
    ['System Access', <RoleBadge role={user.role} />],
    ['Current Status', <Badge status={user.status} />],
    ['Last Active', user.lastLogin ?? 'NO ACTIVITY DATA'],
    ['PIN Protection', user.has_pin ? <span className="flex items-center gap-1.5 text-emerald-600"><Fingerprint size={12} /> SECURED</span> : <span className="flex items-center gap-1.5 text-slate-400"><Fingerprint size={12} /> NOT SET</span>],
  ];
  return (
    <ModalShell onClose={onClose} icon={<Eye size={18} strokeWidth={2.5} />}
      title={user.name} sub="Verified Personnel Profile"
      footer={<Btn variant="secondary" onClick={onClose}>Dismiss</Btn>}>
      <div className="flex flex-col divide-y divide-slate-100 bg-slate-50/50 rounded-2xl border border-slate-100 overflow-hidden">
        {rows.map(([label, val]) => (
          <div key={label as string} className="flex items-center justify-between p-4 bg-white/40">
            <span className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-400">{label}</span>
            <span className="text-xs font-bold text-slate-700">{val}</span>
          </div>
        ))}
      </div>
    </ModalShell>
  );
};

// ─── Staff Form Modal (Add / Edit) ────────────────────────────────────────────

const StaffFormModal: React.FC<{
  onClose: () => void;
  onSaved: (u: Staff) => void;
  editingUser?: Staff | null;
  branchId: number | null;
}> = ({ onClose, onSaved, editingUser, branchId }) => {
  const [form, setForm] = useState<FormState>(
    editingUser
      ? { name: editingUser.name, email: editingUser.email, password: '', passwordConfirm: '', status: editingUser.status, role: editingUser.role, manager_pin: '' }
      : blankForm()
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState('');

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required.';
    if (!form.email.trim()) e.email = 'Email is required.';
    if (!editingUser && !form.password) e.password = 'Password is required.';
    if (form.password && form.password.length < 6) e.password = 'Password must be at least 6 characters.';
    if (form.password && form.password !== form.passwordConfirm) e.passwordConfirm = 'Passwords do not match.';
    if (form.role === 'team_leader' && !editingUser && !form.manager_pin) e.manager_pin = 'PIN is required for Team Leaders.';
    if (form.manager_pin && form.manager_pin.length !== 6) e.manager_pin = 'PIN must be exactly 6 digits.';
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
          name: form.name, email: form.email, role: form.role,
          status: form.status, branch_id: branchId,
        };
        if (form.password) {
          payload.password = form.password;
          payload.password_confirmation = form.passwordConfirm;
        }
        const res = await api.put(`/users/${editingUser.id}`, payload);
        onSaved(mapStaff(res.data?.data ?? res.data));
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const payload: Record<string, any> = {
          name: form.name, email: form.email,
          password: form.password, password_confirmation: form.passwordConfirm,
          role: form.role, status: form.status, branch_id: branchId,
        };
        if (form.role === 'team_leader' && form.manager_pin) {
          payload.manager_pin = form.manager_pin;
        }
        const res = await api.post('/users', payload);
        onSaved(mapStaff(res.data?.data ?? res.data));
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
      title={editingUser ? 'Update System Access' : 'New System Entry'}
      sub={editingUser ? `Provisioning updates for ${editingUser.name}` : 'Provisioning new system access'}
      footer={
        <>
          <Btn variant="secondary" onClick={onClose} disabled={saving}>Cancel</Btn>
          <Btn onClick={handleSubmit} disabled={saving}>
            {saving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : editingUser ? (
              'Sync Profile'
            ) : (
              <>
                <Plus size={14} strokeWidth={3} /> Create Access
              </>
            )}
          </Btn>
        </>
      }
    >
      {apiError && (
        <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-100 rounded-2xl mb-5">
          <AlertCircle size={16} className="text-rose-500 shrink-0" />
          <p className="text-[11px] text-rose-700 font-bold uppercase tracking-wide">{apiError}</p>
        </div>
      )}
      <div className="flex flex-col gap-5">
        <Field label="Staff Legal Name" required error={errors.name}>
          <input {...f('name')} placeholder="e.g. Juan Dela Cruz" className={inputCls(errors.name)} />
        </Field>
        <Field label="Corporate Email Address" required error={errors.email}>
          <input {...f('email')} type="email" placeholder="staff@luckyboba.com" className={inputCls(errors.email)} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label={editingUser ? 'Rotate Password' : 'Access Password'} required={!editingUser} error={errors.password}>
            <input {...f('password')} type="password" placeholder={editingUser ? '••••••••' : 'Min. 6 chars'} className={inputCls(errors.password)} />
          </Field>
          <Field label="Confirm Password" error={errors.passwordConfirm}>
            <input {...f('passwordConfirm')} type="password" placeholder="Verify entry" className={inputCls(errors.passwordConfirm)} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Deployment Status" required>
            <select {...f('status')} className={inputCls()}>
              <option value="ACTIVE">System Active</option>
              <option value="INACTIVE">Deactivated</option>
            </select>
          </Field>
          <Field label="Access Tier" required>
            <select {...f('role')} className={inputCls()}>
              <option value="cashier">Cashier</option>
              <option value="team_leader">Team Leader</option>
            </select>
          </Field>
        </div>

        {form.role === 'team_leader' && (
          <div className="animate-in slide-in-from-top-2 duration-300">
            <Field label="Operational PIN" required={!editingUser} error={errors.manager_pin}>
              <div className="relative">
                <input
                  {...f('manager_pin')}
                  type="text"
                  maxLength={6}
                  placeholder="6-digit PIN"
                  className={inputCls(errors.manager_pin)}
                />
                <Fingerprint size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
              <p className="text-[9px] text-slate-400 mt-1.5 font-bold uppercase tracking-wider">
                Required for POS authorization & sensitive overrides.
              </p>
            </Field>
          </div>
        )}
      </div>
      {!editingUser && (
        <div className="p-4 bg-[#6a12b8]/10 border border-[#6a12b8]/20 rounded-2xl flex items-start gap-3">
          <Activity size={16} className="text-[#6a12b8] mt-1" />
          <p className="text-[10px] text-[#6a12b8] font-bold leading-relaxed uppercase tracking-wider">
            Operational Note: Device terminal mapping remains restricted until the entity is confirmed in the global database.
          </p>
        </div>
      )}
    </ModalShell>
  );
};

// ─── Toggle Status Modal ──────────────────────────────────────────────────────

const ToggleStatusModal: React.FC<{
  onClose: () => void;
  onToggled: (u: Staff) => void;
  user: Staff;
}> = ({ onClose, onToggled, user }) => {
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState('');
  const isActive = user.status === 'ACTIVE';

  const handleToggle = async () => {
    setSaving(true); setApiError('');
    try {
      const res = await api.patch(`/users/${user.id}/toggle-status`);
      onToggled(mapStaff(res.data?.data ?? res.data));
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setApiError(msg ?? 'Failed to update status.');
    } finally { setSaving(false); }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6"
      style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', backgroundColor: 'rgba(15, 23, 42, 0.6)' }}>
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md border border-slate-200 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center px-10 pt-10 pb-6">
          <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center mb-6 shadow-xl ${isActive ? 'bg-amber-50 text-amber-500 shadow-amber-500/10 border border-amber-100' : 'bg-emerald-50 text-emerald-500 shadow-emerald-500/10 border border-emerald-100'}`}>
            {isActive ? <XCircle size={36} strokeWidth={2.5} /> : <UserCheck size={36} strokeWidth={2.5} />}
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight leading-tight">{isActive ? 'Terminate Access?' : 'Reclaim Access?'}</h2>
          <p className="text-[11px] font-bold text-slate-400 mt-2 uppercase tracking-[0.1em]">Verified Action Required</p>
          <p className="text-xs font-bold text-slate-500 mt-6 leading-relaxed max-w-[280px]">
            {isActive
              ? <>Immediate termination of <span className="text-slate-900">{user.name}</span>'s active session and system login ability.</>
              : <>Restoring full operational privileges to <span className="text-slate-900">{user.name}</span> across all assigned terminals.</>}
          </p>
          {apiError && (
            <div className="flex items-center gap-2 mt-6 p-4 w-full bg-rose-50 border border-rose-100 rounded-2xl">
              <AlertCircle size={16} className="text-rose-500" />
              <p className="text-[10px] text-rose-700 font-black uppercase tracking-wide">{apiError}</p>
            </div>
          )}
        </div>
        <div className="mx-10 mb-8 flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-[1.5rem]">
          <Avatar name={user.name} size="w-10 h-10 text-xs" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black text-slate-900 truncate">{user.name}</p>
            <p className="text-[10px] font-bold text-slate-400 truncate uppercase tracking-wider italic">{user.role}</p>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <Badge status={isActive ? 'INACTIVE' : 'ACTIVE'} />
          </div>
        </div>
        <div className="flex items-center gap-3 px-10 pb-10">
          <Btn variant="secondary" className="flex-1" onClick={onClose} disabled={saving}>Cancel</Btn>
          <button onClick={handleToggle} disabled={saving}
            className={`flex-1 inline-flex items-center justify-center gap-2.5 px-3 py-4 text-[11px] font-black uppercase tracking-[0.15em] rounded-2xl transition-all active:scale-[0.98] shadow-xl disabled:opacity-50 text-white ${isActive ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'}`}>
            {saving
              ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : isActive ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ─── Delete Modal ─────────────────────────────────────────────────────────────

const DeleteStaffModal: React.FC<{
  onClose: () => void;
  onDeleted: (id: number) => void;
  user: Staff;
}> = ({ onClose, onDeleted, user }) => {
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState('');

  const handleDelete = async () => {
    setSaving(true); setApiError('');
    try {
      await api.delete(`/users/${user.id}`);
      onDeleted(user.id);
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setApiError(msg ?? 'Failed to delete staff.');
    } finally { setSaving(false); }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6"
      style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', backgroundColor: 'rgba(15, 23, 42, 0.6)' }}>
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md border border-slate-200 rounded-[2.5rem] shadow-2xl overflow-hidden">
        <div className="flex flex-col items-center text-center px-10 pt-10 pb-6">
          <div className="w-20 h-20 bg-rose-50 border border-rose-100 rounded-[2rem] flex items-center justify-center mb-6 shadow-xl shadow-rose-500/10">
            <Trash size={32} strokeWidth={2.5} className="text-rose-500" />
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight leading-tight">Entity Deletion</h2>
          <p className="text-[11px] font-bold text-slate-400 mt-2 uppercase tracking-[0.1em]">Permanent Change Record</p>
          <p className="text-xs font-bold text-slate-500 mt-6 leading-relaxed max-w-[280px]">
            Executing permanent removal of <span className="text-slate-900">{user.name}</span> from the central database. This action is irreversible.
          </p>
          {apiError && (
            <div className="flex items-center gap-2 mt-6 p-4 w-full bg-rose-50 border border-rose-100 rounded-2xl">
              <AlertCircle size={16} className="text-rose-500" />
              <p className="text-[10px] text-rose-700 font-black uppercase tracking-wide">{apiError}</p>
            </div>
          )}
        </div>
        <div className="mx-10 mb-8 flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-[1.5rem]">
          <Avatar name={user.name} size="w-10 h-10 text-xs" />
          <div className="min-w-0 flex-1 text-left">
            <p className="text-xs font-black text-slate-900 truncate">{user.name}</p>
            <p className="text-[10px] font-bold text-slate-400 truncate uppercase tracking-widest flex items-center gap-1">
              <ShieldCheck size={9} />{user.role === 'team_leader' ? 'TEAM LEAD' : 'CASHIER'}
            </p>
          </div>
          <Badge status={user.status} />
        </div>
        <div className="flex items-center gap-3 px-10 pb-10">
          <Btn variant="secondary" className="flex-1" onClick={onClose} disabled={saving}>Cancel</Btn>
          <Btn variant="danger" className="flex-1" onClick={handleDelete} disabled={saving}>
            {saving
              ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : 'Execute Removal'}
          </Btn>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ─── Assign Device Modal ──────────────────────────────────────────────────────

const AssignDeviceModal: React.FC<{
  onClose: () => void;
  onAssigned?: (userId: number, deviceId: number | null, deviceNumber: string | null) => void;
  user: Staff;
}> = ({ onClose, onAssigned, user }) => {
  const [devices, setDevices] = useState<PosDevice[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState('');
  const [success, setSuccess] = useState(false);

  const currentDevice = devices.find(d => d.user_id === user.id);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await api.get('/pos-devices');
        const list: PosDevice[] = res.data?.data ?? res.data?.devices ?? [];
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
    <ModalShell onClose={onClose} icon={<Laptop size={18} strokeWidth={2.5} />}
      title="Terminal Mapping" sub={`Provision hardware access for ${user.name}`}
      footer={
        success ? null : (
          <>
            <Btn variant="secondary" onClick={onClose} disabled={saving}>Cancel</Btn>
            {currentDevice && (
              <Btn variant="danger" onClick={handleUnassign} disabled={saving || loading}>
                {saving
                  ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <><MonitorOff size={14} strokeWidth={2.5} /> Wipe Mapping</>}
              </Btn>
            )}
            <Btn onClick={handleAssign} disabled={saving || loading || !selectedId}>
              {saving
                ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><MonitorCheck size={14} strokeWidth={3} /> Execute Sync</>}
            </Btn>
          </>
        )
      }>
      {success ? (
        <div className="flex flex-col items-center py-10 gap-5">
          <div className="w-20 h-20 bg-emerald-50 border border-emerald-100 rounded-[2rem] flex items-center justify-center shadow-xl shadow-emerald-500/10">
            <CheckCircle size={36} strokeWidth={2.5} className="text-emerald-500" />
          </div>
          <p className="text-sm font-black text-slate-900 tracking-tight uppercase">Terminal Link Verified</p>
        </div>
      ) : (
        <>
          {apiError && (
            <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-100 rounded-2xl">
              <AlertCircle size={16} className="text-rose-500 shrink-0" />
              <p className="text-[11px] text-rose-700 font-bold uppercase">{apiError}</p>
            </div>
          )}
          <div className="flex items-center gap-4 p-4 bg-slate-900 text-white rounded-[1.5rem] shadow-xl">
            <Avatar name={user.name} size="w-10 h-10 text-xs" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black truncate tracking-tight">{user.name}</p>
              <p className="text-[10px] font-bold text-slate-400 truncate uppercase tracking-widest leading-none mt-0.5">{user.email}</p>
            </div>
            {currentDevice
              ? <span className="text-[10px] font-black bg-white text-slate-900 px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-lg">
                <MonitorCheck size={12} className="text-emerald-500" />{currentDevice.pos_number}
              </span>
              : <span className="text-[10px] font-black bg-white/10 text-slate-400 px-3 py-1.5 rounded-lg flex items-center gap-1.5 backdrop-blur-sm">
                <MonitorOff size={12} />LINK REQUIRED
              </span>}
          </div>
          {currentDevice ? (
            <div className="p-4 bg-[#6a12b8]/10 border border-[#6a12b8]/20 rounded-2xl flex items-start gap-4">
              <Activity size={18} className="text-[#6a12b8] mt-0.5" />
              <p className="text-[11px] text-[#6a12b8] font-bold leading-relaxed uppercase tracking-wide">
                Terminal active on <span className="underline decoration-[#6a12b8]/30 underline-offset-4">{currentDevice.pos_number}</span>
                {currentDevice.branch?.name ? ` @ ${currentDevice.branch.name}` : ''}. Modify or wipe this record.
              </p>
            </div>
          ) : (
            <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-4">
              <AlertCircle size={18} className="text-amber-500 mt-0.5" />
              <p className="text-[11px] text-amber-900 font-bold uppercase tracking-wide">Warning: No terminal associated. Unassigned entities cannot execute sales transactions.</p>
            </div>
          )}
          <Field label="Target POS Hardware" required>
            {loading ? (
              <div className="h-14 bg-slate-100 rounded-[1.5rem] animate-pulse" />
            ) : devices.length === 0 ? (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3">
                <AlertCircle size={16} className="text-rose-500 shrink-0" />
                <p className="text-[11px] text-rose-700 font-bold uppercase">No active terminals detected in regional grid.</p>
              </div>
            ) : (
              <select value={selectedId} onChange={e => setSelectedId(e.target.value)} className={inputCls()}>
                <option value="">— Select Hardware Node —</option>
                {devices.map(d => (
                  <option key={d.id} value={String(d.id)}>
                    {d.pos_number}
                    {d.branch?.name ? ` @ ${d.branch.name}` : ''}
                    {d.user_id && d.user_id !== user.id
                      ? ` [⚠ TAKEN BY: ${d.user?.name ?? 'UNKNOWN'}]`
                      : d.user_id === user.id ? ' [ACTIVE LINK]' : ''}
                  </option>
                ))}
              </select>
            )}
          </Field>
        </>
      )}
    </ModalShell>
  );
};

// ─── Main Panel ───────────────────────────────────────────────────────────────

const StaffOverviewPanel: React.FC<{ branchId: number | null }> = ({ branchId }) => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [search, setSearch] = useState('');

  const [addOpen, setAddOpen] = useState(false);
  const [viewTarget, setViewTarget] = useState<Staff | null>(null);
  const [editTarget, setEditTarget] = useState<Staff | null>(null);
  const [toggleTarget, setToggleTarget] = useState<Staff | null>(null);
  const [delTarget, setDelTarget] = useState<Staff | null>(null);
  const [deviceTarget, setDeviceTarget] = useState<Staff | null>(null);

  const fetchStaff = useCallback(async () => {
    setLoading(true); setFetchError('');
    try {
      const res = await api.get('/users');
      const payload = res.data;
      const raw: unknown[] = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data) ? payload.data : [];

      const list = raw
        .filter((u): u is Record<string, unknown> => !!u && typeof u === 'object' && 'id' in (u as object))
        .map(mapStaff)
        .filter(u => u.role === 'cashier' || u.role === 'team_leader');

      setStaff(branchId ? list.filter(u => u.branch_id === branchId) : list);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setFetchError(msg ?? 'Failed to load staff network.');
    } finally { setLoading(false); }
  }, [branchId]);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  const handleDeviceAssigned = (userId: number, deviceId: number | null, deviceNumber: string | null) => {
    setStaff(prev => prev.map(u =>
      u.id === userId ? { ...u, device_id: deviceId, device_number: deviceNumber } : u
    ));
  };

  const filtered = staff.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );
  const activeCount = staff.filter(u => u.status === 'ACTIVE').length;
  const inactiveCount = staff.filter(u => u.status !== 'ACTIVE').length;

  return (
    <div className="px-5 md:px-8 py-8 md:py-12 animate-in fade-in duration-700" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* ── COMMAND HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-10 pb-10 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-2.5 h-2.5 rounded-full bg-[#6a12b8]" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6a12b8]">Operations Control</p>
          </div>
          <h1 className="text-[2.2rem] font-black text-slate-900 tracking-tight leading-none">Personnel Directory</h1>
          <p className="text-[0.75rem] font-bold text-slate-400 mt-4 uppercase tracking-[0.1em]">
            {loading ? 'Initializing network...' : `Monitoring ${staff.length} Active System Entities`}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={fetchStaff}
            disabled={loading}
            style={{ backgroundColor: '#6a12b8' }}
            className="inline-flex items-center justify-center gap-2 font-black uppercase tracking-widest rounded-2xl transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 px-4 py-3.5 text-[11px] text-white hover:opacity-90 shadow-xl shadow-[#6a12b8]/20"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Sync Audit
          </button>
          <Btn onClick={() => setAddOpen(true)} disabled={loading} className="!rounded-2xl !py-3.5">
            <Plus size={16} strokeWidth={3} /> Add Personnel
          </Btn>
        </div>
      </div>

      {/* ── REGIONAL STATS HUD ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
        <div className="bg-white border-2 border-slate-100 rounded-[1.75rem] p-6 flex items-center gap-5 shadow-xl shadow-slate-900/5 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#6a12b8]" />
          <div className="w-14 h-14 bg-[#6a12b8]/10 rounded-2xl flex items-center justify-center text-[#6a12b8] shadow-inner">
            <Users size={24} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-1">Grid Entities</p>
            <p className="text-2xl font-black text-slate-900 tabular-nums">{loading ? '—' : staff.length}</p>
          </div>
        </div>
        <div className="bg-white border-2 border-slate-100 rounded-[1.75rem] p-6 flex items-center gap-5 shadow-xl shadow-slate-900/5 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner">
            <UserCheck size={24} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-1">Active Sync</p>
            <p className="text-2xl font-black text-slate-900 tabular-nums">{loading ? '—' : activeCount}</p>
          </div>
        </div>
        <div className="bg-white border-2 border-slate-100 rounded-[1.75rem] p-6 flex items-center gap-5 shadow-xl shadow-slate-900/5 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500" />
          <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 shadow-inner">
            <XCircle size={24} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-1">Deactivated</p>
            <p className="text-2xl font-black text-slate-900 tabular-nums">{loading ? '—' : inactiveCount}</p>
          </div>
        </div>
      </div>

      {/* ── ENTITY REGISTRY TABLE ── */}
      <div className="bg-white border-2 border-slate-100 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-[#6a12b8]/5 bg-gradient-to-br from-white to-slate-50/50">
        <div className="flex items-center gap-4 px-8 py-6 border-b border-slate-100">
          <div className="flex-1 flex items-center gap-3 bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3.5 focus-within:border-[#6a12b8] focus-within:ring-4 focus-within:ring-[#6a12b8]/10 transition-all duration-300">
            <Search size={16} className="text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm font-bold text-slate-700 outline-none placeholder:text-slate-400"
              placeholder="Query personnel by name, email, or unique ID..."
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/30">
                {['Verified Entity', 'System Role', 'Network Access', 'Hardware Mapping', 'Last Active', 'Status', ''].map(h => (
                  <th key={h} className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading && [...Array(4)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={7} className="px-8 py-6"><div className="h-10 bg-slate-100 rounded-xl w-full" /></td>
                </tr>
              ))}

              {!loading && fetchError && (
                <tr>
                  <td colSpan={7} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mb-2">
                        <AlertCircle size={32} />
                      </div>
                      <p className="text-sm font-black text-rose-600">{fetchError}</p>
                      <Btn variant="secondary" size="sm" onClick={fetchStaff}>Reconnect Audit Hub</Btn>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && !fetchError && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-30">
                      <Users size={48} className="text-slate-400 mb-2" />
                      <p className="text-xs font-black uppercase tracking-widest">{search ? 'No entities matched query' : 'Grid registry empty'}</p>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && !fetchError && filtered.map(u => (
                <tr key={u.id} className="group hover:bg-[#6a12b8]/10/20 transition-colors duration-300">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <Avatar name={u.name} />
                      <div className="min-w-0">
                        <p className="text-[13px] font-black text-slate-900 tracking-tight leading-tight">{u.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-0.5 truncate max-w-[150px]">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <RoleBadge role={u.role} />
                  </td>
                  <td className="px-8 py-5 flex flex-col gap-0.5">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Primary Node</p>
                    <span className="text-xs font-bold text-slate-700">{u.branch}</span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col gap-2">
                      <DevicePill deviceNumber={u.device_number} />
                      {u.role === 'cashier' && (
                        <button onClick={() => setDeviceTarget(u)} className="text-left text-[9px] font-black text-[#6a12b8] hover:text-indigo-800 uppercase tracking-widest underline decoration-indigo-200 underline-offset-4 transition-all">
                          {u.device_number ? 'Update Mapping' : 'Provision Sync'}
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col gap-1">
                      <p className="text-[11px] font-black text-slate-700 leading-tight">{u.lastLogin ? u.lastLogin.split(',')[0] : 'NEVER'}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{u.lastLogin ? u.lastLogin.split(',')[1] : 'PENDING'}</p>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <Badge status={u.status} />
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-4 group-hover:translate-x-0">
                      <button onClick={() => setViewTarget(u)} title="Deep View" className="p-2.5 bg-white border border-slate-100 text-slate-500 hover:text-[#6a12b8] hover:border-[#6a12b8]/30 rounded-xl shadow-lg shadow-[#6a12b8]/5 transition-all">
                        <Eye size={15} strokeWidth={2.5} />
                      </button>
                      <button onClick={() => setEditTarget(u)} title="Sync Profile" className="p-2.5 bg-white border border-slate-100 text-slate-500 hover:text-[#6a12b8] hover:border-[#6a12b8]/30 rounded-xl shadow-lg shadow-[#6a12b8]/5 transition-all">
                        <Edit2 size={15} strokeWidth={2.5} />
                      </button>
                      <button onClick={() => setToggleTarget(u)} title={u.status === 'ACTIVE' ? 'Suspend Access' : 'Reactivate'} className={`p-2.5 bg-white border border-slate-100 rounded-xl shadow-lg shadow-[#6a12b8]/5 transition-all ${u.status === 'ACTIVE' ? 'text-amber-500 hover:text-amber-600 hover:border-amber-100' : 'text-emerald-500 hover:text-emerald-600'}`}>
                        {u.status === 'ACTIVE' ? <Lock size={15} strokeWidth={2.5} /> : <UserCheck size={15} strokeWidth={2.5} />}
                      </button>
                      <button onClick={() => setDelTarget(u)} title="Wipe Record" className="p-2.5 bg-white border border-slate-100 text-slate-500 hover:text-rose-500 hover:border-rose-100 rounded-xl shadow-lg shadow-[#6a12b8]/5 transition-all">
                        <Trash2 size={15} strokeWidth={2.5} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modals Stack ── */}
      {addOpen && <StaffFormModal onClose={() => setAddOpen(false)} onSaved={fetchStaff} branchId={branchId} />}
      {editTarget && <StaffFormModal onClose={() => setEditTarget(null)} onSaved={fetchStaff} editingUser={editTarget} branchId={branchId} />}
      {viewTarget && <ViewStaffModal onClose={() => setViewTarget(null)} user={viewTarget} />}
      {toggleTarget && <ToggleStatusModal onClose={() => setToggleTarget(null)} onToggled={fetchStaff} user={toggleTarget} />}
      {delTarget && <DeleteStaffModal onClose={() => setDelTarget(null)} onDeleted={fetchStaff} user={delTarget} />}
      {deviceTarget && <AssignDeviceModal onClose={() => setDeviceTarget(null)} onAssigned={handleDeviceAssigned} user={deviceTarget} />}

      <div className="mt-20 flex items-center justify-center gap-1.5 opacity-20 cursor-default grayscale hover:grayscale-0 transition-all duration-500">
        <span className="w-12 h-px bg-slate-400" />
        <p className="text-[0.65rem] font-black tracking-[0.5em] uppercase">Security Clearance Level 2</p>
        <span className="w-12 h-px bg-slate-400" />
      </div>
    </div>
  );
};

export default StaffOverviewPanel;
