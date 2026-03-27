import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ShoppingBag, TrendingUp, Package, Coffee } from 'lucide-react';

interface ItemReport {
  name: string;
  quantity: number;
  revenue: number;
  category: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (v?: number) => `₱${Number(v ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
const fmtS = (v?: number | string) => {
  const n = Number(v ?? 0);
  if (n >= 1_000_000) return `₱${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₱${(n / 1_000).toFixed(1)}K`;
  return `₱${n.toFixed(0)}`;
};

const purples = ['#3b2063', '#6d28d9', '#7c3aed', '#a78bfa', '#c4b5fd', '#ede9fe'];

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
          { name: 'Strawberry Smoothie', quantity: 76, revenue: 3040, category: 'Smoothie' },
          { name: 'Chocolate Milk Tea', quantity: 65, revenue: 2275, category: 'Milk Tea' },
          { name: 'Mango Slush', quantity: 54, revenue: 2160, category: 'Slush' },
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
      <div className="h-full flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-[#3b2063] border-t-transparent rounded-full tl-spin" />
        <p className="tl-label">Loading items data…</p>
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
    { label: 'Total Items Sold', value: String(totalQuantity), icon: <ShoppingBag size={12} />, color: '#7c3aed' },
    { label: 'Total Revenue', value: fmtS(totalRevenue), icon: <TrendingUp size={12} />, color: '#16a34a' },
    { label: 'Avg Price', value: fmt(avgPrice), icon: <Package size={12} />, color: '#0284c7' },
    { label: 'Categories', value: String(new Set(data.map(d => d.category)).size), icon: <Coffee size={12} />, color: '#d97706' },
  ];

  return (
    <div className="bg-[#faf9fc] min-h-full pb-10">
      {/* Header strip */}
      <div style={{ background: 'linear-gradient(135deg, #1a0f2e 0%, #3b2063 60%, #6d28d9 100%)', padding: '20px 28px 56px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, left: 60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div className="tl-badge tl-badge-purple"><span className="tl-pulse" style={{ width: 5, height: 5 }} />Items Report</div>
            </div>
            <h1 style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.035em', margin: 0, lineHeight: 1.15 }}>
              Item Sales<br />
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', fontWeight: 500 }}>Performance Overview</span>
            </h1>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p className="tl-label" style={{ color: 'rgba(255,255,255,0.45)' }}>Branch ID</p>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.72rem', fontWeight: 600, marginTop: 2 }}>{branchId ?? 'All Branches'}</p>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 20px', marginTop: -36, position: 'relative', zIndex: 2 }}>
        {/* Quick Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 16 }}>
          {quickStats.map((o, i) => (
            <div key={i} className="tl-card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: o.color + '18', color: o.color }}>{o.icon}</div>
              <div style={{ minWidth: 0 }}>
                <p className="bm-label" style={{ color: '#a1a1aa' }}>{o.label}</p>
                <p style={{ fontSize: '0.92rem', fontWeight: 800, color: '#1a0f2e', letterSpacing: '-0.025em', lineHeight: 1.25 }}>{o.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Sort Tabs */}
        <div className="tl-card p-4" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <h3 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f0a1a', margin: 0 }}>Sort Items</h3>
              <p className="bm-label" style={{ marginTop: 2, color: '#a1a1aa' }}>Choose ranking method</p>
            </div>
            <div className="bm-live"><div className="bm-live-dot" /><span className="bm-live-text">Live</span></div>
          </div>
          <div style={{ display: 'flex', gap: 2, padding: 4, background: '#f4f4f5', border: '1px solid #ede8f5', borderRadius: '0.5rem' }}>
            <button onClick={() => setSortBy('quantity')} className={`bm-tab ${sortBy === 'quantity' ? 'bm-tab-on' : 'bm-tab-off'}`}>By Quantity</button>
            <button onClick={() => setSortBy('revenue')} className={`bm-tab ${sortBy === 'revenue' ? 'bm-tab-on' : 'bm-tab-off'}`}>By Revenue</button>
          </div>
        </div>

        {/* Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginBottom: 16 }}>
          <div className="tl-card p-5">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <h3 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f0a1a', margin: 0 }}>Top Items {sortBy === 'quantity' ? 'by Quantity' : 'by Revenue'}</h3>
                <p className="bm-label" style={{ marginTop: 2, color: '#a1a1aa' }}>Item performance ranking</p>
              </div>
              <span className="bm-pill">{data.length} items</span>
            </div>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sortedData.slice(0, 6)} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#f4f4f5" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#a1a1aa', fontWeight: 700 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#a1a1aa', fontWeight: 600 }} />
                  <Tooltip formatter={(value) => sortBy === 'quantity' ? [`${value} sold`, 'Quantity'] : [fmt(Number(value)), 'Revenue']} contentStyle={{ borderRadius: '0.625rem', border: '1.5px solid #ede8f5', fontSize: 11 }} />
                  <Bar dataKey={sortBy} radius={[4, 4, 0, 0]}>
                    {sortedData.slice(0, 6).map((_, i) => <Cell key={i} fill={purples[i] || '#ede9fe'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="tl-card p-5" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div><h3 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f0a1a', margin: 0 }}>Top Sellers</h3><p className="bm-label" style={{ marginTop: 2, color: '#a1a1aa' }}>Current ranking</p></div>
              <div className="bm-live"><div className="bm-live-dot" /><span className="bm-live-text">Live</span></div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {sortedData.slice(0, 6).map((item, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 20, height: 20, borderRadius: '0.3rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', fontWeight: 800, background: i === 0 ? '#3b2063' : '#f4f4f5', color: i === 0 ? '#fff' : '#71717a', flexShrink: 0 }}>{i + 1}</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0f0a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '90px' }}>{item.name}</span>
                    </div>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#71717a', flexShrink: 0, marginLeft: 6 }}>{sortBy === 'quantity' ? item.quantity : fmtS(item.revenue)}</span>
                  </div>
                  <div className="tl-progress-bar"><div className="tl-progress-fill" style={{ width: `${sortBy === 'quantity' ? (item.quantity / maxQty) * 100 : (item.revenue / maxRevenue) * 100}%`, background: purples[i] || '#ede9fe' }} /></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="tl-card" style={{ overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid #f4f4f5' }}>
            <div><h3 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f0a1a', margin: 0 }}>Item Details</h3><p className="bm-label" style={{ marginTop: 2, color: '#a1a1aa' }}>Complete breakdown</p></div>
            <span className="bm-pill">{data.length} items</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ minWidth: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#fafafa' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#a1a1aa', borderBottom: '1px solid #f4f4f5' }}>Item Name</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#a1a1aa', borderBottom: '1px solid #f4f4f5' }}>Category</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#a1a1aa', borderBottom: '1px solid #f4f4f5' }}>Quantity</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#a1a1aa', borderBottom: '1px solid #f4f4f5' }}>Revenue</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#a1a1aa', borderBottom: '1px solid #f4f4f5' }}>Avg Price</th>
                </tr>
              </thead>
              <tbody>
                {sortedData.map((item, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #f4f4f5' }}>
                    <td style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 600, color: '#0f0a1a' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 18, height: 18, borderRadius: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.5rem', fontWeight: 800, background: index < 3 ? '#3b2063' : '#f4f4f5', color: index < 3 ? '#fff' : '#71717a' }}>{index + 1}</span>
                        {item.name}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '0.7rem', color: '#71717a' }}>{item.category}</td>
                    <td style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 700, color: '#0f0a1a', textAlign: 'right' }}>{item.quantity}</td>
                    <td style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 700, color: '#3b2063', textAlign: 'right' }}>{fmt(item.revenue)}</td>
                    <td style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 600, color: '#71717a', textAlign: 'right' }}>{fmt(item.revenue / item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemsReportPanel;
