import { useState, useEffect } from "react";
import {
  LayoutGrid, GitBranch, Users, BarChart2, Settings,
  LogOut, HelpCircle, ShieldCheck, Tag, ChevronDown,
} from "lucide-react";

export type TabId =
  | "overview" | "branches" | "users" | "reports"
  | "audit"    | "promotions" | "settings";

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

const NAV_ITEMS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "overview",   label: "Overview",               icon: <LayoutGrid  size={14} /> },
  { id: "branches",   label: "Branch Management",      icon: <GitBranch   size={14} /> },
  { id: "users",      label: "User Management",        icon: <Users       size={14} /> },
  { id: "reports",    label: "Cross-Branch Reports",   icon: <BarChart2   size={14} /> },
  { id: "audit",      label: "Audit Logs",             icon: <ShieldCheck size={14} /> },
  { id: "promotions", label: "Promotions & Discounts", icon: <Tag         size={14} /> },
];

const ROLE_LABELS: Record<string, string> = {
  superadmin:     "Super Admin",
  system_admin:   "System Admin",
  branch_manager: "Branch Manager",
  cashier:        "Cashier",
};

const getToken = () =>
  localStorage.getItem("auth_token") ||
  localStorage.getItem("lucky_boba_token") || "";

const SuperAdminSidebar: React.FC<SuperAdminSidebarProps> = ({
  open, setOpen, active, setActive, onLogout, isLoggingOut: externalLoggingOut,
}) => {
  const [showLogoutModal,    setShowLogoutModal]    = useState(false);
  const [internalLoggingOut, setInternalLoggingOut] = useState(false);
  const [authUser,           setAuthUser]           = useState<AuthUser | null>(null);

  const isLoggingOut = externalLoggingOut ?? internalLoggingOut;

  // ── Fetch logged-in user ───────────────────────────────────────────────────
  useEffect(() => {
    const fetchMe = async () => {
      try {
        const token = getToken();
        const res   = await fetch("/api/user", {
          headers: {
            "Accept":        "application/json",
            "Content-Type":  "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!res.ok) return;
        const data = await res.json();
        // handles both { data: { ... } } and flat { id, name, ... }
        const u = data.data ?? data;
        setAuthUser({
          id:     u.id,
          name:   u.name,
          email:  u.email,
          role:   u.role,
          branch: u.branch ?? u.branch_name ?? null,
        });
      } catch {
        // silently fail — sidebar still works without user info
      }
    };
    fetchMe();
  }, []);

  const go = (id: TabId) => {
    setActive(id);
    if (window.innerWidth < 768) setOpen(false);
  };

  const handleLogoutClick   = () => setShowLogoutModal(true);
  const handleLogoutConfirm = async () => {
    setShowLogoutModal(false);
    if (onLogout) { onLogout(); return; }
    setInternalLoggingOut(true);
    ["auth_token", "lucky_boba_token", "token", "user_role", "lucky_boba_authenticated"]
      .forEach(k => localStorage.removeItem(k));
    sessionStorage.clear();
    window.location.href = "/login";
  };

  // ── Avatar initials ────────────────────────────────────────────────────────
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
        {/* Brand */}
        <div className="shrink-0 px-4 pt-6 pb-4 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[0.4rem] bg-[#3b2063] flex items-center justify-center shrink-0">
              <span className="text-[0.55rem] font-black text-white tracking-wide">SA</span>
            </div>
            <div>
              <p className="text-[0.85rem] font-bold text-[#1a0f2e] leading-tight">Lucky Boba</p>
              <p className="text-[0.58rem] font-bold uppercase tracking-widest text-zinc-400">Super Admin</p>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <div className="flex-1 overflow-y-auto px-3 py-2 min-h-0" style={{ scrollbarWidth: "none" }}>
          <p className="px-2 pt-4 pb-1 text-[0.58rem] font-bold uppercase tracking-widest text-zinc-400">
            Navigation
          </p>
          {NAV_ITEMS.map(t => (
            <button
              key={t.id}
              onClick={() => go(t.id)}
              className={`sa-tab flex items-center gap-2 w-full px-2.5 py-1.5 text-[0.8rem] font-medium text-zinc-500 mb-0.5 text-left relative ${active === t.id ? "active" : ""}`}
            >
              <span className={`shrink-0 ${active === t.id ? "text-[#3b2063]" : "text-zinc-400"}`}>
                {t.icon}
              </span>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Logged-in user card ─────────────────────────────────────────── */}
        <div className="shrink-0 px-3 py-3 mx-3 mb-2 bg-[#f9f8ff] border border-violet-100 rounded-xl">
          {authUser ? (
            <div className="flex items-center gap-2.5">
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-[#3b2063] flex items-center justify-center shrink-0">
                <span className="text-[0.6rem] font-bold text-white">{initials}</span>
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-[0.75rem] font-bold text-[#1a0f2e] truncate leading-tight">
                  {authUser.name}
                </p>
                <p className="text-[0.6rem] font-semibold text-violet-500 truncate">
                  {ROLE_LABELS[authUser.role] ?? authUser.role}
                </p>
              </div>
              <ChevronDown size={12} className="text-zinc-300 shrink-0" />
            </div>
          ) : (
            // Skeleton while loading
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-zinc-200 animate-pulse shrink-0" />
              <div className="flex-1 flex flex-col gap-1.5">
                <div className="h-2.5 bg-zinc-200 rounded animate-pulse w-3/4" />
                <div className="h-2 bg-zinc-100 rounded animate-pulse w-1/2" />
              </div>
            </div>
          )}

          {/* Email row */}
          {authUser && (
            <p className="mt-1.5 text-[0.58rem] text-zinc-400 font-medium truncate pl-10.5">
              {authUser.email}
            </p>
          )}
        </div>

        {/* Bottom actions */}
        <div className="shrink-0 px-3 pb-4 pt-2 border-t border-zinc-100">
          <button
            onClick={() => go("settings")}
            className={`sa-tab flex items-center gap-2 w-full px-2.5 py-1.5 text-[0.8rem] font-medium text-zinc-500 mb-0.5 text-left relative ${active === "settings" ? "active" : ""}`}
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
            onClick={handleLogoutClick}
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
            {/* Show who is logged in inside the modal too */}
            {authUser && (
              <div className="w-full mb-5 flex items-center gap-3 p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-left">
                <div className="w-8 h-8 rounded-full bg-[#3b2063] flex items-center justify-center shrink-0">
                  <span className="text-[0.6rem] font-bold text-white">{initials}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#1a0f2e] truncate">{authUser.name}</p>
                  <p className="text-[10px] text-zinc-400 truncate">{authUser.email}</p>
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