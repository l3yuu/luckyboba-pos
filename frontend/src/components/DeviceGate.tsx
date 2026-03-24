import { type ReactNode } from 'react';
import { useDeviceCheck } from '../hooks/useDeviceCheck';
import { useAuth } from '../hooks/useAuth';

interface Props {
  children: ReactNode;
}

export function DeviceGate({ children }: Props) {
  const { user } = useAuth();
  const isCashier = user?.role === 'cashier';

  // Only run device check for cashiers
  // All other roles (superadmin, branch_manager, team_leader, etc.) skip this
  const { status, message, deviceId } = useDeviceCheck(isCashier);

  // Non-cashier roles — pass through immediately
  if (!isCashier) {
    return <>{children}</>;
  }

  // ── Cashier: checking ─────────────────────────────────────────────────────
  if (status === 'checking') {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-4 border-[#3b2063] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-400">Verifying device...</p>
        </div>
      </div>
    );
  }

  // ── Cashier: unregistered ─────────────────────────────────────────────────
  if (status === 'unregistered') {
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

          <div className="bg-gray-50 rounded-lg p-3 text-left space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Your Device ID</p>
            <p className="text-xs font-mono text-gray-700 break-all">{deviceId}</p>
          </div>

          <p className="text-xs text-gray-400">
            Provide this Device ID to your administrator to register this terminal.
          </p>

          <button
            onClick={() => navigator.clipboard.writeText(deviceId)}
            className="w-full py-2 px-4 bg-[#3b2063] text-white text-sm rounded-lg hover:bg-[#2d1850] transition-colors"
          >
            Copy Device ID
          </button>
        </div>
      </div>
    );
  }

  // ── Cashier: registered — render normally ─────────────────────────────────
  return <>{children}</>;
}