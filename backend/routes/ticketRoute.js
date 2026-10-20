const express = require('express');
const router = express.Router();

const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth');
const {
    createTicket,
    getMyTickets,
    getTicket,
    addReply,
    getAllTickets,
    adminReply,
    updateTicketStatus,
} = require('../controllers/ticketController');

// User tickets (auth required)
router.route('/tickets').post(isAuthenticatedUser, createTicket).get(isAuthenticatedUser, getMyTickets);
router.route('/tickets/:id').get(isAuthenticatedUser, getTicket);
router.route('/tickets/:id/replies').post(isAuthenticatedUser, addReply);

// Admin ticket inbox
router.route('/admin/tickets').get(isAuthenticatedUser, authorizeRoles('admin'), getAllTickets);
router.route('/admin/tickets/:id').get(isAuthenticatedUser, authorizeRoles('admin'), getTicket);
router.route('/admin/tickets/:id/replies').post(isAuthenticatedUser, authorizeRoles('admin'), adminReply);
router.route('/admin/tickets/:id/status').put(isAuthenticatedUser, authorizeRoles('admin'), updateTicketStatus);

module.exports = router;
