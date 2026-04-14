"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, X, Download,
  BarChart3, TrendingUp, TrendingDown, Minus, Clock,
} from 'lucide-react';
import api from '../../../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UsageRow {
  id:           number;
  name:         string;
  unit:         string;
  category:     string;
  beg:          number;  // beginning stock
  del:          number;  // deliveries
  cooked:       number;  // intermediate produced
  out:          number;  // consumed/sold
  spoil:        number;  // spoilage
  end:          number;  // ending stock
  usage:        number;  // total used
  variance:     number;  // end - (beg + del + cooked - out - spoil)
}

interface Movement {
  id:           number;
  type:         string;
  quantity:     number;
  reason:       string;
  performed_by: string;
  created_at:   string;
}

interface Branch { id: number; name: string; }

// ─── Helpers ──────────────────────────────────────────────────────────────────

const varianceColor = (v: number) => {
  if (v === 0)  return { text: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' };
  if (v > 0)    return { text: '#d97706', bg: '#fffbeb', border: '#fde68a' };
  return              { text: '#dc2626', bg: '#fef2f2', border: '#fecaca' };
};

const varianceLabel = (v: number) => {
  if (v === 0) return 'Zero';
  if (v > 0)   return `+${v}`;
  return String(v);
};

const timeAgo = (d: string) => {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1)  return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(d).toLocaleDateString();
};

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

// ─── Movement Drawer ──────────────────────────────────────────────────────────

const MovementDrawer: React.FC<{
  row:     UsageRow;
  period:  string;
  onClose: () => void;
}> = ({ row, period, onClose }) => {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    api.get(`/raw-materials/${row.id}/history`, { params: { period } })
      .then(r => setMovements(r.data?.data ?? r.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [row.id, period]);

  const typeColor = (t: string) => {
    if (t === 'add')      return '#16a34a';
    if (t === 'subtract') return '#dc2626';
    return '#3b2063';
  };
  const typePrefix = (t: string) => t === 'add' ? '+' : t === 'subtract' ? '-' : '=';

  return (
    <div className="fixed inset-0 z-9999 flex justify-end"
      style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.35)' }}>
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white w-full max-w-sm h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 bg-[#faf9ff]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#3b2063] rounded-lg flex items-center justify-center">
              <Clock size={14} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#1a0f2e] leading-tight">{row.name}</p>
              <p className="text-[10px] text-zinc-400 uppercase tracking-widest">Movements for {period}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-400">
            <X size={16} />
          </button>
        </div>

        {/* Summary strip */}
        <div className="grid grid-cols-3 border-b border-zinc-100">
          {[
            { label: 'BEG', value: row.beg, color: '#71717a' },
            { label: 'USED', value: row.usage, color: '#3b2063' },
            { label: 'END', value: row.end, color: '#1a0f2e' },
          ].map(s => (
            <div key={s.label} className="text-center py-3 border-r border-zinc-100 last:border-0">
              <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">{s.label}</p>
              <p className="text-base font-black tabular-nums" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[9px] text-zinc-400">{row.unit}</p>
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-5 space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-12 bg-zinc-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : movements.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2 px-6 text-center">
              <Clock size={28} className="text-zinc-200" />
              <p className="text-xs font-bold text-zinc-300 uppercase tracking-widest">No movements for this period</p>
            </div>
          ) : movements.map(m => (
            <div key={m.id} className="flex items-start gap-3 px-5 py-3.5 border-b border-zinc-50 hover:bg-[#faf9ff] transition-colors">
              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: m.type === 'add' ? '#f0fdf4' : m.type === 'subtract' ? '#fef2f2' : '#f5f0ff' }}>
                {m.type === 'add'
                  ? <TrendingUp  size={12} color="#16a34a" />
                  : m.type === 'subtract'
                  ? <TrendingDown size={12} color="#dc2626" />
                  : <Minus       size={12} color="#3b2063" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold" style={{ color: typeColor(m.type) }}>
                    {typePrefix(m.type)}{m.quantity} {row.unit}
                  </span>
                  <span className="text-[10px] text-zinc-400">{timeAgo(m.created_at)}</span>
                </div>
                <p className="text-[11px] text-zinc-500 mt-0.5 truncate">{m.reason}</p>
                <p className="text-[10px] text-zinc-400">by {m.performed_by}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const COLUMN_GUIDE: Record<string, string> = {
  BEG:    'Beginning stock at start of period',
  DEL:    'Deliveries / stock additions received',
  COOKED: 'Intermediate items produced in-house',
  OUT:    'Consumed via sales (auto-deducted)',
  SPOIL:  'Spoilage or manual write-offs',
  END:    'Ending stock at close of period',
  USAGE:  'Total consumed = OUT + SPOIL',
  VAR:    'Variance = END − (BEG + DEL + COOKED − OUT − SPOIL)',
};

const BM_InventoryReports: React.FC = () => {
  const now   = new Date();
  const [rows,          setRows]          = useState<UsageRow[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState('');
  const PERIOD = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/inventory/usage-report', { params: { period: PERIOD } });
      const d = res.data;
      setRows(Array.isArray(d) ? d : d?.data ?? []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [PERIOD]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await api.get('/inventory/usage-report/export', {
        params: { period: PERIOD },
        responseType: 'blob',
      });
      const url  = URL.createObjectURL(res.data);
      const link = document.createElement('a');
      link.href     = url;
      link.download = `usage-report-${period}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) { console.error(e); }
    finally { setExporting(false); }
  };

  const filtered = rows.filter(r => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  // Summary stats
  const totalUsage  = rows.reduce((s, r) => s + r.usage, 0);
  const totalSpoil  = rows.reduce((s, r) => s + r.spoil, 0);
  const negVar      = rows.filter(r => r.variance < 0).length;
  const posVar      = rows.filter(r => r.variance > 0).length;

  const Skeleton = () => (
    <>
      {[...Array(7)].map((_, i) => (
        <tr key={i} className="border-b border-zinc-50">
          {[...Array(9)].map((_, j) => (
            <td key={j} className="px-4 py-3.5">
              <div className="h-3 bg-zinc-100 rounded animate-pulse" style={{ width: `${50 + (j * 7) % 40}%` }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );

  return (
    <div className="p-6 md:p-8 bg-[#f4f2fb] min-h-full">

      <div className="flex flex-col md:flex-row md:items-center gap-6 mb-8">
        <div className="flex-1 flex flex-col md:flex-row items-center gap-3">
          <div className="relative group flex-1 w-full md:w-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-[#3b2063]" size={15} />
            <input
              type="text"
              placeholder="Search inventory items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#ede8ff] focus:border-[#3b2063] transition-all shadow-sm"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}
              className="bg-white border border-zinc-200 rounded-xl px-4 py-3 text-xs font-bold text-zinc-600 outline-none shadow-sm cursor-pointer hover:bg-zinc-50 transition-all flex-1">
              {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
            <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}
              className="bg-white border border-zinc-200 rounded-xl px-4 py-3 text-xs font-bold text-zinc-600 outline-none shadow-sm cursor-pointer hover:bg-zinc-50 transition-all flex-1">
              {[now.getFullYear() - 1, now.getFullYear()].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-auto w-full md:w-auto">
            <button onClick={handleExport} disabled={exporting || loading}
              className="w-full md:w-auto bg-[#3b2063] hover:bg-[#2d1851] text-white px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-sm">
              <Download size={15} /> {exporting ? "Exporting..." : "Export CSV"}
            </button>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
        {[
          { label: 'Total Items',     value: rows.length,  color: '#3b2063', bg: '#f5f0ff', border: '#e9d5ff' },
          { label: 'Total Usage',     value: totalUsage,   color: '#1a0f2e', bg: '#faf9ff', border: '#e9d5ff' },
          { label: 'Total Spoilage',  value: totalSpoil,   color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
          { label: 'Negative Var.',   value: negVar,       color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
        ].map(s => (
          <div key={s.label} className="bg-white border rounded-[0.625rem] px-5 py-4 shadow-sm" style={{ borderColor: s.border }}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">{s.label}</p>
            <p className="text-2xl font-black tabular-nums" style={{ color: s.color }}>{loading ? '—' : s.value}</p>
          </div>
        ))}
      </div>      <div className="bg-white border border-zinc-200 rounded-[0.625rem] overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 bg-zinc-50/20">
          <p className="text-xs font-black uppercase tracking-widest text-[#1a0f2e]">Inventory Usage Ledger</p>
          <button onClick={() => setShowGuide(!showGuide)} className="text-[10px] font-bold text-zinc-400 hover:text-[#3b2063] underline">
            {showGuide ? "Hide Guide" : "Show Guide"}
          </button>
        </div>
        {/* Column guide */}
        {showGuide && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-5 py-4 bg-[#faf9ff] border-b border-zinc-100">
            {Object.entries(COLUMN_GUIDE).map(([col, desc]) => (
              <div key={col} className="flex items-start gap-2">
                <span className="text-[9px] font-black text-[#3b2063] bg-[#f5f0ff] px-1.5 py-0.5 rounded border border-[#e9d5ff] shrink-0 mt-0.5">{col}</span>
                <p className="text-[10px] text-zinc-500 leading-tight">{desc}</p>
              </div>
            ))}
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: 900 }}>
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-zinc-400 sticky left-0 bg-white">Item</th>
                {['BEG', 'DEL', 'COOKED', 'OUT', 'SPOIL', 'END', 'USAGE', 'VAR'].map(h => (
                  <th key={h} className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-zinc-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? <Skeleton /> : filtered.length === 0 ? (
                <tr><td colSpan={9} className="py-16 text-center">
                  <BarChart3 size={32} className="mx-auto text-zinc-200 mb-3" />
                  <p className="text-xs font-bold text-zinc-300 uppercase tracking-widest">
                    {search ? 'No items match your search' : 'No usage data for this period'}
                  </p>
                </td></tr>
              ) : filtered.map(r => {
                const vc = varianceColor(r.variance);
                return (
                  <tr key={r.id}
                    onClick={() => setDrawerRow(r)}
                    className="border-b border-zinc-50 hover:bg-[#faf9ff] cursor-pointer transition-colors">
                    <td className="px-4 py-3.5 sticky left-0 bg-white hover:bg-[#faf9ff]">
                      <p className="font-bold text-[#1a0f2e] text-xs">{r.name}</p>
                      <p className="text-[10px] text-zinc-400">{r.category} · {r.unit}</p>
                    </td>
                    <td className="px-4 py-3.5 text-right text-xs font-medium text-zinc-500 tabular-nums">{r.beg}</td>
                    <td className="px-4 py-3.5 text-right text-xs font-medium tabular-nums" style={{ color: r.del > 0 ? '#16a34a' : '#a1a1aa' }}>{r.del}</td>
                    <td className="px-4 py-3.5 text-right text-xs font-medium tabular-nums" style={{ color: r.cooked > 0 ? '#2563eb' : '#a1a1aa' }}>{r.cooked}</td>
                    <td className="px-4 py-3.5 text-right text-xs font-medium tabular-nums" style={{ color: r.out > 0 ? '#3b2063' : '#a1a1aa' }}>{r.out}</td>
                    <td className="px-4 py-3.5 text-right text-xs font-medium tabular-nums" style={{ color: r.spoil > 0 ? '#dc2626' : '#a1a1aa' }}>{r.spoil}</td>
                    <td className="px-4 py-3.5 text-right text-xs font-bold text-[#1a0f2e] tabular-nums">{r.end}</td>
                    <td className="px-4 py-3.5 text-right text-xs font-bold tabular-nums" style={{ color: '#3b2063' }}>{r.usage}</td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold border tabular-nums"
                        style={{ background: vc.bg, color: vc.text, borderColor: vc.border }}>
                        {varianceLabel(r.variance)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {!loading && filtered.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-zinc-200 bg-zinc-50">
                  <td className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400">TOTALS</td>
                  {(['beg','del','cooked','out','spoil','end','usage'] as (keyof UsageRow)[]).map(k => (
                    <td key={k} className="px-4 py-3 text-right text-xs font-black text-[#1a0f2e] tabular-nums">
                      {filtered.reduce((s, r) => s + (r[k] as number), 0)}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right">
                    <span className="text-[10px] font-bold text-zinc-400">
                      {negVar}↓ {posVar}↑
                    </span>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {drawerRow && (
        <MovementDrawer
          row={drawerRow}
          period={PERIOD}
          onClose={() => setDrawerRow(null)}
        />
      )}
    </div>
  );
};

export default BM_InventoryReports;