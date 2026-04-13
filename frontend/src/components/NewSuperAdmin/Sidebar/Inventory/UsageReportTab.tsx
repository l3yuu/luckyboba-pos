"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, X, RefreshCw, Download, ChevronDown, ChevronUp,
  BarChart3, TrendingUp, TrendingDown, Minus, Clock, Info,
  Coffee,
} from 'lucide-react';
import api from '../../../../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UsageRow {
  id:           number;
  name:         string;
  unit:         string;
  category:     string;
  beg:          number;  // beginning stock
  del:          number;  // deliveries
  cooked:       number;  // intermediate produced
  out:          number;  // consumed/sold
  spoil:        number;  // spoilage
  end:          number;  // ending stock
  usage:        number;  // total used
  variance:     number;  // end - (beg + del + cooked - out - spoil)
}

interface Movement {
  id:           number;
  type:         string;
  quantity:     number;
  reason:       string;
  performed_by: string;
  created_at:   string;
}

interface UsageBreakdown {
  product_name:     string;
  cup_size_label:   string;
  recipe_quantity:  number;
  total_sold:       number;
  total_deducted:   number;
}

interface Branch { id: number; name: string; }

// ─── Helpers ──────────────────────────────────────────────────────────────────

const varianceColor = (v: number) => {
  if (v === 0)  return { text: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' };
  if (v > 0)    return { text: '#d97706', bg: '#fffbeb', border: '#fde68a' };
  return              { text: '#dc2626', bg: '#fef2f2', border: '#fecaca' };
};

const varianceLabel = (v: number) => {
  if (v === 0) return 'Zero';
  if (v > 0)   return `+${v}`;
  return String(v);
};

const timeAgo = (d: string) => {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1)  return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(d).toLocaleDateString();
};

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

// ─── Movement Drawer ──────────────────────────────────────────────────────────

const MovementDrawer: React.FC<{
  row:     UsageRow;
  period:  string;
  onClose: () => void;
}> = ({ row, period, onClose }) => {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    api.get(`/raw-materials/${row.id}/history`, { params: { period } })
      .then(r => setMovements(r.data?.data ?? r.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [row.id, period]);

  const typeColor = (t: string) => {
    if (t === 'add')      return '#16a34a';
    if (t === 'subtract') return '#dc2626';
    return '#3b2063';
  };
  const typePrefix = (t: string) => t === 'add' ? '+' : t === 'subtract' ? '-' : '=';

  return (
    <div className="fixed inset-0 z-9999 flex justify-end"
      style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.35)' }}>
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white w-full max-w-sm h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 bg-[#faf9ff]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#3b2063] rounded-lg flex items-center justify-center">
              <Clock size={14} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#1a0f2e] leading-tight">{row.name}</p>
              <p className="text-[10px] text-zinc-400 uppercase tracking-widest">Movements for {period}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-400">
            <X size={16} />
          </button>
        </div>

        {/* Summary strip */}
        <div className="grid grid-cols-3 border-b border-zinc-100">
          {[
            { label: 'BEG', value: row.beg, color: '#71717a' },
            { label: 'USED', value: row.usage, color: '#3b2063' },
            { label: 'END', value: row.end, color: '#1a0f2e' },
          ].map(s => (
            <div key={s.label} className="text-center py-3 border-r border-zinc-100 last:border-0">
              <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">{s.label}</p>
              <p className="text-base font-black tabular-nums" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[9px] text-zinc-400">{row.unit}</p>
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-5 space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-12 bg-zinc-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : movements.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2 px-6 text-center">
              <Clock size={28} className="text-zinc-200" />
              <p className="text-xs font-bold text-zinc-300 uppercase tracking-widest">No movements for this period</p>
            </div>
          ) : movements.map(m => (
            <div key={m.id} className="flex items-start gap-3 px-5 py-3.5 border-b border-zinc-50 hover:bg-[#faf9ff] transition-colors">
              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: m.type === 'add' ? '#f0fdf4' : m.type === 'subtract' ? '#fef2f2' : '#f5f0ff' }}>
                {m.type === 'add'
                  ? <TrendingUp  size={12} color="#16a34a" />
                  : m.type === 'subtract'
                  ? <TrendingDown size={12} color="#dc2626" />
                  : <Minus       size={12} color="#3b2063" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold" style={{ color: typeColor(m.type) }}>
                    {typePrefix(m.type)}{m.quantity} {row.unit}
                  </span>
                  <span className="text-[10px] text-zinc-400">{timeAgo(m.created_at)}</span>
                </div>
                <p className="text-[11px] text-zinc-500 mt-0.5 truncate">{m.reason}</p>
                <p className="text-[10px] text-zinc-400">by {m.performed_by}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Product Sold Card ────────────────────────────────────────────────────────

interface ProductSalesData {
  category_name: string;
  product_name:  string;
  sizes:         Record<string, number>;
  total_sold:    number;
  usage?:        Array<{ name: string; qty: number; unit: string }>;
}

const ProductSoldCard: React.FC<{ 
  data:    ProductSalesData[]; 
  loading: boolean;
}> = ({ data, loading }) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

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

  const grouped = data.reduce((acc, item) => {
    if (!acc[item.category_name]) acc[item.category_name] = [];
    acc[item.category_name].push(item);
    return acc;
  }, {} as Record<string, ProductSalesData[]>);

  const toggleExpanded = (key: string) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-[0.625rem] flex flex-col shadow-sm h-full overflow-hidden text-zinc-900">
      <div className="px-5 py-4 border-b border-zinc-100 bg-[#faf9ff] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coffee size={14} className="text-[#3b2063]" />
          <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#1a0f2e]">Product Sold Summary</p>
        </div>
        <span className="text-[10px] font-bold text-zinc-400 bg-white border border-zinc-100 px-2 py-0.5 rounded-full">
          {data.length} Items
        </span>
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
                  const itemKey = `${cat}-${p.product_name}`;
                  const isExpanded = expanded[itemKey];

                  return (
                    <div key={idx} className="bg-zinc-50 border border-zinc-100 rounded-lg overflow-hidden hover:border-[#e9d5ff] transition-all group">
                      <div 
                        className="p-3 cursor-pointer hover:bg-[#faf9ff] transition-colors"
                        onClick={() => toggleExpanded(itemKey)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[11px] font-bold text-[#1a0f2e] group-hover:text-[#3b2063] transition-colors">{p.product_name}</p>
                          <div className="flex items-center gap-3">
                            <p className="text-xs font-black text-[#3b2063] tabular-nums">{p.total_sold}</p>
                            {p.usage && p.usage.length > 0 && (
                              <div className="text-zinc-400">
                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Size Breakdown */}
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
                      {p.usage && p.usage.length > 0 && isExpanded && (
                        <div className="px-3 pb-3 pt-2 border-t border-zinc-100/50 bg-white">
                          <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Material Usage Summary</p>
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
  row:     UsageRow;
  period:  string;
  branch:  string;
  onClose: () => void;
}> = ({ row, period, branch, onClose }) => {
  const [items,   setItems]   = useState<UsageBreakdown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/inventory/usage-report/breakdown/${row.id}`, { 
      params: { period, branch_id: branch || undefined } 
    })
      .then(r => setItems(r.data ?? []))
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
            <div className="w-8 h-8 bg-[#3b2063] rounded-lg flex items-center justify-center">
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
                      <p className="text-xs font-black text-[#3b2063]">{it.total_sold}</p>
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

        <div className="p-5 border-t border-zinc-100 bg-[#3b2063] text-white">
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
  BEG:    'Beginning stock at start of period',
  DEL:    'Deliveries / stock additions received',
  COOKED: 'Intermediate items produced in-house',
  OUT:    'Consumed via sales (auto-deducted)',
  SPOIL:  'Spoilage or manual write-offs',
  END:    'Ending stock at close of period',
  USAGE:  'Total consumed = OUT + SPOIL',
  VAR:    'Variance = END − (BEG + DEL + COOKED − OUT − SPOIL)',
};

const UsageReportTab: React.FC = () => {
  const now   = new Date();
  const [rows,          setRows]          = useState<UsageRow[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState('');
  const [catFilter,     setCatFilter]     = useState('');
  const [varFilter,     setVarFilter]     = useState('');
  const [branch,        setBranch]        = useState('');
  const [branches,      setBranches]      = useState<Branch[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear,  setSelectedYear]  = useState(now.getFullYear());
  const [showGuide,     setShowGuide]     = useState(false);
  const [drawerRow,     setDrawerRow]     = useState<UsageRow | null>(null);
  const [breakdownRow,  setBreakdownRow]  = useState<UsageRow | null>(null);
  const [exporting,     setExporting]     = useState(false);
  const [isToday,       setIsToday]       = useState(false);
  const [productSales,  setProductSales]  = useState<ProductSalesData[]>([]);
  const [salesLoading,  setSalesLoading]  = useState(false);

  const period = isToday
    ? now.toISOString().split('T')[0]
    : `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setSalesLoading(true);
    try {
      const [reportRes, branchRes, salesRes] = await Promise.allSettled([
        api.get('/inventory/usage-report', { params: { period, branch_id: branch || undefined } }),
        api.get('/branches'),
        api.get('/inventory/usage-report/get-product-sales', { params: { period, branch_id: branch || undefined } }),
      ]);
      if (reportRes.status === 'fulfilled') {
        const d = reportRes.value.data;
        setRows(Array.isArray(d) ? d : d?.data ?? []);
      }
      if (branchRes.status === 'fulfilled') {
        const b = branchRes.value.data;
        setBranches(Array.isArray(b) ? b : b?.data ?? []);
      }
      if (salesRes.status === 'fulfilled') {
        setProductSales(salesRes.value.data ?? []);
      }
    } catch (e) { console.error(e); }
    finally { 
      setLoading(false); 
      setSalesLoading(false);
    }
  }, [period, branch]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await api.get('/inventory/usage-report/export', {
        params: { period, branch_id: branch || undefined },
        responseType: 'blob',
      });
      const url  = URL.createObjectURL(res.data);
      const link = document.createElement('a');
      link.href     = url;
      link.download = `usage-report-${period}${isToday ? '-today' : ''}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) { console.error(e); }
    finally { setExporting(false); }
  };

  const filtered = rows.filter(r => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase());
    const matchCat    = catFilter ? r.category === catFilter : true;
    const matchVar    = varFilter === 'negative' ? r.variance < 0
                      : varFilter === 'positive' ? r.variance > 0
                      : varFilter === 'zero'     ? r.variance === 0
                      : true;
    return matchSearch && matchCat && matchVar;
  });

  const cats = [...new Set(rows.map(r => r.category))].filter(Boolean);

  // Summary stats
  const totalUsage  = rows.reduce((s, r) => s + r.usage, 0);
  const totalSpoil  = rows.reduce((s, r) => s + r.spoil, 0);
  const negVar      = rows.filter(r => r.variance < 0).length;
  const posVar      = rows.filter(r => r.variance > 0).length;

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

      {/* Header */}
      <div className="flex items-center justify-end mb-5 flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <button onClick={fetchReport} disabled={loading}
            className="bg-white border border-[#e9d5ff] text-zinc-400 hover:text-[#3b2063] hover:border-[#3b2063] px-3 py-2 h-9 rounded-lg transition-all flex items-center gap-1.5 text-xs font-bold">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={handleExport} disabled={exporting || loading}
            className="bg-[#3b2063] hover:bg-[#2d1851] text-white px-4 py-2 h-9 rounded-lg font-bold text-xs uppercase tracking-widest flex items-center gap-1.5 transition-all disabled:opacity-50">
            <Download size={13} /> {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
        {[
          { label: 'Total Items',     value: rows.length,  color: '#3b2063', bg: '#f5f0ff', border: '#e9d5ff' },
          { label: 'Total Usage',     value: totalUsage,   color: '#1a0f2e', bg: '#faf9ff', border: '#e9d5ff' },
          { label: 'Total Spoilage',  value: totalSpoil,   color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
          { label: 'Negative Var.',   value: negVar,       color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
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
          <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-zinc-100">

          {/* Period selector */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsToday(!isToday)}
              className={`px-3 py-2 h-9 rounded-lg text-xs font-bold transition-all border ${
                isToday 
                  ? 'bg-[#3b2063] text-white border-[#3b2063]' 
                  : 'bg-white text-zinc-500 border-zinc-200 hover:border-[#3b2063]'
              }`}
            >
              Today
            </button>
            {!isToday && (
              <>
                <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}
                  className="bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-600 outline-none h-9">
                  {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
                <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}
                  className="bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-600 outline-none h-9">
                  {[now.getFullYear() - 1, now.getFullYear()].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </>
            )}
          </div>

          <select value={branch} onChange={e => setBranch(e.target.value)}
            className="bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-600 outline-none h-9">
            <option value="">All Branches</option>
            {branches.map(b => <option key={b.id} value={String(b.id)}>{b.name}</option>)}
          </select>

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

          <button onClick={() => setShowGuide((v: boolean) => !v)}
            className="flex items-center gap-1.5 px-3 py-2 h-9 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-bold text-zinc-500 hover:text-[#3b2063] hover:border-[#e9d5ff] transition-colors ml-auto">
            Column Guide {showGuide ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>

        {/* Column guide */}
        {showGuide && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-5 py-4 bg-[#faf9ff] border-b border-zinc-100">
            {Object.entries(COLUMN_GUIDE).map(([col, desc]) => (
              <div key={col} className="flex items-start gap-2">
                <span className="text-[9px] font-black text-[#3b2063] bg-[#f5f0ff] px-1.5 py-0.5 rounded border border-[#e9d5ff] shrink-0 mt-0.5">{col}</span>
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
                {['BEG', 'DEL', 'COOKED', 'OUT', 'SPOIL', 'END', 'USAGE', 'VAR'].map(h => (
                  <th key={h} className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-zinc-400">{h}</th>
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
                const vc = varianceColor(r.variance);
                return (
                  <tr key={r.id}
                    onClick={() => setDrawerRow(r)}
                    className="border-b border-zinc-50 hover:bg-[#faf9ff] cursor-pointer transition-colors">
                    <td className="px-4 py-3.5 sticky left-0 bg-white hover:bg-[#faf9ff]">
                      <p className="font-bold text-[#1a0f2e] text-xs">{r.name}</p>
                      <p className="text-[10px] text-zinc-400">{r.category} · {r.unit}</p>
                    </td>
                    <td className="px-4 py-3.5 text-right text-xs font-medium text-zinc-500 tabular-nums">{r.beg}</td>
                    <td className="px-4 py-3.5 text-right text-xs font-medium tabular-nums" style={{ color: r.del > 0 ? '#16a34a' : '#a1a1aa' }}>{r.del}</td>
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
                        <span style={{ color: r.out > 0 ? '#3b2063' : '#a1a1aa' }}>{r.out}</span>
                        {r.out > 0 && (
                          <div className="p-1 rounded bg-[#f5f0ff] text-[#3b2063] opacity-0 group-hover:opacity-100 transition-opacity">
                            <Info size={10} />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right text-xs font-medium tabular-nums" style={{ color: r.spoil > 0 ? '#dc2626' : '#a1a1aa' }}>{r.spoil}</td>
                    <td className="px-4 py-3.5 text-right text-xs font-bold text-[#1a0f2e] tabular-nums">{r.end}</td>
                    <td className="px-4 py-3.5 text-right text-xs font-bold tabular-nums" style={{ color: '#3b2063' }}>{r.usage}</td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold border tabular-nums"
                        style={{ background: vc.bg, color: vc.text, borderColor: vc.border }}>
                        {varianceLabel(r.variance)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {!loading && filtered.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-zinc-200 bg-zinc-50">
                  <td className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400">TOTALS</td>
                  {(['beg','del','cooked','out','spoil','end','usage'] as (keyof UsageRow)[]).map(k => (
                    <td key={k} className="px-4 py-3 text-right text-xs font-black text-[#1a0f2e] tabular-nums">
                      {filtered.reduce((s, r) => s + (r[k] as number), 0)}
                    </td>
                  ))}
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
          branch={branch}
          onClose={() => setBreakdownRow(null)}
        />
      )}
    </div>
  );
};

export default UsageReportTab;