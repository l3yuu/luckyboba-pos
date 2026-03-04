import React, { useState } from 'react';
import logo from '../assets/logo.png';
import type { Branch } from '../services/BranchService';
import { useBranches, type BranchFormState, EMPTY_BRANCH_FORM } from '../hooks/useBranches';
import { useUsers } from '../hooks/useUsers';
import {
  OverviewTab,
  BranchesTab,
  UsersTab,
  ReportsTab,
  SettingsTab,
} from '../components/SuperAdmin/tabs';
import * as Icons from '../components/SuperAdmin/icons';

type TabId = 'overview' | 'branches' | 'users' | 'reports' | 'settings';

const SuperAdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab]       = useState<TabId>('overview');
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // ── Real API hooks ──────────────────────────────────────────────────────
  const {
    branches,
    loading: branchLoading,
    error:   branchError,
    createBranch,
    updateBranch,
    deleteBranch,
  } = useBranches();

  const usersHook = useUsers();

  // ── Modal state ─────────────────────────────────────────────────────────
  const [form, setForm]                 = useState<BranchFormState>(EMPTY_BRANCH_FORM);
  const [showCreate, setShowCreate]     = useState(false);
  const [showEdit, setShowEdit]         = useState(false);
  const [modalError, setModalError]     = useState<string | null>(null);
  const [viewBranch, setViewBranch]     = useState<Branch | null>(null);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // ── Helpers ─────────────────────────────────────────────────────────────
  const closeModal = () => {
    setShowCreate(false);
    setShowEdit(false);
    setModalError(null);
  };

  const handleLogout = () => {
    setIsLogoutModalOpen(true);
  };

  const confirmLogout = () => {
    ['auth_token', 'lucky_boba_token', 'token', 'user_role', 'lucky_boba_authenticated']
      .forEach(k => localStorage.removeItem(k));
    sessionStorage.clear();
    window.location.href = '/login';
  };

  // ── Branch CRUD ─────────────────────────────────────────────────────────
  const openCreate = () => {
    setForm(EMPTY_BRANCH_FORM);
    setModalError(null);
    setShowCreate(true);
  };

  const openEdit = (branch: Branch) => {
    setForm({ id: branch.id, name: branch.name, location: branch.location, status: branch.status });
    setModalError(null);
    setShowEdit(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    const payload = { name: form.name, location: form.location, status: form.status };

    try {
      if (form.id === null) {
        await createBranch(payload);
      } else {
        await updateBranch(form.id, payload);
      }
      closeModal();
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : 'Something went wrong.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this branch? This cannot be undone.')) return;
    try {
      await deleteBranch(id);
    } catch {
      // error is surfaced via branchError banner
    }
  };

  // ── Derived stats ────────────────────────────────────────────────────────
  const totalRevenue   = branches.reduce((s, b) => s + (parseFloat(String(b.total_sales)) || 0), 0);
  const todayRevenue   = branches.reduce((s, b) => s + (parseFloat(String(b.today_sales)) || 0), 0);
  const activeBranches = branches.filter(b => b.status === 'active').length;
  const activeUsers    = usersHook.users.filter((u: { status: string }) => u.status === 'ACTIVE').length;

  const navItems = [
    { id: 'overview', label: 'Overview', icon: <Icons.DashboardIcon /> },
    { id: 'branches', label: 'Branches', icon: <Icons.BranchIcon /> },
    { id: 'users',    label: 'Users',    icon: <Icons.UsersIcon /> },
    { id: 'reports',  label: 'Reports',  icon: <Icons.ReportsIcon /> },
    { id: 'settings', label: 'Settings', icon: <Icons.SettingsIcon /> },
  ];

  const isModalOpen = showCreate || showEdit;

  // ── Render ───────────────────────────────────────────────────────────────
  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <OverviewTab
            totalRevenue={totalRevenue}
            todayRevenue={todayRevenue}
            activeBranches={activeBranches}
            activeUsers={activeUsers}
            branches={branches}
            loading={branchLoading}
          />
        );
      case 'branches':
        return (
          <BranchesTab
            branches={branches}
            loading={branchLoading}
            error={branchError}
            onCreateBranch={openCreate}
            onEditBranch={openEdit}
            onDeleteBranch={handleDelete}
          />
        );
      case 'users':
        return <UsersTab {...usersHook} />;
      case 'reports':
        return <ReportsTab />;
      case 'settings':
        return <SettingsTab />;
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#f8f6ff] text-zinc-900 font-sans overflow-hidden">

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-zinc-200">
        <img src={logo} alt="Logo" className="h-8 w-auto object-contain" />
        <button onClick={() => setSidebarOpen(p => !p)} className="p-2 text-[#3b2063]">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-zinc-200
        transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 flex flex-col
        rounded-r-[2rem] md:rounded-r-[1.5rem] overflow-hidden
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col flex-1 overflow-y-auto">
          <div className="px-6 pt-10 flex flex-col items-center shrink-0">
            <img src={logo} alt="Lucky Boba Logo" className="w-55 h-auto object-contain mb-2 hidden md:block" />
            <div className="text-[#3b2063] font-black uppercase text-[9px] tracking-[0.3em] opacity-60 mb-2 text-center">Super Admin</div>
            <div className="bg-[#fbbf24] text-[#3b2063] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider mb-8">Master Control</div>
          </div>

          <nav className="w-full px-6 space-y-2 pb-6">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as TabId);
                  if (window.innerWidth < 768) setSidebarOpen(false);
                }}
                className={`w-full px-5 py-3 rounded-2xl font-black text-[13px] uppercase tracking-wider flex items-center transition-all duration-200 ${
                  activeTab === item.id
                    ? 'bg-[#f0ebff] text-[#3b2063]'
                    : 'text-zinc-400 hover:bg-[#f0ebff] hover:text-[#3b2063]'
                }`}
              >
                <span className="w-4 h-4 mr-3">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="shrink-0 px-6 pb-8">
          <button
            onClick={handleLogout}
            className="flex items-center justify-center w-full px-6 py-4 rounded-2xl bg-[#be2525] hover:bg-[#a11f1f] text-white text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-md group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4 mr-3 group-hover:-translate-x-1 transition-transform">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
            Logout
          </button>
          <div className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 text-center mt-4">Lucky Boba 2026</div>
        </div>

        <button onClick={() => setSidebarOpen(false)} className="md:hidden absolute top-4 right-4 text-zinc-400 text-xs font-bold">CLOSE</button>
      </aside>

      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 md:px-10 py-6 md:py-8 gap-4">
          <div>
            <h1 className="text-xl md:text-4xl font-black text-[#3b2063] uppercase tracking-tight">
              {activeTab === 'overview' && 'Dashboard Overview'}
              {activeTab === 'branches' && 'Branch Management'}
              {activeTab === 'users'    && 'User Management'}
              {activeTab === 'reports'  && 'System Reports'}
              {activeTab === 'settings' && 'System Settings'}
            </h1>
            <p className="text-zinc-400 font-bold text-[9px] md:text-[10px] uppercase tracking-[0.2em] mt-1">
              Super Administrator Panel
            </p>
          </div>

          {branchLoading && (
            <div className="flex items-center gap-2 text-[#3b2063]">
              <div className="w-4 h-4 border-2 border-[#3b2063] border-t-transparent rounded-full animate-spin" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Loading…</span>
            </div>
          )}
        </header>

        {/* Global error banner */}
        {branchError && (
          <div className="mx-6 md:mx-10 mb-4 p-4 bg-red-50 border border-red-200 rounded-2xl">
            <p className="text-sm text-red-600 font-bold">{branchError}</p>
          </div>
        )}

        {renderContent()}

        {/* Branch Create / Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-[#3b2063] uppercase tracking-wider">
                  {showCreate ? 'Add Branch' : 'Edit Branch'}
                </h2>
                <button onClick={closeModal} disabled={branchLoading} className="text-zinc-400 hover:text-zinc-600 disabled:opacity-50">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {modalError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-600 font-bold">{modalError}</p>
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Branch Name</label>
                  <input
                    type="text" required disabled={branchLoading}
                    placeholder="e.g. Lucky Boba – SM City"
                    value={form.name}
                    onChange={e => setForm((f: BranchFormState) => ({ ...f, name: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-2xl border border-zinc-200 text-sm font-bold text-[#3b2063] bg-zinc-50 focus:outline-none focus:border-[#3b2063] focus:ring-2 focus:ring-[#3b2063]/10"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Location</label>
                  <input
                    type="text" required disabled={branchLoading}
                    placeholder="e.g. SM City Cebu"
                    value={form.location}
                    onChange={e => setForm((f: BranchFormState) => ({ ...f, location: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-2xl border border-zinc-200 text-sm font-bold text-[#3b2063] bg-zinc-50 focus:outline-none focus:border-[#3b2063] focus:ring-2 focus:ring-[#3b2063]/10"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Status</label>
                  <select
                    disabled={branchLoading}
                    value={form.status}
                    onChange={e => setForm((f: BranchFormState) => ({ ...f, status: e.target.value as 'active' | 'inactive' }))}
                    className="w-full px-4 py-2.5 rounded-2xl border border-zinc-200 text-sm font-bold text-[#3b2063] bg-zinc-50 focus:outline-none focus:border-[#3b2063] focus:ring-2 focus:ring-[#3b2063]/10"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="pt-2 flex justify-end gap-3">
                  <button type="button" onClick={closeModal} disabled={branchLoading}
                    className="px-4 py-2 rounded-2xl border border-zinc-200 text-xs font-bold uppercase text-zinc-500 hover:bg-zinc-50 disabled:opacity-50">
                    Cancel
                  </button>
                  <button type="submit" disabled={branchLoading}
                    className="px-6 py-2 rounded-2xl bg-[#3b2063] text-white text-xs font-black uppercase tracking-widest hover:bg-[#2a174a] disabled:opacity-50 flex items-center gap-2">
                    {branchLoading && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                    {showCreate ? 'Create Branch' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Branch Modal */}
        {viewBranch && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-[#3b2063] uppercase tracking-wider">Branch Details</h2>
                <button onClick={() => setViewBranch(null)} className="text-zinc-400 hover:text-zinc-600">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Branch Name</p>
                  <p className="text-sm font-bold text-[#3b2063]">{viewBranch.name}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Location</p>
                  <p className="text-sm font-bold text-[#3b2063]">{viewBranch.location}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Status</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                      viewBranch.status === 'active' ? 'bg-emerald-100 text-emerald-600' : 'bg-zinc-100 text-zinc-500'
                    }`}>
                      {viewBranch.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Branch ID</p>
                    <p className="text-sm font-bold text-[#3b2063]">#{viewBranch.id}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Today's Sales</p>
                    <p className="text-lg font-black text-emerald-500">₱{(parseFloat(String(viewBranch.today_sales)) || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Total Sales</p>
                    <p className="text-lg font-black text-[#3b2063]">₱{(parseFloat(String(viewBranch.total_sales)) || 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>
              <div className="pt-2 flex justify-end">
                <button onClick={() => setViewBranch(null)}
                  className="px-6 py-2 rounded-2xl bg-[#3b2063] text-white text-xs font-black uppercase tracking-widest hover:bg-[#2a174a]">
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-red-500 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
              <h2 className="text-white font-black text-[9px] sm:text-[10px] uppercase tracking-[0.2em]">Confirm Logout</h2>
              <button
                onClick={() => setIsLogoutModalOpen(false)}
                className="text-white/70 hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-red-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-800">Logout from System?</h3>
                <p className="text-sm text-slate-600">Are you sure you want to logout from the Super Admin system?</p>
                <p className="text-xs text-zinc-500">You will need to login again to access the system.</p>
              </div>
              <div className="flex gap-2 sm:gap-3 pt-2">
                <button
                  onClick={() => setIsLogoutModalOpen(false)}
                  className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-500 py-2 sm:py-3 rounded-xl font-black text-[9px] sm:text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLogout}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 sm:py-3 rounded-xl font-black text-[9px] sm:text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                  </svg>
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;