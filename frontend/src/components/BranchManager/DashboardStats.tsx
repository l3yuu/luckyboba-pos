import React from 'react';

const DashboardStats: React.FC = () => (
  <section className="flex-1 px-4 sm:px-6 md:px-10 pb-6 sm:pb-8 md:pb-10 overflow-auto">
    <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {[
        { label: "Cash in", value: "₱0.00" },
        { label: "Cash out", value: "₱0.00" },
        { label: "Total Sales", value: "₱0.00", highlight: true },
        { label: "Total items", value: "0" },
      ].map((stat, i) => (
        <div key={i} className="rounded-2xl sm:rounded-3xl md:rounded-4xl border border-zinc-100 bg-white shadow-sm p-3 sm:p-4 md:p-5 lg:p-6 flex flex-col justify-between min-h-24 sm:min-h-28 md:min-h-32 lg:min-h-40">
          <p className="text-[10px] sm:text-[11px] md:text-[12px] lg:text-[13px] font-black uppercase tracking-widest text-zinc-400">
            {stat.label}
          </p>
          <p className={`text-lg sm:text-xl md:text-2xl font-black ${stat.highlight ? 'text-emerald-500' : 'text-[#3b2063]'}`}>
            {stat.value}
          </p>
        </div>
      ))}
    </div>

    <div className="mt-4 sm:mt-6 md:mt-8 grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 xl:grid-cols-2">
      <div className="rounded-2xl sm:rounded-3xl md:rounded-[2.5rem] border border-zinc-100 bg-white shadow-sm p-4 sm:p-5 md:p-6 lg:p-8 min-h-40 sm:min-h-44 md:min-h-48 lg:min-h-64 flex flex-col">
        <p className="text-[10px] sm:text-[12px] md:text-[13px] lg:text-[15px] font-black uppercase tracking-widest text-zinc-400 mb-3 sm:mb-4 md:mb-6">
          Top seller for today
        </p>
        <div className="flex-1 flex flex-col justify-center gap-2 sm:gap-3">
          {[1, 2, 3, 4, 5].map((rank) => (
            <div key={rank} className="flex items-center justify-between border-b border-zinc-100 pb-1 sm:pb-2">
              <p className="font-bold text-zinc-500 text-xs sm:text-sm">#{rank}</p>
              <p className="text-zinc-300 font-semibold text-xs sm:text-sm">Data unavailable</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl sm:rounded-3xl md:rounded-[2.5rem] border border-zinc-100 bg-white shadow-sm p-4 sm:p-5 md:p-6 lg:p-8 min-h-40 sm:min-h-44 md:min-h-48 lg:min-h-64 flex flex-col">
        <p className="text-[10px] sm:text-[12px] md:text-[13px] lg:text-[15px] font-black uppercase tracking-widest text-zinc-400 mb-3 sm:mb-4 md:mb-6">
          Top seller all time
        </p>
        <div className="flex-1 flex flex-col justify-center gap-2 sm:gap-3">
          {[1, 2, 3, 4, 5].map((rank) => (
            <div key={rank} className="flex items-center justify-between border-b border-zinc-100 pb-1 sm:pb-2">
              <p className="font-bold text-zinc-500 text-xs sm:text-sm">#{rank}</p>
              <p className="text-zinc-300 font-semibold text-xs sm:text-sm">Data unavailable</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default DashboardStats;
