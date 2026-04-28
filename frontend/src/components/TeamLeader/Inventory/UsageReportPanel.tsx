"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, X, Download, ChevronDown, ChevronUp,
  BarChart3, TrendingUp, TrendingDown, Clock, Info,
  Coffee, Calendar, Trash2
} from 'lucide-react';
import api from '../../../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UsageRow {
  id: number;
  name: string;
  unit: string;
  category: string;
  beg: number;  // beginning stock
  del: number;  // deliveries
  in: number;   // transfers in
  cooked: number;  // intermediate produced
  out: number;  // consumed/sold
  spoil: number;  // spoilage
  end: number;
  usage: number;
  variance: number;
  incoming: number;
}

interface Movement {
  id: number;
  type: string;
  quantity: number;
  before: number | null;
  after: number | null;
  reason: string;
  performed_by: string;
  created_at: string;
}

interface UsageBreakdown {
  product_name: string;
  cup_size_label: string;
  recipe_quantity: number;
  total_sold: number;
  total_deducted: number;
}



// ─── Helpers ──────────────────────────────────────────────────────────────────

const varianceColor = (v: number) => {
  if (v === 0) return { text: '#71717a', bg: '#f4f4f5', border: '#e4e4e7' }; // Neutral Gray
  if (v > 0) return { text: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' }; // Surplus Green
  return { text: '#dc2626', bg: '#fef2f2', border: '#fecaca' }; // Loss Red
};

const varianceLabel = (v: number) => {
  if (v === 0) return 'Zero';
  if (v > 0) return `+${v}`;
  return String(v);
};

const timeAgo = (d: string) => {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(d).toLocaleDateString();
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const MovementDrawer: React.FC<{
  row: UsageRow;
  period: string;
  onClose: () => void;
}> = ({ row, period, onClose }) => {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/raw-materials/movements', { params: { raw_material_id: row.id, period } })
      .then((r: { data: unknown }) => setMovements(Array.isArray(r.data) ? (r.data as Movement[]) : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [row.id, period]);

  const getStatusCfg = (m: Movement) => {
    switch (m.type) {
      case 'add': return { icon: <TrendingUp size={14} />, color: '#16a34a', bg: '#f0fdf4', label: 'Restock' };
      case 'subtract': return { icon: <TrendingDown size={14} />, color: '#dc2626', bg: '#fef2f2', label: 'Usage' };
      case 'waste': return { icon: <Trash2 size={14} className="text-red-500" />, color: '#ea580c', bg: '#fff7ed', label: 'Waste' };
      case 'set': return { icon: <Clock size={14} />, color: '#6a12b8', bg: '#f5f0ff', label: 'Audit' };
      default: return { icon: <Info size={14} />, color: '#71717a', bg: '#f4f4f5', label: 'Update' };
    }
  };

  return (
    <div className="fixed inset-0 z-9999 flex justify-end"
      style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(26, 15, 46, 0.4)' }}>
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md h-full flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.15)] animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-6 border-b border-zinc-100 bg-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#6a12b8] rounded-2xl flex items-center justify-center shadow-lg shadow-purple-100">
              <Clock size={20} className="text-white" />
            </div>
            <div>
              <p className="text-base font-black text-[#1a0f2e] tracking-tight">{row.name}</p>
              <p className="text-[10px] text-zinc-400 uppercase font-black tracking-widest mt-0.5">Report Period: {period}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-xl text-zinc-400 hover:text-zinc-600 transition-all">
            <X size={20} />
          </button>
        </div>

        {/* Global Summary for the Period */}
        <div className="grid grid-cols-3 bg-[#faf9ff] border-b border-zinc-100">
          {[
            { label: 'BEG', value: row.beg, color: '#71717a' },
            { label: 'USED', value: row.usage, color: '#6a12b8' },
            { label: 'END', value: row.end, color: '#1a0f2e' },
          ].map(s => (
            <div key={s.label} className="text-center py-4 border-r border-zinc-100 last:border-0">
              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1">{s.label}</p>
              <p className="text-lg font-black tabular-nums" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[9px] text-zinc-400 font-bold">{row.unit}</p>
            </div>
          ))}
        </div>

        {/* Timeline Content */}
        <div className="flex-1 overflow-y-auto px-6 py-8 custom-scrollbar bg-[#fafafa]">
          {loading ? (
             <div className="space-y-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-zinc-100 animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-zinc-100 rounded animate-pulse w-1/3" />
                    <div className="h-12 bg-zinc-100 rounded-xl animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : movements.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center opacity-40">
              <Clock size={32} className="text-zinc-300" />
              <div>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">No Movements</p>
                <p className="text-[10px] text-zinc-400 mt-1">No recorded changes for this item in {period}.</p>
              </div>
            </div>
          ) : (
            <div className="relative space-y-8">
              {/* Vertical Line */}
              <div className="absolute left-[15px] top-2 bottom-2 w-[2px] bg-gradient-to-b from-zinc-100 via-zinc-200 to-zinc-100" />

              {movements.map((m) => {
                const cfg = getStatusCfg(m);
                const isLegacy = m.before === null || m.after === null;
                const diff = (m.after || 0) - (m.before || 0);

                return (
                  <div key={m.id} className="relative flex gap-6 group">
                    {/* Node */}
                    <div className="z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-4 border-white shadow-sm"
                         style={{ background: cfg.bg, color: cfg.color }}>
                      {cfg.icon}
                    </div>

                    {/* Card */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <p className="text-[11px] font-black text-zinc-900 uppercase tracking-tight">{cfg.label}</p>
                          <span className="text-[10px] text-zinc-400">•</span>
                          <span className="text-[11px] text-zinc-500 font-medium">{timeAgo(m.created_at)}</span>
                        </div>
                        {isLegacy && (
                          <span className="text-[9px] font-black bg-zinc-100 text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-200 uppercase tracking-tighter">Legacy</span>
                        )}
                      </div>

                      <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm group-hover:shadow-md transition-shadow">
                        {/* Snapshot Flow */}
                        <div className="flex items-center gap-4 mb-3">
                          <div className="flex-1 overflow-hidden">
                            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Before</p>
                            <p className="text-sm font-black text-zinc-600 tabular-nums">
                              {m.before !== null ? Number(m.before).toFixed(2) : '??'}
                            </p>
                          </div>
                          <div className="shrink-0 flex flex-col items-center">
                            <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${diff >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                              {diff >= 0 ? '+' : ''}{diff.toFixed(2)}
                            </div>
                            <div className="h-4 w-[1px] bg-zinc-100 my-0.5" />
                          </div>
                          <div className="flex-1 text-right overflow-hidden">
                            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1">After</p>
                            <p className="text-sm font-black text-zinc-900 tabular-nums" style={{ color: cfg.color }}>
                              {m.after !== null ? Number(m.after).toFixed(2) : '??'}
                            </p>
                          </div>
                        </div>

                        {/* Details */}
                        <div className="pt-3 border-t border-zinc-50 space-y-2">
                          <p className="text-xs text-zinc-700 leading-relaxed font-medium capitalize truncate">
                            {m.reason}
                          </p>
                          <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center gap-1.5">
                              <div className="w-4 h-4 bg-zinc-100 rounded-full flex items-center justify-center text-[8px] font-bold text-zinc-400">
                                {m.performed_by.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-[10px] text-zinc-500 font-bold">{m.performed_by}</span>
                            </div>
                            <span className="text-[9px] text-zinc-300 font-bold tabular-nums">ID #{m.id}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Product Sold Card ────────────────────────────────────────────────────────

interface ProductSalesData {
  category_name: string;
  product_name: string;
  cup_size_label?: string;
  sizes: Record<string, number>;
  total_sold: number;
  usage?: Array<{ name: string; qty: number; unit: string }>;
}

const ProductSoldCard: React.FC<{
  data: ProductSalesData[];
  loading: boolean;
}> = ({ data, loading }) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');

  if (loading) {
    return (
      <div className="bg-white border border-zinc-200 rounded-[0.625rem] p-5 shadow-sm h-full">
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-4 italic">Calculating sales...</p>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 bg-zinc-100 rounded w-1/2 animate-pulse" />
              <div className="h-10 bg-zinc-50 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const filteredData = data.filter(p => 
    p.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const grouped = filteredData.reduce((acc, item) => {
    if (!acc[item.category_name]) acc[item.category_name] = [];
    acc[item.category_name].push(item);
    return acc;
  }, {} as Record<string, ProductSalesData[]>);

  const toggleExpanded = (key: string) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-[0.625rem] flex flex-col shadow-sm h-full overflow-hidden text-zinc-900">
      <div className="px-5 py-4 border-b border-zinc-100 bg-[#faf9ff]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Coffee size={14} className="text-[#6a12b8]" />
            <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#1a0f2e]">Product Sold Summary</p>
          </div>
          <span className="text-[10px] font-bold text-zinc-400 bg-white border border-zinc-100 px-2 py-0.5 rounded-full">
            {filteredData.length} Items
          </span>
        </div>
        
        {/* Search Bar */}
        <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 focus-within:border-[#6a12b8] transition-colors shadow-sm">
          <Search size={12} className="text-zinc-400" />
          <input
            type="text"
            placeholder="Search sold items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent text-[10px] font-bold text-[#1a0f2e] outline-none placeholder:text-zinc-300 placeholder:font-normal"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="text-zinc-300 hover:text-red-500">
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center opacity-40">
            <Coffee size={32} className="mb-2" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">No sales data</p>
          </div>
        ) : (
          Object.entries(grouped).map(([cat, products]) => (
            <div key={cat} className="mb-6 last:mb-0">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-[1px] flex-1 bg-zinc-100" />
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] px-1 whitespace-nowrap">{cat}</p>
                <div className="h-[1px] flex-1 bg-zinc-100" />
              </div>
              <div className="space-y-3">
                {products.map((p, idx) => {
                  const itemKey = `${cat}-${p.product_name}-${p.cup_size_label || 'default'}`;
                  const isExpanded = expanded[itemKey];

                  return (
                    <div key={idx} className="bg-zinc-50 border border-zinc-100 rounded-lg overflow-hidden hover:border-[#e9d5ff] transition-all group">
                      <div
                        className="p-3 cursor-pointer hover:bg-[#faf9ff] transition-colors"
                        onClick={() => toggleExpanded(itemKey)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[11px] font-bold text-[#1a0f2e] group-hover:text-[#6a12b8] transition-colors pr-2">
                            {p.product_name} {p.cup_size_label && (
                              <span className="text-[10px] font-medium text-zinc-400">{p.cup_size_label}</span>
                            )}
                          </p>
                          <div className="flex items-center gap-3">
                            <p className="text-xs font-black text-[#6a12b8] tabular-nums">{p.total_sold}</p>
                            <div className="text-zinc-400">
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </div>
                          </div>
                        </div>

                        {/* Size Breakdown (optional if user wants to keep tags too) */}
                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(p.sizes || {}).map(([size, qty]) => (
                            Number(qty) > 0 && (
                              <div key={size} className="flex items-center gap-1 bg-white border border-zinc-100 rounded px-1.5 py-0.5">
                                <span className="text-[8px] font-bold text-zinc-400 uppercase">{size}</span>
                                <span className="text-[10px] font-black text-[#1a0f2e] tabular-nums">{qty}</span>
                              </div>
                            )
                          ))}
                        </div>
                      </div>

                      {/* Material Usage Breakdown (Accordion) */}
                      {isExpanded && (
                        <div className="px-3 pb-3 pt-2 border-t border-zinc-100/50 bg-white">
                          <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Material Usage Summary</p>
                          {p.usage && p.usage.length > 0 ? (
                            <div className="grid grid-cols-1 gap-1">
                              {p.usage.map((u, uIdx) => (
                                <div key={uIdx} className="flex items-center justify-between text-[10px] group/item">
                                  <span className="text-zinc-500 group-hover/item:text-zinc-900 transition-colors truncate pr-2 max-w-[150px]">{u.name}</span>
                                  <span className="font-bold text-zinc-700 whitespace-nowrap">
                                    {u.qty.toLocaleString(undefined, { maximumFractionDigits: 3 })} <span className="text-[9px] text-zinc-400 font-normal">{u.unit}</span>
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[9px] text-zinc-400 italic py-1">No material usage deductions recorded for this specific size/period.</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="px-5 py-3 border-t border-zinc-100 bg-[#fdfdfd] text-center">
        <p className="text-[9px] text-zinc-400 font-medium">Synced with Inventory Period</p>
      </div>
    </div>
  );
};

const UsageBreakdownDrawer: React.FC<{
  row: UsageRow;
  period: string;
  branch: string;
  onClose: () => void;
}> = ({ row, period, branch, onClose }) => {
  const [items, setItems] = useState<UsageBreakdown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/inventory/usage-report/breakdown/${row.id}`, {
      params: { period, branch_id: branch || undefined }
    })
      .then((r: { data: UsageBreakdown[] | undefined }) => setItems(r.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [row.id, period, branch]);

  return (
    <div className="fixed inset-0 z-9999 flex justify-end"
      style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.35)' }}>
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 bg-[#faf9ff]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#6a12b8] rounded-lg flex items-center justify-center">
              <Coffee size={14} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#1a0f2e] leading-tight">{row.name}</p>
              <p className="text-[10px] text-zinc-400 uppercase tracking-widest">Recipe Usage Breakdown</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-400">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 flex-1 overflow-y-auto">
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-zinc-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2 text-center">
              <BarChart3 size={32} className="text-zinc-200" />
              <p className="text-xs font-bold text-zinc-300 uppercase tracking-widest">No recipe deductions found</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-12 px-2 text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1">
                <div className="col-span-6">Product</div>
                <div className="col-span-2 text-center">Sold</div>
                <div className="col-span-4 text-right">Deducted</div>
              </div>
              {items.map((it, idx) => (
                <div key={idx} className="bg-zinc-50 border border-zinc-100 rounded-lg p-3 hover:bg-[#faf9ff] transition-colors">
                  <div className="grid grid-cols-12 items-center">
                    <div className="col-span-6">
                      <p className="text-[11px] font-bold text-[#1a0f2e]">{it.product_name}</p>
                      <p className="text-[10px] text-zinc-400">{it.cup_size_label} · {it.recipe_quantity ?? 0} {row.unit}/cup</p>
                    </div>
                    <div className="col-span-2 text-center">
                      <p className="text-xs font-black text-[#6a12b8]">{it.total_sold}</p>
                      <p className="text-[8px] text-zinc-400 uppercase">Cups</p>
                    </div>
                    <div className="col-span-4 text-right">
                      <p className="text-xs font-black text-[#1a0f2e] tabular-nums">{it.total_deducted}</p>
                      <p className="text-[8px] text-zinc-400 uppercase">{row.unit} total</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-5 border-t border-zinc-100 bg-[#6a12b8] text-white">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">Total Consumption</span>
            <span className="text-lg font-black">{row.out} {row.unit}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const COLUMN_GUIDE: Record<string, string> = {
  BEG: 'Beginning stock at start of period',
  DEL: 'Deliveries / stock additions received',
  IN: 'Internal transfers received',
  COOKED: 'Intermediate items produced in-house',
  OUT: 'Consumed via sales (auto-deducted)',
  SPOIL: 'Spoilage or manual write-offs',
  'SHOULD BE': 'Calculated theoretical ending stock',
  ACTUAL: 'Physically counted stock (Audited)',
  VAR: 'Variance = ACTUAL − SHOULD BE',
  INCOMING: 'Pending stock from approved purchase orders',
};

const UsageReportPanel: React.FC<{ branchId: number | null }> = ({ branchId }) => {
  const now = new Date();
  const [rows, setRows] = useState<UsageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [varFilter, setVarFilter] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [showGuide, setShowGuide] = useState(false);
  const [drawerRow, setDrawerRow] = useState<UsageRow | null>(null);
  const [breakdownRow, setBreakdownRow] = useState<UsageRow | null>(null);
  const [exporting, setExporting] = useState(false);
  const [viewMode, setViewMode] = useState<'today' | 'monthly' | 'specific'>('today');
  const [specificDate, setSpecificDate] = useState(now.toISOString().split('T')[0]);
  const [productSales, setProductSales] = useState<ProductSalesData[]>([]);
  const [salesLoading, setSalesLoading] = useState(false);
  const [editingCounts, setEditingCounts] = useState<Record<number, string>>({});
  const [isSavingAudit, setIsSavingAudit] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    setUserRole(localStorage.getItem('role'));
  }, []);

  const period = viewMode === 'today'
    ? now.toISOString().split('T')[0]
    : viewMode === 'specific'
      ? specificDate
      : `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;

  const fetchReport = useCallback(async (isSilent = false) => {
    if (!isSilent) {
      setLoading(true);
      setSalesLoading(true);
    }
    try {
      const [reportRes, salesRes] = await Promise.allSettled([
        api.get('/inventory/usage-report', { params: { period, branch_id: branchId || undefined } }),
        api.get('/inventory/usage-report/get-product-sales', { params: { period, branch_id: branchId || undefined } }),
      ]);
      if (reportRes.status === 'fulfilled') {
        const d = reportRes.value.data;
        setRows(Array.isArray(d) ? d : d?.data ?? []);
      }
      if (salesRes.status === 'fulfilled') {
        setProductSales(salesRes.value.data ?? []);
      }
    } catch (e) { console.error(e); }
    finally {
      setLoading(false);
      setSalesLoading(false);
      setLastUpdated(new Date());
    }
  }, [period, branchId]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  // Polling for automated updates
  useEffect(() => {
    const timer = setInterval(() => {
      // Only poll when not explicitly loading and not in monthly mode (which is historical)
      if (!loading && viewMode !== 'monthly') {
        fetchReport(true);
      }
    }, 30000); // 30 seconds
    return () => clearInterval(timer);
  }, [fetchReport, loading, viewMode]);

  const handleSubmitAudit = async () => {
    const dirtyItems = Object.entries(editingCounts)
      .filter(([_, value]) => value !== '')
      .map(([id, value]) => ({
        id: Number(id),
        actual: Number(value),
      }));

    if (dirtyItems.length === 0) return;

    setIsSavingAudit(true);
    try {
      await api.post('/raw-materials/bulk-audit', { items: dirtyItems });
      setEditingCounts({});
      fetchReport();
      alert('Inventory audit successfully committed.');
    } catch (e) {
      console.error(e);
      alert('Failed to save audit.');
    } finally {
      setIsSavingAudit(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await api.get('/inventory/usage-report/export', {
        params: { period, branch_id: branchId || undefined },
        responseType: 'blob',
      });
      const url = URL.createObjectURL(res.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `usage-report-${period}${viewMode === 'today' ? '-today' : viewMode === 'specific' ? '-specific' : '-monthly'}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) { console.error(e); }
    finally { setExporting(false); }
  };

  const filtered = rows.filter(r => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter ? r.category === catFilter : true;
    const matchVar = varFilter === 'negative' ? r.variance < 0
      : varFilter === 'positive' ? r.variance > 0
        : varFilter === 'zero' ? r.variance === 0
          : true;
    return matchSearch && matchCat && matchVar;
  });

  const cats = [...new Set(rows.map(r => r.category))].filter(Boolean);

  // Summary stats
  const totalUsage = rows.reduce((s, r) => s + r.usage, 0);
  const totalSpoil = rows.reduce((s, r) => s + r.spoil, 0);
  const negVar = rows.filter(r => r.variance < 0).length;
  const posVar = rows.filter(r => r.variance > 0).length;

  const Skeleton = () => (
    <>
      {[...Array(7)].map((_, i) => (
        <tr key={i} className="border-b border-zinc-50">
          {[...Array(9)].map((_, j) => (
            <td key={j} className="px-4 py-3.5">
              <div className="h-3 bg-zinc-100 rounded animate-pulse" style={{ width: `${50 + (j * 7) % 40}%` }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );

  return (
    <div className="p-6 md:p-8 bg-[#f4f2fb] min-h-full">


      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
        {[
          { label: 'Total Items', value: rows.length, color: '#6a12b8', bg: '#f5f0ff', border: '#e9d5ff' },
          { label: 'Total Usage', value: totalUsage, color: '#1a0f2e', bg: '#faf9ff', border: '#e9d5ff' },
          { label: 'Total Spoilage', value: totalSpoil, color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
          { label: 'Pending Arrival', value: rows.reduce((s, r) => s + (r.incoming || 0), 0), color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
        ].map(s => (
          <div key={s.label} className="bg-white border rounded-[0.625rem] px-5 py-4 shadow-sm" style={{ borderColor: s.border }}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">{s.label}</p>
            <p className="text-2xl font-black tabular-nums" style={{ color: s.color }}>{loading ? '—' : s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters & Content Layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">

        {/* Left Side: Filters + Table */}
        <div className="flex-1 w-full bg-white border border-zinc-200 rounded-[0.625rem] overflow-hidden shadow-sm">
          <div className="flex flex-wrap items-center justify-between px-5 py-4 border-b border-zinc-100 bg-[#faf9ff]">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1 bg-white border border-emerald-100 rounded-full shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Live Updates</span>
                <div className="w-[1px] h-3 bg-emerald-100 hidden sm:block" />
                <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-tight hidden sm:block">
                  Synced: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-2 text-zinc-400">
              <Clock size={12} />
              <span className="text-[10px] font-bold uppercase tracking-widest">{viewMode === 'today' ? 'Real-time Ledger' : 'Historical Record'}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-zinc-100">

            {/* Period selector */}
            <div className="flex items-center gap-1.5 bg-white border border-zinc-200 rounded-[0.625rem] p-1 shadow-sm">
              {[
                { id: 'today', label: 'Today', icon: <Clock size={12} /> },
                { id: 'monthly', label: 'Monthly', icon: <BarChart3 size={12} /> },
                { id: 'specific', label: 'Specific', icon: <Calendar size={12} /> },
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => setViewMode(m.id as 'today' | 'monthly' | 'specific')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${viewMode === m.id
                    ? 'bg-[#6a12b8] text-white shadow-md'
                    : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50'
                    }`}
                >
                  {m.icon} {m.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {viewMode === 'specific' && (
                <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-1.5 h-9 group hover:border-[#6a12b8] transition-colors">
                  <Calendar size={13} className="text-zinc-400 group-hover:text-[#6a12b8]" />
                  <input
                    type="date"
                    value={specificDate}
                    onChange={e => setSpecificDate(e.target.value)}
                    className="bg-transparent text-xs font-bold text-zinc-600 outline-none cursor-pointer"
                  />
                </div>
              )}
              {viewMode === 'monthly' && (
                <>
                  <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}
                    className="bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-600 outline-none h-9 hover:border-[#6a12b8] transition-colors cursor-pointer">
                    {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                  </select>
                  <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}
                    className="bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-600 outline-none h-9 hover:border-[#6a12b8] transition-colors cursor-pointer">
                    {[now.getFullYear() - 1, now.getFullYear()].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </>
              )}
            </div>

            <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
              className="bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-600 outline-none h-9">
              <option value="">All Categories</option>
              {cats.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <select value={varFilter} onChange={e => setVarFilter(e.target.value)}
              className="bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-600 outline-none h-9">
              <option value="">All Variance</option>
              <option value="negative">Negative</option>
              <option value="positive">Positive</option>
              <option value="zero">Zero</option>
            </select>

            <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 flex-1 min-w-35 h-9">
              <Search size={13} className="text-zinc-400 shrink-0" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-xs text-zinc-700 outline-none placeholder:text-zinc-400"
                placeholder="Search item..." />
              {search && <button onClick={() => setSearch('')} className="text-zinc-300 hover:text-red-500"><X size={12} /></button>}
            </div>

            {viewMode === 'today' && userRole !== 'cashier' && Object.keys(editingCounts).length > 0 && (
              <button
                onClick={handleSubmitAudit}
                disabled={isSavingAudit}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 h-9 rounded-lg font-bold text-xs uppercase tracking-widest flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                {isSavingAudit ? 'Saving...' : 'Commit Physical Audit'}
              </button>
            )}

            <button onClick={() => setShowGuide((v: boolean) => !v)}
              className="flex items-center gap-1.5 px-3 py-2 h-9 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-bold text-zinc-500 hover:text-[#6a12b8] hover:border-[#e9d5ff] transition-colors ml-auto shrink-0">
              Column Guide {showGuide ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            <button onClick={handleExport} disabled={exporting || loading}
              className="bg-[#6a12b8] hover:bg-[#2d1851] shrink-0 text-white px-4 py-2 h-9 rounded-lg font-bold text-xs uppercase tracking-widest flex items-center gap-1.5 transition-all disabled:opacity-50">
              <Download size={13} /> {exporting ? 'Exporting...' : 'Export CSV'}
            </button>
          </div>

          {/* Column guide */}
          {showGuide && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-5 py-4 bg-[#faf9ff] border-b border-zinc-100">
              {Object.entries(COLUMN_GUIDE).map(([col, desc]) => (
                <div key={col} className="flex items-start gap-2">
                  <span className="text-[9px] font-black text-[#6a12b8] bg-[#f5f0ff] px-1.5 py-0.5 rounded border border-[#e9d5ff] shrink-0 mt-0.5">{col}</span>
                  <p className="text-[10px] text-zinc-500 leading-tight">{desc}</p>
                </div>
              ))}
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: 900 }}>
              <thead>
                <tr className="border-b border-zinc-100">
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-zinc-400 sticky left-0 bg-white">Item</th>
                  {['BEG', 'DEL', 'IN', 'COOKED', 'OUT', 'SPOIL', 'END', 'INCOMING', 'VAR'].map(h => (
                    <th key={h} 
                      className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-zinc-400 group/h relative cursor-help"
                      title={COLUMN_GUIDE[h]}
                    >
                      <div className="flex items-center justify-end gap-1">
                        {h}
                        <Info size={10} className="text-zinc-300 opacity-0 group-hover/h:opacity-100 transition-opacity" />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? <Skeleton /> : filtered.length === 0 ? (
                  <tr><td colSpan={9} className="py-16 text-center">
                    <BarChart3 size={32} className="mx-auto text-zinc-200 mb-3" />
                    <p className="text-xs font-bold text-zinc-300 uppercase tracking-widest">
                      {search || catFilter || varFilter ? 'No items match your filters' : 'No usage data for this period'}
                    </p>
                  </td></tr>
                ) : filtered.map(r => {
                  return (
                    <tr key={r.id}
                      onClick={() => setDrawerRow(r)}
                      className="border-b border-zinc-50 hover:bg-[#faf9ff] cursor-pointer transition-colors group/row">
                      <td className="px-4 py-3.5 sticky left-0 bg-white group-hover/row:bg-[#faf9ff]">
                        <p className="font-bold text-[#1a0f2e] text-xs">{r.name}</p>
                        <p className="text-[10px] text-zinc-400">{r.category} · {r.unit}</p>
                      </td>
                      <td className="px-4 py-3.5 text-right text-xs font-medium text-zinc-500 tabular-nums">{r.beg}</td>
                      <td className="px-4 py-3.5 text-right text-xs font-medium tabular-nums" style={{ color: r.del > 0 ? '#16a34a' : '#a1a1aa' }}>{r.del}</td>
                      <td className="px-4 py-3.5 text-right text-xs font-medium tabular-nums" style={{ color: r.in > 0 ? '#8b5cf6' : '#a1a1aa' }}>{r.in}</td>
                      <td className="px-4 py-3.5 text-right text-xs font-medium tabular-nums" style={{ color: r.cooked > 0 ? '#2563eb' : '#a1a1aa' }}>{r.cooked}</td>
                      <td className="px-4 py-3.5 text-right text-xs font-medium tabular-nums transition-all group"
                        onClick={(e) => {
                          if (r.out > 0) {
                            e.stopPropagation();
                            setBreakdownRow(r);
                          }
                        }}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <span style={{ color: r.out > 0 ? '#6a12b8' : '#a1a1aa' }}>{r.out}</span>
                          {r.out > 0 && (
                            <div className="p-1 rounded bg-[#f5f0ff] text-[#6a12b8] opacity-0 group-hover:opacity-100 transition-opacity">
                              <Info size={10} />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right text-xs font-medium tabular-nums" style={{ color: r.spoil > 0 ? '#dc2626' : '#a1a1aa' }}>{r.spoil}</td>
                      
                      {/* Should Be (Expected) */}
                      <td className="px-4 py-3.5 text-right text-xs font-bold text-zinc-500 tabular-nums">
                        {r.end}
                      </td>

                      {/* Actual Count Input */}
                      <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        {viewMode === 'today' && userRole !== 'cashier' ? (
                          <input
                            type="number"
                            value={editingCounts[r.id] ?? r.end}
                            onChange={(e) => setEditingCounts(prev => ({ ...prev, [r.id]: e.target.value }))}
                            className="w-16 h-7 bg-white border border-zinc-200 rounded px-2 text-xs font-black text-right text-[#1a0f2e] focus:border-[#6a12b8] focus:ring-1 focus:ring-[#6a12b8] outline-none transition-all tabular-nums"
                            placeholder={String(r.end)}
                          />
                        ) : (
                          <span className="text-xs font-black text-zinc-400 tabular-nums italic">
                            {r.end}
                          </span>
                        )}
                      </td>

                      {/* Variance */}
                      <td className="px-4 py-3.5 text-right">
                        {(() => {
                          const currentActual = editingCounts[r.id] !== undefined ? Number(editingCounts[r.id]) : r.end;
                          const currentVariance = currentActual - r.end;
                          const vc = varianceColor(currentVariance);
                          return (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold border tabular-nums"
                              style={{ background: vc.bg, color: vc.text, borderColor: vc.border }}>
                              {varianceLabel(currentVariance)}
                            </span>
                          );
                        })()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {!loading && filtered.length > 0 && (
                <tfoot>
                    <tr className="border-t-2 border-zinc-200 bg-zinc-50">
                      <td className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 sticky left-0 bg-zinc-50">TOTALS</td>
                      {(['beg', 'del', 'in', 'cooked', 'out', 'spoil', 'end'] as (keyof UsageRow)[]).map(k => (
                        <td key={k} className="px-4 py-3 text-right text-xs font-black text-[#1a0f2e] tabular-nums">
                          {filtered.reduce((s, r) => s + (r[k] as number), 0)}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-right">
                        <span className="text-[10px] font-bold text-zinc-400">
                          -
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-[10px] font-bold text-zinc-400">
                          {negVar}↓ {posVar}↑
                        </span>
                      </td>
                    </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* Right Side: Product Sold Card */}
        <div className="w-full lg:w-80 h-[calc(100vh-320px)] sticky top-8">
          <ProductSoldCard data={productSales} loading={salesLoading} />
        </div>
      </div>

      {drawerRow && (
        <MovementDrawer
          row={drawerRow}
          period={period}
          onClose={() => setDrawerRow(null)}
        />
      )}

      {breakdownRow && (
        <UsageBreakdownDrawer
          row={breakdownRow}
          period={period}
          branch={String(branchId)}
          onClose={() => setBreakdownRow(null)}
        />
      )}
    </div>
  );
};

export default UsageReportPanel;
