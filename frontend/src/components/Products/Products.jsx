import Pagination from '@mui/material/Pagination';
import Slider from '@mui/material/Slider';
import SearchIcon from '@mui/icons-material/Search';
import TuneIcon from '@mui/icons-material/Tune';
import { useSnackbar } from 'notistack';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { clearErrors, getProducts } from '../../actions/productAction';
import Loader from '../Layouts/Loader';
import MinCategory from '../Layouts/MinCategory';
import ProductCard from '../Home/ProductCard';
import { categories } from '../../utils/constants';
import MetaData from '../Layouts/MetaData';

// Shop page — mobile app style (search bar, scrollable chips, filter panel,
// 2-col card grid) and modern desktop like the home page (same container,
// Cloud White cards, filter sidebar, 4-col grid).
const Products = () => {

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const params = useParams();
    const location = useLocation();

    const [price, setPrice] = useState([0, 200000]);
    const [category, setCategory] = useState(location.search ? location.search.split("=")[1] : "");
    const [ratings, setRatings] = useState(0);
    const [sort, setSort] = useState('default');
    const [searchInput, setSearchInput] = useState(params.keyword || '');
    const [filtersOpen, setFiltersOpen] = useState(false);

    // let a normal mouse wheel scroll the chip row horizontally (app feel)
    const chipsRowRef = useRef(null);
    const onChipsWheel = (e) => {
        const el = chipsRowRef.current;
        if (el && Math.abs(e.deltaY) > Math.abs(e.deltaX) && el.scrollWidth > el.clientWidth) {
            el.scrollLeft += e.deltaY;
        }
    };

    // pagination
    const [currentPage, setCurrentPage] = useState(1);

    const { products, loading, error, productsCount, resultPerPage, filteredProductsCount } = useSelector((state) => state.products);
    const keyword = params.keyword;

    const priceHandler = (e, newPrice) => {
        setPrice(newPrice);
    }

    const clearFilters = () => {
        setPrice([0, 200000]);
        setCategory("");
        setRatings(0);
    }

    const searchSubmit = (e) => {
        e.preventDefault();
        const q = searchInput.trim();
        navigate(q ? `/products/${encodeURIComponent(q)}` : '/products');
    }

    useEffect(() => {
        setSearchInput(keyword || '');
    }, [keyword]);

    useEffect(() => {
        if (error) {
            enqueueSnackbar(error, { variant: "error" });
            dispatch(clearErrors());
        }
        dispatch(getProducts(keyword, category, price, ratings, currentPage));
    }, [dispatch, keyword, category, price, ratings, currentPage, error, enqueueSnackbar]);

    // client-side sorting of the current page
    const sortedProducts = useMemo(() => {
        const list = [...(products || [])];
        if (sort === 'price-asc') list.sort((a, b) => (a.price || 0) - (b.price || 0));
        else if (sort === 'price-desc') list.sort((a, b) => (b.price || 0) - (a.price || 0));
        else if (sort === 'rating') list.sort((a, b) => (b.ratings || 0) - (a.ratings || 0));
        return list;
    }, [products, sort]);

    const count = filteredProductsCount ?? productsCount ?? products?.length ?? 0;

    // ── shared filter card (mobile panel + desktop sidebar) ──
    const filtersCard = (
        <div className="bg-white border border-line rounded-xl shadow-sm">
            <div className="flex items-center justify-between px-4 py-3 border-b border-line">
                <p className="font-display font-bold text-sm text-slate-900">ফিল্টার</p>
                <button onClick={clearFilters} className="text-xs font-semibold text-primary-accent hover:underline">সব মুছুন</button>
            </div>
            <div className="px-4 py-3.5 flex flex-col gap-5">
                {/* price range */}
                <div className="flex flex-col gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">দাম</span>
                    <Slider
                        value={price}
                        onChange={priceHandler}
                        valueLabelDisplay="auto"
                        min={0}
                        max={200000}
                        sx={{ color: '#3b82f6' }}
                    />
                    <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="border border-line rounded-lg px-2 py-1 bg-cloud text-slate-700 font-medium">৳{price[0].toLocaleString()}</span>
                        <span className="text-slate-400">থেকে</span>
                        <span className="border border-line rounded-lg px-2 py-1 bg-cloud text-slate-700 font-medium">৳{price[1].toLocaleString()}</span>
                    </div>
                </div>

                {/* ratings */}
                <div className="flex flex-col gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">রেটিং</span>
                    <div className="flex flex-wrap gap-1.5">
                        {[4, 3, 2, 1].map((r) => (
                            <button
                                key={r}
                                onClick={() => setRatings(Number(ratings) === r ? 0 : r)}
                                className={`text-xs font-semibold rounded-lg px-2.5 py-1.5 border transition duration-200 ${
                                    Number(ratings) === r
                                        ? 'bg-primary-accent text-white border-primary-accent'
                                        : 'bg-white border-line text-slate-600 hover:border-primary-accent hover:text-primary-accent'
                                }`}>
                                {r}★+
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    // ── category chips (horizontal scroll on mobile, wrap on desktop) ──
    const chipBase = "shrink-0 text-xs sm:text-sm font-semibold rounded-full px-4 py-2 border transition duration-200";
    const chips = [
        { label: 'সব পণ্য', value: '' },
        ...categories.map((c) => ({ label: c, value: c })),
    ];

    return (
        <>
            <MetaData title={keyword ? `${keyword} | TechBazar` : 'Shop | TechBazar'} />

            <MinCategory />
            <main className="w-full sm:w-11/12 m-auto flex flex-col gap-4 px-3 sm:px-4 pb-16 mt-3 sm:mt-6">

                {/* page header — same rhythm as the home page */}
                <div className="flex items-end justify-between gap-3 flex-wrap">
                    <div>
                        <h1 className="font-display font-extrabold text-xl sm:text-2xl text-slate-900 leading-tight">
                            {keyword ? `“${keyword}” এর ফলাফল` : 'সব পণ্য'}
                        </h1>
                        <p className="text-sm text-slate-500 mt-0.5">{count}টি পণ্য পাওয়া গেছে</p>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* sort — app-style compact select */}
                        <select
                            value={sort}
                            onChange={(e) => setSort(e.target.value)}
                            className="border border-line rounded-lg px-3 py-2 text-sm bg-white text-slate-700 font-medium focus:outline-none focus:border-primary-accent cursor-pointer"
                            aria-label="Sort products">
                            <option value="default">সাজানো: ডিফল্ট</option>
                            <option value="price-asc">দাম: কম → বেশি</option>
                            <option value="price-desc">দাম: বেশি → কম</option>
                            <option value="rating">রেটিং অনুযায়ী</option>
                        </select>

                        {/* filters toggle — mobile & tablet */}
                        <button
                            onClick={() => setFiltersOpen((v) => !v)}
                            className={`lg:hidden flex items-center gap-1.5 text-sm font-semibold rounded-lg px-3 py-2 border transition duration-200 ${
                                filtersOpen
                                    ? 'bg-primary-accent text-white border-primary-accent'
                                    : 'bg-white text-slate-700 border-line hover:border-primary-accent hover:text-primary-accent'
                            }`}>
                            <TuneIcon sx={{ fontSize: '18px' }} /> ফিল্টার
                        </button>
                    </div>
                </div>

                {/* search bar — mobile app style */}
                <form onSubmit={searchSubmit} className="relative w-full sm:max-w-md">
                    <SearchIcon sx={{ fontSize: '20px', color: '#64748b' }} className="absolute left-3 top-[50%] -translate-y-1/2 pointer-events-none" />
                    <input
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="পণ্য খুঁজুন… (যেমন: স্মার্টওয়াচ)"
                        className="w-full border border-line rounded-xl bg-white pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-primary-accent"
                    />
                </form>

                {/* category chips — horizontal scroll on mobile, wheel-friendly */}
                <div className="relative -mx-3 px-3 sm:mx-0 sm:px-0">
                    <div
                        ref={chipsRowRef}
                        onWheel={onChipsWheel}
                        className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible"
                    >
                        {chips.map((chip) => (
                            <button
                                key={chip.value}
                                onClick={() => setCategory(chip.value)}
                                className={`${chipBase} ${
                                    category === chip.value
                                        ? 'bg-primary-accent text-white border-primary-accent'
                                        : 'bg-white text-slate-600 border-line hover:border-primary-accent hover:text-primary-accent'
                                }`}>
                                {chip.label}
                            </button>
                        ))}
                    </div>
                    {/* fade hint — more chips beyond the right edge */}
                    <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-cloud via-cloud/70 to-transparent sm:hidden" />
                </div>

                {/* mobile / tablet filter panel */}
                {filtersOpen && <div className="lg:hidden">{filtersCard}</div>}

                <div className="flex gap-5 items-start">
                    {/* desktop filter sidebar — like the home page columns */}
                    <aside className="hidden lg:block w-64 shrink-0 sticky top-24">
                        {filtersCard}
                    </aside>

                    {/* product column */}
                    <div className="flex-1 min-w-0 flex flex-col gap-4">
                        {!loading && products?.length === 0 && (
                            <div className="flex flex-col items-center justify-center gap-2 bg-white border border-line rounded-xl p-10 text-center">
                                <span className="text-5xl">🔍</span>
                                <h2 className="font-display font-bold text-lg text-slate-900">কোনো ফল পাওয়া যায়নি</h2>
                                <p className="text-sm text-slate-500">অন্য কিছু লিখে খুঁজুন, অথবা ফিল্টার পরিবর্তন করে দেখুন।</p>
                                <button
                                    onClick={clearFilters}
                                    className="mt-2 text-sm font-semibold text-primary-accent border border-line hover:border-primary-accent rounded-lg px-4 py-2 transition duration-200">
                                    ফিল্টার মুছুন
                                </button>
                            </div>
                        )}

                        {loading ? <Loader /> : (
                            <>
                                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                                    {sortedProducts.map((product) => (
                                        <ProductCard key={product._id} product={product} />
                                    ))}
                                </div>

                                {filteredProductsCount > resultPerPage && (
                                    <div className="flex justify-center mt-2">
                                        <Pagination
                                            count={Number(((filteredProductsCount + 6) / resultPerPage).toFixed())}
                                            page={currentPage}
                                            onChange={(e, val) => { setCurrentPage(val); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                            sx={{
                                                '& .MuiPaginationItem-root': {
                                                    borderRadius: '10px',
                                                    color: '#64748b',
                                                    border: '1px solid #e8ecf1',
                                                },
                                                '& .MuiPaginationItem-page.Mui-selected': {
                                                    backgroundColor: '#3b82f6',
                                                    color: '#fff',
                                                    borderColor: '#3b82f6',
                                                },
                                            }}
                                        />
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </main>
        </>
    );
};

export default Products;
