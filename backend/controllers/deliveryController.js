const Delivery = require("../models/deliveryModel");
const Order = require("../models/orderModel");
const { clean, isPhone } = require("../utils/validate");

// POST /api/deliveries  (farmer assigns a delivery person to an order)
const assignDelivery = async (req, res) => {
    const { order_id, delivery_person, phone } = req.body;

    if (!delivery_person || clean(delivery_person).length < 2) {
        return res.status(400).json({ message: "Please enter the delivery person's name" });
    }
    if (!isPhone(phone || "")) {
        return res.status(400).json({ message: "Please enter a valid 10-digit mobile number" });
    }

    const order = await Order.getOrderById(order_id);
    if (!order || !(await Order.isFarmerInOrder(order.order_id, req.user.id))) {
        return res.status(404).json({ message: "Order not found" });
    }
    if (order.status === "Delivered" || order.status === "Cancelled") {
        return res.status(400).json({ message: `This order is already ${order.status.toLowerCase()}` });
    }

    await Delivery.assignDelivery({
        order_id: order.order_id,
        delivery_person: clean(delivery_person),
        phone: clean(phone),
        delivery_status: order.status
    });

    res.status(201).json({ message: "Delivery person assigned" });
};

// GET /api/deliveries/order/:orderId
const getDeliveryForOrder = async (req, res) => {
    const order = await Order.getOrderById(req.params.orderId);

    const allowed =
        order &&
        ((req.user.role === "customer" && order.customer_id === req.user.id) ||
            (req.user.role === "farmer" && (await Order.isFarmerInOrder(order.order_id, req.user.id))));

    if (!allowed) return res.status(404).json({ message: "Order not found" });

    const delivery = await Delivery.getDeliveryByOrderId(order.order_id);
    res.json(delivery || null);
};

module.exports = { assignDelivery, getDeliveryForOrder };
