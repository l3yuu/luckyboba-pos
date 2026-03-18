"use client"

import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Ticket, Plus, Printer, X, Save, Upload, FileText, Loader2 } from 'lucide-react';
import api from '../../../services/api';
import { useToast } from '../../../hooks/useToast';
import { getCache, setCache } from '../../../utils/cache';
import { AxiosError } from 'axios';

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');
  .bm-root, .bm-root * { font-family: 'DM Sans', sans-serif !important; box-sizing: border-box; }
  .bm-label { font-size: 0.62rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; }
`;

const CACHE_KEY = 'vouchers';
const CACHE_TTL = 3 * 60 * 1000;

interface Voucher {
  id: number;
  code: string;
  value: string;
  status: 'Active' | 'Redeemed' | 'Inactive';
  type: string;
  updated_at: string;
  receipt: string;
}

interface BackendError { message?: string; }

const inputCls  = `w-full px-4 py-2.5 rounded-xl border border-gray-100 outline-none focus:border-[#ddd6f7] transition-all bg-white`;
const inputStyle = { fontSize: '0.88rem', fontWeight: 600, color: '#1a0f2e' } as React.CSSProperties;

const StatusBadge = ({ status }: { status: Voucher['status'] }) => {
  const map = {
    Active:   { bg: '#f0fdf4', color: '#16a34a', dot: '#22c55e', border: '#bbf7d0' },
    Redeemed: { bg: '#eff6ff', color: '#2563eb', dot: '#3b82f6', border: '#bfdbfe' },
    Inactive: { bg: '#f4f4f5', color: '#71717a', dot: '#a1a1aa', border: '#e4e4e7' },
  };
  const s = map[status];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1"
      style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
        background: s.bg, color: s.color, borderColor: s.border }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
      {status}
    </span>
  );
};

const BM_AddVouchers = ({ onBack }: { onBack: () => void }) => {
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [isFetching, setIsFetching]   = useState(!getCache<Voucher[]>(CACHE_KEY));
  const [vouchers, setVouchers]       = useState<Voucher[]>(getCache<Voucher[]>(CACHE_KEY) ?? []);
  const [newVoucher, setNewVoucher]   = useState({ number: '', value: '', type: 'Percentage' });

  const fetchVouchers = useCallback(async () => {
    setIsFetching(true);
    try {
      const response = await api.get('/vouchers');
      const data: Voucher[] = response.data;
      setCache<Voucher[]>(CACHE_KEY, data, CACHE_TTL);
      setVouchers(data);
    } catch (err) {
      console.error('Fetch Error:', err);
      showToast('Could not load vouchers from database', 'error');
    } finally {
      setIsFetching(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (getCache<Voucher[]>(CACHE_KEY)) return;
    void fetchVouchers();
  }, [fetchVouchers]);

  // ── Print ─────────────────────────────────────────────────────────────────

  const handlePrintVouchers = () => {
    if (vouchers.length === 0) { showToast('No vouchers to print', 'warning'); return; }
    const printWindow = window.open('', '_blank');
    if (!printWindow) { showToast('Please allow pop-ups to print', 'warning'); return; }

    const printDate   = new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit' });
    const totalActive   = vouchers.filter(v => v.status === 'Active').length;
    const totalRedeemed = vouchers.filter(v => v.status === 'Redeemed').length;
    const totalInactive = vouchers.filter(v => v.status === 'Inactive').length;

    const rows = vouchers.map(v => {
      const statusStyle = v.status === 'Active'   ? 'background:#d1fae5;color:#059669;'
                        : v.status === 'Redeemed' ? 'background:#dbeafe;color:#2563eb;'
                        :                           'background:#f4f4f5;color:#a1a1aa;';
      const updatedAt = v.updated_at ? new Date(v.updated_at).toISOString().split('T')[0] : 'N/A';
      return `<tr>
        <td style="padding:10px 14px;font-weight:900;color:#3b2063;">${v.code}</td>
        <td style="padding:10px 14px;font-weight:700;color:#10b981;text-align:right;">${v.value}</td>
        <td style="padding:10px 14px;text-align:center;"><span style="padding:3px 9px;border-radius:4px;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:0.08em;${statusStyle}">${v.status}</span></td>
        <td style="padding:10px 14px;text-align:center;text-transform:uppercase;color:#64748b;font-size:11px;">${v.type}</td>
        <td style="padding:10px 14px;text-align:center;color:#a1a1aa;font-size:11px;">${updatedAt}</td>
        <td style="padding:10px 14px;text-align:center;color:#94a3b8;font-size:11px;">${v.receipt}</td>
      </tr>`;
    }).join('');

    printWindow.document.write(`<!DOCTYPE html><html><head><title>Voucher Report — Lucky Boba POS</title>
      <style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:'Segoe UI',Arial,sans-serif;background:#fff;color:#1e293b;font-size:12px;}
      .header{background:#3b2063;color:white;padding:24px 32px;display:flex;justify-content:space-between;align-items:center;}
      .header-title{font-size:18px;font-weight:900;text-transform:uppercase;letter-spacing:0.15em;}
      .header-sub{font-size:10px;font-weight:600;opacity:0.6;text-transform:uppercase;letter-spacing:0.1em;margin-top:4px;}
      .header-meta{text-align:right;font-size:10px;opacity:0.75;line-height:1.6;}
      .body{padding:24px 32px;}.summary{display:flex;gap:16px;margin-bottom:24px;}
      .summary-card{background:#f8f6ff;border:1px solid #e4e0f0;border-radius:10px;padding:12px 20px;flex:1;text-align:center;}
      .summary-card .num{font-size:22px;font-weight:900;}.summary-card .lbl{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#9ca3af;margin-top:2px;}
      table{width:100%;border-collapse:collapse;}thead tr{background:#f1f5f9;}
      th{padding:10px 14px;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:0.12em;color:#475569;border-bottom:2px solid #e2e8f0;}
      th:nth-child(2){text-align:right;}th:nth-child(3),th:nth-child(4),th:nth-child(5),th:nth-child(6){text-align:center;}
      tbody tr{border-bottom:1px solid #f1f5f9;}tbody tr:last-child{border-bottom:none;}
      .footer{margin-top:32px;padding-top:12px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;font-size:9px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;}
      @media print{@page{margin:12mm 16mm;}body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}</style></head>
      <body><div class="header"><div><div class="header-title">Voucher Report</div><div class="header-sub">Lucky Boba POS System — Promo &amp; Discount Codes</div></div>
      <div class="header-meta"><div>Printed by: Administrator</div><div>${printDate}</div></div></div>
      <div class="body"><div class="summary">
        <div class="summary-card"><div class="num" style="color:#3b2063;">${vouchers.length}</div><div class="lbl">Total Vouchers</div></div>
        <div class="summary-card"><div class="num" style="color:#10b981;">${totalActive}</div><div class="lbl">Active</div></div>
        <div class="summary-card"><div class="num" style="color:#2563eb;">${totalRedeemed}</div><div class="lbl">Redeemed</div></div>
        <div class="summary-card"><div class="num" style="color:#a1a1aa;">${totalInactive}</div><div class="lbl">Inactive</div></div>
      </div>
      <table><thead><tr><th>Code</th><th>Value</th><th>Status</th><th>Type</th><th>Updated At</th><th>Receipt</th></tr></thead>
      <tbody>${rows}</tbody></table>
      <div class="footer"><span>Lucky Boba &copy; ${new Date().getFullYear()}</span><span>Total records: ${vouchers.length}</span></div>
      </div><script>window.onload=()=>{window.print();window.onafterprint=()=>window.close();};</script></body></html>`);
    printWindow.document.close();
  };

  // ── Add ───────────────────────────────────────────────────────────────────

  const handleAddVoucher = async () => {
    if (!newVoucher.number || !newVoucher.value) { showToast('Please fill in all fields', 'warning'); return; }
    setLoading(true);
    try {
      const response = await api.post('/vouchers', { code: newVoucher.number, value: newVoucher.value, type: newVoucher.type });
      const updated = [response.data, ...vouchers];
      setVouchers(updated);
      setCache<Voucher[]>(CACHE_KEY, updated, CACHE_TTL);
      showToast('Voucher added successfully!', 'success');
      setNewVoucher({ number: '', value: '', type: 'Percentage' });
      setIsModalOpen(false);
    } catch (err) {
      const axiosError = err as AxiosError<BackendError>;
      showToast(axiosError.response?.data?.message || 'Error saving voucher', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{STYLES}</style>
      <div className="bm-root flex-1 bg-[#f5f4f8] h-full flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto px-5 md:px-8 py-5 flex flex-col gap-5">

          {/* ── Header ── */}
          <div className="flex items-center justify-between">
            <div>
              <p className="bm-label" style={{ color: '#a1a1aa' }}>Settings</p>
              <h1 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1a0f2e', letterSpacing: '-0.03em', margin: 0, marginTop: 2 }}>
                Vouchers
              </h1>
            </div>
            <div className="flex gap-2">
              <button onClick={handlePrintVouchers}
                className="flex items-center gap-2 h-9 px-4 bg-white border border-gray-100 hover:border-[#ddd6f7] text-[#3b2063] transition-all rounded-xl active:scale-[0.98]"
                style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                <Printer size={13} strokeWidth={2.5} /> Print
              </button>
              <button onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 h-9 px-4 bg-[#3b2063] hover:bg-[#2a1647] text-white transition-all rounded-xl active:scale-[0.98] shadow-sm"
                style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                <Plus size={13} strokeWidth={2.5} /> Add Voucher
              </button>
            </div>
          </div>

          {/* ── Table card ── */}
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm flex flex-col flex-1">
            <table className="w-full text-left border-collapse">
              <thead className="border-b border-gray-100">
                <tr>
                  {['Code', 'Value', 'Status', 'Type', 'Updated At', 'Receipt'].map((h, i) => (
                    <th key={h} className={`px-6 py-3.5 ${i === 1 ? 'text-right' : i >= 2 ? 'text-center' : ''}`}>
                      <span className="bm-label" style={{ color: '#a1a1aa' }}>{h}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isFetching ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <div className="w-7 h-7 border-2 border-[#3b2063] border-t-transparent animate-spin rounded-full mx-auto mb-3" />
                      <p className="bm-label" style={{ color: '#d4d4d8' }}>Loading vouchers…</p>
                    </td>
                  </tr>
                ) : vouchers.length > 0 ? vouchers.map(v => (
                  <tr key={v.id} className="border-t border-gray-50 hover:bg-[#faf9ff] transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-[#ede9fe] flex items-center justify-center">
                          <Ticket size={10} strokeWidth={2.5} className="text-[#3b2063]" />
                        </div>
                        <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#1a0f2e' }}>{v.code}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#16a34a' }}>{v.value}</span>
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <StatusBadge status={v.status} />
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <span className="inline-block px-2.5 py-1 rounded-full"
                        style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                          background: '#ede9fe', color: '#3b2063' }}>
                        {v.type}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <span style={{ fontSize: '0.82rem', fontWeight: 500, color: '#a1a1aa' }}>
                        {v.updated_at ? new Date(v.updated_at).toISOString().split('T')[0] : 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5 text-zinc-400">
                        <FileText size={12} strokeWidth={2} />
                        <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{v.receipt}</span>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                          <Ticket size={18} strokeWidth={1.5} className="text-gray-300" />
                        </div>
                        <p className="bm-label" style={{ color: '#d4d4d8' }}>No vouchers found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-gray-50 flex justify-between items-center mt-auto">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="bm-label" style={{ color: '#d4d4d8' }}>Synchronized</span>
              </div>
              <button onClick={onBack}
                className="flex items-center gap-2 h-9 px-4 bg-white border border-gray-100 hover:border-[#ddd6f7] text-[#3b2063] transition-all rounded-xl active:scale-[0.98]"
                style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                <ArrowLeft size={13} strokeWidth={2.5} /> Back to Settings
              </button>
            </div>
          </div>
        </div>

        {/* ── Add Voucher Modal ── */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-2xl border border-gray-100 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 relative">
              {loading && (
                <div className="absolute inset-0 bg-white/60 z-50 flex items-center justify-center rounded-2xl backdrop-blur-[2px]">
                  <Loader2 className="animate-spin text-[#3b2063]" size={28} />
                </div>
              )}

              <div className="flex items-center justify-between px-7 py-5 border-b border-gray-50">
                <div>
                  <p className="bm-label" style={{ color: '#a1a1aa' }}>Settings</p>
                  <h2 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1a0f2e', letterSpacing: '-0.025em', margin: 0, marginTop: 2 }}>
                    Add New Voucher
                  </h2>
                </div>
                <button onClick={() => setIsModalOpen(false)}
                  className="w-7 h-7 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-zinc-400 hover:text-zinc-600 transition-colors">
                  <X size={14} />
                </button>
              </div>

              <div className="px-7 py-6 flex flex-col gap-4">
                <div className="space-y-1.5">
                  <p className="bm-label" style={{ color: '#a1a1aa' }}>Number (Code)</p>
                  <input type="text" value={newVoucher.number}
                    onChange={e => setNewVoucher({ ...newVoucher, number: e.target.value })}
                    className={inputCls} style={inputStyle} placeholder="e.g. VOUCHER-001" />
                </div>
                <div className="space-y-1.5">
                  <p className="bm-label" style={{ color: '#a1a1aa' }}>Value</p>
                  <input type="text" value={newVoucher.value}
                    onChange={e => setNewVoucher({ ...newVoucher, value: e.target.value })}
                    className={inputCls} style={inputStyle} placeholder="e.g. 20% or 100.00" />
                </div>
                <div className="space-y-1.5">
                  <p className="bm-label" style={{ color: '#a1a1aa' }}>Type</p>
                  <select value={newVoucher.type}
                    onChange={e => setNewVoucher({ ...newVoucher, type: e.target.value })}
                    className={`${inputCls} cursor-pointer`} style={inputStyle}>
                    <option value="Percentage">Percentage (%)</option>
                    <option value="Fixed Amount">Fixed Amount (₱)</option>
                    <option value="Gift Certificate">Gift Certificate</option>
                  </select>
                </div>
              </div>

              <div className="px-7 py-5 border-t border-gray-50 flex flex-col gap-3">
                <button onClick={handleAddVoucher} disabled={loading}
                  className="w-full h-10 bg-[#3b2063] hover:bg-[#2a1647] text-white transition-all rounded-xl active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                  <Save size={13} strokeWidth={2.5} /> Add Voucher
                </button>
                <div className="flex gap-3">
                  <button onClick={() => setIsModalOpen(false)}
                    className="flex-1 h-10 bg-white border border-red-200 text-red-500 hover:bg-red-50 transition-all rounded-xl active:scale-[0.98]"
                    style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                    Cancel
                  </button>
                  <button onClick={() => showToast('Importing feature coming soon', 'warning')}
                    className="flex-1 h-10 bg-[#ede9fe] hover:bg-[#3b2063] text-[#3b2063] hover:text-white transition-all rounded-xl active:scale-[0.98] flex items-center justify-center gap-2"
                    style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                    <Upload size={13} strokeWidth={2.5} /> Import
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default BM_AddVouchers;