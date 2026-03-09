
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Keyboard from 'react-simple-keyboard';
import 'react-simple-keyboard/build/css/index.css';
import type { AxiosError } from 'axios'; 
import api from '../../../services/api';
import type { KeyboardRef, CashInProps, ReceiptData } from '../../../types/transactions';
import TopNavbar from '../TopNavbar';
import { useToast } from '../../../context/ToastContext'; 
import { Monitor, Calculator, Printer, Wallet, CheckCircle2, AlertTriangle, X, RefreshCw } from 'lucide-react';

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
      showToast(err.response?.data?.message || "Failed to record Cash In.", "error");
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
    setAmount(input.replace(/[^0-9.]/g, ''));
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
        .simple-keyboard { background-color: white !important; border-radius: 0 !important; border-top: 1px solid #e4e4e7 !important; }
        .hg-button { border-radius: 0 !important; height: 64px !important; font-weight: 800 !important; font-size: 1.3rem !important; border: 1px solid #f4f4f5 !important; background: white !important; font-family: 'DM Sans', sans-serif !important; }
        .hg-button:hover { background: #f5f3ff !important; }
        .hg-button-enter { background: #3b2063 !important; color: white !important; font-size: 0.8rem !important; letter-spacing: 0.1em; }
        .hg-button-bksp { background: #fff1f2 !important; color: #e11d48 !important; }
      `}</style>

      {/* PRINTABLE RECEIPT */}
      {isFlipped && (
        <div className="printable-receipt text-slate-800">
          <div className="text-center space-y-1">
            <h1 className="font-black text-[14px] uppercase leading-tight">Lucky Boba Milktea Food and Beverage Trading</h1>
            <p className="text-[10px] uppercase font-bold">Main Branch - QC</p>
            <div className="receipt-divider" />
            <h2 className="font-black text-[11px] uppercase tracking-widest">Cash In Receipt</h2>
            <div className="text-left text-[10px] space-y-0.5 mt-2 uppercase">
              <div className="flex-between"><span>Date</span><span>{receiptData.date}</span></div>
              <div className="flex-between"><span>Time</span><span>{receiptData.time}</span></div>
              <div className="flex-between"><span>Terminal</span><span>POS-01</span></div>
              <div className="flex-between"><span>Cashier</span><span>{cashierName}</span></div>
            </div>
          </div>
          <div className="my-6 pt-4">
            <div className="receipt-divider" />
            <div className="flex-between py-2">
              <span className="text-[10px] font-black uppercase tracking-widest">Total Amount</span>
              <span className="text-xl font-black">{phCurrency.format(parseFloat(amount || '0'))}</span>
            </div>
            <div className="receipt-divider" />
            <div className="mt-4 px-2 italic text-[9px] text-center">Note: Initial drawer cash-in for work shift.</div>
          </div>
          <div className="mt-10 text-center">
            <p className="text-[9px] font-bold uppercase underline underline-offset-4">{cashierName}</p>
            <p className="text-[8px] uppercase tracking-widest mt-1">Cashier Signature</p>
          </div>
        </div>
      )}

      {/* UI CONTAINER */}
      <div id="dashboard-main-container" className="flex flex-col h-full w-full bg-[#f4f2fb] relative overflow-hidden">
        <TopNavbar isEodLocked={isEodLocked} />
        
        <div className={`flex-1 flex flex-col xl:flex-row items-center justify-center p-5 md:p-8 gap-5 overflow-y-auto transition-all duration-300 ${showKeyboard ? 'pb-85' : ''}`}>
          
          {/* ── Flip Card ── */}
          <div className="relative w-full max-w-xl h-120" style={{ perspective: '1200px' }}>
            <div
              className="relative w-full h-full transition-transform duration-700 shadow-lg"
              style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
            >
              
              {/* Front: Form */}
              <div className="absolute w-full h-full bg-white border border-zinc-200 p-8 flex flex-col rounded-[0.625rem]" style={{ backfaceVisibility: 'hidden' }}>
                
                {/* Header */}
                <div className="flex items-center justify-between pb-5 mb-6 border-b border-zinc-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-[#3b2063] flex items-center justify-center">
                      <Wallet size={17} className="text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Point of Sale</p>
                      <h2 className="text-sm font-bold text-[#1a0f2e] uppercase tracking-widest">Initial Cash In</h2>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-50 border border-zinc-200">
                    <Monitor size={12} className="text-zinc-400" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Terminal 01</span>
                  </div>
                </div>

                <div className="flex-1 flex flex-col gap-5">
                  {/* Cashier */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest block">Assigned Cashier</label>
                    <div className="w-full bg-[#f4f2fb] border border-zinc-200 text-[#3b2063] font-bold text-sm px-5 py-3.5 uppercase tracking-widest">
                      {cashierName}
                    </div>
                  </div>

                  {/* Amount Input */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest block">Drawer Starting Balance</label>
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[#3b2063] font-bold text-2xl tabular-nums">₱</span>
                      <input
                        type="text"
                        value={amount}
                        onChange={handleAmountChange}
                        placeholder={isEodLocked ? "SHIFT CLOSED" : "0.00"}
                        disabled={isEodLocked}
                        onFocus={() => { if (!isEodLocked) setShowKeyboard(true); }}
                        className={`w-full text-[#1a0f2e] font-bold text-4xl pl-14 pr-5 py-5 border outline-none tabular-nums transition-all ${
                          isEodLocked
                            ? 'bg-zinc-50 border-zinc-200 text-zinc-400'
                            : 'bg-white border-zinc-200 focus:border-[#3b2063]'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={!amount || isLoading || isEodLocked}
                  className={`w-full py-4 font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all mt-6 rounded-[0.625rem] ${
                    isEodLocked
                      ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                      : 'bg-[#3b2063] hover:bg-[#2a1647] text-white active:scale-[0.99] disabled:opacity-50'
                  }`}
                >
                  {isLoading
                    ? <><RefreshCw size={16} className="animate-spin" /> Validating...</>
                    : isEodLocked
                    ? <><AlertTriangle size={16} /> Terminal Closed</>
                    : <><CheckCircle2 size={16} /> Submit & Start Shift</>
                  }
                </button>
              </div>

              {/* Back: Receipt Preview */}
              <div
                className="absolute w-full h-full bg-white border border-zinc-200 p-10 flex flex-col rounded-[0.625rem]"
                style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
              >
                <div className="text-center border-b-2 border-dashed border-zinc-100 pb-6">
                  <h1 className="font-bold text-lg text-[#3b2063] uppercase tracking-tight">Lucky Boba</h1>
                  <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Transaction Success</p>
                </div>
                
                <div className="flex-1 py-7 flex flex-col gap-3">
                  <ReceiptRow label="Date" value={receiptData.date} />
                  <ReceiptRow label="Time" value={receiptData.time} />
                  <ReceiptRow label="Mode" value="CASH IN · INIT" />
                  <ReceiptRow label="Cashier" value={cashierName} />
                  <div className="pt-6 mt-2 border-t border-zinc-100">
                    <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Total Input</p>
                    <p className="text-4xl font-bold text-[#3b2063] tabular-nums">
                      {phCurrency.format(parseFloat(amount || '0'))}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleNewTransaction}
                  className="w-full bg-white border border-zinc-200 text-zinc-700 py-3.5 font-bold text-sm uppercase tracking-widest hover:bg-zinc-50 transition-all rounded-[0.625rem]"
                >
                  Reset Terminal
                </button>
              </div>
            </div>
          </div>

          {/* ── Print Panel ── */}
          <div className="bg-white w-full max-w-sm border border-zinc-200 p-7 flex flex-col gap-5 shadow-sm rounded-[0.625rem]">
            <div className="flex items-center gap-3 pb-4 border-b border-zinc-100">
              <div className="w-9 h-9 bg-zinc-50 border border-zinc-200 flex items-center justify-center">
                <Printer size={17} className="text-zinc-500" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Terminal Output</p>
                <p className="text-sm font-bold text-zinc-700">Print Receipt</p>
              </div>
            </div>

            <div className="px-4 py-3 bg-[#f4f2fb] border border-violet-100">
              <p className="text-[11px] font-medium text-zinc-500 leading-relaxed">
                Receipt printing available after shift initialization.<br />
                Press <span className="font-bold text-[#3b2063]">ALT + P</span> for quick print.
              </p>
            </div>

            <button
              onClick={handlePrint}
              disabled={!isFlipped}
              className={`w-full py-4 font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${
                isFlipped
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-zinc-50 text-zinc-300 cursor-not-allowed border border-zinc-200'
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

        {/* ── Keyboard Toggle FAB ── */}
        {!isEodLocked && (
          <button
            onClick={() => setShowKeyboard(prev => !prev)}
            className={`fixed bottom-6 right-6 z-100 w-14 h-14 shadow-xl flex items-center justify-center transition-all duration-200 active:scale-95 rounded-[0.625rem] ${
              showKeyboard ? 'bg-red-600 text-white' : 'bg-[#3b2063] text-white hover:bg-[#2a1647]'
            }`}
          >
            {showKeyboard ? <X size={22} /> : <Calculator size={22} />}
          </button>
        )}

        {/* ── Virtual Keyboard ── */}
        <div className={`fixed bottom-0 left-0 right-0 bg-white shadow-[0_-8px_32px_rgba(0,0,0,0.1)] transition-transform duration-500 z-90 ${showKeyboard ? 'translate-y-0' : 'translate-y-full'}`}>
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between px-6 py-3 bg-zinc-50 border-b border-zinc-100">
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Numeric Keypad</span>
              <button onClick={() => setShowKeyboard(false)} className="text-[11px] font-bold text-[#3b2063] uppercase tracking-widest hover:underline rounded-[0.625rem]">
                Close
              </button>
            </div>
            <div className="p-4 bg-white">
              <Keyboard
                keyboardRef={r => { if (r) keyboardRef.current = r; }}
                onChange={onKeyboardChange}
                onKeyPress={onKeyPress}
                layout={{ default: ["1 2 3", "4 5 6", "7 8 9", ". 0 {bksp}", "{enter}"] }}
                display={{ "{bksp}": "⌫", "{enter}": "CONFIRM AMOUNT" }}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const ReceiptRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between">
    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">{label}</span>
    <span className="text-[12px] font-bold text-[#1a0f2e] uppercase">{value}</span>
  </div>
);

export default CashIn;
