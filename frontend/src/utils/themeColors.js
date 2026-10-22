// ── Colour helpers ────────────────────────────────────────────────────────────
// Shared by the admin ThemeEditor (live preview) and the storefront theme
// loader. They mirror backend/utils/theme.js so the same accent always yields
// the same hover shade and light tint in preview and after saving.

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export const isHexColor = (v) => typeof v === 'string' && HEX_RE.test(v.trim());

// "#abc" → "#aabbcc" ; "#AABBCC" → "#aabbcc"
export const expandHex = (hex) => {
    const h = String(hex).trim().replace('#', '');
    const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
    return `#${full.toLowerCase()}`;
};

// Translucent wash of a colour — used for the --color-accent-light token.
export const tintColor = (hex, alpha = 0.1) => {
    if (!isHexColor(hex)) return `rgba(232, 75, 15, ${alpha})`;
    const h = expandHex(hex).slice(1);
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Darker shade of a colour — used for the accent hover token.
export const darkenColor = (hex, amount = 0.14) => {
    if (!isHexColor(hex)) return hex;
    const h = expandHex(hex).slice(1);
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    const mix = (c) => Math.max(0, Math.min(255, Math.round(c * (1 - amount))));
    return `#${[mix(r), mix(g), mix(b)].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
};
