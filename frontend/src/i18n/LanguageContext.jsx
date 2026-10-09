import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
    LANG_EN,
    LANG_BN,
    translations,
} from './translations';

const LanguageContext = createContext();

const LANG_STORAGE_KEY = 'techbazar_admin_lang';

// flatten the nested key set so t('nav.dashboard') and t('dashboard') both work
const buildFlatKeys = (lang) => {
    const keys = {};
    const rec = (obj, prefix = '') => {
        Object.entries(obj).forEach(([k, v]) => {
            const path = prefix ? `${prefix}.${k}` : k;
            keys[path] = v;
            if (v && typeof v === 'object' && !Array.isArray(v)) {
                rec(v, path);
            }
        });
    };
    rec(translations[lang]);
    return keys;
};

export const LanguageProvider = ({ children }) => {
    // default = EN on first load; persist to localStorage thereafter
    const [lang, setLang] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem(LANG_STORAGE_KEY) || LANG_EN;
        }
        return LANG_EN;
    });

    // keep <html lang=""> in sync (helps screen-readers + SEO)
    useEffect(() => {
        document.documentElement.lang = lang;
    }, [lang]);

    const switchLanguage = useCallback((code) => {
        if (code !== LANG_EN && code !== LANG_BN) return;
        setLang(code);
        if (typeof window !== 'undefined') {
            localStorage.setItem(LANG_STORAGE_KEY, code);
        }
    }, []);

    const t = useMemo(() => {
        const flat = buildFlatKeys(lang);
        // support both 'nav.dashboard' and 'dashboard' lookups
        return (key, fallback = key) => {
            if (flat[key] !== undefined) return flat[key];
            // strip a leading namespace like 'nav.'
            const parts = key.split('.');
            for (let i = 1; i < parts.length; i++) {
                const sub = parts.slice(i).join('.');
                if (flat[sub] !== undefined) return flat[sub];
            }
            return fallback;
        };
    }, [lang]);

    const isBengali = lang === LANG_BN;

    const value = useMemo(() => ({
        lang,
        isBengali,
        switchLanguage,
        t,
    }), [lang, isBengali, switchLanguage, t]);

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const ctx = useContext(LanguageContext);
    if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
    return ctx;
};

export const useTranslation = () => {
    const ctx = useContext(LanguageContext);
    if (!ctx) throw new Error('useTranslation must be used within LanguageProvider');
    return { t: ctx.t, lang: ctx.lang, isBengali: ctx.isBengali, switchLanguage: ctx.switchLanguage };
};

export { LANG_EN, LANG_BN };
