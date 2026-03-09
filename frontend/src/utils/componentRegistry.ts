import MenuList from '../components/Cashier/MenuItems/MenuList';
import CategoryList from '../components/Cashier/MenuItems/CategoryList';
import SubCategoryList from '../components/Cashier/MenuItems/Sub-CategoryList';

// --- Import Inventory Components ---
import InventoryDashboard from '../components/Cashier/Inventory/InventoryDashboard';
import InventoryCategoryList from '../components/Cashier/Inventory/InventoryCategoryList';
import InventoryList from '../components/Cashier/Inventory/InventoryList';
import InventoryReport from '../components/Cashier/Inventory/InventoryReport';
import ItemChecker from '../components/Cashier/Inventory/ItemChecker';
import ItemSerials from '../components/Cashier/Inventory/ItemSerials';
import PurchaseOrder from '../components/Cashier/Inventory/PurchaseOrder';
import StockTransfer from '../components/Cashier/Inventory/StockTransfer';
import Supplier from '../components/Cashier/Inventory/Supplier';

// --- Import Settings Component ---
import Settings from '../components/Settings';

// --- Import Sales Report Components ---
import SalesDashboard from '../components/Cashier/SalesReport/SalesDashboard';
import ItemsReport from '../components/Cashier/SalesReport/ItemsReport';
import XReading from '../components/Cashier/SalesReport/XReading';
import ZReading from '../components/Cashier/SalesReport/ZReading';

export const getComponentForTab = (activeTab: string) => {
  switch (activeTab) {
    case 'dashboard':
      return null; // DashboardStats is defined in the same file
    case 'users':
      return null; // UserManagement is defined in the same file
    
    // --- SALES REPORT TABS ---
    case 'sales-dashboard':
      return SalesDashboard;
    case 'items-report':
      return ItemsReport;
    case 'x-reading':
      return XReading;
    case 'z-reading':
      return ZReading;

    // --- MENU ITEMS TABS ---
    case 'menu-list':
      return MenuList;
    case 'category-list':
      return CategoryList;
    case 'sub-category-list':
      return SubCategoryList;

    // --- INVENTORY TABS ---
    case 'inventory-dashboard':
      return InventoryDashboard;
    case 'inventory-list':
      return InventoryList;
    case 'inventory-category':
      return InventoryCategoryList;
    case 'supplier':
      return Supplier;
    case 'item-checker':
      return ItemChecker;
    case 'item-serials':
      return ItemSerials;
    case 'purchase-order':
      return PurchaseOrder;
    case 'stock-transfer':
      return StockTransfer;
    case 'inventory-report':
      return InventoryReport;

    // --- SETTINGS TAB ---
    case 'settings':
      return Settings;
      
    default:
      return null;
  }
};
