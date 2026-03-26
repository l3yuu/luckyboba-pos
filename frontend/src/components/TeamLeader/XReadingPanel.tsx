import { useState, useEffect } from 'react';

interface XReadingData {
  date: string;
  gross_sales: number;
  void_sales: number;
  net_sales: number;
  cash_sales: number;
  card_sales: number;
  gc_sales: number;
  total_orders: number;
  void_orders: number;
}

const XReadingPanel = ({ branchId }: { branchId: number | null }) => {
  const [data, setData] = useState<XReadingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const loadXReading = async () => {
      try {
        // Mock data for now - replace with actual API call
        const mockData: XReadingData = {
          date: selectedDate,
          gross_sales: 15420.50,
          void_sales: 340.00,
          net_sales: 15080.50,
          cash_sales: 8200.00,
          card_sales: 5880.50,
          gc_sales: 1000.00,
          total_orders: 415,
          void_orders: 8,
        };
        setData(mockData);
      } catch (error) {
        console.error('Failed to load X-reading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadXReading();
  }, [branchId, selectedDate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3b2063]"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">No data available for selected date</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">X-Reading Report</h2>
        <p className="text-gray-600">Read-only view of daily sales summary</p>
      </div>

      <div className="mb-4">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b2063]"
        />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <p className="text-sm text-blue-800">
            This is a read-only X-Reading report. Team Leaders can view but cannot export or modify this data.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Gross Sales</p>
              <p className="text-2xl font-bold text-gray-900">₱{data.gross_sales.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Void Sales</p>
              <p className="text-2xl font-bold text-red-600">₱{data.void_sales.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Net Sales</p>
              <p className="text-2xl font-bold text-green-600">₱{data.net_sales.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-blue-600">{data.total_orders}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Method Breakdown</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-gray-700">Cash Sales</span>
              </div>
              <span className="text-sm font-bold text-gray-900">₱{data.cash_sales.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-gray-700">Card Sales</span>
              </div>
              <span className="text-sm font-bold text-gray-900">₱{data.card_sales.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-gray-700">Gift Certificate Sales</span>
              </div>
              <span className="text-sm font-bold text-gray-900">₱{data.gc_sales.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Total Orders</span>
              <span className="text-sm font-bold text-gray-900">{data.total_orders}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Void Orders</span>
              <span className="text-sm font-bold text-red-600">{data.void_orders}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Net Orders</span>
              <span className="text-sm font-bold text-green-600">{data.total_orders - data.void_orders}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Average Order Value</span>
              <span className="text-sm font-bold text-gray-900">₱{(data.net_sales / (data.total_orders - data.void_orders)).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">X-Reading Summary</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-3">Sales Information</h4>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-600">Date:</dt>
                  <dd className="text-sm font-medium text-gray-900">{data.date}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-600">Gross Sales:</dt>
                  <dd className="text-sm font-medium text-gray-900">₱{data.gross_sales.toFixed(2)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-600">Void Sales:</dt>
                  <dd className="text-sm font-medium text-red-600">-₱{data.void_sales.toFixed(2)}</dd>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <dt className="text-sm font-semibold text-gray-900">Net Sales:</dt>
                  <dd className="text-sm font-bold text-green-600">₱{data.net_sales.toFixed(2)}</dd>
                </div>
              </dl>
            </div>
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-3">Order Information</h4>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-600">Total Orders:</dt>
                  <dd className="text-sm font-medium text-gray-900">{data.total_orders}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-600">Void Orders:</dt>
                  <dd className="text-sm font-medium text-red-600">{data.void_orders}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-600">Void Rate:</dt>
                  <dd className="text-sm font-medium text-gray-900">{((data.void_orders / data.total_orders) * 100).toFixed(1)}%</dd>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <dt className="text-sm font-semibold text-gray-900">Net Orders:</dt>
                  <dd className="text-sm font-bold text-green-600">{data.total_orders - data.void_orders}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default XReadingPanel;
