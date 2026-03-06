"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import axios from 'axios';
import TopNavbar from '../TopNavbar';
import api from '../../services/api';

const dashboardFont = { fontFamily: "'Inter', sans-serif" };

// ─── Types ────────────────────────────────────────────────────────────────────

interface RawMaterial {
  id: number;
  name: string;
  unit: string;
  category: string;
  current_stock: number;
  reorder_level: number;
  is_intermediate: boolean;
  notes: string | null;
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CACHE_KEY = 'luckyboba_raw_materials_cache';

const inputCls = (hasError?: boolean) =>
  `w-full px-4 py-3 rounded-none border text-sm font-semibold outline-none transition-all bg-white text-[#1c1c1e] placeholder:text-zinc-400 focus:border-[#3b2063] focus:bg-white ${hasError ? 'border-red-400' : 'border-zinc-300'}`;

const selectCls = `w-full px-4 py-3 rounded-none border border-zinc-300 bg-white text-[#1c1c1e] font-semibold text-sm outline-none focus:border-[#3b2063] cursor-pointer`;

const UNITS = ['PC', 'PK', 'BAG', 'BTL', 'BX', 'ML', 'G', 'KG', 'L'];
const CATEGORIES = ['Packaging', 'Ingredients', 'Intermediate', 'Equipment'];

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

// ─── Add Modal ────────────────────────────────────────────────────────────────

function AddModal({ onClose, onSuccess }: {
  onClose: () => void;
  onSuccess: (data: RawMaterial) => void;
}) {
  const [form, setForm] = useState({
    name: '', unit: 'PC', category: 'Ingredients',
    current_stock: '', reorder_level: '', is_intermediate: false, notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; general?: string }>({});
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) onClose();
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) { setErrors({ name: 'Item name is required.' }); return; }
    setSubmitting(true);
    try {
      const response = await api.post('/raw-materials', {
        ...form,
        current_stock: parseFloat(form.current_stock) || 0,
        reorder_level: parseFloat(form.reorder_level) || 0,
      });
      onSuccess(response.data);
      onClose();
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data?.message ?? 'Failed to add item.')
        : 'Failed to add item.';
      setErrors({ general: msg });
    } finally { setSubmitting(false); }
  };

  return (
    <div ref={overlayRef} onClick={handleBackdropClick} className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-none border border-zinc-200 shadow-2xl w-full max-w-lg flex flex-col overflow-hidden" style={dashboardFont}>
        <div className="flex items-center justify-between px-7 py-5 border-b border-zinc-100">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">Raw Materials</p>
            <h2 className="text-sm font-extrabold text-[#1c1c1e] mt-0.5">Add New Item</h2>
          </div>
          <button onClick={onClose} className="text-zinc-300 hover:text-zinc-600 transition-colors p-1 text-lg leading-none">×</button>
        </div>

        <div className="px-7 py-6 flex flex-col gap-5">
          {errors.general && (
            <p className="text-[11px] text-red-500 font-semibold bg-red-50 border border-red-200 px-4 py-2">{errors.general}</p>
          )}

          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Item Name <span className="text-red-400">*</span></label>
            <input
              autoFocus
              type="text"
              value={form.name}
              onChange={(e) => { setForm(f => ({ ...f, name: e.target.value })); setErrors({}); }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
              placeholder="e.g. PEARL, BLACK BOBA (900g/pk)"
              className={inputCls(!!errors.name)}
            />
            {errors.name && <p className="text-[10px] text-red-500 font-semibold">{errors.name}</p>}
          </div>

          {/* Unit + Category */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Unit <span className="text-red-400">*</span></label>
              <select value={form.unit} onChange={(e) => setForm(f => ({ ...f, unit: e.target.value }))} className={selectCls}>
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Category <span className="text-red-400">*</span></label>
              <select value={form.category} onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))} className={selectCls}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Stock + Reorder */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Current Stock</label>
              <input
                type="number" min="0" step="0.0001"
                value={form.current_stock}
                onChange={(e) => setForm(f => ({ ...f, current_stock: e.target.value }))}
                className={inputCls()}
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Reorder Level</label>
              <input
                type="number" min="0" step="0.0001"
                value={form.reorder_level}
                onChange={(e) => setForm(f => ({ ...f, reorder_level: e.target.value }))}
                className={inputCls()}
                placeholder="0"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full px-4 py-3 rounded-none border border-zinc-300 text-sm font-semibold outline-none transition-all bg-white text-[#1c1c1e] placeholder:text-zinc-400 focus:border-[#3b2063] h-20 resize-none"
              placeholder="Optional notes..."
            />
          </div>

          {/* Intermediate toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_intermediate}
              onChange={(e) => setForm(f => ({ ...f, is_intermediate: e.target.checked }))}
              className="w-4 h-4 accent-[#3b2063]"
            />
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Intermediate item (cooked / mixed)</span>
          </label>
        </div>

        <div className="flex gap-3 px-7 py-5 border-t border-zinc-100">
          <button onClick={onClose} disabled={submitting} className="flex-1 h-11 bg-white border border-red-300 text-red-500 font-bold text-xs uppercase tracking-widest hover:bg-red-50 hover:border-red-400 transition-all disabled:opacity-50 rounded-none">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting} className="flex-1 h-11 bg-[#3b2063] text-white font-bold text-xs uppercase tracking-widest hover:bg-[#2a174a] transition-all disabled:opacity-60 flex items-center justify-center gap-2 rounded-none">
            {submitting ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</> : 'Save Item'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Adjust Stock Modal ───────────────────────────────────────────────────────

function AdjustModal({ item, onClose, onSuccess }: {
  item: RawMaterial;
  onClose: () => void;
  onSuccess: (updated: RawMaterial) => void;
}) {
  const [type, setType] = useState<'add' | 'subtract' | 'set'>('add');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) onClose();
  };

    const previewStock = useMemo(() => {
        const qty = parseFloat(quantity) || 0;
        const currentStock = parseFloat(String(item.current_stock)) || 0; // ← used below
        if (type === 'add') return currentStock + qty;      // ← was item.current_stock
        if (type === 'subtract') return currentStock - qty; // ← was item.current_stock
        return qty;
    }, [type, quantity, item.current_stock]);

  const handleSubmit = async () => {
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty < 0) { setError('Enter a valid quantity.'); return; }
    setSubmitting(true);
    try {
      const response = await api.post(`/raw-materials/${item.id}/adjust`, { type, quantity: qty, reason });
      // Return a merged item since the API only returns current_stock
      onSuccess({ ...item, current_stock: parseFloat(String(response.data.current_stock)) });
      onClose();
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data?.message ?? 'Adjustment failed.')
        : 'Adjustment failed.';
      setError(msg);
    } finally { setSubmitting(false); }
  };

  return (
    <div ref={overlayRef} onClick={handleBackdropClick} className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-none border border-zinc-200 shadow-2xl w-full max-w-md flex flex-col overflow-hidden" style={dashboardFont}>
        <div className="flex items-center justify-between px-7 py-5 border-b border-zinc-100">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">Raw Materials</p>
            <h2 className="text-sm font-extrabold text-[#1c1c1e] mt-0.5">Adjust Stock</h2>
          </div>
          <button onClick={onClose} className="text-zinc-300 hover:text-zinc-600 transition-colors p-1 text-lg leading-none">×</button>
        </div>

        <div className="px-7 py-6 flex flex-col gap-5">
          {/* Item info */}
          <div className="bg-[#f3f0ff] px-4 py-3 border border-[#ddd6fe]">
            <p className="text-[11px] font-bold text-[#3b2063] uppercase tracking-widest">{item.name}</p>
            <p className="text-xs text-zinc-500 font-semibold mt-0.5">
              Current Stock: <span className="text-[#1c1c1e] font-extrabold">{parseFloat(String(item.current_stock)).toFixed(2)} {item.unit}</span>
            </p>
          </div>

          {error && <p className="text-[11px] text-red-500 font-semibold bg-red-50 border border-red-200 px-4 py-2">{error}</p>}

          {/* Adjustment type */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Adjustment Type</label>
            <div className="grid grid-cols-3 gap-2">
              {(['add', 'subtract', 'set'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`h-10 text-[11px] font-bold uppercase tracking-widest rounded-none border transition-all ${
                    type === t
                      ? 'bg-[#3b2063] text-white border-[#3b2063]'
                      : 'bg-white text-zinc-500 border-zinc-300 hover:border-[#3b2063]'
                  }`}
                >
                  {t === 'add' ? '+ Add' : t === 'subtract' ? '− Subtract' : '= Set'}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">
              Quantity ({item.unit})
            </label>
            <input
              autoFocus
              type="number" min="0" step="0.0001"
              value={quantity}
              onChange={(e) => { setQuantity(e.target.value); setError(''); }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
              className={inputCls(!!error)}
              placeholder="0"
            />
          </div>

          {/* Preview */}
          {quantity && (
            <div className="flex items-center justify-between bg-zinc-50 border border-zinc-200 px-4 py-3">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">New Stock After Adjustment</span>
              <span className={`text-sm font-extrabold ${previewStock < 0 ? 'text-red-500' : 'text-[#3b2063]'}`}>
                {previewStock.toFixed(4)} {item.unit}
              </span>
            </div>
          )}

          {/* Reason */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Reason (optional)</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={inputCls()}
              placeholder="e.g. Delivery, Spoilage, Correction..."
            />
          </div>
        </div>

        <div className="flex gap-3 px-7 py-5 border-t border-zinc-100">
          <button onClick={onClose} disabled={submitting} className="flex-1 h-11 bg-white border border-red-300 text-red-500 font-bold text-xs uppercase tracking-widest hover:bg-red-50 hover:border-red-400 transition-all rounded-none">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting || !quantity} className="flex-1 h-11 bg-[#3b2063] text-white font-bold text-xs uppercase tracking-widest hover:bg-[#2a174a] transition-all disabled:opacity-60 flex items-center justify-center gap-2 rounded-none">
            {submitting ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Updating...</> : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Modal ─────────────────────────────────────────────────────────────

function DeleteModal({ item, onClose, onConfirm }: {
  item: RawMaterial;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <div ref={overlayRef} onClick={handleBackdropClick} className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-none border border-zinc-200 shadow-2xl w-full max-w-sm flex flex-col overflow-hidden" style={dashboardFont}>
        <div className="flex items-center justify-between px-7 py-5 border-b border-zinc-100">
          <h2 className="text-sm font-extrabold text-[#1c1c1e]">Delete Item</h2>
          <button onClick={onClose} className="text-zinc-300 hover:text-zinc-600 transition-colors p-1 text-lg leading-none">×</button>
        </div>
        <div className="px-7 py-7 flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 bg-red-50 border border-red-100 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-red-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
          </div>
          <p className="text-sm font-bold text-[#1c1c1e]">Delete <span className="text-[#3b2063]">"{item.name}"</span>?</p>
          <p className="text-[11px] text-zinc-400 font-semibold">This cannot be undone. Items used in recipes cannot be deleted.</p>
        </div>
        <div className="flex gap-3 px-7 py-5 border-t border-zinc-100">
          <button onClick={onClose} className="flex-1 h-11 bg-white border border-zinc-300 text-zinc-600 font-bold text-xs uppercase tracking-widest hover:bg-zinc-50 transition-all rounded-none">Cancel</button>
          <button onClick={onConfirm} className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-widest transition-all rounded-none">Delete</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const RawMaterialList = () => {
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState<RawMaterial | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RawMaterial | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [entriesLimit, setEntriesLimit] = useState(25);
  const toastCounter = useRef(0);

  // ── Toasts ──────────────────────────────────────────────────────────────────

  const addToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = ++toastCounter.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ── Fetch ───────────────────────────────────────────────────────────────────

  const fetchMaterials = useCallback(async (forceRefresh = false) => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!forceRefresh && cached) {
      setMaterials(JSON.parse(cached));
      setLoading(false);
    }
    try {
      const response = await api.get('/raw-materials');
      setMaterials(response.data);
      localStorage.setItem(CACHE_KEY, JSON.stringify(response.data));
    } catch {
      addToast('Failed to load raw materials.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { fetchMaterials(); }, [fetchMaterials]);

  // ── Filtered / displayed data ────────────────────────────────────────────────

  const displayData = useMemo(() => {
    let data = [...materials];

    if (categoryFilter !== 'All') {
      data = data.filter(m => m.category === categoryFilter);
    }
    if (lowStockOnly) {
        data = data.filter(m => 
            parseFloat(String(m.current_stock)) < parseFloat(String(m.reorder_level)) && 
            parseFloat(String(m.reorder_level)) > 0
        );
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter(m =>
        m.name.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q) ||
        m.unit.toLowerCase().includes(q)
      );
    }

    data.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));

    return entriesLimit === -1 ? data : data.slice(0, entriesLimit);
  }, [materials, categoryFilter, lowStockOnly, searchQuery, entriesLimit]);

    const lowStockCount = useMemo(() =>
        materials.filter(m => 
            parseFloat(String(m.current_stock)) < parseFloat(String(m.reorder_level)) && 
            parseFloat(String(m.reorder_level)) > 0
        ).length,
        [materials]
    );
  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleAddSuccess = (data: RawMaterial) => {
    setMaterials(prev => [...prev, data]);
    localStorage.removeItem(CACHE_KEY);
    addToast(`"${data.name}" added successfully.`);
  };

    const handleAdjustSuccess = (updated: RawMaterial) => {
        setMaterials(prev => prev.map(m =>
            m.id === updated.id
                ? { ...m, current_stock: parseFloat(String(updated.current_stock)) }  // ← parse here
                : m
        ));
        localStorage.removeItem(CACHE_KEY);
        addToast(`Stock updated for "${updated.name}".`);
    };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    try {
      await api.delete(`/raw-materials/${target.id}`);
      setMaterials(prev => prev.filter(m => m.id !== target.id));
      localStorage.removeItem(CACHE_KEY);
      addToast(`"${target.name}" deleted.`);
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data?.message ?? 'Delete failed.')
        : 'Delete failed.';
      addToast(msg, 'error');
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  if (loading && materials.length === 0) {
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

      {showAddModal && <AddModal onClose={() => setShowAddModal(false)} onSuccess={handleAddSuccess} />}
      {adjustTarget && <AdjustModal item={adjustTarget} onClose={() => setAdjustTarget(null)} onSuccess={handleAdjustSuccess} />}
      {deleteTarget && <DeleteModal item={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDeleteConfirm} />}

      <div className="flex-1 bg-[#f3f0ff] h-full flex flex-col overflow-hidden" style={dashboardFont}>
        <TopNavbar />
        <div className="flex-1 overflow-y-auto p-5 md:p-7 flex flex-col gap-4">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">Inventory</p>
              <h1 className="text-lg font-extrabold text-[#1c1c1e] mt-0.5">Raw Materials</h1>
            </div>
            <div className="flex items-center gap-2">
              {/* Low stock badge */}
              {lowStockCount > 0 && (
                <button
                  onClick={() => setLowStockOnly(v => !v)}
                  className={`h-11 px-5 font-bold text-xs uppercase tracking-widest flex items-center gap-2 rounded-none border transition-all ${
                    lowStockOnly
                      ? 'bg-red-600 text-white border-red-600'
                      : 'bg-white text-red-500 border-red-300 hover:bg-red-50'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                  {lowStockCount} Low Stock
                </button>
              )}
              <button
                onClick={() => fetchMaterials(true)}
                className="h-11 px-5 border border-zinc-300 text-zinc-500 font-bold text-xs uppercase tracking-widest hover:bg-zinc-50 transition-all rounded-none"
                title="Refresh"
              >
                ↻ Refresh
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="h-11 px-7 bg-[#3b2063] hover:bg-[#2a174a] text-white font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-colors rounded-none shadow-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add Item
              </button>
            </div>
          </div>

          {/* Table card */}
          <div className="flex-1 bg-white border border-zinc-200 overflow-hidden flex flex-col shadow-sm rounded-none">

            {/* Toolbar */}
            <div className="px-6 py-4 border-b border-zinc-100 flex flex-col md:flex-row justify-between items-center gap-3 bg-white">
              <div className="flex items-center gap-3 flex-wrap">
                {/* Entries limit */}
                <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  <span>Show</span>
                  <select
                    value={entriesLimit}
                    onChange={(e) => setEntriesLimit(Number(e.target.value))}
                    className="border border-zinc-300 bg-white px-2 py-1.5 outline-none text-[#1c1c1e] font-semibold text-xs rounded-none focus:border-[#3b2063]"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={-1}>All</option>
                  </select>
                  <span>entries</span>
                </div>

                {/* Category filter */}
                <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  <span>Category</span>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="border border-zinc-300 bg-white px-2 py-1.5 outline-none text-[#1c1c1e] font-semibold text-xs rounded-none focus:border-[#3b2063]"
                  >
                    <option value="All">All</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Search */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Search:</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Find item..."
                  className="border border-zinc-300 bg-white px-4 py-2 text-sm outline-none focus:border-[#3b2063] w-56 font-semibold text-[#1c1c1e] rounded-none placeholder:text-zinc-400"
                />
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-white z-10 border-b-2 border-zinc-100">
                  <tr>
                    <th className="px-7 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Item Name</th>
                    <th className="px-5 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Category</th>
                    <th className="px-5 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center">Unit</th>
                    <th className="px-5 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center">Current Stock</th>
                    <th className="px-5 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center">Reorder Level</th>
                    <th className="px-5 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center w-24">Adjust</th>
                    <th className="px-7 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center w-24">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {displayData.length > 0 ? displayData.map((item) => {
                    const isLow = parseFloat(String(item.current_stock)) < parseFloat(String(item.reorder_level)) && parseFloat(String(item.reorder_level)) > 0;
                    return (
                      <tr key={item.id} className={`transition-colors ${isLow ? 'bg-red-50 hover:bg-red-100/60' : 'hover:bg-[#f9f8ff]'}`}>
                        <td className="px-7 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-extrabold text-[#3b2063]">{item.name}</span>
                            {item.is_intermediate && (
                              <span className="text-[9px] font-bold uppercase tracking-widest bg-amber-100 text-amber-700 px-1.5 py-0.5">Intermediate</span>
                            )}
                            {isLow && (
                              <span className="text-[9px] font-bold uppercase tracking-widest bg-red-100 text-red-600 px-1.5 py-0.5">Low Stock</span>
                            )}
                          </div>
                          {item.notes && (
                            <p className="text-[11px] text-zinc-400 font-semibold mt-0.5">{item.notes}</p>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-[12px] font-semibold text-zinc-500">{item.category}</span>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span className="text-[12px] font-bold text-zinc-700">{item.unit}</span>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span className={`text-[13px] font-extrabold ${isLow ? 'text-red-600' : 'text-[#1c1c1e]'}`}>
                            {parseFloat(String(item.current_stock)).toFixed(2)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span className="text-[12px] font-semibold text-zinc-400">
                            {parseFloat(String(item.reorder_level)).toFixed(2)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <button
                            onClick={() => setAdjustTarget(item)}
                            className="h-9 w-9 inline-flex items-center justify-center bg-[#3b2063] hover:bg-[#2a174a] text-white transition-colors rounded-none"
                            title="Adjust Stock"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                            </svg>
                          </button>
                        </td>
                        <td className="px-7 py-3.5 text-center">
                          <button
                            onClick={() => setDeleteTarget(item)}
                            className="h-9 w-9 inline-flex items-center justify-center bg-white border border-red-300 text-red-500 hover:bg-red-50 hover:border-red-400 transition-colors rounded-none"
                            title="Delete"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={7} className="px-8 py-20 text-center">
                        <p className="text-[11px] font-bold text-zinc-300 uppercase tracking-widest">
                          {searchQuery ? `No results for "${searchQuery}"` : 'No raw materials found'}
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
                Showing {displayData.length} of {materials.length} items
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default RawMaterialList;

