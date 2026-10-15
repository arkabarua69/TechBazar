import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import MetaData from '../Layouts/MetaData';
import BackdropLoader from '../Layouts/BackdropLoader';
import { formatDate } from '../../utils/functions';
import BottomSheet from './BottomSheet';
import PhoneIcon from '@mui/icons-material/Phone';
import ChatIcon from '@mui/icons-material/Chat';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import CheckIcon from '@mui/icons-material/Check';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import {
    bn,
    shortOrderId,
    timeAgoBn,
    copyText,
    emitOrdersAlert,
    SEARCH_FOCUS_EVENT,
    LAST_SEEN_KEY,
} from '../../utils/adminHelpers';

const STATUS_STYLES = {
    PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800',
    FORWARDED: 'bg-green-100 text-green-800',
    FORWARD_FAILED: 'bg-red-100 text-red-800',
    CANCELLED: 'bg-slate-100 text-slate-500',
};

// customer-facing status shown to guests on the tracking page
const FULFILMENT_STYLES = {
    PLACED: 'bg-blue-50 text-blue-700',
    CONFIRMED: 'bg-indigo-50 text-indigo-700',
    SHIPPED: 'bg-purple-50 text-purple-700',
    DELIVERED: 'bg-green-50 text-green-700',
    CANCELLED: 'bg-red-50 text-red-600',
};
const FULFILMENT_LABELS = {
    PLACED: 'Placed',
    CONFIRMED: 'Confirmed',
    SHIPPED: 'Shipped',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled',
};
// merchant-app wording for the bottom-sheet stepper
const STEPPER_LABELS = {
    PLACED: 'Pending',
    CONFIRMED: 'Confirmed',
    SHIPPED: 'Handed to Courier',
    DELIVERED: 'Delivered',
};
// selectable progression (Cancelled happens through the Cancel button)
const FULFILMENT_OPTIONS = ['PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];

// queue filters (chips)
const FILTERS = [
    { id: 'all', label: 'All' },
    { id: 'verify', label: 'Verify TrxID' },
    { id: 'pending', label: 'Pending approval' },
    { id: 'confirmed', label: 'Confirmed' },
    { id: 'shipped', label: 'Shipped' },
    { id: 'delivered', label: 'Delivered' },
];
const matchesFilter = (order, f) => {
    switch (f) {
        case 'verify':
            return (
                order.payment?.verified === false &&
                order.status !== 'CANCELLED' &&
                order.fulfilment !== 'DELIVERED' &&
                order.fulfilment !== 'CANCELLED'
            );
        case 'pending':
            return order.status === 'PENDING_APPROVAL' || order.status === 'FORWARD_FAILED';
        case 'confirmed':
            return order.fulfilment === 'CONFIRMED';
        case 'shipped':
            return order.fulfilment === 'SHIPPED';
        case 'delivered':
            return order.fulfilment === 'DELIVERED';
        default:
            return true;
    }
};

// one-tap WhatsApp chat link for a BD phone number (optional pre-filled text)
const waLink = (phone, text) => {
    const digits = String(phone || '').replace(/\D/g, '');
    const intl = digits.startsWith('880') ? digits : `88${digits.replace(/^0/, '')}`;
    return `https://wa.me/${intl}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
};

const StoreOrders = () => {

    const { enqueueSnackbar } = useSnackbar();
    const [searchParams, setSearchParams] = useSearchParams();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [busyId, setBusyId] = useState(null);
    const [syncing, setSyncing] = useState(false);

    // mobile UX state: search box, queue filter chips, bottom sheets
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState(() => searchParams.get('filter') || 'all');
    const [sheet, setSheet] = useState(null); // { id, mode: 'details' | 'actions' }
    const searchRef = useRef(null);

    const fetchOrders = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await axios.get('/api/v1/admin/store/orders', { headers: { Accept: 'application/json' } });
            const list = data.orders || [];
            setOrders(list);

            // viewing the queue marks everything as seen → badges clear
            try {
                const newest = list.length ? new Date(list[0].createdAt).getTime() : Date.now();
                localStorage.setItem(LAST_SEEN_KEY, String(Math.max(newest, Number(localStorage.getItem(LAST_SEEN_KEY) || 0))));
            } catch (e) { /* ignore */ }
            const pendingVerify = list.filter((o) => matchesFilter(o, 'verify')).length;
            emitOrdersAlert({ unseen: 0, pendingVerify });
        } catch (err) {
            enqueueSnackbar(err.response?.data?.message || 'Failed to load store orders', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    }, [enqueueSnackbar]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    // the app bar's search icon dispatches this after navigating here
    useEffect(() => {
        const focus = () => searchRef.current?.focus();
        window.addEventListener(SEARCH_FOCUS_EVENT, focus);
        return () => window.removeEventListener(SEARCH_FOCUS_EVENT, focus);
    }, []);

    const act = async (id, action) => {
        setBusyId(id);
        try {
            const { data } = await axios.put(`/api/v1/admin/store/orders/${id}/${action}`, {}, { headers: { Accept: 'application/json' } });
            enqueueSnackbar(action === 'approve'
                ? `Order ${data.order?.orderId || ''} approved`
                : 'Order cancelled', { variant: 'success' });
            fetchOrders();
        } catch (err) {
            enqueueSnackbar(err.response?.data?.message || 'Action failed', { variant: 'error' });
            fetchOrders();
        } finally {
            setBusyId(null);
        }
    };

    const syncCatalog = async () => {
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
    };

    // Pending -> Confirmed -> Shipped -> Delivered + TrxID verification
    const updateStatus = async (id, body, successMsg) => {
        setBusyId(id);
        try {
            await axios.put(`/api/v1/admin/store/orders/${id}/status`, body, { headers: { 'Content-Type': 'application/json', Accept: 'application/json' } });
            enqueueSnackbar(successMsg, { variant: 'success' });
            fetchOrders();
        } catch (err) {
            enqueueSnackbar(err.response?.data?.message || 'Status update failed', { variant: 'error' });
        } finally {
            setBusyId(null);
        }
    };

    const doCopy = async (text) => {
        const ok = await copyText(text);
        enqueueSnackbar(ok ? 'TrxID copied' : 'Copy failed', { variant: ok ? 'success' : 'error' });
    };

    const pickFilter = (id) => {
        setFilter(id);
        const next = new URLSearchParams(searchParams);
        if (id === 'all') next.delete('filter');
        else next.set('filter', id);
        setSearchParams(next, { replace: true });
    };

    // search across customer / phone / TrxID / product / ids
    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return orders.filter((o) => {
            if (!matchesFilter(o, filter)) return false;
            if (!q) return true;
            return [o.customer?.name, o.customer?.phone, o.customer?.address, o.payment?.transactionId,
                o.product?.name, o.groupId, o.bkOrderId, o._id]
                .filter(Boolean)
                .some((v) => String(v).toLowerCase().includes(q));
        });
    }, [orders, filter, search]);

    const counts = useMemo(() => {
        const c = { all: orders.length };
        FILTERS.slice(1).forEach((f) => { c[f.id] = orders.filter((o) => matchesFilter(o, f.id)).length; });
        return c;
    }, [orders]);

    // keep the open sheet in sync with refreshed data (close if it vanished)
    const sheetOrder = sheet ? orders.find((o) => o._id === sheet.id) : null;
    useEffect(() => {
        if (sheet && !sheetOrder) setSheet(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orders]);

    const zoneLabel = (o) => (o.delivery?.zone === 'inside-dhaka' ? 'Inside Dhaka' : 'Outside Dhaka');
    const codDue = (o) => (o.pricing?.sellingPrice || 0) * (o.pricing?.quantity || 0);

    return (
        <>
            <MetaData title="Store Orders" />
            {(loading || syncing) && <BackdropLoader />}

            <div className="flex items-center justify-between gap-3 flex-wrap">
                <h1 className="text-lg sm:text-xl font-extrabold text-gray-900">Store Orders</h1>
                <div className="flex gap-2">
                    <button onClick={fetchOrders} className="text-sm font-semibold border border-gray-300 bg-white rounded-full px-4 py-1.5 hover:bg-gray-100">Refresh</button>
                    <button onClick={syncCatalog} className="text-sm font-semibold bg-black text-white rounded-full px-4 py-1.5 hover:bg-gray-800">Sync catalogue</button>
                </div>
            </div>

            <p className="text-sm text-gray-500 mt-1">
                Guest orders wait here until you review and approve or cancel them.
            </p>

            {/* search — one-tap lookup by name / phone / TrxID */}
            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 flex items-center"><SearchIcon sx={{ fontSize: '18px' }} /></span>
                <input
                    ref={searchRef}
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name, phone or TrxID…"
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-2xl bg-white focus:border-black focus:outline-none"
                />
            </div>

            {/* queue filter chips */}
            <div className="flex flex-wrap gap-2 pb-1">
                {FILTERS.map((f) => (
                    <button
                        key={f.id}
                        onClick={() => pickFilter(f.id)}
                        className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition ${
                            filter === f.id
                                ? 'bg-black text-white border-black'
                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                        {f.label}
                        <span className={`ml-1.5 font-bold ${filter === f.id ? 'text-white/70' : 'text-gray-400'}`}>
                            {bn(counts[f.id] || 0)}
                        </span>
                    </button>
                ))}
            </div>

            {/* ===== MOBILE: merchant-app order cards (no horizontal scroll) ===== */}
            <div className="sm:hidden flex flex-col gap-3">
                {filtered.length === 0 && (
                    <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-8 text-center text-gray-400 text-sm">
                        No orders match.
                    </div>
                )}
                {filtered.map((order) => {
                    const busy = busyId === order._id;
                    return (
                        <article key={order._id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                            {/* card header: #id • time • delivery badge */}
                            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b border-gray-100">
                                <span className="font-bold text-gray-900 text-sm">#{shortOrderId(order._id)}</span>
                                <span className="text-[11px] text-gray-400">• {timeAgoBn(order.createdAt)}</span>
                                <span className="ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full bg-black text-white whitespace-nowrap">
                                    Tk {bn(order.delivery?.charge)} {zoneLabel(order)}
                                </span>
                            </div>

                            {/* tappable body → details bottom sheet */}
                            <div
                                role="button"
                                tabIndex={0}
                                onClick={() => setSheet({ id: order._id, mode: 'details' })}
                                onKeyDown={(e) => { if (e.key === 'Enter') setSheet({ id: order._id, mode: 'details' }); }}
                                className="px-3 py-3 cursor-pointer active:bg-gray-50 transition-colors"
                            >
                                <div className="flex gap-2.5 items-center">
                                    {order.product?.image && (
                                        <img src={order.product.image} alt="" className="w-11 h-11 object-contain rounded-lg border bg-white shrink-0" />
                                    )}
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">{order.product?.name}</p>
                                        <p className="text-xs text-gray-500">{order.customer?.name} · Qty {bn(order.pricing?.quantity)}</p>
                                    </div>
                                </div>

                                <p className="text-xs text-gray-600 mt-2 flex items-start gap-1">
                                    <span className="text-gray-400 mt-0.5"><LocationOnIcon sx={{ fontSize: '14px' }} /></span>
                                    <span className="line-clamp-2">{order.customer?.address}{order.customer?.area ? `, ${order.customer.area}` : ''}, {order.customer?.district}, {order.customer?.division}</span>
                                </p>

                                {/* payment box: TrxID + one-tap copy + advance/due */}
                                <div className="mt-2 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-2.5">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-white border text-gray-600">{order.payment?.method}</span>
                                        <span className="font-mono text-xs text-gray-800">{order.payment?.transactionId}</span>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); doCopy(order.payment?.transactionId); }}
                                            className="ml-auto text-[11px] font-medium bg-white border rounded px-2 py-1 text-gray-600 active:bg-gray-100"
                                        >
                                            <ContentCopyIcon sx={{ fontSize: '12px', verticalAlign: 'middle', marginRight: '3px' }} />Copy
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between mt-1.5 text-[11px] gap-2">
                                        <span className="text-gray-600">Advance (delivery): <b>Tk {bn(order.delivery?.charge)}</b></span>
                                        <span className={order.payment?.verified ? 'text-green-600 font-semibold' : 'text-amber-600 font-semibold'}>
                                            {order.payment?.verified ? (
                                                <span className="inline-flex items-center gap-1"><CheckIcon sx={{ fontSize: '13px' }} /> Verified</span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1"><WarningAmberIcon sx={{ fontSize: '13px' }} /> TrxID pending verification</span>
                                            )}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-gray-600 mt-0.5">
                                        Cash on delivery: <b className="text-gray-900">Tk {bn(codDue(order).toLocaleString())}</b>
                                    </p>
                                </div>

                                {/* status chips */}
                                <div className="flex gap-1.5 mt-2 flex-wrap">
                                    <span className={`text-[10px] p-1 px-2 font-medium rounded-full ${STATUS_STYLES[order.status] || ''}`}>{order.status}</span>
                                    <span className={`text-[10px] p-1 px-2 font-medium rounded-full ${FULFILMENT_STYLES[order.fulfilment] || ''}`}>
                                        {FULFILMENT_LABELS[order.fulfilment] || 'Placed'}
                                    </span>
                                    {order.bkOrderId && <span className="text-[10px] text-gray-400 font-mono self-center">BK: {order.bkOrderId}</span>}
                                    {order.bkError && <span className="text-[10px] text-red-500 w-full">{order.bkError}</span>}
                                </div>
                            </div>

                            {/* one-tap quick actions */}
                            <div className="flex gap-2 px-3 py-2 border-t border-gray-100 bg-white">
                                <a
                                    href={`tel:${order.customer?.phone}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex-1 text-xs font-semibold bg-gray-100 text-gray-800 rounded-lg py-2 text-center active:bg-gray-200 flex items-center justify-center gap-1"
                                >
                                    <PhoneIcon sx={{ fontSize: '14px' }} />
                                    Call
                                </a>
                                <a
                                    href={waLink(order.customer?.phone, `Inquiry about your order #${shortOrderId(order._id)}`)}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex-1 text-xs font-semibold bg-green-50 text-green-700 rounded-lg py-2 text-center active:bg-green-100 flex items-center justify-center gap-1"
                                >
                                    <ChatIcon sx={{ fontSize: '14px' }} />
                                    WhatsApp
                                </a>
                                <button
                                    onClick={() => setSheet({ id: order._id, mode: 'actions' })}
                                    disabled={busy}
                                    className="flex-1 text-xs font-semibold bg-black text-white rounded-lg py-2 active:bg-gray-800 disabled:opacity-50"
                                >
                                    <span className="inline-flex items-center gap-0.5">Status<ChevronRightIcon sx={{ fontSize: '14px' }} /></span>
                                </button>
                            </div>
                        </article>
                    );
                })}
            </div>

            {/* ===== DESKTOP: table (unchanged) ===== */}
            <div className="hidden sm:block bg-white rounded-2xl border border-gray-200 shadow-sm mt-4 overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                        <tr>
                            <th className="px-4 py-3">Product</th>
                            <th className="px-4 py-3">Customer</th>
                            <th className="px-4 py-3">Payment (TrxID)</th>
                            <th className="px-4 py-3">Amount</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Ordered on</th>
                            <th className="px-4 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filtered.length === 0 && (
                            <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No store orders yet.</td></tr>
                        )}
                        {filtered.map((order) => (
                            <tr key={order._id} className="hover:bg-gray-50 align-top">
                                <td className="px-4 py-3">
                                    <div className="flex gap-2 items-center">
                                        {order.product?.image && (
                                            <img src={order.product.image} alt="" className="w-10 h-10 object-contain rounded border" />
                                        )}
                                        <div>
                                            <p className="font-medium text-gray-800 max-w-[180px] truncate">{order.product?.name}</p>
                                            <p className="text-xs text-gray-400">Qty {order.pricing?.quantity}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <p className="font-medium text-gray-800">{order.customer?.name}</p>
                                    <p className="text-xs text-gray-500">{order.customer?.phone}</p>
                                    <p className="text-xs text-gray-500 max-w-[180px]">
                                        {order.customer?.address}, {order.customer?.area ? `${order.customer.area}, ` : ''}
                                        {order.customer?.district}, {order.customer?.division}
                                    </p>
                                    {/* one-tap contact */}
                                    <div className="flex gap-1.5 mt-1.5">
                                        <a
                                            href={`tel:${order.customer?.phone}`}
                                            className="text-xs bg-gray-100 text-gray-800 rounded px-2 py-1 hover:bg-gray-200 font-medium flex items-center gap-1">
                                            <PhoneIcon sx={{ fontSize: '12px' }} />
                                            Call
                                        </a>
                                        <a
                                            href={waLink(order.customer?.phone)}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-xs bg-green-50 text-green-700 rounded px-2 py-1 hover:bg-green-100 font-medium flex items-center gap-1">
                                            <ChatIcon sx={{ fontSize: '12px' }} />
                                            WhatsApp
                                        </a>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <p className="font-medium text-gray-800">{order.payment?.method}</p>
                                    <p className="text-xs text-gray-500 font-mono">{order.payment?.transactionId}</p>
                                    <button
                                        onClick={() => updateStatus(order._id, { paymentVerified: !order.payment?.verified }, order.payment?.verified ? 'TrxID unverified' : 'TrxID verified')}
                                        disabled={busyId === order._id}
                                        className={`text-xs rounded px-2 py-1 mt-1 disabled:opacity-50 ${
                                            order.payment?.verified
                                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                        }`}>
                                        {order.payment?.verified ? <><CheckCircleIcon sx={{ fontSize: '12px' }} /> Verified</> : 'Verify TrxID'}
                                    </button>
                                </td>
                                <td className="px-4 py-3">
                                    <p className="font-medium">Tk {order.pricing?.sellingPrice?.toLocaleString()} × {order.pricing?.quantity}</p>
                                    <p className="text-xs text-gray-500">Delivery Tk {order.delivery?.charge} ({order.delivery?.zone === 'inside-dhaka' ? 'in Dhaka' : 'outside'})</p>
                                    <p className="text-xs font-semibold text-yellow-600 mt-0.5">
                                        COD collect: Tk {((order.pricing?.sellingPrice || 0) * (order.pricing?.quantity || 0)).toLocaleString()}
                                    </p>
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`text-xs p-1 px-2 font-medium rounded-full ${STATUS_STYLES[order.status] || ''}`}>{order.status}</span>
                                    <span className={`block text-xs p-1 px-2 font-medium rounded-full mt-1 w-fit ${FULFILMENT_STYLES[order.fulfilment] || ''}`}>
                                        {FULFILMENT_LABELS[order.fulfilment] || 'Placed'}
                                    </span>
                                    {order.bkOrderId && <p className="text-xs text-gray-400 mt-1 font-mono">BK: {order.bkOrderId}</p>}
                                    {order.bkError && <p className="text-xs text-red-500 mt-1 max-w-[160px]">{order.bkError}</p>}
                                </td>
                                <td className="px-4 py-3 text-xs text-gray-500">{formatDate(order.createdAt)}</td>
                                <td className="px-4 py-3">
                                    <select
                                        value={order.fulfilment || 'PLACED'}
                                        disabled={busyId === order._id || order.fulfilment === 'CANCELLED'}
                                        onChange={(e) => updateStatus(order._id, { fulfilment: e.target.value }, `Status → ${FULFILMENT_LABELS[e.target.value]}`)}
                                        className="text-xs border border-gray-300 rounded px-2 py-1.5 bg-white disabled:opacity-50 mb-1.5 block"
                                    >
                                        {FULFILMENT_OPTIONS.map((key) => (
                                            <option key={key} value={key}>{FULFILMENT_LABELS[key]}</option>
                                        ))}
                                    </select>
                                    {(order.status === 'PENDING_APPROVAL' || order.status === 'FORWARD_FAILED') && (
                                        <button
                                            onClick={() => act(order._id, 'approve')}
                                            disabled={busyId === order._id}
                                            className="text-xs bg-green-600 text-white rounded px-3 py-1.5 hover:bg-green-700 disabled:opacity-50">
                                            {order.status === 'FORWARD_FAILED' ? 'Retry' : 'Approve → BK'}
                                        </button>
                                    )}
                                    {order.status !== 'CANCELLED' && order.fulfilment !== 'DELIVERED' && (
                                        <button
                                            onClick={() => act(order._id, 'cancel')}
                                            disabled={busyId === order._id}
                                            className="text-xs border border-red-300 text-red-600 rounded px-3 py-1.5 ml-2 hover:bg-red-50 disabled:opacity-50">
                                            Cancel
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ===== BOTTOM SHEET: order details ===== */}
            <BottomSheet
                open={!!sheet && sheet.mode === 'details' && !!sheetOrder}
                onClose={() => setSheet(null)}
                title={sheetOrder ? `#${shortOrderId(sheetOrder._id)} · Details` : 'Details'}
            >
                {sheetOrder && (
                    <div className="space-y-3">
                        <div className="flex gap-3 items-center">
                            {sheetOrder.product?.image && (
                                <img src={sheetOrder.product.image} alt="" className="w-14 h-14 object-contain rounded-lg border bg-white" />
                            )}
                            <div className="min-w-0">
                                <p className="font-medium text-gray-900">{sheetOrder.product?.name}</p>
                                <p className="text-sm text-gray-500">
                                    Tk {sheetOrder.pricing?.sellingPrice?.toLocaleString()} × {bn(sheetOrder.pricing?.quantity)}
                                </p>
                            </div>
                        </div>

                        <div className="rounded-xl bg-gray-50 p-3 text-sm space-y-1">
                            <p className="font-semibold text-gray-900">{sheetOrder.customer?.name}</p>
                            <a href={`tel:${sheetOrder.customer?.phone}`} className="text-black font-medium flex items-center gap-1"><PhoneIcon sx={{ fontSize: '15px' }} />{sheetOrder.customer?.phone}</a>
                            <p className="text-gray-600">
                                {sheetOrder.customer?.address}{sheetOrder.customer?.area ? `, ${sheetOrder.customer.area}` : ''},
                                {' '}{sheetOrder.customer?.district}, {sheetOrder.customer?.division}
                            </p>
                        </div>

                        <div className="rounded-xl bg-gray-50 p-3 text-sm space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-white border text-gray-600">{sheetOrder.payment?.method}</span>
                                <span className="font-mono text-xs">{sheetOrder.payment?.transactionId}</span>
                                <button
                                    onClick={() => doCopy(sheetOrder.payment?.transactionId)}
                                    className="ml-auto text-xs bg-white border rounded px-2 py-1"
                                ><ContentCopyIcon sx={{ fontSize: '12px', verticalAlign: 'middle', marginRight: '3px' }} />Copy</button>
                            </div>
                            <p className="text-xs text-gray-600">
                                Advance (delivery): <b>Tk {bn(sheetOrder.delivery?.charge)}</b> · {zoneLabel(sheetOrder)}
                            </p>
                            <p className="text-xs text-gray-600">
                                Cash on delivery: <b>Tk {bn(codDue(sheetOrder).toLocaleString())}</b>
                            </p>
                            <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${
                                sheetOrder.payment?.verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                                {sheetOrder.payment?.verified ? (
                                    <span className="inline-flex items-center gap-1"><CheckIcon sx={{ fontSize: '13px' }} /> TrxID verified</span>
                                ) : (
                                    <span className="inline-flex items-center gap-1"><WarningAmberIcon sx={{ fontSize: '13px' }} /> TrxID pending</span>
                                )}
                            </span>
                        </div>

                        <div className="flex flex-wrap gap-1.5 items-center text-xs">
                            <span className={`p-1 px-2 font-medium rounded-full ${STATUS_STYLES[sheetOrder.status] || ''}`}>{sheetOrder.status}</span>
                            <span className={`p-1 px-2 font-medium rounded-full ${FULFILMENT_STYLES[sheetOrder.fulfilment] || ''}`}>
                                {FULFILMENT_LABELS[sheetOrder.fulfilment] || 'Placed'}
                            </span>
                            <span className="text-gray-400">{formatDate(sheetOrder.createdAt)}</span>
                        </div>
                        {sheetOrder.bkOrderId && <p className="text-xs text-gray-500 font-mono">BK order: {sheetOrder.bkOrderId}</p>}
                        {sheetOrder.bkError && <p className="text-xs text-red-500">{sheetOrder.bkError}</p>}

                        <div className="grid grid-cols-2 gap-2 pt-1">
                            <button
                                onClick={() => setSheet({ id: sheetOrder._id, mode: 'actions' })}
                                className="bg-black text-white rounded-xl py-2.5 text-sm font-semibold active:bg-gray-800"
                            >
                                <span className="inline-flex items-center justify-center gap-0.5">Update status<ChevronRightIcon sx={{ fontSize: '14px' }} /></span>
                            </button>
                            <a
                                href={waLink(sheetOrder.customer?.phone, `Inquiry about your order #${shortOrderId(sheetOrder._id)}`)}
                                target="_blank"
                                rel="noreferrer"
                                className="bg-green-50 text-green-700 border border-green-200 rounded-xl py-2.5 text-sm font-semibold text-center active:bg-green-100"
                            >
                                <WhatsAppIcon sx={{ fontSize: '16px' }} />
                                WhatsApp
                            </a>
                        </div>
                    </div>
                )}
            </BottomSheet>

            {/* ===== BOTTOM SHEET: status actions (one-tap stepper) ===== */}
            <BottomSheet
                open={!!sheet && sheet.mode === 'actions' && !!sheetOrder}
                onClose={() => setSheet(null)}
                title={sheetOrder ? `#${shortOrderId(sheetOrder._id)} · Status` : 'Status'}
            >
                {sheetOrder && (
                    <div className="space-y-4">
                        {/* fulfilment stepper */}
                        <div className="space-y-2">
                            {FULFILMENT_OPTIONS.map((key, idx) => {
                                const current = (sheetOrder.fulfilment || 'PLACED') === key;
                                const done = FULFILMENT_OPTIONS.indexOf(sheetOrder.fulfilment || 'PLACED') > idx;
                                return (
                                    <button
                                        key={key}
                                        onClick={() => updateStatus(sheetOrder._id, { fulfilment: key }, `Status → ${STEPPER_LABELS[key]}`)}
                                        disabled={busyId === sheetOrder._id}
                                        className={`w-full flex items-center gap-3 rounded-xl border px-3 py-3 text-sm font-medium transition disabled:opacity-50 ${
                                            current
                                                ? 'border-black bg-gray-100 text-black'
                                                : done
                                                    ? 'border-green-200 bg-green-50 text-green-700'
                                                    : 'border-gray-200 bg-white text-gray-700 active:bg-gray-50'
                                        }`}
                                    >
                                        <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                                            current ? 'bg-black text-white' : done ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                                        }`}>
                                            {done && !current ? <CheckIcon sx={{ fontSize: '14px' }} /> : bn(idx + 1)}
                                        </span>
                                        {STEPPER_LABELS[key]}
                                        {current && <span className="ml-auto text-xs">current</span>}
                                    </button>
                                );
                            })}
                        </div>

                        {/* TrxID verification toggle */}
                        <button
                            onClick={() => updateStatus(sheetOrder._id, { paymentVerified: !sheetOrder.payment?.verified }, sheetOrder.payment?.verified ? 'TrxID unverified' : 'TrxID verified')}
                            disabled={busyId === sheetOrder._id}
                            className={`w-full rounded-xl border px-3 py-3 text-sm font-semibold disabled:opacity-50 ${
                                sheetOrder.payment?.verified
                                    ? 'border-green-200 bg-green-50 text-green-700'
                                    : 'border-amber-200 bg-amber-50 text-amber-700'
                            }`}
                        >
                            {sheetOrder.payment?.verified ? (
                                <span className="inline-flex items-center gap-1"><CheckIcon sx={{ fontSize: '15px' }} /> TrxID verified — tap to undo</span>
                            ) : (
                                <span className="inline-flex items-center gap-1"><WarningAmberIcon sx={{ fontSize: '15px' }} /> Verify TrxID (advance payment)</span>
                            )}
                        </button>

                        <div className="grid grid-cols-2 gap-2">
                            {(sheetOrder.status === 'PENDING_APPROVAL' || sheetOrder.status === 'FORWARD_FAILED') && (
                                <button
                                    onClick={() => act(sheetOrder._id, 'approve')}
                                    disabled={busyId === sheetOrder._id}
                                    className="bg-green-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
                                >
                                    {sheetOrder.status === 'FORWARD_FAILED' ? 'Retry → BK' : 'Approve → BK'}
                                </button>
                            )}
                            {sheetOrder.status !== 'CANCELLED' && sheetOrder.fulfilment !== 'DELIVERED' && (
                                <button
                                    onClick={() => act(sheetOrder._id, 'cancel')}
                                    disabled={busyId === sheetOrder._id}
                                    className={`border border-red-300 text-red-600 rounded-xl py-2.5 text-sm font-semibold hover:bg-red-50 disabled:opacity-50 ${
                                        !(sheetOrder.status === 'PENDING_APPROVAL' || sheetOrder.status === 'FORWARD_FAILED') ? 'col-span-2' : ''
                                    }`}
                                >
                                    Cancel order
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </BottomSheet>
        </>
    );
};

export default StoreOrders;
