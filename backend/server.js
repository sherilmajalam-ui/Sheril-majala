require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");

const { errorHandler } = require("./middleware/errorHandler");

if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is missing. Copy .env.example to .env and fill it in.");
    process.exit(1);
}

const app = express();

app.use(cors());
app.use(express.json());

// API routes
app.use("/api/farmers", require("./routes/farmerRoutes"));
app.use("/api/customers", require("./routes/customerRoutes"));
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));
app.use("/api/deliveries", require("./routes/deliveryRoutes"));

app.get("/api", (req, res) => {
    res.json({ message: "Fresh Farm Backend is Running" });
});

// Unknown API route
app.use("/api", (req, res) => {
    res.status(404).json({ message: "API route not found" });
});

// Serve the built React site from ../frontend/dist, so http://localhost:5001 opens the home page.
// Every other path returns index.html so React Router can show the right page.
const SITE_DIR = path.join(__dirname, "..", "frontend", "dist");
app.use(express.static(SITE_DIR));
app.get("*", (req, res) => {
    res.sendFile(path.join(SITE_DIR, "index.html"), (err) => {
        if (err) res.status(404).send("Website not built yet. Run: npm run build (in the frontend folder).");
    });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
