require('dotenv').config({ path: 'backend/config/config.env' });

const SearchFeatures = require('./backend/utils/searchFeatures');
const Product = require('./backend/models/productModel');
const mongoose = require('mongoose');

(async () => {
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');

    // Test what Express qs parser produces
    console.log('\n--- Express qs parser behavior ---');
    const parsedQs = require('qs').parse('ratings[gte]=0');
    console.log('qs.parse("ratings[gte]=0"):', JSON.stringify(parsedQs));
    const parsedQs3 = require('qs').parse('keyword=&price[gte]=0&price[lte]=200000&ratings[gte]=0&page=1');
    console.log('qs.parse(all params):', JSON.stringify(parsedQs3));

    // Test 1: ratings[gte]=0 - with qs nested object
    console.log('\n--- Test: qs nested { ratings: { gte: "0" } } ---');
    const sf1 = new SearchFeatures(Product.find(), parsedQs).search().filter();
    console.log('Query filter:', JSON.stringify(sf1.query.getFilter()));
    const r1 = await sf1.query;
    console.log('Result count:', r1.length);

    // Test 2: ratings[gte]=4
    console.log('\n--- Test: qs nested { ratings: { gte: "4" } } ---');
    const parsedQs2 = require('qs').parse('ratings[gte]=4');
    const sf2 = new SearchFeatures(Product.find(), parsedQs2).search().filter();
    console.log('Query filter:', JSON.stringify(sf2.query.getFilter()));
    const r2 = await sf2.query;
    console.log('Result count:', r2.length);

    // Test 3: all params
    console.log('\n--- Test: all params ---');
    const sf3 = new SearchFeatures(Product.find(), parsedQs3).search().filter();
    console.log('Query filter:', JSON.stringify(sf3.query.getFilter()));
    const r3 = await sf3.query;
    console.log('Result count:', r3.length);

    // Test 4: raw querystring (flat keys with brackets)
    console.log('\n--- Test: raw querystring { "ratings[gte]": "0" } ---');
    const rawQs = { 'ratings[gte]': '0' };
    const sf4 = new SearchFeatures(Product.find(), rawQs).search().filter();
    console.log('Query filter:', JSON.stringify(sf4.query.getFilter()));
    const r4 = await sf4.query;
    console.log('Result count:', r4.length);

    mongoose.disconnect();
})();
