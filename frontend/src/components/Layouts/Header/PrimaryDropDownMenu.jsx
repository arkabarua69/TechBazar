import React from 'react';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import OfflineBoltIcon from '@mui/icons-material/OfflineBolt';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ChatIcon from '@mui/icons-material/Chat';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import DashboardIcon from '@mui/icons-material/Dashboard';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useSnackbar } from 'notistack';
import { logoutUser } from '../../../actions/userAction';

const PrimaryDropDownMenu = ({ setTogglePrimaryDropDown, user }) => {

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();

    const { wishlistItems } = useSelector((state) => state.wishlist);

    const handleLogout = () => {
        dispatch(logoutUser());
        navigate("/login");
        enqueueSnackbar("Logout Successfully", { variant: "success" });
        setTogglePrimaryDropDown(false);
    }

    const navs = [
        {
            title: "Supercoin Zone",
            icon: <OfflineBoltIcon sx={{ fontSize: "18px" }} />,
            redirect: "/",
        },
        {
            title: "TechBazar Plus Zone",
            icon: <AddCircleIcon sx={{ fontSize: "18px" }} />,
            redirect: "/",
        },
        {
            title: "Orders",
            icon: <ShoppingBagIcon sx={{ fontSize: "18px" }} />,
            redirect: "/orders",
        },
        {
            title: "Wishlist",
            icon: <FavoriteIcon sx={{ fontSize: "18px" }} />,
            redirect: "/wishlist",
        },
        {
            title: "My Chats",
            icon: <ChatIcon sx={{ fontSize: "18px" }} />,
            redirect: "/",
        },
        {
            title: "Coupons",
            icon: <ConfirmationNumberIcon sx={{ fontSize: "18px" }} />,
            redirect: "/",
        },
        {
            title: "Gift Cards",
            icon: <AccountBalanceWalletIcon sx={{ fontSize: "18px" }} />,
            redirect: "/",
        },
        {
            title: "Notifications",
            icon: <NotificationsIcon sx={{ fontSize: "18px" }} />,
            redirect: "/",
        },
    ]

    return (
        <div
            className="absolute w-60 -left-24 ml-2 top-9 rounded-2xl shadow-xl flex-col text-sm overflow-hidden"
            style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                boxShadow: '0 16px 40px rgba(232,75,15,0.15)',
            }}
        >
            {user.role === 'admin' &&
                <Link
                    className="flex gap-3 items-center px-4 py-2.5 text-sm font-medium transition-colors"
                    style={{ color: 'var(--color-text-primary)' }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-accent-light,#fff0eb)'; e.currentTarget.style.color = 'var(--color-accent)'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = 'var(--color-text-primary)'; }}
                    to="/admin/dashboard"
                >
                    <span style={{ color: 'var(--color-accent)' }}><DashboardIcon sx={{ fontSize: '18px' }} /></span>
                    Admin Dashboard
                </Link>
            }

            <Link
                className="flex gap-3 items-center px-4 py-2.5 text-sm font-medium transition-colors"
                style={{ color: 'var(--color-text-primary)' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-accent-light,#fff0eb)'; e.currentTarget.style.color = 'var(--color-accent)'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = 'var(--color-text-primary)'; }}
                to="/account"
            >
                <span style={{ color: 'var(--color-accent)' }}><AccountCircleIcon sx={{ fontSize: '18px' }} /></span>
                My Profile
            </Link>

            {navs.map((item, i) => {
                const { title, icon, redirect } = item;
                return (
                    <Link
                        className="flex gap-3 items-center px-4 py-2.5 text-sm font-medium transition-colors"
                        style={{ color: 'var(--color-text-primary)' }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-accent-light,#fff0eb)'; e.currentTarget.style.color = 'var(--color-accent)'; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = 'var(--color-text-primary)'; }}
                        to={redirect}
                        key={i}
                    >
                        <span style={{ color: 'var(--color-accent)' }}>{icon}</span>
                        {title}
                        {title === 'Wishlist' && (
                            <span className="ml-auto mr-3 text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
                                {wishlistItems.length}
                            </span>
                        )}
                    </Link>
                );
            })}

            <div
                className="flex gap-3 items-center px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer"
                style={{ color: 'var(--color-text-primary)' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#fff0eb'; e.currentTarget.style.color = 'var(--color-accent)'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = 'var(--color-text-primary)'; }}
                onClick={handleLogout}
            >
                <span style={{ color: 'var(--color-accent)' }}><PowerSettingsNewIcon sx={{ fontSize: '18px' }} /></span>
                Logout
            </div>

            <div className="absolute right-1/2 -top-2.5">
                <div className="arrow_down"></div>
            </div>
        </div>
    );
};

export default PrimaryDropDownMenu;
