const asyncErrorHandler = require('../middlewares/asyncErrorHandler');
const { renderOgHtml } = require('../utils/ogMeta');

/**
 * GET /api/og?path=/product/...
 *
 * Returns the SPA document with Open Graph / Twitter meta tags injected, so
 * social crawlers that don't execute JavaScript (WhatsApp, Facebook, Telegram,
 * LinkedIn, Discord, Twitter…) show the uploaded OG image and page copy.
 *
 * Public + read-only. Only same-site paths are accepted.
 */
const serveOgPage = asyncErrorHandler(async (req, res) => {
    const requested = typeof req.query.path === 'string' ? req.query.path : '/';
    const pathname = requested.startsWith('/') && !requested.startsWith('//')
        ? requested.split('?')[0].split('#')[0]
        : '/';

    const origin = `${req.protocol}://${req.get('host')}`;
    const html = await renderOgHtml({ pathname, origin });

    res.set('Content-Type', 'text/html; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=300, s-maxage=300');
    res.status(200).send(html);
});

module.exports = { serveOgPage };
