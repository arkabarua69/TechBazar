import { Link } from 'react-router-dom';
import { useSiteConfig } from '../../context/SiteConfigContext';
import { categoryImage } from '../../utils/categoryIcons';

const norm = (c) => String(typeof c === 'string' ? c : c?.name || '').trim();

// MegaMart-style circular category grid
const CategoryShowcase = ({ categories }) => {
    const { config } = useSiteConfig();
    const source = Array.isArray(categories) && categories.length
        ? categories
        : (Array.isArray(config.categories) ? config.categories : []);
    const list = source.map(norm).filter(Boolean);

    if (!list.length) return null;

    return (
        <div
            className="overflow-x-auto no-scrollbar rounded-xl p-4"
            style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
            }}
        >
            <div className="flex items-start gap-4 sm:gap-6 min-w-max sm:min-w-0 sm:justify-between">
                {list.map((name) => {
                    return (
                        <Link
                            key={name}
                            to={`/products?category=${encodeURIComponent(name)}`}
                            className="flex flex-col items-center gap-2 group shrink-0"
                        >
                            {/* Circle icon */}
                            <div
                                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center overflow-hidden border-2 transition-all duration-200"
                                style={{
                                    backgroundColor: 'var(--color-bg-alt, #fff8f5)',
                                    borderColor: 'var(--color-border)',
                                }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-accent)'}
                                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
                            >
                                <img
                                    draggable="false"
                                    src={categoryImage(name)}
                                    alt={name}
                                    className="w-10 h-10 sm:w-11 sm:h-11 object-contain"
                                />
                            </div>
                            <span
                                className="text-[11px] sm:text-xs font-medium text-center leading-tight max-w-[70px] transition-colors"
                                style={{ color: 'var(--color-text-secondary)' }}
                                onMouseEnter={e => e.currentTarget.style.color = 'var(--color-accent)'}
                                onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-secondary)'}
                            >
                                {name}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};

export default CategoryShowcase;
