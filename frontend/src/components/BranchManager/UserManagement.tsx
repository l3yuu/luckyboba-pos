"use client"

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Users, Plus, Trash2, Edit3, X, Save, Shield, GripVertical,
  Search, CheckCircle2, CircleDashed, AlertCircle,
  Clock, UserCheck, UserX, Key, ChevronDown, RefreshCw
} from 'lucide-react';
import api from '../../services/api';

// ─── Font tokens ──────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');
  .um-root, .um-root * { font-family: 'DM Sans', sans-serif !important; box-sizing: border-box; }
  .um-label { font-size: 0.62rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #3f3f46; }
  .um-sub { font-size: 0.65rem; font-weight: 400; color: #71717a; }
  .um-value { font-size: 1.9rem; font-weight: 800; letter-spacing: -0.035em; line-height: 1; }
  .um-live { display: inline-flex; align-items: center; gap: 5px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 100px; padding: 4px 10px; }
  .um-live-dot { width: 5px; height: 5px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 5px rgba(34,197,94,0.6); animation: um-pulse 2s infinite; }
  .um-live-text { font-size: 0.55rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #16a34a; }
  @keyframes um-pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
  .um-tab { font-size: 0.6rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; padding: 6px 13px; border-radius: 0.4rem; border: none; cursor: pointer; transition: background 0.12s, color 0.12s; }
  .um-tab-on  { background: #1a0f2e; color: #fff; }
  .um-tab-off { background: transparent; color: #a1a1aa; }
  .um-tab-off:hover { background: #ede8ff; color: #3b2063; }
  .um-pill { font-size: 0.58rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; border-radius: 100px; padding: 3px 9px; border: 1px solid #e4e4e7; background: #f4f4f5; color: #71717a; }
  .um-col-hdr { font-size: 0.6rem; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: #a1a1aa; }
  .um-input { width: 100%; padding: 10px 14px; background: #f9f9fb; border: 1px solid #e4e4e7; border-radius: 0.75rem; outline: none; font-size: 0.82rem; color: #1a0f2e; transition: border 0.12s, box-shadow 0.12s; }
  .um-input:focus { border-color: #a78bfa; box-shadow: 0 0 0 3px rgba(167,139,250,0.15); background: #fff; }
`;

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApiUser {
  id:          number;
  name:        string;
  email:       string;
  role:        string;
  status:      string;
  branch?:     string | null;   // matches transformUser() which returns 'branch'
  branch_name?: string | null;  // kept for backward compat
  branch_id?:  number | null;
  created_at?: string;
  last_login_at?: string | null;
  login_count?:   number;
}

interface FormState {
  name:            string;
  email:           string;
  password:        string;
  passwordConfirm: string;
  role:            string;
}

const ROLE_OPTIONS = ['cashier', 'branch_manager'];

const roleLabel: Record<string, string> = {
  superadmin:     'SYSTEM ADMIN',
  branch_manager: 'BRANCH MANAGER',
  cashier:        'CASHIER',
};

const positionColor: Record<string, string> = {
  superadmin:     'bg-violet-50 text-violet-700 border-violet-200',
  branch_manager: 'bg-blue-50 text-blue-700 border-blue-200',
  cashier:        'bg-gray-100 text-gray-600 border-gray-200',
};

const blankForm = (): FormState => ({ name: '', email: '', password: '', passwordConfirm: '', role: 'cashier' });

// ─── Component ────────────────────────────────────────────────────────────────

const UserManagement: React.FC = () => {
  const [users,         setUsers]         = useState<ApiUser[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);
  const [apiError,      setApiError]      = useState<string | null>(null);

  const [isModalOpen,        setIsModalOpen]        = useState(false);
  const [editingUser,        setEditingUser]        = useState<ApiUser | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedUser,       setSelectedUser]       = useState<ApiUser | null>(null);
  const [expandedUser,       setExpandedUser]       = useState<number | null>(null);

  const [searchQuery,  setSearchQuery]  = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'ACTIVE' | 'INACTIVE'>('All');

  const [form, setForm] = useState<FormState>(blankForm());
  const [formError, setFormError] = useState<string | null>(null);

  const dragItem     = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const res = await api.get('/users');
      const payload = res.data;
      // Controller returns { success, data: [...], message }
      const raw: unknown[] = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
        ? payload.data
        : [];
      // Filter out any non-object / malformed entries to prevent toLowerCase crash
      const list: ApiUser[] = raw.filter(
        (u): u is ApiUser => !!u && typeof u === 'object' && 'id' in (u as object)
      );
      setUsers(list);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setApiError(msg ?? 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // ── Derived ────────────────────────────────────────────────────────────────

  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (roleLabel[u.role] ?? u.role).toLowerCase().includes(q);
    const matchStatus = filterStatus === 'All' || u.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const activeCount   = users.filter(u => u.status === 'ACTIVE').length;
  const inactiveCount = users.filter(u => u.status === 'INACTIVE').length;

  // ── Drag sort (local reorder only) ────────────────────────────────────────

  const handleSort = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    const arr     = [...users];
    const dragged = arr[dragItem.current];
    arr.splice(dragItem.current, 1);
    arr.splice(dragOverItem.current, 0, dragged);
    setUsers(arr);
    dragItem.current = dragOverItem.current = null;
  };

  // ── Create / Update ────────────────────────────────────────────────────────

  const openCreate = () => { setEditingUser(null); setForm(blankForm()); setFormError(null); setIsModalOpen(true); };

  const openEdit = (user: ApiUser) => {
    setEditingUser(user);
    setForm({ name: user.name, email: user.email, password: '', passwordConfirm: '', role: user.role });
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditingUser(null); setForm(blankForm()); setFormError(null); };

  const handleSave = async () => {
    setFormError(null);
    if (!form.name.trim() || !form.email.trim()) { setFormError('Name and email are required.'); return; }
    if (!editingUser && !form.password) { setFormError('Password is required for new users.'); return; }
    if (form.password && form.password !== form.passwordConfirm) { setFormError('Passwords do not match.'); return; }

    setSaving(true);
    try {
      if (editingUser) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const payload: Record<string, any> = { name: form.name, email: form.email, role: form.role };
        if (form.password) {
          payload.password = form.password;
          payload.password_confirmation = form.passwordConfirm;
        }
        const res = await api.put(`/users/${editingUser.id}`, payload);
        // Controller wraps response: { success, data: {...user}, message }
        const updated: ApiUser = res.data?.data ?? res.data;
        setUsers(prev => prev.map(u => u.id === editingUser.id ? updated : u));
      } else {
        const res = await api.post('/users', {
          name:                  form.name,
          email:                 form.email,
          password:              form.password,
          password_confirmation: form.passwordConfirm,
          role:                  form.role,
          status:                'ACTIVE',   // required by backend validation
        });
        // Controller wraps response: { success, data: {...user}, message }
        const created: ApiUser = res.data?.data ?? res.data;
        setUsers(prev => [created, ...prev]);
      }
      closeModal();
    } catch (e: unknown) {
      // Laravel returns { message, errors: { field: [msg, ...] } } on 422
      type LaravelError = { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const errData = (e as LaravelError)?.response?.data;
      if (errData?.errors) {
        const msgs = Object.values(errData.errors).flat().join(' · ');
        setFormError(msgs);
      } else {
        setFormError(errData?.message ?? 'Failed to save user.');
      }
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/users/${id}`);
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(msg ?? 'Failed to delete user.');
    }
  };

  // ── Status toggle ──────────────────────────────────────────────────────────

  const openStatusToggle = (user: ApiUser) => { setSelectedUser(user); setIsConfirmModalOpen(true); };

  const confirmStatusToggle = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      const res = await api.patch(`/users/${selectedUser.id}/toggle-status`);
      const toggled: ApiUser = res.data?.data ?? res.data;
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? toggled : u));
      setIsConfirmModalOpen(false);
      setSelectedUser(null);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(msg ?? 'Failed to toggle status.');
    } finally {
      setSaving(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{STYLES}</style>
      <div className="um-root w-full flex-1 p-4 md:p-6 flex flex-col gap-5 bg-[#f5f4f8] min-h-full">

        {/* ── SUMMARY STRIP ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Users', value: users.length,          icon: <Users     size={14}/>, color: '#7c3aed', bg: '#ede9fe' },
            { label: 'Active',      value: activeCount,           icon: <UserCheck size={14}/>, color: '#16a34a', bg: '#dcfce7' },
            { label: 'Inactive',    value: inactiveCount,         icon: <UserX     size={14}/>, color: '#dc2626', bg: '#fee2e2' },
            { label: 'Roles',       value: ROLE_OPTIONS.length,   icon: <Shield    size={14}/>, color: '#0891b2', bg: '#cffafe' },
          ].map((s, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
              <div>
                <p className="um-label" style={{ color: '#a1a1aa' }}>{s.label}</p>
                <p className="um-value" style={{ fontSize: '1.35rem' }}>{loading ? '—' : s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── TOOLBAR ── */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex items-center gap-3 flex-1 flex-wrap">
            <div className="relative flex-1 min-w-50 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={15} />
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search name, email, role…"
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-300 transition-all"
                style={{ fontSize: '0.78rem', fontWeight: 500, color: '#1a0f2e' }} />
            </div>
            <div className="flex gap-1 p-1 bg-gray-50 border border-gray-100 rounded-lg">
              {(['All', 'ACTIVE', 'INACTIVE'] as const).map(f => (
                <button key={f} onClick={() => setFilterStatus(f)}
                  className={`um-tab ${filterStatus === f ? 'um-tab-on' : 'um-tab-off'}`}>
                  {f === 'All' ? 'All' : f === 'ACTIVE' ? `Active` : 'Inactive'}
                  {f !== 'All' && <span className="ml-1 opacity-60">{f === 'ACTIVE' ? activeCount : inactiveCount}</span>}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchUsers} disabled={loading}
              className="p-2.5 border border-gray-200 rounded-xl text-gray-400 hover:text-[#3b2063] hover:border-[#ddd6f7] hover:bg-[#faf8ff] transition-all"
              title="Refresh">
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
            <button onClick={openCreate}
              className="px-5 py-2 bg-[#3b2063] text-white rounded-xl hover:bg-[#2e1850] flex items-center justify-center gap-2 transition-all shadow-sm whitespace-nowrap"
              style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              <Plus size={15} strokeWidth={2.5} /> Add User
            </button>
          </div>
        </div>

        {/* ── ERROR BANNER ── */}
        {apiError && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-3">
            <AlertCircle size={16} className="text-red-500 shrink-0" />
            <p style={{ fontSize: '0.78rem', fontWeight: 600, color: '#dc2626' }}>{apiError}</p>
            <button onClick={fetchUsers} className="ml-auto text-red-500 hover:text-red-700 transition-colors"
              style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Retry</button>
          </div>
        )}

        {/* ── USER LIST ── */}
        <div className="flex flex-col gap-2">

          {/* Column headers */}
          <div className="hidden sm:grid grid-cols-12 px-4 py-2">
            {['', 'User', 'Role', 'Status', 'Last Login', 'Logins', ''].map((h, i) => (
              <div key={i} className={`um-col-hdr ${
                i === 0 ? 'col-span-1' : i === 1 ? 'col-span-3' : i === 2 ? 'col-span-2' :
                i === 3 ? 'col-span-2' : i === 4 ? 'col-span-2' : i === 5 ? 'col-span-1' : 'col-span-1 text-right'}`}>
                {h}
              </div>
            ))}
          </div>

          {/* Loading skeleton */}
          {loading && (
            <div className="flex flex-col gap-2">
              {[1,2,3].map(i => (
                <div key={i} className="bg-white border border-gray-100 rounded-xl px-4 py-4 flex items-center gap-3 animate-pulse">
                  <div className="w-8 h-8 bg-gray-100 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-100 rounded w-1/4" />
                    <div className="h-2 bg-gray-50 rounded w-1/6" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && filteredUsers.length === 0 && (
            <div className="text-center py-16 bg-white border border-gray-100 border-dashed rounded-2xl">
              <Users className="mx-auto h-10 w-10 text-gray-200 mb-3" />
              <p className="um-label" style={{ color: '#a1a1aa' }}>No users found</p>
              <p className="um-sub" style={{ marginTop: 4 }}>Adjust your search or filter.</p>
            </div>
          )}

          {/* Rows */}
          {!loading && filteredUsers.map((user) => (
            <div key={user.id}>
              <div
                draggable
                onDragStart={e => {
                  dragItem.current = users.findIndex(u => u.id === user.id);
                  setTimeout(() => { if (e.target instanceof HTMLElement) e.target.classList.add('opacity-40'); }, 0);
                }}
                onDragEnter={() => { dragOverItem.current = users.findIndex(u => u.id === user.id); }}
                onDragEnd={e => {
                  if (e.target instanceof HTMLElement) e.target.classList.remove('opacity-40');
                  handleSort();
                }}
                onDragOver={e => e.preventDefault()}
                className={`bg-white border rounded-xl px-4 py-3.5 hover:border-gray-200 transition-all cursor-grab active:cursor-grabbing group ${expandedUser === user.id ? 'border-violet-200 rounded-b-none' : 'border-gray-100'}`}
              >
                <div className="grid grid-cols-12 items-center gap-2">

                  {/* Drag handle */}
                  <div className="col-span-1 flex items-center">
                    <GripVertical size={14} className="text-gray-300 group-hover:text-gray-400 transition-colors" />
                  </div>

                  {/* Name + email */}
                  <div className="col-span-11 sm:col-span-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${user.status === 'ACTIVE' ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-400'}`}
                        style={{ fontSize: '0.72rem', fontWeight: 800 }}>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1a0f2e', lineHeight: 1.2 }} className="truncate">{user.name}</p>
                        <p className="um-sub truncate">{user.email}</p>
                        {(user.branch ?? user.branch_name) && (
                          <p className="truncate" style={{ fontSize: '0.6rem', fontWeight: 600, color: '#7c3aed', letterSpacing: '0.06em', marginTop: 1 }}>
                            📍 {user.branch ?? user.branch_name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Role */}
                  <div className="hidden sm:flex col-span-2 items-center">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg border ${positionColor[user.role] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}
                      style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                      {roleLabel[user.role] ?? user.role.toUpperCase()}
                    </span>
                  </div>

                  {/* Status toggle */}
                  <div className="hidden sm:flex col-span-2 items-center">
                    <button onClick={() => openStatusToggle(user)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all hover:opacity-75 ${
                        user.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          : 'bg-gray-50 text-gray-500 border-gray-200'}`}
                      style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                      {user.status === 'ACTIVE' ? <CheckCircle2 size={10} className="text-emerald-500" /> : <CircleDashed size={10} />}
                      {user.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                    </button>
                  </div>

                  {/* Last Login */}
                  <div className="hidden sm:flex col-span-2 items-center gap-1.5">
                    <Clock size={11} className="text-gray-300 shrink-0" />
                    <p className="um-sub truncate">
                      {user.last_login_at
                        ? new Date(user.last_login_at).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                        : 'Never'}
                    </p>
                  </div>

                  {/* Login count */}
                  <div className="hidden sm:flex col-span-1 items-center">
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#71717a' }}>
                      {(user.login_count ?? 0).toLocaleString()}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="hidden sm:flex col-span-1 justify-end items-center gap-1">
                    <button onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
                      className={`p-1.5 rounded-lg transition-colors ${expandedUser === user.id ? 'text-violet-600 bg-violet-50' : 'text-gray-300 hover:text-gray-600 hover:bg-gray-50'}`}>
                      <ChevronDown size={14} className={`transition-transform ${expandedUser === user.id ? 'rotate-180' : ''}`} />
                    </button>
                    <button onClick={() => openEdit(user)} className="p-1.5 rounded-lg text-gray-300 hover:text-blue-600 hover:bg-blue-50 transition-colors"><Edit3 size={14} /></button>
                    <button onClick={() => handleDelete(user.id)} className="p-1.5 rounded-lg text-gray-300 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>

              {/* Expanded detail row */}
              {expandedUser === user.id && (
                <div className="bg-violet-50/50 border border-violet-200 border-t-0 rounded-b-xl px-6 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: 'Member Since',   value: user.created_at ? new Date(user.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : '—', icon: <Clock size={12}/> },
                    { label: 'Total Logins',   value: `${(user.login_count ?? 0).toLocaleString()} sessions`,  icon: <Key    size={12}/> },
                    { label: 'Role',           value: roleLabel[user.role] ?? user.role.toUpperCase(),          icon: <Shield size={12}/> },
                    { label: 'Branch',         value: user.branch ?? user.branch_name ?? '—',                  icon: <Users  size={12}/> },
                  ].map((d, di) => (
                    <div key={di} className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 um-label" style={{ color: '#7c3aed' }}>{d.icon}{d.label}</div>
                      <p style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1a0f2e' }}>{d.value}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── ADD / EDIT MODAL ── */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
              <div className="px-6 py-4 flex justify-between items-center border-b border-gray-100">
                <div>
                  <h2 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1a0f2e', letterSpacing: '-0.03em', margin: 0 }}>
                    {editingUser ? 'Edit User' : 'Create New User'}
                  </h2>
                  <p className="um-sub" style={{ marginTop: 2 }}>{editingUser ? 'Update profile details' : 'Add a new system user'}</p>
                </div>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">

                {formError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 flex items-center gap-2">
                    <AlertCircle size={14} className="text-red-500 shrink-0" />
                    <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#dc2626' }}>{formError}</p>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="um-label flex items-center gap-1.5"><Users size={12}/> Full Name</label>
                  <input className="um-input" type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Enter full name" />
                </div>

                <div className="space-y-1.5">
                  <label className="um-label flex items-center gap-1.5"><Shield size={12}/> Email</label>
                  <input className="um-input" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="user@luckyboba.com" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="um-label flex items-center gap-1.5"><Key size={12}/> {editingUser ? 'New Password' : 'Password'}</label>
                    <input className="um-input" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="••••••••" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="um-label">Confirm</label>
                    <input className="um-input" type="password" value={form.passwordConfirm} onChange={e => setForm({...form, passwordConfirm: e.target.value})} placeholder="••••••••" />
                  </div>
                </div>
                {editingUser && (
                  <p className="um-sub" style={{ marginTop: -8 }}>Leave password blank to keep existing password.</p>
                )}

                <div className="space-y-1.5">
                  <label className="um-label">Role / Position</label>
                  <select className="um-input" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                    {ROLE_OPTIONS.map(r => <option key={r} value={r}>{roleLabel[r] ?? r.toUpperCase()}</option>)}
                  </select>
                </div>

                <div className="bg-violet-50 border border-violet-100 rounded-xl p-3 flex gap-2.5">
                  <Shield size={14} className="text-violet-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="um-label" style={{ color: '#6d28d9' }}>
                      {form.role === 'cashier' ? 'Cashier Access' : 'Branch Manager Access'}
                    </p>
                    <p className="um-sub" style={{ marginTop: 3 }}>
                      {form.role === 'cashier'
                        ? 'POS, inventory check, basic reports'
                        : 'Full branch access, user management, all reports'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 p-6 pt-0">
                <button onClick={closeModal}
                  className="flex-1 bg-white border border-gray-200 py-2.5 rounded-xl transition-all hover:bg-gray-50"
                  style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#3f3f46' }}>
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 bg-[#3b2063] hover:bg-[#2e1850] text-white py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-60"
                  style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {saving
                    ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <><Save size={13} /> {editingUser ? 'Save Changes' : 'Create User'}</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STATUS TOGGLE CONFIRM MODAL ── */}
        {isConfirmModalOpen && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6">
              <div className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-4 ${selectedUser.status === 'ACTIVE' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                <AlertCircle size={26} />
              </div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1a0f2e', letterSpacing: '-0.03em', textAlign: 'center', marginBottom: 6 }}>
                {selectedUser.status === 'ACTIVE' ? 'Deactivate User?' : 'Activate User?'}
              </h3>
              <p className="um-sub" style={{ textAlign: 'center', marginBottom: 8 }}>
                {selectedUser.status === 'ACTIVE' ? 'This will revoke system access for' : 'This will restore system access for'}
              </p>
              <div className="flex justify-center mb-5">
                <span className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg">
                  <div className="w-6 h-6 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center"
                    style={{ fontSize: '0.6rem', fontWeight: 800 }}>
                    {selectedUser.name.charAt(0)}
                  </div>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1a0f2e' }}>{selectedUser.name}</span>
                  <span className="um-sub">{selectedUser.email}</span>
                </span>
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setIsConfirmModalOpen(false); setSelectedUser(null); }}
                  className="flex-1 bg-white border border-gray-200 py-2.5 rounded-xl transition-all hover:bg-gray-50"
                  style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#3f3f46' }}>
                  Cancel
                </button>
                <button onClick={confirmStatusToggle} disabled={saving}
                  className={`flex-1 py-2.5 rounded-xl text-white transition-all disabled:opacity-60 flex items-center justify-center gap-2 ${selectedUser.status === 'ACTIVE' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                  style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {saving
                    ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : selectedUser.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
};

export default UserManagement;