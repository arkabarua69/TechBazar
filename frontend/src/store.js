import { createStore, combineReducers, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { composeWithDevTools } from 'redux-devtools-extension';
import { forgotPasswordReducer, profileReducer, userReducer, allUsersReducer, userDetailsReducer } from './reducers/userReducer';
import { newProductReducer, newReviewReducer, productDetailsReducer, productReducer, productsReducer, productReviewsReducer, reviewReducer } from './reducers/productReducer';
import { cartReducer } from './reducers/cartReducer';
import { saveForLaterReducer } from './reducers/saveForLaterReducer';
import { allOrdersReducer, myOrdersReducer, orderDetailsReducer, orderReducer } from './reducers/orderReducer';
import { addressesReducer, addressSaveReducer, addressDeleteReducer } from './reducers/addressReducer';
import { wishlistReducer } from './reducers/wishlistReducer';

const reducer = combineReducers({
    user: userReducer,
    profile: profileReducer,
    forgotPassword: forgotPasswordReducer,
    products: productsReducer,
    productDetails: productDetailsReducer,
    newReview: newReviewReducer,
    cart: cartReducer,
    saveForLater: saveForLaterReducer,
    myOrders: myOrdersReducer,
    orderDetails: orderDetailsReducer,
    allOrders: allOrdersReducer,
    order: orderReducer,
    newProduct: newProductReducer,
    product: productReducer,
    users: allUsersReducer,
    userDetails: userDetailsReducer,
    reviews: productReviewsReducer,
    review: reviewReducer,
    wishlist: wishlistReducer,
    addresses: addressesReducer,
    addressSave: addressSaveReducer,
    addressDelete: addressDeleteReducer,
});

let initialState = {
    cart: {
        cartItems: localStorage.getItem('cartItems')
            ? JSON.parse(localStorage.getItem('cartItems'))
            : [],
    },
    saveForLater: {
        saveForLaterItems: localStorage.getItem('saveForLaterItems')
            ? JSON.parse(localStorage.getItem('saveForLaterItems'))
            : [],
    },
    wishlist: {
        wishlistItems: localStorage.getItem('wishlistItems')
            ? JSON.parse(localStorage.getItem('wishlistItems'))
            : [],
    },
};

const middleware = [thunk];

const store = createStore(
    reducer,
    initialState,
    composeWithDevTools(applyMiddleware(...middleware))
);

export default store;