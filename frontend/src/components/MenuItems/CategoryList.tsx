import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import TopNavbar from '../TopNavbar';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

interface CategoryData {
  id: number;
  name: string;
  description: string;
  itemCount: number;
  menu_items_count?: number;
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden">
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
            <input autoFocus type="text" value={name} onChange={(e) => { setName(e.target.value); setErrors({}); }} onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }} placeholder="e.g. Milk Tea" className={`w-full px-3 py-2 rounded-md border bg-zinc-50 text-slate-700 font-bold text-xs outline-none focus:border-[#3b2063] h-10 ${errors.name ? 'border-red-400 bg-red-50' : 'border-zinc-300'}`} />
            {errors.name && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 block">Description</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }} placeholder="Optional" className="w-full px-3 py-2 rounded-md border border-zinc-300 bg-zinc-50 text-slate-700 font-bold text-xs outline-none focus:border-[#3b2063] h-10" />
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-zinc-200 bg-zinc-50">
          <button onClick={onClose} disabled={submitting} className="flex-1 h-10 rounded-md border border-zinc-300 bg-white text-zinc-600 font-bold text-[10px] uppercase tracking-widest hover:bg-zinc-100 transition-all disabled:opacity-50">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting} className="flex-1 h-10 rounded-md bg-[#3b2063] hover:bg-[#2a1647] text-white font-bold text-[10px] uppercase tracking-widest transition-all shadow-sm disabled:opacity-60 flex items-center justify-center gap-2">
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden">
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
          <button onClick={handleSubmit} disabled={submitting} className="flex-1 h-10 rounded-md bg-[#3b2063] hover:bg-[#2a1647] text-white font-bold text-[10px] uppercase tracking-widest transition-all shadow-sm flex items-center justify-center gap-2">{submitting ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</> : 'Save Changes'}</button>
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
    <div ref={overlayRef} onClick={handleBackdropClick} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 bg-zinc-50">
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Delete Category</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-zinc-200 hover:bg-zinc-300 flex items-center justify-center text-zinc-500 hover:text-zinc-800 transition-all text-sm font-bold">×</button>
        </div>
        <div className="px-6 py-6 flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-red-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
          </div>
          <p className="text-xs font-bold text-slate-700">Are you sure you want to delete <span className="text-[#1e40af]">"{category.name}"</span>?</p>
          {(category.menu_items_count ?? 0) > 0 && (
            <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">
              ⚠ This category has {category.menu_items_count} linked menu item{(category.menu_items_count ?? 0) > 1 ? 's' : ''}.
            </p>
          )}
          <p className="text-[10px] text-zinc-400 font-semibold">This action cannot be undone.</p>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-zinc-200 bg-zinc-50">
          <button onClick={onClose} className="flex-1 h-10 rounded-md border border-zinc-300 bg-white text-zinc-600 font-bold text-[10px] uppercase tracking-widest hover:bg-zinc-100 transition-all">Cancel</button>
          <button onClick={onConfirm} className="flex-1 h-10 rounded-md bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] uppercase tracking-widest transition-all shadow-sm flex items-center justify-center">Delete</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
const CategoryList = () => {
  const { showToast } = useToast();

  const [categories, setCategories] = useState<CategoryData[]>([
    { id: 1, name: "Add Ons Sinkers", description: "", itemCount: 22 },
    { id: 2, name: "AFFORDA-BOWLS", description: "", itemCount: 7 },
    { id: 3, name: "ALA CARTE SNACKS", description: "", itemCount: 10 },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [entriesLimit, setEntriesLimit] = useState(10);

  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryData | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryData | null>(null);

  const filteredCategories = categories
    .filter(cat => cat.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .slice(0, entriesLimit === -1 ? undefined : entriesLimit);

  const handleEditClick = (category: CategoryData) => {
    setEditingCategory(category);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (category: CategoryData) => {
    setCategoryToDelete(category);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (!categoryToDelete) return;
    setCategories(categories.filter(cat => cat.id !== categoryToDelete.id));
    showToast(`Category "${categoryToDelete.name}" has been deleted`, 'error');
    setIsDeleteConfirmOpen(false);
    setCategoryToDelete(null);
  };

  return (
    <div className="flex-1 bg-[#f4f5f7] h-full flex flex-col overflow-hidden font-sans">
      <TopNavbar />

      <div className="flex-1 overflow-y-auto p-6 flex flex-col">
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

        <div className="flex-1 bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-zinc-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-zinc-50/50">
            <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              <span>Show</span>
              <select value={entriesLimit} onChange={(e) => setEntriesLimit(Number(e.target.value))} className="border border-zinc-300 rounded bg-white px-2 py-1 outline-none text-slate-700">
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={-1}>All</option>
              </select>
              <span>entries</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Search:</span>
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search categories..." className="border border-zinc-300 rounded-md bg-white px-3 py-1.5 text-xs outline-none focus:border-[#3b2063] shadow-sm w-64 font-bold text-slate-700" />
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-600 uppercase tracking-widest">Category Name</th>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-600 uppercase tracking-widest">Description</th>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-600 uppercase tracking-widest text-center">Items</th>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-600 uppercase tracking-widest text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredCategories.length > 0 ? (
                  filteredCategories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-6 py-4 text-xs font-bold text-slate-700">{cat.name}</td>
                      <td className="px-6 py-4 text-xs text-slate-500">{cat.description || '—'}</td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-600 text-center">{cat.itemCount}</td>
                      <td className="px-6 py-4 text-center">
                        <button onClick={() => handleEditClick(cat)} className="text-blue-500 hover:text-blue-700 p-1.5 transition-colors inline-block" title="Edit">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" /></svg>
                        </button>
                        <button onClick={() => handleDeleteClick(cat)} className="text-red-400 hover:text-red-600 p-1.5 transition-colors inline-block ml-1" title="Delete">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={4} className="px-6 py-10 text-center text-zinc-400 font-bold uppercase tracking-widest text-xs italic">No categories found</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-zinc-50 border-t border-zinc-200 text-right text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
            Showing {filteredCategories.length} of {categories.length} Categories
          </div>
        </div>
      </div>

      {showAddModal && (
        <AddModal
          onClose={() => setShowAddModal(false)}
          onSuccess={(name, data) => {
            setCategories(prev => [...prev, { ...data, itemCount: data.itemCount ?? 0 }]);
            showToast(`Category "${name}" added successfully`, 'success');
          }}
        />
      )}

      {isEditModalOpen && editingCategory && (
        <EditModal
          category={editingCategory}
          onClose={() => { setIsEditModalOpen(false); setEditingCategory(null); }}
          onSuccess={(updated) => {
            setCategories(prev => prev.map(c => c.id === updated.id ? { ...c, ...updated } : c));
            showToast(`Category "${updated.name}" updated successfully`, 'success');
            setIsEditModalOpen(false);
            setEditingCategory(null);
          }}
        />
      )}

      {isDeleteConfirmOpen && categoryToDelete && (
        <DeleteModal
          category={categoryToDelete}
          onClose={() => { setIsDeleteConfirmOpen(false); setCategoryToDelete(null); }}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
};

export default CategoryList;