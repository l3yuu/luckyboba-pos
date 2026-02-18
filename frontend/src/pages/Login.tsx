import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { LoginCredentials } from '../types/user';
import { Toast } from '../components/Toast'; 
// Asset Imports
import logo from '../assets/logo.png';
import backgroundImage from '../assets/background_image.png'; 

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const [userDismissedToast, setUserDismissedToast] = useState(false);
  
  const { login, isLoading, error, user } = useAuth();
  const navigate = useNavigate();

  // Derived state: Check URL params during render
  const isExpired = searchParams.get('reason') === 'expired';
  const showToast = isExpired && !userDismissedToast;

  // Check if already logged in and redirect
  useEffect(() => {
    const token = localStorage.getItem('lucky_boba_token');
    if (token && user) {
      if (user.role === 'superadmin') {
        navigate('/super-admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [navigate, user]);

  const handleCloseToast = () => {
    setUserDismissedToast(true);
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('reason');
    setSearchParams(newParams, { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const credentials: LoginCredentials = { email, password };
    const loggedInUser = await login(credentials);
  
    if (loggedInUser) {
      localStorage.setItem('user_role', loggedInUser.role);
    
      if (loggedInUser.role === 'superadmin') {
        navigate('/super-admin', { replace: true });
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
      {/* Toast Notification */}
      {showToast && (
        <Toast
          message="Your session has expired. Please log in again."
          type="warning"
          onClose={handleCloseToast}
        />
      )}

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
            {error && (
              <div className="bg-red-100 text-red-700 p-4 rounded-2xl text-xs font-bold border border-red-200">
                {error}
              </div>
            )}

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
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-black uppercase tracking-wider text-[#3b2063] ml-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-6 py-4 rounded-2xl border border-white/20 focus:border-[#3b2063] focus:ring-4 focus:ring-[#3b2063]/10 outline-none transition-all bg-white/80 placeholder:text-zinc-400"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <div className="flex items-center p-8 pt-2 pb-12">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#3b2063] text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-[#2a174a] active:scale-[0.98] transition-all shadow-xl shadow-purple-900/40 disabled:opacity-50"
            >
              {isLoading ? 'Authenticating...' : 'Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
