import { useState, useEffect, useCallback } from 'react';
import api from '../../../../services/api';
import { CheckCircle, XCircle, Clock, CreditCard } from 'lucide-react';

interface PendingRequest {
  id: number;
  user_name: string;
  user_email: string;
  card_title: string;
  payment_method: string;
  reference_number: string;
  created_at: string;
}

const CardApprovalsTab = () => {
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // ── FETCH PENDING REQUESTS ──
  const fetchPendingRequests = useCallback(async () => {
    setLoading(true);
    try {
      // Using your configured API instance (automatically handles tokens)
      const response = await api.get('/admin/cards/pending');
      if (response.data?.success) {
        setRequests(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch pending requests:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingRequests();
  }, [fetchPendingRequests]);

  // ── APPROVE HANDLER ──
  const handleApprove = async (id: number) => {
    if (!window.confirm("Approve this payment and activate the card for 30 days?")) return;

    try {
      const response = await api.post(`/admin/cards/${id}/approve`);
      if (response.data?.success) {
        alert("Card Approved!");
        // Remove the approved card from the UI instantly
        setRequests((prev) => prev.filter(req => req.id !== id)); 
      }
    } catch (error) {
      console.error("Approve error:", error);
      alert("Error approving card.");
    }
  };

  // ── REJECT HANDLER ──
  const handleReject = async (id: number) => {
    if (!window.confirm("Are you sure you want to reject this request? The user will need to try again.")) return;

    try {
      const response = await api.post(`/admin/cards/${id}/reject`);
      if (response.data?.success) {
        // Remove the rejected card from the UI instantly
        setRequests((prev) => prev.filter(req => req.id !== id));
      }
    } catch (error) {
      console.error("Reject error:", error);
      alert("Error rejecting card.");
    }
  };

  // ── RENDER ──
  return (
    <div className="flex flex-col h-full w-full bg-[#f4f2fb] p-4 md:p-8">
      <div className="bg-white border border-zinc-200 shadow-sm rounded-[0.625rem] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-7 py-5 border-b border-zinc-100 flex justify-between items-center bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#7c14d4] flex items-center justify-center rounded-sm">
              <CreditCard size={18} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1a0f2e] uppercase tracking-widest">
                Pending Card Approvals
              </h3>
              <p className="text-[11px] font-medium text-zinc-400 mt-0.5">
                Review and activate customer GCash/Maya payments
              </p>
            </div>
          </div>
          <div className="bg-orange-50 border border-orange-200 px-4 py-2 flex items-center gap-2 rounded-sm">
            <Clock size={14} className="text-orange-500" />
            <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">
              {requests.length} Pending
            </span>
          </div>
        </div>

        {/* Table Area */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="p-8 text-center text-zinc-400 font-bold uppercase text-xs tracking-widest">
              Loading requests...
            </div>
          ) : requests.length === 0 ? (
            <div className="p-16 text-center">
              <CheckCircle size={40} className="mx-auto text-emerald-400 mb-3" />
              <p className="text-[11px] text-zinc-400 uppercase font-black tracking-[0.2em]">
                All caught up! No pending requests.
              </p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-white z-10 border-b border-[#e9d5ff]">
                <tr>
                  <th className="px-7 py-4 text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em]">Customer</th>
                  <th className="px-7 py-4 text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em]">Requested Card</th>
                  <th className="px-7 py-4 text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em]">Payment Info</th>
                  <th className="px-7 py-4 text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em]">Date</th>
                  <th className="px-7 py-4 text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-[#f5f0ff] transition-colors">
                    <td className="px-7 py-4">
                      <div className="text-sm font-bold text-[#1a0f2e]">{req.user_name}</div>
                      <div className="text-xs text-zinc-500">{req.user_email}</div>
                    </td>
                    <td className="px-7 py-4 text-sm font-bold text-[#7c14d4]">
                      {req.card_title}
                    </td>
                    <td className="px-7 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-[10px] font-black rounded-sm uppercase tracking-wider ${
                          req.payment_method.toLowerCase() === 'gcash' 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {req.payment_method}
                        </span>
                        <span className="text-sm font-mono font-semibold text-zinc-700">
                          {req.reference_number}
                        </span>
                      </div>
                    </td>
                    <td className="px-7 py-4 text-xs font-semibold text-zinc-500">
                      {new Date(req.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-7 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleApprove(req.id)}
                          className="flex items-center gap-1.5 bg-[#7c14d4] hover:bg-[#6a12b8] text-white px-3 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-widest transition-colors"
                        >
                          <CheckCircle size={14} /> Approve
                        </button>
                        <button 
                          onClick={() => handleReject(req.id)}
                          className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-widest transition-colors"
                        >
                          <XCircle size={14} /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default CardApprovalsTab;