import { useEffect, useMemo, useState } from 'react';
import Chart from 'chart.js/auto'
import { Doughnut, Line, Pie, Bar } from 'react-chartjs-2';
import { getAdminProducts } from '../../actions/productAction';
import { useSelector, useDispatch } from 'react-redux';
import { getAllOrders } from '../../actions/orderAction';
import { getAllUsers } from '../../actions/userAction';
import { categories } from '../../utils/constants';
import MetaData from '../Layouts/MetaData';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';
import BackdropLoader from '../Layouts/BackdropLoader';
import BottomSheet from './BottomSheet';
import PaidIcon from '@mui/icons-material/Paid';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import GroupsIcon from '@mui/icons-material/Groups';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import BoltIcon from '@mui/icons-material/Bolt';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import SyncIcon from '@mui/icons-material/Sync';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { bn, timeAgoBn, shortOrderId } from '../../utils/adminHelpers';

const isToday = (d) => new Date(d).toDateString() === new Date().toDateString();

// fulfilment chip styles for the recent-orders list
const FULFIL_CHIP = {
    PLACED: 'bg-blue-50 text-blue-700',
    CONFIRMED: 'bg-indigo-50 text-indigo-700',
    SHIPPED: 'bg-purple-50 text-purple-700',
    DELIVERED: 'bg-green-50 text-green-700',
    CANCELLED: 'bg-red-50 text-red-600',
};
const FULFIL_TEXT = {
    PLACED: 'Placed', CONFIRMED: 'Confirmed', SHIPPED: 'Shipped',
    DELIVERED: 'Delivered', CANCELLED: 'Cancelled',
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

const MainData = () => {

    const dispatch = useDispatch();
    const { enqueueSnackbar } = useSnackbar();
    const navigate = useNavigate();

    const { products } = useSelector((state) => state.products);
    const { orders } = useSelector((state) => state.allOrders);
    const { users } = useSelector((state) => state.users);
    const { user } = useSelector((state) => state.user);

    // store (Business Koro) orders — power the pipeline cards + recent list
    const [storeOrders, setStoreOrders] = useState([]);
    const [charges, setCharges] = useState(null); // delivery charges from /store/config
    const [manualOpen, setManualOpen] = useState(false);
    const [savingManual, setSavingManual] = useState(false);
    const [syncing, setSyncing] = useState(false);
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
        if (item.stock === 0) {
            outOfStock += 1;
        }
    });

    useEffect(() => {
        dispatch(getAdminProducts());
        dispatch(getAllOrders());
        dispatch(getAllUsers());
        fetchStoreOrders();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dispatch]);

    let totalAmount = orders?.reduce((total, order) => total + order.totalPrice, 0);

    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    const date = new Date();
    const lineState = {
        labels: months,
        datasets: [
            {
                label: `Sales in ${date.getFullYear() - 2}`,
                borderColor: '#8A39E1',
                backgroundColor: 'rgba(138, 57, 225, 0.12)',
                data: months.map((m, i) => orders?.filter((od) => new Date(od.createdAt).getMonth() === i && new Date(od.createdAt).getFullYear() === date.getFullYear() - 2).reduce((total, od) => total + od.totalPrice, 0)),
                fill: true, tension: 0.35, borderWidth: 2, pointRadius: 0,
            },
            {
                label: `Sales in ${date.getFullYear() - 1}`,
                borderColor: 'orange',
                backgroundColor: 'rgba(251, 146, 60, 0.12)',
                data: months.map((m, i) => orders?.filter((od) => new Date(od.createdAt).getMonth() === i && new Date(od.createdAt).getFullYear() === date.getFullYear() - 1).reduce((total, od) => total + od.totalPrice, 0)),
                fill: true, tension: 0.35, borderWidth: 2, pointRadius: 0,
            },
            {
                label: `Sales in ${date.getFullYear()}`,
                borderColor: '#22c55e',
                backgroundColor: 'rgba(34, 197, 94, 0.15)',
                data: months.map((m, i) => orders?.filter((od) => new Date(od.createdAt).getMonth() === i && new Date(od.createdAt).getFullYear() === date.getFullYear()).reduce((total, od) => total + od.totalPrice, 0)),
                fill: true, tension: 0.35, borderWidth: 2, pointRadius: 0,
            },
        ],
    };

    const statuses = ['Processing', 'Shipped', 'Delivered'];

    const pieState = {
        labels: statuses,
        datasets: [
            {
                backgroundColor: ['#9333ea', '#facc15', '#4ade80'],
                hoverBackgroundColor: ['#a855f7', '#fde047', '#86efac'],
                data: statuses.map((status) => orders?.filter((item) => item.orderStatus === status).length),
            },
        ],
    };

    const doughnutState = {
        labels: ['Out of Stock', 'In Stock'],
        datasets: [
            {
                backgroundColor: ['#ef4444', '#22c55e'],
                hoverBackgroundColor: ['#dc2626', '#16a34a'],
                data: [outOfStock, products.length - outOfStock],
            },
        ],
    };

    const barState = {
        labels: categories,
        datasets: [
            {
                label: "Products",
                borderColor: '#9333ea',
                backgroundColor: '#9333ea',
                hoverBackgroundColor: '#6b21a8',
                data: categories.map((cat) => products?.filter((item) => item.category === cat).length),
            },
        ],
    };

    // ===== store-order pipeline metrics (swipe on mobile, grid on desktop) =====
    const metrics = useMemo(() => {
        const active = storeOrders.filter((o) => o.status !== 'CANCELLED' && o.fulfilment !== 'CANCELLED');
        const pendingVerify = active.filter((o) => o.payment?.verified === false && o.fulfilment !== 'DELIVERED').length;
        const processing = active.filter((o) => o.fulfilment === 'CONFIRMED').length;
        const shipped = active.filter((o) => o.fulfilment === 'SHIPPED').length;
        const deliveredToday = storeOrders.filter((o) => o.fulfilment === 'DELIVERED' && isToday(o.createdAt));
        const cashToday = deliveredToday.reduce((s, o) => s + (o.pricing?.total || 0), 0);
        return { pendingVerify, processing, shipped, deliveredToday: deliveredToday.length, cashToday };
    }, [storeOrders]);

    const metricCards = [
        {
            key: 'verify', bg: 'bg-amber-500', icon: '⚡',
            label: 'Pending Verification', value: bn(metrics.pendingVerify),
            sub: 'TrxID যাচাই বাকি', to: '/admin/store_orders?filter=verify',
        },
        {
            key: 'confirmed', bg: 'bg-blue-600', icon: '🔵',
            label: 'Confirmed / Processing', value: bn(metrics.processing),
            sub: 'কুরিয়ার বুকিংয়ের অপেক্ষায়', to: '/admin/store_orders?filter=confirmed',
        },
        {
            key: 'shipped', bg: 'bg-violet-600', icon: '🚚',
            label: 'In Transit / Shipped', value: bn(metrics.shipped),
            sub: 'ডেলিভারি চলছে', to: '/admin/store_orders?filter=shipped',
        },
        {
            key: 'today', bg: 'bg-green-600', icon: '🟢',
            label: "Today's Delivered & Cash", value: `৳${bn(metrics.cashToday.toLocaleString())}`,
            sub: `${bn(metrics.deliveredToday)} অর্ডার ডেলিভারড`, to: '/admin/store_orders?filter=delivered',
        },
    ];

    // ===== headline KPI cards (desktop + mobile) =====
    const kpiCards = [
        {
            icon: PaidIcon, label: 'মোট বিক্রয়', value: `৳${bn((totalAmount || 0).toLocaleString())}`,
            sub: 'পেইড অর্ডার থেকে', iconBg: 'bg-indigo-100 text-indigo-600', subColor: 'text-gray-400',
        },
        {
            icon: ReceiptLongIcon, label: 'মোট অর্ডার', value: bn(orders?.length || 0),
            sub: `স্টোর অর্ডার: ${bn(storeOrders.length)}`, iconBg: 'bg-rose-100 text-rose-600', subColor: 'text-gray-400',
        },
        {
            icon: Inventory2Icon, label: 'পণ্য', value: bn(products?.length || 0),
            sub: outOfStock > 0 ? `${bn(outOfStock)} টি স্টক শেষ ⚠️` : 'সব পণ্য স্টকে আছে',
            iconBg: 'bg-amber-100 text-amber-600', subColor: outOfStock > 0 ? 'text-red-500 font-semibold' : 'text-emerald-600',
        },
        {
            icon: GroupsIcon, label: 'ব্যবহারকারী', value: bn(users?.length || 0),
            sub: 'নিবন্ধিত কাস্টমার', iconBg: 'bg-emerald-100 text-emerald-600', subColor: 'text-gray-400',
        },
    ];

    // ===== quick action tiles =====
    const quickActions = [
        { icon: AddShoppingCartIcon, label: '+ ম্যানুয়াল অর্ডার', sub: 'ফোনের অর্ডার', bg: 'bg-blue-100 text-blue-600', onClick: openManual },
        { icon: BoltIcon, label: 'ভেরিফিকেশন কিউ', sub: `${bn(metrics.pendingVerify)} টি TrxID বাকি`, bg: 'bg-amber-100 text-amber-700', onClick: () => navigate('/admin/store_orders?filter=verify') },
        { icon: WarningAmberIcon, label: 'স্টক শেষ', sub: `${bn(outOfStock)} টি পণ্য`, bg: 'bg-red-100 text-red-600', onClick: () => navigate('/admin/products') },
        { icon: SyncIcon, label: 'ক্যাটালগ সিংক', sub: 'Business Koro', bg: 'bg-violet-100 text-violet-600', onClick: syncCatalog },
        { icon: ReceiptLongIcon, label: 'স্টোর অর্ডার', sub: `${bn(storeOrders.length)} টি`, bg: 'bg-sky-100 text-sky-600', onClick: () => navigate('/admin/store_orders') },
        { icon: ChatBubbleOutlineIcon, label: 'লাইভ চ্যাট', sub: 'ইনবক্স', bg: 'bg-emerald-100 text-emerald-600', onClick: () => navigate('/admin/chat') },
    ];

    // recent store orders (newest first)
    const recent = useMemo(
        () => [...storeOrders]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5),
        [storeOrders]
    );

    // ===== manual order (bottom sheet → public guest-checkout API) =====
    function openManual() {
        setManualOpen(true);
        if (!charges) {
            axios.get('/api/v1/store/config')
                .then(({ data }) => setCharges(data?.deliveryCharges || null))
                .catch(() => setCharges(null));
        }
    }

    async function syncCatalog() {
        setSyncing(true);
        try {
            const { data } = await axios.post('/api/v1/admin/store/sync', {}, { headers: { Accept: 'application/json' } });
            enqueueSnackbar(data.result?.skipped
                ? `Sync skipped: ${data.result.reason}`
                : `Catalogue synced: ${data.result.count} products`, { variant: data.result?.skipped ? 'warning' : 'success' });
        } catch (err) {
            enqueueSnackbar(err.response?.data?.message || 'Sync failed', { variant: 'error' });
        } finally {
            setSyncing(false);
        }
    }

    function refreshAll() {
        dispatch(getAdminProducts());
        dispatch(getAllOrders());
        dispatch(getAllUsers());
        fetchStoreOrders();
        enqueueSnackbar('ডেটা রিফ্রেশ হয়েছে', { variant: 'success' });
    }

    const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

    const submitManual = async (e) => {
        e.preventDefault();
        if (!form.productId) return enqueueSnackbar('একটি প্রোডাক্ট নির্বাচন করুন', { variant: 'error' });
        if (!form.name.trim() || !form.address.trim() || !form.division.trim() || !form.district.trim())
            return enqueueSnackbar('নাম, ঠিকানা, বিভাগ ও জেলা দিন', { variant: 'error' });
        if (!/^01[3-9]\d{8}$/.test(form.phone.trim()))
            return enqueueSnackbar('সঠিক মোবাইল নম্বর দিন (যেমন 01712345678)', { variant: 'error' });
        if (form.trxid.trim().length < 4)
            return enqueueSnackbar('TrxID দিন (কমপক্ষে ৪ অক্ষর)', { variant: 'error' });

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
            enqueueSnackbar('অর্ডার তৈরি হয়েছে — অনুমোদনের অপেক্ষায়', { variant: 'success' });
            setManualOpen(false);
            setForm({
                productId: '', qty: '1', name: '', phone: '', division: '', district: '', address: '',
                zone: 'inside-dhaka', method: 'bKash', trxid: '',
            });
            fetchStoreOrders();
        } catch (err) {
            enqueueSnackbar(err.response?.data?.message || 'অর্ডার তৈরি ব্যর্থ', { variant: 'error' });
        } finally {
            setSavingManual(false);
        }
    };

    const inStockProducts = (products || []).filter((p) => p.stock > 0);
    const fieldCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-primary-blue focus:outline-none bg-white';
    const sectionLabel = 'text-[11px] font-semibold uppercase tracking-wider text-gray-400';

    return (
        <>
            <MetaData title="Admin Dashboard | TechBazar" />
            {syncing && <BackdropLoader />}

            {/* ═══ 1. greeting header ═══ */}
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div className="min-w-0">
                    <h1 className="text-lg sm:text-2xl font-bold text-slate-900 truncate">
                        স্বাগতম, {user?.name || 'Admin'} 👋
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{todayLabel()} · আপনার ব্যবসার সারসংক্ষেপ</p>
                </div>
                <div className="flex gap-2 shrink-0">
                    <button
                        onClick={refreshAll}
                        className="text-xs sm:text-sm border border-gray-300 bg-white rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-50 active:scale-95 transition"
                    >
                        🔄 রিফ্রেশ
                    </button>
                    <button
                        onClick={openManual}
                        className="text-xs sm:text-sm bg-primary-blue text-white rounded-lg px-3 py-2 font-semibold hover:bg-blue-700 active:scale-95 transition"
                    >
                        + নতুন অর্ডার
                    </button>
                </div>
            </div>

            {/* ═══ 2. headline KPI cards ═══ */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {kpiCards.map((k, i) => {
                    const Icon = k.icon;
                    return (
                        <div key={i} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-col gap-1.5 hover:shadow-md transition">
                            <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${k.iconBg}`}>
                                <Icon sx={{ fontSize: '20px' }} />
                            </span>
                            <p className="text-xs text-gray-500 font-medium mt-1">{k.label}</p>
                            <p className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">{k.value}</p>
                            <p className={`text-[11px] ${k.subColor}`}>{k.sub}</p>
                        </div>
                    );
                })}
            </div>

            {/* ═══ 3. store-order pipeline (swipe → on mobile, grid on desktop) ═══ */}
            <div>
                <p className={`${sectionLabel} mb-2`}>স্টোর অর্ডার পাইপলাইন</p>
                <div className="-mx-2 px-2 overflow-x-auto sm:mx-0 sm:px-0 sm:overflow-visible">
                    <div className="flex gap-3 w-max pb-1 snap-x snap-mandatory sm:w-auto sm:grid sm:grid-cols-4">
                        {metricCards.map((m) => (
                            <button
                                key={m.key}
                                onClick={() => navigate(m.to)}
                                className={`${m.bg} sm:min-w-0 snap-start rounded-2xl p-4 text-left text-white shadow-lg active:scale-[0.98] transition`}
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">{m.icon}</span>
                                    <span className="text-[11px] font-medium text-white/85 leading-tight">{m.label}</span>
                                </div>
                                <p className="text-2xl sm:text-3xl font-extrabold mt-2">{m.value}</p>
                                <p className="text-[11px] text-white/80 mt-0.5">{m.sub}</p>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ═══ 4. quick action tiles ═══ */}
            <div>
                <p className={`${sectionLabel} mb-2`}>কুইক অ্যাকশন</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                    {quickActions.map((a, i) => {
                        const Icon = a.icon;
                        return (
                            <button
                                key={i}
                                onClick={a.onClick}
                                className="bg-white border border-gray-200 rounded-2xl p-3 flex flex-col items-start gap-2 hover:border-primary-blue hover:shadow-sm transition active:scale-[0.97] text-left"
                            >
                                <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${a.bg}`}>
                                    <Icon sx={{ fontSize: '18px' }} />
                                </span>
                                <span className="text-xs font-semibold text-gray-800 leading-tight">{a.label}</span>
                                <span className="text-[10px] text-gray-400 leading-tight">{a.sub}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ═══ 5. recent store orders ═══ */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between px-4 pt-4 pb-2 gap-2">
                    <div className="min-w-0">
                        <h2 className="text-sm font-bold text-gray-900">সাম্প্রতিক স্টোর অর্ডার</h2>
                        <p className="text-[11px] text-gray-400">মোট {bn(storeOrders.length)} টি অর্ডার</p>
                    </div>
                    <button
                        onClick={() => navigate('/admin/store_orders')}
                        className="text-xs font-semibold text-primary-blue shrink-0 hover:underline"
                    >
                        সব দেখুন →
                    </button>
                </div>
                <div className="divide-y divide-gray-100">
                    {recent.length === 0 && (
                        <p className="px-4 py-8 text-center text-sm text-gray-400">
                            এখনো কোনো স্টোর অর্ডার নেই — প্রথম অর্ডারটা এসে গেলে এখানে দেখা যাবে।
                        </p>
                    )}
                    {recent.map((o) => (
                        <button
                            key={o._id}
                            onClick={() => navigate('/admin/store_orders')}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
                        >
                            {o.product?.image ? (
                                <img src={o.product.image} alt="" className="w-10 h-10 object-contain rounded-lg border bg-white shrink-0" />
                            ) : (
                                <span className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 shrink-0">📦</span>
                            )}
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                    #{shortOrderId(o._id)} · {o.product?.name}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                    {o.customer?.name} · {timeAgoBn(o.createdAt)}
                                </p>
                            </div>
                            <div className="shrink-0 text-right">
                                <p className="text-sm font-bold text-gray-900">৳{bn((o.pricing?.total || 0).toLocaleString())}</p>
                                <span className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full mt-0.5 ${FULFIL_CHIP[o.fulfilment] || 'bg-slate-100 text-slate-500'}`}>
                                    {FULFIL_TEXT[o.fulfilment] || 'Placed'}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* ═══ 6. analytics ═══ */}
            <p className={sectionLabel}>অ্যানালিটিক্স</p>

            <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-8 min-w-full">
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm w-full p-3">
                    <p className="text-xs font-semibold text-gray-700 mb-1 px-1">মাসিক বিক্রয় (৳)</p>
                    <Line data={lineState} />
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 text-center flex flex-col justify-center">
                    <span className="text-xs font-semibold text-gray-700">পেইড অর্ডার স্ট্যাটাস</span>
                    <Pie data={pieState} />
                </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-8 min-w-full mb-6">
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm w-full p-3">
                    <p className="text-xs font-semibold text-gray-700 mb-1 px-1">ক্যাটাগরি অনুযায়ী পণ্য</p>
                    <Bar data={barState} />
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 text-center flex flex-col justify-center">
                    <span className="text-xs font-semibold text-gray-700">স্টক অবস্থা</span>
                    <Doughnut data={doughnutState} />
                </div>
            </div>

            {/* ===== BOTTOM SHEET: manual order ===== */}
            <BottomSheet open={manualOpen} onClose={() => setManualOpen(false)} title="ম্যানুয়াল অর্ডার তৈরি">
                <form onSubmit={submitManual} className="space-y-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">প্রোডাক্ট</label>
                        <select value={form.productId} onChange={setField('productId')} className={fieldCls} required>
                            <option value="">— নির্বাচন করুন —</option>
                            {inStockProducts.map((p) => (
                                <option key={p._id} value={p._id}>{p.name} (৳{p.price})</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">পরিমাণ (১–১০)</label>
                            <input type="number" min="1" max="10" value={form.qty} onChange={setField('qty')} className={fieldCls} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">মোবাইল</label>
                            <input type="tel" inputMode="numeric" placeholder="01712345678" value={form.phone} onChange={setField('phone')} className={fieldCls} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">কাস্টমারের নাম</label>
                        <input type="text" value={form.name} onChange={setField('name')} className={fieldCls} />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">ঠিকানা</label>
                        <input type="text" placeholder="বাড়ি, রোড, এলাকা" value={form.address} onChange={setField('address')} className={fieldCls} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">বিভাগ</label>
                            <input type="text" placeholder="যেমন: ঢাকা" value={form.division} onChange={setField('division')} className={fieldCls} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">জেলা</label>
                            <input type="text" placeholder="যেমন: ঢাকা" value={form.district} onChange={setField('district')} className={fieldCls} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">ডেলিভারি জোন</label>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { id: 'inside-dhaka', label: `ঢাকার ভিতরে · ৳${bn(charges?.insideDhaka || 70)}` },
                                { id: 'outside-dhaka', label: `ঢাকার বাইরে · ৳${bn(charges?.outsideDhaka || 130)}` },
                            ].map((z) => (
                                <button
                                    key={z.id}
                                    type="button"
                                    onClick={() => setForm((f) => ({ ...f, zone: z.id }))}
                                    className={`text-xs font-semibold rounded-lg border px-2 py-2.5 transition ${
                                        form.zone === z.id
                                            ? 'border-primary-blue bg-blue-50 text-primary-blue'
                                            : 'border-gray-300 bg-white text-gray-600'
                                    }`}
                                >
                                    {z.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">পেমেন্ট</label>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                            {['bKash', 'Nagad'].map((m) => (
                                <button
                                    key={m}
                                    type="button"
                                    onClick={() => setForm((f) => ({ ...f, method: m }))}
                                    className={`text-xs font-semibold rounded-lg border px-2 py-2.5 transition ${
                                        form.method === m
                                            ? 'border-primary-blue bg-blue-50 text-primary-blue'
                                            : 'border-gray-300 bg-white text-gray-600'
                                    }`}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                        <input
                            type="text"
                            placeholder="TrxID (যেমন BK7X9Q2M)"
                            value={form.trxid}
                            onChange={setField('trxid')}
                            className={fieldCls}
                        />
                        <p className="text-[11px] text-gray-400 mt-1">
                            অগ্রিম ডেলিভারি চার্জ যাচাইয়ের জন্য কাস্টমারের TrxID দিন।
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={savingManual}
                        className="w-full bg-primary-blue text-white rounded-xl py-3 text-sm font-semibold active:bg-blue-700 disabled:opacity-60"
                    >
                        {savingManual ? 'তৈরি হচ্ছে…' : 'অর্ডার তৈরি করুন'}
                    </button>
                </form>
            </BottomSheet>
        </>
    );
};

export default MainData;
