import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import ChatIcon from '@mui/icons-material/Chat';
import GavelIcon from '@mui/icons-material/Gavel';
import LogoutIcon from '@mui/icons-material/Logout';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { logoutUser } from '../../actions/userAction';

const CATEGORIES = [
    'Mobiles', 'Fashion', 'Electronics', 'Home', 'Travel',
    'Appliances', 'Furniture', 'Beauty,Toys & more', 'Grocery',
];

// App-style sidebar drawer opened by the centre ☰ button of the mobile
// bottom bar: search + account + orders + categories + hotline/WhatsApp + policy
const MenuDrawer = ({ open, onClose }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated, user } = useSelector((state) => state.user);

    const [query, setQuery] = useState('');
    const [support, setSupport] = useState({ hotline: '', whatsapp: '' });

    // support numbers come from Admin → Homepage settings
    useEffect(() => {
        if (!open) return;
        axios.get('/api/v1/siteconfig', { headers: { Accept: 'application/json' } })
            .then(({ data }) => {
                const s = (data && data.config && data.config.support) || {};
                setSupport({ hotline: s.hotline || '', whatsapp: s.whatsapp || '' });
            })
            .catch(() => { /* keep defaults */ });
    }, [open]);

    // close on route change + lock body scroll while open
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { onClose(); }, [location.pathname]);
    useEffect(() => {
        document.body.style.overflow = open ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    const doSearch = (e) => {
        e.preventDefault();
        const q = query.trim();
        navigate(q ? `/products/${encodeURIComponent(q)}` : '/products');
        onClose();
    };

    const handleLogout = () => {
        dispatch(logoutUser());
        onClose();
        navigate('/');
    };

    const rowClass = 'w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-cloud transition duration-150';

    return (
        <div className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
            {/* overlay */}
            <div
                onClick={onClose}
                className={`absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
            />

            {/* panel — slides in from the left */}
            <aside
                className={`absolute left-0 top-0 h-full w-80 max-w-[85%] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out ${open ? 'translate-x-0' : '-translate-x-full'}`}
            >
                {/* header */}
                <div className="flex items-center justify-between px-4 h-14 bg-primary-accent text-white shrink-0">
                    <span className="font-display font-extrabold text-lg tracking-tight">
                        Tech<span className="text-yellow-300">Bazar</span>
                    </span>
                    <button onClick={onClose} aria-label="Close menu" className="p-1.5 rounded-full hover:bg-white/15 transition">
                        <CloseIcon sx={{ fontSize: '20px' }} />
                    </button>
                </div>

                {/* search */}
                <form onSubmit={doSearch} className="flex items-center gap-2 px-4 py-3 border-b border-line shrink-0">
                    <div className="flex flex-1 items-center gap-2 bg-cloud border border-line rounded-lg px-3 py-2">
                        <SearchIcon sx={{ fontSize: '18px', color: '#94a3b8' }} />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="গ্যাজেট খুঁজুন…"
                            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                        />
                    </div>
                    <button type="submit" className="btn-accent px-3 py-2 text-xs font-semibold rounded-lg">খুঁজুন</button>
                </form>

                {/* scrollable content */}
                <div className="flex-1 overflow-y-auto pb-6">
                    {/* account */}
                    <div className="border-b border-line py-2">
                        {isAuthenticated ? (
                            <>
                                <Link to="/account" className={rowClass}>
                                    <PersonOutlineIcon sx={{ fontSize: '20px', color: '#3b82f6' }} />
                                    {user && user.name ? user.name : 'আমার অ্যাকাউন্ট'}
                                </Link>
                                <Link to="/admin/dashboard" className={rowClass}>
                                    <AdminPanelSettingsIcon sx={{ fontSize: '20px', color: '#3b82f6' }} />
                                    অ্যাডমিন ড্যাশবোর্ড
                                </Link>
                                <button onClick={handleLogout} className={rowClass}>
                                    <LogoutIcon sx={{ fontSize: '20px', color: '#ef4444' }} />
                                    লগআউট
                                </button>
                            </>
                        ) : (
                            <Link to="/login" className={rowClass}>
                                <PersonOutlineIcon sx={{ fontSize: '20px', color: '#3b82f6' }} />
                                লগইন / রেজিস্টার
                            </Link>
                        )}
                    </div>

                    {/* orders */}
                    <div className="border-b border-line py-2">
                        <Link to="/orders" className={rowClass}>
                            <TrackChangesIcon sx={{ fontSize: '20px', color: '#3b82f6' }} />
                            অর্ডার ট্র্যাক ও হিস্ট্রি
                        </Link>
                        <Link to="/track" className={rowClass}>
                            <TrackChangesIcon sx={{ fontSize: '20px', color: '#10b981' }} />
                            নম্বর দিয়ে অর্ডার খুঁজুন
                        </Link>
                        <Link to="/cart" className={rowClass}>
                            <ShoppingCartIcon sx={{ fontSize: '20px', color: '#3b82f6' }} />
                            কার্ট
                        </Link>
                    </div>

                    {/* categories */}
                    <div className="border-b border-line py-2">
                        <p className="px-4 pt-1 pb-2 text-xxs font-bold uppercase tracking-widest text-slate-400">
                            ক্যাটাগরি
                        </p>
                        {CATEGORIES.map((name) => (
                            <Link
                                key={name}
                                to={`/products?category=${encodeURIComponent(name)}`}
                                className={`${rowClass} justify-between`}
                            >
                                <span>{name}</span>
                                <KeyboardArrowRightIcon sx={{ fontSize: '18px', color: '#cbd5e1' }} />
                            </Link>
                        ))}
                    </div>

                    {/* support */}
                    <div className="border-b border-line py-2">
                        <p className="px-4 pt-1 pb-2 text-xxs font-bold uppercase tracking-widest text-slate-400">
                            সাপোর্ট
                        </p>
                        {support.hotline && (
                            <a href={`tel:${support.hotline}`} className={rowClass}>
                                <SupportAgentIcon sx={{ fontSize: '20px', color: '#10b981' }} />
                                হেল্পলাইন: {support.hotline}
                            </a>
                        )}
                        {support.whatsapp && (
                            <a
                                href={`https://wa.me/${support.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('আমার অর্ডার সম্পর্কে জানতে চাই')}`}
                                target="_blank"
                                rel="noreferrer"
                                className={rowClass}
                            >
                                <ChatIcon sx={{ fontSize: '20px', color: '#10b981' }} />
                                WhatsApp সাপোর্ট
                            </a>
                        )}
                    </div>

                    {/* policy */}
                    <div className="py-2">
                        <Link to="/policy" className={rowClass}>
                            <GavelIcon sx={{ fontSize: '20px', color: '#64748b' }} />
                            প্রাইভেসি ও রিটার্ন পলিসি
                        </Link>
                    </div>
                </div>
            </aside>
        </div>
    );
};

export default MenuDrawer;
