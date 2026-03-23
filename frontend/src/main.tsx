import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// ── Force reload when a new Service Worker activates ──────────────────────────
// Without this, users on production see stale JS until they close all tabs.
// With this, as soon as a new SW is ready, the page reloads automatically.
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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);