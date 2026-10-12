import mobiles from '../../assets/images/Categories/phone.png';
import fashion from '../../assets/images/Categories/fashion.png';
import electronics from '../../assets/images/Categories/electronics.png';
import home from '../../assets/images/Categories/home.png';
import travel from '../../assets/images/Categories/travel.png';
import appliances from '../../assets/images/Categories/appliances.png';
import furniture from '../../assets/images/Categories/furniture.png';
import beauty from '../../assets/images/Categories/beauty.png';
import grocery from '../../assets/images/Categories/grocery.png';
import { Link } from 'react-router-dom';

const catNav = [
    { name: 'Mobiles',            icon: mobiles },
    { name: 'Fashion',            icon: fashion },
    { name: 'Electronics',        icon: electronics },
    { name: 'Home',               icon: home },
    { name: 'Travel',             icon: travel },
    { name: 'Appliances',         icon: appliances },
    { name: 'Furniture',          icon: furniture },
    { name: 'Beauty, Toys & more',icon: beauty },
    { name: 'Grocery',            icon: grocery },
];

// MegaMart-style circular icon categories (shown only on desktop,
// mobile uses the BottomBar + MenuDrawer)
const Categories = () => (
    <section
        className="hidden sm:block w-full py-2"
        style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}
    >
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
            <div className="flex items-start justify-between overflow-x-auto no-scrollbar">
                {catNav.map((item) => (
                    <Link
                        to={`/products?category=${encodeURIComponent(item.name)}`}
                        key={item.name}
                        className="flex flex-col items-center gap-1.5 p-3 group shrink-0"
                    >
                        {/* Circular icon — matches MegaMart layout */}
                        <div
                            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center overflow-hidden border-2 transition-all duration-200"
                            style={{
                                borderColor: 'var(--color-border)',
                                backgroundColor: 'var(--color-bg-alt, #fff8f5)',
                            }}
                        >
                            <img
                                draggable="false"
                                className="h-10 w-10 sm:h-11 sm:w-11 object-contain"
                                src={item.icon}
                                alt={item.name}
                            />
                        </div>
                        <span
                            className="text-[11px] sm:text-xs font-medium text-center leading-tight max-w-[72px] transition-colors"
                            style={{ color: 'var(--color-text-secondary)' }}
                        >
                            {item.name}
                        </span>
                    </Link>
                ))}
            </div>
        </div>
    </section>
);

export default Categories;
