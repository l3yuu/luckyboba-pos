import React, { useEffect, useState } from 'react';
import logo from '../assets/logo.png';

import { useBranches } from '../hooks/useBranches';
import { useUsers }    from '../hooks/useUsers';

import UserService from '../services/UserService';

import { OverviewTab }  from '../components/SuperAdmin/tabs/OverviewTab';
import BranchesTab      from '../components/SuperAdmin/tabs/BranchesTab';
import { UsersTab }     from '../components/SuperAdmin/tabs/UsersTab';
import { ReportsTab }   from '../components/SuperAdmin/tabs/ReportsTab';
import { SettingsTab }  from '../components/SuperAdmin/tabs/SettingsTab';

import {
  DashboardIcon,
  BranchIcon,
  UsersIcon,
  ReportsIcon,
  SettingsIcon,
} from '../components/SuperAdmin/icons';

// ── Types ──────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'branches' | 'users' | 'reports' | 'settings';

const TAB_TITLES: Record<Tab, string> = {
  overview: 'Dashboard Overview',
  branches: 'Branch Management',
  users:    'User Management',
  reports:  'System Reports',
  settings: 'System Settings',
};

const NAV_ITEMS: { id: Tab; label: string; Icon: () => React.ReactElement }[] = [
  { id: 'overview', label: 'Overview',  Icon: DashboardIcon },
  { id: 'branches', label: 'Branches',  Icon: BranchIcon    },
  { id: 'users',    label: 'Users',     Icon: UsersIcon     },
  { id: 'reports',  label: 'Reports',   Icon: ReportsIcon   },
  { id: 'settings', label: 'Settings',  Icon: SettingsIcon  },
];

// ── Component ──────────────────────────────────────────────────────────────

const SuperAdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab]   = useState<Tab>('overview');
  const [isSidebarOpen, setSidebar] = useState(false);

  const branches = useBranches();
  const users    = useUsers();

  const { fetchBranches } = branches;
  const { fetchUsers }    = users;

  useEffect(() => {
    if (activeTab === 'overview' || activeTab === 'branches') fetchBranches();
  }, [activeTab, fetchBranches]);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
  }, [activeTab, fetchUsers]);

  // Derived stats for the overview
  const totalRevenue   = branches.branches.reduce((s, b) => s + (parseFloat(String(b.total_sales)) || 0), 0);
  const todayRevenue   = branches.branches.reduce((s, b) => s + (parseFloat(String(b.today_sales)) || 0), 0);
  const activeBranches = branches.branches.filter(b => b.status === 'active').length;
  const activeUsers    = users.users.filter(u => u.status === 'ACTIVE').length;

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    if (window.innerWidth < 768) setSidebar(false);
  };

  const handleLogout = () => {
    UserService.logout();
    window.location.reload();
  };

  // ── Tab content ────────────────────────────────────────────────────────────
  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <OverviewTab
            totalRevenue={totalRevenue}
            todayRevenue={todayRevenue}
            activeBranches={activeBranches}
            activeUsers={activeUsers}
            branches={branches.branches}
            loading={branches.loading}
          />
        );
      case 'branches':
        return (
          <BranchesTab
            branches={branches.branches}
            onCreateBranch={branches.openCreate}
            onEditBranch={branches.openEdit}
            onDeleteBranch={(id: number) => {
              const branch = branches.branches.find(b => b.id === id);
              if (branch) branches.deleteBranch(branch);
            }}
          />
        );
      case 'users':    return <UsersTab    {...users}    />;
      case 'reports':  return <ReportsTab />;
      case 'settings': return <SettingsTab />;
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#f8f6ff] text-zinc-900 font-sans overflow-hidden">

      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-zinc-200">
        <img src={logo} alt="Logo" className="h-8 w-auto object-contain" />
        <button onClick={() => setSidebar(!isSidebarOpen)} className="p-2 text-[#3b2063]">
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
            <p className="text-[#3b2063] font-black uppercase text-[9px] tracking-[0.3em] opacity-60 mb-2 text-center">Super Admin</p>
            <div className="bg-[#fbbf24] text-[#3b2063] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider mb-8">
              Master Control
            </div>
          </div>

          <nav className="w-full px-6 space-y-2 pb-6">
            {NAV_ITEMS.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => handleTabChange(id)}
                className={`w-full px-5 py-3 rounded-2xl font-black text-[13px] uppercase tracking-wider flex items-center transition-all duration-200 ${
                  activeTab === id
                    ? 'bg-[#f0ebff] text-[#3b2063]'
                    : 'text-zinc-400 hover:bg-[#f0ebff] hover:text-[#3b2063]'
                }`}
              >
                <span className="w-4 h-4 mr-3"><Icon /></span>
                {label}
              </button>
            ))}
          </nav>
        </div>

        <div className="shrink-0 px-6 pb-8">
          <button
            onClick={handleLogout}
            className="flex items-center justify-center w-full px-6 py-4 rounded-2xl bg-[#be2525] hover:bg-[#a11f1f] text-white text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-200 shadow-md shadow-red-900/10 group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4 mr-3 group-hover:-translate-x-1 transition-transform">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
            Logout
          </button>
          <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 text-center mt-4">Lucky Boba 2026</p>
        </div>

        <button onClick={() => setSidebar(false)} className="md:hidden absolute top-4 right-4 text-zinc-400 text-xs font-bold">CLOSE</button>
      </aside>

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden" onClick={() => setSidebar(false)} />
      )}

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 md:px-10 py-6 md:py-8 gap-4">
          <div>
            <h1 className="text-xl md:text-4xl font-black text-[#3b2063] uppercase tracking-tight">
              {TAB_TITLES[activeTab]}
            </h1>
            <p className="text-zinc-400 font-bold text-[9px] md:text-[10px] uppercase tracking-[0.2em] mt-1">
              Super Administrator Panel
            </p>
          </div>
        </header>

        {renderContent()}
      </main>
    </div>
  );
};

export default SuperAdminDashboard;
