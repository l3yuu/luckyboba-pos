import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import TopNavbar from '../TopNavbar';
import api from '../../services/api';

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

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) onClose();
  };

  // Close on Escape
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
      // Ensure keys match the Laravel validation rules
      await api.post('/menu-list', {
        name: form.name.trim(),
        barcode: form.barcode.trim() || null,
        category: form.category.trim() || null,
        sellingPrice: Number(form.sellingPrice),
        status: form.status, // Matches 'ACTIVE' | 'INACTIVE'
        type: form.type,     // Matches 'FOOD' | 'DRINK'
        // Include costs if your DB starts supporting them
        unitCost: Number(form.unitCost) || 0,
        totalCost: Number(form.totalCost) || 0,
      });

      // Clear local cache to force a fresh pull on next load
      localStorage.removeItem('luckyboba_menu_cache');

      onSuccess(`"${form.name}" has been added successfully.`);
      onClose();
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data?.message ?? 'Failed to add item. Please try again.')
        : 'Failed to add item. Please try again.';
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden animate-[modalIn_0.25s_ease-out]">

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 bg-zinc-50">
          <div>
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Add New Item</h2>
            <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">Fill in the details below</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-200 hover:bg-zinc-300 flex items-center justify-center text-zinc-500 hover:text-zinc-800 transition-all text-sm font-bold"
          >
            ×
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-5 overflow-y-auto flex flex-col gap-4 max-h-[75vh]">

          {/* Row: Status + Type */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 block">Status</label>
              <select
                value={form.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-zinc-300 bg-zinc-50 text-slate-700 font-bold text-xs outline-none focus:border-blue-500 h-10 cursor-pointer"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 block">Type</label>
              <select
                value={form.type}
                onChange={(e) => handleChange('type', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-zinc-300 bg-zinc-50 text-slate-700 font-bold text-xs outline-none focus:border-blue-500 h-10 cursor-pointer"
              >
                <option value="FOOD">FOOD</option>
                <option value="DRINK">DRINK</option>
              </select>
            </div>
          </div>

          {/* Item Name */}
          <div>
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 block">
              Item Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g. Brown Sugar Milk Tea"
              className={`w-full px-3 py-2 rounded-md border bg-zinc-50 text-slate-700 font-bold text-xs outline-none focus:border-blue-500 h-10
                ${errors.name ? 'border-red-400 bg-red-50' : 'border-zinc-300'}`}
            />
            {errors.name && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.name}</p>}
          </div>

          {/* Row: Barcode + Category */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 block">Barcode</label>
              <input
                type="text"
                value={form.barcode}
                onChange={(e) => handleChange('barcode', e.target.value)}
                placeholder="Optional"
                className="w-full px-3 py-2 rounded-md border border-zinc-300 bg-zinc-50 text-slate-700 font-bold text-xs outline-none focus:border-blue-500 h-10"
              />
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 block">Category</label>
              <input
                type="text"
                value={form.category}
                onChange={(e) => handleChange('category', e.target.value)}
                placeholder="e.g. Milk Tea"
                className="w-full px-3 py-2 rounded-md border border-zinc-300 bg-zinc-50 text-slate-700 font-bold text-xs outline-none focus:border-blue-500 h-10"
              />
            </div>
          </div>

          {/* Row: Unit Cost + Selling Price + Total Cost */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 block">Unit Cost</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-xs">₱</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.unitCost}
                  onChange={(e) => handleChange('unitCost', e.target.value)}
                  placeholder="0.00"
                  className={`w-full pl-7 pr-3 py-2 rounded-md border bg-zinc-50 text-slate-700 font-bold text-xs outline-none focus:border-blue-500 h-10
                    ${errors.unitCost ? 'border-red-400 bg-red-50' : 'border-zinc-300'}`}
                />
              </div>
              {errors.unitCost && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.unitCost}</p>}
            </div>

            <div className="flex-1">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 block">
                Selling Price <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-xs">₱</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.sellingPrice}
                  onChange={(e) => handleChange('sellingPrice', e.target.value)}
                  placeholder="0.00"
                  className={`w-full pl-7 pr-3 py-2 rounded-md border bg-zinc-50 text-slate-700 font-bold text-xs outline-none focus:border-blue-500 h-10
                    ${errors.sellingPrice ? 'border-red-400 bg-red-50' : 'border-zinc-300'}`}
                />
              </div>
              {errors.sellingPrice && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.sellingPrice}</p>}
            </div>

            <div className="flex-1">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 block">Total Cost</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-xs">₱</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.totalCost}
                  onChange={(e) => handleChange('totalCost', e.target.value)}
                  placeholder="0.00"
                  className={`w-full pl-7 pr-3 py-2 rounded-md border bg-zinc-50 text-slate-700 font-bold text-xs outline-none focus:border-blue-500 h-10
                    ${errors.totalCost ? 'border-red-400 bg-red-50' : 'border-zinc-300'}`}
                />
              </div>
              {errors.totalCost && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.totalCost}</p>}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-zinc-200 bg-zinc-50">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 h-10 rounded-md border border-zinc-300 bg-white text-zinc-600 font-bold text-[10px] uppercase tracking-widest hover:bg-zinc-100 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 h-10 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[10px] uppercase tracking-widest transition-all shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              'Save Item'
            )}
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
    fetchMenu(); // Refresh list after adding
  };

  const filteredData = menuData.filter((item) => {
    const matchesName =
      (item.name?.toLowerCase() || '').includes(filterName.toLowerCase()) ||
      (item.barcode?.toLowerCase() || '').includes(filterName.toLowerCase());
    const matchesCategory = (item.category?.toLowerCase() || '').includes(filterCategory.toLowerCase());
    return matchesName && matchesCategory;
  });

  if (loading && menuData.length === 0) {
    return (
      <div className="flex-1 bg-[#f4f5f7] h-full flex flex-col overflow-hidden font-sans">
        <TopNavbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Loading menu...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Toast Notifications */}
      <ToastNotification toasts={toasts} onRemove={removeToast} />

      {/* Add Item Modal */}
      {showAddModal && (
        <AddItemModal
          onClose={() => setShowAddModal(false)}
          onSuccess={handleAddSuccess}
        />
      )}

      <div className="flex-1 bg-[#f4f5f7] h-full flex flex-col overflow-hidden font-sans">
        <TopNavbar />

        <div className="flex-1 overflow-y-auto p-6 flex flex-col">

          {/* === HEADER SECTION === */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
          </div>

          {/* === FILTER BAR === */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-zinc-200 mb-4">
            <div className="flex flex-col xl:flex-row gap-4 items-end">

              {/* Name / Barcode */}
              <div className="flex-1 w-full">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 block">Name / Barcode</label>
                <input
                  type="text"
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-zinc-300 bg-zinc-50 text-slate-700 font-bold text-xs outline-none focus:border-blue-500 h-10"
                  placeholder="Search by name or barcode..."
                />
              </div>

              {/* Category */}
              <div className="flex-1 w-full">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 block">Category</label>
                <input
                  type="text"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-zinc-300 bg-zinc-50 text-slate-700 font-bold text-xs outline-none focus:border-blue-500 h-10"
                  placeholder="Search by category..."
                />
              </div>

              {/* Filter By */}
              <div className="w-full xl:w-32">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 block">Filter By</label>
                <select className="w-full px-3 py-2 rounded-md border border-zinc-300 bg-zinc-50 text-slate-700 font-bold text-xs outline-none focus:border-blue-500 h-10 cursor-pointer">
                  <option>ACTIVE</option>
                  <option>INACTIVE</option>
                </select>
              </div>

              {/* Limit By */}
              <div className="w-full xl:w-24">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 block">Limit By</label>
                <select className="w-full px-3 py-2 rounded-md border border-zinc-300 bg-zinc-50 text-slate-700 font-bold text-xs outline-none focus:border-blue-500 h-10 cursor-pointer">
                  <option>50</option>
                  <option>100</option>
                  <option>All</option>
                </select>
              </div>

              {/* Type */}
              <div className="w-full xl:w-32">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 block">Type</label>
                <select className="w-full px-3 py-2 rounded-md border border-zinc-300 bg-zinc-50 text-slate-700 font-bold text-xs outline-none focus:border-blue-500 h-10 cursor-pointer">
                  <option>FOOD</option>
                  <option>DRINK</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 w-full xl:w-auto">
                <button className="flex-1 xl:flex-none px-6 h-10 bg-[#1e40af] text-white rounded-md font-bold uppercase text-[10px] tracking-widest hover:bg-[#1e3a8a] shadow-sm transition-all flex items-center justify-center min-w-25">
                  SEARCH
                </button>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex-1 xl:flex-none px-6 h-10 bg-emerald-500 text-white rounded-md font-bold uppercase text-[10px] tracking-widest hover:bg-emerald-600 shadow-sm transition-all flex items-center justify-center min-w-25"
                >
                  ADD ITEM
                </button>
              </div>

            </div>
          </div>

          {/* Button Row */}
          <div className="flex gap-2 mb-4">
            <button className="px-6 py-2 bg-[#1e40af] text-white rounded-md font-bold uppercase text-[10px] tracking-widest hover:bg-[#1e3a8a] shadow-sm transition-all">
              PRINT
            </button>
            <button className="px-6 py-2 bg-[#1e40af] text-white rounded-md font-bold uppercase text-[10px] tracking-widest hover:bg-[#1e3a8a] shadow-sm transition-all">
              LIST WITH KITS
            </button>
            <button className="px-6 py-2 bg-[#1e40af] text-white rounded-md font-bold uppercase text-[10px] tracking-widest hover:bg-[#1e3a8a] shadow-sm transition-all">
              LIST W/O KITS
            </button>
          </div>

          {/* === DATA TABLE === */}
          <div className="mt-5 flex-1 bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-zinc-100 z-10 shadow-sm">
                  <tr>
                    <th className="px-4 py-3 text-[10px] font-black text-slate-600 uppercase tracking-widest border-b border-zinc-200">Item Name</th>
                    <th className="px-4 py-3 text-[10px] font-black text-slate-600 uppercase tracking-widest border-b border-zinc-200">Barcode</th>
                    <th className="px-4 py-3 text-[10px] font-black text-slate-600 uppercase tracking-widest border-b border-zinc-200">Category</th>
                    <th className="px-4 py-3 text-[10px] font-black text-slate-600 uppercase tracking-widest border-b border-zinc-200 text-right">Unit Cost</th>
                    <th className="px-4 py-3 text-[10px] font-black text-slate-600 uppercase tracking-widest border-b border-zinc-200 text-right">Selling Price</th>
                    <th className="px-4 py-3 text-[10px] font-black text-slate-600 uppercase tracking-widest border-b border-zinc-200 text-right">Total Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredData.length > 0 ? (
                    filteredData.map((item, index) => (
                      <tr key={item.id} className={`hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-zinc-50'}`}>
                        <td className="px-4 py-3 text-xs font-bold text-slate-700">{item.name}</td>
                        <td className="px-4 py-3 text-xs font-bold text-slate-500">{item.barcode || '-'}</td>
                        <td className="px-4 py-3 text-xs font-bold text-slate-500">{item.category || 'Uncategorized'}</td>
                        <td className="px-4 py-3 text-xs font-bold text-slate-700 text-right">₱ {Number(item.unitCost).toFixed(2)}</td>
                        <td className="px-4 py-3 text-xs font-black text-blue-600 text-right">₱ {Number(item.sellingPrice).toFixed(2)}</td>
                        <td className="px-4 py-3 text-xs font-bold text-slate-700 text-right">₱ {Number(item.totalCost).toFixed(2)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-zinc-400 font-bold uppercase tracking-widest text-xs">
                        No items found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer / Pagination */}
            <div className="p-3 bg-zinc-50 border-t border-zinc-200 text-right text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              Showing {filteredData.length} Items
            </div>
          </div>

        </div>
      </div>

      {/* Keyframe animations (inject once) */}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(120%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes modalIn {
          from { transform: translateY(-16px) scale(0.97); opacity: 0; }
          to   { transform: translateY(0)     scale(1);    opacity: 1; }
        }
      `}</style>
    </>
  );
}

export default MenuList;