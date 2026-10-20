/* eslint-disable no-console */
/**
 * One-off helper: list every product name currently in the database.
 * Usage:  node backend/scripts/list-products.js
 */
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', 'config', 'config.env') });

const mongoose = require('mongoose');
const Product = require('../models/productModel');

(async () => {
    const uri = process.env.MONGO_URI;
    if (!uri) {
        console.error('MONGO_URI missing');
        process.exit(1);
    }
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
    const products = await Product.find({}).select('name price stock category images.url').lean();
    console.log(`TOTAL=${products.length}`);
    products
        .sort((a, b) => String(a.name).localeCompare(String(b.name)))
        .forEach((p, i) => {
            console.log(`${String(i + 1).padStart(3, ' ')}|${p._id}|${p.name}`);
        });
    await mongoose.disconnect();
})().catch((err) => {
    console.error('FAILED:', err.message);
    process.exit(1);
});
