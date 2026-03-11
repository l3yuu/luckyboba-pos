import { useState } from 'react';
import {
  LayoutDashboard, Users, BarChart2, ShoppingBag,
  Package, Settings as SettingsIcon, LogOut, HelpCircle, ChevronDown, X,
} from 'lucide-react';

// ── Styles ─────────────────────────────────────────────────────────────────────
const SB_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400&display=swap');

  .bm-sb-root, .bm-sb-root * { font-family: 'DM Sans', sans-serif !important; box-sizing: border-box; }

  .bm-sb-scroll { overflow-y: auto; -ms-overflow-style: none; scrollbar-width: none; }
  .bm-sb-scroll::-webkit-scrollbar { display: none; }

  /* ── Desktop: section label ── */
  .bm-sb-sec {
    padding: 14px 14px 3px;
    font-size: 0.58rem; font-weight: 700; letter-spacing: 0.18em;
    text-transform: uppercase; color: #b4b4b8;
  }

  /* ── Desktop: nav item ── */
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

  /* ── Desktop: group button ── */
  .bm-sb-group-btn {
    display: flex; align-items: center; gap: 8px;
    width: 100%; padding: 6.5px 10px; border: none;
    background: transparent; cursor: pointer; text-align: left;
    border-radius: 0.4rem;
    color: #52525b; font-size: 0.8rem; font-weight: 500;
    transition: background 0.12s, color 0.12s;
  }
  .bm-sb-group-btn:hover { background: #f5f3ff; color: #3b2063; }

  /* ── Desktop: sub item ── */
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

  /* ── Desktop: chevron rotate ── */
  .bm-sb-chevron {
    color: #a1a1aa; flex-shrink: 0;
    transition: transform 0.32s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .bm-sb-chevron.open { transform: rotate(180deg); }

  /* ── Desktop: accordion ── */
  .bm-sb-accordion {
    display: grid;
    grid-template-rows: 0fr;
    opacity: 0;
    transition:
      grid-template-rows 0.32s cubic-bezier(0.4, 0, 0.2, 1),
      opacity            0.22s ease;
  }
  .bm-sb-accordion.open { grid-template-rows: 1fr; opacity: 1; }
  .bm-sb-accordion-inner { overflow: hidden; }

  /* ── Overlay animations ── */
  @keyframes bm-overlay-in  { from { opacity: 0; } to { opacity: 1; } }
  @keyframes bm-overlay-out { from { opacity: 1; } to { opacity: 0; } }
  .bm-overlay-enter { animation: bm-overlay-in  0.2s ease forwards; }
  .bm-overlay-exit  { animation: bm-overlay-out 0.25s ease forwards; }

  /* ── Mobile: panel slide in / out ── */
  @keyframes bm-panel-in  { from { transform: translateX(-100%); } to { transform: translateX(0); } }
  @keyframes bm-panel-out { from { transform: translateX(0); }      to { transform: translateX(-100%); } }
  .bm-panel-enter { animation: bm-panel-in  0.3s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
  .bm-panel-exit  { animation: bm-panel-out 0.26s cubic-bezier(0.4, 0, 1, 1)    forwards; }

  /* ── Mobile: section label ── */
  .bm-sec {
    padding: 16px 4px 5px;
    font-size: 0.58rem; font-weight: 700; letter-spacing: 0.18em;
    text-transform: uppercase; color: #c4c4c8;
  }

  /* ── Mobile: nav item ── */
  .bm-item {
    display: flex; align-items: center; gap: 14px;
    width: 100%; padding: 13px 14px; border: none;
    background: transparent; cursor: pointer; text-align: left;
    border-radius: 0.75rem; margin: 2px 0;
    color: #3f3f46; font-size: 0.95rem; font-weight: 500;
    transition: background 0.12s, color 0.12s;
    position: relative;
  }
  .bm-item:hover  { background: #f4f2ff; color: #3b2063; }
  .bm-item.active { background: #ede8ff; color: #3b2063; font-weight: 600; }
  .bm-item.active::before {
    content: ''; position: absolute; left: 0; top: 20%; bottom: 20%;
    width: 3px; background: #3b2063; border-radius: 0 3px 3px 0;
  }

  /* ── Mobile: icon box ── */
  .bm-item-icon {
    flex-shrink: 0; width: 38px; height: 38px;
    border-radius: 0.6rem; background: #f4f4f5;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.12s;
  }
  .bm-item.active .bm-item-icon { background: #ddd5ff; }
  .bm-item:hover  .bm-item-icon { background: #ede8ff; }

  /* ── Mobile: group button ── */
  .bm-group-btn {
    display: flex; align-items: center; gap: 14px;
    width: 100%; padding: 13px 14px; border: none;
    background: transparent; cursor: pointer; text-align: left;
    border-radius: 0.75rem; margin: 2px 0;
    color: #3f3f46; font-size: 0.95rem; font-weight: 500;
    transition: background 0.12s, color 0.12s;
  }
  .bm-group-btn:hover { background: #f4f2ff; color: #3b2063; }
  .bm-group-btn .bm-item-icon {
    flex-shrink: 0; width: 38px; height: 38px; border-radius: 0.6rem;
    background: #f4f4f5; display: flex; align-items: center; justify-content: center;
    transition: background 0.12s;
  }
  .bm-group-btn:hover .bm-item-icon { background: #ede8ff; }

  /* ── Mobile: chevron rotate ── */
  .bm-chevron {
    color: #a1a1aa; flex-shrink: 0;
    transition: transform 0.32s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .bm-chevron.open { transform: rotate(180deg); }

  /* ── Mobile: accordion ── */
  .bm-accordion {
    display: grid;
    grid-template-rows: 0fr;
    opacity: 0;
    transition:
      grid-template-rows 0.32s cubic-bezier(0.4, 0, 0.2, 1),
      opacity            0.25s ease;
  }
  .bm-accordion.open { grid-template-rows: 1fr; opacity: 1; }
  .bm-accordion-inner { overflow: hidden; }

  /* ── Mobile: sub item ── */
  .bm-sub {
    display: flex; align-items: center; gap: 8px;
    width: 100%; padding: 10px 14px 10px 64px; border: none;
    background: transparent; cursor: pointer; text-align: left;
    border-radius: 0.6rem; margin: 1px 0;
    color: #71717a; font-size: 0.88rem; font-weight: 500;
    transition: background 0.12s, color 0.12s;
    position: relative;
  }
  .bm-sub:hover  { background: #f4f2ff; color: #3b2063; }
  .bm-sub.active { background: #ede8ff; color: #3b2063; font-weight: 600; }
  .bm-sub.active::before {
    content: ''; position: absolute; left: 0; top: 18%; bottom: 18%;
    width: 3px; background: #3b2063; border-radius: 0 3px 3px 0;
  }
  .bm-sub::after {
    content: ''; position: absolute; left: 51px; top: 50%;
    width: 6px; height: 6px; border-radius: 50%;
    background: #d4d4d8; transform: translateY(-50%);
    transition: background 0.12s;
  }
  .bm-sub.active::after, .bm-sub:hover::after { background: #3b2063; }

  /* ── Mobile: logout button ── */
  .bm-logout {
    display: flex; align-items: center; gap: 14px;
    width: 100%; padding: 13px 14px; border: none;
    background: transparent; cursor: pointer; text-align: left;
    border-radius: 0.75rem; margin: 2px 0;
    color: #be2525; font-size: 0.95rem; font-weight: 500;
    transition: background 0.12s;
    font-family: 'DM Sans', sans-serif;
  }
  .bm-logout:hover { background: #fff0f0; }
  .bm-logout .bm-item-icon { background: #fff0f0; }

  .bm-divider { height: 1px; background: #f0f0f2; margin: 6px 0; }

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

type GroupId = 'sales' | 'menu' | 'inventory';

const BranchManagerSidebar: React.FC<BranchManagerSidebarProps> = ({
  isSidebarOpen, setSidebarOpen, logo, currentTab, setCurrentTab,
  onLogout, isLoggingOut: externalLoggingOut,
}) => {
  const [openGroups,         setOpenGroups]         = useState<Set<GroupId>>(new Set(['sales']));
  const [internalLoggingOut, setInternalLoggingOut] = useState(false);
  const [showLogoutModal,    setShowLogoutModal]     = useState(false);
  const [isClosing,          setIsClosing]           = useState(false);

  const isLoggingOut = externalLoggingOut ?? internalLoggingOut;

  const closePanel = () => {
    setIsClosing(true);
    setTimeout(() => { setIsClosing(false); setSidebarOpen(false); }, 260);
  };

  const goTo = (tab: string) => {
    setCurrentTab(tab);
    if (window.innerWidth < 768) closePanel();
  };

  const toggleGroup = (id: GroupId) => {
    setOpenGroups(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleLogoutClick   = () => setShowLogoutModal(true);
  const handleLogoutConfirm = async () => {
    setShowLogoutModal(false);
    if (onLogout) { onLogout(); return; }
    setInternalLoggingOut(true);
    const keys = ['auth_token', 'lucky_boba_token', 'token', 'user_role', 'lucky_boba_authenticated'];
    keys.forEach(k => localStorage.removeItem(k));
    sessionStorage.clear();
    window.location.href = '/login';
  };

  const isActive  = (tab: string) => currentTab === tab;
  const iconColor = (tab: string) => isActive(tab) ? '#3b2063' : '#71717a';

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

  return (
    <>
      <style>{SB_STYLES}</style>

      {/* ════════════════════════════════════════════════
          DESKTOP SIDEBAR  (md and above)
      ════════════════════════════════════════════════ */}
      <aside className="bm-sb-root fixed inset-y-0 left-0 z-50 w-60 bg-white border-r border-zinc-100 flex-col transform transition-transform duration-300 hidden md:flex md:relative md:translate-x-0">

        {/* Brand */}
        <div className="shrink-0 px-4 pt-6 pb-4 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div style={{ width: 32, height: 32, borderRadius: '0.4rem', background: '#3b2063', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#fff', letterSpacing: '0.02em' }}>BM</span>
            </div>
            <div className="text-left">
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1a0f2e', lineHeight: 1.2 }}>Lucky Boba</div>
              <div style={{ fontSize: '0.6rem', fontWeight: 600, color: '#a1a1aa', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Branch Manager</div>
            </div>
          </div>
        </div>

        {/* Desktop Nav */}
        <div className="flex-1 bm-sb-scroll min-h-0 px-3 py-2">
          <div className="bm-sb-sec mt-2">Home</div>
          <button onClick={() => goTo('dashboard')} className={`bm-sb-item ${isActive('dashboard') ? 'active' : ''}`}>
            <span className="bm-sb-icon"><LayoutDashboard size={14} color={iconColor('dashboard')} /></span>
            Dashboard
          </button>
          <button onClick={() => goTo('users')} className={`bm-sb-item ${isActive('users') ? 'active' : ''}`}>
            <span className="bm-sb-icon"><Users size={14} color={iconColor('users')} /></span>
            User Management
          </button>

          <div className="bm-sb-sec">Reports</div>
          <button onClick={() => toggleGroup('sales')} className="bm-sb-group-btn">
            <span className="bm-sb-icon"><BarChart2 size={14} color={salesItems.some(i => isActive(i.tab)) ? '#3b2063' : '#a1a1aa'} /></span>
            <span className="flex-1">Sales Reports</span>
            <ChevronDown size={12} className={`bm-sb-chevron ${salesOpen ? 'open' : ''}`} />
          </button>
          <div className={`bm-sb-accordion ${salesOpen ? 'open' : ''}`}>
            <div className="bm-sb-accordion-inner">
              {salesItems.map(({ tab, label }) => (
                <button key={tab} onClick={() => goTo(tab)} className={`bm-sb-sub ${isActive(tab) ? 'active' : ''}`}>{label}</button>
              ))}
            </div>
          </div>

          <div className="bm-sb-sec">Menu</div>
          <button onClick={() => toggleGroup('menu')} className="bm-sb-group-btn">
            <span className="bm-sb-icon"><ShoppingBag size={14} color={menuItems.some(i => isActive(i.tab)) ? '#3b2063' : '#a1a1aa'} /></span>
            <span className="flex-1">Menu Items</span>
            <ChevronDown size={12} className={`bm-sb-chevron ${menuOpen ? 'open' : ''}`} />
          </button>
          <div className={`bm-sb-accordion ${menuOpen ? 'open' : ''}`}>
            <div className="bm-sb-accordion-inner">
              {menuItems.map(({ tab, label }) => (
                <button key={tab} onClick={() => goTo(tab)} className={`bm-sb-sub ${isActive(tab) ? 'active' : ''}`}>{label}</button>
              ))}
            </div>
          </div>

          <div className="bm-sb-sec">Inventory</div>
          <button onClick={() => toggleGroup('inventory')} className="bm-sb-group-btn">
            <span className="bm-sb-icon"><Package size={14} color={inventoryItems.some(i => isActive(i.tab)) ? '#3b2063' : '#a1a1aa'} /></span>
            <span className="flex-1">Inventory</span>
            <ChevronDown size={12} className={`bm-sb-chevron ${inventoryOpen ? 'open' : ''}`} />
          </button>
          <div className={`bm-sb-accordion ${inventoryOpen ? 'open' : ''}`}>
            <div className="bm-sb-accordion-inner">
              {inventoryItems.map(({ tab, label }) => (
                <button key={tab} onClick={() => goTo(tab)} className={`bm-sb-sub ${isActive(tab) ? 'active' : ''}`}>{label}</button>
              ))}
            </div>
          </div>

          <div className="bm-sb-sec">System</div>
          <button onClick={() => goTo('settings')} className={`bm-sb-item ${isActive('settings') ? 'active' : ''}`}>
            <span className="bm-sb-icon"><SettingsIcon size={14} color={iconColor('settings')} /></span>
            Settings
          </button>
        </div>

        {/* Logo */}
        <div className="shrink-0 flex justify-center px-4 pb-4">
          <img src={logo} alt="Lucky Boba" className="h-20 w-auto object-contain" />
        </div>

        {/* Desktop Bottom */}
        <div className="shrink-0 px-3 pb-4 pt-2 border-t border-zinc-100">
          <button className="bm-sb-item" style={{ color: '#71717a' }} onClick={() => window.open('mailto:support@luckyboba.com')}>
            <span className="bm-sb-icon"><HelpCircle size={14} color="#a1a1aa" /></span>
            Get Help
          </button>
          <div className="bm-sb-divider my-2" />
          <button onClick={handleLogoutClick} disabled={isLoggingOut} className="bm-sb-item" style={{ color: '#be2525' }}>
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

      {/* ════════════════════════════════════════════════
          MOBILE — full-viewport panel
      ════════════════════════════════════════════════ */}
      {(isSidebarOpen || isClosing) && (
        <>
          {/* Backdrop */}
          <div
            className={`${isClosing ? 'bm-overlay-exit' : 'bm-overlay-enter'} md:hidden`}
            onClick={closePanel}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)', zIndex: 40 }}
          />

          {/* Panel */}
          <div
            className={`bm-panel-enter${isClosing ? ' bm-panel-exit' : ''} bm-sb-root md:hidden`}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#fff', zIndex: 50, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
          >
            {/* Profile header */}
            <div style={{ flexShrink: 0, padding: '56px 20px 16px', paddingTop: 'max(56px, calc(env(safe-area-inset-top) + 20px))' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #3b2063)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 0 0 3px #ede8ff' }}>
                    <span style={{ fontSize: '1rem', fontWeight: 800, color: '#fff' }}>BM</span>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: '#a1a1aa', fontWeight: 500, marginBottom: 1 }}>Hello,</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1a0f2e', lineHeight: 1.2 }}>Branch Manager</div>
                    <div style={{ fontSize: '0.68rem', color: '#a1a1aa', fontWeight: 500, marginTop: 1 }}>Lucky Boba</div>
                  </div>
                </div>
                <button onClick={closePanel} style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: '#f4f4f5', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <X size={14} color="#71717a" />
                </button>
              </div>
            </div>

            <div className="bm-divider" style={{ margin: '0 20px' }} />

            {/* Scrollable nav */}
            <div className="bm-sb-scroll" style={{ flex: 1, minHeight: 0, padding: '8px 14px' }}>

              <div className="bm-sec">Home</div>
              <button onClick={() => goTo('dashboard')} className={`bm-item ${isActive('dashboard') ? 'active' : ''}`}>
                <span className="bm-item-icon"><LayoutDashboard size={18} color={iconColor('dashboard')} /></span>
                Dashboard
              </button>
              <button onClick={() => goTo('users')} className={`bm-item ${isActive('users') ? 'active' : ''}`}>
                <span className="bm-item-icon"><Users size={18} color={iconColor('users')} /></span>
                User Management
              </button>

              <div className="bm-sec">Reports</div>
              <button onClick={() => toggleGroup('sales')} className="bm-group-btn">
                <span className="bm-item-icon"><BarChart2 size={18} color={salesItems.some(i => isActive(i.tab)) ? '#3b2063' : '#71717a'} /></span>
                <span style={{ flex: 1 }}>Sales Reports</span>
                <ChevronDown size={16} className={`bm-chevron ${salesOpen ? 'open' : ''}`} />
              </button>
              <div className={`bm-accordion ${salesOpen ? 'open' : ''}`}>
                <div className="bm-accordion-inner">
                  {salesItems.map(({ tab, label }) => (
                    <button key={tab} onClick={() => goTo(tab)} className={`bm-sub ${isActive(tab) ? 'active' : ''}`}>{label}</button>
                  ))}
                </div>
              </div>

              <div className="bm-sec">Menu</div>
              <button onClick={() => toggleGroup('menu')} className="bm-group-btn">
                <span className="bm-item-icon"><ShoppingBag size={18} color={menuItems.some(i => isActive(i.tab)) ? '#3b2063' : '#71717a'} /></span>
                <span style={{ flex: 1 }}>Menu Items</span>
                <ChevronDown size={16} className={`bm-chevron ${menuOpen ? 'open' : ''}`} />
              </button>
              <div className={`bm-accordion ${menuOpen ? 'open' : ''}`}>
                <div className="bm-accordion-inner">
                  {menuItems.map(({ tab, label }) => (
                    <button key={tab} onClick={() => goTo(tab)} className={`bm-sub ${isActive(tab) ? 'active' : ''}`}>{label}</button>
                  ))}
                </div>
              </div>

              <div className="bm-sec">Inventory</div>
              <button onClick={() => toggleGroup('inventory')} className="bm-group-btn">
                <span className="bm-item-icon"><Package size={18} color={inventoryItems.some(i => isActive(i.tab)) ? '#3b2063' : '#71717a'} /></span>
                <span style={{ flex: 1 }}>Inventory</span>
                <ChevronDown size={16} className={`bm-chevron ${inventoryOpen ? 'open' : ''}`} />
              </button>
              <div className={`bm-accordion ${inventoryOpen ? 'open' : ''}`}>
                <div className="bm-accordion-inner">
                  {inventoryItems.map(({ tab, label }) => (
                    <button key={tab} onClick={() => goTo(tab)} className={`bm-sub ${isActive(tab) ? 'active' : ''}`}>{label}</button>
                  ))}
                </div>
              </div>

              <div className="bm-sec">System</div>
              <button onClick={() => goTo('settings')} className={`bm-item ${isActive('settings') ? 'active' : ''}`}>
                <span className="bm-item-icon"><SettingsIcon size={18} color={iconColor('settings')} /></span>
                Settings
              </button>

            </div>

            {/* Bottom actions */}
            <div style={{ flexShrink: 0, padding: '8px 14px', paddingBottom: 'max(24px, env(safe-area-inset-bottom))', borderTop: '1px solid #f0f0f2' }}>
              <button className="bm-item" style={{ color: '#71717a' }} onClick={() => window.open('mailto:support@luckyboba.com')}>
                <span className="bm-item-icon"><HelpCircle size={18} color="#a1a1aa" /></span>
                Get Help
              </button>
              <button onClick={handleLogoutClick} disabled={isLoggingOut} className="bm-logout">
                {isLoggingOut ? (
                  <>
                    <span className="bm-item-icon">
                      <div style={{ position: 'relative', width: 16, height: 16 }}>
                        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1.5px solid #fca5a5' }} />
                        <div className="bm-sb-spin" style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1.5px solid transparent', borderTopColor: '#be2525' }} />
                      </div>
                    </span>
                    Logging out...
                  </>
                ) : (
                  <>
                    <span className="bm-item-icon"><LogOut size={18} color="#be2525" /></span>
                    Log out
                  </>
                )}
              </button>
              <div style={{ marginTop: 14, fontSize: '0.56rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#d4d4d8', textAlign: 'center' }}>
                Lucky Boba 2026
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Logout Confirmation Modal ── */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: 360, border: '1px solid #e4e4e7', borderRadius: '1.25rem', padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}>
            <div style={{ width: 44, height: 44, borderRadius: '0.625rem', background: '#fff0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <LogOut size={19} color="#be2525" />
            </div>
            <h3 style={{ color: '#1a0f2e', fontWeight: 700, fontSize: '1rem', margin: '0 0 8px', letterSpacing: '-0.01em' }}>End Session?</h3>
            <p style={{ color: '#71717a', fontSize: '0.85rem', fontWeight: 500, margin: '0 0 28px', lineHeight: 1.5 }}>
              Are you sure you want to log out of the terminal?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 8 }}>
              <button onClick={handleLogoutConfirm} style={{ width: '100%', padding: '12px', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#fff', background: '#be2525', border: 'none', borderRadius: '0.625rem', cursor: 'pointer' }}>
                Logout
              </button>
              <button onClick={() => setShowLogoutModal(false)} style={{ width: '100%', padding: '12px', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#71717a', background: '#fff', border: '1px solid #e4e4e7', borderRadius: '0.625rem', cursor: 'pointer' }}>
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