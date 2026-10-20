const sendToken = (user, statusCode, res) => {
    const token = user.getJWTToken();

    // SameSite=None is only legal together with Secure, and a Secure cookie is
    // rejected outright when the site is reached over plain http — which would
    // silently log users out on http deployments. Decide from the *actual*
    // connection: https (direct or via proxy) → Secure + SameSite=None,
    // plain http → SameSite=Lax without Secure.
    const req = res.req;
    const forwardedProto = String((req && req.headers && req.headers['x-forwarded-proto']) || '')
        .split(',')[0].trim();
    const isHttps = Boolean(req && (req.secure || forwardedProto === 'https'));
    const secure = process.env.NODE_ENV === 'production' && isHttps;

    const options = {
        expires: new Date(
            Date.now() + (process.env.COOKIE_EXPIRE || 5) * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
        secure,
        sameSite: secure ? 'none' : 'lax'
    }

    res.status(statusCode).cookie('token', token, options).json({
        success: true,
        user,
        token,
    });
}

module.exports = sendToken;