"use client"

import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Ticket, Plus, Printer, X, Save, Upload, FileText, Loader2 } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { getCache, setCache } from '../../utils/cache';
import { AxiosError } from 'axios';

const CACHE_KEY = 'vouchers';
const CACHE_TTL = 3 * 60 * 1000; // 3 min

interface Voucher {
  id: number;
  code: string;
  value: string;
  status: 'Active' | 'Redeemed' | 'Inactive';
  type: string;
  updated_at: string;
  receipt: string;
}

interface BackendError {
  message?: string;
}

const AddVouchers = ({ onBack }: { onBack: () => void }) => {
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(!getCache<Voucher[]>(CACHE_KEY));
  const [vouchers, setVouchers] = useState<Voucher[]>(
    getCache<Voucher[]>(CACHE_KEY) ?? []
  );

  const [newVoucher, setNewVoucher] = useState({
    number: '',
    value: '',
    type: 'Percentage'
  });

  const fetchVouchers = useCallback(async () => {
    setIsFetching(true);
    try {
      const response = await api.get('/vouchers');
      const data: Voucher[] = response.data;
      setCache<Voucher[]>(CACHE_KEY, data, CACHE_TTL);
      setVouchers(data);
    } catch (err) {
      console.error("Fetch Error:", err);
      showToast("Could not load vouchers from database", "error");
    } finally {
      setIsFetching(false);
    }
  }, [showToast]);

  useEffect(() => {
    // Skip fetch if TTL cache is still valid
    if (getCache<Voucher[]>(CACHE_KEY)) return;
    void (async () => { await fetchVouchers(); })();
  }, [fetchVouchers]);

  const handlePrintVouchers = () => {
    if (vouchers.length === 0) {
      showToast("No vouchers to print", "warning");
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast("Please allow pop-ups to print", "warning");
      return;
    }

    const printDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

    const totalActive   = vouchers.filter(v => v.status === 'Active').length;
    const totalRedeemed = vouchers.filter(v => v.status === 'Redeemed').length;
    const totalInactive = vouchers.filter(v => v.status === 'Inactive').length;

    const rows = vouchers.map(v => {
      const statusStyle = v.status === 'Active'
        ? 'background:#d1fae5;color:#059669;'
        : v.status === 'Redeemed'
        ? 'background:#dbeafe;color:#2563eb;'
        : 'background:#f4f4f5;color:#a1a1aa;';
      const updatedAt = v.updated_at
        ? new Date(v.updated_at).toISOString().split('T')[0]
        : 'N/A';
      return `
        <tr>
          <td style="padding:10px 14px;font-weight:900;color:#3b2063;">${v.code}</td>
          <td style="padding:10px 14px;font-weight:700;color:#10b981;text-align:right;">${v.value}</td>
          <td style="padding:10px 14px;text-align:center;">
            <span style="padding:3px 9px;border-radius:4px;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:0.08em;${statusStyle}">
              ${v.status}
            </span>
          </td>
          <td style="padding:10px 14px;text-align:center;text-transform:uppercase;color:#64748b;font-size:11px;">${v.type}</td>
          <td style="padding:10px 14px;text-align:center;color:#a1a1aa;font-size:11px;">${updatedAt}</td>
          <td style="padding:10px 14px;text-align:center;color:#94a3b8;font-size:11px;">${v.receipt}</td>
        </tr>
      `;
    }).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Voucher Report — Lucky Boba POS</title>
          <style>
            * { margin:0; padding:0; box-sizing:border-box; }
            body { font-family:'Segoe UI',Arial,sans-serif; background:#fff; color:#1e293b; font-size:12px; }
            .header { background:#3b2063; color:white; padding:24px 32px; display:flex; justify-content:space-between; align-items:center; }
            .header-title { font-size:18px; font-weight:900; text-transform:uppercase; letter-spacing:0.15em; }
            .header-sub { font-size:10px; font-weight:600; opacity:0.6; text-transform:uppercase; letter-spacing:0.1em; margin-top:4px; }
            .header-meta { text-align:right; font-size:10px; opacity:0.75; line-height:1.6; }
            .body { padding:24px 32px; }
            .summary { display:flex; gap:16px; margin-bottom:24px; }
            .summary-card { background:#f8f6ff; border:1px solid #e4e0f0; border-radius:10px; padding:12px 20px; flex:1; text-align:center; }
            .summary-card .num { font-size:22px; font-weight:900; }
            .summary-card .lbl { font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:0.1em; color:#9ca3af; margin-top:2px; }
            table { width:100%; border-collapse:collapse; }
            thead tr { background:#f1f5f9; }
            th { padding:10px 14px; font-size:9px; font-weight:900; text-transform:uppercase; letter-spacing:0.12em; color:#475569; border-bottom:2px solid #e2e8f0; }
            th:nth-child(2) { text-align:right; }
            th:nth-child(3), th:nth-child(4), th:nth-child(5), th:nth-child(6) { text-align:center; }
            tbody tr { border-bottom:1px solid #f1f5f9; }
            tbody tr:last-child { border-bottom:none; }
            .footer { margin-top:32px; padding-top:12px; border-top:1px solid #e2e8f0; display:flex; justify-content:space-between; font-size:9px; color:#9ca3af; font-weight:600; text-transform:uppercase; letter-spacing:0.08em; }
            @media print {
              @page { margin:12mm 16mm; }
              body { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="header-title">Voucher Report</div>
              <div class="header-sub">Lucky Boba POS System — Promo &amp; Discount Codes</div>
            </div>
            <div class="header-meta">
              <div>Printed by: Administrator</div>
              <div>${printDate}</div>
            </div>
          </div>

          <div class="body">
            <div class="summary">
              <div class="summary-card">
                <div class="num" style="color:#3b2063;">${vouchers.length}</div>
                <div class="lbl">Total Vouchers</div>
              </div>
              <div class="summary-card">
                <div class="num" style="color:#10b981;">${totalActive}</div>
                <div class="lbl">Active</div>
              </div>
              <div class="summary-card">
                <div class="num" style="color:#2563eb;">${totalRedeemed}</div>
                <div class="lbl">Redeemed</div>
              </div>
              <div class="summary-card">
                <div class="num" style="color:#a1a1aa;">${totalInactive}</div>
                <div class="lbl">Inactive</div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Code</th><th>Value</th><th>Status</th>
                  <th>Type</th><th>Updated At</th><th>Receipt</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>

            <div class="footer">
              <span>Lucky Boba &copy; ${new Date().getFullYear()}</span>
              <span>Total records: ${vouchers.length}</span>
            </div>
          </div>

          <script>
            window.onload = () => {
              window.print();
              window.onafterprint = () => window.close();
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  const handleAddVoucher = async () => {
    if (!newVoucher.number || !newVoucher.value) {
      showToast("Please fill in all fields", "warning");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/vouchers', {
        code: newVoucher.number,
        value: newVoucher.value,
        type: newVoucher.type
      });

      const updated = [response.data, ...vouchers];
      setVouchers(updated);
      setCache<Voucher[]>(CACHE_KEY, updated, CACHE_TTL); // keep cache in sync
      showToast("Voucher added successfully!", "success");
      setNewVoucher({ number: '', value: '', type: 'Percentage' });
      setIsModalOpen(false);
    } catch (err) {
      const axiosError = err as AxiosError<BackendError>;
      const errorMsg = axiosError.response?.data?.message || "Error saving voucher";
      showToast(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = () => {
    showToast("Importing feature coming soon", "warning");
  };

  return (
    <div className="flex-1 bg-[#f8f6ff] h-full flex flex-col font-sans overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">

        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Ticket size={24} className="text-[#3b2063]" />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handlePrintVouchers}
              className="h-11 bg-[#3b2063] hover:bg-[#2a174a] text-white font-bold text-sm uppercase tracking-widest transition-colors rounded-none shadow-sm flex items-center justify-center gap-2 px-6"
            >
              <Printer size={14} strokeWidth={3} /> Print Vouchers
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="h-11 bg-[#3b2063] hover:bg-[#2a174a] text-white font-bold text-sm uppercase tracking-widest transition-colors rounded-none shadow-sm flex items-center justify-center gap-2 px-6"
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
                <th className="px-6 py-4 text-sm font-black text-slate-600 uppercase tracking-widest">Code</th>
                <th className="px-6 py-4 text-sm font-black text-slate-600 uppercase tracking-widest text-right">Value</th>
                <th className="px-6 py-4 text-sm font-black text-slate-600 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-4 text-sm font-black text-slate-600 uppercase tracking-widest text-center">Type</th>
                <th className="px-6 py-4 text-sm font-black text-slate-600 uppercase tracking-widest text-center">Updated At</th>
                <th className="px-6 py-4 text-sm font-black text-slate-600 uppercase tracking-widest text-center">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {isFetching ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <Loader2 className="animate-spin text-[#3b2063]" size={28} />
                    </div>
                  </td>
                </tr>
              ) : vouchers.length > 0 ? (
                vouchers.map((v) => (
                  <tr key={v.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-black text-[#3b2063]">{v.code}</td>
                    <td className="px-6 py-4 text-sm font-bold text-emerald-600 text-right">{v.value}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded text-sm font-black uppercase tracking-widest ${
                        v.status === 'Active'   ? 'bg-emerald-100 text-emerald-600' :
                        v.status === 'Redeemed' ? 'bg-blue-100 text-blue-600' :
                        'bg-zinc-100 text-zinc-400'
                      }`}>
                        {v.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-black text-slate-500 text-center uppercase">{v.type}</td>
                    <td className="px-6 py-4 text-sm font-bold text-zinc-400 text-center">
                      {v.updated_at ? new Date(v.updated_at).toISOString().split('T')[0] : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1 text-slate-400">
                        <FileText size={14} />
                        <span className="text-sm font-bold">{v.receipt}</span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-6 py-4 text-sm font-bold text-zinc-400 text-center uppercase">No vouchers found</td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="p-4 bg-zinc-50 border-t border-zinc-200">
            <button onClick={onBack} className="px-6 py-2 bg-zinc-200 text-zinc-500 rounded-lg font-black uppercase text-sm tracking-widest hover:bg-zinc-300 flex items-center gap-2 transition-all shadow-sm">
              <ArrowLeft size={14} strokeWidth={3} /> Back to Settings
            </button>
          </div>
        </div>
      </div>

      {/* ADD VOUCHER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 relative">
            {loading && (
              <div className="absolute inset-0 bg-white/40 z-50 flex items-center justify-center">
                <Loader2 className="animate-spin text-[#3b2063]" size={32} />
              </div>
            )}
            <div className="bg-[#3b2063] px-6 py-4 flex justify-between items-center">
              <h2 className="text-white font-black text-sm uppercase tracking-[0.2em]">Add New Voucher</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-white/70 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-1">
                <label className="text-sm font-black text-zinc-400 uppercase tracking-widest">Number (Code)</label>
                <input
                  type="text"
                  value={newVoucher.number}
                  onChange={(e) => setNewVoucher({...newVoucher, number: e.target.value})}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-2 focus:border-[#3b2063] focus:ring-2 focus:ring-[#3b2063]/10 transition-all"
                  placeholder="e.g. VOUCHER-001"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-black text-zinc-400 uppercase tracking-widest">Value</label>
                <input
                  type="text"
                  value={newVoucher.value}
                  onChange={(e) => setNewVoucher({...newVoucher, value: e.target.value})}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-2 focus:border-[#3b2063] focus:ring-2 focus:ring-[#3b2063]/10 transition-all"
                  placeholder="e.g. 20% or 100.00"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-black text-zinc-400 uppercase tracking-widest">Type</label>
                <select
                  value={newVoucher.type}
                  onChange={(e) => setNewVoucher({...newVoucher, type: e.target.value})}
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-2 focus:border-[#3b2063] focus:ring-2 focus:ring-[#3b2063]/10 transition-colors duration-200 cursor-pointer"
                >
                  <option value="Percentage">Percentage (%)</option>
                  <option value="Fixed Amount">Fixed Amount (₱)</option>
                  <option value="Gift Certificate">Gift Certificate</option>
                </select>
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <button
                  onClick={handleAddVoucher}
                  disabled={loading}
                  className="w-full h-11 bg-[#3b2063] hover:bg-[#2a174a] text-white font-bold text-xs uppercase tracking-widest transition-colors rounded-none shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Save size={14} /> Add New
                </button>

                <div className="flex gap-3">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 font-bold text-xs uppercase tracking-widest transition-colors rounded-none shadow-sm flex items-center justify-center gap-2 px-6"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleImport}
                    className="flex-1 bg-[#3b2063] hover:bg-[#2a174a] text-white font-bold text-xs uppercase tracking-widest transition-colors rounded-none shadow-sm flex items-center justify-center gap-2 px-6"
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