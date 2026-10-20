const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    // Human order reference built from the buyer's mobile number so the order
    // can be matched against the number it was placed with:
    // e.g. "8801580831611-4F2A". (Account orders only.)
    orderId: {
        type: String,
        index: true,
    },
    shippingInfo: {
        address: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        state: {
            type: String,
            required: true
        },
        country: {
            type: String,
            required: true
        },
        pincode: {
            type: Number,
            required: true
        },
        phoneNo: {
            type: Number,
            required: true
        },
    },
    orderItems: [
        {
            name: {
                type: String,
                required: true
            },
            price: {
                type: Number,
                required: true
            },
            quantity: {
                type: Number,
                required: true
            },
            image: {
                type: String,
                required: true
            },
            product: {
                type: mongoose.Schema.ObjectId,
                ref: "Product",
                required: true
            },
        },
    ],
    user: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true
    },
    paymentInfo: {
        id: {
            type: String,
            required: true
        },
        status: {
            type: String,
            required: true
        },
    },
    // How the customer paid: COD / bKash / Nagad.
    // ("Paytm" is kept in the enum only so legacy documents still load.)
    paymentMethod: {
        type: String,
        enum: ["COD", "bKash", "Nagad", "Paytm"],
    },
    // Only set once the money has actually been received (bKash / Nagad
    // advance). Cash-on-delivery orders are unpaid on placement, so this
    // stays empty.
    paidAt: {
        type: Date,
    },
    totalPrice: {
        type: Number,
        required: true,
        default: 0
    },
    orderStatus: {
        type: String,
        required: true,
        default: "Processing",
    },
    deliveredAt: Date,
    shippedAt: Date,
    createdAt: {
        type: Date,
        default: Date.now
    },
});

module.exports = mongoose.model("Order", orderSchema);