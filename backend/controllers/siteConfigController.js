const SiteConfig = require('../models/siteConfigModel');
const { DEFAULT_CONFIG } = require('../models/siteConfigModel');

// GET /api/v1/siteconfig  (public - homepage content)
const getSiteConfig = async (req, res) => {
    try {
        const doc = await SiteConfig.findOne().sort('-updatedAt');
        if (!doc) return res.status(200).json({ success: true, config: DEFAULT_CONFIG, isDefault: true });
        return res.status(200).json({ success: true, config: doc.toObject(), isDefault: false });
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
        if (Array.isArray(body.trustBadges)) update.trustBadges = body.trustBadges;
        if (Array.isArray(body.howToOrder)) update.howToOrder = body.howToOrder;
        if (Array.isArray(body.reviews)) update.reviews = body.reviews;

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
