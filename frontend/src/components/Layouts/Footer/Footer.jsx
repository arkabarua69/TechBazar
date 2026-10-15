import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import WorkIcon from '@mui/icons-material/Work';
import StarsIcon from '@mui/icons-material/Stars';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import HelpIcon from '@mui/icons-material/Help';
import PhoneIcon from '@mui/icons-material/Phone';
import AppleIcon from '@mui/icons-material/Apple';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CopyrightIcon from '@mui/icons-material/Copyright';
import paymentMethods from '../../../assets/images/payment-methods.svg';
import { useLocation } from 'react-router-dom';
import { useSiteConfig } from '../../../context/SiteConfigContext';
import { DEFAULT_SITE_CONFIG } from '../../../utils/siteConfig';

const SHORTCUT_ICONS = { Work: WorkIcon, Stars: StarsIcon, CardGiftcard: CardGiftcardIcon, Help: HelpIcon };

const FooterLink = ({ item }) =>
    item.internal ? (
        <Link to={item.redirect} className="block text-sm transition-opacity hover:opacity-100" style={{ color: 'var(--color-footer-text)', opacity: 0.7 }}>
            › {item.name}
        </Link>
    ) : (
        <a href={item.redirect} target="_blank" rel="noreferrer" className="block text-sm transition-opacity hover:opacity-100" style={{ color: 'var(--color-footer-text)', opacity: 0.7 }}>
            › {item.name}
        </a>
    );

const Footer = () => {
    const location = useLocation();
    const [adminRoute, setAdminRoute] = useState(false);

    const { config } = useSiteConfig();
    const footer = config.content?.footer || DEFAULT_SITE_CONFIG.content.footer;
    const columns = footer.columns || [];
    const company = footer.company || {};
    const shortcuts = footer.shortcuts || [];
    const since = footer.since || 2007;
    const brandName = config.branding?.name || 'Store';

    useEffect(() => {
        setAdminRoute(location.pathname.startsWith('/admin'));
    }, [location]);

    if (adminRoute) return null;

    return (
        <footer style={{ backgroundColor: 'var(--color-footer)', color: 'var(--color-footer-text)' }}>

            {/* ── Shortcut strip ── */}
            <div className="border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                <div className="max-w-7xl mx-auto px-4 lg:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
                    {shortcuts.map((s, i) => {
                        const Icon = SHORTCUT_ICONS[s.icon] || WorkIcon;
                        const inner = (
                            <span className="flex items-center gap-2 text-sm font-medium transition-opacity hover:opacity-100" style={{ color: 'var(--color-footer-text)', opacity: 0.75 }}>
                                <Icon sx={{ fontSize: '18px', color: 'var(--color-accent)' }} />
                                {s.label}
                            </span>
                        );
                        return s.href?.startsWith('/') ? (
                            <Link key={i} to={s.href}>{inner}</Link>
                        ) : (
                            <a key={i} href={s.href || '/policy'} target="_blank" rel="noreferrer">{inner}</a>
                        );
                    })}
                    <img draggable="false" src={paymentMethods} alt="Payment Methods" className="h-6 opacity-60" />
                </div>
            </div>

            {/* ── Main columns ── */}
            <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8 sm:py-10">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 sm:gap-8">

                    {/* Brand + contact */}
                    <div className="col-span-2 sm:col-span-1">
                        <h3 className="font-bold text-lg mb-3" style={{ color: 'var(--color-footer-text)' }}>{brandName}</h3>
                        {company.telephone && (
                            <div className="flex items-center gap-2 mb-3">
                                <PhoneIcon sx={{ fontSize: '15px', color: 'var(--color-accent)' }} />
                                <a href={`tel:${company.telephone}`} className="text-sm transition-opacity hover:opacity-100" style={{ color: 'var(--color-footer-text)', opacity: 0.7 }}>
                                    {company.telephone}
                                </a>
                            </div>
                        )}
                        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-footer-text)', opacity: 0.45 }}>Download App</p>
                        <div className="flex gap-2">
                            <a href="https://apps.apple.com" target="_blank" rel="noreferrer"
                               className="flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-medium transition-opacity hover:opacity-90"
                               style={{ borderColor: 'rgba(255,255,255,0.18)', color: 'var(--color-footer-text)' }}>
                                <AppleIcon sx={{ fontSize: '15px' }} /> App Store
                            </a>
                            <a href="https://play.google.com" target="_blank" rel="noreferrer"
                               className="flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-medium transition-opacity hover:opacity-90"
                               style={{ borderColor: 'rgba(255,255,255,0.18)', color: 'var(--color-footer-text)' }}>
                                <PlayArrowIcon sx={{ fontSize: '15px' }} /> Play
                            </a>
                        </div>
                    </div>

                    {/* Link columns from CMS */}
                    {columns.map((col, i) => (
                        <div key={i}>
                            <h4 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--color-footer-text)' }}>
                                {col.title}
                            </h4>
                            <div className="flex flex-col gap-1.5">
                                {(col.links || []).map((item, j) => (
                                    <FooterLink item={item} key={j} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Copyright bar ── */}
            <div className="border-t text-center py-4 text-xs" style={{ borderColor: 'rgba(255,255,255,0.07)', color: 'var(--color-footer-text)', opacity: 0.5 }}>
                <CopyrightIcon sx={{ fontSize: '13px', verticalAlign: 'middle', marginRight: '4px' }} />
                {since}–{new Date().getFullYear()} All rights reserved · {company.name || brandName}
            </div>
        </footer>
    );
};

export default Footer;
