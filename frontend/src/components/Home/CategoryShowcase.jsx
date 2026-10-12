import { Link } from 'react-router-dom';
import phone from '../../assets/images/Categories/phone.png';
import fashion from '../../assets/images/Categories/fashion.png';
import electronics from '../../assets/images/Categories/electronics.png';
import home from '../../assets/images/Categories/home.png';
import travel from '../../assets/images/Categories/travel.png';
import appliances from '../../assets/images/Categories/appliances.png';
import furniture from '../../assets/images/Categories/furniture.png';
import beauty from '../../assets/images/Categories/beauty.png';
import grocery from '../../assets/images/Categories/grocery.png';

const collections = [
    { name: 'Mobile',      tagline: '5G phones & more', icon: phone },
    { name: 'Cosmetics',   tagline: 'Beauty & care',    icon: beauty },
    { name: 'Electronics', tagline: 'Gadgets & audio',  icon: electronics },
    { name: 'Furniture',   tagline: 'Work & living',    icon: furniture },
    { name: 'Watches',     tagline: 'Style & smart',    icon: travel },
    { name: 'Decor',       tagline: 'Home styling',     icon: home },
    { name: 'Accessories', tagline: 'Bags & more',      icon: appliances },
    { name: 'Grocery',     tagline: 'Daily needs',      icon: grocery },
    { name: 'Fashion',     tagline: 'Everyday styles',  icon: fashion },
];

// MegaMart-style circular category grid: 7 items in one scrollable row
const CategoryShowcase = () => (
    <div
        className="overflow-x-auto no-scrollbar rounded-xl p-4"
        style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
        }}
    >
        <div className="flex items-start gap-4 sm:gap-6 min-w-max sm:min-w-0 sm:justify-between">
            {collections.map((item) => (
                <Link
                    key={item.name}
                    to={`/products?category=${encodeURIComponent(item.name)}`}
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
                            src={item.icon}
                            alt={item.name}
                            className="w-10 h-10 sm:w-11 sm:h-11 object-contain"
                        />
                    </div>
                    <span
                        className="text-[11px] sm:text-xs font-medium text-center leading-tight max-w-[70px] transition-colors"
                        style={{ color: 'var(--color-text-secondary)' }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--color-accent)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-secondary)'}
                    >
                        {item.name}
                    </span>
                </Link>
            ))}
        </div>
    </div>
);

export default CategoryShowcase;
