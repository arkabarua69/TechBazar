const Ticket = require('../models/ticketModel');
const { TicketReply } = require('../models/ticketModel');

const clean = (v, max) => String(v || '').trim().slice(0, max);

// POST /api/v1/tickets  — create a ticket (logged-in user)
exports.createTicket = async (req, res) => {
    try {
        const subject = clean(req.body?.subject, 120);
        const message = clean(req.body?.message, 2000);
        if (!subject) return res.status(400).json({ success: false, message: 'Subject is required' });
        if (!message) return res.status(400).json({ success: false, message: 'Message is required' });

        const category = ['general', 'order', 'payment', 'product', 'other'].includes(req.body?.category) ? req.body.category : 'general';
        const priority = ['low', 'medium', 'high'].includes(req.body?.priority) ? req.body.priority : 'medium';

        const ticket = await Ticket.create({
            user: req.user._id,
            subject,
            message,
            category,
            priority,
        });

        // seed the first reply as the user's opening message
        await TicketReply.create({
            ticket: ticket._id,
            sender: 'user',
            senderName: req.user.name || 'User',
            message,
        });

        return res.status(201).json({ success: true, ticket });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/v1/tickets  — list the logged-in user's tickets
exports.getMyTickets = async (req, res) => {
    try {
        const tickets = await Ticket.find({ user: req.user._id }).sort({ lastReplyAt: -1, createdAt: -1 });
        return res.status(200).json({ success: true, tickets });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/v1/tickets/:id  — detail + replies (owner or admin)
exports.getTicket = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

        const isOwner = String(ticket.user) === String(req.user._id);
        const isAdmin = req.user.role === 'admin';
        if (!isOwner && !isAdmin) return res.status(403).json({ success: false, message: 'Not allowed' });

        const replies = await TicketReply.find({ ticket: ticket._id }).sort({ createdAt: 1 });
        return res.status(200).json({ success: true, ticket, replies });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/v1/tickets/:id/replies  — user reply
exports.addReply = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
        if (String(ticket.user) !== String(req.user._id)) return res.status(403).json({ success: false, message: 'Not allowed' });
        if (ticket.status === 'closed') return res.status(400).json({ success: false, message: 'Ticket is closed' });

        const message = clean(req.body?.message, 2000);
        if (!message) return res.status(400).json({ success: false, message: 'Message is required' });

        const reply = await TicketReply.create({
            ticket: ticket._id,
            sender: 'user',
            senderName: req.user.name || 'User',
            message,
        });

        await Ticket.updateOne({ _id: ticket._id }, {
            $set: { lastReplyAt: new Date(), status: 'open' },
        });

        return res.status(201).json({ success: true, reply });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ── Admin endpoints ────────────────────────────────────────────────────────
exports.getAllTickets = async (req, res) => {
    try {
        const filter = {};
        if (req.query.status && ['open', 'pending', 'closed'].includes(req.query.status)) filter.status = req.query.status;
        const tickets = await Ticket.find(filter).populate('user', 'name email').sort({ lastReplyAt: -1, createdAt: -1 });
        return res.status(200).json({ success: true, tickets });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.adminReply = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

        const message = clean(req.body?.message, 2000);
        if (!message) return res.status(400).json({ success: false, message: 'Message is required' });

        const reply = await TicketReply.create({
            ticket: ticket._id,
            sender: 'admin',
            senderName: req.user?.name || 'Support',
            message,
        });

        await Ticket.updateOne({ _id: ticket._id }, {
            $set: { lastReplyAt: new Date(), status: 'pending' },
        });

        return res.status(201).json({ success: true, reply });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateTicketStatus = async (req, res) => {
    try {
        const status = req.body?.status;
        if (!['open', 'pending', 'closed'].includes(status)) {
            return res.status(400).json({ success: false, message: 'status must be open, pending or closed' });
        }
        const ticket = await Ticket.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
        return res.status(200).json({ success: true, ticket });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
