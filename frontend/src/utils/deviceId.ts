export function getDeviceId(): string {
  // ── Step 1: Try localStorage ──────────────────────────────────────────────
  let id = localStorage.getItem('pos_device_id');

  // ── Step 2: Fall back to sessionStorage ──────────────────────────────────
  if (!id) id = sessionStorage.getItem('pos_device_id_backup');

  // ── Step 3: Fall back to cookie (survives localStorage clear) ────────────
  if (!id) {
    const match = document.cookie.match(/pos_device_id=([^;]+)/);
    if (match) id = match[1];
  }

  // ── Step 4: Generate new if ALL three are wiped ───────────────────────────
  if (!id) {
    id = 'DEV-' + crypto.randomUUID();
  }

  // ── Save to all three so they stay in sync ────────────────────────────────
  localStorage.setItem('pos_device_id', id);
  sessionStorage.setItem('pos_device_id_backup', id);
  document.cookie = `pos_device_id=${id}; max-age=31536000; path=/`; // 1 year

  return id;
}

export function setDeviceId(id: string): void {
  const clean = id.trim();
  localStorage.setItem('pos_device_id', clean);
  sessionStorage.setItem('pos_device_id_backup', clean);
  document.cookie = `pos_device_id=${clean}; max-age=31536000; path=/`;
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
  // NOTE: we intentionally do NOT clear pos_device_id_backup here
  // so the device identity survives logout
}