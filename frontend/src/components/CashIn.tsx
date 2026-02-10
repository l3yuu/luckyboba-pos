import React, { useState, useEffect, useRef } from 'react';
import Keyboard from 'react-simple-keyboard';
import 'react-simple-keyboard/build/css/index.css';

const CashIn = () => {
  const [amount, setAmount] = useState('');
  const [isNotifOpen, setNotifOpen] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(false);
  
  const [isFlipped, setIsFlipped] = useState(false);
  const [receiptData, setReceiptData] = useState({ date: '', time: '' });
  
  const notifRef = useRef<HTMLDivElement>(null);
  const keyboardRef = useRef<any>(null);

  // --- Helper Functions ---
  const getCurrentDateTime = () => {
    const now = new Date();
    return {
      date: now.toLocaleDateString(),
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const handleSubmit = () => {
    if (!amount) return; 
    setReceiptData(getCurrentDateTime());
    setIsFlipped(true); 
    setShowKeyboard(false); 
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
    if (button === "{enter}") setShowKeyboard(false);
  };

  const handlePrint = () => {
    if (!isFlipped) return;
    window.print();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isFlipped && event.altKey && (event.key === 'p' || event.key === 'P')) {
        event.preventDefault();
        handlePrint();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped]); 

  return (
    <>
      <style>
        {`
          @media print {
            /* XP-80C Configuration */
            @page {
              size: 80mm auto; /* 80mm width, auto height for continuous roll */
              margin: 0;       /* No browser margins, let printer handle it */
            }
            
            body {
              margin: 0;
              padding: 0;
            }

            body * {
              visibility: hidden; /* Hide everything else */
            }

            /* --- RECEIPT CONTAINER --- */
            .printable-receipt, .printable-receipt * {
              visibility: visible;
            }
            
            .printable-receipt {
              position: absolute;
              left: 0;
              top: 0;
              width: 72mm !important; /* Printable area for 80mm paper (leaving margin) */
              margin: 0 auto;
              padding: 5mm 2mm !important; 
              
              /* Reset Styling for Thermal Print */
              background: white !important;
              box-shadow: none !important;
              border: none !important;
              border-radius: 0 !important;
              color: black !important;
              font-family: 'Courier New', monospace; /* Monospace aligns better on receipts */
              font-size: 12px;
              line-height: 1.2;
            }

            /* --- ELEMENT ADJUSTMENTS --- */
            .print-hidden {
              display: none !important;
            }

            /* Force black text */
            .text-zinc-400, .text-[#3b2063], .text-emerald-500, .text-zinc-500 {
              color: black !important;
            }

            /* Header adjustments */
            h2 { 
              font-size: 16px !important; 
              text-align: center;
              margin-bottom: 10px;
            }
            
            /* Amount Text Big */
            .amount-text { 
              font-size: 20px !important; 
              font-weight: bold !important; 
            }

            /* Hide Buttons */
            .no-print {
              display: none !important;
            }
            
            /* Remove fancy borders/backgrounds */
            .bg-[#f8f6ff] {
              background-color: transparent !important;
              border-top: 1px dashed black !important;
              border-bottom: 1px dashed black !important;
              border-radius: 0 !important;
            }
            
            .border-zinc-100 {
              border-color: black !important;
            }

            /* Centered Layout */
            .receipt-header {
              text-align: center;
              margin-bottom: 15px;
            }
            
            /* Layout Grid Fix for Print */
            .grid-cols-2 {
              display: flex;
              justify-content: space-between;
              gap: 10px;
              margin-top: 20px;
            }
            .text-center {
              text-align: center;
              width: 45%;
            }
          }
        `}
      </style>

      <div className="flex flex-col h-full w-full bg-[#f8f6ff] animate-in fade-in zoom-in duration-300 relative overflow-hidden">
        
        {/* --- Top Navbar --- */}
        <header className="flex-none bg-white border-b border-zinc-200 px-8 py-4 flex items-center justify-between shadow-sm z-20">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
               <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Branch</span>
               <span className="text-[#3b2063] font-black text-xs uppercase tracking-wider">Main Branch - QC</span>
            </div>
            <div className="h-8 w-px bg-zinc-100"></div>
            <div className="flex flex-col">
               <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Cashier</span>
               <span className="text-[#3b2063] font-black text-xs uppercase tracking-wider">Admin User</span>
            </div>
          </div>
          <div className="relative" ref={notifRef}>
            <button onClick={() => setNotifOpen(!isNotifOpen)} className="p-2 text-zinc-400 hover:text-[#3b2063] hover:bg-purple-50 rounded-full transition-all relative">
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
              </svg>
            </button>
            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-zinc-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="bg-[#3b2063] px-4 py-3"><p className="text-white text-[10px] font-bold uppercase tracking-widest">Notifications</p></div>
                <div className="max-h-64 overflow-y-auto">
                  <div className="p-4 border-b border-zinc-50 hover:bg-purple-50 transition-colors cursor-pointer">
                    <p className="text-[#3b2063] font-bold text-xs mb-1">Low Stock Alert</p>
                    <p className="text-zinc-400 text-[10px]">Tapioca Pearls are running low.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* --- Main Content Area --- */}
        <div className={`flex-1 flex flex-col xl:flex-row items-center justify-center p-6 gap-6 overflow-y-auto transition-all duration-300 ${showKeyboard ? 'pb-[300px]' : ''}`}>
          
          <div className="relative w-full max-w-2xl h-[500px]" style={{ perspective: '1000px' }}>
            <div 
              className="relative w-full h-full transition-transform duration-700 ease-in-out"
              style={{ 
                transformStyle: 'preserve-3d', 
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' 
              }}
            >
              {/* --- FRONT FACE (Input Form) --- */}
              <div 
                className="absolute w-full h-full bg-white rounded-[3rem] shadow-xl border border-zinc-100 p-10 flex flex-col items-center overflow-hidden" 
                style={{ backfaceVisibility: 'hidden' }}
              >
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
                        className="w-full bg-white text-[#3b2063] font-black text-3xl px-8 pl-14 py-5 rounded-3xl border-2 border-zinc-100 focus:border-[#3b2063] focus:outline-none focus:ring-4 focus:ring-[#f0ebff] transition-all placeholder:text-zinc-300"
                      />
                    </div>
                    <p className="text-xs font-black text-red-500 uppercase tracking-widest text-right pr-4 mt-1">Numbers Only</p>
                  </div>

                  <button 
                    onClick={handleSubmit} 
                    disabled={!amount}
                    className="w-full mt-2 bg-[#3b2063] hover:bg-[#2a1647] disabled:bg-zinc-200 disabled:text-zinc-400 disabled:cursor-not-allowed text-white py-5 rounded-3xl font-black text-sm uppercase tracking-[0.25em] shadow-lg shadow-purple-900/20 active:scale-95 transition-all duration-200"
                  >
                    Submit Cash In
                  </button>
                </div>
              </div>

              {/* --- BACK FACE (Receipt View) --- */}
              <div 
                className="printable-receipt absolute w-full h-full bg-white rounded-[3rem] shadow-xl border border-zinc-100 p-10 flex flex-col relative overflow-hidden"
                style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
              >
                <div className="absolute top-0 left-0 w-full h-3 bg-emerald-500 opacity-20 print-hidden"></div>
                
                {/* Receipt Header */}
                <div className="receipt-header border-b border-zinc-100 pb-4 mb-4">
                   <h2 className="text-[#3b2063] font-black text-xl tracking-tight uppercase">Cash In Receipt</h2>
                   <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest mt-1 print-hidden">Transaction Successful</p>
                   
                   {/* Date/Time Row for Print */}
                   <div className="flex flex-col items-center mt-2">
                      <p className="text-xs font-bold text-zinc-500">{receiptData.date} - {receiptData.time}</p>
                   </div>
                </div>

                {/* Receipt Details */}
                <div className="space-y-2 mb-6 w-full">
                   <div className="flex justify-between">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Terminal</span>
                      <span className="text-sm font-bold text-[#3b2063]">01</span>
                   </div>
                   <div className="flex justify-between">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Cashier</span>
                      <span className="text-sm font-bold text-[#3b2063]">ADMIN</span>
                   </div>
                   <div className="flex justify-between items-center bg-[#f8f6ff] p-3 rounded-xl mt-2">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Amount</span>
                      <span className="text-xl font-black text-[#3b2063] amount-text">₱ {amount}</span>
                   </div>
                </div>

                {/* Signatures Area */}
                <div className="grid grid-cols-2 gap-4 items-end mb-4 w-full">
                   <div className="text-center">
                      <div className="border-b border-zinc-300 mb-2 w-full mx-auto border-black"></div>
                      <p className="text-[#3b2063] font-bold text-xs uppercase">Admin</p>
                      <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Prepared By</p>
                   </div>
                   <div className="text-center">
                      <div className="border-b border-zinc-300 mb-2 w-full mx-auto border-black"></div>
                      <p className="text-[#3b2063] font-bold text-xs uppercase">Authorized Rep</p>
                      <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Checked By</p>
                   </div>
                </div>

                <button onClick={handleNewTransaction} className="no-print w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all">
                  New Transaction
                </button>
              </div>
            </div>
          </div>

          {/* === RECEIPT PRINTER CARD === */}
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-xl shadow-purple-900/5 border border-zinc-100 p-8 flex flex-col items-center text-center relative overflow-hidden h-fit flex-shrink-0">
            <div className={`absolute top-0 left-0 w-full h-2 ${isFlipped ? 'bg-emerald-500 opacity-20' : 'bg-zinc-300 opacity-20'}`}></div>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 transition-colors ${isFlipped ? 'bg-emerald-50' : 'bg-zinc-50'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={isFlipped ? "#10b981" : "#a1a1aa"} className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z" />
              </svg>
            </div>
            <h3 className={`font-black text-xs uppercase tracking-[0.2em] mb-2 ${isFlipped ? 'text-[#3b2063]' : 'text-zinc-400'}`}>Receipt Printer</h3>
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-8">
              {isFlipped ? "Ready to Print" : "Waiting for Transaction..."}
            </p>
            <button 
              onClick={handlePrint} 
              disabled={!isFlipped}
              className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-200 flex items-center justify-center gap-2 group
                ${isFlipped 
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-900/20 active:scale-95 cursor-pointer' 
                  : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                }`}
            >
              Print (ALT + P)
            </button>
          </div>
        </div>

        {/* --- Virtual Keyboard --- */}
        <div className={`fixed bottom-0 left-0 right-0 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.1)] transition-transform duration-300 z-50 ${showKeyboard ? 'translate-y-0' : 'translate-y-full'}`}>
          <div className="flex items-center justify-between px-4 py-2 bg-zinc-50 border-b border-zinc-200">
             <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Numpad</span>
             <button onClick={() => setShowKeyboard(false)} className="text-xs font-black text-[#3b2063] uppercase tracking-widest hover:text-red-500 px-4 py-2">Close</button>
          </div>
          <div className="p-2 text-zinc-800">
            <Keyboard
              keyboardRef={r => (keyboardRef.current = r)}
              onChange={onKeyboardChange}
              onKeyPress={onKeyPress}
              inputName="amount"
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