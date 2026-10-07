const express = require("express");
const router = express.Router();

const { assignDelivery, getDeliveryForOrder } = require("../controllers/deliveryController");
const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");
const { asyncHandler } = require("../middleware/errorHandler");

router.use(authMiddleware);

router.post("/", requireRole("farmer"), asyncHandler(assignDelivery));
router.get("/order/:orderId", asyncHandler(getDeliveryForOrder));

module.exports = router;
