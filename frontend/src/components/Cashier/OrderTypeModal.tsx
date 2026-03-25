"use client";

import React from "react";
import { useNavigate } from "react-router-dom";

interface Props {
  onSelect: (type: "dine-in" | "take-out" | "delivery") => void;
  onClose?: () => void;
}

const OrderTypeModal: React.FC<Props> = ({ onSelect, onClose }) => {
  const navigate = useNavigate();

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
    navigate("/dashboard");
  };

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
        <div className="relative px-6 py-5 border-b border-zinc-100 bg-[#f5f0ff]">
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
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#7c14d4]/20 transition-colors text-[#1a0f2e] hover:text-[#7c14d4]"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Buttons */}
        <div className="p-5 flex flex-col gap-3">

          {/* Dine In */}
          <button
            onClick={() => onSelect("dine-in")}
            className="group w-full flex items-center gap-4 p-4 rounded-xl border-2 border-[#e9d5ff] bg-[#f5f0ff] hover:bg-[#7c14d4] hover:border-[#7c14d4] transition-all duration-200 active:scale-[0.98]"
          >
            <div className="w-12 h-12 rounded-xl bg-white border border-[#e9d5ff] group-hover:bg-white/20 group-hover:border-white/30 flex items-center justify-center shrink-0 transition-all">
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
            onClick={() => onSelect("take-out")}
            className="group w-full flex items-center gap-4 p-4 rounded-xl border-2 border-[#e9d5ff] bg-[#f5f0ff] hover:bg-[#7c14d4] hover:border-[#7c14d4] transition-all duration-200 active:scale-[0.98]"
          >
            <div className="w-12 h-12 rounded-xl bg-white border border-[#e9d5ff] group-hover:bg-white/20 group-hover:border-white/30 flex items-center justify-center shrink-0 transition-all">
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

          {/* Delivery */}
          <button
            onClick={() => onSelect("delivery")}
            className="group w-full flex items-center gap-4 p-4 rounded-xl border-2 border-[#e9d5ff] bg-[#f5f0ff] hover:bg-[#7c14d4] hover:border-[#7c14d4] transition-all duration-200 active:scale-[0.98]"
          >
            <div className="w-12 h-12 rounded-xl bg-white border border-[#e9d5ff] group-hover:bg-white/20 group-hover:border-white/30 flex items-center justify-center shrink-0 transition-all">
              {/* Motorcycle icon */}
              <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="none" viewBox="0 0 48 48"
                className="transition-all [&_path]:fill-[#7c14d4] group-hover:[&_path]:fill-white">
                <path fill="#333" fillRule="evenodd" d="M14.5 35C15.8807 35 17 33.8807 17 32.5 17 31.1193 15.8807 30 14.5 30 13.1193 30 12 31.1193 12 32.5 12 33.8807 13.1193 35 14.5 35zM14.5 38C17.5376 38 20 35.5376 20 32.5 20 29.4624 17.5376 27 14.5 27 11.4624 27 9 29.4624 9 32.5 9 35.5376 11.4624 38 14.5 38zM38 35C39.3807 35 40.5 33.8807 40.5 32.5 40.5 31.1193 39.3807 30 38 30 36.6193 30 35.5 31.1193 35.5 32.5 35.5 33.8807 36.6193 35 38 35zM38 38C41.0375 38 43.5 35.5376 43.5 32.5 43.5 29.4624 41.0375 27 38 27 34.9624 27 32.5 29.4624 32.5 32.5 32.5 35.5376 34.9624 38 38 38z" clipRule="evenodd"/>
                <path fill="#333" d="M33.3583 33.28C32.8144 33.3759 32.286 33.0107 32.29 32.4584C32.2981 31.3512 32.6406 30.2636 33.2846 29.3439C34.1212 28.149 35.3983 27.3354 36.8348 27.0821C38.2714 26.8288 39.7497 27.1566 40.9446 27.9932C41.8643 28.6372 42.5581 29.5421 42.9444 30.5798C43.1371 31.0974 42.7654 31.6212 42.2215 31.7171L33.3583 33.28Z"/>
                <path fill="#333" fillRule="evenodd" d="M40.371 28.8124C39.3934 28.1278 38.1838 27.8597 37.0085 28.0669C35.8331 28.2742 34.7883 28.9398 34.1037 29.9175C33.6138 30.6172 33.3371 31.4358 33.2954 32.2756L41.9371 30.7519C41.6107 29.9769 41.0707 29.3023 40.371 28.8124ZM36.6612 26.0973C38.3589 25.798 40.106 26.1853 41.5182 27.1741C42.6051 27.9352 43.425 29.0046 43.8816 30.2309C44.3365 31.453 43.4226 32.5208 42.3952 32.7019L33.5319 34.2648C32.5045 34.4459 31.2805 33.7551 31.2901 32.4511C31.2996 31.1426 31.7043 29.8573 32.4654 28.7703C33.4542 27.3582 34.9635 26.3967 36.6612 26.0973Z" clipRule="evenodd"/>
                <path fill="#333" d="M9 21C9 19.3431 10.3431 18 12 18H21C22.6569 18 24 19.3431 24 21V22H9V21Z"/>
                <path fill="#333" fillRule="evenodd" d="M23.8293 20C23.9398 20.3128 24 20.6494 24 21V22H9V21C9 20.6494 9.06015 20.3128 9.17071 20C9.58254 18.8348 10.6938 18 12 18H21C22.3062 18 23.4175 18.8348 23.8293 20Z" clipRule="evenodd"/>
                <path fill="#333" d="M4 32.6C4 27.8503 8.51584 24 14.0864 24H22.1556C22.6219 24 23 24.3224 23 24.72V31.2C23 32.1941 22.0548 33 20.8889 33H4.46914C4.21004 33 4 32.8209 4 32.6Z"/>
                <path fill="#333" fillRule="evenodd" d="M21 26H14.0864C10.0787 26 7.10383 28.2821 6.24973 31H20.8889C20.9327 31 20.9699 30.9946 21 30.9869V26zM14.0864 24C8.51584 24 4 27.8503 4 32.6 4 32.8209 4.21004 33 4.46914 33H20.8889C22.0548 33 23 32.1941 23 31.2V24.72C23 24.3224 22.6219 24 22.1556 24H14.0864zM30.8047 18.5627L29 33H32.5L35 28.6712V19H32.5C31.8849 19 31.3069 18.8413 30.8047 18.5627z" clipRule="evenodd"/>
                <path fill="#333" d="M29 13.5C29 11.567 30.567 10 32.5 10H36.3846C36.7245 10 37 10.2755 37 10.6154V16.3846C37 16.7245 36.7245 17 36.3846 17H32.5C30.567 17 29 15.433 29 13.5Z"/>
                <path fill="#333" fillRule="evenodd" d="M35 12H32.5C31.6716 12 31 12.6716 31 13.5C31 14.3284 31.6716 15 32.5 15H35V12ZM32.5 10C30.567 10 29 11.567 29 13.5C29 15.433 30.567 17 32.5 17H36.3846C36.7245 17 37 16.7245 37 16.3846V10.6154C37 10.2755 36.7245 10 36.3846 10H32.5Z" clipRule="evenodd"/>
                <path fill="#333" d="M25.3462 11L30.2707 11.8655 29.9245 13.8353 25 12.9698 25.3462 11zM21 26H31L29.2353 33H21V26z"/>
              </svg>
            </div>
            <div className="text-left">
              <p className="text-sm font-black uppercase tracking-widest text-[#1a0f2e] group-hover:text-white transition-colors">
                Delivery
              </p>
              <p className="text-[10px] font-semibold text-zinc-400 group-hover:text-white/70 transition-colors mt-0.5">
                Rider delivers to customer
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