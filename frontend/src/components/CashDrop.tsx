import React, { useState, useRef, useEffect } from 'react';
import Keyboard from 'react-simple-keyboard';
import 'react-simple-keyboard/build/css/index.css';
import type { AxiosError } from 'axios';
import api from '../services/api';
import type { 
  BackendTransaction, 
  Transaction, 
  KeyboardRef, 
  CashDropProps 
} from '../types/transactions';

let cashDropCache: Transaction[] | null = null;

const CashDrop: React.FC<CashDropProps> = ({ onSuccess }) => {
  const denominations = [1000, 500, 200, 100, 50, 20, 10, 5, 1, 0.25];
  const [counts, setCounts] = useState<{ [key: number]: string }>({});
  const [remarks, setRemarks] = useState('');
  
  // Initialize state from cache if available
  const [transactions, setTransactions] = useState<Transaction[]>(cashDropCache || []);
  const [isLoading, setIsLoading] = useState(false);
  const [printData, setPrintData] = useState<Transaction | null>(null);
  const [activeInput, setActiveInput] = useState<{ type: 'count' | 'remarks', id?: number } | null>(null);
  const [layoutName, setLayoutName] = useState('numpad');
  const [showKeyboard, setShowKeyboard] = useState(false);
  const keyboardRef = useRef<KeyboardRef | null>(null);

  // --- Fetch Today's Drops ---
  const fetchTodaysDrops = async () => {
    // If we already have cached data, don't hit the API again
    if (cashDropCache !== null) return;

    try {
      const response = await api.get<BackendTransaction[]>('/api/cash-transactions', {
        params: { type: 'cash_drop', date: new Date().toISOString().split('T')[0] }
      });
      
      const mappedData: Transaction[] = response.data.map((tx) => ({
        id: tx.id,
        time: new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date(tx.created_at).toLocaleDateString(),
        total: parseFloat(tx.amount),
        remarks: tx.note || '-',
        breakdown: {} 
      }));
      
      setTransactions(mappedData);
      cashDropCache = mappedData; // Save to global cache
    } catch (error) {
      console.error("Failed to fetch history:", error);
    }
  };

  useEffect(() => {
    fetchTodaysDrops();
  }, []);

  const getGrandTotal = (currentCounts: { [key: number]: string }) => {
    return denominations.reduce((total, denom) => {
      const qty = parseFloat(currentCounts[denom] || '0');
      return total + (qty * denom);
    }, 0);
  };

  const handleCountFocus = (denom: number) => {
    setActiveInput({ type: 'count', id: denom });
    setLayoutName('numpad');
    setShowKeyboard(true);
    if (keyboardRef.current) keyboardRef.current.setInput(counts[denom] || '');
  };

  const handleRemarksFocus = () => {
    setActiveInput({ type: 'remarks' });
    setLayoutName('default');
    setShowKeyboard(true);
    if (keyboardRef.current) keyboardRef.current.setInput(remarks);
  };

  const handleInputChange = (inputVal: string) => {
    if (!activeInput) return;
    if (activeInput.type === 'count' && activeInput.id !== undefined) {
      const cleanValue = inputVal.replace(/[^0-9.]/g, ''); 
      setCounts(prev => ({ ...prev, [activeInput.id!]: cleanValue }));
    } else if (activeInput.type === 'remarks') {
      setRemarks(inputVal);
    }
  };

  const onKeyboardChange = (input: string) => {
    handleInputChange(input);
  };

  const onKeyPress = (button: string) => {
    if (button === "{enter}") setShowKeyboard(false);
  };

  const handleSubmit = async () => {
    const total = getGrandTotal(counts);
    if (total <= 0 || isLoading) return; 

    setIsLoading(true);

    const breakdownString = denominations
      .filter(d => counts[d] && parseFloat(counts[d]) > 0)
      .map(d => `${d}x${counts[d]}`)
      .join(', ');

    const finalNote = `Drop Breakdown: ${breakdownString}${remarks ? ` | Remarks: ${remarks}` : ''}`;

    try {
      const response = await api.post('/api/cash-transactions', {
        type: 'cash_drop',
        amount: total,
        note: finalNote
      });

      if (response.data.success) {
        const now = new Date();
        const newTx: Transaction = {
          id: response.data.data.id,
          date: now.toLocaleDateString(),
          time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          total: total,
          remarks: remarks || '-',
          breakdown: { ...counts } 
        };

        const updatedHistory = [newTx, ...transactions];
        setTransactions(updatedHistory);
        cashDropCache = updatedHistory; // Sync cache with new entry

        setCounts({});
        setRemarks('');
        setShowKeyboard(false);
        if (keyboardRef.current) keyboardRef.current.setInput("");
        
        if (onSuccess) onSuccess();
        handlePrint(newTx);
      }
    } catch (error: unknown) {
      const err = error as AxiosError<{ message?: string }>;
      alert(err.response?.data?.message || "Failed to record Cash Drop.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = (tx: Transaction) => {
    setPrintData(tx);
    setTimeout(() => {
      window.print();
      setPrintData(null); 
    }, 150);
  };

  return (
    <>
      <style>
        {`
          @media print {
            @page { size: 80mm auto; margin: 0; }
            body * { visibility: hidden; }
            .printable-receipt, .printable-receipt * { visibility: visible; }
            .printable-receipt {
              position: fixed; left: 0; top: 0; width: 72mm !important; padding: 5mm;
              background: white; color: black; font-family: 'Courier New', monospace;
            }
            .no-print { display: none !important; }
          }
        `}
      </style>

      {printData && (
        <div className="printable-receipt">
          <div className="text-center mb-4">
            <h2 className="font-black text-lg">CASH DROP RECEIPT</h2>
            <p className="text-[10px]">{printData.date} - {printData.time}</p>
          </div>
          <div className="mb-4 text-[11px]">
            <p><strong>Cashier:</strong> ADMIN</p>
            <p><strong>Total:</strong> ₱ {printData.total.toLocaleString()}</p>
          </div>
        </div>
      )}

      <div className="flex flex-col h-full w-full bg-[#f8f6ff] animate-in fade-in zoom-in duration-300 relative overflow-hidden">
        <div className={`flex-1 flex flex-row items-start justify-center p-6 gap-6 overflow-y-auto transition-all duration-300 ${showKeyboard ? 'pb-80' : ''}`}>
          <div className="bg-white w-full flex-1 rounded-[2.5rem] shadow-xl border border-zinc-100 flex flex-col relative overflow-hidden h-full">
            <div className="absolute top-0 left-0 w-full h-3 bg-[#3b2063] opacity-10"></div>
            <div className="flex-1 overflow-y-auto p-8">
              <h2 className="text-[#3b2063] font-black text-base uppercase mb-8 text-center">Cash Drop Entry</h2>
              <div className="w-full space-y-2 mb-8">
                {denominations.map((denom) => {
                  const qty = counts[denom] || '';
                  const rowTotal = denom * (parseFloat(qty) || 0);
                  return (
                    <div key={denom} className="grid grid-cols-4 gap-4 items-center px-4 py-2 hover:bg-zinc-50 rounded-2xl">
                      <div className="text-right font-black text-[#3b2063] text-lg">{denom.toLocaleString()}</div>
                      <div className="text-center text-zinc-300 font-bold text-xs">X</div>
                      <input 
                        type="text" 
                        inputMode="none" 
                        value={qty}
                        onFocus={() => handleCountFocus(denom)}
                        onChange={(e) => handleInputChange(e.target.value)}
                        placeholder="0"
                        className="w-full text-center font-bold text-lg py-2 rounded-xl border-2 border-zinc-100 bg-[#f8f6ff] focus:border-[#3b2063]"
                      />
                      <div className="text-right font-black text-zinc-400 text-lg">
                        {rowTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="w-full border-t border-zinc-100 pt-6 px-4 space-y-6">
                <div className="flex items-center justify-between bg-[#f8f6ff] p-4 rounded-2xl">
                   <span className="text-xs font-bold text-zinc-500 uppercase">Grand Total :</span>
                   <span className="text-2xl font-black text-[#3b2063]">
                     ₱ {getGrandTotal(counts).toLocaleString()}
                   </span>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-2">Remarks</label>
                  <textarea 
                    value={remarks}
                    inputMode="none"
                    onFocus={handleRemarksFocus}
                    onChange={(e) => handleInputChange(e.target.value)}
                    placeholder="Enter notes..."
                    className="w-full p-4 rounded-2xl border-2 border-zinc-100 bg-[#f8f6ff] focus:border-[#3b2063] resize-none h-16"
                  />
                </div>
                <button onClick={handleSubmit} disabled={isLoading} className="w-full bg-[#3b2063] text-white py-5 rounded-3xl font-black uppercase tracking-widest shadow-lg active:scale-95 transition-transform">
                  {isLoading ? 'SUBMITTING...' : 'SUBMIT CASH DROP'}
                </button>
              </div>
            </div>
          </div>

          <div className="w-full flex-1 bg-white rounded-4xl shadow-sm border border-zinc-200 overflow-hidden h-full flex flex-col">
              <div className="px-8 py-5 border-b border-zinc-100 bg-zinc-50"><h3 className="text-[#3b2063] font-black text-xs uppercase">Drop History (Today)</h3></div>
              <div className="flex-1 overflow-auto">
                <table className="w-full text-left">
                  <thead className="sticky top-0 bg-white z-10 border-b border-zinc-100">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase">Time</th>
                      <th className="px-6 py-4 text-right text-[10px] font-bold text-zinc-400 uppercase">Amount</th>
                      <th className="px-6 py-4 text-center text-[10px] font-bold text-zinc-400 uppercase">Print</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-zinc-50 transition-colors">
                        <td className="px-6 py-4 text-xs font-bold text-zinc-600">{tx.time}</td>
                        <td className="px-6 py-4 text-sm font-black text-[#3b2063] text-right">₱{tx.total.toLocaleString()}</td>
                        <td className="px-6 py-4 text-center">
                          <button onClick={() => handlePrint(tx)} className="p-2 bg-emerald-100 text-emerald-600 rounded-xl hover:bg-emerald-200 transition-colors">
                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18" /></svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                    {transactions.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-6 py-10 text-center text-zinc-400 text-xs italic">No transactions today</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
          </div>
        </div>

        <button 
          onClick={() => setShowKeyboard(!showKeyboard)} 
          className={`fixed bottom-8 right-8 z-60 p-4 rounded-full shadow-2xl transition-all ${showKeyboard ? 'bg-red-500 text-white rotate-90' : 'bg-[#3b2063] text-white'}`}
        >
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25h16.5m-16.5 4.5h16.5" /></svg>
        </button>

        <div className={`fixed bottom-0 left-0 right-0 bg-white shadow-2xl transition-transform duration-300 z-50 ${showKeyboard ? 'translate-y-0' : 'translate-y-full'}`}>
          <div className="flex items-center justify-between px-4 py-2 bg-zinc-50 border-b">
              <span className="text-xs font-bold text-zinc-400 uppercase">{layoutName === 'numpad' ? 'Numpad' : 'Keyboard'}</span>
              <button onClick={() => setShowKeyboard(false)} className="text-xs font-black text-[#3b2063] uppercase p-4">Close</button>
          </div>
          <div className="p-2">
            <Keyboard
              keyboardRef={r => { if(r) keyboardRef.current = r; }}
              layoutName={layoutName}
              onChange={onKeyboardChange}
              onKeyPress={onKeyPress}
              layout={{
                numpad: ["1 2 3", "4 5 6", "7 8 9", "0 {bksp}", "{enter}"],
                default: ["q w e r t y u i o p {bksp}", "a s d f g h j k l {enter}", "z x c v b n m , .", "{space}"]
              }}
              display={{ "{bksp}": "⌫", "{enter}": "DONE", "{space}": "SPACE" }}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default CashDrop;