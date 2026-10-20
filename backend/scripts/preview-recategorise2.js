/* eslint-disable no-console */
/**
 * Preview: re-categorise every product into the seven user categories
 * (Electronics / Home / Audio / Gaming / Power Bank / Fashion / Watch).
 *
 * Usage: node backend/scripts/preview-recategorise2.js
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
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });
    const products = await Product.find({}).select('name category price').sort('name').lean();

    const rows = products.map((p) => ({ ...p, next: recategorise(p.name, p.category) }));
    const byCat = {};
    rows.forEach((p) => (byCat[p.next] = byCat[p.next] || []).push(p));

    console.log(`TOTAL: ${products.length}\n`);
    MAIN.forEach((c) => {
        const list = byCat[c] || [];
        console.log(`\n=== ${c} (${list.length}) ===`);
        list.forEach((p) => console.log(`  ${p.name}\n      ${p.category}  →  ${p.next}`));
    });

    const other = Object.keys(byCat).filter((c) => !MAIN.includes(c));
    if (other.length) console.log('\n!!! UNMAPPED:', other);

    await mongoose.disconnect();
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
