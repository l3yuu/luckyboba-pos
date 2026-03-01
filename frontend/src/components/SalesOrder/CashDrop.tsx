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
  };

  const handleRemarksFocus = () => {
    if (isEodLocked) return;
    setActiveInput({ type: 'remarks' });
    setLayoutName('default');
    if (keyboardRef.current) keyboardRef.current.setInput(remarks);
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
          /* SCREEN: hide receipt */
          .printable-receipt { display: none; }

          @media print {
            @page {
              size: 80mm auto;
              margin: 0 !important;
            }

            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
            }

            body * { visibility: hidden; }
            nav, header, aside, button, #main-ui, .print\\:hidden { display: none !important; }

            .printable-receipt,
            .printable-receipt * { visibility: visible !important; }

            /* Outer wrapper — full page width, capped at 76mm */
            .printable-receipt {
              display: block !important;
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              max-width: 76mm !important;
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
            }

            /* Inner content — centered at 66mm, same as sales order .receipt-area */
            .receipt-area {
              width: 66mm !important;
              margin: 0 auto !important;
              padding: 3mm 0 15mm 0 !important;
              box-sizing: border-box !important;
              background: white !important;
              color: #000 !important;
              font-family: Arial, Helvetica, sans-serif !important;
              font-size: 11px !important;
              line-height: 1.35 !important;
            }

            .receipt-area * {
              font-family: Arial, Helvetica, sans-serif !important;
              color: #000 !important;
              box-sizing: border-box !important;
            }

            /* Layout helpers */
            .rp-center { text-align: center !important; }
            .rp-left   { text-align: left !important; }
            .rp-right  { text-align: right !important; }

            .rp-divider {
              display: block !important;
              border: none !important;
              border-top: 1px dashed #000 !important;
              margin: 6px 0 !important;
              width: 100% !important;
            }

            .rp-row {
              display: flex !important;
              justify-content: space-between !important;
              align-items: baseline !important;
              width: 100% !important;
              font-size: 11px !important;
              padding: 1px 0 !important;
              text-transform: uppercase !important;
            }

            .rp-total {
              display: flex !important;
              justify-content: space-between !important;
              align-items: center !important;
              width: 100% !important;
              font-size: 12px !important;
              font-weight: 900 !important;
              padding: 4px 0 !important;
              border-top: 1px solid #000 !important;
              margin-top: 4px !important;
            }

            .rp-sig-block {
              margin-top: 40px !important;
              display: flex !important;
              flex-direction: column !important;
              gap: 28px !important;
              text-align: center !important;
            }

            p, div, tr, td, th, span {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }

            table {
              width: 100% !important;
              border-collapse: collapse !important;
              table-layout: fixed !important;
            }
            td {
              padding: 2px 0 !important;
              vertical-align: top !important;
              font-size: 11px !important;
              word-wrap: break-word !important;
              color: #000 !important;
            }
          }
        `}
      </style>

      {/* RECEIPT — only rendered when printData is set, only visible on print */}
      {printData && (
        <div className="printable-receipt">
          <div className="receipt-area">

            {/* Store header */}
            <div className="rp-center" style={{ marginBottom: 6 }}>
              <div style={{ fontWeight: 900, fontSize: 13, textTransform: 'uppercase', lineHeight: 1.2 }}>
                Lucky Boba Milktea Food and Beverage Trading
              </div>
              <div style={{ fontWeight: 700, fontSize: 10, textTransform: 'uppercase', marginTop: 2 }}>
                Main Branch - QC
              </div>
            </div>

            <div className="rp-divider" />

            <div className="rp-center" style={{ marginBottom: 6 }}>
              <div style={{ fontWeight: 900, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Cash Drop Receipt
              </div>
            </div>

            {/* Date / Time / Terminal */}
            <div style={{ marginBottom: 4 }}>
              <div className="rp-row"><span>Date</span><span>{printData.date}</span></div>
              <div className="rp-row"><span>Time</span><span>{printData.time}</span></div>
              <div className="rp-row"><span>Terminal</span><span>POS-01</span></div>
            </div>

            <div className="rp-divider" />

            {/* Breakdown label */}
            <div style={{ fontWeight: 900, fontSize: 10, textTransform: 'uppercase', opacity: 0.6, letterSpacing: '-0.02em', marginBottom: 4 }}>
              Details Breakdown
            </div>

            {/* Breakdown table */}
            <table>
              <tbody>
                {denominations.map(denom => {
                  const qty = parseFloat(printData.breakdown[denom] || '0');
                  if (qty <= 0) return null;
                  const label = denom < 1
                    ? denom.toString().replace('0.', '.')
                    : denom.toLocaleString();
                  return (
                    <tr key={denom}>
                      <td style={{ textTransform: 'uppercase' }}>{label}</td>
                      <td style={{ textAlign: 'center' }}>x{qty}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>
                        ₱{(qty * denom).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="rp-divider" />

            {/* Grand total */}
            <div className="rp-total">
              <span>GRAND TOTAL</span>
              <span>₱{printData.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>

            {/* Remarks */}
            {printData.remarks !== '-' && (
              <div style={{
                marginTop: 8,
                fontSize: 11,
                fontStyle: 'italic',
                textTransform: 'uppercase',
                borderTop: '1px dotted #000',
                paddingTop: 6,
                color: '#444'
              }}>
                Note: {printData.remarks}
              </div>
            )}

            {/* Signatures */}
            <div className="rp-sig-block">
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', textDecoration: 'underline' }}>
                  {localStorage.getItem('user')
                    ? JSON.parse(localStorage.getItem('user')!).name
                    : 'System Admin'}
                </div>
                <div style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 3 }}>
                  Prepared By
                </div>
              </div>
              <div>
                <div style={{ fontSize: 9 }}>____________________</div>
                <div style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 3 }}>
                  Received By (Auditor)
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MAIN UI */}
      <div id="main-ui" className="flex flex-col h-full w-full bg-[#f8f6ff] animate-in fade-in zoom-in duration-300 relative overflow-hidden">
        <TopNavbar />

        <div className={`flex-1 flex flex-row items-start justify-center p-6 gap-6 overflow-y-auto transition-all duration-300 ${showKeyboard ? 'pb-87.5' : ''}`}>

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
                        disabled={isEodLocked}
                        className={`w-full text-center font-bold text-lg py-2 rounded-xl border-2 border-zinc-100 focus:border-[#3b2063] ${isEodLocked ? 'bg-zinc-50 cursor-not-allowed opacity-50' : 'bg-[#f8f6ff]'}`}
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
                    placeholder={isEodLocked ? "Terminal Locked" : "Enter notes..."}
                    disabled={isEodLocked}
                    className={`w-full p-4 rounded-2xl border-2 border-zinc-100 focus:border-[#3b2063] resize-none h-16 ${isEodLocked ? 'bg-zinc-50 cursor-not-allowed opacity-50' : 'bg-[#f8f6ff]'}`}
                  />
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={isLoading || isEodLocked}
                  className={`w-full py-5 rounded-3xl font-black uppercase tracking-widest shadow-lg active:scale-95 transition-transform ${isEodLocked ? 'bg-zinc-300 text-zinc-500 cursor-not-allowed' : 'bg-[#3b2063] text-white'}`}
                >
                  {isLoading ? 'SUBMITTING...' : isEodLocked ? 'TERMINAL LOCKED' : 'SUBMIT CASH DROP'}
                </button>
              </div>
            </div>
          </div>

          {/* History table */}
          <div className="w-full flex-1 bg-white rounded-4xl shadow-sm border border-zinc-200 overflow-hidden h-full flex flex-col">
            <div className="px-8 py-5 border-b border-zinc-100 bg-zinc-50">
              <h3 className="text-[#3b2063] font-black text-xs uppercase">Drop History (Today)</h3>
            </div>
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
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18" />
                          </svg>
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

        {/* Keyboard toggle */}
        <button
          onClick={() => !isEodLocked && setShowKeyboard(prev => !prev)}
          className={`fixed bottom-8 right-8 z-60 p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 ${isEodLocked ? 'bg-zinc-300 cursor-not-allowed' : (showKeyboard ? 'bg-red-500 text-white' : 'bg-[#3b2063] text-white')}`}
        >
          {showKeyboard ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5" /></svg>
          )}
        </button>

        <div className={`fixed bottom-0 left-0 right-0 bg-white shadow-2xl transition-transform duration-300 z-50 ${showKeyboard ? 'translate-y-0' : 'translate-y-full'}`}>
          <div className="flex items-center justify-between px-4 py-2 bg-zinc-50 border-b">
            <span className="text-xs font-bold text-zinc-400 uppercase">{layoutName === 'numpad' ? 'Numpad' : 'Keyboard'}</span>
            <button onClick={() => setShowKeyboard(false)} className="text-xs font-black text-[#3b2063] uppercase p-4">Close</button>
          </div>
          <div className="p-2">
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
    </>
  );
};

export default CashDrop;