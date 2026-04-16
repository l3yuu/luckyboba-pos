import React, { useState, useCallback } from 'react';
import { ToastContext } from './ToastContext';
import { Toast, type ToastType } from '../components/Toast';

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<{ 
    message: string; 
    type: ToastType; 
    actionLabel?: string; 
    onAction?: () => void;
    duration?: number;
  } | null>(null);

  const showToast = useCallback((
    message: string, 
    type: 'success' | 'error' | 'warning' | 'info' = 'success',
    actionLabel?: string,
    onAction?: () => void,
    duration?: number
  ) => {
    console.log(`[ToastProvider] showToast: "${message}" (${type}) action: ${actionLabel || 'none'}`);
    setToast({ message, type: type as ToastType, actionLabel, onAction, duration });
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, dismissToast: hideToast }}>
      {children}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          actionLabel={toast.actionLabel}
          onAction={toast.onAction}
          duration={toast.duration}
          onClose={hideToast} 
        />
      )}
    </ToastContext.Provider>
  );
};
