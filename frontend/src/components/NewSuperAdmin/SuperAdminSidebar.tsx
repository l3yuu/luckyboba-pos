import { useState, useEffect } from "react";
import {
  LayoutGrid, GitBranch, Users, BarChart2, Settings,
  LogOut, HelpCircle, ShieldCheck, Tag, 
  ChevronRight, UtensilsCrossed, Layers, List, Package,
  TrendingUp, FileText, ClipboardList, Receipt, Repeat2,
  Truck, ScanLine, Hash, ShoppingCart, ArrowLeftRight,
  DollarSign, BookOpen, FlaskConical, Wallet,
} from "lucide-react";

// ── Tab IDs ───────────────────────────────────────────────────────────────────
export type TabId =
  // Navigation
  | "overview" | "branches" | "users"
  // Reports
  | "sales_report" | "analytics" | "items_report"
  | "cross_branch_reports" | "x_reading" | "z_reading"
  // Menu Management
  | "menu_items" | "categories" | "subcategories"
  // Inventory
  | "inv_overview" | "raw_materials" | "usage_report"
  | "recipes" | "supplier" | "item_checker"
  | "item_serials" | "purchase_order" | "stock_transfer"
  // Expenses
  | "expenses"
  // System
  | "promotions" | "audit" | "settings";

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

// ── Nav group definitions ─────────────────────────────────────────────────────
const NAV_ITEMS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "overview",  label: "Overview",          icon: <LayoutGrid size={14} /> },
  { id: "branches",  label: "Branch Management", icon: <GitBranch  size={14} /> },
  { id: "users",     label: "User Management",   icon: <Users      size={14} /> },
];

const REPORTS_ITEMS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "sales_report",        label: "Sales Report",         icon: <Receipt      size={13} /> },
  { id: "analytics",           label: "Analytics & Sales",    icon: <TrendingUp   size={13} /> },
  { id: "items_report",        label: "Items Report",         icon: <ClipboardList size={13} /> },
  { id: "cross_branch_reports",label: "Cross-Branch Reports", icon: <BarChart2    size={13} /> },
  { id: "x_reading",           label: "X Reading",            icon: <Repeat2      size={13} /> },
  { id: "z_reading",           label: "Z Reading",            icon: <FileText     size={13} /> },
];

const MENU_ITEMS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "menu_items",    label: "Menu List",       icon: <BookOpen        size={13} /> },
  { id: "categories",    label: "Categories",      icon: <Layers          size={13} /> },
  { id: "subcategories", label: "Sub-Categories",  icon: <List            size={13} /> },
];

const INVENTORY_ITEMS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "inv_overview",   label: "Overview",        icon: <Package        size={13} /> },
  { id: "raw_materials",  label: "Raw Materials",   icon: <FlaskConical   size={13} /> },
  { id: "usage_report",   label: "Usage Report",    icon: <ClipboardList  size={13} /> },
  { id: "recipes",        label: "Recipes",         icon: <BookOpen       size={13} /> },
  { id: "supplier",       label: "Supplier",        icon: <Truck          size={13} /> },
  { id: "item_checker",   label: "Item Checker",    icon: <ScanLine       size={13} /> },
  { id: "item_serials",   label: "Item Serials",    icon: <Hash           size={13} /> },
  { id: "purchase_order", label: "Purchase Order",  icon: <ShoppingCart   size={13} /> },
  { id: "stock_transfer", label: "Stock Transfer",  icon: <ArrowLeftRight size={13} /> },
];

const EXPENSES_ITEMS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "expenses", label: "Expenses", icon: <Wallet size={13} /> },
];

const SYSTEM_ITEMS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "promotions", label: "Promotions & Discounts", icon: <Tag         size={14} /> },
  { id: "audit",      label: "Audit Logs",             icon: <ShieldCheck size={14} /> },
];

// ── ID sets for group detection ───────────────────────────────────────────────
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
  localStorage.getItem("auth_token") ||
  localStorage.getItem("lucky_boba_token") || "";

// ── Sub-nav item component ────────────────────────────────────────────────────
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

// ── Collapsible group component ───────────────────────────────────────────────
const NavGroup = ({
  label, icon, items, activeTab, isGroupActive, expanded, onToggle, onNavigate,
}: {
  label:         string;
  icon:          React.ReactNode;
  items:         { id: TabId; label: string; icon: React.ReactNode }[];
  activeTab:     TabId;
  isGroupActive: boolean;
  expanded:      boolean;
  onToggle:      () => void;
  onNavigate:    (id: TabId) => void;
}) => (
  <>
    <button
      onClick={onToggle}
      className={`sa-tab flex items-center gap-2 w-full px-2.5 py-1.5 text-[0.8rem] font-medium mb-0.5 text-left relative transition-colors
        ${isGroupActive ? "active text-[#3b2063]" : "text-zinc-500"}`}
    >
      <span className={`shrink-0 ${isGroupActive ? "text-[#3b2063]" : "text-zinc-400"}`}>{icon}</span>
      <span className="flex-1">{label}</span>
      <span className={`shrink-0 transition-transform duration-200 ${expanded ? "rotate-90" : ""}`}>
        <ChevronRight size={12} className="text-zinc-300" />
      </span>
    </button>
    <div
      className="overflow-hidden transition-all duration-200"
      style={{ maxHeight: expanded ? `${items.length * 36}px` : "0px" }}
    >
      {items.map(item => (
        <SubItem
          key={item.id}
          item={item}
          active={activeTab === item.id}
          onClick={() => onNavigate(item.id)}
        />
      ))}
    </div>
  </>
);

// ── Main Component ────────────────────────────────────────────────────────────
const SuperAdminSidebar: React.FC<SuperAdminSidebarProps> = ({
  open, setOpen, active, setActive, onLogout, isLoggingOut: externalLoggingOut,
}) => {
  const [showLogoutModal,    setShowLogoutModal]    = useState(false);
  const [internalLoggingOut, setInternalLoggingOut] = useState(false);
  const [authUser,           setAuthUser]           = useState<AuthUser | null>(null);

  // ── Collapsible group state (derived + manual toggle) ─────────────────────
  const [reportsExpanded,   setReportsExpanded]   = useState(false);
  const [menuExpanded,      setMenuExpanded]      = useState(false);
  const [inventoryExpanded, setInventoryExpanded] = useState(false);
  const [expensesExpanded,  setExpensesExpanded]  = useState(false);

  const reportsOpen   = REPORTS_IDS.includes(active)   || reportsExpanded;
  const menuOpen      = MENU_IDS.includes(active)      || menuExpanded;
  const inventoryOpen = INVENTORY_IDS.includes(active) || inventoryExpanded;
  const expensesOpen  = EXPENSES_IDS.includes(active)  || expensesExpanded;

  const isLoggingOut = externalLoggingOut ?? internalLoggingOut;

  // ── Fetch logged-in user ──────────────────────────────────────────────────
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
        setAuthUser({ id: u.id, name: u.name, email: u.email, role: u.role, branch: u.branch ?? u.branch_name ?? null });
      } catch { /* silently fail */ }
    };
    fetchMe();
  }, []);

  const go = (id: TabId) => {
    setActive(id);
    if (window.innerWidth < 768) setOpen(false);
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
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-60 bg-white border-r border-zinc-100
          flex flex-col transform transition-transform duration-300
          md:relative md:translate-x-0
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* User Profile */}
        <div className="shrink-0 px-4 pt-6 pb-4 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[0.4rem] bg-[#3b2063] flex items-center justify-center shrink-0">
              <span className="text-[0.55rem] font-black text-white tracking-wide">{initials}</span>
            </div>
            {authUser ? (
              <div>
                <p className="text-[0.85rem] font-bold text-[#1a0f2e] leading-tight truncate max-w-35">
                  {authUser.name}
                </p>
                <p className="text-[0.58rem] font-bold uppercase tracking-widest text-zinc-400">
                  {ROLE_LABELS[authUser.role] ?? authUser.role}
                </p>
              </div>
            ) : (
              // Skeleton while loading
              <div className="flex flex-col gap-1.5">
                <div className="h-3 w-24 bg-zinc-200 rounded animate-pulse" />
                <div className="h-2 w-16 bg-zinc-100 rounded animate-pulse" />
              </div>
            )}
          </div>
        </div>

        {/* Scrollable nav area */}
        <div className="flex-1 overflow-y-auto px-3 py-2 min-h-0" style={{ scrollbarWidth: "none" }}>

          {/* ── Navigation ──────────────────────────────────────────────── */}
          <p className="px-2 pt-4 pb-1 text-[0.58rem] font-bold uppercase tracking-widest text-zinc-400">Navigation</p>
          {NAV_ITEMS.map(t => (
            <button
              key={t.id}
              onClick={() => go(t.id)}
              className={`sa-tab flex items-center gap-2 w-full px-2.5 py-1.5 text-[0.8rem] font-medium mb-0.5 text-left relative ${active === t.id ? "active" : "text-zinc-500"}`}
            >
              <span className={`shrink-0 ${active === t.id ? "text-[#3b2063]" : "text-zinc-400"}`}>{t.icon}</span>
              {t.label}
            </button>
          ))}

          {/* ── Reports ─────────────────────────────────────────────────── */}
          <p className="px-2 pt-4 pb-1 text-[0.58rem] font-bold uppercase tracking-widest text-zinc-400">Reports</p>
          <NavGroup
            label="Reports"
            icon={<BarChart2 size={14} />}
            items={REPORTS_ITEMS}
            activeTab={active}
            isGroupActive={REPORTS_IDS.includes(active)}
            expanded={reportsOpen}
            onToggle={() => setReportsExpanded(v => !v)}
            onNavigate={go}
          />

          {/* ── Menu Management ─────────────────────────────────────────── */}
          <p className="px-2 pt-4 pb-1 text-[0.58rem] font-bold uppercase tracking-widest text-zinc-400">Menu Management</p>
          <NavGroup
            label="Menu Management"
            icon={<UtensilsCrossed size={14} />}
            items={MENU_ITEMS}
            activeTab={active}
            isGroupActive={MENU_IDS.includes(active)}
            expanded={menuOpen}
            onToggle={() => setMenuExpanded(v => !v)}
            onNavigate={go}
          />

          {/* ── Inventory ───────────────────────────────────────────────── */}
          <p className="px-2 pt-4 pb-1 text-[0.58rem] font-bold uppercase tracking-widest text-zinc-400">Inventory</p>
          <NavGroup
            label="Inventory"
            icon={<Package size={14} />}
            items={INVENTORY_ITEMS}
            activeTab={active}
            isGroupActive={INVENTORY_IDS.includes(active)}
            expanded={inventoryOpen}
            onToggle={() => setInventoryExpanded(v => !v)}
            onNavigate={go}
          />

          {/* ── Expenses ────────────────────────────────────────────────── */}
          <p className="px-2 pt-4 pb-1 text-[0.58rem] font-bold uppercase tracking-widest text-zinc-400">Expenses</p>
          <NavGroup
            label="Expenses"
            icon={<DollarSign size={14} />}
            items={EXPENSES_ITEMS}
            activeTab={active}
            isGroupActive={EXPENSES_IDS.includes(active)}
            expanded={expensesOpen}
            onToggle={() => setExpensesExpanded(v => !v)}
            onNavigate={go}
          />

          {/* ── System ──────────────────────────────────────────────────── */}
          <p className="px-2 pt-4 pb-1 text-[0.58rem] font-bold uppercase tracking-widest text-zinc-400">System</p>
          {SYSTEM_ITEMS.map(t => (
            <button
              key={t.id}
              onClick={() => go(t.id)}
              className={`sa-tab flex items-center gap-2 w-full px-2.5 py-1.5 text-[0.8rem] font-medium mb-0.5 text-left relative ${active === t.id ? "active" : "text-zinc-500"}`}
            >
              <span className={`shrink-0 ${active === t.id ? "text-[#3b2063]" : "text-zinc-400"}`}>{t.icon}</span>
              {t.label}
            </button>
          ))}

          <div className="pb-4" />
        </div>

        {/* Bottom actions */}
        <div className="shrink-0 px-3 pb-4 pt-2 border-t border-zinc-100">
          <button
            onClick={() => go("settings")}
            className={`sa-tab flex items-center gap-2 w-full px-2.5 py-1.5 text-[0.8rem] font-medium mb-0.5 text-left relative ${active === "settings" ? "active" : "text-zinc-500"}`}
          >
            <span className={`shrink-0 ${active === "settings" ? "text-[#3b2063]" : "text-zinc-400"}`}>
              <Settings size={14} />
            </span>
            Settings
          </button>

          <button
            className="sa-tab flex items-center gap-2 w-full px-2.5 py-1.5 text-[0.8rem] font-medium text-zinc-500 mb-0.5 text-left"
            onClick={() => window.open("mailto:support@luckyboba.com")}
          >
            <span className="shrink-0 text-zinc-400"><HelpCircle size={14} /></span>
            Get Help
          </button>

          <div className="h-px bg-zinc-100 my-2" />

          <button
            onClick={() => setShowLogoutModal(true)}
            disabled={isLoggingOut}
            className="sa-tab flex items-center gap-2 w-full px-2.5 py-1.5 text-[0.8rem] font-medium text-left"
            style={{ color: "#be2525" }}
          >
            {isLoggingOut ? (
              <>
                <span className="shrink-0">
                  <div className="relative w-3.5 h-3.5">
                    <div className="absolute inset-0 rounded-full border-[1.5px] border-red-200" />
                    <div className="absolute inset-0 rounded-full border-[1.5px] border-transparent border-t-[#be2525] animate-spin" />
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

          <p className="mt-3 text-[9px] font-bold uppercase tracking-widest text-zinc-800 text-center">
            Lucky Boba © 2026
          </p>
        </div>
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Logout Modal */}
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
              Are you sure you want to log out of the Super Admin panel?
            </p>
            {authUser && (
              <div className="w-full mb-5 flex items-center gap-3 p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-left">
                <div className="w-8 h-8 rounded-full bg-[#3b2063] flex items-center justify-center shrink-0">
                  <span className="text-[0.6rem] font-bold text-white">{initials}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#1a0f2e] truncate">{authUser.name}</p>
                  <p className="text-[10px] text-zinc-800 truncate">{authUser.email}</p>
                </div>
              </div>
            )}
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

export default SuperAdminSidebar;