/* eslint-disable no-console */
/**
 * Preview: how every product would be re-categorised into the six main
 * storefront categories (Electronics / Mobiles / Laptops / Fashion /
 * Appliances / Home).
 *
 * Usage: node backend/scripts/preview-recategorise.js
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
 */
const recategorise = (name = '', cat = '') => {
    const n = `${name} ${cat}`.toLowerCase();

    // ── Fashion ──────────────────────────────────────────────────────────
    if (/(sunglass|glasses|hoodie|shirt|kurta|saree|dress|shoe|bag|watch|clock)/.test(n)) {
        // watches/clocks live under Fashion? No — they are accessories.
        if (/(watch|clock)/.test(n)) return 'Fashion';
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
