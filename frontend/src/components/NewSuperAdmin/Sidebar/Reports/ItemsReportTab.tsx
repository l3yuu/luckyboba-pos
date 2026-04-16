 
// components/NewSuperAdmin/Tabs/Reports/ItemsReportTab.tsx
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search, Download, RefreshCw, AlertCircle,
  ChevronDown, ChevronUp, X, Package,
  ArrowUpRight, ArrowDownRight,
} from "lucide-react";

type ColorKey   = "violet" | "emerald" | "red" | "amber";
type VariantKey = "primary" | "secondary" | "danger" | "ghost";
type SizeKey    = "sm" | "md" | "lg";
type SortDir    = "asc" | "desc";
type SortKey    = "product_name" | "category" | "total_quantity" | "total_revenue" | "avg_price";

// ── API ───────────────────────────────────────────────────────────────────────
const getToken = () =>
  localStorage.getItem("auth_token") || localStorage.getItem("lucky_boba_token") || "";
const authHeaders = () => ({
  "Content-Type": "application/json",
  "Accept":       "application/json",
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

// ── Types ─────────────────────────────────────────────────────────────────────
interface ItemRow {
  product_name:   string;
  size?:          string;
  cup_size_label?: string;
  category:       string;
  total_quantity: number;
  total_revenue:  number;
  avg_price:      number;
  times_ordered:  number;
}
interface BranchOption   { id: number; name: string; }
interface CategoryOption { id: number; name: string; }

interface ApiItemRow {
  product_name:   string;
  size?:          string;
  cup_size_label?: string;
  category:       string | null;
  total_quantity: string | number;
  total_revenue:  string | number;
  avg_unit_price: string | number | null;
  times_ordered:  string | number | null;
}

// ── Shared UI ─────────────────────────────────────────────────────────────────
interface StatCardProps {
  icon: React.ReactNode; label: string; value: string | number;
  sub?: string; trend?: number; color?: ColorKey;
}
interface BtnProps {
  children: React.ReactNode; variant?: VariantKey; size?: SizeKey;
  onClick?: () => void; className?: string; disabled?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, sub, trend, color = "violet" }) => {
  const colors: Record<ColorKey, { bg: string; border: string; icon: string }> = {
    violet:  { bg: "bg-violet-50",  border: "border-violet-200",  icon: "text-violet-600"  },
    emerald: { bg: "bg-emerald-50", border: "border-emerald-200", icon: "text-emerald-600" },
    red:     { bg: "bg-red-50",     border: "border-red-200",     icon: "text-red-500"     },
    amber:   { bg: "bg-amber-50",   border: "border-amber-200",   icon: "text-amber-600"   },
  };
  const c = colors[color];
  return (
    <div className="bg-white border border-zinc-200 rounded-[0.625rem] px-6 py-5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 ${c.bg} border ${c.border} flex items-center justify-center rounded-[0.4rem]`}>
          <span className={c.icon}>{icon}</span>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{label}</p>
          <p className="text-xl font-bold text-[#1a0f2e] tabular-nums">{value}</p>
          {sub && <p className="text-[10px] text-zinc-400 mt-0.5">{sub}</p>}
        </div>
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 text-xs font-bold ${trend >= 0 ? "text-emerald-600" : "text-red-500"}`}>
          {trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {Math.abs(trend)}%
        </div>
      )}
    </div>
  );
};

const Btn: React.FC<BtnProps> = ({
  children, variant = "primary", size = "sm",
  onClick, className = "", disabled = false,
}) => {
  const sizes:    Record<SizeKey,    string> = { sm: "px-3 py-2 text-xs", md: "px-4 py-2.5 text-sm", lg: "px-6 py-3 text-sm" };
  const variants: Record<VariantKey, string> = {
    primary:   "bg-[#3b2063] hover:bg-[#2a1647] text-white",
    secondary: "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50",
    danger:    "bg-red-600 hover:bg-red-700 text-white",
    ghost:     "bg-transparent text-zinc-500 hover:bg-zinc-100",
  };
  return (
    <button onClick={onClick} disabled={disabled}
      className={`inline-flex items-center gap-1.5 font-bold rounded-lg transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 ${sizes[size]} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};


const SortIcon: React.FC<{ col: SortKey; active: SortKey; dir: SortDir }> = ({ col, active, dir }) => {
  if (col !== active) return <ChevronDown size={11} className="text-zinc-300 ml-0.5" />;
  return dir === "asc"
    ? <ChevronUp size={11} className="text-[#3b2063] ml-0.5" />
    : <ChevronDown size={11} className="text-[#3b2063] ml-0.5" />;
};

// ── Main Component ─────────────────────────────────────────────────────────────
const ItemsReportTab: React.FC = () => {
  const today      = new Date().toISOString().split("T")[0];
  const firstMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString().split("T")[0];

  const [dateFrom,  setDateFrom]  = useState(firstMonth);
  const [dateTo,    setDateTo]    = useState(today);
  const [branchId, setBranchId] = useState(localStorage.getItem('superadmin_selected_branch') || '');
  const [categoryId, setCategoryId] = useState("");
  const [search,    setSearch]    = useState("");
  const [sortKey,   setSortKey]   = useState<SortKey>("total_quantity");
  const [sortDir,   setSortDir]   = useState<SortDir>("desc");

  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [items,      setItems]      = useState<ItemRow[]>([]);
  const [branches,   setBranches]   = useState<BranchOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);

  const fmt  = (v: number) => `₱${Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  const handleBranchChange = (id: string) => {
    setBranchId(id);
    localStorage.setItem('superadmin_selected_branch', id);
  };

  // Fetch branches + categories once
  useEffect(() => {
    Promise.all([
      fetch("/api/branches",   { headers: authHeaders() }).then(r => r.json()),
      fetch("/api/categories", { headers: authHeaders() }).then(r => r.json()),
    ]).then(([bData, cData]) => {
      if (bData.success) {
        setBranches(bData.data);
        if (!branchId && bData.data.length > 0) {
          const defaultId = String(bData.data[0].id);
          setBranchId(defaultId);
          localStorage.setItem('superadmin_selected_branch', defaultId);
        }
      }
      if (cData.success !== false) setCategories(Array.isArray(cData) ? cData : (cData.data ?? []));
    }).catch(() => {});
  }, [branchId]);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        date_from: dateFrom,
        date_to:   dateTo,
      });
      if (branchId)   params.set("branch_id",   branchId);
      if (categoryId) params.set("category_id", categoryId);

      const res  = await fetch(`/api/reports/items-all?${params}`, { headers: authHeaders() });
      const data = await res.json() as { top_products?: ApiItemRow[] };

      if (data.top_products) {
        setItems(data.top_products.map((p) => ({
          product_name:   p.product_name,
          size:           p.size,
          cup_size_label: p.cup_size_label,
          category:       p.category ?? "—",
          total_quantity: Number(p.total_quantity),
          total_revenue:  Number(p.total_revenue),
          avg_price:      Number(p.avg_unit_price ?? 0),
          times_ordered:  Number(p.times_ordered  ?? 0),
        })));
      } else {
        setItems([]);
      }
    } catch {
      setError("Failed to load items report.");
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, branchId, categoryId]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  // Client-side sort + search
  const filtered = useMemo(() => {
    let rows = items.filter(r =>
      r.product_name.toLowerCase().includes(search.toLowerCase()) ||
      r.category.toLowerCase().includes(search.toLowerCase())
    );
    rows = [...rows].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "string" && typeof bv === "string")
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === "asc" ? Number(av) - Number(bv) : Number(bv) - Number(av);
    });
    return rows;
  }, [items, search, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const totalQty     = filtered.reduce((s, r) => s + r.total_quantity, 0);
  const totalRevenue = filtered.reduce((s, r) => s + r.total_revenue,  0);
  const topItem      = filtered[0];

  const handleExport = () => {
      const params = new URLSearchParams({ date_from: dateFrom, date_to: dateTo });
      if (branchId)   params.set("branch_id",   branchId);
      if (categoryId) params.set("category_id", categoryId);
      
      const branchSlug = branchId
          ? (branches.find(b => String(b.id) === branchId)?.name ?? "BRANCH")
              .toUpperCase().replace(/[^A-Z0-9]+/g, "-")
          : "ALL-BRANCHES";

      fetch(`/api/reports/items-export?${params}`, { headers: authHeaders() })
          .then(res => res.blob())
          .then(blob => {
              const url  = URL.createObjectURL(blob);
              const a    = document.createElement('a');
              a.href     = url;
              a.download = `LuckyBoba_ItemsReport_${branchSlug}_${dateFrom}_to_${dateTo}.csv`; // ← updated
              a.click();
              URL.revokeObjectURL(url);
          })
          .catch(() => alert('Export failed.'));
  };

  const SortTh: React.FC<{ col: SortKey; label: string }> = ({ col, label }) => (
    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-zinc-400 cursor-pointer hover:text-zinc-600 select-none"
      onClick={() => toggleSort(col)}>
      <span className="inline-flex items-center gap-0.5">
        {label}
        <SortIcon col={col} active={sortKey} dir={sortDir} />
      </span>
    </th>
  );

  return (
    <div className="p-6 md:p-8 fade-in flex flex-col gap-5">



      {/* ── Filters ── */}
      <div className="bg-white border border-zinc-200 rounded-[0.625rem] px-5 py-4 flex flex-wrap gap-3 items-end">
        {/* Date From */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1.5">Date From</p>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="text-sm font-medium text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-violet-400" />
        </div>
        {/* Date To */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1.5">Date To</p>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="text-sm font-medium text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-violet-400" />
        </div>
        {/* Branch */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1.5">Branch</p>
          <div className="relative">
            <select value={branchId} onChange={e => handleBranchChange(e.target.value)}
              className="appearance-none text-sm font-medium text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-lg pl-3 pr-8 py-2 outline-none focus:ring-2 focus:ring-violet-400 cursor-pointer">
              <option value="">All Branches</option>
              {branches.map(b => <option key={b.id} value={String(b.id)}>{b.name}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          </div>
        </div>
        {/* Category */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1.5">Category</p>
          <div className="relative">
            <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
              className="appearance-none text-sm font-medium text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-lg pl-3 pr-8 py-2 outline-none focus:ring-2 focus:ring-violet-400 cursor-pointer">
              <option value="">All Categories</option>
              {categories.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          </div>
        </div>

        {/* ── Apply + Export + Clear grouped together ── */}
        <div className="flex items-center gap-2">
          <Btn onClick={fetchItems} disabled={loading}>
            {loading ? <><RefreshCw size={12} className="animate-spin" /> Loading...</> : "Apply Filters"}
          </Btn>
          <Btn variant="secondary" onClick={handleExport} disabled={loading}>
            <Download size={13} /> Export CSV
          </Btn>
          {(branchId || categoryId) && (
            <button
              onClick={() => { handleBranchChange(""); setCategoryId(""); }}
              className="inline-flex items-center gap-1 px-3 py-2 text-xs font-bold text-zinc-400 hover:text-red-500 hover:bg-red-50 border border-zinc-200 hover:border-red-200 rounded-lg transition-colors"
            >
              <X size={11} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle size={14} className="text-red-500 shrink-0" />
          <p className="text-xs text-red-600 font-medium">{error}</p>
          <Btn variant="secondary" size="sm" onClick={fetchItems} className="ml-auto">Retry</Btn>
        </div>
      )}

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={<Package size={16} />}
          label="Total Items" value={loading ? "—" : filtered.length.toLocaleString()} color="violet" />
        <StatCard icon={<span className="font-black text-sm">Qty</span>}
          label="Total Qty Sold" value={loading ? "—" : totalQty.toLocaleString()} color="emerald" />
        <StatCard icon={<span className="font-black text-base">₱</span>}
          label="Total Revenue" value={loading ? "—" : fmt(totalRevenue)}
          sub={topItem ? `Top: ${topItem.product_name}` : undefined} color="amber" />
      </div>

      {/* ── Table ── */}
      <div className="bg-white border border-zinc-200 rounded-[0.625rem] overflow-hidden">

        {/* Search bar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-100 flex-wrap">
          <div className="flex-1 min-w-48 flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2">
            <Search size={13} className="text-zinc-400 shrink-0" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm text-zinc-700 outline-none placeholder:text-zinc-400"
              placeholder="Search items or category..." />
            {search && (
              <button onClick={() => setSearch("")} className="text-zinc-300 hover:text-zinc-500">
                <X size={12} />
              </button>
            )}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 shrink-0">
            {filtered.length} items · click column header to sort
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-zinc-400 w-8">#</th>
                <SortTh col="product_name"   label="Item Name"    />
                <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-zinc-400">Size</th>
                <SortTh col="category"       label="Category"     />
                <SortTh col="total_quantity" label="Qty Sold"     />
                <SortTh col="total_revenue"  label="Revenue"      />
                <SortTh col="avg_price"      label="Avg Price"    />
                <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-zinc-400">Times Ordered</th>
                <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-zinc-400">Contribution</th>
              </tr>
            </thead>
            <tbody>
              {/* Skeleton */}
              {loading && [...Array(8)].map((_, i) => (
                <tr key={i} className="border-b border-zinc-50">
                  {[...Array(8)].map((_, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-3 bg-zinc-100 rounded animate-pulse" style={{ width: `${50 + Math.random() * 40}%` }} />
                    </td>
                  ))}
                </tr>
              ))}

              {/* Empty */}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-zinc-400 text-xs font-medium">
                    {search ? "No items match your search." : "No items data for this period."}
                  </td>
                </tr>
              )}

              {/* Rows */}
              {!loading && filtered.map((item, i) => {
                const revShare = totalRevenue > 0
                  ? Math.round((item.total_revenue / totalRevenue) * 100) : 0;
                const maxQty   = filtered[0]?.total_quantity ?? 1;
                const qtyPct   = Math.round((item.total_quantity / maxQty) * 100);

                return (
                  <tr key={i} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                    <td className="px-5 py-3.5 text-zinc-300 text-xs font-bold">{i + 1}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-md bg-violet-50 border border-violet-200 flex items-center justify-center shrink-0">
                          <Package size={9} className="text-violet-600" />
                        </div>
                        <span className="font-semibold text-[#1a0f2e] text-xs">{item.product_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-zinc-600 text-xs font-bold">
                        {item.cup_size_label || item.size || "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      {item.category !== "—" ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-600 border border-zinc-200">
                          {item.category}
                        </span>
                      ) : (
                        <span className="text-zinc-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-[#3b2063]" style={{ width: `${qtyPct}%` }} />
                        </div>
                        <span className="text-zinc-700 font-medium text-xs">{item.total_quantity.toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-[#3b2063] text-xs">{fmt(item.total_revenue)}</td>
                    <td className="px-5 py-3.5 text-zinc-600 text-xs">{item.avg_price > 0 ? fmt(item.avg_price) : "—"}</td>
                    <td className="px-5 py-3.5 text-zinc-600 text-xs">{item.times_ordered > 0 ? item.times_ordered.toLocaleString() : "—"}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-emerald-400" style={{ width: `${revShare}%` }} />
                        </div>
                        <span className="text-xs font-bold text-zinc-500">{revShare}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* Totals footer */}
              {!loading && filtered.length > 0 && (
                <tr className="bg-zinc-50 border-t border-zinc-200">
                  <td className="px-5 py-3.5" />
                  <td className="px-5 py-3.5 font-black text-[#1a0f2e] text-xs uppercase tracking-widest" colSpan={3}>
                    Total ({filtered.length} items)
                  </td>
                  <td className="px-5 py-3.5 font-black text-[#1a0f2e] text-xs">{totalQty.toLocaleString()}</td>
                  <td className="px-5 py-3.5 font-black text-[#3b2063] text-xs">{fmt(totalRevenue)}</td>
                  <td className="px-5 py-3.5" />
                  <td className="px-5 py-3.5" />
                  <td className="px-5 py-3.5 font-black text-zinc-600 text-xs">100%</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {!loading && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-zinc-50 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
            {dateFrom} → {dateTo} · {filtered.length} items · sorted by {sortKey.replace("_", " ")} {sortDir}
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemsReportTab;