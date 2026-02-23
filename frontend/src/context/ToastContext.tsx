import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

type ToastType = 'success' | 'error';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
  exiting: boolean;
}

interface ToastContextType {
  showToast: (message: string, type: ToastType) => void;
}

export const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, exiting: false }]);

    // Begin exit animation at 2.7s, fully remove at 3.2s
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    }, 2700);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3200);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 400);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* ── Toast keyframes ── */}
      <style>{`
        @keyframes toast-in {
          0%   { transform: translateY(-120%); opacity: 0; }
          60%  { transform: translateY(6px);   opacity: 1; }
          100% { transform: translateY(0);     opacity: 1; }
        }
        @keyframes toast-out {
          0%   { transform: translateY(0);      opacity: 1; }
          100% { transform: translateY(-120%);  opacity: 0; }
        }
        @keyframes toast-progress {
          from { width: 100%; }
          to   { width: 0%; }
        }
        .toast-enter { animation: toast-in  0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .toast-exit  { animation: toast-out 0.4s ease-in forwards; }
      `}</style>

      {/* ── Toast container — top-center ── */}
      <div style={{
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '10px',
        pointerEvents: 'none',
        minWidth: '300px',
      }}>
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={toast.exiting ? 'toast-exit' : 'toast-enter'}
            style={{
              pointerEvents: 'all',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 18px',
              borderRadius: '12px',
              minWidth: '300px',
              maxWidth: '420px',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
              background: toast.type === 'success' ? '#f0fdf4' : '#fff1f2',
              border: `1.5px solid ${toast.type === 'success' ? '#86efac' : '#fca5a5'}`,
            }}
          >
            {/* Icon */}
            <span style={{ fontSize: '16px', flexShrink: 0 }}>
              {toast.type === 'success' ? '✅' : '🗑️'}
            </span>

            {/* Message */}
            <span style={{
              flex: 1,
              fontSize: '12px',
              fontWeight: 700,
              fontFamily: 'sans-serif',
              color: toast.type === 'success' ? '#15803d' : '#b91c1c',
            }}>
              {toast.message}
            </span>

            {/* Dismiss ✕ */}
            <button
              onClick={() => dismiss(toast.id)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#9ca3af',
                padding: '0 2px',
                flexShrink: 0,
                lineHeight: 1,
              }}
            >
              ✕
            </button>

            {/* Shrinking progress bar */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              height: '3px',
              borderRadius: '0 0 0 12px',
              background: toast.type === 'success' ? '#16a34a' : '#dc2626',
              animation: 'toast-progress 3s linear forwards',
            }} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};