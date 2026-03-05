"use client"

import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import TopNavbar from '../TopNavbar';
import api from '../../services/api';
import * as XLSX from 'xlsx';
import { 
  Search, 
  Plus, 
  Printer, 
  FileDown, 
  Tag, 
  Layers,  
  CheckCircle2, 
  X, 
  Terminal,
  Database,
  Package
} from 'lucide-react';

interface MenuItem {
  id: number;
  name: string;
  barcode: string | null;
  category: string | null;
  unitCost: number;
  sellingPrice: number;
  totalCost: number;
  status?: 'ACTIVE' | 'INACTIVE';
  type?: 'FOOD' | 'DRINK';
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

// Add this to your interfaces at the top of the file
interface SubCategory {
  id: number;
  name: string;
}

interface Category {
  id: number;
  name: string;
}

// Update INITIAL_FORM to add sub_category
const INITIAL_FORM: FormData = {
  name: '',
  barcode: '',
  category: '',
  sub_category: '',   // ← add this
  unitCost: '',
  sellingPrice: '',
  totalCost: '',
  status: 'ACTIVE',
  type: 'FOOD',
};

// Update FormData interface to add sub_category
interface FormData {
  name: string;
  barcode: string;
  category: string;
  sub_category: string;  // ← add this
  unitCost: string;
  sellingPrice: string;
  totalCost: string;
  status: 'ACTIVE' | 'INACTIVE';
  type: 'FOOD' | 'DRINK';
}

const dashboardFont = { fontFamily: "'Inter', sans-serif" };

// ─── Toast Component ─────────────────────────────────────────────────────────
function ToastNotification({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-9999 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 px-5 py-3 shadow-2xl text-white text-[11px] font-bold uppercase tracking-widest pointer-events-auto border border-white/10 transition-all duration-300 animate-in slide-in-from-right-full rounded-none ${toast.type === 'success' ? 'bg-[#1a0f2e]' : 'bg-red-600'}`}
          style={dashboardFont}
        >
          {toast.type === 'success' ? <CheckCircle2 size={14}/> : <X size={14}/>}
          {toast.message}
          <button onClick={() => onRemove(toast.id)} className="ml-2 opacity-50 hover:opacity-100 transition-opacity"><X size={14} /></button>
        </div>
      ))}
    </div>
  );
}

// ─── Add Item Modal ───────────────────────────────────────────────────────────
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

  // Fetch main categories when type changes
  useEffect(() => {
      const fetchCategories = async () => {
        setLoadingCats(true);
        setCategories([]);
        setSubCategories([]);
        setForm((prev) => ({ ...prev, category: '', sub_category: '' }));
        try {
          const response = await api.get('/categories', {
            params: { type: form.type.toLowerCase() },  // ← filter by type again
          });
          setCategories(response.data);
        } catch (err) {
          console.error('Failed to fetch categories:', err);
        } finally {
          setLoadingCats(false);
        }
      };
      fetchCategories();
    }, [form.type]); 

  // Fetch sub-categories when main category changes
  useEffect(() => {
    if (!form.category) {
      setSubCategories([]);
      return;
    }
    const fetchSubCategories = async () => {
      setLoadingSubCats(true);
      setSubCategories([]);
      setForm((prev) => ({ ...prev, sub_category: '' }));
      try {
        // Find the selected category's id
        const selectedCat = categories.find((c) => c.name === form.category);
        if (!selectedCat) return;
        const response = await api.get('/sub-categories', {
          params: { category_id: selectedCat.id },
        });
        setSubCategories(response.data);
      } catch (err) {
        console.error('Failed to fetch sub-categories:', err);
      } finally {
        setLoadingSubCats(false);
      }
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
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await api.post('/menu-list', {
        name: form.name.trim(),
        barcode: form.barcode.trim() || null,
        category: form.category || null,
        sub_category: form.sub_category || null,
        sellingPrice: Number(form.sellingPrice),
        status: form.status,
        type: form.type,
        unitCost: Number(form.unitCost) || 0,
        totalCost: Number(form.totalCost) || 0,
      });
      localStorage.removeItem('luckyboba_menu_cache');
      onSuccess(`"${form.name}" has been added successfully.`);
      onClose();
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data?.message ?? 'Failed to add item.')
        : 'Failed to add item.';
      setErrors({ name: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = (hasError?: boolean) =>
    `w-full px-4 py-3 rounded-none border text-sm font-semibold outline-none transition-all bg-white text-[#1c1c1e] placeholder:text-zinc-400 focus:border-[#3b2063] focus:bg-white ${hasError ? 'border-red-400' : 'border-zinc-300'}`;

  const selectCls = `w-full px-4 py-3 rounded-none border border-zinc-300 bg-white text-[#1c1c1e] font-semibold text-sm outline-none focus:border-[#3b2063] cursor-pointer disabled:bg-zinc-50 disabled:text-zinc-400 disabled:cursor-not-allowed`;

  return (
    <div ref={overlayRef} onClick={handleBackdropClick} className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-none border border-zinc-200 shadow-2xl w-full max-w-lg flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" style={dashboardFont}>

        <div className="flex items-center justify-between px-8 py-5 border-b border-zinc-100 bg-white">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">Menu Items</p>
            <h2 className="text-sm font-extrabold text-[#1c1c1e] mt-0.5">Add New Item</h2>
          </div>
          <button onClick={onClose} className="text-zinc-300 hover:text-zinc-600 transition-colors p-1"><X size={18} /></button>
        </div>

        <div className="px-8 py-7 overflow-y-auto flex flex-col gap-5 max-h-[75vh]">

          {/* Status + Type */}
          <div className="flex gap-4">
            <div className="flex-1 space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Status</label>
              <select value={form.status} onChange={(e) => handleChange('status', e.target.value)} className={selectCls}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
            <div className="flex-1 space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Type</label>
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
            <input
              type="text" value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Enter product name..."
              className={inputCls(!!errors.name)}
            />
            {errors.name && <p className="text-[10px] text-red-500 font-semibold mt-1">{errors.name}</p>}
          </div>

          {/* Barcode */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Barcode</label>
            <input
              type="text" value={form.barcode}
              onChange={(e) => handleChange('barcode', e.target.value)}
              placeholder="Scan or type..."
              className={inputCls()}
            />
          </div>

          {/* Category + Sub-Category */}
          <div className="flex gap-4">
            <div className="flex-1 space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                <Layers size={10} /> Category
              </label>
              {loadingCats ? (
                <div className="w-full px-4 py-3 border border-zinc-300 bg-zinc-50 text-zinc-400 text-sm font-semibold flex items-center gap-2">
                  <RefreshCw className="animate-spin" size={12} /><span>Loading...</span>
                </div>
              ) : (
                <select value={form.category} onChange={(e) => handleChange('category', e.target.value)} className={selectCls}>
                  <option value="">— Select —</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex-1 space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                <Layers size={10} /> Sub-Category
              </label>
              {loadingSubCats ? (
                <div className="w-full px-4 py-3 border border-zinc-300 bg-zinc-50 text-zinc-400 text-sm font-semibold flex items-center gap-2">
                  <RefreshCw className="animate-spin" size={12} /><span>Loading...</span>
                </div>
              ) : (
                <select
                  value={form.sub_category}
                  onChange={(e) => handleChange('sub_category', e.target.value)}
                  disabled={!form.category || subCategories.length === 0}
                  className={selectCls}
                >
                  <option value="">— Select —</option>
                  {subCategories.map((sc) => (
                    <option key={sc.id} value={sc.name}>{sc.name}</option>
                  ))}
                </select>
              )}
              {form.category && !loadingSubCats && subCategories.length === 0 && (
                <p className="text-[10px] text-zinc-400 font-semibold">No sub-categories found.</p>
              )}
            </div>
          </div>

          {/* Pricing */}
          <div className="flex gap-4 p-4 bg-zinc-50 border border-zinc-100">
            {[{ f: 'unitCost', l: 'Unit Cost' }, { f: 'sellingPrice', l: 'Sell Price' }, { f: 'totalCost', l: 'Total Value' }].map((m) => (
              <div key={m.f} className="flex-1 space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{m.l}</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-semibold text-sm">₱</span>
                  <input
                    type="number"
                    value={form[m.f as keyof FormData]}
                    onChange={(e) => handleChange(m.f as keyof FormData, e.target.value)}
                    className="w-full pl-7 pr-2 py-3 rounded-none border border-zinc-300 bg-white text-[#1c1c1e] font-semibold text-sm outline-none focus:border-[#3b2063] tabular-nums"
                    placeholder="0.00"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 px-8 py-5 border-t border-zinc-100 bg-white">
          <button onClick={onClose} disabled={submitting} className="flex-1 h-11 bg-white border border-red-300 text-red-500 font-bold text-xs uppercase tracking-widest hover:bg-red-50 hover:border-red-400 transition-all disabled:opacity-50 rounded-none">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting} className="flex-1 h-11 bg-[#3b2063] text-white font-bold text-xs uppercase tracking-widest hover:bg-[#2a174a] transition-all disabled:opacity-60 flex items-center justify-center gap-2 rounded-none">
            {submitting ? <RefreshCw className="animate-spin" size={14} /> : <CheckCircle2 size={14} />}
            {submitting ? 'Saving...' : 'Add Item'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
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
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 4000);
  };

  const removeToast = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const fetchMenu = async () => {
    const cachedData = localStorage.getItem('luckyboba_menu_cache');
    if (cachedData) { setMenuData(JSON.parse(cachedData)); setLoading(false); }
    try {
      const response = await api.get('/menu-list');
      const freshData = response.data;
      setMenuData(freshData);
      localStorage.setItem('luckyboba_menu_cache', JSON.stringify(freshData));
    } catch (error) { console.error('Failed to fetch menu list:', error); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMenu(); }, []);

  const handleAddSuccess = (message: string) => { addToast(message, 'success'); fetchMenu(); };

  const filteredData = menuData.filter((item) => {
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
      <div className="flex-1 bg-[#f3f0ff] h-full flex flex-col overflow-hidden" style={dashboardFont}>
        <TopNavbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="animate-spin text-[#3b2063]" size={28} />
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Loading menu...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#f3f0ff] h-full flex flex-col overflow-hidden" style={dashboardFont}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');`}</style>
      <ToastNotification toasts={toasts} onRemove={removeToast} />
      {showAddModal && <AddItemModal onClose={() => setShowAddModal(false)} onSuccess={handleAddSuccess} />}
      
      <TopNavbar />

      <div className="flex-1 overflow-y-auto p-4 md:p-7 flex flex-col gap-3">

        {/* === FILTER BAR === */}
        <div className="bg-white p-5 border border-zinc-200 shadow-sm rounded-none">
          <div className="flex flex-col xl:flex-row gap-3 items-end">
            <div className="flex-2 w-full space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5"><Search size={10}/> Search</label>
              <input type="text" value={filterName} onChange={(e) => setFilterName(e.target.value)} className="w-full px-4 py-3 border border-zinc-200 bg-zinc-50 text-[#1c1c1e] font-semibold text-sm outline-none focus:border-[#3b2063] focus:bg-white transition-all rounded-none placeholder:text-zinc-300" placeholder="Name or barcode..." />
            </div>
            <div className="flex-1 w-full space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5"><Layers size={10}/> Category</label>
              <input type="text" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="w-full px-4 py-3 border border-zinc-200 bg-zinc-50 text-[#1c1c1e] font-semibold text-sm outline-none focus:border-[#3b2063] focus:bg-white transition-all rounded-none placeholder:text-zinc-300" placeholder="Filter category..." />
            </div>
            <div className="flex gap-2 w-full xl:w-auto">
              <button onClick={() => setShowAddModal(true)} className="flex-1 xl:flex-none h-11.5 px-7 bg-[#3b2063] text-white font-bold text-xs uppercase tracking-widest hover:bg-[#2a174a] transition-colors flex items-center justify-center gap-2 rounded-none active:scale-[0.98]">
                <Plus size={14} strokeWidth={2.5}/> Add New Item
              </button>
            </div>
          </div>
        </div>

        {/* === ACTION RIBBON === */}
        <div className="flex gap-2 items-center">
          <button onClick={() => window.print()} className="h-9 px-5 bg-white border border-zinc-300 text-zinc-700 font-bold text-[11px] uppercase tracking-widest hover:bg-zinc-50 hover:border-zinc-400 transition-colors flex items-center gap-2 rounded-none">
            <Printer size={13} strokeWidth={2}/> Print
          </button>
          <button onClick={generateExcel} className="h-9 px-5 bg-white border border-zinc-300 text-zinc-700 font-bold text-[11px] uppercase tracking-widest hover:bg-zinc-50 hover:border-zinc-400 transition-colors flex items-center gap-2 rounded-none">
            <FileDown size={13} strokeWidth={2}/> Export XLS
          </button>
          <div className="flex-1" />
          <div className="h-9 px-5 bg-white border border-zinc-200 text-zinc-700 font-bold text-[11px] uppercase tracking-widest rounded-none flex items-center gap-2">
            <Database size={12} className="text-[#7c3aed]" strokeWidth={2}/> 
            <span>{filteredData.length} <span className="text-zinc-400 font-semibold">Records</span></span>
          </div>
        </div>

        {/* === DATA TABLE === */}
        <div className="flex-1 bg-white border border-zinc-200 overflow-hidden flex flex-col shadow-sm rounded-none">
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-white z-10 border-b-2 border-zinc-100">
                <tr>
                  <th className="px-7 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Item Name</th>
                  <th className="px-5 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">SKU / Barcode</th>
                  <th className="px-5 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Category</th>
                  <th className="px-5 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-right">Unit Cost</th>
                  <th className="px-5 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-right">Selling Price</th>
                  <th className="px-7 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-right">Total Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredData.length > 0 ? (
                  filteredData.map((item) => (
                    <tr key={item.id} className="hover:bg-[#f9f8ff] transition-colors">
                      <td className="px-7 py-3.5">
                        <span className="text-[13px] font-extrabold text-[#3b2063]">{item.name}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-[12px] font-semibold text-zinc-400 tabular-nums">{item.barcode || '—'}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2.5 py-1 bg-zinc-50 border border-zinc-200 text-[10px] font-bold text-zinc-600 uppercase tracking-wide rounded-none">
                          {item.category || 'General'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-[13px] font-semibold text-zinc-500 text-right tabular-nums">
                        ₱ {Number(item.unitCost).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="text-[13px] font-extrabold text-emerald-700 tabular-nums">
                          ₱ {Number(item.sellingPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-7 py-3.5 text-[13px] font-semibold text-zinc-400 text-right tabular-nums">
                        ₱ {Number(item.totalCost).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-8 py-24 text-center">
                      <Package size={36} className="mx-auto text-zinc-200 mb-3" strokeWidth={1.5}/>
                      <p className="text-[11px] font-bold text-zinc-300 uppercase tracking-widest">No items found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Table Footer */}
          <div className="px-7 py-4 bg-white border-t border-zinc-100 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Terminal size={11} className="text-zinc-300" strokeWidth={2}/>
              <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">POS Terminal 01</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Synchronized</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

const RefreshCw = ({ className, size }: { className?: string; size?: number }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M3 21v-5h5" />
  </svg>
);

export default MenuList;