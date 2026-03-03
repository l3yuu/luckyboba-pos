import { createBrowserRouter, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SalesOrder from './pages/SalesOrder'; 
import { ProtectedRoute } from './components/ProtectedRoute'; 
import { PublicRoute } from './components/PublicRoute'; // Import the new guard
import { ErrorFallback } from './components/ErrorFallback';

export const router = createBrowserRouter([
  {
    // Wrap Login in PublicRoute
    element: <PublicRoute />,
    errorElement: <ErrorFallback />,
    children: [
      {
        path: '/login',
        element: <Login />,
      }
    ]
  },
  {
    // Existing Protected Routes
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
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '*',
    element: <ErrorFallback />,
  },
]);