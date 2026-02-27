import { useState, useRef, useEffect } from 'react'; // Removed 'React'
import TopNavbar from '../TopNavbar';

const MallAccredReport = () => {
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

  const handleGenerate = () => console.log("Generating Report...");
  const handlePrint = () => window.print();

  const malls = [
    "ROBINSONS", "ALIANCE", "MEGA WORLD", "PITX", "MIAA", 
    "SM", "SHANGRILA", "VISTA", "ETON", "AYALA", 
    "EVER MALL", "ARANETA", "MITSUKOSHI"
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
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
              MENU
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className={`w-3 h-3 ml-1 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
            {isMenuOpen && (
              <div className="absolute top-full left-0 mt-2 w-[900px] bg-white rounded-xl shadow-2xl border border-zinc-200 p-6 animate-in fade-in slide-in-from-top-2 duration-200 z-50 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-3 gap-4">
                  {malls.map((mall, index) => (
                    <div 
                      key={index}
                      onClick={() => setIsMenuOpen(false)}
                      className="bg-white border-l-4 border-blue-600 rounded-r-lg shadow-sm hover:shadow-md border-y border-r border-zinc-100 p-5 h-28 flex flex-col justify-center relative overflow-hidden group transition-all cursor-pointer"
                    >
                      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-blue-50 to-transparent opacity-50 pointer-events-none group-hover:opacity-100 transition-opacity"></div>
                      <div className="relative z-10 flex flex-col items-start h-full justify-between py-1">
                        <h3 className="text-zinc-400 font-bold uppercase tracking-widest text-[10px]">{mall}</h3>
                        <div className="self-end mt-auto">
                          <span className="text-2xl font-black text-slate-700 uppercase tracking-tight group-hover:text-blue-700 transition-colors">PRINT</span>
                        </div>
                      </div>
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
          <div className="flex gap-2 w-full xl:w-auto ml-auto pl-4 border-l border-zinc-200">
            <button onClick={handleGenerate} className="px-6 h-12 bg-[#3b2063] text-white rounded-md font-bold uppercase text-xs tracking-wider hover:bg-[#0f172a] transition-all flex items-center justify-center gap-2 shadow-sm min-w-[120px]">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
              Generate
            </button>
            <button onClick={handlePrint} className="px-6 h-12 bg-[#3b2063] text-white rounded-md font-bold uppercase text-xs tracking-wider hover:bg-[#0f172a] transition-all flex items-center justify-center gap-2 shadow-sm min-w-[100px]">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.198-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z" /></svg>
              Print
            </button>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
          <div className="bg-zinc-100 p-8 rounded-full mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-zinc-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72m-13.5 8.65h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .415.336.75.75.75Z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-700">No Mall Selected</h2>
          <p className="text-sm text-zinc-400 mt-2">Click the <strong>MENU</strong> button above to select a mall.</p>
        </div>
      </div>
    </div>
  );
};

export default MallAccredReport;