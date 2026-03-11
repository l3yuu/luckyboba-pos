"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import axios from 'axios';
import api from '../../../services/api';
import { getCache, setCache } from '../../../utils/cache';
import {
  LayoutGrid, Plus, Search, Pencil, Trash2,
  Tag, Activity, X, Check, AlertTriangle, Loader2,
} from 'lucide-react';

// ─── Design tokens ─────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');
  .bc-root, .bc-root * { font-family: 'DM Sans', sans-serif !important; box-sizing: border-box; }
  .bc-label { font-size: 0.62rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #3f3f46; }
  .bc-sub   { font-size: 0.65rem; font-weight: 400; color: #71717a; }
  .bc-value { font-size: 1.9rem; font-weight: 800; letter-spacing: -0.035em; line-height: 1; }
  .bc-live  { display: inline-flex; align-items: center; gap: 5px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 100px; padding: 4px 10px; }
  .bc-live-dot  { width: 5px; height: 5px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 5px rgba(34,197,94,0.6); animation: bc-pulse 2s infinite; }
  .bc-live-text { font-size: 0.55rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #16a34a; }
  @keyframes bc-pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
`;

// ─── Types — exact same shape as Cashier's SubCategoryList ──────────────────
interface SubCategoryData {
  id:           number;
  name:         string;
  mainCategory: string;
  usedBy:       string[];
  itemCount:    number;
}

interface MainCategory {
  id:   number;
  name: string;
}

interface SubCategoryCache {
  subCategories:  SubCategoryData[];
  mainCategories: MainCategory[];
}

// ─── Modal Shell ──────────────────────────────────────────────────────────────
function ModalShell({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  const overlayRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);
  return (
    <div ref={overlayRef} onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      {children}
    </div>
  );
}

// ─── Add Modal ─────────────────────────────────────────────────────────────────
function AddModal({ mainCategories, onClose, onSuccess }: {
  mainCategories: MainCategory[];
  onClose: () => void;
  onSuccess: (data: SubCategoryData) => void;
}) {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>(mainCategories[0]?.id ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ name?: string }>({});

  const handleSubmit = async () => {
    if (!name.trim()) { setErrors({ name: 'Sub-category name is required.' }); return; }
    if (!categoryId)  { setErrors({ name: 'Please select a main category.' }); return; }
    setSubmitting(true);
    try {
      const response = await api.post('/sub-categories', { name: name.trim(), category_id: categoryId });
      onSuccess(response.data);
      onClose();
    } catch (err) {
      setErrors({ name: axios.isAxiosError(err) ? (err.response?.data?.message ?? 'Failed to add sub-category.') : 'Failed to add sub-category.' });
    } finally { setSubmitting(false); }
  };

  return (
    <ModalShell onClose={onClose}>
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-[#1a0f2e]">
              <Plus size={14} color="#fff" />
            </div>
            <div>
              <p className="bc-label" style={{ color: '#a1a1aa' }}>Menu Items</p>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1a0f2e', margin: 0 }}>Add Sub-Category</h3>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-400 hover:bg-gray-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="space-y-1.5">
            <label className="bc-label flex items-center gap-1.5 ml-1">
              <Tag size={11} /> Sub-Category Name <span className="text-red-400 ml-0.5">*</span>
            </label>
            <input
              autoFocus type="text" value={name}
              onChange={(e) => { setName(e.target.value); setErrors({}); }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
              placeholder="e.g. UL, UM, SM"
              className={`w-full px-4 py-3 rounded-xl border bg-[#f5f4f8] font-semibold text-sm text-[#1a0f2e] outline-none focus:border-[#ddd6f7] transition-colors ${errors.name ? 'border-red-300' : 'border-gray-100'}`}
            />
            {errors.name && <p style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 600 }}>{errors.name}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="bc-label flex items-center gap-1.5 ml-1">
              <LayoutGrid size={11} /> Main Category <span className="text-red-400 ml-0.5">*</span>
            </label>
            <select value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value))}
              className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-[#f5f4f8] font-semibold text-sm text-[#1a0f2e] outline-none focus:border-[#ddd6f7] transition-colors cursor-pointer">
              {mainCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-50 flex gap-2 justify-end">
          <button onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest text-zinc-500 bg-white border border-gray-200 hover:bg-gray-50 transition-all">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={submitting}
            className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest text-white bg-[#1a0f2e] hover:bg-[#2a1647] transition-all disabled:opacity-50 flex items-center gap-2">
            <Check size={13} />
            {submitting ? 'Saving…' : 'Add Sub-Category'}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

// ─── Edit Modal ────────────────────────────────────────────────────────────────
function EditModal({ subCategory, mainCategories, onClose, onSuccess }: {
  subCategory:    SubCategoryData;
  mainCategories: MainCategory[];
  onClose:        () => void;
  onSuccess:      (updated: SubCategoryData) => void;
}) {
  const [name, setName] = useState(subCategory.name);
  const [categoryId, setCategoryId] = useState<number | ''>(
    mainCategories.find(c => c.name === subCategory.mainCategory)?.id ?? mainCategories[0]?.id ?? ''
  );
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ name?: string }>({});

  const handleSubmit = async () => {
    if (!name.trim()) { setErrors({ name: 'Sub-category name is required.' }); return; }
    if (!categoryId)  { setErrors({ name: 'Please select a main category.' }); return; }
    setSubmitting(true);
    try {
      const response = await api.put(`/sub-categories/${subCategory.id}`, { name: name.trim(), category_id: categoryId });
      const selectedMainCat = mainCategories.find(c => c.id === categoryId);
      onSuccess({ ...subCategory, ...response.data, mainCategory: selectedMainCat?.name ?? subCategory.mainCategory });
      onClose();
    } catch (err) {
      setErrors({ name: axios.isAxiosError(err) ? (err.response?.data?.message ?? 'Update failed.') : 'Update failed.' });
    } finally { setSubmitting(false); }
  };

  return (
    <ModalShell onClose={onClose}>
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-[#f5f4f8] border border-gray-100">
              <Pencil size={13} color="#7c3aed" />
            </div>
            <div>
              <p className="bc-label" style={{ color: '#a1a1aa' }}>Menu Items</p>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1a0f2e', margin: 0 }}>Edit Sub-Category</h3>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-400 hover:bg-gray-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="space-y-1.5">
            <label className="bc-label flex items-center gap-1.5 ml-1">
              <Tag size={11} /> Sub-Category Name <span className="text-red-400 ml-0.5">*</span>
            </label>
            <input
              autoFocus type="text" value={name}
              onChange={(e) => { setName(e.target.value); setErrors({}); }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
              className={`w-full px-4 py-3 rounded-xl border bg-[#f5f4f8] font-semibold text-sm text-[#1a0f2e] outline-none focus:border-[#ddd6f7] transition-colors ${errors.name ? 'border-red-300' : 'border-gray-100'}`}
            />
            {errors.name && <p style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 600 }}>{errors.name}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="bc-label flex items-center gap-1.5 ml-1">
              <LayoutGrid size={11} /> Main Category <span className="text-red-400 ml-0.5">*</span>
            </label>
            <select value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value))}
              className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-[#f5f4f8] font-semibold text-sm text-[#1a0f2e] outline-none focus:border-[#ddd6f7] transition-colors cursor-pointer">
              {mainCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-50 flex gap-2 justify-end">
          <button onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest text-zinc-500 bg-white border border-gray-200 hover:bg-gray-50 transition-all">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={submitting}
            className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest text-white bg-[#1a0f2e] hover:bg-[#2a1647] transition-all disabled:opacity-50 flex items-center gap-2">
            <Check size={13} />
            {submitting ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
function DeleteModal({ subCategory, onClose, onConfirm }: {
  subCategory: SubCategoryData;
  onClose:     () => void;
  onConfirm:   () => void;
}) {
  return (
    <ModalShell onClose={onClose}>
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-gray-100 p-8 flex flex-col items-center text-center">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: '#fee2e2' }}>
          <Trash2 size={18} color="#dc2626" />
        </div>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1a0f2e', marginBottom: 6 }}>Delete Sub-Category?</h3>
        <p style={{ fontSize: '0.8rem', color: '#3b2063', fontWeight: 700, marginBottom: 4 }}>"{subCategory.name}"</p>
        {subCategory.itemCount > 0 && (
          <div className="flex items-center gap-1.5 mb-3">
            <AlertTriangle size={13} color="#f59e0b" />
            <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#f59e0b' }}>
              {subCategory.itemCount} linked item{subCategory.itemCount > 1 ? 's' : ''} will be affected.
            </p>
          </div>
        )}
        <p className="bc-sub" style={{ marginBottom: 24 }}>This action cannot be undone.</p>
        <div className="flex flex-col w-full gap-2">
          <button onClick={onConfirm}
            className="w-full py-3 text-xs font-bold uppercase tracking-widest text-white bg-[#be2525] hover:bg-[#a11f1f] rounded-xl transition-all">
            Delete
          </button>
          <button onClick={onClose}
            className="w-full py-3 text-xs font-bold uppercase tracking-widest text-zinc-500 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-all">
            Cancel
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
const BM_SubCategories = () => {
  const [subCategories, setSubCategories] = useState<SubCategoryData[]>(() => {
    const cached = getCache<SubCategoryCache>('sub-categories');
    return cached?.subCategories ?? [];
  });
  const [mainCategories, setMainCategories] = useState<MainCategory[]>(() => {
    const cached = getCache<SubCategoryCache>('sub-categories');
    return cached?.mainCategories ?? [];
  });
  const [isFetching, setIsFetching] = useState(() => getCache<SubCategoryCache>('sub-categories') === null);

  const [search,       setSearch]       = useState('');
  const [showModal,    setShowModal]    = useState(false);
  const [editTarget,   setEditTarget]   = useState<SubCategoryData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SubCategoryData | null>(null);

  // ── Fetch — same endpoints + same cache key as Cashier ───────────────────
  const fetchData = useCallback(async (forceRefresh = false) => {
    const cached = getCache<SubCategoryCache>('sub-categories');
    if (!forceRefresh && cached) {
      setSubCategories(cached.subCategories);
      setMainCategories(cached.mainCategories);
      return;
    }
    setIsFetching(true);
    try {
      const [subRes, mainRes] = await Promise.all([
        api.get('/sub-categories'),
        api.get('/categories'),
      ]);
      const toCache: SubCategoryCache = {
        subCategories:  subRes.data,
        mainCategories: mainRes.data,
      };
      setCache('sub-categories', toCache);
      setSubCategories(subRes.data.map((s: SubCategoryData) => ({ ...s, usedBy: s.usedBy ?? [] })));
      setMainCategories(mainRes.data);
    } catch (e) {
      console.error('Failed to load sub-categories', e);
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Cache helper ─────────────────────────────────────────────────────────
  const updateCache = (updated: SubCategoryData[]) => {
    const existing = getCache<SubCategoryCache>('sub-categories');
    if (existing) setCache('sub-categories', { ...existing, subCategories: updated });
  };

  // ── CRUD handlers ────────────────────────────────────────────────────────
  const handleAddSuccess = (data: SubCategoryData) => {
    const updated = [data, ...subCategories];
    setSubCategories(updated);
    updateCache(updated);
    localStorage.removeItem('pos_menu_cache');
  };

  const handleEditSuccess = (updatedSub: SubCategoryData) => {
    const updated = subCategories.map(s => s.id === updatedSub.id ? updatedSub : s);
    setSubCategories(updated);
    updateCache(updated);
    localStorage.removeItem('pos_menu_cache');
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    try {
      await api.delete(`/sub-categories/${target.id}`);
      const updated = subCategories.filter(s => s.id !== target.id);
      setSubCategories(updated);
      updateCache(updated);
      localStorage.removeItem('pos_menu_cache');
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  // ── Filtered list ────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return [...subCategories]
      .sort((a, b) => {
        const catCmp = (a.mainCategory ?? '').localeCompare(b.mainCategory ?? '');
        return catCmp !== 0 ? catCmp : a.name.localeCompare(b.name);
      })
      .filter(s =>
        s.name.toLowerCase().includes(q) ||
        (s.mainCategory ?? '').toLowerCase().includes(q)
      );
  }, [subCategories, search]);

  // ── Stat cards ───────────────────────────────────────────────────────────
  const uniqueMainCats = new Set(subCategories.map(s => s.mainCategory)).size;
  const withItems      = subCategories.filter(s => s.itemCount > 0).length;
  const totalItems     = subCategories.reduce((a, s) => a + s.itemCount, 0);

  const statCards = [
    { label: 'Total Sub-Categories', sub: 'All sub-categories',    value: subCategories.length, compact: String(subCategories.length), iconBg: '#ede9fe', iconColor: '#7c3aed', icon: <Tag size={14} strokeWidth={2.5} />,        valueColor: '#3b2063' },
    { label: 'Main Categories',      sub: 'Unique parent groups',  value: uniqueMainCats,        compact: String(uniqueMainCats),       iconBg: '#dcfce7', iconColor: '#16a34a', icon: <LayoutGrid size={14} strokeWidth={2.5} />, valueColor: '#1a0f2e' },
    { label: 'Active (w/ Items)',    sub: 'Sub-cats with items',   value: withItems,             compact: String(withItems),            iconBg: '#e0f2fe', iconColor: '#0284c7', icon: <Activity size={14} strokeWidth={2.5} />,  valueColor: '#0c4a6e' },
    { label: 'Total Items',          sub: 'Across all sub-cats',   value: totalItems,            compact: totalItems >= 1000 ? `${(totalItems/1000).toFixed(1)}K` : String(totalItems), iconBg: '#fef9c3', iconColor: '#ca8a04', icon: <Tag size={14} strokeWidth={2.5} />, valueColor: '#1a0f2e' },
  ];

  return (
    <>
      <style>{STYLES}</style>

      {showModal && (
        <AddModal
          mainCategories={mainCategories}
          onClose={() => setShowModal(false)}
          onSuccess={handleAddSuccess}
        />
      )}
      {editTarget && (
        <EditModal
          subCategory={editTarget}
          mainCategories={mainCategories}
          onClose={() => setEditTarget(null)}
          onSuccess={handleEditSuccess}
        />
      )}
      {deleteTarget && (
        <DeleteModal
          subCategory={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}

      <div className="bc-root flex flex-col h-full bg-[#f5f4f8] overflow-hidden">
        <div className="flex-1 overflow-y-auto px-5 md:px-8 pb-8 pt-5 flex flex-col gap-5">

          {/* ── STAT CARDS ── */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
            {statCards.map((s, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col gap-3 hover:shadow-md hover:border-[#ddd6f7] transition-all">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="bc-label">{s.label}</p>
                    <p className="bc-sub" style={{ marginTop: 2 }}>{s.sub}</p>
                  </div>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: s.iconBg, color: s.iconColor }}>{s.icon}</div>
                </div>
                <div>
                  <p className="bc-value" style={{ color: s.valueColor }}>{s.compact}</p>
                  <p className="bc-sub" style={{ marginTop: 4 }}>{s.value} total</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── FILTER BAR ── */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: '#ede9fe', color: '#7c3aed' }}>
                <Search size={13} strokeWidth={2.5} />
              </div>
              <h2 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1a0f2e', letterSpacing: '-0.025em', margin: 0 }}>
                Search Sub-Categories
              </h2>
            </div>
            <div className="flex gap-3">
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or main category…"
                className="flex-1 px-4 py-3 rounded-xl border border-gray-100 bg-[#f5f4f8] font-semibold text-sm text-[#1a0f2e] outline-none focus:border-[#ddd6f7] transition-colors"
              />
              <button onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-5 h-11 rounded-xl bg-[#1a0f2e] hover:bg-[#2a1647] text-white font-bold text-xs uppercase tracking-widest transition-all">
                <Plus size={14} /> Add Sub-Category
              </button>
            </div>
          </div>

          {/* ── TABLE CARD ── */}
          <div className="bg-white border border-gray-100 rounded-2xl flex flex-col overflow-hidden relative">

            {/* Fetching overlay */}
            {isFetching && (
              <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center rounded-2xl">
                <Loader2 className="animate-spin text-[#3b2063]" size={28} />
              </div>
            )}

            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#ede9fe', color: '#7c3aed' }}>
                  <Tag size={16} strokeWidth={2.5} />
                </div>
                <div>
                  <h2 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1a0f2e', letterSpacing: '-0.025em', margin: 0 }}>Sub-Category List</h2>
                  <p className="bc-label" style={{ color: '#a1a1aa', marginTop: 2 }}>All menu sub-categories</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', background: '#f4f4f5', color: '#71717a', border: '1px solid #e4e4e7', borderRadius: '100px', padding: '3px 9px' }}>
                  {filtered.length} records
                </span>
                <div className="bc-live">
                  <div className="bc-live-dot" />
                  <span className="bc-live-text">Live</span>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-white z-10 border-b border-gray-50">
                  <tr>
                    <th className="px-6 py-4 bc-label" style={{ color: '#a1a1aa', width: 48 }}>#</th>
                    <th className="px-6 py-4 bc-label" style={{ color: '#a1a1aa' }}>Sub-Category Name</th>
                    <th className="px-6 py-4 bc-label" style={{ color: '#a1a1aa' }}>Main Category</th>
                    <th className="px-6 py-4 bc-label text-center" style={{ color: '#a1a1aa' }}>Items</th>
                    <th className="px-6 py-4 bc-label text-right" style={{ color: '#a1a1aa' }}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {isFetching && subCategories.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-8 h-8 border-2 border-[#3b2063] border-t-transparent animate-spin rounded-full" />
                          <p className="bc-label" style={{ color: '#a1a1aa' }}>Loading…</p>
                        </div>
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center">
                        <div className="w-11 h-11 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: '#f4f4f5' }}>
                          <Tag size={18} color="#d4d4d8" />
                        </div>
                        <p className="bc-label" style={{ color: '#d4d4d8' }}>No sub-categories found</p>
                        <p className="bc-sub" style={{ color: '#e4e4e7', marginTop: 4 }}>Try a different search or add a new sub-category</p>
                      </td>
                    </tr>
                  ) : filtered.map((sub, idx) => (
                    <tr key={sub.id} className="hover:bg-[#f5f4f8] transition-colors">
                      <td className="px-6 py-3.5">
                        <span style={{ width: 22, height: 22, borderRadius: '0.35rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', fontWeight: 800, background: idx === 0 ? '#3b2063' : '#f4f4f5', color: idx === 0 ? '#fff' : '#71717a' }}>
                          {idx + 1}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2">
                          <Tag size={12} color="#a78bfa" strokeWidth={2.5} />
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1a0f2e' }}>{sub.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {(sub.usedBy?.length ?? 0) > 0
                            ? sub.usedBy.map(cat => (
                                <span key={cat} style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', background: '#f5f4f8', color: '#7c3aed', border: '1px solid #e9d5ff', borderRadius: '4px', padding: '2px 8px' }}>
                                  {cat}
                                </span>
                              ))
                            : <span style={{ fontSize: '0.8rem', color: '#71717a' }}>{sub.mainCategory || '—'}</span>
                          }
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', background: '#f4f4f5', color: '#71717a', borderRadius: '100px', padding: '2px 8px', border: '1px solid #e4e4e7' }}>
                          {sub.itemCount}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setEditTarget(sub)}
                            className="w-8 h-8 rounded-xl flex items-center justify-center border border-gray-100 text-zinc-400 hover:text-[#3b2063] hover:border-[#ddd6f7] transition-all">
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => setDeleteTarget(sub)}
                            className="w-8 h-8 rounded-xl flex items-center justify-center border border-gray-100 text-zinc-400 hover:text-red-500 hover:border-red-100 transition-all">
                            <Trash2 size={13} />
                          </button>
                        </div>
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
                  <Tag size={13} color="rgba(255,255,255,0.5)" strokeWidth={2.5} />
                </div>
                <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                  Sub-Categories
                </p>
              </div>
              <p style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', margin: 0 }}>
                {subCategories.length}
              </p>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default BM_SubCategories;