import { createBrowserRouter, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SalesOrder from './pages/SalesOrder'; 
import { ProtectedRoute } from './components/ProtectedRoute'; 
import { ErrorFallback } from './components/ErrorFallback';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
    errorElement: <ErrorFallback />,
  },
  {
    element: <ProtectedRoute />,
    errorElement: <ErrorFallback />,
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
    element: <Navigate to="/login" replace />,
  },
  {
    path: '*',
    element: <ErrorFallback />,
  },
]);
