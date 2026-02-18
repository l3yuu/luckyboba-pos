import { createBrowserRouter, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SalesOrder from './pages/SalesOrder'; // Import from 'pages' based on your screenshot
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import BranchManagerDashboard from './pages/BranchManagerDashboard';
import Calendar from './pages/Calendar';
import { ProtectedRoute } from './components/ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    // The Guard: Wraps both Dashboard and POS so they are secure
    element: <ProtectedRoute />,
    children: [
      {
        path: '/dashboard',
        element: <Dashboard />,
      },
      {
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
      },
    ],
  },
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
]);