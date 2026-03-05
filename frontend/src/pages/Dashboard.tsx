import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Sidebar from "../components/Sidebar";
import logo from '../assets/logo.png';
import api from '../services/api'; 
import type { DashboardData, TopSeller } from '../types/dashboard';
import { 
  Monitor, 
  DollarSign,
  Receipt,
  ArrowDownToLine,
  ArrowUpFromLine,
  Ban,
  Trophy,
  Clock4,
  RefreshCw,
} from 'lucide-react';

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

interface DashboardStatsProps {
  stats: DashboardData | null;
  isInitialLoad: boolean;
  isStale?: boolean;
  loading: boolean;
  onRefresh: () => void;
}

// Global font injection
const GlobalFont = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
    body, .dashboard-root { font-family: 'DM Sans', sans-serif !important; }
  `}</style>
);

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
  const [isStale, setIsStale] = useState(() => {
    const ts = localStorage.getItem('dashboard_stats_timestamp');
    if (!ts) return true;
    return Date.now() - Number(ts) > 5 * 60 * 1000;
  });
  
  const isFetching = useRef(false);

  useEffect(() => {
    if (!authLoading && !user) navigate('/login', { replace: true });
  }, [user, authLoading, navigate]);

  const fetchStats = useCallback(async (force = false) => {
    if (isFetching.current) return;
    if (!force && stats) {
      const lastFetch = localStorage.getItem('dashboard_stats_timestamp');
      if (lastFetch && Date.now() - Number(lastFetch) < 5 * 60 * 1000) {
        setLoading(false);
        setIsInitialLoad(false);
        setIsStale(false);
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
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
      isFetching.current = false;
    }
  }, [stats]);

  useEffect(() => {
    if (!user || activeTab !== 'dashboard') return;
    void (async () => { await fetchStats(); })();
  }, [user, activeTab, fetchStats]);

  if (authLoading || (isInitialLoad && !stats)) return <DashboardSkeleton />;
  if (!user) return null;

  const refreshStats = () => { void (async () => { await fetchStats(true); })(); };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':           return <DashboardStats stats={stats} isInitialLoad={isInitialLoad} isStale={isStale} loading={loading} onRefresh={() => fetchStats(true)} />;
      case 'cash-in':             return <CashIn onSuccess={refreshStats} />;
      case 'cash-drop':           return <CashDrop onSuccess={refreshStats} />;
      case 'search-receipts':     return <SearchReceipts />;
      case 'cash-count':          return <CashCount onSuccess={() => setActiveTab('dashboard')} />;
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
    <>
      <GlobalFont />
      <div className="dashboard-root flex flex-col md:flex-row h-screen bg-[#f3f0ff] text-zinc-900 overflow-hidden" style={{fontFamily: "'DM Sans', sans-serif"}}>
        <Sidebar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} logo={logo} currentTab={activeTab} setCurrentTab={setActiveTab} />
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </>
  );
};

const DashboardStats = ({ stats, isInitialLoad, isStale = false, loading, onRefresh }: DashboardStatsProps) => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const isLoading = isInitialLoad || isStale || loading;
  const fmt = (v: number) => `₱${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  return (
    <div className="p-4 md:p-6 lg:p-7 min-h-full flex flex-col gap-4" style={{fontFamily: "'DM Sans', sans-serif"}}>
      <div className="grid grid-cols-12 gap-3">

        {/* TERMINAL STATUS */}
        <div className="col-span-12 lg:col-span-5 bg-[#2a174a] rounded-none p-6 flex flex-col justify-between border border-[#1a0f2e] min-h-[160px]">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
               <div className="p-2 text-white"><Monitor size={20} strokeWidth={1.5}/></div>
               <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-white mb-0.5">Terminal Status</p>
                  <p className="text-white font-semibold text-sm tracking-wide tabular-nums">
                    {time.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
               </div>
            </div>
            <button onClick={onRefresh} className="p-2 text-white hover:text-white transition-colors">
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>
          <div className="flex items-end justify-between border-t border-white/10 pt-4">
            <p className="text-white text-5xl font-bold tracking-tight tabular-nums leading-none">
              {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
            </p>
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 mb-1">
               <span className="w-1.5 h-1.5 bg-emerald-400 animate-pulse rounded-full" />
               <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-400">Online</span>
            </div>
          </div>
        </div>

        {/* NET REVENUE */}
        <div className="col-span-12 md:col-span-6 lg:col-span-4 bg-white border border-zinc-300 rounded-none p-6 flex flex-col justify-between min-h-[160px]">
          <div className="flex items-center gap-4">
            <div className="p-2 text-[#7c3aed]"><DollarSign size={20} strokeWidth={1.5}/></div>
            <p className="text-[12px] font-extrabold uppercase tracking-[0.2em] text-zinc-700">Net Revenue</p>
          </div>
          <div className="mt-4">
            {isLoading ? <div className="h-8 w-32 bg-zinc-100 animate-pulse rounded-none" /> : (
              <>
                <p className="text-4xl font-extrabold text-[#1a0f2e] tracking-tight tabular-nums leading-none">{fmt(stats?.total_sales_today ?? 0)}</p>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-600 mt-2">Active Shift Data</p>
              </>
            )}
          </div>
        </div>

        {/* TRANSACTIONS */}
        <div className="col-span-12 md:col-span-6 lg:col-span-3 bg-white border border-zinc-300 rounded-none p-6 flex flex-col justify-between min-h-[160px]">
          <div className="flex items-center gap-4">
            <div className="p-2 text-[#7c3aed]"><Receipt size={20} strokeWidth={1.5}/></div>
            <p className="text-[12px] font-extrabold uppercase tracking-[0.2em] text-zinc-700">Transactions</p>
          </div>
          {isLoading ? <div className="h-16 w-16 bg-zinc-100 animate-pulse rounded-none mt-4" /> : (
            <p className="text-7xl font-extrabold text-[#1a0f2e] tracking-tight leading-none tabular-nums mt-4">{stats?.total_orders_today ?? 0}</p>
          )}
        </div>
      </div>

      {/* STRIP METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <MetricStrip icon={<ArrowUpFromLine size={17} className="text-emerald-600" strokeWidth={1.5}/>} label="Begin Cash" value={fmt(stats?.cash_in_today ?? 0)} isLoading={isLoading} />
          <MetricStrip icon={<ArrowDownToLine size={17} className="text-zinc-500" strokeWidth={1.5}/>} label="Cash Out" value={fmt(stats?.cash_out_today ?? 0)} isLoading={isLoading} />
          <MetricStrip icon={<Ban size={17} className="text-red-400" strokeWidth={1.5}/>} label="Voided" value={fmt(stats?.voided_sales_today ?? 0)} color="text-red-600" isLoading={isLoading} />
      </div>

      {/* TOP SELLERS */}
      <div className="grid grid-cols-12 gap-3 flex-1">
        <div className="col-span-12 lg:col-span-6 bg-white border border-zinc-300 rounded-none p-8 flex flex-col shadow-sm" style={{minHeight: '420px'}}>
          <div className="flex items-center gap-4 border-b-2 border-zinc-100 pb-4 mb-4 shrink-0">
             <div className="p-2 text-[#7c3aed]"><Trophy size={18} strokeWidth={1.5}/></div>
             <p className="text-[12px] font-extrabold uppercase tracking-[0.2em] text-zinc-700">Top Sellers Today</p>
          </div>
          <TopSellerRows sellers={stats?.top_seller_today ?? []} loading={isLoading} />
        </div>

        <div className="col-span-12 lg:col-span-6 bg-white border border-zinc-300 rounded-none p-8 flex flex-col shadow-sm" style={{minHeight: '420px'}}>
          <div className="flex items-center gap-4 border-b-2 border-zinc-100 pb-4 mb-4 shrink-0">
             <div className="p-2 text-[#7c3aed]"><Clock4 size={18} strokeWidth={1.5}/></div>
             <p className="text-[12px] font-extrabold uppercase tracking-[0.2em] text-zinc-700">Terminal History · All Time</p>
          </div>
          <TopSellerRows sellers={stats?.top_seller_all_time ?? []} loading={isLoading} />
        </div>
      </div>
    </div>
  );
};

interface MetricStripProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color?: string;
  isLoading: boolean;
}

const MetricStrip = ({ icon, label, value, color = "text-[#1a0f2e]", isLoading }: MetricStripProps) => (
    <div className="bg-white border border-zinc-300 rounded-none p-5 flex items-center justify-between shadow-sm" style={{fontFamily: "'DM Sans', sans-serif"}}>
        <div className="flex items-center gap-3">{icon}<p className="text-[12px] font-extrabold uppercase tracking-[0.15em] text-zinc-700">{label}</p></div>
        {isLoading 
            ? <div className="h-4 w-24 animate-pulse bg-zinc-100 rounded-none" /> 
            : <p className={`text-lg font-extrabold tracking-tight tabular-nums ${color}`}>{value}</p>
        }
    </div>
);

interface TopSellerRowsProps {
  sellers: TopSeller[] | null;
  loading: boolean;
}

const TopSellerRows = ({ sellers, loading }: TopSellerRowsProps) => {
  const list = sellers?.slice(0, 5) || [];
  const max = list.length ? Math.max(...list.map((s) => s.total_qty)) : 1;
  // Always render 5 slots
  const slots = Array.from({ length: 5 }, (_, i) => list[i] || null);
  if (loading) return (
    <div className="flex flex-col flex-1 h-full">
      {[1,2,3,4,5].map(i => <div key={i} className="flex-1 bg-zinc-50 animate-pulse border-b border-zinc-100" />)}
    </div>
  );
  return (
    <div className="flex flex-col flex-1" style={{fontFamily: "'DM Sans', sans-serif"}}>
      {slots.map((item, i: number) => (
        <div key={i} className="flex-1 flex flex-col justify-center border-b border-zinc-100 last:border-b-0 py-3 px-1">
          {item ? (
            <>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-4">
                  <span className="text-[11px] font-bold text-zinc-600 tabular-nums w-5">0{i+1}</span>
                  <span className="text-[13px] font-extrabold text-[#1a0f2e] truncate max-w-[260px]">{item.product_name}</span>
                </div>
                <span className="text-[11px] font-bold tabular-nums text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-none">{item.total_qty} sold</span>
              </div>
              <div className="h-[2px] bg-zinc-100 overflow-hidden">
                <div className="h-full bg-[#3b2063] transition-all duration-1000" style={{ width: `${(item.total_qty / max) * 100}%` }} />
              </div>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <span className="text-[11px] font-bold text-zinc-500 tabular-nums w-5">0{i+1}</span>
              <span className="text-[12px] font-semibold text-zinc-500">—</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const DashboardSkeleton = () => (
  <div className="flex h-screen bg-[#f3f0ff] overflow-hidden" style={{fontFamily: "'DM Sans', sans-serif"}}>
    <div className="w-64 bg-white border-r border-zinc-200 hidden md:flex flex-col rounded-none justify-between">
      <div className="flex-col flex-1 px-4 pt-12">
        <div className="flex flex-col items-center mb-12">
          <div className="w-40 h-10 bg-zinc-100 animate-pulse rounded-none mb-4" />
          <div className="w-24 h-3 bg-zinc-50 animate-pulse rounded-none" />
        </div>
        <nav className="space-y-1">
          {[1,2,3,4,5].map(i => <div key={i} className="w-full h-14 bg-zinc-50/50 border-b border-zinc-50 animate-pulse rounded-none" />)}
        </nav>
      </div>
      <div className="p-6 bg-white border-t border-zinc-100"><div className="w-full h-14 bg-red-50/50 animate-pulse rounded-none" /></div>
    </div>
    <div className="flex-1 p-6 md:p-8 flex flex-col gap-5">
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-12 lg:col-span-5 h-[160px] bg-zinc-200/60 animate-pulse rounded-none" />
        <div className="col-span-12 md:col-span-6 lg:col-span-4 h-[160px] bg-white animate-pulse rounded-none border border-zinc-200" />
        <div className="col-span-12 md:col-span-6 lg:col-span-3 h-[160px] bg-white animate-pulse rounded-none border border-zinc-200" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[1,2,3].map(i => <div key={i} className="h-20 bg-white border border-zinc-200 animate-pulse rounded-none" />)}
      </div>
      <div className="grid grid-cols-12 gap-3 flex-1">
        <div className="col-span-6 h-full bg-white border border-zinc-200 animate-pulse rounded-none" />
        <div className="col-span-6 h-full bg-white border border-zinc-200 animate-pulse rounded-none" />
      </div>
    </div>
  </div>
);

export default Dashboard;