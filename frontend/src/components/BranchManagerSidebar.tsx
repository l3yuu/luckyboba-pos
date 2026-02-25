import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

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

  const hoverClasses = 'hover:bg-[#f0ebff] hover:text-[#3b2063]';

  return (
    <>
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-56 sm:w-64 bg-white border-r border-zinc-200 
        transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 flex flex-col justify-between
        rounded-r-[1.5rem] md:rounded-r-[2rem] overflow-hidden
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* TOP SECTION */}
        <div className="flex flex-col flex-1 overflow-y-auto no-scrollbar">
          <div className="px-4 sm:px-6 pt-8 sm:pt-10 flex flex-col items-center shrink-0">
            <img src={logo} alt="Lucky Boba Logo" className="w-40 sm:w-55 h-auto object-contain mb-2 hidden md:block" />
            <div className="text-[#3b2063] font-black uppercase text-[8px] sm:text-[9px] tracking-[0.3em] opacity-60 mb-6 sm:mb-8 text-center">POS System</div>
          </div>
          
          <nav className="w-full px-4 sm:px-6 space-y-2 pb-6">
            {/* DASHBOARD */}
            <button
              onClick={() => {
                setCurrentTab('dashboard');
                if (window.innerWidth < 768) setSidebarOpen(false);
              }}
              className={`w-full px-3 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-black text-[11px] sm:text-[13px] uppercase tracking-wider flex items-center transition-all duration-200 ${
                currentTab === 'dashboard' ? 'bg-[#f0ebff] text-[#3b2063]' : `text-zinc-400 ${hoverClasses}`
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 sm:w-4 h-3.5 sm:h-4 mr-2 sm:mr-3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
              </svg>
              Dashboard
            </button>

            {/* USER MANAGEMENT */}
            <button
              onClick={() => {
                setCurrentTab('users');
                if (window.innerWidth < 768) setSidebarOpen(false);
              }}
              className={`w-full px-3 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-black text-[11px] sm:text-[13px] uppercase tracking-wider flex items-center transition-all duration-200 ${
                currentTab === 'users' ? 'bg-[#f0ebff] text-[#3b2063]' : `text-zinc-400 ${hoverClasses}`
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 sm:w-4 h-3.5 sm:h-4 mr-2 sm:mr-3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M18.75 4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM9 12.75a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM9 15.75v-.003c0-1.113.285-2.16.786-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Z" />
              </svg>
              User Management
            </button>
          </nav>
        </div>

        {/* BOTTOM SECTION */}
        <div className="shrink-0 bg-white border-t border-zinc-50">
          <div className="px-6 sm:px-8 pt-4 sm:pt-6 pb-2">
            <div className="bg-[#f8f6ff] rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center border border-zinc-100">
              <div className="text-[9px] sm:text-[11px] font-black uppercase text-[#3b2063] tracking-wider mb-1">{formatDate(currentDate)}</div>
              <div className="text-sm sm:text-lg font-black text-slate-700 tracking-tight">{formatTime(currentDate)}</div>
            </div>
          </div>

          <div className="px-6 sm:px-8 pb-6 sm:pb-8 flex flex-col gap-3 sm:gap-4 pt-4">
            <button 
              onClick={handleLogout}
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
    </>
  );
};

export default BranchManagerSidebar;