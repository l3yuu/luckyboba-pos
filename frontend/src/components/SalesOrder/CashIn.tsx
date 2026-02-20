"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Keyboard from 'react-simple-keyboard';
import 'react-simple-keyboard/build/css/index.css';
import type { AxiosError } from 'axios'; 
import api from '../../services/api';
import type { KeyboardRef, CashInProps, ReceiptData } from '../../types/transactions';
import TopNavbar from '../TopNavbar';
import { useToast } from '../../context/ToastContext'; 

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

  const checkEodStatus = async () => {
    try {
      const response = await api.get<{ isEodDone: boolean }>('/cash-counts/status');
      setIsEodLocked(response.data.isEodDone);
    } catch (error) {
      console.error("Failed to check EOD status:", error);
    }
  };

  useEffect(() => {
    checkEodStatus();
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
        showToast(response.data.message || "Cash In recorded successfully!", "success");
        setReceiptData(getCurrentDateTime());
        setIsFlipped(true); 
        setShowKeyboard(false);

        setTimeout(() => {
          if (onSuccess) onSuccess();
        }, 750);
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
          /* SCREEN: Hide the printable receipt naturally */
          .printable-receipt { 
              display: none; 
          }

          @media print {
            @page { size: 80mm auto; margin: 0; }
            
            /* PRINT: Force the page background to white */
            html, body {
                background: white !important;
                margin: 0 !important;
                padding: 0 !important;
            }
            
            /* PRINT: Safely hide the entire Dashboard UI */
            #dashboard-main-container { 
                display: none !important; 
            }

            /* PRINT: Force show only the receipt, pinned to the top-left */
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
            
            /* Utility classes for the receipt layout */
            .printable-receipt * { visibility: visible !important; }
            .receipt-divider { border-top: 1px dashed #000 !important; margin: 8px 0; width: 100%; }
            .flex-between { display: flex !important; justify-content: space-between !important; width: 100%; }
          }
        `}
      </style>

      {/* ISOLATED RECEIPT UI (MATCHES X-READING) */}
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
            </div>
          </div>

          <div className="my-6 pt-4 flex-1">
            <div className="receipt-divider"></div>
            <div className="flex justify-between items-center py-2">
              <span className="text-[10px] font-black uppercase tracking-widest">Total Amount</span>
              <span className="text-xl font-black">{phCurrency.format(parseFloat(amount || '0'))}</span>
            </div>
            <div className="receipt-divider"></div>
            <div className="mt-4 px-2 italic text-[9px] text-center">
              Note: Initial drawer cash-in for work shift.
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-8 text-center">
            <div>
               <p className="text-[9px] font-bold uppercase underline underline-offset-4">{localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).name : 'System Admin'}</p>
               <p className="text-[8px] uppercase tracking-widest mt-1">Cashier Signature</p>
            </div>
          </div>
        </div>
      )}

      {/* DASHBOARD UI CONTAINER (ID ADDED FOR SAFE HIDING) */}
      <div id="dashboard-main-container" className="flex flex-col h-full w-full bg-[#f8f6ff] animate-in fade-in zoom-in duration-300 relative overflow-hidden">
        <TopNavbar isEodLocked={isEodLocked} />

        <div className={`flex-1 flex flex-col xl:flex-row items-center justify-center p-6 gap-6 overflow-y-auto transition-all duration-300 ${showKeyboard ? 'pb-75' : ''}`}>
          <div className="relative w-full max-w-2xl h-125" style={{ perspective: '1000px' }}>
            <div 
              className="relative w-full h-full transition-transform duration-700 ease-in-out"
              style={{ 
                transformStyle: 'preserve-3d', 
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' 
              }}
            >
              {/* Front: Input Side */}
              <div className="absolute w-full h-full bg-white rounded-[3rem] shadow-xl border border-zinc-100 p-10 flex flex-col items-center overflow-hidden" style={{ backfaceVisibility: 'hidden' }}>
                <div className="absolute top-0 left-0 w-full h-3 bg-[#3b2063] opacity-10"></div>
                <h2 className="text-[#3b2063] font-black text-base tracking-[0.4em] uppercase mb-6 mt-2">Terminal 01</h2>
                <div className="w-full space-y-5 flex-1 flex flex-col justify-center">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-4">Cashier</label>
                    <div className="w-full bg-[#f8f6ff] text-[#3b2063] font-bold text-base px-8 py-5 rounded-3xl border border-transparent select-none uppercase">{localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).name : 'ADMIN'}</div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-4">Total Cash In</label>
                    <div className="relative">
                      <span className="absolute left-8 top-1/2 -translate-y-1/2 text-[#3b2063] font-bold text-2xl">₱</span>
                      <input 
                        type="text" 
                        value={amount}
                        onChange={handleAmountChange}
                        placeholder={isEodLocked ? "LOCKED" : "0.00"}
                        disabled={isEodLocked}
                        className={`w-full text-[#3b2063] font-black text-3xl px-8 pl-14 py-5 rounded-3xl border-2 transition-all focus:outline-none focus:ring-4 focus:ring-[#f0ebff] 
                          ${isEodLocked ? 'bg-zinc-50 border-zinc-100 cursor-not-allowed opacity-50' : 'bg-white border-zinc-100 focus:border-[#3b2063]'}`}
                      />
                    </div>
                  </div>
                  <button 
                    onClick={handleSubmit} 
                    disabled={!amount || isLoading || isEodLocked}
                    className={`w-full mt-2 py-5 rounded-3xl font-black text-sm uppercase tracking-[0.25em] shadow-lg active:scale-95 transition-all duration-200
                      ${isEodLocked ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed' : 'bg-[#3b2063] hover:bg-[#2a1647] text-white'}`}
                  >
                    {isLoading ? "Processing..." : isEodLocked ? "Terminal Closed" : "Submit Cash In"}
                  </button>
                </div>
              </div>

              {/* Back: Receipt UI Side (Visual representation for the dashboard) */}
              <div className="absolute w-full h-full bg-white rounded-[3rem] shadow-xl border border-zinc-100 p-10 flex flex-col font-mono text-slate-800" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                <div className="text-center space-y-1">
                  <h1 className="font-black text-[14px] uppercase leading-tight">Lucky Boba Milktea Food and Beverage Trading</h1>
                  <p className="text-[10px] uppercase font-bold">Main Branch - QC</p>
                  <div className="border-top: 1px dashed #000; margin: 8px 0; width: 100%;"></div>
                  <h2 className="font-black text-[11px] uppercase tracking-widest">Cash In Receipt</h2>
                  <div className="text-left text-[10px] space-y-0.5 mt-2 uppercase">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Date</span> <span>{receiptData.date}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Time</span> <span>{receiptData.time}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Terminal</span> <span>POS-01</span></div>
                  </div>
                </div>

                <div className="my-6 pt-4 flex-1">
                  <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }}></div>
                  <div className="flex justify-between items-center bg-zinc-50 p-5 rounded-xl border border-zinc-100">
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Total Amount</span>
                    <span className="text-2xl font-black text-[#3b2063]">{phCurrency.format(parseFloat(amount || '0'))}</span>
                  </div>
                  <div className="mt-4 px-2 italic text-[9px] text-zinc-500 text-center">
                    Note: Initial drawer cash-in for work shift.
                  </div>
                </div>

                <div className="mt-auto space-y-3">
                  <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }}></div>
                  <button onClick={handleNewTransaction} className="w-full bg-[#3b2063] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-lg active:scale-95">
                    New Transaction
                  </button>
                </div>

                <div className="mt-4 text-center space-y-2 pb-2">
                  <p className="text-[9px] font-bold uppercase">{localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).name : 'System Admin'}</p>
                  <p className="text-[8px] opacity-70 italic leading-none">____________________</p>
                  <p className="text-[8px] uppercase">Cashier Signature</p>
                </div>
              </div>
            </div>
          </div>

          {/* Receipt printer panel */}
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-xl border border-zinc-100 p-8 flex flex-col items-center text-center h-fit">
            <h3 className={`font-black text-xs uppercase tracking-[0.2em] mb-2 ${isFlipped ? 'text-[#3b2063]' : 'text-zinc-400'}`}>Receipt Printer</h3>
            <button 
              onClick={handlePrint} 
              disabled={!isFlipped}
              className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2
                ${isFlipped ? 'bg-emerald-500 text-white shadow-lg active:scale-95' : 'bg-zinc-100 text-zinc-400'}`}
            >
              Print Receipt (ALT + P)
            </button>
            <p className="text-[9px] text-zinc-400 mt-4 leading-relaxed uppercase font-bold tracking-tighter">
              Ensure thermal paper is loaded before printing.
            </p>
          </div>
        </div>
        
        {/* Keyboard toggle & Modal remain the same */}
        {!isEodLocked && (
          <button
            onClick={() => setShowKeyboard(prev => !prev)}
            className={`fixed bottom-8 right-8 z-60 p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 ${showKeyboard ? 'bg-red-500 text-white' : 'bg-[#3b2063] text-white'}`}
          >
            {showKeyboard ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5" /></svg>
            )}
          </button>
        )}

        <div className={`fixed bottom-0 left-0 right-0 bg-white shadow-2xl transition-transform duration-300 z-50 ${showKeyboard ? 'translate-y-0' : 'translate-y-full'}`}>
          <div className="flex items-center justify-between px-4 py-2 bg-zinc-50 border-b">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Numpad</span>
            <button onClick={() => setShowKeyboard(false)} className="text-xs font-black text-[#3b2063] uppercase p-2">Close</button>
          </div>
          <div className="p-2">
            <Keyboard
              keyboardRef={r => { if(r) keyboardRef.current = r; }}
              onChange={onKeyboardChange}
              onKeyPress={onKeyPress}
              layout={{ default: ["1 2 3", "4 5 6", "7 8 9", ". 0 {bksp}", "{enter}"] }}
              display={{ "{bksp}": "⌫", "{enter}": "DONE" }}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default CashIn;