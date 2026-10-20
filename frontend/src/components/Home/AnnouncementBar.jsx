import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import SecurityIcon from '@mui/icons-material/Security';
import PhoneIcon from '@mui/icons-material/Phone';
import { DEFAULT_SITE_CONFIG } from '../../utils/siteConfig';
import { useSiteConfig } from '../../context/SiteConfigContext';

// Strip leading emoji chars from an announcement string so we can show
// a proper MUI icon instead.  Returns the cleaned text.
const stripLeadingEmoji = (str = '') =>
    str.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}\u{FE0F}\u{20E3}\s]+/u, '').trim();

// MegaMart-style top micro-bar:
//   desktop: left brand tagline | right: utility links with MUI icons
//   mobile:  scrolling ticker (no icons, pure text)
//
// Reads from the shared SiteConfigContext (one request for the whole app)
// and stays quiet until it has loaded: the defaults contain placeholder copy
// like "Hotline: 017XXXXXXXX", which must never flash on the live site.
const AnnouncementBar = () => {
    const { config, ready } = useSiteConfig();

    const announcement = ready
        ? (config.announcement || DEFAULT_SITE_CONFIG.announcement)
        : { desktop: [], mobile: '' };

    const desktop = Array.isArray(announcement.desktop) ? announcement.desktop : [];
    const mobile  = announcement.mobile || '';

    return (
        <div
            className="w-full select-none text-xs"
            style={{
                backgroundColor: 'var(--color-announcement)',
                color: 'var(--color-announcement-text)',
            }}
        >
            {/* ── Desktop ─────────────────────────────────────────────────── */}
            <div className="hidden md:flex max-w-7xl mx-auto px-4 lg:px-6 h-8 items-center justify-between gap-4">
                {/* Left: main brand message */}
                <span className="flex items-center gap-1.5 font-medium opacity-90 truncate">
                    <LocalShippingIcon sx={{ fontSize: '13px' }} />
                    {stripLeadingEmoji(desktop[0])}
                </span>

                {/* Right: secondary announcements */}
                <div className="flex items-center gap-5 shrink-0 opacity-90">
                    {desktop.slice(1).map((item, i) => {
                        return (
                            <span key={i} className="flex items-center gap-1.5 whitespace-nowrap">
                                {i === 0 && <SecurityIcon   sx={{ fontSize: '13px' }} />}
                                {i === 1 && <PhoneIcon       sx={{ fontSize: '13px' }} />}
                                {i >= 2 && <LocalOfferIcon  sx={{ fontSize: '13px' }} />}
                                {stripLeadingEmoji(item)}
                            </span>
                        );
                    })}
                </div>
            </div>

            {/* ── Mobile: scrolling ticker (text only, no icons needed) ───── */}
            <div className="md:hidden h-7 flex items-center overflow-hidden">
                <div className="flex items-center whitespace-nowrap animate-marquee text-[11px] leading-none opacity-90">
                    {[0, 1, 2, 3].map((i) => (
                        <span key={i} className="px-4">
                            {i % 2 === 1 && <span className="mr-3 opacity-50">•</span>}
                            {mobile}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AnnouncementBar;
