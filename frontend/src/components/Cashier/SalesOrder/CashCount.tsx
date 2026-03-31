"use client"

import React, { useState, useEffect, useMemo } from 'react';
import type { Transaction } from '../../../types/cash-count';
import api from '../../../services/api';
import TopNavbar from '../../Cashier/TopNavbar';
import { useToast } from '../../../hooks/useToast';
import { Calculator, Printer, CheckCircle2, Lock, AlertTriangle, MessageSquare, RefreshCw, Banknote } from 'lucide-react';

interface CashCountProps {
  onSuccess?: () => void;
}

const CashCount: React.FC<CashCountProps> = ({ onSuccess }) => {
  const { showToast } = useToast();
  const denominations = [1000, 500, 200, 100, 50, 20, 10, 5, 1, 0.25];

  const [counts, setCounts] = useState<{ [key: number]: string }>({});
  const [remarks, setRemarks] = useState('');
  const [latestTx, setLatestTx] = useState<Transaction | null>(null);
  const [printData, setPrintData] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEodLocked, setIsEodLocked] = useState(false);
  const branchName = useMemo(() => {
    return localStorage.getItem('lucky_boba_user_branch') || 'MAIN BRANCH – QC';
  }, []);


  useEffect(() => { checkEodStatus(); }, []);

  const checkEodStatus = async () => {
    try {
      const response = await api.get<{ isEodDone: boolean }>('/cash-counts/status');
      setIsEodLocked(response.data.isEodDone);
      if (response.data.isEodDone) localStorage.setItem('terminal_eod_locked', 'true');
    } catch (error) { console.error("Failed to check EOD status:", error); }
  };

  const getGrandTotal = (c: { [key: number]: string }) =>
    denominations.reduce((total, denom) => total + denom * (parseFloat(c[denom] || '0') || 0), 0);

const handleSubmit = async () => {
    const total = getGrandTotal(counts);
    if (total <= 0 || isEodLocked) {
      showToast(isEodLocked ? "Terminal is already locked." : "Please enter a valid cash count.", "warning");
      return;
    }
    setIsLoading(true);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const finalRemarks = `${days[new Date().getDay()]} EOD${remarks ? ' - ' + remarks : ''}`;
    try {
      const response = await api.post('/cash-counts', { total, breakdown: counts, remarks: finalRemarks });
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
          total, remarks: finalRemarks, breakdown: { ...counts }
        };
        setLatestTx(newTx);
        // ── DO NOT call onSuccess here — wait for user to dismiss ──
        showToast("EOD Submitted. Terminal is now LOCKED.", "success");
      }
    } catch (error) {
      console.error("Submission failed:", error);
      showToast("Failed to save to database.", "error");
    } finally { setIsLoading(false); }
  };

  const handlePrint = () => {
    if (!latestTx) return;
    setPrintData(latestTx);
    setTimeout(() => { window.print(); setPrintData(null); }, 150);
  };

  const handleNewCount = () => {
    if (isEodLocked) { showToast("Cannot start new count. Day is already finalized.", "error"); return; }
    setLatestTx(null); 
    setCounts({}); 
    setRemarks('');
  };

  const grandTotal = getGrandTotal(counts);

  return (
    <>
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center bg-white/90 backdrop-blur-sm">
          <div className="bg-white px-12 py-10 border border-[#e9d5ff] flex flex-col items-center gap-5 shadow-2xl rounded-[0.625rem]">
            <RefreshCw className="w-10 h-10 text-[#3b2063] animate-spin" strokeWidth={1.5} />
            <div className="text-center">
              <p className="text-sm font-bold text-black uppercase tracking-widest">Terminal Syncing</p>
              <p className="text-[11px] font-medium text-zinc-400 mt-1">Finalizing End of Day Journal...</p>
            </div>
          </div>
        </div>
      )}
    <style>{`
      .printable-receipt { display: none; }
      @media print {
        @page { size: 80mm auto; margin: 0; }
        body * { visibility: hidden; }
        .printable-receipt, .printable-receipt * { visibility: visible; }
        .printable-receipt {
          display: block !important;
          position: absolute !important; left: 0 !important; top: 0 !important;
          width: 80mm !important; padding: 5mm !important;
          background: white !important; color: black !important;
          font-family: 'Courier New', monospace;
        }
        .receipt-divider { border-top: 1px dashed #000 !important; margin: 8px 0; width: 100%; }
        .flex-between { display: flex !important; justify-content: space-between !important; width: 100%; }
      }
      .receipt-divider { border-top: 1px dashed #000; margin: 8px 0; width: 100%; }
      .flex-between { display: flex; justify-content: space-between; width: 100%; }
    `}</style>

{printData && (
  <div className="printable-receipt text-slate-800">
    <div className="text-center space-y-1">
      <h1 className="font-black text-[17px] uppercase leading-tight">
        Lucky Boba Milktea<br />Food and Beverage Trading
      </h1>
      <p className="text-[13px] uppercase font-bold">{branchName.toUpperCase()}</p>
      <div className="receipt-divider" />
      <h2 className="font-black text-[14px] uppercase tracking-widest">EOD Cash Count</h2>
    </div>

    <div className="text-left text-[13px] space-y-0.5 mt-2 uppercase">
      <div className="flex-between"><span>Date</span><span>{printData.date}</span></div>
      <div className="flex-between"><span>Time</span><span>{printData.time}</span></div>
      <div className="flex-between"><span>Terminal</span><span>POS-01</span></div>
      <div className="flex-between"><span>Cashier</span><span>{localStorage.getItem('lucky_boba_user_name') || 'Staff'}</span></div>
      {printData.remarks && (
        <div className="flex-between"><span>Remarks</span><span>{printData.remarks}</span></div>
      )}
    </div>

    <div className="mt-2">
      <div className="receipt-divider" />
      <p className="text-[15px] font-black uppercase tracking-widest mb-1">Denomination Breakdown</p>
      {denominations.map(denom => {
        const qtyString = printData.breakdown[denom] || '0';
        const qty = parseFloat(qtyString);
        const label = denom === 0.25 ? '₱0.25' : `₱${denom.toLocaleString()}`;
        return (
          <div key={denom} className="flex-between text-[18px]" style={{ lineHeight: '1.7' }}>
            <span>{label}</span>
            <span>x{qty || 0}</span>
            <span className="font-bold">₱{(qty * denom).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        );
      })}
    </div>

    <div className="mt-2">
      <div className="receipt-divider" />
      <div className="flex-between" style={{ paddingTop: 4, paddingBottom: 4 }}>
        <span className="text-[13px] font-black uppercase tracking-widest">Total Count</span>
        <span className="text-[18px] font-black">₱{printData.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
      </div>
      <div className="receipt-divider" />
    </div>

    <div className="mt-10 text-center">
      <p className="text-[12px] font-bold uppercase underline underline-offset-4">
        {localStorage.getItem('lucky_boba_user_name') || 'Staff'}
      </p>
      <p className="text-[11px] uppercase tracking-widest mt-1">Prepared By</p>
    </div>
    <div className="mt-6 text-center">
      <p className="text-[12px] font-bold uppercase">____________________</p>
      <p className="text-[11px] uppercase tracking-widest mt-1">Signed By</p>
    </div>
  </div>
)}

      <div className="flex flex-col h-full w-full bg-[#f4f2fb] relative overflow-hidden">
        <TopNavbar isEodLocked={isEodLocked} />

        <div className="flex-1 flex flex-row items-start justify-center p-5 md:p-7 gap-5 overflow-y-auto transition-all duration-300">

          {/* ── LEFT: Counting Form ── */}
          <div className="bg-white w-full flex-1 border border-zinc-200 flex flex-col relative shadow-sm rounded-[0.625rem]" style={{ minHeight: 0 }}>

            {/* Card Header */}
            <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#3b2063] flex items-center justify-center">
                  <Calculator size={17} className="text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">End of Day</p>
                  <h2 className="text-sm font-bold text-black uppercase tracking-widest">Shift Reconciliation</h2>
                </div>
              </div>
              {isEodLocked && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 text-red-600">
                  <Lock size={11} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Locked</span>
                </div>
              )}
            </div>

            {/* EOD Locked Overlay */}
            {isEodLocked && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] z-20 flex items-center justify-center p-8">
                <div className="bg-white px-10 py-9 border border-[#e9d5ff] flex flex-col items-center text-center shadow-xl rounded-[0.625rem]">
                  <div className="w-14 h-14 bg-red-50 border border-red-100 flex items-center justify-center mb-5">
                    <AlertTriangle size={24} className="text-red-500" />
                  </div>
                  <h3 className="text-sm font-bold text-black uppercase tracking-widest mb-2">Shift Already Finalized</h3>
                  <p className="text-[11px] font-medium text-zinc-400 leading-relaxed max-w-52">
                    End of Day records are locked for this terminal today.
                  </p>
                </div>
              </div>
            )}

            {/* Column Headers */}
            <div className="grid grid-cols-12 gap-2 px-6 py-3 border-b border-[#e9d5ff] bg-[#f5f0ff]">
              <div className="col-span-3 text-[10px] font-bold text-black uppercase tracking-widest">Denom</div>
              <div className="col-span-4 text-center text-[10px] font-bold text-black uppercase tracking-widest">Quantity</div>
              <div className="col-span-5 text-right text-[10px] font-bold text-black uppercase tracking-widest">Subtotal</div>
            </div>

            {/* Denomination Rows */}
            <div className="flex-1 overflow-y-auto divide-y divide-zinc-100">
              {denominations.map((denom) => {
                const qty = counts[denom] || '';
                const rowTotal = denom * (parseFloat(qty) || 0);
                const label = denom < 1 ? denom.toString().replace('0.', '.') : denom.toLocaleString();
                return (
                  <div key={denom} className="grid grid-cols-12 gap-3 items-center px-6 py-3 transition-colors hover:bg-[#f5f0ff] focus-within:bg-white">
                    <div className="col-span-3 flex items-center gap-2">
                      <Banknote size={14} className="text-zinc-400 shrink-0" />
                      <span className="font-bold text-black text-sm tabular-nums">₱{label}</span>
                    </div>
                    <div className="col-span-4">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={qty}
                        placeholder="0"
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9.]/g, '');
                          setCounts(prev => ({ ...prev, [denom]: val }));
                        }}
                        disabled={isEodLocked || latestTx !== null}
                        className={`w-full text-center font-bold text-sm py-2 border outline-none transition-all tabular-nums ${
                          (isEodLocked || latestTx !== null)
                            ? 'bg-zinc-50 text-zinc-300 border-transparent'
                            : 'bg-[#f5f0ff] border-zinc-200 focus:border-[#3b2063] focus:bg-white'
                        }`}
                      />
                    </div>
                    {/* FIXED: removed stray > */}
                    <div className={`col-span-5 text-right font-bold text-sm tabular-nums ${rowTotal > 0 ? 'text-black' : 'text-zinc-300'}`}>
                      {rowTotal > 0 ? `₱${rowTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-zinc-100 space-y-4 bg-white">
              {/* Grand Total */}
              <div className="flex items-center justify-between bg-[#f5f0ff] border border-[#e9d5ff] px-5 py-4">
                <span className="text-sm font-bold uppercase tracking-widest text-black">Grand Total</span>
                {/* FIXED: removed stray > */}
                <span className={`text-2xl font-bold tabular-nums ${grandTotal > 0 ? 'text-black' : 'text-zinc-300'}`}>
                  ₱{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Remarks */}
              <div className="relative">
                <MessageSquare size={14} className="absolute left-4 top-3.5 text-zinc-400" />
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Terminal notes / shortage explanation..."
                  disabled={isEodLocked || latestTx !== null}
                  className={`w-full pl-10 pr-4 py-3 border outline-none transition-all text-sm font-medium resize-none h-14 ${
                    (isEodLocked || latestTx !== null)
                      ? 'bg-zinc-50 border-zinc-100 text-zinc-300'
                      : 'bg-white border-zinc-200'
                  }`}
                />
              </div>

              {/* Submit / Recount */}
              {!latestTx && !isEodLocked ? (
                <button
                  onClick={handleSubmit} disabled={isLoading}
                  className="w-full py-4 bg-[#3b2063] hover:bg-[#6a12b8] text-white font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50 rounded-[0.625rem]"
                >
                  <CheckCircle2 size={16} />
                  {isLoading ? 'Finalizing...' : 'Submit EOD Count'}
                </button>
              ) : (
                <button
                  onClick={handleNewCount} disabled={isEodLocked}
                  className={`w-full py-4 font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all rounded-[0.625rem] ${
                    isEodLocked
                      ? 'bg-zinc-100 text-zinc-400 border border-zinc-200'
                      : 'bg-white border border-[#3b2063] text-[#3b2063] hover:bg-[#f4f2fb] active:scale-[0.99]'
                  }`}
                >
                  <RefreshCw size={16} />
                  {isEodLocked ? 'Terminal Closed' : 'Recount Balance'}
                </button>
              )}
            </div>
          </div>

          {/* ── RIGHT: Print Panel ── */}
          <div className="bg-white w-full max-w-sm border border-zinc-200 flex flex-col shadow-sm overflow-hidden h-fit rounded-[0.625rem]">

            {/* Status bar */}
            <div className={`h-1 w-full ${latestTx ? 'bg-emerald-500' : 'bg-zinc-200'}`} />

            <div className="p-7 flex flex-col items-center text-center gap-5">
              {/* Icon */}
              <div className={`w-14 h-14 border flex items-center justify-center transition-colors ${latestTx ? 'bg-emerald-50 border-emerald-200' : 'bg-zinc-50 border-zinc-200'}`}>
                <Printer size={22} className={latestTx ? 'text-emerald-500' : 'text-zinc-300'} strokeWidth={2} />
              </div>

              <div>
                <h3 className={`text-sm font-bold uppercase tracking-widest mb-1 ${latestTx ? 'text-[#1a0f2e]' : 'text-zinc-400'}`}>
                  EOD Receipt
                </h3>
                <p className="text-[11px] font-medium text-zinc-400">
                  {latestTx ? 'Ready to print' : isEodLocked ? 'Shift record archived' : 'Pending submission'}
                </p>
              </div>

              {/* Summary */}
              {latestTx && (
                <div className="bg-[#f4f2fb] border border-violet-100 px-5 py-4 w-full space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Time</span>
                    <span className="text-sm font-bold text-[#1a0f2e]">{latestTx.time}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Total</span>
                    <span className="text-sm font-bold text-emerald-600">₱{latestTx.total.toLocaleString()}</span>
                  </div>
                </div>
              )}

              {/* Print Button */}
              <button
                onClick={handlePrint} disabled={!latestTx}
                className={`w-full py-4 font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all rounded-[0.625rem] ${
                  latestTx
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95'
                    : 'bg-zinc-50 border border-zinc-200 text-zinc-300 cursor-not-allowed'
                }`}
              >
                <Printer size={16} />
                Print EOD Journal
              </button>

              {/* Dismiss — only shown after submission */}
              {latestTx && (
                <button
                  onClick={() => { if (onSuccess) onSuccess(); }}
                  className="w-full py-3 font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all rounded-[0.625rem] bg-white border border-zinc-200 text-zinc-500 hover:bg-zinc-50 active:scale-95"
                >
                  Done · Back to Dashboard
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CashCount;