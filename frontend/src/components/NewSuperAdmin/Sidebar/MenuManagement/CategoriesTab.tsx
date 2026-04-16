// components/NewSuperAdmin/Tabs/MenuManagement/CategoriesTab.tsx
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Plus, Edit2, Trash2, AlertCircle,
  X, Tag, ToggleLeft, ToggleRight, Check, ChevronDown,
  Coffee, Search, Sparkles,
} from "lucide-react";
import { createPortal } from "react-dom";

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

const BASE_TYPE_OPTIONS: { value: CategoryType; label: string; desc: string }[] = [
  { value: "food", label: "Food", desc: "Meals, snacks, waffles, wings, combos" },
  { value: "drink", label: "Drink", desc: "Beverages with size selection" },
  { value: "promo", label: "Promo", desc: "Promos, freebies, loyalty cards" },
];

const POS_BEHAVIOR_BY_TYPE: Record<CategoryType, { value: string; label: string; desc: string }[]> = {
  food: [
    { value: "food", label: "Food", desc: "Standard food — straight to cart, no size" },
    { value: "wings", label: "Wings", desc: "Chicken wings — cashier picks piece count (3pc, 4pc, etc.)" },
    { value: "waffle", label: "Waffle", desc: "Waffle items — shows waffle-specific add-ons" },
    { value: "combo", label: "Combo", desc: "Food + drink — cashier picks food, then customizes the included drink" },
    { value: "mix_and_match", label: "Mix & Match", desc: "Food + drink — cashier selects food, customer picks from a fixed drink pool" },
  ],
  drink: [
    { value: "drink", label: "Drink", desc: "Regular drink — cashier picks size (SM/SL, UM/UL, etc.)" },
    { value: "bundle", label: "Bundle", desc: "Drinks-only bundle — cashier customizes each drink step by step" },
  ],
  promo: [
    { value: "promo", label: "Promo", desc: "Promos, freebies, loyalty cards — no size or sugar" },
  ],
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

interface MenuItem {
  id: number;
  name: string;
  category_type: string;
  category: string;
  price: number;
  size: string | null;
}

interface CategoryDrink {
  id: number;
  category_id: number;
  menu_item_id: number;
  name: string;
  size: string;
  price: number;
}

// ── Shared UI ────────────────────────────────────────────────────────────────

interface BtnProps {
  children: React.ReactNode; variant?: VariantKey; size?: SizeKey;
  onClick?: () => void; className?: string; disabled?: boolean; type?: "button" | "submit" | "reset";
}
const Btn: React.FC<BtnProps> = ({ children, variant = "primary", size = "sm", onClick, className = "", disabled = false, type = "button" }) => {
  const sizes: Record<SizeKey, string> = { sm: "px-3 py-2 text-xs", md: "px-4 py-2.5 text-sm", lg: "px-6 py-3 text-sm" };
  const variants: Record<VariantKey, string> = {
    primary: "bg-[#3b2063] hover:bg-[#2a1647] text-white",
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

const SkeletonBar: React.FC<{ h?: string }> = ({ h = "h-4" }) => (
  <div className={`w-full ${h} bg-zinc-100 rounded animate-pulse`} />
);

const inputCls = (err?: string) =>
  `w-full text-sm font-medium text-zinc-700 bg-zinc-50 border rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white transition-all ${err ? "border-red-300 bg-red-50" : "border-zinc-200"}`;

// ── Drink Pool Setup Modal ────────────────────────────────────────────────────
// First-time setup experience for a freshly created mix_and_match category.

interface DrinkPoolSetupModalProps {
  category: Category;
  onClose: () => void;
  onSkip: () => void;
}

const DrinkPoolSetupModal: React.FC<DrinkPoolSetupModalProps> = ({ category, onClose, onSkip }) => {
  const [allDrinks, setAllDrinks] = useState<(MenuItem & { _sizeLabel: string })[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Fetch all drink-type menu items
  useEffect(() => {
    setLoading(true);
    fetch("/api/menu-items", { headers: authHeaders() })
      .then(r => r.json())
      .then(data => {
        const items: MenuItem[] = (Array.isArray(data) ? data : (data.data ?? []));
        const drinkPool = items
          .filter(i => i.category_type === "drink")
          .sort((a, b) => a.name.localeCompare(b.name) || (a.price - b.price));

        const nameCounts = drinkPool.reduce<Record<string, number>>((acc, d) => {
          acc[d.name] = (acc[d.name] ?? 0) + 1; return acc;
        }, {});
        const nameIndex: Record<string, number> = {};
        const annotated = drinkPool.map(drink => {
          const hasPair = nameCounts[drink.name] > 1;
          let sizeLabel = drink.size && drink.size !== "none" ? drink.size.toUpperCase() : "";
          if (!sizeLabel && hasPair) {
            nameIndex[drink.name] = (nameIndex[drink.name] ?? 0) + 1;
            sizeLabel = nameIndex[drink.name] === 1 ? "M" : "L";
          }
          return { ...drink, _sizeLabel: sizeLabel };
        });
        setAllDrinks(annotated);
      })
      .catch(() => setError("Failed to load drinks."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() =>
    allDrinks.filter(d =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.category.toLowerCase().includes(search.toLowerCase())
    ),
    [allDrinks, search]
  );

  const toggle = (id: number) => {
    setSaved(false);
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  const selectAll = () => {
    setSaved(false);
    setSelectedIds(new Set(filtered.map(d => d.id)));
  };

  const clearAll = () => {
    setSaved(false);
    setSelectedIds(new Set());
  };

  const handleSave = async () => {
    if (selectedIds.size === 0) { setError("Select at least one drink."); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/category-drinks", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          category_id: category.id,
          drinks: allDrinks
            .filter(d => selectedIds.has(d.id))
            .map(d => ({ menu_item_id: d.id, size: d._sizeLabel || "M" })),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) { setError("Failed to save drink pool."); return; }
      setSaved(true);
      setTimeout(onClose, 800);
    } catch { setError("Network error."); }
    finally { setSaving(false); }
  };

  return createPortal(
    <div className="fixed inset-0 z-10000 flex items-center justify-center p-4"
      style={{ backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="absolute inset-0" onClick={onSkip} />

      <div className="relative bg-white w-full max-w-xl border border-zinc-200 rounded-[1.25rem] shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="px-6 pt-6 pb-5 border-b border-zinc-100 shrink-0">
          {/* Celebration strip */}
          <div className="flex items-center gap-2 mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl">
            <div className="w-8 h-8 bg-rose-100 border border-rose-300 rounded-lg flex items-center justify-center shrink-0">
              <Sparkles size={14} className="text-rose-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-rose-700">
                "{category.name}" created!
              </p>
              <p className="text-[10px] text-rose-500 leading-tight mt-0.5">
                Now set up the drinks customers can pick from in this Mix & Match category.
              </p>
            </div>
            <button onClick={onSkip} className="p-1.5 hover:bg-rose-100 rounded-lg text-rose-300 hover:text-rose-500 transition-colors shrink-0">
              <X size={14} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-[#1a0f2e]">Set Up Drink Pool</p>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                Choose which drinks customers can pick from in <span className="font-semibold text-zinc-600">{category.name}</span>
              </p>
            </div>
            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full">
              {selectedIds.size} selected
            </span>
          </div>
        </div>

        {/* Search + controls */}
        <div className="px-6 pt-4 pb-2 flex items-center gap-2 shrink-0">
          <div className="flex-1 flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2">
            <Search size={12} className="text-zinc-400 shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter drinks…"
              className="flex-1 bg-transparent text-xs text-zinc-700 outline-none placeholder:text-zinc-400"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-zinc-300 hover:text-zinc-500">
                <X size={11} />
              </button>
            )}
          </div>
          <button
            onClick={selectAll}
            className="text-[10px] font-bold text-violet-600 hover:text-violet-800 bg-violet-50 hover:bg-violet-100 px-2.5 py-2 rounded-lg border border-violet-200 transition-colors whitespace-nowrap"
          >
            All
          </button>
          <button
            onClick={clearAll}
            className="text-[10px] font-bold text-zinc-400 hover:text-zinc-600 bg-zinc-50 hover:bg-zinc-100 px-2.5 py-2 rounded-lg border border-zinc-200 transition-colors whitespace-nowrap"
          >
            None
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mt-2 flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-lg shrink-0">
            <AlertCircle size={13} className="text-red-500 shrink-0" />
            <p className="text-xs text-red-600 font-medium">{error}</p>
          </div>
        )}

        {/* Drink grid */}
        <div className="px-6 py-3 overflow-y-auto flex-1">
          {loading ? (
            <div className="grid grid-cols-2 gap-2">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-12 bg-zinc-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Coffee size={24} className="text-zinc-200 mb-2" />
              <p className="text-xs text-zinc-400 font-medium">
                {search ? "No drinks match your search." : "No drink items found. Add drinks to the menu first."}
              </p>
            </div>
          ) : (
            <>
              {/* Group by category */}
              {Object.entries(
                filtered.reduce<Record<string, typeof filtered>>((acc, d) => {
                  const cat = d.category ?? "Other";
                  if (!acc[cat]) acc[cat] = [];
                  acc[cat].push(d);
                  return acc;
                }, {})
              ).map(([catName, drinks]) => (
                <div key={catName} className="mb-4">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-2 px-0.5">
                    {catName}
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {drinks.map(d => {
                      const isSelected = selectedIds.has(d.id);
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => toggle(d.id)}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all ${isSelected
                            ? "bg-rose-50 border-rose-400 text-rose-800 shadow-sm"
                            : "bg-white border-zinc-200 text-zinc-500 hover:border-rose-300 hover:bg-rose-50/50"
                            }`}
                        >
                          {/* Checkbox */}
                          <div className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? "bg-rose-500 border-rose-500" : "border-zinc-300"
                            }`}>
                            {isSelected && (
                              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                                <path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </div>

                          {/* Name + size + price */}
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-[11px] font-semibold truncate leading-tight">{d.name}</span>
                            <div className="flex items-center gap-1 mt-0.5">
                              {d._sizeLabel && (
                                <span className={`text-[9px] font-bold uppercase px-1.5 py-px rounded-full ${isSelected ? "bg-rose-200 text-rose-700" : "bg-zinc-100 text-zinc-400"
                                  }`}>
                                  {d._sizeLabel}
                                </span>
                              )}
                              <span className={`text-[9px] font-medium ${isSelected ? "text-rose-500" : "text-zinc-400"}`}>
                                ₱{Number(d.price).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-100 flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={onSkip}
            className="text-xs font-bold text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            Skip for now
          </button>
          <div className="flex items-center gap-2">
            <Btn variant="secondary" onClick={onSkip} disabled={saving}>Cancel</Btn>
            <Btn onClick={handleSave} disabled={saving || loading || selectedIds.size === 0}>
              {saving ? (
                <span className="flex items-center gap-1.5">
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving…
                </span>
              ) : saved ? (
                "✓ Saved!"
              ) : (
                <><Coffee size={12} /> Save Drink Pool ({selectedIds.size})</>
              )}
            </Btn>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ── Category Modal ────────────────────────────────────────────────────────────

const CategoryModal: React.FC<{
  category?: Category;
  onClose: () => void;
  onSaved: (c: Category) => void;
}> = ({ category, onClose, onSaved }) => {
  const isEdit = !!category;

  const [name, setName] = useState(category?.name ?? "");
  const [baseType, setBaseType] = useState<CategoryType>((category?.type && POS_BEHAVIOR_BY_TYPE[category.type as CategoryType]) ? (category.type as CategoryType) : "food");
  const [posBehavior, setPosBehavior] = useState<string>(category?.category_type ?? "food");
  const [isActive, setIsActive] = useState(category?.is_active ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const handleBaseTypeChange = (t: CategoryType) => {
    setBaseType(t);
    const options = POS_BEHAVIOR_BY_TYPE[t];
    if (options && options.length > 0) {
      setPosBehavior(options[0].value);
    }
  };

  const behaviorOptions = POS_BEHAVIOR_BY_TYPE[baseType] || [];
  const selectedBehavior = behaviorOptions.find(o => o.value === posBehavior);

  const handleSubmit = async () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Category name is required.";
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true); setApiError("");
    try {
      const payload = {
        name,
        type: baseType,
        category_type: posBehavior,
        is_active: isActive,
      };
      const url = isEdit ? `/api/categories/${category!.id}` : "/api/categories";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(payload) });
      const data = await res.json();
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
              placeholder="e.g. Spaghetti W/ Drink" className={inputCls(errors.name)} />
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

          {(posBehavior === "bundle" || posBehavior === "combo" || posBehavior === "mix_and_match") && (
            <div className={`p-3 rounded-lg border text-xs font-medium ${posBehavior === "bundle"
              ? "bg-indigo-50 border-indigo-200 text-indigo-700"
              : posBehavior === "combo"
                ? "bg-purple-50 border-purple-200 text-purple-700"
                : "bg-rose-50 border-rose-200 text-rose-700"
              }`}>
              {posBehavior === "bundle" ? (
                <>
                  <p className="font-bold mb-1">Bundle — Drinks Only</p>
                  <p className="opacity-80">Each drink gets its own sugar, options, and add-ons. Cashier steps through each drink one by one.</p>
                </>
              ) : posBehavior === "combo" ? (
                <>
                  <p className="font-bold mb-1">Combo — Food + Drink</p>
                  <p className="opacity-80">Cashier selects the combo item, then picks and customizes the included drink.</p>
                </>
              ) : (
                <>
                  <p className="font-bold mb-1">Mix & Match — Food + Customer's Choice</p>
                  <p className="opacity-80">After saving, you'll be prompted to set up the drink pool customers can choose from.</p>
                </>
              )}
            </div>
          )}

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
              : isEdit
                ? "Save Changes"
                : posBehavior === "mix_and_match"
                  ? <><Plus size={13} /> Add & Set Up Drinks</>
                  : <><Plus size={13} /> Add Category</>
            }
          </Btn>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ── CategoryDrinksManager (inline edit from table) ────────────────────────────

const CategoryDrinksManager: React.FC<{
  category: Category;
  onClose: () => void;
}> = ({ category, onClose }) => {
  const [allDrinks, setAllDrinks] = useState<(MenuItem & { _sizeLabel: string })[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/menu-items", { headers: authHeaders() }).then(r => r.json()),
      fetch(`/api/category-drinks?category_id=${category.id}`, { headers: authHeaders() }).then(r => r.json()),
    ]).then(([itemsData, drinksData]) => {
      const items: MenuItem[] = (Array.isArray(itemsData) ? itemsData : (itemsData.data ?? []));
      const drinkPool = items.filter(i => i.category_type === "drink")
        .sort((a, b) => a.name.localeCompare(b.name) || (a.price - b.price));

      const nameCounts = drinkPool.reduce<Record<string, number>>((acc, d) => {
        acc[d.name] = (acc[d.name] ?? 0) + 1; return acc;
      }, {});
      const nameIndex: Record<string, number> = {};
      setAllDrinks(drinkPool.map(drink => {
        const hasPair = nameCounts[drink.name] > 1;
        let sizeLabel = drink.size && drink.size !== "none" ? drink.size.toUpperCase() : "";
        if (!sizeLabel && hasPair) {
          nameIndex[drink.name] = (nameIndex[drink.name] ?? 0) + 1;
          sizeLabel = nameIndex[drink.name] === 1 ? "M" : "L";
        }
        return { ...drink, _sizeLabel: sizeLabel };
      }));

      const existing: CategoryDrink[] = drinksData.data ?? [];
      setSelectedIds(new Set(existing.map(d => d.menu_item_id)));
    })
      .catch(() => setError("Failed to load data."))
      .finally(() => setLoading(false));
  }, [category.id]);

  const filtered = useMemo(() =>
    allDrinks.filter(d => d.name.toLowerCase().includes(search.toLowerCase())),
    [allDrinks, search]
  );

  const toggle = (id: number) => {
    setSaved(false);
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/category-drinks", {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({
          category_id: category.id,
          drinks: allDrinks.filter(d => selectedIds.has(d.id))
            .map(d => ({ menu_item_id: d.id, size: d._sizeLabel || "M" })),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) { setError("Failed to save."); return; }
      setSaved(true);
    } catch { setError("Network error."); }
    finally { setSaving(false); }
  };

  return createPortal(
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-4"
      style={{ backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", backgroundColor: "rgba(0,0,0,0.45)" }}>
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg border border-zinc-200 rounded-[1.25rem] shadow-2xl flex flex-col max-h-[85vh]">

        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-rose-50 border border-rose-200 rounded-lg flex items-center justify-center">
              <Coffee size={15} className="text-rose-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#1a0f2e]">Manage Drink Pool</p>
              <p className="text-[10px] text-zinc-400">{category.name} · {selectedIds.size} selected</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-zinc-600 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="px-6 pt-4 pb-2 shrink-0 flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2">
            <Search size={12} className="text-zinc-400 shrink-0" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Filter drinks…"
              className="flex-1 bg-transparent text-xs text-zinc-700 outline-none placeholder:text-zinc-400" />
            {search && <button onClick={() => setSearch("")} className="text-zinc-300 hover:text-zinc-500"><X size={11} /></button>}
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-2 flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-lg shrink-0">
            <AlertCircle size={13} className="text-red-500 shrink-0" />
            <p className="text-xs text-red-600 font-medium">{error}</p>
          </div>
        )}

        <div className="px-6 py-3 overflow-y-auto flex-1">
          {loading ? (
            <div className="grid grid-cols-2 gap-2">
              {[...Array(6)].map((_, i) => <div key={i} className="h-12 bg-zinc-100 rounded-xl animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-1.5">
              {filtered.map(d => {
                const isSelected = selectedIds.has(d.id);
                return (
                  <button key={d.id} type="button" onClick={() => toggle(d.id)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all ${isSelected
                      ? "bg-rose-50 border-rose-400 text-rose-800"
                      : "bg-white border-zinc-200 text-zinc-500 hover:border-rose-300"
                      }`}>
                    <div className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? "bg-rose-500 border-rose-500" : "border-zinc-300"
                      }`}>
                      {isSelected && (
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                          <path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-[11px] font-semibold truncate">{d.name}</span>
                      {d._sizeLabel && (
                        <span className={`text-[9px] font-bold uppercase ${isSelected ? "text-rose-500" : "text-zinc-400"}`}>
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

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-zinc-100 shrink-0">
          <Btn variant="secondary" onClick={onClose} disabled={saving}>Close</Btn>
          <Btn onClick={handleSave} disabled={saving || loading}>
            {saving
              ? <span className="flex items-center gap-1.5"><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</span>
              : saved ? "✓ Saved!" : "Save Drink Pool"
            }
          </Btn>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

const CategoriesTab: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [delTarget, setDelTarget] = useState<Category | null>(null);
  const [delLoading, setDelLoading] = useState(false);
  const [inlineEdit, setInlineEdit] = useState<number | null>(null);
  const [inlineVal, setInlineVal] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  // ── New: post-create drink pool setup
  const [drinkSetupTarget, setDrinkSetupTarget] = useState<Category | null>(null);
  const [drinkPoolTarget, setDrinkPoolTarget] = useState<Category | null>(null);

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

  const toggleActive = async (cat: Category) => {
    try {
      const res = await fetch(`/api/categories/${cat.id}`, {
        method: "PUT", headers: authHeaders(),
        body: JSON.stringify({ is_active: !cat.is_active }),
      });
      if (res.ok) {
        setCategories(p => p.map(c => c.id === cat.id ? { ...c, is_active: !c.is_active } : c));
        try { new BroadcastChannel('pos-updates').postMessage('menu-updated'); } catch { /* ignore */ }
      }
    } catch { /* silent */ }
  };

  const handleDelete = async (cat: Category) => {
    setDelLoading(true);
    try {
      const res = await fetch(`/api/categories/${cat.id}`, { method: "DELETE", headers: authHeaders() });
      const data = await res.json();
      if (res.ok) { setCategories(p => p.filter(c => c.id !== cat.id)); setDelTarget(null); }
      else setError(data.message ?? "Failed to delete.");
    } catch { setError("Network error."); }
    finally { setDelLoading(false); }
  };

  const saveInline = async (cat: Category) => {
    if (!inlineVal.trim()) { setInlineEdit(null); return; }
    try {
      const res = await fetch(`/api/categories/${cat.id}`, {
        method: "PUT", headers: authHeaders(),
        body: JSON.stringify({ name: inlineVal }),
      });
      if (res.ok) setCategories(p => p.map(c => c.id === cat.id ? { ...c, name: inlineVal } : c));
    } catch { /* silent */ }
    finally { setInlineEdit(null); }
  };

  // Called when CategoryModal saves. If it's a new mix_and_match, prompt drink setup.
  const handleCategorySaved = (cat: Category, isNew: boolean) => {
    if (isNew) {
      setCategories(p => [cat, ...p]);
      if (cat.category_type === "mix_and_match") {
        setDrinkSetupTarget(cat);
      }
    } else {
      setCategories(p => p.map(c => c.id === cat.id ? cat : c));
    }
  };
  const totalItems = categories.reduce((sum, c) => sum + (c.menu_items_count ?? 0), 0);

  const filtered = useMemo(() => {
    return categories.filter(c => {
      const matchType = filterType === "all" || c.type === filterType;
      const matchStatus = filterStatus === "all" || 
        (filterStatus === "active" ? c.is_active : !c.is_active);
      const matchSearch = search === "" || c.name.toLowerCase().includes(search.toLowerCase());
      return matchType && matchStatus && matchSearch;
    });
  }, [categories, filterType, filterStatus, search]);

  return (
    <div className="p-6 md:p-8 fade-in">
      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Total Categories", value: categories.length, color: "bg-violet-50 border-violet-200 text-violet-600" },
          { label: "Active", value: categories.filter(c => c.is_active).length, color: "bg-emerald-50 border-emerald-200 text-emerald-600" },
          { label: "Inactive", value: categories.filter(c => !c.is_active).length, color: "bg-red-50 border-red-200 text-red-500" },
          { label: "Linked Items", value: totalItems, color: "bg-amber-50 border-amber-200 text-amber-600" },
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
          <button onClick={() => setError("")} className="ml-auto text-red-300 hover:text-red-500"><X size={14} /></button>
        </div>
      )}

      <div className="bg-white border border-zinc-200 rounded-[0.625rem] overflow-hidden">
        {/* Actions Bar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-100 flex-wrap">
          {/* Left: Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search categories..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm font-medium text-zinc-700 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white transition-all"
            />
          </div>

          {/* Right: Filters & Actions */}
          <div className="flex items-center gap-2 ml-auto shrink-0 flex-wrap">
            <div className="relative">
              <select value={filterType} onChange={e => setFilterType(e.target.value)}
                className="appearance-none text-xs font-bold text-zinc-600 bg-white border border-zinc-200 rounded-lg pl-3 pr-8 py-2 outline-none focus:ring-2 focus:ring-violet-400 cursor-pointer">
                <option value="all">All Types</option>
                <option value="food">Food</option>
                <option value="drink">Drink</option>
                <option value="promo">Promo</option>
              </select>
              <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            </div>

            <div className="relative">
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                className="appearance-none text-xs font-bold text-zinc-600 bg-white border border-zinc-200 rounded-lg pl-3 pr-8 py-2 outline-none focus:ring-2 focus:ring-violet-400 cursor-pointer">
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            </div>

            {(filterType !== "all" || filterStatus !== "all" || search !== "") && (
              <button onClick={() => { setFilterType("all"); setFilterStatus("all"); setSearch(""); }}
                className="text-xs font-bold text-zinc-400 hover:text-red-500 flex items-center gap-1 transition-colors pl-1">
                <X size={11} /> Clear
              </button>
            )}

            <div className="w-px h-6 bg-zinc-200 mx-1 hidden sm:block"></div>

            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hidden lg:inline-block mr-1">
              {filtered.length} categories
            </span>
            <Btn onClick={() => setAddOpen(true)} disabled={loading}>
              <Plus size={13} /> Add Category
            </Btn>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100">
                {["Name", "Type", "POS Behavior", "Items", "Active", "Actions"].map(h => (
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
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-zinc-400 text-xs">No categories found.</td></tr>
              )}
              {!loading && filtered.map(cat => (
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
                  <td className="px-5 py-3.5">
                    <button onClick={() => toggleActive(cat)} className="transition-colors">
                      {cat.is_active ? <ToggleRight size={22} className="text-[#3b2063]" /> : <ToggleLeft size={22} className="text-zinc-300" />}
                    </button>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1">
                      {/* ── Drink pool button for mix_and_match categories */}
                      {cat.category_type === "mix_and_match" && (
                        <button
                          onClick={() => setDrinkPoolTarget(cat)}
                          className="p-1.5 hover:bg-rose-50 rounded-[0.4rem] text-zinc-300 hover:text-rose-500 transition-colors"
                          title="Manage drink pool"
                        >
                          <Coffee size={13} />
                        </button>
                      )}
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
            {categories.length} categories · double-click name to edit inline ·{" "}
            <span className="text-rose-400">☕ = manage drink pool</span>
          </div>
        )}
      </div>

      {/* Delete confirm */}
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
              <Btn variant="danger" className="flex-1 justify-center" onClick={() => handleDelete(delTarget)} disabled={delLoading}>
                {delLoading
                  ? <span className="flex items-center gap-1.5"><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Deleting...</span>
                  : <><Trash2 size={13} /> Delete</>}
              </Btn>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Add category modal */}
      {addOpen && (
        <CategoryModal
          onClose={() => setAddOpen(false)}
          onSaved={c => { handleCategorySaved(c, true); setAddOpen(false); }}
        />
      )}

      {/* Edit category modal */}
      {editTarget && (
        <CategoryModal
          category={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={c => { handleCategorySaved(c, false); setEditTarget(null); }}
        />
      )}

      {/* ── Post-create drink pool setup (first-time, new mix_and_match) */}
      {drinkSetupTarget && (
        <DrinkPoolSetupModal
          category={drinkSetupTarget}
          onClose={() => setDrinkSetupTarget(null)}
          onSkip={() => setDrinkSetupTarget(null)}
        />
      )}

      {/* ── Drink pool manager (edit from table row coffee icon) */}
      {drinkPoolTarget && (
        <CategoryDrinksManager
          category={drinkPoolTarget}
          onClose={() => setDrinkPoolTarget(null)}
        />
      )}
    </div>
  );
};

export default CategoriesTab;