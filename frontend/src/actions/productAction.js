import axios from "axios";
import {
    ALL_PRODUCTS_FAIL, ALL_PRODUCTS_REQUEST, ALL_PRODUCTS_SUCCESS,
    PRODUCT_DETAILS_REQUEST, PRODUCT_DETAILS_SUCCESS, PRODUCT_DETAILS_FAIL,
    ADMIN_PRODUCTS_REQUEST, ADMIN_PRODUCTS_SUCCESS, ADMIN_PRODUCTS_FAIL,
    CLEAR_ERRORS,
    NEW_REVIEW_REQUEST, NEW_REVIEW_SUCCESS, NEW_REVIEW_FAIL,
    NEW_PRODUCT_REQUEST, NEW_PRODUCT_SUCCESS, NEW_PRODUCT_FAIL,
    UPDATE_PRODUCT_REQUEST, UPDATE_PRODUCT_SUCCESS, UPDATE_PRODUCT_FAIL,
    DELETE_PRODUCT_REQUEST, DELETE_PRODUCT_SUCCESS, DELETE_PRODUCT_FAIL,
    ALL_REVIEWS_REQUEST, ALL_REVIEWS_SUCCESS, ALL_REVIEWS_FAIL,
    DELETE_REVIEW_REQUEST, DELETE_REVIEW_SUCCESS, DELETE_REVIEW_FAIL,
    SLIDER_PRODUCTS_REQUEST, SLIDER_PRODUCTS_SUCCESS, SLIDER_PRODUCTS_FAIL,
} from "../constants/productConstants";
import { getErrorMessage } from "../utils/errorUtils";

const jsonConfig = { headers: { "Content-Type": "application/json" } };

export const getProducts =
    (keyword = "", category, price = [0, 200000], ratings = 0, currentPage = 1, availability = "") =>
    async (dispatch) => {
        try {
            dispatch({ type: ALL_PRODUCTS_REQUEST });
            let url = `/api/v1/products?keyword=${keyword}&price[gte]=${price[0]}&price[lte]=${price[1]}&ratings[gte]=${ratings}&page=${currentPage}`;
            if (category) {
                url += `&category=${encodeURIComponent(category)}`;
            }
            // Server-side availability filter so it spans every page, not just
            // the current one:  "in"  → stock >= 1,  "out" → stock <= 0.
            if (availability === "in") {
                url += `&stock[gte]=1`;
            } else if (availability === "out") {
                url += `&stock[lte]=0`;
            }
            const { data } = await axios.get(url);
            dispatch({ type: ALL_PRODUCTS_SUCCESS, payload: data });
        } catch (error) {
            dispatch({ type: ALL_PRODUCTS_FAIL, payload: getErrorMessage(error) });
        }
    };

export const getSimilarProducts = (category) => async (dispatch) => {
    // productDetails starts out empty, so the first render has no category —
    // without this guard we'd request `/products?category=undefined` (404-ish
    // empty result) on every product page load.
    if (!category) return;
    try {
        dispatch({ type: ALL_PRODUCTS_REQUEST });
        const { data } = await axios.get(`/api/v1/products?category=${encodeURIComponent(category)}`);
        dispatch({ type: ALL_PRODUCTS_SUCCESS, payload: data });
    } catch (error) {
        dispatch({ type: ALL_PRODUCTS_FAIL, payload: getErrorMessage(error) });
    }
};

export const getProductDetails = (id) => async (dispatch) => {
    try {
        dispatch({ type: PRODUCT_DETAILS_REQUEST });
        const { data } = await axios.get(`/api/v1/product/${id}`);
        dispatch({ type: PRODUCT_DETAILS_SUCCESS, payload: data.product });
    } catch (error) {
        dispatch({ type: PRODUCT_DETAILS_FAIL, payload: getErrorMessage(error) });
    }
};

export const newReview = (reviewData) => async (dispatch) => {
    try {
        dispatch({ type: NEW_REVIEW_REQUEST });
        const { data } = await axios.put("/api/v1/review", reviewData, jsonConfig);
        dispatch({ type: NEW_REVIEW_SUCCESS, payload: data.success });
    } catch (error) {
        dispatch({ type: NEW_REVIEW_FAIL, payload: getErrorMessage(error) });
    }
};

export const getSliderProducts = () => async (dispatch) => {
    try {
        dispatch({ type: SLIDER_PRODUCTS_REQUEST });
        const { data } = await axios.get('/api/v1/products/all');
        dispatch({ type: SLIDER_PRODUCTS_SUCCESS, payload: data.products });
    } catch (error) {
        dispatch({ type: SLIDER_PRODUCTS_FAIL, payload: getErrorMessage(error) });
    }
};

export const getAdminProducts = () => async (dispatch) => {
    try {
        dispatch({ type: ADMIN_PRODUCTS_REQUEST });
        const { data } = await axios.get('/api/v1/admin/products');
        dispatch({ type: ADMIN_PRODUCTS_SUCCESS, payload: data.products });
    } catch (error) {
        dispatch({ type: ADMIN_PRODUCTS_FAIL, payload: getErrorMessage(error) });
    }
};

export const createProduct = (productData) => async (dispatch) => {
    try {
        dispatch({ type: NEW_PRODUCT_REQUEST });
        const { data } = await axios.post("/api/v1/admin/product/new", productData, jsonConfig);
        dispatch({ type: NEW_PRODUCT_SUCCESS, payload: data });
    } catch (error) {
        dispatch({ type: NEW_PRODUCT_FAIL, payload: getErrorMessage(error) });
    }
};

export const updateProduct = (id, productData) => async (dispatch) => {
    try {
        dispatch({ type: UPDATE_PRODUCT_REQUEST });
        const { data } = await axios.put(`/api/v1/admin/product/${id}`, productData, jsonConfig);
        dispatch({ type: UPDATE_PRODUCT_SUCCESS, payload: data.success });
    } catch (error) {
        dispatch({ type: UPDATE_PRODUCT_FAIL, payload: getErrorMessage(error) });
    }
};

export const deleteProduct = (id) => async (dispatch) => {
    try {
        dispatch({ type: DELETE_PRODUCT_REQUEST });
        const { data } = await axios.delete(`/api/v1/admin/product/${id}`);
        dispatch({ type: DELETE_PRODUCT_SUCCESS, payload: data.success });
    } catch (error) {
        dispatch({ type: DELETE_PRODUCT_FAIL, payload: getErrorMessage(error) });
    }
};

export const getAllReviews = (id) => async (dispatch) => {
    try {
        dispatch({ type: ALL_REVIEWS_REQUEST });
        const { data } = await axios.get(`/api/v1/admin/reviews?id=${id}`);
        dispatch({ type: ALL_REVIEWS_SUCCESS, payload: data.reviews });
    } catch (error) {
        dispatch({ type: ALL_REVIEWS_FAIL, payload: getErrorMessage(error) });
    }
};

export const deleteReview = (reviewId, productId) => async (dispatch) => {
    try {
        dispatch({ type: DELETE_REVIEW_REQUEST });
        const { data } = await axios.delete(`/api/v1/admin/reviews?id=${reviewId}&productId=${productId}`);
        dispatch({ type: DELETE_REVIEW_SUCCESS, payload: data.success });
    } catch (error) {
        dispatch({ type: DELETE_REVIEW_FAIL, payload: getErrorMessage(error) });
    }
};

export const clearErrors = () => (dispatch) => {
    dispatch({ type: CLEAR_ERRORS });
};
