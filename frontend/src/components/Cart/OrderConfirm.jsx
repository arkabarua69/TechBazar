import { useSelector } from 'react-redux';
import CartItem from './CartItem';
import PriceSidebar from './PriceSidebar';
import Stepper from './Stepper';
import { useNavigate } from 'react-router-dom';
import MetaData from '../Layouts/MetaData';

const OrderConfirm = () => {

    const navigate = useNavigate();
    const { cartItems } = useSelector((state) => state.cart);
    const { user } = useSelector((state) => state.user);

    return (
        <>
        <MetaData title="TechBazar: Order Confirmation" />

        <main className="w-full sm:w-11/12 mx-auto flex flex-col gap-4 px-3 sm:px-4 pb-10 mt-3 sm:mt-6">

            {/* <!-- row --> */}
            <div className="flex flex-col sm:flex-row gap-4 w-full">

                {/* <!-- cart column --> */}
                <div className="flex-1">

                    <Stepper activeStep={2}>
                        <div className="w-full">
                            {cartItems?.map((item, i) => (
                                <CartItem {...item} inCart={false} key={i} />
                            ))}
                        </div>
                        <div className="flex flex-wrap justify-between items-center gap-3 border-t border-line px-6 py-4">
                            <p className="text-sm text-slate-600">Order confirmation email will be sent to <span className="font-medium text-slate-800">{user.email}</span></p>
                            <button onClick={() => { navigate('/process/payment') }} className="btn-accent px-6 py-2.5 text-sm font-bold uppercase rounded-lg">continue</button>
                        </div>
                    </Stepper>
                </div>

                <PriceSidebar cartItems={cartItems} />
            </div>
        </main>
        </>
    );
};

export default OrderConfirm;
