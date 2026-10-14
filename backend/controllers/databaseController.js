const mongoose = require('mongoose');
const asyncErrorHandler = require('../middlewares/asyncErrorHandler');
const ErrorHandler = require('../utils/errorHandler');
const WebsiteConfig = require('../models/websiteConfigModel');
const { encrypt, decrypt } = require('../models/websiteConfigModel');

// Helper: mask URI for display (hide password)
const maskUri = (uri) => {
    if (!uri) return '';
    return uri.replace(/:([^:@]+)@/, ':****@');
};

// GET /api/v1/admin/database/status
// Returns current connection status + masked URI + DB stats
const getDatabaseStatus = asyncErrorHandler(async (req, res, next) => {
    const state = mongoose.connection.readyState;
    const stateMap = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };

    let stats = null;
    if (state === 1) {
        try {
            const db = mongoose.connection.db;
            const dbStats = await db.stats();
            stats = {
                host: mongoose.connection.host,
                name: mongoose.connection.name,
                collections: dbStats.collections,
                documents: dbStats.objects,
                dataSize: dbStats.dataSize,
                storageSize: dbStats.storageSize,
            };
        } catch (_) {}
    }

    // Get saved URI from WebsiteConfig (masked)
    let savedUri = '';
    try {
        const config = await WebsiteConfig.getCurrentConfig();
        const raw = config?.database?.mongoUri || '';
        savedUri = raw ? maskUri(decrypt(raw)) : maskUri(process.env.MONGO_URI || '');
    } catch (_) {
        savedUri = maskUri(process.env.MONGO_URI || '');
    }

    res.status(200).json({
        success: true,
        status: stateMap[state] || 'unknown',
        readyState: state,
        currentUri: savedUri,
        stats,
    });
});

// POST /api/v1/admin/database/test
// Body: { uri } — test a MongoDB URI without switching
const testConnection = asyncErrorHandler(async (req, res, next) => {
    const { uri } = req.body;
    if (!uri || !uri.startsWith('mongodb')) {
        return next(new ErrorHandler('Invalid MongoDB URI', 400));
    }

    let testConn;
    try {
        testConn = await mongoose.createConnection(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 8000,
            connectTimeoutMS: 8000,
        }).asPromise();

        const dbStats = await testConn.db.stats();

        res.status(200).json({
            success: true,
            message: 'Connection successful',
            info: {
                host: testConn.host,
                name: testConn.name,
                collections: dbStats.collections,
                documents: dbStats.objects,
            },
        });
    } catch (err) {
        return next(new ErrorHandler(`Connection failed: ${err.message}`, 400));
    } finally {
        if (testConn) {
            try { await testConn.close(); } catch (_) {}
        }
    }
});

// PUT /api/v1/admin/database/uri
// Body: { uri } — save a new MONGO_URI to WebsiteConfig (encrypted)
// NOTE: Does NOT switch the live connection (requires server restart)
const saveMongoUri = asyncErrorHandler(async (req, res, next) => {
    const { uri } = req.body;
    if (!uri || !uri.startsWith('mongodb')) {
        return next(new ErrorHandler('Invalid MongoDB URI', 400));
    }

    // Save encrypted URI in WebsiteConfig
    const config = await WebsiteConfig.getCurrentConfig();
    if (!config.database) config.database = {};
    config.database.mongoUri = encrypt(uri);
    config.updatedBy = req.user._id;
    config.changeLog.push({
        field: 'database.mongoUri',
        oldValue: '[encrypted]',
        newValue: '[encrypted]',
        changedBy: req.user._id,
    });
    await config.save();

    res.status(200).json({
        success: true,
        message: 'MongoDB URI saved. Restart the server to apply the new connection.',
        maskedUri: maskUri(uri),
    });
});

// POST /api/v1/admin/database/seed
// Runs the same seed logic as seed.js (idempotent)
const runSeed = asyncErrorHandler(async (req, res, next) => {
    const User = require('../models/userModel');
    const Product = require('../models/productModel');

    const img = (seed) => ({ public_id: `demo_${seed}`, url: `https://picsum.photos/seed/${seed}/400/400` });

    const users = [
        { name: 'Admin User', email: 'admin@example.com', gender: 'Male', password: 'admin1234', role: 'admin', avatar: { public_id: 'demo_avatar_admin', url: 'https://picsum.photos/seed/avataradmin/200/200' } },
        { name: 'Demo User', email: 'user@example.com', gender: 'Female', password: 'user12345', role: 'user', avatar: { public_id: 'demo_avatar_user', url: 'https://picsum.photos/seed/avataruser/200/200' } },
    ];

    const results = { users: [], products: { skipped: false, seeded: 0 } };

    let adminId;
    for (const u of users) {
        const existing = await User.findOne({ email: u.email });
        if (existing) {
            if (!existing.avatar?.url) {
                await User.updateOne({ email: u.email }, { $set: { avatar: u.avatar } });
                results.users.push(`${u.email}: avatar backfilled`);
            } else {
                results.users.push(`${u.email}: already exists (skipped)`);
            }
            if (u.role === 'admin') adminId = existing._id;
        } else {
            const created = await User.create(u);
            results.users.push(`${u.email}: created`);
            if (u.role === 'admin') adminId = created._id;
        }
    }

    const productCount = await Product.countDocuments();
    if (productCount > 0) {
        results.products.skipped = true;
        results.products.existing = productCount;
    } else {
        const makeProduct = (p) => ({
            ...p,
            description: `${p.name} — quality product with official warranty.`,
            highlights: ['Free delivery', '1 year warranty', '100% genuine'],
            specifications: [{ title: 'Brand', description: p.brand.name }, { title: 'Category', description: p.category }],
            images: [img(p.seed), img(p.seed + 'b'), img(p.seed + 'c')],
            stock: 10, warranty: 1, ratings: 4, numOfReviews: 12,
        });
        const products = [
            { seed: 'phone1', name: 'Pixel Nova 5G (Midnight, 128 GB)', category: 'Mobiles', brand: { name: 'Pixel', logo: img('brandpixel') }, price: 24999, cuttedPrice: 34999 },
            { seed: 'lap1', name: 'Inspiron 15 Ryzen 5 Laptop', category: 'Electronics', brand: { name: 'Dell', logo: img('branddell') }, price: 42990, cuttedPrice: 55990 },
            { seed: 'hp1', name: 'Bass+ Wireless Headphones', category: 'Electronics', brand: { name: 'boAt', logo: img('brandboat') }, price: 1499, cuttedPrice: 3990 },
            { seed: 'tv1', name: '4K Smart LED TV 55"', category: 'Electronics', brand: { name: 'Mi', logo: img('brandmi') }, price: 27999, cuttedPrice: 39999 },
            { seed: 'shirt1', name: 'Men Cotton Casual Shirt', category: 'Fashion', brand: { name: 'Roadster', logo: img('brandroadster') }, price: 599, cuttedPrice: 1499 },
            { seed: 'watch1', name: 'Smart Watch 1.8" AMOLED', category: 'Electronics', brand: { name: 'Noise', logo: img('brandnoise') }, price: 2499, cuttedPrice: 5999 },
        ];
        const docs = products.map((p) => ({ ...makeProduct(p), user: adminId }));
        await Product.insertMany(docs);
        results.products.seeded = docs.length;
    }

    res.status(200).json({ success: true, message: 'Seed complete', results });
});

// POST /api/v1/admin/database/drop-collections
// Drops all documents from all collections (dangerous — confirmation required)
const dropCollections = asyncErrorHandler(async (req, res, next) => {
    const { confirm } = req.body;
    if (confirm !== 'DROP_ALL_DATA') {
        return next(new ErrorHandler('Confirmation text required: DROP_ALL_DATA', 400));
    }

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const dropped = [];
    for (const col of collections) {
        await db.collection(col.name).deleteMany({});
        dropped.push(col.name);
    }

    res.status(200).json({
        success: true,
        message: `Cleared ${dropped.length} collections`,
        collections: dropped,
    });
});

module.exports = { getDatabaseStatus, testConnection, saveMongoUri, runSeed, dropCollections };
