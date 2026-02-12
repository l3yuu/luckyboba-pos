import { useState, useRef, useEffect } from 'react';

const TopNavbar = () => {
  const [isNotifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="flex-none bg-white border-b border-zinc-200 px-8 py-4 flex items-center justify-between shadow-sm z-20">
      <div className="flex items-center gap-6">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Branch</span>
          <span className="text-[#3b2063] font-black text-xs uppercase tracking-wider">Main Branch - QC</span>
        </div>
        <div className="h-8 w-px bg-zinc-100"></div>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Cashier</span>
          <span className="text-[#3b2063] font-black text-xs uppercase tracking-wider">Admin User</span>
        </div>
      </div>
      <div className="relative" ref={notifRef}>
        <button onClick={() => setNotifOpen(!isNotifOpen)} className="p-2 text-zinc-400 hover:text-[#3b2063] hover:bg-purple-50 rounded-full transition-all relative">
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
          </svg>
        </button>
        {isNotifOpen && (
          <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-zinc-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="bg-[#3b2063] px-4 py-3"><p className="text-white text-[10px] font-bold uppercase tracking-widest">Notifications</p></div>
            <div className="max-h-64 overflow-y-auto">
              <div className="p-4 border-b border-zinc-50 hover:bg-purple-50 transition-colors cursor-pointer">
                <p className="text-[#3b2063] font-bold text-xs mb-1">Low Stock Alert</p>
                <p className="text-zinc-400 text-[10px]">Tapioca Pearls are running low.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default TopNavbar;