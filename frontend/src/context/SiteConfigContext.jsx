import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { DEFAULT_SITE_CONFIG } from '../utils/siteConfig';
import { applyTheme, cacheTheme, applyCachedTheme } from '../utils/applyTheme';

// Single fetch of GET /api/v1/siteconfig shared by every consumer.
// Also applies CSS custom properties from config.theme to :root so every
// component that uses var(--color-accent) etc. updates instantly.
const SiteConfigContext = createContext({
    config: DEFAULT_SITE_CONFIG,
    reloadConfig: () => {},
    ready: true,
});

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
                    // Remember it so the next reload paints the right colours
                    // immediately, without waiting for this request.
                    cacheTheme(merged.theme);
                }
            })
            .catch(() => {
                applyTheme(DEFAULT_SITE_CONFIG.theme);
            })
            .finally(() => setReady(true));
    }, []);

    // Apply the last known theme IMMEDIATELY on first paint — before the API
    // returns. Falls back to the built-in defaults on a first-ever visit, so
    // the page never flashes a stale accent colour while loading.
    useEffect(() => {
        if (!applyCachedTheme()) applyTheme(DEFAULT_SITE_CONFIG.theme);
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
