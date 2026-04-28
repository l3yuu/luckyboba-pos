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
  const isCashier = user?.role === 'cashier';
  const { status, message, deviceId } = useDeviceCheck(isCashier);
  const [copied, setCopied] = useState(false);

  // If device becomes unregistered while logged in as cashier, force logout
  useEffect(() => {
    if (status === 'unregistered' && user && isCashier) {
      showToast(message || 'Device not registered or deactivated.', 'error');
      void logout();
    }
  }, [status, user, isCashier, logout, showToast, message]);



  // Non-cashier roles — pass through immediately
  if (!isCashier) return <>{children ?? <Outlet />}</>;

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
            className="w-full py-2 px-4 bg-[#6a12b8] text-white text-sm font-semibold rounded-lg hover:bg-[#2d1850] transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
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

        </div>
      </div>
    );
  }

  // ── Registered — render normally ──────────────────────────────────────────
  return <>{children ?? <Outlet />}</>;
}
