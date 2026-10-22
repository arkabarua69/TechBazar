import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useSnackbar } from 'notistack';
import StarIcon from '@mui/icons-material/Star';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CheckIcon from '@mui/icons-material/Check';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { useState } from 'react';
import { getDiscount } from '../../utils/functions';
import { addItemsToCart } from '../../actions/cartAction';
import { addToWishlist, removeFromWishlist } from '../../actions/wishlistAction';

// MegaMart-style product card:
//   image with corner OFF% badge · save amount · title · rating · price row
const ProductCard = ({ product }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const [added, setAdded] = useState(false);

    const { wishlistItems } = useSelector((state) => state.wishlist);
    const { _id, name, images, ratings, numOfReviews, price, cuttedPrice, brand, stock } = product || {};
    const inWishlist = wishlistItems?.some((i) => i.product === _id);

    const discount = Number(getDiscount(price, cuttedPrice)) || 0;
    const saveAmount = cuttedPrice && price ? cuttedPrice - price : 0;
    const image = images?.[0]?.url;
    const outOfStock = stock < 1;

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
        <div
            className="group flex flex-col overflow-hidden transition-all duration-200"
            style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--card-radius)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 24px var(--shadow-accent-soft)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)'}
        >
            {/* Image area */}
            <Link to={`/product/${_id}`} className="relative block overflow-hidden" style={{ backgroundColor: '#fff', borderBottom: '1px solid var(--color-border)' }}>
                <div className="h-40 sm:h-48 flex items-center justify-center p-3 sm:p-4">
                    {image && (
                        <img
                            draggable="false"
                            src={image}
                            alt={name}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                        />
                    )}
                </div>

                {/* Top badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {discount > 0 && !outOfStock && (
                        <span
                            className="text-[10px] font-bold text-white px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: 'var(--color-accent)' }}
                        >
                            {discount}%<br />OFF
                        </span>
                    )}
                    {outOfStock && (
                        <span className="text-[10px] font-bold text-white bg-gray-500 px-1.5 py-0.5 rounded">
                            OUT
                        </span>
                    )}
                </div>

                {/* Wishlist icon */}
                <button
                    className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-all duration-200 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 ${inWishlist ? 'bg-[var(--color-accent)]' : 'bg-white hover:bg-white/90'}`}
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (inWishlist) {
                            dispatch(removeFromWishlist(_id));
                            enqueueSnackbar('Removed from wishlist', { variant: 'success' });
                        } else {
                            dispatch(addToWishlist(_id));
                            enqueueSnackbar('Added to wishlist', { variant: 'success' });
                        }
                    }}
                    aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                    {inWishlist
                        ? <FavoriteIcon sx={{ fontSize: '16px', color: '#fff' }} />
                        : <FavoriteBorderIcon sx={{ fontSize: '16px', color: 'var(--color-accent)' }} />}
                </button>
            </Link>

            {/* Info area */}
            <div className="flex flex-col gap-1 p-3 flex-1">
                {brand?.name && (
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                        {brand.name}
                    </span>
                )}

                <Link to={`/product/${_id}`}>
                    <h3
                        className="text-xs sm:text-sm font-medium leading-snug line-clamp-2 transition-colors"
                        style={{ color: 'var(--color-text-primary)', minHeight: '2.4rem' }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--color-accent)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-primary)'}
                    >
                        {name}
                    </h3>
                </Link>

                {/* Rating */}
                <div className="flex items-center gap-1.5 text-xs mt-0.5">
                    <span
                        className="flex items-center gap-0.5 text-white px-1.5 py-0.5 rounded font-semibold"
                        style={{ backgroundColor: '#16a34a', fontSize: '10px' }}
                    >
                        {(Number(ratings) || 0).toFixed(1)}
                        <StarIcon sx={{ fontSize: '10px' }} />
                    </span>
                    <span style={{ color: 'var(--color-text-muted)' }}>({numOfReviews || 0})</span>
                </div>

                {/* Price row */}
                <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-bold text-base sm:text-lg" style={{ color: 'var(--color-text-primary)' }}>
                        Tk {(price || 0).toLocaleString()}
                    </span>
                    {cuttedPrice > price && (
                        <span className="text-xs line-through" style={{ color: 'var(--color-text-muted)' }}>
                            Tk {cuttedPrice.toLocaleString()}
                        </span>
                    )}
                </div>

                {/* Save line — MegaMart style */}
                {saveAmount > 0 && (
                    <p className="text-xs font-semibold" style={{ color: 'var(--color-success, #16a34a)' }}>
                        Save - Tk {saveAmount.toLocaleString()}
                    </p>
                )}
            </div>

            {/* Actions */}
            <div className="flex items-stretch gap-2 px-3 pb-3 mt-auto">
                <button
                    onClick={orderNow}
                    disabled={outOfStock}
                    className="flex-1 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200"
                    style={
                        outOfStock
                            ? { backgroundColor: 'var(--color-border)', color: 'var(--color-text-muted)', cursor: 'not-allowed' }
                            : { backgroundColor: 'var(--color-accent)', color: '#fff' }
                    }
                >
                    {outOfStock ? 'Out of Stock' : 'Order Now'}
                </button>

                <button
                    onClick={addToCart}
                    disabled={outOfStock}
                    aria-label="Add to cart"
                    className="w-9 sm:w-10 flex items-center justify-center rounded-lg border transition-all duration-200"
                    style={
                        outOfStock
                            ? { borderColor: 'var(--color-border)', color: 'var(--color-text-muted)', cursor: 'not-allowed' }
                            : added
                                ? { borderColor: '#16a34a', backgroundColor: '#f0fdf4', color: '#16a34a' }
                                : { borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }
                    }
                    onMouseEnter={e => { if (!outOfStock && !added) e.currentTarget.style.borderColor = 'var(--color-accent)'; }}
                    onMouseLeave={e => { if (!outOfStock && !added) e.currentTarget.style.borderColor = 'var(--color-border)'; }}
                >
                    {added ? <CheckIcon sx={{ fontSize: '16px' }} /> : <ShoppingCartIcon sx={{ fontSize: '16px' }} />}
                </button>
            </div>
        </div>
    );
};

export default ProductCard;
