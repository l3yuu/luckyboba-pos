// components/NewSuperAdmin/Sidebar/System/CardApprovalsTab.tsx
import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  CreditCard, CheckCircle, XCircle, Clock, RefreshCw,
  AlertCircle, AlertTriangle, Smartphone, Calendar,
} from "lucide-react";
import api from "../../../../services/api";

// ── Types ──────────────────────────────────────────────────────────────────────
interface PendingRequest {
  id:               number;
  user_name:        string;
  user_email:       string;
  card_title:       string;
  payment_method:   string;
  reference_number: string;
  created_at:       string;
}

// ── Shared UI Components ──────────────────────────────────────────────────────
const StatCard: React.FC<{
  icon: React.ReactNode; label: string; value: string | number;
  sub?: string; color?: "violet" | "emerald" | "amber" | "blue";
}> = ({ icon, label, value, sub, color = "violet" }) => {
  const colors = {
    violet: { bg: "bg-violet-50", border: "border-violet-200", icon: "text-violet-600" },
    emerald: { bg: "bg-emerald-50", border: "border-emerald-200", icon: "text-emerald-600" },
    amber: { bg: "bg-amber-50", border: "border-amber-200", icon: "text-amber-600" },
    blue: { bg: "bg-blue-50", border: "border-blue-200", icon: "text-blue-600" },
  };
  const c = colors[color];
  return (
    <div className="bg-white border border-zinc-200 rounded-[0.625rem] px-6 py-5 flex items-center gap-4 shadow-sm">
      <div className={`w-11 h-11 ${c.bg} border ${c.border} flex items-center justify-center rounded-[0.5rem] shrink-0`}>
        <span className={c.icon}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 truncate">{label}</p>
        <p className="text-xl font-bold text-[#1a0f2e] tabular-nums truncate">{value}</p>
        {sub && <p className="text-[10px] text-zinc-400 font-medium truncate mt-0.5">{sub}</p>}
      </div>
    </div>
  );
};

const Btn: React.FC<{
  children: React.ReactNode; variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md"; onClick?: () => void; className?: string; disabled?: boolean;
}> = ({ children, variant = "primary", size = "sm", onClick, className = "", disabled = false }) => {
  const sizes = { sm: "px-3 py-2 text-xs", md: "px-4 py-2.5 text-sm" };
  const variants = {
    primary: "bg-[#a020f0] hover:bg-[#2a1647] text-white",
    secondary: "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50",
    danger: "bg-red-50 text-red-600 border border-red-100 hover:bg-red-500 hover:text-white",
    ghost: "bg-transparent text-zinc-500 hover:bg-zinc-100",
  };
  return (
    <button onClick={onClick} disabled={disabled}
      className={`inline-flex items-center gap-1.5 font-bold rounded-lg transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 ${sizes[size]} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

const ModalShell: React.FC<{
  onClose: () => void; icon: React.ReactNode; title: string; sub: string;
  children: React.ReactNode; footer: React.ReactNode;
}> = ({ onClose, icon, title, sub, children, footer }) =>
  createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-zinc-900/40 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white w-full max-w-sm border border-zinc-200 rounded-[1.25rem] shadow-2xl overflow-hidden">
        <div className="flex flex-col items-center text-center px-6 pt-8 pb-5">
          <div className="w-14 h-14 bg-violet-50 border border-violet-200 rounded-full flex items-center justify-center mb-4">{icon}</div>
          <p className="text-base font-bold text-[#1a0f2e]">{title}</p>
          <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{sub}</p>
        </div>
        <div className="px-6 pb-2">{children}</div>
        <div className="flex items-center gap-2 px-6 pb-6 mt-4">{footer}</div>
      </div>
    </div>,
    document.body
  );

// ── Confirm Modal (shared for approve & reject) ────────────────────────────────
const ConfirmModal: React.FC<{
  request:   PendingRequest;
  mode:      "approve" | "reject";
  busy:      boolean;
  onConfirm: () => void;
  onCancel:  () => void;
}> = ({ request, mode, busy, onConfirm, onCancel }) => {
  const isApprove = mode === "approve";
  return (
    <ModalShell
      onClose={onCancel}
      icon={isApprove ? <CheckCircle size={26} className="text-emerald-500" /> : <AlertTriangle size={26} className="text-red-500" />}
      title={isApprove ? "Approve Card Registration?" : "Reject Card Registration?"}
      sub={isApprove ? "This will activate the card for 30 days and notify the customer." : "The customer will need to re-submit their payment to try again."}
      footer={
        <>
          <Btn variant="secondary" className="flex-1 justify-center" onClick={onCancel} disabled={busy}>Cancel</Btn>
          <Btn variant={isApprove ? "primary" : "danger"} className="flex-1 justify-center" onClick={onConfirm} disabled={busy}>
            {busy ? (
              <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" /> Processing...</>
            ) : isApprove ? (
              <><CheckCircle size={13} /> Approve</>
            ) : (
              <><XCircle size={13} /> Reject</>
            )}
          </Btn>
        </>
      }
    >
      <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl text-center space-y-1">
        <p className="text-sm font-bold text-[#1a0f2e]">{request.user_name}</p>
        <p className="text-[10px] text-zinc-400">{request.user_email}</p>
        <span className="inline-block text-[10px] font-extrabold bg-violet-50 text-violet-600 px-3 py-1 rounded-full border border-violet-100 tracking-widest mt-2 uppercase">
          {request.card_title}
        </span>
      </div>
    </ModalShell>
  );
};

// ── Request Row Skeleton ───────────────────────────────────────────────────────
const SkeletonRow = () => (
  <tr className="animate-pulse border-b border-zinc-100">
    {[...Array(5)].map((_, i) => (
      <td key={i} className="px-7 py-4">
        <div className="h-3 bg-zinc-100 rounded w-24" />
        {i === 0 && <div className="h-2.5 bg-zinc-100 rounded w-32 mt-1.5" />}
      </td>
    ))}
  </tr>
);

// ── Main Component ─────────────────────────────────────────────────────────────
const CardApprovalsTab: React.FC = () => {
  const [requests,    setRequests]    = useState<PendingRequest[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [confirmData, setConfirmData] = useState<{ request: PendingRequest; mode: "approve" | "reject" } | null>(null);
  const [busyId,      setBusyId]      = useState<number | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchPending = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await api.get("/admin/cards/pending");
      if (res.data?.success) setRequests(res.data.data ?? []);
      else throw new Error("Unexpected response.");
    } catch {
      setError("Failed to load pending requests.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  // ── Confirm handler ────────────────────────────────────────────────────────
  const handleConfirm = async () => {
    if (!confirmData) return;
    const { request, mode } = confirmData;
    setBusyId(request.id);
    try {
      const endpoint = mode === "approve"
        ? `/admin/cards/${request.id}/approve`
        : `/admin/cards/${request.id}/reject`;
      const res = await api.post(endpoint);
      if (res.data?.success) {
        setRequests(prev => prev.filter(r => r.id !== request.id));
        setConfirmData(null);
      } else {
        throw new Error();
      }
    } catch {
      setError(`Failed to ${mode} card. Please try again.`);
    } finally {
      setBusyId(null);
    }
  };

  // ── Derived stats ──────────────────────────────────────────────────────────
  const gcashCount = requests.filter(r => r.payment_method.toLowerCase() === "gcash").length;
  const mayaCount  = requests.filter(r => r.payment_method.toLowerCase() === "maya").length;

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto flex flex-col h-full fade-in">

      {/* Confirm Modal */}
      {confirmData && (
        <ConfirmModal
          request={confirmData.request}
          mode={confirmData.mode}
          busy={busyId === confirmData.request.id}
          onConfirm={handleConfirm}
          onCancel={() => setConfirmData(null)}
        />
      )}

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 mb-6 p-3.5 bg-red-50 border border-red-200 rounded-xl shadow-sm">
          <AlertCircle size={15} className="text-red-500 shrink-0" />
          <p className="text-xs text-red-600 font-bold">{error}</p>
          <Btn variant="secondary" size="sm" onClick={fetchPending} className="ml-auto">Retry</Btn>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={<Clock size={20} />} label="Pending" value={loading ? "—" : requests.length} color="amber" sub="Awaiting review" />
        <StatCard icon={<CreditCard size={20} />} label="GCash" value={loading ? "—" : gcashCount} color="blue" sub="Mobile wallet" />
        <StatCard icon={<Smartphone size={20} />} label="Maya" value={loading ? "—" : mayaCount} color="emerald" sub="Digital bank" />
        <StatCard icon={<CheckCircle size={20} />} label="Today" value="—" color="violet" sub="Processed today" />
      </div>

      {/* Table Container */}
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden flex flex-col flex-1">
        
        {/* Table Header Row */}
        <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between gap-4 bg-zinc-50/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#a020f0] border border-violet-900/10 flex items-center justify-center rounded-xl shrink-0 shadow-sm">
              <RefreshCw size={16} className={`text-white ${loading ? "animate-spin" : ""}`} onClick={fetchPending} />
            </div>
            <div>
              <h3 className="text-sm font-black text-[#1a0f2e] uppercase tracking-wider">Card Approvals</h3>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">Payment Verification Queue</p>
            </div>
          </div>
          {requests.length > 0 && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">{requests.length} Requests</span>
            </div>
          )}
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/30">
                <th className="px-7 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Customer</th>
                <th className="px-7 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Requested Card</th>
                <th className="px-7 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Payment Info</th>
                <th className="px-7 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Date</th>
                <th className="px-7 py-4 text-right text-[10px] font-bold uppercase tracking-widest text-zinc-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {loading ? (
                [...Array(4)].map((_, i) => <SkeletonRow key={i} />)
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle size={28} className="text-emerald-500" />
                    </div>
                    <p className="text-sm font-black text-[#1a0f2e] uppercase tracking-widest italic">All caught up!</p>
                    <p className="text-xs text-zinc-400 mt-1">No pending card registrations at the moment.</p>
                  </td>
                </tr>
              ) : (
                requests.map(req => (
                  <tr key={req.id} className="hover:bg-violet-50/30 transition-colors group">
                    <td className="px-7 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-violet-100 border border-violet-200 flex items-center justify-center font-bold text-violet-700 text-xs">
                          {req.user_name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-black text-[#1a0f2e]">{req.user_name}</div>
                          <div className="text-[10px] text-zinc-400 font-medium">{req.user_email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-7 py-5">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-50 border border-zinc-100 rounded-lg">
                        <CreditCard size={13} className="text-violet-600" />
                        <span className="text-xs font-bold text-[#a020f0]">{req.card_title}</span>
                      </div>
                    </td>
                    <td className="px-7 py-5">
                      <div className="flex items-center gap-2.5">
                        <span className={`px-2 py-0.5 text-[9px] font-black rounded uppercase tracking-wider ${
                          req.payment_method.toLowerCase() === "gcash" ? "bg-blue-100 text-blue-700 border border-blue-200" : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                        }`}>
                          {req.payment_method}
                        </span>
                        <span className="text-xs font-mono font-bold text-zinc-600 tracking-tighter">
                          {req.reference_number}
                        </span>
                      </div>
                    </td>
                    <td className="px-7 py-5">
                      <div className="text-xs font-bold text-zinc-500 flex items-center gap-1.5">
                        <Calendar size={12} className="text-zinc-400" />
                        {new Date(req.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                      </div>
                    </td>
                    <td className="px-7 py-5 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Btn onClick={() => setConfirmData({ request: req, mode: "approve" })} disabled={busyId === req.id} size="sm">
                          <CheckCircle size={14} /> Approve
                        </Btn>
                        <Btn variant="danger" onClick={() => setConfirmData({ request: req, mode: "reject" })} disabled={busyId === req.id} size="sm">
                          <XCircle size={14} /> Reject
                        </Btn>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CardApprovalsTab;
