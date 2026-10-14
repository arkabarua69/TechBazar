const express = require('express');
const router = express.Router();

const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth');

const {
    getSiteConfig,
    updateSiteConfig,
    resetSiteConfig,
} = require('../controllers/siteConfigController');

// Homepage content (CMS) — public read, admin write
router.route('/siteconfig').get(getSiteConfig);
router.route('/admin/siteconfig').put(isAuthenticatedUser, authorizeRoles('admin'), updateSiteConfig);
router.route('/admin/siteconfig/reset').put(isAuthenticatedUser, authorizeRoles('admin'), resetSiteConfig);

module.exports = router;
