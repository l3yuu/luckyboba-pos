<<<<<<< HEAD
import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import TopNavbar from '../TopNavbar';
import { useToast } from '../../context/ToastContext';
=======
"use client"

import { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import TopNavbar from '../TopNavbar';
import api from '../../services/api';
>>>>>>> origin/main

interface CategoryData {
  id: number;
  name: string;
  description: string;
<<<<<<< HEAD
  itemCount: number;
}

const CategoryList = () => {
  const { showToast } = useToast();
  const [categoryName, setCategoryName] = useState('');
  const [description, setDescription] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryData | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryData | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Initial data based on reference image
  const [categories, setCategories] = useState<CategoryData[]>([
    { id: 1, name: "Add Ons Sinkers", description: "", itemCount: 22 },
    { id: 2, name: "AFFORDA-BOWLS", description: "", itemCount: 7 },
    { id: 3, name: "ALA CARTE SNACKS", description: "", itemCount: 10 },
  ]);

  const handleAddCategory = () => {
    if (!categoryName) return;
    const newCategory: CategoryData = {
      id: Date.now(),
      name: categoryName,
      description: description,
      itemCount: 0
    };
    setCategories([...categories, newCategory]);
    setCategoryName('');
    setDescription('');
    setShowAddModal(false);
    showToast(`Category "${newCategory.name}" has been added successfully`, 'success');
  };

  const handleEditClick = (category: CategoryData) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setDescription(category.description);
    setIsEditModalOpen(true);
  };

  const handleUpdateCategory = () => {
    if (!editingCategory || !categoryName) return;
    
    setCategories(categories.map(cat => 
      cat.id === editingCategory.id 
        ? { ...cat, name: categoryName, description: description }
        : cat
    ));
    
    setIsEditModalOpen(false);
    setEditingCategory(null);
    setCategoryName('');
    setDescription('');
    showToast(`Category "${categoryName}" has been updated successfully`, 'success');
  };

  const handleDeleteClick = (category: CategoryData) => {
    setCategoryToDelete(category);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (!categoryToDelete) return;
    const deletedName = categoryToDelete.name;
    setCategories(categories.filter(cat => cat.id !== categoryToDelete.id));
    setIsDeleteConfirmOpen(false);
    setCategoryToDelete(null);
    showToast(`Category "${deletedName}" has been deleted`, 'error');
  };

  const cancelDelete = () => {
    setIsDeleteConfirmOpen(false);
    setCategoryToDelete(null);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingCategory(null);
    setCategoryName('');
    setDescription('');
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setCategoryName('');
    setDescription('');
  };

  return (
    <div className="flex-1 bg-[#f4f5f7] h-full flex flex-col overflow-hidden font-sans">
      <TopNavbar />

      <div className="flex-1 overflow-y-auto p-6 flex flex-col">
        {/* === HEADER SECTION === */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
          <button 
            onClick={() => setShowAddModal(true)}
            className="w-full xl:w-auto bg-[#3b2063] hover:bg-[#2a1745] text-white px-8 h-10 rounded-md font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add New
          </button>
        </div>

        {/* === CATEGORY TABLE SECTION === */}
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
                  <th className="px-6 py-3 text-[10px] font-black text-slate-600 uppercase tracking-widest border-b border-zinc-200">Name</th>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-600 uppercase tracking-widest border-b border-zinc-200">Description</th>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-600 uppercase tracking-widest border-b border-zinc-200 text-center">Items</th>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-600 uppercase tracking-widest border-b border-zinc-200 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {categories.map((cat, index) => (
                  <tr key={cat.id} className={`hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-zinc-50/30'}`}>
                    <td className="px-6 py-4 text-xs font-black text-[#3b2063] uppercase tracking-tight">{cat.name}</td>
                    <td className="px-6 py-4 text-xs font-bold text-zinc-400">{cat.description || '-'}</td>
                    <td className="px-6 py-4 text-xs font-black text-slate-700 text-center">{cat.itemCount}</td>
                    <td className="px-6 py-4 text-center flex justify-center gap-2">
                      <button
                        onClick={() => handleEditClick(cat)}
                        className="px-3 py-1 bg-transparent text-blue-500 text-xs font-medium rounded hover:bg-zinc-200 transition-colors"
                      >
                        <Pencil className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(cat)}
                        className="px-3 py-1 bg-transparent text-red-500 text-xs font-medium rounded hover:bg-zinc-200 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-zinc-50 border-t border-zinc-200 text-right text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
            Showing {categories.length} Categories
=======
  menu_items_count: number;
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

// ─── Toast Component ─────────────────────────────────────────────────────────
function ToastNotification({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-9999 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-white text-xs font-bold uppercase tracking-widest pointer-events-auto
            transition-all duration-300 animate-[slideIn_0.3s_ease-out]
            ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}
        >
          <span className="text-base">{toast.type === 'success' ? '✓' : '✕'}</span>
          {toast.message}
          <button
            onClick={() => onRemove(toast.id)}
            className="ml-2 opacity-70 hover:opacity-100 transition-opacity text-sm leading-none"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Add Modal ────────────────────────────────────────────────────────────────
function AddModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (name: string, data: CategoryData) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
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
    if (!name.trim()) {
      setErrors({ name: 'Category name is required.' });
      return;
    }
    setSubmitting(true);
    try {
      const response = await api.post('/categories', {
        name: name.trim(),
        description: description.trim(),
      });
      onSuccess(name.trim(), response.data);
      onClose();
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data?.message ?? 'Failed to add category. Name may already exist.')
        : 'Failed to add category.';
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
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Add Category</h2>
            <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">Fill in the details below</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-zinc-200 hover:bg-zinc-300 flex items-center justify-center text-zinc-500 hover:text-zinc-800 transition-all text-sm font-bold">×</button>
        </div>
        <div className="px-6 py-5 flex flex-col gap-4">
          <div>
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 block">Category Name <span className="text-red-400">*</span></label>
            <input autoFocus type="text" value={name} onChange={(e) => { setName(e.target.value); setErrors({}); }} onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }} placeholder="e.g. Milk Tea" className={`w-full px-3 py-2 rounded-md border bg-zinc-50 text-slate-700 font-bold text-xs outline-none focus:border-blue-500 h-10 ${errors.name ? 'border-red-400 bg-red-50' : 'border-zinc-300'}`} />
            {errors.name && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 block">Description</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }} placeholder="Optional" className="w-full px-3 py-2 rounded-md border border-zinc-300 bg-zinc-50 text-slate-700 font-bold text-xs outline-none focus:border-blue-500 h-10" />
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-zinc-200 bg-zinc-50">
          <button onClick={onClose} disabled={submitting} className="flex-1 h-10 rounded-md border border-zinc-300 bg-white text-zinc-600 font-bold text-[10px] uppercase tracking-widest hover:bg-zinc-100 transition-all disabled:opacity-50">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting} className="flex-1 h-10 rounded-md bg-[#1e40af] hover:bg-[#1e3a8a] text-white font-bold text-[10px] uppercase tracking-widest transition-all shadow-sm disabled:opacity-60 flex items-center justify-center gap-2">
            {submitting ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</> : 'Add Category'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────
function EditModal({ category, onClose, onSuccess }: { category: CategoryData; onClose: () => void; onSuccess: (updated: CategoryData) => void; }) {
  const [name, setName] = useState(category.name);
  const [description, setDescription] = useState(category.description || '');
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
    if (!name.trim()) { setErrors({ name: 'Category name is required.' }); return; }
    setSubmitting(true);
    try {
      const response = await api.put(`/categories/${category.id}`, { name: name.trim(), description: description.trim() });
      onSuccess(response.data);
      onClose();
    } catch (err) {
      const msg = axios.isAxiosError(err) ? (err.response?.data?.message ?? 'Update failed.') : 'Update failed.';
      setErrors({ name: msg });
    } finally { setSubmitting(false); }
  };

  return (
    <div ref={overlayRef} onClick={handleBackdropClick} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-[modalIn_0.25s_ease-out]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 bg-zinc-50">
          <div><h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Edit Category</h2><p className="text-[10px] text-zinc-400 font-semibold mt-0.5">Update details</p></div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-zinc-200 hover:bg-zinc-300 flex items-center justify-center text-zinc-500 hover:text-zinc-800 transition-all text-sm font-bold">×</button>
        </div>
        <div className="px-6 py-5 flex flex-col gap-4">
          <div><label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 block">Category Name <span className="text-red-400">*</span></label><input type="text" value={name} onChange={(e) => { setName(e.target.value); setErrors({}); }} className={`w-full px-3 py-2 rounded-md border bg-zinc-50 text-slate-700 font-bold text-xs outline-none focus:border-blue-500 h-10 ${errors.name ? 'border-red-400 bg-red-50' : 'border-zinc-300'}`} />{errors.name && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.name}</p>}</div>
          <div><label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 block">Description</label><input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 rounded-md border border-zinc-300 bg-zinc-50 text-slate-700 font-bold text-xs outline-none focus:border-blue-500 h-10" /></div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-zinc-200 bg-zinc-50">
          <button onClick={onClose} disabled={submitting} className="flex-1 h-10 rounded-md border border-zinc-300 bg-white text-zinc-600 font-bold text-[10px] uppercase tracking-widest hover:bg-zinc-100 transition-all">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting} className="flex-1 h-10 rounded-md bg-[#1e40af] hover:bg-[#1e3a8a] text-white font-bold text-[10px] uppercase tracking-widest transition-all shadow-sm flex items-center justify-center gap-2">{submitting ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</> : 'Save Changes'}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Modal ─────────────────────────────────────────────────────────────
function DeleteModal({ category, onClose, onConfirm }: { category: CategoryData; onClose: () => void; onConfirm: () => void; }) {
  const overlayRef = useRef<HTMLDivElement>(null);
  useEffect(() => { const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); }; window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler); }, [onClose]);
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => { if (e.target === overlayRef.current) onClose(); };
  return (
    <div ref={overlayRef} onClick={handleBackdropClick} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden animate-[modalIn_0.25s_ease-out]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 bg-zinc-50"><h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Delete Category</h2><button onClick={onClose} className="w-8 h-8 rounded-full bg-zinc-200 hover:bg-zinc-300 flex items-center justify-center text-zinc-500 hover:text-zinc-800 transition-all text-sm font-bold">×</button></div>
        <div className="px-6 py-6 flex flex-col items-center gap-3 text-center"><div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-red-600"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg></div><p className="text-xs font-bold text-slate-700">Are you sure you want to delete <span className="text-[#1e40af]">"{category.name}"</span>?</p>{category.menu_items_count > 0 && <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">⚠ This category has {category.menu_items_count} linked menu item{category.menu_items_count > 1 ? 's' : ''}.</p>}<p className="text-[10px] text-zinc-400 font-semibold">This action cannot be undone.</p></div>
        <div className="flex gap-3 px-6 py-4 border-t border-zinc-200 bg-zinc-50"><button onClick={onClose} className="flex-1 h-10 rounded-md border border-zinc-300 bg-white text-zinc-600 font-bold text-[10px] uppercase tracking-widest hover:bg-zinc-100 transition-all">Cancel</button><button onClick={onConfirm} className="flex-1 h-10 rounded-md bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] uppercase tracking-widest transition-all shadow-sm flex items-center justify-center">Delete</button></div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
const CategoryList = () => {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTarget, setEditTarget] = useState<CategoryData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CategoryData | null>(null);
  
  // New States for Search and Limit
  const [searchQuery, setSearchQuery] = useState('');
  const [entriesLimit, setEntriesLimit] = useState(10);
  
  const toastCounter = useRef(0);

  // ── Toast helpers ──
  const addToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = ++toastCounter.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 4000);
  };
  const removeToast = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  // ── Fetch ──
  const fetchCategories = async () => {
    const cachedData = localStorage.getItem('luckyboba_categories_cache');
    if (cachedData) {
      setCategories(JSON.parse(cachedData));
      setLoading(false);
    }
    try {
      const response = await api.get('/categories');
      const freshData = response.data;
      setCategories(freshData);
      localStorage.setItem('luckyboba_categories_cache', JSON.stringify(freshData));
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  // ── ALPHABETICAL SORTING & FILTERING ──
  // This logic ensures the list is ALWAYS sorted alphabetically, even after add/edit
  const displayData = useMemo(() => {
    // 1. Sort the entire dataset alphabetically by name
    const sorted = [...categories].sort((a, b) => a.name.localeCompare(b.name));

    // 2. Filter based on search query
    const filtered = sorted.filter(cat => 
        cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // 3. Apply Limit
    return entriesLimit === -1 ? filtered : filtered.slice(0, entriesLimit);
  }, [categories, searchQuery, entriesLimit]);

  // ── Handlers ──
  const handleAddSuccess = (_name: string, data: CategoryData) => {
    setCategories(prev => [...prev, data]);
    addToast(`"${data.name}" has been added successfully.`);
  };

// ── Edit success ──
  const handleEditSuccess = (updated: CategoryData) => {
    setCategories(prev => prev.map((cat) => 
      // Use the spread operator to ensure we keep any fields 
      // (like description or menu_items_count) that might be missing in the response
      cat.id === updated.id ? { ...cat, ...updated } : cat
    ));
    
    // Refresh cache
    const cachedData = localStorage.getItem('luckyboba_categories_cache');
    if (cachedData) {
        const parsed = JSON.parse(cachedData);
        const updatedCache = parsed.map((cat: CategoryData) => 
            cat.id === updated.id ? { ...cat, ...updated } : cat
        );
        localStorage.setItem('luckyboba_categories_cache', JSON.stringify(updatedCache));
    }

    addToast(`"${updated.name}" has been updated successfully.`);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    try {
      await api.delete(`/categories/${target.id}`);
      setCategories(prev => prev.filter((cat) => cat.id !== target.id));
      addToast(`"${target.name}" has been deleted.`);
    } catch (err) {
      const msg = axios.isAxiosError(err) ? (err.response?.data?.message ?? 'Delete failed.') : 'Delete failed.';
      addToast(msg, 'error');
    }
  };

  return (
    <>
      <ToastNotification toasts={toasts} onRemove={removeToast} />
      {showAddModal && <AddModal onClose={() => setShowAddModal(false)} onSuccess={handleAddSuccess} />}
      {editTarget && <EditModal category={editTarget} onClose={() => setEditTarget(null)} onSuccess={handleEditSuccess} />}
      {deleteTarget && <DeleteModal category={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDeleteConfirm} />}

      <div className="flex-1 bg-[#f4f5f7] h-full flex flex-col overflow-hidden font-sans">
        <TopNavbar />
        <div className="flex-1 overflow-y-auto p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-sm font-black text-slate-800 uppercase tracking-widest">Categories</h1>
              <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">{categories.length} total categories</p>
            </div>
            <button onClick={() => setShowAddModal(true)} className="bg-[#1e40af] hover:bg-[#1e3a8a] text-white px-6 h-10 rounded-md font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              Add Category
            </button>
          </div>

          <div className="flex-1 bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-zinc-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-zinc-50/50">
              <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                <span>Show</span>
                <select value={entriesLimit} onChange={(e) => setEntriesLimit(Number(e.target.value))} className="border border-zinc-300 rounded bg-white px-2 py-1 outline-none text-slate-700">
                  <option value={10}>10</option><option value={25}>25</option><option value={50}>50</option><option value={-1}>All</option>
                </select>
                <span>entries</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Search:</span>
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search categories..." className="border border-zinc-300 rounded-md bg-white px-3 py-1.5 text-xs outline-none focus:border-blue-500 shadow-sm w-64 font-bold text-slate-700" />
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              {loading && categories.length === 0 ? (
                <div className="p-10 text-center font-bold text-zinc-400 uppercase tracking-widest text-xs animate-pulse">Loading Categories...</div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-zinc-100 z-10 shadow-sm">
                    <tr>
                      <th className="px-6 py-3 text-[10px] font-black text-slate-600 uppercase tracking-widest border-b border-zinc-200">Name</th>
                      <th className="px-6 py-3 text-[10px] font-black text-slate-600 uppercase tracking-widest border-b border-zinc-200">Description</th>
                      <th className="px-6 py-3 text-[10px] font-black text-slate-600 uppercase tracking-widest border-b border-zinc-200 text-center">Items</th>
                      <th className="px-6 py-3 text-[10px] font-black text-slate-600 uppercase tracking-widest border-b border-zinc-200 text-center w-24">Edit</th>
                      <th className="px-6 py-3 text-[10px] font-black text-slate-600 uppercase tracking-widest border-b border-zinc-200 text-center w-24">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {displayData.map((cat, index) => (
                      <tr key={cat.id} className={`hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-zinc-50/30'}`}>
                        <td className="px-6 py-4 text-xs font-black text-[#3b2063] uppercase tracking-tight">{cat.name}</td>
                        <td className="px-6 py-4 text-xs font-bold text-zinc-400">{cat.description || '-'}</td>
                        <td className="px-6 py-4 text-xs font-black text-slate-700 text-center">{cat.menu_items_count}</td>
                        <td className="px-6 py-4 text-center"><button onClick={() => setEditTarget(cat)} className="bg-[#1e40af] hover:bg-blue-700 text-white p-2 rounded-lg transition-colors shadow-sm active:scale-95"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" /></svg></button></td>
                        <td className="px-6 py-4 text-center"><button onClick={() => setDeleteTarget(cat)} className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors shadow-sm active:scale-95"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="p-3 bg-zinc-50 border-t border-zinc-200 text-right text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              Showing {displayData.length} of {categories.length} Categories
            </div>
>>>>>>> origin/main
          </div>
        </div>
      </div>

<<<<<<< HEAD
      {/* === ADD CATEGORY MODAL === */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-[#3b2063] px-6 py-4 flex justify-between items-center">
              <h2 className="text-white font-black text-xs uppercase tracking-[0.2em]">Add Category</h2>
              <button onClick={closeAddModal} className="text-white/70 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Category Name</label>
                <input 
                  type="text" 
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full px-4 py-2 rounded-md border border-zinc-300 bg-zinc-50 text-slate-700 font-bold text-xs outline-none focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Description</label>
                <input 
                  type="text" 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 rounded-md border border-zinc-300 bg-zinc-50 text-slate-700 font-bold text-xs outline-none focus:border-blue-500 transition-all"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={handleAddCategory}
                  className="flex-1 bg-[#3b2063] hover:bg-[#2a1745] text-white py-2 rounded-lg font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-md transition-all"
                >
                  Add
                </button>
                <button 
                  onClick={closeAddModal}
                  className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-500 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* === EDIT CATEGORY MODAL === */}
      {isEditModalOpen && editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-[#3b2063] px-6 py-4 flex justify-between items-center">
              <h2 className="text-white font-black text-xs uppercase tracking-[0.2em]">Edit Category</h2>
              <button onClick={closeEditModal} className="text-white/70 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Category Name</label>
                <input 
                  type="text" 
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full px-4 py-2 rounded-md border border-zinc-300 bg-zinc-50 text-slate-700 font-bold text-xs outline-none focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Description</label>
                <input 
                  type="text" 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 rounded-md border border-zinc-300 bg-zinc-50 text-slate-700 font-bold text-xs outline-none focus:border-blue-500 transition-all"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={handleUpdateCategory}
                  className="flex-1 bg-[#3b2063] hover:bg-[#2a1745] text-white py-2 rounded-lg font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-md transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  Update
                </button>
                <button 
                  onClick={closeEditModal}
                  className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-500 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* === DELETE CONFIRMATION MODAL === */}
      {isDeleteConfirmOpen && categoryToDelete && (
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
                <h3 className="text-lg font-bold text-slate-800">Delete Category?</h3>
                <p className="text-sm text-slate-600">Are you sure you want to delete this category permanently?</p>
                <p className="text-sm font-black text-[#3b2063] uppercase">{categoryToDelete.name}</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={confirmDelete}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-md transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                  </svg>
                  Delete
                </button>
                <button 
                  onClick={cancelDelete}
                  className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-500 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all"
                >
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
        @keyframes slideIn { from { transform: translateX(120%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes modalIn { from { transform: translateY(-16px) scale(0.97); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
      `}</style>
    </>
>>>>>>> origin/main
  );
};

export default CategoryList;