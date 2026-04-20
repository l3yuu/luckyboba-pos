// components/TeamLeader/Menu/TL_SubCategoriesTab.tsx
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  AlertCircle, X, Layers, Check,
  ChevronDown, Search,
} from "lucide-react";
import { SkeletonBar, SkeletonBox } from "../SharedSkeletons";


const getToken = () =>
  localStorage.getItem("auth_token") || localStorage.getItem("lucky_boba_token") || "";
const authHeaders = (): Record<string, string> => ({
  "Content-Type": "application/json",
  "Accept": "application/json",
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

interface SubCategory {
  id: number;
  name: string;
  category_id: number;
  category: string;
  item_count: number;
  is_active: boolean;
}
interface Category { id: number; name: string; color?: string; }


const TL_SubCategoriesTab: React.FC = () => {
  const [subs, setSubs] = useState<SubCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [search, setSearch] = useState("");

  const fetchAll = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [subsRes, catsRes] = await Promise.all([
        fetch("/api/sub-categories", { headers: authHeaders() }),
        fetch("/api/categories", { headers: authHeaders() }),
      ]);
      const [subsData, catsData] = await Promise.all([
        subsRes.json(), catsRes.json(),
      ]);

      const rawCats = Array.isArray(catsData) ? catsData : (catsData.data ?? []);
      setCategories(rawCats);

      const rawSubs = Array.isArray(subsData) ? subsData : (subsData.data ?? []);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setSubs(rawSubs.map((s: any) => ({
        id: s.id,
        name: s.name,
        category_id: s.category_id,
        category: s.mainCategory ?? s.category?.name ?? rawCats.find((c: Category) => c.id === s.category_id)?.name ?? "—",
        item_count: Number(s.itemCount ?? s.item_count ?? 0),
        is_active: s.is_active === 1 || s.is_active === true || s.is_active === "1" || (s.is_active === undefined ? true : false),
      })));
    } catch { setError("Failed to load sub-categories."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = useMemo(() => {
    return subs.filter(s => {
      const matchCat = filterCat === "all" || String(s.category_id) === filterCat;
      const matchSearch = s.name.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [subs, filterCat, search]);

  const grouped = useMemo(() => {
    return categories.reduce((acc, cat) => {
      const children = filtered.filter(s => s.category_id === cat.id);
      if (children.length > 0) acc[cat.id] = { cat, children };
      return acc;
    }, {} as Record<number, { cat: Category; children: SubCategory[] }>);
  }, [categories, filtered]);

  const ungrouped = useMemo(() => {
    return filtered.filter(s => !categories.find(c => c.id === s.category_id));
  }, [categories, filtered]);

  return (
    <div className="p-6 md:p-8 fade-in">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {loading ? (
          [...Array(4)].map((_, i) => <SkeletonBox key={i} className="h-[88px] bg-white/50" />)
        ) : (
          [
            { label: "Total Sub-Cats", value: subs.length, color: "bg-indigo-50 text-indigo-600 border-indigo-100" },
            { label: "Active", value: subs.filter(s => s.is_active).length, color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
            { label: "Inactive", value: subs.filter(s => !s.is_active).length, color: "bg-red-50 text-red-500 border-red-100" },
            { label: "Total Items Linked", value: subs.reduce((sum, s) => sum + s.item_count, 0), color: "bg-amber-50 text-amber-600 border-amber-100" },
          ].map((s, i) => (
            <div key={i} className={`px-5 py-4 rounded-2xl border ${s.color}`}>
              <p className="text-2xl font-black mb-0.5 tabular-nums">{s.value}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">{s.label}</p>
            </div>
          ))
        )}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-violet-500 transition-colors" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search sub-categories..."
              className="pl-9 pr-4 py-2 text-sm font-medium bg-white border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all w-64"
            />
          </div>

          <div className="relative">
            <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
              className="appearance-none text-xs font-bold text-zinc-600 bg-white border border-zinc-200 rounded-xl pl-3 pr-8 py-2 outline-none focus:ring-2 focus:ring-violet-400 cursor-pointer transition-all">
              <option value="all">All Parent Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          </div>

          {(filterCat !== "all" || search) && (
            <button onClick={() => { setFilterCat("all"); setSearch(""); }}
              className="text-xs font-bold text-zinc-400 hover:text-red-500 flex items-center gap-1.5 transition-colors pl-1">
              <X size={14} /> Clear filters
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
          <AlertCircle size={16} className="text-red-500 shrink-0" />
          <p className="text-sm text-red-600 font-medium">{error}</p>
        </div>
      )}

      {/* Grouped by category */}
      <div className="flex flex-col gap-6">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 flex gap-4">
                <SkeletonBar h="h-4 w-32" />
                <SkeletonBar h="h-4 w-10 ml-auto" />
              </div>
              {[...Array(3)].map((_, j) => (
                <div key={j} className="px-6 py-4 border-b border-zinc-50 flex gap-4">
                  {[...Array(4)].map((_, k) => <SkeletonBar key={k} h="h-3" />)}
                </div>
              ))}
            </div>
          ))
        ) : (
          <>
            {Object.values(grouped).map(({ cat, children }) => (
              <div key={cat.id} className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
                  <div className="w-1.5 h-6 rounded-full bg-[#3b2063] shrink-0" />
                  <p className="text-xs font-black text-[#1a0f2e] uppercase tracking-widest">{cat.name}</p>
                  <span className="ml-auto bg-zinc-100 text-[10px] font-black tracking-widest text-zinc-400 px-2 py-1 rounded-lg">
                    {children.length} SUB-GROUPS
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b border-zinc-50">
                        <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Sub-Category Name</th>
                        <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Items Reference</th>
                        <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                      {children.map(sub => (
                        <tr key={sub.id} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-7 h-7 bg-indigo-50 border border-indigo-100 flex items-center justify-center rounded-lg text-indigo-500">
                                <Layers size={12} />
                              </div>
                              <span className="font-bold text-[#1a0f2e] text-xs">
                                {sub.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {sub.item_count > 0 ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black bg-violet-50 text-violet-700 border border-violet-200">
                                {sub.item_count} ITEMS
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-zinc-300 tracking-wider">NO ITEMS</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-center">
                              {sub.is_active ? (
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-full">
                                  <Check size={12} className="stroke-[3]" />
                                  <span className="text-[10px] font-black uppercase tracking-wider">Visible</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-50 border border-zinc-200 text-zinc-400 rounded-full">
                                  <X size={12} className="stroke-[3]" />
                                  <span className="text-[10px] font-black uppercase tracking-wider">Hidden</span>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}

            {/* Ungrouped */}
            {ungrouped.length > 0 && (
              <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
                  <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">Uncategorized Reference</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b border-zinc-50">
                        <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Sub-Category Name</th>
                        <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Items</th>
                        <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                      {ungrouped.map(sub => (
                        <tr key={sub.id} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-[#1a0f2e] text-xs">{sub.name}</td>
                          <td className="px-6 py-4">
                            {sub.item_count > 0 ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black bg-zinc-50 text-zinc-600 border border-zinc-200 uppercase">{sub.item_count} ITEMS</span>
                            ) : <span className="text-[10px] font-bold text-zinc-200 tracking-wider">EMPTY</span>}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-center">
                              {sub.is_active ? (
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-full">
                                  <Check size={12} className="stroke-[3]" />
                                  <span className="text-[10px] font-black uppercase tracking-wider">Visible</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-50 border border-zinc-200 text-zinc-400 rounded-full">
                                  <X size={12} className="stroke-[3]" />
                                  <span className="text-[10px] font-black uppercase tracking-wider">Hidden</span>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {filtered.length === 0 && !loading && (
              <div className="bg-white border border-zinc-200 rounded-2xl py-24 text-center shadow-sm">
                <Layers size={48} className="text-zinc-100 mx-auto mb-4" />
                <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">No sub-categories found</p>
                <p className="text-xs text-zinc-300 mt-1">Try adjusting your filters or search terms</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TL_SubCategoriesTab;
