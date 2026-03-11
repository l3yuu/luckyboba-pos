import type { useUsers } from '../../../hooks/useUsers';
import { UserFormModal, DeleteUserModal } from './Modals';
import { useToast } from '../../../context/ToastContext';
import {
  Users, Plus, Edit3, Trash2, CheckCircle2, CircleDashed,
  RefreshCw, Shield, GitBranch, Search
} from 'lucide-react';
import { useState } from 'react';

type UsersTabProps = ReturnType<typeof useUsers>;

export const UsersTab = (props: UsersTabProps) => {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | string>('all');

  const {
    users, loading, error,
    isModalOpen, editingUser, form, setForm, formError, isSubmitting,
    userToDelete, fetchUsers, openCreate, openEdit, closeModal,
    handleSubmit, handleDeleteClick, handleConfirmDelete, cancelDelete,
  } = props;

  const handleSubmitWithToast = async (e: React.FormEvent) => {
    await handleSubmit(e);
    setTimeout(() => {
      if (!props.formError) {
        showToast(
          editingUser
            ? `${form.name} has been updated.`
            : `${form.name} has been added successfully.`,
          'success'
        );
      }
    }, 100);
  };

  const handleConfirmDeleteWithToast = async () => {
    const userName = userToDelete?.name ?? 'User';
    await handleConfirmDelete();
    setTimeout(() => {
      if (!props.error) showToast(`${userName} has been deleted.`, 'warning');
    }, 100);
  };

  // Derived
  const activeCount   = users.filter(u => u.status === 'ACTIVE').length;
  const inactiveCount = users.filter(u => u.status !== 'ACTIVE').length;
  const roles         = [...new Set(users.map(u => u.role))];

  const filtered = users.filter(u => {
    const matchSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.branch ?? '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchRole = filterRole === 'all' || u.role === filterRole;
    return matchSearch && matchRole;
  });

  // Summary cards
  const summaryCards = [
    { label: 'Total Users',    value: users.length,   icon: <Users size={14}/>,  bg: '#ede9fe', color: '#7c3aed' },
    { label: 'Active',         value: activeCount,    icon: <CheckCircle2 size={14}/>, bg: '#dcfce7', color: '#16a34a' },
    { label: 'Inactive',       value: inactiveCount,  icon: <CircleDashed size={14}/>, bg: '#fee2e2', color: '#dc2626' },
    { label: 'Roles',          value: roles.length,   icon: <Shield size={14}/>, bg: '#dbeafe', color: '#2563eb' },
  ];

  const ROLE_STYLES: Record<string, string> = {
    superadmin:     'bg-violet-100 text-violet-700 border-violet-200',
    admin:          'bg-blue-50 text-blue-700 border-blue-200',
    branch_manager: 'bg-amber-50 text-amber-700 border-amber-200',
    cashier:        'bg-gray-100 text-gray-600 border-gray-200',
  };

  return (
    <section className="px-5 md:px-8 pb-8 pt-5 space-y-5">

      {/* ── ERROR BANNER ── */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
          <p className="text-sm text-red-600 font-medium">{error}</p>
          <button onClick={fetchUsers} className="flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 uppercase tracking-wider">
            <RefreshCw size={12} /> Retry
          </button>
        </div>
      )}

      {/* ── SUMMARY STRIP ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {summaryCards.map((s, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: s.bg, color: s.color }}>
              {s.icon}
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">{s.label}</p>
              <p className="text-lg font-black text-gray-900 leading-tight">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── TOOLBAR ── */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-3 flex-1 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-50 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={15} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, branch..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-300 transition-all"
            />
          </div>
          {/* Role filter pills */}
          <div className="flex gap-1 bg-gray-50 border border-gray-100 rounded-lg p-1 flex-wrap">
            <button onClick={() => setFilterRole('all')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${filterRole === 'all' ? 'bg-white text-gray-900 shadow-sm border border-gray-200' : 'text-gray-400 hover:text-gray-600'}`}>
              All <span className="ml-1 opacity-60">{users.length}</span>
            </button>
            {roles.map(r => (
              <button key={r} onClick={() => setFilterRole(r)}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all capitalize ${filterRole === r ? 'bg-white text-gray-900 shadow-sm border border-gray-200' : 'text-gray-400 hover:text-gray-600'}`}>
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {loading && <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />}
          <button onClick={openCreate} disabled={loading}
            className="px-5 py-2 bg-violet-600 text-white rounded-xl text-sm font-bold hover:bg-violet-700 flex items-center gap-2 transition-all shadow-sm disabled:opacity-50 whitespace-nowrap">
            <Plus size={16} strokeWidth={2.5} /> Add User
          </button>
        </div>
      </div>

      {/* ── USER LIST ── */}
      <div className="flex flex-col gap-2">

        {/* Column headers */}
        <div className="hidden sm:grid grid-cols-12 px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
          <div className="col-span-4">User</div>
          <div className="col-span-2">Role</div>
          <div className="col-span-2">Branch</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {/* Empty state */}
        {filtered.length === 0 && !loading && (
          <div className="text-center py-16 bg-white border border-gray-100 border-dashed rounded-2xl">
            <Users className="mx-auto h-10 w-10 text-gray-200 mb-3" />
            <p className="text-sm font-semibold text-gray-400">No users found</p>
            <p className="text-xs text-gray-300 mt-1">Adjust your search or filter.</p>
          </div>
        )}

        {/* Skeleton rows */}
        {loading && users.length === 0 && (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white border border-gray-100 rounded-xl px-4 py-3.5 animate-pulse">
                <div className="grid grid-cols-12 items-center gap-2">
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gray-100" />
                    <div className="space-y-1.5">
                      <div className="h-3 w-24 bg-gray-100 rounded" />
                      <div className="h-2 w-32 bg-gray-50 rounded" />
                    </div>
                  </div>
                  <div className="col-span-2"><div className="h-6 w-16 bg-gray-100 rounded-lg" /></div>
                  <div className="col-span-2"><div className="h-3 w-20 bg-gray-100 rounded" /></div>
                  <div className="col-span-2"><div className="h-6 w-14 bg-gray-100 rounded-full" /></div>
                  <div className="col-span-2 flex justify-end gap-2">
                    <div className="h-7 w-7 bg-gray-100 rounded-lg" />
                    <div className="h-7 w-7 bg-gray-100 rounded-lg" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* User rows */}
        {filtered.map(user => {
          const isActive = user.status === 'ACTIVE';
          return (
            <div key={user.id}
              className="bg-white border border-gray-100 rounded-xl px-4 py-3.5 hover:border-violet-100 hover:shadow-sm transition-all group">
              <div className="grid grid-cols-12 items-center gap-2">

                {/* Avatar + Name */}
                <div className="col-span-12 sm:col-span-4 flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                    isActive ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate leading-tight">{user.name}</p>
                    <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
                  </div>
                </div>

                {/* Role */}
                <div className="hidden sm:flex col-span-2 items-center">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold border capitalize ${
                    ROLE_STYLES[user.role] ?? 'bg-gray-100 text-gray-600 border-gray-200'
                  }`}>
                    {user.role}
                  </span>
                </div>

                {/* Branch */}
                <div className="hidden sm:flex col-span-2 items-center gap-1.5">
                  {user.branch
                    ? <><GitBranch size={11} className="text-gray-300 shrink-0" /><p className="text-xs text-gray-500 truncate">{user.branch}</p></>
                    : <span className="text-xs text-gray-300">—</span>
                  }
                </div>

                {/* Status */}
                <div className="hidden sm:flex col-span-2 items-center">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      : 'bg-gray-50 text-gray-500 border-gray-200'
                  }`}>
                    {isActive
                      ? <CheckCircle2 size={10} className="text-emerald-500" />
                      : <CircleDashed size={10} />}
                    {user.status}
                  </span>
                </div>

                {/* Actions */}
                <div className="hidden sm:flex col-span-2 justify-end gap-1">
                  <button onClick={() => openEdit(user)} disabled={loading}
                    className="p-1.5 rounded-lg text-gray-300 hover:text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50">
                    <Edit3 size={14} />
                  </button>
                  <button onClick={() => handleDeleteClick(user)} disabled={loading}
                    className="p-1.5 rounded-lg text-gray-300 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Footer count */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between px-2 pt-1">
            <p className="text-[10px] text-gray-400">
              Showing <span className="font-bold text-gray-600">{filtered.length}</span> of {users.length} users
            </p>
            <p className="text-[10px] text-gray-400">
              {activeCount} active · {inactiveCount} inactive
            </p>
          </div>
        )}
      </div>

      {/* ── MODALS ── */}
      <UserFormModal
        isOpen={isModalOpen}
        editingUser={editingUser}
        form={form}
        setForm={setForm}
        formError={formError}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmitWithToast}
        onClose={closeModal}
      />
      <DeleteUserModal
        user={userToDelete}
        loading={loading}
        onConfirm={handleConfirmDeleteWithToast}
        onCancel={cancelDelete}
      />
    </section>
  );
};

export default UsersTab;
