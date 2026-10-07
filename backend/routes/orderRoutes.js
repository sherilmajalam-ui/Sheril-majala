const express = require("express");
const router = express.Router();

const {
    createOrder,
    getCustomerOrders,
    getFarmerOrders,
    getOrder,
    updateOrderStatus,
    cancelOrder
} = require("../controllers/orderController");
const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");
const { asyncHandler } = require("../middleware/errorHandler");

router.use(authMiddleware);

router.post("/", requireRole("customer"), asyncHandler(createOrder));
router.get("/my-orders", requireRole("customer"), asyncHandler(getCustomerOrders));
router.get("/farmer-orders", requireRole("farmer"), asyncHandler(getFarmerOrders));
router.get("/:id", asyncHandler(getOrder));
router.put("/:id/status", requireRole("farmer"), asyncHandler(updateOrderStatus));
router.put("/:id/cancel", requireRole("customer"), asyncHandler(cancelOrder));

module.exports = router;
