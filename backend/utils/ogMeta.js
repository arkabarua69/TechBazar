/**
 * Open Graph / social-preview helpers.
 *
 * The storefront is a client-rendered SPA, so Facebook / WhatsApp / Telegram /
 * Twitter crawlers (which do NOT run JavaScript) only ever see the raw HTML
 * document. This module builds a complete set of OG + Twitter meta tags from
 * the saved site config and injects them into the HTML document so shared
 * links show the uploaded OG image, page title and description.
 *
 * Used by:
 *   - GET /api/og                 (public endpoint, also used by Vercel rewrites)
 *   - server.js production branch (bot requests to the SPA fallback)
 */

const fs = require('fs');
const path = require('path');
const SiteConfig = require('../models/siteConfigModel');
const Product = require('../models/productModel');

// Only social/link-preview crawlers are served the injected HTML. Googlebot is
// deliberately NOT included: it renders JavaScript and should receive the real
// SPA document so it can index the page content.
const CRAWLER_RE = /facebookexternalhit|facebookcatalog|facebot|whatsapp|twitterbot|telegrambot|linkedinbot|slackbot|discordbot|pinterest(?:bot)?|redditbot|embedly|quora link preview|vkShare|skypeuripreview|iframely|outbrain|nuzzel|flipboard|tumblr|mastodon|bluesky|threads/i;

const isCrawler = (userAgent) => CRAWLER_RE.test(String(userAgent || ''));

const escapeHtml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const oneLine = (value, max) => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

/** Make relative image/URL values absolute; keeps data: URLs untouched. */
const absoluteUrl = (url, base) => {
    const raw = String(url || '').trim();
    if (!raw) return '';
    if (/^(https?:)?\/\//i.test(raw)) return raw.startsWith('//') ? `https:${raw}` : raw;
    if (/^data:/i.test(raw)) return raw;
    const origin = String(base || '').replace(/\/+$/, '');
    return `${origin}${raw.startsWith('/') ? '' : '/'}${raw}`;
};

// Cache the storefront config for a few seconds — bots tend to arrive in bursts.
let configCache = { at: 0, value: null };
const CONFIG_TTL_MS = 15 * 1000;

const loadStoreConfig = async () => {
    if (configCache.value && Date.now() - configCache.at < CONFIG_TTL_MS) return configCache.value;
    try {
        configCache.value = await SiteConfig.findOne().sort('-updatedAt').lean();
    } catch {
        configCache.value = null;
    }
    configCache.at = Date.now();
    return configCache.value;
};

/** Clear the cache after an admin save (called by websiteConfigController). */
const invalidateOgCache = () => { configCache = { at: 0, value: null }; };

const firstImage = (images) => {
    const list = Array.isArray(images) ? images : [];
    for (const image of list) {
        const url = typeof image === 'string' ? image : image?.url || image?.display_url;
        if (url) return url;
    }
    return '';
};

/**
 * Build the meta values for one path.
 * The product page gets its own title/description/image/price so shared product
 * links look right even though the SPA can't run for crawlers.
 */
const buildOgMeta = async ({ pathname = '/', origin = '' } = {}) => {
    const config = (await loadStoreConfig()) || {};
    const seo = config.seo || {};
    const branding = config.branding || {};
    const siteName = oneLine(branding.name, 80) || 'Store';
    // Full default title set in Admin → Config → General → Site Title.
    const siteTitle = oneLine(seo.siteTitle, 160);

    // Prefer the admin-configured public URL when present (for canonical URLs),
    // otherwise fall back to the origin of the incoming request.
    const siteOrigin = String(seo.siteUrl || origin || '').replace(/\/+$/, '');

    let pageTitle = '';
    let description = seo.description || branding.tagline || '';
    let image = seo.metaOgImage || '';
    let type = seo.metaOgType || 'website';
    let price = null;

    const productMatch = pathname.match(/^\/product\/([a-f0-9]{24})/i);
    if (productMatch) {
        try {
            const product = await Product.findById(productMatch[1])
                .select('name description images price cuttedPrice')
                .lean();
            if (product) {
                pageTitle = product.name || '';
                description = oneLine(product.description, 300) || description;
                image = firstImage(product.images) || image;
                type = 'product';
                if (Number(product.price) > 0) price = Number(product.price);
            }
        } catch {
            // Unknown/invalid product id — fall back to the site defaults.
        }
    } else if (/^\/products?(\/|$)/.test(pathname)) {
        pageTitle = 'Shop All Products';
    } else if (/^\/cart(\/|$)/.test(pathname)) {
        pageTitle = 'Shopping Cart';
    } else if (/^\/policy(\/|$)/.test(pathname)) {
        pageTitle = 'Policies';
    }

    const template = seo.titleTemplate || `%s | ${siteName}`;
    const title = pageTitle
        ? (template.includes('%s') ? template.replace('%s', pageTitle) : pageTitle)
        : (siteTitle || siteName);

    if (!image) {
        const banners = Array.isArray(config.hero?.banners) ? config.hero.banners : [];
        image = banners
            .map((banner) => (typeof banner === 'string' ? banner : banner?.image))
            .find(Boolean) || config.hero?.image || branding.logoUrl || '';
    }

    return {
        title: oneLine(title, 160) || siteName,
        description: oneLine(description, 300),
        image: absoluteUrl(image, siteOrigin || origin),
        url: absoluteUrl(pathname, siteOrigin || origin),
        type,
        siteName,
        keywords: oneLine(seo.metaKeywords, 300),
        robots: oneLine(seo.metaRobots, 80),
        price,
    };
};

const buildMetaTags = (meta) => {
    const tags = [
        meta.description ? `<meta name="description" content="${escapeHtml(meta.description)}" />` : '',
        meta.keywords ? `<meta name="keywords" content="${escapeHtml(meta.keywords)}" />` : '',
        meta.robots ? `<meta name="robots" content="${escapeHtml(meta.robots)}" />` : '',
        meta.url ? `<link rel="canonical" href="${escapeHtml(meta.url)}" />` : '',

        `<meta property="og:type" content="${escapeHtml(meta.type)}" />`,
        `<meta property="og:site_name" content="${escapeHtml(meta.siteName)}" />`,
        `<meta property="og:title" content="${escapeHtml(meta.title)}" />`,
        meta.description ? `<meta property="og:description" content="${escapeHtml(meta.description)}" />` : '',
        meta.url ? `<meta property="og:url" content="${escapeHtml(meta.url)}" />` : '',
        meta.image ? `<meta property="og:image" content="${escapeHtml(meta.image)}" />` : '',
        meta.image ? `<meta property="og:image:secure_url" content="${escapeHtml(meta.image)}" />` : '',
        meta.image ? `<meta property="og:image:alt" content="${escapeHtml(meta.title)}" />` : '',
        meta.price ? `<meta property="product:price:amount" content="${escapeHtml(meta.price)}" />` : '',
        meta.price ? `<meta property="product:price:currency" content="BDT" />` : '',

        `<meta name="twitter:card" content="${meta.image ? 'summary_large_image' : 'summary'}" />`,
        `<meta name="twitter:title" content="${escapeHtml(meta.title)}" />`,
        meta.description ? `<meta name="twitter:description" content="${escapeHtml(meta.description)}" />` : '',
        meta.image ? `<meta name="twitter:image" content="${escapeHtml(meta.image)}" />` : '',
    ];
    return tags.filter(Boolean).join('\n        ');
};

/** Minimal standalone document used when the built index.html is unavailable. */
const fallbackTemplate = (meta) => `<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${escapeHtml(meta.title)}</title>
        ${buildMetaTags(meta)}
    </head>
    <body>
        <h1>${escapeHtml(meta.title)}</h1>
        <p>${escapeHtml(meta.description)}</p>
        ${meta.image ? `<img src="${escapeHtml(meta.image)}" alt="${escapeHtml(meta.title)}" />` : ''}
        <p><a href="${escapeHtml(meta.url)}">${escapeHtml(meta.siteName)}</a></p>
    </body>
</html>`;

// Read the built SPA document once (production only). Falls back to `null`.
let indexTemplateCache;
const loadIndexTemplate = () => {
    if (indexTemplateCache !== undefined) return indexTemplateCache;
    try {
        const file = path.resolve(__dirname, '..', '..', 'frontend', 'build', 'index.html');
        indexTemplateCache = fs.readFileSync(file, 'utf8');
    } catch {
        indexTemplateCache = null;
    }
    return indexTemplateCache;
};

/**
 * Render the HTML document for a crawler request with OG tags injected.
 * `template` lets server.js pass the already-read SPA document.
 */
const renderOgHtml = async ({ pathname = '/', origin = '', template } = {}) => {
    const meta = await buildOgMeta({ pathname, origin });
    const base = template || loadIndexTemplate();

    if (!base) return fallbackTemplate(meta);

    let html = base;
    // Replace the static <title>…</title> (if any).
    if (/<title>[\s\S]*?<\/title>/i.test(html)) {
        html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(meta.title)}</title>`);
    } else {
        html = html.replace(/<\/head>/i, `    <title>${escapeHtml(meta.title)}</title>\n</head>`);
    }
    // Drop the static description so we don't end up with two of them.
    html = html.replace(/<meta\s+name=["']description["'][^>]*>\s*/gi, '');
    html = html.replace(/<\/head>/i, `    ${buildMetaTags(meta)}\n</head>`);
    return html;
};

module.exports = {
    isCrawler,
    buildOgMeta,
    buildMetaTags,
    renderOgHtml,
    invalidateOgCache,
};
