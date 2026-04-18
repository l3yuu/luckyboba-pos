// frontend/src/App.tsx
// Added <DeviceGate> — blocks unregistered devices before anything loads.

import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider } from './context/ToastProvider';
import { DeviceGate } from './components/DeviceGate';       // ← Removed .tsx extension
import { prefetchAll } from './utils/prefetch';
import { useAuth } from './hooks/useAuth';
import { useServiceWorker } from './hooks/useServiceWorker';
import PWAUpdateBanner from './components/PWAUpdateBanner';

function App() {
  const { user, isLoading } = useAuth();
  const { needsUpdate, applyUpdate } = useServiceWorker();

  useEffect(() => {
    if (user && !isLoading) {
      prefetchAll();
    }
  }, [user, isLoading]);

  return (
    <ErrorBoundary
      fallback={
        <div className="h-screen flex flex-col items-center justify-center p-4 text-center">
          <h1 className="text-2xl font-bold text-red-600">POS Interface Error</h1>
          <button
            onClick={() => window.location.href = '/'}
            className="mt-6 bg-[#3b2063] text-white px-8 py-3 rounded-full font-bold"
          >
            Back to Dashboard
          </button>
        </div>
      }
    >
      <ToastProvider>
        {/* DeviceGate checks if this device is registered before rendering anything */}
        <DeviceGate>
          <RouterProvider router={router} />
          <PWAUpdateBanner needsUpdate={needsUpdate} onUpdate={applyUpdate} />
        </DeviceGate>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;