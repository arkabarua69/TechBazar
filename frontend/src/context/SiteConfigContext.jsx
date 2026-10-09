import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { DEFAULT_SITE_CONFIG } from '../utils/siteConfig';

// Single fetch of GET /api/v1/siteconfig shared by every consumer
// (header logo, page metadata, bottom tabs, footer, policy, FAQs, chat).
// Falls back to the bundled defaults when the backend is unreachable.
const SiteConfigContext = createContext({ config: DEFAULT_SITE_CONFIG });

export const SiteConfigProvider = ({ children }) => {
    const [config, setConfig] = useState(DEFAULT_SITE_CONFIG);

    useEffect(() => {
        let alive = true;
        axios.get('/api/v1/siteconfig', { headers: { Accept: 'application/json' } })
            .then(({ data }) => {
                if (alive && data && data.config) {
                    setConfig({ ...DEFAULT_SITE_CONFIG, ...data.config });
                }
            })
            .catch(() => { /* keep bundled defaults */ });
        return () => { alive = false; };
    }, []);

    // live favicon — admin uploads a logo URL and it becomes the tab icon
    const logoUrl = config.branding?.logoUrl;
    useEffect(() => {
        if (!logoUrl) return undefined;
        let link = document.querySelector("link[rel~='icon']");
        if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
        }
        link.href = logoUrl;
        return undefined;
    }, [logoUrl]);

    return (
        <SiteConfigContext.Provider value={{ config }}>
            {children}
        </SiteConfigContext.Provider>
    );
};

export const useSiteConfig = () => useContext(SiteConfigContext);

export default SiteConfigContext;
