const mongoose = require('mongoose');

// Guest checkout order held in our own database (backup record).
// It is forwarded to Business Koro only after an admin approves it.
const storeOrderSchema = new mongoose.Schema({
    groupId: {
        type: String,
        required: true,
        index: true,
    },
    product: {
        productId: { type: mongoose.Schema.ObjectId, ref: 'Product', required: true },
        bkId: { type: String },
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
        method: { type: String, enum: ['bKash', 'Nagad'], required: true },
        transactionId: { type: String, required: true },
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
        enum: ['PENDING_APPROVAL', 'FORWARDED', 'FORWARD_FAILED', 'CANCELLED'],
        default: 'PENDING_APPROVAL',
        index: true,
    },
    // customer-facing fulfilment status (tracked by the guest + admin updates)
    fulfilment: {
        type: String,
        enum: ['PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED'],
        default: 'PLACED',
    },
    bkOrderId: String,
    bkStatus: String,
    bkError: String,
    forwardedAt: Date,
    approvedBy: { type: mongoose.Schema.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('StoreOrder', storeOrderSchema);
