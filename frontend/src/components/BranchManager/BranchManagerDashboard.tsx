import { useState } from 'react';
import logo from '../../assets/logo.png';
import DashboardStats from './DashboardStats';
import UserManagement from './UserManagement';

// Import Sales Report Components
import SalesDashboard from '../SalesReport/SalesDashboard';
import ItemsReport from '../SalesReport/ItemsReport';
import XReading from '../SalesReport/XReading';
import ZReading from '../SalesReport/ZReading';
import MallAccredReport from '../SalesReport/MallAccredReport';

// Import Menu Management Components
import MenuList from '../MenuItems/MenuList';
import CategoryList from '../MenuItems/CategoryList';
import SubCategoryList from '../MenuItems/Sub-CategoryList';

// Import Inventory Components
import InventoryDashboard from '../Inventory/InventoryDashboard';
import InventoryCategoryList from '../Inventory/InventoryCategoryList';
import InventoryList from '../Inventory/InventoryList';
import InventoryReport from '../Inventory/InventoryReport';
import ItemChecker from '../Inventory/ItemChecker';
import ItemSerials from '../Inventory/ItemSerials';
import PurchaseOrder from '../Inventory/PurchaseOrder';
import StockTransfer from '../Inventory/StockTransfer';
import Supplier from '../Inventory/Supplier';

// Import Settings Component
import Settings from '../Settings';

const BranchManagerDashboard = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardStats />;
      case 'users':
        return <UserManagement />;
      
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

      // --- SETTINGS TAB ---
      case 'settings':
        return <Settings />;
        
      default:
        return <DashboardStats />;
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#f8f6ff] text-zinc-900 font-sans overflow-hidden">
      
      {/* Mobile Header */}
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
      
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'dashboard' && (
          <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 md:px-10 py-6 md:py-8 gap-4">
            <div>
              <h1 className="text-xl md:text-4xl font-black text-[#3b2063] uppercase tracking-tight">
                Branch Manager
              </h1>
              <p className="text-zinc-400 font-bold text-[9px] md:text-[10px] uppercase tracking-[0.2em] mt-1">
                Overview & User Management
              </p>
            </div>
          </header>
        )}

        {/* Dynamic Content Rendering */}
        <div className="flex-1 overflow-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default BranchManagerDashboard;
