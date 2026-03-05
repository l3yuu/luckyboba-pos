"use client"

import { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import TopNavbar from '../TopNavbar';
import api from '../../services/api';

interface CategoryData {
  id: number;
  name: string;
  type: string;
  description: string;
  menu_items_count: number;
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

// ─── Add Modal ────────────────────────────────────────────────────────────────
function AddModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (name: string, data: CategoryData) => void; }) {
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
    if (!name.trim()) { setErrors({ name: 'Category name is required.' }); return; }
    setSubmitting(true);
    try {
      const response = await api.post('/categories', { name: name.trim(), description: description.trim() });
      onSuccess(name.trim(), response.data);
      onClose();
    } catch (err) {
      const msg = axios.isAxiosError(err) ? (err.response?.data?.message ?? 'Failed to add category.') : 'Failed to add category.';
      setErrors({ name: msg });
    } finally { setSubmitting(false); }
  };

  return (
    <div ref={overlayRef} onClick={handleBackdropClick} className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-none border border-zinc-200 shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" style={dashboardFont}>
        <div className="flex items-center justify-between px-7 py-5 border-b border-zinc-100">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">Menu Items</p>
            <h2 className="text-sm font-extrabold text-[#1c1c1e] mt-0.5">Add Category</h2>
          </div>
          <button onClick={onClose} className="text-zinc-300 hover:text-zinc-600 transition-colors p-1 text-lg leading-none">×</button>
        </div>

        <div className="px-7 py-6 flex flex-col gap-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Category Name <span className="text-red-400">*</span></label>
            <input autoFocus type="text" value={name} onChange={(e) => { setName(e.target.value); setErrors({}); }} onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }} placeholder="e.g. Milk Tea" className={inputCls(!!errors.name)} />
            {errors.name && <p className="text-[10px] text-red-500 font-semibold mt-1">{errors.name}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Description</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }} placeholder="Optional" className={inputCls()} />
          </div>
        </div>

        <div className="flex gap-3 px-7 py-5 border-t border-zinc-100">
          <button onClick={onClose} disabled={submitting} className="flex-1 h-11 bg-white border border-red-300 text-red-500 font-bold text-xs uppercase tracking-widest hover:bg-red-50 hover:border-red-400 transition-all disabled:opacity-50 rounded-none">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting} className="flex-1 h-11 bg-[#3b2063] text-white font-bold text-xs uppercase tracking-widest hover:bg-[#2a174a] transition-all disabled:opacity-60 flex items-center justify-center gap-2 rounded-none">
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
    <div ref={overlayRef} onClick={handleBackdropClick} className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-none border border-zinc-200 shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" style={dashboardFont}>
        <div className="flex items-center justify-between px-7 py-5 border-b border-zinc-100">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">Menu Items</p>
            <h2 className="text-sm font-extrabold text-[#1c1c1e] mt-0.5">Edit Category</h2>
          </div>
          <button onClick={onClose} className="text-zinc-300 hover:text-zinc-600 transition-colors p-1 text-lg leading-none">×</button>
        </div>

        <div className="px-7 py-6 flex flex-col gap-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Category Name <span className="text-red-400">*</span></label>
            <input type="text" value={name} onChange={(e) => { setName(e.target.value); setErrors({}); }} className={inputCls(!!errors.name)} />
            {errors.name && <p className="text-[10px] text-red-500 font-semibold mt-1">{errors.name}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Description</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className={inputCls()} />
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
function DeleteModal({ category, onClose, onConfirm }: { category: CategoryData; onClose: () => void; onConfirm: () => void; }) {
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
          <h2 className="text-sm font-extrabold text-[#1c1c1e]">Delete Category</h2>
          <button onClick={onClose} className="text-zinc-300 hover:text-zinc-600 transition-colors p-1 text-lg leading-none">×</button>
        </div>

        <div className="px-7 py-7 flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 bg-red-50 border border-red-100 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-red-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
          </div>
          <p className="text-sm font-bold text-[#1c1c1e]">Delete <span className="text-[#3b2063]">"{category.name}"</span>?</p>
          {category.menu_items_count > 0 && (
            <p className="text-[11px] font-bold text-amber-500">⚠ This category has {category.menu_items_count} linked item{category.menu_items_count > 1 ? 's' : ''}.</p>
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
const CategoryList = () => {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTarget, setEditTarget] = useState<CategoryData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CategoryData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [entriesLimit, setEntriesLimit] = useState(10);
  const toastCounter = useRef(0);

  const addToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = ++toastCounter.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 4000);
  };
  const removeToast = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const fetchCategories = async () => {
    const cachedData = localStorage.getItem('luckyboba_categories_cache');
    if (cachedData) { setCategories(JSON.parse(cachedData)); setLoading(false); }
    try {
      const response = await api.get('/categories');
      const freshData = response.data;
      setCategories(freshData);
      localStorage.setItem('luckyboba_categories_cache', JSON.stringify(freshData));
    } catch (error) { console.error('Error fetching categories:', error); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCategories(); }, []);

  const displayData = useMemo(() => {
    const sorted = [...categories].sort((a, b) => a.name.localeCompare(b.name));
    const filtered = sorted.filter(cat =>
      (cat.name ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cat.type ?? '').toLowerCase().includes(searchQuery.toLowerCase())
    );
    return entriesLimit === -1 ? filtered : filtered.slice(0, entriesLimit);
  }, [categories, searchQuery, entriesLimit]);

  const handleAddSuccess = (_name: string, data: CategoryData) => {
    setCategories(prev => [...prev, data]);
    addToast(`"${data.name}" has been added successfully.`);
  };

  const handleEditSuccess = (updated: CategoryData) => {
    setCategories(prev => prev.map((cat) => cat.id === updated.id ? { ...cat, ...updated } : cat));
    const cachedData = localStorage.getItem('luckyboba_categories_cache');
    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      const updatedCache = parsed.map((cat: CategoryData) => cat.id === updated.id ? { ...cat, ...updated } : cat);
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
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');`}</style>
      <ToastNotification toasts={toasts} onRemove={removeToast} />
      {showAddModal && <AddModal onClose={() => setShowAddModal(false)} onSuccess={handleAddSuccess} />}
      {editTarget && <EditModal category={editTarget} onClose={() => setEditTarget(null)} onSuccess={handleEditSuccess} />}
      {deleteTarget && <DeleteModal category={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDeleteConfirm} />}

      <div className="flex-1 bg-[#f3f0ff] h-full flex flex-col overflow-hidden" style={dashboardFont}>
        <TopNavbar />
        <div className="flex-1 overflow-y-auto p-5 md:p-7 flex flex-col gap-4">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">Menu Items</p>
              <h1 className="text-lg font-extrabold text-[#1c1c1e] mt-0.5">Categories</h1>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="h-11 px-7 bg-[#3b2063] hover:bg-[#2a174a] text-white font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-colors rounded-none shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              Add Category
            </button>
          </div>

          {/* Table card */}
          <div className="flex-1 bg-white border border-zinc-200 overflow-hidden flex flex-col shadow-sm rounded-none">

            {/* Table toolbar */}
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
                  placeholder="Search categories..."
                  className="border border-zinc-300 bg-white px-4 py-2 text-sm outline-none focus:border-[#3b2063] w-56 font-semibold text-[#1c1c1e] rounded-none placeholder:text-zinc-400"
                />
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
              {loading && categories.length === 0 ? (
                <div className="p-10 text-center font-bold text-zinc-400 uppercase tracking-widest text-xs animate-pulse">Loading categories...</div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-white z-10 border-b-2 border-zinc-100">
                    <tr>
                      <th className="px-7 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Name</th>
                      <th className="px-5 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Description</th>
                      <th className="px-5 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center">Items</th>
                      <th className="px-5 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center w-24">Edit</th>
                      <th className="px-7 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center w-24">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {displayData.length > 0 ? displayData.map((cat) => (
                      <tr key={cat.id} className="hover:bg-[#f9f8ff] transition-colors">
                        <td className="px-7 py-3.5">
                          <span className="text-[13px] font-extrabold text-[#3b2063]">{cat.name}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-[12px] font-semibold text-zinc-500">{cat.description || '—'}</span>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span className="text-[13px] font-extrabold text-[#1c1c1e]">{cat.menu_items_count}</span>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <button
                            onClick={() => setEditTarget(cat)}
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
                            onClick={() => setDeleteTarget(cat)}
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
                      <tr>
                        <td colSpan={5} className="px-8 py-20 text-center">
                          <p className="text-[11px] font-bold text-zinc-300 uppercase tracking-widest">No categories found</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer */}
            <div className="px-7 py-4 bg-white border-t border-zinc-100 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Synchronized</span>
              </div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                Showing {displayData.length} of {categories.length} categories
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CategoryList;