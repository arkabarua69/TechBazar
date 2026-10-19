const express = require('express');
const { getAllProducts, getProductDetails, updateProduct, deleteProduct, getProductReviews, deleteReview, createProductReview, createProduct, getAdminProducts, getProducts, toggleFeaturedProduct } = require('../controllers/productController');
const { getGallery, deleteGalleryImage, downloadGalleryImage } = require('../controllers/galleryController');
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth');

const router = express.Router();

router.route('/products').get(getAllProducts);
router.route('/products/all').get(getProducts);

// Public image gallery — all ImgBB-hosted images aggregated
router.route('/gallery').get(getGallery);

// Public: download a gallery image (proxied with an attachment header)
router.route('/gallery/download').get(downloadGalleryImage);

// Admin-only: remove an image from the gallery (clears every reference)
router.route('/admin/gallery').delete(isAuthenticatedUser, authorizeRoles("admin"), deleteGalleryImage);

router.route('/admin/products').get(isAuthenticatedUser, authorizeRoles("admin"), getAdminProducts);
router.route('/admin/product/new').post(isAuthenticatedUser, authorizeRoles("admin"), createProduct);

router.route('/admin/product/:id')
    .put(isAuthenticatedUser, authorizeRoles("admin"), updateProduct)
    .delete(isAuthenticatedUser, authorizeRoles("admin"), deleteProduct);

router.route('/admin/product/:id/featured')
    .put(isAuthenticatedUser, authorizeRoles("admin"), toggleFeaturedProduct);

router.route('/product/:id').get(getProductDetails);

router.route('/review').put(isAuthenticatedUser, createProductReview);

router.route('/admin/reviews')
    .get(isAuthenticatedUser, authorizeRoles("admin"), getProductReviews)
    .delete(isAuthenticatedUser, authorizeRoles("admin"), deleteReview);

module.exports = router;