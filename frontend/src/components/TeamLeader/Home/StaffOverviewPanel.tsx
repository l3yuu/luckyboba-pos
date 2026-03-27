import { useState, useEffect } from 'react';

interface Staff {
  id: number;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'idle' | 'break';
  orders_today: number;
  last_active?: string;
}

const StaffOverviewPanel = ({ branchId }: { branchId: number | null }) => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStaff = async () => {
      try {
        // Mock data for now - replace with actual API call
        const mockStaff: Staff[] = [
          { id: 1, name: 'Maria Santos', email: 'maria@luckyboba.com', role: 'Cashier', status: 'active', orders_today: 34, last_active: '2 mins ago' },
          { id: 2, name: 'Jose Reyes', email: 'jose@luckyboba.com', role: 'Cashier', status: 'active', orders_today: 28, last_active: '5 mins ago' },
          { id: 3, name: 'Ana Dela Cruz', email: 'ana@luckyboba.com', role: 'Cashier', status: 'idle', orders_today: 12, last_active: '15 mins ago' },
          { id: 4, name: 'Carlo Bautista', email: 'carlo@luckyboba.com', role: 'Cashier', status: 'active', orders_today: 19, last_active: '1 min ago' },
        ];
        setStaff(mockStaff);
      } catch (error) {
        console.error('Failed to load staff:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStaff();
  }, [branchId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3b2063]"></div>
      </div>
    );
  }

  const activeCount = staff.filter(s => s.status === 'active').length;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Staff Overview</h2>
        <p className="text-gray-600">Monitor your team's performance and status</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Staff</p>
              <p className="text-2xl font-bold text-gray-900">{staff.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Now</p>
              <p className="text-2xl font-bold text-green-600">{activeCount}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{staff.reduce((sum, s) => sum + s.orders_today, 0)}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Staff Members</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {staff.map((member) => (
            <div key={member.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${
                    member.status === 'active' ? 'bg-green-500 animate-pulse' : 
                    member.status === 'idle' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></div>
                  <div>
                    <h4 className="font-medium text-gray-900">{member.name}</h4>
                    <p className="text-sm text-gray-600">{member.role} • {member.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{member.orders_today} orders</p>
                  <p className="text-sm text-gray-600">{member.last_active}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StaffOverviewPanel;
