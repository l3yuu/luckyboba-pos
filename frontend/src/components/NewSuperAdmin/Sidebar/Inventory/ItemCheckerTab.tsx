"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, X, Barcode, Package, Tag, CheckCircle,
  XCircle, AlertTriangle, RefreshCw, Building2,
} from 'lucide-react';
import api from '../../../../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BranchStock {
  branch_id:     number;
  branch_name:   string;
  current_stock: number;
  reorder_level: number;
}

interface ItemResult {
  id:            number;
  name:          string;
  barcode?:      string;
  category?:     { name: string };
  category_name?: string;
  price?:        number;
  is_available:  boolean;
  branch_stocks?: BranchStock[];
  // raw material fallback
  unit?:         string;
  current_stock?: number;
  reorder_level?: number;
}

type SearchMode = 'menu' | 'stock';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const stockColor = (stock: number, reorder: number) => {
  if (stock === 0)           return { text: '#dc2626', bg: '#fef2f2', border: '#fecaca', label: 'Out of Stock' };
  if (stock <= reorder)      return { text: '#d97706', bg: '#fffbeb', border: '#fde68a', label: 'Low Stock'    };
  return                            { text: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', label: 'In Stock'     };
};

const formatPrice = (p?: number) =>
  p != null ? `₱${p.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—';

// ─── Result Card ──────────────────────────────────────────────────────────────

const MenuItemCard: React.FC<{ item: ItemResult }> = ({ item }) => {
  const cat = item.category?.name ?? item.category_name ?? '—';

  return (
    <div className="bg-white border border-zinc-200 rounded-[0.625rem] overflow-hidden shadow-sm">
      {/* Item header */}
      <div className="px-6 py-5 border-b border-zinc-100 bg-[#faf9ff] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#f5f0ff] border border-[#e9d5ff] rounded-xl flex items-center justify-center">
            <Tag size={18} className="text-[#7c14d4]" />
          </div>
          <div>
            <p className="text-base font-black text-[#1a0f2e]">{item.name}</p>
            <p className="text-[11px] text-zinc-400 font-medium">{cat}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-black text-[#7c14d4]">{formatPrice(item.price)}</p>
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-widest ${item.is_available ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
            {item.is_available ? 'Available' : 'Unavailable'}
          </span>
        </div>
      </div>

      {/* Details row */}
      <div className="grid grid-cols-3 border-b border-zinc-100 divide-x divide-zinc-100">
        {[
          { label: 'Item ID',  value: `#${item.id}` },
          { label: 'Barcode',  value: item.barcode ?? '—' },
          { label: 'Category', value: cat },
        ].map(d => (
          <div key={d.label} className="px-4 py-3 text-center">
            <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">{d.label}</p>
            <p className="text-xs font-bold text-zinc-700 tabular-nums">{d.value}</p>
          </div>
        ))}
      </div>

      {/* Branch availability */}
      {item.branch_stocks && item.branch_stocks.length > 0 && (
        <div className="px-6 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-3">Branch Availability</p>
          <div className="flex flex-col gap-2">
            {item.branch_stocks.map(bs => {
              const sc = stockColor(bs.current_stock, bs.reorder_level);
              const pct = bs.reorder_level > 0
                ? Math.min((bs.current_stock / (bs.reorder_level * 2)) * 100, 100)
                : 100;
              return (
                <div key={bs.branch_id} className="flex items-center gap-3 p-3 bg-zinc-50 border border-zinc-100 rounded-xl">
                  <div className="w-7 h-7 bg-[#f5f0ff] border border-[#e9d5ff] rounded-lg flex items-center justify-center shrink-0">
                    <Building2 size={12} className="text-[#7c14d4]" />
                  </div>
                  <p className="text-xs font-semibold text-zinc-700 flex-1 truncate">{bs.branch_name}</p>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: sc.text }} />
                    </div>
                    <span className="text-xs font-black tabular-nums" style={{ color: sc.text }}>{bs.current_stock}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border" style={{ background: sc.bg, color: sc.text, borderColor: sc.border }}>
                      {sc.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const RawMaterialCard: React.FC<{ item: ItemResult }> = ({ item }) => {
  const stock   = item.current_stock ?? 0;
  const reorder = item.reorder_level ?? 0;
  const sc      = stockColor(stock, reorder);
  const pct     = reorder > 0 ? Math.min((stock / (reorder * 2)) * 100, 100) : 100;

  return (
    <div className="bg-white border border-zinc-200 rounded-[0.625rem] overflow-hidden shadow-sm">
      <div className="px-6 py-5 border-b border-zinc-100 bg-[#faf9ff] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#f5f0ff] border border-[#e9d5ff] rounded-xl flex items-center justify-center">
            <Package size={18} className="text-[#7c14d4]" />
          </div>
          <div>
            <p className="text-base font-black text-[#1a0f2e]">{item.name}</p>
            <p className="text-[11px] text-zinc-400 font-medium">Raw Material · {item.unit ?? '—'}</p>
          </div>
        </div>
        <span className="text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-widest"
          style={{ background: sc.bg, color: sc.text, borderColor: sc.border }}>
          {sc.label}
        </span>
      </div>
      <div className="grid grid-cols-3 border-b border-zinc-100 divide-x divide-zinc-100">
        {[
          { label: 'Current Stock', value: `${stock} ${item.unit ?? ''}` },
          { label: 'Reorder Level', value: `${reorder} ${item.unit ?? ''}` },
          { label: 'Stock Health',  value: `${Math.round(pct)}%` },
        ].map(d => (
          <div key={d.label} className="px-4 py-3 text-center">
            <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">{d.label}</p>
            <p className="text-xs font-black text-zinc-700 tabular-nums">{d.value}</p>
          </div>
        ))}
      </div>
      <div className="px-6 py-4">
        <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: sc.text }} />
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const ItemCheckerTab: React.FC = () => {
  const [query,      setQuery]      = useState('');
  const [mode,       setMode]       = useState<SearchMode>('menu');
  const [results,    setResults]    = useState<ItemResult[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [barcodeMode, setBarcodeMode] = useState(false);
  const [barcodeBuffer, setBarcodeBuffer] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSearch = useCallback(async (q = query) => {
    if (!q.trim()) return;
    setLoading(true);
    setHasSearched(true);
    setResults([]);
    try {
      const endpoint = mode === 'menu' ? '/item-checker/search' : '/raw-materials';
      const res = await api.get(endpoint, { params: { query: q } });
      const data = res.data;
      setResults(Array.isArray(data) ? data : data?.data ?? []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [query, mode]);

  const handleBarcodeSearch = useCallback(async (barcode: string) => {
    setQuery(barcode);
    setLoading(true);
    setHasSearched(true);
    setResults([]);
    try {
      const res = await api.get(`/item-checker/${barcode}`);
      const data = res.data?.data ?? res.data;
      setResults(data ? [data] : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  // Barcode scanner listener (rapid keystrokes followed by Enter)
  useEffect(() => {
    if (!barcodeMode) return;
    let timer: ReturnType<typeof setTimeout>;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && barcodeBuffer.length > 3) {
        handleBarcodeSearch(barcodeBuffer);
        setBarcodeBuffer('');
        return;
      }
      if (e.key.length === 1) {
        setBarcodeBuffer(p => p + e.key);
        clearTimeout(timer);
        timer = setTimeout(() => setBarcodeBuffer(''), 100);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => { window.removeEventListener('keydown', handleKeyDown); clearTimeout(timer); };
  }, [barcodeMode, barcodeBuffer, handleBarcodeSearch]);

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setHasSearched(false);
    inputRef.current?.focus();
  };

  return (
    <div className="p-6 md:p-8 bg-[#f4f2fb] min-h-full">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wide text-[#1a0f2e]">Item Checker</h2>
          <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">
            Quick lookup · barcode scan or search by name
          </p>
        </div>
        <button
          onClick={() => { setBarcodeMode(v => !v); inputRef.current?.focus(); }}
          className={`flex items-center gap-1.5 px-3 py-2 h-9 rounded-lg border font-bold text-xs uppercase tracking-widest transition-all ${barcodeMode ? 'bg-[#7c14d4] text-white border-[#7c14d4]' : 'bg-white text-zinc-400 border-zinc-200 hover:text-[#7c14d4] hover:border-[#e9d5ff]'}`}>
          <Barcode size={14} /> {barcodeMode ? 'Scanning...' : 'Barcode Mode'}
        </button>
      </div>

      {/* Mode toggle */}
      <div className="flex items-center gap-2 mb-4">
        {(['menu', 'stock'] as SearchMode[]).map(m => (
          <button key={m} onClick={() => { setMode(m); handleClear(); }}
            className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-all ${mode === m ? 'bg-[#7c14d4] text-white' : 'bg-white border border-zinc-200 text-zinc-500 hover:border-[#e9d5ff] hover:text-[#7c14d4]'}`}>
            {m === 'menu' ? 'Menu Items' : 'Raw Materials'}
          </button>
        ))}
      </div>

      {/* Search bar */}
      <div className="flex items-center gap-3 mb-6">
        <div className={`flex items-center gap-3 bg-white border-2 rounded-xl flex-1 shadow-sm transition-all ${barcodeMode ? 'border-[#7c14d4]' : 'border-zinc-200 focus-within:border-[#7c14d4]'}`}>
          <div className="pl-4 text-zinc-400 shrink-0">
            {barcodeMode ? <Barcode size={20} className="text-[#7c14d4]" /> : <Search size={20} />}
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder={barcodeMode
              ? 'Scan barcode now — point scanner at item...'
              : `Search ${mode === 'menu' ? 'menu items' : 'raw materials'} by name...`}
            className="flex-1 h-14 text-base font-semibold text-[#1a0f2e] outline-none bg-transparent placeholder:text-zinc-300"
          />
          {query && (
            <button onClick={handleClear} className="pr-4 text-zinc-300 hover:text-red-500 transition-colors">
              <X size={18} />
            </button>
          )}
        </div>
        <button
          onClick={() => handleSearch()}
          disabled={loading || !query.trim()}
          className="bg-[#7c14d4] hover:bg-[#6a12b8] text-white px-6 h-14 rounded-xl font-bold text-sm uppercase tracking-widest transition-all disabled:opacity-50 flex items-center gap-2">
          {loading ? <RefreshCw size={16} className="animate-spin" /> : <Search size={16} />}
          {loading ? 'Searching' : 'Search'}
        </button>
      </div>

      {/* Barcode mode hint */}
      {barcodeMode && (
        <div className="flex items-center gap-3 p-4 bg-[#f5f0ff] border border-[#e9d5ff] rounded-xl mb-5">
          <Barcode size={20} className="text-[#7c14d4] shrink-0" />
          <div>
            <p className="text-xs font-bold text-[#1a0f2e]">Barcode scanner active</p>
            <p className="text-[11px] text-zinc-500">Point your scanner at any item. Results will appear automatically.</p>
          </div>
          <button onClick={() => setBarcodeMode(false)} className="ml-auto text-zinc-400 hover:text-zinc-600">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Results */}
      {loading && (
        <div className="flex flex-col gap-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white border border-zinc-200 rounded-[0.625rem] overflow-hidden">
              <div className="px-6 py-5 flex items-center gap-3">
                <div className="w-10 h-10 bg-zinc-100 rounded-xl animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-zinc-100 rounded animate-pulse w-1/3" />
                  <div className="h-3 bg-zinc-100 rounded animate-pulse w-1/4" />
                </div>
              </div>
              <div className="grid grid-cols-3 divide-x divide-zinc-100 border-t border-zinc-100">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="px-4 py-3">
                    <div className="h-2 bg-zinc-100 rounded animate-pulse mb-1 w-1/2 mx-auto" />
                    <div className="h-3 bg-zinc-100 rounded animate-pulse w-3/4 mx-auto" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && hasSearched && results.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-14 h-14 bg-zinc-100 border border-zinc-200 rounded-2xl flex items-center justify-center">
            <XCircle size={24} className="text-zinc-300" />
          </div>
          <p className="text-sm font-bold text-zinc-400">No items found for &ldquo;{query}&rdquo;</p>
          <p className="text-xs text-zinc-300 font-medium">Try a different name or check your spelling</p>
        </div>
      )}

      {!loading && !hasSearched && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 bg-[#f5f0ff] border border-[#e9d5ff] rounded-2xl flex items-center justify-center">
            <Search size={28} className="text-[#7c14d4]" />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-zinc-400">Search for any item</p>
            <p className="text-xs text-zinc-300 font-medium mt-1">Type a name or scan a barcode to check stock and pricing</p>
          </div>
          <div className="flex items-center gap-6 mt-2">
            {[
              { icon: <CheckCircle size={14} className="text-emerald-500" />, label: 'Real-time stock' },
              { icon: <Tag         size={14} className="text-[#7c14d4]"   />, label: 'Pricing info'   },
              { icon: <Building2  size={14} className="text-blue-500"    />, label: 'Per-branch data' },
              { icon: <AlertTriangle size={14} className="text-amber-500"/>, label: 'Low stock alerts'},
            ].map(f => (
              <div key={f.label} className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400">
                {f.icon}{f.label}
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div>
          <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-3">
            {results.length} result{results.length !== 1 ? 's' : ''} found
          </p>
          <div className="flex flex-col gap-4">
            {results.map(item =>
              mode === 'menu'
                ? <MenuItemCard  key={item.id} item={item} />
                : <RawMaterialCard key={item.id} item={item} />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemCheckerTab;