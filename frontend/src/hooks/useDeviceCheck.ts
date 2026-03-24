import { useState, useEffect, useRef } from 'react';
import { getDeviceId } from '../utils/deviceId';
import api from '../services/api';

type DeviceStatus = 'checking' | 'registered' | 'unregistered';

interface DeviceBranch {
  id:       number;
  name:     string;
  location: string;
}

interface ApiError {
  response?: { data?: { message?: string } };
}

export function useDeviceCheck(enabled: boolean = true) {
  const [status,    setStatus]    = useState<DeviceStatus>(
    enabled ? 'checking' : 'registered'  // skip check if not enabled
  );
  const [posNumber, setPosNumber] = useState('');
  const [branchId,  setBranchId]  = useState<number | null>(null);
  const [branch,    setBranch]    = useState<DeviceBranch | null>(null);
  const [message,   setMessage]   = useState('');
  const [deviceId]                = useState(() => getDeviceId());

  const hasFetched = useRef(false);

  useEffect(() => {
    // Skip if not a cashier or already fetched
    if (!enabled || hasFetched.current) return;
    hasFetched.current = true;

    void (async () => {
      try {
        const res = await api.post('/device/check', { device_name: deviceId });

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
        setMessage(error.response?.data?.message ?? 'Device check failed.');
        setStatus('unregistered');
      }
    })();
  }, [enabled, deviceId]);

  return { status, posNumber, branchId, branch, message, deviceId };
}