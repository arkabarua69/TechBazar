import { Link } from 'react-router-dom';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LocalMallIcon from '@mui/icons-material/LocalMall';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { formatDate } from '../../utils/functions';

// Status → chip tint + label (same palette the rest of the site uses).
const statusConfig = {
    Delivered: { icon: <CheckCircleIcon sx={{ fontSize: 11 }} />, tint: '#16a34a', bg: '#dcfce7', label: 'Delivered' },
    Shipped: { icon: <LocalShippingIcon sx={{ fontSize: 11 }} />, tint: '#b45309', bg: '#fef3c7', label: 'Shipped' },
    Processing: { icon: <HourglassTopIcon sx={{ fontSize: 11 }} />, tint: '#1d4ed8', bg: '#dbeafe', label: 'Processing' },
};

const statusDesc = (s) => {
    if (s === 'Delivered') return 'Delivered to you';
    if (s === 'Shipped') return 'On the way to you';
    return 'Seller has processed your order';
};

// Order card shaped like the Account → Manage Addresses card:
//   badges row on top · product line · info rows · bordered action footer.
// Hover = the site-wide 0 8px 24px var(--shadow-accent-soft) glow; the border turns
// accent so it reads as "live" exactly like the default-address card.
const OrderItem = ({ orderId, displayId, items = [], totalPrice, createdAt, deliveredAt, orderStatus }) => {
    const cfg = statusConfig[orderStatus] || statusConfig.Processing;
    const first = items[0] || {};
    const qtyTotal = items.reduce((sum, i) => sum + (i.quantity || 1), 0);
    const extraItems = Math.max(0, items.length - 1);
    const isActive = orderStatus === 'Delivered' || orderStatus === 'Shipped';

    return (
        <div
            className="group flex flex-col gap-2.5 p-3.5 transition-all duration-200"
            style={{
                backgroundColor: 'var(--color-surface)',
                border: `1px solid ${isActive ? 'var(--color-accent)' : 'var(--color-border)'}`,
                borderRadius: 'var(--card-radius)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 8px 24px var(--shadow-accent-soft)';
                e.currentTarget.style.borderColor = 'var(--color-accent)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                e.currentTarget.style.borderColor = isActive ? 'var(--color-accent)' : 'var(--color-border)';
            }}
        >
            {/* ── badges row ── */}
            <div className="flex items-center gap-2 flex-wrap">
                <span
                    className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: cfg.bg, color: cfg.tint }}
                >
                    {cfg.icon} {cfg.label}
                </span>
                {extraItems > 0 && (
                    <span
                        className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: 'var(--color-accent)' }}
                    >
                        +{extraItems} MORE
                    </span>
                )}
                <span
                    className="ml-auto font-mono text-[10px] font-bold uppercase tracking-wider truncate"
                    style={{ color: 'var(--color-text-muted)' }}
                >
                    {displayId || `#${String(orderId).slice(-8).toUpperCase()}`}
                </span>
            </div>

            {/* ── product line ── */}
            <div className="flex items-center gap-3 min-w-0">
                <div
                    className="w-12 h-12 rounded-lg overflow-hidden shrink-0 flex items-center justify-center"
                    style={{ backgroundColor: '#fff', border: '1px solid var(--color-border)' }}
                >
                    {first.image ? (
                        <img
                            draggable="false"
                            src={first.image}
                            alt={first.name}
                            className="h-full w-full object-contain p-1 group-hover:scale-105 transition-transform duration-300"
                        />
                    ) : (
                        <Inventory2Icon sx={{ fontSize: 20, color: 'var(--color-accent)' }} />
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold leading-snug line-clamp-2" style={{ color: 'var(--color-text-primary)' }}>
                        {first.name}
                        {extraItems > 0 && <span style={{ color: 'var(--color-text-muted)' }}> +{extraItems} more</span>}
                    </p>
                    <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--color-text-secondary)' }}>
                        {orderStatus === 'Delivered'
                            ? `Delivered on ${formatDate(deliveredAt)}`
                            : statusDesc(orderStatus)}
                    </p>
                </div>
            </div>

            {/* ── info rows ── */}
            <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="inline-flex items-center gap-1.5 shrink-0" style={{ color: 'var(--color-text-muted)' }}>
                        <LocalMallIcon sx={{ fontSize: 13, color: 'var(--color-accent)' }} /> Items
                    </span>
                    <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                        {qtyTotal} pcs
                    </span>
                </div>
                <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="inline-flex items-center gap-1.5 shrink-0" style={{ color: 'var(--color-text-muted)' }}>
                        <CalendarTodayIcon sx={{ fontSize: 13, color: 'var(--color-accent)' }} /> Placed on
                    </span>
                    <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                        {formatDate(createdAt)}
                    </span>
                </div>
                <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="inline-flex items-center gap-1.5 shrink-0" style={{ color: 'var(--color-text-muted)' }}>
                        <ReceiptLongIcon sx={{ fontSize: 13, color: 'var(--color-accent)' }} /> Total
                    </span>
                    <span className="font-extrabold text-sm" style={{ color: 'var(--color-accent)' }}>
                        Tk {(totalPrice || 0).toLocaleString()}
                    </span>
                </div>
            </div>

            {/* ── action footer ── */}
            <div
                className="flex items-center gap-3 pt-2.5 mt-auto"
                style={{ borderTop: '1px solid var(--color-border)' }}
            >
                <Link
                    to={`/order_details/${orderId}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold transition-colors"
                    style={{ color: 'var(--color-text-secondary)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-accent)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
                >
                    <ReceiptLongIcon sx={{ fontSize: 14 }} /> Invoice
                </Link>
                <Link
                    to={`/order_details/${orderId}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold transition-colors"
                    style={{ color: 'var(--color-text-secondary)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-accent)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
                >
                    <LocalShippingIcon sx={{ fontSize: 14 }} /> Track
                </Link>
                <Link
                    to={`/order_details/${orderId}`}
                    className="ml-auto shrink-0 inline-flex items-center gap-0.5 py-1.5 px-3 rounded-lg text-xs font-semibold text-white transition-all duration-200"
                    style={{ backgroundColor: 'var(--color-accent)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-accent-hover)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-accent)'; }}
                >
                    Details <ChevronRightIcon sx={{ fontSize: 15 }} />
                </Link>
            </div>
        </div>
    );
};

export default OrderItem;
