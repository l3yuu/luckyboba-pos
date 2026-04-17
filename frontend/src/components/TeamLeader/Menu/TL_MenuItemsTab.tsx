// components/TeamLeader/Menu/TL_MenuItemsTab.tsx
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search, AlertCircle, X, ChevronDown,
  Barcode, Utensils, Coffee, Check, Plus,
} from "lucide-react";
import { SkeletonBar, SkeletonBox } from "../SharedSkeletons";


const getToken = () =>
  localStorage.getItem("auth_token") || localStorage.getItem("lucky_boba_token") || "";
const authHeaders = (): Record<string, string> => ({
  "Content-Type": "application/json",
  "Accept": "application/json",
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

interface MenuItem {
  id: number;
  name: string;
  category_id: number | null;
  category: string;
  category_type: string;
  subcategory_id: number | null;
  subcategory: string;
  price: number;
  grab_price: number;
  panda_price: number;
  barcode: string | null;
  size: string | null;
  image_path: string | null;
  is_available: boolean;
}

interface Category { id: number; name: string; category_type: string; }
interface SubCategory { id: number; name: string; category_id: number; }
interface AddOnItem {
  id: number;
  name: string;
  price: number;
  grab_price: number;
  panda_price: number;
  barcode: string | null;
  category: string;
  is_available: boolean;
}


const TL_MenuItemsTab: React.FC = () => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addOns, setAddOns] = useState<AddOnItem[]>([]);
  const [addOnModalOpen, setAddOnModalOpen] = useState(false);
  const [addOnLoading, setAddOnLoading] = useState(false);
  const [addOnError, setAddOnError] = useState("");

  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [filterSub, setFilterSub] = useState("all");

  const fetchAll = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [itemsRes, catsRes, subsRes] = await Promise.all([
        fetch("/api/menu-items", { headers: authHeaders() }),
        fetch("/api/categories", { headers: authHeaders() }),
        fetch("/api/sub-categories", { headers: authHeaders() }),
      ]);

      const [itemsData, catsData, subsData] = await Promise.all([
        itemsRes.json(), catsRes.json(), subsRes.json(),
      ]);

      setItems(Array.isArray(itemsData) ? itemsData : (itemsData.data ?? []));
      setCategories(Array.isArray(catsData) ? catsData : (catsData.data ?? []));
      setSubCategories(Array.isArray(subsData) ? subsData : (subsData.data ?? []));
    } catch {
      setError("Failed to load menu items.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const fetchAddOns = useCallback(async () => {
    setAddOnLoading(true);
    setAddOnError("");
    try {
      const res = await fetch("/api/add-ons?all=1", { headers: authHeaders() });
      const data = await res.json();
      setAddOns(Array.isArray(data) ? data : (data.data ?? []));
    } catch {
      setAddOnError("Failed to load add-ons.");
    } finally {
      setAddOnLoading(false);
    }
  }, []);

  const openAddOnModal = async () => {
    setAddOnModalOpen(true);
    await fetchAddOns();
  };

  const filtered = useMemo(() => {
    return items.filter(i => {
      const matchSearch = i.name.toLowerCase().includes(search.toLowerCase()) ||
        (i.barcode?.toLowerCase().includes(search.toLowerCase()) ?? false);
      const matchCat = filterCat === "all" || String(i.category_id) === filterCat;
      const matchSub = filterSub === "all" || String(i.subcategory_id) === filterSub;
      return matchSearch && matchCat && matchSub;
    });
  }, [items, search, filterCat, filterSub]);

  const filteredSubs = useMemo(() => {
    if (filterCat === "all") return subCategories;
    return subCategories.filter(s => String(s.category_id) === filterCat);
  }, [subCategories, filterCat]);

  return (
    <div className="p-6 md:p-8 fade-in">
      {/* Stat Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {loading ? (
          [...Array(4)].map((_, i) => <SkeletonBox key={i} className="h-[88px] bg-white/50" />)
        ) : (
          [
            { label: "Total Items", value: items.length, color: "bg-violet-50 text-violet-600 border-violet-100" },
            { label: "Available", value: items.filter(i => i.is_available).length, color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
            { label: "Drink Items", value: items.filter(i => i.category_type === "drink").length, color: "bg-blue-50 text-blue-600 border-blue-100" },
            { label: "Food Items", value: items.filter(i => i.category_type === "food").length, color: "bg-amber-50 text-amber-600 border-amber-100" },
          ].map((s, i) => (
            <div key={i} className={`px-5 py-4 rounded-2xl border ${s.color}`}>
              <p className="text-2xl font-black mb-0.5 tabular-nums">{s.value}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">{s.label}</p>
            </div>
          ))
        )}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-violet-500 transition-colors" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search items or barcode..."
              className="pl-9 pr-4 py-2 text-sm font-medium bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white focus:border-transparent transition-all w-72"
            />
          </div>

          <div className="relative">
            <select value={filterCat} onChange={e => { setFilterCat(e.target.value); setFilterSub("all"); }}
              className="appearance-none text-xs font-bold text-zinc-600 bg-zinc-50 border border-zinc-200 rounded-xl pl-3 pr-8 py-2 outline-none focus:ring-2 focus:ring-violet-400 cursor-pointer transition-all">
              <option value="all">Every Category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select value={filterSub} onChange={e => setFilterSub(e.target.value)}
              className="appearance-none text-xs font-bold text-zinc-600 bg-zinc-50 border border-zinc-200 rounded-xl pl-3 pr-8 py-2 outline-none focus:ring-2 focus:ring-violet-400 cursor-pointer transition-all">
              <option value="all">Every Sub-Cat</option>
              {filteredSubs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          </div>

          {(search || filterCat !== "all" || filterSub !== "all") && (
            <button onClick={() => { setSearch(""); setFilterCat("all"); setFilterSub("all"); }}
              className="text-xs font-bold text-zinc-400 hover:text-red-500 flex items-center gap-1.5 transition-colors pl-1">
              <X size={14} /> Reset
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={openAddOnModal}
            className="inline-flex items-center gap-1.5 text-[10px] font-black tracking-widest text-zinc-500 uppercase bg-white px-3 py-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 transition-colors"
          >
            <Plus size={12} />
            Add-Ons
          </button>
          <span className="text-[10px] font-black tracking-widest text-zinc-400 uppercase bg-zinc-100 px-3 py-1.5 rounded-lg border border-zinc-200">
            {filtered.length} REFERENCED ITEMS
          </span>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
          <AlertCircle size={16} className="text-red-500" />
          <p className="text-sm text-red-600 font-medium">{error}</p>
        </div>
      )}

      {/* Items Table */}
      <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-100">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Item Detail</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Hierarchy</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Pricing Tiers</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 text-center">Availability</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><SkeletonBar h="h-4 w-48" /></td>
                    <td className="px-6 py-4"><SkeletonBar h="h-4 w-32" /></td>
                    <td className="px-6 py-4"><SkeletonBar h="h-4 w-60" /></td>
                    <td className="px-6 py-4 text-center"><SkeletonBar h="h-6 w-16 mx-auto rounded-full" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-32 text-center text-zinc-400">
                    <div className="flex flex-col items-center gap-3">
                      <Barcode size={48} className="text-zinc-100" />
                      <p className="text-sm font-bold uppercase tracking-widest">No items found</p>
                      <p className="text-xs">Try adjusting your search criteria</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map(item => (
                  <tr key={item.id} className="hover:bg-zinc-50/50 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-zinc-50 border border-zinc-100 rounded-xl overflow-hidden shadow-inner flex items-center justify-center relative">
                          {item.image_path ? (
                            <img src={item.image_path} alt="" className="w-full h-full object-cover" onError={e => e.currentTarget.style.display = 'none'} />
                          ) : item.category_type === "drink" ? (
                            <Coffee size={16} className="text-zinc-300" />
                          ) : (
                            <Utensils size={16} className="text-zinc-300" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-black text-[#1a0f2e] truncate">{item.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {item.size && item.size !== "none" && (
                              <span className="text-[10px] font-bold uppercase bg-violet-50 text-violet-600 px-1.5 py-0.5 rounded-lg border border-violet-100">
                                Size: {item.size}
                              </span>
                            )}
                            {item.barcode && (
                              <div className="flex items-center gap-1 text-zinc-400 group-hover:text-violet-500 transition-colors">
                                <Barcode size={10} />
                                <span className="text-[10px] font-medium tracking-tight tabular-nums">{item.barcode}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-black bg-zinc-100 text-zinc-500 uppercase tracking-tighter w-fit">
                          {item.category || "No Category"}
                        </span>
                        {item.subcategory && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-bold bg-white border border-zinc-200 text-zinc-400 uppercase tracking-wider w-fit">
                            {item.subcategory}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-wrap gap-2">
                        <div className="bg-white border border-zinc-200 rounded-xl px-2.5 py-1.5 min-w-[80px]">
                          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">In-Store</p>
                          <p className="text-xs font-black text-emerald-600">₱{Number(item.price).toFixed(2)}</p>
                        </div>
                        <div className="bg-white border border-rose-100 rounded-xl px-2.5 py-1.5 min-w-[80px]">
                          <p className="text-[9px] font-bold text-rose-300 uppercase tracking-widest mb-0.5">Grab</p>
                          <p className="text-xs font-black text-rose-600">₱{Number(item.grab_price).toFixed(2)}</p>
                        </div>
                        <div className="bg-white border border-pink-100 rounded-xl px-2.5 py-1.5 min-w-[80px]">
                          <p className="text-[9px] font-bold text-pink-300 uppercase tracking-widest mb-0.5">Panda</p>
                          <p className="text-xs font-black text-pink-600">₱{Number(item.panda_price).toFixed(2)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex justify-center">
                        {item.is_available ? (
                          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-full">
                            <Check size={12} className="stroke-[3]" />
                            <span className="text-[10px] font-black uppercase tracking-wider">Available</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-50 border border-zinc-200 text-zinc-400 rounded-full">
                            <X size={12} className="stroke-[3]" />
                            <span className="text-[10px] font-black uppercase tracking-wider">Sold Out</span>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {addOnModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => setAddOnModalOpen(false)} />
          <div className="relative bg-white w-full max-w-2xl border border-zinc-200 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-black text-[#1a0f2e]">Add-Ons</p>
                <p className="text-[11px] text-zinc-500">View mode only. Team Leader cannot modify add-ons.</p>
              </div>
              <button
                onClick={() => setAddOnModalOpen(false)}
                className="p-1.5 rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50"
                aria-label="Close add-ons modal"
              >
                <X size={14} />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto px-5 py-4">
              {addOnLoading ? (
                <p className="text-sm text-zinc-400 italic py-8 text-center">Loading add-ons...</p>
              ) : addOnError ? (
                <div className="flex flex-col items-center gap-3 py-8">
                  <p className="text-sm text-red-600 font-medium">{addOnError}</p>
                  <button
                    onClick={fetchAddOns}
                    className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                  >
                    Retry
                  </button>
                </div>
              ) : addOns.length === 0 ? (
                <p className="text-sm text-zinc-400 italic py-8 text-center">No add-ons found.</p>
              ) : (
                <div className="space-y-2">
                  {addOns.map((addon) => (
                    <div key={addon.id} className="border border-zinc-200 rounded-xl px-3 py-2.5 bg-zinc-50/40">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold text-zinc-700">{addon.name}</p>
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          addon.is_available
                            ? "text-emerald-600 bg-emerald-50 border-emerald-200"
                            : "text-zinc-500 bg-zinc-100 border-zinc-200"
                        }`}>
                          {addon.is_available ? "Available" : "Unavailable"}
                        </span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-2 text-[10px] font-semibold text-zinc-500">
                        <span className="px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200 uppercase">{addon.category}</span>
                        <span>Base: ₱{Number(addon.price).toFixed(2)}</span>
                        <span>Grab: ₱{Number(addon.grab_price).toFixed(2)}</span>
                        <span>Panda: ₱{Number(addon.panda_price).toFixed(2)}</span>
                        {addon.barcode && <span>Barcode: {addon.barcode}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-5 py-3.5 border-t border-zinc-100 flex justify-end">
              <button
                onClick={() => setAddOnModalOpen(false)}
                className="text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TL_MenuItemsTab;
