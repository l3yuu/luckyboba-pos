"use client"

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Store, User, Lock, Bell, AlertTriangle,
  ShoppingCart, Wallet, RefreshCw, WifiOff,
} from 'lucide-react';
import api from '../../services/api';

// ── Types ─────────────────────────────────────────────────────────────────────

type Severity = 'critical' | 'warning' | 'info';
type NotifType = 'low_stock' | 'void' | 'cash_in' | 'purchase_order';

interface Notification {
  id:       string;
  type:     NotifType;
  title:    string;
  message:  string;
  severity: Severity;
  at:       string;
}

interface TopNavbarProps {
  isEodLocked?: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const SEVERITY_CONFIG: Record<Severity, { bg: string; border: string; icon: string; dot: string }> = {
  critical: { bg: 'bg-red-50',    border: 'border-red-200',    icon: 'text-red-600',    dot: 'bg-red-500'    },
  warning:  { bg: 'bg-amber-50',  border: 'border-amber-200',  icon: 'text-amber-600',  dot: 'bg-amber-500'  },
  info:     { bg: 'bg-violet-50', border: 'border-violet-200', icon: 'text-violet-600', dot: 'bg-violet-400' },
};

const TYPE_ICON: Record<NotifType, React.ReactNode> = {
  low_stock:      <AlertTriangle size={14} strokeWidth={2.5} />,
  void:           <ShoppingCart  size={14} strokeWidth={2.5} />,
  cash_in:        <Wallet        size={14} strokeWidth={2.5} />,
  purchase_order: <RefreshCw     size={14} strokeWidth={2.5} />,
};

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)   return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ── Component ─────────────────────────────────────────────────────────────────

const TopNavbar: React.FC<TopNavbarProps> = ({ isEodLocked }) => {
  const [isNotifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // ── Notification state ────────────────────────────────────────────────────
  const [notifications, setNotifications]   = useState<Notification[]>([]);
  const [,     setPrevCount]       = useState(0);
  const [hasNew,        setHasNew]          = useState(false);
  const [isOffline,     setIsOffline]       = useState(!navigator.onLine);
  const [lastFetched,   setLastFetched]     = useState<Date | null>(null);
  const [fetching,      setFetching]        = useState(false);

  // ── Cashier info ──────────────────────────────────────────────────────────
  const [cashierInfo, setCashierInfo] = useState({
    name: (typeof window !== 'undefined' ? (localStorage.getItem('lucky_boba_user_name') ?? 'SYSTEM ADMIN') : 'SYSTEM ADMIN').toUpperCase(),
    role: (typeof window !== 'undefined' ? (localStorage.getItem('lucky_boba_user_role') ?? '') : '').toUpperCase(),
    branch: (typeof window !== 'undefined' ? (localStorage.getItem('lucky_boba_user_branch') ?? 'MAIN BRANCH') : 'MAIN BRANCH').toUpperCase(),
    shift: '',
  });

  // Sync cashierInfo when localStorage changes (e.g., after a POS sync)
  useEffect(() => {
    const syncInfo = () => {
      setCashierInfo(prev => ({
        ...prev,
        name: (localStorage.getItem('lucky_boba_user_name') ?? 'SYSTEM ADMIN').toUpperCase(),
        role: (localStorage.getItem('lucky_boba_user_role') ?? '').toUpperCase(),
        branch: (localStorage.getItem('lucky_boba_user_branch') ?? 'MAIN BRANCH').toUpperCase(),
      }));
    };

    window.addEventListener('storage', (e) => {
      if (e.key === 'lucky_boba_user_branch' || e.key === 'lucky_boba_user_name') {
        syncInfo();
      }
    });

    // Also poll slightly or just rely on the sync events from other components
    // for local-tab changes, we can use a custom event if needed, but storage event 
    // handles cross-tab, and local state handles local tab if we trigger it.
    
    const fetchShiftInfo = async () => {
      try {
        const response = await api.get<{ hasCashedIn: boolean; shiftName?: string }>('/cash-transactions/status');
        if (response.data.shiftName) {
          setCashierInfo(prev => ({ ...prev, shift: response.data.shiftName || '' }));
        }
      } catch { /* ignore */ }
    };

    fetchShiftInfo();
    const shiftInterval = setInterval(fetchShiftInfo, 60_000); // Check shift every minute

    window.addEventListener('cash-in-completed', fetchShiftInfo);
    
    return () => {
      window.removeEventListener('storage', syncInfo);
      window.removeEventListener('cash-in-completed', fetchShiftInfo);
      clearInterval(shiftInterval);
    };
  }, []);

  // ── Fetch notifications ───────────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    if (!navigator.onLine) { setIsOffline(true); return; }
    setIsOffline(false);
    setFetching(true);
    try {
      const { data } = await api.get<{ count: number; notifications: Notification[] }>(
        '/notifications/summary'
      );
      setNotifications(data.notifications ?? []);
      setLastFetched(new Date());

      // Badge pulse only when count increases
      setPrevCount(prev => {
        if ((data.count ?? 0) > prev) setHasNew(true);
        return data.count ?? 0;
      });
    } catch {
      // Silently fail — keep showing last known notifications
    } finally {
      setFetching(false);
    }
  }, []);

  // ── Poll every 30 s ───────────────────────────────────────────────────────
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // ── Online / offline detection ────────────────────────────────────────────
  useEffect(() => {
    const goOnline  = () => { setIsOffline(false); fetchNotifications(); };
    const goOffline = () => setIsOffline(true);
    window.addEventListener('online',  goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online',  goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, [fetchNotifications]);

  // ── Click outside to close ────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node))
        setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const totalCount = notifications.length + (isEodLocked ? 1 : 0);

  const handleBellClick = () => {
    setNotifOpen(prev => !prev);
    setHasNew(false);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <header className="flex-none bg-white border-b border-zinc-200 px-2 sm:px-6 py-1.5 sm:py-3.5 flex items-center justify-between z-20 shadow-sm">

      {/* ── LEFT: Info Pills ── */}
      <div className="flex items-center gap-1 sm:gap-2.5">

        {/* Branch */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 bg-[#f5f0ff] border border-[#e9d5ff] px-1.5 sm:px-4 py-1 sm:py-2.5 rounded-[0.625rem]">
          <div className="w-7 h-7 bg-[#6a12b8] flex items-center justify-center shrink-0 rounded-[0.625rem]">
            <Store size={13} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <div className="hidden md:block text-[9px] font-bold text-[#6a12b8]/50 uppercase tracking-widest leading-none">Branch</div>
            <div className="text-[10px] sm:text-[11px] font-black text-[#6a12b8] uppercase leading-tight mt-0.5">{cashierInfo.branch}</div>
          </div>
        </div>

        {/* Cashier */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 bg-[#fff7ed] border border-[#fed7aa] px-1.5 sm:px-4 py-1 sm:py-2.5 rounded-[0.625rem]">
          <div className="w-7 h-7 bg-[#f97316] flex items-center justify-center shrink-0 rounded-[0.625rem]">
            <User size={13} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <div className="hidden md:block text-[9px] font-bold text-[#f97316]/50 uppercase tracking-widest leading-none">Cashier</div>
            <div className="text-[10px] sm:text-[11px] font-black text-[#c2410c] uppercase leading-tight mt-0.5 truncate max-w-[60px] sm:max-w-none">{cashierInfo.name}</div>
          </div>
        </div>

        {/* Shift */}
        {cashierInfo.shift && (
          <div className="flex items-center gap-1.5 sm:gap-2.5 bg-blue-50 border border-blue-200 px-1.5 sm:px-4 py-1 sm:py-2.5 rounded-[0.625rem]">
            <div className="w-7 h-7 bg-blue-600 flex items-center justify-center shrink-0 rounded-[0.625rem]">
              <RefreshCw size={13} className="text-white" strokeWidth={2.5} />
            </div>
            <div>
              <div className="hidden md:block text-[9px] font-bold text-blue-600/50 uppercase tracking-widest leading-none">Shift</div>
              <div className="text-[10px] sm:text-[11px] font-black text-blue-600 uppercase leading-tight mt-0.5">{cashierInfo.shift}</div>
            </div>
          </div>
        )}

        {/* EOD Locked Badge */}
        {isEodLocked && (
          <div className="flex items-center gap-1.5 px-2 sm:px-4 py-1 sm:py-2.5 bg-red-50 border border-red-200 rounded-[0.625rem]">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
            <div className="flex items-center gap-1.5">
              <Lock size={11} className="text-red-600" strokeWidth={2.5} />
              <span className="text-[11px] font-bold text-red-600 uppercase tracking-widest">Terminal Locked</span>
            </div>
          </div>
        )}

        {/* Offline Badge */}
        {isOffline && (
          <div className="flex items-center gap-1.5 px-2 sm:px-4 py-1 sm:py-2.5 bg-zinc-100 border border-zinc-300 rounded-[0.625rem]">
            <WifiOff size={11} className="text-zinc-500" strokeWidth={2.5} />
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Offline</span>
          </div>
        )}
      </div>

      {/* ── RIGHT: Bell ── */}
      <div className="relative" ref={notifRef}>
        <button
          onClick={handleBellClick}
          className={`relative w-10 h-10 flex items-center justify-center border transition-all rounded-[0.625rem] ${
            isNotifOpen
              ? 'bg-[#6a12b8] border-[#6a12b8] text-white'
              : 'bg-zinc-50 border-zinc-200 text-zinc-400 hover:border-[#6a12b8] hover:text-[#6a12b8] hover:bg-[#f5f0ff]'
          }`}
        >
          {/* Badge dot */}
          {totalCount > 0 && (
            <span className={`absolute -top-1 -right-1 min-w-4.5 h-4.5 px-1 flex items-center justify-center rounded-full text-[9px] font-black text-white border-2 border-white transition-all
              ${hasNew ? 'animate-bounce bg-red-500' : 'bg-red-500'}`}>
              {totalCount > 9 ? '9+' : totalCount}
            </span>
          )}
          <Bell size={17} strokeWidth={2} />
        </button>

        {/* ── Dropdown ── */}
        {isNotifOpen && (
          <div className="absolute right-0 mt-2 w-80 bg-white border border-zinc-200 shadow-xl z-50 overflow-hidden rounded-[0.625rem]">

            {/* Header */}
            <div className="bg-[#6a12b8] px-5 py-4 flex items-center justify-between">
              <p className="text-white text-sm font-bold uppercase tracking-widest">Notifications</p>
              <div className="flex items-center gap-2">
                {fetching && (
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                <span className="bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 uppercase tracking-widest rounded-[0.625rem]">
                  {totalCount} new
                </span>
              </div>
            </div>

            {/* Items */}
            <div className="max-h-72 overflow-y-auto divide-y divide-zinc-100 bg-white">

              {/* EOD locked — always first if active */}
              {isEodLocked && (
                <div className="flex gap-3 p-4 bg-red-50 cursor-pointer">
                  <div className="w-8 h-8 bg-red-100 border border-red-200 flex items-center justify-center shrink-0 mt-0.5 rounded-[0.625rem]">
                    <Lock size={14} className="text-red-600" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-red-600">Terminal Locked</p>
                    <p className="text-[11px] font-medium text-zinc-400 mt-0.5 leading-relaxed">
                      End of Day count submitted. No new orders can be placed.
                    </p>
                  </div>
                </div>
              )}

              {/* Dynamic notifications from API */}
              {notifications.length > 0 ? notifications.map(notif => {
                const cfg  = SEVERITY_CONFIG[notif.severity];
                const icon = TYPE_ICON[notif.type];
                return (
                  <div key={notif.id} className={`flex gap-3 p-4 hover:brightness-95 transition-all cursor-pointer ${cfg.bg}`}>
                    <div className={`w-8 h-8 flex items-center justify-center shrink-0 mt-0.5 rounded-[0.625rem] border ${cfg.border} ${cfg.bg}`}>
                      <span className={cfg.icon}>{icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-bold ${notif.severity === 'critical' ? 'text-red-600' : notif.severity === 'warning' ? 'text-amber-700' : 'text-[#1a0f2e]'}`}>
                          {notif.title}
                        </p>
                        <span className="text-[9px] font-semibold text-zinc-400 shrink-0 mt-0.5">
                          {timeAgo(notif.at)}
                        </span>
                      </div>
                      <p className="text-[11px] font-medium text-zinc-400 mt-0.5 leading-relaxed">
                        {notif.message}
                      </p>
                    </div>
                  </div>
                );
              }) : !isEodLocked && (
                <div className="py-10 flex flex-col items-center gap-2 text-zinc-300">
                  <Bell size={28} strokeWidth={1.5} />
                  <p className="text-[11px] font-bold uppercase tracking-widest">All clear</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between gap-2">
              {lastFetched && (
                <span className="text-[9px] font-semibold text-zinc-400 uppercase tracking-widest">
                  Updated {timeAgo(lastFetched.toISOString())}
                </span>
              )}
              <button
                onClick={() => { fetchNotifications(); }}
                disabled={fetching || isOffline}
                className="ml-auto flex items-center gap-1.5 py-2 px-3 bg-white border border-zinc-200 text-[10px] font-bold text-zinc-500 uppercase tracking-widest hover:border-[#6a12b8] hover:text-[#6a12b8] hover:bg-[#f5f0ff] transition-all rounded-[0.625rem] disabled:opacity-40"
              >
                <RefreshCw size={10} className={fetching ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default TopNavbar;
