import React, { useEffect, useState } from 'react';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'error' | 'success' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
  position?: 'top-right' | 'top-center' | 'bottom-right';
  showProgress?: boolean;
  actionLabel?: string;
  onAction?: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'error',
  duration = 3000,
  onClose,
  actionLabel,
  onAction,
}) => {
  const [exiting, setExiting] = useState(false);

  const handleClose = () => {
    setExiting(true);
    setTimeout(onClose, 260);
  };

  useEffect(() => {
    const timer = setTimeout(handleClose, duration);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration]);

  const config: Record<ToastType, {
    label: string;
    icon: React.ReactElement;
    iconBg: string;
    iconColor: string;
    dot: string;
    accent: string;
  }> = {
    error: {
      label: 'System Error',
      icon: <AlertCircle size={16} strokeWidth={2.5} />,
      iconBg: '#fef2f2',
      iconColor: '#ef4444',
      dot: '#ef4444',
      accent: '#fca5a5',
    },
    success: {
      label: 'Success',
      icon: <CheckCircle2 size={16} strokeWidth={2.5} />,
      iconBg: '#f0fdf4',
      iconColor: '#22c55e',
      dot: '#22c55e',
      accent: '#86efac',
    },
    warning: {
      label: 'Notification',
      icon: <Info size={16} strokeWidth={2.5} />,
      iconBg: '#f5f3ff',
      iconColor: '#3b2063',
      dot: '#7c3aed',
      accent: '#c4b5fd',
    },
    info: {
      label: 'Info',
      icon: <Info size={16} strokeWidth={2.5} />,
      iconBg: '#eff6ff',
      iconColor: '#3b82f6',
      dot: '#3b82f6',
      accent: '#93c5fd',
    },
  };

  const c = config[type];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');

        @keyframes toast-in {
          from { opacity: 0; transform: translateY(-12px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
        @keyframes toast-out {
          from { opacity: 1; transform: translateY(0)    scale(1); }
          to   { opacity: 0; transform: translateY(-8px) scale(0.97); }
        }
        @keyframes toast-dot {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.35; }
        }
        @keyframes toast-progress {
          from { width: 100%; }
          to   { width: 0%; }
        }

        .lb-toast-wrap {
          position: fixed;
          top: 1.5rem;
          right: 1.5rem;
          z-index: 9999;
          font-family: 'DM Sans', sans-serif;
          animation: ${exiting ? 'toast-out 0.26s ease forwards' : 'toast-in 0.3s cubic-bezier(0.22,1,0.36,1) forwards'};
        }

        .lb-toast {
          display: flex;
          flex-direction: column;
          background: #ffffff;
          border: 1px solid #e4e4e7;
          border-radius: 0.75rem;
          box-shadow: 0 8px 32px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.06);
          min-width: 320px;
          max-width: 380px;
          overflow: hidden;
          position: relative;
        }

        /* left accent bar */
        .lb-toast-bar {
          width: 3px;
          align-self: stretch;
          flex-shrink: 0;
          background: ${c.dot};
          border-radius: 4px 0 0 4px;
        }

        .lb-toast-inner {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          padding: 0.9rem 0.75rem 0.9rem 1rem;
          flex: 1;
        }

        /* icon box */
        .lb-toast-icon {
          width: 36px; height: 36px;
          border-radius: 0.5rem;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          background: ${c.iconBg};
          color: ${c.iconColor};
        }

        /* text */
        .lb-toast-text { flex: 1; min-width: 0; }

        .lb-toast-label {
          font-size: 0.58rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #a1a1aa;
          margin-bottom: 3px;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .lb-toast-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: ${c.dot};
          flex-shrink: 0;
          animation: toast-dot 1.8s infinite;
        }

        .lb-toast-msg {
          font-size: 0.8rem;
          font-weight: 600;
          color: #1a0f2e;
          line-height: 1.4;
        }

        /* close */
        .lb-toast-close {
          background: none;
          border: none;
          cursor: pointer;
          color: #d4d4d8;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.5rem;
          margin-right: 0.5rem;
          border-radius: 0.5rem;
          transition: color 0.15s, background 0.15s;
          flex-shrink: 0;
          align-self: center;
        }
        .lb-toast-close:hover {
          color: #71717a;
          background: #f4f4f5;
        }

        /* progress bar */
        .lb-toast-progress {
          position: absolute;
          bottom: 0; left: 0;
          height: 2px;
          background: ${c.accent};
          border-radius: 0 0 0.75rem 0.75rem;
          animation: toast-progress ${duration}ms linear forwards;
        }

        /* action button area */
        .lb-toast-action {
          padding: 0 0.75rem 0.9rem 3.125rem;
          margin-top: -0.5rem;
        }
        .lb-toast-btn {
          background: ${c.dot};
          color: white;
          border: none;
          border-radius: 0.5rem;
          padding: 0.4rem 0.8rem;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.15s, opacity 0.15s, background 0.15s;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .lb-toast-btn:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }
        .lb-toast-btn:active {
          transform: translateY(0);
        }
      `}</style>

      <div className="lb-toast-wrap">
        <div className="lb-toast">

          {/* left accent */}
          <div className="lb-toast-bar" />

          <div className="lb-toast-inner">
            {/* icon */}
            <div className="lb-toast-icon">
              {c.icon}
            </div>

            {/* text */}
            <div className="lb-toast-text">
              <p className="lb-toast-label">
                <span className="lb-toast-dot" />
                {c.label}
              </p>
              <p className="lb-toast-msg">{message}</p>
            </div>

            {/* close */}
            <button onClick={handleClose} className="lb-toast-close">
              <X size={14} strokeWidth={2.5} />
            </button>
          </div>

          {/* optional action area */}
          {actionLabel && (
            <div className="lb-toast-action">
              <button 
                className="lb-toast-btn"
                onClick={() => {
                  if (onAction) onAction();
                  handleClose();
                }}
              >
                {actionLabel}
              </button>
            </div>
          )}

          {/* progress */}
          <div className="lb-toast-progress" />

        </div>
      </div>
    </>
  );
};
