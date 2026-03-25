"use client"

import { useState, useEffect } from 'react';
import logo from '../../../assets/logo.png';
import { ArrowLeft, Check, X } from 'lucide-react';
import api from '../../../services/api';
import { useToast } from '../../../hooks/useToast';
import { getCache, setCache } from '../../../utils/cache';

const CACHE_KEY = 'sales-settings';
const CACHE_TTL = 10 * 60 * 1000;

interface SalesSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: string;
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

const SalesSettings = ({ isOpen, onClose, userRole }: SalesSettingsProps) => {
  const { showToast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  const [formData, setFormData] = useState<FormData>(
    getCache<FormData>(CACHE_KEY) ?? DEFAULT_SETTINGS
  );

  useEffect(() => {
    if (!isOpen) return;

    // Cashiers don't have access to settings — skip API call entirely
    if (userRole === 'cashier') return;

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
  }, [isOpen, userRole, showToast]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-[0.625rem] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-auto animate-in zoom-in-95 duration-200 relative">

        {/* Left: Settings View */}
        <div className="flex-1 bg-[#f5f0ff] p-8 border-r border-[#e9d5ff] flex flex-col relative overflow-hidden rounded-[0.625rem]">
          <div className="flex-1 flex flex-col animate-in slide-in-from-left-8 duration-300">
            <h2 className="text-[#7c14d4] font-black text-xs uppercase tracking-[0.15em] mb-8">Sales Configuration</h2>

            <div className={`flex-1 space-y-4 text-xs font-bold text-slate-600 overflow-y-auto relative ${isSyncing ? 'select-none' : ''}`}>
              <div className={`space-y-4 transition-all duration-300 ${isSyncing ? 'blur-[3px] opacity-40 pointer-events-none' : 'blur-0 opacity-100'}`}>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400 uppercase tracking-wider">Branch</span>
                  <span className="text-slate-800">Vipra sangandaan Quezon City</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400 uppercase tracking-wider">BCODE</span>
                  <span className="text-slate-800">{formData.bcode}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400 uppercase tracking-wider">POS TYPE</span>
                  <span className="text-slate-800">{formData.posType}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400 uppercase tracking-wider">Transaction by DATE/DAY</span>
                  {formData.transDateDay ? <GreenCheck /> : <RedCross />}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400 uppercase tracking-wider">Service Charge</span>
                  <span className="text-slate-800">{formData.serviceCharge}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400 uppercase tracking-wider">Voucher Surge Charge</span>
                  <span className="text-slate-800">{formData.voucherSurge}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400 uppercase tracking-wider">S.C./ PWD Discount</span>
                  <span className="text-slate-800">{formData.scPwdDiscount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400 uppercase tracking-wider">Transaction Per Line</span>
                  {formData.transPerLine ? <GreenCheck /> : <RedCross />}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400 uppercase tracking-wider">Vatable</span>
                  {formData.vatable ? <GreenCheck /> : <RedCross />}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400 uppercase tracking-wider">Customer Points</span>
                  <span className="text-slate-800">{formData.customerPoints}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400 uppercase tracking-wider">Online Customer</span>
                  <span className="text-slate-800 lowercase">{formData.onlineCustomer ? 'on' : 'off'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400 uppercase tracking-wider">Table &amp; Room Layout</span>
                  {formData.tableLayout ? <GreenCheck /> : <RedCross />}
                </div>
              </div>

              {isSyncing && (
                <div className="absolute inset-0 space-y-4">
                  <SkeletonRow wide /><SkeletonRow /><SkeletonRow /><SkeletonRow wide />
                  <SkeletonRow /><SkeletonRow /><SkeletonRow wide /><SkeletonRow />
                  <SkeletonRow /><SkeletonRow /><SkeletonRow /><SkeletonRow wide />
                </div>
              )}
            </div>

            <div className="mt-8">
              <button
                onClick={onClose}
                className="w-full px-4 py-3 bg-[#7c14d4] text-white rounded-[0.625rem] font-black uppercase text-[10px] tracking-widest hover:bg-[#6a12b8] flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                <ArrowLeft size={14} strokeWidth={2.5} />Close
              </button>
            </div>
          </div>
        </div>

        {/* Right: Receipt Details */}
        <div className="flex-1 p-8 bg-white flex flex-col items-center text-center">
          <h2 className="w-full text-left text-[#7c14d4] font-black text-xs uppercase tracking-[0.15em] mb-8">Receipt Details</h2>
          <div className="flex-1 flex flex-col items-center justify-center gap-6 max-w-sm">
            <img src={logo} alt="Lucky Boba" className="w-24 h-auto object-contain mb-2" />
            <div className="space-y-1">
              <p className="text-xs text-slate-600 font-bold">Vipra Sangandaan Quezon City</p>
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
              <p className="text-xs text-slate-700 font-bold">luckyboba.franchise@gmail.com</p>
              <p className="text-xs text-slate-700 font-bold">09171699894</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SalesSettings;