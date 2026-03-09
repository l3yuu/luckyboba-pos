"use client"

import { useState, useEffect } from 'react';
import logo from '../../assets/logo.png';
import { Pencil, ArrowLeft, Check, X, Save, Loader2 } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { getCache, setCache } from '../../utils/cache';

const CACHE_KEY = 'sales-settings';
const CACHE_TTL = 10 * 60 * 1000; // 10 min — settings rarely change

interface SalesSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  bcode: string;
  posType: string;
  transDateDay: boolean;
  serviceCharge: string;
  voucherSurge: string;
  scPwdDiscount: string;
  transPerLine: boolean;
  vatable: boolean;
  customerPoints: number;
  onlineCustomer: boolean;
  tableLayout: boolean;
}

const DEFAULT_SETTINGS: FormData = {
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
};

const RedCross = () => (
  <div className="w-4 h-4 rounded-[0.625rem] bg-red-100 flex items-center justify-center">
    <X size={12} className="text-red-500" strokeWidth={3} />
  </div>
);

const GreenCheck = () => (
  <div className="w-4 h-4 rounded-[0.625rem] bg-emerald-100 flex items-center justify-center">
    <Check size={12} className="text-emerald-600" strokeWidth={3} />
  </div>
);

const SkeletonRow = ({ wide = false }: { wide?: boolean }) => (
  <div className="flex justify-between items-center">
    <div className={`h-2.5 bg-zinc-200 rounded-[0.625rem] animate-pulse ${wide ? 'w-40' : 'w-28'}`} />
    <div className="h-2.5 bg-zinc-200 rounded-[0.625rem] animate-pulse w-16" />
  </div>
);

const SalesSettings = ({ isOpen, onClose }: SalesSettingsProps) => {
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [formData, setFormData] = useState<FormData>(
    getCache<FormData>(CACHE_KEY) ?? DEFAULT_SETTINGS
  );

  useEffect(() => {
    if (!isOpen) return;

    const cached = getCache<FormData>(CACHE_KEY);
    if (cached) {
      setFormData(cached);
      return;
    }

    const loadSettings = async () => {
      setIsSyncing(true);
      try {
        const res = await api.get('/settings');
        const data = res.data;

        if (Object.keys(data).length > 0) {
          const parsed: FormData = {
            bcode: data.bcode || '123456789',
            posType: data.posType || 'RESTO',
            transDateDay: data.transDateDay === 'true' || data.transDateDay === true,
            serviceCharge: data.serviceCharge || '0%',
            voucherSurge: data.voucherSurge || '0%',
            scPwdDiscount: data.scPwdDiscount || 'PAX',
            transPerLine: data.transPerLine === 'true' || data.transPerLine === true,
            vatable: data.vatable === 'true' || data.vatable === true,
            customerPoints: parseInt(data.customerPoints) || 0,
            onlineCustomer: data.onlineCustomer === 'true' || data.onlineCustomer === true,
            tableLayout: data.tableLayout === 'true' || data.tableLayout === true,
          };
          setCache<FormData>(CACHE_KEY, parsed, CACHE_TTL);
          setFormData(parsed);
        }
      } catch {
        showToast("Could not sync with server", "error");
      } finally {
        setIsSyncing(false);
      }
    };

    loadSettings();
  }, [isOpen, showToast]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.post('/settings', formData);
      setCache<FormData>(CACHE_KEY, formData, CACHE_TTL); // refresh TTL after save
      showToast("Configuration saved!", "success");
      setIsEditing(false);
    } catch {
      showToast("Failed to save changes", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-[0.625rem] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-auto animate-in zoom-in-95 duration-200 relative">

        <div className="flex-1 bg-zinc-50/50 p-8 border-r border-zinc-200 flex flex-col relative overflow-hidden rounded-[0.625rem]">

          {isEditing ? (
            <div className="flex-1 flex flex-col animate-in slide-in-from-right-8 duration-300">
              <h2 className="text-[#1e40af] font-black text-xs uppercase tracking-[0.15em] mb-6">Edit Configuration</h2>

              <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">BCODE</label>
                  <input type="text" value={formData.bcode} onChange={(e) => setFormData({...formData, bcode: e.target.value})} className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-[0.625rem] text-xs font-bold text-slate-700 outline-none focus:border-2 focus:border-[#3b2063] focus:ring-2 focus:ring-[#3b2063]/10 transition-all duration-200" />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">POS Type</label>
                  <input type="text" value="RESTO" disabled className="w-full px-3 py-2 bg-zinc-100 border border-zinc-200 rounded-[0.625rem] text-xs font-black text-slate-400 cursor-not-allowed" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Service Charge</label>
                    <select className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-[0.625rem] text-xs font-bold text-slate-700 outline-none focus:border-2 focus:border-[#3b2063] focus:ring-2 focus:ring-[#3b2063]/10 transition-all duration-200" value={formData.serviceCharge} onChange={(e) => setFormData({...formData, serviceCharge: e.target.value})}>
                      {['0%', '3%', '5%', '8%', '10%', '15%', '20%'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Voucher Surge</label>
                    <select className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-[0.625rem] text-xs font-bold text-slate-700 outline-none focus:border-2 focus:border-[#3b2063] focus:ring-2 focus:ring-[#3b2063]/10 transition-all duration-200" value={formData.voucherSurge} onChange={(e) => setFormData({...formData, voucherSurge: e.target.value})}>
                      {['0%', '5%', '10%', '15%', '20%', '25%', '30%'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">S.C / PWD Discount Charges</label>
                  <input type="text" value={formData.scPwdDiscount} onChange={(e) => setFormData({...formData, scPwdDiscount: e.target.value})} className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-[0.625rem] text-xs font-bold text-slate-700 outline-none focus:border-2 focus:border-[#3b2063] focus:ring-2 focus:ring-[#3b2063]/10 transition-all duration-200" />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Customer Points</label>
                  <input type="number" value={formData.customerPoints} onChange={(e) => setFormData({...formData, customerPoints: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-[0.625rem] text-xs font-bold text-slate-700 outline-none focus:border-2 focus:border-[#3b2063] focus:ring-2 focus:ring-[#3b2063]/10 transition-all duration-200" />
                </div>

                <div className="bg-white p-3 rounded-[0.625rem] border border-zinc-200 space-y-3">
                  {([
                    { key: 'transDateDay',   label: 'Trans. by Date/Day (24H Cutoff)' },
                    { key: 'transPerLine',   label: 'Transaction Per Line' },
                    { key: 'vatable',        label: 'Vatable (Non-VAT Reg)' },
                    { key: 'onlineCustomer', label: 'Online Customer' },
                    { key: 'tableLayout',    label: 'Table & Room Layout' },
                  ] as const).map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={formData[key] as boolean}
                        onChange={(e) => setFormData({...formData, [key]: e.target.checked})}
                        className="w-4 h-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-[10px] font-bold text-slate-600 uppercase group-hover:text-blue-600 transition-colors">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-zinc-200">
                <button onClick={handleSave} disabled={loading} className="flex-1 px-4 py-3 bg-[#3b2063] text-white rounded-[0.625rem] font-black uppercase text-[10px] tracking-widest hover:bg-[#2a1647] flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50">
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} strokeWidth={2.5} />}
                  Save
                </button>
                <button onClick={() => setIsEditing(false)} className="flex-1 px-4 py-3 bg-zinc-200 text-zinc-500 rounded-[0.625rem] font-black uppercase text-[10px] tracking-widest hover:bg-zinc-300 flex items-center justify-center gap-2 shadow-sm transition-all">
                  <ArrowLeft size={14} strokeWidth={2.5} />
                  Back
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col animate-in slide-in-from-left-8 duration-300">
              <h2 className="text-[#1e40af] font-black text-xs uppercase tracking-[0.15em] mb-8">Sales Configuration</h2>

              <div className={`flex-1 space-y-4 text-xs font-bold text-slate-600 overflow-y-auto relative ${isSyncing ? 'select-none' : ''}`}>
                <div className={`space-y-4 transition-all duration-300 ${isSyncing ? 'blur-[3px] opacity-40 pointer-events-none' : 'blur-0 opacity-100'}`}>
                  <div className="flex justify-between items-center"><span className="text-zinc-400 uppercase tracking-wider">Branch</span><span className="text-slate-800">Vipra sangandaan Quezon City</span></div>
                  <div className="flex justify-between items-center"><span className="text-zinc-400 uppercase tracking-wider">BCODE</span><span className="text-slate-800">{formData.bcode}</span></div>
                  <div className="flex justify-between items-center"><span className="text-zinc-400 uppercase tracking-wider">POS TYPE</span><span className="text-slate-800">{formData.posType}</span></div>
                  <div className="flex justify-between items-center"><span className="text-zinc-400 uppercase tracking-wider">Transaction by DATE/DAY</span>{formData.transDateDay ? <GreenCheck /> : <RedCross />}</div>
                  <div className="flex justify-between items-center"><span className="text-zinc-400 uppercase tracking-wider">Service Charge</span><span className="text-slate-800">{formData.serviceCharge}</span></div>
                  <div className="flex justify-between items-center"><span className="text-zinc-400 uppercase tracking-wider">Voucher Surge Charge</span><span className="text-slate-800">{formData.voucherSurge}</span></div>
                  <div className="flex justify-between items-center"><span className="text-zinc-400 uppercase tracking-wider">S.C./ PWD Discount</span><span className="text-slate-800">{formData.scPwdDiscount}</span></div>
                  <div className="flex justify-between items-center"><span className="text-zinc-400 uppercase tracking-wider">Transaction Per Line</span>{formData.transPerLine ? <GreenCheck /> : <RedCross />}</div>
                  <div className="flex justify-between items-center"><span className="text-zinc-400 uppercase tracking-wider">Vatable</span>{formData.vatable ? <GreenCheck /> : <RedCross />}</div>
                  <div className="flex justify-between items-center"><span className="text-zinc-400 uppercase tracking-wider">Customer Points</span><span className="text-slate-800">{formData.customerPoints}</span></div>
                  <div className="flex justify-between items-center"><span className="text-zinc-400 uppercase tracking-wider">Online Customer</span><span className="text-slate-800 lowercase">{formData.onlineCustomer ? 'on' : 'off'}</span></div>
                  <div className="flex justify-between items-center"><span className="text-zinc-400 uppercase tracking-wider">Table &amp; Room Layout</span>{formData.tableLayout ? <GreenCheck /> : <RedCross />}</div>
                </div>

                {isSyncing && (
                  <div className="absolute inset-0 space-y-4">
                    <SkeletonRow wide /><SkeletonRow /><SkeletonRow /><SkeletonRow wide />
                    <SkeletonRow /><SkeletonRow /><SkeletonRow wide /><SkeletonRow />
                    <SkeletonRow /><SkeletonRow /><SkeletonRow /><SkeletonRow wide />
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-8">
                <button onClick={() => setIsEditing(true)} disabled={isSyncing} className="flex-1 px-4 py-3 bg-[#3b2063] text-white rounded-[0.625rem] font-black uppercase text-[10px] tracking-widest hover:bg-[#2a1647] flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                  <Pencil size={14} strokeWidth={2.5} />Edit
                </button>
                <button onClick={onClose} className="flex-1 px-4 py-3 bg-zinc-500 text-white rounded-[0.625rem] font-black uppercase text-[10px] tracking-widest hover:bg-zinc-600 flex items-center justify-center gap-2 shadow-lg transition-all">
                  <ArrowLeft size={14} strokeWidth={2.5} />Back
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 p-8 bg-white flex flex-col items-center text-center">
          <h2 className="w-full text-left text-[#1e40af] font-black text-xs uppercase tracking-[0.15em] mb-8">Receipt Details</h2>
          <div className="flex-1 flex flex-col items-center justify-center gap-6 max-w-sm">
            <img src={logo} alt="Lucky Boba" className="w-24 h-auto object-contain mb-2" />
            <div className="space-y-1">
              <p className="text-xs text-slate-600 font-bold">Vipra Sangandaan Quezon City</p>
              <p className="text-xs text-slate-800 font-black uppercase tracking-wide">LUCKY BOBA MILKTEA</p>
              <p className="text-xs text-slate-600 font-bold">Quezon City</p>
            </div>
            <div className="space-y-2 py-6">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide leading-relaxed">LUCKY BOBA MILKTEA FOOD AND BEVERAGE TRADING</h3>
              <p className="text-xs text-slate-600 font-bold">Quezon City</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">For Franchise</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Email or Contact us on</p>
              <p className="text-xs text-slate-700 font-bold">luckyboba.franchise@gmail.com</p>
              <p className="text-xs text-slate-700 font-bold">0917199894</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SalesSettings;