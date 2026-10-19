/**
 * oauthController — social login (Google / Facebook / Discord)
 *
 * Implements the OAuth 2.0 Authorization Code flow entirely server-side so the
 * client secret never reaches the browser:
 *
 *   1. Frontend opens a popup to  GET /api/v1/auth/:provider/start
 *   2. We redirect to the provider's consent screen.
 *   3. Provider redirects back to GET /api/v1/auth/:provider/callback
 *   4. We exchange the code for an access token, fetch the profile, create or
 *      link the user, set the usual httpOnly JWT cookie and return a tiny HTML
 *      page that notifies the opener window (window.opener.postMessage) and
 *      closes itself.
 *
 * Credentials (client id / secret / enabled) are configured from
 * Admin → Config → Social Login and stored in the WebsiteConfig document.
 */

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const WebsiteConfig = require('../models/websiteConfigModel');
const asyncErrorHandler = require('../middlewares/asyncErrorHandler');

const IS_PROD = process.env.NODE_ENV === 'production';

// ─── Provider endpoint definitions ────────────────────────────────────────────
const PROVIDERS = {
    google: {
        label: 'Google',
        authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        scope: 'openid email profile',
        getCreds: (c) => ({
            enabled: !!c.googleEnabled,
            clientId: c.googleClientId,
            clientSecret: c.googleClientSecret,
        }),
    },
    facebook: {
        label: 'Facebook',
        authorizeUrl: 'https://www.facebook.com/v19.0/dialog/oauth',
        scope: 'email,public_profile',
        getCreds: (c) => ({
            enabled: !!c.facebookEnabled,
            clientId: c.facebookAppId,
            clientSecret: c.facebookAppSecret,
        }),
    },
    discord: {
        label: 'Discord',
        authorizeUrl: 'https://discord.com/api/oauth2/authorize',
        scope: 'identify email',
        getCreds: (c) => ({
            enabled: !!c.discordEnabled,
            clientId: c.discordClientId,
            clientSecret: c.discordClientSecret,
        }),
    },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Load the social login settings (already decrypted via schema getters).
const getSocialLoginConfig = async () => {
    try {
        const cfg = await WebsiteConfig.getCurrentConfig();
        return (cfg && cfg.socialLogin) ? cfg.socialLogin : {};
    } catch (_) {
        return {};
    }
};

// Public base URL used to build OAuth redirect URIs. An admin override wins;
// otherwise it is derived from the incoming request (works for the same-origin
// Render deployment as well as the local dev proxy).
const getBaseUrl = (req, cfg = {}) => {
    const configured = String(cfg.callbackBaseUrl || '').trim();
    if (configured) return configured.replace(/\/+$/, '');
    const proto = (req.headers['x-forwarded-proto'] || req.protocol || 'http')
        .split(',')[0].trim();
    const host = req.headers['x-forwarded-host'] || req.get('host');
    return `${proto}://${host}`;
};

const redirectUriFor = (baseUrl, provider) =>
    `${baseUrl}/api/v1/auth/${provider}/callback`;

// Only allow same-site relative redirect targets (never an absolute URL).
const sanitizeRedirect = (value) => {
    const v = String(value || '').trim();
    if (v.startsWith('/') && !v.startsWith('//')) return v;
    return 'account';
};

// Normalise a browser-supplied origin to "scheme://host" (drops any path,
// query or trailing slash). Returns '' when it is not a valid http(s) origin.
const sanitizeOrigin = (value) => {
    const v = String(value || '').trim();
    if (!v) return '';
    try {
        const u = new URL(v);
        if (u.protocol !== 'http:' && u.protocol !== 'https:') return '';
        return `${u.protocol}//${u.host}`;
    } catch (_) {
        return '';
    }
};

const signState = (payload) =>
    jwt.sign(
        { ...payload, n: crypto.randomBytes(8).toString('hex') },
        process.env.JWT_SECRET,
        { expiresIn: '10m' }
    );

const verifyState = (state) =>
    jwt.verify(state, process.env.JWT_SECRET); // throws on invalid / expired

const authCookieOptions = () => ({
    expires: new Date(Date.now() + (Number(process.env.COOKIE_EXPIRE) || 5) * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: IS_PROD,
    sameSite: IS_PROD ? 'none' : 'lax',
});

const stateCookieOptions = () => ({
    httpOnly: true,
    secure: IS_PROD,
    sameSite: IS_PROD ? 'none' : 'lax',
    maxAge: 10 * 60 * 1000,
});

// Tiny HTML bridge: hands the result to the opener window and closes the popup.
const popupHtml = (targetOrigin, payload) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Signing in…</title></head>
<body style="margin:0;height:100vh;display:flex;align-items:center;justify-content:center;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#555;background:#fff">
<div style="text-align:center"><div style="font-size:28px;margin-bottom:10px">🔒</div>${
    payload.success ? 'Signing you in…' : 'Sign in could not be completed.'
}</div>
<script>
  (function () {
    var payload = ${JSON.stringify(payload).replace(/</g, '\\u003c')};
    var origin = ${JSON.stringify(targetOrigin || '*')};
    try {
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(payload, origin);
      }
    } catch (e) {}
    setTimeout(function () { try { window.close(); } catch (e) {} }, 350);
  })();
</script>
</body></html>`;

// Small JSON fetch helper that works on Node 18+ (global fetch).
const fetchJson = async (url, options = {}) => {
    if (typeof fetch !== 'function') {
        throw new Error('Server runtime does not support outbound HTTPS requests.');
    }
    const res = await fetch(url, {
        ...options,
        headers: {
            // Some providers (Discord in particular) reject requests without one.
            'User-Agent': 'TechBazar-SocialLogin/1.0',
            Accept: 'application/json',
            ...(options.headers || {}),
        },
    });
    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch (_) { data = null; }
    if (!res.ok) {
        const providerMsg = (data && (data.error_description || data.error?.message || data.error || data.message))
            || text
            || `HTTP ${res.status}`;
        throw new Error(String(providerMsg));
    }
    return data;
};

// ─── Profile exchange per provider ────────────────────────────────────────────
const exchangeCode = async (provider, creds, code, redirectUri) => {
    if (provider === 'google') {
        const body = new URLSearchParams({
            code,
            client_id: creds.clientId,
            client_secret: creds.clientSecret,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
        });
        const token = await fetchJson('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: body.toString(),
        });
        const info = await fetchJson('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${token.access_token}` },
        });
        return {
            provider: 'google',
            providerId: String(info.sub),
            email: info.email || '',
            emailVerified: info.email_verified === true || String(info.email_verified) === 'true',
            name: info.name || (info.email ? info.email.split('@')[0] : 'User'),
            avatarUrl: info.picture || '',
        };
    }

    if (provider === 'facebook') {
        const tokenUrl = 'https://graph.facebook.com/v19.0/oauth/access_token?' + new URLSearchParams({
            client_id: creds.clientId,
            client_secret: creds.clientSecret,
            redirect_uri: redirectUri,
            code,
        }).toString();
        const token = await fetchJson(tokenUrl);
        const me = await fetchJson(
            'https://graph.facebook.com/me?' + new URLSearchParams({
                fields: 'id,name,email,picture.type(large)',
                access_token: token.access_token,
            }).toString()
        );
        return {
            provider: 'facebook',
            providerId: String(me.id),
            email: me.email || '',
            // Facebook only returns an email when it is verified.
            emailVerified: !!me.email,
            name: me.name || 'User',
            avatarUrl: (me.picture && me.picture.data && me.picture.data.url) || '',
        };
    }

    if (provider === 'discord') {
        const body = new URLSearchParams({
            client_id: creds.clientId,
            client_secret: creds.clientSecret,
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUri,
        });
        const token = await fetchJson('https://discord.com/api/oauth2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: body.toString(),
        });
        const me = await fetchJson('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${token.access_token}` },
        });
        const avatarUrl = me.avatar
            ? `https://cdn.discordapp.com/avatars/${me.id}/${me.avatar}.png?size=256`
            : 'https://cdn.discordapp.com/embed/avatars/0.png';
        return {
            provider: 'discord',
            providerId: String(me.id),
            email: me.email || '',
            emailVerified: me.verified === true,
            name: me.global_name || me.username || 'User',
            avatarUrl,
        };
    }

    throw new Error('Unsupported provider');
};

// ─── Find / create / link the user ────────────────────────────────────────────

// Copy the provider's profile picture onto the user. A photo the user uploaded
// themselves keeps priority — we only (re)apply the provider picture when the
// avatar is empty, is the site default, or was itself set from a provider.
const applyProviderAvatar = (user, profile) => {
    if (!profile.avatarUrl) return false;
    const currentId = String((user.avatar && user.avatar.public_id) || '');
    const isProviderManaged = !user.avatar || !user.avatar.url || currentId.endsWith('_avatar');
    if (!isProviderManaged) return false;
    user.avatar = { public_id: `${profile.provider}_avatar`, url: profile.avatarUrl };
    return true;
};

const findOrCreateOAuthUser = async (profile) => {
    const email = String(profile.email || '').trim().toLowerCase();

    // 1. Already linked to this provider account?
    let user = await User.findOne({ provider: profile.provider, providerId: profile.providerId });
    if (user) {
        if (applyProviderAvatar(user, profile)) await user.save();
        return user;
    }

    // 2. Existing account with the same email → link it (only if verified).
    if (email) {
        const existing = await User.findOne({ email });
        if (existing) {
            if (!profile.emailVerified) {
                throw new Error(
                    'An account with this email already exists. Please sign in with your email and password.'
                );
            }
            existing.provider = profile.provider;
            existing.providerId = profile.providerId;
            applyProviderAvatar(existing, profile);
            await existing.save();
            return existing;
        }
    }

    // 3. Brand new account. A random password satisfies the required field;
    //    the user can set a real one later via "Forgot password".
    const randomPassword = crypto.randomBytes(24).toString('hex');
    const fallbackEmail = `${profile.provider}_${profile.providerId}@social.local`;
    user = await User.create({
        name: profile.name || 'User',
        email: email || fallbackEmail,
        gender: 'Not specified',
        password: randomPassword,
        provider: profile.provider,
        providerId: profile.providerId,
        avatar: profile.avatarUrl
            ? { public_id: `${profile.provider}_avatar`, url: profile.avatarUrl }
            : undefined,
    });
    return user;
};

// ─── Public: which providers are available ────────────────────────────────────
// GET /api/v1/auth/providers
// Returns only non-sensitive data (enabled flags + public client ids). The
// optional `baseUrl` mirrors the admin "Callback Base URL" override so the
// browser can open the OAuth popup on exactly the origin whose redirect URI the
// admin registered with each provider.
exports.getProviders = asyncErrorHandler(async (req, res) => {
    const cfg = await getSocialLoginConfig();
    const describe = (key, idKey, secretKey) => ({
        enabled: !!cfg[key] && !!cfg[idKey] && !!cfg[secretKey],
        clientId: cfg[idKey] || '',
    });
    res.status(200).json({
        success: true,
        baseUrl: String(cfg.callbackBaseUrl || '').trim().replace(/\/+$/, ''),
        providers: {
            google: describe('googleEnabled', 'googleClientId', 'googleClientSecret'),
            facebook: describe('facebookEnabled', 'facebookAppId', 'facebookAppSecret'),
            discord: describe('discordEnabled', 'discordClientId', 'discordClientSecret'),
        },
    });
});

// ─── Step 1: redirect to the provider ─────────────────────────────────────────
// GET /api/v1/auth/:provider/start
exports.startOAuth = async (req, res) => {
    const provider = String(req.params.provider || '').toLowerCase();
    const def = PROVIDERS[provider];
    if (!def) return res.status(404).send('Unknown social login provider.');

    const cfg = await getSocialLoginConfig();
    const creds = def.getCreds(cfg);
    if (!creds.enabled || !creds.clientId || !creds.clientSecret) {
        return res.status(400).send(`${def.label} login is not configured yet.`);
    }

    const base = getBaseUrl(req, cfg);
    const redirectUri = redirectUriFor(base, provider);
    const state = signState({ provider, redirect: sanitizeRedirect(req.query.redirect) });
    res.cookie('oauth_state', state, stateCookieOptions());

    const params = new URLSearchParams({
        client_id: creds.clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: def.scope,
        state,
    });
    if (provider === 'google') {
        params.set('access_type', 'online');
        params.set('prompt', 'select_account');
    }
    return res.redirect(`${def.authorizeUrl}?${params.toString()}`);
};

// ─── Step 2: provider redirects back here ─────────────────────────────────────
// GET /api/v1/auth/:provider/callback
exports.oauthCallback = async (req, res) => {
    const provider = String(req.params.provider || '').toLowerCase();
    const def = PROVIDERS[provider];

    let cfg = {};
    let base = '';
    // The opener validates the popup via event.source, so a wildcard target
    // origin is safe here and avoids origin mismatches behind proxies.
    const targetOrigin = '*';
    try {
        cfg = await getSocialLoginConfig();
        base = getBaseUrl(req, cfg);

        if (!def) throw new Error('Unknown social login provider.');

        const { code, state, error, error_description: errDesc } = req.query;
        if (error) throw new Error(String(errDesc || error));
        if (!code) throw new Error('Missing authorization code from provider.');
        if (!state) throw new Error('Missing OAuth state.');

        const payload = verifyState(state); // throws if invalid / expired
        if (payload.provider !== provider) throw new Error('OAuth state mismatch.');
        // Soft CSRF check — present on normal same-site popup navigations.
        if (req.cookies.oauth_state && req.cookies.oauth_state !== state) {
            throw new Error('OAuth state cookie mismatch.');
        }

        const creds = def.getCreds(cfg);
        if (!creds.enabled || !creds.clientId || !creds.clientSecret) {
            throw new Error(`${def.label} login is not configured.`);
        }

        const redirectUri = redirectUriFor(base, provider);
        const profile = await exchangeCode(provider, creds, String(code), redirectUri);
        const user = await findOrCreateOAuthUser(profile);

        const token = user.getJWTToken();
        res.cookie('token', token, authCookieOptions());
        res.cookie('oauth_state', '', { ...stateCookieOptions(), maxAge: 0 });

        return res.status(200).send(popupHtml(targetOrigin, {
            type: 'techbazar-oauth',
            success: true,
            redirect: payload.redirect || 'account',
        }));
    } catch (err) {
        return res.status(200).send(popupHtml(targetOrigin, {
            type: 'techbazar-oauth',
            success: false,
            message: err.message || 'Social sign in failed. Please try again.',
        }));
    }
};

// ─── Admin: exact redirect URIs to register with each provider ────────────────
// GET /api/v1/admin/sociallogin/callback-urls?origin=<frontend origin>
// The dev server serves the SPA on :3000 while the API runs on :4000, so the
// admin UI passes the origin the OAuth popup will actually use. An explicit
// "Callback Base URL" always wins, then the supplied origin, then the request.
exports.getSocialCallbackUrls = asyncErrorHandler(async (req, res) => {
    const cfg = await getSocialLoginConfig();
    const configured = String(cfg.callbackBaseUrl || '').trim().replace(/\/+$/, '');
    const base = configured || sanitizeOrigin(req.query.origin) || getBaseUrl(req, cfg);
    res.status(200).json({
        success: true,
        base,
        google: redirectUriFor(base, 'google'),
        facebook: redirectUriFor(base, 'facebook'),
        discord: redirectUriFor(base, 'discord'),
    });
});
