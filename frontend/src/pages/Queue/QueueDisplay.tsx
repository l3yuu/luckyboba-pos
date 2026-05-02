import { useState, useEffect } from 'react';
import api from '../../services/api';
import logo from '../../assets/logo.png';
import { ChefHat, CheckCircle, Volume2, Sparkles, Utensils } from 'lucide-react';
import { LocalErrorBoundary } from '../../components/LocalErrorBoundary';

interface QueueItem {
  id: number;
  queue_number: string;
  status: 'preparing' | 'ready';
  source: string;
  customer_name?: string;
  invoice_number?: string;
}

interface BranchOption {
  id: number;
  name: string;
}

const QueueDisplay = () => {
  const [orders, setOrders] = useState<QueueItem[]>([]);
  const [branchName, setBranchName] = useState<string>('Lucky Boba');
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [lastReadyOrder, setLastReadyOrder] = useState<string | null>(null);

  const [branchId, setBranchId] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('branch_id') || localStorage.getItem('kiosk_branch_id');
  });
  const [availableBranches, setAvailableBranches] = useState<BranchOption[]>([]);
  const [isLoadingBranches, setIsLoadingBranches] = useState(true);

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch available branches
  useEffect(() => {
    api.get('/branches/available').then(res => {
      const branches = Array.isArray(res.data?.data) ? res.data.data : [];
      setAvailableBranches(branches);
      
      if (branchId) {
        const branch = branches.find((b: BranchOption) => b.id === parseInt(branchId));
        if (branch) setBranchName(branch.name);
      }
    }).catch(console.error).finally(() => setIsLoadingBranches(false));
  }, [branchId]);

  // Poll queue
  useEffect(() => {
    if (!branchId) return;

    const fetchQueue = async () => {
      try {
        const res = await api.get(`/queue/active?branch_id=${branchId}`);
        if (res.data?.success) {
          const newOrders = Array.isArray(res.data?.data) ? res.data.data : [];
          setOrders(newOrders);

          // Sound notification for new ready order
          const readyOrders = newOrders.filter((o: QueueItem) => o.status === 'ready');
          if (readyOrders.length > 0) {
            const latestReady = readyOrders[readyOrders.length - 1].queue_number;
            if (latestReady !== lastReadyOrder && lastReadyOrder !== null) {
              // Play a ding sound if needed
              // new Audio('/ding.mp3').play().catch(() => {});
            }
            setLastReadyOrder(latestReady);
          }
        }
      } catch (err) {
        console.error("Failed to fetch queue", err);
      }
    };

    fetchQueue();
    const interval = setInterval(fetchQueue, 5000);
    return () => clearInterval(interval);
  }, [branchId, lastReadyOrder]);

  const handleBranchSelect = (id: number) => {
    const newId = id.toString();
    setBranchId(newId);
    // Update URL without page reload
    const url = new URL(window.location.href);
    url.searchParams.set('branch_id', newId);
    window.history.pushState({}, '', url);
  };

  if (!branchId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F0FC] text-purple-950 p-6 relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-300/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-200/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />

        <div className="w-full max-w-4xl z-10 space-y-12">
          {/* Header */}
          <div className="text-center space-y-6">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-purple-200 blur-2xl rounded-full opacity-50 scale-150"></div>
              <img src={logo} alt="Lucky Boba" className="h-40 mx-auto animate-float relative z-10" />
            </div>
            <div className="space-y-2">
              <h1 className="text-6xl font-black text-purple-950 tracking-tight" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                Queue Display
              </h1>
              <p className="text-xl font-medium text-purple-600/70 tracking-widest uppercase">Select a branch to begin</p>
            </div>
          </div>

          {/* Branch Grid */}
          {isLoadingBranches ? (
            <div className="flex flex-col items-center justify-center space-y-4 py-20">
              <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
              <p className="text-purple-400 font-bold uppercase tracking-widest animate-pulse">Loading branches...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableBranches.map((branch, idx) => (
                <button
                  key={branch.id}
                  onClick={() => handleBranchSelect(branch.id)}
                  className="group relative bg-white/60 backdrop-blur-md p-8 rounded-[2.5rem] border border-white shadow-xl shadow-purple-900/5 hover:shadow-2xl hover:shadow-purple-900/10 hover:-translate-y-2 transition-all duration-500 text-left animate-in fade-in zoom-in slide-in-from-bottom-8"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <Sparkles className="text-amber-400" size={24} />
                  </div>
                  
                  <div className="space-y-4">
                    <div className="h-14 w-14 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-200 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                      <Utensils className="text-white" size={28} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-purple-950 group-hover:text-purple-700 transition-colors">
                        {branch.name}
                      </h3>
                      <p className="text-sm font-bold text-purple-400 uppercase tracking-widest mt-1">Ready to serve</p>
                    </div>
                  </div>

                  <div className="mt-8 flex items-center gap-2 text-purple-600 font-black text-sm uppercase tracking-wider group-hover:translate-x-2 transition-transform">
                    View Queue
                    <CheckCircle size={16} />
                  </div>
                </button>
              ))}

              {availableBranches.length === 0 && !isLoadingBranches && (
                <div className="col-span-full bg-white/50 backdrop-blur-sm p-12 rounded-[2.5rem] border border-dashed border-purple-200 text-center">
                  <p className="text-purple-400 font-bold italic">No active branches found. Please check your setup.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  const preparing = (orders || []).filter(o => o.status === 'preparing');
  const ready = (orders || []).filter(o => o.status === 'ready');

  return (
    <div className="h-screen flex flex-col bg-[#F8F6FF] overflow-hidden text-purple-950 font-sans relative">
      {/* Background Decorative Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-purple-300/30 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-green-300/30 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-[20%] right-[30%] w-[30%] h-[30%] bg-amber-300/20 rounded-full blur-[120px] pointer-events-none" />

      {/* ── HEADER ───────────────────────────────────────────────────────────── */}
      <div className="flex-none h-28 px-10 bg-white/80 backdrop-blur-2xl border-b border-purple-100 flex items-center justify-between shadow-sm z-20">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="absolute inset-0 bg-purple-200/50 blur-xl rounded-full"></div>
            <img src={logo} alt="Lucky Boba" className="h-20 w-auto drop-shadow-md relative z-10" />
          </div>
          <div className="flex flex-col">
            <span className="text-4xl font-black text-purple-950 tracking-tight" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Lucky Boba
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
              <span className="text-sm font-bold text-purple-600 uppercase tracking-[0.2em]">{branchName}</span>
            </div>
          </div>
        </div>

        <div className="text-right flex flex-col items-end">
          <span className="text-4xl font-black tracking-wider text-purple-950">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span className="text-sm font-bold text-purple-500 uppercase tracking-widest mt-1">
            {currentTime.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────────── */}
      <div className="flex-1 flex w-full relative z-10 p-6 gap-6">

        {/* Preparing Section (Left) */}
        <div className="flex-[1.2] bg-white rounded-[2rem] border border-purple-200 flex flex-col overflow-hidden shadow-sm">
          {/* Header */}
          <div className="h-24 bg-gradient-to-r from-purple-100 via-purple-50/50 to-transparent border-b border-purple-50 flex items-center px-10 gap-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.5)]" />
            <div className="p-3 bg-white rounded-2xl border border-amber-200 shadow-sm">
              <Utensils size={32} className="text-amber-500" />
            </div>
            <h2 className="text-4xl font-black uppercase tracking-widest text-purple-900">Preparing</h2>
            <div className="ml-auto flex items-center gap-3">
              <span className="bg-purple-100 text-purple-700 px-4 py-1.5 rounded-full text-lg font-bold border border-purple-200">
                {preparing.length} Orders
              </span>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="flex-1 p-6 overflow-y-auto scrollbar-hide bg-[#F8F9FA]">
            <div className="grid grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 auto-rows-max">
              {preparing.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center h-64 text-purple-400 space-y-4">
                  <ChefHat size={64} className="opacity-50" />
                  <p className="text-xl font-medium tracking-wider uppercase text-purple-500">No orders preparing</p>
                </div>
              ) : (
                preparing.map(order => (
                  <div key={order.id} className="flex flex-col items-center justify-center py-4 group">
                    <div className="relative">
                      <span className="text-4xl xl:text-5xl font-black tracking-wider text-purple-900 font-mono group-hover:scale-110 transition-transform">
                        {order.queue_number || '---'}
                      </span>
                      {order.source === 'kiosk' && (
                        <span className="absolute -top-3 -right-6 text-[0.55rem] font-black uppercase tracking-widest text-amber-700 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded-full shadow-sm">K</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Ready Section (Right) */}
        <div className="flex-1 bg-gradient-to-b from-green-50 to-white rounded-[2rem] border border-green-200 flex flex-col overflow-hidden shadow-sm relative">

          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[30%] bg-green-200/50 rounded-full blur-[80px] pointer-events-none" />

          {/* Header */}
          <div className="h-28 bg-gradient-to-r from-green-100 via-green-50/80 to-transparent border-b border-green-100 flex items-center px-10 gap-5 relative overflow-hidden z-10">
            <div className="absolute top-0 left-0 w-2 h-full bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]" />
            <div className="p-3 bg-white rounded-2xl border border-green-200 shadow-sm relative">
              <div className="absolute inset-0 bg-green-200 rounded-2xl animate-ping opacity-50" style={{ animationDuration: '3s' }}></div>
              <CheckCircle size={36} className="text-green-600 relative z-10" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-4xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-green-700 to-emerald-600">Now Serving</h2>
              <span className="text-sm font-bold text-green-600 uppercase tracking-widest mt-1">Please Collect Your Order</span>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="flex-1 p-6 overflow-y-auto scrollbar-hide z-10 relative">
            <div className="grid grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-max">
              {ready.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center h-64 text-green-400 space-y-4">
                  <Volume2 size={64} className="opacity-50 text-green-500" />
                  <p className="text-xl font-medium tracking-wider uppercase text-green-600">Waiting for ready orders</p>
                </div>
              ) : (
                ready.map((order, idx) => (
                  <div key={order.id} className="flex flex-col items-center justify-center py-4 animate-in fade-in zoom-in duration-500" style={{ animationDelay: `${idx * 50}ms` }}>
                    <div className="relative flex flex-col items-center group">
                      {/* Subdued Sparkle */}
                      <div className="absolute -top-4 -right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Sparkles size={16} className="text-green-400 animate-pulse" />
                      </div>

                      <span className="text-5xl xl:text-6xl font-black tracking-widest text-green-600 font-mono group-hover:scale-105 transition-transform">
                        {order.queue_number || '---'}
                      </span>

                      <div className="mt-3 flex items-center gap-1.5 bg-green-100/60 px-3 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping"></span>
                        <span className="text-[0.6rem] font-black uppercase tracking-[0.2em] text-green-700">Ready</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

const WrappedQueueDisplay = () => (
  <LocalErrorBoundary>
    <QueueDisplay />
  </LocalErrorBoundary>
);

export default WrappedQueueDisplay;
