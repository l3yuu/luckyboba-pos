    "use client"

    import { useState, useEffect, useCallback } from 'react';
    import {
    ShoppingBag, RefreshCw, ChevronDown, ChevronUp,
    Clock, Package, Receipt, Search, Filter,
    } from 'lucide-react';

    // ─── Design tokens — matches BM_SalesDashboard exactly ───────────────────────
    const STYLES = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');
    .ao-root, .ao-root * { font-family: 'DM Sans', sans-serif !important; box-sizing: border-box; }
    .ao-label { font-size: 0.62rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #3f3f46; }
    .ao-sub   { font-size: 0.65rem; font-weight: 400; color: #71717a; }
    @keyframes ao-pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
    @keyframes ao-spin  { to { transform: rotate(360deg); } }
    .ao-spin  { animation: ao-spin 0.7s linear infinite; }
    .ao-live-dot { width:5px;height:5px;border-radius:50%;background:#22c55e;box-shadow:0 0 5px rgba(34,197,94,0.6);animation:ao-pulse 2s infinite; }
    `;

    const API_BASE = 'http://localhost:8000/api';
    const getToken = () =>
    localStorage.getItem('auth_token') ||
    localStorage.getItem('lucky_boba_token') || '';

    // ─── Types ────────────────────────────────────────────────────────────────────
    interface OrderItem {
    id:       number;
    name:     string;
    qty:      number;
    price:    number;
    cup_size: string | null;
    add_ons:  string[];
    }

    interface AppOrder {
    id:             number;
    invoice_number: string;
    customer_name:  string;
    total_amount:   number;
    status:         string;
    created_at:     string;
    items:          OrderItem[];
    }

    type StatusFilter = 'all' | 'pending' | 'preparing' | 'completed' | 'cancelled';

    // ─── Helpers ──────────────────────────────────────────────────────────────────
    const fmt = (v: number) =>
    `₱${Number(v).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

    const timeStr = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });

    const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string; border: string }> = {
    pending:    { label: 'Pending',    bg: '#fef9c3', color: '#92400e', border: '#fde68a' },
    preparing:  { label: 'Preparing',  bg: '#ede9fe', color: '#3b2063', border: '#ddd6f7' },
    completed:  { label: 'Completed',  bg: '#dcfce7', color: '#166534', border: '#bbf7d0' },
    cancelled:  { label: 'Cancelled',  bg: '#fee2e2', color: '#991b1b', border: '#fecaca' },
    };

    const statusCfg = (s: string) =>
    STATUS_CONFIG[s.toLowerCase()] ?? { label: s, bg: '#f4f4f5', color: '#52525b', border: '#e4e4e7' };

    // ─── Stat Card (same structure as BM_SalesDashboard) ─────────────────────────
    const StatCard = ({
    label, value, sub, icon, iconBg, iconColor,
    }: {
    label: string; value: string; sub: string;
    icon: React.ReactNode; iconBg: string; iconColor: string;
    }) => (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col gap-3 hover:shadow-md hover:border-[#ddd6f7] transition-all">
        <div className="flex items-start justify-between">
        <div>
            <p className="ao-label">{label}</p>
            <p className="ao-sub" style={{ marginTop: 2 }}>{sub}</p>
        </div>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: iconBg, color: iconColor }}>
            {icon}
        </div>
        </div>
        <p style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#1a0f2e', lineHeight: 1 }}>
        {value}
        </p>
    </div>
    );

    // ─── Order Row ────────────────────────────────────────────────────────────────
    const OrderRow = ({ order, onStatusChange }: {
    order: AppOrder;
    onStatusChange: (id: number, status: string) => void;
    }) => {
    const [expanded,  setExpanded]  = useState(false);
    const [updating,  setUpdating]  = useState(false);
    const cfg = statusCfg(order.status);

    const nextStatus: Record<string, string> = {
        pending:   'preparing',
        preparing: 'completed',
    };

    const handleAdvance = async () => {
        const next = nextStatus[order.status.toLowerCase()];
        if (!next) return;
        setUpdating(true);
        try {
        const res = await fetch(`${API_BASE}/branch/app-orders/${order.id}/status`, {
            method: 'PATCH',
            headers: {
            'Content-Type':  'application/json',
            'Accept':        'application/json',
            'Authorization': `Bearer ${getToken()}`,
            },
            body: JSON.stringify({ status: next }),
        });
        if (res.ok) onStatusChange(order.id, next);
        } catch (e) {
        console.error('Status update failed', e);
        } finally {
        setUpdating(false);
        }
    };

    return (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md hover:border-[#ddd6f7] transition-all">
        {/* Row header */}
        <div className="flex items-center gap-3 px-5 py-4">

            {/* Invoice + time */}
            <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
                <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#1a0f2e', letterSpacing: '-0.02em' }}>
                {order.invoice_number}
                </span>
                <span
                style={{
                    fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.14em',
                    textTransform: 'uppercase', background: cfg.bg, color: cfg.color,
                    border: `1px solid ${cfg.border}`, borderRadius: '100px', padding: '2px 8px',
                }}
                >
                {cfg.label}
                </span>
            </div>
            <div className="flex items-center gap-3 mt-1">
                <span className="ao-sub flex items-center gap-1">
                <Clock size={10} />
                {timeStr(order.created_at)}
                </span>
                <span className="ao-sub">·</span>
                <span className="ao-sub">{order.customer_name}</span>
                <span className="ao-sub">·</span>
                <span className="ao-sub">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
            </div>
            </div>

            {/* Total */}
            <div className="text-right shrink-0">
            <p style={{ fontSize: '1rem', fontWeight: 800, color: '#3b2063', letterSpacing: '-0.02em' }}>
                {fmt(order.total_amount)}
            </p>
            </div>

            {/* Advance button */}
            {nextStatus[order.status.toLowerCase()] && (
            <button
                onClick={handleAdvance}
                disabled={updating}
                style={{
                padding: '6px 14px',
                background: updating ? '#f4f4f5' : '#3b2063',
                color: updating ? '#a1a1aa' : '#fff',
                border: 'none', borderRadius: '0.5rem',
                fontSize: '0.62rem', fontWeight: 700,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                cursor: updating ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s',
                display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
                }}
            >
                {updating
                ? <><div className="ao-spin" style={{ width: 10, height: 10, border: '2px solid #d4d4d8', borderTopColor: '#a1a1aa', borderRadius: '50%' }} />Wait</>
                : order.status.toLowerCase() === 'pending' ? '→ Preparing' : '→ Complete'
                }
            </button>
            )}

            {/* Expand toggle */}
            <button
            onClick={() => setExpanded(e => !e)}
            style={{
                background: '#f4f4f5', border: 'none', borderRadius: '0.4rem',
                width: 28, height: 28, display: 'flex', alignItems: 'center',
                justifyContent: 'center', cursor: 'pointer', color: '#71717a', flexShrink: 0,
            }}
            >
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
        </div>

        {/* Expanded items */}
        {expanded && (
            <div style={{ borderTop: '1px solid #f4f4f5', background: '#fafafa', padding: '14px 20px' }}>
            <p className="ao-label" style={{ marginBottom: 10 }}>Order Items</p>
            <div className="flex flex-col gap-2">
                {order.items.map(item => (
                <div key={item.id} className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                    <div style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: '#3b2063', marginTop: 5, flexShrink: 0,
                    }} />
                    <div>
                        <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1a0f2e', margin: 0 }}>
                        {item.qty}× {item.name}
                        </p>
                        {item.cup_size && (
                        <p className="ao-sub" style={{ marginTop: 1 }}>Size: {item.cup_size}</p>
                        )}
                        {item.add_ons && item.add_ons.length > 0 && (
                        <p className="ao-sub" style={{ marginTop: 1 }}>
                            Add-ons: {item.add_ons.join(', ')}
                        </p>
                        )}
                    </div>
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#71717a', flexShrink: 0 }}>
                    {fmt(item.price)}
                    </span>
                </div>
                ))}
            </div>

            {/* Receipt footer */}
            <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid #e4e4e7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="ao-label" style={{ color: '#a1a1aa' }}>Total</span>
                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#3b2063' }}>
                {fmt(order.total_amount)}
                </span>
            </div>
            </div>
        )}
        </div>
    );
    };

    // ─── Main Component ───────────────────────────────────────────────────────────
    const BM_AppOrders = () => {
    const [orders,      setOrders]      = useState<AppOrder[]>([]);
    const [loading,     setLoading]     = useState(true);
    const [refreshing,  setRefreshing]  = useState(false);
    const [error,       setError]       = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [search,      setSearch]      = useState('');

    const fetchOrders = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        else         setRefreshing(true);
        setError(null);
        try {
        const res = await fetch(`${API_BASE}/branch/app-orders`, {
            headers: {
            'Accept':        'application/json',
            'Authorization': `Bearer ${getToken()}`,
            },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setOrders(data.data ?? data);
        } catch (e) {
        setError('Could not load orders. Check your connection.');
        console.error(e);
        } finally {
        setLoading(false);
        setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    // Auto-refresh every 30 seconds
    useEffect(() => {
        const id = setInterval(() => fetchOrders(true), 30_000);
        return () => clearInterval(id);
    }, [fetchOrders]);

    const handleStatusChange = (id: number, newStatus: string) => {
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
    };

    // Filtered orders
    const filtered = orders.filter(o => {
        const matchStatus = statusFilter === 'all' || o.status.toLowerCase() === statusFilter;
        const q = search.toLowerCase();
        const matchSearch = !q
        || o.invoice_number.toLowerCase().includes(q)
        || o.customer_name.toLowerCase().includes(q)
        || o.items.some(i => i.name.toLowerCase().includes(q));
        return matchStatus && matchSearch;
    });

    // Stats
    const todayTotal   = orders.reduce((s, o) => s + (o.status !== 'cancelled' ? o.total_amount : 0), 0);
    const pendingCount = orders.filter(o => o.status.toLowerCase() === 'pending').length;
    const doneCount    = orders.filter(o => o.status.toLowerCase() === 'completed').length;
    const totalCount   = orders.length;

    const STATUS_TABS: { key: StatusFilter; label: string }[] = [
        { key: 'all',       label: 'All' },
        { key: 'pending',   label: 'Pending' },
        { key: 'preparing', label: 'Preparing' },
        { key: 'completed', label: 'Completed' },
        { key: 'cancelled', label: 'Cancelled' },
    ];

    return (
        <>
        <style>{STYLES}</style>
        <section className="ao-root px-5 md:px-8 pb-8 pt-5 space-y-5">

            {/* ── Header ── */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: '#ede9fe', color: '#7c3aed' }}>
                <ShoppingBag size={16} strokeWidth={2.5} />
                </div>
                <div>
                <h2 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1a0f2e', letterSpacing: '-0.025em', margin: 0 }}>
                    App Orders
                </h2>
                <p className="ao-label" style={{ color: '#a1a1aa', marginTop: 2 }}>
                    Today's mobile orders for your branch
                </p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                {/* Live badge */}
                <div style={{ display:'inline-flex', alignItems:'center', gap:5, background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:'100px', padding:'4px 10px' }}>
                <div className="ao-live-dot" />
                <span style={{ fontSize:'0.55rem', fontWeight:700, letterSpacing:'0.16em', textTransform:'uppercase', color:'#16a34a' }}>Live</span>
                </div>

                {/* Refresh */}
                <button
                onClick={() => fetchOrders(true)}
                disabled={refreshing}
                style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '6px 12px', background: '#f4f4f5', border: 'none',
                    borderRadius: '0.5rem', cursor: 'pointer',
                    fontSize: '0.65rem', fontWeight: 700, color: '#52525b',
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                }}
                >
                <RefreshCw size={11} className={refreshing ? 'ao-spin' : ''} />
                Refresh
                </button>
            </div>
            </div>

            {/* ── Stat Cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
                label="Today's Revenue" sub="Completed + active orders"
                value={fmt(todayTotal)}
                icon={<Receipt size={14} strokeWidth={2.5} />}
                iconBg="#ede9fe" iconColor="#7c3aed"
            />
            <StatCard
                label="Total Orders" sub="All statuses today"
                value={String(totalCount)}
                icon={<ShoppingBag size={14} strokeWidth={2.5} />}
                iconBg="#e0f2fe" iconColor="#0284c7"
            />
            <StatCard
                label="Pending" sub="Awaiting preparation"
                value={String(pendingCount)}
                icon={<Clock size={14} strokeWidth={2.5} />}
                iconBg="#fef9c3" iconColor="#92400e"
            />
            <StatCard
                label="Completed" sub="Fulfilled today"
                value={String(doneCount)}
                icon={<Package size={14} strokeWidth={2.5} />}
                iconBg="#dcfce7" iconColor="#16a34a"
            />
            </div>

            {/* ── Filters + Search ── */}
            <div className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            {/* Status tabs */}
            <div className="flex items-center gap-1 flex-wrap">
                <Filter size={11} color="#a1a1aa" />
                {STATUS_TABS.map(({ key, label }) => {
                const active = statusFilter === key;
                const count = key === 'all' ? orders.length : orders.filter(o => o.status.toLowerCase() === key).length;
                return (
                    <button
                    key={key}
                    onClick={() => setStatusFilter(key)}
                    style={{
                        padding: '4px 10px', border: 'none', borderRadius: '100px',
                        fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em',
                        textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.12s',
                        background: active ? '#3b2063' : '#f4f4f5',
                        color:      active ? '#fff'    : '#71717a',
                    }}
                    >
                    {label} {count > 0 && `(${count})`}
                    </button>
                );
                })}
            </div>

            {/* Search */}
            <div className="relative sm:ml-auto">
                <Search size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#a1a1aa' }} />
                <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search orders or items…"
                style={{
                    paddingLeft: 28, paddingRight: 12, paddingTop: 7, paddingBottom: 7,
                    border: '1.5px solid #e4e4e7', borderRadius: '0.5rem',
                    fontSize: '0.78rem', color: '#1a0f2e', background: '#fafafa',
                    outline: 'none', width: 220,
                }}
                />
            </div>
            </div>

            {/* ── Orders List ── */}
            {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20">
                <div style={{ width: 36, height: 36, border: '2.5px solid #3b2063', borderTopColor: 'transparent', borderRadius: '50%', animation: 'ao-spin 0.7s linear infinite' }} />
                <p className="ao-label" style={{ color: '#a1a1aa' }}>Loading orders…</p>
            </div>
            ) : error ? (
            <div className="bg-white border border-red-100 rounded-2xl p-8 flex flex-col items-center gap-3">
                <div style={{ width: 40, height: 40, background: '#fee2e2', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShoppingBag size={18} color="#dc2626" />
                </div>
                <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#dc2626' }}>{error}</p>
                <button
                onClick={() => fetchOrders()}
                style={{ padding: '8px 20px', background: '#3b2063', color: '#fff', border: 'none', borderRadius: '0.5rem', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer' }}
                >
                Try Again
                </button>
            </div>
            ) : filtered.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-2xl p-10 flex flex-col items-center gap-3">
                <div style={{ width: 48, height: 48, background: '#f4f4f5', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShoppingBag size={22} color="#d4d4d8" />
                </div>
                <p style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1a0f2e' }}>No orders found</p>
                <p className="ao-sub">
                {search || statusFilter !== 'all' ? 'Try adjusting your filters.' : 'No app orders for your branch today.'}
                </p>
            </div>
            ) : (
            <div className="flex flex-col gap-3">
                {filtered.map(order => (
                <OrderRow
                    key={order.id}
                    order={order}
                    onStatusChange={handleStatusChange}
                />
                ))}
            </div>
            )}
        </section>
        </>
    );
    };

    export default BM_AppOrders;