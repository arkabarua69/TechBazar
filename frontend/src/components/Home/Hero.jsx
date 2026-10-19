import { Link } from 'react-router-dom';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useState } from 'react';

// MegaMart layout:
//  desktop → main banner (70%) + two stacked side cards (30%)
//  mobile  → stacked banner with bottom cards row
const Hero = ({ hero = {} }) => {
    const sideTop = hero.sideTop || {};
    const sideBottom = hero.sideBottom || {};
    const [slide, setSlide] = useState(0);

    const QuickCard = ({ card, className = '' }) => (
        <Link
            to={card.link || '/products'}
            className={`group relative overflow-hidden rounded-xl flex items-end min-h-[8rem] sm:min-h-[10rem] transition-all duration-300 hover:shadow-lg ${className}`}
            style={
                card.image
                    ? {
                        backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.75), rgba(0,0,0,0.15)), url(${card.image})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }
                    : { backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }
            }
        >
            <div className={`relative p-3 sm:p-4 w-full ${card.image ? 'text-white' : 'text-slate-900'}`}>
                <p className="font-bold text-sm sm:text-base leading-tight">{card.title}</p>
                <p className={`text-xs mt-0.5 line-clamp-1 ${card.image ? 'text-white/80' : 'text-slate-500'}`}>{card.subtitle}</p>
                <span
                    className="inline-flex items-center gap-1 text-[11px] font-semibold mt-2 rounded-full px-2.5 py-1 transition-all"
                    style={{ backgroundColor: 'var(--color-accent)', color: '#fff' }}
                >
                    Shop now →
                </span>
            </div>
        </Link>
    );

    // Dot indicators for the main banner (like MegaMart)
    const dots = 5;

    return (
        <section className="grid grid-cols-1 lg:grid-cols-[7fr_3fr] gap-3 sm:gap-4">

            {/* ── Main banner (70%) ── */}
            <div className="relative overflow-hidden rounded-2xl group">
                <div
                    className="min-h-[14rem] sm:min-h-[18rem] lg:min-h-[22rem] flex items-center relative"
                    style={{
                        backgroundImage: `linear-gradient(100deg, rgba(2,6,23,.92) 30%, rgba(2,6,23,.5) 65%, rgba(2,6,23,.1)), url(${hero.image})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                >
                    {/* Content */}
                    <div className="relative p-5 sm:p-8 lg:p-10 max-w-xl text-white">
                        {hero.badge && (
                            <span
                                className="inline-flex w-fit items-center text-[11px] font-bold uppercase tracking-widest rounded-full px-3 py-1.5 mb-3"
                                style={{ backgroundColor: 'var(--color-accent)', color: '#fff' }}
                            >
                                {hero.badge}
                            </span>
                        )}
                        <h1 className="font-bold text-2xl sm:text-3xl lg:text-4xl xl:text-5xl leading-tight">
                            {hero.title}
                        </h1>
                        <p className="text-white/80 text-sm sm:text-base mt-2 max-w-md">
                            {hero.subtitle}
                        </p>
                        <Link
                            to={hero.buttonLink || '/products'}
                            className="inline-flex items-center gap-2 mt-5 px-6 py-3 rounded-full font-semibold text-sm sm:text-base transition-all duration-200 hover:-translate-y-0.5"
                            style={{ backgroundColor: 'var(--color-accent)', color: '#fff', boxShadow: '0 4px 14px rgba(232,75,15,0.4)' }}
                        >
                            {hero.buttonLabel || 'Shop Now'}
                        </Link>
                    </div>

                    {/* Prev / Next arrows */}
                    <button
                        onClick={() => setSlide((s) => (s - 1 + dots) % dots)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 text-white hidden sm:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                        aria-label="Previous"
                    >
                        <ChevronLeftIcon sx={{ fontSize: '20px' }} />
                    </button>
                    <button
                        onClick={() => setSlide((s) => (s + 1) % dots)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 text-white hidden sm:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                        aria-label="Next"
                    >
                        <ChevronRightIcon sx={{ fontSize: '20px' }} />
                    </button>
                </div>

                {/* Dot indicators */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                    {Array.from({ length: dots }).map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setSlide(i)}
                            className="rounded-full transition-all duration-300"
                            style={{
                                width: slide === i ? '20px' : '6px',
                                height: '6px',
                                backgroundColor: slide === i ? '#fff' : 'rgba(255,255,255,0.5)',
                            }}
                            aria-label={`Slide ${i + 1}`}
                        />
                    ))}
                </div>
            </div>

            {/* ── Two side cards (30%) — stacked on desktop, row on mobile ── */}
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
                <QuickCard card={sideTop} />
                <QuickCard card={sideBottom} />
            </div>
        </section>
    );
};

export default Hero;
