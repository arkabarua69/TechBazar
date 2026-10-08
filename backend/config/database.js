const mongoose = require('mongoose');
const MONGO_URI = process.env.MONGO_URI;

const connectDatabase = () => {
    const label = String(MONGO_URI || '').replace(/:[^:@]+@/, ':****@').slice(0, 90);
    console.log(`Connecting to database: ${label}`);

    mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
        .then(() => {
            console.log(`Mongoose Connected ✓ (${mongoose.connection.host}/${mongoose.connection.name})`);
        })
        .catch((err) => {
            console.error(`Mongoose connection FAILED: ${err.message}`);
        });
};

module.exports = connectDatabase;
