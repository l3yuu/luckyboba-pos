import {
  SalesReportIcon, InventoryIcon, UserActivityIcon,
  BranchComparisonIcon, FinancialIcon, AuditLogIcon,
} from '../icons';

const REPORT_CARDS = [
  { title: 'Sales Summary',      desc: 'Complete sales report across all branches',    Icon: SalesReportIcon      },
  { title: 'Inventory Report', desc: 'Stock levels and inventory movement', Icon: InventoryIcon },
  { title: 'User Activity',      desc: 'Login history and user actions',               Icon: UserActivityIcon     },
  { title: 'Branch Comparison',  desc: 'Performance comparison between branches',      Icon: BranchComparisonIcon },
  { title: 'Financial Report',   desc: 'Revenue, expenses, and profit margins',        Icon: FinancialIcon        },
  { title: 'Audit Log',          desc: 'System changes and administrative actions',    Icon: AuditLogIcon         },
];

export const ReportsTab = () => (
  <section className="flex-1 px-6 md:px-10 pb-10 overflow-auto">
    <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {REPORT_CARDS.map(({ title, desc, Icon }) => (
        <div key={title} className="rounded-[1.5rem] border border-zinc-100 bg-white shadow-sm p-6 hover:shadow-md transition-all cursor-pointer group">
          <div className="text-3xl mb-4"><Icon /></div>
          <h3 className="font-black text-[#3b2063] text-lg group-hover:text-[#2a174a]">{title}</h3>
          <p className="text-sm text-zinc-400 mt-2">{desc}</p>
          <button className="mt-4 bg-[#f0ebff] text-[#3b2063] px-4 py-2 rounded-xl font-bold text-[11px] uppercase hover:bg-[#e5deff] transition-all w-full">
            Generate
          </button>
        </div>
      ))}
    </div>
  </section>
);
