import React, { useState } from 'react';

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
  const [isLoading, setIsLoading] = useState(false);
  
  const posMenuItems = [
    { id: 'cash-in', label: 'Cash In' },
    { id: 'cash-drop', label: 'Cash Drop' },
    { id: 'menu', label: 'Menu' },
    { id: 'search-receipts', label: 'Search Receipts' },
    { id: 'cash-count', label: 'Cash Count EOD' },
  ];

  // FIX: Initialize state based on prop, remove the useEffect that caused the error
  const [isPosDropdownOpen, setPosDropdownOpen] = useState(() => 
    posMenuItems.some(item => item.id === currentTab)
  );

  const handleLogout = () => {
    setIsLoading(true);
    setTimeout(() => {
      localStorage.removeItem('auth_token');
      window.location.reload();
    }, 800);
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
        <div className="px-6 pt-10 flex flex-col items-center overflow-y-auto no-scrollbar">
          <img src={logo} alt="Lucky Boba Logo" className="w-55 h-auto object-contain mb-2 block" />
          <div className="text-[#3b2063] font-black uppercase text-[9px] tracking-[0.3em] opacity-60 mb-8">POS System</div>
          
          <nav className="w-full space-y-2">
            <button
              onClick={() => {
                setCurrentTab('dashboard');
                if (window.innerWidth < 768) setSidebarOpen(false);
              }}
              className={`w-full px-5 py-3 rounded-2xl font-black text-[13px] uppercase tracking-wider flex items-center transition-all duration-200 ${
                currentTab === 'dashboard' ? 'bg-[#f0ebff] text-[#3b2063]' : `text-zinc-400 ${hoverClasses}`
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 mr-3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
              </svg>
              Dashboard
            </button>

            <div className="w-full">
              <button
                onClick={() => setPosDropdownOpen(!isPosDropdownOpen)}
                className={`w-full px-5 py-3 rounded-2xl font-black text-[13px] uppercase tracking-wider flex items-center justify-between transition-all duration-200 ${
                  isPosDropdownOpen || posMenuItems.some(i => i.id === currentTab)
                    ? 'text-[#3b2063] bg-[#f0ebff]' : `text-zinc-400 ${hoverClasses}`
                }`}
              >
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 mr-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.906.906 0 0 0 .906-.906v-4.438a.906.906 0 0 0-.906-.906H6.75a.906.906 0 0 0-.906.906v4.438a.906.906 0 0 0 .906.906Z" />
                  </svg>
                  Point of Sale
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-3 h-3 transition-transform duration-300 ${isPosDropdownOpen ? 'rotate-180' : 'rotate-0'}`}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </button>

              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isPosDropdownOpen ? 'max-h-64 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                <div className="flex flex-col space-y-1 pl-4 border-l-2 border-[#f0ebff] ml-5">
                  {posMenuItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setCurrentTab(item.id);
                        if (window.innerWidth < 768) setSidebarOpen(false);
                      }}
                      className={`text-left px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-colors ${
                        currentTab === item.id ? 'text-[#3b2063] bg-[#f0ebff]' : `text-zinc-400 ${hoverClasses}`
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </nav>
        </div>

        <div className="px-8 pb-8 flex flex-col gap-6 bg-white pt-4 z-10">
          <button onClick={handleLogout} disabled={isLoading} className="flex items-center justify-center w-full px-6 py-4 rounded-2xl bg-[#be2525] hover:bg-[#a11f1f] text-white text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-200 shadow-md shadow-red-900/10 disabled:opacity-70 disabled:cursor-not-allowed group">
            {isLoading ? (
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