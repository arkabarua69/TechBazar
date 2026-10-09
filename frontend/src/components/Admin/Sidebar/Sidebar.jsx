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
import CloseIcon from '@mui/icons-material/Close';
import Avatar from '@mui/material/Avatar';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from '../../../i18n/LanguageContext';
import LanguageToggle from '../LanguageToggle';
import './Sidebar.css';
import { useSnackbar } from 'notistack';
import { logoutUser } from '../../../actions/userAction';

const Sidebar = ({ activeTab, setToggleSidebar }) => {

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const { t } = useTranslation();

    const { user } = useSelector((state) => state.user);

    const handleLogout = () => {
        dispatch(logoutUser());
        enqueueSnackbar(t('logout'), { variant: "success" });
        navigate("/login");
    }

    // nav items use an internal `id` for logic (logout) and a translated `label`
    const navMenu = [
        { icon: <EqualizerIcon />, label: t('dashboard'), ref: "/admin/dashboard", id: 'dashboard' },
        { icon: <ShoppingBagIcon />, label: t('orders'), ref: "/admin/orders", id: 'orders' },
        { icon: <InventoryIcon />, label: t('products'), ref: "/admin/products", id: 'products' },
        { icon: <AddBoxIcon />, label: t('add_product'), ref: "/admin/new_product", id: 'add_product' },
        { icon: <GroupIcon />, label: t('users'), ref: "/admin/users", id: 'users' },
        { icon: <ReviewsIcon />, label: t('reviews'), ref: "/admin/reviews", id: 'reviews' },
        { icon: <ShoppingBagIcon />, label: t('store_orders'), ref: "/admin/store_orders", id: 'store_orders' },
        { icon: <AddBoxIcon />, label: t('homepage'), ref: "/admin/homepage", id: 'homepage' },
        { icon: <ChatBubbleIcon />, label: t('chat_inbox'), ref: "/admin/chat", id: 'chat_inbox' },
        { icon: <AccountBoxIcon />, label: t('my_profile'), ref: "/account", id: 'my_profile' },
        { icon: <LogoutIcon />, label: t('logout'), id: 'logout' },
    ];

    return (
        <aside className="sidebar z-50 sm:z-0 block min-h-screen fixed left-0 pb-14 max-h-screen w-3/4 sm:w-72 bg-white text-gray-900 overflow-x-hidden border-r border-gray-200">
            {/* black profile card */}
            <div className="flex items-center gap-3 bg-[#0A0A0A] text-white p-3 rounded-2xl shadow-sm my-4 mx-3.5">
                <Avatar
                    alt="Avatar"
                    src={user?.avatar?.url}
                />
                <div className="flex flex-col gap-0 min-w-0">
                    <span className="font-semibold text-sm sm:text-base truncate">{user?.name}</span>
                    <span className="text-gray-400 text-xs truncate">{user?.email}</span>
                </div>
                {setToggleSidebar && (
                    <button
                        onClick={() => setToggleSidebar(false)}
                        className="sm:hidden bg-white/10 ml-auto rounded-full w-9 h-9 flex items-center justify-center shrink-0"
                    >
                        <CloseIcon />
                    </button>
                )}
            </div>

            {/* bilingual language toggle (default = English on first load) */}
            <LanguageToggle />

            {/* nav — active item = black pill */}
            <div className="flex flex-col w-full gap-1 my-6">
                {navMenu.map((item, index) => {
                    const { icon, label, ref, id } = item;
                    return (
                        <div key={id}>
                            {id === 'logout' ? (
                                <button
                                    onClick={handleLogout}
                                    className="mx-3 flex gap-3 items-center py-2.5 px-4 rounded-xl font-medium text-red-600 hover:bg-red-50 transition-colors"
                                >
                                    <span>{icon}</span>
                                    <span>{label}</span>
                                </button>
                            ) : (
                                <Link
                                    to={ref}
                                    className={`mx-3 ${
                                        activeTab === index
                                            ? "bg-black text-white shadow-sm"
                                            : "text-gray-600 hover:bg-gray-100"
                                    } flex gap-3 items-center py-2.5 px-4 rounded-xl font-medium transition-colors`}
                                >
                                    <span>{icon}</span>
                                    <span>{label}</span>
                                </Link>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="flex flex-col gap-1 bg-gray-100 p-3 rounded-2xl mb-6 mt-10 mx-3.5 overflow-hidden text-center">
                <h5 className="font-semibold text-gray-900 text-sm">{t('admin_title')}</h5>
                <span className="text-gray-500 text-xs">
                    © {new Date().getFullYear()} · {t('all_rights')}
                </span>
            </div>
        </aside>
    );
};

export default Sidebar;
