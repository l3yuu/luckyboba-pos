import React, { useState, useEffect } from 'react';
import type { Branch } from '../../../services/BranchService';
import type { User }   from '../../../types/user';
import type { BranchFormState } from '../../../hooks/useBranches';
import type { UserForm as UserFormState } from '../../../hooks/useUsers';
import { GitBranch, UserPlus, Edit3, Trash2, X } from 'lucide-react';

// ── Shared primitives ─────────────────────────────────────────────────────────

export const ModalOverlay = ({ children }: { children: React.ReactNode }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
    {children}
  </div>
);

const inputCls = "w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all disabled:opacity-60";
const labelCls = "text-xs font-bold text-gray-600 uppercase tracking-wider";

const Spinner = () => (
  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
);

const ErrorAlert = ({ msg }: { msg: string }) => (
  <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
    <p className="text-sm text-red-600 font-semibold">{msg}</p>
  </div>
);

const CloseBtn = ({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
  >
    <X size={18} />
  </button>
);

// ═══════════════════════════════════════════════════════════════════════════════
// BRANCH MODALS
// ═══════════════════════════════════════════════════════════════════════════════

interface BranchFormModalProps {
  isOpen:       boolean;
  isCreate:     boolean;
  formState:    BranchFormState;
  setFormState: React.Dispatch<React.SetStateAction<BranchFormState>>;
  loading:      boolean;
  error:        string | null;
  onSave:       () => void;
  onClose:      () => void;
}

export const BranchFormModal = ({
  isOpen, isCreate, formState, setFormState, loading, error, onSave, onClose,
}: BranchFormModalProps) => {
  if (!isOpen) return null;
  return (
    <ModalOverlay>
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isCreate ? 'bg-violet-100 text-violet-600' : 'bg-blue-50 text-blue-600'
            }`}>
              <GitBranch size={16} />
            </div>
            <div>
              <h2 className="text-base font-black text-[#3b2063]">
                {isCreate ? 'Add Branch' : 'Edit Branch'}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {isCreate ? 'Register a new branch location' : 'Update branch details'}
              </p>
            </div>
          </div>
          <CloseBtn onClick={onClose} disabled={loading} />
        </div>

        {error && <ErrorAlert msg={error} />}

        <form onSubmit={(e) => { e.preventDefault(); onSave(); }} className="space-y-4">
          <div className="space-y-1.5">
            <label className={labelCls}>Branch Name</label>
            <input
              className={inputCls} type="text" required disabled={loading}
              placeholder="e.g. Lucky Boba – SM City"
              value={formState.name}
              onChange={e => setFormState((f: BranchFormState) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <label className={labelCls}>Location</label>
            <input
              className={inputCls} type="text" required disabled={loading}
              placeholder="e.g. SM City Cebu"
              value={formState.location}
              onChange={e => setFormState((f: BranchFormState) => ({ ...f, location: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <label className={labelCls}>Status</label>
            <select
              className={inputCls} disabled={loading}
              value={formState.status}
              onChange={e => setFormState((f: BranchFormState) => ({ ...f, status: e.target.value as 'active' | 'inactive' }))}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={loading}
              className="flex-1 bg-white border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-50 disabled:opacity-50 transition-all">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-violet-600 hover:bg-violet-700 text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 transition-all">
              {loading && <Spinner />}
              {isCreate ? 'Create Branch' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </ModalOverlay>
  );
};

// ── View Branch Modal ─────────────────────────────────────────────────────────

const formatCurrency = (n: number) =>
  `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface ViewBranchModalProps {
  branch:  Branch | null;
  onClose: () => void;
}

export const ViewBranchModal = ({ branch, onClose }: ViewBranchModalProps) => {
  if (!branch) return null;
  return (
    <ModalOverlay>
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-4">

        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <h2 className="text-base font-black text-[#3b2063]">Branch Details</h2>
          <CloseBtn onClick={onClose} />
        </div>

        <div className="space-y-4">
          {([
            { label: 'Branch Name', value: branch.name },
            { label: 'Location',    value: branch.location },
          ] as { label: string; value: string }[]).map(({ label, value }) => (
            <div key={label}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">{label}</p>
              <p className="text-sm font-bold text-[#3b2063]">{value}</p>
            </div>
          ))}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Status</p>
              <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                branch.status === 'active' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-500'
              }`}>
                {branch.status}
              </span>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Branch ID</p>
              <p className="text-sm font-bold text-[#3b2063]">#{branch.id}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Today's Sales</p>
              <p className="text-lg font-black text-emerald-500">{formatCurrency(Number(branch.today_sales))}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Total Sales</p>
              <p className="text-lg font-black text-[#3b2063]">{formatCurrency(Number(branch.total_sales))}</p>
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 transition-all">
            Close
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// USER MODALS
// ═══════════════════════════════════════════════════════════════════════════════

interface UserFormModalProps {
  isOpen:       boolean;
  editingUser:  User | null;
  form:         UserFormState;
  setForm:      React.Dispatch<React.SetStateAction<UserFormState>>;
  formError:    string | null;
  isSubmitting: boolean;
  onSubmit:     (e: React.FormEvent) => void;
  onClose:      () => void;
}

export const UserFormModal = ({
  isOpen, editingUser, form, setForm, formError, isSubmitting, onSubmit, onClose,
}: UserFormModalProps) => {
  const [branches, setBranches]               = useState<{ id: number; name: string }[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const fetchBranches = async () => {
      setLoadingBranches(true);
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/branches`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('auth_token') || localStorage.getItem('lucky_boba_token') || ''}`,
              Accept: 'application/json',
            },
          }
        );
        const data = await res.json();
        setBranches(Array.isArray(data) ? data : (data.data ?? []));
      } catch {
        setBranches([]);
      } finally {
        setLoadingBranches(false);
      }
    };
    fetchBranches();
  }, [isOpen]);

  if (!isOpen) return null;

  const isEdit = !!editingUser;

  return (
    <ModalOverlay>
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isEdit ? 'bg-blue-50 text-blue-600' : 'bg-violet-100 text-violet-600'
            }`}>
              {isEdit ? <Edit3 size={16} /> : <UserPlus size={16} />}
            </div>
            <div>
              <h2 className="text-base font-black text-[#3b2063]">
                {isEdit ? 'Edit User' : 'Add New User'}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {isEdit ? `Updating account for ${editingUser?.name}` : 'Create a new user account'}
              </p>
            </div>
          </div>
          <CloseBtn onClick={onClose} disabled={isSubmitting} />
        </div>

        {formError && <ErrorAlert msg={formError} />}

        <form onSubmit={onSubmit} className="space-y-4">

          {/* Name */}
          <div className="space-y-1.5">
            <label className={labelCls}>Full Name</label>
            <input className={inputCls} type="text" required disabled={isSubmitting}
              placeholder="e.g. Juan dela Cruz"
              value={form.name}
              onChange={e => setForm((f: UserFormState) => ({ ...f, name: e.target.value }))}
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className={labelCls}>Email Address</label>
            <input className={inputCls} type="email" required disabled={isSubmitting}
              placeholder="e.g. juan@luckyboba.com"
              value={form.email}
              onChange={e => setForm((f: UserFormState) => ({ ...f, email: e.target.value }))}
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className={labelCls}>
              {isEdit ? 'Reset Password' : 'Password'}
              {isEdit && <span className="ml-1 text-gray-300 font-normal normal-case tracking-normal">(optional)</span>}
            </label>
            <input className={inputCls} type="password" disabled={isSubmitting}
              required={!isEdit}
              placeholder={isEdit ? 'Leave blank to keep current' : 'Set initial password'}
              value={form.password}
              onChange={e => setForm((f: UserFormState) => ({ ...f, password: e.target.value }))}
            />
          </div>

          {/* Role + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className={labelCls}>Role</label>
              <select className={inputCls} disabled={isSubmitting}
                value={form.role}
                onChange={e => setForm((f: UserFormState) => ({ ...f, role: e.target.value as User['role'] }))}>
                <option value="branch_manager">Branch Manager</option>
                <option value="cashier">Cashier</option>
                <option value="customer">Customer</option>
                <option value="superadmin">Super Admin</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Status</label>
              <select className={inputCls} disabled={isSubmitting}
                value={form.status}
                onChange={e => setForm((f: UserFormState) => ({ ...f, status: e.target.value as User['status'] }))}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          {/* Branch */}
          <div className="space-y-1.5">
            <label className={labelCls}>Branch</label>
            <select className={inputCls} disabled={isSubmitting || loadingBranches}
              value={form.branch}
              onChange={e => setForm((f: UserFormState) => ({ ...f, branch: e.target.value }))}>
              <option value="">
                {loadingBranches ? 'Loading branches…' : '— Select Branch —'}
              </option>
              {branches.map(b => (
                <option key={b.id} value={b.name}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={isSubmitting}
              className="flex-1 bg-white border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-50 disabled:opacity-50 transition-all">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting}
              className="flex-1 bg-violet-600 hover:bg-violet-700 text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 transition-all">
              {isSubmitting && <Spinner />}
              {isEdit ? 'Save Changes' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </ModalOverlay>
  );
};

// ── Delete User Modal ─────────────────────────────────────────────────────────

interface DeleteUserModalProps {
  user:      User | null;
  loading:   boolean;
  onConfirm: () => void;
  onCancel:  () => void;
}

export const DeleteUserModal = ({ user, loading, onConfirm, onCancel }: DeleteUserModalProps) => {
  if (!user) return null;
  return (
    <ModalOverlay>
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center">

        <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-4 bg-red-100 text-red-600">
          <Trash2 size={24} />
        </div>

        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-black shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-bold text-gray-700">{user.name}</span>
        </div>

        <h3 className="text-base font-black text-gray-900 mb-1">Delete this user?</h3>
        <p className="text-gray-400 text-sm mb-5">
          This will permanently remove{' '}
          <span className="font-semibold text-gray-600">{user.name}</span>'s account.
          This action cannot be undone.
        </p>

        <div className="flex gap-3">
          <button onClick={onCancel} disabled={loading}
            className="flex-1 bg-white border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-50 disabled:opacity-50 transition-all">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all">
            {loading && <Spinner />}
            Delete
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
};

export default { ModalOverlay, UserFormModal, DeleteUserModal, ViewBranchModal, BranchFormModal };
