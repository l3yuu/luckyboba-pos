// components/NewSuperAdmin/Tabs/MenuManagement/SubCategoriesTab.tsx
import { useState, useEffect, useCallback } from "react";
import {
  Plus, Edit2, Trash2, AlertCircle,
  X, Layers, ToggleLeft, ToggleRight, Check,
  ChevronDown,
} from "lucide-react";
import { createPortal } from "react-dom";
import { useToast } from "../../../../hooks/useToast";
import { triggerSync } from "../../../../utils/sync";


type VariantKey = "primary" | "secondary" | "danger" | "ghost";
type SizeKey = "sm" | "md" | "lg";

const getToken = () =>
  localStorage.getItem("auth_token") || localStorage.getItem("lucky_boba_token") || "";
const authHeaders = (): Record<string, string> => ({
  "Content-Type": "application/json",
  "Accept": "application/json",
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

interface SubCategory {
  id: number;
  name: string;
  category_id: number;
  category: string;
  item_count: number;
  is_active: boolean;
}
interface Category { id: number; name: string; color?: string; }
interface Cup { id: number; name: string; size_m: string | null; size_l: string | null; code: string; }

// Derive sub-category name options from a cup
const cupToSizes = (cup: Cup): string[] => cup.code.split("/").map(s => s.trim()).filter(Boolean);

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

const SkeletonBar: React.FC<{ h?: string }> = ({ h = "h-4" }) => (
  <div className={`w-full ${h} bg-zinc-100 rounded animate-pulse`} />
);

const inputCls = (err?: string) =>
  `w-full text-sm font-medium text-zinc-700 bg-zinc-50 border rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white transition-all ${err ? "border-red-300 bg-red-50" : "border-zinc-200"}`;

// ── Sub-Category Modal ────────────────────────────────────────────────────────
const SubCategoryModal: React.FC<{
  sub?: SubCategory;
  categories: Category[];
  cups: Cup[];
  onClose: () => void;
  onSaved: (s: SubCategory) => void;
}> = ({ sub, categories, cups, onClose, onSaved }) => {
  const { showToast } = useToast();
  const isEdit = !!sub;
  const [name, setName] = useState(sub?.name ?? "");
  const [categoryId, setCategoryId] = useState(sub?.category_id ? String(sub.category_id) : "");
  const [isActive, setIsActive] = useState(sub?.is_active ?? true);
  const [selectedCup, setSelectedCup] = useState<Cup | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  // When a cup is selected, auto-fill the name from the first size option
  const handleCupChange = (cupId: string) => {
    const cup = cups.find(c => String(c.id) === cupId) ?? null;
    setSelectedCup(cup);
    if (cup) {
      const sizes = cupToSizes(cup);
      setName(sizes[0] ?? "");
    } else {
      setName("");
    }
    setErrors({});
  };

  const sizeOptions = selectedCup ? cupToSizes(selectedCup) : [];

  const handleSubmit = async () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Sub-category name is required.";
    if (!categoryId) e.category_id = "Parent category is required.";
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true); setApiError("");
    try {
      const payload = { name, category_id: Number(categoryId), is_active: isActive };
      const url = isEdit ? `/api/sub-categories/${sub!.id}` : "/api/sub-categories";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) { setApiError(data.message ?? "Something went wrong."); return; }
      const raw = data.data ?? data;
      const parentName = categories.find(c => c.id === Number(categoryId))?.name ?? "—";
      onSaved({ ...raw, category: parentName, item_count: raw.itemCount ?? sub?.item_count ?? 0 });
      try {
        triggerSync();
        showToast(isEdit ? "Sub-category updated successfully" : "Sub-category added successfully", "success");
      } catch (e) { console.error("Broadcast failed:", e); }
      onClose();
    } catch { setApiError("Network error."); }
    finally { setLoading(false); }
  };

  return createPortal(
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-6"
      style={{ backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", backgroundColor: "rgba(0,0,0,0.45)" }}>
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white w-full max-w-sm border border-zinc-200 rounded-[1.25rem] shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-violet-50 border border-violet-200 rounded-lg flex items-center justify-center">
              <Layers size={15} className="text-violet-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#1a0f2e]">{isEdit ? "Edit Sub-Category" : "Add Sub-Category"}</p>
              <p className="text-[10px] text-zinc-400">{isEdit ? `Updating ${sub!.name}` : "Add nested category"}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-zinc-600 transition-colors"><X size={16} /></button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          {apiError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle size={14} className="text-red-500 shrink-0" />
              <p className="text-xs text-red-600 font-medium">{apiError}</p>
            </div>
          )}

          {/* Parent Category */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5 block">
              Parent Category <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <select value={categoryId} onChange={e => { setCategoryId(e.target.value); setErrors({}); }}
                className={inputCls(errors.category_id) + " appearance-none pr-8"}>
                <option value="">Select Parent Category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            </div>
            {errors.category_id && <p className="text-[10px] text-red-500 mt-1 font-medium">{errors.category_id}</p>}
          </div>

          {/* Cup selector — only on Add mode */}
          {!isEdit && (
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5 block">
                Cup Type <span className="text-zinc-300 font-normal normal-case">(auto-fills name)</span>
              </label>
              <div className="relative">
                <select
                  value={selectedCup ? String(selectedCup.id) : ""}
                  onChange={e => handleCupChange(e.target.value)}
                  className={inputCls() + " appearance-none pr-8"}>
                  <option value="">Select Cup (optional)</option>
                  {cups.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} — {c.code}
                    </option>
                  ))}
                </select>
                <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              </div>
              {/* Size chips when a cup is selected */}
              {sizeOptions.length > 0 && (
                <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-zinc-400 font-medium">Pick size:</span>
                  {sizeOptions.map(sz => (
                    <button key={sz} type="button" onClick={() => setName(sz)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${name === sz
                        ? "bg-[#6a12b8] text-white border-[#6a12b8]"
                        : "bg-white text-zinc-600 border-zinc-200 hover:border-violet-300 hover:text-violet-600"
                        }`}>
                      {sz}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sub-Category Name */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5 block">
              Sub-Category Name <span className="text-red-400">*</span>
            </label>
            <input value={name} onChange={e => { setName(e.target.value); setErrors({}); }}
              placeholder="e.g. SM" className={inputCls(errors.name)} />
            {errors.name && <p className="text-[10px] text-red-500 mt-1 font-medium">{errors.name}</p>}
          </div>


          {/* Active toggle */}
          <div className="flex items-center justify-between p-3 bg-zinc-50 border border-zinc-200 rounded-lg">
            <div>
              <p className="text-xs font-bold text-zinc-700">Show on POS</p>
              <p className="text-[10px] text-zinc-400">Toggle off to hide from cashiers</p>
            </div>
            <button type="button" onClick={() => setIsActive(v => !v)}>
              {isActive
                ? <ToggleRight size={28} className="text-[#6a12b8]" />
                : <ToggleLeft size={28} className="text-zinc-300" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-zinc-100">
          <Btn variant="secondary" onClick={onClose} disabled={loading}>Cancel</Btn>
          <Btn onClick={handleSubmit} disabled={loading}>
            {loading ? <span className="flex items-center gap-1.5"><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</span>
              : isEdit ? "Save Changes" : <><Plus size={13} /> Add Sub-Category</>}
          </Btn>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
const SubCategoriesTab: React.FC = () => {
  const { showToast } = useToast();
  const [subs, setSubs] = useState<SubCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cups, setCups] = useState<Cup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SubCategory | null>(null);
  const [delTarget, setDelTarget] = useState<SubCategory | null>(null);
  const [delLoading, setDelLoading] = useState(false);
  const [inlineEdit, setInlineEdit] = useState<number | null>(null);
  const [inlineVal, setInlineVal] = useState("");

  const fetchAll = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [subsRes, catsRes, cupsRes] = await Promise.all([
        fetch("/api/sub-categories", { headers: authHeaders() }),
        fetch("/api/categories", { headers: authHeaders() }),
        fetch("/api/cups", { headers: authHeaders() }),
      ]);
      const [subsData, catsData, cupsData] = await Promise.all([
        subsRes.json(), catsRes.json(), cupsRes.json(),
      ]);

      const rawCats = Array.isArray(catsData) ? catsData : (catsData.data ?? []);
      setCategories(rawCats);
      setCups(Array.isArray(cupsData) ? cupsData : (cupsData.data ?? []));

      const rawSubs = Array.isArray(subsData) ? subsData : (subsData.data ?? []);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setSubs(rawSubs.map((s: any) => ({
        id: s.id,
        name: s.name,
        category_id: s.category_id,
        category: s.mainCategory ?? s.category?.name ?? rawCats.find((c: Category) => c.id === s.category_id)?.name ?? "—",
        item_count: Number(s.itemCount ?? s.item_count ?? 0),
        is_active: s.is_active === 1 || s.is_active === true || s.is_active === "1" || (s.is_active === undefined ? true : false),
      })));
    } catch { setError("Failed to load sub-categories."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const toggleActive = async (sub: SubCategory) => {
    try {
      const res = await fetch(`/api/sub-categories/${sub.id}`, {
        method: "PUT", headers: authHeaders(),
        body: JSON.stringify({ is_active: !sub.is_active }),
      });
      if (res.ok) {
        setSubs(p => p.map(s => s.id === sub.id ? { ...s, is_active: !s.is_active } : s));
        try {
          triggerSync();
          showToast(`Sub-category ${!sub.is_active ? 'enabled' : 'disabled'} successfully`, "success");
        } catch { /* ignore */ }
      }
    } catch { /* silent */ }
  };

  const handleDelete = async (sub: SubCategory) => {
    setDelLoading(true);
    try {
      const res = await fetch(`/api/sub-categories/${sub.id}`, { method: "DELETE", headers: authHeaders() });
      const data = await res.json();
      if (res.ok) {
        setSubs(p => p.filter(s => s.id !== sub.id)); setDelTarget(null);
        try {
          triggerSync();
          showToast("Sub-category deleted successfully", "success");
        } catch { /* ignore */ }
      }
      else setError(data.message ?? "Failed to delete.");
    } catch { setError("Network error."); }
    finally { setDelLoading(false); }
  };

  const saveInline = async (sub: SubCategory) => {
    if (!inlineVal.trim()) { setInlineEdit(null); return; }
    try {
      const res = await fetch(`/api/sub-categories/${sub.id}`, {
        method: "PUT", headers: authHeaders(),
        body: JSON.stringify({ name: inlineVal, category_id: sub.category_id }),
      });
      if (res.ok) {
        setSubs(p => p.map(s => s.id === sub.id ? { ...s, name: inlineVal } : s));
        try {
          triggerSync();
          showToast("Sub-category updated successfully", "success");
        } catch { /* ignore */ }
      }
    } catch { /* silent */ }
    finally { setInlineEdit(null); }
  };

  const filtered = subs.filter(s => !filterCat || String(s.category_id) === filterCat);
  const grouped = categories.reduce((acc, cat) => {
    const children = filtered.filter(s => s.category_id === cat.id);
    if (children.length > 0) acc[cat.id] = { cat, children };
    return acc;
  }, {} as Record<number, { cat: Category; children: SubCategory[] }>);
  const ungrouped = filtered.filter(s => !categories.find(c => c.id === s.category_id));

  const tableHeaders = ["Name", "Parent Category", "Items", "Active", "Actions"];

  const totalItems = subs.reduce((sum, s) => sum + (s.item_count ?? 0), 0);

  return (
    <div className="p-6 md:p-8 fade-in">
      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Total Sub-Cats", value: subs.length, color: "bg-violet-50 border-violet-200 text-violet-600" },
          { label: "Active", value: subs.filter(s => s.is_active).length, color: "bg-emerald-50 border-emerald-200 text-emerald-600" },
          { label: "Inactive", value: subs.filter(s => !s.is_active).length, color: "bg-red-50 border-red-200 text-red-500" },
          { label: "Linked Items", value: totalItems, color: "bg-amber-50 border-amber-200 text-amber-600" },
        ].map((s, i) => (
          <div key={i} className={`border rounded-[0.625rem] px-4 py-3 ${s.color.split(" ").slice(0, 2).join(" ")}`}>
            <p className={`text-xl font-black tabular-nums ${s.color.split(" ")[2]}`}>{loading ? "—" : s.value}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Category filter */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative">
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
            className="appearance-none text-xs font-bold text-zinc-600 bg-white border border-zinc-200 rounded-lg pl-3 pr-8 py-2 outline-none focus:ring-2 focus:ring-violet-400 cursor-pointer">
            <option value="">All Parent Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
        </div>
        {filterCat && (
          <button onClick={() => setFilterCat("")}
            className="text-xs font-bold text-zinc-400 hover:text-red-500 flex items-center gap-1 transition-colors pl-1">
            <X size={11} /> Clear
          </button>
        )}
        <div className="flex items-center gap-3 ml-auto shrink-0 flex-wrap">
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hidden sm:inline-block">
            {filtered.length} sub-categories
          </span>
          <Btn onClick={() => setAddOpen(true)} disabled={loading}>
            <Plus size={13} /> Add Sub-Category
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

      {/* Loading skeleton */}
      {loading && (
        <div className="flex flex-col gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white border border-zinc-200 rounded-[0.625rem] overflow-hidden">
              <div className="px-5 py-3 border-b border-zinc-100"><SkeletonBar h="h-4" /></div>
              {[...Array(3)].map((_, j) => (
                <div key={j} className="px-5 py-4 border-b border-zinc-50 flex gap-4">
                  {[...Array(6)].map((_, k) => <SkeletonBar key={k} h="h-3" />)}
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
                <div className="w-2 h-6 rounded-full bg-[#6a12b8] shrink-0" />
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
                        {inlineEdit === sub.id ? (
                          <div className="flex items-center gap-2">
                            <input autoFocus value={inlineVal} onChange={e => setInlineVal(e.target.value)}
                              onKeyDown={e => { if (e.key === "Enter") saveInline(sub); if (e.key === "Escape") setInlineEdit(null); }}
                              className="text-sm font-medium text-zinc-700 bg-white border border-violet-300 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-violet-400 w-40" />
                            <button onClick={() => saveInline(sub)} className="p-1 bg-emerald-50 hover:bg-emerald-100 rounded text-emerald-600 transition-colors"><Check size={12} /></button>
                            <button onClick={() => setInlineEdit(null)} className="p-1 hover:bg-zinc-100 rounded text-zinc-400 transition-colors"><X size={12} /></button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Layers size={12} className="text-zinc-300 shrink-0" />
                            <span className="font-semibold text-[#1a0f2e] text-xs cursor-pointer hover:text-violet-600 transition-colors"
                              onDoubleClick={() => { setInlineEdit(sub.id); setInlineVal(sub.name); }}
                              title="Double-click to edit inline">
                              {sub.name}
                            </span>
                          </div>
                        )}
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
                        <button onClick={() => toggleActive(sub)} className="transition-colors">
                          {sub.is_active ? <ToggleRight size={22} className="text-[#6a12b8]" /> : <ToggleLeft size={22} className="text-zinc-300" />}
                        </button>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setEditTarget(sub)} className="p-1.5 hover:bg-violet-50 rounded-[0.4rem] text-zinc-400 hover:text-violet-600 transition-colors" title="Edit"><Edit2 size={13} /></button>
                          <button onClick={() => setDelTarget(sub)} className="p-1.5 hover:bg-red-50 rounded-[0.4rem] text-zinc-400 hover:text-red-500 transition-colors" title="Delete"><Trash2 size={13} /></button>
                        </div>
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
                        {sub.item_count > 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-200">{sub.item_count} items</span>
                        ) : <span className="text-[10px] font-medium text-zinc-300">—</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <button onClick={() => toggleActive(sub)}>
                          {sub.is_active ? <ToggleRight size={22} className="text-[#6a12b8]" /> : <ToggleLeft size={22} className="text-zinc-300" />}
                        </button>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setEditTarget(sub)} className="p-1.5 hover:bg-violet-50 rounded-[0.4rem] text-zinc-400 hover:text-violet-600 transition-colors"><Edit2 size={13} /></button>
                          <button onClick={() => setDelTarget(sub)} className="p-1.5 hover:bg-red-50 rounded-[0.4rem] text-zinc-400 hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
                        </div>
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
              <p className="text-base font-bold text-[#1a0f2e]">Delete Sub-Category?</p>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                Permanently delete <span className="font-bold text-zinc-700">{delTarget.name}</span> from <span className="font-bold text-zinc-700">{delTarget.category}</span>.
              </p>
            </div>
            <div className="flex gap-2 px-6 pb-6">
              <Btn variant="secondary" className="flex-1 justify-center" onClick={() => setDelTarget(null)} disabled={delLoading}>Cancel</Btn>
              <Btn variant="danger" className="flex-1 justify-center" onClick={() => handleDelete(delTarget)} disabled={delLoading}>
                {delLoading ? <span className="flex items-center gap-1.5"><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Deleting...</span>
                  : <><Trash2 size={13} /> Delete</>}
              </Btn>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Add / Edit Modal */}
      {addOpen && <SubCategoryModal categories={categories} cups={cups} onClose={() => setAddOpen(false)}
        onSaved={s => { setSubs(p => [s, ...p]); setAddOpen(false); }} />}
      {editTarget && <SubCategoryModal sub={editTarget} categories={categories} cups={cups} onClose={() => setEditTarget(null)}
        onSaved={s => { setSubs(p => p.map(x => x.id === s.id ? s : x)); setEditTarget(null); }} />}
    </div>
  );
};

export default SubCategoriesTab;
