"use client"

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
import {
  LayoutGrid, GitBranch, Users, BarChart2,
  Settings as SettingsIcon, LogOut, HelpCircle, Menu, X,
} from 'lucide-react';

type TabId = 'overview' | 'branches' | 'users' | 'reports' | 'settings';

// ── Confirm Modal ─────────────────────────────────────────────────────────────
interface ConfirmModalProps {
  show:     boolean;
  icon?:    React.ReactNode;
  title:    string;
  desc?:    string;
  action:   () => void;
  btnText?: string;
  cancel:   () => void;
  danger?:  boolean;
}
const ConfirmModal: React.FC<ConfirmModalProps> = ({
  show, icon, title, desc, action, btnText = 'Confirm', cancel, danger = false,
}) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
      <div
        style={{ fontFamily: "'DM Sans', sans-serif" }}
        className="bg-white w-full max-w-sm border border-zinc-200 rounded-[1.25rem] p-8 flex flex-col items-center text-center shadow-2xl"
      >
        {icon && (
          <div className={`w-11 h-11 rounded-[0.625rem] flex items-center justify-center mb-5 ${danger ? 'bg-red-50' : 'bg-[#f5f3ff]'}`}>
            {icon}
          </div>
        )}
        <h3 className="text-[#1a0f2e] font-bold text-base mb-2 tracking-tight">{title}</h3>
        {desc && <p className="text-zinc-500 text-sm font-medium mb-7 leading-relaxed">{desc}</p>}
        <div className="flex flex-col w-full gap-2">
          <button
            onClick={action}
            className={`w-full py-3 text-[10px] font-bold tracking-[0.18em] uppercase text-white transition-all rounded-[0.625rem] active:scale-[0.98] ${
              danger ? 'bg-[#be2525] hover:bg-[#a11f1f]' : 'bg-[#3b2063] hover:bg-[#2a1647]'
            }`}
          >{btnText}</button>
          {cancel && (
            <button
              onClick={cancel}
              className="w-full py-3 text-[10px] font-bold tracking-[0.18em] uppercase text-zinc-500 bg-white border border-zinc-200 hover:bg-zinc-50 transition-all rounded-[0.625rem] active:scale-[0.98]"
            >Cancel</button>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Sidebar Styles ────────────────────────────────────────────────────────────
const SB_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400&display=swap');

  .sa-sb-root, .sa-sb-root * { font-family: 'DM Sans', sans-serif !important; box-sizing: border-box; }

  .sa-sb-scroll { overflow-y: auto; -ms-overflow-style: none; scrollbar-width: none; }
  .sa-sb-scroll::-webkit-scrollbar { display: none; }

  /* ── Desktop: section label ── */
  .sa-sb-sec {
    padding: 14px 14px 3px;
    font-size: 0.58rem; font-weight: 700; letter-spacing: 0.18em;
    text-transform: uppercase; color: #b4b4b8;
  }

  /* ── Desktop: nav item ── */
  .sa-sb-item {
    display: flex; align-items: center; gap: 8px;
    width: 100%; padding: 6.5px 10px; border: none;
    background: transparent; cursor: pointer; text-align: left;
    border-radius: 0.4rem; margin: 0;
    color: #52525b; font-size: 0.8rem; font-weight: 500;
    transition: background 0.12s, color 0.12s;
    position: relative;
  }
  .sa-sb-item:hover  { background: #f5f3ff; color: #3b2063; }
  .sa-sb-item.active { background: #ede8ff; color: #3b2063; font-weight: 600; }
  .sa-sb-item.active::before {
    content: ''; position: absolute; left: 0; top: 18%; bottom: 18%;
    width: 2.5px; background: #3b2063; border-radius: 0 2px 2px 0;
  }
  .sa-sb-icon { flex-shrink: 0; width: 15px; display: flex; align-items: center; justify-content: center; }
  .sa-sb-divider { height: 1px; background: #f0f0f2; margin: 6px 10px; }

  /* ── Mobile: overlay ── */
  @keyframes sa-overlay-in  { from { opacity: 0; } to { opacity: 1; } }
  @keyframes sa-overlay-out { from { opacity: 1; } to { opacity: 0; } }
  .sa-overlay-enter { animation: sa-overlay-in  0.2s ease forwards; }
  .sa-overlay-exit  { animation: sa-overlay-out 0.25s ease forwards; }

  /* ── Mobile: panel slide in / out ── */
  @keyframes sa-panel-in  { from { transform: translateX(-100%); } to { transform: translateX(0); } }
  @keyframes sa-panel-out { from { transform: translateX(0); }      to { transform: translateX(-100%); } }
  .sa-panel-enter { animation: sa-panel-in  0.3s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
  .sa-panel-exit  { animation: sa-panel-out 0.26s cubic-bezier(0.4, 0, 1, 1)    forwards; }

  /* ── Mobile: section label ── */
  .sa-sec {
    padding: 16px 4px 5px;
    font-size: 0.58rem; font-weight: 700; letter-spacing: 0.18em;
    text-transform: uppercase; color: #c4c4c8;
  }

  /* ── Mobile: nav item ── */
  .sa-item {
    display: flex; align-items: center; gap: 14px;
    width: 100%; padding: 13px 14px; border: none;
    background: transparent; cursor: pointer; text-align: left;
    border-radius: 0.75rem; margin: 2px 0;
    color: #3f3f46; font-size: 0.95rem; font-weight: 500;
    transition: background 0.12s, color 0.12s;
    position: relative;
  }
  .sa-item:hover  { background: #f4f2ff; color: #3b2063; }
  .sa-item.active { background: #ede8ff; color: #3b2063; font-weight: 600; }
  .sa-item.active::before {
    content: ''; position: absolute; left: 0; top: 20%; bottom: 20%;
    width: 3px; background: #3b2063; border-radius: 0 3px 3px 0;
  }

  /* ── Mobile: icon box ── */
  .sa-item-icon {
    flex-shrink: 0; width: 38px; height: 38px;
    border-radius: 0.6rem; background: #f4f4f5;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.12s;
  }
  .sa-item.active .sa-item-icon { background: #ddd5ff; }
  .sa-item:hover  .sa-item-icon { background: #ede8ff; }

  /* ── Mobile: logout ── */
  .sa-logout {
    display: flex; align-items: center; gap: 14px;
    width: 100%; padding: 13px 14px; border: none;
    background: transparent; cursor: pointer; text-align: left;
    border-radius: 0.75rem; margin: 2px 0;
    color: #be2525; font-size: 0.95rem; font-weight: 500;
    transition: background 0.12s;
    font-family: 'DM Sans', sans-serif;
  }
  .sa-logout:hover { background: #fff0f0; }
  .sa-logout .sa-item-icon { background: #fff0f0; }

  .sa-divider { height: 1px; background: #f0f0f2; margin: 6px 0; }

  @keyframes sa-sb-spin { to { transform: rotate(360deg); } }
  .sa-sb-spin { animation: sa-sb-spin 0.7s linear infinite; }
`;

// ── Sidebar Component ─────────────────────────────────────────────────────────
interface SidebarProps {
  isSidebarOpen:  boolean;
  setSidebarOpen: (v: boolean) => void;
  activeTab:      TabId;
  setActiveTab:   (t: TabId) => void;
  onLogout:       () => void;
  isLoggingOut:   boolean;
}

const navItems: { id: TabId; label: string; icon: React.ReactNode; mobileIcon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview',          icon: <LayoutGrid size={14} />, mobileIcon: <LayoutGrid size={18} /> },
  { id: 'branches', label: 'Branch Management', icon: <GitBranch  size={14} />, mobileIcon: <GitBranch  size={18} /> },
  { id: 'users',    label: 'User Management',   icon: <Users      size={14} />, mobileIcon: <Users      size={18} /> },
  { id: 'reports',  label: 'Reports',           icon: <BarChart2  size={14} />, mobileIcon: <BarChart2  size={18} /> },
];

const SuperAdminSidebar: React.FC<SidebarProps> = ({
  isSidebarOpen, setSidebarOpen, activeTab, setActiveTab, onLogout, isLoggingOut,
}) => {
  const [isClosing, setIsClosing] = useState(false);

  const closePanel = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      setSidebarOpen(false);
    }, 260);
  };

  const goTo = (id: TabId) => {
    setActiveTab(id);
    if (window.innerWidth < 768) closePanel();
  };

  return (
    <>
      <style>{SB_STYLES}</style>

      {/* ══ DESKTOP SIDEBAR (md+) ══ */}
      <aside className="sa-sb-root fixed inset-y-0 left-0 z-50 w-[240px] bg-white border-r border-zinc-100 flex-col transform transition-transform duration-300 hidden md:flex md:relative md:translate-x-0">

        {/* Brand */}
        <div className="shrink-0 px-4 pt-6 pb-4 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div style={{ width: 32, height: 32, borderRadius: '0.4rem', background: '#3b2063', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#fff', letterSpacing: '0.02em' }}>SA</span>
            </div>
            <div className="text-left">
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1a0f2e', lineHeight: 1.2 }}>Lucky Boba</div>
              <div style={{ fontSize: '0.6rem', fontWeight: 600, color: '#a1a1aa', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Super Admin</div>
            </div>
          </div>
        </div>

        {/* Desktop Nav */}
        <div className="flex-1 sa-sb-scroll min-h-0 px-3 py-2">
          <div className="sa-sb-sec mt-2">Home</div>
          {navItems.map(item => (
            <button key={item.id} onClick={() => goTo(item.id)} className={`sa-sb-item ${activeTab === item.id ? 'active' : ''}`}>
              <span className="sa-sb-icon" style={{ color: activeTab === item.id ? '#3b2063' : '#a1a1aa' }}>{item.icon}</span>
              {item.label}
            </button>
          ))}

          <div className="sa-sb-sec">System</div>
          <button onClick={() => goTo('settings')} className={`sa-sb-item ${activeTab === 'settings' ? 'active' : ''}`}>
            <span className="sa-sb-icon" style={{ color: activeTab === 'settings' ? '#3b2063' : '#a1a1aa' }}><SettingsIcon size={14} /></span>
            Settings
          </button>
        </div>

        {/* Logo */}
        <div className="shrink-0 flex justify-center px-4 pb-4">
          <img src={logo} alt="Lucky Boba" className="h-20 w-auto object-contain" />
        </div>

        {/* Desktop Bottom */}
        <div className="shrink-0 px-3 pb-4 pt-2 border-t border-zinc-100">
          <button className="sa-sb-item" style={{ color: '#71717a' }} onClick={() => window.open('mailto:support@luckyboba.com')}>
            <span className="sa-sb-icon" style={{ color: '#a1a1aa' }}><HelpCircle size={14} /></span>
            Get Help
          </button>
          <div className="sa-sb-divider my-2" />
          <button onClick={onLogout} disabled={isLoggingOut} className="sa-sb-item hover:!bg-red-50 hover:!text-red-600" style={{ color: '#be2525' }}>
            {isLoggingOut ? (
              <>
                <span className="sa-sb-icon">
                  <div className="relative w-3.5 h-3.5">
                    <div className="absolute inset-0 rounded-full border-[1.5px] border-red-200" />
                    <div className="sa-sb-spin absolute inset-0 rounded-full border-[1.5px] border-transparent border-t-[#be2525]" />
                  </div>
                </span>
                Logging out...
              </>
            ) : (
              <>
                <span className="sa-sb-icon"><LogOut size={14} /></span>
                Log out
              </>
            )}
          </button>
          <div className="mt-3 text-[9px] font-bold uppercase tracking-widest text-zinc-300 text-center">
            Lucky Boba 2026
          </div>
        </div>
      </aside>

      {/* ══ MOBILE: full-viewport panel ══ */}
      {(isSidebarOpen || isClosing) && (
        <>
          {/* Backdrop */}
          <div
            className={`${isClosing ? 'sa-overlay-exit' : 'sa-overlay-enter'} md:hidden`}
            onClick={closePanel}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)', zIndex: 40 }}
          />

          {/* Panel */}
          <div
            className={`sa-panel-enter${isClosing ? ' sa-panel-exit' : ''} sa-sb-root md:hidden`}
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: '#fff', zIndex: 50,
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
            }}
          >
            {/* Profile header */}
            <div style={{ padding: '28px 20px 16px', paddingTop: 'max(28px, calc(env(safe-area-inset-top) + 16px))', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #7c3aed, #3b2063)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, boxShadow: '0 0 0 3px #ede8ff',
                  }}>
                    <span style={{ fontSize: '1rem', fontWeight: 800, color: '#fff' }}>SA</span>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: '#a1a1aa', fontWeight: 500, marginBottom: 1 }}>Hello,</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1a0f2e', lineHeight: 1.2 }}>Super Admin</div>
                    <div style={{ fontSize: '0.68rem', color: '#a1a1aa', fontWeight: 500, marginTop: 1 }}>Lucky Boba</div>
                  </div>
                </div>
                <button
                  onClick={closePanel}
                  style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: '#f4f4f5', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                >
                  <X size={14} color="#71717a" />
                </button>
              </div>
            </div>

            <div className="sa-divider" style={{ margin: '0 20px' }} />

            {/* Mobile Nav */}
            <div className="sa-sb-scroll" style={{ flex: 1, minHeight: 0, padding: '8px 14px' }}>
              <div className="sa-sec">Home</div>
              {navItems.map(item => (
                <button key={item.id} onClick={() => goTo(item.id)} className={`sa-item ${activeTab === item.id ? 'active' : ''}`}>
                  <span className="sa-item-icon">{item.mobileIcon}</span>
                  {item.label}
                </button>
              ))}

              <div className="sa-sec">System</div>
              <button onClick={() => goTo('settings')} className={`sa-item ${activeTab === 'settings' ? 'active' : ''}`}>
                <span className="sa-item-icon"><SettingsIcon size={18} color={activeTab === 'settings' ? '#3b2063' : '#71717a'} /></span>
                Settings
              </button>
            </div>

            {/* Mobile Bottom */}
            <div style={{ flexShrink: 0, padding: '8px 14px', paddingBottom: 'max(24px, env(safe-area-inset-bottom))', borderTop: '1px solid #f0f0f2' }}>
              <button className="sa-item" style={{ color: '#71717a' }} onClick={() => window.open('mailto:support@luckyboba.com')}>
                <span className="sa-item-icon"><HelpCircle size={18} color="#a1a1aa" /></span>
                Get Help
              </button>
              <button onClick={onLogout} disabled={isLoggingOut} className="sa-logout">
                {isLoggingOut ? (
                  <>
                    <span className="sa-item-icon">
                      <div style={{ position: 'relative', width: 16, height: 16 }}>
                        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1.5px solid #fca5a5' }} />
                        <div className="sa-sb-spin" style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1.5px solid transparent', borderTopColor: '#be2525' }} />
                      </div>
                    </span>
                    Logging out...
                  </>
                ) : (
                  <>
                    <span className="sa-item-icon"><LogOut size={18} color="#be2525" /></span>
                    Log out
                  </>
                )}
              </button>
              <div style={{ marginTop: 14, fontSize: '0.56rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#d4d4d8', textAlign: 'center' }}>
                Lucky Boba 2026
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

// ── Root Page ─────────────────────────────────────────────────────────────────
const SuperAdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab]       = useState<TabId>('overview');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const {
    branches, loading: branchLoading, error: branchError,
    createBranch, updateBranch, deleteBranch,
  } = useBranches();

  const usersHook = useUsers();

  const [form, setForm]             = useState<BranchFormState>(EMPTY_BRANCH_FORM);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit]     = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [viewBranch, setViewBranch] = useState<Branch | null>(null);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const closeModal = () => { setShowCreate(false); setShowEdit(false); setModalError(null); };

  const handleLogoutClick = () => setIsLogoutModalOpen(true);

  const confirmLogout = async () => {
    setIsLoggingOut(true);
    setIsLogoutModalOpen(false);
    ['auth_token', 'lucky_boba_token', 'token', 'user_role', 'lucky_boba_authenticated']
      .forEach(k => localStorage.removeItem(k));
    sessionStorage.clear();
    window.location.href = '/login';
  };

  const openCreate = () => { setForm(EMPTY_BRANCH_FORM); setModalError(null); setShowCreate(true); };
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
      if (form.id === null) await createBranch(payload);
      else await updateBranch(form.id, payload);
      closeModal();
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : 'Something went wrong.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this branch? This cannot be undone.')) return;
    try { await deleteBranch(id); } catch { /* surfaced via branchError */ }
  };

  const totalRevenue   = branches.reduce((s, b) => s + (parseFloat(String(b.total_sales)) || 0), 0);
  const todayRevenue   = branches.reduce((s, b) => s + (parseFloat(String(b.today_sales)) || 0), 0);
  const activeBranches = branches.filter(b => b.status === 'active').length;
  const activeUsers    = usersHook.users.filter((u: { status: string }) => u.status === 'ACTIVE').length;

  const isModalOpen = showCreate || showEdit;

  const pageTitle: Record<TabId, string> = {
    overview: 'Dashboard Overview',
    branches: 'Branch Management',
    users:    'User Management',
    reports:  'System Reports',
    settings: 'System Settings',
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return <OverviewTab totalRevenue={totalRevenue} todayRevenue={todayRevenue} activeBranches={activeBranches} activeUsers={activeUsers} branches={branches} loading={branchLoading} />;
      case 'branches': return <BranchesTab branches={branches} loading={branchLoading} error={branchError} onCreateBranch={openCreate} onEditBranch={openEdit} onDeleteBranch={handleDelete} />;
      case 'users':    return <UsersTab {...usersHook} />;
      case 'reports':  return <ReportsTab />;
      case 'settings': return <SettingsTab />;
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#f5f4f8] font-sans overflow-hidden">

      {/* Mobile header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shrink-0">
        <img src={logo} alt="Lucky Boba" className="h-8 w-auto object-contain" />
        <button
          onClick={() => setSidebarOpen(!isSidebarOpen)}
          className="p-2 rounded-md text-[#3b2063] hover:bg-[#f5f3ff] transition-colors"
        >
          <Menu size={20} strokeWidth={2} />
        </button>
      </div>

      <SuperAdminSidebar
        isSidebarOpen={isSidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogoutClick}
        isLoggingOut={isLoggingOut}
      />

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <div className="shrink-0 flex items-center justify-between px-6 md:px-10 py-4 bg-white border-b border-gray-200 shadow-sm min-h-[72px]">
          <div className="flex items-center gap-3">
            <h1 className="font-semibold text-[0.95rem] text-[#3b2063]">{pageTitle[activeTab]}</h1>
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-100 px-2 py-1 rounded-md">
              {new Date().toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {branchLoading && (
              <div className="flex items-center gap-2 text-[#3b2063]">
                <div className="w-3.5 h-3.5 border-2 border-[#3b2063] border-t-transparent rounded-full animate-spin" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hidden sm:block">Loading…</span>
              </div>
            )}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><path strokeLinecap="round" d="M12 6v6l4 2"/></svg>
              Last updated: {new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black tracking-widest text-emerald-700 uppercase">Live</span>
            </div>
          </div>
        </div>

        {/* Error banner */}
        {branchError && (
          <div className="mx-6 md:mx-10 mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl">
            <p className="text-sm text-red-600 font-bold">{branchError}</p>
          </div>
        )}

        <div className="flex-1 overflow-auto">
          {renderContent()}
        </div>
      </main>

      {/* Branch Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-base font-black text-[#3b2063]">{showCreate ? 'Add Branch' : 'Edit Branch'}</h2>
                <p className="text-xs text-gray-400 mt-0.5">{showCreate ? 'Register a new branch location' : 'Update branch details'}</p>
              </div>
              <button onClick={closeModal} disabled={branchLoading} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50">
                <X size={18} />
              </button>
            </div>
            {modalError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-600 font-bold">{modalError}</p>
              </div>
            )}
            <form onSubmit={handleSave} className="space-y-4">
              {[
                { label: 'Branch Name', key: 'name',     placeholder: 'e.g. Lucky Boba – SM City' },
                { label: 'Location',    key: 'location', placeholder: 'e.g. SM City Cebu' },
              ].map(f => (
                <div key={f.key} className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">{f.label}</label>
                  <input
                    type="text" required disabled={branchLoading}
                    placeholder={f.placeholder}
                    value={form[f.key as keyof BranchFormState] as string}
                    onChange={e => setForm((prev: BranchFormState) => ({ ...prev, [f.key]: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all"
                  />
                </div>
              ))}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Status</label>
                <select
                  disabled={branchLoading}
                  value={form.status}
                  onChange={e => setForm((prev: BranchFormState) => ({ ...prev, status: e.target.value as 'active' | 'inactive' }))}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} disabled={branchLoading}
                  className="flex-1 bg-white border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-50 disabled:opacity-50 transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={branchLoading}
                  className="flex-1 bg-violet-600 hover:bg-violet-700 text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 transition-all">
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
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h2 className="text-base font-black text-[#3b2063]">Branch Details</h2>
              <button onClick={() => setViewBranch(null)} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Branch Name', value: viewBranch.name },
                { label: 'Location',    value: viewBranch.location },
              ].map(d => (
                <div key={d.label}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">{d.label}</p>
                  <p className="text-sm font-bold text-[#3b2063]">{d.value}</p>
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase ${viewBranch.status === 'active' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                    {viewBranch.status}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Branch ID</p>
                  <p className="text-sm font-bold text-[#3b2063]">#{viewBranch.id}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Today's Sales</p>
                  <p className="text-lg font-black text-emerald-500">₱{(parseFloat(String(viewBranch.today_sales)) || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Total Sales</p>
                  <p className="text-lg font-black text-[#3b2063]">₱{(parseFloat(String(viewBranch.total_sales)) || 0).toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="pt-2 flex justify-end">
              <button onClick={() => setViewBranch(null)}
                className="px-6 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 transition-all">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        show={isLogoutModalOpen}
        icon={<LogOut size={19} className="text-[#be2525]" />}
        title="End Session?"
        desc="Are you sure you want to log out of the terminal?"
        action={confirmLogout}
        btnText="Logout"
        cancel={() => setIsLogoutModalOpen(false)}
        danger
      />
    </div>
  );
};

export default SuperAdminDashboard;