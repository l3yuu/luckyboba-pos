import TopNavbar from '../TopNavbar';
import * as XLSX from 'xlsx';
import { useState, useCallback, useEffect, useMemo } from 'react';
import api from '../../../services/api';
import { 
  Calendar, 
  FileText, 
  LayoutGrid, 
  FileDown, 
  Printer, 
  Database, 
  ChevronDown,
  Activity} from 'lucide-react';

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
// HELPER — defined outside component so it's never in TDZ
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

  const branchName = useMemo(() =>
    localStorage.getItem('lucky_boba_user_branch') || 'Main Branch'
  , []);

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
    setLoading(true);
    try {
      const response = await api.get('/reports/items-report', {
        params: { from: fromDate, to: toDate, type: reportType },
      });

      // Clear ALL items report cache keys to avoid serving stale data
      Object.keys(localStorage)
        .filter(k => k.startsWith(CACHE_KEY_PREFIX))
        .forEach(k => localStorage.removeItem(k));

      const key = getCacheKey(fromDate, toDate, reportType);
      localStorage.setItem(key, JSON.stringify(response.data));
      setData(response.data);
    } catch (error) {
      console.error('Error fetching fresh report:', error);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, reportType, getCacheKey]);

useEffect(() => {
  setData(null);
  fetchReport();
}, [fromDate, toDate, reportType, fetchReport]);

  const generateExcel = useCallback(() => {
    if (!data || data.items.length === 0) {
      alert('No data to export');
      return;
    }

    const isCategorySummary = reportType === 'category-summary';

    const rows = data.items.map((item, index) =>
      isCategorySummary
        ? { '#': index + 1, 'Category': item.name, 'Qty Sold': item.qty, 'Total Sales': item.amount }
        : { '#': index + 1, 'Item Name': item.name, 'Category': item.category, 'Qty Sold': item.qty, 'Total Sales': item.amount }
    );

    rows.push(
      isCategorySummary
        ? ({ '#': '', 'Category': 'GRAND TOTAL', 'Qty Sold': data.total_qty, 'Total Sales': data.grand_total } as never)
        : ({ '#': '', 'Item Name': 'GRAND TOTAL', 'Category': '', 'Qty Sold': data.total_qty, 'Total Sales': data.grand_total } as never)
    );

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, `items_report_${fromDate}_to_${toDate}.xlsx`);
  }, [data, fromDate, toDate, reportType]);

  const handlePrint = () => {
    if (!data || data.items.length === 0) {
      alert('No data to print');
      return;
    }
    setTimeout(() => window.print(), 150);
  };

  const hasData = data && data.items.length > 0;

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <>
      <style>
        {`
          .printable-receipt { display: none; }
          @media print {
            @page { size: 80mm auto; margin: 0; }
            html, body { background: white !important; margin: 0 !important; padding: 0 !important; }
            #dashboard-main-container { display: none !important; }
            .printable-receipt { display: block !important; position: absolute !important; left: 0 !important; top: 0 !important; width: 80mm !important; padding: 6mm !important; background: white !important; color: black !important; font-family: 'Courier New', monospace; }
            .receipt-divider { border-top: 1px dashed #000 !important; margin: 8px 0; width: 100%; }
            .flex-between { display: flex !important; justify-content: space-between !important; width: 100%; }
          }
          .receipt-divider { border-top: 1px dashed #000; margin: 8px 0; width: 100%; }
          .flex-between { display: flex; justify-content: space-between; width: 100%; }
        `}
      </style>

      {/* PRINTABLE RECEIPT */}
      <div className="printable-receipt text-slate-800">
        <div className="text-center space-y-1">
          <h1 className="font-black text-[20px] uppercase leading-tight">Lucky Boba Milktea</h1>
          <p className="text-[15px] uppercase font-bold">{branchName}</p>
          <div className="receipt-divider" />
          <h2 className="font-black text-[16px] uppercase tracking-widest">
            {reportType === 'category-summary' ? 'Category Summary' : 'Item Sales'} Report
          </h2>
          <div className="text-left text-[14px] space-y-0.5 mt-2 uppercase">
            <div className="flex-between"><span>From Date</span><span>{fromDate}</span></div>
            <div className="flex-between"><span>To Date</span><span>{toDate}</span></div>
            <div className="flex-between"><span>Print Time</span><span>{new Date().toLocaleTimeString()}</span></div>
            <div className="flex-between"><span>Terminal</span><span>POS-01</span></div>
          </div>
        </div>
        <div className="my-4 pt-2">
          <div className="receipt-divider" />
          <table className="w-full text-[13px]">
            <thead>
              <tr className="font-black border-b border-black text-left">
                <th className="pb-1 uppercase tracking-tighter w-1/2">
                  {reportType === 'category-summary' ? 'Category' : 'Item'}
                </th>
                <th className="pb-1 text-center">QTY</th>
                <th className="pb-1 text-right">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-1 uppercase text-[13px] font-bold">{item.name}</td>
                  <td className="py-1 text-center font-bold">x{item.qty}</td>
                  <td className="py-1 text-right">{phCurrency.format(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="receipt-divider" />
          <div className="space-y-1 mt-2">
            <div className="flex-between text-[14px]"><span>TOTAL ITEMS SOLD</span><span className="font-bold">{data?.total_qty || 0}</span></div>
            <div className="flex-between font-black text-[16px] pt-1 border-t border-black"><span>TOTAL REVENUE</span><span>{phCurrency.format(data?.grand_total || 0)}</span></div>
          </div>
        </div>
        <div className="mt-8 text-center space-y-4">
          <div className="receipt-divider" />
          <div className="pt-2">
            <p className="text-[14px] font-bold uppercase">{data?.cashier_name || 'System Admin'}</p>
            <p className="text-[14px] leading-none">____________________</p>
            <p className="text-[12px] uppercase mt-1">Prepared By</p>
          </div>
        </div>
      </div>

      {/* Main UI */}
      <div id="items-report-main" className="flex flex-col h-full w-full bg-[#f4f2fb] overflow-hidden relative print:hidden">
        <TopNavbar />

        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col gap-4">

          {/* ── Filter Bar ── */}
          <div className="bg-white border border-zinc-200 p-6 shadow-sm rounded-[0.625rem]">
            <div className="flex flex-col lg:flex-row gap-3 items-end">

              {/* From Date */}
              <div className="flex-1 w-full space-y-1.5">
                <label className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">
                  <Calendar size={12} /> From Date
                </label>
                <input
                  type="date" value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full px-4 py-3 border border-zinc-200 bg-[#f4f2fb] font-semibold text-sm text-[#1a0f2e] outline-none focus:border-[#3b2063] transition-colors"
                />
              </div>

              {/* To Date */}
              <div className="flex-1 w-full space-y-1.5">
                <label className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">
                  <Calendar size={12} /> To Date
                </label>
                <input
                  type="date" value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full px-4 py-3 border border-zinc-200 bg-[#f4f2fb] font-semibold text-sm text-[#1a0f2e] outline-none focus:border-[#3b2063] transition-colors"
                />
              </div>

              {/* Report Type */}
              <div className="flex-1 w-full space-y-1.5">
                <label className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">
                  <LayoutGrid size={12} /> Report Mode
                </label>
                <div className="relative group">
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value as 'item-list' | 'category-summary')}
                    className="w-full p-3.5 pr-10 rounded-none border border-zinc-200 bg-[#f8f6ff] font-black text-[#3b2063] text-xs uppercase tracking-widest outline-none cursor-pointer appearance-none focus:border-[#3b2063]"
                  >
                    <option value="item-list">Detailed Item List</option>
                    <option value="category-summary">Category Summary</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 w-full lg:w-auto">
                <button
                  onClick={fetchReport} disabled={loading}
                  className="flex-1 lg:w-32 h-11 bg-[#3b2063] hover:bg-[#6a12b8] text-white font-bold text-sm uppercase tracking-widest transition-all disabled:opacity-50 rounded-[0.625rem]"
                >
                  {loading ? 'Loading...' : 'Query'}
                </button>
                <button
                  onClick={generateExcel} disabled={!hasData}
                  className="w-11 h-11 bg-white border border-[#e9d5ff] text-zinc-400 hover:text-[#3b2063] hover:border-[#3b2063] flex items-center justify-center transition-all disabled:opacity-30 rounded-[0.625rem]"
                >
                  <FileDown size={17} />
                </button>
                <button
                  onClick={handlePrint} disabled={!hasData}
                  className="w-11 h-11 bg-white border border-[#e9d5ff] text-zinc-400 hover:text-[#3b2063] hover:border-[#3b2063] flex items-center justify-center transition-all disabled:opacity-30 rounded-[0.625rem]"
                >
                  <Printer size={17} />
                </button>
              </div>
            </div>

            {_error && (
              <p className="mt-3 text-xs font-bold text-red-500 bg-red-50 px-4 py-2 rounded-xl">{_error}</p>
            )}
          </div>

          {/* ── Report Table ── */}
          <div className="flex-1 bg-white border border-zinc-200 shadow-sm flex flex-col overflow-hidden relative rounded-[0.625rem]">

            {/* Table Header */}
            <div className="px-7 py-5 border-b border-zinc-100 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#3b2063] flex items-center justify-center rounded-sm">
                  <FileText size={16} className="text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1a0f2e] uppercase tracking-widest">
                    {reportType === 'category-summary' ? 'Category Summary' : 'Item Performance Ledger'}
                  </h3>
                  <p className="text-[11px] font-medium text-zinc-400 mt-0.5">
                    {branchName}
                    {data?.cashier_name && ` · ${data.cashier_name}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right hidden md:block">
                  <p className="text-[8px] font-black text-zinc-300 uppercase tracking-widest">Operator</p>
                  <p className="text-[10px] font-black text-[#3b2063] uppercase">{data?.cashier_name || 'Terminal Root'}</p>
                </div>
                <div className="bg-white border border-[#e9d5ff] px-4 py-2 flex items-center gap-2 rounded-sm">
                  <Activity size={12} className="text-emerald-500" />
                  <span className="text-[9px] font-black text-[#3b2063] uppercase tracking-widest">{data?.items.length || 0} Records</span>
                </div>
              </div>
            </div>

            {/* Table Body */}
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-white z-10 border-b border-[#e9d5ff]">
                  <tr>
                    <th className="px-8 py-4 text-[9px] font-black text-zinc-400 uppercase tracking-[0.3em]">
                      {reportType === 'category-summary' ? 'Category Classification' : 'Item Description'}
                    </th>
                    <th className="px-8 py-4 text-[9px] font-black text-zinc-400 uppercase tracking-[0.3em] text-right">Units Sold</th>
                    <th className="px-8 py-4 text-[9px] font-black text-zinc-400 uppercase tracking-[0.3em] text-right">Revenue Accumulation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {data?.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[#f5f0ff] transition-colors">
                      <td className="px-7 py-3.5 text-sm font-semibold text-[#1a0f2e]">{item.name}</td>
                      <td className="px-7 py-3.5 text-sm font-bold text-zinc-500 text-right tabular-nums">{item.qty}</td>
                      <td className="px-7 py-3.5 text-sm font-bold text-[#1a0f2e] text-right tabular-nums">{phCurrency.format(item.amount)}</td>
                    </tr>
                  ))}
                  {!loading && !hasData && (
                    <tr>
                      <td colSpan={3} className="px-8 py-20 text-center">
                        <Database size={40} className="mx-auto text-zinc-100 mb-3" />
                        <p className="text-[10px] text-zinc-300 uppercase font-black tracking-[0.4em]">No database entries for selected range</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* GRAND TOTAL BAR */}
            <div className="bg-[#3b2063] text-white flex justify-between items-center px-8 py-6">
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-black uppercase tracking-[0.3em] text-purple-300">Shift Total Settlement</span>
              </div>
              <div className="flex gap-12 text-right">
                <div>
                  <p className="text-[8px] font-black text-purple-300/50 uppercase tracking-widest mb-1">Volume</p>
                  <p className="text-xl font-black tabular-nums">{data?.total_qty || 0}</p>
                </div>
                <div>
                  <p className="text-[8px] font-black text-purple-300/50 uppercase tracking-widest mb-1">Revenue</p>
                  <p className="text-xl font-black tabular-nums tracking-tighter text-emerald-400">{phCurrency.format(data?.grand_total || 0)}</p>
                </div>
              </div>
            </div>

            {loading && data && (
              <div className="absolute top-0 left-0 right-0 h-1 bg-purple-200">
                <div className="h-full bg-[#3b2063] animate-pulse" />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ItemsReport;

