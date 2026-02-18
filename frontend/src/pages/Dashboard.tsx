  import { useState, useEffect, useCallback, useRef } from 'react';
  import { useNavigate } from 'react-router-dom';
  import { useAuth } from '../hooks/useAuth';
  import Sidebar from "../components/Sidebar";
  import logo from '../assets/logo.png';
  import api from '../services/api'; 
  import type { DashboardData, TopSeller } from '../types/dashboard';
  

  // --- Import POS Components ---
  import CashIn from '../components/SalesOrder/CashIn'; 
  import CashDrop from '../components/SalesOrder/CashDrop';
  import SearchReceipts from '../components/SalesOrder/SearchReceipts';
  import CashCount from '../components/SalesOrder/CashCount';

  // --- Import Sales Report Components ---
  import SalesDashboard from '../components/SalesReport/SalesDashboard';
  import ItemsReport from '../components/SalesReport/ItemsReport';
  import XReading from '../components/SalesReport/XReading';
  import ZReading from '../components/SalesReport/ZReading';
  import MallAccredReport from '../components/SalesReport/MallAccredReport';

  // --- Import Menu Management Components ---
  import MenuList from '../components/MenuItems/MenuList';
  import CategoryList from '../components/MenuItems/CategoryList';
  import SubCategoryList from '../components/MenuItems/Sub-CategoryList';

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
    
    // Load stats from localStorage immediately for instant display
    const [stats, setStats] = useState<DashboardData | null>(() => {
      const cached = localStorage.getItem('dashboard_stats');
      const timestamp = localStorage.getItem('dashboard_stats_timestamp');
      
      if (cached && timestamp) {
        const age = Date.now() - parseInt(timestamp);
        if (age < 120000) {
          return JSON.parse(cached);
        }
      }
      return null;
    });
    
    const [loading, setLoading] = useState(!stats);
    const [isInitialLoad, setIsInitialLoad] = useState(!stats); // Track if it's the first load
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
    
    // If it's a manual refresh or we're forcing an update, show loading
    if (isManual) setLoading(true);

    isFetching.current = true;
    try {
      const response = await api.get('/dashboard/stats');
      const newStats = response.data;
      
      setStats(newStats);
      setIsInitialLoad(false); 
      
      localStorage.setItem('dashboard_stats', JSON.stringify(newStats));
      localStorage.setItem('dashboard_stats_timestamp', Date.now().toString());
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setIsInitialLoad(false);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, []); 

  useEffect(() => {
    if (user && activeTab === 'dashboard') {
      fetchStats(true); 
    }
  }, [user, activeTab, fetchStats]);

  useEffect(() => {
    const checkRefresh = () => {
      const needsRefresh = localStorage.getItem('dashboard_needs_refresh');
      if (needsRefresh === 'true' && activeTab === 'dashboard') {
        localStorage.removeItem('dashboard_needs_refresh');
        localStorage.removeItem('dashboard_stats_timestamp');
        fetchStats(true);
      }
    };

    checkRefresh();
    // Listen for storage changes in case voiding happens in another window
    window.addEventListener('storage', checkRefresh);
    return () => window.removeEventListener('storage', checkRefresh);
  }, [activeTab, fetchStats]);

    if (authLoading) return <DashboardSkeleton />;
    if (!user) return null;

    const renderContent = () => {
      switch (activeTab) {
        case 'dashboard':
          return <DashboardStats stats={stats} loading={loading} isInitialLoad={isInitialLoad} />;
        
        case 'search-receipts': 
          return <SearchReceipts onSuccess={() => {
            localStorage.removeItem('dashboard_stats_timestamp');
            fetchStats(true);
          }} />;

        case 'cash-in': 
          return <CashIn onSuccess={() => {
            localStorage.removeItem('dashboard_stats_timestamp');
            fetchStats(true);
            // Instant unlock by switching to dashboard or menu
            setActiveTab('dashboard'); 
          }} />;

        case 'cash-drop': 
          return <CashDrop onSuccess={() => {
            localStorage.removeItem('dashboard_stats_timestamp');
            fetchStats(true);
          }} />;

        // --- UPDATED CASH COUNT LOGIC ---
        case 'cash-count': 
          return <CashCount onSuccess={() => {
            // 1. Clear the stats cache so the dashboard reflects the final numbers
            localStorage.removeItem('dashboard_stats_timestamp');
            
            // 2. Fetch the latest stats to confirm the EOD record exists in the DB
            fetchStats(true);

            // 3. Force the Sidebar to re-check EOD status by "pinging" the activeTab
            // This will trigger the Sidebar's useEffect which monitors [currentTab]
            setActiveTab('dashboard'); 

            // Optional: You can also manually set a local flag if you want zero-latency
            localStorage.setItem('cashier_menu_unlocked', 'false');
          }} />;

        case 'sales-dashboard': return <SalesDashboard />;
        case 'items-report': return <ItemsReport />;
        case 'x-reading': return <XReading />;
        case 'z-reading': return <ZReading />;
        case 'mall-accred': return <MallAccredReport />;
        case 'menu-list': return <MenuList />;
        case 'category-list': return <CategoryList />;
        case 'sub-category-list': return <SubCategoryList />;
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
          return <DashboardStats stats={stats} loading={loading} isInitialLoad={isInitialLoad} />;
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
                  onClick={() => {
                    localStorage.removeItem('dashboard_stats_timestamp');
                    fetchStats(true);
                  }} 
                  disabled={loading}
                  className={`p-3 rounded-2xl bg-white border border-zinc-100 shadow-sm transition-all active:scale-95 ${loading ? 'opacity-50' : 'hover:bg-zinc-50'}`}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  strokeWidth={2.5} 
                  stroke="#3b2063" 
                  className={`w-4 h-4 transition-transform ${loading ? 'animate-spin' : ''}`}
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

  // --- UPDATED DashboardStats with Skeleton Loading ---
// ... (keep all your imports and Dashboard component logic exactly the same)

const DashboardStats = ({ 
  stats, 
  isInitialLoad 
}: { 
  stats: DashboardData | null; 
  loading: boolean;
  isInitialLoad: boolean;
}) => {
  // We define the cards here. 
  // 'total_sales_today' and 'total_orders_today' are now the NET values (voids already subtracted by backend)
const cards = [
  { label: "Cash in today", value: stats?.cash_in_today ?? 0 },
  { label: "Cash out today", value: stats?.cash_out_today ?? 0 },
  { label: "Total Sales (Net)", value: stats?.total_sales_today ?? 0, highlight: true },
  { label: "Total items", value: stats?.total_orders_today ?? 0, isCurrency: false },
  // This matches the property you just added to the interface
  { label: "Voided today", value: stats?.voided_sales_today ?? 0, isVoid: true }, 
];

  return (
    <section className="flex-1 px-6 md:px-10 pb-10">
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .skeleton-shimmer {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 8px;
        }
      `}</style>

      {/* Changed grid to cols-5 to fit the void card, or keep it responsive */}
      <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((stat, i) => (
          <div 
            key={i} 
            className={`rounded-3xl md:rounded-4xl border border-zinc-100 bg-white shadow-sm p-5 md:p-6 flex flex-col justify-between min-h-27.5 md:min-h-32.5 transition-all duration-300 ${stat.highlight ? 'border-emerald-100 bg-emerald-50/30' : ''}`}
          >
            <p className={`text-[12px] md:text-[13px] font-black uppercase tracking-[0.2em] ${stat.isVoid ? 'text-red-400' : 'text-zinc-400'}`}>
              {stat.label}
            </p>
            
            {isInitialLoad ? (
              <div className="h-8 skeleton-shimmer" />
            ) : (
              <p className={`text-xl md:text-2xl font-black transition-all duration-500 ${
                stat.highlight ? 'text-emerald-500' : 
                stat.isVoid ? 'text-red-500' : 'text-[#3b2063]'
              }`}>
                {stat.isCurrency === false ? stat.value : `₱${Number(stat.value).toLocaleString(undefined, {minimumFractionDigits: 2})}`}
              </p>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-6 md:mt-8 grid gap-4 md:gap-6 grid-cols-1 xl:grid-cols-2">
        <TopSellerList title="Top 5 sellers today" sellers={stats?.top_seller_today ?? []} loading={isInitialLoad} />
        <TopSellerList title="Top 5 sellers all time" sellers={stats?.top_seller_all_time ?? []} loading={isInitialLoad} />
      </div>
    </section>
  );
};

const TopSellerList = ({ 
  title, 
  sellers, 
  loading 
}: { 
  title: string; 
  sellers: TopSeller[] | null; // Changed from single object to array
  loading: boolean;
}) => (
  <div className="rounded-3xl md:rounded-[2.5rem] border border-zinc-100 bg-white shadow-sm p-6 md:p-8 min-h-45 md:min-h-55 flex flex-col transition-all duration-300">
    <p className="text-[12px] md:text-[15px] font-black uppercase tracking-[0.25em] text-zinc-400 mb-4 md:mb-6">{title}</p>
    <div className="flex-1 flex flex-col justify-start gap-4">
      {loading ? (
        [1, 2, 3, 4, 5].map((rank) => (
          <div key={rank} className="flex items-center justify-between border-b border-zinc-50 pb-2">
            <div className="h-6 w-32 skeleton-shimmer" />
            <div className="h-6 w-16 skeleton-shimmer" />
          </div>
        ))
      ) : sellers && sellers.length > 0 ? (
        // Map through the top 5 sellers
        sellers.slice(0, 5).map((item, index) => (
          <div key={index} className="flex items-center justify-between border-b border-zinc-50 pb-2 transition-all duration-500 last:border-0">
             <p className={`font-bold text-sm md:text-base ${index === 0 ? 'text-[#3b2063]' : 'text-zinc-600'}`}>
               <span className="text-zinc-400 mr-2 font-black">#{index + 1}</span>
               {item.product_name}
             </p>
             <p className="text-emerald-500 font-bold text-sm md:text-base">{item.total_qty} Sold</p>
          </div>
        ))
      ) : (
        [1, 2, 3].map((rank) => (
          <div key={rank} className="flex items-center justify-between border-b border-zinc-50 pb-2">
            <p className="font-bold text-zinc-500">#{rank}</p>
            <p className="text-zinc-300 font-semibold italic">No data</p>
          </div>
        ))
      )}
    </div>
  </div>
);

// ... (keep DashboardSkeleton and export default Dashboard exactly as is)

  const DashboardSkeleton = () => (
    <div className="flex h-screen bg-[#f8f6ff]">
      {/* Sidebar skeleton - matches your actual sidebar */}
      <div className="w-64 bg-white hidden md:flex flex-col border-r border-zinc-200 rounded-r-3xl overflow-hidden">
        {/* Logo area */}
        <div className="px-6 pt-10 flex flex-col items-center shrink-0">
          <div className="w-40 h-12 bg-zinc-200 rounded-lg mb-2 animate-pulse" />
          <div className="w-24 h-3 bg-zinc-200 rounded mb-8 animate-pulse" />
        </div>
        
        {/* Navigation skeleton */}
        <nav className="w-full px-6 space-y-2 pb-6 flex-1">
          {[1, 2, 3, 4, 5, 6, 7].map(i => (
            <div key={i} className="h-12 bg-zinc-100 rounded-2xl animate-pulse" />
          ))}
        </nav>
        
        {/* Bottom section skeleton */}
        <div className="shrink-0 bg-white border-t border-zinc-50 px-8 pt-6 pb-8">
          <div className="bg-[#f8f6ff] rounded-2xl p-4 mb-6 border border-zinc-100">
            <div className="h-4 bg-zinc-200 rounded mb-2 animate-pulse" />
            <div className="h-6 bg-zinc-200 rounded animate-pulse" />
          </div>
          <div className="h-14 bg-zinc-200 rounded-2xl mb-4 animate-pulse" />
          <div className="h-3 bg-zinc-200 rounded animate-pulse mx-auto w-32" />
        </div>
      </div>
      
      {/* Main content skeleton */}
      <div className="flex-1 p-10">
        <div className="h-10 w-48 bg-zinc-200 rounded-lg mb-4 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-white rounded-4xl border border-zinc-100 p-6 animate-pulse">
              <div className="h-4 w-24 bg-zinc-200 rounded mb-4" />
              <div className="h-8 w-32 bg-zinc-200 rounded" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-8">
          {[1, 2].map(i => (
            <div key={i} className="h-55 bg-white rounded-4xl border border-zinc-100 p-8 animate-pulse">
              <div className="h-4 w-40 bg-zinc-200 rounded mb-6" />
              <div className="space-y-3">
                {[1, 2, 3].map(j => (
                  <div key={j} className="flex justify-between items-center">
                    <div className="h-6 w-32 bg-zinc-200 rounded" />
                    <div className="h-6 w-16 bg-zinc-200 rounded" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  export default Dashboard;