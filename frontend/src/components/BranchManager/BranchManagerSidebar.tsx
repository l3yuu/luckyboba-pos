import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Users, BarChart2, ShoppingBag,
  Package, Settings as SettingsIcon, LogOut, HelpCircle, ChevronDown,
} from 'lucide-react';

// ── Sidebar styles ────────────────────────────────────────────────────────────
const SB_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
  .bm-sb-root, .bm-sb-root * { font-family: 'DM Sans', sans-serif !important; box-sizing: border-box; }

  .bm-sb-scroll { overflow-y: auto; -ms-overflow-style: none; scrollbar-width: none; }
  .bm-sb-scroll::-webkit-scrollbar { display: none; }

  .bm-sb-sec {
    padding: 14px 14px 3px;
    font-size: 0.58rem; font-weight: 700; letter-spacing: 0.18em;
    text-transform: uppercase; color: #b4b4b8;
  }

  .bm-sb-item {
    display: flex; align-items: center; gap: 8px;
    width: 100%; padding: 6.5px 10px; border: none;
    background: transparent; cursor: pointer; text-align: left;
    border-radius: 0.4rem; margin: 0;
    color: #52525b; font-size: 0.8rem; font-weight: 500;
    transition: background 0.12s, color 0.12s;
    position: relative;
  }
  .bm-sb-item:hover  { background: #f5f3ff; color: #3b2063; }
  .bm-sb-item.active { background: #ede8ff; color: #3b2063; font-weight: 600; }
  .bm-sb-item.active::before {
    content: ''; position: absolute; left: 0; top: 18%; bottom: 18%;
    width: 2.5px; background: #3b2063; border-radius: 0 2px 2px 0;
  }
  .bm-sb-icon { flex-shrink: 0; width: 15px; display: flex; align-items: center; justify-content: center; }
  .bm-sb-divider { height: 1px; background: #f0f0f2; margin: 6px 10px; }

  .bm-sb-group-btn {
    display: flex; align-items: center; gap: 8px;
    width: 100%; padding: 6.5px 10px; border: none;
    background: transparent; cursor: pointer; text-align: left;
    border-radius: 0.4rem;
    color: #52525b; font-size: 0.8rem; font-weight: 500;
    transition: background 0.12s, color 0.12s;
  }
  .bm-sb-group-btn:hover { background: #f5f3ff; color: #3b2063; }

  .bm-sb-sub {
    display: flex; align-items: center; gap: 8px;
    width: 100%; padding: 5.5px 10px 5.5px 28px; border: none;
    background: transparent; cursor: pointer; text-align: left;
    border-radius: 0.4rem; margin: 0;
    color: #71717a; font-size: 0.75rem; font-weight: 500;
    transition: background 0.12s, color 0.12s;
    position: relative;
  }
  .bm-sb-sub:hover  { background: #f5f3ff; color: #3b2063; }
  .bm-sb-sub.active { background: #ede8ff; color: #3b2063; font-weight: 600; }
  .bm-sb-sub.active::before {
    content: ''; position: absolute; left: 0; top: 18%; bottom: 18%;
    width: 2.5px; background: #3b2063; border-radius: 0 2px 2px 0;
  }

  @keyframes bm-sb-spin { to { transform: rotate(360deg); } }
  .bm-sb-spin { animation: bm-sb-spin 0.7s linear infinite; }
`;

interface BranchManagerSidebarProps {
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
  localStorage.getItem("auth_token") ||
  localStorage.getItem("lucky_boba_token") || "";

type GroupId = 'sales' | 'menu' | 'inventory';

const BranchManagerSidebar: React.FC<BranchManagerSidebarProps> = ({
  isSidebarOpen, setSidebarOpen, currentTab, setCurrentTab,
  onLogout, isLoggingOut: externalLoggingOut,
}) => {
  const [openGroups, setOpenGroups] = useState<Set<GroupId>>(new Set(['sales']));

  // Support both external (from BranchManagerDashboard) and internal logout
  const [internalLoggingOut,  setInternalLoggingOut]  = useState(false);
  const [showLogoutModal,     setShowLogoutModal]      = useState(false);

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

  const handleLogoutClick = () => setShowLogoutModal(true);

  const handleLogoutConfirm = async () => {
    setShowLogoutModal(false);
    // If parent passed onLogout, delegate to it (BranchManagerDashboard handles it)
    if (onLogout) {
      onLogout();
      return;
    }
    // Fallback: handle internally
    setInternalLoggingOut(true);
    ['auth_token', 'lucky_boba_token', 'token', 'user_role', 'lucky_boba_authenticated']
      .forEach(k => localStorage.removeItem(k));
    sessionStorage.clear();
    window.location.href = '/login';
  };

  const isActive  = (tab: string) => currentTab === tab;
  const iconColor = (tab: string) => isActive(tab) ? '#3b2063' : '#a1a1aa';

  const salesItems = [
    { tab: 'sales-dashboard', label: 'Sales Dashboard' },
    { tab: 'items-report',    label: 'Items Report'    },
    { tab: 'x-reading',       label: 'X-Reading'       },
    { tab: 'z-reading',       label: 'Z-Reading'       },
  ];
  const menuItems = [
    { tab: 'menu-list',         label: 'Menu List'      },
    { tab: 'category-list',     label: 'Categories'     },
    { tab: 'sub-category-list', label: 'Sub-Categories' },
  ];
  const inventoryItems = [
    { tab: 'inventory-dashboard', label: 'Dashboard'       },
    { tab: 'inventory-list',      label: 'Inventory List'  },
    { tab: 'inventory-category',  label: 'Categories'      },
    { tab: 'purchase-order',      label: 'Purchase Orders' },
    { tab: 'stock-transfer',      label: 'Stock Transfer'  },
    { tab: 'supplier',            label: 'Suppliers'       },
    { tab: 'item-checker',        label: 'Item Checker'    },
    { tab: 'item-serials',        label: 'Item Serials'    },
    { tab: 'inventory-report',    label: 'Reports'         },
  ];

  const salesOpen     = openGroups.has('sales');
  const menuOpen      = openGroups.has('menu');
  const inventoryOpen = openGroups.has('inventory');

  const [authUser, setAuthUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const token = getToken();
        const res = await fetch("/api/user", {
          headers: {
            "Accept":       "application/json",
            "Content-Type": "application/json",
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
    ? authUser.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "BM";

  return (
    <>
      <style>{SB_STYLES}</style>

      <aside className={`
        bm-sb-root fixed inset-y-0 left-0 z-50 w-60 bg-white border-r border-zinc-100
        flex flex-col transform transition-transform duration-300
        md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>

        {/* ── Brand ── */}
        <div className="shrink-0 px-4 pt-6 pb-4 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div style={{
              width: 32, height: 32, borderRadius: '0.4rem',
              background: '#3b2063', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#fff', letterSpacing: '0.02em' }}>
                {initials}
              </span>
            </div>
            {authUser ? (
              <div className="text-left">
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1a0f2e', lineHeight: 1.2 }}
                  className="truncate max-w-35">
                  {authUser.name}
                </div>
                <div style={{ fontSize: '0.6rem', fontWeight: 600, color: '#a1a1aa', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Branch Manager
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
        <div className="flex-1 bm-sb-scroll min-h-0 px-3 py-2">

          <div className="bm-sb-sec mt-2">Home</div>
          <button onClick={() => goTo('dashboard')} className={`bm-sb-item ${isActive('dashboard') ? 'active' : ''}`}>
            <span className="bm-sb-icon" style={{ color: iconColor('dashboard') }}><LayoutDashboard size={14} /></span>
            Dashboard
          </button>

          <button onClick={() => goTo('users')} className={`bm-sb-item ${isActive('users') ? 'active' : ''}`}>
            <span className="bm-sb-icon" style={{ color: iconColor('users') }}><Users size={14} /></span>
            User Management
          </button>

          {/* Sales Reports Group */}
          <div className="bm-sb-sec">Reports</div>
          <button onClick={() => toggleGroup('sales')} className="bm-sb-group-btn">
            <span className="bm-sb-icon" style={{ color: salesItems.some(i => isActive(i.tab)) ? '#3b2063' : '#a1a1aa' }}>
              <BarChart2 size={14} />
            </span>
            <span className="flex-1">Sales Reports</span>
            <ChevronDown size={12} style={{ color: '#a1a1aa', transform: salesOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
          </button>
          {salesOpen && salesItems.map(({ tab, label }) => (
            <button key={tab} onClick={() => goTo(tab)} className={`bm-sb-sub ${isActive(tab) ? 'active' : ''}`}>
              {label}
            </button>
          ))}

          {/* Menu Items Group */}
          <div className="bm-sb-sec">Menu</div>
          <button onClick={() => toggleGroup('menu')} className="bm-sb-group-btn">
            <span className="bm-sb-icon" style={{ color: menuItems.some(i => isActive(i.tab)) ? '#3b2063' : '#a1a1aa' }}>
              <ShoppingBag size={14} />
            </span>
            <span className="flex-1">Menu Items</span>
            <ChevronDown size={12} style={{ color: '#a1a1aa', transform: menuOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
          </button>
          {menuOpen && menuItems.map(({ tab, label }) => (
            <button key={tab} onClick={() => goTo(tab)} className={`bm-sb-sub ${isActive(tab) ? 'active' : ''}`}>
              {label}
            </button>
          ))}

          {/* Inventory Group */}
          <div className="bm-sb-sec">Inventory</div>
          <button onClick={() => toggleGroup('inventory')} className="bm-sb-group-btn">
            <span className="bm-sb-icon" style={{ color: inventoryItems.some(i => isActive(i.tab)) ? '#3b2063' : '#a1a1aa' }}>
              <Package size={14} />
            </span>
            <span className="flex-1">Inventory</span>
            <ChevronDown size={12} style={{ color: '#a1a1aa', transform: inventoryOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
          </button>
          {inventoryOpen && inventoryItems.map(({ tab, label }) => (
            <button key={tab} onClick={() => goTo(tab)} className={`bm-sb-sub ${isActive(tab) ? 'active' : ''}`}>
              {label}
            </button>
          ))}

          <div className="bm-sb-sec">System</div>
          <button onClick={() => goTo('settings')} className={`bm-sb-item ${isActive('settings') ? 'active' : ''}`}>
            <span className="bm-sb-icon" style={{ color: iconColor('settings') }}><SettingsIcon size={14} /></span>
            Settings
          </button>

        </div>

        {/* ── Bottom-pinned ── */}
        <div className="shrink-0 px-3 pb-4 pt-2 border-t border-zinc-100">
          <button
            className="bm-sb-item"
            style={{ color: '#71717a' }}
            onClick={() => window.open('mailto:support@luckyboba.com')}
          >
            <span className="bm-sb-icon" style={{ color: '#a1a1aa' }}><HelpCircle size={14} /></span>
            Get Help
          </button>

          <div className="bm-sb-divider my-2" />

          <button
            onClick={handleLogoutClick}
            disabled={isLoggingOut}
            className="bm-sb-item hover:bg-red-50! hover:text-red-600!"
            style={{ color: '#be2525' }}
          >
            {isLoggingOut ? (
              <>
                <span className="bm-sb-icon">
                  <div className="relative w-3.5 h-3.5">
                    <div className="absolute inset-0 rounded-full border-[1.5px] border-red-200" />
                    <div className="bm-sb-spin absolute inset-0 rounded-full border-[1.5px] border-transparent border-t-[#be2525]" />
                  </div>
                </span>
                Logging out...
              </>
            ) : (
              <>
                <span className="bm-sb-icon"><LogOut size={14} /></span>
                Log out
              </>
            )}
          </button>

          <div className="mt-3 text-[9px] font-bold uppercase tracking-widest text-zinc-300 text-center">
            Lucky Boba 2026
          </div>
        </div>
      </aside>

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Logout Confirmation Modal — matches cashier style exactly ── */}
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

export default BranchManagerSidebar;