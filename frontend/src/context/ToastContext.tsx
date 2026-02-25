import { createContext, useContext } from 'react';
<<<<<<< HEAD
import type { ToastType } from '../components/Toast';

export interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

export const ToastContext = createContext<ToastContextType | null>(null);
=======

export interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'warning') => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);
>>>>>>> 1140a589a204efaaab9a4b990678e4abe1e61471

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};