import TopNavbar from '../TopNavbar';

interface ReportMetric {
  label: string;
  value: string | number;
  color: string;
}

const InventoryReport = () => {
  // Mock metrics for layout
  const metrics: ReportMetric[] = [
    { label: 'Total Stock Value', value: '₱245,300.00', color: 'text-[#3b2063]' },
    { label: 'Low Stock Items', value: 8, color: 'text-red-500' },
    { label: 'Out of Stock', value: 2, color: 'text-zinc-400' },
    { label: 'Top Category', value: 'Milk Tea', color: 'text-emerald-500' },
  ];

  return (
    <div className="flex-1 bg-[#f4f5f7] h-full flex flex-col overflow-hidden font-sans">
      <TopNavbar />
      
      <div className="flex-1 p-8 flex flex-col gap-8 overflow-y-auto">
        {/* HEADER & EXPORT */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-xl font-black text-[#3b2063] uppercase tracking-widest leading-none">Inventory Report</h1>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Stock Level Analytics & Valuation</p>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 border-2 border-zinc-200 text-zinc-500 rounded-lg font-bold text-[10px] uppercase tracking-widest hover:bg-white transition-all">
              Export CSV
            </button>
            <button className="px-4 py-2 bg-[#3b2063] text-white rounded-lg font-bold text-[10px] uppercase tracking-widest shadow-md hover:bg-[#2a1647] transition-all">
              Print PDF
            </button>
          </div>
        </div>

        {/* METRICS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {metrics.map((m, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100">
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">{m.label}</p>
              <p className={`text-xl font-black ${m.color}`}>{m.value}</p>
            </div>
          ))}
        </div>

        {/* LOW STOCK ALERT SECTION */}
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
          <div className="bg-red-50 px-6 py-4 border-b border-red-100 flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <h2 className="text-red-600 font-black text-xs uppercase tracking-widest">Critical Stock Alerts</h2>
          </div>
          <table className="w-full text-left border-collapse">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Item Name</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Remaining</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Unit Cost</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Potential Loss</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              <tr className="hover:bg-zinc-50 transition-colors">
                <td className="px-6 py-4 text-xs font-bold text-slate-700">Boba Pearls (Extra Chewy)</td>
                <td className="px-6 py-4 text-center"><span className="text-red-500 font-black">2kg</span></td>
                <td className="px-6 py-4 text-xs font-bold text-zinc-400 text-center">₱180.00</td>
                <td className="px-6 py-4 text-xs font-black text-slate-700 text-right">₱360.00</td>
              </tr>
              <tr className="hover:bg-zinc-50 transition-colors">
                <td className="px-6 py-4 text-xs font-bold text-slate-700">Full Cream Milk (1L)</td>
                <td className="px-6 py-4 text-center"><span className="text-red-500 font-black">5 Units</span></td>
                <td className="px-6 py-4 text-xs font-bold text-zinc-400 text-center">₱95.00</td>
                <td className="px-6 py-4 text-xs font-black text-slate-700 text-right">₱475.00</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InventoryReport;