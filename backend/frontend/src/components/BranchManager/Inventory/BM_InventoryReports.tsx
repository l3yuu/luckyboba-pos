"use client"

import { useState, useEffect } from 'react';
import TopNavbar from '../../Cashier/TopNavbar';
import api from '../../../services/api';
import { Loader2, Download, Printer, AlertCircle, CheckCircle } from 'lucide-react';
import { getCache, setCache } from '../../../utils/cache';

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');
  .bm-root, .bm-root * { font-family: 'DM Sans', sans-serif !important; box-sizing: border-box; }
  .bm-label { font-size: 0.62rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #3f3f46; }
`;

interface CriticalItem {
  name: string;
  remaining: number;
  unitCost: number;
  potentialLoss: number;
}

interface MetricItem {
  label: string;
  value: string | number;
  color: string;
}

interface ReportData {
  metrics: MetricItem[];
  criticalItems: CriticalItem[];
}

// Map old Tailwind color classes from API to hex values for inline styles
const colorMap: Record<string, { value: string; bg: string }> = {
  'text-emerald-600': { value: '#16a34a', bg: '#dcfce7' },
  'text-red-500':     { value: '#dc2626', bg: '#fef2f2' },
  'text-blue-600':    { value: '#2563eb', bg: '#eff6ff' },
  'text-amber-500':   { value: '#d97706', bg: '#fef9c3' },
  'text-[#3b2063]':   { value: '#3b2063', bg: '#ede9fe' },
  'text-zinc-700':    { value: '#3f3f46', bg: '#f4f4f5' },
};

const BM_InventoryReports = () => {
  const cached = getCache<ReportData>('reports-inventory');
  const [metrics, setMetrics]             = useState<MetricItem[]>(cached?.metrics ?? []);
  const [criticalItems, setCriticalItems] = useState<CriticalItem[]>(cached?.criticalItems ?? []);
  const [loading, setLoading]             = useState(cached === null);

  useEffect(() => {
    const cached = getCache<ReportData>('reports-inventory');
    if (cached) {
      setMetrics(cached.metrics);
      setCriticalItems(cached.criticalItems);
      return;
    }

    const fetchReport = async () => {
      setLoading(true);
      try {
        const res = await api.get('/reports/inventory');
        setCache('reports-inventory', { metrics: res.data.metrics, criticalItems: res.data.criticalItems });
        setMetrics(res.data.metrics);
        setCriticalItems(res.data.criticalItems);
      } catch (err) {
        console.error('Report Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, []);

  return (
    <>
      <style>{STYLES}</style>
      <div className="bm-root flex-1 bg-[#f5f4f8] h-full flex flex-col overflow-hidden">
        <TopNavbar />

        <div className="flex-1 overflow-y-auto px-5 md:px-8 py-5 flex flex-col gap-5">

          {/* ── Header ── */}
          <div className="flex items-center justify-between">
            <div>
              <p className="bm-label" style={{ color: '#a1a1aa' }}>Inventory</p>
              <h1 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1a0f2e', letterSpacing: '-0.03em', margin: 0, marginTop: 2 }}>
                Inventory Report
              </h1>
            </div>
            <div className="flex gap-2">
              <button
                className="flex items-center gap-2 h-10 px-4 bg-white border border-gray-100 hover:border-[#ddd6f7] text-[#3b2063] transition-all rounded-xl shadow-sm active:scale-[0.98]"
                style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}
              >
                <Download size={13} strokeWidth={2.5} />
                Export CSV
              </button>
              <button
                className="flex items-center gap-2 h-10 px-4 bg-[#3b2063] hover:bg-[#2a1647] text-white transition-all rounded-xl shadow-sm active:scale-[0.98]"
                style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}
              >
                <Printer size={13} strokeWidth={2.5} />
                Print PDF
              </button>
            </div>
          </div>

          {/* ── Metric cards ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-white animate-pulse rounded-2xl border border-gray-100" />
              ))
            ) : (
              metrics.map((m, i) => {
                const colors = colorMap[m.color] ?? { value: '#1a0f2e', bg: '#f4f4f5' };
                return (
                  <div key={i} className="bg-white border border-gray-100 rounded-2xl px-5 py-4 hover:shadow-sm transition-all">
                    <div className="flex items-start justify-between mb-2">
                      <p className="bm-label" style={{ color: '#a1a1aa' }}>{m.label}</p>
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                        style={{ background: colors.bg }}>
                        <span className="w-2 h-2 rounded-full" style={{ background: colors.value }} />
                      </div>
                    </div>
                    <p style={{ fontSize: '1.5rem', fontWeight: 800, color: colors.value, letterSpacing: '-0.03em', lineHeight: 1 }}>
                      {m.value}
                    </p>
                  </div>
                );
              })
            )}
          </div>

          {/* ── Critical stock table ── */}
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden flex flex-col shadow-sm flex-1 relative">
            {loading && (
              <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10 backdrop-blur-[2px] rounded-2xl">
                <Loader2 className="animate-spin text-[#3b2063]" size={28} />
              </div>
            )}

            {/* Alert header */}
            <div className="px-6 py-4 border-b border-red-100 flex items-center gap-2.5"
              style={{ background: '#fef2f2' }}>
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="bm-label" style={{ color: '#dc2626' }}>Critical Stock Alerts</span>
              {criticalItems.length > 0 && (
                <span className="ml-auto inline-flex items-center gap-1"
                  style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                    background: '#fecaca', color: '#dc2626', borderRadius: '100px', padding: '2px 8px' }}>
                  <AlertCircle size={9} strokeWidth={2.5} />
                  {criticalItems.length} items
                </span>
              )}
            </div>

            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white z-10 border-b border-gray-100">
                <tr>
                  {['Item Name', 'Remaining', 'Unit Cost', 'Potential Loss'].map((h, i) => (
                    <th key={h} className={`px-6 py-3.5 ${i >= 1 ? 'text-center' : ''} ${i === 3 ? 'text-right' : ''}`}>
                      <span className="bm-label" style={{ color: '#a1a1aa' }}>{h}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {criticalItems.length > 0 ? criticalItems.map((item, idx) => (
                  <tr key={idx} className="border-t border-gray-50 hover:bg-[#faf9ff] transition-colors">
                    <td className="px-6 py-3.5">
                      <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1a0f2e' }}>{item.name}</span>
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <span className="inline-flex items-center gap-1.5"
                        style={{ fontSize: '0.82rem', fontWeight: 800, color: '#dc2626' }}>
                        <AlertCircle size={11} strokeWidth={2.5} />
                        {item.remaining} units
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#71717a' }}>
                        ₱{item.unitCost.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#1a0f2e' }}>
                        ₱{item.potentialLoss.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                          <CheckCircle size={18} strokeWidth={1.5} className="text-green-400" />
                        </div>
                        <p className="bm-label" style={{ color: '#d4d4d8' }}>All stock levels are healthy</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Footer */}
            <div className="px-6 py-3 bg-white border-t border-gray-50 flex justify-between items-center mt-auto">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="bm-label" style={{ color: '#d4d4d8' }}>Synchronized</span>
              </div>
              <p className="bm-label" style={{ color: '#a1a1aa' }}>
                Showing {criticalItems.length} critical items
              </p>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default BM_InventoryReports;