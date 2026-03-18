// components/NewSuperAdmin/Tabs/MenuManagement/CategoriesTab.tsx
import { useState, useEffect, useCallback } from "react";
import {
  Plus, Edit2, Trash2, RefreshCw, AlertCircle,
  X, Tag, ToggleLeft, ToggleRight, Check, ChevronDown,
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const CATEGORY_TYPES = ["food", "drink", "promo"] as const;
type CategoryType = typeof CATEGORY_TYPES[number];

const BASE_TYPE_OPTIONS: { value: CategoryType; label: string; desc: string }[] = [
  { value: "food",  label: "Food",  desc: "Meals, snacks, waffles, wings, combos" },
  { value: "drink", label: "Drink", desc: "Beverages with size selection" },
  { value: "promo", label: "Promo", desc: "Promos, freebies, loyalty cards" },
];

const POS_BEHAVIOR_BY_TYPE: Record<CategoryType, { value: string; label: string; desc: string }[]> = {
  food: [
    { value: "food",   label: "Food",   desc: "Standard food — straight to cart, no size" },
    { value: "wings",  label: "Wings",  desc: "Chicken wings — cashier picks piece count (3pc, 4pc, etc.)" },
    { value: "waffle", label: "Waffle", desc: "Waffle items — shows waffle-specific add-ons" },
    { value: "combo",  label: "Combo",  desc: "Food + drink — cashier picks food, then customizes the included drink" },
  ],
  drink: [
    { value: "drink",  label: "Drink",  desc: "Regular drink — cashier picks size (SM/SL, UM/UL, etc.)" },
    { value: "bundle", label: "Bundle", desc: "Drinks-only bundle — cashier customizes each drink step by step" },
  ],
  promo: [
    { value: "promo",  label: "Promo",  desc: "Promos, freebies, loyalty cards — no size or sugar" },
  ],
};

const TYPE_BADGE: Record<string, string> = {
  food:    "bg-amber-50 text-amber-700 border border-amber-200",
  drink:   "bg-blue-50 text-blue-700 border border-blue-200",
  promo:   "bg-emerald-50 text-emerald-700 border border-emerald-200",
  wings:   "bg-orange-50 text-orange-700 border border-orange-200",
  waffle:  "bg-yellow-50 text-yellow-700 border border-yellow-200",
  combo:   "bg-purple-50 text-purple-700 border border-purple-200",
  bundle:  "bg-indigo-50 text-indigo-700 border border-indigo-200",
};

interface Category {
  id:               number;
  name:             string;
  type:             CategoryType;
  category_type:    string;
  sort_order:       number;
  is_active:        boolean;
  menu_items_count: number;
}

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

const SkeletonBar: React.FC<{ h?: string }> = ({ h = "h-4" }) => (
  <div className={`w-full ${h} bg-zinc-100 rounded animate-pulse`} />
);

const inputCls = (err?: string) =>
  `w-full text-sm font-medium text-zinc-700 bg-zinc-50 border rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white transition-all ${err ? "border-red-300 bg-red-50" : "border-zinc-200"}`;

const CategoryModal: React.FC<{
  category?: Category;
  onClose: () => void;
  onSaved: (c: Category) => void;
}> = ({ category, onClose, onSaved }) => {
  const isEdit = !!category;

  const [name,        setName]        = useState(category?.name ?? "");
  const [baseType,    setBaseType]    = useState<CategoryType>(category?.type ?? "food");
  const [posBehavior, setPosBehavior] = useState<string>(category?.category_type ?? "food");
  const [sortOrder,   setSortOrder]   = useState(String(category?.sort_order ?? 0));
  const [isActive,    setIsActive]    = useState(category?.is_active ?? true);
  const [errors,      setErrors]      = useState<Record<string, string>>({});
  const [loading,     setLoading]     = useState(false);
  const [apiError,    setApiError]    = useState("");

  const handleBaseTypeChange = (t: CategoryType) => {
    setBaseType(t);
    setPosBehavior(POS_BEHAVIOR_BY_TYPE[t][0].value);
  };

  const behaviorOptions  = POS_BEHAVIOR_BY_TYPE[baseType];
  const selectedBehavior = behaviorOptions.find(o => o.value === posBehavior);

  const handleSubmit = async () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Category name is required.";
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true); setApiError("");
    try {
      const payload = {
        name,
        type:          baseType,
        category_type: posBehavior,
        sort_order:    Number(sortOrder),
        is_active:     isActive,
      };
      const url    = isEdit ? `/api/categories/${category!.id}` : "/api/categories";
      const method = isEdit ? "PUT" : "POST";
      const res    = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(payload) });
      const data   = await res.json();
      if (!res.ok) { setApiError(data.message ?? "Something went wrong."); return; }
      onSaved(data.data ?? data);
      onClose();
    } catch { setApiError("Network error."); }
    finally { setLoading(false); }
  };

  return createPortal(
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-6"
      style={{ backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", backgroundColor: "rgba(0,0,0,0.45)" }}>
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md border border-zinc-200 rounded-[1.25rem] shadow-2xl">

        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-violet-50 border border-violet-200 rounded-lg flex items-center justify-center">
              <Tag size={15} className="text-violet-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#1a0f2e]">{isEdit ? "Edit Category" : "Add Category"}</p>
              <p className="text-[10px] text-zinc-400">{isEdit ? `Updating ${category!.name}` : "Create a new menu category"}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-zinc-600 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          {apiError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle size={14} className="text-red-500 shrink-0" />
              <p className="text-xs text-red-600 font-medium">{apiError}</p>
            </div>
          )}

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5 block">
              Category Name <span className="text-red-400">*</span>
            </label>
            <input value={name} onChange={e => { setName(e.target.value); setErrors({}); }}
              placeholder="e.g. Milk Tea" className={inputCls(errors.name)} />
            {errors.name && <p className="text-[10px] text-red-500 mt-1 font-medium">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5 block">Type</label>
              <div className="relative">
                <select value={baseType} onChange={e => handleBaseTypeChange(e.target.value as CategoryType)}
                  className={inputCls() + " appearance-none pr-8"}>
                  {BASE_TYPE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              </div>
              <p className="text-[10px] text-zinc-400 mt-1 leading-tight">
                {BASE_TYPE_OPTIONS.find(o => o.value === baseType)?.desc}
              </p>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5 block">POS Behavior</label>
              <div className="relative">
                <select value={posBehavior} onChange={e => setPosBehavior(e.target.value)}
                  className={inputCls() + " appearance-none pr-8"}>
                  {behaviorOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              </div>
              {selectedBehavior && (
                <p className="text-[10px] text-zinc-400 mt-1 leading-tight">{selectedBehavior.desc}</p>
              )}
            </div>
          </div>

          {(posBehavior === "bundle" || posBehavior === "combo") && (
            <div className={`p-3 rounded-lg border text-xs font-medium ${
              posBehavior === "bundle"
                ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                : "bg-purple-50 border-purple-200 text-purple-700"
            }`}>
              {posBehavior === "bundle" ? (
                <>
                  <p className="font-bold mb-1">Bundle — Drinks Only</p>
                  <p className="opacity-80">Each drink gets its own sugar, options, and add-ons. Cashier steps through each drink one by one. e.g. GF Duo Bundles, FP Coffee Bundles.</p>
                </>
              ) : (
                <>
                  <p className="font-bold mb-1">Combo — Food + Drink</p>
                  <p className="opacity-80">Cashier selects the combo item, then picks and customizes the included drink. e.g. Combo Meals, Pizza Pedricos Combo.</p>
                </>
              )}
            </div>
          )}

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5 block">Sort Order</label>
            <input type="number" min="0" value={sortOrder} onChange={e => setSortOrder(e.target.value)}
              className={inputCls()} placeholder="0" />
          </div>

          <div className="flex items-center justify-between p-3 bg-zinc-50 border border-zinc-200 rounded-lg">
            <div>
              <p className="text-xs font-bold text-zinc-700">Show on POS</p>
              <p className="text-[10px] text-zinc-400">Toggle off to hide category from cashiers</p>
            </div>
            <button type="button" onClick={() => setIsActive(v => !v)}>
              {isActive ? <ToggleRight size={28} className="text-[#3b2063]" /> : <ToggleLeft size={28} className="text-zinc-300" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-zinc-100">
          <Btn variant="secondary" onClick={onClose} disabled={loading}>Cancel</Btn>
          <Btn onClick={handleSubmit} disabled={loading}>
            {loading
              ? <span className="flex items-center gap-1.5"><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</span>
              : isEdit ? "Save Changes" : <><Plus size={13} /> Add Category</>}
          </Btn>
        </div>
      </div>
    </div>,
    document.body
  );
};

const CategoriesTab: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [addOpen,    setAddOpen]    = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [delTarget,  setDelTarget]  = useState<Category | null>(null);
  const [delLoading, setDelLoading] = useState(false);
  const [inlineEdit, setInlineEdit] = useState<number | null>(null);
  const [inlineVal,  setInlineVal]  = useState("");

  const fetchAll = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res  = await fetch("/api/categories", { headers: authHeaders() });
      const data = await res.json();
      const raw  = Array.isArray(data) ? data : (data.data ?? []);
      setCategories(raw);
    } catch { setError("Failed to load categories."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const toggleActive = async (cat: Category) => {
    try {
      const res  = await fetch(`/api/categories/${cat.id}`, {
        method: "PUT", headers: authHeaders(),
        body: JSON.stringify({ is_active: !cat.is_active }),
      });
      const data = await res.json();
      if (res.ok) setCategories(p => p.map(c => c.id === cat.id ? { ...c, is_active: !c.is_active } : c));
      else console.error(data.message);
    } catch { /* silent */ }
  };

  const handleDelete = async (cat: Category) => {
    setDelLoading(true);
    try {
      const res  = await fetch(`/api/categories/${cat.id}`, { method: "DELETE", headers: authHeaders() });
      const data = await res.json();
      if (res.ok) { setCategories(p => p.filter(c => c.id !== cat.id)); setDelTarget(null); }
      else setError(data.message ?? "Failed to delete.");
    } catch { setError("Network error."); }
    finally { setDelLoading(false); }
  };

  const saveInline = async (cat: Category) => {
    if (!inlineVal.trim()) { setInlineEdit(null); return; }
    try {
      const res  = await fetch(`/api/categories/${cat.id}`, {
        method: "PUT", headers: authHeaders(),
        body: JSON.stringify({ name: inlineVal }),
      });
      const data = await res.json();
      if (res.ok) setCategories(p => p.map(c => c.id === cat.id ? { ...c, name: inlineVal } : c));
      else console.error(data.message);
    } catch { /* silent */ }
    finally { setInlineEdit(null); }
  };

  const totalItems = categories.reduce((sum, c) => sum + (c.menu_items_count ?? 0), 0);

  return (
    <div className="p-6 md:p-8 fade-in">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h2 className="text-base font-bold text-[#1a0f2e]">Categories</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            {loading ? "Loading..." : `${categories.length} categories · ${categories.filter(c => c.is_active).length} active · ${totalItems} total items`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Btn variant="secondary" onClick={fetchAll} disabled={loading}>
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
          </Btn>
          <Btn onClick={() => setAddOpen(true)} disabled={loading}>
            <Plus size={13} /> Add Category
          </Btn>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle size={14} className="text-red-500 shrink-0" />
          <p className="text-xs text-red-600 font-medium">{error}</p>
          <button onClick={() => setError("")} className="ml-auto text-red-300 hover:text-red-500"><X size={14} /></button>
        </div>
      )}

      <div className="bg-white border border-zinc-200 rounded-[0.625rem] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100">
                {["Name", "Type", "POS Behavior", "Items", "Sort", "Active", "Actions"].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-zinc-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-zinc-50">
                  {[...Array(7)].map((_, j) => (
                    <td key={j} className="px-5 py-4"><SkeletonBar h="h-3" /></td>
                  ))}
                </tr>
              ))}
              {!loading && categories.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-zinc-400 text-xs">No categories found.</td></tr>
              )}
              {!loading && categories.map(cat => (
                <tr key={cat.id} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                  <td className="px-5 py-3.5">
                    {inlineEdit === cat.id ? (
                      <div className="flex items-center gap-2">
                        <input autoFocus value={inlineVal} onChange={e => setInlineVal(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") saveInline(cat); if (e.key === "Escape") setInlineEdit(null); }}
                          className="text-sm font-medium text-zinc-700 bg-white border border-violet-300 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-violet-400 w-40" />
                        <button onClick={() => saveInline(cat)} className="p-1 bg-emerald-50 hover:bg-emerald-100 rounded text-emerald-600 transition-colors">
                          <Check size={12} />
                        </button>
                        <button onClick={() => setInlineEdit(null)} className="p-1 hover:bg-zinc-100 rounded text-zinc-400 transition-colors">
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <span className="font-semibold text-[#1a0f2e] cursor-pointer hover:text-violet-600 transition-colors"
                        onDoubleClick={() => { setInlineEdit(cat.id); setInlineVal(cat.name); }}
                        title="Double-click to edit inline">
                        {cat.name}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${TYPE_BADGE[cat.type] ?? "bg-zinc-100 text-zinc-600 border border-zinc-200"}`}>
                      {cat.type ?? "—"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${TYPE_BADGE[cat.category_type] ?? "bg-zinc-100 text-zinc-600 border border-zinc-200"}`}>
                      {cat.category_type ?? cat.type ?? "—"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    {(cat.menu_items_count ?? 0) > 0 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-200">
                        {cat.menu_items_count} items
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-zinc-300">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-zinc-500 text-xs font-medium">{cat.sort_order}</td>
                  <td className="px-5 py-3.5">
                    <button onClick={() => toggleActive(cat)} className="transition-colors">
                      {cat.is_active ? <ToggleRight size={22} className="text-[#3b2063]" /> : <ToggleLeft size={22} className="text-zinc-300" />}
                    </button>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setEditTarget(cat)}
                        className="p-1.5 hover:bg-violet-50 rounded-[0.4rem] text-zinc-400 hover:text-violet-600 transition-colors" title="Edit">
                        <Edit2 size={13} />
                      </button>
                      <button onClick={() => setDelTarget(cat)}
                        className="p-1.5 hover:bg-red-50 rounded-[0.4rem] text-zinc-400 hover:text-red-500 transition-colors" title="Delete">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && categories.length > 0 && (
          <div className="px-5 py-3 border-t border-zinc-50 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
            {categories.length} categories · double-click name to edit inline
          </div>
        )}
      </div>

      {delTarget && createPortal(
        <div className="fixed inset-0 z-9999 flex items-center justify-center p-6"
          style={{ backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", backgroundColor: "rgba(0,0,0,0.45)" }}>
          <div className="absolute inset-0" onClick={() => setDelTarget(null)} />
          <div className="relative bg-white w-full max-w-sm border border-zinc-200 rounded-[1.25rem] shadow-2xl">
            <div className="flex flex-col items-center text-center px-6 pt-8 pb-5">
              <div className="w-14 h-14 bg-red-50 border border-red-200 rounded-full flex items-center justify-center mb-4">
                <Trash2 size={22} className="text-red-500" />
              </div>
              <p className="text-base font-bold text-[#1a0f2e]">Delete Category?</p>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                Permanently delete <span className="font-bold text-zinc-700">{delTarget.name}</span>. Menu items under this category will lose their category.
              </p>
            </div>
            <div className="flex gap-2 px-6 pb-6">
              <Btn variant="secondary" className="flex-1 justify-center" onClick={() => setDelTarget(null)} disabled={delLoading}>Cancel</Btn>
              <Btn variant="danger"    className="flex-1 justify-center" onClick={() => handleDelete(delTarget)} disabled={delLoading}>
                {delLoading
                  ? <span className="flex items-center gap-1.5"><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Deleting...</span>
                  : <><Trash2 size={13} /> Delete</>}
              </Btn>
            </div>
          </div>
        </div>,
        document.body
      )}

      {addOpen    && <CategoryModal onClose={() => setAddOpen(false)} onSaved={c => { setCategories(p => [c, ...p]); setAddOpen(false); }} />}
      {editTarget && <CategoryModal category={editTarget} onClose={() => setEditTarget(null)}
        onSaved={c => { setCategories(p => p.map(x => x.id === c.id ? c : x)); setEditTarget(null); }} />}
    </div>
  );
};

export default CategoriesTab;