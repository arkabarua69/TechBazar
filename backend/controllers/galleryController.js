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
const ErrorHandler = require('../utils/errorHandler');
const { invalidateOgCache } = require('../utils/ogMeta');

/**
 * Aggregate every image URL the storefront is currently using.
 * Shared by the public gallery listing and the download proxy (which only
 * allows URLs that are actually part of the gallery — an SSRF guard).
 */
const collectGalleryImages = async () => {

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
            (hero.banners || []).forEach((banner, i) => {
                const url = typeof banner === 'string' ? banner : banner?.image;
                const title = (typeof banner === 'object' && banner?.title) || hero.title || '';
                push(url, { source: 'hero_banner', label: `Hero Banner ${i + 1}`, sublabel: title });
            });
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

    return images;
};

exports.getGallery = asyncErrorHandler(async (req, res) => {
    const images = await collectGalleryImages();
    res.status(200).json({
        success: true,
        count: images.length,
        images,
    });
});

/**
 * Admin-only: permanently remove an image from the gallery by URL.
 *
 * The gallery is an aggregate view, so "removing" an image means clearing
 * every place that references that URL:
 *   • product photos / product brand logos
 *   • hero banners, shared hero image, hero side cards
 *   • site logo / favicon (SiteConfig + WebsiteConfig)
 *   • OG meta image
 *
 * The file itself stays on ImgBB (their API has no delete endpoint), but it
 * disappears from the storefront and from the gallery.
 */
exports.deleteGalleryImage = asyncErrorHandler(async (req, res, next) => {
    const url = String(req.body?.url || '').trim();
    if (!/^https?:\/\/.+/i.test(url)) {
        return next(new ErrorHandler('A valid image URL is required', 400));
    }

    let removed = 0;

    // ── 1. Products: photos + brand logo ───────────────────────────────────
    const products = await Product.find({
        $or: [{ 'images.url': url }, { 'brand.logo.url': url }],
    });

    for (const product of products) {
        let changed = false;

        const images = Array.isArray(product.images) ? product.images : [];
        if (images.some((img) => img?.url === url)) {
            product.images = images.filter((img) => img?.url !== url);
            removed += images.length - product.images.length;
            changed = true;
        }

        if (product.brand?.logo?.url === url) {
            product.set('brand.logo.url', '');
            product.set('brand.logo.public_id', '');
            removed += 1;
            changed = true;
        }

        if (changed) await product.save();
    }

    // ── 2. SiteConfig: hero banners / hero cards / logo / favicon / OG ──────
    const sc = await SiteConfig.findOne().sort('-updatedAt');
    if (sc) {
        let changed = false;

        const banners = Array.isArray(sc.get('hero.banners')) ? sc.get('hero.banners') : [];
        const kept = banners.filter((banner) => {
            const img = typeof banner === 'string' ? banner : banner?.image;
            return img !== url;
        });
        if (kept.length !== banners.length) {
            sc.set('hero.banners', kept);
            removed += banners.length - kept.length;
            changed = true;
        }

        const clearIf = (path) => {
            if (sc.get(path) === url) {
                sc.set(path, '');
                removed += 1;
                changed = true;
            }
        };
        clearIf('hero.image');
        clearIf('hero.sideTop.image');
        clearIf('hero.sideBottom.image');
        clearIf('branding.logoUrl');
        clearIf('branding.faviconUrl');
        clearIf('seo.metaOgImage');

        if (changed) await sc.save();
    }

    // ── 3. WebsiteConfig: logo / favicon / OG image ────────────────────────
    try {
        const wc = await WebsiteConfig.getCurrentConfig();
        if (wc) {
            let changed = false;
            const clearIf = (path) => {
                if (wc.get(path) === url) {
                    wc.set(path, '');
                    removed += 1;
                    changed = true;
                }
            };
            clearIf('branding.logoUrl');
            clearIf('branding.faviconUrl');
            clearIf('seo.metaOgImage');
            if (changed) await wc.save();
        }
    } catch (_) {
        // WebsiteConfig is optional — SiteConfig was already handled above.
    }

    invalidateOgCache();

    res.status(200).json({
        success: true,
        message: removed > 0 ? 'Image removed' : 'Image was not attached to any setting',
        removed,
    });
});

// ── Download proxy ─────────────────────────────────────────────────────────
const MAX_DOWNLOAD_BYTES = 30 * 1024 * 1024; // 30 MB

const filenameFor = (url, contentType) => {
    let base = '';
    try {
        base = decodeURIComponent(new URL(url).pathname.split('/').filter(Boolean).pop() || '');
    } catch (_) {}
    base = base.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/^[-.]+|[-.]+$/g, '');
    if (!base) base = 'image';
    if (!/\.[a-z0-9]{2,5}$/i.test(base)) {
        const ext = {
            'image/jpeg': 'jpg',
            'image/png': 'png',
            'image/webp': 'webp',
            'image/gif': 'gif',
            'image/svg+xml': 'svg',
            'image/avif': 'avif',
        }[contentType] || 'jpg';
        base += `.${ext}`;
    }
    return base;
};

/**
 * GET /api/v1/gallery/download?url=...
 *
 * Streams a gallery image back with `Content-Disposition: attachment` so the
 * browser saves it instead of opening it (cross-origin images can't be forced
 * to download with the HTML `download` attribute alone).
 *
 * Public, but only URLs that are part of the gallery are proxied.
 */
exports.downloadGalleryImage = asyncErrorHandler(async (req, res, next) => {
    const url = String(req.query.url || '').trim();
    if (!/^https?:\/\//i.test(url)) {
        return next(new ErrorHandler('A valid image URL is required', 400));
    }

    // SSRF guard: the URL must be one the gallery actually lists.
    const gallery = await collectGalleryImages();
    if (!gallery.some((img) => img.url === url)) {
        return next(new ErrorHandler('Image not found in the gallery', 404));
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);

    try {
        const upstream = await fetch(url, {
            signal: controller.signal,
            redirect: 'follow',
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; StoreGallery/1.0)' },
        });

        if (!upstream.ok) {
            return next(new ErrorHandler('Could not fetch the image', 502));
        }

        const contentType = String(upstream.headers.get('content-type') || '')
            .split(';')[0].trim().toLowerCase();
        if (!contentType.startsWith('image/')) {
            return next(new ErrorHandler('URL is not an image', 415));
        }

        const declaredSize = Number(upstream.headers.get('content-length') || 0);
        if (declaredSize > MAX_DOWNLOAD_BYTES) {
            return next(new ErrorHandler('Image is too large to download', 413));
        }

        const buffer = Buffer.from(await upstream.arrayBuffer());
        if (buffer.length === 0) {
            return next(new ErrorHandler('The image is empty', 502));
        }
        if (buffer.length > MAX_DOWNLOAD_BYTES) {
            return next(new ErrorHandler('Image is too large to download', 413));
        }

        res.set({
            'Content-Type': contentType,
            'Content-Disposition': `attachment; filename="${filenameFor(url, contentType)}"`,
            'Content-Length': String(buffer.length),
            'Cache-Control': 'public, max-age=86400',
        });
        return res.status(200).send(buffer);
    } catch (err) {
        if (err?.name === 'AbortError') {
            return next(new ErrorHandler('The image host took too long to respond', 504));
        }
        return next(new ErrorHandler('Could not download the image', 502));
    } finally {
        clearTimeout(timer);
    }
});
