import { useState, useEffect } from 'react';
import { 
  LayoutGrid, Users, History, BarChart2, 
  Package, Search, LogOut, ShieldCheck,
  CreditCard, ArrowLeftRight, FileText, Tag, Layers, Utensils
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

interface TeamLeaderSidebarProps {
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
    ]
  },
  {
    label: 'Floor Ops',
    items: [
      { id: 'void-logs',  label: 'Void Journal',    icon: <ShieldCheck size={14} /> },
      { id: 'expenses',   label: 'Branch Expenses', icon: <CreditCard size={14} /> },
    ]
  },
  {
    label: 'Inventory',
    items: [
      { id: 'raw-materials', label: 'Raw Materials', icon: <Package size={13} /> },
      { id: 'recipes',       label: 'Recipes',       icon: <Search size={13} /> },
      { id: 'usage-report',  label: 'Usage Report',  icon: <BarChart2 size={13} /> },
      { id: 'stock-transfer', label: 'Stock Transfer', icon: <ArrowLeftRight size={13} /> },
      { id: 'purchase-order', label: 'Purchase Order', icon: <FileText size={13} /> },
      { id: 'item-checker',   label: 'Item Checker',  icon: <Search size={13} /> },
    ]
  },
  {
    label: 'Reports',
    items: [
      { id: 'sales-dashboard', label: 'Sales Analytics', icon: <BarChart2 size={13} /> },
      { id: 'items-report',    label: 'Items Report', icon: <History size={13} /> },
      { id: 'x-reading',       label: 'X-Reading', icon: <History size={13} /> },
      { id: 'z-reading',       label: 'Z-Reading', icon: <History size={13} /> },
    ]
  },
  {
    label: 'Product Menu',
    items: [
      { id: 'tl-menu-categories',    label: 'Categories',    icon: <Tag size={13} /> },
      { id: 'tl-menu-subcategories', label: 'Subcategories', icon: <Layers size={13} /> },
      { id: 'tl-menu-items',         label: 'Menu Items',    icon: <Utensils size={13} /> },
    ]
  }
];

// ── Styles ────────────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');
  .tl-sb-root, .tl-sb-root * { font-family: 'DM Sans', sans-serif !important; box-sizing: border-box; }

  .sa-scroll { overflow-y: auto; -ms-overflow-style: none; scrollbar-width: none; }
  .sa-scroll::-webkit-scrollbar { display: none; }

  .sa-tab {
    border-radius: 0.5rem; border: none; cursor: pointer;
    background: transparent; transition: background 0.1s, color 0.1s;
  }
  .sa-tab.active { background: #ede8ff; color: #3b2063; font-weight: 600; }
  .sa-tab.active::before {
    content: ''; position: absolute; left: 0; top: 18%; bottom: 18%;
    width: 2.5px; background: #3b2063; border-radius: 0 2px 2px 0;
  }
  .ops-topbar-header { background: linear-gradient(135deg, #3b2063 0%, #4c2b7d 100%); }
`;

const TeamLeaderSidebar: React.FC<TeamLeaderSidebarProps> = ({
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
    : 'TL';

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
      <aside className={`tl-sb-root fixed inset-y-0 left-0 z-[70] w-60 bg-white border-r border-zinc-100 flex-col md:flex md:relative transition-transform duration-300 ease-in-out ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        
        {/* User profile section - Unified Header Style */}
        <div className="shrink-0 px-4 pt-6 pb-4 border-b border-[#2d184d] ops-topbar-header">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[0.4rem] bg-[#ffffff20] border border-[#ffffff20] flex items-center justify-center shrink-0 shadow-sm">
              <span className="text-[0.55rem] font-black text-white tracking-wide">{initials}</span>
            </div>
            <div className="min-w-0">
              <p className="text-[0.82rem] font-bold text-white leading-tight truncate">
                {authUser?.name || 'Team Leader'}
              </p>
              <p className="text-[0.58rem] font-bold uppercase tracking-widest text-[#ddd5ff]">
                Team Leader Terminal
              </p>
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
                      currentTab === item.id ? 'active text-[#3b2063]' : 'text-zinc-500 hover:bg-[#f5f3ff] hover:text-[#3b2063]'
                    }`}
                  >
                    <div className={`shrink-0 w-8 h-8 rounded-[0.45rem] flex items-center justify-center transition-colors ${
                      currentTab === item.id ? 'bg-[#ddd5ff]' : 'bg-[#f8f9fa]'
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

export default TeamLeaderSidebar;