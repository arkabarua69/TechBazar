import { useEffect, useState } from 'react';
import { myOrders, clearErrors } from '../../actions/orderAction';
import { useDispatch, useSelector } from 'react-redux';
import Loader from '../Layouts/Loader';
import { useSnackbar } from 'notistack';
import OrderItem from './OrderItem';
import AccountSidebar from '../User/AccountSidebar';
import MetaData from '../Layouts/MetaData';
import { useSiteConfig } from '../../context/SiteConfigContext';
import { DEFAULT_SITE_CONFIG } from '../../utils/siteConfig';

import Inventory2Icon from '@mui/icons-material/Inventory2';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import FolderIcon from '@mui/icons-material/Folder';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';

const STATUS_FILTERS = ['All', 'Processing', 'Shipped', 'Delivered'];

// Compact stat tile — same surface + hover as the site cards.
const StatTile = ({ icon, label, value, tint, bg }) => (
    <div
        className="flex items-center gap-3 p-3 sm:p-4 transition-all duration-200"
        style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--card-radius)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 8px 24px var(--shadow-accent-soft)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
        <span className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: bg }}>
            <span style={{ color: tint }}>{icon}</span>
        </span>
        <div className="min-w-0">
            <p className="text-lg font-extrabold leading-none" style={{ color: 'var(--color-text-primary)' }}>{value}</p>
            <p className="text-[11px] font-medium mt-0.5 truncate" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
        </div>
    </div>
);

const MyOrders = () => {
    const dispatch = useDispatch();
    const { enqueueSnackbar } = useSnackbar();
    const { orders, loading, error } = useSelector((state) => state.myOrders);
    const { user } = useSelector((state) => state.user);
    const { config } = useSiteConfig();
    const support = config?.support || DEFAULT_SITE_CONFIG.support;
    const initials = (user?.name || '?')
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    const [status, setStatus] = useState('All');
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (error) {
            enqueueSnackbar(error, { variant: 'error' });
            dispatch(clearErrors());
        }
        dispatch(myOrders());
    }, [dispatch, error, enqueueSnackbar]);

    // Newest first.
    const all = [...(orders || [])].reverse();

    const q = search.trim().toLowerCase();
    const list = all.filter((o) => {
        if (status !== 'All' && o.orderStatus !== status) return false;
        if (!q) return true;
        return (
            String(o.orderId || '').toLowerCase().includes(q) ||
            (o.orderItems || []).some((i) => (i.name || '').toLowerCase().includes(q))
        );
    });

    const stats = {
        total: all.length,
        delivered: all.filter((o) => o.orderStatus === 'Delivered').length,
        shipped: all.filter((o) => o.orderStatus === 'Shipped').length,
        processing: all.filter((o) => !['Delivered', 'Shipped'].includes(o.orderStatus)).length,
    };

    return (
        <>
            <MetaData title="My Orders" />

            {/* ── Hero band (same band as the Account page) ── */}
            <section style={{ background: 'linear-gradient(135deg, var(--color-accent) 0%, #c63e0a 60%, #a33408 100%)' }}>
                <div className="mx-auto max-w-7xl px-3 sm:px-5 lg:px-6 py-6 sm:py-8">
                    <div className="flex items-center gap-4">
                        {user?.avatar?.url ? (
                            <img
                                draggable="false"
                                className="h-14 w-14 sm:h-16 sm:w-16 rounded-full object-cover ring-4 ring-white/30 shadow-lg shrink-0"
                                src={user.avatar.url} alt={user.name}
                            />
                        ) : (
                            <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full ring-4 ring-white/30 shadow-lg shrink-0 bg-white/15 text-white font-bold text-xl flex items-center justify-center select-none">
                                {initials}
                            </div>
                        )}
                        <div className="min-w-0 flex-1">
                            <p className="text-white/70 text-xs sm:text-sm">Hello,</p>
                            <h1 className="font-bold text-lg sm:text-2xl text-white leading-tight truncate">{user?.name}</h1>
                            <p className="text-white/80 text-xs sm:text-sm mt-0.5 truncate">
                                My Orders{all.length ? ` · ${all.length} order${all.length === 1 ? '' : 's'} placed` : ''}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Body: sidebar + content (matches the Account page) ── */}
            <main className="mx-auto max-w-7xl px-3 sm:px-5 lg:px-6 py-5 sm:py-6 pb-16">
                {/* mobile tab strip → orders filters */}
                <div className="md:hidden mb-4 -mx-3 px-3 overflow-x-auto">
                    <div className="flex gap-2 w-max">
                        {STATUS_FILTERS.map((s) => (
                            <button
                                key={s}
                                type="button"
                                onClick={() => setStatus(s)}
                                className="px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap border transition-all duration-150"
                                style={status === s
                                    ? { backgroundColor: 'var(--color-accent)', color: '#fff', borderColor: 'var(--color-accent)' }
                                    : { backgroundColor: 'var(--color-surface)', color: 'var(--color-text-secondary)', borderColor: 'var(--color-border)' }}
                            >
                                {s}
                                {s !== 'All' && ` (${s === 'Processing' ? stats.processing : s === 'Shipped' ? stats.shipped : stats.delivered})`}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex gap-5 lg:gap-6 items-start">
                    <AccountSidebar activeTab="orders" onSelect={() => {}} />

                    <div className="flex-1 min-w-0 flex flex-col gap-4">
                        {/* breadcrumb */}
                        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                            <FolderIcon sx={{ fontSize: 14 }} />
                            <span>Account</span>
                            <ChevronRightIcon sx={{ fontSize: 14 }} />
                            <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>My Orders</span>
                        </div>

                        {/* stats */}
                        {!loading && all.length > 0 && (
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                <StatTile icon={<ReceiptLongIcon sx={{ fontSize: 20 }} />} label="Total Orders" value={stats.total} tint="#B8937A" bg="var(--color-bg)" />
                                <StatTile icon={<CheckCircleIcon sx={{ fontSize: 20 }} />} label="Delivered" value={stats.delivered} tint="#16a34a" bg="#dcfce7" />
                                <StatTile icon={<LocalShippingIcon sx={{ fontSize: 20 }} />} label="Shipped" value={stats.shipped} tint="#b45309" bg="#fef3c7" />
                                <StatTile icon={<HourglassTopIcon sx={{ fontSize: 20 }} />} label="Processing" value={stats.processing} tint="#1d4ed8" bg="#dbeafe" />
                            </div>
                        )}

                        {/* panel: filter bar + cards */}
                        <section
                            className="overflow-hidden"
                            style={{
                                backgroundColor: 'var(--color-surface)',
                                border: '1px solid var(--color-border)',
                                borderRadius: 'var(--card-radius)',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                            }}
                        >
                            {/* panel header: title + search */}
                            <div
                                className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 px-4 sm:px-5 py-3.5"
                                style={{ borderBottom: '1px solid var(--color-border)' }}
                            >
                                <h2 className="font-bold text-sm sm:text-base shrink-0" style={{ color: 'var(--color-text-primary)' }}>
                                    Your Orders
                                    <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text-secondary)' }}>
                                        {list.length}
                                    </span>
                                </h2>

                                <div className="flex items-center flex-1 min-w-0 rounded-lg px-3 sm:ml-auto sm:max-w-xs" style={{ backgroundColor: 'var(--color-bg)' }}>
                                    <SearchIcon sx={{ fontSize: 18, color: 'var(--color-text-muted)' }} className="shrink-0" />
                                    <input
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        type="search"
                                        placeholder="Search by order ID or product"
                                        className="flex-1 min-w-0 p-2 text-xs outline-none bg-transparent"
                                        style={{ color: 'var(--color-text-primary)' }}
                                    />
                                    {search && (
                                        <button
                                            type="button"
                                            onClick={() => setSearch('')}
                                            className="p-1 rounded-full shrink-0 transition-colors"
                                            style={{ color: 'var(--color-text-muted)' }}
                                            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-accent)'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-muted)'; }}
                                        >
                                            <CloseIcon sx={{ fontSize: 15 }} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* status chips (desktop) */}
                            <div className="hidden md:flex items-center gap-2 flex-wrap px-4 sm:px-5 py-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
                                {STATUS_FILTERS.map((s) => {
                                    const active = status === s;
                                    const counts = { All: stats.total, Processing: stats.processing, Shipped: stats.shipped, Delivered: stats.delivered };
                                    return (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => setStatus(s)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150"
                                            style={active
                                                ? { backgroundColor: 'var(--color-accent)', color: '#fff', borderColor: 'var(--color-accent)' }
                                                : { backgroundColor: 'transparent', color: 'var(--color-text-secondary)', borderColor: 'var(--color-border)' }}
                                            onMouseEnter={(e) => { if (!active) e.currentTarget.style.borderColor = 'var(--color-accent)'; }}
                                            onMouseLeave={(e) => { if (!active) e.currentTarget.style.borderColor = 'var(--color-border)'; }}
                                        >
                                            {s}
                                            <span
                                                className="text-[10px] font-bold px-1.5 rounded-full"
                                                style={active
                                                    ? { backgroundColor: 'rgba(255,255,255,0.25)', color: '#fff' }
                                                    : { backgroundColor: 'var(--color-bg)', color: 'var(--color-text-muted)' }}
                                            >
                                                {counts[s]}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* cards */}
                            <div className="p-4 sm:p-5">
                                {loading ? <Loader /> : list.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                                        <Inventory2Icon sx={{ fontSize: '2.5rem', color: 'var(--color-text-muted)' }} />
                                        <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>No orders found</p>
                                        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                                            {all.length === 0
                                                ? "You haven't placed any orders yet."
                                                : 'Try a different filter or search term.'}
                                        </p>
                                        {(status !== 'All' || search) && (
                                            <button
                                                type="button"
                                                onClick={() => { setStatus('All'); setSearch(''); }}
                                                className="btn-ghost text-xs mt-1"
                                            >
                                                Clear Filters
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {list.map((order) => (
                                            <OrderItem
                                                key={order._id}
                                                orderId={order._id}
                                                displayId={order.orderId}
                                                items={order.orderItems || []}
                                                totalPrice={order.totalPrice}
                                                orderStatus={order.orderStatus}
                                                createdAt={order.createdAt}
                                                deliveredAt={order.deliveredAt}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* help strip */}
                        <div
                            className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
                            style={{
                                backgroundColor: 'var(--color-surface)',
                                border: '1px solid var(--color-border)',
                                borderRadius: 'var(--card-radius)',
                            }}
                        >
                            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                                Need help with an order? Contact our support team.
                            </p>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold" style={{ color: 'var(--color-accent)' }}>
                                {support.hotline && <span>Hotline: {support.hotline}</span>}
                                {support.whatsapp && <span>WhatsApp: {support.whatsapp}</span>}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
};

export default MyOrders;
