import { useState, useEffect } from 'react';

interface ZReadingData {
  date: string;
  gross_sales: number;
  vat_sales: number;
  vat_exempt_sales: number;
  vat_amount: number;
  void_sales: number;
  net_sales: number;
  cash_sales: number;
  card_sales: number;
  gcash_sales: number;
  maya_sales: number;
  total_orders: number;
  void_orders: number;
  // Discounts
  sc_discount: number;
  pwd_discount: number;
  naac_discount: number;
  solo_parent_discount: number;
  diplomat_discount: number;
  // Payment breakdown
  payment_breakdown: { method: string; amount: number }[];
  // Cash management
  cash_in: number;
  cash_drop: number;
  expected_amount: number;
  total_cash_count: number;
  over_short: number;
  // Accumulated
  reset_counter: number;
  z_counter: number;
  present_accumulated: number;
  previous_accumulated: number;
  sales_for_the_day: number;
}

const ZReadingPanel = ({ branchId }: { branchId: number | null }) => {
  const [data, setData] = useState<ZReadingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchReceipt, setSearchReceipt] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [searchResults, setSearchResults] = useState<any[]>([]);

  useEffect(() => {
    const loadZReading = async () => {
      try {
        // Mock data for now - replace with actual API call
        const mockData: ZReadingData = {
          date: selectedDate,
          gross_sales: 15420.50,
          vat_sales: 13878.45,
          vat_exempt_sales: 1542.05,
          vat_amount: 1666.27,
          void_sales: 340.00,
          net_sales: 15080.50,
          cash_sales: 8200.00,
          card_sales: 3000.00,
          gcash_sales: 2500.00,
          maya_sales: 1380.50,
          total_orders: 415,
          void_orders: 8,
          // Discounts
          sc_discount: 245.00,  // 20% discount + VAT relief
          pwd_discount: 180.00, // 20% discount + VAT relief
          naac_discount: 120.00,
          solo_parent_discount: 95.00,
          diplomat_discount: 0.00,
          // Payment breakdown
          payment_breakdown: [
            { method: 'cash', amount: 8200.00 },
            { method: 'gcash', amount: 2500.00 },
            { method: 'maya', amount: 1380.50 },
            { method: 'visa', amount: 1800.00 },
            { method: 'mastercard', amount: 1200.00 },
          ],
          // Cash management
          cash_in: 1000.00,
          cash_drop: 500.00,
          expected_amount: 8700.00,
          total_cash_count: 8685.00,
          over_short: -15.00, // short
          // Accumulated
          reset_counter: 3,
          z_counter: 45,
          present_accumulated: 15080.50,
          previous_accumulated: 124520.75,
          sales_for_the_day: 15080.50,
        };
        setData(mockData);
      } catch (error) {
        console.error('Failed to load Z-reading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadZReading();
  }, [branchId, selectedDate]);

  const handleSearchReceipt = async () => {
    if (!searchReceipt.trim()) return;
    
    try {
      // Mock search results - replace with actual API call
      const mockResults = [
        { 
          invoice: `#${searchReceipt.padStart(6, '0')}`, 
          amount: 125.50, 
          time: '10:30 AM',
          customer: 'Juan Dela Cruz',
          items: ['Classic Milk Tea', 'Pearls'],
          payment: 'gcash',
          reference: '1234567890123'
        }
      ];
      setSearchResults(mockResults);
    } catch (error) {
      console.error('Failed to search receipt:', error);
    }
  };

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

  const totalDiscounts = data.sc_discount + data.pwd_discount + data.naac_discount + 
                        data.solo_parent_discount + data.diplomat_discount;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Z-Reading Report</h2>
        <p className="text-gray-600">End-of-day sales summary with VAT and discount details</p>
      </div>

      <div className="mb-4">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b2063]"
        />
      </div>

      {/* Receipt Search Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Search Receipt</h3>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter receipt number or reference..."
            value={searchReceipt}
            onChange={(e) => setSearchReceipt(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b2063]"
          />
          <button
            onClick={handleSearchReceipt}
            className="px-6 py-2 bg-[#3b2063] text-white rounded-lg hover:bg-[#2a1647] transition-colors"
          >
            Search
          </button>
        </div>
        {searchResults.length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium text-blue-900 mb-2">Search Results:</h4>
            {searchResults.map((result, index) => (
              <div key={index} className="bg-white p-3 rounded border border-blue-200">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{result.invoice}</p>
                    <p className="text-sm text-gray-600">{result.customer} • {result.time}</p>
                    <p className="text-sm text-gray-600">{result.items.join(', ')}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">₱{result.amount.toFixed(2)}</p>
                    <p className="text-sm text-gray-600">{result.payment}</p>
                    <p className="text-xs text-gray-500">Ref: {result.reference}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sales Summary */}
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
              <p className="text-sm font-medium text-gray-600">VAT Amount</p>
              <p className="text-2xl font-bold text-blue-600">₱{data.vat_amount.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Discounts</p>
              <p className="text-2xl font-bold text-orange-600">₱{totalDiscounts.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
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
      </div>

      {/* VAT Breakdown */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">VAT Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-gray-200 rounded p-4">
            <h4 className="font-medium text-gray-900 mb-2">VATable Sales</h4>
            <p className="text-xl font-bold text-gray-900">₱{data.vat_sales.toFixed(2)}</p>
            <p className="text-sm text-gray-600">12% VAT applied</p>
          </div>
          <div className="border border-gray-200 rounded p-4">
            <h4 className="font-medium text-gray-900 mb-2">VAT-Exempt Sales</h4>
            <p className="text-xl font-bold text-gray-900">₱{data.vat_exempt_sales.toFixed(2)}</p>
            <p className="text-sm text-gray-600">Senior/PWD discounts</p>
          </div>
          <div className="border border-gray-200 rounded p-4">
            <h4 className="font-medium text-gray-900 mb-2">VAT Amount</h4>
            <p className="text-xl font-bold text-blue-600">₱{data.vat_amount.toFixed(2)}</p>
            <p className="text-sm text-gray-600">Total VAT collected</p>
          </div>
        </div>
      </div>

      {/* Discount Breakdown */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Discount Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex justify-between items-center p-3 border border-gray-200 rounded">
            <span className="text-sm font-medium text-gray-700">Senior Citizen (20% + VAT relief)</span>
            <span className="font-bold text-gray-900">₱{data.sc_discount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center p-3 border border-gray-200 rounded">
            <span className="text-sm font-medium text-gray-700">PWD (20% + VAT relief)</span>
            <span className="font-bold text-gray-900">₱{data.pwd_discount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center p-3 border border-gray-200 rounded">
            <span className="text-sm font-medium text-gray-700">NAAC</span>
            <span className="font-bold text-gray-900">₱{data.naac_discount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center p-3 border border-gray-200 rounded">
            <span className="text-sm font-medium text-gray-700">Solo Parent</span>
            <span className="font-bold text-gray-900">₱{data.solo_parent_discount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center p-3 border border-gray-200 rounded">
            <span className="text-sm font-medium text-gray-700">Diplomat</span>
            <span className="font-bold text-gray-900">₱{data.diplomat_discount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center p-3 border border-gray-200 rounded bg-orange-50">
            <span className="text-sm font-bold text-orange-900">Total Discounts</span>
            <span className="font-bold text-orange-600">₱{totalDiscounts.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Payment Method Breakdown */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Method Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.payment_breakdown.map((payment, index) => (
            <div key={index} className="flex justify-between items-center p-3 border border-gray-200 rounded">
              <span className="text-sm font-medium text-gray-700 capitalize">{payment.method}</span>
              <span className="font-bold text-gray-900">₱{payment.amount.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Cash Management */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Cash Management</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Cash Flow</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Cash Sales</span>
                <span className="font-medium">₱{data.cash_sales.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Cash In</span>
                <span className="font-medium text-green-600">+₱{data.cash_in.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Cash Drop</span>
                <span className="font-medium text-red-600">-₱{data.cash_drop.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="text-sm font-medium text-gray-900">Expected Amount</span>
                <span className="font-bold text-gray-900">₱{data.expected_amount.toFixed(2)}</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Cash Count</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Cash Count</span>
                <span className="font-medium">₱{data.total_cash_count.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Over/Short</span>
                <span className={`font-bold ${data.over_short >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {data.over_short >= 0 ? '+' : ''}₱{data.over_short.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Accumulated Sales */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Accumulated Sales</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">Reset Counter</p>
            <p className="text-2xl font-bold text-gray-900">{data.reset_counter}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Z-Counter</p>
            <p className="text-2xl font-bold text-gray-900">{data.z_counter}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Sales for the Day</p>
            <p className="text-2xl font-bold text-green-600">₱{data.sales_for_the_day.toFixed(2)}</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Previous Accumulated</span>
              <span className="font-medium">₱{data.previous_accumulated.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Present Accumulated</span>
              <span className="font-bold text-gray-900">₱{data.present_accumulated.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZReadingPanel;
