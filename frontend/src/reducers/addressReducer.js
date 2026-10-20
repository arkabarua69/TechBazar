import {
    ADDRESSES_REQUEST,
    ADDRESSES_SUCCESS,
    ADDRESSES_FAIL,
    ADDRESS_SAVE_REQUEST,
    ADDRESS_SAVE_SUCCESS,
    ADDRESS_SAVE_RESET,
    ADDRESS_SAVE_FAIL,
    ADDRESS_DELETE_REQUEST,
    ADDRESS_DELETE_SUCCESS,
    ADDRESS_DELETE_RESET,
    ADDRESS_DELETE_FAIL,
    CLEAR_ERRORS,
} from '../constants/userConstants';

// Saved delivery addresses for the logged-in user (Account → Manage Addresses).
export const addressesReducer = (state = { addresses: [] }, action) => {
    switch (action.type) {
        case ADDRESSES_REQUEST:
            return { ...state, loading: true };
        case ADDRESSES_SUCCESS:
            return { ...state, loading: false, addresses: action.payload };
        case ADDRESSES_FAIL:
            return { ...state, loading: false, error: action.payload };
        case CLEAR_ERRORS:
            return { ...state, error: null };
        default:
            return state;
    }
};

// Add / update an address.
export const addressSaveReducer = (state = {}, action) => {
    switch (action.type) {
        case ADDRESS_SAVE_REQUEST:
            return { ...state, loading: true };
        case ADDRESS_SAVE_SUCCESS:
            return { ...state, loading: false, success: true, addresses: action.payload };
        case ADDRESS_SAVE_RESET:
            return { ...state, success: false };
        case ADDRESS_SAVE_FAIL:
            return { ...state, loading: false, error: action.payload };
        case CLEAR_ERRORS:
            return { ...state, error: null };
        default:
            return state;
    }
};

// Delete an address.
export const addressDeleteReducer = (state = {}, action) => {
    switch (action.type) {
        case ADDRESS_DELETE_REQUEST:
            return { ...state, loading: true };
        case ADDRESS_DELETE_SUCCESS:
            return { ...state, loading: false, success: true, addresses: action.payload };
        case ADDRESS_DELETE_RESET:
            return { ...state, success: false };
        case ADDRESS_DELETE_FAIL:
            return { ...state, loading: false, error: action.payload };
        case CLEAR_ERRORS:
            return { ...state, error: null };
        default:
            return state;
    }
};
