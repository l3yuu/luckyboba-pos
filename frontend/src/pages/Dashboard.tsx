import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Sidebar from "../components/Cashier/Sidebar";
import logo from '../assets/logo.png';
import api from '../services/api';
import SyncOverlay from '../components/SyncOverlay';
import { useToast } from '../hooks/useToast';
import type { DashboardData, TopSeller } from '../types/dashboard';
import { Monitor, Receipt, ArrowDownToLine, ArrowUpFromLine, Ban, Trophy, Clock4, RefreshCw, TrendingUp, Lock } from 'lucide-react';

import CashIn from '../components/Cashier/SalesOrder/CashIn';
import CashDrop from '../components/Cashier/SalesOrder/CashDrop';
import SearchReceipts from '../components/Cashier/SalesOrder/SearchReceipts';
import CashCount from '../components/Cashier/SalesOrder/CashCount';
import SalesDashboard from '../components/Cashier/SalesReport/SalesDashboard';
import ItemsReport from '../components/Cashier/SalesReport/ItemsReport';
import XReading from '../components/Cashier/SalesReport/XReading';
import ZReading from '../components/Cashier/SalesReport/ZReading';
import MenuList from '../components/Cashier/MenuItems/MenuList';
import CategoryList from '../components/Cashier/MenuItems/CategoryList';
import SubCategoryList from '../components/Cashier/MenuItems/Sub-CategoryList';
import Expense from '../components/Cashier/Expense';
import InventoryDashboard from '../components/Cashier/Inventory/InventoryDashboard';
import InventoryCategoryList from '../components/Cashier/Inventory/InventoryCategoryList';
import InventoryList from '../components/Cashier/Inventory/InventoryList';
import InventoryReport from '../components/Cashier/Inventory/InventoryReport';
import ItemChecker from '../components/Cashier/Inventory/ItemChecker';
import ItemSerials from '../components/Cashier/Inventory/ItemSerials';
import PurchaseOrder from '../components/Cashier/Inventory/PurchaseOrder';
import StockTransfer from '../components/Cashier/Inventory/StockTransfer';
import Supplier from '../components/Cashier/Inventory/Supplier';
import Settings from '../components/Cashier/Settings/Settings';
import { OnlineOrdersPanel } from '../components/Cashier/SalesOrderComponents/OnlineOrdersPanel';



interface DashboardStatsProps {
  stats: DashboardData | null;
  isInitialLoad: boolean;
  isStale?: boolean;
  loading: boolean;
  isOnline?: boolean;
  onRefresh: () => void;
}

const GlobalFont = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');
    *, *::before, *::after, body, input, button, select, textarea {
      font-family: 'DM Sans', sans-serif !important;
    }
    .stat-card { transition: transform 0.15s ease, box-shadow 0.15s ease; border-radius:10px }
    .stat-card:hover { transform: translateY(-1px); box-shadow: 0 4px 24px rgba(124,20,212,0.10); }
    .rank-bar { transition: width 1.2s cubic-bezier(0.16, 1, 0.3, 1); }
  `}</style>
);


const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [syncRequired, setSyncRequired] = useState(false);
  const [stats, setStats] = useState<DashboardData | null>(() => {
    const cached = localStorage.getItem('dashboard_stats');
    return cached ? JSON.parse(cached) : null;
  });
  const [loading, setLoading] = useState(!stats);
  const [isInitialLoad, setIsInitialLoad] = useState(!stats);
  const [isStale, setIsStale] = useState(() => {
    const ts = localStorage.getItem('dashboard_stats_timestamp');
    if (!ts) return true;
    return Date.now() - Number(ts) > 5 * 60 * 1000;
  });
  const isFetching = useRef(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    if (!authLoading && !user) navigate('/login', { replace: true });
  }, [user, authLoading, navigate]);

  const fetchStats = useCallback(async (force = false) => {
    if (isFetching.current) return;
    if (!force) {
      const lastFetch = localStorage.getItem('dashboard_stats_timestamp');
      if (lastFetch && Date.now() - Number(lastFetch) < 5 * 60 * 1000) {
        setLoading(false); setIsInitialLoad(false); setIsStale(false);
        return;
      }
    }
    isFetching.current = true;
    setLoading(true);
    try {
      const response = await api.get('/dashboard/stats');
      setStats(response.data);
      localStorage.setItem('dashboard_stats', JSON.stringify(response.data));
      localStorage.setItem('dashboard_stats_timestamp', Date.now().toString());
      setIsStale(false);
    } catch {
      const cached = localStorage.getItem('dashboard_stats');
      if (cached) setStats(JSON.parse(cached));
    } finally {
      setLoading(false); setIsInitialLoad(false); isFetching.current = false;
    }
  }, []);

  useEffect(() => {
    const goOnline = () => {
      setIsOnline(true);
      if (activeTab === 'dashboard') {
        localStorage.removeItem('dashboard_stats_timestamp');
        void fetchStats(true);
      }
    };
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, [fetchStats, activeTab]);

  useEffect(() => {
    if (!user || activeTab !== 'dashboard') return;
    void fetchStats(refreshKey > 0);
  }, [user, activeTab, refreshKey, fetchStats]);

  useEffect(() => {
    const handleOrderCompleted = () => {
      localStorage.removeItem('dashboard_stats_timestamp');
      void fetchStats(true);
    };
    window.addEventListener('online-order-completed', handleOrderCompleted);
    return () => {
      window.removeEventListener('online-order-completed', handleOrderCompleted);
    };
  }, [fetchStats]);

  // Real-time synchronization prompt — NON-DISMISSIBLE overlay
  useEffect(() => {
    const SYNC_CHANNEL_NAME = 'lucky_boba_pos_sync_v1';
    const SYNC_STORAGE_KEY = 'lb-pos-sync-trigger-v1';
    const origin = window.location.origin;

    const channel = new BroadcastChannel(SYNC_CHANNEL_NAME);

    // Migration: clear stale ms-based values from previous code (PHP uses seconds)
    const raw = localStorage.getItem('lb-pos-menu-version') || '0';
    if (parseInt(raw, 10) > 10_000_000_000) {
      localStorage.removeItem('lb-pos-menu-version');
    }
    // Track the last known backend version (in SECONDS, same unit as PHP time())
    let localMenuVersion = parseInt(localStorage.getItem('lb-pos-menu-version') || '0', 10);

    const handleSync = () => {
      console.info(`[Sync] 📥 Signal Received at ${origin}: Triggering UI overlay.`);
      setSyncRequired(true);
    };

    // 1. BroadcastChannel
    channel.onmessage = (event) => {
      const data = event.data;
      const msg = typeof data === 'string' ? data : data?.type;
      console.log(`[Sync] Broadcast message received at ${origin}:`, data);
      if (msg === 'menu-updated') handleSync();
    };

    // 2. LocalStorage Fallback
    const handleStorage = (e: StorageEvent) => {
      if (e.key === SYNC_STORAGE_KEY) {
        console.log(`[Sync] Storage event received at ${origin}:`, e.newValue);
        handleSync();
      }
    };
    window.addEventListener('storage', handleStorage);

    // 3. API Polling (Cross-Browser / Cross-Device)
    const checkVersion = async () => {
      try {
        const { data } = await api.get('/menu/version');
        const remoteVersion = parseInt(data.version || '0', 10);

        if (remoteVersion > 0 && localMenuVersion > 0 && remoteVersion > localMenuVersion) {
          console.info(`[Sync] 🔄 Remote version (${remoteVersion}) > Local (${localMenuVersion}).`);
          localMenuVersion = remoteVersion;
          localStorage.setItem('lb-pos-menu-version', remoteVersion.toString());
          handleSync();
        } else if (localMenuVersion === 0 && remoteVersion > 0) {
          localMenuVersion = remoteVersion;
          localStorage.setItem('lb-pos-menu-version', remoteVersion.toString());
        }
      } catch {
        // Silent catch for polling
      }
    };

    // Check every 10 seconds for faster cross-browser detection
    const intervalId = setInterval(checkVersion, 10000);
    checkVersion();

    return () => {
      channel.close();
      window.removeEventListener('storage', handleStorage);
      clearInterval(intervalId);
    };
  }, [showToast]);

  if (authLoading || (isInitialLoad && !stats)) return <DashboardSkeleton />;
  if (!user) return null;

  const refreshStats = () => {
    localStorage.removeItem('dashboard_stats_timestamp');
    setRefreshKey(k => k + 1);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardStats stats={stats} isInitialLoad={isInitialLoad} isStale={isStale} loading={loading} isOnline={isOnline} onRefresh={() => fetchStats(true)} />;
      case 'cash-in': return <CashIn onSuccess={refreshStats} />;
      case 'cash-drop': return <CashDrop onSuccess={refreshStats} />;
      case 'search-receipts': return <SearchReceipts />;
      case 'cash-count': return <CashCount onSuccess={() => setActiveTab('dashboard')} />;
      case 'sales-dashboard': return <SalesDashboard />;
      case 'items-report': return <ItemsReport />;
      case 'x-reading': return <XReading />;
      case 'z-reading': return <ZReading />;
      case 'menu-list': return <MenuList />;
      case 'category-list': return <CategoryList />;
      case 'sub-category-list': return <SubCategoryList />;
      case 'inventory-dashboard': return <InventoryDashboard view="dashboard" />;
      case 'inventory-raw-materials': return <InventoryDashboard view="materials" />;
      case 'inventory-usage': return <InventoryDashboard view="usage" />;
      case 'inventory-recipes': return <InventoryDashboard view="recipes" />;
      case 'inventory-list': return <InventoryList />;
      case 'inventory-category': return <InventoryCategoryList />;
      case 'supplier': return <Supplier />;
      case 'item-checker': return <ItemChecker />;
      case 'item-serials': return <ItemSerials />;
      case 'purchase-order': return <PurchaseOrder />;
      case 'stock-transfer': return <StockTransfer />;
      case 'inventory-report': return <InventoryReport />;
      case 'expense': return <Expense />;
      case 'online-orders': return <OnlineOrdersPanel isPage={false} />;
      case 'settings': return <Settings />;
      default: return <DashboardStats stats={stats} isInitialLoad={isInitialLoad} isStale={isStale} loading={loading} isOnline={isOnline} onRefresh={() => fetchStats(true)} />;
    }
  };

  return (
    <>
      <GlobalFont />
      <div className="dashboard-root flex flex-col md:flex-row h-screen bg-[#f5f0ff] text-zinc-900 overflow-hidden">
        <Sidebar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} logo={logo} currentTab={activeTab} setCurrentTab={setActiveTab} />
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">{renderContent()}</div>
        </main>
      </div>

      {/* Mandatory Sync Modal Overlay — NON-DISMISSIBLE until sync completes */}
      {syncRequired && (
        <SyncOverlay
          onSync={async () => {
            localStorage.removeItem('dashboard_stats_timestamp');
            // Store the server's version (seconds) — NOT Date.now() (milliseconds)
            try {
              const { data } = await api.get('/menu/version');
              const v = parseInt(data.version || '0', 10);
              if (v > 0) localStorage.setItem('lb-pos-menu-version', v.toString());
            } catch { /* version will be picked up on next poll */ }
            window.location.reload();
          }}
        />
      )}
    </>
  );
};

const DashboardStats = ({ stats, isInitialLoad, isStale = false, loading, isOnline, onRefresh }: DashboardStatsProps) => {
  const [time, setTime] = useState(new Date());
  const [netRevenueVisible, setNetRevenueVisible] = useState(false);
  const [showPinOverlay, setShowPinOverlay] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (netRevenueVisible) {
      const timer = setTimeout(() => {
        setNetRevenueVisible(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [netRevenueVisible]);

  const isLoading = isInitialLoad || isStale || loading;
  const fmt = (v: number) => `₱${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  const dateStr = time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const timeStr = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

  return (
    <div className="p-5 md:p-7 min-h-full flex flex-col gap-5">
      <div className="grid grid-cols-12 gap-4">

        {/* Terminal Status — solid #6a12b8, same as login purple, NO gradient */}
        <div
          className="col-span-12 lg:col-span-5 rounded-[0.625rem] p-7 flex flex-col justify-between min-h-44 relative overflow-hidden"
          style={{ backgroundColor: '#6a12b8' }}
        >
          <div className="absolute inset-0 opacity-[0.06]"
            style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Monitor size={16} strokeWidth={2} className="text-purple-200" />
                <p className="text-sm font-bold uppercase tracking-widest text-purple-200">Terminal Status</p>
              </div>
              <button onClick={onRefresh} className="p-1.5 text-purple-200 hover:text-white transition-colors">
                <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
              </button>
            </div>
            <p className="text-purple-100 text-base font-semibold mt-2">{dateStr}</p>
          </div>
          <div className="relative z-10 flex items-end justify-between">
            <p className="text-white text-[3.2rem] font-bold tracking-tight tabular-nums leading-none">{timeStr}</p>
            {isOnline !== false ? (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 border border-emerald-400/40 mb-1 rounded-sm">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-300">Online</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-500/20 border border-zinc-400/40 mb-1 rounded-sm">
                <span className="w-2 h-2 bg-zinc-400 rounded-full" />
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-300">Offline</span>
              </div>
            )}
          </div>
        </div>

        {/* Net Revenue */}
        <div className="col-span-12 md:col-span-6 lg:col-span-4 bg-white border border-[#e9d5ff] rounded-[0.625rem] p-7 flex flex-col justify-between min-h-44 stat-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#f5f0ff] border border-[#ddd6fe] flex items-center justify-center rounded-lg">
                <span className="text-[#6a12b8] font-black text-lg leading-none">₱</span>
              </div>
              <p className="text-sm font-bold uppercase tracking-widest text-zinc-700">Net Revenue</p>
            </div>
            <div className="flex items-center gap-1.5">
              <TrendingUp size={15} strokeWidth={2} className="text-emerald-600" />
              <span className="text-sm font-bold text-emerald-600">Today</span>
            </div>
          </div>
          <div>
            {isLoading ? (
              <div className="h-10 w-40 bg-[#f5f0ff] animate-pulse rounded" />
            ) : netRevenueVisible ? (
              <div className="flex items-center justify-between w-full">
                <p className="text-[2.6rem] font-black text-[#1a0f2e] tracking-tight tabular-nums leading-none">
                  {fmt(stats?.total_sales_today ?? 0)}
                </p>
                <button 
                  onClick={() => setNetRevenueVisible(false)}
                  className="p-2 text-zinc-400 hover:text-[#6a12b8] transition-colors"
                  title="Lock Revenue"
                >
                  <Lock size={18} />
                </button>
              </div>
            ) : (
              <div 
                onClick={() => setShowPinOverlay(true)}
                className="group cursor-pointer flex items-center justify-between w-full"
              >
                <p className="text-[2.6rem] font-black text-zinc-200 blur-[8px] tracking-tight tabular-nums leading-none transition-all group-hover:blur-[5px]">
                  {fmt(8888.88)}
                </p>
                <div className="bg-[#6a12b8] p-3 rounded-[0.625rem] text-white shadow-sm transition-all group-hover:shadow-md group-hover:scale-110 active:scale-95">
                  <Lock size={18} />
                </div>
              </div>
            )}
            <p className="text-sm font-bold uppercase tracking-widest text-zinc-500 mt-2">Active Shift</p>
          </div>
        </div>

        {showPinOverlay && (
          <AdminPinOverlay
            onCancel={() => setShowPinOverlay(false)}
            onSuccess={() => {
              setShowPinOverlay(false);
              setNetRevenueVisible(true);
              showToast('Authorized: Revenue visible for 5s', 'success');
            }}
          />
        )}

        {/* Transactions */}
        <div className="col-span-12 md:col-span-6 lg:col-span-3 bg-white border border-[#e9d5ff] rounded-[0.625rem] p-7 flex flex-col justify-between min-h-44 stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#f5f0ff] border border-[#ddd6fe] flex items-center justify-center rounded-lg">
              <Receipt size={18} className="text-[#6a12b8]" strokeWidth={2} />
            </div>
            <p className="text-sm font-bold uppercase tracking-widest text-zinc-700">Transactions</p>
          </div>
          {isLoading
            ? <div className="h-16 w-14 bg-[#f5f0ff] animate-pulse rounded" />
            : <p className="text-[4.5rem] font-bold text-[#1a0f2e] tracking-tight leading-none tabular-nums">{stats?.total_orders_today ?? 0}</p>
          }
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard icon={<ArrowUpFromLine size={18} strokeWidth={2} className="text-emerald-600" />} label="Begin Cash" value={fmt(stats?.cash_in_today ?? 0)} isLoading={isLoading} accent="emerald" />
        <MetricCard icon={<ArrowDownToLine size={18} strokeWidth={2} className="text-[#6a12b8]" />} label="Cash Out" value={fmt(stats?.cash_out_today ?? 0)} isLoading={isLoading} accent="purple" />
        <MetricCard icon={<Ban size={18} strokeWidth={2} className="text-red-500" />} label="Voided" value={fmt(stats?.voided_sales_today ?? 0)} isLoading={isLoading} accent="red" />
      </div>

      <div className="grid grid-cols-12 gap-4 flex-1">
        <LeaderboardCard title="Top Sellers Today" icon={<Trophy size={17} strokeWidth={2} className="text-[#6a12b8]" />} sellers={stats?.top_seller_today ?? []} loading={isLoading} />
        <LeaderboardCard title="All Time Leaders" icon={<Clock4 size={17} strokeWidth={2} className="text-[#6a12b8]" />} sellers={stats?.top_seller_all_time ?? []} loading={isLoading} />
      </div>
    </div>
  );
};

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  isLoading: boolean;
  accent: 'emerald' | 'purple' | 'red';
}

const accentMap = { emerald: 'text-emerald-700', purple: 'text-[#6a12b8]', red: 'text-red-600' };

const MetricCard = ({ icon, label, value, isLoading, accent }: MetricCardProps) => (
  <div className="bg-white border border-[#e9d5ff] rounded-[0.625rem] px-6 py-5 flex items-center justify-between stat-card">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-[#f5f0ff] border border-[#ddd6fe] flex items-center justify-center rounded-lg">{icon}</div>
      <p className="text-sm font-bold uppercase tracking-widest text-zinc-700">{label}</p>
    </div>
    {isLoading
      ? <div className="h-6 w-32 bg-[#f5f0ff] animate-pulse rounded" />
      : <p className={`text-xl font-bold tabular-nums tracking-tight ${accentMap[accent]}`}>{value}</p>
    }
  </div>
);

interface LeaderboardCardProps {
  title: string;
  icon: React.ReactNode;
  sellers: TopSeller[] | null;
  loading: boolean;
}

const LeaderboardCard = ({ title, icon, sellers, loading }: LeaderboardCardProps) => {
  const list = sellers?.slice(0, 5) || [];
  const max = list.length ? Math.max(...list.map(s => s.total_qty)) : 1;
  const slots = Array.from({ length: 5 }, (_, i) => list[i] || null);

  return (
    <div className="col-span-12 lg:col-span-6 bg-white border border-[#e9d5ff] rounded-[0.625rem] flex flex-col" style={{ minHeight: '380px' }}>
      <div className="flex items-center gap-3 px-7 py-5 border-b border-[#ede9fe]">
        <div className="w-9 h-9 bg-[#f5f0ff] border border-[#ddd6fe] flex items-center justify-center rounded-lg">{icon}</div>
        <p className="text-sm font-bold uppercase tracking-widest text-zinc-700">{title}</p>
      </div>
      <div className="flex flex-col flex-1 px-7 py-3">
        {loading
          ? slots.map((_, i) => (
            <div key={i} className="flex-1 flex items-center gap-4 border-b border-[#f3eeff] last:border-0 py-3">
              <div className="w-5 h-4 bg-[#f5f0ff] animate-pulse rounded" />
              <div className="flex-1 h-4 bg-[#f5f0ff] animate-pulse rounded" />
              <div className="w-16 h-6 bg-[#f5f0ff] animate-pulse rounded" />
            </div>
          ))
          : slots.map((item, i) => (
            <div key={i} className="flex-1 flex flex-col justify-center border-b border-[#f3eeff] last:border-0 py-3">
              {item ? (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-bold tabular-nums text-[#c4b5fd] w-5">{String(i + 1).padStart(2, '0')}</span>
                      <span className="text-base font-semibold text-[#1a0f2e] truncate max-w-55">{item.product_name}</span>
                    </div>
                    <span className="text-sm font-bold tabular-nums text-[#6a12b8] bg-[#f5f0ff] border border-[#ddd6fe] px-3 py-1 rounded-sm">
                      {item.total_qty} sold
                    </span>
                  </div>
                  <div className="h-0.5 bg-[#ede9fe] overflow-hidden rounded-full">
                    <div className="rank-bar h-full bg-[#6a12b8]" style={{ width: `${(item.total_qty / max) * 100}%` }} />
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold tabular-nums text-[#ddd6fe] w-5">{String(i + 1).padStart(2, '0')}</span>
                  <span className="text-sm font-semibold text-zinc-300">—</span>
                </div>
              )}
            </div>
          ))
        }
      </div>
    </div>
  );
};

const DashboardSkeleton = () => (
  <>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
      * { font-family: 'DM Sans', sans-serif !important; }
    `}</style>
    <div className="flex h-screen bg-[#f5f0ff] overflow-hidden">
      <div className="w-64 bg-white border-r border-[#e9d5ff] hidden md:flex flex-col justify-between">
        <div className="px-4 pt-10 flex flex-col gap-2">
          <div className="w-36 h-10 bg-[#f5f0ff] animate-pulse mx-auto mb-8 rounded" />
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="w-full h-11 bg-[#f5f0ff] animate-pulse border-b border-[#ede9fe]" />)}
        </div>
        <div className="p-5"><div className="w-full h-12 bg-[#fdf4ff] animate-pulse rounded" /></div>
      </div>
      <div className="flex-1 p-7 flex flex-col gap-5">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-5 h-44 animate-pulse rounded-[0.625rem]" style={{ backgroundColor: '#6a12b8', opacity: 0.25 }} />
          <div className="col-span-4 h-44 bg-white animate-pulse border border-[#e9d5ff] rounded-[0.625rem]" />
          <div className="col-span-3 h-44 bg-white animate-pulse border border-[#e9d5ff] rounded-[0.625rem]" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white border border-[#e9d5ff] animate-pulse rounded-[0.625rem]" />)}
        </div>
        <div className="grid grid-cols-12 gap-4 flex-1">
          <div className="col-span-6 bg-white border border-[#e9d5ff] animate-pulse rounded-[0.625rem]" />
          <div className="col-span-6 bg-white border border-[#e9d5ff] animate-pulse rounded-[0.625rem]" />
        </div>
      </div>
    </div>
  </>
);

// ============================================================
// AdminPinOverlay — reused for POS metrics
// ============================================================

const AdminPinOverlay = ({
  onCancel,
  onSuccess,
}: {
  onCancel: () => void;
  onSuccess: () => void;
}) => {
  const [pin, setPin]         = React.useState('');
  const [error, setError]     = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api';

  const getHeaders = (): Record<string, string> => {
    const token =
      localStorage.getItem('auth_token') ??
      localStorage.getItem('lucky_boba_token') ??
      localStorage.getItem('token') ??
      '';
    return {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  const handleSubmit = async () => {
    if (!pin.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res  = await fetch(`${API_BASE}/auth/verify-manager-pin`, {
        method:  'POST',
        headers: getHeaders(),
        body:    JSON.stringify({ pin }),
      });
      const json = await res.json();
      if (json.success) {
        onSuccess();
      } else {
        setError(json.message ?? 'Incorrect PIN. Try again.');
        setPin('');
      }
    } catch {
      setError('Connection error. Try again.');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[0.625rem] shadow-2xl w-72 overflow-hidden text-center">
        <div className="bg-[#6a12b8] px-6 py-5 text-white">
          <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/50 mb-1">Authorization Required</p>
          <h3 className="text-base font-black uppercase tracking-widest">Admin PIN</h3>
          <p className="text-white/50 text-[10px] mt-1">Enter admin PIN to view metrics</p>
        </div>
        <div className="p-5 space-y-4">
          <input
            type="password"
            value={pin}
            onChange={e => setPin(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="••••"
            autoFocus
            className="w-full bg-[#f5f0ff] border-2 border-[#e9d5ff] rounded-[0.625rem] py-3 px-4 text-center text-2xl font-black tracking-[0.5em] outline-none focus:border-[#6a12b8] transition-colors"
          />
          {error && (
            <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">{error}</p>
          )}
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="flex-1 py-3 rounded-[0.625rem] border-2 border-zinc-200 text-zinc-500 font-black text-xs uppercase tracking-widest hover:bg-zinc-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !pin.trim()}
              className="flex-1 py-3 rounded-[0.625rem] bg-[#6a12b8] hover:bg-[#6a12b8] text-white font-black text-xs uppercase tracking-widest transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? '...' : 'Confirm'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
