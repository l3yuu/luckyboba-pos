import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Users, BarChart2, ShoppingBag,
  Package, LogOut, HelpCircle, ChevronDown, Activity,
  Shield,
} from 'lucide-react';

// ── Sidebar styles ────────────────────────────────────────────────────────────
const SB_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
  .tl-sb-root, .tl-sb-root * { font-family: 'DM Sans', sans-serif !important; box-sizing: border-box; }

  .tl-sb-scroll { overflow-y: auto; -ms-overflow-style: none; scrollbar-width: none; }
  .tl-sb-scroll::-webkit-scrollbar { display: none; }

  .tl-sb-sec {
    padding: 16px 8px 4px;
    font-size: 0.58rem; font-weight: 700; letter-spacing: 0.18em;
    text-transform: uppercase; color: #b4b4b8;
  }

  .tl-sb-item {
    display: flex; align-items: center; gap: 8px;
    width: 100%; padding: 7px 10px; border: none;
    background: transparent; cursor: pointer; text-align: left;
    border-radius: 0.4rem; margin: 1px 0;
    color: #52525b; font-size: 0.8rem; font-weight: 500;
    transition: background 0.12s, color 0.12s;
    position: relative;
  }
  .tl-sb-item:hover  { background: #f5f3ff; color: #3b2063; }
  .tl-sb-item.active { background: #ede8ff; color: #3b2063; font-weight: 600; }
  .tl-sb-item.active::before {
    content: ''; position: absolute; left: 0; top: 18%; bottom: 18%;
    width: 2.5px; background: #3b2063; border-radius: 0 2px 2px 0;
  }
  .tl-sb-icon { flex-shrink: 0; width: 15px; display: flex; align-items: center; justify-content: center; }
  .tl-sb-divider { height: 1px; background: #f0f0f2; margin: 6px 10px; }

  .tl-sb-group-btn {
    display: flex; align-items: center; gap: 8px;
    width: 100%; padding: 7px 10px; border: none;
    background: transparent; cursor: pointer; text-align: left;
    border-radius: 0.4rem; margin: 1px 0;
    color: #52525b; font-size: 0.8rem; font-weight: 500;
    transition: background 0.12s, color 0.12s;
  }
  .tl-sb-group-btn:hover { background: #f5f3ff; color: #3b2063; }

  .tl-sb-sub {
    display: flex; align-items: center; gap: 8px;
    width: 100%; padding: 6px 10px 6px 28px; border: none;
    background: transparent; cursor: pointer; text-align: left;
    border-radius: 0.4rem; margin: 1px 0;
    color: #71717a; font-size: 0.76rem; font-weight: 500;
    transition: background 0.12s, color 0.12s;
    position: relative;
  }
  .tl-sb-sub:hover  { background: #f5f3ff; color: #3b2063; }
  .tl-sb-sub.active { background: #ede8ff; color: #3b2063; font-weight: 600; }
  .tl-sb-sub.active::before {
    content: ''; position: absolute; left: 0; top: 18%; bottom: 18%;
    width: 2.5px; background: #3b2063; border-radius: 0 2px 2px 0;
  }
  .tl-sb-sub::after {
    content: ''; position: absolute; left: 18px; top: 50%;
    width: 5px; height: 5px; border-radius: 50%;
    background: #d4d4d8; transform: translateY(-50%);
    transition: background 0.12s;
  }
  .tl-sb-sub.active::after, .tl-sb-sub:hover::after { background: #3b2063; }

  /* Team Leader role badge */
  .tl-role-badge {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 0.52rem; font-weight: 700; letter-spacing: 0.12em;
    text-transform: uppercase;
    background: linear-gradient(135deg, #f5f3ff, #ede8ff);
    color: #6d28d9; border: 1px solid #ddd6fe;
    border-radius: 100px; padding: 2px 7px;
  }

  @keyframes tl-sb-spin { to { transform: rotate(360deg); } }
  .tl-sb-spin { animation: tl-sb-spin 0.7s linear infinite; }
`;

interface TeamLeaderSidebarProps {
  isSidebarOpen:  boolean;
  setSidebarOpen: (v: boolean) => void;
  logo:           string;
  currentTab:     string;
  setCurrentTab:  (tab: string) => void;
  onLogout?:      () => void;
  isLoggingOut?:  boolean;
}

interface AuthUser {
  id:     number;
  name:   string;
  email:  string;
  role:   string;
}

const getToken = () =>
  localStorage.getItem('auth_token') ||
  localStorage.getItem('lucky_boba_token') || '';

type GroupId = 'sales' | 'floor';

const TeamLeaderSidebar: React.FC<TeamLeaderSidebarProps> = ({
  isSidebarOpen, setSidebarOpen, currentTab, setCurrentTab,
  onLogout, isLoggingOut: externalLoggingOut,
}) => {
  const [openGroups,         setOpenGroups]         = useState<Set<GroupId>>(new Set(['floor']));
  const [internalLoggingOut, setInternalLoggingOut] = useState(false);
  const [showLogoutModal,    setShowLogoutModal]    = useState(false);
  const [authUser,           setAuthUser]           = useState<AuthUser | null>(null);

  const isLoggingOut = externalLoggingOut ?? internalLoggingOut;

  const goTo = (tab: string) => {
    setCurrentTab(tab);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const toggleGroup = (id: GroupId) => {
    setOpenGroups(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  const handleLogoutClick   = () => setShowLogoutModal(true);

  const handleLogoutConfirm = async () => {
    setShowLogoutModal(false);
    if (onLogout) { onLogout(); return; }
    setInternalLoggingOut(true);
    ['auth_token', 'lucky_boba_token', 'token', 'user_role', 'lucky_boba_authenticated']
      .forEach(k => localStorage.removeItem(k));
    sessionStorage.clear();
    window.location.href = '/login';
  };

  const isActive  = (tab: string) => currentTab === tab;
  const iconColor = (tab: string) => isActive(tab) ? '#3b2063' : '#a1a1aa';

  // ── Nav items scoped to Team Leader ──────────────────────────────────────
  // Sales: read-only views only — no export, no Z-reading
  const salesItems = [
    { tab: 'sales-dashboard', label: 'Sales Dashboard' },
    { tab: 'items-report',    label: 'Items Report'    },
    { tab: 'x-reading',       label: 'X-Reading'       },
    { tab: 'z-reading',       label: 'Z-Reading'       },  
  ];

  // Floor ops: what a TL actually manages day-to-day
  const floorItems = [
    { tab: 'void-logs',       label: 'Void Log'        },
    //{ tab: 'hourly-sales',    label: 'Hourly Sales'    },
  ];

  const salesOpen = openGroups.has('sales');
  const floorOpen = openGroups.has('floor');

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const token = getToken();
        const res = await fetch('/api/user', {
          headers: {
            Accept:         'application/json',
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!res.ok) return;
        const data = await res.json();
        const u = data.data ?? data;
        setAuthUser({ id: u.id, name: u.name, email: u.email, role: u.role });
      } catch { /* silently fail */ }
    };
    fetchMe();
  }, []);

  const initials = authUser
    ? authUser.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'TL';

  return (
    <>
      <style>{SB_STYLES}</style>

      <aside className={`
        tl-sb-root fixed inset-y-0 left-0 z-50 w-60 bg-white border-r border-zinc-100
        flex flex-col transform transition-transform duration-300
        md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>

        {/* ── Brand ── */}
        <div className="shrink-0 px-4 pt-6 pb-4 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div style={{
              width: 32, height: 32, borderRadius: '0.4rem',
              background: 'linear-gradient(135deg, #3b2063, #6d28d9)',
              flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: '0.55rem', fontWeight: 800, color: '#fff', letterSpacing: '0.02em' }}>
                {initials}
              </span>
            </div>
            {authUser ? (
              <div className="text-left min-w-0">
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1a0f2e', lineHeight: 1.2 }}
                  className="truncate max-w-36">
                  {authUser.name}
                </div>
                <div className="mt-1">
                  <span className="tl-role-badge">
                    <Shield size={8} strokeWidth={2.5} />
                    Team Leader
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <div className="h-3 w-24 bg-zinc-200 rounded animate-pulse" />
                <div className="h-2 w-16 bg-zinc-100 rounded animate-pulse" />
              </div>
            )}
          </div>
        </div>

        {/* ── Nav ── */}
        <div className="flex-1 tl-sb-scroll min-h-0 px-3 py-2">

          {/* Dashboard */}
          <div className="tl-sb-sec mt-1">Home</div>
          <button onClick={() => goTo('dashboard')} className={`tl-sb-item ${isActive('dashboard') ? 'active' : ''}`}>
            <span className="tl-sb-icon" style={{ color: iconColor('dashboard') }}><LayoutDashboard size={14} /></span>
            Dashboard
          </button>

          {/* Staff */}
          <button onClick={() => goTo('users')} className={`tl-sb-item ${isActive('users') ? 'active' : ''}`}>
            <span className="tl-sb-icon" style={{ color: iconColor('users') }}><Users size={14} /></span>
            Staff Overview
          </button>

          {/* Floor Ops Group */}
          <div className="tl-sb-sec">Floor Ops</div>
          <button onClick={() => toggleGroup('floor')} className="tl-sb-group-btn">
            <span className="tl-sb-icon" style={{ color: floorItems.some(i => isActive(i.tab)) ? '#3b2063' : '#a1a1aa' }}>
              <Activity size={14} />
            </span>
            <span className="flex-1">Operations</span>
            <ChevronDown size={12} style={{ color: '#a1a1aa', transform: floorOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
          </button>
          {floorOpen && floorItems.map(({ tab, label }) => (
            <button key={tab} onClick={() => goTo(tab)} className={`tl-sb-sub ${isActive(tab) ? 'active' : ''}`}>
              {label}
            </button>
          ))}

          {/* Sales Reports Group — read-only, no Z-reading */}
          <div className="tl-sb-sec">Reports</div>
          <button onClick={() => toggleGroup('sales')} className="tl-sb-group-btn">
            <span className="tl-sb-icon" style={{ color: salesItems.some(i => isActive(i.tab)) ? '#3b2063' : '#a1a1aa' }}>
              <BarChart2 size={14} />
            </span>
            <span className="flex-1">Sales Reports</span>
            <ChevronDown size={12} style={{ color: '#a1a1aa', transform: salesOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
          </button>
          {salesOpen && salesItems.map(({ tab, label }) => (
            <button key={tab} onClick={() => goTo(tab)} className={`tl-sb-sub ${isActive(tab) ? 'active' : ''}`}>
              {label}
            </button>
          ))}

          {/* Inventory — view only, no purchase orders or stock transfers */}
          <div className="tl-sb-sec">Inventory</div>
          <button onClick={() => goTo('inventory-list')} className={`tl-sb-item ${isActive('inventory-list') ? 'active' : ''}`}>
            <span className="tl-sb-icon" style={{ color: iconColor('inventory-list') }}><Package size={14} /></span>
            Stock Levels
          </button>
          <button onClick={() => goTo('item-checker')} className={`tl-sb-item ${isActive('item-checker') ? 'active' : ''}`}>
            <span className="tl-sb-icon" style={{ color: iconColor('item-checker') }}><ShoppingBag size={14} /></span>
            Item Checker
          </button>

          <div className="pb-4" />
        </div>

        {/* ── Bottom-pinned ── */}
        <div className="shrink-0 px-3 pb-4 pt-2 border-t border-zinc-100">
          <button
            className="tl-sb-item"
            style={{ color: '#71717a' }}
            onClick={() => window.open('mailto:support@luckyboba.com')}
          >
            <span className="tl-sb-icon" style={{ color: '#a1a1aa' }}><HelpCircle size={14} /></span>
            Get Help
          </button>

          <div className="tl-sb-divider my-2" />

          <button
            onClick={handleLogoutClick}
            disabled={isLoggingOut}
            className="tl-sb-item"
            style={{ color: '#be2525' }}
          >
            {isLoggingOut ? (
              <>
                <span className="tl-sb-icon">
                  <div className="relative w-3.5 h-3.5">
                    <div className="absolute inset-0 rounded-full border-[1.5px] border-red-200" />
                    <div className="tl-sb-spin absolute inset-0 rounded-full border-[1.5px] border-transparent border-t-[#be2525]" />
                  </div>
                </span>
                Logging out...
              </>
            ) : (
              <>
                <span className="tl-sb-icon"><LogOut size={14} /></span>
                Log out
              </>
            )}
          </button>

          <div className="mt-3 text-[9px] font-bold uppercase tracking-widest text-zinc-300 text-center">
            Lucky Boba 2026
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Logout Confirmation Modal ── */}
      {showLogoutModal && (
        <div
          className="fixed inset-0 z-200 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          <div className="bg-white w-full max-w-sm border border-zinc-200 rounded-[1.25rem] p-8 flex flex-col items-center text-center shadow-2xl">
            <div className="w-11 h-11 rounded-[0.625rem] flex items-center justify-center mb-5 bg-red-50">
              <LogOut size={19} className="text-[#be2525]" />
            </div>
            <h3 className="text-[#1a0f2e] font-bold text-base mb-2 tracking-tight">End Session?</h3>
            <p className="text-zinc-500 text-sm font-medium mb-7 leading-relaxed">
              Are you sure you want to log out of the terminal?
            </p>
            <div className="flex flex-col w-full gap-2">
              <button
                onClick={handleLogoutConfirm}
                className="w-full py-3 text-[10px] font-bold tracking-[0.18em] uppercase text-white bg-[#be2525] hover:bg-[#a11f1f] transition-all rounded-[0.625rem] active:scale-[0.98]"
              >
                Logout
              </button>
              <button
                onClick={() => setShowLogoutModal(false)}
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

export default TeamLeaderSidebar;