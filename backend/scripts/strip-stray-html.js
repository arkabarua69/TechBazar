// One-off cleanup: some fields were briefly edited with the rich-text editor
// before they were switched back to plain inputs, so their stored values now
// contain stray HTML (<p>…</p>). Those fields render as plain text on the
// storefront, which shows the tags literally.
//
// This script strips the tags ONLY from fields that are plain text by design:
//   hero.badge / hero.title / hero.subtitle
//   hero.sideTop|sideBottom .title / .subtitle
//   hero.banners[].badge / .title / .subtitle / .buttonLabel / .buttonLink
//   announcement.desktop[] / announcement.mobile
//   trustBadges[].title
//
// Fields that are intentionally rich text (howToOrder descriptions, reviews,
// seo.description, faqs answers, policy body, footer company info) are left
// untouched.
//
// Usage:  node backend/scripts/strip-stray-html.js [--apply]
// Default is a dry run.

const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '..', 'config', 'config.env') });

const SiteConfig = require('../models/siteConfigModel');

const APPLY = process.argv.includes('--apply');

const TAG_RE = /<\/?[a-z][\s\S]*?>/gi;

// <p>a</p><p>b</p>  →  a b   (tags → space, collapse whitespace)
const stripTags = (s) =>
    String(s)
        .replace(/<\s*br\s*\/?\s*>/gi, ' ')
        .replace(/<\/\s*p\s*>/gi, ' ')
        .replace(TAG_RE, '')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/\s+/g, ' ')
        .trim();

const hasTags = (s) => TAG_RE.test(String(s || ''));

const changes = [];
const fixField = (obj, key, label) => {
    if (!obj || typeof obj[key] !== 'string') return;
    if (!hasTags(obj[key])) return;
    const before = obj[key];
    const after = stripTags(before);
    changes.push({ label, before, after });
    if (APPLY) obj[key] = after;
};

(async () => {
    await mongoose.connect(process.env.MONGO_URI);

    const doc = await SiteConfig.findOne().sort('-updatedAt');
    if (!doc) {
        console.log('No SiteConfig document found.');
        await mongoose.disconnect();
        return;
    }

    const cfg = doc.toObject();

    // hero (top-level)
    fixField(cfg.hero, 'badge', 'hero.badge');
    fixField(cfg.hero, 'title', 'hero.title');
    fixField(cfg.hero, 'subtitle', 'hero.subtitle');

    // hero side cards
    ['sideTop', 'sideBottom'].forEach((group) => {
        fixField(cfg.hero?.[group], 'title', `hero.${group}.title`);
        fixField(cfg.hero?.[group], 'subtitle', `hero.${group}.subtitle`);
    });

    // hero banners
    (cfg.hero?.banners || []).forEach((b, i) => {
        if (typeof b !== 'object' || !b) return;
        fixField(b, 'badge', `hero.banners[${i}].badge`);
        fixField(b, 'title', `hero.banners[${i}].title`);
        fixField(b, 'subtitle', `hero.banners[${i}].subtitle`);
        fixField(b, 'buttonLabel', `hero.banners[${i}].buttonLabel`);
        fixField(b, 'buttonLink', `hero.banners[${i}].buttonLink`);
    });

    // announcements
    (cfg.announcement?.desktop || []).forEach((item, i) => {
        if (typeof item !== 'string' || !hasTags(item)) return;
        const after = stripTags(item);
        changes.push({ label: `announcement.desktop[${i}]`, before: item, after });
        if (APPLY) cfg.announcement.desktop[i] = after;
    });
    fixField(cfg.announcement, 'mobile', 'announcement.mobile');

    // trust badges
    (cfg.trustBadges || []).forEach((b, i) => {
        if (typeof b !== 'object' || !b) return;
        fixField(b, 'title', `trustBadges[${i}].title`);
    });

    // SEO meta description — plain text (it lands in a <meta> tag)
    fixField(cfg.seo, 'description', 'seo.description');

    console.log(`\n${APPLY ? 'APPLY' : 'DRY RUN'} — ${changes.length} field(s) with stray HTML\n`);
    changes.forEach((c) => {
        console.log(`• ${c.label}`);
        console.log(`    before: ${c.before}`);
        console.log(`    after : ${c.after}\n`);
    });

    if (APPLY && changes.length) {
        doc.hero = cfg.hero;
        doc.announcement = cfg.announcement;
        doc.trustBadges = cfg.trustBadges;
        doc.seo = cfg.seo;
        doc.markModified('hero');
        doc.markModified('announcement');
        doc.markModified('trustBadges');
        doc.markModified('seo');
        await doc.save();
        console.log(`Saved. ${changes.length} field(s) cleaned.`);
    } else if (changes.length) {
        console.log('Dry run only. Re-run with --apply to write changes.');
    } else {
        console.log('Nothing to clean.');
    }

    await mongoose.disconnect();
})().catch((e) => {
    console.error(e);
    process.exit(1);
});
