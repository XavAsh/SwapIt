import { Router } from "express";
import { asyncHandler } from "../../shared/middleware/errorHandler";
import * as adminController from "../controllers/adminController";

const router = Router();

router.post("/reports", asyncHandler(adminController.createReport));
router.get("/reports", asyncHandler(adminController.getReports));
router.put("/reports/:id/status", asyncHandler(adminController.updateReportStatus));
router.get("/statistics", asyncHandler(adminController.getStatistics));
router.put("/products/:productId/moderate", asyncHandler(adminController.moderateProduct));

export default router;

