import { useState, useEffect } from 'react';
import api from '../services/api';
import { LogOut } from 'lucide-react';
import TeamLeaderSidebar from '../components/TeamLeader/TeamLeaderSidebar';
import OpsTopBar from '../components/Supervisor/OpsTopBar';

// Import panels
import TL_DashboardPanel   from '../components/TeamLeader/Home/TL_DashboardPanel';
import StaffOverviewPanel  from '../components/TeamLeader/Home/StaffOverviewPanel';
import SalesDashboardPanel from '../components/TeamLeader/Reports/SalesDashboardPanel';
import ItemsReportPanel    from '../components/TeamLeader/Reports/ItemsReportPanel';
import XReadingPanel       from '../components/TeamLeader/Reports/XReadingPanel';
import ZReadingPanel       from '../components/TeamLeader/Reports/ZReadingPanel';
import RawMaterialsPanel   from '../components/TeamLeader/Inventory/RawMaterialsPanel';
import RecipesPanel        from '../components/TeamLeader/Inventory/RecipesPanel';
import UsageReportPanel    from '../components/TeamLeader/Inventory/UsageReportPanel';
import ItemCheckerPanel    from '../components/TeamLeader/Inventory/ItemCheckerPanel';
import SV_VoidLogsPanel    from '../components/Supervisor/Logging/SVVoidLogs';
import TL_ExpensePanel      from '../components/TeamLeader/Inventory/TL_ExpensePanel';
import TL_StockTransferPanel from '../components/TeamLeader/Inventory/TL_StockTransferPanel';
import TL_PurchaseOrderPanel from '../components/TeamLeader/Inventory/TL_PurchaseOrderPanel';
import TL_CategoriesTab    from '../components/TeamLeader/Menu/TL_CategoriesTab';
import TL_SubCategoriesTab from '../components/TeamLeader/Menu/TL_SubCategoriesTab';
import TL_MenuItemsTab     from '../components/TeamLeader/Menu/TL_MenuItemsTab';

// ── Styles ────────────────────────────────────────────────────────────────────
const DASHBOARD_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');
  .tl-root, .tl-root * { font-family: 'DM Sans', sans-serif !important; box-sizing: border-box; }
`;

// ── Types ────────────────────────────────────────────────────────────────────
interface AuthUser {
  id:        number;
  name:      string;
  email:     string;
  role:      string;
  branch_id: number | null;
  branch?:   { id: number; name: string };
}

const TeamLeaderDashboard = () => {
  const [isSidebarOpen,     setSidebarOpen]    = useState(false);
  const [activeTab,         setActiveTab]      = useState('dashboard');
  const [authUser,          setAuthUser]       = useState<AuthUser | null>(null);
  const [isLogoutModalOpen, setLogoutModalOpen] = useState(false);
  const [isLoggingOut,      setIsLoggingOut]   = useState(false);

  useEffect(() => {
    api.get<AuthUser>('/user')
      .then(res => {
        const u = res.data;
        setAuthUser({ id: u.id, name: u.name, email: u.email, role: u.role, branch_id: u.branch_id, branch: u.branch });
      })
      .catch(err => console.error('Failed to load user', err));
  }, []);

  const branchLabel = authUser?.branch?.name ?? null;

  const handleLogoutClick = () => setLogoutModalOpen(true);
  const confirmLogout = async () => {
    setIsLoggingOut(true);
    setLogoutModalOpen(false);
    ['auth_token','lucky_boba_token','token','user_role','lucky_boba_authenticated']
      .forEach(k => localStorage.removeItem(k));
    sessionStorage.clear();
    window.location.href = '/login';
  };

  const renderContent = () => {
    const bId = authUser?.branch_id ?? null;
    switch (activeTab) {
      case 'dashboard':       return <TL_DashboardPanel />;
      case 'users':           return <StaffOverviewPanel  branchId={bId} />;
      case 'void-logs':       return <SV_VoidLogsPanel    branchId={bId} />;
      case 'sales-dashboard': return <SalesDashboardPanel branchId={bId} />;
      case 'items-report':    return <ItemsReportPanel    branchId={bId} />;
      case 'x-reading':       return <XReadingPanel       branchId={bId} />;
      case 'z-reading':       return <ZReadingPanel       branchId={bId} />;
      case 'raw-materials':   return <RawMaterialsPanel branchId={bId} />;
      case 'recipes':         return <RecipesPanel />;
      case 'usage-report':    return <UsageReportPanel  branchId={bId} />;
      case 'item-checker':    return <ItemCheckerPanel  branchId={bId} />;
      case 'expenses':        return <TL_ExpensePanel    branchId={bId} />;
      case 'stock-transfer':  return <TL_StockTransferPanel branchId={bId} />;
      case 'purchase-order':  return <TL_PurchaseOrderPanel branchId={bId} />;
      case 'tl-menu-categories':    return <TL_CategoriesTab />;
      case 'tl-menu-subcategories': return <TL_SubCategoriesTab />;
      case 'tl-menu-items':         return <TL_MenuItemsTab />;
      default:                return <TL_DashboardPanel />;
    }
  };

  return (
    <>
      <style>{DASHBOARD_STYLES}</style>
      <div className="tl-root flex flex-col md:flex-row h-screen bg-[#f9fafb] overflow-hidden">

        <TeamLeaderSidebar
          isSidebarOpen={isSidebarOpen}
          setSidebarOpen={setSidebarOpen}
          currentTab={activeTab}
          setCurrentTab={setActiveTab}
          onLogout={handleLogoutClick}
          isLoggingOut={isLoggingOut}
        />

        <main className="flex-1 flex flex-col overflow-hidden">
          <OpsTopBar 
            activeTab={activeTab}
            roleLabel="Team Leader"
            branchLabel={branchLabel}
            onMenuClick={() => setSidebarOpen(true)}
            onNavigate={setActiveTab}
          />

          <div className="flex-1 overflow-auto bg-[#f1f5f9]/20">
            <div className="p-0 md:p-2 w-full animate-in fade-in duration-500">
              {renderContent()}
            </div>
          </div>
        </main>
      </div>

      {/* Logout Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          <div className="bg-white w-full max-w-sm border border-zinc-200 rounded-[1.25rem] p-8 flex flex-col items-center text-center shadow-2xl">
            <div className="w-11 h-11 rounded-[0.625rem] bg-red-50 flex items-center justify-center mb-5">
              <LogOut size={19} className="text-[#be2525]" />
            </div>
            <h3 className="text-[#1a0f2e] font-bold text-base mb-2 tracking-tight">End Session?</h3>
            <p className="text-zinc-500 text-sm font-medium mb-7 leading-relaxed">
              Are you sure you want to log out of the team leader terminal?
            </p>
            <div className="flex flex-col w-full gap-2">
              <button
                onClick={confirmLogout}
                className="w-full py-3 text-[10px] font-bold tracking-[0.18em] uppercase text-white bg-[#be2525] hover:bg-[#a11f1f] transition-all rounded-[0.625rem] active:scale-[0.98]"
              >
                Logout
              </button>
              <button
                onClick={() => setLogoutModalOpen(false)}
                className="w-full py-3 text-[10px] font-bold tracking-[0.18em] uppercase text-zinc-500 bg-white border border-zinc-200 hover:bg-zinc-50 transition-all rounded-[0.625rem] active:scale-[0.98]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TeamLeaderDashboard;