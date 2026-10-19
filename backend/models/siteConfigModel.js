const mongoose = require('mongoose');

// ── Default theme tokens ─────────────────────────────────────────────────────
const DEFAULT_THEME = {
    colorAccent:           '#E84B0F',
    colorAccentHover:      '#C63E0A',
    colorSuccess:          '#16a34a',
    colorWarning:          '#f59e0b',
    colorDanger:           '#ef4444',
    colorBg:               '#FAE5D3',
    colorSurface:          '#ffffff',
    colorBorder:           '#F2D9C8',
    colorTextPrimary:      '#2D1B0E',
    colorTextSecondary:    '#7A5C48',
    colorTextMuted:        '#B8937A',
    colorHeader:           '#ffffff',
    colorHeaderText:       '#2D1B0E',
    colorFooter:           '#2D1B0E',
    colorFooterText:       '#B8937A',
    colorAnnouncement:     '#E84B0F',
    colorAnnouncementText: '#ffffff',
    btnRadius:             '2rem',
    btnStyle:              'filled',
    fontBody:              'Poppins',
    fontDisplay:           'Poppins',
    fontScale:             '1',
    darkMode:              false,
    containerWidth:        '1280px',
    cardRadius:            '1rem',
};

// ── Default site config ──────────────────────────────────────────────────────
const DEFAULT_CONFIG = {
    announcement: {
        desktop: [
            'Cash on delivery nationwide',
            '7-day replacement guarantee',
            'Hotline: 017XXXXXXXX',
        ],
        mobile: 'Cash on delivery nationwide | Delivery charge payable in advance',
    },
    hero: {
        badge: 'New Gadget Season',
        title: 'Best Trending Gadgets',
        subtitle: 'Smartwatches, earbuds & the latest tech — affordable prices, delivered nationwide.',
        image: 'https://picsum.photos/seed/hero-gadget/900/600',
        // Up to 3 rotating hero banners, each with its own copy:
        //   { image, badge, title, subtitle, buttonLabel, buttonLink }
        // When a banner text/button field is empty the storefront falls back to
        // the shared hero copy above; when the list is empty it falls back to
        // `image`.
        banners: [],
        buttonLabel: 'Shop Now',
        buttonLink: '/products',
        sideTop: {
            title: 'New Arrivals',
            subtitle: 'Fresh drops just landed',
            image: 'https://picsum.photos/seed/newarrival/400/300',
            link: '/products',
        },
        sideBottom: {
            title: "Today's Flash Deals",
            subtitle: "Today's limited offers",
            image: 'https://picsum.photos/seed/flashdeal/400/300',
            link: '/products',
        },
    },
    trustBadges: [
        { icon: 'AttachMoney',  title: 'Cash on Delivery',  description: 'Pay once the product is in your hands' },
        { icon: 'FlashOn',      title: 'Fast Delivery',      description: '24 hours in Dhaka, 48–72 hours outside Dhaka' },
        { icon: 'Verified',     title: 'Genuine Products',   description: '100% original, quality assured' },
        { icon: 'HeadsetMic',   title: '24/7 Support',       description: 'Call our hotline for any issue' },
    ],
    flashSale: {
        enabled:  true,
        title:    'Deal of the Day',
        subtitle: 'Limited stock — order fast',
        endsAt:   '23:59',
        note:     'Order before the offer ends',
    },
    payment: {
        bKashNumber: '01700000000',
        nagadNumber: '01700000000',
    },
    delivery: {
        insideDhaka:  70,
        outsideDhaka: 130,
    },
    support: {
        hotline:  '01700000000',
        whatsapp: '8801700000000',
    },
    categories: ['Electronics','Mobiles','Laptops','Fashion','Appliances','Home'],
    // Optional custom image per category — { "Mobiles": "https://…" }.
    // When empty, the storefront falls back to the built-in keyword image.
    categoryImages: {},
    howToOrder: [
        { icon: 'ShoppingCart', title: 'Choose Your Product',     description: "Click the 'Order Now' button." },
        { icon: 'Payments',     title: 'Pay the Delivery Charge', description: 'Tk 70 inside Dhaka, Tk 130 outside — send via bKash or Nagad.' },
        { icon: 'Inventory2',   title: 'Receive Your Product',    description: 'Pay the remaining amount to the courier on delivery.' },
    ],
    reviews: [
        { name: 'Rakib Hasan',   district: 'Dhaka',      rating: 5, comment: 'Received my order right on time and the quality is great. Cash on delivery made it feel trustworthy.', image: '' },
        { name: 'Sabrina Akter', district: 'Chittagong', rating: 5, comment: 'I paid the delivery charge in advance and got the product within two days. The support team is very helpful.', image: '' },
        { name: 'Tanvir Ahmed',  district: 'Sylhet',     rating: 4, comment: 'The price is lower than other places and the product is original. Will order again, God willing.', image: '' },
    ],
    branding: {
        name:       'My Store',
        tagline:    'The best products at affordable prices',
        logoUrl:    '',
        faviconUrl: '',
    },
    seo: {
        titleTemplate: '%s | My Store',
        description:   'My Store — shop the latest products at affordable prices with cash on delivery nationwide.',
    },
    navigation: {
        tabs: [
            { key: 'home',   label: 'Home',   href: '/',        icon: 'Home' },
            { key: 'shop',   label: 'Shop',   href: '/products', icon: 'Storefront' },
            { key: 'cart',   label: 'Cart',   href: '/cart',    icon: 'ShoppingCart' },
            { key: 'orders', label: 'Orders', href: '/orders',  icon: 'Inventory2' },
        ],
    },
    content: {
        policyTitle: 'Privacy & Return Policy',
        policy: [
            { title: 'Privacy Policy',      body: ['Your name, mobile number and address are used only to complete your order.','Your personal information is never sold or shared with any third party.','Payment TrxIDs are stored only to verify the delivery charge.'] },
            { title: 'Returns & Replacement', body: ['Any issue within 7 days of receiving the product will be replaced.','Products that are used or damaged cannot be returned.','Send your order ID and photos of the issue via hotline or WhatsApp — resolved within 24 hours.'] },
            { title: 'Delivery & Payment',  body: ['The full product price is cash on delivery (COD) — pay when the product is in your hands.','Delivery charge in advance: Tk 70 inside Dhaka, Tk 130 outside — send via bKash or Nagad and share the TrxID.','Delivery completes within 24–48 hours in Dhaka, 48–72 hours outside Dhaka.'] },
            { title: 'Warranty',            body: ['All gadgets come with genuine official warranty (6–12 months depending on the product).','Keep the warranty card or invoice — it is needed for service.'] },
        ],
        faqs: [
            { q: 'What happens when I update my email address (or mobile number)?', a: "Your login email id (or mobile number) changes, likewise. You'll receive all your account related communication on your updated email address (or mobile number)." },
            { q: 'When will my TechBazar account be updated with the new email address (or mobile number)?', a: 'It happens as soon as you confirm the verification code sent to your email (or mobile) and save the changes.' },
            { q: 'What happens to my existing TechBazar account when I update my email address (or mobile number)?', a: "Updating your email address (or mobile number) doesn't invalidate your account. Your account remains fully functional. You'll continue seeing your Order history, saved information and personal details." },
            { q: 'Does my Seller account get affected when I update my email address?', a: "TechBazar has a 'single sign-on' policy. Any changes will reflect in your Seller account also." },
        ],
        footer: {
            columns: [
                { title: 'about',  links: [{ name: 'Contact Us', redirect: '/track', internal: true },{ name: 'About Us', redirect: '/policy', internal: true },{ name: 'Careers', redirect: '/policy', internal: true },{ name: 'TechBazar Stories', redirect: '/policy', internal: true },{ name: 'Press', redirect: '/policy', internal: true },{ name: 'TechBazar Wholesale', redirect: '/policy', internal: true },{ name: 'Corporate Information', redirect: '/policy', internal: true }] },
                { title: 'help',   links: [{ name: 'Payments', redirect: '/policy', internal: true },{ name: 'Shipping', redirect: '/policy', internal: true },{ name: 'Cancellation & Returns', redirect: '/policy', internal: true },{ name: 'FAQ', redirect: '/policy', internal: true }] },
                { title: 'policy', links: [{ name: 'Return Policy', redirect: '/policy', internal: true },{ name: 'Terms Of Use', redirect: '/policy', internal: true },{ name: 'Security', redirect: '/policy', internal: true },{ name: 'Privacy', redirect: '/policy', internal: true },{ name: 'Sitemap', redirect: '/policy', internal: true },{ name: 'EPR Compliance', redirect: '/policy', internal: true }] },
                { title: 'social', links: [{ name: 'Facebook', redirect: 'https://www.facebook.com', internal: false },{ name: 'Twitter', redirect: 'https://twitter.com', internal: false },{ name: 'YouTube', redirect: 'https://www.youtube.com', internal: false }] },
            ],
            company: {
                name:       'TechBazar Internet Private Limited',
                mailUs:     'Buildings Alyssa, Begonia &\nClove Embassy Tech Village,\nOuter Ring Road, Devarabeesanahalli Village,\nBengaluru, 560103,\nKarnataka, India',
                registered: 'Buildings Alyssa, Begonia &\nClove Embassy Tech Village,\nOuter Ring Road, Devarabeesanahalli Village,\nBengaluru, 560103,\nKarnataka, India',
                cin:        'U51109KA2012PTC066107',
                telephone:  '18002029898',
            },
            shortcuts: [
                { label: 'Sell On TechBazar', href: '/policy', icon: 'Work' },
                { label: 'Advertise',          href: '/policy', icon: 'Stars' },
                { label: 'Gift Cards',         href: '/policy', icon: 'CardGiftcard' },
                { label: 'Help Center',        href: '/track',  icon: 'Help' },
            ],
            copyright: 'TechBazar.com',
            since: 2007,
        },
    },
    chat: {
        welcomeMessage: 'Hello! I would like to know about a product or an order.',
    },
    theme: DEFAULT_THEME,
};

// ── Mongoose schema ──────────────────────────────────────────────────────────
const themeSchema = new mongoose.Schema({
    colorAccent:           { type: String, default: DEFAULT_THEME.colorAccent },
    colorAccentHover:      { type: String, default: DEFAULT_THEME.colorAccentHover },
    colorSuccess:          { type: String, default: DEFAULT_THEME.colorSuccess },
    colorWarning:          { type: String, default: DEFAULT_THEME.colorWarning },
    colorDanger:           { type: String, default: DEFAULT_THEME.colorDanger },
    colorBg:               { type: String, default: DEFAULT_THEME.colorBg },
    colorSurface:          { type: String, default: DEFAULT_THEME.colorSurface },
    colorBorder:           { type: String, default: DEFAULT_THEME.colorBorder },
    colorTextPrimary:      { type: String, default: DEFAULT_THEME.colorTextPrimary },
    colorTextSecondary:    { type: String, default: DEFAULT_THEME.colorTextSecondary },
    colorTextMuted:        { type: String, default: DEFAULT_THEME.colorTextMuted },
    colorHeader:           { type: String, default: DEFAULT_THEME.colorHeader },
    colorHeaderText:       { type: String, default: DEFAULT_THEME.colorHeaderText },
    colorFooter:           { type: String, default: DEFAULT_THEME.colorFooter },
    colorFooterText:       { type: String, default: DEFAULT_THEME.colorFooterText },
    colorAnnouncement:     { type: String, default: DEFAULT_THEME.colorAnnouncement },
    colorAnnouncementText: { type: String, default: DEFAULT_THEME.colorAnnouncementText },
    btnRadius:             { type: String, default: DEFAULT_THEME.btnRadius },
    btnStyle:              { type: String, default: DEFAULT_THEME.btnStyle, enum: ['filled','outline','soft'] },
    fontBody:              { type: String, default: DEFAULT_THEME.fontBody },
    fontDisplay:           { type: String, default: DEFAULT_THEME.fontDisplay },
    fontScale:             { type: String, default: DEFAULT_THEME.fontScale },
    darkMode:              { type: Boolean, default: DEFAULT_THEME.darkMode },
    containerWidth:        { type: String, default: DEFAULT_THEME.containerWidth },
    cardRadius:            { type: String, default: DEFAULT_THEME.cardRadius },
}, { _id: false });

const siteConfigSchema = new mongoose.Schema({
    announcement: {
        desktop: { type: [String], default: DEFAULT_CONFIG.announcement.desktop },
        mobile:  { type: String,   default: DEFAULT_CONFIG.announcement.mobile },
    },
    hero: {
        badge:       { type: String, default: DEFAULT_CONFIG.hero.badge },
        title:       { type: String, default: DEFAULT_CONFIG.hero.title },
        subtitle:    { type: String, default: DEFAULT_CONFIG.hero.subtitle },
        image:       { type: String, default: DEFAULT_CONFIG.hero.image },
        banners:     { type: [mongoose.Schema.Types.Mixed], default: DEFAULT_CONFIG.hero.banners },
        buttonLabel: { type: String, default: DEFAULT_CONFIG.hero.buttonLabel },
        buttonLink:  { type: String, default: DEFAULT_CONFIG.hero.buttonLink },
        sideTop: {
            title:    { type: String, default: DEFAULT_CONFIG.hero.sideTop.title },
            subtitle: { type: String, default: DEFAULT_CONFIG.hero.sideTop.subtitle },
            image:    { type: String, default: DEFAULT_CONFIG.hero.sideTop.image },
            link:     { type: String, default: DEFAULT_CONFIG.hero.sideTop.link },
        },
        sideBottom: {
            title:    { type: String, default: DEFAULT_CONFIG.hero.sideBottom.title },
            subtitle: { type: String, default: DEFAULT_CONFIG.hero.sideBottom.subtitle },
            image:    { type: String, default: DEFAULT_CONFIG.hero.sideBottom.image },
            link:     { type: String, default: DEFAULT_CONFIG.hero.sideBottom.link },
        },
    },
    trustBadges: {
        type: [{ icon: String, title: String, description: String }],
        default: DEFAULT_CONFIG.trustBadges,
    },
    flashSale: {
        enabled:  { type: Boolean, default: DEFAULT_CONFIG.flashSale.enabled },
        title:    { type: String,  default: DEFAULT_CONFIG.flashSale.title },
        subtitle: { type: String,  default: DEFAULT_CONFIG.flashSale.subtitle },
        endsAt:   { type: String,  default: DEFAULT_CONFIG.flashSale.endsAt },
        note:     { type: String,  default: DEFAULT_CONFIG.flashSale.note },
    },
    howToOrder: {
        type: [{ icon: String, title: String, description: String }],
        default: DEFAULT_CONFIG.howToOrder,
    },
    reviews: {
        type: [{
            name:     String,
            district: String,
            rating:   { type: Number, min: 1, max: 5, default: 5 },
            comment:  String,
            image:    String,
        }],
        default: DEFAULT_CONFIG.reviews,
    },
    payment: {
        bKashNumber: { type: String, default: DEFAULT_CONFIG.payment.bKashNumber },
        nagadNumber: { type: String, default: DEFAULT_CONFIG.payment.nagadNumber },
    },
    delivery: {
        insideDhaka:  { type: Number, default: DEFAULT_CONFIG.delivery.insideDhaka },
        outsideDhaka: { type: Number, default: DEFAULT_CONFIG.delivery.outsideDhaka },
    },
    support: {
        hotline:  { type: String, default: DEFAULT_CONFIG.support.hotline },
        whatsapp: { type: String, default: DEFAULT_CONFIG.support.whatsapp },
    },
    categories: { type: [String], default: DEFAULT_CONFIG.categories },
    // name → image URL map (Mixed keeps an arbitrary key set clean & simple)
    categoryImages: { type: mongoose.Schema.Types.Mixed, default: () => ({ ...DEFAULT_CONFIG.categoryImages }) },
    branding: {
        name:       { type: String, default: DEFAULT_CONFIG.branding.name },
        tagline:    { type: String, default: DEFAULT_CONFIG.branding.tagline },
        logoUrl:    { type: String, default: DEFAULT_CONFIG.branding.logoUrl },
        faviconUrl: { type: String, default: '' },
    },
    seo: {
        titleTemplate: { type: String, default: DEFAULT_CONFIG.seo.titleTemplate },
        description:   { type: String, default: DEFAULT_CONFIG.seo.description },
    },
    navigation: {
        tabs: {
            type: [{ key: String, label: String, href: String, icon: String }],
            default: DEFAULT_CONFIG.navigation.tabs,
        },
    },
    content: {
        policyTitle: { type: String, default: DEFAULT_CONFIG.content.policyTitle },
        policy: {
            type: [{ title: String, body: [String] }],
            default: DEFAULT_CONFIG.content.policy,
        },
        faqs: {
            type: [{ q: String, a: String }],
            default: DEFAULT_CONFIG.content.faqs,
        },
        footer: {
            columns: {
                type: [{ title: String, links: [{ name: String, redirect: String, internal: Boolean }] }],
                default: DEFAULT_CONFIG.content.footer.columns,
            },
            company: {
                name:       { type: String, default: DEFAULT_CONFIG.content.footer.company.name },
                mailUs:     { type: String, default: DEFAULT_CONFIG.content.footer.company.mailUs },
                registered: { type: String, default: DEFAULT_CONFIG.content.footer.company.registered },
                cin:        { type: String, default: DEFAULT_CONFIG.content.footer.company.cin },
                telephone:  { type: String, default: DEFAULT_CONFIG.content.footer.company.telephone },
            },
            shortcuts: {
                type: [{ label: String, href: String, icon: String }],
                default: DEFAULT_CONFIG.content.footer.shortcuts,
            },
            copyright: { type: String,  default: DEFAULT_CONFIG.content.footer.copyright },
            since:     { type: Number,  default: DEFAULT_CONFIG.content.footer.since },
        },
    },
    chat: {
        welcomeMessage: { type: String, default: DEFAULT_CONFIG.chat.welcomeMessage },
    },
    theme:     { type: themeSchema, default: () => ({ ...DEFAULT_THEME }) },
    updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('SiteConfig', siteConfigSchema);
module.exports.DEFAULT_CONFIG = DEFAULT_CONFIG;
module.exports.DEFAULT_THEME  = DEFAULT_THEME;
