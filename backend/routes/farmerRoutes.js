const express = require("express");
const router = express.Router();

const { registerFarmer, loginFarmer, getProfile } = require("../controllers/farmerController");
const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");
const { asyncHandler } = require("../middleware/errorHandler");

router.post("/register", asyncHandler(registerFarmer));
router.post("/login", asyncHandler(loginFarmer));
router.get("/me", authMiddleware, requireRole("farmer"), asyncHandler(getProfile));

module.exports = router;
