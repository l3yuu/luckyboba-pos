import React, { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type?: 'error' | 'success' | 'warning' | 'info';
  duration?: number; // ms, default 5000
  onClose: () => void;
  position?: 'top-right' | 'top-center' | 'bottom-right';
  showProgress?: boolean;
}

const ICONS = {
  error: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
    </svg>
  ),
  success: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  ),
  warning: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
    </svg>
  ),
  info: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
    </svg>
  ),
};

const STYLES = {
  error:   { dot: 'bg-red-500',     icon: 'text-red-500',     text: 'text-red-600',     progress: 'bg-red-400',    label: 'Error'   },
  success: { dot: 'bg-emerald-500', icon: 'text-emerald-500', text: 'text-emerald-600', progress: 'bg-emerald-400', label: 'Success' },
  warning: { dot: 'bg-amber-500',   icon: 'text-amber-500',   text: 'text-[#3b2063]',  progress: 'bg-amber-400',   label: 'Warning' },
  info:    { dot: 'bg-blue-500',    icon: 'text-blue-500',    text: 'text-blue-600',    progress: 'bg-blue-400',    label: 'Info'    },
};

const POSITIONS = {
  'top-right':   'fixed top-6 right-6 z-[9999]',
  'top-center':  'fixed top-6 left-1/2 -translate-x-1/2 z-[9999]',
  'bottom-right':'fixed bottom-6 right-6 z-[9999]',
};

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'error',
  duration = 5000,
  onClose,
  position = 'top-right',
  showProgress = true,
}) => {
  const [progress, setProgress] = useState(100);
  const [paused, setPaused] = useState(false);

  // Auto-close with optional progress bar
  useEffect(() => {
    if (paused) return;

    const interval = 50; // tick every 50ms
    const decrement = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev <= 0) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - decrement;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [duration, onClose, paused]);

  const s = STYLES[type];

  return (
    <div className={POSITIONS[position]}>
      <div
        className="animate-in fade-in slide-in-from-top-4 duration-300 bg-white rounded-2xl shadow-xl border border-zinc-100 overflow-hidden min-w-[300px] max-w-sm"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        role="alert"
        aria-live="assertive"
      >
        <div className="flex items-start gap-3 p-4 pr-5">
          {/* Colored icon */}
          <div className={`mt-0.5 shrink-0 ${s.icon}`}>
            {ICONS[type]}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-0.5">
              {s.label}
            </p>
            <p className={`text-sm font-bold leading-snug ${s.text}`}>
              {message}
            </p>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="shrink-0 text-zinc-300 hover:text-zinc-500 transition-colors mt-0.5"
            aria-label="Close notification"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress bar */}
        {showProgress && (
          <div className="h-1 bg-zinc-100">
            <div
              className={`h-full transition-all ease-linear ${s.progress}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// ── Convenience re-export for easy usage in hooks
export type ToastType = 'error' | 'success' | 'warning' | 'info';
