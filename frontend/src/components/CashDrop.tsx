import { useState, useRef } from 'react';
import Keyboard from 'react-simple-keyboard';
import 'react-simple-keyboard/build/css/index.css';
import TopNavbar from './TopNavbar'; // Import Navbar

interface KeyboardRef {
  setInput: (input: string) => void;
}

interface Transaction {
  id: number;
  time: string;
  date: string;
  total: number;
  remarks: string;
  breakdown: { [key: number]: string }; 
}

const CashDrop = () => {
  const denominations = [1000, 500, 200, 100, 50, 20, 10, 5, 1, 0.25];

  const [counts, setCounts] = useState<{ [key: number]: string }>({});
  const [remarks, setRemarks] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  const [printData, setPrintData] = useState<Transaction | null>(null);

  const [activeInput, setActiveInput] = useState<{ type: 'count' | 'remarks', id?: number } | null>(null);
  const [layoutName, setLayoutName] = useState('numpad');
  const [showKeyboard, setShowKeyboard] = useState(false);
  
  const keyboardRef = useRef<KeyboardRef>(null);

  const getGrandTotal = (currentCounts: { [key: number]: string }) => {
    return denominations.reduce((total, denom) => {
      const qty = parseFloat(currentCounts[denom] || '0');
      return total + (qty * denom);
    }, 0);
  };

  const handleCountFocus = (denom: number) => {
    setActiveInput({ type: 'count', id: denom });
    setLayoutName('numpad');
    if (keyboardRef.current) keyboardRef.current.setInput(counts[denom] || '');
  };

  const handleRemarksFocus = () => {
    setActiveInput({ type: 'remarks' });
    setLayoutName('default');
    if (keyboardRef.current) keyboardRef.current.setInput(remarks);
  };

  const handleInputChange = (inputVal: string) => {
    if (!activeInput) return;

    if (activeInput.type === 'count' && activeInput.id !== undefined) {
      const cleanValue = inputVal.replace(/[^0-9.]/g, ''); 
      setCounts(prev => ({ ...prev, [activeInput.id!]: cleanValue }));
      if (keyboardRef.current) keyboardRef.current.setInput(cleanValue);

    } else if (activeInput.type === 'remarks') {
      setRemarks(inputVal);
      if (keyboardRef.current) keyboardRef.current.setInput(inputVal);
    }
  };

  const onKeyboardChange = (input: string) => {
    if (!activeInput) return;
    if (activeInput.type === 'count' && activeInput.id !== undefined) {
      setCounts(prev => ({ ...prev, [activeInput.id!]: input }));
    } else if (activeInput.type === 'remarks') {
      setRemarks(input);
    }
  };

  const onKeyPress = (button: string) => {
    if (button === "{enter}") setShowKeyboard(false);
  };

  const handleSubmit = () => {
    const total = getGrandTotal(counts);
    if (total <= 0) return; 

    const now = new Date();
    const newTx: Transaction = {
      id: now.getTime(),
      date: now.toLocaleDateString(),
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      total: total,
      remarks: remarks || '-',
      breakdown: { ...counts } 
    };

    setTransactions([newTx, ...transactions]); 
    
    setCounts({});
    setRemarks('');
    if (keyboardRef.current) keyboardRef.current.setInput("");
  };

  const handlePrint = (tx: Transaction) => {
    setPrintData(tx);
    setTimeout(() => {
      window.print();
      setPrintData(null); 
    }, 100);
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
              position: fixed; left: 0; top: 0; width: 72mm !important; margin: 0 auto; padding: 5mm 2mm;
              background: white; color: black; font-family: 'Courier New', monospace; font-size: 12px; line-height: 1.2;
            }
            .no-print { display: none !important; }
            .receipt-header { text-align: center; margin-bottom: 10px; }
            h2 { font-size: 16px; margin: 0; }
            .breakdown-row { display: flex; justify-content: space-between; }
            .total-row { border-top: 1px dashed black; border-bottom: 1px dashed black; padding: 5px 0; margin: 10px 0; font-weight: bold; }
            .signatures { margin-top: 20px; display: flex; justify-content: space-between; }
            .signature-line { border-top: 1px solid black; width: 45%; text-align: center; padding-top: 5px; font-size: 10px; }
          }
        `}
      </style>

      {printData && (
        <div className="printable-receipt">
          <div className="receipt-header">
            <h2>CASH DROP RECEIPT</h2>
            <p>Main Branch - QC</p>
            <p>{printData.date} - {printData.time}</p>
          </div>
          <div>
            <p><strong>Cashier:</strong> ADMIN | <strong>Terminal:</strong> 01</p>
          </div>

          <div style={{ marginTop: '10px' }}>
            <p style={{ fontWeight: 'bold', borderBottom: '1px solid black' }}>Details:</p>
            {denominations.map(denom => {
              const qty = parseFloat(printData.breakdown[denom] || '0');
              const rowTotal = qty * denom;
              const label = denom < 1 ? denom.toString().replace('0.', '.') : denom.toLocaleString();
              return (
                <div key={denom} className="breakdown-row">
                  <span>{label} x {qty}</span>
                  <span>{rowTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              );
            })}
          </div>

          <div className="total-row breakdown-row">
              <span>TOTAL DROP:</span>
              <span>₱ {printData.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          
          <div>
            <p><strong>Remarks:</strong> {printData.remarks}</p>
          </div>

          <div className="signatures">
            <div className="signature-line">Prepared By (Admin)</div>
            <div className="signature-line">Received By</div>
          </div>
        </div>
      )}

      <div className="flex flex-col h-full w-full bg-[#f8f6ff] animate-in fade-in zoom-in duration-300 relative overflow-hidden">
        
        {/* --- REPLACED HEADER WITH SHARED COMPONENT --- */}
        <TopNavbar />

        <div className={`flex-1 flex flex-row items-start justify-center p-6 gap-6 overflow-y-auto transition-all duration-300 ${showKeyboard ? 'pb-[350px]' : ''}`}>
          
          <div className="bg-white w-full flex-1 rounded-[2.5rem] shadow-xl shadow-purple-900/5 border border-zinc-100 flex flex-col relative overflow-hidden shrink-0 h-full">
            <div className="absolute top-0 left-0 w-full h-3 bg-[#3b2063] opacity-10 z-10"></div>
            
            <div className="flex-1 overflow-y-auto p-8 w-full scroll-smooth">
              <h2 className="text-[#3b2063] font-black text-base tracking-[0.4em] uppercase mb-2 text-center">Terminal 01</h2>
              <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest mb-8 text-center">Cashier: Admin</p>

              <div className="grid grid-cols-4 gap-4 w-full mb-4 px-4 sticky top-0 bg-white z-10 py-2 border-b border-zinc-50">
                <div className="text-center text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Bill/Coin</div>
                <div className="text-center text-[10px] font-bold text-zinc-400 uppercase tracking-widest"></div>
                <div className="text-center text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Qty</div>
                <div className="text-center text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Total</div>
              </div>

              <div className="w-full space-y-2 mb-8">
                {denominations.map((denom) => {
                  const qty = counts[denom] || '';
                  const rowTotal = denom * (parseFloat(qty) || 0);
                  const label = denom < 1 ? denom.toString().replace('0.', '.') : denom.toLocaleString();

                  return (
                    <div key={denom} className="grid grid-cols-4 gap-4 items-center px-4 py-2 hover:bg-zinc-50 rounded-2xl transition-colors">
                      <div className="text-right pr-4 font-black text-[#3b2063] text-lg">{label}</div>
                      <div className="text-center text-zinc-300 font-bold text-xs">X</div>
                      <div>
                        <input 
                          type="text" 
                          value={qty}
                          onFocus={() => handleCountFocus(denom)}
                          onChange={(e) => handleInputChange(e.target.value)}
                          placeholder="0"
                          className={`w-full text-center font-bold text-lg py-2 rounded-xl border-2 transition-all outline-none 
                            ${activeInput?.type === 'count' && activeInput.id === denom ? 'border-[#3b2063] bg-white ring-4 ring-[#f0ebff]' : 'border-zinc-100 bg-[#f8f6ff]'}`}
                        />
                      </div>
                      <div className="text-right pl-4 font-black text-zinc-400 text-lg">
                        {rowTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="w-full border-t border-zinc-100 pt-6 px-4 space-y-6">
                <div className="flex items-center justify-between bg-[#f8f6ff] p-4 rounded-2xl border border-zinc-200">
                   <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Total :</span>
                   <span className="text-2xl font-black text-[#3b2063]">
                     ₱ {getGrandTotal(counts).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                   </span>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-2">Remarks</label>
                  <textarea 
                    value={remarks}
                    onFocus={handleRemarksFocus}
                    onChange={(e) => handleInputChange(e.target.value)}
                    placeholder="Enter notes here..."
                    className={`w-full p-4 rounded-2xl border-2 font-bold text-sm text-[#3b2063] resize-none h-16 outline-none transition-all
                      ${activeInput?.type === 'remarks' ? 'border-[#3b2063] bg-white ring-4 ring-[#f0ebff]' : 'border-zinc-100 bg-[#f8f6ff]'}`}
                  />
                </div>
                <button onClick={handleSubmit} className="w-full bg-[#3b2063] hover:bg-[#2a1647] text-white py-5 rounded-3xl font-black text-sm uppercase tracking-[0.25em] shadow-lg shadow-purple-900/20 active:scale-95 transition-all duration-200">
                  Submit Cash Drop
                </button>
              </div>
            </div>
          </div>

          <div className="w-full flex-1 bg-white rounded-[2rem] shadow-sm border border-zinc-200 overflow-hidden shrink-0 h-full flex flex-col">
             <div className="px-8 py-5 border-b border-zinc-100 bg-zinc-50 flex-none">
               <h3 className="text-[#3b2063] font-black text-xs uppercase tracking-[0.2em]">Transaction History</h3>
             </div>
             <div className="flex-1 overflow-auto">
               <table className="w-full text-left relative">
                 <thead className="sticky top-0 bg-white z-10">
                   <tr className="border-b border-zinc-100 shadow-sm">
                     <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Time</th>
                     <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">Total Submit</th>
                     <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Remarks</th>
                     <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-center">Print</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-zinc-50">
                   {transactions.length === 0 ? (
                     <tr>
                       <td colSpan={4} className="px-6 py-8 text-center text-zinc-300 text-xs font-bold uppercase tracking-widest">
                         No transactions today
                       </td>
                     </tr>
                   ) : (
                     transactions.map((tx) => (
                       <tr key={tx.id} className="hover:bg-[#f8f6ff] transition-colors">
                         <td className="px-6 py-4 text-xs font-bold text-zinc-600">{tx.time}</td>
                         <td className="px-6 py-4 text-sm font-black text-[#3b2063] text-right">₱ {tx.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                         <td className="px-6 py-4 text-xs font-medium text-zinc-500 max-w-[150px] truncate" title={tx.remarks}>{tx.remarks}</td>
                         <td className="px-6 py-4 text-center">
                           <button 
                             onClick={() => handlePrint(tx)}
                             className="p-2 bg-emerald-100 text-emerald-600 rounded-xl hover:bg-emerald-200 transition-colors"
                           >
                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                               <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z" />
                             </svg>
                           </button>
                         </td>
                       </tr>
                     ))
                   )}
                 </tbody>
               </table>
             </div>
          </div>

        </div>

        <button onClick={() => setShowKeyboard(!showKeyboard)} className={`fixed bottom-8 right-8 z-[60] p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 ${showKeyboard ? 'bg-red-500 text-white' : 'bg-[#3b2063] text-white'}`}>
          {showKeyboard ? (
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
          ) : (
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5" /></svg>
          )}
        </button>

        <div className={`fixed bottom-0 left-0 right-0 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.1)] transition-transform duration-300 z-50 ${showKeyboard ? 'translate-y-0' : 'translate-y-full'}`}>
          <div className="flex items-center justify-between px-4 py-2 bg-zinc-50 border-b border-zinc-200">
             <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{layoutName === 'numpad' ? 'Numpad' : 'Keyboard'}</span>
             <button onClick={() => setShowKeyboard(false)} className="text-xs font-black text-[#3b2063] uppercase tracking-widest hover:text-red-500 px-4 py-2">Close</button>
          </div>
          <div className="p-2 text-zinc-800">
            <Keyboard
              keyboardRef={r => (keyboardRef.current = r)}
              layoutName={layoutName}
              onChange={onKeyboardChange}
              onKeyPress={onKeyPress}
              layout={{
                numpad: ["1 2 3", "4 5 6", "7 8 9", "0 {bksp}", "{enter}"],
                default: ["q w e r t y u i o p {bksp}", "a s d f g h j k l {enter}", "z x c v b n m , .", "{space}"]
              }}
              display={{ "{bksp}": "⌫", "{enter}": "DONE", "{space}": "SPACE", "default": "ABC", "numpad": "123" }}
            />
          </div>
        </div>

      </div>
    </>
  );
};

export default CashDrop;