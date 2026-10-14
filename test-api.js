const http = require('http');

const tests = [
    { name: 'ratings>=0 (was returning 1, should be 14)', url: 'http://localhost:4000/api/v1/products?ratings%5Bgte%5D=0' },
    { name: 'ratings>=4 (should be 0 - no products have rating 4+)', url: 'http://localhost:4000/api/v1/products?ratings%5Bgte%5D=4' },
    { name: 'frontend exact query (all params)', url: 'http://localhost:4000/api/v1/products?keyword=&price%5Bgte%5D=0&price%5Blte%5D=200000&ratings%5Bgte%5D=0&page=1' },
    { name: 'price range only', url: 'http://localhost:4000/api/v1/products?price%5Bgte%5D=0&price%5Blte%5D=200000&ratings%5Bgte%5D=0' },
    { name: 'category=Electronics', url: 'http://localhost:4000/api/v1/products?category=Electronics' },
    { name: 'no filters', url: 'http://localhost:4000/api/v1/products?keyword=&page=1' },
];

(async () => {
    for (const t of tests) {
        try {
            const res = await new Promise((resolve, reject) => {
                http.get(t.url, (r) => {
                    let data = '';
                    r.on('data', chunk => data += chunk);
                    r.on('end', () => resolve({ status: r.statusCode, body: data }));
                }).on('error', reject);
            });
            const json = JSON.parse(res.body);
            const productCount = json.products ? json.products.length : 0;
            console.log(`${t.name}:`);
            console.log(`  Status: ${res.status}, productsCount: ${json.productsCount}, filteredProductsCount: ${json.filteredProductsCount}, returned: ${productCount}`);
        } catch (e) {
            console.log(`${t.name}: ERROR - ${e.message}`);
        }
    }
})();
