// ── Theme application ────────────────────────────────────────────────────────
// One place that turns a `config.theme` object into CSS custom properties on
// <html>. Used by:
//   • index.js  (synchronously, before React renders — kills the first-paint
//                colour flash on reload)
//   • SiteConfigContext (after GET /siteconfig resolves)
//   • Admin ThemeEditor treats its own preview separately but shares the maps.
//
// The theme is also cached in localStorage so a reload can re-apply the last
// known brand colours instantly instead of flashing the built-in defaults
// while the API request is in flight.

import {
    isHexColor, tintColor, darkenColor, darkPalette,
    FONT_PRESETS, DISPLAY_PRESETS,
} from './themeColors';

// Map theme keys → CSS variable names
export const CSS_VAR_MAP = {
    colorAccent:           '--color-accent',
    colorAccentHover:      '--color-accent-hover',
    colorAccentLight:      '--color-accent-light',
    colorSuccess:          '--color-success',
    colorWarning:          '--color-warning',
    colorDanger:           '--color-danger',
    colorBg:               '--color-bg',
    colorSurface:          '--color-surface',
    colorBorder:           '--color-border',
    colorTextPrimary:      '--color-text-primary',
    colorTextSecondary:    '--color-text-secondary',
    colorTextMuted:        '--color-text-muted',
    colorHeader:           '--color-header',
    colorHeaderText:       '--color-header-text',
    colorFooter:           '--color-footer',
    colorFooterText:       '--color-footer-text',
    colorAnnouncement:     '--color-announcement',
    colorAnnouncementText: '--color-announcement-text',
    btnRadius:             '--btn-radius',
    cardRadius:            '--card-radius',
    fontBody:              '--font-body',
    fontDisplay:           '--font-display',
    fontScale:             '--font-scale',
    containerWidth:        '--container-width',
};

const CACHE_KEY = 'site_theme_cache';

export const applyTheme = (theme = {}) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    // Derive the accent hover + tint when the saved theme is missing them
    // (older documents stored a stale orange tint even after the accent
    // changed, which made pale accent surfaces look wrong).
    const effective = { ...theme };
    if (isHexColor(effective.colorAccent)) {
        if (!isHexColor(effective.colorAccentHover)) effective.colorAccentHover = darkenColor(effective.colorAccent);
        if (!effective.colorAccentLight || !String(effective.colorAccentLight).trim()) {
            effective.colorAccentLight = tintColor(effective.colorAccent);
        }
    }

    // Apply CSS custom properties
    Object.entries(CSS_VAR_MAP).forEach(([key, cssVar]) => {
        if (effective[key] === undefined || effective[key] === null || effective[key] === '') return;
        let val = String(effective[key]);
        // Resolve font names to full font stacks
        if (key === 'fontBody')    val = FONT_PRESETS[val] || val;
        if (key === 'fontDisplay') val = DISPLAY_PRESETS[val] || val;
        root.style.setProperty(cssVar, val);
    });

    // Button style drives .btn-accent / .btn-ghost via a data attribute
    root.setAttribute('data-btn-style', effective.btnStyle || 'filled');

    // Accent-tinted shadows — so hover glows match a custom accent instead of
    // staying orange. Derived from the accent colour with a few alphas.
    if (isHexColor(effective.colorAccent)) {
        root.style.setProperty('--shadow-accent-soft', tintColor(effective.colorAccent, 0.12));
        root.style.setProperty('--shadow-accent-mid', tintColor(effective.colorAccent, 0.25));
        root.style.setProperty('--shadow-accent-strong', tintColor(effective.colorAccent, 0.4));
        root.style.setProperty('--accent-06', tintColor(effective.colorAccent, 0.06));
        root.style.setProperty('--accent-03', tintColor(effective.colorAccent, 0.03));
        root.style.setProperty('--accent-15', tintColor(effective.colorAccent, 0.15));
        root.style.setProperty('--accent-20', tintColor(effective.colorAccent, 0.2));
        // Deeper shades used by decorative gradients (account hero, sidebar,
        // policy header). Without these the gradients kept a hard-coded orange
        // tail even when the accent was blue/green.
        root.style.setProperty('--accent-dark', darkenColor(effective.colorAccent, 0.28));
        root.style.setProperty('--accent-darker', darkenColor(effective.colorAccent, 0.44));
    }

    // Dark mode. The palette is written *inline* on <html> (like every other
    // token), so a stylesheet-only `html.dark-mode { … }` block can never win
    // against it. Derive the dark tokens from the active theme and apply them
    // here — that makes the Dark Mode switch work on its own, not just as part
    // of a preset that happens to ship dark colours.
    if (effective.darkMode) {
        const dark = darkPalette(effective);
        Object.entries(dark).forEach(([key, value]) => {
            if (value) root.style.setProperty(CSS_VAR_MAP[key], String(value));
        });
        root.classList.add('dark-mode');
    } else {
        root.classList.remove('dark-mode');
    }
};

// Persist the last applied theme so the next reload can paint it immediately.
export const cacheTheme = (theme) => {
    try {
        if (!theme || typeof theme !== 'object') return;
        window.localStorage.setItem(CACHE_KEY, JSON.stringify(theme));
    } catch (e) { /* private mode / quota — non-fatal */ }
};

export const readCachedTheme = () => {
    try {
        const raw = window.localStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : null;
    } catch (e) {
        return null;
    }
};

// Called from index.js *before* React mounts. Synchronously restores the last
// known theme (if any) so the page never flashes the built-in default accent.
export const applyCachedTheme = () => {
    const cached = readCachedTheme();
    if (cached) applyTheme(cached);
    return cached;
};
