import React, { useEffect } from 'react';
<<<<<<< HEAD
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';
=======
>>>>>>> origin/main

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

<<<<<<< HEAD
  // Dynamic styles and icons based on the toast type
  const config = {
    error: {
      text: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-100',
      label: 'System Error',
      icon: <AlertCircle className="w-5 h-5 text-red-500" strokeWidth={2.5} />
    },
    success: {
      text: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
      label: 'Success',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" strokeWidth={2.5} />
    },
    warning: {
      text: 'text-[#3b2063]',
      bg: 'bg-[#f0ebff]',
      border: 'border-[#e5deff]',
      label: 'Notification',
      icon: <Info className="w-5 h-5 text-[#3b2063]" strokeWidth={2.5} />
    }
  };

  const current = config[type];

  return (
    <div className="fixed top-6 right-6 z-[9999] animate-in fade-in slide-in-from-top-4 slide-in-from-right-4 duration-300">
      <div className={`flex items-start gap-4 p-4 pr-5 rounded-[2rem] border ${current.border} shadow-2xl shadow-zinc-200/50 bg-white min-w-[320px] max-w-md`}>
        
        {/* Dynamic Icon Box */}
        <div className={`p-3 rounded-2xl ${current.bg} shrink-0`}>
          {current.icon}
        </div>
        
        {/* Text Content */}
        <div className="flex-1 pt-1.5">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1">
            {current.label}
          </p>
          <p className={`text-sm font-bold leading-tight ${current.text}`}>
=======

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
>>>>>>> origin/main
            {message}
          </p>
        </div>

<<<<<<< HEAD
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="p-2 mt-1 mr-1 text-zinc-300 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition-all active:scale-95"
        >
          <X strokeWidth={3} className="w-4 h-4" />
=======
        <button 
          onClick={onClose}
          className="text-zinc-300 hover:text-zinc-500 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
          </svg>
>>>>>>> origin/main
        </button>
      </div>
    </div>
  );
};