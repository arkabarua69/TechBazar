/* eslint-disable no-console */
/**
 * Compare the storefront/dashboard product list against the database
 * and print which products are MISSING from the DB.
 *
 * Usage: node backend/scripts/find-missing-products.js
 */
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', 'config', 'config.env') });

const mongoose = require('mongoose');
const Product = require('../models/productModel');

// Product names scraped from the LIVE storefront/dashboard HTML (72 items).
const LIVE = [
    'Black Paisley Hoodie & Dropsoulder Combo',
    'Premium Solid Color Pullover Hoodie for Men Without Print Solid Colour',
    'VEN-DENS VD-PB030 10000mAh Wireless Power Bank with Magsafe',
    'X9 Handhole Game Console black hawk',
    'Hoco GA6 Glacier AI Semiconductor Mobile Cooler',
    'BOYA BY-MW6 Wireless Lavalier Microphone – Dual Transmitter (original verient)',
    'Hoco M105 Sharp, wired gaming earphones with mic Original Base',
    'J36 Ultra Retro Handheld Game Console (100% Original)',
    'P6 Retro Game Console with 620 Classic Games & TV Support',
    '10M ARGB Neon Rope Light – App & Remote Control(original)',
    'K8 Wireless Earbuds',
    'SX21 Wireless Dual Lavalier Microphone',
    'Ven-Dens 50000mAh VD-PB063 22.5W Fast Charging Power Bank with Digital Display & Built-in Cables',
    'Shoe Cleaner Foam White Shoe Cleaning Kit with Brush & Towel',
    'Zepter Kitchen Knife Set 6 Pcs (original)',
    'WiFi Router Cover Box',
    'High Power Super Bright Flashlight 3.7V 30000mAh Sanford',
    '928 Type Heavy Duty Stun Gun with LED Flashlight',
    'M88 LED Video Light',
    'A59 Plus Watch Combo',
    'Ven-Dens VD-PB062 Power Bank 30000mAh',
    'VEN-DENS 20000mAh Power Bank',
    'VEN-DENS 10000mAh Power Bank',
    'OLAX M100 Power Bank WiFi Router',
    '4G Pocket Router OLAX MF982',
    'Unique Design Strong quality Camping lamp light',
    'Solar Interaction Wall Lamp',
    'Portable Electric Kettle',
    '26 Inch Self Defense Stick',
    'Plextone RX3 PLUS Wired Gaming Earphone',
    'Siren Alarm Lock For Security',
    'Baseus PPADM20S 20000mah Adaman Metal Fast Charging Power Bank (100% Original)',
    'Yuoto Explorer 16000 Puffs | 50mg Nic Disposable | Type C Rechargeable',
    '3 in1 Portable Foldable Mobile Phone Holder with Bluetooth Speaker',
    'Kemei Kemei KM-026',
    'Chest Strap Mount',
    'MiLi MiTag Android Device – Compatible with Google’s Find My Device',
    '3D LED Digital Clock',
    '5M Waterproof Outdoor USB 5V ARGB Neon Rope Light',
    'JIO 4G LTE  Mobile WiFi Hotspot Portable Router',
    'JBL Boombox 4 Mini Wireless Speaker',
    'M25 Two-In-One Split Wireless DJ Speaker',
    'Hollyland Lark M2 1:1 mastercopy',
    'R36s All-in-One Handheld Gaming Console',
    'Apple Airpods Black Colour Special Edition MasterCopy',
    'Tissot Premium Watch For Gentlemen',
    'New Aura Arabic Watch Men\u2019s Quartz Watch',
    "New Aura Men's Watch with Arabic Numerals Matte Black",
    'Millionare Sunglass',
    'vintage glasses men & Women',
    'Polygonal Men & Women Sunglasses',
    'Android Smart Projector HY300 4K (ORIGINAL)',
    'Mobile Phone Waterproof Box Bathroom Shower Phone Placement Box',
    'EQ34 Plus Rima ANC+ENC TWS Earbud (App Supported) | Long 7-Hour Playtime & Bluetooth 5.4',
    'Apple Airpods pro 2nd generation MasterCopy',
    'wgp Mini UPS 5/9/12V upgraded Original(10,400mAh)',
    'FRB N27 [ 400 ঘন্টা ] Standby Time Wireless Neckband Bluetooth 5.3 Earphone 5 Voice Changer Mode TF Card Slot - Gaming & Music Headset By By EXOTIX',
    '140W স্মার্ট ফুল চার্জ সেপারেটর',
    'Data Cable Set',
    'TOKQI M01 Handheld 3-Axis Gimbal',
    'Portable Smart Electric Grape Peeler Machine',
    'Ultra S9 Android Smart Watch',
    'Cordless Electric Screwdriver Tool Kit',
    'Memo CX07 Magnetic Phone Cooler Fan',
    'MEMO CX12 Magnetic Phone Cooler Fan',
    'DLAB Mobile Phone Cooler A6',
    'LED Lemon Slice String Light',
    'Mini Body Massage Gun SL-720 (original Version)',
    'F11-2 Dual Wireless Microphone Set',
    '5 in 1 Gaming Combo Pack',
    'Portable RGB Hand Fan',
    'Razer BlackShark V2 Multi-Platform Wired Esports Headset',
];

const norm = (s) =>
    String(s || '')
        .toLowerCase()
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u201c\u201d]/g, '"')
        .replace(/[^a-z0-9\u0980-\u09FF]+/g, ' ')
        .trim();

(async () => {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });
    const products = await Product.find({}).select('name').lean();
    const dbNames = products.map((p) => norm(p.name));

    console.log(`DB products: ${products.length}`);
    console.log(`LIVE (dashboard) products: ${LIVE.length}`);

    const missing = LIVE.filter((n) => {
        const key = norm(n);
        return !dbNames.some((d) => d === key || d.includes(key) || key.includes(d));
    });

    console.log(`\n=== MISSING FROM DB (${missing.length}) ===`);
    missing.forEach((n, i) => console.log(`${i + 1}. ${n}`));

    await mongoose.disconnect();
})().catch((err) => {
    console.error('FAILED:', err.message);
    process.exit(1);
});
