"use client"

import { useState, useEffect } from 'react';
import BranchManagerSidebar from '../components/BranchManager/BranchManagerSidebar';
import logo from '../assets/logo.png';
import UserManagement from '../components/BranchManager/Home/UserManagement';
import BM_Dashboard from '../components/BranchManager/Home/BM_Dashboard';
import BM_DeviceManagement from '../components/BranchManager/Home/BM_DeviceManagement';
import api from '../services/api';
import { LogOut } from 'lucide-react';
import BranchManagerTopNav from '../components/BranchManager/BranchManagerTopNav'; 

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
import BMVoidLogsPanel from '../components/BranchManager/FloorOps/BMVoidLogs';

import BM_AddCustomers       from '../components/BranchManager/Settings/BM_AddCustomers';
import BM_AddVouchers        from '../components/BranchManager/Settings/BM_AddVouchers';
import BM_BackupSystem       from '../components/BranchManager/Settings/BM_BackupSystem';
import BM_CustomerReport     from '../components/BranchManager/Settings/BM_CustomerReport';
import BM_ImportData         from '../components/BranchManager/Settings/BM_ImportData';
import BM_SalesSettings      from '../components/BranchManager/Settings/BM_SalesSettings';
import BM_Settings           from '../components/BranchManager/Settings/BM_Settings';
import BM_UploadData         from '../components/BranchManager/Settings/BM_UploadData';

// ─── Page Titles (outside component — same pattern as SuperAdmin) ─────────────
const PAGE_TITLES: Record<string, { label: string; desc: string }> = {
  'dashboard':           { label: 'Master Dashboard',      desc: 'Real-time summary for your branch'         },
  'users':               { label: 'User Management',       desc: 'Staff accounts, roles & permissions'       },
  'device-management':   { label: 'Device Management',     desc: 'POS terminals & connected devices'         },
  'sales-dashboard':     { label: 'Sales Report',          desc: 'Daily & periodic sales breakdown'          },
  'items-report':        { label: 'Items Report',          desc: 'Per-item sales and movement data'          },
  'x-reading':           { label: 'X Reading',             desc: 'Mid-day POS shift summary'                 },
  'z-reading':           { label: 'Z Reading',             desc: 'End-of-day POS closing report'             },
  'menu-list':           { label: 'Menu List',             desc: 'All products & pricing'                    },
  'category-list':       { label: 'Categories',            desc: 'Top-level menu groupings'                  },
  'sub-category-list':   { label: 'Sub-Categories',        desc: 'Nested category structure'                 },
  'inventory-dashboard': { label: 'Inventory Overview',    desc: 'Stock summary for your branch'             },
  'inventory-list':      { label: 'Raw Materials',         desc: 'Ingredients & packaging stock'             },
  'inventory-category':  { label: 'Inventory Categories',  desc: 'Stock groupings & classifications'         },
  'supplier':            { label: 'Supplier',              desc: 'Vendor records & contacts'                 },
  'item-checker':        { label: 'Item Checker',          desc: 'Verify item availability & details'        },
  'item-serials':        { label: 'Item Serials',          desc: 'Serialized item tracking'                  },
  'purchase-order':      { label: 'Purchase Order',        desc: 'Incoming stock orders'                     },
  'stock-transfer':      { label: 'Stock Transfer',        desc: 'Move stock between branches'               },
  'inventory-report':    { label: 'Usage Report',          desc: 'Material consumption & variance'           },
  'audit-logs':          { label: 'Audit Logs',            desc: 'Complete system activity trail'            },
  'void-logs':           { label: 'Void Logs',             desc: 'Cancelled & voided transaction records'    },
  'settings':            { label: 'System Settings',       desc: 'Branch configuration & preferences'       },
  'add-customers':       { label: 'Add Customers',         desc: 'Register new customer accounts'            },
  'add-vouchers':        { label: 'Promotions & Vouchers', desc: 'Active campaigns & discount codes'         },
  'backup-system':       { label: 'Backup System',         desc: 'Data backup & restore'                     },
  'customer-report':     { label: 'Customer Report',       desc: 'Customer activity & purchase history'      },
  'import-data':         { label: 'Import Data',           desc: 'Bulk data import & upload'                 },
  'sales-settings':      { label: 'Sales Settings',        desc: 'POS & transaction configuration'           },
  'upload-data':         { label: 'Upload Data',           desc: 'File uploads & data sync'                  },
};

// ─── Confirm Modal ────────────────────────────────────────────────────────────
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
    <div className="fixed inset-0 z-200 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
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
          >
            {btnText}
          </button>
          {cancel && (
            <button
              onClick={cancel}
              className="w-full py-3 text-[10px] font-bold tracking-[0.18em] uppercase text-zinc-500 bg-white border border-zinc-200 hover:bg-zinc-50 transition-all rounded-[0.625rem] active:scale-[0.98]"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
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

  const branchLabel = authUser?.name ?? null;

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
      case 'users':              return <UserManagement />;
      case 'device-management':  return <BM_DeviceManagement branchId={authUser?.branch_id ?? null} />;
      case 'sales-dashboard':    return <SalesDashboard />;
      case 'items-report':       return <ItemsReport />;
      case 'x-reading':          return <XReading />;
      case 'z-reading':          return <ZReading />;
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
      case 'stock-transfer':     return <BM_InventoryStockTransfer />;
      case 'inventory-report':   return <BM_InventoryReports />;
      case 'audit-logs':         return <BranchManagerAuditLogsTab />;
      case 'void-logs':          return <BMVoidLogsPanel branchId={authUser?.branch_id ?? null} />;
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
      default:               return <BM_Dashboard branchId={authUser?.branch_id ?? null} />;
    }
  };

  return (
    <>
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