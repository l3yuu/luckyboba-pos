"use client"

import { useState } from 'react';
import { Download, FileText, ArrowLeft, Loader2, BarChart2, List } from 'lucide-react';
import * as XLSX from 'xlsx';
import api from '../../../services/api';
import { useToast } from '../../../hooks/useToast';

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');
  .bm-root, .bm-root * { font-family: 'DM Sans', sans-serif !important; box-sizing: border-box; }
  .bm-label { font-size: 0.62rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; }
`;

interface ExportDataProps {
  onBack: () => void;
}

const BM_ExportData = ({ onBack }: ExportDataProps) => {
  const { showToast } = useToast();
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate]     = useState('');
  const [loading, setLoading]   = useState(false);

  const handleExportFoodList = async () => {
    setLoading(true);
    try {
      const response = await api.get('/reports/food-menu');
      const data = Array.isArray(response.data) ? response.data : Object.values(response.data);
      if (data.length === 0) { showToast('No menu items found in database', 'warning'); return; }
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Food Menu List');
      XLSX.writeFile(wb, 'LuckyBoba_Food_Menu.xlsx');
      showToast('Food menu exported successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch menu from server', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExportSales = async (type: string, label: string) => {
    if (!fromDate || !toDate) { showToast('Please select a date range first', 'warning'); return; }
    setLoading(true);
    try {
      const response = await api.get('/reports/sales', { params: { from: fromDate, to: toDate, type } });
      const data = Array.isArray(response.data) ? response.data : Object.values(response.data);
      if (data.length === 0) { showToast('No records found for this period', 'warning'); return; }
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, label);
      XLSX.writeFile(wb, `LuckyBoba_${label}_${fromDate}_to_${toDate}.xlsx`);
      showToast(`${label.replace('_', ' ')} exported successfully!`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Export failed. Check console for details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const reportGroups = [
    {
      title: 'Sales Reports',
      icon: <BarChart2 size={13} strokeWidth={2.5} />,
      color: '#2563eb',
      bg: '#eff6ff',
      items: [
        { label: 'Sales',                   action: () => handleExportSales('SALES', 'General_Sales') },
        { label: 'Sales Summary',           action: () => handleExportSales('SUMMARY', 'Sales_Summary') },
        { label: 'Sold Items',              action: () => handleExportSales('SOLD_ITEMS', 'Sold_Items') },
        { label: 'Customer Payments',       action: () => handleExportSales('PAYMENTS', 'Payments') },
        { label: 'Sales by Terminal',       action: () => showToast('Function coming soon', 'warning') },
        { label: 'Inventory by Sold',       action: () => showToast('Function coming soon', 'warning') },
        { label: 'Items Report with %',     action: () => showToast('Function coming soon', 'warning') },
      ],
    },
    {
      title: 'Lists & Kits',
      icon: <List size={13} strokeWidth={2.5} />,
      color: '#a020f0',
      bg: '#ede9fe',
      items: [
        { label: 'Food List',       action: handleExportFoodList },
        { label: 'All List',        action: () => showToast('Exporting system data…', 'success') },
        { label: 'Inventory List',  action: () => showToast('Inventory sync required', 'warning') },
        { label: 'Item Kits',       action: () => {} },
        { label: 'Export Sold',     action: () => handleExportSales('SOLD_ITEMS', 'Sold_Items_Alt') },
      ],
    },
  ];

  const inputCls = `w-full px-4 py-2.5 rounded-xl border border-gray-100 outline-none focus:border-[#ddd6f7] transition-all bg-white disabled:opacity-50`;
  const inputStyle = { fontSize: '0.88rem', fontWeight: 600, color: '#1a0f2e' } as React.CSSProperties;

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
                Export Data
              </h1>
            </div>
          </div>

          {/* ── Date range card ── */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 relative">
            {loading && (
              <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center rounded-2xl backdrop-blur-[2px]">
                <div className="flex items-center gap-2.5">
                  <Loader2 className="animate-spin text-[#a020f0]" size={20} />
                  <span className="bm-label" style={{ color: '#a020f0' }}>Processing…</span>
                </div>
              </div>
            )}

            <p className="bm-label mb-4" style={{ color: '#a1a1aa' }}>Date Range</p>

            <div className="flex flex-col md:flex-row items-end gap-4">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                <div className="space-y-1.5">
                  <p className="bm-label" style={{ color: '#a1a1aa' }}>From Date</p>
                  <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
                    className={inputCls} style={inputStyle} disabled={loading} />
                </div>
                <div className="space-y-1.5">
                  <p className="bm-label" style={{ color: '#a1a1aa' }}>To Date</p>
                  <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
                    className={inputCls} style={inputStyle} disabled={loading} />
                </div>
              </div>
              <button
                onClick={() => handleExportSales('SALES', 'General_Sales')}
                disabled={loading}
                className="flex items-center gap-2 h-10 px-6 bg-[#a020f0] hover:bg-[#2a1647] text-white transition-all rounded-xl shadow-sm active:scale-[0.98] disabled:opacity-50 shrink-0"
                style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}
              >
                {loading ? <Loader2 className="animate-spin" size={14} /> : <Download size={13} strokeWidth={2.5} />}
                Generate
              </button>
            </div>
          </div>

          {/* ── Report groups ── */}
          <div className="space-y-5">
            {reportGroups.map((group, idx) => (
              <div key={idx} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                {/* Group header */}
                <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                    style={{ background: group.bg, color: group.color }}>
                    {group.icon}
                  </div>
                  <p className="bm-label" style={{ color: '#71717a' }}>{group.title}</p>
                  <span className="ml-auto bm-label" style={{ color: '#d4d4d8' }}>
                    {group.items.length} reports
                  </span>
                </div>

                {/* Buttons grid */}
                <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                  {group.items.map(item => (
                    <button
                      key={item.label}
                      onClick={item.action}
                      disabled={loading}
                      className="h-10 px-3 bg-[#faf9ff] hover:bg-[#ede9fe] border border-gray-100 hover:border-[#ddd6f7] text-[#a020f0] transition-all rounded-xl active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-1.5"
                      style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}
                    >
                      <FileText size={11} strokeWidth={2.5} className="shrink-0" />
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* ── Back ── */}
          <div className="flex justify-start pt-1 pb-2">
            <button
              onClick={onBack}
              className="flex items-center gap-2 h-9 px-4 bg-white border border-gray-100 hover:border-[#ddd6f7] text-[#a020f0] transition-all rounded-xl active:scale-[0.98]"
              style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}
            >
              <ArrowLeft size={13} strokeWidth={2.5} /> Back to Settings
            </button>
          </div>

        </div>
      </div>
    </>
  );
};

export default BM_ExportData;

