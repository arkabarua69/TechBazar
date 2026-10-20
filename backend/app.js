const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const fileUpload = require('express-fileupload');
const errorMiddleware = require('./middlewares/error');
const app = express();
// Behind Render/Vercel/nginx the request arrives over http from the proxy's
// point of view — trust the first hop so req.protocol / req.secure (and the
// auth cookie's Secure flag) reflect the real client connection.
app.set('trust proxy', 1);
// config
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config({ path: require('path').join(__dirname, 'config', 'config.env') });
}
// Increase body size limits — base64-encoded images can be several MB
// (a 5 MB image becomes ~6.8 MB as base64)
app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(fileUpload({ limits: { fileSize: 50 * 1024 * 1024 } }));
const user = require('./routes/userRoute');
const product = require('./routes/productRoute');
const order = require('./routes/orderRoute');
const siteconfig = require('./routes/storefrontRoute');
const chat = require('./routes/chatRoute');
const ticket = require('./routes/ticketRoute');
const websiteConfig = require('./routes/websiteConfigRoute');
const databaseRoute = require('./routes/databaseRoute');
const { serveOgPage } = require('./controllers/ogController');
const { isCrawler, renderOgHtml } = require('./utils/ogMeta');

// Social crawlers hitting a *document* path (e.g. /product/:id) get the HTML
// document with Open Graph tags injected. API routes are never touched.
// On Vercel this is reached through the crawler rewrite in vercel.json.
app.use(async (req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    if (req.path.startsWith('/api')) return next();
    // Never intercept static assets (js/css/images/manifest) — only documents.
    if (/\.[a-z0-9]{2,5}$/i.test(req.path)) return next();
    if (!isCrawler(req.get('user-agent'))) return next();
    try {
        const origin = `${req.protocol}://${req.get('host')}`;
        const html = await renderOgHtml({ pathname: req.path, origin });
        res.set('Content-Type', 'text/html; charset=utf-8');
        res.set('Cache-Control', 'public, max-age=300');
        return res.status(200).send(html);
    } catch {
        return next();
    }
});

app.use('/api/v1', user);
app.use('/api/v1', product);
app.use('/api/v1', order);
app.use('/api/v1', siteconfig);
app.use('/api/v1', chat);
app.use('/api/v1', ticket);
app.use('/api/v1', websiteConfig);
app.use('/api/v1', databaseRoute);
// Social-crawler document with Open Graph tags (see backend/utils/ogMeta.js).
// /api/index is a safety-net target for the Vercel crawler rewrite in case the
// platform passes the rewritten destination path instead of the original one.
app.get(['/api/og', '/api/index'], serveOgPage);
// error middleware
app.use(errorMiddleware);
module.exports = app;
