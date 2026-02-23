import React, { useEffect } from 'react';
interface ToastProps {
  message: string;
  type?: 'error' | 'success' | 'warning';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'error', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);


  const textColors = {
    error: 'text-red-600',
    success: 'text-emerald-600',
    warning: 'text-[#3b2063]'
  };

  return (
    <div className={`fixed top-6 right-6 z-9999 animate-in fade-in slide-in-from-top-4 duration-300`}>
      <div className={`flex items-center gap-4 p-4 pr-6 rounded-2xl border shadow-xl bg-white min-w-75`}>
        {/* Status Indicator Dot */}
        <div className={`h-2 w-2 rounded-full animate-pulse ${type === 'error' ? 'bg-red-500' : 'bg-[#3b2063]'}`} />
        
        <div className="flex-1">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-0.5">
            System Notification
          </p>
          <p className={`text-sm font-bold ${textColors[type]}`}>
            {message}
          </p>
        </div>

        <button 
          onClick={onClose}
          className="text-zinc-300 hover:text-zinc-500 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};