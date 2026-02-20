"use client"

import { useState, useEffect, useCallback, useMemo } from 'react';
import TopNavbar from '../TopNavbar';
import api from '../../services/api';
import { isAxiosError } from 'axios';
import { useToast } from '../../hooks/useToast';
import { getCache, setCache, clearCache } from '../../utils/cache';
import { Trash2, AlertCircle } from 'lucide-react';

interface InventoryCategory {
  id: number;
  name: string;
  description: string;
  menu_items_count: number;
}

const InventoryCategoryList = () => {
  const { showToast } = useToast();
  const [categories, setCategories] = useState<InventoryCategory[]>(
    getCache<InventoryCategory[]>('categories') ?? []
  );
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

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
      showToast("Failed to load categories", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

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
      showToast("Category added successfully!", "success");
    } catch (err) {
      if (isAxiosError(err)) showToast(err.response?.data?.message || "Error adding category", "error");
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
      showToast("Category updated!", "success");
    } catch (err) {
      if (isAxiosError(err)) showToast("Update failed", "error");
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
      showToast("Category deleted", "success");
    } catch (err) {
      if (isAxiosError(err)) showToast(err.response?.data?.message || "Delete failed", "error");
    }
  };

  return (
    <div className="flex-1 bg-[#f4f5f7] h-full flex flex-col overflow-hidden font-sans relative">
      <TopNavbar />
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h1 className="text-xl font-black text-[#3b2063] uppercase tracking-widest leading-none">Category List</h1>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Total Categories: {categories.length}</p>
          </div>
          <button onClick={() => setIsAddModalOpen(true)} className="px-6 py-2 bg-[#10b981] text-white rounded-md font-bold text-[10px] uppercase tracking-widest shadow-sm hover:bg-[#0da673] transition-all active:scale-95">NEW CATEGORY</button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Search:</span>
              <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Find category..." className="border border-zinc-300 rounded-md bg-white px-3 py-1.5 text-xs outline-none focus:border-blue-500 shadow-sm w-64 font-bold text-slate-700" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200">
                  <th className="px-4 py-3 text-[10px] font-black text-slate-600 uppercase tracking-widest">Name</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-600 uppercase tracking-widest text-center">Description</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-600 uppercase tracking-widest text-center">Items</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-600 uppercase tracking-widest text-center w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {loading && categories.length === 0 ? (
                  <tr><td colSpan={4} className="py-20 text-center animate-pulse text-zinc-400 font-bold uppercase text-[10px]">Syncing Data...</td></tr>
                ) : filteredCategories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-blue-50/50 transition-colors group">
                    <td className="px-4 py-4 text-xs font-black text-[#3b2063] uppercase tracking-tight">{cat.name}</td>
                    <td className="px-4 py-4 text-xs font-bold text-zinc-400 text-center">{cat.description || '-'}</td>
                    <td className="px-4 py-4 text-xs font-black text-slate-700 text-center">{cat.menu_items_count}</td>
                    <td className="px-4 py-4 text-center flex gap-2 justify-center">
                      <button onClick={() => openEditModal(cat)} className="bg-[#1e40af] text-white p-2 rounded-lg hover:bg-blue-700 shadow-sm transition-all"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" /></svg></button>
                      <button onClick={() => openDeleteModal(cat)} className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 shadow-sm transition-all"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79" /></svg></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- ADD CATEGORY MODAL --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-10 animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-[#3b2063] font-black text-lg uppercase tracking-widest mb-6">Create New Category</h2>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 block">Category Name</label>
                <input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full bg-[#f8f6ff] border-none rounded-2xl px-4 py-3 text-sm font-bold text-[#3b2063] outline-none focus:ring-2 ring-purple-100" placeholder="e.g. Milk Tea" />
              </div>
              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 block">Description</label>
                <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="w-full bg-[#f8f6ff] border-none rounded-2xl px-4 py-3 text-sm font-bold text-[#3b2063] outline-none focus:ring-2 ring-purple-100 h-32 resize-none" placeholder="Optional description..." />
              </div>
              <div className="flex gap-4 mt-8">
                <button onClick={() => setIsAddModalOpen(false)} className="flex-1 py-4 text-zinc-400 font-black text-[10px] uppercase tracking-widest hover:text-zinc-600 transition-colors">Cancel</button>
                <button onClick={handleAddCategory} className="flex-2 py-4 bg-[#10b981] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-100 hover:bg-[#0da673] transition-all">Save Category</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- EDIT CATEGORY MODAL --- */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-10 animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-[#3b2063] font-black text-lg uppercase tracking-widest mb-6">Edit Category</h2>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 block">Name</label>
                <input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full bg-[#f8f6ff] border-none rounded-2xl px-4 py-3 text-sm font-bold text-[#3b2063] outline-none focus:ring-2 ring-purple-100" />
              </div>
              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 block">Description</label>
                <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="w-full bg-[#f8f6ff] border-none rounded-2xl px-4 py-3 text-sm font-bold text-[#3b2063] outline-none focus:ring-2 ring-purple-100 h-32 resize-none" />
              </div>
              <div className="flex gap-4 mt-8">
                <button onClick={() => setIsEditModalOpen(false)} className="flex-1 py-4 text-zinc-400 font-black text-[10px] uppercase tracking-widest hover:text-zinc-600 transition-colors">Cancel</button>
                <button onClick={handleUpdateCategory} className="flex-2 py-4 bg-[#3b2063] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-[#2d184b] transition-all">Update Category</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- DELETE CONFIRMATION MODAL --- */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-60 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                <Trash2 className="text-red-500" size={32} />
              </div>
              <h2 className="text-[#3b2063] font-black text-lg uppercase tracking-widest mb-2">Delete Category?</h2>
              <p className="text-zinc-400 text-xs font-bold leading-relaxed mb-6">
                Are you sure you want to delete <span className="text-red-500">"{deletingCategory?.name}"</span>? 
                This action cannot be undone and may affect items linked to this category.
              </p>
              
              {deletingCategory && deletingCategory.menu_items_count > 0 && (
                <div className="w-full bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-start gap-3 mb-6">
                  <AlertCircle className="text-amber-500 shrink-0" size={18} />
                  <p className="text-[10px] text-amber-700 font-bold text-left leading-tight uppercase tracking-tight">
                    Warning: There are {deletingCategory.menu_items_count} items currently assigned to this category.
                  </p>
                </div>
              )}

              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setIsDeleteModalOpen(false)} 
                  className="flex-1 py-3 bg-zinc-100 text-zinc-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteConfirm} 
                  className="flex-1 py-3 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-100 hover:bg-red-700 transition-all"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryCategoryList;