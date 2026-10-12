import { useEffect, useState } from 'react';
import axios from 'axios';
import Hero from './Hero';
import TrustBadges from './TrustBadges';
import FlashSale from './FlashSale';
import FeaturedProducts from './FeaturedProducts';
import ProductGrid from './ProductGrid';
import CategoryShowcase from './CategoryShowcase';
import HowToOrder from './HowToOrder';
import Reviews from './Reviews';
import { useDispatch, useSelector } from 'react-redux';
import { clearErrors, getSliderProducts } from '../../actions/productAction';
import { useSnackbar } from 'notistack';
import MetaData from '../Layouts/MetaData';
import { DEFAULT_SITE_CONFIG } from '../../utils/siteConfig';
import { Link } from 'react-router-dom';
import { useSiteConfig } from '../../context/SiteConfigContext';

// Section header matching MegaMart style:
// "Grab the best deal on <colored keyword>" + "View All >"
const SectionHeader = ({ title, accent, viewAllLink = '/products' }) => (
    <div className="flex items-center justify-between mb-4">
        <h2 className="text-base sm:text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {title}{' '}
            {accent && (
                <span style={{ color: 'var(--color-accent)' }}>{accent}</span>
            )}
        </h2>
        <Link
            to={viewAllLink}
            className="flex items-center gap-1 text-sm font-semibold transition-colors"
            style={{ color: 'var(--color-accent)' }}
        >
            View All
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
            </svg>
        </Link>
    </div>
);

const Home = () => {
    const dispatch = useDispatch();
    const { enqueueSnackbar } = useSnackbar();
    const { config: siteConfig } = useSiteConfig();

    const { error, loading, products } = useSelector((state) => state.products);

    const [config, setConfig] = useState(DEFAULT_SITE_CONFIG);

    useEffect(() => {
        axios.get('/api/v1/siteconfig', { headers: { Accept: 'application/json' } })
            .then((res) => res.data?.config && setConfig({ ...DEFAULT_SITE_CONFIG, ...res.data.config }))
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (error) {
            enqueueSnackbar(error, { variant: 'error' });
            dispatch(clearErrors());
        }
        dispatch(getSliderProducts());
    }, [dispatch, error, enqueueSnackbar]);

    const productList = products || [];
    const brandName = siteConfig.branding?.name || 'TechBazar';

    return (
        <>
            <MetaData title={`${brandName} — Online Shopping for Mobiles, Electronics, Fashion, Appliances & More`} />

            {/* ── Hero banner ── full container width */}
            <section style={{ backgroundColor: 'var(--color-bg-alt, var(--color-bg))' }}>
                <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-5">
                    <Hero hero={config.hero} />
                </div>
            </section>

            {/* ── Main content column ── */}
            <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 pb-16">

                {/* Trust badges */}
                <div className="py-4 sm:py-5">
                    <TrustBadges badges={config.trustBadges} />
                </div>

                {/* Flash Sale / Deal of the Day */}
                {config.flashSale?.enabled !== false && productList.length > 0 && (
                    <section className="mb-6">
                        <SectionHeader title="Grab the best deal on" accent="Smartphones" />
                        <FlashSale flashSale={config.flashSale} products={productList} />
                    </section>
                )}

                {/* Shop from Top Categories */}
                <section className="mb-6">
                    <SectionHeader title="Shop From" accent="Top Categories" viewAllLink="/products" />
                    <CategoryShowcase />
                </section>

                {/* Featured / Popular Products */}
                <section className="mb-6">
                    <SectionHeader title="Top" accent="Electronics Brands" viewAllLink="/products" />
                    <FeaturedProducts products={productList} loading={loading} />
                </section>

                {/* All products grid */}
                <section className="mb-6">
                    <SectionHeader title="Daily" accent="Essentials" viewAllLink="/products" />
                    <ProductGrid products={productList} loading={loading} />
                </section>

                {/* How to Order */}
                <section
                    className="rounded-2xl p-5 sm:p-8 mb-6"
                    style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                >
                    <SectionHeader title="How to" accent="Order" viewAllLink="/track" />
                    <HowToOrder steps={config.howToOrder} />
                </section>

                {/* Customer Reviews */}
                <section className="mb-6">
                    <SectionHeader title="Customer" accent="Reviews" viewAllLink="/products" />
                    <Reviews reviews={config.reviews} />
                </section>
            </main>
        </>
    );
};

export default Home;
