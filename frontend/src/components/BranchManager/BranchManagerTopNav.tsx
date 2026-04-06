"use client"

import { useState, useEffect } from "react";
import { Bell, Clock, MapPin } from 'lucide-react';
import logo from '../../assets/logo.png';

const TOP_NAV_STYLES = `
  @keyframes bm-pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
  .bm-topbar-pulse { animation: bm-pulse 2s infinite; }
`;

interface BranchManagerTopNavProps {
  pageTitle:    string;
  pageDesc?:    string;
  branchLabel:  string | null;
  onMenuClick?: () => void;
}

const BranchManagerTopNav: React.FC<BranchManagerTopNavProps> = ({
  pageTitle,
  pageDesc,
  branchLabel,
  onMenuClick,
}) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <>
      <style>{TOP_NAV_STYLES}</style>
      <div className="shrink-0 flex items-center justify-between px-6 md:px-10 py-4 bg-white border-b border-gray-200 shadow-sm min-h-18">

        {/* ── Left ── */}
        <div className="flex items-center gap-3 min-w-0">

          {/* Mobile: logo + hamburger (replaces the old separate header) */}
          <div className="flex items-center gap-2 md:hidden shrink-0">
            <img src={logo} alt="Lucky Boba" className="h-7 w-auto object-contain" />
            {onMenuClick && (
              <button
                onClick={onMenuClick}
                className="p-2 rounded-[0.4rem] text-[#3b2063] hover:bg-[#f5f3ff] transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="6"  x2="21" y2="6"  />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>
            )}
          </div>

          {/* Page title + description */}
          <div className="min-w-0">
            <h1 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1a0f2e', letterSpacing: '-0.03em', margin: 0 }}>
              {pageTitle}
            </h1>
            {pageDesc && (
              <p style={{ fontSize: '0.65rem', fontWeight: 400, color: '#71717a', margin: 0 }}
                className="hidden sm:block truncate">
                {pageDesc}
              </p>
            )}
          </div>

          {/* Date badge */}
          <span
            className="hidden sm:inline-block shrink-0"
            style={{
              fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.16em',
              textTransform: 'uppercase', color: '#3f3f46',
              background: '#f4f4f5', padding: '3px 8px', borderRadius: '0.375rem',
            }}
          >
            {time.toLocaleDateString('en-PH', {
              weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
            })}
          </span>

          {/* Branch pill */}
          <span
            className="hidden sm:inline-flex items-center gap-1.5 shrink-0"
            style={{
              fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em',
              textTransform: 'uppercase', background: '#ede9fe', color: '#3b2063',
              border: '1px solid #ddd6f7', borderRadius: '100px', padding: '3px 9px',
            }}
          >
            <MapPin size={9} strokeWidth={2.5} />
            {branchLabel ?? 'Branch Manager'}
          </span>
        </div>

        {/* ── Right: clock + bell + live badge ── */}
        <div className="flex items-center gap-3 shrink-0">

          {/* Live clock */}
          <div
            className="hidden sm:flex items-center gap-2"
            style={{ fontSize: '0.65rem', fontWeight: 400, color: '#71717a' }}
          >
            <Clock size={12} />
            <span>
              Last updated:{' '}
              {time.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Bell */}
          <button className="relative p-2 hover:bg-zinc-100 rounded-[0.4rem] transition-colors">
            <Bell size={15} className="text-zinc-500" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white" />
          </button>

          {/* Live badge */}
          <div
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: '#f0fdf4', border: '1px solid #bbf7d0',
              borderRadius: '100px', padding: '4px 10px',
            }}
          >
            <div
              className="bm-topbar-pulse"
              style={{
                width: 5, height: 5, borderRadius: '50%',
                background: '#22c55e', boxShadow: '0 0 5px rgba(34,197,94,0.6)',
              }}
            />
            <span
              style={{
                fontSize: '0.55rem', fontWeight: 700,
                letterSpacing: '0.16em', textTransform: 'uppercase', color: '#16a34a',
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

export default BranchManagerTopNav;