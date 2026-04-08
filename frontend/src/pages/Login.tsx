"use client"

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { LoginCredentials, User } from '../types/user';
import { useToast } from '../hooks/useToast';
import { ROLE_HOME } from '../utils/roleRoutes';
import { Eye, EyeOff, LogIn, Mail } from 'lucide-react';

import logo from '../assets/logo.png';

const getHomeForRole = (role: string): string =>
  ROLE_HOME[role.toLowerCase().trim()] ?? '/dashboard';

const Login: React.FC = () => {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [lockoutTimer, setLockoutTimer] = useState<number>(0);
  const [requires2FA, setRequires2FA] = useState(false);
  const [otp, setOtp] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();

  const { login, verify2FA, resend2FA, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpError, setOtpError] = useState<string | null>(null);
  const otpRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];
  const hasRedirected = useRef(false);
  const didJustLogin = useRef(false);

  useEffect(() => {
    if (isLoading) return;
    if (hasRedirected.current) return;
    if (didJustLogin.current) return;
    if (!user) return;
    hasRedirected.current = true;
    navigate(getHomeForRole(user.role), { replace: true });
  }, [isLoading, user, navigate]);

  useEffect(() => {
    if (searchParams.get('reason') === 'expired') {
      showToast('Your session has expired. Please log in again.', 'warning');
      const p = new URLSearchParams(searchParams);
      p.delete('reason');
      setSearchParams(p, { replace: true });
    }
  }, [searchParams, setSearchParams, showToast]);

  useEffect(() => {
    const check = () => {
      const end = localStorage.getItem('login_lockout_end');
      setLockoutTimer(end ? Math.max(0, Math.ceil((parseInt(end) - Date.now()) / 1000)) : 0);
    };
    check();
    const id = setInterval(check, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.getModifierState('CapsLock')) showToast('Caps Lock is ON', 'warning');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const credentials: LoginCredentials = { email, password };
    try {
      const result = await login(credentials);

      if (result && 'requires_2fa' in result) {
        setRequires2FA(true);
        setOtp("");
        showToast('Verification code sent! Please check your Gmail.', 'warning');
        return;
      }

      if (result) {
        const loggedInUser = result as User;
        localStorage.setItem('user_role', loggedInUser.role);
        localStorage.setItem('lucky_boba_user_name', loggedInUser.name);
        localStorage.setItem('lucky_boba_user_role', loggedInUser.role);
        localStorage.setItem('lucky_boba_user_branch_id', String(loggedInUser.branch_id ?? ''));
        showToast(`Welcome back, ${loggedInUser.name}!`, 'success');
        didJustLogin.current = true;
        hasRedirected.current = true;
        navigate(getHomeForRole(loggedInUser.role), { replace: true });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid email or password.';
      showToast(message, 'error');
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      showToast('Please enter a valid 6-digit code.', 'warning');
      return;
    }
    try {
      const loggedInUser = await verify2FA({ email, password }, otp);
      if (loggedInUser) {
        localStorage.setItem('user_role', loggedInUser.role);
        localStorage.setItem('lucky_boba_user_branch_id', String(loggedInUser.branch_id ?? ''));
        showToast(`Welcome back, ${loggedInUser.name}!`, 'success');
        didJustLogin.current = true;
        hasRedirected.current = true;
        navigate(getHomeForRole(loggedInUser.role), { replace: true });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid or expired 2FA code.';
      setOtpError(message);
      showToast(message, 'error');
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    try {
      setOtpError(null);
      await resend2FA({ email, password });
      showToast('New code sent to your email!', 'success');
      setResendCooldown(60);
      setOtp("");
      otpRefs[0].current?.focus();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to resend code.';
      showToast(message, 'error');
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    const digit = value.slice(-1); // Only take the last character
    if (digit && !/^\d$/.test(digit)) return; // Only allow digits

    setOtpError(null);
    const newOtp = otp.split('');
    newOtp[index] = digit;
    const combined = newOtp.join('');
    setOtp(combined);

    // Auto-focus next box
    if (digit && index < 5) {
      otpRefs[index + 1].current?.focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');

        *, *::before, *::after {
          box-sizing: border-box; margin: 0; padding: 0;
          font-family: 'DM Sans', sans-serif;
        }

        .lb-page {
          min-height: 100vh;
          display: flex;
          position: relative;
        }

        .lb-left {
          display: none;
          flex-direction: column;
          justify-content: space-between;
          padding: 2rem 2rem 2rem;
          position: relative;
          overflow: hidden;
          background-color: #3b2063;
          background-image:
            radial-gradient(ellipse 80% 60% at 50% 50%, #8b1fe0 0%, #6a0ec0 100%),
            repeating-linear-gradient(
              -45deg,
              rgba(255,255,255,0.05) 0px,
              rgba(255,255,255,0.05) 1px,
              transparent 1px,
              transparent 28px
            );
        }
        @media (min-width: 900px) {
          .lb-left { display: flex; flex: 1; }
        }

        .lb-blob {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          filter: blur(90px);
          opacity: 0.3;
        }
        .lb-blob-tl { width: 380px; height: 380px; background: #a020f0; top: -160px; left: -160px; }
        .lb-blob-br { width: 340px; height: 340px; background: #4b0eaa; bottom: -140px; right: -140px; }

        .lb-brand {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          position: relative;
          z-index: 1;
        }
        .lb-brand-dot {
          width: 8px; height: 8px;
          background: rgba(255,255,255,0.5);
          border-radius: 50%;
        }
        .lb-brand-name {
          font-size: 0.65rem;
          font-weight: 700;
          color: rgba(255,255,255,0.6);
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        .lb-left-center {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0;
          position: relative;
          z-index: 1;
          width: 100%;
          margin-top: -50px;
        }

        .lb-logo-hero {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          margin-top: -2rem;
          margin-bottom: -4rem;
        }
        .lb-logo-hero img {
          width: 420px;
          height: 420px;
          object-fit: contain;
          filter: drop-shadow(0 8px 24px rgba(0,0,0,0.35));
        }

        .lb-pills {
          display: flex;
          flex-direction: column;
          gap: 0.55rem;
          width: 100%;
        }

        .lb-pill {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.11);
          border-radius: 0.65rem;
          padding: 0.7rem 0.9rem;
          transition: background 0.15s;
        }
        .lb-pill:hover { background: rgba(255,255,255,0.11); }

        .lb-pill-icon {
          width: 30px; height: 30px;
          background: rgba(255,255,255,0.1);
          border-radius: 0.45rem;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .lb-pill-name {
          font-size: 0.78rem;
          font-weight: 600;
          color: rgba(255,255,255,0.92);
        }
        .lb-pill-sub {
          font-size: 0.62rem;
          color: rgba(255,255,255,0.45);
          margin-top: 1px;
        }

        .lb-quote {
          position: relative;
          z-index: 1;
        }
        .lb-quote-text {
          font-size: 0.82rem;
          font-weight: 500;
          color: rgba(255,255,255,0.75);
          line-height: 1.7;
          margin-bottom: 0.6rem;
          font-style: italic;
        }
        .lb-quote-author {
          font-size: 0.62rem;
          font-weight: 700;
          color: rgba(255,255,255,0.4);
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .lb-right {
          flex: 1;
          background: #ffffff;
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          position: relative;
        }

        .lb-right-top {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding: 1.25rem 2.5rem;
          border-bottom: 1.5px solid #f4f4f5;
          flex-shrink: 0;
        }
        .lb-top-link {
          font-size: 0.65rem;
          font-weight: 700;
          color: #a1a1aa;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .lb-right-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2.5rem 2.5rem;
        }

        .lb-form-wrap {
          width: 100%;
          max-width: 400px;
          animation: lb-rise 0.45s cubic-bezier(0.22,1,0.36,1) both;
        }

        @keyframes lb-rise {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .lb-form-title {
          font-size: 1.75rem;
          font-weight: 800;
          color: #6d28d9;
          letter-spacing: -0.03em;
          text-align: center;
          margin-bottom: 6px;
        }
        .lb-form-sub {
          font-size: 0.78rem;
          color: #71717a;
          font-weight: 400;
          text-align: center;
          margin-bottom: 2.25rem;
          font-style: italic;
        }

        .lb-field { margin-bottom: 1.1rem; }

        .lb-label {
          display: block;
          font-size: 0.6rem;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #52525b;
          margin-bottom: 6px;
        }

        .lb-wrap { position: relative; }

        .lb-input {
          width: 100%;
          padding: 12px 16px;
          background: #fafafa;
          border: 1.5px solid #e4e4e7;
          border-radius: 0.55rem;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.88rem;
          font-weight: 400;
          color: #1a0f2e;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
        }
        .lb-input::placeholder { color: #c4c4c8; font-weight: 300; }
        .lb-input:focus {
          border-color: #3b2063;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(124,20,212,0.08);
        }
        .lb-input-pw { padding-right: 46px; }

        .lb-eye {
          position: absolute; right: 13px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none;
          cursor: pointer; color: #a1a1aa;
          display: flex; padding: 3px;
          transition: color 0.15s;
        }
        .lb-eye:hover { color: #3b2063; }

        .lb-btn-wrap { margin-top: 1.4rem; }

        .lb-btn {
          width: 100%;
          padding: 13px 20px;
          background: #3b2063;
          color: #fff;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          border: none;
          border-radius: 0.55rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: background 0.15s, box-shadow 0.15s, transform 0.1s;
        }
        .lb-btn:hover:not(:disabled) {
          background: #6a12b8;
          box-shadow: 0 6px 22px rgba(124,20,212,0.35);
          transform: translateY(-1px);
        }
        .lb-btn:active:not(:disabled) { transform: translateY(0); }
        .lb-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .lb-spinner {
          width: 13px; height: 13px;
          border: 2px solid rgba(255,255,255,0.25);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.65s linear infinite;
          flex-shrink: 0;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .lb-right-bottom {
          padding: 1.1rem 2.5rem;
          border-top: 1.5px solid #f4f4f5;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-shrink: 0;
        }
        .lb-bottom-copy {
          font-size: 0.58rem;
          color: #d4d4d8;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-weight: 600;
        }
        .lb-secure {
          display: flex; align-items: center; gap: 5px;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 100px;
          padding: 4px 10px;
        }
        .lb-secure-dot {
          width: 5px; height: 5px; background: #22c55e;
          border-radius: 50%; box-shadow: 0 0 5px rgba(34,197,94,0.6);
          animation: pulse 2s infinite;
        }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }
        .lb-secure-text {
          font-size: 0.52rem; font-weight: 700;
          letter-spacing: 0.16em; text-transform: uppercase; color: #16a34a;
        }

        /* ── MINIMALIST 2FA MODAL (MODERN) ── */
        .otp-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(26, 15, 46, 0.65);
          backdrop-filter: blur(12px) saturate(180%);
          -webkit-backdrop-filter: blur(12px) saturate(180%);
          z-index: 9999999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }
        .otp-modal {
          background: #ffffff;
          width: 100%;
          max-width: 360px;
          border-radius: 24px;
          padding: 42px 32px;
          box-shadow: 
            0 10px 15px -3px rgba(0, 0, 0, 0.1),
            0 25px 50px -12px rgba(0, 0, 0, 0.25);
          text-align: center;
          border: 1px solid rgba(228, 228, 231, 0.5);
          animation: otp-appear 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes otp-appear {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .otp-icon-wrap {
          width: 54px; height: 54px;
          background: #f5f3ff;
          border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 24px;
          color: #7c3aed;
        }
        .otp-title {
          font-size: 1.35rem; font-weight: 800; color: #18181b; margin-bottom: 8px;
          letter-spacing: -0.02em;
        }
        .otp-sub {
          font-size: 0.85rem; color: #71717a; margin-bottom: 32px; line-height: 1.6;
        }
        .otp-sub strong { color: #3f3f46; font-weight: 600; }

        .otp-input-container {
          display: flex;
          gap: 10px;
          justify-content: center;
          margin-bottom: 24px;
        }
        .otp-box {
          width: 42px;
          height: 54px;
          text-align: center;
          font-size: 1.5rem;
          font-weight: 800;
          background: #fbfbfb;
          border: 1.5px solid #e4e4e7;
          border-radius: 12px;
          color: #18181b;
          outline: none;
          transition: all 0.2s ease;
        }
        .otp-box:focus {
          border-color: #7c3aed;
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.08);
          transform: translateY(-2px);
        }
        .otp-box.otp-error {
          border-color: #ef4444;
          background: #fef2f2;
          animation: otp-shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }
        @keyframes otp-shake {
          10%, 90% { transform: translate3d(-1px, -2px, 0); }
          20%, 80% { transform: translate3d(2px, -2px, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, -2px, 0); }
          40%, 60% { transform: translate3d(4px, -2px, 0); }
        }

        .otp-error-msg {
          color: #ef4444;
          font-size: 0.72rem;
          font-weight: 600;
          margin-top: -12px;
          margin-bottom: 20px;
          animation: lb-rise 0.3s ease;
        }

        .otp-error-alert {
          background: #fef2f2;
          border: 1px solid #fee2e2;
          color: #991b1b;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 10px 14px;
          border-radius: 12px;
          margin: 0 0 24px 0;
          display: flex;
          align-items: center;
          gap: 8px;
          animation: lb-rise 0.3s ease;
        }

        .otp-box::placeholder {
          color: #e4e4e7;
        }

        .otp-resend {
          font-size: 0.75rem;
          color: #71717a;
          margin-bottom: 24px;
        }
        .otp-resend-btn {
          background: none;
          border: none;
          color: #7c3aed;
          font-weight: 700;
          cursor: pointer;
          padding: 0 4px;
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .otp-resend-btn:disabled {
          color: #a1a1aa;
          cursor: not-allowed;
          text-decoration: none;
        }

        .otp-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .otp-verify-btn {
          width: 100%;
          padding: 15px;
          background: #3b2063;
          color: white;
          border-radius: 14px;
          border: none;
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .otp-verify-btn:hover:not(:disabled) {
          background: #4c2a7e;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 32, 99, 0.2);
        }
        .otp-verify-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .otp-cancel {
          background: none; border: none; color: #a1a1aa;
          font-size: 0.65rem; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.08em; cursor: pointer; padding: 8px;
          transition: color 0.15s;
        }
        .otp-cancel:hover { color: #52525b; }
      `}</style>

      <div className="lb-page">
        {/* ── LEFT ── */}
        <div className="lb-left">
          <div className="lb-blob lb-blob-tl" />
          <div className="lb-blob lb-blob-br" />

          <div className="lb-brand">
            <div className="lb-brand-dot" />
            <span className="lb-brand-name">Lucky Boba POS</span>
          </div>

          <div className="lb-left-center">
            <div className="lb-logo-hero">
              <img src={logo} alt="Lucky Boba" />
            </div>

            <div className="lb-pills">
              <div className="lb-pill">
                <div className="lb-pill-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                </div>
                <div>
                  <p className="lb-pill-name">Role-based Access</p>
                  <p className="lb-pill-sub">Cashier · Manager · Admin</p>
                </div>
              </div>
              <div className="lb-pill">
                <div className="lb-pill-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></svg>
                </div>
                <div>
                  <p className="lb-pill-name">Real-time Dashboard</p>
                  <p className="lb-pill-sub">Live sales &amp; inventory data</p>
                </div>
              </div>
              <div className="lb-pill">
                <div className="lb-pill-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                </div>
                <div>
                  <p className="lb-pill-name">Sales &amp; Revenue</p>
                  <p className="lb-pill-sub">X/Z readings, receipts, reports</p>
                </div>
              </div>
              <div className="lb-pill">
                <div className="lb-pill-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg>
                </div>
                <div>
                  <p className="lb-pill-name">Inventory Management</p>
                  <p className="lb-pill-sub">Stock tracking &amp; purchase orders</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lb-quote">
            <p className="lb-quote-text">
              "Streamlined operations, real-time insights, and effortless management — everything your boba business needs in one place."
            </p>
            <p className="lb-quote-author">Lucky Boba Point of Sale System</p>
          </div>
        </div>

        {/* ── RIGHT ── */}
        <div className="lb-right">
          <div className="lb-right-top">
            <span className="lb-top-link">Staff Portal</span>
          </div>

          <div className="lb-right-body">
            <div className="lb-form-wrap">
              <h1 className="lb-form-title">Welcome Back!</h1>
              <p className="lb-form-sub">Enter your credentials to access the terminal</p>

              <form onSubmit={handleSubmit} id="login-form">
                <div className="lb-field">
                  <label className="lb-label">Email Address</label>
                  <div className="lb-wrap">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="lb-input"
                      placeholder="name@luckyboba.com"
                      required
                    />
                  </div>
                </div>

                <div className="lb-field">
                  <label className="lb-label">Password</label>
                  <div className="lb-wrap">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="lb-input lb-input-pw"
                      placeholder="••••••••"
                      required
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="lb-eye">
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div className="lb-btn-wrap">
                  <button type="submit" disabled={isLoading || lockoutTimer > 0} className="lb-btn">
                    {isLoading ? "Authenticating..." : lockoutTimer > 0 ? `Locked - ${lockoutTimer}s` : <><LogIn size={13} strokeWidth={2.5} />Sign In</>}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="lb-right-bottom">
            <span className="lb-bottom-copy">Lucky Boba &copy; 2026</span>
            <div className="lb-secure">
              <div className="lb-secure-dot" />
              <span className="lb-secure-text">Secure</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2FA MODAL (TOTALLY OUTSIDE ALL WRAPPERS) ── */}
      {requires2FA && (
        <div className="otp-overlay">
          <div className="otp-modal">
            <div className="otp-icon-wrap">
              <Mail size={22} strokeWidth={2.5} />
            </div>

            <h2 className="otp-title">Security Verification</h2>
            <p className="otp-sub">
              Check your inbox. We've sent a 6-digit code to <br />
              <strong>{email}</strong>
            </p>

            {otpError && (
              <div className="otp-error-alert">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {otpError}
              </div>
            )}

            <form onSubmit={handleVerify2FA}>
              <div className="otp-input-container">
                {[0, 1, 2, 3, 4, 5].map((idx) => (
                  <input
                    key={idx}
                    ref={otpRefs[idx]}
                    type="text"
                    value={otp[idx] || ""}
                    onChange={(e) => handleOtpChange(e.target.value, idx)}
                    onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                    className={`otp-box ${otpError ? 'otp-error' : ''}`}
                    placeholder="0"
                    maxLength={1}
                    required
                    autoFocus={idx === 0}
                  />
                ))}
              </div>

              <div className="otp-resend">
                Didn't receive code? 
                <button 
                  type="button" 
                  onClick={handleResendOTP} 
                  disabled={resendCooldown > 0 || isLoading}
                  className="otp-resend-btn"
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
                </button>
              </div>

              <div className="otp-actions">
                <button
                  type="submit"
                  disabled={isLoading || otp.length !== 6}
                  className="otp-verify-btn"
                >
                  {isLoading ? "Verifying..." : "Verify Identity"}
                </button>
                <button
                  type="button"
                  onClick={() => setRequires2FA(false)}
                  className="otp-cancel"
                >
                  Cancel & Go Back
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Login;