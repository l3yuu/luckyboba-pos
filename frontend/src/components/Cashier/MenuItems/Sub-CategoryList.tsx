"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import axios from 'axios';
import TopNavbar from '../TopNavbar';
import api from '../../../services/api';
import { Plus, Search, Pencil, Trash2, CheckCircle2, X, Tag, AlertTriangle, Loader2 } from 'lucide-react';
import { getCache, setCache } from '../../../utils/cache';

interface SubCategoryData {
  id: number;
  name: string;
  mainCategory: string;
  usedBy: string[];
  itemCount: number;
}

interface MainCategory {
  id: number;
  name: string;
}

interface SubCategoryCache {
  subCategories: SubCategoryData[];
  mainCategories: MainCategory[];
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

// ── Shared styles ─────────────────────────────────────────────────────────────
const inputCls = (hasError?: boolean) =>
  `w-full px-4 py-3 border text-sm font-semibold outline-none transition-all bg-white text-[#1a0f2e] placeholder:text-zinc-300 focus:border-[#3b2063] ${hasError ? 'border-red-400' : 'border-zinc-200'}`;

const selectCls = `w-full px-4 py-3 border border-zinc-200 bg-white text-[#1a0f2e] font-semibold text-sm outline-none focus:border-[#3b2063] cursor-pointer transition-colors`;

// ── Toast ─────────────────────────────────────────────────────────────────────
function ToastNotification({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-9999 flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <div key={toast.id} className={`flex items-center gap-3 px-5 py-3 shadow-xl text-white text-sm font-semibold pointer-events-auto border border-white/10 animate-in slide-in-from-right-full ${toast.type === 'success' ? 'bg-[#1a0f2e]' : 'bg-red-600'}`}>
          {toast.type === 'success' ? <CheckCircle2 size={15} /> : <X size={15} />}
          <span>{toast.message}</span>
          <button onClick={() => onRemove(toast.id)} className="ml-1 text-white/50 hover:text-white transition-colors"><X size={13} /></button>
        </div>
      ))}
    </div>
  );
}

// ── Modal Shell ───────────────────────────────────────────────────────────────
function ModalShell({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  const overlayRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);
  return (
    <div ref={overlayRef} onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      {children}
    </div>
  );
}

// ── Add Modal ─────────────────────────────────────────────────────────────────
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
    if (!categoryId) { setErrors({ name: 'Please select a main category.' }); return; }
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
      <div className="bg-white border border-zinc-200 shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#3b2063] flex items-center justify-center">
              <Plus size={16} className="text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Menu Items</p>
              <h2 className="text-sm font-bold text-[#1a0f2e]">Add Sub-Category</h2>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-300 hover:text-zinc-600 transition-colors"><X size={18} /></button>
        </div>

        {/* Body */}
        <div className="px-7 py-6 flex flex-col gap-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">
              Sub-Category Name <span className="text-red-400">*</span>
            </label>
            <input
              autoFocus type="text" value={name}
              onChange={(e) => { setName(e.target.value); setErrors({}); }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
              placeholder="e.g. UL, UM, SM"
              className={inputCls(!!errors.name)}
            />
            {errors.name && <p className="text-[11px] text-red-500 font-semibold">{errors.name}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">
              Main Category <span className="text-red-400">*</span>
            </label>
            <select value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value))} className={selectCls}>
              {mainCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-7 py-5 border-t border-zinc-100">
          <button onClick={onClose} disabled={submitting} className="flex-1 h-11 bg-white border border-zinc-200 text-zinc-600 font-bold text-sm uppercase tracking-widest hover:bg-zinc-50 transition-all disabled:opacity-50 rounded-[0.625rem]">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting} className="flex-1 h-11 bg-[#3b2063] hover:bg-[#2a1647] text-white font-bold text-sm uppercase tracking-widest transition-all disabled:opacity-60 flex items-center justify-center gap-2 rounded-[0.625rem]">
            {submitting ? <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-[0.625rem] animate-spin" /> Saving...</> : 'Add Sub-Category'}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

// ── Edit Modal ────────────────────────────────────────────────────────────────
function EditModal({ subCategory, mainCategories, onClose, onSuccess }: {
  subCategory: SubCategoryData;
  mainCategories: MainCategory[];
  onClose: () => void;
  onSuccess: (updated: SubCategoryData) => void;
}) {
  const [name, setName] = useState(subCategory.name);
  const [categoryId, setCategoryId] = useState<number | ''>(
    mainCategories.find((c) => c.name === subCategory.mainCategory)?.id ?? mainCategories[0]?.id ?? ''
  );
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ name?: string }>({});

  const handleSubmit = async () => {
    if (!name.trim()) { setErrors({ name: 'Sub-category name is required.' }); return; }
    if (!categoryId) { setErrors({ name: 'Please select a main category.' }); return; }
    setSubmitting(true);
    try {
      const response = await api.put(`/sub-categories/${subCategory.id}`, { name: name.trim(), category_id: categoryId });
      const selectedMainCat = mainCategories.find(c => c.id === categoryId);
      onSuccess({ ...subCategory, ...response.data, mainCategory: selectedMainCat ? selectedMainCat.name : subCategory.mainCategory });
      onClose();
    } catch (err) {
      setErrors({ name: axios.isAxiosError(err) ? (err.response?.data?.message ?? 'Failed to update sub-category.') : 'Failed to update sub-category.' });
    } finally { setSubmitting(false); }
  };

  return (
    <ModalShell onClose={onClose}>
      <div className="bg-white border border-zinc-200 shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-7 py-5 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-zinc-50 border border-zinc-200 flex items-center justify-center">
              <Pencil size={15} className="text-violet-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Menu Items</p>
              <h2 className="text-sm font-bold text-[#1a0f2e]">Edit Sub-Category</h2>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-300 hover:text-zinc-600 transition-colors"><X size={18} /></button>
        </div>

        <div className="px-7 py-6 flex flex-col gap-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Sub-Category Name <span className="text-red-400">*</span></label>
            <input
              autoFocus type="text" value={name}
              onChange={(e) => { setName(e.target.value); setErrors({}); }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
              placeholder="e.g. UL, UM, SM"
              className={inputCls(!!errors.name)}
            />
            {errors.name && <p className="text-[11px] text-red-500 font-semibold">{errors.name}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Main Category <span className="text-red-400">*</span></label>
            <select value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value))} className={selectCls}>
              {mainCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3 px-7 py-5 border-t border-zinc-100">
          <button onClick={onClose} disabled={submitting} className="flex-1 h-11 bg-white border border-zinc-200 text-zinc-600 font-bold text-sm uppercase tracking-widest hover:bg-zinc-50 transition-all">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting} className="flex-1 h-11 bg-[#3b2063] hover:bg-[#2a1647] text-white font-bold text-sm uppercase tracking-widest transition-all disabled:opacity-60 flex items-center justify-center gap-2 rounded-[0.625rem]">
            {submitting ? <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-[0.625rem] animate-spin" /> Saving...</> : 'Save Changes'}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

// ── Delete Modal ──────────────────────────────────────────────────────────────
function DeleteModal({ subCategory, onClose, onConfirm }: {
  subCategory: SubCategoryData;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <ModalShell onClose={onClose}>
      <div className="bg-white border border-zinc-200 shadow-2xl w-full max-w-sm flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-7 py-5 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-red-50 border border-red-200 flex items-center justify-center">
              <Trash2 size={15} className="text-red-600" />
            </div>
            <h2 className="text-sm font-bold text-[#1a0f2e]">Delete Sub-Category</h2>
          </div>
          <button onClick={onClose} className="text-zinc-300 hover:text-zinc-600 transition-colors"><X size={18} /></button>
        </div>

        <div className="px-7 py-7 flex flex-col items-center gap-3 text-center">
          <AlertTriangle size={32} className="text-amber-500" />
          <p className="text-sm font-bold text-[#1a0f2e]">
            Delete <span className="text-[#3b2063]">"{subCategory.name}"</span>?
          </p>
          {subCategory.itemCount > 0 && (
            <p className="text-[11px] font-bold text-amber-500">
              This sub-category has {subCategory.itemCount} linked item{subCategory.itemCount > 1 ? 's' : ''}.
            </p>
          )}
          <p className="text-[11px] font-medium text-zinc-400">This action cannot be undone.</p>
        </div>

        <div className="flex gap-3 px-7 py-5 border-t border-zinc-100">
          <button onClick={onClose} className="flex-1 h-11 bg-white border border-zinc-200 text-zinc-600 font-bold text-sm uppercase tracking-widest hover:bg-zinc-50 transition-all">Cancel</button>
          <button onClick={onConfirm} className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white font-bold text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2">
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
const SubCategoryList = () => {
  const [subCategories, setSubCategories] = useState<SubCategoryData[]>(() => {
    const cached = getCache<SubCategoryCache>('sub-categories');
    return cached?.subCategories ?? [];
  });
  const [mainCategories, setMainCategories] = useState<MainCategory[]>(() => {
    const cached = getCache<SubCategoryCache>('sub-categories');
    return cached?.mainCategories ?? [];
  });
  const [isFetching, setIsFetching] = useState(() => getCache<SubCategoryCache>('sub-categories') === null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastCounter = useRef(0);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editTarget, setEditTarget] = useState<SubCategoryData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SubCategoryData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [entriesLimit, setEntriesLimit] = useState(10);

  const addToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = ++toastCounter.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const removeToast = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

  const fetchData = useCallback(async (forceRefresh = false) => {
    const cached = getCache<SubCategoryCache>('sub-categories');
    if (!forceRefresh && cached) {
      setSubCategories(cached.subCategories);
      setMainCategories(cached.mainCategories);
      return;
    }
    setIsFetching(true);
    try {
      const [subRes, mainRes] = await Promise.all([api.get('/sub-categories'), api.get('/categories')]);
      const toCache: SubCategoryCache = { subCategories: subRes.data, mainCategories: mainRes.data };
      setCache('sub-categories', toCache);
      setSubCategories(subRes.data.map((s: SubCategoryData) => ({ ...s, usedBy: s.usedBy ?? [] })));
      setMainCategories(mainRes.data);
    } catch (error) {
      console.error('Fetch error:', error);
      addToast('Failed to sync with database', 'error');
    } finally { setIsFetching(false); }
  }, [addToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const displayData = useMemo(() => {
    const sorted = [...subCategories].sort((a, b) => {
      const catCompare = (a.mainCategory ?? '').localeCompare(b.mainCategory ?? '');
      if (catCompare !== 0) return catCompare;
      return a.name.localeCompare(b.name);
    });
    const filtered = sorted.filter(sub =>
      sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sub.mainCategory ?? '').toLowerCase().includes(searchQuery.toLowerCase())
    );
    return entriesLimit === -1 ? filtered : filtered.slice(0, entriesLimit);
  }, [subCategories, searchQuery, entriesLimit]);

  const updateCache = (updated: SubCategoryData[]) => {
    const existing = getCache<SubCategoryCache>('sub-categories');
    if (existing) setCache('sub-categories', { ...existing, subCategories: updated });
  };

  const handleAddSuccess = (data: SubCategoryData) => {
    const updated = [data, ...subCategories];
    setSubCategories(updated);
    updateCache(updated);
    localStorage.removeItem('pos_menu_cache');
    addToast(`"${data.name}" has been added successfully.`);
  };

  const handleEditSuccess = (updatedSub: SubCategoryData) => {
    const updated = subCategories.map((s) => (s.id === updatedSub.id ? updatedSub : s));
    setSubCategories(updated);
    updateCache(updated);
    localStorage.removeItem('pos_menu_cache');
    addToast(`"${updatedSub.name}" has been updated successfully.`);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    try {
      await api.delete(`/sub-categories/${target.id}`);
      const updated = subCategories.filter((s) => s.id !== target.id);
      setSubCategories(updated);
      updateCache(updated);
      localStorage.removeItem('pos_menu_cache');
      addToast(`"${target.name}" has been deleted.`);
    } catch (err) {
      addToast(axios.isAxiosError(err) ? (err.response?.data?.message ?? 'Delete failed.') : 'Delete failed.', 'error');
    }
  };

  return (
    <>
      <ToastNotification toasts={toasts} onRemove={removeToast} />
      {showAddModal && <AddModal mainCategories={mainCategories} onClose={() => setShowAddModal(false)} onSuccess={handleAddSuccess} />}
      {editTarget && <EditModal subCategory={editTarget} mainCategories={mainCategories} onClose={() => setEditTarget(null)} onSuccess={handleEditSuccess} />}
      {deleteTarget && <DeleteModal subCategory={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDeleteConfirm} />}

      <div className="flex-1 bg-[#f4f2fb] h-full flex flex-col overflow-hidden">
        <TopNavbar />

        <div className="flex-1 overflow-y-auto p-5 md:p-7 flex flex-col gap-4">

          {/* ── Page Header ── */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Menu Items</p>
              <h1 className="text-lg font-bold text-[#1a0f2e] mt-0.5">Sub-Categories</h1>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="h-10.5 px-6 bg-[#3b2063] hover:bg-[#2a1647] text-white font-bold text-sm uppercase tracking-widest flex items-center gap-2 transition-colors active:scale-[0.98] rounded-[0.625rem]">
              <Plus size={15} strokeWidth={2.5} /> Add Sub-Category
            </button>
          </div>

          {/* ── Table Card ── */}
          <div className="flex-1 bg-white border border-zinc-200 overflow-hidden flex flex-col shadow-sm relative rounded-[0.625rem]">
            {isFetching && (
              <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center">
                <Loader2 className="animate-spin text-[#3b2063]" size={28} />
              </div>
            )}

            {/* Toolbar */}
            <div className="px-6 py-4 border-b border-zinc-100 flex flex-col md:flex-row justify-between items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Show</span>
                <select
                  value={entriesLimit}
                  onChange={(e) => setEntriesLimit(Number(e.target.value))}
                  className="border border-zinc-200 bg-white px-3 py-1.5 outline-none text-[#1a0f2e] font-semibold text-sm focus:border-[#3b2063] transition-colors">
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={-1}>All</option>
                </select>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">entries</span>
              </div>
              <div className="flex items-center gap-2">
                <Search size={14} className="text-zinc-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search sub-categories..."
                  className="border border-zinc-200 bg-[#f4f2fb] px-4 py-2 text-sm font-semibold text-[#1a0f2e] outline-none focus:border-[#3b2063] focus:bg-white w-56 transition-all placeholder:text-zinc-300"
                />
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
              {isFetching && subCategories.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-[11px] font-bold text-zinc-300 uppercase tracking-widest animate-pulse">Loading sub-categories...</p>
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead className="sticky top-0 bg-white z-10 border-b border-zinc-100">
                    <tr>
                      <th className="px-7 py-3.5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Sub-Category Name</th>
                      <th className="px-5 py-3.5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Main Category</th>
                      <th className="px-5 py-3.5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center">Items</th>
                      <th className="px-5 py-3.5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center w-20">Edit</th>
                      <th className="px-7 py-3.5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center w-20">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {displayData.length > 0 ? displayData.map((sub) => (
                      <tr key={sub.id} className="hover:bg-[#f4f2fb] transition-colors">
                        <td className="px-7 py-3.5">
                          <div className="flex items-center gap-2">
                            <Tag size={13} className="text-violet-400 shrink-0" />
                            <span className="text-sm font-bold text-[#1a0f2e]">{sub.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex flex-wrap gap-1">
                            {(sub.usedBy?.length ?? 0) > 0 ? sub.usedBy.map((cat) => (
                              <span key={cat} className="px-2.5 py-1 bg-[#f4f2fb] border border-violet-100 text-[10px] font-bold text-violet-600 uppercase tracking-wide">
                                {cat}
                              </span>
                            )) : (
                              <span className="text-sm font-medium text-zinc-400">{sub.mainCategory || '—'}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span className="text-sm font-bold text-[#1a0f2e] tabular-nums">{sub.itemCount}</span>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <button
                            onClick={() => setEditTarget(sub)}
                            className="w-9 h-9 inline-flex items-center justify-center bg-[#3b2063] hover:bg-[#2a1647] text-white transition-colors rounded-[0.625rem]"
                            title="Edit"
                          >
                            <Pencil size={14} strokeWidth={2} />
                          </button>
                        </td>
                        <td className="px-7 py-3.5 text-center">
                          <button
                            onClick={() => setDeleteTarget(sub)}
                            className="w-9 h-9 inline-flex items-center justify-center bg-white border border-red-200 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all rounded-[0.625rem]"
                            title="Delete"
                          >
                            <Trash2 size={14} strokeWidth={2} />
                          </button>
                        </td>
                      </tr>
                    )) : (
                      !isFetching && (
                        <tr>
                          <td colSpan={5} className="px-8 py-20 text-center">
                            <p className="text-[11px] font-bold text-zinc-300 uppercase tracking-widest">No sub-categories found</p>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer */}
            <div className="px-7 py-3.5 bg-white border-t border-zinc-100 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-[0.625rem] bg-emerald-400" />
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Synchronized</span>
              </div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                Showing {displayData.length} of {subCategories.length} sub-categories
              </p>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default SubCategoryList;