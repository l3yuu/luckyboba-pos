/**
 * PWAUpdateBanner.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Shows a banner at the top of the screen when a new app version is available.
 * Place this in your root App.tsx so it appears everywhere.
 *
 * Usage:
 *   const { needsUpdate, applyUpdate } = useServiceWorker();
 *   <PWAUpdateBanner needsUpdate={needsUpdate} onUpdate={applyUpdate} />
 */

import React from 'react';
import { RefreshCw, Sparkles } from 'lucide-react';

interface Props {
  needsUpdate: boolean;
  onUpdate:    () => void;
}

const PWAUpdateBanner: React.FC<Props> = ({ needsUpdate, onUpdate }) => {
  if (!needsUpdate) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-999 w-full max-w-sm px-4">
      <div className="bg-[#a020f0] border border-[#2a1647] rounded-[0.625rem] shadow-2xl px-5 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center shrink-0">
            <Sparkles size={15} className="text-violet-300" />
          </div>
          <div>
            <p className="text-white text-xs font-bold uppercase tracking-widest leading-tight">
              Update Available
            </p>
            <p className="text-violet-300 text-[10px] font-medium mt-0.5">
              New version ready — tap to apply.
            </p>
          </div>
        </div>
        <button
          onClick={onUpdate}
          className="flex items-center gap-1.5 px-3 py-2 bg-white text-[#a020f0] text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-violet-50 transition-all active:scale-[0.97] shrink-0"
        >
          <RefreshCw size={11} />
          Update
        </button>
      </div>
    </div>
  );
};

export default PWAUpdateBanner;
