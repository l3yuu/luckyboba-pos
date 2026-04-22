// BM_Sub-Categories.tsx — Read-only SuperAdmin-style sub-category list for BM
import { useState, useEffect, useCallback } from "react";
import {
  RefreshCw, AlertCircle, Layers, Search,
  ToggleLeft, ToggleRight,
} from "lucide-react";

// ── Auth ─────────────────────────────────────────────────────────────────────
const getToken = () =>
  localStorage.getItem("auth_token") || localStorage.getItem("lucky_boba_token") || "";
const authHeaders = (): Record<string, string> => ({
  "Content-Type": "application/json",
  "Accept":       "application/json",
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

// ── Types ────────────────────────────────────────────────────────────────────
interface SubCategory {
  id:          number;
  name:        string;
  category_id: number;
  category:    string;
  item_count:  number;
  is_active:   boolean;
}
interface Category { id: number; name: string; }

// ── Btn ───────────────────────────────────────────────────────────────────────
const Btn: React.FC<{
  children: React.ReactNode; variant?: "secondary" | "ghost";
  onClick?: () => void; disabled?: boolean; className?: string;
}> = ({ children, variant = "secondary", onClick, disabled = false, className = "" }) => {
  const v = {
    secondary: "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50",
    ghost:     "bg-transparent text-zinc-500 hover:bg-zinc-100",
  };
  return (
    <button onClick={onClick} disabled={disabled}
      className={`inline-flex items-center gap-1.5 font-bold rounded-lg transition-all px-3 py-2 text-xs active:scale-[0.98] cursor-pointer disabled:opacity-50 ${v[variant]} ${className}`}>
      {children}
    </button>
  );
};

const SkeletonBar: React.FC<{ h?: string }> = ({ h = "h-4" }) => (
  <div className={`w-full ${h} bg-zinc-100 rounded animate-pulse`} />
);

// ── Main Component ────────────────────────────────────────────────────────────
const BM_SubCategories: React.FC = () => {
  const [subs,       setSubs]       = useState<SubCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [filterCat,  setFilterCat]  = useState("");
  const [search,     setSearch]     = useState("");

  const fetchAll = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [subsRes, catsRes] = await Promise.all([
        fetch("/api/sub-categories", { headers: authHeaders() }),
        fetch("/api/categories",     { headers: authHeaders() }),
      ]);
      const [subsData, catsData] = await Promise.all([subsRes.json(), catsRes.json()]);

      if (!subsRes.ok) throw new Error("Failed to load.");

      const rawCats = Array.isArray(catsData) ? catsData : (catsData.data ?? []);
      setCategories(rawCats);

      const rawSubs = Array.isArray(subsData) ? subsData : (subsData.data ?? []);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setSubs(rawSubs.map((s: any) => ({
        id:          s.id,
        name:        s.name,
        category_id: s.category_id,
        category:    s.mainCategory ?? s.category?.name ?? rawCats.find((c: Category) => c.id === s.category_id)?.name ?? "—",
        item_count:  Number(s.itemCount ?? s.item_count ?? 0),
        is_active:   Boolean(s.is_active ?? true),
      })));
    } catch { setError("Failed to load sub-categories."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered  = subs.filter(s => {
    const matchCat    = !filterCat || String(s.category_id) === filterCat;
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.category.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });
  const grouped   = categories.reduce((acc, cat) => {
    const children = filtered.filter(s => s.category_id === cat.id);
    if (children.length > 0) acc[cat.id] = { cat, children };
    return acc;
  }, {} as Record<number, { cat: Category; children: SubCategory[] }>);
  const ungrouped = filtered.filter(s => !categories.find(c => c.id === s.category_id));

  const tableHeaders = ["Name", "Parent Category", "Items", "Active"];

  return (
    <div className="p-6 md:p-8 fade-in">

      <div className="flex flex-col md:flex-row md:items-center gap-6 mb-8">
        <div className="flex-1 flex flex-col md:flex-row items-center gap-3">
          <div className="relative group flex-1 w-full md:w-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-[#a020f0]" size={15} />
            <input
              type="text"
              placeholder="Search sub-categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#ede8ff] focus:border-[#a020f0] transition-all shadow-sm"
            />
          </div>

          <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
            className="bg-white border border-zinc-200 rounded-xl px-4 py-3 text-xs font-bold text-zinc-600 outline-none shadow-sm cursor-pointer hover:bg-zinc-50 transition-all shrink-0 w-full md:w-auto">
            <option value="">All Parent Categories</option>
            {categories.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
          </select>

          <div className="flex items-center gap-2 shrink-0 ml-auto w-full md:w-auto">
            <Btn onClick={fetchAll} disabled={loading} className="w-full md:w-auto px-5 py-3 rounded-xl shadow-sm">
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
            </Btn>
          </div>
        </div>
      </div>



      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle size={14} className="text-red-500 shrink-0" />
          <p className="text-xs text-red-600 font-medium">{error}</p>
          <Btn onClick={fetchAll} className="ml-auto">Retry</Btn>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="flex flex-col gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white border border-zinc-200 rounded-[0.625rem] overflow-hidden">
              <div className="px-5 py-3 border-b border-zinc-100"><SkeletonBar h="h-4" /></div>
              {[...Array(3)].map((_, j) => (
                <div key={j} className="px-5 py-4 border-b border-zinc-50 flex gap-4">
                  {[...Array(4)].map((_, k) => <SkeletonBar key={k} h="h-3" />)}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Grouped by category */}
      {!loading && (
        <div className="flex flex-col gap-4">
          {Object.values(grouped).map(({ cat, children }) => (
            <div key={cat.id} className="bg-white border border-zinc-200 rounded-[0.625rem] overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-3.5 border-b border-zinc-100 bg-zinc-50/50">
                <div className="w-2 h-6 rounded-full bg-[#a020f0] shrink-0" />
                <p className="text-xs font-black text-[#1a0f2e] uppercase tracking-widest">{cat.name}</p>
                <span className="text-[10px] font-bold text-zinc-400 ml-auto">{children.length} sub-categories</span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-50">
                    {tableHeaders.map(h => (
                      <th key={h} className="px-5 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-zinc-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {children.map(sub => (
                    <tr key={sub.id} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <Layers size={12} className="text-zinc-300 shrink-0" />
                          <span className="font-semibold text-[#1a0f2e] text-xs">{sub.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-600 border border-zinc-200">
                          {sub.category}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {sub.item_count > 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-200">
                            {sub.item_count} items
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-zinc-300">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        {sub.is_active
                          ? <ToggleRight size={22} className="text-[#a020f0]" />
                          : <ToggleLeft  size={22} className="text-zinc-300"  />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          {/* Ungrouped */}
          {ungrouped.length > 0 && (
            <div className="bg-white border border-zinc-200 rounded-[0.625rem] overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-3.5 border-b border-zinc-100 bg-zinc-50/50">
                <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">Uncategorized</p>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-50">
                    {tableHeaders.map(h => (
                      <th key={h} className="px-5 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-zinc-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ungrouped.map(sub => (
                    <tr key={sub.id} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                      <td className="px-5 py-3.5 font-semibold text-[#1a0f2e] text-xs">{sub.name}</td>
                      <td className="px-5 py-3.5"><span className="text-[10px] font-medium text-zinc-300">—</span></td>
                      <td className="px-5 py-3.5">
                        {sub.item_count > 0
                          ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-200">{sub.item_count} items</span>
                          : <span className="text-[10px] font-medium text-zinc-300">—</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        {sub.is_active
                          ? <ToggleRight size={22} className="text-[#a020f0]" />
                          : <ToggleLeft  size={22} className="text-zinc-300"  />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {filtered.length === 0 && !loading && (
            <div className="bg-white border border-zinc-200 rounded-[0.625rem] py-12 text-center text-zinc-400 text-xs font-medium">
              No sub-categories found.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BM_SubCategories;
