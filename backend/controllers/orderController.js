const asyncErrorHandler = require('../middlewares/asyncErrorHandler');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const ErrorHandler = require('../utils/errorHandler');
const sendEmail = require('../utils/sendEmail');
const { notifyOrderEvent } = require('../utils/discordNotify');

// Create New Order
exports.newOrder = asyncErrorHandler(async (req, res, next) => {
    const { shippingInfo, orderItems, paymentInfo, totalPrice } = req.body;

    if (!shippingInfo || !orderItems || !orderItems.length || !totalPrice) {
        return next(new ErrorHandler("Missing required order fields", 400));
    }

    const orderExist = await Order.findOne({ paymentInfo });
    if (orderExist) {
        return next(new ErrorHandler("Order Already Placed", 400));
    }

    const order = await Order.create({
        shippingInfo,
        orderItems,
        paymentInfo,
        totalPrice,
        paidAt: Date.now(),
        user: req.user._id,
    });

    // Send confirmation email — non-blocking, don't fail order on email error
    sendEmail({
        email: req.user.email,
        templateId: process.env.SENDGRID_ORDER_TEMPLATEID,
        data: {
            name: req.user.name,
            shippingInfo,
            orderItems,
            totalPrice,
            oid: order._id,
        },
    }).catch((err) => {
        console.error(`Order confirmation email failed for order ${order._id}:`, err.message);
    });

    // Discord: new order (best-effort, non-blocking)
    notifyOrderEvent('created', { ...order.toObject(), customer: { ...shippingInfo, name: req.user.name, email: req.user.email } }).catch(() => {});

    res.status(201).json({
        success: true,
        order,
    });
});

// Get Single Order Details
exports.getSingleOrderDetails = asyncErrorHandler(async (req, res, next) => {
    const order = await Order.findById(req.params.id).populate("user", "name email");
    if (!order) {
        return next(new ErrorHandler("Order Not Found", 404));
    }
    // Only the owner (or an admin) may read an order — prevents IDOR.
    const isOwner = order.user && String(order.user._id) === String(req.user._id);
    if (!isOwner && req.user.role !== 'admin') {
        return next(new ErrorHandler("Not authorized to view this order", 403));
    }
    res.status(200).json({
        success: true,
        order,
    });
});

// Get Logged-In User's Orders
exports.myOrders = asyncErrorHandler(async (req, res, next) => {
    const orders = await Order.find({ user: req.user._id });
    res.status(200).json({
        success: true,
        orders,
    });
});

// Get All Orders — ADMIN
exports.getAllOrders = asyncErrorHandler(async (req, res, next) => {
    const orders = await Order.find();
    const totalAmount = orders.reduce((sum, o) => sum + o.totalPrice, 0);

    res.status(200).json({
        success: true,
        orders,
        totalAmount,
    });
});

// Update Order Status — ADMIN
exports.updateOrder = asyncErrorHandler(async (req, res, next) => {
    const order = await Order.findById(req.params.id);
    if (!order) {
        return next(new ErrorHandler("Order Not Found", 404));
    }

    if (order.orderStatus === "Delivered") {
        return next(new ErrorHandler("This order has already been delivered", 400));
    }

    const { status } = req.body;
    if (!status) {
        return next(new ErrorHandler("Order status is required", 400));
    }

    if (status === "Shipped") {
        order.shippedAt = Date.now();
        // Use Promise.all to run stock updates in parallel and catch any failures
        await Promise.all(
            order.orderItems.map((item) => updateStock(item.product, item.quantity))
        );
    }

    order.orderStatus = status;

    if (status === "Delivered") {
        order.deliveredAt = Date.now();
    }

    await order.save({ validateBeforeSave: false });

    // Discord: order status changed (best-effort)
    notifyOrderEvent('status', { ...order.toObject(), customer: { name: order.shippingInfo?.address, phone: order.shippingInfo?.phoneNo } }, {
        by: req.user?.email,
        status: `Processing → ${status}`,
    }).catch(() => {});

    res.status(200).json({ success: true });
});

async function updateStock(id, quantity) {
    const product = await Product.findById(id);
    if (!product) {
        console.error(`updateStock: Product ${id} not found`);
        return;
    }
    product.stock = Math.max(0, product.stock - quantity);
    await product.save({ validateBeforeSave: false });
}

// Delete Order — ADMIN
exports.deleteOrder = asyncErrorHandler(async (req, res, next) => {
    const order = await Order.findById(req.params.id);
    if (!order) {
        return next(new ErrorHandler("Order Not Found", 404));
    }

    const snapshot = order.toObject();
    await order.deleteOne();

    // Discord: order deleted (best-effort)
    notifyOrderEvent('cancelled', { ...snapshot, customer: { name: snapshot.shippingInfo?.address, phone: snapshot.shippingInfo?.phoneNo } }, {
        by: req.user?.email,
        status: 'deleted',
    }).catch(() => {});

    res.status(200).json({
        success: true,
        message: "Order deleted successfully",
    });
});
