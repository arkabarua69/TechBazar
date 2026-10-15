const path = require('path');
const express = require('express');
const app = require('./backend/app');
const connectDatabase = require('./backend/config/database');
const PORT = process.env.PORT || 4000;
// UncaughtException Error
process.on('uncaughtException', (err) => {
    console.log(`Error: ${err.message}`);
    process.exit(1);
});
connectDatabase();
// deployment
const rootDir = path.resolve();
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(rootDir, '/frontend/build')))
    app.get('*', (req, res) => {
        // Never let the SPA fallback swallow unmatched API routes — return a
        // real JSON 404 so client-side errors surface instead of HTML.
        if (req.path.startsWith('/api')) {
            return res.status(404).json({ success: false, message: `API route not found: ${req.method} ${req.path}` });
        }
        res.sendFile(path.resolve(rootDir, 'frontend', 'build', 'index.html'))
    });
} else {
    app.get('/', (req, res) => {
        res.send('Server is Running!');
    });
}
const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
});
// Unhandled Promise Rejection
process.on('unhandledRejection', (err) => {
    console.log(`Error: ${err.message}`);
    server.close(() => {
        process.exit(1);
    });
});
