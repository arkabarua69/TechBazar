require('dotenv').config({ path: 'backend/config/config.env' });
const mongoose = require('mongoose');
const Product = require('./backend/models/productModel');

(async () => {
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

    const cats = await Product.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]);
    console.log('Categories:', JSON.stringify(cats, null, 2));

    const ratings = await Product.aggregate([{ $group: { _id: '$ratings', count: { $sum: 1 } } }]);
    console.log('Ratings distribution:', JSON.stringify(ratings, null, 2));

    const sources = await Product.aggregate([{ $group: { _id: '$source', count: { $sum: 1 } } }]);
    console.log('Sources:', JSON.stringify(sources, null, 2));

    mongoose.disconnect();
})();
