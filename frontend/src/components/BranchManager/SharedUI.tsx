/**
 * BranchManager Shared UI Components
 * Based on SuperAdmin UI Design System
 */

import { X, AlertCircle } from 'lucide-react';
import { createPortal } from 'react-dom';
import React from 'react';

// ─── Type Definitions ────────────────────────────────────────────────────────

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';
type ToastType = 'success' | 'error' | 'warning';

export interface ButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export interface FieldProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}

export interface ModalShellProps {
  onClose: () => void;
  icon: React.ReactNode;
  title: string;
  sub: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  maxWidth?: string;
}

export interface ConfirmModalProps {
  show: boolean;
  icon?: React.ReactNode;
  title: string;
  desc?: string;
  action: () => void;
  btnText?: string;
  cancel: () => void;
  danger?: boolean;
}

export interface ToastProps {
  message: string;
  type?: ToastType;
  onDone: () => void;
}

// ─── Button Component ─────────────────────────────────────────────────────────

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'sm',
  onClick,
  className = '',
  disabled = false,
  type = 'button',
}) => {
  const sizes: Record<ButtonSize, string> = {
    sm: 'px-3 py-2 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-sm',
  };

  const variants: Record<ButtonVariant, string> = {
    primary: 'bg-[#3b2063] hover:bg-[#2a1647] text-white',
    secondary: 'bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    ghost: 'bg-transparent text-zinc-500 hover:bg-zinc-100',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 font-bold rounded-lg transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 ${sizes[size]} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

// ─── Avatar Component ────────────────────────────────────────────────────────

interface AvatarProps {
  name: string;
  size?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ name, size = 'w-7 h-7 text-[10px]' }) => (
  <div className={`${size} rounded-full bg-[#ede8ff] flex items-center justify-center font-bold text-[#3b2063] shrink-0`}>
    {name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
  </div>
);

// ─── Badge Component ────────────────────────────────────────────────────────

interface BadgeProps {
  status: string;
}

export const Badge: React.FC<BadgeProps> = ({ status }) => {
  const isActive = status === 'ACTIVE' || status === 'active';
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider
      ${isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-zinc-100 text-zinc-500 border border-zinc-200'}`}
    >
      {status}
    </span>
  );
};

// ─── Role Pill Component ────────────────────────────────────────────────────

interface RolePillProps {
  role: string;
}

export const RolePill: React.FC<RolePillProps> = ({ role }) => (
  <span className="text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-200 px-2.5 py-0.5 rounded-full">
    {role}
  </span>
);

// ─── Field Component ────────────────────────────────────────────────────────

export const Field: React.FC<FieldProps> = ({ label, required, error, hint, children }) => (
  <div>
    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5 block">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    {hint && <p className="text-[10px] text-zinc-400 font-medium mb-1.5 -mt-1">{hint}</p>}
    {children}
    {error && <p className="text-[10px] text-red-500 mt-1 font-medium">{error}</p>}
  </div>
);

// ─── Input Helpers ──────────────────────────────────────────────────────────

export const inputClass = (error?: string): string =>
  `w-full text-sm font-medium text-zinc-700 bg-zinc-50 border rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white transition-all ${
    error ? 'border-red-300 bg-red-50' : 'border-zinc-200'
  }`;

// ─── Modal Shell Component ──────────────────────────────────────────────────

export const ModalShell: React.FC<ModalShellProps> = ({
  onClose,
  icon,
  title,
  sub,
  children,
  footer,
  maxWidth = 'max-w-md',
}) =>
  createPortal(
    <div
      className="fixed inset-0 z-9999 flex items-center justify-center p-6"
      style={{
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        backgroundColor: 'rgba(0,0,0,0.45)',
      }}
    >
      <div className="absolute inset-0" onClick={onClose} />
      <div className={`relative bg-white w-full ${maxWidth} border border-zinc-200 rounded-[1.25rem] shadow-2xl`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-violet-50 border border-violet-200 rounded-lg flex items-center justify-center">
              {icon}
            </div>
            <div>
              <p className="text-sm font-bold text-[#1a0f2e]">{title}</p>
              <p className="text-[10px] text-zinc-400">{sub}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-100 rounded-lg transition-colors text-zinc-400 hover:text-zinc-600"
          >
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5 flex flex-col gap-4 max-h-[65vh] overflow-y-auto">{children}</div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-zinc-100">{footer}</div>
      </div>
    </div>,
    document.body
  );

// ─── Toast Component ────────────────────────────────────────────────────────

export const Toast: React.FC<ToastProps> = ({ message, type = 'success', onDone }) => {
  React.useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  const styles: Record<ToastType, { bar: string; iconBg: string; icon: string }> = {
    success: { bar: 'bg-emerald-500', iconBg: 'bg-emerald-500', icon: 'text-white' },
    error: { bar: 'bg-red-500', iconBg: 'bg-red-500', icon: 'text-white' },
    warning: { bar: 'bg-amber-500', iconBg: 'bg-amber-500', icon: 'text-white' },
  };
  const s = styles[type];

  const icons: Record<ToastType, React.ReactNode> = {
    success: (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
    error: (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    ),
    warning: (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  };

  return createPortal(
    <div className="fixed bottom-6 right-6 z-99999" style={{ animation: 'slideUpFade 0.25s ease forwards' }}>
      <style>{`@keyframes slideUpFade { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }`}</style>
      <div className="relative flex items-center gap-3 bg-[#1a0f2e] text-white pl-4 pr-3 py-3 rounded-xl shadow-2xl border border-white/10 min-w-55 max-w-xs overflow-hidden">
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${s.bar} rounded-l-xl`} />
        <div className={`w-5 h-5 ${s.iconBg} rounded-full flex items-center justify-center shrink-0 ${s.icon}`}>
          {icons[type]}
        </div>
        <p className="text-xs font-semibold flex-1 leading-snug">{message}</p>
        <button onClick={onDone} className="ml-1 text-white/40 hover:text-white transition-colors shrink-0">
          <X size={13} />
        </button>
      </div>
    </div>,
    document.body
  );
};

// ─── Confirm Modal Component ────────────────────────────────────────────────

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  show,
  icon,
  title,
  desc,
  action,
  btnText = 'Confirm',
  cancel,
  danger = false,
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-200 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
      <div
        style={{ fontFamily: "'DM Sans', sans-serif" }}
        className="bg-white w-full max-w-sm border border-zinc-200 rounded-[1.25rem] p-8 flex flex-col items-center text-center shadow-2xl"
      >
        {icon && (
          <div className={`w-11 h-11 rounded-[0.625rem] flex items-center justify-center mb-5 ${danger ? 'bg-red-50' : 'bg-[#f5f3ff]'}`}>
            {icon}
          </div>
        )}
        <h3 className="text-[#1a0f2e] font-bold text-base mb-2 tracking-tight">{title}</h3>
        {desc && <p className="text-zinc-500 text-sm font-medium mb-7 leading-relaxed">{desc}</p>}
        <div className="flex flex-col w-full gap-2">
          <button
            onClick={action}
            className={`w-full py-3 text-[10px] font-bold tracking-[0.18em] uppercase text-white transition-all rounded-[0.625rem] active:scale-[0.98] ${
              danger ? 'bg-[#be2525] hover:bg-[#a11f1f]' : 'bg-[#3b2063] hover:bg-[#2a1647]'
            }`}
          >
            {btnText}
          </button>
          {cancel && (
            <button
              onClick={cancel}
              className="w-full py-3 text-[10px] font-bold tracking-[0.18em] uppercase text-zinc-500 bg-white border border-zinc-200 hover:bg-zinc-50 transition-all rounded-[0.625rem] active:scale-[0.98]"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Alert Box Component ────────────────────────────────────────────────────

interface AlertBoxProps {
  type?: 'info' | 'warning' | 'error' | 'success';
  message: string;
  icon?: React.ReactNode;
}

export const AlertBox: React.FC<AlertBoxProps> = ({ type = 'info', message, icon }) => {
  const styles: Record<string, { bg: string; border: string; text: string; iconColor: string }> = {
    info: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', iconColor: 'text-blue-500' },
    warning: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', iconColor: 'text-amber-500' },
    error: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', iconColor: 'text-red-500' },
    success: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', iconColor: 'text-emerald-500' },
  };

  const s = styles[type];
  const defaultIcon = <AlertCircle size={14} />;

  return (
    <div className={`flex items-center gap-2 p-3 ${s.bg} border ${s.border} rounded-lg`}>
      <span className={`shrink-0 ${s.iconColor}`}>{icon || defaultIcon}</span>
      <p className={`text-xs ${s.text} font-medium`}>{message}</p>
    </div>
  );
};

// ─── Stat Card Component ────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  trend?: number;
  color?: 'violet' | 'emerald' | 'red' | 'amber' | 'blue' | 'indigo';
}

export const StatCard: React.FC<StatCardProps> = ({ icon, label, value, sub, trend, color = 'violet' }) => {
  const colors: Record<string, { bg: string; border: string; icon: string }> = {
    violet: { bg: 'bg-violet-50', border: 'border-violet-200', icon: 'text-violet-600' },
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'text-emerald-600' },
    red: { bg: 'bg-red-50', border: 'border-red-200', icon: 'text-red-500' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'text-amber-600' },
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-600' },
    indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', icon: 'text-indigo-600' },
  };

  const c = colors[color];

  return (
    <div className="bg-white border border-zinc-200 rounded-[0.625rem] px-6 py-5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 ${c.bg} border ${c.border} flex items-center justify-center rounded-[0.4rem]`}>
          <span className={c.icon}>{icon}</span>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{label}</p>
          <p className="text-xl font-bold text-[#1a0f2e] tabular-nums">{value}</p>
        </div>
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 text-xs font-bold ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
          {trend >= 0 ? <>↑</> : <>↓</>}
          {Math.abs(trend)}%
        </div>
      )}
      {sub && <p className="text-xs text-zinc-400 font-medium">{sub}</p>}
    </div>
  );
};
