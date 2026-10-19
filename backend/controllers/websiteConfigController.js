const WebsiteConfig = require('../models/websiteConfigModel');
const SiteConfig = require('../models/siteConfigModel');
const ErrorHandler = require('../utils/errorHandler');
const asyncErrorHandler = require('../middlewares/asyncErrorHandler');
const { uploadToImgBB, sanitizeKey } = require('../utils/imgbb');
const { isSensitivePath, MASK } = require('../models/websiteConfigModel');
const { invalidateOgCache } = require('../utils/ogMeta');
const { sendTestNotification } = require('../utils/discordNotify');

// Placeholder written in place of any real secret before it leaves the server.
const maskSecrets = (obj) => {
    const out = typeof obj?.toObject === 'function' ? obj.toObject() : JSON.parse(JSON.stringify(obj || {}));
    const walk = (node, prefix) => {
        if (!node || typeof node !== 'object') return;
        for (const key of Object.keys(node)) {
            const path = prefix ? `${prefix}.${key}` : key;
            const value = node[key];
            if (value && typeof value === 'object') {
                walk(value, path);
            } else if (value && (isSensitivePath(path) || path === 'database.mongoUri')) {
                node[key] = MASK;
            }
        }
    };
    walk(out, '');
    return out;
};

// ─── Mirror admin settings into the storefront (SiteConfig) ──────────────────
// The public website renders exclusively from GET /api/v1/siteconfig
// (the SiteConfig document). The admin "Config" page writes to WebsiteConfig,
// so any field the storefront actually shows must be copied across, otherwise
// saving it in the admin panel has no visible effect on the site.
// Only fields explicitly present in the incoming payload are written, so a
// partial update (e.g. only the branding section) never clobbers the rest.
const syncToStorefront = async (cfg = {}) => {
    const doc = (await SiteConfig.findOne().sort('-updatedAt')) || new SiteConfig();
    const set = (path, value) => {
        if (value !== undefined && value !== null) doc.set(path, value);
    };

    const {
        general = {},
        branding = {},
        payment = {},
        shipping = {},
        social = {},
        seo = {},
    } = cfg;

    // ── Identity (header, footer, page titles) ──────────────────────────────
    if (general.siteName !== undefined) set('branding.name', String(general.siteName).slice(0, 60));
    if (general.tagline !== undefined) set('branding.tagline', String(general.tagline).slice(0, 160));
    if (branding.logoUrl !== undefined) set('branding.logoUrl', branding.logoUrl);
    if (branding.faviconUrl !== undefined) set('branding.faviconUrl', branding.faviconUrl);

    // ── Contact + SEO description ───────────────────────────────────────────
    if (general.contactPhone !== undefined) set('support.hotline', general.contactPhone);
    if (social.whatsappNumber !== undefined) set('support.whatsapp', social.whatsappNumber);
    if (general.siteDescription !== undefined) set('seo.description', general.siteDescription);

    // ── SEO / Open Graph (used by MetaData + the crawler preview endpoint) ──
    if (general.siteUrl !== undefined) set('seo.siteUrl', String(general.siteUrl || '').trim().slice(0, 300));
    if (seo.metaKeywords !== undefined) set('seo.metaKeywords', String(seo.metaKeywords || '').trim().slice(0, 500));
    if (seo.metaRobots !== undefined) set('seo.metaRobots', String(seo.metaRobots || '').trim().slice(0, 80));
    if (seo.metaOgImage !== undefined) set('seo.metaOgImage', String(seo.metaOgImage || '').trim().slice(0, 1000));
    if (seo.metaOgType !== undefined) set('seo.metaOgType', String(seo.metaOgType || '').trim().slice(0, 40));

    // ── Payment numbers + delivery charges shown at checkout ────────────────
    if (payment.bKashNumber !== undefined) set('payment.bKashNumber', payment.bKashNumber);
    if (payment.nagadNumber !== undefined) set('payment.nagadNumber', payment.nagadNumber);
    if (shipping.insideDhaka !== undefined) set('delivery.insideDhaka', shipping.insideDhaka);
    if (shipping.outsideDhaka !== undefined) set('delivery.outsideDhaka', shipping.outsideDhaka);

    // ── Social links → footer "social" column ───────────────────────────────
    const socialEntries = [
        ['Facebook', social.facebookUrl],
        ['Twitter', social.twitterUrl],
        ['Instagram', social.instagramUrl],
        ['YouTube', social.youtubeUrl],
    ].filter(([, url]) => url);
    if (socialEntries.length) {
        const cols = doc.content?.footer?.columns || [];
        const socialCol = cols.find((c) => String(c.title).toLowerCase() === 'social');
        if (socialCol) {
            socialCol.links = socialEntries.map(([name, redirect]) => ({ name, redirect, internal: false }));
            doc.markModified('content.footer.columns');
        }
    }

    doc.updatedAt = new Date();
    await doc.save();
};

// Get current website configuration (admin only)
const getWebsiteConfig = asyncErrorHandler(async (req, res, next) => {
    const config = await WebsiteConfig.getCurrentConfig();
    
    // Return the config with every sensitive field masked — real secrets
    // (passwords, API keys, DB URI) never leave the server.
    const configObj = maskSecrets(config);

    res.status(200).json({
        success: true,
        config: configObj
    });
});

// Update website configuration (admin only)
const updateWebsiteConfig = asyncErrorHandler(async (req, res, next) => {
    const { config } = req.body;
    const userId = req.user._id;
    
    if (!config) {
        return next(new ErrorHandler('Configuration data is required', 400));
    }
    
    // Validate and sanitize input
    const sanitizedConfig = {};
    
    // Only allow updates to known sections
    const allowedSections = [
        'general', 'branding', 'seo', 'email', 'payment', 'cloud',
        'social', 'socialLogin', 'shipping', 'security', 'cache', 'apiKeys', 'features', 'imgbb',
        'discord'
    ];
    
    for (const section of allowedSections) {
        if (config[section]) {
            sanitizedConfig[section] = config[section];
        }
    }
    
    // Apply validation rules
    if (sanitizedConfig.general) {
        if (sanitizedConfig.general.siteName && sanitizedConfig.general.siteName.length > 100) {
            return next(new ErrorHandler('Site name too long', 400));
        }
        if (sanitizedConfig.general.contactEmail) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(sanitizedConfig.general.contactEmail)) {
                return next(new ErrorHandler('Invalid email format', 400));
            }
        }
    }
    
    if (sanitizedConfig.email) {
        if (sanitizedConfig.email.smtpPort) {
            const port = parseInt(sanitizedConfig.email.smtpPort);
            if (isNaN(port) || port < 1 || port > 65535) {
                return next(new ErrorHandler('Invalid SMTP port', 400));
            }
        }
    }
    
    if (sanitizedConfig.shipping) {
        if (sanitizedConfig.shipping.insideDhaka < 0) {
            return next(new ErrorHandler('Shipping cost cannot be negative', 400));
        }
        if (sanitizedConfig.shipping.outsideDhaka < 0) {
            return next(new ErrorHandler('Shipping cost cannot be negative', 400));
        }
    }
    
    // Update configuration
    const updatedConfig = await WebsiteConfig.updateConfig(sanitizedConfig, userId);

    // Mirror storefront-facing fields into SiteConfig so the public site updates
    await syncToStorefront(sanitizedConfig);

    // Social previews are cached briefly — drop it so the new OG image is used
    // on the very next share/crawl.
    invalidateOgCache();

    // Clear any related caches (implement based on your caching strategy)
    // Example: clearRedisCache('website-config');
    
    res.status(200).json({
        success: true,
        message: 'Configuration updated successfully',
        config: updatedConfig
    });
});

// Reset to default configuration (admin only)
const resetWebsiteConfig = asyncErrorHandler(async (req, res, next) => {
    const userId = req.user._id;
    
    // Create a new default configuration
    const defaultConfig = new WebsiteConfig();
    defaultConfig.updatedBy = userId;
    await defaultConfig.save();
    
    // Delete any previous configurations
    await WebsiteConfig.deleteMany({ _id: { $ne: defaultConfig._id } });
    invalidateOgCache();
    
    res.status(200).json({
        success: true,
        message: 'Configuration reset to defaults',
        config: defaultConfig
    });
});

// Get configuration change log (admin only)
const getConfigChangeLog = asyncErrorHandler(async (req, res, next) => {
    const { limit = 50, page = 1 } = req.query;
    const skip = (page - 1) * limit;
    
    const config = await WebsiteConfig.findOne().sort('-updatedAt');
    
    if (!config) {
        return res.status(200).json({
            success: true,
            changeLog: [],
            pagination: { page, limit, total: 0, pages: 0 }
        });
    }
    
    // Get paginated change log
    const changeLog = config.changeLog
        .sort((a, b) => new Date(b.changedAt) - new Date(a.changedAt))
        .slice(skip, skip + limit);
    
    res.status(200).json({
        success: true,
        changeLog,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: config.changeLog.length,
            pages: Math.ceil(config.changeLog.length / limit)
        }
    });
});

// Get public configuration (non-sensitive fields only)
const getPublicConfig = asyncErrorHandler(async (req, res, next) => {
    const config = await WebsiteConfig.getCurrentConfig();
    const configObj = config.toObject();
    
    // Only return non-sensitive public fields
    const publicConfig = {
        general: {
            siteName: configObj.general?.siteName,
            siteTitle: configObj.general?.siteTitle,
            siteDescription: configObj.general?.siteDescription,
            siteUrl: configObj.general?.siteUrl,
            contactEmail: configObj.general?.contactEmail,
            contactPhone: configObj.general?.contactPhone,
            currency: configObj.general?.currency,
            currencySymbol: configObj.general?.currencySymbol,
            maintenanceMode: configObj.general?.maintenanceMode,
            maintenanceMessage: configObj.general?.maintenanceMessage,
        },
        branding: configObj.branding,
        seo: {
            metaKeywords: configObj.seo?.metaKeywords,
            metaRobots: configObj.seo?.metaRobots,
            googleAnalyticsId: configObj.seo?.googleAnalyticsId,
            metaOgImage: configObj.seo?.metaOgImage,
            metaOgType: configObj.seo?.metaOgType,
        },
        social: configObj.social,
        shipping: configObj.shipping,
        features: configObj.features,
        payment: {
            bKashNumber: configObj.payment?.bKashNumber,
            nagadNumber: configObj.payment?.nagadNumber,
            defaultPaymentMethod: configObj.payment?.defaultPaymentMethod,
        }
    };
    
    res.status(200).json({
        success: true,
        config: publicConfig
    });
});

// Export configuration as JSON file (admin only)
const exportConfig = asyncErrorHandler(async (req, res, next) => {
    const config = await WebsiteConfig.getCurrentConfig();

    // Never export real secrets — the file may be shared or stored insecurely.
    const configObj = maskSecrets(config);

    // Create a timestamp for the filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `website-config-export-${timestamp}.json`;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    res.status(200).json(configObj);
});

// Import configuration from JSON file (admin only)
const importConfig = asyncErrorHandler(async (req, res, next) => {
    if (!req.files || !req.files.configFile) {
        return next(new ErrorHandler('Configuration file is required', 400));
    }
    
    const configFile = req.files.configFile;
    
    // Validate file type
    if (!configFile.name.endsWith('.json')) {
        return next(new ErrorHandler('Only JSON files are allowed', 400));
    }
    
    try {
        const configData = JSON.parse(configFile.data.toString());
        const userId = req.user._id;
        
        // Validate the imported configuration structure
        if (!configData.general || !configData.branding) {
            return next(new ErrorHandler('Invalid configuration file format', 400));
        }
        
        // Update configuration with imported data
        const updatedConfig = await WebsiteConfig.updateConfig(configData, userId);

        // Mirror storefront-facing fields into SiteConfig as well
        await syncToStorefront(configData);

        res.status(200).json({
            success: true,
            message: 'Configuration imported successfully',
            config: updatedConfig
        });
        
    } catch (error) {
        return next(new ErrorHandler('Invalid JSON file: ' + error.message, 400));
    }
});



// ─── ImgBB — Test API key ─────────────────────────────────────────────────────
// POST /api/v1/admin/imgbb/test
// Body: { apiKey: "..." } — if omitted, uses the stored/env key
const testImgbbKey = asyncErrorHandler(async (req, res, next) => {
    const { apiKey } = req.body || {};

    // Validate a key supplied from the admin panel (reject blanks / placeholders)
    let candidate = null;
    if (apiKey !== undefined && apiKey !== null && String(apiKey).trim() !== '') {
        candidate = sanitizeKey(apiKey);
        if (!candidate) {
            return next(new ErrorHandler(
                'The entered key looks like a masked placeholder. Paste the real ImgBB API key from api.imgbb.com.',
                400
            ));
        }
    }

    // 1×1 transparent GIF — minimal payload to validate the key without wasting quota
    const TINY_GIF_BASE64 =
        'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

    try {
        const data = await uploadToImgBB(TINY_GIF_BASE64, 'imgbb-key-test', 60, candidate);
        res.status(200).json({
            success: true,
            message: 'ImgBB API key is valid',
            sampleUrl: data.display_url || data.url,
        });
    } catch (err) {
        return next(new ErrorHandler(`ImgBB key test failed: ${err.message}`, 400));
    }
});

// ─── Discord — Send a test notification ──────────────────────────────────────
// POST /api/v1/admin/discord/test
// Sends a small confirmation embed to the configured webhook so the admin can
// verify the setup immediately.
const testDiscordWebhook = asyncErrorHandler(async (req, res, next) => {
    try {
        await sendTestNotification();
        res.status(200).json({
            success: true,
            message: 'Test message sent — check your Discord channel.',
        });
    } catch (err) {
        return next(new ErrorHandler(`Discord test failed: ${err.message}`, 400));
    }
});

// ─── ImgBB — Generic image upload endpoint ───────────────────────────────────
// POST /api/v1/admin/imgbb/upload
// Body: { image: "<base64 or data URI>", name?: "...", expiration?: 600 }
// Returns: { url, display_url, thumb_url, delete_url, id, width, height, size }
const ALLOWED_IMAGE_MIME = /^image\/(jpeg|jpg|png|gif|webp|bmp|tiff|svg\+xml|x-icon|avif|heic|heif)$/i;
const MAX_IMAGE_BYTES = 32 * 1024 * 1024; // 32 MB — ImgBB free-tier limit

const uploadImage = asyncErrorHandler(async (req, res, next) => {
    const { image, name = '', expiration = null } = req.body || {};

    if (!image || typeof image !== 'string') {
        return next(new ErrorHandler('No image data received. Pick a file or paste an image URL.', 400));
    }

    // If a data URI is supplied, enforce the declared MIME type.
    const mimeMatch = image.match(/^data:([^;]+);base64,/i);
    if (mimeMatch && !ALLOWED_IMAGE_MIME.test(mimeMatch[1])) {
        return next(new ErrorHandler(
            `Unsupported file type "${mimeMatch[1]}". Please upload a JPG, PNG, GIF, WebP or SVG image.`,
            400
        ));
    }

    // Validate size before uploading (base64 expands ~33% vs binary).
    const rawBase64 = image.replace(/^data:image\/[a-z0-9.+-]+;base64,/i, '').replace(/\s+/g, '');
    if (!rawBase64) {
        return next(new ErrorHandler('The image data is empty or corrupted.', 400));
    }
    const approxBytes = Buffer.byteLength(rawBase64, 'base64');
    if (approxBytes > MAX_IMAGE_BYTES) {
        return next(new ErrorHandler(
            `Image is too large (${(approxBytes / (1024 * 1024)).toFixed(1)} MB). Maximum size is 32 MB.`,
            400
        ));
    }

    try {
        const data = await uploadToImgBB(image, name, expiration);
        res.status(200).json({
            success: true,
            id: data.id,
            url: data.url,
            display_url: data.display_url,
            thumb_url: data.thumb?.url || '',
            delete_url: data.delete_url || '',
            width: data.width,
            height: data.height,
            size: data.size,
        });
    } catch (err) {
        // Surface the friendly message (already key-safe) to the admin panel.
        return next(new ErrorHandler(err.message, 502));
    }
});

module.exports = {
    getWebsiteConfig,
    updateWebsiteConfig,
    resetWebsiteConfig,
    getConfigChangeLog,
    getPublicConfig,
    exportConfig,
    importConfig,
    testImgbbKey,
    uploadImage,
    testDiscordWebhook,
};


