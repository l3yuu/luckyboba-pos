"use client"

import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';

const dashboardFont = { fontFamily: "'Inter', sans-serif" };

interface StockMovement {
  id: number;
  raw_material_id: number;
  type: 'add' | 'subtract' | 'set';
  quantity: number;
  reason: string | null;
  created_at: string;
  raw_material?: {
    id: number;
    name: string;
    unit: string;
  };
}

interface InventoryHistoryModalProps {
  onClose: () => void;
}

const TYPE_CONFIG = {
  add:      { label: 'Restock',   bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-400', sign: '+' },
  subtract: { label: 'Deducted',  bg: 'bg-red-50',     text: 'text-red-600',     border: 'border-red-200',     dot: 'bg-red-400',     sign: '−' },
  set:      { label: 'Set',       bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',    dot: 'bg-blue-400',    sign: '=' },
};

const isSaleDeduction = (reason: string | null) =>
  reason?.startsWith('Sale #') ?? false;

const isVoidReversal = (reason: string | null) =>
  reason?.startsWith('Void ·') ?? false;

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }),
    time: d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }),
  };
};

const InventoryHistoryModal = ({ onClose }: InventoryHistoryModalProps) => {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'add' | 'subtract' | 'set' | 'sales' | 'void'>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PER_PAGE = 20;

  const fetchMovements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/raw-materials/movements');
      setMovements(res.data);
    } catch (err) {
      console.error('Failed to fetch movements:', err);
      setError('Failed to load history. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  // Reset page when filter/search changes
  useEffect(() => { setPage(1); }, [filter, search]);

  const filtered = movements.filter(m => {
    const matchesSearch =
      !search ||
      m.raw_material?.name.toLowerCase().includes(search.toLowerCase()) ||
      m.reason?.toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      filter === 'all'      ? true :
      filter === 'sales'    ? isSaleDeduction(m.reason) :
      filter === 'void'     ? isVoidReversal(m.reason) :
      m.type === filter;

    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const counts = {
    all:      movements.length,
    sales:    movements.filter(m => isSaleDeduction(m.reason)).length,
    add:      movements.filter(m => m.type === 'add' && !isVoidReversal(m.reason)).length,
    subtract: movements.filter(m => m.type === 'subtract' && !isSaleDeduction(m.reason)).length,
    void:     movements.filter(m => isVoidReversal(m.reason)).length,
    set:      movements.filter(m => m.type === 'set').length,
  };

  const FILTERS: { key: typeof filter; label: string; count: number }[] = [
    { key: 'all',      label: 'All',          count: counts.all },
    { key: 'sales',    label: 'Sales',        count: counts.sales },
    { key: 'add',      label: 'Restock',      count: counts.add },
    { key: 'subtract', label: 'Manual Deduct',count: counts.subtract },
    { key: 'void',     label: 'Void',         count: counts.void },
    { key: 'set',      label: 'Set',          count: counts.set },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white rounded-xl border border-zinc-200 shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden"
        style={{ ...dashboardFont, maxHeight: '90vh' }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-zinc-100 shrink-0">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">Inventory</p>
            <h2 className="text-sm font-extrabold text-[#1c1c1e] mt-0.5">Stock Movement History</h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchMovements}
              disabled={loading}
              className="h-9 px-4 border border-zinc-200 text-zinc-500 font-bold text-[10px] uppercase tracking-widest hover:bg-zinc-50 transition-all rounded-lg flex items-center gap-1.5 disabled:opacity-40"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              Refresh
            </button>
            <button
              onClick={onClose}
              className="h-9 w-9 flex items-center justify-center text-zinc-300 hover:text-zinc-600 hover:bg-zinc-50 transition-all rounded-lg text-lg leading-none"
            >
              ×
            </button>
          </div>
        </div>

        {/* ── Filter Tabs ── */}
        <div className="px-7 pt-4 pb-0 shrink-0 flex gap-2 flex-wrap">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`h-8 px-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-1.5 border
                ${filter === f.key
                  ? 'bg-[#3b2063] text-white border-[#3b2063] shadow-sm'
                  : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
                }`}
            >
              {f.label}
              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${filter === f.key ? 'bg-white/20 text-white' : 'bg-zinc-100 text-zinc-400'}`}>
                {f.count}
              </span>
            </button>
          ))}
        </div>

        {/* ── Search ── */}
        <div className="px-7 py-3 shrink-0">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by ingredient or reason..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-10 py-2.5 text-xs font-semibold text-[#1c1c1e] outline-none focus:border-[#3b2063] focus:bg-white transition-all placeholder:text-zinc-400"
            />
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-zinc-300 absolute left-3 top-1/2 -translate-y-1/2">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-zinc-500 transition-colors text-sm leading-none">×</button>
            )}
          </div>
        </div>

        {/* ── Table ── */}
        <div className="flex-1 overflow-y-auto px-7 pb-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#3b2063]" />
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">Loading history...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <p className="text-sm font-bold text-red-500">{error}</p>
              <button onClick={fetchMovements} className="h-9 px-5 bg-[#3b2063] text-white font-bold text-xs uppercase tracking-widest rounded-lg">Retry</button>
            </div>
          ) : paginated.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-300">
                {search ? `No results for "${search}"` : 'No movements recorded yet'}
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white z-10 border-b border-zinc-100">
                <tr>
                  <th className="py-3 pr-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Date / Time</th>
                  <th className="py-3 pr-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Ingredient</th>
                  <th className="py-3 pr-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Type</th>
                  <th className="py-3 pr-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Quantity</th>
                  <th className="py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Reason / Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {paginated.map(m => {
                  const cfg = TYPE_CONFIG[m.type];
                  const { date, time } = formatDate(m.created_at);
                  const isSale = isSaleDeduction(m.reason);
                  const isVoid = isVoidReversal(m.reason);

                  return (
                    <tr key={m.id} className="hover:bg-[#f9f8ff] transition-colors group">
                      {/* Date */}
                      <td className="py-3 pr-4">
                        <div className="text-[11px] font-bold text-[#1c1c1e]">{date}</div>
                        <div className="text-[10px] text-zinc-400 font-medium">{time}</div>
                      </td>

                      {/* Ingredient */}
                      <td className="py-3 pr-4">
                        <span className="text-[12px] font-extrabold text-[#3b2063]">
                          {m.raw_material?.name ?? `Material #${m.raw_material_id}`}
                        </span>
                        {m.raw_material?.unit && (
                          <span className="ml-1.5 text-[9px] font-bold text-zinc-400 uppercase tracking-wider">{m.raw_material.unit}</span>
                        )}
                      </td>

                      {/* Type badge */}
                      <td className="py-3 pr-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[10px] font-bold uppercase tracking-widest ${
                          isVoid
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : isSale
                            ? 'bg-red-50 text-red-600 border-red-200'
                            : `${cfg.bg} ${cfg.text} ${cfg.border}`
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isVoid ? 'bg-amber-400' : isSale ? 'bg-red-400' : cfg.dot}`} />
                          {isVoid ? 'Void' : isSale ? 'Sale' : cfg.label}
                        </span>
                      </td>

                      {/* Quantity */}
                      <td className="py-3 pr-4">
                        <span className={`text-[13px] font-black ${
                          isVoid
                            ? 'text-amber-600'
                            : m.type === 'add'
                            ? 'text-emerald-600'
                            : m.type === 'subtract'
                            ? 'text-red-500'
                            : 'text-blue-600'
                        }`}>
                          {isVoid || m.type === 'add' ? '+' : m.type === 'subtract' ? '−' : '='}{Number(m.quantity).toFixed(4).replace(/\.?0+$/, '')}
                        </span>
                        {m.raw_material?.unit && (
                          <span className="ml-1 text-[10px] text-zinc-400 font-medium">{m.raw_material.unit}</span>
                        )}
                      </td>

                      {/* Reason */}
                      <td className="py-3 max-w-xs">
                        <span className="text-[11px] font-semibold text-zinc-500 leading-tight line-clamp-2">
                          {m.reason ?? '—'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Footer / Pagination ── */}
        {!loading && !error && filtered.length > 0 && (
          <div className="px-7 py-4 border-t border-zinc-100 flex items-center justify-between shrink-0 bg-white">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              {filtered.length} record{filtered.length !== 1 ? 's' : ''}
              {search || filter !== 'all' ? ` (filtered from ${movements.length})` : ''}
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="h-8 w-8 flex items-center justify-center border border-zinc-200 rounded-lg text-zinc-500 hover:border-zinc-300 hover:bg-zinc-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                  </svg>
                </button>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="h-8 w-8 flex items-center justify-center border border-zinc-200 rounded-lg text-zinc-500 hover:border-zinc-300 hover:bg-zinc-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryHistoryModal;