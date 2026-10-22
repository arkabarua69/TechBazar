import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { DEFAULT_SITE_CONFIG } from '../utils/siteConfig';
import { isHexColor, tintColor, darkenColor, darkPalette, FONT_PRESETS, DISPLAY_PRESETS } from '../utils/themeColors';

// Single fetch of GET /api/v1/siteconfig shared by every consumer.
// Also applies CSS custom properties from config.theme to :root so every
// component that uses var(--color-accent) etc. updates instantly.
const SiteConfigContext = createContext({
    config: DEFAULT_SITE_CONFIG,
    reloadConfig: () => {},
    ready: true,
});

// Map theme keys → CSS variable names
const CSS_VAR_MAP = {
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

const applyTheme = (theme = {}) => {
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
        if (effective[key] !== undefined && effective[key] !== null && effective[key] !== '') {
            let val = String(effective[key]);
            // Resolve font names to full font stacks
            if (key === 'fontBody')    val = FONT_PRESETS[val] || val;
            if (key === 'fontDisplay') val = DISPLAY_PRESETS[val] || val;
            root.style.setProperty(cssVar, val);
        }
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

// Deep-merge a partial config over the defaults so missing nested keys keep
// their defaults (e.g. a config that only stores payment.bKashNumber still
// keeps default nagadNumber / delivery / branding values).
const deepMerge = (base, override) => {
    if (Array.isArray(base) || Array.isArray(override)) {
        return override !== undefined ? override : base;
    }
    if (base && override && typeof base === 'object' && typeof override === 'object') {
        const out = { ...base };
        Object.keys(override).forEach((k) => {
            out[k] = deepMerge(base[k], override[k]);
        });
        return out;
    }
    return override !== undefined ? override : base;
};

export const SiteConfigProvider = ({ children }) => {
    const [config, setConfig] = useState(DEFAULT_SITE_CONFIG);
    // False until the first GET /siteconfig settles. MetaData waits for this
    // so the browser tab never flashes the placeholder defaults ("My Store").
    const [ready, setReady] = useState(false);

    const reloadConfig = useCallback(() => {
        axios.get('/api/v1/siteconfig', { headers: { Accept: 'application/json' } })
            .then(({ data }) => {
                if (data && data.config) {
                    // Honour whatever the admin saved — including a blue accent.
                    const merged = deepMerge(DEFAULT_SITE_CONFIG, data.config);
                    setConfig(merged);
                    applyTheme(merged.theme);
                }
            })
            .catch(() => {
                applyTheme(DEFAULT_SITE_CONFIG.theme);
            })
            .finally(() => setReady(true));
    }, []);

    // Apply orange defaults IMMEDIATELY on first paint — before API returns.
    // This prevents the blue flash on load.
    useEffect(() => {
        applyTheme(DEFAULT_SITE_CONFIG.theme);
    }, []);

    useEffect(() => {
        reloadConfig();
    }, [reloadConfig]);

    // Live logo as favicon
    const faviconUrl = config.branding?.faviconUrl || config.branding?.logoUrl;
    useEffect(() => {
        if (!faviconUrl) return;
        let link = document.querySelector("link[rel~='icon']");
        if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
        }
        link.href = faviconUrl;
    }, [faviconUrl]);

    return (
        <SiteConfigContext.Provider value={{ config, reloadConfig, ready }}>
            {children}
        </SiteConfigContext.Provider>
    );
};

export const useSiteConfig = () => useContext(SiteConfigContext);

export default SiteConfigContext;
