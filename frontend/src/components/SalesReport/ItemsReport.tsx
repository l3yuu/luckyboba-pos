"use client"

import { useState, useEffect, useCallback } from 'react';
import TopNavbar from '../TopNavbar';
import api from '../../services/api';
import * as XLSX from 'xlsx';
import { Calendar, FileText, LayoutGrid, FileDown, Printer, Database, ChevronDown, Activity, Terminal } from 'lucide-react';

interface ReportItem {
  name: string;
  category?: string;
  qty: number;
  amount: number;
}

interface ReportResponse {
  items: ReportItem[];
  total_qty: number;
  grand_total: number;
  cashier_name?: string;
}

const CACHE_KEY_PREFIX = 'luckyboba_report_cache_';

const ItemsReport = () => {
  const getLocalToday = () => {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().split('T')[0];
  };

  const today = getLocalToday();
  const phCurrency = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });

  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [reportType, setReportType] = useState('item-list');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ReportResponse | null>(null);

  const getCacheKey = useCallback((from: string, to: string, type: string) =>
    `${CACHE_KEY_PREFIX}${from}_${to}_${type}`, []);

  const fetchReport = useCallback(async () => {
    const key = getCacheKey(fromDate, toDate, reportType);
    setLoading(true);
    try {
      const response = await api.get('/reports/items-report', {
        params: { from: fromDate, to: toDate, type: reportType }
      });
      localStorage.setItem(key, JSON.stringify(response.data));
      setData(response.data);
    } catch (error) { console.error("Error fetching fresh report:", error); }
    finally { setLoading(false); }
  }, [fromDate, toDate, reportType, getCacheKey]);

  useEffect(() => {
    const key = getCacheKey(fromDate, toDate, reportType);
    const saved = localStorage.getItem(key);
    if (saved) setData(JSON.parse(saved));
    else fetchReport();
  }, [fromDate, toDate, reportType, getCacheKey, fetchReport]);

  const generateExcel = useCallback(() => {
    if (!data || data.items.length === 0) { alert('No data to export'); return; }
    const worksheetData = [
      [reportType === 'category-summary' ? 'Category Name' : 'Item Name', 'Qty Sold', 'Total Sales'],
      ...data.items.map(item => [item.name, item.qty, Number(item.amount)]),
      [],
      ['Grand Total', data.total_qty, data.grand_total]
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    worksheet['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 20 }];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Items Report');
    XLSX.writeFile(workbook, `Items_Report_${fromDate}_to_${toDate}.xlsx`);
  }, [data, reportType, fromDate, toDate]);

  const handlePrint = () => {
    if (!data || data.items.length === 0) return;
    setTimeout(() => window.print(), 150);
  };

  const hasData = data && data.items.length > 0;

  return (
    <>
      <style>{`
        .printable-receipt { display: none; }
        @media print {
          @page { size: 80mm auto; margin: 0; }
          html, body { background: white !important; margin: 0 !important; padding: 0 !important; }
          #items-report-main { display: none !important; }
          .printable-receipt { display: block !important; position: absolute !important; left: 0 !important; top: 0 !important; width: 80mm !important; padding: 6mm !important; background: white !important; color: black !important; font-family: 'Courier New', monospace; }
          .receipt-divider { border-top: 1px dashed #000 !important; margin: 8px 0; width: 100%; }
          .flex-between { display: flex !important; justify-content: space-between !important; width: 100%; }
        }
      `}</style>

      {/* Printable Receipt */}
      <div className="printable-receipt text-slate-800">
        <div className="text-center space-y-1">
          <h1 className="font-black text-[14px] uppercase leading-tight">Lucky Boba Milktea</h1>
          <p className="text-[10px] uppercase font-bold">Main Branch - QC</p>
          <div className="receipt-divider" />
          <h2 className="font-black text-[11px] uppercase tracking-widest">{reportType === 'category-summary' ? 'Category' : 'Item'} Audit</h2>
          <div className="text-left text-[10px] space-y-0.5 mt-2 uppercase">
            <div className="flex-between"><span>Start</span><span>{fromDate}</span></div>
            <div className="flex-between"><span>End</span><span>{toDate}</span></div>
          </div>
        </div>
        <div className="my-4 pt-2">
          <div className="receipt-divider" />
          <table className="w-full text-[10px]">
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
          <div className="flex-between font-black text-[12px] pt-1">
            <span>TOTAL</span><span>{phCurrency.format(data?.grand_total || 0)}</span>
          </div>
        </div>
      </div>

      {/* Main UI */}
      <div id="items-report-main" className="flex flex-col h-full w-full bg-[#f4f2fb] overflow-hidden relative print:hidden">
        <TopNavbar />

        <div className="flex-1 overflow-y-auto p-5 md:p-7 flex flex-col gap-5">

          {/* ── Filter Bar ── */}
          <div className="bg-white border border-zinc-200 p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row gap-3 items-end">

              {/* From Date */}
              <div className="flex-1 w-full space-y-1.5">
                <label className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
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
                <label className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
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
                <label className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  <LayoutGrid size={12} /> Report Mode
                </label>
                <div className="relative">
                  <select
                    value={reportType} onChange={(e) => setReportType(e.target.value)}
                    className="w-full px-4 py-3 pr-10 border border-zinc-200 bg-[#f4f2fb] font-semibold text-sm text-[#1a0f2e] outline-none cursor-pointer appearance-none focus:border-[#3b2063] transition-colors"
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
                  className="flex-1 lg:w-32 h-11.5 bg-[#3b2063] hover:bg-[#2a1647] text-white font-bold text-sm uppercase tracking-widest transition-all disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Query'}
                </button>
                <button
                  onClick={generateExcel} disabled={!hasData}
                  className="w-12 h-11.5 bg-white border border-zinc-200 text-zinc-500 hover:text-[#3b2063] hover:border-[#3b2063] flex items-center justify-center transition-all disabled:opacity-30"
                >
                  <FileDown size={17} />
                </button>
                <button
                  onClick={handlePrint} disabled={!hasData}
                  className="w-12 h-11.5 bg-white border border-zinc-200 text-zinc-500 hover:text-[#3b2063] hover:border-[#3b2063] flex items-center justify-center transition-all disabled:opacity-30"
                >
                  <Printer size={17} />
                </button>
              </div>
            </div>
          </div>

          {/* ── Report Table ── */}
          <div className="flex-1 bg-white border border-zinc-200 shadow-sm flex flex-col overflow-hidden relative">

            {/* Table Header */}
            <div className="px-7 py-5 border-b border-zinc-100 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#3b2063] flex items-center justify-center">
                  <FileText size={16} className="text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1a0f2e] uppercase tracking-widest">
                    {reportType === 'category-summary' ? 'Category Summary' : 'Item Performance Ledger'}
                  </h3>
                  <p className="text-[11px] font-medium text-zinc-400 mt-0.5">
                    Terminal Audit · POS-01
                    {data?.cashier_name && ` · ${data.cashier_name}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-50 border border-zinc-200">
                <Activity size={13} className="text-emerald-500" />
                <span className="text-[11px] font-bold text-zinc-600 uppercase tracking-widest">
                  {data?.items.length ?? 0} records
                </span>
              </div>
            </div>

            {/* Table Body */}
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-white z-10 border-b border-zinc-100">
                  <tr>
                    <th className="px-7 py-3.5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                      {reportType === 'category-summary' ? 'Category' : 'Item'}
                    </th>
                    <th className="px-7 py-3.5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-right">Units Sold</th>
                    <th className="px-7 py-3.5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {data?.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[#f4f2fb] transition-colors">
                      <td className="px-7 py-3.5 text-sm font-semibold text-[#1a0f2e]">{item.name}</td>
                      <td className="px-7 py-3.5 text-sm font-bold text-zinc-500 text-right tabular-nums">{item.qty}</td>
                      <td className="px-7 py-3.5 text-sm font-bold text-[#1a0f2e] text-right tabular-nums">{phCurrency.format(item.amount)}</td>
                    </tr>
                  ))}
                  {!loading && !hasData && (
                    <tr>
                      <td colSpan={3} className="px-7 py-20 text-center">
                        <Database size={32} className="mx-auto text-zinc-200 mb-3" />
                        <p className="text-[11px] font-bold text-zinc-300 uppercase tracking-widest">No entries for selected range</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Grand Total Bar */}
            <div className="bg-[#1e0f3c] flex justify-between items-center px-7 py-5">
              <div className="flex items-center gap-3">
                <Terminal size={16} className="text-violet-400" />
                <span className="text-sm font-bold uppercase tracking-widest text-violet-300">Shift Total Settlement</span>
              </div>
              <div className="flex gap-10 text-right">
                <div>
                  <p className="text-[10px] font-bold text-violet-400 uppercase tracking-widest mb-1">Volume</p>
                  <p className="text-xl font-bold text-white tabular-nums">{data?.total_qty ?? 0}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-violet-400 uppercase tracking-widest mb-1">Revenue</p>
                  <p className="text-xl font-bold text-emerald-400 tabular-nums">{phCurrency.format(data?.grand_total ?? 0)}</p>
                </div>
              </div>
            </div>

            {/* Loading bar */}
            {loading && (
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-violet-100 overflow-hidden">
                <div className="h-full bg-[#3b2063] w-1/3 animate-[loading_1.5s_infinite]" />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ItemsReport;