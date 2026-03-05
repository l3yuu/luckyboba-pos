"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import axios from 'axios';
import TopNavbar from '../TopNavbar';
import api from '../../services/api';
import { Loader2, Plus } from 'lucide-react';
import { getCache, setCache } from '../../utils/cache';

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

const dashboardFont = { fontFamily: "'Inter', sans-serif" };

// ─── Toast Component ──────────────────────────────────────────────────────────
function ToastNotification({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-9999 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 px-5 py-3 rounded-none shadow-2xl text-white text-[11px] font-bold uppercase tracking-widest pointer-events-auto border border-white/10 transition-all duration-300 animate-in slide-in-from-right-full ${toast.type === 'success' ? 'bg-[#1a0f2e]' : 'bg-red-600'}`}
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

// ─── Shared input class ───────────────────────────────────────────────────────
const inputCls = (hasError?: boolean) =>
  `w-full px-4 py-3 rounded-none border text-sm font-semibold outline-none transition-all bg-white text-[#1c1c1e] placeholder:text-zinc-400 focus:border-[#3b2063] focus:bg-white ${hasError ? 'border-red-400' : 'border-zinc-300'}`;

const selectCls = `w-full px-4 py-3 rounded-none border border-zinc-300 bg-white text-[#1c1c1e] font-semibold text-sm outline-none focus:border-[#3b2063] cursor-pointer`;

// ─── Add Modal ────────────────────────────────────────────────────────────────
function AddModal({ mainCategories, onClose, onSuccess }: {
  mainCategories: MainCategory[];
  onClose: () => void;
  onSuccess: (data: SubCategoryData) => void;
}) {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>(mainCategories[0]?.id ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ name?: string }>({});
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
    if (!name.trim()) { setErrors({ name: 'Sub-category name is required.' }); return; }
    if (!categoryId) { setErrors({ name: 'Please select a main category.' }); return; }
    setSubmitting(true);
    try {
      const response = await api.post('/sub-categories', { name: name.trim(), category_id: categoryId });
      onSuccess(response.data);
      onClose();
    } catch (err) {
      const msg = axios.isAxiosError(err) ? (err.response?.data?.message ?? 'Failed to add sub-category.') : 'Failed to add sub-category.';
      setErrors({ name: msg });
    } finally { setSubmitting(false); }
  };

  return (
    <div ref={overlayRef} onClick={handleBackdropClick} className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-none border border-zinc-200 shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" style={dashboardFont}>
        <div className="flex items-center justify-between px-7 py-5 border-b border-zinc-100">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">Menu Items</p>
            <h2 className="text-sm font-extrabold text-[#1c1c1e] mt-0.5">Add Sub-Category</h2>
          </div>
          <button onClick={onClose} className="text-zinc-300 hover:text-zinc-600 transition-colors p-1 text-lg leading-none">×</button>
        </div>

        <div className="px-7 py-6 flex flex-col gap-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Sub-Category Name <span className="text-red-400">*</span></label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setErrors({}); }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
              placeholder="e.g. UL, UM, SM"
              className={inputCls(!!errors.name)}
            />
            {errors.name && <p className="text-[10px] text-red-500 font-semibold mt-1">{errors.name}</p>}
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
          <button onClick={onClose} disabled={submitting} className="flex-1 h-11 bg-white border border-red-300 text-red-500 font-bold text-xs uppercase tracking-widest hover:bg-red-50 hover:border-red-400 transition-all disabled:opacity-50 rounded-none">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting} className="flex-1 h-11 bg-[#3b2063] text-white font-bold text-xs uppercase tracking-widest hover:bg-[#2a174a] transition-all disabled:opacity-60 flex items-center justify-center gap-2 rounded-none">
            {submitting ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</> : 'Add Sub-Category'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────
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
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => { if (e.target === overlayRef.current) onClose(); };

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
      const msg = axios.isAxiosError(err) ? (err.response?.data?.message ?? 'Failed to update sub-category.') : 'Failed to update sub-category.';
      setErrors({ name: msg });
    } finally { setSubmitting(false); }
  };

  return (
    <div ref={overlayRef} onClick={handleBackdropClick} className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-none border border-zinc-200 shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" style={dashboardFont}>
        <div className="flex items-center justify-between px-7 py-5 border-b border-zinc-100">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">Menu Items</p>
            <h2 className="text-sm font-extrabold text-[#1c1c1e] mt-0.5">Edit Sub-Category</h2>
          </div>
          <button onClick={onClose} className="text-zinc-300 hover:text-zinc-600 transition-colors p-1 text-lg leading-none">×</button>
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
            {errors.name && <p className="text-[10px] text-red-500 font-semibold mt-1">{errors.name}</p>}
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
          <button onClick={onClose} disabled={submitting} className="flex-1 h-11 bg-white border border-red-300 text-red-500 font-bold text-xs uppercase tracking-widest hover:bg-red-50 hover:border-red-400 transition-all rounded-none">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting} className="flex-1 h-11 bg-[#3b2063] text-white font-bold text-xs uppercase tracking-widest hover:bg-[#2a174a] transition-all disabled:opacity-60 flex items-center justify-center gap-2 rounded-none">
            {submitting ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</> : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Modal ─────────────────────────────────────────────────────────────
function DeleteModal({ subCategory, onClose, onConfirm }: {
  subCategory: SubCategoryData;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => { if (e.target === overlayRef.current) onClose(); };

  return (
    <div ref={overlayRef} onClick={handleBackdropClick} className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-none border border-zinc-200 shadow-2xl w-full max-w-sm flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" style={dashboardFont}>
        <div className="flex items-center justify-between px-7 py-5 border-b border-zinc-100">
          <h2 className="text-sm font-extrabold text-[#1c1c1e]">Delete Sub-Category</h2>
          <button onClick={onClose} className="text-zinc-300 hover:text-zinc-600 transition-colors p-1 text-lg leading-none">×</button>
        </div>

        <div className="px-7 py-7 flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 bg-red-50 border border-red-100 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-red-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
          </div>
          <p className="text-sm font-bold text-[#1c1c1e]">Delete <span className="text-[#3b2063]">"{subCategory.name}"</span>?</p>
          {subCategory.itemCount > 0 && (
            <p className="text-[11px] font-bold text-amber-500">⚠ This sub-category has {subCategory.itemCount} linked item{subCategory.itemCount > 1 ? 's' : ''}.</p>
          )}
          <p className="text-[11px] text-zinc-400 font-semibold">This action cannot be undone.</p>
        </div>

        <div className="flex gap-3 px-7 py-5 border-t border-zinc-100">
          <button onClick={onClose} className="flex-1 h-11 bg-white border border-red-300 text-red-500 font-bold text-xs uppercase tracking-widest hover:bg-red-50 hover:border-red-400 transition-all rounded-none">Cancel</button>
          <button onClick={onConfirm} className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center rounded-none">Delete</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
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
      setSubCategories(subRes.data);
      setMainCategories(mainRes.data);
    } catch (error) {
      console.error('Fetch error:', error);
      addToast('Failed to sync with database', 'error');
    } finally { setIsFetching(false); }
  }, [addToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const displayData = useMemo(() => {
    const sorted = [...subCategories].sort((a, b) => a.name.localeCompare(b.name));
    const filtered = sorted.filter(sub =>
      sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.mainCategory.toLowerCase().includes(searchQuery.toLowerCase())
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
    addToast(`"${data.name}" has been added successfully.`);
  };

  const handleEditSuccess = (updatedSub: SubCategoryData) => {
    const updated = subCategories.map((s) => (s.id === updatedSub.id ? updatedSub : s));
    setSubCategories(updated);
    updateCache(updated);
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
      addToast(`"${target.name}" has been deleted.`);
    } catch (err) {
      const msg = axios.isAxiosError(err) ? (err.response?.data?.message ?? 'Delete failed.') : 'Delete failed.';
      addToast(msg, 'error');
    }
  };

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');`}</style>
      <ToastNotification toasts={toasts} onRemove={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />
      {showAddModal && <AddModal mainCategories={mainCategories} onClose={() => setShowAddModal(false)} onSuccess={handleAddSuccess} />}
      {editTarget && <EditModal subCategory={editTarget} mainCategories={mainCategories} onClose={() => setEditTarget(null)} onSuccess={handleEditSuccess} />}
      {deleteTarget && <DeleteModal subCategory={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDeleteConfirm} />}

      <div className="flex-1 bg-[#f3f0ff] h-full flex flex-col overflow-hidden" style={dashboardFont}>
        <TopNavbar />
        <div className="flex-1 overflow-y-auto p-5 md:p-7 flex flex-col gap-4">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">Menu Items</p>
              <h1 className="text-lg font-extrabold text-[#1c1c1e] mt-0.5">Sub-Categories</h1>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="h-11 px-7 bg-[#3b2063] hover:bg-[#2a174a] text-white font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-colors rounded-none shadow-sm"
            >
              <Plus size={14} strokeWidth={2.5} /> Add Sub-Category
            </button>
          </div>

          {/* Table card */}
          <div className="flex-1 bg-white border border-zinc-200 overflow-hidden flex flex-col shadow-sm rounded-none relative">
            {isFetching && (
              <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center">
                <Loader2 className="animate-spin text-[#3b2063]" size={28} />
              </div>
            )}

            {/* Toolbar */}
            <div className="px-6 py-4 border-b border-zinc-100 flex flex-col md:flex-row justify-between items-center gap-3 bg-white">
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
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Search:</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search sub-categories..."
                  className="border border-zinc-300 bg-white px-4 py-2 text-sm outline-none focus:border-[#3b2063] w-56 font-semibold text-[#1c1c1e] rounded-none placeholder:text-zinc-400"
                />
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-white z-10 border-b-2 border-zinc-100">
                  <tr>
                    <th className="px-7 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Sub-Category Name</th>
                    <th className="px-5 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Main Category</th>
                    <th className="px-5 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center">Items</th>
                    <th className="px-5 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center w-24">Edit</th>
                    <th className="px-7 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center w-24">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {displayData.length > 0 ? displayData.map((sub) => (
                    <tr key={sub.id} className="hover:bg-[#f9f8ff] transition-colors">
                      <td className="px-7 py-3.5">
                        <span className="text-[13px] font-extrabold text-[#3b2063]">{sub.name}</span>
                      </td>
                        <td className="px-5 py-3.5">
                          <div className="flex flex-wrap gap-1">
                            {sub.usedBy.length > 0 ? sub.usedBy.map((cat) => (
                              <span key={cat} className="px-2.5 py-1 bg-zinc-50 border border-zinc-200 text-[10px] font-bold text-zinc-600 uppercase tracking-wide rounded-none">
                                {cat}
                              </span>
                            )) : (
                              <span className="px-2.5 py-1 bg-zinc-50 border border-zinc-200 text-[10px] font-bold text-zinc-400 uppercase tracking-wide rounded-none">
                                {sub.mainCategory}
                              </span>
                            )}
                          </div>
                        </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="text-[13px] font-extrabold text-[#1c1c1e]">{sub.itemCount}</span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <button
                          onClick={() => setEditTarget(sub)}
                          className="h-9 w-9 inline-flex items-center justify-center bg-[#3b2063] hover:bg-[#2a174a] text-white transition-colors rounded-none"
                          title="Edit"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                          </svg>
                        </button>
                      </td>
                      <td className="px-7 py-3.5 text-center">
                        <button
                          onClick={() => setDeleteTarget(sub)}
                          className="h-9 w-9 inline-flex items-center justify-center bg-white border border-red-300 text-red-500 hover:bg-red-50 hover:border-red-400 transition-colors rounded-none"
                          title="Delete"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                          </svg>
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
            </div>

            {/* Footer */}
            <div className="px-7 py-4 bg-white border-t border-zinc-100 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Synchronized</span>
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