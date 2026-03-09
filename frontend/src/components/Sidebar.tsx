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
    { id: 'pos', state: isPosDropdownOpen, label: 'Point of Sale', items: posMenuItems, icon: <ShoppingCart size={17} /> },
    { id: 'sales', state: isSalesReportDropdownOpen, label: 'Sales Report', items: salesReportItems, icon: <BarChart3 size={17} /> },
    { id: 'menu-items', state: isMenuItemsDropdownOpen, label: 'Menu Items', items: menuManagementItems, icon: <BookOpen size={17} /> },
    { id: 'inventory', state: isInventoryDropdownOpen, label: 'Inventory', items: inventoryItems, icon: <Package size={17} /> }
  ];

  // ─── Modal Component ───
  const Modal = ({ show, icon, title, desc, action, btnText, cancel, danger }: {
    show: boolean; icon: React.ReactNode; title: string; desc: string;
    action: () => void; btnText: string; cancel?: () => void; danger?: boolean;
  }) => {
    if (!show) return null;
    return (
      <div className="fixed inset-0 z-200 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
        <div className="bg-white w-full max-w-sm border border-zinc-200 p-10 flex flex-col items-center text-center shadow-2xl">
          <div className="w-12 h-12 flex items-center justify-center mb-5">{icon}</div>
          <h3 className="text-[#1a0f2e] font-bold text-base mb-2">{title}</h3>
          <p className="text-zinc-500 text-sm font-medium mb-8 leading-relaxed">{desc}</p>
          <div className="flex flex-col w-full gap-2">
            <button onClick={action} className={`w-full py-3.5 text-sm font-bold tracking-wide text-white transition-colors ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-[#3b2063] hover:bg-[#2a174a]'}`}>
              {btnText}
            </button>
            {cancel && (
              <button onClick={cancel} className="w-full py-3.5 text-sm font-semibold text-zinc-600 bg-white border border-zinc-200 hover:bg-zinc-50 transition-colors">
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-zinc-200 flex flex-col">
        <div className="flex-1 px-4 pt-10">
          <div className="flex flex-col items-center mb-10">
            <div className="w-40 h-10 bg-zinc-100 animate-pulse mb-4" />
            <div className="w-20 h-5 bg-zinc-50 animate-pulse" />
          </div>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="w-full h-12 bg-zinc-50 animate-pulse border-b border-zinc-100 flex items-center px-5 gap-3">
              <div className="w-4 h-4 bg-zinc-100" />
              <div className="w-24 h-3 bg-zinc-100" />
            </div>
          ))}
        </div>
        <div className="p-5"><div className="w-full h-12 bg-red-50 animate-pulse" /></div>
      </aside>
    );
  }

  return (
    <>
      <style>{`
        .sidebar-scroll { overflow-y: scroll; scrollbar-gutter: stable; -ms-overflow-style: none; scrollbar-width: none; }
        .sidebar-scroll::-webkit-scrollbar { display: none; }

        .sub-item {
          position: relative;
          transition: background 0.15s ease, color 0.15s ease, padding-left 0.15s ease;
        }
        .sub-item::before {
          content: '';
          position: absolute;
          left: -1px;
          top: 50%;
          transform: translateY(-50%) scaleY(0);
          width: 2px;
          height: 55%;
          background: #3b2063;
          transition: transform 0.18s cubic-bezier(0.4,0,0.2,1), opacity 0.18s;
          opacity: 0;
        }
        .sub-item:hover::before, .sub-item.active::before {
          transform: translateY(-50%) scaleY(1);
          opacity: 1;
        }
        .sub-item:hover { background: #f9f8ff; padding-left: 12px !important; color: #1c1c1e; }
        .sub-item.active { background: #f3f0ff; padding-left: 12px !important; color: #3b2063; font-weight: 700; }

        .nav-btn { transition: background 0.15s ease; }
        .nav-btn:hover { background: #f5f3ff; }
        .nav-btn.active { background: #ede8ff; }
        .dropdown-header { transition: background 0.15s ease; }
        .dropdown-header:hover { background: #f5f3ff; }

        @keyframes logout-spin { to { transform: rotate(360deg); } }
        .logout-spinner { animation: logout-spin 0.7s linear infinite; }
      `}</style>

      {/* Modals */}
      <Modal
        show={showCashInRequired}
        icon={<Lock size={22} className="text-[#3b2063]" />}
        title="Menu Locked"
        desc="Shift not started. Please input 'Cash In' first."
        action={() => { setShowCashInRequired(false); setPosDropdownOpen(true); setCurrentTab('cash-in'); }}
        btnText="Go to Cash In"
        cancel={() => setShowCashInRequired(false)}
      />
      <Modal
        show={showZReadingBlockedModal}
        icon={<BarChart3 size={22} className="text-amber-600" />}
        title="EOD Required"
        desc="Complete EOD Cash Count before Z-Reading."
        action={() => { setShowZReadingBlockedModal(false); setPosDropdownOpen(true); setCurrentTab('cash-count'); }}
        btnText="Go to Cash Count"
        cancel={() => setShowZReadingBlockedModal(false)}
      />
      <Modal
        show={showLogoutConfirm}
        icon={<LogOut size={22} className="text-red-600" />}
        title="End Session?"
        desc="Are you sure you want to log out?"
        action={handleLogout}
        btnText="Logout"
        cancel={() => setShowLogoutConfirm(false)}
        danger
      />
      <Modal
        show={showEodLockedModal}
        icon={<Lock size={22} className="text-red-600" />}
        title="Terminal Closed"
        desc="End of Day processed. Terminal locked for new orders."
        action={() => setShowEodLockedModal(false)}
        btnText="Dismiss"
      />

      {/* Sidebar Shell */}
      <aside className={`relative inset-y-0 left-0 z-50 w-64 bg-white border-r border-zinc-200 transform transition-transform duration-300 md:relative md:translate-x-0 flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>

        <div className="flex-1 sidebar-scroll min-h-0">

          {/* Logo Area */}
          <div className="px-6 pt-10 pb-8 flex flex-col items-center border-b border-zinc-100">
            <img src={logo} alt="Logo" className="w-44 h-auto object-contain mb-4 hidden md:block" />
            <span className="inline-flex items-center px-3 py-1 bg-amber-400 text-[#1a0f2e] text-[10px] font-black uppercase tracking-[0.2em]">
              POINT OF SALE
            </span>
          </div>

          {/* Nav */}
          <nav className="w-full py-2">
            <NavBtn
              active={currentTab === 'dashboard'}
              icon={<LayoutGrid size={17} />}
              label="Dashboard"
              onClick={() => { setCurrentTab('dashboard'); closeAllDropdowns(); if (window.innerWidth < 768) setSidebarOpen(false); }}
            />

            {dropdowns.map((dropdown) => {
              const isGroupActive = dropdown.items.some(i => i.id === currentTab);
              return (
                <div key={dropdown.id}>
                  <button
                    onClick={() => handleDropdownToggle(dropdown.id)}
                    className={`dropdown-header w-full px-5 py-3.5 flex items-center justify-between border-b border-zinc-100 ${isGroupActive ? 'bg-[#f3f0ff]' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={isGroupActive || dropdown.state ? 'text-[#3b2063]' : 'text-zinc-500'}>
                        {dropdown.icon}
                      </span>
                      <span className={`text-[12px] font-bold uppercase tracking-widest ${isGroupActive || dropdown.state ? 'text-[#1a0f2e]' : 'text-zinc-700'}`}>
                        {dropdown.label}
                      </span>
                    </div>
                    <ChevronDown
                      size={13}
                      className={`transition-transform duration-300 text-zinc-400 ${dropdown.state ? 'rotate-180' : ''}`}
                    />
                  </button>

                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${dropdown.state ? 'max-h-125 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="ml-5 pl-3 border-l-2 border-zinc-100 py-1.5 flex flex-col">
                      {dropdown.items.map((item) => {
                        const isLocked =
                          (item.id === 'menu' && (isMenuLocked || isEodLocked)) ||
                          (item.id === 'z-reading' && !isEodLocked);
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              if (item.id === 'menu') {
                                const isUnlockedNow = localStorage.getItem('cashier_menu_unlocked') === 'true';
                                if (isMenuLocked && !isUnlockedNow) setShowCashInRequired(true);
                                else if (isEodLocked) setShowEodLockedModal(true);
                                else navigate('/pos');
                              } else if (item.id === 'z-reading' && !isEodLocked) {
                                setShowZReadingBlockedModal(true);
                              } else {
                                setCurrentTab(item.id);
                                if (window.innerWidth < 768) setSidebarOpen(false);
                              }
                            }}
                            className={`sub-item text-left py-2.5 pr-4 flex items-center justify-between w-full text-[13px] font-medium text-zinc-600
                              ${isLocked ? 'opacity-30 cursor-not-allowed' : ''}
                              ${currentTab === item.id ? 'active' : ''}`}
                          >
                            {item.label}
                            {isLocked && <Lock size={10} className="text-zinc-400 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}

            <NavBtn active={currentTab === 'expense'} icon={<Wallet size={17} />} label="Expense" onClick={() => { setCurrentTab('expense'); closeAllDropdowns(); }} />
            <NavBtn active={currentTab === 'settings'} icon={<SettingsIcon size={17} />} label="Settings" onClick={() => { setCurrentTab('settings'); closeAllDropdowns(); }} />
          </nav>
        </div>

        {/* Footer */}
        <div className="shrink-0 px-5 py-5 bg-white border-t border-zinc-100">
          <button
            onClick={() => setShowLogoutConfirm(true)}
            disabled={isLoggingOut}
            className="flex items-center justify-center w-full py-3.5 bg-[#be2525] hover:bg-[#a11f1f] text-white text-sm font-bold uppercase tracking-widest transition-colors active:scale-95 disabled:opacity-80 disabled:cursor-not-allowed"
          >
            {isLoggingOut ? (
              <>
                {/* Spinner ring */}
                <div className="relative w-4 h-4 mr-2 shrink-0">
                  <div className="absolute inset-0 rounded-full border-2 border-white/30" />
                  <div className="logout-spinner absolute inset-0 rounded-full border-2 border-transparent border-t-white" />
                </div>
                Logging out...
              </>
            ) : (
              <>
                <LogOut size={14} className="mr-2" strokeWidth={2.5} />
                Logout
              </>
            )}
          </button>
          <p className="text-[12px] font-bold text-zinc-800 uppercase tracking-[0.2em] text-center mt-4">
            Lucky Boba &copy; 2026
          </p>
        </div>
      </aside>

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  );
};

// --- NAV BUTTON ---
const NavBtn = ({ active, icon, label, onClick }: NavBtnProps) => (
  <button
    onClick={onClick}
    className={`nav-btn w-full px-5 py-3.5 flex items-center gap-3 border-b border-zinc-100 ${active ? 'active' : ''}`}
  >
    <span className={active ? 'text-[#3b2063]' : 'text-zinc-500'}>{icon}</span>
    <span className={`text-[12px] font-bold uppercase tracking-widest ${active ? 'text-[#1a0f2e]' : 'text-zinc-700'}`}>
      {label}
    </span>
  </button>
);

export default Sidebar;