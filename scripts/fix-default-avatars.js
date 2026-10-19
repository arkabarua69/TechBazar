/**
 * Fix: users stuck with the old (dead) Cloudinary default avatar.
 *
 * The original seed created new users with
 *   https://res.cloudinary.com/demosite/image/upload/v1/avatars/default_avatar.png
 * which no longer resolves, so those avatars render as broken images.
 *
 * This script repoints every affected user at the local placeholder that ships
 * in frontend/public/avatar-placeholder.svg.
 *
 * Idempotent — running it again changes nothing.
 *
 * Usage:
 *   npm run fix:avatars                 # apply
 *   npm run fix:avatars -- --dry-run    # preview only
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'backend', 'config', 'config.env') });

const mongoose = require('mongoose');

const DRY_RUN = process.argv.includes('--dry-run');
const PLACEHOLDER = '/avatar-placeholder.svg';
const BROKEN_URL = 'https://res.cloudinary.com/demosite/image/upload/v1/avatars/default_avatar.png';

const FILTER = {
    $or: [
        { 'avatar.url': BROKEN_URL },
        { 'avatar.url': '' },
        { 'avatar.url': { $exists: false } },
        { avatar: { $exists: false } },
        { avatar: null },
    ],
};

async function main() {
    if (!process.env.MONGO_URI) {
        console.error('MONGO_URI is not set (backend/config/config.env).');
        process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 20000 });
    const col = mongoose.connection.db.collection('users');

    const docs = await col.find(FILTER).project({ name: 1, email: 1, 'avatar.url': 1 }).toArray();

    if (!docs.length) {
        console.log('No users with a missing/broken avatar — nothing to do.');
        await mongoose.disconnect();
        return;
    }

    console.log(`Connected to ${mongoose.connection.db.databaseName}. ${docs.length} user(s) need a placeholder${DRY_RUN ? ' (dry run)' : ''}:`);
    docs.forEach((u) => {
        console.log(`  • ${u.name || '(no name)'} <${u.email || 'no email'}>  avatar.url=${JSON.stringify(u.avatar?.url)}`);
    });

    if (!DRY_RUN) {
        const result = await col.updateMany(FILTER, {
            $set: {
                'avatar.url': PLACEHOLDER,
                'avatar.public_id': 'avatars/default_avatar',
            },
        });
        console.log(`\nDone — ${result.modifiedCount} user(s) updated to ${PLACEHOLDER}.`);
    } else {
        console.log('\nDry run complete — no changes written.');
    }

    await mongoose.disconnect();
}

if (require.main === module) {
    main().catch(async (err) => {
        console.error('Avatar fix failed:', err.message);
        await mongoose.disconnect().catch(() => {});
        process.exit(1);
    });
}

module.exports = { PLACEHOLDER, BROKEN_URL, FILTER };
