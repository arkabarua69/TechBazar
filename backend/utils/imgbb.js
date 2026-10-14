/**
 * ImgBB API v1 — image upload utility
 *
 * Accepts a base64 data URI or a plain base64 string and uploads it to ImgBB.
 * Returns the full ImgBB response `data` object so callers can pick the URL
 * variant they need (url, display_url, thumb.url, delete_url, etc.).
 *
 * The API key is read from the database (websiteconfig.imgbb.apiKey) first;
 * if not configured there it falls back to the IMGBB_API_KEY env variable.
 *
 * Usage:
 *   const { uploadToImgBB } = require('../utils/imgbb');
 *   const result = await uploadToImgBB(base64String, 'product-photo');
 *   // result: { id, url, display_url, thumb: { url }, delete_url, ... }
 */

const https = require('https');
const querystring = require('querystring');

/**
 * Resolve the active ImgBB API key.
 * Prefers the DB-stored key (so admins can change it without redeploying).
 * Falls back to the env variable as a safety net.
 */
async function resolveApiKey() {
    // Lazy-require to avoid circular dependency issues at module load time
    try {
        const WebsiteConfig = require('../models/websiteConfigModel');
        const cfg = await WebsiteConfig.getCurrentConfig();
        const dbKey = cfg?.imgbb?.apiKey;
        if (dbKey && dbKey.trim()) return dbKey.trim();
    } catch (_) {
        // DB might not be available during startup — fall through
    }
    const envKey = process.env.IMGBB_API_KEY;
    if (envKey && envKey.trim()) return envKey.trim();
    return null;
}

/**
 * Upload a base64-encoded image to ImgBB.
 *
 * @param {string} imageData  — base64 data URI ("data:image/…;base64,…") or raw base64
 * @param {string} [name]     — optional filename/title stored on ImgBB
 * @param {number} [expiration] — optional TTL in seconds (60 – 15552000)
 * @param {string} [apiKeyOverride] — bypass the auto-resolved key (used for key testing)
 * @returns {Promise<object>} ImgBB `data` object: { id, url, display_url, thumb, delete_url, … }
 */
async function uploadToImgBB(imageData, name = '', expiration = null, apiKeyOverride = null) {
    const apiKey = apiKeyOverride || (await resolveApiKey());

    if (!apiKey) {
        throw new Error(
            'ImgBB API key is not configured. ' +
            'Set IMGBB_API_KEY in config.env or configure it in Admin → Website Config → ImgBB Settings.'
        );
    }

    if (!imageData) {
        throw new Error('No image data provided to uploadToImgBB.');
    }

    // Strip the data URI prefix if present — ImgBB expects raw base64
    const base64 = imageData.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');

    // Build query string (key + optional expiration)
    const qs = { key: apiKey };
    if (expiration && Number.isInteger(Number(expiration))) {
        qs.expiration = Number(expiration);
    }

    // Build URL-encoded POST body
    const postBody = querystring.stringify({
        image: base64,
        ...(name ? { name } : {}),
    });

    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.imgbb.com',
            path: `/1/upload?${querystring.stringify(qs)}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postBody),
            },
        };

        const req = https.request(options, (res) => {
            let raw = '';
            res.on('data', (chunk) => { raw += chunk; });
            res.on('end', () => {
                let parsed;
                try {
                    parsed = JSON.parse(raw);
                } catch (e) {
                    return reject(new Error(`ImgBB returned non-JSON response: ${raw.slice(0, 200)}`));
                }

                if (!parsed.success) {
                    const msg =
                        parsed?.error?.message ||
                        `ImgBB upload failed (HTTP ${res.statusCode})`;
                    return reject(new Error(msg));
                }

                resolve(parsed.data);
            });
        });

        req.on('error', (err) => reject(new Error(`ImgBB network error: ${err.message}`)));
        req.write(postBody);
        req.end();
    });
}

/**
 * Convenience wrapper that returns the shape stored in MongoDB for image fields
 * that previously used Cloudinary's { public_id, url } pattern.
 *
 * Maps:
 *   public_id → imgbb image id  (used for delete lookups; no server-side delete in free tier)
 *   url       → display_url     (best-quality hosted URL)
 *
 * Also stores extra ImgBB metadata under `imgbb` for future use.
 */
async function uploadToImgBBCompat(imageData, name = '', expiration = null, apiKeyOverride = null) {
    const data = await uploadToImgBB(imageData, name, expiration, apiKeyOverride);
    return {
        public_id: data.id,
        url: data.display_url || data.url,
        imgbb: {
            id: data.id,
            url: data.url,
            display_url: data.display_url,
            thumb_url: data.thumb?.url || '',
            delete_url: data.delete_url || '',
            title: data.title || name,
            size: data.size || 0,
            width: data.width || 0,
            height: data.height || 0,
        },
    };
}

module.exports = { uploadToImgBB, uploadToImgBBCompat, resolveApiKey };
