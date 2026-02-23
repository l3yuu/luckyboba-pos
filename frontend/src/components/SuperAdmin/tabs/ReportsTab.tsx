import React from 'react';
import * as Icons from '../icons';

const ReportsTab: React.FC = () => (
  <section className="flex-1 px-6 md:px-10 pb-10 overflow-auto">
    <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {[
        { title: 'Sales Summary', desc: 'Complete sales report across all branches', icon: <Icons.SalesReportIcon /> },
        { title: 'Inventory Report', desc: 'Stock levels and inventory movement', icon: <Icons.InventoryIcon /> },
        { title: 'User Activity', desc: 'Login history and user actions', icon: <Icons.UserActivityIcon /> },
        { title: 'Branch Comparison', desc: 'Performance comparison between branches', icon: <Icons.BranchComparisonIcon /> },
        { title: 'Financial Report', desc: 'Revenue, expenses, and profit margins', icon: <Icons.FinancialIcon /> },
        { title: 'Audit Log', desc: 'System changes and administrative actions', icon: <Icons.AuditLogIcon /> },
      ].map((report, i) => (
        <div key={i} className="rounded-[1.5rem] border border-zinc-100 bg-white shadow-sm p-6 hover:shadow-md transition-all cursor-pointer group">
          <div className="text-3xl mb-4">{report.icon}</div>
          <h3 className="font-black text-[#3b2063] text-lg group-hover:text-[#2a174a]">{report.title}</h3>
          <p className="text-sm text-zinc-400 mt-2">{report.desc}</p>
          <button className="mt-4 bg-[#f0ebff] text-[#3b2063] px-4 py-2 rounded-xl font-bold text-[11px] uppercase hover:bg-[#e5deff] transition-all w-full">
            Generate
          </button>
        </div>
      ))}
    </div>
  </section>
);

export default ReportsTab;
