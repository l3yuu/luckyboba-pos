import { createBrowserRouter, Navigate } from 'react-router-dom';
import Login from './pages/Login';

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/",
    // This automatically sends users to /login if they land on the root
    element: <Navigate to="/login" replace />,
  },
  {
    // Catch-all: If they type a random URL, send them to login
    path: "*",
    element: <Navigate to="/login" replace />,
  }
]);