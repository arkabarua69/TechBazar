import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import CircleIcon from '@mui/icons-material/Circle';
import { Link } from 'react-router-dom';
import { formatDate } from '../../utils/functions';

const OrderItem = (props) => {

    const { orderId, name, image, price, quantity, createdAt, deliveredAt, orderStatus } = props;

    return (
        <Link to={`/order_details/${orderId}`} className="border-b border-line px-4 sm:px-5 py-4 flex flex-col sm:flex-row gap-3 hover:bg-cloud transition">
            {/* <!-- image container --> */}
            <div className="w-full sm:w-24 h-24 bg-cloud border border-line rounded-xl overflow-hidden flex-shrink-0">
                <img draggable="false" className="h-full w-full object-cover" src={image} alt={name} />
            </div>
            {/* <!-- image container --> */}

            {/* <!-- order desc container --> */}
            <div className="flex flex-col sm:flex-row justify-between w-full gap-3">

                <div className="flex flex-col gap-1 overflow-hidden">
                    <p className="text-sm font-medium text-slate-900">{name.length > 40 ? `${name.substring(0, 40)}...` : name}</p>
                    <p className="text-xs text-slate-500 mt-2">Quantity: {quantity}</p>
                    <p className="text-xs text-slate-500">Total: ৳{(quantity * price).toLocaleString()}</p>
                </div>

                <div className="flex flex-col sm:flex-row mt-1 sm:mt-0 gap-2 sm:gap-10 sm:w-1/2">
                    <p className="text-sm font-medium text-slate-900">৳{price.toLocaleString()}</p>

                    <div className="flex flex-col gap-1.5">
                        <p className={`self-start inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                            orderStatus === "Shipped"
                                ? "bg-blue-50 text-primary-accent border-blue-200"
                                : orderStatus === "Delivered"
                                    ? "bg-green-50 text-primary-green border-green-200"
                                    : "bg-amber-50 text-amber-600 border-amber-200 bg-yellow-50 text-yellow-600 border-yellow-200"
                        }`}>
                            {orderStatus === "Shipped" ? (
                                <>
                                    <span className="pb-0.5">
                                        <CircleIcon sx={{ fontSize: "14px" }} />
                                    </span>
                                    Shipped
                                </>
                            ) : orderStatus === "Delivered" ? (
                                <>
                                    <span className="pb-0.5">
                                        <CircleIcon sx={{ fontSize: "14px" }} />
                                    </span>
                                    Delivered on {formatDate(deliveredAt)}
                                </>
                            ) : (
                                <>
                                    <span className="pb-0.5">
                                        <RadioButtonUncheckedIcon sx={{ fontSize: "14px" }} />
                                    </span>
                                    Ordered on {formatDate(createdAt)}
                                </>
                            )}
                        </p>
                        {orderStatus === "Delivered" ?
                            <p className="text-xs ml-1 text-slate-500">Your item has been {orderStatus}</p>
                            : orderStatus === "Shipped" ?
                                <p className="text-xs ml-1 text-slate-500">Your item has been {orderStatus}</p> :
                                <p className="text-xs ml-1 text-slate-500">Seller has processed your order</p>
                        }
                    </div>
                </div>

            </div>
            {/* <!-- order desc container --> */}

        </Link>
    );
};

export default OrderItem;
