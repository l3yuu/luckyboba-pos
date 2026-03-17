/**
 * useOfflineQueue.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Manages a localStorage-backed queue of failed sales.
 * On reconnect, automatically retries all queued orders against the API.
 *
 * Usage:
 *   const { enqueue, queueCount, isSyncing } = useOfflineQueue();
 *
 *   // In your submit handler, on API failure:
 *   enqueue(orderData);
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface QueuedSale {
  id:         string;   // local UUID
  payload:    unknown;  // the exact body sent to POST /api/sales
  queuedAt:   string;   // ISO timestamp when it was queued
  attempts:   number;   // how many sync attempts have been made
  lastError?: string;   // last error message for display
}

export interface OfflineQueueState {
  /** Add a failed sale to the queue */
  enqueue:    (payload: unknown) => void;
  /** Current number of queued (unsynced) sales */
  queueCount: number;
  /** True while a sync attempt is in progress */
  isSyncing:  boolean;
  /** All queued items (for display in UI) */
  queue:      QueuedSale[];
  /** Manually trigger a sync attempt */
  syncNow:    () => void;
  /** Remove a specific item from the queue (e.g. after manual resolution) */
  remove:     (id: string) => void;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STORAGE_KEY  = 'lucky_boba_offline_queue';
const MAX_ATTEMPTS = 5;

// ── Helpers ───────────────────────────────────────────────────────────────────

function loadQueue(): QueuedSale[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveQueue(queue: QueuedSale[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch {
    // localStorage full — fail silently
  }
}

function uuid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useOfflineQueue(): OfflineQueueState {
  const [queue,     setQueue]     = useState<QueuedSale[]>(loadQueue);
  const [isSyncing, setIsSyncing] = useState(false);
  const isSyncingRef              = useRef(false);

  // Keep localStorage in sync whenever queue state changes
  useEffect(() => {
    saveQueue(queue);
  }, [queue]);

  // ── Enqueue ─────────────────────────────────────────────────────────────────
  const enqueue = useCallback((payload: unknown) => {
    const item: QueuedSale = {
      id:       uuid(),
      payload,
      queuedAt: new Date().toISOString(),
      attempts: 0,
    };
    setQueue(prev => {
      const next = [...prev, item];
      saveQueue(next);
      return next;
    });
  }, []);

  // ── Remove ──────────────────────────────────────────────────────────────────
  const remove = useCallback((id: string) => {
    setQueue(prev => {
      const next = prev.filter(item => item.id !== id);
      saveQueue(next);
      return next;
    });
  }, []);

  // ── Sync ────────────────────────────────────────────────────────────────────
  const syncNow = useCallback(async () => {
    if (isSyncingRef.current || !navigator.onLine) return;

    const current = loadQueue();
    if (current.length === 0) return;

    isSyncingRef.current = true;
    setIsSyncing(true);

    let updated = [...current];

    for (const item of current) {
      if (item.attempts >= MAX_ATTEMPTS) continue;

      try {
        await api.post('/sales', item.payload);
        // Success — remove from queue
        updated = updated.filter(q => q.id !== item.id);
} catch (err) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 422) {
          // Unrecoverable — bad payload, drop it instead of retrying
          updated = updated.filter(q => q.id !== item.id);
          console.warn('Dropped invalid queued order (422):', item.id);
          continue;
        }
        const message = err instanceof Error ? err.message : 'Unknown error';
        updated = updated.map(q =>
          q.id === item.id
            ? { ...q, attempts: q.attempts + 1, lastError: message }
            : q
        );
      }
    }

    saveQueue(updated);
    setQueue(updated);
    isSyncingRef.current = false;
    setIsSyncing(false);
  }, []);

  // ── Auto-sync on reconnect ──────────────────────────────────────────────────
  useEffect(() => {
    const handleOnline = () => {
      // Small delay — let the connection stabilise before hitting the API
      setTimeout(syncNow, 2000);
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [syncNow]);

  // ── Retry on mount (in case app was refreshed while offline items remain) ───
  useEffect(() => {
    if (navigator.onLine && loadQueue().length > 0) {
      setTimeout(syncNow, 3000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    enqueue,
    queueCount: queue.length,
    isSyncing,
    queue,
    syncNow,
    remove,
  };
}