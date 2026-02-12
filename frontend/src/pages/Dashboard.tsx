import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Sidebar from "../components/Sidebar";
import logo from '../assets/logo.png';
import api from '../services/api'; 
import type { DashboardData, TopSeller } from '../types/dashboard';

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
import MenuList from '../components/Menu Items/MenuList';
import CategoryList from '../components/Menu Items/CategoryList';
import SubCategoryList from '../components/Menu Items/Sub-CategoryList';

// --- Import Expense Component ---
import Expense from '../components/Expense';

// --- Import Inventory Components ---
import InventoryDashboard from '../components/Inventory/InventoryDashboard';
import InventoryCategoryList from '../components/Inventory/InventoryCategoryList';
import InventoryList from '../components/Inventory/InventoryList';
import InventoryReport from '../components/Inventory/InventoryReport';
import ItemChecker from '../components/Inventory/ItemChecker';
import ItemSerials from '../components/Inventory/ItemSerials';
import PurchaseOrder from '../components/Inventory/PurchaseOrder';
import StockTransfer from '../components/Inventory/StockTransfer';
import Supplier from '../components/Inventory/Supplier';

// --- Import Settings Component ---
import Settings from '../components/Settings';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  
  const isFetching = useRef(false);

  // AUTH CHECK
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { replace: true });
    }
  }, [user, authLoading, navigate]);

  // BACKEND FETCH LOGIC
  const fetchStats = useCallback(async (isManual = false) => {
    if (isFetching.current) return;
    if (isManual || !stats) setLoading(true);

    isFetching.current = true;
    try {
      const response = await api.get('/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, [stats]); 

  useEffect(() => {
    if (user && activeTab === 'dashboard' && !stats) {
      fetchStats();
    }
  }, [user, activeTab, stats, fetchStats]);

  if (authLoading) return <DashboardSkeleton />;
  if (!user) return null;

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardStats stats={stats} loading={loading} />;
      
      // POS TABS
      case 'cash-in': return <CashIn onSuccess={() => fetchStats(true)} />;
      case 'cash-drop': return <CashDrop onSuccess={() => fetchStats(true)} />;
      case 'search-receipts': return <SearchReceipts />;
      case 'cash-count': return <CashCount />;

      // SALES REPORT
      case 'sales-dashboard': return <SalesDashboard />;
      case 'items-report': return <ItemsReport />;
      case 'x-reading': return <XReading />;
      case 'z-reading': return <ZReading />;
      case 'mall-accred': return <MallAccredReport />;

      // MENU ITEMS
      case 'menu-list': return <MenuList />;
      case 'category-list': return <CategoryList />;
      case 'sub-category-list': return <SubCategoryList />;

      // INVENTORY
      case 'inventory-dashboard': return <InventoryDashboard />;
      case 'inventory-list': return <InventoryList />;
      case 'inventory-category': return <InventoryCategoryList />;
      case 'supplier': return <Supplier />;
      case 'item-checker': return <ItemChecker />;
      case 'item-serials': return <ItemSerials />;
      case 'purchase-order': return <PurchaseOrder />;
      case 'stock-transfer': return <StockTransfer />;
      case 'inventory-report': return <InventoryReport />;

      case 'expense': return <Expense />;
      case 'settings': return <Settings />;

      default:
        return <DashboardStats stats={stats} loading={loading} />;
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#f8f6ff] text-zinc-900 font-sans overflow-hidden">
      {/* Mobile Header */}
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
        {activeTab === 'dashboard' && (
          <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 md:px-10 py-6 md:py-8 gap-4">
            <div>
              <h1 className="text-xl md:text-4xl font-black text-[#3b2063] uppercase tracking-tight">Dashboard</h1>
              <p className="text-zinc-400 font-bold text-[9px] md:text-[10px] uppercase tracking-[0.2em] mt-1">Performance Summary</p>
            </div>
            
            <button 
                onClick={() => fetchStats(true)} 
                disabled={loading}
                className={`p-3 rounded-2xl bg-white border border-zinc-100 shadow-sm transition-all active:scale-95 ${loading ? 'opacity-50' : 'hover:bg-zinc-50'}`}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                strokeWidth={2.5} 
                stroke="#3b2063" 
                className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </button>
          </header>
        )}
        <div className="flex-1 overflow-y-auto">
           {renderContent()}
        </div>
      </main>
    </div>
  );
};

// --- Updated UI Components with Backend Logic ---

const DashboardStats = ({ stats, loading }: { stats: DashboardData | null, loading: boolean }) => {
  const cards = [
    { label: "Cash in today", value: stats?.cash_in_today ?? 0 },
    { label: "Cash out today", value: stats?.cash_out_today ?? 0 },
    { label: "Total Sales", value: stats?.total_sales_today ?? 0, highlight: true },
    { label: "Total items", value: stats?.total_orders_today ?? 0, isCurrency: false },
  ];

  return (
    <section className="flex-1 px-6 md:px-10 pb-10">
      <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((stat, i) => (
          <div key={i} className="rounded-3xl md:rounded-4xl border border-zinc-100 bg-white shadow-sm p-5 md:p-6 flex flex-col justify-between min-h-27.5 md:min-h-32.5">
            <p className="text-[12px] md:text-[13px] font-black uppercase tracking-[0.2em] text-zinc-400">{stat.label}</p>
            <p className={`text-xl md:text-2xl font-black ${stat.highlight ? 'text-emerald-500' : 'text-[#3b2063]'} ${loading && !stats ? 'animate-pulse opacity-20' : ''}`}>
              {stat.isCurrency === false ? stat.value : `₱${Number(stat.value).toLocaleString(undefined, {minimumFractionDigits: 2})}`}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-6 md:mt-8 grid gap-4 md:gap-6 grid-cols-1 xl:grid-cols-2">
        <TopSellerList title="Top seller for today" seller={stats?.top_seller_today ?? null} loading={loading && !stats} />
        <TopSellerList title="Top seller all time" seller={stats?.top_seller_all_time ?? null} loading={loading && !stats} />
      </div>
    </section>
  );
};

const TopSellerList = ({ title, seller, loading }: { title: string, seller: TopSeller | null, loading: boolean }) => (
  <div className="rounded-3xl md:rounded-[2.5rem] border border-zinc-100 bg-white shadow-sm p-6 md:p-8 min-h-45 md:min-h-55 flex flex-col">
    <p className="text-[12px] md:text-[15px] font-black uppercase tracking-[0.25em] text-zinc-400 mb-4 md:mb-6">{title}</p>
    <div className={`flex-1 flex flex-col justify-center gap-3 ${loading ? 'opacity-20 animate-pulse' : ''}`}>
      {seller ? (
        <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
           <p className="font-bold text-[#3b2063] text-lg">#1 {seller.product_name}</p>
           <p className="text-emerald-500 font-bold">{seller.total_qty} Sold</p>
        </div>
      ) : (
        [1, 2, 3].map((rank) => (
          <div key={rank} className="flex items-center justify-between border-b border-zinc-100 pb-2">
            <p className="font-bold text-zinc-500">#{rank}</p>
            <p className="text-zinc-300 font-semibold italic">No data</p>
          </div>
        ))
      )}
    </div>
  </div>
);

const DashboardSkeleton = () => (
  <div className="flex h-screen bg-[#f8f6ff] animate-pulse">
    <div className="w-64 bg-white hidden md:block border-r" />
    <div className="flex-1 p-10">
      <div className="h-10 w-48 bg-zinc-200 rounded-lg mb-4" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-white rounded-4xl border" />)}
      </div>
    </div>
  </div>
);

export default Dashboard;