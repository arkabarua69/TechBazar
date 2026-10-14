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

// GET /api/v1/admin/database/collections
// Returns list of all collections with per-collection document count and size
const getCollections = asyncErrorHandler(async (req, res, next) => {
    const db = mongoose.connection.db;
    const cols = await db.listCollections().toArray();

    const results = await Promise.all(
        cols.map(async (col) => {
            try {
                const stats = await db.collection(col.name).stats();
                return {
                    name: col.name,
                    count: stats.count ?? 0,
                    size: stats.size ?? 0,
                    storageSize: stats.storageSize ?? 0,
                    avgObjSize: stats.avgObjSize ?? 0,
                    indexes: stats.nindexes ?? 0,
                };
            } catch (_) {
                return { name: col.name, count: 0, size: 0, storageSize: 0, avgObjSize: 0, indexes: 0 };
            }
        })
    );

    res.status(200).json({ success: true, collections: results });
});

// GET /api/v1/admin/database/collections/:name
// Returns paginated documents + field list for a collection
const getCollectionDocs = asyncErrorHandler(async (req, res, next) => {
    const { name } = req.params;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    const db = mongoose.connection.db;

    // Build a simple text filter: match _id (if valid ObjectId) or any string value via $where
    let filter = {};
    if (search) {
        try {
            const { ObjectId } = require('mongodb');
            filter = { _id: new ObjectId(search) };
        } catch (_) {
            // not an ObjectId — do loose field search via $where (dev/admin use only)
            filter = { $where: `JSON.stringify(this).toLowerCase().includes(${JSON.stringify(search.toLowerCase())})` };
        }
    }

    const [docs, total] = await Promise.all([
        db.collection(name).find(filter).skip(skip).limit(limit).toArray(),
        db.collection(name).countDocuments(filter),
    ]);

    // Gather field names from first few docs
    const fields = new Set();
    docs.slice(0, 5).forEach(doc => Object.keys(doc).forEach(k => fields.add(k)));

    res.status(200).json({
        success: true,
        collection: name,
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        fields: Array.from(fields),
        docs: docs.map(d => ({ ...d, _id: d._id.toString() })),
    });
});

// PUT /api/v1/admin/database/collections/:name/:id
// Update a document in a collection by its _id (admin only)
const updateCollectionDoc = asyncErrorHandler(async (req, res, next) => {
    const { name, id } = req.params;
    const updates = req.body;

    if (!updates || typeof updates !== 'object') {
        return next(new ErrorHandler('Update body must be a JSON object', 400));
    }

    // Strip _id from updates (cannot overwrite _id)
    delete updates._id;

    const db = mongoose.connection.db;
    const { ObjectId } = require('mongodb');

    let docId;
    try { docId = new ObjectId(id); } catch (_) {
        return next(new ErrorHandler('Invalid document _id', 400));
    }

    const result = await db.collection(name).findOneAndUpdate(
        { _id: docId },
        { $set: updates },
        { returnDocument: 'after' }
    );

    if (!result) {
        return next(new ErrorHandler('Document not found', 404));
    }

    res.status(200).json({
        success: true,
        message: 'Document updated',
        doc: { ...result, _id: result._id.toString() },
    });
});

// DELETE /api/v1/admin/database/collections/:name/:id
// Delete a single document from a collection
const deleteCollectionDoc = asyncErrorHandler(async (req, res, next) => {
    const { name, id } = req.params;
    const db = mongoose.connection.db;
    const { ObjectId } = require('mongodb');

    let docId;
    try { docId = new ObjectId(id); } catch (_) {
        return next(new ErrorHandler('Invalid document _id', 400));
    }

    const result = await db.collection(name).deleteOne({ _id: docId });
    if (result.deletedCount === 0) {
        return next(new ErrorHandler('Document not found', 404));
    }

    res.status(200).json({ success: true, message: 'Document deleted' });
});

// POST /api/v1/admin/database/collections
// Create a new empty collection
const createCollection = asyncErrorHandler(async (req, res, next) => {
    const { name } = req.body;
    if (!name || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
        return next(new ErrorHandler('Invalid collection name (letters, digits, underscores only, must not start with a digit)', 400));
    }

    const db = mongoose.connection.db;
    const existing = await db.listCollections({ name }).toArray();
    if (existing.length > 0) {
        return next(new ErrorHandler(`Collection "${name}" already exists`, 409));
    }

    await db.createCollection(name);

    res.status(201).json({
        success: true,
        message: `Collection "${name}" created successfully`,
        name,
    });
});

module.exports = {
    getDatabaseStatus, testConnection, saveMongoUri, runSeed, dropCollections,
    getCollections, getCollectionDocs, updateCollectionDoc, deleteCollectionDoc, createCollection,
};
