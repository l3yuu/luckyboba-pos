import { createBrowserRouter } from 'react-router-dom';

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <div className="flex h-screen items-center justify-center">
        <h1 className="text-2xl font-bold text-[#3b2063]">Lucky Boba POS Dashboard</h1>
      </div>
    ),
  },
  {
    path: "/login",
    element: <div>Login Page Placeholder</div>,
  },
]);