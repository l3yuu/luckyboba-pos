import { useState, useEffect, useCallback } from "react";
import {
  Package, AlertTriangle, Plus, Pencil, Trash2,
  History, ChevronDown, X, Search, RefreshCw,
  ArrowUpDown, CheckCircle, Clock, Filter,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────
interface Branch {
  id: number;
  name: string;
}

interface InventoryItem {
  id: number;
  name: string;
  category: string;
  unit: string;
  stock: number;
  low_stock_threshold: number;
  branch_id: number;
  branch_name?: string;
  updated_at: string;
}

interface StockLog {
  id: number;
  item_id: number;
  item_name: string;
  action: "added" | "deducted" | "adjusted";
  quantity: number;
  note: string;
  performed_by: string;
  created_at: string;
}

interface ModalState {
  type: "add" | "edit" | "delete" | "history" | null;
  item?: InventoryItem | null;
}

const getToken = () =>
  localStorage.getItem("auth_token") ||
  localStorage.getItem("lucky_boba_token") || "";

const apiFetch = async (url: string, options: RequestInit = {}) => {
  const token = getToken();
  const res = await fetch(url, {
    ...options,
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

// ── Stock level badge ──────────────────────────────────────────────────────
const StockBadge = ({ stock, threshold }: { stock: number; threshold: number }) => {
  const pct = threshold > 0 ? stock / threshold : 1;
  if (stock === 0)
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.65rem] font-bold bg-red-50 text-red-600 border border-red-100">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
        Out of Stock
      </span>
    );
  if (pct <= 1)
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.65rem] font-bold bg-amber-50 text-amber-600 border border-amber-100">
        <AlertTriangle size={10} />
        Low Stock
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.65rem] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
      <CheckCircle size={10} />
      In Stock
    </span>
  );
};

// ── Stock mini bar ─────────────────────────────────────────────────────────
const StockBar = ({ stock, threshold }: { stock: number; threshold: number }) => {
  const pct = threshold > 0 ? Math.min((stock / (threshold * 2)) * 100, 100) : 100;
  const color = stock === 0 ? "#ef4444" : stock <= threshold ? "#f59e0b" : "#10b981";
  return (
    <div className="w-20 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
};

// ── Add / Edit Modal ───────────────────────────────────────────────────────
const ItemFormModal = ({
  mode, item, branches, onClose, onSave,
}: {
  mode: "add" | "edit";
  item?: InventoryItem | null;
  branches: Branch[];
  onClose: () => void;
  onSave: (data: Partial<InventoryItem>) => Promise<void>;
}) => {
  const [form, setForm] = useState({
    name:                item?.name ?? "",
    category:            item?.category ?? "",
    unit:                item?.unit ?? "",
    stock:               item?.stock ?? 0,
    low_stock_threshold: item?.low_stock_threshold ?? 10,
    branch_id:           item?.branch_id ?? (branches[0]?.id ?? 0),
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const handle = (k: string, v: string | number) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.name.trim()) { setError("Item name is required."); return; }
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-zinc-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#3b2063] flex items-center justify-center">
              <Package size={13} className="text-white" />
            </div>
            <h2 className="text-sm font-bold text-[#1a0f2e]">
              {mode === "add" ? "Add Stock Item" : "Edit Stock Item"}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-zinc-100 transition-colors">
            <X size={15} className="text-zinc-400" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-4">
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-100 rounded-lg text-red-600 text-xs font-medium">
              <AlertTriangle size={13} /> {error}
            </div>
          )}

          {/* Branch */}
          <div>
            <label className="block text-[0.7rem] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Branch</label>
            <div className="relative">
              <select
                value={form.branch_id}
                onChange={e => handle("branch_id", Number(e.target.value))}
                className="w-full appearance-none bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-sm text-[#1a0f2e] font-medium focus:outline-none focus:border-[#3b2063] focus:ring-2 focus:ring-violet-100 transition-all"
              >
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-[0.7rem] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Item Name</label>
            <input
              value={form.name}
              onChange={e => handle("name", e.target.value)}
              placeholder="e.g. Brown Sugar Syrup"
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-sm text-[#1a0f2e] font-medium placeholder-zinc-300 focus:outline-none focus:border-[#3b2063] focus:ring-2 focus:ring-violet-100 transition-all"
            />
          </div>

          {/* Category + Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[0.7rem] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Category</label>
              <input
                value={form.category}
                onChange={e => handle("category", e.target.value)}
                placeholder="e.g. Syrups"
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-sm text-[#1a0f2e] font-medium placeholder-zinc-300 focus:outline-none focus:border-[#3b2063] focus:ring-2 focus:ring-violet-100 transition-all"
              />
            </div>
            <div>
              <label className="block text-[0.7rem] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Unit</label>
              <input
                value={form.unit}
                onChange={e => handle("unit", e.target.value)}
                placeholder="e.g. bottles"
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-sm text-[#1a0f2e] font-medium placeholder-zinc-300 focus:outline-none focus:border-[#3b2063] focus:ring-2 focus:ring-violet-100 transition-all"
              />
            </div>
          </div>

          {/* Stock + Threshold */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[0.7rem] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Current Stock</label>
              <input
                type="number" min={0}
                value={form.stock}
                onChange={e => handle("stock", Number(e.target.value))}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-sm text-[#1a0f2e] font-medium focus:outline-none focus:border-[#3b2063] focus:ring-2 focus:ring-violet-100 transition-all"
              />
            </div>
            <div>
              <label className="block text-[0.7rem] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Low Stock Alert</label>
              <input
                type="number" min={1}
                value={form.low_stock_threshold}
                onChange={e => handle("low_stock_threshold", Number(e.target.value))}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-sm text-[#1a0f2e] font-medium focus:outline-none focus:border-[#3b2063] focus:ring-2 focus:ring-violet-100 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-6 pb-5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-xs font-bold uppercase tracking-widest text-zinc-500 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-all active:scale-[0.98]"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className="flex-1 py-2.5 text-xs font-bold uppercase tracking-widest text-white bg-[#3b2063] hover:bg-[#2d1850] rounded-xl transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving ? <><div className="w-3.5 h-3.5 border-[1.5px] border-white/30 border-t-white rounded-full animate-spin" /> Saving…</> : mode === "add" ? "Add Item" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Delete Modal ───────────────────────────────────────────────────────────
const DeleteModal = ({
  item, onClose, onConfirm,
}: {
  item: InventoryItem;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) => {
  const [deleting, setDeleting] = useState(false);
  const confirm = async () => {
    setDeleting(true);
    try { await onConfirm(); onClose(); }
    finally { setDeleting(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-zinc-100 p-7 flex flex-col items-center text-center">
        <div className="w-11 h-11 rounded-[0.625rem] bg-red-50 flex items-center justify-center mb-4">
          <Trash2 size={18} className="text-red-500" />
        </div>
        <h3 className="text-sm font-bold text-[#1a0f2e] mb-1.5">Delete Item?</h3>
        <p className="text-xs text-zinc-500 font-medium mb-1">
          You're about to delete <span className="font-bold text-[#1a0f2e]">{item.name}</span>.
        </p>
        <p className="text-xs text-zinc-400 mb-6">This action cannot be undone.</p>
        <div className="flex flex-col w-full gap-2">
          <button onClick={confirm} disabled={deleting}
            className="w-full py-2.5 text-xs font-bold uppercase tracking-widest text-white bg-red-500 hover:bg-red-600 rounded-xl transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2">
            {deleting ? <><div className="w-3.5 h-3.5 border-[1.5px] border-white/30 border-t-white rounded-full animate-spin" />Deleting…</> : "Yes, Delete"}
          </button>
          <button onClick={onClose} className="w-full py-2.5 text-xs font-bold uppercase tracking-widest text-zinc-500 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-all active:scale-[0.98]">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// ── History Modal ──────────────────────────────────────────────────────────
const HistoryModal = ({
  item, onClose,
}: {
  item: InventoryItem;
  onClose: () => void;
}) => {
  const [logs,    setLogs]    = useState<StockLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(`/api/inventory/${item.id}/logs`)
      .then(d => setLogs(d.data ?? d))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, [item.id]);

  const actionColor = (a: string) =>
    a === "added" ? "text-emerald-600 bg-emerald-50 border-emerald-100"
    : a === "deducted" ? "text-red-500 bg-red-50 border-red-100"
    : "text-amber-600 bg-amber-50 border-amber-100";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-zinc-100 overflow-hidden flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#3b2063] flex items-center justify-center">
              <History size={13} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#1a0f2e] leading-tight">Stock History</h2>
              <p className="text-[0.65rem] text-zinc-400 font-medium">{item.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-zinc-100 transition-colors">
            <X size={15} className="text-zinc-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4" style={{ scrollbarWidth: "none" }}>
          {loading ? (
            <div className="flex flex-col gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-14 bg-zinc-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock size={28} className="text-zinc-200 mb-3" />
              <p className="text-sm font-semibold text-zinc-400">No history yet</p>
              <p className="text-xs text-zinc-300 mt-1">Stock changes will appear here</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {logs.map(log => (
                <div key={log.id} className="flex items-start gap-3 p-3 bg-zinc-50 border border-zinc-100 rounded-xl">
                  <span className={`mt-0.5 px-2 py-0.5 rounded-full text-[0.6rem] font-bold border capitalize shrink-0 ${actionColor(log.action)}`}>
                    {log.action}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[#1a0f2e]">
                      {log.action === "deducted" ? "-" : "+"}{log.quantity} {item.unit}
                      {log.note && <span className="font-normal text-zinc-400 ml-1">— {log.note}</span>}
                    </p>
                    <p className="text-[0.65rem] text-zinc-400 mt-0.5">
                      By {log.performed_by} · {new Date(log.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-zinc-100 shrink-0">
          <button onClick={onClose} className="w-full py-2.5 text-xs font-bold uppercase tracking-widest text-zinc-500 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-all">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Inventory Page ────────────────────────────────────────────────────
const InventoryPage: React.FC = () => {
  const [items,          setItems]          = useState<InventoryItem[]>([]);
  const [branches,       setBranches]       = useState<Branch[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState("");
  const [search,         setSearch]         = useState("");
  const [filterBranch,   setFilterBranch]   = useState<number | "all">("all");
  const [filterStatus,   setFilterStatus]   = useState<"all" | "low" | "out">("all");
  const [sortField,      setSortField]      = useState<"name" | "stock">("name");
  const [sortDir,        setSortDir]        = useState<"asc" | "desc">("asc");
  const [modal,          setModal]          = useState<ModalState>({ type: null });

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [invData, branchData] = await Promise.all([
        apiFetch("/api/inventory"),
        apiFetch("/api/branches"),
      ]);
      setItems(invData.data ?? invData);
      setBranches(branchData.data ?? branchData);
    } catch {
      setError("Failed to load inventory. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── CRUD handlers ────────────────────────────────────────────────────────
  const handleAdd = async (data: Partial<InventoryItem>) => {
    await apiFetch("/api/inventory", { method: "POST", body: JSON.stringify(data) });
    await fetchAll();
  };

  const handleEdit = async (data: Partial<InventoryItem>) => {
    await apiFetch(`/api/inventory/${modal.item!.id}`, { method: "PUT", body: JSON.stringify(data) });
    await fetchAll();
  };

  const handleDelete = async () => {
    await apiFetch(`/api/inventory/${modal.item!.id}`, { method: "DELETE" });
    await fetchAll();
  };

  // ── Derived data ─────────────────────────────────────────────────────────
  const filtered = items
    .filter(i => {
      const matchSearch = i.name.toLowerCase().includes(search.toLowerCase()) ||
                          i.category.toLowerCase().includes(search.toLowerCase());
      const matchBranch = filterBranch === "all" || i.branch_id === filterBranch;
      const matchStatus = filterStatus === "all" ? true
        : filterStatus === "out" ? i.stock === 0
        : i.stock > 0 && i.stock <= i.low_stock_threshold;
      return matchSearch && matchBranch && matchStatus;
    })
    .sort((a, b) => {
      const v = sortField === "name"
        ? a.name.localeCompare(b.name)
        : a.stock - b.stock;
      return sortDir === "asc" ? v : -v;
    });

  const lowCount = items.filter(i => i.stock > 0 && i.stock <= i.low_stock_threshold).length;
  const outCount = items.filter(i => i.stock === 0).length;

  const toggleSort = (f: "name" | "stock") => {
    if (sortField === f) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(f); setSortDir("asc"); }
  };

  // ── Skeleton ─────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="p-6 flex flex-col gap-4">
      <div className="h-8 w-48 bg-zinc-100 rounded-xl animate-pulse" />
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-zinc-100 rounded-2xl animate-pulse" />)}
      </div>
      <div className="h-96 bg-zinc-100 rounded-2xl animate-pulse" />
    </div>
  );

  return (
    <div className="p-6 flex flex-col gap-5 min-h-0">

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black text-[#1a0f2e] tracking-tight">Inventory</h1>
          <p className="text-xs text-zinc-400 font-medium mt-0.5">
            {items.length} items across {branches.length} branches
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchAll}
            className="p-2 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-400 hover:text-zinc-600 transition-all active:scale-95"
          >
            <RefreshCw size={14} />
          </button>
          <button
            onClick={() => setModal({ type: "add" })}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#3b2063] hover:bg-[#2d1850] text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all active:scale-[0.98]"
          >
            <Plus size={13} /> Add Item
          </button>
        </div>
      </div>

      {/* ── Alert banner ──────────────────────────────────────────────── */}
      {(lowCount > 0 || outCount > 0) && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-100 rounded-xl">
          <AlertTriangle size={15} className="text-amber-500 shrink-0" />
          <p className="text-xs font-semibold text-amber-700">
            {outCount > 0 && <span className="text-red-600">{outCount} item{outCount > 1 ? "s" : ""} out of stock</span>}
            {outCount > 0 && lowCount > 0 && <span className="text-amber-400 mx-1.5">·</span>}
            {lowCount > 0 && <span>{lowCount} item{lowCount > 1 ? "s" : ""} running low</span>}
          </p>
        </div>
      )}

      {/* ── Stat cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Items",  value: items.length,  color: "bg-violet-50 border-violet-100", text: "text-[#3b2063]" },
          { label: "Low Stock",    value: lowCount,       color: "bg-amber-50  border-amber-100",  text: "text-amber-600" },
          { label: "Out of Stock", value: outCount,       color: "bg-red-50    border-red-100",    text: "text-red-600" },
        ].map(c => (
          <div key={c.label} className={`${c.color} border rounded-2xl px-4 py-4`}>
            <p className={`text-2xl font-black ${c.text}`}>{c.value}</p>
            <p className="text-[0.65rem] font-bold uppercase tracking-wider text-zinc-400 mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      {/* ── Filters ───────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-45">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-300" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search items or categories…"
            className="w-full pl-8 pr-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl text-[#1a0f2e] font-medium placeholder-zinc-300 focus:outline-none focus:border-[#3b2063] focus:ring-2 focus:ring-violet-100 transition-all"
          />
        </div>

        {/* Branch filter */}
        <div className="relative">
          <Filter size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-300 pointer-events-none" />
          <select
            value={filterBranch}
            onChange={e => setFilterBranch(e.target.value === "all" ? "all" : Number(e.target.value))}
            className="appearance-none pl-7 pr-6 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl text-[#1a0f2e] font-medium focus:outline-none focus:border-[#3b2063] focus:ring-2 focus:ring-violet-100 transition-all"
          >
            <option value="all">All Branches</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-300 pointer-events-none" />
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-1 bg-zinc-50 border border-zinc-200 rounded-xl p-1">
          {(["all", "low", "out"] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wider rounded-lg transition-all
                ${filterStatus === s ? "bg-white text-[#3b2063] shadow-sm border border-zinc-100" : "text-zinc-400 hover:text-zinc-600"}`}
            >
              {s === "all" ? "All" : s === "low" ? "Low" : "Out"}
            </button>
          ))}
        </div>
      </div>

      {/* ── Error ─────────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-medium">
          <AlertTriangle size={13} /> {error}
        </div>
      )}

      {/* ── Table ─────────────────────────────────────────────────────── */}
      <div className="bg-white border border-zinc-100 rounded-2xl overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-2 px-4 py-2.5 bg-zinc-50 border-b border-zinc-100">
          {[
            { label: "Item",     field: "name"  as const },
            { label: "Branch",   field: null },
            { label: "Category", field: null },
            { label: "Stock",    field: "stock" as const },
            { label: "Status",   field: null },
            { label: "Actions",  field: null },
          ].map(col => (
            <button
              key={col.label}
              onClick={() => col.field && toggleSort(col.field)}
              className={`flex items-center gap-1 text-[0.62rem] font-bold uppercase tracking-wider text-zinc-400 text-left
                ${col.field ? "hover:text-zinc-600 transition-colors" : "cursor-default"}`}
            >
              {col.label}
              {col.field && <ArrowUpDown size={9} className={sortField === col.field ? "text-[#3b2063]" : ""} />}
            </button>
          ))}
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Package size={32} className="text-zinc-200 mb-3" />
            <p className="text-sm font-semibold text-zinc-400">No items found</p>
            <p className="text-xs text-zinc-300 mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-50">
            {filtered.map(item => (
              <div
                key={item.id}
                className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-2 px-4 py-3 items-center hover:bg-zinc-50/60 transition-colors"
              >
                {/* Name */}
                <div>
                  <p className="text-xs font-bold text-[#1a0f2e] truncate">{item.name}</p>
                  <p className="text-[0.6rem] text-zinc-400 font-medium mt-0.5">{item.unit}</p>
                </div>

                {/* Branch */}
                <p className="text-xs text-zinc-500 font-medium truncate">
                  {item.branch_name ?? branches.find(b => b.id === item.branch_id)?.name ?? "—"}
                </p>

                {/* Category */}
                <span className="inline-block px-2 py-0.5 bg-violet-50 text-violet-600 border border-violet-100 rounded-full text-[0.62rem] font-bold truncate max-w-25">
                  {item.category || "—"}
                </span>

                {/* Stock */}
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-bold text-[#1a0f2e]">
                    {item.stock} <span className="text-zinc-400 font-normal text-[0.6rem]">{item.unit}</span>
                  </p>
                  <StockBar stock={item.stock} threshold={item.low_stock_threshold} />
                </div>

                {/* Status */}
                <StockBadge stock={item.stock} threshold={item.low_stock_threshold} />

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setModal({ type: "history", item })}
                    title="Stock history"
                    className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors"
                  >
                    <History size={13} />
                  </button>
                  <button
                    onClick={() => setModal({ type: "edit", item })}
                    title="Edit"
                    className="p-1.5 rounded-lg hover:bg-violet-50 text-zinc-400 hover:text-[#3b2063] transition-colors"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => setModal({ type: "delete", item })}
                    title="Delete"
                    className="p-1.5 rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Modals ────────────────────────────────────────────────────── */}
      {modal.type === "add" && (
        <ItemFormModal mode="add" branches={branches} onClose={() => setModal({ type: null })} onSave={handleAdd} />
      )}
      {modal.type === "edit" && modal.item && (
        <ItemFormModal mode="edit" item={modal.item} branches={branches} onClose={() => setModal({ type: null })} onSave={handleEdit} />
      )}
      {modal.type === "delete" && modal.item && (
        <DeleteModal item={modal.item} onClose={() => setModal({ type: null })} onConfirm={handleDelete} />
      )}
      {modal.type === "history" && modal.item && (
        <HistoryModal item={modal.item} onClose={() => setModal({ type: null })} />
      )}
    </div>
  );
};

export default InventoryPage;