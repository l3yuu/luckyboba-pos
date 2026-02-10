import React from 'react';

const SalesOrder: React.FC = () => {
  return (
    <div className="p-6 md:p-10 animate-in fade-in duration-500">
      <header className="mb-8">
        <h1 className="text-xl md:text-4xl font-black text-[#3b2063] uppercase tracking-tight">
          Sales Orders
        </h1>
        <p className="text-zinc-400 font-bold text-[9px] md:text-[10px] uppercase tracking-[0.2em] mt-1">
          Manage and track customer requests
        </p>
      </header>

      {/* Placeholder for Order Table/List */}
      <div className="bg-white rounded-[2rem] border border-zinc-100 p-8 shadow-sm min-h-[400px] flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-[#f8f6ff] rounded-full flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#3b2063" className="w-8 h-8 opacity-40">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
          </svg>
        </div>
        <p className="text-zinc-400 font-black uppercase text-[11px] tracking-widest">No active orders found</p>
        <button className="mt-6 bg-[#3b2063] text-white px-8 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:scale-105 transition-transform">
          Create New Order
        </button>
      </div>
    </div>
  );
};

export default SalesOrder;