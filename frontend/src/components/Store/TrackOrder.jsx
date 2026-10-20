import { useState } from 'react';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import SearchIcon from '@mui/icons-material/Search';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import MetaData from '../Layouts/MetaData';

const FULFILMENT_STEPS = [
    { key: 'PLACED', label: 'Order Received' },
    { key: 'CONFIRMED', label: 'Confirmed' },
    { key: 'SHIPPED', label: 'Shipped' },
    { key: 'DELIVERED', label: 'Delivered' },
];

const STATUS_LABELS = {
    PENDING_APPROVAL: 'Pending Approval',
    APPROVED: 'Confirmed',
    // legacy statuses from before the Business Koro removal
    FORWARDED: 'Confirmed',
    FORWARD_FAILED: 'Issue — Contact Support',
    CANCELLED: 'Cancelled',
};

const Timeline = ({ current, cancelled }) => {
    const activeIndex = FULFILMENT_STEPS.findIndex((s) => s.key === current);
    return (
        <ol className="flex items-center gap-0 mt-3">
            {FULFILMENT_STEPS.map((step, i) => {
                const done = !cancelled && activeIndex >= i;
                return (
                    <li key={step.key} className="flex-1 flex flex-col items-center relative">
                        {i > 0 && (
                            <span className={`absolute top-[9px] right-1/2 w-full h-0.5 ${done && activeIndex >= i ? 'bg-primary-green' : 'bg-line'}`} />
                        )}
                        <span className={`relative z-10 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            done ? 'bg-primary-green border-primary-green' : cancelled ? 'bg-white border-slate-300' : 'bg-white border-slate-300'
                        }`}>
                            {done && <CheckCircleIcon sx={{ fontSize: '12px', color: '#fff' }} />}
                        </span>
                        <span className={`text-[9px] sm:text-[10px] mt-1 text-center leading-tight ${done ? 'text-primary-green font-semibold' : 'text-slate-400'}`}>
                            {step.label}
                        </span>
                    </li>
                );
            })}
        </ol>
    );
};

// Guest order tracking — no login needed: phone number or order id
const TrackOrder = () => {
    const { enqueueSnackbar } = useSnackbar();
    const [mode, setMode] = useState('phone');
    const [value, setValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [orders, setOrders] = useState(null);
    const [notFound, setNotFound] = useState('');

    const search = async (e) => {
        e.preventDefault();
        const q = value.trim();
        if (!q) return;

        setLoading(true);
        setNotFound('');
        setOrders(null);
        try {
            const params = mode === 'phone' ? { phone: q } : { orderId: q };
            const { data } = await axios.get('/api/v1/store/track', {
                params,
                headers: { Accept: 'application/json' },
            });
            setOrders(data.orders || []);
        } catch (err) {
            const msg = (err.response && err.response.data && err.response.data.message)
                || 'Something went wrong — please try again.';
            setNotFound(msg);
            if (err.response && err.response.status !== 404) enqueueSnackbar(msg, { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="w-full mt-4 md:mt-6 pb-24">
            <MetaData title="Track Order" description="Track your order by phone number or order group ID." />
            <div className="w-full sm:w-10/12 lg:w-6/12 mx-auto px-3 sm:px-4 flex flex-col gap-4">

                {/* search card */}
                <section className="surface p-4 sm:p-6">
                    <div className="flex items-center gap-2 mb-1">
                        <LocalShippingIcon sx={{ color: '#3b82f6' }} />
                        <h1 className="font-display font-bold text-lg sm:text-xl text-slate-900">Track Order</h1>
                    </div>
                    <p className="text-xs text-slate-500 mb-4">
                        Track your order by mobile number or order ID — no login required.
                    </p>

                    <form onSubmit={search} className="flex flex-col gap-3">
                        <RadioGroup
                            row
                            value={mode}
                            onChange={(e) => { setMode(e.target.value); setOrders(null); setNotFound(''); }}
                        >
                            <FormControlLabel value="phone" control={<Radio size="small" />} label="Mobile Number" className="mr-4" />
                            <FormControlLabel value="groupId" control={<Radio size="small" />} label="Order ID" />
                        </RadioGroup>

                        <div className="flex gap-2">
                            <input
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                inputMode={mode === 'phone' ? 'tel' : 'text'}
                                placeholder={mode === 'phone' ? 'e.g. 01712345678' : 'e.g. 8801712345678-4F2A'}
                                className="flex-1 min-w-0 input-field"
                            />
                            <button type="submit" disabled={loading} className="btn-accent px-4 py-2.5 text-sm font-semibold rounded-lg flex items-center gap-1.5 shrink-0 disabled:opacity-60">
                                <SearchIcon sx={{ fontSize: '18px' }} />
                                {loading ? 'Searching…' : 'Search'}
                            </button>
                        </div>
                    </form>

                    {notFound && (
                        <p className="mt-3 text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                            {notFound}
                        </p>
                    )}
                </section>

                {/* results */}
                {orders && orders.length > 0 && orders.map((group) => {
                    const cancelled = group.fulfilment === 'CANCELLED' || group.status === 'CANCELLED';
                    return (
                        <section key={group.groupId} className="surface p-4 sm:p-5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                    <p className="text-xxs uppercase tracking-widest text-slate-400 font-bold">Order ID</p>
                                    <p className="font-display font-semibold text-sm text-slate-900 break-all font-mono">{group.orderId || group.groupId}</p>
                                </div>
                                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                                    cancelled ? 'bg-red-50 text-red-500 border border-red-100'
                                        : group.fulfilment === 'DELIVERED' ? 'bg-green-50 text-green-700 border border-green-100'
                                            : 'bg-blue-50 text-primary-accent border border-blue-100'
                                }`}>
                                    {cancelled ? STATUS_LABELS.CANCELLED
                                        : group.fulfilment === 'DELIVERED' ? 'Delivered'
                                            : group.fulfilment === 'SHIPPED' ? 'Shipped'
                                                : group.fulfilment === 'CONFIRMED' ? 'Confirmed'
                                                    : STATUS_LABELS[group.status] || STATUS_LABELS.PENDING_APPROVAL}
                                </span>
                            </div>

                            <p className="text-[11px] text-slate-400 mt-1">
                                Order time: {new Date(group.placedAt).toLocaleString('en-BD', { dateStyle: 'medium', timeStyle: 'short' }) || new Date(group.placedAt).toLocaleString()}
                            </p>

                            <Timeline current={group.fulfilment} cancelled={cancelled} />

                            {/* items */}
                            <div className="mt-4 divide-y divide-line border-t border-line">
                                {group.items.map((item) => (
                                    <div key={item.orderId} className="flex items-center gap-3 py-2.5">
                                        {item.image && (
                                            <img src={item.image} alt={item.name} className="w-11 h-11 object-contain bg-white border border-line rounded-lg p-1" draggable="false" />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs sm:text-sm text-slate-800 font-medium line-clamp-1">{item.name}</p>
                                            <p className="text-[11px] text-slate-400">Qty: {item.quantity}</p>
                                        </div>
                                        <span className="font-extrabold text-sm text-slate-900">Tk {item.sellingPrice?.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>

                            {/* summary */}
                            <div className="mt-3 bg-cloud border border-line rounded-xl p-3 flex flex-col gap-1.5 text-xs">
                                <div className="flex justify-between text-slate-500">
                                    <span>Items Total</span><span>Tk {group.summary.itemsTotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-slate-500">
                                    <span>Delivery Charge</span><span>Tk {group.summary.deliveryCharge}</span>
                                </div>
                                <div className="flex justify-between font-bold text-slate-900 text-sm border-t border-line pt-1.5 mt-0.5">
                                    <span>Total</span><span>Tk {group.summary.grandTotal.toLocaleString()}</span>
                                </div>
                                <p className="text-[10px] text-slate-400 pt-1">
                                    Payment: {group.payment.method} {group.payment.verified ? <><CheckCircleIcon sx={{ fontSize: '11px', verticalAlign: 'middle' }} /> Verified</> : '(verifying)'} — Cash on Delivery
                                </p>
                            </div>
                        </section>
                    );
                })}

            </div>
        </main>
    );
};

export default TrackOrder;
