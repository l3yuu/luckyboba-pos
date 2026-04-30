import { useState, useEffect } from 'react';
import api from '../../services/api';
import logo from '../../assets/logo.png';
import { ChefHat, CheckCircle2 } from 'lucide-react';

interface QueueItem {
  id: number;
  queue_number: string;
  status: 'preparing' | 'ready';
  source: string;
  customer_name?: string;
  invoice_number?: string;
}

const QueueDisplay = () => {
  const [orders, setOrders] = useState<QueueItem[]>([]);
  const [branchName, setBranchName] = useState<string>('Lucky Boba');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let branchId = params.get('branch_id') || localStorage.getItem('kiosk_branch_id');

    if (!branchId) {
      setError('Please select a branch from the Kiosk settings or provide ?branch_id= in URL');
      return;
    }

    // Optionally fetch branch details to display the name
    api.get('/branches/available').then(res => {
      // Use any to bypass TS checks for the raw response format
      const branches = (res.data?.data || []) as any[];
      const branch = branches.find((b: any) => b.id === parseInt(branchId!));
      if (branch) setBranchName(branch.name);
    }).catch(console.error);

    const fetchQueue = async () => {
      try {
        const res = await api.get(`/queue/active?branch_id=${branchId}`);
        if (res.data?.success) {
          setOrders(res.data.data);
          setError(null);
        }
      } catch (err) {
        console.error("Failed to fetch queue", err);
      }
    };

    fetchQueue();
    const interval = setInterval(fetchQueue, 5000); // Poll every 5s

    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#1a0f2e] text-white">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-red-400">Setup Required</h1>
          <p className="text-zinc-400">{error}</p>
        </div>
      </div>
    );
  }

  const preparing = orders.filter(o => o.status === 'preparing');
  const ready = orders.filter(o => o.status === 'ready');

  return (
    <div className="h-screen flex flex-col bg-[#0f071f] overflow-hidden text-white font-sans">
      {/* Header */}
      <div className="flex-none h-24 px-8 bg-[#1a0f2e] border-b border-[#3b0764]/50 flex items-center justify-between shadow-2xl z-10">
        <div className="flex items-center gap-4">
          <img src={logo} alt="Lucky Boba" className="h-16 w-auto drop-shadow-lg" />
          <div className="flex flex-col">
            <span className="text-3xl font-black text-white tracking-tighter" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Lucky Boba
            </span>
            <span className="text-sm font-bold text-[#a78bfa] uppercase tracking-widest">{branchName} Queue</span>
          </div>
        </div>
        <div className="text-right">
          <h1 className="text-4xl font-black uppercase tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
            Order Status
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex w-full relative">
        
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
           <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px]" />
           <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]" />
        </div>

        {/* Preparing Column */}
        <div className="flex-1 border-r border-[#3b0764]/30 flex flex-col relative z-10">
          <div className="h-20 bg-gradient-to-r from-[#1a0f2e] to-transparent flex items-center justify-center gap-3 shadow-lg">
            <ChefHat size={32} className="text-blue-400" />
            <h2 className="text-4xl font-black uppercase tracking-widest text-blue-100">Preparing</h2>
          </div>
          <div className="flex-1 p-8 overflow-hidden relative">
            <div className="grid grid-cols-2 gap-6 auto-rows-max h-full">
              {preparing.map(order => (
                <div key={order.id} className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6 flex flex-col items-center justify-center aspect-[2/1] shadow-xl">
                  <span className="text-6xl font-black tracking-widest text-white font-mono">
                    {order.queue_number || '---'}
                  </span>
                  {order.source === 'kiosk' && (
                    <span className="mt-2 text-xs font-bold uppercase tracking-widest text-blue-300 bg-blue-900/40 px-3 py-1 rounded-full">Kiosk</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Ready Column */}
        <div className="flex-[1.2] flex flex-col relative z-10 bg-black/20">
          <div className="h-24 bg-gradient-to-l from-green-900/40 to-transparent flex items-center justify-center gap-4 shadow-lg">
            <CheckCircle2 size={40} className="text-green-400 animate-pulse" />
            <h2 className="text-5xl font-black uppercase tracking-widest text-green-400 drop-shadow-[0_0_15px_rgba(74,222,128,0.5)]">Now Serving</h2>
          </div>
          <div className="flex-1 p-10 overflow-hidden relative">
            <div className="grid grid-cols-2 gap-8 auto-rows-max h-full">
              {ready.map(order => (
                <div key={order.id} className="bg-green-500/10 backdrop-blur-md rounded-3xl border-2 border-green-500/50 p-8 flex flex-col items-center justify-center aspect-[3/2] shadow-[0_0_30px_rgba(74,222,128,0.15)] animate-in fade-in zoom-in duration-500">
                  <span className="text-8xl font-black tracking-widest text-green-300 font-mono drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
                    {order.queue_number || '---'}
                  </span>
                  <span className="mt-4 text-sm font-black uppercase tracking-[0.3em] text-green-400">Please Proceed</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default QueueDisplay;
