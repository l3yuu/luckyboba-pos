import React, { useState, useEffect, useRef } from 'react';
import { Search, CreditCard, CalendarDays, Gift, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';
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

// ── PIN confirmation modal ────────────────────────────────────────────────────
interface PinModalProps {
  member: CardMember;
  perk: { id: string; label: string };
  onConfirm: (pin: string) => void;
  onCancel: () => void;
  error: string | null;
  isLoading: boolean;
}

const PinModal: React.FC<PinModalProps> = ({
  member, perk, onConfirm, onCancel, error, isLoading
}) => {
  const [pin, setPin] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.trim()) onConfirm(pin.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-zinc-200 w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-100 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#f5f3ff] flex items-center justify-center flex-shrink-0">
            <ShieldCheck size={20} className="text-[#7c3aed]" />
          </div>
          <div>
            <h3 className="font-bold text-[#1a0f2e] text-base leading-tight">
              Manager Authorization Required
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Claiming <strong>{perk.label}</strong> for{' '}
              <strong>{member.user_name}</strong>
            </p>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <p className="text-sm text-zinc-600">
            Enter your manager PIN to authorize this manual perk claim.
          </p>

          <input
            ref={inputRef}
            type="password"
            inputMode="numeric"
            maxLength={6}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            placeholder="Enter PIN"
            className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-center text-2xl tracking-[0.5em] font-bold text-[#1a0f2e] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/30 focus:border-[#7c3aed] transition-all"
          />

          {error && (
            <div className="flex items-center gap-2 text-red-500 text-xs bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              <AlertCircle size={13} />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 py-2.5 rounded-xl border border-zinc-200 text-sm font-semibold text-zinc-600 hover:bg-zinc-50 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || pin.length < 4}
              className="flex-1 py-2.5 rounded-xl bg-[#7c3aed] text-white text-sm font-bold hover:bg-[#6d28d9] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <ShieldCheck size={15} />
              )}
              {isLoading ? 'Verifying...' : 'Authorize'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

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
        manager_pin: pin,          // ← server validates PIN + logs who authorized
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
        if (error.response?.status === 401) {
          setPinError('Incorrect PIN. Please try again.');
        } else if (error.response?.status === 409) {
          setPinError('This perk has already been claimed today.');
          fetchMembers();
        } else {
          setPinError(msg || 'Something went wrong. Please retry.');
        }
      } else {
        setPinError('Something went wrong. Please retry.');
      }
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

  return (
    <>
      {/* PIN Modal */}
      {pendingClaim && (
        <PinModal
          member={pendingClaim.member}
          perk={pendingClaim.perk}
          onConfirm={handlePinConfirm}
          onCancel={() => { setPendingClaim(null); setPinError(null); }}
          error={pinError}
          isLoading={pinLoading}
        />
      )}

      <div
        className="p-6 md:p-10 max-w-7xl mx-auto fade-in"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >


        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-6">
          <div className="relative w-full sm:w-96">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search by name, email, or card type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 focus:border-[#7c3aed] transition-all shadow-sm"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50/50 border-b border-zinc-200 text-[0.7rem] uppercase tracking-wider text-zinc-500 font-bold">
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Card Type</th>
                  <th className="px-6 py-4">Validity</th>
                  <th className="px-6 py-4">Daily Perks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-zinc-400">
                      <div className="flex justify-center mb-2">
                        <div className="w-6 h-6 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin" />
                      </div>
                      Loading members...
                    </td>
                  </tr>
                ) : filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-zinc-400">
                      No active members found.
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((member) => (
                    <tr
                      key={member.id}
                      className="hover:bg-zinc-50/50 transition-colors"
                    >
                      {/* Customer */}
                      <td className="px-6 py-4 align-middle">
                        <div className="flex flex-col">
                          <span className="font-bold text-[#1a0f2e]">
                            {member.user_name}
                          </span>
                          <span className="text-xs text-zinc-500">
                            {member.user_email}
                          </span>
                        </div>
                      </td>

                      {/* Card type */}
                      <td className="px-6 py-4 align-middle">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-6 bg-[#f5f3ff] rounded flex items-center justify-center border border-[#ede9fe]">
                            <CreditCard size={12} className="text-[#7c3aed]" />
                          </div>
                          <span className="font-medium text-zinc-700 text-xs">
                            {member.card_title}
                          </span>
                        </div>
                      </td>

                      {/* Validity */}
                      <td className="px-6 py-4 align-middle">
                        <div className="flex items-center gap-1.5 text-xs text-zinc-600">
                          <CalendarDays size={12} className="text-zinc-400" />
                          <span>
                            Expires:{' '}
                            <span className="font-medium">{member.expiry_date}</span>
                          </span>
                        </div>
                      </td>

                      {/* Daily Perks */}
                      <td className="px-6 py-4 align-middle">
                        <div className="flex flex-wrap items-center gap-2.5">
                          {DAILY_PERKS.map((perk) => {
                            const isClaimed    = member.claimed_promos?.includes(perk.id);
                            const processKey   = `${member.id}-${perk.id}`;
                            const isProcessing = processingId === processKey;

                            if (isClaimed) {
                              return (
                                <div
                                  key={perk.id}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-50 text-zinc-400 text-xs font-semibold border border-zinc-200 cursor-not-allowed"
                                >
                                  <CheckCircle2 size={13} className="text-zinc-300" />
                                  <span className="line-through decoration-zinc-300">
                                    {perk.label}
                                  </span>
                                </div>
                              );
                            }

                            return (
                              <button
                                key={perk.id}
                                onClick={() => handleClaimClick(member, perk)}
                                disabled={isProcessing}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f5f3ff] text-[#7c3aed] hover:bg-[#7c3aed] hover:text-white text-xs font-bold border border-[#ede9fe] hover:border-[#7c3aed] transition-all disabled:opacity-50 group shadow-sm"
                              >
                                {isProcessing ? (
                                  <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Gift
                                    size={13}
                                    className="text-[#7c3aed] group-hover:text-white transition-colors"
                                  />
                                )}
                                Claim {perk.label}
                              </button>
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