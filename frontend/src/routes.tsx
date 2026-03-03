import { createBrowserRouter, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
<<<<<<< HEAD
import SalesOrder from './pages/SalesOrder'; // Import from 'pages' based on your screenshot
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import BranchManagerDashboard from './pages/BranchManagerDashboard';
import Calendar from './pages/Calendar';
import { ProtectedRoute } from './components/ProtectedRoute';
=======
import SalesOrder from './pages/SalesOrder'; 
import { ProtectedRoute } from './components/ProtectedRoute'; 
import { PublicRoute } from './components/PublicRoute'; // Import the new guard
import { ErrorFallback } from './components/ErrorFallback';
>>>>>>> origin/main

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
<<<<<<< HEAD
        path: '/super-admin',
        element: <SuperAdminDashboard />,
      },
      {
        path: '/branch-manager',
        element: <BranchManagerDashboard />,
      },
      {
        path: '/calendar',
        element: <Calendar />,
      },
      {
        path: '/pos',         // New dedicated route for the Menu
        element: <SalesOrder />, // Renders full screen without Sidebar
=======
        path: '/pos',
        element: <SalesOrder />, 
>>>>>>> origin/main
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