import { useState, useRef } from 'react';
import Keyboard from 'react-simple-keyboard';
import 'react-simple-keyboard/build/css/index.css';

// 1. Define Keyboard Type
interface KeyboardRef {
  setInput: (input: string) => void;
}

// Data Interface
interface Receipt {
  id: number;
  siNumber: string;
  terminal: string;
  items: number;
  cashier: string;
  total: number;
  date: string;
  time: string;
}

// Hidden "Database"
const RECEIPT_DATABASE: Receipt[] = [
  { id: 1, siNumber: '00234', terminal: '01', items: 3, cashier: 'ADMIN', total: 500.00, date: '10/02/2026', time: '10:30 AM' },
  { id: 2, siNumber: '00235', terminal: '01', items: 1, cashier: 'ADMIN', total: 120.00, date: '10/02/2026', time: '10:45 AM' },
  { id: 3, siNumber: '00236', terminal: '01', items: 5, cashier: 'JANE', total: 850.50, date: '10/02/2026', time: '11:15 AM' },
  { id: 4, siNumber: '00237', terminal: '02', items: 2, cashier: 'ADMIN', total: 240.00, date: '10/02/2026', time: '11:30 AM' },
  { id: 5, siNumber: '00238', terminal: '01', items: 4, cashier: 'JANE', total: 600.00, date: '10/02/2026', time: '12:00 PM' },
  { id: 6, siNumber: '00239', terminal: '03', items: 1, cashier: 'MARK', total: 150.00, date: '10/02/2026', time: '12:15 PM' },
  { id: 7, siNumber: '00240', terminal: '01', items: 10, cashier: 'ADMIN', total: 1200.00, date: '10/02/2026', time: '01:00 PM' },
];

const SearchReceipts = () => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const [searchResults, setSearchResults] = useState<Receipt[]>([]); 
  const [hasSearched, setHasSearched] = useState(false); 
  
  const [showKeyboard, setShowKeyboard] = useState(false);
  
  // 2. Fix 'any' by using the interface
  const keyboardRef = useRef<KeyboardRef>(null);

  // --- Search Logic ---
  const handleSearch = () => {
    if (!searchQuery.trim()) return;

    setHasSearched(true);
    
    const lowerQuery = searchQuery.toLowerCase();
    
    const filtered = RECEIPT_DATABASE.filter(item => 
      item.siNumber.toLowerCase().includes(lowerQuery) ||
      item.cashier.toLowerCase().includes(lowerQuery) ||
      item.terminal.toLowerCase().includes(lowerQuery)
    );
    
    setSearchResults(filtered);
    setShowKeyboard(false); 
  };

  // --- Input Handlers ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (keyboardRef.current) keyboardRef.current.setInput(val);
  };

  const onKeyboardChange = (input: string) => {
    setSearchQuery(input);
  };

  const onKeyPress = (button: string) => {
    if (button === "{enter}") {
      handleSearch();
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#f8f6ff] animate-in fade-in zoom-in duration-300 relative overflow-hidden">
      
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
      </header>

      <div className={`flex-1 flex flex-col items-center justify-start p-6 gap-6 overflow-y-auto transition-all duration-300 ${showKeyboard ? 'pb-[350px]' : ''}`}>
        
        {/* --- Search Section --- */}
        <div className="w-full max-w-5xl flex gap-4">
          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-zinc-200 p-2 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="#a1a1aa" className="w-6 h-6 ml-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input 
              type="text" 
              value={searchQuery}
              onChange={handleInputChange}
              onFocus={() => setShowKeyboard(true)}
              placeholder="Search by SI#, Cashier, or Terminal..."
              className="flex-1 h-12 px-4 outline-none text-[#3b2063] font-bold placeholder:text-zinc-300 bg-transparent"
            />
          </div>
          <button 
            onClick={handleSearch}
            className="bg-[#3b2063] hover:bg-[#2a1647] text-white px-8 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-purple-900/20 active:scale-95 transition-all"
          >
            Search
          </button>
        </div>

        {/* --- Table Section --- */}
        <div className="w-full max-w-5xl bg-white rounded-[2rem] shadow-sm border border-zinc-200 overflow-hidden flex-1 flex flex-col">
           <div className="px-8 py-5 border-b border-zinc-100 bg-zinc-50">
             <h3 className="text-[#3b2063] font-black text-xs uppercase tracking-[0.2em]">Receipts List</h3>
           </div>
           
           <div className="flex-1 overflow-auto">
             <table className="w-full text-left relative">
               <thead className="sticky top-0 bg-white z-10 shadow-sm">
                 <tr>
                   <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">SI #</th>
                   <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-center">TRML #</th>
                   <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-center">Items</th>
                   <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Cashier</th>
                   <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">Total Sales</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-zinc-50">
                 {!hasSearched ? (
                   <tr>
                     <td colSpan={5} className="px-6 py-20 text-center">
                       <div className="flex flex-col items-center justify-center opacity-30">
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mb-4">
                           <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                         </svg>
                         <p className="text-sm font-bold uppercase tracking-widest">Enter details to search</p>
                       </div>
                     </td>
                   </tr>
                 ) : searchResults.length === 0 ? (
                   <tr>
                     <td colSpan={5} className="px-6 py-12 text-center text-zinc-300 text-xs font-bold uppercase tracking-widest">
                       No matching receipts found
                     </td>
                   </tr>
                 ) : (
                   searchResults.map((item) => (
                     <tr key={item.id} className="hover:bg-[#f8f6ff] transition-colors cursor-pointer group">
                       <td className="px-6 py-4">
                         <span className="font-black text-[#3b2063] text-sm group-hover:text-purple-600">#{item.siNumber}</span>
                         <p className="text-[10px] text-zinc-400 font-medium">{item.date} • {item.time}</p>
                       </td>
                       <td className="px-6 py-4 text-center font-bold text-zinc-600">{item.terminal}</td>
                       <td className="px-6 py-4 text-center font-bold text-zinc-600">{item.items}</td>
                       <td className="px-6 py-4 text-xs font-bold text-zinc-500">{item.cashier}</td>
                       <td className="px-6 py-4 text-right">
                         <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg text-xs font-bold">
                           ₱ {item.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                         </span>
                       </td>
                     </tr>
                   ))
                 )}
               </tbody>
             </table>
           </div>
        </div>

      </div>

      <button 
        onClick={() => setShowKeyboard(!showKeyboard)}
        className={`fixed bottom-8 right-8 z-[60] p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 ${showKeyboard ? 'bg-red-500 text-white' : 'bg-[#3b2063] text-white'}`}
      >
        {showKeyboard ? (
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
        ) : (
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5" /></svg>
        )}
      </button>

      <div className={`fixed bottom-0 left-0 right-0 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.1)] transition-transform duration-300 z-50 ${showKeyboard ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="flex items-center justify-between px-4 py-2 bg-zinc-50 border-b border-zinc-200">
           <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Keyboard</span>
           <button onClick={() => setShowKeyboard(false)} className="text-xs font-black text-[#3b2063] uppercase tracking-widest hover:text-red-500 px-4 py-2">Close</button>
        </div>
        <div className="p-2 text-zinc-800">
          <Keyboard
            keyboardRef={r => (keyboardRef.current = r)}
            onChange={onKeyboardChange}
            onKeyPress={onKeyPress}
            layout={{
              default: [
                "1 2 3 4 5 6 7 8 9 0 {bksp}",
                "q w e r t y u i o p",
                "a s d f g h j k l {enter}",
                "z x c v b n m , .",
                "{space}"
              ]
            }}
            display={{ "{bksp}": "⌫", "{enter}": "SEARCH", "{space}": "SPACE" }}
          />
        </div>
      </div>

    </div>
  );
};

export default SearchReceipts;