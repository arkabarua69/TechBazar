import { Link, useNavigate } from 'react-router-dom';
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
import StorageIcon from '@mui/icons-material/Storage';
import CloseIcon from '@mui/icons-material/Close';
import Avatar from '@mui/material/Avatar';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from '../../../i18n/LanguageContext';
import LanguageToggle from '../LanguageToggle';
import './Sidebar.css';
import { useSnackbar } from 'notistack';
import { logoutUser } from '../../../actions/userAction';
import { useSiteConfig } from '../../../context/SiteConfigContext';

const Sidebar = ({ activeTab, setToggleSidebar }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const { t } = useTranslation();
    const { user } = useSelector((state) => state.user);
    const { config } = useSiteConfig();
    const siteName = config?.branding?.name || 'Admin';

    const handleLogout = () => {
        dispatch(logoutUser());
        enqueueSnackbar(t('logout'), { variant: 'success' });
        navigate('/login');
    };

    const navMenu = [
        { icon: <EqualizerIcon />,   label: t('dashboard'),    ref: '/admin/dashboard',    id: 'dashboard' },
        { icon: <ShoppingBagIcon />, label: t('orders'),       ref: '/admin/orders',       id: 'orders' },
        { icon: <InventoryIcon />,   label: t('products'),     ref: '/admin/products',     id: 'products' },
        { icon: <AddBoxIcon />,      label: t('add_product'),  ref: '/admin/new_product',  id: 'add_product' },
        { icon: <GroupIcon />,       label: t('users'),        ref: '/admin/users',        id: 'users' },
        { icon: <ReviewsIcon />,     label: t('reviews'),      ref: '/admin/reviews',      id: 'reviews' },
        { icon: <ShoppingBagIcon />, label: t('store_orders'), ref: '/admin/store_orders', id: 'store_orders' },
        { icon: <ChatBubbleIcon />,  label: t('chat_inbox'),   ref: '/admin/chat',         id: 'chat_inbox' },
        { icon: <SettingsIcon />,    label: t('config'),       ref: '/admin/config',       id: 'config' },
        { icon: <StorageIcon />,     label: 'Database',        ref: '/admin/database',     id: 'database' },
        { icon: <AccountBoxIcon />,  label: t('my_profile'),   ref: '/account',            id: 'my_profile' },
        { icon: <LogoutIcon />,      label: t('logout'),                                   id: 'logout' },
    ];

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

            {/* Language toggle */}
            <div className="px-4 mb-2">
                <LanguageToggle />
            </div>

            {/* Nav items */}
            <nav className="flex flex-col gap-0.5 px-3 py-2">
                {navMenu.map((item, index) => {
                    const { icon, label, ref, id } = item;

                    if (id === 'logout') {
                        return (
                            <button
                                key={id}
                                onClick={handleLogout}
                                className="flex gap-3 items-center py-2.5 px-4 rounded-xl font-medium text-sm transition-all duration-150"
                                style={{ color: '#f87171' }}
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(248,113,113,0.1)'}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <span>{icon}</span>
                                <span>{label}</span>
                            </button>
                        );
                    }

                    const isActive = activeTab === index;
                    return (
                        <Link
                            key={id}
                            to={ref}
                            className="flex gap-3 items-center py-2.5 px-4 rounded-xl font-medium text-sm transition-all duration-150"
                            style={
                                isActive
                                    ? { backgroundColor: 'var(--color-accent)', color: '#fff' }
                                    : { color: 'rgba(255,255,255,0.65)' }
                            }
                            onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(232,75,15,0.15)'; }}
                            onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
                        >
                            <span>{icon}</span>
                            <span>{label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Footer credit */}
            <div
                className="mx-4 mb-6 mt-6 p-3 rounded-2xl text-center"
                style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
                <h5 className="font-semibold text-xs text-white">{siteName} Admin</h5>
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    © {new Date().getFullYear()} · {t('all_rights')}
                </span>
            </div>
        </aside>
    );
};

export default Sidebar;
