import { useRouteError } from 'react-router-dom';
import logo from '../assets/logo.png';

interface ErrorFallbackProps {
  onRetry?: () => void;
  errorMessage?: string; // Optional dev-only message
}

export const ErrorFallback = ({ onRetry, errorMessage }: ErrorFallbackProps) => {
  const handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  const handleReload = () => {
    window.location.reload();
  };

  const routeError = useRouteError() as { message?: string } | null;
  const displayError = errorMessage || routeError?.message || String(routeError) || 'Unknown error occurred.';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f6ff] p-6 font-sans">
      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-zinc-100 p-10 max-w-md w-full text-center space-y-6">

        {/* Branded Logo */}
        <img
          src={logo}
          alt="Lucky Boba"
          className="h-14 w-auto object-contain mx-auto opacity-60"
        />

        {/* Error Icon */}
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto border-4 border-red-100">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="#be2525" className="w-10 h-10">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
        </div>

        {/* Error Title */}
        <div>
          <h1 className="text-[#6a12b8] font-black uppercase text-2xl tracking-tight mb-2">
            Something Went Wrong
          </h1>
          <p className="text-zinc-400 text-sm font-medium leading-relaxed">
            An unexpected error occurred in the POS system. Your data is safe — please try again or reload the page.
          </p>
        </div>

        {/* Dev-only error message */}
        {displayError && displayError !== 'undefined' && (
          <div className="text-left bg-zinc-50 rounded-2xl p-4 border border-zinc-200 overflow-hidden">
            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Dev Error</p>
            <p className="text-xs font-mono text-red-500 break-words">{displayError}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 w-full pt-2">
          {onRetry && (
            <button
              onClick={onRetry}
              className="w-full py-4 bg-[#6a12b8] text-white rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-[#2a1647] transition-all active:scale-95 shadow-lg shadow-purple-100"
            >
              Try Again
            </button>
          )}
          <button
            onClick={handleReload}
            className="w-full py-4 bg-white text-[#6a12b8] border-2 border-[#6a12b8]/20 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-[#f0ebff] transition-all active:scale-95"
          >
            Reload Page
          </button>
          <button
            onClick={handleGoHome}
            className="w-full py-4 bg-white text-zinc-400 border border-zinc-100 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-zinc-50 transition-all active:scale-95"
          >
            Go to Dashboard
          </button>
        </div>

        <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-300">
          Lucky Boba POS © 2026
        </p>
      </div>
    </div>
  );
};

