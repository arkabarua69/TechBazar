import { Helmet } from "react-helmet";
import { useSiteConfig } from '../../context/SiteConfigContext';

// Page title, description and the full Open Graph / Twitter card set.
//
// Values come from the admin-editable site config (Admin → Config → SEO /
// Homepage). The uploaded OG image is used for social previews everywhere,
// with sensible fallbacks (page image → hero banner → logo).
//
// Crawlers that don't run JavaScript are handled separately by
// backend/utils/ogMeta.js (GET /api/og and the production SPA fallback).

const absoluteUrl = (url) => {
    const raw = String(url || '').trim();
    if (!raw) return '';
    if (/^(https?:)?\/\//i.test(raw)) return raw.startsWith('//') ? `https:${raw}` : raw;
    if (/^data:/i.test(raw)) return raw;
    return `${window.location.origin}${raw.startsWith('/') ? '' : '/'}${raw}`;
};

const MetaData = ({ title, description, image, type, url }) => {
    const { config } = useSiteConfig();
    const seo = config.seo || {};
    const brand = config.branding?.name || 'Store';

    let clean = title || '';
    const suffix = ` | ${brand}`;
    if (clean.endsWith(suffix)) clean = clean.slice(0, -suffix.length);

    // No page title → use the brand name instead of a dangling " | Brand".
    const template = seo.titleTemplate || `%s | ${brand}`;
    const fullTitle = clean
        ? (template.includes('%s') ? template.replace('%s', clean) : clean)
        : (seo.siteName || brand);

    const metaDescription = String(description || seo.description || '').replace(/\s+/g, ' ').trim().slice(0, 300);

    // Uploaded OG image wins; fall back to the page image, hero banner, logo.
    const heroBanner = (config.hero?.banners || [])
        .map((banner) => (typeof banner === 'string' ? banner : banner?.image))
        .find(Boolean);
    const ogImage = absoluteUrl(
        image || seo.metaOgImage || heroBanner || config.hero?.image || config.branding?.logoUrl || ''
    );

    const canonical = absoluteUrl(url) || window.location.href;
    const ogType = type || seo.metaOgType || 'website';
    const robots = seo.metaRobots || 'index, follow';

    return (
        <Helmet>
            <title>{fullTitle}</title>
            {metaDescription ? <meta name="description" content={metaDescription} /> : null}
            {seo.metaKeywords ? <meta name="keywords" content={seo.metaKeywords} /> : null}
            <meta name="robots" content={robots} />
            <link rel="canonical" href={canonical} />

            {/* Open Graph — Facebook, WhatsApp, Telegram, LinkedIn, Discord… */}
            <meta property="og:type" content={ogType} />
            <meta property="og:site_name" content={brand} />
            <meta property="og:title" content={fullTitle} />
            {metaDescription ? <meta property="og:description" content={metaDescription} /> : null}
            <meta property="og:url" content={canonical} />
            {ogImage ? <meta property="og:image" content={ogImage} /> : null}
            {ogImage ? <meta property="og:image:secure_url" content={ogImage} /> : null}
            {ogImage ? <meta property="og:image:alt" content={fullTitle} /> : null}

            {/* Twitter / X */}
            <meta name="twitter:card" content={ogImage ? 'summary_large_image' : 'summary'} />
            <meta name="twitter:title" content={fullTitle} />
            {metaDescription ? <meta name="twitter:description" content={metaDescription} /> : null}
            {ogImage ? <meta name="twitter:image" content={ogImage} /> : null}
        </Helmet>
    );
};

export default MetaData;
