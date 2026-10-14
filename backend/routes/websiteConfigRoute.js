const express = require('express');
const router = express.Router();

const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth');
const {
    getWebsiteConfig,
    updateWebsiteConfig,
    resetWebsiteConfig,
    getConfigChangeLog,
    getPublicConfig,
    exportConfig,
    importConfig
} = require('../controllers/websiteConfigController');

// Public route - get non-sensitive configuration
router.route('/websiteconfig/public').get(getPublicConfig);

// Admin routes
router.route('/admin/websiteconfig').get(isAuthenticatedUser, authorizeRoles('admin'), getWebsiteConfig);
router.route('/admin/websiteconfig').put(isAuthenticatedUser, authorizeRoles('admin'), updateWebsiteConfig);
router.route('/admin/websiteconfig/reset').put(isAuthenticatedUser, authorizeRoles('admin'), resetWebsiteConfig);
router.route('/admin/websiteconfig/changelog').get(isAuthenticatedUser, authorizeRoles('admin'), getConfigChangeLog);
router.route('/admin/websiteconfig/export').get(isAuthenticatedUser, authorizeRoles('admin'), exportConfig);
router.route('/admin/websiteconfig/import').post(isAuthenticatedUser, authorizeRoles('admin'), importConfig);

module.exports = router;