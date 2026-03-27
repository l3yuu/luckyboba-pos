import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, RefreshCw, AlertCircle, Eye, X,
  FileX, Clock, CheckCircle, AlertTriangle,
} from 'lucide-react';
import { createPortal } from 'react-dom';
import api from '../../../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

type VoidStatus = 'pending' | 'approved' | 'rejected';
type FilterTab  = 'all' | VoidStatus;

interface VoidLog {
  id:         number;
  invoice:    string;
  amount:     number;
  cashier:    string;
  reason:     string;
  created_at: string;
  status:     VoidStatus;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapVoidLog = (v: any): VoidLog => ({
  id:         v.id,
  invoice:    v.invoice ?? v.invoice_number ?? `#${v.id}`,
  amount:     parseFloat(v.amount ?? v.total ?? 0),
  cashier:    v.cashier ?? v.cashier_name ?? v.user?.name ?? '—',
  reason:     v.reason ?? v.void_reason ?? '—',
  created_at: v.created_at
    ? new Date(v.created_at).toLocaleString('en-PH', {
        month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : v.created_at,
  status: v.status ?? 'pending',
});

// ─── Shared UI ────────────────────────────────────────────────────────────────

type VariantKey = 'primary' | 'secondary';
type SizeKey    = 'sm' | 'md';

interface BtnProps {
  children: React.ReactNode; variant?: VariantKey; size?: SizeKey;
  onClick?: () => void; className?: string; disabled?: boolean;
}
const Btn: React.FC<BtnProps> = ({
  children, variant = 'primary', size = 'sm',
  onClick, className = '', disabled = false,
}) => {
  const sizes:    Record<SizeKey,    string> = { sm: 'px-3 py-2 text-xs', md: 'px-4 py-2.5 text-sm' };
  const variants: Record<VariantKey, string> = {
    primary:   'bg-[#3b2063] hover:bg-[#2a1647] text-white',
    secondary: 'bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50',
  };
  return (
    <button onClick={onClick} disabled={disabled}
      className={`inline-flex items-center gap-1.5 font-bold rounded-lg transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 ${sizes[size]} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

const StatusBadge: React.FC<{ status: VoidStatus }> = ({ status }) => {
  const map: Record<VoidStatus, string> = {
    pending:  'bg-amber-50 text-amber-700 border border-amber-200',
    approved: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    rejected: 'bg-red-50 text-red-600 border border-red-200',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${map[status]}`}>
      {status}
    </span>
  );
};

// ─── View Modal ───────────────────────────────────────────────────────────────

const ViewVoidModal: React.FC<{ onClose: () => void; log: VoidLog }> = ({ onClose, log }) => {
  const rows: [string, React.ReactNode][] = [
    ['Log ID',    `#${log.id}`],
    ['Invoice',   <span className="font-mono text-xs">{log.invoice}</span>],
    ['Cashier',   log.cashier],
    ['Amount',    <span className="font-bold text-red-600">₱{log.amount.toFixed(2)}</span>],
    ['Reason',    log.reason],
    ['Date/Time', log.created_at],
    ['Status',    <StatusBadge status={log.status} />],
  ];

  return createPortal(
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-6"
      style={{ backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', backgroundColor: 'rgba(0,0,0,0.45)' }}>
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md border border-zinc-200 rounded-[1.25rem] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-violet-50 border border-violet-200 rounded-lg flex items-center justify-center">
              <Eye size={15} className="text-violet-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#1a0f2e]">Void Details</p>
              <p className="text-[10px] text-zinc-400">Invoice {log.invoice}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-100 rounded-lg transition-colors text-zinc-400 hover:text-zinc-600">
            <X size={16} />
          </button>
        </div>
        {/* Body */}
        <div className="px-6 py-5 flex flex-col divide-y divide-zinc-100">
          {rows.map(([label, val]) => (
            <div key={label as string} className="flex items-center justify-between py-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{label}</span>
              <span className="text-xs font-semibold text-zinc-700 text-right max-w-[60%]">{val}</span>
            </div>
          ))}
        </div>
        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-zinc-100">
          <Btn variant="secondary" onClick={onClose}>Close</Btn>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ─── Main Panel ───────────────────────────────────────────────────────────────

const VoidLogsPanel: React.FC<{ branchId: number | null }> = ({ branchId }) => {
  const [voidLogs,   setVoidLogs]   = useState<VoidLog[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [search,     setSearch]     = useState('');
  const [filter,     setFilter]     = useState<FilterTab>('all');
  const [viewTarget, setViewTarget] = useState<VoidLog | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true); setFetchError('');
    try {
      const res = await api.get('/void-logs', { params: { branch_id: branchId } });
      const payload = res.data;
      const raw: unknown[] = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data) ? payload.data : [];
      setVoidLogs(raw.map(mapVoidLog));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setFetchError(msg ?? 'Failed to load void logs.');
    } finally { setLoading(false); }
  }, [branchId]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const filtered = voidLogs
    .filter(l => filter === 'all' || l.status === filter)
    .filter(l =>
      l.invoice.toLowerCase().includes(search.toLowerCase()) ||
      l.cashier.toLowerCase().includes(search.toLowerCase()) ||
      l.reason.toLowerCase().includes(search.toLowerCase())
    );

  const pendingCount  = voidLogs.filter(l => l.status === 'pending').length;
  const approvedCount = voidLogs.filter(l => l.status === 'approved').length;
  const rejectedCount = voidLogs.filter(l => l.status === 'rejected').length;
  const totalAmount   = voidLogs.reduce((sum, l) => sum + l.amount, 0);

  const TABS: { key: FilterTab; label: string }[] = [
    { key: 'all',      label: 'All'      },
    { key: 'pending',  label: 'Pending'  },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
  ];

  return (
    <div className="p-6 md:p-8" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-bold text-[#1a0f2e]">Void Logs</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            {loading ? 'Loading...' : `${voidLogs.length} total · ${pendingCount} pending`}
          </p>
        </div>
        <Btn variant="secondary" onClick={fetchLogs} disabled={loading}>
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
        </Btn>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {/* Total */}
        <div className="bg-white border border-zinc-200 rounded-[0.625rem] px-5 py-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-violet-50 border border-violet-200 flex items-center justify-center rounded-[0.4rem] shrink-0">
            <FileX size={15} className="text-violet-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Total Voids</p>
            <p className="text-xl font-bold text-[#1a0f2e] tabular-nums">{loading ? '—' : voidLogs.length}</p>
          </div>
        </div>
        {/* Pending */}
        <div className="bg-white border border-zinc-200 rounded-[0.625rem] px-5 py-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-50 border border-amber-200 flex items-center justify-center rounded-[0.4rem] shrink-0">
            <Clock size={15} className="text-amber-500" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Pending</p>
            <p className="text-xl font-bold text-[#1a0f2e] tabular-nums">{loading ? '—' : pendingCount}</p>
          </div>
        </div>
        {/* Approved */}
        <div className="bg-white border border-zinc-200 rounded-[0.625rem] px-5 py-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 border border-emerald-200 flex items-center justify-center rounded-[0.4rem] shrink-0">
            <CheckCircle size={15} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Approved</p>
            <p className="text-xl font-bold text-[#1a0f2e] tabular-nums">{loading ? '—' : approvedCount}</p>
          </div>
        </div>
        {/* Total Value */}
        <div className="bg-white border border-zinc-200 rounded-[0.625rem] px-5 py-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-red-50 border border-red-200 flex items-center justify-center rounded-[0.4rem] shrink-0">
            <AlertTriangle size={15} className="text-red-500" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Total Value</p>
            <p className="text-xl font-bold text-[#1a0f2e] tabular-nums">
              {loading ? '—' : `₱${totalAmount.toFixed(2)}`}
            </p>
          </div>
        </div>
      </div>

      {/* ── Table Card ── */}
      <div className="bg-white border border-zinc-200 rounded-[0.625rem] overflow-hidden">

        {/* Search + Filter tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 border-b border-zinc-100">
          {/* Search */}
          <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 flex-1">
            <Search size={13} className="text-zinc-400 shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm text-zinc-700 outline-none placeholder:text-zinc-400"
              placeholder="Search invoice, cashier, reason..."
            />
          </div>
          {/* Filter tabs */}
          <div className="flex items-center gap-1 bg-zinc-50 border border-zinc-200 rounded-lg p-1 shrink-0">
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
                  filter === key
                    ? 'bg-[#1a0f2e] text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100'
                }`}>
                {label}
                {key !== 'all' && !loading && (
                  <span className={`ml-1.5 text-[9px] tabular-nums ${filter === key ? 'opacity-70' : 'opacity-50'}`}>
                    {key === 'pending' ? pendingCount : key === 'approved' ? approvedCount : rejectedCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100">
                {['Invoice', 'Cashier', 'Amount', 'Reason', 'Date / Time', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-zinc-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>

              {/* Skeleton */}
              {loading && [...Array(4)].map((_, i) => (
                <tr key={i} className="border-b border-zinc-50">
                  {[...Array(7)].map((_, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-3 bg-zinc-100 rounded animate-pulse" style={{ width: `${55 + (j * 9) % 40}%` }} />
                    </td>
                  ))}
                </tr>
              ))}

              {/* Error */}
              {!loading && fetchError && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle size={20} className="text-red-400" />
                      <p className="text-sm font-semibold text-red-500">{fetchError}</p>
                      <Btn variant="secondary" size="sm" onClick={fetchLogs}>Try again</Btn>
                    </div>
                  </td>
                </tr>
              )}

              {/* Empty */}
              {!loading && !fetchError && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-zinc-400 text-xs font-medium">
                    {search || filter !== 'all'
                      ? 'No void logs match your filters.'
                      : 'No void logs found for this branch.'}
                  </td>
                </tr>
              )}

              {/* Data rows */}
              {!loading && !fetchError && filtered.map(log => (
                <tr key={log.id} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <span className="font-mono text-xs font-bold text-[#1a0f2e]">{log.invoice}</span>
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-[#1a0f2e]">{log.cashier}</td>
                  <td className="px-5 py-3.5 font-bold text-red-600 tabular-nums">
                    ₱{log.amount.toFixed(2)}
                  </td>
                  <td className="px-5 py-3.5 text-zinc-500 max-w-50 truncate">{log.reason}</td>
                  <td className="px-5 py-3.5 text-zinc-400 text-xs whitespace-nowrap">{log.created_at}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={log.status} /></td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => setViewTarget(log)}
                      className="p-1.5 hover:bg-violet-50 rounded-[0.4rem] text-zinc-400 hover:text-violet-600 transition-colors"
                      title="View details">
                      <Eye size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal ── */}
      {viewTarget && (
        <ViewVoidModal onClose={() => setViewTarget(null)} log={viewTarget} />
      )}
    </div>
  );
};

export default VoidLogsPanel;