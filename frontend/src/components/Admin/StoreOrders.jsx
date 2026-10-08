import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import MetaData from '../Layouts/MetaData';
import BackdropLoader from '../Layouts/BackdropLoader';
import { formatDate } from '../../utils/functions';

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
// selectable progression (Cancelled happens through the Cancel button)
const FULFILMENT_OPTIONS = ['PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];

// one-tap WhatsApp chat link for a BD phone number
const waLink = (phone) => {
    const digits = String(phone || '').replace(/\D/g, '');
    const intl = digits.startsWith('880') ? digits : `88${digits.replace(/^0/, '')}`;
    return `https://wa.me/${intl}`;
};

const StoreOrders = () => {

    const { enqueueSnackbar } = useSnackbar();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [busyId, setBusyId] = useState(null);
    const [syncing, setSyncing] = useState(false);

    const fetchOrders = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await axios.get('/api/v1/admin/store/orders', { headers: { Accept: 'application/json' } });
            setOrders(data.orders || []);
        } catch (err) {
            enqueueSnackbar(err.response?.data?.message || 'Failed to load store orders', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    }, [enqueueSnackbar]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const act = async (id, action) => {
        setBusyId(id);
        try {
            const { data } = await axios.put(`/api/v1/admin/store/orders/${id}/${action}`, {}, { headers: { Accept: 'application/json' } });
            enqueueSnackbar(action === 'approve'
                ? `Forwarded to Business Koro (order ${data.order?.bkOrderId || ''})`
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

    // Pending ➔ Confirmed ➔ Shipped ➔ Delivered + TrxID verification
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

    return (
        <>
            <MetaData title="Store Orders | TechBazar" />
            {(loading || syncing) && <BackdropLoader />}

            <div className="flex items-center justify-between gap-3 flex-wrap">
                <h1 className="text-lg font-medium uppercase">store orders (business koro)</h1>
                <div className="flex gap-2">
                    <button onClick={fetchOrders} className="text-sm border border-gray-300 rounded px-3 py-1.5 hover:bg-gray-100">Refresh</button>
                    <button onClick={syncCatalog} className="text-sm bg-primary-blue text-white rounded px-3 py-1.5 hover:bg-blue-700">Sync catalogue</button>
                </div>
            </div>

            <p className="text-sm text-gray-500 mt-1">
                Guest orders wait here until you approve them — approving forwards the order to the Business Koro API.
            </p>

            <div className="bg-white rounded-xl shadow-lg mt-4 overflow-x-auto">
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
                        {orders.length === 0 && (
                            <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No store orders yet.</td></tr>
                        )}
                        {orders.map((order) => (
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
                                            className="text-xs bg-blue-50 text-blue-700 rounded px-2 py-1 hover:bg-blue-100 font-medium">
                                            📞 Call
                                        </a>
                                        <a
                                            href={waLink(order.customer?.phone)}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-xs bg-green-50 text-green-700 rounded px-2 py-1 hover:bg-green-100 font-medium">
                                            💬 WhatsApp
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
                                        {order.payment?.verified ? '✓ Verified' : 'Verify TrxID'}
                                    </button>
                                </td>
                                <td className="px-4 py-3">
                                    <p className="font-medium">৳{order.pricing?.sellingPrice?.toLocaleString()} × {order.pricing?.quantity}</p>
                                    <p className="text-xs text-gray-500">Delivery ৳{order.delivery?.charge} ({order.delivery?.zone === 'inside-dhaka' ? 'in Dhaka' : 'outside'})</p>
                                    <p className="text-xs font-semibold text-yellow-600 mt-0.5">
                                        COD collect: ৳{((order.pricing?.sellingPrice || 0) * (order.pricing?.quantity || 0)).toLocaleString()}
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
        </>
    );
};

export default StoreOrders;
