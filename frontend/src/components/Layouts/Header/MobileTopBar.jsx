import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import { useSiteConfig } from '../../../context/SiteConfigContext';
import axios from 'axios';
import { DEFAULT_SITE_CONFIG } from '../../../utils/siteConfig';

/**
 * MobileTopBar — fixed top bar shown only on mobile (hidden on md+).
 * Structure (top → bottom):
 *   1. Announcement ticker  (scrolling marquee, from DB)
 *   2. Logo row OR expanded search row
 *
 * Hidden on /admin routes.
 */
const MobileTopBar = () => {
    const { config, ready } = useSiteConfig();
    const { pathname } = useLocation();
    const navigate = useNavigate();

    const [searchOpen, setSearchOpen] = useState(false);
    const [keyword, setKeyword] = useState('');
    const [announcementMobile, setAnnouncementMobile] = useState(
        DEFAULT_SITE_CONFIG.announcement?.mobile || ''
    );

    // fetch announcement from DB (same as AnnouncementBar does)
    useEffect(() => {
        axios.get('/api/v1/siteconfig', { headers: { Accept: 'application/json' } })
            .then((res) => {
                const mob = res.data?.config?.announcement?.mobile;
                if (mob) setAnnouncementMobile(mob);
            })
            .catch(() => {});
    }, []);

    // branding from database (placeholder name only after the real config lands)
    const brandName = ready ? (config.branding?.name || 'Store') : '';
    const logoUrl   = config.branding?.logoUrl || '';

    // hide on admin pages and account page (account has its own app bar)
    if (pathname.startsWith('/admin') || pathname.startsWith('/account')) return null;

    const handleSearch = (e) => {
        e.preventDefault();
        const q = keyword.trim();
        setSearchOpen(false);
        setKeyword('');
        navigate(q ? `/products/${q}` : '/products');
    };

    const Wordmark = () => (
        <span
            className="font-display font-extrabold text-lg tracking-tight leading-none"
            style={{ color: 'var(--color-accent)' }}
        >
            {brandName}
        </span>
    );

    return (
        <div
            className="mobile-topbar md:hidden fixed top-0 left-0 right-0 z-40"
            style={{
                backgroundColor: 'var(--color-header)',
                borderBottom: '1px solid var(--color-border)',
            }}
        >
            {/* ── 1. Announcement ticker (always visible) ─────────────────── */}
            <div
                className="h-7 flex items-center overflow-hidden select-none"
                style={{
                    backgroundColor: 'var(--color-announcement)',
                    color: 'var(--color-announcement-text)',
                }}
            >
                <div className="flex items-center whitespace-nowrap animate-marquee text-[11px] leading-none opacity-90">
                    {[0, 1, 2, 3].map((i) => (
                        <span key={i} className="px-4">
                            {i % 2 === 1 && <span className="mr-3 opacity-50">•</span>}
                            {announcementMobile}
                        </span>
                    ))}
                </div>
            </div>

            {/* ── 2a. Default row: logo + search icon ──────────────────────── */}
            {!searchOpen && (
                <div
                    className="flex items-center justify-between px-4"
                    style={{ height: '52px' }}
                >
                    {/* Logo / brand name */}
                    <Link to="/" className="flex items-center gap-2 shrink-0">
                        {logoUrl ? (
                            <img
                                src={logoUrl}
                                alt={brandName}
                                className="h-8 w-auto max-w-[130px] object-contain"
                                draggable="false"
                            />
                        ) : (
                            <Wordmark />
                        )}
                    </Link>

                    {/* Search icon button */}
                    <button
                        onClick={() => setSearchOpen(true)}
                        aria-label="Open search"
                        className="flex items-center justify-center w-9 h-9 rounded-full transition active:scale-90"
                        style={{ backgroundColor: 'var(--color-bg)' }}
                    >
                        <SearchIcon sx={{ fontSize: '20px', color: 'var(--color-accent)' }} />
                    </button>
                </div>
            )}

            {/* ── 2b. Expanded search row ───────────────────────────────────── */}
            {searchOpen && (
                <form
                    onSubmit={handleSearch}
                    className="flex items-center gap-2 px-3"
                    style={{ height: '52px' }}
                >
                    {/* Search input + submit button */}
                    <div
                        className="flex-1 flex items-stretch overflow-hidden rounded-xl"
                        style={{
                            background: 'var(--color-bg)',
                            border: '1.5px solid var(--color-accent)',
                            height: '38px',
                        }}
                    >
                        <input
                            autoFocus
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            className="flex-1 bg-transparent px-3 text-sm outline-none"
                            style={{ color: 'var(--color-text-primary)' }}
                            type="text"
                            placeholder="Search products..."
                        />
                        <button
                            type="submit"
                            aria-label="Search"
                            style={{
                                backgroundColor: 'var(--color-accent)',
                                width: '44px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                border: 'none',
                                cursor: 'pointer',
                                color: '#fff',
                                borderTopRightRadius: '10px',
                                borderBottomRightRadius: '10px',
                            }}
                        >
                            <SearchIcon sx={{ fontSize: '18px' }} />
                        </button>
                    </div>

                    {/* Close / cancel */}
                    <button
                        type="button"
                        onClick={() => { setSearchOpen(false); setKeyword(''); }}
                        aria-label="Close search"
                        className="flex items-center justify-center rounded-full shrink-0"
                        style={{
                            width: '36px',
                            height: '36px',
                            backgroundColor: 'var(--color-bg)',
                            color: 'var(--color-text-secondary)',
                            border: 'none',
                            cursor: 'pointer',
                        }}
                    >
                        <CloseIcon sx={{ fontSize: '18px' }} />
                    </button>
                </form>
            )}
        </div>
    );
};

export default MobileTopBar;
