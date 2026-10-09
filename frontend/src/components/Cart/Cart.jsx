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

    const totalPrice = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const placeOrderHandler = () => {
        navigate('/checkout');
    }

    return (
        <>
            <MetaData title="Shopping Cart | TechBazar" />

            {/* ── cart header band — full-bleed, content centered ── */}
            <section className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-100 border-b border-line">
                <div className="mx-auto max-w-4xl px-5 sm:px-6 py-6 sm:py-8">
                    <h1 className="font-display font-extrabold text-xl sm:text-3xl text-slate-900 leading-tight">
                        Shopping Cart <span className="text-slate-400">({cartItems.length})</span>
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Review your items before checkout</p>
                </div>
            </section>
            {/* ── /cart header band ── */}

            {/* main centered content column */}
            <main className="mx-auto max-w-4xl px-5 sm:px-6 flex flex-col gap-4 pb-28 md:pb-16 mt-6 sm:mt-8">

                {/* <!-- row --> */}
                <div className="flex flex-col sm:flex-row gap-4 w-full">

                    {/* <!-- cart column --> */}
                    <div className="flex-1 flex flex-col gap-4 min-w-0">

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

            {/* sticky mobile checkout bar — app-style, sits above the bottom tab bar */}
            {cartItems.length > 0 && (
                <div className="md:hidden fixed bottom-16 left-0 right-0 z-30 bg-white border-t border-line px-4 py-3 flex items-center justify-between gap-3 shadow-[0_-4px_16px_rgba(15,23,42,0.06)]">
                    <div className="flex flex-col">
                        <span className="text-[11px] text-slate-500">{cartItems.length} item{cartItems.length > 1 ? 's' : ''}</span>
                        <span className="font-display font-bold text-slate-900">Tk {totalPrice.toLocaleString()}</span>
                    </div>
                    <button onClick={placeOrderHandler} className="btn-accent px-5 py-2.5 text-sm font-bold uppercase shrink-0">
                        Checkout
                    </button>
                </div>
            )}
        </>
    );
};

export default Cart;
