import React, { useState, useEffect } from 'react';
import logo from '../../assets/logo.png';
import type { User, CreateUserData, UpdateUserData } from '../../types/user';
import UserService from '../../services/UserService';
import {
  OverviewTab,
  BranchesTab,
  UsersTab,
  ReportsTab,
  SettingsTab,
} from './tabs';
import * as Icons from './icons';

// Types
interface Branch {
  id: number;
  name: string;
  location: string;
  status: 'active' | 'inactive';
  totalSales: number;
  todaySales: number;
}

type BranchFormState = {
  id: number | null;
  name: string;
  location: string;
  status: 'active' | 'inactive';
  totalSales: number;
  todaySales: number;
};

// Mock Data
const mockBranches: Branch[] = [
  { id: 1, name: 'Lucky Boba - SM City', location: 'SM City Cebu', status: 'active', totalSales: 125000, todaySales: 4500 },
  { id: 2, name: 'Lucky Boba - Ayala', location: 'Ayala Center', status: 'active', totalSales: 98000, todaySales: 3200 },
  { id: 3, name: 'Lucky Boba - IT Park', location: 'Cebu IT Park', status: 'active', totalSales: 87500, todaySales: 2800 },
  { id: 4, name: 'Lucky Boba - Banilad', location: 'Banilad Town Center', status: 'inactive', totalSales: 45000, todaySales: 0 },
];

const SuperAdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'branches' | 'users' | 'reports' | 'settings'>('overview');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [branches, setBranches] = useState<Branch[]>(mockBranches);
  const [branchFormState, setBranchFormState] = useState<BranchFormState>({
    id: null,
    name: '',
    location: '',
    status: 'active',
    totalSales: 0,
    todaySales: 0,
  });
  const [isCreateBranchModalOpen, setIsCreateBranchModalOpen] = useState(false);
  const [isUpdateBranchModalOpen, setIsUpdateBranchModalOpen] = useState(false);
  const [viewBranch, setViewBranch] = useState<Branch | null>(null);

  // Fetch users on mount
  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedUsers = await UserService.getAllUsers();
      setUsers(fetchedUsers);
    } catch (err) {
      setError('Failed to load users. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('lucky_boba_token');
    localStorage.removeItem('token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('lucky_boba_authenticated');
    sessionStorage.clear();
    window.location.href = '/login';
  };

  const handleCreateUser = async (data: CreateUserData) => {
    try {
      setLoading(true);
      const newUser = await UserService.createUser(data);
      setUsers((prev) => [newUser, ...prev]);
      return newUser;
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : 'Failed to create user') || 'Failed to create user');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (id: number, data: UpdateUserData) => {
    try {
      setLoading(true);
      const updatedUser = await UserService.updateUser(id, data);
      setUsers((prev) => prev.map((u) => (u.id === id ? updatedUser : u)));
      return updatedUser;
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : 'Failed to update user') || 'Failed to update user');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id: number) => {
    try {
      setLoading(true);
      await UserService.deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : 'Failed to delete user') || 'Failed to delete user');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Branch management functions
  const handleCreateBranch = () => {
    setBranchFormState({
      id: null,
      name: '',
      location: '',
      status: 'active',
      totalSales: 0,
      todaySales: 0,
    });
    setIsCreateBranchModalOpen(true);
  };

  const handleEditBranch = (branch: Branch) => {
    setBranchFormState({
      id: branch.id,
      name: branch.name,
      location: branch.location,
      status: branch.status,
      totalSales: branch.totalSales,
      todaySales: branch.todaySales,
    });
    setIsUpdateBranchModalOpen(true);
  };

  const handleSaveBranch = () => {
    if (branchFormState.id === null) {
      const newBranch: Branch = {
        id: branches.length > 0 ? Math.max(...branches.map(b => b.id)) + 1 : 1,
        name: branchFormState.name,
        location: branchFormState.location,
        status: branchFormState.status,
        totalSales: branchFormState.totalSales,
        todaySales: branchFormState.todaySales,
      };
      setBranches([...branches, newBranch]);
    } else {
      setBranches(
        branches.map((b) => {
          if (b.id === branchFormState.id) {
            return { 
              id: b.id,
              name: branchFormState.name,
              location: branchFormState.location,
              status: branchFormState.status,
              totalSales: branchFormState.totalSales,
              todaySales: branchFormState.todaySales
            };
          }
          return b;
        })
      );
    }
    setIsCreateBranchModalOpen(false);
    setIsUpdateBranchModalOpen(false);
  };

  const handleDeleteBranch = (id: number) => {
    setBranches((prevBranches) => prevBranches.filter((branch) => branch.id !== id));
  };

  const totalRevenue = branches.reduce((sum, b) => sum + b.totalSales, 0);
  const todayRevenue = branches.reduce((sum, b) => sum + b.todaySales, 0);
  const activeBranches = branches.filter(b => b.status === 'active').length;
  const activeUsers = users.filter(u => u.status === 'ACTIVE').length;

  const navItems = [
    { id: 'overview', label: 'Overview', icon: <Icons.DashboardIcon /> },
    { id: 'branches', label: 'Branches', icon: <Icons.BranchIcon /> },
    { id: 'users', label: 'Users', icon: <Icons.UsersIcon /> },
    { id: 'reports', label: 'Reports', icon: <Icons.ReportsIcon /> },
    { id: 'settings', label: 'Settings', icon: <Icons.SettingsIcon /> },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab totalRevenue={totalRevenue} todayRevenue={todayRevenue} activeBranches={activeBranches} activeUsers={activeUsers} branches={branches} />;
      case 'branches':
        return (
          <BranchesTab 
            branches={branches} 
            onCreateBranch={handleCreateBranch}
            onEditBranch={handleEditBranch}
            onDeleteBranch={handleDeleteBranch}
          />
        );
      case 'users':
        return (
          <UsersTab
            users={users}
            loading={loading}
            error={error}
            onCreate={handleCreateUser}
            onUpdate={handleUpdateUser}
            onDelete={handleDeleteUser}
            onRefresh={fetchUsers}
          />
        );
      case 'reports':
        return <ReportsTab />;
      case 'settings':
        return <SettingsTab />;
      default:
        return <OverviewTab totalRevenue={totalRevenue} todayRevenue={todayRevenue} activeBranches={activeBranches} activeUsers={activeUsers} branches={branches} />;
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#f8f6ff] text-zinc-900 font-sans overflow-hidden">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-zinc-200">
        <img src={logo} alt="Logo" className="h-8 w-auto object-contain" />
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 text-[#3b2063]">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
        </div>
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
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as typeof activeTab);
                  if (window.innerWidth < 768) setSidebarOpen(false);
                }}
                className={`w-full px-5 py-3 rounded-2xl font-black text-[13px] uppercase tracking-wider flex items-center transition-all duration-200 ${
                  activeTab === item.id ? 'bg-[#f0ebff] text-[#3b2063]' : 'text-zinc-400 hover:bg-[#f0ebff] hover:text-[#3b2063]'
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
            disabled={false}
            className="flex items-center justify-center w-full px-6 py-4 rounded-2xl bg-[#be2525] hover:bg-[#a11f1f] text-white text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-200 shadow-md shadow-red-900/10 disabled:opacity-70 disabled:cursor-not-allowed group"
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

      {isSidebarOpen && <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 md:px-10 py-6 md:py-8 gap-4">
          <div>
            <h1 className="text-xl md:text-4xl font-black text-[#3b2063] uppercase tracking-tight">
              {activeTab === 'overview' && 'Dashboard Overview'}
              {activeTab === 'branches' && 'Branch Management'}
              {activeTab === 'users' && 'User Management'}
              {activeTab === 'reports' && 'System Reports'}
              {activeTab === 'settings' && 'System Settings'}
            </h1>
            <p className="text-zinc-400 font-bold text-[9px] md:text-[10px] uppercase tracking-[0.2em] mt-1">
              Super Administrator Panel
            </p>
          </div>
        </header>
        {renderContent()}
        
        {/* Branch Modals */}
        {(isCreateBranchModalOpen || isUpdateBranchModalOpen) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl p-6 space-y-5">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-black text-[#3b2063] uppercase tracking-wider">
                  {isCreateBranchModalOpen ? 'Add Branch' : 'Edit Branch'}
                </h2>
                <button
                  onClick={() => {
                    setIsCreateBranchModalOpen(false);
                    setIsUpdateBranchModalOpen(false);
                  }}
                  className="text-zinc-400 hover:text-zinc-600"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleSaveBranch(); }} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
                    Branch Name
                  </label>
                  <input
                    type="text"
                    value={branchFormState.name}
                    onChange={(e) => setBranchFormState((f) => ({ ...f, name: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-2xl border border-zinc-200 text-sm font-bold text-[#3b2063] bg-zinc-50 focus:outline-none focus:border-[#3b2063] focus:ring-2 focus:ring-[#3b2063]/10"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={branchFormState.location}
                    onChange={(e) => setBranchFormState((f) => ({ ...f, location: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-2xl border border-zinc-200 text-sm font-bold text-[#3b2063] bg-zinc-50 focus:outline-none focus:border-[#3b2063] focus:ring-2 focus:ring-[#3b2063]/10"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
                      Status
                    </label>
                    <select
                      value={branchFormState.status}
                      onChange={(e) =>
                        setBranchFormState((f) => ({ ...f, status: e.target.value as 'active' | 'inactive' }))
                      }
                      className="w-full px-4 py-2.5 rounded-2xl border border-zinc-200 text-sm font-bold text-[#3b2063] bg-zinc-50 focus:outline-none focus:border-[#3b2063] focus:ring-2 focus:ring-[#3b2063]/10"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
                      Today's Sales
                    </label>
                    <input
                      type="number"
                      value={branchFormState.todaySales}
                      onChange={(e) => setBranchFormState((f) => ({ ...f, todaySales: Number(e.target.value) }))}
                      className="w-full px-4 py-2.5 rounded-2xl border border-zinc-200 text-sm font-bold text-[#3b2063] bg-zinc-50 focus:outline-none focus:border-[#3b2063] focus:ring-2 focus:ring-[#3b2063]/10"
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
                    Total Sales
                  </label>
                  <input
                    type="number"
                    value={branchFormState.totalSales}
                    onChange={(e) => setBranchFormState((f) => ({ ...f, totalSales: Number(e.target.value) }))}
                    className="w-full px-4 py-2.5 rounded-2xl border border-zinc-200 text-sm font-bold text-[#3b2063] bg-zinc-50 focus:outline-none focus:border-[#3b2063] focus:ring-2 focus:ring-[#3b2063]/10"
                    min="0"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreateBranchModalOpen(false);
                      setIsUpdateBranchModalOpen(false);
                    }}
                    className="px-4 py-2 rounded-2xl border border-zinc-200 text-xs font-bold uppercase text-zinc-500 hover:bg-zinc-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-2xl bg-[#3b2063] text-white text-xs font-black uppercase tracking-widest hover:bg-[#2a174a]"
                  >
                    {isCreateBranchModalOpen ? 'Create Branch' : 'Save Changes'}
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
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-black text-[#3b2063] uppercase tracking-wider">
                  Branch Details
                </h2>
                <button
                  onClick={() => setViewBranch(null)}
                  className="text-zinc-400 hover:text-zinc-600"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
                    Branch Name
                  </p>
                  <p className="text-sm font-bold text-[#3b2063]">{viewBranch.name}</p>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
                    Location
                  </p>
                  <p className="text-sm font-bold text-[#3b2063]">{viewBranch.location}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
                      Status
                    </p>
                    <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                      viewBranch.status === 'active' ? 'bg-emerald-100 text-emerald-600' : 'bg-zinc-100 text-zinc-500'
                    }`}>
                      {viewBranch.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
                      Branch ID
                    </p>
                    <p className="text-sm font-bold text-[#3b2063]">#{viewBranch.id}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
                      Today's Sales
                    </p>
                    <p className="text-lg font-black text-emerald-500">₱{viewBranch.todaySales.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
                      Total Sales
                    </p>
                    <p className="text-lg font-black text-[#3b2063]">₱{viewBranch.totalSales.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setViewBranch(null)}
                  className="px-6 py-2 rounded-2xl bg-[#3b2063] text-white text-xs font-black uppercase tracking-widest hover:bg-[#2a174a]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default SuperAdminDashboard;
