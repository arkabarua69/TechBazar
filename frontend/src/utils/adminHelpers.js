// Small helpers for the mobile admin app UX (merchant-app style cards, badges, alerts).

// 12345 → '১২৩৪৫'
export const bn = (value) => String(value).replace(/[0-9]/g, (d) => '০১২৩৪৫৬৭৮৯'[d]);

// Stable human order id: TB-1082 style (last 4 chars of Mongo ObjectId)
export const shortOrderId = (id) => `TB-${String(id || '').slice(-4).toUpperCase()}`;

// '৩ মিনিট আগে' / '৫ ঘণ্টা আগে' / '২ দিন আগে'
export const timeAgoBn = (date) => {
    const then = new Date(date).getTime();
    if (Number.isNaN(then)) return '';
    const secs = Math.max(0, Math.floor((Date.now() - then) / 1000));
    if (secs < 60) return 'এইমাত্র';
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${bn(mins)} মিনিট আগে`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${bn(hours)} ঘণ্টা আগে`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${bn(days)} দিন আগে`;
    return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

// One-tap copy (mobile-safe) → returns true on success
export const copyText = async (text) => {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            return true;
        }
        // http:// fallback (local dev)
        const el = document.createElement('textarea');
        el.value = text;
        el.style.position = 'fixed';
        el.style.opacity = '0';
        document.body.appendChild(el);
        el.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(el);
        return ok;
    } catch (e) {
        return false;
    }
};

// New-order alert: short beep + vibration (best-effort; silent if blocked)
export const alertPulse = () => {
    try {
        if (navigator.vibrate) navigator.vibrate([90, 40, 90]);
    } catch (e) { /* ignore */ }
    try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;
        const ctx = new Ctx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.setValueAtTime(1180, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.36);
        osc.onended = () => ctx.close();
    } catch (e) { /* ignore */ }
};

// Shared event names (AppBar ↔ BottomNav ↔ pages, no redux/context plumbing)
export const ORDERS_ALERT_EVENT = 'tb:orders-alert'; // detail: { unseen, pendingVerify }
export const emitOrdersAlert = (detail) => {
    try {
        window.dispatchEvent(new CustomEvent(ORDERS_ALERT_EVENT, { detail }));
    } catch (e) { /* ignore */ }
};

export const SEARCH_FOCUS_EVENT = 'tb:focus-search';

// localStorage key: server timestamp (createdAt) of the newest SEEN store order
export const LAST_SEEN_KEY = 'tb_admin_last_seen_order';
