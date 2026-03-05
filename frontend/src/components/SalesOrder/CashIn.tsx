"use client"

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Keyboard from 'react-simple-keyboard';
import 'react-simple-keyboard/build/css/index.css';
import type { AxiosError } from 'axios'; 
import api from '../../services/api';
import type { KeyboardRef, CashInProps, ReceiptData } from '../../types/transactions';
import TopNavbar from '../TopNavbar';
import { useToast } from '../../context/ToastContext'; 
import { Monitor, Calculator, Printer, Wallet, CheckCircle2, AlertTriangle, X } from 'lucide-react';

const CashIn: React.FC<CashInProps> = ({ onSuccess }) => {
  const { showToast } = useToast();
  const phCurrency = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });

  const [amount, setAmount] = useState('');
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(false); 
  const [isEodLocked, setIsEodLocked] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData>({ date: '', time: '' });
  const keyboardRef = useRef<KeyboardRef | null>(null);

  const cashierName = useMemo(() => {
    return localStorage.getItem('lucky_boba_user_name') || 'Staff';
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fetchEodStatus = async () => {
      try {
        const response = await api.get<{ isEodDone: boolean }>('/cash-counts/status');
        if (!cancelled) setIsEodLocked(response.data.isEodDone);
      } catch { /* silently ignore */ }
    };
    fetchEodStatus();
    return () => { cancelled = true; };
  }, []);

  const getCurrentDateTime = (): ReceiptData => {
    const now = new Date();
    return {
      date: now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0 || isEodLocked) return; 
    setIsLoading(true);
    try {
      const response = await api.post('/cash-transactions', {
        type: 'cash_in',
        amount: parseFloat(amount),
        note: 'Initial drawer cash-in'
      });

      if (response.data.success) {
        localStorage.setItem('cashier_menu_unlocked', 'true');
        localStorage.setItem('cashier_lock_date', new Date().toDateString());
        showToast(response.data.message || "Cash In recorded successfully!", "success");
        setReceiptData(getCurrentDateTime());
        setIsFlipped(true); 
        setShowKeyboard(false);
        if (onSuccess) onSuccess();
      } else {
        showToast(response.data.message || "Cash In already recorded.", "warning");
      }
    } catch (error: unknown) {
      const err = error as AxiosError<{ message?: string }>;
      const errorMessage = err.response?.data?.message || "Failed to record Cash In.";
      showToast(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewTransaction = () => {
    setIsFlipped(false);
    setAmount('');
    if (keyboardRef.current) keyboardRef.current.setInput("");
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isEodLocked) return; 
    const value = e.target.value.replace(/[^0-9.]/g, '');
    setAmount(value);
    if (keyboardRef.current) keyboardRef.current.setInput(value);
  };

  const onKeyboardChange = (input: string) => {
    if (isEodLocked) return;
    const value = input.replace(/[^0-9.]/g, '');
    setAmount(value);
  };

  const onKeyPress = (button: string) => {
    if (button === "{enter}") {
      setShowKeyboard(false);
      if (amount && !isEodLocked) handleSubmit();
    }
  };

  const handlePrint = useCallback(() => {
    if (!isFlipped) return;
    window.print();
  }, [isFlipped]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isFlipped && event.altKey && (event.key === 'p' || event.key === 'P')) {
        event.preventDefault();
        handlePrint();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, handlePrint]); 

  return (
    <>
      <style>
        {`
          .printable-receipt { display: none; }
          @media print {
            @page { size: 80mm auto; margin: 0; }
            html, body { background: white !important; margin: 0 !important; padding: 0 !important; }
            #dashboard-main-container { display: none !important; }
            .printable-receipt { 
                display: block !important;
                position: absolute !important; 
                left: 0 !important; 
                top: 0 !important; 
                width: 80mm !important; 
                padding: 5mm !important;
                background: white !important; 
                color: black !important; 
                font-family: 'Courier New', monospace;
            }
            .printable-receipt * { visibility: visible !important; }
            .receipt-divider { border-top: 1px dashed #000 !important; margin: 8px 0; width: 100%; }
            .flex-between { display: flex !important; justify-content: space-between !important; width: 100%; }
          }
          .simple-keyboard { background-color: white !important; border-radius: 0 !important; border-top: 1px solid #e4e4e7 !important; }
          .hg-button { border-radius: 0 !important; height: 60px !important; font-weight: 900 !important; font-size: 1.2rem !important; border: 1px solid #f4f4f5 !important; background: white !important; }
          .hg-button-enter { background: #3b2063 !important; color: white !important; }
        `}
      </style>

      {/* PRINTABLE RECEIPT (Logic Unchanged) */}
      {isFlipped && (
        <div className="printable-receipt text-slate-800">
          <div className="text-center space-y-1">
            <h1 className="font-black text-[14px] uppercase leading-tight">Lucky Boba Milktea Food and Beverage Trading</h1>
            <p className="text-[10px] uppercase font-bold">Main Branch - QC</p>
            <div className="receipt-divider"></div>
            <h2 className="font-black text-[11px] uppercase tracking-widest">Cash In Receipt</h2>
            <div className="text-left text-[10px] space-y-0.5 mt-2 uppercase">
              <div className="flex-between"><span>Date</span> <span>{receiptData.date}</span></div>
              <div className="flex-between"><span>Time</span> <span>{receiptData.time}</span></div>
              <div className="flex-between"><span>Terminal</span> <span>POS-01</span></div>
              <div className="flex-between"><span>Cashier</span> <span>{cashierName}</span></div>
            </div>
          </div>
          <div className="my-6 pt-4 flex-1">
            <div className="receipt-divider"></div>
            <div className="flex-between py-2">
              <span className="text-[10px] font-black uppercase tracking-widest">Total Amount</span>
              <span className="text-xl font-black">{phCurrency.format(parseFloat(amount || '0'))}</span>
            </div>
            <div className="receipt-divider"></div>
            <div className="mt-4 px-2 italic text-[9px] text-center">Note: Initial drawer cash-in for work shift.</div>
          </div>
          <div className="mt-10 text-center">
            <p className="text-[9px] font-bold uppercase underline underline-offset-4">{cashierName}</p>
            <p className="text-[8px] uppercase tracking-widest mt-1">Cashier Signature</p>
          </div>
        </div>
      )}

      {/* UI CONTAINER */}
      <div id="dashboard-main-container" className="flex flex-col h-full w-full bg-[#f8f6ff] relative overflow-hidden">
        <TopNavbar isEodLocked={isEodLocked} />
        
        <div className={`flex-1 flex flex-col xl:flex-row items-center justify-center p-4 md:p-8 gap-6 overflow-y-auto transition-all duration-300 ${showKeyboard ? 'pb-[320px]' : ''}`}>
          
          <div className="relative w-full max-w-xl h-[480px]" style={{ perspective: '1200px' }}>
            <div className="relative w-full h-full transition-transform duration-700 shadow-2xl" style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
              
              {/* Front Side: Form */}
              <div className="absolute w-full h-full bg-white rounded-none border border-zinc-200 p-8 flex flex-col" style={{ backfaceVisibility: 'hidden' }}>
                <div className="flex justify-between items-center border-b border-zinc-100 pb-5 mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#3b2063] text-white rounded-none"><Wallet size={18}/></div>
                    <h2 className="text-[#3b2063] font-black text-sm tracking-[0.3em] uppercase">Initial Cash In</h2>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-zinc-50 border border-zinc-200">
                    <Monitor size={12} className="text-black"/>
                    <span className="text-[9px] font-black uppercase tracking-widest text-black">Terminal 01</span>
                  </div>
                </div>

                <div className="flex-1 space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-black uppercase tracking-[0.2em] ml-1">Assigned Cashier</label>
                    <div className="w-full bg-[#f8f6ff] text-[#3b2063] font-black text-sm px-6 py-4 rounded-none border border-zinc-100 uppercase tracking-widest">
                      {cashierName}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-black uppercase tracking-[0.2em] ml-1">Drawer Starting Balance</label>
                    <div className="relative">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[#3b2063] font-black text-xl tabular-nums">₱</span>
                      <input 
                        type="text" value={amount} onChange={handleAmountChange} 
                        placeholder={isEodLocked ? "SHIFT CLOSED" : "0.00"} disabled={isEodLocked}
                        className={`w-full text-[#3b2063] font-black text-4xl px-6 pl-14 py-6 rounded-none border transition-all outline-none tabular-nums ${isEodLocked ? 'bg-zinc-50 border-zinc-100' : 'bg-white border-zinc-200 focus:border-[#3b2063] focus:ring-0'}`}
                      />
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleSubmit} disabled={!amount || isLoading || isEodLocked}
                  className={`w-full py-5 rounded-none font-black text-[11px] uppercase tracking-[0.3em] shadow-lg transition-all flex items-center justify-center gap-3 ${isEodLocked ? 'bg-zinc-100 text-black' : 'bg-[#3b2063] hover:bg-[#2a1647] text-white active:scale-[0.99]'}`}
                >
                  {isLoading ? <RefreshCw className="animate-spin" size={16}/> : isEodLocked ? <AlertTriangle size={16}/> : <CheckCircle2 size={16}/>}
                  {isLoading ? "Validating..." : isEodLocked ? "Terminal Closed" : "Submit & Start Shift"}
                </button>
              </div>

              {/* Back Side: Receipt Preview */}
              <div className="absolute w-full h-full bg-white rounded-none border border-zinc-200 p-10 flex flex-col font-mono" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                <div className="text-center border-b-2 border-dashed border-zinc-100 pb-6">
                  <h1 className="font-black text-lg text-[#3b2063] uppercase tracking-tighter">Lucky Boba</h1>
                  <p className="text-[10px] font-bold text-black uppercase tracking-[0.2em] mt-1 italic">Transaction Success</p>
                </div>
                
                <div className="flex-1 py-8 space-y-3">
                   <ReceiptRow label="Date" value={receiptData.date} />
                   <ReceiptRow label="Time" value={receiptData.time} />
                   <ReceiptRow label="Mode" value="CASH_IN_INIT" />
                   <div className="pt-6 mt-6 border-t border-zinc-50">
                      <p className="text-[10px] font-black text-black uppercase tracking-widest mb-1">Total Input</p>
                      <p className="text-4xl font-black text-[#3b2063] tabular-nums">{phCurrency.format(parseFloat(amount || '0'))}</p>
                   </div>
                </div>

                <button onClick={handleNewTransaction} className="w-full bg-white border border-[#3b2063] text-[#3b2063] py-4 rounded-none font-black text-[10px] uppercase tracking-[0.3em] hover:bg-zinc-50 transition-all">Reset Terminal</button>
              </div>

            </div>
          </div>

          {/* SIDEBAR: PRINT CONTROLS */}
          <div className="bg-white w-full max-w-sm rounded-none border border-zinc-200 p-8 flex flex-col gap-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-zinc-50 text-black"><Printer size={18}/></div>
              <h3 className="font-black text-[10px] uppercase tracking-[0.3em] text-black">Terminal Output</h3>
            </div>
            
            <div className="p-4 bg-[#f8f6ff] border border-zinc-100">
               <p className="text-[9px] font-bold text-[#3b2063]/60 uppercase tracking-widest leading-relaxed">
                 Receipt printing is available only after shift initialization. Press <span className="font-black">ALT + P</span> for quick print.
               </p>
            </div>

            <button 
              onClick={handlePrint} 
              disabled={!isFlipped} 
              className={`w-full py-5 rounded-none font-black text-[10px] uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 ${isFlipped ? 'bg-emerald-600 text-white shadow-emerald-900/10' : 'bg-zinc-50 text-black cursor-not-allowed border border-zinc-100'}`}
            >
              <Printer size={16}/>
              Print Receipt
            </button>
          </div>
        </div>

        {/* VIRTUAL KEYBOARD TOGGLE */}
        {!isEodLocked && (
          <button
            onClick={() => setShowKeyboard(prev => !prev)}
            className={`fixed bottom-6 right-6 z-[100] w-14 h-14 rounded-none shadow-2xl transition-all duration-300 flex items-center justify-center ${showKeyboard ? 'bg-red-600 text-white' : 'bg-[#3b2063] text-white hover:scale-105'}`}
          >
            {showKeyboard ? <X size={24} /> : <Calculator size={24} />}
          </button>
        )}

        {/* KEYBOARD MODAL */}
        <div className={`fixed bottom-0 left-0 right-0 bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.1)] transition-transform duration-500 z-[90] ${showKeyboard ? 'translate-y-0' : 'translate-y-full'}`}>
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between px-6 py-3 bg-zinc-50 border-b border-zinc-100">
              <span className="text-[10px] font-black text-black uppercase tracking-[0.3em]">Precision Input Panel</span>
              <button onClick={() => setShowKeyboard(false)} className="text-[10px] font-black text-[#3b2063] uppercase tracking-widest hover:underline">Close Panel</button>
            </div>
            <div className="p-4 bg-white">
              <Keyboard
                keyboardRef={r => { if(r) keyboardRef.current = r; }}
                onChange={onKeyboardChange}
                onKeyPress={onKeyPress}
                layout={{ default: ["1 2 3", "4 5 6", "7 8 9", ". 0 {bksp}", "{enter}"] }}
                display={{ "{bksp}": "⌫", "{enter}": "SUBMIT AMOUNT" }}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// --- HELPER COMPONENTS ---
const ReceiptRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between items-center">
    <span className="text-[10px] font-black text-black uppercase tracking-widest">{label}</span>
    <span className="text-[11px] font-black text-[#3b2063] uppercase">{value}</span>
  </div>
);

const RefreshCw = ({ className, size }: { className?: string; size?: number }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M3 21v-5h5" />
  </svg>
);

export default CashIn;
