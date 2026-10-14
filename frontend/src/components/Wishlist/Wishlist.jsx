import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import MetaData from '../Layouts/MetaData';
import Sidebar from '../User/Sidebar';
import Product from './Product';

const Wishlist = () => {

    const { wishlistItems } = useSelector((state) => state.wishlist);

    return (
        <>
            <MetaData title="Wishlist" />
            <main className="w-full sm:w-11/12 mx-auto flex flex-col gap-4 px-3 sm:px-4 pb-10 mt-3 sm:mt-6">

                <div className="flex gap-3.5">

                    <Sidebar activeTab={"wishlist"} />

                    <div className="surface flex-1 p-3 sm:p-4">
                        {/* <!-- wishlist container --> */}
                        <div className="flex flex-col gap-3">
                            <span className="font-display font-bold text-base sm:text-lg text-slate-900 px-1">My Wishlist ({wishlistItems.length})</span>

                            {wishlistItems.length === 0 && (
                                <div className="surface flex flex-col items-center justify-center gap-3 p-8 sm:p-14 text-center">
                                    <img draggable="false" className="w-40 sm:w-52 object-contain" src="https://static-assets-web.flixcart.com/www/linchpin/fk-cp-zion/img/mywishlist-empty_39f7a5.png" alt="Empty Wishlist" />
                                    <h3 className="font-display font-bold text-lg text-slate-900">Empty Wishlist</h3>
                                    <p className="text-sm text-slate-500">You have no items in your wishlist. Start adding!</p>
                                    <Link to="/products" className="btn-accent text-sm">Shop Now</Link>
                                </div>
                            )}

                            {wishlistItems.map((item, index) => (
                                <Product {...item} key={index}/>
                            )
                            ).reverse()}

                        </div>
                        {/* <!-- wishlist container --> */}

                    </div>

                </div>
            </main>
        </>
    );
};

export default Wishlist;
