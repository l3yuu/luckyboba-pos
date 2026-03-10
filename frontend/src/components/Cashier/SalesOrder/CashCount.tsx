"use client"

import React, { useState, useRef, useEffect } from 'react';
import Keyboard from 'react-simple-keyboard';
import 'react-simple-keyboard/build/css/index.css';
import type { Transaction, ActiveInput } from '../../../types/cash-count';
import api from '../../../services/api';
import TopNavbar from '../TopNavbar';
import { useToast } from '../../../hooks/useToast';
import { Calculator, Printer, CheckCircle2, Lock, AlertTriangle, MessageSquare, RefreshCw, X, Banknote } from 'lucide-react';

interface SimpleKeyboardInstance {
  setInput: (input: string) => void;
}

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
  const [activeInput, setActiveInput] = useState<ActiveInput | null>(null);
  const [layoutName, setLayoutName] = useState('numpad');
  const [showKeyboard, setShowKeyboard] = useState(false);
  const keyboardRef = useRef<SimpleKeyboardInstance | null>(null);

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

  const handleCountFocus = (denom: number) => {
    if (isEodLocked || latestTx) return;
    setActiveInput({ type: 'count', id: denom });
    setLayoutName('numpad');
    setShowKeyboard(true);
    if (keyboardRef.current) keyboardRef.current.setInput(counts[denom] || '');
  };

  const handleRemarksFocus = () => {
    if (isEodLocked || latestTx) return;
    setActiveInput({ type: 'remarks' });
    setLayoutName('default');
    setShowKeyboard(true);
    if (keyboardRef.current) keyboardRef.current.setInput(remarks);
  };

  const handleInputChange = (inputVal: string) => {
    if (!activeInput || isEodLocked || latestTx) return;
    if (activeInput.type === 'count' && activeInput.id !== undefined) {
      const clean = inputVal.replace(/[^0-9.]/g, '');
      setCounts(prev => ({ ...prev, [activeInput.id!]: clean }));
      if (keyboardRef.current) keyboardRef.current.setInput(clean);
    } else if (activeInput.type === 'remarks') {
      setRemarks(inputVal);
      if (keyboardRef.current) keyboardRef.current.setInput(inputVal);
    }
  };

  const onKeyboardChange = (input: string) => {
    if (!activeInput || isEodLocked || latestTx) return;
    handleInputChange(input);
  };

  const onKeyPress = (button: string) => { if (button === "{enter}") setShowKeyboard(false); };

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
        setShowKeyboard(false);
        if (onSuccess) onSuccess();
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
    setLatestTx(null); setCounts({}); setRemarks('');
    if (keyboardRef.current) keyboardRef.current.setInput("");
  };

  const grandTotal = getGrandTotal(counts);

  return (
    <>
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center bg-white/90 backdrop-blur-sm">
          <div className="bg-white px-12 py-10 border border-zinc-200 flex flex-col items-center gap-5 shadow-2xl rounded-[0.625rem]">
            <RefreshCw className="w-10 h-10 text-[#3b2063] animate-spin" strokeWidth={1.5} />
            <div className="text-center">
              <p className="text-sm font-bold text-[#1a0f2e] uppercase tracking-widest">Terminal Syncing</p>
              <p className="text-[11px] font-medium text-zinc-400 mt-1">Finalizing End of Day Journal...</p>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          @page { size: 60mm 120mm; margin: 0; }
          body * { visibility: hidden; }
          .printable-receipt, .printable-receipt * { visibility: visible; }
          .printable-receipt { position: fixed; left: 0; top: 0; width: 56mm !important; margin: 0; padding: 4mm 2mm; background: white; color: black; font-family: 'Courier New', monospace; font-size: 10px; line-height: 1.2; }
          .receipt-header { text-align: center; margin-bottom: 8px; border-bottom: 1px dashed black; padding-bottom: 8px; }
          .receipt-header h2 { font-size: 14px; margin: 0; font-weight: bold; }
          .breakdown-row { display: flex; justify-content: space-between; margin-bottom: 1px; }
          .total-row { border-top: 1px solid black; border-bottom: 1px solid black; padding: 4px 0; margin: 8px 0; font-weight: bold; font-size: 11px; }
        }
        .simple-keyboard { background-color: white !important; border-radius: 0 !important; border-top: 1px solid #e4e4e7 !important; }
        .hg-button { border-radius: 0 !important; height: 60px !important; font-weight: 800 !important; font-size: 1.2rem !important; border: 1px solid #f4f4f5 !important; background: white !important; font-family: 'DM Sans', sans-serif !important; }
        .hg-button:hover { background: #f5f3ff !important; }
        .hg-button-enter { background: #3b2063 !important; color: white !important; font-size: 0.75rem !important; letter-spacing: 0.1em; }
        .hg-button-bksp { background: #fff1f2 !important; color: #e11d48 !important; }
      `}</style>

      {/* Printable Receipt */}
      {printData && (
        <div className="printable-receipt">
          <div className="receipt-header">
            <h2>LUCKY BOBA</h2>
            <p>EOD CASH COUNT</p>
            <p>Main Branch - QC</p>
            <p>{printData.date} | {printData.time}</p>
          </div>
          <div style={{ marginTop: '5px' }}>
            <p style={{ fontWeight: 'bold', marginBottom: '4px' }}>DENOMINATION COUNT:</p>
            {denominations.map(denom => {
              const qtyString = printData.breakdown[denom] || '0';
              const qty = parseFloat(qtyString);
              if (qty === 0) return null;
              return (
                <div key={denom} className="breakdown-row">
                  <span>{denom < 1 ? denom.toString().replace('0.', '.') : denom.toLocaleString()} x {qtyString}</span>
                  <span>₱{(qty * denom).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              );
            })}
          </div>
          <div className="total-row breakdown-row">
            <span>TOTAL COUNT:</span>
            <span>₱ {printData.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      )}

      <div className="flex flex-col h-full w-full bg-[#f4f2fb] relative overflow-hidden">
        <TopNavbar isEodLocked={isEodLocked} />

        <div className={`flex-1 flex flex-row items-start justify-center p-5 md:p-7 gap-5 overflow-y-auto transition-all duration-300 ${showKeyboard ? 'pb-80' : ''}`}>

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
                  <h2 className="text-sm font-bold text-[#1a0f2e] uppercase tracking-widest">Shift Reconciliation</h2>
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
                <div className="bg-white px-10 py-9 border border-zinc-200 flex flex-col items-center text-center shadow-xl rounded-[0.625rem]">
                  <div className="w-14 h-14 bg-red-50 border border-red-100 flex items-center justify-center mb-5">
                    <AlertTriangle size={24} className="text-red-500" />
                  </div>
                  <h3 className="text-sm font-bold text-[#1a0f2e] uppercase tracking-widest mb-2">Shift Already Finalized</h3>
                  <p className="text-[11px] font-medium text-zinc-400 leading-relaxed max-w-52">
                    End of Day records are locked for this terminal today.
                  </p>
                </div>
              </div>
            )}

            {/* Column Headers */}
            <div className="grid grid-cols-12 gap-2 px-6 py-3 border-b border-zinc-100 bg-zinc-50">
              <div className="col-span-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Denom</div>
              <div className="col-span-4 text-center text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Quantity</div>
              <div className="col-span-5 text-right text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Subtotal</div>
            </div>

            {/* Denomination Rows */}
            <div className="flex-1 overflow-y-auto divide-y divide-zinc-100">
              {denominations.map((denom) => {
                const qty = counts[denom] || '';
                const rowTotal = denom * (parseFloat(qty) || 0);
                const label = denom < 1 ? denom.toString().replace('0.', '.') : denom.toLocaleString();
                const isActive = activeInput?.type === 'count' && activeInput.id === denom;
                return (
                  <div key={denom} className={`grid grid-cols-12 gap-3 items-center px-6 py-3 transition-colors ${isActive ? 'bg-[#f4f2fb]' : 'hover:bg-zinc-50'}`}>
                    <div className="col-span-3 flex items-center gap-2">
                      <Banknote size={14} className="text-zinc-400 shrink-0" />
                      <span className="font-bold text-[#1a0f2e] text-sm tabular-nums">₱{label}</span>
                    </div>
                    <div className="col-span-4">
                      <input
                        type="text" value={qty} placeholder="0"
                        onFocus={() => handleCountFocus(denom)}
                        onChange={(e) => handleInputChange(e.target.value)}
                        disabled={isEodLocked || latestTx !== null}
                        className={`w-full text-center font-bold text-sm py-2 border outline-none transition-all tabular-nums ${
                          (isEodLocked || latestTx !== null)
                            ? 'bg-zinc-50 text-zinc-300 border-transparent'
                            : isActive
                            ? 'border-[#3b2063] bg-white'
                            : 'bg-[#f4f2fb] border-transparent focus:border-[#3b2063] focus:bg-white'
                        }`}
                      />
                    </div>
                    <div className={`col-span-5 text-right font-bold text-sm tabular-nums ${rowTotal > 0 ? 'text-[#3b2063]' : 'text-zinc-300'}`}>
                      {rowTotal > 0 ? `₱${rowTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-zinc-100 space-y-4 bg-white">
              {/* Grand Total */}
              <div className="flex items-center justify-between bg-[#f4f2fb] border border-violet-100 px-5 py-4">
                <span className="text-sm font-bold uppercase tracking-widest text-zinc-600">Grand Total</span>
                <span className={`text-2xl font-bold tabular-nums ${grandTotal > 0 ? 'text-[#3b2063]' : 'text-zinc-300'}`}>
                  ₱{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Remarks */}
              <div className="relative">
                <MessageSquare size={14} className="absolute left-4 top-3.5 text-zinc-400" />
                <textarea
                  value={remarks} onFocus={handleRemarksFocus}
                  onChange={(e) => handleInputChange(e.target.value)}
                  placeholder="Terminal notes / shortage explanation..."
                  disabled={isEodLocked || latestTx !== null}
                  className={`w-full pl-10 pr-4 py-3 border outline-none transition-all text-sm font-medium resize-none h-14 ${
                    (isEodLocked || latestTx !== null)
                      ? 'bg-zinc-50 border-zinc-100 text-zinc-300'
                      : activeInput?.type === 'remarks'
                      ? 'bg-white border-[#3b2063]'
                      : 'bg-white border-zinc-200'
                  }`}
                />
              </div>

              {/* Submit / Recount */}
              {!latestTx && !isEodLocked ? (
                <button
                  onClick={handleSubmit} disabled={isLoading}
                  className="w-full py-4 bg-[#3b2063] hover:bg-[#2a1647] text-white font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50 rounded-[0.625rem]"
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
            </div>
          </div>
        </div>

        {/* ── Keyboard FAB ── */}
        {!isEodLocked && (
          <button
            onClick={() => setShowKeyboard(prev => !prev)}
            className={`fixed bottom-6 right-6 z-100 w-14 h-14 shadow-xl flex items-center justify-center transition-all active:scale-95 rounded-[0.625rem] ${
              showKeyboard ? 'bg-red-600 text-white' : 'bg-[#3b2063] text-white hover:bg-[#2a1647]'
            }`}
          >
            {showKeyboard ? <X size={22} /> : <Calculator size={22} />}
          </button>
        )}

        {/* ── Keyboard Drawer ── */}
        <div className={`fixed bottom-0 left-0 right-0 bg-white shadow-[0_-8px_32px_rgba(0,0,0,0.1)] transition-transform duration-500 z-90 ${showKeyboard ? 'translate-y-0' : 'translate-y-full'}`}>
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between px-6 py-3 bg-zinc-50 border-b border-zinc-100">
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
                {layoutName === 'numpad' ? 'Numeric Keypad' : 'Text Input'}
              </span>
              <button onClick={() => setShowKeyboard(false)} className="text-[11px] font-bold text-[#3b2063] uppercase tracking-widest hover:underline rounded-[0.625rem]">
                Close
              </button>
            </div>
            <div className="p-4 bg-white">
              <Keyboard
                keyboardRef={r => { if (r) keyboardRef.current = r as unknown as SimpleKeyboardInstance; }}
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

export default CashCount;