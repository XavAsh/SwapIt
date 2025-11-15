import { Router } from "express";
import { asyncHandler } from "../../shared/middleware/errorHandler";
import * as orderController from "../controllers/orderController";

const router = Router();

router.post("/", asyncHandler(orderController.createOrder));
router.get("/:id", asyncHandler(orderController.getOrder));
router.get("/user/:userId", asyncHandler(orderController.getUserOrders));
router.put("/:id/status", asyncHandler(orderController.updateOrderStatus));
router.post("/:id/payment", asyncHandler(orderController.processPayment));

export default router;
