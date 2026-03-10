import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag } from 'lucide-react';

interface StatCard {
  label: string;
  value: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  valueColor: string;
}

const DashboardStats: React.FC = () => {

  const stats: StatCard[] = [
    {
      label: 'Cash In',
      value: '₱0.00',
      icon: <TrendingUp size={15} strokeWidth={2.5} />,
      iconBg: '#f0fdf4',
      iconColor: '#16a34a',
      valueColor: '#1a0f2e',
    },
    {
      label: 'Cash Out',
      value: '₱0.00',
      icon: <TrendingDown size={15} strokeWidth={2.5} />,
      iconBg: '#fff1f2',
      iconColor: '#be2525',
      valueColor: '#1a0f2e',
    },
    {
      label: 'Total Sales',
      value: '₱0.00',
      icon: <DollarSign size={15} strokeWidth={2.5} />,
      iconBg: '#f5f3ff',
      iconColor: '#3b2063',
      valueColor: '#3b2063',
    },
    {
      label: 'Total Items',
      value: '0',
      icon: <ShoppingBag size={15} strokeWidth={2.5} />,
      iconBg: '#fefce8',
      iconColor: '#d97706',
      valueColor: '#1a0f2e',
    },
  ];

  const rankings = Array.from({ length: 5 }, (_, i) => i + 1);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        .ds-root, .ds-root * { font-family: 'DM Sans', sans-serif !important; }

        .ds-scroll {
          overflow-y: auto;
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .ds-scroll::-webkit-scrollbar { display: none; }

        /* ── Stat card ── */
        .ds-stat {
          background: #ffffff;
          border: 1px solid #f4f4f5;
          border-radius: 1rem;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          transition: box-shadow 0.18s, border-color 0.18s;
        }
        .ds-stat:hover {
          border-color: #ede8ff;
          box-shadow: 0 4px 24px rgba(59,32,99,0.06);
        }

        .ds-stat-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .ds-stat-label {
          font-size: 0.58rem;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #a1a1aa;
        }

        .ds-stat-icon {
          width: 30px;
          height: 30px;
          border-radius: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .ds-stat-bottom {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .ds-stat-value {
          font-size: 1.75rem;
          font-weight: 800;
          letter-spacing: -0.04em;
          line-height: 1;
        }

        .ds-stat-sub {
          font-size: 0.62rem;
          font-weight: 500;
          color: #d4d4d8;
          letter-spacing: 0.04em;
          margin-top: 4px;
        }

        /* ── Panel ── */
        .ds-panel {
          background: #ffffff;
          border: 1px solid #f4f4f5;
          border-radius: 1rem;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          transition: box-shadow 0.18s, border-color 0.18s;
        }
        .ds-panel:hover {
          border-color: #ede8ff;
          box-shadow: 0 4px 24px rgba(59,32,99,0.06);
        }

        .ds-panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 1rem;
          border-bottom: 1px solid #f4f4f5;
          margin-bottom: 0.75rem;
        }

        .ds-panel-title {
          font-size: 0.58rem;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #a1a1aa;
        }

        .ds-panel-badge {
          font-size: 0.55rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #3b2063;
          background: #f5f3ff;
          border: 1px solid #ede8ff;
          padding: 3px 8px;
          border-radius: 100px;
        }

        /* ── Rank row ── */
        .ds-rank-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.65rem 0;
          border-bottom: 1px solid #f9f9f9;
        }
        .ds-rank-row:last-child { border-bottom: none; }

        .ds-rank-left {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .ds-rank-num {
          width: 22px;
          height: 22px;
          border-radius: 0.375rem;
          background: #fafafa;
          border: 1px solid #f4f4f5;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.6rem;
          font-weight: 800;
          color: #a1a1aa;
          flex-shrink: 0;
        }
        .ds-rank-num.top { background: #f5f3ff; border-color: #ede8ff; color: #3b2063; }

        .ds-rank-name {
          font-size: 0.82rem;
          font-weight: 500;
          color: #d4d4d8;
        }

        .ds-rank-qty {
          font-size: 0.72rem;
          font-weight: 700;
          color: #e4e4e7;
          letter-spacing: 0.04em;
        }
      `}</style>

      <section className="ds-root ds-scroll flex-1 px-6 md:px-10 pb-8 md:pb-10">

        {/* ── Stat cards ── */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s, i) => (
            <div key={i} className="ds-stat">
              <div className="ds-stat-top">
                <span className="ds-stat-label">{s.label}</span>
                <div
                  className="ds-stat-icon"
                  style={{ background: s.iconBg, color: s.iconColor }}
                >
                  {s.icon}
                </div>
              </div>
              <div className="ds-stat-bottom">
                <span className="ds-stat-value" style={{ color: s.valueColor }}>
                  {s.value}
                </span>
                <span className="ds-stat-sub">Today</span>
              </div>
            </div>
          ))}
        </div>

        {/* ── Top sellers panels ── */}
        <div className="grid gap-4 grid-cols-1 xl:grid-cols-2 mt-6">

          <div className="ds-panel">
            <div className="ds-panel-header">
              <span className="ds-panel-title">Top Sellers — Today</span>
              <span className="ds-panel-badge">Live</span>
            </div>
            <div>
              {rankings.map((rank) => (
                <div key={rank} className="ds-rank-row">
                  <div className="ds-rank-left">
                    <span className={`ds-rank-num ${rank === 1 ? 'top' : ''}`}>{rank}</span>
                    <span className="ds-rank-name">No data available</span>
                  </div>
                  <span className="ds-rank-qty">—</span>
                </div>
              ))}
            </div>
          </div>

          <div className="ds-panel">
            <div className="ds-panel-header">
              <span className="ds-panel-title">Top Sellers — All Time</span>
              <span className="ds-panel-badge">Overall</span>
            </div>
            <div>
              {rankings.map((rank) => (
                <div key={rank} className="ds-rank-row">
                  <div className="ds-rank-left">
                    <span className={`ds-rank-num ${rank === 1 ? 'top' : ''}`}>{rank}</span>
                    <span className="ds-rank-name">No data available</span>
                  </div>
                  <span className="ds-rank-qty">—</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>
    </>
  );
};

export default DashboardStats;