import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, Clock, MapPin, AlertTriangle, ShoppingCart, Wallet, RefreshCw } from "lucide-react";
import api from "../../services/api";

type Severity = 'critical' | 'warning' | 'info';
type NotifType = 'low_stock' | 'void' | 'cash_in' | 'purchase_order';

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  message: string;
  severity: Severity;
  at: string;
}

const SEVERITY_CONFIG: Record<Severity, { iconClass: string }> = {
  critical: { iconClass: 'text-red-500' },
  warning:  { iconClass: 'text-amber-500' },
  info:     { iconClass: 'text-zinc-500' },
};

const TYPE_ICON: Record<NotifType, React.ReactNode> = {
  low_stock: <AlertTriangle size={15} strokeWidth={2} />,
  void: <ShoppingCart size={15} strokeWidth={2} />,
  cash_in: <Wallet size={15} strokeWidth={2} />,
  purchase_order: <RefreshCw size={15} strokeWidth={2} />,
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

// ── Types ─────────────────────────────────────────────────────────────────────
export interface OpsTopBarProps {
  activeTab:   string;
  onMenuClick: () => void;
  branchLabel?: string | null;
  roleLabel:   string; // "Supervisor" or "Team Leader"
  onNavigate?: (tab: string) => void;
}

// ── Page Titles ───────────────────────────────────────────────────────────────
const PAGE_TITLES: Record<string, { label: string; desc: string }> = {
  dashboard:        { label: "Operations Overview", desc: "Live shift performance and sales metrics" },
  users:            { label: "Staff Overview",      desc: "Live cashier activity and performance"    },
  "void-logs":      { label: "Void Journal",        desc: "Audit trail for cancelled transactions"  },
  "sales-dashboard": { label: "Sales Analytics",     desc: "Detailed revenue and order breakdown"     },
  "items-report":    { label: "Items Report",        desc: "Product movement and quantity sold"       },
  "x-reading":       { label: "X-Reading",           desc: "Mid-day POS shift summary"                },
  "z-reading":       { label: "Z-Reading",           desc: "End-of-day POS closing report"            },
  "inventory-list":  { label: "Stock Levels",        desc: "Current branch inventory status"          },
  "item-checker":    { label: "Item Checker",        desc: "Verify product details and availability"  },
};

// ── Animations ────────────────────────────────────────────────────────────────
const STYLES = `
  @keyframes ops-topbar-pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
  .ops-topbar-pulse { animation: ops-topbar-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
  .ops-topbar-header { background: #6a12b8; }
`;

// ── Component ─────────────────────────────────────────────────────────────────
const OpsTopBar: React.FC<OpsTopBarProps> = ({
  activeTab, onMenuClick, branchLabel, roleLabel, onNavigate
}) => {
  const [time, setTime] = useState(new Date());

  // ── Notification State ───────────────────────────────────────────────────────
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotifOpen, setNotifOpen] = useState(false);
  const [hasNew, setHasNew] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [prevCount, setPrevCount] = useState(0);

  const notifRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    setFetching(true);
    try {
      const { data } = await api.get<{ count: number; notifications: Notification[] }>('/notifications/summary');
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
    const n = setInterval(() => fetchNotifications(), 30000);
    return () => {
      clearInterval(t);
      clearInterval(n);
    };
  }, [fetchNotifications]);

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
    setNotifOpen(prev => !prev);
    setHasNew(false);
  };

  const page = PAGE_TITLES[activeTab] ?? { 
    label: activeTab.replace(/-/g,' ').replace(/\b\w/g, c => c.toUpperCase()), 
    desc: "" 
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="shrink-0 h-[72px] flex items-center justify-between px-8 ops-topbar-header border-b border-black/10 relative z-10">
        
        {/* ── Left: hamburger + title + date badge + branch pill ── */}
        <div className="flex items-center gap-5 min-w-0">
          
          {/* Mobile hamburger */}
          <button
            onClick={onMenuClick}
            className="md:hidden p-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all shrink-0"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6"  x2="21" y2="6"  />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          
          {/* Page title area */}
          <div className="min-w-0">
            <div className="flex items-center gap-3">
               <h1 style={{ fontSize: '1rem', fontWeight: 850, color: '#ffffff', letterSpacing: '-0.02em', margin: 0, flexShrink: 0, lineHeight: 1 }}>
                {page.label}
              </h1>
              <div className="hidden lg:flex items-center px-2 py-0.5 rounded-full bg-white/10 border border-white/10 backdrop-blur-md">
                <span style={{ fontSize: '0.48rem', fontWeight: 900, color: '#f3e8ff', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{roleLabel} Console</span>
              </div>
            </div>
            <p style={{ fontSize: '0.65rem', fontWeight: 600, color: '#ddd5ff', margin: '4px 0 0 0' }}
              className="hidden sm:block truncate opacity-80 max-w-[400px] uppercase tracking-wide">
              {page.desc}
            </p>
          </div>

          {/* Date & Branch Pill */}
          <div className="hidden xl:flex items-center gap-2">
            <span
              className="shrink-0"
              style={{
                fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.12em',
                textTransform: 'uppercase', color: '#ffffff',
                background: '#ffffff15', padding: '3px 8px', borderRadius: '100px',
                border: '1px solid #ffffff20'
              }}
            >
              {time.toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>

            {branchLabel && (
              <span
                className="inline-flex items-center gap-1.5 shrink-0"
                style={{
                  fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.1em',
                  textTransform: 'uppercase', background: '#ffffff15', color: '#ffffff',
                  border: '1px solid #ffffff20', borderRadius: '100px', padding: '3px 8px',
                }}
              >
                <MapPin size={9} strokeWidth={2.5} />
                {branchLabel}
              </span>
            )}
          </div>
        </div>

        {/* ── Right: clock + bell + live badge ── */}
        <div className="flex items-center gap-4 shrink-0">

          {/* Live clock */}
          <div
            className="hidden lg:flex items-center gap-2"
            style={{ fontSize: '0.68rem', fontWeight: 600, color: '#ddd5ff' }}
          >
            <Clock size={12} strokeWidth={2.5} />
            <span className="tabular-nums">
              {time.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Bell */}
          <div className="relative" ref={notifRef}>
            <button 
              onClick={handleBellClick}
              className={`relative p-2 rounded-[0.5rem] transition-all border ${
                isNotifOpen 
                  ? 'bg-white text-[#6a12b8] border-white shadow-lg' 
                  : 'bg-[#ffffff10] text-[#ffffff90] border-[#ffffff10] hover:bg-[#ffffff20]'
              }`}
            >
              <Bell size={14} className={isNotifOpen ? 'text-[#6a12b8]' : 'text-[#ffffff90]'} />
              
              {notifications.length > 0 && (
                <span className={`absolute -top-1 -right-1 flex flex-col items-center justify-center min-w-[1rem] h-[1rem] px-[3px] bg-amber-400 rounded-full border-[1.5px] border-[#6a12b8] text-[9px] font-black text-[#1a0f2e] ${hasNew ? 'ops-topbar-pulse' : ''} ${isNotifOpen ? 'border-white' : ''}`}>
                  {notifications.length > 9 ? '9+' : notifications.length}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {isNotifOpen && (
              <div className="absolute right-0 mt-3 w-[340px] bg-white shadow-[0_12px_40px_-5px_rgba(0,0,0,0.12)] border border-black/[0.04] z-[100] overflow-hidden rounded-[1rem]">
                {/* Header */}
                <div className="px-5 py-4 flex items-center justify-between border-b border-black/[0.03]">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[#1a0f2e] text-[0.8rem] font-bold tracking-tight">Alerts</span>
                    {fetching && <RefreshCw size={11} className="text-zinc-400 animate-spin" />}
                  </div>
                  {notifications.length > 0 && (
                    <span className="bg-zinc-100 text-zinc-500 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">
                      {notifications.length} New
                    </span>
                  )}
                </div>

                {/* Body */}
                <div className="max-h-[360px] overflow-y-auto divide-y divide-black/[0.02]">
                  {notifications.length > 0 ? (
                    notifications.map(notif => {
                      const cfg = SEVERITY_CONFIG[notif.severity];
                      return (
                        <div 
                          key={notif.id} 
                          onClick={() => {
                            setNotifOpen(false);
                            if (onNavigate) {
                               if (notif.type === 'void') onNavigate('void-logs');
                               else if (notif.type === 'low_stock' || notif.type === 'purchase_order') onNavigate('inventory-list');
                               else if (notif.type === 'cash_in') onNavigate('sales-dashboard');
                            }
                          }}
                          className="flex items-start gap-4 px-5 py-4 hover:bg-zinc-50/60 transition-colors cursor-pointer group"
                        >
                          <div className={`mt-0.5 p-1.5 rounded-[0.4rem] bg-zinc-50 border border-zinc-100 flex-shrink-0 ${cfg.iconClass}`}>
                            {TYPE_ICON[notif.type]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <p className="text-[0.75rem] font-semibold text-[#1a0f2e] truncate group-hover:text-[#6a12b8] transition-colors">
                                {notif.title}
                              </p>
                              <span className="text-[10px] font-medium text-zinc-400 shrink-0">
                                {timeAgo(notif.at)}
                              </span>
                            </div>
                            <p className="text-[0.7rem] text-zinc-500 leading-relaxed line-clamp-2">
                              {notif.message}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-14 flex flex-col items-center justify-center text-center px-6">
                      <div className="w-12 h-12 bg-zinc-50/50 rounded-full flex items-center justify-center mb-4">
                        <Bell size={18} className="text-zinc-300" strokeWidth={1.5} />
                      </div>
                      <p className="text-[0.8rem] font-semibold text-[#1a0f2e]">All caught up</p>
                      <p className="text-[0.7rem] text-zinc-400 mt-1">There are no new alerts at the moment.</p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 bg-[#fafafa] border-t border-black/[0.03] flex items-center justify-between">
                  {lastFetched && (
                    <span className="text-[10px] font-medium text-zinc-400">
                      Updated {timeAgo(lastFetched.toISOString())}
                    </span>
                  )}
                  <button onClick={() => fetchNotifications()} disabled={fetching} className="flex items-center gap-1.5 text-[10px] font-semibold text-zinc-500 hover:text-[#6a12b8] transition-colors disabled:opacity-50">
                    <RefreshCw size={11} className={fetching ? 'animate-spin' : ''} />
                    Refresh
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Live badge */}
          <div
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: '#22c55e15', border: '1px solid #22c55e40',
              borderRadius: '100px', padding: '4px 10px',
            }}
          >
            <div
              className="ops-topbar-pulse"
              style={{
                width: 5, height: 5, borderRadius: '50%',
                background: '#4ade80', boxShadow: '0 0 8px rgba(74,222,128,0.4)',
              }}
            />
            <span
              style={{
                fontSize: '0.5rem', fontWeight: 900,
                letterSpacing: '0.16em', textTransform: 'uppercase', color: '#4ade80',
              }}
            >
              Terminal Active
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default OpsTopBar;
