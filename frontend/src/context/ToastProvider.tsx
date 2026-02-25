import React, { useState, useCallback } from 'react';
import { ToastContext } from './ToastContext';
import { Toast } from '../components/Toast';
<<<<<<< HEAD
import type { ToastType } from '../components/Toast';
=======
>>>>>>> 1140a589a204efaaab9a4b990678e4abe1e61471

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

<<<<<<< HEAD
  const showToast = useCallback((message: string, type: ToastType = 'success') => {
=======
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' = 'success') => {
>>>>>>> 1140a589a204efaaab9a4b990678e4abe1e61471
    setToast({ message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </ToastContext.Provider>
  );
};