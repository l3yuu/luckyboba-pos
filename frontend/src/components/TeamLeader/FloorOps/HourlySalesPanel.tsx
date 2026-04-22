import React, { useState, useEffect, useCallback } from 'react';
import {
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Area, AreaChart,
} from 'recharts';
import {
  RefreshCw, AlertCircle, ShoppingCart,
  TrendingUp, Zap, BarChart2, Calendar,
} from 'lucide-react';
import api from '../../../services/api';
import { SkeletonBar, SkeletonBox } from '../SharedSkeletons';

// ─── Types ────────────────────────────────────────────────────────────────────

interface HourlyData {
  hour:          string;
  orders:        number;
  sales:         number;
  avgOrderValue: number;
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

type VariantKey = 'primary' | 'secondary';
const Btn: React.FC<{
  children: React.ReactNode; variant?: VariantKey;
  onClick?: () => void; className?: string; disabled?: boolean;
}> = ({ children, variant = 'primary', onClick, className = '', disabled = false }) => {
  const variants: Record<VariantKey, string> = {
    primary:   'bg-[#a020f0] hover:bg-[#2a1647] text-white',
    secondary: 'bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50',
  };
  return (
    <button onClick={onClick} disabled={disabled}
      className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean; payload?: { value: number; name: string }[]; label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-zinc-200 rounded-xl shadow-xl px-4 py-3 text-xs">
      <p className="font-bold text-[#1a0f2e] mb-2">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-zinc-500 font-medium">
          {p.name === 'sales' ? `₱${Number(p.value).toFixed(2)}` : p.value}
          <span className="ml-1 text-zinc-400">{p.name}</span>
        </p>
      ))}
    </div>
  );
};

// ─── Main Panel ───────────────────────────────────────────────────────────────

const HourlySalesPanel: React.FC<{ branchId: number | null }> = ({ branchId }) => {
  const [data,         setData]         = useState<HourlyData[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [fetchError,   setFetchError]   = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchData = useCallback(async () => {
    setLoading(true); setFetchError('');
    try {
      const res = await api.get('/hourly-sales', {
        params: { branch_id: branchId, date: selectedDate },
      });
      const payload = res.data;
      const raw = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setData(raw.map((d: any) => ({
        hour:          d.hour ?? d.label ?? '—',
        orders:        Number(d.orders ?? d.order_count ?? 0),
        sales:         Number(d.sales ?? d.total_sales ?? d.revenue ?? 0),
        avgOrderValue: Number(d.avgOrderValue ?? d.avg_order_value ?? 0),
      })));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setFetchError(msg ?? 'Failed to load hourly sales.');
    } finally { setLoading(false); }
  }, [branchId, selectedDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalOrders   = data.reduce((s, d) => s + d.orders, 0);
  const totalSales    = data.reduce((s, d) => s + d.sales, 0);
  const avgOrder      = totalOrders > 0 ? totalSales / totalOrders : 0;
  const peakHour      = data.length ? data.reduce((max, d) => d.orders > max.orders ? d : max, data[0]) : null;
  const maxOrders     = peakHour?.orders ?? 1;

  return (
    <div className="p-6 md:p-8" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-base font-bold text-[#1a0f2e]">Hourly Sales</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            {loading ? 'Loading...' : `${totalOrders} orders · ₱${totalSales.toFixed(2)} total`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Date picker */}
          <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-lg px-3 py-2">
            <Calendar size={13} className="text-zinc-400 shrink-0" />
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="text-xs font-medium text-zinc-700 bg-transparent outline-none cursor-pointer"
            />
          </div>
          <Btn variant="secondary" onClick={fetchData} disabled={loading}>
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </Btn>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {loading ? (
          [...Array(4)].map((_, i) => <SkeletonBox key={i} className="h-[76px] bg-white/50" />)
        ) : (
          [
            { label: "Total Orders", value: totalOrders, icon: ShoppingCart, color: "violet" },
            { label: "Total Sales", value: `₱${totalSales.toFixed(2)}`, icon: TrendingUp, color: "emerald" },
            { label: "Avg Order", value: `₱${avgOrder.toFixed(2)}`, icon: BarChart2, color: "blue" },
            { label: "Peak Hour", value: peakHour?.hour ?? '—', icon: Zap, color: "amber" },
          ].map((s, i) => {
            const colors: Record<string, string> = {
              violet: "bg-violet-50 border-violet-200 text-violet-600",
              emerald: "bg-emerald-50 border-emerald-200 text-emerald-600",
              blue: "bg-blue-50 border-blue-200 text-blue-600",
              amber: "bg-amber-50 border-amber-200 text-amber-500",
            };
            const Icon = s.icon;
            return (
              <div key={i} className="bg-white border border-zinc-200 rounded-[0.625rem] px-5 py-4 flex items-center gap-3">
                <div className={`w-10 h-10 border flex items-center justify-center rounded-[0.4rem] shrink-0 ${colors[s.color]}`}>
                  <Icon size={15} className="currentColor" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{s.label}</p>
                  <p className="text-xl font-bold text-[#1a0f2e] tabular-nums">{s.value}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Charts ── */}
      {!loading && !fetchError && data.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Orders Chart */}
          <div className="bg-white border border-zinc-200 rounded-[0.625rem] p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4">Orders by Hour</p>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#a020f0" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#a020f0" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="orders" stroke="#a020f0" strokeWidth={2}
                  fill="url(#ordersGrad)" dot={false} activeDot={{ r: 4, fill: '#a020f0' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Sales Chart */}
          <div className="bg-white border border-zinc-200 rounded-[0.625rem] p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4">Sales by Hour</p>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#16a34a" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="sales" stroke="#16a34a" strokeWidth={2}
                  fill="url(#salesGrad)" dot={false} activeDot={{ r: 4, fill: '#16a34a' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Table ── */}
      <div className="bg-white border border-zinc-200 rounded-[0.625rem] overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Hourly Breakdown</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100">
                {['Hour', 'Orders', 'Sales', 'Avg Order Value', 'Performance'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-zinc-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>

              {/* Skeleton */}
              {loading && [...Array(6)].map((_, i) => (
                <tr key={i} className="border-b border-zinc-50">
                  {[...Array(5)].map((_, j) => (
                    <td key={j} className="px-5 py-4">
                      <SkeletonBar h="h-3" style={{ width: `${55 + (j * 9) % 40}%` }} />
                    </td>
                  ))}
                </tr>
              ))}

              {/* Error */}
              {!loading && fetchError && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle size={20} className="text-red-400" />
                      <p className="text-sm font-semibold text-red-500">{fetchError}</p>
                      <Btn variant="secondary" onClick={fetchData}>Try again</Btn>
                    </div>
                  </td>
                </tr>
              )}

              {/* Empty */}
              {!loading && !fetchError && data.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-zinc-400 text-xs font-medium">
                    No hourly data found for this date.
                  </td>
                </tr>
              )}

              {/* Data rows */}
              {!loading && !fetchError && data.map((row, i) => {
                const pct = Math.round((row.orders / maxOrders) * 100);
                const isPeak = row.hour === peakHour?.hour;
                return (
                  <tr key={i} className={`border-b border-zinc-50 transition-colors ${isPeak ? 'bg-amber-50/50' : 'hover:bg-zinc-50'}`}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#1a0f2e]">{row.hour}</span>
                        {isPeak && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider bg-amber-50 text-amber-600 border border-amber-200 px-1.5 py-0.5 rounded-full">
                            <Zap size={8} /> Peak
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-zinc-700 tabular-nums">{row.orders}</td>
                    <td className="px-5 py-3.5 font-bold text-emerald-600 tabular-nums">₱{row.sales.toFixed(2)}</td>
                    <td className="px-5 py-3.5 text-zinc-500 tabular-nums">₱{row.avgOrderValue.toFixed(2)}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#a020f0] transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-zinc-400 tabular-nums w-8">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HourlySalesPanel;
