import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user, logout, isLoading } = useAuth(); // Added isLoading
  const navigate = useNavigate();

  const handleLogout = async () => {
    const success = await logout();
    if (success) {
      navigate('/login', { replace: true });
    }
  };

  // If we are still checking the session, show a clean spinner or blank state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3b2063]"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-zinc-50 p-6">
      <div className="bg-white p-10 rounded-3xl shadow-xl text-center max-w-md w-full">
        <h1 className="text-4xl font-black text-[#3b2063]">Lucky Boba</h1>
        <div className="mt-6 p-4 bg-purple-50 rounded-2xl">
          <p className="text-zinc-600 font-medium">Welcome back,</p>
          <h2 className="text-2xl font-bold text-[#3b2063]">{user?.name || 'Staff Member'}</h2>
          <span className="inline-block mt-2 px-3 py-1 bg-[#3b2063] text-white text-xs rounded-full uppercase tracking-wider font-bold">
            {user?.role || 'User'}
          </span>
        </div>

        <div className="mt-8 space-y-3">
          <p className="text-zinc-500 text-sm">Point of Sale System</p>
          <button 
            onClick={handleLogout}
            className="w-full py-3 text-red-500 font-bold border-2 border-red-100 rounded-xl hover:bg-red-50 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;