import { Router } from "express";
import { asyncHandler } from "../../shared/middleware/errorHandler";
import * as reviewController from "../controllers/reviewController";

const router = Router();

router.post("/", asyncHandler(reviewController.createReview));
router.get("/user/:userId", asyncHandler(reviewController.getReviewsByUser));
router.get("/product/:productId", asyncHandler(reviewController.getReviewsByProduct));
router.get("/:id", asyncHandler(reviewController.getReview));

export default router;

