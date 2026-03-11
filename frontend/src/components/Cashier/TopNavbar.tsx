"use client"

import { useState, useRef, useEffect } from 'react';
import { Store, User, Lock, Bell, AlertTriangle } from 'lucide-react';

interface TopNavbarProps {
  isEodLocked?: boolean;
}

const TopNavbar: React.FC<TopNavbarProps> = ({ isEodLocked }) => {
  const [isNotifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

const [cashierInfo] = useState(() => {
  if (typeof window !== 'undefined') {
    const name = localStorage.getItem('lucky_boba_user_name');
    const role = localStorage.getItem('lucky_boba_user_role');
    const branch = localStorage.getItem('lucky_boba_user_branch');
    return {
      name: name ? name.toUpperCase() : 'SYSTEM ADMIN',
      role: role ? role.toUpperCase() : '',
      branch: branch ? branch.toUpperCase() : 'MAIN BRANCH',
    };
  }
  return { name: 'SYSTEM ADMIN', role: '', branch: 'MAIN BRANCH' };
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

  const notifCount = isEodLocked ? 2 : 1;

  return (
    <header className="flex-none bg-white border-b border-zinc-200 px-6 py-3.5 flex items-center justify-between z-20 shadow-sm">

      {/* ── LEFT: Info Pills ── */}
      <div className="flex items-center gap-2.5">

        {/* Branch */}
        <div className="flex items-center gap-2.5 bg-[#f4f2fb] border border-violet-200 px-4 py-2.5">
          <div className="w-7 h-7 bg-[#3b2063] flex items-center justify-center shrink-0">
            <Store size={13} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-[9px] font-bold text-[#3b2063]/50 uppercase tracking-widest leading-none">Branch</div>
            <div className="text-[11px] font-black text-[#3b2063] uppercase leading-tight mt-0.5">{cashierInfo.branch}</div>
          </div>
        </div>

        {/* Cashier */}
        <div className="flex items-center gap-2.5 bg-zinc-50 border border-zinc-200 px-4 py-2.5">
          <div className="w-7 h-7 bg-zinc-200 flex items-center justify-center shrink-0">
            <User size={13} className="text-zinc-500" strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest leading-none">Cashier</div>
            <div className="text-[11px] font-black text-zinc-700 uppercase leading-tight mt-0.5">{cashierInfo.name}</div>
          </div>
        </div>

        {/* EOD Locked Badge */}
        {isEodLocked && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
            <div className="flex items-center gap-1.5">
              <Lock size={11} className="text-red-600" strokeWidth={2.5} />
              <span className="text-[11px] font-bold text-red-600 uppercase tracking-widest">Terminal Locked</span>
            </div>
          </div>
        )}
      </div>

      {/* ── RIGHT: Bell ── */}
      <div className="relative" ref={notifRef}>
        <button
          onClick={() => setNotifOpen(prev => !prev)}
          className={`relative w-10 h-10 flex items-center justify-center border transition-all ${
            isNotifOpen
              ? 'bg-[#3b2063] border-[#3b2063] text-white'
              : 'bg-zinc-50 border-zinc-200 text-zinc-400 hover:border-[#3b2063] hover:text-[#3b2063] hover:bg-[#f4f2fb]'
          }`}
        >
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 border-2 border-white rounded-full" />
          <Bell size={17} strokeWidth={2} />
        </button>

        {/* Dropdown */}
        {isNotifOpen && (
          <div className="absolute right-0 mt-2 w-80 bg-white border border-zinc-200 shadow-xl z-50 overflow-hidden">

            {/* Header */}
            <div className="bg-[#3b2063] px-5 py-4 flex items-center justify-between">
              <p className="text-white text-sm font-bold uppercase tracking-widest">Notifications</p>
              <span className="bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 uppercase tracking-widest">
                {notifCount} new
              </span>
            </div>

            {/* Items */}
            <div className="max-h-72 overflow-y-auto divide-y divide-zinc-100 bg-white">

              {/* Low stock */}
              <div className="flex gap-3 p-4 hover:bg-[#f4f2fb] transition-colors cursor-pointer">
                <div className="w-8 h-8 bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle size={14} className="text-amber-600" strokeWidth={2.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#1a0f2e]">Low Stock Alert</p>
                  <p className="text-[11px] font-medium text-zinc-400 mt-0.5 leading-relaxed">
                    Tapioca Pearls are running low. Consider restocking soon.
                  </p>
                </div>
              </div>

              {/* EOD locked */}
              {isEodLocked && (
                <div className="flex gap-3 p-4 bg-red-50 cursor-pointer">
                  <div className="w-8 h-8 bg-red-100 border border-red-200 flex items-center justify-center shrink-0 mt-0.5">
                    <Lock size={14} className="text-red-600" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-red-600">Terminal Locked</p>
                    <p className="text-[11px] font-medium text-zinc-400 mt-0.5 leading-relaxed">
                      End of Day count submitted. No new orders can be placed.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-zinc-50 border-t border-zinc-100">
              <button className="w-full py-2.5 bg-white border border-zinc-200 text-[11px] font-bold text-zinc-500 uppercase tracking-widest hover:border-[#3b2063] hover:text-[#3b2063] hover:bg-[#f4f2fb] transition-all">
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
