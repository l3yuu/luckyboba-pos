import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ShoppingBag, TrendingUp, Package, Coffee, BarChart2 } from 'lucide-react';
import { SkeletonBar, SkeletonBox } from '../SharedSkeletons';

const dashboardFont = { fontFamily: "'DM Sans', sans-serif" };

interface ItemReport {
  name: string;
  quantity: number;
  revenue: number;
  category: string;
}

const fmt = (v?: number) => `₱${Number(v ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
const fmtS = (v?: number | string) => {
  const n = Number(v ?? 0);
  if (n >= 1_000_000) return `₱${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₱${(n / 1_000).toFixed(1)}K`;
  return `₱${n.toFixed(0)}`;
};

const purples = ['#6a12b8', '#6d28d9', '#7c3aed', '#a78bfa', '#c4b5fd', '#ede9fe'];

const ItemsReportPanel = ({ branchId }: { branchId: number | null }) => {
  const [data, setData] = useState<ItemReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'quantity' | 'revenue'>('quantity');

  useEffect(() => {
    const loadItemsData = async () => {
      try {
        const mockData: ItemReport[] = [
          { name: 'Classic Milk Tea', quantity: 145, revenue: 4350, category: 'Milk Tea' },
          { name: 'Taro Milk Tea', quantity: 98, revenue: 3430, category: 'Milk Tea' },
          { name: 'Wintermelon Tea', quantity: 87, revenue: 2610, category: 'Fruit Tea' },

          { name: 'Chocolate Milk Tea', quantity: 65, revenue: 2275, category: 'Milk Tea' },
          { name: 'Red Velvet', quantity: 54, revenue: 2160, category: 'Milk Tea' },
        ];
        setData(mockData);
      } catch (error) {
        console.error('Failed to load items data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadItemsData();
  }, [branchId]);

  if (loading) {
    return (
      <div className="flex-1 bg-[#f4f2fb] min-h-full p-5 md:p-8 flex flex-col gap-6" style={dashboardFont}>
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white border border-zinc-200 rounded-[0.625rem] p-5 flex items-center gap-4 shadow-sm">
              <SkeletonBox h="h-10" w="w-10 shrink-0" />
              <div className="flex flex-col gap-2 flex-1">
                <SkeletonBar h="h-3" w="w-20" />
                <SkeletonBar h="h-6" w="w-16" />
              </div>
            </div>
          ))}
        </div>
        {/* Sort Tabs */}
        <div className="bg-white border border-zinc-200 rounded-[0.625rem] p-5 shadow-sm">
          <SkeletonBar h="h-8" w="w-48" />
        </div>
        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-[0.625rem] p-5 shadow-sm">
            <SkeletonBox h="h-56" />
          </div>
          <div className="bg-white border border-zinc-200 rounded-[0.625rem] p-5 shadow-sm flex flex-col gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <SkeletonBar h="h-3" w="w-full" />
                <SkeletonBar h="h-2" w="w-full" />
              </div>
            ))}
          </div>
        </div>
        {/* Table */}
        <div className="bg-white border border-zinc-200 rounded-[0.625rem] overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-zinc-100">
            <SkeletonBar h="h-4" w="w-32" />
          </div>
          <div className="divide-y divide-zinc-50">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex gap-4 px-6 py-4 items-center">
                <SkeletonBar h="h-4" w="w-1/3" />
                <SkeletonBar h="h-4" w="w-1/5" />
                <SkeletonBar h="h-4" w="w-12 ml-auto" />
                <SkeletonBar h="h-4" w="w-16" />
                <SkeletonBar h="h-4" w="w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const sortedData = [...data].sort((a, b) => b[sortBy] - a[sortBy]);
  const totalQuantity = data.reduce((sum, item) => sum + item.quantity, 0);
  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
  const avgPrice = totalQuantity > 0 ? totalRevenue / totalQuantity : 0;
  const maxQty = Math.max(...data.map(d => d.quantity), 1);
  const maxRevenue = Math.max(...data.map(d => d.revenue), 1);

  const quickStats = [
    { label: 'Total Items Sold', value: String(totalQuantity), icon: <ShoppingBag size={16} />, bg: 'bg-violet-50 border-violet-100', iconColor: 'text-violet-600' },
    { label: 'Total Revenue', value: fmtS(totalRevenue), icon: <TrendingUp size={16} />, bg: 'bg-emerald-50 border-emerald-100', iconColor: 'text-emerald-600' },
    { label: 'Avg Price', value: fmt(avgPrice), icon: <Package size={16} />, bg: 'bg-blue-50 border-blue-100', iconColor: 'text-blue-600' },
    { label: 'Categories', value: String(new Set(data.map(d => d.category)).size), icon: <Coffee size={16} />, bg: 'bg-amber-50 border-amber-100', iconColor: 'text-amber-600' },
  ];

  return (
    <div className="flex-1 bg-[#f4f2fb] min-h-full p-5 md:p-8 flex flex-col gap-6" style={dashboardFont}>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickStats.map((o, i) => (
          <div key={i} className="bg-white border border-zinc-200 rounded-[0.625rem] p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
            <div className={`w-10 h-10 ${o.bg} border rounded-lg flex items-center justify-center shrink-0 ${o.iconColor}`}>{o.icon}</div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{o.label}</p>
              <p className="text-lg font-black text-[#1a0f2e] tabular-nums leading-tight">{o.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Sort Tabs */}
      <div className="bg-white border border-zinc-200 rounded-[0.625rem] p-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart2 size={16} className="text-zinc-400" />
          <p className="text-xs font-black text-zinc-500 uppercase tracking-widest">Ranking Method</p>
        </div>
        <div className="flex gap-1.5 p-1 bg-zinc-100 rounded-lg">
          <button
            onClick={() => setSortBy('quantity')}
            className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${sortBy === 'quantity' ? 'bg-[#6a12b8] text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
          >
            By Quantity
          </button>
          <button
            onClick={() => setSortBy('revenue')}
            className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${sortBy === 'revenue' ? 'bg-[#6a12b8] text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
          >
            By Revenue
          </button>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bar Chart */}
        <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-[0.625rem] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-black text-[#1a0f2e]">Top Items {sortBy === 'quantity' ? 'by Quantity' : 'by Revenue'}</p>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">Item performance ranking</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[9px] font-black text-violet-600 bg-violet-50 border border-violet-100 uppercase tracking-widest">{data.length} items</span>
          </div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sortedData.slice(0, 6)} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#f4f4f5" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#a1a1aa', fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#a1a1aa', fontWeight: 600 }} />
                <Tooltip
                  formatter={(value) => sortBy === 'quantity' ? [`${value} sold`, 'Quantity'] : [fmt(Number(value)), 'Revenue']}
                  contentStyle={{ borderRadius: '0.625rem', border: '1.5px solid #ede8f5', fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}
                />
                <Bar dataKey={sortBy} radius={[4, 4, 0, 0]}>
                  {sortedData.slice(0, 6).map((_, i) => <Cell key={i} fill={purples[i] || '#ede9fe'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Sellers List */}
        <div className="bg-white border border-zinc-200 rounded-[0.625rem] p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-black text-[#1a0f2e]">Top Sellers</p>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">Current ranking</p>
            </div>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
              <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Live</span>
            </span>
          </div>
          <div className="flex flex-col gap-4 flex-1">
            {sortedData.slice(0, 6).map((item, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-black shrink-0 ${i === 0 ? 'bg-[#6a12b8] text-white' : 'bg-zinc-100 text-zinc-500'}`}>{i + 1}</span>
                    <span className="text-[11px] font-bold text-[#1a0f2e] truncate">{item.name}</span>
                  </div>
                  <span className="text-[10px] font-black text-zinc-500 shrink-0 ml-2">{sortBy === 'quantity' ? item.quantity : fmtS(item.revenue)}</span>
                </div>
                <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${sortBy === 'quantity' ? (item.quantity / maxQty) * 100 : (item.revenue / maxRevenue) * 100}%`,
                      background: purples[i] || '#ede9fe'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-zinc-200 rounded-[0.625rem] overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-[#1a0f2e]">Item Details</p>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">Complete breakdown</p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[9px] font-black text-violet-600 bg-violet-50 border border-violet-100 uppercase tracking-widest">{data.length} items</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50/50">
              <tr className="border-b border-zinc-100">
                <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-zinc-400">Item Name</th>
                <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-zinc-400">Category</th>
                <th className="px-6 py-3 text-right text-[10px] font-black uppercase tracking-widest text-zinc-400">Quantity</th>
                <th className="px-6 py-3 text-right text-[10px] font-black uppercase tracking-widest text-zinc-400">Revenue</th>
                <th className="px-6 py-3 text-right text-[10px] font-black uppercase tracking-widest text-zinc-400">Avg Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {sortedData.map((item, index) => (
                <tr key={index} className="hover:bg-[#faf9ff] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-black shrink-0 ${index < 3 ? 'bg-[#6a12b8] text-white' : 'bg-zinc-100 text-zinc-400'}`}>{index + 1}</span>
                      <span className="text-xs font-black text-[#1a0f2e] group-hover:text-[#6a12b8] transition-colors">{item.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black text-zinc-500 bg-zinc-100 border border-zinc-200 uppercase tracking-widest">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-xs font-black text-[#1a0f2e] tabular-nums">{item.quantity}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-xs font-black text-[#6a12b8] tabular-nums">{fmt(item.revenue)}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-xs font-bold text-zinc-400 tabular-nums">{fmt(item.revenue / item.quantity)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ItemsReportPanel;
