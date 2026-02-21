"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import 'react-simple-keyboard/build/css/index.css';
import TopNavbar from '../TopNavbar'; 
import type { KeyboardRef, Receipt } from '../../types/transactions';
import api from '../../services/api'; 
import { Calendar, Clock, Search, X, RotateCcw } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

const CACHE_KEY = 'lucky_boba_receipt_cache';

const SearchReceipts = () => {
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchResults, setSearchResults] = useState<Receipt[]>([]); 
  const [hasSearched, setHasSearched] = useState(false); 
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiding, setIsVoiding] = useState(false); 
  
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
    const cachedResults = sessionStorage.getItem(`${CACHE_KEY}_results`);
    const cachedQuery = sessionStorage.getItem(`${CACHE_KEY}_query`);
    const cachedDate = sessionStorage.getItem(`${CACHE_KEY}_date`);

    if (cachedResults) {
      try {
        const parsed = JSON.parse(cachedResults);
        setSearchResults(parsed);
        setSearchQuery(cachedQuery || '');
        if (cachedDate) setSelectedDate(cachedDate);
        setHasSearched(true);
      } catch {
        handleSearch('', selectedDate);
      }
    } else {
      handleSearch('', selectedDate);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = () => {
    const today = new Date().toISOString().split('T')[0];
    sessionStorage.removeItem(`${CACHE_KEY}_query`);
    sessionStorage.removeItem(`${CACHE_KEY}_results`);
    sessionStorage.removeItem(`${CACHE_KEY}_date`);
    setSearchQuery('');
    setSelectedDate(today);
    handleSearch('', today);
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
        (keyboardRef.current as unknown as { setInput: (s: string) => void }).setInput(val);
      }
    };

  return (
    <div className="flex flex-col h-full w-full bg-[#f8f6ff] animate-in fade-in zoom-in duration-300 relative overflow-hidden">
      <TopNavbar />

      <div className={`flex-1 flex flex-col items-center justify-start p-6 gap-6 overflow-y-auto transition-all duration-300 ${showKeyboard ? 'pb-87.5' : ''}`}>
        
        <div className="w-full max-w-5xl flex flex-col md:flex-row gap-4">
          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-zinc-200 p-2 flex items-center">
             <Search className="w-5 h-5 text-zinc-300 ml-2" />
             <input 
              type="text" 
              value={searchQuery}
              onChange={handleInputChange}
              onFocus={() => setShowKeyboard(true)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search SI#..."
              className="flex-1 h-12 px-4 outline-none text-[#3b2063] font-bold placeholder:text-zinc-300 bg-transparent"
            />
          </div>

          <div className="flex gap-2">
            <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-2 flex items-center px-4 gap-2">
               <Calendar className="w-4 h-4 text-zinc-400" />
               <input 
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  const newDate = e.target.value;
                  setSelectedDate(newDate);
                  handleSearch(searchQuery, newDate); 
                }}
                className="outline-none text-[#3b2063] font-bold bg-transparent cursor-pointer text-sm"
              />
            </div>
            {/* TODAY BUTTON REMOVED FROM HERE */}
          </div>

          <button onClick={() => handleSearch()} disabled={isLoading} className="bg-[#3b2063] hover:bg-[#2a1647] text-white px-8 py-4 md:py-0 rounded-2xl font-black text-xs uppercase transition-all active:scale-95 disabled:opacity-50 min-w-30">
            {isLoading ? '...' : 'Search'}
          </button>
          
          <button onClick={handleRefresh} className="bg-white border border-zinc-200 text-zinc-400 hover:text-[#3b2063] p-4 rounded-2xl transition-all active:rotate-180 duration-500 shadow-sm">
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Cards */}
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-zinc-100 shadow-sm">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Gross Total</p>
                <p className="text-xl font-black text-zinc-400">₱ {stats.gross.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-zinc-100 shadow-sm">
                <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Voided Amount</p>
                <p className="text-xl font-black text-red-500">- ₱ {stats.voided.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-[#3b2063] p-5 rounded-3xl shadow-lg">
                <p className="text-[10px] font-black text-purple-200 uppercase tracking-widest mb-1">Net Sales ({selectedDate === new Date().toISOString().split('T')[0] ? 'Today' : 'History'})</p>
                <p className="text-xl font-black text-white">₱ {stats.net.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
        </div>

        <div className="w-full max-w-5xl bg-white rounded-4xl shadow-sm border border-zinc-200 overflow-hidden flex-1 flex flex-col">
            <div className="px-8 py-5 border-b border-zinc-100 bg-zinc-50 flex justify-between items-center">
                <div className="flex flex-col">
                  <h3 className="text-[#3b2063] font-black text-xs uppercase tracking-[0.2em]">Transaction Audit</h3>
                  <div className="flex items-center gap-1.5 mt-1 text-[10px] font-bold text-zinc-400">
                    <Clock className="w-3 h-3" />
                    <span>Viewing: {new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase bg-zinc-100 px-3 py-1 rounded-full">
                    {searchResults.length} Records Found
                </span>
            </div>
            
            <div className="flex-1 overflow-auto no-scrollbar">
              <table className="w-full text-left relative">
                <thead className="sticky top-0 bg-white z-10 shadow-sm">
                  <tr className="border-b border-zinc-100">
                    <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">SI # / Status</th>
                    <th className="px-6 py-4 text-center text-[10px] font-bold text-zinc-400 uppercase tracking-widest">TRML #</th>
                    <th className="px-6 py-4 text-center text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Items</th>
                    <th className="px-6 py-4 text-right text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Total Sales</th>
                    <th className="px-6 py-4 text-center text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {isLoading ? (
                    <tr><td colSpan={5} className="py-20 text-center text-zinc-400 italic">Fetching audit data...</td></tr>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((item) => (
                     <tr key={item.id} className="hover:bg-[#f8f6ff] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                            <span className="font-black text-[#3b2063] text-sm">#{item.si_number}</span>
                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${item.status === 'cancelled' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                {item.status === 'cancelled' ? 'Voided' : 'Paid'}
                            </span>
                        </div>
                        <p className="text-[10px] text-zinc-400 font-medium">
                          {item.created_at ? new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A'}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-zinc-600">{item.terminal}</td>
                      <td className="px-6 py-4 text-center font-bold text-zinc-600">{item.items_count}</td>
                      <td className="px-6 py-4 text-right">
                        <span className={`text-xs font-bold ${item.status === 'cancelled' ? 'text-zinc-300 line-through' : 'text-emerald-700'}`}>
                          ₱ {Number(item.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {item.status !== 'cancelled' && (
                            <button 
                                onClick={() => { setSelectedSaleId(item.sale_id); setIsReasonModalOpen(true); }} 
                                className="bg-red-50 text-red-500 hover:bg-red-500 hover:text-white p-2 rounded-lg transition-all active:scale-90"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                      </td>
                    </tr>
                   ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-20 text-center text-zinc-300 uppercase font-bold text-xs">
                        {hasSearched ? "No matching records found" : "Search to see transaction audit"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
        </div>
      </div>

      {/* VOID MODAL */}
      {isReasonModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 border border-zinc-100">
                <h2 className="text-[#3b2063] font-black text-lg uppercase tracking-widest mb-2">Void Transaction</h2>
                <textarea 
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Enter reason..."
                    className="w-full h-32 p-4 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none focus:border-[#3b2063] transition-all text-sm font-bold text-[#3b2063] resize-none"
                />
                <div className="flex gap-4 mt-8">
                    <button 
                      onClick={() => { setIsReasonModalOpen(false); setCancelReason(''); }} 
                      disabled={isVoiding}
                      className="flex-1 py-4 rounded-2xl font-black text-xs uppercase text-zinc-400"
                    >
                      Back
                    </button>
                    <button 
                      onClick={handleConfirmCancel} 
                      disabled={isVoiding || !cancelReason.trim()}
                      className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-black text-xs uppercase shadow-lg active:scale-95 disabled:opacity-50"
                    >
                      {isVoiding ? 'Processing...' : 'Void Sale'}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default SearchReceipts;