// Fallback homepage content used when GET /api/v1/siteconfig is unreachable.
// The live values always come from the backend (editable in Admin → Homepage).
// These values mirror backend/models/siteConfigModel.js DEFAULT_CONFIG (English).
export const DEFAULT_SITE_CONFIG = {
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
        { icon: 'AttachMoney',   title: 'Cash on Delivery', description: 'Pay once the product is in your hands' },
        { icon: 'FlashOn',       title: 'Fast Delivery', description: '24 hours in Dhaka, 48–72 hours outside Dhaka' },
        { icon: 'Verified',      title: 'Genuine Products', description: '100% original, quality assured' },
        { icon: 'HeadsetMic',    title: '24/7 Support', description: 'Call our hotline for any issue' },
    ],
    flashSale: {
        enabled: true,
        title: 'Deal of the Day',
        subtitle: 'Limited stock — order fast',
        endsAt: '23:59',
        note: 'Order before the offer ends',
    },
    payment: {
        bKashNumber: '01700000000',
        nagadNumber: '01700000000',
    },
    delivery: {
        insideDhaka: 70,
        outsideDhaka: 130,
    },
    support: {
        hotline: '01700000000',
        whatsapp: '8801700000000',
    },
    categories: [
        'Electronics',
        'Mobiles',
        'Laptops',
        'Fashion',
        'Appliances',
        'Home',
    ],
    howToOrder: [
        { icon: 'ShoppingCart', title: 'Choose Your Product', description: "Click the 'Order Now' button." },
        { icon: 'Payments',     title: 'Pay the Delivery Charge', description: 'Tk 70 inside Dhaka, Tk 130 outside — send via bKash or Nagad.' },
        { icon: 'Inventory2',   title: 'Receive Your Product', description: 'Pay the remaining amount to the courier on delivery.' },
    ],
    reviews: [
        { name: 'Rakib Hasan', district: 'Dhaka', rating: 5, comment: 'Received my order right on time and the quality is great. Cash on delivery made it feel trustworthy.' },
        { name: 'Sabrina Akter', district: 'Chittagong', rating: 5, comment: 'I paid the delivery charge in advance and got the product within two days. The support team is very helpful.' },
        { name: 'Tanvir Ahmed', district: 'Sylhet', rating: 4, comment: 'The price is lower than other places and the product is original. Will order again, God willing.' },
    ],
    branding: {
        name: 'My Store',
        tagline: 'The best products at affordable prices',
        logoUrl: '',
    },
    seo: {
        titleTemplate: '%s | My Store',
        description: 'My Store — shop the latest products at affordable prices with cash on delivery nationwide.',
    },
    navigation: {
        tabs: [
            { key: 'home', label: 'Home', href: '/', icon: 'Home' },
            { key: 'shop', label: 'Shop', href: '/products', icon: 'Storefront' },
            { key: 'cart', label: 'Cart', href: '/cart', icon: 'ShoppingCart' },
            { key: 'orders', label: 'Orders', href: '/orders', icon: 'Inventory2' },
        ],
    },
    content: {
        policyTitle: 'Privacy & Return Policy',
        policy: [
            {
                title: 'Privacy Policy',
                body: [
                    'Your name, mobile number and address are used only to complete your order.',
                    'Your personal information is never sold or shared with any third party.',
                    'Payment TrxIDs are stored only to verify the delivery charge.',
                ],
            },
            {
                title: 'Returns & Replacement',
                body: [
                    'Any issue within 7 days of receiving the product will be replaced.',
                    'Products that are used or damaged cannot be returned.',
                    'Send your order ID and photos of the issue via hotline or WhatsApp — resolved within 24 hours.',
                ],
            },
            {
                title: 'Delivery & Payment',
                body: [
                    'The full product price is cash on delivery (COD) — pay when the product is in your hands.',
                    'Delivery charge in advance: Tk 70 inside Dhaka, Tk 130 outside — send via bKash or Nagad and share the TrxID.',
                    'Delivery completes within 24–48 hours in Dhaka, 48–72 hours outside Dhaka.',
                ],
            },
            {
                title: 'Warranty',
                body: [
                    'All gadgets come with genuine official warranty (6–12 months depending on the product).',
                    'Keep the warranty card or invoice — it is needed for service.',
                ],
            },
        ],
        faqs: [
            { q: 'What happens when I update my email address (or mobile number)?', a: "Your login email id (or mobile number) changes, likewise. You'll receive all your account related communication on your updated email address (or mobile number)." },
            { q: 'When will my account be updated with the new email address (or mobile number)?', a: 'It happens as soon as you confirm the verification code sent to your email (or mobile) and save the changes.' },
            { q: 'What happens to my existing account when I update my email address (or mobile number)?', a: "Updating your email address (or mobile number) doesn't invalidate your account. Your account remains fully functional. You'll continue seeing your Order history, saved information and personal details." },
            { q: 'Does my Seller account get affected when I update my email address?', a: "We have a 'single sign-on' policy. Any changes will reflect in your Seller account also." },
        ],
        footer: {
            columns: [
                {
                    title: 'about',
                    links: [
                        { name: 'Contact Us', redirect: '/track', internal: true },
                        { name: 'About Us', redirect: '/policy', internal: true },
                        { name: 'Careers', redirect: '/policy', internal: true },
                        { name: 'Our Stories', redirect: '/policy', internal: true },
                        { name: 'Press', redirect: '/policy', internal: true },
                        { name: 'Wholesale', redirect: '/policy', internal: true },
                        { name: 'Corporate Information', redirect: '/policy', internal: true },
                    ],
                },
                {
                    title: 'help',
                    links: [
                        { name: 'Payments', redirect: '/policy', internal: true },
                        { name: 'Shipping', redirect: '/policy', internal: true },
                        { name: 'Cancellation & Returns', redirect: '/policy', internal: true },
                        { name: 'FAQ', redirect: '/policy', internal: true },
                    ],
                },
                {
                    title: 'policy',
                    links: [
                        { name: 'Return Policy', redirect: '/policy', internal: true },
                        { name: 'Terms Of Use', redirect: '/policy', internal: true },
                        { name: 'Security', redirect: '/policy', internal: true },
                        { name: 'Privacy', redirect: '/policy', internal: true },
                        { name: 'Sitemap', redirect: '/policy', internal: true },
                        { name: 'EPR Compliance', redirect: '/policy', internal: true },
                    ],
                },
                {
                    title: 'social',
                    links: [
                        { name: 'Facebook', redirect: 'https://www.facebook.com', internal: false },
                        { name: 'Twitter', redirect: 'https://twitter.com', internal: false },
                        { name: 'YouTube', redirect: 'https://www.youtube.com', internal: false },
                    ],
                },
            ],
            company: {
                name: 'My Store Private Limited',
                mailUs: '',
                registered: '',
                cin: '',
                telephone: '',
            },
            shortcuts: [
                { label: 'Sell On Our Store', href: '/policy', icon: 'Work' },
                { label: 'Advertise', href: '/policy', icon: 'Stars' },
                { label: 'Gift Cards', href: '/policy', icon: 'CardGiftcard' },
                { label: 'Help Center', href: '/track', icon: 'Help' },
            ],
            copyright: 'MyStore.com',
            since: 2007,
        },
    },
    chat: {
        welcomeMessage: 'Hello! I would like to know about a product or an order.',
    },
    theme: {
        colorAccent:           '#E84B0F',
        colorAccentHover:      '#C63E0A',
        colorSuccess:          '#16a34a',
        colorWarning:          '#f59e0b',
        colorDanger:           '#ef4444',
        colorBg:               '#FAE5D3',
        colorSurface:          '#FFFFFF',
        colorBorder:           '#F2D9C8',
        colorTextPrimary:      '#2D1B0E',
        colorTextSecondary:    '#7A5C48',
        colorTextMuted:        '#B8937A',
        colorHeader:           '#FFFFFF',
        colorHeaderText:       '#2D1B0E',
        colorFooter:           '#2D1B0E',
        colorFooterText:       '#B8937A',
        colorAnnouncement:     '#E84B0F',
        colorAnnouncementText: '#FFFFFF',
        btnRadius:             '2rem',
        btnStyle:              'filled',
        fontBody:              'Poppins',
        fontDisplay:           'Poppins',
        fontScale:             '1',
        darkMode:              false,
        containerWidth:        '1280px',
        cardRadius:            '1.25rem',
    },
};
