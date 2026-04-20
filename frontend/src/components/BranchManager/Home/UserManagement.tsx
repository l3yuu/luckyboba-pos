import React, { useState, useEffect, useCallback } from 'react';
import { 
  MonitorCheck, MonitorOff, Mail, MapPin, Users, Plus, 
  AlertCircle, Lock, Laptop, CheckCircle, Search, 
  UserCheck, XCircle, Eye, Edit2, Trash2 
} from 'lucide-react';
import api from '../../../services/api';
import { StatCard, Button as Btn, ModalShell, Badge, ConfirmModal, AlertBox } from "../SharedUI";

// ─── Types ────────────────────────────────────────────────────────────────────


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
  role:            string;
  manager_pin:     string;
  manager_pin_confirmation: string;
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


// ─── Helpers ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapUser = (u: any): User => ({
  id:             u.id,
  name:           u.name,
  email:          u.email,
  role:           String(u.role ?? '').trim().toLowerCase(),
  branch:         u.branch?.name ?? u.branch ?? u.branch_name ?? '—',
  branch_id:      (() => {
    const raw = u.branch_id ?? u.branch?.id ?? null;
    if (raw == null || raw === '') return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  })(),
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
  name: '',
  email: '',
  password: '',
  passwordConfirm: '',
  status: 'ACTIVE',
  role: 'cashier',
  manager_pin: '',
  manager_pin_confirmation: '',
});

const Avatar: React.FC<{ name: string; size?: string }> = ({ name, size = 'w-7 h-7 text-[10px]' }) => (
  <div className={`${size} rounded-full bg-[#ede8ff] flex items-center justify-center font-bold text-[#3b2063] shrink-0`}>
    {name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
  </div>
);

// Inline device pill shown in the table row
const DevicePill: React.FC<{ deviceNumber?: string | null }> = ({ deviceNumber }) =>
  deviceNumber ? (
    <span className="inline-flex items-center gap-1 text-[9px] font-black bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-widest">
      <MonitorCheck size={9} />{deviceNumber}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[9px] font-black bg-zinc-50 text-zinc-400 border border-zinc-100 px-2 py-0.5 rounded-full uppercase tracking-widest">
      <MonitorOff size={9} />None
    </span>
  );

// ─── Field helpers ────────────────────────────────────────────────────────────

// ─── Field helpers ────────────────────────────────────────────────────────────

const Field: React.FC<{ label: string; required?: boolean; error?: string; children: React.ReactNode }> = ({ label, required, error, children }) => (
  <div>
    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1.5 block">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    {children}
    {error && <p className="text-[10px] text-red-500 mt-1 font-bold">{error}</p>}
  </div>
);

const inputCls = (err?: string) =>
  `w-full text-xs font-bold text-zinc-700 bg-white border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-violet-400/20 focus:border-violet-400 transition-all shadow-sm ${err ? 'border-red-300 bg-red-50' : 'border-zinc-200'}`;

// ─── View Modal ───────────────────────────────────────────────────────────────

const ViewUserModal: React.FC<{ onClose: () => void; user: User }> = ({ onClose, user }) => {
  const rows: [string, React.ReactNode][] = [
    ['User ID',    `#${user.id}`],
    ['Name',       <div className="flex items-center gap-2 font-bold text-[#1a0f2e]"><Avatar name={user.name} />{user.name}</div>],
    ['Email',      <span className="flex items-center gap-1 font-bold text-[#1a0f2e]"><Mail size={11} />{user.email}</span>],
    ['Branch',     <span className="flex items-center gap-1 font-bold text-[#1a0f2e]"><MapPin size={11} />{user.branch}</span>],
    ['Status',     <Badge status={user.status} />],
    ['Last Login', <span className="font-bold tabular-nums text-[#1a0f2e]">{user.lastLogin ?? '—'}</span>],
    ['Device',     user.device_number
      ? <span className="text-[9px] font-black bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-widest"><MonitorCheck size={9} />{user.device_number}</span>
      : <span className="text-[9px] font-black bg-zinc-100 text-zinc-400 border border-zinc-200 px-2 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-widest"><MonitorOff size={9} />No device</span>],
  ];
  return (
    <ModalShell 
      onClose={onClose} 
      title={user.name} 
      sub="Review staff member authentication & device mapping" 
      icon={<Users size={18} className="text-[#3b2063]" />}
      footer={<Btn variant="secondary" onClick={onClose} className="w-full justify-center">Close Profile</Btn>}
    >
      <div className="flex flex-col divide-y divide-zinc-50">
        {rows.map(([label, val]) => (
          <div key={label} className="flex items-center justify-between py-3">
            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">{label}</span>
            <div className="text-right">{val}</div>
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
  const [form, setForm] = useState<FormState>(
    editingUser
      ? {
          name: editingUser.name,
          email: editingUser.email,
          password: '',
          passwordConfirm: '',
          status: editingUser.status,
          role: editingUser.role,
          manager_pin: '',
          manager_pin_confirmation: '',
        }
      : blankForm()
  );
  const [errors,   setErrors]   = useState<Record<string, string>>({});
  const [saving,   setSaving]   = useState(false);
  const [apiError, setApiError] = useState('');

  const PIN_ROLES = ['team_leader', 'supervisor'];
  const showPin = PIN_ROLES.includes(form.role) && (!editingUser || !editingUser.has_pin);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim())  e.name  = 'Name is required.';
    if (!form.email.trim()) e.email = 'Email is required.';
    if (!editingUser && !form.password) e.password = 'Password is required.';
    if (form.password && form.password.length < 6) e.password = 'Password must be at least 6 characters.';
    if (form.password && form.password !== form.passwordConfirm) e.passwordConfirm = 'Passwords do not match.';
    if (showPin) {
      if (!form.manager_pin.trim()) e.manager_pin = 'PIN is required for this role.';
      else if (!/^\d{4,8}$/.test(form.manager_pin)) e.manager_pin = 'PIN must be 4–8 digits.';
      if (form.manager_pin !== form.manager_pin_confirmation)
        e.manager_pin_confirmation = 'PINs do not match.';
    }
    return e;
  };

const handleSubmit = async () => {
  const e = validate();
  if (Object.keys(e).length) { setErrors(e); return; }
  setSaving(true); setApiError('');
  try {
    if (editingUser) {
      const payload: Record<string, string | number | boolean | null> = {
        name:      form.name,
        email:     form.email,
        role:      form.role,
        status:    form.status,
        branch_id: branchId,
      };
      if (form.password) {
        payload.password              = form.password;
        payload.password_confirmation = form.passwordConfirm;
      }
      if (showPin) {
        payload.manager_pin = form.manager_pin;
        payload.manager_pin_confirmation = form.manager_pin_confirmation;
      }
      const res = await api.put(`/users/${editingUser.id}`, payload);
      onSaved(mapUser(res.data?.data ?? res.data));
    } else {
      const createPayload: Record<string, string | number | boolean | null> = {
        name:                  form.name,
        email:                 form.email,
        password:              form.password,
        password_confirmation: form.passwordConfirm,
        role:                  form.role,      // ← was hardcoded 'cashier'
        status:                form.status,
        branch_id:             branchId,
      };
      if (showPin) {
        createPayload.manager_pin = form.manager_pin;
        createPayload.manager_pin_confirmation = form.manager_pin_confirmation;
      }
      const res = await api.post('/users', createPayload);
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
      setForm((p: FormState) => ({ ...p, [key]: ev.target.value }));
      setErrors((prev: Record<string, string>) => { const n = { ...prev }; delete n[key]; return n; });
    },
  });

  return (
    <ModalShell
      onClose={onClose}
      title={editingUser ? 'Edit Staff Account' : 'Register New Staff'}
      sub={editingUser ? `Updating credentials for ${editingUser.name}` : 'Provision access for branch cashiers or supervisors'}
      icon={<Users size={18} className="text-[#3b2063]" />}
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Btn variant="secondary" onClick={onClose} disabled={saving}>Cancel</Btn>
          <Btn onClick={handleSubmit} disabled={saving} className="min-w-[120px] justify-center">
            {saving
              ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : editingUser ? 'Save Profile' : <><Plus size={14} /> Create Staff</>}
          </Btn>
        </div>
      }>
      <div className="space-y-4">
        {apiError && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg shadow-sm">
            <AlertCircle size={14} className="text-red-500 shrink-0" />
            <p className="text-[11px] text-red-600 font-bold">{apiError}</p>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Full Name" required error={errors.name}>
            <input {...f('name')} placeholder="Juan Dela Cruz" className={inputCls(errors.name)} />
          </Field>
          <Field label="Role Selection" required>
            <select {...f('role')} className={inputCls()}>
              <option value="cashier">Cashier</option>
              <option value="team_leader">Team Leader</option>
              <option value="supervisor">Supervisor</option>
            </select>
          </Field>
        </div>
        <Field label="Email Address" required error={errors.email}>
          <input {...f('email')} type="email" placeholder="juan@luckyboba.com" className={inputCls(errors.email)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={editingUser ? 'Reset Password' : 'Password'} required={!editingUser} error={errors.password}>
            <input {...f('password')} type="password" placeholder="••••••••" className={inputCls(errors.password)} />
          </Field>
          <Field label="Verify Password" error={errors.passwordConfirm}>
            <input {...f('passwordConfirm')} type="password" placeholder="••••••••" className={inputCls(errors.passwordConfirm)} />
          </Field>
        </div>
        <Field label="Account Status" required>
          <select {...f('status')} className={inputCls()}>
            <option value="ACTIVE">System Access Granted</option>
            <option value="INACTIVE">Access Suspended</option>
          </select>
        </Field>
        {showPin && (
          <div className="p-4 bg-violet-50/50 border border-violet-100 rounded-xl space-y-3 shadow-inner">
            <div className="flex items-center gap-2">
              <Lock size={14} className="text-[#3b2063]" />
              <p className="text-[9px] font-black uppercase tracking-widest text-[#3b2063]">Elevated Manager PIN</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Secure PIN" required error={errors.manager_pin}>
                <input
                  {...f('manager_pin')}
                  type="password"
                  inputMode="numeric"
                  placeholder="4–8 digits"
                  maxLength={8}
                  className={inputCls(errors.manager_pin)}
                />
              </Field>
              <Field label="Verify PIN" required error={errors.manager_pin_confirmation}>
                <input
                  {...f('manager_pin_confirmation')}
                  type="password"
                  inputMode="numeric"
                  placeholder="Re-enter PIN"
                  maxLength={8}
                  className={inputCls(errors.manager_pin_confirmation)}
                />
              </Field>
            </div>
          </div>
        )}
        {!editingUser && (
          <div className="flex items-center gap-2.5 p-3 bg-zinc-50 border border-zinc-100 rounded-lg italic">
            <Laptop size={14} className="text-zinc-400 shrink-0" />
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">
              POS devices can be linked after profile creation.
            </p>
          </div>
        )}
      </div>
    </ModalShell>
  );
};

// ─── Toggle Status Modal ──────────────────────────────────────────────────────

const ToggleStatusModal: React.FC<{
  onClose:   () => void;
  onToggled: (u: User) => void;
  user:      User;
}> = ({ onClose, onToggled, user }) => (
  <ConfirmModal
    show={true}
    cancel={onClose}
    action={async () => {
      const res = await api.patch(`/users/${user.id}/toggle-status`);
      onToggled(mapUser(res.data?.data ?? res.data));
    }}
    title={user.status === 'ACTIVE' ? 'Suspend Access?' : 'Restore Access?'}
    desc={`Are you sure you want to ${user.status === 'ACTIVE' ? 'deactivate' : 'activate'} ${user.name}'s system credentials?`}
    danger={user.status === 'ACTIVE'}
  />
);

// ─── Delete Modal ─────────────────────────────────────────────────────────────

const DeleteUserModal: React.FC<{
  onClose:   () => void;
  onDeleted: (id: number) => void;
  user:      User;
}> = ({ onClose, onDeleted, user }) => (
  <ConfirmModal
    show={true}
    cancel={onClose}
    action={async () => {
      await api.delete(`/users/${user.id}`);
      onDeleted(user.id);
    }}
    title="Terminate Account?"
    desc={`Are you certain you want to permanently delete ${user.name}? This action cannot be reversed.`}
    danger={true}
  />
);

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

  const currentDevice = devices.find((d: PosDevice) => d.user_id === user.id);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res  = await api.get('/pos-devices');
        const list: PosDevice[] = res.data?.data ?? res.data?.devices ?? [];
        setDevices(list.filter(d => d.status === 'ACTIVE'));
        const assigned = list.find(d => d.user_id === user.id);
        if (assigned) setSelectedId(String(assigned.id));
      } catch { setApiError('Failed to load available devices.'); }
      finally { setLoading(false); }
    })();
  }, [user.id]);

  const handleAssign = async () => {
    if (!selectedId) return;
    setSaving(true); setApiError('');
    try {
      await api.patch(`/pos-devices/${selectedId}/assign`, { user_id: user.id });
      const assignedDevice = devices.find((d: PosDevice) => String(d.id) === selectedId);
      onAssigned?.(user.id, assignedDevice?.id ?? null, assignedDevice?.pos_number ?? null);
      setSuccess(true); setTimeout(onClose, 1500);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setApiError(msg ?? 'Failed to map device.');
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
      setApiError(msg ?? 'Failed to release device.');
    } finally { setSaving(false); }
  };

  return (
    <ModalShell
      onClose={onClose}
      title="Hardware Mapping"
      sub={`Select a POS terminal to link with ${user.name}`}
      icon={<Laptop size={18} className="text-[#3b2063]" />}
      footer={
        !success && (
          <div className="flex items-center justify-end gap-2 w-full">
            <Btn variant="secondary" onClick={onClose} disabled={saving}>Cancel</Btn>
            {currentDevice && (
              <Btn variant="danger" onClick={handleUnassign} disabled={saving || loading} className="shadow-lg shadow-red-100">
                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><MonitorOff size={14} /> Release</>}
              </Btn>
            )}
            <Btn onClick={handleAssign} disabled={saving || loading || !selectedId} className="shadow-lg shadow-purple-100">
              {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><MonitorCheck size={14} /> Map Device</>}
            </Btn>
          </div>
        )
      }>
      <div className="space-y-4">
        {success ? (
          <div className="flex flex-col items-center py-6 gap-3">
            <div className="w-14 h-14 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center shadow-inner">
              <CheckCircle size={28} className="text-emerald-500" />
            </div>
            <div className="text-center">
              <p className="text-sm font-black text-[#1a0f2e]">Hardware Sync Complete</p>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Cashier is now linked to terminal</p>
            </div>
          </div>
        ) : (
          <>
            {apiError && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2">
                <AlertCircle size={14} className="text-red-500 shrink-0" />
                <p className="text-[11px] text-red-600 font-bold">{apiError}</p>
              </div>
            )}

            <div className="flex items-center gap-3 p-3.5 bg-zinc-50 border border-zinc-100 rounded-xl shadow-inner">
              <Avatar name={user.name} size="w-9 h-9 text-xs" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-[#1a0f2e] truncate">{user.name}</p>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{user.role}</p>
              </div>
              <DevicePill deviceNumber={user.device_number} />
            </div>

            <Field label="Target Terminal" required>
              {loading ? (
                <div className="h-10 bg-zinc-100 rounded-lg animate-pulse" />
              ) : (
                <select value={selectedId} onChange={e => setSelectedId(e.target.value)} className={inputCls()}>
                  <option value="">— Choose a Terminal —</option>
                  {devices.map((d: PosDevice) => (
                    <option key={d.id} value={String(d.id)}>
                      {d.pos_number} {d.user_id && d.user_id !== user.id ? `(mapped to ${d.user?.name ?? 'other'})` : d.user_id === user.id ? '(current)' : '(ready)'}
                    </option>
                  ))}
                </select>
              )}
            </Field>

            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-tighter leading-tight italic">
              * Active devices only. Re-mapping will automatically unassign the terminal from its previous user.
            </p>
          </>
        )}
      </div>
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
      const myBranchId: number | null = (() => {
        const raw = me?.branch_id ?? null;
        if (raw == null || raw === '') return null;
        const n = Number(raw);
        return Number.isFinite(n) ? n : null;
      })();
      setBranchId(myBranchId);

      const [usersRes] = await Promise.all([
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
        .filter(u => u.role === 'cashier' || u.role === 'team_leader' || u.role === 'supervisor');

      // Branch Manager should only see staff for their own branch
      const branchScoped = myBranchId == null
        ? list
        : list.filter(u => u.branch_id === myBranchId);

      setUsers(branchScoped);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setFetchError(msg ?? 'Failed to load staff.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Update device info in local state after assign/unassign — no full refetch needed
  const handleDeviceAssigned = (userId: number, deviceId: number | null, deviceNumber: string | null) => {
    setUsers((prev: User[]) => prev.map((u: User) =>
      u.id === userId ? { ...u, device_id: deviceId, device_number: deviceNumber } : u
    ));
  };

  const filtered = users.filter((u: User) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount   = users.filter((u: User) => u.status === 'ACTIVE').length;
  const inactiveCount = users.filter((u: User) => u.status !== 'ACTIVE').length;

  return (
    <div className="p-6 md:p-8 space-y-6 fade-in pb-20">
      <style>{`
        .fade-in { animation: fadeIn 0.3s ease-out forwards; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1a0f2e]">Staff Management</h1>
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mt-1">Manage cashier permissions & terminal assignments</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group min-w-[280px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-[#3b2063] transition-colors" size={14} />
            <input
              type="text"
              placeholder="Search by name, email, or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-violet-400/10 focus:border-violet-400 transition-all shadow-sm"
            />
          </div>
          <Btn onClick={() => setAddOpen(true)} className="px-5 py-2.5 rounded-xl shadow-lg shadow-purple-100">
            <Plus size={14} /> <span className="ml-1">Add Staff</span>
          </Btn>
        </div>
      </div>

      {fetchError && (
        <AlertBox 
          type="error" 
          message={fetchError} 
          icon={<AlertCircle size={14} />} 
        />
      )}

      {/* ── Stat Rows ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard
          icon={<Users size={18} />}
          label="Total Staff"
          value={loading ? '—' : users.length}
          sub="Local Team"
          color="violet"
        />
        <StatCard
          icon={<UserCheck size={18} />}
          label="Active Accounts"
          value={loading ? '—' : activeCount}
          sub="System Access"
          color="emerald"
        />
        <StatCard
          icon={<XCircle size={18} />}
          label="Suspended"
          value={loading ? '—' : inactiveCount}
          sub="Restricted Access"
          color="amber"
        />
      </div>

      {/* ── Table ── */}
      <div className="bg-white border border-zinc-200 rounded-[1rem] overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-zinc-50 flex items-center justify-between bg-zinc-50/30">
          <h3 className="text-[11px] font-black text-[#1a0f2e] uppercase tracking-wide">Branch Staff Directory</h3>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded border border-emerald-100 text-[9px] font-black uppercase tracking-widest leading-none">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live System
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-zinc-50/20 text-left border-b border-zinc-50">
                <th className="px-6 py-3 text-[9px] font-black text-zinc-400 uppercase tracking-widest">Profile</th>
                <th className="px-6 py-3 text-[9px] font-black text-zinc-400 uppercase tracking-widest text-center">Permissions</th>
                <th className="px-6 py-3 text-[9px] font-black text-zinc-400 uppercase tracking-widest text-center">Terminal</th>
                <th className="px-6 py-3 text-[9px] font-black text-zinc-400 uppercase tracking-widest text-center">Integrity</th>
                <th className="px-6 py-3 text-[9px] font-black text-zinc-400 uppercase tracking-widest text-center">Last Active</th>
                <th className="px-6 py-3 text-[9px] font-black text-zinc-400 uppercase tracking-widest text-right">Activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-4"><div className="h-4 bg-zinc-50 rounded" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3 opacity-40">
                      <Users size={48} strokeWidth={1} />
                      <p className="text-xs font-black uppercase tracking-widest">No matching staff found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-zinc-50/50 transition-colors group">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.name} />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#1a0f2e] group-hover:text-[#3b2063] transition-colors">{u.name}</p>
                          <p className="text-[10px] font-bold text-zinc-400 truncate tracking-tight">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${
                        u.role === 'cashier' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                        u.role === 'team_leader' ? 'bg-violet-50 text-violet-600 border-violet-100' :
                        'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <DevicePill deviceNumber={u.device_number} />
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <Badge status={u.status} />
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <p className="text-[10px] font-bold text-zinc-500 tracking-tight">{u.lastLogin || 'Never'}</p>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setViewTarget(u)} className="p-1.5 hover:bg-violet-50 text-zinc-400 hover:text-violet-600 rounded-lg" title="View Details">
                          <Eye size={14} />
                        </button>
                        <button onClick={() => setDeviceTarget(u)} className="p-1.5 hover:bg-violet-50 text-zinc-400 hover:text-violet-600 rounded-lg" title="Hardware Sync">
                          <Laptop size={14} />
                        </button>
                        <button onClick={() => setEditTarget(u)} className="p-1.5 hover:bg-violet-50 text-zinc-400 hover:text-violet-600 rounded-lg" title="Edit Profile">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => setToggleTarget(u)} className="p-1.5 hover:bg-amber-50 text-zinc-400 hover:text-amber-600 rounded-lg" title={u.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}>
                          {u.status === 'ACTIVE' ? <Lock size={14} /> : <UserCheck size={14} />}
                        </button>
                        <button onClick={() => setDelTarget(u)} className="p-1.5 hover:bg-red-50 text-zinc-400 hover:text-red-500 rounded-lg" title="Terminate Account">
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

      {/* ── Modals ── */}
      {addOpen && (
        <CashierFormModal onClose={() => setAddOpen(false)} onSaved={(u: User) => setUsers((p: User[]) => [u, ...p])} branchId={branchId} />
      )}
      {viewTarget && (
        <ViewUserModal onClose={() => setViewTarget(null)} user={viewTarget} />
      )}
      {editTarget && (
        <CashierFormModal
          onClose={() => setEditTarget(null)}
          onSaved={(u: User) => { setUsers((p: User[]) => p.map((x: User) => x.id === u.id ? u : x)); setEditTarget(null); }}
          editingUser={editTarget}
          branchId={branchId}
        />
      )}
      {toggleTarget && (
        <ToggleStatusModal
          onClose={() => setToggleTarget(null)}
          onToggled={(u: User) => { setUsers((p: User[]) => p.map((x: User) => x.id === u.id ? u : x)); setToggleTarget(null); }}
          user={toggleTarget}
        />
      )}
      {delTarget && (
        <DeleteUserModal
          onClose={() => setDelTarget(null)}
          onDeleted={(id: number) => { setUsers((p: User[]) => p.filter((x: User) => x.id !== id)); setDelTarget(null); }}
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

export default UserManagement;