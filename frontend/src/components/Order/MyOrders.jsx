import { useEffect, useState } from 'react';
import { myOrders, clearErrors } from '../../actions/orderAction';
import { useDispatch, useSelector } from 'react-redux';
import Loader from '../Layouts/Loader';
import { useSnackbar } from 'notistack';
import OrderItem from './OrderItem';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import SearchIcon from '@mui/icons-material/Search';
import MinCategory from '../Layouts/MinCategory';
import MetaData from '../Layouts/MetaData';

const orderStatus = ["Processing", "Shipped", "Delivered"];
const dt = new Date();
const ordertime = [dt.getMonth(), dt.getFullYear() - 1, dt.getFullYear() - 2];

const MyOrders = () => {

    const dispatch = useDispatch();
    const { enqueueSnackbar } = useSnackbar();

    const [status, setStatus] = useState("");
    const [orderTime, setOrderTime] = useState(0);
    const [search, setSearch] = useState("");
    const [filteredOrders, setFilteredOrders] = useState([]);

    const { orders, loading, error } = useSelector((state) => state.myOrders);

    useEffect(() => {
        if (error) {
            enqueueSnackbar(error, { variant: "error" });
            dispatch(clearErrors());
        }
        dispatch(myOrders());
    }, [dispatch, error, enqueueSnackbar]);

    useEffect(() => {
        if (loading === false) {
            setFilteredOrders(orders);
        }
    }, [loading, orders]);


    useEffect(() => {
        setSearch("");
        // console.log(status);
        // console.log(typeof orderTime);
        // console.log(orderTime);

        if (!status && +orderTime === 0) {
            setFilteredOrders(orders);
            return;
        }

        if (status && orderTime) {
            if (+orderTime === dt.getMonth()) {
                const filteredArr = orders.filter((order) => order.orderStatus === status &&
                    new Date(order.createdAt).getMonth() === +orderTime
                );
                setFilteredOrders(filteredArr);
            } else {
                const filteredArr = orders.filter((order) => order.orderStatus === status &&
                    new Date(order.createdAt).getFullYear() === +orderTime
                );
                setFilteredOrders(filteredArr);
            }
        } else if (!status) {
            if (+orderTime === dt.getMonth()) {
                const filteredArr = orders.filter((order) =>
                    new Date(order.createdAt).getMonth() === +orderTime
                );
                setFilteredOrders(filteredArr);
            } else {
                const filteredArr = orders.filter((order) =>
                    new Date(order.createdAt).getFullYear() === +orderTime
                );
                setFilteredOrders(filteredArr);
            }
        } else {
            const filteredArr = orders.filter((order) => order.orderStatus === status);
            setFilteredOrders(filteredArr);
        }
        // eslint-disable-next-line
    }, [status, orderTime]);

    const searchOrders = (e) => {
        e.preventDefault();
        if (!search.trim()) {
            enqueueSnackbar("Empty Input", { variant: "warning" });
            return;
        }
        const arr = orders.map((el) => ({
            ...el,
            orderItems: el.orderItems.filter((order) =>
                order.name.toLowerCase().includes(search.toLowerCase()))
        }));
        setFilteredOrders(arr);
    }

    const clearFilters = () => {
        setStatus("");
        setOrderTime(0);
    }

    return (
        <>
            <MetaData title="My Orders | TechBazar" />

            <MinCategory />

            {/* ── orders header band — full-bleed, content centered ── */}
            <section className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-100 border-b border-line">
                <div className="mx-auto max-w-4xl px-5 sm:px-6 py-6 sm:py-8">
                    <h1 className="font-display font-extrabold text-xl sm:text-3xl text-slate-900 leading-tight">My Orders</h1>
                    <p className="text-sm text-slate-500 mt-1">Track and manage your purchases</p>
                </div>
            </section>
            {/* ── /orders header band ── */}

            {/* main centered content column */}
            <main className="mx-auto max-w-4xl px-5 sm:px-6 flex flex-col gap-6 pb-16 mt-6 sm:mt-8">

                {/* <!-- searchbar — same style as the shop page --> */}
                <form onSubmit={searchOrders} className="surface flex items-center overflow-hidden">
                    <SearchIcon sx={{ fontSize: '20px', color: '#64748b' }} className="ml-4 shrink-0" />
                    <input value={search} onChange={(e) => setSearch(e.target.value)} type="search" name="search" placeholder="Search your orders here" className="flex-1 min-w-0 p-3 text-sm outline-none text-slate-800 placeholder:text-slate-400" />
                    <button type="submit" className="btn-accent m-2 rounded-lg text-sm px-4 py-2.5 flex items-center gap-1.5 shrink-0">
                        <SearchIcon sx={{ fontSize: "18px" }} />
                        Search Orders
                    </button>
                </form>
                {/* <!-- searchbar --> */}

                {/* <!-- filters — surface card, side-by-side groups on desktop --> */}
                <div className="surface overflow-hidden">
                    <div className="flex items-center justify-between gap-5 px-4 py-3 border-b border-line">
                        <p className="font-display font-bold text-sm text-slate-900">Filters</p>
                        <button onClick={clearFilters} className="text-primary-accent text-sm font-semibold uppercase hover:text-blue-700">clear all</button>
                    </div>

                    <div className="grid sm:grid-cols-2">
                        {/* <!-- order status radios --> */}
                        <div className="px-4 py-3.5 border-b sm:border-b-0 sm:border-r border-line">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5">Order Status</p>
                            <FormControl>
                                <RadioGroup
                                    aria-labelledby="orderstatus-radio-buttons-group"
                                    onChange={(e) => setStatus(e.target.value)}
                                    name="orderstatus-radio-buttons"
                                    value={status}
                                >
                                    {orderStatus.map((el, i) => (
                                        <FormControlLabel value={el} control={<Radio size="small" sx={{ color: '#64748b', '&.Mui-checked': { color: '#3b82f6' } }} />} key={i} label={<span className="text-sm">{el}</span>} />
                                    ))}
                                </RadioGroup>
                            </FormControl>
                        </div>
                        {/* <!-- order status radios --> */}

                        {/* <!-- order time radios --> */}
                        <div className="px-4 py-3.5">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5">Order Time</p>
                            <FormControl>
                                <RadioGroup
                                    aria-labelledby="ordertime-radio-buttons-group"
                                    onChange={(e) => setOrderTime(e.target.value)}
                                    name="ordertime-radio-buttons"
                                    value={orderTime}
                                >
                                    {ordertime.map((el, i) => (
                                        <FormControlLabel value={el} control={<Radio size="small" sx={{ color: '#64748b', '&.Mui-checked': { color: '#3b82f6' } }} />} key={i} label={<span className="text-sm">{i === 0 ? "This Month" : el}</span>} />
                                    ))}
                                </RadioGroup>
                            </FormControl>
                        </div>
                        {/* <!-- order time radios --> */}
                    </div>
                </div>
                {/* <!-- filters --> */}

                {/* <!-- orders list --> */}
                {loading ? <Loader /> : (
                    <>
                        {orders && filteredOrders.length === 0 && (
                            <div className="surface flex flex-col items-center justify-center gap-3 p-8 sm:p-14 text-center">
                                <span className="text-5xl">📦</span>
                                <span className="font-display font-bold text-lg text-slate-900">Sorry, no results found</span>
                                <p className="text-sm text-slate-500">Edit search or clear all filters</p>
                                <button onClick={clearFilters} className="btn-ghost text-sm mt-2">Clear Filters</button>
                            </div>
                        )}

                        {orders && filteredOrders.length > 0 && (
                            <div className="surface overflow-hidden">
                                {filteredOrders.map((order) => {

                                    const { _id, orderStatus, orderItems, createdAt, deliveredAt } = order;

                                    return (
                                        orderItems.map((item, index) => (
                                            <OrderItem {...item} key={index} orderId={_id} orderStatus={orderStatus} createdAt={createdAt} deliveredAt={deliveredAt} />
                                        ))
                                    )
                                }).reverse()}
                            </div>
                        )}
                    </>
                )}
                {/* <!-- orders list --> */}

            </main>
        </>
    );
};

export default MyOrders;
