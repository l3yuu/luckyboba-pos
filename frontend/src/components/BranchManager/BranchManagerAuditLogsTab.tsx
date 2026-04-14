// components/BranchManager/Tabs/AuditLogsTab.tsx
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search, Download, Clock, XCircle, Users, Activity,
  ChevronLeft, ChevronRight, AlertCircle,
} from "lucide-react";

type ColorKey = "violet" | "emerald" | "red" | "amber";
type VariantKey = "primary" | "secondary" | "danger" | "ghost";
type SizeKey = "sm" | "md" | "lg";

interface StatCardProps {
  icon: React.ReactNode; label: string; value: string | number;
  color?: ColorKey;
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
    <div className="bg-white border border-zinc-200 rounded-[0.625rem] px-6 py-5 flex items-center gap-3">
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
    primary: "bg-[#3b2063] hover:bg-[#2a1647] text-white",
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

const getToken = () =>
  localStorage.getItem("auth_token") || localStorage.getItem("lucky_boba_token") || "";
const authHeaders = () => ({
  "Content-Type": "application/json",
  "Accept": "application/json",
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

const MODULE_STYLE: Record<string, string> = {
  void: "text-red-500 bg-red-50 border-red-200",
  create: "text-emerald-600 bg-emerald-50 border-emerald-200",
  edit: "text-amber-600 bg-amber-50 border-amber-200",
  delete: "text-red-500 bg-red-50 border-red-200",
  cash: "text-violet-600 bg-violet-50 border-violet-200",
  discount: "text-blue-600 bg-blue-50 border-blue-200",
  sales_order: "text-violet-600 bg-violet-50 border-violet-200",
  branch_manager_nav: "text-zinc-600 bg-zinc-50 border-zinc-200",
  auth: "text-emerald-600 bg-emerald-50 border-emerald-200",
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

// ── Main Component ─────────────────────────────────────────────────────────────
const BranchManagerAuditLogsTab: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [module, setModule] = useState("all");
  const [page, setPage] = useState(1);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Branch manager sees only their branch's logs via the scoped endpoint
  const fetchLogs = useCallback(async (p = 1, s = "", m = "all") => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ per_page: "20", page: String(p) });
      if (s) params.set("search", s);
      if (m !== "all") params.set("module", m);

      // Uses /api/branch/audit-logs — scoped to branch on the server side
      const res = await fetch(`/api/branch/audit-logs?${params}`, { headers: authHeaders() });
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

  useEffect(() => { fetchLogs(1); }, [fetchLogs]);

  const handleSearch = (val: string) => {
    setSearch(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setPage(1);
      fetchLogs(1, val, module);
    }, 400);
  };

  const handleModule = (val: string) => {
    setModule(val);
    setPage(1);
    fetchLogs(1, search, val);
  };

  const handlePage = (p: number) => {
    setPage(p);
    fetchLogs(p, search, module);
  };

  const moduleOptions = stats?.modules ?? [];

  return (
    <div className="p-6 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center gap-6 mb-8">
        <div className="flex-1 flex flex-col md:flex-row items-center gap-3">
          <div className="relative group flex-1 w-full md:w-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-[#3b2063]" size={15} />
            <input
              type="text"
              placeholder="Search user, action, or module..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#ede8ff] focus:border-[#3b2063] transition-all shadow-sm"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <select
              value={module}
              onChange={e => handleModule(e.target.value)}
              className="bg-white border border-zinc-200 rounded-xl px-4 py-3 text-xs font-bold text-zinc-600 outline-none shadow-sm cursor-pointer hover:bg-zinc-50 transition-all shrink-0"
            >
              <option value="all">All Modules</option>
              {moduleOptions.map(m => (
                <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1).replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-auto w-full md:w-auto">
            <Btn variant="secondary" className="w-full md:w-auto px-5 py-3 rounded-xl shadow-sm">
              <Download size={15} /> Export
            </Btn>
          </div>
        </div>
      </div>

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



        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100">
                {["#", "User", "Action", "Details", "Module", "IP", "Date", "Time"].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-zinc-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && [...Array(8)].map((_, i) => (
                <tr key={i} className="border-b border-zinc-50">
                  {[...Array(8)].map((_, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-3 bg-zinc-100 rounded animate-pulse" style={{ width: `${50 + Math.random() * 40}%` }} />
                    </td>
                  ))}
                </tr>
              ))}

              {!loading && logs.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-zinc-400 text-xs font-medium">
                    {search || module !== "all"
                      ? "No logs match your filters."
                      : "No audit logs recorded yet for this branch."}
                  </td>
                </tr>
              )}

              {!loading && logs.map(log => (
                <tr key={log.id} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                  <td className="px-5 py-3.5 text-zinc-300 text-xs font-bold">
                    #{String(log.id).padStart(4, "0")}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#ede8ff] flex items-center justify-center text-[9px] font-bold text-[#3b2063] shrink-0">
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
                      {log.module.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-zinc-400 text-xs font-mono">{log.ip_address ?? "—"}</td>
                  <td className="px-5 py-3.5 text-zinc-400 text-xs whitespace-nowrap">{formatDate(log.created_at)}</td>
                  <td className="px-5 py-3.5 text-zinc-400 text-xs tabular-nums whitespace-nowrap">{formatTime(log.created_at)}</td>
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
              <button onClick={() => handlePage(page - 1)} disabled={page === 1}
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
                    className={`w-7 h-7 text-xs font-bold rounded-[0.4rem] transition-colors ${p === page ? "bg-[#3b2063] text-white" : "text-zinc-400 hover:bg-zinc-100"}`}>
                    {p}
                  </button>
                );
              })}
              <button onClick={() => handlePage(page + 1)} disabled={page === meta.last_page}
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
    </div>
  );
};

export default BranchManagerAuditLogsTab;