import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Users, BarChart2, ShoppingBag,
  Package, Settings as SettingsIcon, LogOut,
  ChevronDown, Activity, Monitor, Trash2, X, Smartphone, Tag, Award,
} from 'lucide-react';

// ── Styles (mirrored from SuperAdminSidebar) ──────────────────────────────────
const SB_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');
  .bm-sb-root, .bm-sb-root * { font-family: 'DM Sans', sans-serif !important; box-sizing: border-box; }

  /* ── Tab (flat nav item) ── */
  .bm-tab {
    border-radius: 0.4rem; border: none; cursor: pointer;
    background: transparent; transition: background 0.12s, color 0.12s;
  }
  .bm-tab:hover  { background: #f5f3ff; color: #3b2063; }
  .bm-tab.active { background: #ede8ff; color: #3b2063; font-weight: 600; }
  .bm-tab.active::before {
    content: ''; position: absolute; left: 0; top: 18%; bottom: 18%;
    width: 2.5px; background: #3b2063; border-radius: 0 2px 2px 0;
  }

  /* ── Desktop accordion ── */
  .bm-accordion {
    display: grid; grid-template-rows: 0fr; opacity: 0;
    transition: grid-template-rows 0.32s cubic-bezier(0.4,0,0.2,1), opacity 0.22s ease;
  }
  .bm-accordion.open { grid-template-rows: 1fr; opacity: 1; }
  .bm-accordion-inner { overflow: hidden; }

  .bm-chevron { color: #a1a1aa; flex-shrink: 0; transition: transform 0.32s cubic-bezier(0.4,0,0.2,1); }
  .bm-chevron.open { transform: rotate(180deg); }

  /* ── Mobile panel animations ── */
  @keyframes bm-overlay-in  { from { opacity: 0; } to { opacity: 1; } }
  @keyframes bm-overlay-out { from { opacity: 1; } to { opacity: 0; } }
  .bm-overlay-enter { animation: bm-overlay-in  0.2s ease forwards; }
  .bm-overlay-exit  { animation: bm-overlay-out 0.25s ease forwards; }

  @keyframes bm-panel-in  { from { transform: translateX(-100%); } to { transform: translateX(0); } }
  @keyframes bm-panel-out { from { transform: translateX(0); }      to { transform: translateX(-100%); } }
  .bm-panel-enter { animation: bm-panel-in  0.3s cubic-bezier(0.22,1,0.36,1) forwards; }
  .bm-panel-exit  { animation: bm-panel-out 0.26s cubic-bezier(0.4,0,1,1)    forwards; }

  /* ── Scroll ── */
.bm-scroll { 
  overflow-y: auto; 
  height: 100%; 
  scrollbar-width: none; /* Keep it clean */
}
.bm-scroll::-webkit-scrollbar { display: none; }

/* Ensure the root is fixed to the screen */
.bm-sb-root {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

  /* ── Section label ── */
  .bm-sec {
    padding: 16px 4px 5px;
    font-size: 0.58rem; font-weight: 700; letter-spacing: 0.18em;
    text-transform: uppercase; color: #c4c4c8;
  }

  /* ── Desktop nav item ── */
  .bm-item {
    display: flex; align-items: center; gap: 8px;
    width: 100%; padding: 7px 10px; border: none;
    background: transparent; cursor: pointer; text-align: left;
    border-radius: 0.4rem; margin: 1px 0;
    color: #52525b; font-size: 0.8rem; font-weight: 500;
    transition: background 0.12s, color 0.12s;
    position: relative;
  }
  .bm-item:hover  { background: #f5f3ff; color: #3b2063; }
  .bm-item.active { background: #ede8ff; color: #3b2063; font-weight: 600; }
  .bm-item.active::before {
    content: ''; position: absolute; left: 0; top: 18%; bottom: 18%;
    width: 2.5px; background: #3b2063; border-radius: 0 2px 2px 0;
  }

  /* ── Desktop group button ── */
  .bm-group-btn {
    display: flex; align-items: center; gap: 8px;
    width: 100%; padding: 7px 10px; border: none;
    background: transparent; cursor: pointer; text-align: left;
    border-radius: 0.4rem; margin: 1px 0;
    color: #52525b; font-size: 0.8rem; font-weight: 500;
    transition: background 0.12s, color 0.12s;
  }
  .bm-group-btn:hover { background: #f5f3ff; color: #3b2063; }

  /* ── Desktop sub item ── */
  .bm-sub {
    display: flex; align-items: center; gap: 8px;
    width: 100%; padding: 6px 10px 6px 28px; border: none;
    background: transparent; cursor: pointer; text-align: left;
    border-radius: 0.4rem; margin: 1px 0;
    color: #71717a; font-size: 0.76rem; font-weight: 500;
    transition: background 0.12s, color 0.12s;
    position: relative;
  }
  .bm-sub:hover  { background: #f5f3ff; color: #3b2063; }
  .bm-sub.active { background: #ede8ff; color: #3b2063; font-weight: 600; }
  .bm-sub.active::before {
    content: ''; position: absolute; left: 0; top: 18%; bottom: 18%;
    width: 2.5px; background: #3b2063; border-radius: 0 2px 2px 0;
  }
  .bm-sub::after {
    content: ''; position: absolute; left: 18px; top: 50%;
    width: 5px; height: 5px; border-radius: 50%;
    background: #d4d4d8; transform: translateY(-50%);
    transition: background 0.12s;
  }
  .bm-sub.active::after, .bm-sub:hover::after { background: #3b2063; }

  /* ── NEW: pulse badge for pending app orders ── */
  .bm-sb-badge {
    margin-left: auto;
    min-width: 18px; height: 18px;
    background: #3b2063; color: #fff;
    border-radius: 100px; padding: 0 5px;
    font-size: 0.55rem; font-weight: 800;
    display: flex; align-items: center; justify-content: center;
    letter-spacing: 0.02em;
    animation: bm-sb-pop 0.3s cubic-bezier(0.34,1.56,0.64,1);
  }
  @keyframes bm-sb-pop { from { transform: scale(0); } to { transform: scale(1); } }

  /* ── Mobile nav item (with icon box) ── */
  .bm-m-item {
    display: flex; align-items: center; gap: 14px;
    width: 100%; padding: 13px 14px; border: none;
    background: transparent; cursor: pointer; text-align: left;
    border-radius: 0.75rem; margin: 2px 0;
    color: #3f3f46; font-size: 0.95rem; font-weight: 500;
    transition: background 0.12s, color 0.12s;
    position: relative;
  }
  .bm-m-item:hover  { background: #f4f2ff; color: #3b2063; }
  .bm-m-item.active { background: #ede8ff; color: #3b2063; font-weight: 600; }
  .bm-m-item.active::before {
    content: ''; position: absolute; left: 0; top: 20%; bottom: 20%;
    width: 3px; background: #3b2063; border-radius: 0 3px 3px 0;
  }
  .bm-m-icon {
    flex-shrink: 0; width: 38px; height: 38px; border-radius: 0.6rem;
    background: #f4f4f5; display: flex; align-items: center; justify-content: center;
    transition: background 0.12s;
  }
  .bm-m-item.active .bm-m-icon { background: #ddd5ff; }
  .bm-m-item:hover  .bm-m-icon { background: #ede8ff; }

  /* ── Mobile group button ── */
  .bm-m-group-btn {
    display: flex; align-items: center; gap: 14px;
    width: 100%; padding: 13px 14px; border: none;
    background: transparent; cursor: pointer; text-align: left;
    border-radius: 0.75rem; margin: 2px 0;
    color: #3f3f46; font-size: 0.95rem; font-weight: 500;
    transition: background 0.12s, color 0.12s;
  }
  .bm-m-group-btn:hover { background: #f4f2ff; color: #3b2063; }
  .bm-m-group-btn .bm-m-icon {
    flex-shrink: 0; width: 38px; height: 38px; border-radius: 0.6rem;
    background: #f4f4f5; display: flex; align-items: center; justify-content: center;
    transition: background 0.12s;
  }
  .bm-m-group-btn:hover .bm-m-icon { background: #ede8ff; }

  /* ── Mobile accordion ── */
  .bm-m-accordion {
    display: grid; grid-template-rows: 0fr; opacity: 0;
    transition: grid-template-rows 0.32s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease;
  }
  .bm-m-accordion.open { grid-template-rows: 1fr; opacity: 1; }
  .bm-m-accordion-inner { overflow: hidden; }

  /* ── Mobile sub item ── */
  .bm-m-sub {
    display: flex; align-items: center; gap: 8px;
    width: 100%; padding: 10px 14px 10px 64px; border: none;
    background: transparent; cursor: pointer; text-align: left;
    border-radius: 0.6rem; margin: 1px 0;
    color: #71717a; font-size: 0.88rem; font-weight: 500;
    transition: background 0.12s, color 0.12s;
    position: relative;
  }
  .bm-m-sub:hover  { background: #f4f2ff; color: #3b2063; }
  .bm-m-sub.active { background: #ede8ff; color: #3b2063; font-weight: 600; }
  .bm-m-sub.active::before {
    content: ''; position: absolute; left: 0; top: 18%; bottom: 18%;
    width: 3px; background: #3b2063; border-radius: 0 3px 3px 0;
  }
  .bm-m-sub::after {
    content: ''; position: absolute; left: 51px; top: 50%;
    width: 6px; height: 6px; border-radius: 50%;
    background: #d4d4d8; transform: translateY(-50%);
    transition: background 0.12s;
  }
  .bm-m-sub.active::after, .bm-m-sub:hover::after { background: #3b2063; }

  /* ── Logout ── */
  .bm-logout {
    display: flex; align-items: center; gap: 8px;
    width: 100%; padding: 7px 10px; border: none;
    background: transparent; cursor: pointer; text-align: left;
    border-radius: 0.4rem; margin: 1px 0;
    color: #be2525; font-size: 0.8rem; font-weight: 500;
    transition: background 0.12s;
    font-family: 'DM Sans', sans-serif;
  }
  .bm-logout:hover { background: #fff0f0; }

  .bm-divider { height: 1px; background: #f0f0f2; margin: 6px 0; }

  @keyframes bm-spin { to { transform: rotate(360deg); } }
  .bm-spin { animation: bm-spin 0.7s linear infinite; }
`;

// ── Types ─────────────────────────────────────────────────────────────────────
interface BranchManagerSidebarProps {
  isSidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  logo: string;
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onLogout?: () => void;
  isLoggingOut?: boolean;
}

interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

const getToken = () =>
  localStorage.getItem("auth_token") ||
  localStorage.getItem("lucky_boba_token") || "";

// ── Nav data ──────────────────────────────────────────────────────────────────
const salesItems = [
  { tab: 'sales-dashboard', label: 'Sales Dashboard' },
  { tab: 'items-report', label: 'Items Report' },
  { tab: 'expenses', label: 'Branch Expenses' },
  { tab: 'x-reading', label: 'X-Reading' },
  { tab: 'z-reading', label: 'Z-Reading' },
];
const menuItems = [
  { tab: 'menu-list', label: 'Menu List' },
  { tab: 'category-list', label: 'Categories' },
  { tab: 'sub-category-list', label: 'Sub-Categories' },
];
const inventoryItems = [
  { tab: 'inventory-dashboard', label: 'Overview' },
  { tab: 'inventory-alert-center', label: 'Alert Center' },
  { tab: 'inventory-list', label: 'Raw Materials' },
  { tab: 'inventory-report', label: 'Usage Report' },
  { tab: 'inventory-recipes', label: 'Recipes' },
  { tab: 'purchase-order', label: 'Purchase Orders' },
  { tab: 'stock-transfer', label: 'Stock Transfer' },
];
const appItems = [
  { tab: 'app-orders', label: 'App Orders' },
  { tab: 'menu-management', label: 'Menu Availability' },
  { tab: 'payment-settings', label: 'Payment Settings' },
];

const SALES_TABS = salesItems.map(i => i.tab);
const MENU_TABS = menuItems.map(i => i.tab);
const INVENTORY_TABS = inventoryItems.map(i => i.tab);

// ── Desktop: collapsible group ────────────────────────────────────────────────
const NavGroup = ({
  label, icon, items, currentTab, expanded, onToggle, onNavigate, badge,
}: {
  label: string;
  icon: React.ReactNode;
  items: { tab: string; label: string }[];
  currentTab: string;
  expanded: boolean;
  onToggle: () => void;
  onNavigate: (tab: string) => void;
  badge?: number;
}) => {
  const isGroupActive = items.some(i => i.tab === currentTab);
  return (
    <>
      <button
        onClick={onToggle}
        className={`bm-group-btn ${isGroupActive ? 'text-[#3b2063]' : ''}`}
      >
        <span style={{ flexShrink: 0, width: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', color: isGroupActive ? '#3b2063' : '#a1a1aa' }}>
          {icon}
        </span>
        <span style={{ flex: 1 }}>{label}</span>
        {badge != null && badge > 0 && <span className="bm-sb-badge">{badge}</span>}
        <ChevronDown size={12} className={`bm-chevron ${expanded ? 'open' : ''}`} />
      </button>
      <div className={`bm-accordion ${expanded ? 'open' : ''}`}>
        <div className="bm-accordion-inner">
          {items.map(({ tab, label: l }) => (
            <button
              key={tab}
              onClick={() => onNavigate(tab)}
              className={`bm-sub ${currentTab === tab ? 'active' : ''}`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

// ── Mobile: group with accordion ──────────────────────────────────────────────
const MobileGroup = ({
  label, icon, items, currentTab, expanded, onToggle, onNavigate, badge,
}: {
  label: string;
  icon: React.ReactNode;
  items: { tab: string; label: string }[];
  currentTab: string;
  expanded: boolean;
  onToggle: () => void;
  onNavigate: (tab: string) => void;
  badge?: number;
}) => {
  const isGroupActive = items.some(i => i.tab === currentTab);
  return (
    <>
      <button onClick={onToggle} className="bm-m-group-btn">
        <span className="bm-m-icon" style={{ color: isGroupActive ? '#3b2063' : '#71717a' }}>{icon}</span>
        <span style={{ flex: 1 }}>{label}</span>
        {badge != null && badge > 0 && <span className="bm-sb-badge">{badge}</span>}
        <ChevronDown size={16} style={{ color: '#a1a1aa', flexShrink: 0, transition: 'transform 0.32s cubic-bezier(0.4,0,0.2,1)', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }} />
      </button>
      <div className={`bm-m-accordion ${expanded ? 'open' : ''}`}>
        <div className="bm-m-accordion-inner">
          {items.map(({ tab, label: l }) => (
            <button
              key={tab}
              onClick={() => onNavigate(tab)}
              className={`bm-m-sub ${currentTab === tab ? 'active' : ''}`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const BranchManagerSidebar: React.FC<BranchManagerSidebarProps> = ({
  isSidebarOpen, setSidebarOpen, currentTab, setCurrentTab,
  onLogout, isLoggingOut: externalLoggingOut,
}) => {
  const [internalLoggingOut] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [pendingOrderCount, setPendingOrderCount] = useState(0);

  // Desktop accordion state
  const [salesExp, setSalesExp] = useState(false);
  const [menuExp, setMenuExp] = useState(false);
  const [inventoryExp, setInventoryExp] = useState(false);
  const [appExp, setAppExp] = useState(false);

  // Mobile accordion state
  const [mSalesExp, setMSalesExp] = useState(false);
  const [mMenuExp, setMMenuExp] = useState(false);
  const [mInventoryExp, setMInventoryExp] = useState(false);
  const [mAppExp, setMAppExp] = useState(false);

  const APP_TABS = appItems.map(i => i.tab);

  const salesOpen = SALES_TABS.includes(currentTab) || salesExp;
  const menuOpen = MENU_TABS.includes(currentTab) || menuExp;
  const inventoryOpen = INVENTORY_TABS.includes(currentTab) || inventoryExp;
  const appOpen = APP_TABS.includes(currentTab) || appExp;

  const mSalesOpen = SALES_TABS.includes(currentTab) || mSalesExp;
  const mMenuOpen = MENU_TABS.includes(currentTab) || mMenuExp;
  const mInventoryOpen = INVENTORY_TABS.includes(currentTab) || mInventoryExp;
  const mAppOpen = APP_TABS.includes(currentTab) || mAppExp;

  const isLoggingOut = externalLoggingOut ?? internalLoggingOut;

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const token = getToken();
        const res = await fetch("/api/user", {
          headers: {
            "Accept": "application/json", "Content-Type": "application/json",
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

  // ── Poll pending app orders count every 30s ──────────────────────────────
  useEffect(() => {
    const fetchPending = async () => {
      try {
        const res = await fetch('/api/branch/app-orders', {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${getToken()}`,
          },
        });
        if (!res.ok) return;
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.data ?? []);
        const count = list.filter((o: { status?: string }) => o.status?.toLowerCase() === 'pending').length;
        setPendingOrderCount(count);
      } catch { /* silently fail */ }
    };
    fetchPending();
    const id = setInterval(fetchPending, 30_000);
    return () => clearInterval(id);
  }, []);

  const closePanel = () => {
    setIsClosing(true);
    setTimeout(() => { setIsClosing(false); setSidebarOpen(false); }, 260);
  };

  const go = (tab: string) => {
    setCurrentTab(tab);
    if (window.innerWidth < 768) closePanel();
  };


  const initials = authUser
    ? authUser.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "BM";

  return (
    <>
      <style>{SB_STYLES}</style>

      {/* ══════════════════════════════════════════════
          DESKTOP SIDEBAR (md and above)
      ══════════════════════════════════════════════ */}
      <aside className="bm-sb-root fixed inset-y-0 left-0 z-50 w-60 bg-white border-r border-zinc-100 flex-col hidden md:flex md:relative md:translate-x-0 shrink-0">

        {/* User profile */}
        <div className="shrink-0 px-4 pt-6 pb-4 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[0.4rem] bg-[#3b2063] flex items-center justify-center shrink-0">
              <span className="text-[0.55rem] font-black text-white tracking-wide">{initials}</span>
            </div>
            {authUser ? (
              <div>
                <p className="text-[0.85rem] font-bold text-[#1a0f2e] leading-tight truncate max-w-36">{authUser.name}</p>
                <p className="text-[0.58rem] font-bold uppercase tracking-widest text-zinc-400">Branch Manager</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <div className="h-3 w-24 bg-zinc-200 rounded animate-pulse" />
                <div className="h-2 w-16 bg-zinc-100 rounded animate-pulse" />
              </div>
            )}
          </div>
        </div>

        {/* Desktop nav */}
        <div className="flex-1 bm-scroll px-3 py-2 min-h-0 overflow-y-auto">
          <p className="px-2 pt-4 pb-1 text-[0.58rem] font-bold uppercase tracking-widest text-zinc-400">Home</p>
          {[
            { tab: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={14} /> },
            { tab: 'live-pulse', label: 'Live Pulse', icon: <Activity size={14} /> },
            { tab: 'staff-performance', label: 'Staff Performance', icon: <Award size={14} /> },
            { tab: 'users', label: 'User Management', icon: <Users size={14} /> },
            { tab: 'device-management', label: 'Device Management', icon: <Monitor size={14} /> },
          ].map(t => (
            <button key={t.tab} onClick={() => go(t.tab)}
              className={`bm-item ${currentTab === t.tab ? 'active' : ''}`}>
              <span style={{ flexShrink: 0, width: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', color: currentTab === t.tab ? '#3b2063' : '#a1a1aa' }}>{t.icon}</span>
              {t.label}
            </button>
          ))}

          <p className="px-2 pt-4 pb-1 text-[0.58rem] font-bold uppercase tracking-widest text-zinc-400">Mobile App</p>
          <NavGroup label="App Management" icon={<Smartphone size={14} />}
            items={appItems} currentTab={currentTab}
            expanded={appOpen} onToggle={() => setAppExp(v => !v)} onNavigate={go} badge={pendingOrderCount} />

          <p className="px-2 pt-4 pb-1 text-[0.58rem] font-bold uppercase tracking-widest text-zinc-400">Reports</p>
          <NavGroup label="Sales Reports" icon={<BarChart2 size={14} />}
            items={salesItems} currentTab={currentTab}
            expanded={salesOpen} onToggle={() => setSalesExp(v => !v)} onNavigate={go} />

          <p className="px-2 pt-4 pb-1 text-[0.58rem] font-bold uppercase tracking-widest text-zinc-400">Menu</p>
          <NavGroup label="Menu Items" icon={<ShoppingBag size={14} />}
            items={menuItems} currentTab={currentTab}
            expanded={menuOpen} onToggle={() => setMenuExp(v => !v)} onNavigate={go} />

          <p className="px-2 pt-4 pb-1 text-[0.58rem] font-bold uppercase tracking-widest text-zinc-400">Inventory</p>
          <NavGroup label="Inventory" icon={<Package size={14} />}
            items={inventoryItems} currentTab={currentTab}
            expanded={inventoryOpen} onToggle={() => setInventoryExp(v => !v)} onNavigate={go} />

          <p className="px-2 pt-4 pb-1 text-[0.58rem] font-bold uppercase tracking-widest text-zinc-400">Floor Ops</p>
          <button onClick={() => go('online-orders')} className={`bm-item ${currentTab === 'online-orders' ? 'active' : ''}`}>
            <span style={{ flexShrink: 0, width: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', color: currentTab === 'online-orders' ? '#3b2063' : '#a1a1aa' }}><ShoppingBag size={14} /></span>
            Online Orders
          </button>
          <button onClick={() => go('void-logs')} className={`bm-item ${currentTab === 'void-logs' ? 'active' : ''}`}>
            <span style={{ flexShrink: 0, width: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', color: currentTab === 'void-logs' ? '#3b2063' : '#a1a1aa' }}><Trash2 size={14} /></span>
            Void Logs
          </button>

          <p className="px-2 pt-4 pb-1 text-[0.58rem] font-bold uppercase tracking-widest text-zinc-400">System</p>
          {[
            { tab: 'audit-logs', label: 'Audit Logs', icon: <Activity size={14} /> },
            { tab: 'promos-discounts', label: 'Promos & Discounts', icon: <Tag size={14} /> },
          ].map(t => (
            <button key={t.tab} onClick={() => go(t.tab)} className={`bm-item ${currentTab === t.tab ? 'active' : ''}`}>
              <span style={{ flexShrink: 0, width: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', color: currentTab === t.tab ? '#3b2063' : '#a1a1aa' }}>{t.icon}</span>
              {t.label}
            </button>
          ))}

          <div className="pb-4" />
        </div>

        {/* Desktop bottom */}
        <div className="shrink-0 px-3 pb-4 pt-2 border-t border-zinc-100">
          <button onClick={() => go('settings')} className={`bm-item ${currentTab === 'settings' ? 'active' : ''}`}>
            <span style={{ flexShrink: 0, width: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', color: currentTab === 'settings' ? '#3b2063' : '#a1a1aa' }}><SettingsIcon size={14} /></span>
            Settings
          </button>
          <div className="bm-divider" />
          <button onClick={() => onLogout?.()} disabled={isLoggingOut} className="bm-logout">
            {isLoggingOut ? (
              <>
                <span style={{ flexShrink: 0, width: 15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div className="relative w-3.5 h-3.5">
                    <div className="absolute inset-0 rounded-full border-[1.5px] border-red-200" />
                    <div className="bm-spin absolute inset-0 rounded-full border-[1.5px] border-transparent border-t-[#be2525]" />
                  </div>
                </span>
                Logging out...
              </>
            ) : (
              <>
                <span style={{ flexShrink: 0, width: 15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LogOut size={14} /></span>
                Log out
              </>
            )}
          </button>
          <p className="mt-3 text-[9px] font-bold uppercase tracking-widest text-zinc-800 text-center">Lucky Boba © 2026</p>
        </div>
      </aside>

      {/* ══════════════════════════════════════════════
          MOBILE — full-viewport panel
      ══════════════════════════════════════════════ */}
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
                    <span style={{ fontSize: '1rem', fontWeight: 800, color: '#fff' }}>{initials}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: '#a1a1aa', fontWeight: 500, marginBottom: 1 }}>Hello,</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1a0f2e', lineHeight: 1.2 }}>
                      {authUser?.name ?? 'Branch Manager'}
                    </div>
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
            <div className="bm-scroll" style={{
              flex: 1,
              minHeight: 0,
              padding: '8px 14px',
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch'
            }}>

              <div className="bm-sec">Home</div>
              {[
                { tab: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
                { tab: 'live-pulse', label: 'Live Pulse', icon: <Activity size={18} /> },
                { tab: 'staff-performance', label: 'Staff Performance', icon: <Award size={18} /> },
                { tab: 'users', label: 'User Management', icon: <Users size={18} /> },
                { tab: 'device-management', label: 'Device Management', icon: <Monitor size={18} /> },
              ].map(t => (
                <button key={t.tab} onClick={() => go(t.tab)} className={`bm-m-item ${currentTab === t.tab ? 'active' : ''}`}>
                  <span className="bm-m-icon" style={{ color: currentTab === t.tab ? '#3b2063' : '#71717a' }}>{t.icon}</span>
                  {t.label}
                </button>
              ))}

              <div className="bm-sec">Mobile App</div>
              <MobileGroup label="App Management" icon={<Smartphone size={18} />}
                items={appItems} currentTab={currentTab}
                expanded={mAppOpen} onToggle={() => setMAppExp(v => !v)} onNavigate={go} badge={pendingOrderCount} />

              <div className="bm-sec">Reports</div>
              <MobileGroup label="Sales Reports" icon={<BarChart2 size={18} />}
                items={salesItems} currentTab={currentTab}
                expanded={mSalesOpen} onToggle={() => setMSalesExp(v => !v)} onNavigate={go} />

              <div className="bm-sec">Menu</div>
              <MobileGroup label="Menu Items" icon={<ShoppingBag size={18} />}
                items={menuItems} currentTab={currentTab}
                expanded={mMenuOpen} onToggle={() => setMMenuExp(v => !v)} onNavigate={go} />

              <div className="bm-sec">Inventory</div>
              <MobileGroup label="Inventory" icon={<Package size={18} />}
                items={inventoryItems} currentTab={currentTab}
                expanded={mInventoryOpen} onToggle={() => setMInventoryExp(v => !v)} onNavigate={go} />

              <div className="bm-sec">Floor Ops</div>
              <button onClick={() => go('online-orders')} className={`bm-m-item ${currentTab === 'online-orders' ? 'active' : ''}`}>
                <span className="bm-m-icon" style={{ color: currentTab === 'online-orders' ? '#3b2063' : '#71717a' }}><ShoppingBag size={18} /></span>
                Online Orders
              </button>
              <button onClick={() => go('void-logs')} className={`bm-m-item ${currentTab === 'void-logs' ? 'active' : ''}`}>
                <span className="bm-m-icon" style={{ color: currentTab === 'void-logs' ? '#3b2063' : '#71717a' }}><Trash2 size={18} /></span>
                Void Logs
              </button>

              <div className="bm-sec">System</div>
              <button onClick={() => go('audit-logs')} className={`bm-m-item ${currentTab === 'audit-logs' ? 'active' : ''}`}>
                <span className="bm-m-icon" style={{ color: currentTab === 'audit-logs' ? '#3b2063' : '#71717a' }}><Activity size={18} /></span>
                Audit Logs
              </button>
              <button onClick={() => go('promos-discounts')} className={`bm-m-item ${currentTab === 'promos-discounts' ? 'active' : ''}`}>
                <span className="bm-m-icon" style={{ color: currentTab === 'promos-discounts' ? '#3b2063' : '#71717a' }}><Tag size={18} /></span>
                Promos & Discounts
              </button>


            </div>

            {/* Bottom actions */}
            <div style={{ flexShrink: 0, padding: '8px 14px', paddingBottom: 'max(24px, env(safe-area-inset-bottom))', borderTop: '1px solid #f0f0f2' }}>
              <button onClick={() => go('settings')} className={`bm-m-item ${currentTab === 'settings' ? 'active' : ''}`}>
                <span className="bm-m-icon" style={{ color: currentTab === 'settings' ? '#3b2063' : '#71717a' }}><SettingsIcon size={18} /></span>
                Settings
              </button>
              <button onClick={() => onLogout?.()} disabled={isLoggingOut}
                style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', padding: '13px 14px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', borderRadius: '0.75rem', margin: '2px 0', color: '#be2525', fontSize: '0.95rem', fontWeight: 500 }}>
                {isLoggingOut ? (
                  <>
                    <span className="bm-m-icon">
                      <div style={{ position: 'relative', width: 16, height: 16 }}>
                        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1.5px solid #fca5a5' }} />
                        <div className="bm-spin" style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1.5px solid transparent', borderTopColor: '#be2525' }} />
                      </div>
                    </span>
                    Logging out...
                  </>
                ) : (
                  <>
                    <span className="bm-m-icon"><LogOut size={18} color="#be2525" /></span>
                    Log out
                  </>
                )}
              </button>
              <div style={{ marginTop: 14, fontSize: '0.56rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#d4d4d8', textAlign: 'center' }}>
                Lucky Boba © 2026
              </div>
            </div>
          </div>
        </>
      )}

    </>
  );
};

export default BranchManagerSidebar;