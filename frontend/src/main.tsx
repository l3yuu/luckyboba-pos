import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { CacheProvider } from './GlobalCache.tsx'

createRoot(document.getElementById('root')!).render(
  <CacheProvider>
    <App />
  </CacheProvider>
)
