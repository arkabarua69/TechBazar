import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import AppleIcon from '@mui/icons-material/Apple';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CopyrightIcon from '@mui/icons-material/Copyright';
import FacebookIcon from '@mui/icons-material/Facebook';
import TwitterIcon from '@mui/icons-material/Twitter';
import InstagramIcon from '@mui/icons-material/Instagram';
import YouTubeIcon from '@mui/icons-material/YouTube';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import { useLocation } from 'react-router-dom';
import { useSiteConfig } from '../../../context/SiteConfigContext';
import { DEFAULT_SITE_CONFIG } from '../../../utils/siteConfig';

const FooterLink = ({ item }) => {
    if (!item?.name) return null;
    const redirect = item.redirect || '#';
    const isInternal = item.internal !== false && !/^https?:\/\//i.test(redirect);
    if (isInternal) {
        return (
            <Link to={redirect} className="block text-sm transition-opacity hover:opacity-100" style={{ color: 'var(--color-footer-text)', opacity: 0.75 }}>
                {item.name}
            </Link>
        );
    }
    return (
        <a href={redirect} target="_blank" rel="noopener noreferrer" className="block text-sm transition-opacity hover:opacity-100" style={{ color: 'var(--color-footer-text)', opacity: 0.75 }}>
            {item.name}
        </a>
    );
};

const SocialIcon = ({ name }) => {
    const n = String(name || '').toLowerCase();
    if (n.includes('facebook')) return <FacebookIcon sx={{ fontSize: '18px' }} />;
    if (n.includes('twitter') || n === 'x') return <TwitterIcon sx={{ fontSize: '18px' }} />;
    if (n.includes('instagram')) return <InstagramIcon sx={{ fontSize: '18px' }} />;
    if (n.includes('youtube')) return <YouTubeIcon sx={{ fontSize: '18px' }} />;
    if (n.includes('linkedin')) return <LinkedInIcon sx={{ fontSize: '18px' }} />;
    return null;
};

const Footer = () => {
    const location = useLocation();
    const [adminRoute, setAdminRoute] = useState(false);

    const { config } = useSiteConfig();
    const footer = config.content?.footer || DEFAULT_SITE_CONFIG.content.footer;
    const columns = Array.isArray(footer.columns) ? footer.columns : [];
    const company = footer.company || {};
    const since = footer.since || 2007;
    const brandName = config.branding?.name || company.name || 'Store';
    const logoUrl = config.branding?.logoUrl;
    const currentYear = new Date().getFullYear();
    const copyrightYears = since && since < currentYear ? `${since} - ${currentYear}` : `${currentYear}`;
    const copyrightText = footer.copyright || company.name || brandName;

    useEffect(() => {
        setAdminRoute(location.pathname.startsWith('/admin'));
    }, [location]);

    if (adminRoute) return null;

    const isProductRoute = location.pathname.startsWith('/product/');
    const socialLinks = (columns.find((c) => String(c.title || '').toLowerCase() === 'social')?.links) || [];

    return (
        <footer
            className={isProductRoute ? 'pb-40 md:pb-0' : ''}
            style={{ backgroundColor: 'var(--color-footer)', color: 'var(--color-footer-text)' }}
        >
            <div className="max-w-7xl mx-auto px-4 lg:px-6 py-10 sm:py-12">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-10">
                    <div className="lg:col-span-2">
                        <div className="flex items-center gap-2 mb-4">
                            {logoUrl ? (
                                <img src={logoUrl} alt={brandName} className="h-9 w-auto max-w-[160px] object-contain" draggable="false" />
                            ) : (
                                <h3 className="font-display font-extrabold text-xl" style={{ color: 'var(--color-footer-text)' }}>{brandName}</h3>
                            )}
                        </div>
                        {(company.address || company.mailUs) && (
                            <p className="text-sm whitespace-pre-line mb-3" style={{ color: 'var(--color-footer-text)', opacity: 0.75 }}>
                                {company.address || company.mailUs}
                            </p>
                        )}
                        {company.telephone && (
                            <div className="flex items-center gap-2 mb-2">
                                <PhoneIcon sx={{ fontSize: '16px', color: 'var(--color-accent)' }} />
                                <a href={`tel:${company.telephone}`} className="text-sm transition-opacity hover:opacity-100" style={{ color: 'var(--color-footer-text)', opacity: 0.85 }}>
                                    {company.telephone}
                                </a>
                            </div>
                        )}
                        {company.email && (
                            <div className="flex items-center gap-2 mb-4">
                                <EmailIcon sx={{ fontSize: '16px', color: 'var(--color-accent)' }} />
                                <a href={`mailto:${company.email}`} className="text-sm transition-opacity hover:opacity-100" style={{ color: 'var(--color-footer-text)', opacity: 0.85 }}>
                                    {company.email}
                                </a>
                            </div>
                        )}
                        {socialLinks.length > 0 && (
                            <div className="flex items-center gap-2 mt-4 flex-wrap">
                                {socialLinks.map((item, idx) => (
                                    <a
                                        key={idx}
                                        href={item.redirect || '#'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-9 h-9 rounded-full flex items-center justify-center transition-opacity hover:opacity-100"
                                        style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: 'var(--color-footer-text)', opacity: 0.9 }}
                                        aria-label={item.name}
                                    >
                                        <SocialIcon name={item.name} />
                                    </a>
                                ))}
                            </div>
                        )}
                        <p className="text-xs font-semibold uppercase tracking-wider mb-2 mt-6" style={{ color: 'var(--color-footer-text)', opacity: 0.5 }}>Download App</p>
                        <div className="flex gap-2 flex-wrap">
                            <a href={company.appStoreUrl || 'https://apps.apple.com'} target="_blank" rel="noopener noreferrer"
                               className="flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-medium transition-opacity hover:opacity-90"
                               style={{ borderColor: 'rgba(255,255,255,0.18)', color: 'var(--color-footer-text)' }}>
                                <AppleIcon sx={{ fontSize: '15px' }} /> App Store
                            </a>
                            <a href={company.playStoreUrl || 'https://play.google.com'} target="_blank" rel="noopener noreferrer"
                               className="flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-medium transition-opacity hover:opacity-90"
                               style={{ borderColor: 'rgba(255,255,255,0.18)', color: 'var(--color-footer-text)' }}>
                                <PlayArrowIcon sx={{ fontSize: '15px' }} /> Play Store
                            </a>
                        </div>
                    </div>

                    {columns
                        .filter((col) => String(col.title || '').toLowerCase() !== 'social')
                        .map((col, i) => (
                            <div key={i} className="lg:col-span-1">
                                <h4 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--color-footer-text)' }}>
                                    {col.title}
                                </h4>
                                <div className="flex flex-col gap-2">
                                    {(col.links || []).map((item, j) => (
                                        <FooterLink item={item} key={j} />
                                    ))}
                                </div>
                            </div>
                        ))}
                </div>
            </div>

            <div className="border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                <div className="max-w-7xl mx-auto px-4 lg:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
                    <div className="text-xs flex items-center gap-1" style={{ color: 'var(--color-footer-text)', opacity: 0.65 }}>
                        <CopyrightIcon sx={{ fontSize: '13px' }} />
                        <span>{copyrightYears} {copyrightText}</span>
                    </div>
                    {(company.cin || company.telephone || company.email) && (
                        <div className="text-xs flex flex-wrap items-center justify-center gap-2" style={{ color: 'var(--color-footer-text)', opacity: 0.55 }}>
                            {company.cin && <span>CIN: {company.cin}</span>}
                            {company.cin && (company.telephone || company.email) && <span>|</span>}
                            {company.telephone && <span>Tel: {company.telephone}</span>}
                            {company.telephone && company.email && <span>|</span>}
                            {company.email && <span>Email: {company.email}</span>}
                        </div>
                    )}
                </div>
            </div>
        </footer>
    );
};

export default Footer;
