import { useState } from 'react';
import TopNavbar from '../TopNavbar';
import { Search, Printer, Download, ArrowLeft, Calendar } from 'lucide-react';

// Define tab types for consistency
type TabType = 'CUSTOMER' | 'REPORT';

// Define the interface for props
interface CustomerReportProps {
  onBack: () => void;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

const CustomerReport = ({ onBack, activeTab, setActiveTab }: CustomerReportProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('this-month');

  const customerReports = [
    { 
      id: 'R001', 
      customerName: 'John Doe', 
      cardNumber: '1001', 
      totalSpent: '₱1,250.00', 
      visitsCount: 15, 
      lastVisit: '2026-02-10', 
      favoriteItem: 'Classic Milk Tea',
      status: 'ACTIVE'
    },
    { 
      id: 'R002', 
      customerName: 'Jane Smith', 
      cardNumber: '1002', 
      totalSpent: '₱850.00', 
      visitsCount: 8, 
      lastVisit: '2026-02-11', 
      favoriteItem: 'Taro Milk Tea',
      status: 'ACTIVE'
    },
    { 
      id: 'R003', 
      customerName: 'Mike Johnson', 
      cardNumber: '1003', 
      totalSpent: '₱2,100.00', 
      visitsCount: 22, 
      lastVisit: '2026-02-09', 
      favoriteItem: 'Wintermelon Milk Tea',
      status: 'VIP'
    },
  ];

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
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Total Customers</p>
                <p className="text-xl font-black text-[#3b2063] mt-1">247</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Active Today</p>
                <p className="text-xl font-black text-green-600 mt-1">18</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Avg. Spend</p>
                <p className="text-xl font-black text-[#3b2063] mt-1">₱156</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <div className="w-4 h-4 bg-purple-500 rounded"></div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">VIP Members</p>
                <p className="text-xl font-black text-yellow-600 mt-1">12</p>
              </div>
              <div className="p-2 bg-yellow-100 rounded-lg">
                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden flex flex-col flex-1">
          <div className="p-6 border-b border-zinc-200 bg-zinc-50/50 flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Search Customer</label>
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-zinc-300 rounded-lg text-xs font-bold outline-none focus:border-blue-500" 
                  placeholder="Enter name or card #"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Date Range</label>
                <select 
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-zinc-300 rounded-lg text-xs font-bold outline-none focus:border-blue-500"
                >
                  <option value="today">Today</option>
                  <option value="this-week">This Week</option>
                  <option value="this-month">This Month</option>
                  <option value="last-month">Last Month</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Status</label>
                <select className="w-full px-4 py-2 bg-white border border-zinc-300 rounded-lg text-xs font-bold outline-none focus:border-blue-500">
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="vip">VIP</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <button className="flex-1 md:flex-none px-6 py-2 bg-[#3b2063] text-white rounded-lg font-black uppercase text-[10px] tracking-widest hover:bg-[#291645] flex items-center justify-center gap-2 shadow-md">
                <Search size={14} strokeWidth={3} />Search
              </button>
              <button className="flex-1 md:flex-none px-6 py-2 bg-[#3b2063] text-white rounded-lg font-black uppercase text-[10px] tracking-widest hover:bg-[#2a1647] flex items-center justify-center gap-2 shadow-md">
                <Printer size={14} strokeWidth={3} />Print
              </button>
              <button className="flex-1 md:flex-none px-6 py-2 bg-[#3b2063] text-white rounded-lg font-black uppercase text-[10px] tracking-widest hover:bg-[#291645] flex items-center justify-center gap-2 shadow-md">
                <Download size={14} strokeWidth={3} />Export
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-600 uppercase tracking-widest">Report ID</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-600 uppercase tracking-widest">Customer Name</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-600 uppercase tracking-widest">Card #</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-600 uppercase tracking-widest">Total Spent</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-600 uppercase tracking-widest">Visits</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-600 uppercase tracking-widest">Last Visit</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-600 uppercase tracking-widest">Favorite</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-600 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {customerReports.map((report, i) => (
                  <tr key={i} className="hover:bg-blue-50/30 transition-colors group cursor-pointer">
                    <td className="px-6 py-4 text-xs font-black text-[#3b2063]">{report.id}</td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-700">{report.customerName}</td>
                    <td className="px-6 py-4 text-xs font-bold text-zinc-500">{report.cardNumber}</td>
                    <td className="px-6 py-4 text-xs font-black text-emerald-600">{report.totalSpent}</td>
                    <td className="px-6 py-4 text-xs font-bold text-zinc-500">{report.visitsCount}</td>
                    <td className="px-6 py-4 text-xs font-bold text-zinc-500">{report.lastVisit}</td>
                    <td className="px-6 py-4 text-xs font-bold text-zinc-500">{report.favoriteItem}</td>
                    <td className="px-6 py-4 text-xs font-bold">
                      <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${
                        report.status === 'VIP' 
                          ? 'bg-yellow-100 text-yellow-700' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {report.status}
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
              <button className="px-6 py-3 bg-[#3b2063] text-white rounded-lg font-black uppercase text-[10px] tracking-widest hover:bg-[#291645] flex items-center gap-2 shadow-lg transition-all">
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
