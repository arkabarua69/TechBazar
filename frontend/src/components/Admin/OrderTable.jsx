import { useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { useDispatch, useSelector } from 'react-redux';
import { useSnackbar } from 'notistack';
import useMediaQuery from '@mui/material/useMediaQuery';
import { clearErrors, deleteOrder, getAllOrders } from '../../actions/orderAction';
import { DELETE_ORDER_RESET } from '../../constants/orderConstants';
import Actions from './Actions';
import { formatDate } from '../../utils/functions';
import MetaData from '../Layouts/MetaData';
import BackdropLoader from '../Layouts/BackdropLoader';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { shortOrderId } from '../../utils/adminHelpers';

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

    const isMobile = useMediaQuery('(max-width:639px)');

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

    const columns = [
        {
            field: "id",
            headerName: "Order ID",
            minWidth: 200,
            flex: 1,
        },
        {
            field: "status",
            headerName: "Status",
            minWidth: 150,
            flex: 0.2,
            renderCell: (params) => {
                return (
                    <>
                        {
                            params.row.status === "Delivered" ? (
                                <span className="text-sm bg-green-100 p-1 px-2 font-medium rounded-full text-green-800">{params.row.status}</span>
                            ) : params.row.status === "Shipped" ? (
                                <span className="text-sm bg-yellow-100 p-1 px-2 font-medium rounded-full text-yellow-800">{params.row.status}</span>
                            ) : (
                                <span className="text-sm bg-purple-100 p-1 px-2 font-medium rounded-full text-purple-800">{params.row.status}</span>
                            )
                        }
                    </>
                )
            },
        },
        {
            field: "itemsQty",
            headerName: "Items Qty",
            type: "number",
            minWidth: 100,
            flex: 0.1,
        },
        {
            field: "amount",
            headerName: "Amount",
            type: "number",
            minWidth: 200,
            flex: 0.2,
            renderCell: (params) => {
                return (
                    <span>Tk {params.row.amount.toLocaleString()}</span>
                );
            },
        },
        {
            field: "orderOn",
            headerName: "Order On",
            type: "date",
            minWidth: 200,
            flex: 0.5,
        },
        {
            field: "actions",
            headerName: "Actions",
            minWidth: 100,
            flex: 0.3,
            type: "number",
            sortable: false,
            renderCell: (params) => {
                return (
                    <Actions editRoute={"order"} deleteHandler={deleteOrderHandler} id={params.row.id} />
                );
            },
        },
    ];

    const rows = [];

    orders && orders.forEach((order) => {
        rows.unshift({
            id: order._id,
            itemsQty: order.orderItems.length,
            amount: order.totalPrice,
            orderOn: formatDate(order.createdAt),
            status: order.orderStatus,
        });
    });

    return (
        <>
            {!embedded && <MetaData title="Admin Orders" />}

            {loading && <BackdropLoader />}

            {!embedded && <h1 className="text-lg sm:text-xl font-extrabold text-gray-900">Orders</h1>}

            {/* ===== MOBILE: card list (no horizontal scroll) ===== */}
            <div className="sm:hidden flex flex-col gap-3">
                {rows.length === 0 && !loading && (
                    <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-8 text-center text-gray-400 text-sm">
                        No online orders yet.
                    </div>
                )}
                {rows.map((o) => (
                    <article key={o.id} className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden ring-1 ring-black/[0.02]">
                        <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 border-b border-gray-100">
                            <span className="w-8 h-8 rounded-xl bg-gray-900 text-white flex items-center justify-center shrink-0">
                                <ReceiptLongIcon sx={{ fontSize: '17px' }} />
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-gray-900 truncate">#{shortOrderId(o.id)}</p>
                                <p className="text-[11px] text-gray-400">{o.orderOn}</p>
                            </div>
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${statusPill(o.status)}`}>
                                {o.status}
                            </span>
                        </div>
                        <div className="flex items-center justify-between gap-3 px-3 py-3">
                            <div>
                                <p className="text-base font-extrabold text-gray-900">Tk {o.amount.toLocaleString()}</p>
                                <p className="text-[11px] text-gray-500">{o.itemsQty} item{o.itemsQty === 1 ? '' : 's'}</p>
                            </div>
                            <Actions editRoute={"order"} deleteHandler={deleteOrderHandler} id={o.id} />
                        </div>
                    </article>
                ))}
            </div>

            {/* ===== DESKTOP: table ===== */}
            <div className="hidden sm:block bg-white rounded-2xl border border-gray-200/80 shadow-sm w-full overflow-hidden" style={{ height: 'min(560px, 68vh)' }}>
                <DataGrid
                    rows={rows}
                    columns={columns}
                    pageSize={10}
                    rowsPerPageOptions={[10, 25, 50]}
                    disableSelectIconOnClick
                    disableRowSelectionOnClick
                    columnVisibilityModel={isMobile ? { itemsQty: false, orderOn: false } : {}}
                    sx={{
                        boxShadow: 0,
                        border: 0,
                        '& .MuiDataGrid-columnHeaders': {
                            backgroundColor: '#fafafa',
                            borderBottom: '1px solid #f0f0f0',
                        },
                        '& .MuiDataGrid-columnHeaderTitle': {
                            fontWeight: 700,
                            fontSize: '0.72rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.03em',
                            color: '#6b7280',
                        },
                        '& .MuiDataGrid-cell': {
                            borderBottom: '1px solid #f5f5f5',
                        },
                        '& .MuiDataGrid-row:hover': {
                            backgroundColor: '#fff7f2',
                        },
                        '& .MuiDataGrid-footerContainer': {
                            borderTop: '1px solid #f0f0f0',
                        },
                    }}
                />
            </div>
        </>
    );
};

export default OrderTable;
