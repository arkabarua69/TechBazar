const path = require('path');
const express = require('express');
const cloudinary = require('cloudinary');
const app = require('./backend/app');
const connectDatabase = require('./backend/config/database');
const PORT = process.env.PORT || 4000;

// UncaughtException Error
process.on('uncaughtException', (err) => {
    console.log(`Error: ${err.message}`);
    process.exit(1);
});

connectDatabase();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// deployment
__dirname = path.resolve();
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '/frontend/build')))

    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, 'frontend', 'build', 'index.html'))
    });
} else {
    app.get('/', (req, res) => {
        res.send('Server is Running! 🚀');
    });
}

const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
});

// ── Business Koro catalogue sync (server-side) ─────────────────────────────
// Replaces the local product list with the storefront catalogue. Skips
// silently when BUSINESS_KORO_API_KEY is not configured.
const { syncCatalog } = require('./backend/services/catalogSync');

const runCatalogSync = async (reason) => {
    try {
        const result = await syncCatalog();
        if (result.skipped) {
            console.log(`Catalog sync skipped (${reason}): ${result.reason}`);
        } else {
            console.log(`Catalog sync (${reason}): ${result.count} products`);
        }
    } catch (err) {
        console.log(`Catalog sync failed (${reason}): ${err.message}`);
    }
};

setTimeout(() => runCatalogSync('startup'), 8000);
setInterval(() => runCatalogSync('interval'), 30 * 60 * 1000); // every 30 minutes

// Unhandled Promise Rejection
process.on('unhandledRejection', (err) => {
    console.log(`Error: ${err.message}`);
    server.close(() => {
        process.exit(1);
    });
});
