"use client"

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { LoginCredentials } from '../types/user';
import { useToast } from '../hooks/useToast';

import logo from '../assets/logo.png';
import backgroundImage from '../assets/background_image.png';

const Login: React.FC = () => {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [lockoutTimer, setLockoutTimer] = useState<number>(0);
  const [searchParams, setSearchParams] = useSearchParams();

  const { login, isLoading, error, user } = useAuth();
  const navigate = useNavigate();

  // ✅ Added !isLoading check so we don't redirect while auth is still resolving
useEffect(() => {
  if (!isLoading && user) {
    // Only redirect if we're not in the middle of logging in
    if (user.role === 'superadmin') {
      navigate('/super-admin', { replace: true });
    } else if (user.role === 'manager' || user.role === 'admin' || user.role === 'branch_manager') {
      navigate('/branch-manager', { replace: true });
    } else if (user.role === 'cashier') {
      navigate('/dashboard', { replace: true });
    }
    // Don't add an else fallback here — unknown roles stay on login
  }
}, [navigate, user, isLoading]);

  useEffect(() => {
    if (searchParams.get('reason') === 'expired') {
      showToast("Your session has expired. Please log in again.", "warning");
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('reason');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, showToast, setSearchParams]);

  useEffect(() => {
    if (error) {
      showToast(error, "error");
    }
  }, [error, showToast]);

  useEffect(() => {
    const checkLockout = () => {
      const lockoutEnd = localStorage.getItem('login_lockout_end');
      if (lockoutEnd) {
        const remaining = Math.ceil((parseInt(lockoutEnd) - Date.now()) / 1000);
        setLockoutTimer(remaining > 0 ? remaining : 0);
      } else {
        setLockoutTimer(0);
      }
    };
    checkLockout();
    const interval = setInterval(checkLockout, 1000);
    return () => clearInterval(interval);
  }, [error]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.getModifierState('CapsLock')) {
      showToast("Caps Lock is ON", "warning");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const credentials: LoginCredentials = { email, password };
    const loggedInUser = await login(credentials);
    console.log('Logged in user role:', loggedInUser?.role); // 👈 add this

    if (loggedInUser) {
      localStorage.setItem('user_role', loggedInUser.role);
      showToast(`Welcome back, ${loggedInUser.name}!`, "success");

      if (loggedInUser.role === 'superadmin') {
  navigate('/super-admin', { replace: true });
} else if (loggedInUser.role === 'manager' || loggedInUser.role === 'admin' || loggedInUser.role === 'branch_manager') {
  navigate('/branch-manager', { replace: true });
} else {
  navigate('/dashboard', { replace: true });
}
    }
  };

  return (
    <div
      className="relative min-h-screen flex items-center justify-center p-6 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="max-w-md w-full z-10 overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#D4C8F0] shadow-2xl">
        <div className="flex flex-col items-center p-8 pb-4 text-center">
          <div className="flex justify-center mb-0">
            <img
              src={logo}
              alt="Lucky Boba Logo"
              className="w-80 h-48 object-contain drop-shadow-sm"
            />
          </div>
          <div className="text-[#3b2063] font-black uppercase text-[11px] tracking-[0.25em] -mt-10 opacity-70">
            Point of Sale System
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-8 pt-4 space-y-6">
            <div className="space-y-2">
              <label className="block text-[11px] font-black uppercase tracking-wider text-[#3b2063] ml-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-6 py-4 rounded-2xl border border-white/20 focus:border-[#3b2063] focus:ring-4 focus:ring-[#3b2063]/10 outline-none transition-all bg-white/80 placeholder:text-zinc-400"
                placeholder="name@luckyboba.com"
                required
                disabled={lockoutTimer > 0}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-black uppercase tracking-wider text-[#3b2063] ml-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full px-6 py-4 rounded-2xl border border-white/20 focus:border-[#3b2063] focus:ring-4 focus:ring-[#3b2063]/10 outline-none transition-all bg-white/80 placeholder:text-zinc-400"
                  placeholder="••••••••"
                  required
                  disabled={lockoutTimer > 0}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-[#3b2063] p-2 transition-colors"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                      <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center p-8 pt-2 pb-12">
            <button
              type="submit"
              disabled={isLoading || lockoutTimer > 0}
              className="w-full bg-[#3b2063] text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-[#2a174a] active:scale-[0.98] transition-all shadow-xl shadow-purple-900/40 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Authenticating...' : lockoutTimer > 0 ? `Locked (${lockoutTimer}s)` : 'Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;