import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, Clock, MapPin, RefreshCw, AlertTriangle, ShoppingCart, Wallet, Search, ShoppingBag } from "lucide-react";
import type { TabId } from "./SuperAdminSidebar";
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

interface SearchResult {
  title: string;
  type: string;
  tab: TabId;
  sub?: string;
  id?: string | number;
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

// ── Types ─────────────────────────────────────────────────────────────────────
export interface SuperAdminTopBarProps {
  active: TabId;
  onMenuClick: () => void;
  onNavigate: (id: TabId) => void;
  branchLabel?: string | null;
}

// ── Page meta ─────────────────────────────────────────────────────────────────
const PAGE_TITLES: Record<TabId, { label: string; desc: string }> = {
  overview: { label: "Dashboard Overview", desc: "Real-time summary across all branches" },
  branches: { label: "Branch Management", desc: "Full control over all branches" },
  app_branches: { label: "App Branches", desc: "Manage visual representations and coordinates for the mobile app" },
  users: { label: "User Management", desc: "Staff accounts, roles & permissions" },
  devices: { label: "Device Management", desc: "POS terminals & connected devices" },

  sales_report: { label: "Sales Report", desc: "Detailed breakdown of daily transactions" },
  staff_performance: { label: "Staff Performance", desc: "Employee efficiency & scorecard analytics" },
  analytics: { label: "Analytics & Sales", desc: "Visual trends and revenue growth" },
  items_report: { label: "Items Report", desc: "Per-item sales and movement data" },
  cross_branch_reports: { label: "Cross-Branch Reports", desc: "Consolidated analytics across branches" },
  x_reading: { label: "X Reading", desc: "Mid-day POS shift summary" },
  z_reading: { label: "Z Reading", desc: "End-of-day POS closing report" },
  branch_receipts: { label: "Branch Receipts", desc: "View and manage receipts across all branches" },

  menu_items: { label: "Menu List", desc: "All products & pricing" },
  categories: { label: "Categories", desc: "Top-level menu groupings" },
  subcategories: { label: "Sub-Categories", desc: "Nested category structure" },
  featured_drinks: { label: "Featured Drinks", desc: "Manage highlighted and seasonal items" },

  inv_overview: { label: "Inventory Overview", desc: "Stock summary across all branches" },
  inventory_alerts: { label: "Inventory Alert Center", desc: "Global monitoring of low-stock items" },
  raw_materials: { label: "Raw Materials", desc: "Ingredients & packaging stock" },
  usage_report: { label: "Usage Report", desc: "Material consumption & variance" },
  recipes: { label: "Recipes", desc: "Ingredient composition per menu item" },
  supplier: { label: "Supplier", desc: "Vendor records & contacts" },
  purchase_order: { label: "Purchase Order", desc: "Incoming stock orders" },
  stock_transfer: { label: "Stock Transfer", desc: "Move stock between branches" },

  expenses: { label: "Expenses", desc: "Operational costs & expense tracking" },

  promotions: { label: "Promotions & Discounts", desc: "Active campaigns & regular discounts" },
  vouchers: { label: "Vouchers", desc: "Manage promo codes and limited vouchers" },
  audit: { label: "Audit Logs", desc: "Complete system activity trail" },
  settings: { label: "System Settings", desc: "Global configuration & preferences" },

  card_management: { label: "Card Management", desc: "Create and manage promotional cards" },
  card_approvals: { label: "Card Approvals", desc: "Review and approve membership card requests" },
  card_members: { label: "Card Members", desc: "Active subscribers and daily perk usage" },
  loyalty: { label: "Loyalty", desc: "Manage loyalty programs and rewards" },
  customers: { label: "Customers", desc: "Manage registered customer accounts" },
  online_orders: { label: "Online Orders", desc: "Monitor online order queue and statuses" },
  payment_settings: { label: "Payment Settings", desc: "Configure branch-specific payment methods & QR codes" },
};

// ── Pulse animation ───────────────────────────────────────────────────────────
const PULSE_STYLE = `
  @keyframes sa-topbar-pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
  .sa-topbar-pulse { animation: sa-topbar-pulse 2s infinite; }
  @keyframes sa-topbar-rise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
`;

// ── Component ─────────────────────────────────────────────────────────────────
const SuperAdminTopBar: React.FC<SuperAdminTopBarProps> = ({
  active, onMenuClick, onNavigate, branchLabel,
}) => {
  const [time, setTime] = useState(new Date());

  // ── Notification State ──────────────────────────────────────────────────────
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotifOpen, setNotifOpen] = useState(false);
  const [hasNew, setHasNew] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [prevCount, setPrevCount] = useState(0);

  // ── Search State ──────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<SearchResult[]>([]);
  const [isSearchOpen, setSearchOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isMobileSearchVisible, setIsMobileSearchVisible] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  // ── Load History ──────────────────────────────────────────────────────────
  useEffect(() => {
     const saved = localStorage.getItem('sa_search_history');
     if (saved) setRecentSearches(JSON.parse(saved));
  }, []);

  const saveToHistory = (item: SearchResult) => {
    const updated = [item, ...recentSearches.filter(r => r.title !== item.title || r.type !== item.type)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('sa_search_history', JSON.stringify(updated));
  };

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

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleBellClick = () => {
    setNotifOpen(prev => !prev);
    setHasNew(false);
  };

  // ── Keyboard Shortcut (Ctrl+K) ─────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (window.innerWidth < 1024) {
          setIsMobileSearchVisible(true);
          setTimeout(() => mobileInputRef.current?.focus(), 100);
        } else {
          inputRef.current?.focus();
          setSearchOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ── Highlighting Utility ───────────────────────────────────────────────────
  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[:]/g, '')})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase().replace(/.*:/, '').trim() 
        ? <span key={i} className="text-[#6a12b8] font-black bg-[#ede8ff] px-0.5 rounded">{part}</span> 
        : part
    );
  };

  // ── Debounced Search ───────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }
      setIsSearching(true);
      try {
        const { data } = await api.get(`/search?q=${searchQuery}`);
        setSearchResults(data.data || []);
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setIsSearching(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ── Click Outside ───────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Main effect ─────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchNotifications();
    const t = setInterval(() => setTime(new Date()), 1000);
    const n = setInterval(() => fetchNotifications(), 30000);
    return () => {
      clearInterval(t);
      clearInterval(n);
    };
  }, [fetchNotifications]);

  const page = PAGE_TITLES[active] ?? { label: active, desc: "" };

  return (
    <>
      <style>{PULSE_STYLE}</style>
      <div className="shrink-0 flex items-center justify-between px-4 sm:px-6 lg:px-10 py-3 md:py-4 bg-white border-b border-gray-200 shadow-sm min-h-18 relative z-[100]">

        {/* ── Left: hamburger + title + date badge + branch pill ── */}
        <div className="flex items-center gap-3 min-w-0">

          {/* Mobile hamburger */}
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 rounded-[0.4rem] text-[#6a12b8] hover:bg-[#f5f3ff] transition-colors shrink-0"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          {/* Page title area */}
          <div className="min-w-0 flex-1 sm:flex-initial">
            <h1 style={{ fontSize: 'calc(0.85rem + 0.1vw)', fontWeight: 800, color: '#1a0f2e', letterSpacing: '-0.03em', margin: 0 }}
              className="truncate max-w-[120px] xs:max-w-[180px] sm:max-w-none">
              {page.label}
            </h1>
            <p style={{ fontSize: '0.65rem', fontWeight: 400, color: '#71717a', margin: 0 }}
              className="hidden lg:block truncate max-w-[200px] xl:max-w-[400px]">
              {page.desc}
            </p>
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

          {/* Branch / role pill — shown if branchLabel provided, else shows "Super Admin" */}
          <span
            className="hidden md:inline-flex items-center gap-1.5 shrink-0"
            style={{
              fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em',
              textTransform: 'uppercase', background: '#ede9fe', color: '#6a12b8',
              border: '1px solid #ddd6f7', borderRadius: '100px', padding: '3px 9px',
            }}
          >
            <MapPin size={9} strokeWidth={2.5} />
            {branchLabel ?? 'Super Admin'}
          </span>

          {/* ── Universal Search ── */}
          <div className="hidden lg:flex items-center ml-4 relative" ref={searchRef}>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={13} className={`${isSearchOpen ? 'text-[#6a12b8]' : 'text-zinc-400'} transition-colors`} />
              </div>
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onFocus={() => setSearchOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchOpen(true);
                }}
                placeholder="Search... (Ctrl+K)"
                className={`w-64 xl:w-80 pl-9 pr-4 py-1.5 text-[0.75rem] font-medium bg-zinc-50 border ${isSearchOpen ? 'border-[#6a12b8] bg-white ring-2 ring-[#ede8ff]' : 'border-zinc-200'
                  } rounded-full transition-all focus:outline-none placeholder:text-zinc-400`}
              />
              {isSearching && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <RefreshCw size={10} className="text-[#6a12b8] animate-spin" />
                </div>
              )}
            </div>

            {/* Results Dropdown */}
            {isSearchOpen && (
              <div className="absolute top-full left-0 mt-2 w-64 xl:w-80 bg-white border border-gray-100 shadow-2xl rounded-xl z-[110] overflow-hidden overflow-y-auto max-h-[400px]">
                
                {/* 1. Empty State / History */}
                {searchQuery.length < 2 && recentSearches.length > 0 && (
                  <div className="py-2">
                    <p className="px-5 py-1 text-[9px] font-black text-zinc-400 uppercase tracking-widest">Recent Searches</p>
                    {recentSearches.map((res, i) => (
                      <button
                        key={`hist-${i}`}
                        onClick={() => {
                          onNavigate(res.tab);
                          setSearchOpen(false);
                          setSearchQuery("");
                        }}
                        className="w-full text-left px-5 py-2 hover:bg-[#f5f3ff] group transition-colors flex flex-col"
                      >
                        <span className="text-[0.75rem] font-bold text-[#1a0f2e] group-hover:text-[#6a12b8]">{res.title}</span>
                        <span className="text-[0.6rem] text-zinc-400">{res.type.toUpperCase()}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* 2. Active Search Results */}
                {searchQuery.length >= 2 && (
                  searchResults.length > 0 ? (
                    <div className="py-2">
                      {['action', 'branch', 'user', 'sale', 'product', 'inventory', 'expense'].map(type => {
                        const typeResults = searchResults.filter(r => r.type === type);
                        if (typeResults.length === 0) return null;

                        const typeLabels: Record<string, string> = {
                          action: 'Suggested Actions', branch: 'Branches', user: 'Users', 
                          sale: 'Daily Sales', product: 'Menu Items', inventory: 'Raw Materials', 
                          expense: 'Expenses'
                        };

                        return (
                          <div key={type} className="px-2 mb-2">
                            <p className="px-3 py-1 text-[9px] font-black text-zinc-400 uppercase tracking-widest">{typeLabels[type]}</p>
                            <div className="space-y-0.5">
                              {typeResults.map(res => (
                                <button
                                  key={`${res.type}-${res.id || res.title}`}
                                  onClick={() => {
                                    saveToHistory(res);
                                    onNavigate(res.tab);
                                    setSearchOpen(false);
                                    setSearchQuery("");
                                  }}
                                  className={`w-full text-left px-3 py-2 rounded-lg hover:bg-[#f5f3ff] group transition-colors flex flex-col ${res.type === 'action' ? 'border-l-2 border-[#6a12b8] bg-zinc-50' : ''}`}
                                >
                                  <span className="text-[0.75rem] font-bold text-[#1a0f2e] group-hover:text-[#6a12b8]">
                                    {highlightMatch(res.title, searchQuery)}
                                  </span>
                                  <span className="text-[0.65rem] text-zinc-500">
                                    {highlightMatch(res.sub || "", searchQuery)}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : !isSearching ? (
                    <div className="py-8 text-center text-zinc-400">
                      <p className="text-[0.7rem] font-bold uppercase tracking-widest">No matching records</p>
                      <p className="text-[0.6rem] mt-1">Try searching for something else</p>
                    </div>
                  ) : null
                )}

                {/* 3. Search Tips (Shown when empty and no history) */}
                {searchQuery.length === 0 && recentSearches.length === 0 && (
                   <div className="p-5 text-center">
                      <p className="text-[0.7rem] font-bold text-[#6a12b8] uppercase tracking-widest">Search Pro</p>
                      <div className="mt-3 space-y-2 text-[0.65rem] text-zinc-500 font-medium">
                        <p>💡 Tip: Use <span className="text-[#6a12b8] font-bold uppercase">user:</span> to filter users</p>
                        <p>💡 Tip: Use <span className="text-[#6a12b8] font-bold uppercase">sale:</span> for receipts</p>
                        <p>💡 Tip: Type <span className="text-[#6a12b8] font-bold uppercase">new</span> for quick actions</p>
                      </div>
                   </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Search Toggle for Mobile */}
          <div className="lg:hidden flex items-center">
            <button
               onClick={() => {
                 setIsMobileSearchVisible(true);
                 setTimeout(() => mobileInputRef.current?.focus(), 100);
               }}
               className="p-2 rounded-[0.4rem] text-zinc-500 hover:bg-zinc-100 transition-colors"
            >
              <Search size={16} />
            </button>
          </div>
        </div>

        {/* ── Right: clock + bell + live badge ── */}
        <div className="flex items-center gap-3 shrink-0">

          {/* Live clock */}
          <div
            className="hidden md:flex items-center gap-2"
            style={{ fontSize: '0.65rem', fontWeight: 400, color: '#71717a' }}
          >
            <Clock size={12} />
            <span>
              {time.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Bell Center */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={handleBellClick}
              className={`relative p-2 rounded-[0.4rem] transition-all ${isNotifOpen
                  ? 'bg-[#6a12b8] text-white'
                  : 'text-zinc-500 hover:bg-zinc-100 hover:text-[#6a12b8]'
                }`}
            >
              <Bell size={15} strokeWidth={isNotifOpen ? 2.5 : 2} />

              {/* Badge dot / count */}
              {notifications.length > 0 && (
                <span className={`absolute top-1 right-1 flex items-center justify-center min-w-[0.5rem] h-2 px-0.5 bg-red-500 rounded-full border border-white text-[6px] font-bold text-white ${hasNew ? 'sa-topbar-pulse' : ''}`}>
                  {notifications.length > 9 ? '9+' : notifications.length}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {isNotifOpen && (
              <div
                className="absolute right-[-2.5rem] sm:right-0 mt-3 w-[calc(100vw-2rem)] sm:w-80 max-w-[340px] bg-white border border-gray-100 shadow-2xl z-[150] overflow-hidden rounded-[0.75rem]"
                style={{ animation: 'sa-topbar-rise 0.2s ease-out' }}
              >
                {/* Dropdown Header */}
                <div className="bg-[#6a12b8] px-5 py-3.5 flex items-center justify-between">
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
                    notifications.map(notif => {
                      const cfg = SEVERITY_CONFIG[notif.severity];
                      return (
                        <div
                          key={notif.id}
                          className={`flex gap-3 p-4 hover:bg-gray-50 transition-colors cursor-pointer ${cfg.bg.replace('bg-', 'bg-opacity-40 bg-')}`}
                        >
                          <div className={`w-8 h-8 rounded-[0.5rem] flex items-center justify-center shrink-0 border ${cfg.border} ${cfg.bg}`}>
                            <span className={cfg.icon}>{TYPE_ICON[notif.type]}</span>
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
                            {notif.branch_name && (
                              <div className="mt-1.5 flex items-center gap-1">
                                <span className="bg-zinc-100 text-zinc-500 text-[8px] font-bold px-1.5 py-0.5 rounded-[0.25rem] uppercase tracking-wider">
                                  {notif.branch_name}
                                </span>
                              </div>
                            )}
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
                      <p className="text-[0.65rem] text-gray-300 mt-1">No pending alerts at the moment.</p>
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
                    className="flex items-center gap-1.5 text-[9px] font-bold text-[#6a12b8] uppercase tracking-widest hover:opacity-70 transition-opacity"
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
            className="hidden sm:inline-flex items-center gap-1 bg-[#f0fdf4] border border-[#bbf7d0] rounded-full px-2.5 py-1"
          >
            <div
              className="sa-topbar-pulse"
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

        {/* ── Mobile Search Overlay ── */}
        {isMobileSearchVisible && (
          <div className="lg:hidden fixed inset-0 z-[200] bg-white animate-in slide-in-from-top duration-300">
            <div className="flex flex-col h-full">
               <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                  <button onClick={() => setIsMobileSearchVisible(false)} className="p-2 text-zinc-500">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                       <Search size={14} className="text-zinc-400" />
                    </div>
                    <input
                      ref={mobileInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search reports, sales, staff..."
                      className="w-full pl-9 pr-4 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white transition-all"
                    />
                  </div>
               </div>
               
               <div className="flex-1 overflow-y-auto p-4 bg-gray-50/30">
                  {/* Results for Mobile */}
                  {searchQuery.length < 2 && recentSearches.length > 0 && (
                    <div className="mb-6">
                      <p className="px-3 py-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest">History</p>
                      <div className="space-y-1">
                        {recentSearches.map((res, i) => (
                          <button
                            key={`m-hist-${i}`}
                            onClick={() => {
                              onNavigate(res.tab);
                              setIsMobileSearchVisible(false);
                              setSearchQuery("");
                            }}
                            className="w-full text-left px-4 py-3 bg-white border border-gray-100 rounded-xl flex items-center justify-between"
                          >
                            <span className="text-sm font-bold text-[#1a0f2e]">{res.title}</span>
                            <span className="text-[10px] font-bold text-zinc-400 uppercase">{res.type}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchQuery.length >= 2 && (
                    searchResults.length > 0 ? (
                      <div className="space-y-4">
                        {['action', 'branch', 'user', 'sale', 'product', 'inventory', 'expense'].map(type => {
                          const typeResults = searchResults.filter(r => r.type === type);
                          if (typeResults.length === 0) return null;
                          const labels: Record<string, string> = { action: 'Actions', branch: 'Branches', user: 'Users', sale: 'Sales', product: 'Menu', inventory: 'Stock', expense: 'Expenses' };
                          return (
                            <div key={`m-type-${type}`}>
                              <p className="px-3 py-1 text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">{labels[type]}</p>
                              <div className="space-y-2">
                                {typeResults.map(res => (
                                  <button
                                    key={`m-res-${res.type}-${res.id || res.title}`}
                                    onClick={() => {
                                      saveToHistory(res);
                                      onNavigate(res.tab);
                                      setIsMobileSearchVisible(false);
                                      setSearchQuery("");
                                    }}
                                    className="w-full text-left p-4 bg-white border border-gray-100 rounded-2xl flex flex-col shadow-sm"
                                  >
                                    <span className="text-sm font-bold text-[#1a0f2e]">{res.title}</span>
                                    <span className="text-[10px] text-zinc-400 mt-0.5">{res.sub || res.type.toUpperCase()}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : !isSearching && (
                      <div className="mt-20 text-center text-zinc-400">
                        <ShoppingBag size={48} className="mx-auto opacity-10 mb-4" />
                        <p className="text-sm font-bold">No results found</p>
                      </div>
                    )
                  )}
               </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default SuperAdminTopBar;
