import TopNavbar from '../TopNavbar';

const InventoryDashboard = () => {
  // --- WEEKLY DATE LOGIC ---
  const getWeeklyRange = () => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 (Sun) to 6 (Sat)
    
    // Calculate Sunday (Start of Week)
    const start = new Date(now);
    start.setDate(now.getDate() - dayOfWeek);
    
    // Calculate Saturday (End of Week)
    const end = new Date(now);
    end.setDate(now.getDate() + (6 - dayOfWeek));

    const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' };
    return {
      start: start.toLocaleDateString('en-US', options),
      end: end.toLocaleDateString('en-US', options)
    };
  };

  const { start, end } = getWeeklyRange();

  return (
    <div className="flex-1 bg-[#f4f5f7] h-full flex flex-col overflow-hidden font-sans">
      <TopNavbar />

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
        {/* === TOP HEADER SECTION === */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-2">
          <div>
          </div>
        </div>

        {/* === TOP 5 PRODUCTS SECTION === */}
        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
          {/* Header updated to reflect the dynamic weekly range */}
          <div className="bg-zinc-50 px-6 py-4 border-b border-zinc-200">
            <h2 className="text-[#1e40af] font-black text-xs uppercase tracking-[0.15em] text-center">
              TOP 5 PRODUCTS by Qty Sold FROM {start} TO {end}
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-white">
                  <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Rank</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">QTY</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">UNIT COST</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">TOTAL COST</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">SOLD TOTAL</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">TOTAL PROFIT</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Product Name</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Barcode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {[1, 2, 3, 4, 5].map((rank) => (
                  <tr key={rank} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-4 py-4 text-xs font-bold text-zinc-400 text-center">{rank}</td>
                    <td className="px-4 py-4 text-xs font-bold text-zinc-300 text-center">-</td>
                    <td className="px-4 py-4 text-xs font-bold text-zinc-300 text-center">-</td>
                    <td className="px-4 py-4 text-xs font-bold text-zinc-300 text-center">-</td>
                    <td className="px-4 py-4 text-xs font-bold text-zinc-300 text-center">-</td>
                    <td className="px-4 py-4 text-xs font-bold text-zinc-300 text-center">-</td>
                    <td className="px-4 py-4 text-xs font-black text-slate-400 uppercase tracking-tight italic">No sales data recorded for this week</td>
                    <td className="px-4 py-4 text-xs font-bold text-zinc-300 text-right">-</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-zinc-50">
                <tr className="border-t-2 border-zinc-200 font-black">
                  <td colSpan={4} className="px-4 py-3 text-right text-[11px] text-slate-700 uppercase tracking-widest">WEEKLY TOTAL</td>
                  <td className="px-4 py-3 text-center text-sm text-slate-900">0.00</td>
                  <td className="px-4 py-3 text-center text-sm text-emerald-600">0.00</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* === PERFORMANCE SUMMARY CARDS === */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-8 h-48 flex flex-col items-center justify-center text-center">
            <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Inventory Stock Status</div>
            <div className="text-2xl font-black text-[#3b2063] uppercase italic opacity-20 tracking-tighter">
              Charts and Analytics Placeholder
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-8 h-48 flex flex-col items-center justify-center text-center">
            <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Critical Stock Alerts</div>
            <div className="text-xs font-bold text-zinc-300 uppercase tracking-widest italic">
              All inventory levels are currently stable
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryDashboard;