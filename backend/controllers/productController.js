const Product = require("../models/productModel");
const { clean } = require("../utils/validate");

const CATEGORIES = ["Vegetables", "Fruits", "Leafy Vegetables", "Grains", "Other"];

// Returns an error message, or null when the product is valid
const validateProduct = (p) => {
    if (!p.product_name || clean(p.product_name).length < 2) return "Please enter a product name";
    if (!CATEGORIES.includes(p.category)) return "Please choose a valid category";

    const price = Number(p.price);
    if (!Number.isFinite(price) || price <= 0) return "Price must be more than 0";

    const qty = Number(p.quantity);
    if (!Number.isInteger(qty) || qty < 0) return "Quantity must be a whole number (0 or more)";

    if (!p.unit || clean(p.unit).length > 20) return "Please choose a unit";

    if (p.image_url && !/^https?:\/\/\S+$/.test(p.image_url)) {
        return "Image link must start with http:// or https://";
    }
    return null;
};

const pickFields = (body) => ({
    product_name: clean(body.product_name),
    category: body.category,
    price: Number(body.price),
    quantity: Number(body.quantity),
    unit: clean(body.unit) || "Kg",
    description: clean(body.description) || null,
    image_url: clean(body.image_url) || null
});

const addProduct = async (req, res) => {
    const product = pickFields(req.body);

    const error = validateProduct(product);
    if (error) return res.status(400).json({ message: error });

    const productId = await Product.addProduct({ ...product, farmer_id: req.user.id });

    res.status(201).json({ message: "Product added successfully", productId });
};

// GET /api/products?search=tom&category=Vegetables
const getProducts = async (req, res) => {
    const products = await Product.getAllProducts({
        search: clean(req.query.search),
        category: clean(req.query.category)
    });
    res.json(products);
};

const getMyProducts = async (req, res) => {
    const products = await Product.getProductsByFarmer(req.user.id);
    res.json(products);
};

const getProduct = async (req, res) => {
    const product = await Product.getProductById(req.params.id);

    if (!product || !product.is_active) {
        return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
};

// Accepts partial updates: missing fields keep their current values
const updateProduct = async (req, res) => {
    const current = await Product.getProductById(req.params.id);

    if (!current || !current.is_active || current.farmer_id !== req.user.id) {
        return res.status(404).json({ message: "Product not found in your products" });
    }

    const merged = pickFields({ ...current, ...req.body });

    const error = validateProduct(merged);
    if (error) return res.status(400).json({ message: error });

    await Product.updateProduct(req.params.id, req.user.id, merged);

    res.json({ message: "Product updated successfully" });
};

const deleteProduct = async (req, res) => {
    const affected = await Product.deleteProduct(req.params.id, req.user.id);

    if (affected === 0) {
        return res.status(404).json({ message: "Product not found in your products" });
    }
    res.json({ message: "Product removed successfully" });
};

module.exports = {
    CATEGORIES,
    addProduct,
    getProducts,
    getMyProducts,
    getProduct,
    updateProduct,
    deleteProduct
};
