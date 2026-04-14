import { useState, useEffect, useCallback } from 'react';
import api from '../../../services/api';
import { 
  Search, RefreshCw, 
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
    const items = Object.keys({ ...editBegs, ...editActuals }).map(id => ({
      id: Number(id),
      beg: editBegs[Number(id)] !== undefined ? Number(editBegs[Number(id)]) : undefined,
      actual: editActuals[Number(id)] !== undefined ? Number(editActuals[Number(id)]) : undefined,
    }));

    if (items.length === 0) return;

    setSaving(true);
    try {
      await api.post('/raw-materials/bulk-audit', { items });
      setSuccessMsg('Audit Submitted Successfully');
      setEditBegs({});
      setEditActuals({});
      setTimeout(() => setSuccessMsg(''), 3000);
      loadData();
    } catch (err) {
      console.error('Audit submission failed', err);
      alert('Failed to submit audit');
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
    <div className="p-8 flex items-center justify-center h-[400px]">
      <div className="flex flex-col items-center gap-4">
        <RefreshCw className="animate-spin text-[#3b2063]" size={32} />
        <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Syncing Audit Sheet...</p>
      </div>
    </div>
  );

  return (
    <div className="p-8 tl-usage-panel animate-tl-ready">
      <style>{STYLES}</style>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-[1.75rem] font-black text-slate-900 tracking-tight leading-none mb-2">
            Usage Report Audit
          </h1>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Today's physical count tracking for Branch #{branchId}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="Filter materials..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-slate-50 border-none pl-11 pr-4 py-2.5 rounded-xl text-[11px] font-bold outline-none md:w-64 focus:bg-white focus:ring-2 focus:ring-[#3b206310] transition-all"
            />
          </div>
          <button 
            onClick={() => loadData()}
            className="p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-slate-400"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Audit Commit Notification */}
      <div className="flex items-center justify-between mb-6 h-12">
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
      
      {/* Footer Instructions */}
      <div className="mt-8 flex items-center justify-between opacity-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            <span className="text-[9px] font-black uppercase tracking-widest">Manual BEG Correction</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            <span className="text-[9px] font-black uppercase tracking-widest">Closing Audit Submission</span>
          </div>
        </div>
        <p className="text-[9px] font-black tracking-widest uppercase">System V4.2.1 Audit Protocol</p>
      </div>
    </div>
  );
};

export default UsageReportPanel;
