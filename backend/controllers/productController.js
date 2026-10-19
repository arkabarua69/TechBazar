const Product = require('../models/productModel');
const asyncErrorHandler = require('../middlewares/asyncErrorHandler');
const SearchFeatures = require('../utils/searchFeatures');
const ErrorHandler = require('../utils/errorHandler');
const { uploadToImgBBCompat } = require('../utils/imgbb');
const { notifyProductEvent, notifyReviewEvent, logEvent } = require('../utils/discordNotify');

// An image value may arrive as:
//   • an already-hosted http(s) URL (uploaded client-side via the ImgBB uploader
//     or pasted by the admin)  → store as-is, no re-upload
//   • a base64 data URI / raw base64 (legacy picker flow) → upload to ImgBB
const isHostedUrl = (value) =>
    typeof value === 'string' && /^https?:\/\//i.test(value.trim());

const resolveImage = async (value, name) => {
    if (isHostedUrl(value)) {
        return { public_id: '', url: value.trim() };
    }
    return uploadToImgBBCompat(value, name);
};

// `images` may arrive as a real array, a JSON array string, or a single string
// (legacy clients). Returns an array of raw values, or undefined when absent.
const normalizeImages = (raw) => {
    if (raw === undefined || raw === null) return undefined;
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string') {
        const t = raw.trim();
        if (!t) return [];
        if (t.startsWith('[')) {
            try {
                const parsed = JSON.parse(t);
                return Array.isArray(parsed) ? parsed : [t];
            } catch {
                return [t];
            }
        }
        return [t];
    }
    return [];
};

// Get All Products (public, paginated + filtered)
exports.getAllProducts = asyncErrorHandler(async (req, res, next) => {
    const resultPerPage = 12;
    const productsCount = await Product.countDocuments();

    const searchFeature = new SearchFeatures(Product.find(), req.query)
        .search()
        .filter();

    let products = await searchFeature.query;
    const filteredProductsCount = products.length;

    searchFeature.pagination(resultPerPage);
    products = await searchFeature.query.clone();

    res.status(200).json({
        success: true,
        products,
        productsCount,
        resultPerPage,
        filteredProductsCount,
    });
});

// Get All Products — for sliders (no pagination)
exports.getProducts = asyncErrorHandler(async (req, res, next) => {
    const products = await Product.find();
    res.status(200).json({
        success: true,
        products,
    });
});

// Get Product Details
exports.getProductDetails = asyncErrorHandler(async (req, res, next) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
        return next(new ErrorHandler("Product Not Found", 404));
    }
    res.status(200).json({
        success: true,
        product,
    });
});

// Get All Products — ADMIN
exports.getAdminProducts = asyncErrorHandler(async (req, res, next) => {
    const products = await Product.find();
    res.status(200).json({
        success: true,
        products,
    });
});

// Create Product — ADMIN
exports.createProduct = asyncErrorHandler(async (req, res, next) => {
    const images = normalizeImages(req.body.images) || [];

    const imagesLink = [];
    for (let i = 0; i < images.length; i++) {
        const value = String(images[i] || '').trim();
        if (!value) continue;
        const result = await resolveImage(value, `product-${Date.now()}-${i}`);
        imagesLink.push(result);
    }

    let brandLogo = { public_id: "", url: "" };
    if (req.body.logo) {
        const result = await resolveImage(req.body.logo, `brand-logo-${Date.now()}`);
        brandLogo = result;
    }

    req.body.brand = {
        name: req.body.brandname,
        logo: brandLogo,
    };
    req.body.images = imagesLink;
    req.body.user = req.user.id;

    let specs = [];
    (req.body.specifications || []).forEach((s) => {
        specs.push(JSON.parse(s));
    });
    req.body.specifications = specs;

    const product = await Product.create(req.body);

    // Post the new product to the Discord channel (best-effort — never blocks
    // or fails the request). Fire-and-forget so the admin response is instant.
    notifyProductEvent('created', product.toObject()).catch(() => {});
    logEvent('product_created', {
        title: '🆕 Product created',
        color: 0x22c55e,
        fields: [
            { name: '📦 Product', value: product.name || '—' },
            { name: '💰 Price', value: product.price ? `৳${Number(product.price).toLocaleString('en-US')}` : '—', inline: true },
            { name: '🛠️ By', value: req.user?.email || 'admin', inline: true },
        ],
    }).catch(() => {});

    res.status(201).json({
        success: true,
        product,
    });
});

// Update Product — ADMIN
exports.updateProduct = asyncErrorHandler(async (req, res, next) => {
    let product = await Product.findById(req.params.id);
    if (!product) {
        return next(new ErrorHandler("Product Not Found", 404));
    }

    if (req.body.images !== undefined) {
        const images = normalizeImages(req.body.images) || [];

        const imagesLink = [];
        for (let i = 0; i < images.length; i++) {
            const value = String(images[i] || '').trim();
            if (!value) continue;
            const result = await resolveImage(value, `product-${req.params.id}-${i}`);
            imagesLink.push(result);
        }
        req.body.images = imagesLink;
    }

    if (req.body.logo && req.body.logo.length > 0) {
        const result = await resolveImage(req.body.logo, `brand-logo-${req.params.id}`);
        req.body.brand = {
            name: req.body.brandname,
            logo: result,
        };
    } else if (req.body.brandname) {
        req.body.brand = {
            name: req.body.brandname,
            logo: product.brand.logo,
        };
    }

    let specs = [];
    (req.body.specifications || []).forEach((s) => {
        specs.push(JSON.parse(s));
    });
    req.body.specifications = specs;
    req.body.user = req.user.id;

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });

    // Discord: product updated (best-effort, non-blocking)
    if (product) {
        notifyProductEvent('updated', product.toObject()).catch(() => {});
        logEvent('product_updated', {
            title: '✏️ Product updated',
            color: 0x3b82f6,
            fields: [
                { name: '📦 Product', value: product.name || '—' },
                { name: '🛠️ By', value: req.user?.email || 'admin', inline: true },
            ],
        }).catch(() => {});
    }

    res.status(200).json({
        success: true,
        product,
    });
});

// Delete Product — ADMIN
exports.deleteProduct = asyncErrorHandler(async (req, res, next) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
        return next(new ErrorHandler("Product Not Found", 404));
    }

    // Capture a plain copy before the document is gone, so the Discord embed
    // still has the name/price/images.
    const snapshot = product.toObject();
    await product.deleteOne();

    // Discord: product removed (best-effort, non-blocking)
    notifyProductEvent('deleted', snapshot).catch(() => {});
    logEvent('product_deleted', {
        title: '🗑️ Product deleted',
        color: 0xef4444,
        fields: [
            { name: '📦 Product', value: snapshot.name || '—' },
            { name: '🛠️ By', value: req.user?.email || 'admin', inline: true },
        ],
    }).catch(() => {});

    res.status(200).json({
        success: true,
        message: "Product deleted successfully",
    });
});

// Toggle Featured flag — ADMIN
exports.toggleFeaturedProduct = asyncErrorHandler(async (req, res, next) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
        return next(new ErrorHandler("Product Not Found", 404));
    }

    product.featured = !product.featured;
    await product.save({ validateBeforeSave: false });

    res.status(200).json({
        success: true,
        featured: product.featured,
    });
});

// Create or Update Review
exports.createProductReview = asyncErrorHandler(async (req, res, next) => {
    const { rating, comment, productId } = req.body;

    if (!rating || !productId) {
        return next(new ErrorHandler("Rating and Product ID are required", 400));
    }

    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
        return next(new ErrorHandler("Rating must be between 1 and 5", 400));
    }

    const review = {
        user: req.user._id,
        name: req.user.name,
        rating: numRating,
        comment: String(comment || '').slice(0, 1000),
    };

    const product = await Product.findById(productId);
    if (!product) {
        return next(new ErrorHandler("Product Not Found", 404));
    }

    const existingReviewIndex = product.reviews.findIndex(
        (rev) => rev.user.toString() === req.user._id.toString()
    );

    if (existingReviewIndex >= 0) {
        product.reviews[existingReviewIndex].rating = numRating;
        product.reviews[existingReviewIndex].comment = review.comment;
    } else {
        product.reviews.push(review);
        product.numOfReviews = product.reviews.length;
    }

    const avg = product.reviews.reduce((sum, rev) => sum + rev.rating, 0);
    product.ratings = avg / product.reviews.length;

    await product.save({ validateBeforeSave: false });

    // Discord: new/updated review (best-effort)
    notifyReviewEvent(existingReviewIndex >= 0 ? 'updated' : 'created', {
        product: { name: product.name, image: product.images?.[0]?.url },
        review,
    }).catch(() => {});

    res.status(200).json({ success: true });
});

// Get All Reviews of a Product
exports.getProductReviews = asyncErrorHandler(async (req, res, next) => {
    const product = await Product.findById(req.query.id);
    if (!product) {
        return next(new ErrorHandler("Product Not Found", 404));
    }

    res.status(200).json({
        success: true,
        reviews: product.reviews,
    });
});

// Delete a Review
exports.deleteReview = asyncErrorHandler(async (req, res, next) => {
    const product = await Product.findById(req.query.productId);
    if (!product) {
        return next(new ErrorHandler("Product Not Found", 404));
    }

    const reviews = product.reviews.filter(
        (rev) => rev._id.toString() !== req.query.id.toString()
    );

    // Capture the removed review for the Discord embed before overwriting.
    const removed = product.reviews.find((rev) => rev._id.toString() === req.query.id.toString());

    const avg = reviews.reduce((sum, rev) => sum + rev.rating, 0);
    const ratings = reviews.length > 0 ? avg / reviews.length : 0;

    await Product.findByIdAndUpdate(
        req.query.productId,
        { reviews, ratings: Number(ratings), numOfReviews: reviews.length },
        { new: true, runValidators: true }
    );

    // Discord: review removed (best-effort)
    notifyReviewEvent('deleted', {
        product: { name: product.name, image: product.images?.[0]?.url },
        review: removed,
    }).catch(() => {});

    res.status(200).json({ success: true });
});
