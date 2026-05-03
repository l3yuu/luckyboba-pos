import React, { useState, useEffect, useMemo, useCallback } from "react";
import { 
  Search, RefreshCw, X,
  Utensils, Coffee, Layers, Package, Sliders,
  AlertCircle, ChevronDown, ToggleLeft, ToggleRight, Info
} from "lucide-react";

const getToken = () => localStorage.getItem("auth_token") || localStorage.getItem("lucky_boba_token") || "";

const authHeaders = () => ({
  "Content-Type": "application/json",
  "Accept": "application/json",
  "Authorization": `Bearer ${getToken()}`,
});

type EntityType = 'menu_item' | 'category' | 'sub_category' | 'add_on' | 'bundle';
type VariantKey = "primary" | "secondary" | "danger" | "ghost";
type SizeKey = "sm" | "md" | "lg";

interface Branch {
  id: number;
  name: string;
}

interface EntityItem {
  id: number;
  name: string;
  category?: string;
  is_available: boolean;
  is_active?: boolean;
  status?: string;
  type?: string;
}

interface BtnProps {
  children: React.ReactNode; variant?: VariantKey; size?: SizeKey;
  onClick?: () => void; className?: string; disabled?: boolean; type?: "button" | "submit" | "reset";
}
const Btn: React.FC<BtnProps> = ({ children, variant = "primary", size = "sm", onClick, className = "", disabled = false, type = "button" }) => {
  const sizes: Record<SizeKey, string> = { sm: "px-3 py-2 text-xs", md: "px-4 py-2.5 text-sm", lg: "px-6 py-3 text-sm" };
  const variants: Record<VariantKey, string> = {
    primary: "bg-[#6a12b8] hover:bg-[#2a1647] text-white",
    secondary: "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50",
    danger: "bg-red-600 hover:bg-red-700 text-white",
    ghost: "bg-transparent text-zinc-500 hover:bg-zinc-100",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`inline-flex items-center gap-1.5 font-bold rounded-lg transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 ${sizes[size]} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

const SkeletonBar: React.FC<{ h?: string; w?: string }> = ({ h = "h-4", w = "w-full" }) => (
  <div className={`${w} ${h} bg-zinc-100 rounded animate-pulse`} />
);

const BranchAvailabilityTab: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<EntityType>('menu_item');
  const [items, setItems] = useState<EntityItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");

  // Load branches on mount
  useEffect(() => {
    fetch("/api/admin/branch-availability/branches", { headers: authHeaders() })
      .then(r => r.json())
      .then(data => {
        setBranches(data);
        if (data.length > 0) setSelectedBranchId(data[0].id);
      })
      .catch(err => {
        console.error("Failed to load branches", err);
        setError("Failed to load branches. Please check your connection.");
      });
  }, []);

  // Load items when branch or tab changes
  const fetchItems = useCallback(async () => {
    if (!selectedBranchId) return;
    setLoading(true);
    setError("");
    try {
      const endpointMap: Record<EntityType, string> = {
        menu_item: 'items',
        category: 'categories',
        sub_category: 'sub-categories',
        add_on: 'add-ons',
        bundle: 'bundles'
      };
      const res = await fetch(`/api/admin/branch-availability/${selectedBranchId}/${endpointMap[activeTab]}`, {
        headers: authHeaders()
      });
      const data = await res.json();
      setItems(data);
    } catch (err) {
      console.error("Failed to fetch items", err);
      setError("Failed to fetch availability data.");
    } finally {
      setLoading(false);
    }
  }, [selectedBranchId, activeTab]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleToggle = async (item: EntityItem) => {
    if (!selectedBranchId) return;
    
    const originalStatus = item.is_available;
    // Optimistic update
    setItems(prev => prev.map(i => 
      i.id === item.id ? { ...i, is_available: !i.is_available } : i
    ));

    try {
      const res = await fetch("/api/admin/branch-availability/toggle", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          branch_id: selectedBranchId,
          entity_type: activeTab,
          entity_id: item.id
        })
      });
      const data = await res.json();
      if (!data.success) {
        // Revert on failure
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_available: originalStatus } : i));
      }
    } catch (err) {
      console.error("Toggle failed", err);
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_available: originalStatus } : i));
    }
  };

  const handleToggleGlobal = async (item: EntityItem) => {
    const isGloballyDeactivated = (item.is_active === false) || (item.status === 'inactive');
    
    // Optimistic update
    setItems(prev => prev.map(i => {
      if (i.id !== item.id) return i;
      if (activeTab === 'menu_item') {
        return { ...i, status: isGloballyDeactivated ? 'active' : 'inactive' };
      }
      return { ...i, is_active: !i.is_active };
    }));

    try {
      const res = await fetch("/api/admin/branch-availability/toggle-global", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          entity_type: activeTab,
          entity_id: item.id
        })
      });
      const data = await res.json();
      if (!data.success) {
        // Revert on failure (simplest way is to refresh)
        fetchItems();
      }
    } catch (err) {
      console.error("Toggle global failed", err);
      fetchItems();
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter(i => 
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (i.category && i.category.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [items, searchQuery]);

  const tabs: { id: EntityType; label: string; icon: React.ReactNode }[] = [
    { id: 'menu_item',    label: 'Items',      icon: <Coffee size={14} /> },
    { id: 'category',     label: 'Categories', icon: <Layers size={14} /> },
    { id: 'sub_category', label: 'Sub-Cats',   icon: <Sliders size={14} /> },
    { id: 'add_on',       label: 'Add-Ons',    icon: <Utensils size={14} /> },
    { id: 'bundle',       label: 'Bundles',    icon: <Package size={14} /> },
  ];

  const selectedBranchName = branches.find(b => b.id === selectedBranchId)?.name || "Select Branch";

  return (
    <div className="p-6 md:p-8 fade-in">
      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {(() => {
          const effectiveItems = items.map(i => {
            const isGloballyDeactivated = (i.is_active === false) || (i.status === 'inactive');
            return { ...i, isEffectiveAvailable: i.is_available && !isGloballyDeactivated };
          });
          
          return [
            { label: `Total ${activeTab.replace('_', ' ')}s`, value: items.length, color: "bg-violet-50 border-violet-200 text-violet-600" },
            { label: "Available", value: effectiveItems.filter(i => i.isEffectiveAvailable).length, color: "bg-emerald-50 border-emerald-200 text-emerald-600" },
            { label: "Unavailable", value: effectiveItems.filter(i => !i.isEffectiveAvailable).length, color: "bg-red-50 border-red-200 text-red-500" },
            { label: "Selected Branch", value: branches.length, sub: selectedBranchName, color: "bg-amber-50 border-amber-200 text-amber-600" },
          ].map((s, i) => (
            <div key={i} className={`border rounded-[0.625rem] px-4 py-3 ${s.color.split(" ").slice(0, 2).join(" ")}`}>
              <p className={`text-xl font-black tabular-nums ${s.color.split(" ")[2]}`}>{loading && items.length === 0 ? "—" : (s.sub ? branches.length : s.value)}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-0.5">{s.label}</p>
              {s.sub && <p className="text-[9px] font-bold text-zinc-400 truncate mt-1">{s.sub}</p>}
            </div>
          ));
        })()}
      </div>

      {error && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle size={14} className="text-red-500 shrink-0" />
          <p className="text-xs text-red-600 font-medium">{error}</p>
          <Btn variant="secondary" size="sm" onClick={fetchItems} className="ml-auto">Retry</Btn>
        </div>
      )}

      <div className="bg-white border border-zinc-200 rounded-[0.625rem] overflow-hidden">
        {/* Filters */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-100 flex-wrap">
          <div className="flex-1 min-w-48 flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2">
            <Search size={13} className="text-zinc-400" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm text-zinc-700 outline-none placeholder:text-zinc-400"
              placeholder={`Search ${activeTab.replace('_', ' ')}...`} />
            {searchQuery && <button onClick={() => setSearchQuery("")} className="text-zinc-300 hover:text-zinc-500"><X size={12} /></button>}
          </div>

          <div className="relative">
            <select 
              value={selectedBranchId || ""} 
              onChange={(e) => setSelectedBranchId(Number(e.target.value))}
              className="appearance-none text-xs font-bold text-zinc-600 bg-white border border-zinc-200 rounded-lg pl-3 pr-8 py-2 outline-none focus:ring-2 focus:ring-violet-400 cursor-pointer min-w-[180px]"
            >
              <option value="" disabled>Select Branch</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          </div>

          <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-lg shrink-0">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${
                  activeTab === tab.id 
                  ? "bg-white text-violet-600 shadow-sm border border-zinc-200/50" 
                  : "text-zinc-500 hover:bg-zinc-200/50"
                }`}
              >
                {tab.icon}
                <span className="uppercase tracking-wider">{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Btn variant="secondary" onClick={fetchItems} disabled={loading || !selectedBranchId}>
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              Refresh
            </Btn>
          </div>
        </div>

        {/* Table List */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-zinc-400">Name</th>
                <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-zinc-400">Category</th>
                <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-zinc-400">Status</th>
                <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-zinc-400">Global</th>
                <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-zinc-400">Available</th>
              </tr>
            </thead>
            <tbody>
              {loading && items.length === 0 && [...Array(6)].map((_, i) => (
                <tr key={i} className="border-b border-zinc-50">
                  {[...Array(5)].map((_, j) => <td key={j} className="px-5 py-4"><SkeletonBar h="h-3" /></td>)}
                </tr>
              ))}
              {!loading && filteredItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-zinc-400 text-xs font-medium italic">
                    <div className="flex flex-col items-center gap-2">
                      <Search size={24} className="opacity-20" />
                      <p>No {activeTab.replace('_', ' ')}s match your current criteria.</p>
                    </div>
                  </td>
                </tr>
              )}
              {!loading && filteredItems.map(item => (
                <tr key={item.id} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors group">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0">
                        {activeTab === 'menu_item' ? <Coffee size={12} className="text-violet-400" /> : 
                         activeTab === 'bundle' ? <Package size={12} className="text-violet-400" /> :
                         activeTab === 'add_on' ? <Utensils size={12} className="text-violet-400" /> :
                         <Layers size={12} className="text-violet-400" />}
                      </div>
                      <span className={`font-semibold text-xs transition-colors ${item.is_available ? "text-[#1a0f2e]" : "text-zinc-400"}`}>
                        {item.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    {item.category ? (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border transition-colors ${
                        item.is_available 
                        ? "bg-violet-50 text-violet-700 border-violet-200" 
                        : "bg-zinc-100 text-zinc-400 border-zinc-200"
                      }`}>
                        {item.category}
                      </span>
                    ) : (
                      <span className="text-zinc-300 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    {(() => {
                      const isGloballyDeactivated = (item.is_active === false) || (item.status === 'inactive');
                      const isEffectiveAvailable = item.is_available && !isGloballyDeactivated;
                      
                      return (
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${isEffectiveAvailable ? "bg-emerald-500 animate-pulse" : "bg-red-400"}`} />
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${isEffectiveAvailable ? "text-emerald-600" : "text-red-400"}`}>
                            {isEffectiveAvailable ? "Available" : isGloballyDeactivated ? "Unavailable" : "Hidden"}
                          </span>
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {(() => {
                      const isGloballyActive = (item.is_active !== false) && (item.status !== 'inactive');
                      return (
                        <button 
                          onClick={() => handleToggleGlobal(item)} 
                          className="transition-transform active:scale-90"
                          title={isGloballyActive ? "Globally Deactivate" : "Globally Activate"}
                        >
                          {isGloballyActive 
                            ? <ToggleRight size={24} className="text-[#6a12b8] ml-auto" /> 
                            : <ToggleLeft size={24} className="text-zinc-300 ml-auto" />}
                        </button>
                      );
                    })()}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {(() => {
                      const isGloballyDeactivated = (item.is_active === false) || (item.status === 'inactive');
                      const isEffectiveAvailable = item.is_available && !isGloballyDeactivated;
                      
                      return (
                        <button 
                          onClick={() => handleToggle(item)} 
                          className="transition-transform active:scale-90"
                          title={isEffectiveAvailable ? "Disable availability" : "Enable availability"}
                        >
                          {isEffectiveAvailable 
                            ? <ToggleRight size={24} className="text-[#6a12b8] ml-auto" /> 
                            : <ToggleLeft size={24} className="text-zinc-300 ml-auto" />}
                        </button>
                      );
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && filteredItems.length > 0 && (
          <div className="px-5 py-3 border-t border-zinc-50 flex items-center justify-between">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              Showing {filteredItems.length} of {items.length} {activeTab.replace('_', ' ')}s
            </p>
            <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-medium italic">
              <Info size={10} />
              Changes take effect instantly on POS and Kiosk menus.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BranchAvailabilityTab;
