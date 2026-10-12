const SiteConfig = require('../models/siteConfigModel');
const { DEFAULT_CONFIG, DEFAULT_THEME } = require('../models/siteConfigModel');

const str = (v) => (typeof v === 'string' ? v.trim() : '');

// GET /api/v1/siteconfig  (public - homepage content)
const getSiteConfig = async (req, res) => {
    try {
        const doc = await SiteConfig.findOne().sort('-updatedAt');
        if (!doc) return res.status(200).json({ success: true, config: DEFAULT_CONFIG, isDefault: true });
        // merge defaults so fields added later (e.g. categories) are
        // still returned for documents saved before the field existed
        const config = { ...DEFAULT_CONFIG, ...doc.toObject() };
        return res.status(200).json({ success: true, config, isDefault: false });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// PUT /api/v1/admin/siteconfig  (admin - save homepage content)
const updateSiteConfig = async (req, res) => {
    try {
        const body = req.body || {};

        const update = {
            announcement: body.announcement || {},
            hero: body.hero || {},
            flashSale: body.flashSale || {},
            updatedAt: new Date(),
        };

        if (body.payment) update.payment = body.payment;
        if (body.delivery) update.delivery = body.delivery;
        if (body.support) update.support = body.support;
        if (Array.isArray(body.categories)) {
            update.categories = [...new Set(
                body.categories.map((c) => String(c).trim()).filter(Boolean)
            )].slice(0, 30);
        }
        if (Array.isArray(body.trustBadges)) update.trustBadges = body.trustBadges;
        if (Array.isArray(body.howToOrder)) update.howToOrder = body.howToOrder;
        if (Array.isArray(body.reviews)) update.reviews = body.reviews;

        // theme — visual customisation tokens
        if (body.theme && typeof body.theme === 'object') {
            const t = body.theme;
            const allowedKeys = Object.keys(DEFAULT_THEME);
            const themeUpdate = {};
            allowedKeys.forEach((k) => {
                if (t[k] !== undefined) themeUpdate[k] = t[k];
            });
            if (Object.keys(themeUpdate).length) update.theme = { ...DEFAULT_THEME, ...themeUpdate };
        }

        // branding / seo / navigation / content / chat
        if (body.branding) {
            update.branding = {
                name:       str(body.branding.name).slice(0, 60) || DEFAULT_CONFIG.branding.name,
                tagline:    str(body.branding.tagline).slice(0, 160),
                logoUrl:    str(body.branding.logoUrl).slice(0, 500),
                faviconUrl: str(body.branding.faviconUrl).slice(0, 500),
            };
        }
        if (body.seo) {
            update.seo = {
                titleTemplate: str(body.seo.titleTemplate).slice(0, 120) || DEFAULT_CONFIG.seo.titleTemplate,
                description: str(body.seo.description).slice(0, 300),
            };
        }
        if (body.navigation && Array.isArray(body.navigation.tabs)) {
            update.navigation = {
                tabs: body.navigation.tabs
                    .filter((t) => t && str(t.label) && str(t.href))
                    .slice(0, 6)
                    .map((t) => ({
                        key: str(t.key).slice(0, 30) || str(t.label).toLowerCase().replace(/\s+/g, '-'),
                        label: str(t.label).slice(0, 30),
                        href: str(t.href).slice(0, 120),
                        icon: str(t.icon).slice(0, 40) || 'Home',
                    })),
            };
        }
        if (body.chat) {
            update.chat = { welcomeMessage: str(body.chat.welcomeMessage).slice(0, 300) };
        }
        if (body.content) {
            const c = body.content || {};
            const content = {};
            if (typeof c.policyTitle === 'string') content.policyTitle = c.policyTitle.trim().slice(0, 120);
            if (Array.isArray(c.policy)) {
                content.policy = c.policy
                    .filter((s) => s && str(s.title))
                    .slice(0, 12)
                    .map((s) => ({
                        title: str(s.title).slice(0, 120),
                        body: (Array.isArray(s.body) ? s.body : [])
                            .map(str).filter(Boolean).slice(0, 20)
                            .map((x) => x.slice(0, 500)),
                    }));
            }
            if (Array.isArray(c.faqs)) {
                content.faqs = c.faqs
                    .filter((f) => f && str(f.q))
                    .slice(0, 20)
                    .map((f) => ({ q: str(f.q).slice(0, 300), a: str(f.a).slice(0, 1000) }));
            }
            if (c.footer) {
                const f = c.footer;
                const footer = {};
                if (Array.isArray(f.columns)) {
                    footer.columns = f.columns
                        .filter((col) => col && str(col.title))
                        .slice(0, 6)
                        .map((col) => ({
                            title: str(col.title).slice(0, 60),
                            links: (Array.isArray(col.links) ? col.links : [])
                                .filter((l) => l && str(l.name) && str(l.redirect))
                                .slice(0, 12)
                                .map((l) => ({
                                    name: str(l.name).slice(0, 80),
                                    redirect: str(l.redirect).slice(0, 200),
                                    internal: str(l.redirect).startsWith('/'),
                                })),
                        }));
                }
                if (f.company) {
                    footer.company = {
                        name: str(f.company.name).slice(0, 120),
                        mailUs: str(f.company.mailUs).slice(0, 500),
                        registered: str(f.company.registered).slice(0, 500),
                        cin: str(f.company.cin).slice(0, 60),
                        telephone: str(f.company.telephone).slice(0, 40),
                    };
                }
                if (Array.isArray(f.shortcuts)) {
                    footer.shortcuts = f.shortcuts
                        .filter((s) => s && str(s.label))
                        .slice(0, 6)
                        .map((s) => ({
                            label: str(s.label).slice(0, 60),
                            href: str(s.href).slice(0, 200),
                            icon: str(s.icon).slice(0, 40),
                        }));
                }
                if (typeof f.copyright === 'string') footer.copyright = f.copyright.slice(0, 120);
                if (typeof f.since === 'number') footer.since = f.since;
                content.footer = footer;
            }
            if (Object.keys(content).length) update.content = content;
        }

        const doc = await SiteConfig.findOneAndUpdate({}, update, {
            new: true,
            upsert: true,
            setDefaultsOnInsert: true,
            runValidators: true,
        });

        return res.status(200).json({ success: true, config: doc.toObject() });
    } catch (err) {
        return res.status(400).json({ success: false, message: err.message });
    }
};

// PUT /api/v1/admin/siteconfig/reset  (admin - restore defaults)
const resetSiteConfig = async (req, res) => {
    try {
        await SiteConfig.deleteMany({});
        return res.status(200).json({ success: true, config: DEFAULT_CONFIG });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { getSiteConfig, updateSiteConfig, resetSiteConfig };
