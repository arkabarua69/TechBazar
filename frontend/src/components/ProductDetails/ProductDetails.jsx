import { useSnackbar } from 'notistack';
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { clearErrors, getProductDetails, getSimilarProducts, newReview } from '../../actions/productAction';
import Loader from '../Layouts/Loader';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import BoltIcon from '@mui/icons-material/Bolt';
import ChatIcon from '@mui/icons-material/Chat';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import StorefrontIcon from '@mui/icons-material/Storefront';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import FavoriteIcon from '@mui/icons-material/Favorite';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PaymentsIcon from '@mui/icons-material/Payments';
import CachedIcon from '@mui/icons-material/Cached';
import ScheduleIcon from '@mui/icons-material/Schedule';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckIcon from '@mui/icons-material/Check';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Rating from '@mui/material/Rating';
import TextField from '@mui/material/TextField';
import { NEW_REVIEW_RESET } from '../../constants/productConstants';
import { addItemsToCart } from '../../actions/cartAction';
import { getDiscount } from '../../utils/functions';
import { richTextToHtml } from '../../utils/richText';
import { addToWishlist, removeFromWishlist } from '../../actions/wishlistAction';
import MetaData from '../Layouts/MetaData';
import ProductCard from '../Home/ProductCard';

// Map a colour name to a swatch colour so product options can show a real
// thumbnail-style chip without needing a separate image per variant.
const COLOR_HEX = {
    black: '#111827', white: '#f8fafc', 'off-white': '#f8fafc', ivory: '#fffaf0', silver: '#d1d5db',
    grey: '#9ca3af', gray: '#9ca3af', red: '#ef4444', maroon: '#7f1d1d', pink: '#ec4899',
    purple: '#a855f7', violet: '#8b5cf6', blue: '#2563eb', navy: '#1e3a8a', sky: '#0ea5e9',
    cyan: '#06b6d4', teal: '#14b8a6', green: '#22c55e', olive: '#65a30d', yellow: '#eab308',
    gold: '#f59e0b', orange: '#f97316', brown: '#92400e', beige: '#e7d8c9', cream: '#fef3c7',
    transparent: '#e2e8f0', clear: '#e2e8f0',
    multicolor: 'linear-gradient(135deg,#f87171,#fbbf24,#34d399,#60a5fa)',
    'multi-color': 'linear-gradient(135deg,#f87171,#fbbf24,#34d399,#60a5fa)',
    rgb: 'linear-gradient(135deg,#f87171,#fbbf24,#34d399,#60a5fa)',
};

// Resolve colour names like "Navy/Off-White" or "Black Clear" to a swatch.
const colorFor = (name = '') => {
    const key = String(name).trim().toLowerCase();
    if (COLOR_HEX[key]) return COLOR_HEX[key];
    const tokens = key.split(/[\s/,-]+/).filter(Boolean);
    for (const token of tokens) {
        if (COLOR_HEX[token]) return COLOR_HEX[token];
    }
    return '#cbd5e1';
};

// TechBazar product details (Cloud White):
//  left  = gallery + thumbnail strip
//  right = brand · name · rating · price · stock badge · trust box
//          (delivery charge / COD / replacement / delivery time)
//          · color variant · quantity · Buy Now + Cart · WhatsApp order
//  below = Description / Specifications / In the Box tabs,
//          reviews, related gadgets grid (4 cards)
const ProductDetails = () => {

    const dispatch = useDispatch();
    const { enqueueSnackbar } = useSnackbar();
    const params = useParams();
    const navigate = useNavigate();

    // reviews toggle
    const [open, setOpen] = useState(false);
    const [viewAll, setViewAll] = useState(false);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");

    // gallery
    const [activeImage, setActiveImage] = useState(0);
    const galleryRef = useRef(null);

    // variant + quantity
    const [activeColor, setActiveColor] = useState("");
    const [activeSize, setActiveSize] = useState("");
    const [showAllOptions, setShowAllOptions] = useState(false);
    const [qty, setQty] = useState(1);

    // info tabs
    const [activeTab, setActiveTab] = useState("description");

    // delivery/payment info (admin editable) + whatsapp support
    const [delivery, setDelivery] = useState({ insideDhaka: 70, outsideDhaka: 130 });
    const [whatsapp, setWhatsapp] = useState('');

    const { product, loading, error } = useSelector((state) => state.productDetails);
    const { success, error: reviewError } = useSelector((state) => state.newReview);
    const { cartItems } = useSelector((state) => state.cart);
    const { wishlistItems } = useSelector((state) => state.wishlist);
    const { products: similarProducts } = useSelector((state) => state.products);

    const productId = params.id;
    const itemInWishlist = wishlistItems.some((i) => i.product === productId);
    const itemInCart = cartItems.some((i) => i.product === productId);
    const images = (product && product.images) || [];
    const outOfStock = !product || product.stock < 1;
    const discount = getDiscount(product?.price, product?.cuttedPrice);
    const colors = (product && product.colors) || [];
    const sizes = (product && product.sizes) || [];

    // Product Options: only real colour variants (never gallery photos).
    // More than four collapse into a "+N" card, matching the reference layout.
    const MAX_OPTIONS = 4;
    const optionList = colors.map((c) => ({ label: c, color: c }));
    const visibleOptions = showAllOptions ? optionList : optionList.slice(0, MAX_OPTIONS);
    const extraOptions = Math.max(0, optionList.length - MAX_OPTIONS);
    const hasOptions = optionList.length > 0 || sizes.length > 0;

    // ── gallery carousel helpers (mobile swipe + thumbnail sync) ──────────
    const goToImage = (index) => {
        if (!images.length) return;
        const next = Math.min(Math.max(index, 0), images.length - 1);
        setActiveImage(next);
        const el = galleryRef.current;
        if (el) el.scrollTo({ left: next * el.clientWidth, behavior: 'smooth' });
    };

    const handleGalleryScroll = (event) => {
        const el = event.currentTarget;
        if (!el.clientWidth) return;
        const index = Math.round(el.scrollLeft / el.clientWidth);
        const next = Math.min(Math.max(index, 0), Math.max(images.length - 1, 0));
        setActiveImage((prev) => (prev === next ? prev : next));
    };

    const selectOption = (option) => setActiveColor(option.color);

    const isOptionActive = (option) => option.color === activeColor;

    // Preselect the first real colour variant when a product loads.
    useEffect(() => {
        const list = (product && product.colors) || [];
        setActiveColor((prev) => (prev && list.includes(prev) ? prev : (list[0] || '')));
    }, [product]);

    // keep the mobile purchase bar stacked on top of the global bottom nav
    const [navHeight, setNavHeight] = useState(0);
    useEffect(() => {
        const nav = document.querySelector('[data-mobile-bottom-nav]');
        if (!nav) return undefined;
        const update = () => setNavHeight(nav.getBoundingClientRect().height);
        update();
        let observer;
        if (typeof ResizeObserver !== 'undefined') {
            observer = new ResizeObserver(update);
            observer.observe(nav);
        }
        window.addEventListener('resize', update);
        return () => {
            if (observer) observer.disconnect();
            window.removeEventListener('resize', update);
        };
    }, []);

    const reviewSubmitHandler = () => {
        if (rating === 0 || !comment.trim()) {
            enqueueSnackbar("Empty Review", { variant: "error" });
            return;
        }
        const formData = new FormData();
        formData.set("rating", rating);
        formData.set("comment", comment);
        formData.set("productId", productId);
        dispatch(newReview(formData));
        setOpen(false);
    };

    const addToWishlistHandler = () => {
        if (itemInWishlist) {
            dispatch(removeFromWishlist(productId));
            enqueueSnackbar("Remove From Wishlist", { variant: "success" });
        } else {
            dispatch(addToWishlist(productId));
            enqueueSnackbar("Added To Wishlist", { variant: "success" });
        }
    };

    const addToCartHandler = async () => {
        if (outOfStock) return;
        try {
            await dispatch(addItemsToCart(productId, qty));
            enqueueSnackbar(`${qty} item(s) added to cart`, { variant: "success" });
        } catch {
            enqueueSnackbar("Could not add to cart", { variant: "error" });
        }
    };

    const goToCart = () => navigate('/cart');

    // "Order Now" — straight to checkout with the chosen quantity
    const buyNow = async () => {
        if (outOfStock) return;
        try {
            await dispatch(addItemsToCart(productId, qty));
            navigate('/checkout');
        } catch {
            enqueueSnackbar("Could not add to cart", { variant: "error" });
        }
    };

    const whatsappOrder = () => {
        if (!whatsapp) {
            enqueueSnackbar("WhatsApp number not configured", { variant: "info" });
            return;
        }
        const lines = [
            `Assalamu alaikum, I would like to order this product:`,
            product?.name,
            `Price: Tk ${product?.price?.toLocaleString()}`,
        ];
if (activeColor) lines.push(`Color: ${activeColor}`);
    if (qty > 1) lines.push(`Quantity: ${qty}`);
        lines.push(window.location.href);
        window.open(`https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(lines.join("\n"))}`, '_blank');
    };

    useEffect(() => {
        if (error) {
            enqueueSnackbar(error, { variant: "error" });
            dispatch(clearErrors());
        }
        if (reviewError) {
            enqueueSnackbar(reviewError, { variant: "error" });
            dispatch(clearErrors());
        }
        if (success) {
            enqueueSnackbar("Review Submitted Successfully", { variant: "success" });
            dispatch({ type: NEW_REVIEW_RESET });
        }
        dispatch(getProductDetails(productId));
        // eslint-disable-next-line
    }, [dispatch, productId, error, reviewError, success, enqueueSnackbar]);

    const similarCategory = product?.category;

    useEffect(() => {
        // Runs only once the product (and therefore its category) is known —
        // see getSimilarProducts: an undefined category means a wasted request.
        if (similarCategory) dispatch(getSimilarProducts(similarCategory));
        // eslint-disable-next-line
    }, [dispatch, similarCategory]);

    // admin-editable delivery charges + whatsapp number
    useEffect(() => {
        axios.get('/api/v1/store/config', { headers: { Accept: 'application/json' } })
            .then(({ data }) => data && data.deliveryCharges && setDelivery(data.deliveryCharges))
            .catch(() => { /* defaults */ });
        axios.get('/api/v1/siteconfig', { headers: { Accept: 'application/json' } })
            .then(({ data }) => {
                const s = data && data.config && data.config.support;
                if (s && s.whatsapp) setWhatsapp(s.whatsapp);
            })
            .catch(() => { /* defaults */ });
    }, []);

    // gallery index, variant, quantity & tab reset when the product reloads
    useEffect(() => {
        setActiveImage(0);
        setActiveColor("");
        setActiveSize("");
        setShowAllOptions(false);
        setQty(1);
        setActiveTab("description");
        if (galleryRef.current) galleryRef.current.scrollTo({ left: 0 });
    }, [productId]);

    const clampQty = (v) => Math.min(Math.max(1, v), product?.stock || 1);

    const infoTabs = [
        { id: "description", label: "Description" },
        { id: "specifications", label: "Specifications" },
        ...(product?.inTheBox?.length ? [{ id: "inthebox", label: "In the Box" }] : []),
    ];

    const related = (similarProducts || []).filter((p) => p._id !== productId).slice(0, 4);

    return (
        <>
            {loading ? <Loader /> : !product ? (
                <div className="text-center py-12 text-slate-500">Product not found</div>
            ) : (
                <>
                    <MetaData
                        title={product.name}
                        description={product.description}
                        image={images[0]?.url}
                        type="product"
                    />
                    <main className="mt-4 sm:mt-0">

                        <div className="w-full sm:w-11/12 mx-auto px-3 sm:px-4 flex flex-col gap-4 pb-40 md:pb-6">

                            {/* ── gallery + purchase box ── */}
                            <div className="surface p-3 sm:p-5 grid lg:grid-cols-2 gap-5">

                                {/* left: image gallery + thumbnail strip */}
                                <div className="flex flex-col gap-3">
                                    {/* main image — swipeable carousel with a 1/N counter */}
                                    <div className="relative bg-white border border-line rounded-xl overflow-hidden group">
                                        <div
                                            ref={galleryRef}
                                            onScroll={handleGalleryScroll}
                                            className="flex h-80 sm:h-[30rem] lg:h-[32rem] overflow-x-auto snap-x snap-mandatory no-scrollbar"
                                        >
                                            {images.length > 0 ? images.map((img, i) => (
                                                <div key={i} className="snap-center shrink-0 w-full h-full flex items-center justify-center">
                                                    <img
                                                        draggable="false"
                                                        src={img.url}
                                                        alt={`${product.name} ${i + 1}`}
                                                        className="w-full h-full object-contain p-3 sm:p-5"
                                                    />
                                                </div>
                                            )) : (
                                                <div className="w-full h-full flex items-center justify-center text-sm text-slate-400">
                                                    No image
                                                </div>
                                            )}
                                        </div>

                                        {/* corner badges */}
                                        <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5 pointer-events-none">
                                            {outOfStock ? (
                                                <span className="text-[10px] font-bold uppercase tracking-wide text-white bg-red-600 px-2 py-1 rounded shadow">Out of Stock</span>
                                            ) : (
                                                <span className="text-[10px] font-bold uppercase tracking-wide text-white bg-yellow-500 px-2 py-1 rounded-full shadow-sm">
                                                    Cash on Delivery
                                                </span>
                                            )}
                                        </div>

                                        {/* wishlist */}
                                        <button
                                            onClick={addToWishlistHandler}
                                            aria-label="Wishlist"
                                            className="absolute top-3 right-3 w-9 h-9 bg-white border border-line rounded-full shadow-sm flex items-center justify-center transition hover:scale-105"
                                        >
                                            <span className={itemInWishlist ? "text-red-500" : "text-slate-300 hover:text-red-500"}>
                                                <FavoriteIcon sx={{ fontSize: "18px" }} />
                                            </span>
                                        </button>

                                        {/* image counter badge (e.g. 1/7) */}
                                        {images.length > 0 && (
                                            <span className="absolute bottom-3 right-3 text-[11px] font-bold text-white bg-slate-900/70 backdrop-blur px-2.5 py-1 rounded-full">
                                                {activeImage + 1}/{images.length}
                                            </span>
                                        )}

                                        {/* swipe position dots */}
                                        {images.length > 1 && (
                                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                                                {images.map((_, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => goToImage(i)}
                                                        aria-label={`Go to image ${i + 1}`}
                                                        className={`h-1.5 rounded-full transition-all ${
                                                            i === activeImage ? 'w-4 bg-primary-accent' : 'w-1.5 bg-slate-900/25'
                                                        }`}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* thumbnail strip — contain so full thumb is visible */}
                                    {images.length > 1 && (
                                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                                            {images.map((img, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => goToImage(i)}
                                                    className={`shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg border-2 bg-white p-1.5 flex items-center justify-center transition ${
                                                        activeImage === i ? 'border-primary-accent' : 'border-line hover:border-slate-300'
                                                    }`}
                                                >
                                                    <img src={img.url} alt={`${product.name} ${i + 1}`} className="w-full h-full object-contain" draggable="false" />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* right: info + purchase box */}
                                <div className="flex flex-col gap-3">
                                    {product.brand?.name && (
                                        <span className="hidden lg:block text-xxs font-bold uppercase tracking-wider text-slate-400">{product.brand.name}</span>
                                    )}

                                    <h1 className="line-clamp-2 font-display font-extrabold text-xl sm:text-2xl text-slate-900 leading-snug">
                                        {product.name}
                                    </h1>

                                    {/* star ratings */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="flex items-center">
                                            {[0, 1, 2, 3, 4].map((i) => (
                                                i < Math.round(product.ratings || 0) ? (
                                                    <StarIcon key={i} sx={{ fontSize: '16px', color: '#f59e0b' }} />
                                                ) : (
                                                    <StarBorderIcon key={i} sx={{ fontSize: '16px', color: '#f59e0b' }} />
                                                )
                                            ))}
                                        </span>
                                        <span className="text-sm font-bold text-slate-900">{(product.ratings || 0).toFixed(1)}</span>
                                        <span className="text-sm text-slate-400">({product.numOfReviews || 0} reviews)</span>
                                    </div>

                                    {/* promo + price — jumps to the top on mobile, sits after
                                        the ratings on desktop */}
                                    <div className="order-first lg:order-none flex flex-col gap-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-md">
                                                <LocalOfferIcon sx={{ fontSize: '13px' }} />
                                                {Number(discount) > 0 ? 'Special Price' : 'Best Price'}
                                            </span>
                                            {Number(discount) > 0 && (
                                                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-md">
                                                    Save Tk {(product.cuttedPrice - product.price)?.toLocaleString()}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="font-extrabold text-3xl text-red-600">Tk {product.price?.toLocaleString()}</span>
                                            {product.cuttedPrice > product.price && (
                                                <span className="text-base text-slate-400 line-through">Tk {product.cuttedPrice?.toLocaleString()}</span>
                                            )}
                                            {Number(discount) > 0 && (
                                                <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">
                                                    -{discount}%
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* stock badge */}
                                    {outOfStock ? (
                                        <span className="inline-flex w-fit items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-200">
                                            <CancelIcon sx={{ fontSize: "14px" }} /> Out of Stock
                                        </span>
                                    ) : product.stock <= 10 ? (
                                        <span className="inline-flex w-fit items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-600 border border-yellow-200">
                                            <ScheduleIcon sx={{ fontSize: "14px" }} /> Only {product.stock} left!
                                        </span>
                                    ) : (
                                        <span className="inline-flex w-fit items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-green-50 text-green-600 border border-green-200">
                                            <CheckCircleIcon sx={{ fontSize: "14px" }} /> In Stock
                                        </span>
                                    )}

                                    {/* product options — colour / size / style swatches */}
                                    {hasOptions && (
                                        <div className="rounded-xl bg-white border border-line p-3 sm:p-4">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-sm font-bold text-slate-900">Product Options</span>
                                                <span className="text-xs font-medium text-slate-500">
                                                    {activeColor || activeSize
                                                        ? [activeColor, activeSize].filter(Boolean).join(' · ')
                                                        : 'Select'}
                                                </span>
                                            </div>

                                            {optionList.length > 0 && (
                                                <div className="mt-3 flex gap-2.5 overflow-x-auto no-scrollbar">
                                                    {visibleOptions.map((option, i) => {
                                                        const selected = isOptionActive(option);
                                                        return (
                                                            <button
                                                                key={`${option.label}-${i}`}
                                                                onClick={() => selectOption(option)}
                                                                title={option.label}
                                                                aria-label={`Select ${option.label}`}
                                                                className="shrink-0 flex flex-col items-center gap-1 w-14"
                                                            >
                                                                <span
                                                                    className={`relative w-14 h-14 rounded-xl border-2 overflow-hidden flex items-center justify-center bg-white transition ${
                                                                        selected
                                                                            ? 'border-primary-accent ring-2 ring-primary-light'
                                                                            : 'border-line hover:border-slate-300'
                                                                    }`}
                                                                >
                                                                    <span
                                                                        className="w-8 h-8 rounded-full border border-black/10 shadow-inner"
                                                                        style={{ background: colorFor(option.color) }}
                                                                    />
                                                                    {selected && (
                                                                        <span className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-primary-accent text-white flex items-center justify-center">
                                                                            <CheckIcon sx={{ fontSize: '11px' }} />
                                                                        </span>
                                                                    )}
                                                                </span>
                                                                <span className={`w-full text-[10px] font-medium truncate text-center ${selected ? 'text-primary-accent' : 'text-slate-500'}`}>
                                                                    {option.label}
                                                                </span>
                                                            </button>
                                                        );
                                                    })}

                                                    {extraOptions > 0 && (
                                                        <button
                                                            onClick={() => setShowAllOptions((v) => !v)}
                                                            aria-label={showAllOptions ? 'Show fewer options' : `Show ${extraOptions} more options`}
                                                            className="shrink-0 flex flex-col items-center gap-1 w-14"
                                                        >
                                                            <span className="w-14 h-14 rounded-xl border-2 border-dashed border-line bg-cloud flex items-center justify-center text-sm font-bold text-slate-600">
                                                                {showAllOptions ? '−' : `+${extraOptions}`}
                                                            </span>
                                                            <span className="text-[10px] font-medium text-slate-500">
                                                                {showAllOptions ? 'Less' : 'More'}
                                                            </span>
                                                        </button>
                                                    )}
                                                </div>
                                            )}

                                            {sizes.length > 0 && (
                                                <div className="mt-3 flex items-center gap-2 flex-wrap">
                                                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Size</span>
                                                    {sizes.map((s) => (
                                                        <button
                                                            key={s}
                                                            onClick={() => setActiveSize(activeSize === s ? '' : s)}
                                                            aria-label={`Size ${s}`}
                                                            className={`min-w-[2.5rem] text-xs font-semibold rounded-lg px-3 py-2 border transition duration-200 ${
                                                                activeSize === s
                                                                    ? 'bg-primary-accent text-white border-primary-accent'
                                                                    : 'bg-white text-slate-600 border-line hover:border-primary-accent hover:text-primary-accent'
                                                            }`}
                                                        >
                                                            {s}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* trust box — delivery & policy, right under the price */}
                                    <div className="rounded-xl bg-white border border-line p-4 flex flex-col gap-2.5 text-sm">
                                        <div className="flex items-start gap-2.5">
                                            <LocalShippingIcon sx={{ fontSize: "18px", color: "#3b82f6", mt: "0.5px" }} />
                                            <p className="text-slate-600">
                                                Delivery charge (paid in advance): <b className="text-slate-900">Inside Dhaka Tk {delivery.insideDhaka}</b>,{' '}
                                                <b className="text-slate-900">Outside Tk {delivery.outsideDhaka}</b> — Send Money via bKash/Nagad
                                            </p>
                                        </div>
                                        <div className="flex items-start gap-2.5">
                                            <PaymentsIcon sx={{ fontSize: "18px", color: "#3b82f6", mt: "0.5px" }} />
                                            <p className="text-slate-600">
                                                <b className="text-slate-900">Cash on Delivery</b> — Pay the full amount when the product is in your hands
                                            </p>
                                        </div>
                                        <div className="flex items-start gap-2.5">
                                            <CachedIcon sx={{ fontSize: "18px", color: "#3b82f6", mt: "0.5px" }} />
                                            <p className="text-slate-600">
                                                <b className="text-slate-900">7-day Replacement</b> — Easy replacement for any defects
                                            </p>
                                        </div>
                                        <div className="flex items-start gap-2.5">
                                            <ScheduleIcon sx={{ fontSize: "18px", color: "#3b82f6", mt: "0.5px" }} />
                                            <p className="text-slate-600">
                                                <b className="text-slate-900">Delivery time:</b> 24–48 hours in Dhaka, 2–3 business days nationwide
                                            </p>
                                        </div>
                                    </div>

                                    {/* quantity */}
                                    {!outOfStock && (
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Quantity</span>
                                            <div className="flex items-center border border-line rounded-lg overflow-hidden">
                                                <button
                                                    onClick={() => setQty((q) => clampQty(q - 1))}
                                                    className="w-9 h-9 flex items-center justify-center text-slate-600 hover:bg-cloud transition"
                                                    aria-label="Decrease quantity"
                                                >
                                                    <RemoveIcon sx={{ fontSize: "18px" }} />
                                                </button>
                                                <span className="w-10 text-center text-sm font-bold text-slate-900">{qty}</span>
                                                <button
                                                    onClick={() => setQty((q) => clampQty(q + 1))}
                                                    className="w-9 h-9 flex items-center justify-center text-slate-600 hover:bg-cloud transition"
                                                    aria-label="Increase quantity"
                                                >
                                                    <AddIcon sx={{ fontSize: "18px" }} />
                                                </button>
                                            </div>
                                            {product.stock <= 20 && (
                                                <span className="text-xs text-slate-400">Max {product.stock}</span>
                                            )}
                                        </div>
                                    )}

                                    {/* dual actions — desktop / tablet (mobile uses the fixed bar) */}
                                    <div className="hidden md:flex flex-col sm:flex-row gap-2.5 mt-1">
                                        <button
                                            onClick={buyNow}
                                            disabled={outOfStock}
                                            className={`flex-1 flex items-center justify-center gap-2 text-sm font-bold py-3 rounded-xl transition duration-200 ${
                                                outOfStock
                                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                    : 'btn-accent'
                                            }`}
                                        >
                                            <BoltIcon sx={{ fontSize: '18px' }} />
                                            {outOfStock ? 'Out of Stock' : 'Order Now'}
                                        </button>

                                        <button
                                            onClick={itemInCart ? goToCart : addToCartHandler}
                                            disabled={outOfStock}
                                            className={`flex-1 flex items-center justify-center gap-2 text-sm font-bold py-3 rounded-xl border transition duration-200 ${
                                                outOfStock
                                                    ? 'border-line text-slate-400 cursor-not-allowed'
                                                    : 'btn-ghost'
                                            }`}
                                        >
                                            <ShoppingCartIcon sx={{ fontSize: '18px' }} />
                                            {itemInCart ? 'View Cart' : 'Add to Cart'}
                                        </button>
                                    </div>

                                    {/* WhatsApp order */}
                                    <button
                                        onClick={whatsappOrder}
                                        className="hidden md:flex w-full items-center justify-center gap-2 text-sm font-bold py-3 rounded-xl border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 transition duration-200"
                                    >
                                        <ChatIcon sx={{ fontSize: '18px' }} />
                                        WhatsApp Order
                                    </button>

                                    {/* highlights */}
                                    {product.highlights?.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 pt-1">
                                            {product.highlights.map((h, i) => (
                                                <span key={i} className="text-[10px] font-medium text-slate-500 bg-cloud border border-line px-2 py-1 rounded-full">
                                                    {h}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ── info tabs: description / specifications / in the box ── */}
                            <section className="surface">
                                <div className="flex gap-1 sm:gap-2 border-b border-line overflow-x-auto no-scrollbar px-2 sm:px-4">
                                    {infoTabs.map((t) => (
                                        <button
                                            key={t.id}
                                            onClick={() => setActiveTab(t.id)}
                                            className={`shrink-0 px-3 sm:px-4 py-3 text-sm font-semibold border-b-2 -mb-px transition duration-200 ${
                                                activeTab === t.id
                                                    ? 'border-primary-accent text-primary-accent'
                                                    : 'border-transparent text-slate-500 hover:text-slate-800'
                                            }`}
                                        >
                                            {t.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="p-4 sm:p-5">
                                    {activeTab === "description" && (
                                        <div
                                            className="text-sm text-slate-600 rte-content"
                                            dangerouslySetInnerHTML={{ __html: richTextToHtml(product.description) }}
                                        />
                                    )}

                                    {activeTab === "specifications" && (
                                        product.specifications?.length > 0 ? (
                                            <div className="divide-y divide-line">
                                                {product.specifications.map((spec, i) => (
                                                    <div key={i} className="flex items-start gap-4 py-2.5 text-sm">
                                                        <p className="text-slate-500 w-5/12 sm:w-3/12">{spec.title}</p>
                                                        <p className="flex-1 text-slate-800">{spec.description}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-slate-400">No specifications added.</p>
                                        )
                                    )}

                                    {activeTab === "inthebox" && (
                                        <ul className="flex flex-col gap-2">
                                            {product.inTheBox.map((item, i) => (
                                                <li key={i} className="flex items-center gap-2 text-sm text-slate-700">
                                                    <CheckIcon sx={{ fontSize: "16px", color: "#10b981" }} />
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </section>

                            {/* ── reviews ── */}
                            <section className="surface flex flex-col">
                                <div className="flex justify-between items-center border-b border-line px-4 sm:px-5 py-4">
                                    <h2 className="font-display font-bold text-lg text-slate-900">Ratings &amp; Reviews</h2>
                                    <button onClick={() => setOpen(true)} className="btn-accent px-4 py-2 text-xs sm:text-sm">Rate Product</button>
                                </div>

                                <Dialog
                                    aria-labelledby='review-dialog'
                                    open={open}
                                    onClose={() => setOpen(false)}
                                    PaperProps={{
                                        className: 'rounded-2xl overflow-hidden shadow-[0_30px_60px_-30px_rgba(15,23,42,0.9)] w-[calc(100vw-1.25rem)] max-w-[420px]'
                                    }}
                                >
                                    <DialogTitle className="flex items-center gap-2 px-5 sm:px-6 py-4 border-b border-line">
                                        <div className="w-9 h-9 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center">
                                            <StarIcon sx={{ fontSize: '18px' }} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-display font-bold text-slate-900">Submit Review</span>
                                            <span className="text-xs text-slate-500">Share your honest feedback</span>
                                        </div>
                                    </DialogTitle>
                                    <DialogContent className="flex flex-col items-center text-center gap-5 px-5 sm:px-6 py-6">
                                        <div className="flex flex-col items-center gap-2">
                                            <p className="text-sm font-semibold text-slate-800">How would you rate this product?</p>
                                            <Rating onChange={(e) => setRating(e.target.value)} value={rating} size='large' precision={0.5} />
                                            <p className="text-xs text-slate-400">{rating ? `${Number(rating).toFixed(1)} out of 5` : 'Tap a star to rate'}</p>
                                        </div>
                                        <TextField
                                            label="Write your review"
                                            placeholder="Tell others what you liked or didn't like about this product"
                                            multiline
                                            rows={4}
                                            fullWidth
                                            size="small"
                                            variant="outlined"
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: '12px',
                                                }
                                            }}
                                        />
                                    </DialogContent>
                                    <DialogActions className="flex flex-row items-center justify-end gap-2 border-t border-line px-5 sm:px-6 py-3">
                                        <button onClick={() => setOpen(false)} className="px-5 py-2 rounded-xl text-sm font-semibold border border-line bg-white text-slate-700 hover:bg-cloud transition active:scale-[0.98]">Cancel</button>
                                        <button onClick={reviewSubmitHandler} className="px-6 py-2 rounded-xl text-sm font-semibold text-white bg-primary-accent hover:bg-primary-hover shadow-sm transition active:scale-[0.98]">Submit</button>
                                    </DialogActions>
                                </Dialog>

                                <div className="flex items-center border-b border-line px-4 sm:px-5 py-3">
                                    <h1 className="font-display text-3xl font-semibold text-slate-900 flex items-center gap-1">
                                        {(product.ratings || 0).toFixed(1)}<StarIcon sx={{ fontSize: '22px', color: '#f59e0b' }} />
                                    </h1>
                                    <p className="text-lg text-slate-500 ml-2">({product.numOfReviews || 0}) Reviews</p>
                                </div>

                                {(viewAll ? product.reviews?.slice().reverse() : product.reviews?.slice(-3).reverse())?.map((rev, i) => (
                                    <div className="flex flex-col gap-1.5 py-3.5 px-4 sm:px-5 border-b border-line" key={i}>
                                        <Rating name="read-only" value={rev.rating} readOnly size="small" precision={0.5} />
                                        <p className="text-sm text-slate-700">{rev.comment}</p>
                                        <span className="text-xs text-slate-400">by {rev.name}</span>
                                    </div>
                                ))}

                                {product.reviews?.length > 3 && (
                                    <button onClick={() => setViewAll(!viewAll)} className="btn-ghost m-3 py-2 text-sm">
                                        {viewAll ? "View Less" : "View All"}
                                    </button>
                                )}
                            </section>

                            {/* ── related gadgets ── */}
                            {related.length > 0 && (
                                <section>
                                    <div className="flex items-end justify-between gap-3 mb-3">
                                        <div>
                                            <h2 className="font-display font-extrabold text-lg sm:text-xl text-slate-900">Related Gadgets</h2>
                                            <p className="text-sm text-slate-500 mt-0.5">Other popular products in this category</p>
                                        </div>
                                        <Link to="/products" className="text-sm font-semibold text-primary-accent hover:underline shrink-0">View all</Link>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                                        {related.map((p) => (
                                            <ProductCard key={p._id} product={p} />
                                        ))}
                                    </div>
                                </section>
                            )}

                        </div>
                    </main>

                    {/* ── mobile-first fixed purchase bar ── */}
                    <div
                        className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-line"
                        style={{ bottom: `${navHeight}px` }}
                    >
                        <div className="flex items-center gap-2 px-3 py-2.5">
                            <Link
                                to="/products"
                                aria-label="Browse store"
                                className="shrink-0 h-11 w-11 rounded-xl border border-line bg-cloud flex items-center justify-center active:scale-95 transition"
                                style={{ color: 'var(--color-accent)' }}
                            >
                                <StorefrontIcon sx={{ fontSize: '22px' }} />
                            </Link>

                            <button
                                onClick={buyNow}
                                disabled={outOfStock}
                                className={`flex-1 h-11 rounded-xl text-sm font-bold text-white transition active:scale-[0.98] ${
                                    outOfStock ? 'bg-slate-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                                }`}
                            >
                                Buy Now
                            </button>

                            <button
                                onClick={itemInCart ? goToCart : addToCartHandler}
                                disabled={outOfStock}
                                className={`flex-1 h-11 rounded-xl text-sm font-bold text-white transition active:scale-[0.98] ${
                                    outOfStock ? 'bg-slate-300 cursor-not-allowed' : 'bg-primary-accent hover:bg-primary-hover'
                                }`}
                            >
                                {itemInCart ? 'View Cart' : 'Add to Cart'}
                            </button>
                        </div>
                    </div>
                </>
            )}
        </>
    );
};

export default ProductDetails;
