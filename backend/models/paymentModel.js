const db = require("../config/db");

// Payments are created automatically when an order is placed (see orderModel)

const getPaymentByOrderId = async (orderId) => {
    const [rows] = await db.query("SELECT * FROM payments WHERE order_id = ?", [orderId]);
    return rows[0];
};

const getPaymentsByCustomer = async (customerId) => {
    const [rows] = await db.query(
        `SELECT pay.*
         FROM payments pay
         JOIN orders o ON pay.order_id = o.order_id
         WHERE o.customer_id = ?
         ORDER BY pay.payment_id DESC`,
        [customerId]
    );
    return rows;
};

module.exports = { getPaymentByOrderId, getPaymentsByCustomer };
