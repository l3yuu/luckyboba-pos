import { useState } from 'react';
import TopNavbar from '../TopNavbar';

// Mock Data for the Table
const MOCK_ITEMS_DATA = [
  { id: 1, name: "Wintermelon Milk Tea", category: "Classic Milktea", qty: 45, amount: 4500.00 },
  { id: 2, name: "Okinawa Milk Tea", category: "Classic Milktea", qty: 38, amount: 3990.00 },
  { id: 3, name: "Dark Choco", category: "Classic Milktea", qty: 32, amount: 3200.00 },
  { id: 4, name: "Salted Caramel", category: "Classic Milktea", qty: 28, amount: 2940.00 },
  { id: 5, name: "Strawberry Fruit Tea", category: "Fruit Series", qty: 25, amount: 2500.00 },
  { id: 6, name: "Green Apple Tea", category: "Fruit Series", qty: 20, amount: 1900.00 },
  { id: 7, name: "Chicken Wings (6pcs)", category: "Chicken Wings", qty: 15, amount: 2925.00 },
  { id: 8, name: "Chicken Wings (12pcs)", category: "Chicken Wings", qty: 8, amount: 3120.00 },
  { id: 9, name: "French Fries", category: "Snacks", qty: 50, amount: 2500.00 },
  { id: 10, name: "Nachos Overload", category: "Snacks", qty: 12, amount: 1800.00 },
];

const ItemsReport = () => {
  // Default to today's date
  const today = new Date().toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);

  // Generate Filter Options (1-30 and RM1-RM30)
  const filterOptions = [
    ...Array.from({ length: 30 }, (_, i) => `${i + 1}`),
    ...Array.from({ length: 30 }, (_, i) => `RM${i + 1}`)
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 bg-[#f8f6ff] h-full flex flex-col overflow-hidden font-sans">
      
      <TopNavbar />

      <div className="flex-1 overflow-y-auto p-8 flex flex-col">
        

        {/* === CONTROL PANEL (Inputs & Buttons) === */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-zinc-100 mb-6 print:hidden">
          <div className="flex flex-col xl:flex-row gap-4 items-end">
            
            {/* 1st Box: From Date */}
            <div className="flex-1 w-full">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-2 mb-1 block">From Date</label>
              <input 
                type="date" 
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full p-3 rounded-xl border-2 border-zinc-100 bg-zinc-50 text-[#3b2063] font-bold outline-none focus:border-[#3b2063] transition-all"
              />
            </div>

            {/* 2nd Box: To Date */}
            <div className="flex-1 w-full">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-2 mb-1 block">To Date</label>
              <input 
                type="date" 
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full p-3 rounded-xl border-2 border-zinc-100 bg-zinc-50 text-[#3b2063] font-bold outline-none focus:border-[#3b2063] transition-all"
              />
            </div>

            {/* 3rd Box: Filter (1-30, RM1-RM30) */}
            <div className="flex-1 w-full">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-2 mb-1 block">Filter</label>
              <select className="w-full p-3 rounded-xl border-2 border-zinc-100 bg-zinc-50 text-[#3b2063] font-bold outline-none focus:border-[#3b2063] transition-all appearance-none cursor-pointer">
                <option value="all">All</option>
                {filterOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            {/* 4th Box: Report Type (Category Summary, etc) */}
            <div className="flex-1 w-full">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-2 mb-1 block">Report Type</label>
              <select className="w-full p-3 rounded-xl border-2 border-zinc-100 bg-zinc-50 text-[#3b2063] font-bold outline-none focus:border-[#3b2063] transition-all appearance-none cursor-pointer">
                <option value="category-summary">Category Summary</option>
                <option value="item-list">Item List</option>
                <option value="category-per-item">Category per Item</option>
                <option value="per-hour">Per Hour</option>
              </select>
            </div>

            {/* 1st Blue Box: Generate Button */}
            <div className="w-full xl:w-auto">
              <button className="w-full xl:w-40 p-3 bg-[#3b2063] text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-[#2a1647] transition-all shadow-lg shadow-purple-900/20 active:scale-95 h-[50px]">
                Generate
              </button>
            </div>

            {/* 2nd Blue Box: Print Button */}
            <div className="w-full xl:w-auto">
              <button 
                onClick={handlePrint}
                className="w-full xl:w-40 p-3 bg-[#3b2063] text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-[#2a1647] transition-all shadow-lg shadow-purple-900/20 active:scale-95 h-[50px] flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.198-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z" />
                </svg>
                Print
              </button>
            </div>

          </div>
        </div>

        {/* === BIG BOX: TABLE === */}
        <div className="flex-1 bg-white rounded-[2.5rem] shadow-xl shadow-purple-900/5 border border-zinc-100 flex flex-col overflow-hidden relative print:shadow-none print:border-none print:rounded-none">
          
          {/* Table Header (Visible on Screen) */}
          <div className="px-8 py-6 border-b border-zinc-100 bg-zinc-50 flex justify-between items-center print:hidden">
            <h3 className="text-[#3b2063] font-black text-sm uppercase tracking-[0.2em]">Generated Report</h3>
            <span className="text-zinc-400 text-xs font-bold">{fromDate} — {toDate}</span>
          </div>

          {/* Printable Header (Only Visible on Print) */}
          <div className="hidden print:block text-center mb-6 pt-4">
            <h1 className="text-xl font-bold uppercase">Lucky Boba - Items Report</h1>
            <p className="text-sm">Period: {fromDate} to {toDate}</p>
          </div>

          {/* Table Content */}
          <div className="flex-1 overflow-auto p-0">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-white z-10 shadow-sm print:shadow-none">
                <tr className="border-b border-zinc-100">
                  <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest w-16">#</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Item Name</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Category</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">Qty Sold</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">Total Sales</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {MOCK_ITEMS_DATA.map((item, index) => (
                  <tr key={item.id} className="hover:bg-[#f8f6ff] transition-colors">
                    <td className="px-8 py-4 text-xs font-bold text-zinc-400">{index + 1}</td>
                    <td className="px-8 py-4 text-sm font-bold text-[#3b2063]">{item.name}</td>
                    <td className="px-8 py-4 text-xs font-bold text-zinc-500 bg-zinc-50/50">{item.category}</td>
                    <td className="px-8 py-4 text-sm font-bold text-zinc-600 text-right">{item.qty}</td>
                    <td className="px-8 py-4 text-sm font-black text-[#3b2063] text-right">₱ {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-zinc-50 font-black text-[#3b2063] print:bg-transparent print:border-t-2 print:border-black">
                <tr>
                  <td colSpan={3} className="px-8 py-4 text-right uppercase tracking-widest text-xs">Grand Total</td>
                  <td className="px-8 py-4 text-right">273</td>
                  <td className="px-8 py-4 text-right text-lg">₱ 29,375.00</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          @page { size: auto; margin: 10mm; }
          body { -webkit-print-color-adjust: exact; }
          /* Hide non-printable areas */
          nav, header, button, .print\\:hidden { display: none !important; }
          /* Ensure table fits */
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 8px; border-bottom: 1px solid #ddd; }
          tfoot { border-top: 2px solid #000; }
        }
      `}</style>
    </div>
  );
};

export default ItemsReport;