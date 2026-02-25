import TopNavbar from '../TopNavbar';

const InventoryReport = () => {
  return (
    <div className="flex-1 bg-[#f4f5f7] h-full flex flex-col overflow-hidden font-sans">
      <TopNavbar />
      <div className="flex-1 p-8 flex items-center justify-center text-center">
        <div>
          <h1 className="text-2xl font-black text-zinc-300 uppercase tracking-widest">Inventory Report</h1>
          <p className="text-zinc-400 font-bold text-xs mt-2 uppercase">Stock Level Analytics</p>
        </div>
      </div>
    </div>
  );
};

export default InventoryReport;