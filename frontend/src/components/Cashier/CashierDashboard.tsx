import React from 'react';
import logo from '../../assets/logo.png';

const CashierDashboard: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#f8f6ff] text-zinc-900 font-sans overflow-hidden">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-zinc-200">
        <img src={logo} alt="Logo" className="h-8 w-auto object-contain" />
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 text-[#3b2063]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-zinc-200 
        transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 flex flex-col
        rounded-r-[2rem] md:rounded-r-[1.5rem] overflow-hidden
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col flex-1 overflow-y-auto">
          <div className="px-6 pt-10 flex flex-col items-center shrink-0">
            <img src={logo} alt="Lucky Boba Logo" className="w-55 h-auto object-contain mb-2 hidden md:block" />
            <div className="text-[#3b2063] font-black uppercase text-[9px] tracking-[0.3em] opacity-60 mb-2 text-center">Cashier</div>
            <div className="bg-[#fbbf24] text-[#3b2063] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider mb-8">POS Terminal</div>
          </div>

          <nav className="w-full px-6 space-y-2 pb-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 px-5 py-3 mb-2">Coming Soon</p>
          </nav>
        </div>

        <div className="shrink-0 px-6 pb-8">
          <button 
            onClick={() => {
              localStorage.removeItem('auth_token');
              localStorage.removeItem('token');
              sessionStorage.clear();
              window.location.href = '/login';
            }}
            className="flex items-center justify-center w-full px-6 py-4 rounded-2xl bg-[#be2525] hover:bg-[#a11f1f] text-white text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-200 shadow-md shadow-red-900/10 group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4 mr-3 group-hover:-translate-x-1 transition-transform">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
            Logout
          </button>
          <div className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 text-center mt-4">Lucky Boba 2026</div>
        </div>

        <button onClick={() => setIsSidebarOpen(false)} className="md:hidden absolute top-4 right-4 text-zinc-400 text-xs font-bold">CLOSE</button>
      </aside>

      {isSidebarOpen && <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsSidebarOpen(false)} />}

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 md:px-10 py-6 md:py-8 gap-4">
          <div>
            <h1 className="text-xl md:text-4xl font-black text-[#3b2063] uppercase tracking-tight">
              Cashier Dashboard
            </h1>
            <p className="text-zinc-400 font-bold text-[9px] md:text-[10px] uppercase tracking-[0.2em] mt-1">
              Point of Sale Terminal
            </p>
          </div>
        </header>

        {/* Content Area */}
        <section className="flex-1 px-6 md:px-10 pb-10 overflow-auto flex items-center justify-center">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-[#f0ebff] mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-12 h-12 text-[#3b2063]">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-3H6" />
              </svg>
            </div>
            <h2 className="text-2xl font-black text-[#3b2063] uppercase tracking-tight mb-2">Coming Soon</h2>
            <p className="text-zinc-400 font-bold text-[12px] uppercase tracking-[0.2em]">Cashier dashboard is under development</p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default CashierDashboard;
