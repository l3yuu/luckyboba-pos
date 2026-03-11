// pages/SuperAdminDashboard.tsx
import { useState } from "react";
import SuperAdminSidebar from "../components/NewSuperAdmin/SuperAdminSidebar";
import SuperAdminTopBar  from "../components/NewSuperAdmin/SuperAdminTopBar";
import type { TabId }    from "../components/NewSuperAdmin/SuperAdminSidebar";
import OverviewTab   from "../components/NewSuperAdmin/Tabs/OverviewTab";
import BranchesTab   from "../components/NewSuperAdmin/Tabs/BranchesTab";
import UsersTab      from "../components/NewSuperAdmin/Tabs/UsersTab";
import ReportsTab    from "../components/NewSuperAdmin/Tabs/ReportsTab";
import AuditLogsTab  from "../components/NewSuperAdmin/Tabs/AuditLogsTab";
import PromotionsTab from "../components/NewSuperAdmin/Tabs/PromotionsTab";
import SettingsTab   from "../components/NewSuperAdmin/Tabs/SettingsTab";

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
      case "overview":   return <OverviewTab   />;
      case "branches":   return <BranchesTab   />;
      case "users":      return <UsersTab       />;
      case "reports":    return <ReportsTab     />;
      case "audit":      return <AuditLogsTab   />;
      case "promotions": return <PromotionsTab  />;
      case "settings":   return <SettingsTab    />;
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
