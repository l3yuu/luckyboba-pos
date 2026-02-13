import React, { useState, useRef, useEffect, useCallback } from 'react';
import 'react-simple-keyboard/build/css/index.css';
import TopNavbar from '../TopNavbar'; 
import type { KeyboardRef, Receipt } from '../../types/transactions';
import api from '../../services/api'; 

const CACHE_KEY = 'lucky_boba_receipt_cache';

const SearchReceipts = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Receipt[]>([]); 
  const [hasSearched, setHasSearched] = useState(false); 
  const [showKeyboard, setShowKeyboard] = useState(false);
  // FIX 1: Added missing isLoading state
  const [isLoading, setIsLoading] = useState(false);
  
  const keyboardRef = useRef<KeyboardRef>(null);

  // FIX 2: Wrapped in useCallback correctly and added async
  const handleSearch = useCallback(async (queryOverride?: string) => {
    // Determine which query to use (the state or the override)
    const activeQuery = typeof queryOverride === 'string' ? queryOverride : searchQuery;

    setIsLoading(true);
    setHasSearched(true);

    try {
      const response = await api.get<Receipt[]>('/receipts/search', {
        params: { query: activeQuery }
      });
      
      const data = response.data;
      setSearchResults(data);

      // SAVE TO CACHE
      sessionStorage.setItem(`${CACHE_KEY}_query`, activeQuery);
      sessionStorage.setItem(`${CACHE_KEY}_results`, JSON.stringify(data));

    } catch (error) {
      console.error("Axios Connection Error:", error);
      setSearchResults([]); 
    } finally {
      setIsLoading(false);
      setShowKeyboard(false);
    }
  }, [searchQuery]); 

// INITIAL FETCH: Load from cache or fetch all on mount
  useEffect(() => {
    const cachedQuery = sessionStorage.getItem(`${CACHE_KEY}_query`);
    const cachedResults = sessionStorage.getItem(`${CACHE_KEY}_results`);

    if (cachedResults) {
      setSearchResults(JSON.parse(cachedResults));
      setSearchQuery(cachedQuery || '');
      setHasSearched(true);
    } else {
      handleSearch(''); 
    }
  }, [handleSearch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (keyboardRef.current) keyboardRef.current.setInput(val);
  };

  const handleViewDetails = (saleId: number) => {
    // You can redirect to a specific receipt view or open a modal
    console.log("Viewing details for Sale ID:", saleId);
    // navigate(`/receipt/${saleId}`); 
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
          <button 
            onClick={() => handleSearch()} 
            disabled={isLoading}
            className="bg-[#3b2063] hover:bg-[#2a1647] disabled:bg-zinc-400 text-white px-8 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
          
          <button 
            onClick={() => {
                sessionStorage.removeItem(`${CACHE_KEY}_query`);
                sessionStorage.removeItem(`${CACHE_KEY}_results`);
                setSearchQuery('');
                handleSearch('');
            }}
            className="bg-zinc-200 text-zinc-500 hover:bg-zinc-300 p-3 rounded-2xl transition-all"
            title="Clear Cache"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>
        </div>

        <div className="w-full max-w-5xl bg-white rounded-4xl shadow-sm border border-zinc-200 overflow-hidden flex-1 flex flex-col">
           <div className="px-8 py-5 border-b border-zinc-100 bg-zinc-50 flex justify-between items-center">
             <div className="flex items-center gap-3">
                <h3 className="text-[#3b2063] font-black text-xs uppercase tracking-[0.2em]">Receipts List</h3>
                {hasSearched && !isLoading && (
                    <span className="text-[9px] bg-emerald-50 text-emerald-600 font-bold px-2 py-0.5 rounded-md uppercase">Live Data</span>
                )}
             </div>
             <span className="text-[10px] font-bold text-zinc-400 uppercase bg-zinc-100 px-3 py-1 rounded-full">
                {searchResults.length} Records Found
             </span>
           </div>
           
           <div className="flex-1 overflow-auto no-scrollbar">
             <table className="w-full text-left relative">
               <thead className="sticky top-0 bg-white z-10 shadow-sm">
                 <tr>
                   <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">SI #</th>
                   <th className="px-6 py-4 text-center text-[10px] font-bold text-zinc-400 uppercase tracking-widest">TRML #</th>
                   <th className="px-6 py-4 text-center text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Items</th>
                   <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Cashier</th>
                   <th className="px-6 py-4 text-right text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Total Sales</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-zinc-50">
                 {isLoading && searchResults.length === 0 ? (
                   <tr>
                     <td colSpan={5} className="px-6 py-12 text-center text-zinc-400 italic">Loading results...</td>
                   </tr>
                 ) : searchResults.length > 0 ? (
                   searchResults.map((item) => (
                    <tr 
                      key={item.id} 
                      onClick={() => handleViewDetails(item.sale_id)} 
                      className="hover:bg-[#f8f6ff] transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4">
                        <span className="font-black text-[#3b2063] text-sm group-hover:text-purple-600">#{item.si_number}</span>
                        <p className="text-[10px] text-zinc-400 font-medium">
                          {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-zinc-600">{item.terminal}</td>
                      <td className="px-6 py-4 text-center font-bold text-zinc-600">{item.items_count}</td>
                      <td className="px-6 py-4 text-xs font-bold text-zinc-500">{item.cashier_name}</td>
                      <td className="px-6 py-4 text-right">
                        <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg text-xs font-bold">
                          ₱ {Number(item.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                    </tr>
                   ))
                 ) : (
                   <tr>
                     <td colSpan={5} className="px-6 py-12 text-center">
                       <p className="text-zinc-400 font-medium">
                         {hasSearched ? "No receipts found." : "Enter a search to start."}
                       </p>
                     </td>
                   </tr>
                 )
                }
               </tbody>
             </table>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SearchReceipts;