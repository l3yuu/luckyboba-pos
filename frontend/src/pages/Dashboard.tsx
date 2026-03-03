import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Sidebar from "../components/Sidebar";
import logo from '../assets/logo.png';
import api from '../services/api'; 
import type { DashboardData, TopSeller } from '../types/dashboard';

<<<<<<< HEAD
// --- Import POS Components ---
import CashIn from '../components/Sales Order/CashIn'; 
import CashDrop from '../components/Sales Order/CashDrop';
import SearchReceipts from '../components/Sales Order/SearchReceipts';
import CashCount from '../components/Sales Order/CashCount';

// --- Import Sales Report Components ---
import SalesDashboard from '../components/Sales Report/SalesDashboard';
import ItemsReport from '../components/Sales Report/ItemsReport';
import XReading from '../components/Sales Report/XReading';
import ZReading from '../components/Sales Report/ZReading';
import MallAccredReport from '../components/Sales Report/MallAccredReport';

// --- Import Menu Management Components ---
import MenuList from '../components/MenuItems/MenuList';
import CategoryList from '../components/MenuItems/CategoryList';
import SubCategoryList from '../components/MenuItems/Sub-CategoryList';

// --- Import Expense Component ---
=======
import CashIn from '../components/SalesOrder/CashIn'; 
import CashDrop from '../components/SalesOrder/CashDrop';
import SearchReceipts from '../components/SalesOrder/SearchReceipts';
import CashCount from '../components/SalesOrder/CashCount';
import SalesDashboard from '../components/SalesReport/SalesDashboard';
import ItemsReport from '../components/SalesReport/ItemsReport';
import XReading from '../components/SalesReport/XReading';
import ZReading from '../components/SalesReport/ZReading';
import MallAccredReport from '../components/SalesReport/MallAccredReport';
import MenuList from '../components/MenuItems/MenuList';
import CategoryList from '../components/MenuItems/CategoryList';
import SubCategoryList from '../components/MenuItems/Sub-CategoryList';
>>>>>>> origin/main
import Expense from '../components/Expense';
import InventoryDashboard from '../components/Inventory/InventoryDashboard';
import InventoryCategoryList from '../components/Inventory/InventoryCategoryList';
import InventoryList from '../components/Inventory/InventoryList';
import InventoryReport from '../components/Inventory/InventoryReport';
import ItemChecker from '../components/Inventory/ItemChecker';
import ItemSerials from '../components/Inventory/ItemSerials';
import PurchaseOrder from '../components/Inventory/PurchaseOrder';
import StockTransfer from '../components/Inventory/StockTransfer';
import Supplier from '../components/Inventory/Supplier';
import Settings from '../components/Settings';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState<DashboardData | null>(() => {
    const cached = localStorage.getItem('dashboard_stats');
    return cached ? JSON.parse(cached) : null;
  });
  const [loading, setLoading] = useState(!stats);
  const [isInitialLoad, setIsInitialLoad] = useState(!stats);
  const [isStale, setIsStale] = useState(() => localStorage.getItem('dashboard_stats_timestamp') === '0');
  const isFetching = useRef(false);

  useEffect(() => {
    if (!authLoading && !user) navigate('/login', { replace: true });
  }, [user, authLoading, navigate]);

  const fetchStats = useCallback(async (force = false) => {
    if (isFetching.current && !force) return;
    if (!force && stats) {
      const lastFetch = localStorage.getItem('dashboard_stats_timestamp');
      if (lastFetch && Date.now() - Number(lastFetch) < 5 * 60 * 1000) {
        setLoading(false);
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
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
      setIsStale(false);
      isFetching.current = false;
    }
  }, [stats]);

  useEffect(() => {
    if (!user || activeTab !== 'dashboard') return;
    void (async () => { await fetchStats(); })();
  }, [user, activeTab, fetchStats]);

  if (authLoading || isStale || !stats) return <DashboardSkeleton />;
  if (!user) return null;

  const goToDashboardFresh = () => setActiveTab('dashboard');
  const refreshStats = () => { void (async () => { await fetchStats(true); })(); };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':           return <DashboardStats stats={stats} isInitialLoad={isInitialLoad} isStale={isStale} loading={loading} onRefresh={() => fetchStats(true)} />;
      case 'cash-in':             return <CashIn onSuccess={refreshStats} />;
      case 'cash-drop':           return <CashDrop onSuccess={refreshStats} />;
      case 'search-receipts':     return <SearchReceipts />;
      case 'cash-count':          return <CashCount onSuccess={() => { localStorage.setItem('cashier_menu_unlocked', 'false'); goToDashboardFresh(); }} />;
      case 'sales-dashboard':     return <SalesDashboard />;
      case 'items-report':        return <ItemsReport />;
      case 'x-reading':           return <XReading />;
      case 'z-reading':           return <ZReading />;
      case 'mall-accred':         return <MallAccredReport />;
      case 'menu-list':           return <MenuList />;
      case 'category-list':       return <CategoryList />;
      case 'sub-category-list':   return <SubCategoryList />;
      case 'inventory-dashboard': return <InventoryDashboard />;
      case 'inventory-list':      return <InventoryList />;
      case 'inventory-category':  return <InventoryCategoryList />;
      case 'supplier':            return <Supplier />;
      case 'item-checker':        return <ItemChecker />;
      case 'item-serials':        return <ItemSerials />;
      case 'purchase-order':      return <PurchaseOrder />;
      case 'stock-transfer':      return <StockTransfer />;
      case 'inventory-report':    return <InventoryReport />;
      case 'expense':             return <Expense />;
      case 'settings':            return <Settings />;
      default:                    return <DashboardStats stats={stats} isInitialLoad={isInitialLoad} isStale={isStale} loading={loading} onRefresh={() => fetchStats(true)} />;
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#f8f6ff] text-zinc-900 font-sans overflow-hidden">
      {/* Mobile topbar — same style as sidebar header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-zinc-200">
        <img src={logo} alt="Lucky Boba" className="h-8 w-auto object-contain" />
        <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 text-[#3b2063]">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
      </div>

      <Sidebar
        isSidebarOpen={isSidebarOpen}
        setSidebarOpen={setSidebarOpen}
        logo={logo}
        currentTab={activeTab}
        setCurrentTab={setActiveTab}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

// ─── DASHBOARD STATS ─────────────────────────────────────────────────────────
const DashboardStats = ({
  stats,
  isInitialLoad,
  isStale = false,
}: {
  stats: DashboardData | null;
  isInitialLoad: boolean;
  isStale?: boolean;
  loading: boolean;
  onRefresh: () => void;
}) => {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const isLoading = isInitialLoad || isStale;
  const fmt = (v: number) => `₱${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  return (
    <div className="p-6 md:p-8 md:pr-10 min-h-full flex flex-col gap-5">
      {/* ── BENTO GRID ── */}
      <div className="grid grid-cols-12 gap-3 md:gap-4">

        {/* ── HERO DATE/TIME — dark purple, col 1-5 ── */}
        <div className="col-span-12 md:col-span-5 bg-[#3b2063] rounded-3xl p-6 flex flex-col justify-between min-h-37">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[12px] font-black uppercase tracking-[0.3em] text-purple-300/60 mb-1">Lucky Boba · Main Branch</p>
              <p className="text-white font-black text-base uppercase tracking-wide leading-tight">
                {now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            {/* live dot — same pattern as sidebar's animated elements */}
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[12px] font-black uppercase tracking-widest text-purple-300/60">Live</span>
            </div>
          </div>
          <div className="flex items-end justify-between">
            <p className="text-white text-4xl font-black tracking-tight tabular-nums leading-none">
              {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          </div>
        </div>

        {/* ── NET SALES — white card, col 6-9 ── */}
        <div className="col-span-12 md:col-span-4 bg-white border border-zinc-100 rounded-3xl p-6 flex flex-col justify-between min-h-37 shadow-sm">
          <p className="text-[12px] font-black uppercase tracking-[0.3em] text-zinc-400">Total Sales (Net)</p>
          {isLoading
            ? <div className="h-9 w-40 rounded-xl animate-pulse bg-zinc-100" />
            : (
              <div>
                <p className="text-3xl md:text-4xl font-black text-[#3b2063] leading-none">
                  {fmt(stats?.total_sales_today ?? 0)}
                </p>
                <p className="text-[12px] font-black uppercase tracking-[0.25em] text-zinc-300 mt-2">Today's revenue</p>
              </div>
            )
          }
        </div>

        {/* ── ITEMS SOLD — soft purple tint, col 10-12 ── */}
        <div className="col-span-6 md:col-span-3 bg-[#f0ebff] border border-[#e0d8f0] rounded-3xl p-5 flex flex-col justify-between min-h-37">
          <p className="text-[12px] font-black uppercase tracking-[0.3em] text-[#3b2063]/50">Items Sold</p>
          {isLoading
            ? <div className="h-12 w-16 rounded-xl animate-pulse bg-[#3b2063]/10" />
            : (
              <div>
                <p className="text-5xl font-black text-[#3b2063] leading-none">{stats?.total_orders_today ?? 0}</p>
                <p className="text-[12px] font-black uppercase tracking-[0.25em] text-[#3b2063]/30 mt-1">orders today</p>
              </div>
            )
          }
        </div>

        {/* ── CASH IN — col 1-4 ── */}
        <div className="col-span-6 md:col-span-4 bg-white border border-zinc-100 rounded-3xl p-5 flex flex-col gap-3 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[15px] font-black uppercase tracking-[0.3em] text-zinc-400">Cash In</p>
            {/* icon pill — same rounded-xl style as sidebar active state */}
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="#22c55e" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
              </svg>
            </div>
          </div>
          {isLoading
            ? <div className="h-7 w-32 rounded-lg animate-pulse bg-zinc-100" />
            : <p className="text-xl font-black text-emerald-500">{fmt(stats?.cash_in_today ?? 0)}</p>
          }
        </div>

        {/* ── CASH OUT — col 5-8 ── */}
        <div className="col-span-6 md:col-span-4 bg-white border border-zinc-100 rounded-3xl p-5 flex flex-col gap-3 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[15px] font-black uppercase tracking-[0.3em] text-zinc-400">Cash Out</p>
            <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="#71717a" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
              </svg>
            </div>
          </div>
          {isLoading
            ? <div className="h-7 w-32 rounded-lg animate-pulse bg-zinc-100" />
            : <p className="text-xl font-black text-zinc-600">{fmt(stats?.cash_out_today ?? 0)}</p>
          }
        </div>

        {/* ── VOIDED — col 9-12 ── */}
        <div className="col-span-6 md:col-span-4 bg-white border border-zinc-100 rounded-3xl p-5 flex flex-col gap-3 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[15px] font-black uppercase tracking-[0.3em] text-zinc-400">Voided Today</p>
            <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="#ef4444" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
          {isLoading
            ? <div className="h-7 w-32 rounded-lg animate-pulse bg-zinc-100" />
            : <p className="text-xl font-black text-red-500">{fmt(stats?.voided_sales_today ?? 0)}</p>
          }
        </div>

        {/* ── TOP SELLERS TODAY — col 1-6 ── */}
        <div className="col-span-12 md:col-span-6 bg-white border border-zinc-100 rounded-3xl p-6 shadow-sm flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <p className="text-[15px] font-black uppercase tracking-[0.3em] text-zinc-400">Top 5 Sellers Today</p>
            {/* tag — mirrors sidebar sub-item active pill */}
            <span className="text-[12px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-400">Daily</span>
          </div>
          <TopSellerRows sellers={stats?.top_seller_today ?? []} loading={isLoading} variant="today" />
        </div>

        {/* ── TOP SELLERS ALL TIME — col 7-12 ── */}
        <div className="col-span-12 md:col-span-6 bg-white border border-zinc-100 rounded-3xl p-6 shadow-sm flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <p className="text-[15px] font-black uppercase tracking-[0.3em] text-zinc-400">Top 5 Sellers All Time</p>
            {/* tag — uses brand purple tint, same as sidebar active bg */}
            <span className="text-[12px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg bg-[#f0ebff] text-[#3b2063]">All Time</span>
          </div>
          <TopSellerRows sellers={stats?.top_seller_all_time ?? []} loading={isLoading} variant="alltime" />
        </div>

      </div>
    </div>
  );
};

// ─── TOP SELLER ROWS ──────────────────────────────────────────────────────────
const TopSellerRows = ({
  sellers,
  loading,
  variant,
}: {
  sellers: TopSeller[] | null;
  loading: boolean;
  variant: 'today' | 'alltime';
}) => {
  const list = sellers && sellers.length > 0 ? sellers.slice(0, 5) : null;
  const max = list ? Math.max(...list.map(s => s.total_qty)) : 1;

  if (loading) return (
    <div className="flex flex-col gap-4">
      {[1,2,3,4,5].map(i => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-lg animate-pulse bg-zinc-100 shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-3/4 rounded-md animate-pulse bg-zinc-100" />
            <div className="h-1 w-full rounded-full animate-pulse bg-zinc-100" />
          </div>
          <div className="w-12 h-4 rounded-md animate-pulse bg-zinc-100" />
        </div>
      ))}
    </div>
  );

  if (!list) return (
    <div className="flex-1 flex items-center justify-center py-8">
      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-300 italic">No data yet</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-3.5">
      {list.map((item, i) => (
        <div key={i}>
          <div className="flex items-center gap-3 mb-1.5">
            {/* rank badge — same shape language as sidebar active pill */}
            <span className={`w-6 h-6 shrink-0 flex items-center justify-center rounded-lg text-[10px] font-black
              ${i === 0 ? 'bg-[#3b2063] text-white' : 'bg-zinc-100 text-zinc-400'}`}>
              {i + 1}
            </span>
            <span className={`flex-1 text-[13px] font-black uppercase tracking-wider truncate
              ${i === 0 ? 'text-[#3b2063]' : 'text-zinc-500'}`}>
              {item.product_name}
            </span>
            <span className={`text-[13px] font-black tabular-nums
              ${variant === 'alltime' ? 'text-[#3b2063]' : 'text-emerald-500'}`}>
              {item.total_qty}
              <span className="text-[10px] font-black text-zinc-300 ml-1 uppercase tracking-wide">sold</span>
            </span>
          </div>
          {/* progress bar — uses brand colors */}
          <div className="ml-9 h-1 rounded-full bg-zinc-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${(item.total_qty / max) * 100}%`,
                background: i === 0
                  ? (variant === 'alltime' ? '#3b2063' : '#22c55e')
                  : (variant === 'alltime' ? '#c4b5d4' : '#86efac'),
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── SKELETON — mirrors sidebar's ghost structure exactly ────────────────────
const DashboardSkeleton = () => (
  <div className="flex h-screen bg-[#f8f6ff] font-sans">
    {/* sidebar ghost — exact same structure as real sidebar */}
    <div className="w-64 bg-white hidden md:flex flex-col border-r border-zinc-200 rounded-r-3xl overflow-hidden justify-between">
      <div className="flex flex-col flex-1">
        <div className="px-6 pt-10 flex flex-col items-center">
          <div className="w-40 h-10 rounded-xl bg-zinc-100 animate-pulse mb-2" />
          <div className="w-20 h-2 rounded bg-zinc-100 animate-pulse mb-8" />
        </div>
        <nav className="px-6 space-y-2 pb-6">
          {[1,2,3,4,5,6,7].map(i => (
            <div key={i} className="h-11 rounded-2xl bg-zinc-100 animate-pulse" />
          ))}
        </nav>
      </div>
      <div className="px-8 pb-8 pt-4 border-t border-zinc-50 space-y-3">
        <div className="h-16 rounded-2xl bg-[#f8f6ff] border border-zinc-100 animate-pulse" />
        <div className="h-12 rounded-2xl bg-zinc-100 animate-pulse" />
        <div className="h-3 w-32 rounded bg-zinc-100 animate-pulse mx-auto" />
      </div>
    </div>

    {/* content ghost */}
    <div className="flex-1 p-6 md:p-8 flex flex-col gap-5">
      {/* header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="h-8 w-44 rounded-2xl bg-white border border-zinc-100 animate-pulse" />
          <div className="h-2.5 w-32 rounded bg-zinc-100 animate-pulse" />
        </div>
        <div className="w-10 h-10 rounded-2xl bg-white border border-zinc-100 animate-pulse" />
      </div>

      {/* row 1 */}
      <div className="grid grid-cols-12 gap-3 md:gap-4">
        <div className="col-span-12 md:col-span-5 rounded-3xl bg-[#3b2063]/20 animate-pulse" style={{ minHeight: 148 }} />
        <div className="col-span-12 md:col-span-4 rounded-3xl bg-white border border-zinc-100 animate-pulse" style={{ minHeight: 148 }} />
        <div className="col-span-6 md:col-span-3 rounded-3xl bg-[#f0ebff] animate-pulse" style={{ minHeight: 148 }} />

        {/* row 2 */}
        {[1,2,3].map(i => (
          <div key={i} className="col-span-6 md:col-span-4 rounded-3xl bg-white border border-zinc-100 animate-pulse" style={{ minHeight: 100 }} />
        ))}

        {/* row 3 */}
        {[1,2].map(i => (
          <div key={i} className="col-span-12 md:col-span-6 rounded-3xl bg-white border border-zinc-100 animate-pulse" style={{ minHeight: 260 }} />
        ))}
      </div>
    </div>
  </div>
);

export default Dashboard;