import SectionHeader from './SectionHeader';
import ProductCard from './ProductCard';
import SkeletonGrid from './SkeletonGrid';

const GADGET_CATEGORIES = ['Electronics', 'Mobiles', 'Laptops'];

// Hot gadgets: electronics / mobiles / laptops highlight grid
const HotGadgets = ({ products = [], loading }) => {
    const gadgets = products
        .filter((p) => p && p.images && p.images[0] && GADGET_CATEGORIES.includes(p.category))
        .slice(0, 8);

    // fall back to a mixed grid when the catalogue has no gadget category yet
    const list = gadgets.length >= 4
        ? gadgets
        : products.filter((p) => p && p.images && p.images[0]).slice(0, 8);

    return (
        <section>
            <SectionHeader
                title="Hot Gadgets"
                tagline="Trending tech everyone is talking about"
                href={`/products?category=${encodeURIComponent('Electronics')}`}
                linkLabel="See All Gadgets"
            />
            {loading && list.length === 0 ? (
                <SkeletonGrid />
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    {list.map((product) => (
                        <ProductCard key={product._id} product={product} />
                    ))}
                </div>
            )}
        </section>
    );
};

export default HotGadgets;
