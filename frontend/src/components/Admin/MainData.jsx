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
import BottomSheet from './BottomSheet';
import { bn } from '../../utils/adminHelpers';

const isToday = (d) => new Date(d).toDateString() === new Date().toDateString();

const MainData = () => {

    const dispatch = useDispatch();
    const { enqueueSnackbar } = useSnackbar();
    const navigate = useNavigate();

    const { products } = useSelector((state) => state.products);
    const { orders } = useSelector((state) => state.allOrders);
    const { users } = useSelector((state) => state.users);

    // store (Business Koro) orders — power the mobile metric cards
    const [storeOrders, setStoreOrders] = useState([]);
    const [charges, setCharges] = useState(null); // delivery charges from /store/config
    const [manualOpen, setManualOpen] = useState(false);
    const [savingManual, setSavingManual] = useState(false);
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
                backgroundColor: '#8A39E1',
                data: months.map((m, i) => orders?.filter((od) => new Date(od.createdAt).getMonth() === i && new Date(od.createdAt).getFullYear() === date.getFullYear() - 2).reduce((total, od) => total + od.totalPrice, 0)),
            },
            {
                label: `Sales in ${date.getFullYear() - 1}`,
                borderColor: 'orange',
                backgroundColor: 'orange',
                data: months.map((m, i) => orders?.filter((od) => new Date(od.createdAt).getMonth() === i && new Date(od.createdAt).getFullYear() === date.getFullYear() - 1).reduce((total, od) => total + od.totalPrice, 0)),
            },
            {
                label: `Sales in ${date.getFullYear()}`,
                borderColor: '#4ade80',
                backgroundColor: '#4ade80',
                data: months.map((m, i) => orders?.filter((od) => new Date(od.createdAt).getMonth() === i && new Date(od.createdAt).getFullYear() === date.getFullYear()).reduce((total, od) => total + od.totalPrice, 0)),
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

    // ===== mobile app metrics (store orders) =====
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

    // ===== manual order (bottom sheet → public guest-checkout API) =====
    const openManual = () => {
        setManualOpen(true);
        if (!charges) {
            axios.get('/api/v1/store/config')
                .then(({ data }) => setCharges(data?.deliveryCharges || null))
                .catch(() => setCharges(null));
        }
    };

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

    return (
        <>
            <MetaData title="Admin Dashboard | TechBazar" />

            {/* ===== MOBILE: swipable metric cards (swipe left →) ===== */}
            <div className="sm:hidden -mx-2 px-2 overflow-x-auto">
                <div className="flex gap-3 w-max pb-1 snap-x snap-mandatory">
                    {metricCards.map((m) => (
                        <button
                            key={m.key}
                            onClick={() => navigate(m.to)}
                            className={`${m.bg} min-w-[64%] snap-start rounded-2xl p-4 text-left text-white shadow-lg active:scale-[0.98] transition`}
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-lg">{m.icon}</span>
                                <span className="text-[11px] font-medium text-white/85 leading-tight">{m.label}</span>
                            </div>
                            <p className="text-3xl font-extrabold mt-2">{m.value}</p>
                            <p className="text-[11px] text-white/80 mt-0.5">{m.sub}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* ===== MOBILE: quick action chips ===== */}
            <div className="sm:hidden flex gap-2 flex-wrap">
                <button
                    onClick={openManual}
                    className="text-xs font-semibold bg-primary-blue text-white rounded-full px-3.5 py-2 shadow active:scale-95 transition"
                >
                    + ম্যানুয়াল অর্ডার
                </button>
                <button
                    onClick={() => navigate('/admin/store_orders?filter=verify')}
                    className="text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200 rounded-full px-3.5 py-2 active:scale-95 transition"
                >
                    ⚡ TrxID ভেরিফিকেশন কিউ ({bn(metrics.pendingVerify)})
                </button>
                <button
                    onClick={() => navigate('/admin/products')}
                    className="text-xs font-semibold bg-red-50 text-red-600 border border-red-200 rounded-full px-3.5 py-2 active:scale-95 transition"
                >
                    ⚠️ স্টক শেষ ({bn(outOfStock)})
                </button>
            </div>

            <div className="hidden sm:grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-6">
                <div className="flex flex-col bg-purple-600 text-white gap-2 rounded-xl shadow-lg hover:shadow-xl p-6">
                    <h4 className="text-purple-100 font-medium">Total Sales Amount</h4>
                    <h2 className="text-2xl font-bold">৳{totalAmount?.toLocaleString()}</h2>
                </div>
                <div className="flex flex-col bg-red-600 text-white gap-2 rounded-xl shadow-lg hover:shadow-xl p-6">
                    <h4 className="text-red-100 font-medium">Total Orders</h4>
                    <h2 className="text-2xl font-bold">{orders?.length}</h2>
                </div>
                <div className="flex flex-col bg-yellow-500 text-gray-900 gap-2 rounded-xl shadow-lg hover:shadow-xl p-6">
                    <h4 className="text-yellow-900 font-medium">Total Products</h4>
                    <h2 className="text-2xl font-bold">{products?.length}</h2>
                </div>
                <div className="flex flex-col bg-green-500 text-gray-900 gap-2 rounded-xl shadow-lg hover:shadow-xl p-6">
                    <h4 className="text-green-900 font-medium">Total Users</h4>
                    <h2 className="text-2xl font-bold">{users?.length}</h2>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-8 min-w-full">
                <div className="bg-white rounded-xl h-auto w-full shadow-lg p-2">
                    <Line data={lineState} />
                </div>

                <div className="bg-white rounded-xl shadow-lg p-4 text-center flex flex-col justify-center">
                    <span className="font-medium uppercase text-gray-800">Order Status</span>
                    <Pie data={pieState} />
                </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-8 min-w-full mb-6">
                <div className="bg-white rounded-xl h-auto w-full shadow-lg p-2">
                    <Bar data={barState} />
                </div>

                <div className="bg-white rounded-xl shadow-lg p-4 text-center flex flex-col justify-center">
                    <span className="font-medium uppercase text-gray-800">Stock Status</span>
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
