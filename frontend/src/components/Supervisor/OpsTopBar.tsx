import { useState, useEffect } from "react";
import { Bell, Clock, MapPin } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface OpsTopBarProps {
  activeTab:   string;
  onMenuClick: () => void;
  branchLabel?: string | null;
  roleLabel:   string; // "Supervisor" or "Team Leader"
}

// ── Page Titles ───────────────────────────────────────────────────────────────
const PAGE_TITLES: Record<string, { label: string; desc: string }> = {
  dashboard:        { label: "Operations Overview", desc: "Live shift performance and sales metrics" },
  users:            { label: "Staff Overview",      desc: "Live cashier activity and performance"    },
  "void-logs":      { label: "Void Journal",        desc: "Audit trail for cancelled transactions"  },
  "sales-dashboard": { label: "Sales Analytics",     desc: "Detailed revenue and order breakdown"     },
  "items-report":    { label: "Items Report",        desc: "Product movement and quantity sold"       },
  "x-reading":       { label: "X-Reading",           desc: "Mid-day POS shift summary"                },
  "z-reading":       { label: "Z-Reading",           desc: "End-of-day POS closing report"            },
  "inventory-list":  { label: "Stock Levels",        desc: "Current branch inventory status"          },
  "item-checker":    { label: "Item Checker",        desc: "Verify product details and availability"  },
};

// ── Pulse animation ───────────────────────────────────────────────────────────
const PULSE_STYLE = `
  @keyframes ops-topbar-pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
  .ops-topbar-pulse { animation: ops-topbar-pulse 2s infinite; }
`;

// ── Component ─────────────────────────────────────────────────────────────────
const OpsTopBar: React.FC<OpsTopBarProps> = ({
  activeTab, onMenuClick, branchLabel, roleLabel,
}) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const page = PAGE_TITLES[activeTab] ?? { 
    label: activeTab.replace(/-/g,' ').replace(/\b\w/g, c => c.toUpperCase()), 
    desc: "" 
  };

  return (
    <>
      <style>{PULSE_STYLE}</style>
      <div className="shrink-0 flex items-center justify-between px-6 md:px-8 py-2.5 bg-white border-b border-zinc-100 shadow-sm min-h-[52px]">

        {/* ── Left: hamburger + title + date badge + branch pill ── */}
        <div className="flex items-center gap-3 min-w-0">

          {/* Mobile hamburger */}
          <button
            onClick={onMenuClick}
            className="md:hidden p-1.5 rounded-[0.4rem] text-[#3b2063] hover:bg-[#f5f3ff] transition-colors shrink-0"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6"  x2="21" y2="6"  />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          {/* Page title */}
          <div className="min-w-0">
            <h1 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#1a0f2e', letterSpacing: '-0.025em', margin: 0, flexShrink: 0, lineHeight: 1.2 }}>
              {page.label}
            </h1>
            <p style={{ fontSize: '0.62rem', fontWeight: 500, color: '#a1a1aa', margin: 0 }}
              className="hidden sm:block truncate opacity-80">
              {roleLabel} View • {page.desc}
            </p>
          </div>

          {/* Date badge */}
          <span
            className="hidden lg:inline-block shrink-0"
            style={{
              fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.12em',
              textTransform: 'uppercase', color: '#a1a1aa',
              background: '#f8f9fa', padding: '3px 7px', borderRadius: '0.3rem',
              border: '1px solid #f0f0f2'
            }}
          >
            {time.toLocaleDateString('en-PH', {
              weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
            })}
          </span>

          {/* Branch pill */}
          {branchLabel && (
            <span
              className="hidden sm:inline-flex items-center gap-1.5 shrink-0"
              style={{
                fontSize: '0.56rem', fontWeight: 700, letterSpacing: '0.08em',
                textTransform: 'uppercase', background: '#f5f3ff', color: '#7c3aed',
                border: '1px solid #e9d5ff', borderRadius: '100px', padding: '2px 8px',
              }}
            >
              <MapPin size={8} strokeWidth={2.5} />
              {branchLabel}
            </span>
          )}
        </div>

        {/* ── Right: clock + bell + live badge ── */}
        <div className="flex items-center gap-3 shrink-0">

          {/* Live clock */}
          <div
            className="hidden sm:flex items-center gap-2"
            style={{ fontSize: '0.65rem', fontWeight: 500, color: '#a1a1aa' }}
          >
            <Clock size={11} strokeWidth={2.5} />
            <span className="tabular-nums">
              {time.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Bell */}
          <button className="relative p-1.5 hover:bg-zinc-100 rounded-[0.4rem] transition-colors">
            <Bell size={13} className="text-zinc-400" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full border border-white" />
          </button>

          {/* Live badge */}
          <div
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              background: '#f0fdf4', border: '1px solid #dcfce7',
              borderRadius: '100px', padding: '3px 8px',
            }}
          >
            <div
              className="ops-topbar-pulse"
              style={{
                width: 4, height: 4, borderRadius: '50%',
                background: '#22c55e', boxShadow: '0 0 4px rgba(34,197,94,0.5)',
              }}
            />
            <span
              style={{
                fontSize: '0.52rem', fontWeight: 700,
                letterSpacing: '0.14em', textTransform: 'uppercase', color: '#16a34a',
              }}
            >
              Live
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default OpsTopBar;
