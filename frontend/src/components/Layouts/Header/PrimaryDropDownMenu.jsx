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
        <div className="absolute w-60 -left-24 ml-2 top-9 surface rounded-xl shadow-lg flex-col text-sm overflow-hidden">

            {user.role === "admin" &&
                <Link className="flex gap-3 items-center px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-primary-accent" to="/admin/dashboard">
                    <span className="text-primary-accent"><DashboardIcon sx={{ fontSize: "18px" }} /></span>
                    Admin Dashboard
                </Link>
            }

            <Link className="flex gap-3 items-center px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-primary-accent" to="/account">
                <span className="text-primary-accent"><AccountCircleIcon sx={{ fontSize: "18px" }} /></span>
                My Profile
            </Link>

            {navs.map((item, i) => {
                const { title, icon, redirect } = item;

                return (
                    <>
                        {title === "Wishlist" ? (
                            <Link className="flex gap-3 items-center px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-primary-accent" to={redirect} key={i}>
                                <span className="text-primary-accent">{icon}</span>
                                {title}
                                <span className="ml-auto mr-3 bg-cloud p-0.5 px-2 text-slate-500 font-semibold rounded-full">
                                    {wishlistItems.length}
                                </span>
                            </Link>
                        ) : (
                            <Link className="flex gap-3 items-center px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-primary-accent" to={redirect} key={i}>
                                <span className="text-primary-accent">{icon}</span>
                                {title}
                            </Link>
                        )}
                    </>
                )
            })}

            <div className="flex gap-3 items-center px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-primary-accent cursor-pointer" onClick={handleLogout} >
                <span className="text-primary-accent"><PowerSettingsNewIcon sx={{ fontSize: "18px" }} /></span>
                Logout
            </div>

            <div className="absolute right-1/2 -top-2.5">
                <div className="arrow_down"></div>
            </div>
        </div>
    );
};

export default PrimaryDropDownMenu;
