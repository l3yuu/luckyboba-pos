<<<<<<< HEAD
import React, { useState, useCallback } from 'react';
import { ToastContext } from './ToastContext';
// 👇 FIXED: Changed 'toast' to 'Toast'
=======
"use client"
import React, { useState, useCallback } from 'react';
import { ToastContext } from './ToastContext';
>>>>>>> origin/main
import { Toast } from '../components/Toast';

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' = 'success') => {
<<<<<<< HEAD
    console.log('Toast called:', { message, type });
=======
>>>>>>> origin/main
    setToast({ message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
<<<<<<< HEAD
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
=======
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={hideToast} 
        />
      )}
>>>>>>> origin/main
    </ToastContext.Provider>
  );
};