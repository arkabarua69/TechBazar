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
            <MetaData title="Shopping Cart" />

            {/* ── Page wrapper ── */}
            <div className="min-h-screen" style={{ backgroundColor: '#f0f2f5' }}>
                <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">

                    {/* Page title */}
                    <h1 className="font-display font-bold text-2xl text-slate-800 mb-6">Cart</h1>

                    {/* Main row: table + sidebar */}
                    <div className="flex flex-col lg:flex-row gap-6 items-start">

                        {/* ── Left: cart table ── */}
                        <div className="flex-1 min-w-0 flex flex-col gap-6">

                            {/* Cart table card */}
                            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">

                                {cartItems.length === 0 ? (
                                    <EmptyCart />
                                ) : (
                                    <>
                                        {/* Table header */}
                                        <div className="hidden sm:grid grid-cols-[2fr_1fr_0.7fr_1fr_1.2fr_1fr_auto] gap-2 px-6 py-3 border-b border-slate-100">
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Products</span>
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Color</span>
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Size</span>
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Price</span>
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Quantity</span>
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total</span>
                                            <span className="w-5" />
                                        </div>

                                        {/* Cart rows */}
                                        {cartItems.map((item) => (
                                            <CartItem key={item.product} {...item} inCart={true} />
                                        ))}

                                        {/* Items subtotal row */}
                                        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
                                            <span className="text-sm text-slate-600 font-medium">Items subtotal :</span>
                                            <span className="font-bold text-slate-900 text-base">
                                                Tk {cartItems.reduce((s, i) => s + i.price * i.quantity, 0).toLocaleString()}
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* ── Saved for later ── */}
                            {saveForLaterItems.length > 0 && (
                                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                                    <div className="px-6 py-4 border-b border-slate-100">
                                        <span className="font-display font-bold text-slate-800">Saved For Later ({saveForLaterItems.length})</span>
                                    </div>
                                    {saveForLaterItems.map((item) => (
                                        <SaveForLaterItem key={item.product} {...item} />
                                    ))}
                                </div>
                            )}
                        </div>
                        {/* ── /Left ── */}

                        {/* ── Right: summary sidebar ── */}
                        <PriceSidebar cartItems={cartItems} onCheckout={placeOrderHandler} />

                    </div>
                </div>
            </div>

            {/* ── Mobile sticky checkout bar ── */}
            {cartItems.length > 0 && (
                <div className="lg:hidden fixed bottom-16 left-0 right-0 z-30 bg-white border-t border-slate-200 px-4 py-3 flex items-center justify-between gap-3 shadow-[0_-4px_16px_rgba(15,23,42,0.08)]">
                    <div className="flex flex-col">
                        <span className="text-[11px] text-slate-500">{cartItems.length} item{cartItems.length > 1 ? 's' : ''}</span>
                        <span className="font-display font-bold text-slate-900">Tk {totalPrice.toLocaleString()}</span>
                    </div>
                    <button
                        onClick={placeOrderHandler}
                        className="text-white text-sm font-bold uppercase px-6 py-2.5 rounded-lg shrink-0"
                        style={{ backgroundColor: '#E84B0F' }}
                    >
                        Checkout
                    </button>
                </div>
            )}
        </>
    );
};

export default Cart;
