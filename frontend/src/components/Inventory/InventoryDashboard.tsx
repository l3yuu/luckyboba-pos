import { useState, useEffect } from 'react';
import TopNavbar from '../TopNavbar';
import api from '../../services/api';
import { getCache, setCache } from '../../utils/cache';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend, PieChart, Pie, Cell 
} from 'recharts';
import type { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent';

const dashboardFont = { fontFamily: "'Inter', sans-serif" };

interface TopProduct {
  name: string;
  barcode: string;
  qty: number;
  unit_cost: number;
  total_cost: number;
  sold_total: number;
  profit: number;
}

interface DashboardData {
  products: TopProduct[];
  weekly_sold_total: number;
  weekly_profit_total: number;
}

const COLORS = ['#3b2063', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const InventoryDashboard = () => {
  const cached = getCache<DashboardData>('inventory-top-products');
  const [data, setData] = useState<TopProduct[]>(cached?.products ?? []);
  const [totals, setTotals] = useState({
    sold: cached?.weekly_sold_total ?? 0,
    profit: cached?.weekly_profit_total ?? 0
  });
  const [loading, setLoading] = useState(cached === null);

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
      end: end.toLocaleDateString('en-US', options)
    };
  };

  const { start, end } = getWeeklyRange();

  useEffect(() => {
    const cached = getCache<DashboardData>('inventory-top-products');
    if (cached) {
      setData(cached.products);
      setTotals({ sold: cached.weekly_sold_total, profit: cached.weekly_profit_total });
      return;
    }

    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const response = await api.get('/inventory/top-products');
        const responseData: DashboardData = response.data;
        const top5Products = responseData.products.slice(0, 5);
        const toCache = { ...responseData, products: top5Products };

        setCache('inventory-top-products', toCache);
        setData(top5Products);
        setTotals({ sold: responseData.weekly_sold_total, profit: responseData.weekly_profit_total });
      } catch (error) {
        console.error("Failed to fetch inventory analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatPHP = (val: number) => 
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val);

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');`}</style>
      <div className="flex-1 bg-[#f3f0ff] h-full flex flex-col overflow-hidden font-sans" style={dashboardFont}>
        <TopNavbar />
        <div className="flex-1 overflow-y-auto p-5 md:p-7 flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-black">Inventory</p>
              <h1 className="text-lg font-extrabold text-[#1c1c1e] mt-0.5">Dashboard</h1>
            </div>
          </div>

          {/* Table card */}
          <div className="bg-white border border-zinc-200 overflow-hidden flex flex-col shadow-sm rounded-none">
            <div className="bg-white px-7 py-5 border-b border-zinc-100">
              <h2 className="text-[#3b2063] font-black text-xs uppercase tracking-[0.15em] text-center">
                TOP 5 PRODUCTS by Qty Sold FROM {start} TO {end}
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-white z-10 border-b-2 border-zinc-100">
                  <tr>
                    <th className="px-7 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center">Rank</th>
                    <th className="px-7 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center">QTY</th>
                    <th className="px-7 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center">UNIT COST</th>
                    <th className="px-7 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center">TOTAL COST</th>
                    <th className="px-7 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center">SOLD TOTAL</th>
                    <th className="px-7 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center">TOTAL PROFIT</th>
                    <th className="px-7 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Product Name</th>
                    <th className="px-7 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-right">Barcode</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#3b2063]"></div>
                          <span className="text-black font-bold uppercase text-[10px]">Loading...</span>
                        </div>
                      </td>
                    </tr>
                  ) : data.length > 0 ? (
                    data.map((item, index) => (
                      <tr key={index} className="hover:bg-[#f9f8ff] transition-colors">
                        <td className="px-7 py-3.5 text-center">
                          <span className="text-[13px] font-extrabold text-[#1c1c1e]">{index + 1}</span>
                        </td>
                        <td className="px-7 py-3.5 text-center">
                          <span className="text-[13px] font-extrabold text-[#3b2063]">{item.qty}</span>
                        </td>
                        <td className="px-7 py-3.5 text-center">
                          <span className="text-[12px] font-semibold text-zinc-500">{formatPHP(item.unit_cost)}</span>
                        </td>
                        <td className="px-7 py-3.5 text-center">
                          <span className="text-[12px] font-semibold text-zinc-500">{formatPHP(item.total_cost)}</span>
                        </td>
                        <td className="px-7 py-3.5 text-center">
                          <span className="text-[13px] font-extrabold text-[#3b2063]">{formatPHP(item.sold_total)}</span>
                        </td>
                        <td className="px-7 py-3.5 text-center">
                          <span className="text-[13px] font-extrabold text-emerald-500">{formatPHP(item.profit)}</span>
                        </td>
                        <td className="px-7 py-3.5">
                          <span className="text-[13px] font-extrabold text-[#3b2063] uppercase tracking-tight">{item.name}</span>
                        </td>
                        <td className="px-7 py-3.5 text-right">
                          <span className="text-[12px] font-semibold text-zinc-500">{item.barcode}</span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-8 py-20 text-center">
                        <p className="text-[11px] font-bold text-black uppercase tracking-widest">No sales data recorded for this week</p>
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-white border-t-2 border-zinc-100">
                  <tr className="font-black">
                    <td colSpan={4} className="px-7 py-4 text-right text-[11px] text-zinc-500 uppercase tracking-widest">WEEKLY TOTAL</td>
                    <td className="px-7 py-4 text-center">
                      <span className="text-[13px] font-extrabold text-[#3b2063]">{formatPHP(totals.sold)}</span>
                    </td>
                    <td className="px-7 py-4 text-center">
                      <span className="text-[13px] font-extrabold text-emerald-500">{formatPHP(totals.profit)}</span>
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
            {/* Footer */}
            <div className="px-7 py-4 bg-white border-t border-zinc-100 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[10px] font-bold text-black uppercase tracking-widest">Synchronized</span>
              </div>
              <p className="text-[10px] font-bold text-black uppercase tracking-widest">
                Showing {data.length} products
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6">
            <div className="bg-white border border-zinc-200 p-6 min-h-75 flex flex-col shadow-sm rounded-none">
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Profit vs Cost Breakdown</div>
              <div className="w-full" style={{ height: '220px' }}>
                {data.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8f6ff" />
                      <XAxis dataKey="name" hide />
                      <YAxis fontSize={10} tickFormatter={(value) => `₱${value}`} />
                      <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} formatter={(value: ValueType | undefined) => formatPHP(Number(value) || 0)} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                      <Bar dataKey="profit" name="Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="total_cost" name="Cost" fill="#3b2063" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-black text-xs italic">No data available</div>
                )}
              </div>
            </div>

            <div className="bg-white border border-zinc-200 p-6 min-h-75 flex flex-col shadow-sm rounded-none">
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Sales Quantity Share</div>
              <div className="w-full" style={{ height: '220px' }}>
                {data.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={data} dataKey="qty" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} stroke="none">
                        {data.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} formatter={(value: ValueType | undefined, name: NameType | undefined) => [`${value ?? 0} units`, name ?? 'Unknown']} />
                      <Legend layout="vertical" verticalAlign="middle" align="right" iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: 'bold', lineHeight: '20px', textTransform: 'uppercase' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-black text-xs italic">No data available</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default InventoryDashboard;
