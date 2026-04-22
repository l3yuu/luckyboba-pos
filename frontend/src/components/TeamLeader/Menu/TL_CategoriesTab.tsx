// components/TeamLeader/Menu/TL_CategoriesTab.tsx
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  AlertCircle, X, Tag, Check, ChevronDown,
  Coffee, Search,
} from "lucide-react";
import { SkeletonBar, SkeletonBox } from "../SharedSkeletons";

type VariantKey = "primary" | "secondary" | "danger" | "ghost";
type SizeKey = "sm" | "md" | "lg";

const getToken = () =>
  localStorage.getItem("auth_token") || localStorage.getItem("lucky_boba_token") || "";
const authHeaders = (): Record<string, string> => ({
  "Content-Type": "application/json",
  "Accept": "application/json",
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

type CategoryType = "food" | "drink" | "promo";

const POS_BEHAVIOR_BY_TYPE: Record<string, string> = {
  food: "Food",
  wings: "Wings",
  waffle: "Waffle",
  combo: "Combo",
  mix_and_match: "Mix & Match",
  drink: "Drink",
  bundle: "Bundle",
  promo: "Promo",
};

const TYPE_BADGE: Record<string, string> = {
  food: "bg-amber-50 text-amber-700 border border-amber-200",
  drink: "bg-blue-50 text-blue-700 border border-blue-200",
  promo: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  wings: "bg-orange-50 text-orange-700 border border-orange-200",
  waffle: "bg-yellow-50 text-yellow-700 border border-yellow-200",
  combo: "bg-purple-50 text-purple-700 border border-purple-200",
  bundle: "bg-indigo-50 text-indigo-700 border border-indigo-200",
  mix_and_match: "bg-rose-50 text-rose-700 border border-rose-200",
};

interface Category {
  id: number;
  name: string;
  type: CategoryType;
  category_type: string;
  is_active: boolean;
  menu_items_count: number;
}

// ── Shared UI ────────────────────────────────────────────────────────────────

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



// ── Main Component ────────────────────────────────────────────────────────────

const TL_CategoriesTab: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");

  const fetchAll = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/categories", { headers: authHeaders() });
      const data = await res.json();
      const raw = Array.isArray(data) ? data : (data.data ?? []);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setCategories(raw.map((c: any) => ({ ...c, is_active: c.is_active === 1 || c.is_active === true || c.is_active === "1" || (c.is_active === undefined ? true : false) })));
    } catch { setError("Failed to load categories."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = useMemo(() => {
    return categories.filter(c => {
      const matchType = filterType === "all" || c.type === filterType;
      const matchStatus = filterStatus === "all" || (filterStatus === "active" ? c.is_active : !c.is_active);
      const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
      return matchType && matchStatus && matchSearch;
    });
  }, [categories, filterType, filterStatus, search]);

  return (
    <div className="p-6 md:p-8 fade-in">
      {/* Header Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {loading ? (
          [...Array(4)].map((_, i) => <SkeletonBox key={i} className="h-[88px] bg-white/50" />)
        ) : (
          [
            { label: "Total Categories", value: categories.length, color: "bg-violet-50 text-violet-600 border-violet-100" },
            { label: "Active", value: categories.filter(c => c.is_active).length, color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
            { label: "Food Types", value: categories.filter(c => c.type === "food").length, color: "bg-amber-50 text-amber-600 border-amber-100" },
            { label: "Drink Types", value: categories.filter(c => c.type === "drink").length, color: "bg-blue-50 text-blue-600 border-blue-100" },
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
              placeholder="Search categories..."
              className="pl-9 pr-4 py-2 text-sm font-medium bg-white border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all w-64"
            />
          </div>

          <div className="relative">
            <select value={filterType} onChange={e => setFilterType(e.target.value)}
              className="appearance-none text-xs font-bold text-zinc-600 bg-white border border-zinc-200 rounded-xl pl-3 pr-8 py-2 outline-none focus:ring-2 focus:ring-violet-400 cursor-pointer transition-all">
              <option value="all">All Types</option>
              <option value="food">Food</option>
              <option value="drink">Drink</option>
              <option value="promo">Promo</option>
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="appearance-none text-xs font-bold text-zinc-600 bg-white border border-zinc-200 rounded-xl pl-3 pr-8 py-2 outline-none focus:ring-2 focus:ring-violet-400 cursor-pointer transition-all">
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          </div>

          {(filterType !== "all" || filterStatus !== "all" || search) && (
            <button
              onClick={() => { setFilterType("all"); setFilterStatus("all"); setSearch(""); }}
              className="text-xs font-bold text-zinc-400 hover:text-red-500 transition-colors flex items-center gap-1.5 px-2"
            >
              <X size={14} /> Clear Filters
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
          <AlertCircle size={16} className="text-red-500" />
          <p className="text-sm text-red-600 font-medium">{error}</p>
          <Btn variant="ghost" size="sm" onClick={fetchAll} className="ml-auto text-red-600">Retry</Btn>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-100">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 w-12">#</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Category Name</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Type</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 text-center">Items</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><SkeletonBar h="h-3 w-4" /></td>
                    <td className="px-6 py-4"><SkeletonBar h="h-3 w-40" /></td>
                    <td className="px-6 py-4"><SkeletonBar h="h-3 w-20" /></td>
                    <td className="px-6 py-4"><SkeletonBar h="h-3 w-12 mx-auto" /></td>
                    <td className="px-6 py-4"><SkeletonBar h="h-6 w-16 mx-auto rounded-full" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Tag size={40} className="text-zinc-100 mb-2" />
                      <p className="text-sm font-bold text-zinc-400">No categories found</p>
                      <p className="text-xs text-zinc-300">Try adjusting your filters or search terms</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((cat, idx) => (
                  <tr key={cat.id} className="hover:bg-zinc-50/50 transition-colors group">
                    <td className="px-6 py-4 text-xs font-bold text-zinc-300">{idx + 1}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${cat.type === "drink" ? "bg-blue-50 border-blue-100 text-blue-600" : "bg-amber-50 border-amber-100 text-amber-600"}`}>
                          {cat.type === "drink" ? <Coffee size={14} /> : <Tag size={14} />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#1a0f2e]">{cat.name}</p>
                          <p className="text-[10px] text-zinc-400 font-medium">Original Category</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider w-fit ${TYPE_BADGE[cat.type]}`}>
                          {cat.type}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider w-fit ${TYPE_BADGE[cat.category_type]}`}>
                          {POS_BEHAVIOR_BY_TYPE[cat.category_type] || cat.category_type}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-xs font-black text-[#1a0f2e] bg-zinc-100 px-2.5 py-1 rounded-lg">
                        {cat.menu_items_count}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        {cat.is_active ? (
                          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-full">
                            <Check size={12} className="stroke-[3]" />
                            <span className="text-[10px] font-black uppercase tracking-wider">Active</span>
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TL_CategoriesTab;
