import { useState, useEffect, useMemo } from 'react';
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

  const branchId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('branch_id') || localStorage.getItem('kiosk_branch_id');
  }, []);

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch branch name
  useEffect(() => {
    if (!branchId) return;
    api.get('/branches/available').then(res => {
      const branches = Array.isArray(res.data?.data) ? res.data.data : [];
      const branch = branches.find((b: BranchOption) => b.id === parseInt(branchId || '0'));
      if (branch) setBranchName(branch.name);
    }).catch(console.error);
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

  if (!branchId) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F4F0FC] text-purple-950">
        <div className="text-center space-y-6 max-w-lg bg-white p-12 rounded-3xl border border-purple-100 shadow-2xl shadow-purple-900/5">
          <img src={logo} alt="Lucky Boba" className="h-32 mx-auto animate-float" />
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-amber-500">Setup Required</h1>
          <p className="text-zinc-500 text-lg">Please select a branch from the Kiosk settings or provide ?branch_id= in the URL</p>
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
            <div className="grid grid-cols-3 gap-6 auto-rows-max">
              {preparing.length === 0 ? (
                <div className="col-span-3 flex flex-col items-center justify-center h-64 text-purple-400 space-y-4">
                  <ChefHat size={64} className="opacity-50" />
                  <p className="text-xl font-medium tracking-wider uppercase text-purple-500">No orders preparing</p>
                </div>
              ) : (
                preparing.map(order => (
                  <div key={order.id} className="relative group">
                    <div className="relative bg-white rounded-lg border border-purple-200 p-6 flex flex-col items-center justify-center aspect-[4/3] shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
                      <span className="text-6xl font-black tracking-wider text-purple-950 font-mono">
                        {order.queue_number || '---'}
                      </span>
                      {order.source === 'kiosk' && (
                        <span className="absolute top-4 right-4 text-[0.65rem] font-black uppercase tracking-widest text-amber-700 bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-full">Kiosk</span>
                      )}
                      <div className="absolute bottom-0 left-0 w-full h-1.5 bg-purple-500 rounded-b-lg"></div>
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
            <div className="grid grid-cols-2 gap-6 auto-rows-max">
              {ready.length === 0 ? (
                <div className="col-span-2 flex flex-col items-center justify-center h-64 text-green-400 space-y-4">
                  <Volume2 size={64} className="opacity-50 text-green-500" />
                  <p className="text-xl font-medium tracking-wider uppercase text-green-600">Waiting for ready orders</p>
                </div>
              ) : (
                ready.map((order, idx) => (
                  <div key={order.id} className="relative group animate-in fade-in zoom-in duration-500 slide-in-from-bottom-4" style={{ animationDelay: `${idx * 100}ms` }}>
                    <div className="relative bg-white rounded-lg border-2 border-green-300 p-8 flex flex-col items-center justify-center aspect-[4/3] shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-green-50 rounded-bl-lg rounded-tr-lg border-l-2 border-b-2 border-green-200 flex items-center justify-center">
                        <Sparkles size={20} className="text-green-500 animate-pulse" />
                      </div>

                      <span className="text-7xl font-black tracking-widest text-green-600 font-mono">
                        {order.queue_number || '---'}
                      </span>

                      <div className="mt-6 flex items-center gap-2 bg-green-100 px-4 py-2 rounded-full border border-green-200">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-ping"></span>
                        <span className="text-xs font-black uppercase tracking-[0.2em] text-green-700">Ready</span>
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
