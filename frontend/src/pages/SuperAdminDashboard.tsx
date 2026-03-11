// pages/SuperAdminDashboard.tsx
import { useState } from "react";
import SuperAdminSidebar from "../components/NewSuperAdmin/SuperAdminSidebar";
import SuperAdminTopBar  from "../components/NewSuperAdmin/SuperAdminTopBar";
import type { TabId }    from "../components/NewSuperAdmin/SuperAdminSidebar";

// ── Existing tabs ──────────────────────────────────────────────────────────────
import OverviewTab   from "../components/NewSuperAdmin/Tabs/OverviewTab";
import BranchesTab   from "../components/NewSuperAdmin/Tabs/BranchesTab";
import UsersTab      from "../components/NewSuperAdmin/Tabs/UsersTab";
import AuditLogsTab  from "../components/NewSuperAdmin/Tabs/AuditLogsTab";
import PromotionsTab from "../components/NewSuperAdmin/Tabs/PromotionsTab";
import SettingsTab   from "../components/NewSuperAdmin/Tabs/SettingsTab";



// ── Placeholders — replace with real components as you build them ──────────────
const Placeholder = ({ label }: { label: string }) => (
  <div className="flex flex-col items-center justify-center h-full gap-3 text-center p-12">
    <div className="w-12 h-12 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center">
      <span className="text-xl">🚧</span>
    </div>
    <p className="text-sm font-bold text-[#1a0f2e]">{label}</p>
    <p className="text-xs text-zinc-400 font-medium">This module is under construction</p>
  </div>
);

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
  const [active,      setActive]      = useState<TabId>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderContent = () => {
    switch (active) {

      // ── Navigation ────────────────────────────────────────────────────────
      case "overview":  return <OverviewTab />;
      case "branches":  return <BranchesTab />;
      case "users":     return <UsersTab    />;

      // ── Reports ───────────────────────────────────────────────────────────
      case "sales_report":         return <Placeholder label="Sales Report"          />;
      case "analytics":            return <Placeholder label="Analytics & Sales"     />;
      case "items_report":         return <Placeholder label="Items Report"          />;
      case "cross_branch_reports": return <Placeholder label="Cross-Branch Reports"  />;
      case "x_reading":            return <Placeholder label="X Reading"             />;
      case "z_reading":            return <Placeholder label="Z Reading"             />;

      // ── Menu Management ───────────────────────────────────────────────────
      case "menu_items":    return <Placeholder label="Menu List"       />;
      case "categories":    return <Placeholder label="Categories"      />;
      case "subcategories": return <Placeholder label="Sub-Categories"  />;

      // ── Inventory ─────────────────────────────────────────────────────────
      case "inv_overview":   return <Placeholder label="Inventory Overview" />;
      case "raw_materials":  return <Placeholder label="Raw Materials"      />;
      case "usage_report":   return <Placeholder label="Usage Report"       />;
      case "recipes":        return <Placeholder label="Recipes"            />;
      case "supplier":       return <Placeholder label="Supplier"        />;
      case "item_checker":   return <Placeholder label="Item Checker"    />;
      case "item_serials":   return <Placeholder label="Item Serials"    />;
      case "purchase_order": return <Placeholder label="Purchase Order"  />;
      case "stock_transfer": return <Placeholder label="Stock Transfer"  />;

      // ── Expenses ──────────────────────────────────────────────────────────
      case "expenses": return <Placeholder label="Expenses" />;

      // ── System ────────────────────────────────────────────────────────────
      case "promotions": return <PromotionsTab />;
      case "audit":      return <AuditLogsTab  />;
      case "settings":   return <SettingsTab   />;
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
          />
          <div className="flex-1 overflow-y-auto">{renderContent()}</div>
        </main>
      </div>
    </>
  );
};

export default SuperAdminDashboard;