const express = require("express");
const router = express.Router();

const { registerCustomer, loginCustomer, getProfile } = require("../controllers/customerController");
const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");
const { asyncHandler } = require("../middleware/errorHandler");

router.post("/register", asyncHandler(registerCustomer));
router.post("/login", asyncHandler(loginCustomer));
router.get("/me", authMiddleware, requireRole("customer"), asyncHandler(getProfile));

module.exports = router;
