"use client"

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import { 
  LayoutGrid, ShoppingCart, BarChart3, BookOpen, Package,
  Wallet, Settings as SettingsIcon, LogOut, Lock, ChevronDown
} from 'lucide-react';

interface MenuItem { id: string; label: string; }
interface DropdownConfig { id: string; state: boolean; label: string; items: MenuItem[]; icon: React.ReactNode; }
interface SidebarProps {
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  logo: string;
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isLoading?: boolean;
}
interface NavBtnProps { active: boolean; icon: React.ReactNode; label: string; onClick: () => void; }

const Sidebar: React.FC<SidebarProps> = ({
  isSidebarOpen, setSidebarOpen, logo, currentTab, setCurrentTab, isLoading = false
}) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showCashInRequired, setShowCashInRequired] = useState(false);
  const [showEodLockedModal, setShowEodLockedModal] = useState(false);
  const [showZReadingBlockedModal, setShowZReadingBlockedModal] = useState(false);
  const [, setCurrentDate] = useState(new Date());
  const [isEodLocked, setIsEodLocked] = useState(false);

  const [isMenuLocked, setIsMenuLocked] = useState(() => {
    const cachedStatus = localStorage.getItem('cashier_menu_unlocked');
    const cachedDate = localStorage.getItem('cashier_lock_date');
    const today = new Date().toDateString();
    if (cachedStatus === 'true' && cachedDate === today) return false;
    return true;
  });

  useEffect(() => {
    const checkEod = async () => {
      try {
        const r = await api.get('/cash-counts/status');
        setIsEodLocked(r.data.isEodDone);
      } catch (e) { console.error("EOD Check failed", e); }
    };
    checkEod();
  }, [currentTab]);

  useEffect(() => {
    const t = setInterval(() => setCurrentDate(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const r = await api.get('/cash-transactions/status');
        const today = new Date().toDateString();
        setIsMenuLocked(!r.data.hasCashedIn);
        if (r.data.hasCashedIn) {
          localStorage.setItem('cashier_menu_unlocked', 'true');
          localStorage.setItem('cashier_lock_date', today);
        } else {
          localStorage.removeItem('cashier_menu_unlocked');
          localStorage.removeItem('cashier_lock_date');
        }
      } catch (e) { console.error("Cash-in status error:", e); }
    };
    checkStatus();
  }, [currentTab]);

  useEffect(() => {
    const fn = () => { setIsEodLocked(true); setIsMenuLocked(true); };
    window.addEventListener('eod-completed', fn);
    return () => window.removeEventListener('eod-completed', fn);
  }, []);

  const posMenuItems: MenuItem[] = [
    { id: 'cash-in', label: 'Cash In' },
    { id: 'cash-drop', label: 'Cash Drop' },
    { id: 'menu', label: 'Menu' },
    { id: 'search-receipts', label: 'Search Receipts' },
    { id: 'cash-count', label: 'Cash Count EOD' },
  ];
  const salesReportItems: MenuItem[] = [
    { id: 'sales-dashboard', label: 'Dashboard' },
    { id: 'items-report', label: 'Items Report' },
    { id: 'x-reading', label: 'X Reading' },
    { id: 'z-reading', label: 'Z Reading' },
  ];
  const menuManagementItems: MenuItem[] = [
    { id: 'menu-list', label: 'Menu List' },
    { id: 'category-list', label: 'Category List' },
    { id: 'sub-category-list', label: 'Sub-Category List' },
  ];
  const inventoryItems: MenuItem[] = [
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

  const [isPosOpen, setPosOpen] = useState(() => posMenuItems.some(i => i.id === currentTab));
  const [isSalesOpen, setSalesOpen] = useState(() => salesReportItems.some(i => i.id === currentTab));
  const [isMenuOpen, setMenuOpen] = useState(() => menuManagementItems.some(i => i.id === currentTab));
  const [isInvOpen, setInvOpen] = useState(() => inventoryItems.some(i => i.id === currentTab));

  const toggle = (id: string) => {
    setPosOpen(id === 'pos' ? !isPosOpen : false);
    setSalesOpen(id === 'sales' ? !isSalesOpen : false);
    setMenuOpen(id === 'menu-items' ? !isMenuOpen : false);
    setInvOpen(id === 'inventory' ? !isInvOpen : false);
  };
  const closeAll = () => { setPosOpen(false); setSalesOpen(false); setMenuOpen(false); setInvOpen(false); };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setShowLogoutConfirm(false);
    try {
      localStorage.removeItem('cashier_menu_unlocked');
      localStorage.removeItem('cashier_lock_date');
      await logout();
      navigate('/login', { replace: true });
    } catch (e) { console.error("Logout failed:", e); }
    finally { setIsLoggingOut(false); }
  };

  const dropdowns: DropdownConfig[] = [
    { id: 'pos',        state: isPosOpen,    label: 'Point of Sale', items: posMenuItems,        icon: <ShoppingCart size={17} /> },
    { id: 'sales',      state: isSalesOpen,  label: 'Sales Report',  items: salesReportItems,    icon: <BarChart3 size={17} /> },
    { id: 'menu-items', state: isMenuOpen,   label: 'Menu Items',    items: menuManagementItems, icon: <BookOpen size={17} /> },
    { id: 'inventory',  state: isInvOpen,    label: 'Inventory',     items: inventoryItems,      icon: <Package size={17} /> },
  ];

  // ── Modal ──
  const Modal = ({ show, icon, title, desc, action, btnText, cancel, danger }: {
    show: boolean; icon: React.ReactNode; title: string; desc: string;
    action: () => void; btnText: string; cancel?: () => void; danger?: boolean;
  }) => {
    if (!show) return null;
    return (
      <div className="fixed inset-0 z-200 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
        <div
          style={{ fontFamily: "'DM Sans', sans-serif" }}
          className="bg-white w-full max-w-sm border border-zinc-200 rounded-[1.25rem] p-8 flex flex-col items-center text-center shadow-2xl"
        >
          <div className={`w-11 h-11 rounded-[0.625rem] flex items-center justify-center mb-5 ${danger ? 'bg-red-50' : 'bg-[#f5f3ff]'}`}>
            {icon}
          </div>
          <h3 className="text-[#1a0f2e] font-bold text-base mb-2 tracking-tight">{title}</h3>
          <p className="text-zinc-500 text-sm font-medium mb-7 leading-relaxed">{desc}</p>
          <div className="flex flex-col w-full gap-2">
            <button
              onClick={action}
              className={`w-full py-3 text-[10px] font-bold tracking-[0.18em] uppercase text-white transition-all rounded-[0.625rem] active:scale-[0.98] ${danger ? 'bg-[#be2525] hover:bg-[#a11f1f]' : 'bg-[#3b2063] hover:bg-[#2a1647]'}`}
            >
              {btnText}
            </button>
            {cancel && (
              <button
                onClick={cancel}
                className="w-full py-3 text-[10px] font-bold tracking-[0.18em] uppercase text-zinc-500 bg-white border border-zinc-200 hover:bg-zinc-50 transition-all rounded-[0.625rem] active:scale-[0.98]"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ── Skeleton ──
  if (isLoading) {
    return (
      <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-zinc-200 flex flex-col">
        <div className="flex-1 px-4 pt-8">
          <div className="flex flex-col items-center mb-6 pb-6 border-b border-zinc-100">
            <div className="w-36 h-9 bg-zinc-100 animate-pulse rounded-lg mb-3" />
            <div className="w-24 h-5 bg-zinc-50 animate-pulse rounded-md" />
          </div>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="w-full h-11 bg-zinc-50 animate-pulse border-b border-zinc-100 flex items-center px-5 gap-3">
              <div className="w-4 h-4 bg-zinc-100 rounded" />
              <div className="w-20 h-2.5 bg-zinc-100 rounded" />
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-zinc-100">
          <div className="w-full h-11 bg-red-50 animate-pulse rounded-[0.625rem]" />
        </div>
      </aside>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        .sb-root, .sb-root * { font-family: 'DM Sans', sans-serif !important; }

        .sb-scroll { overflow-y: scroll; scrollbar-gutter: stable; -ms-overflow-style: none; scrollbar-width: none; }
        .sb-scroll::-webkit-scrollbar { display: none; }

        /* ── Nav button ── */
        .sb-btn {
          width: 100%; display: flex; align-items: center; gap: 13px;
          padding: 16px 20px; border: none; border-bottom: 1px solid #f4f4f5;
          background: transparent; cursor: pointer; text-align: left;
          position: relative; transition: background 0.13s;
        }
        .sb-btn:hover { background: #f5f3ff; }
        .sb-btn.active { background: #ede8ff; }
        .sb-btn.active::before {
          content: ''; position: absolute; left: 0; top: 20%; bottom: 20%;
          width: 3px; background: #3b2063; border-radius: 0 2px 2px 0;
        }

        /* ── Dropdown header ── */
        .sb-dh {
          width: 100%; display: flex; align-items: center; justify-content: space-between;
          padding: 16px 20px; border: none; border-bottom: 1px solid #f4f4f5;
          background: transparent; cursor: pointer;
          position: relative; transition: background 0.13s;
        }
        .sb-dh:hover { background: #f5f3ff; }
        .sb-dh.active { background: #ede8ff; }
        .sb-dh.active::before {
          content: ''; position: absolute; left: 0; top: 20%; bottom: 20%;
          width: 3px; background: #3b2063; border-radius: 0 2px 2px 0;
        }

        /* ── Sub items ── */
        .sb-sub {
          width: 100%; text-align: left; border: none; cursor: pointer;
          padding: 11px 12px 11px 10px;
          font-size: 0.82rem; font-weight: 500; color: #52525b;
          background: transparent; display: flex; align-items: center; justify-content: space-between;
          border-radius: 0.5rem;
          transition: background 0.12s, color 0.12s, padding-left 0.12s;
        }
        .sb-sub:hover { background: #f0ebff; color: #3b2063; padding-left: 14px; }
        .sb-sub.active { background: #ede8ff; color: #3b2063; font-weight: 700; padding-left: 14px; }

        /* ── Chevron ── */
        .sb-chevron { transition: transform 0.25s cubic-bezier(0.4,0,0.2,1); color: #a1a1aa; }
        .sb-chevron.open { transform: rotate(180deg); }

        /* ── Logout spinner ── */
        @keyframes sb-spin { to { transform: rotate(360deg); } }
        .sb-spin { animation: sb-spin 0.7s linear infinite; }
      `}</style>

      {/* Modals */}
      <Modal show={showCashInRequired} icon={<Lock size={19} className="text-[#3b2063]" />}
        title="Menu Locked" desc="Shift not started. Please input Cash In first to unlock the terminal."
        action={() => { setShowCashInRequired(false); setPosOpen(true); setCurrentTab('cash-in'); }}
        btnText="Go to Cash In" cancel={() => setShowCashInRequired(false)} />

      <Modal show={showZReadingBlockedModal} icon={<BarChart3 size={19} className="text-amber-500" />}
        title="EOD Required" desc="Complete EOD Cash Count before accessing Z-Reading."
        action={() => { setShowZReadingBlockedModal(false); setPosOpen(true); setCurrentTab('cash-count'); }}
        btnText="Go to Cash Count" cancel={() => setShowZReadingBlockedModal(false)} />

      <Modal show={showLogoutConfirm} icon={<LogOut size={19} className="text-[#be2525]" />}
        title="End Session?" desc="Are you sure you want to log out of the terminal?"
        action={handleLogout} btnText="Logout" cancel={() => setShowLogoutConfirm(false)} danger />

      <Modal show={showEodLockedModal} icon={<Lock size={19} className="text-[#be2525]" />}
        title="Terminal Closed" desc="End of Day has been processed. Terminal is locked for new orders."
        action={() => setShowEodLockedModal(false)} btnText="Dismiss" />

      {/* ── Sidebar ── */}
      <aside className={`sb-root relative inset-y-0 left-0 z-50 w-64 bg-white border-r border-zinc-200 transform transition-transform duration-300 md:relative md:translate-x-0 flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>

        <div className="flex-1 sb-scroll min-h-0">

          {/* Logo */}
          <div className="px-5 pt-7 pb-6 flex flex-col items-center border-b border-zinc-100">
            <img src={logo} alt="Lucky Boba" className="w-40 h-auto object-contain mb-3 hidden md:block" />
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#3b2063] rounded-md">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 opacity-90" />
              <span className="text-[9px] font-black uppercase tracking-[0.22em] text-white">Point of Sale</span>
            </span>
          </div>

          {/* Nav items */}
          <nav className="w-full py-1">

            <NavBtn
              active={currentTab === 'dashboard'}
              icon={<LayoutGrid size={17} />}
              label="Dashboard"
              onClick={() => { setCurrentTab('dashboard'); closeAll(); if (window.innerWidth < 768) setSidebarOpen(false); }}
            />

            {dropdowns.map((dd) => {
              const groupActive = dd.items.some(i => i.id === currentTab);
              return (
                <div key={dd.id}>
                  <button onClick={() => toggle(dd.id)} className={`sb-dh ${groupActive ? 'active' : ''}`}>
                    <div className="flex items-center gap-2.5">
                      <span className={groupActive || dd.state ? 'text-[#3b2063]' : 'text-zinc-400'}>{dd.icon}</span>
                      <span className={`text-[13px] font-bold uppercase tracking-[0.14em] ${groupActive || dd.state ? 'text-[#1a0f2e]' : 'text-zinc-600'}`}>
                        {dd.label}
                      </span>
                    </div>
                    <ChevronDown size={12} className={`sb-chevron ${dd.state ? 'open' : ''}`} />
                  </button>

                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${dd.state ? 'max-h-125 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="mx-3 my-1.5 px-1.5 py-1.5 bg-zinc-50/80 rounded-[0.625rem] border border-zinc-100 flex flex-col gap-0.5">
                      {dd.items.map((item) => {
                        const locked =
                          (item.id === 'menu' && (isMenuLocked || isEodLocked)) ||
                          (item.id === 'z-reading' && !isEodLocked);
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              if (item.id === 'menu') {
                                const ok = localStorage.getItem('cashier_menu_unlocked') === 'true';
                                if (isMenuLocked && !ok) setShowCashInRequired(true);
                                else if (isEodLocked) setShowEodLockedModal(true);
                                else navigate('/pos');
                              } else if (item.id === 'z-reading' && !isEodLocked) {
                                setShowZReadingBlockedModal(true);
                              } else {
                                setCurrentTab(item.id);
                                if (window.innerWidth < 768) setSidebarOpen(false);
                              }
                            }}
                            className={`sb-sub ${locked ? 'opacity-40 cursor-not-allowed' : ''} ${currentTab === item.id ? 'active' : ''}`}
                          >
                            {item.label}
                            {locked && <Lock size={9} className="text-zinc-400 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}

            <NavBtn active={currentTab === 'expense'} icon={<Wallet size={17} />} label="Expense"
              onClick={() => { setCurrentTab('expense'); closeAll(); }} />
            <NavBtn active={currentTab === 'settings'} icon={<SettingsIcon size={17} />} label="Settings"
              onClick={() => { setCurrentTab('settings'); closeAll(); }} />
          </nav>
        </div>

        {/* Footer */}
        <div className="shrink-0 px-4 py-4 bg-white border-t border-zinc-100">
          <button
            onClick={() => setShowLogoutConfirm(true)}
            disabled={isLoggingOut}
            className="flex items-center justify-center w-full py-3 bg-[#be2525] hover:bg-[#a11f1f] text-white text-[10px] font-bold uppercase tracking-[0.18em] transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed rounded-[0.625rem]"
          >
            {isLoggingOut ? (
              <>
                <div className="relative w-4 h-4 mr-2 shrink-0">
                  <div className="absolute inset-0 rounded-full border-2 border-white/30" />
                  <div className="sb-spin absolute inset-0 rounded-full border-2 border-transparent border-t-white" />
                </div>
                Logging out...
              </>
            ) : (
              <>
                <LogOut size={13} className="mr-2" strokeWidth={2.5} />
                Logout
              </>
            )}
          </button>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] text-center mt-3">
            Lucky Boba &copy; 2026
          </p>
        </div>
      </aside>

      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}
    </>
  );
};

const NavBtn = ({ active, icon, label, onClick }: NavBtnProps) => (
  <button onClick={onClick} className={`sb-btn ${active ? 'active' : ''}`}>
    <span className={active ? 'text-[#3b2063]' : 'text-zinc-400'}>{icon}</span>
    <span className={`text-[13px] font-bold uppercase tracking-[0.14em] ${active ? 'text-[#1a0f2e]' : 'text-zinc-600'}`}>
      {label}
    </span>
  </button>
);

export default Sidebar;