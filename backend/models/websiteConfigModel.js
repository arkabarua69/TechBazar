const mongoose = require('mongoose');
const crypto = require('crypto');

// ─── Encryption utility for sensitive values ─────────────────────────────────
// Values are encrypted with AES-256-CBC. The key is derived (SHA-256) from
// CONFIG_ENCRYPTION_KEY. Set that variable explicitly in production and keep it
// stable — otherwise previously stored ciphertext can no longer be decrypted.
const algorithm = 'aes-256-cbc';
const IV_LENGTH = 16;

// Placeholder the admin UI sends instead of a real secret it never receives.
const MASK = '••••••••••••••••••••';
const isMaskValue = (value) =>
    typeof value === 'string' &&
    (value === MASK || (value.length >= 4 && /^[•*]+$/.test(value)));

// Fields stored with the encrypt/decrypt set-get pair. For these an empty
// string from the admin UI means "keep the existing value", because the real
// value is never sent back to the browser.
const ENCRYPTED_PATHS = new Set([
    'email.smtpPassword',
    'email.sendgridApiKey',
    'payment.stripeSecretKey',
    'payment.stripeWebhookSecret',
    'cloud.cloudinaryApiKey',
    'cloud.cloudinaryApiSecret',
    'imgbb.apiKey',
    'apiKeys.otherApiKey1',
    'apiKeys.otherApiKey2',
    // Social login (OAuth) provider secrets
    'socialLogin.googleClientSecret',
    'socialLogin.facebookAppSecret',
    'socialLogin.discordClientSecret',
    // Discord notification webhooks (anyone with one can post to that channel)
    'discord.webhookUrl',
    'discord.webhooks.main',
    'discord.webhooks.orders',
    'discord.webhooks.logs',
    'discord.webhooks.products',
    'discord.webhooks.reviews',
    // Not encrypted at rest, but treated as a secret: it must never be sent
    // back to the browser nor overwritten by an unrelated config save.
    'database.mongoUri',
]);

// Paths whose value must never be written to the change log in plaintext.
const isSensitivePath = (path) =>
    ENCRYPTED_PATHS.has(path) || /secret|password|apikey|api_key|token/i.test(path);

const resolveEncryptionKey = () =>
    process.env.CONFIG_ENCRYPTION_KEY ||
    process.env.JWT_SECRET ||
    'default-encryption-key-32-bytes-long-here';

if (!process.env.CONFIG_ENCRYPTION_KEY) {
    console.warn(
        '[websiteConfig] CONFIG_ENCRYPTION_KEY is not set — falling back to ' +
        (process.env.JWT_SECRET ? 'JWT_SECRET' : 'an insecure built-in default') +
        '. Set CONFIG_ENCRYPTION_KEY to a stable 32+ character secret in production.'
    );
}

const encryptionKey = () =>
    crypto.createHash('sha256').update(resolveEncryptionKey()).digest('base64').slice(0, 32);

// Ciphertext format produced by encrypt(): "<32 hex IV>:<hex payload>"
function isEncrypted(value) {
    return typeof value === 'string' && /^[0-9a-f]{32}:[0-9a-f]+$/i.test(value);
}

function encrypt(text) {
    if (!text) return text;
    if (isEncrypted(text)) return text; // never double-encrypt
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(encryptionKey()), iv);
    let encrypted = cipher.update(String(text));
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

function decrypt(text) {
    if (!text) return text;
    // Plaintext legacy values (and the mask) pass through unchanged.
    if (!isEncrypted(text)) return text;
    try {
        const [ivHex, ...rest] = text.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const encryptedText = Buffer.from(rest.join(':'), 'hex');
        const decipher = crypto.createDecipheriv(algorithm, Buffer.from(encryptionKey()), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (err) {
        // Never return ciphertext: callers would forward it to third-party APIs
        // as an invalid credential. Return '' so they fall back to env instead.
        console.error('[websiteConfig] Failed to decrypt a stored secret:', err.message);
        return '';
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

    // Social login (OAuth) — Google / Facebook / Discord.
    // Client IDs are public (sent to the browser); the secrets are encrypted
    // at rest and never leave the server.
    socialLogin: {
        googleEnabled: false,
        googleClientId: '',
        googleClientSecret: '', // Will be encrypted
        facebookEnabled: false,
        facebookAppId: '',
        facebookAppSecret: '', // Will be encrypted
        discordEnabled: false,
        discordClientId: '',
        discordClientSecret: '', // Will be encrypted
        // Optional override for the public site URL used to build OAuth
        // redirect URIs. Leave empty to auto-detect from the request.
        callbackBaseUrl: '',
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

    // Discord notifications — every important store event (orders, logins,
    // products, reviews, errors) is posted to a Discord channel as a rich
    // embed. Each channel role may have its own webhook; a role without one
    // falls back to `main`. The URLs are secrets (anyone who has one can post
    // to that channel), so they are encrypted at rest.
    discord: {
        enabled: true,
        webhookUrl: '',          // legacy alias of webhooks.main — Will be encrypted
        webhooks: {
            main: '',            // fallback for every channel without its own webhook
            orders: '',          // new orders, cancellations, status changes
            logs: '',            // logins, registrations, admin actions, errors
            products: '',        // product added / updated / removed
            reviews: '',         // new and removed reviews
        },
        notifyOnCreate: true,
        notifyOnUpdate: true,
        notifyOnDelete: true,
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
        bKashNumber: { type: String, default: DEFAULT_CONFIG.payment.bKashNumber },
        nagadNumber: { type: String, default: DEFAULT_CONFIG.payment.nagadNumber },
        defaultPaymentMethod: { 
            type: String, 
            default: DEFAULT_CONFIG.payment.defaultPaymentMethod,
            enum: ['cash_on_delivery', 'stripe', 'bkash', 'nagad']
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

    // Social login (OAuth) — secrets are encrypted at rest
    socialLogin: {
        googleEnabled: { type: Boolean, default: DEFAULT_CONFIG.socialLogin.googleEnabled },
        googleClientId: { type: String, default: DEFAULT_CONFIG.socialLogin.googleClientId },
        googleClientSecret: {
            type: String,
            default: DEFAULT_CONFIG.socialLogin.googleClientSecret,
            set: encrypt,
            get: decrypt,
        },        facebookEnabled: { type: Boolean, default: DEFAULT_CONFIG.socialLogin.facebookEnabled },
        facebookAppId: { type: String, default: DEFAULT_CONFIG.socialLogin.facebookAppId },
        facebookAppSecret: {
            type: String,
            default: DEFAULT_CONFIG.socialLogin.facebookAppSecret,
            set: encrypt,
            get: decrypt,
        },
        discordEnabled: { type: Boolean, default: DEFAULT_CONFIG.socialLogin.discordEnabled },
        discordClientId: { type: String, default: DEFAULT_CONFIG.socialLogin.discordClientId },
        discordClientSecret: {
            type: String,
            default: DEFAULT_CONFIG.socialLogin.discordClientSecret,
            set: encrypt,
            get: decrypt,
        },
        callbackBaseUrl: { type: String, default: DEFAULT_CONFIG.socialLogin.callbackBaseUrl },
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

    // Discord notifications (webhook URLs are encrypted)
    discord: {
        enabled: { type: Boolean, default: DEFAULT_CONFIG.discord.enabled },
        webhookUrl: {
            type: String,
            default: DEFAULT_CONFIG.discord.webhookUrl,
            set: encrypt,
            get: decrypt
        },
        webhooks: {
            main: { type: String, default: DEFAULT_CONFIG.discord.webhooks.main, set: encrypt, get: decrypt },
            orders: { type: String, default: DEFAULT_CONFIG.discord.webhooks.orders, set: encrypt, get: decrypt },
            logs: { type: String, default: DEFAULT_CONFIG.discord.webhooks.logs, set: encrypt, get: decrypt },
            products: { type: String, default: DEFAULT_CONFIG.discord.webhooks.products, set: encrypt, get: decrypt },
            reviews: { type: String, default: DEFAULT_CONFIG.discord.webhooks.reviews, set: encrypt, get: decrypt },
        },
        notifyOnCreate: { type: Boolean, default: DEFAULT_CONFIG.discord.notifyOnCreate },
        notifyOnUpdate: { type: Boolean, default: DEFAULT_CONFIG.discord.notifyOnUpdate },
        notifyOnDelete: { type: Boolean, default: DEFAULT_CONFIG.discord.notifyOnDelete },
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

    // Only allow paths that exist in the schema — prevents junk keys and
    // mass-assignment from an arbitrary payload.
    const allowedPaths = new Set(Object.keys(this.schema.paths));

    const serialize = (v) =>
        v === undefined || v === null
            ? ''
            : (typeof v === 'object' ? JSON.stringify(v) : String(v));

    // Secrets are never recorded in plaintext — only whether they are set.
    const trackChanges = (path, oldVal, newVal) => {
        const sensitive = isSensitivePath(path);
        const oldStr = sensitive ? (oldVal ? MASK : '') : serialize(oldVal);
        const newStr = sensitive ? (newVal ? MASK : '') : serialize(newVal);
        if (oldStr !== newStr) {
            changes.push({
                field: path,
                oldValue: oldStr,
                newValue: newStr,
                changedBy: userId,
            });
        }
    };

    for (const [section, values] of Object.entries(newConfig || {})) {
        if (!currentConfig[section] || !values || typeof values !== 'object' || Array.isArray(values)) {
            continue;
        }

        for (const [field, value] of Object.entries(values)) {
            const path = `${section}.${field}`;

            // Nested group (e.g. discord.webhooks.main): the schema path lives
            // one level deeper, so recurse instead of silently dropping it.
            if (
                value && typeof value === 'object' && !Array.isArray(value) &&
                !allowedPaths.has(path) &&
                allowedPaths.has(`${path}.${Object.keys(value)[0] || ''}`)
            ) {
                for (const [subField, subValue] of Object.entries(value)) {
                    const subPath = `${path}.${subField}`;
                    if (!allowedPaths.has(subPath)) continue;
                    if (isMaskValue(subValue)) continue;
                    // Explicit null clears an encrypted value; '' means "keep".
                    if (subValue === null) {
                        if (currentConfig[section][field][subField]) {
                            const oldSub = currentConfig[section][field][subField];
                            currentConfig[section][field][subField] = '';
                            trackChanges(subPath, oldSub, '');
                        }
                        continue;
                    }
                    if (subValue === '' && ENCRYPTED_PATHS.has(subPath)) continue;

                    const oldSub = currentConfig[section][field]?.[subField];
                    if (serialize(oldSub) === serialize(subValue)) continue;

                    currentConfig[section][field][subField] = subValue;
                    trackChanges(subPath, oldSub, subValue);
                }
                continue;
            }

            if (!allowedPaths.has(path)) continue;

            // The admin UI sends a bullet placeholder for secrets it never
            // receives — never treat that as the real value.
            if (isMaskValue(value)) continue;

            // For encrypted fields an empty string means "leave unchanged".
            if (value === '' && ENCRYPTED_PATHS.has(path)) continue;

            const oldValue = currentConfig[section][field];

            // Nothing to do when the value is unchanged (this also avoids
            // needlessly re-encrypting secrets on every save).
            if (serialize(oldValue) === serialize(value)) continue;

            currentConfig[section][field] = value;
            trackChanges(path, oldValue, value);
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
module.exports.isMaskValue = isMaskValue;
module.exports.isSensitivePath = isSensitivePath;
module.exports.ENCRYPTED_PATHS = ENCRYPTED_PATHS;
module.exports.MASK = MASK;