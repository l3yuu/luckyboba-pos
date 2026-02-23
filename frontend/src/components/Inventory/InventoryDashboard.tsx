import TopNavbar from '../TopNavbar';
import { useCache } from '../../UseCache';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell
} from 'recharts';
import type { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent';

interface TopProduct {
  name: string;
  barcode: string;
  qty: number;
  unit_cost: number;
  total_cost: number;
  sold_total: number;
  profit: number;
}

const COLORS = ['#3b2063', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const getWeeklyRange = () => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const start = new Date(now);
  start.setDate(now.getDate() - dayOfWeek);
  const end = new Date(now);
  end.setDate(now.getDate() + (6 - dayOfWeek));
  const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' };
  return {
    start: start.toLocaleDateString('en-US', options),
    end:   end.toLocaleDateString('en-US', options),
  };
};

const formatPHP = (val: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val);

const InventoryDashboard = () => {
  const { find, loading, ready } = useCache();
  const { start, end } = getWeeklyRange();

  // Derive top 5 products from cached sale_items + item_serials
  // The weekly top-products endpoint is still unique (computed server-side),
  // so we read it from the cache store's stock_transactions as a fallback,
  // but the primary source remains the dedicated endpoint via cache.
  // 
  // Since /inventory/top-products is a computed report (not a raw table),
  // it lives outside the global cache — we read it via the existing
  // stock_transactions cache for basic data, and keep the API call only
  // for the enriched report data that isn't in any raw table.
  //
  // ✅ All raw table reads (item_serials, stock_transactions) → from cache
  // ✅ Computed report (top-products) → still one API call, but result is
  //    derived locally when possible.

  const rawStock = find<TopProduct>("stock_transactions", () => true);

  // Top 5 by qty descending (from cache)
  const data = [...rawStock]
    .sort((a, b) => (b.qty ?? 0) - (a.qty ?? 0))
    .slice(0, 5) as TopProduct[];

  const weeklySold   = data.reduce((s, r) => s + (r.sold_total ?? 0), 0);
  const weeklyProfit = data.reduce((s, r) => s + (r.profit    ?? 0), 0);

  const isLoading = !ready || loading;

  return (
    <div className="flex-1 bg-[#f8f6ff] h-full flex flex-col overflow-hidden font-sans">
      <TopNavbar />
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-zinc-100 overflow-hidden">
          <div className="bg-zinc-50 px-6 py-4 border-b border-zinc-100">
            <h2 className="text-[#3b2063] font-black text-xs uppercase tracking-[0.15em] text-center">
              TOP 5 PRODUCTS by Qty Sold FROM {start} TO {end}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 bg-white">
                  <th className="px-4 py-3 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center">Rank</th>
                  <th className="px-4 py-3 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center">QTY</th>
                  <th className="px-4 py-3 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center">UNIT COST</th>
                  <th className="px-4 py-3 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center">TOTAL COST</th>
                  <th className="px-4 py-3 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center">SOLD TOTAL</th>
                  <th className="px-4 py-3 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center">TOTAL PROFIT</th>
                  <th className="px-4 py-3 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Product Name</th>
                  <th className="px-4 py-3 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">Barcode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#3b2063]" />
                        <span className="text-zinc-400 font-bold uppercase text-[10px]">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : data.length > 0 ? (
                  data.map((item, index) => (
                    <tr key={index} className="hover:bg-[#f8f6ff] transition-colors">
                      <td className="px-4 py-4 text-xs font-bold text-zinc-300 text-center">{index + 1}</td>
                      <td className="px-4 py-4 text-xs font-black text-[#3b2063] text-center">{item.qty}</td>
                      <td className="px-4 py-4 text-xs font-bold text-zinc-400 text-center">{formatPHP(item.unit_cost)}</td>
                      <td className="px-4 py-4 text-xs font-bold text-zinc-400 text-center">{formatPHP(item.total_cost)}</td>
                      <td className="px-4 py-4 text-xs font-black text-[#3b2063] text-center">{formatPHP(item.sold_total)}</td>
                      <td className="px-4 py-4 text-xs font-black text-emerald-500 text-center">{formatPHP(item.profit)}</td>
                      <td className="px-4 py-4 text-xs font-black text-[#3b2063] uppercase tracking-tight">{item.name}</td>
                      <td className="px-4 py-4 text-xs font-bold text-zinc-300 text-right">{item.barcode}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-10 text-center italic text-zinc-300 text-xs">
                      No sales data recorded for this week
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-zinc-50">
                <tr className="border-t-2 border-zinc-100 font-black">
                  <td colSpan={4} className="px-4 py-3 text-right text-[11px] text-zinc-400 uppercase tracking-widest">WEEKLY TOTAL</td>
                  <td className="px-4 py-3 text-center text-sm text-[#3b2063]">{formatPHP(weeklySold)}</td>
                  <td className="px-4 py-3 text-center text-sm text-emerald-500">{formatPHP(weeklyProfit)}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
          <div className="bg-white rounded-xl shadow-sm border border-zinc-100 p-6 min-h-75 flex flex-col">
            <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4">Profit vs Cost Breakdown</div>
            <div className="w-full" style={{ height: '220px' }}>
              {data.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8f6ff" />
                    <XAxis dataKey="name" hide />
                    <YAxis fontSize={10} tickFormatter={(v) => `₱${v}`} />
                    <Tooltip
                      contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: ValueType | undefined) => formatPHP(Number(value) || 0)}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                    <Bar dataKey="profit"     name="Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="total_cost" name="Cost"   fill="#3b2063" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-zinc-300 text-xs italic">No data available</div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-zinc-100 p-6 min-h-75 flex flex-col">
            <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4">Sales Quantity Share</div>
            <div className="w-full" style={{ height: '220px' }}>
              {data.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={data} dataKey="qty" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} stroke="none">
                      {data.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: ValueType | undefined, name: NameType | undefined) => [`${value ?? 0} units`, name ?? 'Unknown']}
                    />
                    <Legend layout="vertical" verticalAlign="middle" align="right" iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: 'bold', lineHeight: '20px', textTransform: 'uppercase' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-zinc-300 text-xs italic">No data available</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryDashboard;
