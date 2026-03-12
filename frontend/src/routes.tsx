import { createBrowserRouter, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SalesOrder from './pages/SalesOrder';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import BranchManagerDashboard from './pages/BranchManagerDashboard';
import Calendar from './pages/Calendar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PublicRoute } from './components/PublicRoute';
import { ErrorFallback } from './components/ErrorFallback';
import IdleWrapper from './components/IdleWrapper';

export const router = createBrowserRouter([
  // ── Public ──────────────────────────────────────────────────────────────
  {
    element: <PublicRoute />,
    errorElement: <ErrorFallback />,
    children: [
      { path: '/login', element: <Login /> },
    ]
  },

  // ── Super Admin only ─────────────────────────────────────────────────────
  {
    element: <ProtectedRoute allowedRoles={['super_admin', 'superadmin']} />,
    errorElement: <ErrorFallback />,
    children: [
      {
        element: <IdleWrapper />,
        children: [
          { path: '/super-admin', element: <SuperAdminDashboard /> },
        ],
      },
    ],
  },

  // ── Admin only ───────────────────────────────────────────────────────────
  {
    element: <ProtectedRoute allowedRoles={['admin', 'system_admin']} />,
    errorElement: <ErrorFallback />,
    children: [
      {
        element: <IdleWrapper />,
        children: [
          { path: '/dashboard', element: <Dashboard /> },
          { path: '/calendar',  element: <Calendar /> },
        ],
      },
    ],
  },

  // ── Branch Manager only ──────────────────────────────────────────────────
  {
    element: <ProtectedRoute allowedRoles={['manager', 'branch_manager']} />,
    errorElement: <ErrorFallback />,
    children: [
      {
        element: <IdleWrapper />,
        children: [
          { path: '/branch-manager', element: <BranchManagerDashboard /> },
          { path: '/calendar',       element: <Calendar /> },
        ],
      },
    ],
  },

  // ── Cashier only ─────────────────────────────────────────────────────────
  {
    element: <ProtectedRoute allowedRoles={['cashier']} />,
    errorElement: <ErrorFallback />,
    children: [
      {
        element: <IdleWrapper />,
        children: [
          { path: '/cashier',     element: <Dashboard /> },
          { path: '/cashier/pos', element: <SalesOrder /> },
        ],
      },
    ],
  },

  // ── POS — accessible to cashier, branch_manager, superadmin ──────────────
  {
    element: <ProtectedRoute allowedRoles={['cashier', 'branch_manager', 'superadmin']} />,
    errorElement: <ErrorFallback />,
    children: [
      {
        element: <IdleWrapper />,
        children: [
          { path: '/pos', element: <SalesOrder /> },
        ],
      },
    ],
  },

  // ── Root & catch-all ─────────────────────────────────────────────────────
  { path: '/',  element: <Navigate to="/login" replace /> },
  { path: '*',  element: <ErrorFallback /> },
]);