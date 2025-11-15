import { Router } from "express";
import { asyncHandler } from "../../shared/middleware/errorHandler";
import * as deliveryController from "../controllers/deliveryController";

const router = Router();

router.post("/", asyncHandler(deliveryController.createShipment));
router.put("/:id/status", asyncHandler(deliveryController.updateShipmentStatus));
router.get("/order/:orderId", asyncHandler(deliveryController.getShipmentByOrder));
router.get("/user/:userId", asyncHandler(deliveryController.getUserShipments));
router.get("/:id", asyncHandler(deliveryController.getShipment));

export default router;

