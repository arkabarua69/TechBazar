import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import axios from 'axios';
import { alertPulse, emitOrdersAlert, SEARCH_FOCUS_EVENT, LAST_SEEN_KEY } from '../../utils/adminHelpers';

const POLL_MS = 30000;

// Native-app top bar for the admin panel (mobile only):
// [≡ menu]  [avatar•Admin]        [🔍 search] [🔔 bell + red badge]
// Polls store-orders every 30s → badge + beep + vibration when a NEW order
// arrives (never re-beeps for orders already on screen).
const AdminAppBar = ({ onMenu }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [unseen, setUnseen] = useState(0);
    const [pendingVerify, setPendingVerify] = useState(0);
    const firstRun = useRef(true);
    const prevUnseen = useRef(null);
    const newestAt = useRef(0); // server clock (createdAt) of the newest order

    useEffect(() => {
        let alive = true;

        const check = async () => {
            if (document.hidden) return;
            try {
                const { data } = await axios.get('/api/v1/admin/store/orders');
                if (!alive || !Array.isArray(data?.orders)) return;

                const orders = data.orders;
                if (orders.length) newestAt.current = new Date(orders[0].createdAt).getTime();

                const lastSeen = Number(localStorage.getItem(LAST_SEEN_KEY) || 0);
                const newOnes = orders.filter((o) => new Date(o.createdAt).getTime() > lastSeen);

                const verify = orders.filter(
                    (o) =>
                        o.payment?.verified === false &&
                        o.status !== 'CANCELLED' &&
                        o.fulfilment !== 'DELIVERED' &&
                        o.fulfilment !== 'CANCELLED'
                ).length;

                if (firstRun.current) {
                    firstRun.current = false;
                    // very first visit: remember the newest order silently
                    if (!lastSeen && orders.length) {
                        localStorage.setItem(LAST_SEEN_KEY, String(newestAt.current));
                        prevUnseen.current = 0;
                    } else {
                        prevUnseen.current = lastSeen > 0 ? newOnes.length : 0;
                    }
                }

                const count = lastSeen > 0 ? newOnes.length : 0;

                // sound only for arrivals newer than the previous check
                if (!firstRun.current && prevUnseen.current !== null && count > prevUnseen.current) {
                    alertPulse();
                }
                prevUnseen.current = count;

                setUnseen(count);
                setPendingVerify(verify);
                emitOrdersAlert({ unseen: count, pendingVerify: verify });
            } catch (e) { /* offline / asleep → retry next tick */ }
        };

        check();
        const timer = setInterval(check, POLL_MS);
        const onFocus = () => check();
        window.addEventListener('focus', onFocus);

        return () => {
            alive = false;
            clearInterval(timer);
            window.removeEventListener('focus', onFocus);
        };
    }, []);

    const openSearch = () => {
        navigate('/admin/store_orders');
        // let the orders page mount first, then focus its search box
        setTimeout(() => window.dispatchEvent(new Event(SEARCH_FOCUS_EVENT)), 250);
    };

    const openBell = () => {
        // visiting the queue marks everything as seen (badge clears).
        // use the server timestamp to avoid browser/server clock skew.
        try {
            localStorage.setItem(LAST_SEEN_KEY, String(newestAt.current || Date.now()));
        } catch (e) { /* ignore */ }
        setUnseen(0);
        emitOrdersAlert({ unseen: 0, pendingVerify });
        navigate('/admin/store_orders?filter=verify');
    };

    // hide the bell while the orders page itself is open (badge shows inline there)
    const onOrdersPage = location.pathname.startsWith('/admin/store_orders');

    return (
        <div className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 px-3 py-2 flex items-center gap-2">
            <button
                onClick={onMenu}
                aria-label="Open menu"
                className="w-10 h-10 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center active:scale-95 transition"
            >
                <MenuIcon sx={{ fontSize: '20px' }} />
            </button>

            <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="relative">
                    <div className="w-9 h-9 rounded-full bg-primary-blue text-white flex items-center justify-center font-semibold text-sm">
                        <PersonOutlineIcon sx={{ fontSize: '20px' }} />
                    </div>
                    <span className="absolute -right-0.5 -bottom-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-white animate-pulse"></span>
                </div>
                <div className="leading-tight min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">Admin</p>
                    <p className="text-[10px] text-green-600 font-medium">● live</p>
                </div>
            </div>

            <button
                onClick={openSearch}
                aria-label="Search orders"
                className="w-10 h-10 rounded-xl text-gray-600 flex items-center justify-center active:scale-95 transition"
            >
                <SearchIcon sx={{ fontSize: '21px' }} />
            </button>

            {!onOrdersPage && (
                <button
                    onClick={openBell}
                    aria-label="Notifications"
                    className="relative w-10 h-10 rounded-xl text-gray-600 flex items-center justify-center active:scale-95 transition"
                >
                    <NotificationsNoneIcon sx={{ fontSize: '21px' }} />
                    {unseen > 0 && (
                        <span className="absolute top-1 right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center border border-white">
                            {unseen > 9 ? '9+' : unseen}
                        </span>
                    )}
                </button>
            )}
        </div>
    );
};

export default AdminAppBar;
