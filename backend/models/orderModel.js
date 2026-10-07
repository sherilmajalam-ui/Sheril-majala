const db = require("../config/db");

const DELIVERY_CHARGE = 20;

// Small helper to create an error with an HTTP status
const httpError = (status, message) => {
    const err = new Error(message);
    err.status = status;
    return err;
};

/*
 * Places an order inside a transaction:
 * - prices come from the database, never from the browser
 * - stock is checked and reduced
 * - a Pending payment row is created
 */
const createOrder = async ({ customerId, items, shipping, paymentMethod }) => {
    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();

        let subtotal = 0;
        const lines = [];

        for (const item of items) {
            // FOR UPDATE locks the row so two orders can't oversell the same stock
            const [rows] = await conn.query(
                `SELECT product_id, product_name, price, quantity, unit, is_active
                 FROM products WHERE product_id = ? FOR UPDATE`,
                [item.product_id]
            );
            const product = rows[0];

            if (!product || !product.is_active) {
                throw httpError(400, "One of the products in your cart is no longer available");
            }
            if (product.quantity < item.quantity) {
                throw httpError(
                    400,
                    `Only ${product.quantity} ${product.unit} of ${product.product_name} left in stock`
                );
            }

            const lineTotal = product.price * item.quantity;
            subtotal += lineTotal;
            lines.push({ product, quantity: item.quantity, lineTotal });
        }

        const total = subtotal + DELIVERY_CHARGE;

        const [orderResult] = await conn.query(
            `INSERT INTO orders
             (customer_id, subtotal, delivery_charge, total_amount,
              delivery_address, city, pincode, phone)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                customerId,
                subtotal,
                DELIVERY_CHARGE,
                total,
                shipping.address,
                shipping.city,
                shipping.pincode,
                shipping.phone
            ]
        );
        const orderId = orderResult.insertId;

        for (const line of lines) {
            await conn.query(
                `INSERT INTO order_items
                 (order_id, product_id, product_name, unit, price, quantity, subtotal)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    orderId,
                    line.product.product_id,
                    line.product.product_name,
                    line.product.unit,
                    line.product.price,
                    line.quantity,
                    line.lineTotal
                ]
            );

            await conn.query(
                "UPDATE products SET quantity = quantity - ? WHERE product_id = ?",
                [line.quantity, line.product.product_id]
            );
        }

        await conn.query(
            `INSERT INTO payments (order_id, amount, payment_method, payment_status)
             VALUES (?, ?, ?, 'Pending')`,
            [orderId, total, paymentMethod]
        );

        await conn.commit();
        return { orderId, subtotal, deliveryCharge: DELIVERY_CHARGE, total };
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
};

// Attaches items, payment and delivery to a list of orders
const attachDetails = async (orders, farmerId = null) => {
    if (orders.length === 0) return orders;

    const ids = orders.map((o) => o.order_id);

    let itemSql = `
        SELECT oi.*, p.image_url, p.farmer_id, f.name AS farmer_name,
               f.address AS farm_location, f.phone AS farmer_phone
        FROM order_items oi
        JOIN products p ON oi.product_id = p.product_id
        JOIN farmers f ON p.farmer_id = f.farmer_id
        WHERE oi.order_id IN (?)
    `;
    const itemParams = [ids];

    // A farmer only sees their own items inside an order
    if (farmerId) {
        itemSql += " AND p.farmer_id = ?";
        itemParams.push(farmerId);
    }

    const [items] = await db.query(itemSql, itemParams);
    const [payments] = await db.query(
        "SELECT * FROM payments WHERE order_id IN (?)",
        [ids]
    );
    const [deliveries] = await db.query(
        "SELECT * FROM deliveries WHERE order_id IN (?)",
        [ids]
    );

    return orders.map((order) => ({
        ...order,
        items: items.filter((i) => i.order_id === order.order_id),
        payment: payments.find((p) => p.order_id === order.order_id) || null,
        delivery: deliveries.find((d) => d.order_id === order.order_id) || null
    }));
};

const getOrdersByCustomer = async (customerId) => {
    const [orders] = await db.query(
        "SELECT * FROM orders WHERE customer_id = ? ORDER BY order_id DESC",
        [customerId]
    );
    return attachDetails(orders);
};

// Orders that contain at least one of this farmer's products
const getOrdersByFarmer = async (farmerId) => {
    const [orders] = await db.query(
        `SELECT DISTINCT o.*, c.name AS customer_name
         FROM orders o
         JOIN customers c ON o.customer_id = c.customer_id
         JOIN order_items oi ON oi.order_id = o.order_id
         JOIN products p ON oi.product_id = p.product_id
         WHERE p.farmer_id = ?
         ORDER BY o.order_id DESC`,
        [farmerId]
    );
    return attachDetails(orders, farmerId);
};

const getOrderById = async (orderId) => {
    const [orders] = await db.query(
        `SELECT o.*, c.name AS customer_name
         FROM orders o
         JOIN customers c ON o.customer_id = c.customer_id
         WHERE o.order_id = ?`,
        [orderId]
    );
    const withDetails = await attachDetails(orders);
    return withDetails[0];
};

const isFarmerInOrder = async (orderId, farmerId) => {
    const [rows] = await db.query(
        `SELECT 1 FROM order_items oi
         JOIN products p ON oi.product_id = p.product_id
         WHERE oi.order_id = ? AND p.farmer_id = ?
         LIMIT 1`,
        [orderId, farmerId]
    );
    return rows.length > 0;
};

/*
 * Changes order status and keeps payment, delivery and stock in sync:
 * - Delivered  -> payment becomes Paid
 * - Cancelled  -> stock is returned, payment becomes Cancelled
 */
const updateOrderStatus = async (orderId, status) => {
    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();

        await conn.query("UPDATE orders SET status = ? WHERE order_id = ?", [status, orderId]);

        await conn.query(
            "UPDATE deliveries SET delivery_status = ? WHERE order_id = ?",
            [status, orderId]
        );

        if (status === "Delivered") {
            await conn.query(
                "UPDATE payments SET payment_status = 'Paid' WHERE order_id = ?",
                [orderId]
            );
        }

        if (status === "Cancelled") {
            const [items] = await conn.query(
                "SELECT product_id, quantity FROM order_items WHERE order_id = ?",
                [orderId]
            );
            for (const item of items) {
                await conn.query(
                    "UPDATE products SET quantity = quantity + ? WHERE product_id = ?",
                    [item.quantity, item.product_id]
                );
            }
            await conn.query(
                "UPDATE payments SET payment_status = 'Cancelled' WHERE order_id = ?",
                [orderId]
            );
        }

        await conn.commit();
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
};

module.exports = {
    DELIVERY_CHARGE,
    createOrder,
    getOrdersByCustomer,
    getOrdersByFarmer,
    getOrderById,
    isFarmerInOrder,
    updateOrderStatus
};
