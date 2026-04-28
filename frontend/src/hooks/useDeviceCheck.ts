import { useState, useEffect, useRef } from 'react';
import { getDeviceIdAsync } from '../utils/deviceId';
import api from '../services/api';

type DeviceStatus = 'checking' | 'registered' | 'unregistered';

interface DeviceBranch {
  id:       number;
  name:     string;
  location: string;
}

interface ApiError {
  response?: {
    status?: number;
    data?: { message?: string };
  };
}

export function useDeviceCheck(enabled: boolean = true) {
  const [status, setStatus] = useState<DeviceStatus>(() => {
    if (!enabled) return 'registered';
    const has = sessionStorage.getItem('pos_number') && sessionStorage.getItem('branch_id');
    return has ? 'registered' : 'checking';
  });

  const [posNumber, setPosNumber] = useState<string>(() =>
    sessionStorage.getItem('pos_number') ?? ''
  );

  const [branchId, setBranchId] = useState<number | null>(() => {
    const id = sessionStorage.getItem('branch_id');
    return id ? parseInt(id) : null;
  });

  const [branch,   setBranch]  = useState<DeviceBranch | null>(null);
  const [message,  setMessage] = useState('');
  const [deviceId, setDeviceId] = useState('');

  const hasFetched = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const checkDevice = async () => {
      try {
        const id = await getDeviceIdAsync();
        setDeviceId(id);

        const storedUserId = localStorage.getItem('lucky_boba_user_id');

        const res = await api.post('/devices/check', {
          device_name: id,
          user_id: storedUserId ? parseInt(storedUserId) : undefined,
        });

        if (res.data.success) {
          sessionStorage.setItem('pos_number', res.data.pos_number);
          sessionStorage.setItem('branch_id',  String(res.data.branch_id));
          setPosNumber(res.data.pos_number);
          setBranchId(res.data.branch_id);
          setBranch(res.data.branch);
          setStatus('registered');
        } else {
          setMessage(res.data.message ?? 'Device not registered.');
          setStatus('unregistered');
        }
      } catch (err: unknown) {
        const error = err as ApiError;
        // If it's a 403 Forbidden, it means the device is inactive or unauthorized
        if (error.response?.status === 403) {
          setMessage(error.response?.data?.message ?? 'Device deactivated.');
          setStatus('unregistered');
        } else if (status !== 'registered') {
          // Only show error message for non-403 if we're not already registered
          setMessage(error.response?.data?.message ?? 'Device check failed.');
          setStatus('unregistered');
        }
      } finally {
        hasFetched.current = true;
      }
    };

    // Initial check if not already fetched
    if (!hasFetched.current) {
      checkDevice();
    }

    // Periodic check every 15 seconds
    const interval = setInterval(checkDevice, 15000);
    return () => clearInterval(interval);

  }, [enabled, status]);

  return { status, posNumber, branchId, branch, message, deviceId };
}