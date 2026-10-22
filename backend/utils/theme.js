// ── Theme helpers ────────────────────────────────────────────────────────────
// The storefront renders every colour from CSS custom properties that are
// written by SiteConfigContext from `siteconfig.theme`. Those tokens are what
// the admin edits on Admin → Config → Branding.
//
// Problem this solves: when the admin changes only the accent colour, the
// "light tint" token (colorAccentLight) and the hover shade used to keep their
// old values, so pale accent surfaces stayed the *previous* colour (e.g. a
// green accent with an orange tint). We now derive them automatically.

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

const isHex = (v) => typeof v === 'string' && HEX_RE.test(v.trim());

// "#abc" → "#aabbcc", "#AABBCC" → "#aabbcc"
const expandHex = (hex) => {
    const h = String(hex).trim().replace('#', '');
    const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
    return `#${full.toLowerCase()}`;
};

// Mix a hex colour toward white (amount 0..1) and return an rgb() string.
const lighten = (hex, amount) => {
    const h = expandHex(hex).slice(1);
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    const mix = (c) => Math.round(c + (255 - c) * amount);
    return `rgba(${mix(r)}, ${mix(g)}, ${mix(b)}, 1)`;
};

// Same mix but returned as rgba with an explicit alpha — this is what the
// "accent light" token expects (a translucent wash used behind icons/badges).
const tint = (hex, alpha = 0.1) => {
    const h = expandHex(hex).slice(1);
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Mix a hex toward black — used to derive the hover shade from the accent.
const darken = (hex, amount = 0.12) => {
    const h = expandHex(hex).slice(1);
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    const mix = (c) => Math.round(c * (1 - amount));
    return `#${[mix(r), mix(g), mix(b)].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
};

module.exports = { isHex, expandHex, lighten, tint, darken };
