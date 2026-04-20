"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Package, AlertTriangle, XCircle, Truck, Clock,
  TrendingDown,
} from 'lucide-react';
import api from '../../../services/api';
import { StatCard, Badge, Button as Btn } from '../SharedUI';

// ─── Types ────────────────────────────────────────────────────────────────────

interface StockAlert {
  id:            number;
  name:          string;
  category:      string;
  unit:          string;
  current_stock: number;
  reorder_level: number;
  branch_name:   string;
  status:        'out_of_stock' | 'critical' | 'low';
}

interface StockMovement {
  id:              number;
  raw_material:    string;
  type:            'add' | 'subtract' | 'set';
  quantity:        number;
  unit:            string;
  branch_name:     string;
  reason:          string;
  performed_by:    string;
  created_at:      string;
}

interface BranchSummary {
  branch_id:    number;
  branch_name:  string;
  total_items:  number;
  low_stock:    number;
  out_of_stock: number;
  pending_pos:  number;
  health_pct:   number;
}

interface OverviewStats {
  total_items:  number;
  low_stock:    number;
  out_of_stock: number;
  pending_pos:  number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)   return 'Just now';
  if (mins < 60)  return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs} hr ago`;
  return new Date(dateStr).toLocaleDateString();
};

const stockStatus = (item: StockAlert): { label: string; cls: string } => {
  if (item.current_stock === 0)                              return { label: 'Out of Stock', cls: 'badge-danger' };
  if (item.current_stock <= item.reorder_level * 0.25)      return { label: 'Critical',     cls: 'badge-danger' };
  return                                                            { label: 'Low',          cls: 'badge-warning' };
};

const healthColor = (pct: number) => {
  if (pct >= 75) return '#16a34a';
  if (pct >= 50) return '#d97706';
  return '#dc2626';
};

const ProgressBar: React.FC<{ pct: number; color: string; width?: number }> = ({ pct, color, width = 80 }) => (
  <div className="rounded-full bg-zinc-100 overflow-hidden" style={{ height: 5, width }}>
    <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const BM_InventoryDashboard: React.FC = () => {
  const [branchId,  setBranchId]  = useState<number | null>(null);
  const [stats,     setStats]     = useState<OverviewStats>({ total_items: 0, low_stock: 0, out_of_stock: 0, pending_pos: 0 });
  const [alerts,    setAlerts]    = useState<StockAlert[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [branches,  setBranches]  = useState<BranchSummary[]>([]);
  const [loading,   setLoading]   = useState(true);

  const fetchAll = useCallback(async () => {
    if (branchId == null) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [overviewRes, alertsRes, movementsRes] = await Promise.allSettled([
        api.get('/inventory/overview', { params: { branch_id: branchId } }),
        api.get('/inventory/alerts',   { params: { branch_id: branchId } }),
        api.get('/raw-materials/movements', { params: { limit: 20, branch_id: branchId } }),
      ]);

      if (overviewRes.status === 'fulfilled') {
        const d = overviewRes.value.data;
        setStats({
          total_items:  d.total_items  ?? 0,
          low_stock:    d.low_stock    ?? 0,
          out_of_stock: d.out_of_stock ?? 0,
          pending_pos:  d.pending_pos  ?? 0,
        });
        setBranches(d.branch_summary ?? []);
      }
      if (alertsRes.status === 'fulfilled') {
        setAlerts(alertsRes.value.data?.data ?? alertsRes.value.data ?? []);
      }
if (movementsRes.status === 'fulfilled') {
  const mv = movementsRes.value.data;
  const raw = Array.isArray(mv) ? mv : mv?.data ?? [];

  const str = (v: unknown): string => {
    if (typeof v === 'string') return v;
    if (typeof v === 'object' && v !== null && 'name' in v)
      return String((v as { name: unknown }).name ?? '');
    return '';
  };

  setMovements(raw.map((m: Record<string, unknown>) => ({
    ...m,
    raw_material: str(m.raw_material),
    unit:         str(m.unit),
    branch_name:  str(m.branch_name),
    reason:       str(m.reason),
    performed_by: str(m.performed_by),
  })));
}
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    api.get('/user')
      .then(res => setBranchId(res.data?.branch_id ?? null))
      .catch(() => setBranchId(null));
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const moveDotColor = (type: string) => {
    if (type === 'add')      return '#16a34a';
    if (type === 'subtract') return '#dc2626';
    return '#3b2063';
  };

const resolveUnit = (unit: unknown): string => {
  if (typeof unit === 'object' && unit !== null && 'name' in unit)
    return String((unit as { name: unknown }).name ?? '');
  return typeof unit === 'string' ? unit : '';
};

  const moveLabel = (m: StockMovement) => {
    const u = resolveUnit(m.unit);
    if (m.type === 'add')      return `+${m.quantity} ${u}`;
    if (m.type === 'subtract') return `-${m.quantity} ${u}`;
    return `Set to ${m.quantity} ${u}`;
  };

  const Skeleton = () => (
    <div className="animate-pulse space-y-2 p-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-8 bg-zinc-100 rounded" style={{ width: `${70 + (i * 6) % 25}%` }} />
      ))}
    </div>
  );

  return (
    <div className="p-6 md:p-8 bg-[#f4f2fb] min-h-full fade-in">
      <style>{`
        .fade-in { animation: fadeIn 0.25s ease forwards; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
        <div className="flex-1">
          <h1 className="text-xl font-bold text-[#1a0f2e]">Inventory Overview</h1>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">Real-time stock health</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <StatCard label="Total Items" value={stats.total_items} sub="Tracked materials" icon={<Package size={16} />} color="violet" />
        <StatCard label="Low Stock" value={stats.low_stock} sub="Below reorder" icon={<TrendingDown size={16} />} color="amber" />
        <StatCard label="Out of Stock" value={stats.out_of_stock} sub="Critical restock" icon={<XCircle size={16} />} color="red" />
        <StatCard label="Pending POs" value={stats.pending_pos} sub="In transit" icon={<Truck size={16} />} color="emerald" />
      </div>

      {/* Two-column: Alerts + Movements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">

        {/* Low Stock Alerts */}
        <div className="bg-white border border-zinc-200 rounded-[0.625rem] overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-[#3b2063] p-2 rounded-lg text-white shadow-sm"><AlertTriangle size={13} /></div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-wide text-[#1a0f2e]">Low Stock Alerts</p>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Items below reorder level</p>
              </div>
            </div>
            <Badge status={`${alerts.length} ITEMS`} />
          </div>
          {loading ? <Skeleton /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-100">
                    {['Item', 'Branch', 'Stock', 'Level', 'Status'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[9px] font-black uppercase tracking-widest text-zinc-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {alerts.length === 0 ? (
                    <tr><td colSpan={5} className="py-10 text-center text-xs text-zinc-400 font-medium">No alerts — all items are well stocked!</td></tr>
                  ) : alerts.map(item => {
                    const pct = item.reorder_level > 0 ? (item.current_stock / (item.reorder_level * 2)) * 100 : 0;
                    const { label } = stockStatus(item);
                    const barColor = item.current_stock === 0 ? '#dc2626' : pct < 30 ? '#dc2626' : '#d97706';
                    return (
                      <tr key={item.id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="px-4 py-3.5">
                          <p className="font-bold text-[#1a0f2e] text-xs">{item.name}</p>
                          <p className="text-[10px] text-zinc-400">
                            {item.category} · {typeof item.unit === 'object' && item.unit !== null
  ? (item.unit as { name: string }).name
  : item.unit}
                          </p>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-violet-50 text-violet-700 border border-violet-100">
                            {item.branch_name}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-bold text-xs tabular-nums" style={{ color: barColor }}>{item.current_stock}</span>
                          <span className="text-[10px] text-zinc-400 tabular-nums"> / {item.reorder_level * 2}</span>
                        </td>
                        <td className="px-4 py-3.5"><ProgressBar pct={pct} color={barColor} /></td>
                        <td className="px-4 py-3.5 flex justify-end pr-4 mt-2"><Badge status={label} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Movements */}
        <div className="bg-white border border-zinc-200 rounded-[0.625rem] overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-[#3b2063] p-2 rounded-lg text-white shadow-sm"><Clock size={13} /></div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-wide text-[#1a0f2e]">Recent Movements</p>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Last 20 stock events</p>
              </div>
            </div>
            <Badge status="LIVE" />
          </div>
          {loading ? <Skeleton /> : (
            <div className="overflow-y-auto max-h-90 divide-y divide-zinc-50">
              {movements.length === 0 ? (
                <p className="py-10 text-center text-xs text-zinc-400 font-medium">No recent movements.</p>
              ) : movements.map(m => (
                <div key={m.id} className="flex items-start gap-4 px-5 py-4 hover:bg-zinc-50/50 transition-colors">
                  <div className="w-2.5 h-2.5 rounded-full mt-1 shrink-0" style={{ background: moveDotColor(m.type), boxShadow: `0 0 5px ${moveDotColor(m.type)}40` }} />
                  <div className="min-w-0">
                    <p className="text-xs text-zinc-700 leading-snug">
                      <span className="font-bold text-[#1a0f2e]">{moveLabel(m)}</span> {m.raw_material} — {m.branch_name}
                    </p>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">{m.reason} · {timeAgo(m.created_at)} · by {m.performed_by}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Branch Summary Table */}
      <div className="bg-white border border-zinc-200 rounded-[0.625rem] overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center gap-3">
          <div className="bg-[#3b2063] p-2 rounded-lg text-white shadow-sm">
            <Package size={13} />
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-wide text-[#1a0f2e]">Branch Stock Summary</p>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Per-branch health at a glance</p>
          </div>
        </div>
        {loading ? <Skeleton /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100">
                  {['Branch', 'Total Items', 'Low Stock', 'Out of Stock', 'Pending POs', 'Health'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[9px] font-black uppercase tracking-widest text-zinc-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {branches.length === 0 ? (
                  <tr><td colSpan={6} className="py-10 text-center text-xs text-zinc-400">No branch data available.</td></tr>
                ) : branches.map(b => {
                  const color = healthColor(b.health_pct);
                  return (
                    <tr key={b.branch_id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-[#1a0f2e] text-xs">{b.branch_name}</td>
                      <td className="px-5 py-3.5 text-zinc-600 text-xs tabular-nums">{b.total_items}</td>
                      <td className="px-5 py-3.5">
                        <span className="font-bold text-xs tabular-nums" style={{ color: b.low_stock > 0 ? '#d97706' : '#16a34a' }}>{b.low_stock}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-bold text-xs tabular-nums" style={{ color: b.out_of_stock > 0 ? '#dc2626' : '#16a34a' }}>{b.out_of_stock}</span>
                      </td>
                      <td className="px-5 py-3.5"><Badge status={`${b.pending_pos} PENDING`} /></td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <ProgressBar pct={b.health_pct} color={color} width={100} />
                          <span className="text-[11px] font-black tabular-nums" style={{ color }}>{b.health_pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BM_InventoryDashboard;