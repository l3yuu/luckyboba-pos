import { useState } from 'react';
import BranchManagerSidebar from '../components/BranchManagerSidebar';
import logo from '../assets/logo.png';
import CashierManagement from '../components/CashierManager';

// --- Import Sales Report Components ---
import SalesDashboard from '../components/SalesReport/SalesDashboard';
import ItemsReport from '../components/SalesReport/ItemsReport';
import XReading from '../components/SalesReport/XReading';
import ZReading from '../components/SalesReport/ZReading';
import MallAccredReport from '../components/SalesReport/MallAccredReport';

// --- Import Menu Management Components ---
import MenuList from '../components/MenuItems/MenuList';
import CategoryList from '../components/MenuItems/CategoryList';
import SubCategoryList from '../components/MenuItems/Sub-CategoryList';

// --- Import Inventory Components ---
import InventoryDashboard from '../components/Inventory/InventoryDashboard';
import InventoryCategoryList from '../components/Inventory/InventoryCategoryList';
import InventoryList from '../components/Inventory/InventoryList';
import InventoryReport from '../components/Inventory/InventoryReport';
import ItemChecker from '../components/Inventory/ItemChecker';
import ItemSerials from '../components/Inventory/ItemSerials';
import PurchaseOrder from '../components/Inventory/PurchaseOrder';
import StockTransfer from '../components/Inventory/StockTransfer';
import Supplier from '../components/Inventory/Supplier';

// --- Import Settings Component ---
import Settings from '../components/Settings';


const BranchManagerDashboard = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardStats />;
      case 'users': return <CashierManagement />;
      case 'sales-dashboard': return <SalesDashboard />;
      case 'items-report': return <ItemsReport />;
      case 'x-reading': return <XReading />;
      case 'z-reading': return <ZReading />;
      case 'mall-accred': return <MallAccredReport />;
      case 'menu-list': return <MenuList />;
      case 'category-list': return <CategoryList />;
      case 'sub-category-list': return <SubCategoryList />;
      case 'inventory-dashboard': return <InventoryDashboard />;
      case 'inventory-list': return <InventoryList />;
      case 'inventory-category': return <InventoryCategoryList />;
      case 'supplier': return <Supplier />;
      case 'item-checker': return <ItemChecker />;
      case 'item-serials': return <ItemSerials />;
      case 'purchase-order': return <PurchaseOrder />;
      case 'stock-transfer': return <StockTransfer />;
      case 'inventory-report': return <InventoryReport />;
      case 'settings': return <Settings />;
      default: return <DashboardStats />;
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#f8f6ff] text-zinc-900 font-sans overflow-hidden">
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-zinc-200">
        <img src={logo} alt="Logo" className="h-8 w-auto object-contain" />
        <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 text-[#3b2063]">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
      </div>

      <BranchManagerSidebar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} logo={logo} currentTab={activeTab} setCurrentTab={setActiveTab} />

      <main className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'dashboard' && (
          <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 md:px-10 py-6 md:py-8 gap-4">
            <div>
              <h1 className="text-xl md:text-4xl font-black text-[#3b2063] uppercase tracking-tight">Branch Manager</h1>
              <p className="text-zinc-400 font-bold text-[9px] md:text-[10px] uppercase tracking-[0.2em] mt-1">Overview & User Management</p>
            </div>
          </header>
        )}
        <div className="flex-1 overflow-auto">{renderContent()}</div>
      </main>
    </div>
  );
};

const DashboardStats = () => (
  <section className="flex-1 px-4 sm:px-6 md:px-10 pb-6 sm:pb-8 md:pb-10 overflow-auto">
    <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {[
        { label: "Cash in", value: "₱0.00" },
        { label: "Cash out", value: "₱0.00" },
        { label: "Total Sales", value: "₱0.00", highlight: true },
        { label: "Total items", value: "0" },
      ].map((stat, i) => (
        <div key={i} className="rounded-2xl sm:rounded-3xl md:rounded-4xl border border-zinc-100 bg-white shadow-sm p-3 sm:p-4 md:p-5 lg:p-6 flex flex-col justify-between min-h-24 sm:min-h-28 md:min-h-32 lg:min-h-40">
          <p className="text-[10px] sm:text-[11px] md:text-[12px] lg:text-[13px] font-black uppercase tracking-widest text-zinc-400">{stat.label}</p>
          <p className={`text-lg sm:text-xl md:text-2xl font-black ${stat.highlight ? 'text-emerald-500' : 'text-[#3b2063]'}`}>{stat.value}</p>
        </div>
      ))}
    </div>
    <div className="mt-4 sm:mt-6 md:mt-8 grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 xl:grid-cols-2">
      {['Top seller for today', 'Top seller all time'].map((title) => (
        <div key={title} className="rounded-2xl sm:rounded-3xl md:rounded-[2.5rem] border border-zinc-100 bg-white shadow-sm p-4 sm:p-5 md:p-6 lg:p-8 min-h-40 sm:min-h-44 md:min-h-48 lg:min-h-64 flex flex-col">
          <p className="text-[10px] sm:text-[12px] md:text-[13px] lg:text-[15px] font-black uppercase tracking-widest text-zinc-400 mb-3 sm:mb-4 md:mb-6">{title}</p>
          <div className="flex-1 flex flex-col justify-center gap-2 sm:gap-3">
            {[1, 2, 3, 4, 5].map((rank) => (
              <div key={rank} className="flex items-center justify-between border-b border-zinc-100 pb-1 sm:pb-2">
                <p className="font-bold text-zinc-500 text-xs sm:text-sm">#{rank}</p>
                <p className="text-zinc-300 font-semibold text-xs sm:text-sm">Data unavailable</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </section>
);


export default BranchManagerDashboard;
