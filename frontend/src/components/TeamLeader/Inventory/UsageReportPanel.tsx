import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import api from '../../../services/api';
import { SkeletonBox } from '../SharedSkeletons';
import { 
  Search, Info,
  AlertCircle, CheckCircle2
} from 'lucide-react';

interface UsageRow {
  id: number;
  name: string;
  unit: string;
  category: string;
  beg: number;
  del: number;
  in: number;
  cooked: number;
  out: number;
  spoil: number;
  end: number; // Theoretical ending (Should Be)
  usage: number;
  variance: number;
}

const STYLES = `
  .tl-usage-panel { font-family: 'DM Sans', sans-serif; }
  .tl-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 1rem; overflow: hidden; }
  .tl-table-head { background: #fff; border-bottom: 1px solid #f1f5f9; }
  .tl-label-caps { font-size: 0.65rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.08em; }
  
  .tl-item-name { font-size: 0.75rem; font-weight: 800; color: #1e293b; }
  .tl-item-sub { font-size: 0.65rem; font-weight: 600; color: #94a3b8; text-transform: capitalize; }
  
  .tl-val-cell { font-size: 0.75rem; font-weight: 600; color: #64748b; }
  
  .tl-input-audit { 
    background: #fff; border: 1.5px solid #e2e8f0; border-radius: 0.4rem; 
    font-weight: 800; font-size: 0.8rem; color: #1e293b; 
    transition: all 0.2s; outline: none; width: 80px; text-align: center;
    padding: 0.5rem 0.2rem;
  }
  .tl-input-audit:focus { border-color: #3b2063; box-shadow: 0 0 0 3px rgba(59, 32, 99, 0.05); }
  .tl-input-audit:disabled { opacity: 0.4; cursor: not-allowed; }
  
  .var-badge {
    display: inline-flex; align-items: center; justify-content: center;
    min-width: 60px; height: 26px; border-radius: 6px;
    font-size: 10px; font-weight: 800; text-transform: capitalize;
  }
  .var-zero { background: #f8fafc; color: #94a3b8; border: 1px solid #e2e8f0; }
  .var-plus { background: #f0fdf4; color: #10b981; border: 1px solid #dcfce7; }
  .var-minus { background: #fff1f2; color: #f43f5e; border: 1px solid #ffe4e6; }
  
  @keyframes tl-fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  .animate-tl-ready { animation: tl-fade-in 0.4s ease-out forwards; }
`;

const UsageReportPanel = ({ branchId }: { branchId: number | null }) => {
  const [data, setData] = useState<UsageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  
  // Audit States
  const [editBegs, setEditBegs] = useState<Record<number, string>>({});
  const [editActuals, setEditActuals] = useState<Record<number, string>>({});
  const [successMsg, setSuccessMsg] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await api.get('/inventory/usage-report', { 
        params: { period: today, branch_id: branchId } 
      });
      setData(res.data);
    } catch (err) {
      console.error('Usage load failed', err);
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSubmitAudit = async () => {
    // Sanitize items: only include if at least one field is set and is a valid number
    const items = Object.keys({ ...editBegs, ...editActuals }).map(id => {
      const bStr = editBegs[Number(id)];
      const aStr = editActuals[Number(id)];
      
      const beg = (bStr !== undefined && bStr !== '') ? Number(bStr) : undefined;
      const actual = (aStr !== undefined && aStr !== '') ? Number(aStr) : undefined;

      // Only send if the value is a valid number IF it was provided
      if (beg !== undefined && isNaN(beg)) return null;
      if (actual !== undefined && isNaN(actual)) return null;

      return {
        id: Number(id),
        beg,
        actual
      };
    }).filter(Boolean);

    if (items.length === 0) return;

    setSaving(true);
    try {
      await api.post('/raw-materials/bulk-audit', { items });
      setSuccessMsg('Audit Submitted Successfully');
      setEditBegs({});
      setEditActuals({});
      setTimeout(() => setSuccessMsg(''), 3000);
      loadData();
    } catch (err: unknown) {
      console.error('Audit submission failed', err);
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.message || 'Failed to submit audit';
        const errors = err.response?.data?.errors;
        if (errors) {
          // Just show the first validation error if any
          const firstErr = Object.values(errors)[0] as string[];
          alert(`${msg}: ${firstErr[0]}`);
        } else {
          alert(msg);
        }
      } else {
        alert('Failed to submit audit');
      }
    } finally {
      setSaving(false);
    }
  };

  const filtered = data.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));

  const renderVariance = (val: number) => {
    if (val === 0) return <span className="var-badge var-zero">Zero</span>;
    if (val > 0) return <span className="var-badge var-plus">+{val.toFixed(2)}</span>;
    return <span className="var-badge var-minus">{val.toFixed(2)}</span>;
  };

  if (loading) return (
    <div className="p-8 space-y-4">
      <div className="mb-8 relative"><SkeletonBox h="h-10" /></div>
      <SkeletonBox h="h-20" />
      <SkeletonBox h="h-20" />
      <SkeletonBox h="h-20" />
    </div>
  );

  return (
    <div className="p-8 tl-usage-panel">
      <style>{STYLES}</style>

      {/* Header */}
      <div className="mb-8">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input 
            type="text" 
            placeholder="Filter materials..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-slate-50 border-none pl-11 pr-4 py-2.5 rounded-xl text-[11px] font-bold outline-none w-full focus:bg-white focus:ring-2 focus:ring-[#3b206310] transition-all"
          />
        </div>
      </div>

      {/* Audit Commit Notification */}
      {(successMsg || Object.keys(editBegs).length > 0 || Object.keys(editActuals).length > 0) && (
      <div className="flex items-center justify-between mb-6">
        <div>
           {successMsg && (
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl animate-tl-ready">
              <CheckCircle2 size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">{successMsg}</span>
            </div>
          )}
        </div>
        
        {(Object.keys(editBegs).length > 0 || Object.keys(editActuals).length > 0) && (
          <div className="flex items-center gap-4 animate-tl-ready">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {Object.keys(editBegs).length + Object.keys(editActuals).length} items modified
            </p>
            <button 
              onClick={handleSubmitAudit}
              disabled={saving}
              className="bg-[#3b2063] text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] shadow-lg shadow-[#3b206320] hover:bg-[#2d1851] disabled:opacity-50 transition-all"
            >
              {saving ? 'Saving...' : 'Commit Audit'}
            </button>
          </div>
        )}
      </div>
      )}

      {/* Main Table */}
      <div className="tl-card border-slate-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="tl-table-head">
              <tr>
                <th className="px-6 py-4 tl-label-caps">Item</th>
                <th className="px-4 py-4 tl-label-caps text-center">Beg</th>
                <th className="px-4 py-4 tl-label-caps text-center">Del</th>
                <th className="px-4 py-4 tl-label-caps text-center">In</th>
                <th className="px-4 py-4 tl-label-caps text-center">Cooked</th>
                <th className="px-4 py-4 tl-label-caps text-center">Out</th>
                <th className="px-4 py-4 tl-label-caps text-center">Spoil</th>
                <th className="px-4 py-4 tl-label-caps text-center">Should Be</th>
                <th className="px-6 py-4 tl-label-caps text-center">Actual</th>
                <th className="px-6 py-4 tl-label-caps text-center">Var</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(r => {
                const isEdited = editBegs[r.id] !== undefined || editActuals[r.id] !== undefined;

                return (
                  <tr key={r.id} className={`hover:bg-slate-50/50 transition-all ${isEdited ? 'bg-indigo-50/30' : ''}`}>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="tl-item-name">{r.name}</span>
                        <span className="tl-item-sub">{r.category} • {r.unit}</span>
                      </div>
                    </td>

                    <td className="px-4 py-5 text-center">
                      <input 
                        type="number" 
                        value={editBegs[r.id] ?? r.beg}
                        onChange={e => setEditBegs(prev => ({ ...prev, [r.id]: e.target.value }))}
                        className="tl-input-audit"
                      />
                    </td>

                    <td className="px-4 py-5 text-center tl-val-cell">{r.del}</td>
                    <td className="px-4 py-5 text-center tl-val-cell">{r.in}</td>
                    <td className="px-4 py-5 text-center tl-val-cell">{r.cooked}</td>
                    <td className="px-4 py-5 text-center tl-val-cell">{r.out}</td>
                    <td className="px-4 py-5 text-center tl-val-cell">{r.spoil}</td>
                    
                    <td className="px-4 py-5 text-center tl-val-cell font-bold text-slate-600">
                      {Number(r.end).toFixed(2)}
                    </td>

                    <td className="px-6 py-5 text-center">
                      <input 
                        type="number" 
                        value={editActuals[r.id] ?? r.end}
                        onChange={e => setEditActuals(prev => ({ ...prev, [r.id]: e.target.value }))}
                        className="tl-input-audit font-black"
                      />
                    </td>

                    <td className="px-6 py-5 text-center">
                      {renderVariance(r.variance)}
                    </td>
                  </tr>
                );
              })}
              
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-20 text-center">
                    <AlertCircle className="mx-auto text-slate-200 mb-2" size={32} />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No matching items for audit</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Inventory Legend */}
      <div className="mt-8 tl-card border-slate-100 bg-slate-50/30 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Info size={14} className="text-[#3b2063]" />
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-800">Inventory Glossary</h4>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-y-6 gap-x-8">
          <div className="space-y-1">
            <p className="font-black text-[10px] text-[#3b2063]">BEG</p>
            <p className="text-[9px] font-bold text-slate-500 leading-relaxed italic">Beginning Inventory: Stock at the start of the day.</p>
          </div>
          <div className="space-y-1">
            <p className="font-black text-[10px] text-[#3b2063]">DEL / IN</p>
            <p className="text-[9px] font-bold text-slate-500 leading-relaxed italic">Deliveries & Transfers In: New stock added to branch.</p>
          </div>
          <div className="space-y-1">
            <p className="font-black text-[10px] text-[#3b2063]">COOKED / OUT</p>
            <p className="text-[9px] font-bold text-slate-500 leading-relaxed italic">Prep Use & Transfers Out: Stock consumed or moved out.</p>
          </div>
          <div className="space-y-1">
            <p className="font-black text-[10px] text-[#3b2063]">SPOIL</p>
            <p className="text-[9px] font-bold text-slate-500 leading-relaxed italic">Spoilage / Loss: Quantity of expired or damaged items.</p>
          </div>
          <div className="space-y-1">
            <p className="font-black text-[10px] text-[#3b2063]">VAR</p>
            <p className="text-[9px] font-bold text-slate-500 leading-relaxed italic">Variance: The difference between Should Be and Actual.</p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between opacity-50 pb-8">
        <p className="text-[9px] font-black tracking-widest uppercase">System V4.2.1 Audit Protocol</p>
        <div className="flex items-center gap-6">
          <span className="text-[9px] font-black uppercase tracking-widest">Calculated: SHOULD BE = BEG + DEL + IN - OUT - SPOIL - USAGE</span>
        </div>
      </div>
    </div>
  );
};

export default UsageReportPanel;
