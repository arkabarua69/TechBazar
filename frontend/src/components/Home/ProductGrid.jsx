import SectionHeader from './SectionHeader';
import ProductCard from './ProductCard';
import SkeletonGrid from './SkeletonGrid';

// Main product grid — 4 columns on desktop, 2 columns on mobile (12-16 products)
const ProductGrid = ({ products = [], loading, title = 'Popular Products', tagline = 'Real products from Business Koro — images, prices & COD badge' }) => {
    const list = (products || [])
        .filter((p) => p && p.images && p.images[0])
        .slice(0, 16);

    return (
        <section>
            <SectionHeader
                title={title}
                tagline={tagline}
                href="/products"
                linkLabel="View All"
            />
            {loading && list.length === 0 ? (
                <SkeletonGrid />
            ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {list.map((product) => (
                        <ProductCard key={product._id} product={product} />
                    ))}
                </div>
            )}
        </section>
    );
};

export default ProductGrid;
