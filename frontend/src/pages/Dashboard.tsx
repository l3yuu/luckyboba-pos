import { useState } from 'react';
import Sidebar from "../components/Sidebar";
import logo from '../assets/logo.png';

// --- Import POS Components ---
import CashIn from '../components/CashIn'; 
import CashDrop from '../components/CashDrop';
import SearchReceipts from '../components/SearchReceipts';
import CashCount from '../components/CashCount';

// --- Import Sales Report Components ---
import SalesDashboard from '../components/SalesDashboard';
import ItemsReport from '../components/ItemsReport';
import XReading from '../components/XReading';
import ZReading from '../components/ZReading';
import MallAccredReport from '../components/MallAccredReport';

// --- Import New Menu Management Components ---
import MenuList from '../components/MenuList';
import CategoryList from '../components/CategoryList';
import SubCategoryList from '../components/Sub-CategoryList'; // Assuming file is named "Sub-CategoryList.tsx"

const Dashboard = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      // --- MAIN DASHBOARD (Default) ---
      case 'dashboard':
        return <DashboardStats />;

      // --- POS TABS ---
      case 'cash-in':
        return <CashIn />;
      case 'cash-drop':
        return <CashDrop />;
      case 'search-receipts':
        return <SearchReceipts />;
      case 'cash-count':
        return <CashCount />;

      // --- SALES REPORT TABS ---
      case 'sales-dashboard':
        return <SalesDashboard />;
      case 'items-report':
        return <ItemsReport />;
      case 'x-reading':
        return <XReading />;
      case 'z-reading':
        return <ZReading />;
      case 'mall-accred':
        return <MallAccredReport />;

      // --- MENU ITEMS TABS (New) ---
      case 'menu-list':
        return <MenuList />;
      case 'category-list':
        return <CategoryList />;
      case 'sub-category-list':
        return <SubCategoryList />;

      // --- FALLBACK ---
      default:
        return <DashboardStats />;
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#f8f6ff] text-zinc-900 font-sans overflow-hidden">
      
      {/* --- Mobile Header --- */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-zinc-200">
        <img src={logo} alt="Logo" className="h-8 w-auto object-contain" />
        <button 
          onClick={() => setSidebarOpen(!isSidebarOpen)}
          className="p-2 text-[#3b2063]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
      </div>

      {/* --- Sidebar --- */}
      <Sidebar 
        isSidebarOpen={isSidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        logo={logo} 
        currentTab={activeTab}
        setCurrentTab={setActiveTab}
      />

      {/* --- Main Content Area --- */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Only show the Header for the MAIN Dashboard view */}
        {activeTab === 'dashboard' && (
          <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 md:px-10 py-6 md:py-8 gap-4">
            <div>
              <h1 className="text-xl md:text-4xl font-black text-[#3b2063] uppercase tracking-tight">
                Dashboard
              </h1>
              <p className="text-zinc-400 font-bold text-[9px] md:text-[10px] uppercase tracking-[0.2em] mt-1">
                Performance Summary
              </p>
            </div>
          </header>
        )}

        {/* Dynamic Content Rendering */}
        {renderContent()}
      </main>
    </div>
  );
};

// --- Sub-components for cleaner code ---

const DashboardStats = () => (
  <section className="flex-1 px-6 md:px-10 pb-10 overflow-auto">
    <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {[
        { label: "Cash in", value: "₱0.00" },
        { label: "Cash out", value: "₱0.00" },
        { label: "Total Sales", value: "₱0.00", highlight: true },
        { label: "Total items", value: "0" },
      ].map((stat, i) => (
        <div key={i} className="rounded-[1.5rem] md:rounded-[2rem] border border-zinc-100 bg-white shadow-sm p-5 md:p-6 flex flex-col justify-between min-h-[110px] md:min-h-[130px]">
          <p className="text-[12px] md:text-[13px] font-black uppercase tracking-[0.2em] text-zinc-400">
            {stat.label}
          </p>
          <p className={`text-xl md:text-2xl font-black ${stat.highlight ? 'text-emerald-500' : 'text-[#3b2063]'}`}>
            {stat.value}
          </p>
        </div>
      ))}
    </div>

    <div className="mt-6 md:mt-8 grid gap-4 md:gap-6 grid-cols-1 xl:grid-cols-2">
      {[
        { title: "Top seller for today" },
        { title: "Top seller all time" }
      ].map((card, i) => (
        <div key={i} className="rounded-[1.5rem] md:rounded-[2.5rem] border border-zinc-100 bg-white shadow-sm p-6 md:p-8 min-h-[180px] md:min-h-[220px] flex flex-col">
          <p className="text-[12px] md:text-[15px] font-black uppercase tracking-[0.25em] text-zinc-400 mb-4 md:mb-6">
            {card.title}
          </p>
          <div className="flex-1 flex flex-col justify-center">
            <p className="text-2xl md:text-3xl font-black text-zinc-100">—</p>
            <p className="text-[10px] md:text-[11px] font-bold text-zinc-300 uppercase tracking-widest mt-2">
              Data currently unavailable
            </p>
          </div>
        </div>
      ))}
    </div>
  </section>
);

export default Dashboard;