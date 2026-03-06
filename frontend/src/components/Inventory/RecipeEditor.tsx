"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import axios from 'axios';
import TopNavbar from '../TopNavbar';
import api from '../../services/api';

const dashboardFont = { fontFamily: "'Inter', sans-serif" };

// ─── Types ────────────────────────────────────────────────────────────────────

interface MenuItem {
  id: number;
  name: string;
  category_id: number;
  price: string;
  size: string; // 'none' | 'M' | 'L' | etc.
  type: string
}

interface RawMaterial {
  id: number;
  name: string;
  unit: string;
  category: string;
}

interface RecipeItem {
  id: number;
  recipe_id: number;
  raw_material_id: number;
  quantity: number;
  unit: string;
  notes: string | null;
  raw_material?: RawMaterial;
}

interface Recipe {
  id: number;
  menu_item_id: number;
  size: string | null;
  is_active: boolean;
  notes: string | null;
  items: RecipeItem[];
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────




// ─── Toast ────────────────────────────────────────────────────────────────────

function ToastNotification({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-9999 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 px-5 py-3 rounded-none shadow-2xl text-white text-[11px] font-bold uppercase tracking-widest pointer-events-auto border border-white/10 transition-all duration-300 ${toast.type === 'success' ? 'bg-[#1a0f2e]' : 'bg-red-600'}`}
          style={dashboardFont}
        >
          <span>{toast.type === 'success' ? '✓' : '✕'}</span>
          {toast.message}
          <button onClick={() => onRemove(toast.id)} className="ml-2 opacity-50 hover:opacity-100 transition-opacity">×</button>
        </div>
      ))}
    </div>
  );
}

// ─── Recipe Edit Modal ────────────────────────────────────────────────────────

function RecipeEditModal({
  menuItem,
  size,
  existingRecipe,
  rawMaterials,
  onClose,
  onSaved,
}: {
  menuItem: MenuItem;
  size: string | null;
  existingRecipe: Recipe | null;
  rawMaterials: RawMaterial[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Each row: raw_material_id, quantity, unit, notes, id (if existing)
  const blankRow = () => ({ raw_material_id: '', quantity: '', unit: 'G', notes: '', _key: Math.random() });

  const [rows, setRows] = useState<ReturnType<typeof blankRow>[]>(() => {
    if (existingRecipe && existingRecipe.items.length > 0) {
      return existingRecipe.items.map((ri) => ({
        raw_material_id: String(ri.raw_material_id),
        quantity: String(ri.quantity),
        unit: ri.unit,
        notes: ri.notes ?? '',
        _key: ri.id,
      }));
    }
    return [blankRow()];
  });

  const [isActive, setIsActive] = useState(existingRecipe?.is_active ?? true);
  const [recipeNotes, setRecipeNotes] = useState(existingRecipe?.notes ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) onClose();
  };

  const addRow = () => setRows(r => [...r, blankRow()]);

  const removeRow = (key: number) => setRows(r => r.filter(row => row._key !== key));

  const updateRow = (key: number, field: string, value: string) => {
    setRows(r => r.map(row => {
      if (row._key !== key) return row;
      // Auto-fill unit from selected raw material
      if (field === 'raw_material_id') {
        const mat = rawMaterials.find(m => m.id === parseInt(value));
        return { ...row, [field]: value, unit: mat?.unit ?? row.unit };
      }
      return { ...row, [field]: value };
    }));
  };

  const handleSave = async () => {
    const validRows = rows.filter(r => r.raw_material_id && r.quantity);
    if (validRows.length === 0) { setError('Add at least one ingredient.'); return; }

    setSubmitting(true);
    setError('');

    try {
      const payload = {
        menu_item_id: menuItem.id,
        size: size === 'none' ? null : size,
        is_active: isActive,
        notes: recipeNotes || null,
        items: validRows.map(r => ({
          raw_material_id: parseInt(r.raw_material_id),
          quantity: parseFloat(r.quantity),
          unit: r.unit,
          notes: r.notes || null,
        })),
      };

      if (existingRecipe) {
        await api.patch(`/recipes/${existingRecipe.id}`, payload); 
      } else {
        await api.post('/recipes', payload);
      }

      onSaved();
      onClose();
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data?.message ?? 'Failed to save recipe.')
        : 'Failed to save recipe.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!existingRecipe) return;
    if (!confirm('Delete this recipe? This cannot be undone.')) return;
    setSubmitting(true);
    try {
      await api.delete(`/recipes/${existingRecipe.id}`);
      onSaved();
      onClose();
    } catch {
      setError('Failed to delete recipe.');
    } finally {
      setSubmitting(false);
    }
  };

  const sizeLabel = size === 'none' || !size ? 'Fixed Size' : `Size ${size}`;

  return (
    <div
      ref={overlayRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        className="bg-white rounded-none border border-zinc-200 shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden"
        style={{ ...dashboardFont, maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-zinc-100 shrink-0">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">
              Recipe Editor · {sizeLabel}
            </p>
            <h2 className="text-sm font-extrabold text-[#1c1c1e] mt-0.5 truncate max-w-md">{menuItem.name}</h2>
          </div>
          <button onClick={onClose} className="text-zinc-300 hover:text-zinc-600 transition-colors p-1 text-lg leading-none shrink-0">×</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-7 py-6 flex flex-col gap-5">
          {error && (
            <p className="text-[11px] text-red-500 font-semibold bg-red-50 border border-red-200 px-4 py-2">{error}</p>
          )}

          {/* Active toggle */}
          <div className="flex items-center justify-between bg-zinc-50 border border-zinc-200 px-4 py-3">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Recipe Status</span>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={e => setIsActive(e.target.checked)}
                className="w-4 h-4 accent-[#3b2063]"
              />
              <span className={`text-[11px] font-bold uppercase tracking-widest ${isActive ? 'text-emerald-600' : 'text-zinc-400'}`}>
                {isActive ? 'Active' : 'Inactive'}
              </span>
            </label>
          </div>

          {/* Ingredients table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                Ingredients <span className="text-red-400">*</span>
              </label>
              <button
                onClick={addRow}
                className="h-7 px-3 bg-[#3b2063] text-white text-[10px] font-bold uppercase tracking-widest hover:bg-[#2a174a] transition-colors rounded-none flex items-center gap-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add Row
              </button>
            </div>

            <div className="border border-zinc-200 overflow-hidden">
              {/* Column headers */}
              <div className="grid grid-cols-[2fr_1fr_1fr_auto] bg-zinc-50 border-b border-zinc-200">
                <div className="px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Raw Material</div>
                <div className="px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Qty / Serving</div>
                <div className="px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Unit</div>
                <div className="px-3 py-2 w-10" />
              </div>

              {/* Rows */}
              {rows.map((row, idx) => (
                <div
                  key={row._key}
                  className={`grid grid-cols-[2fr_1fr_1fr_auto] items-center ${idx < rows.length - 1 ? 'border-b border-zinc-100' : ''}`}
                >
                  {/* Raw material select */}
                  <div className="px-2 py-1.5">
                    <select
                      value={row.raw_material_id}
                      onChange={e => updateRow(row._key, 'raw_material_id', e.target.value)}
                      className="w-full px-2 py-2 rounded-none border border-zinc-200 bg-white text-[#1c1c1e] font-semibold text-xs outline-none focus:border-[#3b2063] cursor-pointer"
                    >
                      <option value="">— Select ingredient —</option>
                      {rawMaterials.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Quantity */}
                  <div className="px-2 py-1.5">
                    <input
                      type="number"
                      min="0"
                      step="0.0001"
                      value={row.quantity}
                      onChange={e => updateRow(row._key, 'quantity', e.target.value)}
                      placeholder="0"
                      className="w-full px-2 py-2 rounded-none border border-zinc-200 text-xs font-semibold outline-none focus:border-[#3b2063] bg-white text-[#1c1c1e]"
                    />
                  </div>

                  {/* Unit */}
                  <div className="px-2 py-1.5">
                    <input
                      type="text"
                      value={row.unit}
                      onChange={e => updateRow(row._key, 'unit', e.target.value)}
                      className="w-full px-2 py-2 rounded-none border border-zinc-200 text-xs font-bold outline-none focus:border-[#3b2063] bg-white text-zinc-700 uppercase"
                    />
                  </div>

                  {/* Remove */}
                  <div className="px-2 py-1.5 flex justify-center">
                    <button
                      onClick={() => removeRow(row._key)}
                      disabled={rows.length === 1}
                      className="w-7 h-7 flex items-center justify-center text-zinc-300 hover:text-red-500 hover:bg-red-50 transition-colors rounded-none disabled:opacity-20"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recipe notes */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Recipe Notes</label>
            <textarea
              value={recipeNotes}
              onChange={e => setRecipeNotes(e.target.value)}
              className="w-full px-4 py-3 rounded-none border border-zinc-300 text-sm font-semibold outline-none transition-all bg-white text-[#1c1c1e] placeholder:text-zinc-400 focus:border-[#3b2063] h-16 resize-none"
              placeholder="Optional notes about this recipe..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-7 py-5 border-t border-zinc-100 shrink-0">
          {existingRecipe && (
            <button
              onClick={handleDelete}
              disabled={submitting}
              className="h-11 px-5 bg-white border border-red-300 text-red-500 font-bold text-xs uppercase tracking-widest hover:bg-red-50 hover:border-red-400 transition-all rounded-none disabled:opacity-50"
            >
              Delete
            </button>
          )}
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 h-11 bg-white border border-zinc-300 text-zinc-600 font-bold text-xs uppercase tracking-widest hover:bg-zinc-50 transition-all disabled:opacity-50 rounded-none"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={submitting}
            className="flex-1 h-11 bg-[#3b2063] text-white font-bold text-xs uppercase tracking-widest hover:bg-[#2a174a] transition-all disabled:opacity-60 flex items-center justify-center gap-2 rounded-none"
          >
            {submitting
              ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</>
              : existingRecipe ? 'Update Recipe' : 'Save Recipe'
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const RecipeEditor = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'with' | 'without'>('all');
  const [entriesLimit, setEntriesLimit] = useState(25);
  const [editTarget, setEditTarget] = useState<{ menuItem: MenuItem; size: string | null; recipe: Recipe | null } | null>(null);
  const toastCounter = useRef(0);

  // ── Toasts ──────────────────────────────────────────────────────────────────

  const addToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = ++toastCounter.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // ── Fetch ───────────────────────────────────────────────────────────────────

const fetchAll = useCallback(async () => {
  setLoading(true);
  try {
    const [menuRes, matRes, recipeRes] = await Promise.all([
      api.get('/menu-list'),
      api.get('/raw-materials'),
      api.get('/recipes'),
    ]);

    // menu-list returns a flat array of 297 menu items directly
    const raw = menuRes.data?.data ?? menuRes.data;
    const items: MenuItem[] = Array.isArray(raw) ? raw : [];

    setMenuItems(items);
    setRawMaterials(matRes.data);
    setRecipes(recipeRes.data);
  } catch (e) {
    console.error('fetchAll error:', e);
    addToast('Failed to load data.', 'error');
  } finally {
    setLoading(false);
  }
}, [addToast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Compute rows: one row per (menuItem × size) ──────────────────────────────

    const rows = useMemo(() => {
    const recipeMap = new Map<string, Recipe>();
    recipes.forEach(r => {
        const sizeKey = r.size ?? 'none';
        recipeMap.set(`${r.menu_item_id}__${sizeKey}`, r);
    });

    const result: {
        menuItem: MenuItem;
        size: string | null;
        sizeLabel: string;
        recipe: Recipe | null;
        hasRecipe: boolean;
    }[] = [];

    menuItems
        .filter(item => item.type === 'food' || item.type === 'drink')  // ← food & drink only
        .forEach(item => {
        // One row per item — size is already per-item in the DB
        const sizeVal = item.size && item.size.toLowerCase() !== 'none' ? item.size : null;
        const key = sizeVal ? `${item.id}__${sizeVal}` : `${item.id}__none`;
        const recipe = recipeMap.get(key) ?? null;
        result.push({
            menuItem: item,
            size: sizeVal,
            sizeLabel: sizeVal ?? '—',
            recipe,
            hasRecipe: !!recipe,
        });
        });

    return result;
    }, [menuItems, recipes]);

  // ── Stats ────────────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const total = rows.length;
    const withRecipe = rows.filter(r => r.hasRecipe).length;
    return { total, withRecipe, without: total - withRecipe };
  }, [rows]);

  // ── Filtered ─────────────────────────────────────────────────────────────────

  const displayRows = useMemo(() => {
    let data = [...rows];

    if (filterStatus === 'with') data = data.filter(r => r.hasRecipe);
    if (filterStatus === 'without') data = data.filter(r => !r.hasRecipe);

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter(r => r.menuItem.name.toLowerCase().includes(q));
    }

    return entriesLimit === -1 ? data : data.slice(0, entriesLimit);
  }, [rows, filterStatus, searchQuery, entriesLimit]);

  // ── Render ───────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');`}</style>
        <div className="flex-1 bg-[#f3f0ff] h-full flex flex-col overflow-hidden" style={dashboardFont}>
          <TopNavbar />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3b2063] mx-auto mb-4" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Loading...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');`}</style>
      <ToastNotification toasts={toasts} onRemove={removeToast} />

      {editTarget && (
        <RecipeEditModal
          menuItem={editTarget.menuItem}
          size={editTarget.size}
          existingRecipe={editTarget.recipe}
          rawMaterials={rawMaterials}
          onClose={() => setEditTarget(null)}
          onSaved={() => {
            addToast('Recipe saved successfully.');
            fetchAll();
          }}
        />
      )}

      <div className="flex-1 bg-[#f3f0ff] h-full flex flex-col overflow-hidden" style={dashboardFont}>
        <TopNavbar />
        <div className="flex-1 overflow-y-auto p-5 md:p-7 flex flex-col gap-4">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">Inventory</p>
              <h1 className="text-lg font-extrabold text-[#1c1c1e] mt-0.5">Recipe Editor</h1>
            </div>
            <button
              onClick={() => fetchAll()}
              className="h-11 px-5 border border-zinc-300 text-zinc-500 font-bold text-xs uppercase tracking-widest hover:bg-zinc-50 transition-all rounded-none"
            >
              ↻ Refresh
            </button>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total Rows', value: stats.total, color: 'text-[#3b2063]' },
              { label: 'With Recipe', value: stats.withRecipe, color: 'text-emerald-600' },
              { label: 'Missing Recipe', value: stats.without, color: stats.without > 0 ? 'text-red-500' : 'text-zinc-400' },
            ].map(s => (
              <div key={s.label} className="bg-white border border-zinc-200 px-5 py-4 shadow-sm">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{s.label}</p>
                <p className={`text-2xl font-extrabold mt-1 ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Table card */}
          <div className="flex-1 bg-white border border-zinc-200 overflow-hidden flex flex-col shadow-sm rounded-none">

            {/* Toolbar */}
            <div className="px-6 py-4 border-b border-zinc-100 flex flex-col md:flex-row justify-between items-center gap-3 bg-white">
              <div className="flex items-center gap-3 flex-wrap">
                {/* Entries */}
                <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  <span>Show</span>
                  <select
                    value={entriesLimit}
                    onChange={e => setEntriesLimit(Number(e.target.value))}
                    className="border border-zinc-300 bg-white px-2 py-1.5 outline-none text-[#1c1c1e] font-semibold text-xs rounded-none focus:border-[#3b2063]"
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={-1}>All</option>
                  </select>
                  <span>entries</span>
                </div>

                {/* Status filter */}
                <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  <span>Filter</span>
                  <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value as 'all' | 'with' | 'without')}
                    className="border border-zinc-300 bg-white px-2 py-1.5 outline-none text-[#1c1c1e] font-semibold text-xs rounded-none focus:border-[#3b2063]"
                  >
                    <option value="all">All Items</option>
                    <option value="with">Has Recipe</option>
                    <option value="without">Missing Recipe</option>
                  </select>
                </div>
              </div>

              {/* Search */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Search:</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Find menu item..."
                  className="border border-zinc-300 bg-white px-4 py-2 text-sm outline-none focus:border-[#3b2063] w-56 font-semibold text-[#1c1c1e] rounded-none placeholder:text-zinc-400"
                />
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-white z-10 border-b-2 border-zinc-100">
                  <tr>
                    <th className="px-7 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Menu Item</th>
                    <th className="px-5 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center w-20">Size</th>
                    <th className="px-5 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center w-28">Status</th>
                    <th className="px-5 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Ingredients</th>
                    <th className="px-7 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center w-28">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {displayRows.length > 0 ? displayRows.map((row, idx) => (
                    <tr
                      key={`${row.menuItem.id}-${row.sizeLabel}-${idx}`}
                      className={`transition-colors ${!row.hasRecipe ? 'bg-amber-50/40 hover:bg-amber-50' : 'hover:bg-[#f9f8ff]'}`}
                    >
                      {/* Name */}
                      <td className="px-7 py-3.5">
                        <span className="text-[13px] font-extrabold text-[#3b2063]">{row.menuItem.name}</span>
                        <span className="ml-2 text-[11px] text-zinc-400 font-semibold">
                          ₱{parseFloat(row.menuItem.price).toFixed(2)}
                        </span>
                      </td>

                      {/* Size badge */}
                      <td className="px-5 py-3.5 text-center">
                        <span className={`text-[11px] font-bold uppercase tracking-widest px-2 py-0.5 ${
                          row.sizeLabel === 'M' ? 'bg-blue-50 text-blue-600' :
                          row.sizeLabel === 'L' ? 'bg-purple-50 text-purple-600' :
                          'bg-zinc-100 text-zinc-500'
                        }`}>
                          {row.sizeLabel}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5 text-center">
                        {row.hasRecipe ? (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Set
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-amber-600 bg-amber-50 border border-amber-100 px-2 py-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            Missing
                          </span>
                        )}
                      </td>

                      {/* Ingredients preview */}
                      <td className="px-5 py-3.5">
                        {row.recipe ? (
                          <div className="flex flex-wrap gap-1">
                            {row.recipe.items.slice(0, 4).map(ri => (
                              <span
                                key={ri.id}
                                className="text-[10px] font-semibold bg-[#f3f0ff] text-[#3b2063] px-2 py-0.5 border border-[#ddd6fe]"
                              >
                                {ri.raw_material?.name ?? `RM#${ri.raw_material_id}`} · {parseFloat(String(ri.quantity)).toFixed(2)}{ri.unit}
                              </span>
                            ))}
                            {row.recipe.items.length > 4 && (
                              <span className="text-[10px] font-semibold text-zinc-400 px-2 py-0.5">
                                +{row.recipe.items.length - 4} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-zinc-300 font-semibold">No ingredients set</span>
                        )}
                      </td>

                      {/* Edit button */}
                      <td className="px-7 py-3.5 text-center">
                        <button
                          onClick={() => setEditTarget({ menuItem: row.menuItem, size: row.size, recipe: row.recipe })}
                          className={`h-9 px-4 text-[11px] font-bold uppercase tracking-widest rounded-none transition-colors ${
                            row.hasRecipe
                              ? 'bg-white border border-zinc-300 text-zinc-600 hover:border-[#3b2063] hover:text-[#3b2063]'
                              : 'bg-[#3b2063] text-white hover:bg-[#2a174a]'
                          }`}
                        >
                          {row.hasRecipe ? 'Edit' : 'Add'}
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="px-8 py-20 text-center">
                        <p className="text-[11px] font-bold text-zinc-300 uppercase tracking-widest">
                          {searchQuery ? `No results for "${searchQuery}"` : 'No menu items found'}
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="px-7 py-4 bg-white border-t border-zinc-100 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Synchronized</span>
              </div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                Showing {displayRows.length} of {rows.length} rows
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default RecipeEditor;