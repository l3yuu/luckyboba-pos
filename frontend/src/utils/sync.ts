// frontend/src/utils/sync.ts
/**
 * Triggers a synchronization event across all open POS/Dashboard tabs.
 * Uses both BroadcastChannel (modern) and localStorage (fallback) for maximum reliability.
 */
let syncChannel: BroadcastChannel | null = null;

export const triggerSync = () => {
  console.info("[Sync] 📡 Broadcasting menu-updated signal...");
  
  try {
    // 1. BroadcastChannel (fast, same browser/origin)
    if (!syncChannel) {
      syncChannel = new BroadcastChannel('pos-updates');
    }
    syncChannel.postMessage({ type: 'menu-updated', timestamp: Date.now() });
    
    // Note: We don't close immediately to ensure "postMessage" is processed.
    // The channel will stay open for the life of the tab or until next call.
  } catch (e) {
    console.warn("[Sync] BroadcastChannel failed:", e);
  }

  try {
    // 2. LocalStorage Event (robust fallback)
    // Toggling the value triggers a 'storage' event in all other tabs
    localStorage.setItem('lb-pos-sync-trigger', `sync-${Date.now()}`);
  } catch (e) {
    console.warn("[Sync] LocalStorage sync trigger failed:", e);
  }
};

// Global helper to allow manual triggering from console in SuperAdmin
if (typeof window !== 'undefined') {
  (window as any).triggerSync = triggerSync;
}
