// Seeds the database with demo users and products (only if they don't exist yet).
// Usage: npm run seed
require('dotenv').config({ path: 'backend/config/config.env' });
const mongoose = require('mongoose');

const User = require('./backend/models/userModel');
const Product = require('./backend/models/productModel');

const img = (seed) => ({ public_id: `demo_${seed}`, url: `https://picsum.photos/seed/${seed}/400/400` });

const users = [
    {
        name: 'Admin User',
        email: 'admin@example.com',
        gender: 'Male',
        password: 'admin1234',
        role: 'admin',
        avatar: { public_id: 'demo_avatar_admin', url: 'https://picsum.photos/seed/avataradmin/200/200' },
    },
    {
        name: 'Demo User',
        email: 'user@example.com',
        gender: 'Female',
        password: 'user12345',
        role: 'user',
        avatar: { public_id: 'demo_avatar_user', url: 'https://picsum.photos/seed/avataruser/200/200' },
    },
];

const makeProduct = (p) => ({
    ...p,
    description:
        p.description ||
        `${p.name} by ${p.brand.name} — one of the best rated products in ${p.category}. Includes official warranty and free delivery.`,
    highlights: p.highlights || ['Free delivery', '1 year warranty', '100% genuine products'],
    specifications: p.specifications || [
        { title: 'Brand', description: p.brand.name },
        { title: 'Category', description: p.category },
        { title: 'Warranty', description: '1 year manufacturer warranty' },
    ],
    images: [img(p.seed), img(p.seed + 'b'), img(p.seed + 'c')],
    stock: p.stock ?? 10,
    warranty: 1,
    ratings: p.ratings ?? 4,
    numOfReviews: p.numOfReviews ?? 12,
});

const products = [
    { seed: 'phone1', name: 'Pixel Nova 5G (Midnight, 128 GB)', category: 'Mobiles', brand: { name: 'Pixel', logo: img('brandpixel') }, price: 24999, cuttedPrice: 34999 },
    { seed: 'phone2', name: 'Galaxy S21 FE (Graphite, 256 GB)', category: 'Mobiles', brand: { name: 'Samsung', logo: img('brandsamsung') }, price: 34999, cuttedPrice: 49999 },
    { seed: 'phone3', name: 'Redmi Note 13 (Blue, 128 GB)', category: 'Mobiles', brand: { name: 'Redmi', logo: img('brandredmi') }, price: 12999, cuttedPrice: 17999 },
    { seed: 'lap1', name: 'Inspiron 15 Ryzen 5 Laptop (8 GB, 512 GB)', category: 'Electronics', brand: { name: 'Dell', logo: img('branddell') }, price: 42990, cuttedPrice: 55990 },
    { seed: 'lap2', name: 'IdeaPad Slim 3 Intel Core i5 (8 GB, 1 TB)', category: 'Electronics', brand: { name: 'Lenovo', logo: img('brandlenovo') }, price: 46990, cuttedPrice: 62990 },
    { seed: 'hp1', name: 'Bass+ Wireless Headphones (Black)', category: 'Electronics', brand: { name: 'boAt', logo: img('brandboat') }, price: 1499, cuttedPrice: 3990 },
    { seed: 'hp2', name: 'Noise Cancelling Over-Ear Headphones', category: 'Electronics', brand: { name: 'Sony', logo: img('brandsony') }, price: 8990, cuttedPrice: 14990 },
    { seed: 'tv1', name: '4K Ultra HD Smart LED TV (139 cm)', category: 'Electronics', brand: { name: 'Mi', logo: img('brandmi') }, price: 27999, cuttedPrice: 39999 },
    { seed: 'wm1', name: '7 Kg Fully Automatic Front Load Washer', category: 'Appliances', brand: { name: 'LG', logo: img('brandlg') }, price: 28490, cuttedPrice: 36990 },
    { seed: 'ac1', name: '1.5 Ton 5 Star Inverter Split AC', category: 'Appliances', brand: { name: 'Voltas', logo: img('brandvoltas') }, price: 33990, cuttedPrice: 44990 },
    { seed: 'fr1', name: 'Frost Free Double Door Refrigerator (253 L)', category: 'Appliances', brand: { name: 'Samsung', logo: img('brandsamsung2') }, price: 26490, cuttedPrice: 34500 },
    { seed: 'chair1', name: 'Ergonomic Study Chair (Black)', category: 'Furniture', brand: { name: 'Green Soul', logo: img('brandgreensoul') }, price: 6499, cuttedPrice: 10999 },
    { seed: 'sofa1', name: '3 Seater Fabric Sofa (Grey)', category: 'Furniture', brand: { name: 'HomeSpace', logo: img('brandhomespace') }, price: 21999, cuttedPrice: 32999 },
    { seed: 'shirt1', name: 'Men Cotton Casual Shirt (Blue)', category: 'Fashion', brand: { name: 'Roadster', logo: img('brandroadster') }, price: 599, cuttedPrice: 1499 },
    { seed: 'kurti1', name: 'Women Printed Anarkali Kurta Set', category: 'Fashion', brand: { name: 'Anouk', logo: img('brandanouk') }, price: 1099, cuttedPrice: 2799 },
    { seed: 'watch1', name: 'Smart Watch 1.8" AMOLED (Black)', category: 'Electronics', brand: { name: 'Noise', logo: img('brandnoise') }, price: 2499, cuttedPrice: 5999 },
    { seed: 'gr1', name: 'Premium Basmati Rice 5 kg', category: 'Grocery', brand: { name: 'India Gate', logo: img('brandindiagate') }, price: 549, cuttedPrice: 799 },
    { seed: 'beauty1', name: 'Vitamin C Face Serum 30 ml', category: 'Beauty,Toys & more', brand: { name: 'mCaffeine', logo: img('brandmcaffeine') }, price: 399, cuttedPrice: 699 },
];

(async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('MongoDB Connected');

        let adminId;
        for (const u of users) {
            const existing = await User.findOne({ email: u.email });
            if (existing) {
                // backfill avatar for users seeded before it existed
                if (!existing.avatar || !existing.avatar.url) {
                    // updateOne (not save) so the password pre-save hook never re-hashes
                    await User.updateOne({ email: u.email }, { $set: { avatar: u.avatar } });
                    console.log(`Backfilled avatar for: ${u.email}`);
                } else {
                    console.log(`User already exists: ${u.email}`);
                }
                if (u.role === 'admin') adminId = existing._id;
                continue;
            }
            const created = await User.create(u);
            console.log(`Created ${u.role}: ${u.email} (password: ${u.password})`);
            if (u.role === 'admin') adminId = created._id;
        }

        const count = await Product.countDocuments();
        if (count > 0) {
            console.log(`Products already present: ${count}. Skipping seed.`);
        } else {
            const docs = products.map((p) => ({ ...makeProduct(p), user: adminId }));
            await Product.insertMany(docs);
            console.log(`Seeded ${docs.length} products.`);
        }

        await mongoose.disconnect();
        console.log('Done.');
        process.exit(0);
    } catch (err) {
        console.error('Seed failed:', err.message);
        process.exit(1);
    }
})();
