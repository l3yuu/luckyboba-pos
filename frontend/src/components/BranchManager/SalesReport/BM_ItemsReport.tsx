// components/BranchManager/SalesReport/BM_ItemsReport.tsx
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search, Download, RefreshCw, AlertCircle,
  ChevronDown, ChevronUp, X, Package,
  Printer, Calendar, Layers,
} from "lucide-react";
import { StatCard, Button as Btn, Badge, AlertBox } from "../SharedUI";

// ── Types ─────────────────────────────────────────────────────────────────────
interface ItemRow {
  product_name:   string;
  size?:          string;
  cup_size_label?: string;
  category:       string;
  total_quantity: number;
  total_revenue:  number;
  avg_price:      number;
  times_ordered:  number;
}
interface CategoryOption { id: number; name: string; }

interface ApiItemRow {
  product_name:   string;
  size?:          string;
  cup_size_label?: string;
  category:       string | null;
  total_quantity: string | number;
  total_revenue:  string | number;
  avg_unit_price: string | number | null;
  times_ordered:  string | number | null;
}

type SortDir = "asc" | "desc";
type SortKey = "product_name" | "category" | "total_quantity" | "total_revenue" | "avg_price";

// ── API Helpers ───────────────────────────────────────────────────────────────
const getToken = () =>
  localStorage.getItem("auth_token") || localStorage.getItem("lucky_boba_token") || "";
const authHeaders = () => ({
  "Content-Type": "application/json",
  "Accept":       "application/json",
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

const getBMBranchId = (): string => localStorage.getItem("lucky_boba_user_branch_id") || "";
const getBMBranchName = (): string => localStorage.getItem("lucky_boba_user_branch") || "My Branch";

// ── Shared UI ─────────────────────────────────────────────────────────────────
const SortIcon: React.FC<{ col: SortKey; active: SortKey; dir: SortDir }> = ({ col, active, dir }) => {
  if (col !== active) return <ChevronDown size={11} className="text-zinc-300 ml-0.5" />;
  return dir === "asc"
    ? <ChevronUp size={11} className="text-[#3b2063] ml-0.5" />
    : <ChevronDown size={11} className="text-[#3b2063] ml-0.5" />;
};

// ── Main Component ─────────────────────────────────────────────────────────────
const BM_ItemsReport: React.FC = () => {
  const today      = new Date().toISOString().split("T")[0];
  const firstMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString().split("T")[0];

  const [dateFrom,  setDateFrom]  = useState(firstMonth);
  const [dateTo,    setDateTo]    = useState(today);
  const [categoryId, setCategoryId] = useState("");
  const [search,    setSearch]    = useState("");
  const [sortKey,   setSortKey]   = useState<SortKey>("total_quantity");
  const [sortDir,   setSortDir]   = useState<SortDir>("desc");

  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [items,      setItems]      = useState<ItemRow[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);

  const phCurrency = useMemo(() => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }), []);
  const fmt = (v: number) => `₱${Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  // Fetch categories once
  useEffect(() => {
    fetch("/api/categories", { headers: authHeaders() })
      .then(r => r.json())
      .then(data => {
        if (data.success !== false) setCategories(Array.isArray(data) ? data : (data.data ?? []));
      })
      .catch(() => {});
  }, []);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const branchId = getBMBranchId();
      if (!branchId) throw new Error("Branch Identity Missing");

      const params = new URLSearchParams({
        date_from: dateFrom,
        date_to:   dateTo,
        branch_id: branchId,
      });
      if (categoryId) params.set("category_id", categoryId);

      const res  = await fetch(`/api/reports/items-all?${params}`, { headers: authHeaders() });
      if (!res.ok) throw new Error("API Exception");
      const data = await res.json() as { top_products?: ApiItemRow[] };

      if (data.top_products) {
        setItems(data.top_products.map((p) => ({
          product_name:   p.product_name,
          size:           p.size,
          cup_size_label: p.cup_size_label,
          category:       p.category ?? "—",
          total_quantity: Number(p.total_quantity),
          total_revenue:  Number(p.total_revenue),
          avg_price:      Number(p.avg_unit_price ?? 0),
          times_ordered:  Number(p.times_ordered  ?? 0),
        })));
      } else {
        setItems([]);
      }
    } catch {
      setError("Failed to synchronise items report with the central node.");
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, categoryId]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const filtered = useMemo(() => {
    let rows = items.filter(r =>
      r.product_name.toLowerCase().includes(search.toLowerCase()) ||
      r.category.toLowerCase().includes(search.toLowerCase())
    );
    rows = [...rows].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "string" && typeof bv === "string")
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === "asc" ? Number(av) - Number(bv) : Number(bv) - Number(av);
    });
    return rows;
  }, [items, search, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const totalQty     = filtered.reduce((s, r) => s + r.total_quantity, 0);
  const totalRevenue = filtered.reduce((s, r) => s + r.total_revenue,  0);
  const topItem      = filtered[0];

  const handleExport = () => {
    const branchId = getBMBranchId();
    const params = new URLSearchParams({ date_from: dateFrom, date_to: dateTo });
    if (branchId)   params.set("branch_id",   branchId);
    if (categoryId) params.set("category_id", categoryId);
    
    const branchSlug = getBMBranchName().toUpperCase().replace(/[^A-Z0-9]+/g, "-");

    fetch(`/api/reports/items-export?${params}`, { headers: authHeaders() })
      .then(res => res.blob())
      .then(blob => {
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `LuckyBoba_ItemsReport_${branchSlug}_${dateFrom}_to_${dateTo}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch(() => alert('Export protocol failure.'));
  };

  const handlePrint = () => {
    if (filtered.length === 0) return;
    setTimeout(() => window.print(), 200);
  };

  const SortTh: React.FC<{ col: SortKey; label: string }> = ({ col, label }) => (
    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-zinc-400 cursor-pointer hover:text-zinc-600 select-none"
      onClick={() => toggleSort(col)}>
      <span className="inline-flex items-center gap-0.5">
        {label}
        <SortIcon col={col} active={sortKey} dir={sortDir} />
      </span>
    </th>
  );

  return (
    <>
      <style>{`
        .bm-printable-receipt { display: none; }
        @media print {
          @page { size: 80mm auto; margin: 0; }
          html, body { background: white !important; margin: 0 !important; padding: 0 !important; }
          .bm-items-main { display: none !important; }
          .bm-printable-receipt { display: block !important; position: absolute !important; left: 0 !important; top: 0 !important; width: 80mm !important; padding: 6mm !important; background: white !important; color: black !important; font-family: 'Courier New', monospace; }
          .receipt-divider { border-top: 1px dashed #000 !important; margin: 8px 0; width: 100%; }
          .flex-between { display: flex !important; justify-content: space-between !important; width: 100%; }
        }
        .receipt-divider { border-top: 1px dashed #000; margin: 8px 0; width: 100%; }
        .flex-between { display: flex; justify-content: space-between; width: 100%; }
      `}</style>

      {/* ── Print Receipt ── */}
      <div className="bm-printable-receipt text-slate-800">
        <div className="text-center space-y-1">
          <h1 className="font-black text-[14px] uppercase leading-tight">Lucky Boba Milktea</h1>
          <p className="text-[10px] uppercase font-bold">{getBMBranchName()}</p>
          <div className="receipt-divider" />
          <h2 className="font-black text-[11px] uppercase tracking-widest">Item Sales Report</h2>
          <div className="text-left text-[10px] space-y-0.5 mt-2 uppercase">
            <div className="flex-between"><span>Start Range</span><span>{dateFrom}</span></div>
            <div className="flex-between"><span>End Range</span><span>{dateTo}</span></div>
            <div className="flex-between"><span>Generated</span><span>{new Date().toLocaleTimeString()}</span></div>
          </div>
        </div>
        <div className="my-4 pt-2">
          <div className="receipt-divider" />
          <table className="w-full text-[10px]">
            <thead>
              <tr className="font-black border-b border-black text-left">
                <th className="pb-1 uppercase tracking-tighter w-1/2">Item Identity</th>
                <th className="pb-1 text-center">QTY</th>
                <th className="pb-1 text-right">Yield</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-1 uppercase text-[9px] font-bold">{item.product_name}</td>
                  <td className="py-1 text-center font-bold">x{item.total_quantity}</td>
                  <td className="py-1 text-right">{phCurrency.format(item.total_revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="receipt-divider" />
          <div className="space-y-1 mt-2">
            <div className="flex-between text-[10px]"><span>TOTAL UNITS DISPENSED</span><span className="font-bold">{totalQty}</span></div>
            <div className="flex-between font-black text-[12px] pt-1 border-t border-black"><span>TOTAL GROSS REVENUE</span><span>{phCurrency.format(totalRevenue)}</span></div>
          </div>
        </div>
      </div>

      {/* ── Main UI ── */}
      <div className="bm-items-main p-6 md:p-8 space-y-6 fade-in pb-20">
        <style>{`.fade-in { animation: fadeIn 0.3s ease-out forwards; } @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }`}</style>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1a0f2e]">Inventory Reporting</h1>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mt-1">Itemized sales performance & category mapping</p>
          </div>
          <div className="flex items-center gap-3">
            <Btn onClick={handleExport} variant="secondary" className="px-5 py-2.5 rounded-xl shadow-sm">
              <Download size={14} /> <span className="ml-1">Export CSV</span>
            </Btn>
            <Btn onClick={handlePrint} variant="secondary" className="px-5 py-2.5 rounded-xl shadow-sm">
              <Printer size={14} /> <span className="ml-1">Print POS</span>
            </Btn>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 p-4 bg-white border border-zinc-200 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-100 px-3 py-1.5 rounded-xl min-w-[320px]">
            <Calendar size={14} className="text-zinc-400" />
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-[#3b2063] outline-none w-28" />
            <div className="w-1.5 h-[1px] bg-zinc-300" />
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-[#3b2063] outline-none w-28" />
          </div>

          <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-100 px-3 py-1.5 rounded-xl">
             <Layers size={14} className="text-zinc-400" />
             <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
                className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-[#3b2063] outline-none cursor-pointer">
                <option value="">All Categories</option>
                {categories.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
              </select>
          </div>

          <Btn onClick={fetchItems} disabled={loading} className="px-6 py-2 rounded-xl shadow-lg shadow-purple-100 ml-auto group">
            {loading ? <RefreshCw size={14} className="animate-spin" /> : <><RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" /> <span className="ml-1">Sync Hub</span></>}
          </Btn>
        </div>

        {error && <AlertBox type="error" message={error} />}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatCard icon={<Package size={18} />} label="Catalog Coverage" value={loading ? "—" : filtered.length.toLocaleString()} sub="Unique Products" color="violet" />
          <StatCard icon={<Printer size={18} />} label="Volume Dispensed" value={loading ? "—" : totalQty.toLocaleString()} sub="Total Units" color="emerald" />
          <StatCard icon={<span className="font-black text-sm">₱</span>} label="Gross Sales" value={loading ? "—" : fmt(totalRevenue)} sub={topItem ? `MVP: ${topItem.product_name}` : "Yield Summary"} color="amber" />
        </div>

        <div className="bg-white border border-zinc-200 rounded-[1.25rem] overflow-hidden shadow-sm">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-100 flex-wrap">
            <div className="flex-1 min-w-48 flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2">
              <Search size={13} className="text-zinc-400 shrink-0" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-sm text-zinc-700 outline-none placeholder:text-zinc-400"
                placeholder="Search inventory matrix..." />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 shrink-0">
              {filtered.length} units listed
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-50/20 text-left border-b border-zinc-50">
                  <th className="px-6 py-3 text-[9px] font-black text-zinc-400 uppercase tracking-widest w-12">#</th>
                  <SortTh col="product_name" label="Item Identity" />
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-zinc-400">Class</th>
                  <SortTh col="total_quantity" label="Volume" />
                  <SortTh col="total_revenue" label="Revenue" />
                  <SortTh col="avg_price" label="Mean Price" />
                  <th className="px-6 py-3 text-right text-[9px] font-black text-zinc-400 uppercase tracking-widest">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {loading ? (
                   [...Array(6)].map((_, i) => <tr key={i} className="animate-pulse"><td colSpan={7} className="px-6 py-4"><div className="h-4 bg-zinc-50 rounded" /></td></tr>)
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-20 text-center text-[10px] font-black text-zinc-300 uppercase tracking-widest opacity-40">Zero items detected in range</td></tr>
                ) : (
                  filtered.map((item, i) => {
                    const revShare = totalRevenue > 0 ? Math.round((item.total_revenue / totalRevenue) * 100) : 0;
                    const maxQty = filtered[0]?.total_quantity ?? 1;
                    const qtyPct = Math.round((item.total_quantity / maxQty) * 100);

                    return (
                      <tr key={i} className="hover:bg-zinc-50/50 transition-colors group">
                        <td className="px-6 py-3.5 text-[10px] font-black text-zinc-300 tabular-nums">{i + 1}</td>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 bg-violet-50 border border-violet-100 rounded flex items-center justify-center shrink-0">
                               <Package size={12} className="text-violet-600" />
                            </div>
                            <span className="font-bold text-[#1a0f2e] text-xs uppercase tracking-tight">{item.product_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3.5">
                          <Badge status={item.category || '—'} />
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-12 h-1 bg-zinc-100 rounded-full overflow-hidden shadow-inner flex-1 max-w-[40px]">
                              <div className="h-full bg-[#3b2063] rounded-full transition-all duration-700" style={{ width: `${qtyPct}%` }} />
                            </div>
                            <span className="font-black text-[#1a0f2e] text-[11px] tabular-nums">{item.total_quantity}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 font-black text-[#3b2063] text-xs tabular-nums text-center">{fmt(item.total_revenue)}</td>
                        <td className="px-6 py-3.5 text-zinc-500 font-bold text-[11px] tabular-nums text-center">{item.avg_price > 0 ? fmt(item.avg_price) : "—"}</td>
                        <td className="px-6 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                             <span className="text-[10px] font-black text-emerald-600 tracking-tighter">{revShare}%</span>
                             <div className="w-8 h-1 bg-emerald-50 rounded-full overflow-hidden flex-1 max-w-[30px]">
                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${revShare}%` }} />
                             </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
                {!loading && filtered.length > 0 && (
                  <tr className="bg-zinc-50 border-t border-zinc-200">
                    <td className="px-6 py-3.5" />
                    <td className="px-6 py-3.5 font-black text-[#1a0f2e] text-xs uppercase tracking-widest" colSpan={2}>Aggregate Yield</td>
                    <td className="px-6 py-3.5 font-black text-[#1a0f2e] text-xs">{totalQty.toLocaleString()}</td>
                    <td className="px-6 py-3.5 font-black text-[#3b2063] text-xs">{fmt(totalRevenue)}</td>
                    <td className="px-6 py-3.5" />
                    <td className="px-6 py-3.5 font-black text-emerald-600 text-xs text-right">100%</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default BM_ItemsReport;
