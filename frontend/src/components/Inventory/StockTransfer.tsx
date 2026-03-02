import TopNavbar from '../TopNavbar';

const StockTransfer = () => {
  return (
    <div className="flex-1 bg-[#f4f5f7] h-full flex flex-col overflow-hidden font-sans">
      <TopNavbar />
      <div className="flex-1 p-6 flex flex-col items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-200 w-full max-w-lg">
          <h2 className="text-[#3b2063] font-black text-xs uppercase tracking-[0.2em] mb-6 text-center">Stock Transfer Form</h2>
          <div className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                   <label className="text-[9px] font-bold text-zinc-400 uppercase">From Branch</label>
                   <select className="px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-bold"><option>Main Branch</option></select>
                </div>
                <div className="flex flex-col gap-1">
                   <label className="text-[9px] font-bold text-zinc-400 uppercase">To Branch</label>
                   <select className="px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-bold"><option>Select Destination</option></select>
                </div>
             </div>
             <button className="w-full bg-[#3b2063] text-white py-3 rounded-xl font-black uppercase text-xs tracking-widest mt-4 shadow-lg">Initiate Transfer</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockTransfer;