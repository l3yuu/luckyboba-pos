"use client"

import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../../services/api';
import { isAxiosError } from 'axios';
import {
  ArrowRightLeft, Plus, X, Check, CheckCircle2,
  RefreshCw, Search, Package, Layers, Clock,
} from 'lucide-react';

// ─── Design tokens ─────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');
  .bst-root, .bst-root * { font-family: 'DM Sans', sans-serif !important; box-sizing: border-box; }
  .bst-label { font-size: 0.6rem; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: #71717a; }
  .bst-live { display:inline-flex;align-items:center;gap:5px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:100px;padding:3px 9px; }
  .bst-live-dot { width:5px;height:5px;border-radius:50%;background:#22c55e;box-shadow:0 0 5px rgba(34,197,94,.6);animation:bst-pulse 2s infinite; }
  .bst-live-text { font-size:0.52rem;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#16a34a; }
  @keyframes bst-pulse{0%,100%{opacity:1}50%{opacity:.45}}
`;

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Branch {
  id: number;
  name: string;
  code?: string;
}

interface RawMaterial {
  id: number;
  name: string;
  unit: string;
  category: string;
  current_stock: number;
}

type TransferStatus = 'Pending' | 'Completed' | 'Cancelled';

interface TransferRecord {
  id: number;
  from_branch: string;
  to_branch: string;
  item_name: string;
  quantity: number;
  unit: string;
  status: TransferStatus;
  notes: string | null;
  created_at: string;
}

interface TransferFormItem {
  raw_material_id: string;
  quantity: string;
  _key: number;
}

interface Toast { id: number; message: string; type: 'success' | 'error'; }

// ─── Helpers ───────────────────────────────────────────────────────────────────
function parseNum(v: unknown): number { const n = parseFloat(String(v)); return isNaN(n) ? 0 : n; }

// ─── Toast Stack ──────────────────────────────────────────────────────────────
function ToastStack({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className={`flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl text-white text-xs font-bold uppercase tracking-widest pointer-events-auto border border-white/10 ${t.type === 'success' ? 'bg-[#1a0f2e]' : 'bg-red-600'}`}>
          {t.type === 'success' ? <CheckCircle2 size={14} /> : <X size={14} />}
          <span>{t.message}</span>
          <button onClick={() => onRemove(t.id)} className="ml-1 opacity-50 hover:opacity-100 transition-opacity"><X size={12} /></button>
        </div>
      ))}
    </div>
  );
}

// ─── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: TransferStatus }) {
  const map: Record<TransferStatus, { bg: string; color: string; border: string }> = {
    Completed: { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
    Pending:   { bg: '#fef3c7', color: '#d97706', border: '#fde68a' },
    Cancelled: { bg: '#fee2e2', color: '#dc2626', border: '#fecaca' },
  };
  const s = map[status];
  return (
    <span style={{ fontSize: '0.58rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: '100px', padding: '2px 9px' }}>
      {status}
    </span>
  );
}

// ─── Modal Shell ───────────────────────────────────────────────────────────────
function ModalShell({ onClose, children, wide }: { onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <div ref={ref} onClick={e => { if (e.target === ref.current) onClose(); }}
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`bg-white rounded-2xl shadow-2xl border border-gray-100 w-full overflow-hidden flex flex-col ${wide ? 'max-w-xl' : 'max-w-sm'}`}
        style={{ maxHeight: '92vh' }}>
        {children}
      </div>
    </div>
  );
}

// ─── Shared select styles ─────────────────────────────────────────────
const selectCls = `w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-[#f5f4f8] text-[#1a0f2e] font-semibold text-sm outline-none focus:border-[#c4b5fd] focus:bg-white cursor-pointer transition-all`;

// ─── Main Component ────────────────────────────────────────────────────────────
const BM_InventoryStockTransfer = () => {
  // ── Toast ────────────────────────────────────────────────────────────────
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastCounter = useRef(0);
  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = ++toastCounter.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);
  const removeToast = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

  // ── Data state ───────────────────────────────────────────────────────────
  const [branches,   setBranches]   = useState<Branch[]>([]);
  const [materials,  setMaterials]  = useState<RawMaterial[]>([]);
  const [transfers,  setTransfers]  = useState<TransferRecord[]>([]);
  const [loading,    setLoading]    = useState(true);

  // ── Filters ──────────────────────────────────────────────────────────────
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TransferStatus>('all');

  // ── Transfer form state ──────────────────────────────────────────────────  
  const [isModalOpen,  setIsModalOpen]  = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fromBranch,   setFromBranch]   = useState('');
  const [toBranch,     setToBranch]     = useState('');
  const [notes,        setNotes]        = useState('');
  const [formItems,    setFormItems]    = useState<TransferFormItem[]>([{ raw_material_id: '', quantity: '', _key: Date.now() }]);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [branchRes, matRes, transferRes] = await Promise.all([
        api.get('/branches').catch(() => ({ data: [] })),
        api.get('/raw-materials').catch(() => ({ data: [] })),
        api.get('/stock-transfers').catch(() => ({ data: [] })),
      ]);
      setBranches(branchRes.data);
      setMaterials(matRes.data);
      // Normalize — handle both flat array and paginated shape
      const raw = Array.isArray(transferRes.data)
        ? transferRes.data
        : (transferRes.data?.data ?? transferRes.data?.transfers ?? []);
      setTransfers(raw);
    } catch { showToast('Failed to load data.', 'error'); }
    finally { setLoading(false); }
  }, [showToast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Computed stats ────────────────────────────────────────────────────────
  const totalTransfers  = transfers.length;
  const pendingCount    = transfers.filter(t => t.status === 'Pending').length;
  const completedCount  = transfers.filter(t => t.status === 'Completed').length;

  // ── Filtered rows ─────────────────────────────────────────────────────────
  const displayRows = transfers
    .filter(t => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return t.item_name?.toLowerCase().includes(q) ||
               t.from_branch?.toLowerCase().includes(q) ||
               t.to_branch?.toLowerCase().includes(q);
      }
      return true;
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // ── Form helpers ──────────────────────────────────────────────────────────
  const addRow    = () => setFormItems(prev => [...prev, { raw_material_id: '', quantity: '', _key: Date.now() }]);
  const removeRow = (key: number) => setFormItems(prev => prev.filter(r => r._key !== key));
  const updateRow = (key: number, field: keyof Omit<TransferFormItem, '_key'>, value: string) =>
    setFormItems(prev => prev.map(r => r._key === key ? { ...r, [field]: value } : r));

  const resetForm = () => {
    setFromBranch(''); setToBranch(''); setNotes('');
    setFormItems([{ raw_material_id: '', quantity: '', _key: Date.now() }]);
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromBranch || !toBranch) { showToast('Select both branches.', 'error'); return; }
    if (fromBranch === toBranch)  { showToast('From and To branches must differ.', 'error'); return; }
    if (formItems.some(r => !r.raw_material_id || !r.quantity)) {
      showToast('Fill all item rows.', 'error'); return;
    }
    setIsSubmitting(true);
    try {
      await api.post('/stock-transfers', {
        from_branch_id: parseInt(fromBranch),
        to_branch_id:   parseInt(toBranch),
        notes:          notes || null,
        items: formItems.map(r => ({
          raw_material_id: parseInt(r.raw_material_id),
          quantity:        parseFloat(r.quantity),
        })),
      });
      showToast('Stock transfer initiated!', 'success');
      setIsModalOpen(false);
      resetForm();
      await fetchAll();
    } catch (err) {
      const msg = isAxiosError(err) ? err.response?.data?.message : 'Transfer failed.';
      showToast(msg || 'Transfer failed.', 'error');
    } finally { setIsSubmitting(false); }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{STYLES}</style>
      <ToastStack toasts={toasts} onRemove={removeToast} />

      <div className="bst-root flex flex-col h-full bg-[#f5f4f8] overflow-hidden">
        <div className="flex-1 overflow-y-auto px-5 md:px-8 pb-8 pt-5 flex flex-col gap-5">

          {/* ── Header ── */}
          <div className="flex items-center justify-between">
            <div>
              <p className="bst-label">Inventory</p>
              <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1a0f2e', letterSpacing: '-0.025em', marginTop: 2 }}>Stock Transfer</h1>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => fetchAll()} disabled={loading}
                className="h-9 px-4 rounded-xl border border-gray-200 text-zinc-500 font-bold text-xs uppercase tracking-widest hover:bg-white transition-all flex items-center gap-2 disabled:opacity-50">
                <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
              </button>
              <button onClick={() => setIsModalOpen(true)}
                className="h-9 px-5 rounded-xl bg-[#1a0f2e] hover:bg-[#2a1647] text-white font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all">
                <Plus size={13} /> New Transfer
              </button>
            </div>
          </div>

          {/* ── Stat Cards ── */}
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
            {[
              { label: 'Total Transfers', value: totalTransfers, sub: 'all time',         icon: <ArrowRightLeft size={14} strokeWidth={2.5} />, iconBg: '#ede9fe', iconColor: '#7c3aed', vc: '#3b2063' },
              { label: 'Pending',         value: pendingCount,   sub: 'awaiting action',  icon: <Clock size={14} strokeWidth={2.5} />,         iconBg: '#fef3c7', iconColor: '#d97706', vc: pendingCount > 0 ? '#d97706' : '#1a0f2e' },
              { label: 'Completed',       value: completedCount, sub: 'successfully done', icon: <CheckCircle2 size={14} strokeWidth={2.5} />,  iconBg: '#dcfce7', iconColor: '#16a34a', vc: '#1a0f2e' },
            ].map((s, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col gap-3 hover:shadow-md hover:border-[#ddd6f7] transition-all">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="bst-label">{s.label}</p>
                    <p style={{ fontSize: '0.6rem', color: '#a1a1aa', marginTop: 2 }}>{s.sub}</p>
                  </div>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: s.iconBg, color: s.iconColor }}>{s.icon}</div>
                </div>
                <p style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1, color: s.vc }}>
                  {loading ? '…' : s.value}
                </p>
              </div>
            ))}
          </div>

          {/* ── Table Card ── */}
          <div className="bg-white border border-gray-100 rounded-2xl flex flex-col overflow-hidden">

            {/* Card header + filters */}
            <div className="px-6 py-4 border-b border-gray-50 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#ede9fe', color: '#7c3aed' }}>
                  <Layers size={16} strokeWidth={2.5} />
                </div>
                <div>
                  <h2 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#1a0f2e', letterSpacing: '-0.02em', margin: 0 }}>Transfer Log</h2>
                  <p className="bst-label" style={{ color: '#a1a1aa', marginTop: 2 }}>All stock movements between branches</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Status filter */}
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
                  className="border border-gray-100 bg-[#f5f4f8] px-2.5 py-1.5 rounded-lg outline-none text-[#1a0f2e] font-semibold text-xs focus:border-[#c4b5fd] cursor-pointer transition-colors">
                  <option value="all">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
                {/* Search */}
                <div className="flex items-center gap-1.5 border border-gray-100 bg-[#f5f4f8] px-3 py-1.5 rounded-lg focus-within:border-[#c4b5fd] transition-colors">
                  <Search size={12} className="text-zinc-400 shrink-0" />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
                    className="bg-transparent outline-none text-xs font-semibold text-[#1a0f2e] w-36 placeholder:text-zinc-400" />
                </div>
                <div className="bst-live"><div className="bst-live-dot" /><span className="bst-live-text">Live</span></div>
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
              {loading && transfers.length === 0 ? (
                <div className="py-16 flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-[#3b2063] border-t-transparent animate-spin rounded-full" />
                  <p className="bst-label" style={{ color: '#a1a1aa' }}>Loading…</p>
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead className="sticky top-0 bg-white z-10 border-b border-gray-50">
                    <tr>
                      {['#', 'Item', 'From', 'To', 'Qty', 'Status', 'Date'].map((h, i) => (
                        <th key={h} className={`px-5 py-3.5 bst-label ${i === 4 ? 'text-center' : i === 5 ? 'text-center' : ''}`} style={{ color: '#a1a1aa' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {displayRows.length > 0 ? displayRows.map((t, idx) => (
                      <tr key={t.id} className="hover:bg-[#f5f4f8] transition-colors">
                        <td className="px-5 py-3">
                          <span style={{ width: 22, height: 22, borderRadius: '0.35rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.52rem', fontWeight: 800, background: idx === 0 ? '#3b2063' : '#f4f4f5', color: idx === 0 ? '#fff' : '#71717a' }}>
                            {idx + 1}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-1.5">
                            <Package size={11} color="#a78bfa" strokeWidth={2.5} />
                            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1a0f2e' }}>{t.item_name ?? '—'}</span>
                          </div>
                          {t.notes && <p className="bst-label mt-0.5" style={{ color: '#a1a1aa' }}>{t.notes}</p>}
                        </td>
                        <td className="px-5 py-3">
                          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#71717a' }}>{t.from_branch}</span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-1">
                            <ArrowRightLeft size={10} color="#a78bfa" strokeWidth={2.5} />
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#3b2063' }}>{t.to_branch}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1a0f2e' }}>{parseNum(t.quantity).toFixed(2)}</span>
                          <span style={{ fontSize: '0.65rem', color: '#a1a1aa', marginLeft: 3 }}>{t.unit}</span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <StatusBadge status={t.status} />
                        </td>
                        <td className="px-5 py-3">
                          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#71717a' }}>
                            {new Date(t.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={7} className="px-8 py-20 text-center">
                          <div className="w-11 h-11 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: '#f4f4f5' }}>
                            <ArrowRightLeft size={18} color="#d4d4d8" />
                          </div>
                          <p className="bst-label" style={{ color: '#d4d4d8' }}>
                            {search || statusFilter !== 'all' ? 'No matching transfers' : 'No transfers recorded yet'}
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center px-6 py-4 bg-[#1a0f2e] rounded-b-2xl">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <ArrowRightLeft size={12} color="rgba(255,255,255,0.5)" strokeWidth={2.5} />
                </div>
                <p className="bst-label" style={{ color: 'rgba(255,255,255,0.45)', margin: 0 }}>Stock Transfers</p>
              </div>
              <p style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', margin: 0 }}>
                {displayRows.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ══ NEW TRANSFER MODAL ══ */}
      {isModalOpen && (
        <ModalShell onClose={() => { setIsModalOpen(false); resetForm(); }} wide>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-50 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-[#1a0f2e]">
                <ArrowRightLeft size={14} color="#fff" />
              </div>
              <div>
                <p className="bst-label">Inventory</p>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1a0f2e', margin: 0 }}>New Stock Transfer</h3>
              </div>
            </div>
            <button onClick={() => { setIsModalOpen(false); resetForm(); }}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-400 hover:bg-gray-100 transition-colors">
              <X size={15} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

              {/* Branch selectors */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="bst-label ml-1">From Branch *</label>
                  <select value={fromBranch} onChange={e => setFromBranch(e.target.value)} required className={selectCls}>
                    <option value="">— Select source —</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="bst-label ml-1">To Branch *</label>
                  <select value={toBranch} onChange={e => setToBranch(e.target.value)} required className={selectCls}>
                    <option value="">— Select destination —</option>
                    {branches.filter(b => String(b.id) !== fromBranch).map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Arrow indicator */}
              {fromBranch && toBranch && (
                <div className="flex items-center justify-center gap-3 py-1">
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#3b2063', background: '#ede9fe', border: '1px solid #ddd6f7', borderRadius: '100px', padding: '3px 10px' }}>
                    {branches.find(b => String(b.id) === fromBranch)?.name}
                  </span>
                  <ArrowRightLeft size={14} color="#a78bfa" />
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '100px', padding: '3px 10px' }}>
                    {branches.find(b => String(b.id) === toBranch)?.name}
                  </span>
                </div>
              )}

              {/* Items table */}
              <div className="border border-gray-100 rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-[#f5f4f8] border-b border-gray-100">
                  <p className="bst-label">Items to Transfer</p>
                  <button type="button" onClick={addRow}
                    className="h-7 px-3 bg-[#1a0f2e] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#2a1647] transition-colors rounded-xl flex items-center gap-1">
                    <Plus size={11} /> Add Row
                  </button>
                </div>
                {/* Column headers */}
                <div className="grid grid-cols-[2fr_1fr_auto] bg-white border-b border-gray-50">
                  {['Raw Material', 'Quantity', ''].map((h, i) => (
                    <div key={i} className={`px-3 py-2 bst-label ${i === 2 ? 'w-10' : ''}`} style={{ color: '#a1a1aa' }}>{h}</div>
                  ))}
                </div>
                {formItems.map((row, idx) => (
                  <div key={row._key} className={`grid grid-cols-[2fr_1fr_auto] items-center ${idx < formItems.length - 1 ? 'border-b border-gray-50' : ''}`}>
                    <div className="px-2 py-2">
                      <select required value={row.raw_material_id}
                        onChange={e => updateRow(row._key, 'raw_material_id', e.target.value)}
                        className="w-full px-2 py-2 rounded-lg border border-gray-100 bg-[#f5f4f8] text-[#1a0f2e] font-semibold text-xs outline-none focus:border-[#c4b5fd] cursor-pointer">
                        <option value="">— Select item —</option>
                        {materials.map(m => (
                          <option key={m.id} value={m.id}>{m.name} ({parseNum(m.current_stock).toFixed(2)} {m.unit})</option>
                        ))}
                      </select>
                    </div>
                    <div className="px-2 py-2">
                      <input required type="number" min="0.0001" step="0.0001" placeholder="0" value={row.quantity}
                        onChange={e => updateRow(row._key, 'quantity', e.target.value)}
                        className="w-full px-2 py-2 rounded-lg border border-gray-100 bg-[#f5f4f8] text-xs font-semibold text-[#1a0f2e] outline-none focus:border-[#c4b5fd]" />
                    </div>
                    <div className="px-2 py-2 flex justify-center">
                      <button type="button" onClick={() => removeRow(row._key)} disabled={formItems.length === 1}
                        className="w-7 h-7 flex items-center justify-center text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-20">
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="bst-label ml-1">Notes (optional)</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="Reason for transfer, reference number, etc."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-[#f5f4f8] text-sm font-semibold outline-none focus:border-[#c4b5fd] focus:bg-white h-16 resize-none transition-all placeholder:text-zinc-400" />
              </div>

            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-50 flex gap-2 justify-end shrink-0">
              <button type="button" onClick={() => { setIsModalOpen(false); resetForm(); }}
                className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest text-zinc-500 bg-white border border-gray-200 hover:bg-gray-50 transition-all">
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest text-white bg-[#1a0f2e] hover:bg-[#2a1647] transition-all disabled:opacity-50 flex items-center gap-2">
                <Check size={12} />{isSubmitting ? 'Transferring…' : 'Initiate Transfer'}
              </button>
            </div>
          </form>
        </ModalShell>
      )}
    </>
  );
};

export default BM_InventoryStockTransfer;