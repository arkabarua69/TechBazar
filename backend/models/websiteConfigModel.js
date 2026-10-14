const mongoose = require('mongoose');
const crypto = require('crypto');

// Encryption utility for sensitive values
const algorithm = 'aes-256-cbc';
const ENCRYPTION_KEY = process.env.CONFIG_ENCRYPTION_KEY || process.env.JWT_SECRET || 'default-encryption-key-32-bytes-long-here';
const IV_LENGTH = 16;

function encrypt(text) {
    if (!text) return text;
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest('base64').slice(0, 32);
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

function decrypt(text) {
    if (!text || !text.includes(':')) return text;
    try {
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest('base64').slice(0, 32);
        const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (err) {
        console.error('Decryption error:', err.message);
        return text;
    }
}

// Default configuration values
const DEFAULT_CONFIG = {
    // General settings
    general: {
        siteName: 'TechBazar',
        tagline: '',
        siteTitle: 'TechBazar - Online Electronics Store',
        siteDescription: 'Best electronics and gadgets at affordable prices',
        siteUrl: 'http://localhost:3000',
        contactEmail: 'support@techbazar.com',
        contactPhone: '+8801700000000',
        timezone: 'Asia/Dhaka',
        language: 'en',
        currency: 'BDT',
        currencySymbol: '৳',
        maintenanceMode: false,
        maintenanceMessage: 'We are performing maintenance. Please check back soon.',
    },

    // Branding
    branding: {
        logoUrl: '',
        faviconUrl: '',
        primaryColor: '#E84B0F',
        secondaryColor: '#2D1B0E',
        accentColor: '#FAE5D3',
        darkMode: false,
    },

    // SEO
    seo: {
        metaKeywords: 'electronics, gadgets, smartphones, laptops, tech',
        metaRobots: 'index, follow',
        googleAnalyticsId: '',
        googleTagManagerId: '',
        metaOgImage: '',
        metaOgType: 'website',
    },

    // Email/SMTP
    email: {
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        smtpSecure: true,
        smtpUsername: '',
        smtpPassword: '', // Will be encrypted
        smtpFromName: 'TechBazar',
        smtpFromEmail: 'noreply@techbazar.com',
        sendgridApiKey: '', // Will be encrypted
    },

    // Payment gateways
    payment: {
        stripePublicKey: '',
        stripeSecretKey: '', // Will be encrypted
        stripeWebhookSecret: '', // Will be encrypted
        paytmMerchantId: '',
        paytmMerchantKey: '', // Will be encrypted
        bKashNumber: '01700000000',
        nagadNumber: '01700000000',
        defaultPaymentMethod: 'cash_on_delivery',
    },

    // Cloud services
    cloud: {
        cloudinaryCloudName: '',
        cloudinaryApiKey: '', // Will be encrypted
        cloudinaryApiSecret: '', // Will be encrypted
        cloudinaryFolder: 'techbazar',
    },

    // Social media
    social: {
        facebookUrl: 'https://facebook.com',
        twitterUrl: 'https://twitter.com',
        instagramUrl: 'https://instagram.com',
        youtubeUrl: 'https://youtube.com',
        linkedinUrl: '',
        whatsappNumber: '8801700000000',
    },

    // Shipping/Delivery
    shipping: {
        insideDhaka: 70,
        outsideDhaka: 130,
        freeShippingThreshold: 5000,
        estimatedDeliveryDays: '3-5',
        returnPolicyDays: 7,
    },

    // Security
    security: {
        maxLoginAttempts: 5,
        loginLockoutMinutes: 30,
        sessionTimeoutMinutes: 30,
        requireEmailVerification: false,
        requirePhoneVerification: false,
        enableTwoFactorAuth: false,
    },

    // Cache & Performance
    cache: {
        cacheEnabled: true,
        cacheDuration: 3600, // 1 hour in seconds
        redisEnabled: false,
        redisUrl: '',
    },

    // ImgBB image hosting
    imgbb: {
        apiKey: '', // Will be encrypted
        enabled: true,
    },

    // API Keys (encrypted)
    apiKeys: {
        otherApiKey1: '', // Will be encrypted
        otherApiKey2: '', // Will be encrypted
    },

    // Advanced features
    features: {
        enableGuestCheckout: true,
        enableWishlist: true,
        enableReviews: true,
        enableChat: true,
        enableNewsletter: true,
        enableSitemap: true,
        enablePWA: false,
    },
    // Database configuration
    database: {
        mongoUri: '', // stored encrypted
    },
};

// Schema for website configuration
const websiteConfigSchema = new mongoose.Schema({
    // General settings
    general: {
        siteName: { type: String, default: DEFAULT_CONFIG.general.siteName },
        tagline: { type: String, default: DEFAULT_CONFIG.general.tagline },
        siteTitle: { type: String, default: DEFAULT_CONFIG.general.siteTitle },
        siteDescription: { type: String, default: DEFAULT_CONFIG.general.siteDescription },
        siteUrl: { type: String, default: DEFAULT_CONFIG.general.siteUrl },
        contactEmail: { type: String, default: DEFAULT_CONFIG.general.contactEmail },
        contactPhone: { type: String, default: DEFAULT_CONFIG.general.contactPhone },
        timezone: { type: String, default: DEFAULT_CONFIG.general.timezone },
        language: { type: String, default: DEFAULT_CONFIG.general.language, enum: ['en', 'bn'] },
        currency: { type: String, default: DEFAULT_CONFIG.general.currency },
        currencySymbol: { type: String, default: DEFAULT_CONFIG.general.currencySymbol },
        maintenanceMode: { type: Boolean, default: DEFAULT_CONFIG.general.maintenanceMode },
        maintenanceMessage: { type: String, default: DEFAULT_CONFIG.general.maintenanceMessage },
    },

    // Branding
    branding: {
        logoUrl: { type: String, default: DEFAULT_CONFIG.branding.logoUrl },
        faviconUrl: { type: String, default: DEFAULT_CONFIG.branding.faviconUrl },
        primaryColor: { type: String, default: DEFAULT_CONFIG.branding.primaryColor },
        secondaryColor: { type: String, default: DEFAULT_CONFIG.branding.secondaryColor },
        accentColor: { type: String, default: DEFAULT_CONFIG.branding.accentColor },
        darkMode: { type: Boolean, default: DEFAULT_CONFIG.branding.darkMode },
    },

    // SEO
    seo: {
        metaKeywords: { type: String, default: DEFAULT_CONFIG.seo.metaKeywords },
        metaRobots: { type: String, default: DEFAULT_CONFIG.seo.metaRobots },
        googleAnalyticsId: { type: String, default: DEFAULT_CONFIG.seo.googleAnalyticsId },
        googleTagManagerId: { type: String, default: DEFAULT_CONFIG.seo.googleTagManagerId },
        metaOgImage: { type: String, default: DEFAULT_CONFIG.seo.metaOgImage },
        metaOgType: { type: String, default: DEFAULT_CONFIG.seo.metaOgType },
    },

    // Email/SMTP (encrypted fields)
    email: {
        smtpHost: { type: String, default: DEFAULT_CONFIG.email.smtpHost },
        smtpPort: { type: Number, default: DEFAULT_CONFIG.email.smtpPort, min: 1, max: 65535 },
        smtpSecure: { type: Boolean, default: DEFAULT_CONFIG.email.smtpSecure },
        smtpUsername: { type: String, default: DEFAULT_CONFIG.email.smtpUsername },
        smtpPassword: { 
            type: String, 
            default: DEFAULT_CONFIG.email.smtpPassword,
            set: encrypt,
            get: decrypt
        },
        smtpFromName: { type: String, default: DEFAULT_CONFIG.email.smtpFromName },
        smtpFromEmail: { type: String, default: DEFAULT_CONFIG.email.smtpFromEmail },
        sendgridApiKey: { 
            type: String, 
            default: DEFAULT_CONFIG.email.sendgridApiKey,
            set: encrypt,
            get: decrypt
        },
    },

    // Payment gateways (encrypted fields)
    payment: {
        stripePublicKey: { type: String, default: DEFAULT_CONFIG.payment.stripePublicKey },
        stripeSecretKey: { 
            type: String, 
            default: DEFAULT_CONFIG.payment.stripeSecretKey,
            set: encrypt,
            get: decrypt
        },
        stripeWebhookSecret: { 
            type: String, 
            default: DEFAULT_CONFIG.payment.stripeWebhookSecret,
            set: encrypt,
            get: decrypt
        },
        paytmMerchantId: { type: String, default: DEFAULT_CONFIG.payment.paytmMerchantId },
        paytmMerchantKey: { 
            type: String, 
            default: DEFAULT_CONFIG.payment.paytmMerchantKey,
            set: encrypt,
            get: decrypt
        },
        bKashNumber: { type: String, default: DEFAULT_CONFIG.payment.bKashNumber },
        nagadNumber: { type: String, default: DEFAULT_CONFIG.payment.nagadNumber },
        defaultPaymentMethod: { 
            type: String, 
            default: DEFAULT_CONFIG.payment.defaultPaymentMethod,
            enum: ['cash_on_delivery', 'stripe', 'paytm', 'bkash', 'nagad']
        },
    },

    // Cloud services (encrypted fields)
    cloud: {
        cloudinaryCloudName: { type: String, default: DEFAULT_CONFIG.cloud.cloudinaryCloudName },
        cloudinaryApiKey: { 
            type: String, 
            default: DEFAULT_CONFIG.cloud.cloudinaryApiKey,
            set: encrypt,
            get: decrypt
        },
        cloudinaryApiSecret: { 
            type: String, 
            default: DEFAULT_CONFIG.cloud.cloudinaryApiSecret,
            set: encrypt,
            get: decrypt
        },
        cloudinaryFolder: { type: String, default: DEFAULT_CONFIG.cloud.cloudinaryFolder },
    },

    // Social media
    social: {
        facebookUrl: { type: String, default: DEFAULT_CONFIG.social.facebookUrl },
        twitterUrl: { type: String, default: DEFAULT_CONFIG.social.twitterUrl },
        instagramUrl: { type: String, default: DEFAULT_CONFIG.social.instagramUrl },
        youtubeUrl: { type: String, default: DEFAULT_CONFIG.social.youtubeUrl },
        linkedinUrl: { type: String, default: DEFAULT_CONFIG.social.linkedinUrl },
        whatsappNumber: { type: String, default: DEFAULT_CONFIG.social.whatsappNumber },
    },

    // Shipping/Delivery
    shipping: {
        insideDhaka: { type: Number, default: DEFAULT_CONFIG.shipping.insideDhaka, min: 0 },
        outsideDhaka: { type: Number, default: DEFAULT_CONFIG.shipping.outsideDhaka, min: 0 },
        freeShippingThreshold: { type: Number, default: DEFAULT_CONFIG.shipping.freeShippingThreshold, min: 0 },
        estimatedDeliveryDays: { type: String, default: DEFAULT_CONFIG.shipping.estimatedDeliveryDays },
        returnPolicyDays: { type: Number, default: DEFAULT_CONFIG.shipping.returnPolicyDays, min: 0, max: 365 },
    },

    // Security
    security: {
        maxLoginAttempts: { type: Number, default: DEFAULT_CONFIG.security.maxLoginAttempts, min: 1, max: 20 },
        loginLockoutMinutes: { type: Number, default: DEFAULT_CONFIG.security.loginLockoutMinutes, min: 1, max: 1440 },
        sessionTimeoutMinutes: { type: Number, default: DEFAULT_CONFIG.security.sessionTimeoutMinutes, min: 5, max: 1440 },
        requireEmailVerification: { type: Boolean, default: DEFAULT_CONFIG.security.requireEmailVerification },
        requirePhoneVerification: { type: Boolean, default: DEFAULT_CONFIG.security.requirePhoneVerification },
        enableTwoFactorAuth: { type: Boolean, default: DEFAULT_CONFIG.security.enableTwoFactorAuth },
    },

    // Cache & Performance
    cache: {
        cacheEnabled: { type: Boolean, default: DEFAULT_CONFIG.cache.cacheEnabled },
        cacheDuration: { type: Number, default: DEFAULT_CONFIG.cache.cacheDuration, min: 60, max: 86400 },
        redisEnabled: { type: Boolean, default: DEFAULT_CONFIG.cache.redisEnabled },
        redisUrl: { type: String, default: DEFAULT_CONFIG.cache.redisUrl },
    },

    // ImgBB image hosting (encrypted API key)
    imgbb: {
        apiKey: {
            type: String,
            default: DEFAULT_CONFIG.imgbb.apiKey,
            set: encrypt,
            get: decrypt,
        },
        enabled: { type: Boolean, default: DEFAULT_CONFIG.imgbb.enabled },
    },

    // API Keys (encrypted fields)
    apiKeys: {
        otherApiKey1: { 
            type: String, 
            default: DEFAULT_CONFIG.apiKeys.otherApiKey1,
            set: encrypt,
            get: decrypt
        },
        otherApiKey2: { 
            type: String, 
            default: DEFAULT_CONFIG.apiKeys.otherApiKey2,
            set: encrypt,
            get: decrypt
        },
    },

    // Advanced features
    features: {
        enableGuestCheckout: { type: Boolean, default: DEFAULT_CONFIG.features.enableGuestCheckout },
        enableWishlist: { type: Boolean, default: DEFAULT_CONFIG.features.enableWishlist },
        enableReviews: { type: Boolean, default: DEFAULT_CONFIG.features.enableReviews },
        enableChat: { type: Boolean, default: DEFAULT_CONFIG.features.enableChat },
        enableNewsletter: { type: Boolean, default: DEFAULT_CONFIG.features.enableNewsletter },
        enableSitemap: { type: Boolean, default: DEFAULT_CONFIG.features.enableSitemap },
        enablePWA: { type: Boolean, default: DEFAULT_CONFIG.features.enablePWA },
    },

    // Database configuration
    database: {
        mongoUri: { type: String, default: '' }, // stored encrypted
    },
    // Metadata
    version: { type: Number, default: 1 },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedAt: { type: Date, default: Date.now },
    changeLog: [{
        field: String,
        oldValue: String,
        newValue: String,
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        changedAt: { type: Date, default: Date.now }
    }]
}, {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true }
});

// Middleware to track changes
websiteConfigSchema.pre('save', function(next) {
    if (this.isNew) {
        this.changeLog.push({
            field: 'initial',
            oldValue: '',
            newValue: 'Initial configuration',
            changedBy: this.updatedBy
        });
    }
    this.updatedAt = Date.now();
    next();
});

// Static method to get current config with decryption
websiteConfigSchema.statics.getCurrentConfig = async function() {
    const config = await this.findOne().sort('-updatedAt');
    if (!config) {
        const defaultConfig = new this();
        await defaultConfig.save();
        return defaultConfig;
    }
    return config;
};

// Static method to update config with change tracking
websiteConfigSchema.statics.updateConfig = async function(newConfig, userId) {
    const currentConfig = await this.getCurrentConfig();
    const changes = [];
    
    // Helper to track changes
    const trackChanges = (section, field, oldVal, newVal) => {
        if (String(oldVal) !== String(newVal)) {
            changes.push({
                field: `${section}.${field}`,
                oldValue: typeof oldVal === 'object' ? JSON.stringify(oldVal) : String(oldVal),
                newValue: typeof newVal === 'object' ? JSON.stringify(newVal) : String(newVal),
                changedBy: userId
            });
        }
    };
    
    // Update each section
    for (const [section, values] of Object.entries(newConfig)) {
        if (currentConfig[section]) {
            for (const [field, value] of Object.entries(values)) {
                const oldValue = currentConfig[section][field];
                trackChanges(section, field, oldValue, value);
                currentConfig[section][field] = value;
            }
        }
    }
    
    currentConfig.updatedBy = userId;
    currentConfig.changeLog.push(...changes);
    
    await currentConfig.save();
    return currentConfig;
};

module.exports = mongoose.model('WebsiteConfig', websiteConfigSchema);
module.exports.DEFAULT_CONFIG = DEFAULT_CONFIG;
module.exports.encrypt = encrypt;
module.exports.decrypt = decrypt;