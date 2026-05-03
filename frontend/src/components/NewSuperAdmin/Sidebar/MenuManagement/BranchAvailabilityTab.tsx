import React, { useState, useEffect, useMemo } from "react";
import { 
  Building2, Search, RefreshCw, 
  CheckCircle2, XCircle,
  Utensils, Coffee, Layers, Package, Sliders
} from "lucide-react";

const getToken = () => localStorage.getItem("auth_token") || localStorage.getItem("lucky_boba_token") || "";

const authHeaders = () => ({
  "Content-Type": "application/json",
  "Accept": "application/json",
  "Authorization": `Bearer ${getToken()}`,
});

type EntityType = 'menu_item' | 'category' | 'sub_category' | 'add_on' | 'bundle';

interface Branch {
  id: number;
  name: string;
}

interface EntityItem {
  id: number;
  name: string;
  category?: string;
  is_available: boolean;
}

const BranchAvailabilityTab: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<EntityType>('menu_item');
  const [items, setItems] = useState<EntityItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Load branches on mount
  useEffect(() => {
    fetch("/api/admin/branch-availability/branches", { headers: authHeaders() })
      .then(r => r.json())
      .then(data => {
        setBranches(data);
        if (data.length > 0) setSelectedBranchId(data[0].id);
      })
      .catch(err => console.error("Failed to load branches", err));
  }, []);

  // Load items when branch or tab changes
  const fetchItems = async () => {
    if (!selectedBranchId) return;
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [selectedBranchId, activeTab]);

  const handleToggle = async (id: number) => {
    if (!selectedBranchId) return;
    
    // Optimistic update
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, is_available: !item.is_available } : item
    ));

    try {
      const res = await fetch("/api/admin/branch-availability/toggle", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          branch_id: selectedBranchId,
          entity_type: activeTab,
          entity_id: id
        })
      });
      const data = await res.json();
      if (!data.success) {
        // Revert on failure
        fetchItems();
      }
    } catch (err) {
      console.error("Toggle failed", err);
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

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header with Branch Selector */}
      <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-violet-100 border border-violet-200 rounded-xl flex items-center justify-center text-violet-600">
            <Building2 size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-zinc-800">Branch Availability</h1>
            <p className="text-xs text-zinc-500 font-medium">Manage menu visibility per branch</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Target Branch:</label>
          <select 
            value={selectedBranchId || ""} 
            onChange={(e) => setSelectedBranchId(Number(e.target.value))}
            className="bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm font-bold text-zinc-700 outline-none focus:ring-2 focus:ring-violet-400 min-w-[200px]"
          >
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          <button 
            onClick={fetchItems}
            className="p-2 hover:bg-zinc-100 rounded-lg transition-colors text-zinc-400 hover:text-zinc-600"
            title="Refresh list"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Tabs and Search */}
      <div className="px-6 py-2 border-b border-zinc-100 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-xl">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === tab.id 
                ? "bg-white text-violet-600 shadow-sm" 
                : "text-zinc-500 hover:bg-zinc-200/50"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
          <input 
            type="text" 
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-violet-400 transition-all"
          />
        </div>
      </div>

      {/* Content Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading && items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-zinc-400 gap-3">
            <RefreshCw size={32} className="animate-spin" />
            <p className="text-sm font-medium">Loading availability data...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredItems.map(item => (
              <div 
                key={item.id}
                className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                  item.is_available 
                  ? "bg-white border-zinc-100 hover:border-violet-200" 
                  : "bg-zinc-50 border-zinc-200 opacity-80"
                }`}
              >
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className={`text-sm font-bold truncate ${item.is_available ? "text-zinc-800" : "text-zinc-500"}`}>
                    {item.name}
                  </span>
                  {item.category && (
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">
                      {item.category}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleToggle(item.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
                    item.is_available
                    ? "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"
                    : "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100"
                  }`}
                >
                  {item.is_available ? (
                    <>
                      <CheckCircle2 size={12} />
                      AVAILABLE
                    </>
                  ) : (
                    <>
                      <XCircle size={12} />
                      UNAVAILABLE
                    </>
                  )}
                </button>
              </div>
            ))}

            {filteredItems.length === 0 && (
              <div className="col-span-full py-12 flex flex-col items-center justify-center text-zinc-400 gap-2 border-2 border-dashed border-zinc-100 rounded-2xl">
                <Search size={32} />
                <p className="text-sm font-medium">No {activeTab.replace('_', ' ')}s found</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="px-6 py-3 border-t border-zinc-100 bg-zinc-50 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase">
          <Building2 size={12} />
          {branches.find(b => b.id === selectedBranchId)?.name || "No branch selected"}
        </div>
        <p className="text-[10px] text-zinc-400 font-medium italic">
          Changes take effect instantly on POS and Kiosk menus for this branch.
        </p>
      </div>
    </div>
  );
};

export default BranchAvailabilityTab;
