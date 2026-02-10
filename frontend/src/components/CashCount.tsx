import { useState, useRef } from 'react';
import Keyboard from 'react-simple-keyboard';
import 'react-simple-keyboard/build/css/index.css';
import type { KeyboardRef, Transaction, ActiveInput } from '../types/cash-count';

const CashCount = () => {
  const denominations = [1000, 500, 200, 100, 50, 20, 10, 5, 1, 0.25];

  // --- State ---
  const [counts, setCounts] = useState<{ [key: number]: string }>({});
  const [remarks, setRemarks] = useState('');
  const [latestTx, setLatestTx] = useState<Transaction | null>(null);
  const [printData, setPrintData] = useState<Transaction | null>(null);

  // Keyboard & Input State
  const [activeInput, setActiveInput] = useState<ActiveInput | null>(null);
  const [layoutName, setLayoutName] = useState('numpad');
  const [showKeyboard, setShowKeyboard] = useState(false);
  
  // Ref for the virtual keyboard
  const keyboardRef = useRef<KeyboardRef | null>(null);

  // --- Helper: Calculate Grand Total ---
  const getGrandTotal = (currentCounts: { [key: number]: string }) => {
    return denominations.reduce((total, denom) => {
      const qty = parseFloat(currentCounts[denom] || '0');
      return total + (qty * denom);
    }, 0);
  };

  // --- Handlers ---
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
      if (keyboardRef.current) keyboardRef.current.setInput(cleanValue);
    } else if (activeInput.type === 'remarks') {
      setRemarks(inputVal);
      if (keyboardRef.current) keyboardRef.current.setInput(inputVal);
    }
  };

  const onKeyboardChange = (input: string) => {
    if (!activeInput) return;
    if (activeInput.type === 'count' && activeInput.id !== undefined) {
      const cleanValue = input.replace(/[^0-9.]/g, '');
      setCounts(prev => ({ ...prev, [activeInput.id!]: cleanValue }));
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

    setLatestTx(newTx); 
    setShowKeyboard(false);
  };

  const handlePrint = () => {
    if (!latestTx) return;
    setPrintData(latestTx);
    setTimeout(() => {
      window.print();
      setPrintData(null); 
    }, 150);
  };

  const handleNewCount = () => {
    setLatestTx(null);
    setCounts({});
    setRemarks('');
    if (keyboardRef.current) keyboardRef.current.setInput("");
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

      {/* --- Print Template --- */}
      {printData && (
        <div className="printable-receipt">
          <div className="receipt-header">
            <h2>EOD CASH COUNT</h2>
            <p>Main Branch - QC</p>
            <p>{printData.date} - {printData.time}</p>
          </div>
          <div>
            <p><strong>Cashier:</strong> ADMIN | <strong>Terminal:</strong> 01</p>
          </div>
          <div style={{ marginTop: '10px' }}>
            <p style={{ fontWeight: 'bold', borderBottom: '1px solid black' }}>Count Details:</p>
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
             <span>TOTAL COUNT:</span>
             <span>₱ {printData.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div><p><strong>Remarks:</strong> {printData.remarks}</p></div>
          <div className="signatures">
            <div className="signature-line">Counted By</div>
            <div className="signature-line">Verified By</div>
          </div>
        </div>
      )}

      {/* --- Main UI --- */}
      <div className="flex flex-col h-full w-full bg-[#f8f6ff] animate-in fade-in zoom-in duration-300 relative overflow-hidden">
        <header className="flex-none bg-white border-b border-zinc-200 px-8 py-4 flex items-center justify-between shadow-sm z-20">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Branch</span>
                <span className="text-[#3b2063] font-black text-xs uppercase tracking-wider">Main Branch - QC</span>
            </div>
            <div className="h-8 w-px bg-zinc-100"></div>
            <div className="flex flex-col">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Cashier</span>
                <span className="text-[#3b2063] font-black text-xs uppercase tracking-wider">Admin User</span>
            </div>
          </div>
        </header>

        <div className={`flex-1 flex flex-row items-start justify-center p-6 gap-6 overflow-y-auto transition-all duration-300 ${showKeyboard ? 'pb-80' : ''}`}>
          {/* Entry Form */}
          <div className="bg-white w-full flex-1 rounded-[2.5rem] shadow-xl border border-zinc-100 flex flex-col relative overflow-hidden h-full">
            <div className="absolute top-0 left-0 w-full h-3 bg-[#3b2063] opacity-10"></div>
            <div className="flex-1 overflow-y-auto p-8">
              <h2 className="text-[#3b2063] font-black text-base uppercase mb-8 text-center tracking-[0.2em]">Terminal 01 (EOD)</h2>
              <div className="w-full space-y-2 mb-8">
                {denominations.map((denom) => {
                  const qty = counts[denom] || '';
                  const rowTotal = denom * (parseFloat(qty) || 0);
                  const label = denom < 1 ? denom.toString().replace('0.', '.') : denom.toLocaleString();

                  return (
                    <div key={denom} className="grid grid-cols-4 gap-4 items-center px-4 py-2 hover:bg-zinc-50 rounded-2xl transition-colors">
                      <div className="text-right font-black text-[#3b2063] text-lg">{label}</div>
                      <div className="text-center text-zinc-300 font-bold text-xs">X</div>
                      <input 
                        type="text" 
                        inputMode="none"
                        value={qty}
                        onFocus={() => handleCountFocus(denom)}
                        onChange={(e) => handleInputChange(e.target.value)}
                        placeholder="0"
                        disabled={latestTx !== null}
                        className={`w-full text-center font-bold text-lg py-2 rounded-xl border-2 transition-all outline-none 
                          ${latestTx ? 'bg-zinc-100 text-zinc-400 border-zinc-200' : 'border-zinc-100 bg-[#f8f6ff] focus:border-[#3b2063]'}`}
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
                   <span className="text-2xl font-black text-[#3b2063]">₱ {getGrandTotal(counts).toLocaleString()}</span>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-2">Remarks</label>
                  <textarea 
                    value={remarks}
                    onFocus={handleRemarksFocus}
                    onChange={(e) => handleInputChange(e.target.value)}
                    placeholder="Enter notes..."
                    disabled={latestTx !== null}
                    className="w-full p-4 rounded-2xl border-2 border-zinc-100 bg-[#f8f6ff] focus:border-[#3b2063] resize-none h-16 outline-none"
                  />
                </div>
                {!latestTx ? (
                  <button onClick={handleSubmit} className="w-full bg-[#3b2063] text-white py-5 rounded-3xl font-black uppercase tracking-widest shadow-lg active:scale-95 transition-transform">
                    Submit EOD Count
                  </button>
                ) : (
                  <button onClick={handleNewCount} className="w-full bg-zinc-100 text-zinc-600 py-5 rounded-3xl font-black uppercase tracking-widest active:scale-95 transition-transform">
                    New Count
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Printer Sidebar */}
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-xl border border-zinc-100 p-8 flex flex-col items-center text-center h-fit shrink-0">
             <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 ${latestTx ? 'bg-emerald-50' : 'bg-zinc-50'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={latestTx ? "#10b981" : "#a1a1aa"} className="w-8 h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18" />
                </svg>
             </div>
             <h3 className="font-black text-xs uppercase tracking-widest mb-2 text-[#3b2063]">Receipt Printer</h3>
             <p className="text-[10px] text-zinc-400 font-bold uppercase mb-6">{latestTx ? "Ready to Print" : "Submit to Print"}</p>
             <button 
                onClick={handlePrint} 
                disabled={!latestTx}
                className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${latestTx ? 'bg-emerald-500 text-white shadow-lg active:scale-95' : 'bg-zinc-100 text-zinc-400'}`}
             >
                Print Receipt
             </button>
          </div>
        </div>

        {/* --- Keyboard Overlay --- */}
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
              display={{ "{bksp}": "⌫", "{enter}": "DONE", "{space}": "SPACE", "default": "ABC", "numpad": "123" }}
            />
          </div>
        </div>

      </div>
    </>
  );
};

export default CashCount;