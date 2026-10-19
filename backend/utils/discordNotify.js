/**
 * Discord webhook notifications
 *
 * Posts a rich embed to a Discord channel whenever the admin adds, updates or
 * removes a product. The webhook URL lives in the database
 * (websiteconfig.discord.webhookUrl) and is managed from
 * Admin → Config → Discord Notifications. It is encrypted at rest and never
 * leaves the server.
 *
 * Every send is best-effort: a Discord outage (or a misconfigured URL) must
 * never fail the product create/update/delete request. Errors are logged and
 * swallowed; `sendTestNotification()` is the only caller that reports back.
 *
 * Usage:
 *   const { notifyProductEvent } = require('../utils/discordNotify');
 *   await notifyProductEvent('created', product);
 */

const https = require('https');
const { URL } = require('url');

const BRAND_COLOR = 0xe84b0f; // storefront accent (orange)
const EVENT_META = {
    created: { title: '🆕 New product added', color: BRAND_COLOR, verb: 'added' },
    updated: { title: '✏️ Product updated', color: 0x3b82f6, verb: 'updated' },
    deleted: { title: '🗑️ Product removed', color: 0xef4444, verb: 'removed' },
};

// Discord hard limits (values above these are rejected with a 400).
const MAX_EMBEDS = 10;
const MAX_FIELD_VALUE = 1024;
const MAX_DESCRIPTION = 4096;
const MAX_TITLE = 256;
const MAX_CONTENT = 1900;

const str = (v) => (v === undefined || v === null ? '' : String(v).trim());

const truncate = (value, max) => {
    const s = str(value);
    return s.length > max ? `${s.slice(0, Math.max(0, max - 1))}…` : s;
};

/** "৳1,200" with the store's currency symbol. */
const money = (value, symbol = '৳') => {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) return null;
    return `${symbol}${n.toLocaleString('en-US')}`;
};

/** Absolute site origin, used to build product links. */
const resolveSiteUrl = async () => {
    const fallback = str(process.env.SITE_URL) || 'https://www.nrxtopup.shop';
    try {
        // Lazy require to avoid a circular dependency at module load time.
        const WebsiteConfig = require('../models/websiteConfigModel');
        const cfg = await WebsiteConfig.getCurrentConfig();
        const fromConfig = str(cfg?.general?.siteUrl);
        return (fromConfig || fallback).replace(/\/+$/, '');
    } catch (_) {
        return fallback.replace(/\/+$/, '');
    }
};

/** Resolve the active webhook URL. Env var wins only when no DB value is set. */
const resolveWebhook = async () => {
    try {
        const WebsiteConfig = require('../models/websiteConfigModel');
        const cfg = await WebsiteConfig.getCurrentConfig();
        const discord = cfg?.discord || {};
        // `get: decrypt` is applied by Mongo, so this is the real URL.
        const fromDb = str(discord.webhookUrl);
        if (fromDb) {
            return {
                url: fromDb,
                enabled: discord.enabled !== false,
                events: {
                    created: discord.notifyOnCreate !== false,
                    updated: discord.notifyOnUpdate !== false,
                    deleted: discord.notifyOnDelete !== false,
                },
            };
        }
    } catch (_) {
        // DB not reachable — fall through to the env var.
    }
    const fromEnv = str(process.env.DISCORD_WEBHOOK_URL);
    if (fromEnv) {
        return { url: fromEnv, enabled: true, events: { created: true, updated: true, deleted: true } };
    }
    return { url: '', enabled: false, events: { created: false, updated: false, deleted: false } };
};

/** Only Discord webhook URLs are accepted (prevents SSRF to arbitrary hosts). */
const isDiscordWebhook = (raw) => {
    try {
        const u = new URL(raw);
        const host = u.hostname.toLowerCase();
        const allowed = host === 'discord.com' || host === 'discordapp.com' ||
            host === 'canary.discord.com' || host === 'ptb.discord.com' ||
            host.endsWith('.discord.com');
        return u.protocol === 'https:' && allowed && u.pathname.startsWith('/api/webhooks/');
    } catch (_) {
        return false;
    }
};

/** Low-level POST of a webhook payload. */
const post = (webhookUrl, payload) => new Promise((resolve, reject) => {
    let target;
    try {
        target = new URL(webhookUrl);
    } catch (_) {
        return reject(new Error('The Discord webhook URL is not a valid URL.'));
    }

    const body = Buffer.from(JSON.stringify(payload), 'utf8');
    const req = https.request({
        hostname: target.hostname,
        path: `${target.pathname}${target.search}`,
        method: 'POST',
        timeout: 15000,
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': body.length,
            'User-Agent': 'GeForceHuB-Notifier/1.0',
        },
    }, (res) => {
        let raw = '';
        res.on('data', (chunk) => { raw += chunk; });
        res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                return resolve({ status: res.statusCode, raw });
            }
            let message = raw;
            try { message = JSON.parse(raw)?.message || raw; } catch (_) { /* keep raw */ }
            reject(new Error(`Discord responded ${res.statusCode}: ${truncate(message, 300)}`));
        });
    });

    req.on('timeout', () => req.destroy(new Error('Discord request timed out after 15 seconds.')));
    req.on('error', (err) => reject(new Error(`Discord network error: ${err.message}`)));
    req.write(body);
    req.end();
});

/** Collect every image URL a product uses (main photos + brand logo). */
const productImageUrls = (product) => {
    const urls = [];
    const seen = new Set();
    const push = (value) => {
        const url = str(value);
        if (url && /^https?:\/\//i.test(url) && !seen.has(url)) {
            seen.add(url);
            urls.push(url);
        }
    };
    (product?.images || []).forEach((img) => push(img?.url));
    push(product?.brand?.logo?.url);
    return urls;
};

/**
 * Build the Discord payload for a product event.
 * Returns null when notifications are disabled or the webhook is unusable.
 */
const buildProductPayload = async (event, product) => {
    const meta = EVENT_META[event];
    if (!meta || !product) return null;

    const siteUrl = await resolveSiteUrl();
    const productId = str(product._id);
    const productUrl = productId ? `${siteUrl}/product/${productId}` : siteUrl;

    const name = str(product.name) || 'Untitled product';
    const currency = '৳';
    const price = money(product.price, currency);
    const cutted = money(product.cuttedPrice, currency);
    const discount = (() => {
        const mrp = Number(product.cuttedPrice);
        const now = Number(product.price);
        if (!Number.isFinite(mrp) || !Number.isFinite(now) || mrp <= now || mrp <= 0) return null;
        return `${Math.round(((mrp - now) / mrp) * 100)}% off`;
    })();

    const images = productImageUrls(product);
    const stock = Number(product.stock);
    const stockText = Number.isFinite(stock)
        ? (stock > 0 ? `${stock}${stock <= 5 ? ' ⚠️ low stock' : ''}` : 'Out of stock ❌')
        : null;

    const fields = [];

    if (price) {
        const priceValue = cutted && discount
            ? `${price} ~${cutted}~ (${discount})`
            : price;
        fields.push({ name: '💰 Price', value: truncate(priceValue, MAX_FIELD_VALUE), inline: true });
    }
    fields.push({ name: '📦 Stock', value: truncate(stockText || '—', MAX_FIELD_VALUE), inline: true });
    fields.push({ name: '🏷️ Category', value: truncate(str(product.category) || '—', MAX_FIELD_VALUE), inline: true });

    if (str(product.brand?.name)) {
        fields.push({ name: '🏭 Brand', value: truncate(product.brand.name, MAX_FIELD_VALUE), inline: true });
    }
    if (Number.isFinite(Number(product.ratings)) && Number(product.ratings) > 0) {
        const reviews = Number(product.numOfReviews) || 0;
        fields.push({
            name: '⭐ Rating',
            value: truncate(`${Number(product.ratings).toFixed(1)} / 5 (${reviews} review${reviews === 1 ? '' : 's'})`, MAX_FIELD_VALUE),
            inline: true,
        });
    }
    if (Array.isArray(product.sizes) && product.sizes.length) {
        fields.push({ name: '📐 Sizes', value: truncate(product.sizes.join(', '), MAX_FIELD_VALUE), inline: true });
    }
    if (Array.isArray(product.colors) && product.colors.length) {
        fields.push({ name: '🎨 Colours', value: truncate(product.colors.join(', '), MAX_FIELD_VALUE), inline: true });
    }
    if (product.warranty) {
        fields.push({ name: '🛡️ Warranty', value: truncate(`${product.warranty} year(s)`, MAX_FIELD_VALUE), inline: true });
    }
    if (Array.isArray(product.highlights) && product.highlights.length) {
        fields.push({
            name: '✨ Highlights',
            value: truncate(product.highlights.filter(Boolean).map((h) => `• ${str(h)}`).join('\n'), MAX_FIELD_VALUE),
        });
    }
    fields.push({ name: '🖼️ Images', value: `${images.length}`, inline: true });

    const description = truncate(
        str(product.description) || '_No description provided._',
        MAX_DESCRIPTION - 400,
    );

    // First image goes into the main embed; the rest become small gallery
    // thumbnails so the channel shows the full product detail.
    const [mainImage, ...extraImages] = images;
    const galleryUrls = extraImages.slice(0, 8);

    const embeds = [{
        title: truncate(`${meta.title}: ${name}`, MAX_TITLE),
        url: productUrl,
        description,
        color: meta.color,
        fields: fields.slice(0, 25),
        footer: { text: `Product ID: ${productId || 'n/a'}` },
        timestamp: new Date().toISOString(),
        ...(mainImage ? { image: { url: mainImage } } : {}),
    }];

    // Each extra image gets a compact thumbnail embed — Discord shows up to
    // four of these per row, which reads like a mini gallery.
    for (const url of galleryUrls) {
        if (embeds.length >= MAX_EMBEDS) break;
        embeds.push({
            url: productUrl,
            color: meta.color,
            image: { url },
        });
    }

    const content = truncate(
        `**${name}** was ${meta.verb} · ${productUrl}`,
        MAX_CONTENT,
    );

    return { content, embeds, allowed_mentions: { parse: [] } };
};

/**
 * Fire a product notification. Never throws — returns a status object so the
 * caller can log/ignore it.
 *
 * @param {'created'|'updated'|'deleted'} event
 * @param {object} product  plain product object (lean or mongoose doc)
 */
async function notifyProductEvent(event, product) {
    try {
        const { url, enabled, events } = await resolveWebhook();
        if (!enabled) return { sent: false, reason: 'disabled' };
        if (events && events[event] === false) return { sent: false, reason: 'event-disabled' };
        if (!url) return { sent: false, reason: 'no-webhook' };
        if (!isDiscordWebhook(url)) return { sent: false, reason: 'invalid-webhook' };

        const payload = await buildProductPayload(event, product);
        if (!payload) return { sent: false, reason: 'no-payload' };

        const res = await post(url, payload);
        return { sent: true, status: res.status };
    } catch (err) {
        console.warn(`[discord] ${event} notification failed: ${err.message}`);
        return { sent: false, reason: 'error', error: err.message };
    }
}

/**
 * Send a test message — used by the admin "Send test message" button so a
 * misconfiguration is reported to the admin instead of silently failing.
 */
async function sendTestNotification() {
    const { url, enabled } = await resolveWebhook();
    if (!url) throw new Error('No Discord webhook URL is configured.');
    if (!enabled) throw new Error('Discord notifications are turned off.');
    if (!isDiscordWebhook(url)) {
        throw new Error('That is not a valid Discord webhook URL (expected https://discord.com/api/webhooks/…).');
    }

    const siteUrl = await resolveSiteUrl();
    let siteName = 'GeForce HuB';
    try {
        const WebsiteConfig = require('../models/websiteConfigModel');
        const cfg = await WebsiteConfig.getCurrentConfig();
        siteName = str(cfg?.general?.siteName) || siteName;
    } catch (_) { /* keep default */ }

    const res = await post(url, {
        username: `${siteName} Notifier`,
        embeds: [{
            title: '✅ Discord notifications are working',
            description: `New products will be posted to this channel automatically.\n[Open the store](${siteUrl})`,
            color: 0x22c55e,
            timestamp: new Date().toISOString(),
        }],
    });
    return { status: res.status };
}

module.exports = {
    notifyProductEvent,
    sendTestNotification,
    isDiscordWebhook,
    buildProductPayload,
    resolveWebhook,
};
