import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import MetaData from '../Layouts/MetaData';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RemoveShoppingCartIcon from '@mui/icons-material/RemoveShoppingCart';
import CheckIcon from '@mui/icons-material/Check';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PaymentsIcon from '@mui/icons-material/Payments';
import { emptyCart } from '../../actions/cartAction';

const DIVISIONS = [
    'Dhaka', 'Chattogram', 'Rajshahi', 'Khulna', 'Barishal', 'Sylhet', 'Rangpur', 'Mymensingh',
];

const Checkout = () => {

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();

    const { cartItems } = useSelector((state) => state.cart);

    const [config, setConfig] = useState({
        deliveryCharges: { insideDhaka: 70, outsideDhaka: 130 },
        payment: { methods: ['bKash', 'Nagad'], bKashNumber: '', nagadNumber: '' },
    });

    const [customer, setCustomer] = useState({ name: '', phone: '', address: '', division: '', district: '', area: '' });
    const [zone, setZone] = useState('inside-dhaka');
    const [method, setMethod] = useState('bKash');
    const [transactionId, setTransactionId] = useState('');
    const [placing, setPlacing] = useState(false);
    const [placedOrder, setPlacedOrder] = useState(null);
    const [copied, setCopied] = useState('');

    // one-tap copy of the payment number (mobile UX)
    const copyNumber = (num, label) => {
        if (!num) return;
        const done = () => {
            setCopied(label);
            enqueueSnackbar(`${label} number copied`, { variant: 'success' });
            setTimeout(() => setCopied(''), 1500);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(num).then(done).catch(() => { window.prompt('Copy number', num); });
        } else {
            window.prompt('Copy number', num);
        }
    };

    const deliveryCharge = zone === 'inside-dhaka'
        ? Number(config.deliveryCharges.insideDhaka) || 70
        : Number(config.deliveryCharges.outsideDhaka) || 130;

    const itemsTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    useEffect(() => {
        axios.get('/api/v1/store/config', { headers: { Accept: 'application/json' } })
            .then((res) => res.data && setConfig(res.data))
            .catch(() => { /* keep defaults */ });
    }, []);

    const setField = (key) => (e) => setCustomer({ ...customer, [key]: e.target.value });

    const submitHandler = async (e) => {
        e.preventDefault();

        if (cartItems.length === 0) {
            enqueueSnackbar('Your cart is empty.', { variant: 'error' });
            return;
        }
        if (transactionId.trim().length < 4) {
            enqueueSnackbar('Enter the Transaction ID (TrxID) you received.', { variant: 'error' });
            return;
        }

        setPlacing(true);
        try {
            const { data } = await axios.post('/api/v1/store/orders', {
                items: cartItems.map((item) => ({ productId: item.product, quantity: item.quantity })),
                customer,
                payment: { method, transactionId: transactionId.trim() },
                delivery: { zone },
            }, { headers: { 'Content-Type': 'application/json', Accept: 'application/json' } });

            setPlacedOrder(data);
            dispatch(emptyCart());
            enqueueSnackbar('Order placed!', { variant: 'success' });
        } catch (err) {
            const message = err.response?.data?.message || 'Could not place the order.';
            enqueueSnackbar(message, { variant: 'error' });
        } finally {
            setPlacing(false);
        }
    };

    // ── success screen ────────────────────────────────────────────────
    if (placedOrder) {
        return (
            <main className="w-full mt-4 md:mt-6 bg-cloud min-h-screen">
                <MetaData title="Order Placed" />
                <div className="w-11/12 sm:w-10/12 lg:w-6/12 m-auto my-10">
                    <div className="surface rounded-lg p-8 text-center">
                        <div className="mx-auto w-14 h-14 rounded-full bg-primary-accent/10 flex items-center justify-center text-primary-accent"><CheckCircleIcon sx={{ fontSize: '2rem' }} /></div>
                        <h1 className="font-display text-2xl font-semibold text-slate-900 mt-4">Thank you! Your order has been placed.</h1>
                        <p className="text-slate-500 mt-2">
                            Our team will verify your payment and forward your order to the store shortly.
                        </p>

                        <div className="mt-6 text-left border border-line rounded-lg divide-y divide-line">
                            <div className="flex justify-between px-4 py-3">
                                <span className="text-slate-500">Order ID</span>
                                <span className="font-medium text-slate-800">{placedOrder.groupId?.slice(0, 8).toUpperCase()}</span>
                            </div>
                            <div className="flex justify-between px-4 py-3">
                                <span className="text-slate-500">Items</span>
                                <span className="font-medium text-slate-800">Tk {placedOrder.summary?.itemsTotal?.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between px-4 py-3">
                                <span className="text-slate-500">Delivery charge (paid in advance)</span>
                                <span className="font-medium text-slate-800">Tk {placedOrder.summary?.deliveryCharge}</span>
                            </div>
                            <div className="flex justify-between px-4 py-3 text-lg">
                                <span className="font-medium text-slate-700">Total</span>
                                <span className="font-extrabold text-slate-900">Tk {placedOrder.summary?.grandTotal?.toLocaleString()}</span>
                            </div>
                        </div>

                        <p className="text-xs text-slate-500 mt-4">
                            Product price is <span className="font-medium text-slate-700">Cash on Delivery</span> — pay only when you receive it.
                        </p>

                        <div className="flex gap-3 mt-6 justify-center">
                            <button onClick={() => navigate('/')} className="btn-accent px-6 py-2.5 rounded-lg text-sm font-semibold">Continue Shopping</button>
                            <button onClick={() => navigate('/orders')} className="btn-ghost px-6 py-2.5 rounded-lg text-sm font-semibold border border-line">My Orders</button>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    if (cartItems.length === 0) {
        return (
            <main className="w-full mt-4 md:mt-6 bg-cloud min-h-screen">
                <MetaData title="Checkout" />
                <div className="w-11/12 sm:w-10/12 lg:w-6/12 m-auto my-10">
                    <div className="surface rounded-lg p-8 text-center">
                        <div className="mx-auto w-14 h-14 rounded-full bg-primary-accent/10 flex items-center justify-center text-primary-accent"><RemoveShoppingCartIcon sx={{ fontSize: '2rem' }} /></div>
                        <h1 className="font-display text-2xl font-semibold text-slate-900 mt-4">Your cart is empty</h1>
                        <p className="text-slate-500 mt-2 text-sm">Add products to your cart to continue.</p>
                        <button onClick={() => navigate('/products')} className="btn-accent px-6 py-2.5 rounded-lg text-sm font-semibold mt-5">Browse Products</button>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="w-full mt-4 md:mt-6 bg-cloud min-h-screen pb-28 lg:pb-10">
            <MetaData title="Checkout" />

            <div className="w-11/12 lg:w-10/12 xl:w-8/12 m-auto mt-4">
                <h1 className="font-display text-2xl font-semibold text-slate-900">Checkout</h1>
                <p className="text-slate-500 text-sm mt-1">No account needed — just fill in your details and place the order.</p>

                <form onSubmit={submitHandler} className="flex flex-col lg:flex-row gap-4 mt-5">

                    {/* ── left: form ── */}
                    <div className="flex-1 flex flex-col gap-4">

                        {/* contact */}
                        <section className="surface rounded-lg p-5">
                            <h2 className="font-display font-semibold text-slate-900 mb-4">1. Contact &amp; delivery address</h2>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-medium text-slate-500">Full name *</label>
                                    <input required value={customer.name} onChange={setField('name')} placeholder="Your name"
                                        className="border border-line rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary-accent" />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-medium text-slate-500">Mobile number *</label>
                                    <input required value={customer.phone} onChange={setField('phone')} placeholder="01712345678" inputMode="tel"
                                        className="border border-line rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary-accent" />
                                </div>
                                <div className="sm:col-span-2 flex flex-col gap-1">
                                    <label className="text-xs font-medium text-slate-500">Full address *</label>
                                    <input required value={customer.address} onChange={setField('address')} placeholder="House, road, area"
                                        className="border border-line rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary-accent" />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-medium text-slate-500">Division *</label>
                                    <select required value={customer.division} onChange={setField('division')}
                                        className="border border-line rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-primary-accent">
                                        <option value="">Select division</option>
                                        {DIVISIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-medium text-slate-500">District / city *</label>
                                    <input required value={customer.district} onChange={setField('district')} placeholder="e.g. Dhaka"
                                        className="border border-line rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary-accent" />
                                </div>
                                <div className="sm:col-span-2 flex flex-col gap-1">
                                    <label className="text-xs font-medium text-slate-500">Area / thana</label>
                                    <input value={customer.area} onChange={setField('area')} placeholder="e.g. Mirpur"
                                        className="border border-line rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary-accent" />
                                </div>
                            </div>

                            <div className="mt-5">
                                <label className="text-xs font-medium text-slate-500">Delivery zone *</label>
                                <div className="grid sm:grid-cols-2 gap-3 mt-2">
                                    {[['inside-dhaka', 'Inside Dhaka', config.deliveryCharges.insideDhaka], ['outside-dhaka', 'Outside Dhaka', config.deliveryCharges.outsideDhaka]].map(([value, label, charge]) => (
                                        <label key={value}
                                            className={`flex items-center justify-between border rounded-lg px-4 py-3 cursor-pointer text-sm ${zone === value ? 'border-primary-accent bg-primary-accent/5 text-slate-900' : 'border-line text-slate-600'}`}>
                                            <span className="flex items-center gap-2">
                                                <input type="radio" name="zone" value={value} checked={zone === value} onChange={() => setZone(value)} className="accent-blue-500" />
                                                {label}
                                            </span>
                                            <span className="font-semibold">Tk {charge}</span>
                                        </label>
                                    ))}
                                </div>
                                <p className="text-[11px] text-slate-500 mt-2">Delivery charge is paid in advance (bKash / Nagad send money). Product price is Cash on Delivery.</p>
                            </div>
                        </section>

                        {/* payment */}
                        <section className="surface rounded-lg p-5">
                            <h2 className="font-display font-semibold text-slate-900 mb-4">2. Advance payment &amp; TrxID</h2>

                            <div className="grid sm:grid-cols-2 gap-3">
                                {['bKash', 'Nagad'].map((m) => (
                                    <label key={m}
                                        className={`flex items-center justify-between border rounded-lg px-4 py-3 cursor-pointer text-sm ${method === m ? 'border-primary-accent bg-primary-accent/5 text-slate-900' : 'border-line text-slate-600'}`}>
                                        <span className="flex items-center gap-2">
                                            <input type="radio" name="method" checked={method === m} onChange={() => setMethod(m)} className="accent-blue-500" />
                                            {m} Send Money
                                        </span>
                                        <span className="font-semibold text-xs">
                                            Tk {deliveryCharge}
                                        </span>
                                    </label>
                                ))}
                            </div>

                            {/* step-by-step advance payment guide */}
                            <div className="mt-4 overflow-hidden rounded-xl border border-primary-accent/25 bg-gradient-to-br from-primary-accent/[0.08] to-primary-accent/[0.02]">
                                <div className="flex items-center gap-3 px-4 pt-4">
                                    <span className="w-9 h-9 rounded-xl bg-primary-accent text-white flex items-center justify-center shrink-0 shadow-sm">
                                        <PaymentsIcon sx={{ fontSize: '18px' }} />
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-slate-900">Pay the advance via {method}</p>
                                        <p className="text-xs text-slate-500">Delivery charge only — the product price is Cash on Delivery.</p>
                                    </div>
                                </div>

                                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 border-y border-line bg-white/70">
                                    <div className="px-4 py-3">
                                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Amount to send</p>
                                        <p className="text-xl font-extrabold text-slate-900 leading-tight">Tk {deliveryCharge}</p>
                                    </div>
                                    <div className="px-4 py-3 border-t sm:border-t-0 sm:border-l border-line flex items-center justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{method} number</p>
                                            <p className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-wide whitespace-nowrap leading-tight">
                                                {(method === 'bKash' ? config.payment.bKashNumber : config.payment.nagadNumber) || '—'}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => copyNumber(
                                                method === 'bKash' ? config.payment.bKashNumber : config.payment.nagadNumber,
                                                method
                                            )}
                                            className="btn-copy shrink-0"
                                            aria-label={`Copy ${method} number`}
                                        >
                                            {copied === method
                                                ? <><CheckIcon sx={{ fontSize: '14px', verticalAlign: 'middle', marginRight: '3px' }} />Copied</>
                                                : <><ContentCopyIcon sx={{ fontSize: '14px', verticalAlign: 'middle', marginRight: '3px' }} />Copy</>}
                                        </button>
                                    </div>
                                </div>

                                <ol className="px-4 py-3 flex flex-col gap-2">
                                    {[
                                        `Open ${method} and choose "Send Money".`,
                                        `Send Tk ${deliveryCharge} to the number shown above.`,
                                        'Copy the Transaction ID (TrxID) from the confirmation message and paste it below.',
                                    ].map((step, i) => (
                                        <li key={i} className="flex items-start gap-2.5 text-xs text-slate-600">
                                            <span className="mt-px w-5 h-5 rounded-full bg-primary-accent/10 text-primary-accent text-[11px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                                            <span className="leading-relaxed">{step}</span>
                                        </li>
                                    ))}
                                </ol>
                            </div>

                            <div className="flex flex-col gap-1 mt-4">
                                <label className="text-xs font-medium text-slate-500">Transaction ID (TrxID) *</label>
                                <input required value={transactionId} onChange={(e) => setTransactionId(e.target.value)} placeholder="e.g. 9HXA5TB1QC"
                                    className="border border-line rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary-accent" />
                                <p className="text-[11px] text-slate-500">Your order is placed immediately and forwarded to the store after verification.</p>
                            </div>
                        </section>
                    </div>

                    {/* ── right: summary ── */}
                    <aside className="w-full lg:w-96">
                        <div className="surface rounded-lg p-5 lg:sticky lg:top-20">
                            <h2 className="font-display font-semibold text-slate-900 mb-4">Order summary</h2>

                            <div className="flex flex-col gap-3 max-h-64 overflow-y-auto pr-1">
                                {cartItems.map((item) => (
                                    <div key={item.product} className="flex gap-3 items-center">
                                        <img src={item.image} alt={item.name} className="w-12 h-12 object-contain rounded border border-line bg-white" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-slate-700 line-clamp-1">{item.name}</p>
                                            <p className="text-xs text-slate-500">Qty {item.quantity}</p>
                                        </div>
                                        <span className="text-sm font-medium text-slate-800">Tk {(item.price * item.quantity).toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-dashed border-line my-4"></div>

                            <div className="flex flex-col gap-2 text-sm">
                                <div className="flex justify-between text-slate-600">
                                    <span>Item total (COD)</span>
                                    <span>Tk {itemsTotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-slate-600">
                                    <span>Delivery charge (advance)</span>
                                    <span>Tk {deliveryCharge}</span>
                                </div>
                                <div className="border-t border-dashed border-line my-1"></div>
                                <div className="flex justify-between items-center">
                                    <span className="font-medium text-slate-800">Pay now</span>
                                    <span className="text-lg font-extrabold text-slate-900">Tk {deliveryCharge}</span>
                                </div>
                                <div className="flex justify-between items-center text-slate-600">
                                    <span>On delivery</span>
                                    <span className="font-medium">Tk {itemsTotal.toLocaleString()}</span>
                                </div>
                            </div>

                            <button type="submit" disabled={placing}
                                className={`w-full mt-5 py-3 rounded-lg text-sm font-semibold hidden lg:flex items-center justify-center ${placing ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'btn-accent'}`}>
                                {placing ? 'Placing order…' : 'Place Order'}
                            </button>
                            <p className="text-[11px] text-slate-500 text-center mt-3">Guest order — no login required.</p>
                        </div>
                    </aside>

                    {/* ── mobile sticky place-order bar ── */}
                    <div
                        className="lg:hidden fixed left-0 right-0 z-30 border-t px-4 py-3 flex items-center justify-between gap-3"
                        style={{
                            bottom: 'calc(71px + env(safe-area-inset-bottom))',
                            backgroundColor: 'var(--color-surface)',
                            borderColor: 'var(--color-border)',
                            boxShadow: '0 -4px 16px rgba(0,0,0,0.08)',
                        }}
                    >
                        <div className="flex flex-col">
                            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Pay now (advance)</span>
                            <span className="font-bold text-base" style={{ color: 'var(--color-text-primary)' }}>Tk {deliveryCharge}</span>
                        </div>
                        <button type="submit" disabled={placing}
                            className={`px-6 py-2.5 rounded-lg text-sm font-semibold shrink-0 ${placing ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'btn-accent'}`}>
                            {placing ? 'Placing…' : 'Place Order'}
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
};

export default Checkout;
