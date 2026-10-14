const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const fileUpload = require('express-fileupload');
const errorMiddleware = require('./middlewares/error');
const app = express();
// config
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config({ path: 'backend/config/config.env' });
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
const payment = require('./routes/paymentRoute');
const siteconfig = require('./routes/storefrontRoute');
const chat = require('./routes/chatRoute');
const websiteConfig = require('./routes/websiteConfigRoute');
const databaseRoute = require('./routes/databaseRoute');
app.use('/api/v1', user);
app.use('/api/v1', product);
app.use('/api/v1', order);
app.use('/api/v1', payment);
app.use('/api/v1', siteconfig);
app.use('/api/v1', chat);
app.use('/api/v1', websiteConfig);
app.use('/api/v1', databaseRoute);
// error middleware
app.use(errorMiddleware);
module.exports = app;
