// Vercel serverless entrypoint.
// Vercel invokes this module for every /api/* request (see vercel.json rewrites).
// Unlike server.js we must NOT call app.listen() — we export the Express app.
const app = require('../backend/app');
const connectDatabase = require('../backend/config/database');

// Runs once per warm serverless instance (module scope) → connection is reused.
// In production NODE_ENV=production, so app.js skips config.env and all
// credentials come from Vercel's Environment Variables.
// Images are now hosted on ImgBB — no Cloudinary config needed.

connectDatabase();

module.exports = app;
