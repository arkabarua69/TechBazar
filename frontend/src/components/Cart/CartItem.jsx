import { useSnackbar } from 'notistack';
import { useDispatch } from 'react-redux';
import { addItemsToCart, removeItemsFromCart } from '../../actions/cartAction';
import { getDiscount } from '../../utils/functions';
import { saveForLater } from '../../actions/saveForLaterAction';
import { Link } from 'react-router-dom';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

const CartItem = ({ product, name, seller, price, cuttedPrice, image, stock, quantity, inCart }) => {

    const dispatch = useDispatch();
    const { enqueueSnackbar } = useSnackbar();

    const increaseQuantity = (id, qty, stock) => {
        if (qty >= stock) {
            enqueueSnackbar("Maximum Order Quantity", { variant: "warning" });
            return;
        }
        dispatch(addItemsToCart(id, qty + 1));
    };

    const decreaseQuantity = (id, qty) => {
        if (qty <= 1) return;
        dispatch(addItemsToCart(id, qty - 1));
    };

    const removeCartItem = (id) => {
        dispatch(removeItemsFromCart(id));
        enqueueSnackbar("Product Removed From Cart", { variant: "success" });
    };

    const saveForLaterHandler = (id) => {
        dispatch(saveForLater(id));
        removeCartItem(id);
        enqueueSnackbar("Saved For Later", { variant: "success" });
    };

    const discount = getDiscount(price, cuttedPrice);

    return (
        <>
            {/* ── Desktop row (table-style) ── */}
            <div className="hidden sm:grid grid-cols-[2fr_1fr_0.7fr_1fr_1.2fr_1fr_auto] gap-2 items-center px-6 py-4 border-b border-slate-100 hover:bg-slate-50 transition-colors">

                {/* Product */}
                <Link to={`/product/${product}`} className="flex items-center gap-3 group">
                    <div className="w-14 h-14 flex-shrink-0 bg-slate-50 border border-slate-100 rounded-xl overflow-hidden flex items-center justify-center">
                        <img draggable="false" className="h-full w-full object-contain p-1" src={image} alt={name} />
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                        <p
                            className="text-sm font-medium leading-snug group-hover:underline transition-colors truncate"
                            style={{ color: 'var(--color-accent)' }}
                        >
                            {name.length > 40 ? `${name.substring(0, 40)}…` : name}
                        </p>
                        <span className="text-xs text-slate-400">Seller: {seller}</span>
                    </div>
                </Link>

                {/* Color — not stored per-item; show dash */}
                <span className="text-sm text-slate-600">—</span>

                {/* Size — not stored per-item; show dash */}
                <span className="text-sm text-slate-600">—</span>

                {/* Price */}
                <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold text-slate-800">Tk {price.toLocaleString()}</span>
                    {discount > 0 && (
                        <span className="text-xs text-slate-400 line-through">Tk {cuttedPrice.toLocaleString()}</span>
                    )}
                </div>

                {/* Quantity stepper */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => decreaseQuantity(product, quantity)}
                        className="w-7 h-7 flex items-center justify-center rounded-full border border-slate-200 text-lg font-light text-slate-600 hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors"
                    >−</button>
                    <span className="w-8 text-center text-sm font-semibold text-slate-800">{quantity}</span>
                    <button
                        onClick={() => increaseQuantity(product, quantity, stock)}
                        className="w-7 h-7 flex items-center justify-center rounded-full border border-slate-200 text-lg font-light text-slate-600 hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors"
                    >+</button>
                </div>

                {/* Total */}
                <span className="text-sm font-bold" style={{ color: 'var(--color-accent)' }}>
                    Tk {(price * quantity).toLocaleString()}
                </span>

                {/* Delete */}
                {inCart && (
                    <button onClick={() => removeCartItem(product)} className="text-slate-300 hover:text-red-500 transition-colors ml-1">
                        <DeleteOutlineIcon fontSize="small" />
                    </button>
                )}
            </div>

            {/* ── Mobile card ── */}
            <div className="sm:hidden flex gap-3 px-4 py-4 border-b border-slate-100">
                <Link to={`/product/${product}`} className="w-16 h-16 flex-shrink-0 bg-slate-50 border border-slate-100 rounded-xl overflow-hidden flex items-center justify-center">
                    <img draggable="false" className="h-full w-full object-contain p-1" src={image} alt={name} />
                </Link>
                <div className="flex-1 min-w-0 flex flex-col gap-2">
                    <Link to={`/product/${product}`}>
                        <p className="text-sm font-medium leading-snug" style={{ color: 'var(--color-accent)' }}>
                            {name.length > 45 ? `${name.substring(0, 45)}…` : name}
                        </p>
                    </Link>
                    <div className="flex items-baseline gap-2">
                        <span className="text-sm font-bold text-slate-800">Tk {(price * quantity).toLocaleString()}</span>
                        {discount > 0 && (
                            <span className="text-xs text-slate-400 line-through">Tk {(cuttedPrice * quantity).toLocaleString()}</span>
                        )}
                        {discount > 0 && (
                            <span className="text-xs font-semibold" style={{ color: 'var(--color-accent)' }}>{discount}% off</span>
                        )}
                    </div>
                    <div className="flex items-center justify-between">
                        {/* qty stepper */}
                        <div className="flex items-center gap-1">
                            <button onClick={() => decreaseQuantity(product, quantity)} className="w-7 h-7 flex items-center justify-center rounded-full border border-slate-200 text-lg font-light">−</button>
                            <span className="w-7 text-center text-sm font-semibold">{quantity}</span>
                            <button onClick={() => increaseQuantity(product, quantity, stock)} className="w-7 h-7 flex items-center justify-center rounded-full border border-slate-200 text-lg font-light">+</button>
                        </div>
                        {inCart && (
                            <div className="flex gap-3">
                                <button onClick={() => saveForLaterHandler(product)} className="text-xs font-semibold" style={{ color: 'var(--color-accent)' }}>Save</button>
                                <button onClick={() => removeCartItem(product)} className="text-xs font-semibold text-slate-400 hover:text-red-500">Remove</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default CartItem;
