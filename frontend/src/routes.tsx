import { createBrowserRouter, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
<<<<<<< HEAD
import SalesOrder from './pages/SalesOrder';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import { ProtectedRoute } from './components/ProtectedRoute';

// Helper function to determine default route based on user role
const getDefaultRoute = () => {
  const userRole = localStorage.getItem('user_role');
  const token = localStorage.getItem('auth_token');
  
  if (!token) {
    return '/login';
  }
  
  if (userRole === 'superadmin') {
    return '/super-admin';
  }
  
  return '/dashboard';
};
=======
import SalesOrder from './pages/SalesOrder'; // Import from 'pages' based on your screenshot
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import { ProtectedRoute } from './components/ProtectedRoute';
>>>>>>> 9057bc1bbe00a3ae4125184c77f2d07a9d510873

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    // The Guard: Wraps all protected routes
    element: <ProtectedRoute />,
    children: [
      {
        path: '/dashboard',
        element: <Dashboard />,
      },
      {
<<<<<<< HEAD
        path: '/pos',
        element: <SalesOrder />,
      },
      {
        path: '/super-admin',
        element: <SuperAdminDashboard />,
=======
        path: '/super-admin',
        element: <SuperAdminDashboard />,
      },
      {
        path: '/pos',         // New dedicated route for the Menu
        element: <SalesOrder />, // Renders full screen without Sidebar
>>>>>>> 9057bc1bbe00a3ae4125184c77f2d07a9d510873
      },
    ],
  },
  {
    path: '/',
    element: <Navigate to={getDefaultRoute()} replace />,
  },
  {
    // Catch all - redirect to default route
    path: '*',
    element: <Navigate to={getDefaultRoute()} replace />,
  },
]);
