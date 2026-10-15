import { useEffect, useState } from 'react';
import { myOrders, clearErrors } from '../../actions/orderAction';
import { useDispatch, useSelector } from 'react-redux';
import Loader from '../Layouts/Loader';
import { useSnackbar } from 'notistack';
import OrderItem from './OrderItem';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import MetaData from '../Layouts/MetaData';

const ORDER_STATUSES = ['Processing', 'Shipped', 'Delivered'];
const dt = new Date();
const ORDER_TIMES = [dt.getMonth(), dt.getFullYear() - 1, dt.getFullYear() - 2];

const FilterChip = ({ label, active, onClick }) => (
    <button
        onClick={onClick}
        className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 border"
        style={active
            ? { backgroundColor: 'var(--color-accent)', color: '#fff', borderColor: 'var(--color-accent)' }
            : { backgroundColor: 'transparent', color: 'var(--color-text-secondary)', borderColor: 'var(--color-border)' }
        }
    >
        {label}
    </button>
);

const MyOrders = () => {
    const dispatch = useDispatch();
    const { enqueueSnackbar } = useSnackbar();
    const [status, setStatus] = useState('');
    const [orderTime, setOrderTime] = useState(0);
    const [search, setSearch] = useState('');
    const [filteredOrders, setFilteredOrders] = useState([]);
    const { orders, loading, error } = useSelector((state) => state.myOrders);

    useEffect(() => {
        if (error) {
            enqueueSnackbar(error, { variant: 'error' });
            dispatch(clearErrors());
        }
        dispatch(myOrders());
    }, [dispatch, error, enqueueSnackbar]);

    useEffect(() => {
        if (!loading) setFilteredOrders(orders || []);
    }, [loading, orders]);

    useEffect(() => {
        setSearch('');
        const base = orders || [];
        if (!status && +orderTime === 0) { setFilteredOrders(base); return; }
        let result = base;
        if (status) result = result.filter((o) => o.orderStatus === status);
        if (+orderTime !== 0) {
            if (+orderTime === dt.getMonth()) {
                result = result.filter((o) => new Date(o.createdAt).getMonth() === +orderTime);
            } else {
                result = result.filter((o) => new Date(o.createdAt).getFullYear() === +orderTime);
            }
        }
        setFilteredOrders(result);
    }, [status, orderTime]); // eslint-disable-line

    const searchOrders = (e) => {
        e.preventDefault();
        const q = search.trim().toLowerCase();
        if (!q) { enqueueSnackbar('Enter a search term', { variant: 'warning' }); return; }
        const base = orders || [];
        const arr = base.map((o) => ({
            ...o,
            orderItems: o.orderItems.filter((i) => i.name.toLowerCase().includes(q)),
        })).filter((o) => o.orderItems.length > 0);
        setFilteredOrders(arr);
    };

    const clearFilters = () => { setStatus(''); setOrderTime(0); };

    return (
        <>
            <MetaData title="My Orders" />
            {/* Header band — brand orange gradient */}
            <section style={{ background: 'linear-gradient(135deg, var(--color-accent) 0%, #c63e0a 100%)' }}>
                <div className="mx-auto max-w-4xl px-5 sm:px-6 py-6 sm:py-8">
                    <h1 className="font-bold text-xl sm:text-2xl text-white">My Orders</h1>
                    <p className="text-white/75 text-sm mt-0.5">Track and manage your purchases</p>
                </div>
            </section>

            <main className="mx-auto max-w-4xl px-4 sm:px-6 flex flex-col gap-5 pb-16 mt-5 sm:mt-6">

                {/* Search */}
                <form onSubmit={searchOrders} className="surface flex items-center overflow-hidden">
                    <SearchIcon sx={{ fontSize: '20px', color: 'var(--color-text-muted)' }} className="ml-4 shrink-0" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        type="search"
                        placeholder="Search your orders here"
                        className="flex-1 min-w-0 p-3 text-sm outline-none bg-transparent"
                        style={{ color: 'var(--color-text-primary)' }}
                    />
                    <button type="submit" className="btn-accent m-2 rounded-xl text-sm px-4 py-2.5 flex items-center gap-1.5 shrink-0">
                        <SearchIcon sx={{ fontSize: '16px' }} /> Search
                    </button>
                </form>

                {/* Filter chips */}
                <div className="surface p-4">
                    <div className="flex items-center justify-between mb-3">
                        <span className="flex items-center gap-2 text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
                            <FilterListIcon sx={{ fontSize: 18 }} /> Filters
                        </span>
                        <button onClick={clearFilters} className="text-sm font-semibold hover:underline" style={{ color: 'var(--color-accent)' }}>
                            Clear all
                        </button>
                    </div>

                    <div className="flex flex-col gap-3">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>Order Status</p>
                            <div className="flex flex-wrap gap-2">
                                {ORDER_STATUSES.map((s) => (
                                    <FilterChip key={s} label={s} active={status === s}
                                        onClick={() => setStatus(status === s ? '' : s)} />
                                ))}
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>Order Time</p>
                            <div className="flex flex-wrap gap-2">
                                {ORDER_TIMES.map((t, i) => (
                                    <FilterChip key={t} label={i === 0 ? 'This Month' : String(t)}
                                        active={+orderTime === t}
                                        onClick={() => setOrderTime(+orderTime === t ? 0 : t)} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Orders list */}
                {loading ? <Loader /> : (
                    filteredOrders.length === 0 ? (
                        <div className="surface flex flex-col items-center justify-center gap-3 p-10 text-center">
                            <span className="text-5xl">📦</span>
                            <h3 className="font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>No orders found</h3>
                            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                                {status || +orderTime !== 0 ? 'Try clearing the filters' : "You haven't placed any orders yet"}
                            </p>
                            {(status || +orderTime !== 0) && (
                                <button onClick={clearFilters} className="btn-ghost text-sm mt-1">Clear Filters</button>
                            )}
                        </div>
                    ) : (
                        <div className="surface overflow-hidden">
                            {[...filteredOrders].reverse().flatMap((order) =>
                                (order.orderItems || []).map((item, i) => (
                                    <OrderItem
                                        key={`${order._id}-${i}`}
                                        {...item}
                                        orderId={order._id}
                                        orderStatus={order.orderStatus}
                                        createdAt={order.createdAt}
                                        deliveredAt={order.deliveredAt}
                                    />
                                ))
                            )}
                        </div>
                    )
                )}
            </main>
        </>
    );
};

export default MyOrders;
