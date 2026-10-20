const express = require('express');
const { registerUser, loginUser, logoutUser, getUserDetails, forgotPassword, resetPassword, updatePassword, updateProfile, getAllUsers, getSingleUser, updateUserRole, updateCodAllowed, deleteUser, getMyAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress } = require('../controllers/userController');
const { getProviders, startOAuth, oauthCallback } = require('../controllers/oauthController');
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth');

const router = express.Router();

router.route('/register').post(registerUser);
router.route('/login').post(loginUser);
router.route('/logout').get(logoutUser);

// Social login (Google / Facebook / Discord) — OAuth 2.0 authorization code
router.route('/auth/providers').get(getProviders);
router.route('/auth/:provider/start').get(startOAuth);
router.route('/auth/:provider/callback').get(oauthCallback);

router.route('/me').get(isAuthenticatedUser, getUserDetails);

router.route('/password/forgot').post(forgotPassword);
router.route('/password/reset/:token').put(resetPassword);

router.route('/password/update').put(isAuthenticatedUser, updatePassword);

router.route('/me/update').put(isAuthenticatedUser, updateProfile);

// Manage Addresses — saved delivery addresses on the user's profile
router.route('/addresses')
    .get(isAuthenticatedUser, getMyAddresses)
    .post(isAuthenticatedUser, addAddress);

router.route('/addresses/:addressId')
    .put(isAuthenticatedUser, updateAddress)
    .delete(isAuthenticatedUser, deleteAddress);

router.route('/addresses/:addressId/default').put(isAuthenticatedUser, setDefaultAddress);

router.route("/admin/users").get(isAuthenticatedUser, authorizeRoles("admin"), getAllUsers);

router.route("/admin/user/:id")
    .get(isAuthenticatedUser, authorizeRoles("admin"), getSingleUser)
    .put(isAuthenticatedUser, authorizeRoles("admin"), updateUserRole)
    .delete(isAuthenticatedUser, authorizeRoles("admin"), deleteUser);

// COD (Cash on Delivery) permission toggle — Admin → Users
router.route("/admin/user/:id/cod").put(isAuthenticatedUser, authorizeRoles("admin"), updateCodAllowed);

module.exports = router;