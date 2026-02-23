import { useState, useCallback } from 'react';
import type { User, UserRole } from '../types/user';

export interface UserForm {
  name: string;
  email: string;
  role: UserRole;  // was: string
  branch?: string;
  password?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

const EMPTY_FORM: UserForm = {
  name: '',
  email: '',
  role: 'staff' as UserRole,  // make sure 'staff' is a valid UserRole
  branch: '',
  password: '',
  status: 'ACTIVE',
};

// ── Hook ───────────────────────────────────────────────────────────────────

export const useUsers= () => {
  const [users, setUsers]           = useState<User[]>([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen]     = useState(false);
  const [editingUser, setEditingUser]     = useState<User | null>(null);
  const [form, setForm]                   = useState<UserForm>(EMPTY_FORM);
  const [formError, setFormError]         = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting]   = useState(false);

  // Delete confirmation state
  const [userToDelete, setUserToDelete]   = useState<User | null>(null);

  // ── Fetch ────────────────────────────────────────────────────────────────

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Replace with real API call, e.g.:
      // const data = await UserService.getAllUsers();
      // setUsers(data);

      // Mock data — remove when API is ready
      await new Promise((resolve) => setTimeout(resolve, 800));
      setUsers([
        { id: 1, name: 'Bina', email: 'admin@luckyboba.com', role: 'superadmin', status: 'ACTIVE' },
        { id: 2, name: 'Staff User', email: 'staff@luckyboba.com', role: 'manager', status: 'ACTIVE' },
      ]);
    } catch {
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Modal helpers ────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditingUser(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setIsModalOpen(true);
  };

const openEdit = (user: User) => {
  setEditingUser(user);
  setForm({
    name:     user.name,
    email:    user.email,
    role:     user.role,
    branch:   user.branch ?? '',
    status:   user.status,  // add this
  });
  setFormError(null);
  setIsModalOpen(true);
};

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setForm(EMPTY_FORM);
    setFormError(null);
  };

  // ── Submit (create or update) ────────────────────────────────────────────

  const handleSubmit = async () => {
    // Basic validation
    if (!form.name.trim())  return setFormError('Name is required.');
    if (!form.email.trim()) return setFormError('Email is required.');
    if (!form.role.trim())  return setFormError('Role is required.');
    if (!editingUser && !form.password?.trim()) return setFormError('Password is required for new users.');

    try {
      setIsSubmitting(true);
      setFormError(null);

      // TODO: Replace with real API calls:
      // if (editingUser) await UserService.updateUser(editingUser.id, form);
      // else             await UserService.createUser(form);

      // Mock — remove when API is ready
      await new Promise((resolve) => setTimeout(resolve, 800));

      if (editingUser) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === editingUser.id
              ? { ...u, ...form }
              : u
          )
        );
      } else {
        const newUser: User = {
          id:     Math.floor(Math.random() * 10000),
          name:   form.name,
          email:  form.email,
          role:   form.role,
          branch: form.branch,
          status: 'ACTIVE',
        };
        setUsers((prev) => [...prev, newUser]);
      }

      closeModal();
    } catch {
      setFormError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    try {
      setLoading(true);

      // TODO: Replace with real API call:
      // await UserService.deleteUser(userToDelete.id);

      // Mock — remove when API is ready
      await new Promise((resolve) => setTimeout(resolve, 600));
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));

      setUserToDelete(null);
    } catch {
      setError('Failed to delete user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const cancelDelete = () => {
    setUserToDelete(null);
  };

  // ── Return ───────────────────────────────────────────────────────────────

  return {
    // state
    users,
    loading,
    error,
    // modal
    isModalOpen,
    editingUser,
    form,
    setForm,
    formError,
    isSubmitting,
    // delete
    userToDelete,
    // actions
    fetchUsers,
    openCreate,
    openEdit,
    closeModal,
    handleSubmit,
    handleDeleteClick,
    handleConfirmDelete,
    cancelDelete,
  };
};