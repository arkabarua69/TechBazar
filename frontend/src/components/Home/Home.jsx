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
      <MetaData title="Online Shopping Site for Mobiles, Electronics, Furniture, Grocery, Lifestyle, Books & More. Best Offers!" />

      <Categories />

      <main className="w-full sm:w-11/12 mx-auto flex flex-col gap-8 px-3 sm:px-4 pb-14 mt-3 sm:mt-6">
        {/* 2. magazine hero: 70/30 desktop, stacked mobile */}
        <Hero hero={config.hero} />

        {/* 3. trust badges: 4-across desktop, 2x2 mobile */}
        <TrustBadges badges={config.trustBadges} />

        {/* 4. flash sale + countdown */}
        <FlashSale flashSale={config.flashSale} products={productList} />

        {/* 4b. featured picks — admin-selected (★) products come first */}
        <FeaturedProducts products={productList} loading={loading} />

        {/* 5. product grid: 4 cols desktop / 2 cols mobile */}
        <ProductGrid products={productList} loading={loading} />

        {/* category + featured collections */}
        <CategoryShowcase />

        {/* 6. how to order — 3 steps */}
        <HowToOrder steps={config.howToOrder} />

        {/* 7. customer reviews / social proof */}
        <Reviews reviews={config.reviews} />
      </main>
    </>
  );
};

export default Home;
