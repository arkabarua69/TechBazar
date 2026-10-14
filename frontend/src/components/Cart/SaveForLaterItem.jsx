import { useSnackbar } from 'notistack';
import { useDispatch } from 'react-redux';
import { addItemsToCart } from '../../actions/cartAction';
import { removeFromSaveForLater } from '../../actions/saveForLaterAction';
import { getDiscount } from '../../utils/functions';

const SaveForLaterItem = ({ product, name, seller, price, cuttedPrice, image, stock, quantity }) => {

    const dispatch = useDispatch();
    const { enqueueSnackbar } = useSnackbar();

    const removeFromSaveForLaterHandler = (id) => {
        dispatch(removeFromSaveForLater(id));
        enqueueSnackbar("Removed From Save For Later", { variant: "success" });
    }

    const moveToCartHandler = (id, quantity) => {
        dispatch(addItemsToCart(id, quantity));
        removeFromSaveForLaterHandler(id);
        enqueueSnackbar("Product Added To Cart", { variant: "success" });
    }

    return (
        <div className="flex flex-col gap-3 py-5 pl-2 sm:pl-6 border-b border-line" key={product}>

            <div className="flex flex-col sm:flex-row gap-5 items-stretch w-full" href="#">
                {/* <!-- product image --> */}
                <div className="w-full sm:w-28 h-28 flex-shrink-0 bg-cloud border border-line rounded-xl overflow-hidden flex items-center justify-center">
                    <img draggable="false" className="h-full w-full object-contain p-2" src={image} alt={name} />
                </div>
                {/* <!-- product image --> */}

                {/* <!-- description --> */}
                <div className="flex flex-col gap-1 sm:gap-5 w-full p-1 pr-6">
                    {/* <!-- product title --> */}
                    <div className="flex justify-between items-start pr-5">
                        <div className="flex flex-col gap-0.5 w-11/12 sm:w-full">
                            <p>{name.length > 50 ? `${name.substring(0, 50)}...` : name}</p>
                            <span className="text-sm text-slate-500">Seller: {seller}</span>
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
            </div>

            {/* <!-- move to cart --> */}
            <div className="flex justify-evenly sm:justify-start sm:gap-6">
                {/* <!-- quantity --> */}
                <div className="flex gap-1 items-center">
                    <span className="w-7 h-7 text-3xl font-light bg-cloud border border-line rounded-full flex items-center justify-center cursor-not-allowed"><p>-</p></span>
                    <input className="w-11 border border-line rounded-lg outline-none text-center py-1 text-slate-700 font-medium text-sm" value={quantity} disabled />
                    <span className="w-7 h-7 text-xl font-light bg-cloud border border-line rounded-full flex items-center justify-center cursor-not-allowed">+</span>
                </div>
                {/* <!-- quantity --> */}
                <button onClick={() => moveToCartHandler(product, quantity)} className="sm:ml-4 text-primary-accent text-sm font-semibold hover:opacity-75 transition duration-200">MOVE TO CART</button>
                <button onClick={() => removeFromSaveForLaterHandler(product)} className="text-sm font-semibold text-slate-500 hover:text-red-600 transition duration-200">REMOVE</button>
            </div>
            {/* <!-- move to cart --> */}

        </div>
    );
};

export default SaveForLaterItem;
