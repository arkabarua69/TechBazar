import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import Loader from '../Layouts/Loader';
import MetaData from '../Layouts/MetaData';
import { logoutUser } from '../../actions/userAction';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { useSiteConfig } from '../../context/SiteConfigContext';
import ShieldIcon from '@mui/icons-material/Shield';
import FolderIcon from '@mui/icons-material/Folder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import KeyIcon from '@mui/icons-material/Key';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ChatIcon from '@mui/icons-material/Chat';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import RateReviewIcon from '@mui/icons-material/RateReview';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import EditIcon from '@mui/icons-material/Edit';
import { DEFAULT_SITE_CONFIG } from '../../utils/siteConfig';

const Account = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const { user, loading, isAuthenticated } = useSelector((state) => state.user);
    const { config } = useSiteConfig();
    const faqs = config.content?.faqs || DEFAULT_SITE_CONFIG.content.faqs;
    const brandName = config?.branding?.name || 'Store';

    useEffect(() => {
        if (isAuthenticated === false) navigate('/login');
    }, [isAuthenticated, navigate]);

    const handleLogout = () => {
        dispatch(logoutUser());
        enqueueSnackbar('Logged out successfully', { variant: 'success' });
        navigate('/login');
    };

    if (loading || !user) return <Loader />;

    const getInitials = () =>
        user.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

    const getMemberSince = () =>
        new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const getCompleteness = () => {
        let score = 0;
        if (user.name) score += 25;
        if (user.email) score += 25;
        if (user.gender) score += 25;
        if (user.avatar?.url) score += 25;
        return score;
    };
    const completeness = getCompleteness();

    /* Reusable section card with brand theme */
    const SectionCard = ({ icon, title, description, to }) => (
        <Link to={to} className="surface p-4 sm:p-5 flex flex-col gap-2 hover:shadow-md hover:-translate-y-0.5 transition duration-200 group">
            <div className="flex items-center justify-between">
                <span style={{ color: 'var(--color-accent)' }} className="text-2xl">{icon}</span>
                <ChevronRightIcon sx={{ color: 'var(--color-border)', fontSize: 20 }} className="group-hover:translate-x-0.5 transition duration-200" />
            </div>
            <p className="font-semibold text-sm sm:text-base" style={{ color: 'var(--color-text-primary)' }}>{title}</p>
            <p className="text-xs leading-snug" style={{ color: 'var(--color-text-secondary)' }}>{description}</p>
        </Link>
    );

    const SoonCard = ({ icon, title, description }) => (
        <div className="surface p-4 sm:p-5 flex flex-col gap-2 opacity-60">
            <div className="flex items-center justify-between">
                <span style={{ color: 'var(--color-text-muted)' }} className="text-2xl">{icon}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider rounded px-1.5 py-0.5"
                    style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text-muted)' }}>Soon</span>
            </div>
            <p className="font-semibold text-sm sm:text-base" style={{ color: 'var(--color-text-primary)' }}>{title}</p>
            <p className="text-xs leading-snug" style={{ color: 'var(--color-text-secondary)' }}>{description}</p>
        </div>
    );

    return (
        <>
            <MetaData title="My Account" />

            {/* ── Hero band — brand orange gradient (not blue) ── */}
            <section style={{ background: 'linear-gradient(135deg, var(--color-accent) 0%, #c63e0a 60%, #a33408 100%)' }}>
                <div className="mx-auto max-w-4xl px-5 sm:px-6 py-8 sm:py-10">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-6">
                        {/* Avatar */}
                        {user.avatar?.url ? (
                            <img draggable="false"
                                className="h-20 w-20 sm:h-24 sm:w-24 rounded-full object-cover ring-4 ring-white/30 shadow-lg shrink-0"
                                src={user.avatar.url} alt={user.name} />
                        ) : (
                            <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full ring-4 ring-white/30 shadow-lg shrink-0 bg-white/15 text-white font-bold text-2xl sm:text-3xl flex items-center justify-center select-none">
                                {getInitials()}
                            </div>
                        )}

                        <div className="flex-1 min-w-0">
                            <p className="text-white/70 text-sm">Hello,</p>
                            <h1 className="font-bold text-xl sm:text-3xl text-white leading-tight truncate">{user.name}</h1>
                            <p className="text-white/80 text-sm mt-0.5 truncate">{user.email}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-3">
                                <span className="text-[10px] font-bold uppercase tracking-wider bg-white/15 border border-white/20 text-white rounded-full px-2.5 py-1">
                                    {user.role === 'admin' ? 'Admin' : 'Member'}
                                </span>
                                <span className="flex items-center gap-1.5 text-xs text-white/80">
                                    <CalendarMonthIcon sx={{ fontSize: 14 }} />
                                    Member since {getMemberSince()}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2.5 shrink-0 self-start sm:self-center">
                            <Link to="/account/update"
                                className="bg-white font-bold rounded-xl px-4 py-2.5 text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 transition duration-200 flex items-center gap-1.5"
                                style={{ color: 'var(--color-accent)' }}>
                                <EditIcon sx={{ fontSize: 16 }} /> Edit Profile
                            </Link>
                        </div>
                    </div>

                    {/* Profile completeness */}
                    <div className="mt-5 flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold uppercase tracking-wider text-white/70">Profile Completeness</span>
                            <span className="font-bold text-white">{completeness}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/20 overflow-hidden">
                            <div className="h-full rounded-full bg-white transition-all duration-500" style={{ width: `${completeness}%` }} />
                        </div>
                        {completeness < 100 && (
                            <p className="text-xs text-white/70">Upload a profile picture to complete your profile.</p>
                        )}
                    </div>

                    {/* Quick action chips */}
                    <div className="flex flex-wrap gap-2 mt-4">
                        {[
                            { label: 'My Orders', to: '/orders' },
                            { label: 'My Wishlist', to: '/wishlist' },
                            { label: 'Track Order', to: '/track' },
                            { label: 'Change Password', to: '/password/update' },
                        ].map(({ label, to }) => (
                            <Link key={to} to={to}
                                className="inline-flex items-center text-[11px] font-semibold bg-white/15 border border-white/25 rounded-full px-3 py-1.5 text-white hover:bg-white hover:text-orange-600 transition duration-200">
                                {label}
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Main content ── */}
            <main className="mx-auto max-w-4xl px-5 sm:px-6 flex flex-col gap-8 pb-16 mt-6 sm:mt-8">

                {/* Account section grid */}
                <section>
                    <h2 className="section-title mb-1">My Account</h2>
                    <p className="section-tagline mb-4">Orders, wishlist, payments and more</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        <SectionCard icon={<FolderIcon />} title="My Orders" description="Track, manage and re-order past purchases" to="/orders" />
                        <SectionCard icon={<FavoriteIcon />} title="My Wishlist" description="Products you saved for later" to="/wishlist" />
                        <SectionCard icon={<KeyIcon />} title="Change Password" description="Keep your account secure" to="/password/update" />
                        <SoonCard icon={<LocationOnIcon />} title="Manage Addresses" description="Delivery and billing addresses" />
                        <SoonCard icon={<AccountBalanceWalletIcon />} title="Payment Methods" description="Saved UPI, cards and wallets" />
                        <SoonCard icon={<ChatIcon />} title="My Chats" description="Support conversations" />
                        <SoonCard icon={<LocalOfferIcon />} title="My Coupons" description="Active offers and vouchers" />
                        <SoonCard icon={<RateReviewIcon />} title="Reviews & Ratings" description="Your feedback on products" />
                        <SoonCard icon={<NotificationsIcon />} title="Notifications" description="Order and offer alerts" />
                    </div>
                </section>

                {/* Personal information */}
                <section className="surface p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-base sm:text-lg" style={{ color: 'var(--color-text-primary)' }}>Personal Information</h2>
                        <Link to="/account/update" className="text-sm font-semibold hover:underline" style={{ color: 'var(--color-accent)' }}>Edit</Link>
                    </div>
                    {[
                        { label: 'Full Name', value: user.name },
                        { label: 'Gender', value: user.gender || '—' },
                        { label: 'Mobile Number', value: null },
                    ].map(({ label, value }, i, arr) => (
                        <div key={label} className={`flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 py-3 ${i < arr.length - 1 ? 'border-b' : ''}`}
                            style={{ borderColor: 'var(--color-border)' }}>
                            <span className="text-xs font-semibold uppercase tracking-wider sm:w-44 shrink-0"
                                style={{ color: 'var(--color-text-muted)' }}>{label}</span>
                            <span className="text-sm" style={{ color: value ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
                                {value || 'Not added yet'}
                            </span>
                        </div>
                    ))}
                </section>

                {/* Sign-in & security */}
                <section className="surface p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-base sm:text-lg" style={{ color: 'var(--color-text-primary)' }}>Sign-in & Security</h2>
                        <div className="flex items-center gap-4">
                            <Link to="/account/update" className="text-sm font-semibold hover:underline" style={{ color: 'var(--color-accent)' }}>Edit</Link>
                            <Link to="/password/update" className="text-sm font-semibold hover:underline" style={{ color: 'var(--color-accent)' }}>Change Password</Link>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 py-2">
                        <span className="text-xs font-semibold uppercase tracking-wider sm:w-44 shrink-0"
                            style={{ color: 'var(--color-text-muted)' }}>Email Address</span>
                        <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{user.email}</span>
                    </div>
                    <p className="flex items-start gap-2 text-xs mt-3" style={{ color: 'var(--color-text-secondary)' }}>
                        <ShieldIcon sx={{ fontSize: 14, color: 'var(--color-success)' }} className="mt-0.5 shrink-0" />
                        Account-related communication is sent to this email address.
                    </p>
                </section>

                {/* FAQs */}
                {faqs.length > 0 && (
                    <section className="surface p-4 sm:p-6">
                        <h2 className="font-bold text-base sm:text-lg mb-4" style={{ color: 'var(--color-text-primary)' }}>FAQs</h2>
                        <div className="flex flex-col gap-4">
                            {faqs.map((faq, i) => (
                                <div key={i} className={i < faqs.length - 1 ? 'border-b pb-4' : ''} style={{ borderColor: 'var(--color-border)' }}>
                                    <h4 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{faq.q}</h4>
                                    <p className="text-sm mt-1 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{faq.a}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Logout + Danger zone */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="surface p-4 sm:p-5 flex-1 flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                            <PowerSettingsNewIcon sx={{ color: 'var(--color-accent)', fontSize: 22 }} />
                            <div>
                                <h3 className="font-bold text-sm" style={{ color: 'var(--color-text-primary)' }}>Logout</h3>
                                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Sign out of your {brandName} account</p>
                            </div>
                        </div>
                        <button onClick={handleLogout} className="btn-ghost text-sm mt-auto">Logout</button>
                    </div>
                    <div className="rounded-2xl border border-red-200 p-4 sm:p-5 flex-1 flex flex-col gap-1.5" style={{ backgroundColor: '#fff5f5' }}>
                        <h3 className="font-bold text-sm text-red-700">Deactivate Account</h3>
                        <p className="text-sm text-red-600/90 leading-relaxed">
                            Permanently removes your orders, wishlist and personal details. Contact customer support to request it.
                        </p>
                    </div>
                </div>
            </main>
        </>
    );
};

export default Account;
