const db = require("../config/db");

const createCustomer = async (customer) => {
    const [result] = await db.query(
        `INSERT INTO customers (name, email, phone, password, address)
         VALUES (?, ?, ?, ?, ?)`,
        [customer.name, customer.email, customer.phone, customer.password, customer.address]
    );
    return result.insertId;
};

// Includes password - only use for login
const findCustomerByEmail = async (email) => {
    const [rows] = await db.query("SELECT * FROM customers WHERE email = ?", [email]);
    return rows[0];
};

// Never returns the password
const getCustomerById = async (id) => {
    const [rows] = await db.query(
        `SELECT customer_id, name, email, phone, address, created_at
         FROM customers WHERE customer_id = ?`,
        [id]
    );
    return rows[0];
};

module.exports = { createCustomer, findCustomerByEmail, getCustomerById };
