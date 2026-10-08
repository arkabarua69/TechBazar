
const PriceSidebar = ({ cartItems }) => {
    return (
        <div className="flex sticky top-16 sm:h-screen flex-col sm:w-4/12 sm:px-1">

            {/* <!-- nav tiles --> */}
            <div className="surface flex flex-col">
                <h1 className="border-b border-line px-4 sm:px-5 py-4 font-display font-bold text-base sm:text-lg text-slate-900">PRICE DETAILS</h1>

                <div className="flex flex-col gap-4 p-6 pb-4">
                    <p className="flex justify-between text-sm text-slate-600">Price ({cartItems.length} item) <span>৳{cartItems.reduce((sum, item) => sum + (item.cuttedPrice * item.quantity), 0).toLocaleString()}</span></p>
                    <p className="flex justify-between text-sm text-slate-600">Discount <span className="text-primary-green">- ৳{cartItems.reduce((sum, item) => sum + ((item.cuttedPrice * item.quantity) - (item.price * item.quantity)), 0).toLocaleString()}</span></p>
                    <p className="flex justify-between text-sm text-slate-600">Delivery Charge <span className="text-slate-500">৳70 · ৳130 <span className="text-xs">(advance)</span></span></p>

                    <p className="flex justify-between border-t border-line pt-2 mt-1 font-bold text-slate-900 text-base">Total (on delivery) <span>৳{cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString()}</span></p>
                    <div className="border-t border-line"></div>

                    <p className="text-xs text-slate-500">Delivery charge is paid in advance (bKash / Nagad). Product price is Cash on Delivery.</p>

                </div>

            </div>
            {/* <!-- nav tiles --> */}

        </div>
    );
};

export default PriceSidebar;
