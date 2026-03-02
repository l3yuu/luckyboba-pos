import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { AuthProvider } from './context/AuthContext';

createRoot(document.getElementById('root')!).render(
  <CacheProvider>
    <AuthProvider>
      <App />
    </AuthProvider>
  </CacheProvider>
);

