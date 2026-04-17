/**
 * OfflineQueueBanner.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Shows a sticky banner when there are unsynced sales in the offline queue.
 * Place this inside the main layout so it appears on every cashier page.
 *
 * Props come directly from useOfflineQueue().
 */

import React from 'react';
import { WifiOff, RefreshCw, RefreshCcw, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { type OfflineQueueState } from '../../../hooks/useOfflineQueue';

interface Props extends Pick<OfflineQueueState, 'queue' | 'queueCount' | 'isSyncing' | 'syncNow' | 'remove' | 'resetAttempts'> {
  isOnline: boolean;
}

const OfflineQueueBanner: React.FC<Props> = ({
  queue, queueCount, isSyncing, syncNow, remove, resetAttempts, isOnline,
}) => {
  const [expanded, setExpanded] = React.useState(false);

  // Nothing to show
  if (queueCount === 0 && isOnline) return null;

  const deadItems    = queue.filter(q => q.attempts >= 5);

  return (
    <div className="w-full z-30">

      {/* ── Main banner ── */}
      <div className={`flex items-center justify-between px-5 py-3 border-b text-sm font-semibold
        ${!isOnline
          ? 'bg-zinc-800 border-zinc-700 text-white'
          : queueCount > 0
            ? 'bg-amber-50 border-amber-200 text-amber-800'
            : 'bg-emerald-50 border-emerald-200 text-emerald-700'
        }`}>

        <div className="flex items-center gap-2.5">
          {!isOnline ? (
            <WifiOff size={15} className="shrink-0" />
          ) : queueCount > 0 ? (
            <AlertTriangle size={15} className="shrink-0 text-amber-600" />
          ) : (
            <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
          )}

          <span>
            {!isOnline && queueCount === 0 && 'No internet connection. Orders will work using cached menu.'}
            {!isOnline && queueCount > 0  && `Offline — ${queueCount} order${queueCount > 1 ? 's' : ''} queued, will sync when connected.`}
            {isOnline  && queueCount > 0  && `${queueCount} order${queueCount > 1 ? 's' : ''} pending sync to server.`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isOnline && queueCount > 0 && (
            <button
              onClick={syncNow}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#3b2063] hover:bg-[#6a12b8] text-white text-[10px] font-bold uppercase tracking-widest rounded-lg disabled:opacity-50 transition-all"
            >
              <RefreshCw size={11} className={isSyncing ? 'animate-spin' : ''} />
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </button>
          )}

          {queueCount > 0 && (
            <button
              onClick={() => setExpanded(p => !p)}
              className="text-[10px] font-bold uppercase tracking-widest underline underline-offset-2 opacity-70 hover:opacity-100"
            >
              {expanded ? 'Hide' : 'Details'}
            </button>
          )}
        </div>
      </div>

      {/* ── Expanded detail list ── */}
      {expanded && queueCount > 0 && (
        <div className="bg-white border-b border-amber-200 divide-y divide-zinc-100 max-h-52 overflow-y-auto">
          {queue.map(item => {
            const isDead    = item.attempts >= 5;
            const hasFailed = item.attempts > 0 && !isDead;
            return (
              <div key={item.id} className={`flex items-start justify-between px-5 py-3 gap-3 text-xs ${isDead ? 'bg-red-50' : ''}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold uppercase tracking-widest text-[10px] px-1.5 py-0.5 rounded
                      ${isDead    ? 'bg-red-100 text-red-700'
                      : hasFailed ? 'bg-amber-100 text-amber-700'
                      :             'bg-zinc-100 text-zinc-500'}`}>
                      {isDead ? 'Failed' : hasFailed ? `Attempt ${item.attempts}` : 'Queued'}
                    </span>
                    <span className="text-zinc-500 font-medium">
                      Queued at {new Date(item.queuedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {item.lastError && (
                    <p className="text-red-500 font-medium mt-0.5 truncate">{item.lastError}</p>
                  )}
                </div>
                {isDead && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => { resetAttempts(item.id); setTimeout(syncNow, 100); }}
                      className="text-zinc-400 hover:text-blue-500 transition-colors"
                      title="Retry this order"
                    >
                      <RefreshCcw size={14} />
                    </button>
                    <button
                      onClick={() => remove(item.id)}
                      className="text-zinc-400 hover:text-red-500 transition-colors"
                      title="Remove from queue"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {deadItems.length > 0 && (
            <div className="px-5 py-2 bg-red-50 text-[10px] font-semibold text-red-600 uppercase tracking-widest">
              {deadItems.length} order{deadItems.length > 1 ? 's' : ''} failed after 5 attempts — please record manually and remove.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OfflineQueueBanner;