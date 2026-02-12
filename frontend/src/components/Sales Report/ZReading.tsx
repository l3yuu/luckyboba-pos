import { useState, useRef, useEffect } from 'react';
import TopNavbar from '../TopNavbar';

const ZReading = () => {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleGenerate = () => console.log("Generating Z-Reading...");
  const handlePrint = () => window.print();

  const menuCards = [
    { label: "REPORT", title: "HOURLY SALES", color: "border-blue-600", rightText: null },
    { label: "OVERVIEW", title: "SALES SUMMARY REPORT", color: "border-amber-400", rightText: null },
    { label: "AUDIT", title: "VOID LOGS", color: "border-blue-600", rightText: "0" },
    { label: "TRANSACTION", title: "SEARCH RECEIPT", color: "border-blue-600", rightText: null },
    { label: "DATA MANAGEMENT", title: "EXPORT SALES", color: "border-blue-600", rightText: null },
    { label: "ANALYSIS", title: "SALES DETAILED", color: "border-blue-600", rightText: "0" },
    { label: "INVENTORY", title: "EXPORT ITEMS", color: "border-blue-600", rightText: null },
    { label: "INVENTORY", title: "QTY ITEMS", color: "border-blue-600", rightText: "0" },
    { label: "Z-READING", title: "", isAction: true, actionLabel: "Z-READING", actionText: "PRINT", color: "border-emerald-500", textColor: "text-emerald-600" },
    { label: "CASH COUNT", title: "", isAction: true, actionLabel: "CASH COUNT", actionText: "VIEW", color: "border-blue-600", textColor: "text-blue-600" }
  ];

  return (
    <div className="flex-1 bg-[#f4f5f7] h-full flex flex-col overflow-hidden font-sans">
      <TopNavbar />
      <div className="flex-1 overflow-y-auto p-6 flex flex-col relative">
        <div className="bg-white p-3 rounded-lg shadow-sm border border-zinc-200 mb-6 flex flex-col xl:flex-row items-center gap-4 relative z-50">
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`flex items-center gap-2 font-bold text-sm px-4 py-2 rounded-md transition-colors ${isMenuOpen ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-zinc-50'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
              MENU
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className={`w-3 h-3 ml-1 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`}><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
            </button>
            {isMenuOpen && (
              <div className="absolute top-full left-0 mt-2 w-[800px] bg-white rounded-xl shadow-2xl border border-zinc-200 p-6 animate-in fade-in slide-in-from-top-2 duration-200 z-50 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  {menuCards.map((card, index) => (
                    <div 
                      key={index}
                      onClick={() => setIsMenuOpen(false)} 
                      className={`bg-white border-l-4 ${card.color} rounded-r-lg shadow-sm hover:shadow-md border-y border-r border-zinc-100 p-4 h-24 flex flex-col justify-center relative overflow-hidden transition-all cursor-pointer group`}
                    >
                      <div className={`absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l to-transparent opacity-10 pointer-events-none ${card.color.includes('amber') ? 'from-amber-100' : card.color.includes('emerald') ? 'from-emerald-100' : 'from-blue-100'}`}></div>
                      {card.isAction ? (
                        <div className="flex items-center justify-between relative z-10">
                          <h3 className={`${card.textColor} font-black uppercase tracking-widest text-xs`}>{card.actionLabel}</h3>
                          <span className="text-xl font-black text-slate-700 uppercase tracking-tight group-hover:scale-105 transition-transform">{card.actionText}</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between relative z-10">
                          <div className="flex flex-col">
                            <h3 className="text-zinc-400 font-bold uppercase tracking-widest text-[9px] mb-1">{card.label}</h3>
                            <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight group-hover:text-blue-700 transition-colors">{card.title}</h2>
                          </div>
                          {card.rightText && <span className="text-2xl font-black text-slate-800">{card.rightText}</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex-1 w-full xl:w-auto border-l border-zinc-200 pl-4">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-400 uppercase tracking-wider pointer-events-none">Date</span>
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full pl-12 pr-4 py-2 rounded-md border border-zinc-200 bg-zinc-50 text-slate-700 font-bold text-sm outline-none focus:border-blue-500 transition-all h-12"
              />
            </div>
          </div>
          {['ALL', 'ALL', 'ALL'].map((val, i) => (
            <div key={i} className="flex-1 w-full xl:w-auto">
              <div className="relative">
                <select className="w-full px-4 py-2 rounded-md border border-zinc-200 bg-zinc-50 text-slate-700 font-bold text-sm outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer h-12">
                  <option>{val}</option><option>Option 1</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
                </div>
              </div>
            </div>
          ))}
          <div className="flex gap-2 w-full xl:w-auto ml-auto pl-4 border-l border-zinc-200">
            <button onClick={handleGenerate} className="px-6 h-12 bg-[#1e40af] text-white rounded-md font-bold uppercase text-xs tracking-wider hover:bg-[#1e3a8a] transition-all flex items-center justify-center gap-2 shadow-sm min-w-[120px]">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
              Generate
            </button>
            <button onClick={handlePrint} className="px-6 h-12 bg-[#172554] text-white rounded-md font-bold uppercase text-xs tracking-wider hover:bg-[#0f172a] transition-all flex items-center justify-center gap-2 shadow-sm min-w-[100px]">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.198-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z" /></svg>
              Print
            </button>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
          <div className="bg-zinc-100 p-8 rounded-full mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-zinc-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-700">No Report Selected</h2>
          <p className="text-sm text-zinc-400 mt-2">Click the <strong>MENU</strong> button above to select a report.</p>
        </div>
      </div>
    </div>
  );
};

export default ZReading;