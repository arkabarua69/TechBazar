import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useSnackbar } from 'notistack';
import StarIcon from '@mui/icons-material/Star';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CheckIcon from '@mui/icons-material/Check';
import { useState } from 'react';
import { getDiscount } from '../../utils/functions';
import { addItemsToCart } from '../../actions/cartAction';

// High-converting product card for BD gadget shoppers:
// image + corner badges (COD / discount / out of stock) → 2-line title +
// spec chips → Sora price + delivery-charge note → "অর্ডার করুন" + cart button
const ProductCard = ({ product }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const [added, setAdded] = useState(false);

    const { _id, name, images, ratings, numOfReviews, price, cuttedPrice, brand, stock, highlights } = product || {};

    const discount = Number(getDiscount(price, cuttedPrice)) || 0;
    const image = images && images[0] && images[0].url;
    const outOfStock = stock < 1;
    const hotDeal = discount >= 25;

    // spec chips (skip the COD line — it has its own badge)
    const specs = (Array.isArray(highlights) ? highlights : [])
        .filter((h) => h && !/cash on delivery/i.test(h))
        .slice(0, 2);

    const orderNow = async () => {
        if (outOfStock) return;
        try {
            await dispatch(addItemsToCart(_id));
            navigate('/checkout');
        } catch {
            enqueueSnackbar('পণ্যটি কার্টে যোগ করা যায়নি', { variant: 'error' });
        }
    };

    const addToCart = async () => {
        if (outOfStock) return;
        try {
            await dispatch(addItemsToCart(_id));
            setAdded(true);
            enqueueSnackbar('কার্টে যোগ হয়েছে', { variant: 'success' });
            setTimeout(() => setAdded(false), 1500);
        } catch {
            enqueueSnackbar('পণ্যটি কার্টে যোগ করা যায়নি', { variant: 'error' });
        }
    };

    return (
        <div className="group surface overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition duration-200 flex flex-col">

            {/* ── image ── */}
            <Link to={`/product/${_id}`} className="relative h-36 sm:h-44 bg-white border-b border-line overflow-hidden">
                {image && (
                    <img
                        draggable="false"
                        src={image}
                        alt={name}
                        className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                    />
                )}

                {/* corner badges */}
                <div className="absolute top-2.5 left-2.5 flex flex-col items-start gap-1.5">
                    {outOfStock ? (
                        <span className="text-[10px] font-bold uppercase tracking-wide text-white bg-red-500 px-2 py-1 rounded shadow">
                            Out of Stock
                        </span>
                    ) : hotDeal ? (
                        <span className="text-[10px] font-bold uppercase tracking-wide text-white bg-red-500 px-2 py-1 rounded shadow">
                            🔥 Hot Deal
                        </span>
                    ) : null}
                    {discount > 0 && !outOfStock && (
                        <span className="text-[10px] font-bold uppercase tracking-wide text-white bg-green-500 px-2 py-1 rounded shadow">
                            {discount}% off
                        </span>
                    )}
                </div>

                {!outOfStock && (
                    <span className="absolute bottom-2.5 left-2.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wide text-white bg-yellow-500 px-2 py-0.5 rounded-full shadow-sm">
                        ক্যাশ অন ডেলিভারি
                    </span>
                )}
            </Link>

            {/* ── details ── */}
            <div className="flex flex-col gap-1.5 p-3 sm:p-3.5 flex-1">
                {brand && brand.name && (
                    <span className="text-xxs font-bold uppercase tracking-wider text-slate-400">{brand.name}</span>
                )}

                <Link to={`/product/${_id}`}>
                    <h3 className="text-xs sm:text-sm font-medium text-slate-800 leading-snug line-clamp-2 min-h-[2rem] sm:min-h-[2.5rem] hover:text-primary-accent transition duration-200">
                        {name}
                    </h3>
                </Link>

                {/* spec chips */}
                {specs.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {specs.map((spec, i) => (
                            <span key={i} className="text-[9px] font-medium text-slate-500 bg-cloud border border-line px-1.5 py-0.5 rounded">
                                {spec}
                            </span>
                        ))}
                    </div>
                )}

                <div className="flex items-center gap-2 text-xs">
                    <span className="flex items-center gap-0.5 bg-primary-green text-white px-1.5 py-0.5 rounded font-semibold">
                        {(Number(ratings) || 0).toFixed(1)}
                        <StarIcon sx={{ fontSize: '12px' }} />
                    </span>
                    <span className="text-slate-500">({(numOfReviews || 0).toLocaleString()})</span>
                </div>

                {/* price (Sora, bold) */}
                <div className="flex items-baseline gap-2 pt-0.5">
                    <span className="font-extrabold text-base sm:text-lg text-slate-900">৳{(price || 0).toLocaleString()}</span>
                    <span className="text-xs text-slate-400 line-through">৳{(cuttedPrice || 0).toLocaleString()}</span>
                </div>

                {/* delivery charge note — no surprises at checkout */}
                <p className="text-[10px] text-slate-400 leading-tight">
                    ডেলিভারি চার্জ অগ্রিম (৳৭০ / ৳১৩০)
                </p>
            </div>

            {/* ── actions ── */}
            <div className="flex items-stretch gap-2 px-3 sm:px-3.5 pb-3 sm:pb-3.5 mt-auto">
                <button
                    onClick={orderNow}
                    disabled={outOfStock}
                    className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-semibold transition duration-200 ${
                        outOfStock
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'btn-accent'
                    }`}
                >
                    {outOfStock ? 'স্টক নেই' : 'অর্ডার করুন'}
                </button>

                <button
                    onClick={addToCart}
                    disabled={outOfStock}
                    aria-label="Add to cart"
                    title="কার্টে যোগ করুন"
                    className={`w-9 sm:w-10 flex items-center justify-center rounded-lg border transition duration-200 ${
                        outOfStock
                            ? 'border-line text-slate-300 cursor-not-allowed'
                            : added
                                ? 'border-green-200 bg-green-50 text-green-700'
                                : 'border-line text-slate-600 hover:border-primary-accent hover:text-primary-accent'
                    }`}
                >
                    {added ? <CheckIcon sx={{ fontSize: '18px' }} /> : <ShoppingCartIcon sx={{ fontSize: '18px' }} />}
                </button>
            </div>
        </div>
    );
};

export default ProductCard;
