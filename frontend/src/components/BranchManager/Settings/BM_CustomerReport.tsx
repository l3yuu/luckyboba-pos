import { useState, useEffect, useCallback } from 'react';
import TopNavbar from '../../Cashier/TopNavbar';
import { Search, Printer, Download, ArrowLeft, Calendar, Loader2 } from 'lucide-react';

// Define tab types for consistency
type TabType = 'CUSTOMER' | 'REPORT';

// Define the interface for props
interface CustomerReportProps {
  onBack: () => void;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

interface Customer {
  id: number;
  name: string;
  email: string;
  status: string;
  order_count: number;
  total_spent: number;
  has_card: boolean;
  card_title: string | null;
  created_at: string;
}

interface Stats {
  total: number;
  active: number;
  new_this_month: number;
  with_cards: number;
  total_revenue: number;
  avg_order_value: number;
}

const getToken = () =>
  localStorage.getItem('auth_token') ||
  localStorage.getItem('lucky_boba_token') || '';

const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  ...(getToken() ? { 'Authorization': `Bearer ${getToken()}` } : {}),
});

const fmt = (v: number) =>
  `₱${Number(v).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

const CustomerReport = ({ onBack, activeTab, setActiveTab }: CustomerReportProps) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cusRes, statsRes] = await Promise.all([
        fetch(`/api/customers?search=${searchTerm}&status=${statusFilter}`, { headers: authHeaders() }),
        fetch(`/api/customers/stats`, { headers: authHeaders() })
      ]);

      if (!cusRes.ok || !statsRes.ok) throw new Error('Failed to fetch customer data');

      const cusData = await cusRes.json();
      const statsData = await statsRes.json();

      setCustomers(cusData.data || []);
      setStats(statsData.data || null);
    } catch (err) {
      console.error(err);
      setError('Could not load customer information.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="flex-1 bg-[#f4f5f7] h-full flex flex-col overflow-hidden font-sans">
      <TopNavbar />

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-xl font-black text-[#3b2063] uppercase tracking-widest">
              LUCKY BOBA MILKTEA
            </h1>
            <p className="text-zinc-400 font-bold text-xs uppercase tracking-wider mt-1">
              Customer Reports
            </p>
          </div>
          
          <div className="flex gap-2">
            <button onClick={() => setActiveTab('CUSTOMER')} className={`px-6 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'CUSTOMER' ? 'bg-[#2a9d8f] text-white shadow-md' : 'bg-white text-zinc-400 border border-zinc-200'}`}>Customer</button>
            <button onClick={() => setActiveTab('REPORT')} className={`px-6 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'REPORT' ? 'bg-[#e9c46a] text-white shadow-md' : 'bg-white text-zinc-400 border border-zinc-200'}`}>Report</button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-5">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Total Customers</p>
            <p className="text-2xl font-black text-[#3b2063] mt-2">{stats?.total ?? 0}</p>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-[10px] font-bold text-green-600">+{stats?.new_this_month ?? 0}</span>
              <span className="text-[10px] text-zinc-400">new this month</span>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-5">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Active Accounts</p>
            <p className="text-2xl font-black text-emerald-600 mt-2">{stats?.active ?? 0}</p>
            <p className="text-[10px] text-zinc-400 mt-2">Currently enabled</p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-5">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Avg. Spend</p>
            <p className="text-2xl font-black text-[#3b2063] mt-2">{fmt(stats?.avg_order_value ?? 0)}</p>
            <p className="text-[10px] text-zinc-400 mt-2">Per unique customer</p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-5">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Loyalty Cards</p>
            <p className="text-2xl font-black text-orange-500 mt-2">{stats?.with_cards ?? 0}</p>
            <p className="text-[10px] text-zinc-400 mt-2">LUCKY CARD owners</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden flex flex-col flex-1">
          <div className="p-6 border-b border-zinc-100 bg-zinc-50/30 flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Search Customer</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={12} />
                  <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-[#ede8ff] focus:border-[#3b2063] transition-all" 
                    placeholder="Search by name or email"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Status Filter</label>
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-[#ede8ff] focus:border-[#3b2063] transition-all"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <button className="flex-1 md:flex-none px-6 py-2 bg-[#1e40af] text-white rounded-lg font-black uppercase text-[10px] tracking-widest hover:bg-[#1e3a8a] flex items-center justify-center gap-2 shadow-md">
                <Search size={14} strokeWidth={3} />Search
              </button>
              <button className="flex-1 md:flex-none px-6 py-2 bg-[#3b2063] text-white rounded-lg font-black uppercase text-[10px] tracking-widest hover:bg-[#2a1647] flex items-center justify-center gap-2 shadow-md">
                <Printer size={14} strokeWidth={3} />Print
              </button>
              <button className="flex-1 md:flex-none px-6 py-2 bg-[#10b981] text-white rounded-lg font-black uppercase text-[10px] tracking-widest hover:bg-[#059669] flex items-center justify-center gap-2 shadow-md">
                <Download size={14} strokeWidth={3} />Export
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200">
                  <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Customer</th>
                  <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Card</th>
                  <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-right">Orders</th>
                  <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-right">Total Spent</th>
                  <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="animate-spin text-[#3b2063]" size={24} />
                        <p className="text-zinc-400 font-bold text-[10px] uppercase tracking-widest">Loading Customer Data...</p>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-red-500 text-xs font-bold">{error}</td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <p className="text-zinc-400 font-bold text-xs">No customers found matching your criteria.</p>
                    </td>
                  </tr>
                ) : customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-zinc-50/80 transition-colors cursor-pointer group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-[#3b2063]">{customer.name}</span>
                        <span className="text-[10px] font-bold text-zinc-400">{customer.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {customer.has_card ? (
                        <span className="px-2 py-0.5 rounded-lg bg-orange-50 text-orange-600 text-[10px] font-black uppercase border border-orange-100 italic">
                          {customer.card_title || 'Lucky Card'}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-zinc-400">Regular</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-xs font-black text-zinc-600">{customer.order_count}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-xs font-black text-emerald-600">{fmt(customer.total_spent)}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${
                        customer.status === 'ACTIVE' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-zinc-100 text-zinc-500'
                      }`}>
                        {customer.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-bold text-zinc-500">
                        {new Date(customer.created_at).toLocaleDateString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex justify-between">
            <button 
              onClick={onBack} 
              className="px-6 py-3 bg-zinc-200 text-zinc-500 rounded-lg font-black uppercase text-[10px] tracking-widest hover:bg-zinc-300 flex items-center gap-2 shadow-sm transition-all"
            >
              <ArrowLeft size={14} strokeWidth={3} />
              Back to settings
            </button>

            <div className="flex gap-2">
              <button className="px-6 py-3 bg-[#1e40af] text-white rounded-lg font-black uppercase text-[10px] tracking-widest hover:bg-[#1e3a8a] flex items-center gap-2 shadow-lg transition-all">
                <Calendar size={14} strokeWidth={3} />
                Schedule Report
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerReport;

