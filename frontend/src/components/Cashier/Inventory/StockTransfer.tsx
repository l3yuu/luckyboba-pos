"use client"

import TopNavbar from '../../Cashier/TopNavbar';

const dashboardFont = { fontFamily: "'Inter', sans-serif" };

const StockTransfer = () => {
  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');`}</style>
      <div className="flex-1 bg-[#f4f2fb] h-full flex flex-col overflow-hidden font-sans" style={dashboardFont}>
        <TopNavbar />
        <div className="flex-1 p-5 md:p-7 flex flex-col items-center justify-center">
          {/* Header */}
          <div className="text-center mb-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">Inventory</p>
            <h1 className="text-lg font-extrabold text-[#1c1c1e] mt-0.5">Stock Transfer</h1>
          </div>

          {/* Transfer Form */}
          <div className="bg-white p-8 rounded-[0.625rem] shadow-sm border border-[#e9d5ff] w-full max-w-lg">
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">From Branch</label>
                  <select className="w-full px-4 py-3 bg-[#f5f0ff] border border-[#e9d5ff] rounded-[0.625rem] text-sm font-semibold outline-none focus:border-[#3b2063]">
                    <option>Main Branch</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">To Branch</label>
                  <select className="w-full px-4 py-3 bg-[#f5f0ff] border border-[#e9d5ff] rounded-[0.625rem] text-sm font-semibold outline-none focus:border-[#3b2063]">
                    <option>Select Destination</option>
                  </select>
                </div>
              </div>

              <button className="w-full h-11 bg-[#3b2063] hover:bg-[#6a12b8] text-white font-bold text-xs uppercase tracking-widest transition-colors rounded-[0.625rem] shadow-sm">
                Initiate Transfer
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StockTransfer;