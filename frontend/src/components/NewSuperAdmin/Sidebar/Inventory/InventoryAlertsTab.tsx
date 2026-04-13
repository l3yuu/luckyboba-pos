import { useState, useEffect, useCallback, useMemo } from "react";
import { 
  AlertTriangle, RefreshCw, Search, ChevronRight, 
  ArrowRightLeft, ShoppingCart, Package, Building2,
  Filter, AlertCircle, TrendingDown,
  MoreVertical, Clock
} from "lucide-react";
import api from "../../../../services/api";

type Severity = 'critical' | 'warning';
type ItemType = 'raw_material' | 'product';

interface AlertItem {
  id: number;
  name: string;
  type: ItemType;
  category: string;
  unit: string;
  current_stock: number;
  reorder_level: number;
  status: string;
  severity: Severity;
}

interface BranchAlertGroup {
  branch_id: number;
  branch_name: string;
  alert_count: number;
  critical_count: number;
  items: AlertItem[];
}

interface AlertSummary {
  total_alerts: number;
  critical_total: number;
  affected_branches: number;
}

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: number | string; color?: "violet" | "emerald" | "red" | "amber" }> = ({ icon, label, value, color = "violet" }) => {
  const colors = {
    violet: { bg: "bg-[#f5f0ff]", border: "border-[#e9d5ff]", text: "text-[#3b2063]" },
    emerald: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-600" },
    red: { bg: "bg-red-50", border: "border-red-200", text: "text-red-500" },
    amber: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-600" },
  };
  const c = colors[color];
  return (
    <div className="bg-white border border-zinc-200 rounded-[0.625rem] px-5 py-4 flex items-center gap-3 shadow-sm card">
      <div className={`w-10 h-10 ${c.bg} border ${c.border} flex items-center justify-center rounded-[0.4rem] shrink-0`}>
        <span className={c.text}>{icon}</span>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{label}</p>
        <p className="text-xl font-bold text-[#1a0f2e] tabular-nums leading-tight">{value}</p>
      </div>
    </div>
  );
};

const InventoryAlertsTab: React.FC = () => {
  const [data, setData] = useState<BranchAlertGroup[]>([]);
  const [summary, setSummary] = useState<AlertSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState<"all" | Severity>("all");
  const [branchFilter, setBranchFilter] = useState<number | "all">("all");

  const branches = useMemo(() => {
    return Array.from(new Map(data.map(b => [b.branch_id, { id: b.branch_id, name: b.branch_name }])).values())
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/inventory-alerts');
      if (res.data.success) {
        setData(res.data.data);
        setSummary(res.data.summary);
      }
    } catch (err) {
      console.error("Failed to fetch alerts", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredData = useMemo(() => {
    return data.filter(branch => {
      if (branchFilter !== "all" && branch.branch_id !== branchFilter) {
        return false;
      }
      return true;
    }).map(branch => ({
      ...branch,
      items: branch.items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                              branch.branch_name.toLowerCase().includes(search.toLowerCase());
        const matchesSeverity = severityFilter === "all" || item.severity === severityFilter;
        return matchesSearch && matchesSeverity;
      })
    })).filter(branch => branch.items.length > 0);
  }, [data, search, severityFilter, branchFilter]);

  if (loading && data.length === 0) {
    return (
      <div className="p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-white border border-zinc-100 rounded-[0.625rem] animate-pulse" />
          ))}
        </div>
        <div className="h-[400px] bg-zinc-50 rounded-[0.625rem] animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 fade-in min-h-screen bg-[#f8fafc]">
      {/* Header */}
      <div className="flex items-center justify-end mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchData} 
            disabled={loading}
            className="p-2.5 bg-white border border-zinc-200 text-zinc-600 hover:text-[#3b2063] hover:border-[#3b2063] rounded-lg transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard 
          icon={<AlertTriangle size={16} />} 
          label="Total Alerts" 
          value={summary?.total_alerts || 0} 
          color="amber"
        />
        <StatCard 
          icon={<AlertCircle size={16} />} 
          label="Critical Level" 
          value={summary?.critical_total || 0} 
          color="red"
        />
        <StatCard 
          icon={<Building2 size={16} />} 
          label="Branches Affected" 
          value={summary?.affected_branches || 0} 
          color="violet"
        />
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-zinc-200 rounded-[0.625rem] p-4 mb-6 flex flex-wrap items-center gap-4 shadow-sm">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
          <input 
            type="text" 
            placeholder="Search item or branch..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ede8ff] focus:border-[#3b2063] transition-all"
          />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Building2 size={14} className="text-zinc-400" />
            <select 
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
              className="bg-white border border-zinc-200 text-sm font-semibold text-zinc-600 rounded-lg px-3 py-2 focus:outline-none"
            >
              <option value="all">All Branches</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-zinc-400" />
            <select 
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as "all" | Severity)}
              className="bg-white border border-zinc-200 text-sm font-semibold text-zinc-600 rounded-lg px-3 py-2 focus:outline-none"
            >
            <option value="all">All Levels</option>
            <option value="critical">Critical Only</option>
            <option value="warning">Warning Only</option>
          </select>
        </div>
        </div>
      </div>

      {/* Branch Alert List */}
      <div className="space-y-6">
        {filteredData.length === 0 ? (
          <div className="bg-white border border-dashed border-zinc-200 rounded-[0.625rem] py-16 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-zinc-50 rounded-full flex items-center justify-center mb-4">
              <Package size={24} className="text-zinc-300" />
            </div>
            <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">No stock alerts found</p>
            <p className="text-xs text-zinc-300 mt-1">Great! All branches are properly stocked.</p>
          </div>
        ) : (
          filteredData.map((branch) => (
            <div key={branch.branch_id} className="bg-white border border-zinc-200 rounded-[0.625rem] overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white border border-zinc-200 rounded-lg flex items-center justify-center">
                    <Building2 size={14} className="text-[#3b2063]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#1a0f2e]">{branch.branch_name}</h3>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                      {branch.alert_count} items low on stock
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                    branch.critical_count > 0 ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                  }`}>
                    {branch.critical_count > 0 ? 'Action Required' : 'Monitoring'}
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-50">
                      <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-zinc-400">Item Name</th>
                      <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-zinc-400">Category</th>
                      <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-zinc-400">Current Stock</th>
                      <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-zinc-400">Reorder Level</th>
                      <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-zinc-400">Severity</th>
                      <th className="px-5 py-3 text-right text-[10px] font-black uppercase tracking-widest text-zinc-400">Quick Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {branch.items.map((item) => (
                      <tr key={`${item.type}-${item.id}`} className="border-b border-zinc-50 hover:bg-zinc-50/80 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-7 h-7 rounded-[0.4rem] flex items-center justify-center shrink-0 ${
                              item.type === 'raw_material' ? 'bg-[#f5f0ff]' : 'bg-blue-50'
                            }`}>
                              {item.type === 'raw_material' ? <TrendingDown size={12} className="text-[#3b2063]" /> : <Package size={12} className="text-blue-600" />}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-[#1a0f2e]">{item.name}</p>
                              <p className="text-[9px] text-zinc-400 font-medium uppercase">{item.type.replace('_', ' ')}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="px-2 py-0.5 bg-zinc-100 text-zinc-500 rounded text-[9px] font-bold uppercase tracking-wider">
                            {item.category}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-black tabular-nums ${
                              item.current_stock <= 0 ? 'text-red-600' : 'text-amber-600'
                            }`}>
                              {item.current_stock}
                            </span>
                            <span className="text-[10px] text-zinc-400 font-medium">{item.unit}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-zinc-500 font-medium">
                          {item.reorder_level} {item.unit}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${
                              item.severity === 'critical' ? 'bg-red-500 animate-pulse' : 'bg-amber-500'
                            }`} />
                            <span className={`text-[10px] font-black uppercase tracking-widest ${
                              item.severity === 'critical' ? 'text-red-600' : 'text-amber-600'
                            }`}>
                              {item.severity}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button 
                              title="Restock (Purchase Order)"
                              className="p-1.5 hover:bg-emerald-50 text-zinc-400 hover:text-emerald-600 rounded-lg transition-colors border border-transparent hover:border-emerald-100"
                            >
                              <ShoppingCart size={13} />
                            </button>
                            <button 
                              title="Transfer Stock"
                              className="p-1.5 hover:bg-[#f5f0ff] text-zinc-400 hover:text-[#3b2063] rounded-lg transition-colors border border-transparent hover:border-[#e9d5ff]"
                            >
                              <ArrowRightLeft size={13} />
                            </button>
                            <button className="p-1.5 hover:bg-zinc-100 text-zinc-400 rounded-lg transition-colors">
                              <MoreVertical size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="px-5 py-3 border-t border-zinc-50 bg-zinc-50/30 flex justify-between items-center text-[10px] text-zinc-400 font-medium">
                <div className="flex items-center gap-2">
                  <Clock size={10} />
                  <span>Last check: {new Date().toLocaleTimeString()}</span>
                </div>
                <button className="text-[#3b2063] font-bold hover:underline flex items-center gap-1">
                  View Full Branch Inventory <ChevronRight size={10} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default InventoryAlertsTab;
