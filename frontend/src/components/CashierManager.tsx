import { useState, useEffect, useCallback } from 'react';
import { Users, Plus, Trash2, Edit3, X, Save, Shield } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../hooks/useAuth';
import { UserService } from '../services/UserService';
import type { User as ApiUser } from '../services/UserService';
import axios from 'axios';

// Resolve branch string from currentUser — handles both branch and branch_id
const resolveBranch = (user: { branch?: string; branch_id?: string | number } | null | undefined): string | undefined => {
  if (!user) return undefined;
  if (user.branch) return String(user.branch);
  if (user.branch_id !== undefined && user.branch_id !== null && user.branch_id !== '')
    return String(user.branch_id);
  return undefined;
};

const CashierManagement = () => {
  const { showToast } = useToast();
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<ApiUser[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ApiUser | null>(null);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ApiUser | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<ApiUser | null>(null);

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirm: '',
  });

  // ── Fetch cashiers scoped to this branch manager's branch ──────────────────
const fetchUsers = useCallback(async () => {
  setIsFetching(true);
  try {
    const data = await UserService.getAllUsers({
      role: 'cashier',
      branch: resolveBranch(currentUser),
    });
    setUsers(data);
  } catch (err: unknown) {
    // Only show error toast on a real server error (5xx), not empty results
    if (axios.isAxiosError(err) && (err.response?.status ?? 0) >= 500) {
      showToast('Failed to load cashiers', 'error');
    }
    setUsers([]); // Silently show empty table for 403/404/no results
  } finally {
    setIsFetching(false);
  }
}, [currentUser?.branch, currentUser?.branch_id, showToast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const resetForm = () => {
    setNewUser({ name: '', email: '', password: '', passwordConfirm: '' });
    setEditingUser(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  // ── Create ─────────────────────────────────────────────────────────────────
  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      showToast('Please fill in all required fields', 'error');
      return;
    }
    if (newUser.password !== newUser.passwordConfirm) {
      showToast('Passwords do not match', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await UserService.createUser({
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        role: 'cashier',
        branch: resolveBranch(currentUser),
        status: 'ACTIVE',
      });
      showToast(`Cashier "${newUser.name}" added successfully`, 'success');
      closeModal();
      fetchUsers();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to add cashier', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Edit ───────────────────────────────────────────────────────────────────
  const handleEditUser = (user: ApiUser) => {
    setEditingUser(user);
    setNewUser({ name: user.name, email: user.email, password: '', passwordConfirm: '' });
    setIsModalOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    setIsSubmitting(true);
    try {
      await UserService.updateUser(editingUser.id, {
        name: newUser.name,
        email: newUser.email,
        ...(newUser.password ? { password: newUser.password } : {}),
      });
      showToast(`Cashier "${newUser.name}" updated successfully`, 'success');
      closeModal();
      fetchUsers();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to update cashier', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDeleteUser = (user: ApiUser) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await UserService.deleteUser(userToDelete.id);
      showToast(`Cashier "${userToDelete.name}" deleted`, 'error');
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to delete cashier', 'error');
    }
  };

  // ── Status Toggle ──────────────────────────────────────────────────────────
  const handleStatusToggle = (user: ApiUser) => {
    setSelectedUser(user);
    setIsConfirmModalOpen(true);
  };

  const confirmStatusToggle = async () => {
    if (!selectedUser) return;
    try {
      const updated = await UserService.toggleUserStatus(selectedUser.id);
      const isNowActive = updated.status === 'ACTIVE';
      showToast(
        `Cashier "${selectedUser.name}" ${isNowActive ? 'activated' : 'deactivated'}`,
        isNowActive ? 'success' : 'error'
      );
      setIsConfirmModalOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to update status', 'error');
    }
  };

  const isDeactivating = selectedUser?.status === 'ACTIVE';

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-10 flex flex-col gap-4 sm:gap-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-1.5 sm:p-2 bg-white rounded-lg shadow-sm">
            <Users size={20} className="text-[#3b2063]" />
          </div>
          <div>
            <h1 className="text-sm sm:text-xl font-black text-[#3b2063] uppercase tracking-wider">Cashier Management</h1>
            <p className="text-zinc-400 font-bold text-[10px] sm:text-xs uppercase tracking-wider mt-1">
              {resolveBranch(currentUser) ? `Branch: ${resolveBranch(currentUser)}` : 'System Access Control'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 sm:px-6 py-2 sm:py-2.5 bg-[#3b2063] text-white rounded-lg font-black text-[9px] sm:text-[10px] uppercase tracking-normal sm:tracking-widest hover:bg-[#291645] flex items-center gap-2 shadow-lg transition-all active:scale-95"
        >
          <Plus size={12} strokeWidth={3} /> Add Cashier
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                {['Name', 'Email', 'Branch', 'Status', 'Actions'].map((h, i) => (
                  <th
                    key={h}
                    className={`px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-[9px] sm:text-[10px] font-black text-slate-600 uppercase tracking-widest ${i >= 3 ? 'text-center' : ''}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {isFetching ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-zinc-400 text-xs font-bold">
                    Loading cashiers...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-zinc-400 text-xs font-bold">
                    No cashiers found for this branch.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-[10px] sm:text-xs font-black text-[#3b2063] uppercase">{user.name}</td>
                    <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-[10px] sm:text-xs font-bold text-slate-700">{user.email}</td>
                    <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-[10px] sm:text-xs font-bold text-slate-500">
                      <span className="bg-zinc-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded border border-zinc-200 text-[9px] sm:text-[10px] font-black uppercase tracking-wider">
                        {user.branch ?? '—'}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-center">
                      <button
                        onClick={() => handleStatusToggle(user)}
                        className={`relative group overflow-hidden px-1 sm:px-2 md:px-4 py-1.5 sm:py-2 rounded-full text-[7px] sm:text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all duration-300 shadow-sm hover:shadow-md active:scale-95 w-24 sm:w-28 border-2 ${
                          user.status === 'INACTIVE'
                            ? 'bg-red-50/50 text-red-600 border-red-500/20 hover:bg-red-500 hover:text-white'
                            : 'bg-emerald-50/50 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500 hover:text-white'
                        }`}
                      >
                        <span className="relative z-10 flex items-center justify-center gap-1">
                          <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${user.status === 'INACTIVE' ? 'bg-red-500 group-hover:bg-white' : 'bg-emerald-500 group-hover:bg-white'}`} />
                          {user.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                        </span>
                      </button>
                    </td>
                    <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-center">
                      <button onClick={() => handleEditUser(user)} className="text-blue-500 hover:text-blue-700 p-1 sm:p-2 transition-colors inline-block" title="Edit">
                        <Edit3 size={14} />
                      </button>
                      <button onClick={() => handleDeleteUser(user)} className="text-red-400 hover:text-red-600 p-1 sm:p-2 transition-colors inline-block ml-1 sm:ml-2" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add / Edit Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-4">
          <div className="bg-white w-full max-w-sm sm:max-w-md rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="bg-[#3b2063] px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center sticky top-0 z-10">
              <h2 className="text-white font-black text-[10px] sm:text-xs uppercase tracking-[0.2em]">
                {editingUser ? 'Edit Cashier' : 'Add New Cashier'}
              </h2>
              <button onClick={closeModal} className="text-white/70 hover:text-white"><X size={20} /></button>
            </div>

            <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
              {/* Role badge — always cashier, not editable */}
              <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-xl px-4 py-2">
                <Shield size={14} className="text-[#3b2063]" />
                <span className="text-[10px] font-black text-[#3b2063] uppercase tracking-widest">Position: Cashier</span>
              </div>

              <div>
                <h3 className="text-[#1e40af] font-black text-[9px] sm:text-[10px] uppercase tracking-[0.2em] mb-3 sm:mb-4 border-b border-zinc-100 pb-2">Profile Details</h3>
                <div className="space-y-3 sm:space-y-4">
                  <div className="space-y-1 sm:space-y-2">
                    <label className="text-[9px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-widest">Full Name</label>
                    <input
                      type="text"
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-[10px] sm:text-xs font-bold text-slate-700 outline-none focus:border-blue-500 transition-all"
                      placeholder="Enter full name"
                    />
                  </div>
                  <div className="space-y-1 sm:space-y-2">
                    <label className="text-[9px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-widest">Email Address</label>
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-[10px] sm:text-xs font-bold text-slate-700 outline-none focus:border-blue-500 transition-all"
                      placeholder="cashier@luckyboba.com"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-[#1e40af] font-black text-[9px] sm:text-[10px] uppercase tracking-[0.2em] mb-3 sm:mb-4 border-b border-zinc-100 pb-2">Login Details</h3>
                <div className="space-y-3 sm:space-y-4">
                  {!editingUser && (
                    <>
                      <div className="space-y-1 sm:space-y-2">
                        <label className="text-[9px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-widest">Password</label>
                        <input
                          type="password"
                          value={newUser.password}
                          onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-[10px] sm:text-xs font-bold text-slate-700 outline-none focus:border-blue-500 transition-all"
                          placeholder="••••••••"
                        />
                      </div>
                      <div className="space-y-1 sm:space-y-2">
                        <label className="text-[9px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-widest">Confirm Password</label>
                        <input
                          type="password"
                          value={newUser.passwordConfirm}
                          onChange={(e) => setNewUser({ ...newUser, passwordConfirm: e.target.value })}
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-[10px] sm:text-xs font-bold text-slate-700 outline-none focus:border-blue-500 transition-all"
                          placeholder="••••••••"
                        />
                      </div>
                    </>
                  )}
                  {editingUser && (
                    <div className="space-y-1 sm:space-y-2">
                      <label className="text-[9px] sm:text-[10px] font-black text-zinc-400 uppercase tracking-widest">New Password (optional)</label>
                      <input
                        type="password"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-[10px] sm:text-xs font-bold text-slate-700 outline-none focus:border-blue-500 transition-all"
                        placeholder="Leave blank to keep current password"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-zinc-100">
                <button
                  onClick={editingUser ? handleUpdateUser : handleAddUser}
                  disabled={isSubmitting}
                  className="flex-1 bg-[#3b2063] hover:bg-[#291645] text-white py-2 sm:py-3 rounded-xl font-black text-[9px] sm:text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={14} />
                  {isSubmitting ? 'Saving...' : editingUser ? 'Update Cashier' : 'Add Cashier'}
                </button>
                <button onClick={closeModal} className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-500 py-2 sm:py-3 rounded-xl font-black text-[9px] sm:text-[10px] uppercase tracking-[0.2em] transition-all">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Status Toggle Confirm Modal ── */}
      {isConfirmModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
            <div className={`px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center ${isDeactivating ? 'bg-red-500' : 'bg-emerald-500'}`}>
              <h2 className="text-white font-black text-[9px] sm:text-[10px] uppercase tracking-[0.2em]">Confirm Status Change</h2>
              <button onClick={() => { setIsConfirmModalOpen(false); setSelectedUser(null); }} className="text-white/70 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              <div className="text-center space-y-2">
                <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${isDeactivating ? 'bg-red-100' : 'bg-emerald-100'}`}>
                  {isDeactivating ? (
                    <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                  ) : (
                    <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                <h3 className="text-lg font-bold text-slate-800">{isDeactivating ? 'Deactivate Cashier?' : 'Activate Cashier?'}</h3>
                <p className="text-sm text-slate-600">Are you sure you want to {isDeactivating ? 'deactivate' : 'activate'}:</p>
                <p className="text-sm font-black text-[#3b2063] uppercase">{selectedUser.name}</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={confirmStatusToggle}
                  className={`flex-1 py-2 sm:py-3 rounded-xl font-black text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-white shadow-lg transition-all active:scale-95 ${isDeactivating ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}
                >
                  {isDeactivating ? 'Deactivate' : 'Activate'}
                </button>
                <button onClick={() => { setIsConfirmModalOpen(false); setSelectedUser(null); }} className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-500 py-2 sm:py-3 rounded-xl font-black text-[9px] sm:text-[10px] uppercase tracking-[0.2em] transition-all">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {isDeleteModalOpen && userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-red-500 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
              <h2 className="text-white font-black text-[9px] sm:text-[10px] uppercase tracking-[0.2em]">Delete Cashier</h2>
              <button onClick={() => { setIsDeleteModalOpen(false); setUserToDelete(null); }} className="text-white/70 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center">
                  <Trash2 className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Delete Cashier?</h3>
                <p className="text-sm text-slate-500">This action cannot be undone.</p>
                <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 mt-2">
                  <p className="text-sm font-black text-[#3b2063] uppercase">{userToDelete.name}</p>
                  <p className="text-[11px] text-zinc-400 font-semibold mt-0.5">{userToDelete.email}</p>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={confirmDeleteUser} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 sm:py-3 rounded-xl font-black text-[9px] sm:text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95">
                  <Trash2 size={13} /> Delete
                </button>
                <button onClick={() => { setIsDeleteModalOpen(false); setUserToDelete(null); }} className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-500 py-2 sm:py-3 rounded-xl font-black text-[9px] sm:text-[10px] uppercase tracking-[0.2em] transition-all">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashierManagement;