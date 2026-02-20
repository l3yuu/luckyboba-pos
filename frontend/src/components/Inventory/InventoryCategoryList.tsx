"use client"

import { useState, useEffect, useCallback, useMemo } from 'react';
import TopNavbar from '../TopNavbar';
import api from '../../services/api';
import { isAxiosError } from 'axios';
import { useToast } from '../../hooks/useToast';
import { getCache, setCache, clearCache } from '../../utils/cache';

interface InventoryCategory {
  id: number;
  name: string;
  description: string;
  menu_items_count: number;
}

const InventoryCategoryList = () => {
<<<<<<< HEAD
  const { showToast } = useToast();
  const [categories, setCategories] = useState<InventoryCategory[]>(
    getCache<InventoryCategory[]>('categories') ?? []
  );
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
=======
  const [categoryName, setCategoryName] = useState('');
  const [description, setDescription] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<InventoryCategory | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<InventoryCategory | null>(null);
>>>>>>> 70dfafceca36eff4d5d0100ece9da485ea52bc70

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [editingCategory, setEditingCategory] = useState<InventoryCategory | null>(null);
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
    cat?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat?.description?.toLowerCase().includes(searchTerm.toLowerCase())
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

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await api.delete(`/categories/${id}`);
      clearCache('categories');
      await fetchCategories(true);
      showToast("Category deleted", "success");
    } catch (err) {
      if (isAxiosError(err)) showToast(err.response?.data?.message || "Delete failed", "error");
    }
  };

  const handleEditClick = (category: InventoryCategory) => {
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
  };

  const handleDeleteClick = (category: InventoryCategory) => {
    setCategoryToDelete(category);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (!categoryToDelete) return;
    setCategories(categories.filter(cat => cat.id !== categoryToDelete.id));
    setIsDeleteConfirmOpen(false);
    setCategoryToDelete(null);
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
<<<<<<< HEAD
                    <td className="px-4 py-4 text-xs font-black text-slate-700 text-center">{cat.menu_items_count}</td>
                    <td className="px-4 py-4 text-center flex gap-2 justify-center">
                      <button onClick={() => openEditModal(cat)} className="bg-[#1e40af] text-white p-2 rounded-lg hover:bg-blue-700 shadow-sm transition-all"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" /></svg></button>
                      <button onClick={() => handleDelete(cat.id)} className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 shadow-sm transition-all"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79" /></svg></button>
=======
                    <td className="px-4 py-4 text-xs font-black text-slate-700 text-center">{cat.itemCount}</td>
                    <td className="px-4 py-4 text-center">
                      <button 
                        onClick={() => handleEditClick(cat)}
                        className="bg-[#1e40af] hover:bg-blue-700 text-white p-2 rounded-lg transition-colors shadow-sm active:scale-95">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                        </svg>
                      </button>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button 
                        onClick={() => handleDeleteClick(cat)}
                        className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors shadow-sm active:scale-95">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                      </button>
>>>>>>> 70dfafceca36eff4d5d0100ece9da485ea52bc70
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

<<<<<<< HEAD
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-[#3b2063]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-10">
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
                <button onClick={() => setIsAddModalOpen(false)} className="flex-1 py-4 text-zinc-400 font-black text-[10px] uppercase tracking-widest">Cancel</button>
                <button onClick={handleAddCategory} className="flex-2 py-4 bg-[#10b981] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-100 hover:bg-[#0da673] transition-all">Save Category</button>
=======
      {/* === EDIT CATEGORY MODAL === */}
      {isEditModalOpen && editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-[#1e40af] px-6 py-4 flex justify-between items-center">
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
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 rounded-md border border-zinc-300 bg-zinc-50 text-slate-700 font-bold text-xs outline-none focus:border-blue-500 transition-all h-24 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={handleUpdateCategory}
                  className="flex-1 bg-[#1e40af] hover:bg-blue-700 text-white py-2 rounded-lg font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-md transition-all"
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
>>>>>>> 70dfafceca36eff4d5d0100ece9da485ea52bc70
              </div>
            </div>
          </div>
        </div>
      )}

<<<<<<< HEAD
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-[#3b2063]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-10">
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
=======
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
>>>>>>> 70dfafceca36eff4d5d0100ece9da485ea52bc70
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryCategoryList;