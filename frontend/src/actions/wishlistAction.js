import axios from "axios";
import { ADD_TO_WISHLIST, REMOVE_FROM_WISHLIST } from "../constants/wishlistConstants";
import { getErrorMessage } from "../utils/errorUtils";

export const addToWishlist = (id) => async (dispatch, getState) => {
    try {
        const { data } = await axios.get(`/api/v1/product/${id}`);
        const p = data.product;
        dispatch({
            type: ADD_TO_WISHLIST,
            payload: {
                product: p._id,
                name: p.name,
                price: p.price,
                cuttedPrice: p.cuttedPrice,
                image: p.images?.[0]?.url || '',
                ratings: p.ratings,
                reviews: p.numOfReviews,
            },
        });
        localStorage.setItem('wishlistItems', JSON.stringify(getState().wishlist.wishlistItems));
    } catch (error) {
        console.error('Add to wishlist failed:', getErrorMessage(error));
    }
};

export const removeFromWishlist = (id) => (dispatch, getState) => {
    dispatch({ type: REMOVE_FROM_WISHLIST, payload: id });
    localStorage.setItem('wishlistItems', JSON.stringify(getState().wishlist.wishlistItems));
};
