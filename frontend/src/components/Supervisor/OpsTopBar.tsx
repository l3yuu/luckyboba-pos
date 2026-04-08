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

// ── Animations ────────────────────────────────────────────────────────────────
const STYLES = `
  @keyframes ops-topbar-pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
  .ops-topbar-pulse { animation: ops-topbar-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
  .ops-topbar-header { background: #3b2063; }
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
      <style>{STYLES}</style>
      <div className="shrink-0 h-[72px] flex items-center justify-between px-8 ops-topbar-header border-b border-black/10 relative z-10">
        
        {/* ── Left: hamburger + title + date badge + branch pill ── */}
        <div className="flex items-center gap-5 min-w-0">
          
          {/* Mobile hamburger */}
          <button
            onClick={onMenuClick}
            className="md:hidden p-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all shrink-0"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6"  x2="21" y2="6"  />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          
          {/* Page title area */}
          <div className="min-w-0">
            <div className="flex items-center gap-3">
               <h1 style={{ fontSize: '1rem', fontWeight: 850, color: '#ffffff', letterSpacing: '-0.02em', margin: 0, flexShrink: 0, lineHeight: 1 }}>
                {page.label}
              </h1>
              <div className="hidden lg:flex items-center px-2 py-0.5 rounded-full bg-white/10 border border-white/10 backdrop-blur-md">
                <span style={{ fontSize: '0.48rem', fontWeight: 900, color: '#f3e8ff', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{roleLabel} Console</span>
              </div>
            </div>
            <p style={{ fontSize: '0.65rem', fontWeight: 600, color: '#ddd5ff', margin: '4px 0 0 0' }}
              className="hidden sm:block truncate opacity-80 max-w-[400px] uppercase tracking-wide">
              {page.desc}
            </p>
          </div>

          {/* Date & Branch Pill */}
          <div className="hidden xl:flex items-center gap-2">
            <span
              className="shrink-0"
              style={{
                fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.12em',
                textTransform: 'uppercase', color: '#ffffff',
                background: '#ffffff15', padding: '3px 8px', borderRadius: '100px',
                border: '1px solid #ffffff20'
              }}
            >
              {time.toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>

            {branchLabel && (
              <span
                className="inline-flex items-center gap-1.5 shrink-0"
                style={{
                  fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.1em',
                  textTransform: 'uppercase', background: '#ffffff15', color: '#ffffff',
                  border: '1px solid #ffffff20', borderRadius: '100px', padding: '3px 8px',
                }}
              >
                <MapPin size={9} strokeWidth={2.5} />
                {branchLabel}
              </span>
            )}
          </div>
        </div>

        {/* ── Right: clock + bell + live badge ── */}
        <div className="flex items-center gap-4 shrink-0">

          {/* Live clock */}
          <div
            className="hidden lg:flex items-center gap-2"
            style={{ fontSize: '0.68rem', fontWeight: 600, color: '#ddd5ff' }}
          >
            <Clock size={12} strokeWidth={2.5} />
            <span className="tabular-nums">
              {time.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Bell */}
          <button className="relative p-2 bg-[#ffffff10] hover:bg-[#ffffff20] rounded-[0.5rem] transition-all border border-[#ffffff10]">
            <Bell size={14} className="text-[#ffffff90]" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-amber-400 rounded-full border border-[#3b2063]" />
          </button>

          {/* Live badge */}
          <div
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: '#22c55e15', border: '1px solid #22c55e40',
              borderRadius: '100px', padding: '4px 10px',
            }}
          >
            <div
              className="ops-topbar-pulse"
              style={{
                width: 5, height: 5, borderRadius: '50%',
                background: '#4ade80', boxShadow: '0 0 8px rgba(74,222,128,0.4)',
              }}
            />
            <span
              style={{
                fontSize: '0.5rem', fontWeight: 900,
                letterSpacing: '0.16em', textTransform: 'uppercase', color: '#4ade80',
              }}
            >
              Terminal Active
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default OpsTopBar;
