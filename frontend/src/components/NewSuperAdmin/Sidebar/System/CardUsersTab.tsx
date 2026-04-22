import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Search, CreditCard, CalendarDays, Gift, CheckCircle2, ShieldCheck, AlertCircle, XCircle, Activity, User } from 'lucide-react';
import api from '../../../../services/api';
import axios from 'axios';

interface CardMember {
  id: number;
  user_id: number;
  card_id: number;
  user_name: string;
  user_email: string;
  card_title: string;
  purchase_date: string;
  expiry_date: string;
  claimed_promos: string[];
  status: string;
}

const DAILY_PERKS = [
  { id: 'buy_1_take_1',   label: 'Buy 1 Take 1' },
  { id: '10_percent_off', label: '10% Off' }
];

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
    primary: "bg-[#a020f0] hover:bg-[#2a1647] text-white shadow-sm",
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
  children: React.ReactNode; footer: React.ReactNode; maxWidth?: string;
}> = ({ onClose, icon, title, sub, children, footer, maxWidth = "max-w-md" }) =>
  createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-zinc-900/40 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      <div className={`relative bg-white w-full ${maxWidth} border border-zinc-200 rounded-[1.25rem] shadow-2xl overflow-hidden flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-50 border border-violet-200 rounded-xl flex items-center justify-center shrink-0">{icon}</div>
            <div>
              <p className="text-sm font-bold text-[#1a0f2e]">{title}</p>
              <p className="text-[10px] text-zinc-400 font-medium">{sub}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-100 rounded-full transition-colors text-zinc-400">
            <XCircle size={18} />
          </button>
        </div>
        <div className="px-6 py-6 flex flex-col gap-5 max-h-[80vh] overflow-y-auto">{children}</div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-100 bg-zinc-50/50">{footer}</div>
      </div>
    </div>,
    document.body
  );

// ── Main component ────────────────────────────────────────────────────────────
const CardUsersTab: React.FC = () => {
  const [members, setMembers]         = useState<CardMember[]>([]);
  const [loading, setLoading]         = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // PIN modal state
  const [pendingClaim, setPendingClaim]   = useState<{
    member: CardMember;
    perk: { id: string; label: string };
  } | null>(null);
  const [pinError, setPinError]           = useState<string | null>(null);
  const [pinLoading, setPinLoading]       = useState(false);

  // Per-row processing key (for spinner)
  const [processingId, setProcessingId]   = useState<string | null>(null);

  const fetchMembers = async () => {
    try {
      const response = await api.get('/admin/cards/users');
      if (response.data.success) setMembers(response.data.data);
    } catch (error) {
      console.error('Error fetching card members:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMembers(); }, []);

  // Step 1 – staff clicks "Claim X" → open PIN modal
  const handleClaimClick = (member: CardMember, perk: { id: string; label: string }) => {
    setPinError(null);
    setPendingClaim({ member, perk });
  };

  // Step 2 – manager enters PIN → POST to server with PIN
  const handlePinConfirm = async (pin: string) => {
    if (!pendingClaim) return;
    const { member, perk } = pendingClaim;
    const processKey = `${member.id}-${perk.id}`;

    setPinLoading(true);
    setPinError(null);
    setProcessingId(processKey);

    try {
      const response = await api.post(`/admin/cards/users/${member.user_id}/log-usage`, {
        card_id:    member.card_id,
        promo_type: perk.id,
        manager_pin: pin,
      });

      if (response.data.success) {
        setPendingClaim(null);
        fetchMembers();
      } else {
        setPinError(response.data.message || 'Authorization failed. Try again.');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.message;
        if (error.response?.status === 401) setPinError('Incorrect PIN. Please try again.');
        else if (error.response?.status === 409) {
          setPinError('This perk has already been claimed today.');
          fetchMembers();
        } else setPinError(msg || 'Something went wrong. Please retry.');
      } else setPinError('Something went wrong. Please retry.');
    } finally {
      setPinLoading(false);
      setProcessingId(null);
    }
  };

  const filteredMembers = members.filter(m =>
    m.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.card_title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = useMemo(() => {
    return {
      total: members.length,
      active: members.filter((m: CardMember) => m.status === 'ACTIVE').length,
      claimsToday: members.reduce((acc: number, m: CardMember) => acc + (m.claimed_promos?.length || 0), 0)
    };
  }, [members]);

  return (
    <>
      {/* PIN Modal */}
      {pendingClaim && (
        <ModalShell
          onClose={() => { setPendingClaim(null); setPinError(null); }}
          icon={<ShieldCheck size={20} className="text-violet-600" />}
          title="Manager Authorization"
          sub={`Authorize "${pendingClaim.perk.label}" for ${pendingClaim.member.user_name}`}
          footer={
            <>
              <Btn variant="secondary" onClick={() => setPendingClaim(null)} className="flex-1 justify-center">Cancel</Btn>
              <Btn onClick={() => handlePinConfirm((document.getElementById('pinInput') as HTMLInputElement)?.value)} disabled={pinLoading} className="flex-1 justify-center">
                {pinLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><ShieldCheck size={15}/> Authorize</>}
              </Btn>
            </>
          }
        >
          <div className="space-y-4">
            <p className="text-xs text-zinc-500 text-center leading-relaxed">
              Enter your manager PIN to authorize this manual perk claim. This action will be logged for audit purposes.
            </p>
            <input
              id="pinInput"
              autoFocus
              type="password"
              inputMode="numeric"
              maxLength={6}
              placeholder="••••"
              className="w-full px-4 py-4 border border-zinc-200 rounded-2xl text-center text-3xl tracking-[0.5em] font-black text-[#1a0f2e] bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-violet-400 focus:border-violet-400 outline-none transition-all shadow-inner"
            />
            {pinError && (
              <div className="flex items-center gap-2 text-red-600 text-[10px] font-bold bg-red-50 border border-red-100 rounded-lg px-3 py-2 animate-shake">
                <AlertCircle size={13} />
                <span>{pinError}</span>
              </div>
            )}
          </div>
        </ModalShell>
      )}

      <div className="p-6 md:p-10 max-w-7xl mx-auto flex flex-col h-full fade-in">
        
        {/* Header Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={<CreditCard size={20} />} label="Active Members" value={stats.active} color="blue" sub="Live cards in app" />
          <StatCard icon={<Gift size={20} />} label="Claims Today" value={stats.claimsToday} color="emerald" sub="Total perks used" />
          <StatCard icon={<CalendarDays size={20} />} label="Total Registered" value={stats.total} color="violet" sub="All-time registrations" />
          <StatCard icon={<Activity size={20} />} label="System Status" value="Healthy" color="emerald" sub="All systems live" />
        </div>

        {/* Main List Container */}
        <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden flex flex-col flex-1">
          
          {/* Sub-header / Filter */}
          <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between gap-4 bg-zinc-50/20">
            <div className="flex-1 min-w-[300px] relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search by name, email, or card type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-400/10 focus:border-violet-500 transition-all font-medium"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{filteredMembers.length} Members Found</span>
            </div>
          </div>

          {/* Table View */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/30">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Customer</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Card Type</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Validity</th>
                  <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-widest text-zinc-400">Daily Perks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-20 text-center">
                      <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <p className="text-xs text-zinc-400 font-bold uppercase tracking-tighter">Syncing Member Data...</p>
                    </td>
                  </tr>
                ) : filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-20 text-center">
                      <div className="w-16 h-16 bg-zinc-50 border border-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <User size={28} className="text-zinc-300" />
                      </div>
                      <p className="text-sm font-black text-[#1a0f2e] uppercase tracking-widest">No members found</p>
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-violet-50/20 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center font-bold text-zinc-500 text-xs">
                            {member.user_name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-black text-[#1a0f2e]">{member.user_name}</div>
                            <div className="text-[10px] text-zinc-400 font-medium">{member.user_email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="inline-flex items-center gap-2 px-2.5 py-1.5 bg-violet-50 border border-violet-100 rounded-lg">
                          <CreditCard size={12} className="text-violet-600" />
                          <span className="text-xs font-bold text-violet-700">{member.card_title}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-0.5">
                          <div className="text-xs font-bold text-zinc-600 flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-emerald-500" />
                            Active Member
                          </div>
                          <div className="text-[10px] text-zinc-400 font-medium flex items-center gap-1">
                            <CalendarDays size={10} />
                            Expires: {member.expiry_date}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          {DAILY_PERKS.map((perk) => {
                            const isClaimed = member.claimed_promos?.includes(perk.id);
                            const processKey = `${member.id}-${perk.id}`;
                            const isProcessing = processingId === processKey;

                            if (isClaimed) {
                              return (
                                <div key={perk.id} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-100 border border-zinc-200 text-[10px] font-bold text-zinc-400 select-none grayscale">
                                  <CheckCircle2 size={13} />
                                  <span className="line-through">{perk.label}</span>
                                </div>
                              );
                            }

                            return (
                              <Btn
                                key={perk.id}
                                onClick={() => handleClaimClick(member, perk)}
                                disabled={isProcessing}
                                variant="secondary"
                                className="group hover:!bg-[#a020f0] hover:!text-white hover:!border-[#a020f0] shadow-sm transition-all"
                              >
                                {isProcessing ? (
                                  <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Gift size={13} className="text-violet-600 group-hover:text-white transition-colors" />
                                )}
                                Claim {perk.label}
                              </Btn>
                            );
                          })}
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
    </>
  );
};

export default CardUsersTab;
