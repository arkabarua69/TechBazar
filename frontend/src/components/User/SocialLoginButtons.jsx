import { useEffect, useRef, useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useSnackbar } from 'notistack';
import axios from 'axios';
import { loadUser } from '../../actions/userAction';

/**
 * Social login buttons (Google / Facebook / Discord).
 *
 * Only providers that an admin has enabled + configured (Admin → Config →
 * Social Login) are shown. Clicking a button opens a popup that runs the
 * server-side OAuth flow; on completion the popup posts a message back and we
 * refresh the current user via loadUser().
 */

const GoogleIcon = (props) => (
    <svg viewBox="0 0 48 48" aria-hidden="true" {...props}>
        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
        <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
        <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
        <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
);

const FacebookIcon = (props) => (
    <svg viewBox="0 0 24 24" fill="#1877F2" aria-hidden="true" {...props}>
        <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047v-2.66c0-3.026 1.792-4.697 4.533-4.697 1.312 0 2.686.235 2.686.235v2.971H15.83c-1.491 0-1.956.93-1.956 1.886v2.264h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
    </svg>
);

const DiscordIcon = (props) => (
    <svg viewBox="0 0 24 24" fill="#5865F2" aria-hidden="true" {...props}>
        <path d="M20.317 4.369a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.211.375-.445.865-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.009c.12.099.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.331c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
);

const PROVIDER_META = {
    google: { label: 'Google', Icon: GoogleIcon },
    facebook: { label: 'Facebook', Icon: FacebookIcon },
    discord: { label: 'Discord', Icon: DiscordIcon },
};

const SocialLoginButtons = ({ redirect = 'account' }) => {
    const dispatch = useDispatch();
    const { enqueueSnackbar } = useSnackbar();
    const [providers, setProviders] = useState(null);
    const popupRef = useRef(null);

    useEffect(() => {
        let alive = true;
        axios.get('/api/v1/auth/providers')
            .then(({ data }) => { if (alive) setProviders(data?.providers || {}); })
            .catch(() => { if (alive) setProviders({}); });
        return () => { alive = false; };
    }, []);

    // Listen for the popup's result message and refresh the session.
    useEffect(() => {
        const onMessage = (event) => {
            const data = event.data;
            if (!data || data.type !== 'techbazar-oauth') return;
            // Trust only the popup we opened (fall back to a same-origin check).
            if (popupRef.current && event.source !== popupRef.current && event.origin !== window.location.origin) return;
            popupRef.current = null;
            if (data.success) {
                enqueueSnackbar('Signed in successfully', { variant: 'success' });
                dispatch(loadUser());
            } else {
                enqueueSnackbar(data.message || 'Social sign in failed', { variant: 'error' });
            }
        };
        window.addEventListener('message', onMessage);
        return () => window.removeEventListener('message', onMessage);
    }, [dispatch, enqueueSnackbar]);

    // Re-fetch the user when the popup closes even if it never posted (e.g. the
    // cookie was still set before the message was lost).
    useEffect(() => {
        const timer = setInterval(() => {
            if (popupRef.current && popupRef.current.closed) {
                popupRef.current = null;
                dispatch(loadUser());
            }
        }, 900);
        return () => clearInterval(timer);
    }, [dispatch]);

    const handleClick = useCallback((provider) => {
        const target = redirect || 'account';
        const url = `/api/v1/auth/${provider}/start?redirect=${encodeURIComponent(target)}`;
        const w = 520;
        const h = 640;
        let top = 0;
        let left = 0;
        try {
            top = Math.max(0, window.top.screenY + (window.top.outerHeight - h) / 2);
            left = Math.max(0, window.top.screenX + (window.top.outerWidth - w) / 2);
        } catch (_) {}
        const popup = window.open(
            url,
            'techbazar_oauth',
            `width=${w},height=${h},top=${top},left=${left},scrollbars=yes,resizable=yes`
        );
        if (!popup) {
            // Popup blocked → fall back to a full-page redirect.
            window.location.href = url;
            return;
        }
        popupRef.current = popup;
        popup.focus?.();
    }, [redirect]);

    const enabled = providers
        ? Object.keys(PROVIDER_META).filter((key) => providers[key]?.enabled)
        : [];

    if (!providers || enabled.length === 0) return null;

    return (
        <>
            <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-gray-200"></div>
                <span className="text-xs text-orange-500 font-medium">Or continue with</span>
                <div className="flex-1 h-px bg-gray-200"></div>
            </div>
            <div className="flex items-center justify-center gap-4">
                {enabled.map((key) => {
                    const { label, Icon } = PROVIDER_META[key];
                    return (
                        <button
                            key={key}
                            type="button"
                            aria-label={`Continue with ${label}`}
                            title={`Continue with ${label}`}
                            onClick={() => handleClick(key)}
                            className="w-12 h-12 rounded-full border-2 border-gray-200 bg-white flex items-center justify-center hover:border-orange-400 hover:shadow-md active:scale-95 transition-all duration-200"
                        >
                            <Icon className="w-5 h-5" />
                        </button>
                    );
                })}
            </div>
        </>
    );
};

export default SocialLoginButtons;
