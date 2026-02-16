import { useState } from 'react';
import TopNavbar from '../TopNavbar';

interface POItem {
  id: number;
  poNumber: string;
  supplier: string;
  totalAmount: number;
  status: 'Pending' | 'Received' | 'Cancelled';
  dateOrdered: string;
}

const PurchaseOrder = () => {
  const [orders] = useState<POItem[]>([
    { id: 1, poNumber: "PO-2026-001", supplier: "Boba Supply Co.", totalAmount: 15500.50, status: "Pending", dateOrdered: "2026-02-14" },
    { id: 2, poNumber: "PO-2026-002", supplier: "Tea Leaf Trading", totalAmount: 8200.00, status: "Received", dateOrdered: "2026-02-10" },
  ]);

  return (
    <div className="flex-1 bg-[#f4f5f7] h-full flex flex-col overflow-hidden font-sans">
      <TopNavbar />
      
      <div className="flex-1 p-8 flex flex-col gap-6 overflow-y-auto">
        {/* HEADER */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-xl font-black text-[#3b2063] uppercase tracking-widest leading-none">Purchase Orders</h1>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Supplier Procurement Management</p>
          </div>
          <button className="px-6 py-2 bg-[#10b981] text-white rounded-md font-bold text-[10px] uppercase tracking-widest shadow-sm hover:bg-[#0da673] transition-all active:scale-95">
            CREATE NEW P.O.
          </button>
        </div>

        {/* STATS SUMMARY */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Active Orders</p>
            <p className="text-2xl font-black text-[#3b2063]">12</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Pending Payment</p>
            <p className="text-2xl font-black text-amber-500">₱45,200.00</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Monthly Spend</p>
            <p className="text-2xl font-black text-emerald-500">₱128,450.00</p>
          </div>
        </div>

        {/* ORDERS TABLE */}
        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">PO Number</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Supplier</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Amount</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {orders.map((po) => (
                <tr key={po.id} className="hover:bg-zinc-50 transition-colors group cursor-pointer">
                  <td className="px-6 py-4 text-xs font-black text-[#3b2063] font-mono">{po.poNumber}</td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-700">{po.supplier}</td>
                  <td className="px-6 py-4 text-xs font-bold text-zinc-400">{po.dateOrdered}</td>
                  <td className="px-6 py-4 text-xs font-black text-slate-700 text-right">₱{po.totalAmount.toLocaleString()}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                      po.status === 'Received' ? 'bg-emerald-100 text-emerald-600' : 
                      po.status === 'Pending' ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'
                    }`}>
                      {po.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrder;