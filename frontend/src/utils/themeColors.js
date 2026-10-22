// ── Font stacks ──────────────────────────────────────────────────────────────
// The admin stores a bare family name ("Nunito"). These map it to a full CSS
// stack so the browser has a sensible fallback while the webfont downloads.
// Kept here (not in the context) so the ThemeEditor's live preview resolves
// exactly the same value the storefront will.
export const FONT_PRESETS = {
    Manrope: 'Manrope, ui-sans-serif, system-ui, sans-serif',
    Roboto:  'Roboto, ui-sans-serif, system-ui, sans-serif',
    Inter:   'Inter, ui-sans-serif, system-ui, sans-serif',
    Poppins: 'Poppins, ui-sans-serif, system-ui, sans-serif',
    Nunito:  'Nunito, ui-sans-serif, system-ui, sans-serif',
    Lato:    'Lato, ui-sans-serif, system-ui, sans-serif',
};
export const DISPLAY_PRESETS = {
    Sora:         'Sora, Manrope, ui-sans-serif, system-ui, sans-serif',
    Montserrat:   'Montserrat, ui-sans-serif, system-ui, sans-serif',
    Raleway:      'Raleway, ui-sans-serif, system-ui, sans-serif',
    'Playfair Display': '"Playfair Display", Georgia, serif',
    Merriweather: 'Merriweather, Georgia, serif',
};

// Resolve a stored font token to its CSS stack (falls back to the raw value).
export const resolveFont = (key, value) => {
    if (key === 'fontBody')    return FONT_PRESETS[value] || value;
    if (key === 'fontDisplay') return DISPLAY_PRESETS[value] || value;
    return value;
};

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
    if (!isHexColor(hex)) return `rgba(1, 188, 23, ${alpha})`;
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

// Lighter shade of a colour — the counterpart to darkenColor.
export const lightenColor = (hex, amount = 0.14) => {
    if (!isHexColor(hex)) return hex;
    const h = expandHex(hex).slice(1);
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    const mix = (c) => Math.round(c + (255 - c) * amount);
    return `#${[mix(r), mix(g), mix(b)].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
};

// Mix two colours (0 = a, 1 = b).
const mixColor = (a, b, t) => {
    if (!isHexColor(a) || !isHexColor(b)) return a;
    const ha = expandHex(a).slice(1);
    const hb = expandHex(b).slice(1);
    const ch = (i) => Math.round(parseInt(ha.slice(i, i + 2), 16) * (1 - t) + parseInt(hb.slice(i, i + 2), 16) * t);
    return `#${[0, 2, 4].map((i) => ch(i).toString(16).padStart(2, '0')).join('')}`;
};

// ── Dark palette derivation ──────────────────────────────────────────────────
// Dark Mode is an independent switch: it must work even when the saved theme is
// a light one. Instead of hard-coding a fixed (and originally orange-tinted)
// dark palette, derive one from the active theme so a custom accent / border
// hue still reads as the same brand in dark mode.
//
// `colorBg`, `colorSurface`, `colorBorder` etc. are treated as *light* values;
// if the theme already looks dark (luminance below the threshold) we leave its
// tokens alone so a purpose-built preset such as Dark Night is not mangled.
const luminance = (hex) => {
    if (!isHexColor(hex)) return 1;
    const h = expandHex(hex).slice(1);
    const r = parseInt(h.slice(0, 2), 16) / 255;
    const g = parseInt(h.slice(2, 4), 16) / 255;
    const b = parseInt(h.slice(4, 6), 16) / 255;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export const isDarkTheme = (theme = {}) => luminance(theme.colorBg) < 0.35;

export const darkPalette = (theme = {}) => {
    // Already dark (e.g. the Dark Night preset) → trust the authored tokens,
    // only guarantee that the text tokens are light enough to stay readable.
    const accent = isHexColor(theme.colorAccent) ? theme.colorAccent : '#01bc17';
    const surface = theme.colorSurface || '#ffffff';
    const border = theme.colorBorder || '#F2D9C8';

    if (isDarkTheme(theme)) {
        return {
            colorBg: theme.colorBg,
            colorSurface: theme.colorSurface,
            colorBorder: theme.colorBorder,
            colorTextPrimary: luminance(theme.colorTextPrimary || '#000') < 0.5 ? theme.colorTextPrimary : '#f1f5f9',
            colorTextSecondary: theme.colorTextSecondary || '#94a3b8',
            colorTextMuted: theme.colorTextMuted || '#64748b',
            colorHeader: theme.colorHeader,
            colorHeaderText: theme.colorHeaderText,
            colorFooter: theme.colorFooter,
            colorFooterText: theme.colorFooterText,
        };
    }

    // Light theme → build a dark counterpart. Surfaces are tinted toward the
    // accent hue so the brand still shows through, but kept near-black.
    const bg = mixColor('#0b1020', accent, 0.06);
    return {
        colorBg: bg,
        colorSurface: mixColor('#131a2b', accent, 0.08),
        colorBorder: mixColor('#2a3348', accent, 0.12),
        colorTextPrimary: '#f1f5f9',
        colorTextSecondary: '#a8b3c7',
        colorTextMuted: '#7c8799',
        colorHeader: mixColor('#111827', accent, 0.06),
        colorHeaderText: '#f1f5f9',
        colorFooter: mixColor('#080c16', accent, 0.05),
        colorFooterText: '#8a94a6',
    };
};

