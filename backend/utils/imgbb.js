/**
 * ImgBB API v1 — image upload utility
 *
 * Accepts a base64 data URI or a plain base64 string and uploads it to ImgBB.
 * Returns the full ImgBB response `data` object so callers can pick the URL
 * variant they need (url, display_url, thumb.url, delete_url, etc.).
 *
 * The API key is stored ONLY in the database (websiteconfig.imgbb.apiKey) and
 * is managed from Admin → Config → ImgBB Settings. It is never taken from env.
 *
 * Usage:
 *   const { uploadToImgBB } = require('../utils/imgbb');
 *   const result = await uploadToImgBB(base64String, 'product-photo');
 *   // result: { id, url, display_url, thumb: { url }, delete_url, ... }
 */

const https = require('https');
const querystring = require('querystring');
const crypto = require('crypto');

// Admin UI never sends the real key back; it sends this placeholder instead.
const MASK_VALUES = new Set(['••••••••••••••••••••']);
const looksMasked = (value) =>
    typeof value === 'string' && (MASK_VALUES.has(value) || /^[•*]{4,}$/.test(value));

// A key is usable only when it is a non-empty, non-placeholder string.
const sanitizeKey = (value) => {
    if (!value || typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (!trimmed || looksMasked(trimmed)) return null;
    return trimmed;
};

/**
 * Resolve the active ImgBB API key.
 * The key lives ONLY in the database (websiteconfig.imgbb.apiKey) and is managed
 * from Admin → Config → ImgBB Settings. It is never read from environment
 * variables. The key is never logged.
 */
async function resolveApiKey() {
    // Lazy-require to avoid circular dependency issues at module load time
    try {
        const WebsiteConfig = require('../models/websiteConfigModel');
        const cfg = await WebsiteConfig.getCurrentConfig();
        return sanitizeKey(cfg?.imgbb?.apiKey);
    } catch (_) {
        // DB might not be available during startup
        return null;
    }
}

// Map raw ImgBB errors to clear, actionable messages for the admin.
const friendlyError = (raw, statusCode) => {
    const message = String(raw || '').trim();
    if (/forbidden/i.test(message)) {
        return (
            'ImgBB refused the request ("You have been forbidden to use this website"). ' +
            'This is an ImgBB-side block on the account that owns the key (for example an ' +
            'unconfirmed email or a flagged/banned account) — not a problem with this website. ' +
            'Sign in at imgbb.com, confirm your account, generate a fresh API key, and save it in ' +
            'Admin → Config → ImgBB Settings. If it still fails, create a new ImgBB account.'
        );
    }
    if (/invalid api v1 key/i.test(message) || /invalid.*key/i.test(message)) {
        return (
            'The configured ImgBB API key is invalid or not activated. ' +
            'Open Admin → Config → ImgBB Settings and save a valid key from api.imgbb.com.'
        );
    }
    if (/no image/i.test(message) || /image.*(required|missing)/i.test(message)) {
        return 'ImgBB rejected the upload: no image data was received.';
    }
    if (/rate.?limit|too many/i.test(message)) {
        return 'ImgBB rate limit reached. Please try again in a moment.';
    }
    if (/expiration/i.test(message)) {
        return 'ImgBB rejected the expiration value (must be between 60 and 15552000 seconds).';
    }
    return message || `ImgBB upload failed (HTTP ${statusCode}).`;
};

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
    const apiKey = sanitizeKey(apiKeyOverride) || (await resolveApiKey());

    if (!apiKey) {
        throw new Error(
            'ImgBB API key is not configured. ' +
            'Add one in Admin → Config → ImgBB Settings.'
        );
    }

    if (!imageData || typeof imageData !== 'string') {
        throw new Error('No image data provided to uploadToImgBB.');
    }

    // Strip a data URI prefix if present — ImgBB expects raw base64.
    const base64 = imageData
        .replace(/^data:image\/[a-z0-9.+-]+;base64,/i, '')
        .replace(/\s+/g, '');

    if (!base64) {
        throw new Error('The image data is empty after removing the data URI prefix.');
    }

    // Query string: key + optional expiration (per official ImgBB API v1 docs)
    const qs = { key: apiKey };
    if (expiration && Number.isInteger(Number(expiration))) {
        qs.expiration = Number(expiration);
    }

    // Build a multipart/form-data body — the format ImgBB recommends for file
    // uploads. This avoids any chance of the base64 payload being mangled by
    // URL encoding (base64 contains '+', '/', '=' which are special in URLs).
    const boundary = `----ImgBBFormBoundary${crypto.randomBytes(16).toString('hex')}`;
    const chunks = [];
    const addField = (fieldName, value) => {
        chunks.push(Buffer.from(
            `--${boundary}\r\n` +
            `Content-Disposition: form-data; name="${fieldName}"\r\n\r\n` +
            `${value}\r\n`,
            'utf8'
        ));
    };
    addField('image', base64);
    if (name) addField('name', String(name));
    chunks.push(Buffer.from(`--${boundary}--\r\n`, 'utf8'));
    const postBody = Buffer.concat(chunks);

    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.imgbb.com',
            path: `/1/upload?${querystring.stringify(qs)}`,
            method: 'POST',
            timeout: 60000,
            headers: {
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Content-Length': postBody.length,
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
                    return reject(new Error(`ImgBB returned a non-JSON response (HTTP ${res.statusCode}).`));
                }

                if (!parsed.success) {
                    return reject(new Error(friendlyError(parsed?.error?.message, res.statusCode)));
                }

                resolve(parsed.data);
            });
        });

        req.on('timeout', () => {
            req.destroy(new Error('ImgBB request timed out after 60 seconds.'));
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

module.exports = { uploadToImgBB, uploadToImgBBCompat, resolveApiKey, sanitizeKey, looksMasked };
