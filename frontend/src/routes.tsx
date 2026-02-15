import { createBrowserRouter, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SalesOrder from './pages/SalesOrder'; 
import { ProtectedRoute } from './components/ProtectedRoute'; 
import { ErrorFallback } from './components/ErrorFallback'; // Import your custom fallback

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
    errorElement: <ErrorFallback />, // Catches errors during login
  },
  {
    // The Guard: Wraps both Dashboard and POS so they are secure
    element: <ProtectedRoute />,
    errorElement: <ErrorFallback />, // Catches errors inside protected routes
    children: [
      {
        path: '/dashboard',
        element: <Dashboard />,
      },
      {
        path: '/pos',
        element: <SalesOrder />, 
      },
    ],
  },
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    // Catch-all route for any undefined paths (404)
    // This ensures that if a user types a wrong URL, they see your branded error page
    path: '*',
    element: <ErrorFallback />,
  },
]);