import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import MetaData from '../Layouts/MetaData';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import SendIcon from '@mui/icons-material/Send';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import { formatDate } from '../../utils/functions';

// ── Admin chat inbox ──────────────────────────────────────────────────
// Dedicated two-pane inbox: conversation list on the left, thread on the
// right (list ⇄ thread on mobile). Both sides poll the backend so the
// visitor's messages show up live.

const FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'open', label: 'Open' },
    { key: 'unread', label: 'Unread' },
    { key: 'closed', label: 'Closed' },
];

// one-tap WhatsApp chat link for a BD phone number
const waLink = (phone, text = '') => {
    const digits = String(phone || '').replace(/\D/g, '');
    if (!digits) return '';
    const intl = digits.startsWith('880') ? digits : `88${digits.replace(/^0/, '')}`;
    return `https://wa.me/${intl}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
};

const timeOf = (dt) => new Date(dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

// today → clock time, older → date (keeps the list compact)
const whenOf = (dt) => {
    if (!dt) return '';
    const d = new Date(dt);
    if (d.toDateString() === new Date().toDateString()) return timeOf(dt);
    return formatDate(dt);
};

const initials = (name) => (name || '?').trim().charAt(0).toUpperCase();

const ChatInbox = () => {

    const { enqueueSnackbar } = useSnackbar();

    const [conversations, setConversations] = useState([]);
    const [unreadTotal, setUnreadTotal] = useState(0);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    const [activeId, setActiveId] = useState(null);
    const [active, setActive] = useState(null);
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);

    const bodyRef = useRef(null);
    const searchRef = useRef(null);

    // ── list ──
    const fetchList = useCallback(async (showLoader) => {
        if (showLoader) setLoading(true);
        try {
            const params = {};
            if (filter === 'open' || filter === 'closed') params.status = filter;
            if (filter === 'unread') params.unread = 'true';
            if (searchRef.current) params.search = searchRef.current;
            const { data } = await axios.get('/api/v1/admin/chat/conversations', {
                params, headers: { Accept: 'application/json' },
            });
            setConversations(data.conversations || []);
            setUnreadTotal(data.unreadTotal || 0);
        } catch (err) {
            if (showLoader) enqueueSnackbar(err.response?.data?.message || 'Failed to load chats', { variant: 'error' });
        } finally {
            if (showLoader) setLoading(false);
        }
    }, [filter, enqueueSnackbar]);

    // ── active thread ──
    const fetchThread = useCallback(async (id) => {
        if (!id) return;
        try {
            const { data } = await axios.get(`/api/v1/admin/chat/conversations/${id}`, {
                headers: { Accept: 'application/json' },
            });
            setActive(data.conversation);
            setMessages(data.messages || []);
        } catch (err) {
            /* transient error — the next tick retries */
        }
    }, []);

    useEffect(() => {
        fetchList(true);
    }, [fetchList]);

    // poll the list while the inbox is mounted
    useEffect(() => {
        const id = setInterval(() => fetchList(false), 5000);
        return () => clearInterval(id);
    }, [fetchList]);

    // poll the open thread faster
    useEffect(() => {
        if (!activeId) return undefined;
        fetchThread(activeId);
        const id = setInterval(() => fetchThread(activeId), 3500);
        return () => clearInterval(id);
    }, [activeId, fetchThread]);

    // keep the newest message in view
    useEffect(() => {
        if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }, [messages, activeId]);

    // debounce-free simple search: refetch as the admin types
    useEffect(() => {
        const t = setTimeout(() => {
            searchRef.current = search.trim();
            fetchList(false);
        }, 300);
        return () => clearTimeout(t);
    }, [search, fetchList]);

    const openConversation = (id) => {
        setActiveId(id);
        setActive(conversations.find((c) => c._id === id) || null);
        setMessages([]);
    };

    const backToList = () => {
        setActiveId(null);
        setActive(null);
        setMessages([]);
        fetchList(false);
    };

    const send = async (e) => {
        e?.preventDefault();
        const body = (text || '').trim();
        if (!body || sending || !activeId) return;
        setSending(true);
        try {
            const { data } = await axios.post(`/api/v1/admin/chat/conversations/${activeId}/messages`,
                { message: body },
                { headers: { 'Content-Type': 'application/json', Accept: 'application/json' } });
            setMessages((prev) => [...prev, data.message]);
            setText('');
            fetchList(false);
        } catch (err) {
            enqueueSnackbar(err.response?.data?.message || 'Failed to send reply', { variant: 'error' });
        } finally {
            setSending(false);
        }
    };

    const toggleStatus = async () => {
        if (!active) return;
        const next = active.status === 'closed' ? 'open' : 'closed';
        try {
            const { data } = await axios.put(`/api/v1/admin/chat/conversations/${active._id}/status`,
                { status: next },
                { headers: { 'Content-Type': 'application/json', Accept: 'application/json' } });
            setActive(data.conversation);
            enqueueSnackbar(next === 'closed' ? 'Conversation closed' : 'Conversation reopened', { variant: 'success' });
            fetchList(false);
        } catch (err) {
            enqueueSnackbar(err.response?.data?.message || 'Status update failed', { variant: 'error' });
        }
    };

    return (
        <>
            <MetaData title="Chat Inbox | TechBazar" />

            <div className="flex items-center justify-between gap-3 flex-wrap">
                <h1 className="text-lg sm:text-xl font-extrabold text-gray-900">Chat Inbox</h1>
                <div className="flex gap-2 items-center">
                    {unreadTotal > 0 && (
                        <span className="text-xs font-semibold bg-red-100 text-red-700 rounded-full px-2.5 py-1">
                            {unreadTotal} unread
                        </span>
                    )}
                    <button onClick={() => { searchRef.current = search.trim(); fetchList(true); }} className="text-sm font-semibold border border-gray-300 bg-white rounded-full px-4 py-2 text-gray-700 hover:bg-gray-100">Refresh</button>
                </div>
            </div>

            <div className="flex bg-white border border-line rounded-2xl overflow-hidden" style={{ minHeight: '65vh' }}>

                {/* ── conversation list ── */}
                <div className={`w-full sm:w-1/3 md:w-1/4 border-r border-line flex flex-col ${activeId ? 'hidden sm:flex' : 'flex'}`}>
                    {/* filters */}
                    <div className="flex border-b border-line">
                        {FILTERS.map((f) => (
                            <button
                                key={f.key}
                                onClick={() => setFilter(f.key)}
                                className={`flex-1 text-xs font-medium py-2.5 border-b-2 transition ${filter === f.key ? 'border-black text-black' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>

                    {/* search */}
                    <div className="p-2 border-b border-line">
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search name, phone, message..."
                            className="w-full border border-line rounded px-3 py-1.5 text-sm focus:outline-none focus:border-black"
                        />
                    </div>

                    {/* items */}
                    <div className="flex-1 overflow-y-auto">
                        {loading && conversations.length === 0 && (
                            <p className="text-sm text-slate-400 text-center py-8">Loading chats...</p>
                        )}
                        {!loading && conversations.length === 0 && (
                            <div className="flex flex-col items-center gap-2 text-slate-400 py-12 px-4 text-center">
                                <ForumOutlinedIcon />
                                <p className="text-sm">No chats yet</p>
                                <p className="text-xs">Messages sent from the live chat widget on the site will appear here.</p>
                            </div>
                        )}
                        {conversations.map((c) => (
                            <button
                                key={c._id}
                                onClick={() => openConversation(c._id)}
                                className={`w-full text-left flex gap-3 px-3 py-3 border-b border-line transition ${
                                    activeId === c._id ? 'bg-gray-100' : 'hover:bg-gray-50'
                                }`}
                            >
                                <span className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold ${
                                    c.status === 'closed' ? 'bg-gray-200 text-gray-500' : 'bg-black text-white'
                                }`}>
                                    {initials(c.name)}
                                </span>
                                <span className="flex-1 min-w-0">
                                    <span className="flex items-center gap-2">
                                        <span className="font-medium text-sm truncate">{c.name}</span>
                                        {c.unreadAdmin > 0 && (
                                            <span className="shrink-0 min-w-[18px] h-[18px] px-1 text-xxs font-bold text-white bg-red-500 rounded-full flex items-center justify-center">
                                                {c.unreadAdmin}
                                            </span>
                                        )}
                                        <span className="ml-auto shrink-0 text-xxs text-slate-400">{whenOf(c.lastMessageAt)}</span>
                                    </span>
                                    <span className="block text-xs text-slate-500 truncate">{c.lastMessage || '—'}</span>
                                    <span className="flex items-center gap-2 mt-1">
                                        <span className={`text-xxs px-1.5 py-0.5 rounded ${c.status === 'closed' ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-700'}`}>
                                            {c.status === 'closed' ? 'Closed' : 'Open'}
                                        </span>
                                        {c.phone && <span className="text-xxs text-slate-400">{c.phone}</span>}
                                    </span>
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── thread ── */}
                <div className={`flex-1 flex-col min-w-0 ${activeId ? 'flex' : 'hidden sm:flex'}`}>
                    {!activeId ? (
                        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-slate-400 p-6 text-center">
                            <ForumOutlinedIcon sx={{ fontSize: '40px' }} />
<p className="text-sm font-medium text-slate-500">Select a conversation</p>
                                <p className="text-xs">Open a chat from the list</p>
                        </div>
                    ) : (
                        <>
                            {/* thread header */}
                            <div className="flex items-center gap-3 px-3 sm:px-4 py-3 border-b border-line bg-white">
                                <button onClick={backToList} aria-label="Back to list" className="sm:hidden p-1.5 rounded hover:bg-gray-100">
                                    <ArrowBackIcon sx={{ fontSize: '20px' }} />
                                </button>
                                <span className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold ${
                                    active?.status === 'closed' ? 'bg-gray-200 text-gray-500' : 'bg-black text-white'
                                }`}>
                                    {initials(active?.name)}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="font-medium text-sm truncate">{active?.name}</p>
                                    <p className="text-xs text-slate-500 truncate">
                                        {[active?.phone, active?.email].filter(Boolean).join(' · ') || 'Guest visitor'}
                                        {active?.createdAt && <> · joined {formatDate(active.createdAt)}</>}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    {active?.phone && (
                                        <a
                                            href={waLink(active.phone)}
                                            target="_blank"
                                            rel="noreferrer"
                                            title="Message on WhatsApp"
                                            className="hidden sm:flex items-center gap-1 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded px-2.5 py-1.5"
                                        >
                                            <WhatsAppIcon sx={{ fontSize: '15px' }} /> WhatsApp
                                        </a>
                                    )}
                                    <button
                                        onClick={toggleStatus}
                                        className={`text-xs font-medium border rounded px-2.5 py-1.5 ${
                                            active?.status === 'closed'
                                                ? 'border-green-300 text-green-700 hover:bg-green-50'
                                                : 'border-gray-300 text-slate-600 hover:bg-gray-100'
                                        }`}
                                    >
                                        {active?.status === 'closed' ? 'Reopen' : 'Close'}
                                    </button>
                                </div>
                            </div>

                            {/* messages */}
                            <div ref={bodyRef} className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 flex flex-col gap-2 bg-cloud">
                                {messages.map((msg) => (
                                    <div
                                        key={msg._id}
                                        className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm break-words ${
                                            msg.sender === 'admin'
                                                ? 'self-end bg-black text-white rounded-br-sm'
                                                : 'self-start bg-white text-slate-700 border border-line rounded-bl-sm'
                                        }`}
                                    >
                                        <p className="whitespace-pre-wrap">{msg.message}</p>
                                        <span className={`block text-xxs mt-1 text-right ${msg.sender === 'admin' ? 'text-gray-400' : 'text-slate-400'}`}>
                                            {msg.sender === 'admin' ? 'You' : active?.name} · {timeOf(msg.createdAt)}
                                        </span>
                                    </div>
                                ))}
                                {messages.length === 0 && (
                                    <p className="self-center text-xs text-slate-400">No messages yet</p>
                                )}
                            </div>

                            {/* composer */}
                            <form onSubmit={send} className="flex items-center gap-2 p-2.5 border-t border-line bg-white">
                                <input
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    placeholder="Type a reply..."
                                    maxLength={2000}
                                    className="flex-1 border border-line rounded-full px-4 py-2 text-sm focus:outline-none focus:border-black"
                                />
                                <button
                                    type="submit"
                                    disabled={sending || !(text || '').trim()}
                                    aria-label="Send reply"
                                    className="w-10 h-10 shrink-0 rounded-full bg-black text-white flex items-center justify-center hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <SendIcon sx={{ fontSize: '18px' }} />
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

export default ChatInbox;
