import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, RefreshCw, X, AlertTriangle, Trash2,
  Receipt as ReceiptIcon, CheckCircle2, ShieldAlert,
  Calendar, Clock, FileText, ArrowRight
} from 'lucide-react';
import { createPortal } from 'react-dom';
import api from '../../../services/api';

// ── Types ────────────────────────────────────────────────────────────────────

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

// ── Helpers ──────────────────────────────────────────────────────────────────

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

const fmt = (v: number) =>
  `₱${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// ── Shared UI ────────────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: VoidStatus }> = ({ status }) => {
  const map: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    pending: { bg: 'bg-amber-500/10 text-amber-500 border-amber-500/20', icon: <Clock size={10} />, text: 'Pending Approval' },
    approved: { bg: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', icon: <CheckCircle2 size={10} />, text: 'Approved' },
    completed: { bg: 'bg-[#3b2063]/10 text-[#3b2063] border-[#3b2063]/200/20', icon: <FileText size={10} />, text: 'Legitimate' },
    cancelled: { bg: 'bg-rose-500/10 text-rose-500 border-rose-500/20', icon: <ShieldAlert size={10} />, text: 'Voided' },
  };
  const config = map[status] || map.completed;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${config.bg}`}>
      {config.icon}
      {config.text}
    </span>
  );
};

const StatCard: React.FC<{ label: string; value: number; type?: 'danger' | 'success' | 'neutral' }> = ({ label, value, type = 'neutral' }) => {
  const colors = {
    danger: 'text-rose-500 border-rose-100 bg-rose-50/30',
    success: 'text-emerald-600 border-emerald-100 bg-emerald-50/30',
    neutral: 'text-slate-900 border-slate-100 bg-white shadow-xl shadow-slate-900/5'
  };
  return (
    <div className={`p-6 rounded-[1.75rem] border-2 transition-all hover:scale-[1.02] duration-300 ${colors[type]}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-2">{label}</p>
      <p className="text-2xl font-black tabular-nums tracking-tight">{fmt(value)}</p>
    </div>
  );
};

// ── Main Panel ───────────────────────────────────────────────────────────────

const VoidJournalPanel: React.FC<{ branchId: number | null }> = ({ branchId }) => {

  const [voidLogs, setVoidLogs] = useState<VoidLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({ gross: 0, voided: 0, net: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const [targetReceipt, setTargetReceipt] = useState<VoidLog | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [isVoiding, setIsVoiding] = useState(false);
  const [voidSuccess, setVoidSuccess] = useState(false);
  const [voidError, setVoidError] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
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
      console.error('Failed to establish connection with auditing database.');
    } finally { setLoading(false); }
  }, [branchId, selectedDate]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const handleConfirmVoid = async () => {
    if (!targetReceipt || !voidReason.trim()) return;
    setIsVoiding(true); setVoidError('');
    try {
      await api.post(`/receipts/${targetReceipt.sale_id}/void-request`, {
        reason: voidReason,
      });
      setVoidSuccess(true);
      setTimeout(() => {
        setTargetReceipt(null);
        setVoidReason('');
        setVoidSuccess(false);
        fetchLogs();
      }, 1500);
    } catch (err: unknown) {
      setVoidError(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Authorization failed. Transaction state may have changed.'
      );
    } finally { setIsVoiding(false); }
  };

  const filtered = voidLogs.filter(l =>
    l.invoice.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.cashier.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="px-5 md:px-8 py-8 md:py-12 animate-in fade-in duration-700" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12 pb-10 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500">Inventory Loss Prevention</p>
          </div>
          <h1 className="text-[2.2rem] font-black text-slate-900 tracking-tight leading-none">Void Journal Audit</h1>
          <p className="text-[0.8rem] font-bold text-slate-400 mt-4 uppercase tracking-[0.1em] flex items-center gap-2">
            <Calendar size={14} className="text-slate-300" />
            Audit period: {new Date(selectedDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3b2063] group-hover:scale-110 transition-transform" size={16} />
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="bg-white border-2 border-slate-100 rounded-2xl px-12 py-3.5 text-xs font-black uppercase tracking-widest outline-none focus:border-[#3b2063] transition-all shadow-xl shadow-slate-900/5"
            />
          </div>
          <button
            onClick={fetchLogs}
            disabled={loading}
            style={{ backgroundColor: '#3b2063' }}
            className="inline-flex items-center gap-1.5 font-bold rounded-lg transition-all px-4 py-2 text-xs text-white hover:opacity-90 shadow-xl shadow-[#3b2063]/20 disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Sync Records
          </button>
        </div>
      </div>


      {/* ── Operational Totals HUD ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <StatCard label="Gross System Output" value={stats.gross} />
        <StatCard label="Identified Revenue Loss" value={stats.voided} type="danger" />
        <StatCard label="Net Fiscal Performance" value={stats.net} type="success" />
      </div>

      {/* ── Transaction Registry ── */}
      <div className="bg-white border-2 border-slate-100 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-[#3b2063]/5">
        <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/30">
          <div className="flex items-center gap-4 bg-white border-2 border-slate-100 rounded-[1.25rem] px-5 py-4 focus-within:border-[#3b2063] focus-within:ring-8 focus-within:ring-indigo-50 transition-all">
            <Search size={18} className="text-slate-300" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm font-bold text-slate-800 outline-none placeholder:text-slate-300"
              placeholder="Query by Invoice ID or Personnel Token..."
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-slate-300 hover:text-rose-500 p-1">
                <X size={16} strokeWidth={3} />
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/20">
                {['Reference ID', 'Personnel', 'Fiscal Impact', 'Creation Stamp', 'Audit Status', 'Actions'].map((h, i) => (
                  <th key={h} className={`px-8 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ${i === 5 ? 'text-right' : ''}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-8 py-8"><div className="h-6 bg-slate-100 rounded-lg w-full" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-24 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-20">
                      <ReceiptIcon size={80} strokeWidth={1} />
                      <p className="text-[11px] font-black uppercase tracking-[0.4em]">Zero Journal Entries</p>
                    </div>
                  </td>
                </tr>
              ) : filtered.map(log => (
                <tr key={log.id} className="group hover:bg-slate-50/80 transition-colors duration-300">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-4 bg-slate-200 rounded-full group-hover:bg-[#3b2063] transition-colors" />
                      <span className="font-mono text-[13px] font-black text-slate-900 tracking-tight">{log.invoice}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-slate-600 font-bold uppercase text-[11px] tracking-wide">{log.cashier}</td>
                  <td className="px-8 py-6 font-black text-slate-900 tabular-nums">{fmt(log.amount)}</td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-black text-slate-700">{log.created_at.split(',')[0]}</span>
                      <span className="text-[9px] font-bold text-slate-300 tracking-widest">{log.created_at.split(',')[1]}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6"><StatusBadge status={log.status} /></td>
                  <td className="px-8 py-6 text-right">
                    {log.status === 'completed' && (
                      <button
                        onClick={() => setTargetReceipt(log)}
                        className="group/btn inline-flex items-center gap-2 px-4 py-2.5 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm font-black text-[10px] uppercase tracking-widest"
                      >
                        <Trash2 size={12} strokeWidth={2.5} />
                        Execute Archive
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Verification Infrastructure ── */}
      {targetReceipt && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6"
          style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', backgroundColor: 'rgba(15, 23, 42, 0.7)' }}>
          <div className="absolute inset-0" onClick={() => !isVoiding && setTargetReceipt(null)} />
          <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">

            <div className="px-10 py-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Authorization Required</h3>
                <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] mt-1">Permanent Transaction Nullification</p>
              </div>
              <div className="px-4 py-2 bg-white border-2 border-slate-100 rounded-2xl text-[12px] font-black font-mono shadow-sm">
                {targetReceipt.invoice}
              </div>
            </div>

            <div className="p-10 space-y-8">
              {voidSuccess ? (
                <div className="text-center py-10">
                  <div className="w-24 h-24 bg-emerald-50 border border-emerald-100 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/10">
                    <CheckCircle2 size={48} className="text-emerald-500" strokeWidth={2.5} />
                  </div>
                  <p className="text-lg font-black text-slate-900 tracking-tight">Journal Record Nullified</p>
                  <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">Inventory balances updated successfully</p>
                </div>
              ) : (
                <>
                  <div className="p-6 bg-rose-50 border-2 border-rose-100 rounded-[1.5rem] flex gap-5 items-start">
                    <AlertTriangle size={24} className="shrink-0 text-rose-500 mt-1" strokeWidth={2.5} />
                    <div>
                      <p className="text-xs font-black text-rose-900 uppercase tracking-wide mb-1.5">Irreversible Action</p>
                      <p className="text-[11px] font-bold text-rose-700/80 leading-relaxed uppercase tracking-wider">
                        Nullifying this record will permanently cancel the fiscal record and reverse all associated inventory decrements. This audit event will be logged globally.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 px-2">Audit Justification</label>
                    <textarea
                      value={voidReason}
                      onChange={e => setVoidReason(e.target.value)}
                      className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] text-sm font-bold text-slate-900 outline-none focus:border-rose-500 focus:bg-white transition-all resize-none shadow-inner"
                      placeholder="Input justification for record removal..."
                      rows={4}
                    />
                  </div>
                  {voidError && (
                    <div className="flex items-center gap-3 p-4 bg-rose-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest">
                      <ShieldAlert size={16} strokeWidth={2.5} />
                      {voidError}
                    </div>
                  )}
                </>
              )}
            </div>

            {!voidSuccess && (
              <div className="px-10 py-8 bg-slate-50/50 flex items-center gap-4 border-t border-slate-100">
                <button onClick={() => setTargetReceipt(null)} disabled={isVoiding}
                  className="flex-1 px-4 py-4 bg-white border-2 border-slate-200 text-slate-600 rounded-[1.25rem] font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all">
                  Abort sync
                </button>
                <button onClick={handleConfirmVoid} disabled={!voidReason.trim() || isVoiding}
                  className="flex-[2] px-4 py-4 bg-rose-600 text-white rounded-[1.25rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-rose-700 shadow-2xl shadow-rose-600/30 transition-all flex items-center justify-center gap-3">
                  {isVoiding ? <><RefreshCw size={14} className="animate-spin" /> Authorizing...</> : <><ArrowRight size={14} strokeWidth={3} /> Execute Nullification</>}
                </button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      <div className="mt-20 flex items-center justify-center gap-1.5 opacity-20 group cursor-default">
        <span className="w-12 h-px bg-rose-400 group-hover:w-24 transition-all duration-700" />
        <p className="text-[0.6rem] font-black tracking-[0.6em] uppercase">Operations Audit Manifest V4.2</p>
        <span className="w-12 h-px bg-rose-400 group-hover:w-24 transition-all duration-700" />
      </div>
    </div>
  );
};

export default VoidJournalPanel;
