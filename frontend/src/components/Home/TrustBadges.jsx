// Trust badges: 4 cards side by side on desktop, 2x2 grid on mobile
const TrustBadges = ({ badges = [] }) => {
    if (!badges.length) return null;

    return (
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {badges.map((badge, i) => (
                <div key={i} className="surface p-4 sm:p-5 flex flex-col items-center text-center gap-2 hover:shadow-md hover:-translate-y-0.5 transition duration-200">
                    <span className="text-2xl sm:text-3xl">{badge.icon}</span>
                    <p className="font-display font-semibold text-slate-900 text-sm sm:text-base">{badge.title}</p>
                    <p className="text-xs text-slate-500 leading-snug">{badge.description}</p>
                </div>
            ))}
        </section>
    );
};

export default TrustBadges;
