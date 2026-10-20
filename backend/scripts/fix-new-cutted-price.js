/* eslint-disable no-console */
/**
 * Recompute cuttedPrice for the newly-added products so that it equals the
 * MIDDLE of the suggested retail range (instead of the top end).
 *
 * The values below are the ranges exactly as shown on the storefront HTML.
 *
 * Usage:
 *   node backend/scripts/fix-new-cutted-price.js          # dry run
 *   node backend/scripts/fix-new-cutted-price.js --apply   # update
 */
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', 'config', 'config.env') });

const mongoose = require('mongoose');
const Product = require('../models/productModel');

const APPLY = process.argv.includes('--apply');

// id → [low, high] of the suggested retail range (from the storefront HTML)
const RANGES = {
    '6ad7a4680ff3d7ad5a9a6dbc': [700, 1250],    // Shoe Cleaner Foam
    '6ad7a4680ff3d7ad5a9a6dc1': [850, 1250],    // Zepter Kitchen Knife Set
    '6ad7a4680ff3d7ad5a9a6dc6': [400, 650],     // WiFi Router Cover Box
    '6ad7a4680ff3d7ad5a9a6dcb': [1200, 1450],   // High Power Flashlight Sanford
    '6ad7a4680ff3d7ad5a9a6dd0': [850, 1350],    // 928 Stun Gun
    '6ad7a4680ff3d7ad5a9a6dd5': [650, 800],     // M88 LED Video Light
    '6ad7a4680ff3d7ad5a9a6de9': [900, 1500],    // 3 in1 Phone Holder Speaker
    '6ad7a4680ff3d7ad5a9a6dfd': [2200, 3200],   // JBL Boombox 4 Mini
    '6ad7a4680ff3d7ad5a9a6e02': [1900, 2900],   // M25 Split DJ Speaker
    '6ad7a4680ff3d7ad5a9a6e0c': [1450, 2450],   // New Aura Arabic Watch
    '6ad7a4680ff3d7ad5a9a6e11': [1500, 2500],   // New Aura Matte Black Watch
    '6ad7a4680ff3d7ad5a9a6e16': [700, 1200],    // Millionare Sunglass
    '6ad7a4680ff3d7ad5a9a6e39': [3600, 4900],   // TOKQI M01 Gimbal
    '6ad7a4680ff3d7ad5a9a6e3e': [1600, 2100],   // Grape Peeler Machine
    '6ad7a4680ff3d7ad5a9a6e43': [4300, 6500],   // Ultra S9 Smart Watch
    '6ad7a4680ff3d7ad5a9a6e48': [1350, 2350],   // Cordless Screwdriver Kit
    '6ad7a4680ff3d7ad5a9a6e4d': [1150, 1500],   // Memo CX07 Cooler
    '6ad7a4680ff3d7ad5a9a6e52': [1750, 2650],   // MEMO CX12 Cooler
    '6ad7a4680ff3d7ad5a9a6e57': [1600, 2400],   // DLAB A6 Cooler
    '6ad7a4680ff3d7ad5a9a6e5c': [950, 1450],    // LED Lemon Slice Light
    '6ad7a4680ff3d7ad5a9a6e61': [950, 1550],    // Mini Massage Gun SL-720
    '6ad7a4680ff3d7ad5a9a6e66': [1150, 1550],   // F11-2 Mic Set
    '6ad7a4680ff3d7ad5a9a6e6b': [1950, 2450],   // 5 in 1 Gaming Combo
    '6ad7a4680ff3d7ad5a9a6e70': [670, 850],     // Portable RGB Hand Fan
    // (the 12 duplicate rows were removed, so they are not listed)
};

const mid = ([lo, hi]) => Math.round((lo + hi) / 2);

(async () => {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });

    const ids = Object.keys(RANGES);
    const products = await Product.find({ _id: { $in: ids } }).select('name price cuttedPrice').lean();
    console.log(`Targets:     ${ids.length}`);
    console.log(`Found in DB: ${products.length}\n`);

    const planned = [];
    products.forEach((p) => {
        const range = RANGES[p._id];
        if (!range) return;
        const next = mid(range);
        planned.push({ id: p._id, name: p.name, from: p.cuttedPrice, to: next, range });
    });

    planned.forEach((p, i) =>
        console.log(`${String(i + 1).padStart(2, ' ')}. ${p.name}\n     ${p.from}  →  ${p.to}   (range ${p.range[0]}-${p.range[1]})`)
    );

    const missing = ids.filter((id) => !products.some((p) => p._id === id));
    if (missing.length) console.log(`\nWARNING: not found in DB: ${missing.join(', ')}`);

    if (!APPLY) {
        console.log('\n(dry run — re-run with --apply to update)');
        await mongoose.disconnect();
        return;
    }

    let n = 0;
    for (const p of planned) {
        if (p.from === p.to) continue;
        await Product.updateOne({ _id: p.id }, { $set: { cuttedPrice: p.to } });
        n++;
    }
    console.log(`\nUpdated ${n} products ✓`);
    await mongoose.disconnect();
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
