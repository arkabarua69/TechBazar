const mongoose = require('mongoose');

// Guest checkout order held in our own database.
// Starts as PENDING_APPROVAL; an admin approves or cancels it.
const storeOrderSchema = new mongoose.Schema({
    groupId: {
        type: String,
        required: true,
        index: true,
    },
    // Human order reference. Built from the customer's mobile number so it can
    // be matched against the phone they ordered with: e.g. "8801580831611-4F2A".
    orderId: {
        type: String,
        index: true,
    },
    // Set when a logged-in user places the order (guest checkout leaves it null).
    // Lets the account's "My Orders" page show guest-style store orders too.
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        default: null,
        index: true,
    },
    product: {
        productId: { type: mongoose.Schema.ObjectId, ref: 'Product', required: true },
        name: { type: String, required: true },
        image: { type: String },
    },
    customer: {
        name: { type: String, required: true },
        phone: { type: String, required: true },
        address: { type: String, required: true },
        division: { type: String, required: true },
        district: { type: String, required: true },
        area: { type: String },
    },
    payment: {
        method: { type: String, enum: ['COD', 'bKash', 'Nagad'], required: true },
        // Only prepaid (bKash / Nagad advance) orders carry a TrxID.
        transactionId: { type: String },
        verified: { type: Boolean, default: false },
        verifiedAt: Date,
    },
    delivery: {
        zone: { type: String, enum: ['inside-dhaka', 'outside-dhaka'], required: true },
        charge: { type: Number, required: true },
        paidByCustomer: { type: Boolean, default: true },
    },
    pricing: {
        quantity: { type: Number, required: true, min: 1 },
        sellingPrice: { type: Number, required: true },   // per unit, as sold
        total: { type: Number, required: true },          // sellingPrice * quantity + delivery charge
    },
    status: {
        type: String,
        enum: ['PENDING_APPROVAL', 'APPROVED', 'CANCELLED'],
        default: 'PENDING_APPROVAL',
        index: true,
    },
    // customer-facing fulfilment status (tracked by the guest + admin updates)
    fulfilment: {
        type: String,
        enum: ['PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
        default: 'PLACED',
    },
    approvedBy: { type: mongoose.Schema.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('StoreOrder', storeOrderSchema);
