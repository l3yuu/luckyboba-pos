import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Sidebar from "../components/Sidebar";
import logo from '../assets/logo.png';
import SalesOrder from '../pages/SalesOrder';
import CashIn from '../components/CashIn';
import api from '../services/api'; 
import type { DashboardData, TopSeller } from '../types/dashboard';
import CashDrop from '../components/CashDrop';
import SearchReceipts from '../components/SearchReceipts';
import CashCount from '../components/CashCount'; 

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  
  const isFetching = useRef(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const fetchStats = useCallback(async (isManual = false) => {
    // Prevent multiple concurrent requests
    if (isFetching.current) return;
    
    if (isManual || !stats) {
      setLoading(true);
    }

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
      case 'sales': 
      case 'menu':   
        return <SalesOrder />;
      case 'cash-in':
        return <CashIn onSuccess={() => fetchStats(true)} />;
      case 'cash-drop':
        return <CashDrop onSuccess={() => fetchStats(true)} />;
      case 'search-receipts':
        return <SearchReceipts />;
      case 'cash-count':
        return <CashCount />;
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

const DashboardSkeleton = () => (
  <div className="flex h-screen bg-[#f8f6ff] animate-pulse">
    <div className="w-64 bg-white hidden md:block border-r" />
    <div className="flex-1 p-10">
      <div className="h-10 w-48 bg-zinc-200 rounded-lg mb-4" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-white rounded-3xl border" />)}
      </div>
    </div>
  </div>
);

const DashboardStats = ({ stats, loading }: { stats: DashboardData | null, loading: boolean }) => {
  const cards = [
    { label: "Cash in today", value: stats?.cash_in_today ?? 0 },
    { label: "Cash out today", value: stats?.cash_out_today ?? 0 },
    { label: "Total Sales", value: stats?.total_sales_today ?? 0, highlight: true },
    { label: "Total items", value: stats?.total_orders_today ?? 0, isCurrency: false },
  ];

  return (
    <section className="px-6 md:px-10 pb-10">
      <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((stat, i) => (
          <div key={i} className="rounded-3xl border border-zinc-100 bg-white shadow-sm p-5 md:p-6 flex flex-col justify-between min-h-27.5 md:min-h-32.5">
            <p className="text-[12px] font-black uppercase tracking-[0.2em] text-zinc-400">{stat.label}</p>
            <p className={`text-xl md:text-2xl font-black ${stat.highlight ? 'text-emerald-500' : 'text-[#3b2063]'} ${loading && !stats ? 'animate-pulse opacity-20' : ''}`}>
              {stat.isCurrency === false ? stat.value : `₱${Number(stat.value).toLocaleString(undefined, {minimumFractionDigits: 2})}`}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-6 md:mt-8 grid gap-4 md:gap-6 grid-cols-1 xl:grid-cols-2">
        <TopSellerCard title="Top seller for today" seller={stats?.top_seller_today ?? null} loading={loading && !stats} />
        <TopSellerCard title="Top seller all time" seller={stats?.top_seller_all_time ?? null} loading={loading && !stats} />
      </div>
    </section>
  );
};

const TopSellerCard = ({ title, seller, loading }: { title: string, seller: TopSeller | null, loading: boolean }) => (
  <div className="rounded-3xl border border-zinc-100 bg-white shadow-sm p-6 md:p-8 min-h-45 flex flex-col">
    <p className="text-[12px] font-black uppercase tracking-[0.25em] text-zinc-400 mb-4">{title}</p>
    <div className={`flex-1 flex flex-col justify-center ${loading ? 'opacity-20 animate-pulse' : ''}`}>
      {seller ? (
        <>
          <p className="text-2xl md:text-3xl font-black text-[#3b2063]">{seller.product_name}</p>
          <p className="text-emerald-500 font-bold uppercase text-[10px] tracking-widest mt-2">{seller.total_qty} Units Sold</p>
        </>
      ) : (
        <p className="text-zinc-300 font-bold uppercase tracking-widest mt-2">Data unavailable</p>
      )}
    </div>
  </div>
);

export default Dashboard;