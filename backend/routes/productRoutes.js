const express = require("express");
const router = express.Router();

const {
    addProduct,
    getProducts,
    getMyProducts,
    getProduct,
    updateProduct,
    deleteProduct
} = require("../controllers/productController");
const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");
const { asyncHandler } = require("../middleware/errorHandler");

const farmerOnly = [authMiddleware, requireRole("farmer")];

// Public
router.get("/", asyncHandler(getProducts));

// Must stay above "/:id", otherwise "my-products" is read as an id
router.get("/my-products", farmerOnly, asyncHandler(getMyProducts));

router.get("/:id", asyncHandler(getProduct));

// Farmer only, and only their own products
router.post("/", farmerOnly, asyncHandler(addProduct));
router.put("/:id", farmerOnly, asyncHandler(updateProduct));
router.delete("/:id", farmerOnly, asyncHandler(deleteProduct));

module.exports = router;
