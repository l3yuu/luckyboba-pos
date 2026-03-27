// pages/TeamLeaderDashboard.tsx

import { useState, useEffect } from 'react';
import api from '../services/api';
import logo from '../assets/logo.png';
import { LogOut, Menu, MapPin, Clock } from 'lucide-react';
import TeamLeaderSidebar from '../components/TeamLeader/TeamLeaderSidebar';
import TL_DashboardPanel     from '../components/TeamLeader/Home/TL_DashboardPanel';
import StaffOverviewPanel    from '../components/TeamLeader/Home/StaffOverviewPanel';
import InventoryListPanel    from '../components/TeamLeader/Inventory/InventoryListPanel';
import ItemCheckerPanel      from '../components/TeamLeader/Inventory/ItemCheckerPanel';
import ItemsReportPanel      from '../components/TeamLeader/Reports/ItemsReportPanel';
import SalesDashboardPanel   from '../components/TeamLeader/Reports/SalesDashboardPanel';
import XReadingPanel         from '../components/TeamLeader/Reports/XReadingPanel';
import ZReadingPanel         from '../components/TeamLeader/Reports/ZReadingPanel';
import VoidLogsPanel         from '../components/TeamLeader/FloorOps/VoidLogsPanel';
//import HourlySalesPanel from '../components/TeamLeader/FloorOps/HourlySalesPanel';

// ─── Styles ───────────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&display=swap');

  .tl-root, .tl-root * { font-family: 'DM Sans', sans-serif !important; box-sizing: border-box; }
  .tl-mono { font-family: 'JetBrains Mono', monospace !important; }
  .tl-label { font-size: 0.58rem; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: #71717a; }
  .tl-value { font-size: 2rem; font-weight: 800; letter-spacing: -0.04em; line-height: 1; color: #0f0a1a; }
  .tl-card { background: #fff; border: 1px solid #ede8f5; border-radius: 1rem; transition: box-shadow 0.15s, border-color 0.15s; }
  .tl-card:hover { box-shadow: 0 4px 24px rgba(59,32,99,0.08); border-color: #d4c9f0; }
  .tl-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 0.55rem; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; border-radius: 100px; padding: 3px 8px; }
  .tl-badge-green  { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
  .tl-badge-red    { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
  .tl-badge-amber  { background: #fffbeb; color: #d97706; border: 1px solid #fde68a; }
  .tl-badge-purple { background: #f5f3ff; color: #7c3aed; border: 1px solid #ddd6fe; }
  .tl-badge-blue   { background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; }
  .tl-pulse { width: 6px; height: 6px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 0 0 rgba(34,197,94,0.4); animation: tl-pulse-ring 2s infinite; }
  .tl-pulse-amber { background: #f59e0b; box-shadow: 0 0 0 0 rgba(245,158,11,0.4); }
  .tl-pulse-red   { background: #ef4444; box-shadow: 0 0 0 0 rgba(239,68,68,0.4); }
  @keyframes tl-pulse-ring { 0% { box-shadow: 0 0 0 0 rgba(34,197,94,0.4); } 70% { box-shadow: 0 0 0 6px rgba(34,197,94,0); } 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); } }
  @keyframes tl-spin { to { transform: rotate(360deg); } }
  .tl-spin { animation: tl-spin 1s linear infinite; }
  @keyframes tl-slide-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  .tl-animate { animation: tl-slide-in 0.3s ease forwards; }
  .tl-progress-bar { height: 4px; border-radius: 100px; background: #f4f4f5; overflow: hidden; }
  .tl-progress-fill { height: 100%; border-radius: 100px; transition: width 0.6s cubic-bezier(0.4,0,0.2,1); }
  .tl-velocity-bar { display: flex; align-items: flex-end; gap: 2px; height: 40px; }
  .tl-vel-col { flex: 1; border-radius: 3px 3px 0 0; transition: height 0.4s ease, opacity 0.2s; cursor: pointer; }
  .tl-vel-col:hover { opacity: 1 !important; }
  .tl-shift-ring { width: 56px; height: 56px; border-radius: 50%; background: conic-gradient(#3b2063 0%, #3b2063 var(--pct), #f0edf8 var(--pct), #f0edf8 100%); display: flex; align-items: center; justify-content: center; position: relative; }
  .tl-shift-ring::before { content: ''; position: absolute; width: 40px; height: 40px; border-radius: 50%; background: #fff; }
  .tl-shift-ring-text { position: relative; z-index: 1; font-size: 0.6rem; font-weight: 800; color: #3b2063; letter-spacing: -0.02em; }
  .bm-label { font-size: 0.62rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #3f3f46; }
  .bm-sub   { font-size: 0.65rem; font-weight: 400; color: #71717a; }
  .bm-value { font-size: 1.9rem; font-weight: 800; letter-spacing: -0.035em; line-height: 1; }
  .bm-tab { font-size: 0.6rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; padding: 6px 13px; border-radius: 0.4rem; border: none; cursor: pointer; transition: background 0.12s, color 0.12s; }
  .bm-tab-on  { background: #1a0f2e; color: #fff; }
  .bm-tab-off { background: transparent; color: #a1a1aa; }
  .bm-tab-off:hover { background: #ede8ff; color: #3b2063; }
  .bm-pill { font-size: 0.58rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; border-radius: 100px; padding: 3px 9px; border: 1px solid #e4e4e7; background: #f4f4f5; color: #71717a; }
  .bm-live  { display: inline-flex; align-items: center; gap: 5px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 100px; padding: 4px 10px; }
  .bm-live-dot  { width: 5px; height: 5px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 5px rgba(34,197,94,0.6); animation: bm-pulse 2s infinite; }
  .bm-live-text { font-size: 0.55rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #16a34a; }
  @keyframes bm-pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
  .section-divider { display: flex; align-items: center; gap: 12px; margin: 8px 0 16px; }
  .section-divider-line { flex: 1; height: 1px; background: linear-gradient(to right, #ede8f5, transparent); }
  .section-divider-label { font-size: 0.58rem; font-weight: 800; letter-spacing: 0.22em; text-transform: uppercase; color: #a78bfa; display: flex; align-items: center; gap: 6px; }
  .readonly-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 0.52rem; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; background: #f5f3ff; color: #7c3aed; border: 1px solid #ddd6fe; border-radius: 100px; padding: 2px 8px; }
`;

// ─── Confirm Modal ────────────────────────────────────────────────────────────
interface ConfirmModalProps {
  show: boolean; icon?: React.ReactNode; title: string; desc?: string;
  action: () => void; btnText?: string; cancel: () => void; danger?: boolean;
}
const ConfirmModal: React.FC<ConfirmModalProps> = ({
  show, icon, title, desc, action, btnText = 'Confirm', cancel, danger = false,
}) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-200 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
      <div style={{ fontFamily: "'DM Sans', sans-serif" }} className="bg-white w-full max-w-sm border border-zinc-200 rounded-[1.25rem] p-8 flex flex-col items-center text-center shadow-2xl">
        {icon && (
          <div className={`w-11 h-11 rounded-[0.625rem] flex items-center justify-center mb-5 ${danger ? 'bg-red-50' : 'bg-[#f5f3ff]'}`}>
            {icon}
          </div>
        )}
        <h3 className="text-[#1a0f2e] font-bold text-base mb-2 tracking-tight">{title}</h3>
        {desc && <p className="text-zinc-500 text-sm font-medium mb-7 leading-relaxed">{desc}</p>}
        <div className="flex flex-col w-full gap-2">
          <button onClick={action}
            className={`w-full py-3 text-[10px] font-bold tracking-[0.18em] uppercase text-white transition-all rounded-[0.625rem] active:scale-[0.98] ${danger ? 'bg-[#be2525] hover:bg-[#a11f1f]' : 'bg-[#3b2063] hover:bg-[#2a1647]'}`}>
            {btnText}
          </button>
          <button onClick={cancel}
            className="w-full py-3 text-[10px] font-bold tracking-[0.18em] uppercase text-zinc-500 bg-white border border-zinc-200 hover:bg-zinc-50 transition-all rounded-[0.625rem] active:scale-[0.98]">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface AuthUser {
  id:        number;
  name:      string;
  email:     string;
  role:      string;
  branch_id: number | null;
  branch?:   { id: number; name: string };
}

// ─── Root layout ──────────────────────────────────────────────────────────────
const TeamLeaderDashboard = () => {
  const [isSidebarOpen,     setSidebarOpen]    = useState(false);
  const [activeTab,         setActiveTab]       = useState('dashboard');
  const [authUser,          setAuthUser]        = useState<AuthUser | null>(null);
  const [isLogoutModalOpen, setLogoutModalOpen] = useState(false);
  const [isLoggingOut,      setIsLoggingOut]    = useState(false);

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

  // ── Page title ──
  const pageTitle = activeTab === 'dashboard'
    ? 'Floor Dashboard'
    : activeTab.replace(/-/g,' ').replace(/\b\w/g, c => c.toUpperCase());

  // ── Tab renderer ──
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':        return <TL_DashboardPanel   branchId={authUser?.branch_id ?? null} />;
      case 'users':            return <StaffOverviewPanel  branchId={authUser?.branch_id ?? null} />;
      // Floor Ops
      case 'void-logs':    return <VoidLogsPanel  branchId={authUser?.branch_id ?? null} />;
      //case 'hourly-sales': return <HourlySalesPanel branchId={authUser?.branch_id ?? null} />;
      // Reports
      case 'sales-dashboard':  return <SalesDashboardPanel branchId={authUser?.branch_id ?? null} />;
      case 'items-report':     return <ItemsReportPanel    branchId={authUser?.branch_id ?? null} />;
      case 'x-reading':        return <XReadingPanel       branchId={authUser?.branch_id ?? null} />;
      case 'z-reading':        return <ZReadingPanel       branchId={authUser?.branch_id ?? null} />;
      // Inventory
      case 'inventory-list':   return <InventoryListPanel  branchId={authUser?.branch_id ?? null} />;
      case 'item-checker':     return <ItemCheckerPanel    branchId={authUser?.branch_id ?? null} />;
      default:                 return <TL_DashboardPanel   branchId={authUser?.branch_id ?? null} />;
    }
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="tl-root flex flex-col md:flex-row h-screen bg-[#f5f4f8] overflow-hidden">

        {/* Mobile top bar */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shrink-0">
          <img src={logo} alt="Lucky Boba" className="h-8 w-auto object-contain" />
          <button
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-md text-[#3b2063] hover:bg-[#f5f3ff] transition-colors"
          >
            <Menu size={20} strokeWidth={2} />
          </button>
        </div>

        <TeamLeaderSidebar
          isSidebarOpen={isSidebarOpen}
          setSidebarOpen={setSidebarOpen}
          logo={logo}
          currentTab={activeTab}
          setCurrentTab={setActiveTab}
          onLogout={handleLogoutClick}
          isLoggingOut={isLoggingOut}
        />

        <main className="flex-1 flex flex-col overflow-hidden">

          {/* Top bar */}
          <div className="shrink-0 flex items-center justify-between px-6 md:px-10 py-4 bg-white border-b border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 min-w-0">
              <h1 style={{ fontSize:'0.95rem', fontWeight:800, color:'#1a0f2e', letterSpacing:'-0.03em', margin:0, flexShrink:0 }}>
                {pageTitle}
              </h1>
              <span className="hidden sm:inline-block"
                style={{ fontSize:'0.62rem', fontWeight:700, letterSpacing:'0.16em', textTransform:'uppercase', background:'#f4f4f5', padding:'3px 8px', borderRadius:'0.375rem', color:'#a1a1aa' }}>
                {new Date().toLocaleDateString('en-PH', { weekday:'short', month:'short', day:'numeric', year:'numeric' })}
              </span>
              {branchLabel && (
                <span className="hidden sm:inline-flex items-center gap-1.5"
                  style={{ fontSize:'0.6rem', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', background:'#ede9fe', color:'#3b2063', border:'1px solid #ddd6f7', borderRadius:'100px', padding:'3px 9px', flexShrink:0 }}>
                  <MapPin size={9} strokeWidth={2.5} />{branchLabel}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="hidden sm:flex items-center gap-2" style={{ fontSize:'0.65rem', color:'#71717a' }}>
                <Clock size={12} />
                <span>{new Date().toLocaleTimeString('en-PH', { hour:'2-digit', minute:'2-digit' })}</span>
              </div>
              <div style={{ display:'inline-flex', alignItems:'center', gap:5, background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:'100px', padding:'4px 10px' }}>
                <div className="tl-pulse" style={{ width:5, height:5 }} />
                <span style={{ fontSize:'0.55rem', fontWeight:700, letterSpacing:'0.16em', textTransform:'uppercase', color:'#16a34a' }}>Live</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto">
            {renderContent()}
          </div>
        </main>
      </div>

      <ConfirmModal
        show={isLogoutModalOpen}
        icon={<LogOut size={19} className="text-[#be2525]" />}
        title="End Session?"
        desc="Are you sure you want to log out of the terminal?"
        action={confirmLogout}
        btnText="Logout"
        cancel={() => setLogoutModalOpen(false)}
        danger
      />
    </>
  );
};

export default TeamLeaderDashboard;