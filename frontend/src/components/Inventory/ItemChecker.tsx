import TopNavbar from '../TopNavbar';

const ItemChecker = () => {
  return (
    <div className="flex-1 bg-[#f4f5f7] h-full flex flex-col overflow-hidden font-sans">
      <TopNavbar />
      <div className="flex-1 p-6 flex flex-col items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-200 w-full max-w-md text-center">
          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-4">Scan or Enter Barcode</label>
          <input type="text" className="w-full px-4 py-3 rounded-xl border border-zinc-300 bg-zinc-50 text-center font-black text-lg outline-none focus:border-blue-500 mb-4" placeholder="0000000000" />
          <button className="w-full bg-[#3b2063] text-white py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-[#2a1647] transition-all">Check Item</button>
        </div>
      </div>
    </div>
  );
};

export default ItemChecker;