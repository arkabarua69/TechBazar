import { useEffect, useMemo, useState } from 'react';
import 'chart.js/auto'; // registers every controller/element/scale for react-chartjs-2
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { getAdminProducts } from '../../actions/productAction';
import { useSelector, useDispatch } from 'react-redux';
import { getAllOrders } from '../../actions/orderAction';
import { getAllUsers } from '../../actions/userAction';
import { categories } from '../../utils/constants';
import MetaData from '../Layouts/MetaData';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';
import BottomSheet from './BottomSheet';
import PaidIcon from '@mui/icons-material/Paid';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import GroupsIcon from '@mui/icons-material/Groups';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import BoltIcon from '@mui/icons-material/Bolt';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { bn, shortOrderId, timeAgoBn } from '../../utils/adminHelpers';

// ── monochrome design tokens (iOS-style admin redesign) ──
// Chart.js paints to a <canvas>, so var(--color-accent) cannot be used here —
// it must be a resolved colour. Read the live token from :root and fall back
// to the brand default, keeping charts in step with the admin theme.
const readAccent = () => {
    try {
        const v = getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim();
        return v || '#01bc17';
    } catch (e) {
        return '#01bc17';
    }
};
const INK = readAccent();
const PINK = '#FDBA74';

const isToday = (d) => new Date(d).toDateString() === new Date().toDateString();
const pct = (n, d) => (d > 0 ? Math.min(100, Math.round((n / d) * 100)) : 0);

const monthLabels = () => {
    try {
        return Array.from({ length: 12 }, (_, m) =>
            new Date(2024, m, 1).toLocaleDateString('bn-BD', { month: 'short' }));
    } catch (e) {
        return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    }
};

// customer initials for the order-list avatars (JS style)
const initials = (name) => {
    const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    return ((parts[0] && parts[0][0]) || '?') + ((parts[1] && parts[1][0]) || '');
};

// order-list pills (reference: muted slate "New Order" badge)
const ORDER_PILL = {
    PLACED: 'bg-[#8E9AF5] text-white',
    CONFIRMED: 'bg-[#E84B0F] text-white',
    SHIPPED: 'bg-zinc-500 text-white',
    DELIVERED: 'bg-emerald-600 text-white',
    CANCELLED: 'bg-red-500 text-white',
};
const ORDER_PILL_TEXT = {
    PLACED: 'New Order',
    CONFIRMED: 'Confirmed',
    SHIPPED: 'Shipped',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled',
};

const todayLabel = () => {
    try {
        return new Date().toLocaleDateString('bn-BD', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        });
    } catch (e) {
        return new Date().toLocaleDateString();
    }
};

// revenue line dataset (black current / pink previous)
const mkLine = (label, data, color, fill) => ({
    label,
    data,
    borderColor: color,
    backgroundColor: fill ? (color === INK ? 'rgba(10,10,10,0.06)' : 'rgba(244,114,182,0.15)') : 'transparent',
    fill: !!fill,
    tension: 0.4,
    borderWidth: 2.5,
    pointRadius: 0,
    pointHoverRadius: 5,
    pointBackgroundColor: color,
});

const MainData = () => {

    const dispatch = useDispatch();
    const { enqueueSnackbar } = useSnackbar();
    const navigate = useNavigate();

    const { products } = useSelector((state) => state.products);
    const { users } = useSelector((state) => state.users);
    const { user } = useSelector((state) => state.user);

    // store orders — power the pipeline, revenue, trending & order list
    const [storeOrders, setStoreOrders] = useState([]);
    const [charges, setCharges] = useState(null); // delivery charges from /store/config
    const [manualOpen, setManualOpen] = useState(false);
    const [savingManual, setSavingManual] = useState(false);
    const [range, setRange] = useState('monthly'); // revenue chart range
    const [form, setForm] = useState({
        productId: '', qty: '1', name: '', phone: '', division: '', district: '', address: '',
        zone: 'inside-dhaka', method: 'bKash', trxid: '',
    });

    const fetchStoreOrders = async () => {
        try {
            const { data } = await axios.get('/api/v1/admin/store/orders', { headers: { Accept: 'application/json' } });
            setStoreOrders(data.orders || []);
        } catch (e) { /* charts still work without it */ }
    };

    let outOfStock = 0;
    products?.forEach((item) => {
        if (item.stock === 0) outOfStock += 1;
    });

    useEffect(() => {
        dispatch(getAdminProducts());
        dispatch(getAllOrders());
        dispatch(getAllUsers());
        fetchStoreOrders();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dispatch]);

    // non-cancelled store orders drive every money metric below
    const activeOrders = useMemo(
        () => storeOrders.filter((o) => o.status !== 'CANCELLED' && o.fulfilment !== 'CANCELLED'),
        [storeOrders]
    );

    // ===== store-order pipeline (grid — NO horizontal scroll) =====
    const metrics = useMemo(() => {
        const pendingVerify = activeOrders.filter((o) => o.payment?.verified === false && o.fulfilment !== 'DELIVERED').length;
        const processing = activeOrders.filter((o) => o.fulfilment === 'CONFIRMED').length;
        const shipped = activeOrders.filter((o) => o.fulfilment === 'SHIPPED').length;
        const deliveredToday = storeOrders.filter((o) => o.fulfilment === 'DELIVERED' && isToday(o.createdAt));
        const cashToday = deliveredToday.reduce((s, o) => s + (o.pricing?.total || 0), 0);
        return { pendingVerify, processing, shipped, deliveredToday: deliveredToday.length, cashToday };
    }, [activeOrders, storeOrders]);

    // ===== headline KPIs (featured black card + 3 white cards, with progress) =====
    const revenue = activeOrders.reduce((s, o) => s + (o.pricing?.total || 0), 0);
    const deliveredCount = activeOrders.filter((o) => o.fulfilment === 'DELIVERED').length;
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthRev = activeOrders.filter((o) => new Date(o.createdAt) >= monthStart)
        .reduce((s, o) => s + (o.pricing?.total || 0), 0);
    const inStockCount = (products?.length || 0) - outOfStock;
    const monthUsers = (users || []).filter((u) => new Date(u.createdAt) >= monthStart).length;

    const kpiCards = [
        {
            icon: PaidIcon, featured: true, label: 'Total Revenue',
            value: `Tk ${bn(revenue.toLocaleString())}`,
            p: pct(monthRev, revenue), plabel: "This month's share",
        },
        {
            icon: ReceiptLongIcon, label: 'Total Orders',
            value: bn(activeOrders.length),
            p: pct(deliveredCount, activeOrders.length), plabel: 'Delivered',
        },
        {
            icon: Inventory2Icon, label: 'Products',
            value: bn(products?.length || 0),
            p: pct(inStockCount, products?.length || 0), plabel: 'In Stock',
        },
        {
            icon: GroupsIcon, label: 'Users',
            value: bn(users?.length || 0),
            p: pct(monthUsers, users?.length || 0), plabel: 'New this month',
        },
    ];

    const metricCards = [
        { key: 'verify', dot: 'bg-amber-500', label: 'Pending Verification', value: bn(metrics.pendingVerify), sub: 'TrxID verification pending', to: '/admin/orders?filter=verify' },
        { key: 'confirmed', dot: 'bg-blue-500', label: 'Confirmed / Processing', value: bn(metrics.processing), sub: 'Awaiting courier booking', to: '/admin/orders?filter=confirmed' },
        { key: 'shipped', dot: 'bg-violet-500', label: 'In Transit / Shipped', value: bn(metrics.shipped), sub: 'Delivery in progress', to: '/admin/orders?filter=shipped' },
        { key: 'today', dot: 'bg-green-500', label: "Today's Delivered & Cash", value: `Tk ${bn(metrics.cashToday.toLocaleString())}`, sub: `${bn(metrics.deliveredToday)} orders delivered`, to: '/admin/orders?filter=delivered' },
    ];

    // ===== quick action tiles =====
    const quickActions = [
        { icon: AddShoppingCartIcon, label: '+ Manual Order', sub: 'Phone order', chip: 'bg-gray-100 text-[#E84B0F]', onClick: openManual },
        { icon: BoltIcon, label: 'Verification Queue', sub: `${bn(metrics.pendingVerify)} TrxIDs pending`, chip: 'bg-amber-100 text-amber-700', onClick: () => navigate('/admin/orders?filter=verify') },
        { icon: WarningAmberIcon, label: 'Out of Stock', sub: `${bn(outOfStock)} products`, chip: 'bg-red-100 text-red-600', onClick: () => navigate('/admin/products') },
        { icon: ReceiptLongIcon, label: 'Store Order', sub: `${bn(storeOrders.length)} items`, chip: 'bg-gray-100 text-[#E84B0F]', onClick: () => navigate('/admin/orders') },
        { icon: ChatBubbleOutlineIcon, label: 'Live Chat', sub: 'Inbox', chip: 'bg-gray-100 text-[#E84B0F]', onClick: () => navigate('/admin/chat') },
    ];

    // ===== revenue chart (Monthly / Weekly / Today) =====
    const revenueData = useMemo(() => {
        const now = new Date();
        const sumOver = (test) => activeOrders.reduce(
            (s, o) => (test(new Date(o.createdAt)) ? s + (o.pricing?.total || 0) : s), 0);

        if (range === 'today') {
            const labels = [], data = [];
            for (let b = 0; b < 12; b++) {
                const start = new Date(now); start.setHours(b * 2, 0, 0, 0);
                const end = new Date(now); end.setHours(b * 2 + 2, 0, 0, 0);
                labels.push(`${String(b * 2).padStart(2, '0')}:00`);
                data.push(sumOver((t) => t >= start && t < end));
            }
            return { labels, datasets: [mkLine("Today's Revenue", data, INK, true)] };
        }

        if (range === 'weekly') {
            const labels = [], data = [];
            for (let i = 6; i >= 0; i--) {
                const d = new Date(now); d.setDate(now.getDate() - i); d.setHours(0, 0, 0, 0);
                const e = new Date(d); e.setDate(d.getDate() + 1);
                labels.push(d.toLocaleDateString('bn-BD', { weekday: 'short' }));
                data.push(sumOver((t) => t >= d && t < e));
            }
            return { labels, datasets: [mkLine('7-Day Revenue', data, INK, true)] };
        }

        const yr = now.getFullYear();
        const perMonth = (y) => Array.from({ length: 12 },
            (_, m) => sumOver((t) => t.getFullYear() === y && t.getMonth() === m));
        return {
            labels: monthLabels(),
            datasets: [
                mkLine(String(yr), perMonth(yr), INK, true),
                mkLine(String(yr - 1), perMonth(yr - 1), PINK, false),
            ],
        };
    }, [activeOrders, range]);

    // ===== trending items (this month vs last month) =====
    const trending = useMemo(() => {
        const now = new Date();
        const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const map = {};
        activeOrders.forEach((o) => {
            const name = o.product?.name;
            if (!name) return;
            if (!map[name]) map[name] = { name, image: o.product?.image, qty: 0, total: 0, thisQty: 0, lastQty: 0 };
            const q = o.pricing?.quantity || 1;
            const t = new Date(o.createdAt);
            map[name].qty += q;
            map[name].total += o.pricing?.total || 0;
            if (t.getMonth() === now.getMonth() && t.getFullYear() === now.getFullYear()) {
                map[name].thisQty += q;
            } else if (t.getMonth() === prev.getMonth() && t.getFullYear() === prev.getFullYear()) {
                map[name].lastQty += q;
            }
        });
        return Object.values(map).sort((a, b) => b.qty - a.qty).slice(0, 5);
    }, [activeOrders]);

    // recent store orders (newest first)
    const recent = useMemo(
        () => [...storeOrders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5),
        [storeOrders]
    );

    const barState = {
        labels: categories,
        datasets: [{
            label: 'Products',
            borderColor: INK, backgroundColor: INK, hoverBackgroundColor: '#333',
            data: categories.map((cat) => products?.filter((item) => item.category === cat).length),
            borderRadius: 6, borderSkipped: false,
        }],
    };

const doughnutState = {
        labels: ['Out of Stock', 'In Stock'],
        datasets: [{
            backgroundColor: [PINK, INK],
            hoverBackgroundColor: ['#f9a8d4', '#333'],
            data: [outOfStock, (products?.length || 0) - outOfStock],
            borderWidth: 0,
        }],
    };
    const lowStockProducts = (products || [])
        .filter((p) => (p.stock || 0) > 0 && (p.stock || 0) < 10)
        .sort((a, b) => (a.stock || 0) - (b.stock || 0))
        .slice(0, 6);

    const lineOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: range === 'monthly',
                position: 'top', align: 'end',
                labels: { usePointStyle: true, boxWidth: 8, font: { size: 11 }, color: '#6b7280' },
            },
            tooltip: { callbacks: { label: (c) => ` Tk ${bn(c.parsed.y.toLocaleString())}` } },
        },
        scales: {
            x: { grid: { display: false }, ticks: { color: '#9ca3af', font: { size: 10 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 12 } },
            y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { color: '#9ca3af', font: { size: 10 }, callback: (v) => `Tk ${bn(v)}` } },
        },
    };

    // ===== manual order (bottom sheet → public guest-checkout API) =====
    function openManual() {
        setManualOpen(true);
        if (!charges) {
            axios.get('/api/v1/store/config')
                .then(({ data }) => setCharges(data?.deliveryCharges || null))
                .catch(() => setCharges(null));
        }
    }

    function refreshAll() {
        dispatch(getAdminProducts());
        dispatch(getAllOrders());
        dispatch(getAllUsers());
        fetchStoreOrders();
            enqueueSnackbar('Data refreshed', { variant: 'success' });
    }

    const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

    const submitManual = async (e) => {
        e.preventDefault();
        if (!form.productId) return enqueueSnackbar('Select a product', { variant: 'error' });
        if (!form.name.trim() || !form.address.trim() || !form.division.trim() || !form.district.trim())
            return enqueueSnackbar('Provide name, address, division and district', { variant: 'error' });
        if (!/^01[3-9]\d{8}$/.test(form.phone.trim()))
            return enqueueSnackbar('Enter a valid mobile number (e.g. 01712345678)', { variant: 'error' });
        if (form.trxid.trim().length < 4)
            return enqueueSnackbar('Enter TrxID (at least 4 characters)', { variant: 'error' });

        setSavingManual(true);
        try {
            await axios.post('/api/v1/store/orders', {
                items: [{ productId: form.productId, quantity: Number(form.qty) || 1 }],
                customer: {
                    name: form.name.trim(),
                    phone: form.phone.trim(),
                    address: form.address.trim(),
                    division: form.division.trim(),
                    district: form.district.trim(),
                },
                payment: { method: form.method, transactionId: form.trxid.trim() },
                delivery: { zone: form.zone },
            }, { headers: { 'Content-Type': 'application/json', Accept: 'application/json' } });
            enqueueSnackbar('Order created — pending approval', { variant: 'success' });
            setManualOpen(false);
            setForm({
                productId: '', qty: '1', name: '', phone: '', division: '', district: '', address: '',
                zone: 'inside-dhaka', method: 'bKash', trxid: '',
            });
            fetchStoreOrders();
        } catch (err) {
            enqueueSnackbar(err.response?.data?.message || 'Order creation failed', { variant: 'error' });
        } finally {
            setSavingManual(false);
        }
    };

    const inStockProducts = (products || []).filter((p) => p.stock > 0);
    const fieldCls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-[#E84B0F] focus:outline-none bg-white';
    const sectionLabel = 'text-[11px] font-semibold uppercase tracking-wider text-gray-400';

    return (
        <>
            <MetaData title="Admin Dashboard" />

            {/* ═══ 1. header ═══ */}
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div className="min-w-0">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Dashboard</h1>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                        {todayLabel()} · Welcome, {user?.name || 'Admin'}
                    </p>
                </div>
                <div className="flex gap-2 shrink-0">
                    <button
                        onClick={refreshAll}
                        className="text-xs sm:text-sm font-semibold border border-gray-300 bg-white rounded-full px-4 py-2 text-gray-700 hover:bg-gray-100 active:scale-95 transition"
                    >
                        <RefreshIcon sx={{ fontSize: '16px', verticalAlign: 'middle', marginRight: '5px' }} />Refresh
                    </button>
                    <button
                        onClick={openManual}
                        className="text-xs sm:text-sm font-semibold bg-[#E84B0F] text-white rounded-full px-4 py-2 hover:bg-[#C63E0A] active:scale-95 transition"
                    >
                        +                         New Order
                    </button>
                </div>
            </div>

            {/* ═══ 2. KPI — featured black card + 3 white cards, with progress bars ═══ */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {kpiCards.map((k, i) => {
                    const Icon = k.icon;
                    return (
                        <div key={i} className={`rounded-2xl p-4 border transition ${k.featured ? 'bg-[#E84B0F] border-[#E84B0F] shadow-lg' : 'bg-white border-gray-200 shadow-sm hover:shadow-md'}`}>
                            <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${k.featured ? 'bg-white/15 text-white' : 'bg-gray-100 text-[#E84B0F]'}`}>
                                <Icon sx={{ fontSize: '20px' }} />
                            </span>
                            <p className={`text-xs font-medium mt-3 ${k.featured ? 'text-white/80' : 'text-gray-500'}`}>{k.label}</p>
                            <p className={`text-xl sm:text-2xl font-extrabold leading-tight mt-0.5 ${k.featured ? 'text-white' : 'text-gray-900'}`}>{k.value}</p>
                            <div className="flex justify-between text-[10px] font-medium mt-3 mb-1 text-gray-500">
                                <span>0%</span>
                                <span className={k.featured ? 'text-white font-bold' : 'text-gray-900 font-bold'}>{bn(k.p)}%</span>
                            </div>
                            <div className={`h-1.5 rounded-full ${k.featured ? 'bg-white/20' : 'bg-gray-200'}`}>
                                <div className={`h-full rounded-full ${k.featured ? 'bg-white' : 'bg-[#E84B0F]'}`} style={{ width: `${k.p}%` }}></div>
                            </div>
                            <p className={`text-[10px] mt-1.5 ${k.featured ? 'text-white/80' : 'text-gray-600'}`}>{k.plabel}</p>
                        </div>
                    );
                })}
            </div>

            {/* ═══ 3. store-order pipeline — grid wrap, NO horizontal scroll ═══ */}
            <div>
                <p className={`${sectionLabel} mb-2`}>Store Order Pipeline</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {metricCards.map((m) => (
                        <button
                            key={m.key}
                            onClick={() => navigate(m.to)}
                            className="bg-white border border-gray-200 rounded-2xl p-4 text-left shadow-sm hover:shadow-md active:scale-[0.98] transition"
                        >
                            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500">
                                <span className={`w-2 h-2 rounded-full shrink-0 ${m.dot}`}></span>
                                <span className="truncate">{m.label}</span>
                            </span>
                            <p className="text-2xl font-extrabold text-gray-900 mt-1.5">{m.value}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5 truncate">{m.sub}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* ═══ 4. revenue with segmented Monthly / Weekly / Today pills ═══ */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
                    <div>
                        <h2 className="text-sm font-bold text-gray-900">Revenue</h2>
                        <p className="text-[11px] text-gray-400">Revenue from store orders</p>
                    </div>
                    <div className="flex bg-gray-100 rounded-full p-1 gap-1">
                        {[['monthly', 'Monthly'], ['weekly', 'Weekly'], ['today', 'Today']].map(([key, label]) => (
                            <button
                                key={key}
                                onClick={() => setRange(key)}
                                className={`px-3 py-1 rounded-full text-xs font-semibold transition ${range === key ? 'bg-[#E84B0F] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
                <div style={{ height: 220 }}>
                    <Line data={revenueData} options={lineOptions} />
                </div>
            </div>

            {/* ═══ 5. trending items + order list ═══ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {/* trending items */}
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
                    <div className="px-4 pt-4 pb-2">
                        <h2 className="text-sm font-bold text-gray-900">Trending Items</h2>
                        <p className="text-[11px] text-gray-400">Top Selling Products</p>
                    </div>
                    <div>
                        {trending.length === 0 && (
                            <p className="px-4 py-8 text-center text-sm text-gray-400">No sales yet.</p>
                        )}
                        {trending.map((it, i) => {
                            const delta = it.lastQty > 0 ? Math.round(((it.thisQty - it.lastQty) / it.lastQty) * 100) : null;
                            const deltaText = delta === null
                                ? (it.thisQty > 0 ? 'New' : '—')
                                : `${delta >= 0 ? '+' : '−'}${bn(Math.abs(delta))}%`;
                            const deltaCls = delta === null
                                ? (it.thisQty > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400')
                                : (delta >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500');
                            return (
                                <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-0">
                                    {it.image ? (
                                        <img src={it.image} alt="" className="w-10 h-10 rounded-xl object-contain border bg-white shrink-0" />
                                    ) : (
                                        <span className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0"><Inventory2Icon sx={{ fontSize: '20px', color: '#9ca3af' }} /></span>
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-gray-900 truncate">{it.name}</p>
                                        <p className="text-xs text-gray-400">{bn(it.qty)} sold · Tk {bn(it.total.toLocaleString())}</p>
                                    </div>
                                    <span className={`text-[11px] font-bold px-2 py-1 rounded-full shrink-0 ${deltaCls}`}>{deltaText}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* order list (reference style: initials avatar · name · date · +Tk  · pill) */}
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
                    <div className="flex items-center justify-between px-4 pt-4 pb-2 gap-2">
                        <div className="min-w-0">
                            <h2 className="text-sm font-bold text-gray-900">Order List</h2>
                            <p className="text-[11px] text-gray-400">{bn(storeOrders.length)} total orders</p>
                        </div>
                        <button
                            onClick={() => navigate('/admin/orders')}
                            className="text-xs font-bold text-[#E84B0F] shrink-0 hover:underline"
                        >
                            <span className="inline-flex items-center gap-0.5">View all<ArrowForwardIcon sx={{ fontSize: '14px' }} /></span>
                        </button>
                    </div>
                    <div>
                        {recent.length === 0 && (
                            <p className="px-4 py-8 text-center text-sm text-gray-400">No orders yet.</p>
                        )}
                        {recent.map((o) => {
                            const f = o.fulfilment || 'PLACED';
                            return (
                                <button
                                    key={o._id}
                                    onClick={() => navigate('/admin/orders')}
                                    className="w-full flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
                                >
                                    <span className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 text-gray-700 flex items-center justify-center text-xs font-bold shrink-0">
                                        {initials(o.customer?.name)}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-gray-900 truncate">{o.customer?.name}</p>
                                        <p className="text-xs text-gray-400 truncate">{timeAgoBn(o.createdAt)} · #{shortOrderId(o._id)} · {o.product?.name}</p>
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <p className="text-sm font-bold text-gray-900">+Tk {bn((o.pricing?.total || 0).toLocaleString())}</p>
                                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${ORDER_PILL[f] || 'bg-zinc-100 text-zinc-500'}`}>
                                            {ORDER_PILL_TEXT[f] || 'New Order'}
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ═══ 6. quick actions ═══ */}
            <div>
                <p className={`${sectionLabel} mb-2`}>Quick Actions</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                    {quickActions.map((a, i) => {
                        const Icon = a.icon;
                        return (
                            <button
                                key={i}
                                onClick={a.onClick}
                                className="bg-white border border-gray-200 rounded-2xl p-3 flex flex-col items-start gap-2 hover:border-black hover:shadow-sm transition active:scale-[0.97] text-left"
                            >
                                <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${a.chip}`}>
                                    <Icon sx={{ fontSize: '18px' }} />
                                </span>
                                <span className="text-xs font-semibold text-gray-800 leading-tight">{a.label}</span>
                                <span className="text-[10px] text-gray-400 leading-tight">{a.sub}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ═══ 7. analytics ═══ */}
            <p className={sectionLabel}>Analytics</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                    <p className="text-sm font-bold text-gray-900 mb-2">Products by Category</p>
                    <div style={{ height: 180 }}>
                        <Bar data={barState} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { font: { size: 9 }, maxRotation: 45 } }, y: { ticks: { font: { size: 9 } } } } }} />
                    </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                    <p className="text-sm font-bold text-gray-900 mb-2">Stock Status</p>
                    <div style={{ height: 180 }}>
                        <Doughnut data={doughnutState} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } } } }} />
                    </div>
                </div>
            </div>

{/* ═══ 8. low stock alert ═══ */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between px-4 pt-4 pb-2 gap-2">
                    <div className="min-w-0">
                        <h2 className="text-sm font-bold text-gray-900">Low Stock Alert</h2>
                        <p className="text-[11px] text-gray-400">{lowStockProducts.length} product{lowStockProducts.length === 1 ? '' : 's'} need restocking</p>
                    </div>
                    <button
                        onClick={() => navigate('/admin/products')}
                        className="text-xs font-bold text-[#E84B0F] shrink-0 hover:underline"
                    >
                        <span className="inline-flex items-center gap-0.5">Manage<ArrowForwardIcon sx={{ fontSize: '14px' }} /></span>
                    </button>
                </div>
                <div>
                    {lowStockProducts.length === 0 && (
                        <p className="px-4 py-6 text-center text-sm text-gray-400">All products are well stocked.</p>
                    )}
                    {lowStockProducts.map((p) => (
                        <div key={p._id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-0">
                            {p.images?.[0]?.url ? (
                                <img src={p.images[0].url} alt="" className="w-9 h-9 rounded-lg object-contain border bg-white shrink-0" />
                            ) : (
                                <span className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0"><Inventory2Icon sx={{ fontSize: '18px', color: '#9ca3af' }} /></span>
                            )}
                            <p className="text-sm font-semibold text-gray-900 truncate flex-1">{p.name}</p>
                            <span className={`text-[11px] font-bold px-2 py-1 rounded-full shrink-0 ${p.stock <= 0 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'}`}>
                                {p.stock <= 0 ? 'Out' : `${p.stock} left`}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ===== BOTTOM SHEET: manual order ===== */}
            <BottomSheet open={manualOpen} onClose={() => setManualOpen(false)} title="Create Manual Order">
                <form onSubmit={submitManual} className="space-y-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Product</label>
                        <select value={form.productId} onChange={setField('productId')} className={fieldCls} required>
                            <option value="">— Select —</option>
                            {inStockProducts.map((p) => (
                                <option key={p._id} value={p._id}>{p.name} (Tk {p.price})</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Quantity (1–10)</label>
                            <input type="number" min="1" max="10" value={form.qty} onChange={setField('qty')} className={fieldCls} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Mobile</label>
                            <input type="tel" inputMode="numeric" placeholder="01712345678" value={form.phone} onChange={setField('phone')} className={fieldCls} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Customer Name</label>
                        <input type="text" value={form.name} onChange={setField('name')} className={fieldCls} />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
                        <input type="text" placeholder="House, road, area" value={form.address} onChange={setField('address')} className={fieldCls} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
<label className="block text-xs font-medium text-gray-600 mb-1">Division</label>
                        <input type="text" placeholder="e.g. Dhaka" value={form.division} onChange={setField('division')} className={fieldCls} />
                        </div>
                        <div>
<label className="block text-xs font-medium text-gray-600 mb-1">District</label>
                        <input type="text" placeholder="e.g. Dhaka" value={form.district} onChange={setField('district')} className={fieldCls} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Delivery Zone</label>
                        <div className="grid grid-cols-2 gap-2">
                            {[
{ id: 'inside-dhaka', label: `Inside Dhaka · Tk ${bn(charges?.insideDhaka || 70)}` },
                { id: 'outside-dhaka', label: `Outside Dhaka · Tk ${bn(charges?.outsideDhaka || 130)}` },
                            ].map((z) => (
                                <button
                                    key={z.id}
                                    type="button"
                                    onClick={() => setForm((f) => ({ ...f, zone: z.id }))}
                                    className={`text-xs font-semibold rounded-lg border px-2 py-2.5 transition ${
                                        form.zone === z.id
                                            ? 'border-[#E84B0F] bg-[#E84B0F] text-white'
                                            : 'border-gray-200 bg-white text-gray-600'
                                    }`}
                                >
                                    {z.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Payment</label>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                            {['bKash', 'Nagad'].map((m) => (
                                <button
                                    key={m}
                                    type="button"
                                    onClick={() => setForm((f) => ({ ...f, method: m }))}
                                    className={`text-xs font-semibold rounded-lg border px-2 py-2.5 transition ${
                                        form.method === m
                                            ? 'border-[#E84B0F] bg-[#E84B0F] text-white'
                                            : 'border-gray-200 bg-white text-gray-600'
                                    }`}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                        <input
                            type="text"
                            placeholder="TrxID (e.g. BK7X9Q2M)"
                            value={form.trxid}
                            onChange={setField('trxid')}
                            className={fieldCls}
                        />
                        <p className="text-[11px] text-gray-400 mt-1">
                            Enter the customer's TrxID to verify the advance delivery charge.
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={savingManual}
                        className="w-full bg-[#E84B0F] text-white rounded-xl py-3 text-sm font-semibold active:bg-[#C63E0A] disabled:opacity-60"
                    >
                        {savingManual ? 'Creating…' : 'Create Order'}
                    </button>
                </form>
            </BottomSheet>
        </>
    );
};

export default MainData;
