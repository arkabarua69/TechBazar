const Product = require('../models/productModel');
const User = require('../models/userModel');
const { fetchStoreProducts, isConfigured } = require('./businessKoro');

const SOURCE = 'businesskoro';

// Business Koro products have no category/brand, so we infer a usable one
// for the shop's filters and reuse a stable brand for display.
const inferCategory = (name = '') => {
    const n = name.toLowerCase();
    if (/(phone|mobile|smartphone|handset)/.test(n)) return 'Mobiles';
    if (/(laptop|notebook|chromebook)/.test(n)) return 'Laptops';
    if (/(shirt|kurta|saree|dress|fashion|shoe|bag)/.test(n)) return 'Fashion';
    if (/(air conditioner|\bac\b|refrigerator|washing machine|microwave|geyser)/.test(n)) return 'Appliances';
    if (/(chair|sofa|table|bed|furniture|wardrobe)/.test(n)) return 'Home';
    if (/(tv|television|monitor|speaker|headphone|earbuds|watch|camera|tablet|projector)/.test(n)) return 'Electronics';
    return 'Electronics';
};

const toProductDoc = (bk, adminId) => {
    const price = Number(bk.suggestedPrice) || 0;
    const cuttedPrice = Math.round(price * 1.35) || price;
    const images = (Array.isArray(bk.images) ? bk.images : []).slice(0, 5).map((url, i) => ({
        public_id: `bk_${bk.id}_${i}`,
        url,
    }));

    if (images.length === 0) {
        images.push({ public_id: `bk_${bk.id}_0`, url: 'https://picsum.photos/seed/placeholder/400/400' });
    }

    return {
        name: bk.name,
        description: bk.description || `${bk.name} — available with Cash on Delivery and fast delivery across Bangladesh.`,
        highlights: ['Cash on Delivery', 'Genuine product', 'Fast delivery'],
        specifications: [
            { title: 'Source', description: 'Business Koro Storefront' },
            { title: 'Availability', description: bk.inStock ? 'In stock' : 'Out of stock' },
            { title: 'Delivery', description: 'Inside Dhaka ৳70 · Outside Dhaka ৳130' },
        ],
        price,
        cuttedPrice,
        images,
        brand: {
            name: 'Business Koro',
            logo: { public_id: 'bk_brand', url: 'https://picsum.photos/seed/businesskoro/120/120' },
        },
        category: inferCategory(bk.name),
        stock: bk.inStock ? 10 : 0,
        warranty: 1,
        ratings: 4,
        numOfReviews: 0,
        user: adminId,
        // server-only metadata
        bkId: String(bk.id),
        bkVariants: bk.variants || [],
        bkCostPrice: Number(bk.costPrice) || 0,
        source: SOURCE,
    };
};

// Pulls the Business Koro catalogue and REPLACES the local product list with it.
// Skips silently when the API key is missing or upstream returns nothing.
const syncCatalog = async ({ force = false } = {}) => {
    if (!isConfigured()) {
        return { skipped: true, reason: 'BUSINESS_KORO_API_KEY not configured' };
    }

    const admin = await User.findOne({ role: 'admin' }).select('_id');
    if (!admin) return { skipped: true, reason: 'no admin user found to own synced products' };

    const { raw, deliveryCharges } = await fetchStoreProducts({ force });
    if (!raw || raw.length === 0) {
        return { skipped: true, reason: 'upstream returned no products' };
    }

    // remember admin "featured" picks so a resync doesn't lose them
    const featuredKeys = new Set();
    (await Product.find({ featured: true }).select('bkId name').lean())
        .forEach((p) => {
            if (p.bkId) featuredKeys.add(p.bkId);
            featuredKeys.add(`name:${p.name}`);
        });

    const docs = raw.map((bk) => toProductDoc(bk, admin._id));

    // full catalogue replacement (local demo products are removed)
    await Product.deleteMany({});
    await Product.insertMany(docs);

    // re-apply featured flags on the fresh catalogue (matched by BK id / name)
    let restored = 0;
    for (const doc of docs) {
        if (featuredKeys.has(doc.bkId) || featuredKeys.has(`name:${doc.name}`)) {
            await Product.updateOne({ _id: doc._id }, { $set: { featured: true } });
            restored++;
        }
    }

    return {
        skipped: false,
        count: docs.length,
        featuredRestored: restored,
        deliveryCharges,
        syncedAt: new Date(),
    };
};

module.exports = { syncCatalog, inferCategory };
