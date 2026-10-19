import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import CircleIcon from '@mui/icons-material/Circle';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Link } from 'react-router-dom';
import { formatDate } from '../../utils/functions';

const statusConfig = {
    Delivered: {
        icon: <CheckCircleIcon sx={{ fontSize: 14 }} />,
        style: { backgroundColor: 'rgba(22,163,74,0.08)', color: 'var(--color-success)', borderColor: 'rgba(22,163,74,0.25)' },
    },
    Shipped: {
        icon: <CircleIcon sx={{ fontSize: 14 }} />,
        style: { backgroundColor: 'rgba(232,75,15,0.08)', color: 'var(--color-accent)', borderColor: 'rgba(232,75,15,0.25)' },
    },
    Processing: {
        icon: <RadioButtonUncheckedIcon sx={{ fontSize: 14 }} />,
        style: { backgroundColor: 'rgba(245,158,11,0.08)', color: '#d97706', borderColor: 'rgba(245,158,11,0.25)' },
    },
};

const OrderItem = ({ orderId, name, image, price, quantity, createdAt, deliveredAt, orderStatus }) => {
    const cfg = statusConfig[orderStatus] || statusConfig.Processing;

    const statusLabel = () => {
        if (orderStatus === 'Delivered') return `Delivered on ${formatDate(deliveredAt)}`;
        if (orderStatus === 'Shipped') return 'Shipped';
        return `Ordered on ${formatDate(createdAt)}`;
    };

    const statusDesc = () => {
        if (orderStatus === 'Delivered') return 'Your item has been delivered';
        if (orderStatus === 'Shipped') return 'Your item is on the way';
        return 'Seller has processed your order';
    };

    return (
        <Link
            to={`/order_details/${orderId}`}
            className="border-b px-4 sm:px-5 py-4 flex flex-row gap-3 transition-colors duration-150"
            style={{ borderColor: 'var(--color-border)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
            {/* Thumbnail */}
            <div
                className="w-20 h-20 rounded-xl overflow-hidden border shrink-0 flex items-center justify-center"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)' }}
            >
                <img draggable="false" src={image} alt={name} className="h-full w-full object-contain p-2" />
            </div>

            {/* Details */}
            <div className="flex flex-col sm:flex-row justify-between w-full gap-3">
                <div className="flex flex-col gap-1 overflow-hidden">
                    <p className="text-sm font-semibold line-clamp-2" style={{ color: 'var(--color-text-primary)' }}>{name}</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Qty: {quantity}</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Total: Tk {(quantity * price).toLocaleString()}</p>
                </div>

                <div className="flex flex-col gap-1.5 sm:w-48 shrink-0">
                    <p className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>Tk {price.toLocaleString()}</p>
                    <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border self-start"
                        style={cfg.style}
                    >
                        {cfg.icon} {statusLabel()}
                    </span>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{statusDesc()}</p>
                </div>
            </div>
        </Link>
    );
};

export default OrderItem;
