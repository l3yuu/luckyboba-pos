"use client"

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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

  const cashierName = useMemo(() => {
    return localStorage.getItem('lucky_boba_user_name') || 'Staff';
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchEodStatus = async () => {
      try {
        const response = await api.get<{ isEodDone: boolean }>('/cash-counts/status');
        if (!cancelled) setIsEodLocked(response.data.isEodDone);
      } catch {
        // silently ignore
      }
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
      const status = err.response?.status;
      const errorMessage = err.response?.data?.message || "Failed to record Cash In.";

      if (status !== 422) {
        console.error("Cash In error:", err);
      }

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
        `}
      </style>

      {/* PRINTABLE RECEIPT */}
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
        <div className={`flex-1 flex flex-col xl:flex-row items-center justify-center p-6 gap-6 overflow-y-auto transition-all duration-300 ${showKeyboard ? 'pb-75' : ''}`}>
          <div className="relative w-full max-w-2xl h-125" style={{ perspective: '1000px' }}>
            <div className="relative w-full h-full transition-transform duration-700" style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
              {/* Front Side */}
              <div className="absolute w-full h-full bg-white rounded-[3rem] shadow-xl border border-zinc-100 p-10 flex flex-col items-center" style={{ backfaceVisibility: 'hidden' }}>
                <h2 className="text-[#3b2063] font-black text-base tracking-[0.4em] uppercase mb-6">Terminal 01</h2>
                <div className="w-full space-y-5 flex-1">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-4">Cashier</label>
                    <div className="w-full bg-[#f8f6ff] text-[#3b2063] font-bold text-base px-8 py-5 rounded-3xl uppercase">
                      {cashierName}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-4">Total Cash In</label>
                    <div className="relative">
                      <span className="absolute left-8 top-1/2 -translate-y-1/2 text-[#3b2063] font-bold text-2xl">₱</span>
                      <input 
                        type="text" value={amount} onChange={handleAmountChange} 
                        placeholder={isEodLocked ? "LOCKED" : "0.00"} disabled={isEodLocked}
                        className={`w-full text-[#3b2063] font-black text-3xl px-8 pl-14 py-5 rounded-3xl border-2 transition-all outline-none focus:ring-4 focus:ring-[#f0ebff] ${isEodLocked ? 'bg-zinc-50 border-zinc-100' : 'bg-white border-zinc-100 focus:border-[#3b2063]'}`}
                      />
                    </div>
                  </div>
                  <button 
                    onClick={handleSubmit} disabled={!amount || isLoading || isEodLocked}
                    className={`w-full mt-2 py-5 rounded-3xl font-black text-sm uppercase tracking-[0.25em] shadow-lg transition-all ${isEodLocked ? 'bg-zinc-200 text-zinc-400' : 'bg-[#3b2063] hover:bg-[#2a1647] text-white'}`}
                  >
                    {isLoading ? "Processing..." : isEodLocked ? "Terminal Closed" : "Submit Cash In"}
                  </button>
                </div>
              </div>
              {/* Back Side */}
              <div className="absolute w-full h-full bg-white rounded-[3rem] shadow-xl border border-zinc-100 p-10 flex flex-col font-mono text-slate-800" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                <div className="text-center">
                  <h1 className="font-black text-[14px] uppercase">Lucky Boba</h1>
                  <h2 className="font-black text-[11px] uppercase tracking-widest">Cash In Receipt</h2>
                  <div className="text-left text-[10px] mt-4 uppercase">
                    <div className="flex-between"><span>Date</span> <span>{receiptData.date}</span></div>
                    <div className="flex-between"><span>Time</span> <span>{receiptData.time}</span></div>
                    <div className="flex-between"><span>Cashier</span> <span>{cashierName}</span></div>
                  </div>
                </div>
                <div className="my-6 pt-4 flex-1">
                  <div className="flex-between bg-zinc-50 p-5 rounded-xl border border-zinc-100">
                    <span className="text-[10px] font-black text-zinc-400 uppercase">Total Amount</span>
                    <span className="text-2xl font-black text-[#3b2063]">{phCurrency.format(parseFloat(amount || '0'))}</span>
                  </div>
                </div>
                <button onClick={handleNewTransaction} className="w-full bg-[#3b2063] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg">New Transaction</button>
              </div>
            </div>
          </div>
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-xl border border-zinc-100 p-8 flex flex-col items-center">
            <h3 className={`font-black text-xs uppercase tracking-[0.2em] mb-2 ${isFlipped ? 'text-[#3b2063]' : 'text-zinc-400'}`}>Receipt Printer</h3>
            <button onClick={handlePrint} disabled={!isFlipped} className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all ${isFlipped ? 'bg-emerald-500 text-white shadow-lg active:scale-95' : 'bg-zinc-100 text-zinc-400'}`}>Print Receipt (ALT + P)</button>
          </div>
        </div>

        {/* VIRTUAL KEYBOARD TOGGLE */}
        {!isEodLocked && (
          <button
            onClick={() => setShowKeyboard(prev => !prev)}
            className={`fixed bottom-8 right-8 z-60 p-4 rounded-full shadow-2xl transition-all duration-300 ${showKeyboard ? 'bg-red-500 text-white' : 'bg-[#3b2063] text-white'}`}
          >
            {showKeyboard ? '×' : '⌨'}
          </button>
        )}

        {/* VIRTUAL KEYBOARD MODAL */}
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