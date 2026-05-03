declare global {
  interface Window {
    NATIVE_ID?: string;
    process?: {
      env?: {
        NATIVE_ID?: string;
      };
    };
  }
}

const STORAGE_KEY   = 'pos_device_id';
const SESSION_KEY   = 'pos_device_id_backup';
const COOKIE_NAME   = 'pos_device_id';
const COOKIE_MAXAGE = 60 * 60 * 24 * 365; // 1 year

// ── MOZILLA HANDSHAKE CAPTURE ──
// We check for the HWID in the URL immediately upon script load.
// This ensures we catch it even if the React Router redirects the page.
(function captureUrlHwid() {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const hwid = params.get('hwid');
    if (hwid && hwid.startsWith('WIN-')) {
      console.log(`[HardwareBridge] Captured ID from URL: ${hwid}`);
      localStorage.setItem(STORAGE_KEY, hwid);
      // Clean up the URL
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, '', newUrl);
    }
  }
})();

// ── WebGL Fingerprint (GPU Information) ────────────────────────────────────────
function getWebglRenderer(): string {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null);
    if (!gl) return 'no-webgl';
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return 'no-webgl-debug';
    return String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL));
  } catch {
    return 'webgl-err';
  }
}

// ── Stable User Agent (Strips versions) ────────────────────────────────────────
function getStableUserAgent(): string {
  // Removes version numbers (e.g. Chrome/124.0.0.0 -> Chrome/)
  // This ensures the ID survives browser updates.
  return navigator.userAgent.replace(/\d+[\d.]+/g, '');
}

// ── Canvas fingerprint (GPU/driver-derived) ───────────────────────────────────
function canvasFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    const ctx    = canvas.getContext('2d');
    if (!ctx) return 'no-canvas';
    ctx.textBaseline = 'top';
    ctx.font         = '14px "Arial"';
    ctx.fillStyle    = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle    = '#069';
    ctx.fillText('Lucky Boba POS 🧋', 2, 15);
    ctx.fillStyle    = 'rgba(102,204,0,0.7)';
    ctx.fillText('Lucky Boba POS 🧋', 4, 17);
    return canvas.toDataURL().slice(-80);
  } catch {
    return 'canvas-err';
  }
}

// ── Hardware signal collection ────────────────────────────────────────────────
function collectSignals(): string {
  const w = screen.width;
  const h = screen.height;
  const maxDim = Math.max(w, h);
  const minDim = Math.min(w, h);

  return [
    getStableUserAgent(),
    navigator.language,
    navigator.languages?.join(',') ?? '',
    String(navigator.hardwareConcurrency ?? ''),
    String((navigator as unknown as { deviceMemory?: number }).deviceMemory ?? ''),
    String(maxDim), // Backward-compatible with Width in Landscape
    String(minDim), // Backward-compatible with Height in Landscape
    String(screen.colorDepth),
    String(screen.pixelDepth),
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    canvasFingerprint(),
    getWebglRenderer(), 
  ].join('||');
}


// ── SHA-256 → deterministic hex ID ───────────────────────────────────────────
async function deriveId(): Promise<string> {
  const signals = collectSignals();
  const buffer  = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(signals)
  );
  const hex = Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  // Format: DEV-XXXXXXXX-XXXX-XXXXXXXXXXXX (easy to read in admin UI)
  return `DEV-${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 24)}`.toUpperCase();
}

// ── Storage helpers ───────────────────────────────────────────────────────────

/**
 * Sync read from standard vaults.
 */
function readFromStorage(): string | null {
  return (
    localStorage.getItem(STORAGE_KEY) ??
    sessionStorage.getItem(SESSION_KEY) ??
    (document.cookie.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))?.[1] ?? null)
  );
}

/**
 * Async read from ALL vaults including Cache API (survives basic site data clear).
 */
async function readFromStorageAsync(): Promise<string | null> {
  // 1. Try standard vaults first
  const standard = readFromStorage();
  if (standard) return standard;

  // 2. Try Cache API vault (The "Deep Vault")
  try {
    const cache = await caches.open('pos-metadata');
    const response = await cache.match('/device-id');
    if (response) {
      const id = await response.text();
      // Restore standard vaults from deep vault
      if (id) writeToStorage(id);
      return id;
    }
  } catch {
    // ignore
  }

  return null;
}

async function writeToStorage(id: string): Promise<void> {
  // 1. Standard Vaults
  try { localStorage.setItem(STORAGE_KEY, id); }   catch { /* private mode */ }
  try { sessionStorage.setItem(SESSION_KEY, id); } catch { /* private mode */ }
  document.cookie = `${COOKIE_NAME}=${id}; max-age=${COOKIE_MAXAGE}; path=/; SameSite=Lax`;

  // 2. Deep Vault (Cache API) - Harder to clear
  try {
    const cache = await caches.open('pos-metadata');
    await cache.put('/device-id', new Response(id));
  } catch {
    // ignore
  }

  // 3. Request Storage Persistence (Prevents browser from auto-clearing data)
  if (navigator.storage && navigator.storage.persist) {
    void navigator.storage.persist().catch(() => {});
  }
}

// ── Hardware Bridge Service (Chrome Mode) ────────────────────────────────────
let _isBridgeChecking = false;
let _lastBridgeAttempt = 0;

// Fetches the hardware ID from the local companion service running on port 9876.
// This allows Chrome (with full print preview) to access native hardware info.
async function fetchFromHardwareBridge(): Promise<string | null> {
  // Prevent spamming the bridge if we just tried recently
  const now = Date.now();
  if (_isBridgeChecking || (now - _lastBridgeAttempt < 5000)) return null;
  
  _isBridgeChecking = true;
  _lastBridgeAttempt = now;

  const endpoints = ['http://127.0.0.1:9876/hardware-id', 'http://localhost:9876/hardware-id'];
  
  let fetchFailed = false;
  for (const url of endpoints) {
    try {
      console.log(`[HardwareBridge] Attempting to fetch from ${url}...`);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 1000);
      
      const res = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        signal: controller.signal,
      });
      
      clearTimeout(timeout);
      
      if (res.ok) {
        const data = await res.json();
        if (data?.id) {
          console.log(`[HardwareBridge] SUCCESS! Found ID: ${data.id}`);
          _isBridgeChecking = false;
          return data.id;
        }
      }
    } catch (err) {
      console.warn(`[HardwareBridge] Failed to connect to ${url}:`, err);
      fetchFailed = true;
    }
  }

  // ── MOZILLA FALLBACK: Handshake Redirect ──
  // If fetch failed (likely due to Mixed Content in Firefox), and we are on an HTTPS site,
  // we trigger a top-level redirect to the handshake endpoint.
  if (fetchFailed && window.location.protocol === 'https:') {
    const lastRedirect = localStorage.getItem('last_hw_handshake');
    const oneMinuteAgo = Date.now() - 60000;
    
    if (!lastRedirect || parseInt(lastRedirect) < oneMinuteAgo) {
      console.log('[HardwareBridge] Fetch blocked. Triggering Handshake Redirect for Mozilla...');
      localStorage.setItem('last_hw_handshake', Date.now().toString());
      
      const returnUrl = window.location.href;
      window.location.href = `http://localhost:9876/handshake?return=${encodeURIComponent(returnUrl)}`;
      // This will halt execution and redirect back with ?hwid=...
    }
  }

  _isBridgeChecking = false;
  return null;
}

// ── Public API ────────────────────────────────────────────────────────────────

// Returns the device ID synchronously from cache if available,
// otherwise kicks off async derivation and returns a temp placeholder.
// Use getDeviceIdAsync() when you need the guaranteed final value.
let _cachedId: string | null = readFromStorage();

export function getDeviceId(): string {
  if (_cachedId) return _cachedId;

  // Not in storage — derive async and cache for next call
  void deriveId().then(async (id) => {
    // If a bridge ID was found while we were deriving, don't overwrite it
    if (_cachedId?.startsWith('WIN-')) return;
    _cachedId = id;
    await writeToStorage(id);
  });

  // Return a temporary empty string; callers should prefer getDeviceIdAsync
  return '';
}

// Preferred: always returns the real ID, even after a full site data clear
export async function getDeviceIdAsync(): Promise<string> {
  // ── 0a. Electron Shell Support ─────────────────────────────────────────────
  const nativeId = window.NATIVE_ID || window.process?.env?.NATIVE_ID;
  if (nativeId) {
    console.log('[DeviceId] Using native ID from Electron shell');
    _cachedId = nativeId;
    return nativeId;
  }

  // ── 0b. Hardware Bridge Support (Chrome/Firefox Mode) ──────────────────────
  // We check the bridge EVERY time until we have a 'WIN-' ID.
  if (!_cachedId || !_cachedId.startsWith('WIN-')) {
    const bridgeId = await fetchFromHardwareBridge();
    if (bridgeId) {
      _cachedId = bridgeId;
      await writeToStorage(bridgeId);
      return bridgeId;
    }
  }

  if (_cachedId) return _cachedId;

  // Fallback to storage or derivation
  const stored = await readFromStorageAsync();
  if (stored) {
    _cachedId = stored;
    // One last ditch effort if we loaded a fallback
    if (!stored.startsWith('WIN-')) {
      const bridgeId = await fetchFromHardwareBridge();
      if (bridgeId) {
        _cachedId = bridgeId;
        await writeToStorage(bridgeId);
        return bridgeId;
      }
    }
    return stored;
  }

  const derived = await deriveId();
  _cachedId = derived;
  await writeToStorage(derived);
  return derived;
}

export function setDeviceId(id: string): void {
  const clean = id.trim();
  _cachedId   = clean;
  void writeToStorage(clean);
}

export function getPosNumber(): string {
  return sessionStorage.getItem('pos_number') ?? '';
}

export function getDeviceBranchId(): string {
  return sessionStorage.getItem('branch_id') ?? '';
}

export function clearDeviceSession(): void {
  sessionStorage.removeItem('pos_number');
  sessionStorage.removeItem('branch_id');
  // Intentionally NOT clearing device ID — survives logout
}