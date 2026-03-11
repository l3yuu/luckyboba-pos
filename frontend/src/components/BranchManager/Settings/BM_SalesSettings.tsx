"use client"

import { useState, useEffect } from 'react';
import logo from '../../../assets/logo.png';
import { Pencil, ArrowLeft, Check, X, Save } from 'lucide-react';
import api from '../../../services/api';
import { useToast } from '../../../hooks/useToast';
import { getCache, setCache } from '../../../utils/cache';

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');
  .bm-root, .bm-root * { font-family: 'DM Sans', sans-serif !important; box-sizing: border-box; }
  .bm-label { font-size: 0.62rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; }
`;

const CACHE_KEY = 'sales-settings';
const CACHE_TTL = 10 * 60 * 1000;

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

// ── Reusable sub-components (defined OUTSIDE render) ─────────────────────────

const RedCross = () => (
  <div className="w-5 h-5 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center">
    <X size={11} className="text-red-400" strokeWidth={3} />
  </div>
);

const GreenCheck = () => (
  <div className="w-5 h-5 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
    <Check size={11} className="text-emerald-500" strokeWidth={3} />
  </div>
);

const SkeletonRow = ({ wide = false }: { wide?: boolean }) => (
  <div className="flex justify-between items-center py-0.5">
    <div className={`h-2 bg-gray-100 rounded-lg animate-pulse ${wide ? 'w-40' : 'w-28'}`} />
    <div className="h-2 bg-gray-100 rounded-lg animate-pulse w-16" />
  </div>
);

const inputCls = `w-full px-3 py-2.5 bg-white border border-gray-100 rounded-xl outline-none focus:border-[#ddd6f7] transition-all`;
const inputStyle = { fontSize: '0.82rem', fontWeight: 600, color: '#1a0f2e' } as React.CSSProperties;
const disabledInputCls = `w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl cursor-not-allowed`;

// ── Main Component ────────────────────────────────────────────────────────────

const BM_SalesSettings = ({ isOpen, onClose }: SalesSettingsProps) => {
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [formData, setFormData]   = useState<FormData>(
    getCache<FormData>(CACHE_KEY) ?? DEFAULT_SETTINGS
  );

  useEffect(() => {
    if (!isOpen) return;
    const cached = getCache<FormData>(CACHE_KEY);
    if (cached) { setFormData(cached); return; }

    const loadSettings = async () => {
      setIsSyncing(true);
      try {
        const res  = await api.get('/settings');
        const data = res.data;
        if (Object.keys(data).length > 0) {
          const parsed: FormData = {
            bcode:          data.bcode || '123456789',
            posType:        data.posType || 'RESTO',
            transDateDay:   data.transDateDay === 'true' || data.transDateDay === true,
            serviceCharge:  data.serviceCharge || '0%',
            voucherSurge:   data.voucherSurge || '0%',
            scPwdDiscount:  data.scPwdDiscount || 'PAX',
            transPerLine:   data.transPerLine === 'true' || data.transPerLine === true,
            vatable:        data.vatable === 'true' || data.vatable === true,
            customerPoints: parseInt(data.customerPoints) || 0,
            onlineCustomer: data.onlineCustomer === 'true' || data.onlineCustomer === true,
            tableLayout:    data.tableLayout === 'true' || data.tableLayout === true,
          };
          setCache<FormData>(CACHE_KEY, parsed, CACHE_TTL);
          setFormData(parsed);
        }
      } catch {
        showToast('Could not sync with server', 'error');
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
      setCache<FormData>(CACHE_KEY, formData, CACHE_TTL);
      showToast('Configuration saved!', 'success');
      setIsEditing(false);
    } catch {
      showToast('Failed to save changes', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const btnPrimary = {
    base: 'flex-1 h-10 bg-[#3b2063] hover:bg-[#2a1647] text-white rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed',
    style: { fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' } as React.CSSProperties,
  };
  const btnSecondary = {
    base: 'flex-1 h-10 bg-white border border-gray-100 hover:border-[#ddd6f7] text-[#3b2063] rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]',
    style: { fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' } as React.CSSProperties,
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="bm-root fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-auto animate-in zoom-in-95 duration-200">

          {/* ── Left panel: config ── */}
          <div className="flex-1 bg-[#faf9ff] p-8 border-r border-gray-100 flex flex-col relative overflow-hidden">

            {isEditing ? (
              <div className="flex-1 flex flex-col animate-in slide-in-from-right-8 duration-300">
                <div className="mb-6">
                  <p className="bm-label" style={{ color: '#a1a1aa' }}>Settings</p>
                  <h2 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1a0f2e', letterSpacing: '-0.025em', margin: 0, marginTop: 2 }}>
                    Edit Configuration
                  </h2>
                </div>

                <div className="flex-1 overflow-y-auto pr-1 space-y-4">
                  {/* BCODE */}
                  <div className="space-y-1.5">
                    <p className="bm-label" style={{ color: '#a1a1aa' }}>BCODE</p>
                    <input type="text" value={formData.bcode}
                      onChange={e => setFormData({ ...formData, bcode: e.target.value })}
                      className={inputCls} style={inputStyle} />
                  </div>

                  {/* POS Type — disabled */}
                  <div className="space-y-1.5">
                    <p className="bm-label" style={{ color: '#a1a1aa' }}>POS Type</p>
                    <input type="text" value="RESTO" disabled
                      className={disabledInputCls}
                      style={{ fontSize: '0.82rem', fontWeight: 700, color: '#a1a1aa' }} />
                  </div>

                  {/* Service Charge + Voucher Surge */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <p className="bm-label" style={{ color: '#a1a1aa' }}>Service Charge</p>
                      <select value={formData.serviceCharge}
                        onChange={e => setFormData({ ...formData, serviceCharge: e.target.value })}
                        className={`${inputCls} cursor-pointer`} style={inputStyle}>
                        {['0%', '3%', '5%', '8%', '10%', '15%', '20%'].map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <p className="bm-label" style={{ color: '#a1a1aa' }}>Voucher Surge</p>
                      <select value={formData.voucherSurge}
                        onChange={e => setFormData({ ...formData, voucherSurge: e.target.value })}
                        className={`${inputCls} cursor-pointer`} style={inputStyle}>
                        {['0%', '5%', '10%', '15%', '20%', '25%', '30%'].map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* SC/PWD */}
                  <div className="space-y-1.5">
                    <p className="bm-label" style={{ color: '#a1a1aa' }}>S.C / PWD Discount Charges</p>
                    <input type="text" value={formData.scPwdDiscount}
                      onChange={e => setFormData({ ...formData, scPwdDiscount: e.target.value })}
                      className={inputCls} style={inputStyle} />
                  </div>

                  {/* Customer Points */}
                  <div className="space-y-1.5">
                    <p className="bm-label" style={{ color: '#a1a1aa' }}>Customer Points</p>
                    <input type="number" value={formData.customerPoints}
                      onChange={e => setFormData({ ...formData, customerPoints: parseInt(e.target.value) || 0 })}
                      className={inputCls} style={inputStyle} />
                  </div>

                  {/* Toggles */}
                  <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
                    {([
                      { key: 'transDateDay',   label: 'Trans. by Date/Day (24H Cutoff)' },
                      { key: 'transPerLine',   label: 'Transaction Per Line' },
                      { key: 'vatable',        label: 'Vatable (Non-VAT Reg)' },
                      { key: 'onlineCustomer', label: 'Online Customer' },
                      { key: 'tableLayout',    label: 'Table & Room Layout' },
                    ] as const).map(({ key, label }) => (
                      <label key={key} className="flex items-center gap-3 cursor-pointer group">
                        <div
                          onClick={() => setFormData({ ...formData, [key]: !formData[key] })}
                          className={`w-8 h-4 rounded-full transition-all cursor-pointer flex items-center px-0.5 ${
                            formData[key] ? 'bg-[#3b2063]' : 'bg-gray-200'
                          }`}
                        >
                          <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-all duration-200 ${
                            formData[key] ? 'translate-x-4' : 'translate-x-0'
                          }`} />
                        </div>
                        <span className="bm-label" style={{ color: formData[key] ? '#1a0f2e' : '#a1a1aa', textTransform: 'none', letterSpacing: '0.02em', fontSize: '0.78rem' }}>
                          {label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
                  <button onClick={handleSave} disabled={loading} className={btnPrimary.base} style={btnPrimary.style}>
                    {loading ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={13} strokeWidth={2.5} />}
                    Save Changes
                  </button>
                  <button onClick={() => setIsEditing(false)} className={btnSecondary.base} style={btnSecondary.style}>
                    <ArrowLeft size={13} strokeWidth={2.5} />
                    Back
                  </button>
                </div>
              </div>

            ) : (
              <div className="flex-1 flex flex-col animate-in slide-in-from-left-8 duration-300">
                <div className="mb-6">
                  <p className="bm-label" style={{ color: '#a1a1aa' }}>Settings</p>
                  <h2 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1a0f2e', letterSpacing: '-0.025em', margin: 0, marginTop: 2 }}>
                    Sales Configuration
                  </h2>
                </div>

                <div className={`flex-1 overflow-y-auto relative ${isSyncing ? 'select-none' : ''}`}>
                  <div className={`space-y-3 transition-all duration-300 ${isSyncing ? 'blur-[3px] opacity-40 pointer-events-none' : ''}`}>
                    {([
                      { label: 'Branch',                   value: 'Vipra Sangandaan, Quezon City' },
                      { label: 'BCODE',                    value: formData.bcode },
                      { label: 'POS Type',                 value: formData.posType },
                      { label: 'Transaction by Date/Day',  value: null, bool: formData.transDateDay },
                      { label: 'Service Charge',           value: formData.serviceCharge },
                      { label: 'Voucher Surge Charge',     value: formData.voucherSurge },
                      { label: 'S.C. / PWD Discount',      value: formData.scPwdDiscount },
                      { label: 'Transaction Per Line',     value: null, bool: formData.transPerLine },
                      { label: 'Vatable',                  value: null, bool: formData.vatable },
                      { label: 'Customer Points',          value: formData.customerPoints },
                      { label: 'Online Customer',          value: null, bool: formData.onlineCustomer },
                      { label: 'Table & Room Layout',      value: null, bool: formData.tableLayout },
                    ] as { label: string; value?: string | number | null; bool?: boolean }[]).map((row, i) => (
                      <div key={i} className="flex justify-between items-center py-1 border-b border-gray-50 last:border-0">
                        <span className="bm-label" style={{ color: '#a1a1aa' }}>{row.label}</span>
                        {row.value !== null && row.value !== undefined
                          ? <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1a0f2e' }}>{row.value}</span>
                          : (row.bool ? <GreenCheck /> : <RedCross />)
                        }
                      </div>
                    ))}
                  </div>

                  {isSyncing && (
                    <div className="absolute inset-0 space-y-4 pt-1">
                      {[true,false,false,true,false,false,true,false,false,false,false,true].map((w,i) => (
                        <SkeletonRow key={i} wide={w} />
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
                  <button onClick={() => setIsEditing(true)} disabled={isSyncing} className={btnPrimary.base} style={btnPrimary.style}>
                    <Pencil size={13} strokeWidth={2.5} />
                    Edit
                  </button>
                  <button onClick={onClose} className={btnSecondary.base} style={btnSecondary.style}>
                    <ArrowLeft size={13} strokeWidth={2.5} />
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Right panel: receipt preview ── */}
          <div className="flex-1 p-8 bg-white flex flex-col">
            <div className="mb-6">
              <p className="bm-label" style={{ color: '#a1a1aa' }}>Preview</p>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1a0f2e', letterSpacing: '-0.025em', margin: 0, marginTop: 2 }}>
                Receipt Details
              </h2>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center gap-5">
              {/* Receipt card */}
              <div className="bg-[#faf9ff] border border-gray-100 rounded-2xl p-8 w-full max-w-xs flex flex-col items-center text-center gap-4">
                <img src={logo} alt="Lucky Boba" className="w-20 h-auto object-contain" />

                <div className="space-y-0.5">
                  <p style={{ fontSize: '0.78rem', fontWeight: 600, color: '#71717a' }}>Vipra Sangandaan, Quezon City</p>
                  <p style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1a0f2e', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    Lucky Boba Milktea
                  </p>
                  <p style={{ fontSize: '0.78rem', fontWeight: 600, color: '#71717a' }}>Quezon City</p>
                </div>

                <div className="w-full border-t border-dashed border-gray-200 pt-4 space-y-1">
                  <p style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1a0f2e', letterSpacing: '0.02em', textTransform: 'uppercase', lineHeight: 1.4 }}>
                    Lucky Boba Milktea Food and Beverage Trading
                  </p>
                  <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#71717a' }}>Quezon City</p>
                </div>

                <div className="w-full border-t border-dashed border-gray-200 pt-4 space-y-1 text-center">
                  <p className="bm-label" style={{ color: '#a1a1aa' }}>For Franchise</p>
                  <p className="bm-label" style={{ color: '#a1a1aa' }}>Email or contact us on</p>
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#3b2063' }}>luckyboba.franchise@gmail.com</p>
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#3b2063' }}>0917199894</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default BM_SalesSettings;