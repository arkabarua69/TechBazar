import { useSnackbar } from 'notistack';
import { useDispatch } from 'react-redux';
import { addItemsToCart, removeItemsFromCart } from '../../actions/cartAction';
import { getDeliveryDate, getDiscount } from '../../utils/functions';
import { saveForLater } from '../../actions/saveForLaterAction';
import { Link } from 'react-router-dom';

const CartItem = ({ product, name, seller, price, cuttedPrice, image, stock, quantity, inCart }) => {

    const dispatch = useDispatch();
    const { enqueueSnackbar } = useSnackbar();

    const increaseQuantity = (id, quantity, stock) => {
        const newQty = quantity + 1;
        if (quantity >= stock) {
            enqueueSnackbar("Maximum Order Quantity", { variant: "warning" });
            return;
        };
        dispatch(addItemsToCart(id, newQty));
    }

    const decreaseQuantity = (id, quantity) => {
        const newQty = quantity - 1;
        if (quantity <= 1) return;
        dispatch(addItemsToCart(id, newQty));
    }
    
    const removeCartItem = (id) => {
        dispatch(removeItemsFromCart(id));
        enqueueSnackbar("Product Removed From Cart", { variant: "success" });
    }

    const saveForLaterHandler = (id) => {
        dispatch(saveForLater(id));
        removeCartItem(id);
        enqueueSnackbar("Saved For Later", { variant: "success" });
    }

    return (
        <div className="flex flex-col gap-3 py-5 pl-2 sm:pl-6 border-b border-line overflow-hidden" key={product}>

            <Link to={`/product/${product}`} className="flex flex-col sm:flex-row gap-5 items-stretch w-full group">
                {/* <!-- product image --> */}
                <div className="w-full sm:w-28 h-28 flex-shrink-0 bg-cloud border border-line rounded-xl overflow-hidden flex items-center justify-center">
                    <img draggable="false" className="h-full w-full object-contain p-2" src={image} alt={name} />
                </div>
                {/* <!-- product image --> */}

                {/* <!-- description --> */}
                <div className="flex flex-col sm:gap-5 w-full pr-6">
                    {/* <!-- product title --> */}
                    <div className="flex flex-col sm:flex-row justify-between items-start pr-5 gap-1 sm:gap-0">
                        <div className="flex flex-col gap-0.5 sm:w-3/5">
                            <p className="group-hover:text-primary-accent transition duration-200">{name.length > 42 ? `${name.substring(0, 42)}...` : name}</p>
                            <span className="text-sm text-slate-500">Seller: {seller}</span>
                        </div>

                        <div className="flex flex-col sm:gap-2">
                            <p className="text-sm text-slate-600">Delivery by {getDeliveryDate()} | <span className="text-primary-green">Free</span> <span className="line-through">Tk {quantity * 40}</span></p>
                            <span className="text-xs text-slate-400">7 Days Replacement Policy</span>
                        </div>

                    </div>
                    {/* <!-- product title --> */}

                    {/* <!-- price desc --> */}
                    <div className="flex items-baseline gap-2 text-xl font-medium">
                        <span>Tk {(price * quantity).toLocaleString()}</span>
                        <span className="text-sm text-slate-400 line-through font-normal">Tk {(cuttedPrice * quantity).toLocaleString()}</span>
                        <span className="text-sm text-primary-green">{getDiscount(price, cuttedPrice)}%&nbsp;off</span>
                    </div>
                    {/* <!-- price desc --> */}

                </div>
                {/* <!-- description --> */}
            </Link>

            {/* <!-- save for later --> */}
            <div className="flex justify-between pr-4 sm:pr-0 sm:justify-start sm:gap-6">
                {/* <!-- quantity --> */}
                <div className="flex gap-1 items-center">
                    <span onClick={() => decreaseQuantity(product, quantity)} className="w-7 h-7 text-3xl font-light bg-cloud border border-line rounded-full flex items-center justify-center cursor-pointer"><p>-</p></span>
                    <input className="w-11 border border-line rounded-lg outline-none text-center py-1 text-slate-700 font-medium text-sm qtyInput" value={quantity} disabled />
                    <span onClick={() => increaseQuantity(product, quantity, stock)} className="w-7 h-7 text-xl font-light bg-cloud border border-line rounded-full flex items-center justify-center cursor-pointer">+</span>
                </div>
                {/* <!-- quantity --> */}
                {inCart && (
                    <>
                    <button onClick={() => saveForLaterHandler(product)} className="sm:ml-4 text-primary-accent text-sm font-semibold hover:text-blue-600 transition duration-200">SAVE FOR LATER</button>
                    <button onClick={() => removeCartItem(product)} className="text-sm font-semibold text-slate-500 hover:text-red-600 transition duration-200">REMOVE</button>
                    </>
                )}
            </div>
            {/* <!-- save for later --> */}

        </div>
    );
};

export default CartItem;
