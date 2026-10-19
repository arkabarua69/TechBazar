import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { clearErrors, getProductDetails, getSimilarProducts, newReview } from '../../actions/productAction';
import Loader from '../Layouts/Loader';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import BoltIcon from '@mui/icons-material/Bolt';
import ChatIcon from '@mui/icons-material/Chat';
import StarIcon from '@mui/icons-material/Star';
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
import { addToWishlist, removeFromWishlist } from '../../actions/wishlistAction';
import MetaData from '../Layouts/MetaData';
import ProductCard from '../Home/ProductCard';

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

    // variant + quantity
    const [activeColor, setActiveColor] = useState("");
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
        dispatch(getSimilarProducts(similarCategory));
    }, [dispatch, product, similarCategory]);

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
        setQty(1);
        setActiveTab("description");
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
                    <MetaData title={`${product.name}`} />
                    <main className="mt-4 sm:mt-0">

                        <div className="w-full sm:w-11/12 mx-auto px-3 sm:px-4 flex flex-col gap-4 pb-6">

                            {/* ── gallery + purchase box ── */}
                            <div className="surface p-3 sm:p-5 grid lg:grid-cols-2 gap-5">

                                {/* left: image gallery + thumbnail strip */}
                                <div className="flex flex-col gap-3">
                                    {/* main image — full contain so nothing is cropped */}
                                    <div className="relative bg-white border border-line rounded-xl h-72 sm:h-[30rem] lg:h-[32rem] flex items-center justify-center overflow-hidden group">
                                        {images[activeImage] && (
                                            <img
                                                draggable="false"
                                                src={images[activeImage].url}
                                                alt={product.name}
                                                className="w-full h-full object-contain p-3 sm:p-5 group-hover:scale-105 transition duration-300"
                                            />
                                        )}

                                        {/* corner badges */}
                                        <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5">
                                            {outOfStock ? (
                                                <span className="text-[10px] font-bold uppercase tracking-wide text-white bg-red-600 px-2 py-1 rounded shadow">Out of Stock</span>
                                            ) : Number(discount) > 0 && (
                                                <span className="text-[10px] font-bold uppercase tracking-wide text-white bg-primary-green px-2 py-1 rounded shadow">{discount}% off</span>
                                            )}
                                            {!outOfStock && (
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
                                    </div>

                                    {/* thumbnail strip — contain so full thumb is visible */}
                                    {images.length > 1 && (
                                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                                            {images.map((img, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => setActiveImage(i)}
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
                                        <span className="text-xxs font-bold uppercase tracking-wider text-slate-400">{product.brand.name}</span>
                                    )}

                                    <h1 className="font-display font-extrabold text-lg sm:text-2xl text-slate-900 leading-snug">
                                        {product.name}
                                    </h1>

                                    <span className="text-sm text-slate-500 font-medium flex gap-2 items-center">
                                        <span className="text-xs px-1.5 py-0.5 bg-primary-green rounded text-white flex items-center gap-0.5">
                                            {(product.ratings || 0).toFixed(1)} <StarIcon sx={{ fontSize: "12px" }} />
                                        </span>
                                        <span>{product.numOfReviews || 0} Reviews</span>
                                    </span>

                                    {/* price */}
                                    <div className="flex flex-wrap items-baseline gap-2">
                                        <span className="font-extrabold text-3xl text-slate-900">Tk {product.price?.toLocaleString()}</span>
                                        {product.cuttedPrice > product.price && (
                                            <span className="text-base text-slate-400 line-through">Tk {product.cuttedPrice?.toLocaleString()}</span>
                                        )}
                                        {Number(discount) > 0 && (
                                            <span className="text-base font-semibold text-primary-green">{discount}%&nbsp;off</span>
                                        )}
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

                                    {/* color variant */}
                                    {colors.length > 0 && (
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                Color{activeColor ? `: ${activeColor}` : ""}
                                            </span>
                                            <div className="flex flex-wrap gap-1.5">
                                                {colors.map((c) => (
                                                    <button
                                                        key={c}
                                                        onClick={() => setActiveColor(activeColor === c ? "" : c)}
                                                        className={`text-xs font-semibold rounded-lg px-3 py-2 border transition duration-200 ${
                                                            activeColor === c
                                                                ? 'bg-primary-accent text-white border-primary-accent'
                                                                : 'bg-white text-slate-600 border-line hover:border-primary-accent hover:text-primary-accent'
                                                        }`}
                                                    >
                                                        {c}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

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

                                    {/* dual actions */}
                                    <div className="flex flex-col sm:flex-row gap-2.5 mt-1">
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
                                        className="w-full flex items-center justify-center gap-2 text-sm font-bold py-3 rounded-xl border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 transition duration-200"
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
                                        <p className="text-sm text-slate-600 leading-relaxed">{product.description}</p>
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

                                <Dialog aria-labelledby='review-dialog' open={open} onClose={() => setOpen(false)}>
                                    <DialogTitle className="border-b">Submit Review</DialogTitle>
                                    <DialogContent className="flex flex-col m-1 gap-4">
                                        <Rating onChange={(e) => setRating(e.target.value)} value={rating} size='large' precision={0.5} />
                                        <TextField
                                            label="Review"
                                            multiline
                                            rows={3}
                                            sx={{ width: 400, maxWidth: '80vw' }}
                                            size="small"
                                            variant="outlined"
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                        />
                                    </DialogContent>
                                    <DialogActions>
                                        <button onClick={() => setOpen(false)} className="py-2 px-6 rounded shadow bg-white border border-red-500 hover:bg-red-100 text-red-600 uppercase">Cancel</button>
                                        <button onClick={reviewSubmitHandler} className="py-2 px-6 rounded bg-green-600 hover:bg-green-700 text-white shadow uppercase">Submit</button>
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
                </>
            )}
        </>
    );
};

export default ProductDetails;
