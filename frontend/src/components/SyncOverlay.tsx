import React from 'react';
import { RefreshCw } from 'lucide-react';

interface SyncOverlayProps {
  onSync: () => Promise<void>;
}

/**
 * A non-dismissible overlay that blocks interaction until the POS data is synchronized.
 * Used when a menu version mismatch is detected.
 */
const SyncOverlay: React.FC<SyncOverlayProps> = ({ onSync }) => {
  const [syncing, setSyncing] = React.useState(false);

  // Block Escape key while overlay is visible
  React.useEffect(() => {
    const block = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };
    window.addEventListener('keydown', block, true);
    return () => window.removeEventListener('keydown', block, true);
  }, []);

  const handleSync = async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      await onSync();
    } catch {
      setSyncing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-zinc-900/60 backdrop-blur-sm"
      style={{ pointerEvents: 'auto' }}
    >
      <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center border border-zinc-100 flex flex-col items-center animate-in fade-in zoom-in duration-300">
        <div className={`w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6 shadow-inner ${syncing ? 'animate-spin' : ''}`}>
          <RefreshCw size={28} />
        </div>
        <h2 className="text-xl font-extrabold text-[#1a0f2e] mb-2 tracking-tight">
          Menu Update Available
        </h2>
        <p className="text-sm text-zinc-500 mb-8 font-medium">
          The menu has been updated by the administrator. You must synchronize the system to continue.
        </p>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="w-full bg-[#1a0f2e] hover:bg-violet-600 disabled:opacity-70 disabled:cursor-not-allowed text-white font-extrabold py-4 px-6 rounded-2xl shadow-lg shadow-violet-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 uppercase tracking-wide text-sm"
        >
          <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
          {syncing ? 'Syncing...' : 'Sync Now'}
        </button>
      </div>
    </div>
  );
};

export default SyncOverlay;
