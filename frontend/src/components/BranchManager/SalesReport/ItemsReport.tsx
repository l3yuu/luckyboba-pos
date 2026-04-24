import * as XLSX from 'xlsx';
import { useState, useCallback, useEffect } from 'react';
import api from '../../../services/api';
import {
  Calendar,
  FileText,
  LayoutGrid,
  FileDown,
  Printer,
  Database,
  ChevronDown,
  Activity,
  TrendingUp,
  ShoppingBag,
  DollarSign,
  ArrowUpRight,
  Search,
} from 'lucide-react';

// ============================================================
// STYLES — mirrors BranchManagerDashboard token set
// ============================================================

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');
  .ir-root, .ir-root * { font-family: 'DM Sans', sans-serif !important; box-sizing: border-box; }
  .ir-label { font-size: 0.62rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #3f3f46; }
  .ir-sub   { font-size: 0.65rem; font-weight: 400; color: #71717a; }
  .ir-value { font-size: 1.9rem; font-weight: 800; letter-spacing: -0.035em; line-height: 1; }
  .ir-tab { font-size: 0.6rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; padding: 6px 13px; border-radius: 0.4rem; border: none; cursor: pointer; transition: background 0.12s, color 0.12s; }
  .ir-tab-on  { background: #1a0f2e; color: #fff; }
  .ir-tab-off { background: transparent; color: #a1a1aa; }
  .ir-tab-off:hover { background: #ede8ff; color: #6a12b8; }
  .ir-pill { font-size: 0.58rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; border-radius: 100px; padding: 3px 9px; border: 1px solid #e4e4e7; background: #f4f4f5; color: #71717a; }
  .ir-live  {
    display: inline-flex; align-items: center; gap: 5px;
    background: #f0fdf4; border: 1px solid #bbf7d0;
    border-radius: 100px; padding: 4px 10px;
  }
  .ir-live-dot  { width: 5px; height: 5px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 5px rgba(34,197,94,0.6); animation: ir-pulse 2s infinite; }
  .ir-live-text { font-size: 0.55rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #16a34a; }
  @keyframes ir-pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }

  .printable-receipt { display: none; }
  @media print {
    @page { size: 80mm auto; margin: 0; }
    html, body { background: white !important; margin: 0 !important; padding: 0 !important; }
    #items-report-main { display: none !important; }
    .printable-receipt { display: block !important; position: absolute !important; left: 0 !important; top: 0 !important; width: 80mm !important; padding: 6mm !important; background: white !important; color: black !important; font-family: 'Courier New', monospace; }
    .receipt-divider { border-top: 1px dashed #000 !important; margin: 8px 0; width: 100%; }
    .flex-between { display: flex !important; justify-content: space-between !important; width: 100%; }
  }
  .receipt-divider { border-top: 1px dashed #000; margin: 8px 0; width: 100%; }
  .flex-between { display: flex; justify-content: space-between; width: 100%; }
`;

// ============================================================
// TYPE DEFINITIONS
// ============================================================

interface ReportItem {
  id: number;
  name: string;
  category: string;
  qty: number;
  amount: number;
}

interface ReportResponse {
  items: ReportItem[];
  total_qty: number;
  grand_total: number;
  cashier_name?: string;
}

// ============================================================
// HELPERS
// ============================================================

const CACHE_KEY_PREFIX = 'lucky_boba_items_report_';

const buildCacheKey = (from: string, to: string, type: string) =>
  `${CACHE_KEY_PREFIX}${from}_${to}_${type}`;

const getLocalToday = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().split('T')[0];
};

// ============================================================
// COMPONENT
// ============================================================

const ItemsReport = () => {
  const today = getLocalToday();
  const phCurrency = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });
  const fmtCompact = (v: number) => {
    if (v >= 1_000_000) return `₱${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `₱${(v / 1_000).toFixed(1)}K`;
    return `₱${v.toFixed(0)}`;
  };

  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [reportType, setReportType] = useState<'item-list' | 'category-summary'>('item-list');
  const [loading, setLoading] = useState(false);
  const [_error, _setError] = useState<string | null>(null);

  const [data, setData] = useState<ReportResponse | null>(() => {
    const key = buildCacheKey(today, today, 'item-list');
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : null;
  });

  const getCacheKey = useCallback(
    (from: string, to: string, type: string) => buildCacheKey(from, to, type),
    []
  );

  const fetchReport = useCallback(async () => {
    const key = getCacheKey(fromDate, toDate, reportType);
    setLoading(true);
    try {
      const response = await api.get('/reports/items-report', {
        params: { from: fromDate, to: toDate, type: reportType },
      });
      localStorage.setItem(key, JSON.stringify(response.data));
      setData(response.data);
    } catch (error) {
      console.error('Error fetching fresh report:', error);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, reportType, getCacheKey]);

  useEffect(() => {
    const key = getCacheKey(fromDate, toDate, reportType);
    const saved = localStorage.getItem(key);
    if (saved) setData(JSON.parse(saved));
    else fetchReport();
  }, [fromDate, toDate, reportType, getCacheKey, fetchReport]);

  const generateExcel = useCallback(() => {
    if (!data || data.items.length === 0) { alert('No data to export'); return; }
    const rows = data.items.map((item, index) => ({
      '#': index + 1,
      [reportType === 'category-summary' ? 'Category' : 'Item Name']: item.name,
      Category: item.category,
      'Qty Sold': item.qty,
      'Total Sales': item.amount,
    }));
    rows.push({ '#': '', [reportType === 'category-summary' ? 'Category' : 'Item Name']: 'GRAND TOTAL', Category: '', 'Qty Sold': data.total_qty, 'Total Sales': data.grand_total } as never);
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, `items_report_${fromDate}_to_${toDate}.xlsx`);
  }, [data, fromDate, toDate, reportType]);

  const handlePrint = () => {
    if (!data || data.items.length === 0) { alert('No data to print'); return; }
    setTimeout(() => window.print(), 150);
  };

  const hasData = data && data.items.length > 0;
  const grandTotal = data?.grand_total ?? 0;
  const totalQty = data?.total_qty ?? 0;
  const avgOrderValue = totalQty > 0 ? grandTotal / totalQty : 0;
  const topItem = data?.items.reduce((a, b) => b.qty > a.qty ? b : a, data.items[0]);

  // Summary stat cards — mirrors dashboard statCards pattern
  const summaryCards = [
    {
      label: 'Total Revenue',
      sub: 'Gross for selected range',
      value: phCurrency.format(grandTotal),
      compact: fmtCompact(grandTotal),
      icon: <DollarSign size={14} strokeWidth={2.5} />,
      iconBg: '#ede9fe', iconColor: '#7c3aed', valueColor: '#6a12b8',
    },
    {
      label: 'Total Items Sold',
      sub: 'Units across all products',
      value: totalQty.toLocaleString(),
      compact: totalQty >= 1000 ? `${(totalQty / 1000).toFixed(1)}K` : String(totalQty),
      icon: <ShoppingBag size={14} strokeWidth={2.5} />,
      iconBg: '#dcfce7', iconColor: '#16a34a', valueColor: '#1a0f2e',
    },
    {
      label: 'Avg Revenue / Item',
      sub: 'Revenue per unit sold',
      value: phCurrency.format(avgOrderValue),
      compact: fmtCompact(avgOrderValue),
      icon: <TrendingUp size={14} strokeWidth={2.5} />,
      iconBg: '#e0f2fe', iconColor: '#0284c7', valueColor: '#0c4a6e',
    },
    {
      label: 'Top Performer',
      sub: 'Highest qty this period',
      value: topItem?.name ?? '—',
      compact: topItem ? `${topItem.qty} sold` : '—',
      icon: <ArrowUpRight size={14} strokeWidth={2.5} />,
      iconBg: '#fef9c3', iconColor: '#ca8a04', valueColor: '#1a0f2e',
    },
  ];

  return (
    <>
      <style>{STYLES}</style>

      {/* ── PRINTABLE RECEIPT (unchanged logic) ── */}
      <div className="printable-receipt text-slate-800">
        <div className="text-center space-y-1">
          <h1 className="font-black text-[14px] uppercase leading-tight">Lucky Boba Milktea</h1>
          <p className="text-[10px] uppercase font-bold">Main Branch - QC</p>
          <div className="receipt-divider" />
          <h2 className="font-black text-[11px] uppercase tracking-widest">
            {reportType === 'category-summary' ? 'Category Summary' : 'Item Sales'} Report
          </h2>
          <div className="text-left text-[10px] space-y-0.5 mt-2 uppercase">
            <div className="flex-between"><span>From Date</span><span>{fromDate}</span></div>
            <div className="flex-between"><span>To Date</span><span>{toDate}</span></div>
            <div className="flex-between"><span>Print Time</span><span>{new Date().toLocaleTimeString()}</span></div>
            <div className="flex-between"><span>Terminal</span><span>POS-01</span></div>
          </div>
        </div>
        <div className="my-4 pt-2">
          <div className="receipt-divider" />
          <table className="w-full text-[10px]">
            <thead>
              <tr className="font-black border-b border-black text-left">
                <th className="pb-1 uppercase tracking-tighter w-1/2">{reportType === 'category-summary' ? 'Category' : 'Item'}</th>
                <th className="pb-1 text-center">QTY</th>
                <th className="pb-1 text-right">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-1 uppercase text-[9px] font-bold">{item.name}</td>
                  <td className="py-1 text-center font-bold">x{item.qty}</td>
                  <td className="py-1 text-right">{phCurrency.format(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="receipt-divider" />
          <div className="space-y-1 mt-2">
            <div className="flex-between text-[10px]"><span>TOTAL ITEMS SOLD</span><span className="font-bold">{data?.total_qty || 0}</span></div>
            <div className="flex-between font-black text-[12px] pt-1 border-t border-black"><span>TOTAL REVENUE</span><span>{phCurrency.format(data?.grand_total || 0)}</span></div>
          </div>
        </div>
        <div className="mt-8 text-center space-y-4">
          <div className="receipt-divider" />
          <div className="pt-2">
            <p className="text-[10px] font-bold uppercase">{data?.cashier_name || 'System Admin'}</p>
            <p className="text-[10px] leading-none">____________________</p>
            <p className="text-[8px] uppercase mt-1">Prepared By</p>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          MAIN UI  — consistent with BranchManagerDashboard
      ══════════════════════════════════════════════ */}
      <div id="items-report-main" className="ir-root flex flex-col h-full w-full bg-[#f5f4f8] overflow-hidden relative print:hidden">
        <div className="flex-1 overflow-y-auto px-5 md:px-8 pb-8 pt-5 flex flex-col gap-5">

          {/* ── SUMMARY STAT CARDS ── mirrors statCards grid */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((s, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col gap-3 hover:shadow-md hover:border-[#ddd6f7] transition-all">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="ir-label">{s.label}</p>
                    <p className="ir-sub" style={{ marginTop: 2 }}>{s.sub}</p>
                  </div>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: s.iconBg, color: s.iconColor }}>
                    {s.icon}
                  </div>
                </div>
                <div>
                  <p className="ir-value" style={{ color: s.valueColor }}>{s.compact}</p>
                  <p className="ir-sub" style={{ marginTop: 4, wordBreak: 'break-word' }}>{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── FILTER BAR ── */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-xl flex items-center justify-center"
                style={{ background: '#ede9fe', color: '#7c3aed' }}>
                <Search size={13} strokeWidth={2.5} />
              </div>
              <h2 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1a0f2e', letterSpacing: '-0.025em', margin: 0 }}>
                Report Filters
              </h2>
            </div>

            <div className="flex flex-col lg:flex-row gap-3 items-end">

              {/* From Date */}
              <div className="flex-1 w-full space-y-1.5">
                <label className="ir-label flex items-center gap-1.5 ml-1">
                  <Calendar size={11} /> From Date
                </label>
                <input
                  type="date" value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-[#f5f4f8] font-semibold text-sm text-[#1a0f2e] outline-none focus:border-[#ddd6f7] transition-colors"
                />
              </div>

              {/* To Date */}
              <div className="flex-1 w-full space-y-1.5">
                <label className="ir-label flex items-center gap-1.5 ml-1">
                  <Calendar size={11} /> To Date
                </label>
                <input
                  type="date" value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-[#f5f4f8] font-semibold text-sm text-[#1a0f2e] outline-none focus:border-[#ddd6f7] transition-colors"
                />
              </div>

              {/* Report Type */}
              <div className="flex-1 w-full space-y-1.5">
                <label className="ir-label flex items-center gap-1.5 ml-1">
                  <LayoutGrid size={11} /> Report Mode
                </label>
                <div className="relative">
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value as 'item-list' | 'category-summary')}
                    className="w-full px-4 py-3 pr-10 rounded-xl border border-gray-100 bg-[#f5f4f8] font-bold text-[#6a12b8] text-xs uppercase tracking-widest outline-none cursor-pointer appearance-none"
                  >
                    <option value="item-list">Detailed Item List</option>
                    <option value="category-summary">Category Summary</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 w-full lg:w-auto">
                <button
                  onClick={fetchReport} disabled={loading}
                  className="flex-1 lg:flex-none px-6 h-11 rounded-xl bg-[#1a0f2e] hover:bg-[#2a1647] text-white font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Activity size={13} />
                  {loading ? 'Loading…' : 'Query'}
                </button>
                <button
                  onClick={generateExcel} disabled={!hasData}
                  className="w-11 h-11 rounded-xl bg-white border border-gray-100 text-zinc-400 hover:text-[#6a12b8] hover:border-[#ddd6f7] flex items-center justify-center transition-all disabled:opacity-30"
                  title="Export to Excel"
                >
                  <FileDown size={16} />
                </button>
                <button
                  onClick={handlePrint} disabled={!hasData}
                  className="w-11 h-11 rounded-xl bg-white border border-gray-100 text-zinc-400 hover:text-[#6a12b8] hover:border-[#ddd6f7] flex items-center justify-center transition-all disabled:opacity-30"
                  title="Print Report"
                >
                  <Printer size={16} />
                </button>
              </div>
            </div>

            {_error && (
              <p className="mt-3 text-xs font-bold text-red-500 bg-red-50 px-4 py-2 rounded-xl">{_error}</p>
            )}
          </div>

          {/* ── REPORT TABLE ── */}
          <div className="bg-white border border-gray-100 rounded-2xl flex flex-col overflow-hidden relative">

            {/* Card Header — mirrors Top Sellers header style */}
            <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: '#ede9fe', color: '#7c3aed' }}>
                  <FileText size={16} strokeWidth={2.5} />
                </div>
                <div>
                  <h2 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1a0f2e', letterSpacing: '-0.025em', margin: 0 }}>
                    {reportType === 'category-summary' ? 'Category Summary' : 'Item Performance Ledger'}
                  </h2>
                  <p className="ir-label" style={{ color: '#a1a1aa', marginTop: 2 }}>
                    {data?.cashier_name ? `Operator: ${data.cashier_name}` : 'Terminal Audit · POS-01'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-1.5 ir-sub">
                  <span style={{
                    fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                    background: '#f4f4f5', color: '#71717a', border: '1px solid #e4e4e7',
                    borderRadius: '100px', padding: '3px 9px',
                  }}>
                    {data?.items.length ?? 0} records
                  </span>
                </div>
                <div className="ir-live">
                  <div className="ir-live-dot" />
                  <span className="ir-live-text">Live</span>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-white z-10 border-b border-gray-50">
                  <tr>
                    <th className="px-6 py-4 ir-label" style={{ color: '#a1a1aa' }}>
                      {reportType === 'category-summary' ? 'Category' : 'Item Description'}
                    </th>
                    {reportType === 'item-list' && (
                      <th className="px-6 py-4 ir-label text-left" style={{ color: '#a1a1aa' }}>Category</th>
                    )}
                    <th className="px-6 py-4 ir-label text-right" style={{ color: '#a1a1aa' }}>Units Sold</th>
                    <th className="px-6 py-4 ir-label text-right" style={{ color: '#a1a1aa' }}>Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data?.items.map((item, idx) => {
                    const rowPct = totalQty > 0 ? (item.qty / totalQty) * 100 : 0;
                    return (
                      <tr key={idx} className="hover:bg-[#f5f4f8] transition-colors group">
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <span style={{
                              width: 22, height: 22, borderRadius: '0.35rem', flexShrink: 0,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '0.55rem', fontWeight: 800,
                              background: idx === 0 ? '#6a12b8' : '#f4f4f5',
                              color: idx === 0 ? '#fff' : '#71717a',
                            }}>
                              {idx + 1}
                            </span>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1a0f2e' }}>
                              {item.name}
                            </span>
                          </div>
                        </td>
                        {reportType === 'item-list' && (
                          <td className="px-6 py-3.5">
                            <span style={{
                              fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                              background: '#f4f4f5', color: '#71717a', borderRadius: '100px',
                              padding: '2px 8px', border: '1px solid #e4e4e7',
                            }}>
                              {item.category}
                            </span>
                          </td>
                        )}
                        <td className="px-6 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-3">
                            {/* Mini progress bar */}
                            <div className="hidden md:flex items-center gap-1.5 w-20">
                              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full"
                                  style={{ width: `${rowPct}%`, background: idx === 0 ? '#6a12b8' : '#d4d4d8' }}
                                />
                              </div>
                              <span style={{ fontSize: '0.6rem', fontWeight: 700, color: '#a1a1aa', width: 28, textAlign: 'right' }}>
                                {rowPct.toFixed(0)}%
                              </span>
                            </div>
                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1a0f2e', letterSpacing: '-0.01em', minWidth: 32, textAlign: 'right' }}>
                              {item.qty.toLocaleString()}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#6a12b8', letterSpacing: '-0.01em' }}>
                            {phCurrency.format(item.amount)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}

                  {!loading && !hasData && (
                    <tr>
                      <td colSpan={reportType === 'item-list' ? 4 : 3} className="px-8 py-20 text-center">
                        <div className="w-11 h-11 rounded-2xl flex items-center justify-center mx-auto mb-3"
                          style={{ background: '#f4f4f5' }}>
                          <Database size={18} color="#d4d4d8" />
                        </div>
                        <p className="ir-label" style={{ color: '#d4d4d8' }}>No records for selected range</p>
                        <p className="ir-sub" style={{ color: '#e4e4e7', marginTop: 4 }}>Adjust dates and query again</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Grand Total Footer — mirrors dashboard's bottom bar */}
            <div className="flex justify-between items-center px-6 py-5 border-t border-gray-50 bg-[#1a0f2e] rounded-b-2xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <Activity size={14} color="rgba(255,255,255,0.5)" strokeWidth={2.5} />
                </div>
                <div>
                  <p style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
                    Period Total
                  </p>
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)', margin: 0 }}>
                    {fromDate} → {toDate}
                  </p>
                </div>
              </div>
              <div className="flex gap-8 text-right">
                <div>
                  <p style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 2 }}>
                    Volume
                  </p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.035em', color: '#fff', lineHeight: 1 }}>
                    {totalQty.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 2 }}>
                    Revenue
                  </p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.035em', color: '#4ade80', lineHeight: 1 }}>
                    {fmtCompact(grandTotal)}
                  </p>
                  <p style={{ fontSize: '0.65rem', fontWeight: 500, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                    {phCurrency.format(grandTotal)}
                  </p>
                </div>
              </div>
            </div>

            {/* Loading progress bar overlay */}
            {loading && data && (
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-purple-100 rounded-t-2xl overflow-hidden">
                <div className="h-full bg-[#6a12b8] animate-pulse" />
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
};

export default ItemsReport;


