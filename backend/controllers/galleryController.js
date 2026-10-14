/**
 * Gallery Controller
 *
 * Public endpoint — aggregates every ImgBB-hosted image stored in the database:
 *   • Product images (all products)
 *   • Product brand logos
 *   • SiteConfig hero / side-card images
 *   • SiteConfig / WebsiteConfig branding logo & favicon
 *
 * Returns a flat, de-duplicated list of image objects sorted newest-first.
 * No authentication required — these are already publicly visible on the store.
 */

const Product       = require('../models/productModel');
const SiteConfig    = require('../models/siteConfigModel');
const WebsiteConfig = require('../models/websiteConfigModel');
const asyncErrorHandler = require('../middlewares/asyncErrorHandler');

exports.getGallery = asyncErrorHandler(async (req, res) => {

    const images = [];
    const seen   = new Set(); // deduplicate by URL

    const push = (url, meta = {}) => {
        if (!url || typeof url !== 'string' || !url.startsWith('http')) return;
        if (seen.has(url)) return;
        seen.add(url);
        images.push({ url, ...meta });
    };

    // ── 1. Products ──────────────────────────────────────────────────────────
    const products = await Product.find({}, 'name category images brand createdAt').lean();

    for (const p of products) {
        // product photos
        for (const img of (p.images || [])) {
            push(img.url, {
                source:    'product',
                sourceId:  String(p._id),
                label:     p.name   || 'Product',
                sublabel:  p.category || '',
                thumbUrl:  img.imgbb?.thumb_url || img.url,
                deleteUrl: img.imgbb?.delete_url || '',
                width:     img.imgbb?.width  || 0,
                height:    img.imgbb?.height || 0,
                size:      img.imgbb?.size   || 0,
                addedAt:   p.createdAt,
            });
        }
        // brand logo
        const logo = p.brand?.logo;
        if (logo?.url) {
            push(logo.url, {
                source:    'brand_logo',
                sourceId:  String(p._id),
                label:     p.brand?.name || 'Brand Logo',
                sublabel:  p.name || '',
                thumbUrl:  logo.imgbb?.thumb_url || logo.url,
                deleteUrl: logo.imgbb?.delete_url || '',
                width:     logo.imgbb?.width  || 0,
                height:    logo.imgbb?.height || 0,
                size:      logo.imgbb?.size   || 0,
                addedAt:   p.createdAt,
            });
        }
    }

    // ── 2. SiteConfig (hero banners / branding logo) ──────────────────────
    try {
        const sc = await SiteConfig.findOne().lean();
        if (sc) {
            const hero = sc.hero || {};
            push(hero.image, { source: 'hero_banner',   label: 'Hero Banner',         sublabel: hero.title    || '' });
            push(hero.sideTop?.image,    { source: 'hero_card', label: 'Hero Top Card',    sublabel: hero.sideTop?.title    || '' });
            push(hero.sideBottom?.image, { source: 'hero_card', label: 'Hero Bottom Card', sublabel: hero.sideBottom?.title || '' });

            push(sc.branding?.logoUrl, { source: 'site_logo',    label: 'Site Logo',    sublabel: sc.branding?.name || '' });
            push(sc.branding?.faviconUrl, { source: 'favicon',   label: 'Favicon',      sublabel: '' });
        }
    } catch (_) {}

    // ── 3. WebsiteConfig (branding logo / favicon / OG image) ────────────
    try {
        const wc = await WebsiteConfig.getCurrentConfig();
        if (wc) {
            const wcObj = wc.toObject ? wc.toObject() : wc;
            push(wcObj.branding?.logoUrl,    { source: 'site_logo',  label: 'Site Logo (Config)',   sublabel: '' });
            push(wcObj.branding?.faviconUrl, { source: 'favicon',    label: 'Favicon (Config)',     sublabel: '' });
            push(wcObj.seo?.metaOgImage,     { source: 'og_image',   label: 'OG Meta Image',        sublabel: '' });
        }
    } catch (_) {}

    // Sort newest-first (images without addedAt go last)
    images.sort((a, b) => {
        if (!a.addedAt && !b.addedAt) return 0;
        if (!a.addedAt) return 1;
        if (!b.addedAt) return -1;
        return new Date(b.addedAt) - new Date(a.addedAt);
    });

    res.status(200).json({
        success: true,
        count: images.length,
        images,
    });
});
