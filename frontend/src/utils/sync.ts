// frontend/src/utils/sync.ts
/**
 * Triggers a synchronization event across all open POS/Dashboard tabs.
 * Uses both BroadcastChannel (modern) and localStorage (fallback) for maximum reliability.
 */

// Use a unique name to avoid collisions
const SYNC_CHANNEL_NAME = 'lucky_boba_pos_sync_v1';
const SYNC_STORAGE_KEY = 'lb-pos-sync-trigger-v1';

let syncChannel: BroadcastChannel | null = null;

export const triggerSync = () => {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'unknown';
  console.info(`[Sync] 📡 Broadcasting menu-updated signal from ${origin}...`);
  
  try {
    if (!syncChannel) {
      syncChannel = new BroadcastChannel(SYNC_CHANNEL_NAME);
    }
    // Send both for maximum compatibility with different listener styles
    syncChannel.postMessage('menu-updated');
    syncChannel.postMessage({ type: 'menu-updated', timestamp: Date.now() });
  } catch (e) {
    console.warn("[Sync] BroadcastChannel failed:", e);
  }

  try {
    // LocalStorage fallback
    localStorage.setItem(SYNC_STORAGE_KEY, `sync-${Date.now()}`);
  } catch (e) {
    console.warn("[Sync] LocalStorage sync trigger failed:", e);
  }
};

declare global {
  interface Window {
    triggerSync?: () => void;
  }
}

if (typeof window !== 'undefined') {
  window.triggerSync = triggerSync;
}
