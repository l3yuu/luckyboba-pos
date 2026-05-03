import { useState, useEffect, useRef } from 'react';
import { getDeviceIdAsync } from '../utils/deviceId';
import api from '../services/api';

type DeviceStatus = 'checking' | 'registered' | 'unregistered' | 'unauthorized';

interface DeviceBranch {
  id:       number;
  name:     string;
  location: string;
}

interface ApiError {
  response?: {
    status?: number;
    data?: { 
      message?: string;
      registered?: boolean;
      assigned?: boolean;
      pos_number?: string;
    };
  };
}

/**
 * useDeviceCheck Hook
 * 
 * Verifies if the current physical device is registered in the backend
 * and (optionally) if the provided userId is assigned to it.
 */
export function useDeviceCheck(enabled: boolean = true, userId?: number | null) {

  const [status, setStatus] = useState<DeviceStatus>(() => {
    if (!enabled) return 'registered';
    return 'checking';
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
    if (!enabled) {
      setStatus('registered');
      return;
    }

    // Reset to 'checking' on first mount (or when enabled/userId changes)
    setStatus('checking');

    const checkDevice = async () => {
      try {
        const id = await getDeviceIdAsync();
        setDeviceId(id);

        const res = await api.post('/devices/check', {
          device_name: id,
          user_id: userId ?? undefined,
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
        const data = error.response?.data;
        
        if (error.response?.status === 403) {
          setMessage(data?.message ?? 'Device deactivated.');
          
          if (data?.registered === true && data?.assigned === false) {
            if (data.pos_number) setPosNumber(data.pos_number);
            setStatus('unauthorized');
          } else {
            setStatus('unregistered');
          }
        } else {
          setMessage(data?.message ?? 'Device check failed.');
          setStatus('unregistered');
        }
      } finally {
        hasFetched.current = true;
      }
    };

    // Immediate check on mount or when enabled/userId changes
    checkDevice();

    // Periodic re-check every 15 seconds (single interval — no re-spawning)
    const interval = setInterval(checkDevice, 15000);
    return () => clearInterval(interval);

  // ⚠️ hasCompletedFirstCheck intentionally excluded: including it would
  // re-fire this effect (and spawn a new interval) after every single check.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, userId]);

  return { status, posNumber, branchId, branch, message, deviceId };
}