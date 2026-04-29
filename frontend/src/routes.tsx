import { createBrowserRouter, Navigate } from 'react-router-dom';
import Login                   from './pages/Login';
import Dashboard               from './pages/Dashboard';
import SalesOrder              from './pages/SalesOrder';
import SuperAdminDashboard     from './pages/SuperAdminDashboard';
import BranchManagerDashboard  from './pages/BranchManagerDashboard';
import TeamLeaderDashboard     from './pages/TeamLeaderDashboard';
import ITDashboard             from './pages/ITDashboard';
import Calendar                from './pages/Calendar';
import { ProtectedRoute }      from './components/ProtectedRoute';
import { PublicRoute }         from './components/PublicRoute';
import { ErrorFallback }       from './components/ErrorFallback';
import PosDeviceManager        from './pages/PosDeviceManager';
import OnlineOrdersPage        from './components/Cashier/SalesOrder/OnlineOrdersPage'; // ← NEW
import SupervisorDashboard from './pages/SupervisorDashboard';  // ← ADD THIS IMPORT
import KioskPage from './pages/Kiosk/KioskPage';

export const router = createBrowserRouter([

  {
    element:      <PublicRoute />,
    errorElement: <ErrorFallback />,
    children: [
      { path: '/login', element: <Login /> },
    ],    
  },

  // ── Kiosk (Publicly accessible, no redirect if already logged in) ──────────
  { path: '/kiosk', element: <KioskPage />, errorElement: <ErrorFallback /> },

  // ── Super Admin only ─────────────────────────────────────────────────────
  {
    element:      <ProtectedRoute allowedRoles={['super_admin', 'superadmin']} />,
    errorElement: <ErrorFallback />,
    children: [
      {
        children: [
          { path: '/super-admin', element: <SuperAdminDashboard /> },
          { path: '/pos-devices',  element: <PosDeviceManager /> },
        ],
      },
    ],
  },

  // ── System Admin (same dashboard as Super Admin) ──────────────────────────
  {
    element:      <ProtectedRoute allowedRoles={['admin', 'system_admin']} />,
    errorElement: <ErrorFallback />,
    children: [
      {
        children: [
          { path: '/dashboard', element: <Dashboard /> },
          { path: '/calendar',  element: <Calendar /> },
        ],
      },
    ],
  },

  // ── Branch Manager only ──────────────────────────────────────────────────
  {
    element:      <ProtectedRoute allowedRoles={['manager', 'branch_manager']} />,
    errorElement: <ErrorFallback />,
    children: [
      {
        children: [
          { path: '/branch-manager', element: <BranchManagerDashboard /> },
          { path: '/calendar',       element: <Calendar /> },
        ],
      },
    ],
  },

  // ── Supervisor only ──────────────────────────────────────────────────────
{
  element:      <ProtectedRoute allowedRoles={['supervisor']} />,
  errorElement: <ErrorFallback />,
  children: [
    {
      children: [
        { path: '/supervisor', element: <SupervisorDashboard /> },
      ],
    },
  ],
},


  // ── Team Leader only ─────────────────────────────────────────────────────
  {
    element:      <ProtectedRoute allowedRoles={['team_leader']} />,
    errorElement: <ErrorFallback />,
    children: [
      {
        children: [
          { path: '/team-leader', element: <TeamLeaderDashboard /> },
        ],
      },
    ],
  },

  // ── IT Admin only ────────────────────────────────────────────────────────
  {
    element:      <ProtectedRoute allowedRoles={['it_admin']} />,
    errorElement: <ErrorFallback />,
    children: [
      {
        children: [
          { path: '/it-admin', element: <ITDashboard /> },
        ],
      },
    ],
  },

  // ── Cashier only ─────────────────────────────────────────────────────────
{
  element: <ProtectedRoute allowedRoles={['cashier']} />,
  errorElement: <ErrorFallback />,
  children: [
    { path: '/cashier',               element: <Dashboard /> },
    { path: '/cashier/pos',           element: <SalesOrder /> },
    { path: '/cashier/online-orders', element: <OnlineOrdersPage /> },
  ],
},

// ── POS — accessible to cashier, branch_manager, superadmin ──────────────
{
  element: <ProtectedRoute allowedRoles={['cashier', 'branch_manager', 'superadmin']} />,
  errorElement: <ErrorFallback />,
  children: [
    { path: '/pos', element: <SalesOrder /> },
  ],
},

  // ── Root & catch-all ─────────────────────────────────────────────────────
  { path: '/',  element: <Navigate to="/login" replace /> },
  { path: '*',  element: <ErrorFallback /> },
]);
