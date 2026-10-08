// Fallback homepage content used when GET /api/v1/siteconfig is unreachable.
// The live values always come from the backend (editable in Admin → Homepage).
export const DEFAULT_SITE_CONFIG = {
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
    // payment numbers, delivery charges & support contacts (admin editable)
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
    howToOrder: [
        { icon: '🛒', title: 'পণ্য পছন্দ করুন', description: "‘অর্ডার করুন’ বাটনে ক্লিক করুন।" },
        { icon: '📲', title: 'ডেলিভারি চার্জ পেমেন্ট', description: 'ঢাকার ভেতরে ৳৭০, বাইরে ৳১৩০ — বিকাশ বা নগদে দিন।' },
        { icon: '📦', title: 'পণ্য বুঝে নিন', description: 'কুরিয়ার থেকে পণ্য হাতে পেয়ে বাকি টাকা পরিশোধ করুন।' },
    ],
    reviews: [
        { name: 'রাকিব হাসান', district: 'ঢাকা', rating: 5, comment: 'অর্ডার করা পণ্য ঠিক সময়ে পেয়েছি, কোয়ালিটিও ভালো।' },
        { name: 'সাবিহা আক্তার', district: 'চট্টগ্রাম', rating: 5, comment: 'ডেলিভারি দুই দিনের মধ্যেই পেয়েছি, সাপোর্ট টিম খুব সহযোগী।' },
        { name: 'তানভীর আহমেদ', district: 'সিলেট', rating: 4, comment: 'দাম অন্য জায়গার চেয়ে কম, পণ্যও অরিজিনাল।' },
    ],
};
