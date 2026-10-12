import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { DEFAULT_SITE_CONFIG } from '../utils/siteConfig';

// Single fetch of GET /api/v1/siteconfig shared by every consumer.
// Also applies CSS custom properties from config.theme to :root so every
// component that uses var(--color-accent) etc. updates instantly.
const SiteConfigContext = createContext({
    config: DEFAULT_SITE_CONFIG,
    reloadConfig: () => {},
});

// Map theme keys → CSS variable names
const CSS_VAR_MAP = {
    colorAccent:           '--color-accent',
    colorAccentHover:      '--color-accent-hover',
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

const FONT_PRESETS = {
    Manrope: 'Manrope, ui-sans-serif, system-ui, sans-serif',
    Roboto:  'Roboto, ui-sans-serif, system-ui, sans-serif',
    Inter:   'Inter, ui-sans-serif, system-ui, sans-serif',
    Poppins: 'Poppins, ui-sans-serif, system-ui, sans-serif',
    Nunito:  'Nunito, ui-sans-serif, system-ui, sans-serif',
    Lato:    'Lato, ui-sans-serif, system-ui, sans-serif',
};
const DISPLAY_PRESETS = {
    Sora:         'Sora, Manrope, ui-sans-serif, system-ui, sans-serif',
    Montserrat:   'Montserrat, ui-sans-serif, system-ui, sans-serif',
    Raleway:      'Raleway, ui-sans-serif, system-ui, sans-serif',
    'Playfair Display': '"Playfair Display", Georgia, serif',
    Merriweather: 'Merriweather, Georgia, serif',
};

const applyTheme = (theme = {}) => {
    const root = document.documentElement;

    // Apply CSS custom properties
    Object.entries(CSS_VAR_MAP).forEach(([key, cssVar]) => {
        if (theme[key] !== undefined && theme[key] !== null) {
            let val = String(theme[key]);
            // Resolve font names to full font stacks
            if (key === 'fontBody')    val = FONT_PRESETS[val] || val;
            if (key === 'fontDisplay') val = DISPLAY_PRESETS[val] || val;
            root.style.setProperty(cssVar, val);
        }
    });

    // Dark mode via class on <html>
    if (theme.darkMode) {
        root.classList.add('dark-mode');
    } else {
        root.classList.remove('dark-mode');
    }
};

export const SiteConfigProvider = ({ children }) => {
    const [config, setConfig] = useState(DEFAULT_SITE_CONFIG);

    const reloadConfig = useCallback(() => {
        axios.get('/api/v1/siteconfig', { headers: { Accept: 'application/json' } })
            .then(({ data }) => {
                if (data && data.config) {
                    const merged = { ...DEFAULT_SITE_CONFIG, ...data.config };
                    setConfig(merged);
                    applyTheme(merged.theme || DEFAULT_SITE_CONFIG.theme);
                }
            })
            .catch(() => {
                applyTheme(DEFAULT_SITE_CONFIG.theme);
            });
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
        <SiteConfigContext.Provider value={{ config, reloadConfig }}>
            {children}
        </SiteConfigContext.Provider>
    );
};

export const useSiteConfig = () => useContext(SiteConfigContext);

export default SiteConfigContext;
