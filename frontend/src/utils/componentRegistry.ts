import MenuList from '../components/Menu Items/MenuList';
import CategoryList from '../components/Menu Items/CategoryList';
import SubCategoryList from '../components/Menu Items/Sub-CategoryList';

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

// --- Import Sales Report Components ---
import SalesDashboard from '../components/Sales Report/SalesDashboard';
import ItemsReport from '../components/Sales Report/ItemsReport';
import XReading from '../components/Sales Report/XReading';
import ZReading from '../components/Sales Report/ZReading';
import MallAccredReport from '../components/Sales Report/MallAccredReport';

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
    case 'mall-accred':
      return MallAccredReport;

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
