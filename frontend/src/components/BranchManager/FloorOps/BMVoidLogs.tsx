import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, AlertTriangle, Trash2,
  Receipt as ReceiptIcon, CheckCircle2,
} from 'lucide-react';
import { createPortal } from 'react-dom';
import api from '../../../services/api';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type VoidStatus = 'completed' | 'pending' | 'approved' | 'rejected' | 'cancelled';

interface VoidLog {
  id: number;
  sale_id: number;
  invoice: string;
  amount: number;
  cashier: string;
  created_at: string;
  status: VoidStatus;
}

interface Stats { gross: number; voided: number; net: number; }

// ─────────────────────────────────────────────────────────────────────────────
// RAW DATA
// ─────────────────────────────────────────────────────────────────────────────

interface RawSaleRecord {
  id: number;
  Invoice?: string;
  invoice_number?: string;
  invoice?: string;
  Amount?: string | number;
  total_amount?: string | number;
  amount?: string | number;
  Cashier?: string;
  cashier_name?: string;
  cashier?: string;
  Date_Time?: string;
  created_at?: string;
  Status?: string;
  status?: string;
}

const mapVoidLog = (v: RawSaleRecord): VoidLog => ({
  id: v.id,
  sale_id: v.id,
  invoice: v.Invoice ?? v.invoice_number ?? v.invoice ?? `#${v.id}`,
  amount: parseFloat(String(v.Amount ?? v.total_amount ?? v.amount ?? 0)),
  cashier: v.Cashier ?? v.cashier_name ?? v.cashier ?? '—',
  created_at: (() => {
    const raw = v.Date_Time ?? v.created_at;
    return raw ? new Date(raw).toLocaleString('en-PH') : '—';
  })(),
  status: (v.Status ?? v.status ?? 'completed').toLowerCase() as VoidStatus,
});

// ─────────────────────────────────────────────────────────────────────────────
// SHARED UI
// ─────────────────────────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: VoidStatus }> = ({ status }) => {
  const map: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-700 border border-amber-200',
    approved: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    completed: 'bg-blue-50 text-blue-700 border border-blue-200',
    cancelled: 'bg-red-50 text-red-600 border border-red-200',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${map[status] || map.completed}`}>
      {status}
    </span>
  );
};

const StatBox: React.FC<{ label: string; value: number; isDanger?: boolean }> = ({ label, value, isDanger }) => (
  <div className={`bg-white border rounded-lg p-4 text-center shadow-sm ${isDanger ? 'border-red-200' : 'border-zinc-200'}`}>
    <div className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isDanger ? 'text-red-400' : 'text-zinc-400'}`}>{label}</div>
    <div className={`text-xl font-bold ${isDanger ? 'text-red-500' : 'text-[#1a0f2e]'}`}>
      ₱{value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PANEL
// ─────────────────────────────────────────────────────────────────────────────

const BMVoidLogsPanel: React.FC<{ branchId: number | null }> = ({ branchId }) => {

  const [voidLogs, setVoidLogs] = useState<VoidLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [stats, setStats] = useState<Stats>({ gross: 0, voided: 0, net: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Void modal
  const [targetReceipt, setTargetReceipt] = useState<VoidLog | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [isVoiding, setIsVoiding] = useState(false);
  const [voidSuccess, setVoidSuccess] = useState(false);
  const [voidError, setVoidError] = useState('');

  // ── Fetch ───────────────────────────────────────────────────────────────────
  const fetchLogs = useCallback(async () => {
    setLoading(true); setFetchError('');
    try {
      const params: Record<string, string | number> = { date: selectedDate };
      if (branchId) params.branch_id = branchId;

      const res = await api.get('/reports/sales-detailed', { params });
      const raw: RawSaleRecord[] = res.data.transactions ?? [];
      const mapped: VoidLog[] = raw.map(mapVoidLog);
      setVoidLogs(mapped);

      const gross = mapped.reduce((s, l) => s + l.amount, 0);
      const voided = mapped
        .filter(l => l.status === 'cancelled')
        .reduce((s, l) => s + l.amount, 0);
      setStats({ gross, voided, net: gross - voided });
    } catch {
      setFetchError('Failed to load receipts.');
    } finally {
      setLoading(false);
    }
  }, [branchId, selectedDate]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  // ── Void handlers ───────────────────────────────────────────────────────────
  const openVoidModal = (log: VoidLog) => {
    setTargetReceipt(log);
    setVoidReason('');
    setVoidSuccess(false);
    setVoidError('');
  };

  const closeVoidModal = () => {
    setTargetReceipt(null);
    setVoidReason('');
    setVoidSuccess(false);
    setVoidError('');
  };

  // 🔥 DIRECT CANCEL (NO APPROVAL) — BM privilege
  const handleConfirmVoid = async () => {
    if (!targetReceipt || !voidReason.trim()) return;
    setIsVoiding(true); setVoidError('');
    try {
      await api.patch(`/sales/${targetReceipt.sale_id}/cancel`, {
        reason: voidReason,
      });
      setVoidSuccess(true);
      setTimeout(() => { closeVoidModal(); fetchLogs(); }, 1500);
    } catch (err: unknown) {
      setVoidError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Void failed. Receipt may already be voided.'
      );
    } finally {
      setIsVoiding(false);
    }
  };

  // ── Filter ──────────────────────────────────────────────────────────────────
  const filtered = voidLogs.filter(l =>
    l.invoice.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.cashier.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 md:p-8" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      <div className="flex flex-col md:flex-row md:items-center gap-6 mb-8">
        <div className="flex-1 flex flex-col md:flex-row items-center gap-3">
          <div className="relative group flex-1 w-full md:w-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-[#3b2063]" size={15} />
            <input
              type="text"
              placeholder="Search invoice or cashier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#ede8ff] focus:border-[#3b2063] transition-all shadow-sm"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="bg-white border border-zinc-200 rounded-xl px-4 py-3 text-xs font-bold text-zinc-600 outline-none shadow-sm cursor-pointer hover:bg-zinc-50 transition-all shrink-0"
            />
          </div>
        </div>
      </div>

      {/* ── Stats Bar ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <StatBox label="Gross Sales" value={stats.gross} />
        <StatBox label="Voided Sales" value={stats.voided} isDanger />
        <StatBox label="Net Sales" value={stats.net} />
      </div>

      {/* ── Table ── */}
      <div className="bg-white border border-zinc-200 rounded-[0.625rem] overflow-hidden">


        {fetchError && (
          <p className="px-5 py-3 text-xs text-red-500 font-semibold">{fetchError}</p>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/50">
                {['Invoice', 'Cashier', 'Amount', 'Date', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-zinc-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-xs text-zinc-300 font-bold uppercase tracking-widest">
                    Loading...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <ReceiptIcon size={32} className="mx-auto text-zinc-200 mb-2" />
                    <p className="text-xs text-zinc-300 font-bold uppercase tracking-widest">No transactions found</p>
                  </td>
                </tr>
              ) : filtered.map(log => (
                <tr key={log.id} className="border-b border-zinc-50 hover:bg-zinc-50">
                  <td className="px-5 py-3.5 font-mono text-xs font-bold">{log.invoice}</td>
                  <td className="px-5 py-3.5 text-zinc-600">{log.cashier}</td>
                  <td className="px-5 py-3.5 font-bold text-zinc-800">₱{log.amount.toFixed(2)}</td>
                  <td className="px-5 py-3.5 text-zinc-400 text-xs">{log.created_at}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={log.status} /></td>
                  <td className="px-5 py-3.5">
                    {/* BM can cancel ANY non-cancelled sale directly */}
                    {log.status !== 'cancelled' && (
                      <button
                        onClick={() => openVoidModal(log)}
                        className="p-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors"
                        title="Void receipt"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Void Confirmation Modal ── */}
      {targetReceipt && createPortal(
        <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">

            <div className="p-6 border-b border-zinc-100">
              <h3 className="text-lg font-bold text-zinc-900">Void Receipt?</h3>
              <p className="text-sm text-zinc-500">
                Invoice: <span className="font-mono font-bold">{targetReceipt.invoice}</span>
              </p>
            </div>

            <div className="p-6 space-y-4">
              {voidSuccess ? (
                <div className="text-center py-4">
                  <CheckCircle2 size={48} className="mx-auto text-emerald-500 mb-3" />
                  <p className="text-zinc-700 font-semibold">Transaction voided successfully</p>
                </div>
              ) : (
                <>
                  <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex gap-3 text-red-700 text-xs">
                    <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                    <p>Voiding this will cancel the sale. This cannot be undone.</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-zinc-400">Reason for Void</label>
                    <textarea
                      value={voidReason}
                      onChange={e => setVoidReason(e.target.value)}
                      className="w-full mt-1 p-3 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-500/20 resize-none"
                      placeholder="e.g. Wrong items entered, Customer changed mind..."
                      rows={3}
                    />
                  </div>
                  {voidError && (
                    <p className="text-xs text-red-500 font-semibold bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
                      {voidError}
                    </p>
                  )}
                </>
              )}
            </div>

            {!voidSuccess && (
              <div className="p-6 bg-zinc-50 flex justify-end gap-3">
                <button
                  onClick={closeVoidModal}
                  disabled={isVoiding}
                  className="inline-flex items-center gap-1.5 font-bold rounded-lg px-3 py-2 text-xs bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmVoid}
                  disabled={!voidReason.trim() || isVoiding}
                  className="inline-flex items-center gap-1.5 font-bold rounded-lg px-3 py-2 text-xs bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                >
                  {isVoiding ? 'Voiding...' : 'Confirm Void'}
                </button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default BMVoidLogsPanel;