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

interface FormData {
  name: string;
  barcode: string;
  category: string;
  unitCost: string;
  sellingPrice: string;
  totalCost: string;
  status: 'ACTIVE' | 'INACTIVE';
  type: 'FOOD' | 'DRINK';
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

const INITIAL_FORM: FormData = {
  name: '',
  barcode: '',
  category: '',
  unitCost: '',
  sellingPrice: '',
  totalCost: '',
  status: 'ACTIVE',
  type: 'FOOD',
};

// ─── Toast Component ────────────────────────────────────────────────────────
function ToastNotification({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 px-5 py-3 rounded-none shadow-2xl text-white text-[10px] font-black uppercase tracking-widest pointer-events-auto border border-white/10
            transition-all duration-300 animate-in slide-in-from-right-full
            ${toast.type === 'success' ? 'bg-[#3b2063]' : 'bg-red-600'}`}
        >
          {toast.type === 'success' ? <CheckCircle2 size={14}/> : <X size={14}/>}
          {toast.message}
          <button onClick={() => onRemove(toast.id)} className="ml-2 opacity-50 hover:opacity-100 transition-opacity">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Add Item Modal ──────────────────────────────────────────────────────────
function AddItemModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (message: string) => void;
}) {
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) onClose();
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

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
        category: form.category.trim() || null,
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

  return (
    <div ref={overlayRef} onClick={handleBackdropClick} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-none border border-zinc-200 shadow-2xl w-full max-w-lg flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-8 py-6 border-b border-zinc-100 bg-zinc-50">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-[#3b2063] text-white rounded-none"><Plus size={18}/></div>
             <h2 className="text-[11px] font-black text-[#3b2063] uppercase tracking-[0.3em]">Master Inventory Registry</h2>
          </div>
          <button onClick={onClose} className="text-zinc-300 hover:text-red-500 transition-colors"><X size={20}/></button>
        </div>

        <div className="px-8 py-8 overflow-y-auto flex flex-col gap-6 max-h-[75vh]">
          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
              <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Status Code</label>
              <select value={form.status} onChange={(e) => handleChange('status', e.target.value)} className="w-full px-4 py-3 rounded-none border border-zinc-200 bg-[#f8f6ff] text-[#3b2063] font-black text-xs outline-none focus:border-[#3b2063] cursor-pointer">
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
            <div className="flex-1 space-y-2">
              <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Item Classification</label>
              <select value={form.type} onChange={(e) => handleChange('type', e.target.value)} className="w-full px-4 py-3 rounded-none border border-zinc-200 bg-[#f8f6ff] text-[#3b2063] font-black text-xs outline-none focus:border-[#3b2063] cursor-pointer">
                <option value="FOOD">FOOD</option>
                <option value="DRINK">DRINK</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Tag size={10}/> Item Description</label>
            <input type="text" value={form.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="ENTER PRODUCT NAME..." className={`w-full px-4 py-3 rounded-none border font-black text-xs outline-none focus:border-[#3b2063] transition-all bg-[#f8f6ff] text-[#3b2063] placeholder:text-zinc-300 ${errors.name ? 'border-red-400' : 'border-zinc-200'}`} />
            {errors.name && <p className="text-[9px] text-red-500 font-black uppercase mt-1 tracking-widest">{errors.name}</p>}
          </div>

          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
              <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">System Barcode</label>
              <input type="text" value={form.barcode} onChange={(e) => handleChange('barcode', e.target.value)} placeholder="SCAN OR TYPE..." className="w-full px-4 py-3 rounded-none border border-zinc-200 bg-[#f8f6ff] text-[#3b2063] font-black text-xs outline-none focus:border-[#3b2063]" />
            </div>
            <div className="flex-1 space-y-2">
              <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Archive Category</label>
              <input type="text" value={form.category} onChange={(e) => handleChange('category', e.target.value)} placeholder="MILK TEA..." className="w-full px-4 py-3 rounded-none border border-zinc-200 bg-[#f8f6ff] text-[#3b2063] font-black text-xs outline-none focus:border-[#3b2063]" />
            </div>
          </div>

          <div className="flex gap-4 p-4 bg-zinc-50 border border-zinc-100">
            {[ {f:'unitCost', l:'Unit Cost'}, {f:'sellingPrice', l:'Sell Price'}, {f:'totalCost', l:'Total Value'} ].map((m) => (
              <div key={m.f} className="flex-1 space-y-2">
                <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">{m.l}</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3b2063] font-black text-[10px]">₱</span>
                  <input type="number" value={form[m.f as keyof FormData]} onChange={(e) => handleChange(m.f as keyof FormData, e.target.value)} className="w-full pl-6 pr-2 py-3 rounded-none border border-zinc-200 bg-white text-[#3b2063] font-black text-xs outline-none focus:border-[#3b2063] tabular-nums" placeholder="0.00" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 px-8 py-6 border-t border-zinc-100 bg-zinc-50">
          <button onClick={onClose} disabled={submitting} className="flex-1 h-12 bg-white border border-zinc-200 text-zinc-400 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-zinc-100 transition-all disabled:opacity-50">Abort</button>
          <button onClick={handleSubmit} disabled={submitting} className="flex-1 h-12 bg-[#3b2063] text-white font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-lg shadow-purple-900/10 disabled:opacity-60 flex items-center justify-center gap-2">
            {submitting ? <RefreshCw className="animate-spin" size={14}/> : <CheckCircle2 size={14}/>}
            {submitting ? 'Syncing...' : 'Commit Item'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
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

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const fetchMenu = async () => {
    const cachedData = localStorage.getItem('luckyboba_menu_cache');
    if (cachedData) {
      setMenuData(JSON.parse(cachedData));
      setLoading(false);
    }
    try {
      const response = await api.get('/menu-list');
      const freshData = response.data;
      setMenuData(freshData);
      localStorage.setItem('luckyboba_menu_cache', JSON.stringify(freshData));
    } catch (error) {
      console.error('Failed to fetch menu list:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const handleAddSuccess = (message: string) => {
    addToast(message, 'success');
    fetchMenu();
  };

  const filteredData = menuData.filter((item) => {
    const matchesName =
      (item.name?.toLowerCase() || '').includes(filterName.toLowerCase()) ||
      (item.barcode?.toLowerCase() || '').includes(filterName.toLowerCase());
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
      <div className="flex-1 bg-[#f8f6ff] h-full flex flex-col overflow-hidden font-sans">
        <TopNavbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <RefreshCw className="animate-spin text-[#3b2063]" size={32} />
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em]">Querying Master Database...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#f8f6ff] h-full flex flex-col overflow-hidden font-sans">
      <ToastNotification toasts={toasts} onRemove={removeToast} />
      {showAddModal && <AddItemModal onClose={() => setShowAddModal(false)} onSuccess={handleAddSuccess} />}
      
      <TopNavbar />

      <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col gap-4">
        
        {/* === FILTER CONSOLE === */}
        <div className="bg-white p-6 rounded-none border border-zinc-200 shadow-sm">
          <div className="flex flex-col xl:flex-row gap-4 items-end">
            
            <div className="flex-[2] w-full space-y-1.5">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2"><Search size={10}/> Master Search</label>
              <input type="text" value={filterName} onChange={(e) => setFilterName(e.target.value)} className="w-full px-4 py-3 rounded-none border border-zinc-200 bg-[#f8f6ff] text-[#3b2063] font-black text-xs outline-none focus:border-[#3b2063] placeholder:text-zinc-200 uppercase" placeholder="NAME OR BARCODE..." />
            </div>

            <div className="flex-1 w-full space-y-1.5">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2"><Layers size={10}/> Category</label>
              <input type="text" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="w-full px-4 py-3 rounded-none border border-zinc-200 bg-[#f8f6ff] text-[#3b2063] font-black text-xs outline-none focus:border-[#3b2063] placeholder:text-zinc-200 uppercase" placeholder="FILTER CATEGORY..." />
            </div>

            <div className="flex gap-2 w-full xl:w-auto">
              <button onClick={() => setShowAddModal(true)} className="flex-1 xl:flex-none h-[46px] px-8 bg-[#3b2063] text-white font-black uppercase text-[10px] tracking-[0.2em] hover:bg-[#2a174a] transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-900/10 active:scale-[0.98]">
                <Plus size={14}/> Add New Item
              </button>
            </div>
          </div>
        </div>

        {/* === ACTION RIBBON === */}
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="px-6 py-3 bg-white border border-zinc-200 text-[#3b2063] font-black uppercase text-[9px] tracking-[0.2em] hover:bg-zinc-50 transition-all flex items-center gap-2 rounded-none"><Printer size={12}/> Print Journal</button>
          <button onClick={generateExcel} className="px-6 py-3 bg-white border border-zinc-200 text-[#3b2063] font-black uppercase text-[9px] tracking-[0.2em] hover:bg-zinc-50 transition-all flex items-center gap-2 rounded-none"><FileDown size={12}/> Export XLS</button>
          <div className="flex-1" />
          <div className="px-6 py-3 bg-[#3b2063] text-white font-black uppercase text-[9px] tracking-[0.3em] rounded-none flex items-center gap-2">
             <Database size={12} className="text-purple-300"/> Total Records: {filteredData.length}
          </div>
        </div>

        {/* === DATA TABLE === */}
        <div className="flex-1 bg-white rounded-none border border-zinc-200 overflow-hidden flex flex-col shadow-sm">
          <div className="flex-1 overflow-auto no-scrollbar">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-zinc-50 z-10 border-b border-zinc-100">
                <tr>
                  <th className="px-8 py-4 text-[9px] font-black text-zinc-400 uppercase tracking-[0.3em]">Registry Identifier</th>
                  <th className="px-6 py-4 text-[9px] font-black text-zinc-400 uppercase tracking-[0.3em]">System SKU</th>
                  <th className="px-6 py-4 text-[9px] font-black text-zinc-400 uppercase tracking-[0.3em]">Categorization</th>
                  <th className="px-6 py-4 text-[9px] font-black text-zinc-400 uppercase tracking-[0.3em] text-right">Acquisition</th>
                  <th className="px-6 py-4 text-[9px] font-black text-zinc-400 uppercase tracking-[0.3em] text-right">Retail Entry</th>
                  <th className="px-8 py-4 text-[9px] font-black text-zinc-400 uppercase tracking-[0.3em] text-right">Archive Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {filteredData.length > 0 ? (
                  filteredData.map((item) => (
                    <tr key={item.id} className="hover:bg-[#f8f6ff] transition-colors group">
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-3">
                           <div className="w-1 h-1 bg-purple-200" />
                           <span className="text-[11px] font-black text-[#3b2063] uppercase tracking-tight">{item.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[11px] font-black text-zinc-300 tabular-nums uppercase">{item.barcode || '—'}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-zinc-50 border border-zinc-100 text-[8px] font-black text-[#3b2063] uppercase tracking-widest">{item.category || 'GENERAL'}</span>
                      </td>
                      <td className="px-6 py-4 text-[11px] font-black text-zinc-400 text-right tabular-nums">₱ {Number(item.unitCost).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-[11px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 border border-emerald-100 tabular-nums">₱ {Number(item.sellingPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </td>
                      <td className="px-8 py-4 text-[11px] font-black text-[#3b2063] text-right tabular-nums opacity-60">₱ {Number(item.totalCost).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-8 py-24 text-center">
                      <Package size={40} className="mx-auto text-zinc-100 mb-3" />
                      <p className="text-[10px] text-zinc-300 uppercase font-black tracking-[0.4em]">No inventory matches found in the registry</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="px-8 py-5 bg-zinc-50 border-t border-zinc-100 flex justify-between items-center">
            <div className="flex items-center gap-2">
               <Terminal size={12} className="text-zinc-300"/>
               <span className="text-[8px] font-black text-zinc-300 uppercase tracking-[0.3em]">POS TERMINAL 01 AUDIT MODE</span>
            </div>
            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">COMMIT STATUS: <span className="text-emerald-500">SYNCHRONIZED</span></p>
          </div>
        </div>

      </div>
    </div>
  );
}

// Helper SVG
const RefreshCw = ({ className, size }: { className?: string; size?: number }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M3 21v-5h5" />
  </svg>
);

export default MenuList;