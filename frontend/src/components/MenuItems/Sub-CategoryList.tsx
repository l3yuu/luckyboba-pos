"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import axios from 'axios';
import TopNavbar from '../TopNavbar';
import api from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { Loader2, Plus, Edit3, Trash2 } from 'lucide-react';
import { getCache, setCache } from '../../utils/cache';

interface SubCategoryData {
  id: number;
  name: string;
  mainCategory: string;
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

// ─── Add Modal ────────────────────────────────────────────────────────────────
function AddModal({
  mainCategories,
  onClose,
  onSuccess,
}: {
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
      const response = await api.post('/sub-categories', {
        name: name.trim(),
        category_id: categoryId,
      });
      onSuccess(response.data);
      onClose();
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data?.message ?? 'Failed to add sub-category.')
        : 'Failed to add sub-category.';
      setErrors({ name: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-[modalIn_0.25s_ease-out]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 bg-zinc-50">
          <div>
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Add Sub-Category</h2>
            <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">Fill in the details below</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-zinc-200 hover:bg-zinc-300 flex items-center justify-center text-zinc-500 hover:text-zinc-800 transition-all text-sm font-bold">×</button>
        </div>
        <div className="px-6 py-5 flex flex-col gap-4">
          <div>
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 block">Sub-Category Name <span className="text-red-400">*</span></label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setErrors({}); }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
              placeholder="e.g. UL, UM, SM"
              className={`w-full px-3 py-2 rounded-md border bg-zinc-50 text-slate-700 font-bold text-xs outline-none focus:border-blue-500 h-10 ${errors.name ? 'border-red-400 bg-red-50' : 'border-zinc-300'}`}
            />
            {errors.name && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 block">Main Category <span className="text-red-400">*</span></label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-md border border-zinc-300 bg-zinc-50 text-slate-700 font-bold text-xs outline-none focus:border-blue-500 h-10 cursor-pointer"
            >
              {mainCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-zinc-200 bg-zinc-50">
          <button onClick={onClose} disabled={submitting} className="flex-1 h-10 rounded-md border border-zinc-300 bg-white text-zinc-600 font-bold text-[10px] uppercase tracking-widest hover:bg-zinc-100 transition-all disabled:opacity-50">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting} className="flex-1 h-10 rounded-md bg-[#1e40af] hover:bg-[#1e3a8a] text-white font-bold text-[10px] uppercase tracking-widest transition-all shadow-sm disabled:opacity-60 flex items-center justify-center gap-2">
            {submitting ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</> : 'Add Sub-Category'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────
function EditModal({
  subCategory,
  mainCategories,
  onClose,
  onSuccess,
}: {
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

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) onClose();
  };

  const handleSubmit = async () => {
    if (!name.trim()) { setErrors({ name: 'Sub-category name is required.' }); return; }
    if (!categoryId) { setErrors({ name: 'Please select a main category.' }); return; }
    setSubmitting(true);
    try {
      const response = await api.put(`/sub-categories/${subCategory.id}`, {
        name: name.trim(),
        category_id: categoryId,
      });
      
      // FIX: Find the main category object to get the name for the UI
      const selectedMainCat = mainCategories.find(c => c.id === categoryId);
      
      // FIX: Merge logic to ensure 'mainCategory' name and 'itemCount' are not lost
      onSuccess({ 
        ...subCategory, 
        ...response.data,
        mainCategory: selectedMainCat ? selectedMainCat.name : subCategory.mainCategory 
      });
      
      onClose();
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data?.message ?? 'Failed to update sub-category.')
        : 'Failed to update sub-category.';
      setErrors({ name: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-[modalIn_0.25s_ease-out]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 bg-zinc-50">
          <div>
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Edit Sub-Category</h2>
            <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">Update the details below</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-zinc-200 hover:bg-zinc-300 flex items-center justify-center text-zinc-500 hover:text-zinc-800 transition-all text-sm font-bold">×</button>
        </div>
        <div className="px-6 py-5 flex flex-col gap-4">
          <div>
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 block">Sub-Category Name <span className="text-red-400">*</span></label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setErrors({}); }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
              placeholder="e.g. UL, UM, SM"
              className={`w-full px-3 py-2 rounded-md border bg-zinc-50 text-slate-700 font-bold text-xs outline-none focus:border-blue-500 h-10 ${errors.name ? 'border-red-400 bg-red-50' : 'border-zinc-300'}`}
            />
            {errors.name && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 block">Main Category <span className="text-red-400">*</span></label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-md border border-zinc-300 bg-zinc-50 text-slate-700 font-bold text-xs outline-none focus:border-blue-500 h-10 cursor-pointer"
            >
              {mainCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-zinc-200 bg-zinc-50">
          <button onClick={onClose} disabled={submitting} className="flex-1 h-10 rounded-md border border-zinc-300 bg-white text-zinc-600 font-bold text-[10px] uppercase tracking-widest hover:bg-zinc-100 transition-all disabled:opacity-50">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting} className="flex-1 h-10 rounded-md bg-[#1e40af] hover:bg-[#1e3a8a] text-white font-bold text-[10px] uppercase tracking-widest transition-all shadow-sm disabled:opacity-60 flex items-center justify-center gap-2">
            {submitting ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</> : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Modal ─────────────────────────────────────────────────────────────
function DeleteModal({
  subCategory,
  onClose,
  onConfirm,
}: {
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

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden animate-[modalIn_0.25s_ease-out]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 bg-zinc-50">
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Delete Sub-Category</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-zinc-200 hover:bg-zinc-300 flex items-center justify-center text-zinc-500 hover:text-zinc-800 transition-all text-sm font-bold">×</button>
        </div>
        <div className="px-6 py-6 flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <Trash2 size={22} className="text-red-600" />
          </div>
          <p className="text-xs font-bold text-slate-700">Are you sure you want to delete <span className="text-[#3b2063]">"{ subCategory.name}"</span>?</p>
          {subCategory.itemCount > 0 && (
            <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">⚠ This sub-category has {subCategory.itemCount} linked item{subCategory.itemCount > 1 ? 's' : ''}.</p>
          )}
          <p className="text-[10px] text-zinc-400 font-semibold">This action cannot be undone.</p>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-zinc-200 bg-zinc-50">
          <button onClick={onClose} className="flex-1 h-10 rounded-md border border-zinc-300 bg-white text-zinc-600 font-bold text-[10px] uppercase tracking-widest hover:bg-zinc-100 transition-all">Cancel</button>
          <button onClick={onConfirm} className="flex-1 h-10 rounded-md bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] uppercase tracking-widest transition-all shadow-sm">Delete</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
const SubCategoryList = () => {
  const { showToast } = useToast();

  const [subCategories, setSubCategories] = useState<SubCategoryData[]>(() => {
    const cached = getCache<SubCategoryCache>('sub-categories');
    return cached?.subCategories ?? [];
  });
  const [mainCategories, setMainCategories] = useState<MainCategory[]>(() => {
    const cached = getCache<SubCategoryCache>('sub-categories');
    return cached?.mainCategories ?? [];
  });
  const [isFetching, setIsFetching] = useState(() => getCache<SubCategoryCache>('sub-categories') === null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editTarget, setEditTarget] = useState<SubCategoryData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SubCategoryData | null>(null);

  // ── Fetch ──
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
        subCategories: subRes.data,
        mainCategories: mainRes.data,
      };
      setCache('sub-categories', toCache);
      setSubCategories(subRes.data);
      setMainCategories(mainRes.data);
    } catch (error) {
      console.error('Fetch error:', error);
      showToast('Failed to sync with database', 'error');
    } finally {
      setIsFetching(false);
    }
  }, [showToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // --- ALPHABETICAL SORTING ---
  // This ensures items stay in order even after adding or editing
  const sortedSubCategories = useMemo(() => {
    return [...subCategories].sort((a, b) => a.name.localeCompare(b.name));
  }, [subCategories]);

  // ── Cache helper ──
  const updateCache = (updated: SubCategoryData[]) => {
    const existing = getCache<SubCategoryCache>('sub-categories');
    if (existing) setCache('sub-categories', { ...existing, subCategories: updated });
  };

  // ── Add success ──
  const handleAddSuccess = (data: SubCategoryData) => {
    const updated = [data, ...subCategories];
    setSubCategories(updated);
    updateCache(updated);
    showToast(`"${data.name}" has been added successfully.`, 'success');
  };

  // ── Edit success ──
  const handleEditSuccess = (updatedSub: SubCategoryData) => {
    const updated = subCategories.map((s) => (s.id === updatedSub.id ? updatedSub : s));
    setSubCategories(updated);
    updateCache(updated);
    showToast(`"${updatedSub.name}" has been updated successfully.`, 'success');
  };

  // ── Delete confirm ──
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    try {
      await api.delete(`/sub-categories/${target.id}`);
      const updated = subCategories.filter((s) => s.id !== target.id);
      setSubCategories(updated);
      updateCache(updated);
      showToast(`"${target.name}" has been deleted.`, 'success');
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data?.message ?? 'Delete failed. It may have linked items.')
        : 'Delete failed.';
      showToast(msg, 'error');
    }
  };

  return (
    <>
      {showAddModal && (
        <AddModal
          mainCategories={mainCategories}
          onClose={() => setShowAddModal(false)}
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

      <div className="flex-1 bg-[#f4f5f7] h-full flex flex-col overflow-hidden font-sans text-slate-700">
        <TopNavbar />
        <div className="flex-1 overflow-y-auto p-6 flex flex-col">

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-sm font-black text-slate-800 uppercase tracking-widest">Sub-Categories</h1>
              <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">{subCategories.length} total sub-categories</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-[#3b2063] hover:bg-[#2a1647] text-white px-6 h-10 rounded-md font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-md"
            >
              <Plus size={14} /> Add Sub-Category
            </button>
          </div>

          {/* Table */}
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden flex flex-col relative">
            {isFetching && (
              <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center">
                <Loader2 className="animate-spin text-[#3b2063]" size={32} />
              </div>
            )}
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-zinc-100 z-10 shadow-sm">
                  <tr>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-600 uppercase tracking-widest border-b border-zinc-200">Sub-Category Name</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-600 uppercase tracking-widest border-b border-zinc-200">Main Category</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-600 uppercase tracking-widest border-b border-zinc-200 text-center">Items</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-600 uppercase tracking-widest border-b border-zinc-200 text-center w-24">Edit</th>
                    <th className="px-6 py-3 text-[10px] font-black text-slate-600 uppercase tracking-widest border-b border-zinc-200 text-center w-24">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {sortedSubCategories.length > 0 ? (
                    sortedSubCategories.map((sub, index) => (
                      <tr key={sub.id} className={`hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-zinc-50/30'}`}>
                        <td className="px-6 py-4 text-xs font-black text-[#3b2063] uppercase tracking-tight">{sub.name}</td>
                        <td className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase">{sub.mainCategory}</td>
                        <td className="px-6 py-4 text-xs font-black text-slate-700 text-center">{sub.itemCount}</td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => setEditTarget(sub)}
                            className="bg-[#1e40af] hover:bg-blue-700 text-white p-2 rounded-lg active:scale-95 transition-colors shadow-sm"
                          >
                            <Edit3 size={14} />
                          </button>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => setDeleteTarget(sub)}
                            className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg active:scale-95 transition-colors shadow-sm"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    !isFetching && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-zinc-400 font-bold text-xs uppercase">
                          No sub-categories found
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="p-3 bg-zinc-50 border-t border-zinc-200 text-right text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              Showing {subCategories.length} Sub-Categories
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from { transform: translateY(-16px) scale(0.97); opacity: 0; }
          to   { transform: translateY(0) scale(1);    opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default SubCategoryList;