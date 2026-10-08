import { Link } from 'react-router-dom';
import SectionHeader from './SectionHeader';

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
    { name: 'Mobiles', tagline: '5G phones & more', icon: phone },
    { name: 'Electronics', tagline: 'Gadgets & audio', icon: electronics },
    { name: 'Fashion', tagline: 'Everyday styles', icon: fashion },
    { name: 'Appliances', tagline: 'Home essentials', icon: appliances },
    { name: 'Furniture', tagline: 'Work & living', icon: furniture },
    { name: 'Home', tagline: 'Decor & kitchen', icon: home },
    { name: 'Grocery', tagline: 'Daily needs', icon: grocery },
    { name: 'Beauty,Toys & more', tagline: 'Gifting picks', icon: beauty },
    { name: 'Travel', tagline: 'Bags & gear', icon: travel },
];

// Category & featured collection tiles
const CategoryShowcase = () => {
    return (
        <section>
            <SectionHeader
                title="Shop by Category"
                tagline="Curated collections, updated weekly"
                href="/products"
                linkLabel="All Products"
            />

            <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                {collections.map((item) => (
                    <Link
                        key={item.name}
                        to={`/products?category=${encodeURIComponent(item.name)}`}
                        className="surface group flex flex-col items-center gap-2 py-4 px-2 text-center hover:shadow-lg hover:-translate-y-0.5 transition duration-200"
                    >
                        <span className="w-14 h-14 rounded-full bg-cloud border border-line flex items-center justify-center overflow-hidden group-hover:border-primary-accent transition duration-200">
                            <img src={item.icon} alt={item.name} draggable="false" className="w-9 h-9 object-contain" />
                        </span>
                        <span className="flex flex-col">
                            <span className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-primary-accent transition duration-200 leading-tight">
                                {item.name}
                            </span>
                            <span className="text-xxs text-slate-500 mt-0.5">{item.tagline}</span>
                        </span>
                    </Link>
                ))}
            </div>
        </section>
    );
};

export default CategoryShowcase;
