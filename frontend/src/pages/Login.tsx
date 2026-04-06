"use client"

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { LoginCredentials, User } from '../types/user';
import { useToast } from '../hooks/useToast';
import { ROLE_HOME } from '../utils/roleRoutes';
import { Eye, EyeOff, LogIn, ShieldCheck } from 'lucide-react';

import logo from '../assets/logo.png';

const getHomeForRole = (role: string): string =>
  ROLE_HOME[role.toLowerCase().trim()] ?? '/dashboard';

const Login: React.FC = () => {
  const { showToast } = useToast();
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [lockoutTimer, setLockoutTimer] = useState<number>(0);
  const [requires2FA, setRequires2FA]   = useState(false);
  const [otp, setOtp]                   = useState('');
  const [searchParams, setSearchParams] = useSearchParams();

  const { login, verify2FA, isLoading, user } = useAuth();
  const navigate        = useNavigate();
  const hasRedirected   = useRef(false);
  const didJustLogin    = useRef(false);

  useEffect(() => {
    if (isLoading) return;
    if (hasRedirected.current) return;
    if (didJustLogin.current) return;
    if (!user) return;
    hasRedirected.current = true;
    navigate(getHomeForRole(user.role), { replace: true });
  }, [isLoading, user]);

  useEffect(() => {
    if (searchParams.get('reason') === 'expired') {
      showToast('Your session has expired. Please log in again.', 'warning');
      const p = new URLSearchParams(searchParams);
      p.delete('reason');
      setSearchParams(p, { replace: true });
    }
  }, []);

  useEffect(() => {
    const check = () => {
      const end = localStorage.getItem('login_lockout_end');
      setLockoutTimer(end ? Math.max(0, Math.ceil((parseInt(end) - Date.now()) / 1000)) : 0);
    };
    check();
    const id = setInterval(check, 1000);
    return () => clearInterval(id);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.getModifierState('CapsLock')) showToast('Caps Lock is ON', 'warning');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const credentials: LoginCredentials = { email, password };
    try {
      const result = await login(credentials);
      if (result && (result as any).requires_2fa) {
        setRequires2FA(true);
        setOtp(""); 
        showToast('Verification code sent! Please check your Gmail.', 'warning');
        return;
      }
      if (result) {
        const loggedInUser = result as User;
        localStorage.setItem('user_role', loggedInUser.role);
        localStorage.setItem('lucky_boba_user_name',      loggedInUser.name);
        localStorage.setItem('lucky_boba_user_role',      loggedInUser.role);
        localStorage.setItem('lucky_boba_user_branch_id', String(loggedInUser.branch_id ?? ''));
        showToast(`Welcome back, ${loggedInUser.name}!`, 'success');
        didJustLogin.current  = true;
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
        didJustLogin.current  = true;
        hasRedirected.current = true;
        navigate(getHomeForRole(loggedInUser.role), { replace: true });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid or expired 2FA code.';
      showToast(message, 'error');
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
          overflow: hidden;
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

        /* ── VANILLA CSS 2FA MODAL (CLEAN) ── */
        .otp-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.73);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .otp-modal {
          background: white;
          width: 100%;
          max-width: 380px;
          border-radius: 16px;
          padding: 35px;
          box-shadow: 0 25px 70px -15px rgba(0, 0, 0, 0.4);
          text-align: center;
          border: 1px solid #f3e8ff;
        }
        .otp-title {
          font-size: 1.4rem; font-weight: 800; color: #1f2937; margin-bottom: 6px;
        }
        .otp-sub {
          font-size: 0.8rem; color: #6b7280; margin-bottom: 25px; line-height: 1.5;
        }
        .otp-input-field {
          width: 100%;
          text-align: center;
          font-size: 2.2rem;
          letter-spacing: 0.35em;
          font-weight: 900;
          padding: 12px;
          background: #f9fafb;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          color: #6d28d9;
          outline: none;
          margin-bottom: 20px;
        }
        .otp-cancel {
          background: none; border: none; color: #9ca3af;
          font-size: 0.7rem; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.1em; cursor: pointer; margin-top: 15px;
        }
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
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </div>
                <div>
                  <p className="lb-pill-name">Role-based Access</p>
                  <p className="lb-pill-sub">Cashier · Manager · Admin</p>
                </div>
              </div>
              <div className="lb-pill">
                <div className="lb-pill-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                </div>
                <div>
                  <p className="lb-pill-name">Real-time Dashboard</p>
                  <p className="lb-pill-sub">Live sales &amp; inventory data</p>
                </div>
              </div>
              <div className="lb-pill">
                <div className="lb-pill-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                </div>
                <div>
                  <p className="lb-pill-name">Sales &amp; Revenue</p>
                  <p className="lb-pill-sub">X/Z readings, receipts, reports</p>
                </div>
              </div>
              <div className="lb-pill">
                <div className="lb-pill-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
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

              {/* ── 2FA MODAL (OVERLAY ONLY) ── */}
              {requires2FA && (
                <div className="otp-overlay">
                  <div className="otp-modal">
                    <div style={{ width: '60px', height: '60px', background: '#f5f3ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px', color: '#7c3aed' }}>
                      <ShieldCheck size={28} strokeWidth={2.5} />
                    </div>
                    <h2 className="otp-title">Verify Identity</h2>
                    <p className="otp-sub">A 6-digit code was sent to <br/><strong>{email}</strong></p>

                    <form onSubmit={handleVerify2FA}>
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="otp-input-field"
                        placeholder="000000"
                        autoFocus
                        required
                      />
                      <button type="submit" disabled={isLoading || otp.length !== 6} className="lb-btn" style={{ padding: '14px' }}>
                        {isLoading ? "Checking..." : "Confirm Verification"}
                      </button>
                      <button type="button" onClick={() => setRequires2FA(false)} className="otp-cancel">Cancel</button>
                    </form>
                  </div>
                </div>
              )}
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
    </>
  );
};

export default Login;