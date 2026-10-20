const { v4: uuidv4 } = require('uuid');
const StoreOrder = require('../models/storeOrderModel');
const Product = require('../models/productModel');
const { notifyOrderEvent } = require('../utils/discordNotify');

const BENGALI_DIGITS = '০১২৩৪৫৬৭৮৯';

// Accepts 01712345678, +8801712345678, spaces/dashes and Bengali numerals
const normalizePhone = (raw = '') => {
    let value = String(raw).trim();
    value = value.replace(/[০-৯]/g, (d) => String(BENGALI_DIGITS.indexOf(d)));
    value = value.replace(/[\s\-().]/g, '');

    if (/^(\+?880)1[3-9]\d{8}$/.test(value)) {
        value = value.replace(/^\+?880/, '0');
    }
    return value;
};

const isValidPhone = (value) => /^01[3-9]\d{8}$/.test(value);

// Active delivery charges: Admin → Homepage settings first, env defaults after.
const getActiveDeliveryCharges = async () => {
    try {
        const SiteConfig = require('../models/siteConfigModel');
        const settings = await SiteConfig.findOne();
        if (settings && settings.delivery) {
            return {
                insideDhaka: Number(settings.delivery.insideDhaka) || 70,
                outsideDhaka: Number(settings.delivery.outsideDhaka) || 130,
            };
        }
    } catch (e) { /* fallback below */ }
    return {
        insideDhaka: Number(process.env.DELIVERY_CHARGE_INSIDE_DHAKA) || 70,
        outsideDhaka: Number(process.env.DELIVERY_CHARGE_OUTSIDE_DHAKA) || 130,
    };
};

// GET /api/v1/store/config  (public - checkout needs delivery charges + payment numbers)
// Values come from Admin → Homepage settings (editable without code), with fallbacks.
const getStoreConfig = async (req, res) => {
    let settings = null;
    try {
        const SiteConfig = require('../models/siteConfigModel');
        settings = await SiteConfig.findOne().sort('-updatedAt');
    } catch (e) { /* fall through to defaults */ }

    const delivery = {
        insideDhaka: Number(settings && settings.delivery && settings.delivery.insideDhaka) || Number(process.env.DELIVERY_CHARGE_INSIDE_DHAKA) || 70,
        outsideDhaka: Number(settings && settings.delivery && settings.delivery.outsideDhaka) || Number(process.env.DELIVERY_CHARGE_OUTSIDE_DHAKA) || 130,
    };
    const payment = {
        methods: ['COD', 'bKash', 'Nagad'],
        bKashNumber: (settings && settings.payment && settings.payment.bKashNumber) || process.env.PAYMENT_BKASH_NUMBER || '',
        nagadNumber: (settings && settings.payment && settings.payment.nagadNumber) || process.env.PAYMENT_NAGAD_NUMBER || '',
    };

    return res.status(200).json({
        success: true,
        currency: 'BDT',
        deliveryCharges: delivery,
        payment,
        // Orders are always saved in this shop's own database — no external
        // fulfilment service is required any more.
        configured: true,
    });
};

// POST /api/v1/store/orders  (public - guests can order without an account)
// Saves the order in our database with status PENDING_APPROVAL; an admin then
// approves or cancels it from the Store Orders page.
const createStoreOrder = async (req, res) => {
    try {
        const { items, customer = {}, payment = {}, delivery = {} } = req.body || {};

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, message: 'Cart is empty.' });
        }

        const name = String(customer.name || '').trim();
        const phone = normalizePhone(customer.phone);
        const address = String(customer.address || '').trim();
        const division = String(customer.division || '').trim();
        const district = String(customer.district || '').trim();
        const area = String(customer.area || '').trim();

        if (!name || !address || !division || !district) {
            return res.status(400).json({ success: false, message: 'Name, address, division and district are required.' });
        }
        if (!isValidPhone(phone)) {
            return res.status(400).json({ success: false, message: 'Enter a valid Bangladeshi mobile number (e.g. 01712345678).' });
        }

        // Cash on Delivery needs no advance payment, so no TrxID either —
        // the customer pays everything (items + delivery) on arrival.
        const method = payment.method === 'Nagad' ? 'Nagad'
            : payment.method === 'COD' ? 'COD'
                : 'bKash';
        const transactionId = String(payment.transactionId || '').trim();
        if (method !== 'COD' && transactionId.length < 4) {
            return res.status(400).json({ success: false, message: 'Transaction ID (TrxID) is required.' });
        }

        // COD is trust-based: the admin grants it per user (Admin → Users →
        // COD toggle). Guests and users without the flag must use bKash/Nagad
        // advance payment or contact the admin on WhatsApp first. Admins can
        // always use COD.
        if (method === 'COD') {
            const codOk = req.user && (req.user.role === 'admin' || req.user.codAllowed === true);
            if (!codOk) {
                return res.status(403).json({
                    success: false,
                    message: 'Cash on Delivery is not enabled for your account. Contact the admin on WhatsApp to enable COD, or choose bKash/Nagad.',
                });
            }
        }

        const zone = delivery.zone === 'outside-dhaka' ? 'outside-dhaka' : 'inside-dhaka';
        const charges = await getActiveDeliveryCharges();
        const deliveryCharge = zone === 'inside-dhaka'
            ? Number(charges.insideDhaka) || 70
            : Number(charges.outsideDhaka) || 130;

        const productIds = items.map((i) => i.productId);
        const products = await Product.find({ _id: { $in: productIds } }).select('+bkCostPrice');

        const notOrderable = [];
        const orderItems = [];

        for (const item of items) {
            const product = products.find((p) => String(p._id) === String(item.productId));
            const quantity = Math.max(1, Math.min(10, Number(item.quantity) || 1));

            if (!product) {
                notOrderable.push(item.productId);
                continue;
            }
            if (product.stock < 1) {
                notOrderable.push(`${product.name} (out of stock)`);
                continue;
            }
            if (product.bkCostPrice && product.price <= product.bkCostPrice) {
                return res.status(400).json({
                    success: false,
                    message: `"${product.name}": selling price must be higher than the product cost price.`,
                });
            }

            orderItems.push({ product, quantity, sellingPrice: product.price });
        }

        if (notOrderable.length) {
            return res.status(400).json({ success: false, message: `These items cannot be ordered: ${notOrderable.join(', ')}` });
        }

        const groupId = uuidv4();
        // Human order reference built from the customer's mobile number so the
        // number and the order id can be matched: 8801580831611 → "8801580831611-4F2A".
        const nationPhone = phone.replace(/^0/, '88');
        const suffix = groupId.replace(/-/g, '').slice(-4).toUpperCase();
        const orderId = `${nationPhone}-${suffix}`;
        const customerDoc = { name, phone, address, division, district, area };
        const paymentDoc = { method, transactionId };
        const deliveryDoc = { zone, charge: deliveryCharge, paidByCustomer: method !== 'COD' };

        const itemsTotal = orderItems.reduce((sum, { quantity, sellingPrice }) => sum + sellingPrice * quantity, 0);

        // ── Logged-in buyer → account order (Online Orders page) ──────────
        // Saves into the classic Order model so it shows in the admin's Online
        // Orders list, the buyer's account history and the account page.
        if (req.user) {
            const Order = require('../models/orderModel');
            const accountOrder = await Order.create({
                orderId,
                shippingInfo: {
                    address: `${address}${area ? `, ${area}` : ''}`,
                    city: district,
                    state: division,
                    country: 'Bangladesh',
                    pincode: 0,
                    phoneNo: Number(phone) || 0,
                },
                orderItems: orderItems.map(({ product, quantity, sellingPrice }) => ({
                    name: product.name,
                    price: sellingPrice,
                    quantity,
                    image: product.images && product.images[0] ? product.images[0].url : '',
                    product: product._id,
                })),
                user: req.user._id,
                paymentInfo: {
                    id: transactionId || `COD-${groupId.slice(0, 8)}`,
                    status: method === 'COD' ? 'Pending' : 'Paid',
                },
                paymentMethod: method,
                ...(method === 'COD' ? {} : { paidAt: Date.now() }),
                totalPrice: itemsTotal + deliveryCharge,
                orderStatus: 'Processing',
            });

            notifyOrderEvent('created', {
                ...accountOrder.toObject(),
                orderId,
                customer: { ...customerDoc, name: req.user.name, email: req.user.email },
                pricing: { quantity: orderItems.reduce((s, i) => s + i.quantity, 0), total: itemsTotal + deliveryCharge },
                orderItems: orderItems.map(({ product, quantity, sellingPrice }) => ({ name: product.name, price: sellingPrice, quantity })),
                product: { name: orderItems[0]?.product?.name, image: orderItems[0]?.product?.images?.[0]?.url },
            }).catch(() => {});

            return res.status(201).json({
                success: true,
                message: 'Order placed successfully.',
                account: true,
                orderId,
                status: 'Processing',
                summary: {
                    itemsTotal,
                    deliveryCharge,
                    grandTotal: itemsTotal + deliveryCharge,
                    currency: 'BDT',
                },
                orderIds: [accountOrder._id],
            });
        }

        // ── Guest → store order (Store Orders page, admin approves) ────────
        const docs = orderItems.map(({ product, quantity, sellingPrice }) => ({
            groupId,
            orderId,
            user: null,
            product: {
                productId: product._id,
                name: product.name,
                image: product.images && product.images[0] ? product.images[0].url : '',
            },
            customer: customerDoc,
            payment: paymentDoc,
            delivery: deliveryDoc,
            pricing: {
                quantity,
                sellingPrice,
                total: sellingPrice * quantity,
            },
        }));

        const created = await StoreOrder.insertMany(docs);

        // Discord: announce the new order in the orders channel (best-effort).
        // One message per order group, listing every line item.
        notifyOrderEvent('created', {
            _id: groupId,
            groupId,
            orderId,
            customer: customerDoc,
            payment: paymentDoc,
            delivery: deliveryDoc,
            status: 'PENDING_APPROVAL',
            pricing: {
                quantity: docs.reduce((sum, d) => sum + d.pricing.quantity, 0),
                total: itemsTotal + deliveryCharge,
            },
            orderItems: docs.map((d) => ({
                name: d.product.name,
                price: d.pricing.sellingPrice,
                quantity: d.pricing.quantity,
            })),
            product: { name: docs[0]?.product?.name, image: docs[0]?.product?.image },
        }).catch(() => {});

        return res.status(201).json({
            success: true,
            message: 'Order recorded. Awaiting approval.',
            groupId,
            orderId,
            status: 'PENDING_APPROVAL',
            summary: {
                itemsTotal,
                deliveryCharge,
                grandTotal: itemsTotal + deliveryCharge,
                currency: 'BDT',
            },
            orderIds: created.map((o) => o._id),
        });
    } catch (err) {
        console.log(`Store order create error: ${err.message}`);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/v1/store/orders/:groupId  (public - guest order status)
const getStoreOrderGroup = async (req, res) => {
    try {
        const orders = await StoreOrder.find({ groupId: req.params.groupId }).sort('createdAt');
        if (!orders.length) return res.status(404).json({ success: false, message: 'Order not found.' });

        const charges = await getActiveDeliveryCharges();
        const deliveryCharge = orders[0].delivery.charge;
        const itemsTotal = orders.reduce((sum, o) => sum + o.pricing.total, 0);

        return res.status(200).json({
            success: true,
            groupId: req.params.groupId,
            status: orders.every((o) => o.status === 'APPROVED' || o.status === 'CANCELLED')
                && orders.some((o) => o.status === 'APPROVED') ? 'APPROVED'
                : 'PENDING_APPROVAL',
            items: orders.map((o) => ({
                orderId: o._id,
                name: o.product.name,
                image: o.product.image,
                quantity: o.pricing.quantity,
                sellingPrice: o.pricing.sellingPrice,
                status: o.status,
            })),
            summary: { itemsTotal, deliveryCharge, grandTotal: itemsTotal + deliveryCharge, currency: 'BDT' },
            deliveryCharges: charges,
        });
    } catch (err) {
        console.log(`Store order group error: ${err.message}`);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/v1/admin/store/orders  (admin)
const getStoreOrders = async (req, res) => {
    try {
        const orders = await StoreOrder.find({ user: null })
            .sort('-createdAt')
            .limit(200)
            .populate('user', 'name email');
        return res.status(200).json({ success: true, orders });
    } catch (err) {
        console.log(`Store orders list error: ${err.message}`);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// PUT /api/v1/admin/store/orders/:id/approve  (admin)
// Marks the order as approved (ready to fulfil). The Business Koro forwarding
// step was removed — orders now live entirely in this shop's own database.
const approveStoreOrder = async (req, res) => {
    try {
        const order = await StoreOrder.findById(req.params.id);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

        if (order.status === 'APPROVED') {
            return res.status(400).json({ success: false, message: 'Order is already approved.' });
        }
        if (order.status === 'CANCELLED') {
            return res.status(400).json({ success: false, message: 'Cancelled orders cannot be approved.' });
        }

        order.status = 'APPROVED';
        order.approvedBy = req.user && req.user.id;
        await order.save();

        // Discord: order approved by an admin
        notifyOrderEvent('approved', order.toObject(), { by: req.user?.email }).catch(() => {});

        return res.status(200).json({ success: true, order });
    } catch (err) {
        console.log(`Store order approve error: ${err.message}`);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// PUT /api/v1/admin/store/orders/:id/cancel  (admin)
const cancelStoreOrder = async (req, res) => {
    try {
        const order = await StoreOrder.findById(req.params.id);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

        if (order.status === 'CANCELLED') {
            return res.status(400).json({ success: false, message: 'Order is already cancelled.' });
        }
        if (order.fulfilment === 'DELIVERED') {
            return res.status(400).json({ success: false, message: 'A delivered order cannot be cancelled.' });
        }

        order.status = 'CANCELLED';
        order.fulfilment = 'CANCELLED';
        await order.save();

        // Discord: order cancelled by an admin
        notifyOrderEvent('cancelled', order.toObject(), { by: req.user?.email }).catch(() => {});

        return res.status(200).json({ success: true, order });
    } catch (err) {
        console.log(`Cancel store order error: ${err.message}`);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ── Guest order tracking ────────────────────────────────────────────────
// GET /api/v1/store/track?phone=017...&groupId=xxxx  (public)
// Lookup by phone (any guest order) or exact order-group id.
const trackStoreOrder = async (req, res) => {
    try {
        const phone = normalizePhone(req.query.phone || '');
        const groupId = (req.query.groupId || '').trim();
        const orderId = (req.query.orderId || '').trim();

        let orders = [];
        if (orderId) {
            // "8801580831611-4F2A" — every line item of a checkout shares it.
            orders = await StoreOrder.find({ orderId }).sort('createdAt');
            // legacy fallback: an old checkout may only carry the group id
            if (!orders.length) orders = await StoreOrder.find({ groupId: orderId }).sort('createdAt');
        } else if (groupId) {
            orders = await StoreOrder.find({ groupId }).sort('createdAt');
        } else if (phone) {
            orders = await StoreOrder.find({ 'customer.phone': phone }).sort('-createdAt').limit(50);
        }

        if (!orders.length) {
            return res.status(404).json({
                success: false,
                message: 'No order found with these details. Please check the number/order ID.',
            });
        }

        // group orders (phone lookup can span several checkouts)
        const groups = {};
        orders.forEach((o) => {
            if (!groups[o.groupId]) groups[o.groupId] = [];
            groups[o.groupId].push(o);
        });

        const payload = Object.keys(groups).map((gid) => {
            const list = groups[gid];
            const itemsTotal = list.reduce((sum, o) => sum + o.pricing.total, 0);
            const deliveryCharge = list[0].delivery.charge;
            return {
                groupId: gid,
                orderId: list[0].orderId || `TB-${String(gid).slice(-4).toUpperCase()}`,
                status: list.every((o) => o.status === 'APPROVED' || o.status === 'CANCELLED')
                    && list.some((o) => o.status === 'APPROVED') ? 'APPROVED'
                    : list.every((o) => o.status === 'CANCELLED') ? 'CANCELLED'
                        : 'PENDING_APPROVAL',
                fulfilment: list.some((o) => o.status === 'CANCELLED') ? 'CANCELLED'
                    : list.map((o) => o.fulfilment || 'PLACED')
                        .sort((a, b) => ['PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED'].indexOf(a) - ['PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED'].indexOf(b))[0],
                placedAt: list[0].createdAt,
                payment: { method: list[0].payment.method, verified: !!list[0].payment.verified },
                items: list.map((o) => ({
                    orderId: o._id,
                    name: o.product.name,
                    image: o.product.image,
                    quantity: o.pricing.total ? Math.round(o.pricing.total / (o.pricing.sellingPrice || 1)) : 1,
                    sellingPrice: o.pricing.sellingPrice,
                    status: o.status,
                    fulfilment: o.fulfilment || 'PLACED',
                })),
                summary: { itemsTotal, deliveryCharge, grandTotal: itemsTotal + deliveryCharge, currency: 'BDT' },
            };
        });

        return res.status(200).json({ success: true, orders: payload });
    } catch (err) {
        console.log(`Track store order error: ${err.message}`);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ── Admin: update customer-facing fulfilment status ─────────────────────
// PUT /api/v1/admin/store/orders/:id/status   { fulfilment: 'CONFIRMED' }
const UPDATEABLE_FULFILMENT = ['PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];

const updateFulfilmentStatus = async (req, res) => {
    try {
        const { fulfilment, paymentVerified } = req.body || {};
        const order = await StoreOrder.findById(req.params.id);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

        const previousFulfilment = order.fulfilment;
        let verifiedChanged = false;

        if (fulfilment !== undefined) {
            if (!UPDATEABLE_FULFILMENT.includes(fulfilment)) {
                return res.status(400).json({ success: false, message: 'Invalid status.' });
            }
            if (order.status === 'CANCELLED') {
                return res.status(400).json({ success: false, message: 'A cancelled order cannot change status.' });
            }
            order.fulfilment = fulfilment;
        }
        if (paymentVerified !== undefined) {
            verifiedChanged = order.payment.verified !== !!paymentVerified;
            order.payment.verified = !!paymentVerified;
            order.payment.verifiedAt = paymentVerified ? new Date() : undefined;
        }

        await order.save();

        // Discord: fulfilment change / payment verification (best-effort)
        if (fulfilment !== undefined && fulfilment !== previousFulfilment) {
            notifyOrderEvent('status', order.toObject(), {
                by: req.user?.email,
                status: `${previousFulfilment} → ${fulfilment}`,
            }).catch(() => {});
        }
        if (verifiedChanged && order.payment.verified) {
            notifyOrderEvent('payment_verified', order.toObject(), { by: req.user?.email }).catch(() => {});
        }

        return res.status(200).json({ success: true, order });
    } catch (err) {
        console.log(`Update fulfilment status error: ${err.message}`);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ── Logged-in user: my store orders ─────────────────────────────────────
// GET /api/v1/store/my-orders  (requires login)
// Groups the user's store orders into one entry per checkout so the account
// page can list them alongside classic (account) orders.
const getMyStoreOrders = async (req, res) => {
    try {
        const orders = await StoreOrder.find({ user: req.user._id })
            .sort('-createdAt')
            .limit(200);

        const groups = {};
        orders.forEach((o) => {
            if (!groups[o.groupId]) groups[o.groupId] = [];
            groups[o.groupId].push(o);
        });

        const payload = Object.keys(groups).map((gid) => {
            const list = groups[gid];
            const itemsTotal = list.reduce((sum, o) => sum + o.pricing.total, 0);
            const deliveryCharge = list[0].delivery.charge;
            const allCancelled = list.every((o) => o.status === 'CANCELLED');
            return {
                groupId: gid,
                orderId: list[0].orderId || `TB-${String(gid).slice(-4).toUpperCase()}`,
                status: allCancelled ? 'CANCELLED'
                    : list.every((o) => o.status === 'APPROVED' || o.status === 'CANCELLED')
                        && list.some((o) => o.status === 'APPROVED') ? 'APPROVED'
                        : 'PENDING_APPROVAL',
                fulfilment: list.some((o) => o.status === 'CANCELLED') ? 'CANCELLED'
                    : list.map((o) => o.fulfilment || 'PLACED')
                        .sort((a, b) => ['PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED'].indexOf(a) - ['PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED'].indexOf(b))[0],
                placedAt: list[0].createdAt,
                payment: { method: list[0].payment.method, verified: !!list[0].payment.verified },
                customer: list[0].customer,
                delivery: { zone: list[0].delivery.zone, charge: deliveryCharge },
                items: list.map((o) => ({
                    orderId: o._id,
                    name: o.product.name,
                    image: o.product.image,
                    quantity: o.pricing.quantity,
                    sellingPrice: o.pricing.sellingPrice,
                    status: o.status,
                    fulfilment: o.fulfilment || 'PLACED',
                })),
                summary: { itemsTotal, deliveryCharge, grandTotal: itemsTotal + deliveryCharge, currency: 'BDT' },
            };
        });

        return res.status(200).json({ success: true, orders: payload });
    } catch (err) {
        console.log(`My store orders error: ${err.message}`);
        return res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = {
    getStoreConfig,
    createStoreOrder,
    getStoreOrderGroup,
    getStoreOrders,
    approveStoreOrder,
    cancelStoreOrder,
    trackStoreOrder,
    updateFulfilmentStatus,
    getMyStoreOrders,
};
