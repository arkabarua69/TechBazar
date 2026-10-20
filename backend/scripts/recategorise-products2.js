/* eslint-disable no-console */
/**
 * Re-categorise every product into the seven user categories
 * (Electronics / Home / Audio / Gaming / Power Bank / Fashion / Watch).
 *
 * Usage:
 *   node backend/scripts/recategorise-products2.js           # dry run
 *   node backend/scripts/recategorise-products2.js --apply   # write to DB
 */
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', 'config', 'config.env') });
const mongoose = require('mongoose');
const Product = require('../models/productModel');

const MAIN = ['Electronics', 'Home', 'Audio', 'Gaming', 'Power Bank', 'Fashion', 'Watch'];

/**
 * Decide the category from the product name + current category.
 * Order matters — the first matching rule wins.
 * Keep in sync with preview-recategorise2.js.
 */
const recategorise = (name = '', cat = '') => {
    const n = `${name} ${cat}`.toLowerCase();

    // ── Watch ────────────────────────────────────────────────────────────
    if (/(watch|clock)/.test(n)) return 'Watch';

    // ── Fashion ──────────────────────────────────────────────────────────
    if (/(sunglass|glasses|hoodie|shirt|kurta|saree|dress)/.test(n)) return 'Fashion';

    // ── Power Bank ───────────────────────────────────────────────────────
    if (/(power bank|powerbank|ups|charge separator)/.test(n)) return 'Power Bank';

    // ── Audio ────────────────────────────────────────────────────────────
    if (/(airpods|earbud|earphone|headset|neckband|speaker|microphone|\bmic\b|lavalier|soundbar|audio|tws|dj\b)/.test(n)) return 'Audio';

    // ── Gaming ───────────────────────────────────────────────────────────
    if (/(game|gaming|console|handheld|\bretro\b)/.test(n)) return 'Gaming';

    // ── Home ─────────────────────────────────────────────────────────────
    if (/(kettle|knife|camping lamp|wall lamp|grape peeler|hand fan|shoe cleaner|screwdriver|massage gun|router cover|lemon slice|light|lamp|clamp)/.test(n)) return 'Home';

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

    for (const c of changes) {
        await Product.updateOne({ _id: c.id }, { $set: { category: c.to } });
    }
    console.log(`\nAPPLIED: ${changes.length} product(s) re-categorised.`);

    const after = await Product.aggregate([{ $group: { _id: '$category', n: { $sum: 1 } } }, { $sort: { _id: 1 } }]);
    console.log('\nFinal distribution:');
    after.forEach((r) => console.log(`  ${r._id}: ${r.n}`));

    await mongoose.disconnect();
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
