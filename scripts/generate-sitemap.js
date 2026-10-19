/**
 * Generate frontend/public/sitemap.xml.
 *
 * Runs automatically before every frontend build (npm "prebuild"), so the
 * deployed sitemap always lists the current catalogue. It also works offline:
 * if the API cannot be reached the static routes are still written.
 *
 * Usage:
 *   node scripts/generate-sitemap.js
 *   SITEMAP_API_BASE=http://localhost:4000/api/v1 node scripts/generate-sitemap.js
 */

const fs = require('fs');
const path = require('path');

const API_BASE = (process.env.SITEMAP_API_BASE || 'https://www.nrxtopup.shop/api/v1').replace(/\/+$/, '');
const FALLBACK_SITE = 'https://www.nrxtopup.shop';

const STATIC_PAGES = [
    { path: '/', priority: '1.0', changefreq: 'daily' },
    { path: '/products', priority: '0.9', changefreq: 'daily' },
    { path: '/gallery', priority: '0.6', changefreq: 'weekly' },
    { path: '/track', priority: '0.5', changefreq: 'monthly' },
    { path: '/policy', priority: '0.4', changefreq: 'yearly' },
    { path: '/login', priority: '0.3', changefreq: 'yearly' },
    { path: '/register', priority: '0.3', changefreq: 'yearly' },
];

const fetchJson = async (url, timeoutMs = 15000) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(url, {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } finally {
        clearTimeout(timer);
    }
};

const xmlEscape = (value = '') => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const isoDate = (value) => {
    const d = value ? new Date(value) : new Date();
    return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
};

async function main() {
    let siteUrl = FALLBACK_SITE;
    let products = [];

    try {
        const config = await fetchJson(`${API_BASE}/siteconfig`);
        const c = config.config || config;
        if (c?.seo?.siteUrl) siteUrl = String(c.seo.siteUrl).replace(/\/+$/, '');
    } catch (err) {
        console.warn(`[sitemap] Could not read site config (${err.message}); using ${siteUrl}`);
    }

    try {
        const data = await fetchJson(`${API_BASE}/products/all`);
        products = Array.isArray(data.products) ? data.products : [];
    } catch (err) {
        console.warn(`[sitemap] Could not load products (${err.message}); writing static pages only`);
    }

    const urls = STATIC_PAGES.map((p) => ({
        loc: `${siteUrl}${p.path}`,
        lastmod: isoDate(),
        changefreq: p.changefreq,
        priority: p.priority,
    }));

    const seen = new Set(urls.map((u) => u.loc));
    for (const product of products) {
        if (!product?._id) continue;
        const loc = `${siteUrl}/product/${product._id}`;
        if (seen.has(loc)) continue;
        seen.add(loc);
        urls.push({
            loc,
            lastmod: isoDate(product.updatedAt || product.createdAt),
            changefreq: 'weekly',
            priority: '0.7',
        });
    }

    const xml = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        ...urls.map((u) => [
            '  <url>',
            `    <loc>${xmlEscape(u.loc)}</loc>`,
            `    <lastmod>${u.lastmod}</lastmod>`,
            `    <changefreq>${u.changefreq}</changefreq>`,
            `    <priority>${u.priority}</priority>`,
            '  </url>',
        ].join('\n')),
        '</urlset>',
        '',
    ].join('\n');

    const outFile = path.join(__dirname, '..', 'frontend', 'public', 'sitemap.xml');
    fs.writeFileSync(outFile, xml, 'utf8');
    console.log(`[sitemap] Wrote ${urls.length} URL(s) to ${outFile} (${products.length} product(s), site ${siteUrl})`);
}

main().catch((err) => {
    // A sitemap failure must never fail the frontend build.
    console.warn(`[sitemap] Skipped: ${err.message}`);
});
