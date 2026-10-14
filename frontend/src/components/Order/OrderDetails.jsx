import { useSnackbar } from 'notistack';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { clearErrors, getOrderDetails } from '../../actions/orderAction';
import Loader from '../Layouts/Loader';
import TrackStepper from './TrackStepper';
import MetaData from '../Layouts/MetaData';

const OrderDetails = () => {

    const dispatch = useDispatch();
    const { enqueueSnackbar } = useSnackbar();
    const params = useParams();

    const { order, error, loading } = useSelector((state) => state.orderDetails);

    useEffect(() => {
        if (error) {
            enqueueSnackbar(error, { variant: "error" });
            dispatch(clearErrors());
        }
        dispatch(getOrderDetails(params.id));
    }, [dispatch, error, params.id, enqueueSnackbar]);

    return (
        <>
            <MetaData title="Order Details" />

            <main className="w-full sm:w-11/12 mx-auto flex flex-col gap-4 px-3 sm:px-4 pb-10 mt-3 sm:mt-6">
                {loading ? <Loader /> : (
                    <>
                        {order && order.user && order.shippingInfo && (
                            <div className="flex flex-col gap-4 max-w-6xl mx-auto w-full">

                                <div className="surface overflow-hidden">
                                    <div className="sm:w-1/2 border-r border-line">
                                        <div className="flex flex-col gap-3 my-8 mx-6 sm:mx-10">
                                            <h3 className="font-display font-bold text-slate-900">Delivery Address</h3>
                                            <h4 className="text-slate-900 font-medium">{order.user.name}</h4>
                                            <p className="text-sm text-slate-600">{`${order.shippingInfo.address}, ${order.shippingInfo.city}, ${order.shippingInfo.state} - ${order.shippingInfo.pincode}`}</p>
                                            <div className="divide-y divide-line border-t border-line">
                                                <div className="flex gap-3 text-sm py-2">
                                                    <p className="text-slate-500 text-sm w-28 flex-shrink-0">Email</p>
                                                    <p className="text-slate-900 font-medium break-all">{order.user.email}</p>
                                                </div>
                                                <div className="flex gap-3 text-sm py-2">
                                                    <p className="text-slate-500 text-sm w-28 flex-shrink-0">Phone Number</p>
                                                    <p className="text-slate-900 font-medium">{order.shippingInfo.phoneNo}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {order.orderItems && order.orderItems.map((item) => {

                                    const { _id, image, name, price, quantity } = item;

                                    return (
                                        <div className="flex flex-col sm:flex-row bg-cloud border border-line rounded-xl p-3" key={_id}>

                                            <div className="flex flex-col sm:flex-row sm:w-1/2 gap-2">
                                                <div className="w-full sm:w-24 h-24 bg-cloud border border-line rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center">
                                                    <img draggable="false" className="h-full w-full object-contain p-2" src={image} alt={name} />
                                                </div>
                                                <div className="flex flex-col gap-1 overflow-hidden">
                                                    <p className="text-sm font-medium text-slate-900">{name.length > 60 ? `${name.substring(0, 60)}...` : name}</p>
                                                    <p className="text-xs text-slate-500 mt-2">Quantity: {quantity}</p>
                                                    <p className="text-xs text-slate-500">Price: Tk {price.toLocaleString()}</p>
                                                    <span className="font-medium text-slate-900">Total: Tk {(quantity * price).toLocaleString()}</span>
                                                </div>
                                            </div>

                                            <div className="flex flex-col w-full sm:w-1/2">
                                                <h3 className="font-display font-bold text-slate-900 sm:text-center">Order Status</h3>
                                                <TrackStepper
                                                    orderOn={order.createdAt}
                                                    shippedAt={order.shippedAt}
                                                    deliveredAt={order.deliveredAt}
                                                    activeStep={
                                                        order.orderStatus === "Delivered" ? 2 : order.orderStatus === "Shipped" ? 1 : 0
                                                    }
                                                />
                                            </div>

                                        </div>
                                    )
                                })
                                }
                            </div>
                        )}
                    </>
                )}
            </main>
        </>
    );
};

export default OrderDetails;
