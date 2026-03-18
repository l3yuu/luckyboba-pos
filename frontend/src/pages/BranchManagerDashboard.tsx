"use client"

import { useState, useEffect } from 'react';
import { Menu, LogOut } from 'lucide-react';
import api from '../services/api';
import logo from '../assets/logo.png';

// ── Layout components ─────────────────────────────────────────────────────────
import BranchManagerSidebar from '../components/BranchManager/BranchManagerSidebar';
import BranchManagerTopNav  from '../components/BranchManager/BranchManagerTopNav';

// ── Dashboard ─────────────────────────────────────────────────────────────────
import BMDashboard from '../components/BranchManager/Home/BM-Dashboard';

// ── Users ─────────────────────────────────────────────────────────────────────
import UserManagement from '../components/BranchManager/UserManagement';

// ── Sales Reports ─────────────────────────────────────────────────────────────
import SalesDashboard from '../components/BranchManager/SalesReport/BM_SalesDashboard';
import ItemsReport    from '../components/BranchManager/SalesReport/BM_ItemsReport';
import XReading       from '../components/BranchManager/SalesReport/BM_X-Reading';
import ZReading       from '../components/BranchManager/SalesReport/BM_Z-Reading';

// ── Menu Management ───────────────────────────────────────────────────────────
import BM_MenuList      from '../components/BranchManager/MenuItems/BM_MenuList';
import BM_Categories    from '../components/BranchManager/MenuItems/BM_Categories';
import BM_SubCategories from '../components/BranchManager/MenuItems/BM_Sub-Categories';

// ── Inventory ─────────────────────────────────────────────────────────────────
import BM_InventoryDashboard     from '../components/BranchManager/Inventory/BM_InventoryDashboard';
import BM_InventoryCategories    from '../components/BranchManager/Inventory/BM_InventoryCategories';
import BM_InventoryList          from '../components/BranchManager/Inventory/BM_InventoryList';
import BM_InventoryReports       from '../components/BranchManager/Inventory/BM_InventoryReports';
import BM_InventoryItemChecker   from '../components/BranchManager/Inventory/BM_InventoryItemChecker';
import BM_InventoryItemSerials   from '../components/BranchManager/Inventory/BM_InventoryItemSerials';
import BM_InventoryPurchaseOrder from '../components/BranchManager/Inventory/BM_InventoryPurchaseOrder';
import BM_InventoryStockTransfer from '../components/BranchManager/Inventory/BM_InventoryStockTransfer';
import BM_InventorySuppliers     from '../components/BranchManager/Inventory/BM_InventorySuppliers';

// ── Settings ──────────────────────────────────────────────────────────────────
import BM_AddCustomers   from '../components/BranchManager/Settings/BM_AddCustomers';
import BM_AddVouchers    from '../components/BranchManager/Settings/BM_AddVouchers';
import BM_BackupSystem   from '../components/BranchManager/Settings/BM_BackupSystem';
import BM_CustomerReport from '../components/BranchManager/Settings/BM_CustomerReport';
import BM_ImportData     from '../components/BranchManager/Settings/BM_ImportData';
import BM_SalesSettings  from '../components/BranchManager/Settings/BM_SalesSettings';
import BM_Settings       from '../components/BranchManager/Settings/BM_Settings';
import BM_UploadData     from '../components/BranchManager/Settings/BM_UploadData';

// ── Audit Logs ────────────────────────────────────────────────────────────────
import BranchManagerAuditLogsTab from '../components/BranchManager/BranchManagerAuditLogsTab';

// ── Global styles (matches SuperAdminDashboard pattern) ───────────────────────
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');
    *, *::before, *::after, body, input, button, select, textarea {
      font-family: 'DM Sans', sans-serif !important;
      box-sizing: border-box;
    }
    ::-webkit-scrollbar { width: 4px; height: 4px; }
    ::-webkit-scrollbar-track { background: #f4f2fb; }
    ::-webkit-scrollbar-thumb { background: #d4d0e8; border-radius: 4px; }
    .card { transition: box-shadow 0.15s ease, transform 0.15s ease; }
    .card:hover { box-shadow: 0 4px 24px rgba(59,32,99,0.08); }
    .sa-tab { transition: background 0.12s, color 0.12s; border-radius: 0.4rem; }
    .sa-tab:hover  { background: #f5f3ff; color: #3b2063; }
    .sa-tab.active { background: #ede8ff; color: #3b2063; font-weight: 600; }
    .sa-tab.active::before {
      content: ''; position: absolute; left: 0; top: 18%; bottom: 18%;
      width: 2.5px; background: #3b2063; border-radius: 0 2px 2px 0;
    }
    @keyframes sa-pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
    .pulse   { animation: sa-pulse 2s ease-in-out infinite; }
    @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
    .fade-in { animation: fadeIn 0.25s ease forwards; }
    .badge-active   { background:#d1fae5; color:#065f46; }
    .badge-inactive { background:#f3f4f6; color:#6b7280; }
    .badge-pending  { background:#fef3c7; color:#92400e; }
    .badge-danger   { background:#fee2e2; color:#991b1b; }
    .toggle-on  { background:#3b2063; }
    .toggle-off { background:#d1d5db; }
  `}</style>
);

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
      <div className="bg-white w-full max-w-sm border border-zinc-200 rounded-[1.25rem] p-8 flex flex-col items-center text-center shadow-2xl">
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
            className={`w-full py-3 text-[10px] font-bold tracking-[0.18em] uppercase text-white transition-all rounded-[0.625rem] active:scale-[0.98] cursor-pointer ${
              danger ? 'bg-[#be2525] hover:bg-[#a11f1f]' : 'bg-[#3b2063] hover:bg-[#2a1647]'
            }`}
          >
            {btnText}
          </button>
          <button
            onClick={cancel}
            className="w-full py-3 text-[10px] font-bold tracking-[0.18em] uppercase text-zinc-500 bg-white border border-zinc-200 hover:bg-zinc-50 transition-all rounded-[0.625rem] active:scale-[0.98] cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Types ─────────────────────────────────────────────────────────────────────
interface AuthUser {
  id:        number;
  name:      string;
  email:     string;
  role:      string;
  branch_id: number | null;
  branch?:   { id: number; name: string; location?: string };
}

export type TabId =
  | 'dashboard'
  // Users
  | 'users'
  // Sales Reports
  | 'sales-dashboard' | 'items-report' | 'x-reading' | 'z-reading'
  // Menu Management
  | 'menu-list' | 'category-list' | 'sub-category-list'
  // Inventory
  | 'inventory-dashboard' | 'inventory-list' | 'inventory-category'
  | 'supplier' | 'item-checker' | 'item-serials'
  | 'purchase-order' | 'stock-transfer' | 'inventory-report'
  // Audit
  | 'audit-logs'
  // Settings
  | 'settings' | 'add-customers' | 'add-vouchers' | 'backup-system'
  | 'customer-report' | 'import-data' | 'sales-settings' | 'upload-data';

// ── Root layout ───────────────────────────────────────────────────────────────
const BranchManagerDashboard: React.FC = () => {
  const [isSidebarOpen,     setSidebarOpen]    = useState(false);
  const [activeTab,         setActiveTab]      = useState<TabId>('dashboard');
  const [authUser,          setAuthUser]       = useState<AuthUser | null>(null);
  const [isLogoutModalOpen, setLogoutModalOpen] = useState(false);
  const [isLoggingOut,      setIsLoggingOut]   = useState(false);

  useEffect(() => {
    api.get<AuthUser>('/user')
      .then(res => {
        const u = res.data;
        setAuthUser({
          id:        u.id,
          name:      u.name,
          email:     u.email,
          role:      u.role,
          branch_id: u.branch_id,
          branch:    u.branch ?? undefined,
        });
      })
      .catch(err => console.error('Failed to load user', err));
  }, []);

  const confirmLogout = () => {
    setIsLoggingOut(true);
    setLogoutModalOpen(false);
    ['auth_token', 'lucky_boba_token', 'token', 'user_role', 'lucky_boba_authenticated']
      .forEach(k => localStorage.removeItem(k));
    sessionStorage.clear();
    window.location.href = '/login';
  };

  const renderContent = () => {
    const branchId = authUser?.branch_id ?? null;

    switch (activeTab) {
      // ── Dashboard ───────────────────────────────────────────────────────
      case 'dashboard':           return <BMDashboard branchId={branchId} />;

      // ── Users ────────────────────────────────────────────────────────────
      case 'users':               return <UserManagement />;

      // ── Sales Reports ────────────────────────────────────────────────────
      case 'sales-dashboard':     return <SalesDashboard />;
      case 'items-report':        return <ItemsReport />;
      case 'x-reading':           return <XReading />;
      case 'z-reading':           return <ZReading />;

      // ── Menu Management ──────────────────────────────────────────────────
      case 'menu-list':           return <BM_MenuList />;
      case 'category-list':       return <BM_Categories />;
      case 'sub-category-list':   return <BM_SubCategories />;

      // ── Inventory ────────────────────────────────────────────────────────
      case 'inventory-dashboard': return <BM_InventoryDashboard />;
      case 'inventory-list':      return <BM_InventoryList />;
      case 'inventory-category':  return <BM_InventoryCategories />;
      case 'supplier':            return <BM_InventorySuppliers />;
      case 'item-checker':        return <BM_InventoryItemChecker />;
      case 'item-serials':        return <BM_InventoryItemSerials />;
      case 'purchase-order':      return <BM_InventoryPurchaseOrder />;
      case 'stock-transfer':      return <BM_InventoryStockTransfer />;
      case 'inventory-report':    return <BM_InventoryReports />;

      // ── Audit ────────────────────────────────────────────────────────────
      case 'audit-logs':          return <BranchManagerAuditLogsTab />;

      // ── Settings ─────────────────────────────────────────────────────────
      case 'settings':            return <BM_Settings />;
      case 'add-customers':       return <BM_AddCustomers    onBack={() => setActiveTab('settings')} />;
      case 'add-vouchers':        return <BM_AddVouchers     onBack={() => setActiveTab('settings')} />;
      case 'backup-system':       return <BM_BackupSystem    onBack={() => setActiveTab('settings')} />;
      case 'import-data':         return <BM_ImportData      onBack={() => setActiveTab('settings')} />;
      case 'upload-data':         return <BM_UploadData      onBack={() => setActiveTab('settings')} />;
      case 'sales-settings':      return <BM_SalesSettings   isOpen onClose={() => setActiveTab('settings')} />;
      case 'customer-report':
        return (
          <BM_CustomerReport
            onBack={() => setActiveTab('settings')}
            activeTab={activeTab as unknown as React.ComponentProps<typeof BM_CustomerReport>['activeTab']}
            setActiveTab={setActiveTab as unknown as React.ComponentProps<typeof BM_CustomerReport>['setActiveTab']}
          />
        );

      default: return <BMDashboard branchId={branchId} />;
    }
  };

  const pageTitle = activeTab === 'dashboard'
    ? 'Branch Dashboard'
    : activeTab.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <>
      <GlobalStyles />
      <div className="flex flex-col md:flex-row h-screen bg-[#f5f4f8] overflow-hidden">

        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-zinc-200 shrink-0">
          <img src={logo} alt="Lucky Boba" className="h-8 w-auto object-contain" />
          <button
            onClick={() => setSidebarOpen(v => !v)}
            className="p-2 rounded-md text-[#3b2063] hover:bg-[#f5f3ff] transition-colors cursor-pointer"
          >
            <Menu size={20} strokeWidth={2} />
          </button>
        </div>

        <BranchManagerSidebar
          isSidebarOpen={isSidebarOpen}
          setSidebarOpen={setSidebarOpen}
          logo={logo}
          currentTab={activeTab}
          setCurrentTab={(tab) => setActiveTab(tab as TabId)}
          onLogout={() => setLogoutModalOpen(true)}
          isLoggingOut={isLoggingOut}
        />

        <main className="flex-1 flex flex-col overflow-hidden">
          <BranchManagerTopNav
            pageTitle={pageTitle}
            branchLabel={authUser?.name ?? null}
          />
          <div className="flex-1 overflow-y-auto">
            {renderContent()}
          </div>
        </main>
      </div>

      <ConfirmModal
        show={isLogoutModalOpen}
        icon={<LogOut size={19} className="text-[#be2525]" />}
        title="End Session?"
        desc="Are you sure you want to log out of the terminal?"
        action={confirmLogout}
        btnText="Logout"
        cancel={() => setLogoutModalOpen(false)}
        danger
      />
    </>
  );
};

export default BranchManagerDashboard;