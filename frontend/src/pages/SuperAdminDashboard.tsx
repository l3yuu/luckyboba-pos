// pages/SuperAdminDashboard.tsx
import { useState } from "react";
import SuperAdminSidebar from "../components/NewSuperAdmin/SuperAdminSidebar";
import SuperAdminTopBar from "../components/NewSuperAdmin/SuperAdminTopBar";
import type { TabId } from "../components/NewSuperAdmin/SuperAdminSidebar";

// ── Existing tabs ──────────────────────────────────────────────────────────────
import OverviewTab from "../components/NewSuperAdmin/Sidebar/Navigation/OverviewTab";
import BranchesTab from "../components/NewSuperAdmin/Sidebar/Navigation/BranchesTab";
import UsersTab from "../components/NewSuperAdmin/Sidebar/Navigation/UsersTab";
import DeviceManagementTab from "../components/NewSuperAdmin/Sidebar/Navigation/DeviceManagementTab";
import AuditLogsTab from "../components/NewSuperAdmin/Sidebar/System/AuditLogsTab";
import PromotionsTab from "../components/NewSuperAdmin/Sidebar/System/PromotionsTab";
import SettingsTab from "../components/NewSuperAdmin/Sidebar/SettingsTab";

import SalesReportTab from "../components/NewSuperAdmin/Sidebar/Reports/SalesReportTab";
import CrossBranchTab from "../components/NewSuperAdmin/Sidebar/Reports/CrossBranchTab";
import AnalyticsTab from "../components/NewSuperAdmin/Sidebar/Reports/AnalyticsTab";
import ItemsReportTab from "../components/NewSuperAdmin/Sidebar/Reports/ItemsReportTab";
import XReadingTab from "../components/NewSuperAdmin/Sidebar/Reports/XReadingTab";
import ZReadingTab from "../components/NewSuperAdmin/Sidebar/Reports/ZReadingTab";
import StaffPerformanceTab from "../components/NewSuperAdmin/Sidebar/Navigation/StaffPerformanceTab";

import MenuItemsTab from "../components/NewSuperAdmin/Sidebar/MenuManagement/MenuItemsTab";
import CategoriesTab from "../components/NewSuperAdmin/Sidebar/MenuManagement/CategoriesTab";
import SubCategoriesTab from "../components/NewSuperAdmin/Sidebar/MenuManagement/SubCategoriesTab";

import InventoryOverview from "../components/NewSuperAdmin/Sidebar/Inventory/InventoryOverview";
import RawMaterialsTab from "../components/NewSuperAdmin/Sidebar/Inventory/RawMaterialsTab";
import UsageReportTab from "../components/NewSuperAdmin/Sidebar/Inventory/UsageReportTab";
import RecipesTab from "../components/NewSuperAdmin/Sidebar/Inventory/RecipesTab";
import SupplierTab from "../components/NewSuperAdmin/Sidebar/Inventory/SupplierTab";
import ItemCheckerTab from "../components/NewSuperAdmin/Sidebar/Inventory/ItemCheckerTab";
import ItemSerialsTab from "../components/NewSuperAdmin/Sidebar/Inventory/ItemSerialsTab";
import PurchaseOrderTab from "../components/NewSuperAdmin/Sidebar/Inventory/PurchaseOrderTab";
import StockTransferTab from "../components/NewSuperAdmin/Sidebar/Inventory/StockTransferTab";
import InventoryAlertsTab from "../components/NewSuperAdmin/Sidebar/Inventory/InventoryAlertsTab";

import ExpensesTab from "../components/NewSuperAdmin/Sidebar/Expenses/ExpensesTab";
import CardUsersTab from "../components/NewSuperAdmin/Sidebar/System/CardUsersTab";
import CardApprovalTab from "../components/NewSuperAdmin/Sidebar/System/CardApprovalTab";
import CardManagementTab from "../components/NewSuperAdmin/Sidebar/System/CardManagementTab";
import LoyaltyManagementTab from "../components/NewSuperAdmin/Sidebar/LoyaltyManagementTab";
import FeaturedDrinksTab from "../components/NewSuperAdmin/Sidebar/System/FeaturedDrinksTab";
import CustomerManagementTab from "../components/NewSuperAdmin/Sidebar/System/CustomerManagementTab";


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

const SuperAdminDashboard: React.FC = () => {
  const [active, setActive] = useState<TabId>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderContent = () => {
    switch (active) {

      // ── Navigation ────────────────────────────────────────────────────────
      case "overview": return <OverviewTab />;
      case "branches": return <BranchesTab />;
      case "users": return <UsersTab />;
      case "devices": return <DeviceManagementTab />;

      // ── Reports ───────────────────────────────────────────────────────────
      case "sales_report": return <SalesReportTab />;
      case "analytics": return <AnalyticsTab />;
      case "items_report": return <ItemsReportTab />;
      case "staff_performance": return <StaffPerformanceTab />;
      case "cross_branch_reports": return <CrossBranchTab />;
      case "x_reading": return <XReadingTab />;
      case "z_reading": return <ZReadingTab />;

      // ── Menu Management ───────────────────────────────────────────────────
      case "menu_items": return <MenuItemsTab />;
      case "categories": return <CategoriesTab />;
      case "subcategories": return <SubCategoriesTab />;

      // ── Inventory ─────────────────────────────────────────────────────────
      case "inv_overview": return <InventoryOverview />;
      case "raw_materials": return <RawMaterialsTab />;
      case "usage_report": return <UsageReportTab />;
      case "recipes": return <RecipesTab />;
      case "supplier": return <SupplierTab />;
      case "item_checker": return <ItemCheckerTab />;
      case "item_serials": return <ItemSerialsTab />;
      case "purchase_order": return <PurchaseOrderTab />;
      case "stock_transfer": return <StockTransferTab />;
      case "inventory_alerts": return <InventoryAlertsTab />;

      // ── Expenses ──────────────────────────────────────────────────────────
      case "expenses": return <ExpensesTab />;

      // ── System ────────────────────────────────────────────────────────────
      case "promotions": return <PromotionsTab />;
      case "audit": return <AuditLogsTab />;
      case "settings": return <SettingsTab />;
      case "featured_drinks": return <FeaturedDrinksTab />;

      // ── App ───────────────────────────────────────────────────────────────────
      case "card_management": return <CardManagementTab />;
      case "card_approvals": return <CardApprovalTab />;
      case "card_members": return <CardUsersTab />;
      case "loyalty": return <LoyaltyManagementTab />;
      case "customers": return <CustomerManagementTab />;
    }
  };

  return (
    <>
      <GlobalStyles />
      <div className="flex flex-col md:flex-row h-screen bg-[#f5f4f8] overflow-hidden">
        <SuperAdminSidebar
          open={sidebarOpen}
          setOpen={setSidebarOpen}
          active={active}
          setActive={setActive}
        />
        <main className="flex-1 flex flex-col overflow-hidden">
          <SuperAdminTopBar
            active={active}
            onMenuClick={() => setSidebarOpen(v => !v)}
            onNavigate={setActive}
          />
          <div className="flex-1 overflow-y-auto">{renderContent()}</div>
        </main>
      </div>
    </>
  );
};

export default SuperAdminDashboard;