import React, { useState } from 'react';
import type { User, CreateUserData, UpdateUserData } from '../../../types/user';

interface UsersTabProps {
  users: User[];
  loading: boolean;
  error: string | null;
  onCreate: (data: CreateUserData) => Promise<User>;
  onUpdate: (id: number, data: UpdateUserData) => Promise<User>;
  onDelete: (id: number) => Promise<void>;
  onRefresh: () => void;
}

type UserFormState = {
  name: string;
  email: string;
  role: User['role'];
  branch: string;
  status: User['status'];
  password: string;
};

const emptyForm: UserFormState = {
  name: '',
  email: '',
  role: 'manager',
  branch: '',
  status: 'ACTIVE',
  password: '',
};

const UsersTab: React.FC<UsersTabProps> = ({ 
  users, 
  loading, 
  error, 
  onCreate, 
  onUpdate, 
  onDelete, 
  onRefresh 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState<UserFormState>(emptyForm);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openCreate = () => {
    setEditingUser(null);
    setForm(emptyForm);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setForm({
      name: user.name,
      email: user.email,
      role: user.role,
      branch: user.branch || '',
      status: user.status,
      password: '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      const trimmedPassword = form.password.trim();

      if (editingUser) {
        const updateData: UpdateUserData = {
          name: form.name,
          email: form.email,
          role: form.role,
          branch: form.branch,
          status: form.status,
        };
        
        if (trimmedPassword) {
          updateData.password = trimmedPassword;
        }

        await onUpdate(editingUser.id, updateData);
      } else {
        if (!trimmedPassword) {
          setFormError('Password is required for new users.');
          setIsSubmitting(false);
          return;
        }

        const createData: CreateUserData = {
          name: form.name,
          email: form.email,
          password: trimmedPassword,
          role: form.role,
          branch: form.branch || undefined,
          status: form.status,
        };

        await onCreate(createData);
      }

      setIsModalOpen(false);
      setForm(emptyForm);
    } catch (err: unknown) {
      setFormError((err instanceof Error ? err.message : 'An error occurred') || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    try {
      await onDelete(userToDelete.id);
      setUserToDelete(null);
    } catch (err: unknown) {
      alert((err instanceof Error ? err.message : 'Failed to delete user') || 'Failed to delete user');
    }
  };

  return (
    <section className="flex-1 px-6 md:px-10 pb-10 overflow-auto">
      {/* Error Alert */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between">
          <p className="text-sm text-red-600">{error}</p>
          <button onClick={onRefresh} className="text-xs font-bold text-red-600 hover:text-red-700 uppercase">
            Retry
          </button>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <p className="text-[12px] font-black uppercase tracking-[0.2em] text-zinc-400">
            {users.length} Users
          </p>
          {loading && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-[#3b2063] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-zinc-400">Loading...</span>
            </div>
          )}
        </div>
        <button
          onClick={openCreate}
          disabled={loading}
          className="bg-[#3b2063] text-white px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-wider hover:bg-[#2a174a] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          + Add User
        </button>
      </div>

      <div className="rounded-[1.5rem] border border-zinc-100 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#f8f6ff]">
                <th className="text-left px-6 py-4 text-[11px] font-black uppercase tracking-wider text-zinc-400">User</th>
                <th className="text-left px-6 py-4 text-[11px] font-black uppercase tracking-wider text-zinc-400">Role</th>
                <th className="text-left px-6 py-4 text-[11px] font-black uppercase tracking-wider text-zinc-400">Branch</th>
                <th className="text-left px-6 py-4 text-[11px] font-black uppercase tracking-wider text-zinc-400">Status</th>
                <th className="text-right px-6 py-4 text-[11px] font-black uppercase tracking-wider text-zinc-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-zinc-100 hover:bg-[#f8f6ff] transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-bold text-[#3b2063]">{user.name}</p>
                      <p className="text-xs text-zinc-400">{user.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                        user.role === 'superadmin'
                          ? 'bg-[#fbbf24] text-[#3b2063]'
                          : user.role === 'admin'
                          ? 'bg-[#f0ebff] text-[#3b2063]'
                          : 'bg-zinc-100 text-zinc-600'
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-600">{user.branch || '-'}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                        user.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-600'
                          : 'bg-zinc-100 text-zinc-500'
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-3">
                    <button
                      onClick={() => openEdit(user)}
                      disabled={loading}
                      className="text-[#3b2063] hover:text-[#2a174a] font-bold text-xs uppercase disabled:opacity-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(user)}
                      disabled={loading}
                      className="text-red-500 hover:text-red-700 font-bold text-xs uppercase disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-400">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-black text-[#3b2063] uppercase tracking-wider">
                {editingUser ? 'Edit User' : 'Add User'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
                className="text-zinc-400 hover:text-zinc-600 disabled:opacity-50"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-600">{formError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-2xl border border-zinc-200 text-sm font-bold text-[#3b2063] bg-zinc-50 focus:outline-none focus:border-[#3b2063] focus:ring-2 focus:ring-[#3b2063]/10"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-2xl border border-zinc-200 text-sm font-bold text-[#3b2063] bg-zinc-50 focus:outline-none focus:border-[#3b2063] focus:ring-2 focus:ring-[#3b2063]/10"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
                  {editingUser ? 'Reset Password (optional)' : 'Password'}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, password: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 rounded-2xl border border-zinc-200 text-sm font-bold text-[#3b2063] bg-zinc-50 focus:outline-none focus:border-[#3b2063] focus:ring-2 focus:ring-[#3b2063]/10"
                  placeholder={editingUser ? 'Leave blank to keep current password' : 'Set initial password'}
                  disabled={isSubmitting}
                  required={!editingUser}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
                    Role
                  </label>
                  <select
                    value={form.role}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, role: e.target.value as User['role'] }))
                    }
                    className="w-full px-4 py-2.5 rounded-2xl border border-zinc-200 text-sm font-bold text-[#3b2063] bg-zinc-50 focus:outline-none focus:border-[#3b2063] focus:ring-2 focus:ring-[#3b2063]/10"
                    disabled={isSubmitting}
                  >
                    <option value="superadmin">Super Admin</option>
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, status: e.target.value as User['status'] }))
                    }
                    className="w-full px-4 py-2.5 rounded-2xl border border-zinc-200 text-sm font-bold text-[#3b2063] bg-zinc-50 focus:outline-none focus:border-[#3b2063] focus:ring-2 focus:ring-[#3b2063]/10"
                    disabled={isSubmitting}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
                  Branch
                </label>
                <input
                  type="text"
                  value={form.branch}
                  onChange={(e) => setForm((f) => ({ ...f, branch: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-2xl border border-zinc-200 text-sm font-bold text-[#3b2063] bg-zinc-50 focus:outline-none focus:border-[#3b2063] focus:ring-2 focus:ring-[#3b2063]/10"
                  placeholder="e.g. SM City, Ayala, All Branches"
                  disabled={isSubmitting}
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-2xl border border-zinc-200 text-xs font-bold uppercase text-zinc-500 hover:bg-zinc-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 rounded-2xl bg-[#3b2063] text-white text-xs font-black uppercase tracking-widest hover:bg-[#2a174a] disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting && (
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  {editingUser ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-6 space-y-4">
            <h2 className="text-lg font-black text-[#3b2063] uppercase tracking-wider">
              Delete User
            </h2>
            <p className="text-sm text-zinc-600">
              Are you sure you want to delete user{' '}
              <span className="font-bold text-[#3b2063]">{userToDelete.name}</span>?
              This action cannot be undone.
            </p>
            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                disabled={loading}
                className="px-4 py-2 rounded-2xl border border-zinc-200 text-xs font-bold uppercase text-zinc-500 hover:bg-zinc-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={loading}
                className="px-6 py-2 rounded-2xl bg-red-600 text-white text-xs font-black uppercase tracking-widest hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {loading && (
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default UsersTab;
