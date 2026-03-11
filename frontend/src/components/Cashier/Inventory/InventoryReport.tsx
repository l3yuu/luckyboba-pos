"use client"

import { useState, useEffect } from 'react';
import TopNavbar from '../../Cashier/TopNavbar';
import api from '../../../services/api';
import { Loader2 } from 'lucide-react';
import { getCache, setCache } from '../../../utils/cache';

const dashboardFont = { fontFamily: "'Inter', sans-serif" };

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

const InventoryReport = () => {
  const cached = getCache<ReportData>('reports-inventory');
  const [metrics, setMetrics] = useState<MetricItem[]>(cached?.metrics ?? []);
  const [criticalItems, setCriticalItems] = useState<CriticalItem[]>(cached?.criticalItems ?? []);
  const [loading, setLoading] = useState(cached === null);

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
        console.error("Report Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, []);

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');`}</style>
      <div className="flex-1 bg-[#f3f0ff] h-full flex flex-col overflow-hidden font-sans" style={dashboardFont}>
        <TopNavbar />
        <div className="flex-1 overflow-y-auto p-5 md:p-7 flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">Inventory</p>
              <h1 className="text-lg font-extrabold text-[#1c1c1e] mt-0.5">Inventory Report</h1>
            </div>
            <div className="flex gap-2">
              <button className="h-11 px-7 bg-white border border-zinc-300 text-zinc-500 font-bold text-xs uppercase tracking-widest hover:bg-zinc-50 transition-colors rounded-[0.625rem]">Export CSV</button>
              <button className="h-11 px-7 bg-[#3b2063] hover:bg-[#2a174a] text-white font-bold text-xs uppercase tracking-widest transition-colors rounded-[0.625rem] shadow-sm">Print PDF</button>
            </div>
          </div>

          {/* Metrics cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {loading ? (
              [...Array(4)].map((_, i) => <div key={i} className="h-24 bg-white animate-pulse rounded-[0.625rem] border border-zinc-200" />)
            ) : (
              metrics.map((m, i) => (
                <div key={i} className="bg-white p-6 rounded-[0.625rem] shadow-sm border border-zinc-200">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{m.label}</p>
                  <p className={`text-xl font-extrabold ${m.color}`}>{m.value}</p>
                </div>
              ))
            )}
          </div>

          {/* Critical stock alerts table */}
          <div className="flex-1 bg-white border border-zinc-200 overflow-hidden flex flex-col shadow-sm rounded-[0.625rem]">
            {loading && <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10 backdrop-blur-[1px]"><Loader2 className="animate-spin text-[#3b2063]" size={32} /></div>}
            <div className="bg-red-50 px-7 py-4 border-b border-red-100 flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <h2 className="text-red-600 font-extrabold text-xs uppercase tracking-widest">Critical Stock Alerts</h2>
            </div>
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white z-10 border-b-2 border-zinc-100">
                <tr>
                  <th className="px-7 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Item Name</th>
                  <th className="px-7 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center">Remaining</th>
                  <th className="px-7 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center">Unit Cost</th>
                  <th className="px-7 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-right">Potential Loss</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {criticalItems.length > 0 ? (
                  criticalItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[#f9f8ff] transition-colors">
                      <td className="px-7 py-3.5">
                        <span className="text-[13px] font-extrabold text-[#3b2063]">{item.name}</span>
                      </td>
                      <td className="px-7 py-3.5 text-center">
                        <span className="text-red-500 font-extrabold">{item.remaining} Units</span>
                      </td>
                      <td className="px-7 py-3.5 text-center">
                        <span className="text-[12px] font-semibold text-zinc-500">₱{item.unitCost.toLocaleString()}</span>
                      </td>
                      <td className="px-7 py-3.5 text-right">
                        <span className="text-[13px] font-extrabold text-[#1c1c1e]">₱{item.potentialLoss.toLocaleString()}</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-8 py-20 text-center">
                      <p className="text-[11px] font-bold text-zinc-300 uppercase tracking-widest">All stock levels are healthy</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {/* Footer */}
            <div className="px-7 py-4 bg-white border-t border-zinc-100 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Synchronized</span>
              </div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                Showing {criticalItems.length} critical items
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default InventoryReport;
