const express = require('express');
const router = express.Router();

const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth');

const {
    getStorefrontProducts,
    placeStorefrontOrder,
    getStorefrontOrder,
} = require('../controllers/storefrontController');

const {
    getStoreConfig,
    createStoreOrder,
    getStoreOrderGroup,
    getStoreOrders,
    approveStoreOrder,
    cancelStoreOrder,
    syncStoreCatalog,
    trackStoreOrder,
    updateFulfilmentStatus,
} = require('../controllers/storeOrderController');

const {
    getSiteConfig,
    updateSiteConfig,
    resetSiteConfig,
} = require('../controllers/siteConfigController');

// Business Koro proxy (server-side only; API key never reaches the browser)
router.route('/storefront/products').get(getStorefrontProducts);
router.route('/storefront/orders').post(placeStorefrontOrder);
router.route('/storefront/orders/:orderId').get(getStorefrontOrder);

// Guest checkout: config + create order (backup record, approval pending)
router.route('/store/config').get(getStoreConfig);
router.route('/store/orders').post(createStoreOrder);
router.route('/store/orders/:groupId').get(getStoreOrderGroup);
// Guest tracking by phone or order-group id (public, no login needed)
router.route('/store/track').get(trackStoreOrder);

// Admin: approve/forward, cancel, catalogue sync, fulfilment status
router.route('/admin/store/orders').get(isAuthenticatedUser, authorizeRoles('admin'), getStoreOrders);
router.route('/admin/store/orders/:id/status').put(isAuthenticatedUser, authorizeRoles('admin'), updateFulfilmentStatus);
router.route('/admin/store/orders/:id/approve').put(isAuthenticatedUser, authorizeRoles('admin'), approveStoreOrder);
router.route('/admin/store/orders/:id/cancel').put(isAuthenticatedUser, authorizeRoles('admin'), cancelStoreOrder);
router.route('/admin/store/sync').post(isAuthenticatedUser, authorizeRoles('admin'), syncStoreCatalog);

// Homepage content (CMS) — public read, admin write
router.route('/siteconfig').get(getSiteConfig);
router.route('/admin/siteconfig').put(isAuthenticatedUser, authorizeRoles('admin'), updateSiteConfig);
router.route('/admin/siteconfig/reset').put(isAuthenticatedUser, authorizeRoles('admin'), resetSiteConfig);

module.exports = router;
