import { createBrowserRouter, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
<<<<<<< HEAD
import SalesOrder from './pages/SalesOrder'; 
import { ProtectedRoute } from './components/ProtectedRoute'; 
import { ErrorFallback } from './components/ErrorFallback';
=======
import SalesOrder from './pages/SalesOrder'; // Import from 'pages' based on your screenshot
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import BranchManagerDashboard from './pages/BranchManagerDashboard';
import Calendar from './pages/Calendar';
import { ProtectedRoute } from './components/ProtectedRoute';
>>>>>>> ddec0ef95aab049e456d303aa7b689355bce6983

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
<<<<<<< HEAD
        path: '/pos',
        element: <SalesOrder />, 
=======
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
>>>>>>> ddec0ef95aab049e456d303aa7b689355bce6983
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
