const mongoose = require('mongoose');

// Single editable document that drives the homepage content.
// Everything here can be edited from the admin panel (Admin → Homepage).

const DEFAULT_CONFIG = {
    announcement: {
        desktop: [
            '🚚 সারা দেশে ক্যাশ অন ডেলিভারি',
            '🛡️ ৭ দিনের রিপ্লেসমেন্ট গ্যারান্টি',
            '📞 হটলাইন: 017XXXXXXXX',
        ],
        mobile: 'সারা দেশে ক্যাশ অন ডেলিভারি | ডেলিভারি চার্জ অগ্রিম প্রযোজ্য',
    },
    hero: {
        badge: 'নতুন গ্যাজেট সিজন',
        title: 'সেরা ট্রেন্ডিং গ্যাজেট',
        subtitle: 'স্মার্টওয়াচ, ইয়ারবাডস ও লেটেস্ট টেক — সাশ্রয়ী দামে, সারা দেশে ডেলিভারি।',
        image: 'https://picsum.photos/seed/hero-gadget/900/600',
        buttonLabel: 'Shop Now',
        buttonLink: '/products',
        sideTop: {
            title: 'New Arrivals',
            subtitle: 'এসেছে নতুন পণ্যগুলো',
            image: 'https://picsum.photos/seed/newarrival/400/300',
            link: '/products',
        },
        sideBottom: {
            title: "Today's Flash Deals",
            subtitle: 'আজকের সীমিত অফার',
            image: 'https://picsum.photos/seed/flashdeal/400/300',
            link: '/products',
        },
    },
    trustBadges: [
        { icon: '💵', title: 'ক্যাশ অন ডেলিভারি', description: 'পণ্য হাতে পেয়ে টাকা পরিশোধ করুন' },
        { icon: '⚡', title: 'ফাস্ট ডেলিভারি', description: 'ঢাকায় ২৪ ঘণ্টা, ঢাকার বাইরে ৪৮-৭২ ঘণ্টা' },
        { icon: '✅', title: 'জেনুইন প্রডাক্ট', description: '১০০% অরিজিনাল, কোয়ালিটি নিশ্চিত' },
        { icon: '🎧', title: '২৪/৭ সাপোর্ট', description: 'যেকোনো সমস্যায় আমাদের হটলাইন' },
    ],
    flashSale: {
        enabled: true,
        title: 'দিনের সেরা ডিল',
        subtitle: 'সীমিত স্টক — দ্রুত অর্ডার করুন',
        endsAt: '23:59',
        note: 'অফার শেষ হওয়ার আগেই অর্ডার করুন',
    },
    // editable from Admin → Homepage (payment & delivery control)
    payment: {
        bKashNumber: '01700000000',
        nagadNumber: '01700000000',
    },
    delivery: {
        insideDhaka: 70,
        outsideDhaka: 130,
    },
    // support contacts shown in the mobile menu drawer / contact links
    support: {
        hotline: '01700000000',
        whatsapp: '8801700000000',
    },
    // browsable product categories (Admin → Homepage)
    categories: [
        'Electronics',
        'Mobiles',
        'Laptops',
        'Fashion',
        'Appliances',
        'Home',
    ],
    howToOrder: [
        { icon: '🛒', title: 'পণ্য পছন্দ করুন', description: "‘অর্ডার করুন’ বাটনে ক্লিক করুন।" },
        { icon: '📲', title: 'ডেলিভারি চার্জ পেমেন্ট', description: 'ঢাকার ভেতরে ৳৭০, বাইরে ৳১৩০ — বিকাশ বা নগদে দিন।' },
        { icon: '📦', title: 'পণ্য বুঝে নিন', description: 'কুরিয়ার থেকে পণ্য হাতে পেয়ে বাকি টাকা পরিশোধ করুন।' },
    ],
    reviews: [
        { name: 'রাকিব হাসান', district: 'ঢাকা', rating: 5, comment: 'অর্ডার করা পণ্য ঠিক সময়ে পেয়েছি, কোয়ালিটিও ভালো। ক্যাশ অন ডেলিভারি হওয়ায় বিশ্বাসযোগ্য লেগেছে।' },
        { name: 'সাবিহা আক্তার', district: 'চট্টগ্রাম', rating: 5, comment: 'ডেলিভারি চার্জ অগ্রিমে দিয়েছিলাম, পণ্য পেয়েছি দুই দিনের মধ্যেই। সাপোর্ট টিম খুব সহযোগী।' },
        { name: 'তানভীর আহমেদ', district: 'সিলেট', rating: 4, comment: 'দাম অন্য জায়গার চেয়ে কম, পণ্যও অরিজিনাল। আবারও অর্ডার করবো ইনশাআল্লাহ।' },
    ],
};

const siteConfigSchema = new mongoose.Schema({
    announcement: {
        desktop: { type: [String], default: DEFAULT_CONFIG.announcement.desktop },
        mobile: { type: String, default: DEFAULT_CONFIG.announcement.mobile },
    },
    hero: {
        badge: { type: String, default: DEFAULT_CONFIG.hero.badge },
        title: { type: String, default: DEFAULT_CONFIG.hero.title },
        subtitle: { type: String, default: DEFAULT_CONFIG.hero.subtitle },
        image: { type: String, default: DEFAULT_CONFIG.hero.image },
        buttonLabel: { type: String, default: DEFAULT_CONFIG.hero.buttonLabel },
        buttonLink: { type: String, default: DEFAULT_CONFIG.hero.buttonLink },
        sideTop: {
            title: { type: String, default: DEFAULT_CONFIG.hero.sideTop.title },
            subtitle: { type: String, default: DEFAULT_CONFIG.hero.sideTop.subtitle },
            image: { type: String, default: DEFAULT_CONFIG.hero.sideTop.image },
            link: { type: String, default: DEFAULT_CONFIG.hero.sideTop.link },
        },
        sideBottom: {
            title: { type: String, default: DEFAULT_CONFIG.hero.sideBottom.title },
            subtitle: { type: String, default: DEFAULT_CONFIG.hero.sideBottom.subtitle },
            image: { type: String, default: DEFAULT_CONFIG.hero.sideBottom.image },
            link: { type: String, default: DEFAULT_CONFIG.hero.sideBottom.link },
        },
    },
    trustBadges: {
        type: [{
            icon: String,
            title: String,
            description: String,
        }],
        default: DEFAULT_CONFIG.trustBadges,
    },
    flashSale: {
        enabled: { type: Boolean, default: DEFAULT_CONFIG.flashSale.enabled },
        title: { type: String, default: DEFAULT_CONFIG.flashSale.title },
        subtitle: { type: String, default: DEFAULT_CONFIG.flashSale.subtitle },
        endsAt: { type: String, default: DEFAULT_CONFIG.flashSale.endsAt },
        note: { type: String, default: DEFAULT_CONFIG.flashSale.note },
    },
    howToOrder: {
        type: [{
            icon: String,
            title: String,
            description: String,
        }],
        default: DEFAULT_CONFIG.howToOrder,
    },
    reviews: {
        type: [{
            name: String,
            district: String,
            rating: { type: Number, min: 1, max: 5, default: 5 },
            comment: String,
        }],
        default: DEFAULT_CONFIG.reviews,
    },
    payment: {
        bKashNumber: { type: String, default: DEFAULT_CONFIG.payment.bKashNumber },
        nagadNumber: { type: String, default: DEFAULT_CONFIG.payment.nagadNumber },
    },
    delivery: {
        insideDhaka: { type: Number, default: DEFAULT_CONFIG.delivery.insideDhaka },
        outsideDhaka: { type: Number, default: DEFAULT_CONFIG.delivery.outsideDhaka },
    },
    support: {
        hotline: { type: String, default: DEFAULT_CONFIG.support.hotline },
        whatsapp: { type: String, default: DEFAULT_CONFIG.support.whatsapp },
    },
    categories: {
        type: [String],
        default: DEFAULT_CONFIG.categories,
    },
    updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('SiteConfig', siteConfigSchema);
module.exports.DEFAULT_CONFIG = DEFAULT_CONFIG;
