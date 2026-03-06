"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import 'react-simple-keyboard/build/css/index.css';
import TopNavbar from '../TopNavbar'; 
import type { KeyboardRef, Receipt } from '../../types/transactions';
import api from '../../services/api'; 
import { Calendar, Clock, Search, X, RotateCcw, ShieldAlert, FileCheck, Receipt as ReceiptIcon, Terminal } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

interface SimpleKeyboardInstance {
  setInput: (input: string) => void;
}

const CACHE_KEY = 'lucky_boba_receipt_cache';
let hasInitialized = false;

// ── Skeleton ──────────────────────────────────────────────────────────────────
const TableSkeleton = () => (
  <>
    {[...Array(5)].map((_, i) => (
      <tr key={`skeleton-${i}`} className="animate-pulse border-b border-zinc-100">
        <td className="px-7 py-4">
          <div className="h-4 w-32 bg-zinc-100 mb-2" />
          <div className="h-3 w-20 bg-zinc-50" />
        </td>
        <td className="px-6 py-4"><div className="h-4 w-10 bg-zinc-100 mx-auto" /></td>
        <td className="px-6 py-4"><div className="h-4 w-8 bg-zinc-100 mx-auto" /></td>
        <td className="px-6 py-4"><div className="h-4 w-28 bg-zinc-100 ml-auto" /></td>
        <td className="px-6 py-4"><div className="h-9 w-9 bg-zinc-100 mx-auto" /></td>
      </tr>
    ))}
  </>
);

// ── Main Component ────────────────────────────────────────────────────────────
const SearchReceipts = () => {
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchResults, setSearchResults] = useState<Receipt[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiding, setIsVoiding] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isReasonModalOpen, setIsReasonModalOpen] = useState(false);
  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const keyboardRef = useRef<KeyboardRef>(null);

  const stats = useMemo(() => {
    const data = Array.isArray(searchResults) ? searchResults : [];
    const gross = data.reduce((acc, item) => acc + Number(item.total_amount || 0), 0);
    const voided = data.filter(i => i.status === 'cancelled').reduce((acc, i) => acc + Number(i.total_amount || 0), 0);
    return { gross, voided, net: gross - voided };
  }, [searchResults]);

  const handleSearch = useCallback(async (queryOverride?: string, dateOverride?: string) => {
    const activeQuery = typeof queryOverride === 'string' ? queryOverride : searchQuery;
    const activeDate = dateOverride || selectedDate;
    setIsLoading(true);
    setHasSearched(true);
    try {
      const response = await api.get('/receipts/search', { params: { query: activeQuery, date: activeDate } });
      const data = Array.isArray(response.data) ? response.data : (response.data.data || []);
      setSearchResults(data);
      sessionStorage.setItem(`${CACHE_KEY}_query`, activeQuery);
      sessionStorage.setItem(`${CACHE_KEY}_date`, activeDate);
      sessionStorage.setItem(`${CACHE_KEY}_results`, JSON.stringify(data));
    } catch (error) {
      console.error("Search Error:", error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
      setShowKeyboard(false);
    }
  }, [searchQuery, selectedDate]);

  useEffect(() => {
    if (!isReady) return;
    if (!searchQuery && !hasSearched) return;
    const t = setTimeout(() => handleSearch(searchQuery, selectedDate), 500);
    return () => clearTimeout(t);
  }, [searchQuery, selectedDate, handleSearch, hasSearched, isReady]);

  useEffect(() => {
    if (hasInitialized) return;
    hasInitialized = true;
    const cachedResults = sessionStorage.getItem(`${CACHE_KEY}_results`);
    const cachedQuery = sessionStorage.getItem(`${CACHE_KEY}_query`);
    const cachedDate = sessionStorage.getItem(`${CACHE_KEY}_date`);
    if (cachedResults) {
      try {
        const parsed = JSON.parse(cachedResults);
        if (Array.isArray(parsed)) {
          setSearchResults(parsed);
          setSearchQuery(cachedQuery || '');
          if (cachedDate) setSelectedDate(cachedDate);
          setHasSearched(true);
          setIsReady(true);
          return;
        }
      } catch { sessionStorage.removeItem(`${CACHE_KEY}_results`); }
    }
    handleSearch('', selectedDate).then(() => setIsReady(true));
  }, [handleSearch, selectedDate]);

  const handleRefresh = () => {
    const today = new Date().toISOString().split('T')[0];
    sessionStorage.removeItem(`${CACHE_KEY}_query`);
    sessionStorage.removeItem(`${CACHE_KEY}_results`);
    sessionStorage.removeItem(`${CACHE_KEY}_date`);
    hasInitialized = false;
    setSearchQuery('');
    setSelectedDate(today);
    setIsReady(false);
    handleSearch('', today).then(() => setIsReady(true));
  };

  const handleConfirmCancel = async () => {
    if (!cancelReason.trim() || !selectedSaleId) return;
    setIsVoiding(true);
    try {
      const response = await api.patch(`/sales/${selectedSaleId}/cancel`, { reason: cancelReason });
      if (response.status === 200) {
        const updated = searchResults.map(item =>
          item.sale_id === selectedSaleId
            ? { ...item, status: 'cancelled' as const, cancellation_reason: cancelReason }
            : item
        );
        setSearchResults(updated);
        sessionStorage.setItem(`${CACHE_KEY}_results`, JSON.stringify(updated));
        setIsReasonModalOpen(false);
        setCancelReason('');
        localStorage.setItem('dashboard_needs_refresh', 'true');
        showToast('Order voided successfully!', 'success');
      }
    } catch (error) {
      console.error("Cancellation failed:", error);
      showToast('Failed to cancel order.', 'error');
    } finally { setIsVoiding(false); }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (keyboardRef.current) {
      (keyboardRef.current as unknown as SimpleKeyboardInstance).setInput(val);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#f4f2fb] relative overflow-hidden">
      <TopNavbar />

      <div className={`flex-1 flex flex-col items-center justify-start p-5 md:p-7 gap-5 overflow-y-auto transition-all duration-300 ${showKeyboard ? 'pb-72' : ''}`}>

        {/* ── Search Bar ── */}
        <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-3">
          {/* Search Input */}
          <div className="flex-1 bg-white border border-zinc-200 flex items-center shadow-sm">
            <div className="px-4 text-zinc-400"><Search size={17} /></div>
            <input
              type="text"
              value={searchQuery}
              onChange={handleInputChange}
              onFocus={() => setShowKeyboard(true)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search by OR number or transaction..."
              className="flex-1 h-12 px-2 outline-none text-[#1a0f2e] font-semibold text-sm placeholder:text-zinc-300 bg-transparent"
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(''); handleSearch('', selectedDate); }} className="px-4 text-zinc-300 hover:text-red-500 transition-colors">
                <X size={15} />
              </button>
            )}
          </div>

          <div className="flex gap-3">
            {/* Date Picker */}
            <div className="bg-white border border-zinc-200 flex items-center px-5 gap-3 shadow-sm min-w-52">
              <Calendar size={15} className="text-violet-500 shrink-0" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => { setSelectedDate(e.target.value); handleSearch(searchQuery, e.target.value); }}
                className="outline-none text-[#1a0f2e] font-semibold bg-transparent cursor-pointer text-sm flex-1"
              />
            </div>

            {/* Search Button */}
            <button
              onClick={() => handleSearch()}
              disabled={isLoading}
              className="bg-[#3b2063] hover:bg-[#2a1647] text-white px-8 font-bold text-sm uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-50 h-12"
            >
              {isLoading ? '...' : 'Search'}
            </button>

            {/* Refresh */}
            <button
              onClick={handleRefresh}
              className="bg-white border border-zinc-200 text-zinc-400 hover:text-[#3b2063] hover:border-[#3b2063] px-4 transition-all duration-300 hover:rotate-180 shadow-sm"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>

        {/* ── Stats Strip ── */}
        <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatBox label="Gross Sales" value={stats.gross} icon={<ReceiptIcon size={16} />} />
          <StatBox label="Voided Sales" value={stats.voided} icon={<ShieldAlert size={16} />} isDanger />
          <StatBox label="Net Sales" value={stats.net} icon={<FileCheck size={16} />} isBrand />
        </div>

        {/* ── Table ── */}
        <div className="w-full max-w-6xl bg-white border border-zinc-200 overflow-hidden flex-1 flex flex-col shadow-sm">

          {/* Table Header */}
          <div className="px-7 py-5 border-b border-zinc-100 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#3b2063] flex items-center justify-center">
                <Terminal size={15} className="text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1a0f2e] uppercase tracking-widest">Transaction Audit Journal</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Clock size={11} className="text-zinc-400" />
                  <span className="text-[11px] font-medium text-zinc-400">
                    {new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest bg-zinc-50 border border-zinc-200 px-4 py-2">
              {searchResults.length} entries
            </span>
          </div>

          {/* Table Body */}
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-white z-10 border-b border-zinc-100">
                <tr>
                  <th className="px-7 py-3.5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">OR / Status</th>
                  <th className="px-6 py-3.5 text-center text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Terminal</th>
                  <th className="px-6 py-3.5 text-center text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Items</th>
                  <th className="px-7 py-3.5 text-right text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Total</th>
                  <th className="px-6 py-3.5 text-center text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Void</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {isLoading ? (
                  <TableSkeleton />
                ) : searchResults.length > 0 ? (
                  searchResults.map((item, index) => (
                    <tr key={item.sale_id || item.si_number || `receipt-${index}`} className="hover:bg-[#f4f2fb] transition-colors">
                      <td className="px-7 py-4">
                        <div className="flex items-center gap-2.5">
                          <span className="font-bold text-[#1a0f2e] text-sm tabular-nums">#{item.si_number}</span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 border uppercase tracking-widest ${
                            item.status === 'cancelled'
                              ? 'bg-red-50 text-red-600 border-red-100'
                              : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                          }`}>
                            {item.status === 'cancelled' ? 'Voided' : 'Settled'}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 font-medium mt-0.5">
                          {item.created_at
                            ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
                            : 'N/A'}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-semibold text-zinc-500 tabular-nums">{item.terminal}</td>
                      <td className="px-6 py-4 text-center text-sm font-bold text-[#1a0f2e] tabular-nums">{item.items_count}</td>
                      <td className="px-7 py-4 text-right">
                        <span className={`text-sm font-bold tabular-nums ${item.status === 'cancelled' ? 'text-zinc-300 line-through' : 'text-[#1a0f2e]'}`}>
                          ₱{Number(item.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {item.status !== 'cancelled' ? (
                          <button
                            onClick={() => { setSelectedSaleId(item.sale_id); setIsReasonModalOpen(true); }}
                            className="w-9 h-9 inline-flex items-center justify-center bg-white border border-red-200 text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all"
                          >
                            <X size={14} strokeWidth={2.5} />
                          </button>
                        ) : (
                          <div className="w-9 h-9" />
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-24 text-center">
                      <ReceiptIcon size={36} className="mx-auto text-zinc-200 mb-3" />
                      <p className="text-[11px] font-bold text-zinc-300 uppercase tracking-widest">
                        {hasSearched ? 'No matching transactions found' : 'Search to load journal entries'}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Void Modal ── */}
      {isReasonModalOpen && (
        <div className="fixed inset-0 z-200 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md border border-zinc-200 p-9 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-red-50 border border-red-100 flex items-center justify-center">
                <ShieldAlert size={18} className="text-red-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Authorization Required</p>
                <h2 className="text-sm font-bold text-[#1a0f2e] uppercase tracking-widest">Void Transaction</h2>
              </div>
            </div>

            <div className="space-y-1.5 mb-5">
              <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 block">Reason for Cancellation</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Describe the reason for this void..."
                className="w-full h-28 p-4 bg-[#f4f2fb] border border-zinc-200 outline-none focus:border-[#3b2063] transition-all text-sm font-medium text-[#1a0f2e] resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setIsReasonModalOpen(false); setCancelReason(''); }}
                disabled={isVoiding}
                className="flex-1 py-3.5 bg-white border border-zinc-200 text-zinc-600 font-bold text-sm uppercase tracking-widest hover:bg-zinc-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={isVoiding || !cancelReason.trim()}
                className="flex-1 py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold text-sm uppercase tracking-widest transition-colors disabled:opacity-50 active:scale-[0.98]"
              >
                {isVoiding ? 'Processing...' : 'Confirm Void'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Stat Box ──────────────────────────────────────────────────────────────────
const StatBox = ({ label, value, icon, isDanger, isBrand }: {
  label: string; value: number; icon: React.ReactNode; isDanger?: boolean; isBrand?: boolean;
}) => (
  <div className={`px-6 py-5 border flex items-center justify-between shadow-sm ${isBrand ? 'bg-[#3b2063] border-[#2a1647]' : 'bg-white border-zinc-200'}`}>
    <div>
      <p className={`text-[11px] font-bold uppercase tracking-widest mb-1 ${isBrand ? 'text-violet-300' : 'text-zinc-500'}`}>{label}</p>
      <p className={`text-2xl font-bold tabular-nums ${isBrand ? 'text-white' : isDanger ? 'text-red-600' : 'text-[#1a0f2e]'}`}>
        {isDanger && value > 0 && <span className="text-base mr-1">-</span>}
        ₱{value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
      </p>
    </div>
    <div className={`w-10 h-10 flex items-center justify-center ${isBrand ? 'bg-white/10 text-violet-200' : 'bg-zinc-50 border border-zinc-200 text-zinc-400'}`}>
      {icon}
    </div>
  </div>
);

export default SearchReceipts;