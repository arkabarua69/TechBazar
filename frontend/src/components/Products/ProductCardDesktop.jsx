import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import StarIcon from '@mui/icons-material/Star';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CheckIcon from '@mui/icons-material/Check';
import InventoryIcon from '@mui/icons-material/Inventory';
import { getDiscount } from '../../utils/functions';
import { addItemsToCart } from '../../actions/cartAction';

// Desktop-optimized product card — larger image area (4:3), brand + name,
// star rating, key highlights, prominent pricing, stock + warranty,
// and dual-action buttons (Order Now / Add to Cart).
const ProductCardDesktop = ({ product }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const [added, setAdded] = useState(false);

    const {
        _id, name, images, ratings, numOfReviews,
        price, cuttedPrice, brand, stock, highlights, warranty,
    } = product || {};

    const discount = Number(getDiscount(price, cuttedPrice)) || 0;
    const image = images && images[0] && images[0].url;
    const outOfStock = stock < 1;
    const savedAmount = (cuttedPrice || 0) - (price || 0);

    const specs = (Array.isArray(highlights) ? highlights : [])
        .filter((h) => h && !/cash on delivery/i.test(h))
        .slice(0, 4);

    const orderNow = async () => {
        if (outOfStock) return;
        try {
            await dispatch(addItemsToCart(_id));
            navigate('/checkout');
        } catch {
            enqueueSnackbar('Could not add to cart', { variant: 'error' });
        }
    };

    const addToCart = async () => {
        if (outOfStock) return;
        try {
            await dispatch(addItemsToCart(_id));
            setAdded(true);
            enqueueSnackbar('Added to cart', { variant: 'success' });
            setTimeout(() => setAdded(false), 1500);
        } catch {
            enqueueSnackbar('Could not add to cart', { variant: 'error' });
        }
    };

    return (
        <div className="group surface overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">

            {/* ── image with corner badges ── */}
            <Link
                to={`/product/${_id}`}
                className="relative aspect-[4/3] bg-cloud border-b border-line overflow-hidden"
            >
                {image && (
                    <img
                        draggable="false"
                        src={image}
                        alt={name}
                        className="h-full w-full object-contain p-1 group-hover:scale-105 transition-transform duration-500"
                    />
                )}

                {/* discount badge */}
                {discount > 0 && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded">
                        {discount}% off
                    </div>
                )}

                {/* COD tag */}
                <div className="absolute top-2 right-2 bg-yellow-500/10 text-yellow-700 text-[10px] font-semibold px-1.5 py-0.5 rounded">
                    COD
                </div>

                {/* out-of-stock overlay */}
                {outOfStock && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="text-white font-bold text-sm">Out of Stock</span>
                    </div>
                )}
            </Link>

            {/* ── details ── */}
            <div className="flex flex-col gap-2.5 p-4 sm:p-5 flex-1">

                {/* brand */}
                {brand?.name && (
                    <span className="text-xxs font-bold uppercase tracking-wider text-slate-400">
                        {brand.name}
                    </span>
                )}

                {/* product name */}
                <Link to={`/product/${_id}`}>
                    <h3 className="font-display font-bold text-sm sm:text-base text-slate-900 leading-tight line-clamp-2 min-h-[2.5rem] hover:text-primary-accent transition-colors duration-200">
                        {name}
                    </h3>
                </Link>

                {/* ratings */}
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5 bg-primary-accent/10 text-slate-800 px-1.5 py-0.5 rounded">
                        <StarIcon sx={{ fontSize: '14px', color: '#eab308' }} />
                        <span className="text-xs font-semibold">
                            {(Number(ratings) || 0).toFixed(1)}
                        </span>
                    </div>
                    <span className="text-xs text-slate-500">
                        ({(numOfReviews || 0).toLocaleString()})
                    </span>
                </div>

                {/* key highlights */}
                {specs.length > 0 && (
                    <ul className="flex flex-col gap-1 mt-1">
                        {specs.map((spec, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-xs text-slate-600">
                                <CheckIcon
                                    sx={{ fontSize: '14px', color: '#10b981', marginTop: '2px' }}
                                />
                                <span className="line-clamp-1">{spec}</span>
                            </li>
                        ))}
                    </ul>
                )}

                {/* price */}
                <div className="flex items-baseline gap-2 mt-2">
                    <span className="font-extrabold text-lg sm:text-xl text-slate-900">
                        Tk {(price || 0).toLocaleString()}
                    </span>
                    {cuttedPrice > (price || 0) && (
                        <>
                            <span className="text-sm text-slate-400 line-through">
                                Tk {(cuttedPrice || 0).toLocaleString()}
                            </span>
                            {savedAmount > 0 && (
                                <span className="text-xs font-semibold text-primary-green bg-green-50 px-1.5 py-0.5 rounded">
                                    Save Tk {savedAmount.toLocaleString()}
                                </span>
                            )}
                        </>
                    )}
                </div>

                {/* stock + warranty */}
                <div className="flex items-center gap-3 mt-1 text-xs">
                    <div className="flex items-center gap-1">
                        <InventoryIcon sx={{ fontSize: '14px' }} />
                        <span
                            className={
                                outOfStock
                                    ? 'text-red-600 font-semibold'
                                    : 'text-primary-green font-semibold'
                            }
                        >
                            {outOfStock ? 'Out of Stock' : `${stock} in stock`}
                        </span>
                    </div>
                    {warranty > 0 && (
                        <>
                            <span className="text-slate-300">•</span>
                            <span className="text-slate-500">
                                {warranty} mo warranty
                            </span>
                        </>
                    )}
                </div>
            </div>

            {/* ── actions ── */}
            <div className="flex gap-2 p-4 sm:p-5 pt-0">
                <button
                    onClick={orderNow}
                    disabled={outOfStock}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition duration-200 ${
                        outOfStock
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'btn-accent'
                    }`}
                >
                    {outOfStock ? 'Out of Stock' : 'Order Now'}
                </button>

                <button
                    onClick={addToCart}
                    disabled={outOfStock}
                    aria-label="Add to cart"
                    title="Add to cart"
                    className={`w-11 flex items-center justify-center rounded-lg border transition duration-200 ${
                        outOfStock
                            ? 'border-line text-slate-300 cursor-not-allowed'
                            : added
                            ? 'border-green-200 bg-green-50 text-green-700'
                            : 'border-line text-slate-600 hover:border-primary-accent hover:text-primary-accent'
                    }`}
                >
                    {added ? (
                        <CheckIcon sx={{ fontSize: '18px' }} />
                    ) : (
                        <ShoppingCartIcon sx={{ fontSize: '18px' }} />
                    )}
                </button>
            </div>
        </div>
    );
};

export default ProductCardDesktop;
