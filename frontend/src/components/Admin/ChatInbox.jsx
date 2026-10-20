import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import MetaData from '../Layouts/MetaData';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import SendIcon from '@mui/icons-material/Send';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import { formatDate } from '../../utils/functions';
import { MessageSquare, Search, RefreshCw, X } from 'lucide-react';

const FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'open', label: 'Open' },
    { key: 'unread', label: 'Unread' },
    { key: 'closed', label: 'Closed' },
];

const waLink = (phone, text = '') => {
    const digits = String(phone || '').replace(/\D/g, '');
    if (!digits) return '';
    const intl = digits.startsWith('880') ? digits : `88${digits.replace(/^0/, '')}`;
    return `https://wa.me/${intl}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
};

const timeOf = (dt) => new Date(dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

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

    const fetchThread = useCallback(async (id) => {
        if (!id) return;
        try {
            const { data } = await axios.get(`/api/v1/admin/chat/conversations/${id}`, {
                headers: { Accept: 'application/json' },
            });
            setActive(data.conversation);
            setMessages(data.messages || []);
        } catch (err) { /* transient */ }
    }, []);

    useEffect(() => { fetchList(true); }, [fetchList]);

    useEffect(() => {
        const id = setInterval(() => fetchList(false), 5000);
        return () => clearInterval(id);
    }, [fetchList]);

    useEffect(() => {
        if (!activeId) return undefined;
        fetchThread(activeId);
        const id = setInterval(() => fetchThread(activeId), 3500);
        return () => clearInterval(id);
    }, [activeId, fetchThread]);

    useEffect(() => {
        if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }, [messages, activeId]);

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

    const closeChat = () => {
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
            <MetaData title="Chat Inbox" />

            <div className="flex flex-col gap-4">
                {/* ── Header ── */}
                <div className="flex justify-between items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                        <span className="w-11 h-11 rounded-2xl bg-[#E84B0F]/10 text-[#E84B0F] flex items-center justify-center shrink-0">
                            <MessageSquare size={22} strokeWidth={2} />
                        </span>
                        <div>
                            <h1 className="text-lg sm:text-xl font-extrabold text-gray-900 leading-tight">Chat Inbox</h1>
                            <p className="text-xs text-gray-500">
                                {unreadTotal > 0
                                    ? `${unreadTotal} unread message${unreadTotal === 1 ? '' : 's'}`
                                    : 'Live conversations from your storefront'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => { searchRef.current = search.trim(); fetchList(true); }}
                        className="flex items-center gap-1.5 text-sm font-semibold border border-gray-300 bg-white rounded-full px-3.5 py-2 text-gray-700 hover:bg-gray-100 shrink-0"
                    >
                        <RefreshCw size={15} /> <span className="hidden sm:inline">Refresh</span>
                    </button>
                </div>

                {/* ── Filters + search ── */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex gap-1 bg-gray-100 rounded-full p-1 shrink-0">
                        {FILTERS.map((f) => (
                            <button
                                key={f.key}
                                onClick={() => setFilter(f.key)}
                                className={`flex-1 sm:flex-none text-xs font-bold px-3 py-1.5 rounded-full transition ${filter === f.key ? 'bg-[#E84B0F] text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                    <div className="relative flex-1">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search name, phone, message..."
                            className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#E84B0F]/30 focus:border-[#E84B0F]/40 shadow-sm"
                        />
                    </div>
                </div>

                {/* ── Conversation cards ── */}
                {loading && conversations.length === 0 && (
                    <p className="text-sm text-slate-400 text-center py-8">Loading chats...</p>
                )}
                {!loading && conversations.length === 0 && (
                    <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-8 text-center text-gray-400 text-sm">
                        <ForumOutlinedIcon sx={{ fontSize: '32px' }} className="mb-2" />
                        <p>No chats yet</p>
                        <p className="text-xs mt-1">Messages sent from the live chat widget on the site will appear here.</p>
                    </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                    {conversations.map((c) => (
                        <article
                            key={c._id}
                            onClick={() => openConversation(c._id)}
                            className="group bg-white rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md hover:border-gray-300 overflow-hidden ring-1 ring-black/[0.02] transition-all cursor-pointer flex"
                        >
                            {/* LEFT: avatar + unread red dot */}
                            <div className="shrink-0 w-[28%] max-w-[96px] min-w-[72px] bg-gradient-to-br from-gray-50 to-white border-r border-gray-100 flex items-center justify-center p-3 relative">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold text-white shadow-sm ${c.status === 'closed' ? 'bg-gray-400' : 'bg-[#E84B0F]'}`}>
                                    {initials(c.name)}
                                </div>
                                {c.unreadAdmin > 0 && (
                                    <span className="absolute top-2 right-2 min-w-[20px] h-5 px-1.5 text-[11px] font-bold text-white bg-red-500 rounded-full flex items-center justify-center shadow ring-2 ring-white">
                                        {c.unreadAdmin > 9 ? '9+' : c.unreadAdmin}
                                    </span>
                                )}
                            </div>

                            {/* RIGHT: details */}
                            <div className="flex flex-col flex-1 min-w-0 p-3 gap-1">
                                <div className="flex items-center gap-2 min-w-0">
                                    <p className="font-semibold text-gray-900 text-sm truncate flex-1">{c.name || 'Guest'}</p>
                                    <span className="text-[10px] text-gray-400 shrink-0">{whenOf(c.lastMessageAt)}</span>
                                </div>
                                <p className="text-xs text-gray-500 truncate">{c.lastMessage || '—'}</p>
                                <div className="flex items-center gap-2 mt-auto pt-1 flex-wrap">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.status === 'closed' ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-700'}`}>
                                        {c.status === 'closed' ? 'Closed' : 'Open'}
                                    </span>
                                    {c.phone && <span className="text-[10px] text-gray-400 truncate">{c.phone}</span>}
                                    {c.unreadAdmin > 0 && (
                                        <span className="ml-auto text-[10px] font-bold text-red-600">New message</span>
                                    )}
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            </div>

            {/* ── Messenger-style chat window ── */}
            {activeId && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4">
                    <div className="w-full h-[100dvh] sm:h-[85vh] sm:max-w-lg bg-white sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden ring-1 ring-black/5">
                        {/* header */}
                        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white">
                            <button onClick={closeChat} aria-label="Close chat" className="p-1.5 rounded-full hover:bg-gray-100 transition">
                                <X size={20} className="text-gray-600" />
                            </button>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 ${active?.status === 'closed' ? 'bg-gray-400' : 'bg-[#E84B0F]'}`}>
                                {initials(active?.name)}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="font-bold text-gray-900 text-sm truncate">{active?.name || 'Guest'}</p>
                                <p className="text-xs text-gray-500 truncate">
                                    {[active?.phone, active?.email].filter(Boolean).join(' · ') || 'Guest visitor'}
                                </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                {active?.phone && (
                                    <a
                                        href={waLink(active.phone)}
                                        target="_blank"
                                        rel="noreferrer"
                                        title="Message on WhatsApp"
                                        className="flex items-center gap-1 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded-full px-3 py-1.5 transition"
                                    >
                                        <WhatsAppIcon sx={{ fontSize: '14px' }} /> WhatsApp
                                    </a>
                                )}
                                <button
                                    onClick={toggleStatus}
                                    className={`text-xs font-medium border rounded-full px-3 py-1.5 transition ${
                                        active?.status === 'closed'
                                            ? 'border-green-300 text-green-700 hover:bg-green-50'
                                            : 'border-gray-300 text-gray-600 hover:bg-gray-100'
                                    }`}
                                >
                                    {active?.status === 'closed' ? 'Reopen' : 'Close'}
                                </button>
                            </div>
                        </div>

                        {/* messages */}
                        <div ref={bodyRef} className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2 bg-gray-50">
                            {messages.map((msg) => (
                                <div
                                    key={msg._id}
                                    className={`max-w-[80%] px-3.5 py-2 rounded-2xl text-sm break-words shadow-sm ${
                                        msg.sender === 'admin'
                                            ? 'self-end bg-[#E84B0F] text-white rounded-br-sm'
                                            : 'self-start bg-white text-gray-700 border border-gray-100 rounded-bl-sm'
                                    }`}
                                >
                                    <p className="whitespace-pre-wrap">{msg.message}</p>
                                    <span className={`block text-[10px] mt-1 text-right ${msg.sender === 'admin' ? 'text-white/70' : 'text-gray-400'}`}>
                                        {msg.sender === 'admin' ? 'You' : active?.name} · {timeOf(msg.createdAt)}
                                    </span>
                                </div>
                            ))}
                            {messages.length === 0 && (
                                <p className="self-center text-xs text-gray-400 mt-8">No messages yet</p>
                            )}
                        </div>

                        {/* composer */}
                        <form onSubmit={send} className="flex items-center gap-2 p-3 border-t border-gray-100 bg-white">
                            <input
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="Type a reply..."
                                maxLength={2000}
                                autoFocus
                                className="flex-1 border border-gray-200 rounded-full px-4 py-2.5 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#E84B0F]/30 focus:border-[#E84B0F]/40 transition"
                            />
                            <button
                                type="submit"
                                disabled={sending || !(text || '').trim()}
                                aria-label="Send reply"
                                className="w-11 h-11 shrink-0 rounded-full bg-[#E84B0F] text-white flex items-center justify-center hover:bg-[#C63E0A] disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
                            >
                                <SendIcon sx={{ fontSize: '18px' }} />
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default ChatInbox;
