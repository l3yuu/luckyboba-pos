import { createBrowserRouter, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SalesOrder from './pages/SalesOrder';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import BranchManagerDashboard from './pages/BranchManagerDashboard';
import Calendar from './pages/Calendar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ErrorFallback } from './components/ErrorFallback';

export const router = createBrowserRouter([
  // ── Public ──────────────────────────────────────────────────────────────
  {
    path: '/login',
    element: <Login />,
    errorElement: <ErrorFallback />,
  },

  // ── Super Admin only ─────────────────────────────────────────────────────
  {
    element: <ProtectedRoute allowedRoles={['superadmin']} />,
    errorElement: <ErrorFallback />,
    children: [
      { path: '/super-admin', element: <SuperAdminDashboard /> },
    ],
  },

  // ── Admin only ───────────────────────────────────────────────────────────
  {
    element: <ProtectedRoute allowedRoles={['admin', 'system_admin']} />,
    errorElement: <ErrorFallback />,
    children: [
      { path: '/dashboard', element: <Dashboard /> },
      { path: '/calendar',  element: <Calendar /> },
    ],
  },

  // ── Branch Manager only ──────────────────────────────────────────────────
  {
    element: <ProtectedRoute allowedRoles={['manager', 'branch_manager']} />,
    errorElement: <ErrorFallback />,
    children: [
      { path: '/branch-manager', element: <BranchManagerDashboard /> },
      { path: '/calendar',       element: <Calendar /> },
    ],
  },

  // ── Cashier only ─────────────────────────────────────────────────────────
  {
    element: <ProtectedRoute allowedRoles={['cashier']} />,
    errorElement: <ErrorFallback />,
    children: [
      { path: '/cashier', element: <SalesOrder /> },
    ],
  },

  // ── Root & catch-all ─────────────────────────────────────────────────────
  { path: '/',  element: <Navigate to="/login" replace /> },
  { path: '*',  element: <ErrorFallback /> },
]);