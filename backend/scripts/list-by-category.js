/* eslint-disable no-console */
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', 'config', 'config.env') });
const mongoose = require('mongoose');
const Product = require('../models/productModel');

(async () => {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });
    const products = await Product.find({}).select('name category price').sort('category name').lean();

    const byCat = {};
    products.forEach((p) => {
        const c = p.category || '(none)';
        (byCat[c] = byCat[c] || []).push(p);
    });

    console.log(`TOTAL: ${products.length}\n`);
    Object.keys(byCat).sort().forEach((c) => {
        console.log(`\n=== ${c} (${byCat[c].length}) ===`);
        byCat[c].forEach((p) => console.log(`  - ${p.name}  [৳${p.price}]`));
    });

    await mongoose.disconnect();
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
