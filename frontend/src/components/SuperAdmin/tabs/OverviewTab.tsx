import React from 'react';

interface Branch {
  id: number;
  name: string;
  location: string;
  status: 'active' | 'inactive';
  totalSales: number;
  todaySales: number;
}

interface OverviewTabProps {
  totalRevenue: number;
  todayRevenue: number;
  activeBranches: number;
  activeUsers: number;
  branches: Branch[];
}

const OverviewTab: React.FC<OverviewTabProps> = ({ 
  totalRevenue, 
  todayRevenue, 
  activeBranches, 
  activeUsers, 
  branches 
}) => (
  <section className="flex-1 px-6 md:px-10 pb-10 overflow-auto">
    {/* Stats Grid */}
    <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {[
        { label: "Total Revenue", value: `₱${totalRevenue.toLocaleString()}`, highlight: true },
        { label: "Today's Sales", value: `₱${todayRevenue.toLocaleString()}` },
        { label: "Active Branches", value: activeBranches.toString() },
        { label: "Active Users", value: activeUsers.toString() },
      ].map((stat, i) => (
        <div key={i} className="rounded-[1.5rem] md:rounded-[2rem] border border-zinc-100 bg-white shadow-sm p-5 md:p-6 flex flex-col justify-between min-h-[110px] md:min-h-[130px]">
          <p className="text-[12px] md:text-[13px] font-black uppercase tracking-[0.2em] text-zinc-400">
            {stat.label}
          </p>
          <p className={`text-xl md:text-2xl font-black ${stat.highlight ? 'text-emerald-500' : 'text-[#3b2063]'}`}>
            {stat.value}
          </p>
        </div>
      ))}
    </div>

    {/* Branch Performance */}
    <div className="mt-6 md:mt-8">
      <div className="rounded-[1.5rem] md:rounded-[2.5rem] border border-zinc-100 bg-white shadow-sm p-6 md:p-8">
        <p className="text-[12px] md:text-[15px] font-black uppercase tracking-[0.25em] text-zinc-400 mb-6">
          Branch Performance
        </p>
        <div className="space-y-4">
          {branches.map((branch) => (
            <div key={branch.id} className="flex items-center justify-between p-4 rounded-2xl bg-[#f8f6ff] border border-zinc-100">
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${branch.status === 'active' ? 'bg-emerald-500' : 'bg-zinc-300'}`} />
                <div>
                  <p className="font-bold text-[#3b2063]">{branch.name}</p>
                  <p className="text-xs text-zinc-400">{branch.location}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-black text-[#3b2063]">₱{branch.todaySales.toLocaleString()}</p>
                <p className="text-xs text-zinc-400">Today</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default OverviewTab;
