const { v4: uuidv4 } = require('uuid');
const StoreOrder = require('../models/storeOrderModel');
const Product = require('../models/productModel');
const { getDeliveryCharges, forwardOrderToStore, isConfigured } = require('../services/businessKoro');
const { syncCatalog } = require('../services/catalogSync');

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

// Active delivery charges: Admin → Homepage settings first, env/BK fallback
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
    const fallback = getDeliveryCharges();
    return {
        insideDhaka: Number(fallback.insideDhaka) || 70,
        outsideDhaka: Number(fallback.outsideDhaka) || 130,
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

    const fallback = getDeliveryCharges();
    const delivery = {
        insideDhaka: Number(settings && settings.delivery && settings.delivery.insideDhaka) || Number(fallback.insideDhaka) || 70,
        outsideDhaka: Number(settings && settings.delivery && settings.delivery.outsideDhaka) || Number(fallback.outsideDhaka) || 130,
    };
    const payment = {
        methods: ['bKash', 'Nagad'],
        bKashNumber: (settings && settings.payment && settings.payment.bKashNumber) || process.env.PAYMENT_BKASH_NUMBER || '',
        nagadNumber: (settings && settings.payment && settings.payment.nagadNumber) || process.env.PAYMENT_NAGAD_NUMBER || '',
    };

    return res.status(200).json({
        success: true,
        currency: 'BDT',
        deliveryCharges: delivery,
        payment,
        configured: isConfigured(),
    });
};

// POST /api/v1/store/orders  (public - guests can order without an account)
// Saves the order in our database first; it reaches Business Koro only after
// an admin approves it.
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

        const method = payment.method === 'Nagad' ? 'Nagad' : 'bKash';
        const transactionId = String(payment.transactionId || '').trim();
        if (transactionId.length < 4) {
            return res.status(400).json({ success: false, message: 'Transaction ID (TrxID) is required.' });
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
        const customerDoc = { name, phone, address, division, district, area };
        const paymentDoc = { method, transactionId };
        const deliveryDoc = { zone, charge: deliveryCharge, paidByCustomer: true };

        const docs = orderItems.map(({ product, quantity, sellingPrice }) => ({
            groupId,
            product: {
                productId: product._id,
                bkId: product.bkId,
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

        const itemsTotal = docs.reduce((sum, d) => sum + d.pricing.total, 0);

        return res.status(201).json({
            success: true,
            message: 'Order recorded. It will be forwarded after approval.',
            groupId,
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
            status: orders.every((o) => o.status === 'FORWARDED') ? 'FORWARDED'
                : orders.some((o) => o.status === 'FORWARD_FAILED') ? 'FORWARD_FAILED'
                    : 'PENDING_APPROVAL',
            items: orders.map((o) => ({
                orderId: o._id,
                name: o.product.name,
                image: o.product.image,
                quantity: o.pricing.quantity,
                sellingPrice: o.pricing.sellingPrice,
                status: o.status,
                bkOrderId: o.bkOrderId,
                bkError: o.bkError,
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
        const orders = await StoreOrder.find().sort('-createdAt').limit(200);
        return res.status(200).json({ success: true, orders });
    } catch (err) {
        console.log(`Store orders list error: ${err.message}`);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// PUT /api/v1/admin/store/orders/:id/approve  (admin)
// Forwards the saved order to Business Koro.
const approveStoreOrder = async (req, res) => {
    try {
        const order = await StoreOrder.findById(req.params.id);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

        if (order.status === 'FORWARDED') {
            return res.status(400).json({ success: false, message: 'Order already forwarded to Business Koro.' });
        }
        if (order.status === 'CANCELLED') {
            return res.status(400).json({ success: false, message: 'Cancelled orders cannot be approved.' });
        }
        if (!order.product.bkId) {
            return res.status(400).json({
                success: false,
                message: 'This product has no Business Koro ID. Run "Sync catalogue" first so the order can be forwarded.',
            });
        }

        const payload = {
            productId: order.product.bkId,
            customerName: order.customer.name,
            customerPhone: order.customer.phone,
            customerAddress: order.customer.address,
            customerDivision: order.customer.division,
            customerDistrict: order.customer.district,
            customerArea: order.customer.area,
            sellingPrice: order.pricing.sellingPrice,
            deliveryChargePaidByCustomer: order.delivery.paidByCustomer,
            // delivery charge was collected in advance via bKash/Nagad send money
            deliveryChargeCollectionMode: 'CUSTOMER_PAID_RESELLER_UPFRONT',
            customerNote: `Payment ${order.payment.method} TrxID: ${order.payment.transactionId}`,
        };

        try {
            const body = await forwardOrderToStore(payload);

            order.status = 'FORWARDED';
            order.bkOrderId = body && (body.orderId || (body.data && body.data.orderId));
            order.bkStatus = body && (body.status || (body.data && body.data.status));
            order.forwardedAt = new Date();
            order.approvedBy = req.user && req.user.id;
            order.bkError = undefined;
            await order.save();

            return res.status(200).json({ success: true, order, upstream: body });
        } catch (err) {
            order.status = 'FORWARD_FAILED';
            order.bkError = err.message;
            order.bkErrorDetail = err.upstream ? JSON.stringify(err.upstream).slice(0, 500) : undefined;
            await order.save();

            console.log(`Store order forward failed: ${err.message}`);
            return res.status(err.status || 502).json({ success: false, message: err.message, upstream: err.upstream });
        }
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

        return res.status(200).json({ success: true, order });
    } catch (err) {
        console.log(`Cancel store order error: ${err.message}`);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/v1/admin/store/sync  (admin) - pull the Business Koro catalogue now
const syncStoreCatalog = async (req, res) => {
    try {
        const result = await syncCatalog({ force: true });
        return res.status(200).json({ success: true, result });
    } catch (err) {
        return res.status(err.status || 502).json({ success: false, message: err.message });
    }
};

// ── Guest order tracking ────────────────────────────────────────────────
// GET /api/v1/store/track?phone=017...&groupId=xxxx  (public)
// Lookup by phone (any guest order) or exact order-group id.
const trackStoreOrder = async (req, res) => {
    try {
        const phone = normalizePhone(req.query.phone || '');
        const groupId = (req.query.groupId || '').trim();

        let orders = [];
        if (groupId) {
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
                status: list.every((o) => o.status === 'FORWARDED') ? 'FORWARDED'
                    : list.some((o) => o.status === 'FORWARD_FAILED') ? 'FORWARD_FAILED'
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
            order.payment.verified = !!paymentVerified;
            order.payment.verifiedAt = paymentVerified ? new Date() : undefined;
        }

        await order.save();
        return res.status(200).json({ success: true, order });
    } catch (err) {
        console.log(`Update fulfilment status error: ${err.message}`);
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
    syncStoreCatalog,
    trackStoreOrder,
    updateFulfilmentStatus,
};
