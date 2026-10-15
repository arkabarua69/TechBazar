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
    const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const placeOrderHandler = () => navigate('/checkout');

    return (
        <>
            <MetaData title="Shopping Cart" />
            <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
                <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8">
                    <h1
                        className="font-bold text-xl sm:text-2xl mb-5"
                        style={{ color: 'var(--color-text-primary)' }}
                    >
                        Shopping Cart
                        {cartItems.length > 0 && (
                            <span className="ml-2 text-base font-normal" style={{ color: 'var(--color-text-muted)' }}>
                                ({cartItems.length} item{cartItems.length !== 1 ? 's' : ''})
                            </span>
                        )}
                    </h1>

                    <div className="flex flex-col lg:flex-row gap-5 items-start">
                        {/* Left: cart items */}
                        <div className="flex-1 min-w-0 flex flex-col gap-5">
                            <div className="surface overflow-hidden">
                                {cartItems.length === 0 ? (
                                    <EmptyCart />
                                ) : (
                                    <>
                                        {/* Table header — desktop only */}
                                        <div
                                            className="hidden sm:grid grid-cols-[2fr_1fr_1.2fr_1fr_auto] gap-2 px-6 py-3 border-b"
                                            style={{ borderColor: 'var(--color-border)' }}
                                        >
                                            {['Products', 'Price', 'Quantity', 'Total', ''].map((h) => (
                                                <span
                                                    key={h}
                                                    className="text-xs font-bold uppercase tracking-wide"
                                                    style={{ color: 'var(--color-text-muted)' }}
                                                >
                                                    {h}
                                                </span>
                                            ))}
                                        </div>

                                        {cartItems.map((item) => (
                                            <CartItem key={item.product} {...item} inCart={true} />
                                        ))}

                                        {/* Subtotal */}
                                        <div
                                            className="flex items-center justify-between px-5 sm:px-6 py-4 border-t"
                                            style={{ borderColor: 'var(--color-border)' }}
                                        >
                                            <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                                                Items subtotal
                                            </span>
                                            <span className="font-bold text-base" style={{ color: 'var(--color-text-primary)' }}>
                                                Tk {totalPrice.toLocaleString()}
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Saved for later */}
                            {saveForLaterItems.length > 0 && (
                                <div className="surface overflow-hidden">
                                    <div
                                        className="px-5 sm:px-6 py-4 border-b"
                                        style={{ borderColor: 'var(--color-border)' }}
                                    >
                                        <span className="font-bold text-base" style={{ color: 'var(--color-text-primary)' }}>
                                            Saved For Later ({saveForLaterItems.length})
                                        </span>
                                    </div>
                                    {saveForLaterItems.map((item) => (
                                        <SaveForLaterItem key={item.product} {...item} />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Right: price sidebar */}
                        <PriceSidebar cartItems={cartItems} onCheckout={placeOrderHandler} />
                    </div>
                </div>
            </div>

            {/* Mobile sticky checkout bar */}
            {cartItems.length > 0 && (
                <div
                    className="lg:hidden fixed bottom-16 left-0 right-0 z-30 border-t px-4 py-3 flex items-center justify-between gap-3"
                    style={{
                        backgroundColor: 'var(--color-surface)',
                        borderColor: 'var(--color-border)',
                        boxShadow: '0 -4px 16px rgba(0,0,0,0.08)',
                    }}
                >
                    <div className="flex flex-col">
                        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                            {cartItems.length} item{cartItems.length !== 1 ? 's' : ''}
                        </span>
                        <span className="font-bold text-base" style={{ color: 'var(--color-text-primary)' }}>
                            Tk {totalPrice.toLocaleString()}
                        </span>
                    </div>
                    <button onClick={placeOrderHandler} className="btn-accent px-6 py-2.5 text-sm shrink-0">
                        Checkout
                    </button>
                </div>
            )}
        </>
    );
};

export default Cart;
