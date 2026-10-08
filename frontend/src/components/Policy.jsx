// Static policy page (linked from the mobile menu drawer & footer)
const Policy = () => {
    const sections = [
        {
            title: 'প্রাইভেসি পলিসি',
            body: [
                'আপনার নাম, মোবাইল নম্বর ও ঠিকানা শুধুমাত্র অর্ডার সম্পন্ন করার জন্য ব্যবহার করা হয়।',
                'আপনার ব্যক্তিগত তথ্য কোনো তৃতীয় পক্ষকে বিক্রি বা শেয়ার করা হয় না।',
                'পেমেন্টের TrxID শুধু ডেলিভারি চার্জ যাচাই করার জন্য সংরক্ষণ করা হয়।',
            ],
        },
        {
            title: 'রিটার্ন ও রিপ্লেসমেন্ট',
            body: [
                'পণ্য হাতে পাওয়ার ৭ দিনের মধ্যে কোনো সমস্যা থাকলে রিপ্লেসমেন্ট করা হবে।',
                'পণ্য ব্যবহার করা বা ক্ষতিগ্রস্ত অবস্থায় থাকলে রিটার্ন গ্রহণ করা হবে না।',
                'হটলাইন বা WhatsApp-এ অর্ডার আইডি ও সমস্যার ছবি পাঠান — ২৪ ঘণ্টার মধ্যে সমাধান।',
            ],
        },
        {
            title: 'ডেলিভারি ও পেমেন্ট',
            body: [
                'পণ্যের পুরো দাম ক্যাশ অন ডেলিভারি (COD) — পণ্য হাতে পেয়ে টাকা দেবেন।',
                'ডেলিভারি চার্জ অগ্রিম: ঢাকার ভেতরে ৳৭০, ঢাকার বাইরে ৳১৩০ — বিকাশ বা নগদে Send Money করে TrxID দিন।',
                'ঢাকায় ২৪-৪৮ ঘণ্টা, ঢাকার বাইরে ৪৮-৭২ ঘণ্টার মধ্যে ডেলিভারি সম্পন্ন হয়।',
            ],
        },
        {
            title: 'ওয়ারেন্টি',
            body: [
                'সকল গ্যাজেট জেনুইন ও অফিসিয়াল ওয়ারেন্টি সহ আসে (পণ্যভেদে ৬-১২ মাস)।',
                'ওয়ারেন্টি কার্ড বা ইনভয়েস সংরক্ষণ করুন — সেবার সময় প্রয়োজন হবে।',
            ],
        },
    ];

    return (
        <main className="w-full mt-4 md:mt-6 pb-10">
            <div className="w-full sm:w-10/12 lg:w-7/12 mx-auto px-3 sm:px-4 flex flex-col gap-4">
                <h1 className="font-display font-extrabold text-xl sm:text-2xl text-slate-900">
                    প্রাইভেসি ও রিটার্ন পলিসি
                </h1>

                {sections.map((section) => (
                    <section key={section.title} className="surface p-4 sm:p-5">
                        <h2 className="font-display font-bold text-base sm:text-lg text-slate-900 mb-2">
                            {section.title}
                        </h2>
                        <ul className="flex flex-col gap-1.5">
                            {section.body.map((line, i) => (
                                <li key={i} className="text-xs sm:text-sm text-slate-600 leading-relaxed flex gap-2">
                                    <span className="text-primary-accent mt-0.5">•</span>
                                    <span>{line}</span>
                                </li>
                            ))}
                        </ul>
                    </section>
                ))}
            </div>
        </main>
    );
};

export default Policy;
