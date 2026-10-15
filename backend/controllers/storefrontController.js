const { getStoreProducts, forwardOrderToStore } = require('../services/businessKoro');

const ensureApiKey = (res) => {
    if (process.env.BUSINESS_KORO_API_KEY) return true;
    res.status(503).json({
        success: false,
        message: 'Business Koro API key is not configured. Set BUSINESS_KORO_API_KEY in backend/config/config.env.',
    });
    return false;
};

const sendUpstreamError = (err, res) => {
    const status = err.status || 502;

    if (status === 429) {
        return res.status(429).json({
            success: false,
            message: 'Business Koro rate limit reached (orders: 20/min, 300/hr; products: 120/min). Please try again shortly.',
        });
    }

    return res.status(status).json({
        success: false,
        message: err.message,
        upstream: err.upstream,
    });
};

// GET /api/v1/storefront/products
// Server-side function getStoreProducts: the response is sanitized, so
// costPrice / packagingCost / minimumSellingPrice never reach the browser.
const getStorefrontProducts = async (req, res) => {
    if (!ensureApiKey(res)) return;

    try {
        const { products, deliveryCharges } = await getStoreProducts();
        return res.status(200).json({ data: products, deliveryCharges });
    } catch (err) {
        console.log(`Business Koro products error: ${err.message}`);
        return sendUpstreamError(err, res);
    }
};

// POST /api/v1/storefront/orders
// Direct forward (kept for API compatibility). The shop's own checkout uses
// POST /api/v1/store/orders which records the order first and waits for approval.
const placeStorefrontOrder = async (req, res) => {
    if (!ensureApiKey(res)) return;

    const payload = req.body || {};
    const required = ['productId', 'customerName', 'customerPhone', 'customerAddress', 'sellingPrice'];
    const missing = required.filter((field) => payload[field] === undefined || payload[field] === '');

    if (missing.length) {
        return res.status(400).json({ success: false, message: `Missing required fields: ${missing.join(', ')}` });
    }

    if (typeof payload.sellingPrice !== 'number') {
        return res.status(400).json({ success: false, message: 'sellingPrice must be a number (e.g. 1500).' });
    }

    try {
        const body = await forwardOrderToStore(payload);
        return res.status(200).json(body);
    } catch (err) {
        console.log(`Business Koro order error: ${err.message}`);
        return sendUpstreamError(err, res);
    }
};

// GET /api/v1/storefront/orders/:orderId
const getStorefrontOrder = async (req, res) => {
    if (!ensureApiKey(res)) return;

    const { orderId } = req.params;
    if (!orderId) return res.status(400).json({ success: false, message: 'orderId is required.' });

    try {
        const baseUrl = (process.env.BUSINESS_KORO_BASE_URL || 'https://api.businesskoro.com/api/v1/storefront').replace(/\/$/, '');
        const headers = { 'Content-Type': 'application/json', 'x-api-key': process.env.BUSINESS_KORO_API_KEY };
        if (process.env.BUSINESS_KORO_DOMAIN) headers['x-domain'] = process.env.BUSINESS_KORO_DOMAIN;

        const upstream = await fetch(`${baseUrl}/orders/${encodeURIComponent(orderId)}`, {
            method: 'GET',
            headers,
            signal: AbortSignal.timeout(15000),
        });

        const body = await upstream.json().catch(() => null);
        if (!upstream.ok) {
            const err = new Error((body && body.message) || `Business Koro status failed (${upstream.status})`);
            err.status = upstream.status;
            return sendUpstreamError(err, res);
        }

        return res.status(200).json(body);
    } catch (err) {
        console.log(`Business Koro order status error: ${err.message}`);
        return res.status(502).json({ success: false, message: `Could not reach Business Koro: ${err.message}` });
    }
};

module.exports = {
    getStorefrontProducts,
    placeStorefrontOrder,
    getStorefrontOrder,
};
