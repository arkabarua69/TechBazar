import StarIcon from '@mui/icons-material/Star';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { Link } from 'react-router-dom';
import { getDiscount } from '../../utils/functions';
import { useDispatch, useSelector } from 'react-redux';
import { addToWishlist, removeFromWishlist } from '../../actions/wishlistAction';
import { useSnackbar } from 'notistack';

const Product = ({ _id, name, images, ratings, numOfReviews, price, cuttedPrice }) => {

    const dispatch = useDispatch();
    const { enqueueSnackbar } = useSnackbar();

    const { wishlistItems } = useSelector((state) => state.wishlist);

    const itemInWishlist = wishlistItems.some((i) => i.product === _id);

    const addToWishlistHandler = () => {
        if (itemInWishlist) {
            dispatch(removeFromWishlist(_id));
            enqueueSnackbar("Remove From Wishlist", { variant: "success" });
        } else {
            dispatch(addToWishlist(_id));
            enqueueSnackbar("Added To Wishlist", { variant: "success" });
        }
    }

    return (
        <div className="group surface overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition duration-200 flex flex-col relative">
            {/* <!-- image & product title --> */}
            <Link to={`/product/${_id}`} className="flex flex-col items-center text-center group border-b border-line">
                <div className="w-full h-40 sm:h-48 bg-white overflow-hidden flex items-center justify-center">
                    <img draggable="false" className="w-full h-full object-contain p-2 transition duration-300 group-hover:scale-105" src={images && images[0].url} alt="" />
                </div>
                <h2 className="w-full font-display font-semibold text-sm text-slate-900 line-clamp-2 text-left mt-3 px-3 sm:px-4 group-hover:text-primary-accent transition duration-200">{name.length > 85 ? `${name.substring(0, 85)}...` : name}</h2>
            </Link>
            {/* <!-- image & product title --> */}

            {/* <!-- product description --> */}
            <div className="flex flex-col gap-2 items-start p-3 sm:p-4 flex-1">
                {/* <!-- rating badge --> */}
                <span className="text-sm text-slate-500 font-medium flex gap-2 items-center">
                    <span className="text-xs px-1.5 py-0.5 bg-primary-green rounded text-white flex items-center gap-0.5">{ratings.toFixed(1)} <StarIcon sx={{ fontSize: "14px" }} /></span>
                    <span className="text-xs text-slate-400">({numOfReviews})</span>
                </span>
                {/* <!-- rating badge --> */}

                {/* <!-- price container --> */}
                <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-slate-900 font-bold">Tk {price.toLocaleString()}</span>
                    <span className="text-xs text-slate-400 line-through">Tk {cuttedPrice.toLocaleString()}</span>
                    <span className="text-primary-green font-semibold text-sm">{getDiscount(price, cuttedPrice)}%&nbsp;off</span>
                </div>
                {/* <!-- price container --> */}
            </div>
            {/* <!-- product description --> */}

            {/* <!-- wishlist badge --> */}
            <span onClick={addToWishlistHandler} className={`${itemInWishlist ? "text-red-500" : "hover:text-red-500 text-slate-300"} absolute top-3 right-3 cursor-pointer`}><FavoriteIcon sx={{ fontSize: "18px" }} /></span>
            {/* <!-- wishlist badge --> */}

        </div>
    );
};

export default Product;
