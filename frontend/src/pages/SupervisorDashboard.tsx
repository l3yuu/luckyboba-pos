import { useState, useEffect } from 'react';
import api from '../services/api';
import { LogOut } from 'lucide-react';
import SupervisorSidebar from '../components/Supervisor/SupervisorSidebar';
import OpsTopBar from '../components/Supervisor/OpsTopBar';

// Reuse Team Leader panels where scope matches
import TL_DashboardPanel   from '../components/TeamLeader/Home/TL_DashboardPanel';
import StaffOverviewPanel  from '../components/TeamLeader/Home/StaffOverviewPanel';
import SalesDashboardPanel from '../components/TeamLeader/Reports/SalesDashboardPanel';
import ItemsReportPanel    from '../components/TeamLeader/Reports/ItemsReportPanel';
import XReadingPanel       from '../components/TeamLeader/Reports/XReadingPanel';
import SVZReading from '../components/Supervisor/Reports/SVZReading';
import SV_VoidLogsPanel    from '../components/Supervisor/Logging/SVVoidLogs';
import InventoryListPanel  from '../components/TeamLeader/Inventory/InventoryListPanel';
import ItemCheckerPanel    from '../components/TeamLeader/Inventory/ItemCheckerPanel';

// ─── Styles ───────────────────────────────────────────────────────────────────
const DASHBOARD_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');
  .sv-root, .sv-root * { font-family: 'DM Sans', sans-serif !important; box-sizing: border-box; }
`;

// ─── Types ────────────────────────────────────────────────────────────────────
interface AuthUser {
  id:        number;
  name:      string;
  email:     string;
  role:      string;
  branch_id: number | null;
  branch?:   { id: number; name: string };
}

const SupervisorDashboard = () => {
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
      case 'dashboard':       return <TL_DashboardPanel   branchId={bId} />;
      case 'users':           return <StaffOverviewPanel  branchId={bId} />;
      case 'void-logs':       return <SV_VoidLogsPanel    branchId={bId} />;
      case 'sales-dashboard': return <SalesDashboardPanel branchId={bId} />;
      case 'items-report':    return <ItemsReportPanel    branchId={bId} />;
      case 'x-reading':       return <XReadingPanel       branchId={bId} />;
      case 'z-reading':       return <SVZReading          branchId={bId} />;
      case 'inventory-list':  return <InventoryListPanel  branchId={bId} />;
      case 'item-checker':    return <ItemCheckerPanel    branchId={bId} />;
      default:                return <TL_DashboardPanel   branchId={bId} />;
    }
  };

  return (
    <>
      <style>{DASHBOARD_STYLES}</style>
      <div className="sv-root flex flex-col md:flex-row h-screen bg-[#fcfcfd] overflow-hidden">

        <SupervisorSidebar
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
            roleLabel="Supervisor"
            branchLabel={branchLabel}
            onMenuClick={() => setSidebarOpen(true)}
          />

          <div className="flex-1 overflow-auto bg-[#f8f9fa]/30">
            <div className="p-4 md:p-6 max-w-[1600px] mx-auto animate-in fade-in duration-500">
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
              Are you sure you want to log out of the supervisor terminal?
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

export default SupervisorDashboard;