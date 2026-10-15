import SectionHeader from './SectionHeader';
import ProductCard from './ProductCard';
import SkeletonGrid from './SkeletonGrid';

// Featured products: admin picks (star) first, then best rated / most reviewed
const FeaturedProducts = ({ products = [], loading }) => {
    const withImage = products.filter((p) => p && p.images && p.images[0]);
    const adminPicks = withImage.filter((p) => p.featured);
    const featured = (adminPicks.length > 0 ? adminPicks : [...withImage]
        .sort((a, b) => {
            const ratingDiff = (b.ratings || 0) - (a.ratings || 0);
            if (ratingDiff !== 0) return ratingDiff;
            return (b.numOfReviews || 0) - (a.numOfReviews || 0);
        }))
        .slice(0, 8);

    return (
        <section>
            <SectionHeader
                title="Featured Products"
                tagline="Top rated by shoppers this week"
                href="/products"
                linkLabel="Browse Collection"
            />
            {loading && featured.length === 0 ? (
                <SkeletonGrid />
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    {featured.map((product) => (
                        <ProductCard key={product._id} product={product} />
                    ))}
                </div>
            )}
        </section>
    );
};

export default FeaturedProducts;
