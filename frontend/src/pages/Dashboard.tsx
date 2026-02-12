import { useState } from 'react';
import Sidebar from "../components/Sidebar";
import logo from '../assets/logo.png';

// --- Import POS Components ---
import CashIn from '../components/Sales Order/CashIn'; 
import CashDrop from '../components/Sales Order/CashDrop';
import SearchReceipts from '../components/Sales Order/SearchReceipts';
import CashCount from '../components/Sales Order/CashCount';

// --- Import Sales Report Components ---
import SalesDashboard from '../components/Sales Report/SalesDashboard';
import ItemsReport from '../components/Sales Report/ItemsReport';
import XReading from '../components/Sales Report/XReading';
import ZReading from '../components/Sales Report/ZReading';
import MallAccredReport from '../components/Sales Report/MallAccredReport';

// --- Import Menu Management Components ---
import MenuList from '../components/Menu Items/MenuList';
import CategoryList from '../components/Menu Items/CategoryList';
import SubCategoryList from '../components/Menu Items/Sub-CategoryList';

// --- Import Expense Component ---
import Expense from '../components/Expense';

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

// --- Import Settings Component (New) ---
import Settings from '../components/Settings';

const Dashboard = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      // --- MAIN DASHBOARD (Default) ---
      case 'dashboard':
        return <DashboardStats />;

      // --- POS TABS ---
      case 'cash-in':
        return <CashIn />;
      case 'cash-drop':
        return <CashDrop />;
      case 'search-receipts':
        return <SearchReceipts />;
      case 'cash-count':
        return <CashCount />;

      // --- SALES REPORT TABS ---
      case 'sales-dashboard':
        return <SalesDashboard />;
      case 'items-report':
        return <ItemsReport />;
      case 'x-reading':
        return <XReading />;
      case 'z-reading':
        return <ZReading />;
      case 'mall-accred':
        return <MallAccredReport />;

      // --- MENU ITEMS TABS ---
      case 'menu-list':
        return <MenuList />;
      case 'category-list':
        return <CategoryList />;
      case 'sub-category-list':
        return <SubCategoryList />;

      // --- EXPENSE TAB ---
      case 'expense':
        return <Expense />;

      // --- INVENTORY TABS ---
      case 'inventory-dashboard':
        return <InventoryDashboard />;
      case 'inventory-list':
        return <InventoryList />;
      case 'inventory-category':
        return <InventoryCategoryList />;
      case 'supplier':
        return <Supplier />;
      case 'item-checker':
        return <ItemChecker />;
      case 'item-serials':
        return <ItemSerials />;
      case 'purchase-order':
        return <PurchaseOrder />;
      case 'stock-transfer':
        return <StockTransfer />;
      case 'inventory-report':
        return <InventoryReport />;

      // --- SETTINGS TAB (New) ---
      case 'settings':
        return <Settings />;

      // --- FALLBACK ---
      default:
        return <DashboardStats />;
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#f8f6ff] text-zinc-900 font-sans overflow-hidden">
      
      {/* --- Mobile Header --- */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-zinc-200">
        <img src={logo} alt="Logo" className="h-8 w-auto object-contain" />
        <button 
          onClick={() => setSidebarOpen(!isSidebarOpen)}
          className="p-2 text-[#3b2063]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
      </div>

      {/* --- Sidebar --- */}
      <Sidebar 
        isSidebarOpen={isSidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        logo={logo} 
        currentTab={activeTab}
        setCurrentTab={setActiveTab}
      />

      {/* --- Main Content Area --- */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'dashboard' && (
          <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 md:px-10 py-6 md:py-8 gap-4">
            <div>
              <h1 className="text-xl md:text-4xl font-black text-[#3b2063] uppercase tracking-tight">
                Dashboard
              </h1>
              <p className="text-zinc-400 font-bold text-[9px] md:text-[10px] uppercase tracking-[0.2em] mt-1">
                Performance Summary
              </p>
            </div>
          </header>
        )}

        {/* Dynamic Content Rendering */}
        {renderContent()}
      </main>
    </div>
  );
};

// --- Sub-components ---

const DashboardStats = () => (
  <section className="flex-1 px-6 md:px-10 pb-10 overflow-auto">
    <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {[
        { label: "Cash in", value: "₱0.00" },
        { label: "Cash out", value: "₱0.00" },
        { label: "Total Sales", value: "₱0.00", highlight: true },
        { label: "Total items", value: "0" },
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

    <div className="mt-6 md:mt-8 grid gap-4 md:gap-6 grid-cols-1 xl:grid-cols-2">
      <div className="rounded-[1.5rem] md:rounded-[2.5rem] border border-zinc-100 bg-white shadow-sm p-6 md:p-8 min-h-[180px] md:min-h-[220px] flex flex-col">
        <p className="text-[12px] md:text-[15px] font-black uppercase tracking-[0.25em] text-zinc-400 mb-4 md:mb-6">
          Top seller for today
        </p>
        <div className="flex-1 flex flex-col justify-center gap-3">
          {[1, 2, 3, 4, 5].map((rank) => (
            <div key={rank} className="flex items-center justify-between border-b border-zinc-100 pb-2">
              <p className="font-bold text-zinc-500">#{rank}</p>
              <p className="text-zinc-300 font-semibold">Data unavailable</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[1.5rem] md:rounded-[2.5rem] border border-zinc-100 bg-white shadow-sm p-6 md:p-8 min-h-[180px] md:min-h-[220px] flex flex-col">
        <p className="text-[12px] md:text-[15px] font-black uppercase tracking-[0.25em] text-zinc-400 mb-4 md:mb-6">
          Top seller all time
        </p>
        <div className="flex-1 flex flex-col justify-center gap-3">
          {[1, 2, 3, 4, 5].map((rank) => (
            <div key={rank} className="flex items-center justify-between border-b border-zinc-100 pb-2">
              <p className="font-bold text-zinc-500">#{rank}</p>
              <p className="text-zinc-300 font-semibold">Data unavailable</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default Dashboard;