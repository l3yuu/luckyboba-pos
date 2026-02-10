import { useState, useEffect } from 'react';
import Sidebar from "../components/Sidebar";
import logo from '../assets/logo.png';
import SalesOrder from '../components/SalesOrder';
import CashIn from '../components/CashIn';
import api from '../services/api'; // Import your existing api service
import type { DashboardData, TopSeller } from '../types/dashboard';

const Dashboard = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch data from DashboardController
  const fetchStats = async () => {
    setLoading(true);
    try {
      // Change /api/dashboard to /api/dashboard/stats
      const response = await api.get('/api/dashboard/stats'); 
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch data whenever we switch to the dashboard tab
  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchStats();
    }
  }, [activeTab]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardStats stats={stats} loading={loading} />;
      case 'sales': 
      case 'menu':  
        return <SalesOrder />;
      case 'cash-in':
        return <CashIn />;
      case 'cash-drop':
      case 'search-receipts':
      case 'cash-count':
        return <PlaceholderPage title={activeTab.replace('-', ' ')} />;
      default:
        return <DashboardStats stats={stats} loading={loading} />;
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#f8f6ff] text-zinc-900 font-sans overflow-hidden">
      
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-zinc-200">
        <img src={logo} alt="Logo" className="h-8 w-auto object-contain" />
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
            {/* Refresh Button - helpful for testing */}
            <button 
                onClick={fetchStats} 
                className={`p-3 rounded-2xl bg-white border border-zinc-100 shadow-sm transition-all ${loading ? 'animate-spin' : 'hover:bg-zinc-50'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="#3b2063" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </button>
          </header>
        )}

        {renderContent()}
      </main>
    </div>
  );
};

// --- Updated Sub-components ---

const DashboardStats = ({ stats, loading }: { stats: DashboardData | null, loading: boolean }) => {
  const cards = [
    { label: "Cash in today", value: stats?.cash_in_today ?? 0 },
    { label: "Cash out today", value: stats?.cash_out_today ?? 0 },
    { label: "Total Sales", value: stats?.total_sales_today ?? 0, highlight: true },
    { label: "Total items", value: stats?.total_orders_today ?? 0, isCurrency: false },
  ];

  return (
    <section className="flex-1 px-6 md:px-10 pb-10 overflow-auto">
      <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((stat, i) => (
          <div key={i} className="rounded-3xl md:rounded-4xl border border-zinc-100 bg-white shadow-sm p-5 md:p-6 flex flex-col justify-between min-h-27.5 md:min-h-32.5">
            <p className="text-[12px] md:text-[13px] font-black uppercase tracking-[0.2em] text-zinc-400">{stat.label}</p>
            <p className={`text-xl md:text-2xl font-black ${stat.highlight ? 'text-emerald-500' : 'text-[#3b2063]'} ${loading ? 'opacity-30' : ''}`}>
              {stat.isCurrency === false ? stat.value : `₱${Number(stat.value).toLocaleString(undefined, {minimumFractionDigits: 2})}`}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 md:mt-8 grid gap-4 md:gap-6 grid-cols-1 xl:grid-cols-2">
        <TopSellerCard title="Top seller for today" seller={stats?.top_seller_today ?? null} loading={loading} />
        <TopSellerCard title="Top seller all time" seller={stats?.top_seller_all_time ?? null} loading={loading} />
      </div>
    </section>
  );
};

const TopSellerCard = ({ title, seller, loading }: { title: string, seller: TopSeller | null, loading: boolean }) => (
  <div className="rounded-3xl md:rounded-[2.5rem] border border-zinc-100 bg-white shadow-sm p-6 md:p-8 min-h-45 md:min-h-55 flex flex-col">
    <p className="text-[12px] md:text-[15px] font-black uppercase tracking-[0.25em] text-zinc-400 mb-4 md:mb-6">{title}</p>
    <div className={`flex-1 flex flex-col justify-center ${loading ? 'opacity-30' : ''}`}>
      {seller ? (
        <>
          <p className="text-2xl md:text-3xl font-black text-[#3b2063]">{seller.product_name}</p>
          <p className="text-emerald-500 font-bold uppercase text-[10px] tracking-widest mt-2">{seller.total_qty} Units Sold</p>
        </>
      ) : (
        <>
          <p className="text-2xl md:text-3xl font-black text-zinc-100">—</p>
          <p className="text-[10px] md:text-[11px] font-bold text-zinc-300 uppercase tracking-widest mt-2">Data currently unavailable</p>
        </>
      )}
    </div>
  </div>
);

const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="flex-1 flex flex-col items-center justify-center p-10 text-center animate-in fade-in">
    <div className="w-20 h-20 bg-[#f0ebff] rounded-full flex items-center justify-center mb-6">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#3b2063" className="w-10 h-10 opacity-50">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
      </svg>
    </div>
    <h2 className="text-2xl font-black text-[#3b2063] uppercase tracking-tight mb-2">{title}</h2>
    <p className="text-zinc-400 uppercase tracking-widest text-xs font-bold">Module under construction</p>
  </div>
);

export default Dashboard;