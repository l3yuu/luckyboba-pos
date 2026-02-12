import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Added for navigation
import { useAuth } from '../hooks/useAuth'; // Import your auth hook

interface SidebarProps {
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  logo: string;
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isSidebarOpen, 
  setSidebarOpen, 
  logo, 
  currentTab, 
  setCurrentTab 
}) => {
  const { logout } = useAuth(); // Destructure logout from your hook
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // 3. FIX: Add the missing Date/Time state and helpers
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };
  
  // --- MENU DATA ---
  const posMenuItems = [
    { id: 'cash-in', label: 'Cash In' },
    { id: 'cash-drop', label: 'Cash Drop' },
    { id: 'menu', label: 'Menu' },
    { id: 'search-receipts', label: 'Search Receipts' },
    { id: 'cash-count', label: 'Cash Count EOD' },
  ];

  const salesReportItems = [
    { id: 'sales-dashboard', label: 'Dashboard' },
    { id: 'items-report', label: 'Items Report' },
    { id: 'x-reading', label: 'X Reading' },
    { id: 'z-reading', label: 'Z Reading' },
    { id: 'mall-accred', label: 'Mall Accred Report' },
  ];

  const menuManagementItems = [
    { id: 'menu-list', label: 'Menu List' },
    { id: 'category-list', label: 'Category List' },
    { id: 'sub-category-list', label: 'Sub-Category List' },
  ];

  const inventoryItems = [
    { id: 'inventory-dashboard', label: 'Dashboard' },
    { id: 'inventory-list', label: 'Inventory List' },
    { id: 'inventory-category', label: 'Category List' },
    { id: 'supplier', label: 'Supplier' },
    { id: 'item-checker', label: 'Item Checker' },
    { id: 'item-serials', label: 'Item Serials' },
    { id: 'purchase-order', label: 'Purchase Order' },
    { id: 'stock-transfer', label: 'Stock Transfer' },
    { id: 'inventory-report', label: 'Inventory Report' },
  ];

  // --- DROPDOWN STATES ---
  const [isPosDropdownOpen, setPosDropdownOpen] = useState(() => 
    posMenuItems.some(item => item.id === currentTab)
  );
  const [isSalesReportDropdownOpen, setSalesReportDropdownOpen] = useState(() => 
    salesReportItems.some(item => item.id === currentTab)
  );
  const [isMenuItemsDropdownOpen, setMenuItemsDropdownOpen] = useState(() => 
    menuManagementItems.some(item => item.id === currentTab)
  );
  const [isInventoryDropdownOpen, setInventoryDropdownOpen] = useState(() => 
    inventoryItems.some(item => item.id === currentTab)
  );

  // FIXED: Integrated useAuth logout and navigation
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout(); // Triggers the API call and clears user state
      navigate('/login', { replace: true }); // Redirects to login page
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const hoverClasses = 'hover:bg-[#f0ebff] hover:text-[#3b2063]';

  return (
    <>
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-zinc-200 
        transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 flex flex-col justify-between
        rounded-r-4xl md:rounded-r-3xl overflow-hidden
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* TOP SECTION: Logo and Navigation */}
        <div className="flex flex-col flex-1 overflow-y-auto no-scrollbar">
          <div className="px-6 pt-10 flex flex-col items-center shrink-0">
            <img src={logo} alt="Lucky Boba Logo" className="w-55 h-auto object-contain mb-2 hidden md:block" />
            <div className="text-[#3b2063] font-black uppercase text-[9px] tracking-[0.3em] opacity-60 mb-8 text-center">POS System</div>
          </div>
          
          <nav className="w-full px-6 space-y-2 pb-6">
            {/* 1. DASHBOARD */}
            <button
              onClick={() => {
                setCurrentTab('dashboard');
                if (window.innerWidth < 768) setSidebarOpen(false);
              }}
              className={`w-full px-5 py-3 rounded-2xl font-black text-[13px] uppercase tracking-wider flex items-center transition-all duration-200 ${
                currentTab === 'dashboard' ? 'bg-[#f0ebff] text-[#3b2063]' : `text-zinc-400 ${hoverClasses}`
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 mr-3"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" /></svg>
              Dashboard
            </button>

            {/* 2. POINT OF SALE */}
            <div className="w-full">
              <button
                onClick={() => setPosDropdownOpen(!isPosDropdownOpen)}
                className={`w-full px-5 py-3 rounded-2xl font-black text-[13px] uppercase tracking-wider flex items-center justify-between transition-all duration-200 ${
                  isPosDropdownOpen || posMenuItems.some(i => i.id === currentTab) ? 'text-[#3b2063] bg-[#f0ebff]' : `text-zinc-400 ${hoverClasses}`
                }`}
              >
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 mr-3"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.906.906 0 0 0 .906-.906v-4.438a.906.906 0 0 0-.906-.906H6.75a.906.906 0 0 0-.906.906v4.438a.906.906 0 0 0 .906.906Z" /></svg>
                  Point of Sale
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-3 h-3 transition-transform duration-300 ${isPosDropdownOpen ? 'rotate-180' : 'rotate-0'}`}><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
              </button>

              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isPosDropdownOpen ? 'max-h-64 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                <div className="flex flex-col space-y-1 pl-4 border-l-2 border-[#f0ebff] ml-5">
                  {posMenuItems.map((item) => (
                    <button key={item.id} onClick={() => { if (item.id === 'menu') navigate('/pos'); else setCurrentTab(item.id); if (window.innerWidth < 768) setSidebarOpen(false); }} className={`text-left px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-colors ${currentTab === item.id ? 'text-[#3b2063] bg-[#f0ebff]' : `text-zinc-400 ${hoverClasses}`}`}>{item.label}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. SALES REPORT */}
            <div className="w-full">
              <button
                onClick={() => setSalesReportDropdownOpen(!isSalesReportDropdownOpen)}
                className={`w-full px-5 py-3 rounded-2xl font-black text-[13px] uppercase tracking-wider flex items-center justify-between transition-all duration-200 ${
                  isSalesReportDropdownOpen || salesReportItems.some(i => i.id === currentTab) ? 'text-[#3b2063] bg-[#f0ebff]' : `text-zinc-400 ${hoverClasses}`
                }`}
              >
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 mr-3"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /></svg>
                  Sales Report
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-3 h-3 transition-transform duration-300 ${isSalesReportDropdownOpen ? 'rotate-180' : 'rotate-0'}`}><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
              </button>

              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isSalesReportDropdownOpen ? 'max-h-64 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                <div className="flex flex-col space-y-1 pl-4 border-l-2 border-[#f0ebff] ml-5">
                  {salesReportItems.map((item) => (
                    <button key={item.id} onClick={() => { setCurrentTab(item.id); if (window.innerWidth < 768) setSidebarOpen(false); }} className={`text-left px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-colors ${currentTab === item.id ? 'text-[#3b2063] bg-[#f0ebff]' : `text-zinc-400 ${hoverClasses}`}`}>{item.label}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* 4. MENU ITEMS */}
            <div className="w-full">
              <button
                onClick={() => setMenuItemsDropdownOpen(!isMenuItemsDropdownOpen)}
                className={`w-full px-5 py-3 rounded-2xl font-black text-[13px] uppercase tracking-wider flex items-center justify-between transition-all duration-200 ${
                  isMenuItemsDropdownOpen || menuManagementItems.some(i => i.id === currentTab) ? 'text-[#3b2063] bg-[#f0ebff]' : `text-zinc-400 ${hoverClasses}`
                }`}
              >
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 mr-3"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" /></svg>
                  Menu Items
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-3 h-3 transition-transform duration-300 ${isMenuItemsDropdownOpen ? 'rotate-180' : 'rotate-0'}`}><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
              </button>

              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isMenuItemsDropdownOpen ? 'max-h-64 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                <div className="flex flex-col space-y-1 pl-4 border-l-2 border-[#f0ebff] ml-5">
                  {menuManagementItems.map((item) => (
                    <button key={item.id} onClick={() => { setCurrentTab(item.id); if (window.innerWidth < 768) setSidebarOpen(false); }} className={`text-left px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-colors ${currentTab === item.id ? 'text-[#3b2063] bg-[#f0ebff]' : `text-zinc-400 ${hoverClasses}`}`}>{item.label}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* 5. EXPENSE */}
            <button
              onClick={() => { setCurrentTab('expense'); if (window.innerWidth < 768) setSidebarOpen(false); }}
              className={`w-full px-5 py-3 rounded-2xl font-black text-[13px] uppercase tracking-wider flex items-center transition-all duration-200 ${
                currentTab === 'expense' ? 'bg-[#f0ebff] text-[#3b2063]' : `text-zinc-400 ${hoverClasses}`
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 mr-3"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" /></svg>
              Expense
            </button>

            {/* 6. INVENTORY */}
            <div className="w-full">
              <button
                onClick={() => setInventoryDropdownOpen(!isInventoryDropdownOpen)}
                className={`w-full px-5 py-3 rounded-2xl font-black text-[13px] uppercase tracking-wider flex items-center justify-between transition-all duration-200 ${
                  isInventoryDropdownOpen || inventoryItems.some(i => i.id === currentTab) ? 'text-[#3b2063] bg-[#f0ebff]' : `text-zinc-400 ${hoverClasses}`
                }`}
              >
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 mr-3"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
                  Inventory
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-3 h-3 transition-transform duration-300 ${isInventoryDropdownOpen ? 'rotate-180' : 'rotate-0'}`}><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
              </button>

              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isInventoryDropdownOpen ? 'max-h-125 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                <div className="flex flex-col space-y-1 pl-4 border-l-2 border-[#f0ebff] ml-5">
                  {inventoryItems.map((item) => (
                    <button key={item.id} onClick={() => { setCurrentTab(item.id); if (window.innerWidth < 768) setSidebarOpen(false); }} className={`text-left px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-colors ${currentTab === item.id ? 'text-[#3b2063] bg-[#f0ebff]' : `text-zinc-400 ${hoverClasses}`}`}>{item.label}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* 7. SETTINGS */}
            <button
              onClick={() => {
                setCurrentTab('settings');
                if (window.innerWidth < 768) setSidebarOpen(false);
              }}
              className={`w-full px-5 py-3 rounded-2xl font-black text-[13px] uppercase tracking-wider flex items-center transition-all duration-200 ${
                currentTab === 'settings' ? 'bg-[#f0ebff] text-[#3b2063]' : `text-zinc-400 ${hoverClasses}`
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 mr-3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.559.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.929.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527a1.125 1.125 0 0 1-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.272-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
              Settings
            </button>
          </nav>
        </div>

        {/* BOTTOM SECTION: Time, Logout, Copyright */}
        <div className="shrink-0 bg-white border-t border-zinc-50">
          <div className="px-8 pt-6 pb-2">
            <div className="bg-[#f8f6ff] rounded-2xl p-4 text-center border border-zinc-100">
              <div className="text-[11px] font-black uppercase text-[#3b2063] tracking-wider mb-1">{formatDate(currentDate)}</div>
              <div className="text-lg font-black text-slate-700 tracking-tight">{formatTime(currentDate)}</div>
            </div>
          </div>
        </div>
        <div className="px-8 pb-8 flex flex-col gap-6 bg-white pt-4 z-10">
          <button 
            onClick={handleLogout} 
            disabled={isLoggingOut} 
            className="flex items-center justify-center w-full px-6 py-4 rounded-2xl bg-[#be2525] hover:bg-[#a11f1f] text-white text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-200 shadow-md shadow-red-900/10 disabled:opacity-70 disabled:cursor-not-allowed group"
          >
            {isLoggingOut ? (
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4 mr-3 group-hover:-translate-x-1 transition-transform">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
                Logout
              </>
            )}
          </button>
          <div className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 text-center">Lucky Boba &copy; 2026</div>
        </div>

        <button onClick={() => setSidebarOpen(false)} className="md:hidden absolute top-4 right-4 text-zinc-400 text-xs font-bold">CLOSE</button>
      </aside>

      {isSidebarOpen && <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden" onClick={() => setSidebarOpen(false)} />}
    </>
  );
};

export default Sidebar;