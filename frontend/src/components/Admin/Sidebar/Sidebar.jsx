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
import './Sidebar.css';
import { useSnackbar } from 'notistack';
import { logoutUser } from '../../../actions/userAction';

const navMenu = [
    {
        icon: <EqualizerIcon />,
        label: "Dashboard",
        ref: "/admin/dashboard",
    },
    {
        icon: <ShoppingBagIcon />,
        label: "Orders",
        ref: "/admin/orders",
    },
    {
        icon: <InventoryIcon />,
        label: "Products",
        ref: "/admin/products",
    },
    {
        icon: <AddBoxIcon />,
        label: "Add Product",
        ref: "/admin/new_product",
    },
    {
        icon: <GroupIcon />,
        label: "Users",
        ref: "/admin/users",
    },
    {
        icon: <ReviewsIcon />,
        label: "Reviews",
        ref: "/admin/reviews",
    },
    {
        icon: <ShoppingBagIcon />,
        label: "Store Orders",
        ref: "/admin/store_orders",
    },
    {
        icon: <AddBoxIcon />,
        label: "Homepage",
        ref: "/admin/homepage",
    },
    {
        icon: <ChatBubbleIcon />,
        label: "Chat Inbox",
        ref: "/admin/chat",
    },
    {
        icon: <AccountBoxIcon />,
        label: "My Profile",
        ref: "/account",
    },
    {
        icon: <LogoutIcon />,
        label: "Logout",
    },
];

const Sidebar = ({ activeTab, setToggleSidebar }) => {

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();

    const { user } = useSelector((state) => state.user);

    const handleLogout = () => {
        dispatch(logoutUser());
        enqueueSnackbar("Logout Successfully", { variant: "success" });
        navigate("/login");
    }

    return (
        <aside className="sidebar z-50 sm:z-0 block min-h-screen fixed left-0 pb-14 max-h-screen w-3/4 sm:w-72 bg-white text-gray-900 overflow-x-hidden border-r border-gray-200">
            {/* black profile card */}
            <div className="flex items-center gap-3 bg-[#0A0A0A] text-white p-3 rounded-2xl shadow-sm my-4 mx-3.5">
                <Avatar
                    alt="Avatar"
                    src={user.avatar?.url}
                />
                <div className="flex flex-col gap-0 min-w-0">
                    <span className="font-semibold text-sm sm:text-base truncate">{user.name}</span>
                    <span className="text-gray-400 text-xs truncate">{user.email}</span>
                </div>
                <button onClick={()=>setToggleSidebar(false)} className="sm:hidden bg-white/10 ml-auto rounded-full w-9 h-9 flex items-center justify-center shrink-0">
                    <CloseIcon/>
                </button>
            </div>

            {/* nav — active item = black pill */}
            <div className="flex flex-col w-full gap-1 my-6">
                {navMenu.map((item, index) => {
                    const { icon, label, ref } = item;
                    return (
                        <>
                            {label === "Logout" ? (
                                <button onClick={handleLogout} className="mx-3 flex gap-3 items-center py-2.5 px-4 rounded-xl font-medium text-red-600 hover:bg-red-50 transition-colors">
                                    <span>{icon}</span>
                                    <span>{label}</span>
                                </button>
                            ) : (
                                <Link to={ref} className={`mx-3 ${activeTab === index ? "bg-black text-white shadow-sm" : "text-gray-600 hover:bg-gray-100"} flex gap-3 items-center py-2.5 px-4 rounded-xl font-medium transition-colors`}>
                                    <span>{icon}</span>
                                    <span>{label}</span>
                                </Link>
                            )}
                        </>
                    )
                }
                )}
            </div>

            <div className="flex flex-col gap-1 bg-gray-100 p-3 rounded-2xl mb-6 mt-10 mx-3.5 overflow-hidden text-center">
                <h5 className="font-semibold text-gray-900 text-sm">TechBazar Admin</h5>
                <span className="text-gray-500 text-xs">© {new Date().getFullYear()} · All rights reserved</span>
            </div>
        </aside>
    )
};

export default Sidebar;
