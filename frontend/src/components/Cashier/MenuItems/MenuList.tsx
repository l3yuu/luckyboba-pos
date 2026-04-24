"use client"

import { useState, useEffect, useCallback } from 'react';
import TopNavbar from '../../Cashier/TopNavbar';
import api from '../../../services/api';
import * as XLSX from 'xlsx';
import { Search, Printer, FileDown, Layers, CheckCircle2, X, Terminal, Database, Package, RefreshCw } from 'lucide-react';

interface MenuItem {
  id: number;
  name: string;
  barcode: string | null;
  category: string | null;
  unitCost: number;
  sellingPrice: number;
  price: number;
  totalCost: number;
  status?: 'ACTIVE' | 'INACTIVE';
  type?: 'FOOD' | 'DRINK';
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

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

// ── Main Component ─────────────────────────────────────────────────────────────
function MenuList() {
  const [menuData, setMenuData] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterName, setFilterName] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);

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
          <RefreshCw size={22} className="animate-spin text-[#6a12b8]" />
          <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Loading menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#f4f2fb] h-full flex flex-col overflow-hidden">
      <ToastNotification toasts={toasts} onRemove={removeToast} />

      <TopNavbar />

      <div className="flex-1 overflow-y-auto p-5 md:p-7 flex flex-col gap-4">

        {/* ── Filter Bar ── */}
        <div className="bg-white border border-zinc-200 p-5 shadow-sm rounded-[0.625rem]">
          <div className="flex flex-col xl:flex-row gap-3 items-end">
            <div className="flex-1 w-full space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                <Search size={10} /> Search
              </label>
              <input
                type="text"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                className="w-full px-4 py-3 border border-[#e9d5ff] bg-[#f5f0ff] text-[#1a0f2e] font-semibold text-sm outline-none focus:border-[#6a12b8] focus:bg-white transition-all placeholder:text-zinc-300 rounded-[0.625rem]"
                placeholder="Name or barcode..."
              />
            </div>
            <div className="flex-1 w-full space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                <Layers size={10} /> Category
              </label>
              <input
                type="text"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-4 py-3 border border-[#e9d5ff] bg-[#f5f0ff] text-[#1a0f2e] font-semibold text-sm outline-none focus:border-[#6a12b8] focus:bg-white transition-all placeholder:text-zinc-300 rounded-[0.625rem]"
                placeholder="Filter by category..."
              />
            </div>
            <div className="flex gap-2 w-full xl:w-auto">
            </div>
          </div>
        </div>

        {/* ── Action Ribbon ── */}
        <div className="flex gap-2 items-center">
          <button
            onClick={() => window.print()}
            className="h-9 px-4 bg-white border border-[#e9d5ff] text-zinc-600 font-bold text-[11px] uppercase tracking-widest hover:border-[#6a12b8] hover:text-[#6a12b8] transition-colors flex items-center gap-2 rounded-[0.625rem]"
          >
            <Printer size={13} strokeWidth={2} /> Print
          </button>
          <button
            onClick={generateExcel}
            className="h-9 px-4 bg-white border border-[#e9d5ff] text-zinc-600 font-bold text-[11px] uppercase tracking-widest hover:border-[#6a12b8] hover:text-[#6a12b8] transition-colors flex items-center gap-2 rounded-[0.625rem]"
          >
            <FileDown size={13} strokeWidth={2} /> Export XLS
          </button>
          <div className="flex-1" />
          <div className="h-9 px-4 bg-[#f5f0ff] border border-[#e9d5ff] flex items-center gap-2 rounded-[0.625rem]">
            <Database size={12} className="text-[#6a12b8]" />
            <span className="text-[11px] font-bold text-zinc-600 uppercase tracking-widest">
              {filteredData.length} <span className="text-zinc-400 font-medium">Records</span>
            </span>
          </div>
        </div>

        {/* ── Table ── */}
        <div className="flex-1 bg-white border border-zinc-200 overflow-hidden flex flex-col shadow-sm rounded-[0.625rem]">
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-white z-10 border-b border-[#e9d5ff]">
                <tr className="bg-[#f5f0ff]">
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
                  <tr key={item.id} className="hover:bg-[#f5f0ff] transition-colors">
                    <td className="px-7 py-3.5">
                      <span className="text-sm font-bold text-[#1a0f2e]">{item.name}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-medium text-zinc-400 tabular-nums">{item.barcode || '—'}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-1 bg-[#f5f0ff] border border-[#e9d5ff] text-[10px] font-bold text-[#6a12b8] uppercase tracking-wide rounded-sm">
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
          <div className="px-7 py-3.5 bg-white border-t border-[#e9d5ff] flex items-center justify-between">
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

