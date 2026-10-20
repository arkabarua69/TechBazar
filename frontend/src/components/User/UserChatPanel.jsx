import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useSnackbar } from 'notistack';

import SendIcon from '@mui/icons-material/Send';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import { DEFAULT_SITE_CONFIG } from '../../utils/siteConfig';
import { useSiteConfig } from '../../context/SiteConfigContext';

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

const timeOf = (dt) => new Date(dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const waLink = (phone, text = '') => {
    const digits = String(phone || '').replace(/\D/g, '');
    if (!digits) return '';
    const intl = digits.startsWith('880') ? digits : `88${digits.replace(/^0/, '')}`;
    return `https://wa.me/${intl}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
};

// Day label used for the "Today / Yesterday / 12 Mar" separators.
const dayLabel = (dt) => {
    const d = new Date(dt);
    const today = new Date();
    const yest = new Date();
    yest.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yest.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
};

// Faint dotted wallpaper — the classic messenger backdrop.
const WALLPAPER = {
    backgroundColor: 'var(--color-bg)',
    backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.055) 1px, transparent 0)',
    backgroundSize: '16px 16px',
};

const FRAME = {
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--card-radius)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    overflow: 'hidden',
};

// Embedded chat panel for the Account → My Chats tab. Reuses the same backend
// conversation as the floating widget (keyed by the browser's visitorId), so
// messages sent here and in the widget stay in sync.
// Laid out like a real messenger window: header → scrolling thread → composer.
const UserChatPanel = () => {
    const { enqueueSnackbar } = useSnackbar();
    const { config } = useSiteConfig();
    const support = config?.support || DEFAULT_SITE_CONFIG.support;

    const [conversation, setConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);
    const [starting, setStarting] = useState(false);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');

    const visitorIdRef = useRef(null);
    const bodyRef = useRef(null);
    if (visitorIdRef.current === null) visitorIdRef.current = getVisitorId();

    const loadChat = useCallback(async () => {
        const visitorId = visitorIdRef.current;
        if (!visitorId) return;
        try {
            const { data } = await axios.get('/api/v1/chat/conversation', {
                params: { visitorId, markRead: 'true' },
                headers: { Accept: 'application/json' },
            });
            setConversation(data.conversation || null);
            setMessages(data.messages || []);
        } catch (err) { /* transient */ }
    }, []);

    useEffect(() => {
        loadChat();
        const id = setInterval(loadChat, 4000);
        return () => clearInterval(id);
    }, [loadChat]);

    // keep the newest message in view
    useEffect(() => {
        const el = bodyRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [messages]);

    const startChat = async (e) => {
        e?.preventDefault();
        const finalName = (name || '').trim();
        if (!finalName) return;
        setStarting(true);
        try {
            const { data } = await axios.post('/api/v1/chat/conversation', {
                visitorId: visitorIdRef.current,
                name: finalName,
                phone: (phone || '').trim(),
                email: '',
            }, { headers: { 'Content-Type': 'application/json', Accept: 'application/json' } });
            setConversation(data.conversation);
            setMessages(data.messages || []);
        } catch (err) {
            enqueueSnackbar('Could not start the chat', { variant: 'error' });
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
            setConversation((prev) => prev && ({ ...prev, lastMessage: body, lastMessageAt: new Date().toISOString(), status: 'open' }));
            setText('');
        } catch (err) {
            enqueueSnackbar('Message not sent', { variant: 'error' });
        } finally {
            setSending(false);
        }
    };

    const waHref = support?.whatsapp ? waLink(support.whatsapp, config?.chat?.welcomeMessage || DEFAULT_SITE_CONFIG.chat.welcomeMessage) : '';
    const closed = conversation?.status === 'closed';

    // ── header of the chat window (shared by both states) ──────────────
    const Header = (
        <div
            className="flex items-center gap-3 px-3 sm:px-4 py-2.5 shrink-0"
            style={{ backgroundColor: 'var(--color-accent)', color: '#fff' }}
        >
            <span className="relative w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <SupportAgentIcon sx={{ fontSize: 22 }} />
                <span className="absolute -right-0.5 -bottom-0.5 w-3 h-3 rounded-full bg-green-400 border-2" style={{ borderColor: 'var(--color-accent)' }} />
            </span>
            <div className="min-w-0 flex-1 leading-tight">
                <p className="text-[13px] font-bold truncate">Support Team</p>
                <p className="text-[11px] text-white/85 truncate">
                    {conversation ? (closed ? 'Conversation closed' : 'Online · replies in minutes') : 'Online · replies in minutes'}
                </p>
            </div>
            {waHref && (
                <a
                    href={waHref}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Chat on WhatsApp"
                    className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0 transition hover:bg-white/30 active:scale-95"
                >
                    <WhatsAppIcon sx={{ fontSize: 19 }} />
                </a>
            )}
        </div>
    );

    // ── start state: a welcome bubble + the details form ──────────────
    if (!conversation) {
        return (
            <div className="flex flex-col" style={{ ...FRAME, height: 'clamp(360px, 62dvh, 540px)' }}>
                {Header}

                <div ref={bodyRef} className="flex-1 min-h-0 overflow-y-auto px-3 py-4 flex flex-col gap-2" style={WALLPAPER}>
                    {/* welcome bubble */}
                    <div className="flex items-end gap-2 self-start max-w-[85%]">
                        <span className="w-7 h-7 rounded-full bg-white/70 flex items-center justify-center shrink-0 mb-0.5">
                            <SupportAgentIcon sx={{ fontSize: 15, color: 'var(--color-accent)' }} />
                        </span>
                        <div
                            className="px-3 py-2 rounded-2xl rounded-bl-md text-[13px] leading-relaxed shadow-sm"
                            style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
                        >
                            <p>Hi there! Tell us your name and we will start the chat right away.</p>
                            <span className="block text-[10px] mt-1 text-right" style={{ color: 'var(--color-text-muted)' }}>Support</span>
                        </div>
                    </div>

                    <form onSubmit={startChat} className="mt-2 flex flex-col gap-2.5 p-3 shrink-0" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '1rem' }}>
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Your name *"
                                maxLength={80}
                                className="w-full px-3 py-2.5 text-sm rounded-xl outline-none transition-all duration-150"
                                style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
                                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(232,75,15,0.12)'; }}
                                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.boxShadow = 'none'; }}
                            />
                            <input
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="Mobile number (optional)"
                                maxLength={20}
                                className="w-full px-3 py-2.5 text-sm rounded-xl outline-none transition-all duration-150"
                                style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
                                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(232,75,15,0.12)'; }}
                                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.boxShadow = 'none'; }}
                            />
                            <div className="flex items-center gap-2">
                                <button
                                    type="submit"
                                    disabled={starting || !(name || '').trim()}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{ backgroundColor: 'var(--color-accent)', boxShadow: '0 4px 12px rgba(232,75,15,0.25)' }}
                                >
                                    <SendIcon sx={{ fontSize: 16 }} />
                                    {starting ? 'Starting…' : 'Start Chat'}
                                </button>
                                {waHref && (
                                    <a
                                        href={waHref}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-all duration-200"
                                        style={{ backgroundColor: '#25D366', boxShadow: '0 4px 12px rgba(37,211,102,0.25)' }}
                                    >
                                        <WhatsAppIcon sx={{ fontSize: 16 }} />
                                        WhatsApp
                                    </a>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    // ── live conversation ─────────────────────────────────────────────
    let lastDay = '';

    return (
        <div className="flex flex-col" style={FRAME}>
            {Header}

            {closed && (
                <div className="px-3 py-1.5 text-center text-[11px] font-semibold" style={{ backgroundColor: 'var(--color-accent-light)', color: 'var(--color-accent)', borderBottom: '1px solid var(--color-border)' }}>
                    This conversation has been closed. Send a message to reopen it.
                </div>
            )}

            {/* thread */}
            <div
                ref={bodyRef}
                className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-1.5"
                style={{ ...WALLPAPER, height: 'clamp(340px, 58dvh, 520px)' }}
            >
                {messages.map((msg) => {
                    const mine = msg.sender === 'visitor';
                    const day = dayLabel(msg.createdAt);
                    const showDay = day !== lastDay;
                    lastDay = day;

                    return (
                        <div key={msg._id}>
                            {showDay && (
                                <div className="flex justify-center my-2.5">
                                    <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full shadow-sm" style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>
                                        {day}
                                    </span>
                                </div>
                            )}

                            <div className={`flex items-end gap-2 ${mine ? 'justify-end' : 'justify-start'}`}>
                                {!mine && (
                                    <span className="w-7 h-7 rounded-full bg-white/70 flex items-center justify-center shrink-0">
                                        <SupportAgentIcon sx={{ fontSize: 15, color: 'var(--color-accent)' }} />
                                    </span>
                                )}
                                <div
                                    className={`max-w-[78%] px-3 py-2 rounded-2xl text-[13px] leading-relaxed break-words shadow-sm ${mine ? 'rounded-br-md' : 'rounded-bl-md'}`}
                                    style={mine
                                        ? { backgroundColor: 'var(--color-accent)', color: '#fff' }
                                        : { backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
                                >
                                    <p className="whitespace-pre-wrap">{msg.message}</p>
                                    <span className="flex items-center justify-end gap-1 text-[10px] mt-1" style={{ color: mine ? 'rgba(255,255,255,0.8)' : 'var(--color-text-muted)' }}>
                                        {timeOf(msg.createdAt)}
                                        {mine && <DoneAllIcon sx={{ fontSize: 13 }} />}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {messages.length === 0 && (
                    <p className="self-center text-xs mt-6" style={{ color: 'var(--color-text-muted)' }}>No messages yet — say hello</p>
                )}
            </div>

            {/* composer */}
            <form
                onSubmit={send}
                className="flex items-center gap-2 px-2.5 py-2 shrink-0"
                style={{ backgroundColor: 'var(--color-surface)', borderTop: '1px solid var(--color-border)', paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))' }}
            >
                <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Type a message..."
                    maxLength={2000}
                    aria-label="Type a message"
                    className="flex-1 min-w-0 px-4 py-2.5 text-sm rounded-full outline-none transition-all duration-150"
                    style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-primary)' }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(232,75,15,0.12)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.boxShadow = 'none'; }}
                />
                <button
                    type="submit"
                    disabled={sending || !(text || '').trim()}
                    aria-label="Send message"
                    className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ backgroundColor: 'var(--color-accent)', color: '#fff', boxShadow: '0 4px 12px rgba(232,75,15,0.25)' }}
                    onMouseEnter={(e) => { if (!sending && (text || '').trim()) { e.currentTarget.style.backgroundColor = 'var(--color-accent-hover)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-accent)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                    <SendIcon sx={{ fontSize: 18 }} />
                </button>
            </form>
        </div>
    );
};

export default UserChatPanel;
