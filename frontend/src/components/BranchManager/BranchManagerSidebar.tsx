import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutGrid, Users, FileText, BookOpen, Package,
  Settings as SettingsIcon, LogOut, ChevronRight,
  HelpCircle, Search
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MenuItem { id: string; label: string; }
interface BranchManagerSidebarProps {
  isSidebarOpen:  boolean;
  setSidebarOpen: (open: boolean) => void;
  logo:           string;
  currentTab:     string;
  setCurrentTab:  (tab: string) => void;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const SB_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
  .sb-root, .sb-root * { font-family: 'DM Sans', sans-serif !important; box-sizing: border-box; }

  .sb-scroll { overflow-y: auto; -ms-overflow-style: none; scrollbar-width: none; }
  .sb-scroll::-webkit-scrollbar { display: none; }

  /* section label */
  .sb-sec {
    padding: 14px 14px 3px;
    font-size: 0.58rem; font-weight: 700; letter-spacing: 0.18em;
    text-transform: uppercase; color: #b4b4b8;
  }

  /* nav item */
  .sb-item {
    display: flex; align-items: center; gap: 8px;
    width: 100%; padding: 6.5px 10px; border: none;
    background: transparent; cursor: pointer; text-align: left;
    border-radius: 0.4rem; margin: 0;
    color: #52525b; font-size: 0.8rem; font-weight: 500;
    transition: background 0.12s, color 0.12s;
    position: relative;
  }
  .sb-item:hover  { background: #f5f3ff; color: #3b2063; }
  .sb-item.active { background: #ede8ff; color: #3b2063; font-weight: 600; }
  .sb-item.active::before {
    content: ''; position: absolute; left: 0; top: 18%; bottom: 18%;
    width: 2.5px; background: #3b2063; border-radius: 0 2px 2px 0;
  }
  .sb-icon { flex-shrink: 0; width: 15px; display: flex; align-items: center; justify-content: center; }

  /* dropdown header */
  .sb-dh {
    display: flex; align-items: center; justify-content: space-between;
    width: 100%; padding: 6.5px 10px; border: none;
    background: transparent; cursor: pointer;
    border-radius: 0.4rem; margin: 0;
    color: #52525b; font-size: 0.8rem; font-weight: 500;
    transition: background 0.12s, color 0.12s;
    position: relative;
  }
  .sb-dh:hover  { background: #f5f3ff; color: #3b2063; }
  .sb-dh.active { background: #ede8ff; color: #3b2063; font-weight: 600; }
  .sb-dh.active::before {
    content: ''; position: absolute; left: 0; top: 18%; bottom: 18%;
    width: 2.5px; background: #3b2063; border-radius: 0 2px 2px 0;
  }
  .sb-dh-left { display: flex; align-items: center; gap: 8px; }

  /* chevron */
  .sb-chev { color: #c4c4c8; transition: transform 0.22s cubic-bezier(0.4,0,0.2,1); flex-shrink: 0; }
  .sb-chev.open { transform: rotate(90deg); color: #3b2063; }

  /* sub list */
  .sb-sub-list { overflow: hidden; transition: max-height 0.28s cubic-bezier(0.4,0,0.2,1), opacity 0.2s; }
  .sb-sub-list.open   { max-height: 500px; opacity: 1; }
  .sb-sub-list.closed { max-height: 0;     opacity: 0; }

  /* sub item */
  .sb-sub {
    display: block; width: 100%; padding: 5.5px 10px 5.5px 34px;
    border: none; background: transparent; cursor: pointer; text-align: left;
    border-radius: 0.38rem; margin: 0;
    color: #71717a; font-size: 0.76rem; font-weight: 500;
    transition: background 0.12s, color 0.12s, padding-left 0.1s;
  }
  .sb-sub:hover  { background: #f5f3ff; color: #3b2063; padding-left: 38px; }
  .sb-sub.active { background: #ede8ff; color: #3b2063; font-weight: 600; }

  /* divider */
  .sb-divider { height: 1px; background: #f0f0f2; margin: 6px 10px; }

  /* logout spin */
  @keyframes sb-spin { to { transform: rotate(360deg); } }
  .sb-spin { animation: sb-spin 0.7s linear infinite; }
`;

// ─── Component ────────────────────────────────────────────────────────────────

const BranchManagerSidebar: React.FC<BranchManagerSidebarProps> = ({
  isSidebarOpen, setSidebarOpen, logo, currentTab, setCurrentTab,
}) => {
  const { logout } = useAuth();
  const [isLoggingOut,      setIsLoggingOut]      = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // ── Menu data ──────────────────────────────────────────────────────────────

  const salesItems: MenuItem[] = [
    { id: 'sales-dashboard', label: 'Dashboard'          },
    { id: 'items-report',    label: 'Items Report'       },
    { id: 'x-reading',       label: 'X Reading'          },
    { id: 'z-reading',       label: 'Z Reading'          },
    { id: 'mall-accred',     label: 'Mall Accred Report' },
  ];
  const menuMgmtItems: MenuItem[] = [
    { id: 'menu-list',         label: 'Menu List'         },
    { id: 'category-list',     label: 'Category List'     },
    { id: 'sub-category-list', label: 'Sub-Category List' },
  ];
  const inventoryItems: MenuItem[] = [
    { id: 'inventory-dashboard', label: 'Dashboard'        },
    { id: 'inventory-list',      label: 'Inventory List'   },
    { id: 'inventory-category',  label: 'Category List'    },
    { id: 'supplier',            label: 'Supplier'         },
    { id: 'item-checker',        label: 'Item Checker'     },
    { id: 'item-serials',        label: 'Item Serials'     },
    { id: 'purchase-order',      label: 'Purchase Order'   },
    { id: 'stock-transfer',      label: 'Stock Transfer'   },
    { id: 'inventory-report',    label: 'Inventory Report' },
  ];

  // ── Dropdown states ────────────────────────────────────────────────────────

  const [salesOpen, setSalesOpen] = useState(() => salesItems.some(i     => i.id === currentTab));
  const [menuOpen,  setMenuOpen]  = useState(() => menuMgmtItems.some(i  => i.id === currentTab));
  const [invOpen,   setInvOpen]   = useState(() => inventoryItems.some(i => i.id === currentTab));

  const toggle = (w: 'sales' | 'menu' | 'inv') => {
    setSalesOpen(w === 'sales' ? !salesOpen : false);
    setMenuOpen( w === 'menu'  ? !menuOpen  : false);
    setInvOpen(  w === 'inv'   ? !invOpen   : false);
  };
  const closeAll = () => { setSalesOpen(false); setMenuOpen(false); setInvOpen(false); };

  const goTo = (id: string) => {
    setCurrentTab(id);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const inGroup = (list: MenuItem[]) => list.some(i => i.id === currentTab);

  // ── Logout ─────────────────────────────────────────────────────────────────

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setShowLogoutConfirm(false);
    try {
      ['cashier_menu_unlocked', 'cashier_lock_date'].forEach(k => localStorage.removeItem(k));
      sessionStorage.clear();
      await logout();
      window.location.href = '/login';
    } catch (e) {
      console.error('Logout failed:', e);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // ── Reusable dropdown ──────────────────────────────────────────────────────

  const Dropdown = ({
    which, label, icon, items, open,
  }: {
    which: 'sales' | 'menu' | 'inv';
    label: string;
    icon: React.ReactNode;
    items: MenuItem[];
    open: boolean;
  }) => {
    const grpActive = inGroup(items);
    return (
      <>
        <button onClick={() => toggle(which)} className={`sb-dh ${grpActive ? 'active' : ''}`}>
          <div className="sb-dh-left">
            <span className="sb-icon" style={{ color: grpActive || open ? '#3b2063' : '#a1a1aa' }}>{icon}</span>
            <span>{label}</span>
          </div>
          <ChevronRight size={11} className={`sb-chev ${open ? 'open' : ''}`} />
        </button>
        <div className={`sb-sub-list ${open ? 'open' : 'closed'}`}>
          {items.map(item => (
            <button key={item.id} onClick={() => goTo(item.id)}
              className={`sb-sub ${currentTab === item.id ? 'active' : ''}`}>
              {item.label}
            </button>
          ))}
        </div>
      </>
    );
  };

  // ── NavItem shorthand ──────────────────────────────────────────────────────

  const NavItem = ({
    id, label, icon, onClick,
  }: { id: string; label: string; icon: React.ReactNode; onClick?: () => void }) => (
    <button onClick={onClick ?? (() => { goTo(id); closeAll(); })}
      className={`sb-item ${currentTab === id ? 'active' : ''}`}>
      <span className="sb-icon" style={{ color: currentTab === id ? '#3b2063' : '#a1a1aa' }}>{icon}</span>
      {label}
    </button>
  );

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{SB_STYLES}</style>

      {/* ── Logout modal ── */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
          <div style={{ fontFamily: "'DM Sans', sans-serif" }}
            className="bg-white w-full max-w-sm border border-zinc-200 rounded-[1.25rem] p-8 flex flex-col items-center text-center shadow-2xl">
            <div className="w-11 h-11 rounded-[0.625rem] flex items-center justify-center mb-5 bg-red-50">
              <LogOut size={19} className="text-[#be2525]" />
            </div>
            <h3 className="text-[#1a0f2e] font-bold text-base mb-2 tracking-tight">End Session?</h3>
            <p className="text-zinc-500 text-sm font-medium mb-7 leading-relaxed">
              Are you sure you want to log out of the Branch Manager system?
            </p>
            <div className="flex flex-col w-full gap-2">
              <button onClick={handleLogout}
                className="w-full py-3 text-[10px] font-bold tracking-[0.18em] uppercase text-white bg-[#be2525] hover:bg-[#a11f1f] transition-all rounded-[0.625rem] active:scale-[0.98]">
                Logout
              </button>
              <button onClick={() => setShowLogoutConfirm(false)}
                className="w-full py-3 text-[10px] font-bold tracking-[0.18em] uppercase text-zinc-500 bg-white border border-zinc-200 hover:bg-zinc-50 transition-all rounded-[0.625rem] active:scale-[0.98]">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Sidebar shell ── */}
      <aside className={`
        sb-root fixed inset-y-0 left-0 z-50 w-[210px] bg-white border-r border-zinc-100
        flex flex-col transform transition-transform duration-300
        md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>

        {/* ── Brand ── */}
        <div className="shrink-0 px-3 pt-5 pb-3.5 border-b border-zinc-100">
          <img src={logo} alt="Lucky Boba" className="w-28 h-auto object-contain mb-3 hidden md:block" />
          <div className="flex items-center gap-2">
            <div style={{
              width: 26, height: 26, borderRadius: '0.4rem',
              background: '#3b2063', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: '0.46rem', fontWeight: 800, color: '#fff', letterSpacing: '0.02em' }}>BM</span>
            </div>
            <div>
              <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#1a0f2e', lineHeight: 1.2 }}>Lucky Boba</div>
              <div style={{ fontSize: '0.56rem', fontWeight: 600, color: '#a1a1aa', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Branch Manager</div>
            </div>
          </div>
        </div>

        {/* ── Scrollable nav ── */}
        <div className="flex-1 sb-scroll min-h-0 px-2 py-1.5">

          {/* Home */}
          <div className="sb-sec">Home</div>
          <NavItem id="dashboard" label="Dashboard"       icon={<LayoutGrid size={14}/>} />
          <NavItem id="users"     label="User Management" icon={<Users      size={14}/>} />

          {/* Reports */}
          <div className="sb-sec">Reports</div>
          <Dropdown which="sales" label="Sales Report" icon={<FileText size={14}/>} items={salesItems} open={salesOpen} />

          {/* Manage */}
          <div className="sb-sec">Manage</div>
          <Dropdown which="menu" label="Menu Items"  icon={<BookOpen size={14}/>} items={menuMgmtItems}  open={menuOpen} />
          <Dropdown which="inv"  label="Inventory"   icon={<Package  size={14}/>} items={inventoryItems} open={invOpen}  />

        </div>

        {/* ── Bottom-pinned items (Settings, Help, Logout) — matches reference ── */}
        <div className="shrink-0 px-2 pb-3 pt-1 border-t border-zinc-100">

          <NavItem id="settings" label="Settings" icon={<SettingsIcon size={14}/>} />

          {/* Get Help — no tab navigation, just a nav-style row */}
          <button className="sb-item" style={{ color: '#71717a' }}
            onClick={() => window.open('mailto:support@luckyboba.com')}>
            <span className="sb-icon" style={{ color: '#a1a1aa' }}><HelpCircle size={14}/></span>
            Get Help
          </button>

          {/* Search row */}
          <button className="sb-item" style={{ color: '#71717a' }}>
            <span className="sb-icon" style={{ color: '#a1a1aa' }}><Search size={14}/></span>
            Search
          </button>

          <div className="sb-divider" />

          {/* Logout */}
          <button
            onClick={() => setShowLogoutConfirm(true)}
            disabled={isLoggingOut}
            className="sb-item"
            style={{ color: '#be2525' }}
          >
            {isLoggingOut ? (
              <>
                <span className="sb-icon">
                  <div className="relative w-3.5 h-3.5">
                    <div className="absolute inset-0 rounded-full border-[1.5px] border-red-200"/>
                    <div className="sb-spin absolute inset-0 rounded-full border-[1.5px] border-transparent border-t-[#be2525]"/>
                  </div>
                </span>
                Logging out...
              </>
            ) : (
              <>
                <span className="sb-icon"><LogOut size={14}/></span>
                Log out
              </>
            )}
          </button>

        </div>
      </aside>

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)} />
      )}
    </>
  );
};

export default BranchManagerSidebar;