/* eslint-disable no-console */
/**
 * Remove the near-duplicate products that were inserted by
 * add-missing-products.js but already existed in the DB under a
 * differently-worded name. The ORIGINAL (pre-existing) rows are kept.
 *
 * Usage:
 *   node backend/scripts/remove-duplicate-products.js          # dry run
 *   node backend/scripts/remove-duplicate-products.js --apply   # delete
 */
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', 'config', 'config.env') });

const mongoose = require('mongoose');
const Product = require('../models/productModel');

const APPLY = process.argv.includes('--apply');

// New rows (inserted by us) that duplicate an older row already in the DB.
const DUPLICATE_IDS = [
    '6ad7a4680ff3d7ad5a9a6e2f', // 140W স্মার্ট ফুল চার্জ সেপারেটর  → 140W Smart Full Charge Separator
    '6ad7a4680ff3d7ad5a9a6dda', // Unique Design Strong quality Camping lamp light → Unique Design Camping Lamp Light
    '6ad7a4680ff3d7ad5a9a6ddf', // Baseus PPADM20S 20000mah Adaman… → Baseus PPADM20S 20000mAh Metal…
    '6ad7a4680ff3d7ad5a9a6de4', // Yuoto Explorer … | 50mg Nic → Yuoto Explorer 16000 Puffs Disposable Vape
    '6ad7a4680ff3d7ad5a9a6dee', // Kemei Kemei KM-026 → Kemei KM-026 Hair Trimmer
    '6ad7a4680ff3d7ad5a9a6df3', // MiLi MiTag Android Device – Compatible… → MiLi MiTag Android Tracker…
    '6ad7a4680ff3d7ad5a9a6df8', // 5M … USB 5V ARGB → 5M … USB ARGB Neon Rope Light
    '6ad7a4680ff3d7ad5a9a6e07', // Apple Airpods Black Colour Special Edition → Apple AirPods Black Special Edition
    '6ad7a4680ff3d7ad5a9a6e1b', // Mobile Phone Waterproof Box … Placement Box → … Shower Holder
    '6ad7a4680ff3d7ad5a9a6e20', // EQ34 Plus Rima (App Supported) → EQ34 Plus Rima … Bluetooth 5.4
    '6ad7a4680ff3d7ad5a9a6e25', // wgp Mini UPS …(10,400mAh) → WGP Mini UPS 5/9/12V 10400mAh Upgraded Original
    '6ad7a4680ff3d7ad5a9a6e2a', // FRB N27 [ 400 ঘন্টা ]… → FRB N27 400H Wireless Neckband…
];

(async () => {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });

    const found = await Product.find({ _id: { $in: DUPLICATE_IDS } }).select('name').lean();
    console.log(`Targets:      ${DUPLICATE_IDS.length}`);
    console.log(`Found in DB:  ${found.length}\n`);
    found.forEach((p, i) => console.log(`${i + 1}. ${p.name}  (${p._id})`));

    if (!APPLY) {
        console.log('\n(dry run — re-run with --apply to delete)');
        await mongoose.disconnect();
        return;
    }

    const res = await Product.deleteMany({ _id: { $in: DUPLICATE_IDS } });
    console.log(`\nDeleted ${res.deletedCount} duplicate rows ✓`);

    const total = await Product.countDocuments({});
    console.log(`DB total is now ${total}`);

    await mongoose.disconnect();
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
