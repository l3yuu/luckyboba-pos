import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROLE_HOME } from '../utils/roleRoutes';
import logo from '../assets/logo.png';

export const PublicRoute = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
          .lb-auth-page * { font-family: 'DM Sans', sans-serif; box-sizing: border-box; }

          @keyframes lb-spin {
            to { transform: rotate(360deg); }
          }
          @keyframes lb-pulse-dot {
            0%, 100% { opacity: 1; transform: scale(1); }
            50%       { opacity: 0.4; transform: scale(0.85); }
          }
          @keyframes lb-fade-up {
            from { opacity: 0; transform: translateY(12px); }
            to   { opacity: 1; transform: translateY(0); }
          }

          .lb-auth-page {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
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
            position: relative;
            overflow: hidden;
          }

          /* corner blobs */
          .lb-auth-blob {
            position: fixed;
            border-radius: 50%;
            pointer-events: none;
            filter: blur(80px);
            opacity: 0.35;
          }
          .lb-auth-blob-tl { width: 420px; height: 420px; background: #a020f0; top: -180px; left: -180px; }
          .lb-auth-blob-br { width: 380px; height: 380px; background: #5b0ea6; bottom: -160px; right: -160px; }

          /* white card */
          .lb-auth-card {
            position: relative;
            z-index: 1;
            background: #ffffff;
            border: 1px solid #e4e4e7;
            border-radius: 1.25rem;
            padding: 2.75rem 2.5rem;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0;
            box-shadow: 0 32px 80px rgba(0,0,0,0.35), 0 8px 24px rgba(0,0,0,0.15);
            animation: lb-fade-up 0.4s cubic-bezier(0.22,1,0.36,1) both;
            min-width: 300px;
          }

          .lb-auth-logo {
            width: 140px;
            height: auto;
            object-fit: contain;
            margin-bottom: 1.75rem;
            filter: drop-shadow(0 2px 10px rgba(59,32,99,0.1));
          }

          /* spinner ring */
          .lb-auth-spinner-wrap {
            position: relative;
            width: 48px; height: 48px;
            margin-bottom: 1.5rem;
          }

          .lb-auth-spinner-track {
            position: absolute; inset: 0;
            border-radius: 50%;
            border: 3px solid #f0ebff;
          }

          .lb-auth-spinner {
            position: absolute; inset: 0;
            border-radius: 50%;
            border: 3px solid transparent;
            border-top-color: #3b2063;
            animation: lb-spin 0.7s linear infinite;
          }

          /* dots row */
          .lb-auth-dots {
            display: flex;
            gap: 6px;
            align-items: center;
            margin-bottom: 1rem;
          }

          .lb-auth-dot {
            width: 6px; height: 6px;
            border-radius: 50%;
            background: #3b2063;
            animation: lb-pulse-dot 1.2s ease infinite;
          }
          .lb-auth-dot:nth-child(2) { animation-delay: 0.2s; background: #6d28d9; }
          .lb-auth-dot:nth-child(3) { animation-delay: 0.4s; background: #a78bfa; }

          .lb-auth-label {
            font-size: 0.58rem;
            font-weight: 700;
            letter-spacing: 0.26em;
            text-transform: uppercase;
            color: #a1a1aa;
          }

          /* divider */
          .lb-auth-hr {
            width: 100%;
            height: 1px;
            background: #f4f4f5;
            margin: 1.5rem 0 1.25rem;
          }

          .lb-auth-brand {
            font-size: 0.6rem;
            font-weight: 1000;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            color: #d4d4d8;
          }
        `}</style>

        <div className="lb-auth-page">
          <div className="lb-auth-blob lb-auth-blob-tl" />
          <div className="lb-auth-blob lb-auth-blob-br" />

          <div className="lb-auth-card">
            <img src={logo} alt="Lucky Boba" className="lb-auth-logo" />

            <div className="lb-auth-spinner-wrap">
              <div className="lb-auth-spinner-track" />
              <div className="lb-auth-spinner" />
            </div>

            <div className="lb-auth-dots">
              <div className="lb-auth-dot" />
              <div className="lb-auth-dot" />
              <div className="lb-auth-dot" />
            </div>

            <p className="lb-auth-label">Authenticating...</p>

            <div className="lb-auth-hr" />
            <p className="lb-auth-brand">Lucky Boba &copy; 2026</p>
          </div>
        </div>
      </>
    );
  }

  if (user) {
    const role = (user.role as string ?? '').toLowerCase().trim();
    return <Navigate to={ROLE_HOME[role] ?? '/login'} replace />;
  }

  return <Outlet />;
};
