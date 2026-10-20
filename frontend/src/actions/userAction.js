import {
    LOGIN_USER_REQUEST, LOGIN_USER_SUCCESS, LOGIN_USER_FAIL,
    REGISTER_USER_REQUEST, REGISTER_USER_SUCCESS, REGISTER_USER_FAIL,
    LOAD_USER_REQUEST, LOAD_USER_SUCCESS, LOAD_USER_FAIL,
    LOGOUT_USER_SUCCESS, LOGOUT_USER_FAIL,
    CLEAR_ERRORS,
    UPDATE_PROFILE_REQUEST, UPDATE_PROFILE_SUCCESS, UPDATE_PROFILE_FAIL,
    UPDATE_PASSWORD_REQUEST, UPDATE_PASSWORD_SUCCESS, UPDATE_PASSWORD_FAIL,
    FORGOT_PASSWORD_REQUEST, FORGOT_PASSWORD_SUCCESS, FORGOT_PASSWORD_FAIL,
    RESET_PASSWORD_SUCCESS, RESET_PASSWORD_FAIL, RESET_PASSWORD_REQUEST,
    UPDATE_USER_REQUEST, UPDATE_USER_SUCCESS, UPDATE_USER_FAIL,
    DELETE_USER_REQUEST, DELETE_USER_SUCCESS, DELETE_USER_FAIL,
    USER_DETAILS_REQUEST, USER_DETAILS_SUCCESS, USER_DETAILS_FAIL,
    ALL_USERS_FAIL, ALL_USERS_SUCCESS, ALL_USERS_REQUEST,
    ADDRESSES_REQUEST, ADDRESSES_SUCCESS, ADDRESSES_FAIL,
    ADDRESS_SAVE_REQUEST, ADDRESS_SAVE_SUCCESS, ADDRESS_SAVE_FAIL,
    ADDRESS_DELETE_REQUEST, ADDRESS_DELETE_SUCCESS, ADDRESS_DELETE_FAIL,
} from '../constants/userConstants';
import axios from 'axios';
import { getErrorMessage } from '../utils/errorUtils';

const jsonConfig = { headers: { "Content-Type": "application/json" } };

export const loginUser = (email, password) => async (dispatch) => {
    try {
        dispatch({ type: LOGIN_USER_REQUEST });
        const { data } = await axios.post('/api/v1/login', { email, password }, jsonConfig);
        dispatch({ type: LOGIN_USER_SUCCESS, payload: data.user });
    } catch (error) {
        dispatch({ type: LOGIN_USER_FAIL, payload: getErrorMessage(error) });
    }
};

export const registerUser = (userData) => async (dispatch) => {
    try {
        dispatch({ type: REGISTER_USER_REQUEST });
        const { data } = await axios.post('/api/v1/register', userData, jsonConfig);
        dispatch({ type: REGISTER_USER_SUCCESS, payload: data.user });
    } catch (error) {
        dispatch({ type: REGISTER_USER_FAIL, payload: getErrorMessage(error) });
    }
};

export const loadUser = () => async (dispatch) => {
    try {
        dispatch({ type: LOAD_USER_REQUEST });
        const { data } = await axios.get('/api/v1/me');
        dispatch({ type: LOAD_USER_SUCCESS, payload: data.user });
    } catch (error) {
        dispatch({ type: LOAD_USER_FAIL, payload: getErrorMessage(error) });
    }
};

export const logoutUser = () => async (dispatch) => {
    try {
        await axios.get('/api/v1/logout');
        dispatch({ type: LOGOUT_USER_SUCCESS });
    } catch (error) {
        dispatch({ type: LOGOUT_USER_FAIL, payload: getErrorMessage(error) });
    }
};

export const updateProfile = (userData) => async (dispatch) => {
    try {
        dispatch({ type: UPDATE_PROFILE_REQUEST });
        const { data } = await axios.put('/api/v1/me/update', userData, jsonConfig);
        dispatch({ type: UPDATE_PROFILE_SUCCESS, payload: data.success });
    } catch (error) {
        dispatch({ type: UPDATE_PROFILE_FAIL, payload: getErrorMessage(error) });
    }
};

export const updatePassword = (passwords) => async (dispatch) => {
    try {
        dispatch({ type: UPDATE_PASSWORD_REQUEST });
        const { data } = await axios.put('/api/v1/password/update', passwords, jsonConfig);
        dispatch({ type: UPDATE_PASSWORD_SUCCESS, payload: data.success });
    } catch (error) {
        dispatch({ type: UPDATE_PASSWORD_FAIL, payload: getErrorMessage(error) });
    }
};

export const forgotPassword = (email) => async (dispatch) => {
    try {
        dispatch({ type: FORGOT_PASSWORD_REQUEST });
        const { data } = await axios.post('/api/v1/password/forgot', email, jsonConfig);
        dispatch({ type: FORGOT_PASSWORD_SUCCESS, payload: data.message });
    } catch (error) {
        dispatch({ type: FORGOT_PASSWORD_FAIL, payload: getErrorMessage(error) });
    }
};

export const resetPassword = (token, passwords) => async (dispatch) => {
    try {
        dispatch({ type: RESET_PASSWORD_REQUEST });
        const { data } = await axios.put(`/api/v1/password/reset/${token}`, passwords, jsonConfig);
        dispatch({ type: RESET_PASSWORD_SUCCESS, payload: data.success });
    } catch (error) {
        dispatch({ type: RESET_PASSWORD_FAIL, payload: getErrorMessage(error) });
    }
};

export const getAllUsers = () => async (dispatch) => {
    try {
        dispatch({ type: ALL_USERS_REQUEST });
        const { data } = await axios.get('/api/v1/admin/users');
        dispatch({ type: ALL_USERS_SUCCESS, payload: data.users });
    } catch (error) {
        dispatch({ type: ALL_USERS_FAIL, payload: getErrorMessage(error) });
    }
};

export const getUserDetails = (id) => async (dispatch) => {
    try {
        dispatch({ type: USER_DETAILS_REQUEST });
        const { data } = await axios.get(`/api/v1/admin/user/${id}`);
        dispatch({ type: USER_DETAILS_SUCCESS, payload: data.user });
    } catch (error) {
        dispatch({ type: USER_DETAILS_FAIL, payload: getErrorMessage(error) });
    }
};

export const updateUser = (id, userData) => async (dispatch) => {
    try {
        dispatch({ type: UPDATE_USER_REQUEST });
        const { data } = await axios.put(`/api/v1/admin/user/${id}`, userData, jsonConfig);
        dispatch({ type: UPDATE_USER_SUCCESS, payload: data.success });
    } catch (error) {
        dispatch({ type: UPDATE_USER_FAIL, payload: getErrorMessage(error) });
    }
};

export const deleteUser = (id) => async (dispatch) => {
    try {
        dispatch({ type: DELETE_USER_REQUEST });
        const { data } = await axios.delete(`/api/v1/admin/user/${id}`);
        dispatch({ type: DELETE_USER_SUCCESS, payload: data.success });
    } catch (error) {
        dispatch({ type: DELETE_USER_FAIL, payload: getErrorMessage(error) });
    }
};

// ── Manage Addresses (saved delivery addresses) ─────────────────────────────

export const myAddresses = () => async (dispatch) => {
    try {
        dispatch({ type: ADDRESSES_REQUEST });
        const { data } = await axios.get('/api/v1/addresses');
        dispatch({ type: ADDRESSES_SUCCESS, payload: data.addresses });
    } catch (error) {
        dispatch({ type: ADDRESSES_FAIL, payload: getErrorMessage(error) });
    }
};

export const saveAddress = (addressData, id) => async (dispatch) => {
    try {
        dispatch({ type: ADDRESS_SAVE_REQUEST });
        const { data } = id
            ? await axios.put(`/api/v1/addresses/${id}`, addressData, jsonConfig)
            : await axios.post('/api/v1/addresses', addressData, jsonConfig);
        dispatch({ type: ADDRESS_SAVE_SUCCESS, payload: data.addresses });
    } catch (error) {
        dispatch({ type: ADDRESS_SAVE_FAIL, payload: getErrorMessage(error) });
    }
};

export const deleteAddress = (id) => async (dispatch) => {
    try {
        dispatch({ type: ADDRESS_DELETE_REQUEST });
        const { data } = await axios.delete(`/api/v1/addresses/${id}`);
        dispatch({ type: ADDRESS_DELETE_SUCCESS, payload: data.addresses });
    } catch (error) {
        dispatch({ type: ADDRESS_DELETE_FAIL, payload: getErrorMessage(error) });
    }
};

export const setDefaultAddress = (id) => async (dispatch) => {
    try {
        dispatch({ type: ADDRESS_SAVE_REQUEST });
        const { data } = await axios.put(`/api/v1/addresses/${id}/default`, {}, jsonConfig);
        dispatch({ type: ADDRESS_SAVE_SUCCESS, payload: data.addresses });
    } catch (error) {
        dispatch({ type: ADDRESS_SAVE_FAIL, payload: getErrorMessage(error) });
    }
};

export const clearErrors = () => (dispatch) => {
    dispatch({ type: CLEAR_ERRORS });
};
