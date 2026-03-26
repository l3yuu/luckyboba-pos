import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface HourlyData {
  hour: string;
  orders: number;
  sales: number;
  avgOrderValue: number;
}

const HourlySalesPanel = ({ branchId }: { branchId: number | null }) => {
  const [data, setData] = useState<HourlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const loadHourlyData = async () => {
      try {
        // Mock data for now - replace with actual API call
        const mockData: HourlyData[] = [
          { hour: '8AM', orders: 12, sales: 450, avgOrderValue: 37.5 },
          { hour: '9AM', orders: 18, sales: 680, avgOrderValue: 37.8 },
          { hour: '10AM', orders: 25, sales: 920, avgOrderValue: 36.8 },
          { hour: '11AM', orders: 32, sales: 1180, avgOrderValue: 36.9 },
          { hour: '12PM', orders: 45, sales: 1680, avgOrderValue: 37.3 },
          { hour: '1PM', orders: 38, sales: 1420, avgOrderValue: 37.4 },
          { hour: '2PM', orders: 28, sales: 1050, avgOrderValue: 37.5 },
          { hour: '3PM', orders: 22, sales: 820, avgOrderValue: 37.3 },
          { hour: '4PM', orders: 30, sales: 1120, avgOrderValue: 37.3 },
          { hour: '5PM', orders: 35, sales: 1300, avgOrderValue: 37.1 },
        ];
        setData(mockData);
      } catch (error) {
        console.error('Failed to load hourly data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHourlyData();
  }, [branchId, selectedDate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3b2063]"></div>
      </div>
    );
  }

  const totalOrders = data.reduce((sum, d) => sum + d.orders, 0);
  const totalSales = data.reduce((sum, d) => sum + d.sales, 0);
  const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
  const peakHour = data.reduce((max, d) => d.orders > max.orders ? d : max, data[0]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Hourly Sales Analysis</h2>
        <p className="text-gray-600">Track sales performance throughout the day</p>
      </div>

      <div className="mb-4">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b2063]"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sales</p>
              <p className="text-2xl font-bold text-green-600">₱{totalSales.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
              <p className="text-2xl font-bold text-purple-600">₱{avgOrderValue.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Peak Hour</p>
              <p className="text-2xl font-bold text-orange-600">{peakHour.hour}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Orders by Hour</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip formatter={(value) => [value, 'Orders']} />
              <Line type="monotone" dataKey="orders" stroke="#3b2063" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales by Hour</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip formatter={(value) => [`₱${value}`, 'Sales']} />
              <Line type="monotone" dataKey="sales" stroke="#16a34a" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Hourly Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hour</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sales</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Order Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.hour}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.orders}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₱{row.sales.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₱{row.avgOrderValue.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-[#3b2063] h-2 rounded-full" 
                          style={{ width: `${(row.orders / peakHour.orders) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-600">
                        {Math.round((row.orders / peakHour.orders) * 100)}%
                      </span>
                    </div>
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

export default HourlySalesPanel;
