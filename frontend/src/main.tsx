import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { CacheProvider } from './GlobalCache.tsx';
import { AuthProvider } from './context/AuthContext';
import { registerSW } from 'virtual:pwa-register';

// ── Force reload when a new Service Worker activates ──────────────────────────
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

createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <CacheProvider>
      <App />
    </CacheProvider>
  </AuthProvider>
);