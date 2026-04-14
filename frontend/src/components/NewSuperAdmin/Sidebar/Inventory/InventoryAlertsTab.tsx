import { useState, useEffect, useCallback, useMemo } from "react";
import {
  AlertTriangle, Search, ChevronRight,
  ArrowRightLeft, ShoppingCart, Package, Building2,
  Filter, AlertCircle, TrendingDown,
  MoreVertical, Clock, X, RefreshCw, Minus, Plus
} from "lucide-react";
import { createPortal } from "react-dom";
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

// ── PO/Transfer Specific Types ────────────────────────────────────────────────
interface Supplier { id: number; name: string; }
interface Branch { id: number; name: string; }
interface RawMaterial { id: number; name: string; unit: string; current_stock?: number; }

interface POItem {
  raw_material_id: number;
  material_name?: string;
  unit?: string;
  quantity: number | '';
  unit_cost: number | '';
}

interface TransferItem {
  raw_material_id: number;
  material_name?: string;
  unit?: string;
  quantity: number | '';
}

// ─── Shared UI Helpers ────────────────────────────────────────────────────────
const inputCls = (err?: string) =>
  `w-full text-sm font-medium text-zinc-700 bg-zinc-50 border rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white transition-all ${err ? 'border-red-300 bg-red-50' : 'border-zinc-200'}`;

const Field: React.FC<{ label: string; required?: boolean; error?: string; children: React.ReactNode }> = ({ label, required, error, children }) => (
  <div>
    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5 block">
      {label}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    {children}
    {error && <p className="text-[10px] text-red-500 mt-1 font-medium">{error}</p>}
  </div>
);

// ─── Alert PO Modal ──────────────────────────────────────────────────────────
const AlertPOModal: React.FC<{
  onClose: () => void;
  onCreated: () => void;
  suppliers: Supplier[];
  branches: Branch[];
  rawMaterials: RawMaterial[];
  initialBranchId?: number;
  initialMaterialId?: number;
}> = ({ onClose, onCreated, suppliers, branches, rawMaterials, initialBranchId, initialMaterialId }) => {
  const [supplierId, setSupplierId] = useState<number | ''>('');
  const [branchId, setBranchId] = useState<number | ''>(initialBranchId ?? '');
  const [expectedDate, setExpectedDate] = useState('');
  const [notes, setNotes] = useState('Auto-generated from Stock Alert');
  const [poItems, setPoItems] = useState<POItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [apiErr, setApiErr] = useState('');

  useEffect(() => {
    if (initialMaterialId) {
      const mat = rawMaterials.find(m => m.id === initialMaterialId);
      if (mat) {
        setPoItems([{ 
          raw_material_id: initialMaterialId, 
          material_name: mat.name, 
          unit: mat.unit, 
          quantity: '', 
          unit_cost: '' 
        }]);
      }
    }
  }, [initialMaterialId, rawMaterials]);

  const addRow = () => setPoItems(p => [...p, { raw_material_id: 0, material_name: '', unit: '', quantity: '', unit_cost: '' }]);
  const removeRow = (idx: number) => setPoItems(p => p.filter((_, i) => i !== idx));

  const updateRow = (idx: number, field: keyof POItem, value: POItem[keyof POItem]) => {
    setPoItems(p => p.map((row, i) => {
      if (i !== idx) return row;
      if (field === 'raw_material_id') {
        const mat = rawMaterials.find(m => m.id === Number(value));
        return { ...row, raw_material_id: Number(value), material_name: mat?.name ?? '', unit: mat?.unit ?? '' };
      }
      return { ...row, [field]: value };
    }));
  };

  const handleSubmit = async () => {
    const e: Record<string, string> = {};
    if (!supplierId) e.supplier = 'Required';
    if (!branchId) e.branch = 'Required';
    if (poItems.length === 0) e.items = 'Add items';
    if (Object.keys(e).length) { setErrors(e); return; }

    setSaving(true);
    try {
      await api.post('/purchase-orders', {
        supplier_id: supplierId,
        branch_id: branchId,
        expected_date: expectedDate || null,
        notes,
        items: poItems.map(i => ({ raw_material_id: i.raw_material_id, quantity: Number(i.quantity), unit_cost: Number(i.unit_cost) || 0 })),
      });
      onCreated();
      onClose();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setApiErr(error.response?.data?.message || 'Failed to create PO');
    } finally { setSaving(false); }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-zinc-900/40 backdrop-blur-sm transition-all animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white w-full max-w-2xl border border-zinc-200 rounded-[1.25rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100 bg-zinc-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
              <ShoppingCart size={18} />
            </div>
            <div>
              <p className="text-sm font-black text-[#1a0f2e]">Quick Restock</p>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Create Purchase Order for {initialMaterialId ? 'item' : 'branch'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-400 transition-colors"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-5">
          {apiErr && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-bold">{apiErr}</div>}
          
          <div className="grid grid-cols-2 gap-4">
            <Field label="Supplier" required error={errors.supplier}>
              <select value={supplierId} onChange={e => { setSupplierId(Number(e.target.value)); setErrors({}); }} className={inputCls(errors.supplier)}>
                <option value="">Select supplier...</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
            <Field label="Target Branch" required error={errors.branch}>
              <select value={branchId} onChange={e => { setBranchId(Number(e.target.value)); setErrors({}); }} className={inputCls(errors.branch)}>
                <option value="">Select branch...</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Expected Date">
              <input type="date" value={expectedDate} onChange={e => setExpectedDate(e.target.value)} className={inputCls()} />
            </Field>
            <Field label="Notes">
              <input value={notes} onChange={e => setNotes(e.target.value)} className={inputCls()} placeholder="Internal notes..." />
            </Field>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-black uppercase tracking-widest text-zinc-500">Items to Order</p>
              <button onClick={addRow} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f5f0ff] border border-[#e9d5ff] text-[#3b2063] rounded-lg text-[10px] font-bold hover:bg-[#ede8ff]">
                <Plus size={12} /> Add More
              </button>
            </div>
            <div className="border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 border-b border-zinc-200 text-[9px] font-black uppercase text-zinc-400">
                  <tr>
                    <th className="px-4 py-2 text-left">Material</th>
                    <th className="px-4 py-2 text-right w-24">Qty</th>
                    <th className="px-4 py-2 text-right w-32">Unit Cost</th>
                    <th className="px-4 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {poItems.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-2.5">
                        <select value={item.raw_material_id || ''} onChange={e => updateRow(idx, 'raw_material_id', e.target.value)} className="w-full text-xs font-bold bg-white border border-zinc-200 rounded-lg px-2 py-1.5 outline-none">
                          <option value="">Select...</option>
                          {rawMaterials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-2.5">
                        <input type="number" min="0" value={item.quantity} onChange={e => updateRow(idx, 'quantity', e.target.value)} className="w-full text-xs font-black text-right border border-zinc-200 rounded-lg px-2 py-1.5" />
                      </td>
                      <td className="px-4 py-2.5">
                        <input type="number" min="0" value={item.unit_cost} onChange={e => updateRow(idx, 'unit_cost', e.target.value)} className="w-full text-xs font-bold text-right border border-zinc-200 rounded-lg px-2 py-1.5" placeholder="0.00" />
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <button onClick={() => removeRow(idx)} className="text-zinc-300 hover:text-red-500"><Minus size={14} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 px-6 py-5 border-t border-zinc-100 bg-zinc-50/50 shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 bg-white border border-zinc-200 text-zinc-600 rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-zinc-50">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="flex-1 py-2.5 bg-[#3b2063] hover:bg-[#2a1647] text-white rounded-lg font-bold text-xs uppercase tracking-widest transition-all shadow-sm flex items-center justify-center gap-2">
            {saving ? <><RefreshCw size={14} className="animate-spin" /> Working...</> : 'Create PO'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ─── Alert Transfer Modal ───────────────────────────────────────────────────
const AlertTransferModal: React.FC<{
  onClose: () => void;
  onCreated: () => void;
  branches: Branch[];
  rawMaterials: RawMaterial[];
  initialToBranchId?: number;
  initialMaterialId?: number;
}> = ({ onClose, onCreated, branches, rawMaterials, initialToBranchId, initialMaterialId }) => {
  const [fromBranchId, setFromBranchId] = useState<number | ''>('');
  const [toBranchId, setToBranchId] = useState<number | ''>(initialToBranchId ?? '');
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('Auto-transfer from Stock Alert');
  const [items, setItems] = useState<TransferItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [apiErr, setApiErr] = useState('');

  useEffect(() => {
    if (initialMaterialId) {
      const mat = rawMaterials.find(m => m.id === initialMaterialId);
      if (mat) setItems([{ raw_material_id: initialMaterialId, material_name: mat.name, unit: mat.unit, quantity: '' }]);
    }
  }, [initialMaterialId, rawMaterials]);

  const addRow = () => setItems(p => [...p, { raw_material_id: 0, material_name: '', unit: '', quantity: '' }]);
  const removeRow = (idx: number) => setItems(p => p.filter((_, i) => i !== idx));

  const updateRow = (idx: number, field: keyof TransferItem, value: TransferItem[keyof TransferItem]) => {
    setItems(p => p.map((row, i) => {
      if (i !== idx) return row;
      if (field === 'raw_material_id') {
        const mat = rawMaterials.find(m => m.id === Number(value));
        return { ...row, raw_material_id: Number(value), material_name: mat?.name ?? '', unit: mat?.unit ?? '' };
      }
      return { ...row, [field]: value };
    }));
  };

  const handleSubmit = async () => {
    const e: Record<string, string> = {};
    if (!fromBranchId) e.from = 'Required';
    if (!toBranchId) e.to = 'Required';
    if (items.length === 0) e.items = 'Add items';
    if (Object.keys(e).length) { setErrors(e); return; }

    setSaving(true);
    try {
      await api.post('/stock-transfers', {
        from_branch_id: fromBranchId,
        to_branch_id: toBranchId,
        transfer_date: transferDate,
        notes,
        items: items.map(i => ({ raw_material_id: i.raw_material_id, quantity: Number(i.quantity) })),
      });
      onCreated();
      onClose();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setApiErr(error.response?.data?.message || 'Transfer failed');
    } finally { setSaving(false); }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-zinc-900/40 backdrop-blur-sm transition-all animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white w-full max-w-2xl border border-zinc-200 rounded-[1.25rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100 bg-zinc-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-50 border border-violet-100 rounded-lg flex items-center justify-center text-violet-600">
              <ArrowRightLeft size={18} />
            </div>
            <div>
              <p className="text-sm font-black text-[#1a0f2e]">Quick Transfer</p>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Internal stock movement</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-400 transition-colors"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-6">
          {apiErr && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-bold">{apiErr}</div>}

          <div className="grid grid-cols-[1fr_40px_1fr] items-center gap-4">
            <Field label="Source Branch" required error={errors.from}>
              <select value={fromBranchId} onChange={e => { setFromBranchId(Number(e.target.value)); setErrors({}); }} className={inputCls(errors.from)}>
                <option value="">Select source...</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </Field>
            <div className="pt-5 flex justify-center text-zinc-300"><ChevronRight size={18} /></div>
            <Field label="Destination" required error={errors.to}>
              <select value={toBranchId} onChange={e => { setToBranchId(Number(e.target.value)); setErrors({}); }} className={inputCls(errors.to)}>
                <option value="">Select target...</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Transfer Date">
              <input type="date" value={transferDate} onChange={e => setTransferDate(e.target.value)} className={inputCls()} />
            </Field>
            <Field label="Notes">
              <input value={notes} onChange={e => setNotes(e.target.value)} className={inputCls()} />
            </Field>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-black uppercase tracking-widest text-zinc-500">Materials</p>
              <button onClick={addRow} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f5f0ff] border border-[#e9d5ff] text-[#3b2063] rounded-lg text-[10px] font-bold hover:bg-[#ede8ff]">
                <Plus size={12} /> Add Row
              </button>
            </div>
            <div className="border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 border-b border-zinc-200 text-[9px] font-black uppercase text-zinc-400">
                  <tr>
                    <th className="px-4 py-2 text-left">Internal Name</th>
                    <th className="px-4 py-2 text-right w-32">Quantity</th>
                    <th className="px-4 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-2.5">
                        <select value={item.raw_material_id || ''} onChange={e => updateRow(idx, 'raw_material_id', e.target.value)} className="w-full text-xs font-bold bg-white border border-zinc-200 rounded-lg px-2 py-1.5 outline-none">
                          <option value="">Choose item...</option>
                          {rawMaterials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-2.5">
                        <input type="number" min="0" value={item.quantity} onChange={e => updateRow(idx, 'quantity', e.target.value)} className="w-full text-xs font-black text-right border border-zinc-200 rounded-lg px-2 py-1.5" />
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <button onClick={() => removeRow(idx)} className="text-zinc-300 hover:text-red-500"><Minus size={14} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 px-6 py-5 border-t border-zinc-100 bg-zinc-50/50 shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 bg-white border border-zinc-200 text-zinc-600 rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-zinc-50">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="flex-1 py-2.5 bg-[#3b2063] hover:bg-[#2a1647] text-white rounded-lg font-bold text-xs uppercase tracking-widest transition-all shadow-sm flex items-center justify-center gap-2">
            {saving ? <><RefreshCw size={14} className="animate-spin" /> Moving...</> : 'Initiate Transfer'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: number | string; color?: "violet" | "emerald" | "red" | "amber" }> = ({ icon, label, value, color = "violet" }) => {
  const colors = {
    violet: { bg: "bg-[#f5f0ff]", border: "border-[#e9d5ff]", text: "text-[#3b2063]" },
    emerald: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-600" },
    red: { bg: "bg-red-50", border: "border-red-200", text: "text-red-500" },
    amber: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-600" },
  };
  const c = colors[color as keyof typeof colors];
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

interface AlertProps {
  onNavigate?: (id: string) => void;
}

const InventoryAlertsTab: React.FC<AlertProps> = ({ onNavigate }) => {
  const [data, setData] = useState<BranchAlertGroup[]>([]);
  const [summary, setSummary] = useState<AlertSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState<"all" | Severity>("all");
  const [branchFilter, setBranchFilter] = useState<number | "all">("all");

  // ── Modal State ──
  const [allBranches, setAllBranches] = useState<Branch[]>([]);
  const [suppliers, setSuppliers]     = useState<Supplier[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  
  const [poTarget, setPoTarget]             = useState<{ bId: number; mId: number } | null>(null);
  const [transferTarget, setTransferTarget] = useState<{ bId: number; mId: number } | null>(null);
  const [activeMenu, setActiveMenu]         = useState<{ bId: number; mId: number } | null>(null);

  const branches = useMemo(() => {
    // For filtering, we use branches that have alerts
    return Array.from(new Map(data.map(b => [b.branch_id, { id: b.branch_id, name: b.branch_name }])).values())
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data]);

  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const [alertsRes, brRes, supRes, rmRes] = await Promise.all([
        api.get('/inventory-alerts'),
        api.get('/branches'),
        api.get('/suppliers'),
        api.get('/raw-materials'),
      ]);

      if (alertsRes.data.success) {
        setData(alertsRes.data.data);
        setSummary(alertsRes.data.summary);
      }
      
      setAllBranches(Array.isArray(brRes.data) ? brRes.data : brRes.data?.data ?? []);
      setSuppliers(Array.isArray(supRes.data) ? supRes.data : supRes.data?.data ?? []);
      setRawMaterials(Array.isArray(rmRes.data) ? rmRes.data : rmRes.data?.data ?? []);

    } catch (err) {
      console.error("Failed to fetch alerts", err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(); // Initial load

    const interval = setInterval(() => {
      fetchData(true); // Silent update every 30s
    }, 30000);

    return () => clearInterval(interval);
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
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${branch.critical_count > 0 ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
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
                            <div className={`w-7 h-7 rounded-[0.4rem] flex items-center justify-center shrink-0 ${item.type === 'raw_material' ? 'bg-[#f5f0ff]' : 'bg-blue-50'
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
                            <span className={`text-xs font-black tabular-nums ${item.current_stock <= 0 ? 'text-red-600' : 'text-amber-600'
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
                            <div className={`w-1.5 h-1.5 rounded-full ${item.severity === 'critical' ? 'bg-red-500 animate-pulse' : 'bg-amber-500'
                              }`} />
                            <span className={`text-[10px] font-black uppercase tracking-widest ${item.severity === 'critical' ? 'text-red-600' : 'text-amber-600'
                              }`}>
                              {item.severity}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setPoTarget({ bId: branch.branch_id, mId: item.id })}
                              title="Restock (Purchase Order)"
                              className="p-1.5 hover:bg-emerald-50 text-zinc-400 hover:text-emerald-600 rounded-lg transition-colors border border-transparent hover:border-emerald-100"
                            >
                              <ShoppingCart size={13} />
                            </button>
                            <button
                              onClick={() => setTransferTarget({ bId: branch.branch_id, mId: item.id })}
                              title="Transfer Stock"
                              className="p-1.5 hover:bg-[#f5f0ff] text-zinc-400 hover:text-[#3b2063] rounded-lg transition-colors border border-transparent hover:border-[#e9d5ff]"
                            >
                              <ArrowRightLeft size={13} />
                            </button>
                            <div className="relative">
                              <button
                                onClick={() => setActiveMenu(activeMenu?.mId === item.id && activeMenu?.bId === branch.branch_id ? null : { bId: branch.branch_id, mId: item.id })}
                                className="p-1.5 hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 rounded-lg transition-colors border border-transparent hover:border-zinc-200"
                              >
                                <MoreVertical size={13} />
                              </button>

                              {activeMenu?.mId === item.id && activeMenu?.bId === branch.branch_id && (
                                <>
                                  <div className="fixed inset-0 z-[100]" onClick={() => setActiveMenu(null)} />
                                  <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-zinc-200 rounded-xl shadow-xl z-[101] py-1.5 animate-in fade-in zoom-in-95 duration-200">
                                    <button
                                      onClick={() => { onNavigate?.('raw_materials'); setActiveMenu(null); }}
                                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-50 hover:text-[#3b2063] transition-colors"
                                    >
                                      <Package size={14} className="text-zinc-400" />
                                      Manage Material
                                    </button>
                                    <button
                                      onClick={() => { onNavigate?.('usage_report'); setActiveMenu(null); }}
                                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-50 hover:text-[#3b2063] transition-colors"
                                    >
                                      <Clock size={14} className="text-zinc-400" />
                                      Stock History
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
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
                <button
                  onClick={() => onNavigate?.('inv_overview')}
                  className="text-[#3b2063] font-bold hover:underline flex items-center gap-1"
                >
                  View Full Branch Inventory <ChevronRight size={10} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modals */}
      {poTarget && (
        <AlertPOModal
          suppliers={suppliers}
          branches={allBranches}
          rawMaterials={rawMaterials}
          initialBranchId={poTarget.bId}
          initialMaterialId={poTarget.mId}
          onClose={() => setPoTarget(null)}
          onCreated={fetchData}
        />
      )}

      {transferTarget && (
        <AlertTransferModal
          branches={allBranches}
          rawMaterials={rawMaterials}
          initialToBranchId={transferTarget.bId}
          initialMaterialId={transferTarget.mId}
          onClose={() => setTransferTarget(null)}
          onCreated={fetchData}
        />
      )}
    </div>
  );
};

export default InventoryAlertsTab;
