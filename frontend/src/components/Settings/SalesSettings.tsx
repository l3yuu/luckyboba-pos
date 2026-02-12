import { useState } from 'react';
import logo from '../../assets/logo.png';
import { Pencil, ArrowLeft, Check, X, Save } from 'lucide-react';

interface SalesSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

// --- HELPER COMPONENTS (Moved Outside) ---

const RedCross = () => (
  <div className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center">
    <X size={12} className="text-red-500" strokeWidth={3} />
  </div>
);

const GreenCheck = () => (
  <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center">
    <Check size={12} className="text-emerald-600" strokeWidth={3} />
  </div>
);

// --- MAIN COMPONENT ---

const SalesSettings = ({ isOpen, onClose }: SalesSettingsProps) => {
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    bcode: '123456789',
    posType: 'RESTO',
    transDateDay: false,
    serviceCharge: '0%',
    voucherSurge: '0%',
    scPwdDiscount: 'PAX',
    transPerLine: false,
    vatable: false,
    customerPoints: 0,
    onlineCustomer: true,
    tableLayout: false,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-auto animate-in zoom-in-95 duration-200">
        
        {/* === LEFT COLUMN: Sales Configuration === */}
        <div className="flex-1 bg-zinc-50/50 p-8 border-r border-zinc-200 flex flex-col relative overflow-hidden">
          
          {isEditing ? (
            /* === EDIT MODE === */
            <div className="flex-1 flex flex-col animate-in slide-in-from-right-8 duration-300">
              <h2 className="text-[#1e40af] font-black text-xs uppercase tracking-[0.15em] mb-6">Edit Configuration</h2>
              
              <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                
                {/* BCODE */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">BCODE</label>
                  <input type="text" value={formData.bcode} onChange={(e) => setFormData({...formData, bcode: e.target.value})} className="w-full px-3 py-2 bg-white border border-zinc-300 rounded text-xs font-bold text-slate-700 outline-none focus:border-blue-500" />
                </div>

                {/* POS TYPE */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">POS Type</label>
                  <input type="text" value="RESTO" disabled className="w-full px-3 py-2 bg-zinc-100 border border-zinc-200 rounded text-xs font-black text-slate-400 cursor-not-allowed" />
                </div>

                {/* DROPDOWNS ROW */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Service Charge</label>
                    <select className="w-full px-3 py-2 bg-white border border-zinc-300 rounded text-xs font-bold text-slate-700 outline-none focus:border-blue-500" value={formData.serviceCharge} onChange={(e) => setFormData({...formData, serviceCharge: e.target.value})}>
                      {['0%', '3%', '5%', '8%', '10%', '15%', '20%'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Voucher Surge</label>
                    <select className="w-full px-3 py-2 bg-white border border-zinc-300 rounded text-xs font-bold text-slate-700 outline-none focus:border-blue-500" value={formData.voucherSurge} onChange={(e) => setFormData({...formData, voucherSurge: e.target.value})}>
                      {['0%', '5%', '10%', '15%', '20%', '25%', '30%'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                </div>

                {/* S.C / PWD */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">S.C / PWD Discount Charges</label>
                  <input type="text" value={formData.scPwdDiscount} onChange={(e) => setFormData({...formData, scPwdDiscount: e.target.value})} className="w-full px-3 py-2 bg-white border border-zinc-300 rounded text-xs font-bold text-slate-700 outline-none focus:border-blue-500" />
                </div>

                {/* CUSTOMER POINTS */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Customer Points</label>
                  <input type="number" value={formData.customerPoints} onChange={(e) => setFormData({...formData, customerPoints: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 bg-white border border-zinc-300 rounded text-xs font-bold text-slate-700 outline-none focus:border-blue-500" />
                </div>

                {/* CHECKBOXES GROUP */}
                <div className="bg-white p-3 rounded-lg border border-zinc-200 space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" checked={formData.transDateDay} onChange={(e) => setFormData({...formData, transDateDay: e.target.checked})} className="w-4 h-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-[10px] font-bold text-slate-600 uppercase group-hover:text-blue-600 transition-colors">Trans. by Date/Day (24H Cutoff)</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" checked={formData.transPerLine} onChange={(e) => setFormData({...formData, transPerLine: e.target.checked})} className="w-4 h-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-[10px] font-bold text-slate-600 uppercase group-hover:text-blue-600 transition-colors">Transaction Per Line</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" checked={formData.vatable} onChange={(e) => setFormData({...formData, vatable: e.target.checked})} className="w-4 h-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-[10px] font-bold text-slate-600 uppercase group-hover:text-blue-600 transition-colors">Vatable (Non-VAT Reg)</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" checked={formData.onlineCustomer} onChange={(e) => setFormData({...formData, onlineCustomer: e.target.checked})} className="w-4 h-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-[10px] font-bold text-slate-600 uppercase group-hover:text-blue-600 transition-colors">Online Customer</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" checked={formData.tableLayout} onChange={(e) => setFormData({...formData, tableLayout: e.target.checked})} className="w-4 h-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-[10px] font-bold text-slate-600 uppercase group-hover:text-blue-600 transition-colors">Table & Room Layout</span>
                  </label>
                </div>

              </div>

              {/* ACTION BUTTONS */}
              <div className="flex gap-3 mt-6 pt-4 border-t border-zinc-200">
                <button 
                  onClick={() => {
                    console.log("Saving...", formData);
                    setIsEditing(false); 
                  }} 
                  className="flex-1 px-4 py-3 bg-[#10b981] text-white rounded-lg font-black uppercase text-[10px] tracking-widest hover:bg-[#059669] flex items-center justify-center gap-2 shadow-md transition-all"
                >
                  <Save size={14} strokeWidth={2.5} />
                  Save
                </button>
                <button 
                  onClick={() => setIsEditing(false)} 
                  className="flex-1 px-4 py-3 bg-zinc-200 text-zinc-500 rounded-lg font-black uppercase text-[10px] tracking-widest hover:bg-zinc-300 flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <ArrowLeft size={14} strokeWidth={2.5} />
                  Back
                </button>
              </div>
            </div>
          ) : (
            /* === VIEW MODE (Default) === */
            <div className="flex-1 flex flex-col animate-in slide-in-from-left-8 duration-300">
              <h2 className="text-[#1e40af] font-black text-xs uppercase tracking-[0.15em] mb-8">Sales Configuration</h2>
              
              <div className="flex-1 space-y-4 text-xs font-bold text-slate-600 overflow-y-auto">
                 <div className="flex justify-between items-center"><span className="text-zinc-400 uppercase tracking-wider">Branch</span> <span className="text-slate-800">Vipra sangandaan Quezon City</span></div>
                 <div className="flex justify-between items-center"><span className="text-zinc-400 uppercase tracking-wider">POS TYPE</span> <span className="text-slate-800">{formData.posType}</span></div>
                 <div className="flex justify-between items-center"><span className="text-zinc-400 uppercase tracking-wider">Transaction by DATE/DAY</span> {formData.transDateDay ? <GreenCheck /> : <RedCross />}</div>
                 <div className="flex justify-between items-center"><span className="text-zinc-400 uppercase tracking-wider">Service Charge</span> <span className="text-slate-800">{formData.serviceCharge}</span></div>
                 <div className="flex justify-between items-center"><span className="text-zinc-400 uppercase tracking-wider">Voucher Surge Charge</span> <span className="text-slate-800">{formData.voucherSurge}</span></div>
                 <div className="flex justify-between items-center"><span className="text-zinc-400 uppercase tracking-wider">S.C./ PWD Discount</span> <span className="text-slate-800">{formData.scPwdDiscount}</span></div>
                 <div className="flex justify-between items-center"><span className="text-zinc-400 uppercase tracking-wider">Transaction Per Line</span> {formData.transPerLine ? <GreenCheck /> : <RedCross />}</div>
                 <div className="flex justify-between items-center"><span className="text-zinc-400 uppercase tracking-wider">Vatable</span> {formData.vatable ? <GreenCheck /> : <RedCross />}</div>
                 <div className="flex justify-between items-center"><span className="text-zinc-400 uppercase tracking-wider">Customer Points</span> <span className="text-slate-800">{formData.customerPoints}</span></div>
                 <div className="flex justify-between items-center"><span className="text-zinc-400 uppercase tracking-wider">Online Customer</span> <span className="text-slate-800 lowercase">{formData.onlineCustomer ? 'on' : 'off'}</span></div>
                 <div className="flex justify-between items-center"><span className="text-zinc-400 uppercase tracking-wider">Table & Room Layout</span> {formData.tableLayout ? <GreenCheck /> : <RedCross />}</div>
              </div>

              <div className="flex gap-3 mt-8">
                <button 
                  onClick={() => setIsEditing(true)} 
                  className="flex-1 px-4 py-3 bg-[#1e40af] text-white rounded-lg font-black uppercase text-[10px] tracking-widest hover:bg-[#1e3a8a] flex items-center justify-center gap-2 shadow-lg transition-all"
                >
                   <Pencil size={14} strokeWidth={2.5} />
                   Edit
                </button>
                <button onClick={onClose} className="flex-1 px-4 py-3 bg-zinc-500 text-white rounded-lg font-black uppercase text-[10px] tracking-widest hover:bg-zinc-600 flex items-center justify-center gap-2 shadow-lg transition-all">
                   <ArrowLeft size={14} strokeWidth={2.5} />
                   Back
                </button>
              </div>
            </div>
          )}
        </div>

        {/* === RIGHT COLUMN: Receipt Details (Static) === */}
        <div className="flex-1 p-8 bg-white flex flex-col items-center text-center">
          <h2 className="w-full text-left text-[#1e40af] font-black text-xs uppercase tracking-[0.15em] mb-8">Receipt Details</h2>
          
          <div className="flex-1 flex flex-col items-center justify-center gap-6 max-w-sm">
             <img src={logo} alt="Lucky Boba" className="w-24 h-auto object-contain mb-2" />
             
             <div className="space-y-1">
               <p className="text-xs text-slate-600 font-bold">Vipra sangandaan Quezon City</p>
               <p className="text-xs text-slate-800 font-black uppercase tracking-wide">LUCKY BOBA MILKTEA</p>
               <p className="text-xs text-slate-600 font-bold">Quezon City</p>
             </div>

             <div className="space-y-2 py-6">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide leading-relaxed">
                  LUCKY BOBA MILKTEA FOOD AND BEVERAGE TRADING
                </h3>
                <p className="text-xs text-slate-600 font-bold">Quezon City</p>
             </div>

             <div className="space-y-1">
               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">For Franchise</p>
               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Email or Contact us on</p>
               <p className="text-xs text-slate-700 font-bold">luckybobafranchising@gmail.com</p>
               <p className="text-xs text-slate-700 font-bold">09260029894</p>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SalesSettings;