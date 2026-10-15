import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import DeleteIcon from '@mui/icons-material/Delete';
import StarIcon from '@mui/icons-material/Star';
import { removeFromWishlist } from '../../actions/wishlistAction';
import { getDiscount } from '../../utils/functions';

const Product = ({ product, name, price, cuttedPrice, image, ratings, reviews }) => {
    const dispatch = useDispatch();
    const discount = getDiscount(price, cuttedPrice);

    return (
        <div className="surface p-4 flex gap-3 w-full group hover:shadow-md transition duration-200">
            {/* Thumbnail */}
            <div
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden border shrink-0 flex items-center justify-center"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)' }}
            >
                <img draggable="false" src={image} alt={name}
                    className="h-full w-full object-contain p-2" />
            </div>

            {/* Details */}
            <div className="flex flex-col gap-3 w-full min-w-0 py-1">
                <div className="flex justify-between items-start gap-2">
                    <Link to={`/product/${product}`} className="flex flex-col gap-1 min-w-0">
                        <p
                            className="text-sm font-medium line-clamp-2 group-hover:underline"
                            style={{ color: 'var(--color-text-primary)' }}
                        >
                            {name}
                        </p>
                        <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                            <span
                                className="px-1.5 py-0.5 rounded text-white text-[10px] font-bold flex items-center gap-0.5"
                                style={{ backgroundColor: 'var(--color-success)' }}
                            >
                                {ratings} <StarIcon sx={{ fontSize: 11 }} />
                            </span>
                            ({(reviews || 0).toLocaleString()})
                        </span>
                    </Link>
                    <button
                        onClick={() => dispatch(removeFromWishlist(product))}
                        aria-label="Remove from wishlist"
                        className="rounded-full p-1.5 transition-colors duration-150 shrink-0"
                        style={{ color: 'var(--color-text-muted)' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
                    >
                        <DeleteIcon sx={{ fontSize: 20 }} />
                    </button>
                </div>

                {/* Price */}
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>
                        Tk {price.toLocaleString()}
                    </span>
                    {cuttedPrice > price && (
                        <>
                            <span className="text-sm line-through" style={{ color: 'var(--color-text-muted)' }}>
                                Tk {cuttedPrice.toLocaleString()}
                            </span>
                            <span className="text-sm font-semibold" style={{ color: 'var(--color-success)' }}>
                                {discount}% off
                            </span>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Product;
