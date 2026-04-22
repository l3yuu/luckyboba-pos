import logo from '../assets/logo.png';

export const AuthLoader = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f6ff]">
    <div className="relative flex flex-col items-center">
      <img
        src={logo}
        alt="Lucky Boba"
        className="h-16 w-auto object-contain animate-pulse mb-6 opacity-80"
      />
      <div className="w-12 h-12 border-4 border-zinc-200 border-t-[#a020f0] rounded-full animate-spin" />
      <p className="mt-6 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">
        Authenticating...
      </p>
    </div>
  </div>
);
