import CelebrationIcon from '@mui/icons-material/Celebration';

const PriceSidebar = ({ cartItems, onCheckout }) => {
    const mrpTotal = cartItems.reduce((s, i) => s + i.cuttedPrice * i.quantity, 0);
    const priceTotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
    const discount = mrpTotal - priceTotal;

    return (
        <div className="flex sticky top-20 flex-col sm:w-72 shrink-0 w-full">
            <div className="surface overflow-hidden">
                <h2
                    className="border-b px-5 py-4 font-bold text-sm uppercase tracking-wider"
                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
                >
                    Price Details
                </h2>

                <div className="flex flex-col gap-4 p-5">
                    {/* MRP */}
                    <div className="flex justify-between text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        <span>MRP ({cartItems.length} item{cartItems.length !== 1 ? 's' : ''})</span>
                        <span>Tk {mrpTotal.toLocaleString()}</span>
                    </div>

                    {/* Discount */}
                    {discount > 0 && (
                        <div className="flex justify-between text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                            <span>Discount</span>
                            <span style={{ color: 'var(--color-success)' }}>
                                − Tk {discount.toLocaleString()}
                            </span>
                        </div>
                    )}

                    {/* Delivery */}
                    <div className="flex justify-between text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        <span>Delivery Charge</span>
                        <span style={{ color: 'var(--color-text-muted)' }}>Tk 70 – 130 (advance)</span>
                    </div>

                    {/* Total */}
                    <div
                        className="flex justify-between pt-3 border-t font-bold text-base"
                        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                    >
                        <span>Total (on delivery)</span>
                        <span>Tk {priceTotal.toLocaleString()}</span>
                    </div>

                    {discount > 0 && (
                        <p className="text-xs font-semibold" style={{ color: 'var(--color-success)' }}>
                            You save Tk {discount.toLocaleString()} on this order <CelebrationIcon sx={{ fontSize: '14px', verticalAlign: 'middle', color: 'var(--color-warning)' }} />
                        </p>
                    )}

                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        Delivery charge is paid in advance via bKash / Nagad. Product price is Cash on Delivery.
                    </p>

                    {onCheckout && cartItems.length > 0 && (
                        <button
                            onClick={onCheckout}
                            className="btn-accent w-full py-3 text-sm font-semibold mt-1 hidden lg:flex"
                        >
                            Place Order
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PriceSidebar;
