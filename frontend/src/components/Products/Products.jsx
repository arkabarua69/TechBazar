import Pagination from '@mui/material/Pagination';
import Slider from '@mui/material/Slider';
import SearchIcon from '@mui/icons-material/Search';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import StarIcon from '@mui/icons-material/Star';
import FavoriteIcon from '@mui/icons-material/FavoriteBorder';
import GridViewIcon from '@mui/icons-material/GridView';
import ViewListIcon from '@mui/icons-material/ViewList';
import TuneIcon from '@mui/icons-material/Tune';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useSnackbar } from 'notistack';
import { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { clearErrors, getProducts } from '../../actions/productAction';
import { addItemsToCart } from '../../actions/cartAction';
import Loader from '../Layouts/Loader';
import MetaData from '../Layouts/MetaData';
import { useCategories } from '../../utils/useCategories';
import { getDiscount } from '../../utils/functions';

/* ─── Collapsible filter section ─── */
const FilterSection = ({ title, children, defaultOpen = true }) => {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="border-b" style={{ borderColor: 'var(--color-border)' }}>
            <button
                className="w-full flex items-center justify-between py-3 px-4 text-sm font-semibold text-left"
                style={{ color: 'var(--color-text-primary)' }}
                onClick={() => setOpen(v => !v)}
            >
                {title}
                {open
                    ? <ExpandLessIcon sx={{ fontSize: '18px', color: 'var(--color-text-muted)' }} />
                    : <ExpandMoreIcon sx={{ fontSize: '18px', color: 'var(--color-text-muted)' }} />
                }
            </button>
            {open && <div className="px-4 pb-4">{children}</div>}
        </div>
    );
};

/* ─── Checkbox row ─── */
const CheckRow = ({ label, checked, onChange }) => (
    <label className="flex items-center gap-2.5 py-1 cursor-pointer group">
        <input
            type="checkbox"
            checked={checked}
            onChange={onChange}
            className="w-4 h-4 rounded border cursor-pointer"
            style={{ accentColor: 'var(--color-accent)' }}
        />
        <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
    </label>
);

/* ─── Star rating row (reference: 4-star & above style) ─── */
const RatingRow = ({ value, active, onClick }) => (
    <button
        onClick={onClick}
        className="flex items-center gap-1.5 py-1 w-full"
    >
        <span className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map(s => (
                <StarIcon key={s} sx={{ fontSize: '14px', color: s <= value ? '#f59e0b' : '#d1d5db' }} />
            ))}
        </span>
        <span className="text-xs" style={{ color: active ? 'var(--color-accent)' : 'var(--color-text-secondary)', fontWeight: active ? 600 : 400 }}>
            {value} & above
        </span>
    </button>
);

/* ─── Single product card — Phoenix reference style ─── */
const PhoenixCard = ({ product }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const [wished, setWished] = useState(false);

    const { _id, name, images, ratings, numOfReviews, price, cuttedPrice, brand, stock, highlights } = product || {};
    const image = images?.[0]?.url;
    const discount = Number(getDiscount(price, cuttedPrice)) || 0;
    const saveAmount = (cuttedPrice || 0) - (price || 0);
    const outOfStock = (stock || 0) < 1;
    const specs = (Array.isArray(highlights) ? highlights : []).filter(h => h && !/cash on delivery/i.test(h)).slice(0, 2);

    const handleCart = async (e) => {
        e.preventDefault();
        if (outOfStock) return;
        try {
            await dispatch(addItemsToCart(_id));
            navigate('/checkout');
        } catch {
            enqueueSnackbar('Could not add to cart', { variant: 'error' });
        }
    };

    return (
        <div
            className="group flex flex-col overflow-hidden transition-all duration-200 h-full"
            style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.10)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
        >
            {/* Image */}
            <Link to={`/product/${_id}`} className="relative block overflow-hidden bg-white" style={{ borderRadius: '12px 12px 0 0' }}>
                <div className="w-full aspect-[4/3] flex items-center justify-center p-4 bg-white">
                    {image
                        ? <img src={image} alt={name} draggable="false" className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" />
                        : <div className="w-full h-full bg-gray-100 rounded flex items-center justify-center"><Inventory2Icon sx={{ fontSize: '2rem', color: '#9ca3af' }} /></div>
                    }
                </div>

                {/* Wishlist */}
                <button
                    onClick={e => { e.preventDefault(); setWished(v => !v); }}
                    className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all"
                    style={{ border: '1px solid var(--color-border)' }}
                >
                    <FavoriteIcon sx={{ fontSize: '16px', color: wished ? 'var(--color-accent)' : '#9ca3af' }} />
                </button>

                {/* Badges */}
                {discount > 0 && !outOfStock && (
                    <span className="absolute top-2.5 left-2.5 text-[10px] font-bold text-white px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: 'var(--color-accent)' }}>
                        {discount}% OFF
                    </span>
                )}
                {outOfStock && (
                    <div className="absolute inset-0 bg-white/75 flex items-center justify-center">
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-gray-200 text-gray-600">Out of Stock</span>
                    </div>
                )}
            </Link>

            {/* Body */}
            <div className="flex flex-col gap-1.5 p-3 flex-1">
                {brand?.name && (
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                        {brand.name}
                    </span>
                )}
                <Link to={`/product/${_id}`}>
                    <h3 className="text-sm font-medium leading-snug line-clamp-2 transition-colors"
                        style={{ color: 'var(--color-text-primary)', minHeight: '2.5rem' }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--color-accent)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-primary)'}>
                        {name}
                    </h3>
                </Link>

                {/* Specs */}
                {specs.length > 0 && (
                    <p className="text-xs line-clamp-1" style={{ color: 'var(--color-text-muted)' }}>
                        {specs.join(' · ')}
                    </p>
                )}

                {/* Rating */}
                <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="flex items-center gap-0.5">
                        {[1,2,3,4,5].map(s => (
                            <StarIcon key={s} sx={{ fontSize: '12px', color: s <= Math.round(ratings || 0) ? '#f59e0b' : '#e5e7eb' }} />
                        ))}
                    </div>
                    <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                        ({(numOfReviews || 0).toLocaleString()} people rated)
                    </span>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-2 mt-1">
                    {cuttedPrice > price && (
                        <span className="text-xs line-through" style={{ color: 'var(--color-text-muted)' }}>
                            Tk {(cuttedPrice || 0).toLocaleString()}
                        </span>
                    )}
                    <span className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>
                        Tk {(price || 0).toLocaleString()}
                    </span>
                </div>

                {/* Save */}
                {saveAmount > 0 && (
                    <p className="text-xs font-semibold" style={{ color: 'var(--color-success, #16a34a)' }}>
                        Save - Tk {saveAmount.toLocaleString()}
                    </p>
                )}
            </div>

            {/* Add to cart */}
            <div className="px-3 pb-3">
                <button
                    onClick={handleCart}
                    disabled={outOfStock}
                    className="w-full py-2 rounded-lg text-sm font-semibold transition-all duration-200"
                    style={outOfStock
                        ? { backgroundColor: 'var(--color-border)', color: 'var(--color-text-muted)', cursor: 'not-allowed' }
                        : { backgroundColor: 'var(--color-accent)', color: '#fff' }
                    }
                >
                    {outOfStock ? 'Out of Stock' : 'Order Now'}
                </button>
            </div>
        </div>
    );
};

/* ─── Main Products page ─── */
const Products = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const params = useParams();
    const location = useLocation();
    const categories = useCategories();

    const [price, setPrice] = useState([0, 200000]);
    const [priceInputMin, setPriceInputMin] = useState('');
    const [priceInputMax, setPriceInputMax] = useState('');
    const [category, setCategory] = useState(() => new URLSearchParams(location.search).get('category') || '');
    const [ratings, setRatings] = useState(0);
    const [sort, setSort] = useState('default');
    const [searchInput, setSearchInput] = useState(params.keyword || '');
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [viewMode, setViewMode] = useState('grid'); // grid | list
    const [currentPage, setCurrentPage] = useState(1);

    // Availability
    const [inStock, setInStock] = useState(false);
    const [preBook, setPreBook] = useState(false);
    const [outOfStockFilter, setOutOfStockFilter] = useState(false);

    const { products, loading, error, filteredProductsCount, resultPerPage } = useSelector(s => s.products);
    const keyword = params.keyword;

    useEffect(() => { setSearchInput(keyword || ''); }, [keyword]);
    useEffect(() => {
        if (error) { enqueueSnackbar(error, { variant: 'error' }); dispatch(clearErrors()); }
        dispatch(getProducts(keyword, category, price, ratings, currentPage));
    }, [dispatch, keyword, category, price, ratings, currentPage, error, enqueueSnackbar]);
    useEffect(() => { setCurrentPage(1); }, [keyword, category, price, ratings]);

    const clearFilters = () => {
        setPrice([0, 200000]); setPriceInputMin(''); setPriceInputMax('');
        setCategory(''); setRatings(0); setInStock(false); setPreBook(false); setOutOfStockFilter(false);
        setCurrentPage(1);
    };

    const applyPriceInput = () => {
        const mn = parseInt(priceInputMin, 10) || 0;
        const mx = parseInt(priceInputMax, 10) || 200000;
        setPrice([Math.min(mn, mx), Math.max(mn, mx)]);
    };

    const searchSubmit = (e) => {
        e.preventDefault();
        const q = searchInput.trim();
        navigate(q ? `/products/${encodeURIComponent(q)}` : '/products');
    };

    const sortedProducts = useMemo(() => {
        let list = [...(products || [])];
        if (inStock) list = list.filter(p => (p.stock || 0) > 0);
        if (outOfStockFilter) list = list.filter(p => (p.stock || 0) === 0);
        if (sort === 'price-asc')  list.sort((a, b) => (a.price || 0) - (b.price || 0));
        if (sort === 'price-desc') list.sort((a, b) => (b.price || 0) - (a.price || 0));
        if (sort === 'rating')     list.sort((a, b) => (b.ratings || 0) - (a.ratings || 0));
        if (sort === 'newest')     list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        return list;
    }, [products, sort, inStock, outOfStockFilter]);

    const count = filteredProductsCount ?? products?.length ?? 0;

    // ── Sidebar filter panel ──
    const Sidebar = () => (
        <aside
            className="w-full"
            style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
                overflow: 'hidden',
            }}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5" style={{ borderBottom: '1px solid var(--color-border)' }}>
                <span className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>Filters</span>
                <button onClick={clearFilters} className="text-xs font-semibold transition-colors"
                    style={{ color: 'var(--color-accent)' }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                    Clear all
                </button>
            </div>

            {/* Availability */}
            <FilterSection title="Availability">
                <CheckRow label="In stock" checked={inStock} onChange={e => setInStock(e.target.checked)} />
                <CheckRow label="Pre-book" checked={preBook} onChange={e => setPreBook(e.target.checked)} />
                <CheckRow label="Out of stock" checked={outOfStockFilter} onChange={e => setOutOfStockFilter(e.target.checked)} />
            </FilterSection>

            {/* Category */}
            <FilterSection title="Category">
                <div className="flex flex-col">
                    <CheckRow label="All Products" checked={category === ''} onChange={() => setCategory('')} />
                    {categories.map(cat => (
                        <CheckRow key={cat} label={cat} checked={category === cat} onChange={() => setCategory(cat === category ? '' : cat)} />
                    ))}
                </div>
            </FilterSection>

            {/* Price range */}
            <FilterSection title="Price range">
                <Slider
                    value={price}
                    onChange={(_, v) => setPrice(v)}
                    min={0}
                    max={200000}
                    sx={{
                        color: 'var(--color-accent)',
                        '& .MuiSlider-thumb': { width: 14, height: 14 },
                        mb: 1.5,
                    }}
                />
                <div className="flex items-center gap-2 mt-2">
                    <input
                        type="number"
                        placeholder="Min"
                        value={priceInputMin}
                        onChange={e => setPriceInputMin(e.target.value)}
                        className="w-full text-sm px-2 py-1.5 rounded-lg outline-none text-center"
                        style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', backgroundColor: 'var(--color-surface)' }}
                    />
                    <span className="text-xs shrink-0" style={{ color: 'var(--color-text-muted)' }}>to</span>
                    <input
                        type="number"
                        placeholder="Max"
                        value={priceInputMax}
                        onChange={e => setPriceInputMax(e.target.value)}
                        className="w-full text-sm px-2 py-1.5 rounded-lg outline-none text-center"
                        style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', backgroundColor: 'var(--color-surface)' }}
                    />
                    <button
                        onClick={applyPriceInput}
                        className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90"
                        style={{ backgroundColor: 'var(--color-accent)' }}
                    >
                        Go
                    </button>
                </div>
                <p className="text-xs mt-1.5" style={{ color: 'var(--color-text-muted)' }}>
                    Tk {price[0].toLocaleString()} – Tk {price[1].toLocaleString()}
                </p>
            </FilterSection>

            {/* Rating */}
            <FilterSection title="Rating">
                {[4, 3, 2, 1].map(r => (
                    <RatingRow
                        key={r}
                        value={r}
                        active={Number(ratings) === r}
                        onClick={() => setRatings(Number(ratings) === r ? 0 : r)}
                    />
                ))}
            </FilterSection>
        </aside>
    );

    return (
        <>
            <MetaData title={keyword ? `${keyword} | Products` : 'Shop | All Products'} />

            {/* ── Page wrapper ── */}
            <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-5 sm:py-6">

                {/* ── Top bar: title + search + sort + view toggle ── */}
                <div
                    className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5 p-4 rounded-xl"
                    style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                >
                    <div className="flex-1">
                        <h1 className="text-lg font-bold leading-tight" style={{ color: 'var(--color-text-primary)' }}>
                            {keyword ? `Results for "${keyword}"` : 'All Products'}
                        </h1>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                            {count.toLocaleString()} products found
                        </p>
                    </div>

                    {/* Search */}
                    <form onSubmit={searchSubmit} className="flex items-center rounded-xl overflow-hidden sm:w-56 lg:w-72"
                        style={{ border: '1.5px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
                        <input
                            value={searchInput}
                            onChange={e => setSearchInput(e.target.value)}
                            placeholder="Search..."
                            className="flex-1 px-3 py-2 text-sm outline-none bg-transparent"
                            style={{ color: 'var(--color-text-primary)' }}
                        />
                        <button type="submit" className="px-3 py-2" style={{ color: 'var(--color-text-muted)' }}>
                            <SearchIcon sx={{ fontSize: '18px' }} />
                        </button>
                    </form>

                    {/* Sort */}
                    <select
                        value={sort}
                        onChange={e => setSort(e.target.value)}
                        className="text-sm px-3 py-2 rounded-xl outline-none cursor-pointer"
                        style={{
                            border: '1.5px solid var(--color-border)',
                            color: 'var(--color-text-primary)',
                            backgroundColor: 'var(--color-surface)',
                        }}
                    >
                        <option value="default">Default sorting</option>
                        <option value="price-asc">Price: Low → High</option>
                        <option value="price-desc">Price: High → Low</option>
                        <option value="rating">Top Rated</option>
                        <option value="newest">Newest</option>
                    </select>

                    {/* View toggle */}
                    <div className="hidden sm:flex items-center gap-1 p-1 rounded-lg" style={{ border: '1.5px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
                        <button
                            onClick={() => setViewMode('grid')}
                            className="p-1.5 rounded-md transition-all"
                            style={viewMode === 'grid'
                                ? { backgroundColor: 'var(--color-accent)', color: '#fff' }
                                : { color: 'var(--color-text-muted)' }}
                        >
                            <GridViewIcon sx={{ fontSize: '18px' }} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className="p-1.5 rounded-md transition-all"
                            style={viewMode === 'list'
                                ? { backgroundColor: 'var(--color-accent)', color: '#fff' }
                                : { color: 'var(--color-text-muted)' }}
                        >
                            <ViewListIcon sx={{ fontSize: '18px' }} />
                        </button>
                    </div>

                    {/* Mobile filter toggle */}
                    <button
                        onClick={() => setFiltersOpen(v => !v)}
                        className="lg:hidden flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                        style={filtersOpen
                            ? { backgroundColor: 'var(--color-accent)', color: '#fff', border: '1.5px solid var(--color-accent)' }
                            : { border: '1.5px solid var(--color-border)', color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-surface)' }}
                    >
                        <TuneIcon sx={{ fontSize: '16px' }} />
                        Filters
                    </button>
                </div>

                {/* ── Body: sidebar + grid ── */}
                <div className="flex gap-5 items-start">

                    {/* Desktop sidebar */}
                    <div className="hidden lg:block w-56 xl:w-60 shrink-0 sticky top-28">
                        <Sidebar />
                    </div>

                    {/* Mobile sidebar overlay */}
                    {filtersOpen && (
                        <div className="lg:hidden fixed inset-0 z-50 flex">
                            <div className="absolute inset-0 bg-black/50" onClick={() => setFiltersOpen(false)} />
                            <div className="relative w-72 max-w-[85vw] ml-0 h-full overflow-y-auto"
                                style={{ backgroundColor: 'var(--color-surface)' }}>
                                <div className="flex items-center justify-between px-4 py-3"
                                    style={{ borderBottom: '1px solid var(--color-border)' }}>
                                    <span className="font-bold text-sm" style={{ color: 'var(--color-text-primary)' }}>Filters</span>
                                    <button onClick={() => setFiltersOpen(false)} style={{ color: 'var(--color-text-muted)' }}>
                                        <CloseIcon sx={{ fontSize: '20px' }} />
                                    </button>
                                </div>
                                <Sidebar />
                            </div>
                        </div>
                    )}

                    {/* Product area */}
                    <div className="flex-1 min-w-0">
                        {loading ? (
                            <Loader />
                        ) : sortedProducts.length === 0 ? (
                            <div
                                className="flex flex-col items-center justify-center gap-3 p-12 rounded-xl text-center"
                                style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                            >
                                <SearchIcon sx={{ fontSize: '3rem', color: 'var(--color-text-muted)' }} />
                                <h2 className="font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>No products found</h2>
                                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Try a different search or clear the filters.</p>
                                <button
                                    onClick={clearFilters}
                                    className="mt-1 px-5 py-2 rounded-xl text-sm font-semibold text-white"
                                    style={{ backgroundColor: 'var(--color-accent)' }}
                                >
                                    Clear Filters
                                </button>
                            </div>
                        ) : (
                            <>
                                {/* Grid */}
                                {viewMode === 'grid' ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4">
                                        {sortedProducts.map(p => (
                                            <PhoenixCard key={p._id} product={p} />
                                        ))}
                                    </div>
                                ) : (
                                    /* List view */
                                    <div className="flex flex-col gap-3">
                                        {sortedProducts.map(p => (
                                            <ListCard key={p._id} product={p} />
                                        ))}
                                    </div>
                                )}

                                {/* Pagination */}
                                {filteredProductsCount > resultPerPage && (
                                    <div className="flex justify-center mt-8">
                                        <Pagination
                                            count={Math.ceil(filteredProductsCount / (resultPerPage || 12))}
                                            page={currentPage}
                                            onChange={(_, val) => { setCurrentPage(val); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                            shape="rounded"
                                            sx={{
                                                '& .MuiPaginationItem-root': {
                                                    color: 'var(--color-text-secondary)',
                                                    borderColor: 'var(--color-border)',
                                                    borderRadius: '8px',
                                                    fontSize: '13px',
                                                    fontWeight: 500,
                                                },
                                                '& .MuiPaginationItem-page.Mui-selected': {
                                                    backgroundColor: 'var(--color-accent)',
                                                    color: '#fff',
                                                    borderColor: 'var(--color-accent)',
                                                },
                                                '& .MuiPaginationItem-page:hover': {
                                                    borderColor: 'var(--color-accent)',
                                                    color: 'var(--color-accent)',
                                                },
                                            }}
                                        />
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

/* ─── List view card ─── */
const ListCard = ({ product }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { _id, name, images, ratings, numOfReviews, price, cuttedPrice, brand, stock, highlights } = product || {};
    const image = images?.[0]?.url;
    const discount = Number(getDiscount(price, cuttedPrice)) || 0;
    const saveAmount = (cuttedPrice || 0) - (price || 0);
    const outOfStock = (stock || 0) < 1;
    const specs = (Array.isArray(highlights) ? highlights : []).filter(h => h && !/cash on delivery/i.test(h)).slice(0, 3);

    return (
        <div
            className="flex gap-4 p-4 rounded-xl transition-all duration-200"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
        >
            <Link to={`/product/${_id}`} className="shrink-0 w-28 h-28 sm:w-36 sm:h-36 bg-white rounded-xl overflow-hidden flex items-center justify-center p-2"
                style={{ border: '1px solid var(--color-border)' }}>
                {image && <img src={image} alt={name} draggable="false" className="w-full h-full object-contain" />}
            </Link>
            <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                {brand?.name && <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>{brand.name}</span>}
                <Link to={`/product/${_id}`}><h3 className="text-sm font-semibold line-clamp-2 transition-colors"
                    style={{ color: 'var(--color-text-primary)' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--color-accent)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-primary)'}>{name}</h3></Link>
                <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map(s => <StarIcon key={s} sx={{ fontSize: '12px', color: s <= Math.round(ratings||0) ? '#f59e0b' : '#e5e7eb' }} />)}
                    <span className="text-[11px] ml-1" style={{ color: 'var(--color-text-muted)' }}>({numOfReviews||0})</span>
                </div>
                {specs.length > 0 && <ul className="hidden sm:flex flex-col gap-0.5">
                    {specs.map((s, i) => <li key={i} className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>• {s}</li>)}
                </ul>}
                <div className="flex items-baseline gap-2 mt-auto pt-2">
                    {cuttedPrice > price && <span className="text-xs line-through" style={{ color: 'var(--color-text-muted)' }}>Tk {(cuttedPrice||0).toLocaleString()}</span>}
                    <span className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>Tk {(price||0).toLocaleString()}</span>
                    {discount > 0 && <span className="text-[11px] font-bold text-white px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--color-accent)' }}>{discount}%</span>}
                </div>
                {saveAmount > 0 && <p className="text-xs font-semibold" style={{ color: 'var(--color-success,#16a34a)' }}>Save Tk {saveAmount.toLocaleString()}</p>}
            </div>
            <div className="shrink-0 flex flex-col gap-2 items-end justify-between">
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={outOfStock
                    ? { backgroundColor: '#fef2f2', color: '#ef4444' }
                    : { backgroundColor: '#f0fdf4', color: '#16a34a' }}>
                    {outOfStock ? 'Out of Stock' : 'In Stock'}
                </span>
                <button
                    onClick={async () => { if (!outOfStock) { await dispatch(addItemsToCart(_id)); navigate('/checkout'); } }}
                    disabled={outOfStock}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: outOfStock ? 'var(--color-border)' : 'var(--color-accent)', cursor: outOfStock ? 'not-allowed' : 'pointer' }}
                >
                    Order Now
                </button>
            </div>
        </div>
    );
};

export default Products;
