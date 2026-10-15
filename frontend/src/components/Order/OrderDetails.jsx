import { useSnackbar } from 'notistack';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import { clearErrors, getOrderDetails } from '../../actions/orderAction';
import Loader from '../Layouts/Loader';
import TrackStepper from './TrackStepper';
import MetaData from '../Layouts/MetaData';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import Inventory2Icon from '@mui/icons-material/Inventory2';

const statusColor = (s) => {
    if (s === 'Delivered') return { bg: '#dcfce7', text: '#16a34a' };
    if (s === 'Shipped') return { bg: '#fef3c7', text: '#d97706' };
    return { bg: '#fff7ed', text: '#ea580c' };
};

const OrderDetails = () => {
    const dispatch = useDispatch();
    const { enqueueSnackbar } = useSnackbar();
    const params = useParams();
    const { order, error, loading } = useSelector((state) => state.orderDetails);

    useEffect(() => {
        if (error) {
            enqueueSnackbar(error, { variant: 'error' });
            dispatch(clearErrors());
        }
        dispatch(getOrderDetails(params.id));
    }, [dispatch, error, params.id, enqueueSnackbar]);

    return (
        <>
            <MetaData title="Order Details" />
            <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
                <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 pb-16">
                    {/* Back nav */}
                    <Link to="/orders"
                        className="inline-flex items-center gap-1.5 text-sm font-medium mb-5 hover:underline"
                        style={{ color: 'var(--color-accent)' }}>
                        <ArrowBackIcon sx={{ fontSize: 18 }} /> My Orders
                    </Link>

                    {loading ? <Loader /> : order && order.user && order.shippingInfo ? (
                        <div className="flex flex-col gap-5">
                            {/* Order header */}
                            <div className="surface p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-muted)' }}>Order ID</p>
                                    <p className="font-mono text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>#{String(order._id).slice(-8).toUpperCase()}</p>
                                </div>
                                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold self-start sm:self-auto"
                                    style={{ backgroundColor: statusColor(order.orderStatus).bg, color: statusColor(order.orderStatus).text }}>
                                    {order.orderStatus}
                                </span>
                            </div>

                            {/* Delivery address */}
                            <div className="surface p-4 sm:p-5">
                                <h3 className="font-bold text-sm mb-3 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                                    <LocationOnIcon sx={{ fontSize: 18, color: 'var(--color-accent)' }} /> Delivery Address
                                </h3>
                                <p className="font-semibold text-sm mb-1" style={{ color: 'var(--color-text-primary)' }}>{order.user.name}</p>
                                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                                    {order.shippingInfo.address}, {order.shippingInfo.city}, {order.shippingInfo.state} — {order.shippingInfo.pincode}
                                </p>
                                <div className="flex flex-col sm:flex-row gap-3 mt-3 pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
                                    <span className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                                        <EmailIcon sx={{ fontSize: 16, color: 'var(--color-accent)' }} /> {order.user.email}
                                    </span>
                                    {order.shippingInfo.phoneNo && (
                                        <span className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                                            <PhoneIcon sx={{ fontSize: 16, color: 'var(--color-accent)' }} /> {order.shippingInfo.phoneNo}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Order items */}
                            {(order.orderItems || []).map((item) => (
                                <div key={item._id} className="surface p-4 sm:p-5">
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        {/* Product info */}
                                        <div className="flex gap-3 sm:w-1/2">
                                            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border shrink-0 flex items-center justify-center"
                                                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)' }}>
                                                <img draggable="false" src={item.image} alt={item.name} className="h-full w-full object-contain p-2" />
                                            </div>
                                            <div className="flex flex-col gap-1 min-w-0">
                                                <p className="text-sm font-semibold line-clamp-2" style={{ color: 'var(--color-text-primary)' }}>{item.name}</p>
                                                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Qty: {item.quantity}</p>
                                                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Unit price: Tk {item.price?.toLocaleString()}</p>
                                                <p className="text-sm font-bold" style={{ color: 'var(--color-accent)' }}>
                                                    Total: Tk {((item.quantity || 1) * item.price)?.toLocaleString()}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Track stepper */}
                                        <div className="sm:w-1/2 flex flex-col">
                                            <p className="font-bold text-sm mb-2" style={{ color: 'var(--color-text-primary)' }}>Order Status</p>
                                            <TrackStepper
                                                orderOn={order.createdAt}
                                                shippedAt={order.shippedAt}
                                                deliveredAt={order.deliveredAt}
                                                activeStep={
                                                    order.orderStatus === 'Delivered' ? 2
                                                        : order.orderStatus === 'Shipped' ? 1 : 0
                                                }
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Price summary */}
                            <div className="surface p-4 sm:p-5">
                                <h3 className="font-bold text-sm mb-3" style={{ color: 'var(--color-text-primary)' }}>Price Details</h3>
                                <div className="flex items-center justify-between py-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
                                    <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Order Total</span>
                                    <span className="font-bold" style={{ color: 'var(--color-text-primary)' }}>Tk {order.totalPrice?.toLocaleString()}</span>
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
