"use client"

import React, { useState, useEffect } from 'react';
import type { AxiosError } from 'axios';
import api from '../../../services/api';
import type { BackendTransaction, Transaction, CashDropProps } from '../../../types/transactions';
import TopNavbar from '../TopNavbar';
import { getCache, setCache } from '../../../utils/cache';
import { Banknote, History as HistoryIcon, Printer, MessageSquare, ArrowDownCircle, CheckCircle2, Clock, RefreshCw } from 'lucide-react';

const CACHE_KEY = 'cash-drop-history';
const CACHE_TTL = 5 * 60 * 1000;

const CashDrop: React.FC<CashDropProps> = ({ onSuccess }) => {
  const denominations = [1000, 500, 200, 100, 50, 20, 10, 5, 1, 0.25];
  const [counts, setCounts] = useState<{ [key: number]: string }>({});
  const [remarks, setRemarks] = useState('');
  const [isEodLocked, setIsEodLocked] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>(getCache<Transaction[]>(CACHE_KEY) ?? []);
  const [isLoading, setIsLoading] = useState(false);
  const [printData, setPrintData] = useState<Transaction | null>(null);

  useEffect(() => {
    void (async () => { await fetchTodaysDrops(); })();
    checkEodStatus();
  }, []);

  const checkEodStatus = async () => {
    try {
      const response = await api.get<{ isEodDone: boolean }>('/cash-counts/status');
      setIsEodLocked(response.data.isEodDone);
    } catch (error) { console.error("Failed to check EOD status:", error); }
  };

  const fetchTodaysDrops = async () => {
    if (getCache<Transaction[]>(CACHE_KEY)) return;
    try {
      const response = await api.get<BackendTransaction[]>('/cash-transactions', {
        params: { type: 'cash_drop', date: new Date().toISOString().split('T')[0] }
      });
      const mappedData: Transaction[] = response.data.map(tx => ({
        id: tx.id,
        time: new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date(tx.created_at).toLocaleDateString(),
        total: parseFloat(tx.amount),
        remarks: tx.note || '-',
        breakdown: {}
      }));
      setCache<Transaction[]>(CACHE_KEY, mappedData, CACHE_TTL);
      setTransactions(mappedData);
    } catch (error) { console.error("Failed to fetch history:", error); }
  };

  const getGrandTotal = (c: { [key: number]: string }) =>
    denominations.reduce((sum, d) => sum + d * (parseFloat(c[d] || '0') || 0), 0);

  const handleSubmit = async () => {
    const total = getGrandTotal(counts);
    if (total <= 0 || isLoading || isEodLocked) return;
    setIsLoading(true);

    const breakdownString = denominations
      .filter(d => counts[d] && parseFloat(counts[d]) > 0)
      .map(d => `${d}x${counts[d]}`).join(', ');

    try {
      const response = await api.post('/cash-transactions', {
        type: 'cash_drop', amount: total,
        note: `Drop Breakdown: ${breakdownString}${remarks ? ` | Remarks: ${remarks}` : ''}`
      });

      if (response.data.success) {
        const now = new Date();
        const newTx: Transaction = {
          id: response.data.data.id,
          date: now.toLocaleDateString(),
          time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          total, remarks: remarks || '-', breakdown: { ...counts }
        };
        const updatedHistory = [newTx, ...transactions];
        setTransactions(updatedHistory);
        setCache<Transaction[]>(CACHE_KEY, updatedHistory, CACHE_TTL);
        setCounts({}); 
        setRemarks(''); 
        if (onSuccess) onSuccess();
        handlePrint(newTx);
      }
    } catch (err: unknown) {
      const axiosError = err as AxiosError<{ message?: string }>;
      alert(axiosError.response?.data?.message || "Failed to record Cash Drop.");
    } finally { setIsLoading(false); }
  };

  const handlePrint = (tx: Transaction) => {
    setPrintData(tx);
    setTimeout(() => { window.print(); setPrintData(null); }, 150);
  };

  const grandTotal = getGrandTotal(counts);

  return (
    <>
      <style>{`
        .printable-receipt { display: none; }
        @media print {
          @page { size: 80mm auto; margin: 0 !important; }
          html, body { margin: 0 !important; padding: 0 !important; background: white !important; }
          body * { visibility: hidden; }
          .printable-receipt, .printable-receipt * { visibility: visible !important; }
          .printable-receipt { display: block !important; position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; max-width: 76mm !important; }
          .receipt-area { width: 66mm !important; margin: 0 auto !important; padding: 3mm 0 15mm 0 !important; font-family: Arial, sans-serif !important; font-size: 11px !important; }
        }
      `}</style>

      {/* PRINTABLE RECEIPT */}
      {printData && (
        <div className="printable-receipt">
          <div className="receipt-area">
            <div style={{ textAlign: 'center', marginBottom: 6 }}>
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
      <div id="main-ui" className="flex flex-col h-full w-full bg-[#f4f2fb] relative overflow-hidden">
        <TopNavbar />

        <div className="flex-1 flex flex-row items-start justify-center p-5 md:p-7 gap-5 overflow-y-auto transition-all duration-300">

          {/* ── LEFT: Drop Form ── */}
          <div className="bg-white w-full flex-1 border border-zinc-200 flex flex-col h-full shadow-sm rounded-[0.625rem]">

            {/* Card Header */}
            <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#3b2063] flex items-center justify-center">
                  <ArrowDownCircle size={17} className="text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Point of Sale</p>
                  <h2 className="text-sm font-bold text-[#1a0f2e] uppercase tracking-widest">Shift Cash Drop</h2>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-50 border border-zinc-200">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Terminal 01</span>
              </div>
            </div>

            {/* Denomination Grid */}
            <div className="flex-1 overflow-y-auto">
              {/* Column Headers */}
              <div className="grid grid-cols-12 gap-2 px-6 py-3 border-b border-zinc-100 bg-zinc-50">
                <div className="col-span-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Denomination</div>
                <div className="col-span-4 text-center text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Qty</div>
                <div className="col-span-4 text-right text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Subtotal</div>
              </div>

              <div className="divide-y divide-zinc-100">
                {denominations.map((denom) => {
                  const qty = counts[denom] || '';
                  const rowTotal = denom * (parseFloat(qty) || 0);
                  return (
                    <div key={denom} className="grid grid-cols-12 gap-3 items-center px-6 py-3 transition-colors hover:bg-zinc-50 focus-within:bg-[#f4f2fb]">
                      <div className="col-span-4 flex items-center gap-2">
                        <Banknote size={15} className="text-zinc-400 shrink-0" />
                        <span className="font-bold text-[#1a0f2e] text-sm tabular-nums">
                          ₱{denom.toLocaleString()}
                        </span>
                      </div>
                      <div className="col-span-4">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={qty}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9.]/g, '');
                            setCounts(prev => ({ ...prev, [denom]: val }));
                          }}
                          placeholder="0"
                          disabled={isEodLocked}
                          className={`w-full text-center font-bold text-sm py-2 border outline-none transition-all ${
                            isEodLocked
                              ? 'bg-zinc-50 border-zinc-100 cursor-not-allowed text-zinc-300'
                              : 'bg-[#f4f2fb] border-transparent focus:border-[#3b2063] focus:bg-white'
                          }`}
                        />
                      </div>
                      <div className={`col-span-4 text-right font-bold text-sm tabular-nums ${rowTotal > 0 ? 'text-[#3b2063]' : 'text-zinc-300'}`}>
                        {rowTotal > 0 ? `₱${rowTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer: Total + Remarks + Submit */}
            <div className="p-6 border-t border-zinc-100 space-y-4 bg-white">
              {/* Grand Total */}
              <div className="flex items-center justify-between bg-[#f4f2fb] border border-violet-100 px-5 py-4">
                <p className="text-sm font-bold uppercase tracking-widest text-zinc-600">Total Drop Amount</p>
                <p className={`text-2xl font-bold tabular-nums ${grandTotal > 0 ? 'text-[#3b2063]' : 'text-zinc-300'}`}>
                  ₱{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>

              {/* Remarks */}
              <div className="relative">
                <MessageSquare size={14} className="absolute left-4 top-3.5 text-zinc-400" />
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Drop remarks / notes (optional)..."
                  disabled={isEodLocked}
                  className={`w-full pl-10 pr-4 py-3 border outline-none text-sm font-medium resize-none h-14 transition-all ${
                    isEodLocked ? 'bg-zinc-50 border-zinc-100 text-zinc-300' : 'bg-white border-zinc-200 focus:border-[#3b2063]'
                  }`}
                />
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={isLoading || isEodLocked || grandTotal <= 0}
                className={`w-full py-4 font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all rounded-[0.625rem] ${
                  isEodLocked
                    ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                    : 'bg-[#3b2063] hover:bg-[#2a1647] text-white active:scale-[0.99] disabled:opacity-50'
                }`}
              >
                {isLoading
                  ? <><RefreshCw size={16} className="animate-spin" /> Processing...</>
                  : isEodLocked
                  ? 'Terminal Locked'
                  : <><CheckCircle2 size={16} /> Execute Cash Drop</>
                }
              </button>
            </div>
          </div>

          {/* ── RIGHT: History ── */}
          <div className="w-full flex-1 bg-white border border-zinc-200 overflow-hidden flex flex-col shadow-sm rounded-[0.625rem]" style={{ minHeight: 0 }}>
            <div className="px-6 py-5 border-b border-zinc-100 flex items-center gap-3">
              <div className="w-9 h-9 bg-zinc-50 border border-zinc-200 flex items-center justify-center">
                <HistoryIcon size={17} className="text-violet-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Today</p>
                <h3 className="text-sm font-bold text-[#1a0f2e] uppercase tracking-widest">Transaction History</h3>
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-white z-10 border-b border-zinc-100">
                  <tr>
                    <th className="px-6 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Time</th>
                    <th className="px-6 py-3 text-right text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Amount</th>
                    <th className="px-6 py-3 text-center text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Print</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2">
                          <Clock size={13} className="text-zinc-400 shrink-0" />
                          <span className="text-sm font-bold text-[#1a0f2e] tabular-nums">{tx.time}</span>
                        </div>
                        {tx.remarks !== '-' && (
                          <p className="text-[11px] text-zinc-400 font-medium mt-0.5 ml-5 truncate max-w-40">{tx.remarks}</p>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <span className="text-sm font-bold text-[#3b2063] tabular-nums">
                          ₱{tx.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <button
                          onClick={() => handlePrint(tx)}
                          className="w-9 h-9 inline-flex items-center justify-center bg-zinc-50 border border-zinc-200 text-zinc-500 hover:bg-[#3b2063] hover:text-white hover:border-[#3b2063] transition-all rounded-[0.625rem]"
                        >
                          <Printer size={14} strokeWidth={2} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-20 text-center">
                        <HistoryIcon size={28} className="mx-auto text-zinc-200 mb-3" />
                        <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-300">No drops recorded today</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CashDrop;