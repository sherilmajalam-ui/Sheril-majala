const mysql = require("mysql2/promise");

// A connection pool shared by all models
const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "fresh_farm",
    waitForConnections: true,
    connectionLimit: 10,
    decimalNumbers: true // return DECIMAL columns as numbers, not strings
});

module.exports = pool;
