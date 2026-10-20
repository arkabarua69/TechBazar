/* eslint-disable no-console */
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', 'config', 'config.env') });
const mongoose = require('mongoose');
const Product = require('../models/productModel');

(async () => {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });
    const added = await Product.find({ _id: { $in: [
        '6ad7a4680ff3d7ad5a9a6dbc', '6ad7a4680ff3d7ad5a9a6dfd', '6ad7a4680ff3d7ad5a9a6e39', '6ad7a4680ff3d7ad5a9a6e6b',
    ] } }).lean();
    added.forEach((p) => {
        console.log(`\n${p.name}`);
        console.log(`  price=${p.price}  cutted=${p.cuttedPrice}  stock=${p.stock}  cat=${p.category}  brand=${p.brand?.name}`);
        console.log(`  image=${p.images?.[0]?.url}`);
        console.log(`  colors=${JSON.stringify(p.colors)}  highlights=${p.highlights?.length}  specs=${p.specifications?.length}  box=${p.inTheBox?.length}`);
    });
    await mongoose.disconnect();
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
