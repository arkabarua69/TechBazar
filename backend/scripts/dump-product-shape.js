/* eslint-disable no-console */
/**
 * Dump one full product document + the distinct categories/brands in use,
 * so new products can mirror the existing shape.
 *
 * Usage: node backend/scripts/dump-product-shape.js
 */
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', 'config', 'config.env') });

const mongoose = require('mongoose');
const Product = require('../models/productModel');

(async () => {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });

    const cats = await Product.distinct('category');
    console.log('=== CATEGORIES ===');
    console.log(cats);

    const brands = await Product.distinct('brand.name');
    console.log('=== BRANDS ===');
    console.log(brands);

    const id = process.argv[2] || '6ac93b87b50a9339a8e47768'; // 10M ARGB neon
    const p = await Product.findById(id).lean();
    console.log('=== SAMPLE PRODUCT ===');
    console.log(JSON.stringify(p, null, 2));

    await mongoose.disconnect();
})().catch((e) => {
    console.error('FAILED:', e.message);
    process.exit(1);
});
