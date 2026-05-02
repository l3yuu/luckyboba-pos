import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { CacheProvider } from './GlobalCache';
import { AuthProvider } from './context/AuthContext';
import { registerSW } from 'virtual:pwa-register';
import { ErrorBoundary } from './components/ErrorBoundary';
import { bustCacheOnNewDeploy } from './utils/cacheBuster';

// Note: No window.print() override needed.
// Chrome App Mode provides native print preview out of the box.
// The Electron shell (if used) will use its own print handling via preload.js.

// ── Clear all caches on new deployment, then boot the app ─────────────────────
bustCacheOnNewDeploy().then((wasCleared) => {
  if (wasCleared) {
    // Reload once to ensure the browser loads fresh assets
    window.location.reload();
    return;
  }

  // ── Register Service Worker (only after cache check passes) ───────────────
  registerSW({
    onNeedRefresh() {
      window.location.reload();
    },
    onOfflineReady() {
      console.log('[PWA] App ready to work offline.');
    },
    onRegisterError(error) {
      console.error('[PWA] SW registration failed:', error);
    },
  });

  // ── Mount the React app ───────────────────────────────────────────────────
  createRoot(document.getElementById('root')!).render(
    <ErrorBoundary
      fallback={
        <div className="h-screen flex flex-col items-center justify-center p-4 text-center">
          <h1 className="text-2xl font-bold text-red-600">Lucky Boba POS Global Error</h1>
          <p className="mt-2 text-gray-500">Check browser console for details.</p>
          <button
            onClick={() => window.location.href = '/'}
            className="mt-6 bg-[#6a12b8] text-white px-8 py-3 rounded-full font-bold"
          >
            Reload Dashboard
          </button>
        </div>
      }
    >
      <AuthProvider>
        <CacheProvider>
          <App />
        </CacheProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
});
