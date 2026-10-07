const Order = require("../models/orderModel");
const { clean, isPhone, isPincode } = require("../utils/validate");

const PAYMENT_METHODS = ["Cash on Delivery", "UPI", "Card"];

// The order a status moves through. Cancelled is handled separately.
const STATUS_FLOW = ["Placed", "Confirmed", "Packed", "Out for Delivery", "Delivered"];

// POST /api/orders  (customer)
const createOrder = async (req, res) => {
    const { items, address, city, pincode, phone, payment_method } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Your cart is empty" });
    }

    // Merge duplicate products and validate quantities
    const merged = new Map();
    for (const item of items) {
        const id = Number(item.product_id);
        const qty = Number(item.quantity);

        if (!Number.isInteger(id) || id <= 0 || !Number.isInteger(qty) || qty < 1 || qty > 100) {
            return res.status(400).json({ message: "Each item needs a quantity between 1 and 100" });
        }
        merged.set(id, (merged.get(id) || 0) + qty);
    }

    if (!address || clean(address).length < 5) {
        return res.status(400).json({ message: "Please enter your full delivery address" });
    }
    if (!city || clean(city).length < 2) {
        return res.status(400).json({ message: "Please enter your city" });
    }
    if (!isPincode(pincode)) {
        return res.status(400).json({ message: "Please enter a valid 6-digit PIN code" });
    }
    if (!isPhone(phone || "")) {
        return res.status(400).json({ message: "Please enter a valid 10-digit mobile number" });
    }
    if (!PAYMENT_METHODS.includes(payment_method)) {
        return res.status(400).json({ message: "Please choose a payment method" });
    }

    const result = await Order.createOrder({
        customerId: req.user.id,
        items: [...merged].map(([product_id, quantity]) => ({ product_id, quantity })),
        shipping: {
            address: clean(address),
            city: clean(city),
            pincode: clean(String(pincode)),
            phone: clean(phone)
        },
        paymentMethod: payment_method
    });

    res.status(201).json({
        message: "Order placed successfully",
        orderId: result.orderId,
        total: result.total
    });
};

// GET /api/orders/my-orders  (customer)
const getCustomerOrders = async (req, res) => {
    const orders = await Order.getOrdersByCustomer(req.user.id);
    res.json(orders);
};

// GET /api/orders/farmer-orders  (farmer)
const getFarmerOrders = async (req, res) => {
    const orders = await Order.getOrdersByFarmer(req.user.id);
    res.json(orders);
};

// GET /api/orders/:id  (the customer who placed it, or a farmer whose product is in it)
const getOrder = async (req, res) => {
    const order = await Order.getOrderById(req.params.id);

    const allowed =
        order &&
        ((req.user.role === "customer" && order.customer_id === req.user.id) ||
            (req.user.role === "farmer" && (await Order.isFarmerInOrder(order.order_id, req.user.id))));

    if (!allowed) return res.status(404).json({ message: "Order not found" });

    res.json(order);
};

// PUT /api/orders/:id/status  (farmer)
const updateOrderStatus = async (req, res) => {
    const { status } = req.body;

    if (!STATUS_FLOW.includes(status) && status !== "Cancelled") {
        return res.status(400).json({ message: "Invalid status" });
    }

    const order = await Order.getOrderById(req.params.id);
    if (!order || !(await Order.isFarmerInOrder(order.order_id, req.user.id))) {
        return res.status(404).json({ message: "Order not found" });
    }

    if (order.status === "Delivered" || order.status === "Cancelled") {
        return res.status(400).json({ message: `This order is already ${order.status.toLowerCase()}` });
    }

    // Status can only move forward, never back
    if (status !== "Cancelled" && STATUS_FLOW.indexOf(status) <= STATUS_FLOW.indexOf(order.status)) {
        return res.status(400).json({ message: `Order is already ${order.status}` });
    }

    await Order.updateOrderStatus(order.order_id, status);

    res.json({ message: `Order marked as ${status}` });
};

// PUT /api/orders/:id/cancel  (customer, only before the farmer confirms)
const cancelOrder = async (req, res) => {
    const order = await Order.getOrderById(req.params.id);

    if (!order || order.customer_id !== req.user.id) {
        return res.status(404).json({ message: "Order not found" });
    }
    if (order.status !== "Placed") {
        return res.status(400).json({
            message: "This order can't be cancelled now. Please contact the farmer."
        });
    }

    await Order.updateOrderStatus(order.order_id, "Cancelled");

    res.json({ message: "Order cancelled" });
};

module.exports = {
    createOrder,
    getCustomerOrders,
    getFarmerOrders,
    getOrder,
    updateOrderStatus,
    cancelOrder
};
