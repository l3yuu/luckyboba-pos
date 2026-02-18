import logo from '../assets/logo.png';

export const ErrorFallback = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#f8f6ff] p-6 font-sans">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] border border-zinc-100 shadow-sm p-10 text-center flex flex-col items-center transition-all duration-300">
        
        {/* Branding */}
        <img src={logo} alt="Lucky Boba" className="h-16 w-auto object-contain mb-8" />
        
        <div className="space-y-4">
          <h1 className="text-3xl md:text-4xl font-black text-[#3b2063] uppercase tracking-tight leading-none">
            Oops! <br /> Something spilled.
          </h1>
          
          <p className="text-zinc-400 font-bold text-[10px] uppercase tracking-[0.2em]">
            Unexpected Application Error
          </p>
          
          <div className="py-4">
             <div className="h-1.5 w-12 bg-emerald-500 rounded-full mx-auto mb-6" />
             <p className="text-zinc-600 font-medium text-sm leading-relaxed">
               The system encountered a hiccup. Try refreshing the page or returning to the dashboard.
             </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 w-full">
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-4 bg-[#3b2063] text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-[#2a1747] transition-all active:scale-95 shadow-lg shadow-purple-100"
          >
            Refresh System
          </button>
          
          <button 
            onClick={() => window.location.href = '/dashboard'}
            className="w-full py-4 bg-white text-zinc-400 border border-zinc-100 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-zinc-50 transition-all active:scale-95"
          >
            Go to Dashboard
          </button>
        </div>

        <p className="mt-10 text-[9px] font-black uppercase tracking-[0.3em] text-zinc-300">
          Lucky Boba © 2026
        </p>
      </div>
    </div>
  );
};