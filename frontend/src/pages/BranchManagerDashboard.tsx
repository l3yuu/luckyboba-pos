"use client"

import { useState, useEffect } from 'react';
import BranchManagerSidebar from '../components/BranchManager/BranchManagerSidebar';
import { ConfirmModal } from '../components/BranchManager/SharedUI';
import logo from '../assets/logo.png';
import UserManagement from '../components/BranchManager/Home/UserManagement';
import BM_Dashboard from '../components/BranchManager/Home/BM_Dashboard';
import BM_DeviceManagement from '../components/BranchManager/Home/BM_DeviceManagement';
import api from '../services/api';
import { LogOut } from 'lucide-react';
import BranchManagerTopNav from '../components/BranchManager/BranchManagerTopNav'; 
import BM_PulseTab from '../components/BranchManager/Home/BM_PulseTab';
import BM_StaffPerformanceTab from '../components/BranchManager/Home/BM_StaffPerformanceTab';

import SalesDashboard        from '../components/BranchManager/SalesReport/BM_SalesDashboard';
import ItemsReport           from '../components/BranchManager/SalesReport/BM_ItemsReport';
import XReading              from '../components/BranchManager/SalesReport/BM_X-Reading';
import ZReading              from '../components/BranchManager/SalesReport/BM_Z-Reading';

import BM_MenuList           from '../components/BranchManager/MenuItems/BM_MenuList';
import BM_Categories         from '../components/BranchManager/MenuItems/BM_Categories';
import BM_SubCategories      from '../components/BranchManager/MenuItems/BM_Sub-Categories';

import BM_InventoryDashboard     from '../components/BranchManager/Inventory/BM_InventoryDashboard';
import BM_InventoryCategories    from '../components/BranchManager/Inventory/BM_InventoryCategories';
import BM_InventoryList          from '../components/BranchManager/Inventory/BM_InventoryList';
import BM_InventoryReports       from '../components/BranchManager/Inventory/BM_InventoryReports';
import BM_InventoryItemChecker   from '../components/BranchManager/Inventory/BM_InventoryItemChecker';
import BM_InventoryItemSerials   from '../components/BranchManager/Inventory/BM_InventoryItemSerials';
import BM_InventoryPurchaseOrder from '../components/BranchManager/Inventory/BM_InventoryPurchaseOrder';
import BM_InventoryStockTransfer from '../components/BranchManager/Inventory/BM_InventoryStockTransfer';
import BM_InventorySuppliers     from '../components/BranchManager/Inventory/BM_InventorySuppliers';

import BranchManagerAuditLogsTab from '../components/BranchManager/BranchManagerAuditLogsTab';
import BM_AppOrders      from '../components/BranchManager/SalesReport/BM_AppOrders';
import BM_MenuManagement from '../components/BranchManager/SalesReport/BM_MenuManagement';

import BMVoidLogsPanel from '../components/BranchManager/FloorOps/BMVoidLogs';
import BM_PromosDiscounts from '../components/BranchManager/Settings/BM_PromosDiscounts';
import BM_ExpensesTab from '../components/BranchManager/Expenses/BM_ExpensesTab';

import BM_AddCustomers       from '../components/BranchManager/Settings/BM_AddCustomers';
import BM_AddVouchers        from '../components/BranchManager/Settings/BM_AddVouchers';
import BM_BackupSystem       from '../components/BranchManager/Settings/BM_BackupSystem';
import BM_CustomerReport     from '../components/BranchManager/Settings/BM_CustomerReport';
import BM_ImportData         from '../components/BranchManager/Settings/BM_ImportData';
import BM_SalesSettings      from '../components/BranchManager/Settings/BM_SalesSettings';
import BM_Settings           from '../components/BranchManager/Settings/BM_Settings';
import BM_UploadData         from '../components/BranchManager/Settings/BM_UploadData';
import BM_PaymentSettings    from '../components/BranchManager/Settings/BM_PaymentSettings';

// ─── Font tokens and Global Styles ────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');
  *, *::before, *::after, body, input, button, select, textarea {
    font-family: 'DM Sans', sans-serif !important;
    box-sizing: border-box;
  }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: #f4f2fb; }
  ::-webkit-scrollbar-thumb { background: #d4d0e8; border-radius: 4px; }
  .bm-root, .bm-root * { font-family: 'DM Sans', sans-serif !important; box-sizing: border-box; }
  .bm-label { font-size: 0.62rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #3f3f46; }
  .bm-sub   { font-size: 0.65rem; font-weight: 400; color: #71717a; }
  .bm-value { font-size: 1.9rem; font-weight: 800; letter-spacing: -0.035em; line-height: 1; }
  .bm-live  {
    display: inline-flex; align-items: center; gap: 5px;
    background: #f0fdf4; border: 1px solid #bbf7d0;
    border-radius: 100px; padding: 4px 10px;
  }
  .bm-live-dot  { width: 5px; height: 5px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 5px rgba(34,197,94,0.6); animation: bm-pulse 2s infinite; }
  .bm-live-text { font-size: 0.55rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #16a34a; }
  @keyframes bm-pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
  .bm-tab { font-size: 0.6rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; padding: 6px 13px; border-radius: 0.4rem; border: none; cursor: pointer; transition: background 0.12s, color 0.12s; }
  .bm-tab-on  { background: #1a0f2e; color: #fff; }
  .bm-tab-off { background: transparent; color: #a1a1aa; }
  .bm-tab-off:hover { background: #ede8ff; color: #3b2063; }
  .bm-pill { font-size: 0.58rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; border-radius: 100px; padding: 3px 9px; border: 1px solid #e4e4e7; background: #f4f4f5; color: #71717a; }
  .card { transition: box-shadow 0.15s ease, transform 0.15s ease, border-color 0.15s ease; }
  .card:hover { box-shadow: 0 8px 32px rgba(59,32,99,0.12); transform: translateY(-1px); border-color: #ddd6f7; }
  .bm-card { background: #ffffff; border: 1px solid #e4e4e7; border-radius: 0.875rem; transition: all 0.15s ease; }
  .bm-card:hover { border-color: #ddd6f7; box-shadow: 0 8px 32px rgba(59,32,99,0.12); }
`;

// ─── Global Styles component ──────────────────────────────────────────────────
const GlobalStyles = () => <style>{STYLES}</style>;

// ─── Page title map ───────────────────────────────────────────────────────────
const PAGE_TITLES: Record<string, { label: string; desc: string }> = {
  dashboard:            { label: 'Dashboard',            desc: 'Real-time summary for your branch' },
  'live-pulse':         { label: 'Live Pulse',           desc: 'Real-time sales ticker and staff heartbeat' },
  'staff-performance':  { label: 'Staff Performance',    desc: 'Local team leaderboards & efficiency metrics' },
  users:                { label: 'User Management',      desc: 'Staff accounts, roles & permissions' },
  'device-management':  { label: 'Device Management',    desc: 'POS terminals & connected devices' },
  'sales-dashboard':    { label: 'Sales Dashboard',      desc: 'Daily & periodic sales breakdown' },
  'items-report':       { label: 'Items Report',         desc: 'Per-item sales and movement data' },
  'x-reading':          { label: 'X Reading',            desc: 'Mid-day POS shift summary' },
  'z-reading':          { label: 'Z Reading',            desc: 'End-of-day POS closing report' },
  'menu-list':          { label: 'Menu List',            desc: 'All products & pricing' },
  'category-list':      { label: 'Categories',           desc: 'Top-level menu groupings' },
  'sub-category-list':  { label: 'Sub-Categories',       desc: 'Nested category structure' },
  'inventory-dashboard':{ label: 'Inventory Dashboard',  desc: 'Stock summary for your branch' },
  'inventory-list':     { label: 'Inventory List',       desc: 'Current stock levels' },
  'inventory-category': { label: 'Inventory Categories', desc: 'Inventory groupings' },
  supplier:             { label: 'Suppliers',            desc: 'Vendor records & contacts' },
  'item-checker':       { label: 'Item Checker',         desc: 'Verify item availability & details' },
  'item-serials':       { label: 'Item Serials',         desc: 'Serialized item tracking' },
  'purchase-order':     { label: 'Purchase Order',       desc: 'Incoming stock orders' },
  'stock-transfer':     { label: 'Stock Transfer',       desc: 'Move stock between branches' },
  'inventory-report':   { label: 'Inventory Report',     desc: 'Stock movement & usage data' },
  'audit-logs':         { label: 'Audit Logs',           desc: 'Complete system activity trail' },
  'void-logs':          { label: 'Void Logs',            desc: 'Voided transaction history' },
  'promos-discounts':   { label: 'Promos & Discounts',   desc: 'View and toggle branch discounts' },
  expenses:             { label: 'Expenses',             desc: 'Track local branch expenditure and receipts' },
  settings:             { label: 'Settings',             desc: 'Branch configuration & preferences' },
  'add-customers':      { label: 'Add Customers',        desc: 'Customer management' },
  'add-vouchers':       { label: 'Add Vouchers',         desc: 'Voucher management' },
  'backup-system':      { label: 'Backup System',        desc: 'Data backup & recovery' },
  'customer-report':    { label: 'Customer Report',      desc: 'Customer analytics' },
  'import-data':        { label: 'Import Data',          desc: 'Bulk data import' },
  'sales-settings':     { label: 'Sales Settings',       desc: 'Sales configuration' },
  'upload-data':        { label: 'Upload Data',          desc: 'Data upload management' },
  'payment-settings':   { label: 'Payment Settings',     desc: 'Branch-specific payment options (GCash/Maya)' },
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface AuthUser {
  id:        number;
  name:      string;
  email:     string;
  role:      string;
  branch_id: number | null;
  branch?:   { id: number; name: string; location?: string };
}

// ─── Root layout ──────────────────────────────────────────────────────────────
const BranchManagerDashboard = () => {
  const [isSidebarOpen,     setSidebarOpen]    = useState(false);
  const [activeTab,         setActiveTab]      = useState('dashboard');
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

  const branchLabel = authUser?.branch?.name ?? 'Branch Manager';

  // ── Derive page meta from the map ─────────────────────────────────────────
  const page = PAGE_TITLES[activeTab] ?? {
    label: activeTab.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    desc:  '',
  };

  const handleLogoutClick = () => setLogoutModalOpen(true);

  const confirmLogout = async () => {
    setIsLoggingOut(true);
    setLogoutModalOpen(false);
    ['auth_token', 'lucky_boba_token', 'token', 'user_role', 'lucky_boba_authenticated']
      .forEach(k => localStorage.removeItem(k));
    sessionStorage.clear();
    window.location.href = '/login';
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':          return <BM_Dashboard branchId={authUser?.branch_id ?? null} />;
      case 'live-pulse':         return <BM_PulseTab branchId={authUser?.branch_id ?? null} />;
      case 'staff-performance':  return <BM_StaffPerformanceTab branchId={authUser?.branch_id ?? null} />;
      case 'users':              return <UserManagement />;
      case 'device-management':  return <BM_DeviceManagement branchId={authUser?.branch_id ?? null} />;
      case 'sales-dashboard':    return <SalesDashboard />;
      case 'items-report':       return <ItemsReport />;
      case 'x-reading':          return <XReading />;
      case 'z-reading':          return <ZReading />;
      case 'expenses':           return <BM_ExpensesTab branchId={authUser?.branch_id ?? null} />;

      // ── Mobile App ──
      case 'app-orders':         return <BM_AppOrders />;
      case 'menu-management':    return <BM_MenuManagement />;
      case 'menu-list':          return <BM_MenuList />;
      case 'category-list':      return <BM_Categories />;
      case 'sub-category-list':  return <BM_SubCategories />;
      case 'inventory-dashboard':return <BM_InventoryDashboard />;
      case 'inventory-list':     return <BM_InventoryList />;
      case 'inventory-category': return <BM_InventoryCategories />;
      case 'supplier':           return <BM_InventorySuppliers />;
      case 'item-checker':       return <BM_InventoryItemChecker />;
      case 'item-serials':       return <BM_InventoryItemSerials />;
      case 'purchase-order':     return <BM_InventoryPurchaseOrder />;
      case 'stock-transfer':     return <BM_InventoryStockTransfer branchId={authUser?.branch_id ?? null} />;
      case 'inventory-report':   return <BM_InventoryReports />;
      case 'audit-logs':         return <BranchManagerAuditLogsTab />;
      case 'void-logs':          return <BMVoidLogsPanel branchId={authUser?.branch_id ?? null} />;
      case 'promos-discounts':   return <BM_PromosDiscounts />;
      case 'settings':           return <BM_Settings />;
      case 'add-customers':      return <BM_AddCustomers onBack={() => setActiveTab('settings')} />;
      case 'add-vouchers':       return <BM_AddVouchers onBack={() => setActiveTab('settings')} />;
      case 'backup-system':      return <BM_BackupSystem onBack={() => setActiveTab('settings')} />;
      case 'customer-report':
        return <BM_CustomerReport
          onBack={() => setActiveTab('settings')}
          activeTab={activeTab as unknown as React.ComponentProps<typeof BM_CustomerReport>['activeTab']}
          setActiveTab={setActiveTab as unknown as React.ComponentProps<typeof BM_CustomerReport>['setActiveTab']}
        />;
      case 'import-data':    return <BM_ImportData onBack={() => setActiveTab('settings')} />;
      case 'sales-settings': return <BM_SalesSettings isOpen={true} onClose={() => setActiveTab('settings')} />;
      case 'upload-data':    return <BM_UploadData onBack={() => setActiveTab('settings')} />;
      case 'payment-settings': return <BM_PaymentSettings onBack={() => setActiveTab('settings')} />;
      default:               return <BM_Dashboard branchId={authUser?.branch_id ?? null} />;
    }
  };

  return (
    <>
      <GlobalStyles />  {/* ← ADD THIS LINE */}
      <div className="bm-root flex flex-col md:flex-row h-screen bg-[#f5f4f8] overflow-hidden min-w-0">
        <div className="shrink-0">
          <BranchManagerSidebar
            isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen}
            logo={logo} currentTab={activeTab} setCurrentTab={setActiveTab}
            onLogout={handleLogoutClick}
            isLoggingOut={isLoggingOut}
          />
        </div>
        <main className="flex-1 flex flex-col overflow-hidden min-w-0">
          <BranchManagerTopNav
            pageTitle={page.label}
            pageDesc={page.desc}
            branchLabel={branchLabel}
            onMenuClick={() => setSidebarOpen(v => !v)}
          />
          <div className="flex-1 overflow-auto">{renderContent()}</div>
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