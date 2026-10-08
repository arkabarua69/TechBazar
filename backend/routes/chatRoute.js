const express = require('express');
const router = express.Router();

const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth');

const {
    startConversation,
    getConversation,
    sendVisitorMessage,
    getChatConversations,
    getChatConversation,
    sendAdminMessage,
    updateConversationStatus,
} = require('../controllers/chatController');

// Visitor widget (public — identified by the browser's visitorId)
router.route('/chat/conversation').post(startConversation).get(getConversation);
router.route('/chat/messages').post(sendVisitorMessage);

// Admin chat inbox
router.route('/admin/chat/conversations').get(isAuthenticatedUser, authorizeRoles('admin'), getChatConversations);
router.route('/admin/chat/conversations/:id').get(isAuthenticatedUser, authorizeRoles('admin'), getChatConversation);
router.route('/admin/chat/conversations/:id/messages').post(isAuthenticatedUser, authorizeRoles('admin'), sendAdminMessage);
router.route('/admin/chat/conversations/:id/status').put(isAuthenticatedUser, authorizeRoles('admin'), updateConversationStatus);

module.exports = router;
