import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import { clearErrors, getOrderDetails } from '../../actions/orderAction';
import Loader from '../Layouts/Loader';
import TrackStepper from './TrackStepper';
import MetaData from '../Layouts/MetaData';
import { useSiteConfig } from '../../context/SiteConfigContext';
import { DEFAULT_SITE_CONFIG } from '../../utils/siteConfig';
import { downloadInvoice } from '../../utils/invoicePdf';
import { formatDate } from '../../utils/functions';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import DownloadIcon from '@mui/icons-material/Download';
import PrintIcon from '@mui/icons-material/Print';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PersonIcon from '@mui/icons-material/Person';
import PaymentIcon from '@mui/icons-material/Payment';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AutorenewIcon from '@mui/icons-material/Autorenew';

const statusConfig = {
    Delivered: { bg: '#dcfce7', fg: '#16a34a', label: 'Delivered' },
    Shipped: { bg: '#fef3c7', fg: '#b45309', label: 'Shipped' },
    Processing: { bg: '#dbeafe', fg: '#1d4ed8', label: 'Processing' },
};

const money = (n) => `Tk ${Number(n || 0).toLocaleString()}`;

// ── Invoice palette ────────────────────────────────────────────────────────
// Deliberately softer than the storefront's peachy --color-bg fill: the
// invoice reads as a document, so panels sit on near-white tints while the
// accent is reserved for the things that actually need attention.
const INK = '#2D1B0E';          // --color-text-primary
const SOFT_LINE = '#F0E2D6';    // hairlines — lighter than --color-border
const PANEL = '#FFFBF7';        // near-white panel fill
const PANEL_ALT = '#FDF3EC';    // slightly warmer alternate row
const ACCENT_SOFT = '#FFF4EC';  // faint accent wash

// One cell of the invoice meta strip.
const MetaCell = ({ label, value, accent }) => (
    <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
            {label}
        </span>
        <span className="text-xs sm:text-sm font-bold truncate" style={{ color: accent || 'var(--color-text-primary)' }}>
            {value}
        </span>
    </div>
);

const OrderDetails = () => {
    const dispatch = useDispatch();
    const { enqueueSnackbar } = useSnackbar();
    const params = useParams();
    const { order, error, loading } = useSelector((state) => state.orderDetails);
    const { config } = useSiteConfig();
    const [downloading, setDownloading] = useState(false);

    const branding = config?.branding || DEFAULT_SITE_CONFIG.branding;
    const support = config?.support || DEFAULT_SITE_CONFIG.support;
    const seo = config?.seo || DEFAULT_SITE_CONFIG.seo;
    const footer = config?.content?.footer || DEFAULT_SITE_CONFIG.content?.footer || {};

    // Small brand mark (square) — the favicon reads best at this size; fall
    // back to the wide logo, then to a monogram, if neither is configured.
    const brandMark = branding.faviconUrl || branding.logoUrl;

    useEffect(() => {
        if (error) {
            enqueueSnackbar(error, { variant: 'error' });
            dispatch(clearErrors());
        }
        dispatch(getOrderDetails(params.id));
    }, [dispatch, error, params.id, enqueueSnackbar]);

    const handleDownload = async () => {
        if (!order) return;
        setDownloading(true);
        try {
            await downloadInvoice(order, {
                brandName: branding.name,
                brandTagline: branding.tagline,
                logoUrl: branding.faviconUrl || branding.logoUrl,
                siteUrl: seo.siteUrl || window.location.origin,
                hotline: support.hotline,
                whatsapp: support.whatsapp,
                email: footer.email || support.email,
            });
            enqueueSnackbar('Invoice downloaded', { variant: 'success' });
        } catch (e) {
            enqueueSnackbar('Could not create the PDF', { variant: 'error' });
        } finally {
            setDownloading(false);
        }
    };

    const handlePrint = () => window.print();

    const items = order?.orderItems || [];
    const itemsSubtotal = items.reduce((s, i) => s + (i.quantity || 1) * (i.price || 0), 0);
    const total = Number(order?.totalPrice || 0);
    const shipping = Math.max(0, total - itemsSubtotal);
    const totalQty = items.reduce((s, i) => s + (i.quantity || 1), 0);
    const cfg = statusConfig[order?.orderStatus] || statusConfig.Processing;
    const invoiceNo = order?.orderId || `#${String(order?._id || '').slice(-8).toUpperCase()}`;

    return (
        <>
            <MetaData title={`Invoice ${invoiceNo}`} />
            <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
                {/* print-only overrides: strip chrome so the printed sheet is clean */}
                <style>{`
                    @media print {
                        header, footer, nav, .no-print { display: none !important; }
                        body { background: #fff !important; }
                        .invoice-sheet { box-shadow: none !important; border: none !important; }
                    }
                `}</style>

                <div className="mx-auto max-w-4xl px-3 sm:px-6 py-5 sm:py-6 pb-16">

                    {/* ── Toolbar ── */}
                    <div className="no-print flex items-center justify-between gap-2 mb-4">
                        <Link
                            to="/orders"
                            className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors hover:underline"
                            style={{ color: 'var(--color-accent)' }}
                        >
                            <ArrowBackIcon sx={{ fontSize: 18 }} /> My Orders
                        </Link>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handlePrint}
                                disabled={!order}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all duration-150 disabled:opacity-50"
                                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-secondary)' }}
                                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.color = 'var(--color-accent)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
                            >
                                <PrintIcon sx={{ fontSize: 17 }} /> Print
                            </button>
                            <button
                                type="button"
                                onClick={handleDownload}
                                disabled={!order || downloading}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white transition-all duration-150 disabled:opacity-60"
                                style={{ backgroundColor: 'var(--color-accent)' }}
                                onMouseEnter={(e) => { if (!downloading) e.currentTarget.style.backgroundColor = 'var(--color-accent-hover)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-accent)'; }}
                            >
                                <DownloadIcon sx={{ fontSize: 17 }} />
                                {downloading ? 'Preparing…' : 'Download PDF'}
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <Loader />
                    ) : order && order.shippingInfo ? (
                        <div
                            className="invoice-sheet overflow-hidden"
                            style={{
                                backgroundColor: 'var(--color-surface)',
                                border: '1px solid var(--color-border)',
                                borderRadius: 'var(--card-radius)',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                            }}
                        >
                            {/* ══ Invoice header ══ */}
                            <div className="relative px-4 sm:px-7 pt-6 pb-5" style={{ background: `linear-gradient(135deg, ${ACCENT_SOFT} 0%, #FFFFFF 55%)` }}>
                                <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: 'linear-gradient(90deg, var(--color-accent) 0%, var(--accent-dark) 55%, var(--color-accent) 100%)' }} />

                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div className="flex items-center gap-3 min-w-0">
                                        {brandMark ? (
                                            <span
                                                className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0 overflow-hidden ring-1 ring-black/5"
                                                style={{ background: 'linear-gradient(135deg, #FFF4EC 0%, #FFE9DA 100%)' }}
                                            >
                                                <img
                                                    src={brandMark}
                                                    alt={branding.name}
                                                    className="h-8 w-8 object-contain"
                                                    draggable="false"
                                                />
                                            </span>
                                        ) : (
                                            <span
                                                className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0 text-white font-extrabold text-lg shadow-sm"
                                                style={{ background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent-hover))' }}
                                            >
                                                {(branding.name || 'S').charAt(0).toUpperCase()}
                                            </span>
                                        )}
                                        <div className="min-w-0">
                                            <h1 className="font-display font-extrabold text-lg sm:text-xl leading-tight truncate" style={{ color: 'var(--color-text-primary)' }}>
                                                {branding.name}
                                            </h1>
                                            {branding.tagline && (
                                                <p className="text-[11px] sm:text-xs line-clamp-1" style={{ color: 'var(--color-text-muted)' }}>
                                                    {branding.tagline}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="text-right shrink-0">
                                        <p className="font-display font-extrabold text-xl sm:text-2xl leading-none" style={{ color: 'var(--color-accent)' }}>
                                            INVOICE
                                        </p>
                                        <p className="text-[10px] sm:text-[11px] mt-1" style={{ color: 'var(--color-text-muted)' }}>
                                            Thank you for shopping with us
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* ══ Meta strip ══ */}
                            <div
                                className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 px-4 sm:px-7 py-4"
                                style={{ backgroundColor: PANEL, borderTop: `1px solid ${SOFT_LINE}`, borderBottom: `1px solid ${SOFT_LINE}` }}
                            >
                                <MetaCell label="Invoice No." value={invoiceNo} />
                                <MetaCell label="Order Date" value={formatDate(order.createdAt)} />
                                <MetaCell label="Payment" value={order.paidAt ? 'Paid' : (order.paymentMethod || 'COD')} />
                                <div className="flex flex-col gap-1 min-w-0">
                                    <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                                        Status
                                    </span>
                                    <span
                                        className="inline-flex items-center gap-1 self-start px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap"
                                        style={{ backgroundColor: cfg.bg, color: cfg.fg }}
                                    >
                                        {order.orderStatus}
                                    </span>
                                </div>
                            </div>

                            {/* ══ Billed to + Order info ══ */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 px-4 sm:px-7 py-5">
                                {/* Billed to */}
                                <div className="rounded-xl p-3.5 sm:p-4" style={{ backgroundColor: PANEL, border: `1px solid ${SOFT_LINE}` }}>
                                    <h3 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider mb-2.5" style={{ color: 'var(--color-accent)' }}>
                                        <PersonIcon sx={{ fontSize: 14 }} /> Billed To
                                    </h3>
                                    <p className="font-bold text-sm mb-1" style={{ color: 'var(--color-text-primary)' }}>
                                        {order.user?.name || order.shippingInfo.fullName || 'Customer'}
                                    </p>
                                    <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                                        {order.shippingInfo.address}
                                        <br />
                                        {[order.shippingInfo.city, order.shippingInfo.state].filter(Boolean).join(', ')}
                                        {order.shippingInfo.pincode ? ` - ${order.shippingInfo.pincode}` : ''}
                                        <br />
                                        {order.shippingInfo.country || 'Bangladesh'}
                                    </p>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2.5 pt-2.5 border-t" style={{ borderColor: 'var(--color-border)' }}>
                                        {order.shippingInfo.phoneNo && (
                                            <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                                                <PhoneIcon sx={{ fontSize: 14, color: 'var(--color-accent)' }} /> {order.shippingInfo.phoneNo}
                                            </span>
                                        )}
                                        {order.user?.email && (
                                            <span className="inline-flex items-center gap-1.5 text-xs break-all" style={{ color: 'var(--color-text-secondary)' }}>
                                                <EmailIcon sx={{ fontSize: 14, color: 'var(--color-accent)' }} /> {order.user.email}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Order info */}
                                <div className="rounded-xl p-3.5 sm:p-4" style={{ backgroundColor: PANEL, border: `1px solid ${SOFT_LINE}` }}>
                                    <h3 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider mb-2.5" style={{ color: 'var(--color-accent)' }}>
                                        <ReceiptLongIcon sx={{ fontSize: 14 }} /> Order Info
                                    </h3>
                                    <dl className="flex flex-col gap-2">
                                        {[
                                            { icon: <CalendarTodayIcon sx={{ fontSize: 13 }} />, k: 'Placed on', v: formatDate(order.createdAt) },
                                            { icon: <Inventory2Icon sx={{ fontSize: 13 }} />, k: 'Items', v: `${totalQty} pcs` },
                                            { icon: <PaymentIcon sx={{ fontSize: 13 }} />, k: 'Method', v: order.paymentMethod || 'COD' },
                                            {
                                                icon: order.paidAt ? <CheckCircleIcon sx={{ fontSize: 13 }} /> : <AutorenewIcon sx={{ fontSize: 13 }} />,
                                                k: 'Payment status',
                                                v: order.paidAt ? `Paid on ${formatDate(order.paidAt)}` : 'Pay on delivery',
                                            },
                                        ].map((r) => (
                                            <div key={r.k} className="flex items-center justify-between gap-3 text-xs">
                                                <span className="inline-flex items-center gap-1.5 shrink-0" style={{ color: 'var(--color-text-muted)' }}>
                                                    <span style={{ color: 'var(--color-accent)' }}>{r.icon}</span> {r.k}
                                                </span>
                                                <span className="font-semibold text-right truncate" style={{ color: 'var(--color-text-primary)' }}>{r.v}</span>
                                            </div>
                                        ))}
                                    </dl>
                                </div>
                            </div>

                            {/* ══ Items table ══ */}
                            <div className="px-4 sm:px-7">
                                <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${SOFT_LINE}` }}>
                                    {/* head */}
                                    <div className="hidden sm:grid grid-cols-12 gap-2 px-3.5 py-2.5 text-[10px] font-bold uppercase tracking-wider" style={{ backgroundColor: PANEL_ALT, color: 'var(--color-text-secondary)', borderBottom: `1px solid ${SOFT_LINE}` }}>
                                        <span className="col-span-6">Description</span>
                                        <span className="col-span-2 text-right">Qty</span>
                                        <span className="col-span-2 text-right">Unit Price</span>
                                        <span className="col-span-2 text-right">Amount</span>
                                    </div>

                                    {items.map((item, idx) => (
                                        <div
                                            key={item._id || idx}
                                            className="grid grid-cols-12 gap-2 px-3.5 py-3 items-center transition-colors"
                                            style={{
                                                backgroundColor: idx % 2 === 1 ? PANEL_ALT : 'var(--color-surface)',
                                                borderTop: idx === 0 ? 'none' : `1px solid ${SOFT_LINE}`,
                                            }}
                                        >
                                            {/* product */}
                                            <div className="col-span-12 sm:col-span-6 flex items-center gap-3 min-w-0">
                                                <div
                                                    className="w-12 h-12 rounded-lg overflow-hidden shrink-0 flex items-center justify-center"
                                                    style={{ backgroundColor: '#FFFFFF', border: `1px solid ${SOFT_LINE}` }}
                                                >
                                                    {item.image ? (
                                                        <img draggable="false" src={item.image} alt={item.name} className="h-full w-full object-contain p-1" />
                                                    ) : (
                                                        <Inventory2Icon sx={{ fontSize: 18, color: 'var(--color-text-muted)' }} />
                                                    )}
                                                </div>
                                                <p className="text-xs sm:text-sm font-semibold line-clamp-2 min-w-0" style={{ color: 'var(--color-text-primary)' }}>
                                                    {item.name}
                                                </p>
                                            </div>

                                            {/* qty */}
                                            <div className="col-span-4 sm:col-span-2 text-left sm:text-right">
                                                <span className="sm:hidden text-[10px] uppercase tracking-wider block" style={{ color: 'var(--color-text-muted)' }}>Qty</span>
                                                <span className="text-xs sm:text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{item.quantity}</span>
                                            </div>

                                            {/* unit */}
                                            <div className="col-span-4 sm:col-span-2 text-left sm:text-right">
                                                <span className="sm:hidden text-[10px] uppercase tracking-wider block" style={{ color: 'var(--color-text-muted)' }}>Unit</span>
                                                <span className="text-xs sm:text-sm" style={{ color: 'var(--color-text-secondary)' }}>{money(item.price)}</span>
                                            </div>

                                            {/* amount */}
                                            <div className="col-span-4 sm:col-span-2 text-left sm:text-right">
                                                <span className="sm:hidden text-[10px] uppercase tracking-wider block" style={{ color: 'var(--color-text-muted)' }}>Amount</span>
                                                <span className="text-xs sm:text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                                                    {money((item.quantity || 1) * (item.price || 0))}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* ══ Progress + Totals ══ */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 px-4 sm:px-7 py-5">
                                {/* progress */}
                                <div>
                                    <h3 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--color-accent)' }}>
                                        <LocalShippingIcon sx={{ fontSize: 14 }} /> Order Progress
                                    </h3>
                                    <TrackStepper
                                        orderOn={order.createdAt}
                                        shippedAt={order.shippedAt}
                                        deliveredAt={order.deliveredAt}
                                        activeStep={order.orderStatus === 'Delivered' ? 2 : order.orderStatus === 'Shipped' ? 1 : 0}
                                    />
                                </div>

                                {/* totals */}
                                <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${SOFT_LINE}` }}>
                                    <div className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider" style={{ backgroundColor: PANEL_ALT, color: 'var(--color-text-secondary)', borderBottom: `1px solid ${SOFT_LINE}` }}>
                                        Price Details
                                    </div>
                                    <div className="px-4 py-3 flex flex-col gap-2.5">
                                        <div className="flex items-center justify-between text-sm">
                                            <span style={{ color: 'var(--color-text-secondary)' }}>Subtotal ({totalQty} pcs)</span>
                                            <span className="font-semibold" style={{ color: INK }}>{money(itemsSubtotal)}</span>
                                        </div>
                                        {shipping > 0 && (
                                            <div className="flex items-center justify-between text-sm">
                                                <span style={{ color: 'var(--color-text-secondary)' }}>Delivery charge</span>
                                                <span className="font-semibold" style={{ color: INK }}>{money(shipping)}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between pt-2.5 border-t" style={{ borderColor: SOFT_LINE }}>
                                            <span className="text-sm font-bold" style={{ color: INK }}>Grand Total</span>
                                            <span
                                                className="text-lg font-extrabold px-3 py-1 rounded-lg"
                                                style={{ color: 'var(--color-accent)', backgroundColor: ACCENT_SOFT }}
                                            >
                                                {money(total)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ══ Footer ══ */}
                            <div className="px-4 sm:px-7 py-4 flex flex-wrap items-center justify-between gap-2" style={{ backgroundColor: PANEL, borderTop: `1px solid ${SOFT_LINE}` }}>
                                <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                                    Keep this invoice for warranty &amp; 7-day replacement claims.
                                </p>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold" style={{ color: 'var(--color-accent)' }}>
                                    {support.hotline && <span className="inline-flex items-center gap-1"><PhoneIcon sx={{ fontSize: 12 }} /> {support.hotline}</span>}
                                    {support.whatsapp && <span className="inline-flex items-center gap-1"><PhoneIcon sx={{ fontSize: 12 }} /> {support.whatsapp}</span>}
                                </div>
                            </div>
                        </div>
                    ) : !loading && (
                        <div className="surface flex flex-col items-center justify-center gap-3 p-12 text-center">
                            <Inventory2Icon sx={{ fontSize: '3rem', color: 'var(--color-text-muted)' }} />
                            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Order not found</p>
                            <Link to="/orders" className="btn-accent text-sm">Back to Orders</Link>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default OrderDetails;
