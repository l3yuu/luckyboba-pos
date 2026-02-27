import { useState, useEffect } from 'react';
import BranchManagerSidebar from '../components/BranchManagerSidebar';
import logo from '../assets/logo.png';
import CashierManagement from '../components/CashierManager';
import api from '../services/api';

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

// ─── Types ────────────────────────────────────────────────────────────────────

interface TopSellerItem {
  product_name: string;
  total_qty: number;
}

interface DashboardStats {
  cash_in_today: number;
  cash_out_today: number;
  total_sales_today: number;
  total_orders_today: number;
  voided_sales_today: number;
  top_seller_today: TopSellerItem[];
  top_seller_all_time: TopSellerItem[];
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const BranchManagerDashboard = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':         return <DashboardStatsPanel />;
      case 'users':             return <CashierManagement />;
      case 'sales-dashboard':   return <SalesDashboard />;
      case 'items-report':      return <ItemsReport />;
      case 'x-reading':         return <XReading />;
      case 'z-reading':         return <ZReading />;
      case 'mall-accred':       return <MallAccredReport />;
      case 'menu-list':         return <MenuList />;
      case 'category-list':     return <CategoryList />;
      case 'sub-category-list': return <SubCategoryList />;
      case 'inventory-dashboard': return <InventoryDashboard />;
      case 'inventory-list':    return <InventoryList />;
      case 'inventory-category':return <InventoryCategoryList />;
      case 'supplier':          return <Supplier />;
      case 'item-checker':      return <ItemChecker />;
      case 'item-serials':      return <ItemSerials />;
      case 'purchase-order':    return <PurchaseOrder />;
      case 'stock-transfer':    return <StockTransfer />;
      case 'inventory-report':  return <InventoryReport />;
      case 'settings':          return <Settings />;
      default:                  return <DashboardStatsPanel />;
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#f8f6ff] text-zinc-900 font-sans overflow-hidden">
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-zinc-200">
        <img src={logo} alt="Logo" className="h-8 w-auto object-contain" />
        <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 text-[#3b2063]">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
      </div>

      <BranchManagerSidebar
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
              <h1 className="text-xl md:text-4xl font-black text-[#3b2063] uppercase tracking-tight">Branch Manager</h1>
              <p className="text-zinc-400 font-bold text-[9px] md:text-[10px] uppercase tracking-[0.2em] mt-1">Overview & User Management</p>
            </div>
          </header>
        )}
        <div className="flex-1 overflow-auto">{renderContent()}</div>
      </main>
    </div>
  );
};

// ─── Dashboard Stats Panel ────────────────────────────────────────────────────

const DashboardStatsPanel = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<DashboardStats>('/dashboard/stats')
      .then(res => setStats(res.data))
      .catch(err => {
        console.error('Dashboard fetch failed:', err);
        setError('Failed to load dashboard data.');
      })
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n: number) =>
    `₱${Number(n ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  if (loading) {
    return (
      <section className="flex-1 px-4 sm:px-6 md:px-10 pb-6 sm:pb-8 md:pb-10 overflow-auto">
        {/* Stat card skeletons */}
        <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="rounded-2xl sm:rounded-3xl border border-zinc-100 bg-white shadow-sm p-3 sm:p-4 md:p-5 lg:p-6 flex flex-col justify-between min-h-24 sm:min-h-28 md:min-h-32 lg:min-h-40 animate-pulse">
              <div className="h-3 bg-zinc-100 rounded w-1/2" />
              <div className="h-7 bg-zinc-100 rounded w-3/4 mt-4" />
            </div>
          ))}
        </div>
        {/* Top seller skeletons */}
        <div className="mt-4 sm:mt-6 md:mt-8 grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 xl:grid-cols-2">
          {[1, 2].map(i => (
            <div key={i} className="rounded-2xl sm:rounded-3xl border border-zinc-100 bg-white shadow-sm p-4 sm:p-5 md:p-6 lg:p-8 min-h-40 sm:min-h-44 md:min-h-48 lg:min-h-64 animate-pulse">
              <div className="h-3 bg-zinc-100 rounded w-1/3 mb-6" />
              {[1, 2, 3, 4, 5].map(r => (
                <div key={r} className="h-4 bg-zinc-100 rounded mb-3" />
              ))}
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="flex-1 px-4 sm:px-6 md:px-10 pb-6 overflow-auto flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 font-bold text-sm">{error}</p>
          <button
            onClick={() => { setError(null); setLoading(true); api.get<DashboardStats>('/dashboard/stats').then(r => setStats(r.data)).catch(() => setError('Failed to load dashboard data.')).finally(() => setLoading(false)); }}
            className="mt-3 text-xs font-bold text-[#3b2063] underline underline-offset-2"
          >
            Retry
          </button>
        </div>
      </section>
    );
  }

  const statCards = [
    { label: 'Cash In',      value: fmt(stats?.cash_in_today ?? 0),    highlight: false },
    { label: 'Cash Out',     value: fmt(stats?.cash_out_today ?? 0),   highlight: false },
    { label: 'Total Sales',  value: fmt(stats?.total_sales_today ?? 0), highlight: true },
    { label: 'Total Orders', value: String(stats?.total_orders_today ?? 0), highlight: false },
  ];

  const topLists = [
    { title: 'Top Seller For Today',  items: stats?.top_seller_today    ?? [] },
    { title: 'Top Seller All Time',   items: stats?.top_seller_all_time ?? [] },
  ];

  return (
    <section className="flex-1 px-4 sm:px-6 md:px-10 pb-6 sm:pb-8 md:pb-10 overflow-auto">
      {/* Stat Cards */}
      <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, i) => (
          <div
            key={i}
            className="rounded-2xl sm:rounded-3xl md:rounded-4xl border border-zinc-100 bg-white shadow-sm p-3 sm:p-4 md:p-5 lg:p-6 flex flex-col justify-between min-h-24 sm:min-h-28 md:min-h-32 lg:min-h-40"
          >
            <p className="text-[10px] sm:text-[11px] md:text-[12px] lg:text-[13px] font-black uppercase tracking-widest text-zinc-400">
              {stat.label}
            </p>
            <p className={`text-lg sm:text-xl md:text-2xl font-black ${stat.highlight ? 'text-emerald-500' : 'text-[#3b2063]'}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Top Seller Tables */}
      <div className="mt-4 sm:mt-6 md:mt-8 grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 xl:grid-cols-2">
        {topLists.map(({ title, items }) => (
          <div
            key={title}
            className="rounded-2xl sm:rounded-3xl md:rounded-[2.5rem] border border-zinc-100 bg-white shadow-sm p-4 sm:p-5 md:p-6 lg:p-8 min-h-40 sm:min-h-44 md:min-h-48 lg:min-h-64 flex flex-col"
          >
            <p className="text-[10px] sm:text-[12px] md:text-[13px] lg:text-[15px] font-black uppercase tracking-widest text-zinc-400 mb-3 sm:mb-4 md:mb-6">
              {title}
            </p>
            <div className="flex-1 flex flex-col justify-center gap-2 sm:gap-3">
              {[0, 1, 2, 3, 4].map((idx) => {
                const item = items[idx];
                return (
                  <div key={idx} className="flex items-center justify-between border-b border-zinc-100 pb-1 sm:pb-2">
                    <p className="font-bold text-zinc-500 text-xs sm:text-sm">#{idx + 1}</p>
                    {item ? (
                      <div className="flex items-center gap-2">
                        <p className="text-zinc-700 font-semibold text-xs sm:text-sm">{item.product_name}</p>
                        <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                          {item.total_qty} sold
                        </span>
                      </div>
                    ) : (
                      <p className="text-zinc-300 font-semibold text-xs sm:text-sm">Data unavailable</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default BranchManagerDashboard;