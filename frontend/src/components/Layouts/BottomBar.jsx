import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import HomeIcon from '@mui/icons-material/Home';
import StorefrontIcon from '@mui/icons-material/Storefront';
import MenuIcon from '@mui/icons-material/Menu';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import FavoriteIcon from '@mui/icons-material/Favorite';
import PersonIcon from '@mui/icons-material/Person';
import MenuDrawer from './MenuDrawer';
import { useSiteConfig } from '../../context/SiteConfigContext';
import { DEFAULT_SITE_CONFIG } from '../../utils/siteConfig';

// icon registry for the admin-editable bottom tabs
const TAB_ICONS = {
    Home: HomeIcon,
    Storefront: StorefrontIcon,
    ShoppingCart: ShoppingCartIcon,
    Inventory2: Inventory2Icon,
    Favorite: FavoriteIcon,
    Person: PersonIcon,
};

// App-style fixed bottom bar (mobile only):
// 🏠 Home · 🔍 Shop · ☰ Menu (centre, opens sidebar drawer) · 🛒 Cart · 📦 Orders
const BottomBar = () => {
    const location = useLocation();
    const path = location.pathname;
    const { cartItems } = useSelector((state) => state.cart);
    const [menuOpen, setMenuOpen] = useState(false);

    // tabs are admin-editable (Admin → Homepage → Branding & Content)
    const { config } = useSiteConfig();
    const tabs = (config.navigation?.tabs || DEFAULT_SITE_CONFIG.navigation.tabs)
        .filter((t) => t && t.label && t.href);

    // admin has its own sidebar layout on mobile
    if (path.startsWith('/admin')) return null;

    const isCart = (t) => t.key === 'cart' || t.href === '/cart';
    const isActive = (t) => (t.href === '/' ? path === '/' : path.startsWith(t.href));

    // ≤4 tabs: centre ☰ menu keeps the app-style 5-slot bar
    const withMenu = tabs.length <= 4
        ? [...tabs.slice(0, 2), 'MENU', ...tabs.slice(2)]
        : ['MENU', ...tabs];

    return (
        <>
            <MenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />

            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-line shadow-[0_-4px_16px_rgba(15,23,42,0.06)] pb-[env(safe-area-inset-bottom)]">
                <ul className="grid" style={{ gridTemplateColumns: `repeat(${withMenu.length}, minmax(0, 1fr))` }}>
                    {withMenu.map((item, i) => {
                        // ── centre ☰ Menu — highlighted circle ──
                        if (item === 'MENU') {
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

                        const { label, href, icon } = item;
                        const Icon = TAB_ICONS[icon] || HomeIcon;
                        const active = isActive(item);
                        const badge = isCart(item) ? cartItems.length : 0;
                        return (
                            <li key={`${href}-${i}`}>
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
