import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Eye, Edit2, Trash2, Lock, UserCheck, XCircle,
  Users, X, AlertCircle, Mail, MapPin, ShieldCheck,
  Trash, CheckCircle, Laptop, MonitorCheck, MonitorOff, Plus,
} from 'lucide-react';
import { createPortal } from 'react-dom';
import api from '../../../services/api';
import { SkeletonBar, SkeletonBox } from '../SharedSkeletons';

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');
  
  .tl-staff-hub { font-family: 'DM Sans', sans-serif; background: #f8fafc; min-height: 100vh; color: #1e293b; }
  
  .tl-tile { 
    background: #ffffff; border: 1px solid #e2e8f0; border-radius: 0.75rem; 
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .tl-tile:hover { 
    border-color: #cbd5e1; 
    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.04);
    transform: translateY(-2px);
  }

  .tl-label { font-size: 0.62rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.12em; }
  .tl-value { font-size: 1.65rem; font-weight: 800; color: #0f172a; letter-spacing: -0.04em; line-height: 1.2; }

  
  @keyframes tl-spin { to { transform: rotate(360deg); } }
  .tl-spin { animation: tl-spin 1s linear infinite; }
`;

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
  name: '', email: '', password: '', passwordConfirm: '', status: 'ACTIVE', role: 'cashier',
});

// ─── Shared UI ────────────────────────────────────────────────────────────────

const Avatar: React.FC<{ name: string; size?: string }> = ({ name, size = 'w-7 h-7 text-[10px]' }) => (
  <div className={`${size} rounded-full bg-[#ede8ff] flex items-center justify-center font-bold text-[#6a12b8] shrink-0`}>
    {name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
  </div>
);

const Badge: React.FC<{ status: string }> = ({ status }) => {
  const isActive = status === 'ACTIVE' || status === 'active';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider
      ${isActive
        ? 'bg-[#10b981]10 text-[#059669] border border-[#10b981]20'
        : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
      {status}
    </span>
  );
};

const DevicePill: React.FC<{ deviceNumber?: string | null }> = ({ deviceNumber }) =>
  deviceNumber ? (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-[#6a12b8]08 text-[#6a12b8] border border-[#6a12b8]20 px-2 py-0.5 rounded-full">
      <MonitorCheck size={9} />{deviceNumber}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-slate-100 text-slate-400 border border-slate-200 px-2 py-0.5 rounded-full">
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
  const sizes: Record<SizeKey, string> = { sm: 'px-3 py-2 text-xs', md: 'px-4 py-2.5 text-sm', lg: 'px-6 py-3 text-sm' };
  const variants: Record<VariantKey, string> = {
    primary: 'bg-[#6a12b8] hover:bg-[#2a1647] text-white',
    secondary: 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50',
    danger: 'bg-rose-500 hover:bg-rose-600 text-white',
    ghost: 'bg-transparent text-slate-500 hover:bg-slate-100',
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`inline-flex items-center gap-1.5 font-bold rounded-lg transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 ${sizes[size]} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

const StatTile: React.FC<{ label: string; value: string | number; icon: React.ElementType; color: string }> = ({ label, value, icon: Icon, color }) => (
  <div className="tl-tile p-6 flex flex-col justify-between min-h-[140px]">
    <div className="flex items-start justify-between">
      <div className="p-2.5 rounded-lg" style={{ background: `${color}08`, color }}>
        <Icon size={20} strokeWidth={2.5} />
      </div>
    </div>
    <div className="mt-4">
      <p className="tl-label mb-1">{label}</p>
      <p className="tl-value">{value}</p>
    </div>
  </div>
);

// ─── Modal Shell ──────────────────────────────────────────────────────────────

const ModalShell: React.FC<{
  onClose: () => void; icon: React.ReactNode; title: string; sub: string;
  children: React.ReactNode; footer: React.ReactNode; maxWidth?: string;
}> = ({ onClose, icon, title, sub, children, footer, maxWidth = 'max-w-md' }) =>
    createPortal(
      <div className="fixed inset-0 z-9999 flex items-center justify-center p-6"
        style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', backgroundColor: 'rgba(15, 23, 42, 0.45)' }}>
        <div className="absolute inset-0" onClick={onClose} />
        <div className={`relative bg-white w-full ${maxWidth} border border-slate-200 rounded-[1.25rem] shadow-2xl overflow-hidden`}>
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/30">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[#6a12b8]08 border border-[#6a12b8]15 rounded-xl flex items-center justify-center text-[#6a12b8]">{icon}</div>
              <div>
                <p className="text-sm font-bold text-slate-900">{title}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{sub}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
          </div>
          <div className="px-6 py-6 flex flex-col gap-5 max-h-[65vh] overflow-y-auto">{children}</div>
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/30">{footer}</div>
        </div>
      </div>,
      document.body
    );

// ─── Field helpers ────────────────────────────────────────────────────────────

const Field: React.FC<{ label: string; required?: boolean; error?: string; children: React.ReactNode }> = ({ label, required, error, children }) => (
  <div className="space-y-1.5">
    <label className="tl-label block ml-1 text-slate-500">
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    {children}
    {error && <p className="text-[10px] font-bold text-rose-500 ml-1">{error}</p>}
  </div>
);

const inputCls = (err?: string) =>
  `w-full text-sm font-bold text-slate-700 bg-slate-50 border rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#6a12b8]/10 focus:border-[#6a12b8] focus:bg-white transition-all ${err ? 'border-rose-300 bg-rose-50' : 'border-slate-200'}`;

// ─── View Modal ───────────────────────────────────────────────────────────────

const ViewStaffModal: React.FC<{ onClose: () => void; user: Staff }> = ({ onClose, user }) => {
  const rows: [string, React.ReactNode][] = [
    ['Staff ID', `#${user.id}`],
    ['Name', <div className="flex items-center gap-2"><Avatar name={user.name} />{user.name}</div>],
    ['Email', <span className="flex items-center gap-1"><Mail size={11} />{user.email}</span>],
    ['Branch', <span className="flex items-center gap-1"><MapPin size={11} />{user.branch}</span>],
    ['Role', <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-violet-50 text-violet-700 border border-violet-200">{user.role === 'team_leader' ? 'Team Leader' : 'Cashier'}</span>],
    ['Status', <Badge status={user.status} />],
    ['Last Login', user.lastLogin ?? '—'],
    ['Device', user.device_number
      ? <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1"><MonitorCheck size={9} />{user.device_number}</span>
      : <span className="text-[10px] font-bold bg-zinc-100 text-zinc-400 border border-zinc-200 px-2 py-0.5 rounded-full flex items-center gap-1"><MonitorOff size={9} />No device</span>],
  ];
  return (
    <ModalShell onClose={onClose} icon={<Eye size={15} className="text-violet-600" />}
      title={user.name} sub="Staff details"
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

// ─── Staff Form Modal (Add / Edit) ────────────────────────────────────────────

const StaffFormModal: React.FC<{
  onClose: () => void;
  onSaved: (u: Staff) => void;
  editingUser?: Staff | null;
  branchId: number | null;
}> = ({ onClose, onSaved, editingUser, branchId }) => {
  const [form, setForm] = useState<FormState>(
    editingUser
      ? { name: editingUser.name, email: editingUser.email, password: '', passwordConfirm: '', status: editingUser.status, role: editingUser.role }
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
        const res = await api.post('/users', {
          name: form.name, email: form.email,
          password: form.password, password_confirmation: form.passwordConfirm,
          role: form.role, status: form.status, branch_id: branchId,
        });
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
      title={editingUser ? 'Edit Staff' : 'Add Staff'}
      sub={editingUser ? `Updating ${editingUser.name}` : 'Create a new cashier or team leader account'}
      footer={
        <>
          <Btn variant="secondary" onClick={onClose} disabled={saving}>Cancel</Btn>
          <Btn onClick={handleSubmit} disabled={saving}>
            {saving
              ? <span className="flex items-center gap-1.5"><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</span>
              : editingUser ? 'Save Changes' : <><Plus size={13} /> Add Staff</>}
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
      <Field label="Role" required>
        <select {...f('role')} className={inputCls()}>
          <option value="cashier">Cashier</option>
          <option value="team_leader">Team Leader</option>
        </select>
      </Field>
      {!editingUser && (
        <div className="flex items-center gap-2 p-3 bg-violet-50 border border-violet-200 rounded-lg">
          <Laptop size={13} className="text-violet-500 shrink-0" />
          <p className="text-[10px] text-violet-700 font-medium">
            You can assign a POS device to cashiers after saving.
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
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-6"
      style={{ backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', backgroundColor: 'rgba(0,0,0,0.45)' }}>
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white w-full max-w-sm border border-zinc-200 rounded-[1.25rem] shadow-2xl">
        <div className="flex flex-col items-center text-center px-6 pt-8 pb-5">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 border ${isActive ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
            {isActive ? <XCircle size={24} className="text-amber-500" /> : <UserCheck size={24} className="text-emerald-500" />}
          </div>
          <p className="text-base font-bold text-[#1a0f2e]">{isActive ? 'Deactivate Staff?' : 'Activate Staff?'}</p>
          <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
            {isActive
              ? <><span className="font-bold text-zinc-700">{user.name}</span> will no longer be able to log in.</>
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
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-6"
      style={{ backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', backgroundColor: 'rgba(0,0,0,0.45)' }}>
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white w-full max-w-sm border border-zinc-200 rounded-[1.25rem] shadow-2xl">
        <div className="flex flex-col items-center text-center px-6 pt-8 pb-5">
          <div className="w-14 h-14 bg-red-50 border border-red-200 rounded-full flex items-center justify-center mb-4">
            <Trash size={22} className="text-red-500" />
          </div>
          <p className="text-base font-bold text-[#1a0f2e]">Delete Staff?</p>
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
              <ShieldCheck size={9} />{user.role === 'team_leader' ? 'Team Leader' : 'Cashier'}
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
    <ModalShell onClose={onClose} icon={<Laptop size={15} className="text-violet-600" />}
      title="Assign POS Device" sub={`Link a device to ${user.name}`}
      footer={
        success ? null : (
          <>
            <Btn variant="secondary" onClick={onClose} disabled={saving}>Cancel</Btn>
            {currentDevice && (
              <Btn variant="danger" onClick={handleUnassign} disabled={saving || loading}>
                {saving
                  ? <span className="flex items-center gap-1.5"><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Removing...</span>
                  : <><MonitorOff size={13} /> Unassign</>}
              </Btn>
            )}
            <Btn onClick={handleAssign} disabled={saving || loading || !selectedId}>
              {saving
                ? <span className="flex items-center gap-1.5"><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Assigning...</span>
                : <><MonitorCheck size={13} /> Assign Device</>}
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
                {currentDevice.branch?.name ? ` — ${currentDevice.branch.name}` : ''}. Switch or unassign.
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <MonitorOff size={13} className="text-amber-500 shrink-0" />
              <p className="text-xs text-amber-700 font-medium">No device assigned. Select one below.</p>
            </div>
          )}
          <Field label="Select POS Device" required>
            {loading ? (
              <div className="h-10 bg-zinc-100 rounded-lg animate-pulse" />
            ) : devices.length === 0 ? (
              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertCircle size={13} className="text-amber-500 shrink-0" />
                <p className="text-xs text-amber-700 font-medium">No active devices available.</p>
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
            Only <span className="font-bold">ACTIVE</span> devices are shown.
          </p>
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

      // Filter by branch if branchId is set
      setStaff(branchId ? list.filter(u => u.branch_id === branchId) : list);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setFetchError(msg ?? 'Failed to load staff.');
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
    <div className="tl-staff-hub p-8 md:p-12">
      <style>{STYLES}</style>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        {loading ? (
          [...Array(3)].map((_, i) => <SkeletonBox key={i} className="min-h-[140px]" />)
        ) : (
          <>
            <StatTile
              icon={Users}
              label="Total Staff"
              value={staff.length}
              color="#6a12b8"
            />
            <StatTile
              icon={UserCheck}
              label="Active"
              value={activeCount}
              color="#10b981"
            />
            <StatTile
              icon={XCircle}
              label="Inactive"
              value={inactiveCount}
              color="#f43f5e"
            />
          </>
        )}
      </div>

      {/* ── Table Container ── */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex-1 flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-4 py-2.5 shadow-sm transition-all focus-within:border-[#6a12b8] focus-within:ring-1 focus-within:ring-[#6a12b8]/10">
            <Search size={14} className="text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 font-medium"
              placeholder="Search staff..."
            />
          </div>
          <Btn onClick={() => setAddOpen(true)} disabled={loading} className="shrink-0 h-[42px]">
            <Plus size={14} /> Add Staff
          </Btn>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {['Name', 'Email', 'Role', 'Device', 'Last Login', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-6 py-4 text-left tl-label">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Skeleton rows */}
              {loading && [...Array(4)].map((_, i) => (
                <tr key={i} className="border-b border-slate-50">
                  {[...Array(7)].map((_, j) => (
                    <td key={j} className="px-6 py-5">
                      <SkeletonBar h="h-4" style={{ width: `${60 + (j * 7) % 40}%` }} />
                    </td>
                  ))}
                </tr>
              ))}

              {/* Error state */}
              {!loading && fetchError && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle size={20} className="text-red-400" />
                      <p className="text-sm font-semibold text-red-500">{fetchError}</p>
                      <Btn variant="secondary" size="sm" onClick={fetchStaff}>Try again</Btn>
                    </div>
                  </td>
                </tr>
              )}

              {/* Empty state */}
              {!loading && !fetchError && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-zinc-400 text-xs font-medium">
                    {search ? 'No staff match your search.' : 'No staff found in your branch.'}
                  </td>
                </tr>
              )}

              {/* Data rows */}
              {!loading && !fetchError && filtered.map(u => (
                <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={u.name} />
                      <span className="font-bold text-slate-800 tracking-tight">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-medium">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${u.role === 'team_leader'
                      ? 'bg-[#6a12b8]08 text-[#6a12b8] border border-[#6a12b8]20'
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}>
                      {u.role === 'team_leader' ? 'Team Leader' : 'Cashier'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <DevicePill deviceNumber={u.device_number} />
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-xs font-bold tabular-nums">{u.lastLogin ?? '—'}</td>
                  <td className="px-6 py-4 text-center"><Badge status={u.status} /></td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0">
                      <button onClick={() => setViewTarget(u)}
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-[#6a12b8] transition-colors" title="View">
                        <Eye size={14} />
                      </button>
                      <button onClick={() => setEditTarget(u)}
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-[#6a12b8] transition-colors" title="Edit">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => setToggleTarget(u)}
                        className={`p-1.5 rounded-lg transition-colors ${u.status === 'ACTIVE' ? 'hover:bg-amber-50 text-slate-400 hover:text-amber-500' : 'hover:bg-emerald-50 text-slate-400 hover:text-emerald-600'}`}
                        title={u.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}>
                        {u.status === 'ACTIVE' ? <Lock size={14} /> : <UserCheck size={14} />}
                      </button>
                      <button onClick={() => setDelTarget(u)}
                        className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors" title="Delete">
                        <Trash2 size={14} />
                      </button>
                      <button
                        onClick={() => setDeviceTarget(u)}
                        className={`p-1.5 rounded-lg transition-colors ${u.device_number
                          ? 'hover:bg-slate-100 text-[#6a12b8] hover:text-[#2a1647]'
                          : 'hover:bg-amber-50 text-amber-500 hover:text-amber-700'
                          }`}
                        title={u.device_number ? `Device: ${u.device_number} — click to change` : 'No device — click to assign'}>
                        <Laptop size={14} />
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
        <StaffFormModal
          onClose={() => setAddOpen(false)}
          onSaved={u => setStaff(p => [u, ...p])}
          branchId={branchId}
        />
      )}
      {viewTarget && (
        <ViewStaffModal onClose={() => setViewTarget(null)} user={viewTarget} />
      )}
      {editTarget && (
        <StaffFormModal
          onClose={() => setEditTarget(null)}
          onSaved={u => { setStaff(p => p.map(x => x.id === u.id ? u : x)); setEditTarget(null); }}
          editingUser={editTarget}
          branchId={branchId}
        />
      )}
      {toggleTarget && (
        <ToggleStatusModal
          onClose={() => setToggleTarget(null)}
          onToggled={u => { setStaff(p => p.map(x => x.id === u.id ? u : x)); setToggleTarget(null); }}
          user={toggleTarget}
        />
      )}
      {delTarget && (
        <DeleteStaffModal
          onClose={() => setDelTarget(null)}
          onDeleted={id => { setStaff(p => p.filter(x => x.id !== id)); setDelTarget(null); }}
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
    </div>
  );
};

export default StaffOverviewPanel;
