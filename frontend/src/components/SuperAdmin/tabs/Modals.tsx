import React from 'react';
import type { Branch } from '../../../services/BranchService';
import type { User }   from '../../../types/user';
import type { BranchFormState } from '../../../hooks/useBranches';
import type { UserForm as UserFormState } from '../../../hooks/useUsers';

// ── Shared primitives ──────────────────────────────────────────────────────

export const ModalOverlay = ({ children }: { children: React.ReactNode }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
    {children}
  </div>
);

export const ModalCloseBtn = ({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) => (
  <button onClick={onClick} disabled={disabled} className="text-zinc-400 hover:text-zinc-600 disabled:opacity-50">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  </button>
);

const inputCls = "w-full px-4 py-2.5 rounded-2xl border border-zinc-200 text-sm font-bold text-[#3b2063] bg-zinc-50 focus:outline-none focus:border-[#3b2063] focus:ring-2 focus:ring-[#3b2063]/10";
const labelCls = "block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1";

const Spinner = () => <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />;

const ErrorAlert = ({ msg }: { msg: string }) => (
  <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
    <p className="text-sm text-red-600">{msg}</p>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════
// BRANCH MODALS
// ═══════════════════════════════════════════════════════════════════════════

interface BranchFormModalProps {
  isOpen: boolean;
  isCreate: boolean;
  formState: BranchFormState;
  setFormState: React.Dispatch<React.SetStateAction<BranchFormState>>;
  loading: boolean;
  error: string | null;
  onSave: () => void;
  onClose: () => void;
}

export const BranchFormModal = ({ isOpen, isCreate, formState, setFormState, loading, error, onSave, onClose }: BranchFormModalProps) => {
  if (!isOpen) return null;
  return (
    <ModalOverlay>
      <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-[#3b2063] uppercase tracking-wider">
            {isCreate ? 'Add Branch' : 'Edit Branch'}
          </h2>
          <ModalCloseBtn onClick={onClose} disabled={loading} />
        </div>

        {error && <ErrorAlert msg={error} />}

        <form onSubmit={(e) => { e.preventDefault(); onSave(); }} className="space-y-4">
          <div>
            <label className={labelCls}>Branch Name</label>
            <input className={inputCls} type="text" required disabled={loading}
              value={formState.name}
              onChange={e => setFormState(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className={labelCls}>Location</label>
            <input className={inputCls} type="text" required disabled={loading}
              value={formState.location}
              onChange={e => setFormState(f => ({ ...f, location: e.target.value }))} />
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <select className={inputCls} disabled={loading}
              value={formState.status}
              onChange={e => setFormState(f => ({ ...f, status: e.target.value as 'active' | 'inactive' }))}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="bg-[#f0ebff] border border-zinc-200 rounded-2xl p-3">
            <p className="text-[10px] font-bold text-zinc-500 leading-relaxed">
              <span className="text-[#3b2063]">💡 Note:</span> Sales totals update automatically via branch triggers.
            </p>
          </div>
          <div className="pt-2 flex justify-end gap-3">
            <button type="button" onClick={onClose} disabled={loading}
              className="px-4 py-2 rounded-2xl border border-zinc-200 text-xs font-bold uppercase text-zinc-500 hover:bg-zinc-50 disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="px-6 py-2 rounded-2xl bg-[#3b2063] text-white text-xs font-black uppercase tracking-widest hover:bg-[#2a174a] disabled:opacity-50 flex items-center gap-2">
              {loading && <Spinner />}
              {isCreate ? 'Create Branch' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </ModalOverlay>
  );
};

// ─────────────────────────────────────────────

const formatCurrency = (n: number) =>
  `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface ViewBranchModalProps {
  branch: Branch | null;
  onClose: () => void;
}

export const ViewBranchModal = ({ branch, onClose }: ViewBranchModalProps) => {
  if (!branch) return null;
  return (
    <ModalOverlay>
      <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-[#3b2063] uppercase tracking-wider">Branch Details</h2>
          <ModalCloseBtn onClick={onClose} />
        </div>
        <div className="space-y-4">
          {[
            { label: 'Branch Name', value: branch.name },
            { label: 'Location',    value: branch.location },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">{label}</p>
              <p className="text-sm font-bold text-[#3b2063]">{value}</p>
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Status</p>
              <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase ${branch.status === 'active' ? 'bg-emerald-100 text-emerald-600' : 'bg-zinc-100 text-zinc-500'}`}>
                {branch.status}
              </span>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Branch ID</p>
              <p className="text-sm font-bold text-[#3b2063]">#{branch.id}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Today's Sales</p>
              <p className="text-lg font-black text-emerald-500">{formatCurrency(Number(branch.today_sales))}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Total Sales</p>
              <p className="text-lg font-black text-[#3b2063]">{formatCurrency(Number(branch.total_sales))}</p>
            </div>
          </div>
        </div>
        <div className="pt-2 flex justify-end">
          <button onClick={onClose} className="px-6 py-2 rounded-2xl bg-[#3b2063] text-white text-xs font-black uppercase tracking-widest hover:bg-[#2a174a]">
            Close
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// USER MODALS
// ═══════════════════════════════════════════════════════════════════════════

interface UserFormModalProps {
  isOpen: boolean;
  editingUser: User | null;
  form: UserFormState;
  setForm: React.Dispatch<React.SetStateAction<UserFormState>>;
  formError: string | null;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export const UserFormModal = ({ isOpen, editingUser, form, setForm, formError, isSubmitting, onSubmit, onClose }: UserFormModalProps) => {
  if (!isOpen) return null;
  return (
    <ModalOverlay>
      <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-[#3b2063] uppercase tracking-wider">
            {editingUser ? 'Edit User' : 'Add User'}
          </h2>
          <ModalCloseBtn onClick={onClose} disabled={isSubmitting} />
        </div>

        {formError && <ErrorAlert msg={formError} />}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className={labelCls}>Full Name</label>
            <input className={inputCls} type="text" required disabled={isSubmitting}
              value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input className={inputCls} type="email" required disabled={isSubmitting}
              value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div>
            <label className={labelCls}>{editingUser ? 'Reset Password (optional)' : 'Password'}</label>
            <input className={inputCls} type="password" disabled={isSubmitting} required={!editingUser}
              placeholder={editingUser ? 'Leave blank to keep current' : 'Set initial password'}
              value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Role</label>
              <select className={inputCls} disabled={isSubmitting}
                value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as User['role'] }))}>
                <option value="superadmin">Super Admin</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select className={inputCls} disabled={isSubmitting}
                value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as User['status'] }))}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>Branch</label>
            <input className={inputCls} type="text" disabled={isSubmitting}
              placeholder="e.g. SM City, Ayala, All Branches"
              value={form.branch} onChange={e => setForm(f => ({ ...f, branch: e.target.value }))} />
          </div>
          <div className="pt-2 flex justify-end gap-3">
            <button type="button" onClick={onClose} disabled={isSubmitting}
              className="px-4 py-2 rounded-2xl border border-zinc-200 text-xs font-bold uppercase text-zinc-500 hover:bg-zinc-50 disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting}
              className="px-6 py-2 rounded-2xl bg-[#3b2063] text-white text-xs font-black uppercase tracking-widest hover:bg-[#2a174a] disabled:opacity-50 flex items-center gap-2">
              {isSubmitting && <Spinner />}
              {editingUser ? 'Save Changes' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </ModalOverlay>
  );
};

// ─────────────────────────────────────────────

interface DeleteUserModalProps {
  user: User | null;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteUserModal = ({ user, loading, onConfirm, onCancel }: DeleteUserModalProps) => {
  if (!user) return null;
  return (
    <ModalOverlay>
      <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-6 space-y-4">
        <h2 className="text-lg font-black text-[#3b2063] uppercase tracking-wider">Delete User</h2>
        <p className="text-sm text-zinc-600">
          Are you sure you want to delete{' '}
          <span className="font-bold text-[#3b2063]">{user.name}</span>?{' '}
          This action cannot be undone.
        </p>
        <div className="pt-2 flex justify-end gap-3">
          <button onClick={onCancel} disabled={loading}
            className="px-4 py-2 rounded-2xl border border-zinc-200 text-xs font-bold uppercase text-zinc-500 hover:bg-zinc-50 disabled:opacity-50">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="px-6 py-2 rounded-2xl bg-red-600 text-white text-xs font-black uppercase tracking-widest hover:bg-red-700 disabled:opacity-50 flex items-center gap-2">
            {loading && <Spinner />}
            Delete
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
};
