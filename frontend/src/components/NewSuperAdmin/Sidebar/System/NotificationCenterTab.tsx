// components/NewSuperAdmin/Sidebar/System/NotificationCenterTab.tsx
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Bell, AlertTriangle, AlertCircle, Info, RefreshCw, Package,
  XCircle, Banknote, ShoppingCart, Filter, Clock,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Notification {
  id:          string;
  type:        string;
  title:       string;
  message:     string;
  severity:    "critical" | "warning" | "info";
  at:          string;
  branch_name: string;
}

type SeverityKey = "all" | "critical" | "warning" | "info";
type TypeKey     = "all" | "low_stock" | "void" | "cash_in" | "purchase_order" | "online_order";

// ── API helper ────────────────────────────────────────────────────────────────
const getToken = () =>
  localStorage.getItem("auth_token") || localStorage.getItem("lucky_boba_token") || "";
const authHeaders = () => ({
  "Content-Type": "application/json",
  Accept: "application/json",
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

// ── UI atoms ──────────────────────────────────────────────────────────────────
const SEVERITY_CFG = {
  critical: {
    bg: "bg-red-50", border: "border-red-200", text: "text-red-600",
    badge: "bg-red-100 text-red-700 border-red-200",
    icon: <AlertCircle size={14} />, label: "Critical",
    dot: "bg-red-500 animate-pulse",
  },
  warning: {
    bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-600",
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    icon: <AlertTriangle size={14} />, label: "Warning",
    dot: "bg-amber-500",
  },
  info: {
    bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-600",
    badge: "bg-blue-100 text-blue-700 border-blue-200",
    icon: <Info size={14} />, label: "Info",
    dot: "bg-blue-400",
  },
};

const TYPE_ICON: Record<string, React.ReactNode> = {
  low_stock:      <Package      size={16} className="text-amber-500" />,
  void:           <XCircle      size={16} className="text-red-400" />,
  cash_in:        <Banknote     size={16} className="text-violet-500" />,
  purchase_order: <ShoppingCart size={16} className="text-blue-500" />,
  online_order:   <Clock        size={16} className="text-emerald-500" />,
};

const TYPE_LABELS: Record<string, string> = {
  all:            "All Types",
  low_stock:      "Low Stock",
  void:           "Voided Sales",
  cash_in:        "Cash-In",
  purchase_order: "Purchase Orders",
  online_order:   "Online Orders",
};

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

// ── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, color }: {
  icon: React.ReactNode; label: string; value: number;
  color: { bg: string; border: string; iconColor: string };
}) => (
  <div className="bg-white border border-zinc-200 rounded-[0.625rem] px-5 py-4 card shadow-sm">
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 ${color.bg} border ${color.border} flex items-center justify-center rounded-[0.4rem] shrink-0`}>
        <span className={color.iconColor}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 truncate">{label}</p>
        <p className="text-xl font-bold text-[#1a0f2e] tabular-nums">{value}</p>
      </div>
    </div>
  </div>
);

const Skeleton = ({ className = "" }: { className?: string }) => (
  <div className={`bg-zinc-100 animate-pulse rounded ${className}`} />
);

// ── Main Component ────────────────────────────────────────────────────────────
const NotificationCenterTab: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading]             = useState(true);
  const [sevFilter, setSevFilter]         = useState<SeverityKey>("all");
  const [typeFilter, setTypeFilter]       = useState<TypeKey>("all");
  const [lastCount, setLastCount]         = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res  = await fetch("/api/notifications/summary", { headers: authHeaders() });
      const data = await res.json();
      const list: Notification[] = data.notifications ?? [];
      setNotifications(list);

      // Play chime if new notifications arrived
      if (lastCount > 0 && list.length > lastCount) {
        try { new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA").play(); } catch {}
      }
      setLastCount(list.length);
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  }, [lastCount]);

  useEffect(() => {
    fetchNotifications();
    pollRef.current = setInterval(fetchNotifications, 30000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchNotifications]);

  // Filtered view
  const filtered = notifications.filter(n => {
    if (sevFilter !== "all" && n.severity !== sevFilter) return false;
    if (typeFilter !== "all" && n.type !== typeFilter) return false;
    return true;
  });

  const critCount = notifications.filter(n => n.severity === "critical").length;
  const warnCount = notifications.filter(n => n.severity === "warning").length;
  const infoCount = notifications.filter(n => n.severity === "info").length;

  return (
    <div className="p-6 md:p-8 fade-in">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<Bell size={18} strokeWidth={2.5} />} label="Total Alerts" value={notifications.length}
          color={{ bg: "bg-[#f5f0ff]", border: "border-[#e9d5ff]", iconColor: "text-[#3b2063]" }} />
        <StatCard icon={<AlertCircle size={18} strokeWidth={2.5} />} label="Critical" value={critCount}
          color={{ bg: "bg-red-50", border: "border-red-200", iconColor: "text-red-500" }} />
        <StatCard icon={<AlertTriangle size={18} strokeWidth={2.5} />} label="Warnings" value={warnCount}
          color={{ bg: "bg-amber-50", border: "border-amber-200", iconColor: "text-amber-600" }} />
        <StatCard icon={<Info size={18} strokeWidth={2.5} />} label="Info" value={infoCount}
          color={{ bg: "bg-blue-50", border: "border-blue-200", iconColor: "text-blue-500" }} />
      </div>

      {/* Main card */}
      <div className="bg-white border border-zinc-200 rounded-[0.625rem] overflow-hidden shadow-sm">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-100 flex-wrap">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            <Filter size={11} /> Filters
          </div>
          <select value={sevFilter} onChange={e => setSevFilter(e.target.value as SeverityKey)}
            className="bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-600 outline-none">
            <option value="all">All Severity</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as TypeKey)}
            className="bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-600 outline-none">
            {Object.entries(TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <button onClick={() => { setLoading(true); fetchNotifications(); }}
            className="ml-auto inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 transition-all active:scale-[0.98] cursor-pointer">
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>

        {/* Notification list */}
        <div className="divide-y divide-zinc-50">
          {/* Skeletons */}
          {loading && [...Array(6)].map((_, i) => (
            <div key={i} className="flex items-start gap-3 px-5 py-4">
              <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-48" />
                <Skeleton className="h-2.5 w-72" />
              </div>
            </div>
          ))}

          {/* Empty */}
          {!loading && filtered.length === 0 && (
            <div className="px-5 py-16 text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                <Bell size={22} className="text-emerald-500" />
              </div>
              <p className="text-sm font-bold text-[#1a0f2e] mb-1">All Clear!</p>
              <p className="text-xs text-zinc-400 font-medium">
                {sevFilter !== "all" || typeFilter !== "all"
                  ? "No notifications match your filters."
                  : "No active alerts. Everything is running smoothly."}
              </p>
            </div>
          )}

          {/* Items */}
          {!loading && filtered.map(n => {
            const cfg = SEVERITY_CFG[n.severity];
            return (
              <div key={n.id}
                className={`flex items-start gap-3 px-5 py-4 transition-colors hover:bg-zinc-50/60`}>
                {/* Icon */}
                <div className={`w-9 h-9 rounded-lg ${cfg.bg} border ${cfg.border} flex items-center justify-center shrink-0 mt-0.5`}>
                  {TYPE_ICON[n.type] ?? <Bell size={16} className={cfg.text} />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-xs font-bold text-[#1a0f2e] truncate">{n.title}</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider border ${cfg.badge}`}>
                      {cfg.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">{n.message}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[10px] text-zinc-400 font-medium">{n.branch_name}</span>
                    <span className="text-[10px] text-zinc-300">·</span>
                    <span className="text-[10px] text-zinc-400 font-medium">{timeAgo(n.at)}</span>
                  </div>
                </div>

                {/* Severity dot */}
                <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot} shrink-0 mt-2`} />
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 border-t border-zinc-50">
          <p className="text-[10px] text-zinc-300 font-medium">
            {filtered.length} of {notifications.length} alerts shown · Auto-refreshes every 30s
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotificationCenterTab;
