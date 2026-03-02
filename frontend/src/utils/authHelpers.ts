// ─────────────────────────────────────────────────────────────────────────────
// authHelpers.ts
//
// Centralises all auth-related localStorage reads/writes so that Login,
// ProtectedRoute, and any other component all use the exact same keys.
// ─────────────────────────────────────────────────────────────────────────────

export type UserRole = 'superadmin' | 'admin' | 'manager' | 'cashier';

/** Where each role's dashboard lives */
export const ROLE_HOME: Record<UserRole, string> = {
  superadmin: '/super-admin',
  admin:      '/dashboard',
  manager:    '/branch-manager',
  cashier:    '/dashboard',
};

// ── Storage keys (single source of truth) ────────────────────────────────────
const KEYS = {
  token:         'auth_token',
  legacyToken:   'lucky_boba_token',
  altToken:      'token',
  authenticated: 'lucky_boba_authenticated',
  role:          'user_role',
  user:          'user',
} as const;

// ── Read helpers ──────────────────────────────────────────────────────────────

/**
 * Returns the auth token from storage, or null if not present.
 */
export function getToken(): string | null {
  return (
    localStorage.getItem(KEYS.token) ||
    localStorage.getItem(KEYS.legacyToken) ||
    localStorage.getItem(KEYS.altToken) ||
    null
  );
}

/**
 * Reads and normalises the stored role string into a typed UserRole.
 * Returns null if no role is stored or if the value is unrecognised.
 */
export function getStoredRole(): UserRole | null {
  const raw = localStorage.getItem(KEYS.role);
  if (!raw) return null;

  const n = raw.trim().toLowerCase();

  if (['superadmin', 'super_admin', 'super admin'].includes(n)) return 'superadmin';
  if (n === 'admin') return 'admin';
  if (['manager', 'branch_manager'].includes(n)) return 'manager';
  if (n === 'cashier') return 'cashier';

  return null;
}

/**
 * Returns true when a valid auth token is present in storage.
 */
export function isAuthenticated(): boolean {
  return !!getToken();
}

/**
 * Returns the home path for the currently stored role,
 * or '/login' when no valid role exists.
 */
export function getRoleHome(): string {
  const role = getStoredRole();
  return role ? ROLE_HOME[role] : '/login';
}

// ── Write helpers ─────────────────────────────────────────────────────────────

interface LoginResponse {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;   // raw string from the backend — we normalise it below
    [key: string]: unknown;
  };
}

/**
 * Persists auth data after a successful login API call, then
 * hard-navigates the user to their role's dashboard.
 *
 * Usage inside your Login page submit handler:
 *
 *   const data = await api.post('/auth/login', { email, password });
 *   handleLoginSuccess(data);
 */
export function handleLoginSuccess(data: LoginResponse): void {
  // Token
  localStorage.setItem(KEYS.token, data.token);
  localStorage.setItem(KEYS.authenticated, 'true');

  // Role — stored lowercase so getStoredRole() always matches
  localStorage.setItem(KEYS.role, data.user.role.trim().toLowerCase());

  // Full user object (useful for display in dashboards)
  localStorage.setItem(KEYS.user, JSON.stringify(data.user));

  // Navigate to the correct dashboard
  window.location.href = getRoleHome();
}

/**
 * Wipes every auth key from storage and sends the user back to /login.
 * Call this from your logout button / confirmLogout handler.
 *
 * Already matches the key list used in SuperAdminDashboard.tsx.
 */
export function handleLogout(): void {
  Object.values(KEYS).forEach(k => localStorage.removeItem(k));
  sessionStorage.clear();
  window.location.href = '/login';
}