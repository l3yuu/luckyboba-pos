"use client"

import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import TopNavbar from '../TopNavbar';
import api from '../../../services/api';
import * as XLSX from 'xlsx';
import { Search, Plus, Printer, FileDown, Tag, Layers, CheckCircle2, X, Terminal, Database, Package, RefreshCw } from 'lucide-react';

interface MenuItem {
  id: number;
  name: string;
  barcode: string | null;
  category: string | null;
  unitCost: number;
  sellingPrice: number;  // ← this maps to 'price' from API
  price: number;         // ← add this
  totalCost: number;
  status?: 'ACTIVE' | 'INACTIVE';
  type?: 'FOOD' | 'DRINK';
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

interface SubCategory {
  id: number;
  name: string;
}

interface Category {
  id: number;
  name: string;
}

interface FormData {
  name: string;
  barcode: string;
  category: string;
  sub_category: string;
  unitCost: string;
  sellingPrice: string;
  totalCost: string;
  status: 'ACTIVE' | 'INACTIVE';
  type: 'FOOD' | 'DRINK';
}

const INITIAL_FORM: FormData = {
  name: '', barcode: '', category: '', sub_category: '',
  unitCost: '', sellingPrice: '', totalCost: '',
  status: 'ACTIVE', type: 'FOOD',
};

// ── Toast ─────────────────────────────────────────────────────────────────────
function ToastNotification({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-9999 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className={`flex items-center gap-3 px-5 py-3 shadow-xl text-white text-sm font-semibold pointer-events-auto border border-white/10 transition-all animate-in slide-in-from-right-full ${toast.type === 'success' ? 'bg-[#1a0f2e]' : 'bg-red-600'}`}>
          {toast.type === 'success' ? <CheckCircle2 size={15} /> : <X size={15} />}
          <span>{toast.message}</span>
          <button onClick={() => onRemove(toast.id)} className="ml-1 text-white/50 hover:text-white transition-colors">
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Add Item Modal ─────────────────────────────────────────────────────────────
function AddItemModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (message: string) => void }) {
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [loadingCats, setLoadingCats] = useState(false);
  const [loadingSubCats, setLoadingSubCats] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) onClose();
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCats(true);
      setCategories([]); setSubCategories([]);
      setForm(prev => ({ ...prev, category: '', sub_category: '' }));
      try {
        const response = await api.get('/categories', { params: { type: form.type.toLowerCase() } });
        setCategories(response.data);
      } catch (err) { console.error('Failed to fetch categories:', err); }
      finally { setLoadingCats(false); }
    };
    fetchCategories();
  }, [form.type]);

  useEffect(() => {
    if (!form.category) { setSubCategories([]); return; }
    const fetchSubCategories = async () => {
      setLoadingSubCats(true); setSubCategories([]);
      setForm(prev => ({ ...prev, sub_category: '' }));
      try {
        const selectedCat = categories.find(c => c.name === form.category);
        if (!selectedCat) return;
        const response = await api.get('/sub-categories', { params: { category_id: selectedCat.id } });
        setSubCategories(response.data);
      } catch (err) { console.error('Failed to fetch sub-categories:', err); }
      finally { setLoadingSubCats(false); }
    };
    fetchSubCategories();
  }, [form.category, categories]);

  const validate = (): boolean => {
    const newErrors: Partial<FormData> = {};
    if (!form.name.trim()) newErrors.name = 'Item name is required.';
    if (!form.sellingPrice || isNaN(Number(form.sellingPrice))) newErrors.sellingPrice = 'Enter a valid selling price.';
    if (form.unitCost && isNaN(Number(form.unitCost))) newErrors.unitCost = 'Enter a valid unit cost.';
    if (form.totalCost && isNaN(Number(form.totalCost))) newErrors.totalCost = 'Enter a valid total cost.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await api.post('/menu-list', {
        name: form.name.trim(), barcode: form.barcode.trim() || null,
        category: form.category || null, sub_category: form.sub_category || null,
        sellingPrice: Number(form.sellingPrice), status: form.status, type: form.type,
        unitCost: Number(form.unitCost) || 0, totalCost: Number(form.totalCost) || 0,
      });
      localStorage.removeItem('luckyboba_menu_cache');
      localStorage.removeItem('pos_menu_cache');
      onSuccess(`"${form.name}" has been added successfully.`);
      onClose();
    } catch (err) {
      const msg = axios.isAxiosError(err) ? (err.response?.data?.message ?? 'Failed to add item.') : 'Failed to add item.';
      setErrors({ name: msg });
    } finally { setSubmitting(false); }
  };

  const inputCls = (hasError?: boolean) =>
    `w-full px-4 py-3 border text-sm font-semibold outline-none transition-all bg-white text-[#1a0f2e] placeholder:text-zinc-300 focus:border-[#3b2063] ${hasError ? 'border-red-400' : 'border-zinc-200'}`;

  const selectCls = `w-full px-4 py-3 border border-zinc-200 bg-white text-[#1a0f2e] font-semibold text-sm outline-none focus:border-[#3b2063] cursor-pointer disabled:bg-zinc-50 disabled:text-zinc-400 disabled:cursor-not-allowed transition-colors`;

  return (
    <div ref={overlayRef} onClick={handleBackdropClick} className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-zinc-200 shadow-2xl w-full max-w-lg flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 rounded-[0.625rem]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#3b2063] flex items-center justify-center">
              <Plus size={16} className="text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Menu Items</p>
              <h2 className="text-sm font-bold text-[#1a0f2e]">Add New Item</h2>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-300 hover:text-zinc-600 transition-colors p-1">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-7 py-6 overflow-y-auto flex flex-col gap-5 max-h-[72vh]">

          {/* Status + Type */}
          <div className="flex gap-4">
            <div className="flex-1 space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Status</label>
              <select value={form.status} onChange={(e) => handleChange('status', e.target.value)} className={selectCls}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
            <div className="flex-1 space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Type</label>
              <select value={form.type} onChange={(e) => handleChange('type', e.target.value)} className={selectCls}>
                <option value="FOOD">Food</option>
                <option value="DRINK">Drink</option>
              </select>
            </div>
          </div>

          {/* Item Name */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
              <Tag size={10} /> Item Name
            </label>
            <input type="text" value={form.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="Enter product name..." className={inputCls(!!errors.name)} />
            {errors.name && <p className="text-[11px] text-red-500 font-semibold">{errors.name}</p>}
          </div>

          {/* Barcode */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Barcode</label>
            <input type="text" value={form.barcode} onChange={(e) => handleChange('barcode', e.target.value)} placeholder="Scan or type barcode..." className={inputCls()} />
          </div>

          {/* Category + Sub-Category */}
          <div className="flex gap-4">
            <div className="flex-1 space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                <Layers size={10} /> Category
              </label>
              {loadingCats ? (
                <div className="w-full px-4 py-3 border border-zinc-200 bg-zinc-50 text-zinc-400 text-sm font-semibold flex items-center gap-2">
                  <RefreshCw size={12} className="animate-spin" /> Loading...
                </div>
              ) : (
                <select value={form.category} onChange={(e) => handleChange('category', e.target.value)} className={selectCls}>
                  <option value="">— Select —</option>
                  {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                </select>
              )}
            </div>
            <div className="flex-1 space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                <Layers size={10} /> Sub-Category
              </label>
              {loadingSubCats ? (
                <div className="w-full px-4 py-3 border border-zinc-200 bg-zinc-50 text-zinc-400 text-sm font-semibold flex items-center gap-2">
                  <RefreshCw size={12} className="animate-spin" /> Loading...
                </div>
              ) : (
                <select value={form.sub_category} onChange={(e) => handleChange('sub_category', e.target.value)} disabled={!form.category || subCategories.length === 0} className={selectCls}>
                  <option value="">— Select —</option>
                  {subCategories.map(sc => <option key={sc.id} value={sc.name}>{sc.name}</option>)}
                </select>
              )}
              {form.category && !loadingSubCats && subCategories.length === 0 && (
                <p className="text-[11px] text-zinc-400 font-medium">No sub-categories found.</p>
              )}
            </div>
          </div>

          {/* Pricing */}
          <div className="flex gap-3 p-4 bg-[#f4f2fb] border border-violet-100">
            {[{ f: 'unitCost', l: 'Unit Cost' }, { f: 'sellingPrice', l: 'Sell Price' }, { f: 'totalCost', l: 'Total Value' }].map(m => (
              <div key={m.f} className="flex-1 space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">{m.l}</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-sm">₱</span>
                  <input
                    type="number" value={form[m.f as keyof FormData]}
                    onChange={(e) => handleChange(m.f as keyof FormData, e.target.value)}
                    className="w-full pl-7 pr-2 py-3 border border-zinc-200 bg-white text-[#1a0f2e] font-semibold text-sm outline-none focus:border-[#3b2063] tabular-nums transition-colors"
                    placeholder="0.00"
                  />
                </div>
                {errors[m.f as keyof FormData] && <p className="text-[11px] text-red-500 font-semibold">{errors[m.f as keyof FormData]}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex gap-3 px-7 py-5 border-t border-zinc-100">
          <button onClick={onClose} disabled={submitting} className="flex-1 h-11 bg-white border border-zinc-200 text-zinc-600 font-bold text-sm uppercase tracking-widest hover:bg-zinc-50 transition-all disabled:opacity-50 rounded-[0.625rem]">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={submitting} className="flex-1 h-11 bg-[#3b2063] hover:bg-[#2a1647] text-white font-bold text-sm uppercase tracking-widest transition-all disabled:opacity-60 flex items-center justify-center gap-2 rounded-[0.625rem]">
            {submitting ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            {submitting ? 'Saving...' : 'Add Item'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
function MenuList() {
  const [menuData, setMenuData] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterName, setFilterName] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastCounter = useRef(0);

  const addToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = ++toastCounter.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 4000);
  };

  const removeToast = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

  const fetchMenu = async () => {
    const cached = localStorage.getItem('luckyboba_menu_cache');
    if (cached) { setMenuData(JSON.parse(cached)); setLoading(false); }
    try {
      const response = await api.get('/menu-list');
      setMenuData(response.data);
      localStorage.setItem('luckyboba_menu_cache', JSON.stringify(response.data));
    } catch (error) { console.error('Failed to fetch menu list:', error); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMenu(); }, []);

  const handleAddSuccess = (message: string) => { addToast(message, 'success'); fetchMenu(); };

  const filteredData = menuData.filter(item => {
    const matchesName = (item.name?.toLowerCase() || '').includes(filterName.toLowerCase()) || (item.barcode?.toLowerCase() || '').includes(filterName.toLowerCase());
    const matchesCategory = (item.category?.toLowerCase() || '').includes(filterCategory.toLowerCase());
    return matchesName && matchesCategory;
  });

  const generateExcel = useCallback(() => {
    if (filteredData.length === 0) return;
    const worksheetData = [
      ['Item Name', 'Barcode', 'Category', 'Unit Cost', 'Selling Price', 'Total Cost'],
      ...filteredData.map(item => [item.name, item.barcode || '-', item.category || 'Uncategorized', item.unitCost, item.sellingPrice, item.totalCost])
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Menu List');
    XLSX.writeFile(workbook, `LuckyBoba_Menu_${new Date().toISOString().split('T')[0]}.xlsx`);
  }, [filteredData]);

  if (loading && menuData.length === 0) {
    return (
      <div className="flex-1 bg-[#f4f2fb] h-full flex flex-col overflow-hidden">
        <TopNavbar />
        <div className="flex-1 flex items-center justify-center gap-3">
          <RefreshCw size={22} className="animate-spin text-[#3b2063]" />
          <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Loading menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#f4f2fb] h-full flex flex-col overflow-hidden">
      <ToastNotification toasts={toasts} onRemove={removeToast} />
      {showAddModal && <AddItemModal onClose={() => setShowAddModal(false)} onSuccess={handleAddSuccess} />}

      <TopNavbar />

      <div className="flex-1 overflow-y-auto p-5 md:p-7 flex flex-col gap-4">

        {/* ── Filter Bar ── */}
        <div className="bg-white border border-zinc-200 p-5 shadow-sm rounded-[0.625rem]">
          <div className="flex flex-col xl:flex-row gap-3 items-end">
            <div className="flex-1 w-full space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                <Search size={10} /> Search
              </label>
              <input type="text" value={filterName} onChange={(e) => setFilterName(e.target.value)}
                className="w-full px-4 py-3 border border-zinc-200 bg-[#f4f2fb] text-[#1a0f2e] font-semibold text-sm outline-none focus:border-[#3b2063] focus:bg-white transition-all placeholder:text-zinc-300"
                placeholder="Name or barcode..." />
            </div>
            <div className="flex-1 w-full space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                <Layers size={10} /> Category
              </label>
              <input type="text" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-4 py-3 border border-zinc-200 bg-[#f4f2fb] text-[#1a0f2e] font-semibold text-sm outline-none focus:border-[#3b2063] focus:bg-white transition-all placeholder:text-zinc-300 rounded-[0.625rem]"
                placeholder="Filter by category..." />
            </div>
            <div className="flex gap-2 w-full xl:w-auto">
              <button onClick={() => setShowAddModal(true)}
                className="flex-1 xl:flex-none h-11.5 px-6 bg-[#3b2063] hover:bg-[#2a1647] text-white font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-colors active:scale-[0.98] rounded-[0.625rem]">
                <Plus size={15} strokeWidth={2.5} /> Add New Item
              </button>
            </div>
          </div>
        </div>

        {/* ── Action Ribbon ── */}
        <div className="flex gap-2 items-center">
          <button onClick={() => window.print()} className="h-9 px-4 bg-white border border-zinc-200 text-zinc-600 font-bold text-[11px] uppercase tracking-widest hover:border-[#3b2063] hover:text-[#3b2063] transition-colors flex items-center gap-2 rounded-[0.625rem]">
            <Printer size={13} strokeWidth={2} /> Print
          </button>
          <button onClick={generateExcel} className="h-9 px-4 bg-white border border-zinc-200 text-zinc-600 font-bold text-[11px] uppercase tracking-widest hover:border-[#3b2063] hover:text-[#3b2063] transition-colors flex items-center gap-2 rounded-[0.625rem]">
            <FileDown size={13} strokeWidth={2} /> Export XLS
          </button>
          <div className="flex-1" />
          <div className="h-9 px-4 bg-white border border-zinc-200 flex items-center gap-2">
            <Database size={12} className="text-violet-500" />
            <span className="text-[11px] font-bold text-zinc-600 uppercase tracking-widest">
              {filteredData.length} <span className="text-zinc-400 font-medium">Records</span>
            </span>
          </div>
        </div>

        {/* ── Table ── */}
        <div className="flex-1 bg-white border border-zinc-200 overflow-hidden flex flex-col shadow-sm rounded-[0.625rem]">
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-white z-10 border-b border-zinc-100">
                <tr>
                  <th className="px-7 py-3.5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Item Name</th>
                  <th className="px-5 py-3.5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">SKU / Barcode</th>
                  <th className="px-5 py-3.5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Category</th>
                  <th className="px-5 py-3.5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-right">Unit Cost</th>
                  <th className="px-5 py-3.5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-right">Selling Price</th>
                  <th className="px-7 py-3.5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-right">Total Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredData.length > 0 ? filteredData.map(item => (
                  <tr key={item.id} className="hover:bg-[#f4f2fb] transition-colors">
                    <td className="px-7 py-3.5">
                      <span className="text-sm font-bold text-[#1a0f2e]">{item.name}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-medium text-zinc-400 tabular-nums">{item.barcode || '—'}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-1 bg-zinc-50 border border-zinc-200 text-[10px] font-bold text-zinc-600 uppercase tracking-wide">
                        {item.category || 'General'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-zinc-500 text-right tabular-nums">
                      ₱{Number(item.unitCost).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="text-sm font-bold text-emerald-700 tabular-nums">
                        ₱{Number(item.sellingPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-7 py-3.5 text-sm font-medium text-zinc-400 text-right tabular-nums">
                      ₱{Number(item.totalCost).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="px-8 py-24 text-center">
                      <Package size={32} className="mx-auto text-zinc-200 mb-3" strokeWidth={1.5} />
                      <p className="text-[11px] font-bold text-zinc-300 uppercase tracking-widest">No items found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="px-7 py-3.5 bg-white border-t border-zinc-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal size={11} className="text-zinc-300" />
              <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">POS Terminal 01</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-[0.625rem] bg-emerald-400" />
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Synchronized</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MenuList;