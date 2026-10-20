/**
 * Discord webhook notifications — multi-channel logging
 *
 * The store pushes every important event to Discord as a rich embed. Each
 * *channel role* can have its own webhook so orders, activity logs, products
 * and reviews land in separate Discord channels:
 *
 *   orders    → new order, order cancelled, order status/fulfilment change
 *   logs      → register/login/logout, product add/update/delete, chat, errors
 *   products  → new/updated/removed product (full detail embed + images)
 *   reviews   → new review, review removed
 *
 * Webhooks live in the database (websiteconfig.discord.webhooks.*) and are
 * managed from Admin → Config → Discord Alerts. They are encrypted at rest and
 * never leave the server. When a role has no webhook of its own the fallback
 * ("main") webhook is used, so a single-channel setup still works.
 *
 * Every send is best-effort: a Discord outage (or a misconfigured URL) must
 * never fail the request that triggered it. Errors are swallowed and logged;
 * `sendTestNotification()` is the only caller that reports back.
 *
 * Usage:
 *   const { notifyProductEvent, notifyOrderEvent, logEvent } = require('../utils/discordNotify');
 *   notifyProductEvent('created', product).catch(() => {});
 *   logEvent('login', { title: 'User logged in', user });
 */

const https = require('https');
const { URL } = require('url');

// ─── Channel roles ────────────────────────────────────────────────────────────
// `key` matches websiteconfig.discord.webhooks.<key>.
const CHANNELS = {
    main:     { label: 'Main',     hint: 'fallback for every channel without its own webhook' },
    orders:   { label: 'Orders',   hint: 'new orders, cancellations, status changes' },
    logs:     { label: 'Activity', hint: 'logins, registrations, admin actions, errors' },
    products: { label: 'Products', hint: 'product added / updated / removed' },
    reviews:  { label: 'Reviews',  hint: 'new and removed product reviews' },
};

const BRAND_COLOR = 0xe84b0f; // storefront accent (orange)

// Discord hard limits (values above these are rejected with a 400).
const MAX_EMBEDS = 10;
const MAX_FIELD_VALUE = 1024;
const MAX_FIELDS = 25;
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
    if (!Number.isFinite(n)) return null;
    return `${symbol}${n.toLocaleString('en-US')}`;
};

/** 1234 → "20m ago" style short string; used only for uptime/error meta. */
const shortId = (value) => str(value).slice(-8) || 'n/a';

// ─── Config resolution ────────────────────────────────────────────────────────

const envWebhook = (role) => {
    const key = `DISCORD_WEBHOOK_${String(role).toUpperCase()}`;
    return str(process.env[key]);
};

/**
 * Resolve the webhook URL for a channel role. Precedence:
 *   1. the role's own webhook in the DB
 *   2. DISCORD_WEBHOOK_<ROLE> env var
 *   3. the "main" webhook in the DB
 *   4. DISCORD_WEBHOOK_URL env var
 */
const resolveWebhookFor = async (role = 'main') => {
    let db = null;
    try {
        const WebsiteConfig = require('../models/websiteConfigModel');
        db = (await WebsiteConfig.getCurrentConfig())?.discord || null;
    } catch (_) {
        // DB not reachable — fall through to env vars.
    }

    const hooks = db?.webhooks || {};
    const fromDbRole = role !== 'main' ? str(hooks[role]) : '';
    const fromDbMain = str(hooks.main) || str(db?.webhookUrl); // legacy single field

    const url =
        fromDbRole ||
        (role !== 'main' ? envWebhook(role) : '') ||
        fromDbMain ||
        str(process.env.DISCORD_WEBHOOK_URL);

    const enabled = db ? db.enabled !== false : true;
    const events = {
        created: db?.notifyOnCreate !== false,
        updated: db?.notifyOnUpdate !== false,
        deleted: db?.notifyOnDelete !== false,
    };
    return { url, enabled, events };
};

/** Backwards-compatible alias (older callers used resolveWebhook()). */
const resolveWebhook = () => resolveWebhookFor('main');

/** Only Discord webhook URLs are accepted (prevents SSRF to arbitrary hosts). */
const isDiscordWebhook = (raw) => {
    try {
        const u = new URL(raw);
        const host = u.hostname.toLowerCase();
        const allowed = host === 'discord.com' || host === 'discordapp.com' ||
            host === 'canary.discord.com' || host === 'ptb.discord.com' ||
            host.endsWith('.discord.com') || host.endsWith('.discordapp.com');
        return u.protocol === 'https:' && allowed && u.pathname.startsWith('/api/webhooks/');
    } catch (_) {
        return false;
    }
};

/** Absolute site origin, used to build links. */
const resolveSiteUrl = async () => {
    const fallback = str(process.env.SITE_URL) || 'https://www.nrxtopup.shop';
    try {
        const WebsiteConfig = require('../models/websiteConfigModel');
        const cfg = await WebsiteConfig.getCurrentConfig();
        const fromConfig = str(cfg?.general?.siteUrl);
        return (fromConfig || fallback).replace(/\/+$/, '');
    } catch (_) {
        return fallback.replace(/\/+$/, '');
    }
};

/** Store display name (used as the webhook username). */
const resolveSiteName = async () => {
    try {
        const WebsiteConfig = require('../models/websiteConfigModel');
        const cfg = await WebsiteConfig.getCurrentConfig();
        return str(cfg?.general?.siteName) || 'GeForce HuB';
    } catch (_) {
        return 'GeForce HuB';
    }
};

// ─── Transport ────────────────────────────────────────────────────────────────

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
            // 429 = rate limited; surface Retry-After so callers can log it.
            let message = raw;
            try { message = JSON.parse(raw)?.message || raw; } catch (_) { /* keep raw */ }
            const err = new Error(`Discord responded ${res.statusCode}: ${truncate(message, 300)}`);
            err.status = res.statusCode;
            err.retryAfter = res.headers['retry-after'];
            reject(err);
        });
    });

    req.on('timeout', () => req.destroy(new Error('Discord request timed out after 15 seconds.')));
    req.on('error', (err) => reject(new Error(`Discord network error: ${err.message}`)));
    req.write(body);
    req.end();
});

/**
 * Send a raw payload to a channel role. Never throws.
 * Returns { sent, reason?, status?, error? }.
 */
const sendToChannel = async (role, payload) => {
    try {
        const { url, enabled } = await resolveWebhookFor(role);
        if (!enabled) return { sent: false, reason: 'disabled' };
        if (!url) return { sent: false, reason: 'no-webhook' };
        if (!isDiscordWebhook(url)) return { sent: false, reason: 'invalid-webhook' };

        const res = await post(url, payload);
        return { sent: true, status: res.status };
    } catch (err) {
        console.warn(`[discord:${role}] send failed: ${err.message}`);
        return { sent: false, reason: 'error', error: err.message };
    }
};

/**
 * High-level helper: send one embed (plus optional content) to a channel.
 * Never throws.
 */
const notify = async (role, { title, description, fields = [], color = BRAND_COLOR, url, thumbnail, image, footer, author, content }) => {
    const payload = {
        embeds: [{
            title: title ? truncate(title, MAX_TITLE) : undefined,
            description: description ? truncate(description, MAX_DESCRIPTION) : undefined,
            color,
            fields: fields
                .filter((f) => f && f.name)
                .slice(0, MAX_FIELDS)
                .map((f) => ({
                    name: truncate(f.name, 256),
                    value: truncate(f.value === undefined || f.value === null || f.value === '' ? '—' : f.value, MAX_FIELD_VALUE),
                    inline: !!f.inline,
                })),
            url: url || undefined,
            thumbnail: thumbnail ? { url: thumbnail } : undefined,
            image: image ? { url: image } : undefined,
            footer: footer ? { text: truncate(footer, 2048) } : undefined,
            author: author ? { name: truncate(author.name || '', 256), icon_url: author.iconURL || undefined, url: author.url || undefined } : undefined,
            timestamp: new Date().toISOString(),
        }],
        allowed_mentions: { parse: [] },
    };
    if (content) payload.content = truncate(content, MAX_CONTENT);
    return sendToChannel(role, payload);
};

// ─── Named logging helpers ────────────────────────────────────────────────────

/**
 * Generic activity-log helper (goes to the "logs" channel).
 * @param {string} kind    short machine key, e.g. 'login'
 * @param {object} details { title, description, fields, color, url, ... }
 */
const logEvent = (kind, details = {}) =>
    notify('logs', {
        color: 0x64748b,
        footer: `event: ${kind}`,
        ...details,
    });

/** Login / register / logout / password events. */
const notifyAuthEvent = (kind, user = {}, extra = {}) => {
    const meta = {
        register: { title: '🆕 New user registered', color: 0x22c55e },
        login: { title: '🔐 User logged in', color: 0x3b82f6 },
        logout: { title: '👋 User logged out', color: 0x94a3b8 },
        oauth: { title: '🔐 Social login', color: 0x8b5cf6 },
        password_reset: { title: '🔑 Password reset requested', color: 0xf59e0b },
        password_changed: { title: '🔑 Password changed', color: 0xf59e0b },
    }[kind] || { title: `Auth event: ${kind}`, color: 0x64748b };

    return notify('logs', {
        title: meta.title,
        color: meta.color,
        thumbnail: str(user?.avatar?.url) && /^https?:\/\//i.test(user.avatar.url) ? user.avatar.url : undefined,
        fields: [
            { name: '👤 Name', value: user?.name || '—', inline: true },
            { name: '📧 Email', value: user?.email || '—', inline: true },
            { name: '🆔 User ID', value: str(user?._id) || '—', inline: true },
            ...(extra.fields || []),
        ],
        footer: `event: ${kind}`,
    });
};

/** Order events (goes to the "orders" channel). */
const notifyOrderEvent = (kind, order = {}, extra = {}) => {
    const meta = {
        created: { title: '🛒 New order received', color: 0x22c55e },
        cancelled: { title: '❌ Order cancelled', color: 0xef4444 },
        status: { title: '📦 Order status updated', color: 0x3b82f6 },
        approved: { title: '👍 Order approved', color: 0x22c55e },
        payment_verified: { title: '✅ Payment verified', color: 0x22c55e },
    }[kind] || { title: `Order event: ${kind}`, color: BRAND_COLOR };

    const fields = [];

    const customer = order.customer || order.shippingInfo || {};
    if (customer.name) fields.push({ name: '👤 Customer', value: customer.name, inline: true });
    if (customer.phone || customer.phoneNo) {
        fields.push({ name: '📞 Phone', value: customer.phone || customer.phoneNo, inline: true });
    }
    const address = [customer.address, customer.area, customer.district, customer.division, customer.city, customer.state, customer.pincode]
        .map(str).filter(Boolean).join(', ');
    if (address) fields.push({ name: '📍 Address', value: address });
    if (order.payment?.method || order.paymentInfo?.id) {
        const method = order.payment?.method || 'paid';
        const trx = order.payment?.transactionId || order.paymentInfo?.id;
        fields.push({ name: '💳 Payment', value: trx ? `${method} · ${trx}` : method, inline: true });
    }
    const amount = order.pricing?.total ?? order.totalPrice;
    if (amount !== undefined) fields.push({ name: '💰 Total', value: money(amount) || String(amount), inline: true });
    if (order.pricing?.quantity) fields.push({ name: '🔢 Qty', value: String(order.pricing.quantity), inline: true });
    if (order.product?.name) fields.push({ name: '📦 Product', value: order.product.name });
    if (Array.isArray(order.orderItems) && order.orderItems.length) {
        fields.push({
            name: '📦 Items',
            value: order.orderItems.map((i) => `• ${i.name} × ${i.quantity} — ${money(i.price * i.quantity)}`).join('\n'),
        });
    }
    if (order.delivery?.zone) fields.push({ name: '🚚 Delivery zone', value: order.delivery.zone, inline: true });
    if (order.fulfilment) fields.push({ name: '📊 Fulfilment', value: order.fulfilment, inline: true });
    if (order.status) fields.push({ name: '🗂️ Status', value: order.status, inline: true });
    if (extra.status) fields.push({ name: '🔀 Change', value: extra.status, inline: true });

    return notify('orders', {
        title: meta.title,
        color: meta.color,
        fields: [...fields, ...(extra.fields || [])],
        image: str(order.product?.image) && /^https?:\/\//i.test(order.product.image) ? order.product.image : undefined,
        footer: `order ${str(order.groupId || order._id)}${extra.by ? ` · by ${extra.by}` : ''}`,
    });
};

/** Build the product payload (detail embed + gallery thumbnail embeds). */
const buildProductPayload = async (event, product) => {
    const meta = {
        created: { title: '🆕 New product added', color: BRAND_COLOR, verb: 'added' },
        updated: { title: '✏️ Product updated', color: 0x3b82f6, verb: 'updated' },
        deleted: { title: '🗑️ Product removed', color: 0xef4444, verb: 'removed' },
    }[event];
    if (!meta || !product) return null;

    const siteUrl = await resolveSiteUrl();
    const productId = str(product._id);
    const productUrl = productId ? `${siteUrl}/product/${productId}` : siteUrl;

    const name = str(product.name) || 'Untitled product';
    const price = money(product.price);
    const cutted = money(product.cuttedPrice);
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
        const priceValue = cutted && discount ? `${price} ~${cutted}~ (${discount})` : price;
        fields.push({ name: '💰 Price', value: priceValue, inline: true });
    }
    fields.push({ name: '📦 Stock', value: stockText || '—', inline: true });
    fields.push({ name: '🏷️ Category', value: str(product.category) || '—', inline: true });
    if (str(product.brand?.name)) fields.push({ name: '🏭 Brand', value: product.brand.name, inline: true });
    if (Number(product.ratings) > 0) {
        const reviews = Number(product.numOfReviews) || 0;
        fields.push({ name: '⭐ Rating', value: `${Number(product.ratings).toFixed(1)} / 5 (${reviews} review${reviews === 1 ? '' : 's'})`, inline: true });
    }
    if (Array.isArray(product.sizes) && product.sizes.length) fields.push({ name: '📐 Sizes', value: product.sizes.join(', '), inline: true });
    if (Array.isArray(product.colors) && product.colors.length) fields.push({ name: '🎨 Colours', value: product.colors.join(', '), inline: true });
    if (product.warranty) fields.push({ name: '🛡️ Warranty', value: `${product.warranty} year(s)`, inline: true });
    if (Array.isArray(product.highlights) && product.highlights.length) {
        fields.push({ name: '✨ Highlights', value: product.highlights.filter(Boolean).map((h) => `• ${str(h)}`).join('\n') });
    }
    fields.push({ name: '🖼️ Images', value: `${images.length}`, inline: true });

    const [mainImage, ...extraImages] = images;
    const embeds = [{
        title: truncate(`${meta.title}: ${name}`, MAX_TITLE),
        url: productUrl,
        description: truncate(str(product.description) || '_No description provided._', MAX_DESCRIPTION - 400),
        color: meta.color,
        fields: fields.slice(0, MAX_FIELDS),
        footer: { text: `Product ID: ${productId || 'n/a'}` },
        timestamp: new Date().toISOString(),
        ...(mainImage ? { image: { url: mainImage } } : {}),
    }];

    for (const url of extraImages.slice(0, 8)) {
        if (embeds.length >= MAX_EMBEDS) break;
        embeds.push({ url: productUrl, color: meta.color, image: { url } });
    }

    return {
        content: truncate(`**${name}** was ${meta.verb} · ${productUrl}`, MAX_CONTENT),
        embeds,
        allowed_mentions: { parse: [] },
    };
};

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
 * Fire a product notification (goes to the "products" channel).
 * Never throws.
 */
async function notifyProductEvent(event, product) {
    try {
        const { events } = await resolveWebhookFor('products');
        if (events && events[event] === false) return { sent: false, reason: 'event-disabled' };

        const payload = await buildProductPayload(event, product);
        if (!payload) return { sent: false, reason: 'no-payload' };
        return sendToChannel('products', payload);
    } catch (err) {
        console.warn(`[discord] ${event} notification failed: ${err.message}`);
        return { sent: false, reason: 'error', error: err.message };
    }
}

/** Product review events (goes to the "reviews" channel). */
const notifyReviewEvent = (kind, { product, review } = {}) => {
    const meta = {
        created: { title: '⭐ New product review', color: 0xf59e0b },
        updated: { title: '✏️ Product review updated', color: 0x3b82f6 },
        deleted: { title: '🗑️ Product review removed', color: 0xef4444 },
    }[kind] || { title: `Review event: ${kind}`, color: 0xf59e0b };

    const stars = review?.rating ? '★'.repeat(Math.round(review.rating)) + '☆'.repeat(5 - Math.round(review.rating)) : '—';

    return notify('reviews', {
        title: meta.title,
        color: meta.color,
        thumbnail: product?.image && /^https?:\/\//i.test(product.image) ? product.image : undefined,
        fields: [
            { name: '📦 Product', value: product?.name || '—' },
            { name: '⭐ Rating', value: stars, inline: true },
            { name: '👤 Reviewer', value: review?.name || '—', inline: true },
            { name: '💬 Comment', value: review?.comment || '_No comment._' },
        ],
        footer: `event: review ${kind}`,
    });
};

/** 5xx error / unhandled exception (goes to the "logs" channel). */
const notifyErrorEvent = (err, ctx = {}) => notify('logs', {
    title: `🚨 Error ${ctx.statusCode || err?.statusCode || 500}`,
    color: 0xef4444,
    description: `\`\`\`\n${truncate(err?.stack || err?.message || String(err), 3500)}\n\`\`\``,
    fields: [
        { name: '🛠️ Route', value: `${ctx.method || ''} ${ctx.url || ''}`.trim() || '—', inline: true },
        { name: '👤 User', value: ctx.user?.email || 'guest', inline: true },
    ],
    footer: `event: error · ${new Date().toISOString()}`,
});

/**
 * Send a test message — used by the admin "Send test message" button so a
 * misconfiguration is reported to the admin instead of silently failing.
 */
async function sendTestNotification(role = 'main') {
    const { url, enabled } = await resolveWebhookFor(role);
    if (!url) throw new Error(`No Discord webhook URL is configured${role !== 'main' ? ` for "${role}"` : ''}.`);
    if (!enabled) throw new Error('Discord notifications are turned off.');
    if (!isDiscordWebhook(url)) {
        throw new Error('That is not a valid Discord webhook URL (expected https://discord.com/api/webhooks/…).');
    }

    const siteUrl = await resolveSiteUrl();
    const siteName = await resolveSiteName();

    const res = await post(url, {
        username: `${siteName} Notifier`,
        embeds: [{
            title: `✅ ${CHANNELS[role]?.label || 'Discord'} notifications are working`,
            description: `This channel will now receive **${CHANNELS[role]?.label || role}** events.\n[Open the store](${siteUrl})`,
            color: 0x22c55e,
            timestamp: new Date().toISOString(),
        }],
    });
    return { status: res.status };
}

module.exports = {
    // core
    notify,
    sendToChannel,
    resolveWebhookFor,
    resolveWebhook,
    isDiscordWebhook,
    buildProductPayload,
    CHANNELS,
    // event helpers
    logEvent,
    notifyAuthEvent,
    notifyOrderEvent,
    notifyProductEvent,
    notifyReviewEvent,
    notifyErrorEvent,
    sendTestNotification,
};
