import { Link } from 'react-router-dom';
import { useSiteConfig } from '../../context/SiteConfigContext';
import phone from '../../assets/images/Categories/phone.png';
import fashion from '../../assets/images/Categories/fashion.png';
import electronics from '../../assets/images/Categories/electronics.png';
import home from '../../assets/images/Categories/home.png';
import travel from '../../assets/images/Categories/travel.png';
import appliances from '../../assets/images/Categories/appliances.png';
import furniture from '../../assets/images/Categories/furniture.png';
import beauty from '../../assets/images/Categories/beauty.png';
import grocery from '../../assets/images/Categories/grocery.png';

// Icon + tagline per category keyword. Categories come from Admin → Config
// (config.categories); unknown names fall back to a sensible default so the
// grid always renders whatever the admin has configured.
const ICON_MAP = {
    mobile: phone, mobiles: phone, phone: phone, phones: phone, smartphone: phone, smartphones: phone,
    cosmetics: beauty, beauty: beauty,
    electronics: electronics, gadgets: electronics, laptop: electronics, laptops: electronics,
    furniture: furniture,
    watches: travel, watch: travel, travel: travel,
    decor: home, home: home, 'home & living': home,
    accessories: appliances, appliances: appliances, appliance: appliances,
    grocery: grocery, groceries: grocery,
    fashion: fashion, clothing: fashion, apparel: fashion,
};

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
                    const key = name.toLowerCase();
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
                                    src={ICON_MAP[key] || electronics}
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
