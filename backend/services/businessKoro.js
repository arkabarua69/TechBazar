const DEFAULT_BASE_URL = 'https://api.businesskoro.com/api/v1/storefront';

// Product list cache (upstream limit: 120 list requests / minute / key)
const PRODUCT_CACHE_TTL = 60 * 1000;
let productCache = { at: 0, raw: null, deliveryCharges: null };

const getBaseUrl = () =>
    (process.env.BUSINESS_KORO_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '');

const buildHeaders = () => {
    const headers = { 'Content-Type': 'application/json' };
    const apiKey = process.env.BUSINESS_KORO_API_KEY;
    if (apiKey) headers['x-api-key'] = apiKey;
    const domain = process.env.BUSINESS_KORO_DOMAIN;
    if (domain) headers['x-domain'] = domain;
    return headers;
};

const hasApiKey = () => Boolean(process.env.BUSINESS_KORO_API_KEY);

// Raw upstream fetch (server only - never call this from the browser)
const fetchStoreProducts = async ({ force = false } = {}) => {
    const fresh = productCache.raw && Date.now() - productCache.at < PRODUCT_CACHE_TTL;
    if (fresh && !force) return productCache;

    const upstream = await fetch(`${getBaseUrl()}/products`, {
        method: 'GET',
        headers: buildHeaders(),
        signal: AbortSignal.timeout(15000),
    });

    if (!upstream.ok) {
        const text = await upstream.text().catch(() => '');
        const err = new Error(`Business Koro products failed (${upstream.status}): ${text.slice(0, 200)}`);
        err.status = upstream.status;
        throw err;
    }

    const body = await upstream.json();
    productCache = {
        at: Date.now(),
        raw: Array.isArray(body.data) ? body.data : [],
        deliveryCharges: body.deliveryCharges || { insideDhaka: 70, outsideDhaka: 130 },
    };
    return productCache;
};

// Sanitized product list for the client.
// SECURITY: costPrice, packagingCost and minimumSellingPrice never leave the server.
const sanitizeProduct = (p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    images: p.images,
    suggestedPrice: p.suggestedPrice,
    inStock: p.inStock,
    variants: p.variants || [],
});

const getStoreProducts = async ({ force = false } = {}) => {
    if (!hasApiKey()) {
        const err = new Error('BUSINESS_KORO_API_KEY is not configured');
        err.status = 503;
        throw err;
    }

    const cache = await fetchStoreProducts({ force });
    return {
        products: cache.raw.map(sanitizeProduct),
        deliveryCharges: cache.deliveryCharges,
    };
};

// Server-side order forwarding to Business Koro
const forwardOrderToStore = async (payload) => {
    if (!hasApiKey()) {
        const err = new Error('BUSINESS_KORO_API_KEY is not configured');
        err.status = 503;
        throw err;
    }

    const upstream = await fetch(`${getBaseUrl()}/orders`, {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(20000),
    });

    const body = await upstream.json().catch(() => null);

    if (!upstream.ok) {
        const err = new Error((body && body.message) || `Business Koro order failed (${upstream.status})`);
        err.status = upstream.status;
        err.upstream = body;
        throw err;
    }

    return body;
};

const getDeliveryCharges = () =>
    productCache.deliveryCharges || { insideDhaka: 70, outsideDhaka: 130 };

const isConfigured = () => hasApiKey();

module.exports = {
    getStoreProducts,
    fetchStoreProducts,
    forwardOrderToStore,
    getDeliveryCharges,
    isConfigured,
};
