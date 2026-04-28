import { useState, useEffect } from 'react';
import { useDeviceCheck } from '../hooks/useDeviceCheck';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { Outlet } from 'react-router-dom';


type Props = {
  children?: React.ReactNode; // ← make optional
};

export function DeviceGate({ children }: Props) {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const [bypass, setBypass] = useState(false);

  // We should check the device if:
  // 1. We are logged in as a cashier (ongoing session protection)
  // 2. OR we are NOT logged in yet (to prevent unauthorized logins on POS terminals)
  // 3. AND we are not a SuperAdmin (who needs to access the dashboard from anywhere)
  const isPrivileged = user?.role === 'superadmin' || user?.role === 'system_admin' || user?.role === 'it_admin';
  const isCashier = user?.role === 'cashier';
  const shouldCheck = !isPrivileged && !bypass;

  const { status, message, deviceId } = useDeviceCheck(shouldCheck);
  const [copied, setCopied] = useState(false);

  // If device becomes unregistered while logged in as cashier, force logout
  useEffect(() => {
    if (status === 'unregistered' && user && isCashier) {
      showToast(message || 'Device not registered or deactivated.', 'error');
      void logout();
    }
  }, [status, user, isCashier, logout, showToast, message]);

  // Privileged roles or explicit bypass — pass through to children
  if (isPrivileged || bypass) return <>{children ?? <Outlet />}</>;


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

  // ── Unregistered ──────────────────────────────────────────────────────────
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

          {/* Device ID box */}
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
            {copied ? (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-4 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy Device ID
              </>
            )}
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

  // ── Registered — render normally ──────────────────────────────────────────
  return <>{children ?? <Outlet />}</>;
}
