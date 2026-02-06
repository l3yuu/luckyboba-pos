const Dashboard = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-zinc-50">
      <h1 className="text-3xl font-bold text-[#3b2063]">Lucky Boba POS</h1>
      <p className="text-zinc-500 mt-2">Dashboard coming soon...</p>
      <button 
        onClick={() => { localStorage.removeItem('auth_token'); window.location.reload(); }}
        className="mt-6 text-sm text-red-500 underline"
      >
        Logout (Clear Token)
      </button>
    </div>
  );
};

export default Dashboard;