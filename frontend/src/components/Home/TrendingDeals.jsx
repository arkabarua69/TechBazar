import SectionHeader from './SectionHeader';
import ProductCard from './ProductCard';
import SkeletonGrid from './SkeletonGrid';

const discountOf = (p) => {
    if (!p || !p.cuttedPrice) return 0;
    return ((p.cuttedPrice - p.price) / p.cuttedPrice) * 100;
};

// Trending deals: biggest discounts first
const TrendingDeals = ({ products = [], loading }) => {
    const deals = [...products]
        .filter((p) => p && p.images && p.images[0])
        .sort((a, b) => discountOf(b) - discountOf(a))
        .slice(0, 8);

    return (
        <section>
            <SectionHeader
                title="Trending Deals"
                tagline="Biggest price drops, handpicked for you"
                href="/products"
                linkLabel="View All Deals"
            />
            {loading && deals.length === 0 ? (
                <SkeletonGrid />
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    {deals.map((product) => (
                        <ProductCard key={product._id} product={product} />
                    ))}
                </div>
            )}
        </section>
    );
};

export default TrendingDeals;
