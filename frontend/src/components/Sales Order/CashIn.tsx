"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Keyboard from 'react-simple-keyboard';
import 'react-simple-keyboard/build/css/index.css';
import type { AxiosError } from 'axios'; 
import api from '../../services/api';
import type { KeyboardRef, CashInProps, ReceiptData } from '../../types/transactions';
import TopNavbar from '../TopNavbar';

const CashIn: React.FC<CashInProps> = ({ onSuccess }) => {
  const [amount, setAmount] = useState('');
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(false); 
  
  const [receiptData, setReceiptData] = useState<ReceiptData>({ date: '', time: '' });
  const keyboardRef = useRef<KeyboardRef | null>(null);

  const getCurrentDateTime = (): ReceiptData => {
    const now = new Date();
    return {
      date: now.toLocaleDateString(),
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) return; 

    setIsLoading(true);
    try {
      const response = await api.post('/cash-transactions', {
        type: 'cash_in',
        amount: parseFloat(amount),
        note: 'Initial drawer cash-in'
      });

      if (response.data.success) {
        setReceiptData(getCurrentDateTime());
        setIsFlipped(true); 
        setShowKeyboard(false);

        // Notify sidebar to unlock the Menu
        if (onSuccess) onSuccess(); 
      }
    } catch (error: unknown) {
      const err = error as AxiosError<{ message?: string }>;
      alert(err.response?.data?.message || "Failed to record Cash In.");
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
    const value = e.target.value.replace(/[^0-9.]/g, '');
    setAmount(value);
    if (keyboardRef.current) keyboardRef.current.setInput(value);
  };

  const onKeyboardChange = (input: string) => {
    const value = input.replace(/[^0-9.]/g, '');
    setAmount(value);
  };

  const onKeyPress = (button: string) => {
    if (button === "{enter}") {
        setShowKeyboard(false);
        if (amount) handleSubmit();
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
          @media print {
            @page { size: 80mm auto; margin: 0; }
            body { margin: 0; padding: 0; }
            body * { visibility: hidden; }
            .printable-receipt, .printable-receipt * { visibility: visible; }
            .printable-receipt {
              position: absolute; left: 0; top: 0; width: 72mm !important; margin: 0; padding: 5mm !important; 
              background: white; color: black; font-family: 'Courier New', monospace;
            }
            .no-print { display: none !important; }
          }
        `}
      </style>

      <div className="flex flex-col h-full w-full bg-[#f8f6ff] animate-in fade-in zoom-in duration-300 relative overflow-hidden">
        <TopNavbar />

        <div className={`flex-1 flex flex-col xl:flex-row items-center justify-center p-6 gap-6 overflow-y-auto transition-all duration-300 ${showKeyboard ? 'pb-75' : ''}`}>
          <div className="relative w-full max-w-2xl h-125" style={{ perspective: '1000px' }}>
            <div 
              className="relative w-full h-full transition-transform duration-700 ease-in-out"
              style={{ 
                transformStyle: 'preserve-3d', 
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' 
              }}
            >
              <div className="absolute w-full h-full bg-white rounded-[3rem] shadow-xl border border-zinc-100 p-10 flex flex-col items-center overflow-hidden" style={{ backfaceVisibility: 'hidden' }}>
                <div className="absolute top-0 left-0 w-full h-3 bg-[#3b2063] opacity-10"></div>
                <h2 className="text-[#3b2063] font-black text-base tracking-[0.4em] uppercase mb-6 mt-2">Terminal 01</h2>
                <div className="w-full space-y-5 flex-1 flex flex-col justify-center">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-4">Cashier</label>
                    <div className="w-full bg-[#f8f6ff] text-[#3b2063] font-bold text-base px-8 py-5 rounded-3xl border border-transparent select-none">ADMIN</div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-4">Total</label>
                    <div className="relative">
                      <span className="absolute left-8 top-1/2 -translate-y-1/2 text-[#3b2063] font-bold text-2xl">₱</span>
                      <input 
                        type="text" 
                        value={amount}
                        onChange={handleAmountChange} 
                        onFocus={() => setShowKeyboard(true)}
                        placeholder="0.00"
                        className="w-full bg-white text-[#3b2063] font-black text-3xl px-8 pl-14 py-5 rounded-3xl border-2 border-zinc-100 focus:border-[#3b2063] focus:outline-none focus:ring-4 focus:ring-[#f0ebff] transition-all"
                      />
                    </div>
                  </div>
                  <button 
                    onClick={handleSubmit} 
                    disabled={!amount || isLoading}
                    className="w-full mt-2 bg-[#3b2063] hover:bg-[#2a1647] disabled:bg-zinc-200 text-white py-5 rounded-3xl font-black text-sm uppercase tracking-[0.25em] shadow-lg active:scale-95 transition-all duration-200"
                  >
                    {isLoading ? "Processing..." : "Submit Cash In"}
                  </button>
                </div>
              </div>

              <div className="printable-receipt absolute w-full h-full bg-white rounded-[3rem] shadow-xl border border-zinc-100 p-10 flex flex-col overflow-hidden" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                <div className="receipt-header border-b border-zinc-100 pb-4 mb-4">
                   <h2 className="text-[#3b2063] font-black text-xl uppercase">Cash In Receipt</h2>
                   <div className="flex flex-col items-center mt-2">
                      <p className="text-xs font-bold text-zinc-500">{receiptData.date} - {receiptData.time}</p>
                   </div>
                </div>
                <div className="space-y-2 mb-6 w-full">
                   <div className="flex justify-between items-center bg-[#f8f6ff] p-5 rounded-xl mt-2">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Amount</span>
                      <span className="text-2xl font-black text-[#3b2063]">₱ {amount}</span>
                   </div>
                </div>
                <button onClick={handleNewTransaction} className="no-print w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all">
                  New Transaction
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-xl border border-zinc-100 p-8 flex flex-col items-center text-center h-fit">
            <h3 className={`font-black text-xs uppercase tracking-[0.2em] mb-2 ${isFlipped ? 'text-[#3b2063]' : 'text-zinc-400'}`}>Receipt Printer</h3>
            <button 
              onClick={handlePrint} 
              disabled={!isFlipped}
              className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2
                ${isFlipped ? 'bg-emerald-500 text-white shadow-lg active:scale-95' : 'bg-zinc-100 text-zinc-400'}`}
            >
              Print (ALT + P)
            </button>
          </div>
        </div>

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