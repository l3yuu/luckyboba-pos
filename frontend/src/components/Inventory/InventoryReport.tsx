"use client"

import { useState, useEffect } from 'react';
import TopNavbar from '../TopNavbar';
import api from '../../services/api';
import { Loader2 } from 'lucide-react';
import { getCache, setCache } from '../../utils/cache';

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
    <div className="flex-1 bg-[#f4f5f7] h-full flex flex-col overflow-hidden font-sans">
      <TopNavbar />
      <div className="flex-1 p-8 flex flex-col gap-8 overflow-y-auto">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-xl font-black text-[#3b2063] uppercase tracking-widest leading-none">Inventory Report</h1>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Stock Level Analytics & Valuation</p>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 border-2 border-zinc-200 text-zinc-500 rounded-lg font-bold text-[10px] uppercase tracking-widest hover:bg-white transition-all">Export CSV</button>
            <button className="px-4 py-2 bg-[#3b2063] text-white rounded-lg font-bold text-[10px] uppercase tracking-widest shadow-md hover:bg-[#2a1647] transition-all">Print PDF</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {loading ? (
            [...Array(4)].map((_, i) => <div key={i} className="h-24 bg-white animate-pulse rounded-2xl border border-zinc-100" />)
          ) : (
            metrics.map((m, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">{m.label}</p>
                <p className={`text-xl font-black ${m.color}`}>{m.value}</p>
              </div>
            ))
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden relative">
          {loading && <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10"><Loader2 className="animate-spin text-[#3b2063]" /></div>}
          <div className="bg-red-50 px-6 py-4 border-b border-red-100 flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <h2 className="text-red-600 font-black text-xs uppercase tracking-widest">Critical Stock Alerts</h2>
          </div>
          <table className="w-full text-left border-collapse">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Item Name</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Remaining</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Unit Cost</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Potential Loss</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {criticalItems.length > 0 ? (
                criticalItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-6 py-4 text-xs font-bold text-slate-700">{item.name}</td>
                    <td className="px-6 py-4 text-center"><span className="text-red-500 font-black">{item.remaining} Units</span></td>
                    <td className="px-6 py-4 text-xs font-bold text-zinc-400 text-center">₱{item.unitCost.toLocaleString()}</td>
                    <td className="px-6 py-4 text-xs font-black text-slate-700 text-right">₱{item.potentialLoss.toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-zinc-400 text-xs font-bold uppercase">All stock levels are healthy</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InventoryReport;