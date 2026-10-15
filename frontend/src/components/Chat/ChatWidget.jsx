import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { DEFAULT_SITE_CONFIG } from '../../utils/siteConfig';
import { useSiteConfig } from '../../context/SiteConfigContext';

// ── Built-in web live chat widget ─────────────────────────────────────
// Floating messenger shown on every storefront page. Hybrid by design:
// visitors chat inside the app AND can jump to WhatsApp in one tap.
// The visitor's identity is a random id kept in localStorage (guests) —
// the backend polls are driven by this component.

const makeVisitorId = () => {
    if (window.crypto && window.crypto.randomUUID) return `v_${window.crypto.randomUUID()}`;
    return `v_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
};

const getVisitorId = () => {
    try {
        const existing = localStorage.getItem('techbazar_chat_visitor');
        if (existing) return existing;
        const fresh = makeVisitorId();
        localStorage.setItem('techbazar_chat_visitor', fresh);
        return fresh;
    } catch (err) {
        return makeVisitorId();
    }
};

// one-tap WhatsApp link (BD numbers may be written with or without 880)
const waLink = (phone, text = '') => {
    const digits = String(phone || '').replace(/\D/g, '');
    if (!digits) return '';
    const intl = digits.startsWith('880') ? digits : `88${digits.replace(/^0/, '')}`;
    return `https://wa.me/${intl}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
};

const timeOf = (dt) => new Date(dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const ChatWidget = () => {

    const { pathname } = useLocation();
    const { user } = useSelector((state) => state.user);

    const [open, setOpen] = useState(false);
    const [conversation, setConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [unread, setUnread] = useState(0);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [text, setText] = useState('');
    const [starting, setStarting] = useState(false);
    const [sending, setSending] = useState(false);

    // support contacts + welcome copy from the CMS (Admin → Homepage)
    const { config } = useSiteConfig();
    const support = config.support || DEFAULT_SITE_CONFIG.support;

    const visitorIdRef = useRef(null);
    const bodyRef = useRef(null);
    if (visitorIdRef.current === null) visitorIdRef.current = getVisitorId();

    const isLoggedIn = Boolean(user && user._id);
    const welcomeText = config.chat?.welcomeMessage || DEFAULT_SITE_CONFIG.chat.welcomeMessage;
    const waHref = support?.whatsapp ? waLink(support.whatsapp, welcomeText) : '';

    // prefill the start form for logged-in users
    useEffect(() => {
        if (user?.name) setName((prev) => prev || user.name);
    }, [user]);

    const loadChat = useCallback(async (markRead) => {
        const visitorId = visitorIdRef.current;
        if (!visitorId) return;
        try {
            const { data } = await axios.get('/api/v1/chat/conversation', {
                params: { visitorId, markRead: markRead ? 'true' : 'false' },
                headers: { Accept: 'application/json' },
            });
            setConversation(data.conversation || null);
            setMessages(data.messages || []);
            setUnread(data.conversation?.unreadVisitor || 0);
        } catch (err) {
            /* transient network error — next tick will retry */
        }
    }, []);

    // polling: fast while the panel is open, slow (badge only) when closed
    useEffect(() => {
        const hasChat = Boolean(conversation);
        if (!open && !hasChat) return undefined;
        const delay = open ? 4000 : 10000;
        const tick = () => loadChat(open);
        const id = setInterval(tick, delay);
        return () => clearInterval(id);
    }, [open, conversation, loadChat]);

    // keep the newest message in view
    useEffect(() => {
        if (open && bodyRef.current) {
            bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
        }
    }, [messages, open]);

    const startChat = async (e) => {
        e?.preventDefault();
        const finalName = (name || '').trim() || (user?.name ? user.name : '');
        if (!finalName) return;
        setStarting(true);
        try {
            const { data } = await axios.post('/api/v1/chat/conversation', {
                visitorId: visitorIdRef.current,
                name: finalName,
                phone: (phone || '').trim(),
                email: user?.email || '',
            }, { headers: { 'Content-Type': 'application/json', Accept: 'application/json' } });
            setConversation(data.conversation);
            setMessages(data.messages || []);
            setUnread(0);
        } catch (err) {
            // ignore — the form stays visible so the visitor can retry
        } finally {
            setStarting(false);
        }
    };

    const send = async (e) => {
        e?.preventDefault();
        const body = (text || '').trim();
        if (!body || sending) return;
        setSending(true);
        try {
            const { data } = await axios.post('/api/v1/chat/messages', {
                visitorId: visitorIdRef.current,
                message: body,
            }, { headers: { 'Content-Type': 'application/json', Accept: 'application/json' } });
            setMessages((prev) => [...prev, data.message]);
            setConversation((prev) => prev && ({
                ...prev,
                lastMessage: body,
                lastMessageAt: new Date().toISOString(),
                status: 'open',
            }));
            setText('');
        } catch (err) {
            /* keep the draft so nothing is lost */
        } finally {
            setSending(false);
        }
    };

    const toggle = () => {
        const next = !open;
        setOpen(next);
        if (next && !conversation && isLoggedIn) startChat();
    };

    const showForm = open && !conversation;

    // admin has its own layout — no widget there (after all hooks!)
    if (pathname.startsWith('/admin')) return null;

    return (
        <>
            {/* ── launcher ── */}
            <button
                onClick={toggle}
                aria-label={open ? 'Close live chat' : 'Open live chat'}
                className="fixed right-4 bottom-[86px] md:bottom-6 z-50 w-14 h-14 rounded-full bg-primary-blue text-white shadow-[0_8px_24px_rgba(59,130,246,0.45)] flex items-center justify-center transition active:scale-95 hover:bg-blue-700"
            >
                {open ? <CloseIcon /> : <ChatIcon />}
                {!open && unread > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 text-xs font-bold text-white bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
                        {unread > 9 ? '9+' : unread}
                    </span>
                )}
            </button>

            {/* ── panel ── */}
            {open && (
                <div className="fixed right-4 bottom-[152px] md:bottom-24 z-50 w-[calc(100vw-2rem)] sm:w-[370px] h-[65vh] max-h-[540px] bg-white rounded-2xl shadow-2xl border border-line flex flex-col overflow-hidden">

                    {/* header */}
                    <div className="bg-primary-blue text-white px-4 py-3 flex items-center gap-3">
                        <span className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                            <SupportAgentIcon sx={{ fontSize: '20px' }} />
                        </span>
                        <div className="flex flex-col leading-tight">
                            <span className="font-semibold text-sm">Live Support</span>
                            <span className="text-xs text-blue-100 flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
                                We are online now
                            </span>
                        </div>
                        <button onClick={toggle} aria-label="Minimize chat" className="ml-auto p-1 hover:bg-white/10 rounded-full">
                            <CloseIcon sx={{ fontSize: '20px' }} />
                        </button>
                    </div>

                    {/* hybrid dual option: in-app chat + WhatsApp */}
                    <div className="flex gap-2 px-3 py-2 bg-cloud border-b border-line">
                        <span className="flex-1 flex items-center justify-center gap-1 text-xs font-semibold text-primary-blue bg-blue-50 border border-blue-100 rounded-lg py-1.5">
                            <SupportAgentIcon sx={{ fontSize: '15px' }} /> In-app Chat
                        </span>
                        {waHref && (
                            <a
                                href={waHref}
                                target="_blank"
                                rel="noreferrer"
                                className="flex-1 flex items-center justify-center gap-1 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg py-1.5"
                            >
                                <WhatsAppIcon sx={{ fontSize: '15px' }} /> WhatsApp
                            </a>
                        )}
                    </div>

                    {/* body */}
                    {showForm ? (
                        <form onSubmit={startChat} className="flex-1 flex flex-col justify-center gap-3 p-4 bg-cloud">
                            <div className="text-center mb-1">
<h3 className="font-semibold text-slate-800">Start a Conversation</h3>
<p className="text-xs text-slate-500">Tell us your name — our support team replies fast.</p>
                            </div>
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Your name *"
                                maxLength={80}
                                className="border border-line rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary-blue"
                            />
                            <input
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="Mobile number (optional)"
                                maxLength={20}
                                className="border border-line rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary-blue"
                            />
                            <button
                                type="submit"
                                disabled={starting || !(name || '').trim()}
                                className="bg-primary-blue text-white font-medium rounded-lg py-2.5 text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {starting ? 'Starting...' : 'Start Chat'}
                            </button>
                            {waHref && (
                                <a href={waHref} target="_blank" rel="noreferrer" className="text-center text-xs text-green-700 font-medium hover:underline">
                                    Or message us on WhatsApp →
                                </a>
                            )}
                        </form>
                    ) : (
                        <>
                            <div ref={bodyRef} className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2 bg-cloud">
                                <div className="self-center text-xxs text-slate-400 bg-white border border-line rounded-full px-3 py-1">
                                    Welcome to Support · Type your question
                                </div>
                                {messages.map((msg) => (
                                    <div
                                        key={msg._id}
                                        className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm break-words ${
                                            msg.sender === 'visitor'
                                                ? 'self-end bg-primary-blue text-white rounded-br-sm'
                                                : 'self-start bg-white text-slate-700 border border-line rounded-bl-sm'
                                        }`}
                                    >
                                        <p className="whitespace-pre-wrap">{msg.message}</p>
                                        <span className={`block text-xxs mt-1 text-right ${msg.sender === 'visitor' ? 'text-blue-100' : 'text-slate-400'}`}>
                                            {timeOf(msg.createdAt)}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <form onSubmit={send} className="flex items-center gap-2 p-2.5 border-t border-line bg-white">
                                <input
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    placeholder="Type a message..."
                                    maxLength={2000}
                                    className="flex-1 border border-line rounded-full px-4 py-2 text-sm focus:outline-none focus:border-primary-blue"
                                />
                                <button
                                    type="submit"
                                    disabled={sending || !(text || '').trim()}
                                    aria-label="Send message"
                                    className="w-10 h-10 shrink-0 rounded-full bg-primary-blue text-white flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <SendIcon sx={{ fontSize: '18px' }} />
                                </button>
                            </form>
                        </>
                    )}
                </div>
            )}
        </>
    );
};

export default ChatWidget;
