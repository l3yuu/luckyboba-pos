import React, { useState, useEffect } from 'react';
import { Search, CreditCard, CalendarDays, Gift, CheckCircle2 } from 'lucide-react';
import api from '../../../../services/api';

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

const CardUsersTab: React.FC = () => {
  const [members, setMembers] = useState<CardMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchMembers = async () => {
    try {
      const response = await api.get('/admin/cards/users');
      if (response.data.success) {
        setMembers(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching card members:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleClaimPromo = async (member: CardMember, perkId: string, perkLabel: string) => {
    if (!window.confirm(`Mark "${perkLabel}" as claimed today for ${member.user_name}?`)) return;
    
    const processKey = `${member.id}-${perkId}`;
    setProcessingId(processKey);
    
    try {
      const response = await api.post(`/admin/cards/users/${member.user_id}/log-usage`, {
        card_id: member.card_id,
        promo_type: perkId
      });
      
      if (response.data.success) {
        fetchMembers();
      }
    } catch (error) {
      console.error("Error logging promo:", error);
      alert("Failed to log promo. Please try again.");
    } finally {
      setProcessingId(null);
    }
  };

  const filteredMembers = members.filter(m => 
    m.user_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.card_title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto fade-in" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1a0f2e] tracking-tight mb-2">Card Members & Usage</h1>
        <p className="text-sm text-zinc-500">Track active subscribers and log their specific daily perks.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-6">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
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
                      <div className="w-6 h-6 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin"></div>
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
                  <tr key={member.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-6 py-4 align-middle">
                      <div className="flex flex-col">
                        <span className="font-bold text-[#1a0f2e]">{member.user_name}</span>
                        <span className="text-xs text-zinc-500">{member.user_email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 align-middle">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-6 bg-[#f5f3ff] rounded flex items-center justify-center border border-[#ede9fe]">
                          <CreditCard size={12} className="text-[#7c3aed]" />
                        </div>
                        <span className="font-medium text-zinc-700 text-xs">{member.card_title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 align-middle">
                      <div className="flex items-center gap-1.5 text-xs text-zinc-600">
                        <CalendarDays size={12} className="text-zinc-400" />
                        <span>Expires: <span className="font-medium">{member.expiry_date}</span></span>
                      </div>
                    </td>
                    <td className="px-6 py-4 align-middle">
                      <div className="flex flex-wrap items-center gap-2.5">
                        {DAILY_PERKS.map((perk) => {
                          const isClaimed = member.claimed_promos?.includes(perk.id);
                          const processKey = `${member.id}-${perk.id}`;
                          const isProcessing = processingId === processKey;

                          if (isClaimed) {
                            return (
                              <div key={perk.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-50 text-zinc-400 text-xs font-semibold border border-zinc-200 cursor-not-allowed">
                                <CheckCircle2 size={13} className="text-zinc-300" />
                                <span className="line-through decoration-zinc-300">{perk.label}</span>
                              </div>
                            );
                          }

                          return (
                            <button
                              key={perk.id}
                              onClick={() => handleClaimPromo(member, perk.id, perk.label)}
                              disabled={isProcessing}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f5f3ff] text-[#7c3aed] hover:bg-[#7c3aed] hover:text-white text-xs font-bold border border-[#ede9fe] hover:border-[#7c3aed] transition-all disabled:opacity-50 group shadow-sm"
                            >
                              {isProcessing ? (
                                <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <Gift size={13} className="text-[#7c3aed] group-hover:text-white transition-colors" />
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
  );
};

export default CardUsersTab;