import { useState, useEffect } from 'react';

interface VoidLog {
  id: number;
  invoice: string;
  amount: number;
  cashier: string;
  reason: string;
  created_at: string;
  status: 'pending' | 'approved' | 'rejected';
}

const VoidLogsPanel = ({ branchId }: { branchId: number | null }) => {
  const [voidLogs, setVoidLogs] = useState<VoidLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    const loadVoidLogs = async () => {
      try {
        // Mock data for now - replace with actual API call
        const mockLogs: VoidLog[] = [
          { id: 1, invoice: '#1001', amount: 150.00, cashier: 'Maria Santos', reason: 'Customer changed mind', created_at: '10:30 AM', status: 'pending' },
          { id: 2, invoice: '#1002', amount: 75.50, cashier: 'Jose Reyes', reason: 'Wrong item ordered', created_at: '09:45 AM', status: 'approved' },
          { id: 3, invoice: '#1003', amount: 200.00, cashier: 'Ana Dela Cruz', reason: 'System error', created_at: '08:20 AM', status: 'rejected' },
        ];
        setVoidLogs(mockLogs);
      } catch (error) {
        console.error('Failed to load void logs:', error);
      } finally {
        setLoading(false);
      }
    };

    loadVoidLogs();
  }, [branchId]);

  const filteredLogs = voidLogs.filter(log => filter === 'all' || log.status === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3b2063]"></div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Void Transaction Logs</h2>
        <p className="text-gray-600">Review and manage cancelled transactions</p>
      </div>

      <div className="flex space-x-2 mb-6">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === status
                ? 'bg-[#3b2063] text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Voids</p>
              <p className="text-2xl font-bold text-gray-900">{voidLogs.length}</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{voidLogs.filter(l => l.status === 'pending').length}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-green-600">{voidLogs.filter(l => l.status === 'approved').length}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">₱{voidLogs.reduce((sum, l) => sum + l.amount, 0).toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Void Transactions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cashier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{log.invoice}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.cashier}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₱{log.amount.toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{log.reason}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.created_at}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(log.status)}`}>
                      {log.status}
                    </span>
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

export default VoidLogsPanel;
