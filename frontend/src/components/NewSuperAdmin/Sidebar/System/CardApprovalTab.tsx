// components/NewSuperAdmin/Sidebar/System/CardApprovalsTab.tsx
import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  CreditCard, CheckCircle, XCircle, Clock, RefreshCw,
  AlertCircle, AlertTriangle, User, Mail, Hash,
  Smartphone, Calendar,
} from "lucide-react";
import api from "../../../../services/api";

// ── Types ──────────────────────────────────────────────────────────────────────
type ColorKey   = "violet" | "emerald" | "red" | "amber";
type VariantKey = "primary" | "secondary" | "danger" | "ghost";
type SizeKey    = "sm" | "md" | "lg";

interface PendingRequest {
  id:               number;
  user_name:        string;
  user_email:       string;
  card_title:       string;
  payment_method:   string;
  reference_number: string;
  created_at:       string;
}

// ── Shared UI ──────────────────────────────────────────────────────────────────
const Btn: React.FC<{
  children: React.ReactNode; variant?: VariantKey; size?: SizeKey;
  onClick?: () => void; className?: string; disabled?: boolean;
  type?: "button" | "submit" | "reset";
}> = ({ children, variant = "primary", size = "sm", onClick, className = "", disabled = false, type = "button" }) => {
  const sizes:    Record<SizeKey,    string> = { sm: "px-3 py-2 text-xs", md: "px-4 py-2.5 text-sm", lg: "px-6 py-3 text-sm" };
  const variants: Record<VariantKey, string> = {
    primary:   "bg-[#3b2063] hover:bg-[#2a1647] text-white",
    secondary: "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50",
    danger:    "bg-red-600 hover:bg-red-700 text-white",
    ghost:     "bg-transparent text-zinc-500 hover:bg-zinc-100",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`inline-flex items-center gap-1.5 font-bold rounded-lg transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 ${sizes[size]} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

const StatCard: React.FC<{
  icon: React.ReactNode; label: string; value: string | number; color?: ColorKey;
}> = ({ icon, label, value, color = "violet" }) => {
  const colors: Record<ColorKey, { bg: string; border: string; icon: string }> = {
    violet:  { bg: "bg-violet-50",  border: "border-violet-200",  icon: "text-violet-600"  },
    emerald: { bg: "bg-emerald-50", border: "border-emerald-200", icon: "text-emerald-600" },
    red:     { bg: "bg-red-50",     border: "border-red-200",     icon: "text-red-500"     },
    amber:   { bg: "bg-amber-50",   border: "border-amber-200",   icon: "text-amber-600"   },
  };
  const c = colors[color];
  return (
    <div className="bg-white border border-zinc-200 rounded-[0.625rem] px-6 py-5 flex items-center gap-3">
      <div className={`w-10 h-10 ${c.bg} border ${c.border} flex items-center justify-center rounded-[0.4rem] shrink-0`}>
        <span className={c.icon}>{icon}</span>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{label}</p>
        <p className="text-xl font-bold text-[#1a0f2e] tabular-nums">{value}</p>
      </div>
    </div>
  );
};

// ── Shared portal backdrop ─────────────────────────────────────────────────────
const BACKDROP_STYLE: React.CSSProperties = {
  backdropFilter:       "blur(6px)",
  WebkitBackdropFilter: "blur(6px)",
  backgroundColor:      "rgba(0,0,0,0.45)",
};

// ── Confirm Modal (shared for approve & reject) ────────────────────────────────
const ConfirmModal: React.FC<{
  request:   PendingRequest;
  mode:      "approve" | "reject";
  busy:      boolean;
  onConfirm: () => void;
  onCancel:  () => void;
}> = ({ request, mode, busy, onConfirm, onCancel }) => {
  const isApprove = mode === "approve";
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6" style={BACKDROP_STYLE}>
      <div className="absolute inset-0" onClick={onCancel} />
      <div className="relative bg-white w-full max-w-sm border border-zinc-200 rounded-[1.25rem] shadow-2xl">

        {/* Icon + copy */}
        <div className="flex flex-col items-center text-center px-6 pt-8 pb-5">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 border ${
            isApprove ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"
          }`}>
            {isApprove
              ? <CheckCircle size={26} className="text-emerald-500" />
              : <AlertTriangle size={26} className="text-red-500" />
            }
          </div>
          <p className="text-base font-bold text-[#1a0f2e]">
            {isApprove ? "Approve Card Registration?" : "Reject Card Registration?"}
          </p>
          <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
            {isApprove
              ? "This will activate the card for 30 days and notify the customer."
              : "The customer will need to re-submit their payment to try again."
            }
          </p>
        </div>

        {/* Request info pill */}
        <div className="mx-6 mb-5 p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-center space-y-1">
          <p className="text-sm font-bold text-[#1a0f2e]">{request.user_name}</p>
          <p className="text-[10px] text-zinc-400">{request.user_email}</p>
          <span className="inline-block text-[10px] font-bold bg-violet-50 text-violet-600 px-2.5 py-0.5 rounded-full border border-violet-200 tracking-widest mt-1">
            {request.card_title}
          </span>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 px-6 pb-6">
          <Btn variant="secondary" className="flex-1 justify-center" onClick={onCancel} disabled={busy}>
            Cancel
          </Btn>
          <Btn
            variant={isApprove ? "primary" : "danger"}
            className="flex-1 justify-center"
            onClick={onConfirm}
            disabled={busy}
          >
            {busy
              ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" /> Processing…</>
              : isApprove
                ? <><CheckCircle size={13} /> Approve</>
                : <><XCircle     size={13} /> Reject</>
            }
          </Btn>
        </div>
      </div>
    </div>,
    document.body
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
    <div className="p-6 md:p-8 fade-in">

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

      {/* Header */}
      <div className="flex items-center justify-end mb-5 flex-wrap gap-3">
        <Btn variant="secondary" onClick={fetchPending} disabled={loading}>
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
        </Btn>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle size={14} className="text-red-500 shrink-0" />
          <p className="text-xs text-red-600 font-medium">{error}</p>
          <Btn variant="secondary" size="sm" onClick={fetchPending} className="ml-auto">Retry</Btn>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<Clock        size={16} />} label="Pending"   value={loading ? "—" : requests.length} color="amber"   />
        <StatCard icon={<CreditCard   size={16} />} label="GCash"     value={loading ? "—" : gcashCount}      color="violet"  />
        <StatCard icon={<Smartphone   size={16} />} label="Maya"      value={loading ? "—" : mayaCount}       color="emerald" />
        <StatCard icon={<CheckCircle  size={16} />} label="Processed" value="—"                               color="red"     />
      </div>

      {/* Table card */}
      <div className="bg-white border border-zinc-200 shadow-sm rounded-[0.625rem] overflow-hidden">

        {/* Table header bar */}
        <div className="px-7 py-5 border-b border-zinc-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#3b2063] flex items-center justify-center rounded-sm">
              <CreditCard size={18} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1a0f2e] uppercase tracking-widest">
                Pending Card Approvals
              </h3>
              <p className="text-[11px] font-medium text-zinc-400 mt-0.5">
                Review and activate customer GCash / Maya payments
              </p>
            </div>
          </div>
          <div className="bg-orange-50 border border-orange-200 px-4 py-2 flex items-center gap-2 rounded-sm">
            <Clock size={14} className="text-orange-500" />
            <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">
              {loading ? "…" : requests.length} Pending
            </span>
          </div>
        </div>

        {/* Table body */}
        <div className="overflow-auto">
          {/* Empty state */}
          {!loading && requests.length === 0 && !error && (
            <div className="p-16 text-center">
              <div className="w-14 h-14 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle size={26} className="text-emerald-500" />
              </div>
              <p className="text-[11px] text-zinc-400 uppercase font-black tracking-[0.2em]">
                All caught up! No pending requests.
              </p>
            </div>
          )}

          {/* Table */}
          {(loading || requests.length > 0) && (
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-white z-10 border-b border-[#e9d5ff]">
                <tr>
                  {[
                    { icon: <User    size={9} />, label: "Customer"       },
                    { icon: <CreditCard size={9}/>, label: "Requested Card"},
                    { icon: <Hash    size={9} />, label: "Payment Info"   },
                    { icon: <Calendar size={9}/>, label: "Date"           },
                    { icon: null,                 label: "Actions", right: true },
                  ].map(({ icon, label, right }) => (
                    <th key={label}
                      className={`px-7 py-4 text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] ${right ? "text-right" : ""}`}>
                      <span className="inline-flex items-center gap-1">
                        {icon}{label}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {loading
                  ? [...Array(4)].map((_, i) => <SkeletonRow key={i} />)
                  : requests.map(req => (
                    <tr key={req.id} className="hover:bg-[#f5f0ff] transition-colors">

                      {/* Customer */}
                      <td className="px-7 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-violet-100 border border-violet-200 flex items-center justify-center shrink-0">
                            <User size={12} className="text-violet-600" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-[#1a0f2e]">{req.user_name}</div>
                            <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                              <Mail size={9} />{req.user_email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Card title */}
                      <td className="px-7 py-4">
                        <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#3b2063]">
                          <CreditCard size={13} />{req.card_title}
                        </span>
                      </td>

                      {/* Payment info */}
                      <td className="px-7 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 text-[10px] font-black rounded-sm uppercase tracking-wider ${
                            req.payment_method.toLowerCase() === "gcash"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}>
                            {req.payment_method}
                          </span>
                          <span className="flex items-center gap-1 text-sm font-mono font-semibold text-zinc-700">
                            <Hash size={10} className="text-zinc-400" />
                            {req.reference_number}
                          </span>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-7 py-4">
                        <span className="flex items-center gap-1 text-xs font-semibold text-zinc-500">
                          <Calendar size={10} />
                          {new Date(req.created_at).toLocaleDateString("en-PH", {
                            month: "short", day: "numeric", year: "numeric",
                          })}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-7 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setConfirmData({ request: req, mode: "approve" })}
                            disabled={busyId === req.id}
                            className="flex items-center gap-1.5 bg-[#3b2063] hover:bg-[#6a12b8] text-white px-3 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-50"
                          >
                            {busyId === req.id
                              ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                              : <CheckCircle size={14} />
                            }
                            Approve
                          </button>
                          <button
                            onClick={() => setConfirmData({ request: req, mode: "reject" })}
                            disabled={busyId === req.id}
                            className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-50"
                          >
                            <XCircle size={14} /> Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default CardApprovalsTab;