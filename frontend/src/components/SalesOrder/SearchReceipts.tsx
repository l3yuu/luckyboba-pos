import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import 'react-simple-keyboard/build/css/index.css';
import TopNavbar from '../TopNavbar'; 
import type { KeyboardRef, Receipt } from '../../types/transactions';
import api from '../../services/api'; 

const CACHE_KEY = 'lucky_boba_receipt_cache';

const SearchReceipts = ({ onSuccess }: { onSuccess?: () => void }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Receipt[]>([]); 
  const [hasSearched, setHasSearched] = useState(false); 
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiding, setIsVoiding] = useState(false);
  
  const [isReasonModalOpen, setIsReasonModalOpen] = useState(false);
  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  
  const keyboardRef = useRef<KeyboardRef>(null);

  // Stats calculation with safe array check
  const stats = useMemo(() => {
    const data = Array.isArray(searchResults) ? searchResults : [];
    const gross = data.reduce((acc, item) => acc + Number(item.total_amount || 0), 0);
    const voided = data
      .filter(item => item.status === 'cancelled')
      .reduce((acc, item) => acc + Number(item.total_amount || 0), 0);
    const net = gross - voided;
    return { gross, voided, net };
  }, [searchResults]);

  // handleSearch logic
  const handleSearch = useCallback(async (queryOverride?: string) => {
      const activeQuery = typeof queryOverride === 'string' ? queryOverride : searchQuery;
      setIsLoading(true);
      setHasSearched(true);

      try {
          const response = await api.get('/receipts/search', {
              params: { query: activeQuery }
          });
          
          // LOG THIS: Open your browser console (F12) to see if data is actually coming back
          console.log("API Response:", response.data);

          // Ensure we extract the array correctly
          const data = Array.isArray(response.data) 
              ? response.data 
              : (response.data.data || []); // Safety if you keep the object format
              
          setSearchResults(data);

          sessionStorage.setItem(`${CACHE_KEY}_query`, activeQuery);
          sessionStorage.setItem(`${CACHE_KEY}_results`, JSON.stringify(data));

      } catch (error) {
          console.error("Search Error:", error);
          setSearchResults([]); 
      } finally {
          setIsLoading(false);
          setShowKeyboard(false);
      }
  }, [searchQuery]);

  // Initial Data Fetch / Cache Load
  useEffect(() => {
      const cachedResults = sessionStorage.getItem(`${CACHE_KEY}_results`);
      const cachedQuery = sessionStorage.getItem(`${CACHE_KEY}_query`);

      if (cachedResults) {
        try {
          const parsed = JSON.parse(cachedResults);
          setSearchResults(Array.isArray(parsed) ? parsed : []);
          setSearchQuery(cachedQuery || '');
          setHasSearched(true);
        } catch {
          handleSearch(''); 
        }
      } else {
        handleSearch('');
      }
      // FIX: Include handleSearch in dependencies to satisfy ESLint
    }, [handleSearch]);

  const handleRefresh = () => {
    sessionStorage.removeItem(`${CACHE_KEY}_query`);
    sessionStorage.removeItem(`${CACHE_KEY}_results`);
    setSearchQuery('');
    handleSearch('');
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

        // Notify Dashboard
        localStorage.setItem('dashboard_needs_refresh', 'true');
        if (onSuccess) onSuccess();
        alert('Order voided successfully!');
      }
    } catch (error) {
      console.error("Cancellation failed:", error);
      alert('Failed to cancel order.');
    } finally {
      setIsVoiding(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (keyboardRef.current) keyboardRef.current.setInput(val);
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#f8f6ff] animate-in fade-in zoom-in duration-300 relative overflow-hidden">
      <TopNavbar />

      <div className={`flex-1 flex flex-col items-center justify-start p-6 gap-6 overflow-y-auto transition-all duration-300 ${showKeyboard ? 'pb-87.5' : ''}`}>
        
        <div className="w-full max-w-5xl flex gap-4">
          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-zinc-200 p-2 flex items-center">
             <input 
              type="text" 
              value={searchQuery}
              onChange={handleInputChange}
              onFocus={() => setShowKeyboard(true)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search by SI#, Cashier, or Terminal..."
              className="flex-1 h-12 px-4 outline-none text-[#3b2063] font-bold placeholder:text-zinc-300 bg-transparent"
            />
          </div>
          <button onClick={() => handleSearch()} disabled={isLoading} className="bg-[#3b2063] hover:bg-[#2a1647] text-white px-8 rounded-2xl font-black text-xs uppercase transition-all active:scale-95 disabled:opacity-50">
            {isLoading ? 'Searching...' : 'Search'}
          </button>
          <button onClick={handleRefresh} className="bg-white border border-zinc-200 text-zinc-400 hover:text-[#3b2063] p-4 rounded-2xl transition-all active:rotate-180 duration-500 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
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
                <p className="text-[10px] font-black text-purple-200 uppercase tracking-widest mb-1">Net Sales (Real Cash)</p>
                <p className="text-xl font-black text-white">₱ {stats.net.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
        </div>

        <div className="w-full max-w-5xl bg-white rounded-4xl shadow-sm border border-zinc-200 overflow-hidden flex-1 flex flex-col">
           <div className="px-8 py-5 border-b border-zinc-100 bg-zinc-50 flex justify-between items-center">
                <h3 className="text-[#3b2063] font-black text-xs uppercase tracking-[0.2em]">Transaction Audit</h3>
                <span className="text-[10px] font-bold text-zinc-400 uppercase bg-zinc-100 px-3 py-1 rounded-full">
                    {Array.isArray(searchResults) ? searchResults.length : 0} Records Found
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
                 ) : searchResults && searchResults.length > 0 ? (
                   searchResults.map((item) => (
                    <tr key={item.id} className="hover:bg-[#f8f6ff] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                            <span className="font-black text-[#3b2063] text-sm">#{item.si_number}</span>
                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${item.status === 'cancelled' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                {item.status === 'cancelled' ? 'Voided' : 'Paid'}
                            </span>
                        </div>
                        {item.status === 'cancelled' && item.cancellation_reason && (
                          <p className="text-[9px] text-red-500 font-bold mt-1 bg-red-50 inline-block px-1 rounded italic">Reason: {item.cancellation_reason}</p>
                        )}
                        <p className="text-[10px] text-zinc-400 font-medium">{item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}</p>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-zinc-600">{item.terminal}</td>
                      <td className="px-6 py-4 text-center font-bold text-zinc-600">{item.items_count}</td>
                      <td className="px-6 py-4 text-right">
                        <span className={`text-xs font-bold ${item.status === 'cancelled' ? 'text-zinc-300 line-through' : 'text-emerald-700'}`}>
                          ₱ {Number(item.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {item.status !== 'cancelled' ? (
                            <button 
                                onClick={() => { setSelectedSaleId(item.sale_id); setIsReasonModalOpen(true); }} 
                                className="bg-red-50 text-red-500 hover:bg-red-500 hover:text-white p-2 rounded-lg transition-all active:scale-90"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.34 9m-4.74 0-.34-9m9.26-3.5a2.25 2.25 0 0 1-2.25 2.25h-9a2.25 2.25 0 0 1-2.25-2.25" />
                                </svg>
                            </button>
                        ) : (
                            <span className="text-[9px] font-black text-zinc-300 uppercase italic">Voided</span>
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

      {isReasonModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 border border-zinc-100">
                <h2 className="text-[#3b2063] font-black text-lg uppercase tracking-widest mb-2">Void Transaction</h2>
                <textarea 
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Enter reason for voiding..."
                    className="w-full h-32 p-4 bg-zinc-50 border border-zinc-200 rounded-2xl outline-none focus:border-[#3b2063] transition-all text-sm font-bold text-[#3b2063] resize-none"
                />
                <div className="flex gap-4 mt-8">
                    <button 
                      onClick={() => { setIsReasonModalOpen(false); setCancelReason(''); }} 
                      disabled={isVoiding}
                      className="flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-zinc-400 hover:bg-zinc-100 transition-all"
                    >
                      Back
                    </button>
                    <button 
                      onClick={handleConfirmCancel} 
                      disabled={isVoiding || !cancelReason.trim()}
                      className="flex-1 py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all disabled:opacity-50"
                    >
                      {isVoiding ? 'Voiding...' : 'Void Sale'}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default SearchReceipts;