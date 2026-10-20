const mongoose = require('mongoose');

// ── Support tickets ────────────────────────────────────────────────────────
// A logged-in user can open one or more support tickets. Each ticket holds a
// flat reply thread (user + admin messages) and a status. The admin inbox
// (separate route) reads/writes the same collections.
const ticketSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.ObjectId, ref: 'User', required: true, index: true },
    subject: { type: String, required: true, trim: true, maxlength: 120 },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    category: { type: String, enum: ['general', 'order', 'payment', 'product', 'other'], default: 'general' },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    status: { type: String, enum: ['open', 'pending', 'closed'], default: 'open', index: true },
    lastReplyAt: { type: Date, default: Date.now, index: true },
}, { timestamps: true });

const ticketReplySchema = new mongoose.Schema({
    ticket: { type: mongoose.Schema.ObjectId, ref: 'Ticket', required: true, index: true },
    sender: { type: String, enum: ['user', 'admin'], required: true },
    senderName: { type: String, default: '' },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
}, { timestamps: true });

const Ticket = mongoose.model('Ticket', ticketSchema);
const TicketReply = mongoose.model('TicketReply', ticketReplySchema);

module.exports = Ticket;
module.exports.TicketReply = TicketReply;
