"use client"

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { AxiosError } from 'axios';
import api from '../../../services/api';
import type { BackendTransaction, Transaction, CashDropProps } from '../../../types/transactions';
import TopNavbar from '../../Cashier/TopNavbar';
import { useToast } from '../../../context/ToastContext';
import { getCache, setCache } from '../../../utils/cache';
import { Banknote, History as HistoryIcon, Printer, MessageSquare, CheckCircle2, Clock, RefreshCw, Monitor, Wallet, AlertTriangle } from 'lucide-react';

const CACHE_KEY = 'cash-drop-history';
const CACHE_TTL = 5 * 60 * 1000;

const CashDrop: React.FC<CashDropProps> = ({ onSuccess }) => {
  const { dismissToast } = useToast();
  const denominations = [1000, 500, 200, 100, 50, 20, 10, 5, 1, 0.25];
  const phCurrency = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });

  const [counts, setCounts] = useState<{ [key: number]: string }>({});
  const [remarks, setRemarks] = useState('');
  const [isEodLocked, setIsEodLocked] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>(getCache<Transaction[]>(CACHE_KEY) ?? []);
  const [isLoading, setIsLoading] = useState(false);
  const [printData, setPrintData] = useState<Transaction | null>(null);

  const cashierName = useMemo(() =>
    localStorage.getItem('lucky_boba_user_name') || 'Staff'
  , []);

  const branchName = useMemo(() =>
    localStorage.getItem('lucky_boba_user_branch') || 'Main Branch'
  , []);

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
        date: new Date(tx.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
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
          date: now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
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

  const handlePrint = useCallback((tx: Transaction) => {
    setPrintData(tx);
    dismissToast();
    setTimeout(() => {
      window.print();
      setPrintData(null);
    }, 300);
  }, [dismissToast]);

  const grandTotal = getGrandTotal(counts);

  return (
    <>
      <style>{`
        .printable-receipt { display: none; }
        @media print {
          @page { size: 80mm auto; margin: 0; }
          html, body { background: white !important; margin: 0 !important; padding: 0 !important; }
          #main-ui { display: none !important; }
          [role="alert"],
          [aria-live],
          .toast,
          .toaster,
          [data-sonner-toaster],
          [data-radix-toast-viewport] { display: none !important; }
          .printable-receipt {
            display: block !important; position: absolute !important; left: 0 !important; top: 0 !important;
            width: 80mm !important; padding: 5mm !important; background: white !important; color: black !important;
            font-family: 'Courier New', monospace;
          }
          .printable-receipt * { visibility: visible !important; }
          .receipt-divider { border-top: 1px dashed #000 !important; margin: 8px 0; width: 100%; }
          .flex-between { display: flex !important; justify-content: space-between !important; width: 100%; }
        }
        .receipt-divider { border-top: 1px dashed #000; margin: 8px 0; width: 100%; }
        .flex-between { display: flex; justify-content: space-between; width: 100%; }
      `}</style>

      {/* PRINTABLE RECEIPT */}
      {printData && (
        <div className="printable-receipt text-slate-800">
          <div className="text-center space-y-1">
            <h1 className="font-black text-[17px] uppercase leading-tight">Lucky Boba Food and Beverage Trading</h1>
            <p className="text-[13px] uppercase font-bold">{branchName}</p>
            <div className="receipt-divider" />
            <h2 className="font-black text-[14px] uppercase tracking-widest">Cash Drop Receipt</h2>
            <div className="text-left text-[13px] space-y-0.5 mt-2 uppercase">
              <div className="flex-between"><span>Date</span><span>{printData.date}</span></div>
              <div className="flex-between"><span>Time</span><span>{printData.time}</span></div>
              <div className="flex-between"><span>Terminal</span><span>POS-01</span></div>
              <div className="flex-between"><span>Cashier</span><span>{cashierName}</span></div>
            </div>
          </div>

          {/* Denomination breakdown */}
          <div className="mt-2">
            <div className="receipt-divider" />
            <p className="text-[15px] font-black uppercase tracking-widest mb-1">Denomination Breakdown</p>
            {denominations.map(denom => {
              const qty = parseFloat(printData.breakdown[denom] || '0') || 0;
              return (
                <div key={denom} className="flex-between text-[18px]" style={{ lineHeight: '1.7' }}>
                  <span>₱{denom.toLocaleString()}</span>
                  <span>x{qty}</span>
                  <span className="font-bold">₱{(qty * denom).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-2">
            <div className="receipt-divider" />
            <div className="flex-between" style={{ paddingTop: 4, paddingBottom: 4 }}>
              <span className="text-[13px] font-black uppercase tracking-widest">Total Amount</span>
              <span className="text-[18px] font-black">{phCurrency.format(printData.total)}</span>
            </div>
            <div className="receipt-divider" />
            {printData.remarks && printData.remarks !== '-' && (
              <div className="mt-2 px-2 italic text-[11px] text-center">
                Note: {printData.remarks}
              </div>
            )}
          </div>

          <div className="mt-10 text-center">
            <p className="text-[12px] font-bold uppercase underline underline-offset-4">{cashierName}</p>
            <p className="text-[11px] uppercase tracking-widest mt-1">Prepared By</p>
          </div>
          <div className="mt-6 text-center">
            <p className="text-[12px] font-bold uppercase">____________________</p>
            <p className="text-[11px] uppercase tracking-widest mt-1">Signed By</p>
          </div>
        </div>
      )}

      {/* MAIN UI */}
      <div id="main-ui" className="flex flex-col h-full w-full bg-[#f4f2fb] relative overflow-hidden">
        <TopNavbar />

        <div className="flex-1 flex flex-row items-start justify-center p-5 md:p-7 gap-5 overflow-y-auto transition-all duration-300">

          {/* ── LEFT: Drop Form ── */}
          <div className="bg-white w-full flex-1 border border-[#e9d5ff] flex flex-col h-full shadow-sm rounded-[0.625rem]">

            {/* Card Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#e9d5ff]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#7c14d4] flex items-center justify-center">
                  <Wallet size={17} className="text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-black">Point of Sale</p>
                  <h2 className="text-sm font-bold text-black uppercase tracking-widest">Shift Cash Drop</h2>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#f5f0ff] border border-[#e9d5ff]">
                <Monitor size={12} className="text-[#7c14d4]" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-black">Terminal 01</span>
              </div>
            </div>

            {/* Denomination Grid */}
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-12 gap-2 px-6 py-3 border-b border-[#e9d5ff] bg-[#f5f0ff]">
                <div className="col-span-4 text-[10px] font-bold text-black uppercase tracking-widest">Denomination</div>
                <div className="col-span-4 text-center text-[10px] font-bold text-black uppercase tracking-widest">Qty</div>
                <div className="col-span-4 text-right text-[10px] font-bold text-black uppercase tracking-widest">Subtotal</div>
              </div>

              <div className="divide-y divide-[#e9d5ff]">
                {denominations.map((denom) => {
                  const qty = counts[denom] || '';
                  const rowTotal = denom * (parseFloat(qty) || 0);
                  return (
                    <div key={denom} className="grid grid-cols-12 gap-3 items-center px-6 py-3 transition-colors hover:bg-[#f5f0ff] focus-within:bg-[#f4f2fb]">
                      <div className="col-span-4 flex items-center gap-2">
                        <Banknote size={15} className="text-[#7c14d4] shrink-0" />
                        <span className="font-bold text-black text-sm tabular-nums">₱{denom.toLocaleString()}</span>
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
                              ? 'bg-[#f5f0ff] border-[#e9d5ff] cursor-not-allowed text-[#7c14d4]/50'
                              : 'bg-white border-[#e9d5ff] focus:border-[#7c14d4]'
                          }`}
                        />
                      </div>
                      <div className={`col-span-4 text-right font-bold text-sm tabular-nums ${rowTotal > 0 ? 'text-[#7c14d4]' : 'text-[#7c14d4]/30'}`}>
                        {rowTotal > 0 ? `₱${rowTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-[#e9d5ff] space-y-4 bg-white">
              <div className="flex items-center justify-between bg-[#f5f0ff] border border-[#e9d5ff] px-5 py-4">
                <p className="text-sm font-bold uppercase tracking-widest text-black">Total Drop Amount</p>
                <p className={`text-2xl font-bold tabular-nums ${grandTotal > 0 ? 'text-[#7c14d4]' : 'text-[#7c14d4]/30'}`}>
                  ₱{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="relative">
                <MessageSquare size={14} className="absolute left-4 top-3.5 text-[#7c14d4]" />
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Drop remarks / notes (optional)..."
                  disabled={isEodLocked}
                  className={`w-full pl-10 pr-4 py-3 border outline-none text-sm font-medium resize-none h-14 transition-all ${
                    isEodLocked ? 'bg-[#f5f0ff] border-[#e9d5ff] text-[#7c14d4]/50' : 'bg-white border-[#e9d5ff] focus:border-[#7c14d4]'
                  }`}
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={isLoading || isEodLocked || grandTotal <= 0}
                className={`w-full py-4 font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all rounded-[0.625rem] ${
                  isEodLocked
                    ? 'bg-[#f5f0ff] border-[#e9d5ff] text-[#7c14d4]/50 cursor-not-allowed'
                    : 'bg-[#7c14d4] hover:bg-[#6a12b8] text-white active:scale-[0.99] disabled:opacity-50'
                }`}
              >
                {isLoading
                  ? <><RefreshCw size={16} className="animate-spin" /> Processing...</>
                  : isEodLocked
                  ? <><AlertTriangle size={16} /> Terminal Closed</>
                  : <><CheckCircle2 size={16} /> Execute Cash Drop</>
                }
              </button>
            </div>
          </div>

          {/* ── RIGHT: History ── */}
          <div className="w-full flex-1 bg-white border border-[#e9d5ff] overflow-hidden flex flex-col shadow-sm rounded-[0.625rem]" style={{ minHeight: 0 }}>
            <div className="px-6 py-5 border-b border-[#e9d5ff] flex items-center gap-3">
              <div className="w-9 h-9 bg-[#f5f0ff] border border-[#e9d5ff] flex items-center justify-center">
                <HistoryIcon size={17} className="text-[#7c14d4]" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-black">Today</p>
                <h3 className="text-sm font-bold text-black uppercase tracking-widest">Transaction History</h3>
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-white z-10 border-b border-[#e9d5ff]">
                  <tr>
                    <th className="px-6 py-3 text-[10px] font-bold text-black uppercase tracking-widest">Time</th>
                    <th className="px-6 py-3 text-right text-[10px] font-bold text-black uppercase tracking-widest">Amount</th>
                    <th className="px-6 py-3 text-center text-[10px] font-bold text-black uppercase tracking-widest">Print</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e9d5ff]">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-[#f5f0ff] transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2">
                          <Clock size={13} className="text-[#7c14d4] shrink-0" />
                          <span className="text-sm font-bold text-black tabular-nums">{tx.time}</span>
                        </div>
                        {tx.remarks !== '-' && (
                          <p className="text-[11px] text-[#7c14d4]/60 font-medium mt-0.5 ml-5 truncate max-w-40">{tx.remarks}</p>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <span className="text-sm font-bold text-[#7c14d4] tabular-nums">
                          ₱{tx.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <button
                          onClick={() => handlePrint(tx)}
                          className="w-9 h-9 inline-flex items-center justify-center bg-[#f5f0ff] border border-[#e9d5ff] text-[#7c14d4] hover:bg-[#7c14d4] hover:text-white hover:border-[#7c14d4] transition-all rounded-[0.625rem]"
                        >
                          <Printer size={14} strokeWidth={2} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-20 text-center">
                        <HistoryIcon size={28} className="mx-auto text-[#7c14d4]/30 mb-3" />
                        <p className="text-[11px] font-bold uppercase tracking-widest text-[#7c14d4]/30">No drops recorded today</p>
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