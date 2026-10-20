/* eslint-disable no-console */
/**
 * Re-categorise every product into the six main storefront categories
 * (Electronics / Mobiles / Laptops / Fashion / Appliances / Home).
 *
 * Usage:
 *   node backend/scripts/recategorise-products.js           # dry run
 *   node backend/scripts/recategorise-products.js --apply   # write to DB
 */
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', 'config', 'config.env') });
const mongoose = require('mongoose');
const Product = require('../models/productModel');

const MAIN = ['Electronics', 'Mobiles', 'Laptops', 'Fashion', 'Appliances', 'Home'];

/**
 * Decide the main category from the product name + current category.
 * Order matters — the first matching rule wins.
 * Keep this in sync with preview-recategorise.js.
 */
const recategorise = (name = '', cat = '') => {
    const n = `${name} ${cat}`.toLowerCase();

    // ── Fashion ──────────────────────────────────────────────────────────
    if (/(sunglass|glasses|hoodie|shirt|kurta|saree|dress|shoe|bag|watch|clock)/.test(n)) {
        return 'Fashion';
    }

    // ── Mobiles ──────────────────────────────────────────────────────────
    if (/(phone cooler|mobile phone|phone holder|phone waterproof|phone box|mitag|tracker)/.test(n)) {
        return 'Mobiles';
    }

    // ── Home & kitchen ───────────────────────────────────────────────────
    if (/(kettle|knife|camping lamp|wall lamp|grape peeler|hand fan|shoe cleaner|screwdriver|massage gun|router cover|lemon slice|light|clamp)/.test(n)) {
        return 'Home';
    }

    // ── Appliances ───────────────────────────────────────────────────────
    if (/(ups|power bank|charge separator|charger|adapter)/.test(n)) {
        return 'Appliances';
    }

    // ── Laptops ──────────────────────────────────────────────────────────
    if (/(laptop|notebook|chromebook)/.test(n)) return 'Laptops';

    // ── Electronics (everything else) ────────────────────────────────────
    return 'Electronics';
};

(async () => {
    const apply = process.argv.includes('--apply');
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });
    const products = await Product.find({}).select('name category').sort('name').lean();

    const changes = [];
    for (const p of products) {
        const next = recategorise(p.name, p.category);
        if (next !== p.category) changes.push({ id: p._id, name: p.name, from: p.category, to: next });
    }

    console.log(`TOTAL: ${products.length}  |  to change: ${changes.length}\n`);
    changes.forEach((c) => console.log(`  ${c.name}\n      ${c.from}  →  ${c.to}`));

    if (!apply) {
        console.log('\nDry run. Re-run with --apply to write.');
        await mongoose.disconnect();
        return;
    }

    let ok = 0;
    for (const c of changes) {
        await Product.updateOne({ _id: c.id }, { $set: { category: c.to } });
        ok += 1;
    }
    console.log(`\nAPPLIED: ${ok} product(s) re-categorised.`);

    const after = await Product.aggregate([{ $group: { _id: '$category', n: { $sum: 1 } } }, { $sort: { _id: 1 } }]);
    console.log('\nFinal distribution:');
    after.forEach((r) => console.log(`  ${r._id}: ${r.n}`));

    await mongoose.disconnect();
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
