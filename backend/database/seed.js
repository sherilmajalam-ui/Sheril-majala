// Adds demo farmers, a demo customer and starter products.
// Run after schema.sql:  npm run seed

require("dotenv").config();

const bcrypt = require("bcryptjs");
const db = require("../config/db");

const img = (id) =>
    `https://images.unsplash.com/${id}?auto=format&fit=crop&w=600&q=80`;

async function seed() {
    const existing = await db.query("SELECT COUNT(*) AS n FROM farmers");
    if (existing[0][0].n > 0) {
        console.log("Data already exists. Run schema.sql again to reset, then seed.");
        process.exit(0);
    }

    const farmerPass = await bcrypt.hash("farmer123", 10);
    const customerPass = await bcrypt.hash("customer123", 10);

    const [f1] = await db.query(
        "INSERT INTO farmers (name, email, phone, password, address) VALUES (?, ?, ?, ?, ?)",
        ["Ravi Kumar", "farmer@freshfarm.com", "9876543210", farmerPass, "Chengalpattu, Tamil Nadu"]
    );

    const [f2] = await db.query(
        "INSERT INTO farmers (name, email, phone, password, address) VALUES (?, ?, ?, ?, ?)",
        ["Lakshmi Devi", "green@freshfarm.com", "9876500011", farmerPass, "Hosur, Tamil Nadu"]
    );

    await db.query(
        "INSERT INTO customers (name, email, phone, password, address) VALUES (?, ?, ?, ?, ?)",
        ["Demo Customer", "customer@freshfarm.com", "9000000001", customerPass, "12 Anna Nagar, Chennai"]
    );

    const ravi = f1.insertId;
    const lakshmi = f2.insertId;

    // [farmer, name, category, price, stock, unit, description, image]
    const products = [
        [ravi, "Tomato", "Vegetables", 40, 50, "Kg", "Red, ripe tomatoes picked this morning.", img("photo-1546094096-0df4bcaaa337")],
        [lakshmi, "Brinjal", "Vegetables", 50, 30, "Kg", "Tender purple brinjal, good for sambar and curry.", null],
        [ravi, "Potato", "Vegetables", 35, 80, "Kg", "Firm potatoes, freshly dug.", img("photo-1518977676601-b53f82aba655")],
        [ravi, "Onion", "Vegetables", 45, 70, "Kg", "Red onions, sun dried for longer storage.", img("photo-1508747703725-719777637510")],
        [lakshmi, "Green Chilli", "Vegetables", 25, 20, "250 g", "Spicy green chillies.", img("photo-1588252303782-cb80119abd6d")],
        [lakshmi, "Cauliflower", "Vegetables", 55, 25, "Piece", "White, tight cauliflower heads.", img("photo-1568584711075-3d021a7c3ca3")],
        [ravi, "Cabbage", "Vegetables", 30, 40, "Kg", "Crisp green cabbage.", img("photo-1598030343246-eec71cb44208")],
        [lakshmi, "Carrot", "Vegetables", 60, 35, "Kg", "Sweet orange carrots from the hills.", img("photo-1445282768818-728615cc910a")],
        [ravi, "Beans", "Vegetables", 70, 20, "Kg", "Tender green beans.", img("photo-1567375698348-5d9d5ae99de0")],
        [lakshmi, "Banana", "Fruits", 50, 40, "Dozen", "Ripe bananas from our own trees.", img("photo-1571771894821-ce9b6c11b08e")],
        [ravi, "Mango", "Fruits", 100, 30, "Kg", "Seasonal sweet mangoes.", img("photo-1553279768-865429fa0078")],
        [lakshmi, "Apple", "Fruits", 150, 25, "Kg", "Crunchy red apples.", img("photo-1560806887-1e4cd0b6cbd6")]
    ];

    for (const p of products) {
        await db.query(
            `INSERT INTO products
             (farmer_id, product_name, category, price, quantity, unit, description, image_url)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            p
        );
    }

    console.log("Seed complete.");
    console.log("Farmer login:   farmer@freshfarm.com / farmer123");
    console.log("Customer login: customer@freshfarm.com / customer123");
    process.exit(0);
}

seed().catch((err) => {
    console.error("Seed failed:", err.message);
    process.exit(1);
});
