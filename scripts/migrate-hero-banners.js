/**
 * Migration: hero banners → object schema
 *
 * Older site-config documents stored `hero.banners` as an array of plain image
 * URL strings. The storefront/admin now expect each banner to be an object:
 *
 *   { image, badge, title, subtitle, buttonLabel, buttonLink }
 *
 * This script normalises every stored banner in place:
 *   • string entries become objects with the URL in `image`
 *   • missing/blank copy fields inherit the shared hero copy
 *   • the list is capped at 3 entries
 *   • an empty list is seeded from the legacy single `hero.image`
 *
 * It is idempotent — running it again changes nothing.
 *
 * Usage:
 *   npm run migrate:hero            # apply
 *   npm run migrate:hero -- --dry-run   # preview only
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'backend', 'config', 'config.env') });

const mongoose = require('mongoose');

const DRY_RUN = process.argv.includes('--dry-run');
const MAX_BANNERS = 3;

const str = (v) => (typeof v === 'string' ? v.trim() : '');

const normalizeBanners = (hero = {}) => {
    const shared = {
        badge:       str(hero.badge),
        title:       str(hero.title),
        subtitle:    str(hero.subtitle),
        buttonLabel: str(hero.buttonLabel) || 'Shop Now',
        buttonLink:  str(hero.buttonLink) || '/products',
    };

    const list = Array.isArray(hero.banners) ? hero.banners : [];
    let banners = list.slice(0, MAX_BANNERS).map((b) => {
        const o = typeof b === 'string' ? { image: b } : (b || {});
        return {
            image:       str(o.image),
            badge:       str(o.badge) || shared.badge,
            title:       str(o.title) || shared.title,
            subtitle:    str(o.subtitle) || shared.subtitle,
            buttonLabel: str(o.buttonLabel) || shared.buttonLabel,
            buttonLink:  str(o.buttonLink) || shared.buttonLink,
        };
    });

    // No banner slots at all — keep the legacy single image visible.
    if (banners.length === 0 && str(hero.image)) {
        banners = [{
            image: str(hero.image),
            badge: shared.badge,
            title: shared.title,
            subtitle: shared.subtitle,
            buttonLabel: shared.buttonLabel,
            buttonLink: shared.buttonLink,
        }];
    }

    return banners;
};

const main = async () => {
    if (!process.env.MONGO_URI) {
        console.error('MONGO_URI is not set (backend/config/config.env).');
        process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 20000 });
    const col = mongoose.connection.db.collection('siteconfigs');

    const docs = await col.find({}).toArray();
    if (!docs.length) {
        console.log('No site-config documents found — nothing to migrate.');
        await mongoose.disconnect();
        return;
    }

    console.log(`Connected to ${mongoose.connection.db.databaseName}. Scanning ${docs.length} site-config document(s)${DRY_RUN ? ' (dry run)' : ''}…`);

    let changed = 0;
    for (const doc of docs) {
        const hero = doc.hero || {};
        const before = hero.banners;
        const after = normalizeBanners(hero);

        if (JSON.stringify(before || []) === JSON.stringify(after)) {
            console.log(`  • ${doc._id}: already up to date (${after.length} banner(s))`);
            continue;
        }

        console.log(`  • ${doc._id}: ${JSON.stringify(before || []).slice(0, 120)} → ${after.length} banner object(s)`);
        after.forEach((b, i) => {
            console.log(`      [${i}] image=${b.image ? 'yes' : 'EMPTY'}  title="${b.title.slice(0, 50)}"`);
        });

        if (!DRY_RUN) {
            await col.updateOne({ _id: doc._id }, { $set: { 'hero.banners': after } });
        }
        changed += 1;
    }

    console.log(DRY_RUN
        ? `\nDry run complete — ${changed} document(s) would change.`
        : `\nDone — ${changed} document(s) migrated.`);

    await mongoose.disconnect();
};

if (require.main === module) {
    main().catch(async (err) => {
        console.error('Migration failed:', err.message);
        await mongoose.disconnect().catch(() => {});
        process.exit(1);
    });
}

module.exports = { normalizeBanners, MAX_BANNERS };
