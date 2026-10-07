const db = require("../config/db");

// Creates the delivery record, or updates the person if one exists already
const assignDelivery = async ({ order_id, delivery_person, phone, delivery_status }) => {
    await db.query(
        `INSERT INTO deliveries (order_id, delivery_person, phone, delivery_status)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
            delivery_person = VALUES(delivery_person),
            phone = VALUES(phone)`,
        [order_id, delivery_person, phone, delivery_status]
    );
};

const getDeliveryByOrderId = async (orderId) => {
    const [rows] = await db.query("SELECT * FROM deliveries WHERE order_id = ?", [orderId]);
    return rows[0];
};

module.exports = { assignDelivery, getDeliveryByOrderId };
