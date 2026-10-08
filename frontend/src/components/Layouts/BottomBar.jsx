import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import HomeIcon from '@mui/icons-material/Home';
import StorefrontIcon from '@mui/icons-material/Storefront';
import MenuIcon from '@mui/icons-material/Menu';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import MenuDrawer from './MenuDrawer';

// App-style fixed bottom bar (mobile only):
// 🏠 Home · 🔍 Shop · ☰ Menu (centre, opens sidebar drawer) · 🛒 Cart · 📦 Orders
const BottomBar = () => {
    const location = useLocation();
    const path = location.pathname;
    const { cartItems } = useSelector((state) => state.cart);
    const [menuOpen, setMenuOpen] = useState(false);

    // admin has its own sidebar layout on mobile
    if (path.startsWith('/admin')) return null;

    const items = [
        { label: 'Home', href: '/', icon: HomeIcon, active: path === '/' },
        { label: 'Shop', href: '/products', icon: StorefrontIcon, active: path.startsWith('/products') || path.startsWith('/product/') },
        null, // centre = ☰ Menu button
        { label: 'Cart', href: '/cart', icon: ShoppingCartIcon, active: path.startsWith('/cart'), badge: cartItems.length },
        { label: 'Orders', href: '/orders', icon: Inventory2Icon, active: path.startsWith('/orders') || path.startsWith('/order/') || path.startsWith('/track') },
    ];

    return (
        <>
            <MenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />

            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-line shadow-[0_-4px_16px_rgba(15,23,42,0.06)] pb-[env(safe-area-inset-bottom)]">
                <ul className="grid grid-cols-5">
                    {items.map((item, i) => {
                        // ── centre ☰ Menu — highlighted circle ──
                        if (!item) {
                            return (
                                <li key="menu" className="relative">
                                    <button
                                        onClick={() => setMenuOpen(true)}
                                        aria-label="Open menu"
                                        className="w-full flex flex-col items-center justify-center gap-1 py-2"
                                    >
                                        <span className="mt-[-1.375rem] w-14 h-14 rounded-full bg-primary-accent text-white shadow-[0_8px_20px_rgba(59,130,246,0.45)] border-4 border-white flex items-center justify-center transition active:scale-95">
                                            <MenuIcon sx={{ fontSize: '22px' }} />
                                        </span>
                                        <span className="text-xxs font-semibold text-slate-700">Menu</span>
                                    </button>
                                </li>
                            );
                        }

                        const { label, href, icon: Icon, active, badge } = item;
                        return (
                            <li key={label}>
                                <Link
                                    to={href}
                                    className={`relative flex flex-col items-center justify-center gap-0.5 py-2.5 transition duration-200 ${
                                        active ? 'text-primary-accent' : 'text-slate-500 hover:text-primary-accent'
                                    }`}
                                >
                                    {active && <span className="absolute top-0 w-8 h-0.5 rounded-full bg-primary-accent" />}
                                    <span className="relative">
                                        <Icon sx={{ fontSize: '21px' }} />
                                        {badge > 0 && (
                                            <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 text-xxs font-bold text-white bg-primary-accent rounded-full flex items-center justify-center">
                                                {badge}
                                            </span>
                                        )}
                                    </span>
                                    <span className={`text-xxs ${active ? 'font-bold' : 'font-medium'}`}>{label}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </>
    );
};

export default BottomBar;
