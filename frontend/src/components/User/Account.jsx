import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import Loader from '../Layouts/Loader';
import MetaData from '../Layouts/MetaData';
import AccountSidebar from './AccountSidebar';
import EditProfilePanel from './EditProfilePanel';
import AddressForm from './AddressForm';
import ChangePasswordPanel from './ChangePasswordPanel';
import { logoutUser, myAddresses, deleteAddress, setDefaultAddress, clearErrors } from '../../actions/userAction';
import { useSiteConfig } from '../../context/SiteConfigContext';
import { DEFAULT_SITE_CONFIG } from '../../utils/siteConfig';
import { richTextToHtml } from '../../utils/richText';
import TicketPanel from './TicketPanel';

import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import WcIcon from '@mui/icons-material/Wc';
import EditIcon from '@mui/icons-material/Edit';
import ShieldIcon from '@mui/icons-material/Shield';
import FolderIcon from '@mui/icons-material/Folder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import HomeIcon from '@mui/icons-material/Home';
import WorkIcon from '@mui/icons-material/Work';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';

// Phone layout switches the page into a native-app shell (menu → section),
// so the breakpoint has to be known in JS — CSS alone would mount the chat
// panel twice (double polling) and duplicate form state.
const useIsMobile = () => {
    const [mobile, setMobile] = useState(
        typeof window !== 'undefined' ? window.innerWidth < 768 : false
    );
    useEffect(() => {
        const mq = window.matchMedia('(max-width: 767px)');
        const onChange = () => setMobile(mq.matches);
        onChange();
        if (mq.addEventListener) mq.addEventListener('change', onChange);
        else mq.addListener(onChange);
        return () => {
            if (mq.removeEventListener) mq.removeEventListener('change', onChange);
            else mq.removeListener(onChange);
        };
    }, []);
    return mobile;
};

const TABS = [
    { key: 'profile', label: 'Profile Information' },
    { key: 'edit', label: 'Edit Profile' },
    { key: 'addresses', label: 'Manage Addresses' },
    { key: 'wishlist', label: 'My Wishlist' },
    { key: 'chat', label: 'Support Ticket' },
    { key: 'security', label: 'Change Password' },
    { key: 'faqs', label: 'FAQs' },
];

// A titled panel used by every tab.
const Panel = ({ title, action, children }) => {
    const mobile = useIsMobile();
    if (mobile) {
        // Mobile app style: no card/box — just the content as plain text,
        // the section title already lives in the fixed app bar above.
        return <div className="py-2">{children}</div>;
    }
    return (
        <section
            className="overflow-hidden"
            style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--card-radius)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            }}
        >
            <div
                className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-5 py-3.5"
                style={{ borderBottom: '1px solid var(--color-border)' }}
            >
                <h2 className="font-bold text-sm sm:text-base" style={{ color: 'var(--color-text-primary)' }}>{title}</h2>
                {action}
            </div>
            <div className="p-4 sm:p-5">{children}</div>
        </section>
    );
};

// label / value row
const InfoRow = ({ icon, label, value, last }) => (
    <div className="py-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>{label}</p>
        <div
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg"
            style={{
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                color: value ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
            }}
        >
            <span className="shrink-0" style={{ color: 'var(--color-accent)' }}>{icon}</span>
            <span className="text-sm break-words flex-1">{value || 'Not added yet'}</span>
        </div>
    </div>
);

const labelIcon = (label) => {
    if (label === 'Office') return <WorkIcon sx={{ fontSize: 13 }} />;
    if (label === 'Other') return <LocationOnIcon sx={{ fontSize: 13 }} />;
    return <HomeIcon sx={{ fontSize: 13 }} />;
};

const Account = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const { user, loading, isAuthenticated } = useSelector((state) => state.user);
    const { addresses, loading: addrLoading, error: addrError } = useSelector((state) => state.addresses);
    const addressSave = useSelector((state) => state.addressSave);
    const addressDelete = useSelector((state) => state.addressDelete);
    const { config } = useSiteConfig();
    const faqs = config.content?.faqs || DEFAULT_SITE_CONFIG.content.faqs;
    const brandName = config?.branding?.name || 'Store';
    const isMobile = useIsMobile();

    // The sidebar on /orders links here as /account?tab=…, so read the tab from
    // the query string and keep it in sync when the user switches tabs.
    const VALID_TABS = TABS.map((t) => t.key);
    const initialTab = (() => {
        const q = new URLSearchParams(window.location.search).get('tab');
        return VALID_TABS.includes(q) ? q : 'profile';
    })();
    const [tab, setTab] = useState(initialTab);

    // Phone layout is an app shell: the account menu is the first screen and
    // every section drills into it (like a native app). Deep links that carry
    // ?tab=… open that section straight away.
    const [mobileScreen, setMobileScreen] = useState(
        new URLSearchParams(window.location.search).get('tab') ? 'section' : 'menu'
    );

    // Native-style side drawer opened by the mobile bottom bar's Menu button.
    const [drawerOpen, setDrawerOpen] = useState(false);
    useEffect(() => {
        const open = () => setDrawerOpen(true);
        window.addEventListener('open-account-drawer', open);
        return () => window.removeEventListener('open-account-drawer', open);
    }, []);

    useEffect(() => {
        const q = new URLSearchParams(window.location.search).get('tab');
        if (VALID_TABS.includes(q)) {
            if (q !== tab) setTab(q);
            setMobileScreen('section');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [window.location.search]);

    const selectTab = (next) => {
        setTab(next);
        setMobileScreen('section');
        window.history.replaceState({}, '', `/account?tab=${next}`);
    };

    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState(null);

    useEffect(() => {
        if (isAuthenticated === false) navigate('/login');
    }, [isAuthenticated, navigate]);

    useEffect(() => {
        if (isAuthenticated) dispatch(myAddresses());
    }, [dispatch, isAuthenticated]);

    useEffect(() => {
        if (addrError) { enqueueSnackbar(addrError, { variant: 'error' }); dispatch(clearErrors()); }
    }, [addrError, enqueueSnackbar, dispatch]);

    useEffect(() => {
        if (addressSave?.error) { enqueueSnackbar(addressSave.error, { variant: 'error' }); dispatch(clearErrors()); }
    }, [addressSave?.error, enqueueSnackbar, dispatch]);

    useEffect(() => {
        if (addressDelete?.error) { enqueueSnackbar(addressDelete.error, { variant: 'error' }); dispatch(clearErrors()); }
    }, [addressDelete?.error, enqueueSnackbar, dispatch]);

    const handleLogout = () => {
        dispatch(logoutUser());
        enqueueSnackbar('Logged out successfully', { variant: 'success' });
        navigate('/login');
    };

    if (loading || !user) return <Loader />;

    const initials = user.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
    const memberSince = new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const completeness = (() => {
        let s = 0;
        if (user.name) s += 25;
        if (user.email) s += 25;
        if (user.gender) s += 25;
        if (user.avatar?.url) s += 25;
        return s;
    })();

    const openAdd = () => { setEditing(null); setFormOpen(true); };
    const openEdit = (addr) => { setEditing(addr); setFormOpen(true); };

    // The save/delete actions return the fresh list, but the sidebar tab also
    // reads `state.addresses` — refetch so both stay in sync.
    const handleDelete = async (id) => {
        const res = await dispatch(deleteAddress(id));
        if (res?.type?.endsWith('FAIL')) {
            enqueueSnackbar(res.payload || 'Could not delete the address', { variant: 'error' });
            dispatch(clearErrors());
            return;
        }
        enqueueSnackbar('Address deleted', { variant: 'success' });
        dispatch(myAddresses());
    };

    const handleSetDefault = async (id) => {
        const res = await dispatch(setDefaultAddress(id));
        if (res?.type?.endsWith('FAIL')) {
            enqueueSnackbar(res.payload || 'Could not update the address', { variant: 'error' });
            dispatch(clearErrors());
            return;
        }
        enqueueSnackbar('Default address updated', { variant: 'success' });
        dispatch(myAddresses());
    };

    const activeLabel = TABS.find((t) => t.key === tab)?.label || 'Profile Information';

    // ── Tab bodies ──────────────────────────────────────────────────────────

    const ProfileBody = (
        <div className="flex flex-col gap-4">
            <Panel
                title="Personal Information"
                action={<button type="button" onClick={() => selectTab('edit')} className="text-xs font-semibold hover:underline" style={{ color: 'var(--color-accent)' }}>Edit</button>}
            >
                <div className="flex flex-col">
                    <InfoRow icon={<PersonIcon sx={{ fontSize: 18 }} />} label="Full Name" value={user.name} />
                    <InfoRow icon={<WcIcon sx={{ fontSize: 18 }} />} label="Gender" value={user.gender} />
                    <InfoRow icon={<PhoneIcon sx={{ fontSize: 18 }} />} label="Mobile Number" value={user.phoneNo} last />
                </div>
            </Panel>

            <Panel
                title="Email Address"
                action={<button type="button" onClick={() => selectTab('edit')} className="text-xs font-semibold hover:underline" style={{ color: 'var(--color-accent)' }}>Edit</button>}
            >
                <div className="flex flex-col">
                    <InfoRow icon={<EmailIcon sx={{ fontSize: 18 }} />} label="Email" value={user.email} last />
                </div>
                <p className="flex items-start gap-2 text-xs mt-3" style={{ color: 'var(--color-text-secondary)' }}>
                    <ShieldIcon sx={{ fontSize: 14, color: 'var(--color-success)' }} className="mt-0.5 shrink-0" />
                    Account-related communication is sent to this email address.
                </p>
            </Panel>

            <div className="flex-1 flex flex-col gap-1.5 p-4 sm:p-5 rounded-2xl border border-red-200" style={{ backgroundColor: '#fff5f5' }}>
                <h3 className="font-bold text-sm text-red-700">Deactivate Account</h3>
                <p className="text-sm text-red-600/90 leading-relaxed">
                    Permanently removes your orders, wishlist and personal details. Contact customer support to request it.
                </p>
            </div>
        </div>
    );

    const AddressesBody = (
        <Panel
            title="Manage Addresses"
            action={
                !formOpen && (
                    <button
                        type="button"
                        onClick={openAdd}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all duration-150"
                        style={{ backgroundColor: 'var(--color-accent)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-accent-hover)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-accent)'; }}
                    >
                        <AddIcon sx={{ fontSize: 15 }} /> Add a new address
                    </button>
                )
            }
        >
            {formOpen && (
                <AddressForm
                    initial={editing}
                    onDone={(ok) => {
                        setFormOpen(false);
                        setEditing(null);
                        if (ok) enqueueSnackbar(editing ? 'Address updated' : 'Address added', { variant: 'success' });
                    }}
                />
            )}

            {addrLoading && addresses.length === 0 ? (
                <div className="py-8 flex justify-center"><Loader /></div>
            ) : addresses.length === 0 && !formOpen ? (
                <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                    <LocationOnIcon sx={{ fontSize: '2.5rem', color: 'var(--color-text-muted)' }} />
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>No saved addresses</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        Add an address so checkout can be filled in one tap.
                    </p>
                </div>
            ) : (
                <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${formOpen ? 'mt-4' : ''}`}>
                    {addresses.map((a) => (
                        <div
                            key={a._id}
                            className="flex flex-col gap-2 p-3.5 transition-all duration-200"
                            style={{
                                backgroundColor: 'var(--color-surface)',
                                border: `1px solid ${a.isDefault ? 'var(--color-accent)' : 'var(--color-border)'}`,
                                borderRadius: 'var(--card-radius)',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(232,75,15,0.12)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)'; }}
                        >
                            <div className="flex items-center gap-2 flex-wrap">
                                <span
                                    className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                                    style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text-secondary)' }}
                                >
                                    {labelIcon(a.label)} {a.label || 'Home'}
                                </span>
                                {a.isDefault && (
                                    <span
                                        className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-white"
                                        style={{ backgroundColor: 'var(--color-accent)' }}
                                    >
                                        <StarIcon sx={{ fontSize: 11 }} /> Default
                                    </span>
                                )}
                            </div>

                            <p className="font-bold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                                {a.fullName || user.name}
                            </p>
                            <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                                {a.address}
                                {(a.city || a.state) && <><br />{[a.city, a.state].filter(Boolean).join(', ')}{a.pincode ? ` - ${a.pincode}` : ''}</>}
                                {a.country && <><br />{a.country}</>}
                            </p>
                            {a.phoneNo && (
                                <p className="inline-flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                                    <PhoneIcon sx={{ fontSize: 13, color: 'var(--color-accent)' }} /> {a.phoneNo}
                                </p>
                            )}

                            <div className="flex items-center gap-3 pt-2 mt-auto" style={{ borderTop: '1px solid var(--color-border)' }}>
                                <button
                                    type="button"
                                    onClick={() => handleDelete(a._id)}
                                    disabled={addressDelete?.loading}
                                    className="inline-flex items-center gap-1 text-xs font-semibold transition-colors disabled:opacity-50"
                                    style={{ color: 'var(--color-text-secondary)' }}
                                    onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-danger)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
                                >
                                    <DeleteOutlineIcon sx={{ fontSize: 14 }} /> Delete
                                </button>
                                {!a.isDefault && (
                                    <button
                                        type="button"
                                        onClick={() => handleSetDefault(a._id)}
                                        className="ml-auto inline-flex items-center gap-1 text-xs font-semibold transition-colors"
                                        style={{ color: 'var(--color-text-secondary)' }}
                                        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-accent)'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
                                    >
                                        <StarBorderIcon sx={{ fontSize: 14 }} /> Set default
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Panel>
    );

    const WishlistBody = (
        <Panel
            title="My Wishlist"
            action={<Link to="/wishlist" className="text-xs font-semibold hover:underline" style={{ color: 'var(--color-accent)' }}>Open wishlist</Link>}
        >
            <div className="flex flex-col items-center gap-2 py-8 text-center">
                <FavoriteIcon sx={{ fontSize: '2.5rem', color: 'var(--color-accent)' }} />
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Saved products live here</p>
                <p className="text-xs max-w-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    Tap the heart on any product to save it, then find everything in one place.
                </p>
                <Link to="/wishlist" className="btn-accent text-sm mt-1">View Wishlist</Link>
            </div>
        </Panel>
    );

    const SecurityBody = (
        <div className="flex flex-col gap-4">
            <ChangePasswordPanel onDone={() => selectTab('profile')} />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: 'Role', value: user.role === 'admin' ? 'Admin' : 'Member' },
                    { label: 'Member since', value: memberSince },
                    { label: 'Addresses', value: addresses.length },
                    { label: 'Completeness', value: `${completeness}%` },
                ].map((s) => (
                    <div
                        key={s.label}
                        className="flex flex-col gap-1 p-3 sm:p-4 transition-all duration-200"
                        style={{
                            backgroundColor: 'var(--color-surface)',
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--card-radius)',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(232,75,15,0.12)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'var(--color-accent)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--color-border)'; }}
                    >
                        <p className="text-lg font-extrabold leading-none truncate" style={{ color: 'var(--color-text-primary)' }}>{s.value}</p>
                        <p className="text-[11px] font-medium mt-0.5 truncate" style={{ color: 'var(--color-text-muted)' }}>{s.label}</p>
                    </div>
                ))}
            </div>
        </div>
    );

    const FaqsBody = (
        <Panel title="FAQs">
            <div className="flex flex-col gap-4">
                {faqs.map((faq, i) => (
                    <div key={i} className={i < faqs.length - 1 ? 'pb-4' : ''} style={{ borderBottom: i < faqs.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                        <h4 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{faq.q}</h4>
                        <div
                            className="text-sm mt-1 rte-content"
                            style={{ color: 'var(--color-text-secondary)' }}
                            dangerouslySetInnerHTML={{ __html: richTextToHtml(faq.a) }}
                        />
                    </div>
                ))}
            </div>
        </Panel>
    );

    const ChatBody = (
        <TicketPanel />
    );

    const EditProfileBody = (
        <EditProfilePanel onDone={() => selectTab('profile')} />
    );

    const bodies = { profile: ProfileBody, edit: EditProfileBody, addresses: AddressesBody, wishlist: WishlistBody, chat: ChatBody, security: SecurityBody, faqs: FaqsBody };

    return (
        <>
            <MetaData title="My Account" />

            {/* ── Mobile hero (matches the Orders page band) — mobile only ── */}
            {isMobile && (
                <section
                    className="md:hidden"
                    style={{
                        background: 'linear-gradient(135deg, var(--color-accent) 0%, #c63e0a 60%, #a33408 100%)',
                        marginTop: '56px',
                    }}
                >
                    <div className="px-3 py-5">
                        <div className="flex items-center gap-3">
                            {user.avatar?.url ? (
                                <img
                                    draggable="false"
                                    className="h-12 w-12 rounded-full object-cover ring-3 ring-white/30 shadow-lg shrink-0"
                                    src={user.avatar.url} alt={user.name}
                                />
                            ) : (
                                <div className="h-12 w-12 rounded-full ring-3 ring-white/30 shadow-lg shrink-0 bg-white/15 text-white font-bold text-base flex items-center justify-center select-none">
                                    {initials}
                                </div>
                            )}
                            <div className="min-w-0 flex-1">
                                <p className="text-white/70 text-xs">Hello,</p>
                                <h1 className="font-bold text-lg text-white leading-tight truncate">{user.name}</h1>
                                <p className="text-white/80 text-xs mt-0.5 truncate">{activeLabel}</p>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* ── Hero band (desktop) ── */}
            <section className="hidden md:block" style={{ background: 'linear-gradient(135deg, var(--color-accent) 0%, #c63e0a 60%, #a33408 100%)' }}>
                <div className="mx-auto max-w-7xl px-3 sm:px-5 lg:px-6 py-6 sm:py-8">
                    <div className="flex items-center gap-4">
                        {user.avatar?.url ? (
                            <img
                                draggable="false"
                                className="h-14 w-14 sm:h-16 sm:w-16 rounded-full object-cover ring-4 ring-white/30 shadow-lg shrink-0"
                                src={user.avatar.url} alt={user.name}
                            />
                        ) : (
                            <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full ring-4 ring-white/30 shadow-lg shrink-0 bg-white/15 text-white font-bold text-xl flex items-center justify-center select-none">
                                {initials}
                            </div>
                        )}
                        <div className="min-w-0 flex-1">
                            <p className="text-white/70 text-xs sm:text-sm">Hello,</p>
                            <h1 className="font-bold text-lg sm:text-2xl text-white leading-tight truncate">{user.name}</h1>
                            <p className="text-white/80 text-xs sm:text-sm mt-0.5 truncate">{user.email}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Mobile app bar (phone app shell) ── */}
            {isMobile && (
                <div
                    className="fixed top-0 left-0 right-0 z-30"
                    style={{
                        background: 'linear-gradient(135deg, var(--color-accent) 0%, #c63e0a 60%, #a33408 100%)',
                    }}
                >
                    <div className="mx-auto max-w-7xl px-3">
                        <div className="flex items-center gap-3 h-14">
                            <button
                                type="button"
                                onClick={() => navigate('/')}
                                aria-label="Back to shop"
                                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition active:scale-90"
                                style={{ backgroundColor: 'rgba(255,255,255,0.18)', color: '#fff' }}
                            >
                                <ArrowBackIosNewIcon sx={{ fontSize: 18 }} />
                            </button>

                            <div className="min-w-0 flex-1 leading-tight">
                                <h1 className="font-bold text-[15px] text-white truncate">
                                    {mobileScreen === 'section' ? activeLabel : 'My Account'}
                                </h1>
                                <p className="text-[11px] text-white/80 truncate">
                                    {mobileScreen === 'section' ? user.name : user.email}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => navigate('/products')}
                                aria-label="Search products"
                                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition active:scale-90"
                                style={{ backgroundColor: 'rgba(255,255,255,0.18)', color: '#fff' }}
                            >
                                <SearchIcon sx={{ fontSize: 19 }} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Native side drawer (mobile, opened by the bottom bar Menu) ── */}
            {isMobile && drawerOpen && (
                <div className="fixed inset-0 z-[70] md:hidden" aria-modal="true" role="dialog">
                    <div
                        className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px] transition-opacity"
                        onClick={() => setDrawerOpen(false)}
                    />
                    <aside
                        className="absolute left-0 top-0 h-full w-80 max-w-[85%] bg-white shadow-2xl flex flex-col"
                        style={{ animation: 'tb-sheet-up .28s cubic-bezier(.22,.9,.3,1)' }}
                    >
                        <div
                            className="flex items-center justify-between px-4 h-14 shrink-0"
                            style={{ background: 'linear-gradient(135deg, var(--color-accent) 0%, #c63e0a 60%, #a33408 100%)' }}
                        >
                            <span className="font-display font-extrabold text-lg text-white tracking-tight">{brandName}</span>
                            <button
                                type="button"
                                onClick={() => setDrawerOpen(false)}
                                aria-label="Close menu"
                                className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center transition active:scale-90"
                            >
                                <CloseIcon sx={{ fontSize: 18 }} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto pb-6">
                            <AccountSidebar
                                mobile
                                activeTab={tab}
                                onSelect={selectTab}
                                onNavigate={() => setDrawerOpen(false)}
                            />
                            <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
                                <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>Categories</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {((config && config.categories) || []).map((cat) => (
                                        <Link
                                            key={cat}
                                            to={`/products?category=${encodeURIComponent(cat)}`}
                                            onClick={() => setDrawerOpen(false)}
                                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium transition active:scale-95"
                                            style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text-secondary)' }}
                                        >
                                            {cat}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                            <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
                                <Link
                                    to="/"
                                    onClick={() => setDrawerOpen(false)}
                                    className="flex items-center gap-2 text-sm font-medium"
                                    style={{ color: 'var(--color-text-secondary)' }}
                                >
                                    <HomeIcon sx={{ fontSize: 18, color: 'var(--color-accent)' }} />
                                    Back to shop
                                </Link>
                            </div>
                        </div>
                    </aside>
                </div>
            )}

            {/* ── Mobile floating "Add address" button ── */}
            {isMobile && tab === 'addresses' && !formOpen && (
                <button
                    type="button"
                    onClick={openAdd}
                    aria-label="Add a new address"
                    className="fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full flex items-center justify-center text-white transition active:scale-90"
                    style={{ backgroundColor: 'var(--color-accent)', boxShadow: '0 8px 20px rgba(232,75,15,0.4)' }}
                >
                    <AddIcon sx={{ fontSize: 26 }} />
                </button>
            )}

            {/* ── Body ── */}
            <main className="mx-auto max-w-7xl px-3 sm:px-5 lg:px-6 pb-20 md:py-6 md:pt-6">
                {isMobile ? (
                    /* Phone: app shell — section content only. Navigation lives
                       in the side drawer opened by the bottom bar's Menu button,
                       so the sidebar nav is NOT rendered in the main content. */
                    <div className="flex flex-col gap-4">{bodies[tab]}</div>
                ) : (
                    /* Desktop: sidebar + content */
                    <div className="flex gap-5 lg:gap-6 items-start">
                        <AccountSidebar activeTab={tab} onSelect={selectTab} />

                        <div className="flex-1 min-w-0 flex flex-col gap-4">
                            {/* breadcrumb */}
                            <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                                <FolderIcon sx={{ fontSize: 14 }} />
                                <span>Account</span>
                                <ChevronRightIcon sx={{ fontSize: 14 }} />
                                <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{activeLabel}</span>
                            </div>

                            {bodies[tab]}
                        </div>
                    </div>
                )}
            </main>
        </>
    );
};

export default Account;
