/* eslint-disable no-console */
/**
 * List every product with its stock level, grouped by availability.
 *
 * Usage: node backend/scripts/list-stock.js
 */
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', 'config', 'config.env') });
const mongoose = require('mongoose');
const Product = require('../models/productModel');

(async () => {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });
    const products = await Product.find({}).select('name category stock price').sort('stock name').lean();

    const out = products.filter((p) => !p.stock || p.stock <= 0);
    const low = products.filter((p) => p.stock > 0 && p.stock <= 3);
    const ok = products.filter((p) => p.stock > 3);

    console.log(`TOTAL: ${products.length}`);
    console.log(`OUT OF STOCK (stock<=0): ${out.length}`);
    console.log(`LOW (1-3): ${low.length}`);
    console.log(`IN STOCK (>3): ${ok.length}\n`);

    console.log('=== OUT OF STOCK ===');
    out.forEach((p) => console.log(`  [stock=${p.stock}] ${p.name}  (${p.category})`));

    console.log('\n=== LOW STOCK (1-3) ===');
    low.forEach((p) => console.log(`  [stock=${p.stock}] ${p.name}  (${p.category})`));

    await mongoose.disconnect();
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
