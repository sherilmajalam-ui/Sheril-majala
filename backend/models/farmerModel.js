const db = require("../config/db");

const createFarmer = async (farmer) => {
    const [result] = await db.query(
        `INSERT INTO farmers (name, email, phone, password, address)
         VALUES (?, ?, ?, ?, ?)`,
        [farmer.name, farmer.email, farmer.phone, farmer.password, farmer.address]
    );
    return result.insertId;
};

// Includes password - only use for login
const findFarmerByEmail = async (email) => {
    const [rows] = await db.query("SELECT * FROM farmers WHERE email = ?", [email]);
    return rows[0];
};

// Never returns the password
const getFarmerById = async (id) => {
    const [rows] = await db.query(
        `SELECT farmer_id, name, email, phone, address, created_at
         FROM farmers WHERE farmer_id = ?`,
        [id]
    );
    return rows[0];
};

module.exports = { createFarmer, findFarmerByEmail, getFarmerById };
