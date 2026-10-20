const express = require('express');
const router = express.Router();

const { isAuthenticatedUser, authorizeRoles, optionalAuth } = require('../middlewares/auth');

const {
    getSiteConfig,
    updateSiteConfig,
    resetSiteConfig,
} = require('../controllers/siteConfigController');

const {
    getStoreConfig,
    createStoreOrder,
    getStoreOrderGroup,
    getStoreOrders,
    approveStoreOrder,
    cancelStoreOrder,
    trackStoreOrder,
    updateFulfilmentStatus,
    getMyStoreOrders,
} = require('../controllers/storeOrderController');

// Checkout: logged-in buyers get their order linked to the account, guests
// still order without an account (optionalAuth never blocks the request).
router.route('/store/config').get(getStoreConfig);
router.route('/store/orders').post(optionalAuth, createStoreOrder);
router.route('/store/orders/:groupId').get(getStoreOrderGroup);
// Guest tracking by phone, order-id or order-group id (public, no login needed)
router.route('/store/track').get(trackStoreOrder);
// Logged-in user's own store orders (account page)
router.route('/store/my-orders').get(isAuthenticatedUser, getMyStoreOrders);

// Admin: approve, cancel, fulfilment status
router.route('/admin/store/orders').get(isAuthenticatedUser, authorizeRoles('admin'), getStoreOrders);
router.route('/admin/store/orders/:id/status').put(isAuthenticatedUser, authorizeRoles('admin'), updateFulfilmentStatus);
router.route('/admin/store/orders/:id/approve').put(isAuthenticatedUser, authorizeRoles('admin'), approveStoreOrder);
router.route('/admin/store/orders/:id/cancel').put(isAuthenticatedUser, authorizeRoles('admin'), cancelStoreOrder);

// Homepage content (CMS) — public read, admin write
router.route('/siteconfig').get(getSiteConfig);
router.route('/admin/siteconfig').put(isAuthenticatedUser, authorizeRoles('admin'), updateSiteConfig);
router.route('/admin/siteconfig/reset').put(isAuthenticatedUser, authorizeRoles('admin'), resetSiteConfig);

module.exports = router;
