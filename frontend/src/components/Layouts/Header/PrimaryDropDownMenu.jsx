import React from 'react';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import FavoriteIcon from '@mui/icons-material/Favorite';
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

    // Real destinations only — Flipkart-template placeholders (Supercoin,
    // Plus Zone, My Chats, Coupons, Gift Cards, Notifications) were removed.
    const navs = [
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
    ]

    return (
        <div
            className="absolute w-60 right-0 mt-2 rounded-2xl shadow-xl flex-col text-sm overflow-hidden"
            style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                boxShadow: '0 16px 40px var(--accent-15)',
            }}
        >
            {/* Account header — avatar + name + email */}
            <div
                className="flex items-center gap-3 px-4 py-3"
                style={{ borderBottom: '1px solid var(--color-border)' }}
            >
                <div
                    className="w-10 h-10 rounded-full overflow-hidden shrink-0 flex items-center justify-center"
                    style={{ backgroundColor: 'var(--color-bg)' }}
                >
                    {user?.avatar?.url ? (
                        <img src={user.avatar.url} alt={user.name} className="w-full h-full object-cover" draggable="false" />
                    ) : (
                        <AccountCircleIcon sx={{ fontSize: '28px', color: 'var(--color-accent)' }} />
                    )}
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
                        {user?.name || 'My Account'}
                    </p>
                    {user?.email && (
                        <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>
                            {user.email}
                        </p>
                    )}
                </div>
            </div>

            {user?.role === 'admin' &&
                <Link
                    className="flex gap-3 items-center px-4 py-2.5 text-sm font-medium transition-colors"
                    style={{ color: 'var(--color-text-primary)' }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-accent-light)'; e.currentTarget.style.color = 'var(--color-accent)'; }}
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
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-accent-light)'; e.currentTarget.style.color = 'var(--color-accent)'; }}
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
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-accent-light)'; e.currentTarget.style.color = 'var(--color-accent)'; }}
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
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-accent-light)'; e.currentTarget.style.color = 'var(--color-accent)'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = 'var(--color-text-primary)'; }}
                onClick={handleLogout}
            >
                <span style={{ color: 'var(--color-accent)' }}><PowerSettingsNewIcon sx={{ fontSize: '18px' }} /></span>
                Logout
            </div>

            <div className="absolute right-8 -top-2.5">
                <div className="arrow_down"></div>
            </div>
        </div>
    );
};

export default PrimaryDropDownMenu;
