"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import 'react-simple-keyboard/build/css/index.css';
import TopNavbar from '../TopNavbar'; 
import type { KeyboardRef, Receipt } from '../../types/transactions';
import api from '../../services/api'; 
import { Calendar, Clock, Search, X, RotateCcw, ShieldAlert, FileCheck, Receipt as ReceiptIcon, Terminal } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

// Define interface to replace 'any' and pass linting
interface SimpleKeyboardInstance {
  setInput: (input: string) => void;
}

const CACHE_KEY = 'lucky_boba_receipt_cache';

// Persists across remounts
let hasInitialized = false;

const TableSkeleton = () => (
  <>
    {[...Array(5)].map((_, i) => (
      <tr key={`skeleton-${i}`} className="animate-pulse border-b border-zinc-100">
        <td className="px-6 py-5">
          <div className="h-4 w-28 bg-zinc-100 mb-2 rounded-none"></div>
          <div className="h-3 w-16 bg-zinc-50 rounded-none"></div>
        </td>
        <td className="px-6 py-5"><div className="h-4 w-12 bg-zinc-100 mx-auto rounded-none"></div></td>
        <td className="px-6 py-5"><div className="h-4 w-8 bg-zinc-100 mx-auto rounded-none"></div></td>
        <td className="px-6 py-5"><div className="h-4 w-24 bg-zinc-100 ml-auto rounded-none"></div></td>
        <td className="px-6 py-5"><div className="h-9 w-9 bg-zinc-100 mx-auto rounded-none"></div></td>
      </tr>
    ))}
  </>
);

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
    const voided = data
      .filter(item => item.status === 'cancelled')
      .reduce((acc, item) => acc + Number(item.total_amount || 0), 0);
    const net = gross - voided;
    return { gross, voided, net };
  }, [searchResults]);

  const handleSearch = useCallback(async (queryOverride?: string, dateOverride?: string) => {
    const activeQuery = typeof queryOverride === 'string' ? queryOverride : searchQuery;
    const activeDate = dateOverride || selectedDate;
    
    setIsLoading(true);
    setHasSearched(true);

    try {
      const response = await api.get('/receipts/search', {
        params: { 
          query: activeQuery,
          date: activeDate 
        }
      });
      
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

    const delayDebounceFn = setTimeout(() => {
      handleSearch(searchQuery, selectedDate);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
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
        } else {
          throw new Error("Invalid cache format");
        }
      } catch {
        sessionStorage.removeItem(`${CACHE_KEY}_results`);
        handleSearch('', selectedDate).then(() => setIsReady(true));
      }
    } else {
      handleSearch('', selectedDate).then(() => setIsReady(true));
    }
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
      const response = await api.patch(`/sales/${selectedSaleId}/cancel`, {
        reason: cancelReason
      });

      if (response.status === 200) {
        const updatedData = searchResults.map(item => 
          item.sale_id === selectedSaleId 
            ? { ...item, status: 'cancelled' as const, cancellation_reason: cancelReason } 
            : item
        );

        setSearchResults(updatedData);
        sessionStorage.setItem(`${CACHE_KEY}_results`, JSON.stringify(updatedData));
        setIsReasonModalOpen(false);
        setCancelReason('');
        localStorage.setItem('dashboard_needs_refresh', 'true');
        showToast('Order voided successfully!', 'success');
      }
    } catch (error) {
      console.error("Cancellation failed:", error);
      showToast('Failed to cancel order.', 'error');
    } finally {
      setIsVoiding(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (keyboardRef.current) {
      // Cast to interface instead of 'any' to fix linting error 179:31
      (keyboardRef.current as unknown as SimpleKeyboardInstance).setInput(val);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#f8f6ff] animate-in fade-in zoom-in duration-300 relative overflow-hidden">
      <TopNavbar />

      <div className={`flex-1 flex flex-col items-center justify-start p-4 md:p-8 gap-6 overflow-y-auto transition-all duration-300 ${showKeyboard ? 'pb-70' : ''}`}>
        
        {/* COMMAND BAR */}
        <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-3">
          <div className="flex-1 bg-white rounded-none border border-zinc-200 p-1 flex items-center shadow-sm">
            <div className="p-3 text-black"><Search size={18}/></div>
            <input 
              type="text" 
              value={searchQuery}
              onChange={handleInputChange}
              onFocus={() => setShowKeyboard(true)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="ENTER OR NUMBER FOR AUDIT..."
              className="flex-1 h-12 px-2 outline-none text-[#3b2063] font-black tracking-widest placeholder:text-black bg-transparent text-sm"
            />
            {searchQuery && <button onClick={() => {setSearchQuery(''); handleSearch('', selectedDate);}} className="p-3 text-black hover:text-red-500"><X size={16}/></button>}
          </div>

          <div className="flex gap-3">
            <div className="bg-white rounded-none border border-zinc-200 flex items-center px-5 gap-3 shadow-sm min-w-55">
              <Calendar size={16} className="text-[#3b2063]" />
              <input 
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  const newDate = e.target.value;
                  setSelectedDate(newDate);
                  handleSearch(searchQuery, newDate); 
                }}
                className="outline-none text-[#3b2063] font-black bg-transparent cursor-pointer text-[11px] tracking-widest uppercase flex-1"
              />
            </div>
            
            <button onClick={() => handleSearch()} disabled={isLoading} className="bg-[#3b2063] hover:bg-[#2a1647] text-white px-10 rounded-none font-black text-[10px] uppercase tracking-[0.3em] transition-all active:scale-[0.98] disabled:opacity-50 h-14">
              {isLoading ? '...' : 'Execute Search'}
            </button>
            
            <button onClick={handleRefresh} className="bg-white border border-zinc-200 text-black hover:text-[#3b2063] px-5 rounded-none transition-all active:rotate-180 duration-500 shadow-sm">
              <RotateCcw size={18} />
            </button>
          </div>
        </div>

        {/* FINANCIAL SUMMARY STRIP */}
        <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-3">
          <StatBox label="Gross Archive" value={stats.gross} icon={<ReceiptIcon size={16}/>} />
          <StatBox label="Voided Archive" value={stats.voided} icon={<ShieldAlert size={16}/>} isDanger />
          <StatBox label="Net Transferrable" value={stats.net} icon={<FileCheck size={16}/>} isBrand />
        </div>

        {/* DATA TABLE */}
        <div className="w-full max-w-6xl bg-white rounded-none border border-zinc-200 overflow-hidden flex-1 flex flex-col shadow-sm">
          <div className="px-8 py-5 border-b border-zinc-100 bg-zinc-50 flex justify-between items-center">
            <div className="flex items-center gap-4">
               <div className="p-2 bg-[#3b2063] text-white rounded-none"><Terminal size={14}/></div>
               <div className="flex flex-col">
                  <h3 className="text-[#3b2063] font-black text-[10px] uppercase tracking-[0.3em]">Transaction Audit Journal</h3>
                  <div className="flex items-center gap-1.5 mt-1 text-[9px] font-black text-black uppercase tracking-widest">
                    <Clock size={10} />
                    <span>Reference: {new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
               </div>
            </div>
            <span className="text-[9px] font-black text-black uppercase tracking-widest bg-white border border-zinc-200 px-4 py-1.5 rounded-none">
              {searchResults.length} ENTRIES FOUND
            </span>
          </div>
          
          <div className="flex-1 overflow-auto no-scrollbar">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-white z-10 border-b border-zinc-100">
                <tr>
                  <th className="px-8 py-4 text-[9px] font-black text-black uppercase tracking-[0.2em]">OR Reference / Status</th>
                  <th className="px-6 py-4 text-center text-[9px] font-black text-black uppercase tracking-[0.2em]">Term #</th>
                  <th className="px-6 py-4 text-center text-[9px] font-black text-black uppercase tracking-[0.2em]">Qty</th>
                  <th className="px-8 py-4 text-right text-[9px] font-black text-black uppercase tracking-[0.2em]">Total Sale</th>
                  <th className="px-6 py-4 text-center text-[9px] font-black text-black uppercase tracking-[0.2em]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {isLoading ? (
                  <TableSkeleton />
                ) : searchResults.length > 0 ? (
                  searchResults.map((item, index) => (
                    <tr 
                      key={item.sale_id || item.si_number || `receipt-${index}`} 
                      className="hover:bg-[#f8f6ff] transition-colors group"
                    >
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <span className="font-black text-[#3b2063] text-sm tabular-nums tracking-tighter">#{item.si_number}</span>
                          <span className={`text-[8px] font-black px-2 py-0.5 border uppercase tracking-widest rounded-none ${item.status === 'cancelled' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                            {item.status === 'cancelled' ? 'Voided' : 'Settled'}
                          </span>
                        </div>
                        <p className="text-[9px] text-black font-black uppercase tracking-widest mt-1">
                          Timestamp: {item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : 'N/A'}
                        </p>
                      </td>
                      <td className="px-6 py-5 text-center font-black text-black text-xs tabular-nums">{item.terminal}</td>
                      <td className="px-6 py-5 text-center font-black text-[#3b2063] text-xs tabular-nums">{item.items_count}</td>
                      <td className="px-8 py-5 text-right">
                        <span className={`text-sm font-black tabular-nums ${item.status === 'cancelled' ? 'text-black line-through' : 'text-[#3b2063]'}`}>
                          ₱ {Number(item.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        {item.status !== 'cancelled' ? (
                          <button
                            onClick={() => { setSelectedSaleId(item.sale_id); setIsReasonModalOpen(true); }}
                            className="bg-white border border-red-100 text-red-500 hover:bg-red-500 hover:text-white p-2.5 rounded-none transition-all active:translate-y-0.5"
                          >
                            <X size={14} strokeWidth={3} />
                          </button>
                        ) : <div className="p-2.5 opacity-0"><X size={14}/></div>}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-24 text-center">
                       <ReceiptIcon size={40} className="mx-auto text-zinc-100 mb-3" />
                       <p className="text-[10px] text-black uppercase font-black tracking-[0.3em]">
                        {hasSearched ? "No matching audit logs" : "Initialize search for journal review"}
                       </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* VOID AUTHORIZATION MODAL */}
      {isReasonModalOpen && (
        <div className="fixed inset-0 z-200 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-none border border-zinc-200 p-10 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
               <div className="p-2 bg-red-50 text-red-600 rounded-none"><ShieldAlert size={20}/></div>
               <h2 className="text-[#3b2063] font-black text-lg uppercase tracking-widest">Void Authorization</h2>
            </div>
            <p className="text-[10px] font-black text-black uppercase tracking-widest mb-4 ml-1">Input Justification</p>
            <textarea 
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="DESCRIBE REASON FOR CANCELLATION..."
              className="w-full h-32 p-5 bg-[#f8f6ff] border border-zinc-100 rounded-none outline-none focus:border-[#3b2063] transition-all text-xs font-black uppercase tracking-widest text-[#3b2063] resize-none"
            />
            <div className="flex gap-2 mt-8">
              <button 
                onClick={() => { setIsReasonModalOpen(false); setCancelReason(''); }} 
                disabled={isVoiding}
                className="flex-1 py-4 bg-zinc-50 border border-zinc-100 text-black font-black text-[10px] uppercase tracking-[0.2em] rounded-none hover:bg-zinc-100 transition-colors"
              >
                Abort
              </button>
              <button 
                onClick={handleConfirmCancel} 
                disabled={isVoiding || !cancelReason.trim()}
                className="flex-1 py-4 bg-red-600 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-none shadow-lg active:scale-[0.98] disabled:opacity-50"
              >
                {isVoiding ? 'Authorizing...' : 'Confirm Void'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- HELPER COMPONENT (PASSING LINTING) ---
const StatBox = ({ label, value, icon, isDanger, isBrand }: { label: string; value: number; icon: React.ReactNode; isDanger?: boolean; isBrand?: boolean }) => (
  <div className={`p-6 border border-zinc-200 flex flex-col justify-between shadow-sm rounded-none ${isBrand ? 'bg-[#3b2063]' : 'bg-white'}`}>
    <div className="flex items-center justify-between mb-4">
      <p className={`text-[9px] font-black uppercase tracking-[0.3em] ${isBrand ? 'text-purple-300' : 'text-black'}`}>{label}</p>
      <div className={`p-1.5 rounded-none ${isBrand ? 'text-purple-300 bg-white/10' : 'text-black bg-zinc-50'}`}>{icon}</div>
    </div>
    <p className={`text-2xl font-black tabular-nums ${isBrand ? 'text-white' : (isDanger ? 'text-red-500' : 'text-black')}`}>
      {isDanger && '- '}₱ {value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
    </p>
  </div>
);

export default SearchReceipts;
