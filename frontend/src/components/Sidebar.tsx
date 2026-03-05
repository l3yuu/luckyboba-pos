"use client"

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { 
  LayoutGrid, 
  ShoppingCart, 
  BarChart3, 
  BookOpen, 
  Package, 
  Wallet, 
  Settings as SettingsIcon,
  LogOut,
  Lock,
  ChevronDown
} from 'lucide-react';

// --- INTERFACES ---
interface MenuItem {
  id: string;
  label: string;
}

interface DropdownConfig {
  id: string;
  state: boolean;
  label: string;
  items: MenuItem[];
  icon: React.ReactNode;
}

interface SidebarProps {
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  logo: string;
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isLoading?: boolean; 
}

interface NavBtnProps {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isSidebarOpen, 
  setSidebarOpen, 
  logo, 
  currentTab, 
  setCurrentTab,
  isLoading = false
}) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  // --- STATES ---
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showCashInRequired, setShowCashInRequired] = useState(false);
  const [showEodLockedModal, setShowEodLockedModal] = useState(false);
  const [showZReadingBlockedModal, setShowZReadingBlockedModal] = useState(false);
  const [, setCurrentDate] = useState(new Date());
  const [isEodLocked, setIsEodLocked] = useState(false);

  // --- CACHE INITIALIZATION ---
  const [isMenuLocked, setIsMenuLocked] = useState(() => {
    const cachedStatus = localStorage.getItem('cashier_menu_unlocked');
    const cachedDate = localStorage.getItem('cashier_lock_date');
    const today = new Date().toDateString();
    if (cachedStatus === 'true' && cachedDate === today) return false;
    return true; 
  });

  // --- DATA FETCHING LOGIC ---
  useEffect(() => {
    const checkEod = async () => {
      try {
        const response = await api.get('/cash-counts/status'); 
        setIsEodLocked(response.data.isEodDone);
      } catch (error) { console.error("EOD Check failed", error); }
    };
    checkEod();
  }, [currentTab]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await api.get('/cash-transactions/status'); 
        const hasCashedIn = response.data.hasCashedIn;
        const today = new Date().toDateString();
        setIsMenuLocked(!hasCashedIn);
        if (hasCashedIn) {
          localStorage.setItem('cashier_menu_unlocked', 'true');
          localStorage.setItem('cashier_lock_date', today);
        } else {
          localStorage.removeItem('cashier_menu_unlocked');
          localStorage.removeItem('cashier_lock_date');
        }
      } catch (error) { console.error("Error checking cash-in status:", error); }
    };
    checkStatus();
  }, [currentTab]);

  useEffect(() => {
    const handleEodCompleted = () => {
      setIsEodLocked(true);
      setIsMenuLocked(true);
    };
    window.addEventListener('eod-completed', handleEodCompleted);
    return () => window.removeEventListener('eod-completed', handleEodCompleted);
  }, []);
  
  // --- MENU DATA ---
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

  // --- DROPDOWN STATES ---
  const [isPosDropdownOpen, setPosDropdownOpen] = useState(() => posMenuItems.some(i => i.id === currentTab));
  const [isSalesReportDropdownOpen, setSalesReportDropdownOpen] = useState(() => salesReportItems.some(i => i.id === currentTab));
  const [isMenuItemsDropdownOpen, setMenuItemsDropdownOpen] = useState(() => menuManagementItems.some(i => i.id === currentTab));
  const [isInventoryDropdownOpen, setInventoryDropdownOpen] = useState(() => inventoryItems.some(i => i.id === currentTab));

  const handleDropdownToggle = (id: string) => {
    setPosDropdownOpen(id === 'pos' ? !isPosDropdownOpen : false);
    setSalesReportDropdownOpen(id === 'sales' ? !isSalesReportDropdownOpen : false);
    setMenuItemsDropdownOpen(id === 'menu-items' ? !isMenuItemsDropdownOpen : false);
    setInventoryDropdownOpen(id === 'inventory' ? !isInventoryDropdownOpen : false);
  };

  const closeAllDropdowns = () => {
    setPosDropdownOpen(false);
    setSalesReportDropdownOpen(false);
    setMenuItemsDropdownOpen(false);
    setInventoryDropdownOpen(false);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setShowLogoutConfirm(false);
    try {
      localStorage.removeItem('cashier_menu_unlocked');
      localStorage.removeItem('cashier_lock_date');
      await logout();
      navigate('/login', { replace: true });
    } catch (error) { console.error("Logout failed:", error); }
    finally { setIsLoggingOut(false); }
  };

  const dropdowns: DropdownConfig[] = [
    { id: 'pos', state: isPosDropdownOpen, label: 'Point of Sale', items: posMenuItems, icon: <ShoppingCart size={18} /> },
    { id: 'sales', state: isSalesReportDropdownOpen, label: 'Sales Report', items: salesReportItems, icon: <BarChart3 size={18} /> },
    { id: 'menu-items', state: isMenuItemsDropdownOpen, label: 'Menu Items', items: menuManagementItems, icon: <BookOpen size={18} /> },
    { id: 'inventory', state: isInventoryDropdownOpen, label: 'Inventory', items: inventoryItems, icon: <Package size={18} /> }
  ];

  // ─── SKELETON RENDER ───
  if (isLoading) {
    return (
      <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-zinc-200 flex flex-col rounded-none">
        <div className="flex-1 px-4 pt-12">
          <div className="flex flex-col items-center mb-12">
            <div className="w-40 h-10 bg-zinc-100 animate-pulse rounded-none mb-4" />
            <div className="w-24 h-3 bg-zinc-50 animate-pulse rounded-none" />
          </div>
          <nav className="space-y-1">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="w-full h-14 bg-zinc-50/50 border-b border-zinc-50 animate-pulse flex items-center px-5">
                <div className="w-5 h-5 bg-zinc-100 rounded-none mr-3" />
                <div className="w-24 h-3 bg-zinc-100 rounded-none" />
              </div>
            ))}
          </nav>
        </div>
        <div className="p-6 bg-white border-t border-zinc-100">
          <div className="w-full h-14 bg-red-50/50 animate-pulse rounded-none mb-3" />
          <div className="w-32 h-2 bg-zinc-50 animate-pulse mx-auto" />
        </div>
      </aside>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        .sidebar-font { font-family: 'Inter', sans-serif; }
        .sidebar-scroll { overflow-y: scroll; scrollbar-gutter: stable; -ms-overflow-style: none; scrollbar-width: none; }
        .sidebar-scroll::-webkit-scrollbar { width: 0px; background: transparent; }

        .nav-label {
          font-family: 'Inter', sans-serif;
          font-size: 11.5px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #1c1c1e;
        }

        .nav-sublabel {
          font-family: 'Inter', sans-serif;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.01em;
          text-transform: none;
          color: #3a3a3c;
        }

        .sub-item {
          position: relative;
          transition: color 0.18s ease, padding-left 0.18s ease;
        }
        .sub-item::before {
          content: '';
          position: absolute;
          left: -1px;
          top: 50%;
          transform: translateY(-50%) scaleY(0);
          width: 2px;
          height: 60%;
          background: #3b2063;
          border-radius: 2px;
          transition: transform 0.18s cubic-bezier(0.4,0,0.2,1), opacity 0.18s ease;
          opacity: 0;
        }
        .sub-item:hover::before,
        .sub-item.active::before {
          transform: translateY(-50%) scaleY(1);
          opacity: 1;
        }
        .sub-item:hover {
          color: #1c1c1e !important;
          padding-left: 10px !important;
          background: #f9f8ff;
        }
        .sub-item.active {
          color: #3b2063 !important;
          padding-left: 10px !important;
          font-weight: 700;
          background: #f3f0ff;
        }

        .nav-btn {
          transition: background 0.16s ease, color 0.16s ease;
        }
        .nav-btn:hover { background: #f5f3ff; }
        .nav-btn.active { background: #ede8ff; }

        .dropdown-header {
          transition: background 0.16s ease, color 0.16s ease;
        }
        .dropdown-header:hover { background: #f5f3ff; }
          font-family: 'Inter', sans-serif;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }
      `}</style>

      {/* --- MODALS --- */}
      {[
        { show: showCashInRequired, icon: <Lock className="text-[#3b2063]"/>, title: "Menu Locked", desc: "Shift not started. Please input 'Cash In' first.", action: () => { setShowCashInRequired(false); setPosDropdownOpen(true); setCurrentTab('cash-in'); }, btnText: "Go to Cash In", cancel: () => setShowCashInRequired(false) },
        { show: showZReadingBlockedModal, icon: <BarChart3 className="text-amber-600"/>, title: "EOD Required", desc: "Complete EOD Cash Count before Z-Reading.", action: () => { setShowZReadingBlockedModal(false); setPosDropdownOpen(true); setCurrentTab('cash-count'); }, btnText: "Go to Cash Count", cancel: () => setShowZReadingBlockedModal(false) },
        { show: showLogoutConfirm, icon: <LogOut className="text-red-600"/>, title: "End Session?", desc: "Are you sure you want to log out?", action: handleLogout, btnText: isLoggingOut ? "Processing..." : "Logout", cancel: () => setShowLogoutConfirm(false), danger: true },
        { show: showEodLockedModal, icon: <Lock className="text-red-600"/>, title: "Terminal Closed", desc: "End of Day processed. Terminal locked for new orders.", action: () => setShowEodLockedModal(false), btnText: "Dismiss" }
      ].map((m, i) => m.show && (
        <div key={i} className="fixed inset-0 z-200 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-none border border-zinc-200 p-10 flex flex-col items-center text-center shadow-2xl animate-in zoom-in-95 duration-200 sidebar-font">
            <div className="w-14 h-14 flex items-center justify-center mb-6">{m.icon}</div>
            <h3 className="text-[#1a0f2e] font-bold text-base tracking-wide mb-2" style={{fontFamily: "'DM Sans', sans-serif"}}>{m.title}</h3>
            <p className="text-zinc-500 text-sm font-medium mb-8 leading-relaxed" style={{fontFamily: "'DM Sans', sans-serif"}}>{m.desc}</p>
            <div className="flex flex-col w-full gap-2">
              <button onClick={m.action} className={`w-full py-4 ${m.danger ? 'bg-red-600 hover:bg-red-700' : 'bg-[#3b2063] hover:bg-[#2a174a]'} text-white font-bold tracking-wide text-sm transition-colors`} style={{fontFamily: "'DM Sans', sans-serif"}}>{m.btnText}</button>
              {m.cancel && <button onClick={m.cancel} className="w-full py-4 bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50 font-semibold text-sm transition-colors" style={{fontFamily: "'DM Sans', sans-serif"}}>Cancel</button>}
            </div>
          </div>
        </div>
      ))}

      {/* --- SIDEBAR SHELL --- */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-zinc-200 transform transition-transform duration-300 md:relative md:translate-x-0 flex flex-col rounded-none sidebar-font ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        <div className="flex-1 sidebar-scroll min-h-0">
          <div className="px-6 pt-12 pb-10 flex flex-col items-center">
            <img src={logo} alt="Logo" className="w-48 h-auto object-contain mb-4 hidden md:block" />
            <div className="bg-[#fbbf24] text-[#1a0f2e] px-3 py-1 badge-label">Master Control</div>
          </div>
          
          <nav className="w-full px-4 space-y-0.5">
            <NavBtn active={currentTab === 'dashboard'} icon={<LayoutGrid size={18}/>} label="Dashboard" onClick={() => { setCurrentTab('dashboard'); closeAllDropdowns(); if (window.innerWidth < 768) setSidebarOpen(false); }} />

            {dropdowns.map((dropdown) => (
              <div className="w-full" key={dropdown.id}>
                <button onClick={() => handleDropdownToggle(dropdown.id)} className={`dropdown-header w-full px-5 py-4 flex items-center justify-between border-b border-zinc-100 group ${dropdown.state || dropdown.items.some(i => i.id === currentTab) ? 'text-[#1a0f2e] bg-[#f3f0ff]' : 'text-[#1c1c1e]'}`}>
                  <div className="flex items-center gap-3">
                    <span className={dropdown.state || dropdown.items.some(i => i.id === currentTab) ? 'text-[#3b2063]' : 'text-[#3a3a3c]'}>{dropdown.icon}</span>
                    <span className="nav-label">{dropdown.label}</span>
                  </div>
                  <ChevronDown size={14} className={`transition-transform duration-300 text-[#3a3a3c] ${dropdown.state ? 'rotate-180' : 'rotate-0'}`} />
                </button>
                
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${dropdown.state ? 'max-h-125 opacity-100 py-2' : 'max-h-0 opacity-0'}`}>
                  <div className="flex flex-col border-l-2 border-zinc-100 ml-5 pl-3"
                       style={{transition: 'border-color 0.2s'}}>
                    {dropdown.items.map((item) => (
                      <button key={item.id} onClick={() => { 
                        if (item.id === 'menu') {
                          const isUnlockedNow = localStorage.getItem('cashier_menu_unlocked') === 'true';
                          if (isMenuLocked && !isUnlockedNow) setShowCashInRequired(true);
                          else if (isEodLocked) setShowEodLockedModal(true);
                          else navigate('/pos');
                        } else if (item.id === 'z-reading' && !isEodLocked) setShowZReadingBlockedModal(true);
                        else { setCurrentTab(item.id); if (window.innerWidth < 768) setSidebarOpen(false); }
                      }} 
                      className={`sub-item text-left py-3 pr-4 nav-sublabel flex items-center justify-between w-full
                        ${(item.id === 'menu' && (isMenuLocked || isEodLocked)) || (item.id === 'z-reading' && !isEodLocked) ? 'opacity-30 cursor-not-allowed' : ''} 
                        ${currentTab === item.id ? 'active' : ''}`}>
                        {item.label}
                        {((item.id === 'menu' && (isMenuLocked || isEodLocked)) || (item.id === 'z-reading' && !isEodLocked)) && <Lock size={10} className="text-zinc-400"/>}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            <NavBtn active={currentTab === 'expense'} icon={<Wallet size={18}/>} label="Expense" onClick={() => { setCurrentTab('expense'); closeAllDropdowns(); }} />
            <NavBtn active={currentTab === 'settings'} icon={<SettingsIcon size={18}/>} label="Settings" onClick={() => { setCurrentTab('settings'); closeAllDropdowns(); }} />
          </nav>
        </div>

        {/* --- FOOTER --- */}
        <div className="shrink-0 p-6 bg-white border-t border-zinc-100 flex flex-col gap-4">
          <button onClick={() => setShowLogoutConfirm(true)} className="flex items-center justify-center w-full py-4 bg-[#be2525] text-white font-bold tracking-wide text-sm hover:bg-[#a11f1f] transition-all shadow-lg shadow-red-900/10 active:scale-95 rounded-none" style={{fontFamily: "'DM Sans', sans-serif"}}>
            <LogOut size={14} className="mr-2" strokeWidth={2.5}/> Logout
          </button>
          <div className="badge-label text-zinc-400 text-center">Lucky Boba &copy; 2026</div>
        </div>
      </aside>

      {isSidebarOpen && <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden" onClick={() => setSidebarOpen(false)} />}
    </>
  );
};

// --- NAV BUTTON COMPONENT ---
const NavBtn = ({ active, icon, label, onClick }: NavBtnProps) => (
  <button onClick={onClick} className={`nav-btn w-full px-5 py-4 flex items-center gap-3 border-b border-zinc-100 rounded-none ${active ? 'active text-[#1a0f2e]' : 'text-[#1c1c1e]'}`} style={{fontFamily: "'Inter', sans-serif"}}>
    <span className={active ? 'text-[#3b2063]' : 'text-[#3a3a3c]'}>{icon}</span>
    <span className="nav-label">{label}</span>
  </button>
);

export default Sidebar;