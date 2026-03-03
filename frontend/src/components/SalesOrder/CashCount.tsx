"use client"

import React, { useState, useRef, useEffect } from 'react';
import Keyboard from 'react-simple-keyboard';
import 'react-simple-keyboard/build/css/index.css';
import type { Transaction, ActiveInput } from '../../types/cash-count';
import api from '../../services/api';
import TopNavbar from '../TopNavbar';
import { useToast } from '../../hooks/useToast';
import { 
  Calculator, 
  Printer, 
  CheckCircle2, 
  Lock, 
  AlertTriangle, 
  MessageSquare,  
  RefreshCw,
  X
} from 'lucide-react';

interface SimpleKeyboardInstance {
  setInput: (input: string) => void;
}

interface CashCountProps {
  onSuccess?: () => void;
}

const CashCount: React.FC<CashCountProps> = ({ onSuccess }) => {
  const { showToast } = useToast();
  const denominations = [1000, 500, 200, 100, 50, 20, 10, 5, 1, 0.25];

  // --- State (Unchanged) ---
  const [counts, setCounts] = useState<{ [key: number]: string }>({});
  const [remarks, setRemarks] = useState('');
  const [latestTx, setLatestTx] = useState<Transaction | null>(null);
  const [printData, setPrintData] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEodLocked, setIsEodLocked] = useState(false);
  const [activeInput, setActiveInput] = useState<ActiveInput | null>(null);
  const [layoutName, setLayoutName] = useState('numpad');
  const [showKeyboard, setShowKeyboard] = useState(false);
  const keyboardRef = useRef<SimpleKeyboardInstance | null>(null);

  // --- Functions (Unchanged Logic) ---
  const checkEodStatus = async () => {
    try {
      const response = await api.get<{ isEodDone: boolean }>('/cash-counts/status');
      setIsEodLocked(response.data.isEodDone);
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

  const getGrandTotal = (currentCounts: { [key: number]: string }) => {
    return denominations.reduce((total, denom) => {
      const qty = parseFloat(currentCounts[denom] || '0');
      return total + (qty * denom);
    }, 0);
  };

  const handleCountFocus = (denom: number) => {
    if (isEodLocked || latestTx) return;
    setActiveInput({ type: 'count', id: denom });
    setLayoutName('numpad');
    setShowKeyboard(true);
    if (keyboardRef.current) keyboardRef.current.setInput(counts[denom] || '');
  };

  const handleRemarksFocus = () => {
    if (isEodLocked || latestTx) return;
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
    if (total <= 0 || isEodLocked) {
      showToast(isEodLocked ? "Terminal is already locked." : "Please enter a valid cash count.", "warning");
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
        setIsEodLocked(true);
        window.dispatchEvent(new CustomEvent('eod-completed'));
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
      showToast("Failed to save to database.", "error");
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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/90 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white p-10 rounded-none border border-zinc-200 flex flex-col items-center gap-6 shadow-2xl">
              <RefreshCw className="w-12 h-12 text-[#3b2063] animate-spin" strokeWidth={1.5} />
              <div className="text-center">
                <p className="text-[#3b2063] font-black uppercase text-[11px] tracking-[0.4em]">Terminal Syncing</p>
                <p className="text-zinc-400 font-black text-[9px] uppercase tracking-widest mt-2">Finalizing End of Day Journal...</p>
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
            .printable-receipt { position: fixed; left: 0; top: 0; width: 56mm !important; margin: 0; padding: 4mm 2mm; background: white; color: black; font-family: 'Courier New', monospace; font-size: 10px; line-height: 1.2; }
            .receipt-header { text-align: center; margin-bottom: 8px; border-bottom: 1px dashed black; padding-bottom: 8px; }
            .receipt-header h2 { font-size: 14px; margin: 0; font-weight: bold; }
            .breakdown-row { display: flex; justify-content: space-between; margin-bottom: 1px; }
            .total-row { border-top: 1px solid black; border-bottom: 1px solid black; padding: 4px 0; margin: 8px 0; font-weight: bold; font-size: 11px; }
          }
          .simple-keyboard { background-color: white !important; border-radius: 0 !important; border-top: 1px solid #e4e4e7 !important; }
          .hg-button { border-radius: 0 !important; height: 50px !important; font-weight: 900 !important; border: 1px solid #f4f4f5 !important; background: white !important; }
          .hg-button-enter { background: #3b2063 !important; color: white !important; }
        `}
      </style>

      {/* RECEIPT (Unchanged Logic) */}
      {printData && (
        <div className="printable-receipt">
          <div className="receipt-header">
            <h2>LUCKY BOBA</h2>
            <p>EOD CASH COUNT</p>
            <p>Main Branch - QC</p>
            <p>{printData.date} | {printData.time}</p>
          </div>
          <div style={{ marginTop: '5px' }}>
            <p style={{ fontWeight: 'bold', marginBottom: '4px' }}>DENOMINATION COUNT:</p>
            {denominations.map(denom => {
              const qtyString = printData.breakdown[denom] || '0';
              const qty = parseFloat(qtyString);
              if (qty === 0) return null;
              return (
                <div key={denom} className="breakdown-row">
                  <span>{denom < 1 ? denom.toString().replace('0.', '.') : denom.toLocaleString()} x {qtyString}</span>
                  <span>₱{(qty * denom).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              );
            })}
          </div>
          <div className="total-row breakdown-row">
            <span>TOTAL COUNT:</span>
            <span>₱ {printData.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      )}

      <div className="flex flex-col h-full w-full bg-[#f8f6ff] animate-in fade-in zoom-in duration-300 relative overflow-hidden">
        <TopNavbar isEodLocked={isEodLocked} />
        
        <div className={`flex-1 flex flex-row items-start justify-center p-4 md:p-8 gap-4 md:gap-6 overflow-y-auto transition-all duration-300 ${showKeyboard ? 'pb-[280px]' : ''}`}>
          
          {/* LEFT: COUNTING FORM */}
          <div className="bg-white w-full flex-1 rounded-none border border-zinc-200 flex flex-col relative h-full shadow-sm">
            <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-[#3b2063] text-white rounded-none"><Calculator size={18}/></div>
                 <h2 className="text-[#3b2063] font-black text-[11px] tracking-[0.4em] uppercase">Shift End Reconciliation</h2>
              </div>
              {isEodLocked && <div className="px-3 py-1 bg-red-50 text-red-600 border border-red-100 font-black text-[9px] uppercase tracking-widest flex items-center gap-1.5"><Lock size={10}/> Locked</div>}
            </div>

            {isEodLocked && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-20 flex items-center justify-center p-8">
                <div className="bg-white p-8 rounded-none border border-zinc-200 flex flex-col items-center text-center shadow-2xl animate-in zoom-in-95 duration-300">
                   <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
                   <h3 className="text-[#3b2063] font-black uppercase text-[11px] tracking-[0.3em] mb-2">Shift Already Finalized</h3>
                   <p className="text-zinc-400 font-black text-[9px] uppercase leading-relaxed max-w-[200px]">End of Day records are locked for this terminal today.</p>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
              <div className="grid grid-cols-12 gap-2 mb-4 px-2">
                <div className="col-span-3 text-[9px] font-black text-zinc-300 uppercase tracking-widest">Denom</div>
                <div className="col-span-4 text-center text-[9px] font-black text-zinc-300 uppercase tracking-widest">Quantity</div>
                <div className="col-span-5 text-right text-[9px] font-black text-zinc-300 uppercase tracking-widest">Amount Value</div>
              </div>

              <div className="space-y-1">
                {denominations.map((denom) => {
                  const qty = counts[denom] || '';
                  const rowTotal = denom * (parseFloat(qty) || 0);
                  const label = denom < 1 ? denom.toString().replace('0.', '.') : denom.toLocaleString();
                  return (
                    <div key={denom} className={`grid grid-cols-12 gap-2 items-center px-2 py-1 border-b border-zinc-50 transition-colors ${activeInput?.id === denom ? 'bg-[#f8f6ff]' : ''}`}>
                      <div className="col-span-3 font-black text-[#3b2063] text-sm tabular-nums">{label}</div>
                      <div className="col-span-4">
                        <input 
                          type="text" value={qty} placeholder="0"
                          onFocus={() => handleCountFocus(denom)}
                          onChange={(e) => handleInputChange(e.target.value)}
                          disabled={isEodLocked || latestTx !== null}
                          className={`w-full text-center font-black text-sm py-2 rounded-none border outline-none transition-all tabular-nums
                            ${(isEodLocked || latestTx !== null) ? 'bg-zinc-50 text-zinc-300 border-zinc-100' : 
                              (activeInput?.type === 'count' && activeInput.id === denom ? 'border-[#3b2063] bg-white ring-2 ring-[#3b2063]/5' : 'border-zinc-100 bg-[#f8f6ff]')}`}
                        />
                      </div>
                      <div className="col-span-5 text-right font-black text-[#3b2063] text-sm tabular-nums opacity-60">
                        {rowTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-6 bg-zinc-50 border-t border-zinc-100 space-y-4">
              <div className="flex items-center justify-between bg-white border border-zinc-200 p-4">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Grand Total Finalized</span>
                <span className="text-2xl font-black text-[#3b2063] tabular-nums">₱ {getGrandTotal(counts).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              
              <div className="relative">
                <MessageSquare size={14} className="absolute left-4 top-4 text-zinc-300" />
                <textarea 
                  value={remarks} onFocus={handleRemarksFocus}
                  onChange={(e) => handleInputChange(e.target.value)}
                  placeholder="Terminal notes / Shortage explanation..."
                  disabled={isEodLocked || latestTx !== null}
                  className={`w-full pl-10 pr-4 py-3 rounded-none border border-zinc-200 outline-none transition-all text-xs font-bold resize-none h-14
                    ${(isEodLocked || latestTx !== null) ? 'bg-zinc-100 text-zinc-300' : (activeInput?.type === 'remarks' ? 'border-[#3b2063]' : 'bg-white')}`}
                />
              </div>

              <div className="flex gap-2">
                {!latestTx && !isEodLocked ? (
                  <button onClick={handleSubmit} disabled={isLoading} className="flex-1 py-4 bg-[#3b2063] text-white font-black uppercase tracking-[0.2em] text-xs shadow-lg active:scale-[0.99] transition-all flex items-center justify-center gap-2">
                    <CheckCircle2 size={16}/> {isLoading ? 'Finalizing...' : 'Submit EOD Count'}
                  </button>
                ) : (
                  <button onClick={handleNewCount} disabled={isEodLocked} className={`flex-1 py-4 font-black uppercase tracking-[0.2em] text-xs transition-all flex items-center justify-center gap-2
                    ${isEodLocked ? 'bg-zinc-100 text-zinc-300 border border-zinc-200' : 'bg-white border border-[#3b2063] text-[#3b2063] active:scale-[0.99]'}`}>
                    <RefreshCw size={16}/> {isEodLocked ? 'Terminal Closed' : 'Recount Balance'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: PRINTER CARD */}
          <div className="bg-white w-full max-w-sm rounded-none border border-zinc-200 p-8 flex flex-col items-center text-center shadow-sm relative overflow-hidden h-fit">
            <div className={`absolute top-0 left-0 w-full h-1.5 ${latestTx ? 'bg-emerald-500' : 'bg-zinc-200'} opacity-30`}></div>
            <div className={`w-16 h-16 rounded-none border flex items-center justify-center mb-6 transition-colors ${latestTx ? 'bg-emerald-50 border-emerald-100' : 'bg-zinc-50 border-zinc-100'}`}>
              <Printer className={latestTx ? 'text-emerald-500' : 'text-zinc-300'} size={24} strokeWidth={2}/>
            </div>
            <h3 className={`font-black text-[11px] uppercase tracking-[0.3em] mb-2 ${latestTx ? 'text-[#3b2063]' : 'text-zinc-400'}`}>Receipt Printer</h3>
            <p className="text-[9px] text-zinc-400 font-black uppercase tracking-widest mb-6">{latestTx ? "Ready for physical output" : isEodLocked ? "Shift Record Archived" : "Pending Submission"}</p>
            
            {latestTx && (
              <div className="bg-zinc-50 border border-zinc-100 p-4 w-full mb-8 space-y-2 animate-in fade-in duration-500">
                 <div className="flex justify-between text-[10px] font-black uppercase"><span className="text-zinc-400">Timestamp</span><span className="text-[#3b2063]">{latestTx.time}</span></div>
                 <div className="flex justify-between text-[10px] font-black uppercase"><span className="text-zinc-400">Total Count</span><span className="text-emerald-600">₱ {latestTx.total.toLocaleString()}</span></div>
              </div>
            )}

            <button onClick={handlePrint} disabled={!latestTx}
              className={`w-full py-4 rounded-none font-black text-[10px] uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3
                ${latestTx ? 'bg-emerald-600 text-white shadow-lg hover:bg-emerald-700 active:scale-95' : 'bg-zinc-50 text-zinc-300 border border-zinc-100 cursor-not-allowed'}`}>
              <Printer size={16}/> Print EOD Journal
            </button>
          </div>
        </div>

        {/* KEYBOARD DRAWER */}
        <div className={`fixed bottom-0 left-0 right-0 bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.1)] transition-transform duration-500 z-[90] ${showKeyboard ? 'translate-y-0' : 'translate-y-full'}`}>
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between px-6 py-3 bg-zinc-50 border-b border-zinc-100">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">{layoutName === 'numpad' ? 'Numeric Pad' : 'Full Alphanumeric'}</span>
              <button onClick={() => setShowKeyboard(false)} className="text-[10px] font-black text-[#3b2063] uppercase tracking-widest hover:underline">Close Panel</button>
            </div>
            <div className="p-4 bg-white">
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
        
        {/* KEYBOARD TRIGGER (Floating FAB logic preserved) */}
        {!isEodLocked && (
          <button onClick={() => setShowKeyboard(!showKeyboard)}
            className={`fixed bottom-6 right-6 z-[100] w-14 h-14 rounded-none shadow-2xl transition-all duration-300 flex items-center justify-center ${showKeyboard ? 'bg-red-600 text-white' : 'bg-[#3b2063] text-white hover:scale-105'}`}>
            {showKeyboard ? <X size={24}/> : <Calculator size={24}/>}
          </button>
        )}
      </div>
    </>
  );
};

export default CashCount;