// Vercel serverless entrypoint.
// Vercel invokes this module for every /api/* request (see vercel.json rewrites).
// Unlike server.js we must NOT call app.listen() — we export the Express app.
const cloudinary = require('cloudinary');
const app = require('../backend/app');
const connectDatabase = require('../backend/config/database');

// Runs once per warm serverless instance (module scope) → connection is reused.
// In production NODE_ENV=production, so app.js skips config.env and all
// credentials come from Vercel's Environment Variables.
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

connectDatabase();

module.exports = app;
