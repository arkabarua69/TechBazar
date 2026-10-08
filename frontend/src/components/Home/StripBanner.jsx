// Trust strip: COD, fast delivery, original guarantee, easy returns
const perks = [
    {
        title: 'Cash on Delivery',
        note: 'Pay when it arrives',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-6 h-6">
                <rect x="2" y="6" width="20" height="12" rx="2" />
                <circle cx="12" cy="12" r="2.5" />
            </svg>
        ),
    },
    {
        title: 'Fast Delivery',
        note: '2–4 days nationwide',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-6 h-6">
                <path d="M3 7h11v9H3z" />
                <path d="M14 10h4l3 3v3h-7z" />
                <circle cx="7" cy="18" r="2" />
                <circle cx="17.5" cy="18" r="2" />
            </svg>
        ),
    },
    {
        title: 'Original Guarantee',
        note: '100% genuine gadgets',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-6 h-6">
                <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
                <path d="M9 12l2 2 4-4" />
            </svg>
        ),
    },
    {
        title: 'Easy Returns',
        note: '7-day hassle free',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-6 h-6">
                <path d="M4 9a8 8 0 0 1 14-3" />
                <path d="M20 15a8 8 0 0 1-14 3" />
                <path d="M18 3v4h-4" />
                <path d="M6 21v-4h4" />
            </svg>
        ),
    },
];

const StripBanner = () => {
    return (
        <section className="surface p-4 sm:p-5">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {perks.map((perk) => (
                    <div
                        key={perk.title}
                        className="flex items-center gap-3 rounded-lg border border-line bg-cloud px-3 py-3 sm:px-4"
                    >
                        <span className="shrink-0 w-11 h-11 rounded-lg bg-primary-accent/10 text-primary-accent flex items-center justify-center">
                            {perk.icon}
                        </span>
                        <span className="flex flex-col min-w-0">
                            <span className="text-sm font-bold text-slate-900 leading-tight">{perk.title}</span>
                            <span className="text-xs text-slate-500 leading-tight">{perk.note}</span>
                        </span>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default StripBanner;
