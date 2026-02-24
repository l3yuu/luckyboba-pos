import type { User } from '../../../types/user';
import type { useUsers } from '../../../hooks/useUsers';
import { UserFormModal, DeleteUserModal } from './Modals';
import { useToast } from '../../../context/ToastContext';

type UsersTabProps = ReturnType<typeof useUsers>;

export const UsersTab = (props: UsersTabProps) => {
  const { showToast } = useToast();

  const {
    users, loading, error,
    isModalOpen, editingUser, form, setForm, formError, isSubmitting,
    userToDelete, fetchUsers, openCreate, openEdit, closeModal,
    handleSubmit, handleDeleteClick, handleConfirmDelete, cancelDelete,
  } = props;

  // ── Wrap callbacks to fire toasts after success ──────────────────────────

  const handleSubmitWithToast = async (e: React.FormEvent) => {
    await handleSubmit(e);
    // Only toast if no formError was set (indicates success)
    // We check after a tick since formError state updates async
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
    // If no error state was set, deletion succeeded
    setTimeout(() => {
      if (!props.error) {
        showToast(`${userName} has been deleted.`, 'warning');
      }
    }, 100);
  };

  return (
    <section className="flex-1 px-6 md:px-10 pb-10 overflow-auto">
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between">
          <p className="text-sm text-red-600">{error}</p>
          <button onClick={fetchUsers} className="text-xs font-bold text-red-600 hover:text-red-700 uppercase">Retry</button>
        </div>
      )}

      {/* Header row */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <p className="text-[12px] font-black uppercase tracking-[0.2em] text-zinc-400">{users.length} Users</p>
          {loading && <div className="w-4 h-4 border-2 border-[#3b2063] border-t-transparent rounded-full animate-spin" />}
        </div>
        <button onClick={openCreate} disabled={loading}
          className="bg-[#3b2063] text-white px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-wider hover:bg-[#2a174a] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
          + Add User
        </button>
      </div>

      {/* Users table */}
      <div className="rounded-[1.5rem] border border-zinc-100 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#f8f6ff]">
                {['User', 'Role', 'Branch', 'Status', 'Actions'].map((h, i) => (
                  <th key={h} className={`${i === 4 ? 'text-right' : 'text-left'} px-6 py-4 text-[11px] font-black uppercase tracking-wider text-zinc-400`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <UserRow
                  key={user.id}
                  user={user}
                  loading={loading}
                  onEdit={() => openEdit(user)}
                  onDelete={() => handleDeleteClick(user)}
                />
              ))}
              {users.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-400">No users found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
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

// ── Private sub-component ──────────────────────────────────────────────────

const ROLE_BADGE: Record<string, string> = {
  superadmin: 'bg-[#fbbf24] text-[#3b2063]',
  admin:      'bg-[#f0ebff] text-[#3b2063]',
};

interface UserRowProps {
  user: User;
  loading: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

const UserRow = ({ user, loading, onEdit, onDelete }: UserRowProps) => (
  <tr className="border-t border-zinc-100 hover:bg-[#f8f6ff] transition-colors">
    <td className="px-6 py-4">
      <p className="font-bold text-[#3b2063]">{user.name}</p>
      <p className="text-xs text-zinc-400">{user.email}</p>
    </td>
    <td className="px-6 py-4">
      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${ROLE_BADGE[user.role] ?? 'bg-zinc-100 text-zinc-600'}`}>
        {user.role}
      </span>
    </td>
    <td className="px-6 py-4 text-sm text-zinc-600">{user.branch || '-'}</td>
    <td className="px-6 py-4">
      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${user.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-600' : 'bg-zinc-100 text-zinc-500'}`}>
        {user.status}
      </span>
    </td>
    <td className="px-6 py-4 text-right space-x-3">
      <button onClick={onEdit} disabled={loading} className="text-[#3b2063] hover:text-[#2a174a] font-bold text-xs uppercase disabled:opacity-50">Edit</button>
      <button onClick={onDelete} disabled={loading} className="text-red-500 hover:text-red-700 font-bold text-xs uppercase disabled:opacity-50">Delete</button>
    </td>
  </tr>
);

export default UsersTab;
