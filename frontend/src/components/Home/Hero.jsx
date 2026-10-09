import { Link } from 'react-router-dom';

// Magazine hero:
//  desktop → 70% big banner + 30% two stacked cards
//  mobile  → full-width banner + two quick cards below (1 tap to category/offer)
const Hero = ({ hero = {} }) => {
    const sideTop = hero.sideTop || {};
    const sideBottom = hero.sideBottom || {};

    const QuickCard = ({ card, className = '' }) => (
        <Link
            to={card.link || '/products'}
            className={`group relative overflow-hidden rounded-2xl border border-line min-h-[7rem] sm:min-h-[9rem] flex items-end ${className}`}
            style={card.image ? { backgroundImage: `linear-gradient(to top, rgba(15,23,42,.85), rgba(15,23,42,.15)), url(${card.image})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
        >
            <div className="relative p-4 text-white w-full">
                <p className="font-display font-bold text-sm sm:text-base leading-tight">{card.title}</p>
                <p className="text-xs text-white/80 mt-0.5 line-clamp-1">{card.subtitle}</p>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold mt-2 bg-white/20 border border-white/30 rounded-full px-2.5 py-1 group-hover:bg-white group-hover:text-slate-900 transition">
                    Shop now →
                </span>
            </div>
        </Link>
    );

    return (
        <section className="grid grid-cols-1 lg:grid-cols-[7fr_3fr] gap-4">
            {/* ── main banner (70%) ── */}
            <div
                className="relative overflow-hidden rounded-2xl border border-line min-h-[16rem] sm:min-h-[20rem] flex items-center"
                style={{
                    backgroundImage: `linear-gradient(100deg, rgba(2,6,23,.92) 30%, rgba(2,6,23,.45) 65%, rgba(2,6,23,.15)), url(${hero.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            >
                <div className="relative p-6 sm:p-10 max-w-xl text-white">
                    {hero.badge && (
                        <span className="inline-flex w-fit items-center text-[11px] font-bold uppercase tracking-widest bg-primary-accent border border-white/20 rounded-full px-3 py-1.5">
                            {hero.badge}
                        </span>
                    )}
                    <h1 className="font-display font-extrabold text-2xl sm:text-4xl lg:text-5xl leading-tight mt-4">
                        {hero.title}
                    </h1>
                    <p className="text-white/85 text-sm sm:text-base mt-3 max-w-md">
                        {hero.subtitle}
                    </p>
                    <div className="flex flex-wrap gap-3 mt-5">
                        <Link
                            to={hero.buttonLink || '/products'}
                            className="bg-white text-slate-900 font-bold rounded-lg px-6 py-3 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition duration-200"
                        >
                            {hero.buttonLabel || 'Shop Now'}
                        </Link>
                        <Link
                            to="/products"
                            className="border border-white/50 text-white font-semibold rounded-lg px-6 py-3 hover:bg-white/10 transition duration-200"
                        >
                            View All
                        </Link>
                    </div>
                    <div className="flex items-center gap-4 sm:gap-6 pt-5 text-white/80 text-xs">
                        <span className="font-semibold">COD</span>
                        <span className="w-1 h-1 rounded-full bg-white/50" />
                        <span className="font-semibold">Replacement</span>
                        <span className="w-1 h-1 rounded-full bg-white/50" />
                        <span className="font-semibold">Nationwide</span>
                    </div>
                </div>
            </div>

            {/* ── two side cards (30%) — stack on desktop, side-by-side on mobile ── */}
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
                <QuickCard card={sideTop} />
                <QuickCard card={sideBottom} />
            </div>
        </section>
    );
};

export default Hero;
