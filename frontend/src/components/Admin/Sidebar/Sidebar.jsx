import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import EqualizerIcon from '@mui/icons-material/Equalizer';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import InventoryIcon from '@mui/icons-material/Inventory';
import GroupIcon from '@mui/icons-material/Group';
import ReviewsIcon from '@mui/icons-material/Reviews';
import AddBoxIcon from '@mui/icons-material/AddBox';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountBoxIcon from '@mui/icons-material/AccountBox';
import SettingsIcon from '@mui/icons-material/Settings';
import CategoryIcon from '@mui/icons-material/Category';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import StorageIcon from '@mui/icons-material/Storage';
import HomeIcon from '@mui/icons-material/Home';
import CloseIcon from '@mui/icons-material/Close';
import CopyrightIcon from '@mui/icons-material/Copyright';
import Avatar from '@mui/material/Avatar';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from '../../../i18n/LanguageContext';
import './Sidebar.css';
import { useSnackbar } from 'notistack';
import { logoutUser } from '../../../actions/userAction';
import { useSiteConfig } from '../../../context/SiteConfigContext';

// Grouped navigation — mirrors the storefront's warm palette (deep brown rail,
// orange accent for the active item) and keeps related tools together so the
// desktop sidebar reads like a proper admin console instead of a flat list.
const Sidebar = ({ setToggleSidebar }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const { enqueueSnackbar } = useSnackbar();
    const { t } = useTranslation();
    const { user } = useSelector((state) => state.user);
    const { config, ready } = useSiteConfig();
    const [unreadChat, setUnreadChat] = useState(0);

    useEffect(() => {
        let cancelled = false;
        const fetchUnread = async () => {
            try {
                const { data } = await axios.get('/api/v1/admin/chat/conversations', { headers: { Accept: 'application/json' } });
                if (cancelled) return;
                const total = (data.conversations || []).reduce((s, c) => s + (c.unreadAdmin || 0), 0);
                setUnreadChat(total);
            } catch (e) { /* ignore */ }
        };
        fetchUnread();
        const id = setInterval(fetchUnread, 15000);
        return () => { cancelled = true; clearInterval(id); };
    }, []);
    // Blank until the real site name arrives — never flash the placeholder.
    const siteName = ready ? (config?.branding?.name || 'Admin') : '';

    const handleLogout = () => {
        dispatch(logoutUser());
        enqueueSnackbar(t('logout'), { variant: 'success' });
        navigate('/login');
    };

    const navSections = [
        {
            title: null,
            items: [
                { icon: <HomeIcon />,        label: t('view_store'), ref: '/',                id: 'home' },
                { icon: <EqualizerIcon />,   label: t('dashboard'),  ref: '/admin/dashboard', id: 'dashboard' },
            ],
        },
        {
            title: 'Sales',
            items: [
                { icon: <ShoppingBagIcon />, label: t('orders'),  ref: '/admin/orders', id: 'orders' },
                { icon: <ReviewsIcon />,     label: t('reviews'), ref: '/admin/reviews', id: 'reviews' },
            ],
        },
        {
            title: 'Catalogue',
            items: [
                { icon: <InventoryIcon />,   label: t('products'),    ref: '/admin/products',    id: 'products' },
                { icon: <AddBoxIcon />,      label: t('add_product'), ref: '/admin/new_product', id: 'add_product' },
                { icon: <CategoryIcon />,    label: t('categories'),  ref: '/admin/categories',  id: 'categories' },
                { icon: <LocalFireDepartmentIcon />, label: t('flash_sale', 'Flash Sale'), ref: '/admin/flash_sale', id: 'flash_sale' },
            ],
        },
        {
            title: 'Customers',
            items: [
                { icon: <GroupIcon />,       label: t('users'),      ref: '/admin/users', id: 'users' },
                { icon: <ChatBubbleIcon />,  label: t('chat_inbox'), ref: '/admin/chat',  id: 'chat_inbox' },
            ],
        },
        {
            title: 'System',
            items: [
                { icon: <SettingsIcon />,    label: t('config'),             ref: '/admin/config',   id: 'config' },
                { icon: <StorageIcon />,     label: 'Database',              ref: '/admin/database', id: 'database' },
                { icon: <AccountBoxIcon />,  label: t('my_profile'),         ref: '/account',        id: 'my_profile' },
            ],
        },
    ];

    // Path-based highlight so the menu stays correct even if entries are added
    // or removed (e.g. the Orders pages were merged into a single page).
    const itemActive = (id) => {
        if (id === 'dashboard')  return pathname === '/admin' || pathname === '/admin/dashboard';
        if (id === 'orders')     return pathname.startsWith('/admin/orders') || pathname.startsWith('/admin/order/') || pathname.startsWith('/admin/store_orders');
        if (id === 'products')   return pathname.startsWith('/admin/product') && !pathname.startsWith('/admin/products/new');
        if (id === 'add_product')return pathname.startsWith('/admin/new_product');
        if (id === 'users')      return pathname.startsWith('/admin/user');
        if (id === 'reviews')    return pathname.startsWith('/admin/reviews');
        if (id === 'chat_inbox') return pathname.startsWith('/admin/chat');
        if (id === 'categories') return pathname.startsWith('/admin/categories');
        if (id === 'flash_sale') return pathname.startsWith('/admin/flash_sale');
        if (id === 'config')     return pathname.startsWith('/admin/config') || pathname.startsWith('/admin/homepage');
        if (id === 'database')   return pathname.startsWith('/admin/database');
        if (id === 'my_profile') return pathname.startsWith('/account');
        return false;
    };

    const renderItem = ({ icon, label, ref, id }) => {
        const isActive = itemActive(id);
        return (
            <Link
                key={id}
                to={ref}
                className={`group relative flex items-center gap-3 pl-3 pr-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                    isActive ? 'admin-nav-active' : 'text-white/60 hover:text-white hover:bg-white/[0.06]'
                }`}
                style={isActive ? { background: 'linear-gradient(90deg, rgba(232,75,15,0.95), rgba(232,75,15,0.75))' } : undefined}
            >
                {/* active indicator bar */}
                <span
                    className={`absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full transition-opacity ${
                        isActive ? 'opacity-100' : 'opacity-0'
                    }`}
                    style={{ backgroundColor: '#fff' }}
                />
                <span
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        isActive ? 'bg-white/20 text-white' : 'bg-white/[0.06] text-white/70 group-hover:bg-white/10 group-hover:text-white'
                    }`}
                >
                    {icon}
                </span>
                <span className="truncate">{label}</span>
                {id === 'chat_inbox' && unreadChat > 0 && (
                    <span className="ml-auto shrink-0 min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full flex items-center justify-center shadow-sm">
                        {unreadChat > 9 ? '9+' : unreadChat}
                    </span>
                )}
            </Link>
        );
    };

    return (
        <aside
            className="sidebar z-50 sm:z-0 block min-h-screen fixed left-0 pb-14 max-h-screen w-3/4 sm:w-72 overflow-x-hidden overflow-y-auto"
            style={{
                background: 'linear-gradient(160deg, #2D1B0E 0%, #1a0e08 100%)',
                borderRight: '1px solid rgba(232,75,15,0.15)',
            }}
        >
            {/* Profile card */}
            <div
                className="flex items-center gap-3 m-4 p-3 rounded-2xl"
                style={{ backgroundColor: 'rgba(232,75,15,0.15)', border: '1px solid rgba(232,75,15,0.25)' }}
            >
                <Avatar
                    alt="Avatar"
                    src={user?.avatar?.url}
                    sx={{ width: 40, height: 40 }}
                />
                <div className="flex flex-col gap-0 min-w-0 flex-1">
                    <span className="font-semibold text-sm truncate text-white">{user?.name}</span>
                    <span className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.5)' }}>{user?.email}</span>
                </div>
                {setToggleSidebar && (
                    <button
                        onClick={() => setToggleSidebar(false)}
                        className="sm:hidden rounded-full w-8 h-8 flex items-center justify-center shrink-0"
                        style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
                    >
                        <CloseIcon sx={{ fontSize: '18px' }} />
                    </button>
                )}
            </div>

            {/* Nav sections */}
            <nav className="flex flex-col gap-4 px-3 py-1">
                {navSections.map((section, si) => (
                    <div key={section.title || `section-${si}`} className="flex flex-col gap-0.5">
                        {section.title && (
                            <p
                                className="px-3 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-[0.14em]"
                                style={{ color: 'rgba(255,255,255,0.35)' }}
                            >
                                {section.title}
                            </p>
                        )}
                        {section.items.map(renderItem)}
                    </div>
                ))}
            </nav>

            {/* Logout — pinned at the bottom of the group list */}
            <div className="px-3 pt-3">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 pl-3 pr-4 py-2.5 rounded-xl text-sm font-medium text-red-400 transition-all duration-150 hover:bg-red-500/10"
                >
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-red-500/10">
                        <LogoutIcon sx={{ fontSize: '18px' }} />
                    </span>
                    <span>{t('logout')}</span>
                </button>
            </div>

            {/* Footer credit */}
            <div
                className="mx-4 mb-6 mt-5 p-3 rounded-2xl text-center"
                style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
                <h5 className="font-semibold text-xs text-white">{siteName} Admin</h5>
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    <CopyrightIcon sx={{ fontSize: '11px', verticalAlign: 'middle', marginRight: '3px' }} />{new Date().getFullYear()} · {t('all_rights')}
                </span>
            </div>
        </aside>
    );
};

export default Sidebar;
