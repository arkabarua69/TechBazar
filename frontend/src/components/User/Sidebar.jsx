import { useDispatch, useSelector } from 'react-redux';
import FolderIcon from '@mui/icons-material/Folder';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import PersonIcon from '@mui/icons-material/Person';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ChatIcon from '@mui/icons-material/Chat';
import FolderSharedIcon from '@mui/icons-material/FolderShared';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { Link, useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { logoutUser } from '../../actions/userAction';

const Sidebar = ({ activeTab }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const { user } = useSelector((state) => state.user);

    const handleLogout = () => {
        dispatch(logoutUser());
        enqueueSnackbar('Logged out successfully', { variant: 'success' });
        navigate('/login');
    };

    const activeClass = 'font-semibold border-l-4';
    const hoverBase = 'p-3 pl-14 text-sm transition-colors duration-150';

    return (
        <div className="hidden sm:flex flex-col gap-4 w-1/4 px-1">
            {/* Profile card */}
            <div className="surface p-4 flex items-center gap-3">
                <div
                    className="w-12 h-12 rounded-full overflow-hidden text-white font-bold text-sm flex items-center justify-center shrink-0"
                    style={{ background: 'linear-gradient(135deg, var(--color-accent), var(--accent-dark))' }}
                >
                    {user?.avatar?.url ? (
                        <img draggable="false" className="h-full w-full object-cover" src={user.avatar.url} alt="Avatar" />
                    ) : (
                        (user?.name || '?').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
                    )}
                </div>
                <div className="flex flex-col gap-0.5">
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Hello,</p>
                    <h2 className="font-bold text-sm" style={{ color: 'var(--color-text-primary)' }}>{user?.name}</h2>
                </div>
            </div>

            {/* Nav tiles */}
            <div className="surface overflow-hidden">
                {/* Orders */}
                <div className="flex items-center gap-4 px-4 py-3.5 border-b" style={{ borderColor: 'var(--color-border)' }}>
                    <FolderIcon sx={{ color: 'var(--color-accent)', fontSize: 20 }} />
                    <Link to="/orders"
                        className="flex w-full justify-between text-sm font-semibold"
                        style={{ color: 'var(--color-text-primary)' }}>
                        MY ORDERS <ChevronRightIcon sx={{ fontSize: 18, color: 'var(--color-text-muted)' }} />
                    </Link>
                </div>

                {/* Account settings */}
                <div className="flex items-center gap-4 px-4 py-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <PersonIcon sx={{ color: 'var(--color-accent)', fontSize: 20 }} />
                    <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Account Settings</p>
                </div>
                <div className="flex flex-col pb-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
                    <Link to="/account"
                        className={`${hoverBase} ${activeTab === 'profile' ? activeClass : ''}`}
                        style={{
                            color: activeTab === 'profile' ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                            borderLeftColor: activeTab === 'profile' ? 'var(--color-accent)' : 'transparent',
                            backgroundColor: activeTab === 'profile' ? 'var(--accent-06)' : 'transparent',
                        }}>
                        Profile Information
                    </Link>
                    <div className={`${hoverBase} flex items-center justify-between`}
                        style={{ color: 'var(--color-text-muted)', cursor: 'not-allowed' }}>
                        Manage Addresses
                        <span className="text-[10px] font-bold uppercase tracking-wider rounded px-1.5 py-0.5"
                            style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text-muted)' }}>Soon</span>
                    </div>
                </div>

                {/* Payments */}
                <div className="flex items-center gap-4 px-4 py-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <AccountBalanceWalletIcon sx={{ color: 'var(--color-accent)', fontSize: 20 }} />
                    <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Payments</p>
                </div>
                <div className="flex flex-col pb-3 border-b" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)', cursor: 'not-allowed' }}>
                    <div className={`${hoverBase} flex items-center justify-between`}>Gift Cards <span className="font-medium" style={{ color: 'var(--color-success)' }}>Tk 0</span></div>
                    <div className={hoverBase}>Saved UPI</div>
                    <div className={hoverBase}>Saved Cards</div>
                </div>

                {/* Chats */}
                <div className="flex items-center gap-4 px-4 py-3.5 border-b" style={{ borderColor: 'var(--color-border)', cursor: 'not-allowed' }}>
                    <ChatIcon sx={{ color: 'var(--color-text-muted)', fontSize: 20 }} />
                    <div className="flex w-full justify-between text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                        MY CHATS
                        <span className="text-[10px] font-bold uppercase rounded px-1.5 py-0.5"
                            style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text-muted)' }}>Soon</span>
                    </div>
                </div>

                {/* My Stuff */}
                <div className="flex items-center gap-4 px-4 py-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <FolderSharedIcon sx={{ color: 'var(--color-accent)', fontSize: 20 }} />
                    <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>My Stuff</p>
                </div>
                <div className="flex flex-col pb-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
                    <Link to="/wishlist"
                        className={`${hoverBase} flex items-center gap-2 ${activeTab === 'wishlist' ? activeClass : ''}`}
                        style={{
                            color: activeTab === 'wishlist' ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                            borderLeftColor: activeTab === 'wishlist' ? 'var(--color-accent)' : 'transparent',
                            backgroundColor: activeTab === 'wishlist' ? 'var(--accent-06)' : 'transparent',
                        }}>
                        <FavoriteIcon sx={{ fontSize: 16 }} /> My Wishlist
                    </Link>
                </div>

                {/* Logout */}
                <div className="flex items-center gap-4 px-4 py-3.5 cursor-pointer group" onClick={handleLogout}>
                    <PowerSettingsNewIcon sx={{ color: 'var(--color-accent)', fontSize: 20 }} />
                    <div className="flex w-full justify-between text-sm font-semibold"
                        style={{ color: 'var(--color-text-primary)' }}>
                        Logout <ChevronRightIcon sx={{ fontSize: 18, color: 'var(--color-text-muted)' }} />
                    </div>
                </div>
            </div>

            {/* Frequently visited */}
            <div className="surface p-4 flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                    Frequently Visited:
                </span>
                <div className="flex gap-3 text-xs flex-wrap" style={{ color: 'var(--color-text-secondary)' }}>
                    <Link className="hover:underline" style={{ color: 'var(--color-accent)' }} to="/account?tab=security">Change Password</Link>
                    <Link className="hover:underline" style={{ color: 'var(--color-accent)' }} to="/orders">Track Order</Link>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
