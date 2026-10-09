import { Link } from 'react-router-dom';
import { HiOutlineShoppingBag } from 'react-icons/hi';

const EmptyCart = () => {
    return (
        <div className="surface flex flex-col items-center justify-center gap-3 p-8 sm:p-14 text-center">
            <HiOutlineShoppingBag className="text-5xl text-slate-400" />
            <h3 className="font-display font-bold text-lg text-slate-900">Your cart is empty!</h3>
            <p className="text-sm text-slate-500">Add items to it now.</p>
            <Link to="/products" className="btn-accent text-sm mt-3">Shop Now</Link>
        </div>
    );
};

export default EmptyCart;
