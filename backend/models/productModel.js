const db = require("../config/db");

const PUBLIC_FIELDS = `
    p.product_id, p.farmer_id, p.product_name, p.category, p.price,
    p.quantity, p.unit, p.description, p.image_url, p.created_at,
    f.name AS farmer_name, f.address AS farm_location, f.phone AS farmer_phone
`;

const addProduct = async (product) => {
    const [result] = await db.query(
        `INSERT INTO products
         (farmer_id, product_name, category, price, quantity, unit, description, image_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            product.farmer_id,
            product.product_name,
            product.category,
            product.price,
            product.quantity,
            product.unit,
            product.description,
            product.image_url
        ]
    );
    return result.insertId;
};

// Active products for the shop, with optional search and category filter
const getAllProducts = async ({ search, category } = {}) => {
    let sql = `
        SELECT ${PUBLIC_FIELDS}
        FROM products p
        JOIN farmers f ON p.farmer_id = f.farmer_id
        WHERE p.is_active = 1
    `;
    const params = [];

    if (search) {
        sql += " AND p.product_name LIKE ?";
        params.push(`%${search}%`);
    }
    if (category) {
        sql += " AND p.category = ?";
        params.push(category);
    }

    sql += " ORDER BY p.product_id ASC";

    const [rows] = await db.query(sql, params);
    return rows;
};

const getProductById = async (id) => {
    const [rows] = await db.query(
        `SELECT ${PUBLIC_FIELDS}, p.is_active
         FROM products p
         JOIN farmers f ON p.farmer_id = f.farmer_id
         WHERE p.product_id = ?`,
        [id]
    );
    return rows[0];
};

const getProductsByFarmer = async (farmerId) => {
    const [rows] = await db.query(
        `SELECT * FROM products
         WHERE farmer_id = ? AND is_active = 1
         ORDER BY product_id DESC`,
        [farmerId]
    );
    return rows;
};

// Only updates when the product belongs to this farmer
const updateProduct = async (id, farmerId, product) => {
    const [result] = await db.query(
        `UPDATE products
         SET product_name = ?, category = ?, price = ?, quantity = ?,
             unit = ?, description = ?, image_url = ?
         WHERE product_id = ? AND farmer_id = ? AND is_active = 1`,
        [
            product.product_name,
            product.category,
            product.price,
            product.quantity,
            product.unit,
            product.description,
            product.image_url,
            id,
            farmerId
        ]
    );
    return result.affectedRows;
};

// Soft delete: hides the product but keeps old orders intact
const deleteProduct = async (id, farmerId) => {
    const [result] = await db.query(
        `UPDATE products SET is_active = 0
         WHERE product_id = ? AND farmer_id = ? AND is_active = 1`,
        [id, farmerId]
    );
    return result.affectedRows;
};

module.exports = {
    addProduct,
    getAllProducts,
    getProductById,
    getProductsByFarmer,
    updateProduct,
    deleteProduct
};
