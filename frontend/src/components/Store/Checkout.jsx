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
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import LockIcon from '@mui/icons-material/Lock';
import CloseIcon from '@mui/icons-material/Close';
import { emptyCart } from '../../actions/cartAction';
import { BD_DIVISIONS, getDistricts, getAreas } from '../../utils/bdLocations';
import { DEFAULT_SITE_CONFIG } from '../../utils/siteConfig';
import { useSiteConfig } from '../../context/SiteConfigContext';

// Payment-brand logos shown in the method picker + advance guide.
// The source images have square canvases, so each logo gets the frame that
// hides its natural white/transparent corners: Nagad is a circle (round mask),
// bKash a rounded pink square (pink background fills its transparent corners).
const PAYMENT_LOGOS = {
    bKash: { src: 'https://i.ibb.co.com/5g6fJw4V/b-Kash-Logo.png', shape: 'rounded-[10px]', bg: '#df146e' },
    Nagad: { src: 'https://i.ibb.co.com/zVR7XVjw/unnamed.webp', shape: 'rounded-[10px]', bg: '#ea2125' },
};

const LogoImg = ({ method, size = 'w-9 h-9' }) => {
    const logo = PAYMENT_LOGOS[method];
    if (!logo) return null;
    return (
        <span
            className={`${size} ${logo.shape} overflow-hidden shrink-0 flex items-center justify-center ring-1 ring-black/5`}
            style={{ backgroundColor: logo.bg }}
        >
            <img src={logo.src} alt={`${method} logo`} draggable="false" loading="lazy" className="w-full h-full object-cover" />
        </span>
    );
};

const Checkout = () => {

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();

    const { cartItems } = useSelector((state) => state.cart);

    const [config, setConfig] = useState({
        deliveryCharges: { insideDhaka: 70, outsideDhaka: 130 },
        payment: { methods: ['COD', 'bKash', 'Nagad'], bKashNumber: '', nagadNumber: '' },
    });

    const [customer, setCustomer] = useState({ name: '', phone: '', address: '', division: '', district: '', area: '' });
    // 'COD' (pay nothing now) is the default — it works even before the
    // bKash/Nagad numbers are configured and is what most buyers expect.
    const [method, setMethod] = useState('COD');
    const [transactionId, setTransactionId] = useState('');
    const [placing, setPlacing] = useState(false);
    const [placedOrder, setPlacedOrder] = useState(null);
    const [copied, setCopied] = useState('');
    // COD notice popup — Place Order shows this notice instead of ordering.
    const [showCodNotice, setShowCodNotice] = useState(false);

    // COD is admin-granted: the confirm button in the popup is unlocked only
    // for logged-in users the admin enabled (Admin → Users → COD toggle).
    // Admins always have access; guests and pending users never do.
    const { isAuthenticated, user } = useSelector((state) => state.user);
    const canCod = isAuthenticated && !!user && (user.role === 'admin' || user.codAllowed === true);

    const { config: siteConfig } = useSiteConfig();
    const support = siteConfig?.support || DEFAULT_SITE_CONFIG.support;
    // One-tap WhatsApp chat with the admin, pre-filled with a Bangla message.
    const codWhatsAppLink = `https://wa.me/${String(support?.whatsapp || '8801580831611').replace(/\D/g, '')}?text=${encodeURIComponent('আসসালামু আলাইকুম, আমি ক্যাশ অন ডেলিভারিতে (COD) অর্ডার করতে চাই। আমার জন্য COD অনুমোদন চালু করে দিয়েন প্লিজ।')}`;

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

    // ── auto delivery zone ─────────────────────────────────────────────
    // Derived from the selected district — never picked manually:
    //   Dhaka district → inside-dhaka  (Tk 70)
    //   any other      → outside-dhaka (Tk 130)
    // The Tk amounts come from the store settings in the database
    // (Admin → Homepage settings, served by /api/v1/store/config).
    const zone = customer.district && customer.district !== 'Dhaka' ? 'outside-dhaka' : 'inside-dhaka';
    const insideCharge = Number(config.deliveryCharges.insideDhaka) || 70;
    const outsideCharge = Number(config.deliveryCharges.outsideDhaka) || 130;
    const deliveryCharge = zone === 'inside-dhaka' ? insideCharge : outsideCharge;

    const bkashNumber = config.payment?.bKashNumber || '';
    const nagadNumber = config.payment?.nagadNumber || '';
    const bkashOrNagadAvailable = Boolean(bkashNumber || nagadNumber);

    const itemsTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const isCod = method === 'COD';
    // What the buyer hands over right now vs. when the parcel arrives.
    const payNow = isCod ? 0 : deliveryCharge;
    const onDelivery = isCod ? itemsTotal + deliveryCharge : itemsTotal;

    useEffect(() => {
        axios.get('/api/v1/store/config', { headers: { Accept: 'application/json' } })
            .then((res) => res.data && setConfig(res.data))
            .catch(() => { /* keep defaults */ });
    }, []);

    const setField = (key) => (e) => setCustomer({ ...customer, [key]: e.target.value });

    // Cascading Division → District → Area selects. Changing a level clears the
    // levels below it so the options always match the parent selection.
    // (The delivery zone follows the division automatically — see `zone` above.)
    const onDivisionChange = (e) => {
        const division = e.target.value;
        setCustomer((c) => ({ ...c, division, district: '', area: '' }));
    };

    const onDistrictChange = (e) => {
        const district = e.target.value;
        setCustomer((c) => ({ ...c, district, area: '' }));
    };

    const districts = getDistricts(customer.division);
    const areas = getAreas(customer.division, customer.district);

    const placeOrder = async () => {
        setPlacing(true);
        try {
            const { data } = await axios.post('/api/v1/store/orders', {
                items: cartItems.map((item) => ({ productId: item.product, quantity: item.quantity })),
                customer,
                payment: {
                    method,
                    // COD has no advance payment, hence no TrxID.
                    transactionId: isCod ? '' : transactionId.trim(),
                },
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

    const submitHandler = (e) => {
        e.preventDefault();

        if (cartItems.length === 0) {
            enqueueSnackbar('Your cart is empty.', { variant: 'error' });
            return;
        }
        if (!isCod && transactionId.trim().length < 4) {
            enqueueSnackbar('Enter the Transaction ID (TrxID) you received.', { variant: 'error' });
            return;
        }

        // COD: do NOT place the order yet — show the Bangla notice popup so
        // the buyer contacts the admin on WhatsApp and gets COD enabled first.
        if (isCod) {
            setShowCodNotice(true);
            return;
        }

        placeOrder();
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
                            {isCod
                                ? 'Pay nothing now — keep Tk ' + (placedOrder.summary?.grandTotal?.toLocaleString() ?? '') + ' ready for cash on delivery.'
                                : 'Our team will verify your payment and forward your order to the store shortly.'}
                        </p>

                        <div className="mt-6 text-left border border-line rounded-lg divide-y divide-line">
                            <div className="flex justify-between px-4 py-3">
                                <span className="text-slate-500">Order ID</span>
                                <span className="font-medium text-slate-800 font-mono">
                                    {placedOrder.orderId || placedOrder.groupId?.slice(0, 8).toUpperCase()}
                                </span>
                            </div>
                            <div className="flex justify-between px-4 py-3">
                                <span className="text-slate-500">Items</span>
                                <span className="font-medium text-slate-800">Tk {placedOrder.summary?.itemsTotal?.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between px-4 py-3">
                                <span className="text-slate-500">Delivery charge{isCod ? '' : ' (paid in advance)'}</span>
                                <span className="font-medium text-slate-800">Tk {placedOrder.summary?.deliveryCharge}</span>
                            </div>
                            <div className="flex justify-between px-4 py-3 text-lg">
                                <span className="font-medium text-slate-700">Total</span>
                                <span className="font-extrabold text-slate-900">Tk {placedOrder.summary?.grandTotal?.toLocaleString()}</span>
                            </div>
                        </div>

                        <p className="text-xs text-slate-500 mt-4">
                            {isCod
                                ? <>Everything — product price <span className="font-medium text-slate-700">and</span> delivery charge — is <span className="font-medium text-slate-700">Cash on Delivery</span>.</>
                                : <>Product price is <span className="font-medium text-slate-700">Cash on Delivery</span> — pay only when you receive it.</>}
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
                                    <select required value={customer.division} onChange={onDivisionChange}
                                        className="border border-line rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-primary-accent">
                                        <option value="">Select division</option>
                                        {BD_DIVISIONS.map((d) => <option key={d} value={d}>{d} Division</option>)}
                                    </select>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-medium text-slate-500">District *</label>
                                    <select required value={customer.district} onChange={onDistrictChange} disabled={!customer.division}
                                        className="border border-line rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-primary-accent disabled:bg-slate-50 disabled:text-slate-400">
                                        <option value="">{customer.division ? 'Select district' : 'Select division first'}</option>
                                        {districts.map((d) => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div className="sm:col-span-2 flex flex-col gap-1">
                                    <label className="text-xs font-medium text-slate-500">Area / thana</label>
                                    <select value={customer.area} onChange={setField('area')} disabled={!customer.district}
                                        className="border border-line rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-primary-accent disabled:bg-slate-50 disabled:text-slate-400">
                                        <option value="">{customer.district ? 'Select area / thana (optional)' : 'Select district first'}</option>
                                        {areas.map((a) => <option key={a} value={a}>{a}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="mt-5">
                                <label className="text-xs font-medium text-slate-500">Delivery zone (auto-detected)</label>
                                <div className="mt-2 flex items-center justify-between gap-3 border border-primary-accent/30 bg-primary-accent/[0.05] rounded-lg px-4 py-3">
                                    <span className="flex items-center gap-2 text-sm font-medium text-slate-800">
                                        {customer.district ? (
                                            <>
                                                <CheckIcon sx={{ fontSize: '16px', color: 'var(--color-accent)' }} />
                                                <span>{zone === 'inside-dhaka' ? 'Inside Dhaka' : 'Outside Dhaka'}</span>
                                                <span className="text-[11px] font-normal text-slate-500">— set from your district</span>
                                            </>
                                        ) : (
                                            <span className="font-normal text-slate-500">Select your district above — the zone is detected automatically.</span>
                                        )}
                                    </span>
                                    <span className="whitespace-nowrap text-sm font-semibold text-slate-900">
                                        {customer.district ? `Tk ${deliveryCharge}` : `Tk ${insideCharge} / ${outsideCharge}`}
                                    </span>
                                </div>
                                <p className="text-[11px] text-slate-500 mt-2">
                                    Dhaka District → Tk {insideCharge} · Any other District → Tk {outsideCharge} (charges from store settings).
                                </p>
                                <p className="text-[11px] text-slate-500 mt-1">
                                    {isCod
                                        ? <>Product price <span className="font-medium text-slate-700">and</span> delivery charge are paid in cash on delivery.</>
                                        : <>Delivery charge is paid in advance (bKash / Nagad send money). Product price is Cash on Delivery.</>}
                                </p>
                            </div>
                        </section>

                        {/* payment */}
                        <section className="surface rounded-lg p-5">
                            <h2 className="font-display font-semibold text-slate-900 mb-4">2. Payment method</h2>

                            <div className={`grid gap-3 ${bkashOrNagadAvailable ? 'sm:grid-cols-3' : ''}`}>
                                {[
                                    { value: 'COD', label: 'Cash on Delivery', note: 'Pay Tk 0 now' },
                                    bkashNumber && { value: 'bKash', label: 'bKash', note: `Tk ${deliveryCharge} advance`, logo: true },
                                    nagadNumber && { value: 'Nagad', label: 'Nagad', note: `Tk ${deliveryCharge} advance`, logo: true },
                                ].filter(Boolean).map((option) => (
                                    <label key={option.value}
                                        className={`flex items-start gap-2.5 border rounded-lg px-4 py-3 cursor-pointer text-sm ${method === option.value ? 'border-primary-accent bg-primary-accent/5 text-slate-900' : 'border-line text-slate-600'}`}>
                                        <input type="radio" name="method" checked={method === option.value} onChange={() => { setMethod(option.value); setTransactionId(''); }} className="accent-blue-500 mt-2.5 shrink-0" />
                                        {option.logo ? (
                                            <LogoImg method={option.value} />
                                        ) : (
                                            <span className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 ${method === option.value ? 'bg-primary-accent/10 text-primary-accent' : 'bg-slate-100 text-slate-500'}`}>
                                                <PaymentsIcon sx={{ fontSize: '20px' }} />
                                            </span>
                                        )}
                                        <span className="leading-tight pt-1">{option.label}<br /><span className="text-[11px] text-slate-500">{option.note}</span></span>
                                    </label>
                                ))}
                            </div>

                            {!isCod && (
                                <>
                                    {/* step-by-step advance payment guide */}
                                    <div className="mt-4 overflow-hidden rounded-xl border border-primary-accent/25 bg-gradient-to-br from-primary-accent/[0.08] to-primary-accent/[0.02]">
                                        <div className="flex items-center gap-3 px-4 pt-4">
                                            {method === 'Nagad' || method === 'bKash' ? (
                                                <LogoImg method={method} />
                                            ) : (
                                                <span className="w-9 h-9 rounded-xl bg-primary-accent text-white flex items-center justify-center shrink-0 shadow-sm">
                                                    <PaymentsIcon sx={{ fontSize: '18px' }} />
                                                </span>
                                            )}
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
                                                        {(method === 'bKash' ? bkashNumber : nagadNumber) || '—'}
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => copyNumber(
                                                        method === 'bKash' ? bkashNumber : nagadNumber,
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
                                </>
                            )}

                            {isCod && (
                                <div className="mt-4 flex items-start gap-3 rounded-xl border border-line bg-primary-accent/[0.04] px-4 py-3">
                                    <PaymentsIcon sx={{ fontSize: '18px', color: 'var(--color-accent)' }} className="mt-0.5 shrink-0" />
                                    <p className="text-xs text-slate-600 leading-relaxed">
                                        Nothing to pay now — hand over <span className="font-semibold text-slate-800">Tk {onDelivery.toLocaleString()}</span> (items + delivery) in cash when the order arrives.
                                        <span className="block mt-1">COD অর্ডারের জন্য অ্যাডমিনের অনুমোদন লাগে — Place Order চাপলে নোটিশ দেখাবে। অ্যাডমিন আপনার জন্য COD চালু করলে তবেই অর্ডার করা যাবে।</span>
                                    </p>
                                </div>
                            )}
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
                                    <span>Item total</span>
                                    <span>Tk {itemsTotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-slate-600">
                                    <span>Delivery charge{!isCod ? ' (advance)' : ''}</span>
                                    <span>Tk {deliveryCharge}</span>
                                </div>
                                <div className="border-t border-dashed border-line my-1"></div>
                                <div className="flex justify-between items-center">
                                    <span className="font-medium text-slate-800">Pay now</span>
                                    <span className="text-lg font-extrabold text-slate-900">Tk {payNow.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-slate-600">
                                    <span>On delivery</span>
                                    <span className="font-medium">Tk {onDelivery.toLocaleString()}</span>
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
                            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{isCod ? 'Pay on delivery' : 'Pay now (advance)'}</span>
                            <span className="font-bold text-base" style={{ color: 'var(--color-text-primary)' }}>Tk {payNow.toLocaleString()}</span>
                        </div>
                        <button type="submit" disabled={placing}
                            className={`px-6 py-2.5 rounded-lg text-sm font-semibold shrink-0 ${placing ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'btn-accent'}`}>
                            {placing ? 'Placing…' : 'Place Order'}
                        </button>
                    </div>
                </form>

                {/* ── COD notice popup ───────────────────────────────────────
                    COD runs on trust: we pay delivery from our own pocket and
                    hand the parcel over. If the buyer refuses/returns it, we
                    eat the delivery loss — so COD is unlocked per user by the
                    admin (Admin → Users → COD toggle), and this popup explains
                    that BEFORE any COD order is recorded. */}
                {showCodNotice && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        style={{ backgroundColor: 'rgba(15,23,42,0.55)' }}
                        onClick={() => setShowCodNotice(false)}
                        role="dialog"
                        aria-modal="true"
                    >
                        <div
                            className="bg-white rounded-2xl w-full max-w-md p-6 relative shadow-2xl max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                type="button"
                                onClick={() => setShowCodNotice(false)}
                                aria-label="Close"
                                className="absolute right-4 top-4 p-1 text-slate-400 hover:text-slate-600 flex items-center justify-center rounded-full hover:bg-slate-100"
                            >
                                <CloseIcon sx={{ fontSize: '20px' }} />
                            </button>

                            <div className="flex items-center gap-3 pr-6">
                                <span className="w-11 h-11 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                    <WhatsAppIcon sx={{ fontSize: '22px', color: '#25D366' }} />
                                </span>
                                <h3 className="font-display text-[15px] font-bold text-slate-900 whitespace-nowrap">
                                    ক্যাশ অন ডেলিভারি (COD) — নোটিশ
                                </h3>
                            </div>

                            <p className="text-sm text-slate-700 leading-relaxed mt-4">
                                প্রিয় গ্রাহক, ক্যাশ অন ডেলিভারিতে অর্ডার করতে হলে <span className="font-semibold">অ্যাডমিনের বিশেষ অনুমোদন</span> প্রয়োজন। নিচের বাটনে ক্লিক করে অ্যাডমিনের সাথে WhatsApp-এ যোগাযোগ করুন।
                            </p>

                            <ul className="mt-3 flex flex-col gap-2 text-[13px] text-slate-600">
                                <li className="flex gap-2">
                                    <span className="text-primary-accent font-bold shrink-0">•</span>
                                    <span>ডেলিভারি খরচ আমরা নিজের পকেট থেকে দিয়ে পণ্য আপনার ঠিকানায় পৌঁছে দিই।</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-primary-accent font-bold shrink-0">•</span>
                                    <span>পণ্য না নিয়ে অর্ডার ক্যান্সেল বা ফেরত দিলে আমাদের ডেলিভারি খরচ ক্ষতি হয়।</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-primary-accent font-bold shrink-0">•</span>
                                    <span>তাই অ্যাডমিন আপনাকে যাচাই করে আপনার জন্য COD চালু করে দিলে তবেই এই বাটন দিয়ে অর্ডার করতে পারবেন।</span>
                                </li>
                            </ul>

                            <a
                                href={codWhatsAppLink}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-5 w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold text-white"
                                style={{ backgroundColor: '#25D366' }}
                            >
                                <WhatsAppIcon sx={{ fontSize: '18px', color: '#fff' }} />
                                WhatsApp-এ অ্যাডমিনকে জানান
                            </a>

                            {/* Lock state — only the admin can unlock COD, per user
                                (Admin → Users → COD toggle). Guests & pending users
                                see the locked button + WhatsApp hint. */}
                            {!canCod && (
                                <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-3 text-[13px] text-amber-800 leading-relaxed">
                                    <LockIcon sx={{ fontSize: '16px', color: '#b45309' }} className="mt-0.5 shrink-0" />
                                    <span>
                                        আপনার জন্য COD এখনো অনুমোদিত নয়। অ্যাডমিনের সাথে WhatsApp-এ কথা বলুন — অ্যাডমিন আপনার জন্য COD চালু করলে এই বাটন অটো আনলক হবে।
                                        {!isAuthenticated && ' অর্ডার করার সময় আপনার অ্যাকাউন্টে লগইন থাকতে হবে।'}
                                    </span>
                                </div>
                            )}
                            {canCod && (
                                <p className="mt-4 flex items-center gap-1.5 text-[13px] text-green-700 font-medium">
                                    <CheckCircleIcon sx={{ fontSize: '16px', color: '#15803d' }} />
                                    আপনার অ্যাকাউন্টে COD অনুমোদিত — নিশ্চিত করলেই অর্ডার হবে।
                                </p>
                            )}

                            <div className="flex gap-3 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCodNotice(false)}
                                    className="flex-1 py-2.5 rounded-lg text-sm font-semibold border border-line text-slate-600 hover:bg-slate-50"
                                >
                                    ফিরে যান
                                </button>
                                <button
                                    type="button"
                                    disabled={!canCod}
                                    onClick={() => { setShowCodNotice(false); placeOrder(); }}
                                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold inline-flex items-center justify-center gap-1.5 ${canCod ? 'btn-accent' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                                >
                                    {canCod ? 'COD অর্ডার নিশ্চিতকরুন' : <><LockIcon sx={{ fontSize: '15px' }} /> COD অনুমোদিত নেই</>}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
};

export default Checkout;
