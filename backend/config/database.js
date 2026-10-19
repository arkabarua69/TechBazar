const mongoose = require('mongoose');

const MONGO_OPTIONS = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 10000,
};

const maskUri = (uri) =>
    String(uri || '').replace(/:[^:@]+@/, ':****@').slice(0, 90);

const isMongoUri = (uri) =>
    typeof uri === 'string' && /^mongodb(\+srv)?:\/\//.test(uri.trim());

/**
 * Read the database URI an admin saved from the Database panel.
 * It is stored (encrypted) in WebsiteConfig.database.mongoUri.
 * Returns a usable connection string or null.
 */
const getSavedUri = async () => {
    try {
        const WebsiteConfig = require('../models/websiteConfigModel');
        const cfg = await WebsiteConfig.findOne({});
        const raw = cfg && cfg.database && cfg.database.mongoUri;
        if (!raw) return null;
        const uri = WebsiteConfig.decrypt(raw);
        return isMongoUri(uri) ? uri.trim() : null;
    } catch (err) {
        console.error(`Could not read the saved database URI: ${err.message}`);
        return null;
    }
};

const connectDatabase = async () => {
    // Read MONGO_URI at call-time so local-db.js can override process.env first
    const envUri = process.env.MONGO_URI;
    console.log(`Connecting to database: ${maskUri(envUri)}`);

    try {
        await mongoose.connect(envUri, MONGO_OPTIONS);
        console.log(`Mongoose Connected \u2713 (${mongoose.connection.host}/${mongoose.connection.name})`);
    } catch (err) {
        console.error(`Mongoose connection FAILED: ${err.message}`);
        process.exit(1);
    }

    // An admin may have saved a different URI from the Database panel. Prefer
    // it, but fall back to the env URI if it cannot be reached.
    const savedUri = await getSavedUri();
    if (savedUri && savedUri !== envUri) {
        console.log(`Applying admin-saved database URI: ${maskUri(savedUri)}`);
        try {
            await mongoose.disconnect();
            await mongoose.connect(savedUri, MONGO_OPTIONS);
            process.env.MONGO_URI = savedUri;
            console.log(`Mongoose reconnected with saved URI \u2713 (${mongoose.connection.host}/${mongoose.connection.name})`);
        } catch (err) {
            console.error(`Saved database URI failed (${err.message}); reverting to the environment URI.`);
            try {
                await mongoose.connect(envUri, MONGO_OPTIONS);
                console.log(`Mongoose Connected \u2713 (${mongoose.connection.host}/${mongoose.connection.name})`);
            } catch (err2) {
                console.error(`Mongoose connection FAILED: ${err2.message}`);
                process.exit(1);
            }
        }
    }

    // Mirror the admin SEO/OG settings into SiteConfig on boot. The storefront
    // reads metadata from SiteConfig, and an OG image uploaded before this
    // feature existed lives only in WebsiteConfig — copy it across once here.
    try {
        const WebsiteConfig = require('../models/websiteConfigModel');
        const SiteConfig = require('../models/siteConfigModel');
        const wc = await WebsiteConfig.getCurrentConfig();
        const sc = await SiteConfig.findOne().sort('-updatedAt');
        if (wc && sc) {
            const seo = wc.seo || {};
            const general = wc.general || {};
            const copy = {
                'seo.metaOgImage': seo.metaOgImage,
                'seo.metaOgType': seo.metaOgType,
                'seo.metaKeywords': seo.metaKeywords,
                'seo.metaRobots': seo.metaRobots,
                'seo.siteUrl': general.siteUrl,
            };
            let changed = false;
            Object.entries(copy).forEach(([path, value]) => {
                if (value !== undefined && value !== null && sc.get(path) !== value) {
                    sc.set(path, value);
                    changed = true;
                }
            });
            // One-time brand fix: the shipped default title template still says
            // "My Store" even after the store was renamed. Adopt the brand name
            // so browser titles + social previews stop showing the old name.
            const brandName = sc.get('branding.name');
            if (sc.get('seo.titleTemplate') === '%s | My Store' && brandName && brandName !== 'My Store') {
                sc.set('seo.titleTemplate', `%s | ${brandName}`);
                changed = true;
            }
            if (changed) await sc.save();
        }
        console.log('Storefront SEO/OG settings mirrored from WebsiteConfig \u2713');
    } catch (err) {
        console.error(`Storefront SEO sync skipped: ${err.message}`);
    }
};

module.exports = connectDatabase;
