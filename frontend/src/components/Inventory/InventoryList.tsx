import TopNavbar from '../TopNavbar';

const InventoryList = () => {
  return (
    <div className="flex-1 bg-[#f4f5f7] h-full flex flex-col overflow-hidden font-sans">
      <TopNavbar />
      <div className="flex-1 overflow-y-auto p-6 flex flex-col">
        <div className="flex justify-between items-end mb-6">
          <h1 className="text-xl font-black text-[#3b2063] uppercase tracking-widest">Inventory List</h1>
          <button className="px-6 py-2 bg-[#10b981] text-white rounded-md font-bold text-[10px] uppercase tracking-widest shadow-sm">
            ADD NEW ITEM
          </button>
        </div>

        <div className="flex-1 bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="px-6 py-3 text-[10px] font-black text-slate-600 uppercase tracking-widest">Item Name</th>
                <th className="px-6 py-3 text-[10px] font-black text-slate-600 uppercase tracking-widest">SKU/Barcode</th>
                <th className="px-6 py-3 text-[10px] font-black text-slate-600 uppercase tracking-widest text-center">Stock</th>
                <th className="px-6 py-3 text-[10px] font-black text-slate-600 uppercase tracking-widest text-center">Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {/* Table Rows */}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InventoryList;