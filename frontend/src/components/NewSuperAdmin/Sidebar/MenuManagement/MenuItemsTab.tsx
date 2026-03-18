// components/NewSuperAdmin/Tabs/MenuManagement/MenuItemsTab.tsx
import { useState, useEffect, useCallback } from "react";
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
  grab_price:     number;   // ✅ add
  panda_price:    number;   // ✅ add
  barcode:        string | null;
  image_path:     string | null;
  is_available:   boolean;
}
interface Category {
  id:            number;
  name:          string;
  category_type: string; // ✅ added
}
interface SubCategory { id: number; name: string; category_id: number; }

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

const ComboBuilder: React.FC<ComboBuilderProps> = ({
  allItems, foodItemId, drinkItemId, onFoodChange, onDrinkChange, errors,
}) => {
const FOOD_TYPES  = ["food", "wings", "waffle"];
const DRINK_TYPES = ["drink"];

const foodItems  = allItems.filter(i => FOOD_TYPES.includes(i.category_type));
const drinkItems = allItems.filter(i => DRINK_TYPES.includes(i.category_type));

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
        <div className="relative">
          <select
            value={foodItemId}
            onChange={e => onFoodChange(e.target.value)}
            className={`w-full text-sm font-medium text-zinc-700 bg-white border rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-purple-400 transition-all appearance-none pr-8 ${errors.food_item_id ? "border-red-300" : "border-purple-200"}`}
          >
            <option value="">Select food item...</option>
            {foodItems.map(i => (
              <option key={i.id} value={i.id}>
                {i.name} — {i.category} (₱{Number(i.price).toFixed(2)})
              </option>
            ))}
          </select>
          <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
        </div>
        {errors.food_item_id && <p className="text-[10px] text-red-500 mt-1 font-medium">{errors.food_item_id}</p>}
      </div>

      {/* Divider */}
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
        <div className="relative">
          <select
            value={drinkItemId}
            onChange={e => onDrinkChange(e.target.value)}
            className={`w-full text-sm font-medium text-zinc-700 bg-white border rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-purple-400 transition-all appearance-none pr-8 ${errors.drink_item_id ? "border-red-300" : "border-purple-200"}`}
          >
            <option value="">Select drink item...</option>
            {drinkItems.map(i => (
              <option key={i.id} value={i.id}>
                {i.name} — {i.category} (₱{Number(i.price).toFixed(2)})
              </option>
            ))}
          </select>
          <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
        </div>
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
  const DRINK_TYPES = ["drink"];
  const drinkItems  = allItems.filter(i => DRINK_TYPES.includes(i.category_type));

  const addSlot    = () => onItemsChange([...bundleItemIds, ""]);
  const removeSlot = (idx: number) => onItemsChange(bundleItemIds.filter((_, i) => i !== idx));
  const setSlot    = (idx: number, val: string) => {
    const next = [...bundleItemIds];
    next[idx]  = val;
    onItemsChange(next);
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
        <button
          type="button"
          onClick={addSlot}
          className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-100 hover:bg-indigo-200 px-2 py-1 rounded-md transition-colors"
        >
          <Plus size={10} /> Add Item
        </button>
      </div>

      {bundleItemIds.length === 0 && (
        <p className="text-[10px] text-indigo-400 italic text-center py-2">
          Click "Add Item" to start building the bundle.
        </p>
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
                <button
                  type="button"
                  onClick={() => removeSlot(idx)}
                  className="text-[9px] font-bold text-red-400 hover:text-red-600 flex items-center gap-0.5 transition-colors"
                >
                  <X size={9} /> Remove
                </button>
              )}
            </label>
            <div className="relative">
              <select
                value={itemId}
                onChange={e => setSlot(idx, e.target.value)}
                className={`w-full text-sm font-medium text-zinc-700 bg-white border rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-400 transition-all appearance-none pr-8 ${errors[`bundle_item_${idx}`] ? "border-red-300" : "border-indigo-200"}`}
              >
                <option value="">Select drink item...</option>
                {drinkItems.map(i => (
                  <option key={i.id} value={i.id}>
                    {i.name} — {i.category} (₱{Number(i.price).toFixed(2)})
                  </option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            </div>
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

// ── Add / Edit Modal ──────────────────────────────────────────────────────────

interface MenuItemFormProps {
  item?:         MenuItem;
  allItems:      MenuItem[];   // ✅ for combo picker
  categories:    Category[];
  subcategories: SubCategory[];
  onClose:       () => void;
  onSaved:       (item: MenuItem) => void;
}

const MenuItemForm: React.FC<MenuItemFormProps> = ({ item, allItems, categories, subcategories, onClose, onSaved }) => {
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

  // ✅ Combo-specific state
  const [foodItemId,  setFoodItemId]  = useState("");
  const [drinkItemId, setDrinkItemId] = useState("");
  const [bundleItemIds, setBundleItemIds] = useState<string[]>(["", ""]);

  const [options, setOptions] = useState<ItemOptions>({ pearl: false, ice: false });

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

  const [errors,   setErrors]   = useState<Record<string, string>>({});
  const [loading,  setLoading]  = useState(false);
  const [apiError, setApiError] = useState("");

  // ✅ Determine if selected category is combo type
  const selectedCategory    = categories.find(c => String(c.id) === form.category_id);
  const isComboCategory     = selectedCategory?.category_type === "combo";
  const isBundleCategory = selectedCategory?.category_type === "bundle";

  // Filter subs based on selected category
  const filteredSubs = subcategories.filter(
    s => !form.category_id || s.category_id === Number(form.category_id)
  );

  // ✅ When category changes, reset sub and combo fields
  const handleCategoryChange = (catId: string) => {
    setForm(p => ({ ...p, category_id: catId, subcategory_id: "" }));
    setFoodItemId("");
    setDrinkItemId("");
    setBundleItemIds(["", ""]);  // ✅ add
    setErrors(ev => { const n = { ...ev }; delete n.category_id; delete n.food_item_id; delete n.drink_item_id; return n; });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim())  e.name        = "Name is required.";
    if (!form.category_id)  e.category_id = "Category is required.";
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) < 0)
      e.price = "Valid price is required.";

    // ✅ Extra validation for combos
    if (isComboCategory) {
      if (!foodItemId)  e.food_item_id  = "Select a food item for this combo.";
      if (!drinkItemId) e.drink_item_id = "Select a drink item for this combo.";
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
          method:  "PUT",
          headers: authHeaders(),
          body:    JSON.stringify({ options: optList }),
        }).catch(() => {});
      }

      // Step 2: If combo, create bundle record linking food + drink
      if (isComboCategory && !isEdit) {
        const foodItem  = allItems.find(i => String(i.id) === foodItemId);
        const drinkItem = allItems.find(i => String(i.id) === drinkItemId);

        const bundlePayload = {
          name:        form.name,
          category_id: Number(form.category_id),
          bundle_type: "combo",
          price:       Number(form.price),
          barcode:     form.barcode || `COMBO-${savedItem.id}`,
          items: [
            {
              custom_name:  foodItem?.name  ?? "Food",
              quantity:     1,
              size:         "none",
              display_name: "Food",
            },
            {
              custom_name:  drinkItem?.name ?? "Drink",
              quantity:     1,
              size:         "M",
              display_name: "Drink",
            },
          ],
        };

        const bundleRes = await fetch("/api/bundles", {
          method:  "POST",
          headers: authHeaders(),
          body:    JSON.stringify(bundlePayload),
        });

        if (!bundleRes.ok) {
          setApiError("Item saved but combo bundle creation failed. Please create the bundle manually.");
          onSaved(savedItem);
          return;
        }
      }

      // Step 3: If bundle category, create bundle record linking all drink items
      if (isBundleCategory && !isEdit) {
        const bundlePayload = {
          name:        form.name,
          category_id: Number(form.category_id),
          bundle_type: "bundle",
          price:       Number(form.price),
          barcode:     form.barcode || `BUNDLE-${savedItem.id}`,
          items:       bundleItemIds
            .filter(id => id !== "")
            .map(id => {
              const found = allItems.find(i => String(i.id) === id);
              return {
                custom_name:  found?.name ?? "Item",
                quantity:     1,
                size:         "L",
                display_name: found?.name ?? "Item",
              };
            }),
        };

        const bundleRes = await fetch("/api/bundles", {
          method:  "POST",
          headers: authHeaders(),
          body:    JSON.stringify(bundlePayload),
        });

        if (!bundleRes.ok) {
          setApiError("Item saved but bundle creation failed. Please create the bundle manually.");
          onSaved(savedItem);
          return;
        }
      }

      onSaved(savedItem);
      onClose();
    } catch { setApiError("Network error. Please try again."); }
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
              : isEdit ? "Save Changes" : <><Plus size={13} /> {isComboCategory ? "Add Combo" : isBundleCategory ? "Add Bundle" : "Add Item"}</>}
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
        <Field label="Barcode">
          <div className="relative">
            <input {...f("barcode")} placeholder="Optional" className={inputCls() + " pl-9"} />
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

      {/* ✅ Drink Options — pearl & ice toggles */}
      {["drink"].includes(selectedCategory?.category_type ?? "") && (
        <OptionsToggle value={options} onChange={setOptions} />
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


  const fetchBundleItems = async (itemId: number, categoryType: string, barcode: string | null) => {
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
  };

  const fetchAll = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [itemsRes, catsRes, subsRes] = await Promise.all([
        fetch("/api/menu-items",     { headers: authHeaders() }),
        fetch("/api/categories",     { headers: authHeaders() }),
        fetch("/api/sub-categories", { headers: authHeaders() }),
      ]);
      const [itemsData, catsData, subsData] = await Promise.all([
        itemsRes.json(), catsRes.json(), subsRes.json(),
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
      fetchAllOptions(mapped); // ✅ fetch drink options right after items are mapped

      setCategories((Array.isArray(catsData) ? catsData : (catsData.data ?? [])).map(mapCat));

      const rawSubs = Array.isArray(subsData) ? subsData : (subsData.data ?? []);
      setSubcategories(rawSubs.map((s: SubCategory) => ({
        id:          s.id,
        name:        s.name,
        category_id: s.category_id,
      })));
    } catch { setError("Failed to load menu items."); }
    finally { setLoading(false); }
  }, [fetchAllOptions]); // ✅ add fetchAllOptions to dependency array

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const toggleAvailable = async (item: MenuItem) => {
    try {
      const res  = await fetch(`/api/menu-items/${item.id}`, {
        method: "PUT", headers: authHeaders(),
        body: JSON.stringify({ is_available: !item.is_available }),
      });
      const data = await res.json();
      if (res.ok && data.success)
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_available: !i.is_available } : i));
    } catch { /* silent */ }
  };

  const filtered = items.filter(i => {
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase()) ||
                        (i.barcode ?? "").toLowerCase().includes(search.toLowerCase());
    const matchCat   = !filterCat   || String(i.category_id) === filterCat;
    const matchAvail = !filterAvail || String(i.is_available) === filterAvail;
    const matchType  = !filterType  || i.category_type === filterType;
    return matchSearch && matchCat && matchAvail && matchType; // ✅ add matchType here
  });

  const fmt = (v: number) => `₱${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  // ✅ Badge for category_type in table
  const catTypeBadge: Record<string, string> = {
    food:    "bg-amber-50 text-amber-700 border-amber-200",
    drink:   "bg-blue-50 text-blue-700 border-blue-200",
    promo:   "bg-emerald-50 text-emerald-700 border-emerald-200",
    wings:   "bg-orange-50 text-orange-700 border-orange-200",
    waffle:  "bg-yellow-50 text-yellow-700 border-yellow-200",
    combo:   "bg-purple-50 text-purple-700 border-purple-200",
    bundle:  "bg-indigo-50 text-indigo-700 border-indigo-200",
  };

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
          <Btn onClick={() => setAddOpen(true)} disabled={loading}>
            <Plus size={13} /> Add Item
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
                {["Item", "Category", "Type", "Sub-Category", "Price", "Barcode", "Options", "Available", "Actions"].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-zinc-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && [...Array(6)].map((_, i) => (
                <tr key={i} className="border-b border-zinc-50">
                  {[...Array(9)].map((_, j) => (
                    <td key={j} className="px-5 py-4"><SkeletonBar h="h-3" /></td>
                  ))}
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={9} className="px-5 py-12 text-center text-zinc-400 text-xs font-medium">
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

    <button onClick={() => setEditTarget(item)}
      className="p-1.5 hover:bg-violet-50 rounded-[0.4rem] text-zinc-400 hover:text-violet-600 transition-colors" title="Edit">
      <Edit2 size={13} />
    </button>
    <button onClick={() => setDelTarget(item)}
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
          onClose={() => setAddOpen(false)}
          onSaved={item => { setItems(p => [item, ...p]); setAddOpen(false); }}
        />
      )}
      {editTarget && (
        <MenuItemForm
          item={editTarget}
          allItems={items}
          categories={categories}
          subcategories={subcategories}
          onClose={() => setEditTarget(null)}
          onSaved={updated => { setItems(p => p.map(i => i.id === updated.id ? updated : i)); setEditTarget(null); }}
        />
      )}
      {delTarget && (
        <DeleteModal item={delTarget} onClose={() => setDelTarget(null)}
          onDeleted={id => { setItems(p => p.filter(i => i.id !== id)); setDelTarget(null); }} />
      )}
    </div>
  );
};

export default MenuItemsTab;