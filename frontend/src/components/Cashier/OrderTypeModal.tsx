"use client";

import React from "react";

interface Props {
  onSelect: (type: "dine_in" | "take_out") => void;
}

const OrderTypeModal: React.FC<Props> = ({ onSelect }) => {
  return (
    <div
      className="fixed inset-0 z-200 flex items-center justify-center p-6"
      style={{
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        backgroundColor: "rgba(0,0,0,0.45)",
      }}
    >
      <div className="relative bg-white w-full max-w-sm border border-zinc-200 rounded-[1.25rem] shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-100 bg-[#f5f0ff]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#7c14d4] rounded-lg flex items-center justify-center shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
                <rect x="9" y="3" width="6" height="4" rx="2"/>
                <path d="M9 12h6M9 16h4"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-[#1a0f2e]">
                Order Type
              </p>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                Select how the order will be served
              </p>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="p-5 flex flex-col gap-3">

          {/* Dine In */}
          <button
            onClick={() => onSelect("dine_in")}
            className="group w-full flex items-center gap-4 p-4 rounded-xl border-2 border-[#e9d5ff] bg-[#f5f0ff] hover:bg-[#7c14d4] hover:border-[#7c14d4] transition-all duration-200 active:scale-[0.98]"
          >
            <div className="w-12 h-12 rounded-xl bg-white border border-[#e9d5ff] group-hover:bg-white/20 group-hover:border-white/30 flex items-center justify-center shrink-0 transition-all">
              {/* Fork & knife inside plate */}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="#7c14d4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                className="group-hover:stroke-white transition-all">
                <circle cx="12" cy="12" r="9"/>
                <path d="M8 7v4a2 2 0 0 0 4 0V7"/>
                <line x1="10" y1="11" x2="10" y2="17"/>
                <line x1="16" y1="7" x2="16" y2="17"/>
              </svg>
            </div>
            <div className="text-left">
              <p className="text-sm font-black uppercase tracking-widest text-[#1a0f2e] group-hover:text-white transition-colors">
                Dine In
              </p>
              <p className="text-[10px] font-semibold text-zinc-400 group-hover:text-white/70 transition-colors mt-0.5">
                Customer eats here
              </p>
            </div>
            <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </div>
          </button>

          {/* Take Out */}
          <button
            onClick={() => onSelect("take_out")}
            className="group w-full flex items-center gap-4 p-4 rounded-xl border-2 border-[#e9d5ff] bg-[#f5f0ff] hover:bg-[#7c14d4] hover:border-[#7c14d4] transition-all duration-200 active:scale-[0.98]"
          >
            <div className="w-12 h-12 rounded-xl bg-white border border-[#e9d5ff] group-hover:bg-white/20 group-hover:border-white/30 flex items-center justify-center shrink-0 transition-all">
              {/* Shopping bag */}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                stroke="#7c14d4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                className="group-hover:stroke-white transition-all">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
            </div>
            <div className="text-left">
              <p className="text-sm font-black uppercase tracking-widest text-[#1a0f2e] group-hover:text-white transition-colors">
                Take Out
              </p>
              <p className="text-[10px] font-semibold text-zinc-400 group-hover:text-white/70 transition-colors mt-0.5">
                Order to go
              </p>
            </div>
            <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </div>
          </button>

        </div>

        {/* Footer */}
        <div className="px-5 pb-5">
          <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest text-center">
            This selection applies to the entire order
          </p>
        </div>

      </div>
    </div>
  );
};

export default OrderTypeModal;