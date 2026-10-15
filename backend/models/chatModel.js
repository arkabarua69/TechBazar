const mongoose = require('mongoose');

// ── Built-in live chat ────────────────────────────────────────────────
// One conversation per visitor (guest) or logged-in user, plus a flat
// message log. The visitor widget and the admin inbox both poll these
// collections — no websockets required.

const chatConversationSchema = new mongoose.Schema({
    // random id stored in the browser's localStorage for guests
    visitorId: { type: String, index: true },
    // set when the chatter is a logged-in user
    user: { type: mongoose.Schema.ObjectId, ref: 'User' },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, trim: true, maxlength: 120 },
    phone: { type: String, trim: true, maxlength: 20 },
    status: { type: String, enum: ['open', 'closed'], default: 'open', index: true },
    // preview shown in the admin inbox list
    lastMessage: { type: String, default: '' },
    lastMessageAt: { type: Date, default: Date.now, index: true },
    // unread counters: visitor -> admin, admin -> visitor
    unreadAdmin: { type: Number, default: 0 },
    unreadVisitor: { type: Number, default: 0 },
}, { timestamps: true });

const chatMessageSchema = new mongoose.Schema({
    conversation: { type: mongoose.Schema.ObjectId, ref: 'ChatConversation', required: true, index: true },
    sender: { type: String, enum: ['visitor', 'admin'], required: true },
    senderName: { type: String, default: '' },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
}, { timestamps: true });

module.exports = mongoose.model('ChatConversation', chatConversationSchema);
module.exports.ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);
