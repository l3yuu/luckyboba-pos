"use client"

import React, { useState, useRef } from 'react';
import {
  Users, Plus, Trash2, Edit3, X, Save, Shield, GripVertical,
  Search, CheckCircle2, CircleDashed, AlertCircle,
  Clock, UserCheck, UserX, Key, ChevronDown
} from 'lucide-react';

// ─── Same font tokens as BranchManagerDashboard ───────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');
  .um-root, .um-root * { font-family: 'DM Sans', sans-serif !important; box-sizing: border-box; }

  /* tiny uppercase label */
  .um-label {
    font-size: 0.62rem; font-weight: 700;
    letter-spacing: 0.16em; text-transform: uppercase; color: #3f3f46;
  }
  /* muted sub-text */
  .um-sub { font-size: 0.65rem; font-weight: 400; color: #71717a; }

  /* big bold value */
  .um-value { font-size: 1.9rem; font-weight: 800; letter-spacing: -0.035em; line-height: 1; }

  /* live pill */
  .um-live {
    display: inline-flex; align-items: center; gap: 5px;
    background: #f0fdf4; border: 1px solid #bbf7d0;
    border-radius: 100px; padding: 4px 10px;
  }
  .um-live-dot {
    width: 5px; height: 5px; border-radius: 50%; background: #22c55e;
    box-shadow: 0 0 5px rgba(34,197,94,0.6); animation: um-pulse 2s infinite;
  }
  .um-live-text {
    font-size: 0.55rem; font-weight: 700;
    letter-spacing: 0.16em; text-transform: uppercase; color: #16a34a;
  }
  @keyframes um-pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }

  /* tab buttons */
  .um-tab {
    font-size: 0.6rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
    padding: 6px 13px; border-radius: 0.4rem; border: none; cursor: pointer;
    transition: background 0.12s, color 0.12s, box-shadow 0.12s;
  }
  .um-tab-on  { background: #1a0f2e; color: #fff; }
  .um-tab-off { background: transparent; color: #a1a1aa; }
  .um-tab-off:hover { background: #ede8ff; color: #3b2063; }

  /* badge pill */
  .um-pill {
    font-size: 0.58rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
    border-radius: 100px; padding: 3px 9px; border: 1px solid #e4e4e7;
    background: #f4f4f5; color: #71717a;
  }

  /* column header */
  .um-col-hdr {
    font-size: 0.6rem; font-weight: 700;
    letter-spacing: 0.14em; text-transform: uppercase; color: #a1a1aa;
  }
`;

interface User {
  id: number;
  username: string;
  name: string;
  position: string;
  lastLogin: string;
  status: 'Active' | 'Inactive';
  loginCount?: number;
  createdAt?: string;
}

const UserManagement: React.FC = () => {
  const [isModalOpen, setIsModalOpen]           = useState(false);
  const [editingUser, setEditingUser]           = useState<User | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedUser, setSelectedUser]         = useState<User | null>(null);
  const [searchQuery, setSearchQuery]           = useState('');
  const [filterStatus, setFilterStatus]         = useState<'All' | 'Active' | 'Inactive'>('All');
  const [expandedUser, setExpandedUser]         = useState<number | null>(null);

  const [users, setUsers] = useState<User[]>([
    { id: 1, username: "admin_Luigi", name: "Luigi",  position: "SYSTEM ADMIN",   lastLogin: "2026-02-12 10:45 AM", status: "Active",   loginCount: 248, createdAt: "2025-01-15" },
    { id: 2, username: "cashier_01",  name: "Leumar", position: "CASHIER",         lastLogin: "2026-02-11 09:15 PM", status: "Active",   loginCount: 134, createdAt: "2025-03-02" },
  ]);

  const [newUser, setNewUser] = useState({ name: '', username: '', password: '', passwordConfirm: '', position: 'CASHIER' });
  const positionOptions = ["CASHIER", "BRANCH MANAGER"];

  const dragItem     = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const filteredUsers = users.filter(user => {
    const matchSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.position.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === 'All' || user.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const activeCount   = users.filter(u => u.status === 'Active').length;
  const inactiveCount = users.filter(u => u.status === 'Inactive').length;

  const handleSort = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    const _users  = [...users];
    const dragged = _users[dragItem.current];
    _users.splice(dragItem.current, 1);
    _users.splice(dragOverItem.current, 0, dragged);
    setUsers(_users);
    dragItem.current     = null;
    dragOverItem.current = null;
  };

  const handleAddUser = () => {
    if (!newUser.username || !newUser.name || !newUser.password) return;
    if (newUser.password !== newUser.passwordConfirm) { alert("Passwords do not match!"); return; }
    setUsers([...users, {
      id: Date.now(), username: newUser.username, name: newUser.name,
      position: newUser.position, lastLogin: "Never", status: "Active",
      loginCount: 0, createdAt: new Date().toISOString().split('T')[0],
    }]);
    setNewUser({ name: '', username: '', password: '', passwordConfirm: '', position: 'CASHIER' });
    setIsModalOpen(false);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setNewUser({ name: user.name, username: user.username, password: '', passwordConfirm: '', position: user.position });
    setIsModalOpen(true);
  };

  const handleUpdateUser = () => {
    if (!editingUser) return;
    setUsers(users.map(u => u.id === editingUser.id
      ? { ...u, name: newUser.name, username: newUser.username, position: newUser.position } : u));
    setEditingUser(null);
    setNewUser({ name: '', username: '', password: '', passwordConfirm: '', position: 'CASHIER' });
    setIsModalOpen(false);
  };

  const handleDeleteUser    = (id: number) => {
    if (confirm("Are you sure you want to delete this user?")) setUsers(users.filter(u => u.id !== id));
  };
  const handleStatusToggle  = (user: User) => { setSelectedUser(user); setIsConfirmModalOpen(true); };
  const confirmStatusToggle = () => {
    if (!selectedUser) return;
    setUsers(users.map(u => u.id === selectedUser.id
      ? { ...u, status: u.status === 'Active' ? 'Inactive' : 'Active' } : u));
    setIsConfirmModalOpen(false);
    setSelectedUser(null);
  };
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setNewUser({ name: '', username: '', password: '', passwordConfirm: '', position: 'CASHIER' });
  };

  const positionColor: Record<string, string> = {
    'SYSTEM ADMIN':   'bg-violet-50 text-violet-700 border-violet-200',
    'BRANCH MANAGER': 'bg-blue-50 text-blue-700 border-blue-200',
    'CASHIER':        'bg-gray-100 text-gray-600 border-gray-200',
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="um-root w-full flex-1 p-4 md:p-6 flex flex-col gap-5 bg-[#f5f4f8] min-h-full">

        {/* ── SUMMARY STRIP ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Users', value: users.length,         icon: <Users     size={14}/>, color: '#7c3aed', bg: '#ede9fe' },
            { label: 'Active',      value: activeCount,          icon: <UserCheck size={14}/>, color: '#16a34a', bg: '#dcfce7' },
            { label: 'Inactive',    value: inactiveCount,        icon: <UserX     size={14}/>, color: '#dc2626', bg: '#fee2e2' },
            { label: 'Positions',   value: positionOptions.length, icon: <Shield  size={14}/>, color: '#0891b2', bg: '#cffafe' },
          ].map((s, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: s.bg, color: s.color }}>
                {s.icon}
              </div>
              <div>
                <p className="um-label" style={{ color: '#a1a1aa' }}>{s.label}</p>
                <p className="um-value" style={{ fontSize: '1.35rem' }}>{s.value}</p>
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
                type="text" value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by name, username, role…"
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-300 transition-all"
                style={{ fontSize: '0.78rem', fontWeight: 500, color: '#1a0f2e' }}
              />
            </div>
            {/* Status filter tabs */}
            <div className="flex gap-1 p-1 bg-gray-50 border border-gray-100 rounded-lg">
              {(['All', 'Active', 'Inactive'] as const).map(f => (
                <button key={f} onClick={() => setFilterStatus(f)}
                  className={`um-tab ${filterStatus === f ? 'um-tab-on' : 'um-tab-off'}`}>
                  {f}{f !== 'All' && <span className="ml-1 opacity-60">{f === 'Active' ? activeCount : inactiveCount}</span>}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2 bg-[#3b2063] text-white rounded-xl hover:bg-[#2e1850] flex items-center justify-center gap-2 transition-all shadow-sm whitespace-nowrap"
            style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}
          >
            <Plus size={15} strokeWidth={2.5} /> Add User
          </button>
        </div>

        {/* ── USER LIST ── */}
        <div className="flex flex-col gap-2">

          {/* Column Headers */}
          <div className="hidden sm:grid grid-cols-12 px-4 py-2">
            {['', 'User', 'Role', 'Status', 'Last Login', 'Logins', ''].map((h, i) => (
              <div key={i} className={`um-col-hdr ${i === 0 ? 'col-span-1' : i === 1 ? 'col-span-3' : i === 2 ? 'col-span-2' : i === 3 ? 'col-span-2' : i === 4 ? 'col-span-2' : i === 5 ? 'col-span-1' : 'col-span-1 text-right'}`}>
                {h}
              </div>
            ))}
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-16 bg-white border border-gray-100 border-dashed rounded-2xl">
              <Users className="mx-auto h-10 w-10 text-gray-200 mb-3" />
              <p className="um-label" style={{ color: '#a1a1aa' }}>No users found</p>
              <p className="um-sub" style={{ marginTop: 4 }}>Adjust your search or filter.</p>
            </div>
          )}

          {filteredUsers.map((user) => (
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

                  {/* Name + Username */}
                  <div className="col-span-11 sm:col-span-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${user.status === 'Active' ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-400'}`}
                        style={{ fontSize: '0.72rem', fontWeight: 800 }}>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1a0f2e', lineHeight: 1.2 }} className="truncate">{user.name}</p>
                        <p className="um-sub truncate">@{user.username}</p>
                      </div>
                    </div>
                  </div>

                  {/* Position */}
                  <div className="hidden sm:flex col-span-2 items-center">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg border ${positionColor[user.position] || 'bg-gray-100 text-gray-600 border-gray-200'}`}
                      style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                      {user.position}
                    </span>
                  </div>

                  {/* Status */}
                  <div className="hidden sm:flex col-span-2 items-center">
                    <button
                      onClick={() => handleStatusToggle(user)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all hover:opacity-75 ${
                        user.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          : 'bg-gray-50 text-gray-500 border-gray-200'
                      }`}
                      style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}
                    >
                      {user.status === 'Active'
                        ? <CheckCircle2 size={10} className="text-emerald-500" />
                        : <CircleDashed size={10} />}
                      {user.status}
                    </button>
                  </div>

                  {/* Last Login */}
                  <div className="hidden sm:flex col-span-2 items-center gap-1.5">
                    <Clock size={11} className="text-gray-300 shrink-0" />
                    <p className="um-sub truncate">{user.lastLogin}</p>
                  </div>

                  {/* Login Count */}
                  <div className="hidden sm:flex col-span-1 items-center">
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#71717a' }}>
                      {(user.loginCount ?? 0).toLocaleString()}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="hidden sm:flex col-span-1 justify-end items-center gap-1">
                    <button onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
                      className={`p-1.5 rounded-lg transition-colors ${expandedUser === user.id ? 'text-violet-600 bg-violet-50' : 'text-gray-300 hover:text-gray-600 hover:bg-gray-50'}`}>
                      <ChevronDown size={14} className={`transition-transform ${expandedUser === user.id ? 'rotate-180' : ''}`} />
                    </button>
                    <button onClick={() => handleEditUser(user)} className="p-1.5 rounded-lg text-gray-300 hover:text-blue-600 hover:bg-blue-50 transition-colors"><Edit3 size={14} /></button>
                    <button onClick={() => handleDeleteUser(user.id)} className="p-1.5 rounded-lg text-gray-300 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>

              {/* Expanded row */}
              {expandedUser === user.id && (
                <div className="bg-violet-50/50 border border-violet-200 border-t-0 rounded-b-xl px-6 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: 'Member Since', value: user.createdAt || '—',                              icon: <Clock size={12}/> },
                    { label: 'Total Logins', value: `${(user.loginCount ?? 0).toLocaleString()} sessions`, icon: <Key   size={12}/> },
                    { label: 'Position',     value: user.position,                                       icon: <Shield size={12}/> },
                    { label: 'Account Status', value: user.status,
                      icon: user.status === 'Active' ? <CheckCircle2 size={12}/> : <CircleDashed size={12}/> },
                  ].map((detail, di) => (
                    <div key={di} className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 um-label" style={{ color: '#7c3aed' }}>
                        {detail.icon}{detail.label}
                      </div>
                      <p style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1a0f2e' }}>{detail.value}</p>
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

              <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-1.5">
                    <label className="um-label flex items-center gap-1.5"><Users size={12}/> Full Name</label>
                    <input type="text" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all"
                      style={{ fontSize: '0.82rem', color: '#1a0f2e' }}
                      placeholder="Enter full name" />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <label className="um-label flex items-center gap-1.5"><Shield size={12}/> Username</label>
                    <input type="text" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all"
                      style={{ fontSize: '0.82rem', color: '#1a0f2e' }}
                      placeholder="e.g. cashier_02" />
                  </div>
                </div>

                {!editingUser && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="um-label flex items-center gap-1.5"><Key size={12}/> Password</label>
                      <input type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all"
                        style={{ fontSize: '0.82rem', color: '#1a0f2e' }}
                        placeholder="••••••••" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="um-label">Confirm</label>
                      <input type="password" value={newUser.passwordConfirm} onChange={e => setNewUser({...newUser, passwordConfirm: e.target.value})}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all"
                        style={{ fontSize: '0.82rem', color: '#1a0f2e' }}
                        placeholder="••••••••" />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="um-label">Role / Position</label>
                  <select value={newUser.position} onChange={e => setNewUser({...newUser, position: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all"
                    style={{ fontSize: '0.82rem', color: '#1a0f2e' }}>
                    {positionOptions.map(pos => <option key={pos} value={pos}>{pos}</option>)}
                  </select>
                </div>

                {/* Role info box */}
                <div className="bg-violet-50 border border-violet-100 rounded-xl p-3 flex gap-2.5">
                  <Shield size={14} className="text-violet-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="um-label" style={{ color: '#6d28d9' }}>
                      {newUser.position === 'CASHIER' ? 'Cashier Access' : newUser.position === 'BRANCH MANAGER' ? 'Branch Manager Access' : 'Admin Access'}
                    </p>
                    <p className="um-sub" style={{ marginTop: 3 }}>
                      {newUser.position === 'CASHIER'
                        ? 'POS, inventory check, basic reports'
                        : newUser.position === 'BRANCH MANAGER'
                        ? 'Full branch access, user management, all reports'
                        : 'Full system access'}
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
                <button onClick={editingUser ? handleUpdateUser : handleAddUser}
                  className="flex-1 bg-[#3b2063] hover:bg-[#2e1850] text-white py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
                  style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  <Save size={13} /> {editingUser ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STATUS TOGGLE MODAL ── */}
        {isConfirmModalOpen && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6">
              <div className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-4 ${selectedUser.status === 'Active' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                <AlertCircle size={26} />
              </div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1a0f2e', letterSpacing: '-0.03em', textAlign: 'center', marginBottom: 6 }}>
                {selectedUser.status === 'Active' ? 'Deactivate User?' : 'Activate User?'}
              </h3>
              <p className="um-sub" style={{ textAlign: 'center', marginBottom: 8 }}>
                {selectedUser.status === 'Active' ? 'This will revoke system access for' : 'This will restore system access for'}
              </p>
              <div className="flex justify-center mb-5">
                <span className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg">
                  <div className="w-6 h-6 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center"
                    style={{ fontSize: '0.6rem', fontWeight: 800 }}>
                    {selectedUser.name.charAt(0)}
                  </div>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1a0f2e' }}>{selectedUser.name}</span>
                  <span className="um-sub">@{selectedUser.username}</span>
                </span>
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setIsConfirmModalOpen(false); setSelectedUser(null); }}
                  className="flex-1 bg-white border border-gray-200 py-2.5 rounded-xl transition-all hover:bg-gray-50"
                  style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#3f3f46' }}>
                  Cancel
                </button>
                <button onClick={confirmStatusToggle}
                  className={`flex-1 py-2.5 rounded-xl text-white transition-all ${selectedUser.status === 'Active' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                  style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {selectedUser.status === 'Active' ? 'Deactivate' : 'Activate'}
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