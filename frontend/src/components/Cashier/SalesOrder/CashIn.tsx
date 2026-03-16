"use client"

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { AxiosError } from 'axios'; 
import api from '../../../services/api';
import type { CashInProps, ReceiptData } from '../../../types/transactions';
import TopNavbar from '../../Cashier/TopNavbar';
import { useToast } from '../../../context/ToastContext'; 
import { Monitor, Printer, Wallet, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

const CashIn: React.FC<CashInProps> = ({ onSuccess }) => {
  const { showToast } = useToast();
  const phCurrency = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });

  const [amount, setAmount] = useState('');
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [prepProgress, setPrepProgress] = useState(0);
  const [prepLabel, setPrepLabel] = useState('');
  const [isEodLocked, setIsEodLocked] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData>({ date: '', time: '' });

  const cashierName = useMemo(() => {
    return localStorage.getItem('lucky_boba_user_name') || 'Staff';
  }, []);

  const branchName = useMemo(() => {
    return localStorage.getItem('lucky_boba_user_branch') || 'Main Branch';
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
        localStorage.removeItem('dashboard_stats_timestamp');
        showToast(response.data.message || "Cash In recorded successfully!", "success");
        setReceiptData(getCurrentDateTime());

        // ── Prefetch phase ────────────────────────────────────────────────────
        // Show a progress bar while we load menu data in parallel.
        // By the time the cashier clicks "Menu", everything is already cached.
        setIsLoading(false);
        setIsPreparing(true);
        setPrepProgress(0);

        const tick = setInterval(() =>
          setPrepProgress(p => Math.min(p + 5, 90)), 80
        );

        setPrepLabel('Loading menu items...');
        await Promise.allSettled([
          api.get('/menu').then(r => {
            if (Array.isArray(r.data))
              localStorage.setItem('pos_menu_cache', JSON.stringify(r.data));
          }),
          api.get('/add-ons').then(r => {
            if (Array.isArray(r.data))
              localStorage.setItem('pos_addons_cache', JSON.stringify(r.data));
          }),
          api.get('/discounts').then(r => {
            if (Array.isArray(r.data))
              localStorage.setItem('pos_discounts_cache', JSON.stringify(r.data));
          }),
          api.get('/receipts/next-sequence').then(r => {
            const seq = parseInt(r.data?.next_sequence, 10);
            if (!isNaN(seq)) localStorage.setItem('last_or_sequence', String(seq));
          }),
        ]);

        clearInterval(tick);
        setPrepProgress(100);
        setPrepLabel('Menu ready!');

        // Notify sidebar to unlock immediately
        window.dispatchEvent(new Event('cash-in-completed'));

        // Brief pause so the user sees 100% before flipping
        await new Promise(res => setTimeout(res, 450));

        setIsPreparing(false);
        setIsFlipped(true);
        if (onSuccess) onSuccess();

      } else {
        showToast(response.data.message || "Cash In already recorded.", "warning");
        setIsLoading(false);
      }
    } catch (error: unknown) {
      const err = error as AxiosError<{ message?: string }>;
      showToast(err.response?.data?.message || "Failed to record Cash In.", "error");
      setIsLoading(false);
      setIsPreparing(false);
    }
  };

  const handleNewTransaction = () => {
    setIsFlipped(false);
    setAmount('');
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isEodLocked) return; 
    const value = e.target.value.replace(/[^0-9.]/g, '');
    setAmount(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && amount && !isEodLocked) {
      handleSubmit();
    }
  };

  const handlePrint = useCallback(() => {
    if (!isFlipped) return;
    window.print();
  }, [isFlipped]);

  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if (isFlipped && event.altKey && (event.key === 'p' || event.key === 'P')) {
        event.preventDefault();
        handlePrint();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isFlipped, handlePrint]); 

  return (
    <>
      <style>{`
        .printable-receipt { display: none; }
        @media print {
          @page { size: 80mm auto; margin: 0; }
          html, body { background: white !important; margin: 0 !important; padding: 0 !important; }
          #dashboard-main-container { display: none !important; }
          .printable-receipt { 
            display: block !important; position: absolute !important; left: 0 !important; top: 0 !important;
            width: 80mm !important; padding: 5mm !important; background: white !important; color: black !important; 
            font-family: 'Courier New', monospace;
          }
          .printable-receipt * { visibility: visible !important; }
          .receipt-divider { border-top: 1px dashed #000 !important; margin: 8px 0; width: 100%; }
          .flex-between { display: flex !important; justify-content: space-between !important; width: 100%; }
        }
      `}</style>

      {/* PRINTABLE RECEIPT */}
      {isFlipped && (
        <div className="printable-receipt text-slate-800">
          <div className="text-center space-y-1">
            <h1 className="font-black text-[17px] uppercase leading-tight">Lucky Boba Food and Beverage Trading</h1>
            <p className="text-[13px] uppercase font-bold">{branchName}</p>
            <div className="receipt-divider" />
            <h2 className="font-black text-[14px] uppercase tracking-widest">Cash In Receipt</h2>
            <div className="text-left text-[13px] space-y-0.5 mt-2 uppercase">
              <div className="flex-between"><span>Date</span><span>{receiptData.date}</span></div>
              <div className="flex-between"><span>Time</span><span>{receiptData.time}</span></div>
              <div className="flex-between"><span>Terminal</span><span>POS-01</span></div>
              <div className="flex-between"><span>Cashier</span><span>{cashierName}</span></div>
            </div>
          </div>
          <div className="my-6 pt-4">
            <div className="receipt-divider" />
            <div className="flex-between py-2">
              <span className="text-[13px] font-black uppercase tracking-widest">Total Amount</span>
              <span className="text-2xl font-black">{phCurrency.format(parseFloat(amount || '0'))}</span>
            </div>
            <div className="receipt-divider" />
            <div className="mt-4 px-2 italic text-[11px] text-center">Note: Initial drawer cash-in for work shift.</div>
          </div>
          <div className="mt-10 text-center">
            <p className="text-[12px] font-bold uppercase underline underline-offset-4">{cashierName}</p>
            <p className="text-[11px] uppercase tracking-widest mt-1">Cashier Signature</p>
          </div>
        </div>
      )}

      {/* UI CONTAINER */}
      <div id="dashboard-main-container" className="flex flex-col h-full w-full bg-[#f4f2fb] relative overflow-hidden">
        <TopNavbar isEodLocked={isEodLocked} />
        
        <div className="flex-1 flex flex-col xl:flex-row items-center justify-center p-5 md:p-8 gap-5 overflow-y-auto transition-all duration-300">
          
          {/* Flip Card */}
          <div className="relative w-full max-w-xl h-120" style={{ perspective: '1200px' }}>
            <div
              className="relative w-full h-full transition-transform duration-700 shadow-lg"
              style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
            >
              {/* Front: Form */}
              <div className="absolute w-full h-full bg-white border border-[#e9d5ff] p-8 flex flex-col rounded-[0.625rem]" style={{ backfaceVisibility: 'hidden' }}>
                <div className="flex items-center justify-between pb-5 mb-6 border-b border-[#e9d5ff]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-[#7c14d4] flex items-center justify-center">
                      <Wallet size={17} className="text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-black">Point of Sale</p>
                      <h2 className="text-sm font-bold text-black uppercase tracking-widest">Initial Cash In</h2>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-[#f5f0ff] border border-[#e9d5ff]">
                    <Monitor size={12} className="text-[#7c14d4]" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-black">Terminal 01</span>
                  </div>
                </div>

                <div className="flex-1 flex flex-col gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-black uppercase tracking-widest block">Assigned Cashier</label>
                    <div className="w-full bg-[#f5f0ff] border border-[#e9d5ff] text-black font-bold text-sm px-5 py-3.5 uppercase tracking-widest">
                      {cashierName}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-black uppercase tracking-widest block">Drawer Starting Balance</label>
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-black font-bold text-2xl tabular-nums">₱</span>
                      <input
                        type="text"
                        autoFocus
                        value={amount}
                        onChange={handleAmountChange}
                        onKeyDown={handleKeyDown}
                        placeholder={isEodLocked ? "SHIFT CLOSED" : "0.00"}
                        disabled={isEodLocked}
                        className={`w-full text-black font-bold text-4xl pl-14 pr-5 py-5 border outline-none tabular-nums transition-all ${
                          isEodLocked
                            ? 'bg-[#f5f0ff] border-[#e9d5ff] text-[#7c14d4]/50'
                            : 'bg-white border-[#e9d5ff] focus:border-[#7c14d4]'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* ── Preparing overlay ── */}
                {isPreparing ? (
                  <div className="mt-6 rounded-[0.625rem] bg-[#f5f0ff] border-2 border-[#7c14d4]/20 p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#7c14d4]">
                        {prepLabel}
                      </p>
                      <span className="text-[11px] font-black text-[#7c14d4] tabular-nums">{prepProgress}%</span>
                    </div>
                    <div className="w-full bg-zinc-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-2 rounded-full bg-[#7c14d4] transition-all duration-150 ease-out"
                        style={{ width: `${prepProgress}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-black font-bold uppercase tracking-widest">
                      Loading items · add-ons · discounts
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={!amount || isLoading || isEodLocked}
                    className={`w-full py-4 font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all mt-6 rounded-[0.625rem] ${
                      isEodLocked
                        ? 'bg-[#f5f0ff] border-[#e9d5ff] text-[#7c14d4]/50 cursor-not-allowed'
                        : 'bg-[#7c14d4] hover:bg-[#6a12b8] text-white active:scale-[0.99] disabled:opacity-50'
                    }`}
                  >
                    {isLoading
                      ? <><RefreshCw size={16} className="animate-spin" /> Validating...</>
                      : isEodLocked
                      ? <><AlertTriangle size={16} /> Terminal Closed</>
                      : <><CheckCircle2 size={16} /> Submit & Start Shift</>
                    }
                  </button>
                )}
              </div>

              {/* Back: Receipt Preview */}
              <div
                className="absolute w-full h-full bg-white border border-[#7c14d4] p-10 flex flex-col rounded-[0.625rem]"
                style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
              >
                <div className="text-center border-b-2 border-dashed border-[#7c14d4] pb-6">
                  <h1 className="font-bold text-lg text-black uppercase tracking-tight">Lucky Boba</h1>
                  <p className="text-[11px] font-bold text-black uppercase tracking-widest">Transaction Success</p>
                </div>
                <div className="flex-1 py-7 flex flex-col gap-3">
                  <ReceiptRow label="Date" value={receiptData.date} />
                  <ReceiptRow label="Time" value={receiptData.time} />
                  <ReceiptRow label="Mode" value="CASH IN · INIT" />
                  <ReceiptRow label="Cashier" value={cashierName} />
                  <div className="pt-6 mt-2 border-t border-[#e9d5ff]">
                    <p className="text-[11px] font-bold text-black uppercase tracking-widest mb-2">Total Input</p>
                    <p className="text-4xl font-bold text-black tabular-nums">
                      {phCurrency.format(parseFloat(amount || '0'))}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleNewTransaction}
                  className="w-full bg-white border border-[#e9d5ff] text-black py-3.5 font-bold text-sm uppercase tracking-widest hover:bg-[#f5f0ff] transition-all rounded-[0.625rem]"
                >
                  Reset Terminal
                </button>
              </div>
            </div>
          </div>

          {/* Print Panel */}
          <div className="bg-white w-full max-w-sm border border-[#e9d5ff] p-7 flex flex-col gap-5 shadow-sm rounded-[0.625rem]">
            <div className="flex items-center gap-3 pb-4 border-b border-[#e9d5ff]">
              <div className="w-9 h-9 bg-[#f5f0ff] border border-[#e9d5ff] flex items-center justify-center">
                <Printer size={17} className="text-[#7c14d4]" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-black">Terminal Output</p>
                <p className="text-sm font-bold text-black">Print Receipt</p>
              </div>
            </div>
            <div className="px-4 py-3 bg-[#f5f0ff] border-t border-[#e9d5ff]">
              <p className="text-[11px] font-medium text-black leading-relaxed">
                Receipt printing available after shift initialization.<br />
                Press <span className="font-bold text-black">ALT + P</span> for quick print.
              </p>
            </div>
            <button
              onClick={handlePrint}
              disabled={!isFlipped}
              className={`w-full py-4 font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${
                isFlipped
                  ? 'bg-[#7c14d4] hover:bg-[#6a12b8] text-white'
                  : 'bg-white border border-[#e9d5ff] text-black hover:bg-[#f5f0ff] hover:border-[#7c14d4] cursor-not-allowed'
              }`}
            >
              <Printer size={16} />
              Print Receipt
            </button>
            {isFlipped && (
              <div className="flex items-center gap-2 justify-center">
                <CheckCircle2 size={14} className="text-emerald-500" />
                <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wide">Shift Started Successfully</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </>
  );
};

const ReceiptRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between">
    <span className="text-[11px] font-bold text-black uppercase tracking-widest">{label}</span>
    <span className="text-[12px] font-bold text-black uppercase">{value}</span>
  </div>
);

export default CashIn;
