<<<<<<< HEAD
import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import TopNavbar from '../TopNavbar';
import { useToast } from '../../context/ToastContext';
=======
"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import axios from 'axios';
import TopNavbar from '../TopNavbar';
import api from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { Loader2, Plus, Edit3, Trash2 } from 'lucide-react';
import { getCache, setCache } from '../../utils/cache';
>>>>>>> origin/main

interface SubCategoryData {
  id: number;
  name: string;
  mainCategory: string;
  itemCount: number;
}

<<<<<<< HEAD
const MAIN_CATEGORIES = [
  'Add Ons Sinkers',
  'AFFORDA-BOWLS',
  'ALA CARTE SNACKS',
  'CHICKEN WINGS',
  'HOT DRINKS',
  'HOT COFFEE',
];

const SubCategoryList = () => {
  const { showToast } = useToast();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const [subCategoryName, setSubCategoryName] = useState('');
  const [selectedMainCategory, setSelectedMainCategory] = useState(MAIN_CATEGORIES[0]);
  const [editingSubCategory, setEditingSubCategory] = useState<SubCategoryData | null>(null);
  const [subCategoryToDelete, setSubCategoryToDelete] = useState<SubCategoryData | null>(null);

  const [subCategories, setSubCategories] = useState<SubCategoryData[]>([
    { id: 1, name: "12oz", mainCategory: "HOT DRINKS", itemCount: 4 },
    { id: 2, name: "12oz", mainCategory: "HOT COFFEE", itemCount: 4 },
    { id: 3, name: "4PC", mainCategory: "CHICKEN WINGS", itemCount: 6 },
    { id: 4, name: "6PC", mainCategory: "CHICKEN WINGS", itemCount: 6 },
    { id: 5, name: "8oz", mainCategory: "HOT DRINKS", itemCount: 3 },
  ]);

  // ── ADD ──
  const openAddModal = () => {
    setSubCategoryName('');
    setSelectedMainCategory(MAIN_CATEGORIES[0]);
    setIsAddModalOpen(true);
  };

  const handleAddSubCategory = () => {
    if (!subCategoryName.trim()) return;
    const newSub: SubCategoryData = {
      id: Date.now(),
      name: subCategoryName,
      mainCategory: selectedMainCategory,
      itemCount: 0,
    };
    setSubCategories([newSub, ...subCategories]);
    showToast(`Sub-category "${subCategoryName}" added successfully!`, 'success');
    setIsAddModalOpen(false);
    setSubCategoryName('');
    setSelectedMainCategory(MAIN_CATEGORIES[0]);
  };

  // ── EDIT ──
  const handleEditClick = (subCategory: SubCategoryData) => {
    setEditingSubCategory(subCategory);
    setSubCategoryName(subCategory.name);
    setSelectedMainCategory(subCategory.mainCategory);
    setIsEditModalOpen(true);
  };

  const handleUpdateSubCategory = () => {
    if (!editingSubCategory || !subCategoryName.trim()) return;
    setSubCategories(subCategories.map(sub =>
      sub.id === editingSubCategory.id
        ? { ...sub, name: subCategoryName, mainCategory: selectedMainCategory }
        : sub
    ));
    showToast(`Sub-category "${subCategoryName}" updated successfully!`, 'success');
    setIsEditModalOpen(false);
    setEditingSubCategory(null);
    setSubCategoryName('');
    setSelectedMainCategory(MAIN_CATEGORIES[0]);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingSubCategory(null);
    setSubCategoryName('');
    setSelectedMainCategory(MAIN_CATEGORIES[0]);
  };

  // ── DELETE ──
  const handleDeleteClick = (subCategory: SubCategoryData) => {
    setSubCategoryToDelete(subCategory);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (!subCategoryToDelete) return;
    setSubCategories(subCategories.filter(sub => sub.id !== subCategoryToDelete.id));
    showToast(`Sub-category "${subCategoryToDelete.name}" deleted successfully!`, 'error');
    setIsDeleteConfirmOpen(false);
    setSubCategoryToDelete(null);
  };

  const cancelDelete = () => {
    setIsDeleteConfirmOpen(false);
    setSubCategoryToDelete(null);
  };

  // ── Shared field renderer ──
  const renderFields = () => (
    <div className="space-y-4">
      <div>
        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Sub Category Name</label>
        <input
          type="text"
          value={subCategoryName}
          onChange={(e) => setSubCategoryName(e.target.value)}
          placeholder="e.g. 12oz, 6PC"
          className="w-full px-4 py-2 rounded-md border border-zinc-300 bg-zinc-50 text-slate-700 font-bold text-xs outline-none focus:border-[#3b2063] transition-all"
        />
      </div>
      <div>
        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Main Category</label>
        <select
          value={selectedMainCategory}
          onChange={(e) => setSelectedMainCategory(e.target.value)}
          className="w-full px-4 py-2 rounded-md border border-zinc-300 bg-zinc-50 text-slate-700 font-bold text-xs outline-none focus:border-[#3b2063] transition-all cursor-pointer"
        >
          {MAIN_CATEGORIES.map(cat => <option key={cat}>{cat}</option>)}
        </select>
      </div>
    </div>
  );

  return (
    <div className="flex-1 bg-[#f4f5f7] h-full flex flex-col overflow-hidden font-sans">
      <TopNavbar />

      <div className="flex-1 overflow-y-auto p-6 flex flex-col">

        {/* === ADD SUB-CATEGORY FORM SECTION === */}
        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden mb-6">
          <div className="bg-zinc-50 px-6 py-3 border-b border-zinc-200">
            <h2 className="text-[#3b2063] font-black text-xs uppercase tracking-[0.2em] text-center">Add Sub Category</h2>
          </div>
          <div className="p-6 flex justify-end">
            <button
              onClick={openAddModal}
              className="bg-[#3b2063] hover:bg-[#2a1745] text-white px-8 h-10 rounded-md font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-md"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add New
            </button>
          </div>
        </div>

        {/* === SUB-CATEGORY TABLE SECTION === */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-zinc-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-zinc-50/50">
            <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              <span>Show</span>
              <select className="border border-zinc-300 rounded bg-white px-2 py-1 outline-none text-slate-700">
                <option>10</option><option>25</option><option>50</option>
              </select>
              <span>entries</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Search:</span>
              <input type="text" className="border border-zinc-300 rounded-md bg-white px-3 py-1.5 text-xs outline-none focus:border-blue-500 shadow-sm w-64 font-bold text-slate-700" />
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-zinc-100 z-10 shadow-sm">
                <tr>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-600 uppercase tracking-widest border-b border-zinc-200">Sub Category Name</th>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-600 uppercase tracking-widest border-b border-zinc-200">Main Category</th>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-600 uppercase tracking-widest border-b border-zinc-200 text-center">Items</th>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-600 uppercase tracking-widest border-b border-zinc-200 text-center w-24">Edit</th>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-600 uppercase tracking-widest border-b border-zinc-200 text-center w-24">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {subCategories.map((sub, index) => (
                  <tr key={sub.id} className={`hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-zinc-50/30'}`}>
                    <td className="px-6 py-4 text-xs font-black text-[#3b2063] uppercase tracking-tight">{sub.name}</td>
                    <td className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase">{sub.mainCategory}</td>
                    <td className="px-6 py-4 text-xs font-black text-slate-700 text-center">{sub.itemCount}</td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => handleEditClick(sub)} className="px-3 py-1 bg-transparent text-blue-500 text-xs font-medium rounded hover:bg-zinc-200 transition-colors">
                        <Pencil className="w-5 h-5" />
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => handleDeleteClick(sub)} className="px-3 py-1 bg-transparent text-red-500 text-xs font-medium rounded hover:bg-zinc-200 transition-colors">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-zinc-50 border-t border-zinc-200 text-right text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
            Showing {subCategories.length} Sub Categories
=======
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
          <p className="text-xs font-bold text-slate-700">Are you sure you want to delete <span className="text-[#1e40af]">"{subCategory.name}"</span>?</p>
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
              className="bg-[#1e40af] hover:bg-[#1e3a8a] text-white px-6 h-10 rounded-md font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-md"
            >
              <Plus size={14} /> Add Sub-Category
            </button>
          </div>

          {/* Table */}
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden flex flex-col relative">
            {isFetching && (
              <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center">
                <Loader2 className="animate-spin text-[#1e40af]" size={32} />
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
>>>>>>> origin/main
          </div>
        </div>
      </div>

<<<<<<< HEAD
      {/* === ADD SUB-CATEGORY MODAL === */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-[#3b2063] px-6 py-4 flex justify-between items-center">
              <h2 className="text-white font-black text-xs uppercase tracking-[0.2em]">Add Sub Category</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-white/70 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              {renderFields()}
              <div className="flex gap-3 pt-6">
                <button
                  onClick={handleAddSubCategory}
                  className="flex-1 bg-[#3b2063] hover:bg-[#2a1745] text-white py-2 rounded-lg font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-md transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Add New
                </button>
                <button onClick={() => setIsAddModalOpen(false)} className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-500 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* === EDIT SUB-CATEGORY MODAL === */}
      {isEditModalOpen && editingSubCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-[#3b2063] px-6 py-4 flex justify-between items-center">
              <h2 className="text-white font-black text-xs uppercase tracking-[0.2em]">Edit Sub Category</h2>
              <button onClick={closeEditModal} className="text-white/70 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              {renderFields()}
              <div className="flex gap-3 pt-6">
                <button onClick={handleUpdateSubCategory} className="flex-1 bg-[#3b2063] hover:bg-[#2a1745] text-white py-2 rounded-lg font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-md transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  Update
                </button>
                <button onClick={closeEditModal} className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-500 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* === DELETE CONFIRMATION MODAL === */}
      {isDeleteConfirmOpen && subCategoryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-red-500 px-6 py-4 flex justify-between items-center">
              <h2 className="text-white font-black text-xs uppercase tracking-[0.2em]">Confirm Delete</h2>
              <button onClick={cancelDelete} className="text-white/70 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center bg-red-100">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-red-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-800">Delete Sub Category?</h3>
                <p className="text-sm text-slate-600">Are you sure you want to delete this sub category permanently?</p>
                <p className="text-sm font-black text-[#3b2063] uppercase">{subCategoryToDelete.name}</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={confirmDelete} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-md transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                  </svg>
                  Delete
                </button>
                <button onClick={cancelDelete} className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-500 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
=======
      <style>{`
        @keyframes modalIn {
          from { transform: translateY(-16px) scale(0.97); opacity: 0; }
          to   { transform: translateY(0) scale(1);    opacity: 1; }
        }
      `}</style>
    </>
>>>>>>> origin/main
  );
};

export default SubCategoryList;