import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useSnackbar } from 'notistack';

import SendIcon from '@mui/icons-material/Send';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import CancelIcon from '@mui/icons-material/Cancel';
import { DEFAULT_SITE_CONFIG } from '../../utils/siteConfig';
import { useSiteConfig } from '../../context/SiteConfigContext';

const CATEGORIES = [
    { key: 'general', label: 'General' },
    { key: 'order', label: 'Order' },
    { key: 'payment', label: 'Payment' },
    { key: 'product', label: 'Product' },
    { key: 'other', label: 'Other' },
];

const statusMeta = (status) => {
    if (status === 'closed') return { label: 'Closed', color: '#6b7280', bg: '#f3f4f6', icon: <CancelIcon sx={{ fontSize: 14 }} /> };
    if (status === 'pending') return { label: 'Pending', color: '#b45309', bg: '#fef3c7', icon: <HourglassTopIcon sx={{ fontSize: 14 }} /> };
    return { label: 'Open', color: '#16a34a', bg: '#dcfce7', icon: <CheckCircleIcon sx={{ fontSize: 14 }} /> };
};

const timeOf = (dt) => new Date(dt).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

// Ticket-based support panel for the Account → My Chats tab.
// Replaces the live chat box with a ticket system: create tickets, view the
// reply thread, reply back, and track status.
const TicketPanel = () => {
    const { enqueueSnackbar } = useSnackbar();
    const { config } = useSiteConfig();
    const support = config?.support || DEFAULT_SITE_CONFIG.support;

    const [view, setView] = useState('list'); // 'list' | 'create' | 'detail'
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [active, setActive] = useState(null); // ticket
    const [replies, setReplies] = useState([]);
    const [replyText, setReplyText] = useState('');
    const [sending, setSending] = useState(false);
    const [creating, setCreating] = useState(false);

    // create form
    const [subject, setSubject] = useState('');
    const [category, setCategory] = useState('general');
    const [priority, setPriority] = useState('medium');
    const [message, setMessage] = useState('');

    const bodyRef = useRef(null);

    const loadTickets = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await axios.get('/api/v1/tickets', { headers: { Accept: 'application/json' } });
            setTickets(data.tickets || []);
        } catch (err) {
            enqueueSnackbar('Could not load tickets', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    }, [enqueueSnackbar]);

    useEffect(() => {
        if (view === 'list') loadTickets();
    }, [view, loadTickets]);

    useEffect(() => {
        if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }, [replies]);

    const openTicket = async (t) => {
        setActive(t);
        setView('detail');
        try {
            const { data } = await axios.get(`/api/v1/tickets/${t._id}`, { headers: { Accept: 'application/json' } });
            setActive(data.ticket);
            setReplies(data.replies || []);
        } catch (err) {
            enqueueSnackbar('Could not load ticket', { variant: 'error' });
        }
    };

    const createTicket = async (e) => {
        e?.preventDefault();
        if (!subject.trim() || !message.trim()) return;
        setCreating(true);
        try {
            const { data } = await axios.post('/api/v1/tickets', {
                subject: subject.trim(),
                message: message.trim(),
                category,
                priority,
            }, { headers: { 'Content-Type': 'application/json', Accept: 'application/json' } });
            setSubject(''); setMessage(''); setCategory('general'); setPriority('medium');
            await openTicket(data.ticket);
        } catch (err) {
            enqueueSnackbar('Could not create ticket', { variant: 'error' });
        } finally {
            setCreating(false);
        }
    };

    const sendReply = async (e) => {
        e?.preventDefault();
        const body = replyText.trim();
        if (!body || sending) return;
        setSending(true);
        try {
            const { data } = await axios.post(`/api/v1/tickets/${active._id}/replies`, { message: body }, { headers: { 'Content-Type': 'application/json', Accept: 'application/json' } });
            setReplies((prev) => [...prev, data.reply]);
            setReplyText('');
            // refresh ticket status
            const { data: d } = await axios.get(`/api/v1/tickets/${active._id}`, { headers: { Accept: 'application/json' } });
            setActive(d.ticket);
        } catch (err) {
            enqueueSnackbar('Reply not sent', { variant: 'error' });
        } finally {
            setSending(false);
        }
    };

    const closeTicket = async () => {
        try {
            await axios.put(`/api/v1/admin/tickets/${active._id}/status`, { status: 'closed' }, { headers: { 'Content-Type': 'application/json', Accept: 'application/json' } });
        } catch (err) {
            // user can't close via admin route; ignore — admin handles closing
        }
        setView('list');
    };

    // ── List view ──────────────────────────────────────────────────────
    if (view === 'list') {
        return (
            <div className="flex flex-col gap-3 pt-3">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-sm" style={{ color: 'var(--color-text-primary)' }}>Support Tickets</h3>
                        <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>Track your support requests</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setView('create')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white transition-all duration-200"
                        style={{ backgroundColor: 'var(--color-accent)', boxShadow: '0 4px 12px rgba(232,75,15,0.25)' }}
                    >
                        <AddIcon sx={{ fontSize: 16 }} />
                        New Ticket
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-8 text-xs" style={{ color: 'var(--color-text-muted)' }}>Loading tickets…</div>
                ) : tickets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                        <SupportAgentIcon sx={{ fontSize: '2.5rem', color: 'var(--color-text-muted)' }} />
                        <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>No tickets yet</p>
                        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Create a ticket and our support team will reply.</p>
                        {support?.whatsapp && (
                            <a
                                href={`https://wa.me/${String(support.whatsapp).replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white mt-2"
                                style={{ backgroundColor: '#25D366' }}
                            >
                                WhatsApp
                            </a>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        {tickets.map((t) => {
                            const m = statusMeta(t.status);
                            return (
                                <button
                                    key={t._id}
                                    type="button"
                                    onClick={() => openTicket(t)}
                                    className="w-full text-left p-3.5 transition-all duration-150"
                                    style={{
                                        backgroundColor: 'var(--color-surface)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: '0',
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-accent-light)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-surface)'; }}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="text-sm font-semibold truncate flex-1" style={{ color: 'var(--color-text-primary)' }}>{t.subject}</p>
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0" style={{ backgroundColor: m.bg, color: m.color }}>
                                            {m.icon} {m.label}
                                        </span>
                                    </div>
                                    <p className="text-[11px] mt-1 truncate" style={{ color: 'var(--color-text-muted)' }}>
                                        {t.category} · {timeOf(t.lastReplyAt || t.createdAt)}
                                    </p>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }

    // ── Create view ────────────────────────────────────────────────────
    if (view === 'create') {
        return (
            <div className="flex flex-col gap-3 pt-3">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setView('list')}
                        className="w-8 h-8 rounded-full flex items-center justify-center transition active:scale-90"
                        style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text-secondary)' }}
                    >
                        <ArrowBackIosNewIcon sx={{ fontSize: 16 }} />
                    </button>
                    <h3 className="font-bold text-sm" style={{ color: 'var(--color-text-primary)' }}>New Ticket</h3>
                </div>

                <form onSubmit={createTicket} className="flex flex-col gap-3">
                    <input
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Subject *"
                        maxLength={120}
                        required
                        className="w-full px-3 py-2.5 text-sm rounded-lg outline-none transition-all duration-150"
                        style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(232,75,15,0.12)'; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.boxShadow = 'none'; }}
                    />

                    <div className="flex gap-2">
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="flex-1 px-3 py-2.5 text-sm rounded-lg outline-none"
                            style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
                        >
                            {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                        </select>
                        <select
                            value={priority}
                            onChange={(e) => setPriority(e.target.value)}
                            className="flex-1 px-3 py-2.5 text-sm rounded-lg outline-none"
                            style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>

                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Describe your issue *"
                        maxLength={2000}
                        required
                        rows={5}
                        className="w-full px-3 py-2.5 text-sm rounded-lg outline-none transition-all duration-150 resize-none"
                        style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(232,75,15,0.12)'; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.boxShadow = 'none'; }}
                    />

                    <div className="flex items-center gap-2">
                        <button
                            type="submit"
                            disabled={creating || !subject.trim() || !message.trim()}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ backgroundColor: 'var(--color-accent)', boxShadow: '0 4px 12px rgba(232,75,15,0.25)' }}
                        >
                            <SendIcon sx={{ fontSize: 16 }} />
                            {creating ? 'Submitting…' : 'Submit Ticket'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setView('list')}
                            className="px-4 py-2.5 rounded-xl text-xs font-bold border transition-all duration-200"
                            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-surface)' }}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    // ── Detail view ─────────────────────────────────────────────────────
    const m = statusMeta(active?.status);
    return (
        <div className="flex flex-col gap-3 pt-3">
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => { setView('list'); setActive(null); setReplies([]); }}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition active:scale-90"
                    style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text-secondary)' }}
                >
                    <ArrowBackIosNewIcon sx={{ fontSize: 16 }} />
                </button>
                <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-sm truncate" style={{ color: 'var(--color-text-primary)' }}>{active?.subject}</h3>
                    <p className="text-[11px] truncate" style={{ color: 'var(--color-text-muted)' }}>
                        {active?.category} · {timeOf(active?.createdAt)}
                    </p>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0" style={{ backgroundColor: m.bg, color: m.color }}>
                    {m.icon} {m.label}
                </span>
            </div>

            {/* thread */}
            <div
                ref={bodyRef}
                className="flex flex-col gap-2 overflow-y-auto px-1 py-2"
                style={{ maxHeight: '360px' }}
            >
                {replies.map((r) => {
                    const mine = r.sender === 'user';
                    return (
                        <div key={r._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                            <div
                                className="max-w-[85%] px-3 py-2 text-[13px] leading-relaxed break-words"
                                style={mine
                                    ? { backgroundColor: 'var(--color-accent)', color: '#fff', borderRadius: '12px 12px 4px 12px' }
                                    : { backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', borderRadius: '12px 12px 12px 4px' }}
                            >
                                <p className="whitespace-pre-wrap">{r.message}</p>
                                <span className="block text-[10px] mt-1 text-right" style={{ color: mine ? 'rgba(255,255,255,0.8)' : 'var(--color-text-muted)' }}>
                                    {r.senderName || (mine ? 'You' : 'Support')} · {timeOf(r.createdAt)}
                                </span>
                            </div>
                        </div>
                    );
                })}
                {replies.length === 0 && (
                    <p className="text-xs text-center py-4" style={{ color: 'var(--color-text-muted)' }}>No replies yet</p>
                )}
            </div>

            {/* reply composer (only if not closed) */}
            {active?.status !== 'closed' ? (
                <form onSubmit={sendReply} className="flex items-center gap-2 pt-2" style={{ borderTop: '1px solid var(--color-border)' }}>
                    <input
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Reply…"
                        maxLength={2000}
                        className="flex-1 min-w-0 px-3 py-2.5 text-sm rounded-lg outline-none transition-all duration-150"
                        style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(232,75,15,0.12)'; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.boxShadow = 'none'; }}
                    />
                    <button
                        type="submit"
                        disabled={sending || !replyText.trim()}
                        aria-label="Send reply"
                        className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{ backgroundColor: 'var(--color-accent)', color: '#fff', boxShadow: '0 4px 12px rgba(232,75,15,0.25)' }}
                    >
                        <SendIcon sx={{ fontSize: 18 }} />
                    </button>
                </form>
            ) : (
                <p className="text-xs text-center py-2" style={{ color: 'var(--color-text-muted)' }}>This ticket is closed.</p>
            )}
        </div>
    );
};

export default TicketPanel;
