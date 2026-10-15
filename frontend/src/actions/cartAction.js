import axios from "axios";
import { ADD_TO_CART, EMPTY_CART, REMOVE_FROM_CART, SAVE_SHIPPING_INFO } from "../constants/cartConstants";
import { getErrorMessage } from "../utils/errorUtils";

export const addItemsToCart = (id, quantity = 1) => async (dispatch, getState) => {
    try {
        const { data } = await axios.get(`/api/v1/product/${id}`);
        const p = data.product;
        dispatch({
            type: ADD_TO_CART,
            payload: {
                product: p._id,
                name: p.name,
                seller: p.brand?.name || '',
                price: p.price,
                cuttedPrice: p.cuttedPrice,
                image: p.images?.[0]?.url || '',
                stock: p.stock,
                quantity,
            },
        });
        localStorage.setItem('cartItems', JSON.stringify(getState().cart.cartItems));
    } catch (error) {
        console.error('Add to cart failed:', getErrorMessage(error));
    }
};

export const removeItemsFromCart = (id) => (dispatch, getState) => {
    dispatch({ type: REMOVE_FROM_CART, payload: id });
    localStorage.setItem('cartItems', JSON.stringify(getState().cart.cartItems));
};

export const emptyCart = () => (dispatch, getState) => {
    dispatch({ type: EMPTY_CART });
    localStorage.setItem('cartItems', JSON.stringify(getState().cart.cartItems));
};

export const saveShippingInfo = (data) => (dispatch) => {
    dispatch({ type: SAVE_SHIPPING_INFO, payload: data });
    localStorage.setItem('shippingInfo', JSON.stringify(data));
};
