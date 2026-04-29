import { useState, useEffect } from 'react';
import { useDeviceCheck } from '../hooks/useDeviceCheck';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { Outlet } from 'react-router-dom';

type Props = {
  children?: React.ReactNode;
};

/**
 * DeviceGate Component
 * 
 * Protects the application by verifying the physical device registration.
 * Cashiers are strictly gated (cannot bypass).
 * Admins can bypass for maintenance/setup.
 */
export function DeviceGate({ children }: Props) {
  const { user, logout, isLoading } = useAuth();
  const { showToast } = useToast();
  const [bypass, setBypass] = useState(false);
  const isKiosk = window.location.pathname.startsWith('/kiosk');
  const isPrivileged = user?.role === 'superadmin' || user?.role === 'super_admin' || user?.role === 'system_admin' || user?.role === 'it_admin';
  const isCashier = user?.role === 'cashier';
  
  // The gate only activates for logged-in cashiers.
  // Guests (on login page), Admins, and Kiosk users are NOT gated.
  const shouldCheck = !isLoading && !isKiosk && !!user && isCashier;

  const { status, message, deviceId, posNumber } = useDeviceCheck(shouldCheck, user?.id);
  const [copied, setCopied] = useState(false);

  // If device becomes unregistered while logged in as cashier, force logout.
  useEffect(() => {
    if (status === 'unregistered' && user && isCashier) {
      showToast(message || 'Device not registered or deactivated.', 'error');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBypass(false);
      void logout();
    }
  }, [status, user, isCashier, logout, showToast, message]);

  // ── Loading State ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-4 border-[#6a12b8] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-zinc-400">Initializing session...</p>
        </div>
      </div>
    );
  }

  // ── Error States (Priority Gating) ─────────────────────────────────────────
  // We check for hardware errors BEFORE checking the bypass status for cashiers.
  // This ensures that even with a 'bypass' flag, a cashier is blocked if their assignment is missing.
  if (!isPrivileged) {
    // 1. Unregistered / Deactivated
    if (status === 'unregistered') {
      const handleCopy = () => {
        if (!deviceId) return;
        navigator.clipboard.writeText(deviceId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      };

      return (
        <div className="h-screen flex items-center justify-center bg-gray-50 p-6">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Device Not Registered</h1>
              <p className="text-sm text-gray-500 mt-1">{message}</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-left space-y-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Your Device ID</p>
              {deviceId ? (
                <p className="text-xs font-mono text-gray-700 break-all select-all">{deviceId}</p>
              ) : (
                <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4" />
              )}
            </div>
            <p className="text-xs text-gray-400">
              Share this Device ID with your administrator to register and assign this terminal.
            </p>
            <button
              onClick={handleCopy}
              disabled={!deviceId}
              className="w-full py-2.5 px-4 bg-[#6a12b8] text-white text-sm font-bold rounded-xl hover:bg-[#2d1850] transition-all active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-2 shadow-sm"
            >
              {copied ? 'Copied!' : 'Copy Device ID'}
            </button>
            <div className="pt-2">
              <button
                onClick={() => setBypass(true)}
                className="text-[10px] font-bold text-gray-400 hover:text-[#6a12b8] transition-colors uppercase tracking-widest"
              >
                Administrator Login
              </button>
            </div>
          </div>
        </div>
      );
    }

    // 2. Authorized Device but User Not Assigned
    if (status === 'unauthorized') {
      return (
        <div className="h-screen flex items-center justify-center bg-gray-50 p-6">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center space-y-5">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M12 15v2m0 0v2m0-2h2m-2 0H10m4-6a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Device Authorized</h1>
              <p className="text-sm text-gray-500 mt-2">
                This device is registered as <span className="font-bold text-gray-700">{posNumber || 'a known terminal'}</span> but your account is not assigned to it.
              </p>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-left">
              <p className="text-xs text-amber-800 font-medium leading-relaxed">
                {message || "You don't have permission to use this specific terminal. Please contact your manager to assign your account to this POS."}
              </p>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full py-3 px-4 bg-[#6a12b8] text-white text-sm font-bold rounded-xl hover:bg-[#2d1850] transition-all"
              >
                Retry Connection
              </button>
              <button
                onClick={() => logout()}
                className="w-full py-3 px-4 bg-white border border-gray-200 text-gray-600 text-sm font-bold rounded-xl hover:bg-gray-50 transition-all"
              >
                Switch Account / Logout
              </button>
              <button
                onClick={() => setBypass(true)}
                className="w-full py-3 px-4 bg-gray-50 text-gray-400 text-[10px] font-bold rounded-xl hover:bg-gray-100 transition-all uppercase tracking-widest"
              >
                Administrator Login
              </button>
            </div>
          </div>
        </div>
      );
    }
  }

  // ── Success States ────────────────────────────────────────────────────────
  // Privileged roles or explicit bypass (non-cashiers only)
  if (isPrivileged || (bypass && !isCashier)) return <>{children ?? <Outlet />}</>;

  // ── Checking ──────────────────────────────────────────────────────────────
  if (status === 'checking') {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-4 border-[#6a12b8] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-400">Verifying device...</p>
        </div>
      </div>
    );
  }

  // ── Registered ───────────────────────────────────────────────────────────
  return <>{children ?? <Outlet />}</>;
}
