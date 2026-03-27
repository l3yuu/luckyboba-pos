import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ItemReport {
  name: string;
  quantity: number;
  revenue: number;
  category: string;
}

const ItemsReportPanel = ({ branchId }: { branchId: number | null }) => {
  const [data, setData] = useState<ItemReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'quantity' | 'revenue'>('quantity');

  useEffect(() => {
    const loadItemsData = async () => {
      try {
        // Mock data for now - replace with actual API call
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3b2063]"></div>
      </div>
    );
  }

  const sortedData = [...data].sort((a, b) => b[sortBy] - a[sortBy]);
  const totalQuantity = data.reduce((sum, item) => sum + item.quantity, 0);
  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Items Sales Report</h2>
        <p className="text-gray-600">Read-only view of item performance</p>
      </div>

      <div className="mb-4">
        <div className="flex space-x-2">
          <button
            onClick={() => setSortBy('quantity')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              sortBy === 'quantity'
                ? 'bg-[#3b2063] text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Sort by Quantity
          </button>
          <button
            onClick={() => setSortBy('revenue')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              sortBy === 'revenue'
                ? 'bg-[#3b2063] text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Sort by Revenue
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Items Sold</p>
              <p className="text-2xl font-bold text-blue-600">{totalQuantity}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">₱{totalRevenue.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Price</p>
              <p className="text-2xl font-bold text-purple-600">₱{(totalRevenue / totalQuantity).toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Items by Quantity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sortedData.slice(0, 5)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="quantity" fill="#3b2063" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Items by Revenue</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[...data].sort((a, b) => b.revenue - a.revenue).slice(0, 5)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip formatter={(value) => [`₱${value}`, 'Revenue']} />
              <Bar dataKey="revenue" fill="#16a34a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Item Details</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Price</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedData.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₱{item.revenue.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₱{(item.revenue / item.quantity).toFixed(2)}</td>
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
