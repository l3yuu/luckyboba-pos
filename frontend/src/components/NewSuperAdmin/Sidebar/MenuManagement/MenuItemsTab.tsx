// components/NewSuperAdmin/Tabs/MenuManagement/MenuItemsTab.tsx
import { useState, useEffect, useCallback } from "react";
import {
  Search, Plus, Edit2, Trash2, RefreshCw,
  AlertCircle, X, Package, ChevronDown,
  ToggleLeft, ToggleRight, Barcode,
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

interface MenuItem {
  id:             number;
  name:           string;
  category_id:    number | null;
  category:       string;
  subcategory_id: number | null;
  subcategory:    string;
  price:          number;
  barcode:        string | null;
  image_path:     string | null;
  is_available:   boolean;
}
interface Category    { id: number; name: string; }
interface SubCategory { id: number; name: string; category_id: number; }

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

// ── Add / Edit Modal ──────────────────────────────────────────────────────────
interface MenuItemFormProps {
  item?: MenuItem;
  categories: Category[];
  subcategories: SubCategory[];
  onClose: () => void;
  onSaved: (item: MenuItem) => void;
}

const MenuItemForm: React.FC<MenuItemFormProps> = ({ item, categories, subcategories, onClose, onSaved }) => {
  const isEdit = !!item;
  const [form, setForm] = useState({
    name:           item?.name           ?? "",
    category_id:    item?.category_id    ? String(item.category_id)    : "",
    subcategory_id: item?.subcategory_id ? String(item.subcategory_id) : "",
    price:          item?.price          ? String(item.price)          : "",
    barcode:        item?.barcode        ?? "",
    is_available:   item?.is_available   ?? true,
  });
  const [errors,   setErrors]   = useState<Record<string, string>>({});
  const [loading,  setLoading]  = useState(false);
  const [apiError, setApiError] = useState("");

  // Filter subs based on selected category
  const filteredSubs = subcategories.filter(
    s => !form.category_id || s.category_id === Number(form.category_id)
  );

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required.";
    if (!form.category_id) e.category_id = "Category is required.";
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) < 0)
      e.price = "Valid price is required.";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true); setApiError("");
    try {
      const payload = {
        name:           form.name,
        category_id:    form.category_id    ? Number(form.category_id)    : null,
        subcategory_id: form.subcategory_id ? Number(form.subcategory_id) : null,
        price:          Number(form.price),
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
      onSaved(data.data);
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
              : isEdit ? "Save Changes" : <><Plus size={13} /> Add Item</>}
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
        <input {...f("name")} placeholder="e.g. Brown Sugar Milk Tea" className={inputCls(errors.name)} />
      </Field>

      {/* Category + Sub-Category */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Category" required error={errors.category_id}>
          <div className="relative">
            <select
              value={form.category_id}
              onChange={e => {
                setForm(p => ({ ...p, category_id: e.target.value, subcategory_id: "" }));
                setErrors(ev => { const n = { ...ev }; delete n.category_id; return n; });
              }}
              className={inputCls(errors.category_id) + " appearance-none pr-8"}>
              <option value="">Select Category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
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
              disabled={!form.category_id}>
              <option value="">None</option>
              {filteredSubs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          </div>
          {form.category_id && filteredSubs.length === 0 && (
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

      {/* Available toggle */}
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
  const [addOpen,       setAddOpen]       = useState(false);
  const [editTarget,    setEditTarget]    = useState<MenuItem | null>(null);
  const [delTarget,     setDelTarget]     = useState<MenuItem | null>(null);

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
        subcategory_id: i.subcategory_id ?? null,
        subcategory:    i.subcategory?.name ?? i.subcategory ?? "—",
        price:          Number(i.price ?? 0),
        barcode:        i.barcode    ?? null,
        image_path:     null,
        is_available:   Boolean(i.is_available ?? true),
      });

      setItems((Array.isArray(itemsData) ? itemsData : (itemsData.data ?? [])).map(mapItem));
      setCategories(Array.isArray(catsData) ? catsData : (catsData.data ?? []));

      const rawSubs = Array.isArray(subsData) ? subsData : (subsData.data ?? []);
      setSubcategories(rawSubs.map((s: SubCategory) => ({
        id:          s.id,
        name:        s.name,
        category_id: s.category_id,
      })));
    } catch { setError("Failed to load menu items."); }
    finally { setLoading(false); }
  }, []);

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
    return matchSearch && matchCat && matchAvail;
  });

  const fmt = (v: number) => `₱${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

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
          { label: "Total Items",  value: items.length,                             color: "bg-violet-50 border-violet-200 text-violet-600"   },
          { label: "Available",    value: items.filter(i => i.is_available).length, color: "bg-emerald-50 border-emerald-200 text-emerald-600" },
          { label: "Unavailable",  value: items.filter(i => !i.is_available).length,color: "bg-red-50 border-red-200 text-red-500"            },
          { label: "Categories",   value: categories.length,                        color: "bg-amber-50 border-amber-200 text-amber-600"      },
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
            <select value={filterAvail} onChange={e => setFilterAvail(e.target.value)}
              className="appearance-none text-xs font-bold text-zinc-600 bg-white border border-zinc-200 rounded-lg pl-3 pr-8 py-2 outline-none focus:ring-2 focus:ring-violet-400 cursor-pointer">
              <option value="">All Status</option>
              <option value="true">Available</option>
              <option value="false">Unavailable</option>
            </select>
            <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          </div>
          {(filterCat || filterAvail) && (
            <button onClick={() => { setFilterCat(""); setFilterAvail(""); }}
              className="text-xs font-bold text-zinc-400 hover:text-red-500 flex items-center gap-1 transition-colors">
              <X size={11} /> Clear
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100">
                {["Item", "Category", "Sub-Category", "Price", "Barcode", "Available", "Actions"].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-zinc-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && [...Array(6)].map((_, i) => (
                <tr key={i} className="border-b border-zinc-50">
                  {[...Array(7)].map((_, j) => (
                    <td key={j} className="px-5 py-4"><SkeletonBar h="h-3" /></td>
                  ))}
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-zinc-400 text-xs font-medium">
                  {search || filterCat || filterAvail ? "No items match your filters." : "No menu items found."}
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
                  <td className="px-5 py-3.5">
                    {item.subcategory !== "—" ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-600 border border-zinc-200">
                        {item.subcategory}
                      </span>
                    ) : <span className="text-zinc-300 text-xs">—</span>}
                  </td>
                  <td className="px-5 py-3.5 font-bold text-[#3b2063] text-xs">{fmt(item.price)}</td>
                  <td className="px-5 py-3.5 text-zinc-400 text-xs font-mono">{item.barcode ?? "—"}</td>
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
        <MenuItemForm categories={categories} subcategories={subcategories}
          onClose={() => setAddOpen(false)}
          onSaved={item => { setItems(p => [item, ...p]); setAddOpen(false); }} />
      )}
      {editTarget && (
        <MenuItemForm item={editTarget} categories={categories} subcategories={subcategories}
          onClose={() => setEditTarget(null)}
          onSaved={updated => { setItems(p => p.map(i => i.id === updated.id ? updated : i)); setEditTarget(null); }} />
      )}
      {delTarget && (
        <DeleteModal item={delTarget} onClose={() => setDelTarget(null)}
          onDeleted={id => { setItems(p => p.filter(i => i.id !== id)); setDelTarget(null); }} />
      )}
    </div>
  );
};

export default MenuItemsTab;