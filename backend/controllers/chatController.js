const ChatConversation = require('../models/chatModel');
const { ChatMessage } = require('../models/chatModel');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const { logEvent } = require('../utils/discordNotify');

// ── helpers ───────────────────────────────────────────────────────────

// Optional identity: a logged-in user still chats through their browser
// visitorId, but we remember who they are when the cookie happens to be there.
const optionalUser = async (req) => {
    try {
        const { token } = req.cookies || {};
        if (!token) return null;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return await User.findById(decoded.id);
    } catch (err) {
        return null;
    }
};

const clean = (value, max) => String(value || '').trim().slice(0, max);

// ── visitor (public, keyed by the browser's visitorId) ───────────────

// POST /api/v1/chat/conversation  — start or resume the visitor's chat
const startConversation = async (req, res) => {
    try {
        const visitorId = clean(req.body?.visitorId, 64);
        if (!visitorId) {
            return res.status(400).json({ success: false, message: 'visitorId is required' });
        }

        const loggedUser = await optionalUser(req);
        const name = clean(req.body?.name, 80) || loggedUser?.name || 'Guest';
        const email = clean(req.body?.email, 120) || loggedUser?.email || '';
        const phone = clean(req.body?.phone, 20);

        let convo = await ChatConversation.findOne({ visitorId });
        if (!convo && loggedUser) {
            convo = await ChatConversation.findOne({ user: loggedUser._id });
        }

        if (!convo) {
            convo = await ChatConversation.create({
                visitorId,
                user: loggedUser?._id,
                name,
                email,
                phone,
            });
        } else {
            // fill in details captured at start time
            convo.name = convo.name || name;
            convo.email = convo.email || email;
            convo.phone = convo.phone || phone;
            if (!convo.visitorId) convo.visitorId = visitorId;
            if (loggedUser && !convo.user) convo.user = loggedUser._id;
            await convo.save();
        }

        // opening the widget marks admin replies as seen
        if (convo.unreadVisitor > 0) {
            await ChatConversation.updateOne({ _id: convo._id }, { $set: { unreadVisitor: 0 } });
            convo.unreadVisitor = 0;
        }

        const messages = await ChatMessage.find({ conversation: convo._id })
            .sort('-createdAt')
            .limit(100);

        return res.status(200).json({ success: true, conversation: convo.toObject(), messages: messages.reverse() });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/v1/chat/conversation?visitorId=xxx  — poll for new replies
const getConversation = async (req, res) => {
    try {
        const visitorId = clean(req.query?.visitorId, 64);
        if (!visitorId) {
            return res.status(400).json({ success: false, message: 'visitorId is required' });
        }

        const convo = await ChatConversation.findOne({ visitorId });
        if (!convo) return res.status(200).json({ success: true, conversation: null, messages: [] });

        const messages = await ChatMessage.find({ conversation: convo._id })
            .sort('-createdAt')
            .limit(100);

        // only clear the badge while the widget is actually open — the
        // launcher needs unreadVisitor when it polls with markRead=false
        const markRead = req.query.markRead === 'true';
        if (markRead && convo.unreadVisitor > 0) {
            await ChatConversation.updateOne({ _id: convo._id }, { $set: { unreadVisitor: 0 } });
            convo.unreadVisitor = 0;
        }

        return res.status(200).json({ success: true, conversation: convo.toObject(), messages: messages.reverse() });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/v1/chat/messages  — visitor sends a message
const sendVisitorMessage = async (req, res) => {
    try {
        const visitorId = clean(req.body?.visitorId, 64);
        const text = clean(req.body?.message, 2000);
        if (!visitorId || !text) {
            return res.status(400).json({ success: false, message: 'visitorId and message are required' });
        }

        const convo = await ChatConversation.findOne({ visitorId });
        if (!convo) {
            return res.status(404).json({ success: false, message: 'Conversation not found. Start the chat first.' });
        }

        const doc = await ChatMessage.create({
            conversation: convo._id,
            sender: 'visitor',
            senderName: convo.name,
            message: text,
        });

        // a new visitor message reopens a closed conversation
        await ChatConversation.updateOne({ _id: convo._id }, {
            $set: { lastMessage: text, lastMessageAt: new Date(), status: 'open' },
            $inc: { unreadAdmin: 1 },
        });

        // Discord: a customer message — heads-up in the log channel
        logEvent('chat_message', {
            title: '💬 New chat message',
            color: 0x06b6d4,
            fields: [
                { name: '👤 From', value: `${convo.name || 'Guest'}${convo.email ? ` · ${convo.email}` : ''}` },
                { name: '💬 Message', value: text },
            ],
            footer: `conversation ${convo._id}`,
        }).catch(() => {});

        return res.status(201).json({ success: true, message: doc });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ── admin inbox ───────────────────────────────────────────────────────

// GET /api/v1/admin/chat/conversations?status=open&search=xxx
const getChatConversations = async (req, res) => {
    try {
        const filter = {};
        if (req.query.status === 'open' || req.query.status === 'closed') filter.status = req.query.status;
        if (req.query.unread === 'true') filter.unreadAdmin = { $gt: 0 };
        if (req.query.search) {
            const rx = new RegExp(String(req.query.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
            filter.$or = [{ name: rx }, { email: rx }, { phone: rx }, { lastMessage: rx }];
        }

        const conversations = await ChatConversation.find(filter)
            .sort('-lastMessageAt')
            .limit(100);

        const unreadTotal = (await ChatConversation.aggregate([
            { $group: { _id: null, total: { $sum: '$unreadAdmin' } } },
        ]))[0]?.total || 0;

        return res.status(200).json({ success: true, conversations, unreadTotal });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/v1/admin/chat/conversations/:id  — thread + marks it read
const getChatConversation = async (req, res) => {
    try {
        const convo = await ChatConversation.findById(req.params.id);
        if (!convo) return res.status(404).json({ success: false, message: 'Conversation not found' });

        if (convo.unreadAdmin > 0) {
            await ChatConversation.updateOne({ _id: convo._id }, { $set: { unreadAdmin: 0 } });
            convo.unreadAdmin = 0;
        }

        const messages = await ChatMessage.find({ conversation: convo._id })
            .sort('-createdAt')
            .limit(300);

        return res.status(200).json({ success: true, conversation: convo.toObject(), messages: messages.reverse() });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/v1/admin/chat/conversations/:id/messages  — admin reply
const sendAdminMessage = async (req, res) => {
    try {
        const text = clean(req.body?.message, 2000);
        if (!text) return res.status(400).json({ success: false, message: 'message is required' });

        const convo = await ChatConversation.findById(req.params.id);
        if (!convo) return res.status(404).json({ success: false, message: 'Conversation not found' });

        const doc = await ChatMessage.create({
            conversation: convo._id,
            sender: 'admin',
            senderName: req.user?.name || 'Support',
            message: text,
        });

        await ChatConversation.updateOne({ _id: convo._id }, {
            $set: { lastMessage: text, lastMessageAt: new Date(), status: 'open' },
            $inc: { unreadVisitor: 1 },
        });

        return res.status(201).json({ success: true, message: doc });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// PUT /api/v1/admin/chat/conversations/:id/status  — open / close
const updateConversationStatus = async (req, res) => {
    try {
        const status = req.body?.status;
        if (status !== 'open' && status !== 'closed') {
            return res.status(400).json({ success: false, message: 'status must be open or closed' });
        }

        const convo = await ChatConversation.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true },
        );
        if (!convo) return res.status(404).json({ success: false, message: 'Conversation not found' });

        return res.status(200).json({ success: true, conversation: convo.toObject() });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = {
    startConversation,
    getConversation,
    sendVisitorMessage,
    getChatConversations,
    getChatConversation,
    sendAdminMessage,
    updateConversationStatus,
};
