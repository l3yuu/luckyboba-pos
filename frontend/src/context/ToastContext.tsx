"use client"
import { createContext, useContext } from 'react';

export interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'warning') => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Moving the hook here is fine because this file doesn't export a React Component
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};