const Payment = require("../models/paymentModel");
const Order = require("../models/orderModel");

/*
 * There is no online payment gateway in this project.
 * A payment is created as "Pending" when the order is placed,
 * becomes "Paid" when the order is Delivered,
 * and "Cancelled" if the order is cancelled.
 */

// GET /api/payments/my-payments  (customer)
const getMyPayments = async (req, res) => {
    const payments = await Payment.getPaymentsByCustomer(req.user.id);
    res.json(payments);
};

// GET /api/payments/order/:orderId  (customer who owns it, or farmer in it)
const getPaymentForOrder = async (req, res) => {
    const order = await Order.getOrderById(req.params.orderId);

    const allowed =
        order &&
        ((req.user.role === "customer" && order.customer_id === req.user.id) ||
            (req.user.role === "farmer" && (await Order.isFarmerInOrder(order.order_id, req.user.id))));

    if (!allowed) return res.status(404).json({ message: "Order not found" });

    const payment = await Payment.getPaymentByOrderId(order.order_id);
    res.json(payment);
};

module.exports = { getMyPayments, getPaymentForOrder };
