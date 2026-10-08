import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import SellOutlinedIcon from '@mui/icons-material/SellOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import MoreHorizOutlinedIcon from '@mui/icons-material/MoreHorizOutlined';
import { ORDERS_ALERT_EVENT } from '../../utils/adminHelpers';

// Dedicated ADMIN bottom bar (mobile only) — replaces the customer bottom bar
// on /admin routes. Thumb-friendly: Dashboard · Orders · Products · Settings · More
const AdminBottomNav = () => {
    const { pathname } = useLocation();
    const [ordersBadge, setOrdersBadge] = useState(0);

    useEffect(() => {
        const onAlert = (e) => {
            const d = e.detail || {};
            const n = Math.max(Number(d.unseen) || 0, Number(d.pendingVerify) || 0);
            setOrdersBadge(n);
        };
        window.addEventListener(ORDERS_ALERT_EVENT, onAlert);
        return () => window.removeEventListener(ORDERS_ALERT_EVENT, onAlert);
    }, []);

    const items = [
        { label: 'Dashboard', href: '/admin/dashboard', icon: DashboardOutlinedIcon, match: (p) => p === '/admin/dashboard' || p === '/admin' },
        { label: 'Orders', href: '/admin/store_orders', icon: Inventory2OutlinedIcon, match: (p) => p.startsWith('/admin/store_orders') || p.startsWith('/admin/orders'), badge: ordersBadge },
        { label: 'Products', href: '/admin/products', icon: SellOutlinedIcon, match: (p) => p.startsWith('/admin/products') || p.startsWith('/admin/add_product') },
        { label: 'Settings', href: '/admin/homepage', icon: SettingsOutlinedIcon, match: (p) => p.startsWith('/admin/homepage') },
        { label: 'More', href: '/admin/more', icon: MoreHorizOutlinedIcon, match: (p) => p.startsWith('/admin/more') },
    ];

    if (!pathname.startsWith('/admin')) return null;

    return (
        <nav
            className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-[0_-4px_16px_rgba(15,23,42,0.06)]"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            aria-label="Admin navigation"
        >
            <div className="grid grid-cols-5">
                {items.map((it) => {
                    const active = it.match(pathname);
                    const Icon = it.icon;
                    return (
                        <Link
                            key={it.label}
                            to={it.href}
                            className={`relative flex flex-col items-center justify-center gap-0.5 py-2 transition-colors ${
                                active ? 'text-primary-blue' : 'text-gray-500'
                            }`}
                        >
                            <span className="relative">
                                <Icon sx={{ fontSize: '23px' }} />
                                {it.badge > 0 && (
                                    <span className="absolute -top-1.5 -right-2.5 min-w-[17px] h-[17px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center border border-white">
                                        {it.badge > 9 ? '9+' : it.badge}
                                    </span>
                                )}
                            </span>
                            <span className={`text-[10px] leading-none ${active ? 'font-semibold' : 'font-medium'}`}>
                                {it.label}
                            </span>
                            {active && <span className="absolute top-0 w-8 h-[3px] rounded-b-full bg-primary-blue"></span>}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
};

export default AdminBottomNav;
