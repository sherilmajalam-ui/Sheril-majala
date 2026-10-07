const express = require("express");
const router = express.Router();

const { getMyPayments, getPaymentForOrder } = require("../controllers/paymentController");
const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");
const { asyncHandler } = require("../middleware/errorHandler");

router.use(authMiddleware);

router.get("/my-payments", requireRole("customer"), asyncHandler(getMyPayments));
router.get("/order/:orderId", asyncHandler(getPaymentForOrder));

module.exports = router;
