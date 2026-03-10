import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';

interface BranchManagerSidebarProps {
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  logo: string;
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

const BranchManagerSidebar: React.FC<BranchManagerSidebarProps> = ({ 
  isSidebarOpen, 
  setSidebarOpen, 
  logo, 
  currentTab, 
  setCurrentTab 
}) => {
  const { logout } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // --- MENU DATA ---
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
  const [isSalesReportDropdownOpen, setSalesReportDropdownOpen] = useState(() =>
    salesReportItems.some(item => item.id === currentTab)
  );
  const [isMenuItemsDropdownOpen, setMenuItemsDropdownOpen] = useState(() =>
    menuManagementItems.some(item => item.id === currentTab)
  );
  const [isInventoryDropdownOpen, setInventoryDropdownOpen] = useState(() =>
    inventoryItems.some(item => item.id === currentTab)
  );

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

  const handleLogout = async () => {
    await logout(); // calls /logout on server + clears AUTH_KEYS via clearSession()
    ['cashier_menu_unlocked', 'cashier_lock_date'].forEach(k => localStorage.removeItem(k));
    sessionStorage.clear();
    window.location.href = '/login';
  };

  const handleLogoutClick = () => {
    setIsLogoutModalOpen(true);
  };

  const confirmLogout = () => {
    handleLogout();
  };

  const cancelLogout = () => {
    setIsLogoutModalOpen(false);
  };

  const hoverClasses = 'hover:bg-[#f0ebff] hover:text-[#3b2063]';

  return (
    <>
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-56 sm:w-64 bg-white border-r border-zinc-200 
        transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 flex flex-col justify-between
        rounded-r-3xl md:rounded-r-4xl overflow-hidden
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* TOP SECTION: Logo and Navigation */}
        <div className="flex flex-col flex-1 overflow-y-auto no-scrollbar">
          <div className="px-4 sm:px-6 pt-8 sm:pt-10 flex flex-col items-center shrink-0">
            <img src={logo} alt="Lucky Boba Logo" className="w-40 sm:w-55 h-auto object-contain mb-2 hidden md:block" />
            <div className="text-[#3b2063] font-black uppercase text-[8px] sm:text-[9px] tracking-[0.3em] opacity-60 mb-2 text-center">Branch Manager</div>
            <div className="bg-[#fbbf24] text-[#3b2063] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider mb-6 sm:mb-8">Branch Control</div>
          </div>

          <nav className="w-full px-4 sm:px-6 space-y-2 pb-6">    
            {/* 1. DASHBOARD */}
            <button
              onClick={() => {
                setCurrentTab('dashboard');
                if (window.innerWidth < 768) setSidebarOpen(false);
              }}
              className={`w-full px-3 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-black text-[11px] sm:text-[13px] uppercase tracking-wider flex items-center transition-all duration-200 ${
                currentTab === 'dashboard' ? 'bg-[#f0ebff] text-[#3b2063]' : `text-zinc-400 ${hoverClasses}`
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 sm:w-4 h-3.5 sm:h-4 mr-2 sm:mr-3"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6ZM14 6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2V6ZM4 16a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2ZM14 16a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-2Z" /></svg>
              Dashboard
            </button>

            {/* 2. USER MANAGEMENT */}
            <button
              onClick={() => {
                setCurrentTab('users');
                if (window.innerWidth < 768) setSidebarOpen(false);
              }}
              className={`w-full px-5 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-[12px] uppercase tracking-wider flex items-center transition-all duration-200 ${
                currentTab === 'users' ? 'bg-[#f0ebff] text-[#3b2063]' : `text-zinc-400 ${hoverClasses}`
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 sm:w-4 h-3.5 sm:h-4 mr-2 sm:mr-3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
              </svg>
              User Management
            </button>

            {/* 3. SALES REPORT */}
            <div className="space-y-1">
              <button
                onClick={() => setSalesReportDropdownOpen(!isSalesReportDropdownOpen)}
                className={`w-full px-5 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-[12px] uppercase tracking-wider flex items-center justify-between transition-all duration-200 ${
                  salesReportItems.some(item => item.id === currentTab) ? 'bg-[#f0ebff] text-[#3b2063]' : `text-zinc-400 ${hoverClasses}`
                }`}
              >
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 sm:w-4 h-3.5 sm:h-4 mr-2 sm:mr-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Sales Report
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-3 h-3 transition-transform duration-200 ${isSalesReportDropdownOpen ? 'rotate-180' : ''}`}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isSalesReportDropdownOpen && (
                <div className="ml-4 sm:ml-6 space-y-1">
                  {salesReportItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setCurrentTab(item.id);
                        if (window.innerWidth < 768) setSidebarOpen(false);
                      }}
                      className={`w-full px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-black text-[9px] sm:text-[10px] uppercase tracking-wider flex items-center transition-all duration-200 ${
                        currentTab === item.id ? 'bg-[#f0ebff] text-[#3b2063]' : `text-zinc-400 ${hoverClasses}`
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 4. MENU ITEMS */}
            <div className="space-y-1">
              <button
                onClick={() => setMenuItemsDropdownOpen(!isMenuItemsDropdownOpen)}
                className={`w-full px-5 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-[12px] uppercase tracking-wider flex items-center justify-between transition-all duration-200 ${
                  menuManagementItems.some(item => item.id === currentTab) ? 'bg-[#f0ebff] text-[#3b2063]' : `text-zinc-400 ${hoverClasses}`
                }`}
              >
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 sm:w-4 h-3.5 sm:h-4 mr-2 sm:mr-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  Menu Items
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-3 h-3 transition-transform duration-200 ${isMenuItemsDropdownOpen ? 'rotate-180' : ''}`}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isMenuItemsDropdownOpen && (
                <div className="ml-4 sm:ml-6 space-y-1">
                  {menuManagementItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setCurrentTab(item.id);
                        if (window.innerWidth < 768) setSidebarOpen(false);
                      }}
                      className={`w-full px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-black text-[9px] sm:text-[10px] uppercase tracking-wider flex items-center transition-all duration-200 ${
                        currentTab === item.id ? 'bg-[#f0ebff] text-[#3b2063]' : `text-zinc-400 ${hoverClasses}`
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 5. INVENTORY */}
            <div className="space-y-1">
              <button
                onClick={() => setInventoryDropdownOpen(!isInventoryDropdownOpen)}
                className={`w-full px-5 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-[12px] uppercase tracking-wider flex items-center justify-between transition-all duration-200 ${
                  inventoryItems.some(item => item.id === currentTab) ? 'bg-[#f0ebff] text-[#3b2063]' : `text-zinc-400 ${hoverClasses}`
                }`}
              >
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 sm:w-4 h-3.5 sm:h-4 mr-2 sm:mr-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                  </svg>
                  Inventory
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-3 h-3 transition-transform duration-200 ${isInventoryDropdownOpen ? 'rotate-180' : ''}`}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isInventoryDropdownOpen && (
                <div className="ml-4 sm:ml-6 space-y-1">
                  {inventoryItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setCurrentTab(item.id);
                        if (window.innerWidth < 768) setSidebarOpen(false);
                      }}
                      className={`w-full px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-black text-[9px] sm:text-[10px] uppercase tracking-wider flex items-center transition-all duration-200 ${
                        currentTab === item.id ? 'bg-[#f0ebff] text-[#3b2063]' : `text-zinc-400 ${hoverClasses}`
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 6. SETTINGS */}
            <button
              onClick={() => {
                setCurrentTab('settings');
                if (window.innerWidth < 768) setSidebarOpen(false);
              }}
              className={`w-full px-5 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-[12px] uppercase tracking-wider flex items-center transition-all duration-200 ${
                currentTab === 'settings' ? 'bg-[#f0ebff] text-[#3b2063]' : `text-zinc-400 ${hoverClasses}`
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 sm:w-4 h-3.5 sm:h-4 mr-2 sm:mr-3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </button>
          </nav>
        </div>

        {/* BOTTOM SECTION: Time, Logout, Copyright */}
        <div className="shrink-0 bg-white border-t border-zinc-50">
          <div className="px-6 sm:px-8 pt-4 sm:pt-6 pb-2">
            <div className="bg-[#f8f6ff] rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center border border-zinc-100">
              <div className="text-[9px] sm:text-[11px] font-black uppercase text-[#3b2063] tracking-wider mb-1">{formatDate(currentDate)}</div>
              <div className="text-sm sm:text-lg font-black text-slate-700 tracking-tight">{formatTime(currentDate)}</div>
            </div>
          </div>

          <div className="px-6 sm:px-8 pb-6 sm:pb-8 flex flex-col gap-3 sm:gap-4">
            <button
              onClick={handleLogoutClick}
              className="flex items-center justify-center w-full px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-[#be2525] hover:bg-[#a11f1f] text-white text-[9px] sm:text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-200 shadow-md shadow-red-900/10 group"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3.5 sm:w-4 h-3.5 sm:h-4 mr-2 sm:mr-3 group-hover:-translate-x-1 transition-transform">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
              Logout
            </button>
            <div className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-zinc-400 text-center">Lucky Boba &copy; 2026</div>
          </div>
        </div>

        <button onClick={() => setSidebarOpen(false)} className="md:hidden absolute top-3 sm:top-4 right-3 sm:right-4 text-zinc-400 text-[9px] sm:text-xs font-bold">CLOSE</button>
      </aside>

      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* --- Logout Confirmation Modal --- */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-red-500 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
              <h2 className="text-white font-black text-[9px] sm:text-[10px] uppercase tracking-[0.2em]">Confirm Logout</h2>
              <button onClick={cancelLogout} className="text-white/70 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-red-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-800">Logout from System?</h3>
                <p className="text-sm text-slate-600">Are you sure you want to logout from the Branch Manager system?</p>
                <p className="text-xs text-zinc-500">You will need to login again to access the system.</p>
              </div>
              <div className="flex gap-2 sm:gap-3 pt-2">
                <button
                  onClick={confirmLogout}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 sm:py-3 rounded-xl font-black text-[9px] sm:text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                  </svg>
                  Logout
                </button>
                <button onClick={cancelLogout} className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-500 py-2 sm:py-3 rounded-xl font-black text-[9px] sm:text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BranchManagerSidebar;