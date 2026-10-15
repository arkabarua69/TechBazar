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
};

module.exports = connectDatabase;
