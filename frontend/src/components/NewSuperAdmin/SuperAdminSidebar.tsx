import { useState, useEffect } from "react";
import {
  LayoutGrid, GitBranch, Users, BarChart2, Settings,
  LogOut, ShieldCheck, Tag,
  UtensilsCrossed, Layers, List, Package,
  TrendingUp, FileText, ClipboardList, Receipt, Repeat2,
  Truck, ScanLine, Hash, ShoppingCart, ArrowLeftRight,
  DollarSign, BookOpen, FlaskConical, Wallet, X, ChevronDown, Monitor,
  CreditCard, AlertTriangle, Sparkles, UserCheck, Bell, ShoppingBag
} from "lucide-react";

// ── Tab IDs ───────────────────────────────────────────────────────────────────
export type TabId =
  | "overview" | "branches" | "users" | "devices" | "online_orders"
  | "sales_report" | "analytics" | "items_report" | "staff_performance"
  | "cross_branch_reports" | "x_reading" | "z_reading"
  | "menu_items" | "categories" | "subcategories"
  | "inv_overview" | "inventory_alerts" | "raw_materials" | "usage_report"
  | "recipes" | "supplier" | "purchase_order" | "stock_transfer"
  | "expenses"
  | "card_management" | "card_approvals"
  | "card_members"
  | "loyalty"
  | "customers"
  | "notifications" | "promotions" | "audit" | "settings" | "featured_drinks";

export interface SuperAdminSidebarProps {
  open:          boolean;
  setOpen:       (v: boolean) => void;
  active:        TabId;
  setActive:     (t: TabId) => void;
  onLogout?:     () => void;
  isLoggingOut?: boolean;
}

interface AuthUser {
  id:     number;
  name:   string;
  email:  string;
  role:   string;
  branch?: string | null;
}

// ── Styles ────────────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');
  .sa-sb-root, .sa-sb-root * { font-family: 'DM Sans', sans-serif !important; box-sizing: border-box; }

  .sa-tab {
    border-radius: 0.4rem; border: none; cursor: pointer;
    background: transparent; transition: background 0.12s, color 0.12s;
  }
  .sa-tab:hover  { background: #f5f3ff; color: #3b2063; }
  .sa-tab.active { background: #ede8ff; color: #3b2063; font-weight: 600; }
  .sa-tab.active::before {
    content: ''; position: absolute; left: 0; top: 18%; bottom: 18%;
    width: 2.5px; background: #3b2063; border-radius: 0 2px 2px 0;
  }

  .sa-accordion {
    display: grid; grid-template-rows: 0fr; opacity: 0;
    transition: grid-template-rows 0.32s cubic-bezier(0.4,0,0.2,1), opacity 0.22s ease;
  }
  .sa-accordion.open { grid-template-rows: 1fr; opacity: 1; }
  .sa-accordion-inner { overflow: hidden; }

  .sa-chevron { color: #a1a1aa; flex-shrink: 0; transition: transform 0.32s cubic-bezier(0.4,0,0.2,1); }
  .sa-chevron.open { transform: rotate(180deg); }

  @keyframes sa-overlay-in  { from { opacity: 0; } to { opacity: 1; } }
  @keyframes sa-overlay-out { from { opacity: 1; } to { opacity: 0; } }
  .sa-overlay-enter { animation: sa-overlay-in  0.2s ease forwards; }
  .sa-overlay-exit  { animation: sa-overlay-out 0.25s ease forwards; }

  @keyframes sa-panel-in  { from { transform: translateX(-100%); } to { transform: translateX(0); } }
  @keyframes sa-panel-out { from { transform: translateX(0); }      to { transform: translateX(-100%); } }
  .sa-panel-enter { animation: sa-panel-in  0.3s cubic-bezier(0.22,1,0.36,1) forwards; }
  .sa-panel-exit  { animation: sa-panel-out 0.26s cubic-bezier(0.4,0,1,1)    forwards; }

  .sa-scroll { overflow-y: auto; -ms-overflow-style: none; scrollbar-width: none; }
  .sa-scroll::-webkit-scrollbar { display: none; }

  .sa-sec {
    padding: 16px 4px 5px;
    font-size: 0.58rem; font-weight: 700; letter-spacing: 0.18em;
    text-transform: uppercase; color: #c4c4c8;
  }

  .sa-item {
    display: flex; align-items: center; gap: 14px;
    width: 100%; padding: 13px 14px; border: none;
    background: transparent; cursor: pointer; text-align: left;
    border-radius: 0.75rem; margin: 2px 0;
    color: #3f3f46; font-size: 0.95rem; font-weight: 500;
    transition: background 0.12s, color 0.12s;
    position: relative;
  }
  .sa-item:hover  { background: #f4f2ff; color: #3b2063; }
  .sa-item.active { background: #ede8ff; color: #3b2063; font-weight: 600; }
  .sa-item.active::before {
    content: ''; position: absolute; left: 0; top: 20%; bottom: 20%;
    width: 3px; background: #3b2063; border-radius: 0 3px 3px 0;
  }

  .sa-item-icon {
    flex-shrink: 0; width: 38px; height: 38px; border-radius: 0.6rem;
    background: #f4f4f5; display: flex; align-items: center; justify-content: center;
    transition: background 0.12s;
  }
  .sa-item.active .sa-item-icon { background: #ddd5ff; }
  .sa-item:hover  .sa-item-icon { background: #ede8ff; }

  .sa-group-btn {
    display: flex; align-items: center; gap: 14px;
    width: 100%; padding: 13px 14px; border: none;
    background: transparent; cursor: pointer; text-align: left;
    border-radius: 0.75rem; margin: 2px 0;
    color: #3f3f46; font-size: 0.95rem; font-weight: 500;
    transition: background 0.12s, color 0.12s;
  }
  .sa-group-btn:hover { background: #f4f2ff; color: #3b2063; }
  .sa-group-btn .sa-item-icon {
    flex-shrink: 0; width: 38px; height: 38px; border-radius: 0.6rem;
    background: #f4f4f5; display: flex; align-items: center; justify-content: center;
    transition: background 0.12s;
  }
  .sa-group-btn:hover .sa-item-icon { background: #ede8ff; }

  .sa-m-chevron { color: #a1a1aa; flex-shrink: 0; transition: transform 0.32s cubic-bezier(0.4,0,0.2,1); }
  .sa-m-chevron.open { transform: rotate(180deg); }

  .sa-m-accordion {
    display: grid; grid-template-rows: 0fr; opacity: 0;
    transition: grid-template-rows 0.32s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease;
  }
  .sa-m-accordion.open { grid-template-rows: 1fr; opacity: 1; }
  .sa-m-accordion-inner { overflow: hidden; }

  .sa-sub {
    display: flex; align-items: center; gap: 8px;
    width: 100%; padding: 10px 14px 10px 64px; border: none;
    background: transparent; cursor: pointer; text-align: left;
    border-radius: 0.6rem; margin: 1px 0;
    color: #71717a; font-size: 0.88rem; font-weight: 500;
    transition: background 0.12s, color 0.12s;
    position: relative;
  }
  .sa-sub:hover  { background: #f4f2ff; color: #3b2063; }
  .sa-sub.active { background: #ede8ff; color: #3b2063; font-weight: 600; }
  .sa-sub.active::before {
    content: ''; position: absolute; left: 0; top: 18%; bottom: 18%;
    width: 3px; background: #3b2063; border-radius: 0 3px 3px 0;
  }
  .sa-sub::after {
    content: ''; position: absolute; left: 51px; top: 50%;
    width: 6px; height: 6px; border-radius: 50%;
    background: #d4d4d8; transform: translateY(-50%);
    transition: background 0.12s;
  }
  .sa-sub.active::after, .sa-sub:hover::after { background: #3b2063; }

  .sa-logout {
    display: flex; align-items: center; gap: 14px;
    width: 100%; padding: 13px 14px; border: none;
    background: transparent; cursor: pointer; text-align: left;
    border-radius: 0.75rem; margin: 2px 0;
    color: #be2525; font-size: 0.95rem; font-weight: 500;
    transition: background 0.12s;
    font-family: 'DM Sans', sans-serif;
  }
  .sa-logout:hover { background: #fff0f0; }
  .sa-logout .sa-item-icon { background: #fff0f0; }

  .sa-divider { height: 1px; background: #f0f0f2; margin: 6px 0; }

  @keyframes sa-spin { to { transform: rotate(360deg); } }
  .sa-spin { animation: sa-spin 0.7s linear infinite; }
`;

// ── Nav data ──────────────────────────────────────────────────────────────────
const NAV_ITEMS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "overview",       label: "Overview",          icon: <LayoutGrid  size={14} /> },
  { id: "branches",       label: "Branch Management", icon: <GitBranch   size={14} /> },
  { id: "users",          label: "User Management",   icon: <Users       size={14} /> },
  { id: "devices",        label: "Device Management", icon: <Monitor     size={14} /> },
  { id: "online_orders",  label: "Online Orders",     icon: <ShoppingBag size={14} /> },
];

const REPORTS_ITEMS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "sales_report",         label: "Sales Report",         icon: <Receipt       size={13} /> },
  { id: "analytics",            label: "Analytics & Sales",    icon: <TrendingUp    size={13} /> },
  { id: "items_report",         label: "Items Report",         icon: <List          size={16} /> },
  { id: "staff_performance",    label: "Staff Performance",    icon: <Users            size={16} /> },
  { id: "cross_branch_reports", label: "Cross-Branch Reports", icon: <BarChart2     size={13} /> },
  { id: "x_reading",            label: "X Reading",            icon: <Repeat2       size={13} /> },
  { id: "z_reading",            label: "Z Reading",            icon: <FileText      size={13} /> },
];

const MENU_ITEMS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "menu_items",    label: "Menu List",      icon: <BookOpen size={13} /> },
  { id: "categories",    label: "Categories",     icon: <Layers   size={13} /> },
  { id: "subcategories", label: "Sub-Categories", icon: <List     size={13} /> },
];

const INVENTORY_ITEMS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "inv_overview",     label: "Overview",       icon: <Package        size={13} /> },
  { id: "inventory_alerts",  label: "Alert Center",   icon: <AlertTriangle  size={13} /> },
  { id: "raw_materials",    label: "Raw Materials",  icon: <FlaskConical   size={13} /> },
  { id: "usage_report",     label: "Usage Report",   icon: <ClipboardList  size={13} /> },
  { id: "recipes",          label: "Recipes",        icon: <BookOpen       size={13} /> },
  { id: "supplier",         label: "Supplier",       icon: <Truck          size={13} /> },
  { id: "purchase_order",   label: "Purchase Order", icon: <ShoppingCart   size={13} /> },
  { id: "stock_transfer",   label: "Stock Transfer", icon: <ArrowLeftRight size={13} /> },
];

const EXPENSES_ITEMS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "expenses", label: "Expenses", icon: <Wallet size={13} /> },
];

const APP_ITEMS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "card_management", label: "Card Management", icon: <CreditCard size={14} /> },
  { id: "card_approvals", label: "Card Approvals", icon: <CreditCard size={14} /> },
  { id: "card_members",     label: "Card Members",   icon: <Users      size={14} /> },
  { id: "loyalty",          label: "Loyalty & Points", icon: <Tag        size={14} /> },
  { id: "featured_drinks",  label: "Featured Drinks",  icon: <Sparkles    size={14} /> },
  { id: "customers",        label: "Customers",        icon: <UserCheck   size={14} /> },
];

const SYSTEM_ITEMS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "notifications", label: "Notification Center",   icon: <Bell        size={14} /> },
  { id: "promotions",    label: "Promotions & Discounts", icon: <Tag         size={14} /> },
  { id: "audit",         label: "Audit Logs",             icon: <ShieldCheck size={14} /> },
];

const REPORTS_IDS:   TabId[] = REPORTS_ITEMS.map(i => i.id);
const MENU_IDS:      TabId[] = MENU_ITEMS.map(i => i.id);
const INVENTORY_IDS: TabId[] = INVENTORY_ITEMS.map(i => i.id);
const EXPENSES_IDS:  TabId[] = EXPENSES_ITEMS.map(i => i.id);

const ROLE_LABELS: Record<string, string> = {
  superadmin:     "Super Admin",
  system_admin:   "System Admin",
  branch_manager: "Branch Manager",
  cashier:        "Cashier",
};

const getToken = () =>
  localStorage.getItem("auth_token") || localStorage.getItem("lucky_boba_token") || "";

// ── Desktop: sub item ─────────────────────────────────────────────────────────
const SubItem = ({
  item, active, onClick,
}: {
  item: { id: TabId; label: string; icon: React.ReactNode };
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`sa-tab flex items-center gap-2 w-full pl-7 pr-2.5 py-1.5 text-[0.76rem] font-medium mb-0.5 text-left relative
      ${active ? "active text-[#3b2063]" : "text-zinc-500"}`}
  >
    <span className="absolute left-4 top-1/2 -translate-y-1/2 w-px h-3 bg-zinc-200 rounded-full" />
    <span className={`shrink-0 ${active ? "text-[#3b2063]" : "text-zinc-400"}`}>{item.icon}</span>
    {item.label}
  </button>
);

// ── Desktop: collapsible group ────────────────────────────────────────────────
const NavGroup = ({
  label, icon, items, activeTab, isGroupActive, expanded, onToggle, onNavigate,
}: {
  label: string; icon: React.ReactNode;
  items: { id: TabId; label: string; icon: React.ReactNode }[];
  activeTab: TabId; isGroupActive: boolean; expanded: boolean;
  onToggle: () => void; onNavigate: (id: TabId) => void;
}) => (
  <>
    <button
      onClick={onToggle}
      className={`sa-tab flex items-center gap-2 w-full px-2.5 py-1.5 text-[0.8rem] font-medium mb-0.5 text-left relative transition-colors
        ${isGroupActive ? "active text-[#3b2063]" : "text-zinc-500"}`}
    >
      <span className={`shrink-0 ${isGroupActive ? "text-[#3b2063]" : "text-zinc-400"}`}>{icon}</span>
      <span className="flex-1">{label}</span>
      <ChevronDown size={12} className={`sa-chevron ${expanded ? "open" : ""}`} />
    </button>
    <div className={`sa-accordion ${expanded ? "open" : ""}`}>
      <div className="sa-accordion-inner">
        {items.map(item => (
          <SubItem key={item.id} item={item} active={activeTab === item.id} onClick={() => onNavigate(item.id)} />
        ))}
      </div>
    </div>
  </>
);

// ── Mobile: group with accordion ──────────────────────────────────────────────
const MobileGroup = ({
  label, icon, items, activeTab, isGroupActive, expanded, onToggle, onNavigate,
}: {
  label: string; icon: React.ReactNode;
  items: { id: TabId; label: string; icon: React.ReactNode }[];
  activeTab: TabId; isGroupActive: boolean; expanded: boolean;
  onToggle: () => void; onNavigate: (id: TabId) => void;
}) => (
  <>
    <button onClick={onToggle} className="sa-group-btn">
      <span className="sa-item-icon" style={{ color: isGroupActive ? '#3b2063' : '#71717a' }}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      <ChevronDown size={16} className={`sa-m-chevron ${expanded ? "open" : ""}`} />
    </button>
    <div className={`sa-m-accordion ${expanded ? "open" : ""}`}>
      <div className="sa-m-accordion-inner">
        {items.map(item => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`sa-sub ${activeTab === item.id ? "active" : ""}`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  </>
);

// ── Main component ────────────────────────────────────────────────────────────
const SuperAdminSidebar: React.FC<SuperAdminSidebarProps> = ({
  open, setOpen, active, setActive, onLogout, isLoggingOut: externalLoggingOut,
}) => {
  const [showLogoutModal,    setShowLogoutModal]    = useState(false);
  const [internalLoggingOut, setInternalLoggingOut] = useState(false);
  const [authUser,           setAuthUser]           = useState<AuthUser | null>(null);
  const [isClosing,          setIsClosing]          = useState(false);

  // Desktop accordion state
  const [reportsExp,   setReportsExp]   = useState(false);
  const [menuExp,      setMenuExp]      = useState(false);
  const [inventoryExp, setInventoryExp] = useState(false);
  const [expensesExp,  setExpensesExp]  = useState(false);

  // Mobile accordion state (separate so desktop and mobile don't share)
  const [mReportsExp,   setMReportsExp]   = useState(false);
  const [mMenuExp,      setMMenuExp]      = useState(false);
  const [mInventoryExp, setMInventoryExp] = useState(false);
  const [mExpensesExp,  setMExpensesExp]  = useState(false);

  const reportsOpen   = REPORTS_IDS.includes(active)   || reportsExp;
  const menuOpen      = MENU_IDS.includes(active)      || menuExp;
  const inventoryOpen = INVENTORY_IDS.includes(active) || inventoryExp;
  const expensesOpen  = EXPENSES_IDS.includes(active)  || expensesExp;

  const mReportsOpen   = REPORTS_IDS.includes(active)   || mReportsExp;
  const mMenuOpen      = MENU_IDS.includes(active)      || mMenuExp;
  const mInventoryOpen = INVENTORY_IDS.includes(active) || mInventoryExp;
  const mExpensesOpen  = EXPENSES_IDS.includes(active)  || mExpensesExp;

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
        setAuthUser({ id: u.id, name: u.name, email: u.email, role: u.role, branch: u.branch ?? u.branch_name ?? null });
      } catch { /* silently fail */ }
    };
    fetchMe();
  }, []);

  const closePanel = () => {
    setIsClosing(true);
    setTimeout(() => { setIsClosing(false); setOpen(false); }, 260);
  };

  const go = (id: TabId) => {
    setActive(id);
    if (window.innerWidth < 768) closePanel();
  };

  const handleLogoutConfirm = async () => {
    setShowLogoutModal(false);
    if (onLogout) { onLogout(); return; }
    setInternalLoggingOut(true);
    ["auth_token", "lucky_boba_token", "token", "user_role", "lucky_boba_authenticated"]
      .forEach(k => localStorage.removeItem(k));
    sessionStorage.clear();
    window.location.href = "/login";
  };

  const initials = authUser
    ? authUser.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : "SA";

  return (
    <>
      <style>{STYLES}</style>

      {/* ══════════════════════════════════════════════
          DESKTOP SIDEBAR (md and above)
      ══════════════════════════════════════════════ */}
      <aside className="sa-sb-root fixed inset-y-0 left-0 z-50 w-60 bg-white border-r border-zinc-100 flex-col hidden md:flex md:relative md:translate-x-0">

        {/* User profile */}
        <div className="shrink-0 px-4 pt-6 pb-4 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[0.4rem] bg-[#3b2063] flex items-center justify-center shrink-0">
              <span className="text-[0.55rem] font-black text-white tracking-wide">{initials}</span>
            </div>
            {authUser ? (
              <div>
                <p className="text-[0.85rem] font-bold text-[#1a0f2e] leading-tight truncate max-w-36">{authUser.name}</p>
                <p className="text-[0.58rem] font-bold uppercase tracking-widest text-zinc-400">{ROLE_LABELS[authUser.role] ?? authUser.role}</p>
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
        <div className="flex-1 sa-scroll px-3 py-2 min-h-0">
          <p className="px-2 pt-4 pb-1 text-[0.58rem] font-bold uppercase tracking-widest text-zinc-400">Navigation</p>
          {NAV_ITEMS.map(t => (
            <button key={t.id} onClick={() => go(t.id)}
              className={`sa-tab flex items-center gap-2 w-full px-2.5 py-1.5 text-[0.8rem] font-medium mb-0.5 text-left relative ${active === t.id ? "active" : "text-zinc-500"}`}>
              <span className={`shrink-0 ${active === t.id ? "text-[#3b2063]" : "text-zinc-400"}`}>{t.icon}</span>
              {t.label}
            </button>
          ))}

          <p className="px-2 pt-4 pb-1 text-[0.58rem] font-bold uppercase tracking-widest text-zinc-400">Reports</p>
          <NavGroup label="Reports" icon={<BarChart2 size={14} />} items={REPORTS_ITEMS}
            activeTab={active} isGroupActive={REPORTS_IDS.includes(active)}
            expanded={reportsOpen} onToggle={() => setReportsExp(v => !v)} onNavigate={go} />

          <p className="px-2 pt-4 pb-1 text-[0.58rem] font-bold uppercase tracking-widest text-zinc-400">Menu Management</p>
          <NavGroup label="Menu Management" icon={<UtensilsCrossed size={14} />} items={MENU_ITEMS}
            activeTab={active} isGroupActive={MENU_IDS.includes(active)}
            expanded={menuOpen} onToggle={() => setMenuExp(v => !v)} onNavigate={go} />

          <p className="px-2 pt-4 pb-1 text-[0.58rem] font-bold uppercase tracking-widest text-zinc-400">Inventory</p>
          <NavGroup label="Inventory" icon={<Package size={14} />} items={INVENTORY_ITEMS}
            activeTab={active} isGroupActive={INVENTORY_IDS.includes(active)}
            expanded={inventoryOpen} onToggle={() => setInventoryExp(v => !v)} onNavigate={go} />

          <p className="px-2 pt-4 pb-1 text-[0.58rem] font-bold uppercase tracking-widest text-zinc-400">Expenses</p>
          <NavGroup label="Expenses" icon={<DollarSign size={14} />} items={EXPENSES_ITEMS}
            activeTab={active} isGroupActive={EXPENSES_IDS.includes(active)}
            expanded={expensesOpen} onToggle={() => setExpensesExp(v => !v)} onNavigate={go} />

          <p className="px-2 pt-4 pb-1 text-[0.58rem] font-bold uppercase tracking-widest text-zinc-400">App</p>
          {APP_ITEMS.map(t => (
            <button key={t.id} onClick={() => go(t.id)}
              className={`sa-tab flex items-center gap-2 w-full px-2.5 py-1.5 text-[0.8rem] font-medium mb-0.5 text-left relative ${active === t.id ? "active" : "text-zinc-500"}`}>
              <span className={`shrink-0 ${active === t.id ? "text-[#3b2063]" : "text-zinc-400"}`}>{t.icon}</span>
              {t.label}
            </button>
          ))}

          <p className="px-2 pt-4 pb-1 text-[0.58rem] font-bold uppercase tracking-widest text-zinc-400">System</p>
          {SYSTEM_ITEMS.map(t => (
            <button key={t.id} onClick={() => go(t.id)}
              className={`sa-tab flex items-center gap-2 w-full px-2.5 py-1.5 text-[0.8rem] font-medium mb-0.5 text-left relative ${active === t.id ? "active" : "text-zinc-500"}`}>
              <span className={`shrink-0 ${active === t.id ? "text-[#3b2063]" : "text-zinc-400"}`}>{t.icon}</span>
              {t.label}
            </button>
          ))}
          <div className="pb-4" />
        </div>

        {/* Desktop bottom */}
        <div className="shrink-0 px-3 pb-4 pt-2 border-t border-zinc-100">
          <button onClick={() => go("settings")}
            className={`sa-tab flex items-center gap-2 w-full px-2.5 py-1.5 text-[0.8rem] font-medium mb-0.5 text-left relative ${active === "settings" ? "active" : "text-zinc-500"}`}>
            <span className={`shrink-0 ${active === "settings" ? "text-[#3b2063]" : "text-zinc-400"}`}><Settings size={14} /></span>
            Settings
          </button>
          <div className="h-px bg-zinc-100 my-2" />
          <button onClick={() => setShowLogoutModal(true)} disabled={isLoggingOut}
            className="sa-tab flex items-center gap-2 w-full px-2.5 py-1.5 text-[0.8rem] font-medium text-left"
            style={{ color: "#be2525" }}>
            {isLoggingOut ? (
              <>
                <span className="shrink-0">
                  <div className="relative w-3.5 h-3.5">
                    <div className="absolute inset-0 rounded-full border-[1.5px] border-red-200" />
                    <div className="sa-spin absolute inset-0 rounded-full border-[1.5px] border-transparent border-t-[#be2525]" />
                  </div>
                </span>
                Logging out...
              </>
            ) : (
              <>
                <span className="shrink-0"><LogOut size={14} /></span>
                Log out
              </>
            )}
          </button>
          <p className="mt-3 text-[9px] font-bold uppercase tracking-widest text-zinc-300 text-center">Lucky Boba © 2026</p>
        </div>
      </aside>

      {/* ══════════════════════════════════════════════
          MOBILE — full-viewport panel
      ══════════════════════════════════════════════ */}
      {(open || isClosing) && (
        <>
          {/* Backdrop */}
          <div
            className={`${isClosing ? "sa-overlay-exit" : "sa-overlay-enter"} md:hidden`}
            onClick={closePanel}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(3px)", zIndex: 40 }}
          />

          {/* Panel */}
          <div
            className={`sa-panel-enter${isClosing ? " sa-panel-exit" : ""} sa-sb-root md:hidden`}
            style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "#fff", zIndex: 50, display: "flex", flexDirection: "column", overflow: "hidden" }}
          >
            {/* Profile header */}
            <div style={{ flexShrink: 0, padding: "56px 20px 16px", paddingTop: "max(56px, calc(env(safe-area-inset-top) + 20px))" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg, #7c3aed, #3b2063)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 0 0 3px #ede8ff" }}>
                    <span style={{ fontSize: "1rem", fontWeight: 800, color: "#fff" }}>{initials}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.65rem", color: "#a1a1aa", fontWeight: 500, marginBottom: 1 }}>Hello,</div>
                    <div style={{ fontSize: "1rem", fontWeight: 700, color: "#1a0f2e", lineHeight: 1.2 }}>
                      {authUser?.name ?? "Super Admin"}
                    </div>
                    <div style={{ fontSize: "0.68rem", color: "#a1a1aa", fontWeight: 500, marginTop: 1 }}>Lucky Boba</div>
                  </div>
                </div>
                <button onClick={closePanel} style={{ width: 32, height: 32, borderRadius: "50%", border: "none", background: "#f4f4f5", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <X size={14} color="#71717a" />
                </button>
              </div>
            </div>

            <div className="sa-divider" style={{ margin: "0 20px" }} />

            {/* Scrollable nav */}
            <div className="sa-scroll" style={{ flex: 1, minHeight: 0, padding: "8px 14px" }}>

              <div className="sa-sec">Navigation</div>
              {NAV_ITEMS.map(t => (
                <button key={t.id} onClick={() => go(t.id)} className={`sa-item ${active === t.id ? "active" : ""}`}>
                  <span className="sa-item-icon" style={{ color: active === t.id ? "#3b2063" : "#71717a" }}>{t.icon}</span>
                  {t.label}
                </button>
              ))}

              <div className="sa-sec">Reports</div>
              <MobileGroup label="Reports" icon={<BarChart2 size={18} />}
                items={REPORTS_ITEMS} activeTab={active} isGroupActive={REPORTS_IDS.includes(active)}
                expanded={mReportsOpen} onToggle={() => setMReportsExp(v => !v)} onNavigate={go} />

              <div className="sa-sec">Menu Management</div>
              <MobileGroup label="Menu Management" icon={<UtensilsCrossed size={18} />}
                items={MENU_ITEMS} activeTab={active} isGroupActive={MENU_IDS.includes(active)}
                expanded={mMenuOpen} onToggle={() => setMMenuExp(v => !v)} onNavigate={go} />

              <div className="sa-sec">Inventory</div>
              <MobileGroup label="Inventory" icon={<Package size={18} />}
                items={INVENTORY_ITEMS} activeTab={active} isGroupActive={INVENTORY_IDS.includes(active)}
                expanded={mInventoryOpen} onToggle={() => setMInventoryExp(v => !v)} onNavigate={go} />

              <div className="sa-sec">Expenses</div>
              <MobileGroup label="Expenses" icon={<DollarSign size={18} />}
                items={EXPENSES_ITEMS} activeTab={active} isGroupActive={EXPENSES_IDS.includes(active)}
                expanded={mExpensesOpen} onToggle={() => setMExpensesExp(v => !v)} onNavigate={go} />

              <div className="sa-sec">App</div>
              {APP_ITEMS.map(t => (
                <button key={t.id} onClick={() => go(t.id)} className={`sa-item ${active === t.id ? "active" : ""}`}>
                  <span className="sa-item-icon" style={{ color: active === t.id ? "#3b2063" : "#71717a" }}>{t.icon}</span>
                  {t.label}
                </button>
              ))}

              <div className="sa-sec">System</div>
              {SYSTEM_ITEMS.map(t => (
                <button key={t.id} onClick={() => go(t.id)} className={`sa-item ${active === t.id ? "active" : ""}`}>
                  <span className="sa-item-icon" style={{ color: active === t.id ? "#3b2063" : "#71717a" }}>{t.icon}</span>
                  {t.label}
                </button>
              ))}

            </div>

            {/* Bottom actions */}
            <div style={{ flexShrink: 0, padding: "8px 14px", paddingBottom: "max(24px, env(safe-area-inset-bottom))", borderTop: "1px solid #f0f0f2" }}>
              <button onClick={() => go("settings")} className={`sa-item ${active === "settings" ? "active" : ""}`} style={{ color: active === "settings" ? "#3b2063" : "#3f3f46" }}>
                <span className="sa-item-icon" style={{ color: active === "settings" ? "#3b2063" : "#71717a" }}><Settings size={18} /></span>
                Settings
              </button>
              <button onClick={() => setShowLogoutModal(true)} disabled={isLoggingOut} className="sa-logout">
                {isLoggingOut ? (
                  <>
                    <span className="sa-item-icon">
                      <div style={{ position: "relative", width: 16, height: 16 }}>
                        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "1.5px solid #fca5a5" }} />
                        <div className="sa-spin" style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "1.5px solid transparent", borderTopColor: "#be2525" }} />
                      </div>
                    </span>
                    Logging out...
                  </>
                ) : (
                  <>
                    <span className="sa-item-icon"><LogOut size={18} color="#be2525" /></span>
                    Log out
                  </>
                )}
              </button>
              <div style={{ marginTop: 14, fontSize: "0.56rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em", color: "#d4d4d8", textAlign: "center" }}>
                Lucky Boba © 2026
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Logout Modal ── */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-200 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          <div style={{ background: "#fff", width: "100%", maxWidth: 360, border: "1px solid #e4e4e7", borderRadius: "1.25rem", padding: 32, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", boxShadow: "0 24px 64px rgba(0,0,0,0.18)" }}>
            <div style={{ width: 44, height: 44, borderRadius: "0.625rem", background: "#fff0f0", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
              <LogOut size={19} color="#be2525" />
            </div>
            <h3 style={{ color: "#1a0f2e", fontWeight: 700, fontSize: "1rem", margin: "0 0 8px", letterSpacing: "-0.01em" }}>End Session?</h3>
            <p style={{ color: "#71717a", fontSize: "0.85rem", fontWeight: 500, margin: "0 0 28px", lineHeight: 1.5 }}>
              Are you sure you want to log out of the Super Admin panel?
            </p>
            {authUser && (
              <div style={{ width: "100%", marginBottom: 20, display: "flex", alignItems: "center", gap: 12, padding: 12, background: "#f9f9f9", border: "1px solid #e4e4e7", borderRadius: "0.75rem", textAlign: "left" }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#3b2063", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: "0.6rem", fontWeight: 700, color: "#fff" }}>{initials}</span>
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "#1a0f2e", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{authUser.name}</p>
                  <p style={{ fontSize: "0.65rem", color: "#71717a", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{authUser.email}</p>
                </div>
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", width: "100%", gap: 8 }}>
              <button onClick={handleLogoutConfirm} style={{ width: "100%", padding: "12px", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#fff", background: "#be2525", border: "none", borderRadius: "0.625rem", cursor: "pointer" }}>
                Logout
              </button>
              <button onClick={() => setShowLogoutModal(false)} style={{ width: "100%", padding: "12px", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#71717a", background: "#fff", border: "1px solid #e4e4e7", borderRadius: "0.625rem", cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SuperAdminSidebar;