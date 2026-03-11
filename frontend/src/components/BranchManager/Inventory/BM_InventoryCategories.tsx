"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import axios from 'axios';
import api from '../../../services/api';
import {
  LayoutGrid, Plus, Search, Pencil, Trash2,
  Tag, Activity, X, Check, CheckCircle2, AlertTriangle,
} from 'lucide-react';

// ─── Design tokens ─────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');
  .bic-root, .bic-root * { font-family: 'DM Sans', sans-serif !important; box-sizing: border-box; }
  .bic-label { font-size: 0.6rem; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: #71717a; }
  .bic-live  { display:inline-flex;align-items:center;gap:5px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:100px;padding:3px 9px; }
  .bic-live-dot  { width:5px;height:5px;border-radius:50%;background:#22c55e;box-shadow:0 0 5px rgba(34,197,94,.6);animation:bic-pulse 2s infinite; }
  .bic-live-text { font-size:0.52rem;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#16a34a; }
  @keyframes bic-pulse{0%,100%{opacity:1}50%{opacity:.45}}
`;

// ─── Types — same as Cashier InventoryCategoryList ────────────────────────────
interface InventoryCategory {
  id:               number;
  name:             string;
  type:             string;
  description:      string;
  menu_items_count: number;
}

interface Toast { id: number; message: string; type: 'success' | 'error'; }

// ─── Shared input styles ───────────────────────────────────────────────────────
const inputCls = (err?: boolean) =>
  `w-full px-4 py-2.5 rounded-xl border text-sm font-semibold outline-none transition-all bg-[#f5f4f8] text-[#1a0f2e] placeholder:text-zinc-400 focus:bg-white focus:border-[#c4b5fd] ${err ? 'border-red-300' : 'border-gray-100'}`;
const selectCls = `w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-[#f5f4f8] text-[#1a0f2e] font-semibold text-sm outline-none focus:border-[#c4b5fd] focus:bg-white cursor-pointer transition-all`;

// ─── Toast Stack ──────────────────────────────────────────────────────────────
function ToastStack({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className={`flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl text-white text-xs font-bold uppercase tracking-widest pointer-events-auto border border-white/10 ${t.type === 'success' ? 'bg-[#1a0f2e]' : 'bg-red-600'}`}>
          {t.type === 'success' ? <CheckCircle2 size={14} /> : <X size={14} />}
          <span>{t.message}</span>
          <button onClick={() => onRemove(t.id)} className="ml-1 opacity-50 hover:opacity-100 transition-opacity"><X size={12} /></button>
        </div>
      ))}
    </div>
  );
}

// ─── Modal Shell ───────────────────────────────────────────────────────────────
function ModalShell({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <div ref={ref} onClick={e => { if (e.target === ref.current) onClose(); }}
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-md overflow-hidden flex flex-col" style={{ maxHeight: '92vh' }}>
        {children}
      </div>
    </div>
  );
}

// ─── Add Modal ────────────────────────────────────────────────────────────────
function AddModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (d: InventoryCategory) => void }) {
  const [name, setName]               = useState('');
  const [description, setDescription] = useState('');
  const [type, setType]               = useState('food');
  const [cupId, setCupId]             = useState<number | ''>('');
  const [cups, setCups]               = useState<{ id: number; name: string; code: string }[]>([]);
  const [saving, setSaving]           = useState(false);
  const [errors, setErrors]           = useState<{ name?: string }>({});

  useEffect(() => {
    api.get('/cups').then(res => setCups(res.data)).catch(() => {});
  }, []);

  const handleSave = async () => {
    if (!name.trim()) { setErrors({ name: 'Category name is required.' }); return; }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = { name: name.trim(), description: description.trim(), type };
      if (type === 'drink' && cupId !== '') payload.cup_id = cupId;
      const res = await api.post('/categories', payload);
      onSuccess(res.data); onClose();
    } catch (err) {
      setErrors({ name: axios.isAxiosError(err) ? (err.response?.data?.message ?? 'Failed to add category.') : 'Failed to add category.' });
    } finally { setSaving(false); }
  };

  return (
    <ModalShell onClose={onClose}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-[#1a0f2e]"><Plus size={14} color="#fff" /></div>
          <div>
            <p className="bic-label">Inventory</p>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1a0f2e', margin: 0 }}>Create New Category</h3>
          </div>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-400 hover:bg-gray-100 transition-colors"><X size={15} /></button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
        <div className="space-y-1.5">
          <label className="bic-label ml-1">Category Name *</label>
          <input autoFocus value={name} onChange={e => { setName(e.target.value); setErrors({}); }}
            onKeyDown={e => e.key === 'Enter' && handleSave()} placeholder="e.g. Milk Tea" className={inputCls(!!errors.name)} />
          {errors.name && <p className="text-xs text-red-500 font-semibold">{errors.name}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="bic-label ml-1">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional description..."
            className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-[#f5f4f8] text-sm font-semibold outline-none focus:border-[#c4b5fd] focus:bg-white h-20 resize-none transition-all" />
        </div>

        <div className="space-y-1.5">
          <label className="bic-label ml-1">Type *</label>
          <select value={type} onChange={e => { setType(e.target.value); setCupId(''); }} className={selectCls}>
            <option value="food">Food</option>
            <option value="drink">Drink</option>
            <option value="promo">Promo</option>
            <option value="standard">Standard</option>
          </select>
        </div>

        {type === 'drink' && (
          <div className="space-y-1.5">
            <label className="bic-label ml-1">Cup Type</label>
            <select value={cupId} onChange={e => setCupId(Number(e.target.value))} className={selectCls}>
              <option value="">— Select Cup —</option>
              {cups.map(cup => <option key={cup.id} value={cup.id}>{cup.name} ({cup.code})</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-50 flex gap-2 justify-end">
        <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest text-zinc-500 bg-white border border-gray-200 hover:bg-gray-50 transition-all">Cancel</button>
        <button onClick={handleSave} disabled={saving}
          className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest text-white bg-[#1a0f2e] hover:bg-[#2a1647] transition-all disabled:opacity-50 flex items-center gap-2">
          <Check size={12} />{saving ? 'Saving…' : 'Save Category'}
        </button>
      </div>
    </ModalShell>
  );
}

// ─── Edit Modal ────────────────────────────────────────────────────────────────
function EditModal({ category, onClose, onSuccess }: {
  category: InventoryCategory; onClose: () => void; onSuccess: (u: InventoryCategory) => void;
}) {
  const [name, setName]               = useState(category.name);
  const [description, setDescription] = useState(category.description || '');
  const [saving, setSaving]           = useState(false);
  const [errors, setErrors]           = useState<{ name?: string }>({});

  const handleSave = async () => {
    if (!name.trim()) { setErrors({ name: 'Category name is required.' }); return; }
    setSaving(true);
    try {
      // Uses PATCH same as Cashier InventoryCategoryList EditModal
      const res = await api.patch(`/categories/${category.id}`, { name: name.trim(), description: description.trim() });
      onSuccess(res.data); onClose();
    } catch (err) {
      setErrors({ name: axios.isAxiosError(err) ? (err.response?.data?.message ?? 'Update failed.') : 'Update failed.' });
    } finally { setSaving(false); }
  };

  return (
    <ModalShell onClose={onClose}>
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-[#f5f4f8] border border-gray-100"><Pencil size={13} color="#7c3aed" /></div>
          <div>
            <p className="bic-label">Inventory</p>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1a0f2e', margin: 0 }}>Edit Category</h3>
          </div>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-400 hover:bg-gray-100 transition-colors"><X size={15} /></button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
        <div className="space-y-1.5">
          <label className="bic-label ml-1">Category Name *</label>
          <input value={name} onChange={e => { setName(e.target.value); setErrors({}); }}
            onKeyDown={e => e.key === 'Enter' && handleSave()} className={inputCls(!!errors.name)} />
          {errors.name && <p className="text-xs text-red-500 font-semibold">{errors.name}</p>}
        </div>
        <div className="space-y-1.5">
          <label className="bic-label ml-1">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-[#f5f4f8] text-sm font-semibold outline-none focus:border-[#c4b5fd] focus:bg-white h-20 resize-none transition-all" />
        </div>
      </div>

      <div className="px-6 py-4 border-t border-gray-50 flex gap-2 justify-end">
        <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest text-zinc-500 bg-white border border-gray-200 hover:bg-gray-50 transition-all">Cancel</button>
        <button onClick={handleSave} disabled={saving}
          className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest text-white bg-[#1a0f2e] hover:bg-[#2a1647] transition-all disabled:opacity-50 flex items-center gap-2">
          <Check size={12} />{saving ? 'Saving…' : 'Update Category'}
        </button>
      </div>
    </ModalShell>
  );
}

// ─── Delete Modal ─────────────────────────────────────────────────────────────
function DeleteModal({ category, onClose, onConfirm }: {
  category: InventoryCategory; onClose: () => void; onConfirm: () => void;
}) {
  return (
    <ModalShell onClose={onClose}>
      <div className="p-8 flex flex-col items-center text-center gap-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: '#fee2e2' }}>
          <Trash2 size={20} color="#dc2626" />
        </div>
        <div>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1a0f2e', marginBottom: 4 }}>Delete Category?</h3>
          <p style={{ fontSize: '0.85rem', color: '#3b2063', fontWeight: 700 }}>"{category.name}"</p>
          {category.menu_items_count > 0 && (
            <div className="flex items-center justify-center gap-1.5 mt-2">
              <AlertTriangle size={13} color="#f59e0b" />
              <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#f59e0b' }}>
                {category.menu_items_count} linked item{category.menu_items_count > 1 ? 's' : ''} will be affected.
              </p>
            </div>
          )}
          <p className="bic-label mt-2" style={{ color: '#a1a1aa' }}>This action cannot be undone.</p>
        </div>
        <div className="flex flex-col w-full gap-2 mt-2">
          <button onClick={onConfirm} className="w-full py-3 text-xs font-bold uppercase tracking-widest text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all">Delete</button>
          <button onClick={onClose} className="w-full py-3 text-xs font-bold uppercase tracking-widest text-zinc-500 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-all">Cancel</button>
        </div>
      </div>
    </ModalShell>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
const BM_InventoryCategories = () => {
  const [categories,   setCategories]   = useState<InventoryCategory[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [toasts,       setToasts]       = useState<Toast[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTarget,   setEditTarget]   = useState<InventoryCategory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<InventoryCategory | null>(null);
  const [searchQuery,  setSearchQuery]  = useState('');
  const [entriesLimit, setEntriesLimit] = useState(10);
  const toastCounter = useRef(0);

  // ── Toast helpers ────────────────────────────────────────────────────────────
  const addToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = ++toastCounter.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);
  const removeToast = useCallback((id: number) => setToasts(prev => prev.filter(t => t.id !== id)), []);

  // ── Fetch — same endpoint + cache key as Cashier InventoryCategoryList ───────
  const fetchCategories = useCallback(async () => {
    const cached = localStorage.getItem('luckyboba_inv_categories_cache');
    if (cached) { setCategories(JSON.parse(cached)); setLoading(false); }
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
      localStorage.setItem('luckyboba_inv_categories_cache', JSON.stringify(res.data));
    } catch { addToast('Failed to load categories', 'error'); }
    finally { setLoading(false); }
  }, [addToast]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  // ── Filtered / sorted list ───────────────────────────────────────────────────
  const displayData = useMemo(() => {
    const sorted = [...categories].sort((a, b) => a.name.localeCompare(b.name));
    const filtered = sorted.filter(cat =>
      (cat.name ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cat.description ?? '').toLowerCase().includes(searchQuery.toLowerCase())
    );
    return entriesLimit === -1 ? filtered : filtered.slice(0, entriesLimit);
  }, [categories, searchQuery, entriesLimit]);

  // ── CRUD handlers ────────────────────────────────────────────────────────────
  const handleAddSuccess = (data: InventoryCategory) => {
    setCategories(prev => [...prev, data]);
    localStorage.removeItem('luckyboba_inv_categories_cache');
    addToast(`"${data.name}" added successfully.`);
  };

  const handleEditSuccess = (updated: InventoryCategory) => {
    setCategories(prev => prev.map(cat => cat.id === updated.id ? { ...cat, ...updated } : cat));
    localStorage.removeItem('luckyboba_inv_categories_cache');
    addToast(`"${updated.name}" updated successfully.`);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget; setDeleteTarget(null);
    try {
      await api.delete(`/categories/${target.id}`);
      setCategories(prev => prev.filter(cat => cat.id !== target.id));
      localStorage.removeItem('luckyboba_inv_categories_cache');
      addToast(`"${target.name}" deleted.`);
    } catch (err) {
      addToast(axios.isAxiosError(err) ? (err.response?.data?.message ?? 'Delete failed.') : 'Delete failed.', 'error');
    }
  };

  // ── Stat cards ───────────────────────────────────────────────────────────────
  const totalItems = categories.reduce((a, c) => a + (c.menu_items_count ?? 0), 0);
  const withItems  = categories.filter(c => (c.menu_items_count ?? 0) > 0).length;

  const statCards = [
    { label: 'Total Categories', sub: 'All inventory categories',  value: categories.length,              compact: String(categories.length),              iconBg: '#ede9fe', iconColor: '#7c3aed', icon: <LayoutGrid size={14} strokeWidth={2.5} />, vc: '#3b2063' },
    { label: 'Total Items',      sub: 'Across all categories',     value: totalItems,                     compact: totalItems >= 1000 ? `${(totalItems/1000).toFixed(1)}K` : String(totalItems), iconBg: '#dcfce7', iconColor: '#16a34a', icon: <Tag size={14} strokeWidth={2.5} />, vc: '#1a0f2e' },
    { label: 'Active (w/ Items)',sub: 'Categories with items',      value: withItems,                      compact: String(withItems),                      iconBg: '#e0f2fe', iconColor: '#0284c7', icon: <Activity size={14} strokeWidth={2.5} />, vc: '#0c4a6e' },
    { label: 'Empty Categories', sub: 'No items assigned',         value: categories.length - withItems,  compact: String(categories.length - withItems),  iconBg: '#fef9c3', iconColor: '#ca8a04', icon: <Tag size={14} strokeWidth={2.5} />, vc: '#1a0f2e' },
  ];

  // ── Type badge style ─────────────────────────────────────────────────────────
  const typeBadge = (type: string) => {
    const map: Record<string, { bg: string; color: string; border: string }> = {
      drink:    { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
      food:     { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
      promo:    { bg: '#fff7ed', color: '#ea580c', border: '#fed7aa' },
      standard: { bg: '#f4f4f5', color: '#71717a', border: '#e4e4e7' },
    };
    const s = map[type] ?? map.standard;
    return (
      <span style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'capitalize', background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: '100px', padding: '2px 8px' }}>
        {type || '—'}
      </span>
    );
  };

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{STYLES}</style>
      <ToastStack toasts={toasts} onRemove={removeToast} />

      {showAddModal  && <AddModal onClose={() => setShowAddModal(false)} onSuccess={handleAddSuccess} />}
      {editTarget    && <EditModal category={editTarget} onClose={() => setEditTarget(null)} onSuccess={handleEditSuccess} />}
      {deleteTarget  && <DeleteModal category={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDeleteConfirm} />}

      <div className="bic-root flex flex-col h-full bg-[#f5f4f8] overflow-hidden">
        <div className="flex-1 overflow-y-auto px-5 md:px-8 pb-8 pt-5 flex flex-col gap-5">

          {/* ── Page Header ── */}
          <div className="flex items-center justify-between">
            <div>
              <p className="bic-label">Inventory</p>
              <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1a0f2e', letterSpacing: '-0.025em', marginTop: 2 }}>Categories</h1>
            </div>
            <button onClick={() => setShowAddModal(true)}
              className="h-9 px-5 rounded-xl bg-[#1a0f2e] hover:bg-[#2a1647] text-white font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all">
              <Plus size={13} /> New Category
            </button>
          </div>

          {/* ── STAT CARDS ── */}
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
            {statCards.map((s, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col gap-3 hover:shadow-md hover:border-[#ddd6f7] transition-all">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="bic-label">{s.label}</p>
                    <p style={{ fontSize: '0.6rem', color: '#a1a1aa', marginTop: 2 }}>{s.sub}</p>
                  </div>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: s.iconBg, color: s.iconColor }}>{s.icon}</div>
                </div>
                <div>
                  <p style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1, color: s.vc }}>{s.compact}</p>
                  <p style={{ fontSize: '0.6rem', color: '#a1a1aa', marginTop: 4 }}>{s.value} total</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── SEARCH + ADD BAR ── */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: '#ede9fe', color: '#7c3aed' }}>
                <Search size={13} strokeWidth={2.5} />
              </div>
              <h2 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#1a0f2e', letterSpacing: '-0.02em', margin: 0 }}>Search Categories</h2>
            </div>
            <div className="flex gap-3 items-center">
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by name or description…"
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-100 bg-[#f5f4f8] font-semibold text-sm text-[#1a0f2e] outline-none focus:border-[#ddd6f7] transition-colors" />
              <div className="flex items-center gap-2">
                <span className="bic-label">Show</span>
                <select value={entriesLimit} onChange={e => setEntriesLimit(Number(e.target.value))}
                  className="border border-gray-100 bg-[#f5f4f8] px-2.5 py-1.5 rounded-lg outline-none text-[#1a0f2e] font-semibold text-xs focus:border-[#c4b5fd] transition-colors cursor-pointer">
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={-1}>All</option>
                </select>
              </div>
              <button onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-5 h-10 rounded-xl bg-[#1a0f2e] hover:bg-[#2a1647] text-white font-bold text-xs uppercase tracking-widest transition-all">
                <Plus size={13} /> Add Category
              </button>
            </div>
          </div>

          {/* ── TABLE CARD ── */}
          <div className="bg-white border border-gray-100 rounded-2xl flex flex-col overflow-hidden">

            {/* Table header */}
            <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#ede9fe', color: '#7c3aed' }}>
                  <LayoutGrid size={16} strokeWidth={2.5} />
                </div>
                <div>
                  <h2 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#1a0f2e', letterSpacing: '-0.02em', margin: 0 }}>Category List</h2>
                  <p className="bic-label" style={{ color: '#a1a1aa', marginTop: 2 }}>All inventory categories</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', background: '#f4f4f5', color: '#71717a', border: '1px solid #e4e4e7', borderRadius: '100px', padding: '3px 9px' }}>
                  {displayData.length} records
                </span>
                <div className="bic-live"><div className="bic-live-dot" /><span className="bic-live-text">Live</span></div>
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-white z-10 border-b border-gray-50">
                  <tr>
                    <th className="px-6 py-3.5 bic-label" style={{ color: '#a1a1aa', width: 48 }}>#</th>
                    <th className="px-6 py-3.5 bic-label" style={{ color: '#a1a1aa' }}>Name</th>
                    <th className="px-6 py-3.5 bic-label" style={{ color: '#a1a1aa' }}>Type</th>
                    <th className="px-6 py-3.5 bic-label" style={{ color: '#a1a1aa' }}>Description</th>
                    <th className="px-6 py-3.5 bic-label text-center" style={{ color: '#a1a1aa' }}>Items</th>
                    <th className="px-6 py-3.5 bic-label text-center" style={{ color: '#a1a1aa' }}>Edit</th>
                    <th className="px-6 py-3.5 bic-label text-center" style={{ color: '#a1a1aa' }}>Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading && categories.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-8 h-8 border-2 border-[#3b2063] border-t-transparent animate-spin rounded-full" />
                          <p className="bic-label" style={{ color: '#a1a1aa' }}>Loading…</p>
                        </div>
                      </td>
                    </tr>
                  ) : displayData.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-16 text-center">
                        <div className="w-11 h-11 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: '#f4f4f5' }}>
                          <LayoutGrid size={18} color="#d4d4d8" />
                        </div>
                        <p className="bic-label" style={{ color: '#d4d4d8' }}>No categories found</p>
                        <p style={{ fontSize: '0.65rem', color: '#e4e4e7', marginTop: 4 }}>Try a different search or add a new category</p>
                      </td>
                    </tr>
                  ) : displayData.map((cat, idx) => (
                    <tr key={cat.id} className="hover:bg-[#f5f4f8] transition-colors">
                      {/* Row number */}
                      <td className="px-6 py-3.5">
                        <span style={{ width: 22, height: 22, borderRadius: '0.35rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.52rem', fontWeight: 800, background: idx === 0 ? '#3b2063' : '#f4f4f5', color: idx === 0 ? '#fff' : '#71717a' }}>
                          {idx + 1}
                        </span>
                      </td>

                      {/* Name */}
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2">
                          <Tag size={12} color="#a78bfa" strokeWidth={2.5} />
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1a0f2e' }}>{cat.name}</span>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-6 py-3.5">{typeBadge(cat.type)}</td>

                      {/* Description */}
                      <td className="px-6 py-3.5">
                        <span style={{ fontSize: '0.8rem', color: '#71717a' }}>{cat.description || '—'}</span>
                      </td>

                      {/* Items count */}
                      <td className="px-6 py-3.5 text-center">
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', background: '#f4f4f5', color: '#71717a', borderRadius: '100px', padding: '2px 8px', border: '1px solid #e4e4e7' }}>
                          {cat.menu_items_count ?? 0}
                        </span>
                      </td>

                      {/* Edit */}
                      <td className="px-6 py-3.5 text-center">
                        <button onClick={() => setEditTarget(cat)}
                          className="w-9 h-9 inline-flex items-center justify-center bg-[#1a0f2e] hover:bg-[#2a1647] text-white transition-colors rounded-xl">
                          <Pencil size={13} strokeWidth={2} />
                        </button>
                      </td>

                      {/* Delete */}
                      <td className="px-6 py-3.5 text-center">
                        <button onClick={() => setDeleteTarget(cat)}
                          className="w-9 h-9 inline-flex items-center justify-center bg-white border border-red-200 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all rounded-xl">
                          <Trash2 size={13} strokeWidth={2} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center px-6 py-4 bg-[#1a0f2e] rounded-b-2xl">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <LayoutGrid size={12} color="rgba(255,255,255,0.5)" strokeWidth={2.5} />
                </div>
                <p className="bic-label" style={{ color: 'rgba(255,255,255,0.45)', margin: 0 }}>Inventory Categories</p>
              </div>
              <p style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', margin: 0 }}>
                {categories.length}
              </p>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default BM_InventoryCategories;