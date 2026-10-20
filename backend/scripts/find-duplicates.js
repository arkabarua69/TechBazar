/* eslint-disable no-console */
/**
 * Find likely duplicates in the product catalogue: products whose
 * normalised names are identical, or where one name contains the other.
 * Usage: node backend/scripts/find-duplicates.js
 */
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', 'config', 'config.env') });
const mongoose = require('mongoose');
const Product = require('../models/productModel');

const norm = (s) =>
    String(s || '')
        .toLowerCase()
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[^a-z0-9\u0980-\u09FF]+/g, ' ')
        .trim();

(async () => {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });
    const products = await Product.find({}).select('name price createdAt').lean();

    const pairs = [];
    for (let i = 0; i < products.length; i++) {
        for (let j = i + 1; j < products.length; j++) {
            const a = norm(products[i].name);
            const b = norm(products[j].name);
            if (!a || !b) continue;
            if (a === b || a.includes(b) || b.includes(a) || overlap(a, b) >= 0.72) {
                pairs.push([products[i], products[j], a === b ? 'exact' : 'similar']);
            }
        }
    }

    function overlap(a, b) {
        const A = new Set(a.split(' '));
        const B = new Set(b.split(' '));
        let inter = 0;
        A.forEach((w) => { if (B.has(w)) inter++; });
        return inter / Math.min(A.size, B.size);
    }

    console.log(`Products: ${products.length}`);
    console.log(`Suspicious pairs: ${pairs.length}\n`);
    pairs.forEach(([a, b, kind]) => {
        console.log(`[${kind}]`);
        console.log(`  A: ${a.name}  (৳${a.price})  ${a._id}`);
        console.log(`  B: ${b.name}  (৳${b.price})  ${b._id}`);
    });

    await mongoose.disconnect();
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
