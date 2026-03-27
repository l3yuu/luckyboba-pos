// components/NewSuperAdmin/Tabs/MenuManagement/MenuItemsTab.tsx
import { useState, useEffect, useCallback, useMemo, startTransition, useRef } from "react";
import {
  Search, Plus, Edit2, Trash2, RefreshCw,
  AlertCircle, X, Package, ChevronDown,
  ToggleLeft, ToggleRight, Barcode, Utensils, Coffee, Info,
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

interface BundleItemRaw {
  custom_name?: string;
  name?:        string;
  quantity?:    number;
  size?:        string;
}

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
interface SubCategory { id: number; name: string; category_id: number; }

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

const OptionsToggle: React.FC<{
  value:    ItemOptions;
  onChange: (v: ItemOptions) => void;
}> = ({ value, onChange }) => (
  <div className="flex flex-col gap-2 p-3 bg-zinc-50 border border-zinc-200 rounded-lg">
    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Drink Options</p>
    <div className="flex items-center gap-3">

      {/* Pearl toggle */}
      <button
        type="button"
        onClick={() => onChange({ ...value, pearl: !value.pearl })}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-bold transition-all ${
          value.pearl
            ? "bg-rose-50 border-rose-300 text-rose-700"
            : "bg-white border-zinc-200 text-zinc-400"
        }`}
      >
        🧋
        <span>Pearl</span>
        {value.pearl
          ? <ToggleRight size={18} className="text-rose-500" />
          : <ToggleLeft  size={18} className="text-zinc-300" />}
      </button>

      {/* Ice toggle */}
      <button
        type="button"
        onClick={() => onChange({ ...value, ice: !value.ice })}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-bold transition-all ${
          value.ice
            ? "bg-sky-50 border-sky-300 text-sky-700"
            : "bg-white border-zinc-200 text-zinc-400"
        }`}
      >
        🧊
        <span>Ice</span>
        {value.ice
          ? <ToggleRight size={18} className="text-sky-500" />
          : <ToggleLeft  size={18} className="text-zinc-300" />}
      </button>
    </div>
    <p className="text-[9px] text-zinc-400">These options will appear as add-on choices at the cashier.</p>
  </div>
);

const inputCls = (err?: string) =>
  `w-full text-sm font-medium text-zinc-700 bg-zinc-50 border rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white transition-all ${err ? "border-red-300 bg-red-50" : "border-zinc-200"}`;

const Field: React.FC<{ label: string; required?: boolean; error?: string; children: React.ReactNode }> = ({ label, required, error, children }) => (
  <div>
    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5 block">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    {children}
    {error && <p className="text-[10px] text-red-500 mt-1 font-medium">{error}</p>}
  </div>
);

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

// ── Combo Builder Section ─────────────────────────────────────────────────────

interface ComboBuilderProps {
  allItems:      MenuItem[];
  foodItemId:    string;
  drinkItemId:   string;
  onFoodChange:  (id: string) => void;
  onDrinkChange: (id: string) => void;
  errors:        Record<string, string>;
}

const FOOD_TYPES  = ["food", "wings", "waffle"];
const DRINK_TYPES = ["drink"];

const ComboBuilder: React.FC<ComboBuilderProps> = ({
  allItems, foodItemId, drinkItemId, onFoodChange, onDrinkChange, errors,
}) => {

  const foodOptions = useMemo(() =>
    allItems
      .filter(i => FOOD_TYPES.includes(i.category_type))
      .map(i => ({ value: String(i.id), label: `${i.name} — ${i.category} (₱${Number(i.price).toFixed(2)})` })),
    [allItems]
  );

  const drinkOptions = useMemo(() => {
    const drinks = allItems.filter(i => DRINK_TYPES.includes(i.category_type));
    const nameCounts = drinks.reduce<Record<string, number>>((acc, d) => {
      acc[d.name] = (acc[d.name] ?? 0) + 1; return acc;
    }, {});
    const nameIndex: Record<string, number> = {};
    return drinks.map(i => {
      const hasPair = nameCounts[i.name] > 1;
      let sizeLabel = i.size && i.size !== "none" ? i.size : "";
      if (!sizeLabel && hasPair) {
        nameIndex[i.name] = (nameIndex[i.name] ?? 0) + 1;
        sizeLabel = nameIndex[i.name] === 1 ? "M" : "L";
      }
      return {
        value: String(i.id),
        label: `${i.name}${sizeLabel ? ` (${sizeLabel})` : ""} — ${i.category} (₱${Number(i.price).toFixed(2)})`,
      };
    });
  }, [allItems]);

  return (
    <div className="flex flex-col gap-3 p-4 bg-purple-50 border border-purple-200 rounded-xl">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-6 h-6 bg-purple-100 border border-purple-300 rounded-md flex items-center justify-center">
          <Utensils size={11} className="text-purple-600" />
        </div>
        <p className="text-xs font-bold text-purple-700 uppercase tracking-wider">Combo Builder</p>
        <span className="text-[10px] text-purple-400 font-medium">— pick 1 food + 1 drink</span>
      </div>

      {/* Food picker */}
      <div>
        <label className="text-[10px] font-bold uppercase tracking-wider text-purple-600 mb-1.5 flex items-center gap-1.5">
          <Utensils size={10} /> Food Item <span className="text-red-400">*</span>
        </label>
        <SearchableSelect
          options={foodOptions}
          value={foodItemId}
          onChange={onFoodChange}
          placeholder="Search food item..."
          error={!!errors.food_item_id}
          accentColor="purple"
        />
        {errors.food_item_id && <p className="text-[10px] text-red-500 mt-1 font-medium">{errors.food_item_id}</p>}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 h-px bg-purple-200" />
        <span className="text-[10px] font-bold text-purple-400">+</span>
        <div className="flex-1 h-px bg-purple-200" />
      </div>

      {/* Drink picker */}
      <div>
        <label className="text-[10px] font-bold uppercase tracking-wider text-purple-600 mb-1.5 flex items-center gap-1.5">
          <Coffee size={10} /> Drink Item <span className="text-red-400">*</span>
        </label>
        <SearchableSelect
          options={drinkOptions}
          value={drinkItemId}
          onChange={onDrinkChange}
          placeholder="Search drink item..."
          error={!!errors.drink_item_id}
          accentColor="purple"
        />
        {errors.drink_item_id && <p className="text-[10px] text-red-500 mt-1 font-medium">{errors.drink_item_id}</p>}
      </div>

      <p className="text-[10px] text-purple-500 font-medium leading-tight">
        This will create a combo bundle. The cashier will select the food item, then customize the drink (sugar, options, add-ons).
      </p>
    </div>
  );
};

// ── Bundle Builder Section ────────────────────────────────────────────────────

interface BundleBuilderProps {
  allItems:       MenuItem[];
  bundleItemIds:  string[];
  onItemsChange:  (ids: string[]) => void;
  errors:         Record<string, string>;
}

const BundleBuilder: React.FC<BundleBuilderProps> = ({
  allItems, bundleItemIds, onItemsChange, errors,
}) => {
  const drinkOptions = useMemo(() => {
    const drinks = allItems
      .filter(i => i.category_type === "drink")
      .sort((a, b) => a.name.localeCompare(b.name) || (a.price - b.price));
    const nameCounts = drinks.reduce<Record<string, number>>((acc, d) => {
      acc[d.name] = (acc[d.name] ?? 0) + 1; return acc;
    }, {});
    const nameIndex: Record<string, number> = {};
    return drinks.map(i => {
      const hasPair = nameCounts[i.name] > 1;
      let sizeLabel = i.size && i.size !== "none" ? i.size : "";
      if (!sizeLabel && hasPair) {
        nameIndex[i.name] = (nameIndex[i.name] ?? 0) + 1;
        sizeLabel = nameIndex[i.name] === 1 ? "M" : "L";
      }
      return {
        value: String(i.id),
        label: `${i.name}${sizeLabel ? ` (${sizeLabel})` : ""} — ${i.category} (₱${Number(i.price).toFixed(2)})`,
      };
    });
  }, [allItems]);

  const addSlot    = () => onItemsChange([...bundleItemIds, ""]);
  const removeSlot = (idx: number) => onItemsChange(bundleItemIds.filter((_, i) => i !== idx));
  const setSlot    = (idx: number, val: string) => {
    const next = [...bundleItemIds]; next[idx] = val; onItemsChange(next);
  };

  return (
    <div className="flex flex-col gap-3 p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-indigo-100 border border-indigo-300 rounded-md flex items-center justify-center">
            <Package size={11} className="text-indigo-600" />
          </div>
          <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Bundle Builder</p>
          <span className="text-[10px] text-indigo-400 font-medium">— pick 2+ drinks</span>
        </div>
        <button type="button" onClick={addSlot}
          className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-100 hover:bg-indigo-200 px-2 py-1 rounded-md transition-colors">
          <Plus size={10} /> Add Item
        </button>
      </div>

      {bundleItemIds.length === 0 && (
        <p className="text-[10px] text-indigo-400 italic text-center py-2">Click "Add Item" to start building the bundle.</p>
      )}

      {bundleItemIds.map((itemId, idx) => (
        <div key={idx}>
          {idx > 0 && (
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 h-px bg-indigo-200" />
              <span className="text-[10px] font-bold text-indigo-400">+</span>
              <div className="flex-1 h-px bg-indigo-200" />
            </div>
          )}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Coffee size={10} /> Item {idx + 1} <span className="text-red-400">*</span>
              </span>
              {bundleItemIds.length > 2 && (
                <button type="button" onClick={() => removeSlot(idx)}
                  className="text-[9px] font-bold text-red-400 hover:text-red-600 flex items-center gap-0.5 transition-colors">
                  <X size={9} /> Remove
                </button>
              )}
            </label>
            <SearchableSelect
              options={drinkOptions}
              value={itemId}
              onChange={val => setSlot(idx, val)}
              placeholder={`Search item ${idx + 1}...`}
              error={!!errors[`bundle_item_${idx}`]}
              accentColor="indigo"
            />
            {errors[`bundle_item_${idx}`] && (
              <p className="text-[10px] text-red-500 mt-1 font-medium">{errors[`bundle_item_${idx}`]}</p>
            )}
          </div>
        </div>
      ))}

      {bundleItemIds.length > 0 && (
        <p className="text-[10px] text-indigo-500 font-medium leading-tight mt-1">
          Each item will be linked to this bundle. Minimum 2 items required.
        </p>
      )}
    </div>
  );
};

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

const SugarLevelToggle: React.FC<{
  allLevels: SugarLevel[];
  selected:  number[];
  onChange:  (ids: number[]) => void;
}> = ({ allLevels, selected, onChange }) => {
  const toggle = (id: number) => {
    onChange(selected.includes(id)
      ? selected.filter(s => s !== id)
      : [...selected, id]
    );
  };

  if (allLevels.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 p-3 bg-zinc-50 border border-zinc-200 rounded-lg">
      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Sugar Levels</p>
      <div className="flex flex-wrap gap-1.5">
        {allLevels.map(lvl => {
          const isOn = selected.includes(lvl.id);
          return (
            <button
              key={lvl.id}
              type="button"
              onClick={() => toggle(lvl.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                isOn
                  ? "bg-violet-50 border-violet-300 text-violet-700"
                  : "bg-white border-zinc-200 text-zinc-400"
              }`}
            >
              <span>%</span>
              <span>{lvl.label}</span>
              {isOn
                ? <ToggleRight size={16} className="text-violet-500" />
                : <ToggleLeft  size={16} className="text-zinc-300" />}
            </button>
          );
        })}
      </div>
      <p className="text-[9px] text-zinc-400">Selected sugar levels will appear as choices at the cashier.</p>
    </div>
  );
};

// ── Food Add-Ons Toggle ───────────────────────────────────────────────────────

const FoodAddOnsToggle: React.FC<{
  allAddOns:  AddOnItem[];
  selected:   number[];
  onChange:   (ids: number[]) => void;
}> = ({ allAddOns, selected, onChange }) => {
  const foodAddOns = allAddOns.filter(a => a.category === "food" && a.is_available);

  const toggle = (id: number) => {
    onChange(selected.includes(id)
      ? selected.filter(s => s !== id)
      : [...selected, id]
    );
  };

  if (foodAddOns.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
      <p className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Food Add-Ons</p>
      <div className="flex flex-wrap gap-1.5">
        {foodAddOns.map(addon => {
          const isOn = selected.includes(addon.id);
          return (
            <button
              key={addon.id}
              type="button"
              onClick={() => toggle(addon.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                isOn
                  ? "bg-amber-100 border-amber-300 text-amber-700"
                  : "bg-white border-zinc-200 text-zinc-400"
              }`}
            >
              <span>🍴</span>
              <span>{addon.name}</span>
              <span className={`text-[9px] font-bold ${isOn ? "text-amber-500" : "text-zinc-300"}`}>
                ₱{Number(addon.price).toFixed(2)}
              </span>
              {isOn
                ? <ToggleRight size={16} className="text-amber-500" />
                : <ToggleLeft  size={16} className="text-zinc-300" />}
            </button>
          );
        })}
      </div>
      <p className="text-[9px] text-amber-500">Selected add-ons will appear as choices when this item is ordered.</p>
    </div>
  );
};

// ── Searchable Select ─────────────────────────────────────────────────────────

interface SearchableSelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options:      SearchableSelectOption[];
  value:        string;
  onChange:     (val: string) => void;
  placeholder?: string;
  error?:       boolean;
  accentColor?: string; // e.g. "purple" | "indigo" | "rose"
}

const ACCENT: Record<string, { border: string; ring: string; icon: string; highlight: string }> = {
  purple: { border: "border-purple-200", ring:  "focus-within:ring-purple-400", icon:  "text-purple-300", highlight: "bg-purple-50 text-purple-700" },
  indigo: { border: "border-indigo-200", ring:  "focus-within:ring-indigo-400", icon:  "text-indigo-300", highlight: "bg-indigo-50 text-indigo-700" },
  rose:   { border: "border-rose-200",   ring:  "focus-within:ring-rose-400",   icon:  "text-rose-300",   highlight: "bg-rose-50 text-rose-700"     },
};

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options, value, onChange, placeholder = "Search or select...", error = false, accentColor = "purple",
}) => {
  const [query,  setQuery]  = useState("");
  const [open,   setOpen]   = useState(false);
  const ref                 = useRef<HTMLDivElement>(null);
  const inputRef            = useRef<HTMLInputElement>(null);
  const ac                  = ACCENT[accentColor] ?? ACCENT.purple;

  const selected = options.find(o => o.value === value);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return options;
    return options.filter(o => o.label.toLowerCase().includes(q));
  }, [options, query]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (val: string) => {
    onChange(val);
    setOpen(false);
    setQuery("");
  };

  const handleOpen = () => {
    setOpen(true);
    setQuery("");
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={open ? () => { setOpen(false); setQuery(""); } : handleOpen}
        className={`w-full flex items-center gap-2 bg-white border rounded-lg px-3 py-2.5 text-sm transition-all outline-none ring-2 ring-transparent ${ac.ring} ${error ? "border-red-300" : ac.border}`}
      >
        <Search size={13} className={`shrink-0 ${selected ? "text-zinc-400" : ac.icon}`} />
        <span className={`flex-1 text-left truncate ${selected ? "font-medium text-zinc-700" : "text-zinc-400 font-normal"}`}>
          {selected ? selected.label : placeholder}
        </span>
        {selected && (
          <span
            role="button"
            onClick={e => { e.stopPropagation(); handleSelect(""); }}
            className="text-zinc-300 hover:text-zinc-500 transition-colors"
          >
            <X size={12} />
          </span>
        )}
        <ChevronDown
          size={12}
          className={`text-zinc-300 shrink-0 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-xl shadow-xl flex flex-col overflow-hidden">
          {/* Search input inside dropdown */}
          <div className={`flex items-center gap-2 px-3 py-2 border-b border-zinc-100`}>
            <Search size={12} className={ac.icon} />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Type to filter..."
              className="flex-1 text-xs text-zinc-600 bg-transparent outline-none placeholder:text-zinc-300"
            />
            {query && (
              <button type="button" onClick={() => setQuery("")}>
                <X size={11} className="text-zinc-300 hover:text-zinc-500" />
              </button>
            )}
          </div>

          {/* Options list */}
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-[11px] text-zinc-400 text-center py-4 italic">No results found.</p>
            ) : (
              filtered.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors flex items-center gap-2 ${
                    opt.value === value
                      ? `${ac.highlight} font-bold`
                      : "text-zinc-600 hover:bg-zinc-50"
                  }`}
                >
                  {opt.value === value && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="shrink-0">
                      <path d="M2 5L4 7L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                  <span className={opt.value === value ? "" : "pl-3.5"}>{opt.label}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Add / Edit Modal ──────────────────────────────────────────────────────────

interface MenuItemFormProps {
  item?:         MenuItem;
  allItems:      MenuItem[];   // ✅ for combo picker
  categories:    Category[];
  subcategories: SubCategory[];
  sugarLevels:   SugarLevel[]; 
  allAddOns:     AddOnItem[];   // ← add this
  onClose:       () => void;
  onSaved:       (item: MenuItem) => void;
}

const MenuItemForm: React.FC<MenuItemFormProps> = ({ item, allItems, categories, subcategories, sugarLevels, allAddOns, onClose, onSaved }) => {
  const isEdit = !!item;

  const [form, setForm] = useState({
    name:           item?.name           ?? "",
    category_id:    item?.category_id    ? String(item.category_id)    : "",
    subcategory_id: item?.subcategory_id ? String(item.subcategory_id) : "",
    price:          item?.price          ? String(item.price)          : "",
    grab_price:     item?.grab_price     ? String(item.grab_price)     : "0",  // ✅ add
    panda_price:    item?.panda_price    ? String(item.panda_price)    : "0",  // ✅ add
    barcode:        item?.barcode        ?? "",
    is_available:   item?.is_available   ?? true,
  });

const mmFoodOptions = useMemo(() =>
  allItems
    .filter(i => ["food", "wings", "waffle"].includes(i.category_type))
    .map(i => ({ value: String(i.id), label: `${i.name} — ${i.category} (₱${Number(i.price).toFixed(2)})` })),
  [allItems]
);

  // ✅ Combo-specific state
  const [foodItemId,        setFoodItemId]        = useState("");
  const [drinkItemId,       setDrinkItemId]       = useState("");
  const [bundleItemIds,     setBundleItemIds]     = useState<string[]>(["", ""]);
  const [mixMatchFoodId,    setMixMatchFoodId]    = useState("");

  const [options, setOptions] = useState<ItemOptions>({ pearl: false, ice: false });
  // Mix & Match bundle items for edit mode display
  const [mmBundleItems, setMmBundleItems] = useState<{ name: string; quantity: number; size: string }[] | null>(null);
  const [mmBundleLoading, setMmBundleLoading] = useState(false);
  const [selectedSugarLevelIds, setSelectedSugarLevelIds] = useState<number[]>([]);
  const [selectedFoodAddOnIds, setSelectedFoodAddOnIds] = useState<number[]>([]);

// Pre-load Mix & Match bundle components when editing


  // Pre-load existing options when editing a drink
  useEffect(() => {
    if (!isEdit || !item) return;
    const isDrink = ["drink", "combo", "bundle"].includes(item.category_type ?? "");
    if (!isDrink) return;
    fetch(`/api/menu-item-options?menu_item_id=${item.id}`, { headers: authHeaders() })
      .then(r => r.json())
      .then(data => {
        const rows: { option_type: string }[] = data.data ?? [];
        setOptions({
          pearl: rows.some(r => r.option_type === "pearl"),
          ice:   rows.some(r => r.option_type === "ice"),
        });
      })
      .catch(() => {});
  }, [isEdit, item]);

  useEffect(() => {
    if (!isEdit || !item) return;
    const isFoodItem = ["food", "wings", "waffle"].includes(item.category_type ?? "");
    if (!isFoodItem) return;
    fetch(`/api/menu-item-addons?menu_item_id=${item.id}`, { headers: authHeaders() })
      .then(r => r.json())
      .then(data => {
        const rows: { addon_id: number }[] = data.data ?? [];
        setSelectedFoodAddOnIds(rows.map(r => r.addon_id));
      })
      .catch(() => {});
  }, [isEdit, item]);

  useEffect(() => {
    if (!isEdit || !item) return;
    const isDrink = ["drink"].includes(item.category_type ?? "");
    if (!isDrink) return;
    fetch(`/api/menu-item-sugar-levels?menu_item_id=${item.id}`, { headers: authHeaders() })
      .then(r => r.json())
      .then(data => {
        const rows: { sugar_level_id: number }[] = data.data ?? [];
        setSelectedSugarLevelIds(rows.map(r => r.sugar_level_id));
      })
      .catch(() => {});
  }, [isEdit, item]);

  const [errors,   setErrors]   = useState<Record<string, string>>({});
  const [loading,  setLoading]  = useState(false);
  const [apiError, setApiError] = useState("");

  // ✅ Determine if selected category is combo type
  const selectedCategory    = categories.find(c => String(c.id) === form.category_id);
  const isComboCategory        = selectedCategory?.category_type === "combo";
  const isBundleCategory       = selectedCategory?.category_type === "bundle";
  const isMixAndMatchCategory  = Boolean(selectedCategory?.category_type === "mix_and_match");

useEffect(() => {
    if (!isEdit || !item || !isMixAndMatchCategory) return;
    if (!item.category_id || !item.barcode) { setMmBundleItems([]); return; }
    setMmBundleLoading(true);

    Promise.all([
      fetch(`/api/bundles?barcode=${encodeURIComponent(item.barcode)}`, { headers: authHeaders() }).then(r => r.json()),
      fetch(`/api/category-drinks?category_id=${item.category_id}`, { headers: authHeaders() }).then(r => r.json()),
    ])
      .then(([bundleData, drinksData]) => {
        const bundles = Array.isArray(bundleData) ? bundleData : (bundleData.data ?? []);
        const foodItem = bundles.length > 0
          ? (bundles[0].items ?? bundles[0].bundle_items ?? []).find((i: BundleItemRaw) => i.size === 'none')
          : null;

        const drinks: CategoryDrink[] = drinksData.data ?? [];

        setMmBundleItems([
          ...(foodItem ? [{ name: foodItem.custom_name ?? foodItem.name ?? "Food", quantity: 1, size: "none" }] : []),
          ...drinks.map(d => ({ name: d.name, quantity: 1, size: d.size ?? "M" })),
        ]);
      })
      .catch(() => setMmBundleItems([]))
      .finally(() => setMmBundleLoading(false));
    }, [isEdit, item, isMixAndMatchCategory]);

  // Derived display values
const mmDrinkCount = mmBundleItems !== null
  ? mmBundleItems.filter(i => i.size !== 'none').length
  : null;

  // Filter subs based on selected category
  const filteredSubs = subcategories.filter(
    s => !form.category_id || s.category_id === Number(form.category_id)
  );

  // ✅ When category changes, reset sub and combo fields
  const handleCategoryChange = (catId: string) => {
    setForm(p => ({ ...p, category_id: catId, subcategory_id: "" }));
    setFoodItemId("");
    setDrinkItemId("");
    setBundleItemIds(["", ""]);
    setMixMatchFoodId("");
    setErrors(ev => { const n = { ...ev }; delete n.category_id; delete n.food_item_id; delete n.drink_item_id; return n; });
  };

const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim())        e.name        = "Name is required.";
    if (!form.category_id)        e.category_id = "Category is required.";
    if (!form.barcode.trim())     e.barcode     = "Barcode is required.";
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) < 0)
      e.price = "Valid price is required.";
    if (isComboCategory && !isEdit) {
      if (!foodItemId)  e.food_item_id  = "Select a food item for this combo.";
      if (!drinkItemId) e.drink_item_id = "Select a drink item for this combo.";
    }
    if (isMixAndMatchCategory && !isEdit) {
      if (!mixMatchFoodId) e.food_item_id = "Select a food item for this Mix & Match.";
    }
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true); setApiError("");

    try {
      // Step 1: Create/update the menu item
      const payload = {
        name:           form.name,
        category_id:    form.category_id    ? Number(form.category_id)    : null,
        subcategory_id: form.subcategory_id ? Number(form.subcategory_id) : null,
        price:          Number(form.price),
        grab_price:     Number(form.grab_price)  || 0,
        panda_price:    Number(form.panda_price) || 0,
        barcode:        form.barcode || null,
        is_available:   form.is_available,
      };
      const url    = isEdit ? `/api/menu-items/${item!.id}` : "/api/menu-items";
      const method = isEdit ? "PUT" : "POST";
      const res    = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(payload) });
      const data   = await res.json();

      if (!res.ok || !data.success) {
        if (data.errors) {
          const mapped: Record<string, string> = {};
          Object.entries(data.errors).forEach(([k, v]) => { mapped[k] = Array.isArray(v) ? v[0] : String(v); });
          setErrors(mapped);
        } else { setApiError(data.message ?? "Something went wrong."); }
        return;
      }

      const savedItem: MenuItem = data.data;

      // Save drink options if applicable
      const isDrinkItem = ["drink"].includes(
        categories.find(c => String(c.id) === form.category_id)?.category_type ?? ""
      );
      if (isDrinkItem) {
        const optList: string[] = [];
        if (options.pearl) optList.push("pearl");
        if (options.ice)   optList.push("ice");
        await fetch(`/api/menu-item-options/${savedItem.id}`, {
          method: "PUT", headers: authHeaders(),
          body: JSON.stringify({ options: optList }),
        }).catch(() => {});

        await fetch(`/api/menu-item-sugar-levels/${savedItem.id}`, {
          method: "PUT", headers: authHeaders(),
          body: JSON.stringify({ sugar_level_ids: selectedSugarLevelIds }),
        }).catch(() => {});
      }

      // Step 2: If combo (add only), create bundle
      if (isComboCategory && !isEdit) {
        const foodItem  = allItems.find(i => String(i.id) === foodItemId);
        const drinkItem = allItems.find(i => String(i.id) === drinkItemId);
        const bundleRes = await fetch("/api/bundles", {
          method: "POST", headers: authHeaders(),
          body: JSON.stringify({
            name: form.name, category_id: Number(form.category_id),
            bundle_type: "combo", price: Number(form.price),
            barcode: form.barcode || `COMBO-${savedItem.id}`,
            items: [
              { custom_name: foodItem?.name  ?? "Food",  quantity: 1, size: "none", display_name: "Food" },
              { custom_name: drinkItem?.name ?? "Drink", quantity: 1, size: "M",    display_name: "Drink" },
            ],
          }),
        });
        if (!bundleRes.ok) {
          setApiError("Item saved but combo bundle creation failed. Please create the bundle manually.");
          onSaved(savedItem);
          return;
        }
      }

      // Step 2b: If Mix & Match edit and food changed, update the bundle
      if (isMixAndMatchCategory && isEdit && mixMatchFoodId && item?.barcode) {
        const newFoodItem = allItems.find(i => String(i.id) === mixMatchFoodId);
        if (newFoodItem) {
          const bundleData = await fetch(`/api/bundles?barcode=${encodeURIComponent(item.barcode)}`, { headers: authHeaders() }).then(r => r.json());
          const bundles = Array.isArray(bundleData) ? bundleData : (bundleData.data ?? []);
          if (bundles.length > 0) {
            const bundleId = bundles[0].id;
            const existingItems: BundleItemRaw[] = bundles[0].items ?? bundles[0].bundle_items ?? [];
            const drinkItems = existingItems.filter((bi: BundleItemRaw) => bi.size !== 'none');
            await fetch(`/api/bundles/${bundleId}`, {
              method: 'PUT', headers: authHeaders(),
              body: JSON.stringify({
                items: [
                  { custom_name: newFoodItem.name, quantity: 1, size: 'none', display_name: 'Food' },
                  ...drinkItems.map((d: BundleItemRaw) => ({
                    custom_name: d.custom_name ?? d.name ?? 'Drink',
                    quantity: d.quantity ?? 1,
                    size: d.size ?? 'M',
                    display_name: 'Drink',
                  })),
                ],
              }),
            }).catch(() => {});
          }
        }
      }

      // Step 2c: If Mix & Match (add only), create bundle with food + drink pool
      if (isMixAndMatchCategory && !isEdit) {
        const foodItem = allItems.find(i => String(i.id) === mixMatchFoodId);
        const drinkPoolData = await fetch(`/api/category-drinks?category_id=${form.category_id}`, { headers: authHeaders() }).then(r => r.json());
        const categoryDrinks: { menu_item_id: number; name: string; size: string }[] = drinkPoolData.data ?? [];
        const mmBundleRes = await fetch("/api/bundles", {
          method: "POST", headers: authHeaders(),
          body: JSON.stringify({
            name: form.name, category_id: Number(form.category_id),
            bundle_type: "mix_and_match", price: Number(form.price),
            barcode: form.barcode || `MM-${savedItem.id}`,
            items: [
              { custom_name: foodItem?.name ?? "Food", quantity: 1, size: "none", display_name: "Food" },
              ...categoryDrinks.map(d => ({ custom_name: d.name, quantity: 1, size: d.size || "M", display_name: "Drink" })),
            ],
          }),
        });
        if (!mmBundleRes.ok) {
          setApiError("Item saved but Mix & Match bundle creation failed. Please create the bundle manually.");
          onSaved(savedItem);
          return;
        }
      }

      // Step 3: If bundle (add only), create bundle with drink items
      if (isBundleCategory && !isEdit) {
        const bundleRes = await fetch("/api/bundles", {
          method: "POST", headers: authHeaders(),
          body: JSON.stringify({
            name: form.name, category_id: Number(form.category_id),
            bundle_type: "bundle", price: Number(form.price),
            barcode: form.barcode || `BUNDLE-${savedItem.id}`,
            items: bundleItemIds.filter(id => id !== "").map(id => {
              const found = allItems.find(i => String(i.id) === id);
              return { custom_name: found?.name ?? "Item", quantity: 1, size: "L", display_name: found?.name ?? "Item" };
            }),
          }),
        });
        if (!bundleRes.ok) {
          setApiError("Item saved but bundle creation failed. Please create the bundle manually.");
          onSaved(savedItem);
          return;
        }
      }

      // Save food add-ons if applicable
      const isFoodItem = ["food", "wings", "waffle"].includes(
        categories.find(c => String(c.id) === form.category_id)?.category_type ?? ""
      );
      if (isFoodItem) {
        await fetch(`/api/menu-item-addons/${savedItem.id}`, {
          method: "PUT", headers: authHeaders(),
          body: JSON.stringify({ addon_ids: selectedFoodAddOnIds }),
        }).catch(() => {});
      }

      onSaved(savedItem);
      onClose();
    } catch (err) { console.error('submit error:', err); setApiError("Network error. Please try again."); }
    finally { setLoading(false); }
  };

  const f = (key: keyof typeof form) => ({
    value: String(form[key]),
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm(p => ({ ...p, [key]: e.target.value }));
      setErrors(ev => { const n = { ...ev }; delete n[key]; return n; });
    },
  });

  return (
    <ModalShell onClose={onClose}
      icon={<Package size={15} className="text-violet-600" />}
      title={isEdit ? "Edit Menu Item" : "Add Menu Item"}
      sub={isEdit ? `Editing ${item!.name}` : "Add a new item to the menu"}
      footer={
        <>
          <Btn variant="secondary" onClick={onClose} disabled={loading}>Cancel</Btn>
          <Btn onClick={handleSubmit} disabled={loading}>
            {loading
              ? <span className="flex items-center gap-1.5"><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</span>
              : isEdit ? "Save Changes" : <><Plus size={13} /> {isComboCategory ? "Add Combo" : isBundleCategory ? "Add Bundle" : isMixAndMatchCategory ? "Add Mix & Match" : "Add Item"}</>}
          </Btn>
        </>
      }>

      {apiError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle size={14} className="text-red-500 shrink-0" />
          <p className="text-xs text-red-600 font-medium">{apiError}</p>
        </div>
      )}

      {/* Name */}
      <Field label="Item Name" required error={errors.name}>
        <input {...f("name")} placeholder="e.g. Spaghetti & Classic Pearl" className={inputCls(errors.name)} />
      </Field>

      {/* Category + Sub-Category */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Category" required error={errors.category_id}>
          <div className="relative">
            <select
              value={form.category_id}
              onChange={e => handleCategoryChange(e.target.value)}
              className={inputCls(errors.category_id) + " appearance-none pr-8"}>
              <option value="">Select Category</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.category_type === "combo" ? " (Combo)" : c.category_type === "bundle" ? " (Bundle)" : ""}
                </option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          </div>
        </Field>

        <Field label="Sub-Category">
          <div className="relative">
            <select
              value={form.subcategory_id}
              onChange={e => setForm(p => ({ ...p, subcategory_id: e.target.value }))}
              className={inputCls() + " appearance-none pr-8"}
              disabled={!form.category_id || isComboCategory}>
              <option value="">None</option>
              {filteredSubs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          </div>
          {isComboCategory && (
            <p className="text-[10px] text-zinc-400 mt-1">Not used for combos.</p>
          )}
          {!isComboCategory && form.category_id && filteredSubs.length === 0 && (
            <p className="text-[10px] text-zinc-400 mt-1">No sub-categories for this category.</p>
          )}
        </Field>
      </div>

      {/* Price + Barcode */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Price (₱)" required error={errors.price}>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm font-medium">₱</span>
            <input {...f("price")} type="number" min="0" step="0.01" placeholder="0.00"
              className={inputCls(errors.price) + " pl-7"} />
          </div>
        </Field>
        <Field label="Barcode" required error={errors.barcode}>
          <div className="relative">
            <input {...f("barcode")} placeholder="Required" className={inputCls(errors.barcode) + " pl-9"} />
            <Barcode size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          </div>
        </Field>
      </div>

      {/* ✅ ADD THIS — Delivery surcharge fields */}
      <div>
        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2 block">
          Delivery Surcharge <span className="text-zinc-300 font-medium normal-case">(added on top of base price)</span>
        </label>
        <div className="grid grid-cols-2 gap-3">

          {/* Grab surcharge */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="w-6 h-6 bg-green-500 rounded-md flex items-center justify-center shrink-0">
                <span className="text-white text-[9px] font-black">G</span>
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold text-green-700 uppercase tracking-wider leading-none">Grab</p>
                <p className="text-[9px] text-green-500 mt-0.5">+₱ surcharge</p>
              </div>
              <div className="relative w-20">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-green-500 text-xs font-bold">+₱</span>
                <input
                  type="number" min="0" step="0.01" placeholder="0"
                  value={form.grab_price}
                  onChange={e => {
                    setForm(p => ({ ...p, grab_price: e.target.value }));
                    setErrors(ev => { const n = { ...ev }; delete n.grab_price; return n; });
                  }}
                  className="w-full bg-white border border-green-200 rounded-md pl-7 pr-2 py-1.5 text-xs font-bold text-zinc-700 outline-none focus:ring-2 focus:ring-green-400 text-right"
                />
              </div>
            </div>
          </div>

          {/* Panda surcharge */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 p-3 bg-pink-50 border border-pink-200 rounded-lg">
              <div className="w-6 h-6 bg-pink-500 rounded-md flex items-center justify-center shrink-0">
                <span className="text-white text-[9px] font-black">P</span>
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold text-pink-700 uppercase tracking-wider leading-none">Panda</p>
                <p className="text-[9px] text-pink-500 mt-0.5">+₱ surcharge</p>
              </div>
              <div className="relative w-20">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-pink-500 text-xs font-bold">+₱</span>
                <input
                  type="number" min="0" step="0.01" placeholder="0"
                  value={form.panda_price}
                  onChange={e => {
                    setForm(p => ({ ...p, panda_price: e.target.value }));
                    setErrors(ev => { const n = { ...ev }; delete n.panda_price; return n; });
                  }}
                  className="w-full bg-white border border-pink-200 rounded-md pl-7 pr-2 py-1.5 text-xs font-bold text-zinc-700 outline-none focus:ring-2 focus:ring-pink-400 text-right"
                />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ✅ Combo Builder — only shows when combo category is selected */}
      {isComboCategory && !isEdit && (
        <ComboBuilder
          allItems={allItems}
          foodItemId={foodItemId}
          drinkItemId={drinkItemId}
          onFoodChange={setFoodItemId}
          onDrinkChange={setDrinkItemId}
          errors={errors}
        />
      )}

      {/* ✅ Info note when editing a combo */}
      {isComboCategory && isEdit && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs font-bold text-amber-700 mb-0.5">Editing a combo item</p>
          <p className="text-[10px] text-amber-600">To change the food or drink components, edit the bundle directly from the Bundles tab.</p>
        </div>
      )}

      {/* ✅ Bundle Builder — only shows when bundle category is selected */}
      {isBundleCategory && !isEdit && (
        <BundleBuilder
          allItems={allItems}
          bundleItemIds={bundleItemIds}
          onItemsChange={setBundleItemIds}
          errors={errors}
        />
      )}

      {/* ✅ Info note when editing a bundle */}
      {isBundleCategory && isEdit && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs font-bold text-amber-700 mb-0.5">Editing a bundle item</p>
          <p className="text-[10px] text-amber-600">To change the bundle components, edit the bundle directly from the Bundles tab.</p>
        </div>
      )}

{/* Mix & Match — food picker + auto-inherit info */}
{isMixAndMatchCategory && !isEdit && (
  <div className="flex flex-col gap-3 p-4 bg-rose-50 border border-rose-200 rounded-xl">
    <div className="flex items-center gap-2 mb-1">
      <div className="w-6 h-6 bg-rose-100 border border-rose-300 rounded-md flex items-center justify-center">
        <Utensils size={11} className="text-rose-600" />
      </div>
      <p className="text-xs font-bold text-rose-700 uppercase tracking-wider">Mix & Match</p>
      <span className="text-[10px] text-rose-400 font-medium">— food + shared drink pool</span>
    </div>

    {/* Food picker */}
<div>
  <label className="text-[10px] font-bold uppercase tracking-wider text-rose-600 mb-1.5 flex items-center gap-1.5">
    <Utensils size={10} /> Food Item <span className="text-red-400">*</span>
  </label>
  <SearchableSelect
    options={mmFoodOptions}
    value={mixMatchFoodId}
    onChange={val => { setMixMatchFoodId(val); setErrors(ev => { const n = { ...ev }; delete n.food_item_id; return n; }); }}
    placeholder="Search food item..."
    error={!!errors.food_item_id}
    accentColor="rose"
  />
  {errors.food_item_id && <p className="text-[10px] text-red-500 mt-1 font-medium">{errors.food_item_id}</p>}
</div>

{/* Drinks auto-inherit notice */}
<div className="flex items-start gap-2 p-2.5 bg-white border border-rose-200 rounded-lg">
  <Coffee size={12} className="text-rose-400 mt-0.5 shrink-0" />
  <div className="flex-1">
    <p className="text-[10px] text-rose-600 leading-relaxed mb-1.5">
      Drinks are <span className="font-bold">automatically inherited</span> from this category's shared drink pool.
    </p>
    <button
      type="button"
      onClick={() => {
        const cat = categories.find(c => String(c.id) === form.category_id);
        if (cat) window.dispatchEvent(new CustomEvent('open-drink-pool', { detail: cat }));
      }}
      className="text-[10px] font-bold text-rose-600 hover:text-rose-800 bg-rose-100 hover:bg-rose-200 px-2.5 py-1 rounded-md transition-colors flex items-center gap-1"
    >
      <Coffee size={10} /> Manage Drink Pool
    </button>
  </div>
</div>
  </div>
)}

{isMixAndMatchCategory && isEdit && (
  <div className="flex flex-col gap-3 p-4 bg-rose-50 border border-rose-200 rounded-xl">
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 bg-rose-100 border border-rose-300 rounded-md flex items-center justify-center">
        <Coffee size={11} className="text-rose-600" />
      </div>
      <p className="text-xs font-bold text-rose-700 uppercase tracking-wider">Mix & Match</p>
      <span className="text-[9px] font-bold text-rose-400 bg-rose-100 border border-rose-200 px-1.5 py-0.5 rounded-full">
        {mmDrinkCount !== null ? `${mmDrinkCount} drinks` : '...'}
      </span>
    </div>

    {/* Food picker in edit mode */}
    <div>
      <label className="text-[10px] font-bold uppercase tracking-wider text-rose-600 mb-1.5 flex items-center gap-1.5">
        <Utensils size={10} /> Food Item
      </label>
      <div className="relative">
        <select
          value={mixMatchFoodId}
          onChange={e => setMixMatchFoodId(e.target.value)}
          className="w-full text-sm font-medium text-zinc-700 bg-white border border-rose-200 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-rose-400 transition-all appearance-none pr-8"
        >
          <option value="">
            {mmBundleItems?.[0]?.name ?? "Keep current food item"}
          </option>
          {allItems.filter(i => ["food", "wings", "waffle"].includes(i.category_type)).map(i => (
            <option key={i.id} value={i.id}>
              {i.name} — {i.category} (₱{Number(i.price).toFixed(2)})
            </option>
          ))}
        </select>
        <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
      </div>
      <p className="text-[9px] text-rose-400 mt-1">Leave blank to keep the current food item.</p>
    </div>

    {mmBundleLoading && (
      <div className="grid grid-cols-2 gap-1.5">
        {[...Array(4)].map((_, i) => <div key={i} className="h-8 bg-rose-100 rounded-lg animate-pulse" />)}
      </div>
    )}

{!mmBundleLoading && mmBundleItems !== null && mmBundleItems.filter(i => i.size !== 'none').length > 0 && (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-px bg-rose-200" />
          <span className="text-[9px] font-bold text-rose-400">
            {mmBundleItems.filter(i => i.size !== 'none').length} drinks in pool
          </span>
          <div className="flex-1 h-px bg-rose-200" />
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {mmBundleItems.filter(i => i.size !== 'none').map((drink, idx) => (
            <div key={idx} className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg border bg-white border-rose-200">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[10px] font-semibold text-zinc-700 truncate">{drink.name}</span>
                {drink.size !== "none" && drink.size !== "—" && (
                  <span className="text-[9px] font-bold text-rose-400 uppercase">{drink.size}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

    <p className="text-[10px] text-rose-500 font-medium leading-tight">
      To update the drink pool for all items in this category, use the <span className="font-bold">Manage Drinks</span> button on the menu list.
    </p>
  </div>
)}
      {/* Drink Options + Sugar Levels — only for drink category */}
      {["drink"].includes(selectedCategory?.category_type ?? "") && (
        <>
          <OptionsToggle value={options} onChange={setOptions} />
          <SugarLevelToggle
            allLevels={sugarLevels}
            selected={selectedSugarLevelIds}
            onChange={setSelectedSugarLevelIds}
          />
        </>
      )}

      {/* Food Add-Ons — only for food/wings/waffle category */}
      {["food", "wings", "waffle"].includes(selectedCategory?.category_type ?? "") && (
        <FoodAddOnsToggle
          allAddOns={allAddOns}
          selected={selectedFoodAddOnIds}
          onChange={setSelectedFoodAddOnIds}
        />
      )}

      <div className="flex items-center justify-between p-3 bg-zinc-50 border border-zinc-200 rounded-lg">
        <div>
          <p className="text-xs font-bold text-zinc-700">Available on POS</p>
          <p className="text-[10px] text-zinc-400">Toggle off to hide from cashier view</p>
        </div>
        <button type="button" onClick={() => setForm(p => ({ ...p, is_available: !p.is_available }))}
          className="transition-colors">
          {form.is_available
            ? <ToggleRight size={28} className="text-[#3b2063]" />
            : <ToggleLeft  size={28} className="text-zinc-300"  />}
        </button>
      </div>
    </ModalShell>
  );
};

// ── Delete Modal ──────────────────────────────────────────────────────────────
const DeleteModal: React.FC<{ item: MenuItem; onClose: () => void; onDeleted: (id: number) => void }> = ({ item, onClose, onDeleted }) => {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const handleDelete = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/menu-items/${item.id}`, { method: "DELETE", headers: authHeaders() });
      const data = await res.json();
      if (!res.ok || !data.success) { setError(data.message ?? "Failed to delete."); return; }
      onDeleted(item.id); onClose();
    } catch { setError("Network error."); }
    finally { setLoading(false); }
  };
  return createPortal(
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-6"
      style={{ backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", backgroundColor: "rgba(0,0,0,0.45)" }}>
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white w-full max-w-sm border border-zinc-200 rounded-[1.25rem] shadow-2xl">
        <div className="flex flex-col items-center text-center px-6 pt-8 pb-5">
          <div className="w-14 h-14 bg-red-50 border border-red-200 rounded-full flex items-center justify-center mb-4">
            <Trash2 size={22} className="text-red-500" />
          </div>
          <p className="text-base font-bold text-[#1a0f2e]">Delete Menu Item?</p>
          <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
            Permanently delete <span className="font-bold text-zinc-700">{item.name}</span>. This cannot be undone.
          </p>
          {error && <div className="mt-3 p-2.5 w-full bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-medium">{error}</div>}
        </div>
        <div className="flex gap-2 px-6 pb-6">
          <Btn variant="secondary" className="flex-1 justify-center" onClick={onClose} disabled={loading}>Cancel</Btn>
          <Btn variant="danger"    className="flex-1 justify-center" onClick={handleDelete} disabled={loading}>
            {loading
              ? <span className="flex items-center gap-1.5"><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Deleting...</span>
              : <><Trash2 size={13} /> Delete</>}
          </Btn>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ── Add-On Builder Modal ──────────────────────────────────────────────────────

interface AddOnItem {
  id:         number;
  name:       string;
  price:      number;
  grab_price: number;
  panda_price: number;
  category:   string;
  is_available: boolean;
}

interface AddOnBuilderModalProps {
  onClose: () => void;
}

// ── Delete Add-On Confirmation Modal ─────────────────────────────────────────
interface DeleteAddOnModalProps {
  addon:     AddOnItem;
  onClose:   () => void;
  onDeleted: (id: number) => void;
}

const DeleteAddOnModal: React.FC<DeleteAddOnModalProps> = ({ addon, onClose, onDeleted }) => {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/add-ons/${addon.id}`, { method: "DELETE", headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) { setError(data.message ?? "Failed to delete."); return; }
      onDeleted(addon.id);
      onClose();
    } catch { setError("Network error."); }
    finally { setLoading(false); }
  };

  return createPortal(
    <div className="fixed inset-0 z-10000 flex items-center justify-center p-6"
      style={{ backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", backgroundColor: "rgba(0,0,0,0.45)" }}>
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white w-full max-w-sm border border-zinc-200 rounded-[1.25rem] shadow-2xl">
        <div className="flex flex-col items-center text-center px-6 pt-8 pb-5">
          <div className="w-14 h-14 bg-red-50 border border-red-200 rounded-full flex items-center justify-center mb-4">
            <Trash2 size={22} className="text-red-500" />
          </div>
          <p className="text-base font-bold text-[#1a0f2e]">Delete Add-On?</p>
          <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
            Permanently delete <span className="font-bold text-zinc-700">{addon.name}</span>.
          </p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-violet-50 text-violet-700 border border-violet-200">
              {addon.category}
            </span>
            <span className="text-[10px] font-bold text-zinc-500">
              ₱{Number(addon.price).toFixed(2)} base price
            </span>
          </div>
          <p className="mt-3 px-3 py-2 w-full bg-amber-50 border border-amber-200 rounded-lg text-[10px] text-amber-700 font-medium leading-relaxed">
            This cannot be undone. Any cashier sessions using this add-on may be affected.
          </p>
          {error && (
            <div className="mt-2 p-2.5 w-full bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-medium">
              {error}
            </div>
          )}
        </div>
        <div className="flex gap-2 px-6 pb-6">
          <Btn variant="secondary" className="flex-1 justify-center" onClick={onClose} disabled={loading}>Cancel</Btn>
          <Btn variant="danger"    className="flex-1 justify-center" onClick={handleDelete} disabled={loading}>
            {loading
              ? <span className="flex items-center gap-1.5"><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Deleting...</span>
              : <><Trash2 size={13} /> Delete Add-On</>}
          </Btn>
        </div>
      </div>
    </div>,
    document.body
  );
};

const AddOnBuilderModal: React.FC<AddOnBuilderModalProps> = ({ onClose }) => {
  const [addOns,   setAddOns]   = useState<AddOnItem[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [deleting] = useState<number | null>(null);
  const [error,    setError]    = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "drink" | "food" | "waffle" | "other">("all");

  // Form state for new / editing
  const blank = () => ({ name: "", price: "", grab_price: "0", panda_price: "0", category: "drink", is_available: true });
  const [form,       setForm]       = useState(blank());
  const [editingId,  setEditingId]  = useState<number | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<AddOnItem | null>(null);

  // Fetch all add-ons (including unavailable so admin can manage them)
  const fetchAddOns = async () => {
    setLoading(true); setError("");
    try {
      const res  = await fetch("/api/add-ons?all=1", { headers: authHeaders() });
      const data = await res.json();
      setAddOns(Array.isArray(data) ? data : (data.data ?? []));
    } catch { setError("Failed to load add-ons."); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAddOns(); }, []);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim())                                       e.name  = "Name is required.";
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) < 0) e.price = "Valid price required.";
    if (!form.category.trim())                                   e.category = "Category is required.";
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setFormErrors(e); return; }
    setSaving(true); setError("");
    try {
      const payload = {
        name:        form.name.trim(),
        price:       Number(form.price),
        grab_price:  Number(form.grab_price)  || 0,
        panda_price: Number(form.panda_price) || 0,
        category:    form.category.trim(),
        is_available: form.is_available,
      };
      const url    = editingId ? `/api/add-ons/${editingId}` : "/api/add-ons";
      const method = editingId ? "PUT" : "POST";
      const res    = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(payload) });
      const data   = await res.json();
      if (!res.ok) { setError(data.message ?? "Failed to save."); return; }
      await fetchAddOns();
      setForm(blank());
      setEditingId(null);
      setFormErrors({});
    } catch { setError("Network error."); }
    finally { setSaving(false); }
  };

  const handleEdit = (addon: AddOnItem) => {
    setEditingId(addon.id);
    setForm({
      name:        addon.name,
      price:       String(addon.price),
      grab_price:  String(addon.grab_price),
      panda_price: String(addon.panda_price),
      category:    addon.category,
      is_available: addon.is_available,
    });
    setFormErrors({});
  };


  const cancelEdit = () => { setEditingId(null); setForm(blank()); setFormErrors({}); };

  const fi = (key: keyof typeof form) => ({
    value: String(form[key]),
    onChange: (ev: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm(p => ({ ...p, [key]: ev.target.value }));
      setFormErrors(p => { const n = { ...p }; delete n[key]; return n; });
    },
  });

  return (
    <ModalShell
      onClose={onClose}
      icon={<Plus size={15} className="text-violet-600" />}
      title="Add-On Builder"
      sub="Manage cashier add-on options"
      maxWidth="max-w-2xl"
      footer={
        <Btn variant="secondary" onClick={onClose}>Close</Btn>
      }
    >
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle size={14} className="text-red-500 shrink-0" />
          <p className="text-xs text-red-600 font-medium">{error}</p>
        </div>
      )}

      {/* ── Form ── */}
      <div className="p-4 bg-violet-50 border border-violet-200 rounded-xl flex flex-col gap-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-violet-600">
          {editingId ? "✏ Editing Add-On" : "＋ New Add-On"}
        </p>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Name" required error={formErrors.name}>
            <input {...fi("name")} placeholder="e.g. Extra Pearl" className={inputCls(formErrors.name)} />
          </Field>
          <Field label="Category" required error={formErrors.category}>
            <div className="relative">
              <select {...fi("category")} className={inputCls(formErrors.category) + " appearance-none pr-8"}>
                <option value="drink">Drink</option>
                <option value="waffle">Waffle</option>
                <option value="food">Food</option>
                <option value="other">Other</option>
              </select>
              <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            </div>
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {/* Base price */}
          <Field label="Base Price (₱)" required error={formErrors.price}>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm font-medium">₱</span>
              <input {...fi("price")} type="number" min="0" step="0.01" placeholder="0.00"
                className={inputCls(formErrors.price) + " pl-7"} />
            </div>
          </Field>

          {/* Grab surcharge */}
          <Field label="Grab Price (₱)">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500 text-xs font-bold">G</span>
              <input {...fi("grab_price")} type="number" min="0" step="0.01" placeholder="0.00"
                className={inputCls() + " pl-7"} />
            </div>
          </Field>

          {/* Panda surcharge */}
          <Field label="Panda Price (₱)">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-500 text-xs font-bold">P</span>
              <input {...fi("panda_price")} type="number" min="0" step="0.01" placeholder="0.00"
                className={inputCls() + " pl-7"} />
            </div>
          </Field>
        </div>

        {/* Available toggle */}
        <div className="flex items-center justify-between p-3 bg-white border border-violet-200 rounded-lg">
          <div>
            <p className="text-xs font-bold text-zinc-700">Available at cashier</p>
            <p className="text-[10px] text-zinc-400">Toggle off to hide from POS</p>
          </div>
          <button type="button" onClick={() => setForm(p => ({ ...p, is_available: !p.is_available }))}>
            {form.is_available
              ? <ToggleRight size={26} className="text-[#3b2063]" />
              : <ToggleLeft  size={26} className="text-zinc-300"  />}
          </button>
        </div>

        <div className="flex items-center gap-2 justify-end">
          {editingId && (
            <Btn variant="secondary" onClick={cancelEdit} disabled={saving}>Cancel</Btn>
          )}
          <Btn onClick={handleSave} disabled={saving}>
            {saving
              ? <span className="flex items-center gap-1.5"><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</span>
              : editingId ? "Save Changes" : <><Plus size={13} /> Add Add-On</>}
          </Btn>
        </div>
      </div>

      {/* ── List ── */}
      <div className="flex flex-col gap-1.5">
<div className="flex items-center justify-between mb-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            All Add-Ons ({addOns.length})
          </p>
          <Btn variant="ghost" size="sm" onClick={fetchAddOns} disabled={loading}>
            <RefreshCw size={11} className={loading ? "animate-spin" : ""} /> Refresh
          </Btn>
        </div>

        {/* ── Category tabs ── */}
        <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-lg">
          {(["all", "drink", "food", "waffle", "other"] as const).map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilterTab(tab)}
              className={`flex-1 px-2 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
                filterTab === tab
                  ? "bg-white text-zinc-700 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-600"
              }`}
            >
              {tab === "all" ? `All (${addOns.length})` : `${tab} (${addOns.filter(a => a.category === tab).length})`}
            </button>
          ))}
        </div>

        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="h-12 bg-zinc-100 rounded-lg animate-pulse" />
          ))
        ) : addOns.length === 0 ? (
          <p className="text-xs text-zinc-400 text-center py-6 italic">No add-ons yet. Add one above.</p>
        ) : (
          addOns
            .filter(a => filterTab === "all" || a.category === filterTab)
            .map(addon => (
            <div
              key={addon.id}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all ${
                editingId === addon.id
                  ? "bg-violet-50 border-violet-300"
                  : "bg-white border-zinc-200 hover:border-zinc-300"
              }`}
            >
              {/* Availability dot */}
              <div className={`w-2 h-2 rounded-full shrink-0 ${addon.is_available ? "bg-emerald-400" : "bg-zinc-300"}`} />

              {/* Name + category */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-zinc-700 truncate">{addon.name}</p>
                <p className="text-[10px] text-zinc-400 capitalize">{addon.category}</p>
              </div>

              {/* Prices */}
              <div className="flex items-center gap-2 shrink-0 text-[10px] font-bold">
                <span className="text-zinc-600">₱{Number(addon.price).toFixed(2)}</span>
                {Number(addon.grab_price) > 0 && (
                  <span className="text-green-600 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-full">
                    G ₱{Number(addon.grab_price).toFixed(2)}
                  </span>
                )}
                {Number(addon.panda_price) > 0 && (
                  <span className="text-pink-600 bg-pink-50 border border-pink-200 px-1.5 py-0.5 rounded-full">
                    P ₱{Number(addon.panda_price).toFixed(2)}
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleEdit(addon)}
                  className="p-1.5 hover:bg-violet-100 rounded-md text-zinc-400 hover:text-violet-600 transition-colors"
                  title="Edit"
                >
                  <Edit2 size={12} />
                </button>
                <button
                  onClick={() => setDeleteTarget(addon)}
                  disabled={false}
                  className="p-1.5 hover:bg-red-50 rounded-md text-zinc-400 hover:text-red-500 transition-colors disabled:opacity-40"
                  title="Delete"
                >
                  {deleting === addon.id
                    ? <div className="w-3 h-3 border-2 border-zinc-300 border-t-red-400 rounded-full animate-spin" />
                    : <Trash2 size={12} />}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    {deleteTarget && (
        <DeleteAddOnModal
          addon={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={id => {
            setAddOns(prev => prev.filter(a => a.id !== id));
            if (editingId === id) { setEditingId(null); setForm(blank()); }
            setDeleteTarget(null);
          }}
        />
      )}
    </ModalShell>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const MenuItemsTab: React.FC = () => {
  const [items,         setItems]         = useState<MenuItem[]>([]);
  const [categories,    setCategories]    = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState("");
  const [search,        setSearch]        = useState("");
  const [filterCat,     setFilterCat]     = useState("");
  const [filterAvail,   setFilterAvail]   = useState("");
  const [filterType,    setFilterType]    = useState("");
  const [addOpen,       setAddOpen]       = useState(false);
  const [editTarget,    setEditTarget]    = useState<MenuItem | null>(null);
  const [delTarget,     setDelTarget]     = useState<MenuItem | null>(null);
  const [bundleInfo, setBundleInfo] = useState<Record<number, { name: string; quantity: number; size: string }[]>>({});
  const [itemOptions, setItemOptions] = useState<Record<number, ItemOptions>>({});
  const [drinkPoolTarget, setDrinkPoolTarget] = useState<Category | null>(null);
  const [sugarLevels, setSugarLevels] = useState<SugarLevel[]>([]);
  const [addOnBuilderOpen, setAddOnBuilderOpen] = useState(false);
  const [allAddOns, setAllAddOns] = useState<AddOnItem[]>([]);

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
      const [itemsRes, catsRes, subsRes, sugarRes, addOnsRes] = await Promise.all([
        fetch("/api/menu-items",     { headers: authHeaders() }),
        fetch("/api/categories",     { headers: authHeaders() }),
        fetch("/api/sub-categories", { headers: authHeaders() }),
        fetch("/api/sugar-levels",   { headers: authHeaders() }),
        fetch("/api/add-ons?all=1",  { headers: authHeaders() }),
      ]);
      const [itemsData, catsData, subsData, sugarData, addOnsData] = await Promise.all([
        itemsRes.json(), catsRes.json(), subsRes.json(), sugarRes.json(), addOnsRes.json(),
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

      const rawSubs = Array.isArray(subsData) ? subsData : (subsData.data ?? []);
      setSubcategories(rawSubs.map((s: SubCategory) => ({
        id:          s.id,
        name:        s.name,
        category_id: s.category_id,
      })));

      setSugarLevels(
        (Array.isArray(sugarData) ? sugarData : (sugarData.data ?? []))
          .filter((s: SugarLevel) => s.is_active)
      );

      setAllAddOns(Array.isArray(addOnsData) ? addOnsData : (addOnsData.data ?? [])); // ← add here

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

  const fetchBundleItems = useCallback(async (itemId: number, categoryType: string, barcode: string | null) => {
    if (bundleInfo[itemId] !== undefined || !["combo", "bundle"].includes(categoryType) || !barcode) return;
    try {
      const res  = await fetch(`/api/bundles?barcode=${encodeURIComponent(barcode)}`, { headers: authHeaders() });
      const data = await res.json();
      const bundles = Array.isArray(data) ? data : (data.data ?? []);
      if (bundles.length > 0) {
        const rawItems = bundles[0].items ?? bundles[0].bundle_items ?? [];
        setBundleInfo(prev => ({
          ...prev,
          [itemId]: rawItems.map((i: BundleItemRaw) => ({
            name:     i.custom_name ?? i.name ?? "—",
            quantity: i.quantity    ?? 1,
            size:     i.size        ?? "—",
          })),
        }));
      } else {
        setBundleInfo(prev => ({ ...prev, [itemId]: [] }));
      }
    } catch { setBundleInfo(prev => ({ ...prev, [itemId]: [] })); }
  }, [bundleInfo]);

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
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h2 className="text-base font-bold text-[#1a0f2e]">Menu List</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            {loading ? "Loading..." : `${items.length} items · ${items.filter(i => i.is_available).length} available`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Btn variant="secondary" onClick={fetchAll} disabled={loading}>
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
          </Btn>
          {/* Show "Manage Drinks" when filtered to a mix_and_match category */}
          {filterType === "mix_and_match" && filterCat && categories.find(c => String(c.id) === filterCat) && (
            <Btn variant="secondary" onClick={() => setDrinkPoolTarget(categories.find(c => String(c.id) === filterCat)!)}>
              <Coffee size={13} /> Manage Drinks
            </Btn>
          )}
          <Btn onClick={() => startTransition(() => setAddOpen(true))} disabled={loading}>
            <Plus size={13} /> Add Item
          </Btn>
          <Btn variant="secondary" onClick={() => setAddOnBuilderOpen(true)} disabled={loading}>
            <Plus size={13} /> Add-Ons
          </Btn>
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
        <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-100 flex-wrap">
          <div className="flex-1 min-w-48 flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2">
            <Search size={13} className="text-zinc-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm text-zinc-700 outline-none placeholder:text-zinc-400"
              placeholder="Search items or barcode..." />
            {search && <button onClick={() => setSearch("")} className="text-zinc-300 hover:text-zinc-500"><X size={12} /></button>}
          </div>
          <div className="relative">
            <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
              className="appearance-none text-xs font-bold text-zinc-600 bg-white border border-zinc-200 rounded-lg pl-3 pr-8 py-2 outline-none focus:ring-2 focus:ring-violet-400 cursor-pointer">
              <option value="">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          </div>
          <div className="relative">
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            className="appearance-none text-xs font-bold text-zinc-600 bg-white border border-zinc-200 rounded-lg pl-3 pr-8 py-2 outline-none focus:ring-2 focus:ring-violet-400 cursor-pointer">
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
          <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
        </div>
          <div className="relative">
            <select value={filterAvail} onChange={e => setFilterAvail(e.target.value)}
              className="appearance-none text-xs font-bold text-zinc-600 bg-white border border-zinc-200 rounded-lg pl-3 pr-8 py-2 outline-none focus:ring-2 focus:ring-violet-400 cursor-pointer">
              <option value="">All Status</option>
              <option value="true">Available</option>
              <option value="false">Unavailable</option>
            </select>
            <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          </div>
          {(filterCat || filterAvail || filterType) && (   // ✅ add filterType
            <button onClick={() => { setFilterCat(""); setFilterAvail(""); setFilterType(""); }}
              className="text-xs font-bold text-zinc-400 hover:text-red-500 flex items-center gap-1 transition-colors">
              <X size={11} /> Clear
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100">
                {["Item", "Category", "Type", "Sub-Category", "Price", "Barcode", "Options", "Sugar Levels", "Available", "Actions"].map(h => (
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
<td className="px-5 py-3.5">
  <div className="flex items-center gap-1">

    {/* ✅ Info popover for combo/bundle items */}
    {["combo", "bundle"].includes(item.category_type) && (
      <div className="relative group">
        <button
          className="p-1.5 hover:bg-purple-50 rounded-[0.4rem] text-zinc-300 hover:text-purple-500 transition-colors"
          title="View components"
          onMouseEnter={() => fetchBundleItems(item.id, item.category_type, item.barcode)}
        >
          <Info size={13} />
        </button>

        {/* Popover */}
        <div className="absolute bottom-full right-0 mb-2 w-52 bg-white border border-zinc-200 rounded-xl shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 pointer-events-none">
          <div className="px-3 py-2.5 border-b border-zinc-100">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Components</p>
            <p className="text-[9px] text-zinc-400 mt-0.5">{item.name}</p>
          </div>
          <div className="px-3 py-2 flex flex-col gap-1.5">
            {!bundleInfo[item.id] && (
              <p className="text-[10px] text-zinc-400 italic">Loading...</p>
            )}
            {bundleInfo[item.id]?.length === 0 && (
              <p className="text-[10px] text-zinc-400 italic">No components found.</p>
            )}
            {bundleInfo[item.id]?.map((comp, idx) => (
              <div key={idx} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.category_type === "combo" ? (idx === 0 ? "bg-amber-400" : "bg-blue-400") : "bg-violet-400"}`} />
                  <span className="text-[10px] font-semibold text-zinc-700 truncate max-w-27.5">{comp.name}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {comp.size !== "none" && comp.size !== "—" && (
                    <span className="text-[9px] font-bold text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded">{comp.size}</span>
                  )}
                  <span className="text-[9px] font-bold text-zinc-400">×{comp.quantity}</span>
                </div>
              </div>
            ))}
          </div>
          {/* Arrow */}
          <div className="absolute -bottom-1.5 right-3 w-3 h-3 bg-white border-r border-b border-zinc-200 rotate-45" />
        </div>
      </div>
    )}
    {/* Manage Drinks button for mix_and_match items */}
    {item.category_type === "mix_and_match" && (() => {
      const cat = categories.find(c => c.id === item.category_id);
      return cat ? (
        <button
          onClick={() => setDrinkPoolTarget(cat)}
          className="p-1.5 hover:bg-rose-50 rounded-[0.4rem] text-zinc-300 hover:text-rose-500 transition-colors"
          title="Manage drink pool"
        >
          <Coffee size={13} />
        </button>
      ) : null;
    })()}

    <button onClick={() => startTransition(() => setEditTarget(item))}
      className="p-1.5 hover:bg-violet-50 rounded-[0.4rem] text-zinc-400 hover:text-violet-600 transition-colors" title="Edit">
      <Edit2 size={13} />
    </button>
    <button onClick={() => startTransition(() => setDelTarget(item))}
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

        {!loading && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-zinc-50 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
            Showing {filtered.length} of {items.length} items
          </div>
        )}
      </div>

      {/* Modals */}
      {addOpen && (
        <MenuItemForm
          allItems={items}
          categories={categories}
          subcategories={subcategories}
          sugarLevels={sugarLevels}   // ← add
          allAddOns={allAddOns}
          onClose={() => startTransition(() => setAddOpen(false))}
          onSaved={item => { setItems(p => [item, ...p]); setAddOpen(false); }}
        />
      )}
      {editTarget && (
        <MenuItemForm
          item={editTarget}
          allItems={items}
          categories={categories}
          subcategories={subcategories}
          sugarLevels={sugarLevels}   // ← add
          allAddOns={allAddOns} 
          onClose={() => startTransition(() => setEditTarget(null))}
          onSaved={updated => { setItems(p => p.map(i => i.id === updated.id ? updated : i)); setEditTarget(null); }}
        />
      )}
      {delTarget && (
        <DeleteModal item={delTarget} onClose={() => startTransition(() => setDelTarget(null))}
          onDeleted={id => { setItems(p => p.filter(i => i.id !== id)); setDelTarget(null); }} />
      )}
      {drinkPoolTarget && (
        <CategoryDrinksManager
          categoryId={drinkPoolTarget.id}
          categoryName={drinkPoolTarget.name}
          allItems={items}
          onClose={() => setDrinkPoolTarget(null)}
        />
      )}
      {addOnBuilderOpen && (
        <AddOnBuilderModal onClose={() => setAddOnBuilderOpen(false)} />
      )}
    </div>
  );
};

export default MenuItemsTab;