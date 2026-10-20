import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSnackbar } from 'notistack';
import { clearErrors, deleteOrder, getAllOrders } from '../../actions/orderAction';
import { DELETE_ORDER_RESET } from '../../constants/orderConstants';
import Actions from './Actions';
import { formatDate } from '../../utils/functions';
import { buildCsv, downloadCsv } from '../../utils/csv';
import DownloadIcon from '@mui/icons-material/Download';
import MetaData from '../Layouts/MetaData';
import BackdropLoader from '../Layouts/BackdropLoader';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';

const statusPill = (status) => {
    switch (status) {
        case 'Delivered': return 'bg-green-100 text-green-700';
        case 'Shipped':   return 'bg-yellow-100 text-yellow-800';
        case 'Processing':return 'bg-blue-100 text-blue-700';
        default:          return 'bg-purple-100 text-purple-700';
    }
};

const OrderTable = ({ embedded = false } = {}) => {

    const dispatch = useDispatch();
    const { enqueueSnackbar } = useSnackbar();

    const { orders, error } = useSelector((state) => state.allOrders);
    const { loading, isDeleted, error: deleteError } = useSelector((state) => state.order);

    useEffect(() => {
        if (error) {
            enqueueSnackbar(error, { variant: "error" });
            dispatch(clearErrors());
        }
        if (deleteError) {
            enqueueSnackbar(deleteError, { variant: "error" });
            dispatch(clearErrors());
        }
        if (isDeleted) {
            enqueueSnackbar("Deleted Successfully", { variant: "success" });
            dispatch({ type: DELETE_ORDER_RESET });
        }
        dispatch(getAllOrders());
    }, [dispatch, error, deleteError, isDeleted, enqueueSnackbar]);

    const deleteOrderHandler = (id) => {
        dispatch(deleteOrder(id));
    }

    const rows = [];

    orders && orders.forEach((order) => {
        const firstImage = order.orderItems?.[0]?.image || '';
        rows.unshift({
            id: order._id,
            orderId: order.orderId || `TB-${String(order._id).slice(-4).toUpperCase()}`,
            itemsQty: order.orderItems.length,
            amount: order.totalPrice,
            orderOn: formatDate(order.createdAt),
            status: order.orderStatus,
            image: firstImage,
            firstName: order.orderItems?.[0]?.name || '',
            customer: order.user?.name || order.shippingInfo?.name || 'Guest',
            email: order.user?.email || '',
            avatar: order.user?.avatar?.url || '',
        });
    });

const [exporting, setExporting] = useState(false);
    const exportCsvHandler = () => {
        if (!rows.length) {
            enqueueSnackbar('No orders to export', { variant: 'warning' });
            return;
        }
        setExporting(true);
        try {
            const columns = [
                { header: 'Order ID', get: (r) => r.orderId },
                { header: 'Customer', get: (r) => r.customer },
                { header: 'Email', get: (r) => r.email },
                { header: 'Items', get: (r) => r.itemsQty },
                { header: 'First Item', get: (r) => r.firstName },
                { header: 'Amount (Tk)', get: (r) => r.amount },
                { header: 'Status', get: (r) => r.status },
                { header: 'Order Date', get: (r) => r.orderOn },
            ];
            const csv = buildCsv(columns, rows);
            const stamp = new Date().toISOString().slice(0, 10);
            downloadCsv(`online-orders-${stamp}.csv`, csv);
            enqueueSnackbar(`Exported ${rows.length} order${rows.length === 1 ? '' : 's'}`, { variant: 'success' });
        } finally {
            setExporting(false);
        }
    };

    const stats = {
        total: rows.length,
        delivered: rows.filter((r) => r.status === 'Delivered').length,
        shipped: rows.filter((r) => r.status === 'Shipped').length,
        pending: rows.filter((r) => !['Delivered', 'Shipped'].includes(r.status)).length,
    };

    return (
        <>
            {!embedded && <MetaData title="Admin Orders" />}

            {loading && <BackdropLoader />}

            {!embedded && <h1 className="text-lg sm:text-xl font-extrabold text-gray-900">Orders</h1>}

            {/* Stats strip */}
            {rows.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                    {[
                        { label: 'Total', value: stats.total, tint: 'text-gray-900', bg: 'bg-gray-50', ring: 'ring-gray-100' },
                        { label: 'Delivered', value: stats.delivered, tint: 'text-green-700', bg: 'bg-green-50', ring: 'ring-green-100' },
                        { label: 'Shipped', value: stats.shipped, tint: 'text-yellow-700', bg: 'bg-yellow-50', ring: 'ring-yellow-100' },
                        { label: 'Processing', value: stats.pending, tint: 'text-purple-700', bg: 'bg-purple-50', ring: 'ring-purple-100' },
                    ].map((s) => (
                        <div key={s.label} className={`rounded-2xl ${s.bg} ring-1 ${s.ring} px-3.5 py-3`}>
                            <p className={`text-xl font-extrabold leading-none ${s.tint}`}>{s.value}</p>
                            <p className="text-[11px] font-medium text-gray-500 mt-1">{s.label}</p>
                        </div>
                    ))}
                </div>
            )}

{/* Export CSV */}
            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={exportCsvHandler}
                    disabled={exporting || rows.length === 0}
                    className="inline-flex items-center gap-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl px-3.5 py-2 text-sm font-semibold shadow-sm active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <DownloadIcon sx={{ fontSize: '1.05rem' }} />
                    <span>{exporting ? 'Exporting…' : 'Export CSV'}</span>
                </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                {rows.length === 0 && !loading && (
                    <div className="col-span-full bg-white rounded-2xl border border-dashed border-gray-300 p-8 text-center text-gray-400 text-sm">
                        No online orders yet.
                    </div>
                )}
                {rows.map((o) => (
                    <article
                        key={o.id}
                        className="group bg-white rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md hover:border-gray-300 overflow-hidden ring-1 ring-black/[0.02] transition-all flex"
                    >
                        {/* LEFT: first item image */}
                        <div className="relative shrink-0 w-[34%] max-w-[130px] min-w-[96px] bg-gradient-to-br from-gray-50 to-white border-r border-gray-100 flex items-center justify-center p-3">
                            {o.image ? (
                                <img
                                    draggable="false"
                                    src={o.image}
                                    alt={o.firstName}
                                    className="max-h-[92px] max-w-full object-contain group-hover:scale-[1.05] transition-transform duration-300"
                                />
                            ) : (
                                <span className="w-12 h-12 rounded-xl bg-gray-900 text-white flex items-center justify-center">
                                    <ReceiptLongIcon sx={{ fontSize: '22px' }} />
                                </span>
                            )}
                            {o.itemsQty > 1 && (
                                <span className="absolute top-2 left-2 text-[10px] font-bold bg-[#E84B0F] text-white px-2 py-0.5 rounded-full shadow-sm">
                                    ×{o.itemsQty}
                                </span>
                            )}
                        </div>

                        {/* RIGHT: details + actions */}
                        <div className="flex flex-col flex-1 min-w-0">
                            <div className="flex flex-col flex-1 p-3 gap-1.5">
                                <div className="min-w-0">
                                    <p className="text-[11px] font-mono font-bold text-gray-900 truncate">{o.orderId}</p>
                                    {/* buyer: avatar + name + email */}
                                    <div className="flex items-center gap-1.5 mt-1 min-w-0">
                                        {o.avatar ? (
                                            <img src={o.avatar} alt={o.customer} className="w-5 h-5 rounded-full object-cover shrink-0 border border-gray-200" />
                                        ) : (
                                            <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                                                {(o.customer || '?').charAt(0).toUpperCase()}
                                            </span>
                                        )}
                                        <span className="text-[11px] font-medium text-gray-700 truncate">{o.customer}</span>
                                    </div>
                                    {o.email && (
                                        <p className="text-[10px] text-gray-400 truncate mt-0.5">{o.email}</p>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${statusPill(o.status)}`}>
                                        {o.status}
                                    </span>
                                    <span className="text-[10px] text-gray-400 truncate ml-auto">{o.orderOn}</span>
                                </div>

                                <div className="flex flex-nowrap items-baseline gap-1.5 mt-auto pt-1 min-w-0">
                                    <span className="font-extrabold text-gray-900 text-base whitespace-nowrap shrink-0">Tk {o.amount.toLocaleString()}</span>
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-auto whitespace-nowrap shrink-0 bg-gray-100 text-gray-600">
                                        {o.itemsQty} item{o.itemsQty === 1 ? '' : 's'}
                                    </span>
                                </div>
                            </div>

                            {/* footer: actions */}
                            <div className="flex items-center justify-end px-3 py-2 border-t border-gray-100 bg-gray-50/70">
                                <Actions editRoute={"order"} deleteHandler={deleteOrderHandler} id={o.id} />
                            </div>
                        </div>
                    </article>
                ))}
            </div>
        </>
    );
};

export default OrderTable;
