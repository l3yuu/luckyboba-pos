"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Plus, Edit2, Trash2, X, AlertCircle,
  ChevronDown, CheckCircle, BookOpen, FlaskConical, Minus, FileDown
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { createPortal } from 'react-dom';
import api from '../../../../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RecipeItem {
  id: number;
  raw_material_id: number;
  raw_material?: { name: string; unit: string };
  material_name?: string;
  unit?: string;
  quantity: number | '';
  notes?: string;
}

interface Recipe {
  id: number;
  menu_item_id: number;
  menu_item?: { name: string; category?: { name: string } };
  menu_item_name?: string;
  size?: 'M' | 'L' | null;
  is_active: boolean;
  notes?: string;
  items?: RecipeItem[];
  recipe_items?: RecipeItem[];
}

interface RawMaterial { id: number; name: string; unit: string; }
interface RecipeMenuItem { id: number; name: string; category?: string; }

// ─── Helpers ──────────────────────────────────────────────────────────────────

const sizeLabel = (s?: string | null) => {
  if (!s || s === '' || s === 'none') return 'Fixed';
  const mapping: Record<string, string> = {
    'JR': 'Junior (JR)',
    'SM': 'Small (SM)',
    'M': 'Medium (M)',
    'L': 'Large (L)',
    'SL': 'Solo (SL)',
  };
  return mapping[s] || s;
};

const resolveItems = (r: Recipe): RecipeItem[] =>
  (r.items ?? r.recipe_items ?? []).map(i => ({
    ...i,
    material_name: i.raw_material?.name ?? i.material_name ?? '',
    unit: i.raw_material?.unit ?? i.unit ?? '',
  }));

// ─── Shared UI ────────────────────────────────────────────────────────────────

const inputCls = (err?: string) =>
  `w-full text-sm font-medium text-zinc-700 bg-zinc-50 border rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white transition-all ${err ? 'border-red-300 bg-red-50' : 'border-zinc-200'}`;

const Field: React.FC<{ label: string; required?: boolean; error?: string; children: React.ReactNode }> = ({ label, required, error, children }) => (
  <div>
    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5 block">
      {label}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    {children}
    {error && <p className="text-[10px] text-red-500 mt-1 font-medium">{error}</p>}
  </div>
);

// ─── Recipe Form Modal ────────────────────────────────────────────────────────

const RecipeFormModal: React.FC<{
  onClose: () => void;
  onSaved: (r: Recipe) => void;
  editing?: Recipe | null;
}> = ({ onClose, onSaved, editing }) => {
  const [menuItemId, setMenuItemId] = useState<number | ''>(editing?.menu_item_id ?? '');
  const [size, setSize] = useState<string>(editing?.size ?? '');
  const [isActive, setIsActive] = useState(editing?.is_active ?? true);
  const [notes, setNotes] = useState(editing?.notes ?? '');
  const [recipeItems, setRecipeItems] = useState<RecipeItem[]>(resolveItems(editing ?? {} as Recipe));
  const [menuItems, setMenuItems] = useState<RecipeMenuItem[]>([]); // Using RecipeMenuItem[] because m.category is a string here
  const [catFilter, setCatFilter] = useState('');
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiErr, setApiErr] = useState('');

  useEffect(() => {
    Promise.all([api.get('/menu-items'), api.get('/raw-materials')]).then(([mi, rm]) => {
      setMenuItems(Array.isArray(mi.data) ? mi.data : mi.data?.data ?? []);
      setRawMaterials(Array.isArray(rm.data) ? rm.data : rm.data?.data ?? []);
    }).catch(console.error);
  }, []);

  const addRow = () => setRecipeItems(p => [
    ...p,
    { id: Date.now(), raw_material_id: 0, material_name: '', unit: '', quantity: '' },
  ]);

  const removeRow = (idx: number) => setRecipeItems(p => p.filter((_, i) => i !== idx));

  const updateRow = (idx: number, field: keyof RecipeItem, value: unknown) => {
    setRecipeItems(p => p.map((row, i) => {
      if (i !== idx) return row;
      if (field === 'raw_material_id') {
        const mat = rawMaterials.find(m => m.id === Number(value));
        return { ...row, raw_material_id: Number(value), material_name: mat?.name ?? '', unit: mat?.unit ?? '' };
      }
      return { ...row, [field]: value };
    }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!menuItemId) e.menu_item = 'Menu item is required.';
    if (recipeItems.length === 0) e.items = 'At least one ingredient is required.';
    recipeItems.forEach((item, i) => {
      if (!item.raw_material_id) e[`mat_${i}`] = 'Select a material.';
      if (item.quantity === '' || Number(item.quantity) <= 0) e[`qty_${i}`] = 'Enter quantity.';
    });
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true); setApiErr('');
    try {
      const payload = {
        menu_item_id: menuItemId,
        size: size || null,
        is_active: isActive,
        notes,
        items: recipeItems.map(i => ({
          raw_material_id: i.raw_material_id,
          quantity: Number(i.quantity),
          unit: i.unit,
          notes: i.notes ?? '',
        })),
      };
      const res = editing
        ? await api.patch(`/recipes/${editing.id}`, payload)
        : await api.post('/recipes', payload);
      onSaved(res.data?.data ?? res.data);
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setApiErr(msg ?? 'Something went wrong.');
    } finally { setSaving(false); }
  };

  return createPortal(
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-6"
      style={{ backdropFilter: 'blur(6px)', backgroundColor: 'rgba(0,0,0,0.45)' }}>
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white w-full max-w-2xl border border-zinc-200 rounded-[1.25rem] shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#f5f0ff] border border-[#e9d5ff] rounded-lg flex items-center justify-center">
              <BookOpen size={15} className="text-[#a020f0]" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#1a0f2e]">{editing ? 'Edit Recipe' : 'Add Recipe'}</p>
              <p className="text-[10px] text-zinc-400">{editing ? `Updating recipe` : 'Define ingredient composition'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-400"><X size={16} /></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
          {apiErr && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle size={13} className="text-red-500 shrink-0" />
              <p className="text-xs text-red-600 font-medium">{apiErr}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Category Filter">
              <select value={catFilter} onChange={e => { setCatFilter(e.target.value); setMenuItemId(''); }} className={inputCls()}>
                <option value="">All Categories</option>
                {Array.from(new Set(menuItems.map(m => m.category).filter(Boolean))).sort().map(cat => (
                  <option key={cat as string} value={cat as string}>{cat as string}</option>
                ))}
              </select>
            </Field>
            <Field label="Menu Item" required error={errors.menu_item}>
              <select value={menuItemId} onChange={e => { setMenuItemId(Number(e.target.value)); setErrors(p => { const n = { ...p }; delete n.menu_item; return n; }); }}
                className={inputCls(errors.menu_item)}>
                <option value="">Select menu item...</option>
                {menuItems
                  .filter(m => !catFilter || m.category === catFilter)
                  .map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Size">
              <select value={size} onChange={e => setSize(e.target.value)} className={inputCls()}>
                <option value="">Fixed (no size)</option>
                <option value="JR">Junior (JR)</option>
                <option value="SM">Small (SM)</option>
                <option value="M">Medium (M)</option>
                <option value="L">Large (L)</option>
                <option value="SL">Solo (SL)</option>
              </select>
            </Field>
          </div>

          <Field label="Notes">
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              className={`${inputCls()} resize-none`} placeholder="Optional recipe notes..." />
          </Field>

          {/* Active toggle */}
          <label className="flex items-center gap-3 p-3 bg-zinc-50 border border-zinc-200 rounded-xl cursor-pointer hover:bg-[#faf9ff] transition-colors">
            <div className={`w-10 h-6 rounded-full transition-colors flex items-center ${isActive ? 'bg-[#a020f0]' : 'bg-zinc-300'}`}
              onClick={() => setIsActive(v => !v)}>
              <div className={`w-4 h-4 bg-white rounded-full mx-1 transition-transform ${isActive ? 'translate-x-4' : ''}`} />
            </div>
            <div>
              <p className="text-xs font-bold text-[#1a0f2e]">Active Recipe</p>
              <p className="text-[10px] text-zinc-400">Inactive recipes are not used for stock deduction</p>
            </div>
          </label>

          {/* Ingredient rows */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Ingredients <span className="text-red-400">*</span>
              </label>
              <button onClick={addRow}
                className="flex items-center gap-1 px-2.5 py-1 bg-[#f5f0ff] border border-[#e9d5ff] text-[#a020f0] rounded-lg text-[10px] font-bold hover:bg-[#ede8ff] transition-colors">
                <Plus size={11} /> Add Row
              </button>
            </div>

            {errors.items && <p className="text-[10px] text-red-500 mb-2 font-medium">{errors.items}</p>}

            <div className="border border-zinc-200 rounded-xl overflow-hidden">
              <div className="grid grid-cols-[1fr_120px_80px_32px] gap-0 bg-zinc-50 border-b border-zinc-200 px-3 py-2">
                {['Material', 'Qty / Serving', 'Unit', ''].map(h => (
                  <p key={h} className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">{h}</p>
                ))}
              </div>

              {recipeItems.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <p className="text-xs text-zinc-400 font-medium">No ingredients yet — click Add Row</p>
                </div>
              ) : recipeItems.map((item, idx) => (
                <div key={item.id} className="grid grid-cols-[1fr_120px_80px_32px] gap-0 items-center px-3 py-2 border-b border-zinc-100 last:border-0 hover:bg-zinc-50 transition-colors">
                  <div className="pr-2">
                    <select value={item.raw_material_id || ''} onChange={e => updateRow(idx, 'raw_material_id', e.target.value)}
                      className={`w-full text-xs font-medium text-zinc-700 bg-white border rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-violet-400 transition-all ${errors[`mat_${idx}`] ? 'border-red-300' : 'border-zinc-200'}`}>
                      <option value="">Select material...</option>
                      {rawMaterials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                    {errors[`mat_${idx}`] && <p className="text-[9px] text-red-500 mt-0.5">{errors[`mat_${idx}`]}</p>}
                  </div>
                  <div className="px-1">
                    <input type="number" min="0" step="0.01" value={item.quantity}
                      onChange={e => updateRow(idx, 'quantity', e.target.value === '' ? '' : Number(e.target.value))}
                      className={`w-full text-xs font-medium text-zinc-700 bg-white border rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-violet-400 transition-all text-right ${errors[`qty_${idx}`] ? 'border-red-300' : 'border-zinc-200'}`}
                      placeholder="0" />
                    {errors[`qty_${idx}`] && <p className="text-[9px] text-red-500 mt-0.5">{errors[`qty_${idx}`]}</p>}
                  </div>
                  <div className="px-1">
                    <span className="text-xs font-bold text-zinc-400 bg-zinc-100 px-2 py-1 rounded">{item.unit || '—'}</span>
                  </div>
                  <button onClick={() => removeRow(idx)}
                    className="w-7 h-7 flex items-center justify-center text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Minus size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 px-6 py-4 border-t border-zinc-100 shrink-0">
          <button onClick={onClose} disabled={saving}
            className="flex-1 py-2.5 bg-white border border-zinc-200 text-zinc-600 rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-zinc-50 transition-all disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 py-2.5 bg-[#a020f0] hover:bg-[#6a12b8] text-white rounded-lg font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-50">
            {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Recipe'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ─── Delete Modal ─────────────────────────────────────────────────────────────

const DeleteModal: React.FC<{
  recipe: Recipe;
  onClose: () => void;
  onDeleted: (id: number) => void;
}> = ({ recipe, onClose, onDeleted }) => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const name = recipe.menu_item?.name ?? recipe.menu_item_name ?? `Recipe #${recipe.id}`;

  const handleDelete = async () => {
    setSaving(true);
    try {
      await api.delete(`/recipes/${recipe.id}`);
      onDeleted(recipe.id);
      onClose();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Failed to delete.');
    } finally { setSaving(false); }
  };

  return createPortal(
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-6"
      style={{ backdropFilter: 'blur(6px)', backgroundColor: 'rgba(0,0,0,0.45)' }}>
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white w-full max-w-sm border border-zinc-200 rounded-[1.25rem] shadow-2xl">
        <div className="flex flex-col items-center text-center px-6 pt-8 pb-5">
          <div className="w-14 h-14 bg-red-50 border border-red-200 rounded-full flex items-center justify-center mb-4">
            <Trash2 size={22} className="text-red-500" />
          </div>
          <p className="text-base font-bold text-[#1a0f2e]">Delete Recipe?</p>
          <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
            Permanently delete recipe for <span className="font-bold text-zinc-700">{name}</span>. Stock deductions will stop.
          </p>
          {error && (
            <div className="flex items-center gap-2 mt-3 p-3 w-full bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle size={13} className="text-red-500 shrink-0" />
              <p className="text-xs text-red-600 font-medium text-left">{error}</p>
            </div>
          )}
        </div>
        <div className="flex gap-2 px-6 pb-6">
          <button onClick={onClose} disabled={saving}
            className="flex-1 py-2.5 bg-white border border-zinc-200 text-zinc-600 rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-zinc-50 transition-all disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleDelete} disabled={saving}
            className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-50">
            {saving ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

interface RecipesTabProps {
  readOnly?: boolean;
}

const RecipesTab: React.FC<RecipesTabProps> = ({ readOnly = false }) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Recipe | null>(null);
  const [delTarget, setDelTarget] = useState<Recipe | null>(null);

  const fetchRecipes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/recipes');
      const data = res.data;
      setRecipes(Array.isArray(data) ? data : data?.data ?? []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchRecipes(); }, [fetchRecipes]);

  const handleToggle = async (recipe: Recipe) => {
    if (readOnly) return;
    try {
      const res = await api.patch(`/recipes/${recipe.id}/toggle`);
      const updated = res.data?.data ?? res.data;
      setRecipes(p => p.map(r => r.id === updated.id ? updated : r));
    } catch (e) { console.error(e); }
  };

  const handleExport = () => {
    const sortedRecipes = [...recipes].sort((a, b) => {
      const catA = a.menu_item?.category?.name || '';
      const catB = b.menu_item?.category?.name || '';
      if (catA !== catB) return catA.localeCompare(catB);
      const nameA = a.menu_item?.name ?? a.menu_item_name ?? '';
      const nameB = b.menu_item?.name ?? b.menu_item_name ?? '';
      return nameA.localeCompare(nameB);
    });

    const rows = sortedRecipes.flatMap(r => {
      const items = r.items ?? r.recipe_items ?? [];
      const baseInfo = {
        'MENU ITEM': r.menu_item?.name ?? r.menu_item_name ?? '',
        'CATEGORY': r.menu_item?.category?.name ?? 'Uncategorized',
        'SIZE': sizeLabel(r.size),
        'STATUS': r.is_active ? 'Active' : 'Inactive',
        'NOTES': r.notes ?? ''
      };

      if (items.length === 0) {
        return [{
          'MENU ITEM': baseInfo['MENU ITEM'],
          'CATEGORY': baseInfo['CATEGORY'],
          'SIZE': baseInfo['SIZE'],
          'STATUS': baseInfo['STATUS'],
          'INGREDIENT': '(No Ingredients Defined)',
          'QUANTITY': 0,
          'UNIT': '-',
          'NOTES': baseInfo['NOTES']
        }];
      }

      return items.map((i, idx) => ({
        'MENU ITEM': idx === 0 ? baseInfo['MENU ITEM'] : '',
        'CATEGORY': idx === 0 ? baseInfo['CATEGORY'] : '',
        'SIZE': idx === 0 ? baseInfo['SIZE'] : '',
        'STATUS': idx === 0 ? baseInfo['STATUS'] : '',
        'INGREDIENT': i.raw_material?.name ?? i.material_name ?? '',
        'QUANTITY': i.quantity,
        'UNIT': i.raw_material?.unit ?? i.unit ?? '',
        'NOTES': idx === 0 ? baseInfo['NOTES'] : ''
      }));
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'All Recipes');
    ws['!cols'] = [
      { wch: 35 }, { wch: 25 }, { wch: 15 }, { wch: 12 },
      { wch: 40 }, { wch: 12 }, { wch: 12 }, { wch: 25 }
    ];
    XLSX.writeFile(wb, `LuckyBoba_All_Recipes_${new Date().toLocaleDateString('en-PH').replace(/\//g, '-')}.xlsx`);
  };

  const filtered = recipes.filter(r => {
    const name = r.menu_item?.name ?? r.menu_item_name ?? '';
    const matchSearch = name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'active' ? r.is_active
      : statusFilter === 'inactive' ? !r.is_active
        : true;
    const matchCategory = !categoryFilter || r.menu_item?.category?.name === categoryFilter;
    return matchSearch && matchStatus && matchCategory;
  });

  const uniqueCategories = Array.from(new Set(
    recipes.map(r => r.menu_item?.category?.name).filter(Boolean)
  )).sort();

  const totalRecipes = recipes.length;
  const activeRecipes = recipes.filter(r => r.is_active).length;
  const missingRecipes = recipes.filter(r => !r.items?.length && !r.recipe_items?.length).length;

  return (
    <div className="p-6 md:p-8 bg-[#f4f2fb] min-h-full">


      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { label: 'Total Recipes', value: totalRecipes, color: '#a020f0', bg: '#f5f0ff', border: '#e9d5ff' },
          { label: 'Active', value: activeRecipes, color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
          { label: 'No Ingredients', value: missingRecipes, color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
        ].map(s => (
          <div key={s.label} className="bg-white border rounded-[0.625rem] px-5 py-4 shadow-sm" style={{ borderColor: s.border }}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">{s.label}</p>
            <p className="text-2xl font-black tabular-nums" style={{ color: s.color }}>{loading ? '—' : s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-zinc-200 rounded-[0.625rem] overflow-hidden shadow-sm">

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-zinc-100">
          <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 flex-1 min-w-40">
            <Search size={13} className="text-zinc-400 shrink-0" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm text-zinc-700 outline-none placeholder:text-zinc-400"
              placeholder="Search by menu item..." />
            {search && <button onClick={() => setSearch('')} className="text-zinc-300 hover:text-red-500"><X size={13} /></button>}
          </div>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
            className="bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-600 outline-none h-9">
            <option value="">All Categories</option>
            {uniqueCategories.map(cat => (
              <option key={cat!} value={cat!}>{cat}</option>
            ))}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-600 outline-none h-9">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-[#e9d5ff] text-[#a020f0] rounded-lg text-xs font-bold hover:bg-[#f5f0ff] transition-all ml-auto md:ml-0">
            <FileDown size={14} /> Export All
          </button>
          {!readOnly && (
            <button onClick={() => setAddOpen(true)}
              className="bg-[#a020f0] hover:bg-[#6a12b8] shrink-0 text-white px-4 py-2 h-9 rounded-lg font-bold text-xs uppercase tracking-widest flex items-center gap-1.5 transition-all">
              <Plus size={13} /> Add Recipe
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100">
                {['Menu Item', 'Size', 'Status', 'Ingredients', ...(readOnly ? [] : ['Actions'])].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-zinc-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && [...Array(6)].map((_, i) => (
                <tr key={i} className="border-b border-zinc-50">
                  {[...Array(5)].map((_, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-3 bg-zinc-100 rounded animate-pulse" style={{ width: `${55 + (j * 11) % 35}%` }} />
                    </td>
                  ))}
                </tr>
              ))}

              {!loading && filtered.length === 0 && (
                <tr><td colSpan={readOnly ? 4 : 5} className="py-16 text-center">
                  <BookOpen size={32} className="mx-auto text-zinc-200 mb-3" />
                  <p className="text-xs font-bold text-zinc-300 uppercase tracking-widest">
                    {search || statusFilter ? 'No recipes match your filters' : 'No recipes found'}
                  </p>
                </td></tr>
              )}

              {!loading && filtered.map(r => {
                const name = r.menu_item?.name ?? r.menu_item_name ?? `Recipe #${r.id}`;
                const items = resolveItems(r);
                const isExpanded = expanded === r.id;
                const hasItems = items.length > 0;

                return (
                  <React.Fragment key={r.id}>
                    <tr className="border-b border-zinc-50 hover:bg-[#faf9ff] transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 bg-[#f5f0ff] border border-[#e9d5ff] rounded-lg flex items-center justify-center shrink-0">
                            <BookOpen size={12} className="text-[#a020f0]" />
                          </div>
                          <div>
                            <p className="font-bold text-[#1a0f2e] text-xs">{name}</p>
                            {r.menu_item?.category && (
                              <p className="text-[10px] text-zinc-400">{r.menu_item.category.name}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-bold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded">
                          {sizeLabel(r.size)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {readOnly ? (
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${r.is_active ? 'text-[#a020f0]' : 'text-zinc-400'}`}>
                            {r.is_active ? 'Active' : 'Inactive'}
                          </span>
                        ) : (
                          <button onClick={() => handleToggle(r)}
                            className="flex items-center gap-2 group">
                            <div className={`w-9 h-5 rounded-full transition-colors flex items-center ${r.is_active ? 'bg-[#a020f0]' : 'bg-zinc-300'}`}>
                              <div className={`w-3.5 h-3.5 bg-white rounded-full mx-0.5 transition-transform ${r.is_active ? 'translate-x-4' : ''}`} />
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${r.is_active ? 'text-[#a020f0]' : 'text-zinc-400'}`}>
                              {r.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </button>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        {hasItems ? (
                          <button onClick={() => setExpanded(isExpanded ? null : r.id)}
                            className="flex items-center gap-1.5 text-xs font-bold text-[#a020f0] hover:text-[#6a12b8] transition-colors">
                            <CheckCircle size={12} className="text-emerald-500" />
                            {items.length} ingredient{items.length !== 1 ? 's' : ''}
                            {isExpanded ? <ChevronDown size={12} /> : <ChevronDown size={12} className="-rotate-90" />}
                          </button>
                        ) : (
                          <span className="flex items-center gap-1.5 text-xs font-bold text-amber-500">
                            <AlertCircle size={12} />
                            Missing
                          </span>
                        )}
                      </td>
                      {!readOnly && (
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1">
                            <button onClick={() => setEditTarget(r)} title="Edit"
                              className="p-1.5 hover:bg-[#f5f0ff] rounded-[0.4rem] text-zinc-400 hover:text-[#a020f0] transition-colors">
                              <Edit2 size={13} />
                            </button>
                            <button onClick={() => setDelTarget(r)} title="Delete"
                              className="p-1.5 hover:bg-red-50 rounded-[0.4rem] text-zinc-400 hover:text-red-500 transition-colors">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>

                    {/* Expanded ingredient rows */}
                    {isExpanded && (
                      <tr className="border-b border-zinc-100 bg-[#faf9ff]">
                        <td colSpan={readOnly ? 4 : 5} className="px-5 pb-3 pt-1">
                          <div className="ml-10 border border-[#e9d5ff] rounded-xl overflow-hidden">
                            <div className="grid grid-cols-3 bg-[#f5f0ff] px-4 py-2 border-b border-[#e9d5ff]">
                              {['Material', 'Qty / Serving', 'Unit'].map(h => (
                                <p key={h} className="text-[9px] font-bold uppercase tracking-widest text-[#a020f0]">{h}</p>
                              ))}
                            </div>
                            {items.map((item, idx) => (
                              <div key={idx} className="grid grid-cols-3 px-4 py-2.5 border-b border-zinc-100 last:border-0 hover:bg-white transition-colors">
                                <div className="flex items-center gap-2">
                                  <FlaskConical size={11} className="text-zinc-400 shrink-0" />
                                  <span className="text-xs font-semibold text-zinc-700">{item.material_name}</span>
                                </div>
                                <span className="text-xs font-bold text-[#1a0f2e] tabular-nums">{item.quantity}</span>
                                <span className="text-xs font-bold text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded w-fit">{item.unit}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {!readOnly && addOpen && (
        <RecipeFormModal
          onClose={() => setAddOpen(false)}
          onSaved={r => setRecipes(p => [r, ...p])}
        />
      )}
      {!readOnly && editTarget && (
        <RecipeFormModal
          onClose={() => setEditTarget(null)}
          onSaved={r => { setRecipes(p => p.map(x => x.id === r.id ? r : x)); setEditTarget(null); }}
          editing={editTarget}
        />
      )}
      {!readOnly && delTarget && (
        <DeleteModal
          recipe={delTarget}
          onClose={() => setDelTarget(null)}
          onDeleted={id => { setRecipes(p => p.filter(x => x.id !== id)); setDelTarget(null); }}
        />
      )}
    </div>
  );
};

export default RecipesTab;
