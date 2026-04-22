// components/NewSuperAdmin/Tabs/AuditLogsTab.tsx
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search, Download, Clock, XCircle, Users, Activity,
  ChevronLeft, ChevronRight, AlertCircle, Eye,
} from "lucide-react";
import { createPortal } from "react-dom";

type ColorKey = "violet" | "emerald" | "red" | "amber";
type VariantKey = "primary" | "secondary" | "danger" | "ghost";
type SizeKey = "sm" | "md" | "lg";

interface StatCardProps {
  icon: React.ReactNode; label: string; value: string | number;
  sub?: string; trend?: number; color?: ColorKey;
}
interface BtnProps {
  children: React.ReactNode; variant?: VariantKey; size?: SizeKey;
  onClick?: () => void; className?: string; disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color = "violet" }) => {
  const colors: Record<ColorKey, { bg: string; border: string; icon: string }> = {
    violet: { bg: "bg-violet-50", border: "border-violet-200", icon: "text-violet-600" },
    emerald: { bg: "bg-emerald-50", border: "border-emerald-200", icon: "text-emerald-600" },
    red: { bg: "bg-red-50", border: "border-red-200", icon: "text-red-500" },
    amber: { bg: "bg-amber-50", border: "border-amber-200", icon: "text-amber-600" },
  };
  const c = colors[color];
  return (
    <div className="bg-white border border-zinc-200 rounded-[0.625rem] px-6 py-5 flex items-center gap-3 card">
      <div className={`w-10 h-10 ${c.bg} border ${c.border} flex items-center justify-center rounded-[0.4rem] shrink-0`}>
        <span className={c.icon}>{icon}</span>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{label}</p>
        <p className="text-xl font-bold text-[#1a0f2e] tabular-nums">{value}</p>
      </div>
    </div>
  );
};

const Btn: React.FC<BtnProps> = ({
  children, variant = "primary", size = "sm",
  onClick, className = "", disabled = false, type = "button",
}) => {
  const sizes: Record<SizeKey, string> = { sm: "px-3 py-2 text-xs", md: "px-4 py-2.5 text-sm", lg: "px-6 py-3 text-sm" };
  const variants: Record<VariantKey, string> = {
    primary: "bg-[#a020f0] hover:bg-[#2a1647] text-white",
    secondary: "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50",
    danger: "bg-red-600 hover:bg-red-700 text-white",
    ghost: "bg-transparent text-zinc-500 hover:bg-zinc-100",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`inline-flex items-center gap-1.5 font-bold rounded-lg transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 ${sizes[size]} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

// ── Types ─────────────────────────────────────────────────────────────────────
interface AuditLog {
  id: number;
  user_id: number;
  action: string;
  module: string;
  details: string | null;
  ip_address: string | null;
  created_at: string;
  user?: { id: number; name: string };
}
interface Stats {
  total_events: number;
  today_count: number;
  voids_today: number;
  unique_users: number;
  modules: string[];
}
interface Meta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

// ── API ───────────────────────────────────────────────────────────────────────
const getToken = () =>
  localStorage.getItem("auth_token") || localStorage.getItem("lucky_boba_token") || "";
const authHeaders = () => ({
  "Content-Type": "application/json",
  "Accept": "application/json",
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

// Module → badge style
const MODULE_STYLE: Record<string, string> = {
  void: "text-red-500 bg-red-50 border-red-200",
  create: "text-emerald-600 bg-emerald-50 border-emerald-200",
  edit: "text-amber-600 bg-amber-50 border-amber-200",
  delete: "text-red-500 bg-red-50 border-red-200",
  cash: "text-violet-600 bg-violet-50 border-violet-200",
  discount: "text-blue-600 bg-blue-50 border-blue-200",
  promo: "text-pink-600 bg-pink-50 border-pink-200",
  report: "text-zinc-600 bg-zinc-50 border-zinc-200",
  branch: "text-emerald-600 bg-emerald-50 border-emerald-200",
  user: "text-violet-600 bg-violet-50 border-violet-200",
  menu: "text-amber-600 bg-amber-50 border-amber-200",
  sale: "text-blue-600 bg-blue-50 border-blue-200",
};
const moduleStyle = (m: string) =>
  MODULE_STYLE[m?.toLowerCase()] ?? "text-zinc-600 bg-zinc-50 border-zinc-200";

const initials = (name?: string) =>
  (name ?? "?").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

const formatDate = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86400000 && d.getDate() === now.getDate()) return "Today";
  if (diff < 172800000) return "Yesterday";
  return d.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
};
const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit", hour12: true });

// ── Log Detail Modal ──────────────────────────────────────────────────────────
const LogDetailModal: React.FC<{ log: AuditLog; onClose: () => void }> = ({ log, onClose }) => {
  const isJSON = (str: string | null) => {
    if (!str) return false;
    try {
      const p = JSON.parse(str);
      return typeof p === 'object' && p !== null;
    } catch { return false; }
  };

  const getDetails = (str: string | null) => {
    if (!str) return (
      <div className="p-8 border border-dashed border-zinc-100 rounded-lg flex flex-col items-center gap-2">
        <Activity size={24} className="text-zinc-100" />
        <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">No extra payload</p>
      </div>
    );
    if (isJSON(str)) {
      return (
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-violet-500/5 to-fuchsia-500/5 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
          <pre className="relative p-5 bg-[#fafaff] border border-violet-100/50 rounded-xl text-[11px] font-mono text-violet-600/70 overflow-x-auto leading-relaxed">
            {JSON.stringify(JSON.parse(str), null, 2)}
          </pre>
        </div>
      );
    }
    return (
      <div className="p-5 bg-zinc-50 border border-zinc-100 rounded-xl">
        <p className="text-xs text-zinc-600 leading-relaxed font-medium">{str}</p>
      </div>
    );
  };

  return createPortal(
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-6 transition-all duration-300">
      <div className="absolute inset-0 bg-zinc-950/20 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg rounded-xl shadow-[0_32px_64px_-16px_rgba(59,32,99,0.12)] flex flex-col max-h-[85vh] overflow-hidden border border-white/20 ring-1 ring-zinc-200/50">
        
        {/* Professional Header */}
        <div className="flex items-center justify-between px-8 pt-8 pb-4 shrink-0">
          <div>
            <h3 className="text-base font-black text-[#1a0f2e] tracking-tight">Activity Detail</h3>
            <p className="text-[10px] font-mono text-zinc-400 mt-0.5 uppercase tracking-tighter font-bold">Ref: #{String(log.id).padStart(5, "0")}</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-zinc-50 rounded-full text-zinc-400 transition-all active:scale-90">
            <XCircle size={22} strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-8 pb-8 space-y-8 custom-scrollbar">
          
          {/* Action Focus */}
          <div className="relative overflow-hidden group">
            <div className="absolute inset-0 bg-[#a020f0] opacity-[0.03]"></div>
            <div className="relative p-6 rounded-2xl border border-[#a020f0]/10">
              <p className="text-sm font-black text-[#a020f0] leading-snug tracking-tight">{log.action}</p>
              <div className="flex items-center gap-2 mt-3">
                <span className={`inline-flex px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${moduleStyle(log.module)}`}>
                  {log.module}
                </span>
                <div className="h-1 w-1 rounded-full bg-zinc-200"></div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">System Audit</p>
              </div>
            </div>
          </div>

          {/* Technical Specs Vertical List */}
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Origin User</p>
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center text-[10px] font-black text-violet-600 shadow-inner">
                    {initials(log.user?.name)}
                  </div>
                  <p className="text-xs font-black text-[#1a0f2e]">{log.user?.name ?? "Internal System"}</p>
                </div>
              </div>
              <div className="space-y-1 text-right">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Source IP</p>
                <p className="text-xs font-mono font-bold text-zinc-600 bg-zinc-50 px-2 py-0.5 rounded border border-zinc-100">{log.ip_address ?? "Local"}</p>
              </div>
            </div>

            <div className="flex items-start justify-between border-t border-zinc-50 pt-6">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Date Logged</p>
                <p className="text-xs font-black text-zinc-700">{formatDate(log.created_at)}</p>
              </div>
              <div className="space-y-1 text-right">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Time (PHT)</p>
                <p className="text-xs font-mono font-bold text-zinc-700">{formatTime(log.created_at)}</p>
              </div>
            </div>
          </div>

          {/* Data Payload Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">System Payload</p>
              <div className="h-[1px] flex-1 bg-zinc-50 mx-4"></div>
              {isJSON(log.details) && <span className="text-[8px] font-black bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded uppercase tracking-tighter">Secure JSON</span>}
            </div>
            {getDetails(log.details)}
          </div>
        </div>

        {/* Minimalist Tip */}
        <div className="px-8 py-4 bg-zinc-50/50 border-t border-zinc-100 flex items-center justify-center gap-2 shrink-0">
           <p className="text-[9px] font-bold text-zinc-300 uppercase tracking-[0.2em]">End of Technical Record</p>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
const AuditLogsTab: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [module, setModule] = useState("all");
  const [page, setPage] = useState(1);
  const [branches, setBranches] = useState<{ id: number; name: string }[]>([]);
  const [branchFilter, setBranchFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  //    so fetchLogs is stable across renders (empty dep array is correct).
  const fetchLogs = useCallback(async (p = 1, s = "", m = "all", b = "all") => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ per_page: "20", page: String(p) });
      if (s) params.set("search", s);
      if (m !== "all") params.set("module", m);
      if (b !== "all") params.set("branch_id", b);

      const res = await fetch(`/api/audit-logs?${params}`, { headers: authHeaders() });
      const data = await res.json();
      if (!data.success) throw new Error("Failed");
      setLogs(data.data);
      setStats(data.stats);
      setMeta(data.meta);
    } catch {
      setError("Failed to load audit logs.");
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ fetchLogs is now a stable reference, so this effect only runs once on mount.
  useEffect(() => {
    fetchLogs(1);
    // fetch branches for filter
    fetch("/api/branches", { headers: authHeaders() })
      .then(r => r.json())
      .then(d => { if (d.success) setBranches(d.data); })
      .catch(() => { });
  }, [fetchLogs]);

  // ✅ Auto-refresh polling (every 10 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      // Only auto-update if on first page and no active filters/modals
      if (page === 1 && !search && module === "all" && branchFilter === "all" && !selectedLog && !loading) {
        fetchLogs(1, "", "all", "all");
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [page, search, module, branchFilter, selectedLog, loading, fetchLogs]);

  const handleBranch = (val: string) => {
    setBranchFilter(val);
    setPage(1);
    fetchLogs(1, search, module, val);
  };

  const handleSearch = (val: string) => {
    setSearch(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setPage(1);
      fetchLogs(1, val, module, branchFilter);
    }, 400);
  };

  const handleModule = (val: string) => {
    setModule(val);
    setPage(1);
    fetchLogs(1, search, val, branchFilter);
  };

  const handlePage = (p: number) => {
    setPage(p);
    fetchLogs(p, search, module, branchFilter);
  };

  // Derived modules list from stats
  const moduleOptions = stats?.modules ?? [];

  const [exporting, setExporting] = useState(false);

  // CSV export: fetch all matching logs (unpaginated) and trigger download
  const exportCSV = useCallback(async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (module !== "all") params.set("module", module);
      if (branchFilter !== "all") params.set("branch_id", branchFilter);

      const res = await fetch(`/api/audit-logs/export?${params}`, { headers: authHeaders() });
      const data = await res.json();
      if (!data.success) throw new Error("Export failed");

      const rows: AuditLog[] = data.data ?? [];
      if (rows.length === 0) {
        setExporting(false);
        return;
      }

      // Build CSV content
      const escape = (val: string) => {
        if (val.includes(",") || val.includes('"') || val.includes("\n")) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      };

      const headers = ["ID", "User", "Action", "Details", "Module", "IP Address", "Date", "Time"];
      const csvRows = rows.map(log => [
        String(log.id),
        log.user?.name ?? `User #${log.user_id}`,
        log.action,
        log.details ?? "",
        log.module,
        log.ip_address ?? "",
        new Date(log.created_at).toLocaleDateString("en-PH", { month: "2-digit", day: "2-digit", year: "numeric" }),
        new Date(log.created_at).toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true }),
      ].map(v => escape(v)).join(","));

      const csv = [headers.join(","), ...csvRows].join("\n");
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      setError("Failed to export audit logs.");
    } finally {
      setExporting(false);
    }
  }, [search, module, branchFilter]);

  return (
    <div className="p-6 md:p-8 fade-in">

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle size={14} className="text-red-500 shrink-0" />
          <p className="text-xs text-red-600 font-medium">{error}</p>
          <Btn variant="secondary" size="sm" onClick={() => fetchLogs(page, search, module)} className="ml-auto">Retry</Btn>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<Activity size={16} />} label="Total Events" value={stats ? stats.total_events.toLocaleString() : "—"} color="violet" />
        <StatCard icon={<Clock size={16} />} label="Today" value={stats ? stats.today_count : "—"} color="emerald" />
        <StatCard icon={<XCircle size={16} />} label="Voids Today" value={stats ? stats.voids_today : "—"} color="red" />
        <StatCard icon={<Users size={16} />} label="Unique Users" value={stats ? stats.unique_users : "—"} color="amber" />
      </div>

      {/* Table card */}
      <div className="bg-white border border-zinc-200 rounded-[0.625rem] overflow-hidden">

        {/* Filters */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-100 flex-wrap">
          <div className="flex-1 min-w-48 flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2">
            <Search size={13} className="text-zinc-400 shrink-0" />
            <input
              value={search}
              onChange={e => handleSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm text-zinc-700 outline-none placeholder:text-zinc-400"
              placeholder="Search by user, action, or module..."
            />
          </div>
          <select
            value={module}
            onChange={e => handleModule(e.target.value)}
            className="bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-600 outline-none"
          >
            <option value="all">All Modules</option>
            {moduleOptions.map(m => (
              <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
            ))}
          </select>
          <select
            value={branchFilter}
            onChange={e => handleBranch(e.target.value)}
            className="bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-600 outline-none"
          >
            <option value="all">All Branches</option>
            {branches.map(b => (
              <option key={b.id} value={String(b.id)}>{b.name}</option>
            ))}
          </select>
          <Btn variant="secondary" onClick={exportCSV} disabled={exporting || loading} className="shrink-0 ml-auto md:ml-0">
            {exporting
              ? <><div className="w-3 h-3 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" /> Exporting…</>
              : <><Download size={13} /> Export</>
            }
          </Btn>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100">
                {["#", "User", "Action", "Details", "Module", "IP", "Date", "Time", "Actions"].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-zinc-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Skeleton */}
              {loading && [...Array(8)].map((_, i) => (
                <tr key={i} className="border-b border-zinc-50">
                  {[...Array(8)].map((_, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-3 bg-zinc-100 rounded animate-pulse" style={{ width: `${50 + Math.random() * 40}%` }} />
                    </td>
                  ))}
                </tr>
              ))}

              {/* Empty */}
              {!loading && logs.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-zinc-400 text-xs font-medium">
                    {search || module !== "all"
                      ? "No logs match your filters."
                      : "No audit logs recorded yet. Actions performed through the system will appear here."}
                  </td>
                </tr>
              )}

              {/* Rows */}
              {!loading && logs.map(log => (
                <tr key={log.id} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                  <td className="px-5 py-3.5 text-zinc-300 text-xs font-bold">
                    #{String(log.id).padStart(4, "0")}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#ede8ff] flex items-center justify-center text-[9px] font-bold text-[#a020f0] shrink-0">
                        {initials(log.user?.name)}
                      </div>
                      <span className="font-medium text-[#1a0f2e] text-xs whitespace-nowrap">
                        {log.user?.name ?? `User #${log.user_id}`}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-zinc-700 text-xs max-w-48 truncate">{log.action}</td>
                  <td className="px-5 py-3.5 text-zinc-500 text-xs max-w-48 truncate">{log.details ?? "—"}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${moduleStyle(log.module)}`}>
                      {log.module}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-zinc-400 text-xs font-mono">{log.ip_address ?? "—"}</td>
                  <td className="px-5 py-3.5 text-zinc-400 text-xs whitespace-nowrap">{formatDate(log.created_at)}</td>
                  <td className="px-5 py-3.5 text-zinc-400 text-xs tabular-nums whitespace-nowrap">{formatTime(log.created_at)}</td>
                  <td className="px-5 py-3.5">
                    <button onClick={() => setSelectedLog(log)} className="p-1.5 hover:bg-[#ede8ff] text-[#a020f0] rounded-lg transition-all" title="View Detail">
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-100">
            <p className="text-xs text-zinc-400">
              Showing {((meta.current_page - 1) * meta.per_page) + 1}–{Math.min(meta.current_page * meta.per_page, meta.total)} of {meta.total.toLocaleString()} entries
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePage(page - 1)} disabled={page === 1}
                className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:bg-zinc-100 rounded-[0.4rem] disabled:opacity-30 transition-colors">
                <ChevronLeft size={13} />
              </button>
              {Array.from({ length: Math.min(5, meta.last_page) }, (_, i) => {
                const p = meta.last_page <= 5 ? i + 1
                  : page <= 3 ? i + 1
                    : page >= meta.last_page - 2 ? meta.last_page - 4 + i
                      : page - 2 + i;
                return (
                  <button key={p} onClick={() => handlePage(p)}
                    className={`w-7 h-7 text-xs font-bold rounded-[0.4rem] transition-colors ${p === page ? "bg-[#a020f0] text-white" : "text-zinc-400 hover:bg-zinc-100"}`}>
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => handlePage(page + 1)} disabled={page === meta.last_page}
                className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:bg-zinc-100 rounded-[0.4rem] disabled:opacity-30 transition-colors">
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}

        {meta && (
          <div className="px-5 py-2 border-t border-zinc-50">
            <p className="text-[10px] text-zinc-300 font-medium">
              {meta.total.toLocaleString()} total entries · Page {meta.current_page} of {meta.last_page}
            </p>
          </div>
        )}
      </div>

      {selectedLog && <LogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />}
    </div>
  );
};

export default AuditLogsTab;
