import { useState } from 'react';
import TopNavbar from '../TopNavbar';

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

const GRAND_TOTAL_QTY = MOCK_ITEMS_DATA.reduce((s, i) => s + i.qty, 0);
const GRAND_TOTAL_AMT = MOCK_ITEMS_DATA.reduce((s, i) => s + i.amount, 0);

const ItemsReport = () => {
  const today = new Date().toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [reportType, setReportType] = useState('category-summary');

  const reportTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });

  const filterOptions = [
    ...Array.from({ length: 30 }, (_: unknown, i: number) => `${i + 1}`),
    ...Array.from({ length: 30 }, (_: unknown, i: number) => `RM${i + 1}`)
  ];

  const fmt = (val: number) =>
    `P${val.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

  const handlePrint = () => {
    // Inject a temporary style that hides everything EXCEPT the receipt
    const style = document.createElement('style');
    style.id = 'rp-override';
    style.innerHTML = `
      @media print {
        @page { size: 80mm auto; margin: 6mm 4mm; }
        body * { visibility: hidden !important; }
        #rp-receipt, #rp-receipt * { visibility: visible !important; }
        #rp-receipt {
          position: fixed !important;
          inset: 0 !important;
          width: 72mm !important;
          height: auto !important;
        }
      }
    `;
    document.head.appendChild(style);
    window.print();
    setTimeout(() => document.getElementById('rp-override')?.remove(), 500);
  };

  const row = (label: string, value: string, color?: string) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', color: color ?? '#111' }}>
      <span>{label}</span><span style={{ fontWeight: color ? 700 : 400 }}>{value}</span>
    </div>
  );

  return (
    <div className="flex-1 bg-[#f8f6ff] h-full flex flex-col overflow-hidden font-sans">

      <TopNavbar />

      <div className="flex-1 overflow-y-auto p-8 flex flex-col">

        {/* === CONTROL PANEL === */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-zinc-100 mb-6">
          <div className="flex flex-col xl:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-2 mb-1 block">From Date</label>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
                className="w-full p-3 rounded-xl border-2 border-zinc-100 bg-zinc-50 text-[#3b2063] font-bold outline-none focus:border-[#3b2063] transition-all" />
            </div>
            <div className="flex-1 w-full">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-2 mb-1 block">To Date</label>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
                className="w-full p-3 rounded-xl border-2 border-zinc-100 bg-zinc-50 text-[#3b2063] font-bold outline-none focus:border-[#3b2063] transition-all" />
            </div>
            <div className="flex-1 w-full">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-2 mb-1 block">Filter</label>
              <select className="w-full p-3 rounded-xl border-2 border-zinc-100 bg-zinc-50 text-[#3b2063] font-bold outline-none focus:border-[#3b2063] transition-all appearance-none cursor-pointer">
                <option value="all">All</option>
                {filterOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div className="flex-1 w-full">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-2 mb-1 block">Report Type</label>
              <select value={reportType} onChange={(e) => setReportType(e.target.value)}
                className="w-full p-3 rounded-xl border-2 border-zinc-100 bg-zinc-50 text-[#3b2063] font-bold outline-none focus:border-[#3b2063] transition-all appearance-none cursor-pointer">
                <option value="category-summary">Category Summary</option>
                <option value="item-list">Item List</option>
                <option value="category-per-item">Category per Item</option>
                <option value="per-hour">Per Hour</option>
              </select>
            </div>
            <div className="w-full xl:w-auto">
              <button className="w-full xl:w-40 p-3 bg-[#3b2063] text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-[#2a1647] transition-all shadow-lg shadow-purple-900/20 active:scale-95 h-[50px]">
                Generate
              </button>
            </div>
            <div className="w-full xl:w-auto">
              <button onClick={handlePrint}
                className="w-full xl:w-40 p-3 bg-[#3b2063] text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-[#2a1647] transition-all shadow-lg shadow-purple-900/20 active:scale-95 h-[50px] flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.198-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z" />
                </svg>
                Print
              </button>
            </div>
          </div>
        </div>

        {/* === SCREEN TABLE === */}
        <div className="flex-1 bg-white rounded-[2.5rem] shadow-xl shadow-purple-900/5 border border-zinc-100 flex flex-col overflow-hidden">
          <div className="px-8 py-6 border-b border-zinc-100 bg-zinc-50 flex justify-between items-center">
            <h3 className="text-[#3b2063] font-black text-sm uppercase tracking-[0.2em]">Generated Report</h3>
            <span className="text-zinc-400 text-xs font-bold">{fromDate} — {toDate}</span>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-white z-10 shadow-sm">
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
              <tfoot className="bg-zinc-50 font-black text-[#3b2063]">
                <tr>
                  <td colSpan={3} className="px-8 py-4 text-right uppercase tracking-widest text-xs">Grand Total</td>
                  <td className="px-8 py-4 text-right">{GRAND_TOTAL_QTY}</td>
                  <td className="px-8 py-4 text-right text-lg">₱ {GRAND_TOTAL_AMT.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

      </div>

      {/* ── RECEIPT — invisible on screen, shows only when printing ── */}
      <div id="rp-receipt" style={{
        display: 'block',
        visibility: 'hidden',
        position: 'fixed',
        top: 0, left: 0,
        width: '72mm',
        fontFamily: "'Courier New', Courier, monospace",
        fontSize: '11px',
        color: '#111',
        lineHeight: '1.4',
        padding: '4mm',
        background: 'white',
      }}>

        {/* Store Header */}
        <div style={{ textAlign: 'center', marginBottom: '10px' }}>
          <div style={{ fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em', lineHeight: 1.3 }}>
            Lucky Boba Milktea Food and<br />Beverage Trading
          </div>
          <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#555', marginTop: '3px' }}>
            Main Branch - QC
          </div>
        </div>

        <div style={{ borderTop: '1px dashed #999', margin: '8px 0' }} />

        <div style={{ textAlign: 'center', marginBottom: '5px' }}><b>Summary</b></div>
        {row('Date', fromDate)}
        {row('Report Time', reportTime)}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}><span>Terminal</span><span>POS-01</span></div>

        <div style={{ borderTop: '1px dashed #999', margin: '8px 0' }} />

        <div style={{ background: '#eee', padding: '3px 6px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.12em', textAlign: 'center', marginBottom: '5px' }}>
          Items Summary
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', color: '#555', paddingBottom: '3px', borderBottom: '1px dashed #999', marginBottom: '4px' }}>
          <span style={{ width: '50%' }}>Item</span>
          <span style={{ width: '15%', textAlign: 'right' }}>Qty</span>
          <span style={{ width: '35%', textAlign: 'right' }}>Amount</span>
        </div>

        {MOCK_ITEMS_DATA.map((item) => (
          <div key={item.id} style={{ borderBottom: '1px dashed #ddd', paddingBottom: '5px', marginBottom: '5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ width: '50%', fontWeight: 900, textTransform: 'uppercase' }}>{item.name}</span>
              <span style={{ width: '15%', textAlign: 'right' }}>{item.qty}</span>
              <span style={{ width: '35%', textAlign: 'right', fontWeight: 900 }}>{fmt(item.amount)}</span>
            </div>
            <div style={{ fontSize: '9px', color: '#888', fontStyle: 'italic' }}>{item.category}</div>
          </div>
        ))}

        <div style={{ borderTop: '1px solid #ccc', margin: '8px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span>Total Items Sold</span><span style={{ fontWeight: 900 }}>{GRAND_TOTAL_QTY}</span>
        </div>

        <div style={{ borderTop: '1px dashed #999', margin: '8px 0' }} />

        <div style={{ background: '#eee', padding: '3px 6px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.12em', textAlign: 'center', marginBottom: '5px' }}>
          Audit Summary
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}><span>Gross Sales</span><span style={{ fontWeight: 900 }}>{fmt(GRAND_TOTAL_AMT)}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', color: '#c00' }}><span>Total Discounts</span><span>-P0.00</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#c00' }}><span>Total Voids</span><span>P0.00</span></div>

        <div style={{ borderTop: '1px solid #ccc', margin: '8px 0' }} />

        <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#666', marginBottom: '5px' }}>Payment Methods</div>
        <div style={{ borderTop: '1px dashed #999', margin: '8px 0' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', color: '#888' }}><span>Vatable Sales</span><span>{fmt(GRAND_TOTAL_AMT * (100 / 112))}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#888' }}><span>VAT Amount (12%)</span><span>{fmt(GRAND_TOTAL_AMT * (12 / 112))}</span></div>

        <div style={{ borderTop: '1px solid #ccc', margin: '8px 0' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '10px' }}>
          <span>Net Revenue</span><span>{fmt(GRAND_TOTAL_AMT)}</span>
        </div>

        <div style={{ borderTop: '1px dashed #999', margin: '8px 0' }} />

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 900, textTransform: 'uppercase', marginBottom: '20px' }}>Admin User</div>
          <div style={{ borderBottom: '1px solid #333', width: '140px', margin: '0 auto 3px' }} />
          <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#666', marginBottom: '24px' }}>Prepared By</div>
          <div style={{ borderBottom: '1px solid #333', width: '140px', margin: '0 auto 3px' }} />
          <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#666' }}>Signed By</div>
          <div style={{ fontSize: '9px', color: '#888', marginTop: '2px' }}>(Manager or Supervisor)</div>
        </div>

      </div>

    </div>
  );
};

export default ItemsReport;