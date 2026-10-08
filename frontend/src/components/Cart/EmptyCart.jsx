import { Link } from 'react-router-dom';

const EmptyCart = () => {
    return (
        <div className="surface flex flex-col items-center justify-center gap-3 p-8 sm:p-14 text-center">
            <img draggable="false" className="w-40 sm:w-52 object-contain" src="https://rukminim1.flixcart.com/www/800/800/promos/16/05/2019/d438a32e-765a-4d8b-b4a6-520b560971e8.png" alt="Empty Cart" />
            <h3 className="font-display font-bold text-lg text-slate-900">Your cart is empty!</h3>
            <p className="text-sm text-slate-500">Add items to it now.</p>
            <Link to="/products" className="btn-accent text-sm mt-3">Shop Now</Link>
        </div>
    );
};

export default EmptyCart;
