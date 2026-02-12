import { useState } from 'react';
import TopNavbar from '../TopNavbar';
import { ArrowLeft, Ticket, Plus, Printer, X, Save, Upload, FileText } from 'lucide-react';

interface Voucher {
  id: number;
  code: string;
  value: string;
  status: 'Active' | 'Redeemed' | 'Inactive';
  type: string;
  updatedAt: string;
  receipt: string;
}

const AddVouchers = ({ onBack }: { onBack: () => void }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // --- STATE WITH NEW DATA STRUCTURE ---
  const [vouchers, setVouchers] = useState<Voucher[]>([
    { 
      id: 1, 
      code: "BOBA_FEST_2026", 
      value: "20%", 
      status: "Active", 
      type: "Percentage", 
      updatedAt: "2026-02-12", 
      receipt: "N/A" 
    },
    { 
      id: 2, 
      code: "LUCKY_100_OFF", 
      value: "100.00", 
      status: "Active", 
      type: "Fixed Amount", 
      updatedAt: "2026-02-10", 
      receipt: "N/A" 
    }
  ]);

  // --- FORM STATE ---
  const [newVoucher, setNewVoucher] = useState({
    number: '', // Maps to Code
    value: '',
    type: 'Percentage'
  });

  const handleAddVoucher = () => {
    if (!newVoucher.number || !newVoucher.value) return;

    const entry: Voucher = {
      id: Date.now(),
      code: newVoucher.number.toUpperCase(),
      value: newVoucher.value,
      status: "Active",
      type: newVoucher.type,
      updatedAt: new Date().toISOString().split('T')[0], // Current Date YYYY-MM-DD
      receipt: "Pending"
    };

    setVouchers([entry, ...vouchers]);
    setNewVoucher({ number: '', value: '', type: 'Percentage' });
    setIsModalOpen(false);
  };

  const handleImport = () => {
    // Placeholder for import logic
    alert("Import functionality would open file picker here.");
  };

  return (
    <div className="flex-1 bg-[#f8f6ff] h-full flex flex-col font-sans overflow-hidden">
      <TopNavbar />
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Ticket size={24} className="text-[#3b2063]" />
            </div>
            <div>
              <h1 className="text-xl font-black text-[#3b2063] uppercase tracking-widest">Voucher Management</h1>
              <p className="text-zinc-400 font-bold text-xs uppercase tracking-wider mt-1">Promo & Discount Codes</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            {/* PRINT BUTTON */}
            <button className="px-6 py-2.5 bg-[#1e40af] text-white rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-[#1e3a8a] flex items-center gap-2 shadow-lg transition-all active:scale-95">
              <Printer size={14} strokeWidth={3} /> Print Vouchers
            </button>
            
            {/* ADD BUTTON */}
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-2.5 bg-[#10b981] text-white rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-[#059669] flex items-center gap-2 shadow-lg transition-all active:scale-95"
            >
              <Plus size={14} strokeWidth={3} /> Add Vouchers
            </button>
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="px-6 py-4 text-[10px] font-black text-slate-600 uppercase tracking-widest">Code</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-600 uppercase tracking-widest text-right">Value</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-600 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-600 uppercase tracking-widest text-center">Type</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-600 uppercase tracking-widest text-center">Updated At</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-600 uppercase tracking-widest text-center">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {vouchers.map((v) => (
                <tr key={v.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-6 py-4 text-xs font-black text-[#3b2063]">{v.code}</td>
                  <td className="px-6 py-4 text-xs font-bold text-emerald-600 text-right">{v.value}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest ${
                      v.status === 'Active' ? 'bg-emerald-100 text-emerald-600' : 'bg-zinc-100 text-zinc-400'
                    }`}>
                      {v.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-500 text-center uppercase">{v.type}</td>
                  <td className="px-6 py-4 text-xs font-bold text-zinc-400 text-center">{v.updatedAt}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1 text-slate-400">
                      <FileText size={14} />
                      <span className="text-[10px] font-bold">{v.receipt}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-4 bg-zinc-50 border-t border-zinc-200">
            <button onClick={onBack} className="px-6 py-2 bg-zinc-200 text-zinc-500 rounded-lg font-black uppercase text-[10px] tracking-widest hover:bg-zinc-300 flex items-center gap-2 transition-all shadow-sm">
              <ArrowLeft size={14} strokeWidth={3} /> Back to Settings
            </button>
          </div>
        </div>
      </div>

      {/* === ADD VOUCHER MODAL === */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-[#3b2063] px-6 py-4 flex justify-between items-center">
              <h2 className="text-white font-black text-xs uppercase tracking-[0.2em]">Add New Voucher</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-white/70 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-8 space-y-6">
              
              {/* NUMBER (CODE) FIELD */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Number (Code)</label>
                <input 
                  type="text" 
                  value={newVoucher.number}
                  onChange={(e) => setNewVoucher({...newVoucher, number: e.target.value})}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500 transition-all"
                  placeholder="e.g. VOUCHER-001"
                />
              </div>

              {/* VALUE FIELD */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Value</label>
                <input 
                  type="text" 
                  value={newVoucher.value}
                  onChange={(e) => setNewVoucher({...newVoucher, value: e.target.value})}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500 transition-all"
                  placeholder="e.g. 20% or 100.00"
                />
              </div>

              {/* TYPE FIELD */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Type</label>
                <select 
                  value={newVoucher.type}
                  onChange={(e) => setNewVoucher({...newVoucher, type: e.target.value})}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="Percentage">Percentage (%)</option>
                  <option value="Fixed Amount">Fixed Amount (₱)</option>
                  <option value="Gift Certificate">Gift Certificate</option>
                </select>
              </div>

              {/* BUTTONS: ADD NEW, BACK, IMPORT */}
              <div className="flex flex-col gap-3 pt-4">
                <button 
                  onClick={handleAddVoucher}
                  className="w-full bg-[#10b981] hover:bg-[#059669] text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
                >
                  <Save size={14} /> Add New
                </button>
                
                <div className="flex gap-3">
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-500 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all"
                  >
                    Back
                  </button>
                  <button 
                    onClick={handleImport}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
                  >
                    <Upload size={14} /> Import
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddVouchers;