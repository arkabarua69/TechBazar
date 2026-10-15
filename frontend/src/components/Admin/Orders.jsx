import { useSearchParams } from 'react-router-dom';
import MetaData from '../Layouts/MetaData';
import StoreOrders from './StoreOrders';
import OrderTable from './OrderTable';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import StorefrontIcon from '@mui/icons-material/Storefront';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';

// ─────────────────────────────────────────────────────────────────────────────
// One Orders page for the whole app (mobile-app style).
// Two data sources live behind a segmented control instead of two menu entries:
//   • Store Orders  — guest checkout orders that need TrxID verification
//   • Online Orders — classic account/cart orders
// Deep links such as /admin/orders?filter=verify still work (StoreOrders reads
// the `filter` query param); `view=online` switches to the classic table.
// ─────────────────────────────────────────────────────────────────────────────
const TABS = [
    { id: 'store',  label: 'Store Orders',  hint: 'Guest checkout · verify TrxID', Icon: StorefrontIcon },
    { id: 'online', label: 'Online Orders', hint: 'Account / cart checkout',       Icon: ReceiptLongIcon },
];

const Orders = () => {
    const [params, setParams] = useSearchParams();
    const view = params.get('view') === 'online' ? 'online' : 'store';

    const setView = (id) => {
        const next = new URLSearchParams(params);
        if (id === 'store') next.delete('view');
        else next.set('view', id);
        setParams(next, { replace: true });
    };

    return (
        <>
            <MetaData title="Admin Orders" />

            {/* ── App-style page header ── */}
            <div className="flex items-center gap-3">
                <span className="w-11 h-11 rounded-2xl bg-[#E84B0F]/10 text-[#E84B0F] flex items-center justify-center shrink-0">
                    <ShoppingBagIcon sx={{ fontSize: '1.35rem' }} />
                </span>
                <div className="min-w-0">
                    <h1 className="text-lg sm:text-xl font-extrabold text-gray-900 leading-tight">Orders</h1>
                    <p className="text-xs text-gray-500">Review, verify &amp; fulfil every order in one place</p>
                </div>
            </div>

            {/* ── Segmented control (thumb friendly, no horizontal scroll) ── */}
            <div className="flex bg-gray-100 rounded-2xl p-1 gap-1">
                {TABS.map(({ id, label, hint, Icon }) => {
                    const active = view === id;
                    return (
                        <button
                            key={id}
                            onClick={() => setView(id)}
                            aria-pressed={active}
                            className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-2.5 py-2.5 transition active:scale-[0.99] ${
                                active ? 'bg-black text-white shadow-sm' : 'text-gray-600 hover:bg-white/70'
                            }`}
                        >
                            <Icon sx={{ fontSize: '18px' }} />
                            <span className="flex flex-col items-start leading-tight min-w-0">
                                <span className="text-[13px] font-bold truncate">{label}</span>
                                <span className={`text-[10px] font-medium truncate ${active ? 'text-white/60' : 'text-gray-400'}`}>
                                    {hint}
                                </span>
                            </span>
                        </button>
                    );
                })}
            </div>

            {view === 'store' ? <StoreOrders embedded /> : <OrderTable embedded />}
        </>
    );
};

export default Orders;
