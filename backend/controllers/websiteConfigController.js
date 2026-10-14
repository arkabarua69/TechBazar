const WebsiteConfig = require('../models/websiteConfigModel');
const ErrorHandler = require('../utils/errorHandler');
const asyncErrorHandler = require('../middlewares/asyncErrorHandler');
const { uploadToImgBB } = require('../utils/imgbb');

// Get current website configuration (admin only)
const getWebsiteConfig = asyncErrorHandler(async (req, res, next) => {
    const config = await WebsiteConfig.getCurrentConfig();
    
    // Return config with masked sensitive fields for security
    const configObj = config.toObject();
    
    // Mask encrypted fields (show only if they exist, but hide actual values)
    const maskSensitiveFields = (section) => {
        const masked = { ...section };
        const encryptedFields = ['smtpPassword', 'sendgridApiKey', 'stripeSecretKey', 
                               'stripeWebhookSecret', 'paytmMerchantKey', 'cloudinaryApiKey',
                               'cloudinaryApiSecret', 'otherApiKey1', 'otherApiKey2'];
        
        encryptedFields.forEach(field => {
            if (masked[field]) {
                masked[field] = '••••••••••••••••••••';
            }
        });
        return masked;
    };
    
    // Apply masking to relevant sections
    if (configObj.email) configObj.email = maskSensitiveFields(configObj.email);
    if (configObj.payment) configObj.payment = maskSensitiveFields(configObj.payment);
    if (configObj.cloud) configObj.cloud = maskSensitiveFields(configObj.cloud);
    if (configObj.apiKeys) configObj.apiKeys = maskSensitiveFields(configObj.apiKeys);

    // Mask ImgBB API key — never expose to frontend
    if (configObj.imgbb && configObj.imgbb.apiKey) {
        configObj.imgbb = {
            ...configObj.imgbb,
            apiKey: '••••••••••••••••••••',
        };
    }
    
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
        'social', 'shipping', 'security', 'cache', 'apiKeys', 'features', 'imgbb'
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
    const configObj = config.toObject();
    
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
        
        res.status(200).json({
            success: true,
            message: 'Configuration imported successfully',
            config: updatedConfig
        });
        
    } catch (error) {
        return next(new ErrorHandler('Invalid JSON file: ' + error.message, 400));
    }
});

module.exports = {
    getWebsiteConfig,
    updateWebsiteConfig,
    resetWebsiteConfig,
    getConfigChangeLog,
    getPublicConfig,
    exportConfig,
    importConfig
};

// ─── ImgBB — Test API key ─────────────────────────────────────────────────────
// POST /api/v1/admin/imgbb/test
// Body: { apiKey: "..." } — if omitted, uses the stored/env key
const testImgbbKey = asyncErrorHandler(async (req, res, next) => {
    const { apiKey } = req.body;

    // 1×1 transparent GIF — minimal payload to validate the key without wasting quota
    const TINY_GIF_BASE64 =
        'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

    try {
        const data = await uploadToImgBB(TINY_GIF_BASE64, 'kiro-test', 60, apiKey || null);
        res.status(200).json({
            success: true,
            message: 'ImgBB API key is valid',
            sampleUrl: data.url,
        });
    } catch (err) {
        return next(new ErrorHandler(`ImgBB key test failed: ${err.message}`, 400));
    }
});

// ─── ImgBB — Generic image upload endpoint ───────────────────────────────────
// POST /api/v1/admin/imgbb/upload
// Body: { image: "<base64 or data URI>", name?: "...", expiration?: 600 }
// Returns: { url, display_url, thumb_url, delete_url, id, width, height, size }
const uploadImage = asyncErrorHandler(async (req, res, next) => {
    const { image, name = '', expiration = null } = req.body;

    if (!image) {
        return next(new ErrorHandler('image field is required', 400));
    }

    // Validate size before uploading (base64 expands ~33% vs binary)
    const approxBytes = Buffer.byteLength(image.replace(/^data:[^;]+;base64,/, ''), 'base64');
    const MAX_BYTES = 32 * 1024 * 1024; // 32 MB ImgBB limit
    if (approxBytes > MAX_BYTES) {
        return next(new ErrorHandler('Image exceeds 32 MB limit', 400));
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
        return next(new ErrorHandler(err.message, 500));
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
};
