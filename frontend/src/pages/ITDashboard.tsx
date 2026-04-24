import { useState } from "react";
import React from "react";

// ─────────────────────────────────────────────────────────────────────────────
// ITDashboard.tsx  —  Single-file IT Admin dashboard
//
// ALLOWED TABS: overview, branches (read-only), users,
//               menu_items, categories, subcategories, audit, settings
//
// BLOCKED (no sidebar entry, no switch case, no route):
//   sales_report, cross_branch_reports, analytics, items_report,
//   x_reading, z_reading, inv_overview, raw_materials, usage_report,
//   recipes, supplier, item_checker, item_serials, purchase_order,
//   stock_transfer, expenses, promotions
// ─────────────────────────────────────────────────────────────────────────────

// ── Replace these stubs with your real component imports ─────────────────────
// import OverviewTab      from "../components/NewSuperAdmin/Sidebar/Navigation/OverviewTab";
// import BranchesTab      from "../components/NewSuperAdmin/Sidebar/Navigation/BranchesTab";
// import UsersTab         from "../components/NewSuperAdmin/Sidebar/Navigation/UsersTab";
// import AuditLogsTab     from "../components/NewSuperAdmin/Sidebar/System/AuditLogsTab";
// import SettingsTab      from "../components/NewSuperAdmin/Sidebar/SettingsTab";
// import MenuItemsTab     from "../components/NewSuperAdmin/Sidebar/MenuManagement/MenuItemsTab";
// import CategoriesTab    from "../components/NewSuperAdmin/Sidebar/MenuManagement/CategoriesTab";
// import SubCategoriesTab from "../components/NewSuperAdmin/Sidebar/MenuManagement/SubCategoriesTab";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type ITTabId =
  | "overview"
  | "branches"
  | "users"
  | "menu_items"
  | "categories"
  | "subcategories"
  | "audit"
  | "settings";

interface SidebarProps {
  active:    ITTabId;
  setActive: (id: ITTabId) => void;
  open:      boolean;
  setOpen:   (v: boolean | ((prev: boolean) => boolean)) => void;
}

interface TopBarProps {
  active:      ITTabId;
  onMenuClick: () => void;
}

interface StubProps {
  name: string;
}

interface WrapperProps {
  children: React.ReactNode;
}

interface SvgIconProps {
  size?:    number;
  children: React.ReactNode;
}

interface IcoLockProps {
  size?: number;
}

interface NavItem {
  id:        ITTabId;
  label:     string;
  icon:      React.ReactNode;
  readonly?: boolean;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

// ─────────────────────────────────────────────────────────────────────────────
// STUBS — remove once real imports are uncommented above
// ─────────────────────────────────────────────────────────────────────────────

const Stub: React.FC<StubProps> = ({ name }) => (
  <div style={{ padding: 32 }}>
    <div style={{
      background: "#faf9ff", border: "1.5px dashed #d4cef0",
      borderRadius: 14, padding: "56px 32px",
      textAlign: "center", color: "#9b96c4",
    }}>
      <div style={{ fontSize: 30, marginBottom: 12 }}>🔌</div>
      <div style={{ fontWeight: 700, color: "#6a12b8", fontSize: 15, marginBottom: 6 }}>
        {name}
      </div>
      <div style={{ fontSize: 12, lineHeight: 1.7, maxWidth: 340, margin: "0 auto" }}>
        Replace with your actual{" "}
        <code style={{ background: "#ede8ff", padding: "2px 7px", borderRadius: 4, color: "#5b42a0", fontSize: 11 }}>
          {name}
        </code>{" "}
        component import from{" "}
        <code style={{ background: "#ede8ff", padding: "2px 7px", borderRadius: 4, color: "#5b42a0", fontSize: 11 }}>
          ../components/NewSuperAdmin/...
        </code>
      </div>
    </div>
  </div>
);

// Branches gets a read-only banner wrapper around your real BranchesTab
const BranchesReadOnlyWrapper: React.FC<WrapperProps> = ({ children }) => (
  <div>
    <div style={{
      margin: "20px 20px 0",
      padding: "10px 14px",
      background: "#fef3c7",
      border: "1.5px solid #fde68a",
      borderRadius: 10,
      display: "flex", alignItems: "center", gap: 8,
      fontSize: 12, color: "#92400e", fontWeight: 500,
    }}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
        stroke="#92400e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
      <span>
        <strong>Read-only access.</strong> IT Admin can view branch information but cannot create, edit, or delete branches. Contact Super Admin to make changes.
      </span>
    </div>
    {children}
  </div>
);

const OverviewTab:      React.FC = () => <Stub name="OverviewTab" />;
const BranchesTab:      React.FC = () => <Stub name="BranchesTab" />;
const UsersTab:         React.FC = () => <Stub name="UsersTab" />;
const AuditLogsTab:     React.FC = () => <Stub name="AuditLogsTab" />;
const SettingsTab:      React.FC = () => <Stub name="SettingsTab" />;
const MenuItemsTab:     React.FC = () => <Stub name="MenuItemsTab" />;
const CategoriesTab:    React.FC = () => <Stub name="CategoriesTab" />;
const SubCategoriesTab: React.FC = () => <Stub name="SubCategoriesTab" />;

// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL STYLES
// Same DM Sans, same purple brand tokens, same class names as your project
// ─────────────────────────────────────────────────────────────────────────────

const GlobalStyles: React.FC = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');

    *, *::before, *::after, body, input, button, select, textarea {
      font-family: 'DM Sans', sans-serif !important;
      box-sizing: border-box;
    }

    :root {
      --brand:        #6a12b8;
      --brand-mid:    #5b42a0;
      --brand-light:  #7c5cfc;
      --bg:           #f5f4f8;
      --surface:      #ffffff;
      --surface-soft: #faf9ff;
      --border:       #e8e4f4;
      --border2:      #d4cef0;
      --chip-bg:      #ede8ff;
      --chip-color:   #5b42a0;
      --text:         #1a1333;
      --text2:        #5a5380;
      --text3:        #9b96c4;
      --radius:       10px;
      --radius-lg:    14px;
      --shadow-sm:    0 1px 3px rgba(59,32,99,0.06);
      --shadow-md:    0 4px 20px rgba(59,32,99,0.09);
    }

    ::-webkit-scrollbar { width: 4px; height: 4px; }
    ::-webkit-scrollbar-track { background: #f4f2fb; }
    ::-webkit-scrollbar-thumb { background: #d4d0e8; border-radius: 4px; }

    .it-root { display: flex; height: 100vh; overflow: hidden; background: var(--bg); }

    /* ── Sidebar ── */
    .it-sidebar {
      width: 248px; min-width: 248px;
      background: var(--surface);
      border-right: 1.5px solid var(--border);
      display: flex; flex-direction: column;
      overflow-y: auto; overflow-x: hidden;
      transition: transform 0.22s ease;
    }
    @media (max-width: 768px) {
      .it-sidebar { position: fixed; top: 0; left: 0; bottom: 0; z-index: 50; transform: translateX(-100%); }
      .it-sidebar.open { transform: translateX(0); }
      .it-overlay { display: block !important; position: fixed; inset: 0; z-index: 49; background: rgba(0,0,0,0.35); backdrop-filter: blur(2px); }
    }
    .it-overlay { display: none; }

    .sb-header { padding: 16px 14px 14px; border-bottom: 1.5px solid var(--border); flex-shrink: 0; }
    .sb-logo-row { display: flex; align-items: center; gap: 10px; }
    .sb-icon-box {
      width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
      background: linear-gradient(135deg, var(--brand) 0%, var(--brand-light) 100%);
      display: flex; align-items: center; justify-content: center;
    }
    .sb-name { font-size: 14px; font-weight: 800; color: var(--brand); letter-spacing: -0.2px; }
    .sb-sub  { font-size: 11px; color: var(--text3); margin-top: 1px; }
    .sb-role-pill {
      display: inline-flex; align-items: center; gap: 5px; margin-top: 10px;
      background: var(--chip-bg); color: var(--chip-color);
      font-size: 11px; font-weight: 600; padding: 4px 10px;
      border-radius: 20px; border: 1px solid var(--border2);
    }
    .sb-pulse { width: 6px; height: 6px; border-radius: 50%; background: var(--brand-light); animation: sb-blink 2s ease-in-out infinite; }
    @keyframes sb-blink { 0%,100%{opacity:1} 50%{opacity:0.3} }

    .sb-section { padding: 14px 10px 4px; }
    .sb-section-label { font-size: 9.5px; font-weight: 700; letter-spacing: 1.3px; text-transform: uppercase; color: var(--text3); padding: 0 8px; margin-bottom: 3px; }

    /* ── .sa-tab — exact same class + rules as SuperAdminSidebar ── */
    .sa-tab {
      display: flex; align-items: center; gap: 9px;
      padding: 8px 10px; border-radius: 8px; cursor: pointer;
      font-size: 13px; font-weight: 500; color: var(--text2);
      position: relative; transition: background 0.12s, color 0.12s; user-select: none;
    }
    .sa-tab:hover  { background: #f5f3ff; color: var(--brand); }
    .sa-tab.active { background: #ede8ff; color: var(--brand); font-weight: 600; }
    .sa-tab.active::before { content: ''; position: absolute; left: 0; top: 18%; bottom: 18%; width: 2.5px; background: var(--brand); border-radius: 0 2px 2px 0; }
    .sa-tab svg { flex-shrink: 0; opacity: 0.75; }
    .sa-tab.active svg { opacity: 1; }

    .tab-readonly-badge {
      margin-left: auto; font-size: 9px; font-weight: 700; letter-spacing: 0.5px;
      padding: 2px 6px; border-radius: 4px;
      background: #fef3c7; color: #92400e; border: 1px solid #fde68a; white-space: nowrap;
    }

    .sb-restricted { margin: auto 10px 16px; padding: 11px 13px; background: #fff5f5; border: 1.5px solid #fecaca; border-radius: var(--radius); flex-shrink: 0; }
    .sb-restricted-title { display: flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 700; color: #b91c1c; margin-bottom: 5px; }
    .sb-restricted-body  { font-size: 10.5px; color: #7f1d1d; line-height: 1.6; }
    .sb-restricted-body strong { font-weight: 700; }

    /* ── Topbar ── */
    .it-topbar {
      height: 54px; min-height: 54px; background: var(--surface);
      border-bottom: 1.5px solid var(--border);
      display: flex; align-items: center; padding: 0 20px; gap: 10px; flex-shrink: 0;
    }
    .tb-hamburger { display: none; background: none; border: none; cursor: pointer; color: var(--text2); padding: 4px; border-radius: 6px; }
    @media (max-width: 768px) { .tb-hamburger { display: flex; } }
    .tb-breadcrumb { flex: 1; display: flex; align-items: center; gap: 6px; }
    .tb-root { font-size: 12px; color: var(--text3); }
    .tb-sep  { font-size: 11px; color: var(--border2); }
    .tb-page { font-size: 13px; font-weight: 700; color: var(--brand); }
    .tb-readonly-chip {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 3px 9px; border-radius: 20px;
      background: #fef3c7; border: 1px solid #fde68a;
      font-size: 10px; font-weight: 700; color: #92400e;
    }
    .tb-avatar {
      width: 32px; height: 32px; border-radius: 9px;
      background: linear-gradient(135deg, var(--brand) 0%, var(--brand-light) 100%);
      display: flex; align-items: center; justify-content: center;
      font-size: 11px; font-weight: 800; color: #fff; cursor: pointer; flex-shrink: 0;
    }

    /* ── Main ── */
    .it-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
    .it-body  { flex: 1; overflow-y: auto; }

    /* ── Same animation class names as your project ── */
    @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
    .fade-in { animation: fadeIn 0.25s ease forwards; }

    /* ── Same utility classes as your project ── */
    .card { transition: box-shadow 0.15s ease, transform 0.15s ease; }
    .card:hover { box-shadow: var(--shadow-md); }
    .badge-active   { background:#d1fae5; color:#065f46; }
    .badge-inactive { background:#f3f4f6; color:#6b7280; }
    .badge-pending  { background:#fef3c7; color:#92400e; }
    .badge-danger   { background:#fee2e2; color:#991b1b; }
    .toggle-on  { background:#6a12b8; }
    .toggle-off { background:#d1d5db; }
  `}</style>
);

// ─────────────────────────────────────────────────────────────────────────────
// TAB LABELS + READ-ONLY SET
// ─────────────────────────────────────────────────────────────────────────────

const TAB_LABELS: Record<ITTabId, string> = {
  overview:      "Overview",
  branches:      "Branches",
  users:         "Users",
  menu_items:    "Menu Items",
  categories:    "Categories",
  subcategories: "Sub-Categories",
  audit:         "Audit Logs",
  settings:      "Settings",
};

const READONLY_TABS = new Set<ITTabId>(["branches"]);

// ─────────────────────────────────────────────────────────────────────────────
// IT SIDEBAR
// ─────────────────────────────────────────────────────────────────────────────

const ITSidebar: React.FC<SidebarProps> = ({ active, setActive, open, setOpen }) => {

  const sections: NavSection[] = [
    {
      label: "Navigation",
      items: [
        { id: "overview", label: "Overview", icon: <IcoHome /> },
        { id: "branches", label: "Branches", icon: <IcoBranch />, readonly: true },
        { id: "users",    label: "Users",    icon: <IcoUsers /> },
      ],
    },
    {
      label: "Menu Management",
      items: [
        { id: "menu_items",    label: "Menu Items",     icon: <IcoMenu />   },
        { id: "categories",    label: "Categories",     icon: <IcoGrid />   },
        { id: "subcategories", label: "Sub-Categories", icon: <IcoLayers /> },
      ],
    },
    {
      label: "System",
      items: [
        { id: "audit",    label: "Audit Logs", icon: <IcoLog />      },
        { id: "settings", label: "Settings",   icon: <IcoSettings /> },
      ],
    },
  ];

  return (
    <>
      {open && <div className="it-overlay" onClick={() => setOpen(false)} />}

      <aside className={`it-sidebar${open ? " open" : ""}`}>

        <div className="sb-header">
          <div className="sb-logo-row">
            <div className="sb-icon-box">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                <line x1="8"  y1="21" x2="16" y2="21"/>
                <line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
            </div>
            <div>
              <div className="sb-name">IT Dashboard</div>
              <div className="sb-sub">Internal portal</div>
            </div>
          </div>
          <div className="sb-role-pill">
            <span className="sb-pulse" />
            IT Admin
          </div>
        </div>

        {sections.map((sec) => (
          <div className="sb-section" key={sec.label}>
            <div className="sb-section-label">{sec.label}</div>
            {sec.items.map((item) => (
              <div
                key={item.id}
                className={`sa-tab${active === item.id ? " active" : ""}`}
                onClick={() => { setActive(item.id); setOpen(false); }}
              >
                {item.icon}
                {item.label}
                {item.readonly && (
                  <span className="tab-readonly-badge">READ ONLY</span>
                )}
              </div>
            ))}
          </div>
        ))}

        <div style={{ flex: 1 }} />

        <div className="sb-restricted">
          <div className="sb-restricted-title">
            <IcoLock size={12} />
            Access Restricted
          </div>
          <div className="sb-restricted-body">
            <strong>Sales Reports, Analytics, Inventory, Expenses,</strong> and{" "}
            <strong>Promotions</strong> are not accessible to the IT Admin role.
          </div>
        </div>

      </aside>
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// IT TOPBAR
// ─────────────────────────────────────────────────────────────────────────────

const ITTopBar: React.FC<TopBarProps> = ({ active, onMenuClick }) => (
  <header className="it-topbar">
    <button className="tb-hamburger" onClick={onMenuClick} aria-label="Open menu">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="12" x2="21" y2="12"/>
        <line x1="3" y1="6"  x2="21" y2="6"/>
        <line x1="3" y1="18" x2="21" y2="18"/>
      </svg>
    </button>

    <div className="tb-breadcrumb">
      <span className="tb-root">IT Dashboard</span>
      <span className="tb-sep">›</span>
      <span className="tb-page">{TAB_LABELS[active]}</span>
      {READONLY_TABS.has(active) && (
        <span className="tb-readonly-chip">
          <IcoLock size={10} />
          Read Only
        </span>
      )}
    </div>

    <div className="tb-avatar" title="IT Admin">IT</div>
  </header>
);

// ─────────────────────────────────────────────────────────────────────────────
// IT DASHBOARD — mirrors SuperAdminDashboard.tsx exactly
// ─────────────────────────────────────────────────────────────────────────────

const ITDashboard: React.FC = () => {
  const [active,      setActive]      = useState<ITTabId>("overview");
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  const renderContent = (): React.ReactNode => {
    switch (active) {

      // ── Navigation ──────────────────────────────────────────────────────────
      case "overview":
        return <OverviewTab />;

      case "branches":
        return (
          <BranchesReadOnlyWrapper>
            <BranchesTab />
          </BranchesReadOnlyWrapper>
        );

      case "users":
        return <UsersTab />;

      // ── Menu Management ──────────────────────────────────────────────────────
      case "menu_items":
        return <MenuItemsTab />;

      case "categories":
        return <CategoriesTab />;

      case "subcategories":
        return <SubCategoriesTab />;

      // ── System ───────────────────────────────────────────────────────────────
      case "audit":
        return <AuditLogsTab />;

      case "settings":
        return <SettingsTab />;

      // BLOCKED — intentionally no case for:
      //   sales_report, cross_branch_reports, analytics, items_report,
      //   x_reading, z_reading, inv_overview, raw_materials, usage_report,
      //   recipes, supplier, item_checker, item_serials, purchase_order,
      //   stock_transfer, expenses, promotions

      default:
        return <OverviewTab />;
    }
  };

  return (
    <>
      <GlobalStyles />
      <div className="it-root">

        <ITSidebar
          open={sidebarOpen}
          setOpen={setSidebarOpen}
          active={active}
          setActive={setActive}
        />

        <main className="it-main">
          <ITTopBar
            active={active}
            onMenuClick={() => setSidebarOpen((v) => !v)}
          />
          <div className="it-body">
            <div className="fade-in" key={active}>
              {renderContent()}
            </div>
          </div>
        </main>

      </div>
    </>
  );
};

export default ITDashboard;

// ─────────────────────────────────────────────────────────────────────────────
// SVG ICONS
// ─────────────────────────────────────────────────────────────────────────────

const SvgIcon: React.FC<SvgIconProps> = ({ size = 15, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

const IcoHome: React.FC = () => (
  <SvgIcon>
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </SvgIcon>
);

const IcoBranch: React.FC = () => (
  <SvgIcon>
    <circle cx="18" cy="5"  r="3"/>
    <circle cx="6"  cy="12" r="3"/>
    <circle cx="18" cy="19" r="3"/>
    <line x1="8.59"  y1="13.51" x2="15.42" y2="17.49"/>
    <line x1="15.41" y1="6.51"  x2="8.59"  y2="10.49"/>
  </SvgIcon>
);

const IcoUsers: React.FC = () => (
  <SvgIcon>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </SvgIcon>
);

const IcoMenu: React.FC = () => (
  <SvgIcon>
    <line x1="8"  y1="6"  x2="21" y2="6"/>
    <line x1="8"  y1="12" x2="21" y2="12"/>
    <line x1="8"  y1="18" x2="21" y2="18"/>
    <line x1="3"  y1="6"  x2="3.01" y2="6"/>
    <line x1="3"  y1="12" x2="3.01" y2="12"/>
    <line x1="3"  y1="18" x2="3.01" y2="18"/>
  </SvgIcon>
);

const IcoGrid: React.FC = () => (
  <SvgIcon>
    <rect x="3"  y="3"  width="7" height="7"/>
    <rect x="14" y="3"  width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/>
    <rect x="3"  y="14" width="7" height="7"/>
  </SvgIcon>
);

const IcoLayers: React.FC = () => (
  <SvgIcon>
    <polygon points="12 2 2 7 12 12 22 7 12 2"/>
    <polyline points="2 17 12 22 22 17"/>
    <polyline points="2 12 12 17 22 12"/>
  </SvgIcon>
);

const IcoLog: React.FC = () => (
  <SvgIcon>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </SvgIcon>
);

const IcoSettings: React.FC = () => (
  <SvgIcon>
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83
      2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1
      1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65
      0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65
      0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65
      1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1
      2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0
      1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65
      0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65
      0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65
      1.65 0 0 0-1.51 1z"/>
  </SvgIcon>
);

const IcoLock: React.FC<IcoLockProps> = ({ size = 15 }) => (
  <SvgIcon size={size}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </SvgIcon>
);
