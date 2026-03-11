// pages/SuperAdminDashboard.tsx
import { useState } from "react";
import {
  LayoutDashboard, GitBranch, Users, BarChart2,
  Tag, Settings as SettingsIcon,
  LogOut, HelpCircle, ChevronDown, X, Menu, Clock,
} from "lucide-react";

import OverviewTab   from "../components/NewSuperAdmin/Tabs/OverviewTab";
import BranchesTab   from "../components/NewSuperAdmin/Tabs/BranchesTab";
import UsersTab      from "../components/NewSuperAdmin/Tabs/UsersTab";
import ReportsTab    from "../components/NewSuperAdmin/Tabs/ReportsTab";
import AuditLogsTab  from "../components/NewSuperAdmin/Tabs/AuditLogsTab";
import PromotionsTab from "../components/NewSuperAdmin/Tabs/PromotionsTab";
import SettingsTab   from "../components/NewSuperAdmin/Tabs/SettingsTab";

// ── Types ──────────────────────────────────────────────────────────────────────
type TabId =
  | "overview" | "branches" | "users"
  | "reports"  | "audit"    | "promotions" | "settings";

type GroupId = "reports";

// ── Styles ────────────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');
  *, *::before, *::after, body, input, button, select, textarea {
    font-family: 'DM Sans', sans-serif !important;
    box-sizing: border-box;
  }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: #f4f2fb; }
  ::-webkit-scrollbar-thumb { background: #d4d0e8; border-radius: 4px; }
  .card { transition: box-shadow 0.15s ease, transform 0.15s ease; }
  .card:hover { box-shadow: 0 4px 24px rgba(59,32,99,0.08); }
  @keyframes sa-pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
  .pulse { animation: sa-pulse 2s ease-in-out infinite; }
  @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  .fade-in { animation: fadeIn 0.25s ease forwards; }
  .badge-active   { background:#d1fae5; color:#065f46; }
  .badge-inactive { background:#f3f4f6; color:#6b7280; }
  .badge-pending  { background:#fef3c7; color:#92400e; }
  .badge-danger   { background:#fee2e2; color:#991b1b; }
  .toggle-on  { background:#3b2063; }
  .toggle-off { background:#d1d5db; }

  /* ── Sidebar shared ── */
  .sa-sb-root, .sa-sb-root * { font-family: 'DM Sans', sans-serif !important; box-sizing: border-box; }
  .sa-sb-scroll { overflow-y: auto; -ms-overflow-style: none; scrollbar-width: none; }
  .sa-sb-scroll::-webkit-scrollbar { display: none; }

  /* ── Desktop: section label ── */
  .sa-sb-sec {
    padding: 14px 14px 3px;
    font-size: 0.58rem; font-weight: 700; letter-spacing: 0.18em;
    text-transform: uppercase; color: #b4b4b8;
  }

  /* ── Desktop: nav item ── */
  .sa-sb-item {
    display: flex; align-items: center; gap: 8px;
    width: 100%; padding: 6.5px 10px; border: none;
    background: transparent; cursor: pointer; text-align: left;
    border-radius: 0.4rem; margin: 0;
    color: #52525b; font-size: 0.8rem; font-weight: 500;
    transition: background 0.12s, color 0.12s;
    position: relative;
  }
  .sa-sb-item:hover  { background: #f5f3ff; color: #3b2063; }
  .sa-sb-item.active { background: #ede8ff; color: #3b2063; font-weight: 600; }
  .sa-sb-item.active::before {
    content: ''; position: absolute; left: 0; top: 18%; bottom: 18%;
    width: 2.5px; background: #3b2063; border-radius: 0 2px 2px 0;
  }
  .sa-sb-icon { flex-shrink: 0; width: 15px; display: flex; align-items: center; justify-content: center; }
  .sa-sb-divider { height: 1px; background: #f0f0f2; margin: 6px 10px; }

  /* ── Desktop: group button ── */
  .sa-sb-group-btn {
    display: flex; align-items: center; gap: 8px;
    width: 100%; padding: 6.5px 10px; border: none;
    background: transparent; cursor: pointer; text-align: left;
    border-radius: 0.4rem;
    color: #52525b; font-size: 0.8rem; font-weight: 500;
    transition: background 0.12s, color 0.12s;
  }
  .sa-sb-group-btn:hover { background: #f5f3ff; color: #3b2063; }

  /* ── Desktop: sub item ── */
  .sa-sb-sub {
    display: flex; align-items: center; gap: 8px;
    width: 100%; padding: 5.5px 10px 5.5px 28px; border: none;
    background: transparent; cursor: pointer; text-align: left;
    border-radius: 0.4rem; margin: 0;
    color: #71717a; font-size: 0.75rem; font-weight: 500;
    transition: background 0.12s, color 0.12s;
    position: relative;
  }
  .sa-sb-sub:hover  { background: #f5f3ff; color: #3b2063; }
  .sa-sb-sub.active { background: #ede8ff; color: #3b2063; font-weight: 600; }
  .sa-sb-sub.active::before {
    content: ''; position: absolute; left: 0; top: 18%; bottom: 18%;
    width: 2.5px; background: #3b2063; border-radius: 0 2px 2px 0;
  }

  /* ── Desktop: chevron ── */
  .sa-sb-chevron {
    color: #a1a1aa; flex-shrink: 0;
    transition: transform 0.32s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .sa-sb-chevron.open { transform: rotate(180deg); }

  /* ── Desktop: accordion ── */
  .sa-sb-accordion {
    display: grid; grid-template-rows: 0fr; opacity: 0;
    transition: grid-template-rows 0.32s cubic-bezier(0.4,0,0.2,1), opacity 0.22s ease;
  }
  .sa-sb-accordion.open { grid-template-rows: 1fr; opacity: 1; }
  .sa-sb-accordion-inner { overflow: hidden; }

  /* ── Overlay animations ── */
  @keyframes sa-overlay-in  { from{opacity:0} to{opacity:1} }
  @keyframes sa-overlay-out { from{opacity:1} to{opacity:0} }
  .sa-overlay-enter { animation: sa-overlay-in  0.2s ease forwards; }
  .sa-overlay-exit  { animation: sa-overlay-out 0.25s ease forwards; }

  /* ── Mobile: panel slide ── */
  @keyframes sa-panel-in  { from{transform:translateX(-100%)} to{transform:translateX(0)} }
  @keyframes sa-panel-out { from{transform:translateX(0)}      to{transform:translateX(-100%)} }
  .sa-panel-enter { animation: sa-panel-in  0.3s cubic-bezier(0.22,1,0.36,1) forwards; }
  .sa-panel-exit  { animation: sa-panel-out 0.26s cubic-bezier(0.4,0,1,1)    forwards; }

  /* ── Mobile: section label ── */
  .sa-sec {
    padding: 16px 4px 5px;
    font-size: 0.58rem; font-weight: 700; letter-spacing: 0.18em;
    text-transform: uppercase; color: #c4c4c8;
  }

  /* ── Mobile: nav item ── */
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

  /* ── Mobile: icon box ── */
  .sa-item-icon {
    flex-shrink: 0; width: 38px; height: 38px;
    border-radius: 0.6rem; background: #f4f4f5;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.12s;
  }
  .sa-item.active .sa-item-icon { background: #ddd5ff; }
  .sa-item:hover  .sa-item-icon { background: #ede8ff; }

  /* ── Mobile: group button ── */
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

  /* ── Mobile: chevron ── */
  .sa-chevron {
    color: #a1a1aa; flex-shrink: 0;
    transition: transform 0.32s cubic-bezier(0.4,0,0.2,1);
  }
  .sa-chevron.open { transform: rotate(180deg); }

  /* ── Mobile: accordion ── */
  .sa-accordion {
    display: grid; grid-template-rows: 0fr; opacity: 0;
    transition: grid-template-rows 0.32s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease;
  }
  .sa-accordion.open { grid-template-rows: 1fr; opacity: 1; }
  .sa-accordion-inner { overflow: hidden; }

  /* ── Mobile: sub item ── */
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

  /* ── Mobile: logout button ── */
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

  @keyframes sa-sb-spin { to { transform: rotate(360deg); } }
  .sa-sb-spin { animation: sa-sb-spin 0.7s linear infinite; }
`;

// ── Page title map ─────────────────────────────────────────────────────────────
const PAGE_TITLES: Record<TabId, string> = {
  overview:   "Overview",
  branches:   "Branches",
  users:      "Users",
  reports:    "Reports",
  audit:      "Audit Logs",
  promotions: "Promotions",
  settings:   "Settings",
};

// ── SuperAdminDashboard ───────────────────────────────────────────────────────
const SuperAdminDashboard: React.FC = () => {
  const [active,         setActive]         = useState<TabId>("overview");
  const [sidebarOpen,    setSidebarOpen]     = useState(false);
  const [openGroups,     setOpenGroups]      = useState<Set<GroupId>>(new Set());
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut,   setIsLoggingOut]    = useState(false);
  const [isClosing,      setIsClosing]       = useState(false);

  const reportItems: { tab: TabId; label: string }[] = [
    { tab: "reports", label: "Sales Reports" },
    { tab: "audit",   label: "Audit Logs"    },
  ];

  const reportsOpen = openGroups.has("reports");

  const closePanel = () => {
    setIsClosing(true);
    setTimeout(() => { setIsClosing(false); setSidebarOpen(false); }, 260);
  };

  const goTo = (tab: TabId) => {
    setActive(tab);
    if (window.innerWidth < 768) closePanel();
  };

  const toggleGroup = (id: GroupId) => {
    setOpenGroups(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleLogoutConfirm = () => {
    setIsLoggingOut(true);
    setShowLogoutModal(false);
    ["auth_token", "lucky_boba_token", "token", "user_role", "lucky_boba_authenticated"]
      .forEach(k => localStorage.removeItem(k));
    sessionStorage.clear();
    window.location.href = "/login";
  };

  const isActive  = (tab: TabId) => active === tab;
  const iconColor = (tab: TabId) => isActive(tab) ? "#3b2063" : "#71717a";

  const renderContent = () => {
    switch (active) {
      case "overview":   return <OverviewTab   />;
      case "branches":   return <BranchesTab   />;
      case "users":      return <UsersTab       />;
      case "reports":    return <ReportsTab     />;
      case "audit":      return <AuditLogsTab   />;
      case "promotions": return <PromotionsTab  />;
      case "settings":   return <SettingsTab    />;
    }
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="sa-sb-root flex flex-col md:flex-row h-screen bg-[#f5f4f8] overflow-hidden">

        {/* ══════════════════════════════════════════════
            DESKTOP SIDEBAR (md and above)
        ══════════════════════════════════════════════ */}
        <aside className="sa-sb-root fixed inset-y-0 left-0 z-50 w-60 bg-white border-r border-zinc-100 flex-col hidden md:flex md:relative md:translate-x-0">

          {/* Brand */}
          <div className="shrink-0 px-4 pt-6 pb-4 border-b border-zinc-100">
            <div className="flex items-center gap-3">
              <div style={{ width: 32, height: 32, borderRadius: "0.4rem", background: "#3b2063", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: "0.6rem", fontWeight: 800, color: "#fff", letterSpacing: "0.02em" }}>SA</span>
              </div>
              <div>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1a0f2e", lineHeight: 1.2 }}>Lucky Boba</div>
                <div style={{ fontSize: "0.6rem", fontWeight: 600, color: "#a1a1aa", letterSpacing: "0.05em", textTransform: "uppercase" }}>Super Admin</div>
              </div>
            </div>
          </div>

          {/* Desktop Nav */}
          <div className="flex-1 sa-sb-scroll min-h-0 px-3 py-2">
            <div className="sa-sb-sec mt-2">Home</div>
            <button onClick={() => goTo("overview")} className={`sa-sb-item ${isActive("overview") ? "active" : ""}`}>
              <span className="sa-sb-icon"><LayoutDashboard size={14} color={iconColor("overview")} /></span>
              Overview
            </button>

            <div className="sa-sb-sec">Management</div>
            <button onClick={() => goTo("branches")} className={`sa-sb-item ${isActive("branches") ? "active" : ""}`}>
              <span className="sa-sb-icon"><GitBranch size={14} color={iconColor("branches")} /></span>
              Branches
            </button>
            <button onClick={() => goTo("users")} className={`sa-sb-item ${isActive("users") ? "active" : ""}`}>
              <span className="sa-sb-icon"><Users size={14} color={iconColor("users")} /></span>
              Users
            </button>
            <button onClick={() => goTo("promotions")} className={`sa-sb-item ${isActive("promotions") ? "active" : ""}`}>
              <span className="sa-sb-icon"><Tag size={14} color={iconColor("promotions")} /></span>
              Promotions
            </button>

            <div className="sa-sb-sec">Analytics</div>
            <button onClick={() => toggleGroup("reports")} className="sa-sb-group-btn">
              <span className="sa-sb-icon">
                <BarChart2 size={14} color={reportItems.some(i => isActive(i.tab)) ? "#3b2063" : "#a1a1aa"} />
              </span>
              <span className="flex-1">Reports</span>
              <ChevronDown size={12} className={`sa-sb-chevron ${reportsOpen ? "open" : ""}`} />
            </button>
            <div className={`sa-sb-accordion ${reportsOpen ? "open" : ""}`}>
              <div className="sa-sb-accordion-inner">
                {reportItems.map(({ tab, label }) => (
                  <button key={tab} onClick={() => goTo(tab)} className={`sa-sb-sub ${isActive(tab) ? "active" : ""}`}>{label}</button>
                ))}
              </div>
            </div>

            <div className="sa-sb-sec">System</div>
            <button onClick={() => goTo("settings")} className={`sa-sb-item ${isActive("settings") ? "active" : ""}`}>
              <span className="sa-sb-icon"><SettingsIcon size={14} color={iconColor("settings")} /></span>
              Settings
            </button>
          </div>

          {/* Desktop Bottom */}
          <div className="shrink-0 px-3 pb-4 pt-2 border-t border-zinc-100">
            <button className="sa-sb-item" style={{ color: "#71717a" }} onClick={() => window.open("mailto:support@luckyboba.com")}>
              <span className="sa-sb-icon"><HelpCircle size={14} color="#a1a1aa" /></span>
              Get Help
            </button>
            <div className="sa-sb-divider my-2" />
            <button onClick={() => setShowLogoutModal(true)} disabled={isLoggingOut} className="sa-sb-item" style={{ color: "#be2525" }}>
              {isLoggingOut ? (
                <>
                  <span className="sa-sb-icon">
                    <div className="relative w-3.5 h-3.5">
                      <div className="absolute inset-0 rounded-full border-[1.5px] border-red-200" />
                      <div className="sa-sb-spin absolute inset-0 rounded-full border-[1.5px] border-transparent border-t-[#be2525]" />
                    </div>
                  </span>
                  Logging out...
                </>
              ) : (
                <>
                  <span className="sa-sb-icon"><LogOut size={14} /></span>
                  Log out
                </>
              )}
            </button>
            <div className="mt-3 text-[9px] font-bold uppercase tracking-widest text-zinc-300 text-center">
              Lucky Boba 2026
            </div>
          </div>
        </aside>

        {/* ══════════════════════════════════════════════
            MOBILE — full-viewport slide-in panel
        ══════════════════════════════════════════════ */}
        {(sidebarOpen || isClosing) && (
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
                      <span style={{ fontSize: "1rem", fontWeight: 800, color: "#fff" }}>SA</span>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.65rem", color: "#a1a1aa", fontWeight: 500, marginBottom: 1 }}>Hello,</div>
                      <div style={{ fontSize: "1rem", fontWeight: 700, color: "#1a0f2e", lineHeight: 1.2 }}>Super Admin</div>
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
              <div className="sa-sb-scroll" style={{ flex: 1, minHeight: 0, padding: "8px 14px" }}>

                <div className="sa-sec">Home</div>
                <button onClick={() => goTo("overview")} className={`sa-item ${isActive("overview") ? "active" : ""}`}>
                  <span className="sa-item-icon"><LayoutDashboard size={18} color={iconColor("overview")} /></span>
                  Overview
                </button>

                <div className="sa-sec">Management</div>
                <button onClick={() => goTo("branches")} className={`sa-item ${isActive("branches") ? "active" : ""}`}>
                  <span className="sa-item-icon"><GitBranch size={18} color={iconColor("branches")} /></span>
                  Branches
                </button>
                <button onClick={() => goTo("users")} className={`sa-item ${isActive("users") ? "active" : ""}`}>
                  <span className="sa-item-icon"><Users size={18} color={iconColor("users")} /></span>
                  Users
                </button>
                <button onClick={() => goTo("promotions")} className={`sa-item ${isActive("promotions") ? "active" : ""}`}>
                  <span className="sa-item-icon"><Tag size={18} color={iconColor("promotions")} /></span>
                  Promotions
                </button>

                <div className="sa-sec">Analytics</div>
                <button onClick={() => toggleGroup("reports")} className="sa-group-btn">
                  <span className="sa-item-icon">
                    <BarChart2 size={18} color={reportItems.some(i => isActive(i.tab)) ? "#3b2063" : "#71717a"} />
                  </span>
                  <span style={{ flex: 1 }}>Reports</span>
                  <ChevronDown size={16} className={`sa-chevron ${reportsOpen ? "open" : ""}`} />
                </button>
                <div className={`sa-accordion ${reportsOpen ? "open" : ""}`}>
                  <div className="sa-accordion-inner">
                    {reportItems.map(({ tab, label }) => (
                      <button key={tab} onClick={() => goTo(tab)} className={`sa-sub ${isActive(tab) ? "active" : ""}`}>{label}</button>
                    ))}
                  </div>
                </div>

                <div className="sa-sec">System</div>
                <button onClick={() => goTo("settings")} className={`sa-item ${isActive("settings") ? "active" : ""}`}>
                  <span className="sa-item-icon"><SettingsIcon size={18} color={iconColor("settings")} /></span>
                  Settings
                </button>

              </div>

              {/* Bottom actions */}
              <div style={{ flexShrink: 0, padding: "8px 14px", paddingBottom: "max(24px, env(safe-area-inset-bottom))", borderTop: "1px solid #f0f0f2" }}>
                <button className="sa-item" style={{ color: "#71717a" }} onClick={() => window.open("mailto:support@luckyboba.com")}>
                  <span className="sa-item-icon"><HelpCircle size={18} color="#a1a1aa" /></span>
                  Get Help
                </button>
                <button onClick={() => setShowLogoutModal(true)} disabled={isLoggingOut} className="sa-logout">
                  {isLoggingOut ? (
                    <>
                      <span className="sa-item-icon">
                        <div style={{ position: "relative", width: 16, height: 16 }}>
                          <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "1.5px solid #fca5a5" }} />
                          <div className="sa-sb-spin" style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "1.5px solid transparent", borderTopColor: "#be2525" }} />
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
                  Lucky Boba 2026
                </div>
              </div>
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════
            MAIN CONTENT
        ══════════════════════════════════════════════ */}
        <main className="flex-1 flex flex-col overflow-hidden">

          {/* Mobile top nav bar */}
          <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shrink-0">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: "0.4rem", background: "#3b2063", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: "0.55rem", fontWeight: 800, color: "#fff" }}>SA</span>
              </div>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1a0f2e" }}>Lucky Boba</span>
            </div>
            <button onClick={() => setSidebarOpen(v => !v)} className="p-2 rounded-md text-[#3b2063] hover:bg-[#f5f3ff] transition-colors">
              <Menu size={20} strokeWidth={2} />
            </button>
          </div>

          {/* Page header */}
          <div className="shrink-0 flex items-center justify-between px-6 md:px-10 py-4 bg-white border-b border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 min-w-0">
              <h1 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#1a0f2e", letterSpacing: "-0.03em", margin: 0, whiteSpace: "nowrap" }}>
                {PAGE_TITLES[active]}
              </h1>
              <span className="hidden sm:inline-block" style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", background: "#f4f4f5", padding: "3px 8px", borderRadius: "0.375rem", color: "#a1a1aa", whiteSpace: "nowrap" }}>
                {new Date().toLocaleDateString("en-PH", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0 ml-4">
              <div className="hidden sm:flex items-center gap-2" style={{ fontSize: "0.65rem", color: "#71717a", whiteSpace: "nowrap" }}>
                <Clock size={12} />
                <span>Last updated: {new Date().toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "100px", padding: "4px 10px", flexShrink: 0 }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 5px rgba(34,197,94,0.6)", animation: "sa-pulse 2s infinite" }} />
                <span style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "#16a34a" }}>Live</span>
              </div>
            </div>
          </div>

          {/* Mobile last-updated sub-row */}
          <div className="sm:hidden flex items-center gap-1.5 px-6 py-1.5 bg-white border-b border-gray-100" style={{ fontSize: "0.65rem", color: "#71717a" }}>
            <Clock size={11} />
            <span>Last updated: {new Date().toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}</span>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto">{renderContent()}</div>
        </main>

        {/* ── Logout Confirmation Modal ── */}
        {showLogoutModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
            <div style={{ background: "#fff", width: "100%", maxWidth: 360, border: "1px solid #e4e4e7", borderRadius: "1.25rem", padding: 32, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", boxShadow: "0 24px 64px rgba(0,0,0,0.18)" }}>
              <div style={{ width: 44, height: 44, borderRadius: "0.625rem", background: "#fff0f0", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                <LogOut size={19} color="#be2525" />
              </div>
              <h3 style={{ color: "#1a0f2e", fontWeight: 700, fontSize: "1rem", margin: "0 0 8px", letterSpacing: "-0.01em" }}>End Session?</h3>
              <p style={{ color: "#71717a", fontSize: "0.85rem", fontWeight: 500, margin: "0 0 28px", lineHeight: 1.5 }}>
                Are you sure you want to log out of the terminal?
              </p>
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
      </div>
    </>
  );
};

export default SuperAdminDashboard;