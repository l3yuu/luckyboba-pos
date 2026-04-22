import { useState, useEffect } from 'react';
import { 
  LayoutGrid, Users, History, BarChart2, 
  Package, Search, LogOut, ShieldCheck,
  ArrowRightLeft, Wallet
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────
interface AuthUser {
  id:    number;
  name:  string;
  email: string;
  role:  string;
}

interface SidebarItem {
  id:    string;
  label: string;
  icon:  React.ReactNode;
}

interface MenuGroup {
  label: string;
  items: SidebarItem[];
}

interface SupervisorSidebarProps {
  isSidebarOpen: boolean;
  setSidebarOpen: (o: boolean) => void;
  currentTab: string;
  setCurrentTab: (t: string) => void;
  onLogout: () => void;
  isLoggingOut: boolean;
}

// ── Navigation Data ──────────────────────────────────────────────────────────
const MENU_GROUPS: MenuGroup[] = [
  {
    label: 'Home',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: <LayoutGrid size={14} /> },
      { id: 'users',     label: 'Staff Overview', icon: <Users size={14} /> },
      { id: 'expenses',  label: 'Expenses', icon: <Wallet size={14} /> },
    ]
  },
  {
    label: 'Floor Ops',
    items: [
      { id: 'void-logs', label: 'Void Journal', icon: <ShieldCheck size={14} /> },
    ]
  },
  {
    label: 'Reports',
    items: [
      { id: 'sales-dashboard', label: 'Sales Analytics', icon: <BarChart2 size={13} /> },
      { id: 'items-report',    label: 'Items Report', icon: <History size={13} /> },
      { id: 'usage-report',    label: 'Usage Report', icon: <History size={13} /> },
    ]
  },
  {
    label: 'Inventory',
    items: [
      { id: 'inventory-list', label: 'Stock Levels', icon: <Package size={13} /> },
      { id: 'item-checker',   label: 'Item Checker', icon: <Search size={13} /> },
      { id: 'raw-materials',  label: 'Raw Materials', icon: <Package size={13} /> },
      { id: 'stock-transfer', label: 'Stock Transfer', icon: <ArrowRightLeft size={13} /> },
      { id: 'recipes',        label: 'Recipes', icon: <Package size={13} /> },
    ]
  },
  {
    label: 'Menu',
    items: [
      { id: 'menu-list',          label: 'Menu Items', icon: <Package size={13} /> },
      { id: 'categories-list',    label: 'Categories', icon: <Package size={13} /> },
      { id: 'sub-categories-list',label: 'Sub-Categories', icon: <Package size={13} /> },
    ]
  }
];

// ── Styles ────────────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');
  .sv-sb-root, .sv-sb-root * { font-family: 'DM Sans', sans-serif !important; box-sizing: border-box; }

  .sa-scroll { overflow-y: auto; -ms-overflow-style: none; scrollbar-width: none; }
  .sa-scroll::-webkit-scrollbar { display: none; }

  .sa-tab {
    border-radius: 0.5rem; border: none; cursor: pointer;
    background: transparent; transition: background 0.1s, color 0.1s;
  }
  .sa-tab.active { background: #6a12b810; color: #6a12b8; font-weight: 600; }
  .sa-tab.active::before {
    content: ''; position: absolute; left: 0; top: 18%; bottom: 18%;
    width: 2.5px; background: #6a12b8; border-radius: 0 2px 2px 0;
  }
  .ops-topbar-header { background: #6a12b8; }
`;

const SupervisorSidebar: React.FC<SupervisorSidebarProps> = ({
  isSidebarOpen, setSidebarOpen, currentTab, setCurrentTab, onLogout, isLoggingOut
}) => {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('auth_token') || localStorage.getItem('lucky_boba_token');
        const res = await fetch('/api/user', {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setAuthUser(data.data || data);
        }
      } catch (e) {
        console.error('Sidebar fetch error', e);
      }
    };
    fetchUser();
  }, []);

  const initials = authUser
    ? authUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'SV';

  return (
    <>
      <style>{STYLES}</style>
      
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] md:hidden animate-in fade-in duration-200"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ══════════════════════════════════════════════
          DESKTOP SIDEBAR (md and above)
      ══════════════════════════════════════════════ */}
      <aside className={`sa-sb-root fixed inset-y-0 left-0 z-[70] w-64 bg-white border-r border-zinc-100 flex-col md:flex md:relative transition-transform duration-300 ease-in-out ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        
        {/* User profile section - Unified Header Style */}
        <div className="shrink-0 h-[72px] w-[calc(100%+1px)] px-6 flex items-center border-b border-black/10 ops-topbar-header relative z-[80]">
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 shadow-sm backdrop-blur-md">
              <span className="text-[0.65rem] font-black text-white tracking-widest">{initials}</span>
            </div>
            <div className="min-w-0">
              <p className="text-[0.85rem] font-black text-white leading-tight truncate tracking-tight">
                {authUser?.name || 'Supervisor'}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <p className="text-[0.52rem] font-black uppercase tracking-[0.15em] text-[#6a12b8]/70">
                  Console Active
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation scroll area */}
        <div className="flex-1 sa-scroll px-3 py-3">
          {MENU_GROUPS.map((group, gIdx) => (
            <div key={group.label} className={gIdx > 0 ? 'mt-5' : ''}>
              <p className="px-2 pb-1.5 text-[0.58rem] font-bold uppercase tracking-widest text-zinc-400">
                {group.label}
              </p>
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentTab(item.id);
                      if (window.innerWidth < 768) setSidebarOpen(false);
                    }}
                    className={`sa-tab flex items-center gap-2.5 w-full px-2.5 py-1.5 text-[0.8rem] font-medium text-left relative transition-all ${
                      currentTab === item.id ? 'active text-[#6a12b8]' : 'text-zinc-500 hover:bg-[#6a12b805] hover:text-[#6a12b8]'
                    }`}
                  >
                    <div className={`shrink-0 w-8 h-8 rounded-[0.45rem] flex items-center justify-center transition-colors ${
                      currentTab === item.id ? 'bg-[#6a12b820]' : 'bg-[#f8f9fa]'
                    }`}>
                      {item.icon}
                    </div>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom actions */}
        <div className="shrink-0 px-3 pb-4 pt-2 border-t border-zinc-100">
          <button
            onClick={onLogout}
            disabled={isLoggingOut}
            className="sa-tab flex items-center gap-2.5 w-full px-2.5 py-1.5 text-[0.8rem] font-medium text-left text-[#be2525] hover:bg-[#fff0f0] transition-all"
          >
            <div className="shrink-0 w-8 h-8 rounded-[0.45rem] bg-[#fff0f0] flex items-center justify-center">
              <LogOut size={14} />
            </div>
            {isLoggingOut ? 'Ending...' : 'Log out'}
          </button>
          <p className="mt-3 text-[9px] font-bold uppercase tracking-widest text-zinc-300 text-center">
            Lucky Boba © 2026
          </p>
        </div>
      </aside>
    </>
  );
};

export default SupervisorSidebar;
