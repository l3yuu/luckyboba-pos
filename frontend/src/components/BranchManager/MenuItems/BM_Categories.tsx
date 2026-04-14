// BM_Categories.tsx — Read-only SuperAdmin-style category list for BM
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  RefreshCw, AlertCircle, Search, LayoutGrid,
  Tag, Activity, ToggleLeft, ToggleRight,
} from "lucide-react";

// ── Auth ─────────────────────────────────────────────────────────────────────
const getToken = () =>
  localStorage.getItem("auth_token") || localStorage.getItem("lucky_boba_token") || "";
const authHeaders = (): Record<string, string> => ({
  "Content-Type": "application/json",
  "Accept":       "application/json",
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

// ── Types ─────────────────────────────────────────────────────────────────────
interface Category {
  id:               number;
  name:             string;
  type?:            string;
  category_type?:   string;
  is_active:        boolean;
  menu_items_count: number;
}

// ── Badge helpers ─────────────────────────────────────────────────────────────
const TYPE_BADGE: Record<string, string> = {
  food:          "bg-amber-50 text-amber-700 border border-amber-200",
  drink:         "bg-blue-50 text-blue-700 border border-blue-200",
  promo:         "bg-emerald-50 text-emerald-700 border border-emerald-200",
  wings:         "bg-orange-50 text-orange-700 border border-orange-200",
  waffle:        "bg-yellow-50 text-yellow-700 border border-yellow-200",
  combo:         "bg-purple-50 text-purple-700 border border-purple-200",
  bundle:        "bg-indigo-50 text-indigo-700 border border-indigo-200",
  mix_and_match: "bg-rose-50 text-rose-700 border border-rose-200",
};
const typeBadge = (t: string) =>
  TYPE_BADGE[t?.toLowerCase()] ?? "bg-zinc-50 text-zinc-500 border border-zinc-200";

// ── Stat card ─────────────────────────────────────────────────────────────────
const StatCard: React.FC<{
  icon: React.ReactNode; label: string; value: string | number;
  color?: "violet" | "emerald" | "amber" | "red";
}> = ({ icon, label, value, color = "violet" }) => {
  const colors = {
    violet:  { bg: "bg-violet-50",  border: "border-violet-200",  icon: "text-violet-600"  },
    emerald: { bg: "bg-emerald-50", border: "border-emerald-200", icon: "text-emerald-600" },
    amber:   { bg: "bg-amber-50",   border: "border-amber-200",   icon: "text-amber-600"   },
    red:     { bg: "bg-red-50",     border: "border-red-200",     icon: "text-red-500"     },
  };
  const c = colors[color];
  return (
    <div className="bg-white border border-zinc-200 rounded-[0.625rem] px-6 py-5 flex items-center gap-3">
      <div className={`w-10 h-10 ${c.bg} border ${c.border} flex items-center justify-center rounded-[0.4rem] shrink-0`}>
        <span className={c.icon}>{icon}</span>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{label}</p>
        <p className="text-xl font-bold text-[#1a0f2e] tabular-nums">{value}</p>
      </div>
    </div>
  );
};

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

// ── Main Component ────────────────────────────────────────────────────────────
const BM_Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [search,     setSearch]     = useState("");
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res  = await fetch("/api/categories", { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error("Failed to load.");
      const arr: Category[] = Array.isArray(data) ? data : (data.data ?? data.categories ?? []);
      setCategories(arr);
    } catch { setError("Failed to load categories."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  // Toggle active status — BM can do this (show/hide from cashier)
  const handleToggle = async (cat: Category) => {
    setTogglingId(cat.id);
    try {
      const res = await fetch(`/api/categories/${cat.id}`, {
        method:  "PUT",
        headers: authHeaders(),
        body:    JSON.stringify({ is_active: !cat.is_active }),
      });
      if (res.ok) {
        setCategories(prev =>
          prev.map(c => c.id === cat.id ? { ...c, is_active: !c.is_active } : c)
        );
      }
    } catch { /* silent */ }
    finally { setTogglingId(null); }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return q
      ? categories.filter(c =>
          c.name.toLowerCase().includes(q) ||
          (c.category_type ?? c.type ?? "").toLowerCase().includes(q)
        )
      : categories;
  }, [search, categories]);

  const totalItems = categories.reduce((a, c) => a + (c.menu_items_count ?? 0), 0);
  const activeCount = categories.filter(c => c.is_active).length;

  return (
    <div className="p-6 md:p-8 fade-in">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-bold text-[#1a0f2e]">Categories</h2>
          <p className="text-xs text-zinc-400 mt-0.5">Menu category overview for this branch</p>
        </div>
        <Btn onClick={fetchCategories} disabled={loading}>
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
        </Btn>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle size={14} className="text-red-500 shrink-0" />
          <p className="text-xs text-red-600 font-medium">{error}</p>
          <Btn onClick={fetchCategories} className="ml-auto">Retry</Btn>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<LayoutGrid size={16} />} label="Total Categories" value={loading ? "—" : categories.length} color="violet" />
        <StatCard icon={<Activity   size={16} />} label="Active"           value={loading ? "—" : activeCount}         color="emerald" />
        <StatCard icon={<Tag        size={16} />} label="Inactive"         value={loading ? "—" : categories.length - activeCount} color="red" />
        <StatCard icon={<Tag        size={16} />} label="Total Items"      value={loading ? "—" : totalItems}           color="amber" />
      </div>

      {/* Table card */}
      <div className="bg-white border border-zinc-200 rounded-[0.625rem] overflow-hidden">

        {/* Search bar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-100">
          <div className="flex-1 min-w-0 flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2">
            <Search size={13} className="text-zinc-400 shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm text-zinc-700 outline-none placeholder:text-zinc-400"
              placeholder="Search by name or type…"
            />
          </div>
          {search && (
            <span className="text-[10px] font-bold text-zinc-400">
              {filtered.length} of {categories.length}
            </span>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100">
                {["#", "Category Name", "POS Behavior", "Items", "Status", "Active"].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-zinc-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Skeleton */}
              {loading && [...Array(6)].map((_, i) => (
                <tr key={i} className="border-b border-zinc-50">
                  {[...Array(6)].map((_, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-3 bg-zinc-100 rounded animate-pulse" style={{ width: `${50 + (j * 10) % 40}%` }} />
                    </td>
                  ))}
                </tr>
              ))}

              {/* Empty */}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-zinc-400 text-xs font-medium">
                    {search ? "No categories match your search." : "No categories found."}
                  </td>
                </tr>
              )}

              {/* Rows */}
              {!loading && filtered.map((cat, idx) => {
                const cType = cat.category_type ?? cat.type ?? "";
                const isToggling = togglingId === cat.id;
                return (
                  <tr key={cat.id} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                    {/* # */}
                    <td className="px-5 py-3.5 text-zinc-300 text-xs font-bold">
                      #{String(idx + 1).padStart(2, "0")}
                    </td>
                    {/* Name */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-violet-50 border border-violet-200 flex items-center justify-center shrink-0">
                          <Tag size={12} className="text-violet-500" />
                        </div>
                        <span className="font-semibold text-[#1a0f2e] text-sm">{cat.name}</span>
                      </div>
                    </td>
                    {/* POS Behavior */}
                    <td className="px-5 py-3.5">
                      {cType ? (
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${typeBadge(cType)}`}>
                          {cType.replace(/_/g, " ")}
                        </span>
                      ) : <span className="text-zinc-300 text-xs">—</span>}
                    </td>
                    {/* Items */}
                    <td className="px-5 py-3.5">
                      <span className="bg-zinc-100 text-zinc-600 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-zinc-200">
                        {cat.menu_items_count ?? 0}
                      </span>
                    </td>
                    {/* Status badge */}
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        cat.is_active
                          ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                          : "text-zinc-500 bg-zinc-100 border-zinc-200"
                      }`}>
                        {cat.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    {/* Toggle */}
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => handleToggle(cat)}
                        disabled={isToggling}
                        title={cat.is_active ? "Hide from cashier" : "Show to cashier"}
                        className="transition-colors disabled:opacity-40"
                      >
                        {isToggling
                          ? <RefreshCw size={20} className="animate-spin text-zinc-400" />
                          : cat.is_active
                            ? <ToggleRight size={26} className="text-[#3b2063]" />
                            : <ToggleLeft  size={26} className="text-zinc-300" />}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {!loading && (
          <div className="px-5 py-2.5 border-t border-zinc-50">
            <p className="text-[10px] text-zinc-300 font-medium">
              {categories.length} total categor{categories.length === 1 ? "y" : "ies"}
              {search ? ` · ${filtered.length} shown` : ""}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BM_Categories;