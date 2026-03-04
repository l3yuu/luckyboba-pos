"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import TopNavbar from '../TopNavbar';
import api from '../../services/api';
import { isAxiosError } from 'axios';
import { getCache, setCache, clearCache } from '../../utils/cache';

const dashboardFont = { fontFamily: "'Inter', sans-serif" };

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

// ─── Toast Component ──────────────────────────────────────────────────────────
function ToastNotification({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
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

interface InventoryCategory {
  id: number;
  name: string;
  description: string;
  menu_items_count: number;
}

const InventoryCategoryList = () => {
  const [categories, setCategories] = useState<InventoryCategory[]>(
    getCache<InventoryCategory[]>('categories') ?? []
  );
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastCounter = useRef(0);

  const addToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = ++toastCounter.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 4000);
  };
  const removeToast = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [editingCategory, setEditingCategory] = useState<InventoryCategory | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<InventoryCategory | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const fetchCategories = useCallback(async (forceRefresh = false) => {
    const cached = getCache<InventoryCategory[]>('categories');
    if (!forceRefresh && cached) {
      setCategories(cached);
      return;
    }

    try {
      setLoading(true);
      const response = await api.get('/categories');
      setCache('categories', response.data);
      setCategories(response.data);
    } catch (err) {
      console.error(err);
      addToast("Failed to load categories", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const filteredCategories = useMemo(() => {
    return categories.filter(cat => 
      cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cat.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [categories, searchTerm]);

  const handleAddCategory = async () => {
    if (!newName) return;
    try {
      await api.post('/categories', { name: newName, description: newDesc });
      setNewName('');
      setNewDesc('');
      setIsAddModalOpen(false);
      clearCache('categories');
      await fetchCategories(true);
      addToast("Category added successfully!", "success");
    } catch (err) {
      if (isAxiosError(err)) addToast(err.response?.data?.message || "Error adding category", "error");
    }
  };

  const openEditModal = (cat: InventoryCategory) => {
    setEditingCategory(cat);
    setEditName(cat.name);
    setEditDesc(cat.description);
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (cat: InventoryCategory) => {
    setDeletingCategory(cat);
    setIsDeleteModalOpen(true);
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !editName) return;
    try {
      await api.patch(`/categories/${editingCategory.id}`, { name: editName, description: editDesc });
      setIsEditModalOpen(false);
      clearCache('categories');
      await fetchCategories(true);
      addToast("Category updated!", "success");
    } catch (err) {
      if (isAxiosError(err)) addToast("Update failed", "error");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCategory) return;
    try {
      await api.delete(`/categories/${deletingCategory.id}`);
      setIsDeleteModalOpen(false);
      setDeletingCategory(null);
      clearCache('categories');
      await fetchCategories(true);
      addToast("Category deleted", "success");
    } catch (err) {
      if (isAxiosError(err)) addToast(err.response?.data?.message || "Delete failed", "error");
    }
  };

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');`}</style>
      <ToastNotification toasts={toasts} onRemove={removeToast} />
      <div className="flex-1 bg-[#f3f0ff] h-full flex flex-col overflow-hidden font-sans relative" style={dashboardFont}>
        <TopNavbar />
        <div className="flex-1 overflow-y-auto p-5 md:p-7 flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">Inventory</p>
              <h1 className="text-lg font-extrabold text-[#1c1c1e] mt-0.5">Categories</h1>
            </div>
            <button 
              onClick={() => setIsAddModalOpen(true)} 
              className="h-11 px-7 bg-[#3b2063] hover:bg-[#2a174a] text-white font-bold text-xs uppercase tracking-widest transition-colors rounded-none shadow-sm"
            >
              NEW CATEGORY
            </button>
          </div>

          {/* Table card */}
          <div className="flex-1 bg-white border border-zinc-200 overflow-hidden flex flex-col shadow-sm rounded-none">
            {/* Table toolbar */}
            <div className="px-6 py-4 border-b border-zinc-100 flex flex-col md:flex-row justify-between items-center gap-3 bg-white">
              <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                <span>Search:</span>
                <input 
                  type="text" 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  placeholder="Find category..." 
                  className="border border-zinc-300 bg-white px-4 py-2 text-sm outline-none focus:border-[#3b2063] w-56 font-semibold text-[#1c1c1e] rounded-none placeholder:text-zinc-400" 
                />
              </div>
            </div>
            {/* Table */}
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-white z-10 border-b-2 border-zinc-100">
                  <tr>
                    <th className="px-7 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Name</th>
                    <th className="px-7 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Description</th>
                    <th className="px-7 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center">Items</th>
                    <th className="px-7 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center w-24">Edit</th>
                    <th className="px-7 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center w-24">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {loading && categories.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-20 text-center">
                        <p className="text-[11px] font-bold text-zinc-300 uppercase tracking-widest animate-pulse">Syncing Data...</p>
                      </td>
                    </tr>
                  ) : filteredCategories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-[#f9f8ff] transition-colors">
                      <td className="px-7 py-3.5">
                        <span className="text-[13px] font-extrabold text-[#3b2063]">{cat.name}</span>
                      </td>
                      <td className="px-7 py-3.5">
                        <span className="text-[12px] font-semibold text-zinc-500">{cat.description || '—'}</span>
                      </td>
                      <td className="px-7 py-3.5 text-center">
                        <span className="text-[13px] font-extrabold text-[#1c1c1e]">{cat.menu_items_count}</span>
                      </td>
                      <td className="px-7 py-3.5 text-center">
                        <button 
                          onClick={() => openEditModal(cat)} 
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
                          onClick={() => openDeleteModal(cat)} 
                          className="h-9 w-9 inline-flex items-center justify-center bg-white border border-red-300 text-red-500 hover:bg-red-50 hover:border-red-400 transition-colors rounded-none"
                          title="Delete"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
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
                Showing {filteredCategories.length} of {categories.length} categories
              </p>
            </div>
          </div>
        </div>

        {/* --- ADD CATEGORY MODAL --- */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-none border border-zinc-200 shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" style={dashboardFont}>
              <div className="flex items-center justify-between px-7 py-5 border-b border-zinc-100">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">Inventory</p>
                  <h2 className="text-sm font-extrabold text-[#1c1c1e] mt-0.5">Create New Category</h2>
                </div>
                <button onClick={() => setIsAddModalOpen(false)} className="text-zinc-300 hover:text-zinc-600 transition-colors p-1 text-lg leading-none">×</button>
              </div>

              <div className="px-7 py-6 flex flex-col gap-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Category Name</label>
                  <input 
                    autoFocus 
                    value={newName} 
                    onChange={(e) => setNewName(e.target.value)} 
                    className="w-full px-4 py-3 rounded-none border text-sm font-semibold outline-none transition-all bg-white text-[#1c1c1e] placeholder:text-zinc-400 focus:border-[#3b2063] focus:bg-white" 
                    placeholder="e.g. Milk Tea" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Description</label>
                  <textarea 
                    value={newDesc} 
                    onChange={(e) => setNewDesc(e.target.value)} 
                    className="w-full px-4 py-3 rounded-none border text-sm font-semibold outline-none transition-all bg-white text-[#1c1c1e] placeholder:text-zinc-400 focus:border-[#3b2063] focus:bg-white h-32 resize-none" 
                    placeholder="Optional description..." 
                  />
                </div>
              </div>

              <div className="flex gap-3 px-7 py-5 border-t border-zinc-100">
                <button 
                  onClick={() => setIsAddModalOpen(false)} 
                  className="flex-1 h-11 bg-white border border-red-300 text-red-500 font-bold text-xs uppercase tracking-widest hover:bg-red-50 hover:border-red-400 transition-all rounded-none"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddCategory} 
                  className="flex-1 h-11 bg-[#3b2063] text-white font-bold text-xs uppercase tracking-widest hover:bg-[#2a174a] transition-all rounded-none"
                >
                  Save Category
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- EDIT CATEGORY MODAL --- */}
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-none border border-zinc-200 shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" style={dashboardFont}>
              <div className="flex items-center justify-between px-7 py-5 border-b border-zinc-100">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">Inventory</p>
                  <h2 className="text-sm font-extrabold text-[#1c1c1e] mt-0.5">Edit Category</h2>
                </div>
                <button onClick={() => setIsEditModalOpen(false)} className="text-zinc-300 hover:text-zinc-600 transition-colors p-1 text-lg leading-none">×</button>
              </div>

              <div className="px-7 py-6 flex flex-col gap-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Name</label>
                  <input 
                    value={editName} 
                    onChange={(e) => setEditName(e.target.value)} 
                    className="w-full px-4 py-3 rounded-none border text-sm font-semibold outline-none transition-all bg-white text-[#1c1c1e] placeholder:text-zinc-400 focus:border-[#3b2063] focus:bg-white" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Description</label>
                  <textarea 
                    value={editDesc} 
                    onChange={(e) => setEditDesc(e.target.value)} 
                    className="w-full px-4 py-3 rounded-none border text-sm font-semibold outline-none transition-all bg-white text-[#1c1c1e] placeholder:text-zinc-400 focus:border-[#3b2063] focus:bg-white h-32 resize-none" 
                  />
                </div>
              </div>

              <div className="flex gap-3 px-7 py-5 border-t border-zinc-100">
                <button 
                  onClick={() => setIsEditModalOpen(false)} 
                  className="flex-1 h-11 bg-white border border-red-300 text-red-500 font-bold text-xs uppercase tracking-widest hover:bg-red-50 hover:border-red-400 transition-all rounded-none"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleUpdateCategory} 
                  className="flex-1 h-11 bg-[#3b2063] text-white font-bold text-xs uppercase tracking-widest hover:bg-[#2a174a] transition-all rounded-none"
                >
                  Update Category
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- DELETE CONFIRMATION MODAL --- */}
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-none border border-zinc-200 shadow-2xl w-full max-w-sm flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" style={dashboardFont}>
              <div className="flex items-center justify-between px-7 py-5 border-b border-zinc-100">
                <h2 className="text-sm font-extrabold text-[#1c1c1e]">Delete Category</h2>
                <button onClick={() => setIsDeleteModalOpen(false)} className="text-zinc-300 hover:text-zinc-600 transition-colors p-1 text-lg leading-none">×</button>
              </div>

              <div className="px-7 py-7 flex flex-col items-center gap-3 text-center">
                <div className="w-12 h-12 bg-red-50 border border-red-100 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-red-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                  </svg>
                </div>
                <p className="text-sm font-bold text-[#1c1c1e]">Delete <span className="text-[#3b2063]">"{deletingCategory?.name}"</span>?</p>
                {deletingCategory && deletingCategory.menu_items_count > 0 && (
                  <p className="text-[11px] font-bold text-amber-500">⚠ This category has {deletingCategory.menu_items_count} linked item{deletingCategory.menu_items_count > 1 ? 's' : ''}.</p>
                )}
                <p className="text-[11px] text-zinc-400 font-semibold">This action cannot be undone.</p>
              </div>

              <div className="flex gap-3 px-7 py-5 border-t border-zinc-100">
                <button 
                  onClick={() => setIsDeleteModalOpen(false)} 
                  className="flex-1 h-11 bg-white border border-red-300 text-red-500 font-bold text-xs uppercase tracking-widest hover:bg-red-50 hover:border-red-400 transition-all rounded-none"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteConfirm} 
                  className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center rounded-none"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default InventoryCategoryList;