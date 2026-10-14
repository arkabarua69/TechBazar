import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import Loader from '../Layouts/Loader';
import MinCategory from '../Layouts/MinCategory';
import MetaData from '../Layouts/MetaData';
import { logoutUser } from '../../actions/userAction';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
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
import { useSiteConfig } from '../../context/SiteConfigContext';
import { DEFAULT_SITE_CONFIG } from '../../utils/siteConfig';

const Account = () => {

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();

    const { user, loading, isAuthenticated } = useSelector(state => state.user)

    // account FAQs come from the CMS (Admin → Homepage)
    const { config } = useSiteConfig();
    const faqs = config.content?.faqs || DEFAULT_SITE_CONFIG.content.faqs;
    const faqsLength = faqs.length;

    useEffect(() => {
        if (isAuthenticated === false) {
            navigate("/login")
        }
    }, [isAuthenticated, navigate]);

    const handleLogout = () => {
        dispatch(logoutUser());
        enqueueSnackbar("Logout Successfully", { variant: "success" });
        navigate("/login");
    }

    const getInitials = () => {
        return user.name.split(" ").map(part => part[0]).slice(0, 2).join("").toUpperCase();
    }

    const getMemberSince = () => {
        return new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" });
    }

    const getCompleteness = () => {
        let score = 0;
        if (user.name) score += 25;
        if (user.email) score += 25;
        if (user.gender) score += 25;
        if (user.avatar?.url) score += 25;
        return score;
    }

    const completeness = getCompleteness();

    // account section card — mirrors the homepage TrustBadges card pattern
    const SectionCard = ({ icon, title, description, to }) => (
        <Link
            to={to}
            className="surface p-4 sm:p-5 flex flex-col gap-2 hover:shadow-md hover:-translate-y-0.5 transition duration-200 group"
        >
            <div className="flex items-center justify-between">
                <span className="text-primary-accent text-2xl sm:text-3xl">{icon}</span>
                <ChevronRightIcon className="text-slate-300 group-hover:text-primary-accent group-hover:translate-x-0.5 transition duration-200" />
            </div>
            <p className="font-display font-semibold text-slate-900 text-sm sm:text-base">{title}</p>
            <p className="text-xs text-slate-500 leading-snug">{description}</p>
        </Link>
    );

    // not-yet-built section — honest "Soon" state instead of a dead link
    const SoonCard = ({ icon, title, description }) => (
        <div className="surface p-4 sm:p-5 flex flex-col gap-2 opacity-75">
            <div className="flex items-center justify-between">
                <span className="text-slate-400 text-2xl sm:text-3xl">{icon}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-400 rounded px-1.5 py-0.5">Soon</span>
            </div>
            <p className="font-display font-semibold text-slate-900 text-sm sm:text-base">{title}</p>
            <p className="text-xs text-slate-500 leading-snug">{description}</p>
        </div>
    );

    return (
        <>
            <MetaData title="My Profile | TechBazar" />

            {loading ? <Loader /> :
                <>
                    {/* ── profile hero band — full-bleed brand gradient,
                         content centered (same pattern as the homepage hero) ── */}
                    <section className="bg-gradient-to-r from-primary-accent via-indigo-600 to-blue-700">
                        <div className="mx-auto max-w-4xl px-5 sm:px-6 py-8 sm:py-12">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-6">
                                {/* <!-- avatar --> */}
                                {user.avatar?.url ? (
                                    <img draggable="false" className="h-20 w-20 sm:h-24 sm:w-24 rounded-full object-cover ring-4 ring-white/40 shadow-lg shrink-0" src={user.avatar.url} alt={user.name} />
                                ) : (
                                    <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full ring-4 ring-white/40 shadow-lg shrink-0 bg-white/15 text-white font-display font-bold text-2xl sm:text-3xl flex items-center justify-center select-none" aria-hidden="true">{getInitials()}</div>
                                )}
                                {/* <!-- avatar --> */}

                                <div className="flex-1 min-w-0">
                                    <p className="text-blue-100 text-sm">Hello,</p>
                                    <h1 className="font-display font-extrabold text-xl sm:text-3xl text-white leading-tight truncate">{user.name}</h1>
                                    <p className="text-blue-100/90 text-sm mt-0.5 truncate">{user.email}</p>
                                    <div className="flex flex-wrap items-center gap-2 mt-3">
                                        <span className="text-[10px] font-bold uppercase tracking-wider bg-white/15 border border-white/20 text-white rounded-full px-2.5 py-1">{user.role === "admin" ? "Admin" : "Member"}</span>
                                        <span className="flex items-center gap-1.5 text-xs text-blue-100/90">
                                            <CalendarMonthIcon sx={{ fontSize: 14 }} />
                                            Member since {getMemberSince()}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2.5 shrink-0 self-start sm:self-center">
                                    <Link to="/account/update" className="bg-white text-slate-900 font-bold rounded-lg px-5 py-2.5 text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition duration-200">Edit Profile</Link>
                                    <Link to="/password/update" className="border border-white/50 text-white font-semibold rounded-lg px-5 py-2.5 text-sm hover:bg-white/10 transition duration-200">Change Password</Link>
                                </div>
                            </div>

                            {/* <!-- completeness --> */}
                            <div className="mt-6 flex flex-col gap-1.5">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-semibold uppercase tracking-wider text-blue-100/80">Profile Completeness</span>
                                    <span className="font-bold text-white">{completeness}%</span>
                                </div>
                                <div className="h-1.5 rounded-full bg-white/20 overflow-hidden">
                                    <div className="h-full rounded-full bg-white" style={{ width: `${completeness}%` }}></div>
                                </div>
                                {completeness < 100 && <p className="text-xs text-blue-100/80">Upload a profile picture to complete your profile.</p>}
                            </div>
                            {/* <!-- completeness --> */}

                            {/* <!-- quick actions --> */}
                            <div className="flex flex-wrap gap-2 mt-5">
                                <Link to="/orders" className="inline-flex items-center gap-1.5 text-[11px] font-semibold bg-white/20 border border-white/30 rounded-full px-3 py-1.5 text-white hover:bg-white hover:text-slate-900 transition duration-200">My Orders</Link>
                                <Link to="/wishlist" className="inline-flex items-center gap-1.5 text-[11px] font-semibold bg-white/20 border border-white/30 rounded-full px-3 py-1.5 text-white hover:bg-white hover:text-slate-900 transition duration-200">My Wishlist</Link>
                                <Link to="/track" className="inline-flex items-center gap-1.5 text-[11px] font-semibold bg-white/20 border border-white/30 rounded-full px-3 py-1.5 text-white hover:bg-white hover:text-slate-900 transition duration-200">Track Order</Link>
                                <Link to="/password/update" className="inline-flex items-center gap-1.5 text-[11px] font-semibold bg-white/20 border border-white/30 rounded-full px-3 py-1.5 text-white hover:bg-white hover:text-slate-900 transition duration-200">Change Password</Link>
                            </div>
                            {/* <!-- quick actions --> */}
                        </div>
                    </section>
                    {/* ── /profile hero band ── */}

                    {/* main centered content column */}
                    <main className="mx-auto max-w-4xl px-5 sm:px-6 flex flex-col gap-10 pb-16 mt-6 sm:mt-8">

                        {/* <!-- account sections — TrustBadges-style card grid --> */}
                        <section>
                            <div className="flex flex-col gap-1 mb-4">
                                <h2 className="section-title">My Account</h2>
                                <p className="section-tagline">Orders, wishlist, payments and more — everything in one place</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                                <SectionCard icon={<FolderIcon />} title="My Orders" description="Track, manage and re-order your past purchases" to="/orders" />
                                <SectionCard icon={<FavoriteIcon />} title="My Wishlist" description="Products you saved for later" to="/wishlist" />
                                <SectionCard icon={<KeyIcon />} title="Change Password" description="Keep your account secure" to="/password/update" />
                                <SoonCard icon={<LocationOnIcon />} title="Manage Addresses" description="Delivery and billing addresses" />
                                <SoonCard icon={<AccountBalanceWalletIcon />} title="Payment Methods" description="Gift Cards Tk 0 · Saved UPI · Saved Cards" />
                                <SoonCard icon={<ChatIcon />} title="My Chats" description="Support conversations" />
                                <SoonCard icon={<LocalOfferIcon />} title="My Coupons" description="Active offers and vouchers" />
                                <SoonCard icon={<RateReviewIcon />} title="Reviews & Ratings" description="Your feedback on products" />
                                <SoonCard icon={<NotificationsIcon />} title="Notifications" description="Order and offer alerts" />
                            </div>
                        </section>
                        {/* <!-- /account sections --> */}

                        {/* <!-- personal information --> */}
                        <section className="surface p-4 sm:p-6 flex flex-col">
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="font-display font-bold text-base sm:text-lg text-slate-900">Personal Information</h2>
                                <Link to="/account/update" className="text-sm text-primary-accent font-semibold hover:underline">Edit</Link>
                            </div>

                            <div className="flex flex-col">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 py-3 border-b border-line">
                                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 sm:w-44 shrink-0">Full Name</span>
                                    <span className="text-sm text-slate-900 flex-1">{user.name}</span>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 py-3 border-b border-line">
                                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 sm:w-44 shrink-0">Gender</span>
                                    <span className="text-sm text-slate-900 flex-1 capitalize">{user.gender}</span>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 py-3">
                                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 sm:w-44 shrink-0">Mobile Number</span>
                                    <span className="text-sm text-slate-400 flex-1">Not added yet</span>
                                </div>
                            </div>
                        </section>
                        {/* <!-- /personal information --> */}

                        {/* <!-- sign-in & security --> */}
                        <section className="surface p-4 sm:p-6 flex flex-col">
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="font-display font-bold text-base sm:text-lg text-slate-900">Sign-in & Security</h2>
                                <div className="flex items-center gap-4">
                                    <Link to="/account/update" className="text-sm text-primary-accent font-semibold hover:underline">Edit</Link>
                                    <Link to="/password/update" className="text-sm text-primary-accent font-semibold hover:underline">Change Password</Link>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 py-3">
                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 sm:w-44 shrink-0">Email Address</span>
                                <span className="text-sm text-slate-900 flex-1">{user.email}</span>
                            </div>
                            <p className="flex items-start gap-2 text-xs text-slate-500 pt-3">
                                <ShieldIcon sx={{ fontSize: 14 }} className="mt-0.5 shrink-0 text-primary-green" />
                                Account-related communication is sent to this email address.
                            </p>
                        </section>
                        {/* <!-- /sign-in & security --> */}

                        {/* <!-- faqs --> */}
                        <section className="surface p-4 sm:p-6 flex flex-col gap-4">
                            <h2 className="font-display font-bold text-base sm:text-lg text-slate-900">FAQs</h2>

                            {(config.content?.faqs || DEFAULT_SITE_CONFIG.content.faqs).map((faq, i) => (
                                <div key={i} className={i < faqsLength - 1 ? 'border-b border-line pb-4' : ''}>
                                    <h4 className="text-sm font-semibold text-slate-900">{faq.q}</h4>
                                    <p className="text-sm text-slate-600 mt-1">{faq.a}</p>
                                </div>
                            ))}
                        </section>
                        {/* <!-- faqs --> */}

                        {/* <!-- logout + danger zone --> */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="surface p-4 sm:p-5 flex-1 flex flex-col gap-3">
                                <div className="flex items-center gap-3">
                                    <span className="text-primary-accent"><PowerSettingsNewIcon /></span>
                                    <div>
                                        <h3 className="font-display font-bold text-sm text-slate-900">Logout</h3>
                                        <p className="text-xs text-slate-500">Sign out of your TechBazar account</p>
                                    </div>
                                </div>
                                <button onClick={handleLogout} className="btn-ghost text-sm mt-auto">Logout</button>
                            </div>

                            <div className="rounded-xl border border-red-200 bg-red-50 p-4 sm:p-5 flex-1 flex flex-col gap-1.5">
                                <h3 className="font-display font-bold text-sm text-red-700">Deactivate Account</h3>
                                <p className="text-sm text-red-600/90 leading-relaxed">Deactivating your account permanently removes your orders, wishlist and personal details. Self-service deactivation is not available on this store — contact customer support to request it.</p>
                            </div>
                        </div>
                        {/* <!-- /logout + danger zone --> */}

                    </main>
                </>
            }
        </>
    );
};

export default Account;
