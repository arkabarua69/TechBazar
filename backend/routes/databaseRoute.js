const express = require('express');
const router = express.Router();
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth');
const {
    getDatabaseStatus,
    testConnection,
    saveMongoUri,
    runSeed,
    dropCollections,
} = require('../controllers/databaseController');

const adminOnly = [isAuthenticatedUser, authorizeRoles('admin')];

router.get('/admin/database/status', ...adminOnly, getDatabaseStatus);
router.post('/admin/database/test', ...adminOnly, testConnection);
router.put('/admin/database/uri', ...adminOnly, saveMongoUri);
router.post('/admin/database/seed', ...adminOnly, runSeed);
router.post('/admin/database/drop', ...adminOnly, dropCollections);

module.exports = router;
