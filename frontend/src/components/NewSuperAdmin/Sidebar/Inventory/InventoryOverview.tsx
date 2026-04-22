"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Package, AlertTriangle, XCircle, Truck, Clock,
  TrendingDown,
} from 'lucide-react';
import api from '../../../../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface StockAlert {
  id: number;
  name: string;
  category: string;
  unit: string;
  current_stock: number;
  reorder_level: number;
  branch_name: string;
  status: 'out_of_stock' | 'critical' | 'low';
}

interface StockMovement {
  id: number;
  raw_material: string;
  type: 'add' | 'subtract' | 'set';
  quantity: number;
  unit: string;
  branch_name: string;
  reason: string;
  performed_by: string;
  created_at: string;
}

interface BranchSummary {
  branch_id: number;
  branch_name: string;
  total_items: number;
  low_stock: number;
  out_of_stock: number;
  pending_pos: number;
  health_pct: number;
}

interface OverviewStats {
  total_items: number;
  low_stock: number;
  out_of_stock: number;
  pending_pos: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return new Date(dateStr).toLocaleDateString();
};

const stockStatus = (item: StockAlert): { label: string; cls: string } => {
  if (item.current_stock === 0) return { label: 'Out of Stock', cls: 'badge-danger' };
  if (item.current_stock <= item.reorder_level * 0.25) return { label: 'Critical', cls: 'badge-danger' };
  return { label: 'Low', cls: 'badge-warning' };
};

const healthColor = (pct: number) => {
  if (pct >= 75) return '#16a34a';
  if (pct >= 50) return '#d97706';
  return '#dc2626';
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatCard: React.FC<{
  label: string; value: number; sub: string;
  icon: React.ReactNode;
  bg: string; border: string; valueColor?: string; subColor?: string;
}> = ({ label, value, sub, icon, bg, border, valueColor = '#1a0f2e', subColor }) => (
  <div className="bg-white rounded-[0.625rem] p-5 flex items-center justify-between shadow-sm" style={{ border: `1px solid ${border}` }}>
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">{label}</p>
      <p className="text-2xl font-black tabular-nums" style={{ color: valueColor }}>{value}</p>
      <p className="text-[10px] font-semibold mt-1" style={{ color: subColor ?? '#a1a1aa' }}>{sub}</p>
    </div>
    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: bg }}>
      {icon}
    </div>
  </div>
);

const Badge: React.FC<{ cls: string; children: React.ReactNode }> = ({ cls, children }) => {
  const styles: Record<string, React.CSSProperties> = {
    'badge-danger': { background: '#fef2f2', color: '#dc2626', borderColor: '#fecaca' },
    'badge-warning': { background: '#fffbeb', color: '#d97706', borderColor: '#fde68a' },
    'badge-success': { background: '#f0fdf4', color: '#16a34a', borderColor: '#bbf7d0' },
    'badge-violet': { background: '#f5f0ff', color: '#6a12b8', borderColor: '#e9d5ff' },
  };
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border"
      style={styles[cls]}>
      {children}
    </span>
  );
};

const ProgressBar: React.FC<{ pct: number; color: string; width?: number }> = ({ pct, color, width = 80 }) => (
  <div className="rounded-full bg-zinc-100 overflow-hidden" style={{ height: 5, width }}>
    <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const InventoryOverview: React.FC = () => {
  const [stats, setStats] = useState<OverviewStats>({ total_items: 0, low_stock: 0, out_of_stock: 0, pending_pos: 0 });
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [branches, setBranches] = useState<BranchSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [branch, setBranch] = useState(localStorage.getItem('superadmin_selected_branch') || '');
  const [allBranches, setAllBranches] = useState<{ id: number; name: string }[]>([]);

  const fetchAll = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const [overviewRes, alertsRes, movementsRes, branchListRes] = await Promise.allSettled([
        api.get('/inventory/overview', { params: branch ? { branch_id: branch } : {} }),
        api.get('/inventory/alerts', { params: branch ? { branch_id: branch } : {} }),
        api.get('/raw-materials/movements', { params: { limit: 20, branch_id: branch || undefined } }),
        api.get('/branches'),
      ]);

      if (overviewRes.status === 'fulfilled') {
        const d = overviewRes.value.data;
        setStats({
          total_items: d.total_items ?? 0,
          low_stock: d.low_stock ?? 0,
          out_of_stock: d.out_of_stock ?? 0,
          pending_pos: d.pending_pos ?? 0,
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
          unit: str(m.unit),
          branch_name: str(m.branch_name),
          reason: str(m.reason),
          performed_by: str(m.performed_by),
        })));
      }
      if (branchListRes.status === 'fulfilled') {
        const bl = Array.isArray(branchListRes.value.data) ? branchListRes.value.data : branchListRes.value.data?.data ?? [];
        setAllBranches(bl);
        if (bl.length > 0 && !branch) {
          const defaultId = String(bl[0].id);
          setBranch(defaultId);
          localStorage.setItem('superadmin_selected_branch', defaultId);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [branch]);

  const handleBranchChange = (val: string) => {
    setBranch(val);
    localStorage.setItem('superadmin_selected_branch', val);
  };

  useEffect(() => { 
    fetchAll(); // Initial load

    const interval = setInterval(() => {
      fetchAll(true); // Silent update every 30s
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchAll]);

  const moveDotColor = (type: string) => {
    if (type === 'add') return '#16a34a';
    if (type === 'subtract') return '#dc2626';
    return '#6a12b8';
  };

  const resolveUnit = (unit: unknown): string => {
    if (typeof unit === 'object' && unit !== null && 'name' in unit)
      return String((unit as { name: unknown }).name ?? '');
    return typeof unit === 'string' ? unit : '';
  };

  const moveLabel = (m: StockMovement) => {
    const u = resolveUnit(m.unit);
    if (m.type === 'add') return `+${m.quantity} ${u}`;
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
    <div className="p-6 md:p-8 bg-[#f4f2fb] min-h-full">


      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
        <StatCard
          label="Total Items"
          value={stats.total_items}
          sub={branch ? "In selected branch" : "Across all branches"}
          icon={<Package size={16} color="#6a12b8" />}
          bg="#f5f0ff" border="#e9d5ff"
        />
        <StatCard
          label="Low Stock"
          value={stats.low_stock}
          sub="Below reorder level"
          icon={<TrendingDown size={16} color="#dc2626" />}
          bg="#fef2f2" border="#fecaca" valueColor="#dc2626" subColor="#fca5a5"
        />
        <StatCard
          label="Out of Stock"
          value={stats.out_of_stock}
          sub="Needs restock now"
          icon={<XCircle size={16} color="#d97706" />}
          bg="#fffbeb" border="#fde68a" valueColor="#d97706" subColor="#fbbf24"
        />
        <StatCard
          label="Pending POs"
          value={stats.pending_pos}
          sub="Awaiting delivery"
          icon={<Truck size={16} color="#16a34a" />}
          bg="#f0fdf4" border="#bbf7d0" valueColor="#16a34a" subColor="#86efac"
        />
      </div>

      {/* Two-column: Alerts + Movements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">

        {/* Low Stock Alerts */}
        <div className="bg-white border border-zinc-200 rounded-[0.625rem] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#e9d5ff] bg-[#faf9ff] flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-[#6a12b8] p-2 rounded text-white"><AlertTriangle size={13} /></div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-wide text-[#1a0f2e]">Low Stock Alerts</p>
                <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Items below reorder level</p>
              </div>
            </div>
            <div className="flex items-center gap-3 ml-auto">
              <select
                value={branch}
                onChange={e => handleBranchChange(e.target.value)}
                className="bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-zinc-600 outline-none cursor-pointer focus:ring-2 focus:ring-[#e9d5ff]">
                {allBranches.map(b => <option key={b.id} value={String(b.id)}>{b.name}</option>)}
              </select>
              <Badge cls="badge-danger">{alerts.length} items</Badge>
            </div>
          </div>
          {loading ? <Skeleton /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-100">
                    {['Item', 'Branch', 'Stock', 'Level', 'Status'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-zinc-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {alerts.length === 0 ? (
                    <tr><td colSpan={5} className="py-10 text-center text-xs text-zinc-400 font-medium">No alerts — all items are well stocked!</td></tr>
                  ) : alerts.map(item => {
                    const pct = item.reorder_level > 0 ? (item.current_stock / (item.reorder_level * 2)) * 100 : 0;
                    const { label, cls } = stockStatus(item);
                    const barColor = item.current_stock === 0 ? '#dc2626' : pct < 30 ? '#dc2626' : '#d97706';
                    return (
                      <tr key={item.id} className="border-b border-zinc-50 hover:bg-[#faf9ff] transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-bold text-[#1a0f2e] text-xs">{item.name}</p>
                          <p className="text-[10px] text-zinc-400">
                            {item.category} · {typeof item.unit === 'object' && item.unit !== null
                              ? (item.unit as { name: string }).name
                              : item.unit}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#f5f0ff] text-[#6a12b8] border border-[#e9d5ff]">
                            {item.branch_name}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-xs" style={{ color: barColor }}>{item.current_stock}</span>
                          <span className="text-[10px] text-zinc-400"> / {item.reorder_level * 2}</span>
                        </td>
                        <td className="px-4 py-3"><ProgressBar pct={pct} color={barColor} /></td>
                        <td className="px-4 py-3"><Badge cls={cls}>{label}</Badge></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Movements */}
        <div className="bg-white border border-zinc-200 rounded-[0.625rem] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#e9d5ff] bg-[#faf9ff] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-[#6a12b8] p-2 rounded text-white"><Clock size={13} /></div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-wide text-[#1a0f2e]">Recent Movements</p>
                <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Last 20 stock events</p>
              </div>
            </div>
            <Badge cls="badge-violet">Live</Badge>
          </div>
          {loading ? <Skeleton /> : (
            <div className="overflow-y-auto max-h-90">
              {movements.length === 0 ? (
                <p className="py-10 text-center text-xs text-zinc-400 font-medium">No recent movements.</p>
              ) : movements.map(m => (
                <div key={m.id} className="flex items-start gap-3 px-5 py-3 border-b border-zinc-50 hover:bg-[#faf9ff] transition-colors">
                  <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: moveDotColor(m.type) }} />
                  <div className="min-w-0">
                    <p className="text-xs text-zinc-700 leading-snug">
                      <span className="font-bold">{moveLabel(m)}</span> {m.raw_material} — {m.branch_name}
                    </p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">{m.reason} · {timeAgo(m.created_at)} · by {m.performed_by}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Branch Summary Table */}
      <div className="bg-white border border-zinc-200 rounded-[0.625rem] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#e9d5ff] bg-[#faf9ff] flex items-center gap-3">
          <div className="bg-[#6a12b8] p-2 rounded text-white">
            <Package size={13} />
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-wide text-[#1a0f2e]">Branch Stock Summary</p>
            <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Per-branch health at a glance</p>
          </div>
        </div>
        {loading ? <Skeleton /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100">
                  {['Branch', 'Total Items', 'Low Stock', 'Out of Stock', 'Pending POs', 'Health'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-zinc-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {branches.length === 0 ? (
                  <tr><td colSpan={6} className="py-10 text-center text-xs text-zinc-400">No branch data available.</td></tr>
                ) : branches.map(b => {
                  const color = healthColor(b.health_pct);
                  return (
                    <tr key={b.branch_id} className="border-b border-zinc-50 hover:bg-[#faf9ff] transition-colors">
                      <td className="px-5 py-3.5 font-bold text-[#1a0f2e] text-xs">{b.branch_name}</td>
                      <td className="px-5 py-3.5 text-zinc-600 text-xs">{b.total_items}</td>
                      <td className="px-5 py-3.5">
                        <span className="font-bold text-xs" style={{ color: b.low_stock > 0 ? '#d97706' : '#16a34a' }}>{b.low_stock}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-bold text-xs" style={{ color: b.out_of_stock > 0 ? '#dc2626' : '#16a34a' }}>{b.out_of_stock}</span>
                      </td>
                      <td className="px-5 py-3.5"><Badge cls="badge-violet">{b.pending_pos}</Badge></td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <ProgressBar pct={b.health_pct} color={color} width={100} />
                          <span className="text-[11px] font-bold tabular-nums" style={{ color }}>{b.health_pct}%</span>
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

export default InventoryOverview;
