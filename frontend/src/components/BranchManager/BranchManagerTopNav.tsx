"use client"

import { Clock, MapPin } from 'lucide-react';

interface BranchManagerTopNavProps {
  pageTitle:   string;
  branchLabel: string | null;
}

const BranchManagerTopNav: React.FC<BranchManagerTopNavProps> = ({
  pageTitle,
  branchLabel,
}) => {
  return (
    <div className="shrink-0 flex items-center justify-between px-6 md:px-10 py-4 bg-white border-b border-gray-200 shadow-sm min-h-18">
      <div className="flex items-center gap-3 min-w-0">
        <h1 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1a0f2e', letterSpacing: '-0.03em', margin: 0, flexShrink: 0 }}>
          {pageTitle}
        </h1>
        <span
          className="hidden sm:inline-block"
          style={{
            fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.16em',
            textTransform: 'uppercase', color: '#3f3f46',
            background: '#f4f4f5', padding: '3px 8px', borderRadius: '0.375rem',
          }}
        >
          {new Date().toLocaleDateString('en-PH', {
            weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
          })}
        </span>
        {branchLabel && (
          <span
            className="hidden sm:inline-flex items-center gap-1.5"
            style={{
              fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em',
              textTransform: 'uppercase', background: '#ede9fe', color: '#3b2063',
              border: '1px solid #ddd6f7', borderRadius: '100px', padding: '3px 9px',
              flexShrink: 0,
            }}
          >
            <MapPin size={9} strokeWidth={2.5} />
            {branchLabel}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div
          className="hidden sm:flex items-center gap-2"
          style={{ fontSize: '0.65rem', fontWeight: 400, color: '#71717a' }}
        >
          <Clock size={12} />
          <span>
            Last updated:{' '}
            {new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: '#f0fdf4', border: '1px solid #bbf7d0',
            borderRadius: '100px', padding: '4px 10px',
          }}
        >
          <div
            style={{
              width: 5, height: 5, borderRadius: '50%',
              background: '#22c55e', boxShadow: '0 0 5px rgba(34,197,94,0.6)',
              animation: 'bm-pulse 2s infinite',
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
  );
};

export default BranchManagerTopNav;