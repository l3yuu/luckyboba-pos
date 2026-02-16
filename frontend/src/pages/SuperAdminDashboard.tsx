import { useState, useEffect } from 'react';
import logo from '../assets/logo.png';
import UserService, { type User, type CreateUserData, type UpdateUserData } from '../services/UserService';

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

// Mock Data (for branches - you can replace this with API calls too)
const mockBranches: Branch[] = [
  { id: 1, name: 'Lucky Boba - SM City', location: 'SM City Cebu', status: 'active', totalSales: 125000, todaySales: 4500 },
  { id: 2, name: 'Lucky Boba - Ayala', location: 'Ayala Center', status: 'active', totalSales: 98000, todaySales: 3200 },
  { id: 3, name: 'Lucky Boba - IT Park', location: 'Cebu IT Park', status: 'active', totalSales: 87500, todaySales: 2800 },
  { id: 4, name: 'Lucky Boba - Banilad', location: 'Banilad Town Center', status: 'inactive', totalSales: 45000, todaySales: 0 },
];

const SuperAdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'branches' | 'users' | 'reports'>('overview');
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
      // Create new branch
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
      // Update existing branch
      setBranches(
        branches.map((b) => {
          if (b.id === branchFormState.id && branchFormState.id !== null) {
            return { ...b, name: branchFormState.name, location: branchFormState.location, status: branchFormState.status, totalSales: branchFormState.totalSales, todaySales: branchFormState.todaySales };
          }
          return b;
        })
      );
    }
    setIsCreateBranchModalOpen(false);
    setIsUpdateBranchModalOpen(false);
  };

  const [viewBranch, setViewBranch] = useState<Branch | null>(null);

  const totalRevenue = branches.reduce((sum, b) => sum + b.totalSales, 0);
  const todayRevenue = branches.reduce((sum, b) => sum + b.todaySales, 0);
  const activeBranches = branches.filter(b => b.status === 'active').length;
  const activeUsers = users.filter(u => u.status === 'ACTIVE').length;

  const navItems = [
    { id: 'overview', label: 'Overview', icon: <DashboardIcon /> },
    { id: 'branches', label: 'Branches', icon: <BranchIcon /> },
    { id: 'users', label: 'Users', icon: <UsersIcon /> },
    { id: 'reports', label: 'Reports', icon: <ReportsIcon /> },
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
            onViewBranch={setViewBranch}
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
          {/* Menu Toggle */}
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
            </h1>
            <p className="text-zinc-400 font-bold text-[9px] md:text-[10px] uppercase tracking-[0.2em] mt-1">
              Super Administrator Panel
            </p>
          </div>
        </header>
        {renderContent()}
        
        {/* Branch Modals */}
        {/* Create/Edit Branch Modal */}
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

// Rest of the component remains the same...
// (OverviewTab, BranchesTab, UsersTab, ReportsTab, and Icons)

const OverviewTab = ({ totalRevenue, todayRevenue, activeBranches, activeUsers, branches }: {
  totalRevenue: number;
  todayRevenue: number;
  activeBranches: number;
  activeUsers: number;
  branches: Branch[];
}) => (
  <section className="flex-1 px-6 md:px-10 pb-10 overflow-auto">
    {/* Stats Grid */}
    <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {[
        { label: "Total Revenue", value: `₱${totalRevenue.toLocaleString()}`, highlight: true },
        { label: "Today's Sales", value: `₱${todayRevenue.toLocaleString()}` },
        { label: "Active Branches", value: activeBranches.toString() },
        { label: "Active Users", value: activeUsers.toString() },
      ].map((stat, i) => (
        <div key={i} className="rounded-[1.5rem] md:rounded-[2rem] border border-zinc-100 bg-white shadow-sm p-5 md:p-6 flex flex-col justify-between min-h-[110px] md:min-h-[130px]">
          <p className="text-[12px] md:text-[13px] font-black uppercase tracking-[0.2em] text-zinc-400">
            {stat.label}
          </p>
          <p className={`text-xl md:text-2xl font-black ${stat.highlight ? 'text-emerald-500' : 'text-[#3b2063]'}`}>
            {stat.value}
          </p>
        </div>
      ))}
    </div>

    {/* Branch Performance */}
    <div className="mt-6 md:mt-8">
      <div className="rounded-[1.5rem] md:rounded-[2.5rem] border border-zinc-100 bg-white shadow-sm p-6 md:p-8">
        <p className="text-[12px] md:text-[15px] font-black uppercase tracking-[0.25em] text-zinc-400 mb-6">
          Branch Performance
        </p>
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
                <p className="font-black text-[#3b2063]">₱{branch.todaySales.toLocaleString()}</p>
                <p className="text-xs text-zinc-400">Today</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

interface BranchesTabProps {
  branches: Branch[];
  onCreateBranch: () => void;
  onEditBranch: (branch: Branch) => void;
  onViewBranch: (branch: Branch) => void;
}

const BranchesTab = ({ branches, onCreateBranch, onEditBranch, onViewBranch }: BranchesTabProps) => (
  <section className="flex-1 px-6 md:px-10 pb-10 overflow-auto">
    <div className="flex justify-between items-center mb-6">
      <p className="text-[12px] font-black uppercase tracking-[0.2em] text-zinc-400">
        {branches.length} Branches
      </p>
      <button 
        onClick={onCreateBranch}
        className="bg-[#3b2063] text-white px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-wider hover:bg-[#2a174a] transition-all"
      >
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
              <p className="font-black text-[#3b2063]">₱{branch.totalSales.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-zinc-400">Today</p>
              <p className="font-black text-emerald-500">₱{branch.todaySales.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button 
              onClick={() => onEditBranch(branch)}
              className="flex-1 bg-[#f0ebff] text-[#3b2063] py-2 rounded-xl font-bold text-[11px] uppercase hover:bg-[#e5deff] transition-all"
            >
              Edit
            </button>
            <button 
              onClick={() => onViewBranch(branch)}
              className="flex-1 bg-[#f0ebff] text-[#3b2063] py-2 rounded-xl font-bold text-[11px] uppercase hover:bg-[#e5deff] transition-all"
            >
              View  
            </button>
          </div>
        </div>
      ))}
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
  loading: boolean;
  error: string | null;
  onCreate: (data: CreateUserData) => Promise<User>;
  onUpdate: (id: number, data: UpdateUserData) => Promise<User>;
  onDelete: (id: number) => Promise<void>;
  onRefresh: () => void;
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
        // Update existing user
        const updateData: UpdateUserData = {
          name: form.name,
          email: form.email,
          role: form.role,
          branch: form.branch,
          status: form.status,
        };
        
        if (trimmedPassword) {
          updateData.password = trimmedPassword;
        }

        await onUpdate(editingUser.id, updateData);
      } else {
        // Create new user
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

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    try {
      await onDelete(userToDelete.id);
      setUserToDelete(null);
    } catch (err: unknown) {
      alert((err instanceof Error ? err.message : 'Failed to delete user') || 'Failed to delete user');
    }
  };

  return (
    <section className="flex-1 px-6 md:px-10 pb-10 overflow-auto">
      {/* Error Alert */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between">
          <p className="text-sm text-red-600">{error}</p>
          <button onClick={onRefresh} className="text-xs font-bold text-red-600 hover:text-red-700 uppercase">
            Retry
          </button>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <p className="text-[12px] font-black uppercase tracking-[0.2em] text-zinc-400">
            {users.length} Users
          </p>
          {loading && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-[#3b2063] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-zinc-400">Loading...</span>
            </div>
          )}
        </div>
        <button
          onClick={openCreate}
          disabled={loading}
          className="bg-[#3b2063] text-white px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-wider hover:bg-[#2a174a] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
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
                    <div>
                      <p className="font-bold text-[#3b2063]">{user.name}</p>
                      <p className="text-xs text-zinc-400">{user.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                        user.role === 'superadmin'
                          ? 'bg-[#fbbf24] text-[#3b2063]'
                          : user.role === 'admin'
                          ? 'bg-[#f0ebff] text-[#3b2063]'
                          : 'bg-zinc-100 text-zinc-600'
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-600">{user.branch || '-'}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                        user.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-600'
                          : 'bg-zinc-100 text-zinc-500'
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-3">
                    <button
                      onClick={() => openEdit(user)}
                      disabled={loading}
                      className="text-[#3b2063] hover:text-[#2a174a] font-bold text-xs uppercase disabled:opacity-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(user)}
                      disabled={loading}
                      className="text-red-500 hover:text-red-700 font-bold text-xs uppercase disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-400">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-black text-[#3b2063] uppercase tracking-wider">
                {editingUser ? 'Edit User' : 'Add User'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
                className="text-zinc-400 hover:text-zinc-600 disabled:opacity-50"
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

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-600">{formError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-2xl border border-zinc-200 text-sm font-bold text-[#3b2063] bg-zinc-50 focus:outline-none focus:border-[#3b2063] focus:ring-2 focus:ring-[#3b2063]/10"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-2xl border border-zinc-200 text-sm font-bold text-[#3b2063] bg-zinc-50 focus:outline-none focus:border-[#3b2063] focus:ring-2 focus:ring-[#3b2063]/10"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
                  {editingUser ? 'Reset Password (optional)' : 'Password'}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, password: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 rounded-2xl border border-zinc-200 text-sm font-bold text-[#3b2063] bg-zinc-50 focus:outline-none focus:border-[#3b2063] focus:ring-2 focus:ring-[#3b2063]/10"
                  placeholder={editingUser ? 'Leave blank to keep current password' : 'Set initial password'}
                  disabled={isSubmitting}
                  required={!editingUser}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
                    Role
                  </label>
                  <select
                    value={form.role}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, role: e.target.value as User['role'] }))
                    }
                    className="w-full px-4 py-2.5 rounded-2xl border border-zinc-200 text-sm font-bold text-[#3b2063] bg-zinc-50 focus:outline-none focus:border-[#3b2063] focus:ring-2 focus:ring-[#3b2063]/10"
                    disabled={isSubmitting}
                  >
                    <option value="superadmin">Super Admin</option>
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, status: e.target.value as User['status'] }))
                    }
                    className="w-full px-4 py-2.5 rounded-2xl border border-zinc-200 text-sm font-bold text-[#3b2063] bg-zinc-50 focus:outline-none focus:border-[#3b2063] focus:ring-2 focus:ring-[#3b2063]/10"
                    disabled={isSubmitting}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
                  Branch
                </label>
                <input
                  type="text"
                  value={form.branch}
                  onChange={(e) => setForm((f) => ({ ...f, branch: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-2xl border border-zinc-200 text-sm font-bold text-[#3b2063] bg-zinc-50 focus:outline-none focus:border-[#3b2063] focus:ring-2 focus:ring-[#3b2063]/10"
                  placeholder="e.g. SM City, Ayala, All Branches"
                  disabled={isSubmitting}
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-2xl border border-zinc-200 text-xs font-bold uppercase text-zinc-500 hover:bg-zinc-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 rounded-2xl bg-[#3b2063] text-white text-xs font-black uppercase tracking-widest hover:bg-[#2a174a] disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting && (
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
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
            <h2 className="text-lg font-black text-[#3b2063] uppercase tracking-wider">
              Delete User
            </h2>
            <p className="text-sm text-zinc-600">
              Are you sure you want to delete user{' '}
              <span className="font-bold text-[#3b2063]">{userToDelete.name}</span>?
              This action cannot be undone.
            </p>
            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                disabled={loading}
                className="px-4 py-2 rounded-2xl border border-zinc-200 text-xs font-bold uppercase text-zinc-500 hover:bg-zinc-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={loading}
                className="px-6 py-2 rounded-2xl bg-red-600 text-white text-xs font-black uppercase tracking-widest hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {loading && (
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
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
        { title: 'Sales Summary', desc: 'Complete sales report across all branches', icon: '📊' },
        { title: 'Inventory Report', desc: 'Stock levels and inventory movement', icon: '📦' },
        { title: 'User Activity', desc: 'Login history and user actions', icon: '👥' },
        { title: 'Branch Comparison', desc: 'Performance comparison between branches', icon: '🏪' },
        { title: 'Financial Report', desc: 'Revenue, expenses, and profit margins', icon: '💰' },
        { title: 'Audit Log', desc: 'System changes and administrative actions', icon: '📋' },
      ].map((report, i) => (
        <div key={i} className="rounded-[1.5rem] border border-zinc-100 bg-white shadow-sm p-6 hover:shadow-md transition-all cursor-pointer group">
          <div className="text-3xl mb-4">{report.icon}</div>
          <h3 className="font-black text-[#3b2063] text-lg group-hover:text-[#2a174a]">{report.title}</h3>
          <p className="text-sm text-zinc-400 mt-2">{report.desc}</p>
          <button className="mt-4 bg-[#f0ebff] text-[#3b2063] px-4 py-2 rounded-xl font-bold text-[11px] uppercase hover:bg-[#e5deff] transition-all w-full">
            Generate
          </button>
        </div>
      ))}
    </div>
  </section>
);

// --- Icons ---
const DashboardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" />
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

export default SuperAdminDashboard;
