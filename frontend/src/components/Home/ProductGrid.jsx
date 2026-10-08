import SectionHeader from './SectionHeader';
import ProductCard from './ProductCard';
import SkeletonGrid from './SkeletonGrid';

// Main product grid — 4 columns on desktop, 2 columns on mobile (12-16 products)
const ProductGrid = ({ products = [], loading, title = 'জনপ্রিয় পণ্যসমূহ', tagline = 'Business Koro থেকে রিয়েল পণ্য — ছবি, দাম ও COD ব্যাজ সহ' }) => {
    const list = (products || [])
        .filter((p) => p && p.images && p.images[0])
        .slice(0, 16);

    return (
        <section>
            <SectionHeader
                title={title}
                tagline={tagline}
                href="/products"
                linkLabel="সব পণ্য দেখুন"
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
