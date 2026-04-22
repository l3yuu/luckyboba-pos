"use client"

import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, Clock, MapPin, AlertTriangle, ShoppingCart, Wallet, RefreshCw } from 'lucide-react';
import logo from '../../assets/logo.png';
import api from "../../services/api";

// ── Notification Types ────────────────────────────────────────────────────────
type Severity = 'critical' | 'warning' | 'info';
type NotifType = 'low_stock' | 'void' | 'cash_in' | 'purchase_order';

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  message: string;
  severity: Severity;
  at: string;
  branch_name?: string;
}

const SEVERITY_CONFIG: Record<Severity, { bg: string; border: string; icon: string; dot: string }> = {
  critical: { bg: 'bg-red-50', border: 'border-red-100', icon: 'text-red-600', dot: 'bg-red-500' },
  warning: { bg: 'bg-amber-50', border: 'border-amber-100', icon: 'text-amber-600', dot: 'bg-amber-500' },
  info: { bg: 'bg-violet-50', border: 'border-violet-100', icon: 'text-violet-600', dot: 'bg-violet-400' },
};

const TYPE_ICON: Record<NotifType, React.ReactNode> = {
  low_stock: <AlertTriangle size={14} strokeWidth={2.5} />,
  void: <ShoppingCart size={14} strokeWidth={2.5} />,
  cash_in: <Wallet size={14} strokeWidth={2.5} />,
  purchase_order: <RefreshCw size={14} strokeWidth={2.5} />,
};

function timeAgo(iso: string): string {
  try {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  } catch { return '...'; }
}

const TOP_NAV_STYLES = `
  @keyframes sa-topbar-rise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes sa-topbar-pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.7; transform: scale(0.9); } }
  .notif-pulse { animation: sa-topbar-pulse 2s infinite; }
`;

interface BranchManagerTopNavProps {
  pageTitle:    string;
  pageDesc?:    string;
  branchLabel:  string | null;
  onMenuClick?: () => void;
}

const BranchManagerTopNav: React.FC<BranchManagerTopNavProps> = ({
  pageTitle,
  pageDesc,
  branchLabel,
  onMenuClick,
}) => {
  const [time, setTime] = useState(new Date());

  // ── Notification State ──────────────────────────────────────────────────────
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotifOpen, setNotifOpen] = useState(false);
  const [hasNew, setHasNew] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [prevCount, setPrevCount] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);

  // ── Fetch Logic ─────────────────────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    setFetching(true);
    try {
      const { data } = await api.get<{ count: number; notifications: Notification[] }>(
        '/notifications/summary'
      );
      const newNotifs = data.notifications ?? [];
      setNotifications(newNotifs);
      setLastFetched(new Date());

      if (newNotifs.length > prevCount) {
        setHasNew(true);
      }
      setPrevCount(newNotifs.length);
    } catch {
      // Silently fail
    } finally {
      setFetching(false);
    }
  }, [prevCount]);

  useEffect(() => {
    fetchNotifications();
    const t = setInterval(() => setTime(new Date()), 1000);
    const n = setInterval(() => fetchNotifications(), 30000); // 30s interval
    return () => {
      clearInterval(t);
      clearInterval(n);
    };
  }, [fetchNotifications]);

  // ── Click Outside ───────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleBellClick = () => {
    setNotifOpen((prev: boolean) => !prev);
    setHasNew(false);
  };

  return (
    <>
      <style>{TOP_NAV_STYLES}</style>
      <div className="shrink-0 flex items-center justify-between px-6 md:px-10 py-4 bg-white border-b border-gray-200 shadow-sm min-h-18">

        {/* ── Left ── */}
        <div className="flex items-center gap-3 min-w-0">

          {/* Mobile: logo + hamburger (replaces the old separate header) */}
          <div className="flex items-center gap-2 md:hidden shrink-0">
            <img src={logo} alt="Lucky Boba" className="h-7 w-auto object-contain" />
            {onMenuClick && (
              <button
                onClick={onMenuClick}
                className="p-2 rounded-[0.4rem] text-[#a020f0] hover:bg-[#f5f3ff] transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="6"  x2="21" y2="6"  />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>
            )}
          </div>

          {/* Page title + description */}
          <div className="min-w-0">
            <h1 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1a0f2e', letterSpacing: '-0.03em', margin: 0 }}>
              {pageTitle}
            </h1>
            {pageDesc && (
              <p style={{ fontSize: '0.65rem', fontWeight: 400, color: '#71717a', margin: 0 }}
                className="hidden sm:block truncate">
                {pageDesc}
              </p>
            )}
          </div>

          {/* Date badge */}
          <span
            className="hidden sm:inline-block shrink-0"
            style={{
              fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.16em',
              textTransform: 'uppercase', color: '#3f3f46',
              background: '#f4f4f5', padding: '3px 8px', borderRadius: '0.375rem',
            }}
          >
            {time.toLocaleDateString('en-PH', {
              weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
            })}
          </span>

          {/* Branch pill */}
          <span
            className="hidden sm:inline-flex items-center gap-1.5 shrink-0"
            style={{
              fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em',
              textTransform: 'uppercase', background: '#ede9fe', color: '#a020f0',
              border: '1px solid #ddd6f7', borderRadius: '100px', padding: '3px 9px',
            }}
          >
            <MapPin size={9} strokeWidth={2.5} />
            {branchLabel ?? 'Branch Manager'}
          </span>
        </div>

        {/* ── Right: clock + bell + live badge ── */}
        <div className="flex items-center gap-3 shrink-0">

          {/* Live clock */}
          <div
            className="hidden sm:flex items-center gap-2"
            style={{ fontSize: '0.65rem', fontWeight: 400, color: '#71717a' }}
          >
            <Clock size={12} />
            <span>
              Last updated:{' '}
              {time.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Bell Center */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={handleBellClick}
              className={`relative p-2 rounded-[0.4rem] transition-all ${isNotifOpen
                  ? 'bg-[#a020f0] text-white'
                  : 'text-zinc-500 hover:bg-zinc-100 hover:text-[#a020f0]'
                }`}
            >
              <Bell size={15} strokeWidth={isNotifOpen ? 2.5 : 2} />

              {/* Badge dot / count */}
              {notifications.length > 0 && (
                <span className={`absolute top-1 right-1 flex items-center justify-center min-w-[0.5rem] h-2 px-0.5 bg-red-500 rounded-full border border-white text-[6px] font-bold text-white ${hasNew ? 'notif-pulse' : ''}`}>
                  {notifications.length > 9 ? '9+' : notifications.length}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {isNotifOpen && (
              <div
                className="absolute right-0 mt-3 w-80 bg-white border border-gray-100 shadow-2xl z-[100] overflow-hidden rounded-[0.75rem]"
                style={{ animation: 'sa-topbar-rise 0.2s ease-out' }}
              >
                {/* Dropdown Header */}
                <div className="bg-[#a020f0] px-5 py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-white text-[0.7rem] font-bold uppercase tracking-widest">Alerts</span>
                    {fetching && (
                      <RefreshCw size={10} className="text-white/50 animate-spin" />
                    )}
                  </div>
                  <span className="bg-white/10 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">
                    {notifications.length} Active
                  </span>
                </div>

                {/* Dropdown Body */}
                <div className="max-h-[320px] overflow-y-auto divide-y divide-gray-50">
                  {notifications.length > 0 ? (
                    notifications.map((notif: Notification) => {
                      const cfg = SEVERITY_CONFIG[notif.severity as Severity];
                      return (
                        <div
                          key={notif.id}
                          className={`flex gap-3 p-4 hover:bg-gray-50 transition-colors cursor-pointer ${cfg.bg.replace('bg-', 'bg-opacity-40 bg-')}`}
                        >
                          <div className={`w-8 h-8 rounded-[0.5rem] flex items-center justify-center shrink-0 border ${cfg.border} ${cfg.bg}`}>
                            <span className={cfg.icon}>{TYPE_ICON[notif.type as NotifType]}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-[0.8rem] font-bold truncate ${notif.severity === 'critical' ? 'text-red-600' : 'text-[#1a0f2e]'}`}>
                                {notif.title}
                              </p>
                              <span className="text-[9px] font-medium text-gray-400 shrink-0 mt-0.5">
                                {timeAgo(notif.at)}
                              </span>
                            </div>
                            <p className="text-[0.72rem] text-gray-500 leading-normal mt-0.5 line-clamp-2">
                              {notif.message}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-12 flex flex-col items-center justify-center text-center px-6">
                      <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                        <Bell size={20} className="text-gray-300" />
                      </div>
                      <p className="text-[0.75rem] font-bold text-gray-400 uppercase tracking-widest">All Clear</p>
                      <p className="text-[0.65rem] text-gray-300 mt-1">No pending alerts for your branch.</p>
                    </div>
                  )}
                </div>

                {/* Dropdown Footer */}
                <div className="px-4 py-2.5 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between">
                  {lastFetched && (
                    <span className="text-[8px] font-medium text-gray-400 uppercase tracking-widest">
                      Updated {timeAgo(lastFetched.toISOString())}
                    </span>
                  )}
                  <button
                    onClick={() => fetchNotifications()}
                    disabled={fetching}
                    className="flex items-center gap-1.5 text-[9px] font-bold text-[#a020f0] uppercase tracking-widest hover:opacity-70 transition-opacity"
                  >
                    <RefreshCw size={9} className={fetching ? 'animate-spin' : ''} />
                    Refresh
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Live badge */}
          <div
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: '#f0fdf4', border: '1px solid #bbf7d0',
              borderRadius: '100px', padding: '4px 10px',
            }}
          >
            <div
              className="bm-topbar-pulse"
              style={{
                width: 5, height: 5, borderRadius: '50%',
                background: '#22c55e', boxShadow: '0 0 5px rgba(34,197,94,0.6)',
              }}
            />
            <span
              style={{
                fontSize: '0.55rem', fontWeight: 700,
                letterSpacing: '0.16em', textTransform: 'uppercase', color: '#16a34a',
              }}
            >
              Live
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default BranchManagerTopNav;
