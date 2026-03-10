import { useState, useCallback, useEffect } from 'react';
import type { User, UserRole } from '../types/user';

// ── Types ──────────────────────────────────────────────────────────────────

export interface UserForm {
  name:      string;
  email:     string;
  role:      UserRole;
  branch:    string;
  password:  string;
  status:    'ACTIVE' | 'INACTIVE';
}

const EMPTY_FORM: UserForm = {
  name:     '',
  email:    '',
  role:     'cashier',      // valid: superadmin | system_admin | branch_manager | cashier | customer
  branch:   '',
  password: '',
  status:   'ACTIVE',
};

// ── API helpers ────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api';

const getHeaders = (): Record<string, string> => {
  const token =
    localStorage.getItem('auth_token') ??
    localStorage.getItem('lucky_boba_token') ??
    localStorage.getItem('token') ??
    '';
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

interface LaravelUserResponse {
  success: boolean;
  message?: string;
  errors?:  Record<string, string[]>;
  data:     User | User[];
}

const extractError = (json: LaravelUserResponse, fallback: string): string => {
  if (json?.errors) return Object.values(json.errors).flat().join(' ');
  return json?.message ?? fallback;
};

// ── Hook ───────────────────────────────────────────────────────────────────

export const useUsers = () => {
  const [users, setUsers]         = useState<User[]>([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen]   = useState(false);
  const [editingUser, setEditingUser]   = useState<User | null>(null);
  const [form, setForm]                 = useState<UserForm>(EMPTY_FORM);
  const [formError, setFormError]       = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete state
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // ── Fetch all users ──────────────────────────────────────────────────────

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`${API_BASE}/users`, { headers: getHeaders() });
      const json = (await res.json()) as LaravelUserResponse;

      if (!res.ok || !json.success) {
        throw new Error(extractError(json, 'Failed to load users'));
      }

      setUsers(json.data as User[]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-fetch on mount
  useEffect(() => { fetchUsers(); }, [fetchUsers]);

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
      password: '',           // never pre-fill password
      status:   user.status,
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

  // ── Create or Update ─────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    if (!form.name.trim())  { setFormError('Name is required.');  return; }
    if (!form.email.trim()) { setFormError('Email is required.'); return; }
    if (!editingUser && !form.password?.trim()) {
      setFormError('Password is required for new users.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      // Build payload — only include password if provided, send null for empty branch
      const payload: Record<string, string | null> = {
        name:   form.name.trim(),
        email:  form.email.trim(),
        role:   form.role,
        status: form.status,
        branch: form.branch?.trim() || '',  // empty string → null for Laravel nullable rule
      };
      if (form.password?.trim()) payload.password = form.password.trim();

      const url    = editingUser
        ? `${API_BASE}/users/${editingUser.id}`
        : `${API_BASE}/users`;
      const method = editingUser ? 'PUT' : 'POST';

      const res  = await fetch(url, {
        method,
        headers: getHeaders(),
        body:    JSON.stringify(payload),
      });
      const json = (await res.json()) as LaravelUserResponse;

      // Check HTTP status first — Laravel 422 responses can still carry
      // success:true in the body, so never trust json.success alone.
      if (!res.ok) {
        console.error('[useUsers] Save failed:', res.status, json);
        throw new Error(extractError(json, `Server error ${res.status}`));
      }
      if (!json.success) {
        throw new Error(extractError(json, 'Failed to save user'));
      }

      const saved = json.data as User;

      if (editingUser) {
        setUsers(prev => prev.map(u => (u.id === saved.id ? saved : u)));
      } else {
        setUsers(prev => [saved, ...prev]);
      }

      closeModal();
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────

  const handleDeleteClick = (user: User) => setUserToDelete(user);

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/users/${userToDelete.id}`, {
        method:  'DELETE',
        headers: getHeaders(),
      });
      const json = (await res.json()) as LaravelUserResponse;

      if (!res.ok || !json.success) {
        throw new Error(extractError(json, 'Failed to delete user'));
      }

      setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
      setUserToDelete(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  const cancelDelete = () => setUserToDelete(null);

  // ── Toggle status ─────────────────────────────────────────────────────────

  const toggleStatus = async (user: User) => {
    try {
      const res  = await fetch(`${API_BASE}/users/${user.id}/toggle-status`, {
        method:  'PATCH',
        headers: getHeaders(),
      });
      const json = (await res.json()) as LaravelUserResponse;

      if (!res.ok || !json.success) {
        throw new Error(extractError(json, 'Failed to toggle status'));
      }

      const updated = json.data as User;
      setUsers(prev => prev.map(u => (u.id === updated.id ? updated : u)));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to toggle status');
    }
  };

  // ── Return ────────────────────────────────────────────────────────────────

  return {
    users,
    loading,
    error,
    isModalOpen,
    editingUser,
    form,
    setForm,
    formError,
    isSubmitting,
    userToDelete,
    fetchUsers,
    openCreate,
    openEdit,
    closeModal,
    handleSubmit,
    handleDeleteClick,
    handleConfirmDelete,
    cancelDelete,
    toggleStatus,
  };
};