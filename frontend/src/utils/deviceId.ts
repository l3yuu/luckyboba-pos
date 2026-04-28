const STORAGE_KEY   = 'pos_device_id';
const SESSION_KEY   = 'pos_device_id_backup';
const COOKIE_NAME   = 'pos_device_id';
const COOKIE_MAXAGE = 60 * 60 * 24 * 365; // 1 year

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
  return navigator.userAgent.replace(/\d+\.[\d\.]+/g, '');
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
  return [
    getStableUserAgent(),
    navigator.language,
    navigator.languages?.join(',') ?? '',
    String(navigator.hardwareConcurrency ?? ''),
    String((navigator as unknown as { deviceMemory?: number }).deviceMemory ?? ''),
    String(screen.width),
    String(screen.height),
    String(screen.colorDepth),
    String(screen.pixelDepth),
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    canvasFingerprint(),
    getWebglRenderer(), // Added GPU identification
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
function readFromStorage(): string | null {
  return (
    localStorage.getItem(STORAGE_KEY) ??
    sessionStorage.getItem(SESSION_KEY) ??
    (document.cookie.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))?.[1] ?? null)
  );
}

function writeToStorage(id: string): void {
  try { localStorage.setItem(STORAGE_KEY, id); }   catch { /* private mode */ }
  try { sessionStorage.setItem(SESSION_KEY, id); } catch { /* private mode */ }
  document.cookie = `${COOKIE_NAME}=${id}; max-age=${COOKIE_MAXAGE}; path=/; SameSite=Lax`;
}

// ── Public API ────────────────────────────────────────────────────────────────

// Returns the device ID synchronously from cache if available,
// otherwise kicks off async derivation and returns a temp placeholder.
// Use getDeviceIdAsync() when you need the guaranteed final value.
let _cachedId: string | null = readFromStorage();

export function getDeviceId(): string {
  if (_cachedId) return _cachedId;

  // Not in storage — derive async and cache for next call
  void deriveId().then(id => {
    _cachedId = id;
    writeToStorage(id);
  });

  // Return a temporary empty string; callers should prefer getDeviceIdAsync
  return '';
}

// Preferred: always returns the real ID, even after a full site data clear
export async function getDeviceIdAsync(): Promise<string> {
  if (_cachedId) return _cachedId;

  const stored = readFromStorage();
  if (stored) {
    _cachedId = stored;
    return stored;
  }

  // Storage was wiped — re-derive from hardware (same machine = same ID)
  const derived = await deriveId();
  _cachedId = derived;
  writeToStorage(derived);
  return derived;
}

export function setDeviceId(id: string): void {
  const clean = id.trim();
  _cachedId   = clean;
  writeToStorage(clean);
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