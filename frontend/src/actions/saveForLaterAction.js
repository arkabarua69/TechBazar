import { REMOVE_FROM_SAVE_FOR_LATER, SAVE_FOR_LATER } from "../constants/saveForLaterConstants";

export const saveForLater = (id) => (dispatch, getState) => {
    const product = getState().cart.cartItems.find((i) => i.product === id);
    if (!product) return;
    dispatch({ type: SAVE_FOR_LATER, payload: product });
    localStorage.setItem('saveForLaterItems', JSON.stringify(getState().saveForLater.saveForLaterItems));
};

export const removeFromSaveForLater = (id) => (dispatch, getState) => {
    dispatch({ type: REMOVE_FROM_SAVE_FOR_LATER, payload: id });
    localStorage.setItem('saveForLaterItems', JSON.stringify(getState().saveForLater.saveForLaterItems));
};
