import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import MetaData from '../Layouts/MetaData';
import CartItem from './CartItem';
import EmptyCart from './EmptyCart';
import PriceSidebar from './PriceSidebar';
import SaveForLaterItem from './SaveForLaterItem';

const Cart = () => {

    const navigate = useNavigate();
    const { cartItems } = useSelector((state) => state.cart);
    const { saveForLaterItems } = useSelector((state) => state.saveForLater);

    const placeOrderHandler = () => {
        navigate('/checkout');
    }

    return (
        <>
            <MetaData title="Shopping Cart | TechBazar" />
            <main className="w-full sm:w-11/12 mx-auto flex flex-col gap-4 px-3 sm:px-4 pb-10 mt-3 sm:mt-6">

                {/* <!-- row --> */}
                <div className="flex flex-col sm:flex-row gap-4 w-full">

                    {/* <!-- cart column --> */}
                    <div className="flex-1 flex flex-col gap-4">

                        {/* <!-- cart items container --> */}
                        <div className="surface flex flex-col overflow-hidden">
                            <span className="border-b border-line px-4 sm:px-5 py-4 font-display font-bold text-base sm:text-lg text-slate-900">My Cart ({cartItems.length})</span>

                            {cartItems && cartItems.length === 0 && (
                                <EmptyCart />
                            )}

                            {cartItems && cartItems.map((item) => (
                                <CartItem {...item} inCart={true} />
                            )
                            )}

                            {/* <!-- place order btn --> */}
                            <div className="flex justify-end">
                                <button onClick={placeOrderHandler} disabled={cartItems.length < 1 ? true : false} className={`${cartItems.length < 1 ? "bg-slate-200 text-slate-500 cursor-not-allowed" : "btn-accent"} w-full sm:w-1/3 mx-2 sm:mx-6 my-4 py-3 text-sm font-bold`}>PLACE ORDER</button>
                            </div>
                            {/* <!-- place order btn --> */}

                        </div>
                        {/* <!-- cart items container --> */}

                        {/* <!-- saved for later items container --> */}
                        <div className="surface flex flex-col overflow-hidden">
                            <span className="border-b border-line px-4 sm:px-5 py-4 font-display font-bold text-base sm:text-lg text-slate-900">Saved For Later ({saveForLaterItems.length})</span>
                            {saveForLaterItems && saveForLaterItems.map((item) => (
                                <SaveForLaterItem {...item} />
                            )
                            )}
                        </div>
                        {/* <!-- saved for later container --> */}

                    </div>
                    {/* <!-- cart column --> */}

                    <PriceSidebar cartItems={cartItems} />

                </div>
                {/* <!-- row --> */}

            </main>
        </>
    );
};

export default Cart;
