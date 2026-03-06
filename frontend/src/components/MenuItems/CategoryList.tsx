  "use client"

  import { useState, useEffect, useRef, useMemo } from 'react';
  import axios from 'axios';
  import TopNavbar from '../TopNavbar';
  import api from '../../services/api';
  import { Plus, Search, Pencil, Trash2, CheckCircle2, X, Tag, AlertTriangle } from 'lucide-react';

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
  function AddModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (name: string, data: CategoryData) => void }) {
    const [name, setName] = useState('');
    const [type, setType] = useState('food');
    const [cupId, setCupId] = useState<number | ''>('');
    const [cups, setCups] = useState<{ id: number; name: string; code: string }[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<{ name?: string }>({});

    useEffect(() => {
      api.get('/cups').then(res => setCups(res.data)).catch(() => {});
    }, []);

    const handleSubmit = async () => {
      if (!name.trim()) { setErrors({ name: 'Category name is required.' }); return; }
      setSubmitting(true);
      try {
        const payload: Record<string, unknown> = { name: name.trim(), type };
        if (type === 'drink' && cupId !== '') payload.cup_id = cupId;
        const response = await api.post('/categories', payload);
        onSuccess(name.trim(), response.data);
        onClose();
      } catch (err) {
        setErrors({ name: axios.isAxiosError(err) ? (err.response?.data?.message ?? 'Failed to add category.') : 'Failed to add category.' });
      } finally { setSubmitting(false); }
    };

    return (
      <ModalShell onClose={onClose}>
        <div className="bg-white border border-zinc-200 shadow-2xl w-full max-w-md flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-7 py-5 border-b border-zinc-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#3b2063] flex items-center justify-center">
                <Plus size={16} className="text-white" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Menu Items</p>
                <h2 className="text-sm font-bold text-[#1a0f2e]">Add Category</h2>
              </div>
            </div>
            <button onClick={onClose} className="text-zinc-300 hover:text-zinc-600 transition-colors"><X size={18} /></button>
          </div>

          {/* Body */}
          <div className="px-7 py-6 flex flex-col gap-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">
                Category Name <span className="text-red-400">*</span>
              </label>
              <input autoFocus type="text" value={name}
                onChange={(e) => { setName(e.target.value); setErrors({}); }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
                placeholder="e.g. Milk Tea" className={inputCls(!!errors.name)} />
              {errors.name && <p className="text-[11px] text-red-500 font-semibold">{errors.name}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Type <span className="text-red-400">*</span></label>
              <select value={type} onChange={(e) => { setType(e.target.value); setCupId(''); }} className={selectCls}>
                <option value="food">Food</option>
                <option value="drink">Drink</option>
                <option value="promo">Promo</option>
                <option value="standard">Standard</option>
              </select>
            </div>

            {type === 'drink' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Cup Type</label>
                <select value={cupId} onChange={(e) => setCupId(Number(e.target.value))} className={selectCls}>
                  <option value="">— Select Cup —</option>
                  {cups.map(cup => <option key={cup.id} value={cup.id}>{cup.name} ({cup.code})</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-7 py-5 border-t border-zinc-100">
            <button onClick={onClose} disabled={submitting} className="flex-1 h-11 bg-white border border-zinc-200 text-zinc-600 font-bold text-sm uppercase tracking-widest hover:bg-zinc-50 transition-all disabled:opacity-50">Cancel</button>
            <button onClick={handleSubmit} disabled={submitting} className="flex-1 h-11 bg-[#3b2063] hover:bg-[#2a1647] text-white font-bold text-sm uppercase tracking-widest transition-all disabled:opacity-60 flex items-center justify-center gap-2">
              {submitting ? <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</> : 'Add Category'}
            </button>
          </div>
        </div>
      </ModalShell>
    );
  }

  // ── Edit Modal ────────────────────────────────────────────────────────────────
  function EditModal({ category, onClose, onSuccess }: { category: CategoryData; onClose: () => void; onSuccess: (updated: CategoryData) => void }) {
    const [name, setName] = useState(category.name);
    const [description, setDescription] = useState(category.description || '');
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<{ name?: string }>({});

    const handleSubmit = async () => {
      if (!name.trim()) { setErrors({ name: 'Category name is required.' }); return; }
      setSubmitting(true);
      try {
        const response = await api.put(`/categories/${category.id}`, { name: name.trim(), description: description.trim() });
        onSuccess(response.data);
        onClose();
      } catch (err) {
        setErrors({ name: axios.isAxiosError(err) ? (err.response?.data?.message ?? 'Update failed.') : 'Update failed.' });
      } finally { setSubmitting(false); }
    };

    return (
      <ModalShell onClose={onClose}>
        <div className="bg-white border border-zinc-200 shadow-2xl w-full max-w-md flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-7 py-5 border-b border-zinc-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-zinc-50 border border-zinc-200 flex items-center justify-center">
                <Pencil size={15} className="text-violet-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Menu Items</p>
                <h2 className="text-sm font-bold text-[#1a0f2e]">Edit Category</h2>
              </div>
            </div>
            <button onClick={onClose} className="text-zinc-300 hover:text-zinc-600 transition-colors"><X size={18} /></button>
          </div>

          <div className="px-7 py-6 flex flex-col gap-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Category Name <span className="text-red-400">*</span></label>
              <input type="text" value={name}
                onChange={(e) => { setName(e.target.value); setErrors({}); }}
                className={inputCls(!!errors.name)} />
              {errors.name && <p className="text-[11px] text-red-500 font-semibold">{errors.name}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Description</label>
              <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className={inputCls()} />
            </div>
          </div>

          <div className="flex gap-3 px-7 py-5 border-t border-zinc-100">
            <button onClick={onClose} disabled={submitting} className="flex-1 h-11 bg-white border border-zinc-200 text-zinc-600 font-bold text-sm uppercase tracking-widest hover:bg-zinc-50 transition-all">Cancel</button>
            <button onClick={handleSubmit} disabled={submitting} className="flex-1 h-11 bg-[#3b2063] hover:bg-[#2a1647] text-white font-bold text-sm uppercase tracking-widest transition-all disabled:opacity-60 flex items-center justify-center gap-2">
              {submitting ? <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</> : 'Save Changes'}
            </button>
          </div>
        </div>
      </ModalShell>
    );
  }

  // ── Delete Modal ──────────────────────────────────────────────────────────────
  function DeleteModal({ category, onClose, onConfirm }: { category: CategoryData; onClose: () => void; onConfirm: () => void }) {
    return (
      <ModalShell onClose={onClose}>
        <div className="bg-white border border-zinc-200 shadow-2xl w-full max-w-sm flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-7 py-5 border-b border-zinc-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-red-50 border border-red-200 flex items-center justify-center">
                <Trash2 size={15} className="text-red-600" />
              </div>
              <h2 className="text-sm font-bold text-[#1a0f2e]">Delete Category</h2>
            </div>
            <button onClick={onClose} className="text-zinc-300 hover:text-zinc-600 transition-colors"><X size={18} /></button>
          </div>

          <div className="px-7 py-7 flex flex-col items-center gap-3 text-center">
            <AlertTriangle size={32} className="text-amber-500" />
            <p className="text-sm font-bold text-[#1a0f2e]">
              Delete <span className="text-[#3b2063]">"{category.name}"</span>?
            </p>
            {category.menu_items_count > 0 && (
              <p className="text-[11px] font-bold text-amber-500">
                This category has {category.menu_items_count} linked item{category.menu_items_count > 1 ? 's' : ''}.
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

    const bustServerCache = () => api.post('/menu/clear-cache').catch(() => {});

    const addToast = (message: string, type: 'success' | 'error' = 'success') => {
      const id = ++toastCounter.current;
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => removeToast(id), 4000);
    };
    const removeToast = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

    const fetchCategories = async () => {
      const cached = localStorage.getItem('luckyboba_categories_cache');
      if (cached) { setCategories(JSON.parse(cached)); setLoading(false); }
      try {
        const response = await api.get('/categories');
        setCategories(response.data);
        localStorage.setItem('luckyboba_categories_cache', JSON.stringify(response.data));
      } catch (error) { console.error('Error fetching categories:', error); }
      finally { setLoading(false); }
    };

    useEffect(() => { fetchCategories(); }, []);

    const displayData = useMemo(() => {
      const filtered = [...categories]
        .sort((a, b) => a.name.localeCompare(b.name))
        .filter(cat =>
          (cat.name ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (cat.type ?? '').toLowerCase().includes(searchQuery.toLowerCase())
        );
      return entriesLimit === -1 ? filtered : filtered.slice(0, entriesLimit);
    }, [categories, searchQuery, entriesLimit]);

    const handleAddSuccess = (_name: string, data: CategoryData) => {
      bustServerCache();
      setCategories(prev => [...prev, data]);
      localStorage.removeItem('pos_menu_cache');
      addToast(`"${data.name}" has been added successfully.`);
    };

    const handleEditSuccess = (updated: CategoryData) => {
      setCategories(prev => prev.map(cat => cat.id === updated.id ? { ...cat, ...updated } : cat));
      bustServerCache();
      localStorage.removeItem('pos_menu_cache');
      const cached = localStorage.getItem('luckyboba_categories_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        localStorage.setItem('luckyboba_categories_cache', JSON.stringify(
          parsed.map((cat: CategoryData) => cat.id === updated.id ? { ...cat, ...updated } : cat)
        ));
      }
      addToast(`"${updated.name}" has been updated successfully.`);
    };

    const handleDeleteConfirm = async () => {
      if (!deleteTarget) return;
      const target = deleteTarget;
      setDeleteTarget(null);
      try {
        await api.delete(`/categories/${target.id}`);
        setCategories(prev => prev.filter(cat => cat.id !== target.id));
        localStorage.removeItem('pos_menu_cache');
        addToast(`"${target.name}" has been deleted.`);
      } catch (err) {
        addToast(axios.isAxiosError(err) ? (err.response?.data?.message ?? 'Delete failed.') : 'Delete failed.', 'error');
      }
    };

    return (
      <>
        <ToastNotification toasts={toasts} onRemove={removeToast} />
        {showAddModal && <AddModal onClose={() => setShowAddModal(false)} onSuccess={handleAddSuccess} />}
        {editTarget && <EditModal category={editTarget} onClose={() => setEditTarget(null)} onSuccess={handleEditSuccess} />}
        {deleteTarget && <DeleteModal category={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDeleteConfirm} />}

        <div className="flex-1 bg-[#f4f2fb] h-full flex flex-col overflow-hidden">
          <TopNavbar />

          <div className="flex-1 overflow-y-auto p-5 md:p-7 flex flex-col gap-4">

            {/* ── Page Header ── */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Menu Items</p>
                <h1 className="text-lg font-bold text-[#1a0f2e] mt-0.5">Categories</h1>
              </div>
              <button onClick={() => setShowAddModal(true)}
                className="h-10.5 px-6 bg-[#3b2063] hover:bg-[#2a1647] text-white font-bold text-sm uppercase tracking-widest flex items-center gap-2 transition-colors active:scale-[0.98]">
                <Plus size={15} strokeWidth={2.5} /> Add Category
              </button>
            </div>

            {/* ── Table Card ── */}
            <div className="flex-1 bg-white border border-zinc-200 overflow-hidden flex flex-col shadow-sm">

              {/* Toolbar */}
              <div className="px-6 py-4 border-b border-zinc-100 flex flex-col md:flex-row justify-between items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Show</span>
                  <select value={entriesLimit} onChange={(e) => setEntriesLimit(Number(e.target.value))}
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
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search categories..."
                    className="border border-zinc-200 bg-[#f4f2fb] px-4 py-2 text-sm font-semibold text-[#1a0f2e] outline-none focus:border-[#3b2063] focus:bg-white w-56 transition-all placeholder:text-zinc-300" />
                </div>
              </div>

              {/* Table */}
              <div className="flex-1 overflow-auto">
                {loading && categories.length === 0 ? (
                  <div className="p-12 text-center">
                    <p className="text-[11px] font-bold text-zinc-300 uppercase tracking-widest animate-pulse">Loading categories...</p>
                  </div>
                ) : (
                  <table className="w-full text-left">
                    <thead className="sticky top-0 bg-white z-10 border-b border-zinc-100">
                      <tr>
                        <th className="px-7 py-3.5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Name</th>
                        <th className="px-5 py-3.5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Description</th>
                        <th className="px-5 py-3.5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center">Items</th>
                        <th className="px-5 py-3.5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center w-20">Edit</th>
                        <th className="px-7 py-3.5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center w-20">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {displayData.length > 0 ? displayData.map(cat => (
                        <tr key={cat.id} className="hover:bg-[#f4f2fb] transition-colors">
                          <td className="px-7 py-3.5">
                            <div className="flex items-center gap-2">
                              <Tag size={13} className="text-violet-400 shrink-0" />
                              <span className="text-sm font-bold text-[#1a0f2e]">{cat.name}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="text-sm font-medium text-zinc-400">{cat.description || '—'}</span>
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <span className="text-sm font-bold text-[#1a0f2e] tabular-nums">{cat.menu_items_count}</span>
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <button onClick={() => setEditTarget(cat)}
                              className="w-9 h-9 inline-flex items-center justify-center bg-[#3b2063] hover:bg-[#2a1647] text-white transition-colors">
                              <Pencil size={14} strokeWidth={2} />
                            </button>
                          </td>
                          <td className="px-7 py-3.5 text-center">
                            <button onClick={() => setDeleteTarget(cat)}
                              className="w-9 h-9 inline-flex items-center justify-center bg-white border border-red-200 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all">
                              <Trash2 size={14} strokeWidth={2} />
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
              <div className="px-7 py-3.5 bg-white border-t border-zinc-100 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Synchronized</span>
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