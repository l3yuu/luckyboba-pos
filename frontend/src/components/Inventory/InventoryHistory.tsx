"use client"

import { Loader2, Clock } from 'lucide-react';
import { useCache } from '../../UseCache';

interface LogEntry {
  id: number;
  product_name: string;
  quantity_change: number;
  type: string;
  remarks: string | null;
  created_at: string;
}

interface InventoryHistoryModalProps {
  onClose: () => void;
}

const InventoryHistoryModal: React.FC<InventoryHistoryModalProps> = ({ onClose }) => {
  const { all, loading, ready } = useCache();

  const history = all<LogEntry>('stock_transactions');
  const isLoading = !ready || loading;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-[0.625rem] shadow-2xl flex flex-col max-h-[80vh] animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50 rounded-t-[0.625rem]">
          <div className="flex items-center gap-3">
            <Clock className="text-[#3b2063]" size={20} />
            <h2 className="text-[#3b2063] font-black uppercase tracking-widest text-sm">Stock History</h2>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center rounded-[0.625rem] hover:bg-zinc-200 text-zinc-400 hover:text-zinc-600 transition-colors font-bold text-xl"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="animate-spin text-[#3b2063] mb-4" size={32} />
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Loading Logs...</p>
            </div>
          ) : history.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-100">
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Product</th>
                  <th className="pb-3 text-center">Change</th>
                  <th className="pb-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {history.map((log: LogEntry) => (
                  <tr key={log.id} className="text-xs hover:bg-zinc-50/50 transition-colors">
                    <td className="py-4 text-zinc-500 font-medium">
                      {new Date(log.created_at).toLocaleDateString()}<br />
                      <span className="text-[9px] opacity-60">
                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="py-4 font-bold text-[#3b2063] uppercase">{log.product_name}</td>
                    <td className={`py-4 text-center font-black ${log.quantity_change > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {log.quantity_change > 0 ? `+${log.quantity_change}` : log.quantity_change}
                    </td>
                    <td className="py-4 text-zinc-400 italic text-[10px] leading-relaxed max-w-37.5 truncate hover:whitespace-normal">
                      {log.remarks || 'No remarks'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-12 text-center">
              <p className="text-zinc-400 italic uppercase text-[10px] font-bold tracking-widest">No transactions recorded yet.</p>
            </div>
          )}
        </div>

        <div className="p-4 bg-zinc-50 border-t border-zinc-100 rounded-b-[0.625rem] flex justify-end">
          <button 
            onClick={onClose} 
            className="px-6 py-2 bg-white border border-zinc-200 text-zinc-600 rounded-[0.625rem] font-bold text-[10px] uppercase tracking-widest hover:bg-zinc-100 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default InventoryHistoryModal;