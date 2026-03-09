"use client"

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { LoginCredentials } from '../types/user';
import { useToast } from '../hooks/useToast';
import { ROLE_HOME } from '../utils/roleRoutes';
import { Eye, EyeOff, LogIn } from 'lucide-react';

import logo from '../assets/logo.png';

const getHomeForRole = (role: string): string =>
  ROLE_HOME[role.toLowerCase().trim()] ?? '/dashboard';

const Login: React.FC = () => {
  const { showToast } = useToast();
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [lockoutTimer, setLockoutTimer] = useState<number>(0);
  const [searchParams, setSearchParams] = useSearchParams();

  const { login, isLoading, error, user } = useAuth();
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, user]);

  useEffect(() => {
    if (searchParams.get('reason') === 'expired') {
      showToast('Your session has expired. Please log in again.', 'warning');
      const p = new URLSearchParams(searchParams);
      p.delete('reason');
      setSearchParams(p, { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (error) showToast(error, 'error');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

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
    const loggedInUser = await login(credentials);
    if (loggedInUser) {
      localStorage.setItem('user_role', loggedInUser.role);
      localStorage.setItem('lucky_boba_user_branch_id', String(loggedInUser.branch_id ?? ''));
      showToast(`Welcome back, ${loggedInUser.name}!`, 'success');
      didJustLogin.current  = true;
      hasRedirected.current = true;
      navigate(getHomeForRole(loggedInUser.role), { replace: true });
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

        /* ── Page: two equal columns ── */
        .lb-page {
          min-height: 100vh;
          display: flex;
        }

        /* ══════════════════════════════
           LEFT — purple branding column
        ══════════════════════════════ */
        .lb-left {
          display: none;
          flex-direction: column;
          justify-content: space-between;
          padding: 2rem 2.5rem;
          position: relative;
          overflow: hidden;

          /* same vivid purple + diagonal stripes */
          background-color: #7c14d4;
          background-image:
            radial-gradient(ellipse 80% 60% at 50% 50%, #8b1fe0 0%, #6a0ec0 100%),
            repeating-linear-gradient(
              -45deg,
              rgba(255,255,255,0.07) 0px,
              rgba(255,255,255,0.07) 1px,
              transparent 1px,
              transparent 32px
            );
        }
        @media (min-width: 900px) {
          .lb-left { display: flex; flex: 1; }
        }

        /* corner blobs */
        .lb-blob {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          filter: blur(80px);
          opacity: 0.35;
        }
        .lb-blob-tl { width: 420px; height: 420px; background: #a020f0; top: -180px; left: -180px; }
        .lb-blob-br { width: 380px; height: 380px; background: #5b0ea6; bottom: -160px; right: -160px; }

        /* top-left: logo + brand name */
        .lb-brand {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          position: relative;
          z-index: 1;
        }

        .lb-brand-logo {
          width: 36px;
          height: 36px;
          object-fit: contain;
          filter: drop-shadow(0 2px 6px rgba(0,0,0,0.3));
        }

        .lb-brand-name {
          font-size: 0.95rem;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: -0.01em;
        }

        /* center content */
        .lb-left-center {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          position: relative;
          z-index: 1;
          width: 100%;
        }

        .lb-left-heading {
          font-size: 1.5rem;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: -0.03em;
          line-height: 1.3;
        }

        .lb-pills {
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
          width: 100%;
        }

        .lb-pill {
          display: flex;
          align-items: center;
          gap: 0.9rem;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.13);
          border-radius: 0.75rem;
          padding: 0.85rem 1rem;
          transition: background 0.15s;
        }

        .lb-pill:hover { background: rgba(255,255,255,0.12); }

        .lb-pill-icon {
          width: 34px; height: 34px;
          background: rgba(255,255,255,0.12);
          border-radius: 0.5rem;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        .lb-pill-name {
          font-size: 0.82rem;
          font-weight: 600;
          color: rgba(255,255,255,0.95);
        }

        .lb-pill-sub {
          font-size: 0.65rem;
          color: rgba(255,255,255,0.5);
          margin-top: 1px;
        }

        /* bottom-left: quote block */
        .lb-quote {
          position: relative;
          z-index: 1;
        }

        .lb-quote-text {
          font-size: 0.92rem;
          font-weight: 500;
          color: rgba(255,255,255,0.9);
          line-height: 1.65;
          margin-bottom: 0.75rem;
        }

        .lb-quote-author {
          font-size: 0.75rem;
          font-weight: 600;
          color: rgba(255,255,255,0.55);
          letter-spacing: 0.04em;
        }

        /* ══════════════════════════════
           RIGHT — white form column
        ══════════════════════════════ */
        .lb-right {
          flex: 1;
          background: #ffffff;
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          position: relative;
          overflow: hidden;
        }

        /* top bar */
        .lb-right-top {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding: 1.5rem 2.5rem;
          border-bottom: 1px solid #f4f4f5;
          flex-shrink: 0;
        }

        .lb-top-link {
          font-size: 0.72rem;
          font-weight: 600;
          color: #71717a;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        /* main content area — fills remaining height */
        .lb-right-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem 2.5rem;
          gap: 3rem;
        }

        /* stats strip above form */
        .lb-stats {
          display: flex;
          gap: 2rem;
          align-items: center;
          justify-content: center;
        }

        .lb-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
        }

        .lb-stat-value {
          font-size: 1.4rem;
          font-weight: 800;
          color: #1a0f2e;
          letter-spacing: -0.03em;
          line-height: 1;
        }

        .lb-stat-label {
          font-size: 0.6rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: #a1a1aa;
        }

        .lb-stat-divider {
          width: 1px;
          height: 36px;
          background: #e4e4e7;
        }

        /* form container */
        .lb-form-wrap {
          width: 100%;
          max-width: 440px;
          animation: lb-rise 0.4s cubic-bezier(0.22,1,0.36,1) both;
        }

        @keyframes lb-rise {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* form header */
        .lb-form-title {
          font-size: 1.9rem;
          font-weight: 800;
          color: #1a0f2e;
          letter-spacing: -0.035em;
          text-align: center;
          margin-bottom: 6px;
        }

        .lb-form-sub {
          font-size: 0.8rem;
          color: #71717a;
          font-weight: 400;
          text-align: center;
          margin-bottom: 2.25rem;
        }

        /* fields */
        .lb-field { margin-bottom: 1.15rem; }

        .lb-label {
          display: block;
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #3f3f46;
          margin-bottom: 7px;
        }

        .lb-wrap { position: relative; }

        .lb-input {
          width: 100%;
          padding: 13px 16px;
          background: #fafafa;
          border: 1.5px solid #e4e4e7;
          border-radius: 0.625rem;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem;
          font-weight: 400;
          color: #1a0f2e;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
        }

        .lb-input::placeholder { color: #a1a1aa; font-weight: 300; }

        .lb-input:focus {
          border-color: #3b2063;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(59,32,99,0.08);
        }

        .lb-input-pw { padding-right: 46px; }

        .lb-eye {
          position: absolute; right: 14px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none;
          cursor: pointer; color: #71717a;
          display: flex; padding: 3px;
          transition: color 0.15s;
        }
        .lb-eye:hover { color: #3b2063; }

        /* button */
        .lb-btn-wrap { margin-top: 1.5rem; }

        .lb-btn {
          width: 100%;
          padding: 14px 20px;
          background: #3b2063;
          color: #fff;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          border: none;
          border-radius: 0.625rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: background 0.15s, box-shadow 0.15s, transform 0.1s;
        }

        .lb-btn:hover:not(:disabled) {
          background: #2a1647;
          box-shadow: 0 6px 20px rgba(59,32,99,0.3);
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

        /* bottom terms */
        .lb-terms {
          margin-top: 1.5rem;
          font-size: 0.65rem;
          color: #a1a1aa;
          text-align: center;
          line-height: 1.6;
        }

        /* bottom bar */
        .lb-right-bottom {
          padding: 1.25rem 2.5rem;
          border-top: 1px solid #f4f4f5;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-shrink: 0;
        }

        .lb-bottom-copy {
          font-size: 0.6rem;
          color: #d4d4d8;
          text-transform: uppercase;
          letter-spacing: 0.08em;
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

        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

        .lb-secure-text {
          font-size: 0.55rem; font-weight: 700;
          letter-spacing: 0.16em; text-transform: uppercase; color: #16a34a;
        }

        /* mobile-only: logo at top of form */
        .lb-mobile-logo {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          margin-bottom: 1.75rem;
        }
        @media (min-width: 900px) { .lb-mobile-logo { display: none; } }
        .lb-mobile-logo img { width: 110px; height: auto; object-fit: contain; }
        .lb-mobile-logo-tag {
          font-size: 0.55rem; font-weight: 700;
          letter-spacing: 0.26em; text-transform: uppercase; color: #6d28d9;
        }
      `}</style>

      <div className="lb-page">

        {/* ── LEFT — purple branding ── */}
        <div className="lb-left">
          <div className="lb-blob lb-blob-tl" />
          <div className="lb-blob lb-blob-br" />

          {/* top-left: logo + name */}
          <div className="lb-brand">
            <img src={logo} alt="Lucky Boba" className="lb-brand-logo" />
            <span className="lb-brand-name">Lucky Boba</span>
          </div>

          {/* center: feature pills */}
          <div className="lb-left-center">
            <p className="lb-left-heading">Everything you need<br/>to run your store.</p>
            <div className="lb-pills">
              <div className="lb-pill">
                <div className="lb-pill-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </div>
                <div>
                  <p className="lb-pill-name">Role-based Access</p>
                  <p className="lb-pill-sub">Cashier · Manager · Admin</p>
                </div>
              </div>
              <div className="lb-pill">
                <div className="lb-pill-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                </div>
                <div>
                  <p className="lb-pill-name">Real-time Dashboard</p>
                  <p className="lb-pill-sub">Live sales & inventory data</p>
                </div>
              </div>
              <div className="lb-pill">
                <div className="lb-pill-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                </div>
                <div>
                  <p className="lb-pill-name">Sales & Revenue</p>
                  <p className="lb-pill-sub">X/Z readings, receipts, reports</p>
                </div>
              </div>
              <div className="lb-pill">
                <div className="lb-pill-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                </div>
                <div>
                  <p className="lb-pill-name">Inventory Management</p>
                  <p className="lb-pill-sub">Stock tracking & purchase orders</p>
                </div>
              </div>
            </div>
          </div>

          {/* bottom-left: quote */}
          <div className="lb-quote">
            <p className="lb-quote-text">
              "Streamlined operations, real-time insights, and effortless management — everything your boba business needs in one place."
            </p>
            <p className="lb-quote-author">Lucky Boba Point of Sale System</p>
          </div>
        </div>

        {/* ── RIGHT — white form ── */}
        <div className="lb-right">

          {/* top bar */}
          <div className="lb-right-top">
            <span className="lb-top-link">Staff Portal</span>
          </div>

          {/* body */}
          <div className="lb-right-body">

            {/* stats strip */}
            <div className="lb-stats">
              <div className="lb-stat">
                <span className="lb-stat-value">99.9%</span>
                <span className="lb-stat-label">Uptime</span>
              </div>
              <div className="lb-stat-divider" />
              <div className="lb-stat">
                <span className="lb-stat-value">256-bit</span>
                <span className="lb-stat-label">Encryption</span>
              </div>
              <div className="lb-stat-divider" />
              <div className="lb-stat">
                <span className="lb-stat-value">24 / 7</span>
                <span className="lb-stat-label">Monitoring</span>
              </div>
            </div>

            <div className="lb-form-wrap">

              {/* mobile logo */}
              <div className="lb-mobile-logo">
                <img src={logo} alt="Lucky Boba" />
                <span className="lb-mobile-logo-tag">Point of Sale System</span>
              </div>

              <h1 className="lb-form-title">Welcome back</h1>
              <p className="lb-form-sub">Enter your credentials to access the terminal</p>

              <form onSubmit={handleSubmit}>
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
                      autoComplete="email"
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
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="lb-eye"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={16} strokeWidth={2} /> : <Eye size={16} strokeWidth={2} />}
                    </button>
                  </div>
                </div>

                <div className="lb-btn-wrap">
                  <button
                    type="submit"
                    disabled={isLoading || lockoutTimer > 0}
                    className="lb-btn"
                  >
                    {isLoading ? (
                      <><div className="lb-spinner" />Authenticating...</>
                    ) : lockoutTimer > 0 ? (
                      `Locked — ${lockoutTimer}s`
                    ) : (
                      <><LogIn size={14} strokeWidth={2.5} />Sign In</>
                    )}
                  </button>
                </div>
              </form>

              <p className="lb-terms">
                By signing in, you agree to Lucky Boba's Terms of Service and Privacy Policy.
              </p>

            </div>
          </div>

          {/* bottom bar */}
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