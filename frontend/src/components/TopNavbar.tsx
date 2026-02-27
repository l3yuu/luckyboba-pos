"use client"

import { useState, useRef, useEffect } from 'react';

interface TopNavbarProps {
  isEodLocked?: boolean;
}

const TopNavbar: React.FC<TopNavbarProps> = ({ isEodLocked }) => {
  const [isNotifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const [cashierName] = useState(() => {
    if (typeof window !== 'undefined') {
      const name = localStorage.getItem('lucky_boba_user_name');
      const role = localStorage.getItem('lucky_boba_user_role');
      if (name) return name.toUpperCase();
      if (role) return role.toUpperCase();
    }
    return 'SYSTEM ADMIN';
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="flex-none bg-white border-b-2 border-zinc-100 px-6 py-3 flex items-center justify-between z-20 shadow-sm">

      {/* ── LEFT: Branch & Cashier info cards ── */}
      <div className="flex items-center gap-2">

        {/* Branch pill — matches the header info cards from SalesOrder */}
        <div className="flex items-center gap-2.5 bg-[#f0ebff] border-2 border-[#3b2063]/10 rounded-2xl px-4 py-2">
          <span className="w-6 h-6 bg-[#3b2063] rounded-xl flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="white" className="w-3 h-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.906.906 0 0 0 .906-.906v-4.438a.906.906 0 0 0-.906-.906H6.75a.906.906 0 0 0-.906.906v4.438a.906.906 0 0 0 .906.906Z" />
            </svg>
          </span>
          <div>
            <div className="text-[9px] font-bold text-[#3b2063]/50 uppercase tracking-widest leading-none">Branch</div>
            <div className="text-[11px] font-black text-[#3b2063] uppercase leading-tight mt-0.5">Main Branch · QC</div>
          </div>
        </div>

        {/* Cashier pill */}
        <div className="flex items-center gap-2.5 bg-zinc-50 border-2 border-zinc-200 rounded-2xl px-4 py-2">
          <span className="w-6 h-6 bg-zinc-200 rounded-xl flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="#71717a" className="w-3 h-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
          </span>
          <div>
            <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest leading-none">Cashier</div>
            <div className="text-[11px] font-black text-zinc-700 uppercase leading-tight mt-0.5">{cashierName}</div>
          </div>
        </div>

        {/* Terminal Locked badge — same pulse/alert style as modals */}
        {isEodLocked && (
          <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border-2 border-red-200 rounded-2xl">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">Terminal Locked</span>
          </div>
        )}
      </div>

      {/* ── RIGHT: Notification bell ── */}
      <div className="relative" ref={notifRef}>
        <button
          onClick={() => setNotifOpen(!isNotifOpen)}
          className={`relative w-10 h-10 flex items-center justify-center rounded-2xl border-2 transition-all ${
            isNotifOpen
              ? 'bg-[#3b2063] border-[#3b2063] text-white'
              : 'bg-zinc-50 border-zinc-200 text-zinc-400 hover:border-[#3b2063] hover:text-[#3b2063] hover:bg-[#f0ebff]'
          }`}
        >
          {/* Unread dot */}
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
          </svg>
        </button>

        {/* Dropdown — modal card style */}
        {isNotifOpen && (
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-3xl shadow-2xl border-2 border-zinc-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Header — purple modal header */}
            <div className="bg-[#3b2063] px-5 py-4">
              <div className="flex items-center justify-between">
                <p className="text-white text-[11px] font-black uppercase tracking-widest">Notifications</p>
                <span className="bg-white/20 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                  {isEodLocked ? '2 new' : '1 new'}
                </span>
              </div>
            </div>

            {/* Notification list */}
            <div className="max-h-72 overflow-y-auto divide-y-2 divide-zinc-50 bg-white">

              {/* Low stock alert */}
              <div className="flex gap-3 p-4 hover:bg-[#f8f6ff] transition-colors cursor-pointer">
                <span className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="#d97706" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[#3b2063] font-black text-[11px] uppercase tracking-wider">Low Stock Alert</p>
                  <p className="text-zinc-400 text-[10px] mt-0.5 leading-relaxed">Tapioca Pearls are running low. Consider restocking soon.</p>
                </div>
              </div>

              {/* EOD status — only shown when locked */}
              {isEodLocked && (
                <div className="flex gap-3 p-4 bg-red-50/40 cursor-pointer">
                  <span className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="#dc2626" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-red-600 font-black text-[11px] uppercase tracking-wider">Terminal Locked</p>
                    <p className="text-zinc-400 text-[10px] mt-0.5 leading-relaxed">End of Day count has been submitted. No new orders can be placed.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-zinc-50 border-t-2 border-zinc-100">
              <button className="w-full py-2.5 rounded-xl bg-white border-2 border-zinc-200 text-[10px] font-black text-zinc-400 uppercase tracking-widest hover:border-[#3b2063] hover:text-[#3b2063] hover:bg-[#f0ebff] transition-all">
                View All Notifications
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default TopNavbar;