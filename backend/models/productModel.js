const mongoose = require('mongoose');

// All storefront/product form fields are optional — a product can be
// created blank and filled in later (admin → Update Product).
// Only `user` (set server-side from the authenticated admin) and the
// reviews sub-document remain required.
const productSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true
    },
    description: {
        type: String
    },
    highlights: [
        {
            type: String
        }
    ],
    specifications: [
        {
            title: {
                type: String
            },
            description: {
                type: String
            }
        }
    ],
    price: {
        type: Number,
        default: 0
    },
    cuttedPrice: {
        type: Number,
        default: 0
    },
    images: [
        {
            public_id: {
                type: String
            },
            url: {
                type: String
            }
        }
    ],
    brand: {
        name: {
            type: String
        },
        logo: {
            public_id: {
                type: String,
            },
            url: {
                type: String,
            }
        }
    },
    category: {
        type: String
    },
    stock: {
        type: Number,
        maxlength: [4, "Stock cannot exceed limit"],
        default: 1
    },
    warranty: {
        type: Number,
        default: 1
    },
    // optional storefront fields (admin-editable, shown on product page)
    colors: [String],
    inTheBox: [String],
    ratings: {
        type: Number,
        default: 0
    },
    numOfReviews: {
        type: Number,
        default: 0
    },
    reviews: [
        {
            user: {
                type: mongoose.Schema.ObjectId,
                ref: "User",
                required: true
            },
            name: {
                type: String,
                required: true
            },
            rating: {
                type: Number,
                required: true
            },
            comment: {
                type: String,
                required: true
            }
        }
    ],

    user: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true
    },
    // ── Business Koro storefront fields (never sent to the client) ──
    bkId: {
        type: String,
        index: true,
    },
    bkVariants: {
        type: Array,
        select: false,
    },
    bkCostPrice: {
        type: Number,
        select: false,
    },
    source: {
        type: String,
        default: "local",
    },
    // admin-selected: shown first in the homepage "Featured" section
    featured: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Product', productSchema);
