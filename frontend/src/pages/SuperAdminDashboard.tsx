import { useState, useEffect } from 'react';
import logo from '../assets/logo.png';
import type { User, CreateUserData, UpdateUserData } from '../types/user';
import UserService from '../services/UserService';

// Import Settings Components
import SalesSettings from '../components/Settings/SalesSettings';
import AddCustomers from '../components/Settings/AddCustomers';
import DiscountSettings from '../components/Settings/DiscountSettings';
import ExportData from '../components/Settings/ExportData';
import UploadData from '../components/Settings/UploadData';
import AddUsers from '../components/Settings/AddUsers';
import AddVouchers from '../components/Settings/AddVouchers';
import ImportData from '../components/Settings/ImportData';
import BackupSystem from '../components/Settings/BackupSystem';
import BranchService, { type Branch } from '../services/BranchService';

const showToast = (message: string, _type: 'success' | 'error') => {
  console.log(`[${_type.toUpperCase()}] ${message}`);
};

const formatCurrency = (amount: number): string => {
  return `₱${amount.toLocaleString('en-PH', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`;
};

const SuperAdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'branches' | 'users' | 'reports' | 'settings'>('overview');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchLoading, setBranchLoading] = useState(false);
  const [branchError, setBranchError] = useState<string | null>(null);
  const [branchFormState, setBranchFormState] = useState({
    id: null as number | null,
    name: '',
    location: '',
    status: 'active' as 'active' | 'inactive',
  });
  const [isCreateBranchModalOpen, setIsCreateBranchModalOpen] = useState(false);
  const [isUpdateBranchModalOpen, setIsUpdateBranchModalOpen] = useState(false);
  const [viewBranch, setViewBranch] = useState<Branch | null>(null);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'branches' || activeTab === 'overview') {
      fetchBranches();
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
      showToast('Failed to load users. Please try again.', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      setBranchLoading(true);
      setBranchError(null);
      const fetchedBranches = await BranchService.getAllBranches();
      setBranches(fetchedBranches);
    } catch (err) {
      setBranchError('Failed to load branches. Please try again.');
      showToast('Failed to load branches. Please try again.', 'error');
      console.error(err);
    } finally {
      setBranchLoading(false);
    }
  };

  const handleLogout = () => {
    UserService.logout();
    window.location.reload();
  };

  const handleCreateUser = async (data: CreateUserData) => {
    try {
      setLoading(true);
      const newUser = await UserService.createUser(data);
      setUsers((prev) => [newUser, ...prev]);
      showToast('User created successfully!', 'success');
      return newUser;
    } catch (err: unknown) {
      const errorMessage = (err instanceof Error ? err.message : 'Failed to create user') || 'Failed to create user';
      setError(errorMessage);
      showToast(errorMessage, 'error');
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
      showToast('User updated successfully!', 'success');
      return updatedUser;
    } catch (err: unknown) {
      const errorMessage = (err instanceof Error ? err.message : 'Failed to update user') || 'Failed to update user';
      setError(errorMessage);
      showToast(errorMessage, 'error');
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
      showToast('User deleted successfully!', 'success');
    } catch (err: unknown) {
      const errorMessage = (err instanceof Error ? err.message : 'Failed to delete user') || 'Failed to delete user';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBranch = () => {
    setBranchFormState({ id: null, name: '', location: '', status: 'active' });
    setBranchError(null);
    setIsCreateBranchModalOpen(true);
  };

  const handleEditBranch = (branch: Branch) => {
    setBranchFormState({
      id: branch.id,
      name: branch.name,
      location: branch.location,
      status: branch.status,
    });
    setBranchError(null);
    setIsUpdateBranchModalOpen(true);
  };

  const handleSaveBranch = async () => {
    try {
      setBranchLoading(true);
      setBranchError(null);

      if (branchFormState.id === null) {
        await BranchService.createBranch({
          name: branchFormState.name,
          location: branchFormState.location,
          status: branchFormState.status,
        });
        showToast('Branch created successfully!', 'success');
      } else {
        await BranchService.updateBranch(branchFormState.id, {
          name: branchFormState.name,
          location: branchFormState.location,
          status: branchFormState.status,
        });
        showToast('Branch updated successfully!', 'success');
      }

      await fetchBranches();
      setIsCreateBranchModalOpen(false);
      setIsUpdateBranchModalOpen(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save branch';
      setBranchError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setBranchLoading(false);
    }
  };

  const handleDeleteBranch = async (branch: Branch) => {
    if (!window.confirm(`Are you sure you want to delete "${branch.name}"?\n\nThis action cannot be undone.`)) {
      return;
    }
    try {
      setBranchLoading(true);
      await BranchService.deleteBranch(branch.id);
      showToast('Branch deleted successfully!', 'success');
      await fetchBranches();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete branch';
      showToast(errorMessage, 'error');
    } finally {
      setBranchLoading(false);
    }
  };

  const totalRevenue = branches.reduce((sum, b) => sum + (parseFloat(String(b.total_sales)) || 0), 0);
  const todayRevenue = branches.reduce((sum, b) => sum + (parseFloat(String(b.today_sales)) || 0), 0);
  const activeBranches = branches.filter(b => b.status === 'active').length;
  const activeUsers = users.filter(u => u.status === 'ACTIVE').length;

  const navItems = [
    { id: 'overview', label: 'Overview', icon: <DashboardIcon /> },
    { id: 'branches', label: 'Branches', icon: <BranchIcon /> },
    { id: 'users', label: 'Users', icon: <UsersIcon /> },
    { id: 'reports', label: 'Reports', icon: <ReportsIcon /> },
    { id: 'settings', label: 'Settings', icon: <SettingsIcon /> },
  ];

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
            onCreateBranch={handleCreateBranch}
            onEditBranch={handleEditBranch}
            onViewBranch={setViewBranch}
            onDeleteBranch={handleDeleteBranch}
            onRefresh={fetchBranches}
          />
        );
      case 'users':
        return (
          <UsersTab
            users={users}
            branches={branches}
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
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#f8f6ff] text-zinc-900 font-sans overflow-hidden">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-zinc-200">
        <img src={logo} alt="Logo" className="h-8 w-auto object-contain" />
        <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 text-[#3b2063]">
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
            className="flex items-center justify-center w-full px-6 py-4 rounded-2xl bg-[#be2525] hover:bg-[#a11f1f] text-white text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-200 shadow-md shadow-red-900/10 group"
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

        {/* Create/Edit Branch Modal */}
        {(isCreateBranchModalOpen || isUpdateBranchModalOpen) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl p-6 space-y-5">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-black text-[#3b2063] uppercase tracking-wider">
                  {isCreateBranchModalOpen ? 'Add Branch' : 'Edit Branch'}
                </h2>
                <button
                  onClick={() => { setIsCreateBranchModalOpen(false); setIsUpdateBranchModalOpen(false); }}
                  disabled={branchLoading}
                  className="text-zinc-400 hover:text-zinc-600 disabled:opacity-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {branchError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-600">{branchError}</p>
                </div>
              )}

              <form onSubmit={(e) => { e.preventDefault(); handleSaveBranch(); }} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Branch Name</label>
                  <input
                    type="text"
                    value={branchFormState.name}
                    onChange={(e) => setBranchFormState((f) => ({ ...f, name: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-2xl border border-zinc-200 text-sm font-bold text-[#3b2063] bg-zinc-50 focus:outline-none focus:border-[#3b2063] focus:ring-2 focus:ring-[#3b2063]/10"
                    required
                    disabled={branchLoading}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Location</label>
                  <input
                    type="text"
                    value={branchFormState.location}
                    onChange={(e) => setBranchFormState((f) => ({ ...f, location: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-2xl border border-zinc-200 text-sm font-bold text-[#3b2063] bg-zinc-50 focus:outline-none focus:border-[#3b2063] focus:ring-2 focus:ring-[#3b2063]/10"
                    required
                    disabled={branchLoading}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Status</label>
                  <select
                    value={branchFormState.status}
                    onChange={(e) => setBranchFormState((f) => ({ ...f, status: e.target.value as 'active' | 'inactive' }))}
                    className="w-full px-4 py-2.5 rounded-2xl border border-zinc-200 text-sm font-bold text-[#3b2063] bg-zinc-50 focus:outline-none focus:border-[#3b2063] focus:ring-2 focus:ring-[#3b2063]/10"
                    disabled={branchLoading}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="bg-[#f0ebff] border border-zinc-200 rounded-2xl p-3">
                  <p className="text-[10px] font-bold text-zinc-500 leading-relaxed">
                    <span className="text-[#3b2063]">💡 Note:</span> Sales totals will automatically update when transactions are assigned to this branch via triggers.
                  </p>
                </div>
                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => { setIsCreateBranchModalOpen(false); setIsUpdateBranchModalOpen(false); }}
                    disabled={branchLoading}
                    className="px-4 py-2 rounded-2xl border border-zinc-200 text-xs font-bold uppercase text-zinc-500 hover:bg-zinc-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={branchLoading}
                    className="px-6 py-2 rounded-2xl bg-[#3b2063] text-white text-xs font-black uppercase tracking-widest hover:bg-[#2a174a] disabled:opacity-50 flex items-center gap-2"
                  >
                    {branchLoading && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
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
                    <p className="text-lg font-black text-emerald-500">{formatCurrency(Number(viewBranch.today_sales))}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Total Sales</p>
                    <p className="text-lg font-black text-[#3b2063]">{formatCurrency(Number(viewBranch.total_sales))}</p>
                  </div>
                </div>
              </div>
              <div className="pt-2 flex justify-end">
                <button onClick={() => setViewBranch(null)} className="px-6 py-2 rounded-2xl bg-[#3b2063] text-white text-xs font-black uppercase tracking-widest hover:bg-[#2a174a]">
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

// ===========================
// TAB COMPONENTS
// ===========================

const OverviewTab = ({ totalRevenue, todayRevenue, activeBranches, activeUsers, branches, loading }: {
  totalRevenue: number;
  todayRevenue: number;
  activeBranches: number;
  activeUsers: number;
  branches: Branch[];
  loading: boolean;
}) => (
  <section className="flex-1 px-6 md:px-10 pb-10 overflow-auto">
    <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {[
        { label: "Total Revenue", value: formatCurrency(totalRevenue), highlight: true },
        { label: "Today's Sales", value: formatCurrency(todayRevenue), highlight: false },
        { label: "Active Branches", value: activeBranches.toString(), highlight: false },
        { label: "Active Users", value: activeUsers.toString(), highlight: false },
      ].map((stat, i) => (
        <div key={i} className="rounded-[1.5rem] md:rounded-[2rem] border-2 border-zinc-200 bg-white shadow-lg hover:shadow-xl transition-all p-5 md:p-6 flex flex-col justify-between min-h-[110px] md:min-h-[130px]">
          <p className="text-[11px] md:text-[12px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2">{stat.label}</p>
          <p className={`text-2xl md:text-3xl font-black ${stat.highlight ? 'text-emerald-500' : 'text-[#3b2063]'}`}>
            {loading ? '...' : stat.value}
          </p>
        </div>
      ))}
    </div>

    <div className="mt-6 md:mt-8">
      <div className="rounded-[1.5rem] md:rounded-[2.5rem] border border-zinc-100 bg-white shadow-sm p-6 md:p-8">
        <p className="text-[12px] md:text-[15px] font-black uppercase tracking-[0.25em] text-zinc-400 mb-6">Branch Performance</p>
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block w-8 h-8 border-4 border-[#3b2063] border-t-transparent rounded-full animate-spin" />
            <p className="mt-2 text-sm text-zinc-500">Loading branches...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {branches.map((branch) => (
              <div key={branch.id} className="flex items-center justify-between p-4 rounded-2xl bg-[#f8f6ff] border border-zinc-100">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${branch.status === 'active' ? 'bg-emerald-500' : 'bg-zinc-300'}`} />
                  <div>
                    <p className="font-bold text-[#3b2063]">{branch.name}</p>
                    <p className="text-xs text-zinc-400">{branch.location}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-[#3b2063]">{formatCurrency(Number(branch.today_sales))}</p>
                  <p className="text-xs text-zinc-400">Today</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </section>
);

interface BranchesTabProps {
  branches: Branch[];
  loading: boolean;
  error: string | null;
  onCreateBranch: () => void;
  onEditBranch: (branch: Branch) => void;
  onViewBranch: (branch: Branch) => void;
  onDeleteBranch: (branch: Branch) => void;
  onRefresh: () => void;
}

const BranchesTab = ({ branches, loading, error, onCreateBranch, onEditBranch, onViewBranch, onDeleteBranch, onRefresh }: BranchesTabProps) => (
  <section className="flex-1 px-6 md:px-10 pb-10 overflow-auto">
    {error && (
      <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between">
        <p className="text-sm text-red-600">{error}</p>
        <button onClick={onRefresh} className="text-xs font-bold text-red-600 hover:text-red-700 uppercase">Retry</button>
      </div>
    )}
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center gap-4">
        <p className="text-[12px] font-black uppercase tracking-[0.2em] text-zinc-400">{branches.length} Branches</p>
        {loading && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-[#3b2063] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-zinc-400">Loading...</span>
          </div>
        )}
      </div>
      <button onClick={onCreateBranch} disabled={loading} className="bg-[#3b2063] text-white px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-wider hover:bg-[#2a174a] transition-all disabled:opacity-50">
        + Add Branch
      </button>
    </div>
    <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-2">
      {branches.map((branch) => (
        <div key={branch.id} className="rounded-[1.5rem] border border-zinc-100 bg-white shadow-sm p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-black text-[#3b2063] text-lg">{branch.name}</h3>
              <p className="text-sm text-zinc-400">{branch.location}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
              branch.status === 'active' ? 'bg-emerald-100 text-emerald-600' : 'bg-zinc-100 text-zinc-500'
            }`}>
              {branch.status}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-zinc-100">
            <div>
              <p className="text-[10px] font-bold uppercase text-zinc-400">Total Sales</p>
              <p className="font-black text-[#3b2063]">{formatCurrency(Number(branch.total_sales))}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-zinc-400">Today</p>
              <p className="font-black text-emerald-500">{formatCurrency(Number(branch.today_sales))}</p>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={() => onEditBranch(branch)} disabled={loading} className="flex-1 bg-[#f0ebff] text-[#3b2063] py-2 rounded-xl font-bold text-[11px] uppercase hover:bg-[#e5deff] transition-all disabled:opacity-50">Edit</button>
            <button onClick={() => onViewBranch(branch)} className="flex-1 bg-[#f0ebff] text-[#3b2063] py-2 rounded-xl font-bold text-[11px] uppercase hover:bg-[#e5deff] transition-all">View</button>
            <button onClick={() => onDeleteBranch(branch)} disabled={loading} className="flex-1 bg-red-50 text-red-600 py-2 rounded-xl font-bold text-[11px] uppercase hover:bg-red-100 transition-all disabled:opacity-50">Delete</button>
          </div>
        </div>
      ))}
      {branches.length === 0 && !loading && (
        <div className="col-span-2 text-center py-12">
          <p className="text-zinc-400 text-lg">No branches found</p>
          <button onClick={onCreateBranch} className="mt-4 text-[#3b2063] hover:text-[#2a174a] font-bold">Add your first branch</button>
        </div>
      )}
    </div>
  </section>
);

type UserFormState = {
  name: string;
  email: string;
  role: User['role'];
  branch: string;
  status: User['status'];
  password: string;
};

interface UsersTabProps {
  users: User[];
  branches: Branch[];
  loading: boolean;
  error: string | null;
  onCreate: (data: CreateUserData) => Promise<User>;
  onUpdate: (id: number, data: UpdateUserData) => Promise<User>;
  onDelete: (id: number) => Promise<void>;
  onRefresh: () => Promise<void>;
}

const emptyForm: UserFormState = {
  name: '',
  email: '',
  role: 'manager',
  branch: '',
  status: 'ACTIVE',
  password: '',
};

const UsersTab = ({ users, loading, error, onCreate, onUpdate, onDelete, onRefresh }: UsersTabProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState<UserFormState>(emptyForm);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openCreate = () => {
    setEditingUser(null);
    setForm(emptyForm);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setForm({
      name: user.name,
      email: user.email,
      role: user.role,
      branch: user.branch || '',
      status: user.status,
      password: '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      const trimmedPassword = form.password.trim();

      if (editingUser) {
        const updateData: UpdateUserData = {
          name: form.name,
          email: form.email,
          role: form.role,
          branch: form.branch,
          status: form.status,
        };
        if (trimmedPassword) updateData.password = trimmedPassword;
        await onUpdate(editingUser.id, updateData);
      } else {
        if (!trimmedPassword) {
          setFormError('Password is required for new users.');
          setIsSubmitting(false);
          return;
        }
        const createData: CreateUserData = {
          name: form.name,
          email: form.email,
          password: trimmedPassword,
          role: form.role,
          branch: form.branch || undefined,
          status: form.status,
        };
        await onCreate(createData);
      }

      setIsModalOpen(false);
      setForm(emptyForm);
    } catch (err: unknown) {
      setFormError((err instanceof Error ? err.message : 'An error occurred') || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (user: User) => setUserToDelete(user);

const handleConfirmDelete = async () => {
  if (!userToDelete) return;
  try {
    await onDelete(userToDelete.id);
    setUserToDelete(null);
  } catch (_e) {
    setUserToDelete(null);
  }
};

  return (
    <section className="flex-1 px-6 md:px-10 pb-10 overflow-auto">
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between">
          <p className="text-sm text-red-600">{error}</p>
          <button onClick={onRefresh} className="text-xs font-bold text-red-600 hover:text-red-700 uppercase">Retry</button>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <p className="text-[12px] font-black uppercase tracking-[0.2em] text-zinc-400">{users.length} Users</p>
          {loading && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-[#3b2063] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-zinc-400">Loading...</span>
            </div>
          )}
        </div>
        <button onClick={openCreate} disabled={loading} className="bg-[#3b2063] text-white px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-wider hover:bg-[#2a174a] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
          + Add User
        </button>
      </div>

      <div className="rounded-[1.5rem] border border-zinc-100 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#f8f6ff]">
                <th className="text-left px-6 py-4 text-[11px] font-black uppercase tracking-wider text-zinc-400">User</th>
                <th className="text-left px-6 py-4 text-[11px] font-black uppercase tracking-wider text-zinc-400">Role</th>
                <th className="text-left px-6 py-4 text-[11px] font-black uppercase tracking-wider text-zinc-400">Branch</th>
                <th className="text-left px-6 py-4 text-[11px] font-black uppercase tracking-wider text-zinc-400">Status</th>
                <th className="text-right px-6 py-4 text-[11px] font-black uppercase tracking-wider text-zinc-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-zinc-100 hover:bg-[#f8f6ff] transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-[#3b2063]">{user.name}</p>
                    <p className="text-xs text-zinc-400">{user.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                      user.role === 'superadmin' ? 'bg-[#fbbf24] text-[#3b2063]'
                      : user.role === 'admin' ? 'bg-[#f0ebff] text-[#3b2063]'
                      : 'bg-zinc-100 text-zinc-600'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-600">{user.branch || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                      user.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-600' : 'bg-zinc-100 text-zinc-500'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-3">
                    <button onClick={() => openEdit(user)} disabled={loading} className="text-[#3b2063] hover:text-[#2a174a] font-bold text-xs uppercase disabled:opacity-50">Edit</button>
                    <button onClick={() => handleDeleteClick(user)} disabled={loading} className="text-red-500 hover:text-red-700 font-bold text-xs uppercase disabled:opacity-50">Delete</button>
                  </td>
                </tr>
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

      {/* Create/Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-black text-[#3b2063] uppercase tracking-wider">
                {editingUser ? 'Edit User' : 'Add User'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} disabled={isSubmitting} className="text-zinc-400 hover:text-zinc-600 disabled:opacity-50">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-600">{formError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Full Name</label>
                <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-2xl border border-zinc-200 text-sm font-bold text-[#3b2063] bg-zinc-50 focus:outline-none focus:border-[#3b2063] focus:ring-2 focus:ring-[#3b2063]/10"
                  required disabled={isSubmitting} />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-2xl border border-zinc-200 text-sm font-bold text-[#3b2063] bg-zinc-50 focus:outline-none focus:border-[#3b2063] focus:ring-2 focus:ring-[#3b2063]/10"
                  required disabled={isSubmitting} />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
                  {editingUser ? 'Reset Password (optional)' : 'Password'}
                </label>
                <input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-2xl border border-zinc-200 text-sm font-bold text-[#3b2063] bg-zinc-50 focus:outline-none focus:border-[#3b2063] focus:ring-2 focus:ring-[#3b2063]/10"
                  placeholder={editingUser ? 'Leave blank to keep current password' : 'Set initial password'}
                  disabled={isSubmitting} required={!editingUser} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Role</label>
                  <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as User['role'] }))}
                    className="w-full px-4 py-2.5 rounded-2xl border border-zinc-200 text-sm font-bold text-[#3b2063] bg-zinc-50 focus:outline-none focus:border-[#3b2063] focus:ring-2 focus:ring-[#3b2063]/10"
                    disabled={isSubmitting}>
                    <option value="superadmin">Super Admin</option>
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Status</label>
                  <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as User['status'] }))}
                    className="w-full px-4 py-2.5 rounded-2xl border border-zinc-200 text-sm font-bold text-[#3b2063] bg-zinc-50 focus:outline-none focus:border-[#3b2063] focus:ring-2 focus:ring-[#3b2063]/10"
                    disabled={isSubmitting}>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Branch</label>
                <input type="text" value={form.branch} onChange={(e) => setForm((f) => ({ ...f, branch: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-2xl border border-zinc-200 text-sm font-bold text-[#3b2063] bg-zinc-50 focus:outline-none focus:border-[#3b2063] focus:ring-2 focus:ring-[#3b2063]/10"
                  placeholder="e.g. SM City, Ayala, All Branches" disabled={isSubmitting} />
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}
                  className="px-4 py-2 rounded-2xl border border-zinc-200 text-xs font-bold uppercase text-zinc-500 hover:bg-zinc-50 disabled:opacity-50">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting}
                  className="px-6 py-2 rounded-2xl bg-[#3b2063] text-white text-xs font-black uppercase tracking-widest hover:bg-[#2a174a] disabled:opacity-50 flex items-center gap-2">
                  {isSubmitting && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {editingUser ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-6 space-y-4">
            <h2 className="text-lg font-black text-[#3b2063] uppercase tracking-wider">Delete User</h2>
            <p className="text-sm text-zinc-600">
              Are you sure you want to delete <span className="font-bold text-[#3b2063]">{userToDelete.name}</span>? This action cannot be undone.
            </p>
            <div className="pt-2 flex justify-end gap-3">
              <button type="button" onClick={() => setUserToDelete(null)} disabled={loading}
                className="px-4 py-2 rounded-2xl border border-zinc-200 text-xs font-bold uppercase text-zinc-500 hover:bg-zinc-50 disabled:opacity-50">
                Cancel
              </button>
              <button type="button" onClick={handleConfirmDelete} disabled={loading}
                className="px-6 py-2 rounded-2xl bg-red-600 text-white text-xs font-black uppercase tracking-widest hover:bg-red-700 disabled:opacity-50 flex items-center gap-2">
                {loading && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

const ReportsTab = () => (
  <section className="flex-1 px-6 md:px-10 pb-10 overflow-auto">
    <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {[
        { title: 'Sales Summary', desc: 'Complete sales report across all branches', icon: <SalesReportIcon /> },
        { title: 'Inventory Report', desc: 'Stock levels and inventory movement', icon: <InventoryIcon /> },
        { title: 'User Activity', desc: 'Login history and user actions', icon: <UserActivityIcon /> },
        { title: 'Branch Comparison', desc: 'Performance comparison between branches', icon: <BranchComparisonIcon /> },
        { title: 'Financial Report', desc: 'Revenue, expenses, and profit margins', icon: <FinancialIcon /> },
        { title: 'Audit Log', desc: 'System changes and administrative actions', icon: <AuditLogIcon /> },
      ].map((report, i) => (
        <div key={i} className="rounded-[1.5rem] border border-zinc-100 bg-white shadow-sm p-6 hover:shadow-md transition-all cursor-pointer group">
          <div className="text-3xl mb-4">{report.icon}</div>
          <h3 className="font-black text-[#3b2063] text-lg group-hover:text-[#2a174a]">{report.title}</h3>
          <p className="text-sm text-zinc-400 mt-2">{report.desc}</p>
          <button className="mt-4 bg-[#f0ebff] text-[#3b2063] px-4 py-2 rounded-xl font-bold text-[11px] uppercase hover:bg-[#e5deff] transition-all w-full">Generate</button>
        </div>
      ))}
    </div>
  </section>
);

const SettingsTab = () => {
  // --- UI STATES ---
  const [isSalesSettingsOpen, setIsSalesSettingsOpen] = useState(false);
  const [activeSubView, setActiveSubView] = useState<string | null>(null);

  // --- NAVIGATION HANDLER ---
  const closeSubView = () => setActiveSubView(null);

  // --- CONDITIONAL RENDERING ---
  switch (activeSubView) {
    case 'add-customers':
      return <AddCustomers onBack={closeSubView} />;
    case 'discount':
      return <DiscountSettings onBack={closeSubView} />;
    case 'export-data':
      return <ExportData onBack={closeSubView} />;
    case 'upload-data':
      return <UploadData onBack={closeSubView} />;
    case 'add-users':
      return <AddUsers onBack={closeSubView} />;
    case 'add-vouchers':
      return <AddVouchers onBack={closeSubView} />;
    case 'import-data':
      return <ImportData onBack={closeSubView} />;
    case 'backup-system':
      return <BackupSystem onBack={closeSubView} />;
    default:
      break;
  }

  const settingActions = [
    { 
      label: "Sales Settings", 
      Icon: SalesSettingsIcon, 
      color: "#1e40af", 
      iconColor: "#1e40af",
      action: () => setIsSalesSettingsOpen(true) 
    },
    { 
      label: "Add Customers", 
      Icon: AddCustomersIcon, 
      color: "#1e40af", 
      iconColor: "#1e40af",
      action: () => setActiveSubView('add-customers')
    },
    { 
      label: "Discount", 
      Icon: DiscountIcon, 
      color: "#1e40af", 
      iconColor: "#1e40af", 
      action: () => setActiveSubView('discount') 
    },
    { 
      label: "Export Data", 
      Icon: ExportDataIcon, 
      color: "#1e40af", 
      iconColor: "#1e40af", 
      action: () => setActiveSubView('export-data') 
    },
    { 
      label: "Upload Data", 
      Icon: UploadDataIcon, 
      color: "#1e40af", 
      iconColor: "#1e40af", 
      action: () => setActiveSubView('upload-data') 
    },
    { 
      label: "Add Users", 
      Icon: AddUsersIcon, 
      color: "#1e40af", 
      iconColor: "#1e40af", 
      action: () => setActiveSubView('add-users') 
    },
    { 
      label: "Add Vouchers", 
      Icon: AddVouchersIcon, 
      color: "#1e40af", 
      iconColor: "#1e40af", 
      action: () => setActiveSubView('add-vouchers') 
    },
    { 
      label: "Import Data", 
      Icon: ImportDataIcon, 
      color: "#1e40af", 
      iconColor: "#1e40af", 
      action: () => setActiveSubView('import-data') 
    },
    { 
      label: "Backup System", 
      Icon: BackupSystemIcon, 
      color: "#1e40af", 
      iconColor: "#1e40af", 
      action: () => setActiveSubView('backup-system') 
    },
  ];

  return (
    <div className="flex-1 bg-[#f8f6ff] h-full flex flex-col overflow-hidden font-sans">
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
        <div className="mb-2">
           
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {settingActions.map((item, index) => (
            <button
              key={index}
              onClick={item.action}
              className="group relative overflow-hidden flex flex-col items-center justify-center p-8 rounded-2xl shadow-sm border border-zinc-200 bg-white transition-all duration-200 active:scale-95 hover:shadow-md hover:border-zinc-300"
            >
              <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: item.color }} />
              <div className="mb-4 transition-transform duration-200 group-hover:scale-110 w-8 h-8 flex items-center justify-center" style={{ color: item.iconColor }}>
                <item.Icon />
              </div>
              <span className="text-[11px] font-black text-[#3b2063] uppercase tracking-widest text-center">
                {item.label}
              </span>
              <div className="mt-3 px-3 py-1 rounded-full bg-zinc-50 text-[8px] font-bold text-zinc-400 uppercase tracking-tighter group-hover:bg-zinc-200 group-hover:text-zinc-600 transition-colors border border-zinc-100">
                Configure
              </div>
            </button>
          ))}
        </div>

        <div className="mt-4 bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
          <div className="bg-[#1e40af] px-6 py-3 border-b border-zinc-200">
            <h2 className="text-white font-black text-[10px] uppercase tracking-[0.2em] text-center">
              System Audit & Security
            </h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center gap-2">
              <div className="p-2 bg-[#1e40af] rounded-full text-white"><LastBackupIcon /></div>
              <div>
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Last Backup</p>
                <p className="text-sm font-black text-slate-700 uppercase italic">February 11, 2026</p>
              </div>
            </div>
            <div className="flex flex-col items-center text-center gap-2 border-x border-zinc-100 px-4">
              <div className="p-2 bg-[#1e40af] rounded-full text-white"><ActiveSessionIcon /></div>
              <div>
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Active Session</p>
                <p className="text-sm font-black text-[#1e40af] uppercase">Administrator</p>
              </div>
            </div>
            <div className="flex flex-col items-center text-center gap-2">
              <div className="p-2 bg-[#1e40af] rounded-full text-white"><SystemStatusIcon /></div>
              <div>
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">System Status</p>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#1e40af] animate-pulse" />
                  <p className="text-sm font-black text-slate-700 uppercase">Online</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SalesSettings 
        isOpen={isSalesSettingsOpen} 
        onClose={() => setIsSalesSettingsOpen(false)} 
      />
    </div>
  );
};

const DashboardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
  </svg>
);

const BranchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75v-4.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v4.5c0 .414.336.75.75.75Z" />
  </svg>
);

const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
  </svg>
);

const ReportsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
  </svg>
);

const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.094c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.449l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527a1.125 1.125 0 01-1.449-.12l-.774-.774a1.125 1.125 0 01-.12-1.449l.527-.738c.25-.35.273-.806.108-1.203-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.425-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 01.12-1.449l.774-.773a1.125 1.125 0 011.449-.12l.738.526c.35.25.806.273 1.203.108.397-.165.71-.505.78-.93l.15-.893z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const AuditLogIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-[#3b2063]">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
  </svg>
);

const SalesReportIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-[#3b2063]">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const InventoryIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-[#3b2063]">
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
  </svg>
);

const UserActivityIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-[#3b2063]">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
  </svg>
);

const BranchComparisonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-[#3b2063]">
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
  </svg>
);

const FinancialIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-[#3b2063]">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const SalesSettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const AddCustomersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
  </svg>
);

const DiscountIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375z" />
  </svg>
);

const ExportDataIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M7.5 10.5L12 15m0 0l4.5-4.5M12 15V3" />
  </svg>
);

const UploadDataIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
  </svg>
);

const AddUsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
  </svg>
);

const AddVouchersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375z" />
  </svg>
);

const ImportDataIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);

const BackupSystemIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
  </svg>
);

const LastBackupIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);

const ActiveSessionIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);

const SystemStatusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
);

export default SuperAdminDashboard;