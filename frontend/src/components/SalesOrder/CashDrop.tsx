"use client"

import React, { useState, useRef, useEffect } from 'react';
import Keyboard from 'react-simple-keyboard';
import 'react-simple-keyboard/build/css/index.css';
import type { AxiosError } from 'axios';
import api from '../../services/api';
import type { 
  BackendTransaction, 
  Transaction, 
  KeyboardRef, 
  CashDropProps 
} from '../../types/transactions';
import TopNavbar from '../TopNavbar';
import { getCache, setCache } from '../../utils/cache';
import { 
  Banknote, 
  History as HistoryIcon, 
  Printer, 
  Calculator, 
  MessageSquare, 
  ArrowDownCircle, 
  CheckCircle2, 
  X,
  Clock
} from 'lucide-react';

const CACHE_KEY = 'cash-drop-history';
const CACHE_TTL = 5 * 60 * 1000;

const CashDrop: React.FC<CashDropProps> = ({ onSuccess }) => {
  const denominations = [1000, 500, 200, 100, 50, 20, 10, 5, 1, 0.25];
  const [counts, setCounts] = useState<{ [key: number]: string }>({});
  const [remarks, setRemarks] = useState('');
  const [isEodLocked, setIsEodLocked] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>(
    getCache<Transaction[]>(CACHE_KEY) ?? []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [printData, setPrintData] = useState<Transaction | null>(null);
  const [activeInput, setActiveInput] = useState<{ type: 'count' | 'remarks', id?: number } | null>(null);
  const [layoutName, setLayoutName] = useState('numpad');
  const [showKeyboard, setShowKeyboard] = useState(false);
  const keyboardRef = useRef<KeyboardRef | null>(null);

  const checkEodStatus = async () => {
    try {
      const response = await api.get<{ isEodDone: boolean }>('/cash-counts/status');
      setIsEodLocked(response.data.isEodDone);
    } catch (error) {
      console.error("Failed to check EOD status:", error);
    }
  };

  const fetchTodaysDrops = async () => {
    if (getCache<Transaction[]>(CACHE_KEY)) return;
    try {
      const response = await api.get<BackendTransaction[]>('/cash-transactions', {
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
      setCache<Transaction[]>(CACHE_KEY, mappedData, CACHE_TTL);
      setTransactions(mappedData);
    } catch (error) {
      console.error("Failed to fetch history:", error);
    }
  };

  useEffect(() => {
    void (async () => { await fetchTodaysDrops(); })();
    checkEodStatus();
  }, []);

  const getGrandTotal = (currentCounts: { [key: number]: string }) => {
    return denominations.reduce((total, denom) => {
      const qty = parseFloat(currentCounts[denom] || '0');
      return total + (qty * denom);
    }, 0);
  };

  const handleCountFocus = (denom: number) => {
    if (isEodLocked) return;
    setActiveInput({ type: 'count', id: denom });
    setLayoutName('numpad');
    if (keyboardRef.current) keyboardRef.current.setInput(counts[denom] || '');
    setShowKeyboard(true);
  };

  const handleRemarksFocus = () => {
    if (isEodLocked) return;
    setActiveInput({ type: 'remarks' });
    setLayoutName('default');
    if (keyboardRef.current) keyboardRef.current.setInput(remarks);
    setShowKeyboard(true);
  };

  const handleInputChange = (inputVal: string) => {
    if (!activeInput || isEodLocked) return;
    if (activeInput.type === 'count' && activeInput.id !== undefined) {
      const cleanValue = inputVal.replace(/[^0-9.]/g, '');
      setCounts(prev => ({ ...prev, [activeInput.id!]: cleanValue }));
    } else if (activeInput.type === 'remarks') {
      setRemarks(inputVal);
    }
  };

  const onKeyboardChange = (input: string) => handleInputChange(input);
  const onKeyPress = (button: string) => {
    if (button === "{enter}") setShowKeyboard(false);
  };

  const handleSubmit = async () => {
    const total = getGrandTotal(counts);
    if (total <= 0 || isLoading || isEodLocked) return;
    setIsLoading(true);

    const breakdownString = denominations
      .filter(d => counts[d] && parseFloat(counts[d]) > 0)
      .map(d => `${d}x${counts[d]}`)
      .join(', ');

    const finalNote = `Drop Breakdown: ${breakdownString}${remarks ? ` | Remarks: ${remarks}` : ''}`;

    try {
      const response = await api.post('/cash-transactions', {
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
          total,
          remarks: remarks || '-',
          breakdown: { ...counts }
        };

        const updatedHistory = [newTx, ...transactions];
        setTransactions(updatedHistory);
        setCache<Transaction[]>(CACHE_KEY, updatedHistory, CACHE_TTL);

        setCounts({});
        setRemarks('');
        setShowKeyboard(false);
        if (keyboardRef.current) keyboardRef.current.setInput("");

        if (onSuccess) onSuccess();
        handlePrint(newTx);
      }
    } catch (err: unknown) {
      const axiosError = err as AxiosError<{ message?: string }>;
      alert(axiosError.response?.data?.message || "Failed to record Cash Drop.");
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
          .printable-receipt { display: none; }
          @media print {
            @page { size: 80mm auto; margin: 0 !important; }
            html, body { margin: 0 !important; padding: 0 !important; background: white !important; }
            body * { visibility: hidden; }
            .printable-receipt, .printable-receipt * { visibility: visible !important; }
            .printable-receipt { display: block !important; position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; max-width: 76mm !important; }
            .receipt-area { width: 66mm !important; margin: 0 auto !important; padding: 3mm 0 15mm 0 !important; font-family: Arial, sans-serif !important; font-size: 11px !important; }
          }
          .simple-keyboard { background-color: white !important; border-radius: 0 !important; border-top: 1px solid #e4e4e7 !important; }
          .hg-button { border-radius: 0 !important; height: 50px !important; font-weight: 900 !important; border: 1px solid #f4f4f5 !important; background: white !important; }
          .hg-button-enter { background: #3b2063 !important; color: white !important; }
        `}
      </style>

      {/* RECEIPT RENDERER (Logic Unchanged) */}
      {printData && (
        <div className="printable-receipt">
          <div className="receipt-area">
            <div className="rp-center" style={{ textAlign: 'center', marginBottom: 6 }}>
              <div style={{ fontWeight: 900, fontSize: 13, textTransform: 'uppercase' }}>Lucky Boba Milktea Food and Beverage Trading</div>
              <div style={{ fontWeight: 700, fontSize: 10, textTransform: 'uppercase' }}>Main Branch - QC</div>
            </div>
            <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />
            <div style={{ textAlign: 'center', fontWeight: 900, textTransform: 'uppercase' }}>Cash Drop Receipt</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}><span>Date</span><span>{printData.date}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Time</span><span>{printData.time}</span></div>
            <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />
            <table>
              <tbody>
                {denominations.map(denom => {
                  const qty = parseFloat(printData.breakdown[denom] || '0');
                  if (qty <= 0) return null;
                  return (
                    <tr key={denom}>
                      <td>{denom.toLocaleString()}</td>
                      <td style={{ textAlign: 'center' }}>x{qty}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>₱{(qty * denom).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{ borderTop: '1px solid #000', marginTop: 4, padding: '4px 0', display: 'flex', justifyContent: 'space-between', fontWeight: 900 }}>
              <span>GRAND TOTAL</span><span>₱{printData.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            {printData.remarks !== '-' && <div style={{ marginTop: 8, fontSize: 10, fontStyle: 'italic' }}>Note: {printData.remarks}</div>}
          </div>
        </div>
      )}

      {/* MAIN UI */}
      <div id="main-ui" className="flex flex-col h-full w-full bg-[#f8f6ff] relative overflow-hidden">
        <TopNavbar />

        <div className={`flex-1 flex flex-row items-start justify-center p-4 md:p-8 gap-4 md:gap-6 overflow-y-auto transition-all duration-300 ${showKeyboard ? 'pb-[280px]' : ''}`}>

          {/* LEFT: DROP FORM */}
          <div className="bg-white w-full flex-1 rounded-none border border-zinc-200 flex flex-col h-full shadow-sm">
            <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-[#3b2063] text-white rounded-none"><ArrowDownCircle size={18}/></div>
                 <h2 className="text-[#3b2063] font-black text-[11px] tracking-[0.3em] uppercase">Shift Cash Drop</h2>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-white border border-zinc-200">
                <span className="text-[9px] font-black uppercase text-black">Terminal 01</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
              <div className="grid grid-cols-12 gap-2 mb-4 px-2">
                <div className="col-span-4 text-[9px] font-black text-black uppercase tracking-widest">Denom</div>
                <div className="col-span-4 text-center text-[9px] font-black text-black uppercase tracking-widest">Qty</div>
                <div className="col-span-4 text-right text-[9px] font-black text-black uppercase tracking-widest">Subtotal</div>
              </div>

              <div className="space-y-1">
                {denominations.map((denom) => {
                  const qty = counts[denom] || '';
                  const rowTotal = denom * (parseFloat(qty) || 0);
                  return (
                    <div key={denom} className="grid grid-cols-12 gap-2 items-center px-2 py-1.5 border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                      <div className="col-span-4 flex items-center gap-2">
                        <Banknote size={14} className="text-black" />
                        <span className="font-black text-[#3b2063] text-sm tabular-nums">{denom.toLocaleString()}</span>
                      </div>
                      <div className="col-span-4">
                        <input
                          type="text"
                          inputMode="none"
                          value={qty}
                          onFocus={() => handleCountFocus(denom)}
                          onChange={(e) => handleInputChange(e.target.value)}
                          placeholder="0"
                          disabled={isEodLocked}
                          className={`w-full text-center font-black text-sm py-2 rounded-none border border-zinc-100 transition-all outline-none focus:border-[#3b2063] ${isEodLocked ? 'bg-zinc-50 cursor-not-allowed opacity-50' : 'bg-[#f8f6ff]'}`}
                        />
                      </div>
                      <div className="col-span-4 text-right font-black text-[#3b2063] text-sm tabular-nums opacity-60">
                        {rowTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-6 bg-zinc-50 border-t border-zinc-100 space-y-4">
              <div className="flex items-center justify-between bg-white border border-zinc-200 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black">Total Drop Amount</p>
                <p className="text-2xl font-black text-[#3b2063] tabular-nums">₱ {getGrandTotal(counts).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
              
              <div className="relative">
                <MessageSquare size={14} className="absolute left-4 top-4 text-black" />
                <textarea
                  value={remarks}
                  onFocus={handleRemarksFocus}
                  onChange={(e) => handleInputChange(e.target.value)}
                  placeholder="Drop remarks/notes..."
                  disabled={isEodLocked}
                  className={`w-full pl-10 pr-4 py-3 rounded-none border border-zinc-200 focus:border-[#3b2063] outline-none text-xs font-bold resize-none h-14 ${isEodLocked ? 'bg-zinc-100' : 'bg-white'}`}
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={isLoading || isEodLocked || getGrandTotal(counts) <= 0}
                className={`w-full py-4 rounded-none font-black uppercase tracking-[0.3em] text-xs shadow-lg transition-all flex items-center justify-center gap-3 ${isEodLocked ? 'bg-zinc-200 text-black cursor-not-allowed' : 'bg-[#3b2063] text-white hover:bg-[#2a1647] active:scale-[0.99]'}`}
              >
                {isLoading ? <RefreshCw className="animate-spin" size={16}/> : <CheckCircle2 size={16}/>}
                {isLoading ? 'Processing...' : isEodLocked ? 'Terminal Locked' : 'Execute Cash Drop'}
              </button>
            </div>
          </div>

          {/* RIGHT: HISTORY TABLE */}
          <div className="w-full flex-1 bg-white rounded-none border border-zinc-200 overflow-hidden h-full flex flex-col shadow-sm">
            <div className="px-6 py-5 border-b border-zinc-100 bg-[#f8f6ff] flex items-center gap-3">
              <HistoryIcon size={16} className="text-[#3b2063]" />
              <h3 className="text-[#3b2063] font-black text-[11px] uppercase tracking-[0.3em]">Transaction History</h3>
            </div>
            
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-white z-10 border-b border-zinc-100">
                  <tr>
                    <th className="px-6 py-4 text-[9px] font-black text-black uppercase tracking-widest">Time</th>
                    <th className="px-6 py-4 text-right text-[9px] font-black text-black uppercase tracking-widest">Amount</th>
                    <th className="px-6 py-4 text-center text-[9px] font-black text-black uppercase tracking-widest">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-zinc-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                           <Clock size={12} className="text-black" />
                           <span className="text-[11px] font-black text-[#3b2063] tabular-nums">{tx.time}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-black text-[#3b2063] text-right tabular-nums">₱{tx.total.toLocaleString()}</td>
                      <td className="px-6 py-4 text-center">
                        <button onClick={() => handlePrint(tx)} className="p-2.5 bg-zinc-50 border border-zinc-100 text-[#3b2063] hover:bg-[#3b2063] hover:text-white transition-all">
                          <Printer size={14} strokeWidth={2.5}/>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-20 text-center">
                        <HistoryIcon size={32} className="mx-auto text-zinc-100 mb-2" />
                        <p className="text-[10px] font-black uppercase text-black tracking-widest italic">No drops recorded today</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* KEYBOARD TOGGLE */}
        {!isEodLocked && (
          <button
            onClick={() => setShowKeyboard(prev => !prev)}
            className={`fixed bottom-6 right-6 z-[100] w-14 h-14 rounded-none shadow-2xl transition-all duration-300 flex items-center justify-center ${showKeyboard ? 'bg-red-600 text-white' : 'bg-[#3b2063] text-white'}`}
          >
            {showKeyboard ? <X size={24} /> : <Calculator size={24} />}
          </button>
        )}

        {/* KEYBOARD DRAWER */}
        <div className={`fixed bottom-0 left-0 right-0 bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.1)] transition-transform duration-500 z-[90] ${showKeyboard ? 'translate-y-0' : 'translate-y-full'}`}>
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between px-6 py-3 bg-zinc-50 border-b border-zinc-100">
              <span className="text-[10px] font-black text-black uppercase tracking-[0.3em]">{layoutName === 'numpad' ? 'Numeric Input' : 'Alphanumeric Input'}</span>
              <button onClick={() => setShowKeyboard(false)} className="text-[10px] font-black text-[#3b2063] uppercase tracking-widest hover:underline">Dismiss</button>
            </div>
            <div className="p-4 bg-white">
              <Keyboard
                keyboardRef={r => { if (r) keyboardRef.current = r; }}
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
      </div>
    </>
  );
};

// Helper components
const RefreshCw = ({ className, size }: { className?: string; size?: number }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M3 21v-5h5" />
  </svg>
);

export default CashDrop;
