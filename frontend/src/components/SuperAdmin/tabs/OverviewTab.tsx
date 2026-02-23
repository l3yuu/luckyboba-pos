import type { Branch } from '../../../services/BranchService';

const formatCurrency = (n: number) =>
  `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface OverviewTabProps {
  totalRevenue: number;
  todayRevenue: number;
  activeBranches: number;
  activeUsers: number;
  branches: Branch[];
  loading: boolean;
}

export const OverviewTab = ({ totalRevenue, todayRevenue, activeBranches, activeUsers, branches, loading }: OverviewTabProps) => (
  <section className="flex-1 px-6 md:px-10 pb-10 overflow-auto">
    <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {[
        { label: 'Total Revenue',    value: formatCurrency(totalRevenue), highlight: true  },
        { label: "Today's Sales",    value: formatCurrency(todayRevenue), highlight: false },
        { label: 'Active Branches',  value: String(activeBranches),       highlight: false },
        { label: 'Active Users',     value: String(activeUsers),          highlight: false },
      ].map((stat, i) => (
        <div key={i} className="rounded-[1.5rem] md:rounded-[2rem] border-2 border-zinc-200 bg-white shadow-lg hover:shadow-xl transition-all p-5 md:p-6 flex flex-col justify-between min-h-[110px] md:min-h-[130px]">
          <p className="text-[11px] md:text-[12px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2">{stat.label}</p>
          <p className={`text-2xl md:text-3xl font-black ${stat.highlight ? 'text-emerald-500' : 'text-[#3b2063]'}`}>
            {loading ? '...' : stat.value}
          </p>
        </div>
      ))}
    </div>

    <div className="mt-6 md:mt-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-zinc-100 bg-white shadow-sm p-6 md:p-8">
      <p className="text-[12px] md:text-[15px] font-black uppercase tracking-[0.25em] text-zinc-400 mb-6">Branch Performance</p>
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block w-8 h-8 border-4 border-[#3b2063] border-t-transparent rounded-full animate-spin" />
          <p className="mt-2 text-sm text-zinc-500">Loading branches...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {branches.map(branch => (
            <div key={branch.id} className="flex items-center justify-between p-4 rounded-2xl bg-[#f8f6ff] border border-zinc-100">
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${branch.status === 'active' ? 'bg-emerald-500' : 'bg-zinc-300'}`} />
                <div>
                  <p className="font-bold text-[#3b2063]">{branch.name}</p>
                  <p className="text-xs text-zinc-400">{branch.location}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-black text-[#3b2063]">{formatCurrency(Number(branch.today_sales))}</p>
                <p className="text-xs text-zinc-400">Today</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </section>
);
