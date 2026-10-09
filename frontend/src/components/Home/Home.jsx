import { useEffect, useState } from 'react';
import axios from 'axios';
import Categories from '../Layouts/Categories';
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

const Home = () => {

  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();

  const { error, loading, products } = useSelector((state) => state.products);

  // homepage content managed from Admin → Homepage
  const [config, setConfig] = useState(DEFAULT_SITE_CONFIG);

  useEffect(() => {
    axios.get('/api/v1/siteconfig', { headers: { Accept: 'application/json' } })
      .then((res) => res.data && res.data.config && setConfig({ ...DEFAULT_SITE_CONFIG, ...res.data.config }))
      .catch(() => { /* keep defaults */ });
  }, []);

  useEffect(() => {
    if (error) {
      enqueueSnackbar(error, { variant: "error" });
      dispatch(clearErrors());
    }
    dispatch(getSliderProducts());
  }, [dispatch, error, enqueueSnackbar]);

  const productList = products || [];

  return (
    <>
      <MetaData title="TechBazar — Online Shopping for Mobiles, Electronics, Fashion, Appliances, Furniture & More. Best Offers!" />

      <Categories />

      {/* ── centered-column layout ──────────────────────────
          full-bleed background bands span the viewport while all
          content lives in a max-w-4xl column — generous,
          intentional empty space on the left and right sides. */}

      {/* hero band — background bleeds edge-to-edge, content centered */}
      <section className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-100 border-b border-line">
        <div className="mx-auto max-w-4xl px-5 sm:px-6 py-6 sm:py-10">
          <Hero hero={config.hero} />
        </div>
      </section>

      {/* main centered content column */}
      <main className="mx-auto max-w-4xl px-5 sm:px-6 flex flex-col gap-10 pb-16 mt-6 sm:mt-8">

        {/* trust badges: 4-across desktop, 2x2 mobile */}
        <TrustBadges badges={config.trustBadges} />

        {/* flash sale + countdown */}
        <FlashSale flashSale={config.flashSale} products={productList} />

        {/* featured picks — admin-selected (★) products come first */}
        <FeaturedProducts products={productList} loading={loading} />

        {/* product grid: 4 cols desktop / 2 cols mobile */}
        <ProductGrid products={productList} loading={loading} />

        {/* category + featured collections */}
        <CategoryShowcase />

      </main>

      {/* how-to-order band — second full-bleed section for rhythm */}
      <section className="bg-blue-50/50 border-y border-line">
        <div className="mx-auto max-w-4xl px-5 sm:px-6 py-8 sm:py-12">
          <HowToOrder steps={config.howToOrder} />
        </div>
      </section>

      {/* reviews — back to the centered white column */}
      <main className="mx-auto max-w-4xl px-5 sm:px-6 flex flex-col gap-10 pb-16 mt-6 sm:mt-8">
        <Reviews reviews={config.reviews} />
      </main>
    </>
  );
};

export default Home;
