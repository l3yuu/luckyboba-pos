// components/BranchManager/MenuItems/BM_MenuList.tsx
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search, RefreshCw,
  AlertCircle, X, Package, ChevronDown,
  ToggleLeft, ToggleRight, Coffee,
} from "lucide-react";
import { createPortal } from "react-dom";

type VariantKey = "primary" | "secondary" | "danger" | "ghost";
type SizeKey    = "sm" | "md" | "lg";

const getToken = () =>
  localStorage.getItem("auth_token") || localStorage.getItem("lucky_boba_token") || "";
const authHeaders = (): Record<string, string> => ({
  "Content-Type": "application/json",
  "Accept":       "application/json",
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});



interface ItemOptions {
  pearl: boolean;
  ice:   boolean;
}

interface MenuItem {
  id:             number;
  name:           string;
  category_id:    number | null;
  category:       string;
  category_type:  string;
  subcategory_id: number | null;
  subcategory:    string;
  price:          number;
  grab_price:     number;
  panda_price:    number;
  barcode:        string | null;
  size:           string | null;
  image_path:     string | null;
  is_available:   boolean;
}
interface Category {
  id:            number;
  name:          string;
  category_type: string; // ✅ added
}


interface CategoryDrink {
  id:           number;
  category_id:  number;
  menu_item_id: number;
  name:         string;
  size:         string;
  price:        number;
}

interface SugarLevel {
  id:         number;
  label:      string;
  value:      string;
  sort_order: number;
  is_active:  boolean;
}

// ── Shared UI ─────────────────────────────────────────────────────────────────

interface BtnProps {
  children: React.ReactNode; variant?: VariantKey; size?: SizeKey;
  onClick?: () => void; className?: string; disabled?: boolean; type?: "button" | "submit" | "reset";
}
const Btn: React.FC<BtnProps> = ({ children, variant = "primary", size = "sm", onClick, className = "", disabled = false, type = "button" }) => {
  const sizes:    Record<SizeKey,    string> = { sm: "px-3 py-2 text-xs", md: "px-4 py-2.5 text-sm", lg: "px-6 py-3 text-sm" };
  const variants: Record<VariantKey, string> = {
    primary:   "bg-[#3b2063] hover:bg-[#2a1647] text-white",
    secondary: "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50",
    danger:    "bg-red-600 hover:bg-red-700 text-white",
    ghost:     "bg-transparent text-zinc-500 hover:bg-zinc-100",
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

const OptionsBadge: React.FC<{ opts: ItemOptions }> = ({ opts }) => {
  if (!opts.pearl && !opts.ice) return <span className="text-zinc-300 text-xs">—</span>;
  return (
    <div className="flex items-center gap-1">
      {opts.pearl && (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
          🧋 Pearl
        </span>
      )}
      {opts.ice && (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-sky-50 text-sky-600 border border-sky-200">
          🧊 Ice
        </span>
      )}
    </div>
  );
};




const ModalShell: React.FC<{
  onClose: () => void; icon: React.ReactNode; title: string; sub: string;
  children: React.ReactNode; footer: React.ReactNode; maxWidth?: string;
}> = ({ onClose, icon, title, sub, children, footer, maxWidth = "max-w-lg" }) =>
  createPortal(
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-4"
      style={{ backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", backgroundColor: "rgba(0,0,0,0.45)" }}>
      <div className="absolute inset-0" onClick={onClose} />
      <div className={`relative bg-white w-full ${maxWidth} border border-zinc-200 rounded-[1.25rem] shadow-2xl flex flex-col max-h-[90vh]`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-violet-50 border border-violet-200 rounded-lg flex items-center justify-center">{icon}</div>
            <div>
              <p className="text-sm font-bold text-[#1a0f2e]">{title}</p>
              <p className="text-[10px] text-zinc-400">{sub}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-100 rounded-lg transition-colors text-zinc-400 hover:text-zinc-600"><X size={16} /></button>
        </div>
        <div className="px-6 py-5 flex flex-col gap-4 overflow-y-auto flex-1">{children}</div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-zinc-100 shrink-0">{footer}</div>
      </div>
    </div>,
    document.body
  );






// ── Category Drinks Manager ───────────────────────────────────────────────────

interface CategoryDrinksManagerProps {
  categoryId:   number;
  categoryName: string;
  allItems:     MenuItem[];
  onClose:      () => void;
}

const CategoryDrinksManager: React.FC<CategoryDrinksManagerProps> = ({
  categoryId, categoryName, allItems, onClose,
}) => {
  const drinkPool = useMemo(() =>
    allItems
      .filter(i => i.category_type === "drink")
      .sort((a, b) => a.name.localeCompare(b.name) || (a.price - b.price)),
    [allItems]
  );

  const allDrinks = useMemo(() => {
    const nameCounts = drinkPool.reduce<Record<string, number>>((acc, d) => {
      acc[d.name] = (acc[d.name] ?? 0) + 1; return acc;
    }, {});
    const nameIndex: Record<string, number> = {};
    return drinkPool.map(drink => {
      const hasPair = nameCounts[drink.name] > 1;
      let sizeLabel = drink.size && drink.size !== 'none' ? drink.size.toUpperCase() : '';
      if (!sizeLabel && hasPair) {
        nameIndex[drink.name] = (nameIndex[drink.name] ?? 0) + 1;
        sizeLabel = nameIndex[drink.name] === 1 ? 'M' : 'L';
      }
      return { ...drink, _sizeLabel: sizeLabel };
    });
  }, [drinkPool]);

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [error,       setError]       = useState("");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/category-drinks?category_id=${categoryId}`, { headers: authHeaders() })
      .then(r => r.json())
      .then(data => {
        const rows: CategoryDrink[] = data.data ?? [];
        setSelectedIds(new Set(rows.map(r => r.menu_item_id)));
      })
      .catch(() => setError("Failed to load drink pool."))
      .finally(() => setLoading(false));
  }, [categoryId]);

  const toggle = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/category-drinks", {
        method:  "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          category_id: categoryId,
          drinks: allDrinks
            .filter(d => selectedIds.has(d.id))
            .map(d => ({ menu_item_id: d.id, size: d._sizeLabel || "M" })),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) { setError("Failed to save."); return; }
      setSaved(true);
    } catch { setError("Network error."); }
    finally { setSaving(false); }
  };

  return (
    <ModalShell
      onClose={onClose}
      icon={<Coffee size={15} className="text-rose-600" />}
      title="Manage Drink Pool"
      sub={`Shared drinks for "${categoryName}"`}
      footer={
        <>
          <Btn variant="secondary" onClick={onClose} disabled={saving}>Close</Btn>
          <Btn onClick={handleSave} disabled={saving || loading}>
            {saving
              ? <span className="flex items-center gap-1.5"><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</span>
              : saved ? "✓ Saved!" : "Save Drink Pool"
            }
          </Btn>
        </>
      }
    >
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle size={14} className="text-red-500 shrink-0" />
          <p className="text-xs text-red-600 font-medium">{error}</p>
        </div>
      )}

      <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg">
        <p className="text-xs font-bold text-rose-700 mb-0.5">Shared Drink Pool</p>
        <p className="text-[10px] text-rose-600 leading-relaxed">
          All Mix & Match items in <span className="font-bold">{categoryName}</span> will offer these drinks. Changes apply to every item in this category automatically.
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Available Drinks</label>
          <span className="text-[9px] font-bold text-rose-500 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
            {selectedIds.size} selected
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-1.5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-10 bg-zinc-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-1.5 max-h-72 overflow-y-auto pr-1">
            {allDrinks.map(d => {
              const isSelected = selectedIds.has(d.id);
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => toggle(d.id)}
                  className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-left transition-all ${
                    isSelected
                      ? 'bg-rose-100 border-rose-400 text-rose-800'
                      : 'bg-white border-zinc-200 text-zinc-500 hover:border-rose-300'
                  }`}
                >
                  <div className={`w-3 h-3 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                    isSelected ? 'bg-rose-500 border-rose-500' : 'border-zinc-300'
                  }`}>
                    {isSelected && (
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-semibold truncate">{d.name}</span>
                    {d._sizeLabel && (
                      <span className={`text-[9px] font-bold uppercase ${isSelected ? 'text-rose-500' : 'text-zinc-400'}`}>
                        {d._sizeLabel}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </ModalShell>
  );
};










const BM_MenuList: React.FC = () => {
  const [items,         setItems]         = useState<MenuItem[]>([]);
  const [categories,    setCategories]    = useState<Category[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState("");
  const [search,          setSearch]          = useState("");
  const [filterCat,       setFilterCat]       = useState("");
  const [filterAvail,     setFilterAvail]     = useState("");
  const [filterType,      setFilterType]      = useState("");
  const [itemOptions,     setItemOptions]     = useState<Record<number, ItemOptions>>({});
  const [drinkPoolTarget, setDrinkPoolTarget] = useState<Category | null>(null);
  const [sugarLevels,     setSugarLevels]     = useState<SugarLevel[]>([]);

  // Fetch all item options in bulk when items load
  const fetchAllOptions = useCallback(async (loadedItems: MenuItem[]) => {
    const drinkIds = loadedItems
      .filter(i => ["drink", "combo", "bundle"].includes(i.category_type))
      .map(i => i.id);
    if (drinkIds.length === 0) return;

    try {
      const params = drinkIds.map(id => `ids[]=${id}`).join("&");
      const res    = await fetch(`/api/menu-item-options/bulk?${params}`, { headers: authHeaders() });
      const data   = await res.json();
      const rows: { menu_item_id: number; option_type: string }[] = data.data ?? [];

      const map: Record<number, ItemOptions> = {};
      drinkIds.forEach(id => { map[id] = { pearl: false, ice: false }; });
      rows.forEach(r => {
        if (!map[r.menu_item_id]) map[r.menu_item_id] = { pearl: false, ice: false };
        if (r.option_type === "pearl") map[r.menu_item_id].pearl = true;
        if (r.option_type === "ice")   map[r.menu_item_id].ice   = true;
      });
      setItemOptions(map);
    } catch { /* silent */ }
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [itemsRes, catsRes, sugarRes] = await Promise.all([
        fetch("/api/menu-items",   { headers: authHeaders() }),
        fetch("/api/categories",   { headers: authHeaders() }),
        fetch("/api/sugar-levels", { headers: authHeaders() }),
      ]);
      const [itemsData, catsData, sugarData] = await Promise.all([
        itemsRes.json(), catsRes.json(), sugarRes.json(),
      ]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapItem = (i: any): MenuItem => ({
        id:             i.id,
        name:           i.name,
        category_id:    i.category_id    ?? null,
        category:       i.category?.name ?? i.category  ?? "—",
        category_type:  i.category_type  ?? "food",
        subcategory_id: i.subcategory_id ?? null,
        subcategory:    i.subcategory?.name ?? i.subcategory ?? "—",
        price:          Number(i.price      ?? 0),
        grab_price:     Number(i.grab_price  ?? 0),
        panda_price:    Number(i.panda_price ?? 0),
        barcode:        i.barcode    ?? null,
        size:           i.size       ?? null,
        image_path:     i.image_path ?? null,
        is_available:   Boolean(i.is_available ?? true),
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapCat = (c: any): Category => ({
        id:            c.id,
        name:          c.name,
        category_type: c.category_type ?? c.type ?? "food",
      });

      const mapped = (Array.isArray(itemsData) ? itemsData : (itemsData.data ?? [])).map(mapItem);
      setItems(mapped);
      fetchAllOptions(mapped);

      setCategories((Array.isArray(catsData) ? catsData : (catsData.data ?? [])).map(mapCat));

      setSugarLevels(
        (Array.isArray(sugarData) ? sugarData : (sugarData.data ?? []))
          .filter((s: SugarLevel) => s.is_active)
      );

    } catch { setError("Failed to load menu items."); }
    finally { setLoading(false); }
  }, [fetchAllOptions]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
  const handler = (e: Event) => {
    const cat = (e as CustomEvent<Category>).detail;
    setDrinkPoolTarget(cat);
  };
  window.addEventListener('open-drink-pool', handler);
  return () => window.removeEventListener('open-drink-pool', handler);
}, []);

  const toggleAvailable = useCallback(async (item: MenuItem) => {
    try {
      const res  = await fetch(`/api/menu-items/${item.id}`, {
        method: "PUT", headers: authHeaders(),
        body: JSON.stringify({ is_available: !item.is_available }),
      });
      const data = await res.json();
      if (res.ok && data.success)
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_available: !i.is_available } : i));
    } catch { /* silent */ }
  }, []);



  const filtered = useMemo(() => items.filter(i => {
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase()) ||
                        (i.barcode ?? "").toLowerCase().includes(search.toLowerCase());
    const matchCat   = !filterCat   || String(i.category_id) === filterCat;
    const matchAvail = !filterAvail || String(i.is_available) === filterAvail;
    const matchType  = !filterType  || i.category_type === filterType;
    return matchSearch && matchCat && matchAvail && matchType;
  }), [items, search, filterCat, filterAvail, filterType]);

  const fmt = useCallback(
    (v: number) => `₱${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
    []
  );

  const catTypeBadge = useMemo<Record<string, string>>(() => ({
    food:          "bg-amber-50 text-amber-700 border-amber-200",
    drink:         "bg-blue-50 text-blue-700 border-blue-200",
    promo:         "bg-emerald-50 text-emerald-700 border-emerald-200",
    wings:         "bg-orange-50 text-orange-700 border-orange-200",
    waffle:        "bg-yellow-50 text-yellow-700 border-yellow-200",
    combo:         "bg-purple-50 text-purple-700 border-purple-200",
    bundle:        "bg-indigo-50 text-indigo-700 border-indigo-200",
    mix_and_match: "bg-rose-50 text-rose-700 border-rose-200",
  }), []);

  return (
    <div className="p-6 md:p-8 fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center gap-6 mb-8">
        <div className="flex-1 flex items-center gap-3">
          <div className="relative group flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-[#3b2063]" size={15} />
            <input
              type="text"
              placeholder="Search items or barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#ede8ff] focus:border-[#3b2063] transition-all shadow-sm"
            />
          </div>
          <div className="relative shrink-0">
            <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
              className="appearance-none text-xs font-bold text-zinc-600 bg-white border border-zinc-200 rounded-xl pl-4 pr-10 py-3 outline-none focus:ring-2 focus:ring-[#ede8ff] focus:border-[#3b2063] cursor-pointer shadow-sm transition-all hover:bg-zinc-50">
              <option value="">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          </div>
          <div className="relative shrink-0">
            <select value={filterType} onChange={e => setFilterType(e.target.value)}
              className="appearance-none text-xs font-bold text-zinc-600 bg-white border border-zinc-200 rounded-xl pl-4 pr-10 py-3 outline-none focus:ring-2 focus:ring-[#ede8ff] focus:border-[#3b2063] cursor-pointer shadow-sm transition-all hover:bg-zinc-50">
              <option value="">All Types</option>
              <option value="food">Food</option>
              <option value="drink">Drink</option>
              <option value="wings">Wings</option>
              <option value="waffle">Waffle</option>
              <option value="combo">Combo</option>
              <option value="bundle">Bundle</option>
              <option value="mix_and_match">Mix & Match</option>
              <option value="promo">Promo</option>
            </select>
            <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Total Items",  value: items.length,                              color: "bg-violet-50 border-violet-200 text-violet-600"   },
          { label: "Available",    value: items.filter(i => i.is_available).length,  color: "bg-emerald-50 border-emerald-200 text-emerald-600" },
          { label: "Unavailable",  value: items.filter(i => !i.is_available).length, color: "bg-red-50 border-red-200 text-red-500"            },
          { label: "Categories",   value: categories.length,                         color: "bg-amber-50 border-amber-200 text-amber-600"      },
        ].map((s, i) => (
          <div key={i} className={`border rounded-[0.625rem] px-4 py-3 ${s.color.split(" ").slice(0, 2).join(" ")}`}>
            <p className={`text-xl font-black tabular-nums ${s.color.split(" ")[2]}`}>{loading ? "—" : s.value}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle size={14} className="text-red-500 shrink-0" />
          <p className="text-xs text-red-600 font-medium">{error}</p>
          <Btn variant="secondary" size="sm" onClick={fetchAll} className="ml-auto">Retry</Btn>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-zinc-200 rounded-[0.625rem] overflow-hidden">
        {/* Filters */}


        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100">
                {["Item", "Category", "Type", "Sub-Category", "Price", "Barcode", "Options", "Sugar Levels", "Available"].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-zinc-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && [...Array(6)].map((_, i) => (
                <tr key={i} className="border-b border-zinc-50">
                  {[...Array(10)].map((_, j) => (
                    <td key={j} className="px-5 py-4"><SkeletonBar h="h-3" /></td>
                  ))}
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={10} className="px-5 py-12 text-center text-zinc-400 text-xs font-medium">
                  {search || filterCat || filterAvail || filterType ? "No items match your filters." : "No menu items found."}
                </td></tr>
              )}
              {!loading && filtered.map(item => (
                <tr key={item.id} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0">
                        <Package size={12} className="text-violet-400" />
                      </div>
                      <span className="font-semibold text-[#1a0f2e] text-xs">{item.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-violet-50 text-violet-700 border border-violet-200">
                      {item.category}
                    </span>
                  </td>
                  {/* ✅ category_type badge */}
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${catTypeBadge[item.category_type] ?? "bg-zinc-100 text-zinc-600 border-zinc-200"}`}>
                      {item.category_type ?? "—"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    {item.subcategory !== "—" ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-600 border border-zinc-200">
                        {item.subcategory}
                      </span>
                    ) : <span className="text-zinc-300 text-xs">—</span>}
                  </td>
                    <td className="px-5 py-3.5 font-bold text-[#3b2063] text-xs">{fmt(item.price)}</td>
                    <td className="px-5 py-3.5 text-zinc-400 text-xs font-mono">{item.barcode ?? "—"}</td>

                    {/* ✅ Options column */}
                    <td className="px-5 py-3.5">
                      {["drink"].includes(item.category_type)
                        ? <OptionsBadge opts={itemOptions[item.id] ?? { pearl: false, ice: false }} />
                        : <span className="text-zinc-300 text-xs">—</span>
                      }
                    </td>

                    {/* Sugar Levels column */}
                    <td className="px-5 py-3.5">
                      {["drink"].includes(item.category_type) ? (
                        sugarLevels.length === 0
                          ? <span className="text-zinc-300 text-xs">—</span>
                          : (
                            <div className="flex flex-wrap gap-1 max-w-40">
                              {sugarLevels.slice(0, 3).map(lvl => (
                                <span
                                  key={lvl.id}
                                  className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-violet-50 text-violet-700 border border-violet-200"
                                >
                                  {lvl.value}
                                </span>
                              ))}
                              {sugarLevels.length > 3 && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-zinc-100 text-zinc-500 border border-zinc-200">
                                  +{sugarLevels.length - 3}
                                </span>
                              )}
                            </div>
                          )
                      ) : (
                        <span className="text-zinc-300 text-xs">—</span>
                      )}
                    </td>

                    <td className="px-5 py-3.5">
                      <button onClick={() => toggleAvailable(item)} className="transition-colors"
                      title={item.is_available ? "Click to hide" : "Click to show"}>
                      {item.is_available
                        ? <ToggleRight size={22} className="text-[#3b2063]" />
                        : <ToggleLeft  size={22} className="text-zinc-300"  />}
                    </button>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-zinc-50 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
            Showing {filtered.length} of {items.length} items
          </div>
        )}
      </div>

      {drinkPoolTarget && (
        <CategoryDrinksManager
          categoryId={drinkPoolTarget.id}
          categoryName={drinkPoolTarget.name}
          allItems={items}
          onClose={() => setDrinkPoolTarget(null)}
        />
      )}
    </div>
  );
};

export default BM_MenuList;