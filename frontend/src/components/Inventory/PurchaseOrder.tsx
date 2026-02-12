import TopNavbar from '../TopNavbar';

const PurchaseOrder = () => {
  return (
    <div className="flex-1 bg-[#f4f5f7] h-full flex flex-col overflow-hidden font-sans">
      <TopNavbar />
      <div className="flex-1 p-8">
        <h1 className="text-xl font-black text-[#3b2063] uppercase tracking-widest">Purchase Orders</h1>
      </div>
    </div>
  );
};

export default PurchaseOrder; // <--- Add this line