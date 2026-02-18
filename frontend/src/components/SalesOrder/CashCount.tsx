"use client"
<<<<<<< HEAD
import React, { useState, useRef } from 'react';
=======

import React, { useState, useRef, useEffect } from 'react';
>>>>>>> 3537335148519ac44802b3b8ee695dd57c595ab6
import Keyboard from 'react-simple-keyboard';
import 'react-simple-keyboard/build/css/index.css';
import type { Transaction, ActiveInput } from '../../types/cash-count';
import api from '../../services/api';
import TopNavbar from '../TopNavbar';
import { useToast } from '../../hooks/useToast';

interface SimpleKeyboardInstance {
  setInput: (input: string) => void;
}

interface CashCountProps {
  onSuccess?: () => void;
}

const CashCount: React.FC<CashCountProps> = ({ onSuccess }) => {
  const { showToast } = useToast();
  const denominations = [1000, 500, 200, 100, 50, 20, 10, 5, 1, 0.25];

  // --- State ---
  const [counts, setCounts] = useState<{ [key: number]: string }>({});
  const [remarks, setRemarks] = useState('');
  const [latestTx, setLatestTx] = useState<Transaction | null>(null);
  const [printData, setPrintData] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // --- NEW STATE FOR LOCK LOGIC ---
  const [isEodLocked, setIsEodLocked] = useState(false);

  // Keyboard & Input State
  const [activeInput, setActiveInput] = useState<ActiveInput | null>(null);
  const [layoutName, setLayoutName] = useState('numpad');
  const [showKeyboard, setShowKeyboard] = useState(false);
<<<<<<< HEAD
  

  const keyboardRef = useRef<SimpleKeyboardInstance | null>(null);

=======
  const keyboardRef = useRef<SimpleKeyboardInstance | null>(null);

  // --- Check EOD Status on Mount ---
  const checkEodStatus = async () => {
    try {
      const response = await api.get<{ isEodDone: boolean }>('/cash-counts/status');
      setIsEodLocked(response.data.isEodDone);
      
      // If already done, we simulate a "latest transaction" state to show the print UI
      if (response.data.isEodDone) {
        localStorage.setItem('terminal_eod_locked', 'true');
      }
    } catch (error) {
      console.error("Failed to check EOD status:", error);
    }
  };

  useEffect(() => {
    checkEodStatus();
  }, []);
>>>>>>> 3537335148519ac44802b3b8ee695dd57c595ab6

  const getGrandTotal = (currentCounts: { [key: number]: string }) => {
    return denominations.reduce((total, denom) => {
      const qty = parseFloat(currentCounts[denom] || '0');
      return total + (qty * denom);
    }, 0);
  };

  const handleCountFocus = (denom: number) => {
    if (isEodLocked || latestTx) return; // Guard
    setActiveInput({ type: 'count', id: denom });
    setLayoutName('numpad');
    setShowKeyboard(true);
    if (keyboardRef.current) keyboardRef.current.setInput(counts[denom] || '');
  };

  const handleRemarksFocus = () => {
    if (isEodLocked || latestTx) return; // Guard
    setActiveInput({ type: 'remarks' });
    setLayoutName('default');
    setShowKeyboard(true);
    if (keyboardRef.current) keyboardRef.current.setInput(remarks);
  };

  const handleInputChange = (inputVal: string) => {
    if (!activeInput || isEodLocked || latestTx) return;
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
    if (!activeInput || isEodLocked || latestTx) return;
    handleInputChange(input);
  };

  const onKeyPress = (button: string) => {
    if (button === "{enter}") setShowKeyboard(false);
  };

  const handleSubmit = async () => {
    const total = getGrandTotal(counts);
<<<<<<< HEAD
    if (total <= 0) {

      showToast("Please enter a valid cash count.", "warning");
=======
    if (total <= 0 || isEodLocked) {
      showToast(isEodLocked ? "Terminal is already locked." : "Please enter a valid cash count.", "warning");
>>>>>>> 3537335148519ac44802b3b8ee695dd57c595ab6
      return;
    }

    setIsLoading(true); 
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = days[new Date().getDay()];
    const finalRemarks = `${currentDay} EOD${remarks ? ' - ' + remarks : ''}`;

    try {
      const response = await api.post('/cash-counts', {
        total: total,
        breakdown: counts,

        remarks: finalRemarks,
      });

      if (response.status === 201 || response.status === 200) {
        localStorage.setItem('terminal_eod_locked', 'true');
        localStorage.setItem('cashier_menu_unlocked', 'false');
<<<<<<< HEAD
=======
        setIsEodLocked(true);

>>>>>>> 3537335148519ac44802b3b8ee695dd57c595ab6
        const now = new Date();
        const newTx: Transaction = {
          id: response.data.id,
          date: now.toLocaleDateString(),
          time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          total: total,
          remarks: finalRemarks,
          breakdown: { ...counts }
        };

        setLatestTx(newTx); 
        setShowKeyboard(false);
        if (onSuccess) onSuccess(); 
        
        showToast("EOD Submitted. Terminal is now LOCKED.", "success");
      }
    } catch (error) {
      console.error("Submission failed:", error);
      showToast("Failed to save to database. Ensure you are logged in.", "error");
    } finally {
      setIsLoading(false);
    }
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
    // Only allow new count if not globally locked by DB
    if (isEodLocked) {
      showToast("Cannot start new count. Day is already finalized.", "error");
      return;
    }
    setLatestTx(null);
    setCounts({});
    setRemarks('');
    if (keyboardRef.current) keyboardRef.current.setInput("");
  };

  return (
    <>
      {isLoading && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center bg-[#3b2063]/60 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl flex flex-col items-center gap-4 border border-purple-100 animate-in zoom-in-95 duration-200">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-zinc-100 border-t-[#3b2063] rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2 h-2 bg-[#3b2063] rounded-full animate-pulse"></div>
                </div>
              </div>
              <div className="text-center">
                <p className="text-[#3b2063] font-black uppercase text-xs tracking-[0.2em]">Syncing Records</p>
                <p className="text-zinc-400 font-bold text-[10px] uppercase tracking-widest mt-1">Finalizing Day End...</p>
              </div>
           </div>
        </div>
      )}

      <style>
        {`
          @media print {
            @page { size: 60mm 120mm; margin: 0; }
            body * { visibility: hidden; }
            .printable-receipt, .printable-receipt * { visibility: visible; }
            .printable-receipt {
              position: fixed; left: 0; top: 0; 

              width: 56mm !important; 
              margin: 0; padding: 4mm 2mm;
              background: white; color: black; font-family: 'Courier New', monospace; 
              font-size: 10px; line-height: 1.2;
            }
            .no-print { display: none !important; }
            .receipt-header { text-align: center; margin-bottom: 8px; }
            .receipt-header h2 { font-size: 14px; margin: 0; font-weight: bold; }
            .receipt-header p { margin: 0; font-size: 9px; }
            .breakdown-row { display: flex; justify-content: space-between; margin-bottom: 1px; }
            .total-row { border-top: 1px dashed black; border-bottom: 1px dashed black; padding: 4px 0; margin: 8px 0; font-weight: bold; font-size: 11px; }
            .signatures { margin-top: 16px; display: flex; justify-content: space-between; gap: 4px; }
            .signature-line { border-top: 1px solid black; width: 48%; text-align: center; padding-top: 4px; font-size: 8px; }
          }
        `}
      </style>

      {printData && (
        <div className="printable-receipt">
          <div className="receipt-header">
            <h2>LUCKY BOBA</h2>
            <p>EOD CASH COUNT</p>
            <p>Main Branch - QC</p>
            <p>{printData.date} | {printData.time}</p>
          </div>
          <div style={{ fontSize: '9px', marginBottom: '6px' }}>
            <p>Cashier: ADMIN | Terminal: 01</p>
          </div>

          <div style={{ marginTop: '5px' }}>
            <p style={{ fontWeight: 'bold', borderBottom: '1px solid black', paddingBottom: '2px', marginBottom: '4px' }}>Count Details:</p>
            {denominations.map(denom => {
              const qtyString = printData.breakdown[denom] || '0';
              const qty = parseFloat(qtyString);
              const rowTotal = qty * denom;
              const label = denom < 1 ? denom.toString().replace('0.', '.') : denom.toLocaleString();

              if (qty === 0) return null;
              return (
                <div key={denom} className="breakdown-row">
                  <span>{label} x {qtyString}</span>
                  <span>{rowTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              );
            })}
          </div>

          <div className="total-row breakdown-row">
            <span>TOTAL COUNT:</span>
            <span>₱ {printData.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          
          <div style={{ fontSize: '9px', marginTop: '4px' }}>
            <p><strong>Remarks:</strong> {printData.remarks}</p>
          </div>

          <div className="signatures">
            <div className="signature-line">Cashier</div>
            <div className="signature-line">Manager</div>
          </div>
        </div>
      )}

      <div className="flex flex-col h-full w-full bg-[#f8f6ff] animate-in fade-in zoom-in duration-300 relative overflow-hidden">
        <TopNavbar isEodLocked={isEodLocked} />
        <div className={`flex-1 flex flex-row items-start justify-center p-6 gap-6 overflow-y-auto transition-all duration-300 ${showKeyboard ? 'pb-87.5' : ''}`}>
          <div className="bg-white w-full flex-1 rounded-[2.5rem] shadow-xl shadow-purple-900/5 border border-zinc-100 flex flex-col relative overflow-hidden shrink-0 h-full">
            <div className="absolute top-0 left-0 w-full h-3 bg-[#3b2063] opacity-10 z-10"></div>
            
            {/* --- LOCKED OVERLAY --- */}
            {isEodLocked && (
              <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-20 flex items-center justify-center p-8">
                <div className="bg-white p-8 rounded-4xl shadow-2xl border border-zinc-100 flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
                   <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4">
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="#ef4444" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25z" /></svg>
                   </div>
                   <h3 className="text-[#3b2063] font-black uppercase text-sm tracking-widest mb-1">Terminal Closed</h3>
                   <p className="text-zinc-400 font-bold text-[10px] uppercase leading-relaxed">End of Day record has been finalized.</p>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-8 w-full scroll-smooth">
              <h2 className="text-[#3b2063] font-black text-base tracking-[0.4em] uppercase mb-2 text-center">Terminal 01 (EOD)</h2>
              <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest mb-8 text-center">End of Day Counting</p>
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
                      <div className="text-right font-black text-[#3b2063] text-lg">{label}</div>
                      <div className="text-center text-zinc-300 font-bold text-xs">X</div>
                      <div>
                        <input 
                          type="text" 
                          value={qty}
                          onFocus={() => handleCountFocus(denom)}
                          onChange={(e) => handleInputChange(e.target.value)}
                          placeholder="0"
                          disabled={isEodLocked || latestTx !== null}
                          className={`w-full text-center font-bold text-lg py-2 rounded-xl border-2 transition-all outline-none 
                            ${(isEodLocked || latestTx !== null) ? 'bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed' : 
                              (activeInput?.type === 'count' && activeInput.id === denom ? 'border-[#3b2063] bg-white ring-4 ring-[#f0ebff]' : 'border-zinc-100 bg-[#f8f6ff]')}`}
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
                    placeholder={isEodLocked ? "No remarks needed." : "E.g. Shortage of 20 pesos..."}
                    disabled={isEodLocked || latestTx !== null}
                    className={`w-full p-4 rounded-2xl border-2 font-bold text-sm text-[#3b2063] resize-none h-16 outline-none transition-all
                      ${(isEodLocked || latestTx !== null) ? 'bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed' :
                        (activeInput?.type === 'remarks' ? 'border-[#3b2063] bg-white ring-4 ring-[#f0ebff]' : 'border-zinc-100 bg-[#f8f6ff]')}`}
                  />
                </div>
<<<<<<< HEAD
                {!latestTx ? (
=======

                {!latestTx && !isEodLocked ? (
>>>>>>> 3537335148519ac44802b3b8ee695dd57c595ab6
                  <button onClick={handleSubmit} disabled={isLoading} className="w-full bg-[#3b2063] text-white py-5 rounded-3xl font-black uppercase tracking-widest shadow-lg active:scale-95 transition-transform disabled:bg-zinc-300">
                    {isLoading ? 'Saving...' : 'Submit EOD Count'}
                  </button>
                ) : (
                  <button 
                    onClick={handleNewCount} 
                    disabled={isEodLocked}
                    className={`w-full py-5 rounded-3xl font-black uppercase tracking-widest transition-transform 
                      ${isEodLocked ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed' : 'bg-zinc-100 text-zinc-600 active:scale-95'}`}
                  >
                    {isEodLocked ? 'Terminal Locked' : 'New Count'}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-xl shadow-purple-900/5 border border-zinc-100 p-8 flex flex-col items-center text-center relative overflow-hidden h-fit shrink-0 transition-all duration-500">
            <div className={`absolute top-0 left-0 w-full h-2 transition-colors duration-500 ${latestTx ? 'bg-emerald-500 opacity-20' : 'bg-zinc-300 opacity-20'}`}></div>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 transition-colors duration-500 ${latestTx ? 'bg-emerald-50' : 'bg-zinc-50'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={latestTx ? "#10b981" : "#a1a1aa"} className="w-8 h-8 transition-colors duration-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z" />
              </svg>
            </div>
            <h3 className={`font-black text-xs uppercase tracking-[0.2em] mb-2 transition-colors duration-500 ${latestTx ? 'text-[#3b2063]' : 'text-zinc-400'}`}>Receipt Printer</h3>
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-2">{latestTx ? "Ready to Print EOD" : isEodLocked ? "Shift Finalized" : "Waiting for Submit..."}</p>
            {latestTx && (
              <div className="bg-zinc-50 rounded-xl p-3 w-full mb-6 border border-zinc-100 animate-in fade-in zoom-in duration-300">
                 <div className="flex justify-between mb-1">
                   <span className="text-[10px] text-zinc-400 font-bold uppercase">Time</span>
                   <span className="text-[10px] text-[#3b2063] font-bold">{latestTx.time}</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-[10px] text-zinc-400 font-bold uppercase">Total</span>
                   <span className="text-[10px] text-[#3b2063] font-black">₱ {latestTx.total.toLocaleString()}</span>
                 </div>
              </div>
            )}
            {!latestTx && <div className="h-16 w-full"></div>}
            <button 
              onClick={handlePrint} 
              disabled={!latestTx}
              className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-200 flex items-center justify-center gap-2 group
                ${latestTx ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-900/20 active:scale-95 cursor-pointer' : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'}`}
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
              keyboardRef={r => { if(r) keyboardRef.current = r as unknown as SimpleKeyboardInstance; }}
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